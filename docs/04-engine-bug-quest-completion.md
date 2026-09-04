# Engine bug: completing a mod-defined quest freezes the game

**Status:** reproduced minimally, not worked around yet
**Game version:** HackHub 1.1.2 (win32, x64)
**SDK:** `@hotbunny/hackhub-content-sdk@0.21.0`
**Found:** 2026-09-04, over 10 in-game test runs

## Summary

When a quest registered by a mod completes, the renderer freezes. This happens
on **both** completion paths:

- `AutoComplete = true` — freezes the instant the last objective ticks.
- `AutoComplete = false` + `HasCompleteButton = true` — the quest plays through
  perfectly and freezes the moment the player clicks **Complete**.

The mod's own `OnComplete` runs to the end first. Our last log line is always
`OnComplete: finished, handing back to the game`, after which nothing else is
written and the window stops responding.

## Minimal reproduction

`qa-probes/J_minimal.zip`. The entire quest is:

1. `AutoStart`, one objective `read-brief`, no rewards.
2. `OnStart` sends one mail via `Mail.send`.
3. The objective completes on `Mail.Read` (subject contains "One file").

No network is created, no reward is paid, nothing is sent from inside the
handler, and cleanup has nothing to undo. Player opens the mail; the game
freezes.

```
[quest-editor] quest "HarbourJminimal" started (1 entry point)
[quest-editor] mail "One file, quietly" sent via Mail.send
[quest-editor] objective "read-brief" is listening for Mail.Read
[quest-editor] OnComplete: starting
[quest-editor] cleanup starting (complete): 0 item(s) to undo
[quest-editor] cleanup finished
[quest-editor] OnComplete: cleanup done, removing weechat servers
[quest-editor] OnComplete: running end-of-quest nodes
[quest-editor] OnComplete: finished, handing back to the game
[quest-editor] objective "read-brief" completed by Mail.Read
  APPLICATION CLOSING          <- forced
```

Note the ordering: `OnComplete` runs to completion *inside*
`completeObjective`, before that call returns. No error, no stack, no further
output.

## What was ruled out

Each row is a separate build tested on a fresh save.

| # | Hypothesis | Test | Result |
|---|---|---|---|
| 1 | Unhandled `destroyNetwork` rejection | guarded the promise | still froze |
| 2 | Destroying a network with a live session | left the network standing | still froze |
| 3 | Re-entrancy from our own flow | ran story beats before the tick | still froze |
| 4 | The `fx.pay` reward node | removed it | still froze |
| 5 | The closing mail | removed it | still froze |
| 6 | Quest-level `Rewards` | removed them | still froze |
| 7 | `MaxClaim` | set to 1, and separately with no rewards | still froze |
| 8 | Completing inside a `Mail.Sent` dispatch | J completes on `Mail.Read` instead | still froze |
| 9 | Anything in the quest at all | J: one objective, nothing else | **still froze** |

## Why Nemesis is not a counter-example

`Nemesis/mod.js` (author `tz1k`) is the only third-party quest mod we have that
is known to work. It sets:

```js
this.AutoComplete = false;
this.HasCompleteButton = false;
```

and its single objective `investigate_and_report` is never ticked — there is no
`completeObjective` call anywhere in the file. **Nemesis never completes.** It
is consistent with its author having hit this same wall and designed around it.

## Questions for the developers

1. Is completing a mod-registered quest supported in 1.1.2? Is there a working
   example anywhere?
2. Is there a state a mod must set before the engine can retire a quest — a
   claim record, a HackHub feed post, an employer — that a purely code-defined
   quest lacks?
3. Does completion require the quest to have been *claimed* from the HackHub
   feed rather than `AutoStart`ed? Every quest we generate uses `AutoStart`.
4. Is `MaxClaim` required rather than optional? Nemesis sets `MaxClaim = 1`;
   the SDK types it as optional.
5. If completion is simply broken, is a quest that never completes (Nemesis's
   shape) the supported way to ship a finite story?

## What "never completes" actually looks like (Nemesis)

Nemesis's entire ending is a reply mail. Its `Mail.Sent` handler checks the
recipient, subject and payload fields, sends one reply from the contact, and
stops:

```js
OnObjectivesStart() {
  this.Events.on("Mail.Sent", (mail) => {
    if (mail.to.trim().toLowerCase() !== TOMASZ_WROBEL_EMAIL) return;
    // ...checks on subject and content fields...
    Mail.send({ from: TOMASZ_WROBEL_EMAIL, to: mail.from,
                subject: "Re: " + RECOVERED_DATA_SUBJECT,
                content: TOMASZ_RECOVERED_DATA_REPLY });
  });
}
OnComplete() { }
OnAbandon() { }
```

The story ends, the player gets their reply, and **the quest entry stays in the
quest list forever, showing 0/1 objectives**. Nemesis never even ticks its one
objective, so its entry does not visibly progress at all.

There is no way to hide it. Searching the full 2,898-line SDK for
`abandonQuest`, `removeQuest`, `retire`, `unregisterQuest` or `completeQuest`
returns **nothing**. `Quest.claim()` exists to start a quest programmatically;
there is no counterpart to end one. The only engine-driven way out of the quest
list is completion (crashes) or the player abandoning it manually.

So the workaround's cost is unavoidable and permanent: a finished story leaves
a permanent entry in the player's quest list. Our version is at least better
than Nemesis's — every objective ticks, so the entry reads 7/7 rather than 0/1.

## Resolution in the editor (r87/r88)

Confirmed in-game across three runs:

- **K** — a quest that never completes does not crash.
- **M** — the full Harbour quest, never completing, played start to finish with
  no freeze, and flipping `hidden` on the objectives **did** empty the panel.
  So the engine re-reads the objectives array after the panel is built.
- One blemish: hiding every row left the header reading **"0/0 completed"**,
  because the counter counts visible rows.

Generated quests therefore now default to:

| Setting | Default | Why |
|---|---|---|
| `autoComplete` | `false` | completing crashes the game |
| `hasCompleteButton` | `false` | pressing it crashes the game |
| `hideObjectivesWhenDone` | `true` | clears the finished steps |
| `closingObjectiveText` | per template | one ticked row, so the header reads 1/1 rather than 0/0 |

The quest entry still cannot be removed from the list — there is no API for it
— but it now reads as a finished contract rather than an abandoned one.

## Impact on this editor

Every quest the editor generates is finite and meant to end. Until this is
resolved the only shipping option is a quest that never formally completes:
objectives tick, the story concludes with its closing mail and payment, but the
engine is never asked to retire the quest. That leaves the entry sitting in the
player's quest list forever, which is visible and unsatisfying.

Probes `K_never_completes` and `L_harbour_never_completes` test that workaround.
