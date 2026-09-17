# r176 (plan): the Timer's inspector — a digital clock, real rows, and "in 1 year from now"

**This is a plan-first round: no code until Zeis has reviewed this file.**

## Why this round

r172/r173 shipped the Timer functionally and left the panel plain: mode chosen
from a dropdown, then a stack of full-width number boxes — Year, Month, Day,
Hour, Minute, one per row, no units inside the boxes, no preview of what the
settings mean, and the "a past date fires immediately" policy living only in
the manual. The audience is non-coding gamers.

Zeis's review asked for three things:

- the hour/minute input should read like a clock (`00 h : 00 m`), styled a
  little like a digital clock;
- stale fixed dates should be solved by *relative* expressions — "in 2 weeks
  from now", "in 1 year from now" — rather than "This year"/"This week"
  checkboxes (which mix a calendar component with a span and cover only two
  units);
- the "the editor has no access to the player's clock" claim needs squaring
  with the relative design, which *does* read the clock (answered in D2).

## Evidence

**The attached in-game clock / calendar screenshot** (Zeis, 2026-09-17 23:29
real time; in-game reads **04:20, Monday, 21 September 2026**):

| Observed | Consequence for the design |
|---|---|
| Clock is 24-hour and zero-padded (`04:20`) | The time control is 24h — `04 : 20`, no AM/PM; `hour` 0–23, `minute` 0–59 as today. |
| The calendar spells the weekday and a day-first date — "Monday, 21 September 2026"; the HUD reads "Mon, 21 Sep" | Month is chosen **by name**, and the preview mirrors the game's own line; a weekday can only exist for a real date, so the preview doubles as a validity check. |
| The panel shows `NEXT EVENT 2d 4h` with a Wait button | That countdown is where the player meets our timers; our card summary should use the same units, and QA should record whether a mod job appears there (S-11). |
| In-game 21 Sep 04:20 vs real 17 Sep 23:29 | In-game time is its own clock (60×, already days ahead of the wall clock) — nothing the editor could display at authoring time is right for the player's save, so calendar values must resolve **in the player's game**. |

**Code facts:**

- `hour`/`minute`/`dateYear`/`dateMonth`/`dateDay`/`offsetDays` are plain
  `number` fields (registry.ts :1112–1144) rendered one per row.
- The dock is 340px by default (280–640 dragged), so mode labels must be short;
  the explaining belongs in a preview sentence.
- `showWhen` is evaluated *before* the kind dispatch (Field.tsx:73), so a new
  field kind can be conditional with no extra plumbing.
- Composite kinds already exist (`conditions`, `tables`, `deviceTree`) — a
  grouped control is an established pattern.
- Per-field warnings (`analysis/fields.ts`) are keyed by a data path and carry
  a `nextStep` — the right home for "June has 30 days".
- The manual extractor/generator walk the registry, so new kinds need a
  rendering rule there; the hand-written pages carry the build stamp (G15).
- `src/compiler/__tests__/sdk024QaExport.test.ts` (r175) fails until the
  installable export is regenerated after any compiler-facing change.
- `src/templates/reference.ts:209` uses the relative mode
  (`mode: "daytime", offsetDays: 3, hour: 12`) — it moves with the storage
  change below.

## D1 — the inspector (visual; no data change)

### The mode picker

```
When it fires
[ Wait ] [ A coming day ] [ An exact date ]
Fires 2 days 4 h after the story reaches this node.
```

A `select` gains an optional `display: "segmented"` variant; the sentence
comes from a new `preview` hook on the node type (one line, mode-aware).

### The duration row (mode `Wait`)

```
Wait    2 days   4 hours   30 minutes
        = 2 days, 4 hours, 30 minutes
```

A new `row` kind lays existing fields out inline; `number` gains `suffix`. The
readback normalises (25 hours → 1 day 1 hour) **without changing what is
stored** — the value stays legal, it just stops being meaningless to a human.

### The clock (modes `A coming day` and `An exact date`)

A new `clock` kind: the two existing inputs (`hour`, `minute`) presented as the
game's own display — dark inset panel, big tabular mono digits, dim colon, tiny
h/m captions, ▲▼ steppers, ↑/↓ keys with *local* wrap (23↔00, 59↔00, never
silently changing the date).

```
        ┌───────────────────────────┐
        │         0 4 : 2 0         │
        └───────────────────────────┘
             h         m
             in-game clock time
```

Whimsy, kept small and `prefers-reduced-motion`-aware: the colon breathes while
the field has focus, and a digit does one quick flip when it changes. No new
font — Roboto Mono is already bundled and carries the look.

### The date row (mode `An exact date`)

```
On    21   [ September ▾ ]   2026      at  [ 04 ] : [ 20 ]
      ↑ day        ↑ month by name          ↑ the clock above
```

Day and year stay `number`; the month becomes a `select` of names. The preview
then reads like the game's calendar:

> Fires when the in-game clock reads **Monday, 21 September 2026, 04:20**.
> If that moment has already passed when the story gets here, it fires
> straight away — use *A coming day* to say "from now".

Impossible dates raise the field warning ("June has 30 days — 31 June never
arrives"), so the mistake is visible while typing rather than in game.

### The card summary

`summarize.ts` already prints clock-style times; align the wording with the
game: `Mon 21 Sep, 04:20` (exact date), `in 3w at 04:20` (coming day),
`2d 4h 30m` (wait — already close to the game's `NEXT EVENT` units).

## D2 — relative dates with units (the "in 1 year from now" feature)

Mode *A coming day* becomes **"in [amount] [unit] from now, at [HH:MM]"**, with
units **days / weeks / months / years**. The rule is resolved inside the game
at the moment the story reaches the node:

```js
var n = sdk.Time.date();                    // the player's clock, right now
var y = n.getFullYear() + years;
var m = n.getMonth() + months;              // Date rolls the year for us
var d = clampToMonth(y, m, n.getDate() + days + weeks * 7);
fireAt = new Date(y, m, d, h, mi).getTime();
```

Sub-day offsets stay in *Wait*; the three modes stay non-overlapping and each
is one sentence: a duration; a calendar day plus a time of day; a fixed world
date.

### The two clocks (answer to Zeis's question)

| | Editor (this app) | The compiled mod (in game) |
|---|---|---|
| Runs | in the author's browser, while building | inside the player's game |
| Sees the game clock | **never** | **always** — `Time.now()` / `Time.date()` |
| Resolves "in 1 year" | no | yes, when the Timer arms |

So "This year" *can* be built — as a **runtime rule**, exactly like the
relative offsets. Once the rule resolves at arm time, "in 1 year" covers it for
every unit, and the exact-date mode stays for world-canon dates. The earlier
"the editor has no access to the player's clock" sentence meant only that the
editor cannot *display or validate* a resolved date while authoring; it was
written too absolutely, and the correction is recorded here.

Custom code is not the blocker: the mod *is* our code, and the tz correction,
the `daytime` maths and the fail-open branches are already hand-rolled on top
of `Time.date()` / `Scheduler.scheduleAt`. What custom code cannot create is a
channel from the browser editor to the running game — that is architecture (two
separate programs; the only hand-off is the exported folder), not SDK surface.
And it would not help anyway: a snapshot of the author's clock says nothing
about the player's save, as the screenshot itself shows (in-game is already
~3.4 in-game days ahead of the wall clock).

### Storage and the one migration

`offsetDays` stops being honest once the unit can be weeks/months/years:
`offsetAmount: number` + `offsetUnit: "days" | "weeks" | "months" | "years"`
(default `"days"`), with a `migrate.ts` case mapping `offsetDays: N` →
`offsetAmount: N, offsetUnit: "days"` (the r174 rename is the pattern, and its
tests the template). Touch points: the reference template, the QA project (all
`after` — no data change), `schema.test.ts`, `migrate.test.ts`.

### Arithmetic decisions

- **Short months:** clamp — 31 Jan + 1 month = 28 Feb (29 in a leap year) —
  rather than letting `Date` roll into March. Deterministic, explainable, and
  shown in the preview when it applies.
- **Leap day:** 29 Feb + 1 year = 28 Feb; documented and tested.
- **Fail-open:** unchanged. A relative rule can only be in the past if the
  clock moved backwards between arming and firing; no special case.

### Warnings

- `analysis/graph.ts` "Nothing scheduled" gains the relative branch (amount 0
  is a legal "today at HH:MM"); "no full date set" stays for `at`.
- `analysis/fields.ts` gains the short-month warning for `at`.

## D3 — optional, proposed for later

- **"The next time the clock reads 17 September"** — a fourth rule (next
  occurrence, wraps the year), the robust version of "this year's September".
  Real value, genuinely new semantics; propose after r176 unless Zeis wants it
  now.
- Quick chips (`+30 min`, `+2 h`, `+1 day`, `+1 week`) that fill the Wait row.
- An "≈ 2 real minutes at the default clock speed" sub-line.
- The same clock/duration styling on the **Wait** node.
- A mini month-grid picker for the exact-date mode (the screenshot's own grid).

## QA rows to add

| Row | What to do | Green means |
|---|---|---|
| S-09 | A Timer set to "in 1 month at 04:20"; reach it and check the clock panel. | It fires on the same day number one month on, at 04:20 in-game. |
| S-10 | Set "in 1 month" from a day the next month does not have (31 Jan). | It fires on the target month's last day, not in the following month. |
| S-11 | Arm a Timer, open the clock panel. | Record whether the mod's job appears in `NEXT EVENT`, and in what units. |
| S-12 | Re-export an `after`-mode project saved before r176. | Identical behaviour (the migration is silent). |

## Files this touches

`src/schema/registry.ts` (`row`, `clock`, `number.suffix`, `select.display`,
`NodeTypeDef.preview`, the `flow.timer` entry), `src/schema/nodes.ts`
(`offsetAmount`/`offsetUnit`), `src/schema/migrate.ts`,
`src/editor/inspector/Field.tsx` + `primitives.tsx` (the two kinds and the
digital clock), `InspectorPanel.tsx` (preview line), `canvas/summarize.ts`,
`compiler/runtimeSource.ts` (arm maths + arm log), `compiler/simulate.ts`
(stub), `analysis/graph.ts` + `fields.ts`, `scripts/extract-manual-inventory.mjs`
+ `build-node-pages.mjs` (new kinds), `docs/manual/node-voice.json`, the
generated manual + hand-written stamp sweep, `docs/06` figures,
README/HANDOFF/plan rows, and `npm run gen:qa-export`.

## Open questions (recommendations in brackets)

1. **Short months**: clamp or roll? **[clamp]**
2. **Next-occurrence rule**: now, later, or never? **[later — D3]**
3. **Exact-date placement**: keep as the third visible mode, or fold it behind
   "Advanced"? **[keep visible; the copy carries the warning]**
4. **Clock flourishes**: colon breath + digit flip, or plain? **[both,
   reduced-motion aware]**
5. **Labels**: `Wait` / `A coming day` / `An exact date`, and "in [2] [weeks]
   from now, at 04:20"? **[as written; say the word and I'll adjust]**

## Gates and evidence

The round is not done until `npm run typecheck` is clean, `npm test` is green
with the new guards **falsified** (calendar maths, the migration case, the
manual gates, `summarize`), `npm run build` succeeds, `npm run gen:manual` and
`npm run gen:qa-export` have regenerated their artifacts, and the README/docs
figures match the code. Nothing visual is claimed by tests — the clock's look
is Zeis's visual check.

## Stamp

`2026-09-17.r176` (or the day it ships).
