# r160 (plan): The Inspector edge becomes a real drawer pull

## Why this round

r159 gave the docked inspector a left-edge grab handle. The user tried it and
annotated a screenshot with the shape they actually wanted: a protruding
drawer-pull tab, and — the substantive part — the handle should behave like a
drawer. Pulling it should first **widen the docked panel**; only when you pull
*past* an (invisible) threshold does it tear off the wall into a floating
drawer. They also want the canvas minimap to sit beside the panel and follow it
while docked, snapping back to base when the panel floats.

Two of those three are real code; the third is already true once the first
lands.

## What changes

### 1. `drawerLayout.ts` — a persisted docked width

The docked width was a hardcoded `w-[340px]` Tailwind class. It becomes a
per-author preference in the same module + `useSyncExternalStore` +
localStorage shape as the float rect (it is an editor preference, not part of
the mod — never exported, never in undo).

- `DOCKED_WIDTH` (340) stays the shipped default **and the floor**; new
  `MAX_DOCKED_WIDTH` (640) is the ceiling and the tear-off threshold.
- `inspectorDockedWidth()` / `setInspectorDockedWidth(w)` / `clampDockedWidth(w)`
  — getter, clamped+persisted+notifying setter (idempotent: same value fires
  nothing), and the exported clamp. `resetInspectorLayout()` (and the test seam)
  reset it to `DOCKED_WIDTH`.

### 2. `InspectorDockHandle.tsx` — drawer-pull behaviour + protruding tab

- **Drag left** → widen the docked panel (`start.width + (start.x − clientX)`),
  clamped to the ceiling.
- **Cross the ceiling** → `floatInspector()` and follow the cursor, offset onto
  the drawer's own title bar so the gesture continues seamlessly.
- **Click** (never crossed the drag threshold) → float in place. Keyboard path
  too — it stays a real focusable `<button>`.
- The grip becomes a protruding rounded tab centred on the edge (the shape the
  user drew), still quiet until hovered. Cursor is `ew-resize`.
- Window-bound move/up listeners as before: the docked aside — and this handle —
  unmounts the instant it floats, so a handle-bound listener would die
  mid-gesture.

### 3. `App.tsx` — apply the dynamic width

The expanded docked `<aside>` reads `inspectorDockedWidth()` via
`useSyncExternalStore` and applies it as an inline `width`. The width
transition is dropped while expanded so a dragged resize tracks the cursor
frame-for-frame; the collapse toggle keeps its slide.

### 4. Minimap — no code (YAGNI)

The `<MiniMap position="bottom-right">` lives inside `<main className="flex-1">`,
a flex sibling of the docked `<aside>`. When the panel widens, `main` shrinks
and the minimap slides left with it; when the panel floats, the aside is gone,
`main` is full-width, and the minimap returns to the true bottom-right. "Follows
while docked, returns to base when floated" is already the behaviour the moment
the docked width is dynamic — so this round adds nothing to the canvas.

## Tests

- `drawerLayout.test.ts` (+5): ships at default width; widens within bounds
  (persist + notify); clamps below floor / above ceiling / NaN; idempotent
  no-op; reset restores the default width.
- `floatingInspector.test.tsx`: the old drag case is split — a **short pull**
  widens the docked panel and does **not** float (mode stays docked, width
  grows by the pulled delta); a **long pull past the ceiling** floats and moves
  to the pointer. Pixel-exact maths stay on the pure module (jsdom has no
  layout).

## What does NOT change

- Float/dock semantics, the floating drawer, the compiler, export, the project
  document. A fresh author still sees the 340px docked panel.

## Gates

- `npm run typecheck` — 0 errors.
- `npm test` — 1,475 tests / 75 files (+5).
- `npm run build` — succeeds.

## Stamp

`2026-09-14.r160`.

## Roadmap

Closes the r158/r159 inspector-affordance thread. Remaining Next-up, in order:
1 auto-generate dice button for name/IP fields, then the two templates last
(2 contact-driven, 3 branching consequence).
