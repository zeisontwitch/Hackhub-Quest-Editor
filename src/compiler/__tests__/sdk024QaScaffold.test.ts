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

/** A stub SDK carrying just what loading and driving the harness needs. */
function harnessSdk() {
    const twotter = twotterStub();
    const hooks: { name: string; fn: (payload: unknown) => void }[] = [];
    const completed: string[] = [];
    const mails: string[] = [];
    const registered: Harness = { quests: [], command: class {} as never };

    class Quest {
        Name = "";
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
        Scheduler: {},
        Http: {},
        Time: { now: () => 0 },
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
    it("ships in the harness, and the manifest version matches the probe's round", () => {
        const manifest = JSON.parse(
            readFileSync(join(process.cwd(), "reference/sdk-0.24-qa/mod/manifest.json"), "utf8"),
        ) as { version: string };
        const code = readFileSync(join(process.cwd(), "reference/sdk-0.24-qa/mod/dist/mod.js"), "utf8");
        expect(manifest.version).toBe("1.0.9");
        expect(code).toContain('sub === "twotter"');
        expect(code).toContain("sdk.RegisterQuest(QE24TwotterProbe);");
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
        expect(text).toContain("Functions present:");
        expect(text).toContain("NOT FOUND"); // the seeded account, not yet created
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
        expect(beatQuest?.autoStart).toBe(true);
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
