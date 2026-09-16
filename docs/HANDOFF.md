# Handoff — r170

r170 exposes SDK `UI.prompt` as a small author-facing Effects node named
**Ask player**.

Current shipped state:

- Editor build stamp is `2026-09-17.r170`; SDK remains
  `@hotbunny/hackhub-content-sdk@0.24.0`.
- Manual inventory reports **38 node types / 38 obtainable**, **133 editable
  fields**, **72 sockets**, **10 categories**, **99 events**, and no manual
  exclusions.
- `fx.prompt` is palette-visible under Effects as **Ask player**. It asks the
  player for one line of text with optional title, question, example text,
  pre-filled answer and masked typing.
- The node can save the submitted answer to quest data, so later text can use
  `{{data.name}}`-style tags.
- In open mode the node exposes **Submitted** and **Cancelled**. In checked mode
  it exposes **Correct**, **Wrong** and **Cancelled**. Checked modes support exact
  answer, contains and pattern matching; blank accepted answers are warned about
  and never match at runtime.
- Runtime calls `sdk.UI.prompt(options)`, treats only `null`/`undefined` as
  cancel, and treats an empty string as a real submitted answer.
- Dry run stubs `UI.prompt`, logs the simulated answer, and continues the graph;
  export permissions now include `ui` when Ask player is used.
- The generated handbook/manual has a new Ask player page and the public manual
  indexes/Node Reference counts are regenerated for r170.

Validation for this pass: `npm run gen:manual`, targeted Vitest for
schema/compiler/analysis/qa/templates/simulator/manual coverage,
`npm run typecheck`, `npm test` (**1,560 tests / 79 files**), `npm run build`,
and `git diff --check`.

Supporting notes:

- [`plans/r170-ui-prompt-node.md`](plans/r170-ui-prompt-node.md)
- [`plans/r169-phone-end-flow-and-quest-endings.md`](plans/r169-phone-end-flow-and-quest-endings.md)
- [`plans/r167-wifi-exposure-and-sdk024-roadmap.md`](plans/r167-wifi-exposure-and-sdk024-roadmap.md)

Next-up from the SDK 0.24 comparison: focused Mail QA for `Mail.send()` ids,
`Mail.remove()` and `replyable`; fresh Twotter update/remove QA; a deliberate
Scheduler/Time design pass; then the contact/branching template queue. HTTP
nodes stay fenced until SteelWaffe clarifies/fixes `curl`, DNS-only collaborator
hits and static-site HTTP event semantics. Suspicion/log-forensics and SMS remain
absent from the pinned SDK.

Older handoff sections below are retained as history.

---

# Handoff — r169

r169 implements the two surfaces cleared by SDK 0.24 / game 1.3.0 QA:
phone-call end flow and real quest-ending nodes.

Current shipped state:

- Editor build stamp is `2026-09-16.r169`; SDK remains
  `@hotbunny/hackhub-content-sdk@0.24.0`.
- Manual inventory reports **37 node types / 37 obtainable**, **124 editable
  fields**, **68 sockets**, **10 categories**, **99 events**, and no manual
  exclusions.
- Phone `comms.dialogue` nodes now expose **Out fires** in the inspector and
  Dialogues modal. Default is **When the call ends**; **Right after starting the
  call** keeps the old immediate behavior. The compiler maps the end timing to
  `QuestDialogSpeech.onEnd` on ending lines and `QuestDialogOption.onSelect` on
  ending options. No fake phone events were added to the When-event picker.
- Quest-ending nodes are back as terminal effect nodes:
  `fx.completeQuest` → `this.complete()`, `fx.retireQuest` → `this.retire()`,
  and `fx.unclaimQuest` → `Quest.unclaim(name)` with a blank name defaulting to
  the current quest.
- If an objective's **On complete** wire reaches one of those terminal nodes
  synchronously, the runtime defers the quest-ending call until after
  `completeObjective(...)` so the final objective visibly ticks before the
  quest entry goes away.
- `entry.complete` wording and graph warnings now say it runs after a deliberate
  finish path instead of claiming completion is unreachable by default.
- The generated handbook is regenerated at r169, with new pages for
  Complete/Retire/Unclaim quest and updated phone Dialogue prose.

Validation for this pass: `npm ci`, `npm run gen:manual`, targeted Vitest for
compiler/schema/dialogue/analysis/templates, `npm run typecheck`, `npm test`
(**1,548 tests / 79 files**), and `npm run build`.

Supporting notes:

- [`plans/r169-phone-end-flow-and-quest-endings.md`](plans/r169-phone-end-flow-and-quest-endings.md)
- [`plans/r168-phone-onend-completion-qa.md`](plans/r168-phone-onend-completion-qa.md)
- [`plans/r166-sdk-0.24-ingame-qa.md`](plans/r166-sdk-0.24-ingame-qa.md)

Next-up from the SDK 0.24 comparison: focused Mail QA for `Mail.send()` ids,
`Mail.remove()` and `replyable`; a deliberate Scheduler/Time design pass; HTTP
nodes only after SteelWaffe clarifies/fixes `curl`, DNS-only collaborator hits
and static-site HTTP event semantics. Suspicion/log-forensics and SMS remain
absent from the pinned SDK.

Older handoff sections below are retained as history.

---

# Handoff — r168

r168 adds a focused raw QA check for the old phone-call completion freeze. SDK
0.24 declares Kisscord/WeeChat/Mail events, but **no phone/dialog end event**;
phone `onEnd` is a callback on `QuestDialogSpeech`, not a `ModEventMap` entry.

Added to `reference/sdk-0.24-qa/mod` harness version `1.0.6`:

- `qe24 claim phone-auto` then `qe24 phone-auto`: final phone line calls
  `completeObjective("phone-ended")`; Zeis reported `AutoComplete = true` finished the
  quest without freezing.
- `qe24 claim phone-direct` then `qe24 phone-direct`: final phone line calls
  `this.complete()` from `onEnd`; Zeis reported it finished without freezing.

Zeis ran both probes in game and reported they worked. The r169 editor surface
therefore uses the Dialogue-node callback model, not a fake global phone event.

Supporting note: [`plans/r168-phone-onend-completion-qa.md`](plans/r168-phone-onend-completion-qa.md).

---

# Handoff — r167

r167 exposes **Create Wi-Fi** after the r166 SDK 0.24 in-game QA pass. The
current shipped state is:

- `@hotbunny/hackhub-content-sdk@0.24.0` is pinned and the generated event
  catalogue has **99** events.
- `world.wifi` is palette-visible, add-searchable, covered by the Node
  Reference template, and documented in the generated handbook.
- Wi-Fi exports through SDK 0.24's native `Network.createWifiNetwork` path when
  available, with BSSID, numeric channel and WPS carried through; the older
  router fallback remains only for older game builds/imports.
- The Bettercap `SSID: undefined` behaviour for SDK-created APs is documented
  as an informational game/runtime display wart, not an editor blocker.
- Wi-Fi-specific dice buttons generate BSSIDs and WPA-style passphrases.
- Manual inventory now reports **34 node types / 34 obtainable**, **123 editable
  fields**, **65 sockets**, **10 categories**, and no manual exclusions.
- Full validation for this pass: `npm run gen:manual`, `npm run typecheck`,
  `npm test` (**1,527 tests / 79 files**) and `npm run build`.

Next-up from the SDK 0.24 comparison: focused Mail QA for `Mail.send()` ids,
`Mail.remove()` and `replyable`; a deliberate Scheduler/Time design pass; HTTP
nodes only after SteelWaffe clarifies/fixes `curl`, DNS-only collaborator hits
and static-site HTTP event semantics. Suspicion/log-forensics and SMS remain
absent from the pinned SDK.

Supporting notes:

- [`plans/r167-wifi-exposure-and-sdk024-roadmap.md`](plans/r167-wifi-exposure-and-sdk024-roadmap.md)
- [`plans/r166-sdk-0.24-ingame-qa.md`](plans/r166-sdk-0.24-ingame-qa.md)
- [`03-questions-for-the-developers.md`](03-questions-for-the-developers.md)

Older handoff sections below are retained as history.

---

# Handoff — r163

r163 ships a proper **standalone user manual** (plan:
[plans/r163-user-manual.md](plans/r163-user-manual.md)) — the user asked for a
simple standalone HTML file documenting every feature, step, and item of the
editor. Structure inspiration only: https://fuibar.xo.je/manual.html (single
page, sticky section nav, key-cap tables, dense prose). Content is entirely
ours and verified against the code.

**Deliverable:** [`public/manual.html`](../public/manual.html) — one
self-contained file, inline CSS, no JS, no build step; opens off disk or ships
with the app (Vite copies `public/` verbatim, confirmed at `dist/manual.html`).
Sticky left-nav, 18 numbered sections: introduction, getting started, the
workspace (top bar/quest strip, palette, canvas, inspector, status/issues),
building a quest, a full node reference of all **34** node types across their
**10** categories, sockets & wires, Dialogues, Websites, the **92** events (ten
groups), Generate (dice) & tags, Addons, the **13** templates, Dry run, export
(zip contents), Settings (6 themes, 7 fonts, canvas grid, wires), the complete
keyboard/mouse cheat sheet (mirrors `SHORTCUT_GROUPS`), saving, and notes/limits
(Wi-Fi and On-quest-complete caveats).

**Counts re-verified from code, not the stale r148 doc:** 34 node types
(`registry.ts`), 10 categories (`CATEGORIES`), 13 templates
(`templates/index.ts`), 92 events + SDK 0.21.0
(`reference/hackhub-events.json`), shortcuts (`shell/Overlays.tsx`), export
files (`compile.ts`/`ExportDialog.tsx`), themes/fonts
(`settings/theme.ts`,`uiFont.ts`).

Documentation only — no compiler output touched, so `EDITOR_BUILD` stays
`2026-09-14.r162`. Gates: typecheck clean, **1,498 tests / 77 files**, build OK.
README trimmed (r158 → archive).

Roadmap unchanged: Next-up is templates only (1 contact-driven story, 2
branching consequence), both **postponed by the user** until the game + SDK
properly update.

---

# Handoff — r162

r162 finishes the auto-generate feature (plan:
[plans/r162-dice-icon-and-long-tail.md](plans/r162-dice-icon-and-long-tail.md)),
three things the user asked for after trying r161:

1. **Real dice icon.** r161's `dice` was a stroked square that read as a text
   box. `Icon.tsx` gained a `FILLED_ICONS` registry (`{ viewBox, paths[] }`,
   rendered `fill=currentColor stroke=none`) so the user's filled 32×32 vector
   die drops in; the old square path is gone.
2. **Service-aware, rule-compliant Version.** New `versionNumber()` →
   `[1-9].[0-99].[0-99]` (the game's rule). `serviceVersion(ctx)` reads
   `ctx.service` via `SERVICE_SOFTWARE` (ssh→OpenSSH/Dropbear, http→Apache/nginx,
   …; unknown/blank → `GENERIC_SOFTWARE`) and appends a fresh compliant version,
   so a port's Version banner always matches its Service and never gets rejected.
   `GenContext` gained `service`; `Field.tsx`'s reuse map learns the `service`
   key. The old fixed `SERVICE_BANNERS` list is removed.
3. **Long tail wired.** Port Service (`serviceName`) + Version (`serviceVersion`
   reusing service); world.port `port.service`; vuln Version; Pay From IBAN
   (`iban`) + From name (`initialName`); Wi-Fi SSID (new `ssid()` from
   `SSID_WORDS`/`SSID_SUFFIXES`); sims — Mail from (`email`), Kisscord handle
   (`username`), WeeChat host (`domain`) + per-line username (`username`).

Still editor-only: nothing reaches the compiler/runtime/export, fieldAudit
unaffected. Tests: generate.test.ts (+versionNumber/service-match/ssid,
−fixed-banner) and generateButton.test.tsx (+Version reuses Service). Gates:
typecheck clean, **1,498 tests / 77 files**, build OK. Stamp
`2026-09-14.r162`. README trimmed (r157 → archive).

**Zeis's eyes only:** the dice now looks like a die. Create-network → a device →
Ports → type a Service (e.g. ssh), then roll Version → an OpenSSH banner. Pay
node From IBAN/From name; Wi-Fi SSID; Mail From; Kisscord/WeeChat handles.

Roadmap: the auto-generate feature is done. Next-up is templates only — 1
contact-driven story, 2 branching consequence.

---

# Handoff — r161

r161 adds the auto-generate (dice) button, Next-up #1 (plan:
[plans/r161-autogen-dice-button.md](plans/r161-autogen-dice-button.md)). A flat
`dice` glyph beside name/IP/domain fields fills them with a realistic
**hardcoded** value in the editor — distinct from the existing sparkle/tag
button, which inserts a runtime `{{…}}` tag; IP-type fields now show both. The
engine is pure and seedable: `src/lib/generate/wordlists.ts` (curated lists) +
`index.ts` (`generateField(kind, ctx, options, rng)`), composing values from the
lists rather than a flat product, and reusing sibling values (first/last name,
company) to stay coherent — it *reads* siblings but only ever *writes* its own
field, so one click is one undo step. IPs come `"public"` or `"private"`
(RFC-1918) per field.

Fields opt in with a `generate` descriptor on `FieldDef`
(`{ kind, ipFlavour?, reuse?, label? }`), rendered by `Field.tsx` via a new
`GenerateButton`; a `trailing` slot was threaded through
`TokenInsert`/`SelectOrCustom` so a field can carry sparkle + dice. Hand-written
surfaces (quest Employer in `InspectorPanel`, the device tree) use the
`TextInputWithGenerate` wrapper. Wired: employer (first/last/e-mail, reuse),
devices (IP-private/hostname/domain/router-model), user rows
(username/first/last/e-mail, reuse), and every IP/host field (network device,
port, files, firewall, domain resolves-to, database host) + domain node domain +
database username. Nothing reaches the compiler/runtime/export — the dice writes
plain text through the normal path, so `fieldAudit` is unaffected. Tests:
`lib/generate/__tests__/generate.test.ts` (13, stubbed rng) +
`inspector/__tests__/generateButton.test.tsx` (5). Gates: typecheck clean,
**1,493 tests / 77 files**, build OK. Stamp `2026-09-14.r161`. README trimmed
(r156 → archive).

**Zeis's eyes only:** Quest tab → Employer → roll First/Last, then E-mail (it
picks up the names). Create-network → a device → the dice on IP / Hostname /
Domain / Router model. Any IP field shows the dice next to the sparkle.

Roadmap: Next-up is now 1 the dice **long tail** (service/version, IBAN, SSID,
sims handles), then the two templates last (2 contact-driven, 3 branching).

---

# Handoff — r160

r160 reworks the inspector edge handle into a real drawer pull (plan:
[plans/r160-inspector-drawer-pull.md](plans/r160-inspector-drawer-pull.md)),
from the user's annotated screenshot. The r159 grip becomes a protruding pull
tab centred on the docked inspector's left edge. **Drag it left → the docked
panel widens** (340px default/floor, up to a 640px ceiling); **pull past that
ceiling → it tears off the wall into a floating drawer** and follows the
cursor; a plain click still pops it out in place. Docked width is a new
persisted per-author preference in `drawerLayout.ts`
(`inspectorDockedWidth`/`setInspectorDockedWidth`/`clampDockedWidth`, same
`useSyncExternalStore` + localStorage shape as the float rect, never in the
mod); `App.tsx` applies it as an inline width on the expanded `<aside>` (width
transition dropped while expanded so a drag tracks the cursor). Reset re-docks
at 340px. The canvas minimap "follows the panel while docked, returns to base
when floated" needed **no code** — it already lives inside the flex-sibling
`<main>`, so it reflows for free as the panel grows/leaves (YAGNI). Gates:
**1,475 tests / 75 files** (+5), typecheck + build clean. Stamp
`2026-09-14.r160`. README trimmed (r155 → archive).

**Zeis's eyes only:** grab the pull tab on the inspector's left edge — a short
drag left makes the panel wider (watch the canvas + minimap reflow), keep
pulling to tear it off into a floating drawer, or just click it to pop out.
Settings → reset re-docks at the default width.

Roadmap: Next-up is now 1 auto-generate fields, then the two templates last
(2 contact-driven, 3 branching consequence).

---

# Handoff — r159

r159 fixes a usability miss in r158 (plan:
[plans/r159-inspector-dock-handle.md](plans/r159-inspector-dock-handle.md)).
r158 shipped the float feature behind a small dim maximize icon top-right
of the inspector — the user loaded it and could not find any way to pull
the panel out or push it in; they reached for a handle on the edge that
wasn't there. So r159 adds one: a full-height grab handle on the docked
inspector's **left edge** (new `src/editor/inspector/InspectorDockHandle.tsx`).
**Click** it to float in place; **drag** it past a 6px threshold to pull the
panel out and carry it under the cursor. The redundant top-right float icon
button is retired (KISS — one obvious way); the collapse chevron stays. The
handle is a real `<button>` (keyboard-focusable), and its pointermove/up
listeners bind to `window`, not the handle, because the docked aside — and
the handle with it — unmounts the instant the panel floats. No change to
`drawerLayout.ts`, `FloatingInspector.tsx`, the compiler, export, or the
project document. Gates: **1,470 tests / 75 files** (+1 drag-to-float case
in floatingInspector.test.tsx), typecheck + build clean. Stamp
`2026-09-14.r159`. README trimmed (r154 → archive).

**Zeis's eyes only:** the ⋮ grip on the inspector's left edge — click it to
float, or grab it and drag the panel off the wall. Drag the drawer's title
bar / bottom-right corner as before; Settings → reset re-docks it.

Roadmap: Next-up is now 1 auto-generate fields, then the two templates last
(2 contact-driven, 3 branching consequence).

---

# Handoff — r158

r158 makes the inspector a free-floating drawer (plan:
[plans/r158-floating-inspector-drawer.md](plans/r158-floating-inspector-drawer.md)),
Next-up #1. A **Float** button (maximize icon) beside the docked
inspector's collapse control pops it out; drag the title bar to move it,
drag the bottom-right grip to resize, click **Dock** to snap it back. The
layout (`docked | floating`, plus the float rect) is a per-author editor
preference in new `src/editor/inspector/drawerLayout.ts` — the same
module + `useSyncExternalStore` + localStorage shape as snap/wire prefs,
deliberately **not** in the project document (no export, no undo entry). A
`clampRect` invariant keeps the whole panel on screen so the title-bar
handle can never be dragged off an edge and lost. Floating and docked wrap
the *same* `<InspectorPanel />`, so there's one inspector, two frames — no
duplicated fields. Docked stays the shipped default and is byte-for-byte
unchanged; "reset all editor preferences" re-docks it. Gates: **1,469
tests / 75 files** (+15 in 2 new files; the clamp guard is falsified by
revert), typecheck + build clean. Stamp `2026-09-14.r158`. README trimmed
(r153 → archive).

**Zeis's eyes only:** the Float button top-right of the inspector; drag the
drawer's title bar and its bottom-right corner; Settings → reset re-docks it.

Roadmap: Next-up is now 1 auto-generate fields, then the two templates last
(2 contact-driven, 3 branching consequence).

---

# Handoff — r157

r157 refreshes the Shortcuts cheat sheet (plan:
[plans/r157-shortcuts-cheat-sheet-refresh.md](plans/r157-shortcuts-cheat-sheet-refresh.md)),
Next-up #2. The stale flat 12-row list is rebuilt as grouped sections
(Editing · Add nodes · Select · Wiring · Move around), keys drawn as key
caps and mouse gestures as plain italic text. Adds every shipped-but-
undocumented gesture — Shift+A and right-click node search, drag-a-wire-to-
empty create, double-click-a-wire reroute, box select, pan (middle/right-
drag), scroll zoom, frame title-bar drag, Ctrl+Y redo — each audited
against the code that implements it (the hook, `QuestCanvas`, React Flow
config), nothing from memory. New `shortcuts.test.tsx` drives the
documented keys through the real `useKeyboardShortcuts` hook so a future
stale row fails CI (falsified by reverting: a bogus Ctrl+Q row goes red).
No behaviour change. Gates: **1,454 tests / 73 files**, typecheck + build
clean. Stamp `2026-09-14.r157`. README trimmed (r152 → archive).

**Zeis's eyes only:** open the Shortcuts button — it now reads "Shortcuts &
gestures", grouped, with mouse actions in italics.

Roadmap note: per Zeis, the two templates are pinned to the end of Next-up.
Order is now 1 draggable inspector, 2 auto-generate fields, 3 contact-driven
template, 4 branching-consequence template.

---

# Handoff — r156

r156 is a full-program Clean Code & Architecture audit (plan:
[plans/r156-full-program-clean-code-audit.md](plans/r156-full-program-clean-code-audit.md)) —
the first whole-tree pass since r139. Finding: the codebase is in very
good shape. Macro gates all clean — pure core has no React/DOM/store
imports (AR1/AR2), no `getState()` in pure code (AR8), the only import
cycle is essential inspector-form recursion (`Field↔ListEditor↔DeviceTree`,
intra-folder, AR3-safe), boundary `safeParse` intact (AR12), permissions
declarative (AR17), escaping contained (AR16). Micro: zero
`console.log`/`as any`/`TODO`/`@ts-ignore`. One direct edit:
`store/editor.ts` now calls the existing `activeQuestOf` helper instead of
eight inlined active-quest lookups (A3 DRY, behaviour-neutral). Two
recommendations deferred (not guessed at): tighten `tokenPermissions` to
match full `{{…}}` tokens; wire ESLint/Prettier as real scripts. Gates:
**1,446 tests / 72 files**, typecheck + build clean. Stamp
`2026-09-14.r156`. README trimmed (r151 → archive).

**Zeis's eyes only:** nothing user-visible changed — the export is
byte-identical; the debug panel and export headers now read `r156`.

---

# Handoff — r155

r155 closes queue #6 (plan:
[plans/r155-ports-vuln-labels.md](plans/r155-ports-vuln-labels.md)): Telnet
+ HTTPS presets (blank versions, no-invention rule; telnet is a port label
only — the handbook says no telnet player command is verified), and
"TYPE (what it means)" vulnerability dropdown labels with raw-enum values
(exports byte-identical). Gates: **1,446 tests / 72 files**, build clean.
Stamp `2026-09-13.r155`. README trimmed (r150 → archive).

**Zeis's eyes only:** the longer port dropdown, the vuln dropdown reading
"RCE (run any command)". Remaining queue: 1 contact template, 2 branching
template, 3 floating inspector, 4 shortcuts refresh, 5 auto-generate.

r154 is the UI-words batch (plan:
[plans/r154-ui-words.md](plans/r154-ui-words.md)): Sticky note → Layout
below Group frame (registry order does it free); "Player replies" →
**Custom terminal** (the category holds one node, a custom terminal
command; dialogue prose untouched); Tools → **Addons** throughout the
user copy (button, manager, nodes, picker, README line, format doc).
Display names only — `toolpack.json`, ids, identifiers, and history docs
stay. Retires Next-up 3/4/5/7; renumbered 1–6 (old 6→3, 8→4, 9→5, 10→6 —
earlier HANDOFF references to 9/10 mean today's 5/6). Gates: **1,444
tests / 71 files**, build clean. Stamp `2026-09-13.r154`. README trimmed
(r149 → archive).

**Zeis's eyes only:** the palette's new Layout group and Custom terminal
name, the Addons button + manager, an event picker with a pack loaded.

r153 gives warnings severity (plan:
[plans/r153-warning-severity.md](plans/r153-warning-severity.md)): Zeis
read the amber cards as critical errors. Info (unlisted pages, honesty
lines, FYIs) renders light-blue, amber stays for could-cause-issues (dead
nodes, target mismatches, placeholders), red for will-break (unstartable
quests, the lynx-handle game crash, broken addresses). Levels ride
`computeWarningDetails()`; `computeWarnings()` stays a string view so no
test churn; `CompileResult`/`SimReport` carry both. Export heading turns
"Needs attention" on any red. Gates: **1,444 tests / 71 files**, build
clean. Stamp `2026-09-13.r153`. README trimmed (r148 → archive).

**Zeis's eyes only:** export anything with warnings — blue FYIs, amber
maybes, red must-fix, heading flips when red is present.

r152 is Zeis's r151 review (plan:
[plans/r152-warning-cards-event-labels.md](plans/r152-warning-cards-event-labels.md)).
The warning wording stays — he likes it. Two fixes shipped, two queued:

- **Warning cards:** export + Dry run warnings render as one amber card
  each (shared `src/components/WarningList.tsx`, `alert` triangle icon),
  the quest/host context before the first `": "` semibold so entries scan.
  Colon-less warnings render whole; markup stays flat so each warning's
  text matches one element. The Dry-run test now finds its quest heading
  by role — the warning card's `<strong>` collided with the old loose
  text match (test-only, no behaviour change).
- **House-style pack event labels:** both packs' labels rewritten from
  sentences to the built-in "Group: Thing" form ("Breach: File
  downloaded", "Scan: Finished", …) — the sentences stay in the events'
  `docs` where the picker explains them. Root cause of the mismatch: pack
  authors write the labels, and the spec taught sentences; the spec now
  teaches short labels (~40 chars) with the sentence in `docs`. Picker
  rows also carry `title` hovers so nothing truncates silently.
- **Queued:** Next-up 9 (auto-generate dice button for name/IP-like fields,
  in-editor random, exports hardcoded + the tag-insertion audit incl. the
  open question whether Create-network IP accepts the game's random-IP
  tag) and 10 (extend "Add a common port" to everything the game uses;
  display-only vuln descriptions).
- Gates: typecheck clean, **1,438 tests / 70 files**, build clean. Stamp
  `2026-09-13.r152`. README trimmed (r147 → archive).

**Zeis's eyes only:** export anything with warnings (or Dry run it) — amber
cards, quest names bold. Then the When-event picker with a pack loaded:
short "Breach: …" rows beside "Terminal: …".

r151 ships the **target-matching warnings** (plan:
[plans/r151-target-warnings.md](plans/r151-target-warnings.md)) — the second
half of Zeis's r149 split — plus a stub rider for the empty inspector his
QA screenshot caught:

- **Three warnings, intent-gated per quest per pack.** A quest "uses" a pack
  when it listens for one of the pack's events, hands data to one of the
  pack's storage keys, or runs one of the pack's nodes — and only then are
  its own targets checked: unknown services, serviced ports with blank
  versions, weaknesses nothing lines up with. Never cross-quest (a campaign
  that sets up in part 1 what part 2 exploits must not cry wolf) and never
  without targets (a pure-listener quest stays silent). Copy is gamer words
  throughout — no event names, keys, or calls.
- **Semantics re-verified against the example mod's current source**
  (recon-ng `main`, example only): services case-insensitive with aliases,
  versions a case-insensitive substring (so the editor checks completeness,
  not correctness), weaknesses case-sensitive exact. The alias read also
  found a third group (`printer` → jetdirect/raw/raw-print/pjl) no built-in
  module uses — the pack's service list stays at the 7 module-covered names,
  recorded in the plan.
- **Wiring:** new pure `src/compiler/targetWarnings.ts`;
  `computeWarnings(project, packs = [])` / `compileProject` /
  `simulateProject` all take optional packs (old call sites compile
  unchanged and stay silent); ExportDialog and SimulatorDialog pass
  `usePacks`. Closed ports skipped (inactive device ports, close/remove
  Change-port nodes).
- **Stub rider:** a `pack.node` with no action picked renders a stub naming
  its palette group ("Editor Mods · pack") instead of an empty inspector.
- **Queued, not built:** Zeis's five screenshot-review items are README
  "Next up" 4–8 (Sticky note → Layout, Player Replies rename, floating
  inspector, Tools → Addons, Shortcuts refresh).
- Process: node_modules was gone after a sandbox reset (`npm ci` brought it
  back); his screenshot was viewed via `git fetch origin QA-filedump` +
  `git show FETCH_HEAD:<path>` (no checkout, temp copies deleted) — that is
  the standing method now `/home/user/uploads/` does not exist here.
- Gates: typecheck clean, **1,436 tests / 69 files**, build clean, both new
  guards falsified by revert (alias expansion, intent gate). Stamp
  `2026-09-13.r151`. README trimmed (r146 → archive).

**Zeis's eyes only:** load the Recon-NG pack, give a quest a `telnet` port
plus a trigger on any ReconNg event, and export — the warning should read
like advice, not an error. Then click an unset Tool pack node: the stub.

r150 is Zeis's r149 eyeball feedback as a gamer (plan:
[plans/r150-pack-ux-polish.md](plans/r150-pack-ux-polish.md)) — the
warnings round moves to r151:

- **Drop zone**: the pack manager's list area accepts dropped
  `toolpack.json` files (highlight on dragover, same load path, hint
  updated) — his first instinct, now correct.
- **Save button**: footer gains explicit Save (closes the dialog). Loads
  still apply instantly — Save is the commit moment, the status line the
  receipt. Staged loads deliberately rejected (no new states).
- **Gamer-words summaries**: one shared `describePackNodeAction()` in
  `toolpacks/palette.ts` feeds the inspector and the canvas cards —
  "sends a signal to the tool mod", never "fires
  ExampleTools.Handover.Done". The inspector prefers the pack author's
  own `docs` (newly snapshotted as `nodeDocs`, default `""`); cards keep
  the short line; the data node's card drops its raw storage-key line;
  the "same {mergeBy}" note is keyless.
- **Provided-by banner**: teal `From the **X** tool pack` panel tops the
  node inspector, distinct from the warn honesty line at the bottom. No
  banner on the data node — its pack dropdown already sits at the top.
- **Renames**: "Community data" → **"Give data to a tool mod"**,
  "Community node" → **"Tool pack node"** (labels/blurbs/warning copy
  only — no type or count changes).
- Process notes: his screenshot attachment never arrived in the sandbox
  (`/home/user/uploads/` absent) — all copy verified against the code;
  and parallel same-file edits silently lost writes this round (registry
  rename, three imports, two test updates) — every one caught by
  typecheck/tests and re-applied serially with grep verification. Never
  parallel-edit one file.
- Gates: typecheck clean, **1,416 tests / 68 files**, build clean. Stamp
  `2026-09-13.r150`. README trimmed (r145 → archive).


r149 authors the **Recon-NG example pack** (plan:
[plans/r149-reconng-pack.md](plans/r149-reconng-pack.md)) — the first half
of Zeis's split: the pack now, the target-matching warnings next round
after he eyeballs the pack's labels.

- **The second pack is real.** Darkvalnar's Recon-NG (exploitation
  workspace: pick a module, breach a target, work a persistent session),
  described as `reference/reconng/toolpack.json` — **fenced** (README
  banner: example only, never serviced, nothing imported by `src/` or
  shipped in any export; source pinned at `798f9ee` with the GitHub and
  docs links in the fence doc). Named explicitly by Zeis's call with the
  author's permission.
- **Docs verified against source first.** Four diffs, code wins: their
  events page lists 5 events, the source emits 9 (`DirListed`, `Shutdown`,
  `UserEnum.Complete` undocumented anywhere, `SessionClosed` only on the
  session-control page); vulns are read from `subnet.domain` only
  (`BreachBackend.ts:1520`) — our compiler already emits the domain +
  `registerDomain`, so no compiler change (flagged for in-game eyes, not
  assumed); service aliases code-confirmed (`:477-478`). Recorded in
  `reference/reconng/NOTES.md` with file+line.
- **The pack:** 9 events (the three truly-undocumented ones say so),
  3 data shapes (loot, authored exploit, user-enum target), 2 story-timed
  session nodes (cut-the-session, open/close-a-host), real target
  conventions. Deliberately out with reasons: wordlists (grants need a
  string-list merge mode the format lacks), session locks (`until` is
  epoch ms — no computed values), access profiles / binary overrides /
  reverse payloads (need in-game testing), multi-value exploit/enum
  fields (no string-array kind — YAGNI).
- **The format's first new field:** optional `targetRules.serviceAliases`
  (additive, format stays 2, old packs parse unchanged) — without it the
  pack would misdescribe matching.
- **Latent bug caught on the way:** untouched toggles emitted the literal
  string `"{{key}}"` (truthy!) while showing off — the starter pack has no
  booleans, so nothing tripped it until now. `defaultPackValues()` seeds
  booleans to `"false"` at snapshot time on both paths (`buildAddData`,
  `chooseContract`); falsified all three guards by revert.
- Housekeeping: README "Done recently" trimmed to 5 rows (r130–r144 →
  `docs/archive/rounds-130-144.md`); "Next up" item 3 updated (pack done,
  warnings next). Stamp `2026-09-13.r149`.
- Gates: typecheck clean, **1,412 tests / 68 files**, build clean.

**Zeis's eyes only:** load `reference/reconng/toolpack.json` through
Tools → Tool packs and read every label/docs/hint as a gamer — the
warnings round builds on these words. In-game halves it cannot prove:
whether an editor-built target (domain + `registerDomain`, no
`setVulnerabilities`) actually matches a module's `check`, and whether
`addCommandData`-style flows matter here at all (recon-ng is itself a
command; the pack uses no `commandData`).


r148 answers Zeis's r147 review, item for item (plan:
[plans/r148-picker-marksize-stamp.md](plans/r148-picker-marksize-stamp.md)):

- **The grid colour picker is now the inspector's own ColourPicker** —
  presets, hex field, HSL sliders; the native `<input type="color">` (which
  the picker was originally built to replace) is gone. Theme stays a button
  beside it (null state, seeded neutral while following the theme).
- **Mark size** (his "Line width", clarified by ask → "both"): 25–250% of
  the standard look, default 100% = the r147 look. Sizes dots' diameter,
  crosses' arms, hexagon outlines (lattice follows, stays seamless),
  diamond spacing. Hidden for line styles — they have no marks.
- **Line weight freed**: the four presets became a slider, 0.5–6 in
  quarter steps, reset arrow included. Old preset values live inside the
  range, so r147 stored weights carry over. `NumberSlider` grew a `step`
  prop for fractional dials.
- **EDITOR_BUILD bumps every round from now** — Zeis reads it as the
  version (debug panel + every exported mod header showed r139). Now
  `2026-09-13.r148`. The old AR13 reading (bump only on compiler changes)
  is retired: the stamp is a version, not a changelog.
- Mark-size guard falsified (forced mark factor 1 fails the render test:
  dot radius and hexagon lattice width both asserted); stored-blob upgrades
  tested with the exact pre-r147 and r147 shapes.
- Gates: typecheck clean, **1,396 tests / 67 files**, build clean.

**Zeis's eyes only:** the picker's sliders against the live grid, mark size
at the extremes, weight 6 on squares, the panel reading r148.

r147 is the grid-polish round from Zeis's first hands-on (plan:
[plans/r147-grid-polish.md](plans/r147-grid-polish.md)):

- **Dots were genuinely invisible** — a real sizing bug, not his eyes: the
  library's Dots `size` is the *diameter* and r142 passed 1.5, a 0.75px
  radius at 100% zoom — sub-pixel ink no opacity can rescue. Now
  `GRID_DOT_SIZE = 9` (his spec: just above the crosses' old span).
- **Crosses** lengthened from span 8 to 11 so they read as crosses.
- **Grid scale reset**: the circular-arrow button beside the number field
  puts the standard size (22) back — `NumberSlider` grew an `onReset`.
- **Grid colour** (the accessibility ask): Theme (default, the canvas-dots
  token) + six fixed presets + a native colour field; stored as `colour`
  in the same `qe.canvasGrid` JSON (`null` or a strict lowercased `#rrggbb`
  — everything else rejected on read and write). Opacity still mixes on
  top. The overlay's ink now rides a `--qe-grid-ink` custom property
  (identical rendering; jsdom re-serializes standard properties lossily,
  custom ones verbatim).
- **Line weight**: Hairline 0.5 / Thin 1 / Medium 1.75 / Bold 2.5, driving
  native `lineWidth`, overlay `strokeWidth`, and the graph heavy line at
  `weight × 1.75`. Dots keep their own size (the hint says so).
- Both new guards falsified (sub-pixel dots probe, dropped-colour probe);
  pre-r147 stored blobs upgrade losslessly (tested with that exact shape).
- Gates: typecheck clean, **1,392 tests / 67 files**, build clean. No
  `EDITOR_BUILD` bump (AR13).

**Zeis's eyes only:** dot size feel at a few scales (9 is one number to
tweak), the crosses' arms, each weight on each style, the presets against
dark and light themes.

r146 found the real grey screen (plan:
[plans/r146-grey-screen-name-twin.md](plans/r146-grey-screen-name-twin.md)).
Zeis's Firefox console named it outright:

```
Uncaught SyntaxError: The requested module
'.../src/editor/canvas/CanvasGrid.ts' doesn't provide an export named:
'CanvasGridBackground'
```

— a file that does not exist in the repository.

- **The bug:** r142 shipped `CanvasGrid.tsx` (the component) beside
  `canvasGrid.ts` (the preference module) — the same name ignoring case,
  differing extension. `QuestCanvas` imported the component extensionless;
  Vite tries `.ts` before `.tsx`; on Windows (NTFS, case-insensitive)
  `CanvasGrid.ts` "exists" (it is `canvasGrid.ts`), so the import bound to
  the wrong module and the browser died with that SyntaxError — grey screen.
  On Linux (this sandbox, every gate we have) the two names are distinct and
  everything stays green. Born exactly with r142, which is why every build
  before it worked for Zeis and every build after grey-screened.
- **Reproduced end to end** by simulating the Windows view: the dev server
  rewrote the import to `CanvasGrid.ts` and served the preference module
  there — zero mentions of `CanvasGridBackground`, Zeis's error verbatim.
- **The fix:** the component is renamed `CanvasGridBackground.tsx` and its
  import spells the extension (`.tsx`), so no extensionless resolution
  happens at all; plus a new guard test (`filenameSafety.test.ts`) fails
  the build if any two JS/TS files anywhere share a lowercased stem —
  falsified with a planted twin pair. The bug class is unshippable now.
- **r145 corrected:** its optimizer fix was real and stands (the optimizer
  line disappeared from Zeis's terminal), but its "slow machine" framing
  was an unverified assumption stated as fact, and the race was never this
  bug. Both the r145 plan and README now carry the correction. The lesson
  is recorded in the r146 plan: never explain a failure with an unverified
  property of the user's machine, and a bug that appears exactly when a
  round lands is the round's bug until proven otherwise.
- Gates: typecheck clean, **1,379 tests / 67 files**, build clean. No
  `EDITOR_BUILD` bump (AR13).
- **Zeis's verification:** fresh zip as always — it should simply boot.

r145 found and fixed the grey screen (plan:
[plans/r145-grey-screen-launch-race.md](plans/r145-grey-screen-launch-race.md)).
Zeis's second report carried the clue that cracked it: his terminal printed
`[vite] (client) [optimizer] bundling dependencies...` — a line the working
builds never showed.

- **The mechanism:** Vite optimizes dependencies asynchronously *after* the
  dev server starts listening. Launch.bat polls the TCP port — it answers
  before the optimizer finishes — and opens the browser into the window. On
  Zeis's machine the browser beats the optimizer; the page's dep URLs get
  superseded mid-load (504 Outdated Optimize Dep); the half-loaded page has
  no HMR connection to self-recover, so it stays grey forever. A documented
  Vite failure mode, not an editor-code crash — which is why 1,378 tests,
  the r144 boot net and 154-module dev-server crawls all stayed green while
  his browser sat empty.
- **Reproduced locally:** a crawl against a server whose dep cache was
  re-bundled underneath it caught live `504 Outdated Optimize Dep`
  responses — the exact failure.
- **Not caused by the grid rounds, but real:** the lockfile is byte-identical
  r141 (worked) → r144 (grey); the race had been in the launch flow since
  the start and is timing-dependent. r144's "dead preview server" theory is
  retracted (Zeis never uses the preview).
- **The fix (no editor code changed):** the dev script now runs
  `vite optimize` to completion *before* `vite` listens, so a browser cannot
  connect until every dependency is bundled; and all 21 runtime dependencies
  are declared in `optimizeDeps.include` so the startup scan can never miss
  one for the browser to discover mid-session. Verified: cold cache → port
  answers only after optimizing → instant parallel crawl: zero 504s, zero
  slow requests, no client-optimizer line.
- Gates: **1,378 tests / 66 files**, typecheck clean, build clean. No
  `EDITOR_BUILD` bump (AR13).
- **Zeis's verification:** fresh zip as always — the editor should just
  appear. If a grey screen ever recurs: wait a few seconds and hard-reload
  (Ctrl+Shift+R); if that does not fix it, F12 → Console → send the red
  lines (that would be a different failure).

r144 answered a grey screen, rebuilt the README, and re-landed the grid (plan:
[plans/r144-grey-screen-readme-reland.md](plans/r144-grey-screen-readme-reland.md)):

- **The report:** the day r142 landed, Zeis saw the editor load to "a grey
  colour and absolutely nothing else" and rolled the branch back with
  GitHub's revert — taking r143 (a Compile.ts clean-code pass from a
  different tool) with it.
- **The investigation:** no boot crash is reproducible in r142's code — the
  full `<App />` boots clean with the grid off and on (r142's render tests
  already mounted it whole; r144 adds a dedicated net). A real-browser check
  is impossible from this sandbox: every browser-binary CDN is
  network-blocked, only npm and github answer. The leading suspect is the
  dev-preview server dying with a sandbox reset — the sandbox provably reset
  that night (local git rewound, node_modules gone), and a dead preview shows
  exactly a grey nothing.
- **One real bug, found on review and fixed:** the hexagon/diamond overlay
  set its colour as an SVG `stroke` *attribute* — `var()`/`color-mix()` are
  CSS and do not resolve in presentation attributes, so those two styles
  would have rendered invisible in a real browser (jsdom cannot see
  painting). The colour now travels a real CSS channel — inline `color` on
  the overlay svg, `currentColor` strokes — and the render tests assert it.
- **The boot net:** `src/__tests__/appBoot.test.tsx` mounts the whole editor
  three ways (grid off, native style on, overlay style on) and requires the
  standing shell. "The editor boots" was only ever implied before; now it is
  a test. Falsified: a render-time throw in the grid component fails all
  three.
- **The README:** truncated to intro + roadmap since somewhere in r134–r139;
  Zeis restored it from a backup. r144 brings it current — test counts, an
  r142 row, the r134–r140 history reconstructed from this file, the Visual
  Grid roadmap item retired, `src/editor/settings/` and `public/fonts/`
  added to the layout.
- **r143 stays reverted** (another tool's round): preserved at `a1fb342`;
  re-applying it is a separate, reviewed decision.
- Gates: **1,378 tests / 66 files**, typecheck clean, build clean. No
  `EDITOR_BUILD` bump (AR13).

**Zeis's eyes only:** the six patterns' actual look, seamlessness under
pan/zoom, Roboto/Roboto Mono rendering — and the grid is **off** by default
now, so toggle it on in Settings first.

r142 shipped the **visual canvas grid** and two more fonts (plan:
[plans/r142-canvas-grid.md](plans/r142-canvas-grid.md)), Zeis's specced scope:

- **Grid on/off** — default **off** (his explicit call): the grid *replaces*
  the always-on dot pattern r140/r141 shipped, so the default canvas is now
  plain — a deliberate change, not a regression. The r141 coupling "dots
  follow the snap step" is retired with it: the grid's scale is its own
  setting, snapping keeps its own size, and the sheet says so plainly.
- **Six styles** — his three (squares, dots, hexagons) plus our three:
  crosses, graph paper, diamond. Four ride React Flow's native `<Background>`
  (graph paper = two stacked Line layers, fine + every-fifth); hexagons and
  diamond are a custom overlay (`src/editor/canvas/CanvasGrid.tsx`) that
  mirrors the library's own tile math (verified in the xyflow dist) and tiles
  seamlessly by stamping motifs at lattice points, letting the pattern clip.
- **Scale** (slider + number input, 4–200, default 22) and **opacity**
  (0–100, default 50). The colour is a `color-mix` over the theme's
  `--color-canvas-dots` token — every theme recolors the grid for free.
- Settings: a "Canvas grid" section with a switch, six preview buttons (each
  a tiny live SVG of its pattern), and the two slider+number controls.
  Falsified: with the grid component reduced to always-off, four of the six
  render tests fail.
- **Roboto and Roboto Mono** joined the font picker (Fontsource, OFL,
  self-hosted latin 400/500/600/700 — fontsource generates the 600 Roboto
  never had upstream).
- The settings sheet's number fields got distinct aria-labels from their
  sliders ("(exact)") — the collision was real, not a test artifact.

**Zeis's eyes only:** how all six patterns actually look, seamlessness under
pan and zoom, the new fonts. No `EDITOR_BUILD` bump — the compiler emits
nothing new (AR13).

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

- **HEAD:** r170 (Ask player prompt node) on
  `arena/01a0aaee-hackhub-quest-editor`, committed and pushed after validation.
  Previous rounds: r169 phone end flow + quest-ending nodes, r168 phone `onEnd`
  completion QA probes, r167 Create Wi-Fi, r166 SDK 0.24 in-game QA.
- **1,560 tests green** across 79 files, typecheck clean, build clean.
- **Editor build stamp:** `2026-09-17.r170` (bumps every round since r148 — the
  stamp is a version, not a changelog).
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
  `coldStorage.ts`, `ledgerContract.ts`, `longGame.ts`, `reference.ts`,
  `cookbook.ts`). `src/templates/index.ts` is a thin registry.
  `Template.difficulty` is `Beginner | Advanced | Expert | Reference`.

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

## The world.wifi node: visible, with one game display wart

As of r167, `world.wifi` is back on the authoring surface. `PALETTE_HIDDEN_TYPES`
in `src/schema/registry.ts` is empty, `paletteGroups()` includes Create Wi-Fi,
and the Node Reference sheet includes a real Wi-Fi example.

Why this changed: SDK 0.24.0 ships `Network.createWifiNetwork`, and the r166
in-game harness proved scan fields, connect/disconnect events, reload behaviour,
cleanup, Bettercap capture and hashcat recovery are green enough to expose. The
compiler still keeps the old router fallback for older game builds, but current
exports use the native Wi-Fi creator when it exists.

Known wart: Bettercap can print `SSID: undefined` after targeting an
SDK-created AP by BSSID. The attack still worked in QA. The inspector/export
warning is therefore informational, not a blocker.

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
| The Ledger Contract | Expert | Long route, privilege escalation |
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

**Cold Storage** still models its old "wireless" identity as a plain
`world.network` router, because that template predates the r167 `world.wifi`
surface and its route was already tested around a visible device tree. New Wi-Fi
stories should use `world.wifi` when the access-point mechanics matter. Its
`lead_ledger` table was seeded in r126 (r125 deferred it mid-playtest).

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
6. Every quest has a deliberate finish path: closing beat first, then
   `fx.completeQuest` when the quest should formally complete, or an explicit
   legacy objective-hiding choice when it should stay active.
7. Each template states its tier and what it teaches in a sticky note.

## Queued next

1. **Mail cleanup/replyability QA.** SDK 0.24.0 declares `Mail.send(): string | null`,
   `Mail.remove(id)`, and `QuestMailDefinition.replyable`. Do a focused in-game
   pass before exposing cleanup/remove-mail authoring: id shape, remove timing,
   reply-button behavior, and unload/complete cleanup.
2. **Twotter update/remove QA.** SDK 0.24.0 declares `Twotter.updateUser(id, patch)`
   and `Twotter.removeUser(id)`, but old Twotter save/search behavior was brittle.
   Verify repair/removal semantics in game before restoring authoring.
3. **Scheduler/Time design pass.** r166 proved Scheduler/Time can survive reload
   in a raw probe. Design the editor surface deliberately rather than dropping a
   generic timer node into the palette.
4. **HTTP/curl/DNS collaborator remain fenced.** Static editor websites loaded
   in game, but `http-request`/`http-response` objectives did not complete;
   `curl` was missing as a terminal command; DNS-only collaborator hits produced
   no result. Wait for SteelWaffe clarification or fresh in-game proof before
   exposing authoring nodes.
5. **"Contact-driven story" template.** Cold Call covers the conversation shape;
   the phone-brief + objective-gated-drip variant is still open.
6. **"Two Ways Out" template.** Approved branching consequence shape, possibly
   morally grey. The Long Game includes a typed verdict with two endings, but a
   standalone template may still be useful after the feature queue settles.
7. **Data requests / eyes-on checks.** SMTP/POP3/IMAP version banners + ports;
   Apache metasploit module for 2.4.49/50 or flavour; Handbook title/category
   screenshot + id jump test; eyes on the preview; the Harbour `scp` hint fix.

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
