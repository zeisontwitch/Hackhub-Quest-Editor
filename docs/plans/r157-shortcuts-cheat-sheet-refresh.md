# r157 (plan): Refresh the Shortcuts cheat sheet

## Why this round

Next-up #2 (queued since r151): the Shortcuts sheet was stale. It listed a
flat 12 rows and had drifted well behind the editor's real gesture set —
several shipped interactions were missing entirely, and the layout put
keypresses and mouse gestures into the same undifferentiated key caps.

Missing from the old sheet (all verified present in the code):

- **Shift+A** over the canvas — opens node search at the pointer
  (`QuestCanvas.tsx`, the Blender-style add).
- **Right-click the canvas** — opens node search here (`onPaneContextMenu` +
  the right-click/drag discriminator).
- **Drag a wire onto empty canvas** — offers to create a node the wire fits.
- **Double-click a wire** — inserts a reroute point (`onEdgeDoubleClick`).
- **Box select** (drag on empty canvas; Shift/Ctrl to add/remove) —
  `selectionOnDrag` + `SelectionMode.Partial`.
- **Ctrl+Y** — redo (the hook handles it; the sheet only showed Ctrl+Shift+Z).
- **Pan** (middle-drag / right-drag) and **scroll to zoom** — `panOnDrag={[1,2]}`,
  default `zoomOnScroll`.
- **Drag a frame's title bar** to move a group and its contents.

## What changes

`src/editor/shell/Overlays.tsx`:

- Replace the flat `SHORTCUTS` array with `SHORTCUT_GROUPS` (exported), grouped
  by the job the author is doing: **Editing**, **Add nodes**, **Select**,
  **Wiring**, **Move around**.
- A row is `{ keys?, gesture?, action }`. `keys` render as key caps (`.kbd`);
  `gesture` renders as plain italic text — so "drag from palette" reads as a
  mouse action, not a key you can't find on your keyboard (the old sheet put
  "drag from palette" inside a key cap). (B1 intention-revealing, A1 clarity.)
- Extract a small `ShortcutRow` component (F1 one job); the dialog gets a
  `subtitle` ("Keys work anywhere; gestures are on the canvas.") and a group
  heading per section. Title becomes **"Shortcuts & gestures"**; the top-bar
  button label ("Shortcuts") is unchanged and still fits.

Every row was audited against the code that implements it — the keys against
`hooks/useKeyboardShortcuts.ts`, the pointer gestures against `QuestCanvas.tsx`
/ `NodePalette.tsx`, navigation against the React Flow config
(`panOnDrag`/`zoomOnScroll`/`selectionOnDrag`). Nothing was listed on memory.

## Tests

New `src/editor/shell/__tests__/shortcuts.test.tsx` (8 tests):

- **Data hygiene:** every row has an action and at least one of keys/gesture;
  row keys are unique within a group (the React-key collision guard).
- **The honesty guard — the point of the round:** the documented keyboard
  shortcuts are driven as real `keydown` events through the *actual*
  `useKeyboardShortcuts` hook and asserted to change the store (Ctrl+D
  duplicates, Delete removes, Ctrl+Z / Ctrl+Shift+Z undo+redo, Esc clears),
  plus a check that no Ctrl-row in the Editing group names a key the hook
  doesn't branch on. A stale sheet fails this — **verified by reverting**: a
  bogus `Ctrl+Q` row makes the suite red.
- **Rendering:** the dialog renders every group heading and every action.

jsdom can't exercise the pointer gestures (no layout/compositor); those remain
covered by the canvas gesture tests. The sheet's gesture rows are only
data-checked here — an honest boundary, not fake coverage (docs/06 §4).

## What does NOT change

- No behaviour change to any shortcut or gesture — this documents what already
  exists.
- `useKeyboardShortcuts.ts`, `QuestCanvas.tsx` untouched.
- The top-bar button and its `modal: "shortcuts"` wiring unchanged.

## Gates

- `npm run typecheck` — 0 errors.
- `npm test` — 1,454 tests / 73 files green (+8 new in 1 new file).
- `npm run build` — succeeds.

## Stamp

`2026-09-14.r157`.

## Roadmap

Retires Next-up #2. Remaining Next-up, in order: 1 draggable inspector,
2 auto-generate fields, then the two templates last (3 contact-driven,
4 branching consequence) — moved to the end per Zeis's instruction.
