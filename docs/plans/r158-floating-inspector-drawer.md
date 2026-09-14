# r158 (plan): Freely draggable + resizable Inspector drawer

## Why this round

Next-up #1 (queued since r151): the inspector is fixed-docked to the right
edge. On a wide graph the author often wants it out of the way, or over the
part of the canvas they're wiring. This round lets them pop it out into a
free-floating drawer they can drag around and resize, and snap it back.

## What changes

### 1. `src/editor/inspector/drawerLayout.ts` (new) — the layout preference

A pure preference module in the exact shape of `snapGrid`/`wireMotion` (AR20
externalized tunable, AR10 store access stays in React): module-level state, a
`useSyncExternalStore` subscription, a localStorage write. It is **not** in the
project document — the panel's position is a per-author editor preference, not
part of the mod, so it must not export or land in undo (docs/01 §4.2).

- `mode`: `"docked" | "floating"`, default **docked** — an author who never
  touches this sees the same fixed-right inspector as before.
- `rect`: the floating drawer's `{ x, y, width, height }` in CSS pixels.
- `clampRect(rect)`: the load-bearing invariant — clamps size to
  `[MIN,MAX]` and keeps the whole panel on screen so the title bar (the only
  drag handle) can never be dragged off an edge and lost. Every read, move and
  resize goes through it.
- `floatInspector()` / `dockInspector()` / `setInspectorFloatRect(partial)` /
  `resetInspectorLayout()` — the writers, each persisting and notifying.

### 2. `src/editor/inspector/FloatingInspector.tsx` (new) — the drawer frame

A `fixed`-positioned panel that renders the **same** `<InspectorPanel />` the
docked aside renders (AR6/A3: one inspector, two frames — no duplicated
fields). Drag the title bar to move; drag the bottom-right grip to resize. Both
are pointer-driven; pointer capture is used when available and guarded so its
absence (jsdom) never throws (F4 guard clause). Title bar carries a **Dock**
button.

### 3. `src/App.tsx` — mount the right frame for the mode

- Reads `inspectorMode()` via `useSyncExternalStore`.
- **Docked** (default): the existing `<aside>` renders unchanged, now with a
  **Float** button (maximize icon) beside the existing collapse button.
- **Floating**: the aside is not rendered (canvas takes full width) and
  `<FloatingInspector />` draws over the shell.

### 4. `src/editor/settings/reset.ts` — reset covers the new preference

"Reset all editor preferences" calls `resetInspectorLayout()`, so the module
stays the single writer of its own state (the existing convention — nothing in
reset.ts pokes storage directly).

## Tests

- `drawerLayout.test.ts` (12): mode transitions + idempotence + persistence +
  subscriber notification; `clampRect` at every edge (top-left pin, far-edge
  containment, size bounds, NaN fallback); partial move clamped + persisted;
  reset. **Falsified by revert:** neutering `clampRect` fails 5 of them.
- `floatingInspector.test.tsx` (3): the Float control pops it out, the drawer
  carries the same single Inspector region and a resize handle, Dock snaps it
  back. The drag/resize *pixels* aren't asserted here — jsdom has no layout, so
  that logic is tested on the pure module, per the project's "jsdom will lie
  about anything visual" rule (docs/06 §4).

## What does NOT change

- Docked mode is byte-for-byte the previous behaviour; it stays the shipped
  default, so no existing screenshot or test of the docked inspector changes
  (the app smoke test still finds exactly one `complementary` "Inspector").
- Nothing about the compiler, export, or project document — this is
  editor-only. The stamp still bumps (`EDITOR_BUILD`), since the editor
  changed, per the version-number rule.

## Gates

- `npm run typecheck` — 0 errors.
- `npm test` — 1,469 tests / 75 files green (+15 in 2 new files).
- `npm run build` — succeeds.

## Stamp

`2026-09-14.r158`.

## Roadmap

Retires Next-up #1. Remaining, in order: 1 auto-generate fields, then the two
templates last (2 contact-driven, 3 branching consequence).
