# r182 (plan): the rows came back — one editor bug, one honest log

Zeis's second Timer run: `reference/sdk-0.24-qa/QE24-TestResults-Timer_Rows_2.md`,
plus a screenshot of the editor with a fixture open.

## What the run settled

| Row | Result |
| --- | --- |
| **S-03 cancel** | **Green**, and his own log says so. He wrote that he could not find anything about a cancelled timer — but the log he pasted contains the whole sequence: `timer node qe-tmrf7pia armed after 2m (job T6nLZcpwsu)` → fired → `timer node qe-9b919r74 armed after 2h (job uO1ZDpc81C)` → `OnAbandon: starting` → `cancelled … pending timer(s)` → `OnAbandon: finished`. Nothing popped after two real minutes. |
| **S-10 clamp** | Skipped — his in-game date was 19 September, and the row needs a 29th–31st. Stays open, and stays unit-tested. |
| **S-11 `NEXT EVENT`** | Partly answered: the panel read `NEXT EVENT 4d 6h [Wait]`, which is the **game's own** queued job (23 Sep), not the pending mod job (19 Oct). So mod jobs do not appear *ahead of* the game's own next event. What is still unknown — because the mod job was not the nearest one — is whether the panel would show a mod job at all. Recipe for a definitive answer below. |
| **S-12 / S-15** | **Blocked by an editor bug, now fixed.** Both fixtures opened into "No quest selected", an empty canvas and the first-run "browse templates" hint. (The screenshot he attached shows exactly that: the fixture's tab title, the canvas on "No quest selected" and the "Browse 13 templates" card. It is not saved in this repo — the attachment lands in the conversation, not the workspace — so the words are recorded here and in `STATUS.md`.) |

## The editor bug (the real work)

Neither fixture carries `editor.activeQuestId` — they are old, hand-written shapes,
which is the point of a migration fixture. `ProjectSchema` accepted that
(`activeQuestId` is `.nullable().default(null)`) and every load path took it
literally, so the editor opened on nothing:

- `QuestCanvas` / the Quest tab → "No quest selected."
- `App`'s `nodeCount` → 0 → the first-run hint ("Browse 13 templates") on top.

The result is indistinguishable from a broken file. It is also not fixture-specific:
any project without that key — hand-written, exported by a build older than the
key, or whose active quest was deleted — opens the same way.

**Fix, in the schema rather than at the call sites.** `ProjectSchema` now
transforms on parse: if the active quest id is not one of the project's quests,
point it at the first quest that ships. Every path parses through this schema —
file load, import, the autosaved draft, template construction, the QA export
generator — and a repair that can be forgotten is how the bug happened.
`createProject`'s private copy of the same repair (which only covered freshly
built projects) is gone; a template test that pins multi-quest determinism now
guards the schema's version of it.

## The log that miscounted

The S-03 log reads `cancelled 2 pending timer(s)` while only one timer was still
pending: a fired job's id stayed in the mod's list, because the handler never
removed it. A log a tester is told to trust must not miscount, so the handler
(forget a job the moment it fires) now drops it. The job lists live per quest
while the handler runs outside any quest's closure, so they are reachable
through a `beatJobsByQuest` map keyed by quest id.

## S-11's definitive recipe (no harness change needed)

`qe24 schedule 120` arms a **harness** job two in-game hours out — about two real
minutes — which is nearer than the game's own next event. Open the clock panel
within that window: if `NEXT EVENT` shows that job (or any mod job), mod jobs
appear; if it still shows only the game's own, they never do. Written into
`TIMER-ROWS.md` as the remaining S-11 step.

## Also in this round

`TIMER-ROWS.md` tells a tester to search the game log for **`quest-editor`** —
his cancel evidence was in the paste all along, and the checklist never said
where to look.

## Scope

Editor behaviour changes (the schema repair) plus one runtime log fix, so
`EDITOR_BUILD` → `2026-09-18.r182`, QA export **1.0.10**. Harness unchanged
(**1.0.11**) — nothing in it needed to change for the remaining rows.

## Evidence

Falsified 2/2: removing the schema repair fails the fixture guard (and the
template determinism test); dropping the fired-job line fails the S-03 count
test and the export byte guard.
