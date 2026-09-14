# r156 (plan): Full-program Clean Code & Architecture audit

## Why this round

No full-codebase clean-code/architecture pass had been run since **r139**
(which paid down the tool-pack debt). This round re-audits the whole tree
(~29k LOC of non-test source, 72 test files, 1,446 tests) against the
project's own rulebook (`.github/agents/clean-code-architect.md`) at both
levels — macro (AR1–AR21) and micro (A/B/K/F/E/C/FM/T). It is a review-first
round: the honest finding is that the codebase is in very good shape, so the
direct edit is deliberately small and everything else is documented rather
than churned (the rulebook's own "no golden hammer / YAGNI / only change what
violates a concrete rule" stance).

## Method

Mechanical scans plus reading the hot modules in full:

- **AR1/AR2 (pure core):** grep for `react`/`react-dom`/`@xyflow`/`zustand`
  imports and DOM globals in `schema/`, `analysis/`, `compiler/`,
  `templates/`, `toolpacks/`.
- **AR8/AR10 (store in pure code):** grep for `getState()` in the pure core.
- **AR3 (cycles):** a DFS import-cycle detector over all of `src`.
- **AR16 (escaping):** located every `escapeHtml`/entity path and the
  author-content → generated-HTML surface.
- **AR17 (permissions):** read `computePermissions` and its helpers.
- **AR12/E1 (boundary validation):** read `parseProjectFile` and
  `loadDraft`.
- **Micro:** greps for `console.*`, `as any`, `TODO/FIXME/HACK`, `@ts-ignore`,
  `JSON.parse(JSON.stringify(...))`, magic-ms timers; a function-length
  scanner (flagging bodies ≥ 45 lines); full reads of `store/editor.ts`,
  `analysis/graph.ts`, `analysis/fields.ts`, `editor/canvas/summarize.ts`.

Gates before and after: `npm run typecheck` (0 errors), `npm test`
(1,446 → 1,446 green).

## Findings

### Macro (architecture) — all clean

- **AR1/AR2 — pure core stays pure.** No React/DOM/store imports in
  `schema`, `analysis`, `compiler`, `templates`. The only `.tsx` under a
  "core-ish" folder is `toolpacks/ToolPackManagerDialog.tsx`, which is a UI
  dialog living beside the pure `toolpacks/palette.ts` + `schema.ts`; the
  pure files import no React. Acceptable feature-folder layout (AR5).
- **AR8/AR10 — no `getState()` anywhere in the pure core.** Analysis and
  compiler take plain arguments.
- **AR3 — one import cycle, and it is fine.** `editor/inspector/Field.tsx →
  DeviceTree.tsx → ListEditor.tsx → Field.tsx`. This is *essential* mutual
  recursion for nested form rendering (a Field can contain a ListEditor of
  sub-Fields; DeviceTree reuses ListEditor), entirely inside the
  `inspector/` feature folder — not a cross-layer
  schema/analysis/compiler/store cycle. Breaking it would be overengineering
  (A4/A5). **Left as-is by design.**
- **AR12/E1 — boundary validation is textbook.** `parseProjectFile`
  (`templates/share.ts`) and `loadDraft` (`store/autosave.ts`) both
  `safeParse` at the entry point and return/emit a typed result; `loadDraft`
  even envelope-checks `kind` before schema parsing so an unrelated JSON blob
  can't "validate" into a blank project and wipe a draft.
- **AR16 — escaping is contained and correct.** The single `escapeHtml`
  lives in `websites/pageDoc.ts` and is applied to host/path in
  `notFoundDoc`. Website page HTML is author-authored content the game's
  WebView renders directly (that is the feature), and the HTML-import path is
  previewed only in the sandboxed iframe. No raw concatenation of
  editor-injected values into generated HTML was found.
- **AR17 — permissions are declarative** (`PERMISSIONS_BY_NODE_TYPE` +
  per-emitter/-dialogue helpers), computed from actual graph usage, never
  omitted. (One minor over-widening candidate in `tokenPermissions` — see
  recommendations; not changed without evidence, per "never guess".)

### Micro (clean code) — near-spotless

- **0** `console.log` (the five `console.warn` in `autosave.ts` are
  legitimate boundary error reporting, E3-compliant).
- **0** `as any` (`no-explicit-any` disabled in exactly two contained,
  documented spots: `summarize.ts`'s `Loose` alias and `migrate.ts`).
- **0** `TODO`/`FIXME`/`HACK`/`@ts-ignore`. No `@ts-expect-error`.
- **0** stray `JSON.parse(JSON.stringify(...))` clones — `structuredClone`
  is used throughout (the `toolpacks/palette.ts` `deepClone` keeps a JSON
  fallback only for ancient runtimes, documented).
- The long functions the scanner flagged are React components (JSX-heavy —
  B4 exception) or deterministic template-data builders (`templates/*`),
  both acceptable per the project's stance. `summarize`/`analyseGraph` are
  cohesive single-job per-node switches, not the scattered-`if` anti-pattern.

## What changes (the one direct edit)

### DRY: use the existing `activeQuestOf` helper in the store (A3)

`store/editor.ts` inlined
`project.quests.find((q) => q.id === project.editor.activeQuestId)` eight
times inside `mutate` recipes, even though a private `activeQuestOf(project)`
helper already existed and was used elsewhere in the same file. Replaced the
eight inlined lookups with `activeQuestOf(project)`.

- Behaviour-identical (pure lookup extraction); the 24 store tests still pass.
- The `selectActiveQuest` selector keeps its own inline form — it reads
  `s.project` (store state), a different binding, correctly left untouched.
- The `x.id === quest.id` re-lookups inside recipes reference a captured
  outer `quest`, not the active-quest id — a different, valid pattern, left
  untouched.

Rule: A3 (DRY — one concept, one implementation), B5 (consistent
vocabulary — one way to name "the active quest").

## What does NOT change

- No new node type, no new emitter, no new UI, no new feature.
- `runtimeSource.ts` untouched (`String.raw` template hazard).
- The inspector `Field ↔ ListEditor ↔ DeviceTree` recursion (essential, see
  above).
- `tokenPermissions` substring matching (see recommendations — deferred, not
  guessed at).

## Gates

- `npm run typecheck` — 0 errors.
- `npm test` — 1,446 tests / 72 files green (unchanged count; the DRY edit
  is behaviour-neutral, so no test was added — a test that can't fail is
  worse than none, T-section).
- `npm run build` — succeeds.

## Stamp

`2026-09-14.r156`. Editor version bump only — the compiler's emitted output
is byte-identical (the change is confined to `store/editor.ts`; the stamp
moves because the editor was updated, per the roadmap's version-number rule).

## Future recommendations (not in this round — evidence needed first)

1. **`tokenPermissions` precision (AR17).** `computePermissions` decides
   `network`/`mail`/`shell` by `JSON.stringify(project).includes("player.ip")`
   etc. Tokens only ever appear as `{{player.ip}}` / `{{player.email}}` /
   `{{player.username}}` / `{{random.ip}}`, so the bare-substring form could,
   in principle, over-grant if an author typed the literal words in prose.
   Over-granting is the *safe* direction (least-privilege is about not
   widening, but an unused permission only ever costs a manifest line, never
   breaks a mod), so this is low priority. If tightened, match the full
   `{{…}}` token and add a test that fails on the loose form. Deferred rather
   than guessed at, per the standing rule.

2. **Wire up ESLint/Prettier as scripts (FM1).** The rulebook's FM1 says
   "delegate formatting to `npm run format` / `npm run lint`", but neither
   script nor config exists — formatting is currently enforced by convention
   and `tsc` only. Adding `eslint`/`prettier` configs + `lint`/`format`
   scripts would make FM1 real and could retire the hand-written
   `eslint-disable` comments' ambiguity. Separate tooling round; out of scope
   for a code-review pass.

3. **`toolpacks/` folder shape (AR5/AR6).** The one UI dialog
   (`ToolPackManagerDialog.tsx`) sits beside pure modules. Harmless today; if
   `toolpacks/` grows more UI, consider moving the dialog under
   `editor/` to keep the folder purely "pack model + palette synthesis". Not
   worth a move for a single file now (YAGNI).
