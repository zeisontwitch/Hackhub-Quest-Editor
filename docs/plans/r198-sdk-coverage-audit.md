# r198: what the SDK offers and the editor does not — a coverage audit

**Asked by Zeis, 2026-09-19:** after dropping the phone-proxy investigation,
"is there something else in the SDK we can't do in the editor yet?"

**How this was produced.** Every exported namespace in
`@hotbunny/hackhub-content-sdk@0.24.0` was listed from `index.d.ts`, and each one
was then matched against what the editor can emit: the node registry (40 node
types), the compiled runtime (`src/compiler/runtimeSource.ts`), and the project
schema (`src/schema/project.ts`). A namespace counts as **exposed** only when the
runtime actually calls it on behalf of an authored project — "there is a node
near it" is not enough, because the failure this audit is meant to prevent is an
author assuming a capability that never reaches the game.

## Exposed, and verified in game or by tests

| SDK surface | Through |
| --- | --- |
| `Events` (all 99 in the editor's list) | any **trigger** node, and objectives |
| `Network` (subnets, domains, firewalls, ports, Wi-Fi) | `world.network`, `world.domain`, `world.firewall`, `world.port`, `world.wifi` |
| `Database` | `world.database` |
| `Mail`, `Kisscord`, `WeeChat` | `comms.dialogue` (one node, three channels) |
| `Twotter` (create/add/update/remove user, post/remove tweet) | `comms.tweet` |
| `Shell` (command data) | `fx.shell`, `reply.input` |
| `Handbook` | `fx.handbook` |
| `Bank` (transaction, withdraw) | `fx.pay`, `fx.withdraw` |
| `UI` (notify/toast/prompt) | `fx.notify`, `fx.prompt` |
| `Random` | `flow.random` |
| `Time`, `Scheduler` | `flow.delay`, `flow.timer` |
| `Files` (create on a PC or device) | `world.files` ("Place files") |
| `SaveStorage`, `SharedStorage` | pack data, `fx.setData` |
| Quest lifecycle (`claim`, `complete`, `retire`, `unclaim`) | `entry.*`, `fx.*Quest` |
| `Website` + `RegisterWebsite` (static pages) | the website builder |

## Not exposed — real capabilities with no authoring path

Ordered by what an author would feel first. None of these is blocked by a game
bug; each is simply not built in the editor yet.

| # | SDK surface | What an author could do with it | Notes |
| --- | --- | --- | --- |
> **Probe result, 2026-09-19 (r200/r201): all four are answerable in this build.**
> Menu items appear (bottom strip; `section` has no visible effect), desktop
> widgets render a mod's own HTML (position and size honoured, `transparent`
> defaults to true), right-click items work for `file` and `desktop`, and
> localization translates with **30 languages** offered. So entries #2 and #3
> below stop being "not exposed" as soon as Stage B lands; the audit's remaining
> list is unchanged otherwise.

> **Probe status, 2026-09-19 (r200/r201).** Two of the entries below are now
> field-tested, and the first probe changed the order: **#2's desktop widgets and
> right-click items WORK** (a widget renders a mod's own HTML from a mod-relative
> path; a right-click entry appears on a file), and **#3 localization WORKS**
> (`t()` translates, placeholders substitute, a missing key echoes itself — and
> the game offers 30 languages). **Menu entries did not appear** in a first run
> and are being re-probed with all three section spellings. Two mechanics were
> learned the hard way and are now recorded in the plan: `transparent` defaults to
> **true**, so a widget that does not set it draws without its background, and the
> checked-in `qe24-widget.html` carries a dashed frame so a screenshot shows its
> size.

| 1 | **`PhoneApp` + `RegisterPhoneApp`** (`index.d.ts:2475`, `:4173`) | Install a real app on the player's phone: own HTML screen, icon, title, and the phone's native back button via `HackhubSDK.Phone`. A branded bank, a delivery tracker, a camera roll, a company intranet. | The closest thing to the website builder that exists in the SDK, and the editor already has an HTML pipeline for websites — this looks like the highest-value, lowest-risk addition. Needs a probe first (does an app appear in the phone's app list in 0.24? does the bridge behave?). |
| 2 | **`Menu.addItem`**, **`Desktop.addWidget`**, **`ContextMenu.register`** | Entries that live outside a quest: a menu item, a desktop widget/app icon, a right-click action. This is how a pack announces itself is installed. | Three small surfaces, same shape as `fx.handbook`'s registration. |
| 3 | **`Localization.register/registerAll/t/languages`** | Ship the same story in several languages, and let the game pick by the player's language. | The handbook already carries a language; quest text does not. For a non-English audience this is the difference between "usable" and "not". |
| 4 | **`Theme.register`, `injectCSS`, `setActive`** | A pack that looks like itself — its own palette and styling over the game's UI. | The editor authors themes for its own canvas already; the mapping is not obvious (selectors, scoping), so this one wants a probe and a narrow first cut. |
| 5 | **`Tour.start/stop`** | A guided tour that highlights parts of the UI — "look here, this is the app you just installed". | Builds on whatever the phone/menu work lands, and is the natural teaching tool for a pack's first five minutes. |
| 6 | **`ModSettings`** (`Bootstrap.Settings`) | Player-adjustable options for the pack in the Mods list: difficulty, tone, skip-the-fluff. | Declarative, so it is authoring-only surface — no runtime logic needed beyond reading the values. |
| 7 | **`Http` dynamic endpoints** (`registerHost`, `createServer`, `text/json/redirect/…`, `publish`) | A server that answers with something chosen at runtime — an API the player calls and reads, a page that differs per quest state. | The editor's websites are **static** pages (`Website` + `RegisterWebsite`). Note the separate fence: HTTP/curl *events* are held back pending upstream fixes, so a dynamic-endpoint node would want to land after that clears. |
| 8 | **`Http` interception** (`interceptEnabled`, `interceptQueue`, `interceptForward/Drop`) | The man-in-the-middle surface: catch the player's request and rewrite, drop or forward it — the classic hack-the-scenario beat. | No authoring path at all today; the `Http.Intercepted` event can be *listened to*, which is not the same as *doing* it. |
| 9 | **`Http.history`, `clearHistory`, cookies** | Gate story on where the player has browsed, or seed believable history before they arrive. | The QA harness reads history; the editor does not. |
| 10 | **`Bank.getBalance` / `getPlayerAccount`** | A condition on how much money the player has ("if you can't afford it, the story says so"). | Money *movement* is exposed; *reading* a balance is not. |
| 11 | **`Files` beyond placement** (`read`, `remove`, `rename`, `move`, `getChildren`, `exists`) | Delete a file you planted, move it, or branch on whether one exists. | Only "place files" is exposed. (Known related game bug: a file placed by a mod could not be deleted in game — `docs/05` BUG 8 — so verify before exposing deletion.) |
| 12 | **`Kisscord`** extras (`addFriend`, `changeStatus`, `getMessages`, `createUser`) | Make an NPC *friend* the player, change a status, or read a conversation as data. | Messaging is exposed through `comms.dialogue`; the rest is not. |
| 13 | **`Twotter.toggleLike`**, `getUserById` | Like a post as the player, or branch on an account by id. | Small; may be deliberate as-is. |
| 14 | **`Variables`** (per-mod memory), **`Time.scale`**, **`Scheduler.list/remaining`** | Mod-internal state, clock speed, job inspection. | Not authoring surfaces: `Variables` is memory for code, `scale` changes the game's clock, `list` is a diagnostic. Recommended: leave unexposed on purpose, and say so. |

## What is *not* on this list, and why

- **Picture on a tweet** — the SDK has no field for it (`TwotterTweet`, `:1943`),
  so there is nothing to expose. Question 10 asks the developers for one.
- **HTTP/curl and DNS collaborator authoring** — fenced, not missing: the nodes
  exist, the upstream events do not fire reliably yet (README limitations row).
- **Suspicion / log-forensics, SMS** — no SDK API exists at all. Not our gap.
- **NPC-to-NPC phone scene** — authorable today through the Dialogue node's call
  mode (free-text speakers, player lines optional). See the closing note in
  [`r171`](r171-inspector-polish-and-phone-proxy-investigation.md).

## Recommendation

If one thing is built next, it is **#1 (phone apps)**: it is the largest genuinely
missing capability, the game's phone is where this genre's stories live, and the
editor's existing HTML/website pipeline is most of the machinery. It needs a
harness probe first (does a registered `PhoneApp` appear and run in 1.3.1, and
what does the `HackhubSDK.Phone` bridge allow?), because every claim about the
phone so far has needed one.

**#2 and #3 are the cheap wins** — small declarative surfaces, no new runtime
concepts, and each one removes a "my pack feels half-installed" problem.

**Everything from #7 down should wait** for the HTTP/curl fence to clear or for a
tester to ask for it, and **#14 should be declared a non-goal** so nobody
wonders later.
