# After the SDK update

> Superseded on 2026-09-16 by `docs/plans/r165-sdk-0.24-assessment.md` for the SDK 0.24.0 update pass. This file is now historical manual-maintenance context; follow the current Arena session prompt for branch and source-control rules.

Read this before touching the handbook. It exists because the game and its SDK
are about to change, and most of what needs doing afterwards is mechanical —
provided you know where to look and what the gates will and will not catch.

Historical baseline was editor build `2026-09-14.r162` and SDK `0.21.0`; the completed SDK 0.24.0 pass is documented separately.

If you are a fresh instance picking this up: the handbook is 43 HTML pages and
about 30,000 words in `public/manual/`, and it is **complete at the top level**.
Every one of the eight top-level pages is written, all 33 obtainable node types
have a page, and there are 21 coverage gates in `src/manual.coverage.test.ts`.
Nothing is a stub. What remains is listed in §6.

---

## 1. First ten minutes

```bash
npm install --no-audit --no-fund   # node_modules is gitignored and gets wiped
npm run gen:manual                 # extract inventory → build node pages → build search index
npx vitest run src/manual.coverage.test.ts
npm run typecheck
```

`npm run gen:manual` is three steps:
`extract-manual-inventory` → `build-node-pages` → `build-manual-index`.
It needs `node_modules` (the extractor uses `jiti`); the two build scripts run
on plain Node.

**Read the generator's output, do not pipe it to `tail`.** It reports nodes it
skipped for want of a voice entry, and a crash upstream still exits 0 through a
pipe.

Then read the gate failures. They are the work list. Do not start editing prose
before you have seen them.

---

## 2. The new tool — most likely source of breakage

Zeis flagged this specifically: the update brings a new tool. Either an existing
node gains a field, or there is a new node entirely. Both are caught, but by
different gates, and each has a different fix.

### If it is a new node type

**G1 fails** with the type named. It compares `NODE_TYPES_REGISTRY` against
`public/manual/nodes/<type>.html` — dots become dashes, lowercased.

1. Add a voice entry to `docs/manual/node-voice.json`, keyed by the node type.
   Required keys: `oneliner`, `what`, `when[]`, `game`. The generator **throws**
   if `what` or `when` is missing.
2. Re-run `npm run gen:manual`. The page appears and is added to `nodes.html`
   automatically.
3. If the node has sockets, add a `sockets` entry **keyed by socket id, not the
   on-screen label** — `true`/`false` for `flow.branch`, `failure` for
   `comms.dialogue`. An unknown key throws and lists the valid ids.
4. Check `PERMISSIONS_BY_NODE_TYPE` in `src/compiler/compile.ts:177`. A new tool
   may add a permission. If the count moves off six, two tables are wrong:
   `export.html#permissions` and `concepts.html#permissions`.

### If it is a new field on an existing node

**G2 fails** with the missing id, in the form `node-<slug>-field-<key>`.

1. Add the key under that node's `fields` in `node-voice.json`.
2. The generator's `put` text must not restate the field's own hint. There is a
   ceiling at 0.7 word overlap and it **throws**. Write what to put there and
   why, not a synonym of the hint.
3. If the key is dotted (`world.port`, `port.external`), do not split it on the
   last dot to work out the condition. Compute it in one language.

### If the new field has a dice generator

`guides.html#generate-tags` is the section that explains the dice and the
sparkle. It currently says the dice fills a field with a fixed made-up value and
the sparkle inserts a tag the game fills at runtime. Check
`src/lib/generate/index.ts` (`generateField`, at :248) and
`src/editor/inspector/GenerateButton.tsx` — if the new
generator produces something that is neither, that section is wrong.

`src/editor/inspector/GenerateButton.tsx:1-11` documents the distinction in its
own header comment. Read it before rewriting anything.

---

## 3. Claims most likely to be wrong after this update

These are prose, not figures. **No gate catches any of them.** Zeis said the
update touches lynx, timing and quest completion, and fixes a long list of
bugs — so start here.

### Quest completion — highest priority

Four pages currently claim quests do not complete by default, resting on
`autoComplete` defaulting to `false` (`src/schema/project.ts:147`). Zeis expects
this to finally work properly.

- `concepts.html#why-no-complete` — the whole section
- `guides.html#quest-settings` — the `Complete automatically` entry
- `troubleshooting.html#faq` — "My ending never plays"
- `appendices.html#limits` — "It cannot make a quest complete itself by default"

Check `project.ts` for the default, and `entry.complete`'s blurb in
`src/schema/registry.ts`. The blurb is quoted verbatim on
`nodes/entry-complete.html`, so if the registry copy changes, the page's
`blockquote.blurb` is stale even though no gate notices.

### The event list

The event list comes from `reference/hackhub-events.json`. **G13 and G14
catch stale counts now** — G13 checks every stated count, G14 diffs the whole list
against the catalogue. Regenerate the `appendices.html#events-list` section
rather than patching rows; it was generated, and the generation script asserts
the grouped total equals the catalogue's count.

Note that `concepts.html` and `appendices.html` both use
`Terminal.Lynx.Search` as their worked example of an event that carries data.
Lynx is in scope for this update. If that event is renamed, G14 will flag the
appendices row but **not** the prose example in `concepts.html#events`.

### Timing

Affects `flow.delay` (a blank value means no pause — `runtimeSource.ts:1463`),
`comms.dialogue` timed playback, and `flow.sequence`. The COV7 limit "It cannot
keep a live conversation interactive" comes from a real warning in
`src/editor/inspector/sims/DialogueNodeEditor.tsx:55`. If the bug list covers
this, that limit is obsolete and must come out of
`appendices.html#limits`.

### The build stamp

**G15 catches this now.** The stamp is in 43 pages. `gen:manual` refreshes the
32 generated node pages from `inventory.editorBuild`; these 11 are hand-written
and carry it as literal text:

`index.html`, `tutorial.html`, `concepts.html`, `guides.html`, `how-do-i.html`,
`checking.html`, `export.html`, `troubleshooting.html`, `appendices.html`,
`nodes.html`, `nodes/fx-pay.html`

---

## 4. What the gates do and do not catch

**Live against the registry** — fail immediately when the SDK moves:

| Gate | Catches |
|---|---|
| G1 | a node type with no page, or missing from `nodes.html` |
| G2 | an editable field with no documented entry |
| G3 | documented fields that no longer exist |

**Live against other sources:**

| Gate | Source | Catches |
|---|---|---|
| G13 | `reference/hackhub-events.json` | a stale event count in prose |
| G14 | `reference/hackhub-events.json` | an event list that disagrees with the catalogue |
| G15 | `EDITOR_BUILD` | a page documenting the wrong build |

**Internal consistency only** — SDK-independent, will not notice drift:
G5 (links and anchors resolve), G6 (banned jargon and filler), G8 (screenshots
declared), G10 (front-page chips vs the checked-in `inventory.json`), G11 (the
ten panel messages), G12 (the three furniture nodes).

### Known blind spots — stated so nobody trusts them too far

- **G11 is a curated list.** It cannot see a brand-new inline warning. Scan
  `src/editor/**/*.tsx` for hardcoded prose near `text-warn`/`text-danger` when
  you touch those editors, and add anything new to both `PANEL_MESSAGES` and
  `checking.html`. Extraction was tried and rejected: the result depends on line
  wrapping. Details in the test's header comment.
- **G10 reads the checked-in `inventory.json`,** not the live SDK. It only fails
  if someone re-ran the extractor. G13/G14/G15 were added specifically because
  of this.
- **No gate reads meaning.** If quests become completable, nothing notices that
  `why-no-complete` has turned into nonsense. Figures and names are checked;
  claims are not.
- **`blockquote.blurb` is exempt from G6** and is never compared to the
  registry hint it quotes. Every field hint the manual reproduces can silently
  drift. There is no gate for it.

---

## 5. Verifying your own work

Every gate in this suite was falsified when it was written — a planted break, a
red run, a restore. Keep doing that. A green gate you have never seen fail is
not evidence.

The cheap version, per page you write:

```bash
# plant a dead anchor and a banned word, expect two failures naming your page
cp public/manual/<page>.html /tmp/x.bak
# ... edit ...
npx vitest run src/manual.coverage.test.ts
cp /tmp/x.bak public/manual/<page>.html
```

Also worth running on any hand-written page, because the parser check has caught
real stray tags twice:

```python
from html.parser import HTMLParser   # walk it, assert nothing unclosed
```

And before every push:

```bash
git status --short
git fetch -q origin
# use the Arena branch named in the current session prompt
```

The sandbox has reset git three times in this project and orphaned committed
work onto the base. Recovery: `git fetch` + `git rebase FETCH_HEAD`,
`git checkout --theirs -- <files>` for add/add conflicts, then confirm
`git diff <pre-rebase-sha> HEAD` is empty.

---

## 6. Still unwritten

### 15 how-tos

`how-do-i.html` has one (`#howto-objective-that-ticks`). The screenshot plan
(`docs/plans/r164-manual-screenshots.md`, §3.1) names all 16 with a shot each:

`npc-message`, `gated-message`, `payment`, `branch`, `passphrase`, `website`,
`hidden-page`, `file-drop`, `scan-gate`, `lead`, `tool-match`, `chained-talk`,
`ending`, `from-template`, `update`.

Template: You'll need · Takes · The idea · Steps · The finished piece ·
Variations · If it doesn't work. The "If it doesn't work" section should point
at the **Debug probe** — Zeis asked for that specifically.

**The new tool probably earns a how-to.** If it lands as a node, "use the new
tool" is a how-to an author will look for.

### 3 sub-pages for the heavy editors

*Create network*, *Dialogue*, *When event*. The structure proposal
(`docs/plans/r164-manual-structure-proposal.md`) has the rationale.

**G5 detail, stated precisely because it is easy to get wrong:** a link target
passes if the file exists **or** it is in `EXPECTED_PAGES`
(`src/manual.coverage.test.ts:171`). So either create the sub-page in the same
commit as the link that points at it, or add it to `EXPECTED_PAGES` first. Do
not link to a page you have not created in the same pass.

### 90 screenshots

`docs/plans/r164-manual-screenshots.md` is the capture brief — filename, crop,
and what to show. 65 are referenced by pages but not yet captured; G8 reports
the number on every run. Pages reference them with plain `<img>`, and
`manual.js` swaps in a dashed placeholder when the file is missing, so a page
reads fine before the shot lands.

Two rows in that brief were already corrected because they described things that
are not true — check the file's own notes before capturing from it.

---

## 7. Standing rules from Zeis

- **Always commit and push.** Commits alone are invisible; the branch on GitHub
  is what gets seen. Push the Arena branch named in the current session prompt every turn.
- **Never edit `src/**`.** Product-copy changes are proposals. They go in the
  advocacy list at `docs/plans/r164-manual-audit.md` §5 (P1–P8 so far).
  `src/manual.coverage.test.ts` is the exception — it is the doc suite's own.
- **Money is dollars, not credits.** A first fee of 100 is reasonable; buyable
  tools cost about 35. Never 2500.
- **The word is "socket", never "port".**
- **`world.wifi` gets no page.** It is a commented-out feature. G1 excludes it
  via `PALETTE_HIDDEN_TYPES`.
- **Documentation vocabulary needs a counterpart in the product.** "Recipes"
  was renamed "How do I…" for exactly this reason.
- Banned in prose: JSON, schema, node type, Zod, esbuild, regex, boolean, enum,
  string, API, compile, parse, plus fillers (simply, just, easy, obviously,
  basically, essentially…). G6 enforces it. `<code>`, `<kbd>` and
  `blockquote.blurb` are exempt; `JARGON_ALLOWLIST` holds legitimate uses.
- Second person, present tense, active. Sentences under 20 words. Every "how"
  gets a "why". No forward references. No marketing adjectives.
- Diátaxis: tutorial / how-to / reference / explanation never blended on a page.
- Screenshots are PNG. Lossless WebP measured 67% smaller and bit-exact, but
  drop-in simplicity won. Reversible in five minutes if that ever changes.

---

## 8. Corrections already made — do not reintroduce

Each of these was a false claim in shipped prose, found by going back to source.
They are the reason §4 says gates do not read meaning.

1. **The export never refuses.** `ExportDialog.tsx:132` disables *Download .zip*
   only while packing, and `download()` never inspects warnings. A `.zip` always
   downloads. `troubleshooting.html#export-refuses` keeps its id but corrects
   the premise.
2. **The status bar carries no issue count.** `StatusBar.tsx` has no reference
   to issues, warnings or the graph analysis at all. The counter is a chip on
   the canvas (`QuestCanvas.tsx:1366`, `summariseIssues` at `graph.ts:190`),
   reading `No issues` or `N blocking, M to review`.
3. **A Group frame's text does ship.** `planningComments()`
   (`compile.ts:91-110`) emits each group's name and comment as comments in
   `dist/mod.js`. The frame node is stripped; its text is not. G12 guards this.
4. **There are ten more messages than the three obvious sources.** Canvas,
   field and export messages are machine-readable; the ten panel messages are
   plain JSX in whichever editor is describing the thing in front of you. G11
   holds them.
5. **Only the first event wired to an objective's trigger is used**, and
   `unlocked-by` only accepts a wire from another objective
   (`runtimeSource.ts:563-571`). Both are documented as warnings.
6. **Multiple `entry.start` nodes all run** (`runtimeSource.ts:1994-2001`).
   Never write "exactly one".

---

## 9. Where things live

| Path | What |
|---|---|
| `public/manual/` | the handbook — 43 HTML pages, `manual.css`, `manual.js`, `search-index.js` |
| `src/manual.coverage.test.ts` | 21 gates, G1–G15 |
| `docs/manual/inventory.json` | generated ground truth; per node: type, slug, label, fields, sockets, defaults |
| `docs/manual/node-voice.json` | 32 hand-written voice entries (`fx.pay` is deliberately absent — its page is hand-written) |
| `docs/manual/README.md` | maintenance note: why the inputs are separate, the restatement guard, G11's blind spot |
| `scripts/extract-manual-inventory.mjs` | needs `jiti`; deterministic via `stabilise()` |
| `scripts/build-node-pages.mjs` | one page per obtainable node; throws on missing voice, bad socket key, restated hint |
| `scripts/build-manual-index.mjs` | offline search; globs every `.html` recursively |
| `docs/plans/r164-manual-*.md` | audit (with the advocacy list), structure proposal, screenshot brief |
| `reference/hackhub-events.json` | the event catalogue; `SDK_VERSION` and `EVENT_COUNT` derive from it |

**This file is `.md` on purpose.** `build-manual-index.mjs` globs every `.html`
under `public/manual/` recursively, so an HTML checklist here would land in the
reader-facing search results.
