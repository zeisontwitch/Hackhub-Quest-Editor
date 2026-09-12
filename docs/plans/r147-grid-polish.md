# r147 — Grid polish: visible dots, longer crosses, ink and weight controls

Zeis's first hands-on verdict on the grid (after r146 finally let him in),
and the round that answers it. Everything here is his specced scope:

## The reports, and what each turned out to be

1. **"Dots are almost invisible, even at opacity 100."** Not his eyes — a
   real sizing bug, found in the library's own geometry: for the Dots
   variant, `size` is the **diameter** (the rendered radius is
   `size · zoom / 2`). r142 passed `size={1.5}` — a radius of **0.75px at
   100% zoom**: sub-pixel ink that no opacity can rescue. Dots now draw at
   `GRID_DOT_SIZE = 9` (flow units, zoom-scaled like everything else) —
   just above the crosses' old 8-unit span, per his "1–2px bigger than the
   crosses are right now".
2. **"Crosses look more like a dot grid than the dots do."** Arms lengthened:
   span 8 → `CROSS_SPAN = 11`, so they read as crosses.
3. **A circular-arrow reset beside the Grid scale number field**, back to
   the standard size (22). The `refresh` glyph already existed;
   `NumberSlider` grew an optional `onReset` prop, wired for Grid scale.
4. **A colour picker for the grid ink** — the accessibility ask, so
   colourblind or low-vision authors can pick what they see best. The
   sheet offers **Theme** (the canvas-dots token, still the default), six
   fixed presets (White, Black, Sky, Amber, Green, Magenta — chosen to
   differ in lightness as well as hue, so they read on light and dark
   themes alike), and a native colour field for any hex. Storage: the same
   `qe.canvasGrid` JSON gains a `colour` field (`null` = theme, else a
   strict lowercased `#rrggbb` — anything else is rejected on read and on
   write). The opacity mix still applies on top of whichever ink is
   chosen: `color-mix(in srgb, <ink> <opacity>%, transparent)`.
5. **A line-weight setting**: Hairline 0.5 / Thin 1 (default) / Medium
   1.75 / Bold 2.5, as a segmented control. It drives the native styles'
   `lineWidth`, the overlay stamps' `strokeWidth`, and the graph-paper
   heavy line at `weight × 1.75`. Dots keep their own size (the hint says
   so).

## Verification notes (what jsdom taught us this round)

- React renders `strokeWidth` as the dash-case `stroke-width` attribute —
  assertions must read the dash-case name.
- jsdom re-serializes standard CSS properties **lossily**: a concrete
  `color-mix(in srgb, #ff00ff 50%, transparent)` in `color` comes back as
  `color-mix(in srgb, rgb(255, 0, 255), transparent)` — hex rewritten, the
  percentage eaten. Custom properties survive verbatim. The overlay's ink
  therefore rides `--qe-grid-ink` with `color: var(--qe-grid-ink)` —
  identical rendering in real browsers, assertable in jsdom.
- The canvas's default zoom in tests is 0.85, not 1 — the dot/cross
  assertions calibrate zoom from the rendered pattern width
  (`pattern width = scale · zoom`) instead of assuming.

Falsified, both guards: reverting the dot size to 1.5 fails the
sub-pixel-ink test; dropping the colour override in `gridPatternColour`
fails both colour-channel tests. Restored, all green.

Pre-r147 stored blobs (every r142–r146 install) upgrade losslessly —
tested with exactly that blob shape.

## Gates

Typecheck clean, **1,392 tests / 67 files** green, build clean. No
`EDITOR_BUILD` bump (AR13) — editor-only preferences, nothing the compiler
emits changed.

## Zeis's eyes only

The dot size at a few scales (9 is from his spec — one number to tweak if
it feels off), the crosses' new arms, each weight on each style, and the
presets against both dark and light themes.
