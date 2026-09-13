# r135 (design v2.1): Tool packs & Editor Mods — a mod for our mod

Zeis's question: mod authors build *new hacking tools* for the game, as mods.
Can those tools drop into a folder of **our editor** and load up **as nodes**,
so quest authors can use them in their stories — with an SDK or documentation
defining the package format? His follow-up made the north star explicit: a
**community-driven ecosystem** of *Editor Mods* — custom nodes in their own
palette category, with their own colours, that "grow the palette" when
dropped in.

**v2 exists because a real tool mod landed mid-investigation** (2026-09-10):
an exploitation framework released specifically as a modder's resource, with
its own mod-author documentation. Its cross-mod contract validated this
design's spine — *pure data, no code execution* — and corrected its rails.
At Zeis's request the tool is **not named** in the repo (the mod may vanish
or change hands; our docs stay clean): the investigation notes live in the
session, and this document describes the *pattern* the tool demonstrated.
Roadmap row 12; build parked behind the r131 builds; awaiting Zeis's go.

## Requirement zero: the no-code rule

The editor is for gamers with no coding experience — that is the product.
The rule for everything this design adds:

> **Every pack-provided surface must read like its plain meaning.** A field
> is a labelled box with a hint; a choice is a dropdown whose entries say
> what they do; an event is picked from a list by its description — never a
> raw tag the author must know, type, or place correctly. If a surface
> needs `{{token}}` knowledge, it is a bug in the surface, not the author.

The editor already lives this rule in most places (preset dropdowns, the
token picker, plain-language warnings and scan panel); this design must not
become the exception. Today's honest gap it fixes: the **trigger event
field is free text** — powerful, pinned, and exactly the kind of thing a
non-coder cannot be expected to know. Packs turn it into a **picker with
descriptions**; the free-text ability stays underneath for those who have a
name from a mod's docs (the Cookbook card teaches that path in plain words).

## What the ecosystem standardized (validated against a shipped tool)

Three rails, all pure data, all in the pinned SDK — the investigated tool's
own docs teach quest authors to use them directly:

1. **Targets are the network itself.** A tool framework resolves its target
   against *live network state* — ports (`service`, `version`, `active`) and
   domain vulnerabilities (seven types). **Our editor already emits every
   shape.** A quest built here is tool-breachable today; the only craft is
   convention (canonical service names on ports — `http`, never `nginx`;
   the product lives in the version string; vulnerabilities on the domain).
2. **Reaction is events.** Tool frameworks emit their own namespaced events
   with documented payloads (`<Tool>.<Category>.<Event>`), and a quest
   objective completes by listening. **Our trigger node was built for
   exactly this**: its event field is free-form by design ("a key of the
   SDK's `ModEventMap`, or a custom event name" — `TriggerEventDataSchema`),
   conditions run through the standard clause engine, and the compiler
   emits the third-party name verbatim on both the imperative listener and
   the declared objective trigger. **Pinned end-to-end in r135**
   (compile.test.ts, "objectives driven by third-party (community tool)
   events") with a documented-payload-shaped example.
3. **Registration is namespaced SharedStorage keys.** Exploit modules, loot
   overlays, wordlists, access profiles — plain JSON under documented keys
   (`<packprefix>.modules`, `<packprefix>.loot`, …), merged on package
   load. Pure data, replace-by-id.

On top of these, simple *scripted-answer* tools (a scanner whose output the
quest pre-places) remain the `Shell.addCommandData` rail our
`world.toolResponse` node already drives — v1's center of gravity, demoted
to one section. The QA question (does `addCommandData` surface for
mod-registered commands in-game?) stays on Zeis's list.

## What ships today, zero code (done in r135)

- **The free-form trigger**, verified and pinned (above). Quest authors can
  wire third-party tool events into objectives right now.
- **The Cookbook card** — "Community tools": the target conventions
  (canonical services, version strings, vulnerabilities on the domain), the
  trigger recipe in plain words, the Dry run's honest "unknown event" for
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
  "id": "example-tools",
  "name": "Example Tools", "author": "…", "version": "1.0.0",
  "gameMod": { "name": "Example Tools", "note": "players must have the game mod installed" },
  "events": [{                        // lights up the trigger picker
    "name": "ExampleTools.Breach.FileDownloaded",
    "label": "Player downloaded a file from a breached box",
    "docs": "Fires when the player saves a file from the remote session.",
    "fields": ["sessionId", "ip", "host", "path", "name", "localPath"]
  }],
  "storage": [{                       // the editor authors + emits the set()
    "key": "exampletools.loot", "merge": "replace-by-target",
    "shape": { "target": "string", "files": [{ "path": "string", "data": "string",
               "readable": "bool", "downloadable": "bool", "deletable": "bool" }] }
  }],
  "targetRules": {                    // the lint: is this quest breachable?
    "services": ["http", "ftp", "ssh", "database", "redis", "smb", "smtp"],
    "versionOnPorts": true, "vulnsOnDomain": true,
    "vulnTypes": ["RCE", "LFI", "RFI", "SSRF", "CORS", "XSS", "SQL_INJECTION"]
  },
  "commandData": [],                  // v1's simple-tool rail, still valid
  "nodes": []                         // Editor Mods — see below
}
```

Editor behavior per section: **events** → the trigger picker gains a
"Community events" group with the pack's labels and descriptions (the
no-code rule delivered); the free-text field stays underneath. **storage** →
form-driven authoring of the JSON the pack expects, emitted in
`OnModPackageLoaded` — the author fills a form labelled by the pack's own
field labels. **targetRules** → the intent-signaled lint: only when a
quest's triggers reference the pack's events does the editor check its
networks for unmatchable targets (wrong service names, version-less ports,
vulnerabilities not on the domain), each warning naming the fix. The
honesty spine is unchanged: pack tools require the game mod on the player's
machine — warnings at node use, export stamped "Requires the <X> game mod",
and projects stay portable (pack-less reopen degrades to a stub; nothing
breaks).

## The north star: Editor Mods — community nodes

Zeis's vision, and the architecture is already shaped for it: **the node
system is a data registry** (`NODE_TYPES` in `src/schema/nodes.ts`), the
inspector renders from field schemas, the palette groups by category, the
compiler switches on type, the simulator reads the same registry. An *editor
mod* is the `"nodes"` section of a pack — data that extends those registries
at load:

- **Nodes**: `id` (namespaced, `<packId>/<nodeId>` — no collisions), a
  human label, **its own colour token**, palette category
  ("Editor Mods · <pack name>"), field schemas rendered by the existing
  inspector primitives (with the pack's own labels and hints — no-code rule
  applies to pack authors too, and the format spec says so), and docs.
- **Emission is declarative templates only** — the one real engineering.
  A pack node never ships JavaScript into the compiler; it picks from a
  small set of generic emitters: *listen to an event* (trigger semantics),
  *emit an event*, *write a storage key*, *place command data*, *emit SDK
  calls with token-substituted arguments*. Everything the three rails need
  is expressible in those five.
- **Versioning & portability**: projects record pack id + version per node;
  a pack-less reopen renders a stub with the stored values (same rule as
  tool packs — nobody's project is hostage to a pack).
- **One pack, three halves**: the unified ecosystem move — a modder ships
  *one* folder that is simultaneously a game mod, a game-side data contract
  (namespaced JSON keys), and an **editor mod** (nodes, colours, docs).
  Quest authors drop it into the Editor Mods folder and the palette grows a
  category. Purely community-driven: our format is the stage, their packs
  are the show.

## Modder-facing deliverables (Zeis's question: docs + a blank)

Yes to both, plus one more the loader owes its users:

1. **The format spec** — a standalone, modder-facing document
   (`docs/ToolPack-Format.md`, written to be linkable outside the repo):
   every section of `toolpack.json`, every emitter, the naming and
   versioning rules, and the no-code expectations for pack authors (labels,
   hints, choice lists — written for players).
2. **The starter pack** — the "code blank" for modders: a commented
   `toolpack.json` with one worked example per section (one event, one
   storage contract, one command-data tool, one node of each emitter kind),
   ready to rename and fill. The pack loader validates against the same
   schema our editor uses, so a starter pack that loads is a correct pack.
3. **Plain-language validation in the loader** — a pack that fails to load
   gets the same treatment authors get everywhere else in this editor: what
   is wrong, where, and how to fix it, in the scan-panel voice. A modder's
   first contact with our format should not be a stack trace.

## Deliberately open (decided in the build round)

- Trust model for distribution: folder drop-in first; any index/registry is
  a later, separate decision.
- Whether pack nodes can compose *inside* our templates (they can reference
  nothing built-in at first — keep the surface honest).
- The trigger picker's pack-events group and the lint both need at least
  one real pack to test against — coordinate with the tool-mod authors
  (Zeis knows them; their docs invite exactly this collaboration).

## Status

v2.1 staged: tool names removed at Zeis's request, the no-code rule written
in as requirement zero, modder-facing deliverables specified. r135 shipped
the zero-code half (trigger pin + cookbook card, stamp `2026-09-11.r135`).
Build order unchanged: r131 builds (campaign template, Kisscord contact
lifecycle, cookbook rider) → this. Awaiting Zeis's go on the pack format
and the Editor Mods direction.
