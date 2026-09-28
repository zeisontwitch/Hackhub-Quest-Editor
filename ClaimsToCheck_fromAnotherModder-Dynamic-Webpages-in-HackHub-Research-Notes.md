# Dynamic Webpages in HackHub — Research Notes

Sep 28, 2026

## Two Paths to Serve a Page

The engine has two separate mechanisms for serving web content in-game — often conflated even though they do different jobs.

| Mechanism | Registered via | How the browser finds it | Used for |
| --- | --- | --- | --- |
| `Website` (class, `@RegisterWebsite`) | `Host` string on the class | Direct string match against the list of all registered `Website` instances — confirmed from decompiled code (`dQn(host)` does `t7e().find(w => w.Url === host)`), no dependency on `Network.registerDomain` at all | In-game sites opened through the browser (Firebear) |
| `Http.registerHost(host, handler)` | `Http` namespace | A raw server on the simulated network — normally paired with `Network.registerDomain` so `nslookup`/`ping`/the firewall can also "see" that host (per the SDK's own doc comment) | Custom API endpoints/handlers, not an ordinary browsable page |
| `Http.publish(host, listing)` | Optional, on top of `registerHost` | Indexed by the in-game search engine (goagle.com) | A site that genuinely needs to be found via search — the SDK itself warns: never publish a target meant to be found through investigation instead |

**Implication for a WYSIWYG builder**: a "searchable" toggle and a "reachable via nslookup" toggle are two separate flags from "has a page that can be opened" — `Website.Host` alone is already enough for the site to open by typing its domain, regardless of network registration status.

## Static vs Dynamic Page — Exact Type Shapes

Straight from the SDK's `index.d.ts`, not a guess:

| Field | `WebsitePageDefinition` (static) | `DynamicWebsitePageDefinition` (dynamic) |
| --- | --- | --- |
| `path` | string | string |
| `title` | string, fixed at registration | absent — comes from `metadata()`'s result |
| `html` | string, fixed at registration | absent — comes from `metadata()`'s result |
| `description` | optional | absent — comes from `metadata()`'s result |
| `metadata` | absent | `(context: PageContext) => PageMetadata \| null`, called again on every navigation |
| `seo` | optional | optional |

`PageContext` handed to `metadata()`: `{ url, params, query, searchStr? }`. `PageMetadata` it must return: `{ title, description?, html, search?, exports? }`, or `null` to refuse the render (used in this project for dynamic 400/404 pages — see the working examples below).

**Precision note**: decompiled code was seen calling `metadata()` with an object shaped `{meta, url, data, pushUrl, setUrl}` — the `data`/`pushUrl`/`setUrl` fields are NOT in the public `PageContext` type. Flagging this as a raw observation from minified code, not a guaranteed API — it may be a different internal call path (e.g. link/bookmark validation), not the live render path. Don't design a builder feature on those fields without a live-test to confirm first.

## Critical Bug: metadata() Can Never Read SaveStorage Directly

A fully live-tested finding from this project (not an assumption): a `Website`'s `metadata()` function never succeeds at reading `SaveStorage`, on every invocation path tried — even though the write itself succeeds and other commands can read it back fine. The root cause is broader than just `SaveStorage`: mod identity only "sticks" through two specific invocation paths, shown below.

&#91;embedded content: the two paths that keep mod identity — every other path loses it\]

`Command.Run()` (a terminal command the player typed) and an `Events.on()` callback genuinely fired by a real in-game event — both are cases the engine's own dispatcher calls directly. Every other path (an `OnStart()`/`OnObjectivesStart()` body, a detached promise, a `Website.Exports` function called directly from a page's onclick) loses that identity.

### Experiment log (docs/bugs.md entry 20)

| # | Written from | Read from | Result |
| --- | --- | --- | --- |
| 1 | `SaveStorage.set()` inside `Website.Exports` | `metadata()` | Write logged fine, read always `(none)` — even across several reloads |
| 2 | `SaveStorage.set()` inside a top-level `Events.on()`, triggered via `Events.emit()` from `Exports` | `metadata()` | Same failure. But a plain `@RegisterCommand`'s `Run()` reading the SAME key succeeded — proving `SaveStorage` itself was fine |
| 3 | Same `Events.on()` handler, also writing `Storage`+`Variables` | `metadata()` | `metadata()` read `Storage`/`Variables` back correctly, `SaveStorage` alone stayed `(none)` — not blind to all state, specific to `SaveStorage` |
| 4 | `Variables.set()` directly inside `OnObjectivesStart()`'s own body | `metadata()` & `Command.Run()` | Both failed — the failure travels with HOW the value was written, not who reads it |
| 5 | Same write function, called from `Command.Run()` | `metadata()` | Worked, consistent across 6+ separate reads |
| 7 | `OnObjectivesStart()` registering `this.Events.on("Terminal.Nslookup", write...)` — the real write only fires once the player triggers that event | `metadata()` | Worked |

### The proven fix

```ts
override OnObjectivesStart() {
    this.Events.on("Terminal.Nslookup", () => {
        let value = SaveStorage.get<string>(KEY);
        if (!value) {
            value = Random.pick(candidates);
            SaveStorage.set(KEY, value);   // persistent source of truth
        }
        Variables.set(KEY, value);          // what metadata() actually reads
    });
}
```

`SaveStorage` stays the source of truth (safe to read/write from `Command.Run()`, `Events.on()` callbacks, or any lifecycle hook); `Variables` becomes a same-session read-side cache `metadata()` can actually see, re-synced every time the mod loads. Pick a trigger event guaranteed to fire before the player could reach any page that needs the resolved value.

## Related Bug: Files.create() and Friends Follow the Same Rule

`docs/bugs.md` entry 19 — the identical pattern, found earlier (2026-09-21), and it explains why the SaveStorage bug above happens. Six invocation paths for `Files.create()` were tested live:

| Path | Result |
| --- | --- |
| A detached `async` IIFE inside `OnObjectivesStart()` | Failed — `Mod "null" tried to use Files.create without "filesystem" permission`, despite the permission already being declared in the manifest |
| `async OnStart()` (the SDK's own `.d.ts` types this `void \| Promise<void>`, implying it's safe — it is not) | Same failure |
| A `Website.Exports` function called directly from a page's `onclick` | Same failure (reproduced 3 times to rule out a fluke) |
| A custom `@RegisterCommand`'s own `Run()` | Worked |
| A `Website.Exports` function that only does a synchronous `Events.emit()`, with the real write moved into a top-level `Events.on()` | Worked |

Same conclusion as the `SaveStorage` bug: permission/mod-identity is resolved from HOW the call was dispatched, not which module is executing. The fix: bridge through a synchronous `Events.emit()` from wherever the trigger lives, to a top-level `Events.on()` handler that actually does `await Files.create(...)`.

## Related Bug: Localization.t() Also Fails Inside metadata()

Found while debugging why new i18n strings weren't showing up on a page — not a stale build, not lazy-loading (both directly ruled out by reading the actual bundled `dist/mod.js`). `Localization.t()`'s per-mod key lookup only works inside `Command.Run()`, a real `Events.on()` callback, or a lifecycle hook's own body — but NOT inside `metadata()`. This is a NARROWER restriction than the `SaveStorage` bug above (which also fails inside a lifecycle hook body; `Localization` does not).

Same fix pattern: pre-resolve every string once from a trusted context, cache it in `Variables` (still template-unresolved), read the cache inside `metadata()`, interpolate `{{var}}` locally instead of calling `Localization.t()` again:

```ts
// Inside OnObjectivesStart() (a trusted context):
const cache: Record<string, string> = {};
for (const key of allSiteKeys) cache[key] = Localization.t(key);
Variables.set(SITE_STRINGS_KEY, cache);

// Inside metadata() / localizeHtml():
const cache = Variables.get<Record<string, string>>(SITE_STRINGS_KEY) ?? {};
const resolved = (cache[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_m, v) => String(vars?.[v] ?? ""));
```

## Two Proven, Already Live-Tested Working Examples

**Protocol gating** (`src/websites/shared/page-guards.ts`, this project) — the page's content changes based on the target device's real port status, safe because it reads `context.url`, never `SaveStorage`:

```ts
export const requireHttps = (context: PageContext): PageMetadata | null => {
    if (context.url.startsWith("https:")) return null;
    return { title: "400 Bad Request", description: "Insecure request rejected.", html: httpErrorPage };
};

export const securePage = (path, html, title, description): DynamicWebsitePageDefinition => ({
    path,
    metadata: (context) => requireHttps(context) ?? { title, description, html: localizeHtml(html) },
});
```

**Language switching** (`localizeHtml`) — swaps `{{t:KEY}}` placeholders in raw HTML using a pre-resolved string cache (the exact fix pattern from the bug above):

```ts
export const localizeHtml = (html: string): string =>
    html.replace(/\{\{t:([A-Za-z0-9_.]+)\}\}/g, (_match, key) => siteT(key));
```

Both are safe to call inside `metadata()` because neither ever touches `SaveStorage`/`Localization.t()` directly — exactly the proven-working pattern above.

## Website.Exports — Mod-Side Functions Inside the Page

An optional field on the `Website` class: `Exports?: Record<string, any>`. Every key becomes a directly-callable global inside that page's own `<script>` (also reachable via the `ModExports` namespace):

```ts
class MyWebsite extends Website {
    Exports = { formatPost: (text: string) => text.toUpperCase() };
}
```

```html
<script>const formatted = formatPost("hello");</script>
```

Pages also get full access to the entire SDK via the `HackhubSDK` global (e.g. `HackhubSDK.Mail.send(...)`) — confirmed via the `wrapApi` injection seen in decompiled code.

**Warning from the bug above**: an `Exports` function CAN be called directly from `onclick` for anything that needs no permission (reading a variable, computing something) — but if it does `Files.create`/`SaveStorage.set`/any other permissioned call, it MUST only do a synchronous `Events.emit()` inside `Exports`, with the real operation moved to a top-level `Events.on()`. Calling a permissioned operation directly from `Exports` always fails `Mod "null"`.

## Practical Checklist for a WYSIWYG Builder

- [ ] A "dynamic page" toggle in the editor should generate a `DynamicWebsitePageDefinition` (a `metadata()` function), not a static `WebsitePageDefinition`
- [ ] Never let the builder bind a page field directly to `SaveStorage` — it will always read back `(none)`, silently, with no clear error surfaced to the builder's user
- [ ] Never bind directly to `Localization.t()` inside a dynamic page definition — same failure, same silence
- [ ] If the builder needs per-save state a page can read: auto-generate the bridge pattern (write `SaveStorage` from a real event trigger → mirror into `Variables` → the page reads `Variables`) — never expose raw `SaveStorage` as a binding option, hide this complexity from the builder's user entirely
- [ ] Any page button/action that needs to create a file, send mail, etc. (a permissioned operation): generate an `Events.emit()` + a top-level `Events.on()`, never a direct call from an `onclick` handler
- [ ] `context.url`/`context.query`/`context.params` are safe to read directly in `metadata()` (protocol gating, routing by query param) — none of this bug applies to them
- [ ] A page can `return null` from `metadata()` to refuse the render (used for dynamic 400/404) — expose this as a "show this page only when" condition
- [ ] A page's reachability is determined purely by `Website.Host` — no `Network.registerDomain` needed for it to open (that's only for nslookup/ping/firewall)
