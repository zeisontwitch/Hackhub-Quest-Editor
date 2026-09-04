# r88 — the shipping default

## M worked

Full Harbour quest, no freeze, and the objective rows **disappeared** — so the
engine does re-read the objectives array after the panel is built. The only
blemish was the header reading **`0/0 completed`**, because the counter counts
visible rows and we had hidden every one.

## The fix

Keep the **last** row visible and rewrite it into a closing line. The panel
then reads `1/1 completed` with a single ticked item saying the contract is
closed, instead of an empty `0/0`.

This is now the default for every quest the editor generates:

| Setting | Default |
|---|---|
| Complete automatically | **off** (crashes the game) |
| Manual complete button | **off** (crashes the game) |
| Tidy the objective list when the story ends | **on** |
| Closing line | written per template |

Both toggles now carry hints explaining *why* they are off, so nobody turns
them back on and hits the freeze. The old hint actively recommended
`autoComplete`, which was bad advice.

## One confirmation run

| Build | What it is |
|---|---|
| `N_shipping_default` | the stock Harbour template with **nothing overridden** — exactly what an author gets today |

Play it through. Expected: no freeze, and when you send the final mail the
panel collapses to one ticked line reading *"Contract closed. The manifest is
with the client."*

If that is what you see, the engine bug is worked around end to end and we can
get back to features. The remaining permanent cost is that the quest entry
itself stays in the list — no API exists to remove it, and that is now question
5 in `docs/04-engine-bug-quest-completion.md` for the devs.
