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

## Follow-up (same round): sockets where you look, and the noodle, after all

Zeis's screenshot of the builder caught the discoverability hole: the 🎯s
lived only inside the 🔗 popover, and the natural place to look is the page
row in the sidebar. "Am I missing something or are the targets not
displayed?" — neither; they were somewhere nobody would look. His follow-up
proposal: keep the picker but *fake the wire* — render a noodle from the
destination page in the sidebar to the mouse cursor, ghost-fade on place and
on Esc, with a reroute-nodule-style element riding the cursor.

Agreed and shipped — this was always the good part of the pick-whip. The
original objection was to drag *physics* (cross-iframe drag events,
ambiguous drop targets), and a rendered noodle has none of those problems:
arming is still a click, placing is still a click, and everything in between
is paint. What shipped:

- **Sockets on the sidebar rows**: every page row's hover actions now lead
  with an accent 🎯 ("Pick-whip: then click the text on the page that should
  link to this page"). Arming from a row switches to the Visual tab if
  needed — the gesture works from anywhere in the builder.
- **The noodle**: an accent bezier from the arming socket to the cursor
  (React Flow-style control points), with a reroute-nodule twin-circle at
  the tip. It renders the moment the gesture is armed (tip curled at the
  socket until the first pointer move), follows the cursor across the
  builder chrome *and* across the page iframe — same-origin mousemove
  forwarder, since iframe pointer events never reach the parent document on
  their own — and **ghost-fades where it stood** on place, Cancel and Esc
  (300 ms).
- The picker's 🎯 arms the same gesture (the noodle hangs from the popover
  row's socket), so both entry points are one flow.
- Manual switches to the Code/Preview tabs drop an armed noodle.

Point-to-link state is now shared (controlled) between the builder and the
visual editor (`TargetingState` — path + socket origin); the isolation tests
exercise the uncontrolled fallback. 1,230 tests green; the new test pins the
sidebar socket end to end: idle → arm (hint bar + noodle portal) → Cancel
(gone).
