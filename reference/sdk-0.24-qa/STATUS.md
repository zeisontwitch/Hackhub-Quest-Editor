# QE24 QA status (2026-09-18)

One page, so nobody re-runs a finished check. **The Twotter probe is answered;
the Timer rows are the only thing left to run**, and they now have their own
step-by-step checklist: [`TIMER-ROWS.md`](TIMER-ROWS.md). A future round that
needs an in-game check adds a *new* row here and a new harness version — never a
re-run of the ones below.

## Settled: the Twotter probe (r179 → answered 2026-09-18)

**Answer: Twotter can come back — on the API path.** Game 1.3.0, Steam build
**25388883**, throwaway save, harness 1.0.9, results in
[`QE24-TestResults - Twotter.md`](QE24-TestResults%20-%20Twotter.md).

The crash that forced the r31 removal is gone, and the two things the old report
said were impossible now work:

| Row | Result |
| --- | --- |
| T-01 seed → search `qe24_probe` | **Pass.** `createUser` + `addUser` produced a real account — the engine filled name, surname, avatar, banner, followers, following and password. Search found it and the profile showed its bio. |
| T-02 search `qe24_badrecord` | **Pass — the one that mattered.** A record planted with `bio: undefined` (the exact r31 shape) was listed in search with no crash and no freeze. The read path is guarded. |
| T-03 save → reload → `status` | **Red, and it does not matter.** The bad record's bio was *still* `undefined` after the reload, so 1.3.0's "affected saves are repaired on load" did **not** manifest for a record written this way. Now that T-02 is green the read path is safe regardless — but nothing may rely on a repair of existing saves. |
| T-04 `qe24 twotter update` | **Not run.** The repair call is still unverified; it is no longer load-bearing, because we will not be writing records that need repairing. |
| T-05 `qe24 twotter post` → profile | **Pass.** The tweet appeared on the profile immediately and the post objective ticked — `Twotter.PostSeen` fires. |
| T-06 `qe24 twotter cleanup` | **Pass.** `removeUser` returned `true` for all three accounts, including the **quest-declared** one, and the handles disappeared from search. The old report's "no mod can repair this" is answered. |
| T-07 profile of `qe24_declared` | **Pass at the record level.** The quest-*declared* account carries the bio from the quest definition (`"Declared by the quest definition, not by the API."`) — the write path the old bug broke is fixed. The profile screen itself was not reported on. |

**One finding for the re-implementation round:** `Twotter.AccountCreated` did
**not** fire for an account added through the API — the probe's `api-account-seen`
objective stayed open while `PostSeen` ticked normally. Do not build objectives
on `AccountCreated`; use `PostSeen`/`ProfileSeen`.

**Decision:** re-implement Twotter in the editor, authoring accounts and posts
through `createUser`/`addUser`/`postTweet`, never relying on the declarative
`TwotterAccounts` path to write a complete record, and always shipping
`removeUser` cleanup. See
[`docs/plans/r179-twotter-probe.md`](../../docs/plans/r179-twotter-probe.md).

Re-check on a later build (one command each, both optional): `curl
http://qe24-http.test/` for the blocked curl rows, and `qe24 twotter update` for
T-04.

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
| Twotter probe T-01…T-03, T-05…T-07 | This file, above — game 1.3.0, build 25388883, report 2026-09-18 |

## Blocked, or deliberately not supported

| Row | Status |
| --- | --- |
| `curl` checks | **Blocked** — absent in the tested build even though the 1.3.0 changelog lists curl as added in that patch. Re-check with one command (`curl http://qe24-http.test/`) on the 1.3.1 build; do **not** re-run the HTTP checks, which are green through the Browser and `Http.fetch`. |
| DNS-only collaborator lookup | Unsupported in that build; Browser-based collaborator hits are green. Fenced and documented in [`docs/plans/r167-wifi-exposure-and-sdk024-roadmap.md`](../../docs/plans/r167-wifi-exposure-and-sdk024-roadmap.md). |
| Editor HTTP events on static websites | Static pages load, but their Browser traffic did not tick `Http.Request`/`Http.Response`; HTTP authoring stays fenced. Recorded in the r166 table. |
| Bettercap `set wifi.ap <BSSID>` showing `SSID: undefined` | Game-side display wart, not a mod bug. Noted so nobody re-files it. |

## Not run — the Timer rows

The only in-game checks left anywhere in the project. **They have their own
checklist now** — [`TIMER-ROWS.md`](TIMER-ROWS.md) — with the exact steps, what
green looks like and what to paste back, written after the first attempt to run
them failed because the rows existed only as prose in plan docs.

They are **not blockers**: the runtime paths are covered by unit tests
(`src/compiler/__tests__/scheduleBeat.test.ts`). Most can now be checked in
seconds rather than waited out, because harness **1.0.10** adds

```
qe24 timers
```

which prints every pending Scheduler job on the save with the in-game moment it
will fire — so a "1 month" row is read, not waited for.

- **S-01 fire / S-02 reload / S-03 cancel** — the delay rows (r172), in `QESdk024TimerQa`.
- **S-05 daytime / S-06 past time / S-07 reload survival / S-08 multi-day** — r173's calendar rows; the two instant ones fire by themselves in `QESdk024TimerCalQa`, the far-away ones are read with `qe24 timers`.
- **S-09 one month on / S-10 short-month clamp / S-11 `NEXT EVENT` panel / S-12 pre-r176 draft** — r176's rows.
- **S-13 mixed `1 month 2 weeks 2 days` / S-14 Wait in months / S-15 r176-era draft** — r177's rows.

Install `editor-export/` (mod 1.0.8, build `2026-09-18.r180`) on a throwaway
save; the three `QESdk024Timer*Qa` quests all auto-start. Row definitions:
[`r173`](../../docs/plans/r173-timer-rename-and-calendar.md),
[`r176`](../../docs/plans/r176-timer-calendar-ux.md),
[`r177`](../../docs/plans/r177-every-unit.md).
