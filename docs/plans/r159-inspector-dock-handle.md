# r159 (plan): A discoverable grab handle for floating the Inspector

## Why this round

r158 shipped the float/dock drawer behind a small dim "maximize" icon button in
the inspector's top-right corner. The user loaded that build and could not find
any way to pull the inspector out or push it back — they reached for a "handle
to pull" on the panel edge that did not exist. The feature worked; its
affordance did not. This is a usability defect against the very round that
shipped it: a control nobody can find is not a control (docs/06 §UI —
affordances must read as what they do).

## What changes

### 1. `src/editor/inspector/InspectorDockHandle.tsx` (new) — the edge grab handle

A full-height grip on the **docked** inspector's left border — the edge an
author instinctively pulls to detach the panel from the wall.

- **Click** it → float the inspector where it last was.
- **Drag** it past `DRAG_THRESHOLD` (6px) → float and carry the panel under the
  cursor, offset by `GRAB_OFFSET_X`/`GRAB_OFFSET_Y` so the pointer lands on the
  drawer's own title-bar drag zone and the gesture continues seamlessly.

The move/up listeners bind to `window`, **not** the handle, because the docked
aside (and this handle with it) unmounts the instant the panel floats — a
handle-bound listener would die mid-gesture. The threshold keeps a plain click
from teleporting the panel to the pointer. It is a real `<button>`, so it is
keyboard-focusable and click-activatable for free (a11y).

### 2. `src/App.tsx` — mount the handle, retire the redundant icon button

- `<InspectorDockHandle />` renders inside the docked `<aside>` (expanded state).
- The r158 top-right **Float** icon button is removed: with a clear edge handle
  it was a second, weaker way to do the same thing sitting in a cramped control
  cluster (KISS / one obvious way). The collapse (`panelRight`) button stays.
- `floatInspector` is no longer imported by App (the handle owns that call now).

## Tests

- `floatingInspector.test.tsx` gains a **drag-to-float** case: pointerdown on the
  handle, a window pointermove well past the threshold, pointerup → mode flips to
  `floating` and `inspectorFloatRect()` has moved toward the pointer (clamped on
  screen). The existing click-to-float / dock-again / single-region cases still
  pass because the handle carries the same `aria-label="Float inspector"` the old
  button did. Pixel-exact drag maths stay on the pure `drawerLayout` module —
  jsdom has no layout (docs/06 §4).

## What does NOT change

- `drawerLayout.ts`, `FloatingInspector.tsx`, docked-vs-floating semantics, the
  compiler, export, or the project document — this is an affordance fix only.
- Docked mode still renders exactly one `complementary` "Inspector" region.

## Gates

- `npm run typecheck` — 0 errors.
- `npm test` — green (+1 case in floatingInspector.test.tsx).
- `npm run build` — succeeds.

## Stamp

`2026-09-14.r159` (editor changed → stamp bumps, per the version-number rule).

## Roadmap

Closes the r158 usability gap. Remaining Next-up, in order: 1 auto-generate
dice button for name/IP fields, then the two templates last (2 contact-driven,
3 branching consequence).
