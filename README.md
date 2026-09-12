# HackHub Quest Mod Editor

A visual, no-code editor for building **quest mods** for
[HackHub — Ultimate Hacker Simulator](https://store.steampowered.com/app/2980270/HackHub__Ultimate_Hacker_Simulator/).

Non-coders design branching quests on a node canvas, build in-game websites in a
WYSIWYG editor (with hidden pages for `dirhunter` to find), script phone calls /
e-mail / Kisscord / WeeChat conversations, add hackertyper and typed-passphrase
moments, and export a complete, game-ready mod as a `.zip` — no coding at any point.

---

## Install & Run

**Windows, one click:**

Download/clone this repository (green "Code" button on the top of this page. Click the down arrow button -> Download ZIP)
and double-click **`Launch.bat`**.

It installs everything (needs [Node.js](https://nodejs.org/), LTS version), starts the editor, and opens it in your browser
at <http://localhost:5173>. 

***Important***: Keep the terminal window open while you work. Closing the terminal closes the tool and you could lose
your progress if you haven't saved yet.

**Any OS, manually:**

```bash
npm ci
npm run dev          # → http://localhost:5173
```

**Development commands:**

Only relevant to coders, if you just want to use the tool you can ignore this.

```bash
npm run typecheck    # tsc --noEmit
npm test             # 1,378 tests (vitest)
npm run build        # typecheck + vite build → dist/
```

---

## Making a mod (no coding)

1. **Start** — open the editor and hit **Templates** in the top bar to begin from
   a starter quest, or start blank.
2. **Build the story** — drag nodes from the left palette onto the canvas
   (objectives, triggers, networks with devices/ports/files, mails, chats,
   rewards…) and wire their sockets. Click any node to edit it on the right;
   every field explains itself on hover.

   Wiring is meant to feel physical: drop a wire on a node's **body** and it
   takes that node's one matching socket; pull a wire out of an input and it
   comes with you, keeping the end it came from — drop it on another node to
   move it there, on empty canvas (or press Escape) to remove it. Dots drift
   along each wire to show which way the story runs; the **Wires moving** button
   holds them still. **Group frames** are dragged by their title bar, so
   anything sitting inside one stays grabbable, and a **Sequence** node fires
   its outputs one after another with the pauses you set.
3. **Write conversations** — the **Dialogues** button opens the dialogue editor:
   one node, four flavours (phone call, Kisscord, e-mail, WeeChat), with player
   moments: typed answers with failure routes, hackertyper sends, file uploads.
   Kisscord and WeeChat conversations can also be **timed to the story** — a
   per-node switch plays them message by message when the flow reaches the node,
   so a chat can land on a **Sequence** beat instead of existing from the start.
   Hit **Save** when a conversation feels done.
4. **Build websites** — the **Websites** button opens the WYSIWYG website
   builder: real-looking templates (news, agency, blog, forum, recipes…), a
   code view with syntax highlighting, HTML import, embedded images, and
   **unlisted pages** that stay out of the in-game search index — the classic
   `dirhunter` hiding place.
5. **Export** — the **Export mod** button compiles everything into a mod folder
   and downloads it as a `.zip`. It shows which permissions the mod needs and
   gives plain-language notes about anything worth knowing.
6. **Play** — unzip into the game's `mods/` directory and start HackHub. The mod
   runs directly from `dist/mod.js`; **no build step needed**. (Programmers get
   `src/index.ts` + scaffolding in the same zip if they want to rebuild.)

Your work autosaves in the browser as you go. **Templates → save/export** writes
a project file you can share with anyone else using the editor.

---

## Coders and LLMs, read this first:
If you're just a gamer who wants to make quest mods for the game, you can ignore
everything that comes after this. If you're a coder or interested in modifying
this tool (you're very welcome to!), read on:

[`docs/01-analysis-and-architecture.md`](docs/01-analysis-and-architecture.md) is the
foundation for everything that follows. The three findings that shape the whole design:

1. **A HackHub mod is a TypeScript project, not a data package.**
   `QuestObjectiveTrigger.condition` is a *function*; message chains take `onSent`
   callbacks; dynamic website pages take a `metadata(context)` function. So the export
   engine ships an **interpreter**: the emitted `dist/mod.js` embeds the project as data
   plus a small plain-JS runtime that walks the quest graph — which is exactly why
   exported mods need no build step.

2. **The docs' event payload table is stale for roughly half the 92 events.**
   The guide says `Terminal.NmapScan` is `{ ip, ports }`; it is `{ ip, versionScan? }`.
   It says `Quest.Claimed` is `{ questName }`; it is `{ name, id }`. An editor built
   from that table would generate triggers that never fire. The full diff is in
   [§7.2](docs/01-analysis-and-architecture.md#72-payloads-where-the-events-guide-page-is-wrong).

3. **There is no SMS API.** Phone *calls* exist (`Quest.Dialog`); text messages do not.
   So no SMS editor ships — see decision 2 below.

---

## Roadmap

Live list of what is being worked on. Newest problems at the top of each
section; anything ticked off moves to **Done recently** and is eventually
archived once it has stayed fixed for a few rounds.

### In progress

| # | Item | Notes |
|---|---|---|
| 1 | **Waiting on the game patch** | The developer has replied ([`docs/07-dev-response-mod-sdk-bug-report-response.md`](docs/07-dev-response-mod-sdk-bug-report-response.md), **fenced — read the banner first**): every reported item was reproduced, three were misdiagnosed (declarative triggers always worked — payload types were the lie), fixes ship in an upcoming patch. New surface (`this.complete()`, `Twotter.removeUser`, `Mail.remove`, …) is **not in the pinned SDK yet**: nothing implements it, no workaround comes off. Per Zeis the dev also verbally agreed on Discord (after the document, no timeline) to expose SMS; it appears nowhere in the written response — same fence. |
| 2 | Old quest mail is never cleaned up | Mail sent by an uninstalled mod stays in the inbox. The `Mail` namespace has no delete, so there may be nothing we can do — question 9 in the bug report. |
| 3 | **Date deprecation warning (`moment` RFC2822)** | Only appears with a quest-editor mod installed, 30–90s after a mail is sent, when a browser or app screen is opened. The stack is the game's own date formatting and we never set a date on anything — question 10 in the bug report. |

### Next up

| # | Item | Notes |
|---|---|---|
| 1 | "Contact-driven story" template | Cold Call (r122) covers the conversation shape — Kisscord plus WeeChat, no break-in. The phone-brief + objective-gated-drip variant from the original spec is still open. |
| 2 | "Branching consequence" template | A choice that changes which ending the player gets. "Two Ways Out" is approved (may be morally grey) but not yet built. The official Cryptographer Hunt (a phone social-engineering scene with a fail route on the wrong choice) is the strongest argument for it — see [`docs/plans/r127-official-quest-comparison.md`](docs/plans/r127-official-quest-comparison.md). The shape now ships inside The Long Game (r136, act III: a typed verdict with two endings); whether a standalone template still adds anything is Zeis's call. |
| 3 | **Tool packs — Editor Mods** | r137 + r138 shipped both halves: a pack is one `toolpack.json` of pure data ([`docs/ToolPack-Format.md`](docs/ToolPack-Format.md), starter pack in `reference/example-toolpack/`). r137: pack events join the trigger picker as a Community group; SharedStorage data shapes become "Community data" nodes. r138: **Editor Mods** — a pack's `nodes[]` grow the palette under "Editor Mods · <pack>" (one generic `pack.node` type carrying a full snapshot; four declarative emitters — `sdk` calls, `emit`, `storage`, `commandData` — never code), with the honesty spine throughout. Remaining: pack-driven target-rule surfaces (`targetRules` is parsed and carried, no quest-facing lint yet — needs a real second pack to design against). |

### Done recently

| # | Item | Notes |
|---|---|---|
| r144 | **Grey-screen report, README rebuilt, grid re-landed** | ([plan](docs/plans/r144-grey-screen-readme-reland.md)) The grey screen could not be reproduced in r142's code — the whole app boots clean with the grid off and on, and the likely culprit was the dev-preview server dying with a sandbox reset (this sandbox has reset itself several times, including that night). One real bug was found on review and fixed: the hexagon/diamond overlay set its colour through an SVG attribute, where `var()`/`color-mix()` do not resolve — the colour now travels a real CSS channel (inline `color`, `currentColor` strokes). A boot regression net now mounts the whole editor with the grid off and on. The README had been truncated to intro + roadmap since somewhere in r134–r139; restored from Zeis's backup and brought current this round. r143 (a Compile.ts clean-code pass by a different tool) stays reverted — preserved at commit `a1fb342`, re-apply on request. |
| r142 | **The visual canvas grid + Roboto** | ([plan](docs/plans/r142-canvas-grid.md)) A grid you can see and tune, on the Settings page: on/off (default **off**, Zeis's call — it replaces the always-on dot pattern, so the default canvas is now plain), six styles (squares, dots, hexagons, crosses, graph paper, diamond — each picker button shows a live miniature of its pattern), scale 4–200 and opacity 0–100 as slider + exact-number pairs. The colour is a `color-mix` over the theme's canvas-dots token, so every theme recolors it; the grid's scale is deliberately independent of the snap size. **Roboto** and **Roboto Mono** joined the font picker (self-hosted, OFL). Editor-only; nothing exported changes. |
| r141 | **Settings page** | Done in r140 + r141: a non-modal settings sheet from the top bar — the snap/animated/springy toggles with honest descriptions, the wire-physics dials with the damping-ratio and settle readouts, an honest "Fade ms" dial (r140); then six curated themes (Midnight, High Contrast, Daylight, Phosphor, Dusk, Slate), self-hosted readable fonts (Atkinson Hyperlegible, Lexend, JetBrains Mono), snap grid size, wire dot drift speed, and an editor-data section (reset all preferences, clear the autosaved draft) (r141). Editor-only; nothing exported changes. |
| r134-r140 | **The truncation window** | The README was truncated to intro + roadmap somewhere in here, so these rounds lost their rows — reconstructed from [`docs/HANDOFF.md`](docs/HANDOFF.md): r134 website polish (editing no longer runs page scripts — CSP-blocked; delete-site confirmation; host and path normalization); r135 tool-packs design; r136 **The Long Game** campaign template (act III's typed verdict ships the branching-consequence shape); r137 tool packs, first rail (pack events in the trigger picker, Community data nodes); r138 **Editor Mods** (a pack's nodes join the palette; four declarative emitters, never code); r139 Clean Code and Architecture pass; r140 the Settings page (see the r141 row). |
| r133 | **Linking without touching HTML** | ([plan](docs/plans/r133-page-linking.md)): Zeis proposed an After Effects pick-whip (drag a wire from the sidebar page onto the text that should link to it); the verdict — right instinct, wrong physics for a *drag* — shipped as **click-click with the noodle kept**: the 🔗 toolbar button is a popover listing the site's pages (link the selection, or insert the path bare); every sidebar page row has a 🎯 socket that arms *point-to-link* — a wire renders from the socket to the cursor (reroute-nodule tip, follows across the iframe via a same-origin forwarder, ghost-fades on place/Cancel/Esc), the next click inside the page becomes the link, existing links retarget. |
| r132 | **Website builder audit** | ([plan](docs/plans/r132-website-builder-audit.md)): full read of the builder surface; three real defects fixed — the visual editor silently *ran page scripts* while editing (now CSP-blocked in the editing copy, scripts preserved), "Delete site" had no confirmation, and hosts/paths shipped verbatim (now normalized on blur). Plus: `WebsiteDefinition.popular` exposed end-to-end with an honest unverified hint (the docs/03 Q12 self-test is buildable), `hiddenBits` surfaced in the page scan, duplicate/slash-less path warnings, Save HTML export, named toggles for assistive tech. |
| r130 | **The Dry run** | ([plan](docs/plans/r130-quest-simulator.md)): a top-bar button compiles the project, evaluates the real emitted `dist/mod.js` against a recording stub SDK and walks every quest — the trace of what fires, how each objective completes, and a probe that fires the runtime's own trigger listeners with a payload shaped the way the conditions expect ("would tick / would never tick"). Cookbook gained Port forwarding and **Pacing** cards and the payload/handler line; `computeWarnings` now flags shared and placeholder hosts. Simulates the editor's runtime, and says so in the dialog. |

---

### Standing rule

**Never guess. Check, test, confirm.** Every claim about what the game or SDK
does must be backed by one of: the SDK declarations, the working reference mod,
or a real in-game test. A fix shipped on a theory has cost this project more
rounds than any bug — see r41, r43, r55, r60, r61 and r66.

### Known limitations (not bugs)

| Item | Why |
|---|---|
| No ctrl+drag to deselect | Three rounds (r93–r95) failed to make it work in a real browser and it was dropped as not worth the cost. React Flow sends no change events for a box over already-selected nodes, and the geometry workaround needed a store subscription firing every frame. **Ctrl+click** to deselect works. |
| No Wi-Fi networks (node hidden) | SDK 0.21.0 has no wireless API. `world.wifi` is hidden from the palette but kept in the schema and compiler for forward-compat; Cold Storage models wireless as a router network. |
| No Twotter | Removed in r31: the SDK declares it but this build does not honour it. Revisit if a newer build ships it. |
| No log-cleaning node | Entirely engine-side: the game logs connections on the machine, and the player wipes them from its own UI. |


Rounds 100–115 are archived at
[`docs/archive/rounds-100-115.md`](docs/archive/rounds-100-115.md). Rounds 1–74
are in the build log at [`docs/02-editor-shell.md`](docs/02-editor-shell.md),
which is kept as an archive — the bug histories in it explain several of the
rules the code now follows.

### Build status

All four original steps are complete — the editor builds playable mods. The
work since has been in-game QA, and the polish that came out of it.

Counted from the code at build `2026-09-12.r144`: **1,378 tests** across 66
files, **34 node types** in 10 categories (33 in the palette — Wi-Fi is hidden),
**13 templates** (11 playable + 2 reference sheets), **92 game events**,
against `@hotbunny/hackhub-content-sdk@0.21.0`.

### Documentation

| Document | What it is |
|---|---|
| [`docs/HANDOFF.md`](docs/HANDOFF.md) | **Current state, and what is next.** Start here when picking the project up. |
| [`docs/06-how-it-works-today.md`](docs/06-how-it-works-today.md) | **Start here.** How the editor is built as it stands, and the rules the code follows. |
| [`docs/01-analysis-and-architecture.md`](docs/01-analysis-and-architecture.md) | The original design and its reasoning. |
| [`docs/02-editor-shell.md`](docs/02-editor-shell.md) | Archive: the build log for rounds 1–74. Stale figures, load-bearing bug histories. |
| [`docs/03-questions-for-the-developers.md`](docs/03-questions-for-the-developers.md) | Open questions about the game and SDK. |
| [`docs/04-engine-bug-quest-completion.md`](docs/04-engine-bug-quest-completion.md) | The engine bug that stops a mod quest completing. |
| [`docs/05-bug-report-for-hotbunny.md`](docs/05-bug-report-for-hotbunny.md) | The consolidated report sent to the game's developer. |
| [`docs/07-dev-response-mod-sdk-bug-report-response.md`](docs/07-dev-response-mod-sdk-bug-report-response.md) | The developer's reply — **fenced**: promised, not shipped. Read the banner before acting on it. |
| [`docs/plans/`](docs/plans/) | Per-round working notes: the evidence behind specific fixes. |
| [`docs/In-Game-Handbook.md`](docs/In-Game-Handbook.md) | Zeis's transcription of the game's handbook — the top authority for how a player acts. |
| [`reference/Official-Quest/`](reference/Official-Quest/) | Zeis's transcriptions of the official quests (8 — the complete official set) — how real quests flow, cross-checked in [`docs/plans/r127-official-quest-comparison.md`](docs/plans/r127-official-quest-comparison.md); the hardcoded Journalist's Sister line (13 quests) analyzed in [`docs/plans/r131-journalists-sister-analysis.md`](docs/plans/r131-journalists-sister-analysis.md). |
| [`.github/agents/clean-code-architect.md`](.github/agents/clean-code-architect.md) | The clean-code & architecture agent brief — the code-quality rulebook LLM sessions work by. |
| [`docs/archive/`](docs/archive/) | Retired roadmap history (rounds 100–115). |

---

## Repository layout

```
Launch.bat                          # Windows one-click launcher
docs/
  01-analysis-and-architecture.md   # Step 1 — schema, stack, architecture
  02-editor-shell.md                # Steps 2–4 — contracts + build log, rounds 1–74
  03-questions-for-the-developers.md# Open questions about the game and SDK
  04-engine-bug-quest-completion.md # The freeze-on-complete engine bug
  05-bug-report-for-hotbunny.md     # Consolidated report sent to the developer
  06-how-it-works-today.md          # How the editor is built as it stands
  HANDOFF.md                        # Current state, and what is next
  In-Game-Handbook.md               # Zeis's transcription of the game's handbook
  plans/                            # Per-round working notes (the evidence)
  archive/                          # Retired roadmap history
reference/
  generate-event-catalogue.mjs      # parses the SDK's index.d.ts → event palette data
  hackhub-events.json               # all 92 events with verified payloads (generated)
  Official-Quest/                   # Zeis's transcriptions of the game's official quests
scripts/
  build-naza-pages.mjs              # regenerates the "public agency" site template
public/
  fonts/                            # self-hosted woff2 typefaces + their OFL licences
src/
  schema/                           # the ProjectDocument model (Zod) — the product's spine
    registry.ts                     #   one description per node type: palette, handles,
                                    #   inspector fields and lifecycle hook all read this
    events.ts                       #   the 92-event catalogue, with real payloads
    migrate.ts                      #   upgrades old drafts (e.g. the 4 comms node types
                                    #   that became one general dialogue node)
  analysis/                         # node + field warnings (issues with next steps)
  store/                            # Zustand + Immer: undo/redo, autosave
  editor/
    canvas/                         # React Flow surface, typed nodes and edges
    settings/                       # editor preferences (theme, font, snap, grid, wires) —
                                    #   editor-only, never part of the project document
    palette/                        # searchable node library
    inspector/                      # registry-driven field renderer, event + condition
                                    #   pickers, list and network-device editors
      sims/                         # the conversation editors + live call/chat previews
    websites/                       # WYSIWYG website builder, site/page templates,
                                    #   HTML import, AI-prompt helper
    shell/                          # top bar, quest tabs, status bar, overlays,
                                    #   dialogue editor, export dialog
  compiler/                         # Step 4 — project → mod folder (manifest, dist/mod.js
                                    #   interpreter, scaffolding), permissions, advice
  templates/                        # starter + reference quests (deterministic builds)
```

**One table drives four subsystems.** Every node type is described once in
`NODE_TYPES_REGISTRY`; the palette, the canvas handles, the inspector form and the
compiler all read that description. Adding a node type is a single registry entry —
no component changes. See
[docs/02 §2](docs/02-editor-shell.md#2-the-schema-is-the-product).

### Regenerating the event catalogue

The trigger palette is generated from the SDK's own type declarations rather than
transcribed from the docs, so it cannot drift silently:

```bash
npm i -D @hotbunny/hackhub-content-sdk
node reference/generate-event-catalogue.mjs
# or, against an arbitrary declarations file:
node reference/generate-event-catalogue.mjs --sdk path/to/index.d.ts
```

The generator has an integrity gate: it refuses to write (exit 1) and prints a
diagnostic if a future SDK version introduces a shape the parser mishandles. A
silently-wrong palette would be much worse than a failed regeneration.

---

## Settled decisions

Four decisions materially changed the architecture. All four are settled; the details
and their consequences are in
[§8 of the architecture doc](docs/01-analysis-and-architecture.md#8-settled-decisions).

1. **Delivery** — **browser app, ZIP export.** Vite SPA, no server, no desktop shell.
2. **SMS** — **dropped.** No native primitive exists, so no SMS editor ships. The
   conversation editors are Phone calls, E-Mail, Kisscord and WeeChat.
   **Twotter is dropped too** (round 31): a quest-declared account reaches the
   save with an undefined `bio`, and the game's own Twotter search calls
   `.toLowerCase()` on it — so searching for any word that does not match
   something else crashes the game, before *and* after the mod is uninstalled,
   with no API a mod can use to repair the record. Seven in-game QA rounds; the
   full account is in
   [docs/02 “Round 31”](docs/02-editor-shell.md). It comes back when the SDK
   does.
3. **Granularity** — **many quests per mod**, with single-quest as the default
   new-project template.
4. **Generated code** — **the editor owns it.** Re-exporting overwrites `src/`;
   the project document is the only durable state.

---

## License

MIT — see [LICENSE](LICENSE).

HackHub and the HackHub Content SDK are © HotBunny Interactive Entertainment Inc.
This project is an independent third-party tool and is not affiliated with or endorsed
by HotBunny.
