import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { compileProject } from "../compile";
import { parseProjectFile } from "@/templates/share";

/**
 * The raw QA harness (`reference/sdk-0.24-qa/mod/dist/mod.js`) is hand-authored
 * and is not compiled by anything, so nothing would notice if a hand edit broke
 * a command — which has happened (r173 mangled this very file). These tests
 * load it against a stub SDK and drive its `qe24 twotter` probe, so the probe
 * that decides whether Twotter can return to the editor is known to run before
 * it reaches a tester's game.
 */

interface Harness {
    quests: (new () => Record<string, unknown>)[];
    command: new () => { Run: (tools: unknown) => unknown };
}

/** Loads mod.js with `require` answered from the given stub. */
function loadHarness(sdk: unknown): Harness {
    const code = readFileSync(join(process.cwd(), "reference/sdk-0.24-qa/mod/dist/mod.js"), "utf8");
    const mod: { exports: unknown } = { exports: {} };
    new Function("require", "module", "exports", code)(
        (name: string) => {
            if (name === "@hotbunny/hackhub-content-sdk") return sdk;
            throw new Error(`unexpected require: ${name}`);
        },
        mod,
        mod.exports,
    );
    const registered = (sdk as { __registered: Harness }).__registered;
    return registered;
}

interface HarnessUser {
    id: string;
    [key: string]: unknown;
}

/**
 * A stub Twotter honouring the 0.24 declarations: `createUser` fills defaults,
 * `getUserById` hands back a **copy** (which is why `updateUser` exists), and
 * `removeUser` deletes the record.
 */
function twotterStub() {
    const users = new Map<string, HarnessUser>();
    const tweets: Record<string, unknown>[] = [];
    return {
        users,
        tweets,
        Twotter: {
            createUser: (options: Partial<HarnessUser> = {}): HarnessUser => ({
                id: options.id ?? "generated-id",
                username: options.username ?? "",
                name: options.name ?? "",
                surname: options.surname ?? "",
                avatar: options.avatar ?? "",
                banner: options.banner ?? "",
                bio: options.bio ?? "",
                joinedAt: "2026-09-18T00:00:00.000Z",
                followers: options.followers ?? 0,
                following: options.following ?? 0,
                password: options.password ?? "",
                ...options,
            }),
            addUser: (user: HarnessUser) => {
                users.set(user.id, user);
            },
            getUserById: (id: string) => {
                const found = users.get(id);
                return found ? { ...found } : undefined;
            },
            updateUser: (id: string, patch: Record<string, unknown>) => {
                const found = users.get(id);
                if (!found) return false;
                for (const [k, v] of Object.entries(patch)) found[k] = v;
                return true;
            },
            removeUser: (id: string) => users.delete(id),
            postTweet: (tweet: Record<string, unknown>) => {
                tweets.push(tweet);
            },
            removeTweet: (id: string) => {
                const i = tweets.findIndex((t) => t.id === id);
                if (i >= 0) tweets.splice(i, 1);
            },
            getUserByUsername: (username: string) =>
                [...users.values()].find((u) => u.username === username),
        },
    };
}

interface StubJob {
    id: string;
    kind: string;
    fireAt: number;
    payload?: Record<string, unknown>;
}

/** In-game ms per unit, as `Time.duration` reports them. */
const GAME_MINUTE = 60_000;
const GAME_HOUR = 60 * GAME_MINUTE;
const GAME_DAY = 24 * GAME_HOUR;

/**
 * A stub SDK carrying just what loading and driving the harness needs.
 *
 * `options.jobs` backs `Scheduler.list`/`remaining` so `qe24 timers` can be
 * driven without a game: the command exists to read another mod's pending jobs
 * back, which is the only way a tester can see *what moment* a Timer resolved
 * to without waiting out the month it asked for.
 */
function harnessSdk(options: { jobs?: StubJob[]; now?: number } = {}) {
    const twotter = twotterStub();
    const jobs = options.jobs ?? [];
    const hooks: { name: string; fn: (payload: unknown) => void }[] = [];
    const completed: string[] = [];
    const mails: string[] = [];
    const registered: Harness = { quests: [], command: class {} as never };
    const claimed: string[] = [];
    const unclaimed: string[] = [];
    const now = () => options.now ?? 1_760_000_000_000;

    class Quest {
        Name = "";
        /* `Quest.claim` / `Quest.unclaim` are what `qe24 run` drives; the stub
           records the calls so the harness's launcher can be asserted. */
        static claim = (name: string) => {
            claimed.push(name);
        };
        static unclaim = (name: string) => {
            unclaimed.push(name);
        };
        Events = { on: (name: string, fn: (payload: unknown) => void) => hooks.push({ name, fn }) };
        completeObjective(name: string) {
            completed.push(name);
        }
        sendMail(_index: number) {
            mails.push(this.Name);
        }
    }

    const sdk = {
        __registered: registered,
        __hooks: hooks,
        __completed: completed,
        __mails: mails,
        __claimed: claimed,
        __unclaimed: unclaimed,
        /* `...twotter` brings `Twotter` and the raw maps the assertions read. */
        ...twotter,
        Quest,
        Command: class {},
        Bootstrap: class {},
        RegisterQuest: (q: new () => Record<string, unknown>) => {
            registered.quests.push(q);
            /* The engine writes a quest's declared Twotter accounts and tweets
               itself — the declarative path whose record used to arrive with
               `bio: undefined`. Emulating it is what makes the probe's cleanup
               assertions mean anything. */
            try {
                const declared = new q() as {
                    TwotterAccounts?: { id: string }[];
                    Tweets?: Record<string, unknown>[];
                };
                for (const account of declared.TwotterAccounts ?? []) {
                    twotter.users.set(account.id, { ...account });
                }
                for (const tweet of declared.Tweets ?? []) {
                    twotter.tweets.push({ id: `declared-${twotter.tweets.length}`, ...tweet });
                }
            } catch {
                /* A quest whose constructor needs more SDK than this stub has
                   is not the one under test. */
            }
        },
        RegisterCommand: () => (c: never) => {
            registered.command = c as never;
        },
        RegisterModPackage: () => {},
        RegisterWebsite: () => {},
        SaveStorage: { get: () => undefined, set: () => {}, remove: () => {} },
        Scheduler: {
            list: (kind?: string) => (kind ? jobs.filter((j) => j.kind === kind) : [...jobs]),
            remaining: (id: string) => {
                const job = jobs.find((j) => j.id === id);
                return job ? Math.max(0, job.fireAt - now()) : null;
            },
        },
        Http: {},
        Time: {
            now,
            duration: (units: { minutes?: number; hours?: number; days?: number }) =>
                (units.minutes ?? 0) * GAME_MINUTE +
                (units.hours ?? 0) * GAME_HOUR +
                (units.days ?? 0) * GAME_DAY,
            /* 60 in-game ms per real ms: one in-game minute is a real second. */
            scale: () => 60,
            toRealMs: (gameMs: number) => gameMs / 60,
        },
        Network: {},
        UI: { toast: () => {} },
        Events: { on: () => {} },
    };
    return sdk;
}

function runCommand(tools: unknown) {
    const sdk = (tools as { sdk: ReturnType<typeof harnessSdk> }).sdk;
    const registered = (sdk as unknown as { __registered: Harness }).__registered;
    const C = registered.command as unknown as new () => { Run: (t: unknown) => unknown };
    return new C().Run(tools);
}

/** Collects whatever the command prints. */
function toolsFor(sdk: ReturnType<typeof harnessSdk>) {
    const lines: string[] = [];
    /* Typed explicitly: an untyped `() => []` infers `never[]`, and every later
       `getArgs = () => ["twotter", "seed"]` then fails to compile. */
    const tools: {
        sdk: ReturnType<typeof harnessSdk>;
        lines: string[];
        println: (m: unknown) => void;
        printError: (m: unknown) => void;
        printSuccess: (m: unknown) => void;
        printWarning: (m: unknown) => void;
        getArgs: () => string[];
        text: () => string;
    } = {
        sdk,
        lines,
        println: (message: unknown) => lines.push(String(message)),
        printError: (message: unknown) => lines.push(`ERROR: ${message}`),
        printSuccess: (message: unknown) => lines.push(String(message)),
        printWarning: (message: unknown) => lines.push(`WARN: ${message}`),
        getArgs: () => [],
        text: () => lines.join("\n"),
    };
    return tools;
}

describe("r179 raw harness — the Twotter probe", () => {
    it("ships in the harness, and the manifest version matches the harness's round", () => {
        const manifest = JSON.parse(
            readFileSync(join(process.cwd(), "reference/sdk-0.24-qa/mod/manifest.json"), "utf8"),
        ) as { version: string };
        const code = readFileSync(join(process.cwd(), "reference/sdk-0.24-qa/mod/dist/mod.js"), "utf8");
        /* r180 added `qe24 timers`; r185 added `qe24 twotter backdate` (P-01a),
           `qe24 twotter order` (P-01b) and `qe24 twotter audit` (the T-11/T-12
           checks); r186 added the launcher entry for the T-13 canary quest,
           and r187's change is the editor's picture field — the harness itself
           only moved version so the tester's build and this one cannot be
           confused. r192 makes `qe24 run` stop promising more than it can prove:
           `Quest.claim()` returns void, so the command now says that a missing
           journal entry means the claim did nothing, and the Twotter aliases
           point at `qe24 twotter audit` and the log's [quest-editor] lines. r193
           adds that readout for real: the export leaves a SharedVariables marker
           when it loads, and this harness prints whether it is there, after a
           tester lost two sessions to a copy of the export the game had
           silently left disabled (behaviour: sdk024QaHarness.test.ts). r199 adds
           `qe24 extras` - Stage A of the cheap wins, probing Menu.addItem,
           Desktop.addWidget, ContextMenu.register and Localization, none of which
           has any prior art here (same test file drives it). r203 adds the
           `extras` ALIAS: Stage B put the extras into the editor export, so the
           alias claims the new QA quest to show a translated Title - the surfaces
           themselves need no quest at all, they are there from load. */
        expect(manifest.version).toBe("1.0.21");
        expect(code).toContain('sub === "twotter"');
        expect(code).toContain('verb === "audit"');
        expect(code).toContain("sdk.RegisterQuest(QE24TwotterProbe);");
        expect(code).toContain('alias: "extras"');
    });

    it("audits the round's handles, and calls a present-and-undefined bio by name", () => {
        const sdk = harnessSdk();
        loadHarness(sdk);
        /* The declared quests put their account on the save at load; this test
           is about the audit's reading, so start from exactly two records we
           control: one authored (a bio that is a string) and one carrying the
           r31 shape (a bio present and undefined — which is what crashed search
           and which a plain print would show as an empty line). */
        sdk.users.clear();
        sdk.users.set("id-good", {
            id: "id-good",
            username: "qe24_editor",
            bio: "authored",
            avatar: "",
            banner: "",
            joinedAt: "2026-09-18T00:00:00.000Z",
            followers: 412,
            following: 96,
            verified: true,
        });
        sdk.users.set("id-bad", {
            id: "id-bad",
            username: "qe24_badrecord",
            bio: undefined,
            avatar: "",
            banner: "",
            joinedAt: "2026-09-18T00:00:00.000Z",
            followers: 0,
            following: 0,
            verified: false,
        });

        const tools = toolsFor(sdk);
        tools.getArgs = () => ["twotter", "audit"];
        runCommand(tools);
        const text = tools.text();

        expect(text).toContain("bio is a string (8 chars)");
        expect(text).toContain("BIO IS UNDEFINED - THE r31 POISON SHAPE");
        expect(text).toContain("@qe24_probe: not on this save");
        expect(text).toContain("@qe24_declared: not on this save");
        expect(text).toContain("2 of 4 handles present; 1 carrying the r31 poison shape.");
    });

    it("degrades honestly when the audit has no Twotter API", () => {
        const sdk = harnessSdk();
        loadHarness(sdk);
        /* A build from before the API existed: the audit must say so, not throw
           halfway through a save file the tester cannot inspect. */
        (sdk as { Twotter?: unknown }).Twotter = undefined;
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["twotter", "audit"];
        runCommand(tools);
        expect(tools.text()).toContain("Twotter API unavailable in this build");
    });

    it("registers a probe quest that declares an account and a tweet through the quest, not the API", () => {
        const sdk = harnessSdk();
        const registered = loadHarness(sdk);
        const Probe = registered.quests.find((q) => q.name === "QE24TwotterProbe");
        expect(Probe, "QE24TwotterProbe is not registered").toBeDefined();
        const quest = new Probe!() as {
            TwotterAccounts?: { id: string; username: string; bio?: string }[];
            Tweets?: { accountId: string; content: string }[];
            Objectives?: { name: string }[];
        };
        /* The declarative path the editor used before r31 — the one whose record
           used to be written with `bio: undefined`. */
        expect(quest.TwotterAccounts?.[0]).toMatchObject({
            username: "qe24_declared",
            bio: "Declared by the quest definition, not by the API.",
        });
        expect(quest.Tweets?.[0]).toMatchObject({ accountId: "qe24-declared-user" });
        expect(quest.Objectives?.map((o) => o.name)).toEqual([
            "api-account-seen",
            "declared-profile-seen",
            "post-seen",
            "bad-record-search",
            "repair-after-reload",
            "cleanup",
        ]);
    });

    it("wires its objectives to the game's own Twotter events", () => {
        const sdk = harnessSdk();
        const registered = loadHarness(sdk);
        const Probe = registered.quests.find((q) => q.name === "QE24TwotterProbe")!;
        const quest = new Probe() as { OnObjectivesStart: () => void };
        quest.OnObjectivesStart();

        const names = sdk.__hooks.map((h) => h.name);
        expect(names).toContain("Twotter.AccountCreated");
        expect(names).toContain("Twotter.ProfileSeen");
        expect(names).toContain("Twotter.PostSeen");

        const fire = (name: string, payload: unknown) =>
            sdk.__hooks.filter((h) => h.name === name).forEach((h) => h.fn(payload));
        fire("Twotter.AccountCreated", { id: "qe24-probe-user", username: "qe24_probe" });
        fire("Twotter.ProfileSeen", { id: "qe24-declared-user", username: "qe24_declared" });
        fire("Twotter.PostSeen", { userId: "qe24-probe-user", id: "qe24-probe-tweet" });
        expect(sdk.__completed).toEqual(["api-account-seen", "declared-profile-seen", "post-seen"]);

        /* Somebody else's account must not tick our objectives. */
        sdk.__completed.length = 0;
        fire("Twotter.AccountCreated", { id: "someone-else", username: "player" });
        fire("Twotter.PostSeen", { userId: "someone-else", id: "x" });
        expect(sdk.__completed).toEqual([]);
    });

    it("seeds an account through createUser (whose job is filling the fields) and plants the bad record on purpose", () => {
        const sdk = harnessSdk();
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["twotter", "seed"];
        runCommand(tools);
        expect(tools.text()).toContain("Search Twotter for: qe24_probe");
        const good = sdk.users.get("qe24-probe-user");
        expect(good?.bio).toBe("SDK 0.24 probe account, made by qe24 twotter seed.");

        tools.getArgs = () => ["twotter", "bad"];
        runCommand(tools);
        const bad = sdk.users.get("qe24-bad-record");
        expect(bad, "the bad record was not created").toBeDefined();
        /* The whole point: this is the r31 shape — `bio` present and undefined,
           exactly what the save held and what search called .toLowerCase() on. */
        expect("bio" in bad!).toBe(true);
        expect(bad!.bio).toBeUndefined();
        expect(tools.text()).toContain("qe24_badrecord");
    });

    it("prints an undefined bio as undefined, so the stored record is evidence rather than a guess", () => {
        const sdk = harnessSdk();
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["twotter", "bad"];
        runCommand(tools);
        tools.lines.length = 0;
        tools.getArgs = () => ["twotter", "status"];
        runCommand(tools);
        const text = tools.text();
        expect(text).toContain("bio: undefined");
        /* And specifically NOT the other shape: a missing property is what an
           omitted key would produce, and it is not what we planted. */
        expect(text).not.toContain("bio: ABSENT");
        expect(text).toContain("Functions present:");
        expect(text).toContain("NOT FOUND"); // the seeded account, not yet created
    });

    it("tells the tester the truth about the bad record, and how to bail out of a crash", () => {
        const sdk = harnessSdk();
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["twotter", "guide"];
        runCommand(tools);
        const guide = tools.text();
        /* The record has `bio` present and undefined — not a missing property.
           The two are easy to conflate in prose, and the earlier draft did
           exactly that, so the wording is guarded. */
        expect(guide).toContain("bio is present but undefined");
        expect(guide).not.toContain("no bio at all");
        expect(guide).toContain("WITHOUT saving");
        tools.lines.length = 0;
        tools.getArgs = () => ["twotter", "bad"];
        runCommand(tools);
        expect(tools.text()).toContain("bio present but undefined");
        expect(tools.text()).toContain("WITHOUT saving");
    });

    it("repairs both records with updateUser — the call the old report said no mod had", () => {
        const sdk = harnessSdk();
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["twotter", "seed"];
        runCommand(tools);
        tools.getArgs = () => ["twotter", "bad"];
        runCommand(tools);
        tools.lines.length = 0;
        tools.getArgs = () => ["twotter", "update"];
        runCommand(tools);

        expect(tools.text()).toContain("updateUser(qe24_probe) -> true");
        expect(tools.text()).toContain("updateUser(qe24_badrecord) -> true");
        expect(sdk.users.get("qe24-bad-record")?.bio).toBe("");
        expect(sdk.users.get("qe24-probe-user")?.bio).toContain("Updated by updateUser");
    });

    it("posts a tweet from the seeded account, and cleans everything up", () => {
        const sdk = harnessSdk();
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        for (const verb of ["seed", "bad", "post"]) {
            tools.getArgs = () => ["twotter", verb];
            runCommand(tools);
        }
        expect(sdk.tweets).toContainEqual({
            id: "qe24-probe-tweet",
            userId: "qe24-probe-user",
            content: "QE24 probe tweet (qe24 twotter post). If you can read this on the profile, posts work.",
            interaction: { comments: 1, share: 0, likes: 3, views: 42 },
            showInTimeline: true,
        });

        tools.lines.length = 0;
        tools.getArgs = () => ["twotter", "cleanup"];
        runCommand(tools);
        expect(tools.text()).toContain("removeUser(qe24_probe) -> true");
        expect(tools.text()).toContain("removeUser(qe24_badrecord) -> true");
        expect(tools.text()).toContain("removeUser(qe24_declared) -> true");
        expect(sdk.users.size).toBe(0);
        expect(sdk.tweets.some((t) => t.id === "qe24-probe-tweet")).toBe(false);
    });

    it("degrades honestly on a build with no Twotter API", () => {
        const sdk = harnessSdk();
        (sdk as { Twotter?: unknown }).Twotter = undefined;
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["twotter", "seed"];
        runCommand(tools);
        expect(tools.text()).toContain("Twotter API unavailable in this build");
    });

    it("says in its own guide that it is the one open probe", () => {
        const sdk = harnessSdk();
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["twotter", "guide"];
        runCommand(tools);
        const text = tools.text();
        expect(text).toContain("qe24_badrecord");
        expect(text).toContain("reference/sdk-0.24-qa/STATUS.md");
    });

    it("posts P-01's four spellings of one moment, so backdating is a stopwatch and not a guess", () => {
        const sdk = harnessSdk();
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["twotter", "seed"];
        runCommand(tools);
        tools.lines.length = 0;
        tools.getArgs = () => ["twotter", "backdate"];
        runCommand(tools);

        const ours = sdk.tweets.filter((t) => String(t.id).startsWith("qe24-p01-"));
        expect(ours.map((t) => t.id).sort()).toEqual([
            "qe24-p01-control",
            "qe24-p01-iso",
            "qe24-p01-iso-ms",
            "qe24-p01-plain",
        ]);
        const byId = new Map(ours.map((t) => [t.id as string, t]));
        /* The control carries no `sendedAt` at all — that is what makes the other
           three readable as "the engine kept our time" rather than "the engine
           puts everything a month back". */
        expect("sendedAt" in byId.get("qe24-p01-control")!).toBe(false);
        const iso = byId.get("qe24-p01-iso-ms")!.sendedAt as string;
        expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(byId.get("qe24-p01-iso")!.sendedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        expect(byId.get("qe24-p01-plain")!.sendedAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
        /* All three are the same moment: about a month back, and in the past. */
        const now = 1_760_000_000_000;
        const back = new Date(iso).getTime();
        expect(back).toBeLessThan(now);
        expect((now - back) / 86_400_000).toBeGreaterThan(25);
        expect((now - back) / 86_400_000).toBeLessThan(35);
        /* The tester's instructions are part of the row, not a separate document
           they have to find: handle, what each should read, and the clean-up. */
        expect(tools.text()).toContain("qe24_probe");
        expect(tools.text()).toContain("a month ago");
        expect(tools.text()).toContain("qe24 twotter cleanup");
    });

    it("sends the tester to seed first when the probe account is missing, and posts nothing", () => {
        const sdk = harnessSdk();
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["twotter", "backdate"];
        runCommand(tools);
        expect(tools.text()).toContain("qe24 twotter seed");
        expect(sdk.tweets.filter((t) => String(t.id).startsWith("qe24-p01-"))).toEqual([]);
    });

    it("posts P-01b's three tweets in an order that separates 'newest first' from 'the order we posted'", () => {
        const sdk = harnessSdk();
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["twotter", "seed"];
        runCommand(tools);
        tools.lines.length = 0;
        tools.getArgs = () => ["twotter", "order"];
        runCommand(tools);

        const ours = sdk.tweets.filter((t) => String(t.id).startsWith("qe24-p01b-"));
        /* Posted A (oldest), then B (engine-stamped "now"), then C (a month
           back). If the three were posted in time order instead, "newest first"
           and "posted order" would read identically — which is exactly the
           ambiguity P-01a's own screenshot left behind. */
        expect(ours.map((t) => t.id)).toEqual(["qe24-p01b-a", "qe24-p01b-b", "qe24-p01b-c"]);
        expect(ours[0].sendedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(ours[2].sendedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(ours[1].sendedAt, "B must carry no time, so the engine stamps it").toBeUndefined();
        /* A is two months back and C one: senders of the same moment would make
           two of the three readings indistinguishable. */
        const now = 1_760_000_000_000;
        const aBack = new Date(ours[0].sendedAt as string).getTime();
        const cBack = new Date(ours[2].sendedAt as string).getTime();
        expect(aBack).toBeLessThan(cBack);
        expect(cBack).toBeLessThan(now);
        expect((cBack - aBack) / 86_400_000).toBeGreaterThan(25);

        /* All three readings are named, so the tester reports a letter sequence
           instead of describing a screen. */
        expect(tools.text()).toContain("A, B, C");
        expect(tools.text()).toContain("oldest first");
        expect(tools.text()).toContain("newest first");
        expect(tools.text()).toContain("qe24 twotter cleanup");
    });
});

describe("r166 SDK 0.24 in-game QA scaffold", () => {
    it("imports, preserves native Wi-Fi fields, and compiles", () => {
        const text = readFileSync(join(process.cwd(), "reference/sdk-0.24-qa/projects/sdk-0.24-ingame-qa.project.json"), "utf8");
        const parsed = parseProjectFile(text);
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) throw new Error(parsed.error);

        const wifi = parsed.project.quests[0].graph.nodes.find((node) => node.type === "world.wifi");
        expect(wifi?.data).toMatchObject({
            ssid: "QE24-LAB-5G",
            bssid: "02:24:00:00:24:02",
            channel: 44,
            wps: true,
        });

        const output = compileProject(parsed.project);
        const mod = output.files.find((file) => file.path === "dist/mod.js")?.content ?? "";
        const manifest = JSON.parse(output.files.find((file) => file.path === "manifest.json")?.content ?? "{}");
        expect(manifest.permissions).toEqual(expect.arrayContaining(["network", "mail", "events", "ui"]));
        expect(mod).toContain("Network.createWifiNetwork");
        expect(mod).toContain("wifiDef.wps");
        expect(mod).toContain("QE24-LAB-5G");
    });

    it("ships a timer quest (S-01 fire / S-02 reload / S-03 cancel)", () => {
        const text = readFileSync(join(process.cwd(), "reference/sdk-0.24-qa/projects/sdk-0.24-ingame-qa.project.json"), "utf8");
        const parsed = parseProjectFile(text);
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) throw new Error(parsed.error);

        const beatQuest = parsed.project.quests.find((quest) => quest.name === "QESdk024TimerQa");
        expect(beatQuest).toBeDefined();
        /* Claimed on demand since r181: an auto-starting QA quest is a load-time
           notification storm once there are several of them (that was r180). */
        expect(beatQuest?.autoStart).toBe(false);
        const beats = (beatQuest?.graph.nodes ?? []).filter((node) => node.type === "flow.timer");
        expect(beats.map((node) => node.data.minutes).concat(beats.map((node) => node.data.hours))).toEqual([2, 0, 0, 2]);

        const output = compileProject(parsed.project);
        const mod = output.files.find((file) => file.path === "dist/mod.js")?.content ?? "";
        /* One beat registration per quest; both quest ids reach the Scheduler. */
        expect(mod.split("Scheduler.register").length).toBe(3);
        expect(mod).toContain('"id":"' + beatQuest!.id + '"');
        expect(mod).toContain("timer missed");
        /* The mod-unique kind is composed at runtime (mod id is data), but
           the "/timer" suffix ships as a source literal. */
        expect(mod).toContain('"/timer"');
        expect(mod).toContain("Timer A arrived (S-01 green)");
    });
});

describe("r180 raw harness — the pending-timer reader", () => {
    const NOW = 1_760_000_000_000;

    it("prints what moment a job resolved to, and how far off it is", () => {
        const fireAt = NOW + 26 * GAME_DAY + 3 * GAME_HOUR + GAME_MINUTE;
        const sdk = harnessSdk({
            now: NOW,
            jobs: [
                {
                    id: "job-editor",
                    kind: "qe/qe-sdk-024-editor-qa/timer",
                    fireAt,
                    payload: { questId: "qe-cal1", nodeId: "qe-cal1-t3", attempts: 0 },
                },
                { id: "job-harness", kind: "qe24/timer", fireAt: NOW + 90_000, payload: {} },
            ],
        });
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["timers"];
        runCommand(tools);
        const text = tools.text();
        expect(text).toContain("Pending jobs: 2");
        /* The editor export's job, identified by kind and by the node it came
           from — that is how a tester tells the calendar row's job apart. */
        expect(text).toContain("kind: qe/qe-sdk-024-editor-qa/timer");
        expect(text).toContain("nodeId=qe-cal1-t3");
        /* The resolved moment, in the local rendering the on-screen clock uses
           and in UTC for comparison. */
        expect(text).toContain(new Date(fireAt).toString());
        expect(text).toContain(new Date(fireAt).toISOString());
        /* The breakdown, in units a person reads (not "0d 0h 37461m"). */
        expect(text).toContain("26d 3h 1m");
        /* Under a minute it says so in real seconds: "0m" would read like a
           broken reading rather than a job about to fire. */
        expect(text).toContain("1m  (in-game ms 90000)");
        /* And what it costs in real time at this scale: 26 in-game days is
           ~10.4 real hours, which is exactly why nobody waits for it.
           (26d 3h 1m = 2,257,260,000 in-game ms; at scale 60 that is
           37,621,000 real ms.) */
        expect(text).toContain("37621 real seconds");
    });

    it("says plainly that nothing is pending, and what to do about it", () => {
        const sdk = harnessSdk({ now: NOW });
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["timers"];
        runCommand(tools);
        const text = tools.text();
        expect(text).toContain("No pending jobs");
        expect(text).toContain("Arm a Timer in the editor export");
    });

    it("degrades honestly on a build with no Scheduler.list", () => {
        const sdk = harnessSdk({ now: NOW });
        (sdk as { Scheduler: Record<string, unknown> }).Scheduler = {};
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["timers"];
        runCommand(tools);
        expect(tools.text()).toContain("Scheduler.list unavailable in this build");
    });
});

describe("r181 raw harness — starting a quest on demand", () => {
    it("lists what can be started, so nobody has to guess a journal title", () => {
        const sdk = harnessSdk();
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["run"];
        runCommand(tools);
        const text = tools.text();
        expect(text).toContain("nothing auto-starts");
        for (const alias of ["timer", "cal", "wait", "probe", "twotter", "tw1", "tw2", "tw3", "surface"]) {
            expect(text, `${alias} is missing from the launcher`).toContain(alias);
        }
        /* The journal title is the fallback when a build refuses to claim
           across mods, so it has to be printed. */
        expect(text).toContain("Timer QA (calendar: S-05/S-06/S-07/S-13)");
        expect(sdk.__claimed).toEqual([]);
    });

    it("claims exactly one quest, and tells the tester what to read next", () => {
        const sdk = harnessSdk();
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["run", "cal"];
        runCommand(tools);
        expect(sdk.__claimed).toEqual(["QESdk024TimerCalQa"]);
        const text = tools.text();
        expect(text).toContain('look for "Timer QA (calendar: S-05/S-06/S-07/S-13)"');
        /* The whole point of the round: the rows are read, not waited for. */
        expect(text).toContain("qe24 timers");
        expect(text).toContain("you do not wait for it");
    });

    it("clears the quests an older build left claimed", () => {
        const sdk = harnessSdk();
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["run", "clear"];
        runCommand(tools);
        /* Every quest the launcher knows, including the two probe quests and
           r203's extras QA quest (which exists only to show a translated Title,
           so `run clear` has to shed it like any other). */
        expect(sdk.__unclaimed).toEqual([
            "QESdk024TimerQa",
            "QESdk024TimerCalQa",
            "QESdk024WaitMonthQa",
            "QESdk024ExtrasQa",
            "QE24SurfaceProbe",
            "QE24TwotterProbe",
            "QESdk024TwotterQa",
            "QESdk024TwotterShareQa",
            "QESdk024TwotterPostEventQa",
            "QESdk024EditorQa",
        ]);
        expect(tools.text()).toContain("Unclaimed:");
    });

    it("names the bad alias instead of claiming something else", () => {
        const sdk = harnessSdk();
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["run", "cals"];
        runCommand(tools);
        expect(sdk.__claimed).toEqual([]);
        expect(tools.text()).toContain("Unknown quest: cals");
    });

    it("degrades honestly when the build has no Quest.claim", () => {
        const sdk = harnessSdk();
        (sdk.Quest as unknown as { claim?: unknown }).claim = undefined;
        loadHarness(sdk);
        const tools = toolsFor(sdk);
        tools.getArgs = () => ["run", "cal"];
        runCommand(tools);
        expect(tools.text()).toContain("Quest.claim is unavailable in this build");
    });

    it("has no quest that starts itself — the r180 noise was five of them at once", () => {
        const code = readFileSync(join(process.cwd(), "reference/sdk-0.24-qa/mod/dist/mod.js"), "utf8");
        expect(code).not.toContain("AutoStart = true");
        /* And the launcher is the sanctioned way in. */
        expect(code).toContain("qe24 run <alias>");
    });
});
