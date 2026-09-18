<!--
Hand-maintained. `npm run gen:qa-export` appends this file to the compiled
README.md, and the guard test (`src/compiler/__tests__/sdk024QaExport.test.ts`)
fails when that concatenation drifts. Everything else in this folder is
generated output: edit the project, then re-run the generator.
-->

## What is in this build

Two quests auto-start on load:

- **`QESdk024EditorQa`** — the r166 surface: native Wi-Fi (`QE24-LAB-5G`) and the
  HTTP/browser events for `http://qe24-website.test/` (`/`, `/echo`, `/hidden/result`).
  The steps and the known results are below.
- **`QESdk024TimerQa`** — the r172/r173 **Timer** node (delay mode), rows S-01…S-03.
  The calendar modes (`In N days at a set time`, `On a specific in-game date & time`)
  are not baked into this export — a fixed date in a committed file would be in the
  past by the time it is played. Make that edit in the editor before exporting, or
  run the S-04 clock comparison from `../README.md`.

### `QESdk024TimerQa` — S-01…S-03

| Row | What to do | Green means |
|---|---|---|
| S-01 | Load the save and watch. Timer A is 2 in-game minutes — about 2 real seconds at the default 60× clock. | The mail **Timer A arrived (S-01 green)** and the **Timer A fired** toast appear. |
| S-02 | Save and reload before Timer B (2 in-game hours) is due. | **Timer B fired** appears after the reload: the job survived the save. |
| S-03 | Complete or abandon the quest first, then let Timer B's time pass. | Timer B never fires. The console logs `timer missed` when the job comes due while the quest is not active. |

In-game console lines are the ones to quote in a report: `timer node … armed for …`,
`timer … fired`, `timer missed: quest …`, `cancelled N pending timer(s)`.

## Export history

| Export | Editor build | Result |
|---|---|---|
| 1.0.11 | 2026-09-18.r183 | **Build stamp only, for the inspector row fix** — the Timer's four-box "In" row used to run off the right edge of the 340px docked inspector; it now folds to two columns below the width its unit captions need and opens back up when the panel is dragged wider. Exported mods are unaffected (this is editor layout).
| 1.0.10 | 2026-09-18.r182 | **The end-of-quest cancel line stops overstating itself.** A timer that had already fired stayed in the mod's pending list, so completing or abandoning the quest logged "cancelled 2 pending timer(s)" with only one left (seen during S-03). Fired jobs are dropped as they fire, so the count matches reality. No behaviour change otherwise.
| 1.0.9 | 2026-09-18.r181 | **No quest auto-starts, and no QA debug node toasts.** The 2026-09-18 Timer run became a notification storm — five auto-starting quests on top of what an earlier build had left claimed — so every quest here is now claimed on demand from the harness: `qe24 run`. The quests and their contents are unchanged otherwise.
| 1.0.8 | 2026-09-18.r180 | **Two new auto-start quests for the Timer rows.** `QESdk024TimerCalQa` fires an exact date already past and a coming day already past today (both must fire at once), then arms a mixed `1 month 2 weeks 2 days at 18:23` row; `QESdk024WaitMonthQa` fires a 1-minute Wait (the `schedule` path) and then arms a `Wait 1 month` (the `scheduleAt` path, because months have no duration field). The far-away rows are checked with `qe24 timers` (raw harness 1.0.10) rather than waited out. The r166 surface and `QESdk024TimerQa` are unchanged.
| 1.0.7 | 2026-09-18.r179 | **Build stamp only.** No editor behaviour changed; the Twotter probe lives in the raw harness (`mod/`, 1.0.9), not in this export, because the editor cannot author Twotter yet.
| 1.0.6 | 2026-09-18.r178 | **Regenerated after S-04 was answered.** The `at` mode's timezone correction is confirmed correct in game (the clock displays the machine's local time), and the emitted source comment now says so instead of holding the question open. No behaviour change.
| 1.0.5 | 2026-09-18.r177 | **Regenerated for the r177 Timer.** One box per unit on both relative rows: a coming day counts years/months/weeks/days from now and pins a clock time, Wait takes every unit (calendar included, through `scheduleAt` because the engine's duration form has no month field). The arm log names the rule in the author's units. Delay-mode quests behave exactly as before — S-01…S-03 stay valid.
| 1.0.4 | 2026-09-18.r176 | Regenerated for the r176 Timer (relative amount + unit, short months clamped). Superseded by 1.0.5 the same day. |
| 1.0.3 | 2026-09-17.r175 | **Regenerated, awaiting a pass.** First build to carry `QESdk024TimerQa`; fixes the r166-era README claim that the export held one quest. |
| 1.0.2 | 2026-09-16.r166 | Tested on HackHub 1.3.0 / Steam build 25341308 — results below. |

### 1.0.2 results (editor surface only, no Timer quest)

- Startup mail and debug toasts appeared on a fresh save, after the `ui` permission
  was added for toasts.
- Wi-Fi passed: connecting to `QE24-LAB-5G` checked both Wi-Fi objectives, the BSSID
  matched `02:24:00:00:24:02`, and a reload left exactly one `QE24-LAB-5G`.
- HTTP did **not** pass: `http://qe24-website.test/` and `/echo` loaded, but neither
  the `http-request` nor the `http-response` objective ticked. Static website hosting
  works; editor-generated SDK HTTP event objectives stay fenced until SteelWaffe
  clarifies the static-site event semantics.
- DNS-only collaborator lookups (`nslookup <subdomain>.qe24-collab.test`) return
  `No results found` and produce no collaborator history entry in this build.
