# Working notes

One file per investigation, written before the fix rather than after it. They
are kept because the *evidence* is the valuable part: what was measured, which
theories were tested and discarded, and why the eventual answer was the answer.

Not current documentation. For how the editor works today, see
[`../06-how-it-works-today.md`](../06-how-it-works-today.md).

| Round | Investigation | What it established |
|---|---|---|
| r177 | Every unit, both ways | Both relative rows take one box per unit: a coming day counts years/months/weeks/days from now and pins a clock, Wait takes every unit (calendar included, via `scheduleAt` — the engine's duration form has no month field). The clamp is applied once, on the calendar part, before weeks and days. |
| r176 | Timer inspector: the digital clock, rows, and relative units | The Timer resolves “in N days / weeks / months / years, at HH:MM” inside the game at arm time; the editor says the rule, warns about impossible dates and clamps short months. Rows and the clock are layout kinds, transparent to the manual extractor and to every walker. |
| r175 | Refreshed QA export + the r174 leftovers | The installable QA export is regenerated at build r175 (mod 1.0.3, both quests) and guarded byte-for-byte against the compiler; the manual's conditional-field sentence names the value it waits for (G16); the stale freeze hints are gone; and `qe24 clock` in raw harness 1.0.7 settles the Timer `at` timezone question (S-04) without a date edit. |
| r171 | Inspector polish + phone proxies | Field warning tooltips need an opaque surface; the inspector handle should face the canvas; pinned SDK/docs have phone dialogs and phone apps but no declared phone-proxy call API yet. |
| r170 | Ask player prompt node | `UI.prompt` becomes a small Effects node: one-line question, optional masked input/default/example text, optional save-to-data, Submitted/Correct/Wrong/Cancelled routing, and handbook coverage. |
| r75 | Stale IPs in the save | Mod-created networks persist after uninstall, and an older build's network wins over a new one at the same address. Led to game-allocated addresses everywhere. |
| r94 | Selection gestures | React Flow clears the selection at the start of every box drag with no modifier check; ctrl+drag-to-deselect does not exist upstream at all. |
| r98 | Alignment, first pass | Snapping each corner after centring pushes differently-sized cards back off the shared line. |
| r99 | Alignment, second pass | The real defect: alignment was being handed `size: undefined` for every node, so centring silently became corner alignment. |
| r102 | Node search | Blender's model — open at the pointer, type immediately, no separate search mode. Also two collisions found by reading our own code. |
| r120 | Remote file seeding | The `world.files` node pointed at a device silently did nothing; it now folds into the device tree at build time. |
| r119 | Handbook gap analysis | What the in-game handbook settles (phishing, Suspicion, port forwarding, log paths), where the editor cannot yet express what it teaches, and three r117 guesses it contradicts. |
| r117 | Template rebuild plan | Nine entries across three tiers, covering the two website styles, the phishing flow, and a multi-tool expert chain. Also the mechanical exploitability test, which corrected two claims the r116 audit got wrong. |
| r116 | Template audit | Three templates ask the player to break in and were never given the account setup that allows it; `investigation` also ships two nodes that compile to nothing. Plus a re-read of what each template is *for*. |
| r107 | Wire physics | Why a damped spring on one scalar rather than a Verlet rope, and the ten failure modes the design has to survive. |
| r123 | Editor UX audit | Field-level warnings are the missing feature (node analysis and compile warnings exist, nothing at field level); "no jargon" means no *mod-coding* jargon — the game's own vocabulary stays. |
| r124 | Actionable hookup warnings | Every node issue gets a `nextStep` ("which nodes to put where"), rendered in the inspector header and canvas tooltips; empty-IP and seed-files placement checks move earlier. |
| r125 | Zeis's UX-check fixes | 14 items end to end — event names, port presets, firewall addresses, tag picker, table editor, working Open-handbook, numbered sequences; the firewall rule was a list field over single-object data. |
| r126 | Template audit | Four templates wired endings to `entry.complete`, which never fires with the defaults; Cold Storage's database had no tables; Help Desk's client confirmed an unsent file; ssh taught without `-h`. All fixed and pinned (ledger deferred per Zeis). |
