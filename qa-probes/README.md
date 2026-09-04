# r83 freeze probes

Four rounds of theories about the completion freeze have each been falsified
in-game (r79 rejected promise, r81 destroyNetwork at all, r82 re-entrancy).
The v14 log shows every one of our own lines printing in the right order,
including "OnComplete: finished, handing back to the game" — so the freeze is
in something the **engine** does at completion, provoked by one of the last
things we hand it.

Rather than guess a fifth time, each of these mods removes exactly ONE suspect.
Whichever build does **not** freeze names the culprit.

Install one at a time, on a fresh save, and play to the end.

| Build | What is removed | If this one does NOT freeze |
|---|---|---|
| `A_baseline` | nothing (same as v14, renamed) | the probe harness is wrong — stop, tell me |
| `B_no_payment` | the `fx.pay` reward | `Bank.transaction` at completion is the trigger |
| `C_no_closing_mail` | the final "Received" mail | sending mail inside the engine's `Mail.Sent` dispatch is the trigger |
| `D_no_autocomplete` | `autoComplete` (adds a manual Complete button) | the engine's synchronous completion path is the trigger, not our payload |

**A is the control and matters most.** If A does not freeze, something about the
rename/rebuild changed behaviour and the other three results are meaningless.

Order I would test in: A, then D, then B, then C. A and D are the most
informative; you can stop early if D survives.
