# SDK 0.24 QA harness

This folder is a deliberately small, manual in-game harness for the r166 SDK 0.24 verification pass. It is not imported into the editor palette and it does not lift any feature fence.

## Contents

- `mod/manifest.json` — package metadata for the raw in-game harness.
- `mod/dist/mod.js` — hand-authored HackHub content mod that uses SDK 0.24-only surfaces directly.
- `projects/sdk-0.24-ingame-qa.project.json` — editor-importable project that exercises the editor's still-hidden native `world.wifi` node path plus catalogue events.
- `editor-export/` — ready-to-install export generated from that project with editor build `2026-09-16.r166`.

## Install/use in HackHub

Use a throwaway save. Install either the raw mod folder or the exported/imported editor project output, depending on the checklist section in `docs/plans/r166-sdk-0.24-ingame-qa.md`.

For the raw mod, copy or symlink `reference/sdk-0.24-qa/mod` into HackHub's local content/mod folder, then restart the game. The harness registers a default terminal command:

```text
qe24 status
```

Important commands:

- `qe24 seed` — create/re-register the per-save HTTP host and native Wi-Fi AP.
- `qe24 status` — print the current host, Wi-Fi password, Time.now, scheduler queue count, HTTP history count and Wi-Fi scan count.
- `qe24 http-fetch` — make a server-origin HTTP request through `Http.fetch()`.
- `qe24 schedule 1` — schedule a job one in-game minute in the future; use the clock Wait button or let game time advance.
- `qe24 collab` — mint a collaborator subdomain and print a `curl` command.
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
