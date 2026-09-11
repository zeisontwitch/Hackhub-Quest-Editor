# HackHub Quest Mod Editor

A visual, no-code editor for building **quest mods** for
[HackHub — Ultimate Hacker Simulator](https://store.steampowered.com/app/2980270/HackHub__Ultimate_Hacker_Simulator/).

Non-coders design branching quests on a node canvas, build in-game websites in a
WYSIWYG editor (with hidden pages for `dirhunter` to find), script phone calls /
e-mail / Kisscord / WeeChat conversations, add hackertyper and typed-passphrase
moments, and export a complete, game-ready mod as a `.zip` — no coding at any point.

---

## Roadmap

Live list of what is being worked on. Newest problems at the top of each
section; anything ticked off moves to **Done recently** and is eventually
dropped once it has stayed fixed for a few rounds.

### Standing rule

**Never guess. Check, test, confirm.** Every claim about what the game or SDK
does must be backed by one of: the SDK declarations, the working reference mod,
or a real in-game test. A fix shipped on a theory has cost this project more
rounds than any bug — see r41, r43, r55, r60, r61 and r66.

### In progress

| # | Item | Notes |
|---|---|---|
| 1 | **Waiting on the game patch** | The developer has replied ([`docs/07-dev-response-mod-sdk-bug-report-response.md`](docs/07-dev-response-mod-sdk-bug-report-response.md), **fenced — read the banner first**): every reported item was reproduced, three were misdiagnosed (declarative triggers always worked — payload types were the lie), fixes ship in an upcoming patch. New surface (`this.complete()`, `Twotter.removeUser`, `Mail.remove`, …) is **not in the pinned SDK yet**: nothing implements it, no workaround comes off. Per Zeis the dev also verbally agreed on Discord (after the document, no timeline) to expose SMS; it appears nowhere in the written response — same fence. |
| 2 | Old quest mail is never cleaned up | Mail sent by an uninstalled mod stays in the inbox. The `Mail` namespace has no delete, so there may be nothing we can do — question 9 in the bug report. |
| 3 | **Date deprecation warning (`moment` RFC2822)** | Only appears with a quest-editor mod installed, 30–90s after a mail is sent, when a browser or app screen is opened. The stack is the game's own date formatting and we never set a date on anything — question 10 in the bug report. |

### Next up

| # | Item | Notes |
|---|---|---|
| 6 | "Contact-driven story" template | Cold Call (r122) covers the conversation shape — Kisscord plus WeeChat, no break-in. The phone-brief + objective-gated-drip variant from the original spec is still open. |
| 7 | "Branching consequence" template | A choice that changes which ending the player gets. "Two Ways Out" is approved (may be morally grey) but not yet built. The official Cryptographer Hunt (a phone social-engineering scene with a fail route on the wrong choice) is the strongest argument for it — see [`docs/plans/r127-official-quest-comparison.md`](docs/plans/r127-official-quest-comparison.md). The shape now ships inside The Long Game (r136, act III: a typed verdict with two endings); whether a standalone template still adds anything is Zeis's call. |
| 12 | **Tool packs — Editor Mods** | r137 + r138 shipped both halves: a pack is one `toolpack.json` of pure data ([`docs/ToolPack-Format.md`](docs/ToolPack-Format.md), starter pack in `reference/example-toolpack/`). r137: pack events join the trigger picker as a Community group; SharedStorage data shapes become "Community data" nodes. r138: **Editor Mods** — a pack's `nodes[]` grow the palette under "Editor Mods · <pack>" (one generic `pack.node` type carrying a full snapshot; four declarative emitters — `sdk` calls, `emit`, `storage`, `commandData` — never code), with the honesty spine throughout. Remaining: pack-driven target-rule surfaces (`targetRules` is parsed and carried, no quest-facing lint yet — needs a real second pack to design against). |

### Done recently

| # | Item | Notes |
|---|---|---|
| 5 | **Settings page** | Done in r140 + r141: a non-modal settings sheet from the top bar — the snap/animated/springy toggles with honest descriptions, the wire-physics dials with the damping-ratio and settle readouts, an honest "Fade ms" dial (r140); then six curated themes (Midnight, High Contrast, Daylight, Phosphor, Dusk, Slate), self-hosted readable fonts (Atkinson Hyperlegible, Lexend, JetBrains Mono, Roboto, Roboto Mono), snap grid size, wire dot drift speed, an editor-data section (reset all preferences, clear the autosaved draft) (r141), and the visual canvas grid — six styles, scale, opacity, default off (r142). Editor-only; nothing exported changes. |
| 13 | **Compile.ts clean code pass** | r143: follow-up to r139's architecture pass. Extracted four oversized functions in `compiler/compile.ts` — `warnNetworkStructure` (87→41 lines, three tree-walk helpers), `compileProject` (94→59 lines, scaffolding extracted), `warnWebsites` (45→6 lines, per-site + per-host helpers), `warnDialogue` (41→12 lines, per-node helper). Externalized `LOGIN_SERVICES` and `PLACEHOLDER_DOMAINS` to module-level constants (A8/AR20). Added TSDoc to five exports missing it (C5). No `EDITOR_BUILD` bump — the export is byte-identical (AR13). Plan: [`docs/plans/r143-compile-clean-code-pass.md`](docs/plans/r143-compile-clean-code-pass.md). |
