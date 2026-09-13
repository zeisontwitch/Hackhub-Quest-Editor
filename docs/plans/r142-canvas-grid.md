# r142 (plan): The canvas grid, and Roboto joins the fonts

## Why this round

Zeis's request after the r141 visual pass: a **visual grid on the canvas** with
four controls, plus two more typefaces.

1. **Grid on/off** — default **off** (his explicit call).
2. **Grid style** — square, dots, hex, plus three of our choosing:
   **crosses**, **graph paper**, **diamond**.
3. **Grid scale** — slider with a number input.
4. **Grid opacity** — slider with a number input.

And: add **Roboto** and **Roboto Mono** to the Settings → Typography picker.

## The one design decision to record

The visual grid **subsumes the always-on dot pattern** that r140/r141 shipped
(the React Flow `Background` dots that followed the snap step). With the grid
default-off, the out-of-the-box canvas has no pattern — a deliberate change
Zeis asked for ("Standard Off"), not a regression.

That also retires the r141 coupling "the dots follow the snap step": the
grid's scale is its own setting, and snapping keeps its own size. Two
independent things need honest copy, not a magic link — the sheet says the
grid is visual only and snapping has its own size.

## What changes

### 1. The preference module — `src/editor/canvas/canvasGrid.ts`

Same shape as the other preference modules; one JSON key (`qe.canvasGrid`):

```
{ enabled: false, style: "squares", scale: 22, opacity: 50 }
```

- `CANVAS_GRID_STYLES`: squares, dots, crosses, hexagons, graph, diamond —
  each with a label and hint.
- `canvasGrid()`, `setCanvasGrid(patch)`, `subscribeCanvasGrid`,
  `resetCanvasGridForTests()`. Stored values are validated on read (unknown
  style → default, scale clamped 4–200, opacity clamped 0–100).

### 2. Rendering — native variants + one custom overlay

- **Squares / Dots / Crosses**: React Flow's own `<Background>` (Lines, Dots,
  Cross variants) — battle-tested pattern math.
- **Graph paper**: two stacked `<Background>` (Lines) layers — fine lines
  every cell, a heavier line every fifth.
- **Hexagons / Diamond**: a small custom overlay, `src/editor/canvas/CanvasGrid.tsx`,
  replicating the library's own geometry (verified in the xyflow dist, not
  assumed): `scaledGap = gap · zoom`, pattern `x/y = transform % scaledGap`,
  container `position:absolute; inset:0; pointer-events:none; z-index:-1`.
  Seamless tiling via the stamp technique: stamp the motif at every lattice
  point near the tile and let the pattern clip do the wrapping.
- Opacity is baked into the pattern colour:
  `color-mix(in srgb, var(--color-canvas-dots) N%, transparent)` — so **every
  theme recolors the grid for free** (the token drives it).
- Pure geometry helper `gridPatternGeometry(scale, transform)` is extracted
  and unit-tested (compute, don't measure).

### 3. Settings sheet — a "Canvas grid" section

Switch (on/off) → six style buttons, each a small live SVG preview (a visual
person should see the pattern before picking it) → scale (slider + number,
4–200) → opacity (slider + number, 0–100). Hint copy: visual only; snapping
has its own size above.

### 4. Roboto + Roboto Mono

Fontsource again (OFL): `roboto` and `roboto-mono` latin 400/500/600/700
(fontsource generates the 600 Roboto never had upstream). Files +
`LICENSE-Roboto*.txt` land in `public/fonts/` next to the others; `uiFont.ts`
gains `roboto` and `roboto-mono`; CSS stacks + `@font-face` follow the
existing pattern.

## What does NOT change

- Snapping behaviour, align/distribute spacing (still `snapStep`).
- The compiler — no `EDITOR_BUILD` bump (AR13).
- `runtimeSource.ts` untouched; no schema/analysis changes.

## Gates

- typecheck 0, tests green, build clean.
- New coverage: module defaults/patch/persist/invalid-JSON; the geometry
  helper's arithmetic; sheet controls (switch, style buttons, both sliders and
  both number inputs); canvas renders a pattern when on, none when off; the
  falsification guard — grid-on rendering test must fail with the feature
  reverted to always-off.
- jsdom cannot see a grid: the six styles' actual look, seamlessness at pan
  and zoom, and the new fonts are **Zeis's eyes** in the preview.

## Stamp

None — nothing the compiler emits changes.
