# r132: website builder audit — findings, fixes, opinions

Roadmap item 9, approved ordering (audit before the r131 builds). The whole
surface was read end to end before anything was touched — the four source
files (`WebsiteBuilder.tsx` 735→821 lines, `pageEditor.tsx`, `pageDoc.ts`,
`LlmPromptDialog.tsx`), the 427-line test file, the schema (`WebPageSchema` /
`WebsiteSchema`), the store actions, the compiler's warning + emission ends,
and the export shape against the SDK's `WebsiteDefinition`. Gates at ship:
typecheck clean, **1,227 tests green** (57 files; the 4 d3-drag jsdom
teardown errors aside), build clean. Stamp `2026-09-11.r132`.

## Verdict on the current state (the opinion asked for)

**Architecturally sound, unusually honest, and better than its reputation.**
"One bug fix in 100+ revisions" reads like neglect, but the reading found the
opposite: the module split is right (pure document helpers in `pageDoc.ts`,
presentational editors in `pageEditor.tsx`, one dialog), the undo-safe store
actions are exactly the house pattern, and the *Load HTML → scan → "Fix it:
create the missing pages"* loop — closed by the AI prompt that teaches an LLM
the game's quirks (one file per page, real paths, no internet, hidden pages
for dirhunter) — is the single best authoring flow in the editor. The plain-
language scan panel ("Hidden message: … players who inspect the source can
read it") is the builder saying things in the author's language instead of
`seo:false`, and it works.

The real defects were three, and all three are fixed in this round:

1. **The visual editor ran page scripts while editing** — contradicting its
   own header comment. A script that rewrites the DOM (the NAZA portal ships
   with a denial script!) fights `contentEditable` and its mutations get
   swept into the emitted document on every keystroke. Un-sandboxable the
   obvious way (emit needs same-origin DOM access), so the fix is a
   `Content-Security-Policy: script-src 'none'` meta injected into the
   *editing copy* only when the page has scripts — execution stops, the
   `<script>` nodes stay in the DOM (body.innerHTML is what we emit), and
   pages without scripts keep their document byte-identical (pinned by the
   pre-existing exact-srcdoc test).
2. **"Delete site" had no confirmation** — a single misclick removed every
   page, while deleting a *single page* asked first. Now mirrored:
   AlertDialog, host + page count named, undo mentioned.
3. **Hosts and paths were free text all the way to the export.** The
   compiler ships them verbatim, so a pasted `https://` became
   `http://https://…` and a slash-less path became unaddressable
   (`hostnews`) and invisible to the page scan. Normalized **on blur** (never
   mid-keystroke) via new `normalizeHost`/`normalizePath`; `TextInput`
   gained an `onBlur` passthrough.

Plus three smaller finds, also fixed:

4. **`hiddenBits` was computed and never shown** — the scan counted hidden
   inputs / `display:none` blocks (prime clue real estate) and the panel
   stayed silent. Now: "🫥 N hidden elements in the code … another good clue
   spot." Multiple comments now say "…and N more comments in the code"
   (only the first was ever shown). The "nothing unusual" fallback learned
   the new signal.
5. **`WebsiteDefinition.popular` — declared in the pinned SDK, unmodeled by
   us** (docs/03 Q12). Now end-to-end: schema field → only-when-set emission
   (`if (w.popular) this.Popular = true`, r129 rule, parity pinned
   *behaviorally* by constructing the registered class both ways) → a
   "Popular site" toggle whose hint says plainly that the flag's in-game
   effect is unverified. **The Q12 self-test is now buildable**: two
   identical sites, one flagged, compare search ranking — Zeis's run.
6. **New compile warnings** (r130 pattern): two pages at one path on one
   site (they ship as two definitions of the same address — which the
   browser serves is the engine's call), and a path missing its leading
   slash.

Also fixed in passing: both dialog switches were **nameless to assistive
tech** (label `htmlFor` pointed at an unset id) — the toggles now carry ids,
so "Listed in the in-game search" / "Popular site" are announced and queryable
by name. And a **Save HTML** button sits beside Load HTML — what goes in can
now come out (blob download named from the path, `index.html` for `/`), which
closes the iterate-with-your-AI loop.

## Writing notes

- `runtimeSource.ts` is a template literal of *emitted JS*: a comment
  containing backticks terminates the string and the file stops compiling
  (TS1005 far from the cause). No backticks inside the runtime text — third
  time this trap shape has appeared (after `${` and nested template rules).
- Parity assertions must be behavioral when the guarded line is static text:
  the `if (w.popular)` line is always *present* in mod.js; what differs is
  the constructed instance's member.

## Deliberately not done

- **Anchor-without-id soft flag**: anchors targeting missing section ids
  could be flagged like missing pages — but JS-built tabs (the LLM prompt
  explicitly allows small scripts) create targets dynamically, so the false
  positives would train authors to ignore the panel. Left out.
- **Replacing `window.prompt` link insertion** with a link picker (list the
  site's pages, type-to-create): the last crude widget in the builder, but a
  real dialog with real states — proposal, not this round.
- **Emoji voice** (✨ 🥚 ⚠️ 🫥): deliberate plain-language register, consistent
  with the panel's "says so plainly" design note. Kept.
- **Site icons**: the engine expects `Icon`; we ship `""` (comment in the
  runtime cites Nemesis doing the same). Whether an iconless site shows an
  ugly blank in the in-game browser/Goagle results is an eyes-on question
  before any icon field is designed — QA list.

## Proposals for a later round (not built)

- **Link picker** (above).
- **Preview navigation**: the preview shows one page; a mini address bar that
  follows in-site links would let an author walk the whole site like a
  player. Medium build, high delight.
- **Multi-file import**: the AI flow returns one file per page; today each is
  loaded one dialog at a time. A multi-select import that creates pages from
  filenames (`news.html` → `/news`) would finish the loop. Needs care with
  path guessing — a proposal on purpose.

## Status

Shipped in r132: fixes 1–6 above, Save HTML, a11y ids, the two compile
warnings, and 8 new tests (6 in `websites.test.tsx`: the CSP block, the
normalizer unit pin, delete-site confirm, blur normalization in the dialog,
the popular toggle, the hidden-bits panel; 2 in `compile.test.ts`: the
path warnings, the popular parity). Remaining halves of roadmap row 9
are in-game and live on Zeis's QA list: the `popular` self-test (two
identical sites, one flagged — the flag is now a checkbox) and the r129
search-metadata checks (description as snippet, `search[]` matching,
`seo:false` interplay).
