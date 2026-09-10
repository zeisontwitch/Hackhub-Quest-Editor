# r132: website builder audit — plan (opened)

Roadmap item 9, in the approved queue order (Zeis, r131: audit first, then
the r131 builds — campaign template + Kisscord contact lifecycle + cookbook
card, all three approved). A r123/r125-style round: read everything before
touching anything, fix what's broken, pin what's right, reformat nothing.

## Scope — the whole surface

| File | Lines | First impressions (to be replaced by the read) |
|---|---|---|
| `src/editor/websites/WebsiteBuilder.tsx` | 735 | 19 `useState`/`useEditor` hooks in one component — state-heavy; one bug fix in 100+ revisions. |
| `src/editor/websites/pageEditor.tsx` | 259 | 2 hooks. |
| `src/editor/websites/pageDoc.ts` | 135 | Pure helpers: `splitDocument`/`joinDocument`/`scanDocument`, `BASE_CSS`, `wrapFragment`, `isFullDocument`, `PageScan`. |
| `src/editor/websites/LlmPromptDialog.tsx` | 110 | The LLM prompt dialog. |
| `src/editor/__tests__/websites.test.tsx` | 427 | Existing coverage. |
| `src/editor/websites/naza/` | dir (596-line sample HTML) | Demo/import fixtures — confirm still referenced. |

## Riding along (per the roadmap row)

- The `WebsiteDefinition.popular` **self-test**: two identical sites, one
  flagged, check result ranking ([`docs/03` question
  12](../03-questions-for-the-developers.md); hypothesis: ranking boost).
- In-game check of the r129 search metadata (QA list item 1): does
  `description` render as the result snippet; are `search[]` terms matched
  (case-insensitively? alongside page text?); do they matter for `seo:false`.

## Method (as r123/r125)

1. Full read of all four source files + the tests before any edit.
2. Issue inventory below — numbered, each with a verdict: fix / pin / leave.
3. The self-test and template work come after the read (the
   comparison-before-template rule, applied to audits).
4. Gates: typecheck + tests + build. Pins for behavior that must not drift.

## Findings

(to be filled during the read — nothing edited yet)

## Status

Opened at r131's close; the read happens in r132 proper.
