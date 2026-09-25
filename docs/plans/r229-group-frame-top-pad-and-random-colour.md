# r229 — Group frame top padding + random-colour-on-creation setting

**Status: done (2026-09-25) — approved by Zeis, gates green, 1,835 tests / 91
files; see Handoff r229.**

Two small changes from Zeis, after the r228 canvas screenshot (nested frames
confirmed working):

1. **Top padding.** `frameAround` pads the selection bbox by 32 px on all
   sides. The frame's title bar (~30 px: `py-1.5` + a 16 px label) eats into
   that top band, so the top pad doubles to **64 px** — "just double what
   the bottom-padding is", in his words.
2. **A Settings toggle.** New on/off option: *group frames get a random
   colour assigned on creation*.

## 1. Top padding — `src/editor/canvas/groupDrag.ts`

- `GROUP_PAD` (uniform 32) becomes `PAD_EDGE = 32` (left / right / bottom)
  and `PAD_TOP = PAD_EDGE * 2` (64, the top). Named that way so the
  "double the bottom" relationship is visible in code.
- Only `frameAround` changes. `beginGroupDrag` / `stepGroupDrag` are
  untouched; the 160×120 minimums are untouched (120 still clears
  title bar + pad for the smallest selection).
- Test re-pin: the `frameAround` cases in `groupDrag.test.ts` assert
  top edge = bbox.y − 64; bottom/left/right stay −32.

## 2. Random colour on creation

**Established facts (checked in code — no schema change needed):**

- The group node already carries `color` — *"Title-bar colour. Any CSS hex;
  older drafts fall back to slate"* (`LayoutGroupNodeDataSchema`, default
  `#64748b`). The inspector already exposes it as **Title bar colour** with
  the 8 curated frame colours (`GROUP_COLORS` in `Field.tsx`: slate, blue,
  green, amber, pink, violet, orange, cyan) — manual re-colouring works
  today, and the title-bar text auto-inverts for light colours.
- Every group-creation path funnels through `st.addNode`: the palette entry
  ("Group frame" — `PALETTE_HIDDEN_TYPES` is empty), node search, and
  Ctrl+G. Paste/duplicate clone clipboard data directly (never `addNode`),
  so copies keep the copied frame's colour — desired.
- The Settings sheet reads/writes small pref modules
  (`snapGrid`, `wireMotion`, `wirePhysicsPref`, …) and
  `resetEditorPreferences()` calls each module's own setter.
- The compiler is untouched by design: `color` already rides in the
  exported frame data exactly as when hand-picked; the planning notes
  (label + comment only) are unchanged.

**Changes:**

1. New pure module `src/editor/canvas/groupColours.ts`, shaped like
   `wirePhysicsPref` (module value + `subscribe` + localStorage):
   - `FRAME_COLOURS` — the 8 curated hex values, moved here to be the single
     source of truth. `Field.tsx` keeps the human labels and imports the
     values, so the inspector picker and the random roll can never drift
     apart.
   - `randomGroupColour(): string` — a uniform pick from those 8 (a curated
     roll, not an unbounded hex: guaranteed to be a proven title-bar colour).
   - `groupColourRandomOn()` / `setGroupColourRandom(on)` /
     `subscribeGroupColourRandom()`, storage key `qe.groupColourRandom`,
     **default OFF** (today's slate look stays until opted in), plus a
     `reset…ForTests` seam.
2. `addNode` in `src/store/editor.ts`: when `type === "layout.group"` and
   the pref is on and the caller passed no explicit `color` (checked on the
   caller's `data`, not the merged result — `def.create()` already seeds
   the slate default), set `color = randomGroupColour()`.
3. `resetEditorPreferences()` gains `setGroupColourRandom(false)`.
4. Settings sheet: new **Group frames** section with one `SwitchRow` —
   *Random frame colours*: "New group frames get one of the ready-made
   colours picked for them, so clusters are easy to tell apart at a glance.
   You can still pick a colour by hand on any frame."

## Tests

- `groupDrag.test.ts` — `frameAround` re-pinned for the 64 px top (bottom /
  left / right unchanged); the clamp case re-checked at the new top pad.
- New `src/editor/canvas/__tests__/groupColours.test.ts` — default off;
  setter persists + notifies; test seam resets; `randomGroupColour()`
  always returns a member of the 8 (and the 8 are exactly the inspector's
  set).
- `canvasNodes.test.tsx` — Ctrl+G with the pref **on**: the new frame's
  `data.color` is a swatch member; with the pref **off** (default): the
  frame carries the slate default. Pref reset after each case.

## Falsify by revert

- Uniform 32 pad restored → the re-pinned `frameAround` top case goes red.
- The pref check dropped from `addNode` → the "pref on" case goes red
  (frame stays slate).

## Gates and bookkeeping

`npm run typecheck`, full `npm test`, `npm run build`. Stamp
`2026-09-25.r229` (EDITOR_BUILD, manual sweep, QA export regen). README
row + archive r224, HANDOFF section. Node count / field count unchanged —
no schema, template or manual field-count moves.
