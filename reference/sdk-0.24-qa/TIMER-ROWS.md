# Timer rows — how to run them

This is the checklist for the Timer QA rows (**S-01 … S-15**). It lives here
because this is the folder you install from; the one-page ledger of what is
already settled is [`STATUS.md`](STATUS.md).

**One install covers every row below.** You need:

| What | Where |
| --- | --- |
| The editor's QA quests (auto-start) | `editor-export/` — mod **1.0.8**, editor build r180 |
| The terminal harness (for `qe24 timers` / `qe24 clock`) | `mod/` — harness **1.0.10** |
| Two old drafts for the migration rows | `projects/fixture-*.project.json` |

Install both on a **throwaway save**. `QESdk024TimerQa`,
`QESdk024TimerCalQa` and `QESdk024WaitMonthQa` all start by themselves.

## The one command that saves you waiting

```
qe24 timers
```

It prints **every pending Scheduler job on the save, from any mod** — including
the editor export's — with the exact moment each one will fire, in the same
local rendering as the on-screen clock, plus how long that is in in-game units
and in real seconds. A Timer that says "1 month" is checked in seconds, not in
a month. If it prints *No pending jobs*, the journal you are looking at lists
them, not the game — that was the gap this command closes.

`qe24 clock` still prints `Time.now` in both renderings, which is how you
convert a `qe24 timers` line if your machine is not on UTC.

## Run order

Everything is quick except the two rows that are *supposed* to be far away —
those are read, not waited for. Do them in this order and it is one sitting.

| Row | Do this | Green looks like | If it is red |
| --- | --- | --- | --- |
| **S-01** fire | Install `editor-export/`, load the save. A debug toast announces `timer quest started`. | Within ~2 seconds (2 in-game minutes): mail **“Timer A arrived (S-01 green)”** and a `Timer A fired` toast. | Paste the log lines from load to the 2-minute mark. |
| **S-02** reload | As soon as Timer A lands, save, quit to the main menu, load again. Wait ~2 real minutes (Timer B is 2 in-game hours). | `Timer B fired` toast **exactly once**. | A second toast, or none: paste the log — the arm line names the job id. |
| **S-03** cancel | Fresh save (or the same one, before Timer B is due). Abandon or complete `QESdk024TimerQa` from the quest log, then wait 2 real minutes. | Timer B **never** fires, and the log says `cancelled 1 pending timer(s)`. | Paste the log from the cancel onwards. |
| **S-04** zone | *Settled 2026-09-18 — no need to run it again.* | — | — |
| **S-05** a coming day | Nothing to do: `QESdk024TimerCalQa` runs it on load. | Mail **“S-05 green: 'a coming day, 0 days at 00:00' fired immediately”** within seconds. | Paste the log; the arm line names the rule and the moment it resolved to. |
| **S-06** past time | Nothing to do: the same quest runs it first. | Mail **“S-06 green: an exact date in the past fired immediately”** within seconds. | Same as S-05. |
| **S-07** reload survival | Right after load: `qe24 timers`, note the job whose payload says `nodeId=qe-cal1-t3`. Save, quit to the main menu, reload, run `qe24 timers` again. | The same job is still listed, at the same moment, and the log says `already armed - not double-arming` rather than arming a second one. | Paste both `qe24 timers` outputs. |
| **S-08** multi-day | Same job as S-07 (it is `1 month 2 weeks 2 days` out). | The `qe24 timers` line names a day that is 1 month 2 weeks 2 days after today's in-game date, at 18:23 in-game. | Paste the line plus `qe24 clock`. |
| **S-09** one month on | `QESdk024WaitMonthQa` runs on load: first a 1-minute Wait, then a `Wait 1 month`. After the first mail arrives, run `qe24 timers`. | The remaining job's day number is the same as today's (or the last day of a shorter month), at the same clock time. | Paste the line. |
| **S-10** short-month clamp | Run the same row **when the in-game date is the 29th, 30th or 31st**. Otherwise skip it — the clamp is unit-tested (`src/schema/__tests__/timerCalendar.test.ts`). | `qe24 timers` shows the target day as the last day of the next month, not a roll into the month after (31 Jan → 28/29 Feb). | Paste the line and today's in-game date. |
| **S-11** `NEXT EVENT` panel | Arm anything with a Timer (the `QESdk024WaitMonthQa` job is ideal). Open the in-game clock panel. | Record **whether the mod's job appears in `NEXT EVENT` at all**, and in what units (`2d 4h`-style?). Either answer is fine — this is a fact-finding row, not a pass/fail. | n/a. |
| **S-12** pre-r176 draft | Open `projects/fixture-pre-r176-after.project.json` in the editor (Open project), look at the Timer node, then export and install it if you want the fire too. | **When it fires** reads **Wait** and the hours box shows **2**; nothing is empty or zeroed; it fires about 2 in-game hours later. | Screenshot the node. |
| **S-13** mixed calendar | Same job as S-07/S-08 (`1 month 2 weeks 2 days at 18:23`). | `qe24 timers` shows the day the node's own preview sentence names, at 18:23. | Paste the line and what the editor's preview sentence said. |
| **S-14** Wait in months | Same quest as S-09. | The month job is present and resolves through `scheduleAt` (log line says `armed after 1mo -> in-game …`), not through a 30-day duration. | Paste the log line. |
| **S-15** r176-era draft | Open `projects/fixture-r176-coming-day.project.json` in the editor. | The **Weeks** box shows **2** and the clock shows **18:23** — the r176 amount+unit pair landed in the right box. Re-exporting gives identical behaviour. | Screenshot the node. |

Nothing here needs the real clock: every Timer resolves against the **in-game**
clock, which is what the rows are checking.

## Why so few of these actually wait

`qe24 timers` reads the moment the engine was handed, which is the whole
question for the calendar rows — "does 31 January plus one month land in
February?". Only S-01/S-02/S-03 and the two instant rows are watched firing,
because those are the ones where *if* it fires is the question. The rest are
answered the moment they arm.

## What to paste back

The `qe24 timers` output, the log lines it names, and — for anything that did
not behave — the in-game clock reading at the time. That is enough to tell
"wrong moment" from "never armed" from "fired twice".
