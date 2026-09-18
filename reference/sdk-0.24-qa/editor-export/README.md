# QE SDK 0.24 Editor QA Scaffold

Evidence-only project for SDK 0.24 in-game verification: native Wi-Fi, HTTP/curl events, and the Timer node delay modes. Keeps those checks isolated from author-facing feature exposure.

## Install (no coding needed)

1. Copy this whole folder into the game's `mods/` directory.
2. Start HackHub — the mod loads from `dist/mod.js`.

## Rebuild (optional, for programmers)

`src/index.ts` is the same code as `dist/mod.js`. With Node 18+:

```
npm install
npm run build
```

## What the editor compiled for you

- Quests: QESdk024EditorQa, QESdk024TimerQa
- Websites: qe24-website.test
- Permissions requested: network, mail, ui, events

## Notes

- QESdk024EditorQa: “Create Wi-Fi” exports as a native access point in HackHub 1.3.0+. Current QA found one game display wart: Bettercap may show no network name after targeting the AP by BSSID, but scanning, joining and cracking still worked.
- qe24-website.test: 1 unlisted page (/hidden/result). Nothing links to it and the in-game search will not show it, so the player reaches it only by typing the address or by running dirhunter on the host — which is exactly what makes a good hiding place for a clue. If you meant this to be findable normally, turn on “Listed in search” for the page.
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
