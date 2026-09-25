# r228 — Website caret fix + Group node touch-up (Ctrl+G, stable group drag)

**Status: done (2026-09-25) — gates green, 1,826 tests / 91 files; see Handoff r228.**
Two items from Zeis:

1. In the WYSIWYG website editor, clicking into a text field and typing loses the
   caret after every keystroke — "as if it finishes the editing process after
   every single keystroke".
2. The Group node needs a touch-up: (a) Ctrl+G to group / ungroup the
   highlighted nodes; (b) moving a group, its bounding edge pushes other nodes
   away — Zeis's expectation: while dragging, the group behaves as if
   temporarily on layer 1 over the base canvas (layer 0). Also observed when
   dragging an empty group onto the canvas and extending its edges around a
   node.

Zeis's rulings (2026-09-25), all incorporated below:

- **Groups nest — "I see groups the same way I see folders."** Grouping a
  selection that contains an existing frame creates a new frame that carries
  the existing frame *plus* the rest of the selection (Group B carries Group A
  + the extra node).
- **Ungroup deletes only the highlighted frame.** Nested and parent frames are
  left alone.
- **32px padding: approved.**
- **Freeze-at-drag-start: approved.**
- **Correction from Zeis, verified in code:** group frames *do* carry into the
  finished mod — their titles and descriptions are emitted as code comments
  (`planningComments` in `compile.ts`, pinned by `furniture.test.ts`). The
  frame is stripped from the *runtime graph* only. This round changes no
  compiler code; the comment block stays flat (one line per group).

---

## Part 1 — the website visual editor reloads on every keystroke

### Diagnosis (checked, not guessed)

`VisualPageEditor` (`src/editor/websites/pageEditor.tsx`) renders the page's own
document in an iframe with the body made `contentEditable`:

```
const parts = useMemo(() => splitDocument(doc), []);          // fixed at mount — correct
const editingDoc = useMemo(() => { …CSP logic… }, [doc, parts]); // ← depends on `doc`
…
<iframe srcDoc={editingDoc} onLoad={onLoad} … />
```

Typing inside the iframe fires `input` → `emit()` →
`onChange(joinDocument(parts, body.innerHTML))` → the store's `page.content` →
the parent re-renders with a new `doc` prop → `editingDoc` recomputes to a
different string → React re-sets the iframe's `srcdoc` attribute. Per the HTML
spec, setting `srcdoc` on an already-loaded iframe navigates the browsing
context to a fresh srcdoc document: the document is destroyed and re-parsed,
so the `contentEditable` focus and the caret die. The `onLoad` handler re-arms
the field, which is why clicking again always works. **Every keystroke
repeats the cycle.**

The comment above `parts` states the intended contract — *"Fixed at mount: the
parent remounts us (key) whenever content changes from outside, so the caret
never resets mid-typing"* — but `editingDoc`'s dependency on `doc` breaks it
for the editor's own echo: the keystroke is an "outside" change by the time it
flows back through the `doc` prop.

**Verified in jsdom (probe, this round):** mounted `VisualPageEditor` with a
controlled parent holding `<p>hello</p>`; dispatched `input` on the iframe's
body (jsdom's iframe body is empty, but `emit()`'s mechanics are identical).
The `srcdoc` attribute was rewritten from the fragment to the re-joined
wrapped document — `CHANGED: true`. jsdom does not itself re-navigate on
`srcdoc` mutation, so the probe proves the attribute change, which is the
exact mechanism a real browser turns into a navigation.

### Fix (smallest correct diff, ~15 lines in `pageEditor.tsx`)

- Extract the CSP logic into a small pure helper `editingSource(doc, parts)`.
- `srcDoc` becomes state, initialised once from the mount-time doc. The
  iframe's `srcdoc` now only changes when we deliberately set it.
- A `lastEmitted` ref records the exact document string `emit()` produced.
  `emit()` sets it before calling `onChange`, so when the parent round-trips
  the string back as the `doc` prop, an effect on `[doc]` sees
  `doc === lastEmitted.current` and leaves the iframe alone.
- When `doc` differs from what we emitted — an outside change that did not
  remount us (undo/redo is the one path the parent's
  `${page.id}:${outsideRev}` key does not cover; every builder-UI path —
  code view, templates, HTML import — already bumps `outsideRev`) — the
  effect sets `srcDoc` to `editingSource(doc, parts)` and the iframe
  reloads with the new content.
- The parent key is untouched. Comments updated to match the two mechanisms
  (C4 — the "Fixed at mount" comment currently describes only half of it).

### Tests (`websites.test.tsx`, "visual and code editors in isolation")

1. **Self-echo must not reload the frame.** Controlled harness; dispatch
   `input` on the iframe body; after the round-trip, assert the `srcdoc`
   attribute is byte-identical. **Falsified: the probe above showed the
   current code changes it.**
2. **An outside change must reload the frame.** Change the `doc` prop to a
   string the editor never emitted (undo simulation) → `srcdoc` updates.
   Fails if the sync effect is over-deleted.
3. Existing visual-editor tests stay green.

Visual claim jsdom cannot make: the caret actually persisting mid-typing in a
real browser — **Zeis's check** (click text, type a sentence without
re-clicking).

---

## Part 2a — Group frame drag: freeze membership at drag start

### Diagnosis

`onGroupAwareDrag` (`QuestCanvas.tsx`) re-derives membership **on every
pointermove**: every non-group node whose *centre* lies inside the frame
rectangle at that instant is moved by the frame's delta. Two consequences:

- A bystander node near the frame's edge is captured mid-drag the moment the
  moving rectangle sweeps over its centre and is dragged along with the
  group — the "bounding edge pushes other nodes away".
- Drop an empty frame (or extend its edges) so a node's centre sits inside,
  and the next title-bar drag takes that node too, whether or not the author
  ever meant to group it.

Zeis's layer-1 expectation: the group is a unit for the duration of the drag —
frame plus what was inside it **when the drag began** — and nothing else
moves.

### The nesting consequence for the drag rule

The current rule *excludes other frames* from a drag's members (a frame never
moves with a group). That exclusion dies with nesting: if Group B moves and
the nested Group A does not, A is left outside B. So the frozen member set is
**every node whose centre is inside the frame when the drag begins — nested
group frames included**. A nested frame can still be moved on its own (its
own title bar, its own frozen set) — the folder metaphor: move the sub-folder,
or move the parent and it comes along.

### Fix (new pure module, thin wiring)

New `src/editor/canvas/groupDrag.ts` (pure — follows the `wiring.ts` /
`arrange.ts` / `applyChanges.ts` convention):

```ts
export const GROUP_PAD = 32        // approved by Zeis; clears the ~28px title bar
export const FRAME_MIN_W = 160     // the resizer's minimums, from GraphNode
export const FRAME_MIN_H = 120
export interface GroupDrag { id: string; x: number; y: number; members: string[] }
export function frameRect(node, position): { x0, y0, x1, y1 }
export function beginGroupDrag(node, position, nodes, sizeOf): GroupDrag | null
export function stepGroupDrag(drag, nodes): Record<string, Position> | null
export function frameAround(nodes, sizeOf): { x, y, w, h }
```

- `beginGroupDrag`: for a frame, freezes every node (frames included) whose
  centre is inside the frame rect **now**. For other nodes: `null`.
- `stepGroupDrag`: applies the delta to the frozen member list only. The
  per-move containment loop disappears — the drag is a fixed delta over a
  fixed set (also cheaper per frame than today).
- `frameAround`: bounding box of the given nodes + `GROUP_PAD`, clamped to
  the resizer minimums, integer output.
- QuestCanvas' three `onNodeDrag*` handlers become thin wrappers; the
  `groupDrag` ref holds `GroupDrag | null` (same shape as today, plus the
  member list — no new state above the canvas).
- Size source: `measured[id] ?? nodeSize(doc, quest, twotterAccounts)` —
  computed, not measured (docs/06 rule); the old `240×120` fallback is
  dropped because `nodeSize` is always available.

### Drive-by fix, with a test: `nodeSize` misreads a frame's size

`nodeSize.ts`'s group branch reads `data.width` / `data.height` — keys the
schema has never stored (it stores `w` / `h`, see
`LayoutGroupNodeDataSchema` and GraphNode's resizer). So every real frame
sizes as the 360×240 default. The existing test pins the *wrong keys*
(`{ width: 500, height: 300 }`) — green suite, dead behaviour. The frame
centre test in `beginGroupDrag` needs the real size, and the align toolbar
(the function's only other caller) silently misaligns resized frames today.
Fix: read `w` / `h`; re-pin the test with the real keys.

### Tests

New `canvas/__tests__/groupDrag.test.ts` (pure):

1. `beginGroupDrag` freezes: frame covers A (centre inside); B overlaps the
   frame's edge but its centre is outside → members = `[A]`.
2. **A nested group frame is a member** (the nesting case).
3. **The reported bug, falsified:** a two-step drag where a bystander's
   centre enters the moving frame's rectangle mid-drag → bystander unmoved,
   the member moved. Reverting `stepGroupDrag` to per-step containment fails
   this test.
4. `frameAround`: encloses the selection with the pad; clamps to the
   minimums; integer output.

`nodeSize.test.ts`: the frame-size test re-pinned to `w` / `h` — red against
the current code, green after the fix.

jsdom note: a full title-bar drag cannot be driven through React Flow's
d3-drag in jsdom (probed this round — the position never moved), so the
handlers are thin one-line calls and the state machine carries the
assertions. Same arrangement as the existing `wiring` / `applyChanges`
tests.

---

## Part 2b — Ctrl+G: group / ungroup the selection

### Semantics (one key; the selection decides — folders, per Zeis)

- Selection has ≥1 non-group node → **group**: create a `layout.group` frame
  around **all selected nodes, frames included** (`frameAround`), via the
  existing `addNode("layout.group", pos, { w, h })` — which already
  auto-selects the new frame and is a single undo step. Group B thus carries
  Group A + the extra node.
- Selection has only group frames → **ungroup**: `removeNodes(frameIds)` —
  exactly the selected frames are deleted; nested and parent frames stay, and
  so do all contained nodes, in place. Selection cleared.
- Empty selection → info toast, "Select some nodes first." (no silent
  clicks).
- No-op while typing in a field — the same `isTypingTarget` guard as
  Delete/Ctrl+C; the helper is exported from `useKeyboardShortcuts.ts`
  (one word, DRY).

### Where

A small window-`keydown` `useEffect` in `QuestCanvas` (its own effect — the
existing one is dedicated to the Shift+A search). It needs `measured` +
`nodeSize` + the store, all canvas-level: the store may not import canvas
modules (AR1), and the App-level shortcut hook has no canvas state.

### Docs & tests

- `SHORTCUT_GROUPS` ("Select" group) gains the row:
  `Ctrl+G` → "Group the selection — press again on a frame to ungroup it".
  `shortcuts.test.tsx` asserts the documented row exists (its standing
  pattern).
- Canvas tests (App mounted, store-driven, keydown dispatched):
  1. Select two nodes → Ctrl+G → a `layout.group` exists enclosing both
     (rect contains both centres, with the pad) and is the selection.
  2. **Nested grouping (Zeis's example):** a frame with a node inside + one
     extra node, all selected → Ctrl+G → the new frame encloses the old
     frame *and* the extra node; the old frame still exists; selection is
     the new frame.
  3. **Ungroup deletes only the highlighted frame:** B ⊃ A ⊃ N; select A →
     Ctrl+G → A gone; B and N remain, N in place.
  4. Empty selection → Ctrl+G → the store's toast carries the hint.
  5. Ctrl+G while an input has focus → nothing happens.
  All falsified by reverting the handler.

---

## What deliberately does not change

- **No schema / registry / node-definition change.** Membership stays
  geometric (centre inside the rect); nesting is a property of the geometry,
  not new data. The frame's stored data (`label`, `comment`, `w`, `h`,
  `color`) is untouched.
- **No compiler change.** Frames are stripped from the runtime graph as
  today; `planningComments` keeps emitting one flat line per group
  (label + comment) into the shipped `dist/mod.js` — the author's code
  comments for a coder friend, per Zeis. Nesting does not change the block's
  shape (one line per group, node-array order).
- **Resize stays a pure visual box** (as today).
- **Dropping a frame over a node keeps today's documented behaviour**
  ("drag the frame and everything inside moves with it"). Ctrl+G is the
  new intentional path.

## Bookkeeping (standing rules)

- `EDITOR_BUILD` → `2026-09-25.r228` (the stamp is the version).
- `npm run gen:manual` (index-stamp gate G15) + `npm run gen:qa-export`
  (stamp-only regeneration — no emitted quest content changes).
- README: **Done recently** gains the r228 row; the r223 row moves to
  `docs/archive/` (beyond the 5th entry); build-status counts refreshed.
- `docs/HANDOFF.md`: new r228 section on top.
- Commit + push after implementation (sandbox resets).

## Gates

`npm run typecheck` 0 errors · `npm test` green (1,806 + new) · `npm run
build` clean. Every new test falsified by revert. Visual claims (caret
persistence, the group not shoving nodes, nesting drags, the frame's
padding look) are Zeis's eyes — jsdom cannot see them.
