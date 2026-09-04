# r86 probes — testing the workaround

## J froze. That is the answer.

`J_minimal` was one objective, no network, no rewards, and nothing running in
the handler: start → contract mail → read it → done. Our `OnComplete` ran to
the end and the renderer still died.

**HackHub 1.1.2 cannot complete a mod-defined quest.** Both paths kill it:
`autoComplete` (freezes on the last tick) and the manual Complete button
(probe D — played through fine, froze on the click).

Nine hypotheses eliminated, written up in
`docs/04-engine-bug-quest-completion.md` with J as the minimal reproduction.
That document is ready to send upstream.

## The only workaround available to us

A quest that never formally completes — exactly what Nemesis does
(`AutoComplete = false`, `HasCompleteButton = false`, objective never ticked).
Objectives still tick, the story still ends, but the engine is never asked to
retire the quest.

| Build | What it is | Read the result as |
|---|---|---|
| `K_never_completes` | J's tiny quest, never completing | if it survives, the workaround is sound |
| `L_harbour_never_completes` | the **full** Harbour quest, never completing | if it survives, the workaround holds for a real quest — network, exploit, closing mail, payment |

Test **K** first (30 seconds), then **L** (the full playthrough).

**What "survives" means here:** you play to the end, the closing mail arrives,
the money lands, and the game keeps running. The quest entry stays in your
quest list showing 7/7 instead of disappearing. That is the cost of the
workaround, and I want you to see it before I make it the default.

One change since r85: we now assign `HasCompleteButton` explicitly instead of
leaving it unset when false. Unset inherits the engine's default; Nemesis sets
it to `false` outright, and matching that shape exactly is the point of K.
