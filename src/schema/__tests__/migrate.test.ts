/**
 * Migrations: an older draft or an exported file must still open.
 *
 * The Twotter rules here are the ones that matter today. Support was removed in
 * round 31 — the game stores a quest-declared account with an undefined `bio`
 * and Twotter's search calls `.toLowerCase()` on it, so any search that does
 * not match something sooner crashes the game, before *and* after the mod is
 * uninstalled, with no way for a mod to repair the record (QA rounds 5–7).
 * Projects made while the feature existed must not be lost because of it.
 */
import { describe, expect, it } from "vitest";
import { migrateProject } from "@/schema/migrate";
import { ProjectSchema, createProject } from "@/schema/project";
import { parseProjectFile, serializeProject } from "@/templates/share";

/** A project the way r30 and earlier wrote it: accounts, a tweet, wires. */
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

describe("projects made before Twotter was removed", () => {
    it("drops the tweet node and the wire that fed it, keeping the rest", () => {
        const migrated = migrateProject(oldProjectJson()) as Record<string, unknown>;
        const quest = (migrated.quests as Record<string, unknown>[])[0];
        const graph = quest.graph as { nodes: { id: string }[]; edges: { id: string }[] };

        expect(graph.nodes.map((n) => n.id)).toEqual(["n1", "n3"]);
        expect(graph.edges.map((e) => e.id)).toEqual(["e2"]); // no wire left dangling
        expect("twotterAccounts" in quest).toBe(false);
    });

    it("validates afterwards — the whole point of migrating", () => {
        const result = ProjectSchema.safeParse(migrateProject(oldProjectJson()));
        expect(result.success).toBe(true);
    });

    it("opens as a file instead of being called “not a quest project”", () => {
        const text = JSON.stringify(oldProjectJson());
        const parsed = parseProjectFile(text);
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) return;
        expect(parsed.project.quests[0].graph.nodes.map((n) => n.type)).toEqual([
            "entry.start",
            "fx.notify",
        ]);
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
 * The relative Timer (r176) replaced `offsetDays` with an amount plus a unit.
 * The old single field was honest only while every offset was in days; a draft
 * — or an exported file — saved before the rename still names it, and must
 * keep meaning exactly what it meant.
 */
function r176ProjectJson() {
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

describe("projects made before the Timer's relative units (r176)", () => {
    it("splits the old offset into an amount and a unit of days", () => {
        const migrated = migrateProject(r176ProjectJson()) as {
            quests: { graph: { nodes: { data: Record<string, unknown> }[] } }[];
        };
        const data = migrated.quests[0].graph.nodes[0].data;
        expect(data).toMatchObject({ mode: "daytime", offsetAmount: 3, offsetUnit: "days", hour: 12, minute: 0 });
        expect("offsetDays" in data).toBe(false);
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
        expect(data).toMatchObject({ offsetAmount: 3, offsetUnit: "days" });
    });

    it("leaves a project that never used offsetDays untouched", () => {
        const clean = JSON.parse(serializeProject(createProject()));
        expect(migrateProject(clean)).toEqual(clean);
    });
});
