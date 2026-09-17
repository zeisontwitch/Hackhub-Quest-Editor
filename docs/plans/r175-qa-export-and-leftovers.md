# r175 (plan + record): the QA export refresh and the r174 leftovers

## Why this round

Zeis's four-item instruction, all of it in service of getting back to in-game
testing of the game/SDK catch-up.

1. **Regenerate `reference/sdk-0.24-qa/editor-export/`.** It was still the
   r166 artifact (`QESdk024EditorQa` alone) while the QA project now also
   carries `QESdk024TimerQa` — and r172's S-01 says "install the refreshed QA
   export". Nothing in the repo matched.
2. **The manual generator's "When it appears" sentence.** "Only once *When it
   fires* is set. Until then the field is hidden." is inaccurate for a gate
   that is a select with a default, and it never names the value that reveals
   the field.
3. **S-04** — the Timer `at` mode's timezone correction still needs an in-game
   answer.
4. **The Quest-tab "Best left off" hints** for **Complete automatically** and
   **Show a manual complete button** predate the game update; in-game QA on
   1.3.0 shows completion working.

Items 1–3 are the r174 audit's "left for a decision" list; item 4 is the last
of the freeze-era copy.

## What changed

### 1. The installable QA export is current, and guarded

- New `scripts/build-qa-export.mjs` + `npm run gen:qa-export`. It loads
  `parseProjectFile` and `compileProject` through Vite's `ssrLoadModule`,
  writes the compiler's own file list (`manifest.json`, `dist/manifest.json`,
  `dist/mod.js`, `src/index.ts`, `README.md`, `package.json`,
  `esbuild.config.mjs`, `tsconfig.json`) into `editor-export/`, and prunes
  strays. `src/index.ts` gets the leading `// @ts-nocheck` the committed copy
  carried, because the root tsconfig typechecks `reference/`.
- The compiled README is the compiler's. The hand-written QA notes now live in
  `reference/sdk-0.24-qa/editor-export.notes.md`, and the generator appends
  them — the r166 export had its test history spliced into README.md by hand,
  so a regenerate-and-forget would have dropped it silently.
- The QA project moved to mod **1.0.3**, so the in-game mod list can tell the
  two exports apart.
- `src/compiler/__tests__/sdk024QaExport.test.ts`: compiles the project and
  compares every byte, fails on a file the compiler does not emit, and asserts
  both quest ids are in `dist/mod.js`.

### 2. Conditional fields name the value they wait for

The sentence is generated in `scripts/build-node-pages.mjs` from the
registry's `showWhen` (`{ key, equals }`). Every gate in the registry is a
select, so "only once *When it fires* is set" is never true — the select
always has a value — and the old line never said which value reveals the
field.

The generator now resolves the gate field's `equals` value(s) through the
field's own options, and the gated field's starting value, to produce:

- **the starting value** — "Shown while **When it fires** is **After a
  delay** — the option it starts on. The other options hide it."
- **any other value** — "Shown only when **When it fires** is **In N days at
  a set time**. Until then the field is hidden."
- **an array gate** — the labels with "or" (`daytime`/`at` share hour/minute;
  the prompt's Accept has three).
- **no `equals`** — the old sentence, as the honest fallback; nothing in the
  registry hits it today.

`G16` in `src/manual.coverage.test.ts` fails any "When it appears" row with
fewer than two `.ui` labels — one that went back to naming the field alone.

Pages affected: `nodes/flow-timer.html` (9 rows) and `nodes/fx-prompt.html`
(2). Pay's percent note is not rendered as a row, so nothing changed there.

Also corrected in passing: G15's comment and failure message said "32
generated / 11 hand-written" pages — both counts had drifted, so the text now
names no numbers.

### 3. S-04 gets a probe that needs no date edit

The `at` arm bakes in `new Date().getTimezoneOffset()` on the assumption that
the in-game clock displays the player machine's zone. The QA project's Timers
are delay-mode by design (fixed dates go stale), so answering S-04 needed a
probe that does not depend on a typed calendar date. Raw harness **1.0.7**
adds:

```text
qe24 clock
```

which prints the current time as raw `Time.now`, as UTC, as the machine-local
rendering and as `Time.date()`. The tester compares those lines with the clock
on screen: a local match keeps the correction, a UTC match drops the single
line in `computeTimerFireAt` (the runtime comment says which, and now names
this probe). The export's date-mode arm log still prints ISO next to the raw
`fireAt`.

Patching note: the edit tool mangled `mod/dist/mod.js` once (a fuzzy match
merged two lines inside the phone-probe code, caught by `node --check`); the
file was restored from git and patched with an assert-count script. Same class
of accident as r173's `runtimeSource.ts` truncation — hand-authored
single-file JS gets `node --check` after every write, always.

### 4. The freeze-era hints are gone

`InspectorPanel.tsx` now says what the toggles do:

- **Complete automatically** — "The game closes the quest itself once its
  objectives are all done, with no Complete quest node needed. Leave it off
  when the ending should be a deliberate story moment."
- **Show a manual complete button** — "Puts a Complete button in the player's
  quest panel, so they decide when the quest is over."

Evidence: `reference/sdk-0.24-qa/QE24-TestResults - 3.md` (complete, button,
retire, unclaim all clean on HackHub 1.3.0 / build 25341308), `docs/04`
already marked historical, and no freeze copy left anywhere in `src/` or the
manual. The runtime's network-cleanup comments about *promise* freezes are a
different, still-valid hazard and were left alone.

## Gates

- `npm run typecheck` — 0 errors.
- `npm test` — 1,594 passed / 81 files (was 1,590 / 80; +3 export guard,
  +1 G16).
- `npm run build` — succeeds (pre-existing chunk-size warning only).
- `npm run gen:manual` — 39 node types / 143 editable fields / 74 sockets;
  index 255 entries from 49 pages.
- `npm run gen:qa-export` — 8 files written, byte-identical to the compiler.
- Guards falsified: a one-byte export README edit, a stray export file, and
  G16 with the old sentence restored on one page. (The export guard also
  failed against the stale folder before regeneration, which is what started
  the round.)

## Stamp

`2026-09-17.r175` — exports and manual wording changed.
