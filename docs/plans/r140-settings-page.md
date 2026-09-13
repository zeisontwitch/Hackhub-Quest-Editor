# r140 (plan): Settings page

## Why this round

Roadmap item 5, and the top buildable item in the queue after r139. Three
author-facing preferences currently have no home an author can find:

- **The wire-physics dials** (stiffness, damping, sag, taut, swing, retract,
  fade) live in the debug panel — a developer tool Zeis opens to diagnose
  problems, not a place an author looks for preferences.
- **The snap / animated / springy toggles** live on the canvas toolbar, which
  works (they are at the point of use) but carries no explanations and no
  dials.
- **A known lie:** the "Fade ms" dial does nothing. The ghost's fade runs
  inside the retraction frame loop as `1 - eased³`, so `ghostMs` only feeds
  the safety-backstop timer (HANDOFF queued item 4: "cosmetic, but a real
  inconsistency to resolve when the settings page lands").

This round gives those settings an honest, author-facing home — and fixes the
fade dial so every control on the new page does what it says.

## What changes

### 1. A settings sheet — `src/editor/shell/SettingsDialog.tsx`

A **right-anchored sheet, not a dimmed centered modal**. Every setting it
hosts is about the canvas, and tuning wire feel requires *seeing wires while
moving a dial* — the debug panel proved that interaction model for two
rounds. A centered `bg-void/70` overlay would hide the thing being tuned.

So the sheet is a Radix `Dialog` with `modal={false}`: no overlay, the canvas
stays visible and interactive (drag a wire while the sheet is open), focus
moves into the sheet on open, Esc closes it. It spans only the workspace
between the fixed-height top and status bars, so the surrounding chrome —
Export, Debug, the Settings button itself as a toggle — stays clickable while
it is open. It mounts from `Overlays` behind `ui.modal === "settings"`, like
every other dialog.

Contents (all read/write through the **existing** preference modules — no new
state, no second writers):

- **Canvas** — *Snap to grid* switch.
- **Wires** — *Animated wires* and *Springy wires* switches, with the honest
  descriptions the canvas toolbar tooltips already carry.
- **Wire physics (feel)** — the seven dials moved over from the debug panel,
  each with a one-line hint (drawn from `wireTuning`'s own docs: "higher is
  snappier", "below ~2·√stiffness it bounces", …), plus the two readouts that
  make tuning non-guesswork: **damping ratio** (bouncy / critical / sluggish)
  and **settle seconds**, plus *Reset to defaults*.
- A standing honesty line: none of this changes the exported mod — it is the
  author's own workspace.

Entry point: a **Settings** button in the top bar (the `sliders` icon — which
fits settings far better than the Shortcuts button it currently decorates;
Shortcuts takes the `keyboard` icon). The button toggles: clicking Settings
while the sheet is open closes it.

The canvas toolbar's three quick toggles and the Debug button **stay** — they
are direct manipulation at the point of use (Zeis's stated preference), the
iOS Control-Centre-to-Settings-app relationship, both writing the same
modules.

### 2. The fade dial becomes honest — `src/editor/canvas/wireGhost.ts`

Extract the fade into a pure, testable function (compute, don't measure —
jsdom cannot show a fade):

```ts
ghostOpacity(elapsedMs, retractMs, fadeMs)
```

- The ghost holds **full opacity while it travels**, then fades over the
  final `fadeMs` — which is what the code comment always *claimed*
  ("hold full opacity until the very end") while the eased-curve actually
  spread the fade across the whole retraction.
- A fade longer than the retraction starts fading immediately and **outlives
  the travel** (the ghost sits home and dissolves); a zero fade is an instant
  vanish.
- The ghost's lifetime becomes `max(retractMs, fadeMs)`; the backstop timer
  already used that formula.

Shipped defaults (retract 260, fade 20) keep the r115 QA'd vacuum-cable feel —
at 20ms the difference between the old curve and the tail fade is
sub-perceptual. The *dial* now does something when moved.

Rename `WireGhostOptions.durationMs` → `fadeMs` (B1: it is the fade length;
"duration" says nothing). No caller passes it today. Remove the vestigial
`GHOST_MS` export — its comment ("how long the ghost takes to snap back and
fade") is exactly the lie this round fixes; the one test using it switches to
the real formula.

### 3. The debug panel goes back to being a debug panel

The Tuning section (dials, damping ratio, settle, reset) **moves out** to
Settings. What remains is what the panel exists for: build stamp, the
permission gates, counters/FPS, the event log. One panel per job (K1) —
Settings is for *changing* the numbers, Debug for *diagnosing* with them
(the event log already records each ghost's fade/retract pair).

### 4. Housekeeping

- `store/editor.ts`: the `ui.modal` union gains `"settings"`.
- `Overlays.tsx` renders the sheet.
- No `EDITOR_BUILD` bump: the compiler's emissions are untouched (AR13 — the
  stamp versions *exported mods*, and nothing here reaches an export).

### 5. Rider — a flaky gate made honest

Mid-round, the full suite flaked once: `packDataEditor.test.tsx`'s two
event-picker tests ("the picker lists a Community tools group…", "picking the
community event…") measure **21s / 6s** on this sandbox, against vitest's 5s
default per test. Verified on the clean r139 tree (changes stashed): identical
timings, so it is the machine, not this round — the r139 session simply ran on
faster hardware. Both tests now carry an explicit 30s timeout; the ceiling
moves, the assertions do not.

## What does NOT change

- **The preference modules stay in `canvas/`** (`snapGrid`, `wireMotion`,
  `wirePhysicsPref`, `wireTuning`). The r139 plan sketched moving them into an
  `editor/settings/` folder; on inspection that is churn without value: the
  modules are the canvas behaviour's own constants (the physics loop, TypedEdge,
  arrange and the ghost all read them), and moving them would point canvas
  code at a settings folder. AR5 cuts by *feature* — and the settings **UI**
  is a shell surface (it lives beside DialoguesDialog and ExportDialog, the
  other top-bar dialogs), while the tuning **model** is canvas. One new file,
  no moves.
- No new preferences are invented (YAGNI): the round houses what exists, it
  does not add grid-size dials, theme pickers or anything nothing asked for.
- The canvas toolbar toggles, the debug panel's gates rows, and every stored
  localStorage key are untouched — authors' saved preferences survive.
- `runtimeSource.ts` untouched; no schema, analysis or compiler changes.

## Gates

- `npm run typecheck` 0 errors.
- `npm test` green — new coverage:
  - the sheet opens from the top bar, is non-modal (`aria-modal` absent), Esc
    closes it;
  - switches flip the real modules *and* persist to localStorage;
  - dials drive `wireTuning` live and persist; Reset restores `DEFAULT_TUNING`;
  - `ghostOpacity` arithmetic (tail fade, long fade, zero fade) — and a
    lifetime test that **fails on the old code** (a ghost with fade >
    retract must outlive the retraction);
  - the debug panel no longer carries the dials.
- `npm run build` succeeds.
- jsdom cannot show a fade or prove pointer pass-through — the visual halves
  (sheet looks right, canvas reachable while open, fade reads correctly) are
  Zeis's to eyeball in the preview.

## Stamp

No bump — nothing the compiler emits changes (AR13). The stamp stays
`2026-09-13.r139`.
