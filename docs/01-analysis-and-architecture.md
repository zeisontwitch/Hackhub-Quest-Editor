# Step 1 — HackHub Schema Analysis & Quest Mod Editor Architecture

> **Scope of this document:** Step 1 of the build plan. It records what the HackHub
> modding surface actually is (verified, not guessed), the tech stack proposed for the
> editor, and the architecture the editor will be built on.
>
> **Sources, and how they were verified.** The docs site
> (`https://docs.hotbunny.dev/hackhub/`) was read in full for the guides and reference
> pages. Because prose docs drift, every type in this document was cross-checked
> against the **published SDK's own type declarations**:
> `@hotbunny/hackhub-content-sdk@0.21.0` (`index.d.ts`, 2,898 lines) plus its build
> helper (`build.mjs`, 303 lines). Where the two disagree, that is called out
> explicitly in [§7](#7-drift-between-the-docs-and-the-published-sdk) rather than
> silently smoothed over.

---

## 1. What a HackHub mod actually is

The single most important finding, because it dictates the entire export engine:

> **A HackHub mod is not a data package. It is a TypeScript project that compiles to
> CommonJS.**

There is no JSON-only mod format. `QuestObjectiveTrigger.condition` is typed as
`(data: any) => boolean` — a *function*. Message chains take `onSent?: () => void`
callbacks. Dialog options take `onSelect`. Website dynamic pages take a
`metadata(context)` function. None of that is expressible as data.

Therefore the "export engine" is a **code generator that emits real TypeScript
source**, and the user's `npm install && npm run build` is not an optional nicety —
it is the step that turns our generated source into the `dist/mod.js` the game loads.

### 1.1 Project layout (verified against `build.mjs`)

```
my-mod/
├── manifest.json              # → copied verbatim to dist/manifest.json
├── package.json
├── tsconfig.json              # must set experimentalDecorators + strict
├── esbuild.config.ts
├── cover.png                  # any root-level asset → copied to dist/
├── public/                    # copied verbatim into dist/
└── src/
    ├── types.d.ts             # auto-created: declare module "*.html"
    ├── index.ts               # build entry point → dist/mod.js
    ├── quests/*.quest.ts
    ├── websites/*.site.ts  +  websites/<site>/pages/*.html
    ├── commands/*.command.ts
    ├── apps/*.app.ts       +  apps/<app>/app.html
    └── phone-apps/*.phone.ts + phone-apps/<app>/app.html
```

The SDK ships `buildMod()` / `htmlAssetsPlugin()` from
`@hotbunny/hackhub-content-sdk/build`. Its exact esbuild configuration is:

```js
{
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/mod.js",
  format: "cjs",
  platform: "neutral",
  target: "es2020",
  external: ["@hotbunny/hackhub-content-sdk"],
  loader: { ".html": "text" },
  plugins: [htmlAssetsPlugin()],
}
```

Other verified behaviours of `buildMod()` the exporter must respect:

| Behaviour | Consequence for our exporter |
|---|---|
| `validateProject()` auto-creates `src/types.d.ts`, `public/`, and patches `manifest.apiVersion = 1`, `tsconfig.experimentalDecorators/strict` | We should emit these correctly anyway, so the build is clean and silent |
| `src/**/*.html` is mirrored into `dist/` **preserving path relative to `src/`** | Website/app HTML must live under `src/`, not `public/` |
| Assets referenced from `.ts` as quoted relative paths are copied to `dist/<that path>` | Asset placement convention matters — see §1.4 |
| `htmlAssetsPlugin` copies `src=`/`href=` relative refs out of HTML into `dist/` | HTML-local assets work if they sit next to the HTML |
| manifest + root assets + `public/**` → `dist/` | `cover`/`icon` referenced from `manifest.json` belong at project root |

### 1.2 `manifest.json`

```jsonc
{
  "id": "lowercase-hyphenated",        // required, unique
  "name": "Display Name",              // required
  "version": "1.0.0",                  // required, semver
  "author": "Name",                    // required
  "description": "…",                  // required
  "apiVersion": 1,                     // optional, defaults to 1
  "permissions": ["events", "network"],// optional — see below
  "dependencies": ["other-mod-id"],    // optional
  "icon": "icon.png",                  // optional
  "cover": "cover.png",                // optional, 16:9, ≥640×360
  "tags": ["quest", "network"]         // optional, Workshop categories
}
```

**Permissions are a hard gate, and there is a trap.** The seven permissions and what
they unlock:

| Permission | Namespaces unlocked |
|---|---|
| `filesystem` | `Files` |
| `network` | `Network`, `Database` |
| `events` | `Events` (and `Quest.claim()`) |
| `mail` | `Mail` |
| `bank` | `Bank` |
| `shell` | `Shell` |
| `ui` | `UI` |

- `"permissions": []` means **nothing** is available.
- **Omitting** the field means **everything** is available (deprecated, warns on load).

So an editor that silently omits `permissions` produces a mod that works for the
author and behaves differently for everyone else. **The editor must compute the
permission set from the graph** — this is a first-class feature, not an afterthought.

Always available with no permission: `Storage`, `SaveStorage`, `Variables`,
`SharedStorage`, `SharedVariables`, `ModSettings`, `Random`, `Twotter`, `Kisscord`,
`WeeChat`.

### 1.3 Registration model

Six decorators, six base classes — this is the complete content surface:

| Decorator | Base class | Produces |
|---|---|---|
| `@RegisterModPackage` | `Bootstrap` | exactly one mod entry point |
| `@RegisterQuest` | `Quest<T>` | a quest |
| `@RegisterWebsite` | `Website` | an in-game website |
| `@RegisterCommand` | `Command` | a terminal command |
| `@RegisterApp` | `App` | a desktop app |
| `@RegisterPhoneApp` | `PhoneApp` | a phone home-screen app |

Plus `Bootstrap.Settings` / `Bootstrap.SettingsHTML` for mod settings (mutually
exclusive — if `SettingsHTML` is set, `Settings` is ignored).

### 1.4 Asset-path convention (a real footgun)

`build.mjs` copies an asset to `dist/<path-as-written-in-the-source-file>`, resolved
against **the importing file's directory**. So `Icon = "./assets/icon.png"` written
inside `src/websites/x.site.ts` expects the file to physically exist at
`src/websites/assets/icon.png`.

The editor therefore adopts one explicit convention and enforces it everywhere:

- **`manifest.icon` / `manifest.cover`** → project root (documented, copied by `prepareDist`).
- **Icons/avatars/media referenced from TypeScript** → `public/…`, referenced as
  `mod-asset://<path>` (the `mod-asset://` protocol is documented in the WebView
  Context Bridge reference, and `public/` is copied verbatim).
- **Assets referenced from HTML** → colocated with the HTML, referenced relatively
  (handled by `htmlAssetsPlugin`).

> ⚠️ *To verify in-game:* the `mod-asset://` resolution root. The docs confirm the
> protocol exists and show `icon: "mod-asset://icon.png"`, but do not state the root
> unambiguously. The exporter will make the convention configurable and the export
> report will list every asset path it emitted, so this is trivially checkable in one
> play-through.

---

## 2. The complete API surface (verified)

Counts measured directly from `index.d.ts`:

- **92** typed game events in `ModEventMap`
- **23** API namespaces
- **6** register decorators / base classes
- **7** permissions

### 2.1 Namespaces

| Namespace | Permission | Editor relevance |
|---|---|---|
| `Events` | `events` | Every trigger node |
| `Files` | `filesystem` | Player-PC file drops, `createTree` |
| `Network` | `network` | Networks, Wi-Fi, firewalls, ports, domains |
| `Database` | `network` | sqlmap / DatabaseManager content |
| `Mail` | `mail` | E-mail editor |
| `Bank` | `bank` | Payments, withdrawals |
| `Shell` | `shell` | `addCommandData` — faking `nmap`/`hydra`/`whois`/`lynx`/`geoip`/… results |
| `UI` | `ui` | Notifications, toasts |
| `Twotter` | — | Twitter-like accounts & tweets |
| `Kisscord` | — | Discord-like DMs |
| `WeeChat` | — | IRC servers & messages |
| `Storage` / `SaveStorage` / `Variables` / `SharedStorage` / `SharedVariables` | — | State |
| `ModSettings` | — | Player-facing config |
| `Random` | — | `randomIp`, `password`, `pick`, `id`, `uuid`, `number` |
| `Theme` / `Menu` / `Desktop` / `ContextMenu` / `Handbook` | — | Cosmetics & extensions |

### 2.2 The `Quest` class — the heart of the graph

```ts
abstract class Quest<T> {
  // identity
  Name: string; Title: string; Description?: string; Icon?: string;
  Group?: "storyline" | "side" | "sandbox";        // default "sandbox" for mods

  // gating & rewards
  Rewards?: { money: number; xp?: number };
  Employer?: Partial<{ firstName; lastName; email; avatar }>;
  AutoStart?: boolean; AutoComplete?: boolean;
  QuestsToComplete?: string[]; MaxClaim?: number; MaxClaimPerDay?: number;
  Abandonable?: boolean; HasCompleteButton?: boolean;

  // content, declaratively attached
  Objectives: QuestObjectiveDefinition[];
  TwotterAccounts?: TwotterAccountDefinition[];
  Tweets?: TweetDefinition[];
  KisscordChats?: KisscordChatDefinition[];
  WeeChatChats?: WeeChatChatDefinition[];
  Mails?: QuestMailDefinition[];
  Dialog?: QuestDialogDefinition;                   // phone-call tree
  HackhubPost?: QuestHackhubPostDefinition;         // feed discovery

  // runtime
  Data: T;  Events: QuestEvents;
  OnStart(); OnObjectivesStart(); OnComplete(); OnAbandon();
  CreateData(): T | Promise<T>;
  SetData(k, v); completeObjective(name);
  sendMail(index, from?, to?); createDialog(branch?, startIndex?);
  static claim(quest: string | typeof Quest);
}
```

**The lifecycle split is the #1 correctness rule for generated code:**

| Hook | Runs | Put here |
|---|---|---|
| `OnStart()` | **once**, at claim | One-time world setup: build networks, create NPCs, post tweets, seed databases |
| `OnObjectivesStart()` | on claim **and on every game start** | **All event listeners.** Listeners live in memory and are wiped on reload |
| `OnComplete()` / `OnAbandon()` | terminal states | Cleanup: `destroyNetwork`, `removeCommandData`, `closePort` |

A listener registered in `OnStart()` silently stops working after the player reloads
the game, and the quest becomes unwinnable. The compiler enforces this by
construction: listeners are only ever emitted into `OnObjectivesStart()`.

### 2.3 Objectives and triggers

```ts
interface QuestObjectiveDefinition {
  name: string;             // unique id
  description: string;      // player-visible
  info?: string; hint?: string; terminalCommand?: string;
  hidden?: boolean;
  unlocksAfter?: string[];  // prerequisite objective names
  trigger?: { event: string; condition: (data: any) => boolean };
}
```

`unlocksAfter` gives us the DAG for free; `trigger` gives us declarative completion
that is re-attached automatically on every load. **The compiler prefers a declarative
`trigger` whenever a node's condition is expressible as a pure expression, and falls
back to an explicit `this.Events.on(...)` + `completeObjective()` when it is not**
(e.g. when the handler has side effects like sending a reply).

### 2.4 Network — routers, firewalls, Wi-Fi, domains

Device types: `ROUTER`, `DEVICE`, `FIREWALL`, `SPLITTER`, `PRINTER`, arranged as a
tree (`children` on Router/Splitter).

- **Ports** — `{ external, internal, active?, locked?, service?, version? }`;
  `openPort`/`closePort`/`addPort`/`removePort` accept a router IP *or any child
  device IP*. Closing internal-22 force-disconnects live SSH sessions.
- **Firewalls** — a `FIREWALL` node carries `rules: FirewallRule[]`
  (`{ allowed, port, source?, destination?, locked? }`).
- **Router intrusion routes** — two fields decide *how* a player gets in:
  - `model` (e.g. `"TP-Link Archer C6"`) enables the in-game **`fern`** route:
    `fern "<model>"` recovers the password.
  - `accessable: true` enables the **support-mail recovery** route: the player emails
    the vendor and a bot replies with credentials.
  - Set neither and the router has no intended way in. This is a *modelling
    primitive* the editor must surface as an explicit choice, not a checkbox footnote.
- **Wi-Fi** — ~~`Network.createWifiNetwork({ ssid, password, signal, … })`~~
  **Correction (round 18, verified against SDK 0.21.0's `index.d.ts`): there is no
  Wi-Fi creation API.** The `Network` namespace only creates subnet networks; a
  read-only `WifiNetwork` info type and the `Network.WifiConnected` event exist, but
  mods cannot spawn wireless networks. The editor keeps the node (it feature-detects
  `Network.createWifiNetwork` at runtime) and exports it as a regular router network
  meanwhile.
- **Domains & vulns** — `registerDomain(domain, ip, vulnerabilities?)` with
  `SQL_INJECTION | XSS | CORS | SSRF | LFI | RFI | RCE`; these drive `nuclei` and
  `sqlmap` results.
- **Filesystem on remote devices** — `NetworkUser.files` mounts under
  `/home/<username>/…`; `rootFiles` mounts at `/`, and a folder named `etc`, `home`,
  `logs`, or `lib` is **merged** rather than duplicated.

### 2.5 `Shell.addCommandData` — scripting tool output

This is how a mod fakes reconnaissance results. Built-in commands are fully typed:

| Command | Input key | Data shape |
|---|---|---|
| `nmap` | `string` (IP) | `{ port, status: OPEN\|CLOSE\|FORWARDED\|FILTERED, service, version?, destination? }[]` |
| `hydra` | `{ user, target }` | `{ credentials: { username, password } }` |
| `whois` | `string` | `{ ip?, domain?, contact?, email?, status? }` |
| `nslookup` / `mxlookup` | `string` | `string` |
| `ping` | `string` | `boolean` |
| `lynx` | `string` | `{ socialMedia?, ips?, address?, additional?, contact? }` (OSINT) |
| `geoip` | `string` | `{ country, city, latitude, longitude }` |
| `ssh` | `{ host, key }` | `{ ip, status }` |
| `ftp` | `{ host, username, password }` | `string \| null` |
| `weechat` | `{ host, password }` | `boolean` |

Mod-defined commands accept arbitrary input/data. This maps directly onto a
**"Tool Response" node** in the editor.

### 2.6 Websites

```ts
abstract class Website {
  SiteName: string; Host: string; Icon: string;
  Pages: (WebsitePageDefinition | DynamicWebsitePageDefinition)[];
  Popular?: boolean;
  Exports?: Record<string, any>;   // becomes globals in page HTML
}

interface WebsitePageDefinition {
  path: string; title: string; html: string;
  seo?: boolean;          // ← discoverable in in-game search
  description?: string;   // search-result snippet
  search?: string[];      // extra ranking keywords
}
```

Pages link to each other with ordinary `<a href>`; the browser intercepts. From page
JS: `HackhubSDK.Browser.navigate(url)` / `.push(url)`.

### 2.7 **dirhunter** — how hidden directories actually work

The relevant event is:

```ts
interface DirhunterEvent { host: string; results: string[]; }
// registered as "Terminal.Dirhunter"
```

Note there is **no** `dirhunter` entry in `Shell.CommandDataMap`, so dirhunter output
is *not* scriptable the way `nmap` is. What dirhunter discovers is derived from the
site's own page set. Combined with the documented meaning of `seo` — *"If true, page
appears in browser search results"* — the mechanism is:

> A page **is** reachable by URL but is **not** in the search index unless
> `seo: true`. dirhunter is the tool that brute-forces those unindexed paths.

So "hiding a clue in a sub-directory" is:

1. Add a page at a guessable-but-unlisted path, e.g. `/admin/backup/`, `/old-site/`,
   `/.git/config`, `/dev/notes`.
2. Leave `seo` **off** → invisible to Goagle search, still routable.
3. Put the clue in the page HTML (a password, an IP, an e-mail address).
4. Attach a **`Terminal.Dirhunter`** trigger node with the condition
   `data.host === "<Host>" && data.results.includes("/admin/backup/")` to complete the
   objective; optionally also `Browser.WebsiteOpened` / `Browser.Meta`
   (`{ pathname, … }`) for "player actually opened it".

The editor exposes this as a single first-class affordance on a page:
**"🔒 Hidden page — discoverable only by dirhunter"**, which sets `seo: false`,
auto-suggests realistic hidden paths, and offers to spawn the matching trigger node.

> ⚠️ *To verify in-game:* the exact string format of `DirhunterEvent.results`
> (leading slash, trailing slash, host-prefixed or not). The editor will emit the
> condition as a tolerant match (normalise slashes, `includes` on a trimmed path) so
> it survives either format, and the export report will print the emitted condition.

### 2.8 Communication channels — what exists and what does not

| Requested channel | Real HackHub primitive | Status |
|---|---|---|
| Phone **calls** | `Quest.Dialog` + `createDialog(branch)` | ✅ Full branching tree: `speaker`, `text`, `audio?`, `isEnd`, `timeout`, `options[]` with `label`/`text`/`switchBranch`/`nextIndex`/`isEnd`/`onSelect` |
| **E-Mail** | `Quest.Mails` + `sendMail(i)`, and `Mail.send()` / `Mail.sendBounce()` / `Mail.registerTemplate()` | ✅ Rich: `from`, `to`, HTML body, `metadata`, `attachments[]` |
| **Kisscord** | `Quest.KisscordChats` and/or `Kisscord.*` | ✅ `contactId` + ordered `messages[]` with `content`, `isMine`, `delayMs`, **`unlocksAfter`**, `onSent` |
| **WeeChat** | `Quest.WeeChatChats` and/or `WeeChat.createServer(host, password)` | ✅ `host`, `messages[]` with `content`, `username`, `isMine`, `delayMs`, `onSent` |
| Phone **text messages (SMS)** | **no SMS namespace exists** | ❌ **Dropped — see below** |
| **Twotter** | `Quest.TwotterAccounts` / `Tweets`, `Twotter.*` | ⛔ **Withdrawn in round 31 — the API works, the game does not** (see note) |

**The Twotter withdrawal (round 31).** The SDK surface above is real and the editor
did ship it for twenty-odd rounds. It was removed after seven in-game QA rounds
proved the *engine* cannot store what it accepts: a quest-declared
`TwotterAccountDefinition` becomes a `TwotterUser` in the save whose `bio` is
`undefined`, and the game's Twotter search calls `.toLowerCase()` on that field for
every record it tests. Searching any word that does not match something sooner
crashes the game — and because the record lives in the save, it keeps crashing
after the mod is uninstalled. There is no `Twotter.removeUser`, reads hand back a
copy so the record cannot be patched, and writing a complete record back with
`addUser` left it unchanged. Nothing a mod can do fixes it, so the editor no longer
offers a “Post tweet” node or quest Twotter accounts. Older projects are migrated
rather than rejected (`src/schema/migrate.ts`). The full evidence trail is in
[docs/02 “Round 29–31”](02-editor-shell.md).

**The SMS gap — and its resolution.** Neither the published `index.d.ts` (all 2,898
lines) nor any docs page exposes an SMS/text-message API. Phone *calls* exist
(`Quest.Dialog` + `createDialog`); texts do not.

The requested "Phone text messages" editor therefore **does not ship**. Rather than
simulate SMS on top of Kisscord or fabricate a fake Messages app — both of which would
look native in the editor and not be native in the game — the requirement is dropped
and recorded here so it is not re-litigated later. The four conversation editors that
*do* ship are **Phone calls, E-Mail, Kisscord and WeeChat**, each backed 1:1 by a real
primitive. (Twotter was a fifth channel until round 31 — see the note above.) See
[§8](#8-settled-decisions).

**`unlocksAfter` on messages is the key progression mechanic** (SDK ≥ 0.18.0): the
chain plays to the first gated message at quest start, then *pauses*, and resumes
automatically — including across reloads — once every listed objective is complete.
This is exactly how a drip-fed conversation should work, and it maps perfectly onto
graph edges from objective nodes into message nodes.

### 2.9 Custom commands & their tools

```ts
abstract class Command {
  CommandName: string; Description: string;
  Autocomplete: { label: string; type: "IP"|"PORT"|"STRING"|"DOMAIN"|"MAC"|"FILE";
                  extension?: string; isFolder?: boolean }[];
  PackageName?: string;                 // if set → needs `apt-get install`
  Run(tools: CommandTools): void | Promise<void>;
}
// @RegisterCommand({ default: true, scope: "local" | "remote" | "both" })
```

`CommandTools`: `println` (plain string, a styled `TextSegment`
`{ text, color, bold, italic, underline, dim }`, or an array mixing both),
`printError/Warning/Success/Info/Color`, `printTable`, `newLine`, `clear`,
`getArgs`, `parseFlags`, **`prompt(string | { label, password?, color? })`**, `sleep`,
`exec`, `lock/unlock/isLocked`.

**`tools.prompt()` is the primitive behind "Manual Input Mode"** — it is the only
place in the SDK where the game hands a mod a string the player typed.

### 2.10 The WebView Context Bridge

App, Phone App, Website and Settings HTML all run in a sandboxed WebView with a
`HackhubSDK` global exposing: `Files, Network, Events, Mail, Bank, UI, Storage,
SaveStorage, Variables, SharedStorage, SharedVariables, Shell, Twotter, Kisscord,
WeeChat, Random, ModSettings, Theme, Desktop, Menu, ContextMenu, Handbook`, plus
`Browser` (websites only), `Phone` (phone apps only) and `modId`.

`Exports` on `App`/`Website`/`PhoneApp` become **globals** in the HTML (also reachable
as `window.ModExports`).

**This is the primitive behind "Hackertyper Mode"** — a custom HTML surface can
implement any input behaviour and then `HackhubSDK.Events.emit(...)` a custom event
that a quest listener converts into `completeObjective()`.

---

## 3. The 92 events, categorised (the trigger palette)

> ⚠️ **Read this before trusting the docs' event tables.** Every payload below was
> read out of `ModEventMap` in `index.d.ts@0.21.0`. A large fraction of the payloads
> printed in the *Events guide* page are **stale** — for example the guide says
> `Terminal.NmapScan` is `{ ip, ports }` (it is `{ ip, versionScan? }`), that
> `Files.Open` is `{ filename }` (it is `{ app, data }`), and that `Quest.Claimed` is
> `{ questName }` (it is `{ name, id }`). An editor built from the guide's table would
> generate trigger conditions that never match, and the quests would silently never
> complete. **The editor's palette is generated from a typed catalogue transcribed from
> the SDK, not from the guide.** The full stale-payload list is in [§7](#7-drift-between-the-docs-and-the-published-sdk).

### 3.1 Recon & terminal

| Event | Verified payload |
|---|---|
| `Terminal.NmapScan` | `{ ip: string; versionScan?: boolean }` |
| `Terminal.Ping` | `{ ip: string; isUp: boolean }` |
| `Terminal.Nslookup` | `{ domain: string; ip: string }` |
| `Terminal.Mxlookup` | `{ domain: string; ip: string }` |
| `Terminal.Dig` | `{ target: string }` |
| `Terminal.Whois` | `{ domain: string; whois: any }` |
| `Terminal.Geoip` | `{ ip: string }` |
| `Terminal.Lynx.Search` | `{ query: string }` |
| `Terminal.Lynx.Lookup` | `{ data: any }` |
| `Terminal.Command` | `{ command: string; args: string[] }` |
| `Terminal.InstallPackage` | `{ cId: string; pkg: string }` |
| `Terminal.Cd` | `{ path: string }` |
| `Terminal.Ls` | `{ id: string; name: string }` |
| `Terminal.Cat` | `{ id: string; name: string; extension?: string; data?: string }` |
| `Terminal.Openssl` | `{ file: string }` |
| `Terminal.Ifconfig` | `{ terminalIp: string }` |
| `Terminal.Explorer` | `{ ip: string }` |

### 3.2 Directory brute-forcing & browser

| Event | Verified payload |
|---|---|
| **`Terminal.Dirhunter`** | **`{ host: string; results: string[] }`** |
| `Browser.WebsiteOpened` | `{ siteName: string; url: string }` |
| `Browser.Meta` | `{ href, protocol, slashes, auth, username, password, host, hostname, port, pathname, query, hash, origin }` — a fully parsed URL |

### 3.3 Access & exploitation

| Event | Verified payload |
|---|---|
| `Terminal.SSH.Connected` | `string` — the connected server IP, **not an object** |
| `Terminal.SSH.Disconnected` | `string` — the server IP |
| `Terminal.SSH.FileDownload` | `{ id: string; name: string; extension?: string }` |
| `Terminal.SSH.Shutdown` | `{ ip: string }` |
| `Terminal.FTP.Connect` | `{ ip: string; port?: number }` |
| `Terminal.Hydra` | `{ ip: string; port: number; wordlistFile: string; credentials?: { username; password } }` |
| `Terminal.Hydra.Try` | `{ ip: string; username: string; password: string }` |
| `Metasploit.Msfconsole` | `{}` |
| `Metasploit.Search` | `{ search: string; matchedModules: any[] }` |
| `Metasploit.Use` | `{ name: string; type: string }` |
| `Metasploit.ShowOptions` | `{ name: string; type: string }` |
| `Metasploit.SetOption` | `{ name: string; value: string \| number; allFilled: boolean }` |
| `Metasploit.Event` | `{ type: string; data: any }` |
| `Metasploit.Event.Try` | `{ exploit: string; target: string; options: any }` |
| `Metasploit.Rootgrab` | `{ ip: string; file: { id: string; name: string } }` |
| `Metasploit.Meterpreter.Connected` | `{ ip: string; session: any }` |
| `Meterpreter.Download` | `{ host: string; file: { id: string; name: string } }` |
| `RemoteConnection.Established` / `.Disconnected` | `{ ip: string; service?: string }` |

### 3.4 Cracking & vuln scanning

| Event | Verified payload |
|---|---|
| `Hashcat` | `{ id: string; name: string }` |
| `John.DecryptHash` | `{ hash: string; password: string }` |
| `Fern.FindPassword` | `{ user: any; model: string }` |
| `Subfinder.Try` | `{ domain: string }` |
| `Subfinder.Results` | `{ domain: string; subdomains: any[] }` |
| `Nuclei.Item` | `{ host: string; vulnerability: any }` |
| `Nuclei.Results` | `{ file: any; hosts: string[] }` |
| `Sqlmap.ListTables` | `{ host: string }` |
| `Sqlmap.DumpTable` | `{ host: string; tableName: string }` |

### 3.5 Bettercap & Wi-Fi

| Event | Verified payload |
|---|---|
| `Bettercap.Open` / `Bettercap.Close` | `{}` |
| `Bettercap.NetProbe` | `{ active: boolean }` |
| `Bettercap.NetShow` | `{}` |
| `Bettercap.WifiRecon` | `{}` |
| `Bettercap.WifiDeAuth` | `{}` |
| `Network.WifiConnected` | `{ ip: string; ssid?: string }` |

Note `Bettercap.WifiRecon` / `WifiDeAuth` / `NetShow` carry **no** payload in 0.21.0,
so "player de-authed *this specific* SSID" cannot be asserted from the event — the
editor must model that as "a Wi-Fi recon happened" plus a separate
`Network.WifiConnected` check.

### 3.6 Network & infrastructure

| Event | Verified payload |
|---|---|
| `Network.PortChanges` | `{ ip: string; port: number; active: boolean }` |
| `Network.UserActivity` | `{ userId: string; online: boolean }` |
| `NetworkPacketTransfer` | `{ from: string; to: string; type?: string }` |
| `Database.Connected` | `{ ip: string; database?: string }` |
| `Database.DataUpdate` | `{ table: string; data: any }` |
| `PFSense.Login` | `{ ip: string }` |
| `PFSense.Changes` | `{ old: any; new: any }` |

### 3.7 Files

| Event | Verified payload |
|---|---|
| `Files.Open` | `{ app: string; data: any }` |
| `Files.Transfer` | `{ type: "DOWNLOAD" \| "UPLOAD"; file: { id: string; name: string; extension?: string } }` |
| `Files.Deleted` | `{ id: string; name: string }` |
| `Python3.ExecFile` | `{ args: string[]; file: any }` |

### 3.8 Mail

| Event | Verified payload |
|---|---|
| `Mail.Received` / `Mail.Sent` / `Mail.Read` | `MailEvent` = `{ id, from, to, subject, content, sentAt, metadata? }` |
| `Mail.MailboxOpened` | `{ from: string; to: string; subject: string }` |
| `Mail.AccountCreated` | `{ email: string; password: string }` |
| `Mail.AccountLoggedIn` | `{ email: string }` |

`metadata` is the intended channel for "is this the phishing mail *we* sent?" — set it
on `Mail.send()` and read it back off the event.

### 3.9 Social & chat

| Event | Verified payload |
|---|---|
| `Twotter.AccountCreated` / `.AccountLogin` / `.AccountLogout` | `{ id: string; username: string }` |
| `Twotter.Post` | `{ questId: string; tweetIndex: number }` |
| `Twotter.PostSeen` | `{ id: string; userId: string }` |
| `Twotter.ProfileSeen` | `{ id: string; username: string }` |
| `Kisscord.FriendAdded` | `{ id: string; username: string; isFriend: boolean }` |
| `Kisscord.Messaging` | `{ channel: string; isMine?: boolean }` |
| `WeeChat.Connected` / `.Disconnected` | `{ host: string }` |
| `WeeChat.Message` | `{ host: string; username: string; message: any }` |

`Kisscord.Messaging.channel` is the **contact's user id**, and `isMine` tells you
whether the *player* just spoke — which is what makes "player replied in Kisscord" a
usable trigger.

### 3.10 Bank, quest lifecycle & misc

| Event | Verified payload |
|---|---|
| `Bank.Transfer` | `{ amount: number; from: string; to: string }` |
| `Bank.AccountCreated` | `{ id: string; IBAN: string; owner?: string }` |
| `Bank.Logout` | `{ id: string; IBAN: string }` |
| `Quest.Claimed` | `{ name: string; id: string }` |
| `AppStore.Downloaded` | `string` |
| `Process.Killed` | `{ pid: number; name: string }` |
| `Wireshark.Started` | `{ interface: string }` |
| `Wireshark.Stopped` | `{ interface: string }` |
| `BCC.News.Opened` | `{ articleId: string }` |

### 3.11 Custom events

`Events.register(name)` + `Events.emit(name, data)` / `Events.on(name, cb)`, with
optional `declare module "@hotbunny/hackhub-content-sdk" { interface ModEventMap { … } }`
declaration merging for type safety. Known game events dispatch to *both* the game bus
and the custom bus; unknown names go to the custom bus only.

**Custom events are the glue that lets a WebView drive the quest graph** — a
Hackertyper surface, a phishing form or a custom app calls
`HackhubSDK.Events.emit("<ModId>.<NodeId>.completed", …)` and a quest listener turns it
into `completeObjective()`. The editor namespaces every custom event it generates with
the mod id and the node id so multi-mod installs cannot collide.

---

## 4. Proposed tech stack

### 4.1 Stack

| Concern | Choice | Why |
|---|---|---|
| **Runtime** | **Vite + React 18 + TypeScript (strict)** | A pure client-side authoring tool. Nothing needs SSR, so Next.js would add a server runtime, RSC boundaries and a build step that buy nothing here. Vite gives instant HMR for a canvas app that re-renders on every drag. |
| **Node editor** | **`@xyflow/react`** (React Flow v12) | The requested library, and the right one: custom node types, custom edges, sub-flows/groups, minimap, controls, `onConnect` validation, hit-testable handles. We need *typed* handle validation (a trigger node may only accept a condition edge) which React Flow supports via `isValidConnection`. |
| **State** | **Zustand + Immer**, single serialisable `ProjectDocument` | The whole project must be one JSON-serialisable object so undo/redo, autosave and round-trip import/export are trivial. Zustand + Immer gives immutable patches for free; a snapshot history stack gives undo/redo. |
| **Schema validation** | **Zod** | One schema, used three ways: validate on import, drive the inspector forms, and generate the event/enum catalogues. Prevents "silently accepted a corrupt project". |
| **UI kit** | **Tailwind CSS + Radix UI primitives** | Radix gives accessible, unstyled, keyboard-navigable primitives (menus, dialogs, selects, tooltips, popovers) which is the bulk of the "sleek and modern" requirement; Tailwind gives the design system without a CSS-in-JS runtime in a canvas app. |
| **Rich text** | **TipTap** (ProseMirror) | Quest descriptions, mail bodies, dialogue lines. Bold/italic/link/list only — deliberately *not* a raw-HTML textarea. Mail bodies compile to the HTML string `Mail.content` accepts. |
| **Drag & drop (website builder)** | **`@dnd-kit/core` + `@dnd-kit/sortable`** | Accessible, pointer/touch/keyboard-friendly block reordering. React Flow's DnD is not suitable outside the canvas. |
| **Code view** | **Monaco**, *read-only by default* | A "Preview generated source" drawer. The requirement is to not expose JSON/code — a read-only preview respects that while giving power users trust and debuggability. Editable mode is an explicit opt-in per file. |
| **Export** | **JSZip + FileSaver** | Produce the whole mod project as a single `.zip` in the browser. Also emit a flat file-tree preview so users can see exactly what they're dropping into `mods/`. |
| **Testing** | **Vitest** (+ `@testing-library/react`) | The compiler is the highest-risk code in the product and is pure `ProjectDocument → string[]`. It gets snapshot + assertion tests. |
| **Lint/format** | ESLint + Prettier, generated code emitted **Prettier-formatted** | Generated mod source must look hand-written. |
| **IDs** | `nanoid` | Stable, short, collision-free node/objective/message ids. |

**Rejected, with reasons:**
- *Next.js* — no server requirement; adds complexity and a deployment target for a local tool.
- *Redux* — heavier ceremony for no benefit over Zustand here; we need Immer patches, which Zustand+Immer already provides.
- *Rete.js / Drawflow* — weaker custom-node ergonomics and smaller ecosystem than React Flow, which was also the requested library.
- *A JSON-schema-driven form generator* — seductive but produces mediocre UX. The inspectors are hand-built per node type; Zod is used for validation and catalogue generation, not for form layout.
- *Tauri / Electron desktop shell* — considered and **rejected as out of scope** (decision 1, §8). The app ships as a browser SPA whose export is a `.zip` download. Because nothing in the design assumes filesystem access, a desktop shell could still be added later without rework — but it is not on the roadmap.

### 4.2 Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Presentation  (React)                                                     │
│  ┌──────────┐ ┌───────────────┐ ┌──────────────┐ ┌───────────────────────┐ │
│  │ Node     │ │ Inspectors    │ │ Website      │ │ Conversation editors  │ │
│  │ Canvas   │ │ (per node     │ │ Builder      │ │ Phone · Mail ·        │ │
│  │ (XYFlow) │ │  type)        │ │ (WYSIWYG)    │ │ Kisscord · WeeChat ·  │ │
│  │          │ │               │ │              │ │ Twotter               │ │
│  └────┬─────┘ └──────┬────────┘ └──────┬───────┘ └───────────┬───────────┘ │
└───────┼──────────────┼────────────────┼─────────────────────┼─────────────┘
        └──────────────┴───────┬────────┴─────────────────────┘
                               ▼
              ┌────────────────────────────────┐
              │  ProjectDocument  (Zustand +   │  ← single serialisable tree
              │  Immer, zod-validated)         │  ← undo/redo, autosave, I/O
              └───────────────┬────────────────┘
                              ▼
        ┌─────────────────────────────────────────────┐
        │  ANALYSIS LAYER  (pure, no React)           │
        │  · graph validation (dangling, cycles,      │
        │    unreachable objectives)                  │
        │  · permission inference → manifest          │
        │  · topological ordering of objectives       │
        │  · trigger-expressibility analysis          │
        └───────────────────┬─────────────────────────┘
                            ▼
        ┌─────────────────────────────────────────────┐
        │  COMPILER  (pure: ProjectDocument → File[]) │
        │  emitManifest · emitBootstrap · emitQuest   │
        │  emitWebsite · emitCommand · emitApp ·      │
        │  emitPhoneApp · emitAssets · emitTooling    │
        │  + AST-free deterministic printer           │
        │  + Prettier pass                            │
        └───────────────────┬─────────────────────────┘
                            ▼
              ┌──────────────────────────┐
              │  EXPORT  →  mod.zip      │  (+ on-disk folder in the desktop shell)
              │  + ExportReport (audit)  │
              └──────────────────────────┘
```

**Hard rules for this architecture:**

1. **`ProjectDocument` is the only source of truth.** Nothing is derived and stored.
2. **Analysis and Compiler are pure functions with zero React imports.** They are the
   part that must be exhaustively tested.
3. **Codegen is deterministic.** Same document in → byte-identical files out. No
   timestamps, no random ordering. This makes diffs meaningful and snapshots stable.
4. **Every generated file carries a provenance header**
   (`// Generated by Quest Mod Editor — do not edit; re-exporting overwrites this
   file`) plus a machine-readable marker, and the `ProjectDocument` is embedded in the
   export as `.hackhub-quest-editor/project.json` so **an exported mod can be
   re-imported and edited again**. Round-tripping is a launch requirement.
   Per decision 4 (§8), regeneration is unconditional: the compiler never reads prior
   output, never merges, and never preserves hand-edits.

### 4.3 The graph model

A **project** contains one mod and **1..n quests** (plus shared websites, commands,
apps, phone apps). Each quest has its own canvas.

Node categories:

| Category | Nodes | Emits into |
|---|---|---|
| **Entry** | `Quest Start`, `Quest Complete`, `Quest Abandon`, `Game Load` | `OnStart` / `OnComplete` / `OnAbandon` / `OnObjectivesStart` |
| **Objective** | `Objective` (name, description, hint, info, suggested command, hidden) | `Objectives[]` |
| **Trigger** | `When Event` — one entry per catalogued event, with a typed, human-readable condition builder | `Objectives[].trigger` or `this.Events.on(...)` |
| **World** | `Create Network`, `Create Wi-Fi`, `Add Firewall Rule`, `Open/Close Port`, `Register Domain`, `Set Vulnerabilities`, `Create Database`, `Seed Files`, `Tool Response` (`Shell.addCommandData`) | `OnStart` |
| **Comms** | `Send E-Mail`, `Phone Call`, `Kisscord Message`, `WeeChat Message`, `Hackhub Feed Post` (`Tweet` withdrawn in round 31) | `Mails` / `Dialog` / `KisscordChats` / `WeeChatChats` / `HackhubPost` |
| **Reply** | `Player Reply` — **Hackertyper** or **Manual Input** (see below) | custom `Command` / custom App HTML + custom event |
| **Effect** | `Pay Money`, `Withdraw`, `Notify`, `Toast`, `Set Data`, `Claim Quest`, `Run Shell Command`, `Open Handbook` | imperative statements |
| **Flow** | `Branch` (if/else on a condition), `Delay`, `Random Pick`, `Sequence` (timed outputs), `Reroute`, `Group/Comment` | control flow in generated code |

**Edge types are typed and colour-coded**, and the canvas rejects invalid connections:

- `flow` (execution order) — neutral
- `unlock` (objective → objective) → `unlocksAfter`
- `condition` (trigger → objective) → `trigger` / `if` branch
- `data` (a value produced here, consumed there)

**Reply mechanics — how each maps to real primitives:**

- **Hackertyper Mode** → the editor generates a small, self-contained HTML surface
  (registered as a `Website` page, a desktop `App`, or a `PhoneApp`, chosen per node).
  The surface implements the keymash-reveal effect (any keypress advances a hidden
  cursor through a predefined string, with the terminal-green reveal animation), then
  calls `HackhubSDK.Events.emit("<ModId>.<NodeId>.completed", { … })`. A quest
  listener on that custom event completes the objective. Because it is real HTML+JS we
  author, the effect is exactly right and needs no engine support.
- **Manual Input Mode** → generates a `Command` whose `Run()` calls
  `tools.prompt({ label, password? })`, then matches the answer against an
  **exact string** or a **regex** the user configures through a friendly UI
  ("Contains / Equals / Matches pattern", with a live test box). Success follows the
  `success` edge (typically `completeObjective`); failure follows the `failure` edge
  (toast, lock the port, add a penalty objective, send an angry e-mail — whatever the
  author wires up). The same matcher is offered on the e-mail editor so "player
  replies to `it@corp.com` with the right phrase" branches too, via `Mail.Sent`.

### 4.4 Website Builder

Block-based WYSIWYG, not a raw HTML editor. A page is an ordered list of typed blocks;
the compiler renders them to the HTML string `WebsitePageDefinition.html` expects.

- **Blocks:** heading, text (rich), image, button/link, list, table, divider, code,
  quote, columns, spacer, HTML embed (escape hatch), and *domain* blocks — login
  form, phishing form, forum post, product card, news article, terminal window mock,
  comment thread, file listing, job listing, contact card.
- **Domain blocks are where the quest hooks live.** A login form block can be wired to
  "on submit → emit custom event → objective"; a contact card can carry the password
  the player is meant to find.
- **Templates:** Corporate, Hacker Forum, E-Commerce, News Outlet, Bank Portal,
  Government/Agency, Personal Blog, Darknet Market, Job Board, Phishing Lookalike,
  Router Admin Panel, Minimal Landing. Each ships with matching copy, palette and
  typography so a non-coder gets a believable site in two clicks.
- **Live preview** in a sandboxed `<iframe>` with a FirebearBrowser chrome mock
  (address bar showing the real `Host` + `path`), so what the author sees is what the
  player sees.
- **dirhunter integration** per §2.7: a per-page "Hidden page" toggle, realistic
  hidden-path suggestions, and one-click "create matching dirhunter trigger".
- **SEO panel** per page: `seo`, `description`, `search[]` — surfaced as
  "Show in in-game search results" + a snippet field + keyword chips, never as JSON.

### 4.5 Export output

```
<mod-id>.zip
├── manifest.json                  # permissions inferred from the graph
├── package.json                   # scripts: build / watch; devDep on the SDK + esbuild
├── tsconfig.json                  # experimentalDecorators + strict
├── esbuild.config.ts              # calls buildMod()
├── cover.png / icon.png           # root assets
├── public/…                       # mod-asset:// targets
├── src/
│   ├── types.d.ts
│   ├── index.ts                   # @RegisterModPackage Bootstrap (+ Settings)
│   ├── quests/<Name>.quest.ts     # generated from that quest's graph
│   ├── websites/<host>.site.ts
│   ├── websites/<host>/pages/*.html
│   ├── commands/<cmd>.command.ts
│   ├── apps/<app>.app.ts + app.html
│   └── phone-apps/<app>.phone.ts + app.html
├── .hackhub-quest-editor/
│   ├── project.json               # the ProjectDocument → re-importable
│   └── editor-version.json
└── README.md                      # "drop dist/ into mods/<mod-id>/, or npm i && npm run build"
```

Re-exporting a project **overwrites `src/` and the tooling files wholesale** (decision
4, §8). `.hackhub-quest-editor/project.json` is the only durable state, and the export
README states this in terms a non-coder will understand.

Plus an **Export Report** shown in-app before download: inferred permissions and
*why*, every emitted file, every asset path, every generated condition expression,
and any warnings (unreachable objectives, objectives with no completion path, a
router with no way in, a hidden page with no dirhunter trigger).

---

## 5. Template library (ships with the editor)

| Template | Teaches / exercises |
|---|---|
| **Hello Hack** | One objective, one event trigger. 60-second onboarding. |
| **Simple Linear Wi-Fi Hack** | `createWifiNetwork` → `Bettercap.WifiRecon` → handshake → `Fern.FindPassword` → `Network.WifiConnected` → `Terminal.SSH.Connected` → `Files.Transfer`. Router with `model` set so `fern` is the intended route. |
| **Phishing 101** | `Mail.registerTemplate` → `Mail.Sent` → matcher branch → `sendBounce` on a wrong address → `Kisscord` confirmation. |
| **The Insider** | Kisscord drip chain with `unlocksAfter`, WeeChat IRC server, `lynx` OSINT response. |
| **Behind the Firewall** | Router + `FIREWALL` child with rules, `Sqlmap` against a `Database`, `nuclei` vulns. |
| **Dirhunter Dead Drop** | Website with a hidden `/dev/notes` page, `Terminal.Dirhunter` trigger, `Browser.Meta` follow-up. |
| **Complex Branching Investigation** | The flagship: 3 chat apps + e-mail + phone call, 2 websites, a Wi-Fi network and a wired subnet, a firewall, a database, a Hackertyper decrypt surface, a manual-input passphrase gate with success/failure branches, `metasploit`/`meterpreter`, bank payout, Hackhub feed post for discovery. |

Each template is a `ProjectDocument` JSON in-repo, so templates are themselves
round-trip-tested by the compiler test suite.

---

## 6. Build plan for the remaining steps

| Step | Deliverable |
|---|---|
| **2 — Scaffolding** | Vite+React+TS project, design system, Zustand store + `ProjectDocument` zod schema, XYFlow canvas with typed nodes/edges, node palette, inspector shell, undo/redo, autosave. |
| **3 — Components** | Website Builder (blocks + templates + preview + dirhunter affordance); the six conversation editors; Hackertyper + Manual Input reply nodes; network/Wi-Fi/firewall/database inspectors; trigger condition builder driven by the 92-event catalogue. |
| **4 — Export** | Analysis layer (validation + permission inference), compiler, JSZip packaging, Export Report, round-trip import, Vitest suite over every template. |

---

## 7. Drift between the docs and the published SDK

Verified by diffing the docs pages against `@hotbunny/hackhub-content-sdk@0.21.0`.
There are two distinct kinds of drift, and they pull in opposite directions:

- **§7.1 — the docs promise more than 0.21.0's types declare.** The game is updated
  alongside the docs, so the docs describe the *newer* surface.
- **§7.2 — the Events *guide* page's payload table is older than the SDK.** Here the
  SDK is right and the guide is wrong.

The editor targets the documented superset for §7.1 features (with a version badge),
and targets the SDK for §7.2 payloads (the guide is simply stale).

### 7.1 Documented but absent from `index.d.ts@0.21.0`

| Documented feature | Present in 0.21.0? | Impact |
|---|---|---|
| `Network.createWifiNetwork(definition)` → returns router IP | ❌ | Required by the Wi-Fi templates. Compiler emits it; a minimum-SDK check flags it. |
| `Network.getWifiNetworks()` | ❌ | Same |
| `Network.getConnectedWifi()` | ❌ | Same |
| `Network.connectWifi(target, password)` → `Promise<boolean>` | ❌ | Same |
| `Network.disconnectWifi()` | ❌ | Same |
| `WifiNetworkDefinition` | ❌ | Same |
| `WifiNetwork.ip` | ❌ (`WifiNetwork` exists, no `ip` field) | Same |
| `UI.prompt({ label, password?, color? })` | ❌ (only `notify`, `toast`) | The docs' own Wi-Fi example calls it |
| `Network.WifiDisconnected` event | ❌ **not in `ModEventMap`** (0 of 92 keys) | Listed in three docs pages. The palette must omit it or gate it behind a version. |
| `SubnetNetworkDefinition.model` / `.accessable` | ✅ | OK — `fern` and support-mail routes |
| `KisscordMessageDefinition.unlocksAfter` | ✅ (SDK ≥ 0.18.0) | OK — drip-feed gating |
| `Mail.sendBounce`, `Mail.registerTemplate` | ✅ | OK |
| Styled `println` segments, `printColor` | ✅ (SDK ≥ 0.16.0) | OK |
| `prompt` object form | ✅ in types (SDK ≥ 0.21.0) | OK |
| `rootFiles` on subnet definitions | ✅ | OK |

### 7.2 Payloads where the Events *guide* page is wrong

Measured field-by-field. **Left = guide page, Right = `ModEventMap@0.21.0` (correct).**

| Event | Guide says | SDK actually is |
|---|---|---|
| `Terminal.NmapScan` | `{ ip, ports }` | `{ ip, versionScan? }` |
| `Terminal.Dirhunter` | `{ ip, directories }` | `{ host, results }` |
| `Terminal.Ping` | `{ ip }` | `{ ip, isUp }` |
| `Terminal.Whois` | `{ domain }` | `{ domain, whois }` |
| `Terminal.InstallPackage` | `{ name }` | `{ cId, pkg }` |
| `Terminal.Ls` | `{ path }` | `{ id, name }` |
| `Terminal.SSH.FileDownload` | `{ ip, filename }` | `{ id, name, extension? }` |
| `Terminal.Hydra` | `{ ip, username, password }` | `{ ip, port, wordlistFile, credentials? }` *(the guide's shape is `Terminal.Hydra.Try`)* |
| `Terminal.FTP.Connect` | `{ ip }` | `{ ip, port? }` |
| `Terminal.Dig` | `{ domain }` | `{ target }` |
| `Terminal.Mxlookup` | `{ domain }` | `{ domain, ip }` |
| `Terminal.Ifconfig` | `{}` | `{ terminalIp }` |
| `Terminal.Lynx.Lookup` | `{ query, results }` | `{ data }` |
| `Terminal.Explorer` | *(omitted)* | `{ ip }` |
| `Files.Open` | `{ filename }` | `{ app, data }` |
| `Files.Transfer` | `{ filename, direction }` | `{ type: "DOWNLOAD"\|"UPLOAD", file: { id, name, extension? } }` |
| `Metasploit.Search` | `{ query }` | `{ search, matchedModules }` |
| `Metasploit.Use` | `{ module }` | `{ name, type }` |
| `Metasploit.ShowOptions` | `{ module }` | `{ name, type }` |
| `Metasploit.SetOption` | `{ key, value }` | `{ name, value, allFilled }` |
| `Metasploit.Rootgrab` | `{ ip }` | `{ ip, file: { id, name } }` |
| `Meterpreter.Connected` | `{ ip }` | `{ ip, session }` |
| `Meterpreter.Download` | `{ ip, file }` | `{ host, file: { id, name } }` |
| `Hashcat.Event` | `{ hash }` | event is named **`Hashcat`**, payload `{ id, name }` |
| `Sqlmap.ListTables` | `{ ip, tables }` | `{ host }` |
| `Sqlmap.DumpTable` | `{ ip, table }` | `{ host, tableName }` |
| `Subfinder.Results` | `{ domain, subdomains }` | ✅ correct |
| `Bettercap.NetShow` | `{ devices }` | `{}` |
| `Bettercap.WifiRecon` | `{ networks }` | `{}` |
| `Bettercap.WifiDeAuth` | `{ ssid }` | `{}` |
| `Bettercap.NetProbe` | *(omitted)* | `{ active }` |
| `Network.UserActivity` | `{ ip, username }` | `{ userId, online }` |
| `Network.WifiConnected` | `{ ssid }` | `{ ip, ssid? }` |
| `PFSense.Changes` | `{ ip }` | `{ old, new }` |
| `Database.Connected` | `{ ip }` | `{ ip, database? }` |
| `Database.DataUpdate` | `{ table }` | `{ table, data }` |
| `Bank.AccountCreated` | `{ iban }` | `{ id, IBAN, owner? }` |
| `Bank.Logout` | `{}` | `{ id, IBAN }` |
| `Quest.Claimed` | `{ questName }` | `{ name, id }` |
| `Mail.Received` / `Mail.Read` | `{ from, subject }` / `{ id }` | `MailEvent` = `{ id, from, to, subject, content, sentAt, metadata? }` |
| `Mail.Account.Created` / `.LoggedIn` | *(dotted names)* | real names are `Mail.AccountCreated` / `Mail.AccountLoggedIn`, payload `{ email, password }` / `{ email }` |
| `Mail.Mailbox.Opened` | `{}` | real name `Mail.MailboxOpened`, payload `{ from, to, subject }` |
| `Twotter.Post` | `{ content }` | `{ questId, tweetIndex }` |
| `Twotter.Post.Seen` | `{ postId }` | real name `Twotter.PostSeen`, `{ id, userId }` |
| `Twotter.Profile.Seen` | `{ username }` | real name `Twotter.ProfileSeen`, `{ id, username }` |
| `Twotter.Account.*` | *(dotted names)* | real names `Twotter.AccountCreated` / `AccountLogin` / `AccountLogout`, `{ id, username }` |
| `Kisscord.FriendAdded` | `{ userId }` | `{ id, username, isFriend }` |
| `Kisscord.Messaging` | `{ contactId }` | `{ channel, isMine? }` |
| `Process.Killed` | `{ name, pid }` | ✅ correct (field order differs only) |
| `Python3.ExecFile` | `{ filename }` | `{ args, file }` |
| `Wireshark.Started` | `{}` | `{ interface }` |
| `Wireshark.Stopped` | `{}` | `{ interface }` |
| `BCC.News.Opened` | `{}` | `{ articleId }` |
| `Remote.Connection.*` | *(dotted names)* | real names `RemoteConnection.Established` / `.Disconnected`, `{ ip, service? }` |
| `Metasploit.Meterpreter.Connected` | listed as `Meterpreter.Connected` | real name is `Metasploit.Meterpreter.Connected` |
| `Terminal.Hydra.Try`, `Subfinder.Try`, `Nuclei.Item`, `Metasploit.Event.Try`, `NetworkPacketTransfer`, `AppStore.Downloaded`, `Mail.Sent`, `Twotter.AccountLogout` | *(absent from the guide)* | all present in `ModEventMap` |

**This table is the single strongest argument for having generated the editor's event
catalogue from `index.d.ts` rather than transcribing the guide.** Roughly half the
guide's payload entries would have produced trigger conditions that never fire.

### 7.3 Consequences for the editor

1. A machine-readable **SDK capability table** keyed by version lives in the repo and
   drives both the palette and validation.
2. Any node using a feature above the project's declared minimum SDK version shows a
   badge in the inspector and a line in the Export Report.
3. The generated `package.json` pins `@hotbunny/hackhub-content-sdk` to a version that
   actually supports everything the graph uses.
4. Conditions that depend on a payload whose shape has historically drifted (notably
   `Terminal.Dirhunter.results`) are emitted **defensively** — slash-normalised,
   `includes`-based — so they survive either format. The exact emitted expression is
   printed in the Export Report for one-glance verification in-game.


---

## 8. Settled decisions

These four materially changed the architecture, so they were put to the project owner
before Step 2 began. All four are now settled and the rest of this document reflects
them.

| # | Question | Decision | Consequence |
|---|---|---|---|
| 1 | **Delivery form** | **Browser app with ZIP export.** | Vite SPA, no server, JSZip packaging. A desktop shell is explicitly **out of scope** — not "later", out. The app must never assume filesystem access; export is a download, import is a file picker / drag-drop. |
| 2 | **SMS** | **Dropped.** There is no SMS primitive, so no SMS editor ships. | The conversation editors are **Phone calls, E-Mail, Kisscord, WeeChat** (+ Twotter as a bonus channel). No simulated SMS surface, no mapping layer, no half-native fiction. The §2.8 gap stays documented so nobody re-litigates it. |
| 3 | **Mod granularity** | **Many quests per mod, single-quest as the default new-project template.** | One `manifest.json`, 1..n quest canvases, shared websites/commands/apps, `QuestsToComplete` chaining between quests. New projects start with one quest so beginners never see multi-quest structure until they need it. |
| 4 | **Generated-code ownership** | **The editor owns it — always regenerate.** | `project.json` is the single source of truth. Re-exporting overwrites `src/` wholesale. Generated files carry a `// Generated by Quest Mod Editor — do not edit` header, and the README in the export says so. No merge logic, no ejected files, no way to silently lose work. Round-trip import is therefore always safe. |

### 8.1 What these decisions removed from scope

- No Tauri/Electron wrapper, no native file writes, no file watching.
- No SMS editor and no SMS-to-Kisscord bridge.
- No generated-code merge/preserve/eject machinery.
- No server component of any kind.

### 8.2 What they made simpler

- Export is a single pure function `ProjectDocument → Blob`. Trivially testable, and
  identical in every environment.
- Because regeneration is unconditional, the compiler needs no notion of "existing
  file state" — no diffing, no user-edit detection, no conflict resolution.
- Multi-quest support is a loop over quests plus a shared-asset registry, rather than a
  different data model.

