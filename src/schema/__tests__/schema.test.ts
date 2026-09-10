/**
 * The schema and registry must agree, or the palette would offer nodes the
 * compiler cannot emit and the inspector would render fields for data that is
 * never there. These tests are the guard rail for that.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { canConnect, EDGE_KINDS, type EdgeKind } from "@/schema/edges";
import {
    EVENT_GROUPS,
    EVENTS,
    EVENT_COUNT,
    eventFields,
    humanEventName,
    getEvent,
    groupedEvents,
    isKnownEvent,
    isPrimitivePayload,
    payloadFields,
    SDK_VERSION,
} from "@/schema/events";
import { NODE_TYPES, NodeSchema, type NodeDoc, type NodeType } from "@/schema/nodes";
import { EVENT_DOCS, eventDoc } from "@/schema/eventDocs";
import {
    CATEGORIES,
    nodeTypeDef,
    NODE_TYPES_REGISTRY,
    PALETTE_HIDDEN_TYPES,
    paletteGroups,
    storyBeatSockets,
    type FieldDef,
    type NodeTypeDef,
} from "@/schema/registry";

const ALL_TYPES = Object.keys(NODE_TYPES_REGISTRY) as NodeType[];

describe("registry ↔ node union", () => {
    it("describes every node type in the union, and nothing else", () => {
        expect([...NODE_TYPES].sort()).toEqual([...ALL_TYPES].sort());
    });

    it("has 34 node types", () => {
        expect(NODE_TYPES).toHaveLength(34);
    });

    it.each(ALL_TYPES)("creates valid default data for %s", (type) => {
        const def = nodeTypeDef(type);
        const node = {
            id: "n1",
            type,
            position: { x: 0, y: 0 },
            data: def.create(),
        };
        const parsed = NodeSchema.safeParse(node);
        expect(parsed.success, JSON.stringify(parsed.success ? null : parsed.error.issues)).toBe(true);
    });

    it.each(ALL_TYPES)("points %s at a real category", (type) => {
        const category = CATEGORIES.find((c) => c.id === nodeTypeDef(type).category);
        expect(category, `${type} references unknown category`).toBeDefined();
    });

    it.each(ALL_TYPES)("declares handles %s can actually use", (type) => {
        const def: NodeTypeDef = nodeTypeDef(type);
        for (const handle of [...def.sources, ...def.targets]) {
            expect(EDGE_KINDS).toContain(handle.kind);
            expect(handle.label.length).toBeGreaterThan(0);
        }
    });

    it("renders a non-empty palette group for every category", () => {
        const groups = paletteGroups().filter((g) => g.types.length > 0);
        const grouped = new Set(groups.flatMap((g) => g.types.map((t) => t.type)));
        // Hidden types stay in the schema/registry (legacy projects parse) but
        // are not offered in the palette.
        expect(grouped.size).toBe(ALL_TYPES.filter((t) => !PALETTE_HIDDEN_TYPES.has(t)).length);
        for (const group of groups) {
            expect(group.types.length).toBeGreaterThan(0);
            expect(group.category.label.length).toBeGreaterThan(0);
        }
    });

    it("hides the palette-excluded types but keeps them registered", () => {
        // Every hidden type is a real node type the engine can still emit.
        for (const t of PALETTE_HIDDEN_TYPES) {
            expect(ALL_TYPES).toContain(t);
            expect(nodeTypeDef(t)).toBeDefined();
        }
        // ...and none of them is offered in the palette.
        const palette = new Set(paletteGroups().flatMap((g) => g.types.map((t) => t.type)));
        for (const t of PALETTE_HIDDEN_TYPES) {
            expect(palette.has(t)).toBe(false);
        }
    });
});

describe("field explanations", () => {
    /** Every field an author can see, flattened out of sections and lists. */
    function allFields(fields: FieldDef[]): FieldDef[] {
        return fields.flatMap((field) => {
            if (field.kind === "section") return allFields(field.fields);
            if (field.kind === "list") return [field, ...allFields(field.fields)];
            return [field];
        });
    }

    const editable = ALL_TYPES.flatMap((type) =>
        allFields(nodeTypeDef(type).fields).filter(
            (f) => f.kind !== "note" && f.kind !== "section",
        ),
    );

    it("gives every editable field an explanation", () => {
        // This is the "what am I supposed to type here" guarantee. A field with
        // no hint is a field a non-coder has to guess at.
        const bare: FieldDef[] = editable.filter(
            (f) => !("hint" in f) || !f.hint,
        );
        expect(
            bare.map((f) => ("key" in f ? f.key : f.kind)),
            `${bare.length} fields have no hint`,
        ).toEqual([]);
        expect(editable.length).toBeGreaterThan(100);
    });

    it("writes hints as sentences, not label echoes", () => {
        for (const field of editable) {
            const hint = "hint" in field ? field.hint : undefined;
            if (!hint) continue;
            // Long enough to say something, short enough to read in a tooltip.
            expect(hint.length, hint).toBeGreaterThan(24);
            expect(hint.length, hint).toBeLessThan(260);
            expect(/[.!?]$/.test(hint), hint).toBe(true);
        }
    });

    it("keeps hints and notes free of mod-coding jargon", () => {
        // The game's own vocabulary (nmap, metasploit, hydra, targetIp, SDK) is
        // fine — a HackHub player learns those playing. What must not appear is
        // language that only means something to someone *building* the mod.
        const JARGON =
            /\b(JSON|schema|node type|d\.ts|Zod|esbuild|prop(-| )drill|nested path|apiVersion|minSdkVersion|runtime source|mod package|aggregate|declarative|descriptor|source map|compile)\b/i;
        const offenders: string[] = [];
        for (const type of ALL_TYPES) {
            const def = nodeTypeDef(type);
            const walk = (fields: FieldDef[], prefix: string) => {
                for (const f of fields) {
                    if (f.kind === "section") { walk(f.fields, prefix); continue; }
                    if ("text" in f && f.text && JARGON.test(f.text)) offenders.push(`${prefix}${"key" in f ? f.key : f.kind}: ${f.text}`);
                    const hint = "hint" in f ? f.hint : undefined;
                    if (hint && JARGON.test(hint)) offenders.push(`${prefix}${"key" in f ? f.key : f.kind}: ${hint}`);
                    if (f.kind === "list") walk(f.fields, `${prefix}${f.key}.`);
                }
            };
            walk(def.fields, `${type}:`);
        }
        expect(offenders, "these hints/notes use mod-coding jargon").toEqual([]);
    });
});

describe("connection rules", () => {
    it("allows same-kind, rejects cross-kind", () => {
        expect(canConnect("flow", "flow")).toBe(true);
        expect(canConnect("condition", "condition")).toBe(true);
        expect(canConnect("unlock", "unlock")).toBe(true);
        expect(canConnect("data", "data")).toBe(true);

        expect(canConnect("flow", "condition")).toBe(false);
        expect(canConnect("condition", "flow")).toBe(false);
        expect(canConnect("unlock", "flow")).toBe(false);
        expect(canConnect("data", "unlock")).toBe(false);
    });

    it("keeps the four kinds exhaustive", () => {
        expect(EDGE_KINDS).toEqual(["flow", "condition", "unlock", "data"]);
        for (const kind of EDGE_KINDS as readonly EdgeKind[]) {
            expect(canConnect(kind, kind)).toBe(true);
        }
    });
});

describe("story beat sockets", () => {
    it("always keeps the generic Out pass-through socket", () => {
        const sockets = storyBeatSockets({});
        expect(sockets.map((s) => s.id)).toEqual(["out"]);
        expect(sockets[0].kind).toBe("flow");
    });

    it("adds one flow socket per branch choice, named after it", () => {
        const sockets = storyBeatSockets({
            choices: [
                { id: "c1", label: "Front door" },
                { id: "c2", label: "Back door" },
            ],
        });
        expect(sockets.map((s) => s.id)).toEqual(["out", "choice-c1", "choice-c2"]);
        expect(sockets.every((s) => s.kind === "flow")).toBe(true);
        expect(sockets[1].label).toBe("Front door");
        expect(sockets[2].label).toBe("Back door");
    });

    it("falls back to a numbered label for an unnamed choice", () => {
        const sockets = storyBeatSockets({ choices: [{ id: "c1", label: "" }] });
        expect(sockets[1].label).toBe("Choice 1");
    });
});

describe("event catalogue", () => {
    it("was generated from the pinned SDK and reports 92 events", () => {
        expect(SDK_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
        expect(EVENT_COUNT).toBe(92);
        expect(EVENTS).toHaveLength(92);
    });

    it("has unique event ids (a few, like `Hashcat`, have no namespace)", () => {
        const ids = EVENTS.map((e) => e.name);
        expect(new Set(ids).size).toBe(ids.length);
        for (const id of ids) expect(id).toMatch(/^[A-Z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9]*)*$/);
    });

    it("looks every event back up by id", () => {
        for (const event of EVENTS) {
            expect(getEvent(event.name)?.name).toBe(event.name);
            expect(isKnownEvent(event.name)).toBe(true);
        }
        expect(isKnownEvent("Not.ARealEvent")).toBe(false);
    });

    it("groups every event under a known group", () => {
        const groupIds = new Set(EVENT_GROUPS.map((g) => g.id));
        for (const event of EVENTS) expect(groupIds.has(event.group)).toBe(true);

        const grouped = groupedEvents();
        expect(grouped.reduce((n, g) => n + g.events.length, 0)).toBe(EVENT_COUNT);
        for (const group of grouped) {
            expect(group.label.length).toBeGreaterThan(0);
            expect(group.events.length).toBeGreaterThan(0);
        }
    });

    it("parses payload fields, including nested braces", () => {
        expect(payloadFields("{ ip: string; results: string[] }")).toEqual(["ip", "results"]);
        expect(payloadFields("{ host: string; results: string[] }")).toEqual(["host", "results"]);
        expect(payloadFields("{ a: string }")).toEqual(["a"]);
        expect(payloadFields("{ nested: { x: number }; top: string }")).toEqual(["nested", "top"]);
        expect(payloadFields("void")).toEqual([]);
        expect(payloadFields("string")).toEqual([]);
    });

    it("exposes fields for a real event and an empty list for a custom one", () => {
        expect(eventFields("Terminal.NmapScan")).toContain("ip");
        expect(eventFields("MyMod.Whatever")).toEqual([]);
    });

    it("treats primitive-payload events as having no fields to match on", () => {
        const primitive = EVENTS.find((e) => isPrimitivePayload(e.name));
        expect(primitive, "expected at least one primitive-payload event").toBeDefined();
        expect(eventFields(primitive!.name)).toEqual([]);
    });

    it("renders human-readable event names", () => {
        expect(humanEventName("Terminal.Cat")).toBe("Terminal: Cat");
        expect(humanEventName("Metasploit.Meterpreter.Connected")).toBe(
            "Metasploit: Meterpreter connected",
        );
        // Acronyms survive; only later words are lowercased.
        expect(humanEventName("Terminal.SSH.Connected")).toBe("Terminal: SSH connected");
        expect(humanEventName("Terminal.FTP.Connect")).toBe("Terminal: FTP connect");
        // Single-segment names just get their words split.
        expect(humanEventName("Hashcat")).toBe("Hashcat");
        expect(humanEventName("NetworkPacketTransfer")).toBe("Network packet transfer");
        // Custom events are humanised the same way.
        expect(humanEventName("MyMod.Custom")).toBe("MyMod: Custom");
    });
});

describe("node documents", () => {
    it("rejects an unknown node type", () => {
        const parsed = NodeSchema.safeParse({
            id: "n1",
            type: "entry.notARealType",
            position: { x: 0, y: 0 },
            data: {},
        });
        expect(parsed.success).toBe(false);
    });

    it("keeps each node type's data shape distinct", () => {
        // If the discriminated union ever collapses back to `unknown` (the bug
        // the generic `node<T, D>()` helper fixed), these two shapes become the
        // same object and this stops holding.
        const objective = NodeSchema.parse({
            id: "n1",
            type: "objective",
            position: { x: 0, y: 0 },
            data: nodeTypeDef("objective").create(),
        }) as NodeDoc;
        const wifi = NodeSchema.parse({
            id: "n2",
            type: "world.wifi",
            position: { x: 0, y: 0 },
            data: nodeTypeDef("world.wifi").create(),
        }) as NodeDoc;

        expect(objective.data).toHaveProperty("name");
        expect(wifi.data).toHaveProperty("ssid");
        expect((wifi.data as Record<string, unknown>).name).toBeUndefined();
    });
});

/**
 * QA, round 52. `destroyOnComplete` sat in the schema and in the inspector from
 * the beginning, and the compiler never read it — so every network a quest
 * created outlived the quest, and re-exporting a mod could not replace a
 * network the save already had. Three rounds were spent on symptoms of that.
 *
 * A toggle the editor shows an author is a promise. This checks the promises
 * about cleanup are all kept, so the next one added cannot be forgotten.
 */
describe("cleanup toggles the editor offers are honoured by the compiler", () => {
    const runtime = readFileSync(resolve(process.cwd(), "src/compiler/runtimeSource.ts"), "utf8");

    it("reads every cleanup flag the schema defines", () => {
        const schema = readFileSync(resolve(process.cwd(), "src/schema/nodes.ts"), "utf8");
        const flags = new Set(
            [...schema.matchAll(/^\s*(\w*[Oo]nComplete)\s*:/gm)].map((m) => m[1]),
        );
        expect(flags.size).toBeGreaterThan(0);
        const ignored = [...flags].filter((f) => !runtime.includes(f));
        expect(ignored).toEqual([]);
    });

    it("registers cleanup for everything it creates in the world", () => {
        // Each of these leaves something behind in the player's save if it is
        // never undone.
        for (const kind of ["network", "domain", "commandData", "firewall", "database", "port"]) {
            expect(runtime, kind).toContain(`kind: "${kind}"`);
            expect(runtime, kind).toContain(`item.kind === "${kind}"`);
        }
    });
});

describe("choice-or-custom fields", () => {
    /** Every selectOrCustom, with the keys visible from where it sits. */
    function collect() {
        const found: { type: string; field: Extract<FieldDef, { kind: "selectOrCustom" }>; rootKeys: string[]; rowKeys: string[] | null }[] = [];
        for (const type of ALL_TYPES) {
            const def = nodeTypeDef(type);
            const keys = (fields: FieldDef[]) =>
                fields.flatMap((f) => ("key" in f ? [f.key as string] : []));
            const rootKeys = keys(def.fields);
            const walk = (fields: FieldDef[], rowKeys: string[] | null) => {
                for (const f of fields) {
                    if (f.kind === "selectOrCustom") found.push({ type, field: f, rootKeys, rowKeys });
                    if (f.kind === "list") walk(f.fields, keys(f.fields));
                    if (f.kind === "section") walk(f.fields, f.path ? keys(f.fields) : rowKeys);
                }
            };
            walk(def.fields, null);
        }
        return found;
    }

    it("offers distinct values and always a way out", () => {
        const found = collect();
        expect(found.length).toBeGreaterThan(0);
        for (const { type, field } of found) {
            const values = field.options.map((o) => o.value);
            expect(new Set(values).size, `${type}:${field.key} has duplicate options`).toBe(values.length);
            // Options may be empty only when sameAs offers the way out — plus
            // the Custom box the component always renders.
            expect(
                field.options.length > 0 || field.sameAs !== undefined,
                `${type}:${field.key} offers no choice at all`,
            ).toBe(true);
        }
    });

    it("points every sameAs at a field that exists", () => {
        for (const { type, field, rootKeys, rowKeys } of collect()) {
            if (!field.sameAs) continue;
            const from = field.sameAs.fromKey;
            if (from.startsWith("/")) {
                expect(rootKeys, `${type}:${field.key} sameAs ${from}`).toContain(from.slice(1));
            } else {
                const visible = [...(rowKeys ?? []), ...rootKeys];
                expect(visible, `${type}:${field.key} sameAs ${from}`).toContain(from);
            }
        }
    });

    it("keeps the firewall node a single rule with guided addresses", () => {
        // The rule used to be a list field over single-object data: a fresh
        // node showed "None yet" for a rule it had, and adding a row wrote an
        // array the schema rejects. One rule, always visible, no add button.
        const def = nodeTypeDef("world.firewall");
        const ip = def.fields.find((f) => "key" in f && f.key === "ip");
        expect(ip?.kind).toBe("selectOrCustom");
        expect(
            (ip as Extract<FieldDef, { kind: "selectOrCustom" }>).options.map((o) => o.value),
        ).toContain("{{data.targetIp}}");
        const rule = def.fields.find((f) => f.kind === "section");
        expect(rule, "the rule must be a section, not a list").toMatchObject({
            kind: "section",
            path: "rule",
        });
        const section = rule as Extract<FieldDef, { kind: "section" }>;
        expect(section.fields.some((f) => f.kind === "selectOrCustom" && f.key === "source")).toBe(true);
        const destination = section.fields.find((f) => "key" in f && f.key === "destination") as Extract<
            FieldDef,
            { kind: "selectOrCustom" }
        >;
        expect(destination.kind).toBe("selectOrCustom");
        expect(destination.sameAs?.fromKey).toBe("/ip");
    });

    it("starts a firewall rule already aimed at the quest's network", () => {
        const created = nodeTypeDef("world.firewall").create() as {
            ip: string;
            rule: { source: string; destination: string };
        };
        expect(created.ip).toBe("{{data.targetIp}}");
        expect(created.rule.source).toBe("*");
        expect(created.rule.destination).toBe("{{data.targetIp}}");
    });

    it("explains every game event in plain language", () => {
        // The picker shows field names ("command, args") that mean nothing
        // without knowing what the event IS — so every catalogue event needs
        // its explanation, and the next SDK regen breaks this until the new
        // events get theirs.
        const missing = EVENTS.filter((e) => !eventDoc(e.name));
        expect(missing.map((e) => e.name), "events with no explanation").toEqual([]);
        const extra = Object.keys(EVENT_DOCS).filter((name) => !isKnownEvent(name));
        expect(extra, "explanations for events that do not exist").toEqual([]);
        for (const [name, doc] of Object.entries(EVENT_DOCS)) {
            expect(doc.length, name).toBeGreaterThan(20);
            expect(doc.length, name).toBeLessThan(400);
            expect(/[.!?]$/.test(doc), name).toBe(true);
        }
        // The motivating example: Terminal.Command must say what it is and
        // what its two fields carry.
        const command = eventDoc("Terminal.Command")!;
        expect(command).toMatch(/runs a command/);
        expect(command).toContain("command");
        expect(command).toContain("args");
    });

    it("numbers sequence outputs instead of naming them", () => {
        const seq = nodeTypeDef("flow.sequence");
        const created = seq.create() as { steps: { label: string }[] };
        expect(created.steps.map((s) => s.label)).toEqual(["1", "2"]);
        const steps = seq.fields.find((f) => f.kind === "list") as Extract<
            FieldDef,
            { kind: "list" }
        >;
        // The list editor passes the new row's index in, so the third output
        // arrives already called "3".
        expect(steps.newItem(2)).toMatchObject({ label: "3" });
        expect(steps.itemTitle({ label: "" }, 4)).toBe("5");
    });

    it("starts payments at 100 with no percent option, but honours old ones", () => {
        const pay = nodeTypeDef("fx.pay");
        expect((pay.create() as { amount: number }).amount).toBe(100);
        expect(pay.fields.some((f) => "key" in f && f.key === "amountMode")).toBe(false);
        expect(pay.fields.some((f) => "key" in f && f.key === "percent")).toBe(false);
        // …while an old project that paid a percent still explains itself.
        const legacy = pay.fields.find((f) => f.kind === "note");
        expect(legacy).toMatchObject({ showWhen: { key: "amountMode", equals: "percent" } });
        // Charge keeps the percent: taking a cut is its whole job.
        const charge = nodeTypeDef("fx.withdraw");
        expect(charge.fields.some((f) => "key" in f && f.key === "amountMode")).toBe(true);
    });

    it("gives the database its tables and the handbook its article picker", () => {
        const db = nodeTypeDef("world.database");
        expect(db.fields.some((f) => f.kind === "tables" && "key" in f && f.key === "tables")).toBe(true);
        const handbook = nodeTypeDef("fx.handbook");
        expect(
            handbook.fields.some((f) => f.kind === "handbookArticle" && "key" in f && f.key === "articleId"),
        ).toBe(true);
    });
});
