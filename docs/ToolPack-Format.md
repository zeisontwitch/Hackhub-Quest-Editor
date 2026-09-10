# The Tool Pack format (format 2)

A **tool pack** is one JSON file — `toolpack.json` — that teaches the Quest
Editor about a **tool mod** for HackHub: the events your mod emits, the
SharedStorage data it reads, and the target conventions it matches against.
Quest authors load the file through **Tools → Tool packs**, and everything in
it shows up in the editor as labelled, plain-language UI.

Two rules define the format:

1. **Pure data. No executable code.** A pack is JSON; the editor never
   evaluates third-party JavaScript. Anything your mod needs to *do* lives in
   your game mod, not in the pack.
2. **The labels you write ARE the interface.** Quest authors are gamers, not
   programmers. Every `label`, `docs` and `hint` string you provide is shown
   to them verbatim — write them like you are explaining it to a friend, and
   never show them a raw key or tag they did not type themselves.

The starter pack at [`reference/example-toolpack/toolpack.json`](../reference/example-toolpack/toolpack.json)
is a worked example you can copy, rename and fill in.

## Loading and errors

Drop one or more `.json` files into the manager (the **Tools** button). Files
are parsed the moment they are picked; a failed load gets a plain-language
sentence — what is wrong, where, and how to fix it — never a stack trace. The
format number is checked first, so a pack written for an older editor says so
instead of failing with a field error.

Packs are **machine-local**: they persist in the editor's browser storage and
are not part of the project file. Projects reference pack data by id and keep
their own copy of the values, so a project stays portable — it compiles and
runs even on a machine where the pack was never loaded.

## Top level

```json
{
  "format": 2,
  "id": "example-tools",
  "name": "Example Tools",
  "author": "You",
  "version": "1.0.0",
  "docsUrl": "https://…",
  "gameMod": { "name": "Example Tools", "note": "…" },
  "events": [ … ],
  "storage": [ … ],
  "targetRules": { … },
  "commandData": [],
  "nodes": []
}
```

| Field | Rules |
|---|---|
| `format` | Must be `2`. The editor speaks format 2; anything else is refused with a pointer here. |
| `id` | Lowercase letters, numbers, dashes (`^[a-z0-9][a-z0-9-]*$`). It names things inside projects — never change it after publishing. |
| `name` | What quest authors see in the manager and in dropdowns. |
| `author`, `version`, `docsUrl` | Shown on the pack's card. |
| `gameMod.name` | **The honesty line.** The in-game mod this pack drives. Quests that use the pack's data or events need that mod installed on the player's machine — the editor says so to every author who touches it, in the node, in the picker, and in the export's README. `note` is a sentence of extra context shown on the pack card. |
| `commandData` | **Reserved (format 2).** Simple scripted-answer tools already work through the editor's "Tool response" node; this section is documentation-only for now. |
| `nodes` | **Editor Mods**: pack-authored nodes in the palette — see the next section. |

## `events[]` — trigger picker entries

Each event joins the trigger picker under **Community tools**, searchable by
name, label and pack.

```json
{
  "name": "ExampleTools.Breach.FileDownloaded",
  "label": "A file was downloaded from a breached machine",
  "docs": "Fires when the player saves a file out of a remote session…",
  "fields": ["sessionId", "ip", "host", "path", "name"]
}
```

| Field | Rules |
|---|---|
| `name` | The exact event name your game mod emits (`Events.emit(...)`), letters/numbers/dots, starting with a letter. Authors paste this into triggers — match your mod's source exactly. |
| `label` | Plain words for the picker row. "A file was downloaded from a breached machine", not `FileDownloaded`. |
| `docs` | One or two sentences shown under the picker when the event is chosen. Say when it fires and what a quest can do about it. |
| `fields` | The payload's property names a condition can test, in the order you want them offered. Empty array = the event carries nothing to match on; the editor then says so instead of offering a dropdown. |

When a quest waits on one of your events, the editor tells the author which
game mod it needs — the honesty line again.

## `storage[]` — SharedStorage data shapes

Your game mod reads cross-mod data from HackHub's `SharedStorage`
(`sdk.SharedStorage.get(key)`). Each entry here is one **data shape**: a JSON
template the quest author fills with labelled inputs, which the editor writes
to your key when the quest runs.

```json
{
  "id": "loot",
  "label": "Plant loot on a machine",
  "key": "exampletools.loot",
  "docs": "Adds a file to the machine's remote session…",
  "merge": "replace",
  "mergeBy": "target",
  "fields": [
    { "key": "target", "label": "Host or IP", "type": "string", "hint": "The machine the loot waits on. A domain name works." }
  ],
  "entry": {
    "target": "{{target}}",
    "files": [{ "path": "{{path}}", "data": "{{data}}\n", "readable": true }]
  }
}
```

| Field | Rules |
|---|---|
| `id` | Stable id the project references. Never change after publishing. |
| `label`, `docs` | The dropdown entry and its explainer, in plain words. |
| `key` | The SharedStorage key your mod reads. **Namespaces it with your pack id** (`exampletools.loot`) so packs cannot stomp each other. |
| `merge` | `overwrite` — the key holds exactly this entry. `replace` — the key is a **list** and this entry replaces the one with the same `mergeBy` value, keeping the rest. |
| `mergeBy` | For `replace`: the entry property that identifies it (like `target`). |
| `fields[]` | The inputs the author sees. `key` names the hole in `entry`; `label` is shown; `type` is `string`, `text` (multi-line), `number` or `boolean`; `hint` is the ? badge; optional `choices` turn the input into a dropdown. |
| `entry` | The JSON your mod receives, with `"{{fieldKey}}"` holes. Numbers and booleans land raw when a hole is the whole value; strings are spliced in with JSON escaping, so a hole may sit inside a longer string (`"{{data}}\n"`). Story tokens (`{{data.targetIp}}`) also resolve at runtime. |

The template is **snapshotted into the project** when the author picks the
shape — so their quest keeps working even after your pack is unloaded, and a
pack update never silently rewrites shipped quests.

## `nodes[]` — Editor Mods: nodes in the palette

Each entry here becomes a card in the editor's palette under
**Editor Mods · <your pack name>**, and the add-node search offers it too.
A quest author drags it in, fills your form, and the editor emits what your
game mod expects — **declarative templates only, never code**.

```json
{
  "id": "breach-ping",
  "label": "Announce the handover",
  "blurb": "Fires the pack's own handover event",
  "docs": "Fires ExampleTools.Handover.Done when the quest reaches this node…",
  "emitter": "emit",
  "fields": [{ "key": "target", "label": "Host or IP", "type": "string" }],
  "eventName": "ExampleTools.Handover.Done",
  "payload": { "target": "{{target}}" }
}
```

| Field | Rules |
|---|---|
| `id` | Lowercase letters, numbers, dashes. The project records the node as `<packId>/<id>` — never change it after publishing. |
| `label`, `blurb`, `docs` | The palette card and its explainer, in plain words. The label is what quest authors search for. |
| `emitter` | One of `sdk`, `emit`, `storage`, `commandData` — see below. |
| `fields[]` | The form the quest author fills — same shape as storage `fields[]`. Every hole in your templates is filled from these. |

Every config value may carry `"{{fieldKey}}"` holes (filled with the
author's answers; strings splice with JSON escaping, numbers and booleans
land raw when the hole is the whole value) and `{{data.*}}` story tokens
(resolved when the quest runs, exactly like the rest of the editor).

**The emitters:**

| emitter | what runs when the quest reaches the node | config |
|---|---|---|
| `sdk` | calls `sdk.<Namespace>.<method>(…)` in order; an unknown call is skipped with a console note, never a crash | `steps: [{ "call": "Events.emit", "args": [...] }]` |
| `emit` | fires an event: `Events.emit(name, payload)` | `eventName`, `payload` (template) |
| `storage` | writes a SharedStorage key, like the storage contracts above | `key`, `merge`, `mergeBy`, `entry` |
| `commandData` | places a scripted tool answer: `Shell.addCommandData(command, input, data)` — the old answer is cleared first, because answers live in the save | `command`, `input` (template), `data` |

There is deliberately **no "listen" emitter**: waiting on events is the
trigger node's job, and pack events are already first-class there (with
conditions on your declared payload fields). A second listening surface
would only be a worse copy of a thing that exists.

## `targetRules` — target conventions (documentation for the editor)

What your mod's tools match against, so the editor's target helpers and
hints can speak your language:

```json
{
  "services": ["http", "ftp", "ssh", "database", "redis", "smb", "smtp"],
  "versionOnPorts": true,
  "vulnsOnDomain": false,
  "vulnTypes": ["RCE", "LFI", "RFI", "SSRF", "CORS", "XSS", "SQL_INJECTION"]
}
```

`services` are the canonical port service names your modules accept;
`versionOnPorts` says your tools match a version banner on the port record;
`vulnsOnDomain` says vulnerabilities can hang off the domain (not just the
device); `vulnTypes` are the vulnerability types your modules exploit.
Quest-facing surfaces for these rules arrive with Editor Mods; the editor
already reads them to keep its own advice honest.

## Versioning and etiquette

- Bump `version` when you publish; loading a pack with the same `id`
  **replaces** the old one (and projects keep their snapshots).
- Deleting or renaming an `id` strands projects that reference it — don't.
- New fields are additive; quest authors' snapshots are never rewritten by a
  pack reload.
- The manager shows your `gameMod.name` on the card: players need your mod.
  Write `note` so authors know where to get it.
