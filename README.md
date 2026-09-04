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
| 1 | **End of the Ledger chain (delete → reply)** | The exploit now succeeds and opens a shell. It logged in as `guest` and got a plain command shell rather than meterpreter — r57 removes the guest account from routers so the exploit reaches the named reverse-TCP user instead. The last two objectives have not been reached in a real run yet. |
| 2 | **Date deprecation warning (`moment` RFC2822)** | Only appears with a quest-editor mod installed. **Not** the `Mail.send` call: r48's session sent mail and completed four objectives with no warning at all, and `to`/`attachments` are set identically there. It is a *renderer* warning (the game formatting a date for display) that fires 30-90s later, when a browser/Twotter screen is opened. Next step: find which of our content carries a date-shaped string the game tries to parse. |
| 3 | Old quest mail is never cleaned up | Mail sent by an uninstalled mod stays in the inbox. `Mail` has no delete/remove in the SDK, so there may be nothing we can do — but confirm before dismissing. (Same *family* as the r52 network bug: things we create outliving the quest.) |
| 4 | Website pages: `description` + `search[]` | The SDK's `WebsitePageDefinition` supports both and the reference mod uses both; we emit only `path`/`title`/`html`/`seo`. Affects in-game search. |

### Next up

| # | Item | Notes |
|---|---|---|
| 5 | Wire/noodle physics | Pulling a wire makes it hang and bounce; past a distance it pulls straight; releasing snaps it back before it disappears. Sag derived from slack, ~200ms non-interactive ghost on delete, physics only on the held wire, must honour the wire-motion toggle. **Must write inside the canvas, never the document root** (see r42). |
| 6 | "Contact-driven story" template | Phone brief → Kisscord drip gated on objectives → WeeChat timed to a beat. |
| 7 | "Branching consequence" template | A choice that changes which ending the player gets. |

### Known limitations (not bugs)

| Item | Why |
|---|---|
| No Wi-Fi networks | SDK 0.21.0 has no wireless API. "Create Wi-Fi" exports as a router network reachable by IP. |
| No Twotter | Removed in r31: the SDK declares it but this build does not honour it. Revisit if a newer build ships it. |
| Handbook nodes are not compiled | Declared in the editor, no export path yet. |
| No log-cleaning node | Entirely engine-side: the game logs connections on the machine, and the player wipes them from its own UI. |

### Done recently

| Round | Item |
|---|---|
| r67 | **Full field audit.** All 122 fields the inspector renders, checked mechanically against the compiler: four were collected and silently dropped — `fx.pay` sender (IBAN + name), `reply.input` command name and success message, and `flow.random`'s "store the result as". All four now reach the engine, and a permanent test fails the build if any field goes unread. The Harbour template is a single public server again — no router, no map step. |
| r66 | The Standard Contract Hack was unfinishable: the edge router answers on port 80 only, and nothing told the player the file server behind it existed — it now has a `net_tree.py` step. "The player can reply" does nothing on this build (`MailDefinition` has no reply flag), so it is off in every template, warned about on export, and the toggle says so. The mail attachment field now explains it is a file that arrives *with* the mail, not the file to steal. |
| r65 | Split the contract templates in two. **Standard Contract Hack** is the short route: a server, one admin account, exploit port 22, take a copy, mail it back. **The Ledger Contract** keeps the long route and is now marked Advanced. Both machines gained the `logs` root folder every reference-mod device has, and the Ledger's target moved to a realistic `192.168.1.24`. |
| r64 | The contract template's objectives now match the route the player actually walks: added **map the network** (`net_tree.py`) and **become Ritter** (`show users` → `/etc/passwd` → `john` → `users <n>`), and no hint or tool output hands over the internal address any more. |
| r63 | The slow install was **never our dependencies** — `origin/main` is equally slow. It is npm's `audit` lookup stalling on one network call: 7 minutes with it on, 3 seconds with it off. `Launch.bat` now passes `--no-audit --no-fund`. |
| r62 | Reverted r60/r61's jsdom upgrades: chasing a cosmetic deprecation warning added ~3.7 MB of transitives and turned a sub-10-second first run into minutes. jsdom stays on 26. `Launch.bat` now skips the install when the folder is already set up and uses `npm ci` when it is not (28s against 7min for the same result). |
| r60 | Debug probes now re-name themselves when moved to a different wire (a name the author typed is still never touched). `jsdom` upgraded to 30, which removes the deprecated `whatwg-encoding` warning on install. |
| r59 | The briefing arrived blank (`subject=""`), so `Mail.Read` could never match. Cause: r56's "wait for the destroy" path cost the quest its permissions mid-build, `Mail.send` was refused, and the fallback delivered the engine's empty copy. The destroy is no longer awaited, and the fallback refuses to send a mail the engine has no usable copy of. |
| r58 | The Ledger network now has the shape every reference-mod network has: the router serves the website only (port 80, locked), and the exploitable SSH sits on the workstation behind it. `locked` was in the schema and inspector but never reached the engine — now it does. |
| r57 | The exploit succeeded but logged in as `guest` and opened a plain shell, not meterpreter. r53 had put a guest account on *every* machine; the reference mod puts one on its 26 Devices and none of its 7 Routers. Routers now keep only the accounts the author wrote. |
| r56 | r55 broke the network entirely (“Host is down… No ports found”): `destroyNetwork` returns a promise, so firing it and building immediately meant the destroy landed *after* the create and deleted the new network. Now the address is checked first — a clean one builds synchronously, a stale one waits for the destroy. |
| r55 | A network already in the save wins over a new one at the same ip, and r52's teardown only ran on complete/abandon — which a player replacing a mod never triggers. Networks are now destroyed *before* being created, so every run starts from the network the mod describes. |
| r54 | Debug probes name themselves from the node and socket they are wired to (`OnComplete-Objective-DeleteLedger`), still editable. Ledger's port 80 is now closed — visible but not an unscripted second way in. |
| r53 | “No guest account or online user found”: the SSH exploit wants a guest account or an online user, not just any named user. Devices now go through `createDefaultUserSchema(users, { guest: true })` — which the working reference mod uses on all 25 of its machines and we had never called — and the author's own users default to online. |
| r52 | Networks were never destroyed: `destroyOnComplete` existed in the schema and the inspector from day one and the compiler never read it. A stale network in the save shadowed every re-export — the cause of the port version that would not change and the exploit that kept failing. |
| r51 | The exploit failed with “Port 22 could not be accessed”: the router opened SSH but had no user accounts, so there was nobody to log in as. Template fixed, and export now warns for any machine with a login service and no users. |
| r50 | New **Debug probe** node: drop it into any chain to print, in the player's log, that the flow reached that point, what the event really carried, and what the quest has saved. |
| r49 | `OpenSSH 7.2` made the quest unfinishable: metasploit rejects a two-part version with “Invalid version for option: Version”. All template ports now use three numbers, and export warns about any that do not. |
| r48 | Swept all 92 events: the 19 declared as single-field objects (lynx's risk class) plus the 3 declared primitives are now proven to match in *both* the declared shape and as a bare value, so no other tool can fail the way lynx did. |
| r47 | `Terminal.Lynx.Search` is declared `{ query: string }` but the game emits a bare string, so the condition read `undefined` and the objective never ticked. Field lookup now copes with a payload that is not the declared shape. |
| r46 | Text conditions now ignore quotes, case and stray whitespace, so `lynx "Anselm Ritter"` and `lynx Anselm Ritter` both count. Non-matching events are logged with their real payload. The contract template no longer advertises a Twotter handle — searching one with no profile behind it crashes the game and corrupts the save; export now warns about it. |
| r45 | `Mod "null"`: the quest graph ran in a microtask after `OnStart` had returned, so the engine had no mod bound and refused every SDK call. The graph now runs synchronously and only defers where the author asked for a wait. |
| r44 | An idle editor still spent 29% of its time in style recalculation: the shared dash-offset property had to be inherited, so every descendant of the canvas restyled 60×/second. Each wire now animates its own `stroke-dashoffset` and nothing is inherited. |
| r43 | Mod identified itself as `Mod "null"` and was refused every permission — the bundle must install `module.exports` *before* it registers anything, the way esbuild does. Wire dots frozen since r42: a custom property must be registered with `@property` before the browser will interpolate it. |
| r42 | An idle editor repainted the whole page 60×/second (40.8% of frame time) because the wire animation wrote a custom property to the document root. Now scoped to the canvas and handed to the browser's animation engine. |
| r41 | `manifest.json` is now shipped beside the bundle as well as at the project root, matching the SDK's own build script. |
| r40 | Full audit against a known-working mod: device union arms, a trigger on an event that does not exist (`Files.Downloaded`), missing `Website.Icon`, template mail written in HTML. |
| r39 | Mail bodies are sent as the plain text GoMail actually displays; objectives are completed imperatively rather than relying on the declarative `trigger`. |
| r38 | The Bootstrap class is exported so the loader can find it, and the mod announces itself on load. |

### Build status

All four original steps are complete — the editor builds playable mods.

| Step | Deliverable | |
|---|---|---|
| **1** | Schema analysis, tech stack, architecture | ✅ [docs/01-analysis-and-architecture.md](docs/01-analysis-and-architecture.md) |
| **2** | Scaffolding + node editor canvas | ✅ [docs/02-editor-shell.md](docs/02-editor-shell.md) |
| **3** | Website Builder + conversation editors | ✅ |
| **4** | Export engine + templates | ✅ |

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
npm test             # 387 tests (vitest)
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
