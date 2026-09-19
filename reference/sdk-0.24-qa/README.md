# SDK 0.24 QA harness — kept as tooling, now carrying the P-01 backdate row

**Everything this folder was built to verify is verified, or shelved by the
author's decision — with one new row on top.** The Timer rows (S-01…S-15) are
closed: S-11's answer is in [`STATUS.md`](STATUS.md) — `NEXT EVENT` does show a
mod's job when it is the nearest — and S-10 (short-month clamp) is shelved
deliberately, unit-tested either way. [`TIMER-ROWS.md`](TIMER-ROWS.md) keeps the
steps for the record.

**[P-01a and P-01b](P-01-BACKDATE.md) are both green** (2026-09-18): the
platform keeps a `sendedAt` we send — all three spellings read "a month ago" —
and a profile sorts by time with the **newest at the top**. Backdated series
ship on the API path, and the editor's preview mirrors the game's order. Here
too, **nothing is left to run**; the one-page ledger is
[`STATUS.md`](STATUS.md).

**Playing the rows:** nothing auto-starts. After the 2026-09-18 run turned into a
notification storm (five quests starting at load, four of them toasting), every
QA quest is claimed on demand with the harness command `qe24 run` — `qe24 run`
lists them, `qe24 run <alias>` starts one, `qe24 run clear` removes quests an
older build left behind.

The Twotter probe came back **green on the API path** (2026-09-18, build
25388883): search survives the record shape that used to crash the game, and
accounts can be removed again. The probe's results, the first editor-row run and the four rows
still open (T-15b, and the abandon half of T-11b) are in `STATUS.md`.

The folder stays because its export is the installable QA build and its raw mod
is the in-game probe tool future rounds extend. The old step-by-step routes were
removed in r178 once *their* rows were green; the rows that are still open got
theirs back in r180, which is this file's neighbour.

## What is in here

| Path | What it is | State |
| --- | --- | --- |
| [`P-01-BACKDATE.md`](P-01-BACKDATE.md) | **P-01a and P-01b both answered green** (backdated tweets keep their time; a profile shows the newest first), with the result tables and Zeis's one-liners. Which mod, the exact commands, which account — kept for the record. Harness **1.0.13** then; **1.0.14** added the audit below. | Answered |
| [`TIMER-ROWS.md`](TIMER-ROWS.md) | The Timer rows' checklist — every row answered or shelved; kept for the record. | Reference |
| [`STATUS.md`](STATUS.md) | What is verified, blocked, and not run. | Read this first |
| [`QE24-TestResults - 3.md`](QE24-TestResults%20-%203.md) | Zeis's 2026-09-16 in-game transcript of the r166 run. | Evidence |
| [`QE24-TestResults - Twotter.md`](QE24-TestResults%20-%20Twotter.md) | Zeis's 2026-09-18 Twotter transcript (build 25388883) — the report that unblocks the feature. | Evidence |
| [`QE24-TestResults-Twotter.md`](QE24-TestResults-Twotter.md) | Zeis's **r185 editor-row run** (game 1.3.1) with the game log — the transcript that answered T-08…T-14, found the two runtime bugs, and left T-11b/T-12b/T-15b/T-09c open. | Evidence, newest |
| [`QE24-TestResults - Timer-Rows.md`](QE24-TestResults%20-%20Timer-Rows.md) | Zeis's first Timer-row transcript, including the `qe24 timers` pastes that answered ten rows at once. | Evidence |
| [`QE24-TestResults-Timer_Rows_2.md`](QE24-TestResults-Timer_Rows_2.md) | Zeis's second Timer run: the S-03 cancel log, the clock panel reading, and the two fixtures that exposed the editor bug. | Evidence |
| `mod/` | The raw in-game harness, mod **1.0.15**. **`qe24 run`** starts a quest on demand (nothing auto-starts any more) and now lists **`tw1`** / **`tw2`** / **`tw3`**, the editor export's Twotter quests; **`qe24 timers`** prints every pending Scheduler job with the in-game moment it will fire; **`qe24 twotter backdate`** (P-01a) and **`qe24 twotter order`** (P-01b) are answered; **`qe24 twotter audit`** (r185) lists the round's handles and flags the r31 poison shape, which is how T-10/T-11/T-12 are read. `qe24 twotter` (r179) keeps its results. | Tool |
| `projects/sdk-0.24-ingame-qa.project.json` | The editor-importable project the export is built from: seven quests, **none auto-starting**, plus the mod-level Twotter account `qe24_editor` the T-08…T-13 rows read. | Source of truth for the export |
| `projects/fixture-*.project.json` | Three tiny legacy drafts, opened in the editor, no game needed: S-12's pre-r176 `after` project, S-15's r176-era amount/unit one, and **T-14's r30 Twotter draft** (quest-level accounts, one node per tweet, four time spellings). | Fixtures, run by hand |
| `editor-export/` | The installable export (mod **1.0.16**, editor build `2026-09-18.r188`; seven quests, **none auto-starting** — see `qe24 run`). This is the mod under test for the open Twotter rows (T-15b, and the abandon half of T-11b); install it beside the raw harness. | **Generated** — never edit by hand |
| `editor-export.notes.md` | Hand-written notes the generator appends to the export README. | — |

Regenerate the export with `npm run gen:qa-export`. The guard test
`src/compiler/__tests__/sdk024QaExport.test.ts` compiles the project in-process
and fails on a single byte of drift; `sdk024QaScaffold.test.ts` guards the
project's Wi-Fi fields and its Timer quest.

## Installing the export

Only needed when a future round asks for a specific in-game check.

1. Use a throwaway save.
2. Copy `editor-export/` (and, for the Twotter rows, `mod/`) into the game's
   local mods folder and restart.
3. Nothing auto-starts. Claim one quest at a time with the harness:
   `qe24 run tw1` (the Twotter series), `qe24 run tw2` (the shared account),
   `qe24 run tw3` (the `Twotter.Post` canary), `qe24 run timer`, `qe24 run cal`,
   `qe24 run wait`, `qe24 run surface`.
   `qe24 run clear` sheds quests an older build left claimed.

## Raw harness — commands still available

`qe24 run [timer|cal|wait|probe|twotter|tw1|tw2|tw3|surface|clear]` — **start one quest on demand** ·
`qe24 timers` — **every pending job, and when it fires** ·
`qe24 twotter [guide|status|seed|bad|update|post|backdate|order|audit|cleanup]` ·
`qe24 guide` · `next` · `seed` · `status` · `history` · `clock` · `http-fetch` ·
`schedule N` · `collab` · `intercept on|queue|forward|drop|off` ·
`claim complete|button|retire|unclaim|phone-auto|phone-direct` · `complete` ·
`button-ready` · `retire` · `unclaim` · `phone-auto` · `phone-direct` · `reset`

Fixed values: host `http://qe24-http.test/`; Wi-Fi `QE24-RAW-5G` /
`correct-horse-battery`; BSSID `02:24:00:00:24:01`, channel `44`, WPS `true`.

## Safety

- Throwaway save. `qe24 reset` clears the harness's own per-save state only.
- If an intercept test leaves a request held: `qe24 intercept off`.
