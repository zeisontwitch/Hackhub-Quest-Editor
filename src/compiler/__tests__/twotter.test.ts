/**
 * Twotter (r185): the fences around the one feature that was removed once.
 *
 * r31 took Twotter out because a quest-declared account was written to the
 * player's save with `bio: undefined`, and the game's Twotter search called
 * `.toLowerCase()` on it — a crash before *and* after the mod was uninstalled,
 * which no mod could repair (QA rounds 5–7). r179 probed the SDK again and
 * r185 put the feature back on the API path: accounts are created with
 * `createUser` (which fills a complete record), tweets with `postTweet`, and
 * both are cleaned up on the way out.
 *
 * These tests hold the five lines the plan promised, and they hold them
 * BEHAVIOURALLY — the real compiled dist/mod.js runs against a recording stub
 * SDK, so what is asserted is what the game would be handed:
 *
 *  1. the compiled quest definition carries no declarative `TwotterAccounts` /
 *     `Tweets` field (compile.test.ts checks the same thing on the emitted
 *     project; this file checks it end to end);
 *  2. a blank bio is sent as `""` — never undefined, never omitted;
 *  3. an account this mod created is removed when the last quest that needs it
 *     ends, and one it merely ADOPTED is left alone;
 *  4. tweet ids are deterministic: `qe-<quest>-<node>-<row>`;
 *  5. nothing registers an objective or a trigger on `Twotter.AccountCreated`.
 *
 * Technique: compile → evaluate the real mod.js against the stub → drive the
 * quest's own lifecycle, the way the engine would (same approach as
 * scheduleBeat.test.ts).
 */
import { describe, expect, it, vi } from "vitest";
import { compileProject } from "@/compiler/compile";
import { nodeTypeDef } from "@/schema/registry";
import { createProject, createTwotterAccount, type ProjectDocument, type TwotterAccountDoc } from "@/schema/project";
import type { TweetRow } from "@/schema/nodes";
import type { NodeDoc } from "@/schema/nodes";
import type { EdgeDoc } from "@/schema/edges";

let seq = 0;
const nid = () => `n${++seq}`;

function node(type: Parameters<typeof nodeTypeDef>[0], patch: Record<string, unknown> = {}): NodeDoc {
    const data = { ...(nodeTypeDef(type).create() as object), ...patch };
    return { id: nid(), type, position: { x: 0, y: 0 }, data } as NodeDoc;
}

const edge = (source: string, target: string, sourceHandle = "out", targetHandle = "in"): EdgeDoc => ({
    id: `e${source}-${target}-${sourceHandle}`,
    source,
    sourceHandle,
    target,
    targetHandle,
    kind: "flow",
});

/** A fixed "now" for the stub in-game clock: 2026-09-17 10:00 local. */
const NOW = new Date(2026, 8, 17, 10, 0, 0).getTime();

function row(patch: Partial<TweetRow> = {}): TweetRow {
    return (nodeTypeDef("comms.tweet").create() as { tweets: TweetRow[] }).tweets[0]! && {
        ...((nodeTypeDef("comms.tweet").create() as { tweets: TweetRow[] }).tweets[0]!),
        ...patch,
    };
}

interface StubUser extends Record<string, unknown> {
    id: string;
    username: string;
}

/** A recording Twotter stub: every call the runtime makes is kept, in order. */
function twotterSdk(calls: string[], opts: { now?: number; seed?: StubUser[]; api?: boolean } = {}) {
    const now = opts.now ?? NOW;
    const users = new Map<string, StubUser>();
    const tweets = new Map<string, Record<string, unknown>>();
    for (const u of opts.seed ?? []) users.set(u.id, u);
    const registered = { quests: [] as unknown[], mods: [] as unknown[] };

    class Quest {
        Data: Record<string, unknown> = {};
        Events = { on: () => {}, off: () => {}, offAll: () => {} };
        sendMail() {}
        completeObjective() {}
        complete() {
            calls.push("questComplete");
        }
        retire() {}
        SetData(k: string, v: unknown) {
            this.Data[k] = v;
        }
        createDialog() {}
    }

    const Twotter = {
        createUser: (o: Record<string, unknown>) => {
            calls.push(`createUser:${String(o.username)}:bio=${typeof o.bio}:${JSON.stringify(o.bio)}`);
            return { ...o };
        },
        addUser: (u: StubUser) => {
            calls.push(`addUser:${u.id}`);
            users.set(u.id, u);
        },
        getUserByUsername: (username: string) => {
            const found = [...users.values()].find((u) => String(u.username).toLowerCase() === String(username).toLowerCase());
            calls.push(`getUserByUsername:${username}:${found ? found.id : "none"}`);
            return found ?? null;
        },
        getUserById: (id: string) => users.get(id) ?? null,
        updateUser: (id: string, patch: Record<string, unknown>) => {
            calls.push(`updateUser:${id}:bio=${typeof patch.bio}`);
            const user = users.get(id);
            if (user) users.set(id, { ...user, ...patch });
            return !!user;
        },
        removeUser: (id: string) => {
            const had = users.has(id);
            calls.push(`removeUser:${id}:${had}`);
            users.delete(id);
            return had;
        },
        postTweet: (t: Record<string, unknown>) => {
            calls.push(`postTweet:${String(t.id)}:${String(t.userId)}:${t.sendedAt ? String(t.sendedAt) : "no-time"}`);
            tweets.set(String(t.id), t);
        },
        removeTweet: (id: string) => {
            calls.push(`removeTweet:${id}`);
            tweets.delete(id);
        },
    };

    /* Typed, not a bare `Record<string, unknown>`: the assertions read the
       recorded maps back, and an index signature would make every one of them
       `unknown` (which is what typecheck said). The index signature is kept on
       top so `sdk.Twotter` can still be deleted for the no-API case. */
    const sdk: Record<string, unknown> & {
        __users: Map<string, StubUser>;
        __tweets: Map<string, Record<string, unknown>>;
        __registered: { quests: unknown[]; mods: unknown[] };
    } = {
        Quest,
        Website: class {},
        Command: class {},
        Bootstrap: class {},
        RegisterQuest: (c: unknown) => registered.quests.push(c),
        RegisterWebsite: () => {},
        RegisterCommand: () => {},
        RegisterModPackage: (m: unknown) => registered.mods.push(m),
        SaveStorage: { get: () => undefined, set: () => {}, remove: () => {}, clear: () => {}, getAll: () => ({}) },
        Network: { randomIp: () => "10.0.0.1" },
        Events: {
            emit: () => {},
            on: (name: string) => calls.push(`events.on:${name}`),
        },
        UI: { notify: (m: string) => calls.push(`notify:${m}`), toast: () => {}, prompt: () => Promise.resolve("") },
        Bank: {},
        Shell: {},
        Time: {
            now: () => now,
            scale: () => 60,
            isRunning: () => true,
            toRealMs: (gameMs: number) => gameMs / 60,
            toGameMs: (realMs: number) => realMs * 60,
            date: () => new Date(now),
            duration: () => 0,
        },
        Scheduler: {
            register: () => {},
            schedule: () => "job",
            scheduleAt: () => "job",
            cancel: () => {},
            cancelKind: () => {},
            list: () => [],
            remaining: () => null,
        },
        __users: users,
        __tweets: tweets,
        __registered: registered,
    };
    /* `api: false` is a game build whose Twotter API is missing — the mod has to
       keep running anyway (fail open). */
    if (opts.api !== false) sdk.Twotter = Twotter;
    return sdk;
}

type TwotterStub = ReturnType<typeof twotterSdk>;

function runMod(modJs: string, sdk: unknown) {
    const mod: { exports: unknown } = { exports: {} };
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function("require", "module", "exports", modJs)((name: string) => {
        if (name === "@hotbunny/hackhub-content-sdk") return sdk;
        throw new Error(`unexpected require: ${name}`);
    }, mod, mod.exports);
}

interface QuestInstance {
    OnStart: () => unknown;
    OnObjectivesStart: () => unknown;
    OnComplete: () => unknown;
    OnAbandon: () => unknown;
}

function boot(project: ProjectDocument, sdk: TwotterStub) {
    const { files } = compileProject(project);
    const modJs = files.find((f) => f.path === "dist/mod.js")!.content;
    runMod(modJs, sdk);
    const classes = (sdk.__registered as { quests: (new () => QuestInstance)[]; mods: (new () => { OnModPackageUnloaded: () => void })[] });
    return {
        modJs,
        quest: (i = 0) => new classes.quests[i]!(),
        mod: () => new classes.mods[0]!(),
    };
}

/** One quest: start → a Twotter node → done. */
function tweetProject(opts: {
    rows?: Partial<TweetRow>[];
    account?: Partial<TwotterAccountDoc>;
    accountId?: string;
    name?: string;
} = {}): ProjectDocument {
    const project = createProject();
    const quest = project.quests[0];
    quest.name = opts.name ?? "twotterquest";
    quest.title = "Twotter Quest";
    quest.autoStart = true;

    const account = createTwotterAccount({ handle: "nightowl", displayName: "Dana Whitlock", ...opts.account });
    project.twotterAccounts = [account];

    const entry = node("entry.start");
    const tweet = node("comms.tweet", {
        accountId: opts.accountId ?? account.id,
        tweets: (opts.rows ?? [{ content: "posted on arrival" }]).map((r) => row(r)),
    });
    quest.graph.nodes = [entry, tweet];
    quest.graph.edges = [edge(entry.id, tweet.id)];
    return project;
}

describe("comms.tweet (Twotter) — the fences", () => {
    it("creates the account through the API, with a blank bio sent as an empty string", () => {
        const calls: string[] = [];
        const sdk = twotterSdk(calls);
        const project = tweetProject({ account: { bio: "" } });
        // The author never touched the bio, so the compiled project has no
        // `bio` key at all (JSON drops undefined). Reading it back and posting
        // it unchanged is exactly the r31 record — `bio: undefined` — that made
        // the game's Twotter search throw.
        delete (project.twotterAccounts[0] as unknown as Record<string, unknown>).bio;
        const { quest } = boot(project, sdk);
        quest().OnStart();

        expect(calls).toContain('createUser:nightowl:bio=string:""');
        expect(calls.some((c) => c.includes("bio=undefined"))).toBe(false);
        // A complete record, not a hand-built one: createUser fills the
        // platform fields the editor cannot express, addUser stores it.
        expect(calls.some((c) => c.startsWith("addUser:"))).toBe(true);
        expect(sdk.__users.size).toBe(1);
        expect(typeof sdk.__users.get(project.twotterAccounts[0]!.id)!.bio).toBe("string");
    });

    it("never emits the declarative Twotter fields the engine fills incompletely", () => {
        const calls: string[] = [];
        const { modJs } = boot(tweetProject(), twotterSdk(calls));
        const projectLine = modJs.split("\n").find((line) => line.startsWith("var PROJECT = "))!;
        const compiled = JSON.parse(projectLine.replace("var PROJECT = ", "").replace(/;$/, "")) as Record<string, unknown>;
        expect("TwotterAccounts" in compiled).toBe(false);
        expect("Tweets" in compiled).toBe(false);
        expect(JSON.stringify(compiled)).not.toContain("TwotterAccounts");
        // The accounts ARE in the compiled project — as our own data, under our
        // own key, for the runtime to register through the API.
        expect(Array.isArray(compiled.twotterAccounts)).toBe(true);
    });

    it("posts every row, oldest first, with deterministic ids qe-<quest>-<node>-<row>", () => {
        const calls: string[] = [];
        const sdk = twotterSdk(calls);
        const project = tweetProject({
            rows: [
                { content: "two days ago", timeMode: "earlier", agoAmount: 2, agoUnit: "days" },
                { content: "one hour ago", timeMode: "earlier", agoAmount: 1, agoUnit: "hours" },
                { content: "arrives now", timeMode: "arrival" },
            ],
        });
        const questId = project.quests[0].id;
        const tweetNodeId = project.quests[0].graph.nodes[1]!.id;
        boot(project, sdk).quest().OnStart();

        const posted = calls.filter((c) => c.startsWith("postTweet:"));
        expect(posted).toHaveLength(3);
        expect(posted.map((c) => c.split(":")[1])).toEqual([
            `qe-${questId}-${tweetNodeId}-0`,
            `qe-${questId}-${tweetNodeId}-1`,
            `qe-${questId}-${tweetNodeId}-2`,
        ]);
        // The age is turned into a real timestamp, computed from the in-game
        // clock — P-01a: the engine keeps the ISO-with-milliseconds spelling.
        const twoDaysAgo = new Date(NOW - 2 * 24 * 60 * 60_000).toISOString();
        const oneHourAgo = new Date(NOW - 60 * 60_000).toISOString();
        expect(posted[0]!).toContain(twoDaysAgo);
        expect(posted[1]!).toContain(oneHourAgo);
        // An arriving tweet carries no time at all: the game stamps it.
        expect(posted[2]!).toContain(":no-time");
    });

    it("posts a node only once per playthrough, however often the flow re-runs", () => {
        const calls: string[] = [];
        const sdk = twotterSdk(calls);
        const { quest } = boot(tweetProject(), sdk);
        const q = quest();
        q.OnStart();
        // OnObjectivesStart runs the entry.load flow after every reload; a node
        // that posted again would stack duplicates on a profile the player is
        // still reading.
        q.OnObjectivesStart();
        q.OnStart();
        expect(calls.filter((c) => c.startsWith("postTweet:"))).toHaveLength(1);
    });

    it("passes the picture and the counts through, and leaves the picture off when there is none", () => {
        const calls: string[] = [];
        const sdk = twotterSdk(calls);
        boot(
            tweetProject({
                rows: [
                    { content: "with a picture", image: "data:image/png;base64,AAAA", likes: 12, comments: 3, shares: 1, views: 400, showInTimeline: true },
                    { content: "no picture", likes: 1 },
                ],
            }),
            sdk,
        ).quest().OnStart();

        const tweets = [...sdk.__tweets.values()] as Record<string, unknown>[];
        const withPicture = tweets.find((t) => String(t.content).includes("with a picture"))!;
        expect(withPicture.image).toBe("data:image/png;base64,AAAA");
        expect(withPicture.interaction).toEqual({ comments: 3, share: 1, likes: 12, views: 400 });
        expect(withPicture.showInTimeline).toBe(true);
        const without = tweets.find((t) => String(t.content).includes("no picture"))!;
        expect("image" in without).toBe(false);
    });

    it("removes the quest's tweets and the account it created when the quest ends", () => {
        const calls: string[] = [];
        const sdk = twotterSdk(calls);
        const project = tweetProject();
        const questId = project.quests[0].id;
        const tweetNodeId = project.quests[0].graph.nodes[1]!.id;
        const account = project.twotterAccounts[0]!;
        const { quest } = boot(project, sdk);
        const q = quest();
        q.OnStart();
        expect(sdk.__users.size).toBe(1);

        q.OnComplete();

        expect(calls).toContain(`removeTweet:qe-${questId}-${tweetNodeId}-0`);
        expect(calls).toContain(`removeUser:${account.id}:true`);
        expect(sdk.__users.size).toBe(0);
        expect(sdk.__tweets.size).toBe(0);
    });

    it("keeps an account the author asked to outlive the quest", () => {
        const calls: string[] = [];
        const sdk = twotterSdk(calls);
        const project = tweetProject({ account: { removeWhenQuestEnds: false } });
        const account = project.twotterAccounts[0]!;
        const { quest } = boot(project, sdk);
        const q = quest();
        q.OnStart();
        q.OnComplete();
        expect(calls).not.toContain(`removeUser:${account.id}:true`);
        expect(sdk.__users.has(account.id)).toBe(true);
        // The tweets still go: they belong to the quest, not to the character.
        expect(sdk.__tweets.size).toBe(0);
    });

    it("adopts an account that already exists instead of making a twin, and never removes it", () => {
        const calls: string[] = [];
        const sdk = twotterSdk(calls, { seed: [{ id: "someone-elses", username: "nightowl" }] });
        const { quest } = boot(tweetProject(), sdk);
        const q = quest();
        q.OnStart();

        expect(calls.filter((c) => c.startsWith("createUser:"))).toHaveLength(0);
        expect(calls).toContain("getUserByUsername:nightowl:someone-elses");
        expect(calls.some((c) => c.startsWith("updateUser:someone-elses:"))).toBe(true);
        // The author's fields are refreshed on the account that already existed.
        expect(sdk.__users.size).toBe(1);
        expect(sdk.__users.get("someone-elses")!.bio).toBe("");

        q.OnComplete();
        // No removal at all: not for our editor id, not for the record that was
        // already there. An adopted account is not ours to delete.
        expect(calls.filter((c) => c.startsWith("removeUser:"))).toEqual([]);
        expect(sdk.__users.has("someone-elses")).toBe(true);
    });

    it("keeps an account alive while another quest still needs it", () => {
        const calls: string[] = [];
        const sdk = twotterSdk(calls);
        const project = tweetProject();
        // A second quest posting from the same account.
        const second = JSON.parse(JSON.stringify(project.quests[0])) as ProjectDocument["quests"][0];
        second.id = "second-quest";
        second.name = "twotterquest2";
        second.title = "Twotter Quest 2";
        for (const n of second.graph.nodes) n.id = `${n.id}-b`;
        second.graph.edges = [
            { id: "e-b", source: second.graph.nodes[0]!.id, sourceHandle: "out", target: second.graph.nodes[1]!.id, targetHandle: "in", kind: "flow" },
        ];
        project.quests.push(second);

        const { quest } = boot(project, sdk);
        const account = project.twotterAccounts[0]!;
        const first = quest(0);
        const other = quest(1);
        first.OnStart();
        other.OnStart();
        // Same handle declared by both: one account, created once.
        expect(calls.filter((c) => c.startsWith("createUser:"))).toHaveLength(1);

        first.OnComplete();
        expect(sdk.__users.has(account.id), "the second quest still needs it").toBe(true);

        other.OnComplete();
        expect(calls).toContain(`removeUser:${account.id}:true`);
        expect(sdk.__users.size).toBe(0);
    });

    it("removes the account when the quest that declares it is the only one that ever STARTED", () => {
        const calls: string[] = [];
        const sdk = twotterSdk(calls);
        const project = tweetProject();
        /* A second quest that declares the same account but is never claimed.
           The r185 QA run found the difference the hard way: the first quest
           was abandoned and the account was kept "for a live quest" that had
           never started — the player was left looking at an empty profile. A
           quest only holds an account while it is started and not ended. */
        const second = JSON.parse(JSON.stringify(project.quests[0])) as ProjectDocument["quests"][0];
        second.id = "second-quest";
        second.name = "twotterquest2";
        second.title = "Twotter Quest 2";
        for (const n of second.graph.nodes) n.id = `${n.id}-b`;
        second.graph.edges = [
            { id: "e-b", source: second.graph.nodes[0]!.id, sourceHandle: "out", target: second.graph.nodes[1]!.id, targetHandle: "in", kind: "flow" },
        ];
        project.quests.push(second);

        const { quest } = boot(project, sdk);
        const account = project.twotterAccounts[0]!;
        quest(0).OnStart();
        expect(sdk.__users.has(account.id)).toBe(true);

        quest(0).OnAbandon();
        expect(calls, "an unstarted quest must not hold the account").toContain(`removeUser:${account.id}:true`);
        expect(sdk.__users.size).toBe(0);
    });

    it("brings the quest's accounts into the world at quest start, before any tweet is posted", () => {
        const calls: string[] = [];
        const sdk = twotterSdk(calls);
        /* The tweet node is in the graph but wired to nothing, so the ONLY
           thing that could create the account is the quest-start hook. That is
           the contract the r185 QA run caught broken: the hook walked the
           declarer map's keys as if they were its values, never matched, and
           silently did nothing — so an account could only ever come into the
           world as a side effect of posting. */
        const project = tweetProject();
        project.quests[0]!.graph.edges = [];
        const { quest } = boot(project, sdk);

        quest().OnStart();
        expect(sdk.__users.size).toBe(1);
        expect(calls.filter((c) => c.startsWith("createUser:nightowl"))).toHaveLength(1);
        expect(calls.filter((c) => c.startsWith("postTweet:")), "nothing was posted").toHaveLength(0);
    });

    it("brings the account back when a quest that needs it starts again", () => {
        const calls: string[] = [];
        const sdk = twotterSdk(calls);
        const project = tweetProject();
        const { quest } = boot(project, sdk);
        const account = project.twotterAccounts[0]!;

        quest().OnStart();
        expect(sdk.__users.has(account.id)).toBe(true);
        quest().OnComplete();
        expect(sdk.__users.size, "the story ended, the account went with it").toBe(0);

        /* Claiming the same quest again — which the engine allows once a quest
           is finished — has to rebuild the world it needs. The quest-start hook
           is what does it; the r185 QA run showed a re-claimed quest with no
           account and no tweets, because the posting guard skipped the node
           (that guard is cleared when a quest ends, asserted separately) and
           nothing else put the account back. */
        calls.length = 0;
        quest().OnStart();
        /* `toContain` on an array matches whole elements, and the stub's line
           carries the bio too — filter, do not substring-match. */
        expect(calls.filter((c) => c.startsWith(`createUser:${account.handle}`))).toHaveLength(1);
        expect(sdk.__users.has(account.id)).toBe(true);
    });

    it("re-posts the series on a re-run, so a re-claimed quest is playable", () => {
        const calls: string[] = [];
        const sdk = twotterSdk(calls);
        const project = tweetProject({ rows: [{ content: "one" }, { content: "two" }] });
        const { quest } = boot(project, sdk);

        quest().OnStart();
        expect(sdk.__tweets.size).toBe(2);
        quest().OnAbandon();
        expect(sdk.__tweets.size, "an abandon takes the tweets with it").toBe(0);

        quest().OnStart();
        expect(calls.filter((c) => c.startsWith("postTweet:")), "the re-run posts again").toHaveLength(4);
    });

    it("takes the mod's accounts with it when the package is unloaded", () => {
        const calls: string[] = [];
        const sdk = twotterSdk(calls);
        const project = tweetProject({ account: { removeWhenQuestEnds: false } });
        const account = project.twotterAccounts[0]!;
        const { quest, mod } = boot(project, sdk);
        quest().OnStart();
        expect(sdk.__users.has(account.id)).toBe(true);

        // The SDK's own advice: accounts live in the player's save and survive
        // an uninstall, so the mod removes its characters on the way out.
        mod().OnModPackageUnloaded();
        expect(calls.some((c) => c.startsWith("removeUser:"))).toBe(true);
        expect(sdk.__users.size).toBe(0);
    });

    it("fails open when the game build has no Twotter API", () => {
        const calls: string[] = [];
        const sdk = twotterSdk(calls, { api: false });
        const { quest } = boot(tweetProject(), sdk);
        const q = quest();
        const logged: string[] = [];
        const spy = vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
            logged.push(args.map(String).join(" "));
        });
        try {
            expect(() => q.OnStart()).not.toThrow();
            expect(() => q.OnComplete()).not.toThrow();
        } finally {
            spy.mockRestore();
        }
        expect(calls.filter((c) => c.startsWith("postTweet:"))).toHaveLength(0);
        // The flow's own catch-all would keep the story running anyway, but the
        // node would be logged as FAILED — a build without the Twotter API must
        // be a clean skip, not a failure the tester has to explain.
        expect(logged.filter((l) => l.includes("failed and was skipped"))).toEqual([]);
        expect(logged.some((l) => l.includes("no Twotter API"))).toBe(true);
    });

    it("registers no objective and no trigger on AccountCreated", () => {
        // The plan's fifth fence: the engine does not fire AccountCreated for
        // accounts a mod adds through the API (r179, in game), so nothing may
        // hang a quest's progress off it.
        const calls: string[] = [];
        const { modJs, quest } = boot(tweetProject(), twotterSdk(calls));
        quest().OnStart();
        expect(modJs).not.toContain("AccountCreated");
        // No listener either: a trigger hanging quest progress off an event the
        // engine never fires is a quest that can never be finished.
        expect(calls.filter((c) => c.startsWith("events.on:"))).toEqual([]);
    });

    it("skips a node whose account is gone instead of throwing", () => {
        const calls: string[] = [];
        const sdk = twotterSdk(calls);
        const { quest } = boot(tweetProject({ accountId: "deleted-account" }), sdk);
        const q = quest();
        expect(() => q.OnStart()).not.toThrow();
        expect(calls.filter((c) => c.startsWith("postTweet:"))).toHaveLength(0);
    });

    it("skips an account with no handle rather than sending the game a nameless record", () => {
        const calls: string[] = [];
        const sdk = twotterSdk(calls);
        const { quest } = boot(tweetProject({ account: { handle: "" } }), sdk);
        expect(() => quest().OnStart()).not.toThrow();
        expect(calls.filter((c) => c.startsWith("createUser:"))).toHaveLength(0);
        expect(sdk.__users.size).toBe(0);
    });
});
