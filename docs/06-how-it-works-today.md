# How the editor works today

**Current as of build `2026-09-05.r115`.** Where the other documents are
histories — how we got here, and what we learned on the way — this one is a
snapshot of the thing as it stands. If it disagrees with an older document,
this one is right.

Verified figures, counted from the code rather than remembered: **1,008 tests**
across 38 files, **31 node types** in 9 categories, **8 templates**, **92 game
events**, against `@hotbunny/hackhub-content-sdk@0.21.0`.

---

## 1. What it is

A browser app that lets someone build a HackHub quest mod without writing code.
The author works on a node canvas; the editor compiles that graph into a
TypeScript mod and hands back a `.zip` the game can load.

No backend, no accounts, no build step for the author. Everything lives in the
browser: the project in memory, a draft in `localStorage`, the export as a
download.

## 2. The shape of the code

```
src/
  schema/        the project model, and the node-type registry that drives everything
  store/         Zustand + Immer: undo/redo, autosave, path-addressed writes
  editor/
    canvas/      React Flow surface, wires, physics, node search, arrange tools
    inspector/   registry-driven fields, colour picker, condition builder
    palette/     the node library
    websites/    the in-game website builder
    shell/       top bar, dialogs, status bar, overlays
  compiler/      project → TypeScript mod, plus the runtime the mod ships with
  templates/     eight starting points
  analysis/      graph checks that feed the issue badges
```

The **registry** (`schema/registry.ts`) is the spine. Every node type declares
its label, category, sockets, fields and compiler hook in one place, and the
palette, canvas, inspector, analysis and compiler all read from it. Adding a
node type is one registry entry, not five edits.

## 3. The pieces worth knowing about

### The compiler
`compiler/compile.ts` walks the project and emits a mod; `runtimeSource.ts` is
the interpreter that ships inside it, as a `String.raw` template. That template
is the single largest piece of hard-won knowledge in the project — nearly every
comment in it records a specific in-game failure. Read them before changing it.

**Watch out:** because it is a template literal, a stray backtick in a comment
terminates it. That has broken the build at least once.

### Editor preferences
Four toggles live outside the project document, in `localStorage`, each with the
same shape (a module value, a `useSyncExternalStore` subscription, a setter):

| Preference | Module | Default |
|---|---|---|
| Snap to grid | `snapGrid.ts` | off |
| Animated wires | `wireMotion.ts` | on |
| Springy wires | `wirePhysicsPref.ts` | on |
| Wire tuning numbers | `wireTuning.ts` | see the file |

They are deliberately **not** in the project: a view preference should not be
exported with someone's mod, and should not create an undo entry.

### Wire physics
A damped spring on the midpoint of the wire being dragged — one wire at a time,
never the resting ones. The loop writes one `d` attribute per frame and nothing
else. Released wires wind back to their socket like a vacuum-cleaner cable.
Numbers are tunable live from the debug panel.

### The debug panel
The **Debug** button on the canvas. Shows the build stamp, whether wire physics
is allowed and which switch refused it, loop counters and FPS, sliders for every
physics number, and a rolling log of the last sixty events. Costs nothing while
closed.

It exists because a run of bugs all had the same shape: something upstream
refused a feature silently, and the UI looked identical either way.

## 4. Rules this codebase follows

These are not style preferences. Each one is the scar of a specific bug.

**Never write per-frame state above the canvas.** An animation that wrote a
custom property to the document root cost 40.8% of an idle frame; scoping it to
the canvas still cost 29%, because the property had to inherit. Now each
animated element owns its own property and nothing inherits. See the header of
`wireMotion.ts`.

**One writer per DOM attribute.** The wire physics loop writes `d`. When a React
`d` prop existed alongside it, React rewrote the attribute on every pointer move
and the physics looked completely dead.

**Compute, don't measure.** Reading geometry back from the DOM failed three
times running — our own measurement map was empty at click time, React Flow's
was populated only after its observer ran, and jsdom has no layout at all. Node
sizes are computed from known constants, and `nodeSize.test.ts` asserts those
constants still match the component.

**A test that cannot fail is worse than no test.** Several bugs shipped green
because the test never exercised the path — it early-returned, or asserted a
string that changed for an unrelated reason. Every guard should be checked by
reverting the fix and watching it fail.

**jsdom will lie about anything visual.** It has no layout, no compositor, no
`Element.animate`, no `PointerEvent`, no `setPointerCapture`. Assertions about
appearance belong in a human's hands; say so rather than writing a test that
looks like coverage.

## 5. Working on it

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm test
npm run build
```

The whole suite runs in about a minute. `npm run build` runs typecheck first.

## 6. Where the rest of the documentation is

| Document | What it is |
|---|---|
| `01-analysis-and-architecture.md` | The original design and its reasoning. Mostly still accurate. |
| `02-editor-shell.md` | **Archive.** An append-only build log, rounds 1–74. Not current, but the bug histories in it are load-bearing. |
| `03-questions-for-the-developers.md` | Open questions about the game and SDK. |
| `04-engine-bug-quest-completion.md` | The engine bug that stops a mod quest completing, with a minimal reproduction. |
| `05-bug-report-for-hotbunny.md` | The consolidated report sent to the game's developer. |
| `plans/` | Per-round working notes: the evidence behind specific fixes. |
