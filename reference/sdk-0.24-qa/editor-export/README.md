# QE SDK 0.24 Editor QA Scaffold

Evidence-only project for SDK 0.24 in-game verification: native Wi-Fi, HTTP/curl events, the Timer node delay and calendar modes, and the Twotter node (accounts, backdated series, cleanup). Nothing auto-starts — claim one quest at a time with the harness command `qe24 run` — so a tester sees one row's noise, not five.

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

- Quests: QESdk024EditorQa, QESdk024TimerQa, QESdk024TimerCalQa, QESdk024WaitMonthQa, QESdk024TwotterQa, QESdk024TwotterShareQa, QESdk024TwotterPostEventQa
- Websites: qe24-website.test
- Permissions requested: network, mail, events, ui

## Notes

- QE SDK 0.24 editor QA: nothing can start this quest. It does not start automatically and it is not advertised on the Hackhub feed, so the player has no way to claim it. Turn on “Start automatically” in the quest's Behaviour settings, or give it a feed post.
- Timer QA (S-01/S-02/S-03): nothing can start this quest. It does not start automatically and it is not advertised on the Hackhub feed, so the player has no way to claim it. Turn on “Start automatically” in the quest's Behaviour settings, or give it a feed post.
- Timer QA (calendar: S-05/S-06/S-07/S-13): nothing can start this quest. It does not start automatically and it is not advertised on the Hackhub feed, so the player has no way to claim it. Turn on “Start automatically” in the quest's Behaviour settings, or give it a feed post.
- Timer QA (Wait in months: S-14, S-09): nothing can start this quest. It does not start automatically and it is not advertised on the Hackhub feed, so the player has no way to claim it. Turn on “Start automatically” in the quest's Behaviour settings, or give it a feed post.
- Twotter QA (T-08/T-09/T-10/T-11/T-13): nothing can start this quest. It does not start automatically and it is not advertised on the Hackhub feed, so the player has no way to claim it. Turn on “Start automatically” in the quest's Behaviour settings, or give it a feed post.
- Twotter QA (T-12: two quests, one account): nothing can start this quest. It does not start automatically and it is not advertised on the Hackhub feed, so the player has no way to claim it. Turn on “Start automatically” in the quest's Behaviour settings, or give it a feed post.
- Twotter QA (T-13: does Twotter.Post ever fire?): nothing can start this quest. It does not start automatically and it is not advertised on the Hackhub feed, so the player has no way to claim it. Turn on “Start automatically” in the quest's Behaviour settings, or give it a feed post.
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
| 1.0.19 | 2026-09-18.r191 | **Documentation only — the compiled quest content is identical to 1.0.18 apart from this build stamp.** The row it exists for, T-15c, needs no new mod code: the QA notes now name the file the cleanup line lands in (the game's `HACKHUB LOG FILE`, searched for `[quest-editor]`) instead of saying "the console", and spell out the two readings. Install it fresh if that is easy; if 1.0.18 is already in the Mods folder, run the row with it. |
| 1.0.18 | 2026-09-18.r190 | **Build stamp only; the compiled quest content is unchanged.** The round fixed the editor's *Graph paper* canvas grid, which rendered exactly like *Squares*: the style stacks two of the library's background layers, both defaulted to the same pattern id, and every `fill="url(#…)"` resolved to the first pattern (the library's own docs require a unique `id` per layer). Editor-side, invisible to an exported mod. |
| 1.0.17 | 2026-09-18.r189 | **Editor-side wording only; the compiled quest content is unchanged.** An author asks what the game fills in for them the moment a blank picture sits in front of them, so the editor now says it: the blank banner and both picture tooltips state that the game draws its own, a **blank display name** gets the same nudge a broken handle gets, and the panel spells out what travels as written (name, handle, bio, counts) versus what the engine owns (the two pictures, the id, the join date, the password). The export version moved only because the build stamp inside it did — the folder you install and the editor you read must not disagree. |
| 1.0.16 | 2026-09-18.r188 | **The tweet-picture control goes, and the Twotter node gets a face.** The picture upload is hidden — SDK 0.24's `TwotterTweet` has no picture field and the r185 run saw no picture anywhere in the feed (question 10 of `docs/03-questions-for-the-developers.md`) — and the QA fixture's banner/avatar became unmistakable colours (**#AA28FF** violet / **amber**) for row **T-08b**, with the six-weeks tweet keeping its age and losing its picture. Stage 2 (the click-to-edit mock profile, the timeline preview, the shimmer) is editor-side only; the compiled quest content is unchanged apart from this build stamp. |
| 1.0.15 | 2026-09-18.r186 | **The three bugs the first in-game run found, fixed.** The quest-start hook never ran, "live" counted quests that had never started (so a shared account could be removed while another quest still needed it), and a posting guard outlived its quest so a re-claimed quest never posted again. The `Twotter.Post` canary got a quest of its own (T-13: the Complete button needs every objective done), and the tweet picture is sent under both key names the API might read. Superseded the same day by 1.0.16. |
| 1.0.14 | 2026-09-18.r185 | **The Twotter editor rows (T-08…T-15) became runnable.** The backdated five-tweet series, the two quests that share one account (T-12), the two event triggers (T-13) and the authored avatar/banner were added, and every QA quest stopped auto-starting. This is the build the 2026-09-18 run was made on, and the one T-11 failed on. |
| 1.0.13 | 2026-09-18.r185 | **The Twotter node is rebuilt on the API path** (stage 1 of the r185 plan): mod-level accounts created with `createUser` + `addUser`, a series of tweets each with its own time, cleanup on complete/abandon/uninstall, and the migration that lifts a pre-r31 draft's tweets instead of dropping them. First build whose export can carry the editor's own Twotter output. |
| 1.0.12 | 2026-09-18.r184 | **Build stamp only — the QA ledger is closed.** No editor behaviour changed; the Timer rows finished (S-11 green, S-10 shelved by Zeis's decision) and the r183 row-fold fix was confirmed visually ("nicely responsive when pushing or pulling the inspector drawer"). The next round is the Twotter re-integration, planned in `docs/plans/r185-twotter-return.md`.
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
