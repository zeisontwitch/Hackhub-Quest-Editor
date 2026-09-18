# Timer rows — how to run them

The checklist for the Timer QA rows (**S-01 … S-15**). It lives here because
this is the folder you install from; the ledger of what is settled is
[`STATUS.md`](STATUS.md).

## Read this first: nine of the fifteen rows are already answered

Your 2026-09-18 run closed them. Do not re-run them — see
[`STATUS.md`](STATUS.md) for the evidence:

| Closed | Why |
| --- | --- |
| **S-01** fire, **S-02** reload | Timer A/B fired; after the reload the same job ids came back with the same `fireAt` and nothing double-armed. |
| **S-05**, **S-06** | The calendar quest's third row *armed at all* — a Timer suspends its chain, so the two instant rows before it must have fired. |
| **S-07** reload survival | Same five jobs, same ids, same raw timestamps before and after save/quit/reload. |
| **S-08**, **S-13** | The mixed row resolved to **Tue 3 Nov, 18:23** — 18 Sep + 1 month + 2 weeks + 2 days, clock pinned. |
| **S-09**, **S-14** | `Wait 1 month` resolved to **18 Oct, 19:27** — one month on, same day number, same clock time. |

**Still open: S-03, S-10, S-11, S-12, S-15.** None of them needs waiting.

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

## The rows that are left

| Row | Do this | Green looks like |
| --- | --- | --- |
| **S-03** cancel | `qe24 run timer`. Timer B is 2 in-game hours out. Claim the quest, then **complete or abandon it** from the journal, then wait ~2 real minutes. | Timer B never fires, and the log says `cancelled 1 pending timer(s)`. |
| **S-10** short-month clamp | Only if today's in-game date is the **29th, 30th or 31st** — otherwise skip it (the clamp is unit-tested). `qe24 run wait`, then `qe24 timers`. | The month job's day is the last day of the next month, not a roll into the one after. |
| **S-11** clock panel | `qe24 run wait`, then `qe24 timers` to confirm the month job is pending. Open the game's **clock panel** (the one with `NEXT EVENT`). | **Just tell us what you see.** Does the pending job appear in `NEXT EVENT` at all, and in what units? Either answer is useful — nothing to pass or fail. |
| **S-12** pre-r176 draft | In the **editor**: Open project → `reference/sdk-0.24-qa/projects/fixture-pre-r176-after.project.json`. Look at the Timer node. | **When it fires** reads **Wait** and the hours box shows **2**. Nothing empty or zeroed. |
| **S-15** r176-era draft | Same, with `fixture-r176-coming-day.project.json`. | The **Weeks** box shows **2** and the clock shows **18:23**. |

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
