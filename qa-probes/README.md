# r85 freeze probes — round 3

## Eliminated so far (all by in-game test)

| Build | Change | Result |
|---|---|---|
| A | baseline | froze |
| B | no `fx.pay` node | froze |
| C | no closing mail | froze |
| D | `autoComplete` off | **ran clean, froze on the Complete click** |
| E | no quest `Rewards` | froze |
| F | Nemesis shape (no rewards, maxClaim 1) | froze |
| G | `maxClaim` only | froze |

So: not the payment, not the closing mail, not the rewards, not maxClaim.
D proves the freeze is in the engine's **quest-completion** path.

## A correction I owe you

I cited Nemesis as proof that quest completion works. **It is not.** Nemesis
sets `AutoComplete = false` *and* `HasCompleteButton = false`, and never ticks
its single objective — it never completes at all. So we have **no** known
example of any mod quest completing successfully. "The engine cannot complete
a mod quest" is still a live hypothesis, and J tests it directly.

## The remaining constant

Every freeze so far has the same shape: the last objective is triggered by
`Mail.Sent`, and the quest completes *inside that dispatch*. Probe C removed
our closing mail, but the objective was still completed from inside the
`Mail.Sent` handler — so C never tested the dispatch itself.

| Build | What it is | If it does NOT freeze |
|---|---|---|
| `H_no_mail_trigger` | quest ends on the file download; the `Mail.Sent` objective is gone | completing inside a `Mail.Sent` dispatch is the bug |
| `I_bare_mail_finish` | `Mail.Sent` objective kept, but nothing hangs off it — no mail, no payment | the dispatch itself is fine; doing *work* inside it is the bug |
| `J_minimal` | one objective, no network, no mail, no reward: start → contract mail → read it → done | a mod quest *can* complete, so something in the bigger quest matters |

Test order: **J first** — it is 30 seconds and the most informative.

- **J freezes** → the engine cannot complete a mod quest at all. Stop testing;
  J is a minimal reproduction to send upstream and we design around it.
- **J survives** → completion works in principle. Then H and I narrow it down.

Fresh save each run, as before. For J you do not need the meterpreter session —
just read the contract mail.
