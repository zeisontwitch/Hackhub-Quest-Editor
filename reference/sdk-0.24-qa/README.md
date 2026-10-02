# SDK 0.24 QA harness — kept as tooling, now carrying the P-01 backdate row

## Results first — both probes have been run (2026-09-28, game 1.3.13)

Everything both runs established, with the evidence and the three corrections
made along the way, is in
[`QE24-TestResults-DynProbe-ModSettings.md`](QE24-TestResults-DynProbe-ModSettings.md).
Zeis's own minute-by-minute log with the screenshots is on the `QA-filedump`
branch. **The build to install now is `delivery/qe-sdk-024-dynprobe-1.4.0.zip`** — if the quest does not appear on the Hackhub feed, try a fresh save first (run 2 showed it surfacing on one); if it still does not, type `qedyn claim` in the terminal or claim it from the sandbox group in the journal.
— see the dynamic-page section below for what changed.

## ANSWERED: the ModSettings Probe (r239/r240) — the whole loop works

**ANSWERED (2026-09-28): the UI is in the MAIN MENU** — *Main menu → Settings
→ Mods → the tiny grey "Settings" word on the mod's row.* Not the in-game
Settings program (the desktop OS simulator), not the phone's Settings app.
`apiVersion` was **not** the gate. The whole loop verifies: change → restart →
the mod reads back the *changed* values. Two caveats: the number field draws
far too many underscores, and **no reset control is exposed** (the editor must
ship its own). The screen is main-menu only, so it cannot host anything a
player tunes mid-quest.

**API version — settled by the developer, same day.** SteelWaffe: *"game is
currently running on v2 … its not bug and your mod be ok — just basically add
`"apiVersion": 2` to your manifest.json."* Every mod the editor compiles now
declares `apiVersion: 2`, and so does every probe in this folder (r241).

Evidence and reasoning: [`docs/plans/r239-modsettings-probe.md` §4b](../../docs/plans/r239-modsettings-probe.md);
filed with the developers as [`docs/03` §23](../../docs/03-questions-for-the-developers.md).

## The ModSettings Probe (r239) — what the probe is

`modsettings/` (+ `delivery/qe-sdk-024-modsettings-1.0.0.zip`) is the first
in-game look at **declarative mod settings** (`Bootstrap.Settings` —
"rendered in the Mods UI" per the 0.24 declarations): one Bootstrap with six
settings, one of every declared type (two toggles, select, text, number,
slider 0–100/5), plus a load counter that logs
`MS-load <n>: {…all values…}` so the run produces machine-readable proof of
persistence **and** readback. Install it **next to the r238 dynamic-page
probe — one game session covers both**: do the seven MS rows first
(MS-05 is a restart, MS-06 reads the log after it), weaving the DP rows in
around the restart. **The checklist, the run order and the red-reading are in
[`docs/plans/r239-modsettings-probe.md`](../../docs/plans/r239-modsettings-probe.md)**.

## RUN TWICE, REBUILT THREE TIMES: the Dynamic Page Probe (r238 → 1.1.0 → 1.4.0)

**Two runs are in, and they answer the headline question: YES — a mod can
reproduce the game's own news-site behaviour.** One caveat, and it is ours:
every mail those runs sent went to `player@gomail.com`, a placeholder that has
never existed, so the mail results are void and two findings are withdrawn
(r250). The content and event findings are untouched. `qedyn beat` fires the beat and
the UPDATE article then sits on top of `/news` with the old three dropping a
slot. What is still open is the mail, and the two runs moved it a long way:
run 2 proved a page's mail is **accepted** (`Mail.send` returns a real id) and
lost in delivery — *not* refused, as the 1.0.0 run concluded — and run 3
narrowed it further: of a pair of test mails, **only the one with no `to:`
field arrived**. So the recipient field is what loses them, and 1.3.0 is built
to say whether that is a wrong address or any `to:` at all.

`dynprobe/` (+ `delivery/qe-sdk-024-dynprobe-1.4.0.zip`) answers the open
questions from the r237 dynamic-webpages investigation. The 1.0.0 run
answered the content questions — path params arrive, no caching, the 404 look,
site and per-page exports — and proved the hard way that `Http.Response`
never reaches a mod for its own site (so the beat wired to it never fired and
the bcc.com A/B never ran its "after" half).

**1.1.0 fixes exactly those three things:** the beat now fires from the
`qedyn beat` terminal command; `Http.Response` is logged *before* any filter
and `qedyn status` prints every event the mod was offered; and `/form` now
prints what `Mail.send` **returned** (`null` = refused, an id = accepted) and
adds a second button that goes through the documented `Events.emit` bridge, so
we learn whether the workaround actually delivers.

Install the zip, accept the "QA probe (r238)" feed post, and work the
seventeen quest objectives top to bottom — the checklist, the run order and the
red-reading are in
[`docs/plans/r238-dynamic-pages-probe.md`](../../docs/plans/r238-dynamic-pages-probe.md).

## Settled: the harness rows below

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

**The open rows are the mail batch (r209)** — `STATUS.md` has the table
(M-01…M-10); the harness's own `qe24 mail` guide prints the same commands
in game. One session, raw harness **1.0.24** only; the editor export is
untouched this round.

The Twotter probe came back **green on the API path** (2026-09-18, build
25388883): search survives the record shape that used to crash the game, and
accounts can be removed again. The probe's results, the first editor-row run and the four rows
still open (T-15c, and the abandon half of T-11b) are in `STATUS.md`.

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
| `mod/` | The raw in-game harness, mod **1.0.24**. **`qe24 run`** starts a quest on demand (nothing auto-starts any more) and lists **`tw1`** / **`tw2`** / **`tw3`**, the editor export's Twotter quests, and **`mail`**, the r209 mail QA quest; **`qe24 timers`** prints every pending Scheduler job with the in-game moment it will fire; **`qe24 mail send/audit/remove/watch/cleanup/unload/bounce`** is the r209 mail probe (rows M-01…M-10 in `STATUS.md`); **`qe24 twotter backdate`** (P-01a) and **`qe24 twotter order`** (P-01b) are answered; **`qe24 twotter audit`** (r185) lists the round's handles and flags the r31 poison shape, which is how T-10/T-11/T-12 are read. `qe24 twotter` (r179) keeps its results. | Tool |
| `projects/sdk-0.24-ingame-qa.project.json` | The editor-importable project the export is built from: seven quests, **none auto-starting**, plus the mod-level Twotter account `qe24_editor` the T-08…T-13 rows read. | Source of truth for the export |
| `projects/fixture-*.project.json` | Three tiny legacy drafts, opened in the editor, no game needed: S-12's pre-r176 `after` project, S-15's r176-era amount/unit one, and **T-14's r30 Twotter draft** (quest-level accounts, one node per tweet, four time spellings). | Fixtures, run by hand |
**Where things live on the tester's machine** (Zeis, 2026-09-19 — the answer to
a question this folder had been dodging for rounds):

| What | Path |
| --- | --- |
| The game's log file | `%APPDATA%/Roaming/hackhub/log` |
| Save games | `%APPDATA%/Roaming/hackhub/saves` |
| The game's own save backups | `%APPDATA%/Roaming/hackhub/save-backups` (he keeps his own instead) |

That is the file every "game log" in this folder means: a text file whose header
reads `HACKHUB LOG FILE`, with `====` separators between entries. Everything this
mod writes starts with `[quest-editor]`, so searching that one word in the newest
file gives the load banner, the quest lines and any cleanup in order.

| `editor-export/` | The installable export (mod **1.0.35**, editor build `2026-09-19.r209`; eight quests, **none auto-starting** — see `qe24 run`). Stamp-only this round: the r209 work is all in the raw harness. Install it beside the raw harness when a row says so. | **Generated** — never edit by hand |
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
