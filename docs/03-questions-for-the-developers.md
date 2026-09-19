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
