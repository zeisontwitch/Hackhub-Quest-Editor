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
npm test             # 1,784 tests (vitest)
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
| 1 | **Dynamic webpages — run done; probe rebuilt (1.1.0) and ready to re-run** | Zeis ran the r238 probe (game 1.3.13). **Green:** per-request content, **path params do arrive** (`/article/1` got `{"id":"1"}`), no caching, the **404 look** (the browser's own "This site cannot be reached"), the **iframe `HackhubSDK` bridge exists**, and all four export combinations — **but a page's own permissioned call does not deliver**: the button's mail never arrived at all (Zeis had his inbox open in another tab), which is our §14 `Mod "null"` refusal again, and invisible to the caller — `Mail.send` is synchronous (`string | null`), so it fails by returning `null`, not by throwing. **A clean A/B pins it:** in the same mod and session with the same permission, the mail the quest sends on accept **arrived**, and the page's button mail **did not** — so the calling context is the whole difference (filed as [`docs/03` §25](docs/03-questions-for-the-developers.md)). **Red:** `Http.Response` never reached the quest — no `http-response` line appears anywhere in the log, so the beat wired to it never fired and **DP-06/07/08 only ran their "before" half; the bcc.com A/B is still unverified in game.** (Correction: I first blamed the run order; Zeis had in fact claimed the quest first — 16:42:36, before every page visit — so the listeners were armed and the finding stands.) It is also **old news I had forgotten**: our own blocked-rows table records from r166 that mod-hosted *static* sites don't tick `Http.Request`/`Http.Response` either, so r237's assumption that HTTP events would "ride along for free" was wrong. **Rebuilt as `delivery/qe-sdk-024-dynprobe-1.1.0.zip` (r246):** the beat now fires from the `qedyn beat` terminal command (so the bcc.com A/B can finally run), `Http.Response` is logged *before* any filter and `qedyn status` prints every event the mod was offered, and `/form` prints what `Mail.send` **returned** (`null` = refused) plus a second button that goes through the documented `Events.emit` bridge — so we learn whether the workaround delivers. 14 rows; the run also watches **every page view renders twice**. Filed as [`docs/03` §24](docs/03-questions-for-the-developers.md). Details: [`docs/plans/r238-dynamic-pages-probe.md`](docs/plans/r238-dynamic-pages-probe.md) + `reference/sdk-0.24-qa/STATUS.md`. |
| 2 | **ModSettings probe — first run done; the pipeline is green, the UI is missing** | Zeis ran the r239 probe: the log proves **the game parsed all six settings and hands them back** (`MS-load 1` and the claim-time readback both show all five types with exact defaults), but the in-game **Settings app has no Mods section**, so MS-02…MS-07 are unrun, not failed. Two candidates: (1) the settings render in the **Mods list** he already uses to enable/disable mods, not the phone's Settings app; (2) they are **v2-only** — the game reports *current: v2* and runs v1 mods in compatibility mode. r240 shipped `modsettings-v2/` (+ zip): the identical probe with `apiVersion: 2`, installed **instead of** the v1 one. Filed with the developers as [`docs/03` §23](docs/03-questions-for-the-developers.md). Evidence + reasoning: [`docs/plans/r239-modsettings-probe.md` §4b](docs/plans/r239-modsettings-probe.md). |
| 3 | — | Otherwise nothing mid-flight at this commit (r240); the remaining 0.24 follow-up choices are individual Next-up rows per Zeis's r235 decisions. HTTP/curl/DNS collaborator nodes stay fenced until SteelWaffe answers the upstream gaps. (The phone-proxy/eavesdrop investigation was **dropped** on Zeis's call, 2026-09-21 — do not re-add it.) |

### Next up

| # | Item | Notes |
|---|---|---|
| 1 | **Dead Air in-game playtest** | r232/r233 are code-verified (the shipping runtime read, the template invariants), but the template's novel parts have not been seen in game: the **converging wire** (the call's two outcomes into one drip), the **Timer day** on the game's clock, the phone's typed-answer terminal command, and the Kisscord player-typed send. Run it under the QA harness and file the results in [`reference/sdk-0.24-qa/`](reference/sdk-0.24-qa/). |
| 2 | **Tutorial node (guided tours)** | 0.24 ships declarative engine-scoped tours (`Quest.Steps`: steps with optional `advanceOn`, targets on the taskbar/start menu/tray/objectives panel/desktop/wifi panel/control bar, page anchors via `data-hh-anchor` on served sites). Zeis's call (r235): it is a **node** — the canvas carries the tour the way a `comms.dialogue` node carries a script, and the compiler lifts it into `Quest.Steps`. Same data also powers the **editor's own guided tour**. Feasibility notes: [`docs/plans/r234-sdk024-unswept-surface.md`](docs/plans/r234-sdk024-unswept-surface.md). |
| 3 | **Desktop app checks** | 0.24's `isAppInstalled(app)` / `getInstalledApps()` — "every app installed on this save, by name." Zeis (r235): a quest may need to check whether a command like **lynx** or another mod's custom tool is installed, to create hints and prevent dead ends — "not until a template asks" is not a valid deferral for a quest-mod editor. Open QA question that sets the shape: do terminal tools and other mods' `RegisterCommand` tools appear in the list (condition on an event vs. a small node). |
| 4 | **Dynamic webpages — investigate** | 0.24's `DynamicWebsitePageDefinition` (a per-request page handler receiving `url`/`params`/`query`) vs the static page builder. Question: what can a no-code subset express (query-token / data-driven pages, per-page exports), and what emitting the dynamic `Website` class costs the compiler. The known reference use is Rawlings' article-posting flow (r172). The fenced **Http** namespace (registerHost/collaborators) stays fenced — this row is about Website pages only. **r237: investigated** — the compiler already emits the `Website` class, so integration is cheaper than expected; see the In-progress row and [`docs/plans/r237-dynamic-webpages-investigation.md`](docs/plans/r237-dynamic-webpages-investigation.md). **r238: phase-0 probe built** (`reference/sdk-0.24-qa/dynprobe/`) — awaiting the in-game run; see In-progress row 1. |
| 5 | ~~**ModSettings probe — build, Zeis checks in game**~~ → **moved to In-progress #2 (r239, built)** | Declarative `Bootstrap.Settings` (toggle/select/text/number/slider with min/max/step/options). The probe is built; Zeis reports how the settings look and behave in game, then we decide the editor surface. |
| 6 | **Localization — full UI/UX plan** | The machinery ships (r203: the translations table + `{{tr.}}` resolution anywhere text is emitted), but no node's text fields reference translation keys yet — the product workflow (which fields are translatable, how an author tags one, how coverage is checked) is unbuilt. Zeis (r235): plan it as a bigger integration before touching it. |
| 7 | **App / PhoneApp surfaces** | 0.24's home-screen mod apps (an iframe plus a `HackhubSDK.Phone` bridge), and the phone app surface. Zeis (r235): bigger integrations — investigate the shape first, plan before building. Note: this is about mod apps on the home screen, not dialing (docs/03 §6). |
| 8 | "Branching consequence" template | A choice that changes which ending the player gets. "Two Ways Out" is approved (may be morally grey) but not yet built. The official Cryptographer Hunt (a phone social-engineering scene with a fail route on the wrong choice) is the strongest argument for it — see [`docs/plans/r127-official-quest-comparison.md`](docs/plans/r127-official-quest-comparison.md). The shape now ships inside The Long Game (r136, act III: a typed verdict with two endings); whether a standalone template still adds anything is Zeis's call. (Dead Air's r233 rework moved its failed call from a second ending to a wait-and-retry route — see r233.) |
| 9 | **Handbook round — the dedicated agent** | Zeis runs this with a different, dedicated agent (r232 call). Starting list from the r232-round audit: the shortcut appendix lacks the Ctrl+G row; the group page never says how a frame is created or that frames nest; no prose on ungrouping, the r229 frame-colour setting, or r231's arrange carry; and a stale inspector note ("Draw a box around part of your quest"). |

### Done recently

| # | Item | Notes |
|---|---|---|
| r250 | **Correction: two findings were measuring our own placeholder address** | Zeis pointed out the thing I had not checked: `player@gomail.com` has never existed. It is a placeholder in this repo's own QA project, and every probe mail since r238 went to it — so the mail that "vanished in delivery" was simply addressed nowhere, and "a page's own permissioned call does not work" (the r238 headline, docs/03 §25, results §4) was an A/B that differed by recipient as well as by calling context. **Both findings are withdrawn.** He also confirmed the rule I should have looked up: an empty `to:` means the player — already in the editor's Mail inspector hint, and pinned by `compile.test.ts` since round 2. **What survives:** the page's `Mail.send` returned real ids, so it is *not* the `Mod "null"` refusal, which contradicts the blanket "any permissioned call from a page fails" rule in the other modder's notes (demonstrated only for `Files.create`/`SaveStorage.set`) — the fence looks per-API. And the question the probe exists to answer is **open again**: we have never once sent a correctly-addressed mail from a page. Probe 1.4.0 fixes every address and re-tests it; a regression test now fails if the placeholder returns. 22 smoke tests (was 20), all three new guards falsified; results §4/§5/§6 rewritten, docs/03 §25 rewritten around what actually stands, r238 plan rows DP-09/10/16 marked void. |
| r249 | **Third run: the `to:` field is what loses a mail** | Zeis installed 1.2.0 on a fresh save and ran `qedyn mail`. Of the two mails, **only the one with no `to:` field arrived** — the one addressed to `player@gomail.com` was accepted (we have its id) and never appeared, exactly as the startup mail's shape predicted. Two explanations remain, and they need different fixes: the address does not exist, or *any* `to:` routes the mail away from the player's inbox. `Mail.send` is documented as "send an email to the player's inbox" and `to` is undocumented, so filling it in is the obvious thing to do and silently loses the mail. **Probe 1.3.0** decides it: `qedyn mail` now sends a third mail to the player's **real** address from `Mail.getPlayerEmail()` (printed, so Zeis can compare), and the new `qedyn inbox` lists what the game says is in the inbox — a mail that is listed but not drawn is a display bug, not a delivery bug, and the two look identical from the player's chair. Two new objective rows (dp-16, dp-17), 20 smoke tests (was 19), both new guards falsified; results file gains §6, docs/03 §25 updated with the confirmed finding and the new question. Reference round, no stamp change. |
| r248 | **Second run: the bcc.com pattern is reproducible, and the mail mystery is a delivery problem** | Zeis re-ran the full list with 1.1.1. **Green:** `qedyn beat` fires the beat, and **the UPDATE article appears on top of /news with the old three dropping a slot** — a mod can reproduce the game's own news-site behaviour, which was the headline question. Phase reads `beat-fired`; the double render is confirmed again (2 → 4 visits). **Overturned:** the page's mail was never *refused* — `Mail.send` returned a real id (`yD1oMYYHUX`) from page context and another through the emit bridge (`ra1DgwPOsB`); both accepted, neither delivered. The one mail that has ever arrived is the startup mail, the only one carrying **no `to` field**, so 1.2.0 adds `qedyn mail` — one mail of each shape, and the inbox decides. `qedyn status` reported **0** `Http.Response` events, confirming the r166 fence covers dynamic pages, and the feed post **did** surface on a fresh save, which points at my 1.1.0 load bug rather than the game. Two bugs of my own in the command also fixed: it printed only to the log and never the terminal, and `qedyn tick 1` silently did nothing (it now takes a number or a name, and says when the quest is not claimed). 19 smoke tests (was 16), the new print guard falsified; docs/03 §25 retitled and rewritten around delivery. Reference + docs round, no stamp change. |
| r247 | **Fixed the load-time bug I introduced in the rebuild, and added a feed-independent way to claim** | Zeis reported the quest not showing on the Hackhub feed. Two separate things. (1) **My bug:** the r246 rebuild put `class QEDynCommand extends sdk.Command` at module level, guarded only the *registration* — so if `sdk.Command` were missing the whole file would abort at load, taking the site, the quest and the feed post with it. The command block is now built inside a guarded `safe()`, with a regression test that loads the mod against an SDK with no `Command` and asserts the site and quest still register (falsified: reverting to the old shape fails with the exact `Class extends value undefined` error). (2) **Probably the real cause:** mod quest posts have stopped surfacing game-side — filed as `docs/03` §21, and his own log carries `Queue.HandleQuestHackhubPosts: no handler registered`. So the probe gained **`qedyn claim`**, which claims the quest straight from the terminal with no feed involved, plus a DP-15 row recording whether the post surfaced. Manifest 1.1.1, new zip, run card updated. 16 smoke tests (was 14); reference + docs round, no editor code, no stamp change. |
| r246 | **Findings written up, and the dynamic-page probe rebuilt for a re-run** | Two deliverables. (1) `reference/sdk-0.24-qa/QE24-TestResults-DynProbe-ModSettings.md` — the repository's own record of both runs: what they established, the evidence, and the three corrections made along the way (the run order I misread, the promise that never existed, and data I claimed we had captured). Zeis's raw log and screenshots stay on `QA-filedump`. (2) `dynprobe` **1.1.0** (+ zip), fixing exactly what the first run could not settle: the beat fires from the `qedyn beat` terminal command instead of an `Http.Response` that never arrives; every `Http.Response` is logged before filtering, with `qedyn status` printing the lot; `/form` prints `Mail.send`'s return value and adds a button that goes through the `Events.emit` bridge, so the documented workaround is tested rather than assumed; `qedyn tick <row>` checks rows off by hand. Manifest now 1.1.0 with `shell` for the command. 14 smoke tests (was 10), both new guards falsified; the probe's own README carries the run card. Reference + docs round: no editor code, no stamp change. |
| r245 | **(withdrawn in r250 — the A/B this rests on used an address that never existed)** The page-context mail failure is pinned to the calling context, not the permission** | Zeis confirmed the mail the dynprobe sends when you accept it **did arrive** — same mod, same `mail` permission, same session — while the mail sent from the page's own button never did and never errored. That is a clean A/B: permission and delivery both work, the dispatch path is the whole difference (our §14 `Mod "null"` pattern, and the other modder's central warning, demonstrated in our own run). It also rules the recipient out, since the mod-context mail carries no `to` field. The one thing still unknown is *how* the page's call failed — `Mail.send` returns an id or `null`, and our page never captured it, printing its own "sent" text instead — so the next probe prints the return value. Docs only; no stamp change. |
| r244 | **The mail permission *was* declared — and my promise explanation was wrong** | Zeis's question (are we declaring the right permissions?) checked out: the manifest lists `["events", "mail"]` and `mail` is a valid permission, so that was never the cause — and §14 had already shown a mod with `"ui"` declared being refused anyway. Checking the signature also killed a claim I had made a round earlier: `Mail.send` is synchronous (`send(mail): string | null`), so there was no invisible promise rejection; the call failed silently, which is worse, because the caller cannot detect it at all. §25 now asks that refusals be made detectable. Docs only. |
| r243 | **Checked another modder's dynamic-page notes, claim by claim** | Zeis was handed research notes by another modder and asked that they be treated as claims, not gospel (they stay off this repo, on `QA-filedump`). Verdicts in [`docs/plans/r243-dynamic-webpages-claims-check.md`](docs/plans/r243-dynamic-webpages-claims-check.md): his **type shapes and the two serving paths check out verbatim** against the pinned SDK, his `Exports`/`HackhubSDK`/`ModExports` claims match what we measured in game, and his central claim — that mod identity is lost outside `Command.Run()` and genuine `Events.on()` callbacks — is **corroborated by our own docs/03 §14**, the same `Mod "null"` error text found two months earlier from a different entry point. One claim needed refining: the SDK surface *is* present in page context, but permissioned calls there are refused — which is what our never-arrived mail was. Docs only; no editor code, no stamp change. |
| r242 | **Corrected the dynamic-page reading** | Zeis had in fact claimed the quest first (16:42:36, before every page visit) — the log confirms it — so `Http.Response` genuinely never reached the quest, which this repo had already fenced for static sites back in r166. The beat, wired to that event, never fired, so the bcc.com A/B is still unverified in game. Two probe flaws recorded (the listener filters before it logs; the beat hung off a fenced event), plus the finding that every page view renders twice. |
| r241 | **Every mod the editor compiles now declares `apiVersion: 2`** | SteelWaffe answered the API-version question directly: *"game is currently running on v2 but some older mods running with v1 — its not bug and your mod be ok — just basically add `"apiVersion": 2` to your manifest.json"*. So the compatibility-mode warning every export logged is noise, not a symptom, and r241 makes v2 unconditional: the compiler emits `MOD_API_VERSION = 2` regardless of what a saved project carries (a project still on `1` is upgraded on export, with a test pinning that), the project schema and all thirteen templates default to 2, and every hand-made QA mod in `reference/sdk-0.24-qa/` declares 2. Stamp sweep done (manual + QA export regenerated). Also recorded the two probe runs: **mod settings answered** (the UI is in the main menu — see In-progress #2 — and the full change/persist/read-back loop verifies) and **dynamic pages half green** (content, path params, no caching, the 404 look, the iframe bridge and all exports — the HTTP-event rows are RED — `Http.Response` never reached the quest even though it was claimed first (16:42:36) — which this repo had already fenced for static sites back in r166; every page view also renders twice, and the beat the probe wired to that event never fired, so the bcc.com A/B is still owed a re-run with a working trigger). [`docs/03` §19 closed](docs/03-questions-for-the-developers.md), §23 mostly closed, §24 filed. Build `2026-09-28.r241`. |
| r240 | **ModSettings: the pipeline verifies, the UI is missing — v2 variant shipped** | Zeis's first run of the r239 probe answered half the question. **Green:** the game parsed `Bootstrap.Settings` — all six settings, all five types, exact defaults — and `ModSettings.getAll()` returned them both at package load and later at quest claim, so values would reach mod code. **Open:** the in-game Settings app has no Mods section at all, so nothing was ever changed and rows MS-02…MS-07 are unrun rather than failed. Two candidates: the settings render in the **Mods list** Zeis already uses to enable/disable mods (its location was never written down in our notes), or they are **v2-only** — the game logs *"current API v2"* and runs v1 mods in compatibility mode (docs/03 §19), and settings are a newer surface. Shipped `reference/sdk-0.24-qa/modsettings-v2/` (+ zip): the byte-identical probe with `apiVersion: 2` and its own `ms2-` objectives, so one restart settles whether the version is the gate. Findings recorded in `reference/sdk-0.24-qa/STATUS.md` and the r239 plan doc; filed with the developers as docs/03 §23, and §19 extended with the new evidence that compatibility mode does *not* touch the settings pipeline. |
| r239 | **ModSettings probe built — the first in-game look at mod settings** | Zeis asked for it alongside the dynamic-page probe so one session covers both. Hand-made mod (`reference/sdk-0.24-qa/modsettings/`, delivery zip) with six settings — one of every declared type: two toggles (one on, one off by default), a select with four options, a text box, a number, and a slider 0–100 in steps of 5 — all labelled "Probe:" so they are unmistakable in the Mods menu. A load counter logs `MS-load <n>: {…every value…}`, so load 1 shows the defaults and load 2 (after a restart) shows the player's own values — machine-readable proof of persistence **and** of the mod reading them back, which no amount of looking at the menu can show. The seven quest objectives are the checklist (where the panel is, do all types render, do labels/values show, do the controls behave, do values survive a restart, does the code read them back, is there a reset?). Plan + checklist + red-reading: [`docs/plans/r239-modsettings-probe.md`](docs/plans/r239-modsettings-probe.md). |
| r238 | **Dynamic-page QA probe built — the phase-0 test site is ready to run** | Zeis's green light on the r237 recommendation. Hand-made mod (`reference/sdk-0.24-qa/dynprobe/`, delivery zip) on `qe24-dyn.test`: one static control + seven dynamic pages, each answering one or more of the five r237 open questions — per-request content, the raw path-param context, the null→404 look, a **visit counter** as the caching probe, the iframe `HackhubSDK` bridge (a button that mails the quest), per-page and site-level exports — plus the **bcc.com pattern**: a /news front page that gains a top article when the quest's beat fires (the beat fires on the first /state visit; no terminal needed). The twelve quest objectives are the QA checklist; the handler logic is unit-verified (10 tests, falsified) in `dynprobeMod.test.ts`. Plan + checklist + red-reading: [`docs/plans/r238-dynamic-pages-probe.md`](docs/plans/r238-dynamic-pages-probe.md). |
| r237 | **Dynamic webpages investigated — the integration is cheaper than expected** | The 0.24 `DynamicWebsitePageDefinition` question answered: the compiler **already emits the `Website` class**, so dynamic pages need no new registration path — per-request `{path, metadata: fn}` entries join the static ones in the same `Pages` array. The no-code subset proposed: **token pages** → **record tables** (Rawlings' article flow, r172) → **exports/forms** (page buttons heard by existing `Mail.Sent` triggers). Five in-game unknowns must be probed before any build (path-param syntax, HTTP events, caching, the iframe SDK bridge, 404 behaviour) — recommended as a small QA-scaffold page. Findings + decision asks: [`docs/plans/r237-dynamic-webpages-investigation.md`](docs/plans/r237-dynamic-webpages-investigation.md). |
| r235 | **Placed files can be marked deleteable (the 0.24 BUG 8 fix)** | Every file a quest places on the player's machine or a network device now has one more toggle — **"Player can delete"**, off by default. On, the editor emits the 0.24 `FileDefinition.deleteable` flag, so a `rm` on that file works; everything else stays protected exactly as before. For the evidence a quest tells the player to clean up: a log line, a dropped file. The QA scaffold carries the pair for in-game verification (row D-01: `delete-me` deletes, `logs/qa` does not). |
| r234 | **Swept the 0.24 SDK for what we had not integrated** | A full surface pass against `@hotbunny/hackhub-content-sdk@0.24.0` — what the editor consumes, what the BUG 1–10 report closed, and what was still un-integrated: the declarative **guided-tour** surface (`Quest.Steps`), the **deleteable** file flag (shipped r235), **desktop app checks**, the **localization** product gap, and the parked ones (Variables, ModSettings, Theme, App/PhoneApp). Findings + suggested order: [`docs/plans/r234-sdk024-unswept-surface.md`](docs/plans/r234-sdk024-unswept-surface.md). |
| r233 | **Dead Air's failed call costs a day instead of the job** | Zeis's review: a reroute-style reconverge beats the second ending. The failed line now runs Ilsa's "call again tomorrow" drip, a **Timer node waiting one in-game day** on the game's clock, and a **retry call** that re-checks the word with `wrongRoute: "retry"` (in-call retry — the quest can never dead-end). The first call's success and the retry's success both wire into the same next drip — Dead Air becomes the template's first **converging wire**, verified in the shipping runtime (flow walks out of each fired node, so a node with two incoming wires runs once per playthrough, and the two paths are mutually exclusive). The cut ending is gone: one payment, one close. |
| r232 | **"Dead Air" — the contact-driven template: a real quest, not a tutorial** | 14th template (Advanced, 29 nodes), first to use a phone script: a paranoid client briefs the player by phone, then releases each e-mail drip only after the last job is verified. The body is a phreak loop (nmap — the banner carries the password — hydra, cat — the config hides the extension and the night-shift word), then the social-engineering call: a Kisscord market where the broker sells the verified identity for the extension, a two-condition final mail, and the call itself branches — the options line loops the wrong choice back, and the typed answer's `wrongRoute: "wrong"` fires the node's failure output, ending the quest on a cheaper ending (the "Two Ways Out" shape inside one call). All-new cast: Ilsa Marek, @wren, Kofi Mensah, Fennmark Freight. |
| r231 | **Aligning and distributing a group frame moves its contents too** | The frames got their new slots, but everything sitting inside that wasn't individually selected stayed put — a frame left carrying an empty border. Now an unselected node follows the innermost selected frame that contains it (measured where the frame stood before the arrange, the same freeze rule the group drag uses); a selected node keeps its own slot. Row/Column and Even across/Even down both carry contents. |
| r230 | **Nested group frames are selectable again** | Frames all share one canvas layer, so paint order between them was creation order — and a frame is always created *after* the one it contains, putting the parent's body over the child's title bar and swallowing its clicks. Frames now paint largest-first, and a nested frame is always strictly smaller than its parent, so every child paints above the folder that holds it, at any depth. |
| r229 | **Group frames clear their own title bar — and can wear a colour of their own** | New frames now wrap the selection with a 64 px top pad (double the other edges), so the title bar sits inside the frame instead of over the first row of nodes. New Settings toggle (off by default): group frames get one of the eight ready-made colours picked for them on creation — palette, node search and Ctrl+G all roll from the same colour set the inspector picker offers, so a copied frame keeps its colour and a hand-picked one is never overwritten. |
| r228 | **Typing in the website editor no longer drops the caret; groups that carry their own** | The page editor now recognises its own edits and leaves the iframe alone — the cursor survives every keystroke, and undo still reloads the frame. New group-drag state machine: grabbing a frame freezes its contents at the moment of the grab, so bystanders in the path are not dragged along and nested frames move with their parent. Ctrl+G wraps the selection in a new frame (frames already in the selection become members, so folders nest); pressing it again on a frame removes only that frame. Also fixed: frames were measured from keys they never had, so the wrap silently used default sizes. |
| r227 | **Zeis's r226 review: the dice alignment + plain-language author copy** | Two real bugs caught on the screenshot: the comment dice floated (top-aligned wrapper — centered now), and the toggle hint printed literal `\u201c` escapes (JSX attribute strings do not read `\u` escapes) — rebuilt with real quotes inside a mouse-over ⓘ, and every author-facing blurb de-jargoned (no SDK talk, no round numbers; "Hidden User" stays, it is the game's own word). Also owned: r226's post-toggle hint rewrite never shipped (lost between script attempts) — it lands now, teaching the real mechanic. |
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
| A disabled mod stays disabled | The game remembers that a mod was disabled in the Mods list, and nothing clears it: not replacing the mod with a **newer version**, not deleting it from the mods folder and copying it back, not a **fresh save**. The mod then silently does not load — its quests are invisible, and `Quest.claim()` says nothing. Workaround: enable it in the Mods list and restart the game (a disable there is only applied on restart). Our QA harness now detects it: `qe24 run` and `qe24 twotter audit` print `Editor export: loaded (v…)` or `NOT LOADED in this session`. Reported to the developers: [`docs/03`](docs/03-questions-for-the-developers.md) §13. |
| Accounts outlive a disk-deleted mod | A mod's Twotter accounts and posts are **not** removed when the mod's folder is deleted while the game is closed — its code never runs, so nothing of ours can clean up — and the game drops the mod's quests (`[PruneOrphanQuests] …: no installed content defines it`) but keeps the accounts. Every other route is clean: completing or abandoning the story removes what the quest created (T-11b/T-12b, green), and **disabling the mod in the Mods list removes the accounts when the game applies the change on restart** (T-15c, green: `twotter: removeUser(qe-tw-account) -> true (mod unloaded)`). Question filed: [`docs/03`](docs/03-questions-for-the-developers.md) §11. |
| HTTP/curl and DNS collaborator nodes fenced | SDK 0.24 declares HTTP/collaborator events, but terminal `curl` was missing, DNS-only collaborator hits did not arrive, and static editor websites did not fire HTTP objectives in QA. Generic event triggers still list the raw events. |
| No tweet pictures | SDK 0.24's `TwotterTweet` has no picture field, so an authored image cannot reach a post (the authoring picture control was hidden in r187). The runtime still sends the key if the SDK ever grows one. Question filed: [`docs/03`](docs/03-questions-for-the-developers.md) §10. |
| No suspicion or SMS nodes | SDK 0.24 still has no Suspicion/log-forensics API and no SMS/text-message namespace or events. |
| No log-cleaning node | Entirely engine-side: the game logs connections on the machine, and the player wipes them from its own UI. |
| Date deprecation warning (`moment` RFC2822) | Never a mod bug: on a **clean save with every mod removed** the warning still fires, with the same game-tweet stamp T-09b identified in r185 — it is the game's own content on 1.3.1 ([STATUS, M-09](reference/sdk-0.24-qa/STATUS.md)). The dev's answer ([docs/07](docs/07-dev-response-mod-sdk-bug-report-response.md)) blamed Twotter/Kisscord `Date.toString()` in mod content; either that fix is not in 1.3.1 or it does not cover the game's own tweets. Nothing a mod can change. |


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

Counted from the code at build `2026-09-28.r241`: **1,890 tests** across 93
files, **40 node types** in 10 categories (all palette-visible), **161 editable
fields** and **76 sockets** (counted in the manual), **14 templates**
(12 playable + 2 reference sheets), **99 game events**, against
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
| [`docs/ideas/custom-hacking-tools.md`](docs/ideas/custom-hacking-tools.md) | Future-feature ideation (r236, not scheduled): custom hacking tools a quest could register for its player — stateful, identity, faked decode, time, GUI and toolpack ideas, with the decisions made on them. |
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
