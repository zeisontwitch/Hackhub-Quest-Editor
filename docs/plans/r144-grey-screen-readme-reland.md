# r144 — The grey screen, the README, and the grid's re-landing

> **Correction (r145):** this round's leading suspect — the dev-preview
> server dying with a sandbox reset — was wrong. Zeis never uses the in-chat
> preview; he launches fresh zips locally. The real cause was found and fixed
> in r145: the Vite dependency-optimizer launch race. See
> [r145-grey-screen-launch-race.md](r145-grey-screen-launch-race.md).

## The report

Zeis, the morning after r142 landed: the editor showed "a grey colour and
absolutely nothing else", so he rolled the branch back to before the grid
round (GitHub's revert button, both commits), and separately discovered the
README had been truncated at some point to just the intro and the roadmap —
he restored it from a local backup and hand-patched what he could.

## The timeline (from git)

| When | What |
|---|---|
| 09-11 13:30 | r142 (this session's grid + Roboto round) pushed; dev preview started |
| 09-11 14:47 | r143 — a **Compile.ts clean-code pass by a different tool** (GenSpark), not this session |
| that evening | Zeis opens the editor: grey screen, nothing else |
| 09-11 17:16 | Zeis reverts r143, then r142 (web UI revert commits) |
| 09-12 morning | README restore from backup + hand edits (4 commits) |

## What was checked, and found

- **The reverts were clean**: remote vs r141 differs only in README.md. The
  working tree here was still byte-identical to the r142 commit, so the round
  is fully recoverable.
- **r142's code, reviewed again with the report in mind.** A grey screen is
  React crashing during the first render. No such path exists in r142: the
  preference module reads localStorage inside a try/catch, its snapshot is a
  stable module-level object (no `useSyncExternalStore` loop), the grid
  component sits inside `<ReactFlow>` exactly where the old library
  `<Background>` sat, and with the shipped default (grid **off**) it renders
  `null`. The r142 render tests already mounted the whole `<App />` with the
  grid off and on — a boot crash would have failed them then and fails them
  now.
- **r143's diff, skimmed**: pure function extraction + TSDoc in compile.ts,
  no module-scope hazards, no import-graph changes. Not obviously guilty
  either.
- **The sandbox itself**: it demonstrably reset between the r142 push and
  this round (local git rewound to r139, node_modules gone — the third such
  reset; r134 and r141 hit it too, and HANDOFF records the r134 one). A reset
  **kills the dev-preview server**; the preview page then shows precisely a
  grey nothing. This is the leading suspect: nothing in r142's code produces
  that symptom, and the preview provably died that night.
- **A real-browser check was attempted and is not possible from this
  sandbox**: every browser-binary CDN (playwright, chrome-for-testing,
  mozilla, electron's release assets, debian apt) is network-blocked; only
  registry.npmjs.org and github.com answer. An npm-delivered Chromium was
  extracted but cannot run — the sandbox lacks libnss3 and cannot install it.

## One real bug, found on review

The hexagon/diamond overlay set its pattern colour as an SVG `stroke`
**attribute**. `var()` and `color-mix()` are CSS functions: they resolve in
stylesheets and inline styles, **not** in presentation attributes — so the
`color-mix(in srgb, var(--color-canvas-dots) N%, transparent)` colour string
would have painted nothing in a real browser, and those two styles would have
rendered invisible (jsdom cannot see painting, which is why every test was
green). The colour now travels a real CSS channel: inline `color` on the
overlay svg, `stroke="currentColor"` on every stamp — the same net mechanism
the library's own background uses. The render tests assert the channel.

## What this round does

1. **Re-lands r142** (grid + Roboto, byte-identical except the fix above) on
   top of Zeis's rolled-back tip.
2. **Adds the boot regression net** (`src/__tests__/appBoot.test.tsx`): three
   tests that mount the whole editor — grid off, native style on, overlay
   style on — and require the standing shell. The gap the report exposed was
   that "the editor boots" was only ever implied, never asserted.
3. **Rebuilds the README** on Zeis's restored base: current test counts, the
   r142 and r144 rows, the r134–r140 round history reconstructed from
   HANDOFF (the truncation window — the README had been intro + roadmap since
   somewhere in r134–r139), the Visual Grid roadmap item retired, the missing
   `src/editor/settings/` and `public/fonts/` layout entries added.
4. **r143 stays reverted** — it is another tool's round, preserved at
   `a1fb342`; re-applying it is a separate, reviewed decision for Zeis.

## Verification

- Falsified: a probe that throws during the grid component's render fails
  all three boot tests (and the render tests); removed, everything is green.
- Gates: typecheck clean, full suite green (see HANDOFF for the count),
  build clean. No `EDITOR_BUILD` bump — the compiler emits nothing new
  (AR13).
- Still Zeis's eyes only: the six patterns' actual look, seamlessness under
  pan/zoom, Roboto/Roboto Mono rendering — and this time the grid is **off
  by default**, so toggle it on in Settings first.
