/*
 * The manual's ground truth, extracted mechanically.
 *
 * Every fact in the handbook — a field's label, its hint, its default, its
 * limits, which sockets a node has — comes out of the registry through this
 * script, so it cannot be miscounted or misremembered. The coverage test
 * (`src/manual.coverage.test.ts`) reads the same registry directly and diffs
 * it against `public/manual/`; this artifact is the human-readable half, the
 * one a writer reads instead of scrolling source.
 *
 * Usage: node scripts/extract-manual-inventory.mjs
 * Output: docs/manual/inventory.json
 *
 * Scope: nodes, fields, sockets, events. Template metadata is not here — see
 * the note below on why.
 *
 * Loads the TypeScript registry through jiti (already a dependency) with the
 * same `@/` alias vite.config.ts uses. No new dependency, no build step.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";

const root = path.resolve(import.meta.dirname, "..");
const jiti = createJiti(import.meta.url, {
    alias: { "@": path.join(root, "src") },
    interopDefault: true,
});

const registry = await jiti.import(path.join(root, "src/schema/registry.ts"));
const events = await jiti.import(path.join(root, "src/schema/events.ts"));
const compile = await jiti.import(path.join(root, "src/compiler/compile.ts"));

/*
 * Templates are deliberately NOT loaded here. `src/templates/pages.ts` pulls in
 * eight `.html?raw` imports, which only Vite can resolve — jiti throws
 * ERR_UNKNOWN_FILE_EXTENSION on them. Template metadata is owned by the
 * coverage test instead, which runs under Vitest where `?raw` works natively.
 */

/**
 * The HTML filename for a node type. Derived, never hand-typed, so a page can
 * never be named something the coverage gate does not expect.
 */
export function nodeSlug(type) {
    return type.replace(/\./g, "-").toLowerCase();
}

/** Flatten a field tree, keeping the nesting so list rows stay distinguishable. */
function walkFields(fields, depth = 0, parentPath = "") {
    return fields.flatMap((field) => {
        /* Layout, not documentation units (r176): a row and the clock are
           documented through their children, exactly as if stacked. */
        if (field.kind === "row") return walkFields(field.fields, depth, parentPath);
        if (field.kind === "clock") return walkFields([field.hour, field.minute], depth, parentPath);
        const key = field.key ?? null;
        const fieldPath = parentPath ? `${parentPath}.${key ?? field.kind}` : String(key ?? field.kind);
        const entry = {
            depth,
            path: fieldPath,
            kind: field.kind,
            key,
            label: field.label ?? null,
            hint: field.hint ?? null,
        };
        if (field.min !== undefined) entry.min = field.min;
        if (field.max !== undefined) entry.max = field.max;
        if (field.step !== undefined) entry.step = field.step;
        if (field.rows !== undefined) entry.rows = field.rows;
        if (field.placeholder) entry.placeholder = field.placeholder;
        if (field.mono) entry.mono = true;
        if (field.tokens) entry.tokens = true;
        if (field.generate) entry.generate = field.generate;
        if (field.showWhen) entry.showWhen = field.showWhen;
        if (field.tone) entry.tone = field.tone;
        if (field.text) entry.text = field.text;
        if (field.options) entry.options = field.options;
        if (field.addLabel) entry.addLabel = field.addLabel;
        if (field.kind === "section" || field.kind === "list") {
            entry.fields = walkFields(field.fields, depth + 1, fieldPath);
        }
        return [entry];
    });
}

/**
 * Every field an author interacts with, flattened out of sections and lists.
 *
 * Matches `schema.test.ts`'s `allFields` exactly, including counting the list
 * control itself — an "Add port" button with its rows is a thing the author
 * touches, so it is a thing the manual documents. Excluding it would report 113
 * where the project's own test asserts more than 120; the two must agree.
 */
function editableFields(fields) {
    return fields.flatMap((f) => {
        if (f.kind === "section") return editableFields(f.fields);
        if (f.kind === "row") return editableFields(f.fields);
        if (f.kind === "clock") return editableFields([f.hour, f.minute]);
        if (f.kind === "list") return [f, ...editableFields(f.fields)];
        if (f.kind === "note") return [];
        return [f];
    });
}

/** How many fields of one kind a tree holds, at any depth. */
function countKinds(fields, kind) {
    return fields.reduce(
        (n, f) => n + (f.kind === kind ? 1 : 0) + (f.fields ? countKinds(f.fields, kind) : 0),
        0,
    );
}

const types = Object.keys(registry.NODE_TYPES_REGISTRY);

/**
 * Freshly created defaults carry ids from nanoid(8), so they differ on every
 * run. Ground truth that changes when nothing has changed is worse than no
 * ground truth: it buries real drift under noise, and a reviewer learns to
 * ignore the diff. The ids mean nothing to a reader either — what matters is
 * that the editor generates one — so they become a stable marker.
 */
function stabilise(value) {
    if (Array.isArray(value)) return value.map(stabilise);
    if (value && typeof value === "object") {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = k === "id" && typeof v === "string" ? "<generated>" : stabilise(v);
        }
        return out;
    }
    return value;
}

const nodes = types.map((type) => {
    const def = registry.NODE_TYPES_REGISTRY[type];
    const socket = (h) => ({ id: h.id, kind: h.kind, label: h.label });
    return {
        type,
        slug: nodeSlug(type),
        label: def.label,
        blurb: def.blurb,
        icon: def.icon,
        category: def.category,
        hook: def.hook,
        /** Hidden from the palette and from node search: no way to create one in this build. */
        obtainable: !registry.PALETTE_HIDDEN_TYPES.has(type),
        targets: def.targets.map(socket),
        sources: def.sources.map(socket),
        hasDynamicSockets: Boolean(def.dynamicSources),
        fields: walkFields(def.fields),
        editableFieldCount: editableFields(def.fields).length,
        defaults: stabilise(def.create()),
    };
});

const inventory = {
    generatedBy: "scripts/extract-manual-inventory.mjs",
    editorBuild: compile.EDITOR_BUILD,
    sdkVersion: events.SDK_VERSION,
    counts: {
        nodeTypes: types.length,
        obtainableNodeTypes: nodes.filter((n) => n.obtainable).length,
        categories: registry.CATEGORIES.length,
        editableFields: nodes.reduce((n, x) => n + x.editableFieldCount, 0),
        /** Same set minus the seven list controls, for reference only. */
        editableFieldsExcludingLists: nodes.reduce(
            (n, x) => n + x.editableFieldCount - countKinds(x.fields, "list"),
            0,
        ),
        sockets: nodes.reduce((n, x) => n + x.targets.length + x.sources.length, 0),
        events: events.EVENT_COUNT,
        eventGroups: events.EVENT_GROUPS.length,
    },
    /** Node types with no manual page, by decision. See docs/plans/r164-manual-audit.md §3.4. */
    manualExclusions: [...registry.PALETTE_HIDDEN_TYPES],
    categories: registry.CATEGORIES.map((c) => ({ id: c.id, label: c.label, hex: c.hex })),
    edgeKinds: ["flow", "condition", "unlock", "data"],
    eventGroups: events.EVENT_GROUPS,
    nodes,
};

const out = path.join(root, "docs/manual");
mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, "inventory.json"), JSON.stringify(inventory, null, 2) + "\n");

const c = inventory.counts;
console.log(`docs/manual/inventory.json — editor build ${inventory.editorBuild}, SDK ${inventory.sdkVersion}`);
console.log(
    `  ${c.nodeTypes} node types (${c.obtainableNodeTypes} obtainable) · ${c.categories} categories · ` +
        `${c.editableFields} editable fields · ${c.sockets} sockets`,
);
console.log(`  ${c.events} events in ${c.eventGroups} groups`);
console.log(`  manual exclusions: ${inventory.manualExclusions.join(", ") || "(none)"}`);
