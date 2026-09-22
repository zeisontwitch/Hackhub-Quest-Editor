# Delivery zips — ready to install

| File | What it is |
|---|---|
| `qe-sdk-0.24-qa-1.0.28.zip` | QA harness 1.0.28 — the r220 feed grid: HF-1…HF-4 controls, HF-5 employer fallback (SDK employer shape), HF-6…HF-10 the editor's always-assigned quest fields isolated, HF-10 the full editor clone. |
| `qe24-feedcanary-1.0.1.zip` | Feed canary 1.0.1 — ONE bare post (HC1) from a mod with the editor exports' exact manifest (apiVersion 1, permissions `mail, events`). |

**Install BOTH folders** (delete the old `qe-sdk-0.24-qa` folder first — the
harness now ships `assets/qhp.png`), restart the game, open Hackhub, and note
which of HF-1…HF-10 and HC1 are present. `qe24 feed` prints the cheat sheet;
`qe24 run clear` cleans up. Reading the grid: `QE24-Playtest-HackhubPosting.md`,
Part 4 (one missing HF-6…HF-9 row names the killer field; HC1 absent while the
grid renders names the manifest; everything present points at the editor's
compiled runtime).
