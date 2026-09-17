# SDK 0.24 QA harness

This folder is a deliberately small, manual in-game harness for the r166 SDK 0.24 verification pass. It is not imported into the editor palette and it does not lift any feature fence.

## Contents

- `mod/manifest.json` — package metadata for the raw in-game harness.
- `mod/dist/mod.js` — hand-authored HackHub content mod that uses SDK 0.24-only surfaces directly, including phone-call `onEnd` completion probes and the `qe24 clock` timezone probe (S-04, harness 1.0.7).
- `projects/sdk-0.24-ingame-qa.project.json` — editor-importable project that exercises the editor's native `world.wifi` node path plus catalogue events; it was generated before r167 exposed Create Wi-Fi in the palette. It also carries `QESdk024TimerQa`, the Timer rows S-01–S-03.
- `editor-export/` — ready-to-install export generated from that project with editor build `2026-09-18.r176` (mod `1.0.4`; quests `QESdk024EditorQa` and `QESdk024TimerQa`). Regenerate with `npm run gen:qa-export`; the guard test `src/compiler/__tests__/sdk024QaExport.test.ts` fails on a single byte of drift.


## Current raw-mod status from in-game QA

As of the HackHub 1.3.0 / Steam build 25341308 run on 2026-09-16, the raw `mod` harness is green by tester report except for terminal `curl`, which is unavailable in that build/session. Browser HTTP, Browser intercept, Browser collaborator, `Http.fetch`, Scheduler, native Wi-Fi fields/connect/disconnect/reload, abandon/reset-reseed command cleanup, and the separate direct quest lifecycle probes all behaved as expected with no freezes. The full step-by-step transcript is `QE24-TestResults - 3.md`.

New after that run: raw harness version 1.0.6 adds two untested phone-call `onEnd` probes (`phone-auto` and `phone-direct`) for the old renderer-freeze bug. Run them on a clean throwaway save before changing the editor's phone-call completion behavior.

New again for the r175 pass: raw harness version **1.0.7** adds `qe24 clock`, which prints the current in-game time as raw `Time.now`, as UTC, as the machine-local rendering and as `Time.date()`. Comparing those lines with the clock on screen settles **S-04** (does the `at` mode's timezone correction match what the display shows?) without editing a calendar date.

New for the r177 pass: both relative rows take one box per unit — a coming day counts **years / months / weeks / days** from now and pins a clock time, and **Wait** takes every unit including the calendar ones (months and years go through `scheduleAt`, since the engine's `schedule()` duration form has no month field). Rows **S-13–S-15** (a mixed `1 month 2 weeks 2 days` offset, Wait in months, and an r176-era draft still behaving identically) are in [`../../docs/plans/r177-every-unit.md`](../../docs/plans/r177-every-unit.md).

New for the r176 pass: the Timer's *coming day* mode is now a real relative rule — in **[N] days / weeks / months / years** from now, at a clock time — resolved inside the mod at arm time, with short months clamped (31 Jan + 1 month = 28/29 Feb). The editor's clock panel and rows are editor-only. Rows **S-09–S-12** (one month on, short-month clamp, what `NEXT EVENT` shows, and a pre-r176 `after` project still behaving identically) are defined in [`../plans/r176-timer-calendar-ux.md`](../../docs/plans/r176-timer-calendar-ux.md).

One raw Wi-Fi gameplay wart remains documented: Bettercap can set the AP by BSSID and capture/crack the handshake, but `set wifi.ap 02:24:00:00:24:01` logs `SSID: undefined` instead of `QE24-RAW-5G`. Treat that as a runtime UX issue to account for before exposing native Wi-Fi broadly.

Editor-export follow-up: `http://qe24-website.test/` and `/echo` loaded, but neither `http-request` nor `http-response` objective checked off. With editor export 1.0.2 on a fresh save, the setup mail appeared, debug toasts appeared, reload kept only one `QE24-LAB-5G`, and Wi-Fi objectives still completed after reload with the expected BSSID. DNS-only collaborator lookup was tested with `nslookup <printed-subdomain>.qe24-collab.test`; it returned `No results found` and produced no new collaborator history entry, so treat DNS-only collaborator support as unsupported/fenced in this build. Browser HTTP collaborator remains green.

The refreshed `editor-export/` (mod 1.0.4, editor build r176) carries both quests; the Timer rows S-01–S-03 are described in the export README's appended notes, maintained in `editor-export.notes.md`.

## Plain-English quick start

Use a throwaway save. The harness is not a puzzle quest: its objectives are reminders for QA checks, and you can skip or retry them in any order.

1. Install `reference/sdk-0.24-qa/mod` as a local HackHub content mod and restart the game.
2. Open the in-game terminal and run:

   ```text
   qe24 guide
   ```

3. For a very short first pass, run these commands/actions:

   ```text
   qe24 http-fetch
   qe24 schedule 1
   qe24 collab
   ```

   Then open the collaborator URL printed by `qe24 collab` in the in-game Browser, or run the printed `curl` command if your game build has `curl`. Use the clock Wait button for the scheduler job, and connect/disconnect from the `QE24-RAW-5G` Wi-Fi network.


## If the raw surface quest already says 6/6

The `QE24SurfaceProbe` quest is only the first smoke test for HTTP, collaborator, scheduler and Wi-Fi events. Once it says `6/6 completed`, stop chasing that objective list and move to the manual checks below. The raw harness also has a shortcut:

```text
qe24 next
```

Recommended next pass:

1. Capture current evidence:

   ```text
   qe24 status
   qe24 history
   ```

2. Wi-Fi details/reload check. You do **not** need to crack `QE24-RAW-5G`; the passphrase is intentionally known because this tests SDK network creation first. Connect with `correct-horse-battery`, run `qe24 status`, and confirm `Connected Wi-Fi is QE24 target: yes`. Disconnect from the QE24 network, run `qe24 status` again, then reload and confirm `Target Wi-Fi matches` stays at `1`. Cracking with Bettercap is useful extra coverage; current evidence says the handshake/hashcat path works, but the Bettercap `set wifi.ap <BSSID>` log prints `SSID: undefined`.

3. Quest lifecycle probes:

   ```text
   qe24 claim complete
   qe24 complete
   # save/reload, check no duplicate mail/reward/freeze

   qe24 claim button
   qe24 button-ready
   # click the quest Complete button, then save/reload

   qe24 claim retire
   qe24 retire

   qe24 claim unclaim
   qe24 unclaim

   # Phone onEnd completion freeze probes:
   qe24 claim phone-auto
   qe24 phone-auto
   qe24 claim phone-direct
   qe24 phone-direct
   ```

4. Scheduler reload check. Because your observed game clock is fast, use a longer delay so you have time to save/reload:

   ```text
   qe24 schedule 10
   ```

5. Clock zone (S-04). Run `qe24 clock` and compare the two renderings it prints with the clock on screen. Screen matches "local time" → the editor's `at` correction stays as shipped; screen matches UTC → the editor drops the correction (one line in `computeTimerFireAt`).

6. Later, test the editor export separately: `QE24-LAB-5G`, `http://qe24-website.test/` and the Timer quest's S-01–S-03 rows.

## What the new checks mean

- **HTTP/browser/curl events** — SDK 0.24 can report web traffic. A pass means a browser, `curl`, or `Http.fetch()` request prints a good response and/or ticks the `http-response` objective. If `curl` is not installed in that game build, mark only the curl-specific rows as `Blocked`, not failed.
- **HTTP intercept** — a proxy-style hold switch. When it is on, a browser/`curl` request may pause until another terminal forwards it. This is only to prove `Http.Intercepted` works. If `curl` is missing, use the in-game Browser for the same URL or skip the row.
- **Collaborator hit** — a one-use callback domain. A pass means `qe24 collab` prints a URL, and opening that URL in Browser or `curl`ing it ticks the `collaborator-hit` objective.
- **Scheduler/Time** — a job should fire on the in-game clock, including after using Wait or reloading.
- **Native Wi-Fi** — SDK 0.24 can create real access points with BSSID/channel/WPS fields. A pass means the AP appears, connects, disconnects, and survives reload without duplicates.
- **Quest completion APIs** — `complete`, `retire`, and `unclaim` should not freeze the game or leave stale quest rows.
- **Phone `onEnd` completion** — a phone-call line callback should be able to complete an objective or call `complete()` without freezing the renderer.

## Intercept test, step by step

Only do this on a throwaway save. Open two terminal windows first, because the Browser or `curl` request may wait until you release it.

```text
# Terminal A
qe24 intercept on
# Either open http://qe24-http.test/ in the in-game Browser, or, if curl exists:
curl http://qe24-http.test/

# Terminal B
qe24 intercept queue
qe24 intercept forward  # forwards and turns intercept off in the current harness
qe24 intercept off      # optional cleanup/safe no-op
```

Expected result: the `http-intercepted` objective ticks, `qe24 intercept queue` shows one held `GET` request, and the waiting Browser/`curl` request prints the page after `forward`. A blank/dark page while intercept is on normally means the request is held.

If anything gets stuck, use Terminal B:

```text
qe24 intercept off
```


## If `curl` is not available

Some game builds may still print `Command "curl ..." not found.` That blocks the curl-specific checks only; it does not mean the SDK harness failed. Do this immediately after a failed intercept attempt:

```text
qe24 intercept off
```

Then use the in-game Browser for browser-compatible URLs:

- `http://qe24-http.test/`
- `http://qe24-http.test/api/echo?from=browser`
- the `http://<random>.qe24-collab.test/qe24` URL printed by `qe24 collab`

Record the curl subcase as `Blocked` if `curl` is missing. H-04 and H-06 can still pass through the in-game Browser fallback if the Browser URL is held/forwarded or the collaborator hit appears.


## Editor-export test route

Test this separately from the raw harness on a clean save when possible. Install `editor-export/` (mod 1.0.4, editor build r176, both quests) and check:

1. Start/load: a mail/toast for `QESdk024EditorQa` appears and there is no startup error.
2. Browser HTTP: open `http://qe24-website.test/`, then `http://qe24-website.test/echo`. "Tick" means the active quest/objective tracker line gets a checkmark or moves to completed; you may also see a debug toast like `Editor QA ticked: http-response`. Current evidence: both pages load but neither HTTP objective ticks, so static website hosting works while editor HTTP events stay fenced.
3. Editor Wi-Fi: connect to `QE24-LAB-5G` with `correct-horse-battery`, then disconnect. Expected AP fields are BSSID `02:24:00:00:24:02`, channel `44`, WPS `true`; record whether the `wifi-connect` and `wifi-disconnect` objective lines tick.
4. Save/reload: the editor AP should not duplicate, and event listeners/objectives should still work.
5. Timer rows (S-01–S-03): `QESdk024TimerQa` auto-starts. Timer A is 2 in-game minutes (≈ 2 real seconds) and should send a mail plus a toast; Timer B is 2 in-game hours (≈ 2 real minutes) and should fire exactly once even if you save/reload before it (S-02). Complete or abandon the quest first and Timer B must never fire (S-03). Console lines: `timer node … armed for …`, `timer <id> fired`, and `timer missed: …` when a stale arm is dropped.

6. Optional intercept: also install the raw harness, run `qe24 intercept on`, open `http://qe24-website.test/`, then `qe24 intercept queue` and `qe24 intercept forward`. The editor `http-intercepted` objective should tick if static website traffic emits `Http.Intercepted`.

## Raw harness commands

- `qe24 guide` — explain what each test is for and the safe run order.
- `qe24 next` — print what to do after the raw surface quest is already 6/6.
- `qe24 seed` — create/re-register the per-save HTTP host and native Wi-Fi AP.
- `qe24 status` — print the current host, Wi-Fi password, Time.now, scheduler queue count, HTTP history/intercept state, target Wi-Fi match count/details, connected Wi-Fi details and whether the connected network is the QE24 target.
- `qe24 history` — print recent HTTP history, collaborator hits and held intercept requests; useful evidence when game logs are unavailable.
- `qe24 clock` — print the current in-game time as raw `Time.now`, as UTC, as the machine-local rendering and as `Time.date()`, to settle which zone the in-game clock displays (S-04).
- `qe24 http-fetch` — make a server-origin HTTP request through `Http.fetch()`.
- `qe24 schedule 1` — schedule a job one in-game minute in the future; use the clock Wait button or let game time advance.
- `qe24 collab` — mint a collaborator subdomain and print a Browser URL, a `curl` command for builds that have curl, and an optional DNS-only `nslookup` hint.
- `qe24 intercept` — print the two-terminal intercept instructions.
- `qe24 intercept on|queue|forward|drop|off` — exercise HTTP interception. In the current harness, `forward` and `drop` also turn intercept off to avoid accidentally holding later Browser requests.
- `qe24 claim complete|button|retire|unclaim|phone-auto|phone-direct` — claim the focused quest-completion probes.
- `qe24 complete`, `qe24 button-ready`, `qe24 retire`, `qe24 unclaim`, `qe24 phone-auto`, `qe24 phone-direct` — trigger each completion/cleanup API probe. The phone probes start a call; let its final line end before judging the result.
- `qe24 reset` — clear the harness's saved IPs, unregister the host domain if possible and destroy known test networks.

Raw harness fixed values:

- HTTP host: `http://qe24-http.test/`
- Wi-Fi SSID: `QE24-RAW-5G`
- Wi-Fi passphrase: `correct-horse-battery`
- Wi-Fi BSSID/channel/WPS expected in scans: `02:24:00:00:24:01`, channel `44`, WPS `true`

## Safety notes

- The harness uses `SaveStorage` to remember generated network IPs per save. It does not use shared/global storage for per-save state.
- HTTP interception can make browser/curl requests appear hung. Run `qe24 intercept forward` or `qe24 intercept off` immediately after the intercepted request is recorded. If left on, the engine may show blank/dark pages until its held-request timeout forwards traffic.
- `qe24 reset` is scoped to the IPs the harness stored in the current save, but use a throwaway save anyway.
- Results should be recorded in `docs/plans/r166-sdk-0.24-ingame-qa.md`; the Timer rows are defined in `docs/plans/r173-timer-rename-and-calendar.md` (S-01–S-08), `docs/plans/r176-timer-calendar-ux.md` (S-09–S-12) and `docs/plans/r177-every-unit.md` (S-13–S-15); only lift editor fences after those rows are green in-game.
