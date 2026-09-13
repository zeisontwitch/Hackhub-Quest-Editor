# r146 — The grey screen, part 3: the name twin (the real one)

## First, the correction

r145 diagnosed the grey screen as a launch race and explained it with an
assumption: "on a slow machine…". Zeis's machine is an i9-12900K with 64 GB
of DDR5 — not slow — and the project's standing rule is *never guess*. The
assumption was written as fact, and that was a process failure with a cost:
another round, another grey screen. The race r145 fixed is real and
documented (and the optimizer line disappearing from Zeis's terminal
confirms that fix did what it said), but it was never *this* bug.

The clue that mattered was in front of us the whole time, and Zeis named it:
**the grey screen appeared exactly when the grid round (r142) landed, on
every build since, and on no build before.** When his Firefox console
finally spoke, it named the culprit outright:

```
Uncaught SyntaxError: The requested module
'http://localhost:5173/src/editor/canvas/CanvasGrid.ts' doesn't provide
an export named: 'CanvasGridBackground'
```

`CanvasGrid.ts` does not exist in the repository.

## The bug

r142 created two files in the same folder:

| File | What it is |
|---|---|
| `src/editor/canvas/CanvasGrid.tsx` | the grid component (exports `CanvasGridBackground`) |
| `src/editor/canvas/canvasGrid.ts` | the preference/storage module |

Same name ignoring case (`canvasgrid`), differing extension (`.tsx` vs
`.ts`). `QuestCanvas.tsx` imported the component **extensionless**:

```ts
import { CanvasGridBackground } from "./CanvasGrid";
```

Resolution of an extensionless specifier tries each extension in turn —
`.ts` before `.tsx` — by asking the filesystem whether
`CanvasGrid + extension` exists:

- **Linux (this sandbox, and everywhere the gates run):** case-sensitive.
  `CanvasGrid.ts` does not exist; `canvasGrid.ts` is a different name.
  Resolution falls through to `CanvasGrid.tsx` — correct. Every test, every
  crawl, every build: green.
- **Windows (Zeis, NTFS):** case-insensitive (case-preserving). Asked for
  `CanvasGrid.ts`, the filesystem answers *yes — that's `canvasGrid.ts`*.
  Resolution stops at `.ts` and binds the import to the **preference
  module**, which has no `CanvasGridBackground` export. The browser dies
  with the SyntaxError above; the module graph never finishes; React never
  mounts; the page shows background colour and nothing else.

**Reproduced end to end.** Simulating the Windows view (a `CanvasGrid.ts`
copy of the preference module) made the dev server rewrite QuestCanvas's
import to `/src/editor/canvas/CanvasGrid.ts` and serve the preference
module at that URL — zero mentions of `CanvasGridBackground` — which is
precisely Zeis's console error, character for character. Removed the
simulation, resolution returned to `.tsx`.

Why it survived r144 and r145: it was never a timing problem and never a
code-crash problem. The editor boots clean everywhere; on Windows the
browser is simply handed the wrong module. Linux-side gates are structurally
blind to it.

## The fix (two locks)

1. **The component file is renamed** `CanvasGrid.tsx` →
   `CanvasGridBackground.tsx` — no name, in any casing or extension, can
   collide with `canvasGrid.ts` — and its import now spells the extension:
   `from "./CanvasGridBackground.tsx"`, so no extensionless resolution
   happens at all. (`allowImportingTsExtensions` was already on.)
2. **A guard test makes the whole bug class unshippable**
   (`src/__tests__/filenameSafety.test.ts`): within any directory, no two
   JS/TS-family files may share a lowercased stem — `foo.ts` next to
   `Foo.tsx` is exactly as fatal as `foo.ts` next to `foo.tsx`. Falsified:
   a planted `TempProbe.tsx` + `tempprobe.ts` pair fails the test by name;
   removed, it passes. The original pair (`canvasgrid`/`canvasgrid`) is the
   shape it catches.

## Verification

- Reproduction above (import flip + wrong module served + missing export).
- Post-fix: the dev server resolves the import to
   `/src/editor/canvas/CanvasGridBackground.tsx`; the guard passes on the
   clean tree.
- Gates: typecheck clean, **1,379 tests / 67 files** green, build clean.
  No `EDITOR_BUILD` bump — nothing the compiler emits changed (AR13).
- Zeis's verification: a fresh zip should simply boot. If a grey screen
  ever appears again, the F12 console is the first thing to send — it
  solved this one.

## The lesson, recorded

The environment difference (Linux sandbox vs Windows user) was the whole
bug. "Works on my machine" was *literally true* and completely useless.
Two rules going forward: never explain a failure with an unverified
property of the user's machine; and when a bug appears exactly when a
round lands, read that as the primary clue — r145's race theory required
believing a coincidence (that his machine started losing a pre-existing
race the same day a colliding filename shipped). Occam had the answer in
the round number.
