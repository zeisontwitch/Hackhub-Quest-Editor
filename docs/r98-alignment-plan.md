# r98 plan — make alignment behave the way a design tool does

## Evidence

1. **A real bug: snapping silently undoes centring.** `arrange()` centres the
   cards, then, if Snapping is on, snaps each top-left corner to the 22px grid.
   Worked example with the screenshot's real card heights (62 and 78), centred
   on y=100:

       shell    aligned y=69 -> snapped 66 -> centre 97
       dialogue aligned y=61 -> snapped 66 -> centre 105

   The centres end up 8px apart. The taller the height difference, the worse.
   So r97's fix is destroyed whenever the Snapping toggle is on — and the
   symptom is exactly "it moved them, but they're still not in a line".

2. **Photoshop's reference point.** Adobe/Photoshop docs (photoshopessentials,
   tutsplus): "Align Vertical Centers — aligns the vertical center pixel on
   each layer to the selected layers' vertical center", and Distribute leaves
   the outermost layers fixed and moves only those between. So the target is
   the **bounding box centre of the selection**, not the mean of the individual
   centres. For the screenshot's three cards the two differ by only ~1px, so
   this is correctness, not the reported symptom.

3. **Distribute is measured edge-to-edge, not corner-to-corner.** Photoshop
   offers "Distribute Horizontally" (equal *gaps* between items) separately
   from "Distribute Horizontal Centers" (equal centre spacing). Ours spaces
   corners, which leaves visibly uneven gaps between cards of differing widths.
   Equal gaps is what "Even" implies to a user.

## Changes

1. **Snapping must not break alignment.** Snap the shared centre line once,
   then place each card against that line. Never snap each corner
   independently after aligning. (Grid snapping while *dragging* is untouched.)
2. **Align to the bounding-box centre** of the selection, matching Photoshop.
3. **Distribute by equal gaps**, using measured widths/heights, outermost nodes
   fixed — again matching Photoshop's "Distribute Horizontally".

## Verification

- Unit tests for each, including the exact screenshot geometry.
- A test that alignment holds *with snapping on* — the bug above.
- Falsify each by reverting it and confirming the matching test fails.
- Re-run the full suite and the canvas performance guards.
