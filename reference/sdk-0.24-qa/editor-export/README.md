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
- Permissions requested: network, mail, events

## Notes

- QESdk024EditorQa: “Create Wi-Fi” now exports through the SDK wireless creator when the game provides it, but the node remains hidden from the palette until in-game QA verifies the whole shape. Test old projects that already contain it in game before shipping.
- qe24-website.test: 1 unlisted page (/hidden/result). Nothing links to it and the in-game search will not show it, so the player reaches it only by typing the address or by running dirhunter on the host — which is exactly what makes a good hiding place for a clue. If you meant this to be findable normally, turn on “Listed in search” for the page.
