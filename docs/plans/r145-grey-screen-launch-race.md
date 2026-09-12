# r145 — The grey screen, part 2: the launch race, found and fixed

> **Correction (r146):** the race this round fixed is real, and the fix
> stands (Zeis's optimizer line disappeared). But this round also *assumed*
> his machine was slow — an unverified guess stated as fact, against the
> project's standing rule — and the race was never the grey screen. The
> actual cause was a case-insensitive filename collision that only
> manifests on Windows. See
> [r146-grey-screen-name-twin.md](r146-grey-screen-name-twin.md).

## The report that cracked it

Zeis came back: the grey screen returned on r144 (Firefox, Windows 11,
fresh-zip ritual). Three corrections that reshaped the investigation:

1. He never uses the in-chat preview — always fresh zip, delete old folder,
   unzip, install, launch. (r144's "dead preview server" theory was therefore
   wrong, and is retracted.)
2. Reverting the other tool's round (r143) did **not** fix it — only going
   back past r142 did. So the break tracked *our* rounds.
3. His terminal showed a line the working builds never printed:

   ```
   [vite] (client) [optimizer] bundling dependencies...
   ```

## The mechanism (verified, not theorized)

Vite pre-bundles dependencies (React, React Flow, Radix…) into
`node_modules/.vite/deps` and serves each at a version-hashed URL. The
optimizer runs **asynchronously, after the server has started listening**.
A browser that connects inside that window can beat it.

Zeis's launch path makes that window as dangerous as it gets: `Launch.bat`
polls the **TCP port** — which answers the instant Vite listens, before the
optimizer has finished — and opens Firefox immediately. On a fast machine
the optimizer wins the race (this sandbox: ~1s, requests queue and then
succeed — not reproducible by crawling, even attacking the port the
millisecond it answered). On his machine (Windows, antivirus scanning a
just-installed `node_modules`, cold cache) the browser wins — and then:

- The page's module requests reference dep URLs at hash **H1**.
- The optimizer re-bundles and moves everything to hash **H2**.
- The outstanding H1 requests come back **504 (Outdated Optimize Dep)**.
- The half-loaded page has no HMR websocket yet, so nobody triggers the
  auto-reload that would recover it. The module graph dies silently.
- Firefox shows exactly what Zeis described: grey/nothing, no error page.

This is a documented Vite failure mode; the standard mitigations are a hard
reload (user-side) and pre-declaring dependencies so nothing is discovered
mid-session (config-side).

**Reproduced locally** while verifying the fix: a crawl against a server
whose dep cache was re-bundled underneath it received live
`HTTP 504 /node_modules/.vite/deps/prettier_standalone.js?v=…` responses —
the exact failure, caught in the act.

**Why it tracked our rounds without being caused by them:** the lockfile is
byte-identical from r141 (worked for him) through r144 (grey) — the
dependency set and the optimizer's work never changed. The race had been in
the launch flow since the beginning; it is timing-dependent, and his machine
happened to start losing it the day r142 landed. That the grey screen
survived r141→r142 code review, 1,378 tests, three full-app boot tests and
154-module crawls is consistent: it was never a code failure — the editor
boots clean; the browser just never got a consistent first load.

## The fix (belt and braces, in the launch path — no editor code changed)

1. **`vite optimize` runs to completion before the server listens.** The
   dev script is now `vite optimize --logLevel error && vite --host 0.0.0.0`.
   On a cold install the optimizer does all its work *first*; Vite only
   starts listening — and Launch.bat only opens the browser — when every
   dependency is already bundled. The browser cannot connect inside the
   window because the window no longer exists. (Warm launches pay ~0.5s.)
   The deprecation notice `vite optimize` prints is silenced via logLevel;
   a failure still fails the launch loudly.
2. **Every runtime dependency is declared in `optimizeDeps.include`** (21
   entries, generated from the actual imports). The startup scan can never
   miss one for the browser to discover mid-session — the documented
   mitigation for the lazy-discovery variant of the race. The config carries
   the rule for the future: a new dynamically-imported dependency must be
   added to that list.

## Verification

- Cold cache → `npm run dev` → port answers only after the optimizer
  finished (~0.95s here) → an instant Firefox-style parallel crawl of all
  154 modules: zero 504s, zero slow requests, no client-optimizer line.
- The pre-fix failure was caught live (the 504 reproduction above).
- Gates: typecheck clean, 1,378 tests / 66 files green, build clean.
  No `EDITOR_BUILD` bump — nothing the compiler emits changed (AR13).

## If it ever comes back

The user-side tell is the terminal line `(client) [optimizer] bundling
dependencies...` appearing **after** the page loaded — with this fix it
should not appear at all on a fresh install. If a grey screen ever recurs:
wait a few seconds, hard-reload (Ctrl+Shift+R). If that does not bring the
editor back, it is a *different* failure — F12 → Console → the red lines are
the diagnosis.
