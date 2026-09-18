# SDK 0.24 QA harness — kept as tooling; the Timer rows are open

Everything this folder was built to verify has been verified, **except the
Timer rows (S-01 … S-15)** — and those now have their own step-by-step
checklist: **[`TIMER-ROWS.md`](TIMER-ROWS.md)**. The one-page ledger is
[`STATUS.md`](STATUS.md); read that for what is settled.

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
| `mod/` | The raw in-game harness, mod **1.0.10**. New in r180: **`qe24 timers`**, which prints every pending Scheduler job with the in-game moment it will fire — the command that makes the calendar rows checkable without waiting. `qe24 twotter` (r179) keeps its results. | Tool |
| `projects/sdk-0.24-ingame-qa.project.json` | The editor-importable project the export is built from (four auto-start quests). | Source of truth for the export |
| `projects/fixture-*.project.json` | Two tiny legacy drafts for the migration rows S-12 and S-15: a pre-r176 `after` project and an r176-era `offsetAmount`/`offsetUnit` one. Open them in the editor. | Fixtures, run by hand |
| `editor-export/` | The installable export (mod 1.0.8, editor build `2026-09-18.r180`; quests `QESdk024EditorQa`, `QESdk024TimerQa`, `QESdk024TimerCalQa`, `QESdk024WaitMonthQa`). | **Generated** — never edit by hand |
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

`qe24 timers` — **the Timer rows' reader: every pending job, and when it fires** ·
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
