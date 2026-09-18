# QE24 QA status (2026-09-18)

One page, so nobody re-runs a finished check. **Everything below is closed or
deliberately shelved.** One row (S-10, the short-month clamp) is shelved by the
author's decision rather than passed, and is marked as such. A future round that
needs an in-game check adds a *new* row here and a new harness version — never a
re-run of the ones below.

## Settled: P-01a (r185) — backdated tweets keep the time we send

**Answer: yes, in all three spellings.** Game 1.3.0, build 25388883, harness
1.0.12, throwaway save, Zeis's screenshots 2026-09-18.

| Tweet | Sent with | Read back as |
| --- | --- | --- |
| `qe24-p01-control` | **no time at all** | **"a few seconds ago"** — the engine stamps its own time only when we send none |
| `qe24-p01-iso-ms` | `2026-08-18T19:09:35.285Z` | **"a month ago"** |
| `qe24-p01-iso` | `2026-08-18T19:09:35Z` | **"a month ago"** |
| `qe24-p01-plain` | `2026-08-18 19:09:35` | **"a month ago"** |

The same run showed the profile rendering a complete engine-made record
(banner, avatar, "Joined September 2026", 33 following / 82 followers, the blue
check) and the four counters exactly as authored — `0 reposts · 2 likes · 0
replies`, `22 views` on the detail page. The detail page's absolute line read
"8:09 PM · Aug 18, 2026" for the 19:09Z stamp, an hour behind the machine's
local zone; relative ages are unaffected and the editor computes stamps from the
in-game clock, so it is a note rather than a fence.

**Decision:** the runtime sends `sendedAt` as ISO with milliseconds, computed
from `Time.date()` minus the author's amount and unit. Backdated series ship on
the API path; the editor's fence against the declarative `Tweets` field stays.

## Settled: P-01b (r185) — a profile shows the newest tweet first

**Answer: the profile sorts by time, newest at the top, whatever order we posted
in.** Game 1.3.0, build 25388883, harness 1.0.13, throwaway save, Zeis's report
2026-09-18. `qe24 twotter order` posted A (two months back, first), B (no time →
stamped "now", second) and C (one month back, third); the profile read
**B, C, A** top to bottom.

Decisions that follow: the runtime posts a series **oldest → newest** anyway
(deterministic; the engine sorts the display), the editor's preview mirrors the
game (newest at the top, with a line saying so) while the author's list stays
chronological, and **ties keep posting order** — P-01a's three equal-moment
tweets appeared in the order they were posted.

**One discrepancy, on the record:** the Journalist's Sister transcript reads as
*oldest at the top* ("a year ago" … "all the way down to 8 days ago", hook as the
second-to-last tweet). That is prose about hardcoded questline content in an
earlier build; the probe measured the API path on the build we ship against, and
the declarative `Tweets` path is fenced off, so a mod never depends on the other
behaviour. Details and the reasoning: [`P-01-BACKDATE.md`](P-01-BACKDATE.md).

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

**S-03 (cancel)** is green from the second run, **S-12 / S-15** from the third,
and the last two rows are closed by the fourth: **S-11 green** and **S-10
shelved by the author's decision**. Details below — the folder is done.

### Settled: S-03 cancel, and the miscounting log (second run, 2026-09-18)

Transcript: [`QE24-TestResults-Timer_Rows_2.md`](QE24-TestResults-Timer_Rows_2.md).

The tester claimed `QESdk024TimerQa`, let Timer A fire, **abandoned** the quest
and waited ~2 real minutes: nothing popped. His own pasted log contains the
whole sequence — `timer node qe-tmrf7pia armed after 2m (job T6nLZcpwsu)` →
`timer qe-tmrf7pia fired` → `timer node qe-9b919r74 armed after 2h (job
uO1ZDpc81C)` → `OnAbandon: starting` → `cancelled … pending timer(s)` →
`OnAbandon: finished`. **S-03 is green.**

That log also exposed a small lie: it said **`cancelled 2 pending timer(s)`**
when only one timer was still pending — a job that had already fired stayed in
the mod's list. Fixed in r182 (the handler drops a job the moment it fires), and
guarded by a test that asserts the cancel call names the pending job and not the
fired one.

**Reading the log:** the mod's lines all start with `[quest-editor]`. The cancel
line was in the paste the whole time; the checklist never said where to look, so
it now does.

### S-11 answered in part: `NEXT EVENT` shows the game's own job

With a mod job pending 29 days out, the clock panel read **`NEXT EVENT 4d 6h
[Wait]`** — the *game's* queued post job (23 Sep), not ours. So a mod job does
**not** take the panel's next-event slot ahead of a game job. Whether the panel
can show a mod job *at all* is still open, because ours was never the nearest.

The definitive check needs no new tooling (`TIMER-ROWS.md` has it):
`qe24 schedule 120` arms a harness job two in-game hours out — about two real
minutes — which **is** the nearest. Open the clock panel inside that window. If
it shows that job, mod jobs appear; if it still shows only the game's own, they
never do.

### Settled: S-11 green, S-10 shelved (fourth run, 2026-09-18)

**S-11 — mod jobs DO appear in the game's `NEXT EVENT`.** Running
`qe24 schedule 120` (a two-in-game-hour harness job, about two real minutes)
changed the clock panel's `NEXT EVENT` to **1 h 55 m and it ticked down**. So the
panel does show a mod's scheduled job when that job is the nearest one — the
earlier reading (`4d 6h`, the game's own post queue) was simply the game's job
being nearer, not a fence.

**S-10 — shelved, deliberately.** The short-month clamp needs an in-game date on
the 29th, 30th or 31st; two runs landed on other days and the author's call is
that the row costs more time than it is worth:

> I'm going to make a judgement call and shelf S-10 for now. We have more
> important things to check and this test eats up too much time. If it becomes a
> problem we'll deal with it.

Recorded as a decision, not a pass. The clamp logic stays covered by unit tests
(`src/schema/__tests__/timerCalendar.test.ts` — 31 Jan + 1 month = 28/29 Feb,
leap years included), and the plan's rule stands: if a bug report ever arrives,
that row becomes the first in-game check of the next Timer round.

**Visual pass on the row-fold fix (r183): green.** The author confirms the
inspector rows no longer clip and the layout is "nicely responsive when pushing
or pulling the inspector drawer" — which is the confirmation jsdom could not
give; the tests only asserted the shape of the fix.

### Settled: S-12 and S-15, and the clipped row they exposed (third run)

Both fixtures open on their quest now, and the screenshots show the migration
working:

| Row | Evidence |
| --- | --- |
| **S-12** pre-r176 draft | "When it fires" reads **Wait**, the **Hours** box shows **2**, the readback says "= 2 hours", the canvas card reads **2h**. |
| **S-15** r176-era draft | "When it fires" reads **A coming day**, the clock reads **18:23**, the preview says "Fires in 2 weeks, at 18:23 in-game…", the card reads **in 2w at 18:23** — the r176 amount+unit pair landed in the **Weeks** box. |

(The screenshots came in through the chat rather than the repository, so they are
not committed; what they show is recorded here.)

Both rows are **editor-only**: open the file, read the boxes. No export, no
install, no in-game step — which the tester reasonably asked about, because
`TIMER-ROWS.md` had not said so. It does now.

### The editor bug they found: boxes clipped off the right edge

Screenshot 2 also shows the "In" row's four boxes running past the inspector's
right edge, and the arithmetic makes it inevitable: each cell is 24px of padding
plus a 6px gap plus a ~36px unit caption plus a number box, so the row needs
about **28rem** — and the docked inspector is **340px** wide with a **340px**
floor (a floating drawer can be 280px).

Fixed in r183 by making the row fold: the row is a **container** (`@container`),
so the column count follows the *panel's* width rather than the window's. The
four-box row shows 2 × 2 at the default and opens to one line of four above
28rem; the six-box Wait row keeps its shipped look and only folds in a narrow
floating drawer. Widening the default was rejected on purpose — it would only
move the cliff, since the panel can still be dragged to its 340px floor.

**No test can prove the pixels moved** (jsdom has no layout): the tests assert
the shape of the fix, and the visual confirmation is a screenshot pass. If the
boxes still clip anywhere, that is a bug worth a round of its own.

### The S-12 / S-15 blocker before that: an editor bug, fixed in r182

Both fixtures opened in the editor as **"No quest selected"** with an empty
canvas and the first-run "Browse 13 templates" hint — indistinguishable from a
broken file, and the tester reported them broken.

The cause was ours and not fixture-specific: neither file carries
`editor.activeQuestId` (old, hand-written shapes — exactly what a migration
fixture should be), the schema accepts a missing one as `null`, and no load path
picked a quest. `ProjectSchema` now points the editor at the first quest that
ships whenever the active id is not a quest in the file, so **file load, import,
the autosaved draft, template construction and the export generator** all agree.

S-12 and S-15 are therefore **one look each**: open the file, read the boxes.

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
| Timer row S-03 (cancel) | This file, above — same build, second run |
| Timer rows S-12, S-15 (the two migration fixtures) | This file, above — third run, editor build r183 |
| Timer row S-11 (`NEXT EVENT` and mod jobs) | This file, above — fourth run, harness 1.0.11 |

## Blocked, or deliberately not supported

| Row | Status |
| --- | --- |
| `curl` checks | **Blocked** — absent in the tested build even though the 1.3.0 changelog lists curl as added in that patch. Re-check with one command (`curl http://qe24-http.test/`) on the 1.3.1 build; do **not** re-run the HTTP checks, which are green through the Browser and `Http.fetch`. |
| DNS-only collaborator lookup | Unsupported in that build; Browser-based collaborator hits are green. Fenced and documented in [`docs/plans/r167-wifi-exposure-and-sdk024-roadmap.md`](../../docs/plans/r167-wifi-exposure-and-sdk024-roadmap.md). |
| Editor HTTP events on static websites | Static pages load, but their Browser traffic did not tick `Http.Request`/`Http.Response`; HTTP authoring stays fenced. Recorded in the r166 table. |
| Bettercap `set wifi.ap <BSSID>` showing `SSID: undefined` | Game-side display wart, not a mod bug. Noted so nobody re-files it. |

## Shelved — one Timer row

**S-10**, the short-month clamp: shelved by the author on 2026-09-18 (reason
above). Not a pass — a decision. The logic is unit-tested, and the row returns
only if a bug report asks for it.

They are **not blockers**: the runtime paths are covered by unit tests
(`src/compiler/__tests__/scheduleBeat.test.ts`), and the harness's `qe24 timers`
prints every pending Scheduler job with the in-game moment it will fire, so a
"1 month" row is read rather than waited for. (That section was written when
harness 1.0.11 was current; it is 1.0.13 now — see P-01a/P-01b above.)

Install `editor-export/` (mod 1.0.12, build `2026-09-18.r184`) and `mod/`
(harness 1.0.13) on a throwaway save. **Nothing auto-starts**: `qe24 run` lists
the quests, `qe24 run <alias>` claims one, `qe24 run clear` removes quests an
older build left behind. Row definitions:
[`r173`](../../docs/plans/r173-timer-rename-and-calendar.md),
[`r176`](../../docs/plans/r176-timer-calendar-ux.md),
[`r177`](../../docs/plans/r177-every-unit.md).
