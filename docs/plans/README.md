# Working notes

One file per investigation, written before the fix rather than after it. They
are kept because the *evidence* is the valuable part: what was measured, which
theories were tested and discarded, and why the eventual answer was the answer.

Not current documentation. For how the editor works today, see
[`../06-how-it-works-today.md`](../06-how-it-works-today.md).

| Round | Investigation | What it established |
|---|---|---|
| r75 | Stale IPs in the save | Mod-created networks persist after uninstall, and an older build's network wins over a new one at the same address. Led to game-allocated addresses everywhere. |
| r94 | Selection gestures | React Flow clears the selection at the start of every box drag with no modifier check; ctrl+drag-to-deselect does not exist upstream at all. |
| r98 | Alignment, first pass | Snapping each corner after centring pushes differently-sized cards back off the shared line. |
| r99 | Alignment, second pass | The real defect: alignment was being handed `size: undefined` for every node, so centring silently became corner alignment. |
| r102 | Node search | Blender's model — open at the pointer, type immediately, no separate search mode. Also two collisions found by reading our own code. |
| r117 | Template rebuild plan | Eight templates, two kept and six new, each covering a different situation at a stated difficulty. Also the mechanical exploitability test, which corrected two claims the r116 audit got wrong. |
| r116 | Template audit | Three templates ask the player to break in and were never given the account setup that allows it; `investigation` also ships two nodes that compile to nothing. Plus a re-read of what each template is *for*. |
| r107 | Wire physics | Why a damped spring on one scalar rather than a Verlet rope, and the ten failure modes the design has to survive. |
