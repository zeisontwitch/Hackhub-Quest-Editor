# r169 — phone end flow and quest-ending nodes

## Why this round exists

Zeis ran the r168 raw phone probes in game and reported both worked:

- `QuestDialogSpeech.onEnd -> completeObjective(...)` with `AutoComplete = true`
- `QuestDialogSpeech.onEnd -> this.complete()`

That removed the old completion fence for this surface. SDK 0.24.0 still has no
`Phone.*`, `Dialog.*`, `Call.*`, or `Quest.Dialog.*` event in `ModEventMap`, so
this is not a new When-event picker row. Phone call flow belongs on the Dialogue
node and compiles to the dialog callbacks the SDK declares.

Quest lifecycle APIs were also verified in r166: `this.complete()`,
`this.retire()`, `Quest.unclaim(name)`, auto-complete, and the Complete button.
The editor can restore author-facing quest endings instead of forcing the old
"finish the story but leave the quest active" workaround.

## Implementation

### Phone Dialogue flow timing

- `comms.dialogue` phone data gained `continueMode: "onEnd" | "immediate"`.
- The default is `"onEnd"`, because Zeis is the only human user so we do not
  preserve old immediate timing by default.
- The inspector and Dialogues modal both show **Out fires**:
  - **When the call ends** wires the node's `Out` flow into phone dialog ending
    callbacks.
  - **Right after starting the call** keeps the previous behavior.
- The runtime rebuilds the quest's `Dialog` definition with filled tokens right
  before `createDialog(branch, startIndex)`.
- For phone end timing it attaches:
  - `QuestDialogSpeech.onEnd` to an explicit `isEnd` line, or the final line in
    a branch with no options;
  - `QuestDialogOption.onSelect` to ending options.
- The continuation is guarded so multiple end callbacks can only fire the graph
  once.

### Quest-ending nodes

Restored terminal effect nodes:

| Node | Runtime call | Notes |
|---|---|---|
| `fx.completeQuest` | `this.complete()` | Completes the current quest and lets `On quest complete` run. |
| `fx.retireQuest` | `this.retire()` | Removes the current quest without marking it complete. |
| `fx.unclaimQuest` | `Quest.unclaim(name)` | Blank name defaults to the current quest id. |

The nodes have no `Out` socket on purpose: they are endings. Closing mail,
payment, notifications or cleanup should happen before them, or from
`entry.complete` for the complete path.

If an objective's **On complete** wire reaches a terminal quest-ending node
synchronously, the runtime records the ending request, ticks the objective with
`completeObjective(...)`, then flushes the ending. That keeps the player's last
objective visibly complete before the quest entry disappears.

## Documentation updates

- Manual inventory regenerated for build `2026-09-16.r169`.
- Node reference is now 37 obtainable node types.
- `entry.complete`, `comms.dialogue`, and the three quest-ending nodes have new
  prose in `docs/manual/node-voice.json`.
- Static handbook pages now describe deliberate finish paths instead of the old
  no-completion workaround.
- `docs/04-engine-bug-quest-completion.md` and
  `docs/05-bug-report-for-hotbunny.md` are marked historical for the lifecycle
  blocker.

## Validation

- `npm ci`
- `npm run gen:manual`
- targeted Vitest pass for compiler/schema/dialogue/analysis/templates
- `npm run typecheck`
- `npm test` — 1,548 tests / 79 files
- `npm run build`
