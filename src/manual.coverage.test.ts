/**
 * The documentation coverage gate.
 *
 * The manual is a build artifact, so it gets the same treatment as the schema:
 * a test that fails when it drifts from the code. This spec reads the registry
 * and every file under `public/manual/`, and fails when a node, field, socket
 * or image the manual promises is missing — or when the manual documents
 * something the code no longer has.
 *
 * Landed FAILING in r164 on purpose. The manual is being written page by page,
 * so G1 reports 32 missing node pages on day one and the count falls to zero as
 * they land. A gate nobody has seen fail is a gate nobody can trust — the house
 * rule (docs/HANDOFF.md, "Falsify every guard").
 *
 * Gates not yet implemented, and what they wait on:
 *   G4  app deep-links into manual anchors — no app code links yet (audit §4).
 *   G7  message index coverage — lands with the message extraction in r164 Phase 4.
 *   G9  quoted UI strings still exist in source — needs the `.ui` markup
 *       convention established across the pages first.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { NODE_TYPES_REGISTRY, PALETTE_HIDDEN_TYPES, type FieldDef } from "@/schema/registry";
import type { NodeType } from "@/schema/nodes";

const ROOT = resolve(__dirname, "..");
const MANUAL = join(ROOT, "public", "manual");

/* ── Reading the manual ─────────────────────────────────────────────────── */

function walk(dir: string, out: string[] = []): string[] {
    if (!existsSync(dir)) return out;
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full, out);
        else if (entry.endsWith(".html")) out.push(full);
    }
    return out;
}

const PAGES = walk(MANUAL);
const rel = (p: string) => relative(ROOT, p).split("\\").join("/");
const read = (p: string) => readFileSync(p, "utf8");

/** The page a node type is documented on, whether or not it exists yet. */
const nodePage = (type: string) => join(MANUAL, "nodes", `${type.replace(/\./g, "-").toLowerCase()}.html`);

/** Registry types the manual deliberately does not document, by decision. */
const EXCLUDED = PALETTE_HIDDEN_TYPES;

/** Every field key an author interacts with, matching schema.test.ts's allFields. */
function editableKeys(fields: FieldDef[]): string[] {
    return fields.flatMap((f) => {
        if (f.kind === "section") return editableKeys(f.fields);
        if (f.kind === "list") return [f.key, ...editableKeys(f.fields)];
        if (f.kind === "note") return [];
        return [f.key];
    });
}

/* ── G1: every obtainable node type has a page ──────────────────────────── */

describe("manual coverage — G1: node pages", () => {
    const missing = (Object.keys(NODE_TYPES_REGISTRY) as NodeType[])
        .filter((t) => !EXCLUDED.has(t))
        .filter((t) => !existsSync(nodePage(t)))
        .map((t) => `${t} → public/manual/nodes/${t.replace(/\./g, "-").toLowerCase()}.html`);

    it("documents every obtainable node type", () => {
        expect(
            missing,
            `${missing.length} node pages still to write:\n  ${missing.join("\n  ")}`,
        ).toEqual([]);
    });

    it("lists every obtainable node type on the node index page", () => {
        // nodes.html is the reader's way in. A node page that exists but is not
        // listed there is a page nobody can reach (COV8).
        const index = join(MANUAL, "nodes.html");
        if (!existsSync(index)) return; // G1 covers the missing index
        const html = read(index);
        const unlisted = (Object.keys(NODE_TYPES_REGISTRY) as NodeType[])
            .filter((t) => !EXCLUDED.has(t))
            .filter((t) => !html.includes(`nodes/${t.replace(/\./g, "-").toLowerCase()}.html`));
        expect(
            unlisted,
            `nodes.html does not link to: ${unlisted.join(", ")}`,
        ).toEqual([]);
    });

    it("keeps the exclusion list to types that really are unobtainable", () => {
        // The exclusion is a decision, not a loophole: anything on it must be
        // hidden from the palette, or the gate is hiding a missing page.
        for (const type of EXCLUDED) {
            expect(NODE_TYPES_REGISTRY[type], `${type} is excluded but not registered`).toBeDefined();
        }
    });
});

/* ── G2: every field on a documented node has an entry ──────────────────── */

describe("manual coverage — G2: field entries", () => {
    const documented = (Object.keys(NODE_TYPES_REGISTRY) as NodeType[]).filter(
        (t) => !EXCLUDED.has(t) && existsSync(nodePage(t)),
    );

    it("gives every field on a documented node its own anchored heading", () => {
        const gaps: string[] = [];
        for (const type of documented) {
            const html = read(nodePage(type));
            for (const key of editableKeys(NODE_TYPES_REGISTRY[type].fields)) {
                const anchor = `node-${type.replace(/\./g, "-").toLowerCase()}-field-${key}`;
                if (!html.includes(`id="${anchor}"`)) {
                    gaps.push(`${type}.${key} → #${anchor}`);
                }
            }
        }
        expect(
            gaps,
            `${gaps.length} fields with no entry:\n  ${gaps.join("\n  ")}`,
        ).toEqual([]);
    });
});

/* ── G3: the manual documents nothing the registry no longer has ────────── */

describe("manual coverage — G3: no stale documentation", () => {
    it("references no node type that has left the registry", () => {
        /* Anchors are built from the slug, which lowercases the type — so
           fx.claimQuest becomes fx-claimquest and would never match the
           registry's own key. Compare on the same footing both sides. */
        const known = new Set(Object.keys(NODE_TYPES_REGISTRY).map((t) => t.toLowerCase()));
        const stale: string[] = [];
        for (const page of PAGES) {
            for (const m of read(page).matchAll(/id="node-([a-z0-9-]+?)-(?:field-|page)/g)) {
                const type = m[1].replace(
                    /^(entry|objective|trigger|world|comms|reply|fx|flow|pack|layout)-/,
                    "$1.",
                );
                if (!known.has(type.toLowerCase())) stale.push(`${rel(page)}: #node-${m[1]}`);
            }
        }
        expect(stale, stale.join("\n")).toEqual([]);
    });

    it("references no field that has left its node", () => {
        const stale: string[] = [];
        for (const type of Object.keys(NODE_TYPES_REGISTRY) as NodeType[]) {
            const page = nodePage(type);
            if (!existsSync(page)) continue;
            const keys = new Set(editableKeys(NODE_TYPES_REGISTRY[type].fields));
            const slug = type.replace(/\./g, "-").toLowerCase();
            for (const m of read(page).matchAll(new RegExp(`id="node-${slug}-field-([a-zA-Z0-9_.-]+)"`, "g"))) {
                if (!keys.has(m[1])) stale.push(`${rel(page)}: field "${m[1]}" is not on ${type}`);
            }
        }
        expect(stale, stale.join("\n")).toEqual([]);
    });
});

/* ── G5: every internal link resolves ───────────────────────────────────── */

/**
 * Pages the manual is *supposed* to have, whether written yet or not. A link to
 * one of these that is not on disk yet is G1's business, not G5's — otherwise
 * G5 stays red for the whole build-out and stops being useful. A link to
 * anything else that is missing is a typo, and G5 fails on it.
 */
const EXPECTED_PAGES = new Set<string>([
    ...(Object.keys(NODE_TYPES_REGISTRY) as NodeType[])
        .filter((t) => !EXCLUDED.has(t))
        .map((t) => `nodes/${t.replace(/\./g, "-").toLowerCase()}.html`),
    "index.html",
    "tutorial.html",
    "concepts.html",
    "nodes.html",
    "guides.html",
    "how-do-i.html",
    "checking.html",
    "export.html",
    "troubleshooting.html",
    "appendices.html",
]);

describe("manual coverage — G5: internal links", () => {
    it("points at files and anchors that exist", () => {
        const broken: string[] = [];
        for (const page of PAGES) {
            const html = read(page);
            for (const m of html.matchAll(/href="([^"#]+)(?:#([^"]*))?"/g)) {
                const [, href, hash] = m;
                if (/^(https?:|mailto:)/.test(href)) continue;
                const target = resolve(dirname(page), href);
                const targetRel = relative(MANUAL, target).split("\\").join("/");
                if (!existsSync(target)) {
                    // Not yet written, and G1 is already reporting it.
                    if (EXPECTED_PAGES.has(targetRel)) continue;
                    broken.push(`${rel(page)} → ${href} (no such page, and none planned)`);
                    continue;
                }
                if (hash && target.endsWith(".html")) {
                    if (!read(target).includes(`id="${hash}"`)) {
                        broken.push(`${rel(page)} → ${href}#${hash}`);
                    }
                }
            }
        }
        expect(broken, `${broken.length} broken links:\n  ${broken.join("\n  ")}`).toEqual([]);
    });
});

/* ── G6: the jargon ceiling ─────────────────────────────────────────────── */

/**
 * The project's own enforced list (schema.test.ts gates every field hint with
 * it), extended for manual prose per docs/plans/r164-manual-structure-proposal.md §5.
 */
const JARGON =
    /\b(JSON|schema|node type|d\.ts|Zod|esbuild|prop drill|nested path|apiVersion|minSdkVersion|runtime source|mod package|aggregate|declarative|descriptor|source map|compile|boolean|enum|string|integer|float|array|null|undefined|nullable|parse|serialize|deserialize|instantiate|initialise|deterministic|callback|API|SDK|interface|deprecated|regex|asynchronous)\b/;

/** Deliberate exceptions: filenames, and UI text quoted verbatim. */
/* Words the ban would catch in a legitimate use. "Interface font" is the
   literal label on a control in the Settings window (SettingsDialog.tsx), so
   quoting it is not jargon leaking into prose — it is the product's own word. */
const JARGON_ALLOWLIST = [
    "package.json",
    "tsconfig.json",
    "esbuild.config.mjs",
    "manifest.json",
    "Interface font",
];

const FILLERS =
    /\b(simply|just|easy|easily|obviously|trivial|trivially|merely|clearly|basically|essentially)\b/i;

/** Strip tags, script, style and code spans, then collapse whitespace. */
function prose(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<(code|kbd)[^>]*>[\s\S]*?<\/\1>/gi, " ")
        /* A blurb is a field's own hint, quoted verbatim under its heading.
           COV2 requires the manual to reproduce the product's copy exactly, so
           that wording is not the manual's to police — the editor's own
           fx.setValue hint says "just", and the manual has to show it as it
           stands. Anything the manual writes itself is still checked. */
        .replace(/<blockquote class="blurb">[\s\S]*?<\/blockquote>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&[a-z]+;/gi, " ")
        .replace(/\s+/g, " ");
}

describe("manual coverage — G6: language", () => {
    it("keeps developer jargon out of reader-facing prose", () => {
        const hits: string[] = [];
        for (const page of PAGES) {
            const text = prose(read(page));
            for (const m of text.matchAll(new RegExp(JARGON.source, "gi"))) {
                const word = m[0];
                const around = text.slice(Math.max(0, m.index! - 40), m.index! + 40);
                if (JARGON_ALLOWLIST.some((a) => around.includes(a))) continue;
                hits.push(`${rel(page)}: "${word}" in "…${around.trim()}…"`);
            }
        }
        expect(hits, `${hits.length} jargon hits:\n  ${hits.join("\n  ")}`).toEqual([]);
    });

    it("keeps the banned filler words out", () => {
        const hits: string[] = [];
        for (const page of PAGES) {
            const text = prose(read(page));
            for (const m of text.matchAll(new RegExp(FILLERS.source, "gi"))) {
                const around = text.slice(Math.max(0, m.index! - 40), m.index! + 40);
                hits.push(`${rel(page)}: "${m[0]}" in "…${around.trim()}…"`);
            }
        }
        expect(hits, `${hits.length} filler words:\n  ${hits.join("\n  ")}`).toEqual([]);
    });
});

/* ── G10: the front page's headline figures ─────────────────────────────── */

describe("manual coverage — G10: headline figures", () => {
    it("quotes the same numbers the editor reports", () => {
        // The chips at the top of index.html are typed by hand, so they can
        // quietly disagree with the registry. They are the first numbers a
        // reader trusts, which makes them the worst place for a stale figure.
        const index = join(MANUAL, "index.html");
        if (!existsSync(index)) return; // G1's business
        const html = read(index);
        const inv = JSON.parse(
            readFileSync(join(ROOT, "docs/manual/inventory.json"), "utf8"),
        ) as { counts: Record<string, number> };
        const expected: Array<[string, number]> = [
            ["node types", inv.counts.obtainableNodeTypes],
            ["settings", inv.counts.editableFields],
            ["game events", inv.counts.events],
        ];
        const wrong: string[] = [];
        for (const [label, want] of expected) {
            const m = html.match(new RegExp(`<b>([0-9]+)</b>\\s*${label}`));
            if (!m) wrong.push(`${label}: not stated on the front page`);
            else if (Number(m[1]) !== want) {
                wrong.push(`${label}: the front page says ${m[1]}, the editor has ${want}`);
            }
        }
        expect(wrong, wrong.join("\n")).toEqual([]);
    });
});

/* ── G8: images ─────────────────────────────────────────────────────────── */

/**
 * The filenames the shot list declares, whether captured yet or not. Same
 * principle as G5: a screenshot that is planned but not yet taken is the shot
 * list's business, a filename that appears on no list is a typo.
 * Source: docs/plans/r164-manual-screenshots.md.
 */
const DECLARED_SHOTS = new Set(
    (readFileSync(join(ROOT, "docs/plans/r164-manual-screenshots.md"), "utf8").match(
        /[a-z0-9][a-z0-9-]*\.png/g,
    ) ?? []),
);

describe("manual coverage — G8: screenshots", () => {
    const imgDir = join(MANUAL, "img");

    it("ships every image a page references", () => {
        const unknown: string[] = [];
        const pending = new Set<string>();
        for (const page of PAGES) {
            for (const m of read(page).matchAll(/<img[^>]+src="([^"]+)"/g)) {
                if (existsSync(resolve(dirname(page), m[1]))) continue;
                const name = m[1].split("/").pop()!;
                if (DECLARED_SHOTS.has(name)) {
                    pending.add(name);
                    continue;
                }
                unknown.push(`${rel(page)} → ${m[1]} (not in the shot list)`);
            }
        }
        expect(
            unknown,
            `${unknown.length} images referenced that no page will ever get:\n  ${unknown.join("\n  ")}`,
        ).toEqual([]);
        // Informational: how many shots are still outstanding.
        if (pending.size) console.log(`  manual: ${pending.size} screenshots still to capture`);
    });

    it("references every image that sits in img/", () => {
        if (!existsSync(imgDir)) return;
        const onDisk = new Set(readdirSync(imgDir).filter((f) => f.endsWith(".png")));
        const referenced = new Set<string>();
        for (const page of PAGES) {
            for (const m of read(page).matchAll(/<img[^>]+src="[^"]*img\/([^"]+)"/g)) {
                referenced.add(m[1]);
            }
        }
        const orphans = [...onDisk].filter((f) => !referenced.has(f));
        expect(orphans, `unreferenced files in public/manual/img/: ${orphans.join(", ")}`).toEqual([]);
    });
});

/* ── G11: panel messages ────────────────────────────────────────────────────
 * Ten messages are written by the inspector's own editors rather than by the
 * canvas analysis: the quest Health section, the device tree, a database's
 * tables, an addon card, the website builder. They never reach a node badge or
 * the export report, so nothing else in this suite can see them.
 *
 * The list is curated rather than extracted. Extraction was tried: scanning
 * outward from a `text-warn`/`text-danger` class for the next JSX text node
 * returned 7 messages at a 400-character window, 9 at 900 and 10 at 1600,
 * because source indentation moves the closing tag. A gate whose answer depends
 * on line wrapping is worse than no gate, so this checks a known set in both
 * directions instead — it fails when a listed message is reworded or deleted in
 * the source, and when one is dropped from checking.html.
 *
 * It will NOT notice a brand-new inline message. That is the accepted cost of
 * being deterministic; re-run the scan when touching these editors.
 */
describe("manual coverage — G11: panel messages", () => {
    const flat = (t: string) => t.replace(/\s+/g, " ").trim();
    const PAGE = join(MANUAL, "checking.html");
    const PANEL_MESSAGES: { src: string; inSource: string; inDocs: string }[] = [
        {
            src: "src/editor/inspector/InspectorPanel.tsx",
            inSource: "no trigger wired in, so the player can never complete",
            inDocs: "no trigger wired in, so the player can never complete",
        },
        {
            src: "src/editor/inspector/DeviceTree.tsx",
            inSource: "This router has no way in: set a model for `fern`, or enable",
            inDocs: "This router has no way in",
        },
        {
            src: "src/editor/inspector/DeviceTree.tsx",
            inSource: "The SSH exploit lands in a guest account when it finds one",
            inDocs: "The SSH exploit lands in a guest account",
        },
        {
            src: "src/editor/inspector/TablesEditor.tsx",
            inSource: "This table has no name, so the game will skip it.",
            inDocs: "This table has no name, so the game will skip it.",
        },
        {
            src: "src/editor/inspector/ConditionsEditor.tsx",
            inSource: "Not one of this event's known details",
            inDocs: "Not one of this event's known details",
        },
        {
            src: "src/editor/inspector/sims/PackNodeEditor.tsx",
            inSource: "Not set up yet — this card doesn&apos;t know which tool action it runs.",
            inDocs: "know which tool action it runs",
        },
        {
            src: "src/editor/inspector/sims/PackNodeEditor.tsx",
            inSource: "game mod installed for this to work — say so in your quest",
            inDocs: "game mod installed for this to work",
        },
        {
            src: "src/editor/inspector/sims/PackDataEditor.tsx",
            inSource: "pack isn't loaded on this machine",
            inDocs: "pack isn't loaded on this machine",
        },
        {
            src: "src/editor/inspector/sims/DialogueNodeEditor.tsx",
            inSource: "Timed conversations are sent through the game's live messaging API, one",
            inDocs: "Timed conversations are sent through",
        },
        {
            src: "src/editor/websites/WebsiteBuilder.tsx",
            inSource: "Not in search results — only a direct URL (or dirhunter) leads here.",
            inDocs: "Not in search results",
        },
    ];

    it("every panel message still exists in the source it came from", () => {
        const gone: string[] = [];
        for (const m of PANEL_MESSAGES) {
            const source = flat(readFileSync(join(ROOT, m.src), "utf8"));
            if (!source.includes(flat(m.inSource))) gone.push(`${m.src}: “${m.inSource}”`);
        }
        expect(
            gone,
            `${gone.length} panel messages have been reworded or removed in the source. Update\n` +
                `  the list above and checking.html, or the docs are describing copy that no\n` +
                `  longer ships:\n  ${gone.join("\n  ")}`,
        ).toEqual([]);
    });

    it("documents every panel message", () => {
        const docs = flat(readFileSync(PAGE, "utf8").replace(/<[^>]+>/g, " "));
        const missing = PANEL_MESSAGES.filter((m) => !docs.includes(flat(m.inDocs))).map(
            (m) => `${m.src}: “${m.inDocs}”`,
        );
        expect(
            missing,
            `${missing.length} panel messages are undocumented in checking.html:\n  ${missing.join("\n  ")}`,
        ).toEqual([]);
    });

    it("claims the canvas chip, not the status bar, carries the issue count", () => {
        // StatusBar.tsx has no reference to issues, warnings or the graph
        // analysis at all — it reports saved state, counts and history. The
        // counter lives on the canvas. This guards a claim that was once wrong.
        const bar = readFileSync(join(ROOT, "src/editor/shell/StatusBar.tsx"), "utf8");
        expect(
            /issue|warning|analyseGraph/i.test(bar),
            "StatusBar.tsx now mentions issues; the handbook's “where messages appear” list " +
                "needs re-checking against it",
        ).toBe(false);
        const docs = readFileSync(PAGE, "utf8");
        expect(docs).toContain("No issues");
    });
});

/* ── G12: furniture nodes ──────────────────────────────────────────────────
 * Three node types are stripped from the exported graph (compile.ts:27), and
 * the handbook once claimed all three "never reach the game". That was wrong
 * for two of them: a group's name and comment are emitted as comments near the
 * top of dist/mod.js (planningComments, compile.ts:91), and a beat's wires are
 * spliced so the flow still connects. Both are asserted by
 * src/compiler/__tests__/furniture.test.ts.
 *
 * This gate ties the three node pages to that behaviour, so a page cannot
 * quietly go back to claiming a furniture node ships nothing when it does.
 */
describe("manual coverage — G12: furniture nodes", () => {
    const page = (slug: string) => read(join(MANUAL, "nodes", `${slug}.html`));

    it("says a Group frame's name and comment ship as comments", () => {
        const text = page("layout-group");
        expect(text).toMatch(/comment/i);
        expect(
            /never reaches the mod|never reach the mod|ships nothing at all\./.test(
                text.replace(/Sticky notes ship nothing at all\./, ""),
            ),
            "layout-group.html claims the frame ships nothing, but planningComments() emits its " +
                "name and comment into dist/mod.js",
        ).toBe(false);
    });

    it("says a Story Beat's wires are spliced", () => {
        expect(page("flow-beat")).toMatch(/spliced|joins the wires|wires are joined/i);
    });

    it("still says a Sticky note ships nothing", () => {
        // flow.note is the one furniture node with no export effect at all —
        // planningComments() filters on layout.group only.
        expect(page("flow-note")).toMatch(/never runs|ships nothing|drawing aid/i);
    });
});
