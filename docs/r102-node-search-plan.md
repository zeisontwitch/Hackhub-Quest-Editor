# Right-click node search — design & build plan (roadmap 5)

**Role:** acting as lead UI/UX for this feature.
**Reference:** Blender's node editor Add menu; Zeis's command palette.
**Status:** plan only — no code written yet.

---

## 1. What the user is actually trying to do

Adding a node today means: look away from the graph → find the palette on the
left → scan or search it → drag across the whole window → drop. The author's
attention leaves the place they were thinking about, and the drag is a
fine-motor task that scales badly with distance.

The job is: **"put a node *here*, and I mostly know what it's called."**

Two things follow. The node must appear where the author gestured, not where a
panel happens to be. And typing must be the primary input, because a name is
faster to recall than an icon is to spot.

## 2. Reference behaviour

**Blender** (verified against the 5.2 manual and community answers):

- `Shift+A` over the node editor opens the Add menu **at the mouse**.
- **You just start typing** — there is no separate "enter search mode" step.
  This is the single most-praised detail; the 4.0 release notes call it out.
- Dragging a wire into empty space opens the same search, and the chosen node
  is **created already connected**.
- `Ctrl+F` is a *different* feature: find an existing node. Worth not confusing.

**Zeis's command palette:** a single input line that grows downward into results
as you type, sized to its contents.

**What we take:** open at the pointer; type immediately; grow downward; Enter
accepts; Escape cancels. **What we skip for now:** the browse-by-category tree
(the palette already does that well) and wire-drop-to-create (§8).

## 3. Interaction specification

### Opening
| Trigger | Why |
|---|---|
| **Right-click on empty canvas** | The roadmap item. Right-click is the universal "act here" gesture and currently does nothing on the pane. |
| **`Shift+A`** with the pointer over the canvas | Blender muscle memory, free to add, no collision (§5). |

Opens with the input focused and empty. **Not** a modal: no backdrop, no focus
trap over the whole app — it is a transient popover, like an autocomplete.

### While open
- **Typing** filters instantly. No debounce: the list is ~30 items, and a
  debounce would make it feel laggy for no gain.
- **↓ / ↑** move the highlight, wrapping at both ends.
- **Enter** adds the highlighted node. **Tab** does the same (palette habit).
- **Escape** closes, adds nothing.
- **Click** an item adds it. **Click outside** closes.
- **Scrolling / panning the canvas** closes it — the anchor point would
  otherwise drift away from where the node will land, which is a lie.

### Where the node lands
At the **canvas position of the original right-click**, using the same
`screenToFlowPosition` and the same `-20/-24` nudge as the existing drop
handler, so a searched node and a dragged node land identically. The position
is captured **at open time** and reused on accept — not re-read on Enter, when
the pointer may have moved.

### Ranking (matters more than it sounds)
An author typing "mail" should get the mail node first, not a node whose blurb
happens to contain the word. Order:

1. label starts with the query
2. label contains the query
3. node type id contains it (`comms.dialogue` for someone who thinks in ids)
4. blurb contains it

Ties keep palette order, so the list is stable and learnable. Same fields the
palette already searches — one vocabulary, not two.

### Empty and edge states
- No query → show everything, palette order, grouped by category header.
- No matches → one line: *"No nodes match 'xyz'."* Never an empty box.
- The list caps at **8 visible rows** and scrolls, with the highlight kept in
  view. Uncapped, a popover can run off the bottom of the screen.

### Placement
Anchored at the pointer, then flipped or clamped to stay on screen — dropping
upward when near the bottom edge, shifted left near the right edge. A popover
that opens half off-screen is worse than no popover.

## 4. Accessibility

Not optional, and cheap here:

- `role="dialog"` + `aria-label="Add a node"` on the container.
- The input is a `combobox`: `aria-expanded`, `aria-controls`,
  `aria-activedescendant` pointing at the highlighted option.
- The list is `role="listbox"`, each row `role="option"` with `aria-selected`.
- Focus moves to the input on open and **returns to the canvas on close**, so
  keyboard users are not stranded.
- The highlight is a visible ring, not just a background tint — the same
  affordance the rest of the editor uses for selection.

## 5. Pitfalls, and what we do about each

Ordered by how likely they are to bite.

### P1 — jsdom will lie to us again
Today's lesson, four rounds running: jsdom measures nothing, so anything
depending on element geometry passes in tests and fails in the browser.

*Mitigation:* the same discipline that finally worked for alignment —
**compute, don't measure**. Popover placement is derived from the click point
and `window.innerWidth/Height` (both settable in jsdom) plus **known
constants** for the popover's own size, not `getBoundingClientRect()`. The
placement maths goes in a pure module with its own tests, and the constants are
asserted against the CSS the same way `nodeSize.test.ts` guards `GraphNode`.

### P2 — Escape already clears the selection
`useKeyboardShortcuts` handles `Escape` on `window`. If the popover is open,
Escape must close *it* and nothing else.

*Mitigation:* the popover handles Escape and calls `stopPropagation()`; a test
asserts that Escape with the popover open leaves the selection untouched.

### P3 — right-click is currently swallowed
r92 made the pane `preventDefault()` its context menu to fix a stuck selection
rectangle, and `panOnDrag` no longer includes button 2. That is exactly the
hook we need — but the fix must not regress r92.

*Mitigation:* open the popover from the same handler that already
`preventDefault()`s. The r95 selection-gesture tests must stay green.

### P4 — Delete/Backspace eat nodes while typing
The global shortcut skips `INPUT` targets via `isTypingTarget`, so an `<input>`
is safe. But an author pressing Backspace on an *empty* query is a normal
gesture and must not delete the selected node.

*Mitigation:* covered by `isTypingTarget`; add a regression test, since this
would be a genuinely destructive bug.

### P5 — typing "d" duplicating, "v" pasting
`Ctrl+D`/`Ctrl+V` etc. are mod-key guarded, so plain typing is fine. But
`Ctrl+V` **inside** the search box should paste text, not paste nodes.

*Mitigation:* the mod-key branch already checks `isTypingTarget`. Test it.

### P6 — the popover reopening or flickering on canvas re-render
The canvas re-renders on every selection change. A popover whose open state
lives in component state could be reset by an unrelated re-render.

*Mitigation:* open state lives in a `useState` on the canvas but keyed by
nothing that changes during use; the anchor is a `ref`. **No store field** —
this is transient UI, not project data, and putting it in the store would add
an undo entry (the r96 lesson about the snap toggle).

### P7 — performance regressions
Standing risk, per Zeis's instruction and the r42/r44/r95 history.

*Mitigation:* no `requestAnimationFrame`, no store subscription, no listener on
`window` that survives close. Listeners are added on open and removed on close.
The existing `canvasPerformance.test.tsx` guards stay green, and I will add one
asserting the popover leaves no listeners behind after closing.

### P8 — structural node types  *(checked: not a problem)*
I assumed some types would be unsafe to offer. Verified instead: `paletteGroups()`
returns **all 31** registered types, and the palette already offers every one of
them — including `flow.reroute`, `layout.group` and `flow.note`. Dragging a
reroute from the palette is already possible today.

*Decision:* search shows exactly what the palette shows. Same source, same set,
no second opinion about what is addable. If reroute-in-the-palette is wrong, it
is wrong in both places and is a separate fix.

### P9 — mouse-vs-keyboard highlight fighting
Classic autocomplete bug: the mouse hovers row 3, the keyboard moves to row 4,
and both look highlighted.

*Mitigation:* one highlight index; hover sets it. Mouse movement only counts as
hover when the pointer actually moves, so an arrow key under a stationary
pointer does not get overridden.

## 6. What I am deliberately not doing

- **No fuzzy matching.** "cmsdlg" → Dialogue is clever and unpredictable;
  substring matching is explainable. Revisit if asked.
- **No recently-used section.** Real value, but it needs persistence and a
  clear-history story; a follow-up, not v1.
- **Not replacing the palette.** Discovery by browsing is still how a new
  author learns what exists.
- **Not touching wire-drop-to-create** in this round (§8).

## 7. Test strategy — given jsdom burned us today

Three layers, deliberately:

1. **Pure logic, no DOM** — ranking/filtering and placement maths as plain
   functions. Fast, and where the real complexity lives.
2. **Mounted behaviour** — open via real right-click, type real characters,
   arrow, Enter; assert a node exists in the store at the expected position.
   Driven with `userEvent`, no synthetic internals.
3. **Falsification** — every new guard reverted once to prove its test fails.
   No test lands green without being seen red.

**Explicitly assumed unverifiable in jsdom** (and therefore checked by Zeis in
the preview, not asserted): visual placement near screen edges, and the
scroll-into-view of the highlight. I will say so rather than write a test that
looks like it covers them.

## 8. Open questions for Zeis

1. **`Shift+A` as well as right-click?** Free to add and matches Blender. Any
   objection?
2. **Wire-drop-to-create** — drag a wire into empty space, search, and the new
   node arrives already connected. Blender's best add-node feature, and a
   natural fit, but a bigger change to `onConnectEnd`. Now or later?
3. **Reroute in the list** — the palette already offers it (P8), so search will
   too. Flag if you would rather both hid it; that is a separate change.

## 9. Build order

1. Pure ranking module + tests.
2. Pure placement module + tests (constants asserted against the CSS).
3. The popover component, keyboard model, a11y.
4. Wire into the canvas: right-click, `Shift+A`, Escape precedence.
5. Mounted tests, falsification pass, performance guard.
6. Hand to Zeis for the two things jsdom cannot judge.
