# SDK 0.24 QA harness

This folder is a deliberately small, manual in-game harness for the r166 SDK 0.24 verification pass. It is not imported into the editor palette and it does not lift any feature fence.

## Contents

- `mod/manifest.json` — package metadata for the raw in-game harness.
- `mod/dist/mod.js` — hand-authored HackHub content mod that uses SDK 0.24-only surfaces directly.
- `projects/sdk-0.24-ingame-qa.project.json` — editor-importable project that exercises the editor's still-hidden native `world.wifi` node path plus catalogue events.
- `editor-export/` — ready-to-install export generated from that project with editor build `2026-09-16.r166`.


## Current raw-mod status from in-game QA

As of the HackHub 1.3.0 / Steam build 25341308 run on 2026-09-16, the raw `mod` harness is green by tester report except for terminal `curl`, which is unavailable in that build/session. Browser HTTP, Browser intercept, Browser collaborator, `Http.fetch`, Scheduler, native Wi-Fi fields/connect/disconnect/reload, and the separate quest lifecycle probes all behaved as expected with no freezes. The full step-by-step transcript is `QE24-TestResults - 3.md`.

If you are continuing QA, the next useful target is the editor-generated scaffold (`editor-export/`): test `QE24-LAB-5G` and `http://qe24-website.test/`. Optional raw-mod closure items are the abandon and reset cleanup rows from the full plan.

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

2. Wi-Fi details/reload check. You do **not** need to crack `QE24-RAW-5G`; the passphrase is intentionally known because this tests SDK network creation, not Wi-Fi gameplay. Connect with `correct-horse-battery`, run `qe24 status`, and confirm `Connected Wi-Fi is QE24 target: yes`. Disconnect from the QE24 network, run `qe24 status` again, then reload and confirm `Target Wi-Fi matches` stays at `1`. If the game UI says QE24 is connected but `qe24 status` reports a different connected network, paste that mismatch.

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
   ```

4. Scheduler reload check. Because your observed game clock is fast, use a longer delay so you have time to save/reload:

   ```text
   qe24 schedule 10
   ```

5. Later, test the editor export separately: `QE24-LAB-5G` and `http://qe24-website.test/`.

## What the new checks mean

- **HTTP/browser/curl events** — SDK 0.24 can report web traffic. A pass means a browser, `curl`, or `Http.fetch()` request prints a good response and/or ticks the `http-response` objective. If `curl` is not installed in that game build, mark only the curl-specific rows as `Blocked`, not failed.
- **HTTP intercept** — a proxy-style hold switch. When it is on, a browser/`curl` request may pause until another terminal forwards it. This is only to prove `Http.Intercepted` works. If `curl` is missing, use the in-game Browser for the same URL or skip the row.
- **Collaborator hit** — a one-use callback domain. A pass means `qe24 collab` prints a URL, and opening that URL in Browser or `curl`ing it ticks the `collaborator-hit` objective.
- **Scheduler/Time** — a job should fire on the in-game clock, including after using Wait or reloading.
- **Native Wi-Fi** — SDK 0.24 can create real access points with BSSID/channel/WPS fields. A pass means the AP appears, connects, disconnects, and survives reload without duplicates.
- **Quest completion APIs** — `complete`, `retire`, and `unclaim` should not freeze the game or leave stale quest rows.

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

## Raw harness commands

- `qe24 guide` — explain what each test is for and the safe run order.
- `qe24 next` — print what to do after the raw surface quest is already 6/6.
- `qe24 seed` — create/re-register the per-save HTTP host and native Wi-Fi AP.
- `qe24 status` — print the current host, Wi-Fi password, Time.now, scheduler queue count, HTTP history/intercept state, target Wi-Fi match count/details, connected Wi-Fi details and whether the connected network is the QE24 target.
- `qe24 history` — print recent HTTP history, collaborator hits and held intercept requests; useful evidence when game logs are unavailable.
- `qe24 http-fetch` — make a server-origin HTTP request through `Http.fetch()`.
- `qe24 schedule 1` — schedule a job one in-game minute in the future; use the clock Wait button or let game time advance.
- `qe24 collab` — mint a collaborator subdomain and print a Browser URL plus a `curl` command for builds that have curl.
- `qe24 intercept` — print the two-terminal intercept instructions.
- `qe24 intercept on|queue|forward|drop|off` — exercise HTTP interception. In the current harness, `forward` and `drop` also turn intercept off to avoid accidentally holding later Browser requests.
- `qe24 claim complete|button|retire|unclaim` — claim the focused quest-completion probes.
- `qe24 complete`, `qe24 button-ready`, `qe24 retire`, `qe24 unclaim` — trigger each completion/cleanup API probe.
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
- Results should be recorded in `docs/plans/r166-sdk-0.24-ingame-qa.md`; only lift editor fences after those rows are green in-game.
