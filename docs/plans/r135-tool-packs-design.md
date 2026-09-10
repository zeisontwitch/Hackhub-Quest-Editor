# r135 (design): Tool packs — a mod for our mod

Zeis's question: mod authors build *new hacking tools* for the game, as mods.
Can those tools drop into a folder of **our editor** and load up **as nodes**,
so quest authors can use them in their stories — with an SDK or documentation
defining the package format?

**Answer: yes — and the game-side half already exists.** This document is the
design, staged for a build round. Nothing is built yet; roadmap row 12.

## The one insight the design stands on

A tool-mod author has *already done the hard part*: their game mod registers a
terminal command the player can run. What they have **not** been able to do is
let quest authors *script that tool's answers* — the thing our editor does for
built-in tools every day via `world.toolResponse`:

- The pinned SDK's `Shell.addCommandData(command, input, data)` is how a mod
  pre-places a tool's answer (our Harbour, Six Tries and Cold Storage all
  ship lynx/nmap/hydra answers this way; the simulator traces it as
  "Tool answer placed").
- The SDK's `CommandDataMap` types the **built-ins** and says mod commands
  "fall back to permissive `unknown` input/data, so they keep working without
  a map entry" — i.e. the extension point for third-party command data is
  *declared in the pinned SDK today*, not a patch promise.
- `docs/07` BUG 7 (fence): on the current build the data list is append-only,
  first-match-wins — our runtime already writes remove-before-write, which
  the dev confirmed stays harmless after the fix. And: "scripted command data
  outlives the mod that registered it."
- Our runtime already emits `class extends sdk.Command` + `RegisterCommand`
  (`runtimeSource.ts:2102/2136`) — the editor ships custom terminal commands
  today.

So a quest author using a community tool needs exactly what they need for
`nmap`: a node that says *"when the player runs `<command>` with `<input>`,
the answer is `<data>`"* — plus the honesty that the tool only exists in-game
if the player installed that tool mod.

## The contract: a declarative manifest, no executable code

A **tool pack** is a folder with `toolpack.json` + docs. v1 is strictly
declarative — the editor is a trusted app and never evaluates third-party
JavaScript. Sketch:

```jsonc
{
  "format": 1,
  "id": "spectre-tools",
  "name": "Spectre Tools",
  "author": "…", "version": "1.2.0",
  "gameMod": { "name": "Spectre Tools", "where": "…", 
               "note": "players must have this mod installed" },
  "tools": [{
    "id": "shodan-scan",
    "command": "shodan",              // the command their game mod registers
    "label": "Shodan scan",
    "category": "Recon",              // palette group under "Community tools"
    "fields": [                        // become inspector fields
      { "key": "query",  "label": "Query",   "type": "string", "required": true },
      { "key": "depth",  "label": "Results", "type": "choice",
        "choices": ["top", "all"] },
      { "key": "answer", "label": "What the scan finds", "type": "text" }
    ],
    "data": { "query": "{{query}}", "results": "{{answer}}" },
    "docs": "One paragraph shown on the node and in the palette popover."
  }]
}
```

- **Fields → inspector.** The registry-driven node design (r124+) means a
  manifest's fields render through the same inspector primitives as built-in
  nodes; `{{data.*}}` tokens flow through string fields as everywhere else
  (so `{{query}}` can literally be `{{data.targetIp}}`).
- **Data → emission.** The node compiles through the `world.toolResponse`
  rail: `removeCommandData` + `addCommandData(command, input, data)` with the
  manifest's `data` template filled from the author's field values. The tool
  mod reads its own command's data via `getCommandData` and presents it.
- **No code execution, ever, in v1.** If a tool ever needs real editor-side
  logic, that is a deliberate escalation (sandboxed worker, reviewed packs) —
  fenced off until someone actually needs it.

## Drop-in, persistence, and the honesty warnings

- **Loading**: Tools → *Load tool pack* — a folder picker (File System Access
  API where available; multi-file pick otherwise). Packs persist in the
  browser; the palette gains a **Community tools** group with the pack's
  labels, icons and docs.
- **Projects stay portable**: nodes reference packs by `packId/toolId` and
  *store their field values in the project*. A project reopened without the
  pack still compiles — the node degrades to a generic community-tool stub
  with its stored values — so nobody's project is hostage to a pack.
- **Warnings (the design's spine):**
  1. A quest uses a pack tool → *"requires the <gameMod> mod on the player's
     machine — say so in your quest's description."* This is the difference
     between a built-in tool (ships with the game) and a community tool
     (ships with someone else's mod), and the editor must say it out loud.
  2. Pack not loaded → warning naming the pack.
  3. Pack version older than the one the project was authored with → warning.
- **Export** stamps used packs into the mod's README/metadata: "Requires the
  <X> game mod (by <author>) for its <tool> tools."

## The one unverified link (QA before/with the build round)

Everything above uses *shipped, pinned-SDK* surface except one assumption:
**that `addCommandData` placed for a mod-registered command actually
surfaces when the player runs that command** (the tool mod calling
`getCommandData` on its own command). The SDK's types permit it; the engine's
behavior needs one in-game check — Zeis knows tool-mod authors, so this is a
five-minute ask, and it is now on the QA list. If it somehow fails, the
fallback design (pack tools emit their own `sdk.Command` subclass into
mod.js, since our compiler already does that) covers the same ground with a
little more emission work.

## Deliverables for the build round

`ToolPackSchema` (zod, versioned `format`) → loader UI + persistence →
palette "Community tools" group → generic pack-node rendering (inspector
fields from the manifest) → emission through the toolResponse rail → the
three warnings → simulator support (free, if emission reuses the rail) →
`docs/ToolPack-Format.md` spec + an example pack under `reference/` → a
Cookbook card ("Community tools") in a rider round.

## Status

Design staged; awaiting Zeis's go. The website-polish round (r134) ships
first per his instruction; tool packs queue behind it and the r131 builds.
