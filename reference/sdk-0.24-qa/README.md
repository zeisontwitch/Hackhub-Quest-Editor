# SDK 0.24 QA harness — kept as tooling; one probe open

Everything this folder was built to verify has been verified, **except the
Twotter probe (r179)** — that one is open by design, and it is the only thing
here that needs running. The one-page ledger is [`STATUS.md`](STATUS.md); read
that, not this file.

The folder stays because its export is the installable QA build and its raw mod
is the in-game probe tool future rounds extend. The old step-by-step routes were
removed in r178 once their rows were green, so the only thing to run is the one
labelled open below.

## What is in here

| Path | What it is | State |
| --- | --- | --- |
| [`STATUS.md`](STATUS.md) | What is verified, blocked, and not run. | Read this first |
| [`QE24-TestResults - 3.md`](QE24-TestResults%20-%203.md) | Zeis's 2026-09-16 in-game transcript of the r166 run. | Evidence |
| `mod/` | The raw in-game harness, mod **1.0.9**. **Open probe: `qe24 twotter`** (r179). Everything else is tooling (`seed`, `status`, `history`, `clock`, `reset`). | Tool, one open probe |
| `projects/sdk-0.24-ingame-qa.project.json` | The editor-importable project the export is built from. | Source of truth for the export |
| `editor-export/` | The installable export (mod 1.0.6, editor build `2026-09-18.r178`; quests `QESdk024EditorQa` and `QESdk024TimerQa`). | **Generated** — never edit by hand |
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

`qe24 twotter [guide|status|seed|bad|update|post|cleanup]` — **the open probe** ·
`qe24 guide` · `next` · `seed` · `status` · `history` · `clock` · `http-fetch` ·
`schedule N` · `collab` · `intercept on|queue|forward|drop|off` ·
`claim complete|button|retire|unclaim|phone-auto|phone-direct` · `complete` ·
`button-ready` · `retire` · `unclaim` · `phone-auto` · `phone-direct` · `reset`

Fixed values: host `http://qe24-http.test/`; Wi-Fi `QE24-RAW-5G` /
`correct-horse-battery`; BSSID `02:24:00:00:24:01`, channel `44`, WPS `true`.

## Safety

- Throwaway save. `qe24 reset` clears the harness's own per-save state only.
- If an intercept test leaves a request held: `qe24 intercept off`.
