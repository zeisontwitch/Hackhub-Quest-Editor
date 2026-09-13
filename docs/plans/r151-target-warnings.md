# r151 — Target-matching warnings + Tool pack node stub (plan)

## Problem
1. A quest can declare targets (services, versions, weaknesses) that its tool mod can
   never match — e.g. service `telnet` for a mod that only understands ftp/ssh/http.
   Today the author finds out only by playtesting. The editor should warn at
   **Export** and in **Dry run**, phrased for non-coder gamers.
2. A `pack.node` card with no tool mod selected shows an empty inspector ("Not set up
   yet" card + nothing to click). Authors — and the QA screenshot — show this reads
   as broken. It needs a stub panel that points at the fix.

## Ground truth (verified 2026-09-13 against recon-ng `main`, used as example only)
- Service matching (`BreachBackend.servicesCompatible`): **case-insensitive**, aliases
  `http→{https,web}`, `database→{mysql,mariadb,postgres}`,
  `printer→{jetdirect,raw,raw-print,pjl}`.
- Version matching (`versionsCompatible`): **case-insensitive substring** — the
  target's version string must contain the module's version string.
- Weakness matching (`moduleMatches`): **case-sensitive exact** (`Array.includes`,
  no lowercasing). Our schema constrains weaknesses to the 7 SDK values, so the
  lint only needs exact comparison.
- Known limitation: the `printer` alias group exists but no built-in module uses
  the `printer` service, so the example pack's `services` stays at the 7
  module-covered names. A quest targeting `printer` correctly warns today.

## Design: intent signal (per quest, per pack — no cross-quest, no network)
A quest "uses" a pack when ANY of these hold:
1. A trigger event references one of the pack's `events` (event name match).
2. A trigger reads/writes one of the pack's `packDataKeys`
   (`world.packData.<key>` reads or `packData` `set` calls).
3. A `pack.node` card in the quest points at one of the pack's `toolNodes`
   (by `nodeId`).

Only quests with intent get warnings, and only for the packs they use. No
cross-quest aggregation (would false-positive on multi-part campaigns like the
example, where part 1 sets up what part 2 exploits).

## Design: the three warnings
Checked per (quest, pack) pair that has intent: collect the quest's declared
targets from trigger `targets` (ports/services/versions) and domain weaknesses
(`vulnerabilities`, wherever the schema holds them); run the pack's `targetRules`:

1. **Service** — if `targetRules.services` is non-empty: every distinct service
   name on the quest's targets, lowercased, must be in `services ∪ aliases`
   (aliases expanded from `serviceAliases`, also lowercased). Else warn, naming
   the service and the quest step.
2. **Version** — if `targetRules.versionOnPorts` is true: every port with a
   service but a blank version warns (substring matching needs *something* to
   match against; we cannot check module-level substrings, so this is a
   completeness nudge, not a correctness proof).
3. **Weakness** — if `targetRules.vulnsOnDomain` is true: if none of the quest's
   domain weaknesses (exact match) is in `targetRules.vulnTypes`, warn naming
   the quest's weaknesses vs the mod's list.

Copy rules: human-readable, no event names / storage keys / call names in the
primary sentence (same bar as r150's `describePackNodeAction`). Quest title and
step quoted. Pack name bold where rendered.

## Wiring
- `computeWarnings(project, packs?)` in `src/compiler/compile.ts` — new optional
  second param (default `[]`, keeps old call sites compiling; no warnings when
  empty). Pure function, unit-tested.
- `ExportDialog` — passes `usePacks()` result through. Compiler warnings render
  in the existing warnings section.
- `SimulatorDialog` — Dry run shows the same warnings (packs threaded into
  `simulateProject(project, packs?)` the same way; verify exact call shape at
  build time — `SimulatorDialog.tsx:48` currently calls `simulateProject(project)`).
- `pack.node` stub rider — `PackNodeEditor` renders a stub when no `nodeId`:
  one or two sentences ("Pick which tool mod action this card runs…"), naming
  the Editor Mods groups the author should open. Final copy at build time.

## Out of scope (queued, not this round)
- Cross-quest / campaign-level warnings; network/topology checks.
- The 5 unrelated roadmap items (Sticky-note move, Player Replies rename,
  draggable/resizable inspector, Tools→Addons, Shortcuts refresh) — recorded in
  README/HANDOFF only.

## Gates
- `npm run typecheck` clean.
- Full `npm test` green; new tests: service warn incl. alias + case variants,
  version-blank warn, weakness warn, no-intent→no-warnings, multi-pack
  isolation, Export + Dry-run wiring, stub render.
- New-warning guards falsified by revert (at least the service check and the
  intent gate).
- `npm run build` clean.
- Stamp `2026-09-13.r151`.
