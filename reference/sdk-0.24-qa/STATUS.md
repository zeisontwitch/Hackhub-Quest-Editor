# QE24 QA status (2026-09-18)

One page, so nobody re-runs a finished check. **The Twotter probe is answered and
so are ten of the fifteen Timer rows** — five remain, none of which needs
waiting: [`TIMER-ROWS.md`](TIMER-ROWS.md). A future round that
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

## Settled: the Timer rows (S-01…S-09, S-13, S-14) — answered 2026-09-18

Game **1.3.1**, Steam build **25388883**, harness 1.0.10 / export 1.0.8. Raw
transcript: [`QE24-TestResults - Timer-Rows.md`](QE24-TestResults%20-%20Timer-Rows.md).

| Row | Result | Evidence |
| --- | --- | --- |
| S-01 fire | **Green** | Timer A's mail/toast landed ~2 in-game minutes after load (the tester could not tell one toast from another — the notification storm this round fixed). |
| S-02 reload | **Green** | After save → quit → reload there was exactly **one** Timer B job, same id (`3xGYDqlxrQ`) and the same raw `fireAt`, so nothing double-armed; it fired once and left the list. |
| S-05 coming day | **Green** | The mixed row armed — and a Timer suspends its chain, so `qe-cal1-t1` and `qe-cal1-t2` (an exact date already past, a coming day already past today) must both have fired first. Their jobs are gone from the list; the chain moved on. |
| S-06 past time | **Green** | Same evidence as S-05. |
| S-07 reload survival | **Green** | The same five jobs with **identical ids and raw `fireAt`** before and after a save/quit/reload (3 editor jobs, 2 game jobs). |
| S-08 multi-day / S-13 mixed | **Green** | Armed Fri 18 Sep; the job fires **Tue 3 Nov 18:23** — +1 month → 18 Oct, +2 weeks → 1 Nov, +2 days → 3 Nov, clock pinned to 18:23. Exactly the clamp-once rule and the preview sentence the editor shows. |
| S-09 one month on / S-14 Wait in months | **Green** | `Wait 1 month` resolved through `scheduleAt` to **18 Oct 19:27** — one month on, same day number, same clock time as the moment it armed. |

**Bonus: the calendar rows survive a DST boundary.** The 3 Nov job was armed on
18 Sep in CEST (+0200) and fires after the local switch to CET (+0100), and the
local rendering still reads **18:23** — the promised wall-clock time holds. That
matters because the in-game clock displays local time (S-04).

Still open, and none of them needs waiting: **S-03** (cancel), **S-10**
(short-month clamp — needs a 29th–31st in-game date, and is unit-tested), **S-11**
(does a pending job show in `NEXT EVENT`; fact-finding, not pass/fail), **S-12**
and **S-15** (two old drafts to open in the editor — no game at all).
[`TIMER-ROWS.md`](TIMER-ROWS.md) has the steps.

### The mess, and what caused it

The tester's own summary — *"a bit of a mess"* — was correct and is our fault:
by r180 the export plus harness auto-started **five** QA quests at load, four of
them with toasting debug nodes, on top of quests an earlier build had left
claimed on the save. The journal could not be read and a toast could not be
counted, and two rows were skipped explicitly because of it.

Fixed in r181: **no QA quest auto-starts** (harness 1.0.11 and export 1.0.9
both), QA debug nodes no longer toast, and the harness gained `qe24 run` —
`qe24 run` lists the quests, `qe24 run <alias>` claims exactly one, and
`qe24 run clear` unclaims everything (which is also how an existing save clears
the leftovers). Two guards assert that no QA quest auto-starts and no QA debug
node toasts, so the noise cannot come back quietly.

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
| Timer rows S-01…S-09, S-13, S-14 | This file, above — game 1.3.1, build 25388883, report 2026-09-18 |

## Blocked, or deliberately not supported

| Row | Status |
| --- | --- |
| `curl` checks | **Blocked** — absent in the tested build even though the 1.3.0 changelog lists curl as added in that patch. Re-check with one command (`curl http://qe24-http.test/`) on the 1.3.1 build; do **not** re-run the HTTP checks, which are green through the Browser and `Http.fetch`. |
| DNS-only collaborator lookup | Unsupported in that build; Browser-based collaborator hits are green. Fenced and documented in [`docs/plans/r167-wifi-exposure-and-sdk024-roadmap.md`](../../docs/plans/r167-wifi-exposure-and-sdk024-roadmap.md). |
| Editor HTTP events on static websites | Static pages load, but their Browser traffic did not tick `Http.Request`/`Http.Response`; HTTP authoring stays fenced. Recorded in the r166 table. |
| Bettercap `set wifi.ap <BSSID>` showing `SSID: undefined` | Game-side display wart, not a mod bug. Noted so nobody re-files it. |

## Not run — five Timer rows

**S-03** (cancel), **S-10** (short-month clamp), **S-11** (`NEXT EVENT`) and the
two fixture rows **S-12** / **S-15**. Steps and what green looks like:
[`TIMER-ROWS.md`](TIMER-ROWS.md). S-12 and S-15 are opening a file in the editor;
none of the five needs waiting for a Timer.

They are **not blockers**: the runtime paths are covered by unit tests
(`src/compiler/__tests__/scheduleBeat.test.ts`), and harness **1.0.11**'s
`qe24 timers` prints every pending Scheduler job with the in-game moment it will
fire, so a "1 month" row is read rather than waited for.

Install `editor-export/` (mod 1.0.9, build `2026-09-18.r181`) and `mod/`
(harness 1.0.11) on a throwaway save. **Nothing auto-starts**: `qe24 run` lists
the quests, `qe24 run <alias>` claims one, `qe24 run clear` removes quests an
older build left behind. Row definitions:
[`r173`](../../docs/plans/r173-timer-rename-and-calendar.md),
[`r176`](../../docs/plans/r176-timer-calendar-ux.md),
[`r177`](../../docs/plans/r177-every-unit.md).
