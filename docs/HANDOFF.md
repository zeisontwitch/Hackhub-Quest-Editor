# Handoff — r141

r141 made the settings page a real settings page (plan:
[plans/r141-themes-and-preferences.md](plans/r141-themes-and-preferences.md)),
Zeis's approved scope:

- **Six curated themes** — Midnight (default), High Contrast, Daylight (a warm
  cream light mode, not pure white), Phosphor (green retro terminal), Dusk
  (warm low-blue dark) and Slate (soft cool grey). Each is one unlayered
  `html[data-theme="…"]` token block in `src/index.css`; Tailwind v4's theme
  tokens live in `@layer theme`, so the unlayered block wins at runtime and
  clicking a card repaints the live canvas beside the sheet. Themes retint
  chrome only; High Contrast and Daylight also shift the node-category hues
  **as a set** (the canvas's reading language survives), and the minimap gets
  matching hex overrides via `themeCategoryHex` because its SVG `fill`
  attributes can't resolve `var()`.
- **Typography** — a curated font picker: System, Readable system
  (Verdana-led), Atkinson Hyperlegible, Lexend, JetBrains Mono. All
  self-hosted woff2s in `public/fonts/` (OFL licences alongside, provenance in
  its README — Fontsource packages; Google's font API is blocked from this
  sandbox, npm is not). A boot script in `index.html` applies stored theme +
  font before first paint; the modules re-apply on import (which covers
  tests). No UI scale, per Zeis — browser zoom already does that.
- **Snap grid size** (Fine 11 / Standard 22 / Coarse 44) — one number, three
  meanings by design: the drag grid, the canvas dot pattern (`gap` follows
  the step; the dots are the grid and must not lie) and the align spacing.
- **Wire dot drift speed** (Calm / Standard / Brisk) — `DOT_PERIOD_S` became
  the default of a stored preference; `setDotPeriod` restarts running
  animations (the r43 per-layer registry is what makes that safe). Falsified:
  the new cycle test fails with the period reverted to a constant.
- **Editor data section** — "Reset all editor preferences" (calls every
  module's own setter; fresh-install defaults, OS reduced-motion included)
  and "Clear the autosaved draft" (`DRAFT_KEY`, now exported from autosave).
  Both two-step like the pack manager's remove.
- Canvas hardcodes retired along the way: the minimap mask and background
  dots now derive from theme tokens (both flow through CSS custom properties
  — verified in the xyflow dist, not assumed), and the website builder's code
  view is pinned dark because its Prism colours are tuned for one background.

**Zeis's eyes only** (jsdom cannot see a palette or a typeface): all six
themes' actual look, the three bundled fonts rendering, dot speed, and the
light theme's native scrollbar/`color-scheme` behaviour. No `EDITOR_BUILD`
bump — nothing the compiler emits changed (AR13).

r140 shipped the **Settings page** (roadmap item 5, plan:
[plans/r140-settings-page.md](plans/r140-settings-page.md)) — the author-facing
home for the editor preferences that used to live only in the debug panel (a
developer tool) or on the canvas toolbar (no explanations, no dials):

- **A settings sheet**, opened by a Settings button in the top bar (Shortcuts
  moved to the `keyboard` icon; `sliders` finally means settings). It is a
  right-anchored Radix dialog running **non-modal**: no dimmed overlay, and it
  spans only the workspace between the fixed-height bars — so the canvas stays
  visible and interactive while tuning, which is the whole point (the debug
  panel proved that interaction model for two rounds). Esc closes it; the
  top-bar button toggles it.
- **Contents**: the snap / animated-wires / springy-wires switches with the
  honest descriptions, and the seven wire-physics dials moved over from the
  debug panel, each with a one-line hint, plus the damping-ratio and settle
  readouts and Reset to defaults. A standing honesty line: none of it changes
  the exported mod. Everything reads/writes the **existing** preference
  modules (`snapGrid`, `wireMotion`, `wirePhysicsPref`, `wireTuning`) — the
  sheet owns no state, so it can never disagree with the canvas toolbar.
- **The "Fade ms" dial became honest.** The ghost's fade used to run on the
  retraction's own easing curve, so `ghostMs` fed nothing but the backstop
  timer — a dial that did nothing (the known inconsistency queued for exactly
  this round). The fade is now its own pure arithmetic, `ghostOpacity()` in
  `wireGhost.ts`: full opacity while the wire travels, then a fade over the
  final `fadeMs`; a fade longer than the retraction outlives it (dissolve in
  place), zero is an instant vanish. Shipped defaults keep the r115 QA'd
  vacuum-cable feel; the lifetime test fails on the pre-r140 code (verified
  by reverting). `WireGhostOptions.durationMs` → `fadeMs`; the vestigial
  `GHOST_MS` export is gone.
- **The debug panel went back to being a debug panel**: build stamp, gates,
  counters/FPS, event log. The event log now records each ghost's
  retract/fade pair, so "what were the numbers?" is answerable without a dial.
- **Rider — a flaky gate made honest.** The two event-picker tests in
  `packDataEditor.test.tsx` measure 21s / 6s on a slow sandbox, against
  vitest's 5s per-test default, so `npm test` flaked there. Verified on the
  clean r139 tree (changes stashed): identical timings — the machine, not a
  change. Both now carry an explicit 30s timeout; assertions unchanged.
- No `EDITOR_BUILD` bump — nothing the compiler emits changed (AR13).

The canvas toolbar's three quick toggles and the Debug button stay as they
were — direct manipulation at the point of use, both surfaces writing the
same modules.

r139 was a **Clean Code & Architecture pass** over the rail r137+r138 built
(plan: [plans/r139-clean-code-architecture.md](plans/r139-clean-code-architecture.md)).
No new feature — it pays the debt the pack system introduced:

- **Duplicate React keys**: `pack.node` has one `NodeType` for many palette
  entries. Both the palette and the add-node search used `def.type` as the key,
  so every pack node shared `pack.node`. Fixed with `paletteDefKey` — pack nodes
  key by `nodeId` (`<packId>/<nodeId>`), static nodes by type. The vitest
  warning "Encountered two children with the same key, `pack.node`" is gone.
- **`computeWarnings` split**: was one 300-line function doing 15 jobs (F1/F2).
  Now eight focused helpers (`warnUnstartableQuests`, `warnFirewallAndPort`,
  `warnNetworkStructure`, `warnToolResponse`, `warnHandbook`, `warnWifi`,
  `warnDialogue`, `warnCommunityNodes`, `warnWebsites`) plus an orchestrator.
- **Permission map**: `computePermissions` was an ungoverned `switch` (AR3
  anti-pattern) that missed `pack.node` entirely — a pack node emitting
  `Events.emit` compiled with no permission (AR17). Now `PERMISSIONS_BY_NODE_TYPE`
  is the single source of truth, and `permissionsForPackNode` inspects the
  snapshot's emitter (`emit` → events, `commandData` → shell, `sdk` steps parsed
  by prefix).
- **DRY clones**: `JSON.parse(JSON.stringify(...))` appeared four times in
  `packNodeDefs` and twice in the editor store's clipboard. Replaced with
  `structuredClone` via `deepClone` / existing `clone` helper (A3).
- **Module boundaries**: pure pack helpers (`packNodeDefs`, `packEvents`,
  `packEventByName`, `paletteDefKey`) moved from `store/packs.ts` (persistence)
  to `toolpacks/palette.ts` (feature folder) — AR5 cut by feature, AR6 explicit
  boundaries. `store/packs.ts` now only persists and re-exports for compat;
  UI imports from `toolpacks/palette.ts`.

Gates: typecheck 0, 1,316 tests green, build clean, duplicate-key warning gone.

r138 shipped **Editor Mods** (design:
[plans/r135-tool-packs-design.md](plans/r135-tool-packs-design.md), plan:
[plans/r138-editor-mods.md](plans/r138-editor-mods.md)) — the second half of
the tool-pack vision. A pack's `nodes[]` now grow the palette: one
**"Editor Mods · <pack>"** group per loaded pack, each entry adding a
`pack.node` whose data is a **full snapshot** (pack id/version, game mod,
the pack author's label, the emitter and its whole config, the field
definitions). Four declarative emitters — `sdk` calls, `emit` an event,
`storage` write, `commandData` scripted tool answer — all pure JSON templates
with `{{field}}` holes and `{{data.*}}` tokens, interpreted by one new
`pack.node` case in the compiler (never third-party code). The palette entry
and the add-node search offer the same list; drags carry the snapshot as a
JSON payload; the card shows the pack author's label; the inspector renders
the pack's form with the honesty line. The architecture call (in the plan
doc): the node *type* system stays static and exhaustively checked — packs
extend the *palette*, not the zod union — and there is deliberately no
"listen" emitter (the trigger picker already gives pack events the full
clause engine; a second listening surface would be a worse duplicate). The
starter pack now ships one worked node per emitter kind; the format spec
documents the section. Remaining from the design: quest-facing target-rule
surfaces (`targetRules` parsed and carried, no lint yet — wants a real
second pack to design against).

r137 shipped the **first rail of Tool Packs** (design:
[plans/r135-tool-packs-design.md](plans/r135-tool-packs-design.md), spec:
[ToolPack-Format.md](ToolPack-Format.md), starter pack:
[`reference/example-toolpack/`](../reference/example-toolpack/toolpack.json)).
A pack is one `toolpack.json` of **pure data** — the events a game mod emits,
the SharedStorage data shapes it reads, the target conventions its tools
match. The **Tools** button opens the pack manager (load with plain-language
errors — a wrong format number is caught before anything else; two-step
remove; machine-local persistence). Loaded packs surface in three places:
**Community tools** events in the trigger picker (with a pack-authored label
and an honesty note that quests waiting on the event need the game mod);
**Community data** nodes ("Hand quest data to a community tool mod") whose
dropdowns and inputs come straight from the pack — the entry template is
**snapshotted into the project** at authoring time, so quests keep working
where the pack was never loaded, and numbers/booleans land raw in the JSON
while strings splice in with escaping; and the **export README**, which now
lists every pack used and says the player must install its game mod. A new
teal **Community** palette category carries the node. Validation errors are
written for the modder ("id: the pack id is lowercase letters, numbers and
dashes"), never a zod dump. (The Editor Mods half shipped next door in
r138 — see the top of this file.)

r136 shipped **The Long Game** ([plan](plans/r136-campaign-template.md)), the
campaign template: three acts in one mod chained by the "Claim another quest"
node — a public trail, a small break-in, and a typed verdict whose two wires
are two different endings. It forced two product fixes: claimed quests now
count as a start route (the warning and the template tests), and
`createProject` points new multi-quest projects at their first quest instead
of a discarded default. Cookbook card 16 rides along ("The Campaign"). Note:
a smaller game patch shipped 2026-09-12 **without patch notes and without an
SDK update** — the docs/07 fence stands exactly where it was; the fence-lift
procedure still waits for the pinned SDK to move. r134 was the **website polish** ([plan](plans/r134-website-polish.md)): the
preview is now a walkable site — an address bar plus internal-link
navigation (the sandboxed iframe posts internal link clicks out; the builder
serves the linked page, or a friendly not-found) — and **Import folder**
turns a folder of AI-written .html files into pages in one go (filenames
become paths, `<title>`s become titles, existing paths are skipped). r133
built **linking without touching HTML** ([plan](plans/r133-page-linking.md)):
Zeis's After Effects pick-whip idea, verdict "right instinct, wrong physics
for a drag", shipped as click-click *with the noodle kept*: the 🔗 button is
a popover of the site's pages, every sidebar page row has a 🎯 socket, and
arming renders a wire from the socket to the cursor — reroute-nodule tip,
follows across the iframe, ghost-fades on place/Cancel/Esc — until the next
click inside the page becomes the link (existing links retarget). His
screenshot also caught that the first cut hid the targets inside the
popover; the sockets now live on the rows where you look. r132 was the **website builder audit** (roadmap item 9,
[plan](plans/r132-website-builder-audit.md)): the whole builder surface read
end to end, three real defects fixed — the visual editor silently *ran page
scripts* while editing (now CSP-blocked in the editing copy, scripts kept in
the emitted document), "Delete site" had no confirmation, hosts/paths shipped
verbatim (now normalized on blur) — plus `WebsiteDefinition.popular` exposed
end to end with an honest "unverified" hint (the docs/03 Q12 self-test is
buildable; the in-game ranking check is Zeis's), `hiddenBits` surfaced in the
page scan, duplicate/slash-less path warnings, and a Save HTML export.
r131 read Zeis's transcription of the hardcoded Journalist's Sister questline
(13 quests, 1,845 lines) and staged three proposals — **approved** — awaiting
their build round ([plan](plans/r131-journalists-sister-analysis.md)); the
headline: the SDK's Kisscord contact lifecycle
(`createUser`/`addFriend`/`changeStatus`) is declared and unused; the "new
contact appears mid-story" move is unbuildable today. r129 closed roadmap
item 2 (website pages emit `description` + `search[]`); r130 shipped the
**Dry run** ([plan](plans/r130-quest-simulator.md)). The developer's
bug-report reply remains filed as
[`docs/07`](07-dev-response-mod-sdk-bug-report-response.md),
**under a fence**: nothing it promises is in the pinned SDK yet; read the
banner before acting on any of it.

## Where things stand

- **HEAD:** r141 (themes, typography, settings round two) on
  `arena/01a08ff8-hackhub-quest-editor`, committed and pushed. Previous
  rounds: r140 (Settings page), r139 (Clean Code & Architecture pass),
  r138 (Editor Mods), r137
  (tool packs, first rail), r136 (campaign template), `423569f` (r130). (A
  sandbox reset rolled local history back to `c0e511f` mid-r129, and again
  mid-r134 — that time taking node_modules with it; recovered both times from
  the remote tip per the standing fetch-first rule (mid-r134 addendum: rescue
  the round's uncommitted files with plain copies BEFORE `reset --hard`),
  then `npm ci`. The remote is authoritative.)
- **1,353 tests green** across 63 files, typecheck clean, build clean, and —
  since the r138 prep rider — **vitest exits 0**: the 4 long-standing
  unhandled d3-drag errors were diagnosed as load-bearing jsdom noise (they
  aborted every canvas drag handler mid-gesture; four selection-gesture
  tests had been passing *because of* the crash) and fixed in
  `vitest.setup.ts` by giving MouseEvents the view a real browser would.
  r139 also cleared the `pack.node` duplicate-key React warning.
- **Editor build stamp:** `2026-09-13.r139` (r140 changes nothing the
  compiler emits, so the stamp did not move — AR13).
- Tool-pack modules: `src/toolpacks/schema.ts` (format 2 + plain-language
  `parseToolPack`), `src/toolpacks/palette.ts` (pure `packNodeDefs`,
  `packEvents`, `packEventByName`, `paletteDefKey` — the synthesized palette
  defs, no store), `src/store/packs.ts` (machine-local zustand store, own
  localStorage key `hackhub-quest-editor:packs:v1` — NOT in the project doc;
  re-exports helpers for compat),
  `src/toolpacks/ToolPackManagerDialog.tsx`, the `world.packData` and
  `pack.node` nodes with their dedicated editors (`PackDataEditor.tsx`,
  `PackNodeEditor.tsx`), and the emission cases in
  `src/compiler/runtimeSource.ts` (shared `__QE.packFill`/`__QE.packText`
  template helpers). Pack-driven surfaces feed
  `EventPicker`/`ConditionsEditor` via `packEvents`/`packEventByName`, and
  the palette + add-node search via `packNodeDefs`.
- Shared graph helpers extracted to `src/templates/kit.ts`; each template is its
  own module (`blank.ts`, `firstContact.ts`, `byline.ts`, `coldCall.ts`,
  `harbourManifest.ts`, `helpDeskLeak.ts`, `badAttachment.ts`, `sixTries.ts`,
  `coldStorage.ts`, `ledgerContract.ts`, `reference.ts`, `cookbook.ts`).
  `src/templates/index.ts` is a thin registry. `Template.difficulty` is
  `Beginner | Advanced | Expert | Reference`.

## Read these first, in this order

1. **[`docs/06-how-it-works-today.md`](06-how-it-works-today.md)** — how the
   editor is built now, and the five rules the codebase follows. Each rule is
   the scar of a specific bug; they are not style preferences.
2. **[`docs/In-Game-Handbook.md`](In-Game-Handbook.md)** — Zeis transcribed the
   game's entire in-game handbook by hand, 4,102 lines. **It is the highest
   authority for how a player is expected to act.** The SDK says what a mod can
   *call*; the handbook says what the game *teaches*. The previous session got
   three things wrong by consulting only the SDK.
3. **[`reference/Official-Quest/`](../reference/Official-Quest/)** — Zeis's
   transcriptions of the quests the game itself ships (the complete official
   set, 8 files). The strongest cross-check for how real quests flow; read
   with [`docs/plans/r127-official-quest-comparison.md`](plans/r127-official-quest-comparison.md)
   and the Journalist's Sister deep-dive
   [`docs/plans/r131-journalists-sister-analysis.md`](plans/r131-journalists-sister-analysis.md).
4. **[`docs/07-dev-response-mod-sdk-bug-report-response.md`](07-dev-response-mod-sdk-bug-report-response.md)**
   — the developer's answer to our bug report: engine facts true today (Q3
   exploitability, Q4 version format, Q6 dual file events) next to patch
   promises that are **not in the pinned SDK**. Fence banner on top; also the
   fence-lift procedure in the queue below.
5. **[`docs/plans/r128-six-tries-and-cookbook.md`](plans/r128-six-tries-and-cookbook.md)**
   — what r128 built and why Proposal B changed surface.
6. **[`docs/plans/r129-website-search-metadata.md`](plans/r129-website-search-metadata.md)**
   — the search-metadata round: ground truth, the one-line drop point, the
   four in-game questions (and the `popular` question for the developer).
7. **[`docs/plans/r126-template-audit.md`](plans/r126-template-audit.md)** —
   what the audit found in the templates, what it fixed, and the in-game
   questions still open. (r127's comparison plan remains the source behind
   the cookbook.)

## The world.wifi node: hidden from authors, kept in the engine

Per Zeis's call, `world.wifi` is **removed from the authoring surface** (the
node palette, the add-node search, and the Node Reference sheet) but **kept in
the infrastructure** — the schema node, the `NODE_TYPES_REGISTRY` entry, the
compiler/runtime forward-compat branch, and the `world.wifi` compile test all
stay, so a legacy project using it still parses and compiles and a future SDK
wireless API can be wired straight back in.

Mechanism: `PALETTE_HIDDEN_TYPES` in `src/schema/registry.ts` (currently
`{ "world.wifi" }`). `paletteGroups()` filters it out; `reference.ts` mirrors the
palette by skipping hidden types. Re-enable by emptying the set (and re-adding
the `world.wifi` example in `reference.ts`).

Why: SDK 0.21.0 ships no wireless API, so the node fell back to a plain router
network and its `ssid`/`password`/`signal` were stored but not read. Worse, the
editor's own tooling (the exploitable guard and `seedRemoteFiles`) only reads a
node's nested `.device`, so a machine hosted behind a Wi-Fi node was invisible —
the one place an author could build something the editor couldn't validate. It
was that gap, not the concept, that made it feel obsolete.

## The shipped set

Difficulty is **Beginner / Advanced / Expert** — Zeis explicitly rejected a
four-tier scale. The tier describes how much the *author* must understand, not
how hard the hack is.

| Template | Tier | Situation |
|---|---|---|
| Blank | — | Empty canvas, lifecycle nodes |
| First Contact | Beginner | The whole spine: brief → one objective → payment → closing line |
| The Byline | Beginner | **Website #1:** an *ordinary* site; find a name in a blog byline, `lynx` it. Nothing hidden, no hacking |
| Cold Call | Beginner | A story told in conversation — Kisscord/WeeChat, no break-in |
| The Harbour Manifest | Advanced | The standard contract — the only template proven end-to-end in-game |
| The Help Desk Leak | Advanced | **Website #2:** the site *hides* something — `dirhunter` an unlisted page, credentials inside |
| Bad Attachment | Advanced | Phishing: a lure goes out, the reply carries the credential. All mail, no shell |
| Six Tries | Advanced | **The crack:** lynx → nmap → `hydra` → `ssh -h` with the cracked login → `cat` → report. The official quests' most common route; new in r128 |
| The Ledger Contract | Expert | Long route, privilege escalation (old completion wiring kept — Zeis deferred it) |
| Cold Storage | Expert | scan edge → fern passphrase → shell → sqlmap a database |
| Node Reference | — | Every node type, annotated |
| Quest Cookbook | — | Official-quest techniques → the nodes that express them here; read-only, new in r128 |

Zeis's steers, verbatim in spirit:
- **Cold Call** stays, specifically to show that a non-hacking quest is possible.
- **Two Ways Out** (the branching-ending idea) may be **morally grey** —
  authors can change it themselves. Approved but not yet built; slot it in as
  an Expert or Advanced entry.
- Two website templates, using websites in **different ways** — hence The
  Byline and The Help Desk Leak.
- Expert must be genuinely expert: multiple tools and techniques, not one
  clever trick.

**Cold Storage** models the "wireless" identity as a plain `world.network`
router (the SDK ships no wireless API) so the break-in machine is visible to
the guard's device-tree walk. Every objective waits on an event the runtime
actually emits; the wireless recon/join events are deliberately left out
because they cannot be guaranteed to fire. Its `lead_ledger` table was seeded
in r126 (r125 deferred it mid-playtest).

**Bad Attachment** runs entirely on mail events — the plan's explicitly
allowed fallback, since `Mail.registerTemplate` is not expressible in the
editor and engine-side attachment simulation is unverifiable from the SDK.

## What the handbook established (do not re-derive this)

**Phishing works, and a mod does not author the attachment.** Metasploit
generates it in-game:

```
use exploit/multi/fileformat/office_word_macro
set payload bearos/meterpreter/reverse_tcp
set LHOST <ip> / set LPORT <port>
run       # creates the malicious document
handler   # starts the listener
```

The player then delivers it by the in-game mail route, and the victim opening
it triggers the reverse TCP connection. **The listener port must be forwarded
on the router** or the payload cannot call back. Current builds also enforce
that the player actually owns a file before it can be attached.

**Suspicion is real, game-native and log-driven.** It rises from incomplete or
incorrect hacking and phishing. After getting a shell the player is expected to
find the access logs and **delete exactly the line recording their shell,
leaving the others alone** — missing logs are themselves noticed. It falls by
changing Wi-Fi network. 50% = you can be hacked back; 100% = federal seizure.
Real log paths: `/logs/accounts.log`, `/root/logs/terminal.log`.

**Router port-forwarding** is external port → internal IP → internal port, plus
an enabled flag. A rule that exists but is disabled does nothing. The firewall
sits in front of the router, which is why a connection can still fail after
"opening the port".

**Fern** derives the router interface credential *from the router model*, which
the player reads off the router's web interface in Firebear.

**The beginner workflow** the handbook teaches — and the shape a good template
should have: read the objective literally → OSINT/recon (`lynx`, `whois`,
`nslookup`, `mxlookup`, `dig`) → `nmap -sV` → match the evidence to a tool →
preserve evidence → if it does not tick, re-read the wording, because the game
wants the *specific action* named.

### Corrections from the developer's response (docs/07 — engine facts true today)

- **`/logs/accounts.log` is on the PLAYER's own machine**, not the target
  (Q5). Shell forensics reads `sys.log` on the compromised host. The handbook
  transcription itself may be ambiguous — it is a transcription; this note is
  the correction.
- **`acceptReverseTCP` is not checked by port exploits at all** — it only
  matters for reverse-TCP payload paths (phishing macro, mail listener). A
  guest is not required either: one user with `online: true` suffices (Q3).
  Our exploitability guard is stricter than the engine requires; that is fine
  and stays — but do not "fix" templates down to the minimum.
- **Metasploit versions**: `x.y.z`, first segment nonzero, must equal the
  banner's numeric segment exactly; nmap prints the full banner (Q4).
- **A pulled file raises TWO events** — `Terminal.SSH.FileDownload` (ssh)
  and `Files.Transfer` (download command/transfer window); quests that
  listened to only one stranded players (Q6). Listen to both.
- **`scp` does not exist in the game.** (The Harbour Manifest hint predates
  this answer from the dev — its `scp` terminalCommand is a cosmetic
  suggestion the game does not have; noted for the next Harbour round.)

## Rules any new template must follow

1. **Exploitability**, enforced by `src/templates/__tests__/exploitable.test.ts`
   — any machine the player must enter needs a login service, a user with
   `acceptReverseTCP: true`, `extraAccounts: false` unless a guest is wanted,
   and **three-part port versions** (`OpenSSH 6.4.0`, never `7.2`).
2. **No node that compiles to nothing.** Handbook nodes compile since r125
   (`Handbook.open` in runFlow); the article catalogue's id=title scheme is
   still an unverified hypothesis awaiting Zeis's jump test.
3. **Never a typed IP** — use `TARGET_IP_TOKEN` (`{{data.targetIp}}`). Networks
   outlive the mod in the save; a fixed address collides with an older build.
4. **A subnet must be rooted in a ROUTER** when it has children (r77).
5. **Distinctive domains** — they are global and a generic one may collide.
6. Every quest **ends without formally completing** (engine bug, see
   `docs/04-engine-bug-quest-completion.md`) and leaves a closing line.
   (The developer's reply promises a fix and `this.complete()` — fence: build
   to what ships, not what's promised.)
7. Each template states its tier and what it teaches in a sticky note.

## Queued next

1. **Zeis's in-game QA list.** New templates: hydra rendering + `Terminal.Hydra`
   credentials, `SSH.Connected` for `ssh -h`, `Terminal.Cat` remotely. r129:
   does `description` render as the result snippet (strongly supported by
   Zeis's Goagle screenshot — title → host → snippet —; confirm with a mod
   page); are `search[]` terms matched (case-insensitively? alongside page
   text?); do they matter for `seo:false` pages. Carried: ssh `-h` to a 10.x
   box, Cold Storage's route, Cold Call's chat, `Terminal.SSH.Shutdown` on
   mod machines, `Database.DataUpdate` from Database-Manager edits. New
   from r131: does a created Kisscord contact render a proper card (the
   proposal-B surface)? the campaign world checks, two parts (analysis
   §4): **mid-line** — with quest 2 active, is quest 1's network still
   reachable, or did quest 2's start replace/clear the world? **line-end**
   — when the final quest of a line is run through, is the world torn
   down? (Zeis's untested model, r131: quests are standalone, the world
   accumulates through the line so a player can backtrack, and the whole
   thing goes when the line ends.) And: does `hasCompleteButton`'s click
   formally complete the quest (docs/04 territory — the flag ships today,
   the completion path is the engine bug)? Plus the website-audit in-game
   halves: the **`popular` self-test** (docs/03 Q12 — the flag is a builder
   checkbox now: build two identical sites, flag one, compare their search
   ranking); and eyes on an **iconless site** — generated sites ship
   `Icon = ""` (Nemesis precedent) — does the in-game browser or Goagle
   results show an ugly blank where an icon belongs? And the tool-pack
   gate (r135 design): does `addCommandData` placed for a mod-registered
   command surface when the player runs it (the tool mod reads its own
   command's data)? Five-minute ask for any tool-mod author.
2. **Zeis's build order: tool packs → editor mods** (roadmap row 12, the
   [`r135 design v2.1`](plans/r135-tool-packs-design.md) has his go-in-
   principle). **DONE in r137+r138:** pack schema (format 2), loader with
   plain-language validation, community events in the trigger picker,
   SharedStorage contract forms, **Editor Mods** (pack-authored palette
   nodes with declarative emitters — one generic `pack.node` type, four
   emitters, snapshot portability), starter pack + format spec. **r139**
   cleaned up the debt that rail left (duplicate keys, giant warning
   function, permission gap for pack nodes, clone DRY, module boundaries).
   **Remaining: the target-rule surfaces** (`targetRules` is parsed and
   carried; no quest-facing lint reads it yet — deliberately deferred until a
   real second pack exists to design against, per the design's "deliberately
   open" list). The campaign template and the Campaign card are DONE (r136).
   The **Kisscord contact lifecycle is parked until the SDK moves** (the
   2026-09-12 patch shipped none).

3. **When the developer's patch lands, lift the fence in this order:** pin the
   new SDK version → `npm ci` → `npm run gen:events` → diff
   `reference/hackhub-events.json` → read the new `d.ts` → Zeis verifies
   in-game → *then* plan the round (formal quest completion per `docs/04`
   — which would touch every template's ending and the Ledger deferral —
   Twotter's return with `removeUser` cleanup in `OnModPackageUnloaded`,
   SMS if/when it actually appears in a pinned SDK). The dev also asked for:
   retest of the completion path + Twotter on the patched build, and a minimal
   mail repro if BUG 1 persists. Before all of that: nothing implements,
   nothing is removed.
4. **"Two Ways Out"** (roadmap item 7) — the approved branching-ending
   template, not yet built. Cryptographer Hunt's fail-choice phone scene is
   the in-game proof this shape matters.
5. **Zeis's data requests** (nothing blocks on these): SMTP/POP3/IMAP version
   banners + ports 25/110/143; Apache metasploit module for 2.4.49/50 or
   flavour?; Handbook screenshot (titles + categories) + the id=title jump
   test; eyes on the preview. Plus the Harbour `scp` hint fix noted above.

Tooling note (r129): the `lint` and `format` npm scripts are gone. ESLint
was never installed (`npm run lint` failed with "not found"); a repo-wide
Prettier pass would have reformatted the whole tree to defaults — neither
ever gated anything, so both were removed rather than adopted (Zeis's call).
Formatting is house convention; the mechanical gates are typecheck + tests +
build. Prettier the *dependency* stays: the website builder's code view uses
`prettier/standalone` to format page HTML.

Done and off the queue: the website-builder audit (r132), the Dry run +
Cookbook riders (r130), website description + search (r129), the r127 proposals (both built, r128), the editor UX
check (r125), actionable hookup warnings (r124), the template rebuild (r122),
the template audit (r126).

## Working habits Zeis expects

These are standing instructions, not preferences:

- **Never guess. Check the SDK, the handbook, the official quest
  transcriptions, or the Nemesis reference mod.** Test hypotheses before
  implementing. Evidence order: SDK d.ts → handbook → Official-Quest →
  shipped/QA (each wins in its own domain).
- **Plan first, then execute** — write the plan down, audit it, then build.
- **Falsify every guard**: revert the fix and confirm the matching test fails.
  A test that cannot fail is worse than none, and several have shipped green
  while the feature was dead.
- **jsdom lies about anything visual** — no layout, no compositor, no
  `Element.animate`, no `PointerEvent`. Say plainly what cannot be tested and
  hand it to Zeis rather than writing a test that looks like coverage.
- **Admit wrong theories plainly, with evidence.** Corrections belong in the
  docs, not quietly edited out.
- **Be concise.** Expand only where the detail is load-bearing.
- Always `git fetch` and compare against the remote before committing — Zeis
  commits to this branch too (docs/07 arrived that way in r128), and the
  remote is authoritative.
