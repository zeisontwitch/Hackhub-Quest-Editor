# r164: user-manual audit — what `public/manual.html` gets right, and what it is missing

Audit of the r163 handbook, done before any rewriting. Every number below was
extracted from the code, not counted by eye — a throwaway Vitest run dumped
`NODE_TYPES_REGISTRY`, `CATEGORIES`, `PALETTE_HIDDEN_TYPES`, `EVENT_COUNT`,
`EVENT_GROUPS` and `SDK_VERSION` straight out of the registry, and each claim
carries its `file:line`.

Gates at audit time: `npm run typecheck` clean, **1,498 tests / 77 files** green
(matches the r163 handoff exactly), dev server up on 5173.

**One correction up front:** the task brief refers to `manual.md`. There is no
`manual.md` in this repo — `find public -type f` returns `manual.html` and the
`fonts/` folder. The handbook is `public/manual.html`, 756 lines, 4,395 words.

---

## 1. Verdict

**The manual is accurate and it is nowhere near enough.**

Every number in it is right. I tried to break all of them and could not:

| Manual claims | Code says | Verdict |
|---|---|---|
| 34 node types | `NODE_TYPES_REGISTRY` → 34 keys; `schema.test.ts:44` asserts 34 | ✅ |
| 10 categories | `registry.ts:174-185` `CATEGORIES` → 10 | ✅ |
| 13 templates | `templates/index.ts` → 13 `name:` entries | ✅ |
| 92 game events | `schema.test.ts` asserts `EVENT_COUNT === 92` | ✅ |
| SDK 0.21.0 | installed `@hotbunny/hackhub-content-sdk` → `0.21.0` | ✅ |
| build `2026-09-14.r162` | `compile.ts:120` `EDITOR_BUILD` | ✅ |
| 6 themes / 7 fonts | `theme.ts` 6 ids, `uiFont.ts` 7 ids | ✅ |
| 10 event groups, names verbatim | `events.ts:32-43` — all 10 labels match character for character | ✅ |
| 28 shortcut rows | `SHORTCUT_GROUPS` (`Overlays.tsx:250-304`) → 28 rows | ✅ |
| Wi-Fi caveat | matches `compile.ts:480`; SDK `index.d.ts` has `WifiNetwork` (line 1090) as a **read-only** type and no create/add function in the `Network` namespace | ✅ |

The r163 author did the honest work. That is not the problem.

The problem is **shape**. The manual is a 4,395-word tour of a tool with 34 node
types, 120 editable fields, 65 sockets and 92 events. It documents by category
where the reader needs by-node, it documents nothing at field level, and it
documents none of the ~35 messages the editor can show you. It reads like a good
brochure for the editor. It is not yet a manual a stuck author can search.

---

## 2. The coverage hole, measured

Ground truth, extracted mechanically:

| | Count | Manual coverage |
|---|---|---|
| Node types | **34** | 34 one-line blurbs in 10 category tables. **0 individual pages.** |
| Editable fields (flattened out of sections and lists) | **120** | **0.** `schema.test.ts:124` already asserts `editable.length > 100` — the manual documents none of them. |
| Sockets on nodes (static) | **65** | 3 socket *kinds* described generically. **0 per-node port tables.** |
| Analysis / compile messages | **35 sites** — `analysis/graph.ts` 5, `analysis/fields.ts` 6, `compiler/compile.ts` 20, `compiler/targetWarnings.ts` 4 — plus the Quest inspector's live **Health** warning (`InspectorPanel.tsx:328-340`) | **0.** No message index exists. |
| Permissions the compiler can infer | **7** — network, mail, shell, events, bank, ui, filesystem (`compile.ts:170-217`) | **0.** The word "permission" does not appear in the manual. |
| `<img>` / `<figure>` | — | **0 / 0** in 756 lines. No screenshots at all. |
| `<script>` | — | **0.** No search, no TOC highlighting, no collapsing. |
| `@media print` | — | **0.** Not printable. |
| `id` attributes | **33**, all section-level | No field- or message-level anchors, so nothing is deep-linkable. |

The 35 messages are the sharpest loss. They are *already written for a
non-coder* — `graph.ts:14-27` defines every issue as `{ label, detail, nextStep,
severity }`, and r124 made `nextStep` mandatory precisely because "a warning
that says what is wrong without saying how to fix it is a dead end for a
non-coder". The manual then paraphrases a worse version of two of them into
prose and drops the other 33.

---

## 3. Factual errors and omissions

Ordered by how badly they will hurt a reader.

### 3.1 The inspector has three tabs; the manual documents one — **high**

`InspectorPanel.tsx:20-24`:

```ts
const TABS = [
    { value: "node", label: "Node" },
    { value: "quest", label: "Quest" },
    { value: "mod", label: "Mod" },
] as const;
```

and line 30 defaults to `"quest"`. The manual's §03 Inspector paragraph says
only "Select a node and its fields appear in the panel on the right." It never
mentions the tabs, never mentions that the panel opens on **Quest**, and never
tells the reader that two-thirds of the inspector exists.

**Quest tab — five sections, ~15 controls, all undocumented**
(`InspectorPanel.tsx:188-341`): Identity (Quest identifier, Display title,
Description, Journal group → Sandbox / Side quest / Storyline), Rewards (Money,
XP), **Behaviour** (Start automatically, Complete automatically, Player can
abandon, Show a manual complete button, Tidy the objective list when the story
ends, Closing line), Employer (First name, Last name, E-mail), and **Health**
(objective count, plus a live "N objectives have no trigger wired in, so the
player can never complete them" warning at line 328-340 — another reader-facing
message that appears nowhere in the manual).

**Mod tab — three sections, ~11 controls, all undocumented**
(`InspectorPanel.tsx:372-433`): Identity (Mod id, Display name, Version, Author,
Description), Permissions (read-only, derived at export), Workshop (Cover image,
Icon, Tags).

### 3.2 The manual's headline caveat points at a control it never documents — **high**

The manual repeats, twice, that "with auto-complete off and no Complete button
(the default) that never happens". Those are the **Complete automatically** and
**Show a manual complete button** toggles in **Quest → Behaviour**. The manual
never names them and never says where Behaviour is. The analysis layer's own
`nextStep` sends the reader there by name — `graph.ts:167`: *"or turn completion
on in the quest's Behaviour settings if you mean it."* The reader gets told
about a switch and never told where the switch is.

### 3.3 `Templates` is missing from the top-bar table — **medium**

`TopBar.tsx:210-213` renders a real **Templates** button. The manual's §03
button table lists 12 rows and skips it — even though §02 tells the reader to
"open the Templates gallery". It is the single most useful button for a
beginner and it is absent from the table of buttons.

### 3.4 `Create Wi-Fi` cannot be created at all — **high, escalated on re-check**

First pass I called this "listed as a palette node with no note". That
understated it. `registry.ts:1204`:

```ts
export const PALETTE_HIDDEN_TYPES: ReadonlySet<NodeType> = new Set(["world.wifi"]);
```

and `paletteGroups()` (line 1207) filters it out. I then checked every other
route to the node:

- **Node search** — `nodeSearch.ts:26` returns `paletteGroups().flatMap(...)`,
  so it inherits the same filter. Shift+A will not find it.
- **Templates** — `grep -rln "world.wifi" src/templates/` matches only
  `reference.ts` and `exploitable.test.ts`, and in `reference.ts:57-60` the
  example is commented out with the note *"hidden from the palette … re-add the
  example here and drop it from PALETTE_HIDDEN_TYPES once the SDK ships one."*
- **No other add path** — `addNode` (`store/editor.ts:361`) is only called from
  the palette and the search popover.

**There is no way for a reader to create a Create Wi-Fi node in this build.**
The manual documents a node with **19 editable fields** — the most of any node
in the registry — that is unobtainable. The caveat note explains the SDK limit;
it does not explain that the node cannot be reached.

Consequence for the rewrite, **decided by Zeis**: the node gets **no page**.
It is a commented-out feature for a reason, and documenting an unobtainable
node is worse than not mentioning it. It is recorded instead in the "what this
editor can't do (yet)" appendix — one honest entry naming the node, saying the
SDK has no wireless API in 0.21.0, and saying that a project saved before the
node was hidden can still contain one.

That makes the coverage gate need an **explicit exclusion list** rather than a
bare "every registry type has a page" rule, so the omission stays a decision on
the record instead of a gap someone re-discovers. `world.wifi` is its only
member today.

### 3.5 The palette grows groups the manual says don't exist — **medium**

§03 says cards are "grouped by the ten categories". `NodePalette.tsx:79-92` adds
one **`Editor Mods · <pack>`** group per loaded pack that ships nodes. Load an
addon and the palette has more than ten groups. The manual's own node table
says "find it under Editor Mods" without ever saying the palette grows.

### 3.6 Three levels of warning, not two — **medium**

§03 Status says the editor surfaces "warnings … and errors". `compile.ts` uses
`level: "warn" | "error" | "info"` — 7 warn, 7 error, **5 info** sites by count.
The `info` level is real reader-facing copy (e.g. `compile.ts:522`, Kisscord
uploads compiling to an "[uploaded file …]" message). A reader who sees a third
style of message will not find it in the manual.

### 3.7 Export omits the two conditional zip entries — **low**

`compile.ts:819-820` appends `iconAsset` and `coverAsset`, written to
`assets/<name>.{png,jpg}` (`compile.ts:147`). Set a Cover image or an Icon in
the Mod tab and the zip has 10 files, not 8.

### 3.8 The templates table throws away ground truth — **low, but free to fix**

Seven of thirteen rows read "A worked example quest." Meanwhile
`templates/index.ts` carries a real `description` and a `difficulty` for every
one, and `nodeCount` for each is enforced by `templates.test.ts:120`. The manual
is *less* informative than the code it documents.

### 3.9 Feature surfaces absent entirely — **medium**

| Surface | Evidence | In manual |
|---|---|---|
| Inspector drawer — float, dock, drag-to-resize | `drawerLayout.ts`, `FloatingInspector.tsx`, `InspectorDockHandle.tsx` (r158–r160) | "float"/"dock"/"drawer": **0 hits** |
| Canvas minimap | `App.tsx` layout comment; `QuestCanvas.tsx` | **0 hits** |
| Debug panel | `canvas/DebugPanel.tsx` | named once in a list, never explained |
| Arrange tools (Tidy up, Row, Column, Even across, Even down, Free) | `QuestCanvas.tsx` | one clause, no procedure |
| Permissions | `compile.ts:170-217`, `InspectorPanel.tsx:403-409` | **0 hits** |

### 3.10 A thing the manual gets right by luck

`edges.ts:10` declares **four** kinds — `["flow", "condition", "unlock", "data"]`
— and `edges.ts:41` styles the fourth. The manual's socket table lists three.
That is correct for the reader: `grep 'kind: "data"' src/schema/registry.ts`
returns nothing, so no node exposes a data socket today. But it is correct by
accident, not by check. If a node ever grows one, the manual silently goes
wrong. The coverage gate should assert this explicitly.

---

## 4. Why the current shape cannot hold

None of this is a copy-editing problem. A 756-line single file with 0 JS cannot
carry 33 node pages, 120 field entries and 35 message entries — that is roughly
40,000+ words with a search box, and search is the single feature that makes a
message index usable ("paste the warning, land on the fix").

So the fix is structural, and the structural decision (one file vs. a small set
of linked static pages under `public/manual/`) is a Phase 3 question that needs
sign-off before any mass authoring. Delivery constraints confirmed today:

- `manual.html` is a **static asset with no inbound link**. `grep -rn
  "manual.html" src/` returns nothing — no code in `src/**` references it. It
  ships to `dist/manual.html` because Vite copies `public/` verbatim (per
  `docs/HANDOFF.md`), but a reader inside the editor has no way to reach it.
  That is a product recommendation, not a docs bug.
- Nothing in the app depends on its current filename, path or internal anchors,
  so restructuring is low-risk — but §H12 still wants that confirmed before the
  move, and it now is.

---

## 5. Advocacy list (product surface — not applied, per S6)

Prioritised by reader pain. None of this was changed; all of it is a proposal.

| # | Pain | Evidence | Proposal |
|---|---|---|---|
| **P1** | The manual is unreachable from the editor | `grep -rn "manual.html" src/` → no hits | A **Help** entry in the top bar that opens the manual. Cheapest high-value docs feature in the app. |
| **P2** | Help lives in two places that will drift | `graph.ts` writes `nextStep` copy for non-coders; the manual paraphrases it | Deep-link field/issue help to manual anchors (H8) instead of restating it. One source of truth. |
| **P3** | A reader is told about a switch and not where it is | §3.2 above | If P1/P2 land, this resolves itself. Short of that, the Behaviour toggles' hints could name their own location. |
| **P4** | `Create Wi-Fi` is registered, categorised, warned about — and unobtainable | `registry.ts:1204` | Either surface it in the palette with a "not available in this SDK build" state, or the docs must say it plainly. Today neither happens. |
| **P5** | Third warning level is invisible in the docs' mental model | `compile.ts` `info` ×5 | Either fold `info` into the reader-facing vocabulary deliberately, or the manual documents three tiers. |
| **P6** | The templates gallery has better copy than the manual | `templates/index.ts` descriptions vs manual's "A worked example quest." | Surface `description`/`difficulty`/`nodeCount` in the Templates dialog if not already, and let the manual inherit it. |

---

## 6. What I could not verify, and why

Stated plainly rather than papered over.

- **No browser tools in this session.** My toolset has no page-open, click or
  screenshot capability. That means **GT2 (the running editor, seen on screen)
  is not available to me**, and so:
  - IMG1–IMG8 (screenshots captured from the live app) **cannot be executed by
    me**. Every screenshot in the eventual manual needs either browser tooling
    in a later session or Zeis's hands.
  - TU7 (running the tutorial end-to-end in the browser) **cannot be executed
    by me** either.
  - Every "exact UI string" in this audit was verified by **reading the React
    source**, which is authoritative for the literal text but is not the same
    as having seen the rendered label. I have marked nothing as seen-on-screen.
- **Not verified:** whether an exported `.zip` actually loads and plays in
  HackHub 1.1.2. Nothing in this repo can prove that; it needs Zeis in-game.
- **The exact count of 35 messages is a floor.** It counts emit sites by
  pattern match. Several are ternary chains that branch into more than one
  distinct string (e.g. `graph.ts:118` produces three different `detail` texts
  depending on node type). The Phase 1 extractor will produce the real
  enumerated list by *running* the analysis and compiler over all 13 templates,
  not by grepping.

---

## 7. Recommended next step

Phase 1 — the machine-checkable inventory (`docs/manual/inventory.md` +
a `scripts/` extractor that reads the registry, so it cannot miscount), plus the
coverage gate landed **failing**, so the gap above becomes a red build instead
of a document. Then the structural decision in §4 gets put to Zeis before any
prose is written.

Nothing in `src/**` was modified in this audit. No product copy was changed.
