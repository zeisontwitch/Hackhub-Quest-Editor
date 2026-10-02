# Questions and bug reports for SteelWaffe — HackHub 1.3.0 / SDK 0.24

Date opened: 2026-09-16<br>
Game evidence: HackHub `1.3.0`, Steam App ID `2980270`, Steam build `25341308`<br>
SDK evidence: `@hotbunny/hackhub-content-sdk@0.24.0` from `package.json`, `package-lock.json`, and `node_modules/@hotbunny/hackhub-content-sdk/index.d.ts`.

This is the fresh developer-facing list after the SDK 0.24 QA pass. The previous long-running questions document has been archived at:

- `docs/archive/r166-questions-for-the-developers-archive.md`

Detailed in-game evidence lives in:

- `docs/plans/r166-sdk-0.24-ingame-qa.md`
- `reference/sdk-0.24-qa/QE24-TestResults - 3.md`

## Current summary

The raw SDK 0.24 harness is green for the core non-curl surfaces we tested: `Http.fetch`, Browser HTTP through a registered host, Browser interception, Browser collaborator hits, Scheduler/Time, quest completion/retire/unclaim, raw native Wi-Fi creation/connect/disconnect/reload, abandon, and reset/reseed. The editor-generated Wi-Fi scaffold is also green for startup mail/toasts, BSSID, connect/disconnect objectives, and reload stability.

Open issues/questions below are therefore mostly about just-released SDK/game edge cases, not presumed editor bugs. Until each item is answered or retested, the editor keeps the relevant author-facing feature fenced or documents the runtime wart.

---

## 1. Terminal `curl` appears unavailable in build 25341308

**Observed.** Patch notes/SDK 0.24 work made us expect a terminal `curl` command, but the in-game terminal returns command-not-found:

```text
curl http://qe24-http.test/
Command "curl http://qe24-http.test/" not found.
```

The same happened for collaborator URLs. Browser requests against the same hosts worked, and the raw harness saw Browser-origin HTTP/interception/collaborator events.

**Question.** Is `curl` supposed to be available in HackHub `1.3.0` build `25341308`? If yes, is it gated behind an app/package/tutorial state, or is the missing command a game bug? If no, should the SDK docs/events describe Browser and `Http.fetch` only until a later build?

**Editor stance.** Keep terminal-curl authoring fenced. Browser and server-origin HTTP can be reasoned about separately, but anything that specifically asks the player to run `curl` is blocked in this build.

---

## 2. Bettercap `set wifi.ap <BSSID>` prints `SSID: undefined` for SDK-created APs

**Observed.** The raw harness creates the AP with the SDK-declared fields:

```js
Network.createWifiNetwork({
  ssid: "QE24-RAW-5G",
  bssid: "02:24:00:00:24:01",
  channel: 44,
  wps: true,
  ...
});
```

`Network.getWifiNetworks()` / `qe24 status` sees those fields correctly:

```text
Target Wi-Fi details: QE24-RAW-5G ip=189.65.179.242 bssid=02:24:00:00:24:01 channel=44 wps=true signal=3 rssi=-53
Connected Wi-Fi: QE24-RAW-5G ip=189.65.179.242 bssid=02:24:00:00:24:01 channel=44 wps=true signal=3 rssi=-53
```

But Bettercap targeting by BSSID logs:

```text
Target AP set to 02:24:00:00:24:01 (SSID: undefined)
```

Despite that display bug, deauth captured a handshake and hashcat recovered the password:

```text
Handshake captured: /home/Zeis/qe24-raw-5g.pcap
```

**Question.** Is Bettercap's BSSID-to-SSID lookup missing the SSID for mod-created APs, or is `createWifiNetwork()` expected to populate another field for Bettercap? The pcap filename suggests some runtime path still knows the SSID.

**Editor stance.** This is not big enough to block exposing the native Wi-Fi node because the AP appears, connects, survives reload, and can be cracked. We should document the Bettercap display wart and send this upstream.

---

## 3. DNS-only collaborator lookup does not produce a collaborator hit

**Observed.** Browser collaborator callbacks work, but a DNS-only lookup does not resolve and does not add a collaborator hit:

```text
qe24 collab
Open in Browser: http://cwejw2ox.qe24-collab.test/qe24

nslookup cwejw2ox.qe24-collab.test
No results found.

qe24 history
Collaborator hits: 3
- http zs5gcawf.qe24-collab.test/qe24 method=GET ...
# no new dns hit
```

**Question.** Is `Http.CollaboratorHit` intended to support DNS-only callbacks in SDK 0.24, or only HTTP callbacks? If DNS-only callbacks are intended, should `registerCollaborator()` also make `nslookup <minted-subdomain>` resolve/log a `kind: "dns"` hit?

**Editor stance.** Keep DNS-only collaborator authoring fenced. Browser HTTP collaborator evidence is green.

---

## 4. Static editor websites load but do not fire `Http.Request` / `Http.Response` objectives

**Observed.** The editor export's static website loads in Browser:

```text
http://qe24-website.test/
http://qe24-website.test/echo
```

But neither editor objective completed:

- `http-request`
- `http-response`

The raw harness's `Http.registerHost()` server did fire Browser-origin response/intercept events, so this may be a distinction between SDK-registered HTTP hosts and static `WebsiteDefinition` hosts.

**Question.** Should Browser traffic to a mod's static `WebsiteDefinition` pages emit `Http.Request` / `Http.Response` / `Http.Intercepted` events? If not, can the SDK docs call out that HTTP events are only for `Http.registerHost()` / proxy-visible traffic and not static websites?

**Editor stance.** Keep HTTP authoring fenced until the event semantics are clear by origin and host type.

---

## 5. Suspicion/log-forensics SDK surface still appears absent in SDK 0.24

**Observed.** We expected possible suspicion support based on earlier conversation, but the pinned SDK declaration has no `Suspicion` namespace, no suspicion-related functions, and no suspicion event names in the generated catalogue. Searches against `index.d.ts` and `reference/hackhub-events.json` only find ordinary prose/old docs, not an API surface.

**Question.** Is suspicion/log-forensics participation planned for a later SDK? If yes, what shape should we expect? Examples that would unblock the editor:

- read current suspicion level;
- raise/lower suspicion;
- listen for suspicion changes;
- create log entries that the native suspicion system treats as cleanable evidence;
- mark a quest action as suspicion-relevant.

**Editor stance.** No suspicion nodes or promises. Suspicion remains game-native and outside the editor until a pinned SDK declares and in-game QA verifies it.

---

## 6. SMS/text-message SDK surface still appears absent in SDK 0.24

**Observed.** The pinned SDK has phone-call dialogs and `PhoneApp`, plus Mail/Kisscord/WeeChat messaging APIs, but no SMS/text-message namespace or event surface. Searches for `sms`, `text message`, and equivalent event names in `index.d.ts` / `reference/hackhub-events.json` do not find a native SMS API. (r232, verified in the pinned 0.24.0: `PhoneApp` is a mod app that appears on the in-game phone home screen — an HTML app driven through the `HackhubSDK.Phone` bridge — not a dial mechanism. The SDK has no dial event or callback either: a quest's call is started mod-side via `quest.createDialog(branch)`. The main game's own quests have a player-dials-a-number experience, but nothing in the mod SDK surface expresses it.)

**Question.** Is native SMS planned for a later SDK? If yes, will it be quest-declared like phone-call dialog, an imperative namespace such as `SMS.send(...)`, an event surface for read/reply, or part of `PhoneApp`? And is the main game's player-dial flow (dial a number → the quest's call starts) reachable from mod content at all — e.g. a dialable-number registration or an `onDial`-style hook — or is it client-internal to the campaign?

**Editor stance.** Keep using Kisscord/other channels as substitutes where templates need a contact beat. Do not ship an SMS editor until a pinned SDK declares it and in-game QA verifies it.

---

## 7. Minor watch item: editor export first-load debug toasts can duplicate

**Observed.** After adding `ui` permission, the editor export `1.0.2` showed setup mail and toasts on a fresh save. Zeis saw two similar initial debug toasts, both apparently saying the load/listener registration message, and then only one such toast after reload. Wi-Fi objectives still worked after reload and there was no duplicate AP.

**Question.** Is it expected that the load/objective-start path can fire twice on first save creation? If not, we can provide a smaller reproduction after the bigger SDK 0.24 items above are handled.

**Editor stance.** Watch only; not blocking.

---

## 8. `Twotter.AccountCreated` did not fire for an account added through the API

**Observed.** Game 1.3.0, Steam build **25388883**, 2026-09-18. A mod called
`Twotter.createUser(...)` and then `Twotter.addUser(user)`. Twotter's own search
and profile screens showed the account immediately, and the same quest's
**`Twotter.PostSeen`** listener fired normally when the profile was opened from
the timeline — but the **`Twotter.AccountCreated`** listener, registered at quest
start before the account existed, never fired. Transcript:
`reference/sdk-0.24-qa/QE24-TestResults - Twotter.md`.

**Question.** Is `Twotter.AccountCreated` only raised for accounts the *player*
creates in the Twotter app (and for quest-declared accounts at save creation),
rather than for anything that lands in the store? If so, which event should a
content pack listen to when it needs to know "this account now exists"?

**Editor stance.** No objective or trigger will be built on
`Twotter.AccountCreated` until this is answered; `PostSeen` and `ProfileSeen` are
the events QA actually observed firing. The finding is recorded in
`reference/sdk-0.24-qa/STATUS.md` for the Twotter implementation round.

---

## 9. Twotter's "affected saves are repaired on load" did not repair our record

**Observed.** The 1.3.0 changelog says a content pack could break Twotter
permanently and that **affected saves are repaired on load**. Reproducing the
broken shape deliberately — a stored `TwotterUser` whose `bio` property is
present and `undefined`, exactly what the old quest-declared path wrote — search
survived (good), but after saving, quitting to the main menu and reloading, the
stored record's `bio` was **still `undefined`**. So the read path is guarded;
the repair did not touch this record.

**Question.** Is the load-time repair limited to records written by the
pre-1.3.0 declarative path (rather than anything an API caller adds), or is it
keyed to something else about the affected-save detection? We do not need a
repair — we can create clean records — but the answer decides whether an old
player save with a broken record is safe when a pack merely *reads* it.

**Editor stance.** Nothing depends on repair-on-load: the implementation round
writes every account through `createUser`/`addUser`, and the read path is
verified safe against the broken shape.

---

## 10. Feature request: let a posted tweet carry a picture

**Observed.** The r185 QA run posted a tweet from a mod account with an attached
picture, using `Twotter.postTweet`. The picture did not appear anywhere — not in
the profile's timeline, not in the main feed, and not on the post's own detail
page. The same run's account avatar (a data URI, same shape and same size class)
rendered correctly, so the difference is not how the image is supplied.

**Read of the API.** `TwotterTweet` in SDK 0.24 is

```ts
interface TwotterTweet {
    id: string;
    userId: string;
    content: string;
    sendedAt?: string;
    interaction: TwotterTweetInteraction;
    showInTimeline?: boolean;
}
```

— there is no picture, media, attachment or image field of any kind, and
`postTweet` does not declare an options bag. So this looks like a **missing
field rather than a broken one**: the game's own posts show pictures (the
in-game feed does), but a mod cannot post one.

**Request.** Either a field on `TwotterTweet` (a data URI or a mod asset path,
whatever the game's own content uses), or an overload such as
`postTweet(tweet, { image })`. Our editor models a picture per tweet already, so
the day the API accepts one the feature ships without any further work. Until
then we keep the field in the project file, show it only as an editor preview,
and tell authors plainly that players will not see it.

**Evidence.** Game `1.3.1`, build `25388883`; transcript
`reference/sdk-0.24-qa/QE24-TestResults-Twotter.md`; the account's own avatar in
the same run rendered, so the image path itself works.

---

## 11. Uninstalling a mod leaves the Twotter accounts it created in the save

**What we saw.** 2026-09-19, game 1.3.0 / build 25388883. A quest had posted its
series from `@qe24_editor` (an account the mod created with `createUser` +
`addUser`). The player then **removed the mod from disk while the game was
closed**, relaunched and loaded the save:

- the **quest** was gone, as expected — the game drops content from a mod that is
  no longer installed;
- the **account and every tweet it posted were still there**, and the handle was
  still findable in Twotter's search.

**This is documented behaviour, not a surprise.** `Twotter.removeUser` says so
outright: *"Accounts your mod adds live in the player's save and are not removed
when the mod is uninstalled, so clean up in `OnModPackageUnloaded` if the account
was only meant to exist for your story."* We do exactly that — our runtime's
`OnModPackageUnloaded` removes every account the mod declared. But
`OnModPackageUnloaded` is *"called when the mod is being unloaded (e.g. disabled
by user)"*, and a mod that was deleted while the game was closed is never loaded,
so no code of ours can run at any point in that sequence. (The same sentence
appears on `Mail.remove`, so mail a mod sends has the same tail.)

**An in-game disable does not help either (2026-09-19).** Trying the other route
— disabling the mod from inside the game's Mods list — produces the game's own
prompt: *"Mod changes detected. Restart the game to apply updates."* So a
user-initiated disable is **queued, not applied in-session**, and the hook's
documented example (*"e.g. disabled by user"*) therefore does not describe a
mid-session unload either. **Measured 2026-09-19: the hook does not run on a plain quit either.** Export
1.0.20, harness 1.0.18, game 1.3.1 (test file `QE24-TestResults-Twotter-6.md` on
our QA-filedump branch). A session in which the mod loaded, started its quest,
created `@qe24_editor` and posted its five tweets ended with the player saving
and quitting to desktop **with the mod installed and enabled** — and that
session's log contains **no `unloading:` line at all**. That line is the first
statement inside the hook, so its absence means the hook was never called.
The next session, with the mod removed from the folder, still found
`@qe24_editor` on the save through `getUserByUsername`.

Worth noticing, from the same log, one line after the load — the game does this
by itself:

```
[PruneOrphanQuests] Dropping "QESdk024TwotterQa" (Se8JDmyGoK): no installed content defines it.
```

The game knows which package defined a quest and drops it when that package is
gone, so the machinery to sweep a missing mod's data exists; it simply does not
cover what the mod created through `createUser`.

**Measured 2026-09-19, second half: the disable path works.** Disabling the mod
in the Mods list queues the change (*"Restart the game to apply updates"*), and
the game applies it while starting up — before any save is loaded. That is when
`OnModPackageUnloaded` fires: the log carries *"unloading: removing the Twotter
accounts this mod declared"* and *"twotter: removeUser(qe-tw-account) -> true
(mod unloaded)"*, and after loading the save the handle is gone from
`getUserByUsername`. So the SDK's advice **is** followable through the Mods list,
and a player who disables a mod before deleting it leaves a clean save.

That narrows this question to the one case left: a mod **deleted from disk while
the game is closed**. Its code can never run, so nothing of ours can remove what
it created — and the contrast with the game's own behaviour is the point: the game
drops that mod's quests at load (*"[PruneOrphanQuests] Dropping …: no installed
content defines it"*) but leaves its accounts and their posts in the feed.

**Question.** Should a mod's own data be cleaned up when the game notices its
package is gone — e.g. at save load, drop the mod-declared accounts and posts
whose owning package is no longer installed, the way the quests are dropped? As
a mod author I cannot reach that moment: my hook runs while I am still loaded, and
by then the player either completed the story (verified), disabled us (verified —
see above) or deleted us from disk, which is the case no code of mine can see.

**Why it matters.** A player who uninstalls a mod mid-story keeps that mod's fake
people in their social feed forever, next to their real in-game contacts, with
posts that reference a story that no longer exists — and no mod can remove them,
because the one mod that could is gone. Three options as we see them, any of
which would close this: (a) the game sweeps mod-declared data for missing
packages at save load, (b) `Bootstrap` gains a hook that runs for a mod that is
detected as removed, or (c) the SDK documents that mods must accept it and the
loading screen says nothing (which is where we are today, and is workable — it is
just worth knowing it is deliberate).

**Our side in the meantime.** The editor's default per account is *"remove when
the story ends"*, so completing or abandoning the last quest that uses an account
removes it and its posts — verified in game (T-11b, T-12b, both green). The leak
needs a player to uninstall the mod with a quest still open, which is the case
nobody can clean up after.

---

## 12. `Quest.claim()` returns nothing, and a quest's state cannot be read back

**What we hit.** Our QA harness starts a quest belonging to another mod with
`Quest.claim("QESdk024TwotterQa")` — that is the documented way, and it is how a
tester claims one row's quest without five of them running at once. In SDK 0.24
the declaration is:

```ts
static claim(quest: string | typeof Quest): void;
static unclaim(quest: string | typeof Quest): void;
```

`void`. There is no return value, no `isClaimed`/`getState`, and no list of quests
to compare against. So when the named quest was **not registered in that session**
— the owning mod was disabled in the Mods list — the call did nothing, silently:
no exception, no log line, and our harness printed "Claimed …" because a call that
does not throw looked like success. A tester then spent a session looking for a
profile that could never appear.

**Question.** Could `claim` / `unclaim` return a boolean (or throw a named error)
when the quest is unknown, or could the namespace expose a way to read a quest's
state — `QuestState` (`unclaimed | claimed | completed`), or even
`Quest.isClaimed(name): boolean`? Anything a caller can check would do.

**Why it matters beyond QA tooling.** A mod that starts another mod's quest — a
campaign pack claiming a chapter, a trigger chaining stories — has no way to know
whether its chain actually started, so a broken dependency fails silently and the
player just sees nothing happen. With a boolean we can log it; with a state read
we can also avoid claiming a quest that is already running.

---

## 13. A mod that was disabled in the Mods list stays disabled forever — across a new version, a folder deletion and a fresh save

**What happened** (reported by our tester, 2026-09-19, game 1.3.1). He had
disabled our QA mod in the Mods list during an earlier round of testing, then
deleted it from the local mods folder. Later:

1. local mods folder emptied, except one unrelated mod;
2. a **fresh, clean save** created and loaded;
3. our two mods copied into the local mods folder (the export at a **newer
   version** than the one he had disabled);
4. game started, save loaded, harness command run to start the mod's quest.

The command started nothing, and the mod's own log lines are absent from the
**whole session** — the pack never loaded. Checking the Mods list explained it:
the freshly copied mod was **DISABLED**, remembered from the earlier disable.

**Why this is a bug and not a setting.** Three things should each have cleared it
and none did: the mod was deleted from disk and its folder re-created; the copied
build was a **different version**; and the save it was loaded into was **new**. So
the disabled flag appears to be global state keyed to the mod, with no
reconciliation against what is actually installed — and it fails **silently**:
nothing in the UI says "this mod is installed but disabled", the log says nothing
about it, and no API can see it (see §12).

**Why it hurts.** Every quest in that mod is invisible: `Quest.claim(name)` does
nothing and returns void, so a QA harness or a quest that chains another mod's
story cannot tell a disabled dependency from a missing one. A player who disables
a mod to try something else, then re-subscribes or updates it, will find its
content silently gone with no obvious cause — and "it works for me" is then very
hard to debug from the modder side.

**What we would like.** Any one of these:

- an **update or version change re-enables** a mod that was disabled (a new
  version is new content; the old decision was about the old build);
- an **explicit state in the Mods UI** for "installed but disabled" that is
  distinguishable from "not installed", plus a log line when a mod is skipped for
  being disabled;
- a **first-run default** where a mod whose folder changed (new version, or
  re-appeared after deletion) starts enabled unless the player disables it again.

**Where the flag lives** we cannot see — it survives a save deletion, so it is
not in the save, and it survives the mod folder being emptied, so it is not keyed
to a file we can inspect. If it is meant to persist, all we need is for a new
version to be treated as new.

**Until then, our side:** the QA harness now asks `SharedVariables` whether the
export loaded and prints it (`Editor export: loaded (v…)` / `NOT LOADED in this
session`, with the fix in the message), and the export leaves that marker when it
loads. The tester-facing note is in
[`reference/sdk-0.24-qa/STATUS.md`](../reference/sdk-0.24-qa/STATUS.md).

## 14. `UI.*` calls made from a menu or right-click handler are refused: the permission check reads the mod as `null`

**Found in game** 2026-09-19, on 1.3.1 / Content SDK 0.24, while testing a pack's
own start-menu item (editor build r204, export 1.0.29).

A mod registers a start-menu item with `Menu.addItem({ id, label, onClick })`, and
the handler calls `UI.toast(...)`. Clicking it does nothing visible, and the game
log has, in order:

```
[quest-editor] extras: menu item "qe24-menu-extras" clicked (language en)
[quest-editor] extras: UI.toast threw: [ContentSDK] Mod "null" tried to use UI.toast without "ui" permission. Add "ui" to the permissions array in your manifest.json.
[quest-editor] extras: UI.notify threw: [ContentSDK] Mod "null" tried to use UI.notify without "ui" permission. Add "ui" to the permissions array in your manifest.json.
```

The same is true for a right-click item registered with `ContextMenu.register`
(both `file` and `desktop` targets):

```
[quest-editor] extras: right-click item "qe24-ctx-file" clicked (language en)
[quest-editor] extras: UI.toast threw: [ContentSDK] Mod "null" tried to use UI.toast without "ui" permission. ...
```

**It is not only permissions: the translation table is invisible from a click
too.** The same click handler said its message through our runtime's `{{tr.…}}`
token, and the log records the text it was about to show:

```
[quest-editor] extras: said "qe24.menu.message" via nothing - this build has no UI API
```

`qe24.menu.message` is the *key*, which is our fallback when
`Localization.t(key)` returns nothing — and the key is registered in both `en` and
`de` for that export, in the session whose language is `en` (the same log line says
`clicked (language en)`). At registration the identical table resolves fine: row G
below shows the menu label and the quest title translated in German. So a click
handler also cannot see the mod's own localizations, which is the same shape of
problem as the permission check: **the mod's own registrations are not reachable
from the handler**.

**Why we do not think this is a missing permission.** In the *same session of the
same install*, that export's quest code showed a notification through
`UI.notify` and it appeared; the harness mod (`qe24` commands) shows both
`UI.notify` and `UI.toast` popups from a command with no complaint. Its
`manifest.json` lists `"ui"` — and so does the export's
(`permissions: ["network", "mail", "events", "ui"]`). The refusal names the mod as
**`null`**, which reads like the permission check being unable to resolve *which
mod is calling*, rather than a permission that is absent.

**What we think is happening.** `Menu.addItem`/`ContextMenu.register` handlers are
invoked by the game's own UI code, outside the mod's load/quest/command
execution context. If the permission check resolves the caller from that context,
there is none by the time our handler runs — so every permission-gated call
(`ui`, and presumably `mail`, `network`, …) is refused from every click handler in
every mod.

**Why it hurts.** A start-menu or right-click entry is the one place a pack acts
*because the player asked it to*, and the natural action — say something, send a
mail, open a page — is gated. If this cannot be fixed at the call site, a pack's
only options are non-permission channels, or routing the work through something
the engine calls back later.

**What we would like.** Any one of these:

- the **caller's mod is resolved from the registration** of the menu item (the
  item knows which mod registered it), so a handler inherits that mod's
  permissions;
- or a documented way to make a permission-gated call from a click handler — e.g.
  an explicit `runAs(mod)`-style wrapper, or a note that the handler is called
  with the mod's identity if it is declared as an arrow in the registering mod;
- or, at minimum, a message that says **"the click handler has no mod context"**
  instead of "add `ui` to your manifest.json", which sends the reader to a file
  that is already correct.

**We measured the workaround, and it works — this is what a pack has to do
today.** Our QA harness ran one click that tried every channel, and then the same
UI calls from a `Scheduler.schedule(..., { ms: 1 })` job. Verbatim from the game:

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

Two things follow, and both matter to us more than the permission check itself:

1. **A scheduler job runs with the mod's identity**, so any gated work can be
   moved there. Our runtime now does that: a click writes its log line, hands the
   action to the engine (kind `qe/<mod id>/click`), and the action runs in the
   callback a millisecond later. Without that, none of a pack's own menu or
   right-click actions could do anything that a permission guards.
2. **The translation table is unreachable from a click too**, and comes back in
   the callback. The click handler logged the *key* (`qe24.menu.message`) where
   the sentence should have been, in a session whose language was `en` and with
   that key registered in both `en` and `de`; the identical lookup at
   registration time resolves fine (labels and quest titles translate). From the
   scheduler callback the sentence is back. So it is not only the permission
   check: **nothing mod-scoped is reachable from a click handler.**

**Our side, meanwhile.** The runtime says all of this out loud in the log — the
click line first (so a click that never arrived is distinguishable from one whose
call was refused), then the hand-over to the engine and the callback — and prints
an explanation when it sees this refusal, because the game's own message sends an
author to a manifest that is already correct.

**Amendment, 2026-09-20 (game 1.3.1, harness 1.0.24): the same refusal fires
from `OnModPackageUnloaded`.** Disabling the QA harness in the Mods list and
restarting fired the unload hook correctly at game start — and every
permission-gated call inside it was refused with the identical `Mod "null"`
message, while the un-gated `Twotter.removeUser` executed fine (it had nothing
to remove on that save, and said so honestly — `-> false`, not a refusal):

```
[qe24] mod unloading
[qe24] intercept off failed: [ContentSDK] Mod "null" tried to use Http.setInterceptEnabled without "network" permission. ...
[qe24] Http.unregisterHost failed: [ContentSDK] Mod "null" tried to use Http.unregisterHost without "network" permission. ...
[qe24] Mail.remove(JSnUzFVzS0) failed: [ContentSDK] Mod "null" tried to use Mail.remove without "mail" permission. ...
[qe24] Mail.getInbox failed: [ContentSDK] Mod "null" tried to use Mail.getInbox without "mail" permission. ...
[qe24] unload removeUser(qe24-probe-user) -> false          <- un-gated: ran
```

That closes the loop on the SDK's own cleanup advice: `Mail.remove`'s
declaration says a mod "should collect the ids it gets from `send` and remove
them in `OnModPackageUnloaded`" — but the remove is refused there, so **the
documented unload-cleanup pattern is unreachable on this build** for every
gated namespace. Quest-end hooks are fine (measured in the same session: an
`OnAbandon` sweep's `Mail.remove` returned `true`), so cleanup at quest end is
what the editor authors; unload cleanup waits for this question.

## 15. `Handbook.open(id)` opens the handbook but never reaches the article — what are the article ids?

**Found in game** 2026-09-19, on 1.3.1 / Content SDK 0.24, from a pack's own
start-menu action (editor build r206, export 1.0.31).

A menu entry was wired to "handbook" with the page **Port Forwarding: Start
Here** — one of five titles Zeis had verified searchable in the in-game handbook,
and our working guess was that the id is the title verbatim. Clicking it:

```
[quest-editor] extras: the engine called back for menu item "qe24-menu-handbook" (language de) - running it here, where the mod has a name
[quest-editor] extras: opening handbook article Port Forwarding: Start Here
```

...and the handbook **opened, on its own landing page**. No error, nothing in the
log, no article. So `Handbook.open` works and the call is accepted, but the id
above does not address that page — and, as far as we can tell, nothing in the
build tells us what would.

**Why it hurts.** "Open the manual for this pack" is the natural action for a
tutorial or a walkthrough entry, and our `Open handbook` node has been promising
"jump to an in-game article" since it was built. An author can type any string
they like and every one of them behaves identically — the handbook opens at the
top. We cannot even tell "wrong id" from "the id was right and the deep link
needs something else".

**What we would like**, any one of these:

- **the list of article ids** (or the rule that generates them — a slug, an index,
  a title in a specific language, …), even as a note in the SDK docs;
- or an **error or a return value** from `Handbook.open` when the id is unknown,
  so a pack can tell the player the page could not be opened instead of silently
  showing the landing page;
- or, if deep links are not meant to be public, say so, and we will drop the
  picker from the editor and describe the node as "opens the handbook".

**Our side meanwhile:** the editor no longer claims the page is reached. The
runtime logs what was asked for and that the game lands on its landing page, the
`Open handbook` node's field says the same in its help text, and the picker's
note records this measurement.

## 16. `MailDefinition.replyable` documents a `repliedTo` field that the reply event does not carry

**Found in game** 2026-09-20, on 1.3.1 / Content SDK 0.24, while measuring the
mail rows (harness 1.0.24, transcript in
[`reference/sdk-0.24-qa/QE24-TestResults-Mail.md`](../reference/sdk-0.24-qa/QE24-TestResults-Mail.md)).

The SDK declares `MailDefinition.replyable` with: *"The player's reply raises
`Mail.Sent` with a `repliedTo` field naming this mail, which is how a quest
picks it up."* The reply **does** work and `Mail.Sent` **does** fire — this is
the whole raw payload, logged verbatim:

```json
{"id":"d5eRUBLmJ6","from":"bkelso@gomail.com","to":"qe24-direct@qe24.test","subject":"(Reply)","content":"asdf","sentAt":1789902205922}
```

No `repliedTo`. The declared `MailEvent` interface has no such field either, so
the doc comment and the interface disagree — and the runtime agrees with the
interface. The reply's subject is the constant string `(Reply)`, so it carries
no trace of which mail was answered either.

**Why it matters.** Replying is the player speaking, so it is the natural
quest beat — but a quest that listens for `Mail.Sent` hears **every** mail the
player sends. Without `repliedTo`, the only discriminator is `to`: a reply
arrives addressed to the **original mail's `from`**, which we verified by
giving the probe mail a distinctive from address and ticking an objective on
exactly that condition (it worked first try). So reply-driven quests are
writable today by matching `to`, and our editor authors them that way — but
every mail of a conversation then needs a unique from address, and a quest
cannot tell a reply to mail A from a reply to mail B if both share one
address.

**What we would like**, any one of these:

- the `repliedTo` field the declaration promises (naming the original mail's
  id), and the `MailEvent` interface updated to declare it;
- or the doc comment corrected, so tooling stops promising a field the engine
  does not send;
- or a `replyTo`/`inReplyTo` we can set ourselves on `MailDefinition`, so the
  echo comes back through `metadata`.

## 17. `Mail.getInbox()` entries carry no `subject`

**Found in game** 2026-09-20, same session as §16.

The SDK declares `MailInfo = { id, from, to, subject, read, sentAt }`. The
probe sent a mail with the subject `QE24 mail probe (plain)`, then read the
inbox: **27–30 entries**, the probe's mail was there and findable **by `id`**
— but a scan over the entries for that subject found **zero**. The same held
after a save/reload. So `id` (and the fields the harness prints) are filled,
but `subject` is not, on this build.

**Why it matters.** Subject-matching is the natural way to find "the mail my
mod sent" when the send path returns no id (`Quest.sendMail(index)` returns
`void`, which is how quest `Mails[]` go out). A mod that wants to withdraw a
mail it sent through the quest path has no handle but the fields `getInbox`
returns — and on 1.3.1 the subject half of that contract is missing. (The
mod's own `from` address works as a discriminator and is what we now match on;
whether `from`/`to` are reliably filled is measured next session — the harness
prints one raw entry per audit from now on.)

**What we would like:** `getInbox()` entries filled as declared (or the
declaration narrowed to what the engine actually returns). A working `subject`
would also let a mod show honest "mail still in the inbox?" checks.

## 18. Feed posts cannot be taken back down — is there a removal API?

**Found while building the editor's Hackhub-posting section** (2026-09-21,
game 1.3.1 / Content SDK 0.24).

A quest's `HackhubPost` is registration data: the post lives on the feed for
as long as the mod is installed, and every official quest's post we have seen
behaves the same way — persistent. There is no `Hackhub.removePost` (or any
equivalent) in the SDK's surface, and `Quest` has no unpost: the closest
things are `Quest.unclaim` (removes the *claim*, not the post) and the mod
going away entirely.

**Why a mod would want it.** Two cases, both real for us:

1. **Bug recovery.** A shipped post with a typo, a broken reward, or a story
   change can never be withdrawn — the author's only options are shipping a
   new version that *replaces* the registration (and hoping the engine
   refreshes the post) or leaving the wrong post up.
2. **The once-claimed mystery.** In our QA runs a feed post rendered exactly
   once and then never again — not even on a fresh save — while the same
   quest claimed fine through the API. Our working theory is that the engine
   remembers *claimed quests per profile* (the same persistence class that
   keeps mod Twotter accounts alive after the mod is deleted) and retires the
   post of any quest that profile has ever claimed. If that is what happens,
   a removal API would also give us a way to re-offer a quest deliberately.

**Update (r217, 2026-09-22):** the lifecycle half of the mystery is answered
by the SDK's own types after all — `Quest.HackhubPost` in `index.d.ts`
(SDK 0.24.0, line ~2157): *"The post appears once the quest's
`QuestsToComplete` prerequisites (if any) are met **and the quest hasn't been
claimed yet**."* That is per-profile claim memory, documented: our probe post
rendered once (1.0.38), was claimed, and never rendered again — on any save.
The removal ask below stands on its own.

**What we would like, any one of these:**

- a `Hackhub.removePost(quest)` (or a flag on quest registration) so a mod
  can take its own post down;
- or documentation of the intended post lifecycle — whether posts are meant
  to be permanent, whether replacing a mod's registration refreshes the
  post, and whether the engine really retires posts of once-claimed quests
  per profile;
- or, at minimum, confirmation that the post's *author* fields (name, drawn
  avatar) are honored from `HackhubPost.author` — we now pass them through
  and a game session is pending to confirm they render.

**Note for the road:** quests accepted from the feed show their **Complete
button on the feed post itself**, not in the journal — the post is the
quest's home while it is an offer. Worth keeping in mind if the lifecycle is
ever redesigned.

## 19. ~~The game says "current API v2" — the SDK ships v1. What is v2?~~ — **ANSWERED 2026-09-28**

**SteelWaffe's answer, asked directly:**

> game is currently running on v2 but some older mods running with v1
>
> its not bug and your mod be ok
>
> just basically add `"apiVersion": 2` to your manifest.json

So: v2 is simply the current API, v1 keeps working in compatibility mode, and
the warning is noise rather than a symptom. **The editor now emits
`apiVersion: 2` on every export** (r241 — the compiler emits it, the project
schema defaults to it, and a project still carrying `1` is upgraded on
export), and every hand-made QA mod in `reference/sdk-0.24-qa/` declares 2.

One small suggestion if it is easy: the SDK's own manifest example and
`build.mjs` scaffold still write `"apiVersion": 1`, which is what led every
SDK-built mod into compatibility mode in the first place.

*The original question, kept for the record:*

**Found while re-testing the feed-post round** (2026-09-22, game 1.3.1 /
Content SDK 0.24.0).

Every mod the editor exports logs the same line at boot:

```
[ContentSDK] Mod "…" uses API v1 (current: v2). Running in compatibility mode.
```

We ship `apiVersion: 1` because the pinned SDK itself does — its README's
manifest example and its own `build.mjs` scaffold both write `"apiVersion": 1`,
and `index.d.ts` documents nothing newer. Under that compatibility mode every
feature we have measured verifies green in game: mail (both send paths),
Twotter accounts and tweets, timers, the scheduler, quest completion. So
compat mode is not known to break anything — but "current: v2" implies a
pipeline we cannot see, and the one feature that has never verified (quest
feed posts) is exactly the kind of thing a v2 could have re-plumbed.

**2026-09-28 addition (r239/r240).** A declarative-settings probe ran under
compatibility mode and its settings came back **intact**: the game parsed
`Bootstrap.Settings` (six settings, all five types, exact defaults) and
`ModSettings.getAll()` returned them at package load and again at quest
claim. So compatibility mode is **not** known to touch the settings
*pipeline*. What is unverified is the other half — the player-facing UI (see
question 23) — and whether that UI is v2-only. A v2-manifest copy of the
same probe is in the hands of the tester.

**What we would like:** any of these —

- what API v2 changes for mods, and whether it is reachable from the public
  SDK at all;
- or confirmation that v2 is first-party-only and compatibility mode is the
  intended permanent state for SDK mods;
- or a pointer to what (if anything) behaves differently under compatibility
  mode, so we stop suspecting it when something fails.

## 20. The SDK requires comment authors to have names — does the game mint personas for blank ones?

**Found while diagnosing the never-surfacing feed posts** (2026-09-22).

`QuestHackhubPostComment` in `index.d.ts` requires `author: { name: string }`
— not optional. The post-level author, by contrast, is documented: *"If
omitted, the quest's (auto-generated) employer is used, falling back to an
anonymous 'Hidden User'"* — and we have seen the game generate a full persona
for a blank post author ("Kristina Kaczmarek", drawn avatar, r211 probe).

Our editor let authors leave a comment's author blank and shipped an **empty
author object** — a contract violation. Both quests that never surfaced their
feed post carried one; the only post that ever rendered had no comments. r217
sends no author at all when the name is blank, but whether the game tolerates
a missing comment author (and mints a persona, as it does for posts) is
unverified.

**What we would like:** confirmation of what the engine does with a comment
whose `author` is absent — persona, anonymous, or a failed post — so the
editor knows whether "blank" is a feature or must be a required field.

## 21. Mod quest posts have stopped surfacing on the feed — is `HackhubPost` (and its `author`) still read?

**Found across the editor's feed-post playtests** (2026-09-21/22, game 1.3.1,
Content SDK 0.24.0; five exports, three fresh quest names, two fresh saves).

A quest's `HackhubPost` rendered **exactly once** across every session we
have run: the r211 mail probe (export 1.0.38) — a **bare** post: `content`
only, no `author`, no comments, and the game drew a persona for the poster
("Kristina Kaczmarek"). Every attempt since carried the fields the d.ts
advertises, and **none of them ever surfaced** — not on fresh saves, not
with fresh quest names and fresh quest ids, not with avatars shipped as
extracted asset files (mod icon/cover's proven contract), not with
contract-clean `author: { name }` shapes:

| Attempt | Post shape | Quest name | Result |
|---|---|---|---|
| r211 probe (1.0.38) | content only | fresh | **rendered once**, accepted from the feed |
| same probe (1.0.39/40) | content only | already claimed | absent (the d.ts "hasn't been claimed yet" rule) |
| r215 | `author{name}` + data-URI avatar | fresh | absent |
| r216 (v2) | `author{name}`, blank-author comment | fresh ×2 | absent |
| r217 (v3) | employer{name,avatar} + `author{name,avatar file}` + named comment + likes | fresh name + fresh id, fresh save | absent |
| r218 H-10 | **bare** — content + likes only, no author, no comments, no employer | fresh, fresh save, no mods | **absent** |

**Resolution direction (r219 + r220 grids ran, 2026-09-22): the post shapes,
the quest fields, AND the manifest are all innocent** — eleven variants
rendered from hand-authored mods, including a canary with the editor exports'
exact manifest (`mail, events`). The one structural difference left: every
editor-compiled quest is an anonymous class expression (`var cls = class …`),
so `cls.name === "cls"` for **every quest in every export**, while hand mods
name their classes. If the engine keys quest identity (claim memory, and with
it the feed's "hasn't been claimed yet" check) on the class name, one claimed
editor quest retires every editor export's posts on that profile — which
would explain why fresh quest names never helped. The r221 pair RAN (the anonymous-class twin rendered — class names innocent
like everything else), and then the r222 round produced the breakthrough:
**an editor export rendered.** Zeis's v6 (bare post, build r222 with the
renamed classes) surfaced on the feed — the first editor render since
1.0.38, after five consecutive silent exports. The author string was
doubly cleared on the way (canary 1.0.2 authored "Zeis" rendered; v6
authored "Zeissss" rendered). **VF-1 has now run (Zeis, fresh save): the OLD v3 export — pre-rename
emission — stayed ABSENT**, the same day v6 (renamed) rendered beside it in
the matrix. Within editor exports the A/B is decisive: the anonymous-class
emission does not surface feed posts; the per-quest-named emission does.
The rename is the only emitted difference between those builds, and the
editor carries it since 2026-09-21.r221 — every export from r221 on is
fine; older exports need re-exporting.

One honest footnote for your pipeline: the same inferred `cls` name rendered
from our hand-written harness, so the raw name string alone is not the
trigger — the failure needs the anonymous class inside a compiled export's
registration context (the old runtime also inferred `cls` for its Command
and Website classes in the same module, though neither was registered in the
tested exports — the exact trip-wire is yours to pinpoint). Everything else
was falsified as a cause along the way: post shapes, author/comment fields,
avatars as asset files, the employer fallback, rewards/behaviour assignments,
manifest permissions, the author string, co-installation. The documented
once-claim-per-name rule stands as the only removal mechanism. A rendering footnote from the same
run: an author declared with a name but no avatar draws a **broken-image
icon**, and the employer's file avatar does not resolve on the post-accept
revealed card either. All five harness variants rendered in one feed — bare, named
poster, file-avatar poster, likes + named comments — so `HackhubPost` itself
still works, the extracted-asset avatar contract renders, and the suppression
is **mod-shaped**: the same shapes that render from our QA harness (five
permissions) never surface from an editor export (`mail, events`, fresh ids).
The r220 round isolates the two surviving deltas: the compiled editor quest's
ALWAYS-ASSIGNED fields (`AutoComplete`/`HasCompleteButton`/`Abandonable`/zero
`Rewards`) and the manifest shape (a canary mod with editor-identical
permissions). One more engine observation from the same run: a post author
declared with a **name but no avatar** draws a **broken-image icon** on the
post — the anonymous "Hidden User" persona, by contrast, renders fine.

At the same time, every session log — vanilla runs included — shows
`[Scheduler] Holding job "Queue.HandleQuestHackhubPosts": no handler
registered.` when feed-adjacent UI opens.

**What we would like, any of these:**

- confirmation whether `HackhubPost` (and specifically `author.name` /
  `author.avatar`) still reaches the feed renderer in 1.3.1, or whether the
  pipeline behind `Queue.HandleQuestHackhubPosts` lost its handler;
- whether a bare `content`-only post is the supported shape (it is the only
  one we have seen work);
- whether the once-per-profile claim rule (d.ts, `HackhubPost`) also
  suppresses posts for quest names a profile has claimed through
  `Quest.claim` rather than the feed.

## 22. Feed-post author rendering: name-without-avatar draws a broken icon — and when exactly does the employer fallback fire?

**Found in the r219 harness grid** (2026-09-22, game 1.3.1, SDK 0.24.0).

Two rendering behaviours around `HackhubPost.author` that the type
declarations don't describe:

1. **A named author with no avatar draws a broken-image icon — ANSWERED
   (r226): the game does not mint avatars for named authors.** Confirmed from
   BOTH paths: the harness grid (HF-2/HF-4) and an editor export (v7: comment
   by "Needs Dicebutton", shipped clean as `author: { name }` with no avatar
   key — no generated persona appeared, just the broken icon). Either fall
   back to a drawn persona for named-but-avatarless authors, or document
   `avatar` as effectively required whenever `author` is present. The
   anonymous route (no `author` at all) renders the drawn "Hidden User"
   persona without incident.
2. **The documented employer fallback is unmeasured.** The d.ts says an
   omitted post author falls back to "the quest's (auto-generated) employer,
   falling back to an anonymous 'Hidden User'". A probe with an INVALID
   employer shape (`{name}`) landed on "Hidden User"; whether a well-formed
   `Employer` (`firstName/lastName/email/avatar`) becomes the post's author
   is being measured right now (harness 1.0.28, row HF-5). Note the
   interplay with 1: if the fallback fires, does the employer's avatar come
   along, or does the post draw the broken icon?

   **Zeis's correction (2026-09-22), which reframes this half:** "Hidden
   User" is **standard Hackhub behaviour** — some posters are shown, some
   are hidden and only get revealed once the quest is accepted. So a
   "Hidden User" on an unaccepted probe post is not an anomaly to explain;
   the open questions become: does a well-formed employer (or any authored
   `author`) show pre-accept at all, and does accepting reveal the author
   the d.ts promises? Row HF-5's read now includes: accept it and see
   whether the poster changes.

**What we would like:** the intended author/avatar matrix — which
combinations render what, and whether the employer fallback is expected to
carry the employer's name AND avatar to the post.

## 23. Declarative mod settings — mostly answered; two small things remain

**Answered 2026-09-28 (same-day follow-up).** The UI is in the **main menu**:
*Main menu → Settings → Mods → the tiny grey "Settings" word on the mod's
row.* It was never in the in-game Settings program (the desktop OS simulator)
nor the phone's Settings app — which is where the SDK's phrase "rendered in
the Mods UI" sent us looking. `apiVersion` was **not** a factor: the v2 probe
showed it, and v1 would have too.

Verified end to end: all six settings of all five types render and are
editable, the slider respects its step, values survive a restart, and
`ModSettings.getAll()` returns the *changed* values on the next load
(`select:"violet"`, `number:1`, `slider:80`, …) — the full loop works.

Two things remain, both minor:

1. **The `number` field draws far too many underscores** — the widget seems to
   reserve space for a far wider range than the setting needs. Cosmetic, but
   it makes a number setting look broken. Is there a way to hint a sensible
   width (or should we just keep numbers small)?
2. **No reset-to-defaults control** is exposed in that UI. The SDK gives mod
   code `reset`/`resetAll`; the menu offers nothing. We will ship our own
   reset affordance in whatever the editor generates — unless the game would
   rather own it.

Also worth confirming: the settings screen is **main-menu only** (not
reachable mid-game). That is fine for difficulty-style choices; anything a
player must tune *during* a quest would need another surface.

*The original question, kept for the record:*

**Found running the r239 ModSettings probe in game** (2026-09-28, game
1.3.1, Content SDK 0.24.0).

The SDK documents `Bootstrap.Settings` as *"declarative settings definitions
rendered in the Mods UI"*, and `ModSettings.get/getAll/set/reset/resetAll`
for mod code. A probe declaring six settings — one of every type
(`toggle` ×2, `select`, `text`, `number`, `slider` with min/max/step) —
verified the **code** half completely:

- the game parsed the declaration: `ModSettings.getAll()` returned all six
  keys with their exact defaults (select `blue`, slider `50`, toggles as
  declared), at package load *and* later at quest claim;
- so the values are, or would be, handed to mod code correctly, including
  under API v1 compatibility mode (question 19).

What we could not find is the **UI** half. The tester looked in the in-game
**Settings app** and it has no Mods section at all. He has used a mods
*list* before — the one where a mod is enabled/disabled and the game answers
*"Mod changes detected. Restart the game to apply updates."* — so a
player-facing mods surface does exist somewhere in the game; it simply is not
where the docs led us to look, and its location was never written down in our
notes.

**What we would like:**

- where in the game a player changes a mod's declarative settings (which
  screen/menu, and is it reachable in-game or only from the main menu?);
- whether that UI is gated on `apiVersion: 2` — the game reports *current:
  v2* and runs our v1 mods in compatibility mode, and settings are a newer
  surface, so v2-only is a plausible reading (a v2-manifest copy of the probe
  is being tested to settle it);
- whether changed values persist across restarts and are then returned by
  `ModSettings.getAll()` on the next load, and whether the UI offers any
  reset-to-defaults control (the SDK gives mod code `reset`/`resetAll`, but
  says nothing about the menu exposing one).

Until this is answered, the editor should not promise a settings feature: the
data path is proven, the player-facing half is not.

## 24. `Http.Response` never reaches a mod for its own site's pages — is that intended, and can a mod observe a page view at all?

*Revised 2026-09-28. My first reading blamed the test order; Zeis corrected me
— the quest **was** claimed first (16:42:36) and the pages were visited
afterwards (16:47+), so the listeners were armed and the finding is real. It
also turns out to be old news I had forgotten: this repository's own QA notes
record from r166 that mod-hosted **static** sites do not tick
`Http.Request`/`Http.Response` either. This run extends that fence to dynamic
pages, so the question is whether the fence is deliberate and whether any
observation route exists.*

**Found running the r238 dynamic-page probe in game** (2026-09-28, game
1.3.13). Two observations we cannot explain from the SDK alone, and both bear
directly on whether "when the player visits page X" can ever be a no-code
node.

**1. Every page view appears to render twice.** A single open of
`/article/1` logs the page's own handler twice, about a second apart:

```
[16:47:04] [qe-sdk-024-dynprobe] article hit: id=1
[16:47:05] [qe-sdk-024-dynprobe] article hit: id=1
```

and a session counter inside `/state` read **2** on its first-ever open, then
**4** after one revisit. So a dynamic page's handler is invoked twice per
view. Is the second call a preview/title fetch, a redundant render, or
something we should be deduplicating? It matters: any page that counts or
mutates state per render will double-count.

**2. `Http.Response` did not reach the quest for these pages.** The quest was
claimed at 16:42:36, so its listeners were armed; the `/state` visits at 16:53
and 16:54 each logged twice from the page handler, but the quest's
`Events.on("Http.Response", …)` listener — which flips a phase on the first
`/state` hit — never fired, and `/news` never gained the article that flip
would have added. The mod declares the `events` permission. The probe logs an
`http-response …` line as soon as an event clears its host filter, and **no
such line appears anywhere in the log** — so either the event was never raised
for these pages, or it arrived with a `request.host` that did not match and
the filter dropped it before the log line. (A re-run probe that logs first and
filters second would separate the two; that is on us, not on the game.)

Note this is **consistent with what we already measured in r166**: mod-hosted
*static* sites load fine but do not tick `Http.Request`/`Http.Response`
either. So the most likely reading is that a mod's own sites are simply not
part of whatever emits those events.

**What we would like:**

- does `Http.Response` fire for pages served by a **mod-registered** website
  (static or dynamic), or only for the game's own generated sites? The
  harness's static site (`qe24-website.test`) is the control we can re-run if
  that helps;
- if it does fire, is the payload's `request.host`/`path` populated for these
  pages (that is what our per-page objectives match on)?
- and what is the second render — can a mod tell it apart from the first?

**Why it matters:** the "website-update nodes that fire only when the player
does X or reaches Y objective" idea depends on being able to observe page
views. Without the event, the only remaining route is for the page's own code
to call back into the quest — which is exactly the per-request-author-code
boundary the no-code editor cannot cross.

## 25. A mail addressed to a non-existent address is accepted, given an id, and then silently dropped

**Corrected 2026-10-02 (r250).** The finding this section used to report was
measuring our own test data, and it is withdrawn. What stands after the
correction is smaller — and it is about *silence*, not delivery.

### What we got wrong, and why it is worth writing down

For three rounds the probe sent test mails to `player@gomail.com`, and when
they never arrived we built theories about why the game had lost them: first
that the call was refused (`Mod "null"`, §14), then that it was accepted and
lost in delivery, then that the `to:` field itself was what lost a mail.

`player@gomail.com` is a placeholder that came out of this repo's own QA
project. **It has never existed.** The game's actual rule is the ordinary one —
a mail with **no `to` field goes to the player**, and an address that does not
exist is never delivered. Every one of those mails did exactly what it should
have. Three rounds of "findings" were the probe measuring its own typo.

The mail that reliably arrived — the startup mail from `OnStart()` — was the
control that proved the rule, since it is the only one that never carried an
address; we read it as a clue instead. The editor's own inspector already says
"Leave blank to send it to the player", and the compiler's tests have pinned
that default since round 2. The knowledge was in the repo; we did not look.

The lesson generalises: **before theorising about the engine, check the
literals.** Is this address real? Is this name the right one? Is this even the
call being made?

### What genuinely stands

1. **The failure is silent, and it returns an id.** `Mail.send` accepted a mail
   addressed to a non-existent mailbox and handed back a real-looking id
   (`yD1oMYYHUX` from page context, `ra1DgwPOsB` through the `Events.emit`
   bridge). The mail then simply never existed, and the caller has no way to
   tell a delivered mail from a dropped one. `Mail.sendBounce(failedRecipient)`
   exists for the player-facing version of exactly this — *"call this when the
   player emails an address that doesn't exist, so they get clear feedback
   instead of silence"* — which makes the mod-side silence look like an
   oversight rather than a decision.
2. **A page's `Mail.send` was NOT refused.** Both page-context sends returned
   ids, so §14's `Mod "null"` refusal did not happen here. That matters because
   the widely-circulated rule from another modder's notes — reproduced three
   times, for `Files.create` and `SaveStorage.set` — is that *any* permissioned
   call made directly from a page or an `Exports` function fails with
   `Mod "null"`. `Mail.send` did not. **The fence looks per-API, not blanket**,
   which changes what a page editor has to generate.
3. **Whether a page's mail actually arrives is unknown.** Because every
   page-context test used the placeholder address, we have never once sent a
   correctly-addressed mail from a page. Probe 1.4.0 does that — both buttons
   omit `to` entirely — so the question is open, not answered.

### What we would like

- **Should a `Mail.send` that cannot be delivered fail loudly?** Returning an
  id for a mail that will never exist is the worst of both worlds. Failing, or
  bouncing the way `Mail.sendBounce` does, would end this whole class of bug.
- **What is `to` for?** `MailDefinition.to` is `to?: string` with no
  documentation, while `Mail.send` is documented as *"Send an email to the
  player's inbox"*. If `to` names a recipient other than the player, a mail
  carrying one is not buggy when it fails to reach the player — but the
  docstring should say so, and the undeliverable case should be visible.
- **Is the page-context fence per-API?** `Files.create` and `SaveStorage.set`
  are refused from a page; `Mail.send` was not. A list of what a page may call
  directly would save every page author the detour.

<details>
<summary>The original report (r238–r249, now corrected)</summary>


### (original, filed 2026-09-28)

**Found running the r238 dynamic-page probe, confirmed by the player watching
his inbox** (2026-09-28, game 1.3.13). Related to §14, and worth filing
separately because the failure mode here is *silence*, not an exception.

A page's script called `HackhubSDK.Mail.send(...)` — the `HackhubSDK` global
really is injected into the page, so the call exists and ran. It reported no
error. **No mail ever arrived**: the player had his in-game inbox open in
another browser tab the whole time, and the quest's own `Mail.Sent` listener
never matched either.

**Update 2026-10-02 (third run): it is the `to:` field.** Of two test mails
sent from a trusted terminal command, **only the one with no `to:` field
arrived**. The one addressed to `player@gomail.com` was accepted — we have its
id — and never appeared. That leaves two explanations, and they need different
fixes: either that address does not exist and the mail is routed nowhere, or
**any** `to:` field sends the mail somewhere other than the player's inbox.
`Mail.send` is documented as *"Send an email to the player's inbox"* and `to`
is not documented at all, so a mod author filling it in — the obvious thing to
do — silently loses the mail. A fourth test (addressed to the player's real
address from `Mail.getPlayerEmail()`, plus a `Mail.getInbox()` roll-call to
tell "dropped" from "not drawn") is in the probe build 1.3.0.

**Update 2026-09-28 (second run): this is a DELIVERY problem, not a permission
refusal.** The rebuilt probe captured `Mail.send`'s return value instead of
discarding it, and the call was **accepted** — it returned a real mail id
(`yD1oMYYHUX`) from page context, and the `Events.emit` bridge version returned
another (`ra1DgwPOsB`). Neither mail arrived. So §14 is not what happens here:
the call is permitted and the mail is lost afterwards.

The one mail that has ever arrived from this mod is the startup mail from
`OnStart()` — and it is the only one carrying **no `to` field**. Both mails
that vanished specify `to: "player@gomail.com"`. Is a mail whose `to` does not
resolve (or is not the player's address) silently dropped?

*The original report, kept for the record — its §14 reading is now known to be
wrong. What still stands is the silence:*

- `Mail.send` is synchronous (`send(mail: MailDefinition): string | null`),
  and it did **not** throw — our page's `try/catch` would have printed the
  error, and §14 shows these refusals *do* throw for `UI.*`. So this one
  failed **silently**, most likely by returning `null` while the caller had
  no way to tell. The mod author's own error handling reported success.

**The permission is not in question, and we can now show it with a clean
A/B** — same mod, same `mail` permission, same session, only the calling
context differs:

| Sent from | Arrived? |
|---|---|
| the quest's `OnStart()` — trusted mod context | **yes** |
| the page's own button via `HackhubSDK.Mail.send` — page context | **no**, silently |

(That also rules the recipient out: the `OnStart` mail carries no `to` field
and still landed.) And §14 records a mod that declared `"ui"` and was refused
anyway, with the mod named `null`. So this is not a manifest problem.
- Nothing surfaces to the player either: no mail, no toast, no log line.

**What we would like:**

- confirmation that page-context calls to permissioned APIs are refused (and
  that `Mail.send` in particular needs the `Events.emit()` → top-level
  `Events.on()` bridge);
- if a call is refused, **reject the promise and log it** — a silent no-op
  that the caller's own error handling reports as success is the worst
  possible failure mode for an author;
- **confirmed: a mail with a `to:` field is silently dropped; the same mail
  without one arrives.** So — **what is `to` for?** If it names a recipient
  other than the player, then `Mail.send` should not be documented as "send an
  email to the player's inbox", and a call that cannot be delivered should
  fail loudly instead of returning an id. If it is meant to be validated,
  which addresses are valid, and what happens to one that is not?;
- is a `to` address that does not resolve the trigger, or does **any** `to:`
  lose the mail? Probe 1.3.0 sends a mail to the player's real address
  (`Mail.getPlayerEmail()`) to separate the two;
- if page scripts are meant to have a sanctioned way to act (the way
  `Exports` functions do), a documented one would save every modder this
  detour; in particular, **is an additional permission needed for a call made
  from a page's own script**, or is `mail` alone supposed to be enough?
- and if a call is refused, please **return `null` and log it** (or throw
  consistently, the way `UI.*` does) rather than failing in a way the caller
  cannot detect.

Our workaround, which we will generate automatically if we ever build a
no-code page editor: the page's action does a synchronous `Events.emit()`, and
a top-level `Events.on()` handler performs the real permissioned work.


</details>
