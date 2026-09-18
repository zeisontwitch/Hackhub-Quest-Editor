# r181 (plan): quiet QA — the mess, and the rows his paste already answered

Zeis, after running the Timer rows:

> Oh boy. That was a bit of a mess. […] The previous QA rounds' test-quests
> (twotter and SDK tests) were still active here, so my game-journal was
> overfilled and the popups these two produced just added to the ridiculous
> amount of popups, toasts, notifications that appeared upon load.

He is right, and the cause is structural rather than bad luck: **every QA quest
we ship auto-starts**. By r180 that was the r166 surface quest, the delay quest,
two new calendar quests and the harness's Twotter probe — five quests starting
at load, four of them with toasting debug nodes and mails, on top of whatever a
save already had claimed from earlier rounds. The checklist was then unusable in
the two ways that matter: the journal could not be read, and toasts could not be
counted. Two skipped rows were explicitly because of this ("I have no idea what
QESdk024WaitMonthQa looks like because the quest journal is so bloated", "I
can't wait 10 real-hours" — the second one being a fair reading of a checklist
that said "read it with `qe24 timers`" but buried it).

## What his transcript actually settles (more than he thinks)

The `qe24 timers` pastes are decisive evidence, and four of the rows he skipped
are answered by them:

| Row | Verdict from his paste |
| --- | --- |
| S-01 fire | **Green** (his words: "Green", though he could not tell which toast was which). |
| S-02 reload | **Green** — after the reload there is exactly **one** Timer B job (same id, same `fireAt`), so nothing double-armed, and it fired once and left the list. |
| S-05 + S-06 | **Green** — the mixed job exists at all, and a Timer suspends its chain: `qe-cal1-t3` could only have armed if both instant rows before it fired. The two instant jobs are gone from the list; the chain moved on. |
| S-07 reload survival | **Green, textbook.** Same five jobs, **same ids and same raw `fireAt`**, before and after save-and-quit-and-reload. |
| S-08 multi-day / S-13 mixed offset | **Green** — armed Fri 18 Sep, the job fires **Tue 3 Nov 18:23**: +1 month → 18 Oct, +2 weeks → 1 Nov, +2 days → 3 Nov, clock pinned to 18:23. That is the clamp-once rule and the mixed row exactly as the editor's preview promises. |
| S-09 one month on / S-14 Wait in months | **Green** — `qe-cal2-t2` fires **18 Oct 19:27**, one month after it armed on 18 Sep at 19:27: same day number, same clock time, through `scheduleAt`. |
| S-11 `NEXT EVENT` | Still open, and partly **my wording's fault** ("Arm anything with a Timer" is jargon; see below). |
| S-03 cancel / S-10 clamp / S-12 + S-15 fixtures | Still open. S-12/S-15 need no waiting at all — they are "open a file in the editor" — which the checklist failed to make obvious. |

One bonus finding worth keeping: the Nov 3 job was armed in CEST (+0200) and
fires after the DST switch in CET (+0100), and the local rendering still reads
**18:23** — the wall-clock promise survives a DST boundary, which matters
because the in-game clock displays local time (S-04).

## The fix: nothing auto-starts, one command starts one quest

The SDK declares what is needed — `Quest.claim(name)` ("programmatically
claim/start a quest by name or class reference") and `Quest.unclaim(name)`
("clear an entry a previous build of the mod left behind").

1. **`autoStart: false` on every QA quest**, including the harness's Twotter
   probe. Load produces **zero** mails and toasts from us.
2. **`toast: false` on the QA debug nodes** (they stay in the journal as log
   lines). One row, one mail is the most noise a tester ever sees.
3. **A new harness command, `qe24 run`**:
   - `qe24 run` lists the five quests with an alias, the title to look for, and
     what that quest covers;
   - `qe24 run cal` (etc.) claims exactly that one quest — so the journal holds
     the one quest the tester is running, not five;
   - `qe24 run clear` unclaims all of them, which is also how an existing save
     clears the leftovers from earlier rounds.
4. **A guard so it cannot come back**: a test asserts no QA quest auto-starts
   and no QA debug node toasts. The noise was a property of the artifacts, so
   the artifacts get the assertion.

Fallback, stated in the command's own output: if a cross-mod `claim` is refused
by the build, the quest title is printed so it can be claimed from the journal
by hand — one quest, so the journal is still readable.

## The checklist, rewritten for a person

`TIMER-ROWS.md` is rebuilt around the new flow: install, `qe24 run`, row. It
also says plainly which rows his paste already closed (above), so he never
re-runs them, and it explains what "arm" means in one line ("the Timer node has
been reached and the game is now holding a job; you do not wait for it, you read
its moment with `qe24 timers`").

## Scope

QA artifacts, their guards and their docs only — the editor itself is unchanged
apart from the build stamp. Stamp `2026-09-18.r181`; harness **1.0.11**; QA
export **1.0.9**.
