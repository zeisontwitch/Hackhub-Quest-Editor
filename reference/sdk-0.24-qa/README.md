# SDK 0.24 QA harness — kept as tooling; five Timer rows are open

Everything this folder was built to verify has been verified, **except two
Timer rows** (S-10, S-11, each needing a specific in-game moment) — and those have their own
step-by-step checklist: **[`TIMER-ROWS.md`](TIMER-ROWS.md)**. Ten of the fifteen
are already answered by the 2026-09-18 run. The one-page ledger is
[`STATUS.md`](STATUS.md); read that for what is settled.

**Playing the rows:** nothing auto-starts. After the 2026-09-18 run turned into a
notification storm (five quests starting at load, four of them toasting), every
QA quest is claimed on demand with the harness command `qe24 run` — `qe24 run`
lists them, `qe24 run <alias>` starts one, `qe24 run clear` removes quests an
older build left behind.

The Twotter probe came back **green on the API path** (2026-09-18, build
25388883): search survives the record shape that used to crash the game, and
accounts can be removed again. The results are in `STATUS.md`.

The folder stays because its export is the installable QA build and its raw mod
is the in-game probe tool future rounds extend. The old step-by-step routes were
removed in r178 once *their* rows were green; the rows that are still open got
theirs back in r180, which is this file's neighbour.

## What is in here

| Path | What it is | State |
| --- | --- | --- |
| [`TIMER-ROWS.md`](TIMER-ROWS.md) | **The checklist for the open Timer rows** — exact steps, what green looks like, what to paste back. | Run these |
| [`STATUS.md`](STATUS.md) | What is verified, blocked, and not run. | Read this first |
| [`QE24-TestResults - 3.md`](QE24-TestResults%20-%203.md) | Zeis's 2026-09-16 in-game transcript of the r166 run. | Evidence |
| [`QE24-TestResults - Twotter.md`](QE24-TestResults%20-%20Twotter.md) | Zeis's 2026-09-18 Twotter transcript (build 25388883) — the report that unblocks the feature. | Evidence |
| [`QE24-TestResults - Timer-Rows.md`](QE24-TestResults%20-%20Timer-Rows.md) | Zeis's first Timer-row transcript, including the `qe24 timers` pastes that answered ten rows at once. | Evidence |
| [`QE24-TestResults-Timer_Rows_2.md`](QE24-TestResults-Timer_Rows_2.md) | Zeis's second Timer run: the S-03 cancel log, the clock panel reading, and the two fixtures that exposed the editor bug. | Evidence |
| `mod/` | The raw in-game harness, mod **1.0.11**. **`qe24 run`** starts a quest on demand (nothing auto-starts any more); **`qe24 timers`** prints every pending Scheduler job with the in-game moment it will fire, so the calendar rows are read instead of waited for. `qe24 twotter` (r179) keeps its results. | Tool |
| `projects/sdk-0.24-ingame-qa.project.json` | The editor-importable project the export is built from (four auto-start quests). | Source of truth for the export |
| `projects/fixture-*.project.json` | Two tiny legacy drafts for the migration rows S-12 and S-15: a pre-r176 `after` project and an r176-era `offsetAmount`/`offsetUnit` one. Open them in the editor. | Fixtures, run by hand |
| `editor-export/` | The installable export (mod 1.0.10, editor build `2026-09-18.r182`; four quests, **none auto-starting** — see `qe24 run`). | **Generated** — never edit by hand |
| `editor-export.notes.md` | Hand-written notes the generator appends to the export README. | — |

Regenerate the export with `npm run gen:qa-export`. The guard test
`src/compiler/__tests__/sdk024QaExport.test.ts` compiles the project in-process
and fails on a single byte of drift; `sdk024QaScaffold.test.ts` guards the
project's Wi-Fi fields and its Timer quest.

## Installing the export

Only needed when a future round asks for a specific in-game check.

1. Use a throwaway save.
2. Copy `editor-export/` into the game's local mods folder and restart.
3. Both quests auto-start: `QESdk024EditorQa` (Wi-Fi and static website) and
   `QESdk024TimerQa` (the Timer).

## Raw harness — commands still available

`qe24 run [timer|cal|wait|probe|twotter|surface|clear]` — **start one quest on demand** ·
`qe24 timers` — **every pending job, and when it fires** ·
`qe24 twotter [guide|status|seed|bad|update|post|cleanup]` ·
`qe24 guide` · `next` · `seed` · `status` · `history` · `clock` · `http-fetch` ·
`schedule N` · `collab` · `intercept on|queue|forward|drop|off` ·
`claim complete|button|retire|unclaim|phone-auto|phone-direct` · `complete` ·
`button-ready` · `retire` · `unclaim` · `phone-auto` · `phone-direct` · `reset`

Fixed values: host `http://qe24-http.test/`; Wi-Fi `QE24-RAW-5G` /
`correct-horse-battery`; BSSID `02:24:00:00:24:01`, channel `44`, WPS `true`.

## Safety

- Throwaway save. `qe24 reset` clears the harness's own per-save state only.
- If an intercept test leaves a request held: `qe24 intercept off`.
