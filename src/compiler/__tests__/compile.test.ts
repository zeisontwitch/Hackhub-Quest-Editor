/**
 * Step 4 export compiler: permissions, warnings, and — the important part —
 * the emitted mod.js actually runs against a stub SDK: quests register,
 * OnStart builds networks and sends mail, triggers evaluate their
 * conditions, and manual-input commands branch on the typed answer.
 */
import { describe, expect, it, vi } from "vitest";
import { compileProject, computePermissions, computeWarnings, EDITOR_BUILD } from "@/compiler/compile";
import { mailBodyText } from "@/compiler/mailText";
import { nodeTypeDef } from "@/schema/registry";
import { createProject, type ProjectDocument } from "@/schema/project";
import { getTemplate, TEMPLATES } from "@/templates";
import { EVENTS, getEvent, payloadFields } from "@/schema/events";
import type { NodeDoc } from "@/schema/nodes";
import type { EdgeDoc } from "@/schema/edges";

let seq = 0;
const nid = () => `n${++seq}`;

function node(type: Parameters<typeof nodeTypeDef>[0], patch: Record<string, unknown> = {}): NodeDoc {
    const data = { ...(nodeTypeDef(type).create() as object), ...patch };
    return { id: nid(), type, position: { x: 0, y: 0 }, data } as NodeDoc;
}

const edge = (source: string, target: string, kind: EdgeDoc["kind"], sourceHandle = "out", targetHandle = "in"): EdgeDoc => ({
    id: `e${source}-${target}-${sourceHandle}`,
    source,
    sourceHandle,
    target,
    targetHandle,
    kind,
});

function scenarioProject(): ProjectDocument {
    const project = createProject();
    const quest = project.quests[0];
    quest.name = "heist";
    quest.title = "The Heist";
    quest.autoStart = true;

    const entry = node("entry.start");
    const mail = node("comms.dialogue", {
        kind: "mail",
        mail: { from: "h@x.net", subject: "Job", content: "<p>hi</p>", replyable: false },
    });
    const net = node("world.network", {
        ipMode: "fixed",
        device: {
            id: "r1",
            ip: "10.0.0.14",
            type: "ROUTER",
            ports: [{ id: "p1", external: 22, internal: 22, service: "ssh", active: true }],
            users: [{ id: "u1", username: "admin", password: "pw" }],
        },
    });
    const obj = node("objective", { name: "scan", description: "Scan it" });
    const trig = node("trigger.event", {
        event: "Terminal.NmapScan",
        conditions: [{ id: "c1", join: "and", field: "ip", op: "equals", value: "10.0.0.14" }],
    });
    const input = node("reply.input", {
        commandName: "unlock",
        prompt: "Password?",
        expected: "opensesame",
        matchMode: "exact",
        successMessage: "in you go",
        failureMessage: "nope",
    });
    const notifyOk = node("fx.notify", { message: "welcome" });
    const notifyBad = node("fx.notify", { message: "locked out" });
    const obj2 = node("objective", { name: "vault", description: "Reach the vault" });
    const notifyGranted = node("fx.notify", { message: "granted" });

    quest.graph.nodes = [entry, mail, net, obj, trig, input, notifyOk, notifyBad, obj2, notifyGranted];
    quest.graph.edges = [
        edge(entry.id, mail.id, "flow"),
        edge(entry.id, net.id, "flow"),
        edge(entry.id, input.id, "flow"),
        edge(mail.id, obj2.id, "flow"),
        edge(trig.id, obj.id, "condition", "trigger", "trigger"),
        edge(input.id, notifyOk.id, "flow", "out"),
        edge(input.id, notifyBad.id, "flow", "failure"),
        edge(input.id, notifyGranted.id, "flow", "success"),
    ];

    project.websites.push({
        id: "w1",
        host: "target.net",
        name: "Target",
        pages: [
            { id: "p1", path: "/", title: "Home", seo: true, content: "<html><body>home</body></html>" },
            { id: "p2", path: "/secret", title: "Secret", seo: false, content: "<html><body>clue</body></html>" },
        ],
    });
    return project;
}

function stubSdk(calls: string[], listeners: [string, (d: unknown) => void][]) {
    const registered = { quests: [] as any[], websites: [] as any[], commands: [] as any[] };
    class Quest {
        Data: Record<string, unknown> = {};
        Events = {
            on: (e: string, h: (d: unknown) => void) => listeners.push([e, h]),
            off: () => {},
            offAll: () => {},
        };
        sendMail(i: number) { calls.push(`sendMail:${i}`); }
        createDialog(b: string) { calls.push(`createDialog:${b}`); }
        completeObjective(n: string) { calls.push(`complete:${n}`); }
        SetData(k: string, v: unknown) {
            calls.push(`setData:${k}=${v}`);
            // The real SDK persists it on the quest's Data; tests that read
            // {{data.x}} back need the same.
            this.Data[k] = v;
        }
    }
    class Website {}
    class Command {}
    class Bootstrap {}
    const sdk = {
        Quest,
        Website,
        Command,
        Bootstrap,
        RegisterQuest: (c: unknown) => registered.quests.push(c),
        RegisterWebsite: (c: unknown) => registered.websites.push(c),
        RegisterCommand: (c: unknown) => registered.commands.push(c),
        RegisterModPackage: (c: unknown) => (registered as any).mod = c,
        Network: {
            createSubnetNetwork: (d: { ip: string }) => { calls.push(`net:${d.ip}`); return d.ip; },
            createWifiNetwork: () => calls.push("wifi"),
            createUser: (u: unknown) => u,
            randomIp: () => "10.9.9.9",
        },
        Events: { emit: (e: string) => calls.push(`emit:${e}`), on: () => {} },
        Shell: { addCommandData: (c: string) => calls.push(`cmdData:${c}`) },
        UI: { notify: (m: string) => calls.push(`notify:${m}`), toast: (m: string) => calls.push(`toast:${m}`) },
        Bank: {},
        __registered: registered,
    };
    return sdk;
}

/** Flush every pending promise chain the interpreter may have started. */
const settle = async () => {
    for (let i = 0; i < 60; i++) await new Promise((r) => setTimeout(r, 0));
};

const registered0 = (sdk: unknown) => (sdk as any).__registered;

function runMod(modJs: string, sdk: unknown) {
    const mod: { exports: any } = { exports: {} };
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function("require", "module", "exports", modJs)((name: string) => {
        if (name === "@hotbunny/hackhub-content-sdk") return sdk;
        throw new Error(`unexpected require: ${name}`);
    }, mod, mod.exports);
    return mod.exports;
}

describe("compile", () => {
    it("computes permissions and packs the mod folder", () => {
        const result = compileProject(scenarioProject());
        const paths = result.files.map((f) => f.path);
        expect(paths).toContain("manifest.json");
        expect(paths).toContain("dist/mod.js");
        expect(paths).toContain("src/index.ts");
        expect(result.permissions).toEqual(expect.arrayContaining(["network", "mail", "shell"]));
        const manifest = JSON.parse(result.files.find((f) => f.path === "manifest.json")!.content);
        expect(manifest.apiVersion).toBe(1);
        expect(manifest.permissions).toContain("network");
    });

    it("the emitted mod.js runs: OnStart builds the network and sends the mail", async () => {
        const calls: string[] = [];
        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk(calls, listeners);
        const { files } = compileProject(scenarioProject());
        runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);

        const reg = (sdk as any).__registered;
        expect(reg.quests).toHaveLength(1);
        expect(reg.websites).toHaveLength(1);
        expect(reg.commands).toHaveLength(1);

        const q = new reg.quests[0]();
        expect(q.Name).toBe("heist");
        // the behaviour toggles reach the game — without AutoStart the quest
        // would wait to be claimed and OnStart would never run
        expect(q.AutoStart).toBe(true);
        q.OnStart();
        await settle(); // flow steps are promise-chained
        expect(calls).toContain("net:10.0.0.14");
        expect(calls).toContain("sendMail:0");
        // flow reaching an objective ticks it off …
        expect(calls).toContain("complete:vault");
        // … but the flow PAUSES at the input node until the player answers
        expect(calls).not.toContain("notify:welcome");
        expect(calls).not.toContain("notify:locked out");

        // the trigger's declarative condition evaluates against the payload
        q.OnObjectivesStart();
        const scan = q.Objectives.find((o: { name: string }) => o.name === "scan");
        expect(scan.trigger.event).toBe("Terminal.NmapScan");
        expect(scan.trigger.condition({ ip: "10.0.0.14" })).toBe(true);
        expect(scan.trigger.condition({ ip: "1.2.3.4" })).toBe(false);
    });

    it("manual input commands branch on the typed answer", async () => {
        const calls: string[] = [];
        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk(calls, listeners);
        const { files } = compileProject(scenarioProject());
        runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const reg = (sdk as any).__registered;

        const Cmd = reg.commands[0];
        const cmd = new Cmd();
        const tools = (answer: string) => ({
            prompt: async () => answer,
            printSuccess: (m: string) => calls.push(`ok:${m}`),
            printError: (m: string) => calls.push(`err:${m}`),
        });

        await cmd.Run(tools("opensesame"));
        expect(calls.join(" ")).toContain("emit:QE.");
        expect(calls.join(" ")).toContain(".ok");
        expect(calls).toContain("notify:welcome");

        await cmd.Run(tools("wrong"));
        expect(calls.join(" ")).toContain(".wrong");
        expect(calls).toContain("notify:locked out");
        expect(calls).toContain("err:nope");
    });


    it("websites compile with hidden pages out of the search index", () => {
        const calls: string[] = [];
        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk(calls, listeners);
        const { files } = compileProject(scenarioProject());
        runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const site = new (sdk as any).__registered.websites[0]();
        expect(site.Host).toBe("target.net");
        const secret = site.Pages.find((p: { path: string }) => p.path === "/secret");
        expect(secret.seo).toBe(false);
        expect(secret.html).toContain("clue");
    });

    it("the export dialog shows the compile summary and packs a zip", async () => {
        const { buildModZip } = await import("@/editor/shell/ExportDialog");
        const result = compileProject(scenarioProject());
        const zip = await buildModZip(result, "heist-mod");
        const names = Object.keys(zip.files);
        expect(names).toContain("heist-mod/manifest.json");
        expect(names).toContain("heist-mod/dist/mod.js");
    });
});

describe("world.wifi against the real SDK surface", () => {
    function wifiProject() {
        const p = createProject();
        const q = p.quests[0];
        const entry = node("entry.start");
        const wifi = node("world.wifi", {
            ssid: "CafeNet",
            password: "cake",
            signal: 2,
            ipMode: "fixed",
            ip: "10.0.0.77",
        });
        q.graph.nodes = [entry, wifi];
        q.graph.edges = [edge(entry.id, wifi.id, "flow")];
        return p;
    }

    it("falls back to a router network when the SDK has no Wi-Fi API (0.21.0 reality)", async () => {
        const calls: string[] = [];
        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk(calls, listeners);
        delete (sdk.Network as { createWifiNetwork?: unknown }).createWifiNetwork;
        runMod(compileProject(wifiProject()).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (sdk as any).__registered.quests[0]();
        q.OnStart();
        await settle();
        expect(calls).toContain("net:10.0.0.77");
        expect(calls.join(" ")).not.toContain("wifi");
    });

    it("prefers a native Wi-Fi API if a future SDK ships one", async () => {
        const calls: string[] = [];
        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk(calls, listeners);
        runMod(compileProject(wifiProject()).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (sdk as any).__registered.quests[0]();
        q.OnStart();
        await settle();
        expect(calls).toContain("wifi");
        expect(calls.join(" ")).not.toContain("net:10.0.0.77");
    });
});

describe("round-19 fixes", () => {
    it("passes the mail's custom From through sendMail", async () => {
        const p = createProject();
        const q = p.quests[0];
        const entry = node("entry.start");
        const mail = node("comms.dialogue", {
            kind: "mail",
            mail: { from: "Stevey@gomail.com", subject: "Job", content: "hi", replyable: false },
        });
        q.graph.nodes = [entry, mail];
        q.graph.edges = [edge(entry.id, mail.id, "flow")];

        const sent: unknown[][] = [];
        const { registered, sdk } = (() => {
            const base = stubSdk([], []);
            (base as any).Quest.prototype.sendMail = function (...args: unknown[]) { sent.push(args); };
            return { registered: (base as any).__registered, sdk: base };
        })();
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q0 = new registered.quests[0]();
        q0.OnStart();
        await settle();
        expect(sent[0][0]).toBe(0);
        expect(sent[0][1]).toBe("Stevey@gomail.com");
    });

    it("charges a percentage of the player's balance via the real Bank API", async () => {
        const p = createProject();
        const q = p.quests[0];
        const entry = node("entry.start");
        const charge = node("fx.withdraw", { amountMode: "percent", percent: 25, description: "tax" });
        q.graph.nodes = [entry, charge];
        q.graph.edges = [edge(entry.id, charge.id, "flow")];

        const calls: string[] = [];
        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk(calls, listeners);
        (sdk as any).Bank = {
            getBalance: () => 4000,
            withdraw: (tx: { amount: number; description: string }) => calls.push(`withdraw:${tx.amount}:${tx.description}`),
            transaction: (tx: { amount: number }) => calls.push(`deposit:${tx.amount}`),
        };
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q0 = new (registered0(sdk).quests[0])();
        q0.OnStart();
        await settle();
        expect(calls).toContain("withdraw:1000:tax");
    });

    it("waits in seconds and embeds cover/icon files with manifest references", async () => {
        const p = createProject();
        p.mod.tags = ["story", "network"];
        p.mod.icon = "data:image/png;base64,iVBORw0KGgo=";
        p.mod.cover = "data:image/jpeg;base64,/9j/4AAQ=";
        const q = p.quests[0];
        const entry = node("entry.start");
        const wait = node("flow.delay", { seconds: 2 });
        q.graph.nodes = [entry, wait];
        q.graph.edges = [edge(entry.id, wait.id, "flow")];

        const result = compileProject(p);
        const manifest = JSON.parse(result.files.find((f) => f.path === "manifest.json")!.content);
        expect(manifest.icon).toBe("assets/icon.png");
        expect(manifest.cover).toBe("assets/cover.jpg");
        expect(manifest.tags).toEqual(["story", "network"]);
        const iconFile = result.files.find((f) => f.path === "assets/icon.png")!;
        expect(iconFile.base64).toBe(true);

        // seconds are honoured (the Wait node stored 2s → a real 2000ms sleep)
        const calls: string[] = [];
        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk(calls, listeners);
        runMod(result.files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const started = Date.now();
        const q0 = new (sdk as any).__registered.quests[0]();
        q0.OnStart();
        await new Promise((r) => setTimeout(r, 2100)); // the Wait node slept 2 real seconds
        expect(Date.now() - started).toBeGreaterThanOrEqual(1900);
    });
});

describe("export build stamp", () => {
    it("stamps the editor build id into dist/mod.js", () => {
        const modJs = compileProject(createProject()).files.find((f) => f.path === "dist/mod.js")!.content;
        expect(modJs).toContain(`build ${EDITOR_BUILD}`);
        // Twotter support was removed in round 31: the game stores a quest
        // account with an undefined `bio` and its search crashes on it, with
        // no way for a mod to repair the record (QA rounds 5–7, see
        // docs/02-editor-shell.md). Nothing Twotter-shaped may come back
        // without a fresh look at the SDK.
        expect(modJs).not.toContain("Twotter");
        expect(modJs).not.toContain("Tweets");
    });
});

describe("quest behaviour toggles", () => {
    it("says outright when nothing can start a quest", () => {
        // No auto-start and no feed post: the quest is in the mod and
        // unreachable. QA hit exactly this with a shipped template.
        const result = compileProject(createProject());
        expect(result.warnings.some((w) => /nothing can start this quest/.test(w))).toBe(true);

        // A feed post is a real way in, so the wording softens to a heads-up.
        const posted = createProject();
        posted.quests[0].hackhubPost = { content: "Anyone free for a small job?", comments: [] };
        const postedWarnings = compileProject(posted).warnings;
        expect(postedWarnings.some((w) => /nothing can start this quest/.test(w))).toBe(false);
        expect(postedWarnings.some((w) => /claims this one from its Hackhub feed post/.test(w))).toBe(true);

        // and it stays quiet once auto-start is on
        const auto = createProject();
        auto.quests[0].autoStart = true;
        expect(compileProject(auto).warnings.some((w) => /start/.test(w))).toBe(false);
    });

    it("explains what an unlisted page is for, not just that it exists", () => {
        const p = createProject();
        p.websites.push({
            id: "w1", host: "example.net", name: "Example",
            pages: [{ id: "p1", path: "/files/internal/memo", title: "Memo", seo: false, content: "<html></html>" }],
        });
        const note = compileProject(p).warnings.find((w) => w.includes("/files/internal/memo"))!;
        expect(note).toContain("dirhunter");
        expect(note).toContain("Listed in search");
    });
});

describe("reference template through the compiler", () => {
    it("compiles and runs end to end", async () => {
        const { getTemplate } = await import("@/templates");
        const project = getTemplate("reference")!.build();
        const result = compileProject(project);
        expect(result.warnings.length).toBeGreaterThanOrEqual(0);

        const calls: string[] = [];
        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk(calls, listeners);
        runMod(result.files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const reg = (sdk as any).__registered;
        expect(reg.quests.length).toBeGreaterThanOrEqual(1);
        expect(reg.mod).toBeTruthy();

        for (const QC of reg.quests) {
            const q = new QC();
            q.OnStart();
            q.OnObjectivesStart();
        }
        await settle();
        for (const WC of reg.websites) new WC();
        for (const CC of reg.commands) new CC();
        // no exception anywhere = every node type survives the interpreter
    });
});

describe("random target ip: CreateData + {{data.targetIp}}", () => {
    /** Unlike stubSdk() above, SetData here actually persists into Data and
     * createSubnetNetwork records the full device — this exercises the real
     * CreateData()/Data round trip the shared stub short-circuits. */
    function persistingSdk() {
        const calls: string[] = [];
        const registered: any = { quests: [] };
        class Quest {
            Data: Record<string, unknown> = {};
            Events = { on: () => {}, off: () => {}, offAll: () => {} };
            sendMail() {}
            createDialog() {}
            completeObjective() {}
            SetData(k: string, v: unknown) {
                (this.Data as any)[k] = v;
            }
        }
        const sdk = {
            Quest,
            Website: class {},
            Command: class {},
            Bootstrap: class {},
            RegisterQuest: (c: unknown) => registered.quests.push(c),
            RegisterWebsite: () => {},
            RegisterCommand: () => {},
            RegisterModPackage: () => {},
            Network: {
                createSubnetNetwork: (d: { ip: string }) => calls.push(`net:${d.ip}`),
                createUser: (u: unknown) => u,
                randomIp: () => "45.33.32.156",
            },
            UI: { notify: (m: string) => calls.push(`notify:${m}`), toast: () => {} },
            Shell: {},
            Bank: {},
        };
        return { sdk, registered, calls };
    }

    it("allocates targetIp once in CreateData and reuses it for the live network and every {{data.targetIp}} token", async () => {
        const project = createProject();
        const quest = project.quests[0];
        quest.autoStart = true;

        const entry = node("entry.start");
        const net = node("world.network", {
            ipMode: "random",
            device: { id: "r1", ip: "10.0.0.1", type: "ROUTER", ports: [], users: [] },
        });
        const notify = node("fx.notify", { message: "target is {{data.targetIp}}" });
        quest.graph.nodes = [entry, net, notify];
        quest.graph.edges = [
            edge(entry.id, net.id, "flow"),
            edge(net.id, notify.id, "flow"),
        ];

        const { sdk, registered, calls } = persistingSdk();
        const { files } = compileProject(project);
        runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);

        const QC = registered.quests[0];
        const q = new QC();
        q.Data = await q.CreateData(); // mirrors what the real engine does before OnStart
        q.OnStart();
        await settle();

        expect(q.Data.targetIp).toBe("45.33.32.156");
        expect(calls).toContain("net:45.33.32.156"); // same ip used for the live network
        expect(calls).toContain("notify:target is 45.33.32.156"); // and for the token
    });

    it("CreateData() returns {} when nothing needs a random ip", async () => {
        const { sdk, registered } = persistingSdk();
        const { files } = compileProject(createProject());
        runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const QC = registered.quests[0];
        const q = new QC();
        expect(await q.CreateData()).toEqual({});
    });
});

describe("flow.sequence fires its outputs in order, with the author's pauses", () => {
    /**
     * The SDK has no scheduling API of its own (grep: no timer/schedule/
     * sequence anywhere in index.d.ts), so sequencing lives in the emitted
     * interpreter. Its step delays mirror the SDK's own convention for chat
     * chains: `delayMs`, applied *before* the item fires.
     */
    function sequenceProject(): { project: ProjectDocument; ids: string[] } {
        const project = createProject();
        const quest = project.quests[0];
        quest.autoStart = true;

        const entry = node("entry.start");
        const seqNode = node("flow.sequence", {
            steps: [
                { id: "a", label: "First", delayMs: 0 },
                { id: "b", label: "Second", delayMs: 60 },
                { id: "c", label: "Third", delayMs: 60 },
            ],
        });
        const one = node("fx.notify", { message: "one" });
        const two = node("fx.notify", { message: "two" });
        const three = node("fx.notify", { message: "three" });

        quest.graph.nodes = [entry, seqNode, one, two, three];
        quest.graph.edges = [
            edge(entry.id, seqNode.id, "flow"),
            edge(seqNode.id, one.id, "flow", "step-a"),
            edge(seqNode.id, two.id, "flow", "step-b"),
            edge(seqNode.id, three.id, "flow", "step-c"),
        ];
        return { project, ids: [entry.id, seqNode.id] };
    }

    it("runs every output top to bottom", async () => {
        const calls: string[] = [];
        const sdk = stubSdk(calls, []);
        const { files } = compileProject(sequenceProject().project);
        runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);

        const q = new (registered0(sdk).quests[0])();
        q.OnStart();
        // Real timers: the steps really do wait.
        await new Promise((r) => setTimeout(r, 400));
        await settle();

        expect(calls).toEqual(["notify:one", "notify:two", "notify:three"]);
    });

    it("waits the step's delay before firing it", async () => {
        const calls: string[] = [];
        const sdk = stubSdk(calls, []);
        const { project } = sequenceProject();
        // Long enough that flushing microtasks cannot outrun the timer.
        const steps = (project.quests[0].graph.nodes[1].data as { steps: { delayMs: number }[] }).steps;
        steps[1].delayMs = 600;
        steps[2].delayMs = 600;
        const { files } = compileProject(project);
        runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);

        const q = new (registered0(sdk).quests[0])();
        q.OnStart();
        await settle(); // no real time has passed yet
        expect(calls).toEqual(["notify:one"]); // only the 0 ms step has fired

        await new Promise((r) => setTimeout(r, 1500));
        await settle();
        expect(calls).toEqual(["notify:one", "notify:two", "notify:three"]);
    });

    it("uses the game's own timer when the SDK exposes one", async () => {
        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        // SDK 0.21.0 ships Random.sleep(ms): Promise<void>.
        sdk.Random = { sleep: (ms: number) => { calls.push(`sleep:${ms}`); return Promise.resolve(); } };
        const { files } = compileProject(sequenceProject().project);
        runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);

        const q = new (registered0(sdk).quests[0])();
        q.OnStart();
        await settle();

        expect(calls).toEqual([
            "notify:one",
            "sleep:60",
            "notify:two",
            "sleep:60",
            "notify:three",
        ]);
    });

    it("an output with nothing wired to it simply does nothing", async () => {
        const calls: string[] = [];
        const sdk = stubSdk(calls, []);
        const { project } = sequenceProject();
        // Drop the wire from the middle step.
        const quest = project.quests[0];
        quest.graph.edges = quest.graph.edges.filter((e) => e.sourceHandle !== "step-b");
        const { files } = compileProject(project);
        runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);

        const q = new (registered0(sdk).quests[0])();
        q.OnStart();
        await new Promise((r) => setTimeout(r, 400));
        await settle();

        expect(calls).toEqual(["notify:one", "notify:three"]);
    });
});

describe("workshop tags", () => {
    it("exports whatever tags the author typed, invented ones included", () => {
        const p = createProject();
        p.mod.tags = ["story", "dockyards noir", "my-own-tag"];
        const { files } = compileProject(p);
        const manifest = JSON.parse(files.find((f) => f.path === "manifest.json")!.content);
        expect(manifest.tags).toEqual(["story", "dockyards noir", "my-own-tag"]);
    });

    it("omits the tags field entirely when there are none", () => {
        const { files } = compileProject(createProject());
        const manifest = JSON.parse(files.find((f) => f.path === "manifest.json")!.content);
        expect("tags" in manifest).toBe(false);
    });
});

/**
 * Chats can land on the beat, instead of being handed to the game up front.
 * SDK 0.21.0: Kisscord.sendMessage(channelUserId, content, isMine),
 * WeeChat.sendMessage({ host, username, message }).
 */
describe("conversations timed to the story", () => {
    function chatSdk(calls: string[]) {
        const sdk = stubSdk(calls, []) as any;
        sdk.Kisscord = {
            sendMessage: (ch: string, content: string, isMine?: boolean) =>
                calls.push(`kc:${ch}:${content}:${isMine ? "me" : "them"}`),
        };
        sdk.WeeChat = {
            createServer: () => {},
            removeServer: () => {},
            sendMessage: (m: { host: string; username: string; message: string }) =>
                calls.push(`wc:${m.host}:${m.username}:${m.message}`),
        };
        return sdk;
    }

    function chatProject(kind: "kisscord" | "weechat", opts: { wire: boolean; live: boolean }) {
        const p = createProject();
        const quest = p.quests[0];
        quest.name = "beat";
        quest.autoStart = true;
        const entry = node("entry.start");
        const chat = node("comms.dialogue", {
            kind,
            postLive: opts.live,
            kisscord: {
                contactId: "informant",
                messages: [
                    { id: "m1", content: "You there?", isMine: false, delayMs: 0, playerAction: "none", playerText: "", unlocksAfter: [] },
                    { id: "m2", content: "The dock gate is open.", isMine: false, delayMs: 0, playerAction: "none", playerText: "", unlocksAfter: [] },
                ],
            },
            weechat: {
                host: "irc.darknet.org",
                password: "hunter2",
                registerServer: false,
                messages: [
                    { id: "m1", content: "gate is open", username: "ghost", isMine: false, delayMs: 0, playerAction: "none", playerText: "" },
                ],
            },
        });
        quest.graph.nodes = [entry, chat];
        quest.graph.edges = opts.wire ? [edge(entry.id, chat.id, "flow")] : [];
        return p;
    }

    async function run(kind: "kisscord" | "weechat", opts: { wire: boolean; live: boolean }) {
        const calls: string[] = [];
        const sdk = chatSdk(calls);
        const { files } = compileProject(chatProject(kind, opts));
        runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.OnStart();
        await settle();
        return { calls, q };
    }

    it("sends a Kisscord conversation when the flow arrives, in order", async () => {
        const { calls, q } = await run("kisscord", { wire: true, live: true });
        // Not handed to the engine up front any more …
        expect(q.KisscordChats).toBeUndefined();
        expect(calls.filter((c) => c.startsWith("kc:"))).toEqual([
            "kc:informant:You there?:them",
            "kc:informant:The dock gate is open.:them",
        ]);
    });

    it("sends a WeeChat line live, with its host and speaker", async () => {
        const { calls, q } = await run("weechat", { wire: true, live: true });
        expect(q.WeeChatChats).toBeUndefined();
        expect(calls.filter((c) => c.startsWith("wc:"))).toEqual([
            "wc:irc.darknet.org:ghost:gate is open",
        ]);
    });

    it("plays a conversation once, however often the flow comes back", async () => {
        const calls: string[] = [];
        const sdk = chatSdk(calls);
        const { files } = compileProject(chatProject("kisscord", { wire: true, live: true }));
        runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.OnStart();
        q.OnStart();
        await settle();
        expect(calls.filter((c) => c.startsWith("kc:"))).toHaveLength(2); // two messages, once
    });

    it("stays a normal quest conversation when it did not opt in", async () => {
        const { calls, q } = await run("kisscord", { wire: true, live: false });
        expect(q.KisscordChats).toHaveLength(1);
        expect(calls.filter((c) => c.startsWith("kc:"))).toHaveLength(0);
    });

    it("stays declarative when it opted in but nothing is wired into it", async () => {
        const { calls, q } = await run("weechat", { wire: false, live: true });
        expect(q.WeeChatChats).toHaveLength(1);
        expect(calls.filter((c) => c.startsWith("wc:"))).toHaveLength(0);
    });

    it("falls back to the declarative script when the game cannot send live", async () => {
        const calls: string[] = [];
        const sdk = stubSdk(calls, []); // no Kisscord namespace at all
        const { files } = compileProject(chatProject("kisscord", { wire: true, live: true }));
        runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        expect(q.KisscordChats).toHaveLength(1);
        q.OnStart();
        await settle();
        expect(calls.filter((c) => c.startsWith("kc:"))).toHaveLength(0);
    });

    it("says plainly what a timed conversation gives up", () => {
        const warnings = computeWarnings(chatProject("kisscord", { wire: true, live: true }));
        expect(warnings.join("\n")).toContain("sent live at that moment");
        expect(warnings.join("\n")).toContain("“unlocks after”");
        const unwired = computeWarnings(chatProject("kisscord", { wire: false, live: true }));
        expect(unwired.join("\n")).toContain("nothing is wired into it");
    });
});

/**
 * From the QA log of 02/09/2026:
 *
 *   Mod "twotter-qatest-5" tried to use Network.getPlayerIp without "network"
 *   permission … at dataScope … at runFlow … at cls.OnStart
 *
 * — thrown for a project that mentions no player IP anywhere. The token scope
 * was computing every `player.*` and `random.*` value eagerly, so an API the
 * author never asked for could take the whole quest down before it started.
 */
describe("token values cost nothing until a token asks for them", () => {
    function notifyProject(message: string) {
        const p = createProject();
        const q = p.quests[0];
        q.name = "Tokens";
        q.autoStart = true;
        const entry = node("entry.start");
        const notify = node("fx.notify", { message, variant: "notify" });
        q.graph.nodes = [entry, notify];
        q.graph.edges = [edge(entry.id, notify.id, "flow")];
        return p;
    }

    it("never touches the player's IP unless the author asked for it", async () => {
        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        // The loader throws for an undeclared permission, exactly as the log shows.
        sdk.Network.getPlayerIp = () => {
            calls.push("getPlayerIp");
            throw new Error('[ContentSDK] tried to use Network.getPlayerIp without "network" permission.');
        };
        const p = notifyProject("Nothing to see here");
        const { files } = compileProject(p);
        expect(JSON.parse(files.find((f) => f.path === "manifest.json")!.content).permissions)
            .not.toContain("network");

        runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        expect(() => q.OnStart()).not.toThrow();
        q.OnObjectivesStart();
        await settle();
        expect(calls).not.toContain("getPlayerIp");
        expect(calls).toContain("notify:Nothing to see here");
    });

    it("asks for the permission a token needs", () => {
        expect(computePermissions(notifyProject("Your IP is {{player.ip}}"))).toContain("network");
        expect(computePermissions(notifyProject("Mail: {{player.email}}"))).toContain("mail");
        expect(computePermissions(notifyProject("Hello {{player.username}}"))).toContain("shell");
        expect(computePermissions(notifyProject("Plain text"))).not.toContain("network");
    });

    it("still resolves the token when the permission is there", async () => {
        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        sdk.Network.getPlayerIp = () => "10.0.0.7";
        const { files } = compileProject(notifyProject("IP {{player.ip}}"));
        runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.OnStart();
        await settle();
        expect(calls).toContain("notify:IP 10.0.0.7");
    });

    it("hands back an empty string instead of throwing when a lookup fails", async () => {
        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        sdk.Shell.getUsername = () => { throw new Error("nope"); };
        const { files } = compileProject(notifyProject("Hi {{player.username}}!"));
        runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        expect(() => q.OnStart()).not.toThrow();
        await settle();
        expect(calls).toContain("notify:Hi !");
    });
});

/**
 * An objective's "On complete" output used to go nowhere. The SDK ticks the
 * objective off from its own declarative trigger and tells nobody, so anything
 * wired after it never ran — including in the shipped Investigation template.
 * The runtime now listens to the same event with the same conditions.
 */
describe("an objective's On complete output", () => {
    function objectiveProject() {
        const p = createProject();
        const q = p.quests[0];
        q.name = "Done";
        q.autoStart = true;
        const obj = node("objective", { name: "delete-it", description: "Delete the file" });
        const trigger = node("trigger.event", {
            event: "Files.Deleted",
            conditions: [{ id: "c1", join: "and", field: "name", op: "contains", value: "ledger" }],
        });
        const remember = node("fx.setData", { key: "ledger", value: "deleted" });
        const shout = node("fx.notify", { message: "gone: {{data.ledger}}", variant: "notify" });
        q.graph.nodes = [obj, trigger, remember, shout];
        q.graph.edges = [
            { id: "e1", source: trigger.id, sourceHandle: "when", target: obj.id, targetHandle: "trigger", kind: "condition" },
            { id: "e2", source: obj.id, sourceHandle: "done", target: remember.id, targetHandle: "in", kind: "flow" },
            { id: "e3", source: remember.id, sourceHandle: "out", target: shout.id, targetHandle: "in", kind: "flow" },
        ] as typeof q.graph.edges;
        return p;
    }

    async function play(payload: Record<string, unknown>) {
        const calls: string[] = [];
        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk(calls, listeners) as any;
        runMod(compileProject(objectiveProject()).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = q.CreateData();
        q.OnStart();
        q.OnObjectivesStart();
        await settle();
        for (const [event, cb] of listeners) if (event === "Files.Deleted") cb(payload);
        await settle();
        return { calls, q };
    }

    it("follows the wire when the player completes the objective", async () => {
        const { calls, q } = await play({ id: "f1", name: "ledger_q3.xlsx" });
        expect(q.Data.ledger).toBe("deleted");
        expect(calls).toContain("notify:gone: deleted");
    });

    it("stays quiet when the event does not match the objective's condition", async () => {
        const { calls, q } = await play({ id: "f2", name: "holiday-photos.zip" });
        expect(q.Data.ledger).toBeUndefined();
        expect(calls.filter((c) => c.startsWith("notify:"))).toEqual([]);
    });

    it("runs once, however many times the event fires", async () => {
        const calls: string[] = [];
        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk(calls, listeners) as any;
        runMod(compileProject(objectiveProject()).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = q.CreateData();
        q.OnObjectivesStart();
        await settle();
        for (const [event, cb] of listeners) {
            if (event !== "Files.Deleted") continue;
            cb({ name: "ledger_q3.xlsx" });
            cb({ name: "ledger_q3.xlsx" });
        }
        await settle();
        expect(calls.filter((c) => c.startsWith("notify:"))).toHaveLength(1);
    });
});

/**
 * The Standard Contract Hack template, played through: the world it builds on
 * claim, and the honesty check at the end — the client pays only if the file is
 * actually gone.
 */
describe("the contract hack template runs", () => {
    async function playTemplate(deleteTheFile: boolean) {
        const calls: string[] = [];
        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk(calls, listeners) as any;
        sdk.Shell = { ...sdk.Shell, addCommandData: (c: string, input: unknown) => calls.push(`cmd:${c}:${JSON.stringify(input)}`) };
        sdk.Files = { create: (...a: unknown[]) => calls.push(`files:${JSON.stringify(a[0])}`) };
        sdk.Bank = { transaction: (t: { amount: number }) => calls.push(`pay:${t.amount}`), getBalance: () => 0 };
        const project = getTemplate("contract-hack")!.build();
        runMod(compileProject(project).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = q.CreateData();
        q.sendMail = (i: number) => calls.push(`mail:${i}`);
        q.OnStart();
        q.OnObjectivesStart();
        await settle();
        if (deleteTheFile) {
            for (const [event, cb] of listeners) if (event === "Files.Deleted") cb({ id: "f1", name: "ledger_q3.xlsx" });
            await settle();
        }
        /* The player reports back by running the command the mod registers —
           a real SDK Command with a prompt, not a bespoke event (r70). Run it
           the way the game would. */
        const report = registered0(sdk).commands.find(
            (c: new () => { CommandName: string }) => new c().CommandName === "report",
        );
        expect(report, "the template should register a report command").toBeDefined();
        await new report!().Run({
            prompt: () => Promise.resolve("done"),
            printSuccess: () => {},
            printError: () => {},
        });
        await settle();
        return { calls, q };
    }

    it("builds the world the trail leads through", async () => {
        const { calls } = await playTemplate(false);
        expect(calls.some((c) => c.startsWith("net:45.33.32.156"))).toBe(true);
        // lynx answers for the name in the brief, whois for the domain
        expect(calls.some((c) => c.startsWith("cmd:lynx"))).toBe(true);
        expect(calls.some((c) => c.startsWith("cmd:whois"))).toBe(true);
    });

    it("hands the engine a network the file can actually be deleted from", async () => {
        const built: Record<string, unknown>[] = [];
        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        sdk.Network = {
            ...sdk.Network,
            createSubnetNetwork: (d: Record<string, unknown>) => { built.push(d); return d.ip; },
        };
        const project = getTemplate("contract-hack")!.build();
        runMod(compileProject(project).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = q.CreateData();
        q.OnStart();
        await settle();

        const router = built[0] as any;
        // The domain the whois trail resolves is a { name } object, not a bare
        // string — the engine ignores anything else, and then whois finds
        // nothing and the quest dead-ends at step two.
        expect(router.domain).toEqual({ name: "meridian-capital.net" });
        /* The router serves the website and nothing else. SSH belongs on the
           machine behind it, so the player comes in through the edge and logs
           in to somebody's PC — which is how the game plays, and how every
           network in the reference mod is shaped (r58). */
        expect(router.ports.map((p: { external: number }) => p.external)).toEqual([80]);

        const host = router.children[0];
        expect(host.ports.map((p: { external: number }) => p.external)).toContain(22);
        const user = host.users[0];
        expect(user.username).toBe("aritter");
        // The file the whole contract is about: mounted in the user's home
        // before the player ever connects, with the editor's own id stripped.
        expect(user.files).toEqual([
            expect.objectContaining({ name: "ledger_q3", extension: "xlsx" }),
            expect.objectContaining({ name: "reminders", extension: "txt" }),
        ]);
        expect(user.files[0].id).toBeUndefined();
        expect(user.acceptReverseTCP).toBe(true);
    });

    it("pays when the file is really gone", async () => {
        const { calls, q } = await playTemplate(true);
        expect(q.Data.ledger).toBe("deleted");
        expect(calls.some((c) => c.startsWith("pay:"))).toBe(true);
    });

    it("does not pay for a reply that is not true", async () => {
        const { calls, q } = await playTemplate(false);
        expect(q.Data.ledger).toBeUndefined();
        expect(calls.some((c) => c.startsWith("pay:"))).toBe(false);
    });
});

/**
 * Files on the player's own PC. A "Seed files" node aimed at the player used to
 * compile to nothing at all — the quest said it dropped a file and no file
 * appeared.
 */
describe("seeding files", () => {
    function filesProject(target: "player" | "device") {
        const p = createProject();
        const q = p.quests[0];
        q.autoStart = true;
        const entry = node("entry.start");
        const files = node("world.files", {
            target,
            ip: "10.0.0.12",
            parentPath: "~/work",
            files: [
                { id: "a", name: "brief", extension: "txt", isFolder: false, data: "read me", locked: true },
                {
                    id: "b", name: "evidence", isFolder: true,
                    children: [{ id: "c", name: "photo", extension: "png", isFolder: false, hidden: true }],
                },
            ],
        });
        q.graph.nodes = [entry, files];
        q.graph.edges = [edge(entry.id, files.id, "flow")];
        return p;
    }

    it("creates the tree on the player's machine", async () => {
        const calls: string[] = [];
        const trees: [string, unknown][] = [];
        const sdk = stubSdk(calls, []) as any;
        sdk.Files = { createTree: (parent: string, tree: unknown) => { trees.push([parent, tree]); return Promise.resolve(); } };
        runMod(compileProject(filesProject("player")).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.OnStart();
        await settle();

        expect(trees).toHaveLength(1);
        expect(trees[0][0]).toBe("~/work");
        // `locked` is the engine's `readonly`, and the editor's ids do not travel.
        expect(trees[0][1]).toEqual([
            { name: "brief", extension: "txt", data: "read me", readonly: true },
            { name: "evidence", isFolder: true, children: [{ name: "photo", extension: "png", hidden: true }] },
        ]);
    });

    it("says plainly that a remote device needs its files in the device tree", () => {
        expect(computeWarnings(filesProject("device")).join("\n")).toContain("device's own tree");
        expect(computeWarnings(filesProject("player")).join("\n")).not.toContain("device's own tree");
    });

    it("does not fall over when the game offers no Files API", async () => {
        const sdk = stubSdk([], []) as any;
        runMod(compileProject(filesProject("player")).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        expect(() => q.OnStart()).not.toThrow();
        await settle();
    });
});

/**
 * The Help Desk Leak template: the closing scene is a Sequence with a timed
 * Kisscord conversation on one of its beats, so this exercises the two newest
 * flow features through shipped content.
 */
describe("the dirhunter template runs", () => {
    it("plays its closing scene in order once the file is taken", async () => {
        const calls: string[] = [];
        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk(calls, listeners) as any;
        sdk.Kisscord = {
            sendMessage: (_channel: string, content: string) => calls.push(`kc:${String(content).slice(0, 12)}`),
        };
        sdk.Bank = { transaction: (t: { amount: number }) => calls.push(`pay:${t.amount}`), getBalance: () => 0 };
        sdk.Random = { sleep: () => Promise.resolve() };
        const project = getTemplate("dirhunter-leak")!.build();
        runMod(compileProject(project).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = q.CreateData();
        q.OnStart();
        q.OnObjectivesStart();
        await settle();

        // Nothing has happened yet: the scene waits for the download.
        expect(calls.some((c) => c.startsWith("pay:"))).toBe(false);

        for (const [event, cb] of listeners) {
            if (event === "Files.Transfer") cb({ type: "DOWNLOAD", file: { id: "f1", name: "abort-report.pdf" } });
        }
        await settle();

        expect(calls).toContain("toast:Upload complete.");
        expect(calls.some((c) => c.startsWith("kc:Got it."))).toBe(true);
        expect(calls).toContain("pay:3200");
        // in that order: confirmation, then her reading it, then the money
        expect(calls.indexOf("toast:Upload complete.")).toBeLessThan(calls.indexOf("pay:3200"));
    });

    it("ignores a download of the wrong file", async () => {
        const calls: string[] = [];
        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk(calls, listeners) as any;
        sdk.Bank = { transaction: (t: { amount: number }) => calls.push(`pay:${t.amount}`), getBalance: () => 0 };
        sdk.Random = { sleep: () => Promise.resolve() };
        runMod(compileProject(getTemplate("dirhunter-leak")!.build()).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = q.CreateData();
        q.OnObjectivesStart();
        await settle();
        for (const [event, cb] of listeners) {
            if (event === "Files.Transfer") cb({ type: "DOWNLOAD", file: { id: "f9", name: "cafeteria-menu.pdf" } });
        }
        await settle();
        expect(calls.some((c) => c.startsWith("pay:"))).toBe(false);
    });

    it("puts the report on the box, behind the account the website's clue unlocks", async () => {
        const built: any[] = [];
        const sdk = stubSdk([], []) as any;
        sdk.Network = { ...sdk.Network, createSubnetNetwork: (d: unknown) => { built.push(d); return "ip"; } };
        runMod(compileProject(getTemplate("dirhunter-leak")!.build()).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = q.CreateData();
        q.OnStart();
        await settle();

        expect(built[0].domain).toEqual({ name: "naza.gov" });
        const user = built[0].children[0].users[0];
        expect(user.username).toBe("t.reyes");
        expect(user.files.map((f: { name: string }) => f.name)).toContain("abort-report");
    });
});

/**
 * Four world nodes — Register domain, Add firewall rule, Change port and
 * Create database — used to compile to nothing at all: the export said
 * "exports as notes only" and the author's firewall simply did not exist
 * in-game. Every one of them has a real SDK call.
 */
describe("world nodes that used to be notes", () => {
    function worldProject(extra: Record<string, unknown>[]) {
        const p = createProject();
        const q = p.quests[0];
        q.autoStart = true;
        const entry = node("entry.start");
        const nodes = extra.map((e) => node(e.type as Parameters<typeof node>[0], e.data as Record<string, unknown>));
        q.graph.nodes = [entry, ...nodes];
        q.graph.edges = nodes.map((n, i) => edge(i === 0 ? entry.id : nodes[i - 1].id, n.id, "flow"));
        return p;
    }

    function worldSdk(calls: string[]) {
        const sdk = stubSdk(calls, []) as any;
        sdk.Network = {
            ...sdk.Network,
            registerDomain: (d: string, ip: string) => calls.push(`domain:${d}=${ip}`),
            removeDomain: (d: string) => calls.push(`domain-gone:${d}`),
            addFirewallRule: (ip: string, r: { port: number; allowed: boolean }) => calls.push(`fw:${ip}:${r.port}:${r.allowed}`),
            removeFirewallRule: (ip: string, port: number) => calls.push(`fw-gone:${ip}:${port}`),
            openPort: (ip: string, p: number) => calls.push(`open:${ip}:${p}`),
            closePort: (ip: string, p: number) => calls.push(`close:${ip}:${p}`),
            addPort: (ip: string, p: { external: number }) => calls.push(`addport:${ip}:${p.external}`),
            removePort: (ip: string, p: number) => calls.push(`rmport:${ip}:${p}`),
        };
        sdk.Database = {
            create: (def: { host: string; tables: Record<string, unknown[]> }) => {
                calls.push(`db:${def.host}:${Object.keys(def.tables).join("+")}`);
                return "db-1";
            },
            remove: (id: string) => calls.push(`db-gone:${id}`),
        };
        return sdk;
    }

    async function play(extra: Record<string, unknown>[]) {
        const calls: string[] = [];
        const sdk = worldSdk(calls);
        runMod(compileProject(worldProject(extra)).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = q.CreateData();
        q.OnStart();
        await settle();
        return { calls, q };
    }

    it("registers a domain, and takes it away with the quest", async () => {
        const { calls, q } = await play([
            { type: "world.domain", data: { domain: "meridian-capital.net", ip: "45.33.32.156", vulnerabilities: [], removeOnComplete: true } },
        ]);
        expect(calls).toContain("domain:meridian-capital.net=45.33.32.156");
        q.OnComplete();
        expect(calls).toContain("domain-gone:meridian-capital.net");
    });

    it("adds a firewall rule and removes exactly that rule afterwards", async () => {
        const { calls, q } = await play([
            { type: "world.firewall", data: { ip: "10.0.0.1", rule: { id: "r", allowed: false, port: 22, source: "*" }, removeOnComplete: true } },
        ]);
        expect(calls).toContain("fw:10.0.0.1:22:false");
        q.OnAbandon();
        expect(calls).toContain("fw-gone:10.0.0.1:22");
    });

    it("opens, closes, adds and removes ports", async () => {
        const { calls } = await play([
            { type: "world.port", data: { ip: "10.0.0.2", action: "open", port: { id: "p", external: 22, internal: 22, active: true } } },
            { type: "world.port", data: { ip: "10.0.0.2", action: "close", port: { id: "p", external: 80, internal: 80, active: true } } },
            { type: "world.port", data: { ip: "10.0.0.2", action: "add", port: { id: "p", external: 8080, internal: 8080, active: true, service: "http" } } },
            { type: "world.port", data: { ip: "10.0.0.2", action: "remove", port: { id: "p", external: 21, internal: 21, active: true } } },
        ]);
        expect(calls).toEqual(expect.arrayContaining([
            "open:10.0.0.2:22", "close:10.0.0.2:80", "addport:10.0.0.2:8080", "rmport:10.0.0.2:21",
        ]));
    });

    it("puts a port back the way it found it when asked", async () => {
        const { calls, q } = await play([
            { type: "world.port", data: { ip: "10.0.0.2", action: "open", port: { id: "p", external: 22, internal: 22, active: true }, restoreOnComplete: true } },
        ]);
        q.OnComplete();
        expect(calls).toEqual(["open:10.0.0.2:22", "close:10.0.0.2:22"]);
    });

    it("creates a database with its tables", async () => {
        const { calls, q } = await play([
            {
                type: "world.database",
                data: {
                    host: "db.meridian-capital.net", user: "root", password: "hunter2",
                    tables: [
                        { id: "t1", name: "employees", rows: [{ name: "A. Ritter", role: "compliance" }] },
                        { id: "t2", name: "payments", rows: [] },
                    ],
                    removeOnComplete: true,
                },
            },
        ]);
        expect(calls).toContain("db:db.meridian-capital.net:employees+payments");
        q.OnComplete();
        expect(calls).toContain("db-gone:db-1");
    });

    it("no longer tells the author these nodes are decorative", () => {
        const warnings = computeWarnings(worldProject([
            { type: "world.domain", data: { domain: "x.net", ip: "1.2.3.4", vulnerabilities: [] } },
            { type: "world.port", data: { ip: "1.2.3.4", action: "open", port: { id: "p", external: 22, internal: 22, active: true } } },
            { type: "world.database", data: { host: "db.x.net", user: "r", password: "p", tables: [] } },
        ]));
        expect(warnings.join("\n")).not.toContain("notes only");
    });

    it("but does say when a port or rule has no machine to act on", () => {
        const warnings = computeWarnings(worldProject([
            { type: "world.port", data: { ip: "", action: "open", port: { id: "p", external: 22, internal: 22, active: true } } },
        ]));
        expect(warnings.join("\n")).toContain("has nothing to act on");
    });

    it("survives a game build without these APIs", async () => {
        const sdk = stubSdk([], []) as any;
        const p = worldProject([
            { type: "world.domain", data: { domain: "x.net", ip: "1.2.3.4", vulnerabilities: [] } },
            { type: "world.database", data: { host: "db.x.net", user: "r", password: "p", tables: [] } },
        ]);
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        expect(() => q.OnStart()).not.toThrow();
        await settle();
        expect(() => q.OnComplete()).not.toThrow();
    });
});

/**
 * QA screenshot, round 34: the Ledger quest auto-started, its objective appeared
 * in the journal, and then nothing — no briefing mail, no contract. The cause
 * was a Tool response node calling `Shell.addCommandData` with the wrong
 * arguments; it threw inside the engine, the flow chain died, and the mail two
 * nodes later never went out.
 *
 * Two fixes, tested here: the call is right, and a node that throws can no
 * longer take the rest of the quest with it.
 */
describe("tool responses speak the SDK's actual signature", () => {
    function toolProject(data: Record<string, unknown>) {
        const p = createProject();
        const q = p.quests[0];
        q.autoStart = true;
        const entry = node("entry.start");
        const tool = node("world.toolResponse", data);
        const after = node("fx.notify", { message: "still running", variant: "notify" });
        q.graph.nodes = [entry, tool, after];
        q.graph.edges = [edge(entry.id, tool.id, "flow"), edge(tool.id, after.id, "flow")];
        return p;
    }

    async function play(data: Record<string, unknown>, shell?: Record<string, unknown>) {
        const calls: string[] = [];
        const added: [string, unknown, unknown][] = [];
        const sdk = stubSdk(calls, []) as any;
        sdk.Shell = {
            addCommandData: (c: string, input: unknown, d: unknown) => {
                added.push([c, input, d]);
                if (d === undefined) throw new Error("[ContentSDK] addCommandData: data is required");
            },
            removeCommandData: (c: string, input: unknown) => calls.push(`rm:${c}:${JSON.stringify(input)}`),
            ...shell,
        };
        runMod(compileProject(toolProject(data)).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = q.CreateData();
        q.OnStart();
        await settle();
        return { calls, added, q };
    }

    it("keys the response by what the player types, and sends a shape as the data", async () => {
        const { added } = await play({
            command: "whois",
            input: "meridian-capital.net",
            dataText: "Domain: meridian-capital.net\nIP: 45.33.32.156\nRegistrant: Meridian Capital AG\nEmail: hostmaster@meridian-capital.net",
            removeOnComplete: true,
        });
        expect(added).toHaveLength(1);
        const [command, input, data] = added[0];
        expect(command).toBe("whois");
        expect(input).toBe("meridian-capital.net"); // NOT the response text
        expect(data).toEqual({
            domain: "meridian-capital.net",
            ip: "45.33.32.156",
            contact: "Meridian Capital AG",
            email: "hostmaster@meridian-capital.net",
            status: true,
        });
    });

    it("turns an OSINT block into the lynx shape", async () => {
        const { added } = await play({
            command: "lynx",
            input: "Anselm Ritter",
            dataText: "Name: Anselm Ritter\nWeb: https://meridian-capital.net\nEmail: a.ritter@meridian-capital.net\nSocial: @a_ritter_mc",
        });
        const data = added[0][2] as { contact?: { emails?: string[] }; socialMedia?: string[]; additional?: unknown[] };
        expect(data.contact?.emails).toEqual(["a.ritter@meridian-capital.net"]);
        expect(data.socialMedia).toEqual(["@a_ritter_mc"]);
        expect(data.additional).toContainEqual({ name: "Anselm Ritter" });
    });

    it("reads a port table as nmap's own shape", async () => {
        const { added } = await play({
            command: "nmap",
            input: "45.33.32.156",
            dataText: "22 open ssh OpenSSH 7.2\n80 open http nginx 1.18\n3306 closed mysql",
        });
        expect(added[0][2]).toEqual([
            { port: 22, status: "OPEN", service: "ssh", version: "OpenSSH 7.2" },
            { port: 80, status: "OPEN", service: "http", version: "nginx 1.18" },
            { port: 3306, status: "CLOSE", service: "mysql" },
        ]);
    });

    it("passes JSON straight through for anyone who wants exact control", async () => {
        const { added } = await play({
            command: "ping",
            input: "10.0.0.4",
            dataText: '{"anything":"goes"}',
        });
        expect(added[0][2]).toEqual({ anything: "goes" });
    });

    it("keys hydra by the user/target pair the SDK expects", async () => {
        const { added } = await play({
            command: "hydra",
            input: "",
            inputUser: "root",
            inputTarget: "10.0.0.4",
            dataText: "Username: root\nPassword: hunter2",
        });
        expect(added[0][1]).toEqual({ user: "root", target: "10.0.0.4" });
        expect(added[0][2]).toEqual({ credentials: { username: "root", password: "hunter2" } });
    });

    it("takes the response away again when the quest ends", async () => {
        const { calls, q } = await play({ command: "whois", input: "x.net", dataText: "IP: 1.2.3.4", removeOnComplete: true });
        q.OnComplete();
        expect(calls).toContain('rm:whois:"x.net"');
    });

    it("keeps the story going when a node throws", async () => {
        // The exact QA failure: the tool call blows up, and the mail after it
        // must still be sent.
        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        sdk.Shell = { addCommandData: () => { throw new Error("engine said no"); } };
        runMod(compileProject(toolProject({ command: "whois", input: "x.net", dataText: "IP: 1.2.3.4" })).files
            .find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = q.CreateData();
        expect(() => q.OnStart()).not.toThrow();
        await settle();
        expect(calls).toContain("notify:still running");
    });
});

describe("other calls that never matched the SDK", () => {
    async function playOne(type: Parameters<typeof node>[0], data: Record<string, unknown>, sdkPatch: (s: any, calls: string[]) => void) {
        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        sdkPatch(sdk, calls);
        const p = createProject();
        p.quests[0].autoStart = true;
        const entry = node("entry.start");
        const target = node(type, data);
        p.quests[0].graph.nodes = [entry, target];
        p.quests[0].graph.edges = [edge(entry.id, target.id, "flow")];
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = q.CreateData();
        q.OnStart();
        await settle();
        return calls;
    }

    it("runs a shell command through exec(), the name the SDK actually has", async () => {
        const calls = await playOne("fx.shell", { command: "echo hi >> ~/notes.txt" }, (sdk, c) => {
            sdk.Shell = { exec: (cmd: string) => { c.push(`exec:${cmd}`); return Promise.resolve(); } };
        });
        expect(calls).toContain("exec:echo hi >> ~/notes.txt");
    });

    it("claims the quest named in the node, not an undefined field", async () => {
        const calls = await playOne("fx.claimQuest", { questName: "NextJob" }, (sdk, c) => {
            sdk.Quest.claim = (name: string) => c.push(`claim:${name}`);
        });
        expect(calls).toContain("claim:NextJob");
    });

    it("gives a toast its tone", async () => {
        const calls = await playOne("fx.notify", { message: "careful", variant: "toast", tone: "warning" }, (sdk, c) => {
            sdk.UI = { toast: (m: string, t: string) => c.push(`toast:${m}:${t}`), notify: () => {} };
        });
        expect(calls).toContain("toast:careful:warning");
    });
});

/**
 * QA, round 37. The Ledger quest called `sendMail(0, "i.faber@ghostmail.io")`
 * — verified by running the author's own exported mod against a stub engine —
 * and no mail ever arrived in-game, through two rounds of fixes.
 *
 * The answer came from reading a working quest mod by another author
 * (Nemesis) side by side with ours: it never uses Quest.Mails or
 * this.sendMail at all. Every mail it sends, briefing included, goes out
 * through the global `Mail.send({ from, subject, content })`. So that is the
 * path taken first here; the quest-scoped call is kept only as a fallback for
 * a build that has no Mail.send.
 */
describe("a briefing mail that actually arrives", () => {
    function mailProject(replyable = false) {
        const p = createProject();
        const q = p.quests[0];
        q.autoStart = true;
        const entry = node("entry.start");
        const mail = node("comms.dialogue", {
            kind: "mail",
            mail: { from: "i.faber@ghostmail.io", subject: "One file", content: "<p>Get it done.</p>", replyable },
        });
        q.graph.nodes = [entry, mail];
        q.graph.edges = [edge(entry.id, mail.id, "flow")];
        return p;
    }

    function engineWithMailSend(calls: string[]) {
        const inbox: { id: string; subject: string }[] = [];
        const sdk = stubSdk(calls, []) as any;
        sdk.Mail = {
            getInbox: () => inbox,
            getPlayerEmail: () => "player@gomail.com",
            send: (m: { subject: string; from?: string; to?: string }) => {
                calls.push(`Mail.send:${m.subject}:${m.from}:${m.to}`);
                inbox.push({ id: "d", subject: m.subject });
            },
        };
        return { sdk, inbox };
    }

    function modJs(replyable = false) {
        return compileProject(mailProject(replyable)).files.find((f) => f.path === "dist/mod.js")!.content;
    }

    it("keeps the mail's reply flag, which the engine needs to allow a reply", () => {
        const sdk = stubSdk([], []) as any;
        runMod(modJs(true), sdk);
        const q = new (registered0(sdk).quests[0])();
        expect(q.Mails[0]).toMatchObject({ title: "One file", replyable: true });
    });

    it("sends a replyable mail the only way that can carry a reply flag", async () => {
        /* MailDefinition (Mail.send) has no replyable field at all;
           QuestMailDefinition (Quest.sendMail) is the only shape that does. A
           mail the author marked replyable therefore has to take that path,
           even though Mail.send is the default for everything else. */
        const calls: string[] = [];
        const { sdk } = engineWithMailSend(calls);
        runMod(modJs(true), sdk);
        const q = new (registered0(sdk).quests[0])();
        q.sendMail = (i: number) => calls.push(`sendMail:${i}`);
        q.OnStart();
        await settle();
        expect(calls).toContain("sendMail:0");
        expect(calls.filter((c) => c.startsWith("Mail.send:"))).toEqual([]);
    });

    it("falls back to Mail.send when the engine has no copy to reply to", async () => {
        // Better a mail without its Reply button than no mail at all.
        const calls: string[] = [];
        const { sdk } = engineWithMailSend(calls);
        const said: string[] = [];
        const spy = vi.spyOn(console, "log").mockImplementation((m: unknown) => void said.push(String(m)));
        runMod(modJs(true), sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Mails = []; // the engine never took ours
        q.sendMail = (i: number) => calls.push(`sendMail:${i}`);
        q.OnStart();
        await settle();
        spy.mockRestore();
        expect(calls.some((c) => c.startsWith("Mail.send:"))).toBe(true);
        expect(said.join("\n")).toContain("no Reply button will appear");
    });

    it("sends through Mail.send, addressed from the sender to the player", async () => {
        const calls: string[] = [];
        const { sdk } = engineWithMailSend(calls);
        const said: string[] = [];
        const spy = vi.spyOn(console, "log").mockImplementation((m: unknown) => void said.push(String(m)));
        runMod(modJs(), sdk);
        const q = new (registered0(sdk).quests[0])();
        q.sendMail = (i: number) => calls.push(`sendMail:${i}`);
        q.OnStart();
        await new Promise((r) => setTimeout(r, 1700));
        spy.mockRestore();

        expect(calls).toContain("Mail.send:One file:i.faber@ghostmail.io:player@gomail.com");
        // the path that QA proved silent is not used when Mail.send exists
        expect(calls.filter((c) => c.startsWith("sendMail:"))).toEqual([]);
        expect(said.join("\n")).toContain('mail "One file" sent via Mail.send');
        expect(said.join("\n")).toContain('mail "One file" delivered');
    });

    it("falls back to the quest's own sendMail when the build has no Mail.send", async () => {
        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        sdk.Mail = {}; // an engine without the global mail API
        const said: string[] = [];
        const spy = vi.spyOn(console, "log").mockImplementation((m: unknown) => void said.push(String(m)));
        runMod(modJs(), sdk);
        const q = new (registered0(sdk).quests[0])();
        q.sendMail = (i: number, from: string) => calls.push(`sendMail:${i}:${from}`);
        q.OnStart();
        await new Promise((r) => setTimeout(r, 1700));
        spy.mockRestore();

        expect(calls).toContain("sendMail:0:i.faber@ghostmail.io");
        expect(said.join("\n")).toContain("sent via Quest.sendMail(0)");
    });

    it("reports a mail the engine accepted but never delivered", async () => {
        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        sdk.Mail = {
            getInbox: () => [],
            getPlayerEmail: () => "player@gomail.com",
            send: (m: { subject: string }) => calls.push(`Mail.send:${m.subject}`),
        };
        const said: string[] = [];
        const spy = vi.spyOn(console, "log").mockImplementation((m: unknown) => void said.push(String(m)));
        runMod(modJs(), sdk);
        const q = new (registered0(sdk).quests[0])();
        q.OnStart();
        await new Promise((r) => setTimeout(r, 1700));
        spy.mockRestore();

        expect(said.join("\n")).toContain("is not in the inbox");
    });

    it("still binds the instance the engine is actually running", async () => {
        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        sdk.Mail = {}; // force the quest-scoped path so the binding is observable
        runMod(modJs(), sdk);
        const Cls = registered0(sdk).quests[0];
        const dead = new Cls();
        const live = new Cls();
        dead.sendMail = () => calls.push("sendMail:DEAD");
        live.sendMail = (i: number) => calls.push(`sendMail:LIVE:${i}`);
        const other = new Cls();
        other.sendMail = () => calls.push("sendMail:OTHER");
        live.OnStart();
        await settle();
        expect(calls).toContain("sendMail:LIVE:0");
        expect(calls).not.toContain("sendMail:OTHER");
        expect(calls).not.toContain("sendMail:DEAD");
    });
});

/**
 * QA, round 38. Round 37 changed how mail is sent and the mail still did not
 * arrive - because the mod was never running at all. The game log named every
 * other installed mod's load banner and ours was simply absent, with no error
 * beside it.
 *
 * Two things separate our output from a hand-written mod that does load, and
 * both are covered here. A mod's Bootstrap class has to come back out on the
 * module's default export - that is what esbuild produces from
 * `export default class extends Bootstrap`, and calling RegisterModPackage
 * without it gets the mod skipped in silence. And a mod that says nothing when
 * it loads cannot be told apart from a mod that never loaded, which is what
 * cost three rounds.
 */
describe("a mod the loader can actually find", () => {
    function anyMod() {
        return compileProject(scenarioProject()).files.find((f) => f.path === "dist/mod.js")!.content;
    }

    it("hands the Bootstrap class back on the default export", () => {
        const sdk = stubSdk([], []) as any;
        const exported = runMod(anyMod(), sdk);
        expect(exported.default).toBeTypeOf("function");
        expect(exported.__esModule).toBe(true);
        // the same class the mod registered, not some other object
        expect(exported.default).toBe(sdk.__registered.mod);
        expect(Object.getPrototypeOf(exported.default)).toBe(sdk.Bootstrap);
    });

    it("announces itself in the game log, with name, version and build", () => {
        const sdk = stubSdk([], []) as any;
        const said: string[] = [];
        const spy = vi.spyOn(console, "log").mockImplementation((m: unknown) => void said.push(String(m)));
        const exported = runMod(anyMod(), sdk);
        new exported.default().OnModPackageLoaded();
        spy.mockRestore();
        const line = said.find((l) => l.includes("loaded (editor build"));
        expect(line).toBeDefined();
        expect(line).toContain(EDITOR_BUILD);
    });
});

/**
 * QA, round 39. With the mod finally loading, the briefing mail arrived — and
 * showed its markup: the body read "<p>His name is <b>Anselm Ritter</b>."
 * on screen. GoMail prints the body verbatim; the editor's mail field is a
 * rich-text box that produces HTML. Nemesis, whose mail reads correctly, sends
 * plain text with blank lines between paragraphs.
 */
describe("mail bodies read as prose, not markup", () => {
    function mailWith(content: string) {
        const p = createProject();
        const q = p.quests[0];
        q.autoStart = true;
        const entry = node("entry.start");
        const mail = node("comms.dialogue", {
            kind: "mail",
            mail: { from: "i.faber@ghostmail.io", subject: "Brief", content },
        });
        q.graph.nodes = [entry, mail];
        q.graph.edges = [edge(entry.id, mail.id, "flow")];
        return compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content;
    }

    async function sentBody(content: string) {
        const sent: { content: string }[] = [];
        const sdk = stubSdk([], []) as any;
        sdk.Mail = {
            getInbox: () => [],
            getPlayerEmail: () => "player@gomail.com",
            send: (m: { content: string }) => sent.push(m),
        };
        runMod(mailWith(content), sdk);
        const q = new (registered0(sdk).quests[0])();
        q.OnStart();
        await settle();
        return sent[0]?.content ?? "";
    }

    it("turns the rich-text editor's paragraphs into blank-line-separated prose", async () => {
        const body = await sentBody(
            "<p>His name is <b>Anselm Ritter</b>.</p><p>Delete <b>ledger_q3.xlsx</b>.</p>",
        );
        expect(body).toBe("His name is Anselm Ritter.\n\nDelete ledger_q3.xlsx.");
        expect(body).not.toContain("<");
    });

    it("keeps line breaks, bullets and entities readable", async () => {
        const body = await sentBody(
            "<p>Line one<br>Line two</p><ul><li>first</li><li>second</li></ul><p>Tom &amp; Jerry &quot;quoted&quot; &lt;tag&gt;</p>",
        );
        expect(body).toContain("Line one\nLine two");
        expect(body).toContain("\u2022 first");
        expect(body).toContain('Tom & Jerry "quoted" <tag>');
    });

    it("leaves a plain-text body exactly as the author typed it", async () => {
        const body = await sentBody("Just text.\n\nSecond paragraph.");
        expect(body).toBe("Just text.\n\nSecond paragraph.");
    });

    it("previews in the inspector exactly what the runtime will send", async () => {
        // The editor's preview and the generated mod must not drift apart:
        // the whole bug was a preview that rendered HTML the game showed raw.
        const samples = [
            "<p>His name is <b>Anselm Ritter</b>.</p><p>Delete it.</p>",
            "<p>Line one<br>Line two</p><ul><li>a</li><li>b</li></ul>",
            "Tom &amp; Jerry said &quot;hi&quot;",
            "plain text, no markup",
        ];
        for (const sample of samples) {
            expect(mailBodyText(sample)).toBe(await sentBody(sample));
        }
    });

    it("declares the quest's own Mails as text too", () => {
        const sdk = stubSdk([], []) as any;
        runMod(mailWith("<p>Hello <i>there</i>.</p>"), sdk);
        const q = new (registered0(sdk).quests[0])();
        expect(q.Mails[0].content).toBe("Hello there.");
    });
});

/**
 * QA, round 39. Reading the contract mail did not tick "Read the contract" off
 * the objective list. The objective carried a declarative
 * QuestObjectiveDefinition.trigger, which this build does not appear to act on
 * — the same shape of fault as the mail bug. The SDK's own Quest example
 * completes objectives imperatively from an event listener, so the runtime now
 * does both.
 */
describe("objectives the player completes by playing", () => {
    function questWithTriggeredObjective(withDoneWire: boolean) {
        const p = createProject();
        const q = p.quests[0];
        q.autoStart = true;
        const obj = node("objective", { name: "read-brief", description: "Read the contract" });
        const trig = node("trigger.event", {
            event: "Mail.Read",
            conditions: [{ id: "c1", join: "and", field: "subject", op: "contains", value: "One file" }],
        });
        const after = node("fx.notify", { message: "on you go", variant: "toast", tone: "info" });
        q.graph.nodes = [obj, trig, after];
        q.graph.edges = [
            edge(trig.id, obj.id, "condition"),
            ...(withDoneWire ? [{ ...edge(obj.id, after.id, "flow"), sourceHandle: "done" }] : []),
        ];
        return compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content;
    }

    /** A stub whose Events.on records listeners so a game event can be fired. */
    function listeningQuest(modJs: string, calls: string[]) {
        const sdk = stubSdk(calls, []) as any;
        sdk.UI = { toast: (m: string) => calls.push(`toast:${m}`), notify: () => {} };
        runMod(modJs, sdk);
        const listeners: Record<string, ((d: unknown) => void)[]> = {};
        const q = new (registered0(sdk).quests[0])();
        q.Events = {
            on: (ev: string, fn: (d: unknown) => void) => {
                (listeners[ev] ??= []).push(fn);
            },
        };
        q.completeObjective = (name: string) => calls.push(`completeObjective:${name}`);
        q.OnObjectivesStart();
        return { fire: (ev: string, d: unknown) => (listeners[ev] ?? []).forEach((f) => f(d)) };
    }

    it("ticks the objective off when its trigger event matches", async () => {
        const calls: string[] = [];
        const { fire } = listeningQuest(questWithTriggeredObjective(false), calls);
        fire("Mail.Read", { subject: "One file, one man, no trace" });
        await settle();
        expect(calls).toContain("completeObjective:read-brief");
    });

    it("leaves it alone when the conditions do not match", async () => {
        const calls: string[] = [];
        const { fire } = listeningQuest(questWithTriggeredObjective(false), calls);
        fire("Mail.Read", { subject: "something else entirely" });
        await settle();
        expect(calls.filter((c) => c.startsWith("completeObjective"))).toEqual([]);
    });

    it("ticks it off exactly once, however often the event fires", async () => {
        const calls: string[] = [];
        const { fire } = listeningQuest(questWithTriggeredObjective(false), calls);
        fire("Mail.Read", { subject: "One file" });
        fire("Mail.Read", { subject: "One file" });
        fire("Mail.Read", { subject: "One file" });
        await settle();
        expect(calls.filter((c) => c === "completeObjective:read-brief")).toHaveLength(1);
    });

    it("still follows the On complete wire after ticking it off", async () => {
        const calls: string[] = [];
        const { fire } = listeningQuest(questWithTriggeredObjective(true), calls);
        fire("Mail.Read", { subject: "One file" });
        await settle();
        expect(calls).toContain("completeObjective:read-brief");
        expect(calls).toContain("toast:on you go");
    });

    it("keeps declaring the SDK trigger as well, in case the build honours it", () => {
        const sdk = stubSdk([], []) as any;
        runMod(questWithTriggeredObjective(false), sdk);
        const q = new (registered0(sdk).quests[0])();
        expect(q.Objectives[0].trigger.event).toBe("Mail.Read");
        expect(q.Objectives[0].trigger.condition({ subject: "One file" })).toBe(true);
        expect(q.Objectives[0].trigger.condition({ subject: "nope" })).toBe(false);
    });
});

/**
 * QA, round 40 — audit against Nemesis.
 *
 * The SDK's device definition is a discriminated union: `children` belongs to
 * Router and Splitter, `rules` to Firewall, `model`/`accessable` to Router. We
 * were attaching all of them to every device, so a plain DEVICE shipped with an
 * empty `children` array and an empty `rules` array. Nemesis — which builds far
 * bigger networks than any of our templates — never does this: its DEVICE
 * objects carry only ip/type/name/users/ports/rootFiles/domain.
 */
describe("network devices match the SDK's union, arm by arm", () => {
    function networkProject(device: Record<string, unknown>) {
        const p = createProject();
        const q = p.quests[0];
        q.autoStart = true;
        const entry = node("entry.start");
        const net = node("world.network", { ipMode: "fixed", destroyOnComplete: true, device });
        q.graph.nodes = [entry, net];
        q.graph.edges = [edge(entry.id, net.id, "flow")];
        return compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content;
    }

    /* runFlow is async, so the node runs a microtask after OnStart returns. */
    async function built(device: Record<string, unknown>) {
        const made: any[] = [];
        const sdk = stubSdk([], []) as any;
        sdk.Network.createSubnetNetwork = (d: unknown) => { made.push(d); return (d as any).ip; };
        runMod(networkProject(device), sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = {};
        q.OnStart();
        await settle();
        expect(made).toHaveLength(1);
        return made[0];
    }

    const leaf = { id: "d2", ip: "10.0.0.12", name: "workstation", type: "DEVICE", users: [], ports: [], rules: [], children: [] };

    it("does not give a plain device children or rules", async () => {
        const root = await built({
            id: "d1", ip: "45.33.32.156", name: "edge", type: "ROUTER", model: "MikroTik",
            accessable: true, users: [], ports: [], rules: [], children: [leaf],
        });
        const child = root.children[0];
        expect(child.type).toBe("DEVICE");
        expect(child).not.toHaveProperty("children");
        expect(child).not.toHaveProperty("rules");
        // and it keeps everything a device is allowed to have
        expect(Object.keys(child).sort()).toEqual(["ip", "name", "ports", "type", "users"]);
    });

    it("keeps children on a router and a splitter", async () => {
        const root = await built({
            id: "d1", ip: "1.1.1.1", type: "ROUTER", users: [], ports: [], children: [
                { id: "s", ip: "1.1.1.2", type: "SPLITTER", users: [], ports: [], children: [leaf] },
            ],
        });
        expect(root.children[0].type).toBe("SPLITTER");
        expect(root.children[0].children).toHaveLength(1);
    });

    it("gives rules only to a firewall, and router-only fields only to a router", async () => {
        const root = await built({
            id: "d1", ip: "1.1.1.1", type: "ROUTER", model: "MikroTik", accessable: true,
            users: [], ports: [], rules: [{ allowed: false, port: 22, source: "*", destination: "10.0.0.9" }],
            children: [
                { id: "f", ip: "1.1.1.3", type: "FIREWALL", model: "nope", accessable: true, users: [], ports: [],
                  rules: [{ allowed: false, port: 22, source: "*", destination: "10.0.0.9" }] },
            ],
        });
        // the router keeps model/accessable but loses the rules it cannot enforce
        expect(root.model).toBe("MikroTik");
        expect(root.accessable).toBe(true);
        expect(root).not.toHaveProperty("rules");
        // the firewall keeps its rules but not the router-only fields
        const fw = root.children[0];
        expect(fw.rules).toHaveLength(1);
        expect(fw).not.toHaveProperty("model");
        expect(fw).not.toHaveProperty("accessable");
    });

    it("warns when a device is carrying machines or rules it cannot keep", () => {
        const p = createProject();
        p.quests[0].autoStart = true;
        p.quests[0].graph.nodes = [node("world.network", {
            ipMode: "fixed", destroyOnComplete: true,
            device: { id: "d1", ip: "1.1.1.1", name: "box", type: "DEVICE", users: [], ports: [],
                      rules: [{ allowed: false, port: 22, source: "*", destination: "x" }],
                      children: [leaf] },
        })];
        const w = computeWarnings(p).join("\n");
        expect(w).toContain("only a router or a splitter can hold other machines");
        expect(w).toContain("only a firewall device enforces them");
    });
});

/**
 * QA, round 40. `Website.Icon` is declared abstract in the SDK, and every
 * website in Nemesis sets it — including to the empty string. We never set it
 * at all, and an absent abstract member is the shape of fault that cost rounds
 * 35–38.
 */
describe("generated websites set every member the SDK declares abstract", () => {
    it("sets SiteName, Host, Pages and Icon", () => {
        const p = createProject();
        p.websites = [{ id: "w1", host: "meridian-capital.net", name: "Meridian", pages: [
            { id: "p1", path: "/", title: "Home", seo: true, content: "<h1>hi</h1>" },
        ] }];
        const sdk = stubSdk([], []) as any;
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const site = new (registered0(sdk).websites[0])();
        expect(site.SiteName).toBe("Meridian");
        expect(site.Host).toBe("meridian-capital.net");
        expect(site.Pages).toHaveLength(1);
        expect(site.Icon).toBeDefined();
    });
});

/**
 * QA, round 41 — the bug behind rounds 35-40.
 *
 * The game log for a fresh r40 export showed:
 *
 *   Mod "null" tried to use Network.createSubnetNetwork without "network"
 *   permission. Add "network" to the permissions array in your manifest.json.
 *
 * ...for network, shell AND mail — even though manifest.json at the project
 * root declared all three. The mod had no name at permission-check time, which
 * is the giveaway: the loader had not found a manifest for it at all.
 *
 * The SDK's own build script explains why. `prepareDist()` in
 * @hotbunny/hackhub-content-sdk/build.mjs copies manifest.json into `dist/`
 * before bundling, so the manifest ends up NEXT TO the bundle. Nemesis, which
 * works in-game, ships manifest.json and mod.js side by side. We only ever
 * wrote the root copy, so the game loaded `dist/mod.js` with no manifest
 * attached: no name, no permissions, and every Network/Shell/Mail call refused.
 *
 * This is what stopped the network being built and the objectives ticking. The
 * r37 Mail.send -> Quest.sendMail fallback kept delivering the mail anyway,
 * which masked it for three rounds.
 */
describe("the exported mod carries its manifest where the loader looks", () => {
    const built = compileProject(getTemplate("contract-hack")!.build());
    const at = (p: string) => built.files.find((f) => f.path === p);

    it("writes manifest.json beside the bundle, not only at the project root", () => {
        expect(at("manifest.json")).toBeDefined();
        expect(at("dist/manifest.json")).toBeDefined();
        expect(at("dist/mod.js")).toBeDefined();
    });

    it("ships the two copies identical, so neither can drift", () => {
        expect(at("dist/manifest.json")!.content).toBe(at("manifest.json")!.content);
    });

    it("grants every permission the mod's own code needs", () => {
        const m = JSON.parse(at("dist/manifest.json")!.content);
        const js = at("dist/mod.js")!.content;
        // Whatever the compiler emits calls, the manifest has to allow.
        const needed: [string, RegExp][] = [
            ["network", /sdk\.Network\./],
            ["shell", /sdk\.Shell\./],
            ["mail", /sdk\.Mail\.|questRef\.sendMail/],
            ["ui", /sdk\.UI\./],
            ["events", /sdk\.Events\.|\.Events\.on/],
        ];
        for (const [perm, used] of needed) {
            if (used.test(js)) expect(m.permissions).toContain(perm);
        }
    });

    it("uses only permission names the SDK's ModPermission union allows", () => {
        const valid = ["filesystem", "network", "events", "mail", "bank", "shell", "ui"];
        const m = JSON.parse(at("dist/manifest.json")!.content);
        for (const p of m.permissions) expect(valid).toContain(p);
    });

    it("declares the manifest fields the working reference mod declares", () => {
        const m = JSON.parse(at("dist/manifest.json")!.content);
        // Matches Nemesis's manifest, which this build loads correctly.
        for (const k of ["id", "name", "version", "author", "description", "apiVersion", "permissions", "dependencies"]) {
            expect(m).toHaveProperty(k);
        }
        expect(typeof m.id).toBe("string");
        expect(m.id.length).toBeGreaterThan(0);
        expect(typeof m.name).toBe("string");
        expect(m.name.length).toBeGreaterThan(0);
        expect(Array.isArray(m.dependencies)).toBe(true);
    });
});

/**
 * QA, round 43 — the real cause of `Mod "null"`.
 *
 * r41 shipped manifest.json next to the bundle, which the SDK's own build
 * script does. It made no difference: the game still logged
 *
 *   Mod "null" tried to use Network.createSubnetNetwork without "network"
 *   permission.
 *
 * ...for network, shell and mail, with a manifest that declared all three.
 *
 * The difference is in the SHAPE and ORDER of the CommonJS export. esbuild —
 * which every hand-written mod is built with — installs module.exports as a
 * lazy getter at the very TOP of the bundle, thousands of lines before any
 * class is registered:
 *
 *     module.exports = __toCommonJS({ default: () => NemesisProtocolStage1 });
 *     ... 3500 lines ...
 *     NemesisProtocolStage1 = __decorateClass([RegisterModPackage], ...);
 *
 * The loader reads `module.exports.default` to learn which mod it is loading,
 * and it does so before the registration calls take effect. We assigned a plain
 * object at the END, after every RegisterQuest/RegisterWebsite/RegisterCommand
 * call had already run — so at registration time the loader had nothing bound,
 * every call was attributed to `Mod "null"`, and the permission check had no
 * manifest to consult.
 */
describe("the bundle identifies itself before it registers anything", () => {
    const js = compileProject(getTemplate("contract-hack")!.build())
        .files.find((f) => f.path === "dist/mod.js")!.content;

    const exportAt = js.indexOf("module.exports");
    /* The Register* calls sit inside __qeRegisterProject's body, so their text
       position says nothing about when they run. What matters is the one
       top-level statement that invokes it. */
    const registrationRuns = js.indexOf("__QE_MOD = __qeRegisterProject(sdk, PROJECT)");

    it("installs module.exports before the first Register call runs", () => {
        expect(exportAt).toBeGreaterThan(-1);
        expect(registrationRuns).toBeGreaterThan(-1);
        expect(exportAt).toBeLessThan(registrationRuns);
    });

    it("registers nothing at the top level except through that one call", () => {
        // Anything calling sdk.Register* outside the function body would run
        // at an unknown point relative to the export.
        for (const line of js.split("\n")) {
            if (/^sdk\.Register/.test(line)) throw new Error("top-level registration: " + line);
        }
    });

    it("exposes default as a getter, the way esbuild does", () => {
        // A plain value would be captured before the Bootstrap class exists;
        // the getter lets the loader read it whenever it likes.
        expect(js).toMatch(/Object\.defineProperty\([^)]*"default"|get:\s*function/);
        expect(js).toContain("__esModule");
    });

    it("still hands the loader the Bootstrap class", async () => {
        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        const exports = runMod(js, sdk);
        expect(exports.__esModule).toBe(true);
        expect(typeof exports.default).toBe("function");
        // and it is the class RegisterModPackage was given
        const inst = new exports.default();
        expect(typeof inst.OnModPackageLoaded).toBe("function");
    });

    it("announces itself on load, so a silent failure is visible", async () => {
        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        const exports = runMod(js, sdk);
        const said: string[] = [];
        const orig = console.log;
        console.log = (...a: unknown[]) => void said.push(a.map(String).join(" "));
        try {
            await new exports.default().OnModPackageLoaded();
        } finally {
            console.log = orig;
        }
        expect(said.join("\n")).toContain("loaded (editor build");
    });
});

/**
 * QA, round 45 — why the mod kept losing its permissions.
 *
 * The engine treats a mod as "current" only while it is inside a call it made:
 * OnStart, OnObjectivesStart, an event handler. The moment one of those
 * returns, the mod has no identity, and any SDK call after that is attributed
 * to `Mod "null"` and refused. The game log said exactly this, in this order:
 *
 *     quest "TheLedgerContract7" started (1 entry point)
 *     quest "TheLedgerContract7" objectives started
 *     objective "read-brief" is listening for Mail.Read      (x7)
 *     node world-network4 ... Mod "null" ... without "network" permission
 *     Mail.send failed ... Mod "null" ... without "mail" permission
 *
 * Every failure arrives AFTER both lifecycle methods have finished — the tell
 * that the work was running too late. `runFlow` chained every node through
 * `Promise.resolve().then(...)`, so even wholly synchronous nodes were deferred
 * into a microtask that ran once OnStart had already returned.
 *
 * The graph now runs synchronously as far as it can, and only becomes async
 * where the author asked for a wait.
 */
describe("the quest does its work while the engine is still listening", () => {
    /** A quest graph with no delays in it must finish inside OnStart(). */
    function syncProject() {
        const p = createProject();
        const q = p.quests[0];
        q.autoStart = true;
        const entry = node("entry.start");
        const net = node("world.network", {
            ipMode: "fixed",
            device: { id: "r1", ip: "45.33.32.156", type: "ROUTER", users: [], ports: [], children: [] },
        });
        const notify = node("fx.notify", { message: "hello", variant: "toast", tone: "info" });
        q.graph.nodes = [entry, net, notify];
        q.graph.edges = [edge(entry.id, net.id, "flow"), edge(net.id, notify.id, "flow")];
        return compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content;
    }

    it("builds the world before OnStart returns, not in a microtask after it", () => {
        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        runMod(syncProject(), sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = {};
        q.OnStart();
        // No awaits, no timers: everything must already have happened.
        expect(calls.join(",")).toContain("net:45.33.32.156");
        expect(calls.join(",")).toContain("toast:hello");
    });

    it("keeps working when the engine revokes permissions the moment OnStart returns", () => {
        // Models the real failure: the SDK throws unless we are inside a call
        // the engine made. This is what the game was doing to us.
        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        let current = false;
        const guard = <T extends (...a: any[]) => any>(label: string, fn: T) =>
            ((...a: unknown[]) => {
                if (!current) throw new Error(`[ContentSDK] Mod "null" tried to use ${label}`);
                return fn(...a);
            }) as T;
        sdk.Network.createSubnetNetwork = guard("Network.createSubnetNetwork", (d: { ip: string }) => {
            calls.push(`net:${d.ip}`);
            return d.ip;
        });
        sdk.UI.toast = guard("UI.toast", (m: string) => calls.push(`toast:${m}`));

        runMod(syncProject(), sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = {};
        current = true;
        q.OnStart();
        current = false; // the engine returns; identity is gone

        expect(calls.join(",")).toContain("net:45.33.32.156");
        expect(calls.join(",")).toContain("toast:hello");
    });

    it("still honours a Delay node, which is allowed to be async", async () => {
        const p = createProject();
        p.quests[0].autoStart = true;
        const entry = node("entry.start");
        const delay = node("flow.delay", { seconds: 0 });
        const notify = node("fx.notify", { message: "later", variant: "toast", tone: "info" });
        p.quests[0].graph.nodes = [entry, delay, notify];
        p.quests[0].graph.edges = [edge(entry.id, delay.id, "flow"), edge(delay.id, notify.id, "flow")];

        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = {};
        q.OnStart();
        expect(calls.join(",")).not.toContain("toast:later"); // deliberately deferred
        await settle();
        expect(calls.join(",")).toContain("toast:later");
    });
});

/**
 * QA, round 46. `lynx Anselm Ritter` printed the right dossier in-game but did
 * not tick its objective, with or without quotes around the name.
 *
 * Two things text matching has to survive, neither of which is about the story:
 *
 *  - the player typing `lynx "Anselm Ritter"` rather than `lynx Anselm Ritter`,
 *    which raises the same event with a different query string;
 *  - a capital letter, anywhere, deciding whether an objective completes.
 *
 * Regex (`matches`) and the numeric comparisons are deliberately left exact:
 * an author reaching for those wants precise control.
 */
describe("conditions match what a player would actually type", () => {
    const check = (op: string, field: string, value: string, payload: Record<string, unknown>) => {
        const p = createProject();
        const q = p.quests[0];
        q.autoStart = true;
        const entry = node("entry.start");
        const obj = node("objective", { name: "obj", description: "Do the thing" });
        const trig = node("trigger.event", {
            event: "Terminal.Lynx.Search",
            conditions: [{ id: "c1", join: "and", field, op, value }],
        });
        q.graph.nodes = [entry, obj, trig];
        q.graph.edges = [edge(trig.id, obj.id, "condition")];

        const calls: string[] = [];
        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk(calls, listeners);
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const quest = new (registered0(sdk).quests[0])();
        quest.Data = {};
        quest.OnObjectivesStart();
        for (const [, h] of listeners.filter(([e]) => e === "Terminal.Lynx.Search")) h(payload);
        return calls.includes("complete:obj");
    };

    it("ignores the quotes a player puts around a multi-word search", () => {
        expect(check("contains", "query", "Ritter", { query: '"Anselm Ritter"' })).toBe(true);
        expect(check("equals", "query", "Anselm Ritter", { query: '"Anselm Ritter"' })).toBe(true);
    });

    it("ignores capitalisation on both sides", () => {
        expect(check("contains", "query", "Ritter", { query: "anselm ritter" })).toBe(true);
        expect(check("equals", "query", "ANSELM RITTER", { query: "Anselm Ritter" })).toBe(true);
    });

    it("ignores stray whitespace", () => {
        expect(check("equals", "query", "Anselm Ritter", { query: "  Anselm Ritter  " })).toBe(true);
    });

    it("still says no when the value genuinely differs", () => {
        expect(check("contains", "query", "Ritter", { query: "someone else" })).toBe(false);
        expect(check("equals", "query", "Anselm Ritter", { query: "Anselm" })).toBe(false);
    });

    it("says so in the log when an event fires but does not match", () => {
        // Silence here is what made this take a round to find: a wrong field
        // name and an event that never fires look identical.
        const p = createProject();
        p.quests[0].autoStart = true;
        const obj = node("objective", { name: "obj", description: "d" });
        const trig = node("trigger.event", {
            event: "Terminal.Lynx.Search",
            conditions: [{ id: "c1", join: "and", field: "query", op: "contains", value: "nope" }],
        });
        p.quests[0].graph.nodes = [obj, trig];
        p.quests[0].graph.edges = [edge(trig.id, obj.id, "condition")];

        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk([], listeners);
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const quest = new (registered0(sdk).quests[0])();
        quest.Data = {};
        quest.OnObjectivesStart();

        const said: string[] = [];
        const orig = console.log;
        console.log = (...a: unknown[]) => void said.push(a.map(String).join(" "));
        try {
            for (const [, h] of listeners.filter(([e]) => e === "Terminal.Lynx.Search")) {
                h({ query: "Anselm Ritter" });
            }
        } finally {
            console.log = orig;
        }
        const line = said.join("\n");
        expect(line).toContain("fired but did not match");
        expect(line).toContain("query="); // and it shows what the event carried
        expect(line).toContain("Anselm Ritter");
    });
});

/**
 * QA, round 46. Searching the handle our own lynx output advertised
 * (`@a_ritter_mc`) crashed the game and corrupted the save: the built-in
 * Twotter search reads a field off a profile that does not exist. This build's
 * SDK cannot create a Twotter profile, so every handle an author writes into a
 * lynx result is a handle with nothing behind it.
 */
describe("lynx results do not send the player somewhere that crashes", () => {
    it("warns about a social handle in a lynx result", () => {
        const p = createProject();
        p.quests[0].autoStart = true;
        p.quests[0].graph.nodes = [
            node("world.toolResponse", {
                command: "lynx",
                input: "Anselm Ritter",
                dataText: "Name: Anselm Ritter\nSocial: @a_ritter_mc",
            }),
        ];
        const w = computeWarnings(p).join("\n");
        expect(w).toContain("@a_ritter_mc");
        expect(w).toContain("corrupts the player's save");
    });

    it("says nothing when the lynx result points only at things that exist", () => {
        const p = createProject();
        p.quests[0].autoStart = true;
        p.quests[0].graph.nodes = [
            node("world.toolResponse", {
                command: "lynx",
                input: "Anselm Ritter",
                dataText: "Name: Anselm Ritter\nEmail: a.ritter@meridian-capital.net\nWeb: https://meridian-capital.net",
            }),
        ];
        // an e-mail address contains an @ but is not a handle
        expect(computeWarnings(p).join("\n")).not.toContain("crashes the game");
    });

    it("no shipped template advertises a social handle", () => {
        for (const t of TEMPLATES) {
            const w = computeWarnings(t.build()).join("\n");
            expect(w).not.toContain("corrupts the player's save");
        }
    });
});

/**
 * QA, round 47 — the SDK's declared payload shape is not always the truth.
 *
 * r46's "fired but did not match" logging paid for itself on its first outing:
 *
 *     objective "identify-target": Terminal.Lynx.Search fired but did not
 *     match. Event carried: "Anselm Ritter"
 *
 * A bare string. The SDK declares `Terminal.Lynx.Search` as `{ query: string }`
 * and the editor offers "query" as a field on that basis, so the condition read
 * `.query` off a string, got undefined, and never matched. The dossier printed
 * correctly the whole time — only the objective was stuck.
 *
 * This is a fourth instance of the pattern that has run through this whole
 * project: the declarations describe one thing and the build does another. The
 * fix is not to special-case lynx — the next event to disagree would break the
 * same way — but to make a field lookup cope with a payload that is not the
 * shape the declarations promised.
 */
describe("conditions survive an event whose real shape is not the declared one", () => {
    function fires(event: string, conditions: unknown[], payload: unknown) {
        const p = createProject();
        p.quests[0].autoStart = true;
        const obj = node("objective", { name: "obj", description: "d" });
        const trig = node("trigger.event", { event, conditions });
        p.quests[0].graph.nodes = [obj, trig];
        p.quests[0].graph.edges = [edge(trig.id, obj.id, "condition")];

        const calls: string[] = [];
        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk(calls, listeners);
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const quest = new (registered0(sdk).quests[0])();
        quest.Data = {};
        quest.OnObjectivesStart();
        for (const [, h] of listeners.filter(([e]) => e === event)) h(payload);
        return calls.includes("complete:obj");
    }

    const onQuery = (op: string, value: string) => [{ id: "c1", join: "and", field: "query", op, value }];

    it("matches a bare-string payload against the field the editor offered", () => {
        // Exactly the case QA hit in-game.
        expect(fires("Terminal.Lynx.Search", onQuery("contains", "Ritter"), "Anselm Ritter")).toBe(true);
        expect(fires("Terminal.Lynx.Search", onQuery("equals", "Anselm Ritter"), "Anselm Ritter")).toBe(true);
    });

    it("still says no when a bare-string payload genuinely does not match", () => {
        expect(fires("Terminal.Lynx.Search", onQuery("contains", "Ritter"), "someone else")).toBe(false);
    });

    it("keeps working for the events the SDK declares as primitives", () => {
        // Terminal.SSH.Connected really is a bare IP string.
        const ip = [{ id: "c1", join: "and", field: "ip", op: "equals", value: "10.0.0.12" }];
        expect(fires("Terminal.SSH.Connected", ip, "10.0.0.12")).toBe(true);
        expect(fires("Terminal.SSH.Connected", ip, "10.0.0.99")).toBe(false);
    });

    it("prefers the named field when the payload really is the declared object", () => {
        const c = [{ id: "c1", join: "and", field: "domain", op: "equals", value: "example.net" }];
        expect(fires("Terminal.Whois", c, { domain: "example.net", whois: "irrelevant" })).toBe(true);
        expect(fires("Terminal.Whois", c, { domain: "other.net", whois: "example.net" })).toBe(false);
    });

    it("falls back to the only value when a single-field object is named wrongly", () => {
        // A mistyped field name should not be the difference between a quest
        // that works and one that stops dead, when there is only one candidate.
        const c = [{ id: "c1", join: "and", field: "search", op: "contains", value: "Ritter" }];
        expect(fires("Terminal.Lynx.Search", c, { query: "Anselm Ritter" })).toBe(true);
    });

    it("does not guess when a multi-field object could mean several things", () => {
        // Two candidates: guessing here would be worse than saying no.
        const c = [{ id: "c1", join: "and", field: "nope", op: "equals", value: "example.net" }];
        expect(fires("Terminal.Whois", c, { domain: "example.net", whois: "text" })).toBe(false);
    });

    it("completes the contract template's lynx objective on the real payload", () => {
        const p = getTemplate("contract-hack")!.build();
        const calls: string[] = [];
        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk(calls, listeners);
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const quest = new (registered0(sdk).quests[0])();
        quest.Data = {};
        quest.OnObjectivesStart();
        for (const [, h] of listeners.filter(([e]) => e === "Terminal.Lynx.Search")) h("Anselm Ritter");
        expect(calls).toContain("complete:identify-target");
    });
});

/**
 * QA, round 48 — the same sweep across every tool and every event.
 *
 * r47 fixed `lynx` by making a field lookup cope with a payload that is not the
 * declared shape. The obvious question is which *other* events have the same
 * problem, and the honest answer is that we cannot know without testing each
 * one in-game. What we can do is guarantee the compiler survives either shape
 * for all of them, so that when one does disagree it costs nobody a round.
 *
 * The risk class is precise: an event the SDK declares as an object with
 * exactly ONE field can plausibly arrive as a bare value instead — that is what
 * `Terminal.Lynx.Search` turned out to do. There are 19 such events, plus the
 * 3 the SDK already declares as primitives.
 */
describe("every event the editor offers works in both shapes", () => {
    function fires(event: string, field: string, value: string, payload: unknown) {
        const p = createProject();
        p.quests[0].autoStart = true;
        const obj = node("objective", { name: "obj", description: "d" });
        const trig = node("trigger.event", {
            event,
            conditions: [{ id: "c1", join: "and", field, op: "equals", value }],
        });
        p.quests[0].graph.nodes = [obj, trig];
        p.quests[0].graph.edges = [edge(trig.id, obj.id, "condition")];

        const calls: string[] = [];
        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk(calls, listeners);
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const quest = new (registered0(sdk).quests[0])();
        quest.Data = {};
        quest.OnObjectivesStart();
        for (const [, h] of listeners.filter(([e]) => e === event)) h(payload);
        return calls.includes("complete:obj");
    }

    /** Events declared as an object with exactly one field. */
    const singleField = EVENTS.filter((e) => payloadFields(e.payload).length === 1);

    it("finds the single-field events, so this test cannot quietly cover nothing", () => {
        expect(singleField.length).toBeGreaterThan(15);
        expect(singleField.map((e) => e.name)).toContain("Terminal.Lynx.Search");
    });

    it("matches every single-field event in its DECLARED object shape", () => {
        const broken: string[] = [];
        for (const e of singleField) {
            const f = payloadFields(e.payload)[0];
            if (!fires(e.name, f, "value-x", { [f]: "value-x" })) broken.push(`${e.name}.${f}`);
        }
        expect(broken).toEqual([]);
    });

    it("matches every single-field event when it really arrives as a bare value", () => {
        // This is the lynx case, applied to all 19 of its risk class.
        const broken: string[] = [];
        for (const e of singleField) {
            const f = payloadFields(e.payload)[0];
            if (!fires(e.name, f, "value-x", "value-x")) broken.push(`${e.name}.${f}`);
        }
        expect(broken).toEqual([]);
    });

    it("matches the events the SDK already declares as primitives", () => {
        const prims = EVENTS.filter((e) => !e.payload.trim().startsWith("{"));
        expect(prims.length).toBeGreaterThan(0);
        const broken: string[] = [];
        for (const e of prims) {
            // The editor offers no field for these, so authors type their own.
            if (!fires(e.name, "value", "10.0.0.5", "10.0.0.5")) broken.push(e.name);
        }
        expect(broken).toEqual([]);
    });

    it("matches the first field of every multi-field event in its declared shape", () => {
        // The bulk of the catalogue: these are lower risk (a bare value cannot
        // stand in for several fields), but they must not have regressed.
        const broken: string[] = [];
        for (const e of EVENTS) {
            const fields = payloadFields(e.payload);
            if (fields.length < 2) continue;
            const f = fields[0];
            const payload: Record<string, unknown> = {};
            for (const k of fields) payload[k] = k === f ? "value-x" : "other";
            if (!fires(e.name, f, "value-x", payload)) broken.push(`${e.name}.${f}`);
        }
        expect(broken).toEqual([]);
    });

    it("still refuses a multi-field event when the named field is absent and ambiguous", () => {
        expect(fires("Terminal.Whois", "nope", "x", { domain: "x", whois: "y" })).toBe(false);
    });
});

/**
 * QA, round 48. Each scripted tool response has a matching trigger event, and
 * the field an author would reach for has to be one the event really carries.
 * These are the pairs the "Standard Contract Hack" walkthrough depends on.
 */
describe("scripted tool responses line up with the events they should raise", () => {
    const PAIRS: [string, string, string][] = [
        // tool             event                       field an author matches on
        ["nmap", "Terminal.NmapScan", "ip"],
        ["whois", "Terminal.Whois", "domain"],
        ["nslookup", "Terminal.Nslookup", "domain"],
        ["mxlookup", "Terminal.Mxlookup", "domain"],
        ["ping", "Terminal.Ping", "ip"],
        ["lynx", "Terminal.Lynx.Search", "query"],
        ["geoip", "Terminal.Geoip", "ip"],
        ["hydra", "Terminal.Hydra", "ip"],
        ["ftp", "Terminal.FTP.Connect", "ip"],
    ];

    it("names only events the SDK declares", () => {
        for (const [tool, event] of PAIRS) {
            expect(getEvent(event), `${tool} -> ${event}`).toBeDefined();
        }
    });

    it("matches on fields those events actually carry", () => {
        for (const [tool, event, field] of PAIRS) {
            const fields = payloadFields(getEvent(event)!.payload);
            expect(fields, `${tool} -> ${event}`).toContain(field);
        }
    });
});

/**
 * QA, round 49. The Ledger quest reached "Get onto the machine" and stopped:
 *
 *     msf6 auxiliary(scanner/ssh/ssh_login) > set Version 7.2
 *     [*] Invalid version for option: Version
 *
 * The port advertised "OpenSSH 7.2". metasploit's Version option wants three
 * numbers — its own default is 1.0.0, and every port in the working reference
 * mod is x.y.z ("OpenSSH 1.6.8", "MariaDB 4.1.3", "Apache 2.4.13"). With two
 * numbers the exploit cannot be configured, so the quest is unfinishable.
 *
 * The author had already suspected version strings were fussy after seeing
 * another mod fail with "7.2p2"; a letter is a second, separate trap.
 */
describe("port versions are ones metasploit will accept", () => {
    function warnFor(version: string) {
        const p = createProject();
        p.quests[0].autoStart = true;
        p.quests[0].graph.nodes = [
            node("world.network", {
                ipMode: "fixed",
                device: {
                    /* A user, because an SSH port with nobody behind it draws
                       its own (correct) warning — see the login-service test
                       below. This case is only about the version string. */
                    id: "r1", ip: "45.33.32.156", name: "edge", type: "ROUTER", children: [],
                    users: [{ id: "u1", username: "admin", password: "pw" }],
                    ports: [{ id: "p1", external: 22, internal: 22, active: true, service: "ssh", version }],
                },
            }),
        ];
        return computeWarnings(p).join("\n");
    }

    it("warns about a two-part version, the one that blocked QA", () => {
        const w = warnFor("OpenSSH 7.2");
        expect(w).toContain("two numbers");
        expect(w).toContain("Invalid version for option");
    });

    it("warns about a bare single number", () => {
        expect(warnFor("OpenSSH 7")).toContain("one number");
    });

    it("warns about a letter in the version", () => {
        expect(warnFor("OpenSSH 7.2p2")).toContain("letter in the version");
    });

    it("says nothing about a proper three-part version", () => {
        expect(warnFor("OpenSSH 7.2.0")).not.toContain("metasploit");
        expect(warnFor("Apache 2.4.41")).not.toContain("metasploit");
    });

    it("says nothing when a port advertises no version at all", () => {
        expect(warnFor("")).not.toContain("metasploit");
    });

    it("checks ports on machines behind the router too", () => {
        const p = createProject();
        p.quests[0].autoStart = true;
        p.quests[0].graph.nodes = [
            node("world.network", {
                ipMode: "fixed",
                device: {
                    id: "r1", ip: "1.1.1.1", name: "edge", type: "ROUTER", users: [], ports: [],
                    children: [{
                        id: "d1", ip: "10.0.0.12", name: "workstation", type: "DEVICE",
                        users: [{ id: "u1", username: "aritter", password: "pw" }],
                        ports: [{ id: "p1", external: 22, internal: 22, active: true, service: "ssh", version: "OpenSSH 7.2" }],
                    }],
                },
            }),
        ];
        const w = computeWarnings(p).join("\n");
        expect(w).toContain("workstation port 22");
    });

    it("no shipped template advertises a version metasploit would refuse", () => {
        for (const t of TEMPLATES) {
            expect(computeWarnings(t.build()).join("\n"), t.id).not.toContain("Invalid version for option");
        }
    });
});

/**
 * QA, round 50 — the debug probe.
 *
 * Suggested by the author, and worth building because almost every hard bug in
 * this project has been invisible rather than loud: the mod loads, nothing
 * errors, and nothing happens. Rounds 35-49 were mostly spent answering three
 * questions from a log that would not say —
 *
 *   did the flow get here at all?
 *   what did the event really carry?
 *   what has the quest actually saved?
 *
 * A probe answers all three where the author puts it, in the player's own log.
 */
describe("the debug probe answers the questions a silent quest will not", () => {
    function runWithProbe(probe: Record<string, unknown>, payload?: Record<string, unknown>) {
        const p = createProject();
        p.quests[0].autoStart = true;
        const entry = node("entry.start");
        const setData = node("fx.setData", { key: "ledger", value: "deleted" });
        const dbg = node("flow.debug", probe);
        const after = node("fx.notify", { message: "after", variant: "toast", tone: "info" });
        p.quests[0].graph.nodes = [entry, setData, dbg, after];
        p.quests[0].graph.edges = [
            edge(entry.id, setData.id, "flow"),
            edge(setData.id, dbg.id, "flow"),
            edge(dbg.id, after.id, "flow"),
        ];

        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = {};
        const said: string[] = [];
        const orig = console.log;
        console.log = (...a: unknown[]) => void said.push(a.map(String).join(" "));
        try {
            q.OnStart();
        } finally {
            console.log = orig;
        }
        void payload;
        return { log: said.join("\n"), calls };
    }

    it("says it was reached, under the name the author gave it", () => {
        const { log } = runWithProbe({ label: "after the exploit" });
        expect(log).toContain('reached "after the exploit"');
    });

    it("falls back to the node id when the probe has no label", () => {
        const { log } = runWithProbe({ label: "" });
        expect(log).toContain("reached");
    });

    it("prints what the quest has saved", () => {
        const { log } = runWithProbe({ label: "p", includeData: true });
        expect(log).toContain("saved:");
        expect(log).toContain("ledger=");
        expect(log).toContain("deleted");
    });

    it("says plainly when it was not reached from a trigger", () => {
        // Rather than printing "{}" and leaving the author to wonder.
        const { log } = runWithProbe({ label: "p", includePayload: true });
        expect(log).toContain("not reached from a trigger");
    });

    it("can be told to print neither", () => {
        const { log } = runWithProbe({ label: "quiet", includeData: false, includePayload: false });
        expect(log).toContain('reached "quiet"');
        expect(log).not.toContain("saved:");
        expect(log).not.toContain("event:");
    });

    it("never stops the chain it is watching", () => {
        // A probe that broke the quest it was diagnosing would be worse than none.
        const { calls } = runWithProbe({ label: "p", toast: true });
        expect(calls.join(",")).toContain("toast:after");
    });

    it("shows itself on screen only when asked", () => {
        expect(runWithProbe({ label: "p", toast: true }).calls.join(",")).toContain("toast:debug: p");
        expect(runWithProbe({ label: "p", toast: false }).calls.join(",")).not.toContain("toast:debug");
    });

    it("prints the event that reached it, fields and all", () => {
        // The whole point: the declared shape is not always the real one, so
        // the probe shows what actually turned up.
        const p = createProject();
        p.quests[0].autoStart = true;
        const trig = node("trigger.event", { event: "Terminal.Lynx.Search", conditions: [] });
        const dbg = node("flow.debug", { label: "on lynx", includePayload: true, includeData: false });
        p.quests[0].graph.nodes = [trig, dbg];
        p.quests[0].graph.edges = [edge(trig.id, dbg.id, "flow")];

        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk([], listeners);
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = {};
        q.OnObjectivesStart();

        const said: string[] = [];
        const orig = console.log;
        console.log = (...a: unknown[]) => void said.push(a.map(String).join(" "));
        try {
            for (const [, h] of listeners.filter(([e]) => e === "Terminal.Lynx.Search")) {
                h({ query: "Anselm Ritter" });
            }
        } finally {
            console.log = orig;
        }
        const line = said.join("\n");
        expect(line).toContain('reached "on lynx"');
        expect(line).toContain("query=");
        expect(line).toContain("Anselm Ritter");
    });

    it("handles a bare-value event, which is the case that cost a round", () => {
        const p = createProject();
        p.quests[0].autoStart = true;
        const trig = node("trigger.event", { event: "Terminal.Lynx.Search", conditions: [] });
        const dbg = node("flow.debug", { label: "bare", includePayload: true, includeData: false });
        p.quests[0].graph.nodes = [trig, dbg];
        p.quests[0].graph.edges = [edge(trig.id, dbg.id, "flow")];

        const listeners: [string, (d: unknown) => void][] = [];
        const sdk = stubSdk([], listeners);
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = {};
        q.OnObjectivesStart();

        const said: string[] = [];
        const orig = console.log;
        console.log = (...a: unknown[]) => void said.push(a.map(String).join(" "));
        try {
            for (const [, h] of listeners.filter(([e]) => e === "Terminal.Lynx.Search")) h("Anselm Ritter");
        } finally {
            console.log = orig;
        }
        expect(said.join("\n")).toContain("Anselm Ritter");
    });
});

/**
 * QA, round 51. The Ledger quest reached the exploit and failed:
 *
 *     msf6 > set version 7.2.1
 *     msf6 > exploit
 *     [*] 45.33.32.156:22 - Launching attack.
 *     [*] Attack failed.
 *     [*] Backdoor service could not be accessed.
 *     [*] Port 22 could not be accessed.
 *
 * The router had an SSH port open and an EMPTY users array. There was nobody to
 * log in as, so the attack had nothing to attack. Every SSH-reachable device in
 * the working reference mod carries at least one user; ours did not.
 *
 * Two things also learned from that screenshot, both corrections:
 *  - the game DISPLAYS a truncated banner ("OpenSSH 7.2" for our "OpenSSH
 *    1.7.2"), so the displayed text is not evidence about what we sent;
 *  - three-part versions are accepted (`set version 7.2.1` worked), confirming
 *    r49's fix even though the banner made it look unchanged.
 */
describe("machines the player is meant to break into can actually be broken into", () => {
    function warnFor(device: Record<string, unknown>) {
        const p = createProject();
        p.quests[0].autoStart = true;
        p.quests[0].graph.nodes = [node("world.network", { ipMode: "fixed", device })];
        return computeWarnings(p).join("\n");
    }

    const sshPort = [{ id: "p1", external: 22, internal: 22, active: true, service: "ssh", version: "OpenSSH 7.2.0" }];

    it("warns when a router opens ssh but has no users", () => {
        const w = warnFor({ id: "r1", ip: "1.1.1.1", name: "edge", type: "ROUTER", users: [], ports: sshPort, children: [] });
        expect(w).toContain("edge (port 22)");
        expect(w).toContain("no user accounts");
        expect(w).toContain("Port 22 could not be accessed");
    });

    it("warns for a machine behind the router too", () => {
        const w = warnFor({
            id: "r1", ip: "1.1.1.1", type: "ROUTER", users: [{ id: "u", username: "admin", password: "p" }], ports: [],
            children: [{ id: "d1", ip: "10.0.0.12", name: "workstation", type: "DEVICE", users: [], ports: sshPort }],
        });
        expect(w).toContain("workstation (port 22)");
    });

    it("says nothing once the machine has someone to log in as", () => {
        const w = warnFor({
            id: "r1", ip: "1.1.1.1", name: "edge", type: "ROUTER", children: [],
            users: [{ id: "u1", username: "admin", password: "M3ridian!edge" }],
            ports: sshPort,
        });
        expect(w).not.toContain("no user accounts");
    });

    it("covers the other services a player logs in to", () => {
        for (const service of ["ftp", "telnet", "mysql", "rdp", "smb", "vnc"]) {
            const w = warnFor({
                id: "r1", ip: "1.1.1.1", name: "box", type: "ROUTER", users: [], children: [],
                ports: [{ id: "p1", external: 21, internal: 21, active: true, service }],
            });
            expect(w, service).toContain("no user accounts");
        }
    });

    it("ignores a port nobody logs in to", () => {
        const w = warnFor({
            id: "r1", ip: "1.1.1.1", name: "edge", type: "ROUTER", users: [], children: [],
            ports: [{ id: "p1", external: 80, internal: 80, active: true, service: "http" }],
        });
        expect(w).not.toContain("no user accounts");
    });

    it("ignores a closed port", () => {
        const w = warnFor({
            id: "r1", ip: "1.1.1.1", name: "edge", type: "ROUTER", users: [], children: [],
            ports: [{ id: "p1", external: 22, internal: 22, active: false, service: "ssh" }],
        });
        expect(w).not.toContain("no user accounts");
    });

    it("does not nag about plumbing nobody logs into", () => {
        const w = warnFor({
            id: "r1", ip: "1.1.1.1", type: "ROUTER", users: [{ id: "u", username: "a", password: "b" }], ports: [],
            children: [
                { id: "s1", ip: "1.1.1.2", name: "LAN", type: "SPLITTER", users: [], ports: sshPort, children: [] },
                { id: "f1", ip: "1.1.1.3", name: "FW", type: "FIREWALL", users: [], ports: sshPort, rules: [] },
            ],
        });
        expect(w).not.toContain("no user accounts");
    });

    it("no shipped template leaves a machine impossible to break into", () => {
        for (const t of TEMPLATES) {
            expect(computeWarnings(t.build()).join("\n"), t.id).not.toContain("no user accounts");
        }
    });
});

/**
 * QA, round 52 — the network that would not go away.
 *
 * QA changed a port version to "OpenSSH 1.7.2", re-exported, and the game still
 * showed "OpenSSH 7.2". Three times, across three versions of the mod. The
 * export was correct every time — printing what reaches
 * `Network.createSubnetNetwork` proved that in r51 — so the game was showing a
 * network it already had.
 *
 * The cause: `world.network` never registered any cleanup. The editor has
 * always offered a "Destroy when the quest ends" toggle, `destroyOnComplete`
 * has been in the schema since the beginning, and the compiler simply ignored
 * it. Nothing was ever destroyed, so the first network the save ever saw at
 * 45.33.32.156 outlived every later version of the mod: the stale banner, and
 * an exploit that kept failing against a router whose `admin` user had been
 * added two rounds earlier and never reached the game.
 *
 * This is the same class of fault as r39's objective trigger and r43's export
 * shape: something the editor promises the author, that the compiler does not
 * actually do.
 */
describe("networks are torn down when the quest ends", () => {
    function build(patch: Record<string, unknown> = {}) {
        const p = createProject();
        const q = p.quests[0];
        q.autoStart = true;
        const entry = node("entry.start");
        const net = node("world.network", {
            ipMode: "fixed",
            device: {
                id: "r1", ip: "45.33.32.156", name: "edge", type: "ROUTER", children: [],
                users: [{ id: "u1", username: "admin", password: "pw" }],
                ports: [{ id: "p1", external: 22, internal: 22, active: true, service: "ssh", version: "OpenSSH 7.2.0" }],
            },
            ...patch,
        });
        q.graph.nodes = [entry, net];
        q.graph.edges = [edge(entry.id, net.id, "flow")];

        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        sdk.Network.destroyNetwork = (ip: string) => calls.push(`destroy:${ip}`);
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const quest = new (registered0(sdk).quests[0])();
        quest.Data = {};
        return { quest, calls };
    }

    it("destroys the network it created when the quest completes", () => {
        const { quest, calls } = build();
        quest.OnStart();
        expect(calls.join(",")).toContain("net:45.33.32.156");
        quest.OnComplete();
        expect(calls.join(",")).toContain("destroy:45.33.32.156");
    });

    it("destroys it when the quest is abandoned too", () => {
        const { quest, calls } = build();
        quest.OnStart();
        quest.OnAbandon();
        expect(calls.join(",")).toContain("destroy:45.33.32.156");
    });

    it("leaves the network standing after the quest when the toggle is off", () => {
        const { quest, calls } = build({ destroyOnComplete: false });
        quest.OnStart();
        const afterStart = calls.length;
        quest.OnComplete();
        /* "Destroy when the quest ends" is about what survives the quest, not
           about the clear-before-create that stops a stale network shadowing
           this one. Only the teardown at the end is suppressed. */
        expect(calls.slice(afterStart).join(",")).not.toContain("destroy:");
    });

    it("builds straight away when the address is free, without waiting", () => {
        /* destroyNetwork returns a promise. Awaiting it when there is nothing
           to destroy would push createSubnetNetwork past the end of OnStart,
           and the mod loses its permissions there (r45). The common case must
           stay synchronous. */
        const { quest, calls } = build();
        quest.OnStart();
        expect(calls.join(",")).toContain("net:45.33.32.156");
        expect(calls.join(",")).not.toContain("destroy:45.33.32.156");
    });

    it("creates the network with one synchronous call, the way the reference mod does", async () => {
        /* Three rounds went into clearing a stale network first, and every
           version raced or cost the quest its permissions (r55/r56/r59). The
           reference mod never calls destroyNetwork or getSubnet at all — it
           calls createSubnetNetwork on every quest start and works. So do we. */
        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        sdk.Network.getSubnet = () => { calls.push("getSubnet"); return { ip: "45.33.32.156" }; };
        sdk.Network.destroyNetwork = () => { calls.push("destroy"); return Promise.resolve(); };

        const p = createProject();
        p.quests[0].autoStart = true;
        const entry = node("entry.start");
        const net = node("world.network", {
            ipMode: "fixed",
            device: {
                id: "r1", ip: "45.33.32.156", name: "edge", type: "ROUTER", children: [],
                users: [{ id: "u1", username: "admin", password: "pw" }],
                ports: [{ id: "p1", external: 80, internal: 80, active: true, service: "http" }],
            },
        });
        const after = node("fx.notify", { message: "after", variant: "toast", tone: "info" });
        p.quests[0].graph.nodes = [entry, net, after];
        p.quests[0].graph.edges = [edge(entry.id, net.id, "flow"), edge(net.id, after.id, "flow")];
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const quest = new (registered0(sdk).quests[0])();
        quest.Data = {};
        quest.OnStart();

        // Built, and the node after it ran, with no await in between.
        expect(calls.join(",")).toContain("net:45.33.32.156");
        expect(calls.join(",")).toContain("toast:after");
        // Nothing is destroyed on the way in: that is what raced.
        expect(calls).not.toContain("destroy");
        await settle();
        expect(calls).not.toContain("destroy");
    });

    it("keeps its permissions through a replacement, so the mail still goes out", async () => {
        /* The symptom QA actually saw. Model the engine revoking rights the
           moment OnStart returns; a quest that pauses mid-build loses them. */
        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        let current = false;
        sdk.Network.getSubnet = (ip: string) => ({ ip });
        sdk.Network.destroyNetwork = () => new Promise<void>((res) => setTimeout(res, 0));
        sdk.Network.createSubnetNetwork = (d: { ip: string }) => {
            if (!current) throw new Error('Mod "null" tried to use Network.createSubnetNetwork');
            calls.push(`net:${d.ip}`);
            return d.ip;
        };
        sdk.UI.toast = (m: string) => {
            if (!current) throw new Error('Mod "null" tried to use UI.toast');
            calls.push(`toast:${m}`);
        };

        const p = createProject();
        p.quests[0].autoStart = true;
        const entry = node("entry.start");
        const net = node("world.network", {
            ipMode: "fixed",
            device: { id: "r1", ip: "45.33.32.156", type: "ROUTER", users: [], ports: [], children: [] },
        });
        const after = node("fx.notify", { message: "after", variant: "toast", tone: "info" });
        p.quests[0].graph.nodes = [entry, net, after];
        p.quests[0].graph.edges = [edge(entry.id, net.id, "flow"), edge(net.id, after.id, "flow")];
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const quest = new (registered0(sdk).quests[0])();
        quest.Data = {};
        current = true;
        quest.OnStart();
        current = false; // the engine takes the rights back

        expect(calls.join(",")).toContain("net:45.33.32.156");
        expect(calls.join(",")).toContain("toast:after");
    });

    it("still builds if destroying the old network fails", async () => {
        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        sdk.Network.getSubnet = (ip: string) => ({ ip });
        sdk.Network.destroyNetwork = () => Promise.reject(new Error("nope"));
        const p = createProject();
        p.quests[0].autoStart = true;
        const entry = node("entry.start");
        const net = node("world.network", {
            ipMode: "fixed",
            device: { id: "r1", ip: "45.33.32.156", type: "ROUTER", users: [], ports: [], children: [] },
        });
        p.quests[0].graph.nodes = [entry, net];
        p.quests[0].graph.edges = [edge(entry.id, net.id, "flow")];
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const quest = new (registered0(sdk).quests[0])();
        quest.Data = {};
        quest.OnStart();
        await settle();
        expect(calls.join(",")).toContain("net:45.33.32.156");
    });

    it("destroys the ip it really used, not the one in the template", () => {
        // With ipMode "random" the address comes from CreateData, so cleanup
        // has to follow the live value or it removes nothing.
        const p = createProject();
        p.quests[0].autoStart = true;
        const entry = node("entry.start");
        const net = node("world.network", {
            ipMode: "random",
            device: { id: "r1", ip: "1.1.1.1", type: "ROUTER", users: [], ports: [], children: [] },
        });
        p.quests[0].graph.nodes = [entry, net];
        p.quests[0].graph.edges = [edge(entry.id, net.id, "flow")];

        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        sdk.Network.destroyNetwork = (ip: string) => calls.push(`destroy:${ip}`);
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const quest = new (registered0(sdk).quests[0])();
        quest.Data = quest.CreateData ? quest.CreateData() : {};
        quest.OnStart();
        quest.OnComplete();
        // stubSdk's randomIp returns 10.9.9.9
        expect(calls.join(",")).toContain("destroy:10.9.9.9");
        expect(calls.join(",")).not.toContain("destroy:1.1.1.1");
    });

    it("survives a build with no destroyNetwork at all", () => {
        const { quest } = build();
        quest.OnStart();
        expect(() => quest.OnComplete()).not.toThrow();
    });
});

/**
 * QA, round 53. With the stale network finally gone (r52), the exploit ran
 * against the right machine and failed with a *different* message:
 *
 *     [*] Attack failed.
 *     [*] Backdoor service could not be accessed.
 *     [*] No guest account or online user found.
 *
 * That last line is the specification. The SSH exploit does not log in as
 * whoever is listed on the device — it wants a **guest account** or a user who
 * is **online**, and the router had a named `admin` who was neither.
 *
 * The working reference mod never hands the engine a bare user array: all 25 of
 * its machines wrap them in `createDefaultUserSchema(users, { guest: true })`,
 * which is what adds the accounts the exploit actually attacks. We had never
 * called that function once.
 */
describe("machines carry the accounts the exploit looks for", () => {
    function usersOf(device: Record<string, unknown>) {
        const p = createProject();
        p.quests[0].autoStart = true;
        const entry = node("entry.start");
        const net = node("world.network", { ipMode: "fixed", device });
        p.quests[0].graph.nodes = [entry, net];
        p.quests[0].graph.edges = [edge(entry.id, net.id, "flow")];

        const made: any[] = [];
        const sdk = stubSdk([], []) as any;
        sdk.Network.createSubnetNetwork = (d: unknown) => { made.push(d); return (d as any).ip; };
        sdk.Network.createUser = (u: Record<string, unknown>) => ({ ...u });
        sdk.Network.createDefaultUserSchema = (users: unknown[], opts?: { guest?: boolean }) => [
            ...users,
            ...(opts?.guest ? [{ username: "guest", password: "", online: true }] : []),
        ];
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = {};
        q.OnStart();
        return made[0];
    }

    const router = (extra: Record<string, unknown> = {}) => ({
        id: "r1", ip: "45.33.32.156", name: "edge", type: "ROUTER", children: [],
        users: [{ id: "u1", username: "admin", password: "pw" }],
        ports: [{ id: "p1", external: 22, internal: 22, active: true, service: "ssh", version: "OpenSSH 7.2.0" }],
        ...extra,
    });

    it("gives a device the guest account the exploit hunts for", () => {
        const built = usersOf({
            id: "r1", ip: "1.1.1.1", type: "ROUTER", users: [], ports: [],
            children: [{
                id: "d1", ip: "10.0.0.12", name: "ws", type: "DEVICE",
                users: [{ id: "u2", username: "aritter", password: "pw" }],
                ports: [{ id: "p1", external: 22, internal: 22, active: true, service: "ssh" }],
            }],
        });
        expect(built.children[0].users.map((u: { username: string }) => u.username)).toContain("guest");
    });

    it("does NOT put a guest account on a router", () => {
        /* r53 applied the default schema everywhere. The guest it added to the
           edge router became the account the SSH exploit logged in as
           (`uid=0(guest)`), which yields a plain shell instead of reaching the
           named account behind it. The reference mod calls the schema on its
           26 Devices and on none of its 7 Routers. */
        const built = usersOf(router());
        expect(built.users.map((u: { username: string }) => u.username)).toEqual(["admin"]);
    });

    it("marks the author's own users online, so they can be attacked", () => {
        const built = usersOf(router());
        const admin = built.users.find((u: { username: string }) => u.username === "admin");
        expect(admin.online).toBe(true);
    });

    it("still lets an author deliberately mark someone offline", () => {
        const built = usersOf(router({
            users: [{ id: "u1", username: "admin", password: "pw", online: false }],
        }));
        const admin = built.users.find((u: { username: string }) => u.username === "admin");
        expect(admin.online).toBe(false);
    });

    it("does the same for machines behind the router", () => {
        const built = usersOf({
            id: "r1", ip: "1.1.1.1", type: "ROUTER", users: [], ports: [],
            children: [{
                id: "d1", ip: "10.0.0.12", name: "ws", type: "DEVICE",
                users: [{ id: "u2", username: "aritter", password: "pw" }],
                ports: [{ id: "p1", external: 22, internal: 22, active: true, service: "ssh" }],
            }],
        });
        const names = built.children[0].users.map((u: { username: string }) => u.username);
        expect(names).toContain("aritter");
        expect(names).toContain("guest");
    });

    it("leaves plumbing alone — nobody logs into a splitter or a firewall", () => {
        const built = usersOf({
            id: "r1", ip: "1.1.1.1", type: "ROUTER", users: [], ports: [],
            children: [
                { id: "s1", ip: "1.1.1.2", name: "LAN", type: "SPLITTER", users: [], ports: [], children: [] },
                { id: "f1", ip: "1.1.1.3", name: "FW", type: "FIREWALL", users: [], ports: [], rules: [] },
            ],
        });
        expect(built.children[0].users).toEqual([]);
        expect(built.children[1].users).toEqual([]);
    });

    it("works on a build with no createDefaultUserSchema at all", () => {
        const p = createProject();
        p.quests[0].autoStart = true;
        const entry = node("entry.start");
        const net = node("world.network", { ipMode: "fixed", device: router() });
        p.quests[0].graph.nodes = [entry, net];
        p.quests[0].graph.edges = [edge(entry.id, net.id, "flow")];
        const made: any[] = [];
        const sdk = stubSdk([], []) as any;
        sdk.Network.createSubnetNetwork = (d: unknown) => { made.push(d); return (d as any).ip; };
        delete sdk.Network.createDefaultUserSchema;
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = {};
        expect(() => q.OnStart()).not.toThrow();
        expect(made[0].users.map((u: { username: string }) => u.username)).toContain("admin");
    });
});

/**
 * QA, round 59. The briefing arrived with an empty subject and an empty body,
 * so the Mail.Read trigger could not match it:
 *
 *     Mail.Read fired but did not match. Event carried:
 *     { from="i.faber@ghostmail.io", subject="", content="" }
 *
 * `Quest.sendMail(index)` sends whatever the ENGINE holds in `this.Mails` at
 * that index — not the filled-in text we are holding. When the engine never
 * took our Mails array, it sends a blank mail and reports success. Better to
 * say nothing was sent than to deliver an empty one and call it delivered.
 */
describe("the mail fallback refuses to send a blank mail", () => {
    function sendWith(prepare: (quest: any) => void) {
        const p = createProject();
        p.quests[0].autoStart = true;
        const entry = node("entry.start");
        const mail = node("comms.dialogue", {
            kind: "mail",
            mail: { from: "i.faber@ghostmail.io", subject: "One file, one man, no trace", content: "His name is Anselm Ritter." },
        });
        p.quests[0].graph.nodes = [entry, mail];
        p.quests[0].graph.edges = [edge(entry.id, mail.id, "flow")];

        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        delete sdk.Mail; // force the fallback path
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const quest = new (registered0(sdk).quests[0])();
        quest.Data = {};
        prepare(quest);

        const said: string[] = [];
        const orig = console.log;
        console.log = (...a: unknown[]) => void said.push(a.map(String).join(" "));
        try {
            quest.OnStart();
        } finally {
            console.log = orig;
        }
        return { log: said.join("\n"), calls };
    }

    it("sends through the fallback when the engine has the mail", () => {
        const { log, calls } = sendWith(() => {});
        expect(calls.join(",")).toContain("sendMail:0");
        expect(log).toContain("sent via Quest.sendMail(0)");
    });

    it("refuses when the engine's copy is blank, and says why", () => {
        const { log, calls } = sendWith((q) => {
            q.Mails = [{ title: "", content: "" }];
        });
        expect(calls.join(",")).not.toContain("sendMail:0");
        expect(log).toContain("would deliver a blank mail");
        expect(log).toContain("is empty");
    });

    it("refuses when the engine has no copy at all", () => {
        const { log, calls } = sendWith((q) => {
            q.Mails = [];
        });
        expect(calls.join(",")).not.toContain("sendMail:0");
        expect(log).toContain("is missing");
    });

    it("still reports plainly that the mail never went out", () => {
        const { log } = sendWith((q) => {
            q.Mails = [];
        });
        expect(log).toContain("could not be sent");
    });
});

/**
 * QA, round 67 — the field audit.
 *
 * A mechanical sweep of all 122 fields the inspector renders found four the
 * compiler never read. Each looked reasonable in the editor and did nothing in
 * the game, which is the exact failure mode that cost rounds 39, 43, 52, 58 and
 * 66. These tests prove the four now reach the engine, rather than proving the
 * source merely mentions them.
 */
describe("fields the editor collects actually reach the engine", () => {
    it("pays from the account the author named", () => {
        /* BankTransactionOptions.from is { IBAN, name }. Both were collected and
           dropped, so every payment came from nobody. */
        const p = createProject();
        p.quests[0].autoStart = true;
        const entry = node("entry.start");
        const pay = node("fx.pay", {
            amountMode: "fixed",
            amount: 4000,
            description: "Contract settled",
            fromName: "I. Faber",
            fromIBAN: "DE44 5001 0517 0000 0000 00",
        });
        p.quests[0].graph.nodes = [entry, pay];
        p.quests[0].graph.edges = [edge(entry.id, pay.id, "flow")];

        const sent: Record<string, unknown>[] = [];
        const sdk = stubSdk([], []) as any;
        sdk.Bank = { transaction: (o: Record<string, unknown>) => sent.push(o) };
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = {};
        q.OnStart();

        expect(sent).toHaveLength(1);
        expect(sent[0].from).toEqual({ IBAN: "DE44 5001 0517 0000 0000 00", name: "I. Faber" });
    });

    it("omits the sender entirely when the author named nobody", () => {
        const p = createProject();
        p.quests[0].autoStart = true;
        const entry = node("entry.start");
        const pay = node("fx.pay", { amountMode: "fixed", amount: 10, description: "x", fromName: "", fromIBAN: "" });
        p.quests[0].graph.nodes = [entry, pay];
        p.quests[0].graph.edges = [edge(entry.id, pay.id, "flow")];
        const sent: Record<string, unknown>[] = [];
        const sdk = stubSdk([], []) as any;
        sdk.Bank = { transaction: (o: Record<string, unknown>) => sent.push(o) };
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = {};
        q.OnStart();
        expect(sent[0]).not.toHaveProperty("from");
    });

    it("registers the command name the author typed", () => {
        /* A quest that tells the player to run "reply" registered "qe-…"
           instead, so the instruction on screen did not work. */
        const p = createProject();
        p.quests[0].autoStart = true;
        p.quests[0].graph.nodes = [
            node("reply.input", {
                commandName: "reply",
                commandDescription: "Answer the client",
                prompt: "Your answer:",
                expected: "done",
                matchMode: "contains",
            }),
        ];
        const sdk = stubSdk([], []) as any;
        const named: string[] = [];
        sdk.RegisterCommand = (c: new () => { CommandName: string }) => named.push(new c().CommandName);
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        expect(named).toContain("reply");
    });

    it("still generates a command name when the author left it blank", () => {
        const p = createProject();
        p.quests[0].autoStart = true;
        p.quests[0].graph.nodes = [
            node("reply.input", { commandName: "", prompt: "Your answer:", expected: "done", matchMode: "contains" }),
        ];
        const sdk = stubSdk([], []) as any;
        const named: string[] = [];
        sdk.RegisterCommand = (c: new () => { CommandName: string }) => named.push(new c().CommandName);
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        expect(named[0]).toMatch(/^qe-/);
    });

    it("prints the success message the author wrote", async () => {
        const p = createProject();
        p.quests[0].autoStart = true;
        p.quests[0].graph.nodes = [
            node("reply.input", {
                commandName: "reply",
                prompt: "Your answer:",
                expected: "done",
                matchMode: "contains",
                successMessage: "She reads it twice, then nothing.",
            }),
        ];
        const sdk = stubSdk([], []) as any;
        let cls: (new () => { Run: (t: unknown) => Promise<void> }) | null = null;
        sdk.RegisterCommand = (c: new () => { Run: (t: unknown) => Promise<void> }) => (cls = c);
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);

        const printed: string[] = [];
        await new cls!().Run({
            prompt: () => Promise.resolve("done"),
            printSuccess: (m: string) => printed.push(m),
            printError: () => {},
        });
        expect(printed).toContain("She reads it twice, then nothing.");
    });

    it("saves which branch a random pick chose", async () => {
        /* "Store the result as" promised the pick would be readable through
           {{data.name}} and nothing ever wrote it. */
        const p = createProject();
        p.quests[0].autoStart = true;
        const entry = node("entry.start");
        const pick = node("flow.random", { storeAs: "coin" });
        const only = node("fx.notify", { message: "after", variant: "toast", tone: "info" });
        p.quests[0].graph.nodes = [entry, pick, only];
        p.quests[0].graph.edges = [edge(entry.id, pick.id, "flow"), edge(pick.id, only.id, "flow")];

        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = {};
        q.OnStart();
        await settle();
        expect(calls.some((c) => c.startsWith("setData:coin="))).toBe(true);
    });
});

/**
 * QA, round 69 — the typed-reply mechanic, checked against the SDK.
 *
 * QA explained what the game actually does: when the player answers a mail, a
 * WeeChat line or a Kisscord message, the text is PRE-DEFINED and appears as
 * they mash keys. The question was whether the SDK exposes that, and whether
 * our "Hackertyper" node is the right way to reach it.
 *
 * It does expose it, and the node is not it:
 *
 *   KisscordMessageDefinition.isMine — "True if the player sends this message"
 *   WeeChatMessageDefinition.isMine  — same, with the player's username
 *                                      auto-filled
 *
 * A scripted player line is a message in the chat with `isMine: true`. There is
 * no hackertyper API anywhere in the SDK; our node builds a bespoke HTML page
 * that imitates one. That is a legitimate trick for a website terminal, but it
 * is not the game's own mechanic, and the dialogue editor already offers the
 * real thing.
 */
describe("a scripted player line is marked as the player's", () => {
    function chatsFor(kind: "kisscord" | "weechat", messages: unknown[]) {
        const p = createProject();
        p.quests[0].autoStart = true;
        p.quests[0].graph.nodes = [
            node("comms.dialogue", {
                kind,
                [kind]: kind === "kisscord"
                    ? { contactId: "c-1", messages }
                    : { host: "irc.example.net", password: "", registerServer: true, messages },
            }),
        ];
        const sdk = stubSdk([], []) as any;
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = {};
        return kind === "kisscord" ? q.KisscordChats?.[0]?.messages : q.WeeChatChats?.[0]?.messages;
    }

    it("marks a Kisscord line the player types out as theirs", () => {
        const msgs = chatsFor("kisscord", [
            { id: "m1", content: "", playerAction: "send", playerText: "it is done", delayMs: 0 },
        ]);
        expect(msgs[0]).toMatchObject({ content: "it is done", isMine: true });
    });

    it("marks a WeeChat line the player types out as theirs", () => {
        /* This one was wrong: we sent `username: "you"` and never set isMine,
           so the engine read it as an NPC who happens to be called "you". The
           SDK is explicit — "Player username auto-filled if isMine". */
        const msgs = chatsFor("weechat", [
            { id: "m1", content: "", username: "you", playerAction: "send", playerText: "on my way", delayMs: 0 },
        ]);
        expect(msgs[0]).toMatchObject({ content: "on my way", isMine: true });
        expect(msgs[0]).not.toHaveProperty("username");
    });

    it("marks a WeeChat file upload as the player's too", () => {
        const msgs = chatsFor("weechat", [
            { id: "m1", content: "", playerAction: "upload", upload: { name: "manifest", extension: "csv" }, delayMs: 0 },
        ]);
        expect(msgs[0].isMine).toBe(true);
        expect(msgs[0].content).toContain("manifest.csv");
    });

    it("leaves an NPC line with its username and no player flag", () => {
        const msgs = chatsFor("weechat", [
            { id: "m1", content: "you there?", username: "informant", playerAction: "none", delayMs: 0 },
        ]);
        expect(msgs[0]).toMatchObject({ content: "you there?", username: "informant" });
        expect(msgs[0].isMine).toBeUndefined();
    });

    it("honours an author who marks a plain message as the player's", () => {
        const msgs = chatsFor("weechat", [
            { id: "m1", content: "already inside", isMine: true, playerAction: "none", delayMs: 0 },
        ]);
        expect(msgs[0]).toMatchObject({ content: "already inside", isMine: true });
    });
});



/**
 * QA, round 70. A typed-answer node declares two output sockets, "Correct" and
 * "Wrong" (registry: successOut / failureOut). The runtime resumed the flow
 * down a socket called "out", which that node does not have — so everything an
 * author wired to Correct was dead, silently. Found by moving the Ledger's
 * reply from the removed hackertyper node onto this one.
 */
describe("a typed answer resumes the story down the socket it declares", () => {
    function play(answer: string) {
        const p = createProject();
        p.quests[0].autoStart = true;
        const input = node("reply.input", {
            commandName: "report",
            prompt: "Well? >",
            expected: "done",
            matchMode: "contains",
        });
        const ok = node("fx.notify", { message: "believed", variant: "toast", tone: "success" });
        const no = node("fx.notify", { message: "not believed", variant: "toast", tone: "error" });
        p.quests[0].graph.nodes = [input, ok, no];
        p.quests[0].graph.edges = [
            edge(input.id, ok.id, "flow", "success"),
            edge(input.id, no.id, "flow", "failure"),
        ];

        const calls: string[] = [];
        const sdk = stubSdk(calls, []) as any;
        let cls: (new () => { Run: (t: unknown) => Promise<void> }) | null = null;
        sdk.RegisterCommand = (c: new () => { Run: (t: unknown) => Promise<void> }) => (cls = c);
        runMod(compileProject(p).files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const q = new (registered0(sdk).quests[0])();
        q.Data = {};
        q.OnObjectivesStart();
        return { calls, run: () => new cls!().Run({
            prompt: () => Promise.resolve(answer),
            printSuccess: () => {},
            printError: () => {},
        }) };
    }

    it("follows Correct when the answer is right", async () => {
        const { calls, run } = play("done");
        await run();
        await settle();
        expect(calls.join(",")).toContain("toast:believed");
        expect(calls.join(",")).not.toContain("toast:not believed");
    });

    it("follows Wrong when it is not", async () => {
        const { calls, run } = play("no idea");
        await run();
        await settle();
        expect(calls.join(",")).toContain("toast:not believed");
        expect(calls.join(",")).not.toContain("toast:believed");
    });
});
