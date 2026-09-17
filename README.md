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
npm test             # 1,634 tests (vitest)
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

2. **The event catalogue must come from the pinned SDK, not stale prose.**
   Older guide pages said `Terminal.NmapScan` was `{ ip, ports }`; the runtime
   emits `{ ip, versionScan? }`. They said `Quest.Claimed` was `{ questName }`;
   it is `{ name, id }`. The editor now generates its event list from the
   installed SDK declarations (currently 99 events in SDK 0.24.0), because an
   editor built from stale prose would generate triggers that never fire.

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
| 1 | **SDK 0.24 follow-up choices** | Wi-Fi, phone end-flow / quest-ending APIs, the `Ask player` prompt node, and the Scheduler/Time (as the r172/r173 **Timer** node with delay, "in N days at HH:MM" and fixed-date modes) are exposed. Current queue: mail cleanup/replyability QA, Twotter update/remove QA, then the phone-proxy/eavesdrop investigation. HTTP/curl/DNS collaborator nodes stay fenced until SteelWaffe answers the upstream gaps. Timer rows S-01–S-04 and S-09–S-12 are on Zeis's in-game pass (export 1.0.4, raw harness 1.0.7). See [`docs/plans/r167-wifi-exposure-and-sdk024-roadmap.md`](docs/plans/r167-wifi-exposure-and-sdk024-roadmap.md). |
| 2 | **Date deprecation warning (`moment` RFC2822)** | Only appears with a quest-editor mod installed, 30–90s after a mail is sent, when a browser or app screen is opened. The stack is the game's own date formatting and we never set a date on anything — question 10 in the bug report. |

### Next up

| # | Item | Notes |
|---|---|---|
| 1 | **Mail cleanup / replyable mail QA** | Focused QA first: `Mail.send()` id shape, `Mail.remove(id)` timing, whether `QuestMailDefinition.replyable` actually renders a Reply button, what event a reply raises, and cleanup on complete/unload. Then turn the verified parts into authoring. |
| 2 | **Twotter update/remove QA** | SDK 0.24 now declares `Twotter.updateUser(id, patch)` and `Twotter.removeUser(id)`, with cleanup semantics in the docs. Verify in game that they repair/remove save records, posts, follows and search safely before restoring Twotter authoring. |
| 3 | **Phone proxy / eavesdrop QA** | xu reports phone calls can be proxied/listened to without the callers knowing. First pass found no declared SDK phone-proxy API, so ask for a snippet or exact in-game route and run a raw probe before exposing anything. See [`docs/plans/r171-inspector-polish-and-phone-proxy-investigation.md`](docs/plans/r171-inspector-polish-and-phone-proxy-investigation.md). |
| 4 | "Contact-driven story" template | Cold Call (r122) covers the conversation shape — Kisscord plus WeeChat, no break-in. The phone-brief + objective-gated-drip variant from the original spec is still open. |
| 5 | "Branching consequence" template | A choice that changes which ending the player gets. "Two Ways Out" is approved (may be morally grey) but not yet built. The official Cryptographer Hunt (a phone social-engineering scene with a fail route on the wrong choice) is the strongest argument for it — see [`docs/plans/r127-official-quest-comparison.md`](docs/plans/r127-official-quest-comparison.md). The shape now ships inside The Long Game (r136, act III: a typed verdict with two endings); whether a standalone template still adds anything is Zeis's call. |

### Done recently

| # | Item | Notes |
|---|---|---|
| r177 | **Every unit, both ways — the Timer's relative rows** | ([plan](docs/plans/r177-every-unit.md)) Zeis: "what if an author wants `1 month` `2 weeks` `2 days` from now at exactly `18:23`?" — and, on the boundary the reply proposed, "more choices for the authors … not limit them". Both relative rows now take **one box per unit**. *A coming day* counts **years / months / weeks / days** from now and pins the clock ("in 1 month 2 weeks 2 days, at 18:23"), with the calendar clamp applied **once**, before weeks and days are added (31 Jan + 1 month = 28 Feb; + 1 day = 1 March, never 3 March). **Wait** takes every unit, calendar included, so "in 1 month 2 weeks 2 days and 4 hours" is expressible with no clock to pin — months and years go through `Scheduler.scheduleAt`, because the engine's duration form has no month field, while a pure days/hours/minutes wait keeps the exact `schedule()` path S-01/S-02 verified. The arm log names the rule in the author's own units. The r176 `offsetAmount`/`offsetUnit` pair migrates into its box silently; the pre-r176 `offsetDays` key kept its name through both rounds and needs no rewrite at all. +14 tests. |
| r176 | **The Timer's inspector — a digital clock, real rows, and "in 1 year from now"** | ([plan](docs/plans/r176-timer-calendar-ux.md)) The Timer's time entry is now the game's own display: a dark inset clock panel with zero-padded 24-hour digits, ▲▼ steppers, ↑/↓ keys that wrap 23↔00 and 59↔00 without touching the date, a colon that breathes while focused and a one-shot digit flip — CSS only, nothing per frame, and both animations drop under `prefers-reduced-motion`. The three ways to wait are a segmented picker; the duration sits on one row with unit captions and a normalising readback ("25 hours" → "1 day, 1 hour", storage untouched); the exact date gains month names and a live warning for days the calendar does not have ("31 June never arrives — June has 30 days"). "A coming day" becomes a real relative rule — **in [N] days / weeks / months / years from now, at HH:MM** — resolved inside the game at arm time (`offsetDays` splits into `offsetAmount` + `offsetUnit`, migrated silently), with short months clamped (31 Jan + 1 month = 28/29 Feb) and leap-day birthdays rolled to 28 Feb. A node type can now carry a live `preview` sentence above its fields; the canvas card reads "in 2w at 04:20" / "Mon 21 Sep, 04:20". +23 tests. |
| r175 | **Refreshed QA export + the r174 leftovers** | ([plan](docs/plans/r175-qa-export-and-leftovers.md)) Unblocks the in-game testing pass. `reference/sdk-0.24-qa/editor-export/` is regenerated from the QA project (mod **1.0.3**, editor build r175 — it had been the r166 export carrying `QESdk024EditorQa` alone) by a new `npm run gen:qa-export`, and a guard test now fails when the folder drifts from compiled output by a byte. The manual's "When it appears" line names the value a conditional field waits for ("Shown while **When it fires** is **After a delay** — the option it starts on. The other options hide it.") instead of the never-true "only once … is set", with G16 guarding it. The Quest-tab hints for **Complete automatically** / **Show a manual complete button** no longer claim the HackHub 1.1.2 freeze — in-game 1.3.0 QA shows completion, the button, retire and unclaim all work. The raw harness 1.0.7 adds `qe24 clock`, which settles the Timer `at` timezone question (S-04) by printing `Time.now` in both renderings. +4 tests. |
| r174 | **r172/r173 audit — the rename's missing migration + stale artifacts** | ([plan](docs/plans/r174-r172-r173-audit.md)) Full read-back of both Timer rounds against their own plans (history is squashed, so the evidence is code, artifacts and falsified tests). The Timer itself matches its plan — but the `flow.schedule` → `flow.timer` rename shipped **without a migration**, so an r172 draft or exported project failed validation and was discarded; fixed in `schema/migrate.ts` with 4 regression tests (falsified by revert). `public/manual/search-index.js` was stale (claimed r172 while every page said r173) and nothing guarded it — regenerated, and G15 now checks the index's stamp. The r173 plan's promised `"Timer"` label test was missing (added); the QA quest's mail sender is no longer `qe24-beats@test.net`; `docs/06` figures refreshed to r174. +6 tests. |
| r173 | **Timer rename + calendar modes** | ([plan](docs/plans/r173-timer-rename-and-calendar.md)) Zeis feedback on the r172 node: "Schedule beat" becomes the **Timer** (`flow.schedule` → `flow.timer`), "beat" is purged from the wording (it is a utility, not a story tool), and a **When it fires** select gains two calendar modes: **In N days at a set time** — "in 3 days at 12:00", resolved against `Time.date()` at arm time — and **On a specific in-game date & time**, via `Scheduler.scheduleAt`. Incomplete or already-past dates fail open (fire immediately). In-game QA rows S-04…S-08 (timezone probe, calendar fire, past time) await Zeis. Manual regenerated at 39 node types / 143 fields. |
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
| Wi-Fi Bettercap name wart | Create Wi-Fi is visible and exports through SDK 0.24's native API. Current game builds can still print `SSID: undefined` after Bettercap targets an SDK-created AP by BSSID, even though scan, join, handshake capture and hashcat recovery worked in r166 QA. |
| HTTP/curl and DNS collaborator nodes fenced | SDK 0.24 declares HTTP/collaborator events, but terminal `curl` was missing, DNS-only collaborator hits did not arrive, and static editor websites did not fire HTTP objectives in QA. Generic event triggers still list the raw events. |
| No Twotter authoring | SDK 0.24 declares update/remove helpers, but historical in-game Twotter behavior was unreliable. This is queued for a fresh QA scaffold before authoring returns. |
| No suspicion or SMS nodes | SDK 0.24 still has no Suspicion/log-forensics API and no SMS/text-message namespace or events. |
| No log-cleaning node | Entirely engine-side: the game logs connections on the machine, and the player wipes them from its own UI. |


Rounds 100–115 are archived at
[`docs/archive/rounds-100-115.md`](docs/archive/rounds-100-115.md). Rounds 1–74
are in the build log at [`docs/02-editor-shell.md`](docs/02-editor-shell.md),
which is kept as an archive — the bug histories in it explain several of the
rules the code now follows.

Older **Done recently** rows are archived at
[`docs/archive/rounds-130-150.md`](docs/archive/rounds-130-150.md) (historical filename).

### Build status

All four original steps are complete — the editor builds playable mods. The
work since has been in-game QA, and the polish that came out of it.

Counted from the code at build `2026-09-18.r177`: **1,634 tests** across 82
files, **39 node types** in 10 categories (all palette-visible), **13 templates**
(11 playable + 2 reference sheets), **99 game events**, against
`@hotbunny/hackhub-content-sdk@0.24.0`.

### Documentation

| Document | What it is |
|---|---|
| [`docs/HANDOFF.md`](docs/HANDOFF.md) | **Current state, and what is next.** Start here when picking the project up. |
| [`docs/06-how-it-works-today.md`](docs/06-how-it-works-today.md) | **Start here.** How the editor is built as it stands, and the rules the code follows. |
| [`docs/01-analysis-and-architecture.md`](docs/01-analysis-and-architecture.md) | The original design and its reasoning. |
| [`docs/02-editor-shell.md`](docs/02-editor-shell.md) | Archive: the build log for rounds 1–74. Stale figures, load-bearing bug histories. |
| [`docs/03-questions-for-the-developers.md`](docs/03-questions-for-the-developers.md) | Open questions about the game and SDK. |
| [`docs/04-engine-bug-quest-completion.md`](docs/04-engine-bug-quest-completion.md) | Historical freeze-on-complete report; SDK 0.24 / game 1.3.0 QA now shows the completion APIs working. |
| [`docs/05-bug-report-for-hotbunny.md`](docs/05-bug-report-for-hotbunny.md) | The consolidated report sent to the game's developer. |
| [`docs/07-dev-response-mod-sdk-bug-report-response.md`](docs/07-dev-response-mod-sdk-bug-report-response.md) | The developer's reply — **fenced**: promised, not shipped. Read the banner before acting on it. |
| [`docs/plans/`](docs/plans/) | Per-round working notes: the evidence behind specific fixes. |
| [`docs/In-Game-Handbook.md`](docs/In-Game-Handbook.md) | Zeis's transcription of the game's handbook — the top authority for how a player acts. |
| [`reference/Official-Quest/`](reference/Official-Quest/) | Zeis's transcriptions of the official quests (8 — the complete official set) — how real quests flow, cross-checked in [`docs/plans/r127-official-quest-comparison.md`](docs/plans/r127-official-quest-comparison.md); the hardcoded Journalist's Sister line (13 quests) analyzed in [`docs/plans/r131-journalists-sister-analysis.md`](docs/plans/r131-journalists-sister-analysis.md). |
| [`.github/agents/clean-code-architect.md`](.github/agents/clean-code-architect.md) | The clean-code & architecture agent brief — the code-quality rulebook LLM sessions work by. |
| [`docs/archive/`](docs/archive/) | Retired roadmap history that no longer fits in the living README. |

---

## Repository layout

```
Launch.bat                          # Windows one-click launcher
docs/
  01-analysis-and-architecture.md   # Step 1 — schema, stack, architecture
  02-editor-shell.md                # Steps 2–4 — contracts + build log, rounds 1–74
  03-questions-for-the-developers.md# Open questions about the game and SDK
  04-engine-bug-quest-completion.md # Historical freeze-on-complete report
  05-bug-report-for-hotbunny.md     # Consolidated report sent to the developer
  06-how-it-works-today.md          # How the editor is built as it stands
  HANDOFF.md                        # Current state, and what is next
  In-Game-Handbook.md               # Zeis's transcription of the game's handbook
  plans/                            # Per-round working notes (the evidence)
  archive/                          # Retired roadmap history
reference/
  generate-event-catalogue.mjs      # parses the SDK's index.d.ts → event palette data
  hackhub-events.json               # all 99 events with verified payloads (generated)
  Official-Quest/                   # Zeis's transcriptions of the game's official quests
scripts/
  build-naza-pages.mjs              # regenerates the "public agency" site template
public/
  fonts/                            # self-hosted woff2 typefaces + their OFL licences
src/
  schema/                           # the ProjectDocument model (Zod) — the product's spine
    registry.ts                     #   one description per node type: palette, handles,
                                    #   inspector fields and lifecycle hook all read this
    events.ts                       #   the 99-event catalogue, with real payloads
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
