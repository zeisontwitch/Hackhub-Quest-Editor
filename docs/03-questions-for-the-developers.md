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

**Observed.** The pinned SDK has phone-call dialogs and `PhoneApp`, plus Mail/Kisscord/WeeChat messaging APIs, but no SMS/text-message namespace or event surface. Searches for `sms`, `text message`, and equivalent event names in `index.d.ts` / `reference/hackhub-events.json` do not find a native SMS API.

**Question.** Is native SMS planned for a later SDK? If yes, will it be quest-declared like phone-call dialog, an imperative namespace such as `SMS.send(...)`, an event surface for read/reply, or part of `PhoneApp`?

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
mid-session unload either. The one moment the hook could still run is the
**shutdown** that follows the queued disable, because the mod is still installed
while the game is closing; whether it does is being measured now (T-15c: the
game's own log file, searched for `[quest-editor]` — the lines
`unloading: removing the Twotter accounts this mod declared` and
`twotter: removeUser(...) -> true (mod unloaded)` — plus an audit of the handle
after the reload). Two outcomes, and they
are different reports:

- **the line appears** → the hook works and the docs are only loosely worded; the
  unreachable case is a mod deleted from disk while the game is closed;
- **no line** → the cleanup path the SDK's own documentation names for a
  user-initiated disable does not run at all, and the only case that ever cleans
  up is a quest ending. That is a stronger finding than this question currently
  claims, and it would be a bug report rather than a feature request.

**Question.** Should a mod's own data be cleaned up when the game notices its
package is gone — e.g. at save load, drop the mod-declared accounts and posts
whose owning package is no longer installed, the way the quests are dropped? As
a mod author I cannot reach that moment: the only hook I have runs while I am
still loaded, and by then the player either completed the story (our account is
removed, verified) or uninstalled us, which is the case we cannot see.

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
