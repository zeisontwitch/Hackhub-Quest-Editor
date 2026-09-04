# r87 — can we at least clear the objectives?

## Where we are

- **J froze** → HackHub 1.1.2 cannot complete a mod quest. Nine hypotheses
  eliminated; full write-up in `docs/04-engine-bug-quest-completion.md`.
- **K survived** → a quest that never completes does not crash. The workaround
  is sound at toy scale.

## Zeis's question: can the objectives be removed from the panel?

**There is no API for it.** Grepping the entire 2,898-line SDK for "objective"
returns only: the definition shape, `completeObjective()`, and
`OnObjectivesStart`. No remove, no hide, no clear. Same for the quest itself —
no `removeQuest`, `retire` or `unregisterQuest`; `Quest.claim()` starts a quest
and has no counterpart.

**But there is one thing worth trying.** `QuestObjectiveDefinition` has a
`hidden?: boolean` flag, and we already know the engine re-reads the objectives
array we hand it *after* the panel exists: `refillObjectives()` rewrites
descriptions and terminal commands at `OnStart`, and r73 confirmed in-game that
the panel picked those edits up (it fixed raw `{{data.targetIp}}` showing).

So the open question is narrow: **does flipping `hidden` to true after the
first render actually remove the row?** The engine may only read `hidden` once,
when it builds the list. I cannot answer that from here — only a real run can.

| Build | What it does |
|---|---|
| `M_hide_objectives_at_end` | full Harbour, never completes, and flips every objective to `hidden: true` the moment the last one ticks |

## What to look for

Play M to the end as normal. When you send the final mail, watch the quest
panel:

- **Rows vanish, panel empties** → we have a clean ending despite the engine
  bug. I will make this the default.
- **Rows stay, all ticked** → `hidden` is read once at build time only. Then
  7/7-and-lingering is genuinely the best available, and the copy nudge
  ("contract closed — you can clear this from your quest list") is the answer.

Either result is useful. The new log line `all objectives done; asked the panel
to hide them (7 row(s))` confirms our side ran regardless of what the UI does.

Note L is now redundant — M *is* L plus the hide attempt, so it tests the
full-quest workaround at the same time. If M freezes, that is a surprise and
worth telling me immediately, since K says it should not.
