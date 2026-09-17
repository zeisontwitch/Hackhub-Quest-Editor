/**
 * Schedule beat (r172): the emitted mod arms a job on the in-game clock when
 * the story reaches the node, the Scheduler callback runs the beat's "Out"
 * wire, arming is idempotent across a re-run of the opening flow, pending
 * jobs are cancelled when the quest ends, and a job whose quest is not live
 * re-arms and then drops instead of looping.
 *
 * Technique: compile → evaluate the real dist/mod.js against a recording
 * stub SDK (the compiler test suite's approach), then drive the quest's own
 * lifecycle — the same way the game engine would.
 */
import { describe, expect, it, vi } from "vitest";
import { compileProject, computePermissions } from "@/compiler/compile";
import { simulateProject } from "@/compiler/simulate";
import { nodeTypeDef } from "@/schema/registry";
import { createProject, type ProjectDocument } from "@/schema/project";
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

interface BeatJob {
    id: string;
    kind: string;
    payload: Record<string, unknown>;
    delay?: unknown;
}

/** A stub SDK whose Scheduler records what the mod arms and lets the test
 *  fire jobs through the real registered handler, the way the game engine's
 *  clock would. */
function beatSdk(calls: string[]) {
    const registered = { quests: [] as unknown[], websites: [] as unknown[], commands: [] as unknown[] };
    const jobs: BeatJob[] = [];
    const handlers: Record<string, (p: unknown, job: unknown) => void> = {};
    class Quest {
        Data: Record<string, unknown> = {};
        Events = { on: () => {}, off: () => {}, offAll: () => {} };
        sendMail(_i: number) {
            calls.push("sendMail");
        }
        completeObjective(_n: string) {
            calls.push("complete");
        }
        complete() {
            calls.push("questComplete");
        }
        retire() {
            calls.push("questRetire");
        }
        SetData(k: string, v: unknown) {
            calls.push(`setData:${k}=${v}`);
            this.Data[k] = v;
        }
        createDialog() {}
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
        SaveStorage: { get: () => undefined, set: () => {}, remove: () => {}, clear: () => {}, getAll: () => ({}) },
        Network: { randomIp: () => "10.0.0.1" },
        Events: {
            emit: (e: string) => calls.push(`emit:${e}`),
            on: () => {},
        },
        UI: {
            notify: (m: string) => calls.push(`notify:${m}`),
            toast: (m: string) => calls.push(`toast:${m}`),
            prompt: () => Promise.resolve(""),
        },
        Bank: {},
        Scheduler: {
            register: (kind: string, handler: (p: unknown, job: unknown) => void) => {
                calls.push(`beatRegister:${kind}`);
                handlers[kind] = handler;
            },
            schedule: (kind: string, payload?: Record<string, unknown>, delay?: unknown) => {
                const job: BeatJob = { id: `job${jobs.length + 1}`, kind, payload: payload ?? {}, delay };
                jobs.push(job);
                calls.push(`beatSchedule:${kind}:${job.id}`);
                return job.id;
            },
            cancel: (id: string) => {
                calls.push(`beatCancel:${id}`);
                const i = jobs.findIndex((j) => j.id === id);
                if (i >= 0) jobs.splice(i, 1);
            },
            cancelKind: () => {},
            list: (kind?: string) =>
                jobs.filter((j) => !kind || j.kind === kind).map((j) => ({ id: j.id, fireAt: 0, kind: j.kind, payload: j.payload, createdAt: 0 })),
            remaining: () => null,
        },
        __registered: registered,
        __jobs: jobs,
        /** Fire a pending job through its registered handler, as the engine clock would. */
        __fire: (jobId: string) => {
            const job = jobs.find((j) => j.id === jobId);
            if (job) handlers[job.kind](job.payload, job);
        },
    };
    return sdk;
}

type BeatSdk = ReturnType<typeof beatSdk>;

function beatProject(delay: { days?: number; hours?: number; minutes?: number } = { minutes: 1 }): ProjectDocument {
    const project = createProject();
    const quest = project.quests[0];
    quest.name = "beatquest";
    quest.title = "Beat Quest";
    quest.autoStart = true;
    const entry = node("entry.start");
    const beat = node("flow.schedule", delay);
    const notify = node("fx.notify", { message: "the beat" });
    quest.graph.nodes = [entry, beat, notify];
    quest.graph.edges = [edge(entry.id, beat.id, "flow"), edge(beat.id, notify.id, "flow")];
    return project;
}

const settle = async () => {
    for (let i = 0; i < 60; i++) await new Promise((r) => setTimeout(r, 0));
};

function runMod(modJs: string, sdk: unknown) {
    const mod: { exports: unknown } = { exports: {} };
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function("require", "module", "exports", modJs)((name: string) => {
        if (name === "@hotbunny/hackhub-content-sdk") return sdk;
        throw new Error(`unexpected require: ${name}`);
    }, mod, mod.exports);
}

function boot(project: ProjectDocument, calls: string[]) {
    const sdk = beatSdk(calls) as unknown as BeatSdk & Record<string, unknown>;
    const { files } = compileProject(project);
    runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);
    const C = sdk.__registered.quests[0] as new () => {
        OnStart: () => unknown;
        OnObjectivesStart: () => unknown;
        OnComplete: () => unknown;
    };
    const q = new C();
    return { sdk, q };
}

describe("flow.schedule (Schedule beat)", () => {
    it("arms a mod-unique job when the story reaches the node, and the callback runs the Out wire", async () => {
        const calls: string[] = [];
        const { sdk, q } = boot(beatProject({ minutes: 1 }), calls);
        q.OnStart();
        await settle();

        expect(calls).toContain("beatRegister:qe/my-quest-mod/beat");
        expect(calls.filter((c) => c.startsWith("beatSchedule:"))).toHaveLength(1);
        // The story is waiting at the beat: nothing after it has run yet.
        expect(calls).not.toContain("notify:the beat");

        sdk.__fire(sdk.__jobs[0].id);
        await settle();
        expect(calls).toContain("notify:the beat");
    });

    it("does not double-arm when the opening flow reaches the node twice (a save reload re-runs it)", async () => {
        const project = beatProject({ minutes: 1 });
        const [entry, beat] = project.quests[0].graph.nodes;
        project.quests[0].graph.edges.push({ id: "e-second-wire", source: entry.id, sourceHandle: "out", target: beat.id, targetHandle: "in", kind: "flow" });
        const calls: string[] = [];
        const { q } = boot(project, calls);
        q.OnStart();
        await settle();
        expect(calls.filter((c) => c.startsWith("beatSchedule:"))).toHaveLength(1);
    });

    it("cancels the pending job when the quest completes, so the beat cannot fire after the story is over", async () => {
        const calls: string[] = [];
        const { sdk, q } = boot(beatProject({ minutes: 1 }), calls);
        q.OnStart();
        await settle();
        const jobId = sdk.__jobs[0].id;

        q.OnComplete();
        await settle();
        expect(calls).toContain(`beatCancel:${jobId}`);
        expect(sdk.__jobs).toHaveLength(0);
        expect(calls).not.toContain("notify:the beat");
    });

    it("re-arms a due job while its quest is not live, then drops it instead of looping forever", async () => {
        const calls: string[] = [];
        const { sdk } = boot(beatProject({ minutes: 1 }), calls);
        /* A job that comes due at mod load, before its quest has started in
           this session (the engine can fire due jobs then): no quest is live
           yet. The handler re-arms it for a few ticks; if the quest never
           becomes live it drops the beat with a log line instead of looping. */
        sdk.__jobs.push({ id: "job-orphan", kind: "qe/my-quest-mod/beat", payload: { questId: "no-such-quest", nodeId: "n1", attempts: 0 } });

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        sdk.__fire("job-orphan");
        for (let i = 0; i < 19; i++) sdk.__fire(sdk.__jobs[sdk.__jobs.length - 1].id);
        sdk.__fire(sdk.__jobs[sdk.__jobs.length - 1].id);
        /* Assert before mockRestore: restoring clears the recorded calls. */
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("schedule beat missed"));
        logSpy.mockRestore();

        expect(calls).not.toContain("notify:the beat");
    });

    it("fires immediately when no time is set (fail-open, like the rest of the codebase)", async () => {
        const calls: string[] = [];
        const { q } = boot(beatProject({ days: 0, hours: 0, minutes: 0 }), calls);
        q.OnStart();
        await settle();
        expect(calls.filter((c) => c.startsWith("beatSchedule:"))).toHaveLength(0);
        expect(calls).toContain("notify:the beat");
    });

    it("stops the flow with a diagnostic when the game build has no Scheduler API", async () => {
        const calls: string[] = [];
        const sdk = beatSdk(calls) as unknown as BeatSdk & Record<string, unknown>;
        const sdkAny = sdk as Record<string, unknown>;
        delete sdkAny.Scheduler;
        const { files } = compileProject(beatProject({ minutes: 1 }));
        runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const C = sdk.__registered.quests[0] as new () => { OnStart: () => unknown };
        const q = new C();
        q.OnStart();
        await settle();
        // The mod still registered and the quest still started; the story
        // waits at the beat instead of silently skipping it, with the reason
        // in the log.
        expect(sdk.__registered.quests).toHaveLength(1);
        expect(calls).not.toContain("notify:the beat");
    });

    it("maps to no permission of its own: SDK 0.24 has no scheduler permission token", () => {
        const withBeat = beatProject({ minutes: 1 });
        const without = beatProject({ minutes: 1 });
        without.quests[0].graph.nodes = without.quests[0].graph.nodes.filter((n) => n.type !== "flow.schedule");
        without.quests[0].graph.edges = [];
        expect(computePermissions(withBeat)).toEqual(computePermissions(without));
    });

    it("dry run: the simulator arms the beat and fires it through the real handler", async () => {
        const report = await simulateProject(beatProject({ minutes: 1 }));
        expect(report.errors).toEqual([]);
        for (const quest of report.quests) expect(quest.errors).toEqual([]);
        const text = report.trace.map((t) => t.text).join("\n");
        expect(text).toContain("Beat handler registered");
        expect(text).toContain("Beat scheduled");
        expect(text).toContain("Beat fired (simulated)");
        expect(text).toContain("Notification: the beat");
    });
});
