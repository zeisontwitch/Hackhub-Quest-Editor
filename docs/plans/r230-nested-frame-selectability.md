# r230 — Nested group frames must be selectable (frame paint order)

**Status: done (2026-09-25) — approved by Zeis ("go"), gates green, 1,837
tests / 91 files; see Handoff r230. Note: Zeis relaxed the plan-first rule
for small in-place fixes — those now ship without an approval round.**

Bug from Zeis: "I cannot select a nested group frame, only the parent group
frame."

## Diagnosis (verified in code)

- Every frame renders with `zIndex: -1` (QuestCanvas' `nodes` memo) — all
  frames share one stacking level, so **DOM/array order decides which
  frame paints on top** (later = on top).
- The memo's sort is stable: frames before cards (the minimap test pins
  that), but **among frames the original creation order is kept**.
- A nested frame is always created *before* its parent — the parent is
  what wraps it. So the parent sits later in the DOM, and its full-size
  body (the dashed box with its 30% surface fill) paints **over the
  child's title bar**. Every click inside the parent's box hits the
  parent; the child's grip is unreachable. Exactly the reported symptom.

## Fix — one comparator in QuestCanvas' `nodes` memo

Among frames, sort by **area descending** (largest first = deepest in the
paint order):

- A nested child is *strictly smaller* than the parent that contains it
  (it has to fit inside the parent's content area), so a child always
  paints above its parent — at any nesting depth.
- Sibling frames don't overlap; if the author overlaps two frames by
  hand, the smaller one sits on top — a sensible, consistent rule.
- Frame-vs-card order is untouched (the minimap "frames first" test keeps
  passing).

## Test (canvasNodes.test.tsx)

- Mirror the real workflow: create the inner frame, then the outer frame
  around it, render, and assert the outer frame's `.react-flow__node`
  wrapper precedes the inner one in the DOM (paint order = selectability).
- A reverse-creation-order case (outer first, inner second) pins that
  *size* — not creation order — decides.

## Falsify by revert

Restore the creation-order sort → the inner-first case goes red.

## Gates and bookkeeping

typecheck, full test, build; stamp `2026-09-25.r230`; README row + archive
r225; HANDOFF. No schema/node/compiler change.
