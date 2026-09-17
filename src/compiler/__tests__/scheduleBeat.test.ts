/**
 * Timer (r172, renamed r173): the emitted mod arms a job on the in-game
 * clock when the story reaches the node, the Scheduler callback runs the
 * node's "Out" wire, arming is idempotent across a re-run of the opening
 * flow, pending jobs are cancelled when the quest ends, and a job whose
 * quest is not live re-arms and then drops instead of looping.
 *
 * r173 adds the date modes: "daytime" resolves against Time.date() at arm
 * time (local-time constructor — the test asserts the exact fireAt), "at"
 * uses scheduleAt with the player-zone correction, and both fail open when
 * the due time is incomplete or already past.
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

interface TimerJob {
    id: string;
    kind: string;
    payload: Record<string, unknown>;
    delay?: unknown;
    fireAt?: number;
}

/** A fixed "now" for the stub in-game clock: 2026-09-17 10:00 local. */
const NOW = new Date(2026, 8, 17, 10, 0, 0).getTime();

/** A stub SDK whose Scheduler records what the mod arms (and at which
 *  in-game timestamp) and lets the test fire jobs through the real
 *  registered handler, the way the game engine's clock would. */
function timerSdk(calls: string[], now: number = NOW) {
    const registered = { quests: [] as unknown[], websites: [] as unknown[], commands: [] as unknown[] };
    const jobs: TimerJob[] = [];
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
        Time: {
            now: () => now,
            scale: () => 60,
            isRunning: () => true,
            toRealMs: (gameMs: number) => gameMs / 60,
            toGameMs: (realMs: number) => realMs * 60,
            date: () => new Date(now),
            duration: (u: { minutes?: number; hours?: number; days?: number }) =>
                ((u?.minutes ?? 0) + 60 * (u?.hours ?? 0) + 24 * 60 * (u?.days ?? 0)) * 60_000,
        },
        Scheduler: {
            register: (kind: string, handler: (p: unknown, job: unknown) => void) => {
                calls.push(`timerRegister:${kind}`);
                handlers[kind] = handler;
            },
            schedule: (kind: string, payload?: Record<string, unknown>, delay?: unknown) => {
                const job: TimerJob = { id: `job${jobs.length + 1}`, kind, payload: payload ?? {}, delay };
                jobs.push(job);
                calls.push(`timerSchedule:${kind}:${job.id}`);
                return job.id;
            },
            scheduleAt: (kind: string, payload?: Record<string, unknown>, fireAt?: number) => {
                const job: TimerJob = { id: `job${jobs.length + 1}`, kind, payload: payload ?? {}, fireAt };
                jobs.push(job);
                calls.push(`timerScheduleAt:${kind}:${job.id}:${fireAt}`);
                return job.id;
            },
            cancel: (id: string) => {
                calls.push(`timerCancel:${id}`);
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

type TimerSdk = ReturnType<typeof timerSdk>;

function timerProject(data: Record<string, unknown> = { minutes: 1 }): ProjectDocument {
    const project = createProject();
    const quest = project.quests[0];
    quest.name = "timerquest";
    quest.title = "Timer Quest";
    quest.autoStart = true;
    const entry = node("entry.start");
    const timer = node("flow.timer", data);
    const notify = node("fx.notify", { message: "the timer" });
    quest.graph.nodes = [entry, timer, notify];
    quest.graph.edges = [edge(entry.id, timer.id, "flow"), edge(timer.id, notify.id, "flow")];
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

function boot(project: ProjectDocument, calls: string[], now?: number) {
    const sdk = timerSdk(calls, now) as unknown as TimerSdk & Record<string, unknown>;
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

describe("flow.timer (Timer)", () => {
    it("arms a mod-unique job when the story reaches the node, and the callback runs the Out wire", async () => {
        const calls: string[] = [];
        const { sdk, q } = boot(timerProject({ minutes: 1 }), calls);
        q.OnStart();
        await settle();

        expect(calls).toContain("timerRegister:qe/my-quest-mod/timer");
        expect(calls.filter((c) => c.startsWith("timerSchedule:"))).toHaveLength(1);
        // The story is waiting at the timer: nothing after it has run yet.
        expect(calls).not.toContain("notify:the timer");

        sdk.__fire(sdk.__jobs[0].id);
        await settle();
        expect(calls).toContain("notify:the timer");
    });

    it("does not double-arm when the opening flow reaches the node twice (a save reload re-runs it)", async () => {
        const project = timerProject({ minutes: 1 });
        const [entry, timer] = project.quests[0].graph.nodes;
        project.quests[0].graph.edges.push({ id: "e-second-wire", source: entry.id, sourceHandle: "out", target: timer.id, targetHandle: "in", kind: "flow" });
        const calls: string[] = [];
        const { q } = boot(project, calls);
        q.OnStart();
        await settle();
        expect(calls.filter((c) => c.startsWith("timerSchedule:"))).toHaveLength(1);
    });

    it("cancels the pending job when the quest completes, so the timer cannot fire after the story is over", async () => {
        const calls: string[] = [];
        const { sdk, q } = boot(timerProject({ minutes: 1 }), calls);
        q.OnStart();
        await settle();
        const jobId = sdk.__jobs[0].id;

        q.OnComplete();
        await settle();
        expect(calls).toContain(`timerCancel:${jobId}`);
        expect(sdk.__jobs).toHaveLength(0);
        expect(calls).not.toContain("notify:the timer");
    });

    it("re-arms a due job while its quest is not live, then drops it instead of looping forever", async () => {
        const calls: string[] = [];
        const { sdk } = boot(timerProject({ minutes: 1 }), calls);
        /* A job that comes due at mod load, before its quest has started in
           this session (the engine can fire due jobs then): no quest is live
           yet. The handler re-arms it for a few ticks; if the quest never
           becomes live it drops the timer with a log line instead of looping. */
        sdk.__jobs.push({ id: "job-orphan", kind: "qe/my-quest-mod/timer", payload: { questId: "no-such-quest", nodeId: "n1", attempts: 0 } });

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        sdk.__fire("job-orphan");
        for (let i = 0; i < 19; i++) sdk.__fire(sdk.__jobs[sdk.__jobs.length - 1].id);
        sdk.__fire(sdk.__jobs[sdk.__jobs.length - 1].id);
        /* Assert before mockRestore: restoring clears the recorded calls. */
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("timer missed"));
        logSpy.mockRestore();

        expect(calls).not.toContain("notify:the timer");
    });

    it("fires immediately when no time is set (fail-open, like the rest of the codebase)", async () => {
        const calls: string[] = [];
        const { q } = boot(timerProject({ days: 0, hours: 0, minutes: 0 }), calls);
        q.OnStart();
        await settle();
        expect(calls.filter((c) => c.startsWith("timerSchedule:"))).toHaveLength(0);
        expect(calls).toContain("notify:the timer");
    });

    it("daytime mode: fires the relative offset from now at the set clock time, computed at arm time", async () => {
        const calls: string[] = [];
        const { sdk, q } = boot(timerProject({ mode: "daytime", offsetAmount: 3, offsetUnit: "days", hour: 12, minute: 0 }), calls);
        q.OnStart();
        await settle();

        /* 2026-09-17 10:00 local + 3 days at 12:00 — the local-time
           constructor on both sides, so this holds in any timezone. */
        const expected = new Date(2026, 8, 20, 12, 0).getTime();
        expect(sdk.__jobs).toHaveLength(1);
        expect(sdk.__jobs[0].fireAt).toBe(expected);
        expect(calls.filter((c) => c.startsWith("timerScheduleAt:"))).toHaveLength(1);
        expect(calls).not.toContain("notify:the timer");

        sdk.__fire(sdk.__jobs[0].id);
        await settle();
        expect(calls).toContain("notify:the timer");
    });

    it("daytime mode: an already-past time-of-day today fails open", async () => {
        const calls: string[] = [];
        const { sdk, q } = boot(timerProject({ mode: "daytime", offsetAmount: 0, offsetUnit: "days", hour: 9, minute: 0 }), calls);
        /* NOW is 10:00 — 09:00 today is already past. */
        q.OnStart();
        await settle();
        expect(sdk.__jobs).toHaveLength(0);
        expect(calls).toContain("notify:the timer");
    });

    it("daytime mode: 'in 1 month' keeps the day number", async () => {
        const calls: string[] = [];
        const { sdk, q } = boot(timerProject({ mode: "daytime", offsetAmount: 1, offsetUnit: "months", hour: 4, minute: 20 }), calls);
        q.OnStart();
        await settle();
        expect(sdk.__jobs).toHaveLength(1);
        expect(sdk.__jobs[0].fireAt).toBe(new Date(2026, 9, 17, 4, 20).getTime());
    });

    it("daytime mode: a short month clamps instead of rolling over (31 January + 1 month)", async () => {
        const calls: string[] = [];
        const { sdk, q } = boot(
            timerProject({ mode: "daytime", offsetAmount: 1, offsetUnit: "months", hour: 4, minute: 20 }),
            calls,
            new Date(2026, 0, 31, 10, 0).getTime(),
        );
        q.OnStart();
        await settle();
        expect(sdk.__jobs).toHaveLength(1);
        /* 31 February does not exist; 28 February does — and never 3 March. */
        expect(sdk.__jobs[0].fireAt).toBe(new Date(2026, 1, 28, 4, 20).getTime());
    });

    it("daytime mode: a leap year keeps 29 February (31 January 2028 + 1 month)", async () => {
        const calls: string[] = [];
        const { sdk, q } = boot(
            timerProject({ mode: "daytime", offsetAmount: 1, offsetUnit: "months", hour: 4, minute: 20 }),
            calls,
            new Date(2028, 0, 31, 10, 0).getTime(),
        );
        q.OnStart();
        await settle();
        expect(sdk.__jobs).toHaveLength(1);
        expect(sdk.__jobs[0].fireAt).toBe(new Date(2028, 1, 29, 4, 20).getTime());
    });

    it("daytime mode: 29 February + 1 year lands on 28 February", async () => {
        const calls: string[] = [];
        const { sdk, q } = boot(
            timerProject({ mode: "daytime", offsetAmount: 1, offsetUnit: "years", hour: 4, minute: 20 }),
            calls,
            new Date(2028, 1, 29, 10, 0).getTime(),
        );
        q.OnStart();
        await settle();
        expect(sdk.__jobs).toHaveLength(1);
        expect(sdk.__jobs[0].fireAt).toBe(new Date(2029, 1, 28, 4, 20).getTime());
    });

    it("daytime mode: 'in 2 weeks' is fourteen days on", async () => {
        const calls: string[] = [];
        const { sdk, q } = boot(timerProject({ mode: "daytime", offsetAmount: 2, offsetUnit: "weeks", hour: 4, minute: 20 }), calls);
        q.OnStart();
        await settle();
        expect(sdk.__jobs).toHaveLength(1);
        expect(sdk.__jobs[0].fireAt).toBe(new Date(2026, 9, 1, 4, 20).getTime());
    });

    it("at mode: scheduleAt with the player-zone correction for the chosen clock time", async () => {
        const calls: string[] = [];
        const { sdk, q } = boot(timerProject({ mode: "at", dateYear: 2026, dateMonth: 9, dateDay: 20, hour: 9, minute: 30 }), calls);
        q.OnStart();
        await settle();

        const tz = new Date().getTimezoneOffset() * 60000;
        const expected = Date.UTC(2026, 8, 20, 9, 30) - tz;
        expect(sdk.__jobs).toHaveLength(1);
        expect(sdk.__jobs[0].fireAt).toBe(expected);
        expect(calls).not.toContain("notify:the timer");

        sdk.__fire(sdk.__jobs[0].id);
        await settle();
        expect(calls).toContain("notify:the timer");
    });

    it("at mode: a past date fails open; an incomplete date fails open", async () => {
        const past: string[] = [];
        const { sdk: pastSdk, q: pastQ } = boot(timerProject({ mode: "at", dateYear: 2026, dateMonth: 9, dateDay: 16, hour: 9, minute: 0 }), past);
        pastQ.OnStart();
        await settle();
        expect(pastSdk.__jobs).toHaveLength(0);
        expect(past).toContain("notify:the timer");

        const incomplete: string[] = [];
        const { sdk: incSdk, q: incQ } = boot(timerProject({ mode: "at", dateYear: 0, dateMonth: 9, dateDay: 20 }), incomplete);
        incQ.OnStart();
        await settle();
        expect(incSdk.__jobs).toHaveLength(0);
        expect(incomplete).toContain("notify:the timer");
    });

    it("stops the flow with a diagnostic when the game build has no Scheduler API", async () => {
        const calls: string[] = [];
        const sdk = timerSdk(calls) as unknown as TimerSdk & Record<string, unknown>;
        const sdkAny = sdk as Record<string, unknown>;
        delete sdkAny.Scheduler;
        const { files } = compileProject(timerProject({ minutes: 1 }));
        runMod(files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const C = sdk.__registered.quests[0] as new () => { OnStart: () => unknown };
        const q = new C();
        q.OnStart();
        await settle();
        // The mod still registered and the quest still started; the story
        // waits at the timer instead of silently skipping it, with the
        // reason in the log.
        expect(sdk.__registered.quests).toHaveLength(1);
        expect(calls).not.toContain("notify:the timer");
    });

    it("maps to no permission of its own: SDK 0.24 has no scheduler permission token", () => {
        const withTimer = timerProject({ minutes: 1 });
        const without = timerProject({ minutes: 1 });
        without.quests[0].graph.nodes = without.quests[0].graph.nodes.filter((n) => n.type !== "flow.timer");
        without.quests[0].graph.edges = [];
        expect(computePermissions(withTimer)).toEqual(computePermissions(without));
    });

    it("dry run: the simulator arms the timer and fires it through the real handler", async () => {
        const report = await simulateProject(timerProject({ minutes: 1 }));
        expect(report.errors).toEqual([]);
        for (const quest of report.quests) expect(quest.errors).toEqual([]);
        const text = report.trace.map((t) => t.text).join("\n");
        expect(text).toContain("Timer handler registered");
        expect(text).toContain("Timer scheduled");
        expect(text).toContain("Timer fired (simulated)");
        expect(text).toContain("Notification: the timer");
    });

    it("dry run: a daytime timer fires through the real handler in the collapsed clock", async () => {
        const report = await simulateProject(timerProject({ mode: "daytime", offsetAmount: 1, offsetUnit: "days", hour: 12, minute: 0 }));
        expect(report.errors).toEqual([]);
        for (const quest of report.quests) expect(quest.errors).toEqual([]);
        const text = report.trace.map((t) => t.text).join("\n");
        expect(text).toContain("Timer scheduled at in-game");
        expect(text).toContain("Timer fired (simulated)");
        expect(text).toContain("Notification: the timer");
    });
});
