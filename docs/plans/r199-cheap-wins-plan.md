# r199: the cheap wins — pack extras and localization

> **Stage A complete, 2026-09-19 (r200, r201). All four APIs work.** Start-menu
> items appear in the bottom strip of the start menu (**and the declared
> `section` has no visible effect — so §4's menu list will not offer it**);
> desktop widgets render a mod's own HTML from a mod-relative path with position
> and size honoured (**and `transparent` defaults to true, so that switch is a
> visible control defaulted to opaque**); right-click items work on both `file`
> and `desktop` targets; localization translates, substitutes placeholders and
> echoes missing keys, with **30 languages** to offer. Stage B is now a build with
> no open questions. Full readings:
> [`STATUS.md`](../../reference/sdk-0.24-qa/STATUS.md).

> **Stage A results, 2026-09-19 (r200, then r201).** Widgets, right-click items
> and localization all work in game; the start-menu item did not appear and is
> being re-probed with all three section spellings. Two findings already shape
> Stage B: **`transparent` defaults to `true`** (a widget with no background is the
> default, so the editor must expose the switch and default it to opaque), and the
> **game offers 30 languages**, so the Languages table should offer exactly those
> rather than an invented list. Details in
> [`STATUS.md`](../../reference/sdk-0.24-qa/STATUS.md).

> **Built 2026-09-19 (r200): Stage A shipped as `qe24 extras on / off / lang` and
> is waiting on a run — rows T-16..T-19 in
> [`STATUS.md`](../../reference/sdk-0.24-qa/STATUS.md).** All four click actions
> were approved (notify, quest, mail, handbook), so §5 above is settled. Stage B
> starts only after those readings are in: the probe exists precisely because
> nothing in this repository has ever called `Menu`, `Desktop`, `ContextMenu` or
> `Localization`. Everything below is the plan as it was reviewed.

**Zeis picked the cheap wins from the r198 coverage audit:** the pack-level
surfaces that live outside a quest (menu entries, desktop widgets, right-click
items) and localization. This document is the plan; **nothing is built yet.**
Everything below that is not an SDK quotation was read out of this repository —
what it can emit today, and where the seams are.

## 1. What the SDK offers, verbatim

```ts
// Menu — ":3830"
MenuItem { id, label, icon?, section?: "top" | "bottom", onClick?: () => void }
Menu.addItem(item) / removeItem(id) / getItems()

// Desktop — ":3864"   (HTML widget in an iframe)
DesktopWidget { id, src, width, height, position?: {x,y}, transparent? }
Desktop.addWidget(w) / removeWidget(id) / getWidgets()
Desktop.isAppInstalled(app) / getInstalledApps()      // "Kisscord", by name

// ContextMenu — ":3916"
ContextMenuItem { id, label, icon?, target: "file"|"desktop"|"taskbar"|"window",
                  onClick?: (context) => void }
ContextMenu.register(item) / unregister(id) / getItems(target)

// Localization — ":4053"
Localization.register(language, strings) / registerAll(bundles) / t(key, vars)
Localization.language() / languages() / onLanguageChange(cb)
```

Two facts that shape the whole design:

- **`DesktopWidget.src` is a path to an HTML file relative to the mod root.** Our
  compiler already emits arbitrary files into the export zip
  (`CompiledFile { path, content, base64? }`, `compile.ts:152`), so shipping
  `widgets/<id>.html` is a few lines, not a new mechanism.
- **Every click handler is a JavaScript callback.** With no code in the editor,
  a click has to mean one of a small set of authored actions. That is the one
  real design decision here, and it is Zeis's (§5).

## 2. What the editor does today, and where this fits

- Project-level, registered once at load, already a pattern: **websites**
  (`websites` in `ProjectDocument`, `registerWebsite` in the runtime) and
  **Twotter accounts** (`twotterAccounts`). Menus, widgets and right-click items
  are the same shape, so they belong on the project document too — not as nodes.
- The three project-level UIs are TopBar dialogs (**Websites**, **Twotter**), so
  "Pack extras" can be a fourth, with the same layout language.
- **Localization has no seams at all yet.** Text is authored as literals
  everywhere; a translated pack needs `t(key)` *wherever the text is used*, and a
  quest's `Title` is read when the quest is registered (`index.d.ts:4062`), so
  registration has to happen before `RegisterQuest` runs.
- Permission: the manifest's `ModPermission` list is
  `filesystem | network | events | mail | bank | shell | ui`. The SDK does not
  document which namespace needs which, our compiler already adds `ui` for `UI.*`
  calls (`compile.ts:228`, `:204`), and the QA harness declares `ui`. **The probe
  settles it** rather than a guess.

## 3. Stage A — the probe first (harness only, no editor change)

No prior art exists in this repo for any of these four APIs, and the handbook,
the official transcriptions and the shipped mods say nothing about them. So the
first build is a harness command, one round, before any authoring exists:

```
qe24 extras on     # registers: a menu item (section "bottom"), a desktop widget,
                   # a right-click item on "file" and one on "desktop",
                   # and a two-language localization bundle
qe24 extras off    # unregisters all of it
qe24 extras lang   # prints language(), languages(), and t("qe24.hello") plus a
                   # missing-key readback t("qe24.absent")
```

The widget needs one shipped file, `mod/widgets/qe24-widget.html` — deliberately
loud (magenta background, "QE24 widget" in large text) so a screenshot is
unambiguous, the same standard the Twotter fixture met.

**What the tester reports — four readings, and what each decides:**

| Reading | Decides |
| --- | --- |
| Does the menu item appear, in the section asked for, and does clicking it toast? | whether `Menu.addItem` works at all in 1.3.1, and whether `section` ("top"/"bottom") is honoured |
| Does the widget render on the desktop at the given size/place, and does `qe24 extras off` remove it? | whether widget HTML ships and displays from a mod-root path — the whole `src` mechanism |
| Does our entry appear when right-clicking a **file** and empty **desktop** space? | whether `ContextMenu.register` works, and which `target` strings the game actually honours |
| `lang` output: `language()`, `languages()`, and whether `t("qe24.hello")` returns the translation (and the missing key echoes the key back) | the real language list to offer in the editor, and whether `t()` resolves in-game |

If a call is refused for permissions, the game's log will name it — that answers
the permission question with evidence (`ui` is already declared by the harness,
so a refusal means something else is wanted).

**Each probe reading becomes a QA row (T-16…T-19) in `STATUS.md`** with what to
look at and what to report, written the way the Twotter rows were: which mod,
which command, which screen, what to paste back.

## 4. Stage B — the editor build (after the probe)

### B1. "Pack extras" dialog (menus, widgets, right-click items)

A TopBar dialog beside **Websites**, with three lists on the project document:

| List | Fields | Emitted as |
| --- | --- | --- |
| **Start-menu items** | label, icon (optional), section top/bottom, and the click action (§5) | `Menu.addItem({...})` at load, `sortKey`-free |
| **Desktop widgets** | title (for the author's own list), width, height, position x/y, transparent, and the HTML | `widgets/<id>.html` in the zip + `Desktop.addWidget({ id, src, ... })` |
| **Right-click items** | label, icon, target (`file`/`desktop`/`taskbar`/`window`), and the click action | `ContextMenu.register({...})` |

Widget HTML is authored with the **same page editor the website builder uses**
(`websites/pageEditor.tsx` + `pageDoc.ts`): a widget is a page that happens to be
an iframe on the desktop, and reusing the editor is what makes this a cheap win
rather than a second HTML pipeline. A starter template (a heading and a line of
text) so an author is never looking at an empty box.

Registrations run **once, at load**, next to the website registrations — and only
when the pack uses them, so a project without extras compiles byte-identically to
today (the r84/r129 rule this codebase already follows).

### B2. Localization

Two pieces, and the second is what makes it cheap:

1. **A Languages dialog** — a table of keys × languages, plus the language list
   read from `Localization.languages()` where available (**the probe supplies the
   real list**; until then, the codes the game documents). Emitted as
   `Localization.register(lang, {...})` for each language, first thing at load.
2. **A `{{tr.…}}` token**, usable in **any** text field, resolved by the runtime's
   existing token filler (`fill(tpl, scope)` — the same machinery that already
   resolves `{{player.ip}}` and `{{data.x}}`). One function gains a branch; every
   authored text in the editor — mail subject and body, dialogue lines, WeeChat
   and Kisscord messages, notifications, objective text, tweet content — becomes
   translatable at once, with **no per-field UI and no schema change**.

Quest **titles and descriptions** are the special case: the game reads them at
registration, so they cannot go through the runtime filler. If the probe confirms
`t()` resolves at load, the compiler emits `t("key")` for a title that is a
reference rather than a literal. If that proves fragile, titles stay literal in
v1 and the limitation is documented — the token path alone still covers every
piece of text the player reads mid-story.

**Honest scope note (agreed with r167's earlier read):** this is the *cheap cut*.
It gives an author translations and a way to use them, and it does not attempt
per-language images, per-language website copy, or a translation-memory workflow.
Anything the probe breaks gets cut and said out loud rather than shipped on a
guess.

## 5. The one decision for Zeis: what a click does

The editor has no code, so each menu/right-click item picks **one** action:

| Option | The runtime calls | Reads as |
| --- | --- | --- |
| **Notify** | `UI.notify(...)` | "a toast" — the smallest possible thing, useful for a settings hint |
| **Start a quest** | `Quest.claim(name)` | the menu becomes a second way into a story (this is how a pack's story can be replayed) |
| **Send mail** | `Mail.send(...)` | a briefing landed in the inbox, authored like any other mail |
| **Open a Handbook page** | `Handbook.open(id, category)` | "read how this pack works" — pairs with the Handbook node that already exists |

**Recommended: all four, as a dropdown, with Notify as the default** — each is a
call the compiler already emits elsewhere, so the cost of four is close to the
cost of one, and they are the four things a no-code author plausibly wants from a
click. Say the word and any subset ships; mail/notify/claim are already built
plumbing, `Handbook.open` is the only new call.

## 6. Tests and fences (what gets falsified, per the standing rule)

- **Compiler fences:** a pack with no extras emits byte-identical output to
  today; an extras pack emits exactly one registration per entry, in a stable
  order; a widget emits its HTML file *and* its registration; every permission
  added is the one the SDK implies.
- **Localization:** `{{tr.key}}` resolves through `fill` (stub test), a missing
  key echoes the key rather than blanking (the SDK's own documented behaviour),
  and the registration block precedes every quest registration.
- **Editor:** the dialog round-trips through save/load and migration
  (`migrate.ts` gains optional empty defaults so old drafts are untouched).
- **Every guard gets reverted to prove it fails** — the standing rule, and the
  reason two lying fences were caught in r185's sweep.

## 7. What this deliberately is not

Phone apps, dynamic HTTP endpoints, interception, themes, tours and per-pack
settings stay where the audit put them. If the cheap wins go well, phone apps are
the next one to probe — the audit's recommendation, unchanged.

## 8. Order of work

1. Stage A probe + STATUS rows → Zeis runs it → readings recorded.
2. B1 pack extras (the three registrations + widget HTML reuse).
3. B2 localization (registration + the `{{tr.}}` token, then titles if green).
4. A round closes each stage with the usual gates, version bumps and a handoff.
