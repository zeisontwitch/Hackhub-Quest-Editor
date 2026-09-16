/**
 * Builds one reference page per obtainable node type.
 *
 * Two inputs, and the split is deliberate:
 *
 *   docs/manual/inventory.json   facts, extracted from src/schema by
 *                                scripts/extract-manual-inventory.mjs. Labels,
 *                                hints, defaults, limits, sockets. Never typed
 *                                by hand, so it cannot drift from the registry.
 *   docs/manual/node-voice.json  prose, written by a person. What the node is
 *                                for, when you would reach for it, what breaks.
 *
 * A node with no voice entry is SKIPPED and reported, not filled in. Generating
 * plausible-sounding prose for 33 nodes would satisfy the coverage gate and
 * teach nobody anything, which is the one outcome this script must not allow.
 *
 * Usage: node scripts/build-node-pages.mjs [--check]
 *   --check   write nothing, report what would change (for CI)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "manual", "nodes");
const CHECK = process.argv.includes("--check");

const inv = JSON.parse(readFileSync(join(ROOT, "docs/manual/inventory.json"), "utf8"));
const voice = JSON.parse(readFileSync(join(ROOT, "docs/manual/node-voice.json"), "utf8"));

const BUILD = inv.editorBuild;
const slugOf = (type) => type.replace(/\./g, "-").toLowerCase();
const catById = Object.fromEntries(inv.categories.map((c) => [c.id, c]));

/* The order pages link to each other in: registry order, which is the order
   the palette lists them. */
const ORDER = inv.nodes.filter((n) => n.obtainable);

const esc = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ── Sidebar ────────────────────────────────────────────────────────────── */

function nav() {
    const cats = inv.categories
        .map(
            (c) =>
                `        <li><a href="../nodes.html#cat-${c.id}"><span class="cat-dot" style="background:var(--cat-${c.id})"></span>${esc(c.label)}</a></li>`,
        )
        .join("\n");
    return `<nav class="toc" aria-label="Handbook contents">
  <div class="brand"><span class="dot"></span><strong>Quest Editor</strong></div>
  <p class="build">Handbook · build ${BUILD}</p>
  <div class="search">
    <input type="search" placeholder="Search the handbook…" aria-label="Search the handbook" />
    <div class="results" role="listbox" aria-label="Search results"></div>
  </div>
  <ol>
    <li><a href="../index.html">Start here</a></li>
    <li><a href="../tutorial.html">Your first quest</a></li>
    <li><a href="../concepts.html">How a quest works</a></li>
    <li><a href="../nodes.html">Node reference</a>
      <ul class="sub">
${cats}
      </ul>
    </li>
    <li><a href="../guides.html">Feature guides</a></li>
    <li><a href="../how-do-i.html">How do I…</a></li>
    <li><a href="../checking.html">Checking your quest</a></li>
    <li><a href="../export.html">Exporting and installing</a></li>
    <li><a href="../troubleshooting.html">When something goes wrong</a></li>
    <li><a href="../appendices.html">Glossary and limits</a></li>
  </ol>
</nav>`;
}

/* ── Values ─────────────────────────────────────────────────────────────── */

/** How a default is spoken about. Never invent one: absent means "empty". */
function defaultValue(node, key) {
    if (!node.defaults || !(key in node.defaults)) return null;
    const v = node.defaults[key];
    if (v === "") return { text: "empty" };
    if (v === false) return { text: "off" };
    if (v === true) return { text: "on" };
    if (typeof v === "number") return { code: String(v) };
    if (Array.isArray(v)) return { text: v.length ? "a starter list" : "an empty list" };
    if (v && typeof v === "object") return { text: "a starter set" };
    return { code: JSON.stringify(v) };
}

function renderDefault(d) {
    if (!d) return null;
    return d.code ? `<code>${esc(d.code)}</code>` : esc(d.text);
}

/**
 * Limits, stated only from what the schema actually enforces.
 *
 * A text field has no enforced limit, so no Limits row is printed for one.
 * "Any text." would be a limit in name only, and a reader who scans the row
 * for a real constraint is better off not seeing it at all. Where a practical
 * limit matters anyway — keep a statement label short — the voice entry says so.
 */
function limitsFor(f) {
    const parts = [];
    if (f.kind === "number" || f.kind === "slider") {
        if (f.min !== undefined && f.max !== undefined) parts.push(`${f.min} to ${f.max}.`);
        else if (f.min !== undefined) parts.push(`${f.min} or more.`);
        else if (f.max !== undefined) parts.push(`${f.max} or less.`);
        if (f.step !== undefined) {
            parts.push(
                Number.isInteger(f.step)
                    ? `Whole numbers, in steps of ${f.step}.`
                    : `Steps of ${f.step}, so fractions that fine are allowed.`,
            );
        }
    }
    if (f.kind === "toggle") parts.push("On or off.");
    if ((f.kind === "select" || f.kind === "selectOrCustom") && f.options?.length) {
        parts.push(`One of the ${f.options.length} listed below.`);
    }
    return parts.length ? parts.join(" ") : null;
}

function optionsTable(f) {
    if (!f.options?.length) return "";
    const rows = f.options
        .map(
            (o) =>
                `    <tr><td class="name">${esc(o.label)}</td><td><code>${esc(o.value)}</code></td></tr>`,
        )
        .join("\n");
    return `<table>
  <thead><tr><th>Choice</th><th>What it is stored as</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>`;
}

/* ── One field ──────────────────────────────────────────────────────────── */

function fieldBlock(node, f, vfield, depth = 0) {
    const slug = slugOf(node.type);
    const anchor = `node-${slug}-field-${f.key}`;
    const fv = vfield?.[f.key] ?? {};
    const rows = [];

    if (fv.put) rows.push(["What to put here", esc(fv.put)]);
    else if (f.kind === "toggle") rows.push(["What it does", esc(f.hint || "")]);
    if (fv.example) rows.push(["Example", `<code>${esc(fv.example)}</code>`]);

    const d = renderDefault(defaultValue(node, f.key));
    if (d) rows.push(["Default", d, "dt-mute"]);

    const lim = fv.limits || limitsFor(f);
    if (lim) rows.push(["Limits", esc(lim)]);

    if (f.showWhen) {
        rows.push([
            "When it appears",
            `Only once <b class="ui">${esc(showWhenLabel(node, f.showWhen))}</b> is set. Until then the field is hidden.`,
            "dt-mute",
        ]);
    }
    if (f.tokens) {
        rows.push([
            "Tags work here",
            'Type <code>{{data.something}}</code> to insert a value you saved with <a href="fx-setdata.html">Set quest data</a>.',
            "dt-mute",
        ]);
    }
    if (fv.empty) rows.push(["If you leave it empty", esc(fv.empty), "dt-danger"]);
    if (fv.emptySafe) rows.push(["If you leave it empty", esc(fv.emptySafe), "dt-mute"]);
    if (fv.watch) rows.push(["Watch out", esc(fv.watch), "dt-warn"]);

    const dl = rows
        .map(([dt, dd, cls]) => `  <dt${cls ? ` class="${cls}"` : ""}>${dt}</dt><dd>${dd}</dd>`)
        .join("\n");

    const head = depth > 0 ? `<h4 id="${anchor}">${esc(f.label)}</h4>` : `<h3 id="${anchor}">${esc(f.label)}</h3>`;
    const blurb = f.hint ? `<blockquote class="blurb">${esc(f.hint)}</blockquote>` : "";
    const opts = optionsTable(f);

    /* A list owns its children, and each child needs its own anchor (G2). */
    let children = "";
    if (f.fields?.length) {
        const add = f.addLabel ? `<p>The button reads <b class="ui">${esc(f.addLabel)}</b>.</p>` : "";
        children =
            add +
            f.fields
                .map((c) => fieldBlock(node, c, vfield, depth + 1))
                .join("\n");
    }

    return [head, blurb, `<dl class="facts-list">\n${dl}\n</dl>`, opts, children]
        .filter(Boolean)
        .join("\n");
}

function showWhenLabel(node, cond) {
    /* cond is the key the field waits on; speak its label, not its key. */
    const key = typeof cond === "string" ? cond : cond?.key;
    const flat = (fields) => fields.flatMap((f) => [f, ...(f.fields ? flat(f.fields) : [])]);
    const found = flat(node.fields).find((f) => f.key === key || f.path === key);
    return found?.label ?? key ?? "another field";
}

/* ── Sockets ────────────────────────────────────────────────────────────── */

const KIND_WORD = {
    flow: ["Then", "kind-flow"],
    condition: ["When", "kind-condition"],
    unlock: ["Unlocks", "kind-unlock"],
    data: ["Data", "kind-data"],
};

function socketRow(s, dir, note) {
    const [, cls] = KIND_WORD[s.kind] ?? ["", ""];
    return `    <tr>
      <td class="name ${cls}">${esc(s.label)}</td><td>${dir}</td>
      <td>${note ?? ""}</td>
    </tr>`;
}

function wiresTable(node, v) {
    const rows = [];
    for (const t of node.targets) {
        rows.push(socketRow(t, "input", v.sockets?.[t.id]?.in ?? "Whatever should run immediately before this node."));
    }
    for (const s of node.sources) {
        rows.push(socketRow(s, "output", v.sockets?.[s.id]?.out ?? "Whatever should happen after this node runs."));
    }
    if (!rows.length) {
        return `<p>This node has no sockets of its own. ${esc(v.noSockets ?? "")}</p>`;
    }
    return `<table>
  <thead><tr><th>Socket</th><th>Direction</th><th>What to connect</th></tr></thead>
  <tbody>
${rows.join("\n")}
  </tbody>
</table>`;
}

const LEGEND = `<p class="wire-legend">
  <span class="wire-chip kind-flow"><i></i><b>Then</b> runs next</span>
  <span class="wire-chip kind-condition"><i></i><b>When</b> tests a condition</span>
  <span class="wire-chip kind-unlock"><i></i><b>Unlocks</b> opens an objective</span>
  <span class="wire-chip kind-data"><i></i><b>Data</b> carries a value</span>
</p>`;

/* ── The page ───────────────────────────────────────────────────────────── */

function page(node, v) {
    const slug = slugOf(node.type);
    const cat = catById[node.category];
    const i = ORDER.findIndex((n) => n.type === node.type);
    const prev = ORDER[i - 1];
    const next = ORDER[i + 1];

    const when = (v.when ?? []).map((p) => `<p>${p}</p>`).join("\n");
    const game = v.game ? `<h2>In the game, this looks like</h2>\n<p>${v.game}</p>` : "";

    /* Fields, in inspector order, skipping the ones that are only headings. */
    const fields = node.fields
        .filter((f) => f.kind !== "note" && f.kind !== "section")
        .map((f) => fieldBlock(node, f, v.fields))
        .join("\n\n");
    const sections = node.fields
        .filter((f) => f.kind === "section")
        .map(
            (s) =>
                `<h3>${esc(s.label)}</h3>\n` +
                s.fields.map((c) => fieldBlock(node, c, v.fields, 1)).join("\n\n"),
        )
        .join("\n\n");

    /* The lifecycle nodes have nothing to configure. Say so instead of leaving
       a heading over an empty page — an empty section reads as a bug. */
    const fieldsSection =
        fields.trim() || sections.trim()
            ? `<h2>Fields</h2>\n\n${fields}\n\n${sections}`
            : `<h2>Fields</h2>\n<p>This node has nothing to configure. It marks a moment in the story and runs whatever is wired after it.</p>`;

    const steps = (v.steps ?? [])
        .map((s) => `  <li>${s}</li>`)
        .join("\n");

    const mistakes = (v.mistakes ?? [])
        .map(([lead, rest]) => `  <li><b>${lead}</b> ${rest}</li>`)
        .join("\n");

    const messages = (v.messages ?? [])
        .map(
            ([label, anchor, gloss]) =>
                `  <li><a href="../checking.html#${anchor}">${esc(label)}</a> — ${gloss}</li>`,
        )
        .join("\n");

    const related = ORDER.filter((n) => n.category === node.category && n.type !== node.type)
        .map(
            (n) =>
                `  <li><a href="${slugOf(n.type)}.html">${esc(n.label)}</a> — ${esc(voice[n.type]?.oneliner ?? n.blurb ?? "")}</li>`,
        )
        .join("\n");

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(node.label)} — HackHub Quest Editor handbook</title>
<link rel="stylesheet" href="../manual.css" />
</head>
<body>
<div class="wrap">

${nav()}

<main>

<header class="hero">
  <h1><span class="cat-dot" style="background:var(--cat-${node.category})"></span>${esc(node.label)}</h1>
  <p class="tag"><span class="badge" style="color:var(--cat-${node.category})">${esc(cat.label)}</span>
  &nbsp;<code class="mono" style="color:var(--ink-4)">${esc(node.type)}</code></p>
</header>

<section id="node-${slug}-page">

<h2>What it does</h2>
<p>${v.what}</p>

<h2>When you'd use it</h2>
${when}

${game}

${fieldsSection}

<h2>Wires</h2>
${wiresTable(node, v)}
${LEGEND}
<p>A wire only joins two sockets of the same colour, and the editor draws the
wire in that colour. That is what the colours are for: match the colours and
the connection takes, mismatch them and it will not.</p>

${steps ? `<h2>Step by step: add this node to a quest</h2>\n<ol class="plain">\n${steps}\n</ol>` : ""}

<figure>
  <img src="../img/node-${slug}-inspector.png"
       alt="${esc(v.shotAlt ?? `The ${node.label} node selected on the canvas, with its inspector open on the right.`)}" />
  <figcaption>The inspector for <b>${esc(node.label)}</b>${v.shotNote ? `, ${esc(v.shotNote)}` : ""}.</figcaption>
</figure>

${mistakes ? `<h2>Common mistakes</h2>\n<ul class="plain">\n${mistakes}\n</ul>` : ""}

${messages ? `<h2>Messages you might see</h2>\n<ul class="plain">\n${messages}\n</ul>` : ""}

${related ? `<h2>Related nodes</h2>\n<ul class="plain">\n${related}\n</ul>` : ""}

</section>

<div class="pagefoot">
  ${prev ? `<a href="${slugOf(prev.type)}.html">← ${esc(prev.label)}</a>` : "<span></span>"}
  ${next ? `<a class="next" href="${slugOf(next.type)}.html">${esc(next.label)} →</a>` : ""}
</div>

<a class="totop" href="#node-${slug}-page">↑ back to top</a>

<footer class="colophon">
  HackHub Quest Editor handbook · documents editor build ${BUILD} ·
  field labels, hints, defaults and limits on this page are taken from the
  editor's own node definitions.
</footer>

</main>
</div>
<script src="../search-index.js"></script>
<script src="../manual.js"></script>
</body>
</html>
`;
}

/* ── Run ────────────────────────────────────────────────────────────────── */

const written = [];
const skipped = [];

for (const node of ORDER) {
    const v = voice[node.type];
    if (!v) {
        skipped.push(node.type);
        continue;
    }
    const missing = ["what", "when"].filter((k) => !v[k] || (Array.isArray(v[k]) && !v[k].length));
    if (missing.length) {
        throw new Error(`${node.type}: voice entry is missing ${missing.join(", ")}`);
    }
    const html = page(node, v);
    const file = join(OUT, `${slugOf(node.type)}.html`);
    if (CHECK) {
        const before = existsSync(file) ? readFileSync(file, "utf8") : null;
        if (before !== html) written.push(`${slugOf(node.type)}.html (would change)`);
        continue;
    }
    writeFileSync(file, html);
    written.push(`${slugOf(node.type)}.html`);
}

console.log(
    `${written.length} node page${written.length === 1 ? "" : "s"} ${CHECK ? "to write" : "written"} · ` +
        `${skipped.length} awaiting prose`,
);
if (skipped.length) console.log(`  no voice entry yet: ${skipped.join(", ")}`);
