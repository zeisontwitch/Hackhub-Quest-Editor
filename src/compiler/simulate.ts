/**
 * The Quest Simulator's engine — a dry run of the *emitted* mod.
 *
 * Compiles the project exactly as an export would, evaluates the resulting
 * `dist/mod.js` in-process against a recording stub SDK (the same technique
 * as the compiler test suite), walks every quest's real lifecycle
 * (`CreateData` → `OnStart` → `OnObjectivesStart`), and reports what the
 * story does: the call trace, how each objective completes, and — the point
 * — whether each event trigger's conditions would actually match, by firing
 * the runtime's own registered listener with a probe payload.
 *
 * Honesty boundary: this proves things about OUR runtime, deterministically.
 * It cannot prove what the game renders, that the engine fires an event, or
 * anything about timing under the game clock. The dialog says so.
 *
 * Pure module: no React, no DOM (AR1/AR2). `Random.sleep` resolves
 * immediately — a dry run collapses waits.
 */
import { compileProject, EDITOR_BUILD } from "@/compiler/compile";
import { PAYLOAD_IS_REALLY_PRIMITIVE, getEvent, payloadFields } from "@/schema/events";
import type { ProjectDocument, QuestDoc } from "@/schema/project";

export interface TraceEntry {
    kind: string;
    text: string;
    /** Index of the quest whose lifecycle produced this entry; -1 = mod load. */
    quest: number;
}

export interface SimObjective {
    name: string;
    description: string;
    /** "flow" = ticked during the dry run itself; "trigger" = waits on an event; "none" = no route at all. */
    route: "flow" | "trigger" | "none";
    event?: string;
    conditions?: { field: string; op: string; value: string; join?: string }[];
    /** Result of firing the real listener with a probe payload. Absent for flow/none routes. */
    probe?: "match" | "no-match" | "unknown-event" | "internal";
    probeNote?: string;
}

export interface SimQuestReport {
    name: string;
    title: string;
    trace: TraceEntry[];
    objectives: SimObjective[];
    errors: string[];
}

export interface SimReport {
    build: string;
    trace: TraceEntry[];
    quests: SimQuestReport[];
    warnings: string[];
    errors: string[];
}

/* ── the recording SDK ──────────────────────────────────────────────────── */

interface ProbeProbe {
    label: string;
    payload: unknown;
}

/**
 * Build the SDK the emitted code runs against. Every method records a
 * humanized line; nothing touches a real game. Values a later call reads
 * back (SaveStorage, SetData) are kept, the way the engine would.
 */
function recordingSdk(entries: TraceEntry[]) {
    const listeners: { quest: number; event: string; handler: (d: unknown) => void }[] = [];
    const questClasses: unknown[] = [];
    const completedByQuest: Set<string>[] = [];
    let current = -1;
    let serial = 0;
    const nextId = (prefix: string) => `${prefix}${++serial}`;

    const log = (kind: string, text: string) => entries.push({ kind, text, quest: current });

    const store: Record<string, unknown> = {};

    class Quest {
        Data: Record<string, unknown> = {};
        Events = {
            on: (e: string, h: (d: unknown) => void) => listeners.push({ quest: current, event: e, handler: h }),
            off: () => {},
            offAll: () => {},
        };
        completed = new Set<string>();
        sendMail(i: number, from?: string, to?: string) {
            log("mail", `Quest mail #${i} is delivered${from ? ` (from ${from})` : ""}${to ? ` to ${to}` : ""}`);
        }
        createDialog(b: string) {
            log("dialog", `Phone conversation "${b}" is queued`);
        }
        completeObjective(n: string) {
            this.completed.add(n);
            completedByQuest[current]?.add(n);
            log("objective", `Objective completed: ${n}`);
        }
        SetData(k: string, v: unknown) {
            this.Data[k] = v;
            log("data", `Quest data saved: ${k} = ${String(v)}`);
        }
        /* The runtime claims quests through the static too (fx.claimQuest). */
        static claim(n: string) {
            log("quest", `Quest claimed: ${n}`);
        }
    }

    class Website {}
    class Command {}
    class Bootstrap {}

    return {
        sdk: {
            Quest,
            Website,
            Command,
            Bootstrap,
            RegisterQuest: (cls: unknown) => {
                questClasses.push(cls);
                completedByQuest.push(new Set());
                log("register", "A quest registers itself");
            },
            RegisterWebsite: () => log("register", "A website registers itself"),
            RegisterCommand: () => log("register", "A terminal command registers itself"),
            RegisterModPackage: () => {},
            Network: {
                createSubnetNetwork: (d: { ip: string; name?: string }) => {
                    log("network", `Network created at ${d.ip}${d.name ? ` (${d.name})` : ""}`);
                    return d.ip;
                },
                createWifiNetwork: (d: { ssid?: string }) => {
                    log("network", `Wi-Fi network created${d?.ssid ? ` (${d.ssid})` : ""}`);
                    return nextId("wifi");
                },
                createUser: (u: unknown) => u,
                createDefaultUserSchema: (users: unknown) => users,
                randomIp: () => `10.0.${Math.floor(serial / 250) % 250}.${(serial % 250) + 2}`,
                destroyNetwork: () => {
                    log("network", "A network is torn down");
                    return Promise.resolve(true);
                },
                getPlayerIp: () => "10.0.0.1",
                getSubnetByDomain: () => null,
                resolveDomain: () => null,
                registerDomain: (d: { domain?: string }) => {
                    log("domain", `Domain registered: ${d?.domain ?? "?"}`);
                },
                removeDomain: () => {},
                openPort: (ip: string, port: unknown) => log("port", `Port opened on ${ip} (${String(port)})`),
                closePort: (ip: string, port: unknown) => log("port", `Port closed on ${ip} (${String(port)})`),
                addPort: (ip: string, port: unknown) => log("port", `Port added on ${ip} (${JSON.stringify(port)})`),
                removePort: () => {},
                addFirewallRule: (ip: string, rule: unknown) => log("firewall", `Firewall rule on ${ip}: ${JSON.stringify(rule)}`),
                removeFirewallRule: () => {},
            },
            Shell: {
                addCommandData: (c: string) => log("tool", `Tool answer placed: ${c}`),
                removeCommandData: () => {},
                getUsername: () => "player",
                execute: (cmd: string) => log("terminal", `Terminal runs: ${cmd}`),
                exec: (cmd: string) => log("terminal", `Terminal runs: ${cmd}`),
            },
            Mail: {
                send: (def: { to?: string; subject?: string }) => {
                    log("mail", `Mail sent → ${def?.to ?? "?"}: "${def?.subject ?? ""}"`);
                    return nextId("m");
                },
                getInbox: () => [],
                getPlayerEmail: () => "player@nullpost.io",
            },
            Kisscord: {
                sendMessage: (channel: string, content: string, isMine?: boolean) =>
                    log("chat", `Kisscord ${isMine ? "(you)" : `← ${channel}`}: ${content}`),
            },
            WeeChat: {
                sendMessage: (m: { host?: string; username?: string; message?: string }) =>
                    log("chat", `WeeChat ${m?.username ?? ""}: ${String(m?.message ?? "")}`),
                createServer: (h: { host?: string }) => log("chat", `WeeChat server up: ${h?.host ?? "?"}`),
                removeServer: () => {},
            },
            Files: {
                createTree: () => log("files", "Files placed on a machine"),
            },
            Database: {
                create: (d: { name?: string }) => {
                    log("database", `Database created${d?.name ? `: ${d.name}` : ""}`);
                    return nextId("db");
                },
                remove: () => {},
            },
            Bank: {
                getBalance: () => 1000,
                transaction: (a: unknown) => log("bank", `Bank transaction: ${JSON.stringify(a)}`),
                withdraw: (a: unknown) => log("bank", `Bank withdrawal: ${JSON.stringify(a)}`),
            },
            UI: {
                notify: (m: string) => log("notify", `Notification: ${m}`),
                toast: (m: string) => log("notify", `Toast: ${m}`),
            },
            Handbook: {
                open: (id: string) => log("handbook", `Handbook opens "${id}"`),
            },
            Random: {
                // A dry run collapses waits — the waits themselves are real
                // in-game (the Pacing cookbook card says so), they are just
                // not worth waiting for here.
                sleep: () => Promise.resolve(),
                id: () => nextId("sim"),
                uuid: () => nextId("uuid"),
                username: () => "simuser",
                password: () => "simpass",
                number: (min = 0) => min,
                pick: (list: unknown[]) => list?.[0],
            },
            SharedStorage: {
                /* Community packs hand data over through this cross-mod
                   key-value store. The stub serves nothing on read (a first
                   merge starts from an empty list, as in-game) and records
                   what was written. */
                get: () => undefined,
                set: (key: string, value: unknown) => {
                    log("data", `Community data handed over: ${key} = ${JSON.stringify(value)}`);
                },
            },
            SaveStorage: {
                get: (k: string) => store[k],
                set: (k: string, v: unknown) => {
                    store[k] = v;
                },
                remove: (k: string) => {
                    delete store[k];
                },
                clear: () => {
                    for (const k of Object.keys(store)) delete store[k];
                },
                getAll: () => store,
            },
            Events: {
                emit: (e: string) => log("event", `Event fires: ${e}`),
                on: () => {},
            },
        },
        listeners,
        questClasses,
        completedByQuest,
        beginQuest: (i: number) => {
            current = i;
        },
        endQuest: () => {
            current = -1;
        },
    };
}

/** Flush every pending promise chain the interpreter may have started. */
const settle = async () => {
    for (let i = 0; i < 60; i++) await new Promise((r) => setTimeout(r, 0));
};

function runCompiled(modJs: string, sdk: unknown) {
    const mod: { exports: unknown } = { exports: {} };
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function("require", "module", "exports", modJs)((name: string) => {
        if (name === "@hotbunny/hackhub-content-sdk") return sdk;
        throw new Error(`unexpected require: ${name}`);
    }, mod, mod.exports);
}

/* ── probe payloads ─────────────────────────────────────────────────────── */

function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split(".");
    let cur: Record<string, unknown> = obj;
    for (const part of parts.slice(0, -1)) {
        if (typeof cur[part] !== "object" || cur[part] === null) cur[part] = {};
        cur = cur[part] as Record<string, unknown>;
    }
    cur[parts[parts.length - 1]] = value;
}

/**
 * A payload laid over the catalogue's declared shape, filled with the
 * trigger's own condition values — "an event shaped like the author expects".
 * The runtime's real listener decides whether it matches.
 */
function buildProbes(
    event: string,
    conditions: { field: string; op: string; value: string }[],
    data: Record<string, unknown>,
): ProbeProbe[] {
    const ev = getEvent(event);
    if (!ev) return [];
    const declared = payloadFields(ev.payload);
    /* Primitive-typed events declare no fields at all; build the payload
       from the condition's own root(s) — the runtime's matcher reads a bare
       payload through its single-key fallback, and this mirrors exactly the
       shape the author's conditions describe. */
    const roots = declared.length ? declared : [...new Set(conditions.map((c) => c.field.split(".")[0]))];
    /* Condition values may carry {{data.*}} tokens; the runtime's matcher
       fills them against the quest's own data before comparing, so the probe
       payload must carry the resolved value, not the raw token. */
    const resolved = (value: string) =>
        String(value).replace(/\{\{\s*data\.([^}]+?)\s*\}\}/g, (_m, key: string) => {
            const v = data[key.trim()];
            return v === undefined ? _m : String(v);
        });
    const payload: Record<string, unknown> = {};
    for (const c of conditions) {
        const root = c.field.split(".")[0];
        if (roots.includes(root)) setPath(payload, c.field, resolved(c.value));
    }
    const probes: ProbeProbe[] = [{ label: "the declared shape", payload }];
    // Primitive-declared events: the game has sent the value bare before
    // (Terminal.Lynx.Search), and the runtime deliberately matches both.
    if (PAYLOAD_IS_REALLY_PRIMITIVE.has(event) && conditions.length > 0) {
        probes.push({ label: "the bare value the game actually sends", payload: resolved(conditions[0].value) });
    }
    return probes;
}

/* ── the simulation itself ──────────────────────────────────────────────── */

function objectivesOf(quest: QuestDoc): { node: SimObjective; trigger: { event: string; conditions: SimObjective["conditions"] } | null }[] {
    const byId = new Map(quest.graph.nodes.map((n) => [n.id, n]));
    const triggerFor = new Map<string, { event: string; conditions: SimObjective["conditions"] }>();
    for (const e of quest.graph.edges) {
        if (e.kind !== "condition") continue;
        const src = byId.get(e.source);
        if (src?.type === "trigger.event") {
            const d = src.data as { event?: string; conditions?: SimObjective["conditions"] };
            triggerFor.set(e.target, { event: d.event ?? "", conditions: d.conditions ?? [] });
        }
    }
    return quest.graph.nodes
        .filter((n) => n.type === "objective")
        .map((n) => {
            const d = n.data as { name?: string; description?: string };
            return {
                node: { name: d.name ?? "", description: d.description ?? "", route: "none" } as SimObjective,
                trigger: triggerFor.get(n.id) ?? null,
            };
        });
}

/**
 * Dry-run the whole project. Never throws: every stage captures its own
 * failures into the report — a sim that dies is a *finding*, not a crash.
 */
export async function simulateProject(project: ProjectDocument): Promise<SimReport> {
    const compiled = compileProject(project);
    const entries: TraceEntry[] = [];
    const errors: string[] = [];
    const harness = recordingSdk(entries);

    const modJs = compiled.files.find((f) => f.path === "dist/mod.js")?.content;
    if (!modJs) {
        return { build: EDITOR_BUILD, trace: [], quests: [], warnings: compiled.warnings, errors: ["the compiler produced no dist/mod.js — nothing to dry-run"] };
    }

    try {
        runCompiled(modJs, harness.sdk);
    } catch (e) {
        errors.push(`the emitted mod threw while registering: ${e instanceof Error ? e.message : String(e)}`);
    }

    const questReports: SimQuestReport[] = [];

    for (let i = 0; i < project.quests.length; i++) {
        const qd = project.quests[i];
        const errors_q: string[] = [];
        const C = harness.questClasses[i] as
            | (new () => {
                  Data?: Record<string, unknown>;
                  CreateData?: () => Promise<Record<string, unknown>> | Record<string, unknown>;
                  OnStart?: () => unknown;
                  OnObjectivesStart?: () => unknown;
                  completed?: Set<string>;
              })
            | undefined;
        if (!C) {
            errors_q.push("this quest did not register (no class was emitted for it)");
            questReports.push({ name: qd.name, title: qd.title, trace: [], objectives: [], errors: errors_q });
            continue;
        }
        const traceStart = entries.length;
        harness.beginQuest(i);
        let instance: { Data?: Record<string, unknown> } | null = null;
        try {
            const q = new C();
            instance = q;
            if (q.CreateData) q.Data = await q.CreateData();
            await q.OnStart?.();
            await settle();
            await q.OnObjectivesStart?.();
            await settle();
        } catch (e) {
            errors_q.push(`the quest's own code threw: ${e instanceof Error ? e.message : String(e)}`);
        }
        harness.endQuest();
        const questData = instance?.Data ?? {};

        const completed = harness.completedByQuest[i] ?? new Set<string>();
        const questListeners = harness.listeners.filter((l) => l.quest === i);
        const objectives: SimObjective[] = [];
        for (const { node: obj, trigger } of objectivesOf(qd)) {
            if (!trigger) {
                // Ticked during the dry run = the story flow reached it.
                objectives.push(completed.has(obj.name) ? { ...obj, route: "flow" } : obj);
                continue;
            }
            const out: SimObjective = { ...obj, route: "trigger", event: trigger.event, conditions: trigger.conditions };
            if (trigger.event.startsWith("QE.")) {
                // The runtime's own synthetic events (reply outcomes, story
                // beats). They fire when the story or the player acts inside
                // the mod itself — no external payload to probe.
                out.probe = "internal";
                out.probeNote = "editor-internal event — it fires when the story or the player reaches this beat";
                objectives.push(out);
                continue;
            }
            const probes = buildProbes(trigger.event, trigger.conditions ?? [], questData);
            const mine = questListeners.filter((l) => l.event === trigger.event);
            if (probes.length === 0) {
                out.probe = "unknown-event";
                out.probeNote = "this event is not in the game's catalogue — nothing can fire it";
            } else if (mine.length === 0) {
                out.probe = "no-match";
                out.probeNote = "the runtime registered no listener for this event";
            } else {
                const before = completed.has(obj.name);
                let threw: string | null = null;
                harness.beginQuest(i);
                for (const probe of probes) {
                    try {
                        for (const l of mine) l.handler(probe.payload);
                    } catch (e) {
                        threw = e instanceof Error ? e.message : String(e);
                    }
                }
                await settle();
                harness.endQuest();
                if (completed.has(obj.name)) {
                    out.probe = "match";
                    if (!before && threw) out.probeNote = `matched, but the listener also threw: ${threw}`;
                } else {
                    out.probe = "no-match";
                    out.probeNote = threw
                        ? `the listener threw: ${threw}`
                        : "the conditions did not match an event shaped the way this trigger expects — as written, the objective can never tick";
                }
            }
            objectives.push(out);
        }

        questReports.push({ name: qd.name, title: qd.title, trace: entries.slice(traceStart), objectives, errors: errors_q });
    }

    return {
        build: EDITOR_BUILD,
        trace: entries,
        quests: questReports,
        warnings: [...compiled.warnings],
        errors,
    };
}
