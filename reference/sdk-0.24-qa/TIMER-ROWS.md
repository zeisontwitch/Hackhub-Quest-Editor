# Timer rows — how to run them

The checklist for the Timer QA rows (**S-01 … S-15**). It lives here because
this is the folder you install from; the ledger of what is settled is
[`STATUS.md`](STATUS.md).

## Done — every row is answered or shelved

Your 2026-09-18 run closed them. Do not re-run them — see
[`STATUS.md`](STATUS.md) for the evidence:

| Closed | Why |
| --- | --- |
| **S-01** fire, **S-02** reload | Timer A/B fired; after the reload the same job ids came back with the same `fireAt` and nothing double-armed. |
| **S-03** cancel | Abandoning the quest stopped Timer B: nothing popped after two real minutes, and the log ends with `OnAbandon: finished` after cancelling the pending timer. |
| **S-12**, **S-15** | Both migration fixtures open on their quest and show the migrated values: **Wait** + hours **2**, and **A coming day** with the clock at **18:23** and the card reading `in 2w at 18:23`. |
| **S-05**, **S-06** | The calendar quest's third row *armed at all* — a Timer suspends its chain, so the two instant rows before it must have fired. |
| **S-07** reload survival | Same five jobs, same ids, same raw timestamps before and after save/quit/reload. |
| **S-08**, **S-13** | The mixed row resolved to **Tue 3 Nov, 18:23** — 18 Sep + 1 month + 2 weeks + 2 days, clock pinned. |
| **S-09**, **S-14** | `Wait 1 month` resolved to **18 Oct, 19:27** — one month on, same day number, same clock time. |

**S-11 is green** — `qe24 schedule 120` changed the clock panel's `NEXT EVENT` to
**1 h 55 m, ticking down**, so mod jobs do appear there when the job is the
nearest one.

**S-10 is shelved** by the author's decision (it needs an in-game date on the
29th–31st, and the two runs that tried it landed elsewhere). Not a pass: the
clamp logic is unit-tested, and the row comes back only if a bug report asks for
it. Nothing here needs running.

**About the two fixture rows:** S-12 and S-15 were **editor-only** — open the
file, read the boxes, done. No export, no install, no in-game step. (They were
also blocked for two runs: the editor used to open those fixtures on an empty
canvas, fixed in r182; and the four-box "In" row was clipped off the right edge
of the docked inspector, fixed in r183 — if you still see clipped boxes, say so,
that is a bug.)

## What changed since that run: nothing starts by itself

You were right that it was a mess — five QA quests auto-started at load, four
with toasts, on top of quests an earlier build had left claimed. That is fixed:

- **No QA quest auto-starts any more.** Loading a save produces no QE24 mail,
  toast or journal line.
- **One command starts one row** (harness **1.0.11**):

```
qe24 run              list the quests you can start
qe24 run cal          the calendar rows (S-05/S-06/S-07/S-13)
qe24 run wait         Wait in months (S-09/S-14)
qe24 run timer        the delay rows (S-01/S-02/S-03)
qe24 run clear        clear quests an older build left claimed - run this once
```

Run `qe24 run clear` **once** on your save to get rid of the leftovers from the
old rounds, then claim one row at a time. The command prints the journal title
to look for; if the build ever refuses a cross-mod claim, claim that title
yourself — one quest, so the journal stays readable.

## The last two rows, for the record

| Row | State | Evidence |
| --- | --- | --- |
| **S-11** clock panel | **Green** | `qe24 schedule 120` → the panel's `NEXT EVENT` read **1 h 55 m and ticked down**, so a mod job shows there when it is the nearest. |
| **S-10** short-month clamp | **Shelved** by the author's decision | Needs a 29th–31st in-game date; two runs landed on other days. The logic is unit-tested (`timerCalendar.test.ts`). |

That is the whole list. S-12 and S-15 are just opening a file — no game needed.

## `qe24 timers` and what "armed" means

**Armed** = the story reached the Timer node and the game is now holding a job
for it. You never wait for it: `qe24 timers` prints the exact moment it will
fire, in the same local rendering as the on-screen clock, plus the payload that
says which quest and node armed it.

```
qe24 timers
```

Look for `payload: questId=qe-cal2 nodeId=qe-cal2-t2` (the month row) or
`nodeId=qe-cal1-t3` (the mixed row). If it prints *No pending jobs*, the row has
not armed — run `qe24 run` first and give it a second.

## If something looks wrong

Paste the `qe24 timers` output and the log lines it names. That is enough to
tell "wrong moment" from "never armed" from "fired twice" — no waiting, no
guessing.

**Where the mod's log lines are:** everything this mod writes starts with
`[quest-editor]`. Search the game log for that word and you get the arm, fire,
cancel and cleanup lines in order — the cancel line for S-03 was in a pasted log
for an hour before we noticed it, because the checklist never said where to
look.
