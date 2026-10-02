# Delivery zips — ready to install

| File | What it is |
|---|---|
| `qe-sdk-024-modsettings-v2-1.0.0.zip` | **ModSettings Probe — API v2 variant (r240)** — the identical probe with `apiVersion: 2`; the copy Zeis actually tested. The version turned out not to be the gate (the settings UI was in the main menu all along), but v2 is now the right value anyway, so the v1 probe has been bumped to 2 as well and this variant is kept only as the tested artifact. |
| `qe-sdk-024-modsettings-1.0.0.zip` | **ModSettings Probe (r239)** — the first in-game look at declarative mod settings: six settings (one of every declared type) in the Mods menu, seven quest objectives = the QA checklist in `docs/plans/r239-modsettings-probe.md`. Installs alongside the r238 probe so one session covers both. |
| `qe-sdk-024-dynprobe-1.4.0.zip` | **Dynamic Page Probe 1.4.0 (r250)** — the one to run now, and the first fair mail test. Builds 1.0–1.3 addressed their test mails to `player@gomail.com`, a placeholder from this repo's own QA project that has never existed, so the mail that never arrived proved nothing and two "findings" are withdrawn (the `to:` one, and the older "a page's own permissioned call does not work"). Every probe mail now goes to the player (no `to:` field, or the real address from `Mail.getPlayerEmail()`) or nowhere on purpose, clearly labelled. **That re-opens the question the probe exists to answer: can a page's own script send a mail that actually arrives?** |
| `qe-sdk-024-dynprobe-1.3.0.zip` | **Dynamic Page Probe 1.3.0 (r249, superseded by 1.4.0)** — **Dynamic Page Probe 1.3.0 (r249)** — the one to run now. Run 3 confirmed that of the two test mails only the one **without** a `to:` field arrives, so 1.3.0 sends a third mail to your **real** address (`Mail.getPlayerEmail()`) to separate "the address was wrong" from "any `to:` loses the mail", and adds `qedyn inbox`, which lists what the game says is in the inbox — a mail that is listed but not drawn is a different bug from one that was dropped. |
| `qe-sdk-024-dynprobe-1.2.0.zip` | **Dynamic Page Probe 1.2.0 (r248, superseded by 1.3.0)** — **Dynamic Page Probe 1.2.0 (r248)** — the one to run now. Adds `qedyn mail` (the decisive test: two mails, one with a `to:` field and one without, because run 2 proved the page's mail is *accepted* and lost in delivery — not refused), prints to the terminal as well as the log, and `qedyn tick` takes a row number as well as a name. |
| `qe-sdk-024-dynprobe-1.1.1.zip` | **Dynamic Page Probe 1.1.1 (r247, superseded by 1.2.0)** — **Dynamic Page Probe 1.1.1 (r247)** — the one to run. Same as 1.1.0 plus `qedyn claim` (the feed post may never surface — docs/03 §21), and the command is built inside a guarded block so it can never take the mod down with it. |
| `qe-sdk-024-dynprobe-1.1.0.zip` | **Dynamic Page Probe 1.1.0 (r246, superseded by 1.1.1)** — **Dynamic Page Probe 1.1.0 (r246 rebuild)** — the one to run now. The beat is fired by the `qedyn beat` terminal command (the old one hung off `Http.Response`, which never arrives), `/form` prints what `Mail.send` *returned* and adds a second button that goes through the documented `Events.emit` bridge, and `qedyn status` prints every event the mod was offered. Same site, same pages, 14 checklist rows. |
| `qe-sdk-024-dynprobe-1.0.0.zip` | **Dynamic Page Probe 1.0.0 (r238, superseded by 1.1.0)** — **Dynamic Page Probe (r238)** — the r237 open-questions test site on `qe24-dyn.test`: one static control page + seven dynamic pages, twelve quest objectives = the QA checklist in `docs/plans/r238-dynamic-pages-probe.md`. Accept the "QA probe (r238)" feed post and work the tracker top to bottom. |
| `qe-sdk-0.24-qa-1.0.29.zip` | QA harness 1.0.29 — the decisive pair: HF-11 (the editor's anonymous-`cls` structural twin) vs HF-12 (renamed class), plus HF-1…HF-10 controls. Every probe is abandonable now. |
| `qe24-feedcanary-1.0.2.zip` | Feed canary 1.0.2 — the AUTHOR test: identical to the canary that rendered (HC1, 1.0.1), except the manifest author is now "Zeis". Post **HC2**. |

**This session:** canary 1.0.2 (HC2) + a fresh post authored in the r221 editor (v4) — one look at the feed covers both.

**Install BOTH folders** (delete the old `qe-sdk-0.24-qa` folder first — the
harness now ships `assets/qhp.png`), restart the game, open Hackhub, and note
which of HF-1…HF-10 and HC1 are present. `qe24 feed` prints the cheat sheet;
`qe24 run clear` cleans up. Reading the grid: `QE24-Playtest-HackhubPosting.md`,
Part 4 (one missing HF-6…HF-9 row names the killer field; HC1 absent while the
grid renders names the manifest; everything present points at the editor's
compiled runtime).
