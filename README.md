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
| 2 | Website pages: `description` + `search[]` | The SDK's `WebsitePageDefinition` supports both and the reference mod uses both; we emit only `path`/`title`/`html`/`seo`. Affects in-game search. |
| 3 | Old quest mail is never cleaned up | Mail sent by an uninstalled mod stays in the inbox. The `Mail` namespace has no delete, so there may be nothing we can do — question 9 in the bug report. |
| 4 | **Date deprecation warning (`moment` RFC2822)** | Only appears with a quest-editor mod installed, 30–90s after a mail is sent, when a browser or app screen is opened. The stack is the game's own date formatting and we never set a date on anything — question 10 in the bug report. |

### Next up

| # | Item | Notes |
|---|---|---|
| 5 | **Settings page** | The wire-physics dials currently live in the debug panel, which is a developer tool. They — and the snap/animation/physics toggles — deserve a proper home an author can find. |
| 6 | "Contact-driven story" template | Cold Call (r122) covers the conversation shape — Kisscord plus WeeChat, no break-in. The phone-brief + objective-gated-drip variant from the original spec is still open. |
| 7 | "Branching consequence" template | A choice that changes which ending the player gets. "Two Ways Out" is approved (may be morally grey) but not yet built. The official Cryptographer Hunt (a phone social-engineering scene with a fail route on the wrong choice) is the strongest argument for it — see [`docs/plans/r127-official-quest-comparison.md`](docs/plans/r127-official-quest-comparison.md). |

### Known limitations (not bugs)

| Item | Why |
|---|---|
| No ctrl+drag to deselect | Three rounds (r93–r95) failed to make it work in a real browser and it was dropped as not worth the cost. React Flow sends no change events for a box over already-selected nodes, and the geometry workaround needed a store subscription firing every frame. **Ctrl+click** to deselect works. |
| No Wi-Fi networks (node hidden) | SDK 0.21.0 has no wireless API. `world.wifi` is hidden from the palette but kept in the schema and compiler for forward-compat; Cold Storage models wireless as a router network. |
| No Twotter | Removed in r31: the SDK declares it but this build does not honour it. Revisit if a newer build ships it. |
| No log-cleaning node | Entirely engine-side: the game logs connections on the machine, and the player wipes them from its own UI. |

### Done recently

| Round | Item |
|---|---|
| r128 | **Both r127 proposals built, and the developer's reply filed under a fence.** [`docs/07`](docs/07-dev-response-mod-sdk-bug-report-response.md) is verbatim with a status banner: nothing in it is in the pinned SDK yet, so nothing implements and no workaround comes off. **Six Tries** (Advanced) is the official quests' crack-and-log-in route — hydra tool response keyed user+target, an objective reading the cracked credential off `Terminal.Hydra`, then `ssh -h` (three pins guard exactly that; falsified). **Quest Cookbook** (Reference sheet) maps each official-quest technique to the nodes that express it — including the honest "engine-only" ones. r127's Proposal B was re-surfaced: `handbookArticles.ts` is the in-game Handbook's jump list, not editor guidance, so the cookbook is canvas furniture like the Node Reference. Stamp `2026-09-09.r128`. |
| r126 | **Template audit: three quests had stories that could not end.** First Contact never paid — its payment was wired to "On quest complete", which never fires with the defaults — and Byline/Cold Storage lost their closings the same way; all rewired to end from the last objective. Cold Storage's database had no tables for its own read-ledger trigger (seeded `lead_ledger`). Help Desk's client confirmed a file nobody sent (new `send-report` objective). Help Desk taught `ssh user@ip`; the handbook says `ssh -h user@ip`. New guards: a wired On-complete warns, and database rows are shaped as `{value, type}` for the engine. (Ledger has the same dead wiring — deferred per Zeis.) |
| r125 | **Zeis's 14-item UX check, end to end** ([plan](docs/plans/r125-zeis-ux-check-fixes.md)): human event names with explanations, port presets, guided firewall addresses, Place-files rename, tag picker on every tag-taking box, database table editor, a working Open-handbook node, numbered sequence outputs, silent story beats. Fixed en route: the firewall rule was a list field over single-object data, so fresh nodes showed "None yet" for a rule they had. |
| r124 | **Hookup warnings say which nodes to put where** ([plan](docs/plans/r124-actionable-hookup-warnings.md)). Every node issue carries a `nextStep`, shown in the inspector header and both canvas tooltips; field warnings gained empty-IP and seed-files placement checks. |
| r123 | **Editor UX audit** ([plan](docs/plans/r123-editor-ux-audit.md)): field-level warnings (a red ⚠ beside the label, hovered for what's wrong + the next step) and a plain-language sweep under the "no mod-coding jargon" rule — the game's own vocabulary (`nmap`, `metasploit`, `{{data.targetIp}}`) stays. |
| r122 | **Template rebuild complete.** Cold Storage and Bad Attachment built on Zeis's call to playtest rather than gate; module split (`kit.ts` + one module per template); all ten templates ship. |
| r121 | **Template rebuild, the bulk of it**: the beginner tier (First Contact, The Byline, Cold Call) and the rebuilt Help Desk Leak land; the four legacy templates are deleted. |
| r120 | **Remote file seeding**: "Place files" aimed at a device folded into nothing — it now lands in the device's owning user at build time, and says plainly when it can't place something. Template work also split into one module per template (the write-size limit kept biting). |
| r119 | **Handbook gap analysis** ([plan](docs/plans/r119-handbook-gap-analysis.md)): Zeis's 4,102-line transcription of the in-game handbook, now the top authority for how a player acts. Settled phishing (the mod doesn't author the attachment — metasploit generates it), Suspicion, port forwarding, log paths; contradicted three r117 guesses. |
| r118 | **Ledger fix**: `extraAccounts: false`, so the exploit lands the player as `aritter` instead of a guest — the one-line correction from the rebuild plan. |
| r117 | **Template rebuild plan** ([plan](docs/plans/r117-template-rebuild-plan.md)): nine entries across three tiers (Beginner/Advanced/Expert), two website styles, the phishing flow, a multi-tool expert chain — plus the mechanical exploitability test, which corrected two claims the r116 audit got wrong. |
| r116 | **Template audit, findings only** ([plan](docs/plans/r116-template-audit.md)): three templates ask the player to break in and were never given the account setup that allows it; `investigation` ships two nodes that compile to nothing. Plus a re-read of what each template is for. |

Rounds 100–115 are archived at
[`docs/archive/rounds-100-115.md`](docs/archive/rounds-100-115.md). Rounds 1–74
are in the build log at [`docs/02-editor-shell.md`](docs/02-editor-shell.md),
which is kept as an archive — the bug histories in it explain several of the
rules the code now follows.

### Build status

All four original steps are complete — the editor builds playable mods. The
work since has been in-game QA, and the polish that came out of it.

Counted from the code at build `2026-09-09.r128`: **1,197 tests** across 55
files, **32 node types** in 9 categories (31 in the palette — Wi-Fi is hidden),
**12 templates** (10 playable + 2 reference sheets), **92 game events**,
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
| [`reference/Official-Quest/`](reference/Official-Quest/) | Zeis's transcriptions of the official quests (7 so far; "Journalist's Sister" pending) — how real quests flow, cross-checked in [`docs/plans/r127-official-quest-comparison.md`](docs/plans/r127-official-quest-comparison.md). |
| [`.github/agents/clean-code-architect.md`](.github/agents/clean-code-architect.md) | The clean-code & architecture agent brief — the code-quality rulebook LLM sessions work by. |
| [`docs/archive/`](docs/archive/) | Retired roadmap history (rounds 100–115). |

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
npm install
npm run dev          # → http://localhost:5173
```

**Development commands:**

Only relevant to coders, if you just want to use the tool you can ignore this.

```bash
npm run typecheck    # tsc --noEmit
npm test             # 1,197 tests (vitest)
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
