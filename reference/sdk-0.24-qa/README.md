# SDK 0.24 QA harness

This folder is a deliberately small, manual in-game harness for the r166 SDK 0.24 verification pass. It is not imported into the editor palette and it does not lift any feature fence.

## Contents

- `mod/manifest.json` — package metadata for the raw in-game harness.
- `mod/dist/mod.js` — hand-authored HackHub content mod that uses SDK 0.24-only surfaces directly.
- `projects/sdk-0.24-ingame-qa.project.json` — editor-importable project that exercises the editor's still-hidden native `world.wifi` node path plus catalogue events.
- `editor-export/` — ready-to-install export generated from that project with editor build `2026-09-16.r166`.

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

   Then run the `curl` command printed by `qe24 collab`, use the clock Wait button for the scheduler job, and connect/disconnect from the `QE24-RAW-5G` Wi-Fi network.

## What the new checks mean

- **HTTP/curl events** — SDK 0.24 can report web traffic. A pass means a browser, `curl`, or `Http.fetch()` request prints a good response and/or ticks the `http-response` objective.
- **HTTP intercept** — a proxy-style hold switch. When it is on, a browser/`curl` request may pause until another terminal forwards it. This is only to prove `Http.Intercepted` works.
- **Collaborator hit** — a one-use callback domain. A pass means `qe24 collab` prints a URL, `curl`ing it ticks the `collaborator-hit` objective.
- **Scheduler/Time** — a job should fire on the in-game clock, including after using Wait or reloading.
- **Native Wi-Fi** — SDK 0.24 can create real access points with BSSID/channel/WPS fields. A pass means the AP appears, connects, disconnects, and survives reload without duplicates.
- **Quest completion APIs** — `complete`, `retire`, and `unclaim` should not freeze the game or leave stale quest rows.

## Intercept test, step by step

Only do this on a throwaway save. Open two terminal windows first, because the `curl` window may wait until you release the request.

```text
# Terminal A
qe24 intercept on
curl http://qe24-http.test/

# Terminal B
qe24 intercept queue
qe24 intercept forward
qe24 intercept off
```

Expected result: the `http-intercepted` objective ticks, `qe24 intercept queue` shows one held `GET` request, and the `curl` command prints the page after `forward`.

If anything gets stuck, use Terminal B:

```text
qe24 intercept off
```

## Raw harness commands

- `qe24 guide` — explain what each test is for and the safe run order.
- `qe24 seed` — create/re-register the per-save HTTP host and native Wi-Fi AP.
- `qe24 status` — print the current host, Wi-Fi password, Time.now, scheduler queue count, HTTP history count and Wi-Fi scan count.
- `qe24 http-fetch` — make a server-origin HTTP request through `Http.fetch()`.
- `qe24 schedule 1` — schedule a job one in-game minute in the future; use the clock Wait button or let game time advance.
- `qe24 collab` — mint a collaborator subdomain and print a `curl` command.
- `qe24 intercept` — print the two-terminal intercept instructions.
- `qe24 intercept on|queue|forward|drop|off` — exercise HTTP interception; always forward/off after a probe.
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
- HTTP interception can make browser/curl requests appear hung. Run `qe24 intercept forward` or `qe24 intercept off` immediately after the intercepted request is recorded.
- `qe24 reset` is scoped to the IPs the harness stored in the current save, but use a throwaway save anyway.
- Results should be recorded in `docs/plans/r166-sdk-0.24-ingame-qa.md`; only lift editor fences after those rows are green in-game.
