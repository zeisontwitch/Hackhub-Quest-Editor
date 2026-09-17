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
- **Internal type id — decision needed (open question 1).** Options:
  - **(a) Keep `flow.schedule`** (recommendation: no — see b)
  - **(b) Rename to `flow.timer`** — the id is visible in the palette tag and
    the manual; matching the display name is cleaner. Now is the *only* cheap
    window: r172 was never played in game, so no user content depends on the
    old id. Mechanical touches: registry key, `ScheduleNodeDataSchema` usage
    sites, reference template, QA project JSON, tests, manual page filename
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

## D2 — calendar option: "At a specific in-game date & time"

The inspector already supports conditional fields (`showWhen: { key, equals }`
— the Pay node's `amountMode` uses it), so no inspector work is needed.

- **Schema** (`ScheduleNodeDataSchema`): adds
  - `mode`: `"after" | "at"`, default `"after"`
  - `year` (number, 1970–9999), `month` (1–12), `day` (1–31), `hour` (0–23),
    `minute` (0–59) — default `0`
- **Inspector fields:**
  - new select **"When it fires"** — `after`: "After a while (from when the
    story reaches this)" (default) / `at`: "At a specific in-game date & time"
  - `Days / Hours / Minutes` gain `showWhen: { key: "mode", equals: "after" }`
  - the five date fields gain `showWhen: { key: "mode", equals: "at" }`, with
    hints that make the timezone contract explicit: "This is the time the
    in-game clock will show (the player's clock, not the wall clock)."
- **Analysis (`graph.ts`):**
  - mode `after`: the two r172 warnings, reworded per D1.
  - mode `at` with an incomplete date (any of year/month/day/hour/minute at
    0) → reuses the **"Nothing scheduled"** label with an `at`-mode detail
    ("No full date is set, so the timer fires the moment the story reaches
    it — nothing waits."), so the message index gains no third entry.
  - the unwired-`Out` warning is mode-independent (unchanged shape).
- **Runtime (`runtimeSource.ts`), mode `at`:**
  - at arm time (when the story reaches the node):
    ```js
    var tz = new Date().getTimezoneOffset() * 60000;      /* player machine's offset */
    var fireAt = Date.UTC(y, m - 1, d, h, mi) - tz;       /* "the clock shows h:mi" */
    ```
    The offset makes "09:00" mean *the in-game clock displays 09:00*,
    assuming the game shows the player machine's local zone. If S-04 shows
    the game displays UTC, this becomes `Date.UTC(y, m - 1, d, h, mi)` — a
    one-line change, which is why the probe matters before this ships.
  - `fireAt <= sdk.Time.now()` (the date is already past when the story
    arrives) → **fail open: fire immediately** + a console line, same policy
    as "no time set". If S-06 shows the SDK already fires past jobs at once,
    keep the explicit branch anyway (it logs either way).
  - otherwise `sdk.Scheduler.scheduleAt(BEAT_KIND, payload, fireAt)`.
  - arm log prints `fireAt` + its ISO string (the S-04 comparison data).
  - Re-arm, idempotency, cancellation on complete/abandon: unchanged — the
    job id from `scheduleAt` flows through the same `beatJobs` list and the
    same `liveBeats` handler.
- **Dry run (`simulate.ts`):** the Scheduler stub gains `scheduleAt`
  (records the job, collapses the clock like everything else); the `Time`
  stub already has `now()`/`date()`. A dry run shows the `at`-mode timer
  firing through the real handler exactly like the relative one.
- **QA (`reference/sdk-0.24-qa` + the r166 checklist):** the existing
  QESdk024BeatQa keeps its relative beats (S-01…S-03 unchanged). New rows:
  - **S-04 timezone probe:** load the QA mod, open the console; the arm log
    prints the computed fire time — compare it with the in-game clock.
  - **S-05 calendar fire:** in the editor, set beat B (2 h) to mode `at` with
    a date a few in-game minutes ahead (read from the in-game clock),
    re-export, load → it must fire when the clock shows that time, across a
    save/reload.
  - **S-06 past date:** set beat B to a date already in the past → the story
    continues immediately with a console line.
  - **S-07** (folded into S-05): confirm the `scheduleAt` job survives the
    reload (it is due after the reload, unlike S-02's relative job).
- **Manual:** page regenerated (title "Timer", both modes documented,
  `at`-mode field examples), `checking.html` entries reworded, shot-list
  row kept (screenshot still owed to Zeis with the QA pass). Inventory
  figures move: **136 → 142 editable fields** (mode + 5 date fields), node
  types stay 39; the front-page chips and every hand-written stamp are
  updated as usual.

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
  `docs/plans/r164-manual-screenshots.md` (filename row if open question 1
  picks b), `public/manual/index.html` + `nodes.html` (label, count)
- `README.md`, `docs/HANDOFF.md`, `docs/archive/rounds-130-150.md`
- Tests: `scheduleBeat.test.ts` (at-mode arm incl. a stubbed timezone
  offset, past-date fail-open, re-arm through `scheduleAt`, drop branch),
  `graph.test.ts` (new labels/details, `at`-mode no-date warning),
  `sdk024QaScaffold.test.ts` (log strings), `schema.test.ts` (defaults
  valid, field count), manual coverage gates
- `compile.ts` — stamp → `2026-09-17.r173`

## Gates & falsification

- Standard: `npm run gen:manual`, targeted Vitest, `npm run typecheck`,
  `npm test`, `npm run build`, `git diff --check`; commit + push.
- Falsify: revert the tz formula → at-mode arm test fails on the expected
  `fireAt`; delete the fail-open branch → past-date test hangs/misses;
  revert the label → the "Timer" label test fails.
- jsdom caveat unchanged: nothing visual is claimed; the console logs are
  the evidence for S-04…S-07.

## Open questions for Zeis

1. **Type id:** rename `flow.schedule` → `flow.timer` (my recommendation —
   now is the only cheap moment) or keep `flow.schedule`?
2. **Calendar granularity:** date + hour + minute, no seconds — OK?
3. **Past date:** fire immediately (fail open, like no time set) — OK?
4. **Info text:** your sentence verbatim + the existing second sentence with
   "beat" → "timer" — as quoted under D1?
5. **Palette blurb:** keep "Do something at a later in-game time", or would
   "Wait until later in-game time" serve the Timer name better?
