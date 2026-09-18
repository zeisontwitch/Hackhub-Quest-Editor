# r178 (plan): QA close-out — S-04 answered, the folder becomes tooling

## Why this round

Zeis, after looking for new rows in `reference/sdk-0.24-qa/README.md`:

> I've tested every single thing and reported all my findings in previous rounds
> (all green across the bank except for curl, which doesn't seem to exist in the
> current build), except for S-04. You can see the result of S-04 in the attached
> screenshot. … could you please clean up the sdk-0.24-qa folder and remove
> anything that's now stale or not important anymore so I don't accidentally
> re-run tests that were already finished.

Two jobs: settle S-04 from the evidence, and stop the folder reading as a list of
pending tests.

## S-04 — the answer, and what it changes

`qe24 clock` on game 1.3.0 (2026-09-18), read against the taskbar clock:

| Reading | Value |
| --- | --- |
| `Time.now` | 1789755311205 |
| as UTC | 2026-09-18T18:15:11.205Z |
| as local time | Fri Sep 18 2026 20:15:11 GMT+0200 (CEST) |
| `Time.date()` | Fri Sep 18 2026 20:15:11 GMT+0200 (CEST) |
| on-screen clock | **20:17**, Friday 18 September 2026 |

The screen matches the **local** rendering. So the in-game clock displays the
machine's local time and the `at` mode's correction (`Date.UTC(y, m − 1, d, h,
mi) − tz`) is **correct as shipped** — it stays.

Changes: the comment in `computeTimerFireAt` no longer says "If S-04 proves the
clock shows UTC, drop the tz correction" (it records the settled fact and the
evidence instead), the r173 plan's S-04 row is marked answered, and the verdict
is the first entry in the new status ledger.

**Falsification found the guard was hollow.** The obvious claim — "the `at`-mode
test guards the correction" — turned out to be false on this machine: the test
asserted `Date.UTC(...) − new Date().getTimezoneOffset() * 60000`, and a UTC box
(the sandbox, and most CI) reports an offset of 0, so the assertion cannot
distinguish a corrected timestamp from an uncorrected one. Deleting the
correction left the suite green. The test now fakes a UTC+2 machine
(`Date.prototype.getTimezoneOffset = () => -120`, restored in a `finally`), so
it fails wherever it runs when the correction is removed — verified by deleting
the line again and watching it fail. The test count is unchanged; one existing
test got teeth.

## The cleanup — what was decided, and why

The folder held a 199-line README whose bulk was *procedures for work already
done* (quick passes, intercept walkthrough, the editor-export route, the
"If the quest says 6/6" branch). Everything in it is finished; none of it is a
tool. So:

- **`STATUS.md` (new) is the ledger** — one page, three tables: verified (with
  where the evidence lives), blocked/deliberately-unsupported (`curl`, DNS-only
  collaborator, editor HTTP on static sites, the Bettercap `SSID: undefined`
  display wart), and **not run**. That last table is the honest one: the Timer
  rows (S-01…S-03, S-05…S-15) were written in plan docs and *no tester report in
  this repo covers them*. They are not blockers — the runtime paths are unit
  tested — and they are now stated as unrun rather than implied green.
- **`README.md` is cut to a folder map + safety + the harness command list.**
  No procedures, so nothing to re-run.
- **The raw harness stops printing a checklist.** `qe24 guide` and `qe24 next`
  are what a tester actually sees, and both printed the finished test list. Mod
  **1.0.8** prints "every check is closed — results in
  `reference/sdk-0.24-qa/STATUS.md`" and keeps the commands (`seed`, `status`,
  `history`, `clock`, `reset`, …) as tooling for the next probe. The hand-edited
  file was patched with an assert-guarded script and `node --check`ed, per the
  r173 lesson.
- **What was kept, and why.** `editor-export/` and `projects/` are guarded by
  `sdk024QaExport.test.ts` and `sdk024QaScaffold.test.ts` and are the only
  installable QA build — deleting them would delete the guard. `mod/` and
  `QE24-TestResults - 3.md` are the probe tool and the primary evidence
  transcript. `editor-export.notes.md` is appended by the generator, so it is
  edited only through that path.

## The Twotter lead (recorded, not acted on this round)

Zeis landed `docs/Game-Patch-1.3.0-1.3.1.md` in the same tree. Under 1.3.0
(Fixes):

> Fixed an issue that allowed a content pack to break Twotter permanently,
> taking the site down when searching for people. Affected saves are repaired on
> load.

That is the exact failure that forced Twotter's removal in r31 (a quest-declared
account with an undefined `bio`, which Twotter's search called `.toLowerCase()`
on). The upstream cause is therefore fixed *and* existing saves are repaired,
which is what makes re-implementation worth investigating. Also noted for that
round: 1.3.0 added `curl` (so the Blocked row above deserves one re-check on a
newer build), and 1.3.1 fixed the Reply button appearing on completed quest mail.

## Files this touches

`src/compiler/runtimeSource.ts` (comment), `src/compiler/compile.ts`
(`EDITOR_BUILD`), `reference/sdk-0.24-qa/{README.md,STATUS.md}`,
`reference/sdk-0.24-qa/mod/{dist/mod.js,manifest.json}`,
`reference/sdk-0.24-qa/{editor-export.notes.md,projects/…project.json}`, the
regenerated manual + stamps, and the README / HANDOFF / plans rows.

## Gates and evidence

`npm run typecheck` clean, `npm test` green (no count change — no new guards,
and the reason is above), `npm run build` succeeds, `npm run gen:manual` and
`npm run gen:qa-export` regenerated, `node --check` on the patched harness. The
harness's own printed text is not covered by a test — it is checked by reading
`qe24 guide`'s source and by Zeis if he ever opens the harness again.

## Stamp

`2026-09-18.r178`.
