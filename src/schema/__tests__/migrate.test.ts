/**
 * Migrations: an older draft or an exported file must still open.
 *
 * The Twotter rules here are the ones that matter today. r31 REMOVED the
 * feature — the game stored a quest-declared account with an undefined `bio`
 * and Twotter's search called `.toLowerCase()` on it, so any search that did
 * not match something sooner crashed the game (QA rounds 5–7) — and the
 * migration of that round deleted every tweet node to keep old drafts opening.
 *
 * r185 brought the feature back on the API path the r179 probe proved safe, so
 * that deletion is now the wrong answer: somebody's r30 draft must open with
 * its tweets INTACT, rewritten into the new shape. `dropTwotter` became
 * `mapTwotter`, and these tests pin what it maps to.
 */
import { describe, expect, it } from "vitest";
import { migrateProject } from "@/schema/migrate";
import { ProjectSchema, createProject } from "@/schema/project";
import { parseProjectFile, serializeProject } from "@/templates/share";

/**
 * A project the way r30 and earlier wrote it: a quest-level account list, a
 * tweet node carrying the old `TweetDefinition` fields (`username` on the
 * account, `content` / `postedAgo` / `postLive` on the node), and wires.
 */
function oldProjectJson() {
    const base = JSON.parse(JSON.stringify(createProject())) as Record<string, unknown>;
    const quest = (base.quests as Record<string, unknown>[])[0];
    quest.twotterAccounts = [
        { id: "acc1", username: "qatest", displayName: "QA Test", verified: false, bio: "hi" },
    ];
    quest.graph = {
        nodes: [
            { id: "n1", type: "entry.start", position: { x: 0, y: 0 }, data: {} },
            { id: "n2", type: "comms.tweet", position: { x: 300, y: 0 }, data: { accountId: "acc1", content: "Hello World!" } },
            { id: "n3", type: "fx.notify", position: { x: 600, y: 0 }, data: { message: "still here", variant: "notify" } },
        ],
        edges: [
            { id: "e1", source: "n1", sourceHandle: "out", target: "n2", targetHandle: "in", kind: "flow" },
            { id: "e2", source: "n1", sourceHandle: "out", target: "n3", targetHandle: "in", kind: "flow" },
        ],
    };
    return base;
}

/** The one tweet node the fixtures migrate, as the r185 shape. */
function tweetNode(raw: Record<string, unknown>) {
    const migrated = migrateProject(raw) as {
        quests: { graph: { nodes: { type: string; data: Record<string, unknown> }[] } }[];
    };
    const node = migrated.quests[0].graph.nodes.find((n) => n.type === "comms.tweet");
    expect(node, "the tweet node survived the migration").toBeDefined();
    const tweets = node!.data.tweets as Record<string, unknown>[];
    expect(tweets).toHaveLength(1);
    return { data: node!.data, row: tweets[0]! };
}

/** The old project, with the tweet node's data replaced. */
function oldProjectWithTweet(data: Record<string, unknown>) {
    const base = oldProjectJson();
    ((base.quests as Record<string, unknown>[])[0].graph as { nodes: Record<string, unknown>[] }).nodes[1] = {
        id: "n2",
        type: "comms.tweet",
        position: { x: 300, y: 0 },
        data,
    };
    return base;
}

describe("projects made before Twotter was removed (r30 drafts)", () => {
    it("keeps the tweet node and its wires, and turns it into a row", () => {
        const migrated = migrateProject(oldProjectJson()) as Record<string, unknown>;
        const quest = (migrated.quests as Record<string, unknown>[])[0];
        const graph = quest.graph as { nodes: { id: string }[]; edges: { id: string }[] };

        // r31 deleted the node and its wire. r185 must not: those tweets are
        // somebody's writing.
        expect(graph.nodes.map((n) => n.id)).toEqual(["n1", "n2", "n3"]);
        expect(graph.edges.map((e) => e.id)).toEqual(["e1", "e2"]);

        const node = (graph.nodes as { id: string; data: Record<string, unknown> }[])[1]!;
        expect(node.data.accountId).toBe("acc1");
        const row = (node.data.tweets as Record<string, unknown>[])[0]!;
        expect(row.content).toBe("Hello World!");
        expect(row.timeMode).toBe("earlier");
        expect(row.agoAmount).toBe(1);
        expect(row.agoUnit).toBe("months");
        // No time was written by that round at all, so the age is a stand-in
        // and the node says so rather than pretending the migration was exact.
        expect(node.data.migratedDate).toBe(true);
    });

    it("lifts the quest's accounts to the mod level, keeping every field", () => {
        const migrated = migrateProject(oldProjectJson()) as Record<string, unknown>;
        const accounts = migrated.twotterAccounts as Record<string, unknown>[];
        expect(accounts).toHaveLength(1);
        expect(accounts[0]).toMatchObject({
            id: "acc1",
            handle: "qatest", // the old field was `username`
            displayName: "QA Test",
            bio: "hi",
            verified: false,
            removeWhenQuestEnds: true,
        });
        const quest = (migrated.quests as Record<string, unknown>[])[0];
        expect("twotterAccounts" in quest).toBe(false);
    });

    it("gives a missing bio an empty string, never undefined", () => {
        // The r31 crash in one assertion: a record whose bio is not a string is
        // what made the game's Twotter search throw.
        const base = oldProjectJson();
        const quest = (base.quests as Record<string, unknown>[])[0];
        (quest.twotterAccounts as Record<string, unknown>[])[0]!.bio = undefined;
        const migrated = migrateProject(base) as Record<string, unknown>;
        const account = (migrated.twotterAccounts as Record<string, unknown>[])[0]!;
        expect(account.bio).toBe("");
        expect(typeof account.bio).toBe("string");
    });

    it("keeps a readable age exactly as it was written", () => {
        const { row, data } = tweetNode(oldProjectWithTweet({ accountId: "acc1", content: "two days old", postedAgo: "2 days" }));
        expect(row).toMatchObject({ timeMode: "earlier", agoAmount: 2, agoUnit: "days" });
        expect("migratedDate" in data).toBe(false);
    });

    it("reads the age whatever else the old node also carried", () => {
        // The r30 shape had `postedAgo` and no `timeMode`; an intermediate
        // draft might have both. The age is the field that means something.
        const { row } = tweetNode(oldProjectWithTweet({ accountId: "acc1", content: "x", timeMode: "relative", postedAgo: "3 hours" }));
        expect(row).toMatchObject({ timeMode: "earlier", agoAmount: 3, agoUnit: "hours" });
    });

    it("lands a fixed calendar date on an age of a month, and flags it", () => {
        const { row, data } = tweetNode(oldProjectWithTweet({ accountId: "acc1", content: "x", timeMode: "absolute", postedAt: "2026-01-04T12:00:00Z" }));
        expect(row).toMatchObject({ timeMode: "earlier", agoAmount: 1, agoUnit: "months" });
        expect(data.migratedDate).toBe(true);
    });

    it("lands an age it cannot read on the same month, and flags it", () => {
        const { row, data } = tweetNode(oldProjectWithTweet({ accountId: "acc1", content: "x", postedAgo: "3h" }));
        expect(row).toMatchObject({ timeMode: "earlier", agoAmount: 1, agoUnit: "months" });
        expect(data.migratedDate).toBe(true);
    });

    it("keeps a live tweet posting when the story arrives", () => {
        const { row, data } = tweetNode(oldProjectWithTweet({ accountId: "acc1", content: "x", postLive: true }));
        expect(row.timeMode).toBe("arrival");
        expect("migratedDate" in data).toBe(false);
    });

    it("keeps the counts and the picture the node carried", () => {
        const { row } = tweetNode(
            oldProjectWithTweet({
                accountId: "acc1",
                content: "x",
                image: "data:image/png;base64,AAAA",
                likes: 12,
                comments: 3,
                shares: 1,
                views: 400,
                showInTimeline: true,
            }),
        );
        expect(row).toMatchObject({ likes: 12, comments: 3, shares: 1, views: 400, showInTimeline: true });
        expect(row.image).toBe("data:image/png;base64,AAAA");
    });

    it("folds two quests that declared the same handle onto one account", () => {
        // The old shape made people declare the same character once per quest.
        // Accounts live at the mod level now, so the second declaration must
        // not become a second account — and the nodes that used it must end up
        // on the one that is kept.
        const base = oldProjectJson();
        const quests = base.quests as Record<string, unknown>[];
        const second = JSON.parse(JSON.stringify(quests[0])) as Record<string, unknown>;
        second.id = "second-quest";
        second.title = "Second Quest";
        // Same handle, different case — Twotter search does not care about
        // case, so the fold must not either.
        second.twotterAccounts = [
            { id: "acc2", username: "QATEST", displayName: "QA Test again", bio: "" },
        ];
        second.graph = {
            nodes: [
                { id: "m1", type: "entry.start", position: { x: 0, y: 0 }, data: {} },
                { id: "m2", type: "comms.tweet", position: { x: 300, y: 0 }, data: { accountId: "acc2", content: "second" } },
            ],
            edges: [],
        };
        quests.push(second);

        const migrated = migrateProject(base) as Record<string, unknown>;
        const accounts = migrated.twotterAccounts as Record<string, unknown>[];
        expect(accounts.map((a) => a.handle)).toEqual(["qatest"]);

        const kept = migrated.quests as Record<string, unknown>[];
        const secondNodes = ((kept[1]!.graph as { nodes: Record<string, unknown>[] }).nodes);
        expect((secondNodes[1]!.data as Record<string, unknown>).accountId).toBe("acc1");
    });

    it("validates afterwards — the whole point of migrating", () => {
        const result = ProjectSchema.safeParse(migrateProject(oldProjectJson()));
        expect(result.success, JSON.stringify(result.success ? null : result.error.issues)).toBe(true);
    });

    it("opens as a file instead of being called “not a quest project”", () => {
        const text = JSON.stringify(oldProjectJson());
        const parsed = parseProjectFile(text);
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) return;
        expect(parsed.project.quests[0].graph.nodes.map((n) => n.type)).toEqual([
            "entry.start",
            "comms.tweet",
            "fx.notify",
        ]);
        expect(parsed.project.twotterAccounts).toHaveLength(1);
    });

    it("opens an r30 draft with a relative age as a file, fully validated", () => {
        const parsed = parseProjectFile(JSON.stringify(oldProjectWithTweet({ accountId: "acc1", content: "x", postedAgo: "2 weeks" })));
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) return;
        const node = parsed.project.quests[0].graph.nodes.find((n) => n.type === "comms.tweet");
        expect(node?.data).toMatchObject({ accountId: "acc1" });
        if (node?.type === "comms.tweet") {
            expect(node.data.tweets[0]).toMatchObject({ timeMode: "earlier", agoAmount: 2, agoUnit: "weeks" });
        }
    });

    it("leaves a project with nothing Twotter in it exactly as it was", () => {
        const clean = JSON.parse(serializeProject(createProject()));
        expect(migrateProject(clean)).toEqual(clean);
    });
});

describe("older node shapes still migrate", () => {
    it("folds the four separate comms nodes into one dialogue node", () => {
        const raw = {
            quests: [
                {
                    graph: {
                        nodes: [
                            { id: "a", type: "comms.mail", data: { subject: "hi" } },
                            { id: "b", type: "comms.weechat", data: { host: "irc.x" } },
                        ],
                        edges: [],
                    },
                },
            ],
        };
        const out = migrateProject(raw) as { quests: { graph: { nodes: { type: string; data: { kind: string } }[] } }[] };
        expect(out.quests[0].graph.nodes.map((n) => n.type)).toEqual(["comms.dialogue", "comms.dialogue"]);
        expect(out.quests[0].graph.nodes.map((n) => n.data.kind)).toEqual(["mail", "weechat"]);
    });

    it("turns a delay's old milliseconds into seconds", () => {
        const raw = { quests: [{ graph: { nodes: [{ id: "d", type: "flow.delay", data: { ms: 2500 } }], edges: [] } }] };
        const out = migrateProject(raw) as { quests: { graph: { nodes: { data: { seconds: number } }[] } }[] };
        expect(out.quests[0].graph.nodes[0].data.seconds).toBe(2.5);
    });

    it("does not choke on something that is not a project at all", () => {
        expect(migrateProject(null)).toBeNull();
        expect(migrateProject("nope")).toBe("nope");
        expect(migrateProject({ quests: "not an array" })).toEqual({ quests: "not an array" });
    });
});

/**
 * The r172 "Schedule beat" node was renamed **Timer** in r173, and the type id
 * moved `flow.schedule` → `flow.timer`. A project written in that window — a
 * draft in localStorage, or a `.quest-editor.json` an author kept — still names
 * the old id, and without a migration the whole document fails validation and
 * is discarded. This is the shape r172 wrote: no `mode` (that field is r173's).
 */
function r172ProjectJson() {
    const base = JSON.parse(JSON.stringify(createProject())) as Record<string, unknown>;
    const quest = (base.quests as Record<string, unknown>[])[0];
    quest.graph = {
        nodes: [
            {
                id: "t1",
                type: "flow.schedule",
                position: { x: 0, y: 0 },
                data: { days: 1, hours: 2, minutes: 30 },
            },
        ],
        edges: [],
    };
    return base;
}

describe("projects made before the Timer rename (r173)", () => {
    it("carries the old type id over to flow.timer, keeping the delay", () => {
        const migrated = migrateProject(r172ProjectJson()) as {
            quests: { graph: { nodes: { type: string; data: Record<string, unknown> }[] } }[];
        };
        const node = migrated.quests[0].graph.nodes[0];
        expect(node.type).toBe("flow.timer");
        expect(node.data).toMatchObject({ days: 1, hours: 2, minutes: 30 });
    });

    it("validates afterwards, so an r172 draft is not thrown away", () => {
        const result = ProjectSchema.safeParse(migrateProject(r172ProjectJson()));
        expect(result.success, JSON.stringify(result.success ? null : result.error.issues)).toBe(true);
    });

    it("opens as a file instead of being called “not a quest project”", () => {
        const parsed = parseProjectFile(JSON.stringify(r172ProjectJson()));
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) return;
        const node = parsed.project.quests[0].graph.nodes[0];
        expect(node.type).toBe("flow.timer");
        // The r173 fields default in, so the node fires like the old one did.
        expect(node.data).toMatchObject({ mode: "after", days: 1, hours: 2, minutes: 30 });
    });

    it("leaves a project that never used the old id untouched", () => {
        const clean = JSON.parse(serializeProject(createProject()));
        expect(migrateProject(clean)).toEqual(clean);
    });
});

/**
 * r176 briefly modelled the coming-day offset as an amount plus a unit, before
 * r177 gave every unit its own box. A draft — or an exported file — saved in
 * that window still names them, and must keep meaning exactly what it meant.
 */
function r176ProjectJson(data: Record<string, unknown> = { mode: "daytime", offsetAmount: 2, offsetUnit: "weeks", hour: 12, minute: 0 }) {
    const base = JSON.parse(JSON.stringify(createProject())) as Record<string, unknown>;
    const quest = (base.quests as Record<string, unknown>[])[0];
    quest.graph = {
        nodes: [{ id: "t1", type: "flow.timer", position: { x: 0, y: 0 }, data }],
        edges: [],
    };
    return base;
}

describe("projects made with r176's amount + unit offset", () => {
    const boxesOf = (data: Record<string, unknown>) => {
        const migrated = migrateProject(r176ProjectJson(data)) as {
            quests: { graph: { nodes: { data: Record<string, unknown> }[] } }[];
        };
        return migrated.quests[0].graph.nodes[0].data;
    };

    it("moves the amount into the box for its unit", () => {
        /* The migration moves the number; the boxes it did not touch take
           their schema defaults when the project is validated, not here. */
        expect(boxesOf({ mode: "daytime", offsetAmount: 2, offsetUnit: "weeks", hour: 12, minute: 0 })).toEqual({
            mode: "daytime",
            hour: 12,
            minute: 0,
            offsetWeeks: 2,
        });
        expect(boxesOf({ mode: "daytime", offsetAmount: 1, offsetUnit: "months" })).toMatchObject({ offsetMonths: 1 });
        expect(boxesOf({ mode: "daytime", offsetAmount: 4, offsetUnit: "days" })).toMatchObject({ offsetDays: 4 });
        expect(boxesOf({ mode: "daytime", offsetAmount: 1, offsetUnit: "years" })).toMatchObject({ offsetYears: 1 });
    });

    it("drops the two old keys rather than leaving them behind", () => {
        const data = boxesOf({ mode: "daytime", offsetAmount: 2, offsetUnit: "weeks" });
        expect("offsetAmount" in data).toBe(false);
        expect("offsetUnit" in data).toBe(false);
    });

    it("validates afterwards, so an old draft is not thrown away", () => {
        const result = ProjectSchema.safeParse(migrateProject(r176ProjectJson()));
        expect(result.success, JSON.stringify(result.success ? null : result.error.issues)).toBe(true);
    });

    it("opens as a file instead of being called “not a quest project”", () => {
        const parsed = parseProjectFile(JSON.stringify(r176ProjectJson()));
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) return;
        const data = parsed.project.quests[0].graph.nodes[0].data as Record<string, unknown>;
        expect(data).toMatchObject({ offsetWeeks: 2, offsetDays: 0, offsetYears: 0 });
        expect("offsetAmount" in data).toBe(false);
        expect("offsetUnit" in data).toBe(false);
    });

    it("leaves a project that never used the old pair untouched", () => {
        const clean = JSON.parse(serializeProject(createProject()));
        expect(migrateProject(clean)).toEqual(clean);
    });
});

/**
 * The key r172 wrote — `offsetDays` — kept its name through both r176's rename
 * and r177's per-unit boxes, so a draft from that window is **already** in the
 * current shape: nothing to rewrite, it just has to validate (r177).
 */
describe("projects made before the r176 rename (the old offsetDays key)", () => {
    function r172TimerJson() {
        const base = JSON.parse(JSON.stringify(createProject())) as Record<string, unknown>;
        const quest = (base.quests as Record<string, unknown>[])[0];
        quest.graph = {
            nodes: [
                {
                    id: "t1",
                    type: "flow.timer",
                    position: { x: 0, y: 0 },
                    data: { mode: "daytime", offsetDays: 3, hour: 12, minute: 0 },
                },
            ],
            edges: [],
        };
        return base;
    }

    it("needs no rewrite at all: the key means the same thing today", () => {
        const clean = r172TimerJson();
        expect(migrateProject(clean)).toEqual(clean);
    });

    it("still validates and opens as a file", () => {
        const parsed = parseProjectFile(JSON.stringify(r172TimerJson()));
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) return;
        const node = parsed.project.quests[0].graph.nodes[0];
        expect(node.data).toMatchObject({ mode: "daytime", offsetDays: 3, hour: 12, minute: 0 });
    });
});
