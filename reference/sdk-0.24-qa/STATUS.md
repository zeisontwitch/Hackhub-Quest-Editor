# QE24 QA status — closed 2026-09-18

One page, so nobody re-runs a finished check. **Nothing is pending in this
folder.** A future round that needs an in-game check adds a *new* row here and a
new harness version — never a re-run of the ones below.

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
| `curl` checks | **Blocked** — absent in the tested build. The official 1.3.0 changelog lists curl as *added* in that patch, so the tested build likely predates it: worth one re-check on a newer build, not a re-run of the HTTP checks (which are green through the Browser and `Http.fetch`). |
| DNS-only collaborator lookup | Unsupported in that build; Browser-based collaborator hits are green. Fenced and documented in [`docs/plans/r167-wifi-exposure-and-sdk024-roadmap.md`](../../docs/plans/r167-wifi-exposure-and-sdk024-roadmap.md). |
| Editor HTTP events on static websites | Static pages load, but their Browser traffic did not tick `Http.Request`/`Http.Response`; HTTP authoring stays fenced. Recorded in the r166 table. |
| Bettercap `set wifi.ap <BSSID>` showing `SSID: undefined` | Game-side display wart, not a mod bug. Noted so nobody re-files it. |

## Not run — no tester report in this repo

Written in plan docs, never recorded as run. **Not blockers**: the runtime paths
are covered by unit tests (`src/compiler/__tests__/scheduleBeat.test.ts`). They
are the only in-game checks left anywhere in the project, and they can all be
done in one sitting if a future round touches the Timer:

- **S-01 fire / S-02 reload / S-03 cancel** — the delay-mode rows (r172).
- **S-05 daytime fire / S-06 past time / S-07 `scheduleAt` reload / S-08 multi-day** — r173's calendar rows (needed a manual edit in the editor).
- **S-09…S-12** — one month on, short-month clamp, what `NEXT EVENT` shows, a pre-r176 `after` project (r176).
- **S-13…S-15** — a mixed `1 month 2 weeks 2 days` offset, Wait in months, an r176-era draft (r177).

How to run them, if ever needed: install `editor-export/` (mod 1.0.6, build
`2026-09-18.r178`) on a throwaway save; `QESdk024TimerQa` auto-starts. Row
definitions: [`r173`](../../docs/plans/r173-timer-rename-and-calendar.md),
[`r176`](../../docs/plans/r176-timer-calendar-ux.md),
[`r177`](../../docs/plans/r177-every-unit.md).
