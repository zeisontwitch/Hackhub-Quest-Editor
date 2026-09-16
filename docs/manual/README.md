# Maintaining the handbook

The pages under `public/manual/` are a build artifact in the same sense the
schema is: they describe the editor, and they are checked against it.

## Two inputs, and why they are separate

| File | Holds | Written by |
| --- | --- | --- |
| `docs/manual/inventory.json` | labels, hints, defaults, limits, options, sockets | `scripts/extract-manual-inventory.mjs`, from `src/schema` |
| `docs/manual/node-voice.json` | what a node is for, when you would use it, what breaks | a person |

`scripts/build-node-pages.mjs` joins them into one page per node.

The split is the point. Facts are extracted, so they cannot drift from the
registry. Prose is written, so it cannot be faked. A node with no entry in
`node-voice.json` is **skipped and reported**, never filled in with
plausible-sounding filler — a gate that goes green on invented prose is worse
than no gate.

## Adding a node page

1. Add an entry to `docs/manual/node-voice.json`. `what` and `when` are
   required; the script throws without them.
2. Add per-field `put`, `example`, `empty` and `watch` only where you have
   something the editor's own hint does not already say. The script measures the
   overlap between your `put` and the hint it sits under, and **throws above
   70%**. That guard exists because the flaw was fixed by hand once and then
   reintroduced at scale in the next two batches — 48 fields said nothing the
   hint had not already said. A machine check does not forget between rounds.
3. Run `npm run gen:manual`. That re-extracts the inventory, rebuilds the
   pages and rebuilds the search index in one go.
4. Run the coverage gate: `npx vitest run src/manual.coverage.test.ts`.

`nodes/fx-pay.html` is hand-written and has no voice entry, so the generator
leaves it alone. It is the exemplar the generated pages are shaped after.

## Limits rows

A Limits row is only printed when the schema actually enforces something:
a min, a max, a step, a choice list, an on/off. Text fields get no Limits row,
because "Any text." is not a limit and a reader scanning for a real constraint
is better off not seeing it. Where a practical limit matters anyway — keep a
bank statement label short — say it in the voice entry's `limits`.

## Language

`G6` in `src/manual.coverage.test.ts` enforces the project's jargon list and
the filler list on every page, including everything in `node-voice.json`. The
rules the prose is written to: second person, present tense, active voice, no
sentence over twenty words, every how gets a why, and UI labels quoted with
`<b class="ui">` only when they really appear in the editor.

## Colour

Colours are never invented here. They come from the editor's own palette, via
`manual.css`'s `:root`: ten category hues, `ok`/`warn`/`danger`, and four wire
kinds copied from `HANDLE_STYLE` in `src/schema/edges.ts`. If the editor
changes a hue, the manual follows by editing that one block.
