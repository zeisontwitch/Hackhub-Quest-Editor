# r184 (plan): the QA ledger closes

The last two Timer rows, and the visual pass on r183's row fix.

## S-11 — green: mod jobs do appear in `NEXT EVENT`

Zeis ran `qe24 schedule 120` (a two-in-game-hour harness job, about two real
minutes, so it *is* the nearest thing scheduled) and the clock panel's
`NEXT EVENT` changed to **1 h 55 m and ticked down**.

That closes the question the earlier reading left open. The `4d 6h` he saw in the
second run was the **game's own** queued post job being nearer than our 29-day
month row — not a fence against mod jobs. Answer: the panel shows whatever is
nearest, and a mod's job can be it.

## S-10 — shelved by the author's decision (not a pass)

The short-month clamp needs an in-game date on the 29th, 30th or 31st; two runs
landed on other days. Zeis:

> I'm going to make a judgement call and shelf S-10 for now. We have more
> important things to check and this test eats up too much time. If it becomes a
> problem we'll deal with it.

Recorded in the ledger exactly that way — **a decision, not a result**. The clamp
is covered by unit tests (`src/schema/__tests__/timerCalendar.test.ts`: 31 Jan +
1 month = 28/29 Feb, leap years included), so the only thing going unverified is
the game agreeing with our arithmetic. If a bug report ever arrives, that row is
the first in-game check of the next Timer round.

## The r183 row-fold fix — visually confirmed

He confirms the inspector rows no longer clip and calls the layout "nicely
responsive when pushing or pulling the inspector drawer". That is the check
jsdom could not give: the tests asserted the shape of the fix (a container, a
fold, no bare `grid-cols-4`), and now the pixels have been seen by the person who
reported the problem.

## What this round changes in the repo

Bookkeeping and stamps only — no editor behaviour:

- `reference/sdk-0.24-qa/STATUS.md` — S-11 row, S-10 shelved row, and an opening
  line that now says plainly: nothing here is left to run.
- `TIMER-ROWS.md` — the last two rows become a record rather than a to-do.
- README "Done recently" r184 + the QA-folder README.
- `EDITOR_BUILD` → `2026-09-18.r184`, QA export **1.0.12** (stamp only), manual
  regenerated.

## Next

The Twotter re-integration, planned for review in
[`r185-twotter-return.md`](r185-twotter-return.md). Nothing in that plan is built
until Zeis answers its open questions.
