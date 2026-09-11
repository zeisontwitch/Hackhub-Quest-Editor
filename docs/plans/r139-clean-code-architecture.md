# r139 (plan): Clean Code & Architecture pass

## Why this round

r137 + r138 shipped tool packs and Editor Mods — a whole new rail (palette
synthesis, snapshot nodes, four emitters, honesty spine). The feature works,
but the code that grew around it accumulated the exact debt the project's own
rulebook warns about:

- **A React key bug**: `pack.node` has one `NodeType` for many palette entries.
  Both the palette and the add-node search used `def.type` as the React key,
  so every pack node shared the key `pack.node`. Tests already log the
  warning: "Encountered two children with the same key, `pack.node`". That's
  not cosmetic — React may drop or duplicate entries. (Rule B1/B8, but really
  a correctness bug.)

- **A 300-line warning function**: `computeWarnings` in `compiler/compile.ts`
  does everything — quest startability, firewall/port checks, network
  orphans, version strings, login-less devices, lynx handles, handbook,
  dialogue, community nodes, placeholder hosts. One function, ~15 jobs.
  Violates F1 (one function, one job) and F2 (target <20 lines). Adding a new
  check means editing the same giant switch.

- **An ungoverned permission switch**: `computePermissions` is a hand-maintained
  `switch (nodeType)` that must be updated for every new node. `pack.node`
  was added in r138 and never taught it, so a pack node that emits
  `Events.emit` or `Shell.addCommandData` compiles with no permission — the
  exported mod is then refused at runtime ("Mod null … without … permission").
  That's AR17 (least privilege must not be omitted) and the project's own
  anti-pattern: "an ungoverned switch standing in for a registry entry".

- **DRY violations**: `packNodeDefs` clones with `JSON.parse(JSON.stringify(...))`
  four times; `store/editor.ts` does the same in clipboard code while a
  `clone` helper using `structuredClone` already exists in the same file.
  Rule A3.

- **Module boundary drift**: pure pack helpers (`packNodeDefs`, `packEvents`,
  `packEventByName`) live in `store/packs.ts`, which is the Zustand persistence
  layer. They don't touch the store — they are pure functions that belong in
  `toolpacks/` (AR5 cut by feature, AR6 explicit boundaries, AR10 store access
  only in React).

This round pays that debt without changing behaviour. No new feature, no new
node type, no new emitter.

## What changes

### 1. Fix duplicate keys (bug, not style)

- `src/editor/palette/NodePalette.tsx` and
  `src/editor/canvas/NodeSearchPopover.tsx`: use a unique key per def.
  For pack nodes that's `addData.nodeId` (`<packId>/<nodeId>`), for static
  nodes it's still `def.type`. One-line fix, verified by the existing test
  that already triggers the warning.

Rule: correctness — a React key must be unique (B1 intention-revealing).

### 2. Split `computeWarnings` into focused helpers (F1, F2, F3)

Extract per-concern functions, each <20 lines, each with a single job:

- `warnUnstartableQuests`
- `warnNetworkStructure` (orphans, strays, domains, loginless, badVersions)
- `warnFirewallAndPort`
- `warnToolResponse`
- `warnHandbook`
- `warnDialogue`
- `warnCommunityNodes` (bare packData / pack.node)
- `warnHostsAndPages` (duplicate hosts, placeholder hosts, duplicate paths,
  slash-less paths, hidden pages)

`computeWarnings` becomes an orchestrator that calls them in order and
concatenates. Behaviour identical, diff reviewable per helper.

### 3. Replace permission switch with a declarative map + pack handling (AR3, AR17, A3)

- Introduce `PERMISSIONS_BY_NODE_TYPE: Record<NodeType, string[]>` — the single
  source of truth for static nodes.
- `computePermissions` iterates nodes and unions the map entry, plus
  `tokenPermissions`.
- For `pack.node`, inspect its snapshotted emitter:
  - `emit` → `events`
  - `commandData` → `shell`
  - `sdk` → parse `steps[].call` prefix (`Events.` → events, `Shell.` → shell,
    `Network.`/`Database.` → network, `Mail.` → mail, `Bank.` → bank, `UI.` → ui)
  - `storage` → none (SharedStorage is always available)

This closes the permission gap for pack nodes and makes adding a future node
type a one-line map edit, not a switch hunt.

### 4. DRY: structuredClone everywhere (A3, B5 consistent vocabulary)

- In `store/packs.ts`: replace `JSON.parse(JSON.stringify(x))` with
  `structuredClone(x)` via a small `deepClone` helper (falls back to JSON for
  jsdom if needed, but `structuredClone` is already used in `compile.ts`).
- In `store/editor.ts`: `copySelection` and `pasteClipboard` already have a
  `clone` helper using `structuredClone` — use it, remove the JSON hack.
- In `toolpacks/schema.ts`: no change needed (zod handles it).

### 5. Move pure pack helpers to `toolpacks/` (AR5, AR6)

- Create `src/toolpacks/palette.ts` (or `src/toolpacks/helpers.ts`) exporting
  `packNodeDefs`, `packEvents`, `packEventByName` — pure, no store import.
- `store/packs.ts` keeps only persistence (`loadStored`, `persist`, `usePacks`
  store). It re-exports the helpers for backwards compat or the UI imports
  from `toolpacks/palette.ts` directly.
- Update imports in `NodePalette.tsx`, `NodeSearchPopover.tsx`,
  `packDataEditor.test.tsx`.

This restores AR5/AR6: feature logic lives in its feature folder, store is
just store.

### 6. Minor clean-ups (Boy Scout Rule, A7)

- `stripFurniture`: split bypass creation into `createBypassEdges` to reduce
  nesting from 3 to 2 (F3) and to name the intent.
- `packModsUsed`: unify the two branches (packData vs pack.node) into one
  helper `collectPackMod`.
- `setPath`/`getPath` in `store/editor.ts`: add TSDoc per C5, keep English.

## What does NOT change

- No new node type, no new emitter, no new UI.
- `runtimeSource.ts` stays untouched (String.raw template — editing comments
  risks breaking the build, per the project's own hazard note).
- No DI container, no repository layer, no generic form generator — YAGNI
  (A5) and the project's explicit rejection in docs/01 §4.1.

## Gates

- `npm run typecheck` 0 errors
- `npm test` green (1,316 tests — the duplicate-key warning must disappear)
- `npm run build` succeeds
- Manual check: palette shows "Editor Mods · <pack>" with two nodes, each
  clickable, no console warning.

## Stamp

`2026-09-13.r139` (same day as r138, clean-code follow-up).

## Future recommendations (not in this round)

- **Settings page** (roadmap #5): wire-physics dials live in debug panel;
  extract `src/editor/settings/` with the existing preference modules
  (`snapGrid`, `wireMotion`, `wirePhysicsPref`, `wireTuning`) — AR20 externalized
  tunables, AR5 feature folder.
- **TargetRules lint** (r135 design): needs a real second pack to design
  against — deliberately deferred, keep deferred.
- **Branching template "Two Ways Out"**: approved, not built — separate content
  round, not a clean-code round.
