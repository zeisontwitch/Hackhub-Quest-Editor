# QE SDK 0.24 Editor QA Scaffold

Evidence-only project for SDK 0.24 in-game verification: native Wi-Fi, HTTP/curl events, the Timer node delay and calendar modes, the Twotter node (accounts, backdated series, cleanup), and the pack extras (start-menu entry, desktop widget, right-click entries, translated words). Nothing auto-starts - claim one quest at a time with the harness command qe24 run - so a tester sees one row's noise, not five.

## Install (no coding needed)

1. Copy this whole folder into the game's `mods/` directory.
2. Start HackHub — the mod loads from `dist/mod.js`.

## Rebuild (optional, for programmers)

`src/index.ts` is the same code as `dist/mod.js`. With Node 18+:

```
npm install
npm run build
```

## What the editor compiled for you

- Quests: QESdk024EditorQa, QESdk024TimerQa, QESdk024TimerCalQa, QESdk024WaitMonthQa, QESdk024TwotterQa, QESdk024TwotterShareQa, QESdk024TwotterPostEventQa, QESdk024MailAuthoringQa
- Websites: qe24-website.test
- Permissions requested: network, mail, events, ui

## Notes

- QE SDK 0.24 editor QA: nothing can start this quest. It does not start automatically and it is not advertised on the Hackhub feed, so the player has no way to claim it. Turn on “Start automatically” in the quest's Behaviour settings, or give it a feed post.
- Timer QA (S-01/S-02/S-03): nothing can start this quest. It does not start automatically and it is not advertised on the Hackhub feed, so the player has no way to claim it. Turn on “Start automatically” in the quest's Behaviour settings, or give it a feed post.
- Timer QA (calendar: S-05/S-06/S-07/S-13): nothing can start this quest. It does not start automatically and it is not advertised on the Hackhub feed, so the player has no way to claim it. Turn on “Start automatically” in the quest's Behaviour settings, or give it a feed post.
- Timer QA (Wait in months: S-14, S-09): nothing can start this quest. It does not start automatically and it is not advertised on the Hackhub feed, so the player has no way to claim it. Turn on “Start automatically” in the quest's Behaviour settings, or give it a feed post.
- Twotter QA (T-08/T-09/T-10/T-11/T-13): nothing can start this quest. It does not start automatically and it is not advertised on the Hackhub feed, so the player has no way to claim it. Turn on “Start automatically” in the quest's Behaviour settings, or give it a feed post.
- Twotter QA (T-12: two quests, one account): nothing can start this quest. It does not start automatically and it is not advertised on the Hackhub feed, so the player has no way to claim it. Turn on “Start automatically” in the quest's Behaviour settings, or give it a feed post.
- Twotter QA (T-13: does Twotter.Post ever fire?): nothing can start this quest. It does not start automatically and it is not advertised on the Hackhub feed, so the player has no way to claim it. Turn on “Start automatically” in the quest's Behaviour settings, or give it a feed post.
- Mail authoring probe: the player claims this one from its Hackhub feed post — nothing in it runs until they do. Turn on “Start automatically” in the quest's Behaviour settings if it should begin the moment the mod loads.
- QESdk024EditorQa: “Create Wi-Fi” exports as a native access point in HackHub 1.3.0+. Current QA found one game display wart: Bettercap may show no network name after targeting the AP by BSSID, but scanning, joining and cracking still worked.
- QESdk024MailAuthoringQa: “QE24 authoring: reply to me” lets the player reply. The mail goes out with its reply flag and the Reply button draws (proven in game, 2026-09-20). The player's reply arrives addressed to your From address “qa-reply@qe24.test” — to react to it, trigger on the Mail.Sent event where “to” contains that address; a reply carries no reference to the mail it answers.
- qe24-website.test: 1 unlisted page (/hidden/result). Nothing links to it and the in-game search will not show it, so the player reaches it only by typing the address or by running dirhunter on the host — which is exactly what makes a good hiding place for a clue. If you meant this to be findable normally, turn on “Listed in search” for the page.
<!--
Hand-maintained. `npm run gen:qa-export` appends this file to the compiled
README.md, and the guard test (`src/compiler/__tests__/sdk024QaExport.test.ts`)
fails when that concatenation drifts. Everything else in this folder is
generated output: edit the project, then re-run the generator.
-->

## What is in this build

Two quests auto-start on load:

- **`QESdk024EditorQa`** — the r166 surface: native Wi-Fi (`QE24-LAB-5G`) and the
  HTTP/browser events for `http://qe24-website.test/` (`/`, `/echo`, `/hidden/result`).
  The steps and the known results are below.
- **`QESdk024TimerQa`** — the r172/r173 **Timer** node (delay mode), rows S-01…S-03.
  The calendar modes (`In N days at a set time`, `On a specific in-game date & time`)
  are not baked into this export — a fixed date in a committed file would be in the
  past by the time it is played. Make that edit in the editor before exporting, or
  run the S-04 clock comparison from `../README.md`.

### `QESdk024TimerQa` — S-01…S-03

| Row | What to do | Green means |
|---|---|---|
| S-01 | Load the save and watch. Timer A is 2 in-game minutes — about 2 real seconds at the default 60× clock. | The mail **Timer A arrived (S-01 green)** and the **Timer A fired** toast appear. |
| S-02 | Save and reload before Timer B (2 in-game hours) is due. | **Timer B fired** appears after the reload: the job survived the save. |
| S-03 | Complete or abandon the quest first, then let Timer B's time pass. | Timer B never fires. The console logs `timer missed` when the job comes due while the quest is not active. |

The lines to quote in a report are the ones in the log file
(`%APPDATA%/Roaming/hackhub/log`, search it for `quest-editor`): `timer node … armed for …`,
`timer … fired`, `timer missed: quest …`, `cancelled N pending timer(s)`.

### Pack extras — T-23…T-27 (export 1.0.29, editor build r204)

**Install** (as usual, both folders): this export's own folder
(`reference/sdk-0.24-qa/editor-export/`) **and** the harness
(`reference/sdk-0.24-qa/mod/`, v1.0.21). Copy each folder whole — the `widgets/`
folder inside this export IS the widget, and a copy without it shows an empty box.
Then load a save.

**Order matters**: look at everything first. Nothing here is removed by a command —
the extras belong to the export and stay until the mod is switched off in the Mods
list and the game is launched again. In particular:

> **Do NOT run `qe24 extras off` for these rows.** That command removes the HARNESS's
> own probe items, not the export's. Run it and the five things below are still
> exactly where they were, so it only costs you a run.

| Row | What to do | Green means |
|---|---|---|
| T-23 | Open the start menu and look along the **bottom strip**, below the app list. Then click the entry. | `QE24: extras check` is there, and clicking it shows the notice `The pack's own menu entry works (T-23).` — the English words come from the pack's translation table, not from a baked string. |
| T-24 | Look at the desktop, upper left, at 40,40. | A 320×180 box with its **own dark background all the way to its edges**, reading `QE24 extras widget`. That is the new default: the editor sends "not see-through" unless the author turns the switch on. A box with no background at all would mean the switch arrived as see-through. |
| T-25a | Right-click a file (any file on the desktop or in a folder). | `QE24: inspect this file` is in the menu; clicking it shows `Right-click on a file works (T-25a).` |
| T-25b | Right-click an empty part of the desktop. | `QE24: desktop action` is in the menu; clicking it shows `Right-click on the desktop works (T-25b).` |
| T-26 | Switch the game's language to **German** (Deutsch), then look at the start menu and right-click on a file and on the desktop. Switch back to English afterwards. | The labels and the notices are German: `QE24: Extras-Prüfung`, `QE24: diese Datei prüfen`, `QE24: Desktop-Aktion`. The labels **change as you switch, without a reload** (the pack hands them over again when the language changes). In English they are English again. A label showing `{{tr.…}}` itself means the translation did not arrive. |
| T-27 | In German: `qe24 run extras` (or claim `QESdk024ExtrasQa` by hand), then read the journal entry's title. | The title is `QE24 Extras-Prüfung` in German and `QE24 extras QA` in English. **This is the row that matters most**: a quest's title is read while the quest is registered, so it can only follow the language the game was in **when the save was loaded** — switching afterwards leaves the title as it was (the journal entry cannot be rewritten). So: set the language to German first, then load the save, then run this row. |

### What the first run of these rows found (2026-09-19) — and what to do about it

**Green:** the desktop widget (T-24) drew with its own background, and both
right-click entries (T-25a/b) appeared in the right places.

**The click did nothing (T-23) — and the log is the only thing that can say why.**
Note that the entry *was* in the start menu: registration works. Two things can
make a click look dead — the game never calling us, or our own message API
drawing nothing — and they need opposite fixes. So this build **writes one line
to the log the instant a click arrives**, before it tries to show anything, and a
second line saying which API showed it (or that none did).

**Which API to trust is an open question now.** Every notification this project
has ever *seen* in game came from a **toast**. The SDK declares a separate
`UI.notify` for "a notification popup", it is what the editor's own *Notify* node
uses by default — and nobody has ever reported one appearing. `qe24 extras say`
settles it with two looks.

**Nothing translated (T-26).** The labels were handed over once, when the mod
loaded, with the game in English — and the SDK is explicit that text read once and
kept does not update by itself. That is what its `onLanguageChange` hook is for,
and this build now uses it: change the language and the labels are handed over
again, in the new words, without a reload.

### What the second run found (2026-09-19) — the click arrives, and is then refused

**A — both UI calls draw.** `qe24 extras say notify` produced *System
Notification - qe24 notify marker*; `say toast` produced *Info - QE24 toast
marker*. So **`UI.notify` works**, and the earlier suspicion that the editor's
default Notify variant might be silent is dead. The two popups look the same
apart from their heading.

**B/C — the click reaches the pack, and the call is refused.** The log, quoted by
the tester:

```
[quest-editor] extras: menu item "qe24-menu-extras" clicked (language en)
[quest-editor] extras: UI.toast threw: [ContentSDK] Mod "null" tried to use UI.toast without "ui" permission. Add "ui" to the permissions array in your manifest.json.
[quest-editor] extras: UI.notify threw: [ContentSDK] Mod "null" tried to use UI.notify without "ui" permission. ...
[quest-editor] extras: said "qe24.menu.message" via nothing - this build has no UI API
```

...and the same three lines for each right-click item. **The manifest is not the
problem**: this export lists `"ui"` in its permissions, and in the *same session*
its quest code showed a `UI.notify` without complaint (row F). The refusal names
the mod as **`null`**, so the permission check cannot tell *which mod* is calling
from a menu/context-menu handler. Written up as **Q14** in
`docs/03-questions-for-the-developers.md`; the editor now prints that explanation
in the log when it sees the refusal, because "add `ui` to your manifest.json"
sends the reader to a file that is already correct.

**The unfilled token is the same bug, not a second one.** The message line reads
`said "qe24.menu.message"` — the *key*, not the sentence. Our runtime shows the key
when the game's `Localization.t(key)` gives back nothing, and that key is
registered in both `en` and `de` while the log on the same line says
`(language en)`. Registration-time lookups work (row F, and row G's labels), so a
click handler cannot see the mod's own translations either — same shape as the
refused permissions. Row H reports this too.

**F — green.** With the game in German and the save reloaded, `qe24 run extras`
gave a German notification and a German quest title. The one field read at
registration is translated correctly.

**E — not possible as written.** A language can only be switched from the main
menu, which unloads the save and the mod with it. The live re-registration code
stays (it is what the SDK documents, and it costs nothing), but the row has to be
run the way the game actually works: **switch, then reload, then look** — row G.

### What the third run found (2026-09-19) — the click has to be handed to the engine

**G — green.** German session, save reloaded, and the start menu and both
right-click menus read `QE24: Extras-Prüfung`, `QE24: diese Datei prüfen`,
`QE24: Desktop-Aktion`. Nothing showed a raw `{{tr.…}}` token, so the translation
table is there before the labels are handed over.

**H — the answer the round was waiting for.** The probe's report, verbatim:

```
click arrived
SharedVariables.set (no permission) - WORKED
UI.notify (ui permission) - refused: [ContentSDK] Mod "null" tried to use UI.notify without "ui" permission. ...
UI.toast (ui permission) - refused: [ContentSDK] Mod "null" tried to use UI.toast without "ui" permission. ...
Mail.send (mail permission) - refused: [ContentSDK] Mod "null" tried to use Mail.send without "mail" permission. ...
Quest.claim (the claim action) - refused: [ContentSDK] Mod "null" tried to use Quest.claim without "events" permission. ...
Scheduler.schedule (defer to the engine) - WORKED
DEFERRED UI.toast (from a scheduler job) - WORKED
DEFERRED UI.notify (from a scheduler job) - WORKED
deferred job fired: yes
```

Read together: from a click, **every** gated call is refused — including
`Quest.claim`, which the editor's claim action needs — while the same calls made
from a one-millisecond `Scheduler` job all work. So the engine can hand the mod's
identity back, and the fix is to stop doing the work in the click at all.

**The editor's runtime does exactly that now** (r206): a click writes its log line,
hands the action to the engine (`Scheduler.schedule`, kind
`qe/<mod id>/click`), and the action runs in the engine's callback a moment later.
The log says so in both halves:

```
[quest-editor] extras: menu item "qe24-menu-extras" clicked (language en)
[quest-editor] extras: handed menu item "qe24-menu-extras" to the engine (job click-1) ...
[quest-editor] extras: the engine called back for menu item "qe24-menu-extras" (language en) - running it here, where the mod has a name
[quest-editor] extras: said "Der eigene Menüeintrag des Packs funktioniert (T-23)." via UI.toast
```

The last line is the other half of the r205 mystery: the click logged the raw key
(`qe24.menu.message`) because a click cannot see the mod's translation table
either. From the callback the sentence is back — visible in the line above,
in German, without any change to the project file.

Q14 stays open for the developers: this is a workaround for the pack's own
actions, not a fix for the game.

### What the fourth run found (2026-09-19) — three answers, one of them a bug of ours

**The deferred click path works.** Row J's log, verbatim:

```
[quest-editor] extras: menu item "qe24-menu-handbook" clicked (language de)
[quest-editor] extras: handed menu item "qe24-menu-handbook" to the engine (job click-4) - a click has no mod identity, so the work runs in the engine's callback instead
[quest-editor] extras: the engine called back for menu item "qe24-menu-handbook" (language de) - running it here, where the mod has a name
[quest-editor] extras: opening handbook article Port Forwarding: Start Here
```

Exactly the order the fix promises, in German, with the engine's callback doing
the work. **J green, K green** — the toast read *Der eigene Menüeintrag des
Packs funktioniert. (T-23)*, the sentence rather than the raw token, which is the
translation table being reachable again from the callback.

**Mail green.** `schick mir einen Brief` delivered a letter.

**Claim did nothing — and that was our bug, not the game's.** Row I's second
entry produced no journal entry and no popup. The action was claiming by the
editor's own document id (`qe-x1`); `Quest.claim` takes the **name the game knows
the quest by** (`QESdk024ExtrasQa`), which is what the harness has always used and
what the runtime's own "unclaim a quest" node uses. The game does not say a word
about an id it does not recognise — so the click looked dead. **Fixed in r207**:
the compiler resolves the author's pick to the engine's name at export, the
runtime logs `claiming quest <name>`, and an action whose quest is gone says
so instead of doing nothing.

**Handbook opened, but at its landing page** — not the article. The id we send is
the page *title*, which was a guess, and the guess is now disproved. Nothing in
the build accepts or rejects it: the call succeeds, the handbook opens at the
top, no error anywhere. Filed as **Q15** (what are the article ids, or at least
say when one is unknown), and the editor no longer pretends the page is reached —
the log, the node's help text and the picker all say what really happens.

### What the fifth run found (2026-09-19) — six rows, six greens, nothing left open

| Row | Verdict |
| --- | --- |
| L | **Green.** The claim entry puts `QE24 Extras-Prüfung` in the journal (with no objectives, which is what that quest has). The bug was ours: `Quest.claim` needs the game's name for the quest, not the editor's id. |
| M | **Green, exactly as predicted.** The handbook opens on its own landing page, and the log says so: `opening the handbook at article "Port Forwarding: Start Here" - the game lands on its own landing page (see Q15)`. Not a failure — the game's, filed as Q15. |
| N | **Green.** `Right click on a file works. (T-25a)` — the file right-click entry draws. It had never drawn anything: the r204 refusals hit it like the menu item, and the r206 fix had not been tried on a context-menu click. |
| O | **Green.** `Right click on desktop works. (T-25b)`. |
| P | **Green.** The mail entry shows a **purple square** before its label — so the editor's picture field works, and a picture picked in the editor reaches the start menu. The field is now a file picker (it used to be a text box asking for the picture's written form, which no author could reasonably produce). |
| Q | **Green.** With the game in French — a language this pack has no words for — the entries fall back to the **English** labels, not raw tokens. |

That closes the pack extras: every surface an author can put outside a quest has
now been seen working in game, in two languages, with the fallback checked.

### Fifth run — ONE session, six rows, one install

Install **export 1.0.33**. The harness is **unchanged at 1.0.23** — if it is
already installed, leave it alone. Nothing here needs a fresh save, and rows
L…P are a single German session: click the things, look, write **one line per
row**. Paste the log only where a row says so. Row Q is last and optional.

**All six are answered — nothing here needs running again.**

| # | What to do | What to write down |
|---|---|---|
| L | Click **`QE24: Extras-Quest annehmen`**, wait two seconds, open the quest journal. | Is the quest **`QE24 Extras-Prüfung`** in it? If not, the log line `[quest-editor] extras: claiming quest QESdk024ExtrasQa` — that tells me whether we sent the right name. |
| M | Click **`QE24: Handbuchseite öffnen`**. | **Expected, not a failure:** the handbook opens on its own landing page rather than a page. I only need the log line `opening the handbook at article "…" - the game lands on its own landing page (see Q15)`. |
| N | Right-click a **file** and click **`QE24: diese Datei prüfen`**. | A toast — `Right-click on a file works (T-25a).` This one has never drawn anything: in the r204 run it was refused inside the click like the menu item, and the fix that made the menu entries work applies to right-click entries too. Nothing at all would be news. |
| O | Right-click the **desktop** and click **`QE24: Desktop-Aktion`**. | Same, for the desktop target: `Right-click on the desktop works (T-25b).` |
| P | Look at the start-menu entry **`QE24: schick mir einen Brief`** — do not click it, just look. | Does the entry show a small **purple square** before its label? That entry is the first thing the editor has ever put in the `icon` field, so "yes, a square" means the field works as a picture pasted into it, and "no, and no error" means I should take the field back out until we know what the game wants there. |
| Q | **(optional, last)** Switch the game to **Français** (any language the pack has no words for), reload the save, look at the start menu. | Do the labels show **English** words (`QE24: extras check`) — the fallback working — or raw `{{tr.…}}` tokens, which would mean a French player sees gibberish? Then switch back to German. |

**Two things not to test here, because the pack cannot do them:**

- The widget's own text is a plain file — `{{tr.…}}` is NOT filled inside it. Only
  the pack's fields (labels, messages, quest titles) go through the translation
  table. Write the widget's words in whatever language you want it to show.
- The start-menu strip is the only place menu entries appear. The editor never
  sends a "top" or "bottom" choice, because the game ignored that field in the
  r200/r201 probe — entries land in the bottom strip.

## Export history

| Export | Editor build | Result |
|---|---|---|
| 1.0.41 | 2026-09-21.r217 | **The blank comment author stops shipping.** The r216 retest failed clean (asset extracted, zero data-URIs, post still absent); the diagnosis cleared the log's two recurring lines (API v1 compat notice, held `Queue.HandleQuestHackhubPosts` — both in every session on file, vanilla included) and landed on a contract violation of ours: the SDK types require `author.name` on every comment, and both never-surfacing quests emitted an empty author object for a blank commenter. r217 omits the author entirely when the name is blank (an avatar cannot ride without a name, post- and comment-level), withdraws the editor's "leave blank for a generated name" placeholder on commenters, surfaces the quest's internal id with a confirmed reset, and files docs/03 §19 (API v2) + §20 (blank comment personas). Same quest set; runtime + stamp changed. |
| 1.0.34 | 2026-09-19.r208 | **No functional change** — the build stamp inside the packed mod. The editor round behind it: the picture on a menu entry is now a file picker (a text box asking for a picture's written form was not something an author could use), and the handbook has the page this feature owed. Rows L…Q were all green on 1.0.33, so nothing here needs reinstalling. |
| 1.0.33 | 2026-09-19.r207 | **One batch, six rows.** No runtime change: the mail entry grew an **icon** (a small purple square as a data URL) so the editor's `icon` field can be judged in game, since nothing has ever exercised it. Rows L…Q are the rest of the open questions — the claim fix (L), the handbook's honest log line (M), the two right-click actions, which have never drawn anything (N/O), the icon (P) and the language fallback (Q). |
| 1.0.32 | 2026-09-19.r207 | **The claim action claims by the game's own name for the quest.** Row I of the r206 run found the click doing nothing: the action sent the editor's document id, which `Quest.claim` does not know, and the game says nothing about an id it does not recognise. The compiler now resolves the author's pick to the quest's name at export (`QESdk024ExtrasQa` here), which is what the harness command and the unclaim node have always used. Nothing else changed except the handbook's log line, which now says the game lands on its own landing page (Q15). |
| 1.0.31 | 2026-09-19.r206 | **A click no longer does its own work.** From a click every gated call is refused (Q14), so the action is handed to the engine (`Scheduler.schedule`, kind `qe/<mod id>/click`) and runs in its callback, where the mod has a name and the translation table is back. Three new start-menu entries — claim the extras quest, send a mail, open a handbook page — so every action kind can be clicked in game. |
| 1.0.30 | 2026-09-19.r205 | **The refusal is explained, not guessed at.** When the game refuses a message from a click, the runtime now logs that the manifest is not the problem (the message the game prints sends authors to a file that is already correct) and points at Q14. Nothing else changed in the compiled content. |
| 1.0.29 | 2026-09-19.r204 | **The click is now visible in the log, and the labels follow a language change.** Every extras click writes a line before it does anything, and the line after it names the API that showed the message — because the r203 run could not tell a dead click from a message API that draws nothing. Messages now go out through `UI.toast` first (the one every notification QA has ever seen) with `UI.notify` as the fallback. `Localization.onLanguageChange` re-registers the menu and right-click labels when the player switches language, so the words follow without a reload; a widget's own file cannot, and is left alone. |
| 1.0.28 | 2026-09-19.r203 | **The pack extras, from the editor.** One start-menu entry, one opaque desktop widget (`widgets/qe24-extras-widget.html`), two right-click entries, and a translation table with English + German — plus a new quest, `QESdk024ExtrasQa` (alias `extras`), whose **Title is `{{tr.qe24.quest.title}}`**: it is the row for the one field the game reads at registration. Nothing auto-starts; the extras surfaces are there from load. |
| 1.0.27 | 2026-09-18.r202 | **Stamp only** — the round closed the pack-extras probe (all four APIs green) and starts Stage B. The compiled quests are unchanged. |
| 1.0.26 | 2026-09-18.r201 | **Stamp only** — the round is the second pack-extras probe (three menu items, two widgets); the compiled quests are unchanged. |
| 1.0.25 | 2026-09-18.r200 | **Stamp only** — the round is the harness's pack-extras probe (Stage A of the cheap wins); the compiled quests are unchanged. |
| 1.0.24 | 2026-09-18.r198 | **Stamp only** — a docs round (the SDK coverage audit, and the phone-proxy row dropped). Nothing in the compiled quests changed. |
| 1.0.23 | 2026-09-18.r196 | **Stamp only.** The round closed with every row green or resolved (T-11b abandon and T-15c last); nothing in the compiled quests or the runtime changed. |
| 1.0.22 | 2026-09-18.r195 | **Comments only, and the last of the uninstall story.** The runtime now states the measured edges: disabling the mod in the Mods list makes the game unload the package at the next start (`removeUser(qe-tw-account) -> true (mod unloaded)`, the account gone afterwards — T-15c green), a plain quit calls no hook (nothing to clean), and a mod deleted from disk while the game is closed can never run mod code — the one leak, filed as question 11. |
| 1.0.21 | 2026-09-18.r194 | **Comments only.** The runtime's three notes about uninstalling claimed that "uninstalling removes what the mod declares"; measured 2026-09-19, it does not — the game never calls `OnModPackageUnloaded` on a plain quit, and it cannot for a mod deleted from disk. The comments now say what was measured (`QE24-TestResults-Twotter-6.md`). No behaviour changed, so 1.0.20 runs the T-15c disable test exactly as well. |
| 1.0.20 | 2026-09-18.r193 | **The export announces itself, so a silent non-load cannot be mistaken for a broken feature.** It writes a session marker (`qe.export.loaded` in `SharedVariables`) when it loads and removes it on unload; the harness then prints `Editor export: loaded (v…)` or `NOT LOADED in this session` from `qe24 run` and `qe24 twotter audit`. This exists because the game can keep a mod **disabled** across a version change, a folder deletion and a fresh save — two tester sessions were lost to exactly that on 2026-09-19 (game bug; question 13). Nothing about the compiled quests changed. |
| 1.0.19 | 2026-09-18.r191 | **Documentation only — the compiled quest content is identical to 1.0.18 apart from this build stamp.** The row it exists for, T-15c, needs no new mod code: the QA notes now name the file the cleanup line lands in (the game's `HACKHUB LOG FILE`, searched for `[quest-editor]`) instead of saying "the console", and spell out the two readings. Install it fresh if that is easy; if 1.0.18 is already in the Mods folder, run the row with it. |
| 1.0.18 | 2026-09-18.r190 | **Build stamp only; the compiled quest content is unchanged.** The round fixed the editor's *Graph paper* canvas grid, which rendered exactly like *Squares*: the style stacks two of the library's background layers, both defaulted to the same pattern id, and every `fill="url(#…)"` resolved to the first pattern (the library's own docs require a unique `id` per layer). Editor-side, invisible to an exported mod. |
| 1.0.17 | 2026-09-18.r189 | **Editor-side wording only; the compiled quest content is unchanged.** An author asks what the game fills in for them the moment a blank picture sits in front of them, so the editor now says it: the blank banner and both picture tooltips state that the game draws its own, a **blank display name** gets the same nudge a broken handle gets, and the panel spells out what travels as written (name, handle, bio, counts) versus what the engine owns (the two pictures, the id, the join date, the password). The export version moved only because the build stamp inside it did — the folder you install and the editor you read must not disagree. |
| 1.0.16 | 2026-09-18.r188 | **The tweet-picture control goes, and the Twotter node gets a face.** The picture upload is hidden — SDK 0.24's `TwotterTweet` has no picture field and the r185 run saw no picture anywhere in the feed (question 10 of `docs/03-questions-for-the-developers.md`) — and the QA fixture's banner/avatar became unmistakable colours (**#AA28FF** violet / **amber**) for row **T-08b**, with the six-weeks tweet keeping its age and losing its picture. Stage 2 (the click-to-edit mock profile, the timeline preview, the shimmer) is editor-side only; the compiled quest content is unchanged apart from this build stamp. |
| 1.0.15 | 2026-09-18.r186 | **The three bugs the first in-game run found, fixed.** The quest-start hook never ran, "live" counted quests that had never started (so a shared account could be removed while another quest still needed it), and a posting guard outlived its quest so a re-claimed quest never posted again. The `Twotter.Post` canary got a quest of its own (T-13: the Complete button needs every objective done), and the tweet picture is sent under both key names the API might read. Superseded the same day by 1.0.16. |
| 1.0.14 | 2026-09-18.r185 | **The Twotter editor rows (T-08…T-15) became runnable.** The backdated five-tweet series, the two quests that share one account (T-12), the two event triggers (T-13) and the authored avatar/banner were added, and every QA quest stopped auto-starting. This is the build the 2026-09-18 run was made on, and the one T-11 failed on. |
| 1.0.13 | 2026-09-18.r185 | **The Twotter node is rebuilt on the API path** (stage 1 of the r185 plan): mod-level accounts created with `createUser` + `addUser`, a series of tweets each with its own time, cleanup on complete/abandon/uninstall, and the migration that lifts a pre-r31 draft's tweets instead of dropping them. First build whose export can carry the editor's own Twotter output. |
| 1.0.12 | 2026-09-18.r184 | **Build stamp only — the QA ledger is closed.** No editor behaviour changed; the Timer rows finished (S-11 green, S-10 shelved by Zeis's decision) and the r183 row-fold fix was confirmed visually ("nicely responsive when pushing or pulling the inspector drawer"). The next round is the Twotter re-integration, planned in `docs/plans/r185-twotter-return.md`.
| 1.0.11 | 2026-09-18.r183 | **Build stamp only, for the inspector row fix** — the Timer's four-box "In" row used to run off the right edge of the 340px docked inspector; it now folds to two columns below the width its unit captions need and opens back up when the panel is dragged wider. Exported mods are unaffected (this is editor layout).
| 1.0.10 | 2026-09-18.r182 | **The end-of-quest cancel line stops overstating itself.** A timer that had already fired stayed in the mod's pending list, so completing or abandoning the quest logged "cancelled 2 pending timer(s)" with only one left (seen during S-03). Fired jobs are dropped as they fire, so the count matches reality. No behaviour change otherwise.
| 1.0.9 | 2026-09-18.r181 | **No quest auto-starts, and no QA debug node toasts.** The 2026-09-18 Timer run became a notification storm — five auto-starting quests on top of what an earlier build had left claimed — so every quest here is now claimed on demand from the harness: `qe24 run`. The quests and their contents are unchanged otherwise.
| 1.0.8 | 2026-09-18.r180 | **Two new auto-start quests for the Timer rows.** `QESdk024TimerCalQa` fires an exact date already past and a coming day already past today (both must fire at once), then arms a mixed `1 month 2 weeks 2 days at 18:23` row; `QESdk024WaitMonthQa` fires a 1-minute Wait (the `schedule` path) and then arms a `Wait 1 month` (the `scheduleAt` path, because months have no duration field). The far-away rows are checked with `qe24 timers` (raw harness 1.0.10) rather than waited out. The r166 surface and `QESdk024TimerQa` are unchanged.
| 1.0.7 | 2026-09-18.r179 | **Build stamp only.** No editor behaviour changed; the Twotter probe lives in the raw harness (`mod/`, 1.0.9), not in this export, because the editor cannot author Twotter yet.
| 1.0.6 | 2026-09-18.r178 | **Regenerated after S-04 was answered.** The `at` mode's timezone correction is confirmed correct in game (the clock displays the machine's local time), and the emitted source comment now says so instead of holding the question open. No behaviour change.
| 1.0.5 | 2026-09-18.r177 | **Regenerated for the r177 Timer.** One box per unit on both relative rows: a coming day counts years/months/weeks/days from now and pins a clock time, Wait takes every unit (calendar included, through `scheduleAt` because the engine's duration form has no month field). The arm log names the rule in the author's units. Delay-mode quests behave exactly as before — S-01…S-03 stay valid.
| 1.0.4 | 2026-09-18.r176 | Regenerated for the r176 Timer (relative amount + unit, short months clamped). Superseded by 1.0.5 the same day. |
| 1.0.3 | 2026-09-17.r175 | **Regenerated, awaiting a pass.** First build to carry `QESdk024TimerQa`; fixes the r166-era README claim that the export held one quest. |
| 1.0.2 | 2026-09-16.r166 | Tested on HackHub 1.3.0 / Steam build 25341308 — results below. |

### 1.0.2 results (editor surface only, no Timer quest)

- Startup mail and debug toasts appeared on a fresh save, after the `ui` permission
  was added for toasts.
- Wi-Fi passed: connecting to `QE24-LAB-5G` checked both Wi-Fi objectives, the BSSID
  matched `02:24:00:00:24:02`, and a reload left exactly one `QE24-LAB-5G`.
- HTTP did **not** pass: `http://qe24-website.test/` and `/echo` loaded, but neither
  the `http-request` nor the `http-response` objective ticked. Static website hosting
  works; editor-generated SDK HTTP event objectives stay fenced until SteelWaffe
  clarifies the static-site event semantics.
- DNS-only collaborator lookups (`nslookup <subdomain>.qe24-collab.test`) return
  `No results found` and produce no collaborator history entry in this build.
