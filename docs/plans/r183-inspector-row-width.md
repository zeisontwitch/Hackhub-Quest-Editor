# r183 (plan): the boxes were cut off — inspector rows that fold

Zeis's second fixture pass, with two screenshots and one request:

> That's all you wanted, right? Confirmation of what the editor itself shows, not
> exporting the mods and testing them in-game? […] I think we might need to widen
> the standard inspector width, seeing as the input fields get clipped like that.
> Or find a different solution.

Two things happened here, and the second one is a real editor bug.

## 1. S-12 and S-15 pass

The screenshots show both fixtures opening on their quest now, with the data the
migration fixtures exist to prove:

| Row | What the screenshot shows |
| --- | --- |
| **S-12** `fixture-pre-r176-after.project.json` | "When it fires" reads **Wait**, the **Hours** box shows **2**, the readback says "= 2 hours", and the canvas card reads **2h**. |
| **S-15** `fixture-r176-coming-day.project.json` | "When it fires" reads **A coming day**, the clock reads **18:23**, the preview says "Fires in 2 weeks, at 18:23 in-game, counted from the day the story reaches this node", and the canvas card reads **in 2w at 18:23** — the r176 `offsetAmount`/`offsetUnit` pair landed in the **Weeks** box. |

**His question — "that's all you wanted, right?" — yes.** Both rows are
editor-only: open the file, read the boxes. No export, no install, no in-game
step. The table said "Look at the Timer node" but never said "and that is the
whole row", which is exactly the ambiguity that made him ask; `TIMER-ROWS.md`
now says it outright.

## 2. The clipped row: `columns: 4` in a 340px panel

Screenshot 2 shows the "In" row's boxes running off the inspector's right edge.
The arithmetic is not close:

- docked inspector floor and default: **340px** (`DOCKED_WIDTH`)
- each cell is `px-3` → **24px** of padding, plus a `gap-1.5` **6px**, plus the
  unit caption ("weeks" ≈ **36px** at 10.5px) and a usable number box (**≥44px**)
- so one cell needs ≈ **110px**, and the four-box row needs ≈ **28rem**

At 340px the four columns get 85px each — 61px after padding — leaving the
number box about 20px. The boxes were never going to fit; they only looked
plausible because the caption is `shrink-0`, so the input collapsed first and
the row then overflowed.

**Fix: the row folds instead of clipping.** The row wrapper is now a
**container** (`@container`), and the column count follows the *panel's* width,
not the window's — the inspector is resizable, so a viewport breakpoint would be
wrong the moment someone dragged it:

| Row | At the 340px default | When the panel is dragged wider |
| --- | --- | --- |
| Timer "In" (4 boxes) | 2 × 2 | one line of 4 above **28rem** |
| Timer "Wait" (6 boxes) | its shipped 2 lines of 3 | unchanged — it only folds below **21rem**, under the docked floor, which is where a narrow floating drawer lives |

Verified in the built CSS, not just the class list: the build emits
`@container (width>=28rem){…grid-cols-4…}` and
`@container (width>=21rem){…grid-cols-3…}`.

**Why not simply widen the default?** Because it only moves the cliff: the panel
can be dragged to 340 (the floor) and floated to 280, and the four-box row needs
448. Folding works at every width the author can choose, and leaves a wider
panel as the way to get the one-line version. The 340px shipped default is
untouched, so nobody's layout shifts except the row that was broken.

**What cannot be tested here:** jsdom has no layout, so no test can prove the
boxes now fit. The tests assert the shape of the fix — the row declares a
container, folds below the width its captions need, and never uses a bare
`grid-cols-4` again — and the pixels are a screenshot pass for Zeis.

## Scope

Editor layout only: `Field.tsx` (row grid) plus one new test file. No schema,
registry, compiler or runtime change, so `EDITOR_BUILD` moves to
`2026-09-18.r183` and the QA export to **1.0.11** for the stamp.
