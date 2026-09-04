# Step 2 — Editor shell: schema, store, canvas, inspector

This document records what Step 2 built and, more importantly, the **contracts** the
remaining steps are now written against. Step 3 (website builder + conversation
editors) and Step 4 (export engine) extend this shell; they do not restructure it.

The architecture it implements is in
[`01-analysis-and-architecture.md`](01-analysis-and-architecture.md).

---

## 1. What ships in this step

| Area | Files | What it does |
|---|---|---|
| Schema | `src/schema/{common,nodes,edges,registry,project,events,index}.ts` | The `ProjectDocument` model: 32 node types, 4 edge kinds, recursive network devices, 92 game events |
| Store | `src/store/{editor,autosave}.ts` | Zustand + Immer; undo/redo, path-addressed writes, autosave |
| Canvas | `src/editor/canvas/*` | React Flow surface, typed nodes and edges, socket-level connection validation |
| Palette | `src/editor/palette/NodePalette.tsx` | Searchable, category-grouped, drag-or-click node library |
| Inspector | `src/editor/inspector/*` | Registry-driven field renderer, event picker, condition builder, list + device-tree editors |
| Shell | `src/editor/shell/*`, `src/App.tsx` | Top bar, quest tabs, status bar, toasts, template gallery, shortcut sheet |
| Templates | `src/templates/index.ts` | Blank / Hello Hack / Simple Linear Wi-Fi Hack |

35 source files, ~7,250 lines, **200 tests passing**.

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck && npm test && npm run build
```

---

## 2. The schema is the product

Every node type is described **once**, in `NODE_TYPES_REGISTRY` (`src/schema/registry.ts`),
and four different subsystems read that single description:

```
                     ┌── palette  (label, blurb, icon, category)
NODE_TYPES_REGISTRY ─┼── canvas   (sources[], targets[] → handles)
                     ├── inspector (fields[] → the entire form)
                     └── export    (hook → which lifecycle method emits it)
```

Adding a node type is therefore a single registry entry: it appears in the palette,
renders on the canvas with the right sockets, gets a full inspector form, and is
visible to the compiler — with no component changes. The 32 existing types are the
proof; the compiler in Step 4 consumes the same table.

`NodeTypeDef`:

```ts
interface NodeTypeDef {
    type: NodeType;
    category: CategoryId;
    label: string;       // "Wi-Fi access point"
    blurb: string;       // one line under the label in the palette
    icon: string;
    targets: HandleSpec[];   // input sockets
    sources: HandleSpec[];   // output sockets
    hook: "onStart" | "onObjectivesStart" | "onComplete" | "onAbandon" | "declarative";
    fields: FieldDef[];  // the inspector form
    create(): unknown;   // default data, from the Zod schema
}
```

### The discriminated union must stay generic

`src/schema/nodes.ts` builds all 32 node schemas through one helper:

```ts
const node = <T extends string, D extends z.ZodTypeAny>(type: T, data: D) => …
```

The generics are load-bearing. An earlier non-generic version
(`(type: string, data: z.ZodTypeAny)`) made `z.literal(type)` infer
`ZodLiteral<string>` and every node's `data` infer `unknown`, silently collapsing the
32-way discriminated union into one undifferentiated shape — TypeScript reported no
error. `summarize.ts`'s `const exhaustive: never = node` guard caught it. **Any future
schema helper that takes a literal or a nested schema must be generic the same way.**

---

## 3. Connection rules

Wires are typed. `canConnect(sourceKind, targetKind)` is a pure function over four
kinds, and it is enforced in two places: React Flow's `isValidConnection` (so an
illegal wire cannot be drawn) and `store.connect()` (so it cannot be created
programmatically either).

| Kind | Meaning | Colour |
|---|---|---|
| `flow` | "then do this" — execution order | slate |
| `condition` | trigger → objective: *this event completes it* | cyan |
| `unlock` | objective → objective: *prerequisite* | emerald |
| `data` | value passed between nodes | violet |

Handle layout, all derived from the registry:

| Node type | Targets | Sources |
|---|---|---|
| `entry.*` | — | `out` |
| `objective` | `in`, `trigger`, `unlocked-by` | `done`, `unlock` |
| `trigger.event` | `in` | `when` (condition) |
| `reply.input` | `in` | `success`, `failure` |
| `flow.branch` | `in`, `trigger` | `true`, `false` |
| `flow.note` | — | — |
| everything else | `in` | `out` |

`store.connect()` additionally rejects self-loops and exact duplicate wires.

---

## 4. Lifecycle hooks

The SDK runs `OnStart()` **once** at claim, and `OnObjectivesStart()` at claim *and on
every game start*. Listeners registered in `OnStart()` die on reload — a class of bug a
non-coder cannot diagnose. So the registry declares, per node type, which lifecycle
method it must be emitted into, and the compiler will obey it:

| Hook | Node types |
|---|---|
| `onStart` | world-building, effects, comms sent once (mail, tweet, network creation…) |
| `onObjectivesStart` | `reply.*`, `flow.branch` — anything that listens for player input |
| `declarative` | `objective`, `trigger.event`, `flow.note` — data, not code |
| `onComplete` / `onAbandon` | cleanup |

The inspector shows the hook as a chip on the selected node so the author can see the
distinction without needing to understand it.

---

## 5. Store contract

`src/store/editor.ts`. One serialisable `ProjectDocument` is the only source of truth;
React Flow's runtime fields (`selected`, `measured`, `dragging`) are mapped out on the
way in and never reach the document.

- **`mutate(recipe, { history })`** — every write goes through this. It snapshots
  `original(state).project` via `structuredClone` into `past` (capped at 120) unless
  `history: false`.
  > `original()` matters: inside `produce`, `state.project` is an Immer draft *proxy*,
  > and `structuredClone` throws `DataCloneError` on it. This bit the first undo/redo
  > implementation; the store tests now cover it.
- **`beginTransient()` / `commitTransient()`** — drag start/end, so one drag is one undo
  step. Viewport pans opt out of history entirely.
- **`setPath` / `getPath`** — dotted *and* numeric keys (`attachment.name`,
  `messages.2.content`). Intermediate containers become arrays when the next segment is
  numeric. This is what lets the inspector address a list row by position without
  threading callbacks.
- **`updateNodeData(nodeId, patch)`** — the inspector's only write path.

`src/store/autosave.ts` debounces a write of the whole document to `localStorage`
(600 ms), revalidates it against `ProjectSchema` on load, and **discards** anything
that fails to parse — a corrupt draft must never wedge the editor.

---

## 6. Inspector contract

`Field` switches over `FieldDef.kind` and renders:

`text` · `textarea` · `number` · `toggle` · `select` · `event` · `conditions` ·
`list` · `deviceTree` · `section` · `note`

Reads go through `getPath(node.data, path)`; writes go through
`updateNodeData(nodeId, { [path]: value })`. Nested paths mean a `list` field can be
rendered recursively — a port row inside a device inside a router — with no extra
plumbing.

**The event picker offers all 92 events with their real payloads**, grouped into ten
categories, and lets an author type a custom event name (`MyMod.CustomEvent`) for
another mod's events. **The condition builder** offers the payload's actual fields as a
combobox, warns on an unrecognised field, and offers `{{runtime.tokens}}` as values.
This is the direct payoff of generating the catalogue from `index.d.ts` instead of the
docs' stale table.

---

## 7. Decisions taken during the build

1. **Templates carry explicit quest ids** (`q-wifi-hack`, …) and a counter-based node-id
   generator, so `build()` is byte-identical every call. Step 4's codegen must be
   diffable and snapshot-testable, and a `nanoid()` in the fixture would defeat that.
2. **`ProjectSchema.quests` has `.min(1)`**, and `store.removeQuest` refuses to remove
   the last quest. The whole shell assumes an active quest exists; making that a schema
   invariant is cheaper than defending against it in eight components.
3. **`ReactFlowProvider` is hoisted into `App`**, above the palette, canvas and
   inspector, rather than wrapping only the canvas. The palette calls `getViewport()` to
   place a node at the canvas centre; a provider scoped to the canvas alone leaves it
   with an empty store and it throws on first render.
4. **No SMS editor** (see `01-…` §8). The comms category is Phone calls, E-Mail,
   Kisscord, WeeChat and Twotter.

---

## 8. Bugs this step's tests caught

Recorded because they are the kind that recur:

| Bug | Caught by |
|---|---|
| `ReactFlowProvider` scoped too low → whole app crashed on mount | `app.test.tsx` smoke test |
| `Tabs.Trigger` outside `Tabs.List` → Radix `RovingFocusGroup` throw | `app.test.tsx` |
| `structuredClone` on an Immer draft → `DataCloneError` on undo/redo | `editor.test.ts` history suite |
| `payloadFields("void")` returned `["void"]`, offering a nonsense condition field | `schema.test.ts` |
| `removeQuest` could empty `quests`, violating `.min(1)` | `editor.test.ts` |
| `eventLabel` contradicted its own doc comment | `schema.test.ts` |
| `@apply field-input` on a plain class → **build failure** under Tailwind v4 | `npm run build` |

Tailwind v4 only resolves `@apply` against real utilities, so the three shared control
bases (`field-input`, `btn`, `btn-ghost`) are declared with `@utility` in
`src/index.css`.

---

## 9. Next: Step 3

- **Website builder** — `world.website` / `world.page` nodes get a WYSIWYG page editor
  and a template library; `seo: false` pages are surfaced as *hidden clues for
  `dirhunter`*, which is the mechanic the game exposes (see `01-…` §7.3).
- **Conversation editors** — visually distinct surfaces for Phone calls (`Quest.Dialog`),
  E-Mail, Kisscord (with `unlocksAfter` gating) and WeeChat.
- **Reply mechanics** — `reply.hackertyper` (mash keys, predefined text types out) and
  `reply.manual` (type a phrase; success/failure branches via exact match or regex).
  Both map to `tools.prompt`, the only SDK primitive that captures player-typed input.

The registry entries for all of these already exist; Step 3 replaces their generic
`list`-of-messages fields with purpose-built editors.

---

## 10. Visual feedback round

After the first look at the running editor, three problems were reported and fixed.
They are recorded here because each one points at a rule worth keeping.

### Sockets were too small to grab

Two causes, only one of them cosmetic:

1. The node card had `overflow-hidden`. React Flow places handles *straddling* the
   border, so the outer half of every socket — and half its hit area — was clipped.
2. The visible dot was 9px with no extra hit area.

Fix: drop `overflow-hidden` (the accent bar rounds itself instead), size the dot at
13px, and widen the grab area with an invisible `::before { inset: -12px }`. The
pseudo-element extends the hit box **without changing the element React Flow
measures**, so edges still anchor on the dot's centre.

Hover feedback uses a `box-shadow` ring rather than `transform: scale()` — React Flow
owns the handle's transform for centring, and overriding it knocks the socket off its
anchor.

Sockets are now coloured by connection kind, and `flow` moved off grey to blue: a
socket you cannot see is a socket you cannot grab, and flow is the wire an author
draws most often.

### The flow read as four unrelated fragments

The real problem was that the four lifecycle nodes *are* four unrelated roots, and
nothing said so. Changes:

- **Renamed** to state when they fire: *On quest claim*, *On start & reload*,
  *On quest complete*, *On quest abandoned*.
- **The entry-point note now says the thing people get wrong**: they never connect to
  each other, and listeners belong under *On start & reload*.
- **Templates only include the entry points they use.** An empty lifecycle node is
  noise a beginner has to reason about. The blank template keeps all four plus a note,
  deliberately unconnected, to teach that before it becomes a bug.
- **A pure analysis layer** (`src/analysis/graph.ts`) flags the problems that are
  actually fatal: an objective with no trigger (blocking), an unreachable node, a
  branch or manual-input outcome that goes nowhere, an unused entry point. It renders
  as a badge on the offending node and a count on the canvas. Step 4's export report
  reuses it verbatim.
- **A "Tidy up" button** runs a deterministic layered layout (depth from the roots
  becomes the column) so the graph always reads left to right.

One subtlety worth keeping: the reachability BFS must seed from `entry.*` **and**
`trigger.event` **and** `objective`. An objective is activated by whatever fires into
its trigger socket, not by a lifecycle node — seeding only from `entry.*` flagged every
objective-led chain as unreachable.

### There was no answer to "what do I type here?"

147 fields, 27 explanations. Both halves were fixed:

- **Every field now has a hint** — 140 hints across the registry, each saying what the
  *game* does with the value rather than restating the label. A test enforces it:
  `gives every editable field an explanation` fails the build if a new field ships
  bare, and a second test rejects hints that are too short to say anything or too long
  to read in a tooltip.
- **Hints moved behind an ⓘ tooltip** on the field label. Printed under every field
  they made the inspector a wall of grey text; behind a tooltip all 140 cost nothing
  vertically.
- **A "Node Reference" template** puts all 32 node types on one canvas, filled with
  example input, laid out by category. It is the fallback for anyone who would rather
  look at a filled-in example than read a tooltip.

### Bugs this round caught

| Bug | Caught by |
|---|---|
| `AttachmentSchema.id` was required but the inspector writes attachments as a nested section, so no id was ever supplied — an author adding an attachment produced an invalid document | templates suite (`ZodError` on `attachment.id`) |
| The registry's `create()` seeds device/rule ids with `nanoid()`, so **templates were not deterministic** — which would also break Step 4's byte-identical codegen | `builds deterministically` |
| `quest.dataKeys` is an array of `{ key, type }`, not strings | templates suite |
| Reachability seeded only from `entry.*`, flagging every objective-led chain | `reaches every node from an entry point` |
| The generator script's hint-inserter mistook a hint on a select *option* for the field's own, silently skipping `ipMode` and `action` | the new hint-coverage test |

The last one is worth naming: a script that edits 140 places in a 990-line file by line
surgery corrupted the file twice before it worked. The version that shipped does one
provably-local thing — insert after a field's own `key:` — and is idempotent. See
`reference/add-hints.py`.

---

## 11. Screenshot round two: overlap and label clutter

A look at the branching template surfaced two defects.

**Nodes overlapped.** The hand-written template positions put a trigger node almost
exactly on top of a world node (`domain` at 640,160 vs the nmap trigger at 660,150).
Hand-written coordinates are exactly as fragile as they look, so the templates now
build their positions with the *same* `layeredLayout()` the canvas' Tidy up button
uses — applied whenever a graph has wires. The reference sheet stays a deliberate
grid. A regression test fails if any two template nodes' bounding boxes intersect.

**Socket labels sat on top of the node's own text.** The labels were rendered inside
the card, over the summary lines. Two-part fix:

1. They now render in the **gutter outside the card**, vertically centred on their
   dot, so they can never cover the node's content.
2. They are only shown **on hover, on selection, or while a wire is being dragged**
   (`useConnection().inProgress`). At rest the coloured dot and the legend are
   enough; the names appear precisely when you are about to use them.

Cards were also given a fixed `w-60` width so columns are predictable for the layout
and the gutter has room for the labels. Column gap widened to 360px accordingly.

---

## 12. Feedback round three: chrome bugs, share, and a hint QA pass

**Inspector collapse button covered the "Node" tab.** It was pinned `top-left` of the
inspector, exactly on the first tab. Moved to the right of the tab bar, where the row
is empty.

**The minimap showed only the grey viewport rect.** First guess (CSS variables in an
SVG fill) was wrong — React Flow sets the minimap fill through `style`, where `var()`
resolves fine. The real cause: the MiniMap only draws a node whose *user-node* carries
dimensions, and dimensions arrive as `dimensions` changes in `onNodesChange`, which we
discarded. So every minimap rect bailed out at `nodeHasDimensions`. The canvas now folds
those measurements back into the nodes it hands React Flow (transient state, not saved
to the document), and the minimap paints one coloured rect per node.

**Template import/export.** New `src/templates/share.ts`: `downloadProject()` writes
the whole `ProjectDocument` as `<mod-id>.quest-editor.json`; `parseProjectFile()`
validates an imported file against `ProjectSchema` and rejects it with a readable
reason (never half-loads). Both buttons live in the Templates dialog. Round-trip and
rejection are unit-tested.

**Hint QA pass** — reading every popout as a player, not a programmer:

- Fixed two *swapped* hints: `mail → To` had the files hint, and `files → target` had a
  stray action hint.
- `Set quest data → Value` now states plainly that any text is accepted and nothing
  there can error (answering "should this be a dropdown?": no — it is free text plus
  `{{data.name}}` inserts, and the hint now says so).
- Objective hints softened from rules to suggestions ("Nudge, don't solve" → "as
  gentle or as cryptic as you want").
- Removed internal references a player can't act on ("Step 3", `Shell.addCommandData`),
  and jargon like `unlocksAfter`, "regular expression", "reverse shell".

**Hint coverage, measured.** A throwaway audit over the registry counted **112 field
descriptors, 104 of them inputs — and all 104 carry a hint**; the 8 without are
informational note/section rows. The remaining jargon scan now returns only intentional
in-game command names (`fern`) and the Discord-style formatting note.

**Layout: keep wired pairs together.** `layeredLayout` seeded each column with the
author's order and never reordered, so a node could land rows away from the one feeding
it (e.g. *On quest complete → Pay the player*), and long crossing wires made the graph
look more tangled than it is. The columns are now refined with four barycenter sweeps
(pull each node towards the mean row of its neighbours, right then left), with the
author's order as seed and tiebreak. Deterministic as before; the investigation
template now places both flagged pairs on the same row.

---

## 13. Step 3 — messaging simulators and the website builder

**Communication nodes now edit inside a live, game-styled preview** instead of a
bare field list:

- **Kisscord** — a DM window: NPC bubbles left, the player's right, lock chips on
  gated messages. The script editor below paces lines (delay in seconds), flips
  sender, and gates any message behind quest objectives with tappable chips
  (the SDK pauses the chain at the first gated message and resumes on completion).
- **WeeChat** — an IRC terminal log (`[hh:mm] <nick> line`), with username, delay
  and sender per line.
- **Mail** — an inbox reading view (subject, from/to, rendered HTML body,
  attachment chip) above the existing fields.
- **Phone call** — the dialog tree itself, with a tappable phone preview. Branches
  live on the quest (several call nodes can share a script); each line has speaker,
  text, timeout and end-of-call, and player choices can continue, jump to a line,
  switch branch, or hang up. The preview plays the script so authors can feel the
  conversation before shipping it.

**Website builder** (`Websites` in the top bar): a mod-level site list, per-site
pages, and an edit/preview workspace. Pages are WYSIWYG — a contentEditable surface
styled like the rendered page (bold/italic/underline, headings, quote, lists,
links) storing HTML, previewed inside a fake in-game browser with the real
`host + path` in the address bar. Five ready-made page templates ship, including a
**hidden clue page** that starts unlisted in a deep sub-directory.

The dirhunter contract is surfaced as one honest toggle: **"Listed in the in-game
search"**. Off means the page stays routable but leaves the search index — exactly
what `dirhunter` brute-forces — and both the page list (lock glyph) and the preview
(a banner) say so plainly.

Websites live on the project document (`project.websites`), shared by all quests;
the Step 4 compiler will write each page to the mod's website output verbatim.

**Template discoverability fix.** The page templates originally sat behind an
unlabeled "+" icon two clicks deep — opening the builder on a project with no
sites showed nothing but "No websites yet." Now the empty state offers **site
templates** ("Corporate site" with a hidden audit page, "Leak archive") next to a
blank-site button, and the pages column has a labeled **New page** button whose
picker lists the five page templates with blurbs.

**Pages are full HTML documents now.** Real sites — including the ones authors
bring from LLMs — are self-contained documents with their own `<style>`, inline
SVG and scripts; a fragment-only model made templates look like bland blog pages.
Consequences in the builder:

- The workspace has three modes. **Visual** renders the page's own document in an
  isolated iframe with the body editable, so the page's CSS applies while editing
  and can never leak into the builder; images inserted from disk are embedded as
  data URIs because the game's web views have no internet. **Code** exposes the
  complete document for copy-pasting html/css/js. **Preview** runs the document
  (scripts included) inside a sandboxed iframe behind a fake browser bar.
- **Load HTML** replaces the page with a finished `.html` file from disk; bare
  fragments are wrapped in a styled base document.
- Templates were rebuilt as believable sites: a corporate suite (front page with
  hero and cards, team directory, status dashboard, contact), a deliberately plain
  "printed memo" hidden page, and a space-agency homepage in the style authors
  already bring (dark hero, orbit SVG, missions with status tags, newsroom, staff
  directory, dead employee portal). Site templates: Corporate, Public agency,
  Leak archive. Blank sites start from a styled starter page, not a bare fragment.

**Template repertoire round two.** Three more site templates, each built from new
page designs so authors get references, not just more of the same: a
Substack-style **newsletter blog** (landing with subscribe box, full article,
hidden drafts page), a Reddit-style **forum** (front page with vote rails whose
top post opens into its own nested comment thread), and a **recipe site**
(card-grid home plus full recipe page with ingredients panel and numbered
method). That makes 6 site templates over 13 page templates.

Site templates are no longer an empty-state-only affair: the sites column "+"
opens a picker offering blank plus every site template at any time, and each
page has a **Duplicate** button so one designed page can seed several
(`path` + `-copy`, selected immediately).

**The community naza page is now the Public agency template, verbatim.** The
author committed `src/editor/websites/naza-homepage.html` to the branch; the
`agency` page template and site template import it with `?raw`, so that file is
the single source of truth (the earlier hand-built placeholder is gone). The
"no external resources" test now bans resource URLs (`src=`/`href=`/`@import`/
`url(...)`) rather than the string "http", since prose and the SVG xmlns are
not fetches.

**Round ten: scans, row actions, and a highlighted code view.** Uploaded
single-file sites (like the naza page) keep their contents invisible to the
builder's page list, so the workspace now carries a **Document scan** panel:
`scanDocument()` reports internal path links missing from the site (with a
*Create N missing pages* stub action), in-page anchor sections ("these jump to
sections inside this page" — naza's `#missions`/`#portal` nav is section-based,
not multi-page), HTML comments with the first snippet shown (the classic
view-source clue, e.g. naza's temp-password ops note), and script/form counts.
The duplicate and delete buttons moved off the workspace toolbar onto each page
row, revealed on hover: duplicate as before, delete red with a Radix
AlertDialog confirm ("Do you really want to delete this page?"). The code view
gained Prism syntax highlighting (transparent textarea over a highlighted
`<pre>`, synced scroll) and a **Format** button that lazy-loads
`prettier/standalone` + the html plugin.

**Round eleven: naza rebuilt as real pages, plain-language scans, AI prompt.**
Claude's community naza file was a single-file site whose nav used in-page
anchors — fine in a browser, useless for quests (no `/portal` page to gate, no
unlisted page for dirhunter). `scripts/build-naza-pages.mjs` now slices it into
8 real pages under `src/editor/websites/naza/` (home, missions, humans,
science, news, directory, portal, and an unlisted `/it/helpdesk`), keeping the
original stylesheet, gov bar, header and footer verbatim; anchor links became
path links, the directory gained an Employee ID column (NZA-3419 for t.reyes),
and the unlisted helpdesk page spells out the temp-password format — the
portal's comment clue is now solvable in-game. The agency site template ships
all 8 pages (`/it/helpdesk` hidden from search); page templates offer landing,
portal and helpdesk individually. The document scan was rewritten for
non-programmers ("Inside this page", ⚠️/🥚/⚙️ findings with what-to-do, dead
links get a *Fix it: create the missing pages* button), and the toolbar gained
an **✨ AI website prompt** popout: describe the site, copy a generated prompt
that teaches any LLM HackHub's quirks (one self-contained .html per page, no
internet resources, real path links, one unlinked secret page), then Load HTML
the results.

**Round twelve: prompt advice not commandments, naza beauty fix, discoverable
dialogues.** The AI prompt now says 1–6 pages, names no specific fonts (the LLM
may pick any OS font), and every secret is optional advice ("you can…") since
quest design decides. The naza pages' visual regression is fixed: the
generator double-wrapped the stylesheet (`<style><style>`), which poisoned the
first CSS rules — the `:root` variables died, turning the gov bar white-on-
white and the type serif; all 8 pages now carry one clean style block. The
dialogue editor (branch scripts, choices, phone preview) was extracted into a
shared `BranchScriptEditor` and now has a top-level home: a **Dialogues**
button in the top bar opens it for the active quest without placing a call
node first; the phone node inspector uses the same editor.

**Round thirteen: the general dialogue node.** The four separate comms nodes
(phone call, Kisscord, e-mail, WeeChat) are now one palette entry —
**Dialogue** — whose inspector card shows its flavour and the first words of
its first line, and opens the dialogue editor. Inside, a type selector opens
the matching interface: phone (quest-shared branches, choices, typed replies
with wrong-answer routes), Kisscord (DM chain with objective gating, player
sends hackertyper-style, file uploads, typed answers), mail (compose +
attachment + reading view), WeeChat (IRC log with typed answers). Every
"player types" moment takes an expected answer, match mode, case, a
wrong-answer line, and a wrong route (try again / end / the node's new Wrong
output). The phone preview gained a replay button. Saved projects with the old
node types migrate automatically (`schema/migrate.ts`). The reference template
and counts now know 29 node types.

---

## Addendum — Round 14: Step 4 export compiler

**Export dialog (top bar → "Export mod").** Compiles the whole project into a
build-free HackHub mod folder and downloads it as a zip:

- `manifest.json` — id/name/version/author/description, `apiVersion: 1`, and a
  **permissions list computed from the graph** (network/mail/shell/events/ui/
  bank — only what the nodes actually need).
- `dist/mod.js` — the mod the game loads directly. It embeds the project as
  JSON plus a small interpreter (plain ES2020, no build step for the player):
  quests register with Objectives (unlock edges → `unlocksAfter`, trigger
  events → declarative `trigger.condition`), mails/dialogs/chats/tweets,
  websites with `seo:false` pages staying out of the search index (the
  dirhunter hiding place), and typed-answer moments becoming terminal
  commands (`qe-…`) that emit `QE.<id>.ok` / `.wrong` events for your graph.
- `src/index.ts`, `package.json`, `esbuild.config.mjs`, `tsconfig.json`,
  `README.md` — for power users who want to rebuild/extend the mod.

**Export-time advice (never blocking):** standalone world.port/files/firewall/
domain/database and handbook nodes, phone input commands, Kisscord uploads,
and unlisted pages each surface a plain-language note in the dialog.

**Verification:** `src/compiler/__tests__/compile.test.ts` evals the emitted
`mod.js` against a stub SDK — quests/websites/commands register, `OnStart`
creates the subnet and sends the mail, trigger conditions evaluate against
event payloads, and input commands branch on the typed answer. The full
reference template (every node type) compiles and runs through the
interpreter. 289 tests green.

---

## Addendum — Round 15: full QA sweep (code + UI/UX)

**Method:** two passes. (1) Code QA: whole-suite reruns for flake detection,
a cross-cutting invariants suite (`src/__tests__/qa.test.tsx`: registry
completeness, defaults round-tripping through zod, crash-free summaries,
every template compiling **and its emitted mod.js running**, hostile-text
compilation, corrupted-draft autosave), plus an end-to-end read of the
round-14 compiler. (2) UI/UX QA: a whole-app smoke suite
(`src/__tests__/appSmoke.test.tsx`) that mounts the real `App`, walks every
top-bar surface, exercises canvas render + undo, and fails on any
console.error/warn; plus accessibility and design-token audits.

**Bugs found and fixed:**

- **Compiled mods could not complete objectives.** `completeObjective` was
  never called — objectives only completed via declarative triggers. Flow
  reaching an objective node now ticks it off.
- **`reply.input` didn't wait for the player.** Flow arriving at the node
  immediately followed the "Correct" path; it now pauses and is resumed by
  the generated terminal command (Correct/Wrong handles included).
- **Hackertyper flow-outs were dead** and the widget re-emitted its event on
  every keypress after completion. Reveal now resumes the flow (listener
  registered in `OnObjectivesStart`) and emits exactly once.
- **Blank hackertyper event names** emitted `""` despite the inspector
  promising a generated name; both widget and listener now use
  `QE.ht.<nodeId>` when blank.
- **Autosave silently swallowed foreign data:** any JSON object parsed as a
  blank project (all fields have zod defaults), quietly replacing a draft.
  The draft envelope (`kind`) is now sanity-checked before schema parsing.
- **Flaky test hardening:** compiler tests used fixed 10–20 ms flushes; they
  now settle deterministically (observed failure on a cold run).
- **A11y:** ListEditor move buttons had `title` but no accessible name.

**Audit results (no action needed):** all custom design tokens used in TSX
are defined in `@theme`; every icon-only button and search/file input has an
accessible name; every Radix dialog has Title+Description; no div-onClick
anti-patterns; destructive canvas actions are undo-covered and site deletion
is confirm-gated.

**Verification:** 298/298 tests (13 files), `tsc --noEmit` clean, production
build OK.

---

## Addendum — Round 18: real-game feedback (auto-start naming, Wi-Fi reality)

- **“On quest claim” → “Quest start.”** The old name implied the node only runs
  after the player manually accepts; with “Start automatically” on it runs on
  install. Label, blurb, node-card summary and the lifecycle note all updated.
- **Wi-Fi, verified against SDK 0.21.0:** `Network.createWifiNetwork` **does not
  exist** (docs/01 §2.4 corrected). The emitted mod now feature-detects it — if a
  future SDK ships one it is used; otherwise the node falls back to
  `createSubnetNetwork` (a regular router at the node's IP) instead of calling an
  undefined function. The Export dialog warns in plain language.
- **Signal strength** became a labelled 0–3 slider (new `slider` inspector field
  kind) with an honest hint that the current mod SDK does not read it yet.
- Compiler tests cover both Wi-Fi paths (fallback + future-native). 302 tests.

---

## Addendum — Round 19: playtest feedback sweep (13 items)

**Phase 1 — bugs & Mod tab.** Mail "From" now reaches the game via
`sendMail(index, from)` (QuestMailDefinition has no `from` — the game used to
fall back to the employer address). `Bank.transfer` did not exist: pay/charge
now call `Bank.transaction`/`Bank.withdraw`, with a new fixed-or-percentage
amount mode (`Bank.getBalance()` drives the percentage). Wait node switched
from ms to seconds (migration rewrites old drafts). Mod tab: real image
pickers for cover/icon (PNG/JPG, embedded in the project, decoded into
`assets/…` files in the zip and referenced by path in the manifest — `tags`
now land in the manifest too). Tag input rebuilt: chips, Enter/comma commit,
Tab-autocomplete and a common-tags quick list (the old field split on every
keystroke, which ate spaces). All hint/descriptor text brightened
(`text-ink-4` → `text-ink-3`, node blurbs `text-ink-2`).

**Phase 2 — canvas.** Left-drag is now a selection marquee (panning moved to
middle/right mouse), `SelectionMode.Partial`; Ctrl+C/X/V/D copy, cut, paste,
duplicate multi-selections (internal wires included, fresh ids, +32px
offset). Flow wires animate with subtle marching dashes. Double-clicking a
wire drops a `flow.reroute` nodule that splits it — fan-out and tidying,
pass-through at runtime. `layout.group` frames: named/commentable, resizable
(NodeResizer), drag the frame and every node whose centre is inside moves
with it; frames render behind cards (zIndex −1) and are skipped by the graph
analysis and the compiler.

**Phase 3 — tweets.** Compiled against SDK 0.21.0's real shapes:
`TweetDefinition` is flat (`accountId`, `image?`, `likes?`…) — the old
docs-era `{interaction, showInTimeline}` shape is gone; accounts get required
`id`/`displayName`/`avatar`. New Quest-tab "Twotter accounts" editor
(username, display name, avatar upload, bio, verified); the tweet node got an
account picker and an optional attached picture.

**Phase 4 — answered without code.** The suspicion/"you got hacked" minigame
is **not exposed** in SDK 0.21.0 (no matches for suspicion/minigame/counter-
hack in `index.d.ts`), so a "Hack the player" node is not possible today.

**Verified against the SDK's own `index.d.ts` (0.21.0, npm):** `sendMail(
index, from?, to?)`, `QuestMailDefinition {title, content, replyable?,
attachment?}`, `Bank.{transaction, withdraw, getBalance, getPlayerAccount}`,
`TweetDefinition {accountId, content, image?, likes?, comments?, shares?,
views?, postedAgo?}`, `TwotterAccountDefinition {id, username, displayName,
avatar, …}`, `ModManifest {icon?, cover?, tags?}`, no Wi-Fi/suspicion APIs.

**Verification:** 320 tests (15 files), `tsc --noEmit` clean.

---

## Addendum — Round 20: Twotter search crash (game-breaking)

**Symptom (QA-filedump):** searching a mod-registered account in Twotter
crashed the game: `TypeError: Cannot read properties of undefined (reading
'toLowerCase')`, preceded by a moment.js deprecation warning (that one is the
game parsing `postedAgo: "3h"` — cosmetic noise, not the crash).

**Root cause:** accounts with no avatar shipped `avatar: ""`. `avatar` is the
one asset-like string on `TwotterAccountDefinition`; the game parses it and an
empty string yields `undefined` before `.toLowerCase()`. (Tweet images as raw
data URLs are the same risk class.)

**Fix:** the compiler now emits Twotter assets as real files — uploaded
avatars/pictures are decoded into `assets/twotter/…`, accounts without an
avatar get a generated 64×64 placeholder PNG, and the emitted project
references the files by path. Verified by recompiling the user's exact
crash-causing project. Mods exported before this fix must be re-exported.

---

## Addendum — Round 21: the Twotter search crash, take two

Round 20 gave every account a real avatar file; the crash persisted
(user-confirmed with the `QA-filedump` mod). Root cause, finally pinned: the
**platform** record (`TwotterUser`) requires `name`, `surname`, `banner`,
`joinedAt` and `password`, but the quest-level `TwotterAccountDefinition`
cannot express any of them — the game's converter leaves them `undefined`,
and the Twotter search UI dereferences one of them
(`TypeError: Cannot read properties of undefined (reading 'toLowerCase')`).

**Fix:** exported mods now register accounts through the platform API in
`OnModPackageLoaded` — `Twotter.createUser()` (which fills sensible defaults
for exactly those fields) + `Twotter.addUser()`, deduped via
`getUserByUsername`. The quest-level `TwotterAccounts` assignment remains
only as a fallback for games without that API.

**Verified against the user's crashing project** (QA-filedump): compiling it
with the fixed compiler and running the emitted `mod.js` against a stub
platform yields a complete user record (every `TwotterUser` field defined),
no quest-level double registration, and the tweet resolving to the right
account id. 324 tests green.

---

## Addendum — Round 24: canvas polish, a Sequence node, and remembered tags

Seven items from the user, checked against the SDK (`@hotbunny/hackhub-content-sdk@0.21.0`
`index.d.ts`) before any test was written.

**1. Tweet card said “no account yet” after an account was picked.** The card
printed the raw `accountId`; with an id like `acc_9f2` and no lookup, an empty
picker and a filled one read almost the same. `summarize()` now resolves the id
against `quest.twotterAccounts` and shows the real `@handle`, or says the
account is “not in this quest” if it was deleted. (SDK: `TweetDefinition.accountId`
must match a `TwotterAccountDefinition.id` — the id is the right thing to store,
only the display was wrong.)

**2–4. Reroute nodule.** Its two 13px sockets each carried a 37px invisible grab
ring, so the entire 16px nodule was socket: it could not be clicked, dragged or
selected — which is why pressing Delete removed the wires (those *were*
selectable) and left the nodule behind. It is now a 36px node with a 22px ring
you grab, and its sockets are trimmed to the dot in the middle (`.qe-reroute`
rules in `index.css`). Both sockets sit on the same point, so the nodule reads
as **one** dot: wires arrive at and leave from the centre, and any number of
wires can be dragged out of it. Deletion needed no store change — proven by a
mounted-app test that selects the nodule, presses Delete and asserts both the
node and its wires are gone.

**5. Group frames** grew a colour-picked title bar spanning the frame (8 preset
swatches plus a full colour picker; `color` on `LayoutGroupNodeDataSchema`,
default slate for older drafts). The label's ink flips between near-black and
near-white by luminance, so a yellow frame is still readable. Resize corners went
from React Flow's 5px to 9px with an invisible 7px pad around them.

**6. Wires** are now a solid line in the colour of the socket they leave, with a
row of round dots — slightly fatter than the wire — drifting along it towards
the target. One dot every 14px, one gap per 1.4s: exactly half the speed of the
marching dashes it replaces (28px/1.4s). The dot overlay is `pointer-events:
none`, so clicking a wire still selects the wire. The canvas legend was redrawn
to match. Honours `prefers-reduced-motion`.

**7. New node — `flow.sequence` (Flow control → “Sequence”).** One input, as many
outputs as the author adds; each output has a name and a pause in milliseconds,
and they fire top to bottom. Sockets are *derived from data*: `NodeTypeDef` gained
an optional `dynamicSources(data)`, and `sourcesOf(node)` (registry) is now the
single answer for “what outputs does this node have”, used by the canvas, the
store's `connect`, the analysis and the tests. Removing a step removes any wire
attached to it (`updateNodeData` prunes sockets that no longer exist), and an
unwired output is reported as a “Dead end” with sequence-specific wording.

*SDK grounding:* there is **no** scheduling/timer/sequence API anywhere in the
d.ts, so sequencing has to live in the emitted interpreter — but the step field
mirrors the SDK's own convention for chat chains (`delayMs`, “applied before it
is sent”). Waits now prefer `Random.sleep(ms): Promise<void>` (SDK 0.21.0) when
present and fall back to `setTimeout`; quest hooks may return promises
(`OnStart(): void | Promise<void>`), so awaiting a sequence is legal.

**8. The Mod tab remembers tags** the author invents (`src/lib/tagMemory.ts`,
browser-local, capped at 60, never exported). They appear in autocomplete and in
a “Your tags” strip, each removable from the memory.

**Launch.bat** now polls port 5173 and closes itself as soon as the editor
answers (opening the browser first); if the port never answers within a minute it
stays open with an explanation instead. No PowerShell on the PC → short fixed
wait.

**Verification:** 358 tests (17 files, +27), `tsc --noEmit` clean, `vite build`
clean. Node types: 31 → **32** (schema, reference template and its `nodeCount`
updated together). Export stamp: `EDITOR_BUILD = "2026-09-02.r24"`.

## Round 25 — six follow-ups from the r24 review

**1. The tweet card said “no account yet” while the dropdown showed one.** A
`<select>` whose value matches no option paints its *first* option, so an unset
account looked chosen. The picker now carries an explicit unset row (“— pick an
account —”, or “— account no longer exists, pick one —” when the stored id has
gone), a warning line “Nothing is posted until you choose an account”, and — when
the quest has exactly one account — a one-click **Use @username** button. A tweet
without an account is also reported by the analyser as a “No account” warning, so
it shows up in the issues list rather than only on the card.

**2. Noodle dots move again.** The travelling dots were a CSS keyframe, which lost
to stylesheet order in some builds. They are now SMIL inside the edge itself —
`<animate attributeName="stroke-dashoffset" values="0;-14" dur="1.4s"
repeatCount="indefinite">` — so the motion travels with the SVG and is visible in
the DOM (and assertable in tests). 14 px gap over 1.4 s = 10 px/s, in the
direction of the target. `prefers-reduced-motion` still stops it.

**3. The minimap paints nodes again.** React Flow's minimap draws nodes in array
order and ignores `zIndex`, so a group frame added after its contents covered
everything with an opaque rectangle. Frames are now sorted to the front of the
node list, and the minimap fills a frame with `withAlpha(colour, 0.22)` — a wash
of its own colour, not a lid.

**4. Reroute grab area is visible.** A 2 px `rgba(255,255,255,0.5)` outline sits on
the 36 px hitbox (`pointer-events: none`, so it never eats a drag), showing exactly
where the nodule can be grabbed versus where the 22 px ring is drawn.

**5. Tweets can be timed to the story.** New per-node toggle **“Post when the story
reaches this node”** (`postLive`, default off). Off — the existing, safe path: the
tweet is declared with the quest, is on Twotter from the start, keeps its picture,
and the game removes it with the quest. On — the runtime calls
`sdk.Twotter.postTweet` at the moment the flow arrives (once per playthrough,
deduped), resolving the author with `getUserByUsername` and falling back to the
stored account id. It only goes live when the node actually has an incoming flow
wire *and* the host SDK exposes `postTweet`; otherwise it silently stays
declarative. Three export warnings and an inspector note spell out the trade-off,
because rounds 21–22 found in-game that the live API has **no picture field**,
ignores the authored post time, and leaves posts behind when the mod is removed.
So Zeis's example — login → mail (out 0) → tweet 6 s later (out 1) → call a second
after (out 2) — now works end to end: mail, phone, notify and data effects already
fire at flow time, and the tweet joins them when the toggle is on.

**6. Custom workshop tags were already exported** — the Mod tab writes whatever
strings the author invented straight into `manifest.json`'s `tags`, with the key
omitted entirely when the list is empty. That was never broken; it now has tests
proving it, so it cannot quietly break later.

**Verification:** 371 tests (17 files, +13), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-02.r25"`.

## Round 26 — motion the editor owns, and wires that behave

**1. The dots move, and now nothing outside the editor can stop them.** Round 24
used a CSS keyframe, round 25 used SVG SMIL; both were reported static. The
common thread is that both can be switched off by something we do not control —
stylesheet order for the first, and the operating system's “reduce animation”
setting (on by default on some Windows machines) for both. The motion is now the
editor's own: one `requestAnimationFrame` loop (`src/editor/canvas/wireMotion.ts`)
writes a single custom property, `--qe-dash-offset`, and every wire's dot layer
reads it. One loop for the whole canvas, no React re-renders, no OS veto — plus a
**Wires moving / Wires still** button on the canvas, remembered between sessions,
for when the drift is distracting.

**2. Reroute ring 22 px → 26 px**, inside the same 36 px grab box.

**3. Group frames are dragged by their title bar.** React Flow's `dragHandle`
points at the title bar (`.qe-group-grip`, `cursor: grab`); the rest of the frame
no longer picks the group up, so a reroute nodule sitting inside one can be
grabbed without pixel-hunting. Resizing and selecting are unchanged.

**4. Two wiring gestures, decided in `src/editor/canvas/wiring.ts`.** Dragging an
existing wire's end off and dropping it on nothing deletes the wire
(`onReconnectStart/onReconnect/onReconnectEnd`). Dropping a *new* wire on a
node's body — anywhere on the card, not only on the socket — connects it to that
node's one input of the matching kind; if the node has several inputs of that
kind there is no obvious answer, so nothing happens. The node under the pointer
comes from React Flow when it knows it, and from a document hit test when the
connection line is in the way.

**5. Kisscord and WeeChat can be timed to the story**, exactly like tweets: a
per-node toggle **“Play when the story reaches this node”** (Kisscord/WeeChat
only). Off, the script is registered with the quest as before. On — and only when
something is wired into the node and the game exposes the API — the runtime plays
it message by message through `Kisscord.sendMessage(channelUserId, content,
isMine)` / `WeeChat.sendMessage({host, username, message})`, honouring each
message's own delay, once per playthrough. Player replies, uploads and “unlocks
after” gates only exist in the declarative script, so the inspector and the export
warnings say so.

**6. The wire legend explains itself.** Hovering “Then / When / Unlocks / Data”
now says what each colour of wire actually does, in one sentence.

**Verification:** 390 tests (18 files, +19), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-02.r26"`.

## Round 27 — the wire gestures, properly

**Pulling a wire out of an input now works the way it reads.** Round 26 relied on
React Flow's edge *reconnect*, which only triggers if you grab the wire itself
within a few pixels of its end — grab the socket and you simply start a new wire,
which is exactly what happened. Now `onConnectStart` does the work: begin a drag
on an input that has exactly one wire and that wire comes with you (it leaves the
graph immediately, because you are holding it). Drop it on a socket and it plugs
in there; drop it on a node's body and it takes that node's one matching output;
drop it on empty canvas and it is gone. Drop it back on the node it came from and
it is put back, because nothing was meant by that. Inputs with several wires are
left alone — there is no single wire to pick up. Edge reconnect still works too,
with `reconnectRadius` raised to 26 px and a 26 px interaction band on every wire,
so grabbing a wire mid-air is no longer needle-threading.

**A frame's body no longer offers a grab it will not honour.** The frame node
carries `qe-frame-node`, whose cursor is the plain canvas one; only the title bar
shows `grab`.

**Reroute nodule: 22 px dot, 42 px hitbox** (the white 50 % outline follows the
hitbox, so what you see is what you can grab).

**Verification:** 394 tests (18 files, +4), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-02.r27"`.

## Round 28 — a carried wire keeps the end it came from

Round 27 unplugged the right wire but held it by the wrong end: React Flow
anchors a drag at the socket it started on, so pulling 1 → 2 out of node 2 left
the loose wire hanging off **node 2**, and dropping it on node 3 wired 2 → 3.

The rule is now explicit and lives in one pure function,
`decideHeldDrop(held, dropNodeId, explicitHandle, nodes)`
(`src/editor/canvas/wiring.ts`): the end still in the graph is the one the wire
came *from*. Pull 1 → 2 out of node 2 and drop it on node 3 → **1 → 3**. Drop it
on a socket and that exact socket is used; on a node's body and its one matching
input is; on empty canvas (or Escape) and the wire is gone; back on the node it
came from and it is quietly restored. If the node it lands on cannot take the
wire, it is handed back with a one-line toast rather than vanishing. Both
`onConnect` (dropped on a real socket) and `onConnectEnd` (everything else) route
through that one decision, so the two paths cannot drift apart.

The rubber band now matches: a custom `connectionLineComponent` draws the carried
wire from the socket that feeds it, in that wire's own colour, instead of from the
input it was just pulled out of.

**Verification:** 400 tests (18 files, +6), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-02.r28"`.

## Round 29 — the Twotter search crash, and the quest that never started

Evidence: the QA-filedump branch (crash log, save, mod zip, exported project) for
`twotter-qatest-5`, run against r28.

**Two separate faults in one run.**

**1. `Cannot read properties of undefined (reading 'toLowerCase')` — Twotter
search.** A `TwotterUser` in the save has more fields than a
`TwotterAccountDefinition` can carry: `name`, `surname`, `banner`, `joinedAt`,
`password`. Whatever the engine leaves unset stays *undefined in the save file*,
and Twotter's search lowercases those strings for every record it tests. That is
why searching “test” worked (it matched the username and the filter
short-circuited) and “boop” crashed a moment later — and why the crash outlived
the mod: the broken record is in the save, and no cleanup pass reaches it. The
same file already carried the note “an empty avatar string crashes Twotter
search”, which is the same fault, one field over.

Fix, in two layers. The account definition no longer has holes: `bio`,
`followers`, `following` and `verified` are always written, never omitted. And
the emitted mod now runs a repair pass — `__qeRepairTwotter` — which looks each
of its accounts up with `getUserByUsername` / `getUserById` and fills anything
that is not a string (`name`/`surname` split from the display name, `joinedAt`
stamped, the rest blank). It runs from `OnModPackageLoaded` as well as from
`OnStart`/`OnObjectivesStart`, so **installing the mod is enough to repair a save
an earlier build broke**, even if the quest is finished or was never claimed. It
patches in place — no `createUser`, no `addUser`, no second account — and logs
what it filled (`[quest-editor] repaired Twotter account @… : filled name,
surname, …`), so the next crash report can name the field.

**2. The quest never actually started.** The log shows
`Mod "twotter-qatest-5" tried to use Network.getPlayerIp without "network"
permission` thrown out of `OnStart` — for a project that mentions no player IP
anywhere. `dataScope()` was building `player.ip`, `player.email`,
`player.username` and three `random.*` values *eagerly*, on every scope, whether
or not a token asked for them. They are lazy getters now, each wrapped in
`__QE.safe()`, so an unused value cannot touch a permission and no optional
lookup can throw a quest down. And when a token *is* used, the permission is
requested: `computePermissions` scans the project text for `{{player.ip}}`,
`{{random.ip}}` (network), `{{player.email}}` (mail) and `{{player.username}}`
(shell).

**Tests** (`compile.test.ts` → “Twotter save safety”) reproduce the crash with the
game's own filter — “test” finds the account, “boop” throws `TypeError` — then
prove the repaired record survives both, that a well-built record is left alone,
that mod load alone repairs a save, that the log names the fields, that a project
without IP tokens never calls `getPlayerIp` even when the SDK throws for it, and
that a project *with* the token still resolves it and asks for `network`.

**Verification:** 409 tests (18 files, +9), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-02.r29"`.

## Round 30 — the crashing field, named

The r29 repair pass paid for itself: the QATest6 log says exactly what is wrong.

```
[quest-editor] repaired Twotter account @qatest6: filled bio …
[quest-editor] repaired Twotter account @qatest6: filled bio …
```

Two facts in two lines. **`bio` is the only missing field** — `name`, `surname`,
`banner`, `joinedAt` and `password` were all strings, so the engine builds those
and simply does not carry a quest account's bio onto the user record (QATest6's
account had a real bio in the project, and the record still had none). And the
same repair reported the same hole **twice in one session**, which can only mean
the record `getUserByUsername` returns is a **copy**: patching it changes nothing
the game reads or saves. That is why r29 changed nothing.

So the repair now escalates. It still patches what it is handed — free if the
record is live — then reads back to check. If the hole is still there, it writes a
complete record with `Twotter.addUser` under **the same id**, built by the
engine's own `createUser` where available and seeded from whatever the existing
record already had right. It reads back once more and says in the log whether the
account is fixed or still broken. It runs at most one write per account per
session, and does nothing at all when the game stores the account properly.

This is the one case where the imperative Twotter API earns its place: the record
already exists and is already broken, and `addUser` is the only write the SDK
offers (there is no `removeUser` for Twotter, which is also why a broken account
outlives the mod).

**Tests** model the game's semantics — reads clone, `addUser` writes by id — and
pin: one write, no duplicate, `bio` filled from the account, fields that were
already right preserved, the game's own search filter surviving "boop", a loud log
naming the field and the record, no write at all for a healthy account, and no
throw on a build with no `addUser`.

**Verification:** 413 tests (18 files, +4), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-02.r30"`.

## Round 31 — Twotter removed

**Decision: the Twotter integration is withdrawn.** Not deprecated, not hidden —
removed, with a migration so no existing project is lost. It returns if a future
SDK/engine build fixes the record it stores.

### Why

Seven in-game QA rounds (QATest 1–7, files on the `QA-filedump` branch) converge
on one fault that no mod can work around:

1. A quest-declared `TwotterAccountDefinition` becomes a `TwotterUser` in the
   save whose **`bio` is `undefined`** — even when the account has a bio in the
   project. Every other field the engine fills.
2. Twotter's search calls `.toLowerCase()` on that field for every record it
   tests. A term that matches the username first short-circuits (“test” worked);
   the next term crashes the game (“boop” did, every time).
3. The record is written to the **save**, so the crash survives uninstalling the
   mod and survives the game's own cleanup pass.
4. Nothing in SDK 0.21.0 can repair it. There is no `Twotter.removeUser`. Reads
   (`getUserByUsername`/`getUserById`) hand back a **copy**, so patching the
   field in place changes nothing — proved by our own repair pass reporting the
   same hole twice in one session. Writing a complete record back with
   `addUser` under the same id left it exactly as it was:
   `bio:undefined` (QATest7 log).
5. An account with **no tweet at all** crashes search just the same, so the fault
   is the account record, not the post.

Shipping a feature whose mere presence can brick a player's save is not a
trade-off worth making for a cosmetic channel.

### What was removed

- Node type **`comms.tweet`** (“Post tweet”) — registry entry, schema, card
  summary, analysis issue, inspector fields, reference-template entry. Node types
  32 → **31**; the reference template's `nodeCount` 41 → **40**.
- **Quest → Twotter accounts** — the whole Quest-tab section, `TwotterAccountSchema`
  and `QuestDoc.twotterAccounts`.
- The `questAccount` inspector field kind (it existed only for tweets).
- Everything Twotter in the emitted runtime: `TwotterAccounts`, `Tweets`, the
  timed-post path (`postTweetNow`, `canPostLive`, `timedTweet`), and the r29–r30
  save-repair pass with its `Bootstrap.OnModPackageLoaded` hook. The mod package
  class is a plain shell again.
- Twotter avatar/picture assets from the export, the tweet export warnings and
  the README section the compiler used to write.
- The Twotter test suites. A guard remains in their place: **the emitted
  `dist/mod.js` must not contain the strings `Twotter` or `Tweets`.**

### What replaces it

Nothing — but nothing breaks either:

- **Migration** (`src/schema/migrate.ts`): a project made before round 31 loads
  with its “Post tweet” nodes and their wires dropped and `twotterAccounts`
  stripped. The rest of the quest is untouched.
- **`parseProjectFile` now migrates too** — a QA sweep found that opening a
  *file* skipped the migration step the autosaved draft always got, so an older
  export would have been rejected as “not a quest project”. That bug predated
  this round (it applied to the round-13 comms merge as well) and is fixed here,
  with tests.

### Kept from the Twotter investigation

Two fixes found while chasing the crash are unrelated to Twotter and stay:

- **Lazy token values.** `{{player.ip}}`, `{{player.email}}`, `{{player.username}}`
  and the `{{random.*}}` values are getters wrapped in `__QE.safe()`, computed only
  when a token asks for them. Eager evaluation once called `Network.getPlayerIp()`
  in a mod with no network permission and the exception escaped `OnStart`, so the
  quest never started.
- **Token-driven permissions.** `computePermissions` scans project text for
  `{{player.ip}}`/`{{random.ip}}` → `network`, `{{player.email}}` → `mail`,
  `{{player.username}}` → `shell`.

**Verification:** 387 tests (18 files), `tsc --noEmit` clean, `vite build` clean,
and the real QATest7 export re-opened through the editor: it loads, the tweet node
is gone, and the compiled `dist/mod.js` mentions Twotter only where the author
typed it in their own mod name. Export stamp: `EDITOR_BUILD = "2026-09-02.r31"`.

## Round 32 — the template audit, part one: the standard contract hack

The templates all built and all passed their tests, but they were written before
the website builder existed and before half the node types did. Coverage before
this round:

| Template | Websites | Never shown |
|---|---|---|
| Blank | 0 | everything |
| Hello Hack | 0 | sequence, reroute, group, hackertyper, input, shell, files, database |
| Simple Linear Wi-Fi Hack | 0 | the same list |
| Complex Branching Investigation | 0 | sequence, reroute, groups, hackertyper, shell, tool response, database |

**Not one template contained a website** — the builder, unlisted pages and the
whole `dirhunter` loop were invisible to anyone starting from a template.

### The new template: “Standard Contract Hack”

The job the game hands out constantly, end to end, exactly as an author would
build it:

> mail with a name → `lynx "Anselm Ritter"` → the company site → `whois` →
> the IP → `nmap -sV` → port 22, OpenSSH 7.2p2 → metasploit → delete
> `ledger_q3.xlsx` → reply to the client.

Every objective is completed by a real event, checked against
`reference/hackhub-events.json`: `Mail.Read`, `Terminal.Lynx.Search`,
`Terminal.Whois`, `Terminal.NmapScan`, `Metasploit.Meterpreter.Connected`,
`Files.Deleted`. It ships the Meridian Capital website (including its unlisted
page), so the trail leads somewhere real, and it ends on the pattern most quests
eventually need: deleting the file writes `ledger=deleted`, and the reply
**branches on that** — claim the job is done without doing it and the client
writes back “you must be joking” instead of paying.

29 nodes, 14 node kinds, one website. Played through in the test suite in both
directions: paid, and not paid.

### Three bugs the template found — all of them silent

1. **An objective's “On complete” output never fired.** The SDK ticks an
   objective off from its own declarative trigger and tells nobody, so anything
   wired after it simply never ran — including in the shipped *Investigation*
   template, which has used that wire since round 12. The runtime now listens to
   the same event with the same conditions and follows the wire once.
2. **A device's domain was emitted as `domainName`.** The engine takes
   `domain: { name, vulnerabilities? }`. A bare string is ignored, so a
   mod-registered domain never resolved — `whois`/`nslookup` would have
   dead-ended the trail at step two. Vulnerabilities move inside the domain,
   where the SDK actually keeps them.
3. **There was no way to put a file on a remote machine.** `mapDevice` dropped a
   user's `files` (and `acceptReverseTCP`, `online`, `email`), and a “Seed files”
   node compiled to nothing at all. Now: user files mount in that user's home,
   root files mount at `/`, editor ids are stripped and `locked` becomes the
   engine's `readonly`; a “Seed files” node aimed at **the player's own PC**
   compiles to `Files.createTree`, and one aimed at a device says so plainly in
   the export notes instead of pretending.

Device mapping also stopped dropping `name`, `lanIp` and `isIpHidden`.

**Verification:** 409 tests (19 files, +22), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-02.r32"`.

## Round 33 — the template audit, part two: the dirhunter loop

**“The Help Desk Leak”** (Intermediate, 21 nodes, 1 website) — the other job the
game is built around: a site that says no, and a page it forgot to list.

> brief → the public site → the employee portal refuses you → `dirhunter naza.gov`
> finds `/it/helpdesk` → that page prints the temp-password rule → the public
> directory gives the employee ID → `ssh t.reyes@10.10.4.7` → download the abort
> report → paid.

The point of the template is **where the clue lives**: not in quest text, but in
the website. The NAZA site template already had all three pieces and nothing
used them — an unlisted help-desk page explaining that temporary passwords are
“first initial + last name + last 4 of the employee ID”, a public directory
listing Tomás Reyes as NZA-3419, and a portal that denies everyone. The quest
just puts an SSH account behind `t.reyes` / `treyes3419` and lets the player
assemble it. A test pins the page, its `seo: false` and the matching credential
together, so editing one without the other fails the suite.

It also carries the closing scene as a **Sequence**: confirmation toast → 3.5s →
a **timed Kisscord conversation** (`postLive`) → 2s → payment, which is the first
shipped content to use either feature. Both directions are played through in the
tests, including a download of the wrong file paying nothing.

Two smaller fixes this round:

- `makeEdge` in the template builder resolved sockets from the **static**
  registry, so a Sequence node's per-step outputs (`step-<id>`) could not be
  wired by a template at all. It — and the templates' "only wires compatible
  handles" test — now use `sourcesOf()`, the same resolution the canvas uses.
- Port version hint, from QA: **plain numbers**. A letter in a version string
  (`7.2p2`) has been seen in-game to stop metasploit matching an exploit to the
  port, so both new templates use `7.2` / `8.4` and the field says why.

Also recorded from QA: **log cleaning needs no node.** The game logs connections
on the machine itself, the player wipes that log from its own UI, and skipping it
costs suspicion — all engine-side.

**Verification:** 424 tests (19 files, +15), `tsc --noEmit` clean, `vite build`
clean. Every template is now issue-free on the canvas except the reference sheet,
which is a catalogue by design. Export stamp: `EDITOR_BUILD = "2026-09-02.r33"`.

## Round 34 — templates that can actually start, and four nodes that finally do something

Two QA findings from playing the Ledger template in-game, and the sweep they led to.

### 1. No template could ever start

`autoStart` defaults to off and **no template had ever set it** — six templates
that build a whole world in-game and then sit there, unclaimable. The export
even warned about it, in wording so gentle it read like a preference.

- Every playable template now sets `autoStart: true` (Blank, Hello Hack, Wi-Fi,
  Investigation, Contract Hack, Help Desk Leak). Only the Node Reference stays
  off — it is a catalogue, not a quest.
- The warning now distinguishes the two cases. With a Hackhub feed post it is a
  heads-up (“the player claims this one from its feed post”). With neither, it
  says what is actually true: **“nothing can start this quest… the player has no
  way to claim it.”**
- Two template tests make it impossible to ship this again: every template
  except the reference must be claimable, and no template may export with an
  unplayable warning.

### 2. “Unlisted page” told the author a fact, not what to do with it

Rewritten to explain the mechanic: nothing links to it, in-game search will not
show it, the player reaches it by typing the address **or by running dirhunter
on the host** — which is what makes it a good hiding place for a clue — and if
that was not the intent, turn on “Listed in search”.

### 3. Four world nodes exported as nothing at all

The sweep for other “exports as notes only” cases found that **Register domain,
Add firewall rule, Change port and Create database compiled to no code**, while
the SDK has a real call for each. An author's firewall rule simply did not exist
in the game.

| Node | Now emits | Cleanup |
|---|---|---|
| Register domain | `Network.registerDomain(domain, ip, vulns)` | `removeDomain` |
| Add firewall rule | `Network.addFirewallRule(ip, rule)` | `removeFirewallRule(ip, port)` |
| Change port | `openPort` / `closePort` / `addPort` / `removePort` | optional “put it back” |
| Create database | `Database.create({ host, user, password, tables })` | `Database.remove(id)` |

Cleanup is collected as the flow runs — a node the story never reached added
nothing, so nothing is removed for it — and drained in `OnComplete`/`OnAbandon`,
each call guarded so a half-torn-down world cannot block the rest. Ports restore
to their opposite (an opened port closes, an added port is removed) only when the
author asks for it.

The remaining honest warnings: Wi-Fi creation (no SDK), handbook nodes (not
compiled), remote-device “Seed files” (belongs in the device tree), and a port or
firewall node with no device IP, which now says so instead of being silent.

### A note on sources

Added to the docs' standing rules, prompted by a community wiki that turned out
to be generic infosec text with the game's name on it: **the SDK declarations are
ground truth, in-game testing is second, everything else is unverified until one
of those two confirms it.** That page described `traceroute`, `scp`, `systemctl`
and `apt install nmap` while never mentioning `dirhunter`, `fern` or `bettercap`.
Its Metasploit *loop* (search → use → set options → exploit → session) does match
the SDK's event set, so that much is usable — nothing else from it was taken.

**Verification:** 445 tests (19 files, +21), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-02.r34"`.

## Round 35 — the quest that started and then did nothing

QA screenshot: the Ledger contract auto-started, “Read the contract” appeared in
the journal, and that was it. No briefing mail, no contract on hackhub.com.

### The cause

`Shell.addCommandData` takes **three** arguments — `(command, input, data)`.
The runtime passed two: the response text as the *input*, and nothing as the
data. The engine threw, and because the two Tool response nodes sit between the
network and the briefing mail in that template's flow, **the exception killed
the chain before the mail was ever sent**. The quest existed, its objectives
existed, and nothing else did.

Three more calls were wrong in the same way, found by auditing every `sdk.*`
call in the runtime against the declarations:

| Call | Was | Is |
|---|---|---|
| `Shell.addCommandData` | `(command, dataText)` | `(command, input, data)` — plus `removeCommandData` on quest end, which `removeOnComplete` had never actually done |
| `Shell.execute(cmd)` | does not exist — “Run shell command” silently did nothing | `Shell.exec(cmd)`, awaited |
| `Quest.claim(d.quest)` | field is `questName`; passed `undefined` | `Quest.claim(d.questName)`, guarded |
| `UI.toast(msg)` | tone dropped, every toast looked the same | `UI.toast(msg, tone)` |

### Tool responses now speak the engine's shapes

`addCommandData` wants the structure the tool returns, not printable text — the
node's own field promised the opposite (“the player sees it word for word”).
Authors keep writing readable lines; the compiler converts:

- `whois` → `{ domain, ip, contact, email, status }`
- `lynx` → `{ socialMedia, ips, address, contact: { emails, phones }, additional }`
- `geoip` → `{ country, city, latitude, longitude }`, `hydra` → `{ credentials }`,
  `ping` → boolean, `nslookup`/`mxlookup` → string
- `nmap` → `NmapPort[]` parsed from `22 open ssh OpenSSH 8.9` lines
- anything starting `{` or `[` is parsed as JSON and passed through untouched

`hydra`, `ssh` and `ftp` are keyed by an object (`{ user, target }` etc.), so the
node's User/Target fields finally do something.

### And the structural fix: one node can no longer end the story

This is the part worth keeping. `runFlow` now runs each node inside a try/catch
and rejections are caught at the wire: a node that throws is **logged by name and
skipped**, and the flow continues to the next one.

```
[quest-editor] node CtUi7l6 (world.toolResponse) failed and was skipped: …
```

A single bad call used to take out everything downstream of it — the exact
failure in the screenshot. Now the briefing mail still goes out, and the log says
what broke.

**Verification:** 455 tests (19 files, +10), `tsc --noEmit` clean, `vite build`
clean. The Ledger template, run against a stub engine, now reaches
`net:45.33.32.156 → mail:0` with both tool responses registered as
`("lynx", "Anselm Ritter", {…})` and `("whois", "meridian-capital.net", {…})`.
Export stamp: `EDITOR_BUILD = "2026-09-02.r35"`.

## Round 36 — the mail the engine accepted and never delivered

QA ran the r35 Ledger export with the briefing mail moved to the **front** of the
chain. Same result: the quest claims, the objective appears, no mail.

### What the evidence says

Running the author's own exported `dist/mod.js` against a stub engine:

```
sendMail:0:i.faber@ghostmail.io
net:45.33.32.156
cmd:lynx:"Anselm Ritter"
cmd:whois:"meridian-capital.net"
```

Everything fires, in the right order, with the right arguments. **The mod asks
for the mail correctly and the game does not deliver it.** So the flow is not the
problem any more (r35 fixed that) — the delivery is.

Two defences, because the cause is on the far side of a call we cannot debug:

**1. Bind the live quest instance in every hook.** The runtime kept a `questRef`
captured in the constructor. If the engine builds the quest class more than once
— a metadata pass and then the live quest, in either order — that reference can
point at an instance the engine is not using, whose `sendMail` is wired to
nothing. `OnStart`, `OnObjectivesStart`, `OnComplete` and `OnAbandon` now each set
`questRef = this` before doing anything.

**2. Send, verify, repair.** After `sendMail`, the runtime waits, then looks in
`Mail.getInbox()` for the subject. If it is there, it says so. If it is not, it
delivers the same mail through `Mail.send({ subject, content, from, to })` — the
global "send an email to the player's inbox" API — and logs that it had to:

```
[quest-editor] quest mail "One file, one man, no trace" never reached the inbox;
              sent it directly with Mail.send instead
```

Either way the player gets the mail, and the next log says which path worked —
which also answers whether quest mail is broken in this build or only in this
mod. Run against the author's exact project, the fallback fires and the mail is
delivered.

Also: `replyable` was being dropped from every quest mail, so “the player can
reply to this” never reached the engine. Carried through now.

### The hackertyper node was broken, and QA was right to suspect it

Its page HTML called `sdk.Events.emit(...)`. The SDK documents the in-frame global
as **`HackhubSDK`** — pages run in a sandboxed iframe where `sdk` does not exist —
so the reveal event never fired and **nothing wired after a hackertyper node
could ever run**. Fixed, with a `sdk` fallback and a `postMessage` last resort.

Two more faults in the same node, both about the player never finding the thing:

- the page lived at `/qe/ht/<generated-node-id>` — an address nobody could type
  — and was marked `seo: false`, so in-game search would not show it either.
  It is now `/terminal/<heading-in-dashes>` and listed.
- nothing told the author any of this. The node now carries a note explaining
  where the page will be and that the quest has to send the player there; the
  Ledger template's brief now names the address in the mail.

**Verification:** 459 tests (19 files, +4), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-02.r36"`.

## Round 37 — the mail bug, found by reading a mod that works

Three rounds were spent on quest mail that never arrived. Round 35 fixed real
SDK signature bugs around it, round 36 added a verify-and-repair fallback, and
QA still reported the same thing: the quest auto-starts, the objective appears
in the HUD, GoMail stays empty.

This round had two pieces of evidence the earlier ones did not.

### The game log said nothing at all

The author's `hackhub-2026-09-03.log` contains **zero** `[quest-editor]` lines
across four game sessions — while other mods log their load banners normally.
So it was not that mail was sent and dropped. On the machine that reported the
bug, none of our logging ran, which also means the round 36 fallback — which
only runs *after* a `Random.sleep(1500)` — never got the chance to fire. Two
consequences:

- the verify-and-repair step no longer waits on the game's clock. It uses a
  plain timer, so a paused or stubbed `Random.sleep` cannot swallow it.
- every send now logs immediately, before any waiting, saying which path
  carried the mail. A report can now distinguish "never ran" from "ran and the
  engine ate it".

### A working mod never uses the API we were using

The author supplied `mod.js` from **Nemesis**, a quest mod by another author
whose mails do arrive. Read next to ours, the difference is not subtle: Nemesis
declares no `Mails` array and never calls `this.sendMail`. Its opening briefing,
and every later mail, goes out through the global

```js
Mail.send({ from, subject, content })
```

That is the path the engine demonstrably delivers. `Quest.Mails` +
`this.sendMail(index)` is documented in the SDK's type declarations, we were
using it correctly, and it does not put mail in the player's inbox in build
1.1.2.

So the order is now inverted. `Mail.send` is the primary path, addressed from
the mail node's sender to `Mail.getPlayerEmail()`; `this.sendMail` is kept only
as a fallback for a build that has no global mail API, so nothing regresses.
`Quest.Mails` is still declared and still kept in step with what was actually
sent — it costs nothing and the engine may yet surface it.

Run against the author's own exported Ledger project, the generated mod now
logs:

```
[quest-editor] mail "One file, one man, no trace" sent via Mail.send
[quest-editor] mail "One file, one man, no trace" delivered
```

and `Quest.sendMail` is never called.

**Verification:** 460 tests (19 files), `tsc --noEmit` clean. The mail suite was
rewritten around the new contract: Mail.send first with the right `from`/`to`,
fallback when the global API is absent, and a distinct log line for a mail the
engine accepted but did not deliver. Export stamp:
`EDITOR_BUILD = "2026-09-03.r37"`.

## Round 38 — the mod was never loading

Round 37 changed how mail is sent, on good evidence, and the mail still did not
arrive. The evidence for what was actually wrong was in the same log, and it was
an absence rather than a line.

Across five game sessions, `hackhub-2026-09-03.log` names the load banner of
every other installed mod — Markdown Note Editor, Nemesis Protocol, GhostLink,
Lockchain Wallet, vault-manager, nine more — and never once mentions ours. Not
an error, not a rejection, nothing. The quest appearing in the objective HUD had
been read as proof the mod was running; it is not. That entry comes from saved
quest state, and it kept appearing after a mod that had stopped loading.

So r35, r36 and r37 were all fixing the mail path of a mod that was not
executing. The mail code was never reached. Comparing our output with Nemesis
line by line, one structural difference explains it.

### The Bootstrap class has to come back out of the module

Nemesis, like every hand-written mod, is built by esbuild from
`export default class extends Bootstrap`, and its bundle ends:

```js
module.exports = __toCommonJS({ default: () => NemesisProtocolStage1 });
```

Ours called `sdk.RegisterModPackage(Mod)` and exported nothing. The SDK's own
build script (`build.mjs`, shipped in the package) bundles every mod as CJS from
`src/index.ts` with exactly that default-export shape, and the loader looks for
the package class there. A mod that only calls `RegisterModPackage` is skipped
without a word.

Generated mods now end with:

```js
var __QE_MOD = __qeRegisterProject(sdk, PROJECT);
module.exports = { __esModule: true, default: __QE_MOD };
```

`RegisterModPackage` is still called, so both discovery routes are satisfied.

### A mod that says nothing cannot be debugged

The second change is smaller and would have saved three rounds. Every other mod
prints a load banner; ours printed nothing, so "the mail is broken" and "the mod
never ran" looked identical from a log. The generated `Bootstrap` now implements
`OnModPackageLoaded` and logs its name, version and editor build:

```
[quest-editor] The Ledger Contract v1.0.4 loaded (editor build 2026-09-03.r38).
```

If that line is missing from a report, the mod did not load and nothing about
the story is worth investigating yet.

**Verification:** 462 tests (19 files, +2), `tsc --noEmit` clean, `vite build`
clean. The two new tests are the ones whose absence let this through: the
compiled bundle must expose the registered Bootstrap class on
`module.exports.default`, and it must announce itself on load. The author's own
1.0.4 project, recompiled and loaded through a CJS loader the way the game does
it, now reports the banner, then `mail "One file, one man, no trace" sent via
Mail.send`, then `delivered`. Export stamp: `EDITOR_BUILD = "2026-09-03.r38"`.

## Round 39 — the mail arrives, and now it has to read right

With r38's loader fix in, the briefing mail landed in GoMail on the first try.
Two faults were visible in the same screenshot.

### The body showed its markup

The mail read, on screen:

```
<p>His name is <b>Anselm Ritter</b>. That is all you get...
```

GoMail prints a mail body verbatim. The editor's Body field, meanwhile, carried
the hint *"HTML tags are rendered as written, so `<b>` and `<p>` work"*, and the
inspector preview rendered that HTML — so the editor showed formatted prose and
the game showed tags. Nemesis, whose mail reads correctly, sends plain text with
blank lines between paragraphs.

The compiler now converts a mail body to text before it goes out: block tags
become blank lines, `<br>` a newline, list items a bullet, entities are
unescaped, and runs of blank lines collapse. Existing projects full of HTML keep
working and simply read correctly.

Two supporting changes, because the mismatch is what let this ship:

- the inspector preview no longer renders HTML. It shows the converted text —
  exactly the string the compiler will send — via a shared `mailBodyText`,
  and a test asserts the preview and the generated mod agree on a set of
  samples, so they cannot drift.
- the Body hint no longer invites HTML. It says the game shows plain text, that
  blank lines separate paragraphs, and that pasted HTML is converted for you.

One bug the new tests caught immediately: the conversion ran twice (once when
`Mails` was built, once on send), which ate a literal `<tag>` an author had
actually written. It now runs once.

### Reading the mail did not tick the objective off

"Read the contract" stayed unticked. The objective carried a
`QuestObjectiveDefinition.trigger` — the SDK's declarative form — and this build
does not appear to act on it. That is the same shape of fault as the mail bug:
an API the declarations describe and the engine ignores.

The SDK's own `Quest` example does it imperatively:

```js
this.Events.on("Terminal.NmapScan", (data) => {
    if (data.ip === this.Data.targetIp) this.completeObjective("scan");
});
```

So `OnObjectivesStart` now listens to the trigger's event, checks the author's
conditions, calls `completeObjective`, and then follows the "On complete" wire —
one listener doing both, so the tick and the story beat after it can no longer
disagree. It fires once however often the event repeats, and logs
`objective "read-brief" completed by Mail.Read`.

The declarative `trigger` is still declared as well. If a build honours it, the
objective ticks off that way; completing an already-completed objective is a
no-op, so the redundancy is free.

**Verification:** 472 tests (19 files, +10), `tsc --noEmit` clean, `vite build`
clean. The author's own project, recompiled and driven through a CJS loader the
way the game loads it, now prints the load banner, sends the briefing as clean
prose, and completes `read-brief` when `Mail.Read` fires. Export stamp:
`EDITOR_BUILD = "2026-09-03.r39"`.

## Round 40 — a full audit against a mod that works

Rounds 35–39 all had the same shape: the SDK declared something, we used it
correctly, and this build ignored it. Rather than wait for the next one to
surface in play, every SDK surface the compiler touches was checked three ways:
against the type declarations, against **Nemesis** (a large mod known to work in
build 1.1.2), and by running the output.

### What was already right

- **Every namespace call.** All 38 `sdk.X.y()` calls the runtime makes exist in
  the declarations, bar two deliberate guarded fallbacks
  (`Network.createWifiNetwork`, `Shell.execute`), both behind `if` checks.
- **The event catalogue.** `reference/hackhub-events.json` is generated from the
  SDK's `ModEventMap`: 92 events, no drift in either direction, no payload
  field mismatches. This is why the editor's condition builder has never offered
  an event that does not exist.
- **Quest, Command and CommandTools members**, and the shapes passed to
  `Database.create`, `Bank.transaction`, `Kisscord.sendMessage`,
  `WeeChat.sendMessage`, `Files.createTree` and `Network.createUser`.

### Four faults found

**1. Devices carried fields their union arm does not have.** The SDK's device
definition is a discriminated union: `children` belongs to Router and Splitter,
`rules` to Firewall, `model`/`accessable` to Router. We attached all of them to
every device, so a plain DEVICE shipped with empty `children` and `rules`
arrays, and routers shipped rules they cannot enforce. Nemesis — which builds
far larger networks — never does this. Generated devices now match its output
key for key:

```
ROUTER keys=[accessable,children,domain,ip,model,name,ports,type,users]
  DEVICE keys=[ip,name,ports,type,users]
```

Because a device retyped after it was filled in can still be carrying fields it
will now lose, export warns rather than dropping them silently.

**2. Two templates triggered on an event that does not exist.**
`Files.Downloaded` is not in the engine's event map; both the investigation and
reference templates used it to detect a file being pulled off a box, so those
objectives could never complete. The real event is
`Terminal.SSH.FileDownload` (payload `id, name, extension`). A trigger naming a
nonexistent event fails exactly like a trigger whose conditions have not matched
yet, which is why it survived this long — so there is now a test that validates
every shipped template trigger against the catalogue, name and field.

**3. Websites never set `Icon`,** which the SDK declares abstract. Every website
in Nemesis sets it, including to `""`. An absent abstract member is precisely
the shape of fault that cost rounds 35–38.

**4. Template mail bodies were written in HTML.** The Ledger brief that shipped
reading `<p>His name is <b>Anselm Ritter</b>` was our own template text. r39's
converter fixes it either way, but a template should not ship markup that has to
be stripped back out; all six template mails are now plain text with blank-line
paragraphs. Website page bodies remain HTML, as they should be.

### Verified end to end

The contract-hack template, compiled and driven through a CJS loader the way the
game loads it, now reports:

```
The Ledger Contract loaded (editor build 2026-09-03.r40)
mail "One file, one man, no trace" delivered
objective "read-brief"      completed by Mail.Read
objective "identify-target" completed by Terminal.Lynx.Search
objective "find-server"     completed by Terminal.Whois
objective "scan-server"     completed by Terminal.NmapScan
objective "get-a-shell"     completed by Metasploit.Meterpreter.Connected
objective "delete-ledger"   completed by Files.Deleted
```

**Verification:** 483 tests (19 files, +11), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-03.r40"`.

## Round 41 — the mod had no manifest, so it had no permissions

Rounds 35–40 chased a quest that would not progress: mail delivered, but the
network never appeared and no objective ever ticked. The game log for a fresh
r40 export finally named it:

```
[quest-editor] The Ledger Contract4 v4.0.0 loaded (editor build 2026-09-03.r40).
[quest-editor] node world-network4 failed and was skipped: [ContentSDK] Mod "null"
  tried to use Network.createSubnetNetwork without "network" permission.
[quest-editor] node world-toolResponse5 failed and was skipped: ... "shell" ...
[quest-editor] Mail.send failed ... : ... "mail" ...
[quest-editor] mail "One file, one man, no trace" sent via Quest.sendMail(0)
```

Three permissions refused — all three of which `manifest.json` declared. The
giveaway is **`Mod "null"`**: the mod had no name at permission-check time, so
the loader had not found a manifest for it at all.

The SDK's own build script says why. `prepareDist()` in
`@hotbunny/hackhub-content-sdk/build.mjs` copies `manifest.json` into `dist/`
before bundling, so the manifest ends up *next to* the bundle. Nemesis ships
`manifest.json` and `mod.js` side by side. We wrote the manifest only at the
project root, so the game loaded `dist/mod.js` with no manifest attached: no
name, no permissions, every `Network`/`Shell`/`Mail` call refused.

The export now writes both copies from one string, so they cannot drift.
`dependencies: []` was added too — `ModManifest` lists it and the reference mod
ships it.

### Why five rounds of testing missed it

Two reasons, both worth keeping in mind.

- **The r37 fallback masked the symptom.** When `Mail.send` was refused, the
  compiler fell back to `Quest.sendMail`, and the briefing arrived. The one part
  of the quest anybody could see working was the part being rescued by a
  fallback.
- **No harness modelled permissions.** The vitest stub and the CJS loader script
  granted everything implicitly, so the mod always had rights the real game was
  refusing. A stub that cannot say "no" cannot catch a bug about being told no.

There is now a permission-enforcing harness: it reads the emitted
`dist/manifest.json`, grants exactly those permissions, and throws the same
`[ContentSDK] Mod "…" tried to use X without "y" permission` error the game
raises. Blanking the permissions in it reproduces the original log exactly.

Compile-time tests assert the manifest sits beside the bundle, that both copies
are byte-identical, that every permission the emitted code needs is granted
(matched against the code itself, not a hand-written list), that the names are
valid members of `ModPermission`, and that the manifest carries every field the
working reference mod carries.

### One more diagnostic

Objective listeners now log at **registration**, not only on completion:

```
[quest-editor] objective "read-brief" is listening for Mail.Read
```

Round 40 was spent unable to tell "the listener was never attached" from "it was
attached and the event never came". That question is now answered by the log.

**Verification:** 488 tests (19 files, +5), `tsc --noEmit` clean, `vite build`
clean. Driven through the permission-enforcing harness, the contract-hack export
builds its network, sends its mail via `Mail.send` (no fallback), and completes
`read-brief` on `Mail.Read`. Export stamp: `EDITOR_BUILD = "2026-09-03.r41"`.

The SDK is now a pinned devDependency (`0.21.0`, exact) rather than an ad-hoc
install, so the ground-truth declarations survive a clean checkout.

## Round 42 — why an idle editor spun up a 4090

The author reported that leaving the editor open made his graphics card audible
within a minute or two, with lag that grew the longer he worked and stopped the
instant he switched tabs. He captured a Firefox performance profile while idle,
with the Ledger template open and nothing being touched.

The profile named it immediately. In 16.3 seconds of doing nothing, the editor's
tab spent **40.8% of its time** in `PresShell::DoFlushPendingNotifications` —
style recalculation and display-list rebuilding — and the only JavaScript
anywhere on the stack was two functions: `tick` and `paintDashOffset`, both from
`wireMotion.ts`.

### The cause

Round 38 had made the travelling dots on the wires reliable by driving them from
JavaScript: one `requestAnimationFrame` loop writing `--qe-dash-offset` onto
`document.documentElement`, with every wire's dot layer reading it. That fixed
the dots, which had genuinely not moved as CSS keyframes or SMIL.

Setting a custom property on the **root element** invalidates every element that
could inherit it — the whole document. So sixty times a second, the entire
editor was restyled and its display list rebuilt, whether or not anything had
changed.

The JS cost nothing: 85 samples out of 8638. The invalidation cascade it
triggered was the whole bill: 3,224 samples in layout flush, 1,236 in display
list rebuilds. Two details in the report follow from this directly — it got
worse as graphs grew (more wires, more to repaint), and it stopped dead on tab
switch (browsers throttle `requestAnimationFrame` in background tabs). That
second detail is also why this was never a memory leak; a leak does not stop
politely when you look away.

### The fix

The dots are now animated by the browser's own animation engine via
`Element.animate()`, on the canvas wrapper element rather than the document
root. Two things change:

- **The invalidation is scoped.** The property is written to the element that
  contains the wires, so nothing outside the canvas is restyled.
- **There is no per-frame JavaScript.** The animation engine interpolates the
  value itself and can run it off the main thread; an idle editor now does no
  work at all for the wires.

`requestAnimationFrame` survives only as a fallback for engines without
`Element.animate`, and even there it writes to the scoped element and is
throttled to 15fps — the dots drift at 10px/s, so at 15fps each frame moves them
less than a pixel and anything faster is invisible effort.

The on/off toggle is unchanged and still works, and turning wire motion off
remains a complete stop: no animation, no loop, nothing scheduled.

### What keeps it fixed

The old tests asserted the offset landed on `document.documentElement` — they
encoded the bug. They now assert the opposite, plus the properties that matter:

- the dash offset is **never** written to the document root;
- the animation is handed to the browser (`iterations: Infinity`, `linear`, one
  period), and **no** `requestAnimationFrame` loop is started when it is;
- where the fallback is used, two frames 1ms apart do **not** both repaint, and
  one a full throttle-period later does;
- switching motion off leaves nothing running, and neither does unmounting the
  canvas.

**Verification:** 492 tests (19 files, +4), `tsc --noEmit` clean, `vite build`
clean.

A note for the wire-physics work that follows: it has to obey the same rule.
Anything that animates per frame must write to an element inside the canvas, and
ideally hand the interpolation to the browser. Building spring physics on top of
a root-level invalidation loop would have been considerably worse than what was
just removed.

## Round 43 — `Mod "null"`, and the dots that stopped again

Two faults, one of them a regression I introduced in r42.

### The mod could not say who it was

r41 shipped `manifest.json` beside the bundle, matching the SDK's own build
script. It changed nothing: the game still logged, for network, shell and mail,

```
Mod "null" tried to use Network.createSubnetNetwork without "network"
permission. Add "network" to the permissions array in your manifest.json.
```

...with a manifest that declared all three. The manifest was never the problem.
`Mod "null"` was the whole message: the loader had no identity bound at the
moment our code called `RegisterQuest`.

The difference is the shape and order of the CommonJS export. esbuild — which
every hand-written mod is built with — installs `module.exports` as a **lazy
getter at the very top of the bundle**, thousands of lines before anything is
registered:

```js
module.exports = __toCommonJS({ default: () => NemesisProtocolStage1 });
// ... 3500 lines ...
NemesisProtocolStage1 = __decorateClass([RegisterModPackage], NemesisProtocolStage1);
```

The loader reads `module.exports.default` to learn which mod it is loading, and
does so before the registrations take effect. We assigned a plain object at the
**end**, after every `RegisterQuest`/`RegisterWebsite`/`RegisterCommand` call had
already run. At registration time the loader had nothing bound, every call was
attributed to `Mod "null"`, and the permission check had no manifest to consult.

The bundle now declares `__QE_MOD`, installs `module.exports` with a getter for
`default`, and only then runs the registration — the same order esbuild
produces. Tests pin all three properties: the export is installed before the
registration statement, `default` is a getter, and nothing calls `sdk.Register*`
at the top level where its timing would be unclear.

### The dots stopped moving

r42 handed the wire animation to the browser to stop a document-wide repaint.
Correct fix, incomplete: **a custom property must be registered before the
browser will interpolate it.** Unregistered, `--qe-dash-offset` has no type, so
the animation engine can only flip it from one value to the other at the end of
each cycle. The dots hold still and jump — indistinguishable from not animating.

`index.css` now registers it:

```css
@property --qe-dash-offset {
    syntax: "<length>";
    inherits: true;
    initial-value: 0px;
}
```

`<length>` is what turns `0px → -14px` into a drift rather than a jump, and
`inherits: true` is required because the wires read the value from an ancestor.
The registration has to live in the stylesheet, so a test reads `index.css` and
asserts the rule, its syntax, its inheritance and its initial value. This is the
third time this animation has been reported broken and the second time I broke
it; it should now fail loudly in CI rather than quietly on the author's screen.

**Verification:** 500 tests (19 files, +8), `tsc --noEmit` clean, `vite build`
clean. Driven through a loader that binds identity from `module.exports.default`
before running the quest — as the game does — the export builds its network,
sends its mail through `Mail.send` with no fallback, and completes `read-brief`.
Export stamp: `EDITOR_BUILD = "2026-09-03.r43"`.

The README's "Status" section is now a **Roadmap**: what is in progress, what is
next, known limitations that are not bugs, and what was fixed recently.

## Round 44 — the permissions are fixed; the quest never starts

### What r43 fixed

The permission errors are gone from the game log. `Mod "null"` no longer
appears, so exporting the module the way esbuild does — a lazy `default` getter
installed before anything registers — was the right diagnosis. The dots move
again too.

### What is left

The r43 log is now *quieter than it should be*:

```
The Ledger Contract6 v6.0.0 loaded (editor build 2026-09-03.r43).
objective "read-brief" is listening for Mail.Read
... all seven objectives ...
```

...and nothing else. No network, no mail, and **no errors**. Compare r41, which
at least reported failures. Those lines all come from `OnObjectivesStart`. Not
one line comes from `OnStart` — which is where the network is built and the
briefing is sent.

Run against the exact zip QA installed, `OnStart` works: it builds the network
and sends the mail. So the method is fine and the game is not calling it, or is
calling it on an instance whose work goes nowhere.

`OnStart` now logs unconditionally:

```
[quest-editor] quest "TheLedgerContract6" started (1 entry point)
[quest-editor] quest "TheLedgerContract6" objectives started
```

A quest whose `OnStart` never runs and one whose `OnStart` runs and does nothing
look identical in a log otherwise, and that ambiguity has now cost two rounds.
Nemesis is a useful contrast here: it sets `AutoStart = false` and ships a
`HackhubPost`, so the player claims it from the feed. Ours sets
`AutoStart = true`. If the next log shows the objectives line but not the
started line, auto-start is the difference and that is where to look next.

### The objective counter is not evidence

QA established that "0/1 completed" is the count of objectives in the *current*
step, not the whole quest — the same panel shows "0/2" for a built-in mission
that has many more. Two earlier rounds treated that number as a symptom. It is
not one, and no more time should be spent on it.

### 29% of an idle frame, and no JavaScript at all

A second profile, captured on r43, showed the wire animation had improved but
not enough: repaint time fell from 40.8% to 29.0%, and **zero** JS frames were
sampled — so no editor code was running, yet the browser was still recalculating
styles every frame.

The cause was in the fix. `--qe-dash-offset` had to be declared
`inherits: true`, because each wire reads it from an ancestor. Inheriting a
changing property invalidates every descendant of the element it is set on —
every node, port, label and badge on the canvas — sixty times a second.

So nothing inherits any more. Each wire's dot layer registers itself with
`wireMotion` and gets its own animation on `stroke-dashoffset` directly. The
browser restyles only the paths whose dots actually move. The `@property` rule
and the shared custom property are both gone. All wires share one phase origin,
so they still drift in step regardless of when each was added.

Writing the test for it caught a real bug: unregistering the last wire left its
final offset frozen on the element, because `stop()` only reaches wires that are
still registered.

**Verification:** 497 tests, `tsc --noEmit` clean, `vite build` clean. Export
stamp: `EDITOR_BUILD = "2026-09-03.r44"`.

## Round 45 — `Mod "null"` was a timing bug all along

### Reading the log properly

The r44 log finally had enough in it to be conclusive:

```
quest "TheLedgerContract7" started (1 entry point)
quest "TheLedgerContract7" objectives started
objective "read-brief" is listening for Mail.Read        (x7)
node world-network4 ... Mod "null" ... without "network" permission
node world-toolResponse5 ... Mod "null" ... without "shell" permission
Mail.send failed ... Mod "null" ... without "mail" permission
```

Two things had been misread in earlier rounds.

First, `Mod "null"` never went away. The r43 log looked clean only because
`OnStart` had not run at all that time — silence was mistaken for success. That
is a reminder to prefer positive evidence: the unconditional "quest started"
line added in r44 is what made this readable.

Second, and decisively: **every failure appears after both lifecycle lines.**
`OnStart` and `OnObjectivesStart` had already returned by the time the network
was attempted. That ordering is the entire diagnosis.

### The cause

The engine treats a mod as "current" only while it is inside a call it made —
`OnStart`, `OnObjectivesStart`, an event handler. Once that call returns, the
mod has no identity, and the next SDK call is attributed to `Mod "null"` and
refused whatever the manifest says.

`runFlow` walked the graph with

```js
edges.reduce((p, e) => p.then(() => runFlow(e.target, ...)), Promise.resolve())
```

`Promise.resolve().then(...)` defers even wholly synchronous work into a
microtask. So every node — building the network, seeding tool output, sending
the mail — ran *after* `OnStart` had returned, outside the window in which the
mod was allowed to do anything. The quest never got a target machine, so nothing
downstream of it could ever complete.

This also explains why r41's `dist/manifest.json` change made no difference: the
manifest was always fine, and always found. The mod was simply asking at the
wrong moment.

### The fix

A small `__QE.seq` helper walks a list and stays synchronous until something
genuinely returns a promise. `runFlow` and `continueFrom` both use it. A quest
with no delays now completes entirely inside `OnStart`; a Delay node, a timed
chat beat or a hackertyper moment still awaits, because those must.

Reproduced first in a harness that revokes permissions the instant `OnStart`
returns — which produced the author's four log lines exactly — and then fixed
against it. Two of the new tests fail against the old code and pass against the
new, so the regression is genuinely pinned rather than merely described.

### On the wire animation frame rate

Asked whether the 15fps throttle had been applied: yes, in r42
(`FALLBACK_FPS = 15`), but it only governs the fallback loop for engines with no
`Element.animate`. On Firefox and Chromium the browser drives the animation and
there is no loop to throttle — which is why the second profile showed zero JS
frames while idle.

**Verification:** 500 tests (19 files, +3), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-03.r45"`.

## Round 46 — the quest runs; now it has to survive a real player

r45 landed. In-game: the mail arrives, the network is built, and reading the
brief ticks its objective and advances the quest. The remaining faults are of a
different kind — not "nothing works" but "works only if the player behaves like
a test harness".

### `lynx Anselm Ritter` printed the dossier but did not tick

Text comparisons were exact. The author writes `Ritter`; the game reports
whatever the player typed, and `lynx "Anselm Ritter"` and `lynx Anselm Ritter`
raise the same event with different query strings. Nobody expects a quotation
mark or a capital letter to decide whether an objective completes.

`equals`, `contains`, `startsWith` and `endsWith` are now trimmed,
case-insensitive, and blind to surrounding quotes on either side. `matches`
(regex) and the numeric comparisons are untouched: an author reaching for those
wants exact control.

This is the likeliest cause, but it is not proven, because the log said nothing
at all — which was its own bug. A condition that rejects an event now logs it,
with the event's real contents:

```
objective "identify-target": Terminal.Lynx.Search fired but did not match.
Event carried: { query: "Anselm Ritter" }
```

An event that never fires and a condition that never matches used to look
identical in a log. They no longer do, and the line prints the field names the
event actually carries, so a mismatched field is visible rather than deduced.
Standalone triggers log the same way.

### Our own lynx output was luring players into a crash

Searching `@a_ritter_mc` on Twotter crashed the game and corrupted the save:

```
TypeError: Cannot read properties of undefined (reading 'toLowerCase')
    at Array.filter ...
```

The handle came from **our** template. The lynx dossier advertised a Twotter
account, the player did the obvious thing, and the built-in search read a field
off a profile that does not exist. This build's SDK cannot create a Twotter
profile at all (which is why Twotter was withdrawn in r31), so *any* handle in a
lynx result is one with nothing behind it.

The handle is gone from the template, and export now warns when a lynx result
contains one, naming it and saying why. A test asserts no shipped template ever
advertises one again. E-mail addresses are not flagged: they contain an `@` but
are not handles, and they are a perfectly good lead.

The crash is the game's, not ours — but the bait was ours, and a template should
not hand a player a save-corrupting instruction.

**Verification:** 508 tests (19 files, +8), `tsc --noEmit` clean, `vite build`
clean. Driven through the permission-enforcing harness with deliberately awkward
input — quotes around the lynx name, `Meridian-Capital.NET` for the whois — the
contract template now completes read-brief, identify-target, find-server,
scan-server, get-a-shell and delete-ledger in order. Export stamp:
`EDITOR_BUILD = "2026-09-03.r46"`.

## Round 47 — the declared payload was not the real one

The logging added in r46 paid for itself on its first outing. One line:

```
objective "identify-target": Terminal.Lynx.Search fired but did not match.
Event carried: "Anselm Ritter"
```

A **bare string**. The SDK declares the event as `{ query: string }`, the
editor offers `query` as a field on that basis, and the condition dutifully read
`.query` off a string, got `undefined`, and never matched. The dossier had been
printing perfectly the whole time; only the objective was stuck.

This is the fourth instance of the pattern that has run through this project:
the declarations describe one thing and the build does another. Previous
rounds fixed the specific case; this time the fix is general, because the next
event to disagree would otherwise fail in exactly the same silent way:

- if a payload is **not an object**, any field name resolves to the payload
  itself — it is the only value there is, and unambiguously what the author
  meant;
- if a payload is an object with **exactly one primitive value** and the named
  field is absent, that value is used — a mistyped field name should not be the
  difference between a quest that works and one that stops dead;
- if the object has **several** candidates, no guess is made. Guessing there
  would be worse than saying no.

Three events (`AppStore.Downloaded`, `Terminal.SSH.Connected` and
`.Disconnected`) are declared as primitives, so this was always a shape the
compiler had to handle; lynx simply proved the declarations can be wrong about
which events those are.

`Terminal.Lynx.Search` is also recorded in `PAYLOAD_IS_REALLY_PRIMITIVE`, so the
condition builder describes it honestly instead of offering a field that will
not be there. That list is for **in-game confirmed** discrepancies only — never
inferred from declarations, which are precisely what proved unreliable here.

Also confirmed by QA this round: the Twotter search no longer crashes, so
removing the handle from the template closed a save-corrupting bug.

**Verification:** 515 tests (19 files, +7), `tsc --noEmit` clean, `vite build`
clean. Fired with the exact payloads the game sends — including the bare string
for lynx — the contract template completes read-brief, identify-target,
find-server, scan-server, get-a-shell and delete-ledger in order. Export stamp:
`EDITOR_BUILD = "2026-09-03.r47"`.

## Round 48 — the same question asked of every tool

r47 fixed `lynx`. The right follow-up is the one QA asked: which of the other
tools have the same problem?

The honest answer is that nobody can know without running each one in-game. What
*can* be guaranteed is that the compiler survives either shape for all of them,
so the next event that disagrees costs a log line rather than a round.

The risk class is precise. An event the SDK declares as an object with exactly
**one** field can plausibly arrive as a bare value instead — that is exactly what
`Terminal.Lynx.Search` does. Across the 92-event catalogue:

- **3** are already declared as primitives (`AppStore.Downloaded`,
  `Terminal.SSH.Connected`, `Terminal.SSH.Disconnected`);
- **19** are single-field objects — lynx's risk class, including
  `Terminal.Geoip`, `Terminal.Dig`, `Terminal.Cd`, `Terminal.Explorer`,
  `Terminal.Openssl`, `WeeChat.Connected`/`Disconnected`, `PFSense.Login`,
  `Sqlmap.ListTables` and `Mail.AccountLoggedIn`;
- **70** carry several fields, where a bare value cannot stand in for the whole
  payload and the declared shape is far likelier to be right.

New tests drive **every** event in the catalogue through a real compiled mod:
each single-field event in its declared shape *and* as a bare value, each
declared primitive, and the first field of every multi-field event. All pass.
Reverting the r47 fallback makes the bare-value sweep fail, so the coverage is
real rather than decorative.

A second test pins each scripted tool to the event it should raise and the field
an author would match on — the nine pairs the Standard Contract Hack walkthrough
depends on — against the SDK's own catalogue.

Ambiguity is still refused: a multi-field payload whose named field is absent
does not guess.

### The date warning is ours

QA noticed a `moment` deprecation warning
(`value provided is not in a recognized RFC2822 or ISO format`) and did the
right experiment: uninstalled the quest-editor mod, ran the game, and the
warning did not appear. It is caused by our mod, and in every log it follows a
mail being sent.

We never set a date on a mail. `QuestMailDefinition` has no date field and
`MailDefinition` (what `Mail.send` takes) has none either — `sentAt` appears
only on `MailInfo`, which is what the game hands *back*. So the game is
defaulting the timestamp and then parsing its own default with `moment`.

That is as far as the evidence goes, and it is not enough to justify a change:
the plausible culprits are the `to` address we set from `Mail.getPlayerEmail()`
(the working reference mod omits `to` on its introduction mail) and the
`attachments` array (which that mod never sends). Guessing between them would
repeat the r41/r43 mistake of shipping a fix for an unconfirmed theory. It is
recorded on the roadmap as ours, with the evidence, and it is a warning rather
than an error — nothing is broken by it today.

**Verification:** 523 tests (19 files, +8), `tsc --noEmit` clean. Export stamp:
`EDITOR_BUILD = "2026-09-03.r48"`.

## Round 49 — the version number metasploit would not take

Four of five objectives now complete in-game: read the brief, `lynx`, `whois`,
`nmap`. The quest then stopped dead at "Get onto the machine":

```
msf6 auxiliary(scanner/ssh/ssh_login) > set Version 7.2
[*] Invalid version for option: Version
```

The port advertised `OpenSSH 7.2`. metasploit's Version option wants **three
numbers** — its own default is `1.0.0`, and every single port in the working
reference mod is `x.y.z`: `OpenSSH 1.6.8`, `MariaDB 4.1.3`, `Apache 2.4.13`,
39 of them without exception. With two numbers the exploit cannot be
configured at all, so the quest is unfinishable.

The author had suspected version strings were fussy several rounds ago, after
watching another mod fail with `7.2p2`. That instinct was right, and the letter
was a second, separate trap — this one is purely the number of parts.

Every template port now uses three numbers (`OpenSSH 7.2.0`, `OpenSSH 8.9.0`,
`OpenSSH 8.4.0`), and export warns about any that does not, naming the device
and port and quoting the error the player would see. The Version field's hint
says it too. A test asserts no shipped template can regress.

### The date warning: one candidate eliminated, not yet solved

The `moment` RFC2822 warning is ours — QA confirmed it disappears with the mod
uninstalled. Two candidates were on the table: the `to` address we set from
`Mail.getPlayerEmail()`, and the `attachments` array.

**`attachments` is ruled out.** The Ledger template's three mails carry no
attachment at all, and the warning still appears. That leaves `to` — the
reference mod omits it on the mail it originates, and only sets it when replying
to a mail it received.

That is suggestive but still a theory, and shipping fixes for theories is what
cost rounds 41 and 43. The cheap experiment is one the author can run in a
single session, and it is recorded on the roadmap rather than guessed at here.

**Verification:** 530 tests (19 files, +7), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-03.r49"`.

A note on the hint that failed its own test while being written: the schema
suite caps field hints at 260 characters, and the first draft of the version
hint ran to 313. The guardrail is a good one — a hint nobody reads helps nobody
— and the short version says the same thing.

## Round 50 — a probe for the bugs that make no noise

### Correcting the date-warning theory

Last round the `to` address was the surviving suspect for the `moment`
deprecation warning. **It is not.** The r48 session sent mail and completed four
objectives with no warning at all, and `to` is set on every `Mail.send`
identically there. If `to` caused it, r48 would have shown it.

Re-reading when it actually fires: 30-90 seconds *after* the mail, immediately
before a browser or Twotter screen was opened, and the stack is a **renderer**
one — the game formatting a date for display. So it is still ours in the sense
that it needs our mod installed, but it is not the mail send, and the author's
inbox screenshot is correct as it stands: no attachment, empty `to`. Nothing to
change there. The roadmap entry now says what was eliminated and why, rather
than pointing at the wrong thing.

This is the second theory about this warning to die, which is the argument for
the rest of this round.

### The Debug probe

The author asked whether a debug node would help. It is the most useful thing
suggested in several rounds, because nearly every hard bug here has been *quiet*
rather than loud — the mod loads, nothing throws, and nothing happens. Rounds
35-49 were largely spent answering three questions a silent log would not:

- did the flow reach this point at all?
- what did the event really carry?
- what has the quest actually saved?

`flow.debug` answers all three, wherever the author drops it:

```
[quest-editor] reached "after the network is built" | event: (none - not
reached from a trigger) | saved: { targetIp="45.33.32.156" }
```

It sits inline in a chain and passes the flow straight through, so it can be
left in place while testing and deleted afterwards without rewiring. Four
toggles: a label, whether to print the event, whether to print saved values, and
whether to toast it on screen for testing without a log file.

Two details are deliberate. It says *"not reached from a trigger"* rather than
printing an empty object, because "no payload" and "empty payload" are different
findings. And it prints field **names**, since the whole lesson of r47 was that
the declared shape is not always the real one — a probe that showed only values
would have hidden that bug too.

A test asserts the probe never stops the chain it is watching: a diagnostic that
breaks the thing it is diagnosing is worse than none.

### On a dedicated debug template

Also suggested, and deliberately **not** built. The existing templates are the
better test bed precisely because they are what authors ship: every bug in
rounds 35-49 was found in the Standard Contract Hack, and each fix hardened a
template real players will use. A debug-only template would exercise a path
nobody ships and could pass while the real ones fail. With the probe available,
any template becomes a debug template wherever it is needed — which is the same
benefit without the second, diverging code path. Revisit if a bug ever needs a
setup no real quest would contain.

**Verification:** 543 tests (19 files, +9), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-03.r50"`.

## Round 51 — an open door with nobody behind it

The debug probe earned its keep immediately: its first line in a real log
(`reached "CreateRouterNode" | event: (none - not reached from a trigger) |
saved: { no fields }`) confirmed the network node ran, which took the compiler
out of the picture straight away.

### The exploit had nothing to attack

```
msf6 > set version 7.2.1
msf6 > exploit
[*] 45.33.32.156:22 - Launching attack.
[*] Attack failed.
[*] Port 22 could not be accessed.
```

The router advertised SSH on port 22 and its `users` array was **empty**. There
was nobody to log in as, so the attack had nothing to break into. Every
SSH-reachable device in the working reference mod carries at least one user;
ours did not.

The template's edge router now has an `admin` account, and export warns for any
device with a login service open (ssh, ftp, telnet, mysql, rdp, smb, vnc) and no
users — naming the device and the port, and quoting the message the player would
see. Splitters and firewalls are excluded: they are plumbing, and nobody logs
into them. Writing the test surfaced the same fault in two of r49's own
fixtures, which had empty routers for convenience.

### Two corrections from the same screenshot

**The game truncates the banner it displays.** We hand it `OpenSSH 1.7.2` and
nmap prints `OpenSSH 7.2`. QA reasonably read that as the export ignoring the
change; it is not. Verified by running the shipped v12 zip and printing exactly
what reaches `Network.createSubnetNetwork` — the full three-part string is sent.
**Displayed text is not evidence about what was exported**, which is worth
remembering the next time a value looks wrong on screen.

**r49's version fix was right.** The same screenshot shows `set version 7.2`
refused and `set version 7.2.1` accepted. The banner made it look as though
nothing had changed, but the three-part requirement is confirmed.

### Old mail is not ours to clean up (probably)

Mail sent by a since-removed mod stays in the inbox. The SDK's `Mail` namespace
offers `send`, `getInbox`, `getPlayerEmail`, `registerTemplate` and
`unregisterTemplate` — and **no** delete or remove of any kind. Quest cleanup
runs on complete/abandon, but there is no API to withdraw a delivered mail. It
is on the roadmap as unresolved rather than dismissed, because "the SDK has no
method for it" has been wrong before.

**Verification:** 551 tests (19 files, +8), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-03.r51"`.

## Round 52 — the network that would not go away

QA set a port version to `OpenSSH 1.7.2`, re-exported, and the game still showed
`OpenSSH 7.2`. Then did it again. Then a third time, with a fresh mod version
each time. r51 had already proved the export was correct by printing exactly
what reaches `Network.createSubnetNetwork`, so the export and the display
disagreed — and the author's instinct that "it's probably not just a display
thing" was right.

**Networks were never destroyed.** `world.network` created a subnet and
registered no cleanup at all. `destroyOnComplete` has been in the schema and on
the inspector since the node was written; the compiler simply never read it. So
the first network the save ever saw at `45.33.32.156` stayed there, and every
later version of the mod created a network the game already had.

That single fault explains both symptoms that cost the last three rounds:

- **the port version that would not change** — the banner came from the network
  in the save, not from the export;
- **the exploit that kept failing** — the `admin` account added to the router in
  r51 never reached the game, because the game was still using the old,
  userless network. The r51 fix was right and had no way to take effect.

`world.network` and `world.wifi` now register a `destroyNetwork` cleanup, using
the IP actually used (which matters for `ipMode: "random"`, where the address
comes from `CreateData`). Cleanup already ran on both complete and abandon.

### The general lesson, made mechanical

This is the third fault of the same shape: the editor promises the author
something the compiler does not do — r39's objective trigger, r43's export
order, and now a toggle that was pure decoration. A new schema test walks
`src/schema/nodes.ts` for every `*OnComplete` flag and fails if the runtime
never mentions it, and asserts every world-mutating kind has both a
registration and a matching teardown. A toggle that lies to the author is worse
than no toggle.

### A note for the next test run

The stale network lives in the **save**, not the mod. Installing r52 does not
retroactively remove it: the quest has to complete or be abandoned once with a
build that knows how to tear it down, or the test has to start from a fresh
save. Worth knowing before concluding that r52 did not work either.

**Verification:** 558 tests (19 files, +7), `tsc --noEmit` clean, `vite build`
clean. Removing the new cleanup call makes three of the new tests fail, so the
coverage is real. Export stamp: `EDITOR_BUILD = "2026-09-03.r52"`.

## Round 53 — the accounts the exploit is actually looking for

r52 worked: with the stale network finally torn down, the port banner shows
`OpenSSH 7.2.0` — the value the project has held since r49. Everything the
previous three rounds fixed was real; it simply could not reach the game.

With the right machine finally under attack, the exploit failed with a **new**
message, and the change is the whole finding:

```
r51:  [*] Port 22 could not be accessed.
r53:  [*] No guest account or online user found.
```

That second line is a specification. The SSH exploit does not log in as whoever
happens to be listed on the device: it wants a **guest account**, or a user who
is **online**. The router had a named `admin` — added in r51 to fix the first
message — who was neither.

The working reference mod never hands the engine a bare user array. All 25 of
its machines wrap their users in

```js
Network.createDefaultUserSchema([ ...users ], { guest: true })
```

...and that call is what adds the accounts the exploit attacks. We had never
called it once, on any device, in any template.

Devices now go through it, and the author's own users default to `online: true`
unless they explicitly said otherwise — a machine nobody is logged into cannot
be broken into through a login service, and that was never a distinction the
editor offered to make. Splitters and firewalls are excluded: they are plumbing,
and a guest account on them would just be noise on the player's network map.

Verified against the compiled template: the router and the workstation each
arrive carrying their named user (online) **and** a guest account.

### Three fixes, one symptom, in order

Worth recording, because the sequence was only legible in hindsight. "The
exploit fails" had three independent causes stacked on top of each other:

1. **r51** — the machine had no users at all (`Port 22 could not be accessed`);
2. **r52** — the fix could not reach the game, because a stale network in the
   save shadowed every re-export;
3. **r53** — the users it did have were the wrong kind
   (`No guest account or online user found`).

Each fix was necessary and none was sufficient. The error message changing is
what proved progress each time, which is an argument for reading the exact
wording rather than "it still fails".

**Verification:** 564 tests (19 files, +6), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-03.r53"`.

## Round 54 — two small things before the next test

### One way in

The Ledger router advertised port 80 as open next to SSH. The quest is written
entirely around the SSH route, so an open web port invites the player down a
path the template does not script — and the HTTP exploit route has not been
tested at all yet.

The port stays, closed. An edge router with a web port is what a real one looks
like, and one closed port beside one that answers teaches the difference at a
glance. A later template can teach the web route properly, once it is known to
work. Tests assert the port is present, closed, and that exactly one port on
that router is open.

### Probes that name themselves

QA was hand-typing a name into each of ten debug probes on every test run, which
is exactly the friction that stops a diagnostic from being used. The convention
QA arrived at is a good one, so it is now generated:

```
<Socket>-<Node>-<Detail>
```

Wiring a probe to an objective's "On complete" socket names it
`OnComplete-Objective-DeleteLedger`. On the real contract template the full set
comes out as `Out-CreateNetwork-MeridianEdge`, `Out-ToolResponse-Lynx`,
`When-WhenEvent-TerminalLynxSearch`, `Unlocks-Objective-GetAShell`, and so on.

Three details worth stating:

- **the socket comes first**, because the interesting probes hang off a
  *particular* output — "Yes" against "No" on a branch, "Unlocks" against "On
  complete" on an objective. The name uses the label the author sees on the
  canvas, not the internal handle id (`done` → `OnComplete`);
- **the detail is whatever tells two nodes of one type apart** — an objective's
  name, a device's name, a trigger's event, a mail's subject line;
- **it only ever fills a blank.** An author who types their own name keeps it,
  including when the probe is later rewired to something else.

**Verification:** 576 tests (19 files, +12), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-03.r54"`.

## Round 55 — the save keeps the first network it ever saw

Two symptoms this round, and one cause behind both. Port 80 was closed in the
project, verified closed in the exported bundle, and displayed **OPEN** in game.
The exploit still reported `No guest account or online user found`, from a build
whose export demonstrably carries a guest account on both machines.

Running the shipped v15 zip settles what we send:

```
createDefaultUserSchema called: 2 [{"n":1,"opts":{"guest":true}}, …]
ROUTER 45.33.32.156 meridian-edge
   port 80 active=false service=http
   port 22 active=true  service=ssh
   user admin online=true
   user guest online=true
```

Every value is right. The game was not looking at it.

### Why r52's fix was not enough

r52 taught the compiler to destroy its networks — on `OnComplete` and
`OnAbandon`. Both are correct, and neither ever fired: **the Ledger quest has
never been completed.** Each test installs a new version, plays four objectives,
and stops. The engine's own `PruneOrphanQuests` drops the stale *quest record*
(the log says so, every run), but nothing calls `OnAbandon` on it, so the
network it built stays standing.

A network already in the save then wins over a new one created at the same
address. So the network answering nmap was v14's — which had port 80 open, and
predated the guest accounts entirely. That single fact predicts all three
oddities: the port that would not close, the guest account that would not
appear, and the version that *did* look fixed (7.2.0 in both builds, so nothing
to notice).

### The fix

`world.network` and `world.wifi` now call `destroyNetwork(ip)` immediately
**before** `createSubnetNetwork`, every run. Teardown at the end of the quest
stays, but nothing depends on it any more: the address is cleared on the way in,
so whatever a previous build left behind cannot shadow the current one.

Writing the test caught a real ambiguity in the author-facing toggle. "Destroy
when the quest ends" is about what survives the quest — it must *not* suppress
the clear-before-create, or turning it off would reintroduce exactly this bug.
The test now says so explicitly, and a second test pins the ordering
(destroy before create) with the toggle both on and off.

**Verification:** 577 tests (19 files, +1 net, one rewritten), `tsc --noEmit`
clean, `vite build` clean. Against the real template the operation order on
quest start is now `destroy 45.33.32.156` then `create 45.33.32.156`.

Export stamp: `EDITOR_BUILD = "2026-09-03.r55"`.

## Round 56 — destroyNetwork returns a promise

r55 made things worse. The network stopped existing at all:

```
nmap 45.33.32.156 -sV
Host is down (0.44216s latency).
No ports found
```

`Network.destroyNetwork(ip)` is declared `Promise<void>`. r55 fired it and
called `createSubnetNetwork` on the very next line, so the destroy resolved
*after* the create and removed the network the mod had just built. Every symptom
followed from that: a host that was down, and a scan-server objective that still
completed because the player had scanned an address the engine knew about a
moment earlier.

The obvious repair — await the destroy — is the r45 bug in a new coat. The
engine only grants a mod its permissions while it is inside a call the engine
made; anything past an `await` runs after `OnStart` has returned and is refused
as `Mod "null"`. So the fix cannot simply be "wait".

`Network.getSubnet(ip)` is synchronous, which resolves the conflict:

- **the address is free** — the overwhelmingly common case — build immediately,
  entirely inside `OnStart`, no promise involved;
- **something is already there** — log it, wait for the destroy, then build. The
  quest loses its permissions for the remainder of *that* run, but the network
  lands and every run afterwards takes the fast path. A quest that half-runs
  once beats one that never builds its world.

A failed destroy still attempts the create rather than giving up.

Verified against the real template, both paths:

```
clean address        synchronous create inside OnStart: true
                       create  45.33.32.156
stale network        synchronous create inside OnStart: false
                       destroy 45.33.32.156
                       create  45.33.32.156
```

One r55 test had to be rewritten rather than kept: it asserted the destroy
happened unconditionally, which *was* the bug. It now pins the two behaviours
separately — no destroy on a clean address, and strict destroy-before-create on
a dirty one — plus a case where the destroy rejects.

**Verification:** 579 tests (19 files, +2), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-03.r56"`.

## Round 57 — the exploit worked, and took the easy door

r56 landed. The network exists, port 80 is closed, port 22 answers with
`OpenSSH 7.2.0`, metasploit accepts the version, and the attack **succeeds**:

```
[*] 45.33.32.156:22 - Backdoor service has been spawned, handling...
[*] 45.33.32.156:22 - UID: uid=0(guest) gid=0(guest).
[*] Found shell.
[*] Command shell session opened
```

Three rounds of network faults are behind us. What is left is in that third
line: `uid=0(guest)`. The exploit logged in as the **guest** account and opened
a plain command shell. In the base game a successful exploit hands the player a
meterpreter session, which is what the quest's next objective waits for
(`Metasploit.Meterpreter.Connected`).

The guest account was ours. r53 fixed "No guest account or online user found" by
routing every device through `createDefaultUserSchema(users, { guest: true })` —
correct diagnosis, too broad a fix. The reference mod is precise about where it
applies that call:

```
Routers: 7   Devices: 26   createDefaultUserSchema calls: 25
```

Twenty-five calls for twenty-six devices, and **none** on any router. Its
routers carry a plain list of named accounts built with `createUser`. The one
user in the whole mod with `acceptReverseTCP: true` is a named, online account
on a *device* — not a guest.

So a guest on the edge router was a door standing open in front of the one the
quest intended. The exploit is not wrong to walk through it; it is doing what it
says on the tin and finding the easiest account available.

Only `DEVICE` now gets the default schema. Routers, splitters and firewalls keep
exactly the accounts the author wrote. Verified on the template: the edge router
offers `admin` alone (online, reverse-TCP), and the workstation behind it offers
`aritter` plus a guest.

A test from r53 had to be inverted rather than kept — it asserted a router gets
a guest account, which was the bug. It now asserts the opposite, with the
reference mod's counts recorded in the comment so the reasoning survives.

**Verification:** 580 tests (19 files, +1), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-03.r57"`.

## Round 58 — the router is the way in, not the target

QA's point, and it is the right one: a hacker comes in through the edge and logs
in to somebody's PC. That is how the game plays, and it is what the reference
mod does without exception.

Counting its seven networks:

```
router ports: ['http']   x7      — no SSH on any router, ever
```

Every router serves port 80, `locked: true`, with no version banner. The
exploitable SSH service is always on a Device behind it, `locked: false`, with a
version. The one account in the whole mod carrying `acceptReverseTCP: true` is a
named user on such a device.

Our template had SSH on the router *and* on the workstation, so the player
attacked the edge and never went inside. The fix is structural rather than a
patch:

- **the edge router** serves the website only — port 80, active, locked — and
  carries a plain `admin` account with no reverse-TCP flag. It is the way in;
  there is nothing on it worth stealing;
- **the workstation behind it** keeps port 22, active and explicitly unlocked,
  with the old OpenSSH banner, the `aritter` account with `acceptReverseTCP`,
  the guest account from the default schema, and the ledger file.

### `locked` never reached the engine

Along the way: `NetworkPort.locked` has been in our schema and in the port
editor from the start, and the compiler dropped it. That is the fourth instance
of a field the editor offers and the compiler ignores, after `destroyOnComplete`
(r52), the objective trigger (r39) and the export shape (r43). It is emitted
now, and r52's schema guard already fails the build if a `*OnComplete` flag goes
unread — worth extending that idea to plain fields if a fifth turns up.

### The quest text follows the world

An objective that says "scan that server" is wrong when the interesting machine
is one hop further in, so: the scan objective now says *see what is behind the
company's edge router* and names the 10.0.0.x range in its hint, and the shell
objective says *get onto Ritter's workstation* and names the address. The scan
trigger accepts **either** address — the player must scan the edge to discover
what is behind it, and scanning the workstation is just as much "seeing what is
running". Failing them for taking the second step first would be pedantry.

That needed `triggerFor` to support an `or` join, which it had never offered.

Emitted network, for the record:

```
ROUTER 45.33.32.156 meridian-edge
   port 80 http active=true locked=true
   user admin    online=true
  DEVICE 10.0.0.12 ritter-ws
     port 22 ssh active=true locked=false ver=OpenSSH 7.2.0
     user aritter  online=true reverseTCP=true
     user guest
```

**Verification:** 581 tests (19 files, +1 net; three that pinned the old
topology rewritten), `tsc --noEmit` clean, `vite build` clean. Export stamp:
`EDITOR_BUILD = "2026-09-03.r58"`.

## Round 59 — a blank briefing, and the trade that caused it

The read-the-contract objective stopped completing. The probe line said why in
one go:

```
Mail.Read fired but did not match. Event carried:
{ from="i.faber@ghostmail.io", subject="", content="" }
```

The mail arrived **empty**. The trigger matches on the subject, and there was no
subject to match.

Reading up the log gives the whole chain:

```
network 45.33.32.156 already exists in this save; replacing it
node world-toolResponse5 failed: Mod "null" ... without "shell" permission
Mail.send failed: Mod "null" ... without "mail" permission
mail "One file, one man, no trace" sent via Quest.sendMail(0)
```

This is r56's doing. That round chose to wait for `destroyNetwork` when a stale
network was present, and accepted losing the mod's permissions for the rest of
that run as a fair price. It is not a fair price. Everything after the await ran
without rights: the tool responses were skipped, `Mail.send` was refused, and
the mail went out through `Quest.sendMail(0)` — which sends whatever the
**engine** holds in `this.Mails[0]`, not the text we filled in. The engine had
never taken our Mails array, so it delivered a blank mail and reported success.

A quest that half-builds is worse than one that visibly does nothing, because it
looks like it worked.

### Two fixes

**The destroy is no longer awaited.** It is fired on the way past and left to
settle; the create is synchronous, so the quest keeps its permissions for the
whole of `OnStart`. Where the engine replaces by address, that is all that was
ever needed; where it does not, the destroy still lands and the next run is
clean. Either way the player gets a working mod.

**The fallback refuses to send a blank mail.** It now checks that the engine's
own copy has a subject before trusting `Quest.sendMail`, and says so plainly
when it does not, instead of reporting a delivery that never happened.

Fixing that exposed a related trap a few lines above: the code that keeps the
declared copy in step with the sent text would happily write into an entry the
engine had left empty — repairing the very evidence the guard needs. It now only
refreshes an entry that already has a subject.

Verified by replaying QA's exact conditions — a stale network present *and*
permissions revoked the moment `OnStart` returns:

```
mails sent: 1 {"subject":"One file, one man, no trace", "body":"His name is Anselm Ritter. That is all y…"}
objective "read-brief" completed by Mail.Read
```

**Verification:** 586 tests (19 files, +4), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-03.r59"`.

## Round 60 — two small ones

### The deprecation warning on install

```
npm warn deprecated whatwg-encoding@3.1.1: Use @exodus/bytes instead
```

It came from `jsdom`, which is a **dev** dependency — the DOM the tests run in.
Nothing shipped in a mod was ever affected, and nothing an author runs touches
it. Still worth clearing: an install that prints warnings trains people to
ignore warnings.

`jsdom` 30 replaced `html-encoding-sniffer@4` (which pulled `whatwg-encoding`)
with version 6 (which uses `@exodus/bytes`), so the upgrade removes the package
entirely rather than silencing the message. vitest declares `jsdom: '*'`, so
there was no version conflict to negotiate. `npm ls whatwg-encoding` now returns
empty and a fresh install prints no deprecation warnings at all. All 586 tests
pass unchanged under the new DOM.

### A probe kept the name of a wire it was no longer on

Reported by QA: plug a probe into the wrong socket, notice, move it — and the
label still described the old wire.

r54 only filled a *blank* label, which was the wrong test for "has the author
named this?". It is true exactly once: the moment we generate a name, the field
stops being blank, so no later rewire could ever change it.

The data now records whose name it is. `labelAuto` is set when we generate one
and cleared the moment an author types their own, so:

- **wiring a fresh probe** names it;
- **moving it** re-names it, every time;
- **a name the author typed** is never overwritten, however often it is
  rewired;
- **clearing the field** hands naming back to us, and the next wire names it
  afresh.

A probe can take more than one incoming wire, so the newest connection wins —
that is the one the author just made.

Writing the tests turned up a detail worth recording: an objective's second
socket is `unlock` (not `unlocks`), and it carries an **unlock** wire, which
cannot feed a flow input. The first draft of the test tried it and failed for
that reason rather than the one under test. The product code was right; the test
was wrong.

**Verification:** 589 tests (19 files, +3), `tsc --noEmit` clean, `vite build`
clean. Reverting the `labelAuto` check makes the rewire test fail, so the
coverage is real. Export stamp: `EDITOR_BUILD = "2026-09-03.r60"`.

## Round 61 — a quiet install, properly this time

r60 fixed the `whatwg-encoding` deprecation by taking the newest jsdom. That
introduced a worse warning:

```
npm warn EBADENGINE package: 'jsdom@30.0.1',
npm warn EBADENGINE required: { node: '^22.22.2 || ^24.15.0 || >=26.0.0' },
npm warn EBADENGINE current:  { node: 'v24.14.1' }
```

jsdom 30 wants Node 24.15.0; QA has 24.14.1. Latest is not the same as correct,
and I did not check the engine range before upgrading.

**jsdom 28** is the version that clears both problems. It already uses
`html-encoding-sniffer@6` (so `whatwg-encoding` is gone), and its engine range —
`^20.19.0 || ^22.12.0 || >=24.0.0` — covers every Node from 20 upward, including
QA's. A clean install from the committed lockfile now prints nothing at all.

### Made mechanical

`Launch.bat` runs `npm install` in front of a non-coder, so anything npm prints
there reads as a fault. Both warnings that have reached QA are now caught by a
test rather than by QA:

- every entry in `package-lock.json` is checked against the `engines.node` floor
  the project declares, and the test fails naming any package that wants
  something newer — which is exactly the EBADENGINE npm would print;
- `whatwg-encoding` is asserted absent by name.

Re-introducing jsdom 30's engine range into the lockfile makes the first test
fail with `jsdom@…: needs ^22.22.2 || ^24.15.0 || >=26.0.0`, so it catches the
precise mistake r60 made.

The right general lesson: a dependency bump has to be checked against the Node
floor the project supports, not just against whether the tests pass on this
machine. The test now does that.

**Verification:** 592 tests (20 files, +3), `tsc --noEmit` clean, `vite build`
clean, and a clean `npm install` prints no warnings. Export stamp:
`EDITOR_BUILD = "2026-09-03.r61"`.

## Round 62 — undoing two rounds of chasing a cosmetic warning

QA: the launcher used to finish a **fresh** download-and-run in under ten
seconds, and after r61 it appeared to hang. That measurement is the one that
mattered, and it made the cause obvious.

r60 upgraded jsdom to silence `npm warn deprecated whatwg-encoding`. r61 then
had to fix the `EBADENGINE` warning *that* caused, by settling on jsdom 28. What
neither round checked was the weight of what came with it:

```
added by jsdom 28:  undici 1.6 MB · css-tree 1.4 MB · mdn-data 0.7 MB
                    + 9 more, ~3.7 MB of packages jsdom 26 never needed
```

A cosmetic warning in a **dev-only** dependency — one that never touches an
exported mod, and that only appears while installing — is not worth minutes of
an author's time on every fresh setup. Both upgrades are reverted; jsdom is back
on 26 and the deprecation notice comes back with it. That is the right trade,
and I made it the wrong way round twice.

### The launcher was also doing more work than it needed

Measured here on the same lockfile:

```
npm ci       28 seconds
npm install   7 minutes   (identical result)
```

`npm install` re-resolves the whole tree against the registry before it does
anything; `npm ci` installs exactly what `package-lock.json` already pins.
`Launch.bat` now:

1. **skips the install entirely** when `node_modules/.package-lock.json` exists,
   which is the common case — an author who already ran it once starts instantly;
2. uses **`npm ci`** when there is nothing installed yet;
3. falls back to `npm install` only if `npm ci` fails, so a hand-edited or
   missing lockfile still recovers rather than dead-ending.

### Guarded

The r61 test file now checks the thing that actually costs the author something
rather than the cosmetics:

- no package may require a Node newer than `engines.node` (the r61 bug);
- the tree stays at or under 285 packages;
- `undici`, `css-tree` and `mdn-data` are named individually, so if one returns
  the failure says *"undici is back — a first install just got slower"*.

Re-adding them to the lockfile makes that test fail with exactly that message.

The `whatwg-encoding` assertion is gone: it is a warning we have deliberately
chosen to live with, and a test demanding otherwise would just push the next
person into repeating r60.

**Verification:** 593 tests (20 files), `tsc --noEmit` clean. Export stamp:
`EDITOR_BUILD = "2026-09-04.r62"`.

## Round 63 — it was never our dependencies

QA asked the right question: compare the launcher and the install against
`origin/main`, because if there is no meaningful difference then the slowness is
not ours. That is exactly how it turned out, and it is worth writing down how
the measurement went, because two rounds were spent fixing the wrong thing.

### The comparison

Dependency difference between `main` and this branch: **one package** — the
`@hotbunny/hackhub-content-sdk` devDependency added in r48, which has no
dependencies of its own. 273 packages against 274.

Then the timings, same machine, same command:

```
main, cold cache      npm ci   7m 04s
main, warm cache      npm ci      15s
ours, warm cache      npm ci   7m 00s
just the SDK, alone   npm i    7m 00s   (a 32 KB package)
same tarball by curl                0.26s
```

A 32 KB file that curl fetches in a quarter of a second, taking npm seven
minutes — and `main` doing the same thing — rules out package weight, the
lockfile and anything either branch changed.

```
npm i @hotbunny/hackhub-content-sdk --no-audit --no-fund      0.4s
npm ci  (our whole tree)          --no-audit --no-fund        3.4s
```

**It is npm's audit call.** One request to the registry's advisory endpoint,
made after the install finishes, which stalls here for minutes and blocks npm
from exiting. Nothing to do with what is being installed.

### The fix

`Launch.bat` runs `npm ci --no-audit --no-fund`, with the same flags on the
`npm install` fallback. `npm audit` is a report about the *dev toolchain* — it
says nothing about an exported mod, and an author does not need it on every
start. Anyone who wants it can run `npm audit` directly.

Combined with r62's two changes, a launcher start is now: instant when
`node_modules` already exists, and a few seconds when it does not.

### What I should have done

r60 and r61 both changed dependencies to chase this, and r62 reverted them. The
comparison against `main` costs one command and would have ruled our changes out
before the first upgrade. When a symptom appears after a change, that is
evidence, not proof — and "does the unchanged branch do it too?" is the cheapest
way to tell the difference.

The jsdom revert in r62 still stands on its own merits: 3.7 MB of transitives to
silence a cosmetic warning was a bad trade regardless of what caused the stall.

**Verification:** 594 tests (20 files, +1), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-04.r63"`.

## Round 64 — the walkthrough catches up with the network

QA played the contract to the end. Meterpreter now opens, which is the payoff
for r52 through r58. What the run exposed is that the *objectives* still
described the old, flat network: moving SSH behind the router in r58 made the
route two steps longer, and neither step had an objective.

The real sequence, as played:

```
nmap the edge router
  → net_tree.py to see the machines behind it
    → metasploit the workstation's SSH
      → land as guest
        → show users, read /etc/passwd, john the hash
          → users <n> to become Ritter
            → delete the file
```

Two new objectives, **map-network** and **become-ritter**, cover the steps that
were missing. Both are triggered off `Terminal.Command` matched on the tool name
rather than the full line, because the argument varies — the player may map the
domain or the address, and the user index depends on how the engine ordered the
accounts.

The `get-a-shell` hint also said too much. It named `10.0.0.12`, which is
precisely the thing `net_tree.py` exists to reveal: handing it over in a hint
makes the mapping step pointless. It is gone, and a test now asserts that
address appears in **no** hint, description, info line or scripted tool output.
The public address stays in the whois result, because that is the way in.

Each objective gained an `info` line as well — the "why", separate from the
"how", which is what the field is for: *the exploit drops you in as guest, which
is enough to look around but not enough to touch his files.*

### The file that will not delete

Unsolved, and worth being precise about what has been ruled out. The game says
*"This file cannot be deleted."* once the player is Ritter and looking straight
at `ledger_q3.xlsx` in his home folder.

What we send is clean:

```json
{ "name": "ledger_q3", "extension": "xlsx", "data": "Q3 consolidated ledger …" }
```

No `readonly`, no `locked`, no `hidden`. `NetworkFileMap` carries all three and
we set none of them — and the working reference mod uses `readonly: true`
exactly twice, on files it deliberately protects, which confirms the flag means
what it looks like it means. So the refusal is not coming from the file
definition.

That leaves the engine's own rule for what a meterpreter session may delete, and
that is not something the SDK declarations describe. The one suggestive line in
the log is `Sys log file not found for 10.0.0.12` — the reference mod gives its
devices a `logs` root folder and ours has no `rootFiles` at all, which is worth
testing before theorising further. Recorded on the roadmap rather than guessed
at, on the r41/r43 principle: a fix for an unconfirmed theory costs a round.

**Verification:** 601 tests (20 files, +7), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-04.r64"`.

## Round 65 — two contracts, because they teach different things

QA's observation: with SSH behind the router, `net_tree.py`, a guest shell and a
cracked password, the Ledger had stopped being the standard job. It is a good
quest and worth keeping — but it is not the one the game hands out constantly,
and the *standard* template should be the short route.

So there are two now, and the difference is the whole point.

**Standard Contract Hack** (`data-grab`, Beginner) — a shipping company's file
server:

```
a name in a mail → lynx → whois → nmap → metasploit on 22 → copy the file → mail it back
```

The target is a **server**, so one administrator account is the entire story:
the exploit lands the player in the account that already owns the files. No
`show users`, no `/etc/passwd`, no `john`, no second terminal. And the player
takes a **copy** — nothing is destroyed, so a mistake costs nothing, and the
brief says why in character: *a missing file tells them somebody was there.*

**The Ledger Contract** (`contract-hack`, now Advanced) keeps the long route.

Tests pin the distinction rather than describing it: the standard server has
exactly one account, its objectives mention neither `john` nor `passwd`, it
takes rather than deletes, and the Ledger still has both the map and
become-the-user steps.

### Three fixes from QA's read of the network

**A personal PC now has one account.** The Ledger's workstation carried an
`admin` that a real person's machine would not have; it is `aritter` alone. The
engine adds `root` and `guest` itself through the default user schema, which is
where the three accounts QA saw came from — two of them were the engine's, and
one was ours and wrong.

**A realistic address.** `10.0.0.12` for a home machine behind a router became
`192.168.1.24`. The test that stops a hint leaking that address now reads it
from the network rather than hard-coding it, so renaming it cannot quietly
disarm the check.

**A `logs` folder on every target machine.** The reference mod gives one to all
26 of its devices, and the game had been logging `Sys log file not found for
10.0.0.12` against ours. `logs` is one of the engine's default root folders —
with `etc`, `home` and `lib` — so what we add is merged into the machine's own
rather than creating a second one. QA's reasoning for doing this was the right
kind: if a mod that works does something for every single machine, the reason
matters even when it is not documented.

Whether that is also what blocks the deletion is unproven. It is the best
candidate on the evidence, and it is worth having regardless.

**Verification:** 624 tests (20 files, +23), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-04.r65"`.

## Round 66 — three things the first playthrough found

### The standard template could not be finished

`nmap 203.0.113.47 -sV` reported port 80 and nothing else. That is *correct* —
the edge router serves the website only, which is the shape r58 established and
the reference mod uses everywhere. The mistake was mine: I gave the standard
template that topology and then wrote the objectives as though the player could
attack the address they had just scanned. Nothing anywhere told them a file
server existed behind it.

The Ledger template has a `net_tree.py` step for exactly this reason, added in
r64. The standard one needed it too. A test now derives the rule rather than
restating it: **if a template's router has no exploitable port of its own and
hides a machine that does, some objective must mention `net_tree`.** That holds
for both templates and will hold for the next one.

### "The player can reply" cannot work

QA ticked it and went looking for a Reply button. There was never going to be
one: `MailDefinition` — the shape `Mail.send` takes — has **no** replyable
field. Only `QuestMailDefinition` has one, and that is the array this build
ignores (r37). The flag has been dead since we switched to `Mail.send`.

Nothing can be done about that from here, so the editor stops promising it: the
toggle's hint says it is not honoured and points at the two things that do work
(a hackertyper reply page, or a typed-answer command), export warns if it is
turned on, the runtime logs it if it is somehow still set, and no template
leaves it on. A test asserts all of that.

### The attachment box read the wrong way round

Also a fair reading of the UI: QA expected the file the player has to steal to
go in the mail node's Attachment field. It is the opposite — an attachment is a
file that arrives *with* the mail, and a file to be stolen belongs on the target
machine, under a user on a network node. The panel now says so above the fields
rather than leaving "Attachment" to be interpreted.

### Objective hints are clipped by the game

The `info` line on an objective is truncated in the quest panel — the `?` hint
holds noticeably more. Not something we control, but worth knowing when writing
templates: put the essential sentence in the hint and keep `info` to one short
line. Recorded here rather than fixed.

**Verification:** 629 tests (20 files, +4), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-04.r66"`.

## Round 67 — the field audit

### First, an over-correction undone

r66 gave the Harbour template a `net_tree.py` step. That was wrong: the standard
job should not have a router at all. Confirmed against the SDK rather than
assumed — `SubnetNetworkDefinition` accepts `type: Device` at the top level, so
a directly reachable public server is legal. The template is now one server, one
open SSH port, one admin account, and no mapping step. The Ledger keeps the
router, the map and the cracked password; that is what makes it the advanced
one.

### The audit

QA's point: a field that looks reasonable and does nothing has cost this project
more rounds than any real bug. So all 122 fields the inspector renders were
checked mechanically against the compiler and runtime — not read, *checked* —
and four were being collected and silently dropped:

| Field | What the author was promised | What happened |
|---|---|---|
| `fx.pay.fromName` / `.fromIBAN` | the payment comes from this account | `BankTransactionOptions.from` was never set — every payment arrived from nobody |
| `reply.input.commandName` | the player types this command | ignored; a generated `qe-…` was registered instead, so the instruction on screen did not work |
| `reply.input.successMessage` | shown when the answer is right | ignored; always "Correct." |
| `flow.random.storeAs` | the pick is readable as `{{data.name}}` | nothing was ever written |

All four now reach the engine, each with a test that drives the compiled mod and
asserts the *behaviour* rather than the presence of a line of code.

Four fields remain unread on purpose, and are listed with reasons:
`layout.group.comment` and `flow.note.width` are canvas furniture, and
`fx.handbook`'s two fields belong to a node that export already warns is not
compiled. Anything not on that list is a bug.

### Kept honest from here

`src/schema/__tests__/fieldAudit.test.ts` runs the sweep on every build:

- every inspector field must be read by the compiler, or be listed as
  editor-only **with a written reason**;
- the exemption list must stay accurate — a field that starts working has to
  leave it, so the list cannot become a place bugs hide;
- the SDK objects we build must be filled in: `BankTransactionOptions.from`,
  `NetworkPort.locked`, the `NetworkUser` fields the device tree offers, and the
  `NetworkFileMap` flags a file can carry.

Reverting the `fx.pay` fix makes it fail, so it is real coverage rather than
decoration.

### Also swept

- **All 41 SDK calls** the runtime makes: 38 declared, and the three that are
  not (`Network.createWifiNetwork`, `Quest.claim`, `Shell.execute`) are each
  behind an `if (…)` guard for builds that might have them.
- **The dialogue editor**, all four kinds. Every field it collects maps onto a
  real member of `QuestMailDefinition`, `KisscordChatDefinition`,
  `WeeChatChatDefinition` or `QuestDialogSpeech`. The only SDK member we never
  set is `onSent`, a callback with no author-facing meaning.

**Verification:** 644 tests (21 files, +14), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-04.r67"`.

## Round 68 — correcting r66

QA asked a fair question: if "The player can reply" cannot work, why is it in
the editor at all? The answer is that it should not have been described that
way. **My r66 claim was wrong, and it was wrong in the way the standing rule
exists to prevent — I asserted something as settled that had never been tested.**

The chain of reasoning, checked rather than remembered:

- **r37** concluded that `Quest.Mails` + `sendMail` "does not put mail in the
  player's inbox in build 1.1.2".
- **r38**, the very next round, found that the mod *had not been loading at all*
  during those sessions. The log named every other installed mod's banner and
  never ours. So r37's conclusion was drawn from code that never ran.
- **r41** is the counter-evidence: `Mail.send` was refused for want of
  permissions, the `Quest.sendMail` fallback fired, and the briefing **arrived**.
  That path demonstrably delivers mail in this build.

So `replyable` was never proven dead. It was untested, and r66 turned that into
"cannot work and never could" — then wrote the claim into a warning, a hint and
a test, which is how a guess becomes furniture.

### What the code does now

`MailDefinition` — what `Mail.send` takes — genuinely has no reply flag; only
`QuestMailDefinition` has one. That is a fact about the SDK, and it decides the
routing:

- a **plain** mail goes through `Mail.send`, which r37 measured as reliable;
- a **replyable** mail goes through `Quest.sendMail`, the only shape that can
  carry the flag — but only when the engine has actually taken our `Mails`
  array, which is the same check the fallback already made;
- if it has not, the mail still goes out through `Mail.send` and the log says
  plainly that no Reply button will appear. A mail that arrives without its
  button beats a mail that never arrives.

The toggle's hint now says what it does and admits it is untested against the
live game, pointing at the hackertyper reply page as the proven alternative.
Export warns which path a replyable mail took and what to do if the button does
not show. Templates still leave it off — a template should ship the proven
route — but that is now a choice rather than a prohibition.

### The general lesson

The dangerous failure is not being wrong; it is recording a guess as a finding.
r66 put an untested claim into three places at once, and QA had to notice the
inconsistency to get it re-examined. Two things follow: evidence for a claim
about the game belongs in the comment next to it, and "we have not tested this"
is a legitimate thing for a hint to say.

**Verification:** 646 tests (21 files, +2), `tsc --noEmit` clean, `vite build`
clean. Routing verified end to end: plain → `Mail.send`; replyable with the
engine holding our copy → `Quest.sendMail(0)`; replyable without → `Mail.send`
plus the warning. Export stamp: `EDITOR_BUILD = "2026-09-04.r68"`.

## Round 69 — what the scripted reply actually is

QA described the mechanic the node was built for: when the player answers a
mail, a WeeChat line or a Kisscord message, the words are **pre-defined** and
appear as they mash keys. The question was whether the SDK exposes that, and
whether our Hackertyper node is how to reach it.

Checked, not assumed. The SDK has no hackertyper API — nothing named
hackertyper, typewriter, prefill or autotype anywhere in the declarations. What
it does have is the mechanic itself, on the message:

```ts
KisscordMessageDefinition.isMine  // "True if the player sends this message"
WeeChatMessageDefinition.isMine   // same; player username auto-filled
QuestDialogSpeech.options         // player response options, on a phone call
```

So a scripted player line **is** a message in the chat marked `isMine: true` —
and the dialogue editor has offered exactly that for some time, as "Player
message (appears instantly)" and "Player types it out".

The Hackertyper node is something else: it builds a bespoke HTML page with a
keydown handler and hosts it as an extra page on one of the mod's websites. That
is a legitimate trick — a fake terminal on a drop site is a good scene — but it
is not the game's own mechanic, and calling it "Hackertyper" implied it hooked
into one. It is now **Typed reply page**, "a fake terminal on a website", which
is what it is. Not removed: it works, it is used by a template, and a web
terminal is a real thing to want.

### Two bugs found on the way

**WeeChat player lines were not the player's.** We sent
`{ content, username: "you" }` and never set `isMine`. The SDK is explicit —
*"Player username auto-filled if isMine"* — so the engine read those as an NPC
who happens to be called "you". Fixed for typed lines and file uploads, with the
username omitted so the engine fills in the real one. Kisscord was already
correct, which is why this survived: the two paths were written separately and
only one of them was right.

**Two of the node's three surfaces built nothing.** "A desktop app" and "A phone
app" were offered in the dropdown, and the compiler only ever handled
`website` — pick either and the node vanished from the export in silence. The
SDK does have `RegisterApp` and `RegisterPhoneApp`, so they are buildable later;
until then export warns and the field hint says which one works.

That is the r67 audit's failure mode in a place the audit could not see: the
field *was* read, but only one of its values did anything. Worth remembering
that "the compiler mentions this key" is a weaker guarantee than it looks.

**Verification:** 655 tests (21 files, +9), `tsc --noEmit` clean, `vite build`
clean. Reverting the WeeChat fix fails its test. Export stamp:
`EDITOR_BUILD = "2026-09-04.r69"`.

## Round 70 — removing the Hackertyper node

r69 established that the game's scripted-reply mechanic is `isMine: true` on a
chat message, and that the Hackertyper node reached none of it: it generated a
bespoke HTML page with a keydown handler and hosted it as an extra page on one
of the mod's websites. QA's call was to remove it — a neat trick that uses no
game feature is bloat in an editor whose whole job is to expose the game.

Gone: the registry entry, the data schema, the canvas summary, the permissions
case, the export warning, the runtime's page builder and event helper, and the
reference-sheet entry. Node types are back to 31.

The Ledger Contract used it for the player's sign-off, so that step is now a
**typed answer** (`reply.input`) — a real SDK `Command` with a prompt, which is
the reply route the other templates already use. Its "Correct" output runs the
honesty check exactly as before: claim the job is done without doing it and the
client says so instead of paying.

### The removal exposed a live bug

Wiring the Ledger's reply onto `reply.input` failed, and the reason was not the
template. That node declares two outputs, **Correct** (`success`) and **Wrong**
(`failure`), and the runtime resumed the flow down a socket named `out` — which
it does not have. Every author who wired anything to Correct got nothing, in
silence. Fixed, with a test that plays a right and a wrong answer through a
compiled mod and checks which branch ran.

Worth noting how it surfaced: not by reading the code, but by moving a template
onto the node and finding it dead. The r67 field audit could not see this — the
field was read, the socket id was simply wrong.

### Templates tidied

QA spotted an "On start & reload" node connected to nothing on the Harbour
canvas. Three templates had one. Harmless at runtime, but a template is a worked
example, and a node wired to nothing reads as something the author forgot to
finish. All three removed, and a test now fails if any template ships an entry
point that starts nothing or a node connected to nothing. The reference sheet is
exempt by name — it is a field catalogue, deliberately unwired.

### On the brief's reply setting

QA asked whether "player can reply" being off was intentional, since the player
does have to mail the file back. It is: those are different things. Replyable
adds a Reply button to a mail the *quest* sent; mailing the manifest is a mail
the *player* composes in GoMail, which the quest notices with a `Mail.Sent`
trigger. A test now pins that distinction so neither drifts.

### A near miss worth recording

Deleting the runtime block by line number also deleted
`(PROJECT.quests || []).forEach(registerQuest)` — the line that registers every
quest in the mod. The suite caught it immediately, but `runtimeSource.ts` is a
`String.raw` template that TypeScript cannot check, so a bad edit there is
invisible until something runs it. Exact-string replacement, verified after each
step, is the only safe way to edit that file.

**Verification:** 656 tests (21 files), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-04.r70"`.

## Round 71 — stop trying to clear the address

QA re-exported Harbour onto the same save and `nmap` reported:

```
network 203.0.113.47 already exists in this save; replacing it     (our log)
Host is down (0.30114s latency).  No ports found.                  (in game)
```

Which is r55's bug, returned. Worth laying the three attempts side by side,
because each fixed the previous one and reintroduced the one before:

| | what it did | what broke |
|---|---|---|
| r55 | destroy, then create on the next line | `destroyNetwork` is a **promise**; it resolved after the create and deleted the new network |
| r56 | await the destroy, then create | the create now happens past an `await`, outside the window where the engine grants the mod its permissions — everything after is refused as `Mod "null"` (r45) |
| r59 | fire the destroy, don't await, create immediately | the same race as r55 — which is what QA hit here |

Three rounds solving the wrong problem. The question nobody asked was whether
the address needs clearing at all.

**It does not.** The reference mod, across seven networks, calls
`destroyNetwork` **zero** times and `getSubnet` **zero** times. It calls
`createSubnetNetwork` on every quest start and nothing else, and it works. The
engine copes with an address that already has a network; the stale networks that
started this whole line of work in r52 came from *our* missing teardown, which
r52 itself fixed.

So `buildNetwork` is now one synchronous call. No lookup, no destroy, no
promise — which also means the quest never leaves its permission window while
building the world. Teardown on complete/abandon stays, because that is what the
`destroyOnComplete` toggle actually promises.

Verified against the emitted Harbour mod with permissions revoked the instant
`OnStart` returns:

```
order: create -> shell -> shell -> mail
destroy called? false
```

The test that pinned the old behaviour was replaced rather than adjusted: it
asserted a destroy happens, which was the bug.

### The pattern worth naming

Three consecutive rounds each fixed the last one's symptom and restored the one
before it. That oscillation is itself a signal — when a fix keeps swapping which
of two failures you get, the shared premise is usually wrong. Here the premise
was "we must clear the address first", and one grep of the reference mod
retired it.

**Verification:** 656 tests (21 files), `tsc --noEmit` clean, `vite build`
clean. Export stamp: `EDITOR_BUILD = "2026-09-04.r71"`.
