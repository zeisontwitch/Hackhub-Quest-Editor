# r133: linking pages without touching HTML — the pick-whip round

Zeis approved the three r132 proposals and asked for linking to be *as
user-friendly as possible*, proposing an After Effects-style **pick-whip**:
drag a wire/noodle from the page in the sidebar onto the element on the
currently edited page that should link to it ("drag from the Contact page's
socket onto the 'Contact us' text"). This round keeps that gesture's magic
and works around its physics.

## The verdict on the literal noodle (recorded, not built)

The instinct is right — source and target visible at once, two gestures, no
dialog. Three things fight the literal drag in *this* medium:

1. **The iframe boundary.** The pages list lives in the builder document; the
   page being edited lives inside a same-origin iframe. HTML5 drag events
   stop at that boundary — the parent stops receiving `dragover` the moment
   the pointer crosses in — so every drag has to be forwarded by hand
   (attach listeners to `contentDocument`, `elementFromPoint` for the
   target). Doable, but fiddly and browser-sensitive.
2. **The target is ambiguous mid-drag.** An AE whip lands on a *property
   socket* — a well-defined object. In a text page the drop target is "some
   text inside some element", and "wrap the paragraph vs the word" cannot be
   guessed reliably from a hover position.
3. **The metaphor's true home is the quest canvas** — where dragging a wire
   from an output socket to an input *is* the authoring model, because quest
   graphs really are node-edge graphs. Page links are inline markup, not
   graph edges; the noodle has no lane to run in.

## What shipped: click-click, the pick-whip's sibling

The same directness as Figma's color picker / Blender's ctrl-pick, minus the
cross-document drag physics:

- **The link picker** — the toolbar's 🔗 (previously a bare `window.prompt`)
  now opens a popover listing the site's pages by title and path. Clicking a
  row links the current text selection; with nothing selected it inserts the
  path as a visible link (a collapsed selection used to do nothing — a link
  with nothing in it is a link that is lost). A free-path field stays for
  URLs and not-yet-existing paths. `@radix-ui/react-popover` (already a
  dependency) supplies anchoring, outside-click and Esc.
- **Point-to-link** — the 🎯 on each page row arms targeting: a hint bar
  appears ("Click the text on the page that should link to /contact — Esc
  cancels"), and the next click **inside the page** becomes the link. The
  clicked element's whole text is wrapped — the natural unit for the menu
  items, buttons and headings authors actually point at. Pointing at an
  *existing* link retargets it instead of nesting. That is Zeis's whip,
  click-click: page and target visible at once, zero dialogs.
- A drag version remains possible later (same-origin forwarding works) if
  the 🎯 feels like it is missing the noodle — deliberately not built until
  there is hands-on feedback saying so.

Implementation shape: the DOM operations are pure functions in `pageDoc.ts`
(`linkRange` extract/insert so selections crossing element boundaries work;
`linkElement` wrap-or-retarget), testable without the iframe; the editor
attaches one click + one keydown handler to the page document at load, which
read an armed ref — arming never touches the iframe. `VisualPageEditor`
gains an optional `pages` prop; the builder passes the sorted page list.

## Test notes

- `userEvent` hangs on Radix popover content mounting mid-click in jsdom —
  the picker test uses synchronous `fireEvent` (the standard workaround).
- The DOM helpers are pinned on plain jsdom elements: whole-text wrap,
  retarget-instead-of-nest, cross-boundary range link, collapsed-selection
  insert.

## Queued from the same approval (not this round)

- **Preview navigation** — a mini address bar so the preview follows in-site
  links and an author can walk the site like a player.
- **Multi-file import** — the AI flow returns one file per page; import them
  in one go, creating pages from filenames (`news.html` → `/news`).

## Status

Shipped in r133: link picker + point-to-link + the two pure helpers, 2 new
tests (1,229 total across 57 files), typecheck clean, build clean, stamp
`2026-09-11.r133`. The remaining approved website work is the two queue
items above; the r131 builds (campaign template, Kisscord contact lifecycle,
cookbook card) stay queued behind them per Zeis's approvals.
