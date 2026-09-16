# QE SDK 0.24 Editor QA Scaffold

Evidence-only project for r166 SDK 0.24 in-game verification. Keeps native Wi-Fi and HTTP/curl event checks isolated from author-facing feature exposure.

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

- Quests: QESdk024EditorQa
- Websites: qe24-website.test
- Permissions requested: network, mail, events, ui



## Current editor-export result

Zeis tested the editor export on HackHub 1.3.0 / Steam build 25341308. With export 1.0.2 on a fresh save, the setup mail appeared, debug toasts appeared, reload kept only one `QE24-LAB-5G`, and Wi-Fi objectives completed after reload with the expected BSSID.

For HTTP, both pages loaded:

```text
http://qe24-website.test/
http://qe24-website.test/echo
```

However, neither `http-request` nor `http-response` objective checked off. Record this as: static website hosting works, but editor-generated SDK HTTP event objectives do not fire for static website Browser traffic in this build.

The earlier missing-toast issue was fixed by adding the `ui` permission for debug toasts in export 1.0.2. Startup mail now appears on a fresh save.

Wi-Fi passes: connecting to `QE24-LAB-5G` checked both Wi-Fi objectives, the BSSID matched `02:24:00:00:24:02`, and after reload there was still only one `QE24-LAB-5G`.

## What to look at in-game

When the checklist says an objective should "tick", it means the active quest/objective tracker line for `QESdk024EditorQa` should become checked/completed. The webpage loading is only half the test; the question is whether the SDK event reached the editor-generated objective.

For the website check, open:

```text
http://qe24-website.test/
http://qe24-website.test/echo
```

Then report these four simple facts:

```text
page loaded: yes/no
http-request objective checked: yes/no
http-response objective checked: yes/no
any debug toast/log: ...
```

If the page loads but an objective stays unchecked, that means the static website works but that SDK event did not fire for the editor scaffold.

## Notes

- QESdk024EditorQa: “Create Wi-Fi” now exports through the SDK wireless creator when the game provides it, but the node remains hidden from the palette until in-game QA verifies the whole shape. Test old projects that already contain it in game before shipping.
- qe24-website.test: 1 unlisted page (/hidden/result). Nothing links to it and the in-game search will not show it, so the player reaches it only by typing the address or by running dirhunter on the host — which is exactly what makes a good hiding place for a clue. If you meant this to be findable normally, turn on “Listed in search” for the page.
