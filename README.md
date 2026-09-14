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
npm test             # 1,416 tests (vitest)
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
| 1 | **Auto-generate button for name/IP-like fields** | Queued r152: a QoL dice button on fields like IP Address, Hostname, Domain, Router Model — generates a plausible random value **in the editor** (exports hardcoded, not a tag). Needs curated name/number lists to pull from or piece together. Open question for the build round: does the Create-network IP field accept the game's own random-IP tag? Any field that accepts tags should get the tag-insertion button, limited to the tags that field can actually use — audit all of them. |
| 2 | "Contact-driven story" template | Cold Call (r122) covers the conversation shape — Kisscord plus WeeChat, no break-in. The phone-brief + objective-gated-drip variant from the original spec is still open. |
| 3 | "Branching consequence" template | A choice that changes which ending the player gets. "Two Ways Out" is approved (may be morally grey) but not yet built. The official Cryptographer Hunt (a phone social-engineering scene with a fail route on the wrong choice) is the strongest argument for it — see [`docs/plans/r127-official-quest-comparison.md`](docs/plans/r127-official-quest-comparison.md). The shape now ships inside The Long Game (r136, act III: a typed verdict with two endings); whether a standalone template still adds anything is Zeis's call. |

### Done recently

| # | Item | Notes |
|---|---|---|
| r159 | **A discoverable grab handle for floating the Inspector** | ([plan](docs/plans/r159-inspector-dock-handle.md)) Usability fix on r158: the float feature shipped behind a small dim icon nobody found — the user reached for a handle to pull that wasn't there. Now the docked inspector's left edge carries a full-height grab handle: **click** it to float in place, **drag** it (past a 6px threshold) to pull the panel out under the cursor. The redundant top-right float icon button is retired (KISS — one obvious way); the collapse chevron stays. The handle is a real `<button>` so it's keyboard-focusable; its move/up listeners bind to `window`, not the handle, since the docked aside unmounts the instant it floats. New drag-to-float test; docked mode otherwise unchanged. |
| r158 | **Freely draggable + resizable Inspector drawer** | ([plan](docs/plans/r158-floating-inspector-drawer.md)) Next-up #1: the inspector can now be popped out of its right-edge dock into a free-floating drawer — drag the title bar to move it, drag the bottom-right grip to resize it, click Dock to snap it back. Layout is a per-author editor preference (`drawerLayout.ts`, same `useSyncExternalStore` + localStorage shape as snap/wire prefs), never in the project document; a `clampRect` invariant keeps the panel on screen so the drag handle can't be lost past an edge. Docked stays the shipped default and is unchanged. Reset-all-preferences re-docks it. |
| r157 | **Shortcuts cheat sheet refresh** | ([plan](docs/plans/r157-shortcuts-cheat-sheet-refresh.md)) Next-up #2, no behaviour change: the stale flat list is rebuilt as grouped sections (Editing · Add nodes · Select · Wiring · Move around), keys drawn as key caps and mouse gestures as plain italic text. Adds the shipped-but-undocumented gestures — Shift+A / right-click node search, drag-a-wire-to-empty create, double-click-a-wire reroute, box select, pan (middle/right-drag), scroll-zoom, frame title-bar drag, Ctrl+Y redo. Every row audited against the code that implements it; a new test drives the documented keys through the real hook so a future stale row fails CI (falsified by revert). |
| r156 | **Full-program Clean Code & Architecture audit** | ([plan](docs/plans/r156-full-program-clean-code-audit.md)) First whole-tree review since r139: the core is clean — no React/DOM/store in `schema`/`analysis`/`compiler` (AR1/AR2), no `getState()` in pure code (AR8), no cross-layer import cycle (AR3, the lone `Field↔ListEditor↔DeviceTree` one is essential form recursion), boundary `safeParse` intact (AR12), declarative permissions (AR17), escaping contained (AR16); zero `console.log`/`as any`/`TODO`. One direct fix: `store/editor.ts` now uses the existing `activeQuestOf` helper instead of eight inlined active-quest lookups (A3 DRY). Behaviour-neutral; two deferred recommendations logged (tighten `tokenPermissions` token matching, wire up ESLint/Prettier scripts). |
| r155 | **Telnet/HTTPS presets + vuln display descriptions** | ([plan](docs/plans/r155-ports-vuln-labels.md)) Queue #6, no behaviour change: "Add a common port" gains Telnet (23) and HTTPS (443, already authored in templates) with blank versions per the no-invention rule; the vulnerability dropdown shows "RCE (run any command)"-style descriptions while values stay the raw enum, so exports are byte-identical. |

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

Rounds 130–153 are archived at
[`docs/archive/rounds-130-150.md`](docs/archive/rounds-130-150.md).

### Build status

All four original steps are complete — the editor builds playable mods. The
work since has been in-game QA, and the polish that came out of it.

Counted from the code at build `2026-09-14.r159`: **1,470 tests** across 75
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
