# r99 plan — Row/Column must actually use the cards' real sizes

## The proven defect

A probe on the mounted canvas logged exactly what the click handler passes in:

    alignPositions nodes = [{pos:{x:40,y:130}}, {pos:{x:265,y:85}}, {pos:{x:480,y:38}}]
    axis = row  grid = 0

Every `size` is **undefined**.

Sizes come from our own `measured` map, filled from React Flow "dimensions"
change events. When a size is missing, `sizeOf()` returns 0, so
`centre = position + 0/2 = position`, and "align centres" silently becomes
"align top-left corners". r97 and r98 were therefore never actually exercised
on real cards - which is why the button keeps looking like it does nothing.

## Why that produces Align-wrong.png

Aligning corners sets every `position.y` equal. The cards then render at
different heights, so their middles - and their sockets, which sit at 50% for a
single-socket card - stay staggered, and the wires still curve. That is the
reported picture.

Zeis's Align-right.png has straight horizontal wires, which is precisely what
aligning the real centres of single-socket cards produces.

## Change

Read sizes from React Flow's `nodeLookup`, which carries an authoritative
`measured: {width, height}` per node maintained by its own ResizeObserver.
Fall back to our `measured` map, then to zero.

Centre alignment itself stays: it is what Zeis described ("aligns their center
anchor points to that calculated middle-average") and it is what makes the
wires straight. The defect was never the rule, it was that the rule was being
fed zeros.

Deliberately NOT doing: switching Row to align top edges. It would look right
only while every card is the same height, and would leave wires crooked as soon
as they are not.

## Verification

- Unit test: cards WITH sizes end up on one centre line; cards WITHOUT sizes
  must not silently pretend to be centred.
- Mounted test: write real geometry into React Flow's nodeLookup, click Row,
  assert the rendered centres coincide.
- Falsify: revert to the `measured`-only source and confirm the test fails.
- Full suite, typecheck, build, performance guards.
