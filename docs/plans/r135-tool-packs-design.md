# r135 (design v2): Tool packs & Editor Mods — a mod for our mod

Zeis's question: mod authors build *new hacking tools* for the game, as mods.
Can those tools drop into a folder of **our editor** and load up **as nodes**,
so quest authors can use them in their stories — with an SDK or documentation
defining the package format? His follow-up made the north star explicit: a
**community-driven ecosystem** of *Editor Mods* — custom nodes in their own
palette category, with their own colours.

**v2 of this design exists because a real tool mod landed mid-investigation**
(2026-09-10): an exploitation framework released specifically "so that other
mod authors can also use it", with its own mod-author SDK documentation. Its
cross-mod contract validated this design's spine — *pure data, no code
execution* — and corrected its rails. Roadmap row 12; build parked behind the
r131 builds; awaiting Zeis's go.

## What the ecosystem actually standardized (validated against a shipped tool)

Three rails, all pure data, all in the pinned SDK — the tool mod's own docs
teach quest authors to use them directly:

1. **Targets are the network itself.** A tool framework resolves its target
   against *live network state* — ports (`service`, `version`, `active`) and
   domain vulnerabilities (seven types). **Our editor already emits every
   shape.** A quest built here is tool-breachable today; the only craft is
   convention (canonical service names on ports — `http`, never `nginx`;
   the product lives in the version string; vulnerabilities on the domain).
2. **Reaction is events.** Tool frameworks emit their own namespaced events
   with documented payloads (`…\ .Breach.SessionOpened`, `FileDownloaded`, …),
   and a quest objective completes by listening. **Our trigger node was
   built for exactly this**: its event field is free-form by design ("a key
   of the SDK's `ModEventMap`, or a custom event name" — `TriggerEventDataSchema`),
   conditions run through the standard clause engine, and the compiler emits
   the third-party name verbatim on both the imperative listener and the
   declared objective trigger. **Pinned end-to-end in r135** (compile.test.ts,
   "objectives driven by third-party (community tool) events"): a quest whose
   objective completes on a `ReconNg.Breach.FileDownloaded` event with a
   `path contains config.env` clause, fired with the documented payload.
3. **Registration is namespaced SharedStorage keys.** Exploit modules, loot
   overlays, wordlists, access profiles — plain JSON under documented keys
   (`reconng.modules`, `reconng.loot`, …), merged on package load. Pure data,
   replace-by-id.

On top of these, simple *scripted-answer* tools (a scanner whose output the
quest pre-places) remain the `Shell.addCommandData` rail our
`world.toolResponse` node already drives — v1's center of gravity, demoted
to one section. The QA question (does `addCommandData` surface for
mod-registered commands in-game?) stays on Zeis's list.

## What ships today, zero code (done in r135)

- **The free-form trigger**, verified and pinned (above). Quest authors can
  wire third-party tool events into objectives right now.
- **The Cookbook card** — "Community tools (Recon-NG & friends)": the target
  conventions (canonical services, version strings, vulnerabilities on the
  domain), the trigger recipe, the Dry run's honest "unknown event" for
  third-party names, and the player-needs-the-mod note. Card 15.
- The Dry run already marks third-party trigger events "unknown" — correct
  and honest: it simulates this editor's runtime, and third-party events are
  not part of it.

## The pack format (v2 sketch)

A **tool pack** stays a declarative folder — `toolpack.json`, versioned
`format`, no executable code — but its sections now mirror the real rails:

```jsonc
{
  "format": 2,
  "id": "recon-ng",
  "name": "Recon-NG", "author": "…", "version": "1.0.0",
  "gameMod": { "name": "Recon-NG", "note": "players must have the game mod installed" },
  "events": [{                        // lights up the trigger UI later
    "name": "ReconNg.Breach.FileDownloaded",
    "docs": "a file was saved to ~/downloads",
    "fields": ["sessionId", "ip", "host", "path", "name", "localPath"]
  }],
  "storage": [{                       // the editor authors + emits the set()
    "key": "reconng.loot", "merge": "replace-by-target",
    "shape": { "target": "string", "files": [{ "path": "string", "data": "string",
               "readable": "bool", "downloadable": "bool", "deletable": "bool" }] }
  }],
  "targetRules": {                    // the lint: is this quest breachable?
    "services": ["http", "ftp", "ssh", "database", "redis", "smb", "smtp"],
    "versionOnPorts": true, "vulnsOnDomain": true,
    "vulnTypes": ["RCE", "LFI", "RFI", "SSRF", "CORS", "XSS", "SQL_INJECTION"]
  },
  "commandData": []                   // v1's simple-tool rail, still valid
}
```

Editor behavior per section: **events** → the trigger node's picker gains a
"Community events" group (today the field is free text; the pack adds
vocabulary and docs). **storage** → form-driven authoring of the JSON the
pack expects, emitted in `OnModPackageLoaded`. **targetRules** → the
intent-signaled lint: only when a quest's triggers reference the pack's
events does the editor check its networks for unmatchable targets (wrong
service names, version-less ports, vulnerabilities not on the domain). The
honesty spine is unchanged: pack tools require the game mod on the player's
machine — warnings at node use, export stamped "Requires the <X> game mod",
and projects stay portable (pack-less reopen degrades to a stub; nothing
breaks).

## The north star: Editor Mods — community nodes

Zeis's vision, and the architecture is already shaped for it: **the node
system is a data registry** (`NODE_TYPES` in `src/schema/nodes.ts`), the
inspector renders from field schemas, the palette groups by category, the
compiler switches on type, the simulator reads the same registry. An *editor
mod* is data that extends those registries at load:

- **Nodes**: `id` (namespaced, `<packId>/<nodeId>` — no collisions), label,
  **its own colour token**, palette category ("Editor Mods · Recon-NG"),
  field schemas (rendered by the existing inspector primitives, `{{data.*}}`
  tokens flowing as everywhere), and docs.
- **Emission is declarative templates only** — the one real engineering.
  A pack node never ships JavaScript into the compiler; it picks from a
  small set of generic emitters: *listen to an event* (trigger semantics),
  *emit an event*, *write a storage key*, *place command data*, *emit SDK
  calls with token-substituted arguments*. Everything the three rails need
  is expressible in those five.
- **Versioning & portability**: projects record pack id + version per node;
  a pack-less reopen renders a stub with the stored values (same rule as
  tool packs — nobody's project is hostage to a pack).
- **One pack, both halves**: the unified ecosystem move — Darkvalnar-class
  authors ship *one* folder that is simultaneously a game mod, a game-side
  data contract (`reconng.modules` JSON), and an **editor mod** (nodes,
  colours, docs). Quest authors drop it into an "Editor Mods" folder and the
  palette grows a category. Purely community-driven: our format is the
  stage, their packs are the show.

## Deliberately open (decided in the build round)

- Trust model for distribution: folder drop-in first; any index/registry is
  a later, separate decision.
- Whether pack nodes can compose *inside* our templates (they can reference
  nothing built-in at first — keep the surface honest).
- The trigger picker's pack-events group and the lint both need at least one
  real pack to test against — coordinate with the tool-mod authors (Zeis
  knows them; their docs invite exactly this collaboration).

## Status

v2 staged; r135 shipped the zero-code half (trigger pin + cookbook card,
stamp `2026-09-11.r135`). Build order unchanged: r131 builds (campaign
template, Kisscord contact lifecycle, cookbook rider) → this. Awaiting
Zeis's go on the pack format and the Editor Mods direction.
