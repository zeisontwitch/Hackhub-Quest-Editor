# r134: website polish — walkable preview, folder import

The two approved r132 proposals (roadmap row 11, now closed). Zeis's brief
for both: close the AI-authoring loop — the assistant returns a site as one
.html per page, and until now each file was loaded one dialog at a time and
the preview showed exactly one page with dead links.

## Preview navigation — walk the site like a player

The preview iframe is `sandbox="allow-scripts"` — a unique origin: nothing
inside can be read, **but** scripts may run and `postMessage` to the parent.
That is the whole mechanism:

- The builder serves every viewed page with a tiny interceptor injected
  (`injectPreviewNav`, pure and unit-pinned): a capture-phase click listener
  that intercepts internal links (`href="/…"`), strips query/hash, and
  posts `{ source: "qe-preview", path }` to the parent. External `https://`
  links and `#` anchors behave natively.
- `BrowserPreview` listens for those messages and serves the page living at
  that path — or a friendly **not-found** page ("No page at /nope … add a
  page with this path in the Pages list — unlisted pages count as
  destinations too", HTML-escaped path).
- The address bar (an input now, not a label) shows the viewed path, accepts
  typed paths, and snaps back to the edited page on page switch (a small ✕
  appears while you are away from it).
- The hidden-page banner reflects the page being *viewed*, not the one being
  edited — walking to an unlisted page in the preview shows its banner.

Known edge (noted, not built): a page carrying its own strict CSP
(`script-src 'none'`) blocks the interceptor in the preview — and would
block its own scripts in-game the same way, so the preview is honest about
it. A future marker could warn at scan time.

## Import folder — one dialog for the whole AI site

The toolbar's **Import folder** opens a directory picker (`webkitdirectory`):
every `.html` file becomes a page —

- path from the relative path: top folder stripped, `index` becomes its
  directory, extension gone (`assistant/news.html` → `/news`,
  `assistant/about/team.html` → `/about/team`, `assistant/index.html` → `/`);
- title from the document's `<title>`, else the humanized file name;
- fragments wrapped in the base document (same as Load HTML);
- paths that already exist are **skipped, not clobbered** — the toast
  reports made and skipped counts.

Implementation notes: `importPath`/`importTitle` are pure functions in
`pageDoc.ts` (unit-pinned alongside `injectPreviewNav`/`notFoundDoc`), and
files are read via a `FileReader` promise — **`File.text()` does not exist
in jsdom**, and Load HTML already ran on `FileReader`, so the import follows
suit. Tests cover the full walk (skip `/` and `/dupe`, create `/news` with
the AI title, wrap `/about/team`) and preview navigation end-to-end via
dispatched `MessageEvent`s.

## Session incident (4th sandbox reset, recorded for the next session)

Mid-round the sandbox reset again — local HEAD silently back at the
pre-session base `c0e511f`, and this time **node_modules was gone** (it is
excluded from workspace snapshots, so a reset leaves nothing to reinstall
from). Recovery, now the documented procedure:

1. Compare local HEAD vs the remote **before touching anything**
   (`git ls-remote origin <branch>` — remote-tracking refs may be missing
   too; use the SHA directly).
2. **Rescue the round's uncommitted files with plain copies** (this round:
   `pageDoc.ts`, `WebsiteBuilder.tsx`, `README.md`, `HANDOFF.md`, the
   untracked r135 design) — `reset --hard` would otherwise clobber exactly
   the newest work.
3. `git reset --hard <remote-sha>`, copy the rescued files back, verify
   `git status` shows only the intended modifications.
4. `npm ci`, re-run gates.

Also this session: `npx tsc` resolved to a squatter `tsc` npm package once
node_modules vanished — use `./node_modules/.bin/tsc` (or `npm run
typecheck`).

## Status

Shipped in r134: preview navigation, folder import, 3 new tests (1,233
total across 57 files), typecheck + build clean, stamp `2026-09-11.r134`.
Roadmap row 11 closed. Next in the approved order: the **r131 builds**
(campaign template, Kisscord contact lifecycle, cookbook card), with the
**tool-pack design** (r135, awaiting go) queued behind them.
