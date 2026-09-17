# r172 — Schedule beat: the SDK 0.24 Timer, and the exposure overview

Date: 2026-09-17

Scope: (1) the exposure overview Zeis asked for — what the new SDK (0.24.0,
shipped with HackHub 1.3.0) offers, what the editor exposes now, and what
stays fenced and why. (2) The **Schedule beat** node — the first
author-facing surface on the new `Time` / `Scheduler` APIs (Rawlings' "Timer",
the queued "Scheduler / Time design pass", README Next-up 4).

Pinned SDK: `@hotbunny/hackhub-content-sdk@0.24.0` (unchanged — 0.24.0 is the
latest published; npm `dist-tags.latest`, 2026-09-16).

Editor build stamped for this pass: `2026-09-17.r172`.

## Part 1 — SDK 0.24 exposure overview

Everything below is cross-checked against the pinned `index.d.ts` and the r165
assessment / r166 in-game QA, not patch notes.

| SDK 0.24 surface | Editor state |
|---|---|
| **`Time` + `Scheduler`** — in-game clock (scale 60: 1 real s = 1 in-game min), save-resilient due-date jobs | **This round:** Schedule beat node (`flow.schedule`). Rawlings' use case — Uplink-style story beats and articles landing on the in-game clock — is authorable for the first time. |
| Quest lifecycle — `this.complete()`, `this.retire()`, `Quest.unclaim(name)` | Exposed r169 (Complete / Retire / Unclaim quest nodes), after r168 in-game QA. |
| Native Wi-Fi — `Network.createWifiNetwork` + scan fields | Exposed r167 (Create Wi-Fi), after r166 QA. Bettercap `SSID: undefined` wart documented as info. |
| `UI.prompt` | Exposed r170 (Ask player). |
| Phone `QuestDialogSpeech.onEnd` / `QuestDialogOption.onSelect` | Exposed r169 (Dialogue "Out fires" choice). |
| 7 new events (`Game.SessionStarted`, `Http.*`, `Terminal.DnsHistory`, `Network.WifiDisconnected`) + 99-event catalogue | In the trigger palette since r165. |
| **HTTP namespace** — `registerHost`, routes, `Http.fetch`, collaborators, interception | **Fenced.** r166 QA: `curl` missing (H-02 Blocked), DNS-only collaborator hits never arrive (H-07 Fail), static editor websites do not raise `Http.Request/Response` (H-08 Partial). Waits on SteelWaffe (docs/03). |
| **`Twotter.updateUser` / `Twotter.removeUser`** | **Fenced** until the in-game QA pass (Next-up 2) proves repair/removal semantics. |
| **`Mail.send(): string \| null`, `Mail.remove(id)`, `replyable`** | **Fenced** until the in-game QA pass (Next-up 1). Patch notes fix the Reply button; docs/07 says scripted outgoing mail was not fixed. |
| `DynamicWebsitePageDefinition` — a page whose HTML is computed **per visit** | Not exposed. The website builder is static. This is the missing half of Rawlings' "articles pop up" flow — see "Queued after this round". |
| Phone proxy / eavesdrop (xu's claim) | r171: no declared API/event in the pinned SDK. Fenced until xu provides a snippet or route. |
| Suspicion / log-forensics, SMS | Still absent from the SDK. |

Informational: r166 QA logged a game warning that the editor harness "uses
API v1 while the game currently runs API v2 compatibility mode". All QA was
green with it; `apiVersion` stays 1 until there is a v2 declaration to target.

## Part 2 — the Schedule beat node

### The SDK contract (from the pinned d.ts, not the docs)

- `Scheduler.schedule(kind, payload?, delay?, id?)` → job id.
  `delay` is `ScheduleDelay { minutes?, hours?, days?, ms?, realMs? }`.
- **A job is a due date, not a countdown** — it survives quit/load; anything
  still due fires as soon as its handler is registered (r166 T-04 Pass).
- **The handler must be registered on every load, before anything
  schedules.** A job whose handler is missing is HELD, never dropped — but our
  handler always exists, so the handler decides what happens when its quest
  is not live.
- **The kind registry is shared across installed packs** — two packs both
  using `"triage"` would silently answer each other's jobs. The kind must be
  prefixed per mod.
- `ScheduleDelay.realMs` is explicitly for pacing a beat the player is
  watching ("a couple of seconds after you click"); fictional delays use
  minutes/hours/days. `flow.delay` already owns the pacing lane — this node
  is fictional time only (no `realMs`, no `ms`).
- `ModPermission = "filesystem" | "network" | "events" | "mail" | "bank" |
  "shell" | "ui"` — **there is no scheduler permission**. Which of the seven
  (if any) the Scheduler answers to is not derivable from the declarations;
  the r166 harness ran with all five of network/events/mail/shell/ui. See
  QA row S-04.

### The node

- Type `flow.schedule`, category Flow control, label **Schedule beat**,
  blurb "Do something at a later in-game time".
- Sockets: `In` (flow), `Out` (flow) — the story arms the beat when it
  reaches the node; the story continues down `Out` when the in-game clock
  hits the due time. Warming it from `entry.start` gives "X after the quest
  starts"; wiring it from mid-story gives "X after the player did this".
- Fields: `days`, `hours`, `minutes` (numbers, ≥ 0, all default 0). The SDK
  sums them; the author thinks in designer units, the way the SDK's own
  `ScheduleDelay` doc says ("expressed the way a designer thinks about it").
  The minutes hint carries the scale fact QA verified (T-01, scale=60): one
  in-game minute is one real second at default speed.
- All-zero delay: an amber "Nothing scheduled" analysis issue; at runtime the
  beat fires immediately (fail-open, same spirit as the codebase's other
  fail-open paths — a mistyped value should not kill the story).
- The node is a **one-way door**: the current flow ends at the node; the beat
  is not a pause the player sits through (that is `flow.delay`).

### Runtime design (inside `runtimeSource.ts`)

- **One shared kind per mod:** `qe/<modId>/beat` — the mod id is the manifest
  id (always a non-empty slug). Registered once at mod load (top level of
  `__qeRegisterProject`, before any quest starts) — every load, before
  anything schedules, as the SDK requires.
- **Arming is synchronous in the flow** (`case "flow.schedule"` in
  `runFlowStep`): `Scheduler.schedule` is called inside the engine's call
  stack, exactly like every other node. The node then ends the flow
  (`return Promise.resolve()`, the `reply.input` precedent — a node that
  yields until something external happens).
- **Idempotent arming:** `Scheduler.list(kind)` is checked for a pending job
  with the same `questId` + `nodeId` payload before scheduling. The opening
  flow re-runs on a save reload (r166 editor scaffold: listeners
  "re-registered after load"), and a re-run must not double-arm.
- **The job's payload** is `{ questId, nodeId, attempts }`. When it fires,
  the handler looks up `liveBeats[questId]` — the quest's closure registered
  it in `OnStart`/`OnObjectivesStart` (rebound per live instance, the
  `questRef = this` pattern) as `{ fire: (nodeId) => … }`. Firing walks
  `flowOuts(nodeId)` with a **fresh ctx** (`{ payload: {}, vars: {} }`), the
  trigger.event precedent: the beat is a new entry point into the graph, and
  `{{data.*}}` quest data still resolves through `dataScope()`. The r166 QA
  proves a Scheduler callback carries the mod's permissions (T-02: mail,
  toast and objective completion all worked from inside one).
- **Not-live re-arm:** if the job comes due before its quest is live in this
  session (the engine can fire due jobs at mod load, before quest start),
  the handler re-schedules the same job `{ ms: 10 }` — next engine tick — up
  to 20 times. A quest that auto-starts on load is live within a few ticks;
  a quest that is not active in this save costs at most 20 no-op ticks and
  then drops the beat with a log line. No infinite loop, no held state.
- **Cancellation:** arming records the returned job id in the quest's
  `beatJobs`. `OnComplete` and `OnAbandon` cancel every pending job and
  delete the quest from `liveBeats` — a beat armed for a quest that ends
  before its due time must not fire (the story is over).
- **No `dataScope()` additions** (the standing hazard: nothing eager there).

### What it does NOT do (deliberate scope)

- No absolute due dates (`Scheduler.scheduleAt`) — "at 09:00 on day 3" needs
  an in-game date picker and a definition of which day; queued until an
  author actually wants it (YAGNI).
- No `realMs`/`ms` pacing mode — `flow.delay` owns pacing.
- No website mutation — a beat cannot add an article to a static site at
  runtime. Rawlings' full Uplink flow needs dynamic pages (below).

### Permissions (AR17)

No `PERMISSIONS_BY_NODE_TYPE` entry for `flow.schedule` — nothing to add to,
and nothing verified to ask for. A schedule-only quest exports with a
computed minimal manifest; if the game turns out to gate the Scheduler on a
permission, S-04 below finds it in one in-game run and the fix is one line.

### Analysis

- `flow.schedule` with all-zero delay → amber "Nothing scheduled" (the beat
  fires immediately; the story probably wanted a time).
- `flow.schedule` with an unwired `Out` → blue "The beat has nothing to do"
  (fine if the story is meant to end there; wire it if not) — the fx.prompt
  dead-end wording pattern.

### Simulator

The recording SDK gains `Time` and `Scheduler` stubs (register/schedule/
cancel/list/remaining). A dry run **arms** beats during the lifecycle walk
and then **fires** each pending job of the quest through the registered
handler, in list order, so the dry run shows what the beat starts — labelled
"beat fired (simulated)". The honesty note covers the rest: it cannot prove
the game clock fires it on time.

### Manual, reference sheet, counts

- `node-voice.json` gains a `flow.schedule` entry (prose, this round's voice);
  `npm run gen:manual` regenerates inventory (39 node types) and pages.
- The Node Reference template gains one Schedule beat row
  (`{ days: 1, hours: 2, minutes: 30 }`), its `nodeCount` +1.
- The counts that move together (standing hazard): `schema.test.ts`
  38 → 39, the reference template coverage test (registry-derived,
  self-updating once the node exists), README build status.

### In-game QA for Zeis (evidence order: raw SDK already proven in r166)

The raw harness already proved the SDK side (T-01/T-02/T-04/T-06 Pass).
What needs first in-game proof is **editor-generated** scheduling:

| ID | Steps | Expected |
|---|---|---|
| S-01 | Install the refreshed QA export (schedule quest, auto-start). Wait out the in-game delay (or use the Wait button). | The beat's mail/toast lands once; log shows arm + fire lines. |
| S-02 | Fresh save. Let a longer beat arm, save/log out before it is due, reload, wait. | Fires exactly once (no duplicate after reload). |
| S-03 | Fresh save. Arm a beat, then formally complete the quest before the due time. Wait past the due time. | The beat never fires; log shows the cancel line. |
| S-04 | A minimal quest whose only nodes are entry.start → Schedule beat → fx.notify. Export, check the manifest's permissions, install. | Record exactly which computed permission set still fires the job — this settles the AR17 question. |
| S-05 | (optional, throwaway) Arm a beat on save A, log out, load a different save B, wait past the due time. | Record whether the job is per-save or global. Docs the multi-save boundary. |
| S-06 | (optional) Arm a beat, then use the in-game clock Wait button across the due time. | Closes r166 T-03 (skipped-time behaviour). |

### Queued after this round

1. **Dynamic website pages** — the missing half of Rawlings' "articles pop
   up": `DynamicWebsitePageDefinition.metadata(context) => PageMetadata`
   computes a page's HTML per visit, so an article can appear once the
   in-game clock passes its publish time. Needs a design pass (how the
   author expresses a publish time on a static-built page) before any node
   or page field.
2. Absolute due dates (`scheduleAt`) once an author wants "at exactly T".
3. HTTP/curl authoring, Twotter, replyable mail — fenced, need their QA
   passes first (r165 "Not lifted yet").

### Test plan

New (each falsified by reverting its guard):

- `schema.test.ts`: 39 node types; `ScheduleNodeDataSchema` shape.
- `compile.test.ts`: a schedule node emits; furniture/beat bypass untouched.
- New `scheduleBeat.test.ts` (simulator technique — the emitted mod.js runs
  against the recording SDK): the beat arms during OnStart; firing the
  stub's due job runs the beat's `Out` wire (a toast is recorded); a reload
  (second lifecycle pass) does not double-arm; OnComplete cancels pending
  jobs; all-zero delay fires immediately; a job whose quest is not live
  re-arms and then drops.
- `simulate.test.ts`: the dry-run trace shows arm + simulated fire.
- `analysis` tests: the two new issues (and their absence when wired/armed).
- `templates.test.ts` / reference coverage / manual coverage: 39 everywhere.

Gates: `npm run typecheck`, `npm test`, `npm run build`, `npm run gen:manual`.
