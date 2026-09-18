# r180 (plan): the Twotter verdict, and making the Timer rows runnable

Zeis, after the r179 probe:

> Back from the Twotter check. I could not find the S-05/etc. checklist
> anywhere. I've uploaded my findings, it's in `sdk-0.24-qa` called
> `QE24-TestResults - Twotter.md`

Two jobs, and the second one is the more important of the two.

## 1. The Twotter probe came back green on the read path

Game 1.3.0, Steam build **25388883**, throwaway save. Full transcript:
`reference/sdk-0.24-qa/QE24-TestResults - Twotter.md`; the row-by-row reading is
in `reference/sdk-0.24-qa/STATUS.md`.

| Row | Result |
| --- | --- |
| T-01 `createUser` + `addUser` → search | **Pass.** The engine filled name, surname, avatar, banner, followers, following, password. Search found the account; the profile showed its bio. |
| T-02 the planted r31 record → search | **Pass — the reason this round existed.** `bio: undefined` on a stored record no longer crashes search. |
| T-03 save → reload → `status` | **Red, and it does not matter.** The bio was *still* `undefined` after reload: "affected saves are repaired on load" did not manifest on a record written this way. Safe now only because T-02 is green. |
| T-04 `updateUser` | Not run. No longer load-bearing. |
| T-05 `postTweet` → profile | **Pass.** Tweet visible; `Twotter.PostSeen` fires. |
| T-06 `removeUser` ×3 | **Pass** — including the **quest-declared** account, and the handles left search. The old report's "no mod can repair it" is answered. |
| T-07 quest-declared account | **Pass at record level.** The declared account carries the bio from the quest definition — the *write* path the bug broke is fixed. |

**One new finding:** `Twotter.AccountCreated` did **not** fire for an account
added through `addUser` (the probe's `api-account-seen` objective stayed open
while `PostSeen` ticked normally). Whatever we build must not hang an objective
on that event.

**Decision:** Twotter can come back. The implementation round — next, not this
one — authors accounts and posts through `createUser`/`addUser`/`postTweet`,
never trusts the declarative `TwotterAccounts` path to write a complete record,
and never relies on repair-on-load. That round gets a plan of its own for Zeis
to review before anything is built.

## 2. The checklist that did not exist

The complaint is precise and it is ours: r178 removed the finished procedures
from this folder and told a tester the open rows were "one sitting if ever
needed", and the only description of S-05…S-15 was prose inside three round
plans. Worse, the export's `QESdk024TimerQa` covers **only** S-01/S-02/S-03 — so
even a tester who found the rows had nothing to install that would run them.
This is the second time rows have been invisible to the person meant to run
them ("I had no idea they existed", r178), so the fix is not another plan doc.

### What was built

**A checklist in the folder a tester installs from:**
`reference/sdk-0.24-qa/TIMER-ROWS.md` — every row S-01…S-15 with the exact
steps, what green looks like, what to paste back, and an honest note for the
rows that cannot be run on demand (the short-month clamp needs a 29th–31st
in-game date; `NEXT EVENT` is fact-finding, not pass/fail).

**A way to check a "1 month" row in seconds.** The blocker for the calendar rows
was that waiting is absurd: 26 in-game days is ~10 real hours. The SDK already
answers it — `Scheduler.list()` returns `ScheduledJobInfo` with **`fireAt`**,
the in-game timestamp the engine was handed. So harness **1.0.10** adds:

```
qe24 timers
```

which prints every pending job on the save, from any mod, with the moment it
will fire in the local rendering the on-screen clock uses (plus UTC, plus the
raw value), the payload that identifies which quest/node armed it, a proper
d/h/m breakdown, and how long that is in real seconds. The breakdown is
computed per unit — an earlier draft used a per-unit ceiling and would have
printed "3d 62h", which is why the guard test asserts `26d 3h 1m` exactly.

**Content that arms the calendar rows.** Two new auto-start quests in the QA
project, ordered so the chain reaches the far-away row within seconds:

| Quest | Rows |
| --- | --- |
| `QESdk024TimerCalQa` | S-06 (an exact date already past → fires at once), S-05 (a coming day, 0 days at 00:00, already past → fires at once), then the mixed **1 month 2 weeks 2 days at 18:23** row (S-13/S-08) which is read with `qe24 timers`. |
| `QESdk024WaitMonthQa` | A 1-minute Wait (the `schedule` path), then **Wait 1 month** — the `scheduleAt` path, since months have no duration field (S-14/S-09). |

**Fixtures for the migration rows.** `projects/fixture-pre-r176-after.project.json`
and `projects/fixture-r176-coming-day.project.json` are two tiny drafts a tester
opens in the editor for S-12 and S-15. A guard parses both and pins what the
boxes must show (`Wait 2 hours`; `2` in Weeks with the clock at `18:23`).

### Why the ordering in `QESdk024TimerCalQa` is the whole trick

A Timer suspends its chain until it fires, so a quest that arms the far-away row
first never arms anything else. The two instant rows go first: each fires within
a second, continues the chain, and by the time the tester runs `qe24 timers`
(before their eyes have finished reading the toasts) the mixed row is armed and
ready to be read.

## Evidence and guards

- **20 tests in `sdk024QaScaffold.test.ts` / `sdk024QaExport.test.ts`** (+5 this
  round): the `qe24 timers` output (payload identity, both renderings, the exact
  breakdown, the real-seconds line, the empty case, the no-`Scheduler.list`
  case), the four quests the checklist names, each calendar row's node data, and
  the two migration fixtures.
- **Falsified 5/5**: the naive per-unit breakdown, dropping the payload line,
  renaming a quest the checklist points at, turning the mixed row into a plain
  Wait, and dropping the Wait-in-months row's months. (The mixed-row guard was
  already caught being too weak — a string match that another daytime node
  satisfied — and was rewritten to parse the project and pin the node.)
- The heading *"ships both QA quests"* became *"ships every QA quest the
  checklist tells a tester to run"*, because the count was the thing that rotted.

## Files

`reference/sdk-0.24-qa/mod/dist/mod.js` + `mod/manifest.json` (1.0.10),
`projects/sdk-0.24-ingame-qa.project.json` (1.0.8, four quests),
`projects/fixture-*.project.json`, `TIMER-ROWS.md`, `STATUS.md`, `README.md`,
`editor-export/` + notes (1.0.8, build r180), the two test files, `EDITOR_BUILD`,
the manual, and the README / `06` / HANDOFF / plans rows.

## Stamp

`2026-09-18.r180`.
