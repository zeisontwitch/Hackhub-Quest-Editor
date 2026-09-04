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
    eventLabel,
    getEvent,
    groupedEvents,
    isKnownEvent,
    isPrimitivePayload,
    payloadFields,
    SDK_VERSION,
} from "@/schema/events";
import { NODE_TYPES, NodeSchema, type NodeDoc, type NodeType } from "@/schema/nodes";
import {
    CATEGORIES,
    nodeTypeDef,
    NODE_TYPES_REGISTRY,
    paletteGroups,
    type FieldDef,
    type NodeTypeDef,
} from "@/schema/registry";

const ALL_TYPES = Object.keys(NODE_TYPES_REGISTRY) as NodeType[];

describe("registry ↔ node union", () => {
    it("describes every node type in the union, and nothing else", () => {
        expect([...NODE_TYPES].sort()).toEqual([...ALL_TYPES].sort());
    });

    it("has 31 node types", () => {
        expect(NODE_TYPES).toHaveLength(31);
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
        expect(grouped.size).toBe(ALL_TYPES.length);
        for (const group of groups) {
            expect(group.types.length).toBeGreaterThan(0);
            expect(group.category.label.length).toBeGreaterThan(0);
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

    it("renders a human label distinct from the raw id", () => {
        expect(eventLabel("Terminal.NmapScan")).not.toBe("Terminal.NmapScan");
        expect(eventLabel("Terminal.NmapScan")).toMatch(/nmap/i);
        // Custom events are humanised the same way — the namespace is dropped
        // because the picker already groups by it.
        expect(eventLabel("MyMod.Custom")).toBe("Custom");
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
