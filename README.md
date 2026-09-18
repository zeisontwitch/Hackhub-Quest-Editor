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
| 1 | **SDK 0.24 follow-up choices** | Wi-Fi, phone end-flow / quest-ending APIs, the `Ask player` prompt node, and the Scheduler/Time (as the r172/r173 **Timer** node with delay, relative units and fixed-date modes) are exposed and verified. **S-04 is answered** (clock zone: local), and the QA folder is closed with no pending checks — [`reference/sdk-0.24-qa/STATUS.md`](reference/sdk-0.24-qa/STATUS.md) is the ledger. Remaining queue: the **Twotter re-implementation check** (next), mail cleanup/replyability QA, then the phone-proxy/eavesdrop investigation. HTTP/curl/DNS collaborator nodes stay fenced until SteelWaffe answers the upstream gaps. See [`docs/plans/r167-wifi-exposure-and-sdk024-roadmap.md`](docs/plans/r167-wifi-exposure-and-sdk024-roadmap.md). |
| 2 | **Date deprecation warning (`moment` RFC2822)** | Only appears with a quest-editor mod installed, 30–90s after a mail is sent, when a browser or app screen is opened. The stack is the game's own date formatting and we never set a date on anything — question 10 in the bug report. |

### Next up

| # | Item | Notes |
|---|---|---|
| 1 | **Twotter comes back — plan, revision 2** | ([plan](docs/plans/r185-twotter-return.md)) Zeis's answers are folded in. Mod-level **Twotter accounts** (handle, display name, bio, avatar/banner, verified, counts, per-account "remove when the quest ends" toggle), removed only if the quest created them and no other live quest still declares them. The node — named **"Twotter"** — posts a **list of tweets**, each with its own time (when the story arrives, or earlier by amount + unit), so a profile can be found carrying a month of history like @alinamack's in the Journalist's Sister line. A **migration** maps pre-r31 drafts instead of deleting their tweets; a strict **fence set** keeps the declarative `TwotterAccounts`/`Tweets` fields out of every build; QA rows **P-01** then T-08…T-15 plus `qe24 twotter audit`. The **whimsy**: the canvas card stays a normal card, the click-to-edit **mock profile** lives in the Twotter panel, and the node previews the tweet timeline. **P-01a is green** — the platform keeps a `sendedAt` we send, so backdated series ship on the API path (the runnable checklist and its result table: [`reference/sdk-0.24-qa/P-01-BACKDATE.md`](reference/sdk-0.24-qa/P-01-BACKDATE.md)). **P-01b is the last look** — which way a profile sorts: raw harness **1.0.13**, `qe24 twotter order`, account `qe24_probe`, three letters back. |
| 2 | **Mail cleanup / replyable mail QA** | Focused QA first: `Mail.send()` id shape, `Mail.remove(id)` timing, whether `QuestMailDefinition.replyable` actually renders a Reply button, what event a reply raises, and cleanup on complete/unload. Then turn the verified parts into authoring. |
| 3 | **Phone proxy / eavesdrop QA** | xu reports phone calls can be proxied/listened to without the callers knowing. First pass found no declared SDK phone-proxy API, so ask for a snippet or exact in-game route and run a raw probe before exposing anything. See [`docs/plans/r171-inspector-polish-and-phone-proxy-investigation.md`](docs/plans/r171-inspector-polish-and-phone-proxy-investigation.md). |
| 4 | "Contact-driven story" template | Cold Call (r122) covers the conversation shape — Kisscord plus WeeChat, no break-in. The phone-brief + objective-gated-drip variant from the original spec is still open. |
| 5 | "Branching consequence" template | A choice that changes which ending the player gets. "Two Ways Out" is approved (may be morally grey) but not yet built. The official Cryptographer Hunt (a phone social-engineering scene with a fail route on the wrong choice) is the strongest argument for it — see [`docs/plans/r127-official-quest-comparison.md`](docs/plans/r127-official-quest-comparison.md). The shape now ships inside The Long Game (r136, act III: a typed verdict with two endings); whether a standalone template still adds anything is Zeis's call. |

### Done recently

| # | Item | Notes |
|---|---|---|
| r184 | **The QA ledger closes** | ([plan](docs/plans/r184-qa-ledger-closed.md)) The last two Timer rows landed: **S-11 green** — `qe24 schedule 120` changed the clock panel's `NEXT EVENT` to **1 h 55 m and it ticked down**, so a mod's scheduled job does appear there when it is the nearest one (the earlier `4d 6h` reading was the game's own job being nearer, not a fence) — and **S-10 shelved** by Zeis's decision, recorded as a decision and not a pass. The short-month clamp stays covered by unit tests, and the row returns only if a bug report asks for it. He also confirmed the r183 row-fold fix visually and called it "nicely responsive when pushing or pulling the inspector drawer" — the confirmation jsdom could not give. `reference/sdk-0.24-qa/STATUS.md` now says plainly that there is nothing left to run, and with nothing left to verify the next round is the Twotter re-integration, planned for review in [`r185`](docs/plans/r185-twotter-return.md). Export stamp only. |
| r183 | **The boxes were cut off — inspector rows that fold** | ([plan](docs/plans/r183-inspector-row-width.md)) The third fixture pass closed **S-12** and **S-15** — the screenshots show both migration fixtures opening on their quest with the migrated values intact (**Wait** + hours **2** with the readback "= 2 hours"; **A coming day** with the clock at **18:23**, the preview "Fires in 2 weeks, at 18:23 in-game…" and the card reading `in 2w at 18:23`) — and answered the question they raised: those rows are **editor-only**, no export or in-game step. It also caught a real editor bug: the Timer's four-box "In" row needs about **28rem** of panel (24px padding + 6px gap + ~36px unit caption + the number box, per cell) and the docked inspector is **340px**, so the boxes ran off the right edge. The row is now a **`@container`** and folds to 2 × 2 below the width its captions need, opening back to one line of four above 28rem; the six-box Wait row keeps its shipped two lines and only folds in a narrow floating drawer. Widening the default was rejected on purpose — the panel's floor is still 340px and a floating drawer can be 280, so a wider default would only move the cliff. jsdom has no layout, so the tests assert the shape of the fix (a container, a fold, and no bare `grid-cols-4`) and the pixels are a screenshot pass. |
| r182 | **The S-12/S-15 blocker was an editor bug — and a log that miscounted** | ([plan](docs/plans/r182-fixtures-and-honest-log.md)) The second Timer run closed **S-03** — the tester could not find the cancel evidence, but it was in the log he pasted (`timer node … armed after 2h` → `OnAbandon: starting` → `cancelled …` → nothing fired in the next two real minutes) — and turned up two defects of ours. **The editor bug:** both migration fixtures opened as *"No quest selected"*, an empty canvas and the first-run "browse templates" hint, because neither file carries `editor.activeQuestId` (old, hand-written shapes — what a migration fixture *is*) and no load path picked a quest; that is indistinguishable from a broken file, and it is not fixture-specific (any hand-written project, or one whose active quest was deleted, opened the same way). `ProjectSchema` now points the editor at the first quest that ships, so file load, import, the autosaved draft, template construction and the QA export generator all agree — in the schema, because a repair that can be forgotten at a call site is how the bug happened. **The log:** completing a quest reported *"cancelled 2 pending timer(s)"* when one timer had already fired and only one was left; fired jobs are now dropped as they fire, and a test asserts the cancel call names the pending job and not the fired one. S-11 came back partly answered (the clock panel showed the **game's own** job, not the mod's, so a mod job does not take `NEXT EVENT` ahead of it) with a two-minute recipe for the definitive check, and S-10 still waits for a 29th–31st in-game date. |
| r181 | **Quiet QA — the notification storm, and the rows his paste already answered** | ([plan](docs/plans/r181-quiet-qa.md)) Zeis ran the Timer rows and reported *"a bit of a mess"* — correctly, and it was ours: by r180 the export and harness auto-started **five** QA quests at load (four with toasting debug nodes) on top of quests an earlier build had left claimed, so the journal could not be read and a toast could not be counted; two rows were skipped explicitly because of it. Fixed: **every QA quest is claimed on demand** — harness **1.0.11** adds **`qe24 run`** (`qe24 run` lists, `qe24 run cal` claims exactly one, `qe24 run clear` removes what an older build left behind — `Quest.claim`/`Quest.unclaim` are declared for exactly this), debug nodes no longer toast, and two guards assert no QA quest auto-starts and no QA debug node toasts. The run also **closed ten of the fifteen rows**: the `qe24 timers` pastes show the same five jobs with *identical ids and raw timestamps* across save/quit/reload (S-02, S-07), the mixed row resolving to **Tue 3 Nov 18:23** = 18 Sep + 1 month + 2 weeks + 2 days with the clock pinned (S-08, S-13, and by chaining also S-05/S-06), and `Wait 1 month` resolving to **18 Oct 19:27** — same day number, same time (S-09, S-14); a bonus finding is that the calendar rows hold their promised wall-clock time across a DST boundary (armed CEST, fires CET). Five rows remain, none needing a wait: S-03, S-10, S-11 and the two "open a file in the editor" fixtures. |
| r180 | **The Twotter verdict, and the checklist that did not exist** | ([plan](docs/plans/r180-twotter-verdict-and-timer-checklist.md)) Two things, both from the r179 probe's return. **Twotter:** the probe came back **green on the read path** — a record planted with `bio: undefined` (the exact r31 crash shape) is searched, listed and opened with no crash on game 1.3.0 / build 25388883, `createUser` + `addUser` produce a real account the engine fills in, tweets appear and `PostSeen` fires, and `removeUser` returns `true` for all three accounts **including the quest-declared one**, which is the repair the old bug report said no mod could ever do. One claim did *not* hold: "affected saves are repaired on load" left the planted record's bio `undefined` after a reload — harmless now that the read path is guarded, but nothing may depend on it. One new finding: `Twotter.AccountCreated` does **not** fire for an account added through the API, so no objective may hang on it. **The checklist:** Zeis could not find the S-05…S-15 rows anywhere — they lived as prose in three round plans, and the export's `QESdk024TimerQa` only ever covered S-01…S-03, so there was nothing to install that would run them. Fixed in the folder testers look at: [`TIMER-ROWS.md`](reference/sdk-0.24-qa/TIMER-ROWS.md) gives every row its own steps, and the rows became runnable instead of merely documented — harness **1.0.10** adds **`qe24 timers`**, which prints every pending Scheduler job with the in-game moment it will fire (a "1 month" row is now read, not waited for; 26 in-game days is ~10 real hours), and the QA project gains two auto-start quests that arm an already-past exact date, a coming day already past today, a mixed `1 month 2 weeks 2 days at 18:23` row and a `Wait 1 month` row, plus two legacy fixture drafts to open in the editor for the migration rows. +5 tests, 5/5 falsified. |
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
