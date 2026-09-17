# r173 — "Timer": rename, plainer wording, and a calendar option

Date: 2026-09-17

Scope: feedback on the r172 node, in Zeis' words:

1. **Rename** the node from "Schedule beat" to **"Timer"** — easier to
   understand, and the name the previous instance already chose.
2. **Rewrite the first info sentence** to: *"Wait X amount of time until the
   next node fires. Great for when you want the story to hold for a moment."*
   — keeping the rest of the existing text after it.
3. **Purge "beat" from the warnings.** The "The beat has nothing to do"
   warning uses a writing term too often; this node is a **utility**, not a
   story tool, and the language should stop implying it is. "Beat" may remain
   sparingly in prose where it is unambiguous, but not in this node's UI
   strings.
4. **Calendar option.** Zeis believes the new SDK introduced a calendar
   feature, and since this node is about timing and scheduling it should
   offer one — quest authors should get as much flexibility as possible
   without coding.

Pinned SDK: `@hotbunny/hackhub-content-sdk@0.24.0` (unchanged).

Editor build stamped for this pass: `2026-09-17.r173`.

**This is a plan-first round: no code until Zeis has reviewed this file.**

## SDK facts (verified in the pinned `index.d.ts`, not patch notes)

| Declaration (line) | What it gives us |
|---|---|
| `Time.now(): number` (L2966) | Current in-game time, **in ms since the Unix epoch** — in-game time is a real epoch clock running at `scale()` (60 by default). |
| `Time.date(): Date` (L2976) | "Current in-game time as a `Date`, **for formatting and calendar maths**" — the SDK's own calendar surface. There is no separate `Calendar` namespace; this + `scheduleAt` is the calendar feature. |
| `Time.scale()` / `Time.isRunning()` / `Time.toRealMs` / `Time.toGameMs` / `Time.duration({minutes,hours,days})` (L2967–2982) | Pacing helpers; the editor keeps using `schedule()`'s human units for the relative mode. |
| `Scheduler.scheduleAt(kind, payload, fireAt: number, id?): string` (L3049) | "Schedule a job **for a specific in-game timestamp**" — the primitive behind the calendar option. |
| `ScheduledJobInfo.fireAt` (L2987) | "In-game timestamp at which the job is due" — consistent with `now()`. |
| No time/calendar events in the 99-event catalogue | Confirmed — the `Time`/`Scheduler` namespaces remain the only in-game-time surface, so the Timer node stays the sole exposure. |

**Not verifiable from the d.ts — in-game QA items (S-04…S-06 below):**

- Which timezone the in-game clock **displays** (the player machine's local
  zone, or UTC). The arm log will print both the computed `fireAt` and its
  ISO string so Zeis can compare it with the on-screen clock.
- What `scheduleAt` does when `fireAt` is already in the past (fires at once,
  or is ignored).
- Whether `scheduleAt`'s job survives reload exactly like `schedule`'s
  (the r166 probe covered `schedule`; `scheduleAt` presumably shares the
  same storage, but it must be observed, not assumed).

## D1 — rename to "Timer"

- Registry: `label` → **"Timer"**; `blurb` (palette one-liner) → keep
  "Do something at a later in-game time" unless Zeis wants different (open
  question 5). Icon stays the hourglass.
- **Internal type id — confirmed: rename to `flow.timer`** (check-in
  answer 1). The id is visible in the palette tag and the manual; matching
  the display name is cleaner. Now is the only cheap window: r172 was never
  played in game, so no user content depends on the old id. Mechanical
  touches: registry key, `ScheduleNodeDataSchema` usage sites, reference
  template, QA project JSON, tests, manual page filename
  (`nodes/flow-schedule.html` → `nodes/flow-timer.html`), shot-list row.
- **Field note text** (Zeis' sentence verbatim, then the existing second
  sentence with "beat" → "timer"):

  > Wait X amount of time until the next node fires. Great for when you want
  > the story to hold for a moment. Unlike a Wait, the time keeps passing
  > while the player is away — a timer set two in-game days out lands two
  > in-game days later even if the player saves and quits.

- **"Beat" purge — every user-facing string, old → new:**

  | Where | Old | New |
  |---|---|---|
  | `graph.ts` W1 detail | "…so the **beat** fires the moment the story reaches it — nothing waits." | "…so the **timer** fires the moment the story reaches it — nothing waits." |
  | `graph.ts` W2 label | "The **beat** has nothing to do" | "The **timer** has nothing to do" |
  | `graph.ts` W2 detail | "When the in-game time comes, the story has nowhere to go from this **beat** — it stops at the **beat**." | "When the time comes, the **timer** has nowhere to go — the story stops there." |
  | `graph.ts` W2 next step | "Wire the **beat's** “Out” socket to the node that should run when the time comes, or leave it unwired if the story is meant to end there." | "Wire the **Out** socket to the node that should run when the time comes, or leave it unwired if the story is meant to end there." |
  | `checking.html` entries | Titles/bodies of `msg-nothing-scheduled` and `msg-beat-nothing-to-do` | Rewritten to match the new strings; anchor `msg-beat-nothing-to-do` → `msg-timer-nothing-to-do` (only referenced by the generated page, safe to move). |
  | `node-voice.json` | Whole `flow.schedule` entry (oneliner "Runs part of the story at a later in-game time.", what/when/game/fields/mistakes/messages) | Rewritten: "timer" in UI-adjacent text, "story beat" only where genuinely about a story moment (e.g. "an article hits the wire"); message rows follow the new labels. Full text drafted in the round, checked against the banned-word list. |
  | Manual page | Title "Schedule beat", all prose | "Timer", prose follows the new strings. Filename per open question 1. |
  | Runtime + dry-run console logs | "schedule-beat handler registered", "schedule node … armed", "schedule beat fired", "schedule beat missed", "Beat scheduled for quest …", "Beat fired (simulated): …" | "timer handler registered", "timer node … armed", "timer fired", "timer missed", "Timer scheduled for quest …", "Timer fired (simulated): …". Developer-facing, but the in-game QA checklist reads these lines, so they get the same language. Tests asserting the old strings are updated in the same commit. |
  | README / HANDOFF | — | The r172 rows stay historical (they shipped under that name); the new r173 row records the rename and the calendar option. |

- New test: the registry label is exactly `"Timer"` (guards the rename).

## D2 — calendar options: "In N days at a set time" and "At a specific in-game date & time"

The inspector already supports conditional fields (`showWhen: { key, equals }`,
`equals` also accepts an array — the Pay node's `amountMode` uses it), so no
inspector work is needed.

Zeis' most-likely-use-case point (r173 check-in): the calendar must support
**"in 3 days at exactly 12:00"**. That needs *today's* in-game date, which
only exists at arm time — and the runtime has it via `Time.date()`. So the
node gets a **"When it fires"** select with **three** options:

- `after` — "After a delay": *Days / Hours / Minutes* from when the story
  reaches the node (the r172 behavior, default).
- `daytime` — "In N days at a set time": *Days from now* (0 = today) +
  *Hour* + *Minute* (the shared time fields). Runtime:
  ```js
  var n = sdk.Time.date();
  var fireAt = new Date(n.getFullYear(), n.getMonth(), n.getDate() + days, hour, minute).getTime();
  ```
  The local-time constructor makes "12:00" mean *the player's clock shows
  12:00* — no timezone arithmetic at all.
- `at` — "On a specific in-game date & time": *Year / Month / Day* + the
  shared *Hour* / *Minute*, for world-anchored events (several quests or
  articles landing on the same in-game date). Runtime (per the draft below).

*Hour* / *Minute* therefore carry `showWhen: { key: "mode", equals: ["daytime", "at"] }`.

- **Schema** (`ScheduleNodeDataSchema`): adds
  - `mode`: `"after" | "daytime" | "at"`, default `"after"`
  - `offsetDays` (number, min 0, default 0 — *Days from now*)
  - `hour` (0–23), `minute` (0–59) — shared by `daytime` and `at`
  - `dateYear` (1970–9999), `dateMonth` (1–12), `dateDay` (1–31)
- **Analysis (`graph.ts`):**
  - mode `after`: the two r172 warnings, reworded per D1.
  - mode `daytime`: no warning — 0 days = today, 00:00 is a legal time; an
    already-past time-of-day today fails open at runtime (see below).
  - mode `at` with an incomplete date (`dateYear`/`dateMonth`/`dateDay` at
    0) → reuses the **"Nothing scheduled"** label with an `at`-mode detail
    ("No full date is set, so the timer fires the moment the story reaches
    it — nothing waits."), so the message index gains no third entry.
  - the unwired-`Out` warning is mode-independent (unchanged shape).
- **Runtime (`runtimeSource.ts`):**
  - mode `after`: the r172 relative arm, unchanged.
  - mode `daytime`: the `Time.date()` + local-constructor formula above.
  - mode `at`:
    ```js
    var tz = new Date().getTimezoneOffset() * 60000;      /* player machine's offset */
    var fireAt = Date.UTC(y, m - 1, d, h, mi) - tz;       /* "the clock shows h:mi" */
    ```
    The offset makes "09:00" mean *the in-game clock displays 09:00*,
    assuming the game shows the player machine's local zone. If S-04 shows
    the game displays UTC, this becomes `Date.UTC(y, m - 1, d, h, mi)` — a
    one-line change, which is why the probe matters before this ships.
    (`daytime` is unaffected by that outcome: its local constructor follows
    whatever zone the clock shows.)
  - **Fail open (all date modes):** `fireAt <= sdk.Time.now()` (the date is
    already past when the story arrives) → **fire immediately** + a console
    line, same policy as "no time set". If S-06 shows the SDK already fires
    past jobs at once, keep the explicit branch anyway (it logs either way).
  - otherwise `sdk.Scheduler.scheduleAt(BEAT_KIND, payload, fireAt)`.
  - arm log prints `fireAt` + its ISO string (the S-04 comparison data).
  - Re-arm, idempotency, cancellation on complete/abandon: unchanged — the
    job id from `scheduleAt` flows through the same `beatJobs` list and the
    same `liveBeats` handler.
- **Dry run (`simulate.ts`):** the Scheduler stub gains `scheduleAt`
  (records the job, collapses the clock like everything else); the `Time`
  stub already has `now()`/`date()`. A dry run shows every mode firing
  through the real handler exactly like the relative one.
- **QA (`reference/sdk-0.24-qa` + the r166 checklist):** the existing
  QESdk024BeatQa keeps its relative beats (S-01…S-03 unchanged). New rows:
  - **S-04 timezone probe:** load the QA mod, open the console; the arm log
    prints the computed fire time — compare it with the in-game clock.
  - **S-05 "daytime" fire:** in the editor, set beat B to mode `daytime` —
    0 days from now, a few in-game minutes ahead (read from the in-game
    clock) → it must fire when the clock shows that time, across a
    save/reload (S-07, the `scheduleAt`-survives-reload check, folds in).
  - **S-06 past time:** set beat B to a time already past today → the story
    continues immediately with a console line.
  - **S-08** (optional, longer watch): `daytime` with a multi-day offset
    (in-game days pass at 24 real minutes each) to confirm multi-day maths.
- **Manual:** page regenerated (title "Timer", all three modes documented,
  `daytime` first as the recommended form, field examples per mode),
  `checking.html` entries reworded, shot-list row kept (screenshot still owed
  to Zeis with the QA pass). Inventory figures move: **136 → 143 editable
  fields** (mode + offsetDays + hour + minute + dateYear + dateMonth +
  dateDay; gen:manual output is authoritative and the front-page chip is
  updated to match), node types stay 39; every hand-written stamp is updated
  as usual.

## Files

- `src/schema/nodes.ts` — `ScheduleNodeDataSchema` + mode/date fields
- `src/schema/registry.ts` — label, blurb, note, fields, `showWhen`
- `src/analysis/graph.ts` — reworded warnings + `at`-mode no-date check
- `src/compiler/runtimeSource.ts` — `at`-mode arm (tz + `scheduleAt` +
  fail-open), log renames
- `src/compiler/simulate.ts` — `scheduleAt` stub, log renames
- `src/templates/reference.ts` — example stays mode `after` (1 d 2 h 30 m);
  the `at` mode is reachable by one select change and is documented in the
  manual (keeps the reference template on the common case)
- `reference/sdk-0.24-qa/projects/…ingame-qa.project.json` — no data change
  (both beats keep mode `after`); calendar QA is S-05/S-06 as a manual edit
- `docs/manual/node-voice.json`, `public/manual/checking.html`,
  `docs/plans/r164-manual-screenshots.md` (filename row → flow-timer),
  `public/manual/index.html` + `nodes.html` (label, count)
- `README.md`, `docs/HANDOFF.md`, `docs/archive/rounds-130-150.md`
- Tests: `scheduleBeat.test.ts` (`daytime` arm with a fixed stubbed
  `Time.date()` — deterministic local-constructor assertion, `at`-mode arm
  incl. a stubbed timezone offset, past-time fail-open in both date modes,
  re-arm through `scheduleAt`, drop branch, type id `flow.timer`),
  `graph.test.ts` (new labels/details, `at`-mode no-date warning),
  `sdk024QaScaffold.test.ts` (log strings, type id), `schema.test.ts`
  (defaults valid, field count), manual coverage gates
- `compile.ts` — stamp → `2026-09-17.r173`

## Gates & falsification

- Standard: `npm run gen:manual`, targeted Vitest, `npm run typecheck`,
  `npm test`, `npm run build`, `git diff --check`; commit + push.
- Falsify: revert the tz formula → at-mode arm test fails on the expected
  `fireAt`; delete the fail-open branch → past-date test hangs/misses;
  revert the label → the "Timer" label test fails.
- jsdom caveat unchanged: nothing visual is claimed; the console logs are
  the evidence for S-04…S-07.

## Check-in answers (r173, 2026-09-17)

All five open questions are answered:

1. **Type id:** rename to `flow.timer` — **confirmed** (option b).
2. **Granularity:** date + hour + minute, no seconds — **confirmed** (in-game
   seconds are real-world milliseconds; irrelevant in 99.9% of cases).
3. **Past date:** fail open, fire immediately — **confirmed**.
4. **Info text:** as quoted under D1 — **confirmed**.
5. **Palette blurb:** keep "Do something at a later in-game time" —
   **confirmed**.

New from the same check-in: the calendar must support **"in 3 days at
exactly 12:00"** — added as the `daytime` mode (third select option) in D2.

Remaining green-light: with the three-mode design as above, implementation
starts in the next round.
