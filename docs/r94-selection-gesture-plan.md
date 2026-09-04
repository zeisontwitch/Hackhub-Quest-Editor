# r94 plan — Shift+Drag and Ctrl+Drag

## Evidence gathered (not assumptions)

1. **Instrumented the real handler.** Spying on resolveSelection during a
   shift+box-drag on the mounted canvas printed:

       nodes box=false additive=true changes=[["<a>",false]]   <- the reset
       nodes box=true  additive=true changes=[["<b>",true]]    <- the picks

   The clear arrives with `box=false`. Confirmed in the source: Pane's
   onPointerMove calls `resetSelectedElements()` on line 1602 and
   `onSelectionStart?.()` on line 1603 - our boxSelecting flag is set one line
   too late. Our guard is `additive && tidyUp && boxSelecting`, so the clear
   slips past and wipes the earlier selection. THIS IS THE SHIFT+DRAG BUG.

2. **React Flow cannot deselect via a box.** commitUserSelectionRect builds
   `selectedNodeIds` from getNodesInside and only ever emits selected:true for
   them (line 1536-1552). There is no modifier branch anywhere in that path.
   So ctrl+drag-to-deselect DOES NOT EXIST upstream - it is not misconfigured,
   it is absent, and we have to implement it.

3. **jsdom cannot reproduce either fault** on its own: a plain shift+drag probe
   passed while the browser failed, because both nodes fell inside the box so
   the wrongly-applied reset was immediately overwritten. Only the instrumented
   probe exposed the ordering. Tests must assert the CALL SEQUENCE, not just
   the end state.

## Changes

1. `resolveSelection`: for a clear-only batch, gate on `additive` alone and
   drop the `boxSelecting` condition. Rationale: with a modifier held, a
   clear-only batch is never something the user asked for - it is either the
   drag-start reset (box open) or React Flow tidying up (box not yet open, the
   case above). Ctrl+click-to-deselect is unaffected because that batch is
   applied through a different route (handleNodeClick -> unselectNodesAndEdges),
   which r93's mounted test already covers and which must stay green.

2. Ctrl+drag to deselect: implement ourselves. Record the selection at
   onSelectionStart; while a box is open with ctrl/meta held, subtract the
   boxed ids from that snapshot rather than adding them.

## Verification

- Re-run the r93 gesture suite unchanged - all five must still pass.
- New tests asserting the CALL SEQUENCE for shift+drag (reset must not clear).
- New test for ctrl+drag subtracting.
- Falsification: revert each guard, confirm the matching test fails.
- Hand-check in the live preview; ask Zeis to confirm.

## REVISED after two more findings

4. **My planned change 1 would have broken ctrl+click.** Probed it: a ctrl+click
   deselect reaches resolveSelection as
   `nodes box=false additive=true changes=[[id,false]]` - byte-identical to the
   shift+drag reset. Gating on `additive` alone cannot tell them apart. Plan
   change 1 is WITHDRAWN.

5. **Why jsdom never reproduced any of this:** it implements neither
   `PointerEvent` nor `setPointerCapture` (verified directly). In a real browser
   React Flow calls `setPointerCapture` on pointerdown, which RETARGETS every
   later pointer event to the captured element - so a capture-phase listener on
   our wrapper sees the pointerdown but NOT the moves. Our `modifierHeld` is set
   once on pointerdown and never refreshed, and `additive` is consulted when the
   changes arrive, by which time the flag may be stale. jsdom, lacking capture,
   delivers everything to the wrapper and always looks correct.

## FINAL approach

Stop inferring intent from change batches. Track the gesture explicitly:

- Listen for pointerdown/move/up on `window` (capture) - unaffected by
  setPointerCapture retargeting - and keep `modifierHeld` live from the real
  `shiftKey`/`ctrlKey`/`metaKey` on every event.
- `onSelectionStart`: snapshot the selection and the modifier.
- While a box is open, compute the result OURSELVES from that snapshot:
  - shift  -> snapshot UNION boxed
  - ctrl   -> snapshot MINUS boxed   (React Flow cannot do this at all)
  - none   -> boxed
  and ignore React Flow's own node-selection batches for the duration.
- Leaves ctrl+click, plain click and plain drag on their existing, working
  paths - all covered by r93's mounted gesture tests, which must stay green.
