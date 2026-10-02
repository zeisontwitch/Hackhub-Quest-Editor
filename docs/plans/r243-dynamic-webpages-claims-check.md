# r243 — Checking another modder's dynamic-page research notes

Zeis was handed a set of research notes on dynamic webpages by another
modder, and asked for them to be treated as **claims to check, not gospel**
(they are deliberately not in this repository — they live on the
`QA-filedump` branch as `ClaimsToCheck_fromAnotherModder-Dynamic-Webpages-in-HackHub-Research-Notes.md`).

This is that check. Every claim below is tested against the pinned
`@hotbunny/hackhub-content-sdk@0.24.0` `index.d.ts` and, where we have it,
against **our own** in-game evidence — including the r238 probe run and a bug
we had already filed ourselves.

## Verdicts

| # | Claim | Verdict | Basis |
|---|---|---|---|
| 1 | Two separate serving mechanisms: the `Website` class (matched by `Host`) vs `Http.registerHost` (a raw network server, paired with `Network.registerDomain` so `nslookup`/`ping`/firewall see it) plus `Http.publish` for search indexing | **Confirmed — documented** | `Website` class has `Host`/`Pages`/`Exports`; `Http.registerHost`'s own doc comment says *"Pair it with `Network.registerDomain` so the host also resolves for `nslookup`, `ping` and the firewall"*; `Http.publish(host, listing)` exists |
| 2 | `Website.Host` alone is enough for the site to open by domain — no network registration needed | **Supported by our own run** | The r238 probe registered a site with `Host` only (no `registerDomain`, no `registerHost`) and every page opened in Firebear. *(The notes' decompiled `w.Url === host` doesn't match the public field, which is `Host` — internal naming; behaviour is unaffected.)* |
| 3 | The static/dynamic type shapes: dynamic pages carry `metadata()` instead of fixed `title`/`html`/`description`, get `{url, params, query, searchStr?}` and return `{title, description?, html, search?, exports?}` — or `null` to refuse the render | **Confirmed verbatim** | `PageContext` and `PageMetadata` in the d.ts match the notes exactly; our run confirmed `params` and `query` arrive, and that returning `null` produces the browser's own *"404 / This site cannot be reached"* |
| 4 | `metadata()` can never read `SaveStorage`; mod identity only survives two dispatch paths (`Command.Run()` and a genuine `Events.on()` callback) — lifecycle-hook bodies, detached promises and `Website.Exports` called from `onclick` all lose it, failing as `Mod "null"` | **Corroborated by our own filed evidence** | See §14 below — we hit the *same* engine behaviour in September with the *same* error text, from a different entry point. Nothing about call context is documented in the d.ts (checked: no such restriction appears anywhere), so this is a real undocumented trap |
| 5 | `Files.create()` and friends follow the same rule | **Same mechanism as #4; not directly tested by us** | Consistent with our §14 evidence; we have not run the filesystem case |
| 6 | `Localization.t()` fails inside `metadata()` but *does* work in a lifecycle hook's body (narrower than #4) | **Plausible, unverified here** | Needs a live test; nothing in the d.ts contradicts it |
| 7 | `Exports` keys become globals in the page's own scripts (also reachable via `ModExports`), and pages get a `HackhubSDK` global | **Confirmed twice** | Documented: *"Each key becomes directly callable in your HTML scripts … Also accessible via the `ModExports` namespace"*; and **our run proved it** — both site-level and per-page exports were called from page scripts, and the page reported *"HackhubSDK global in this iframe: yes"* |
| 8 | *"Pages get full access to the entire SDK via the `HackhubSDK` global"* | **Refine: available ≠ permitted** | The surface is really there, but permissioned calls made from page context are exactly what fails (#4/#5). **Our run proves it for mail:** the button reported `sent (no error thrown)` and the mail **never arrived** — Zeis had his inbox open in another tab the whole time |

## Why #4 is credible: we filed the same bug ourselves

`docs/03` §14 (2026-09-19, game 1.3.1, our own test) records a start-menu
item's `onClick` calling `UI.toast(...)`, and the log answering:

```
[quest-editor] extras: UI.toast threw: [ContentSDK] Mod "null" tried to use UI.toast without "ui" permission.
```

— and the same for a right-click item registered with `ContextMenu.register`.
That is the identical failure the notes describe, with the identical wording,
reached from a completely different entry point. Two modders, two months
apart, same conclusion: **the engine resolves which mod is calling from *how*
the call was dispatched, not from which module it lives in.** Clicks, detached
promises and `async` lifecycle bodies lose the caller; `Command.Run()` and
real event callbacks keep it.

## Our own refinement: JS state is fine, *permissioned calls* are not

The notes are about SDK calls that need a permission. Ordinary JavaScript
state is unaffected: the r238 probe's pages read module-level variables the
whole time (the visit counter climbed 2 → 4, the phase line rendered) with no
trouble. So a page can render **anything the mod holds in memory** — it just
cannot call a permissioned API on its own behalf.

That distinction is what makes a no-code feature feasible: per-page content
can read quest/module state freely; only *actions* (send mail, create a file,
complete an objective) need the bridge.

## What it changes for the phase plan

- **Bindings:** a page may bind to quest/module state (works). It must
  **never** be offered a `SaveStorage` binding — it reads back empty,
  silently. If per-save state is ever needed, generate the bridge the notes
  describe (write from a trusted context → mirror into `Variables` → the page
  reads `Variables`) and hide it from the author entirely.
- **Page actions:** anything permissioned must be emitted as `Events.emit()`
  from the page with the real work in a top-level `Events.on()` handler. Never
  a direct call from a button.

> **r250 amendment — the evidence base for this is narrower than it looked.**
> The claim above rests on the other modder's notes, where the `Mod "null"`
> refusal was reproduced three times for **`Files.create` and `SaveStorage.set`**.
> Our own mail test is no longer evidence for it: the probe's page-context
> `Mail.send` returned real ids (`yD1oMYYHUX`, `ra1DgwPOsB`), so it was **not**
> refused. The fence therefore looks **per-API**, not blanket. Keep the bridge
> (it is proven for the filesystem calls, and it is harmless), but do not treat
> it as universal — and if probe 1.4.0 shows a page's mail arriving, the
> per-API nature of the fence becomes a docs/03 question of its own.
- **"Show this page only when":** `return null` — confirmed shape, and we now
  know what the player sees.
- **Searchable / nslookup-visible:** separate toggles from "has a page"
  (`Http.publish` and `Network.registerDomain` respectively), confirming #1.
- **The beat (our open row):** it must be triggered from a trusted context.
  `Http.Response` never fires for a mod's own site (our §24, and the r166
  fence), so the options are `Command.Run()` (needs the harness) or a real
  event — the notes' experiment 7 shows `Terminal.Nslookup` works.

## The mail finding, and what to test next

DP-09/DP-10 are now explained as far as the evidence goes: the page's button
called `HackhubSDK.Mail.send(...)`, nothing threw, and **no mail ever
arrived**. The likeliest reading is #4 — the permissioned call was refused in
page context.

Two corrections, made after Zeis asked whether the permission was even
declared:

1. **We did declare it.** The dynprobe's manifest lists
   `permissions: ["events", "mail"]`, and `mail` is the correct name. So a
   missing permission is not the explanation for the dead mail. (§14 makes
   the same point from the other side: that mod *had* `"ui"` declared and was
   still refused, with the mod named as `null`.)
2. **My "invisible promise rejection" theory was wrong.** `Mail.send` is
   documented as `send(mail: MailDefinition): string | null` — synchronous,
   returning the new mail's id or `null`. There is no promise. Our page just
   called it inside a `try/catch`, saw no exception, and printed "sent".

**Our own run then confirmed his warning with a clean A/B** (Zeis,
2026-09-28): in the same mod, with the same `mail` permission, in the same
session — a mail sent from the quest's `OnStart()` **arrived**, and the one
sent from the page's own button **never did**. Same API, same permission,
different dispatch path: that is his claim, demonstrated. (It also rules the
address out, since the `OnStart` mail carries no `to` field.)

What we still do not know is only *how* it failed — `Mail.send` returns the
new mail's id or `null`, and our page never captured it, printing its own
"sent (no error thrown)" text instead. Next probe prints the return value:
`null` = refused, an id = accepted and lost later.

## Proposed next probe (awaits Zeis's go-ahead)

1. **Beat on a real event** — `Terminal.Nslookup` (proven in the notes), so
   DP-06/07/08 can finally run their "after" half and the bcc.com A/B gets
   verified.
2. **Log every event before filtering** — so "no event" and "unexpected host"
   stop looking identical.
3. **Print `Mail.send`'s return value** (it is synchronous: `string | null`)
   — `null` means refused, an id means accepted. The "did the mod-context mail
   arrive" half is already answered: it did.
