# r129: website pages — `description` + `search[]` (roadmap item 2)

The one gap where our output lagged the SDK we already pin:
`WebsitePageDefinition` supports `description?: string` and
`search?: string[]` (verified in `@hotbunny/hackhub-content-sdk` 0.21.0
`index.d.ts` — and the same two fields exist on `PageMetadata` for dynamic
pages), and the roadmap has carried "we emit only path/title/html/seo" since
r126. This round closes it.

## Ground truth

```ts
export interface WebsitePageDefinition {
    path: string;
    title: string;
    html: string;
    seo?: boolean;
    description?: string;   // ← not emitted by us before r129
    search?: string[];      // ← not emitted by us before r129
}
```

Semantics are **partially verified**: the shapes are SDK-declared, the
roadmap's "affects in-game search" is established, and the working reference
mod uses both — but *how* the game presents a `description` (result snippet?)
and matches `search[]` terms (case sensitivity? indexed alongside page text?)
is **not yet verified in-game**. Copy in the editor is therefore hedged
("can show"), and the in-game questions go to Zeis at the end of this plan.

## Where the drop happened (one line)

`runtimeSource.ts` `registerWebsite()` built pages as
`{ path, title, html: p.content, seo: !!p.seo }` — everything else on our
richer `WebPageDoc` was discarded there. The compile-side `PROJECT.websites`
embeds pages verbatim; only that runtime mapping narrowed them.

## Changes

1. **`schema/project.ts`** — `WebPageSchema` gains `description` (optional
   string) and `search` (optional string array), TSDoc'd. Optional, no
   defaults: old project files parse unchanged, and pages that don't use the
   fields export exactly as before (byte-stable exports).
2. **`compiler/runtimeSource.ts`** — emit `description`/`search` on a page
   only when the author set them. (`String.raw` template: plain comments, no
   backticks, no dollar-brace.)
3. **`editor/websites/WebsiteBuilder.tsx`** — page settings gain two inputs
   under the "Listed in the in-game search" toggle: a search-result
   description and extra search words (comma-separated). Advice-tone hints,
   hedged where semantics are unverified. Empty input stores `undefined`,
   keeping exports clean.
4. **`editor/websites/pageDoc.ts`** — `parseSearchTerms(text)`: the pure
   comma-split/trim/dedupe helper behind the words input — the testable
   core of the UI change.
5. **`compiler/compile.ts`** — `EDITOR_BUILD` bumped to `2026-09-10.r129`
   (emitted output changed).

Not touched: `migrate.ts` (nothing to migrate — optional fields), the
unlisted-page warning (still correct), `handbookArticles.ts`, and
`WebsiteDefinition.popular?: boolean` — the SDK declares it, we never modelled
it, its semantics are unknown, so it becomes an open question for the
developer, not a feature.

## Falsifiable pins

- a page with `description` + `search` set → the instantiated mod registers
  `Pages` carrying both, verbatim;
- a page without them → the registered page object has **no**
  `description`/`search` keys at all (clean exports);
- `parseSearchTerms` splits on commas, trims, drops empties, dedupes.

Each pin gets the revert test: with the runtime emission reverted, pin 1
fails; with the schema fields reverted, everything fails to compile.

## In-game questions for Zeis (nothing blocks on these)

1. Does `description` render as the snippet under the page's search result?
2. Are `search[]` terms matched, and case-insensitively? Alongside the page's
   own text, or instead of it?
3. Do the fields matter at all for `seo: false` pages (assumed: no)?
4. New question for the developer via Zeis: what does
   `WebsiteDefinition.popular?: boolean` do? (We don't model it.)

## Deliberately out of scope

Dynamic pages (`DynamicWebsitePageDefinition.metadata`) — the editor has no
dynamic-page surface, and that is a design question, not a field to add.
`popular` — see above. Anything Twotter/SMS/completion-shaped — still fenced
(docs/07).
