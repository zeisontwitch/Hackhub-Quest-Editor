# QE24 QA status — one probe open (2026-09-18)

One page, so nobody re-runs a finished check. **One probe is open — the Twotter
test below (r179); everything else in this folder is closed.** A future round
that needs an in-game check adds a *new* row here and a new harness version —
never a re-run of the ones below.

## OPEN — the Twotter probe (r179)

**This is the only thing in this folder that still needs running.** It decides
whether Twotter can come back to the editor: r31 removed the feature because a
quest-declared account was saved with `bio: undefined`, Twotter's search called
`.toLowerCase()` on it, and the crash was permanent (BUG 3 in
[`docs/05-bug-report-for-hotbunny.md`](../../docs/05-bug-report-for-hotbunny.md)).
1.3.0 says that is fixed and that affected saves are repaired on load.

Harness **1.0.9**, command `qe24 twotter` (throwaway save):

| Row | Steps | Green means |
| --- | --- | --- |
| T-01 | `qe24 twotter seed`, then search Twotter for `qe24_probe` | The profile opens with its bio and search does not crash — the API path works. |
| T-02 | `qe24 twotter bad`, then search for `qe24_badrecord` | Search survives the **exact r31 record shape** (a `bio` that is `undefined`). A crash here means the fix is incomplete. |
| T-03 | `qe24 twotter status` → save, quit to the main menu, reload → `status` again | The bad record's bio is no longer `undefined` → "affected saves are repaired on load" is true. |
| T-04 | `qe24 twotter update` | Both `updateUser` calls return `true` → a mod can repair a record it did not create. The old report said no mod could. |
| T-05 | `qe24 twotter post`, then open the profile | The tweet is on the profile, and the `post-seen` objective ticks when you open it from the timeline. |
| T-06 | `qe24 twotter cleanup` | All three `removeUser` calls return `true` and the handles disappear from search — accounts are removable, which is what makes shipping them safe. |
| T-07 | Open the profile of `qe24_declared` | The bio declared in the *quest definition* shows → the write path is fixed, not just search. Ticks `declared-profile-seen`. |

What the results decide:

- **All green** → re-implement Twotter in the editor (account + tweet authoring, a post node), and the r31 fence comes down.
- **T-02 red** → it stays removed, and the crash lines go into
  [`docs/03-questions-for-the-developers.md`](../../docs/03-questions-for-the-developers.md)
  for SteelWaffe.
- **T-02 green but T-07 red** → search is guarded but the engine still writes
  bio-less records. Still shippable, using `createUser`/`updateUser`/`removeUser`
  (we would control the record) and avoiding the declarative path — a design
  constraint for that round, not a blocker.
- **T-06 red** → do not ship accounts at all: without `removeUser`, a player's
  save keeps them forever.

While you are in the terminal, one two-second check for the 1.3.1 build: does
`curl http://qe24-http.test/` exist now? If it does, the blocked curl rows below
unblock.

## Settled: the Timer's timezone question (S-04)

**Answer: the in-game clock displays the machine's local time.** The `at` mode's
timezone correction **stays** as shipped (`Date.UTC(...) − tz` in
`computeTimerFireAt`, `src/compiler/runtimeSource.ts`), and the comment there
now says so instead of holding the question open.

Evidence — `qe24 clock` on game 1.3.0, 2026-09-18, read against the taskbar clock:

| Reading | Value |
| --- | --- |
| `Time.now` | 1789755311205 |
| if the clock is UTC | 2026-09-18T18:15:11.205Z |
| if it is local time | Fri Sep 18 2026 20:15:11 GMT+0200 (Central European Summer Time) |
| `Time.date()` | Fri Sep 18 2026 20:15:11 GMT+0200 (Central European Summer Time) |
| **on-screen clock** | **20:17**, Friday 18 September 2026 |

The screen matches the **local** rendering (two minutes on: the read was taken
after the paste), not the UTC one.

Guarded by the `at`-mode test in `src/compiler/__tests__/scheduleBeat.test.ts`,
and the guard had to be repaired to be worth anything: it originally asserted
`Date.UTC(...) − new Date().getTimezoneOffset() * 60000`, which on a **UTC** box
(any CI, this sandbox) collapses to the uncorrected value — falsification showed
the test still passing with the correction deleted. It now fakes a UTC+2 machine
inside the test, so deleting the correction fails it wherever it runs.

## Verified in game

| Area | Where the result lives |
| --- | --- |
| r166 SDK surface — quest completion/cleanup, native Wi-Fi, Scheduler, HTTP/Browser/collaborator, phone `onEnd` probes | [`docs/plans/r166-sdk-0.24-ingame-qa.md`](../../docs/plans/r166-sdk-0.24-ingame-qa.md) § *Checklist and results* — every row Pass, tester report 2026-09-16, game 1.3.0 / Steam build 25341308 |
| Phone `onEnd` freeze probes (raw harness 1.0.6) | The phone rows of that table, plus [`QE24-TestResults - 3.md`](QE24-TestResults%20-%203.md) |
| Editor Wi-Fi (`QE24-LAB-5G`) and static website hosting | Same table (editor rows); HTTP *authoring* stays fenced — see below |
| S-04 clock zone | This file, above |

## Blocked, or deliberately not supported

| Row | Status |
| --- | --- |
| `curl` checks | **Blocked** — absent in the tested build even though the 1.3.0 changelog lists curl as added in that patch. Re-check with one command (`curl http://qe24-http.test/`) on the 1.3.1 build; do **not** re-run the HTTP checks, which are green through the Browser and `Http.fetch`. |
| DNS-only collaborator lookup | Unsupported in that build; Browser-based collaborator hits are green. Fenced and documented in [`docs/plans/r167-wifi-exposure-and-sdk024-roadmap.md`](../../docs/plans/r167-wifi-exposure-and-sdk024-roadmap.md). |
| Editor HTTP events on static websites | Static pages load, but their Browser traffic did not tick `Http.Request`/`Http.Response`; HTTP authoring stays fenced. Recorded in the r166 table. |
| Bettercap `set wifi.ap <BSSID>` showing `SSID: undefined` | Game-side display wart, not a mod bug. Noted so nobody re-files it. |

## Not run — no tester report in this repo

Written in plan docs, never recorded as run. **Not blockers**: the runtime paths
are covered by unit tests (`src/compiler/__tests__/scheduleBeat.test.ts`). They
are the only in-game checks left anywhere in the project, and they can all be
done in one sitting if a future round touches the Timer:

> **Zeis is running S-01 / S-03 / S-05 / S-15 now (2026-09-18).** Whatever he
> reports lands here and moves those rows to *Verified* — ask him rather than
> re-running them.

- **S-01 fire / S-02 reload / S-03 cancel** — the delay-mode rows (r172).
- **S-05 daytime fire / S-06 past time / S-07 `scheduleAt` reload / S-08 multi-day** — r173's calendar rows (needed a manual edit in the editor).
- **S-09…S-12** — one month on, short-month clamp, what `NEXT EVENT` shows, a pre-r176 `after` project (r176).
- **S-13…S-15** — a mixed `1 month 2 weeks 2 days` offset, Wait in months, an r176-era draft (r177).

How to run them, if ever needed: install `editor-export/` (mod 1.0.7, build
`2026-09-18.r179`) on a throwaway save; `QESdk024TimerQa` auto-starts. Row
definitions: [`r173`](../../docs/plans/r173-timer-rename-and-calendar.md),
[`r176`](../../docs/plans/r176-timer-calendar-ux.md),
[`r177`](../../docs/plans/r177-every-unit.md).
