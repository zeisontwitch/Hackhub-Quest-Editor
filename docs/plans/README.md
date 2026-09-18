# Working notes

One file per investigation, written before the fix rather than after it. They
are kept because the *evidence* is the valuable part: what was measured, which
theories were tested and discarded, and why the eventual answer was the answer.

Not current documentation. For how the editor works today, see
[`../06-how-it-works-today.md`](../06-how-it-works-today.md).

| Round | Investigation | What it established |
|---|---|---|
| r181 | Quiet QA: the notification storm, and the rows the pasted `qe24 timers` output already answered | Zeis's Timer run closed ten of the fifteen rows (the reload paste shows identical job ids and `fireAt` before and after save/quit/reload; the mixed row resolved to 3 Nov 18:23 and Wait-1-month to 18 Oct 19:27) — but the run was unusable as a *checklist* because five QA quests auto-started at load and four of them toasted. Every QA quest is now claimed on demand (`qe24 run`), debug nodes no longer toast, and two guards keep it that way. |
| r180 | The Twotter verdict, and the Timer rows made runnable | The probe came back green on the read path (build 25388883) and the checklist Zeis could not find now exists: `TIMER-ROWS.md` plus harness 1.0.10's `qe24 timers`, which reads a pending job's resolved moment instead of waiting out the month. Two new auto-start QA quests and two legacy fixtures make every S-row runnable; the `AccountCreated` finding is recorded for the implementation round. |
| r179 | The Twotter probe | sdk-0.24 declares `updateUser`/`removeUser` and 1.3.0 claims the crash is fixed, so the raw harness gets one open probe (`qe24 twotter`, rows T-01–T-07) that plants the exact r31 bad-record shape, tests repair-on-load, and checks the quest-declared write path. Eleven tests drive the probe against a stub SDK. |
| r178 | QA folder closed, S-04 answered | The in-game clock displays the machine's local time (20:17 on screen vs 20:15 local / 18:15 UTC), so the `at` correction stays. The QA folder becomes tooling: one STATUS ledger, no procedures, harness guide no longer lists finished checks. Twotter's r31 crash cause is fixed in 1.3.0, reopening the feature. |
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
