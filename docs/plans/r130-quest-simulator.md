# r130: the Quest Simulator (dry run) + Cookbook riders

Roadmap item 8, Zeis's go given. The editor gains a **Dry run**: instantiate
the *actually emitted* `dist/mod.js` against a recording stub SDK, walk every
quest's lifecycle (`CreateData` → `OnStart` → `OnObjectivesStart`), and show
the author what their story does — before any export.

## Honesty boundary (stated in the UI)

This simulates **the editor's own runtime**, deterministically, in-process.
The game is the final judge. What it *can* prove: the mod compiles, registers,
the story flow reaches what it should, every objective has a completion route,
and each trigger's conditions would match an event shaped the way the author
expects. What it *cannot*: how the game renders anything, whether the engine
actually fires an event (that stays Zeis's in-game QA list), timing under the
game clock, and the engine's permission window.

## A. `src/compiler/simulate.ts` (pure, no React — AR1/AR2)

`simulateProject(project): Promise<SimReport>`

1. `compileProject(project)` (reuses the real pipeline, warnings included).
2. Evaluate `dist/mod.js` with `new Function` exactly as the test suite does
   (`compile.test.ts` is the precedent), against a **recording SDK**: the
   test stub generalized to every namespace the runtime touches (grep-verified
   surface: Network ×14 methods, Shell ×6, Mail ×3, WeeChat ×3, Kisscord,
   Files, Database, Bank, UI, Handbook, Quest.claim, SaveStorage, Events,
   Random). `Random.sleep` resolves immediately — waits collapse in a dry run.
3. For each registered quest: `Data = await CreateData()`, `OnStart()`,
   `OnObjectivesStart()`, settling microtasks between (the test `settle()`
   pattern). Everything thrown is caught and reported as an error, not fatal.
4. Report per quest:
   - **trace**: the humanized call log in order — the story's first minute:
     network created → whois answer placed → mail sent → …
   - **objectives**: each objective's completion route — ticked during the
     flow (recorded `completeObjective`), or waiting on an event trigger;
   - **probe** (the load-bearing part): for every event trigger, synthesize a
     payload from the trigger's own condition values laid over the catalogue's
     declared field shape (`payloadFields`; primitive-declared events are
     probed both as object AND bare value — the `Terminal.Lynx.Search` bug
     class), fire the runtime's *real registered listener*, and report
     MATCH / NO-MATCH per objective. A NO-MATCH is the "objective can never
     tick" bug, caught pre-export.
   - **gaps**: objectives with neither a flow tick nor a trigger; errors.

## B. `src/editor/simulator/SimulatorDialog.tsx` (the only React piece)

A "Dry run" entry point in the top bar opens the report: trace, objective
table with probe badges, warnings, errors — plus the honesty caption. The
decision logic stays in the pure harness; jsdom tests the harness, and the
dialog gets a smoke render only (jsdom cannot judge layout).

## C. Cookbook riders (roadmap item 8's second half)

- **Port forwarding** card (r119 §3 item 1: guidance debt, not a node debt —
  external/internal port fields + the firewall node already model it).
- **Pacing** card (the Wait/Sequence/timed-chat clarification: real waits via
  the game's own `Random.sleep`; no cancellable timers, no periodic checks —
  no SDK scheduler).
- The metasploit card gains the payload/handler line (r119 item 4:
  `Metasploit.SetOption` triggers make LHOST/LPORT/handler objectives
  expressible; forward the listener port).
- `nodeCount` 12 → 14; registry pin untouched (ids unchanged).

## D. Domain warnings (the small analysis win)

`computeWarnings`: (1) two websites in one project sharing a host — the
engine registers both and nobody knows which answers; (2) placeholder hosts
(`example.net` — the schema default — and friends) shipping in a real mod.
Both falsifiable in the usual way.

## E. Gates & pins

- `simulate.test.ts`: on the Harbour Manifest — trace contains the network,
  the brief mail and the whois answer; **every trigger probe matches**; a
  sabotaged copy (condition field renamed to something the payload lacks)
  reports NO-MATCH — the negative case that proves the probe can fail.
- Domain-warning tests: duplicate host fires, placeholder fires, distinct
  real hosts stay silent.
- Stamp → `2026-09-11.r130` (warnings + templates changed).
- README/HANDOFF: counts, queue, Done recently.

## F. Build notes (written after, not planned before)

- **The probe's first version was wrong in a way the tests caught twice.** It
  compared raw `{{data.*}}` tokens (the runtime fills them against the quest's
  own data before matching) and set no fields for primitive-declared events
  (`Terminal.SSH.Connected` is a bare `string`). Fixed: probe values are
  resolved against `CreateData()`'s data, and primitive events fall back to
  the conditions' own roots — mirroring the runtime's single-key fallback.
- **`QE.*` events exist**: the runtime registers listeners on its own
  synthetic events (reply outcomes). Nothing external can fire them, so they
  get their own verdict ("internal beat") rather than a false "unknown event".
- **Attribution bug**: probes initially fired after the quest's window closed,
  so completions landed nowhere and every probe read no-match. Probes now run
  with the quest still current.
- **One false alarm to record**: a vitest failure showed the trace "stopping"
  after two tool answers — it was the assertion diff truncating a long string,
  not a real break. The full trace had the mail, the ticks and the payment.
  Check the length before believing a truncated diff.
- Falsified: the domain-placeholder warning (check disabled → test fails) and
  the probe sweep's negative case (sabotaged condition → no-match).
- The sweep passing across all twelve templates is itself a finding: every
  shipped trigger's conditions are sound against the catalogue's declared
  shapes, including Six Tries' `Terminal.Hydra` credential match.
- **Zeis's reroute question, answered by the code and pinned.** The reroute
  has no runtime case of its own — `next()` follows all flow wires through
  `__QE.seq`, which is **serial, deep-first, in wire order** (it only pays for
  a promise when a branch really is async). With wait-free branches that is
  indistinguishable from "all at once"; but a Wait or timed chat on an early
  wire delays every later wire. Proven in the dry run (delay-branch fired
  before the instant branch when wired first), pinned as a test whose
  assertion is order-sensitive (falsified by swapping the wires), and the
  Pacing card now says: Sequence for deliberate pacing, reroute to tidy
  wait-free wires. Cycles are bounded the same in-game and in the sim
  (`depth > 200`).

