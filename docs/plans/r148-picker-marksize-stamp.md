# r148 — The inspector's colour picker, mark size, free weight, and a current stamp

Four items from Zeis's r147 review, all his scope:

## 1. The grid colour picker is now *the* colour picker

r147 used a native `<input type="color">` beside the presets — but the
project already has a proper picker
(`src/editor/inspector/ColourPicker.tsx`), built in an earlier round to
*replace* exactly that native input ("hands the author whatever dialog the
operating system provides — a different size, language and shape on every
machine"). Zeis called it out; the grid row now embeds the real component:
preset swatches, the result swatch with its hex, a hex field, and the three
HSL sliders. The **Theme** button stays beside it (the picker takes a hex;
null = follow-the-theme is the picker's outside state, seeded with a neutral
grey while on Theme).

## 2. Mark size — the "width" control (Zeis chose "both")

His distinction: **weight** changes visibility; what he wanted in addition
was size — "change the lines (and dots, and crosses, etc.) to be fat, thin,
anything in-between". Asked which of mark-size / free-thickness / both he
meant, he chose **both**:

- **Mark size** (new): a slider+number control, 25–250%, default 100% =
  the r147 look, shown only for styles that have marks. Per style it sizes:
  dots → diameter (×mark), crosses → arm span (×mark), hexagons → outline
  size within the lattice (side = scale·mark/2; the lattice follows, so the
  honeycomb stays seamless), diamond → spacing (bigger marks, sparser
  lattice). Line styles (squares, graph paper) have no marks — the control
  hides for them and the hint says their look is cell + weight.
- **Line weight** (freed): the four presets (Hairline/Thin/Medium/Bold)
  became a free slider, 0.5–6 in quarter steps, with the same reset arrow
  as Grid scale. The old preset values live inside the new range, so
  stored r147 weights carry over unchanged.

`NumberSlider` grew a `step` prop (integer or fractional; values quantize
to the step grid with float dust shed) — weight uses 0.25, mark size 5.

## 3. The build stamp comes current

The debug panel (and every exported mod's header) read
`EDITOR_BUILD = "2026-09-13.r139"` — frozen since r139 under the old AR13
reading ("don't bump unless the compiler's output changes"). Zeis reads it
as the version, which it is. New practice from this round: **the stamp
bumps every round** — it is a version number, not a compiler changelog.
Now `2026-09-13.r148`.

## Verification

- Mark-size guard falsified: forcing the mark factor to 1 fails the new
  render test (native dot radius + hexagon lattice width both asserted);
  restored, green. The weight wiring kept its r147 guard (crosses'
  stroke-width test).
- Stored-blob upgrades tested with the exact pre-r147 and exact r147
  shapes; wild values clamp (weight 9→6, markSize 999→250, quarter-grid
  snapping 1.3→1.25).
- Gates: typecheck clean, **1,396 tests / 67 files**, build clean.

## Zeis's eyes only

The picker's sliders at work on the live grid, mark size at the extremes
(25% dots, 250% hexagons — outlines that overlap at high %), weight up at
6 on squares, and the debug panel showing r148.
