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
| 1 | **Waiting on the game developer** | The consolidated bug report is with him ([`docs/05-bug-report-for-hotbunny.md`](docs/05-bug-report-for-hotbunny.md)). The blocker is that HackHub 1.1.2 freezes whenever it finishes a mod-defined quest, so generated quests end their story without formally completing. |
| 2 | Website pages: `description` + `search[]` | The SDK's `WebsitePageDefinition` supports both and the reference mod uses both; we emit only `path`/`title`/`html`/`seo`. Affects in-game search. |
| 3 | Old quest mail is never cleaned up | Mail sent by an uninstalled mod stays in the inbox. The `Mail` namespace has no delete, so there may be nothing we can do — question 9 in the bug report. |
| 4 | **Date deprecation warning (`moment` RFC2822)** | Only appears with a quest-editor mod installed, 30–90s after a mail is sent, when a browser or app screen is opened. The stack is the game's own date formatting and we never set a date on anything — question 10 in the bug report. |

### Next up

| # | Item | Notes |
|---|---|---|
| 5 | **Settings page** | The wire-physics dials currently live in the debug panel, which is a developer tool. They — and the snap/animation/physics toggles — deserve a proper home an author can find. |
| 6 | "Contact-driven story" template | Phone brief → Kisscord drip gated on objectives → WeeChat timed to a beat. |
| 7 | "Branching consequence" template | A choice that changes which ending the player gets. |

### Known limitations (not bugs)

| Item | Why |
|---|---|
| No ctrl+drag to deselect | Three rounds (r93–r95) failed to make it work in a real browser and it was dropped as not worth the cost. React Flow sends no change events for a box over already-selected nodes, and the geometry workaround needed a store subscription firing every frame. **Ctrl+click** to deselect works. |
| No Wi-Fi networks | SDK 0.21.0 has no wireless API. "Create Wi-Fi" exports as a router network reachable by IP. |
| No Twotter | Removed in r31: the SDK declares it but this build does not honour it. Revisit if a newer build ships it. |
| Handbook nodes are not compiled | Declared in the editor, no export path yet. |
| No log-cleaning node | Entirely engine-side: the game logs connections on the machine, and the player wipes them from its own UI. |

### Done recently

| Round | Item |
|---|---|
| r115 | **The released wire now winds home like a vacuum-cleaner cable**, and waits properly while the node search is open. Zeis's description was much clearer than my "pending" model: the wire should freeze on release, then either snap into a placed node or retract to its origin on an easeOutCubic ramp with a fade. The old ghost interpolated its sag to zero but left both endpoints where they were, so it dissolved in place rather than travelling. Three endings now behave differently: **held** while the search is open, **cleared** when a node is placed (the real edge takes over), **retracted** when the search is dismissed. Retraction and fade are separate dials, since the travel should carry the eye and the fade should stay out of its way. Zeis's tuned numbers are now the defaults — damping ratio **0.19**, far springier than my 0.75 guess. |
| r114 | **The ghost was never rendering, and the wire had no swing.** Both found by probing the real DOM rather than reasoning. (1) `.react-flow__edges` is a plain `<div>` — React Flow gives every edge its own `<svg>` child — so the ghost's bare `<path>` was created, kept in the DOM and never painted. That is exactly QA's "log says the ghost fired, screen shows nothing". It now brings its own `<svg>` wrapper. (2) The sag was a single scalar pointing straight down, so dragging sideways produced no swing: a hanging rope, never a pendulum. The midpoint now carries a horizontal offset that cursor motion throws and the same spring pulls back, scaled by slack so it fades as the wire pulls taut. The throw needed a **swing of 12, not 1** — against a stiffness of 520 a value of 0.9 peaked at 2px of travel, real and completely invisible. |
| r113 | **With physics off, the wire froze a few pixels out of its socket.** Caught by the new debug panel's event log on its first outing. r108 removed the `d` prop so React could not overwrite the physics loop — correct — but with physics *off* there is no loop, and the off-path painted once and then cleared its target, so nothing redrew the wire for the rest of the drag. "No spring" now means a straight wire that still tracks the pointer, not a frozen one, and still schedules no frames. |
| r112 | **Debug panel** — a *Debug* toggle in the canvas toolbar. Built because the last several rounds shared a shape: something upstream silently refused the feature, the UI looked identical either way, and the only way to find out was Zeis pasting console output. It shows the **build stamp** (a stale bundle looks exactly like a broken feature — and the stamp had been stuck at r88 for 24 rounds), whether physics is **allowed and which switch refused it**, live **counters and FPS** for the loop, a **recent-event log**, and **sliders for every spring number** so feel can be tuned in the browser instead of round-tripping guesses through me. Costs nothing while closed: no subscription, no timer, no render; the event log is a fixed 60-entry ring, and frame counting is coalesced so the panel cannot become the performance problem it exists to find. |
| r111 | **Tuned the wire, and stopped it vanishing into the node search.** QA: the wire felt "too floaty" and disappeared outright when dropped on empty canvas. Floatiness was low natural frequency rather than shallow sag — at `k=180` the spring took ~0.44s to settle, which reads as weightless — so stiffness and damping rose together (520/34) to roughly halve that while holding the damping ratio near 0.75, keeping the bounce. Sag deepened to 115 over a 560px taut distance. The vanishing was my own r108 decision: I deferred the snap-back while the search was open, reasoning the wire was "pending", but React Flow unmounts the connection line the instant the pointer lifts, so deferring meant it simply blinked out. The ghost is ~200ms and now plays immediately, recoiling to its socket while the search opens. |
| r110 | **The physics was switched off, by a gate nobody asked for.** The console said `motionAllowed = false` — the loop was refused before it ever started. Two causes, both mine. (1) I had added `prefers-reduced-motion` as a silent third gate, unprompted: an author with OS animations disabled got a toggle that did nothing and explained nothing, even after deliberately switching physics *on*. The preference now picks the **default** and never overrides an explicit choice, which is what the visible toggle is for. (2) The button read "Plain wires", which states the current mode but reads just as naturally as an action that will *make* them plain — QA tested a full round with physics off, believing it was on. It now reads **"Springy wires: on/off"** with a lit dot. |
| r108 | **Wire physics actually runs now.** r107 shipped it dead, and every unit test passed: the held wire's `<path>` carried a `d` prop, so React rewrote it to the straight bezier on each pointer move and wiped the loop's write — React winning sixty times a second. Nothing simulated a re-render, so nothing caught it. The attribute now has exactly **one writer**: the ref paints the first frame, the loop owns it after. A second bug hid behind it — the loop parks itself once the spring settles (what makes a still wire free), but the ref only fires on mount, so nothing restarted it and the wire froze mid-drag; a pointer move now wakes it. Also, on Zeis's question: dropping a wire on empty canvas opens the node search, and the wire is **pending, not cancelled**, so the snap-back is deferred — discarded if a node is chosen (it arrives connected), played if the search is dismissed. |
| r107 | **Wire physics** (roadmap 5; architecture in `docs/r107-wire-physics-plan.md`). A wire dragged off a socket now hangs, bounces and pulls straight as the span grows, and leaves a ghost that snaps back and fades on release. A damped spring on a single sag scalar rather than a Verlet rope — the behaviour is one degree of freedom, and a spring gives the bounce for free while staying stable. The loop writes one `d` attribute on one `<path>` inside React Flow's transformed viewport: no React state, no store write, no custom property, nothing above the canvas (r42). It self-terminates once the spring settles, so a held-but-still wire costs nothing, and cursor coordinates reach it through a ref so the pointer never re-renders the canvas. New **Springy wires / Plain wires** toggle, on Zeis's request, alongside the wire-motion master switch and `prefers-reduced-motion` — any of the three off means the wire is drawn straight once and no loop ever starts. |
| r106 | **In-app colour picker** (roadmap 5). `<input type="color">` handed the author whatever dialog the OS provides — different size, language and shape per machine, drawn outside the editor's styling and impossible to test. Replaced with presets, hue/saturation/lightness sliders and a hex field, all inside the app. Sliders rather than a hue wheel on purpose: a wheel needs pointer geometry, which means `getBoundingClientRect` and the measurement trap that cost four rounds on alignment, whereas a range input carries its own value and is keyboard-accessible for free. One real bug found by the tests: rounding HSL to integers shifts the colour — `#64748b` is lightness 46.863, and storing 47 returns `#65758b` — so an author who opened the picker and closed it would have silently changed their colour. HSL is kept as floats and only rounded for display. |
| r105 | **Click away to dismiss the node search, and ctrl+click a socket to unplug it.** Pulling a wire loose opens the search, so clicking empty canvas has to mean "leave it unplugged" and dismiss both — instead the popover stayed up until it was focused and Escaped, because there was no click-outside handler at all (listed in the r102 plan, never built). The listener is capture-phase: the canvas stops propagation on its own pointerdown, so a bubbling one never hears a click on the pane. Ctrl+click (or Cmd+click) on a socket now clears whatever is plugged into it, including every wire fanning out of one output — capture-phase and `stopPropagation`, or React Flow would read the press as the start of a new connection. |
| r104 | **Wire-drop-to-create, and cheaper pointer tracking.** Drag a wire off a socket into empty canvas and the search opens there, narrowed to node types that wire can actually plug into ("Connect to…"); pick one and it arrives already wired up. Separately, Zeis questioned the cost of pointer tracking: it was never a 60fps poll (`pointermove` is event-driven and silent at rest), but the real waste was a `getBoundingClientRect()` in the Shift+A handler forcing a synchronous layout on every press. His hitbox idea is what the browser already implements natively — `pointerenter`/`pointerleave` fire exactly once per boundary crossing — so the measurement is gone entirely, coordinates are two primitive writes instead of an object allocation, and the bounds test is now *more* correct: a manual rect counted the pointer as on-canvas while it hovered the inspector or a floating overlay. |
| r103 | **Fixed Shift+A, which r102 shipped dead.** The handler required `wrapperRef.contains(event.target)` — but with nothing focused a keydown targets `<body>`, an *ancestor* of the canvas rather than a descendant, so the guard rejected every press. "Over the canvas" has to mean the pointer, not the focus: the last pointer position is tracked in a ref (a ref, not state — `pointermove` must never re-render the canvas) and Shift+A opens the search there, which also makes it open under the cursor like Blender rather than at a fixed point. Shipped untested in r102; now covered by four tests, verified against the original bug. |
| r102 | **Right-click node search** (roadmap 5; design in `docs/r102-node-search-plan.md`). Right-click empty canvas — or press `Shift+A` — and a search popover opens at the pointer with the input already focused: type, arrow, Enter, and the node lands exactly where you clicked. Blender's model, where typing *is* the search with no separate mode to enter. Right-click still pans when you **drag** it; press-and-release within 4px counts as a click, which also let r92's `panOnDrag` restriction be lifted (the context-menu prevention was the actual fix there, not dropping button 2). Ranking puts a name match above a description match, so "mail" finds the Mail node rather than whatever mentions mail. Placement is **computed** from the click point and window size against known CSS constants — never measured — which is the r97–r100 lesson applied up front. |
| r101 | **Split the arrange buttons into two groups.** Four lookalike buttons in one strip made it easy to press "Even across" while meaning "Row" — which is exactly what happened during r97–r100 QA, sending three rounds chasing a phantom. Aligning and spacing-out are now visually separate groups, and the tooltips lead with the verb: "Align: move the selected nodes onto one horizontal line" versus "Space out: equalise the gaps only. Does not move anything onto a line — use Row for that." (The three defects those rounds uncovered were all real and remain fixed.) |
| r100 | **Stopped measuring the cards and started computing them** — Zeis's suggestion, and the right one. Reading sizes back had failed three rounds running: our own `measured` map was empty at click time, and React Flow's `nodeLookup` only carries sizes after its ResizeObserver has run. A missing size counts as zero, which silently turns "line up the centres" into "line up the top-left corners". The cards never needed measuring: width is the fixed `w-60`, height follows the same `minHeight` formula and 3-line summary cap the component renders with. New `nodeSize.ts` computes both, and `nodeSize.test.ts` asserts its constants against `GraphNode.tsx` so a layout change fails the build instead of quietly skewing alignment. New `alignReal.test.tsx` drives the real toolbar with **no faked geometry at all** — the case every previous test missed. |

Older rounds are in the build log at
[`docs/02-editor-shell.md`](docs/02-editor-shell.md), which is kept as an
archive — the bug histories in it explain several of the rules the code now
follows.

### Build status

All four original steps are complete — the editor builds playable mods. The
work since has been in-game QA, and the polish that came out of it.

Counted from the code at build `2026-09-05.r115`: **1,008 tests** across 38
files, **31 node types** in 9 categories, **8 templates**, **92 game events**,
against `@hotbunny/hackhub-content-sdk@0.21.0`.

### Documentation

| Document | What it is |
|---|---|
| [`docs/06-how-it-works-today.md`](docs/06-how-it-works-today.md) | **Start here.** How the editor is built as it stands, and the rules the code follows. |
| [`docs/01-analysis-and-architecture.md`](docs/01-analysis-and-architecture.md) | The original design and its reasoning. |
| [`docs/02-editor-shell.md`](docs/02-editor-shell.md) | Archive: the build log for rounds 1–74. Stale figures, load-bearing bug histories. |
| [`docs/03-questions-for-the-developers.md`](docs/03-questions-for-the-developers.md) | Open questions about the game and SDK. |
| [`docs/04-engine-bug-quest-completion.md`](docs/04-engine-bug-quest-completion.md) | The engine bug that stops a mod quest completing. |
| [`docs/05-bug-report-for-hotbunny.md`](docs/05-bug-report-for-hotbunny.md) | The consolidated report sent to the game's developer. |
| [`docs/plans/`](docs/plans/) | Per-round working notes: the evidence behind specific fixes. |

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
npm test             # 1,008 tests (vitest)
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
  02-editor-shell.md                # Steps 2–4 — contracts + round-by-round addenda
reference/
  generate-event-catalogue.mjs      # parses the SDK's index.d.ts → event palette data
  hackhub-events.json               # all 92 events with verified payloads (generated)
scripts/
  build-naza-pages.mjs              # regenerates the "public agency" site template
src/
  schema/                           # the ProjectDocument model (Zod) — the product's spine
    registry.ts                     #   one description per node type: palette, handles,
                                    #   inspector fields and lifecycle hook all read this
    events.ts                       #   the 92-event catalogue, with real payloads
    migrate.ts                      #   upgrades old drafts (e.g. the 4 comms node types
                                    #   that became one general dialogue node)
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
