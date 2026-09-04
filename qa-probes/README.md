# r84 freeze probes — round 2

## What round 1 settled

| Build | Result | Meaning |
|---|---|---|
| A_baseline | froze | harness reproduces the bug — results below are trustworthy |
| B_no_payment | froze | our `fx.pay` node is **not** the cause |
| C_no_closing_mail | froze | our closing mail is **not** the cause |
| D_no_autocomplete | ran clean, froze **only on the Complete click** | the freeze is the **engine's quest-completion path** |

D is the decisive one. With `autoComplete` off, the entire quest played through
with every objective ticked and `OnComplete` finishing normally — then the game
froze the moment the engine actually completed the quest. Nothing of ours is
running at that point.

## The new suspect

Nemesis, the known-working reference mod, declares **no `Rewards` at all** and
sets `MaxClaim = 1`. Our quests always set `this.Rewards = { money, xp }`.
Paying the reward is the main thing the engine itself does on completion.

Round 1 never tested this: probe B removed our `fx.pay` *node*, but the
quest-level `Rewards` stayed. These three separate the variables.

| Build | Rewards | MaxClaim | If this one does NOT freeze |
|---|---|---|---|
| `E_no_rewards` | none | default | the engine's reward payout is the freeze |
| `F_nemesis_shape` | none | 1 | Nemesis's exact shape works |
| `G_maxclaim_only` | kept | 1 | rules out `maxClaim` as the cause |

Test order: **E first** (most informative), then G, then F.

- **E survives** → rewards are the cause. G tells us whether `maxClaim` matters too.
- **E freezes** → rewards are cleared, and the fault is deeper in the engine's
  completion path. Worth reporting upstream, with D as the reproduction.

Fresh save each time, and please keep the meterpreter session open as before so
the conditions match.

Note: the runtime now omits `this.Rewards` entirely when an author sets no
rewards, instead of assigning `undefined` — assigning undefined still defines
the property, so E would not otherwise have matched Nemesis's shape.
