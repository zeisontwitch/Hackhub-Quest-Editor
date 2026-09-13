# r138 (plan): Editor Mods — pack-authored nodes

Zeis's north star from the r135 design: a pack's `"nodes"` section grows the
editor's palette — community nodes with the pack's own labels, docs and
fields, emitting through **declarative templates only** (never JavaScript in
the compiler). This round builds that on the rail r137 laid.

## The architecture decision: one generic type, pack-authored presentation

The design's letter says packs "extend the registries at load". The node
*type* system cannot do that honestly: `NodeSchema` is a static discriminated
union, `NODE_TYPES`/`NodeType` derive from it, and the compiler's
exhaustiveness checks (summarize's `never` arm, the registry field audit) are
the scar tissue of past bugs — a runtime-mutated zod union would dissolve
them. So:

- **One permanent generic node type, `pack.node`** (category **community**,
  same teal as the pack rail). Its data is a **full snapshot**: pack id/name/
  version, gameMod name, the pack node's id/label, the emitter and its whole
  config, the field definitions, and the author's values. Exactly the
  world.packData rule that already works: snapshot at authoring time, the
  node compiles even where the pack was never loaded, pack-less reopen
  renders a stub with the stored values.
- **The palette grows per pack**: every loaded pack with `nodes[]` gets an
  "Editor Mods · <pack name>" group; each entry adds a `pack.node` with the
  snapshot pre-filled. The add-node search offers the same list ("whatever
  the palette offers, search offers").
- The compiler stays exhaustive: one `pack.node` case switching on the
  snapshotted emitter.

## The emitters (format 2 `nodes[]`)

Every config is a JSON template with `"{{fieldKey}}"` holes (the author's
form answers) and `{{data.*}}` story tokens (resolved at runtime by the
existing `__QE.fill`). No code, ever.

| emitter | what it does at runtime | config |
|---|---|---|
| `sdk` | calls `sdk.<Namespace>.<method>(…args)` in order, inside `__QE.safe` | `steps: [{ call: "Namespace.method", args: [...] }]` |
| `emit` | fires the pack's own event: `sdk.Events.emit(name, payload)` | `eventName`, `payload` (template) |
| `storage` | writes a SharedStorage key — the world.packData emission, generalized | `key`, `merge` (overwrite/replace+`mergeBy`), `entry` |
| `commandData` | places scripted tool answers: `Shell.addCommandData(command, data)` | `command`, `data` |
| `listen` | **not in v1** — r137's trigger picker + trigger node already give pack events the full clause engine; a second listening surface would be a worse duplicate of a thing that exists. Documented in the format spec as "use triggers". | — |

Fields are the existing `PackFieldSchema` vocabulary (key/label/type/hint/
choices) — the no-code rule applies to pack authors' labels verbatim.

## Surfaces touched

- `toolpacks/schema.ts` — `PackNodeSchema` (the `nodes[]` section, no longer reserved).
- `schema/nodes.ts` + `registry.ts` — `PackNodeDataSchema`, the `pack.node` def.
- `store/packs.ts` — `packNodeDefs(packs)` → synthesized `NodeTypeDef`s (type
  `pack.node`, per-entry label/blurb/icon + `addData` snapshot).
- `store/editor.ts` — `addNode(type, position, data?)` (optional snapshot patch).
- Palette + add-node search + canvas drop — pack groups, JSON-aware DnD payload.
- `GraphNode` — card label from `data.nodeLabel` (def label stays "Community node").
- Inspector — `PackNodeEditor` (fields → labelled inputs; honesty line; stub note).
- Compiler — `pack.node` case (four emitters), `packModsUsed` + not-set-up warning.
- Simulator — `Events.emit` and `Shell.addCommandData` stubs record payloads.
- Reference sheet + starter pack: one worked node per emitter kind.

## Honesty spine (unchanged)

Values in, project stays portable; warnings at node use ("needs the <X> game
mod"), export stamp and README name the pack; pack-less reopen renders the
stub and says what is missing. jsdom cannot test drag-and-drop or visual
chrome — those are Zeis's five-minute in-game/editor eyeball checks.

## Gates

typecheck + tests + build (no lint). Stamp `2026-09-13.r138`.
