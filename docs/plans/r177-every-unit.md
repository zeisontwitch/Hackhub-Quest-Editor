# r177 (plan): every unit, both ways — the Timer's relative rows

## Why this round

Zeis, on r176's shipping build:

> Edge-case scenario: What if an author wants something to happen in `1 month`
> `2 weeks` and `2 days` from now at exactly `18:23`? I only see how to put in a
> single day/week/month/year.

Correct — and it is an asymmetry, not a limit of the resolver. **Wait** already
composes three boxes (days + hours + minutes, summed); **A coming day** modelled
the whole offset as *one amount × one unit*. So "1 month 2 weeks 2 days at
18:23" had no home: Wait has no months, and *An exact date* asks the author to
read the in-game clock and do the arithmetic themselves.

And on the boundary proposed in the reply:

> "more choices for the authors to do things more flexibly should always be our
> goal. This tool is there to help them as much as possible, enable them as much
> as possible, not limit them."

Accepted, and acted on below: the sub-day freedom lands where it means
something — **Wait now takes every unit**, so a duration can be "1 month 2
weeks 2 days and 4 hours" as well as "2 days 4 hours".

## D1 — the rows

**A coming day** (clock pinned):

```
IN     YEARS   MONTHS   WEEKS   DAYS
       [ 1 ]   [ 1 ]    [ 2 ]   [ 2 ]
AT           18 : 23
```

**Wait** (no clock — the time of day is whatever it is when the story arrives):

```
WAIT   YEARS   MONTHS   WEEKS      DAYS   HOURS   MINUTES
       [ 1 ]   [ 1 ]    [ 2 ]      [ 2 ]  [ 4 ]   [ 0 ]
       = 1 year, 1 month, 2 weeks, 1 day, 1 hour
```

Six boxes and four boxes respectively, one per unit, laid out by the `row`
kind's new `columns` prop (3 for Wait, 4 for the coming-day row). No "add a
unit" button to discover, nothing to expand, and the boxes read in the order a
human says the numbers.

**Why the coming-day row stops at days.** Its clock *pins* a time of day, so an
hours box beside it would be a second way to say the same thing ("at 18:23 plus
4 hours" *is* "at 22:23"), and two spellings of one rule is exactly how a
non-coder gets confused. Nothing is lost: sub-day amounts live in Wait, which
now covers every unit. If Zeis wants "keep whatever time of day it is now" as a
clock option as well, that is a deliberate follow-up (a clock choice, not a
box), and it is recorded in §D3.

## D2 — arithmetic, fixed in writing

The same rule the r176 resolver already used, now stated over six units:

1. **Years and months** move the calendar, keeping the day number; if the
   target month is shorter, the day **clamps to its last day** (31 Jan + 1
   month = 28 Feb, 29 in a leap year).
2. **Weeks (×7) and days** are then added to the (possibly clamped) day.
3. **Hours and minutes** (Wait only) are added as wall-clock time after that,
   so a Date's own overflow carries them into the next day.
4. **A coming day then sets the clock** to HH:MM on the resolved day.

Clamping happens **once, on the calendar part only**, before weeks and days are
added — so 31 Jan + 1 month + 1 day = 1 March (clamp to 28 Feb, then +1), never
3 March. Order of the boxes never matters. Worked example, from 2026-09-17
10:00 with `1 year, 1 month, 2 weeks, 2 days` at 18:23: → 2027-10-17 → +16 days
= 2027-11-02 → at 18:23.

Both modes are resolved **inside the mod at arm time** against `Time.date()`;
the editor still never reads a clock (r176 §D2 stands).

## D3 — boundaries, deliberately

- **No hours/minutes boxes on the coming-day row** — see §D1.
- **No "keep the current time of day" clock option yet.** It would let a coming
  day behave like Wait (duration, unpinned time). It is a real capability and a
  clean one to add later as a third choice on the clock, but it also creates two
  UI-identical rules that behave differently ("at 18:23" vs "at the time we
  land on"), so it wants its own small round and its own sentence.
- **No seconds** — in-game seconds are real milliseconds (r173 check-in).

## D4 — storage and the migration

`offsetAmount` + `offsetUnit` (r176, written today and never shipped in a
release) become four keys:

| r176 | r177 |
|---|---|
| `offsetAmount: N, offsetUnit: "days"` | `offsetDays: N` |
| `offsetAmount: N, offsetUnit: "weeks"` | `offsetWeeks: N` |
| `offsetAmount: N, offsetUnit: "months"` | `offsetMonths: N` |
| `offsetAmount: N, offsetUnit: "years"` | `offsetYears: N` |

A pleasant side effect: the **pre-r176 key `offsetDays` becomes meaningful
again**, so a draft from r172–r175 needs no rewrite at all — only the r176 shape
is migrated. Wait's `years` / `months` / `weeks` are new keys that default to 0.

## D5 — the runtime

- One helper, `offsetParts(d)` + `addOffset(base, parts)`, implements §D2 and is
  shared by both modes; the literal calendar branches inside
  `computeTimerFireAt` go away.
- Wait keeps the SDK's own `Scheduler.schedule(kind, payload, {days, hours,
  minutes})` whenever it holds no calendar unit — that path is what S-01/S-02
  proved in game, so it is not touched. Months or years make it
  `scheduleAt(now + offset)` instead, because `schedule`'s duration object has
  no month field.
- The arm log prints the rule in the units the author typed (`armed in 1y 1mo 2w
  2d, at 18:23 in-game → in-game <iso>`), so a tester can compare the log with
  what the inspector promised.

## D6 — the words

`src/schema/timer.ts` grows one vocabulary (six units, in inspector order) and
three readers over it: `unitsPhrase` (sentences), `unitsShort` (canvas card:
`in 1y 1mo 2w 2d at 18:23`), `unitsReadback` (the row's `= …` line, normalising
days/hours/minutes among themselves only). The preview sentence, the card and
the manual all read from those, so no wording drifts.

## QA rows to add

| Row | What to do | Green means |
|---|---|---|
| S-13 | Timer set to *A coming day*, `1 month 2 weeks 2 days`, at 18:23; reach it and check the clock panel. | It fires on the day the preview names, at 18:23 in-game. |
| S-14 | Wait set to `months 1` (and again with `weeks 2`). | It fires one calendar month later (respecting a short month), and the log names the unit. |
| S-15 | Re-export a project saved under r176 (`offsetAmount`/`offsetUnit`). | Identical behaviour; the fields show the same numbers in the new boxes. |

## Files this touches

`src/schema/nodes.ts`, `src/schema/migrate.ts`, `src/schema/timer.ts`,
`src/schema/registry.ts` (`row.columns`, the two rows, hints), `editor/
inspector/Field.tsx` (columns), `compiler/runtimeSource.ts`, `canvas/
summarize.ts`, `analysis/graph.ts`, `docs/manual/node-voice.json`, the
regenerated manual + stamp sweep, README/HANDOFF/plans rows, and
`npm run gen:qa-export`.

## Gates and evidence

`npm run typecheck` clean, `npm test` green with the new guards **falsified**
(the clamping order, the month-to-`scheduleAt` switch, the migration, the row
walkers), `npm run build` succeeds, `gen:manual` ends "0 awaiting prose",
`gen:qa-export` regenerated and byte-guarded. Nothing visual is claimed.

## Stamp

`2026-09-18.r177`.
