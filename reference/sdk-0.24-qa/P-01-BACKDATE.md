# P-01 — backdated tweets (answered) and which way a profile sorts (open)

Two rows, one setup. **P-01a decided whether the r185 Twotter build can carry
backdated tweets at all; it came back green on 2026-09-18.** P-01b is a single
look that settles the order a series is posted in, and it is all that is left.

**Which mod.** The **raw harness** — [`mod/`](mod/) in this folder, **version
1.0.13**. *Not* the editor export: `editor-export/` is the installable QA
project, a different mod, and it has no `qe24` commands. Nothing in the editor
changed for either row; the commands are harness-only.

**Save.** Your throwaway QA save, as always. Nothing here needs to survive.

Common setup, once per run:

1. Copy `mod/` over the harness you installed for T-01…T-07 and restart the
   game. The mod list should read **QE SDK 0.24 QA Harness 1.0.13**. (If it still
   reads an older number the copy did not take, and the commands below would
   answer `Unknown twotter verb`.)
2. Load the save and make sure the probe account exists:

   ```
   qe24 twotter seed
   ```

   It prints the handle to search for: **`qe24_probe`**. Harmless to repeat.

---

## P-01a — do backdated tweets keep the time we send? ✅ **answered: yes**

**Result (2026-09-18, game 1.3.0, build 25388883, harness 1.0.12).** The command
posts four tweets to `qe24_probe`: one moment, three spellings, plus a control.

| Tweet | Sent with | Read back as |
| --- | --- | --- |
| `P-01 control` | **no time at all** | **"a few seconds ago"** — the engine stamps its own time only when we send none |
| `P-01a` | `2026-08-18T19:09:35.285Z` (ISO, milliseconds) | **"a month ago"** |
| `P-01b` | `2026-08-18T19:09:35Z` (ISO, no milliseconds) | **"a month ago"** |
| `P-01c` | `2026-08-18 19:09:35` (plain date and time) | **"a month ago"** |

All three spellings work, so the runtime sends **ISO with milliseconds**,
computed from the in-game clock (`Time.date()` minus the author's amount and
unit). Ages are the game's own words, which is why the old moment.js warning has
nowhere to come from.

Two things the same run showed, both useful later: the profile rendered a
complete engine-made record (banner, avatar, "Joined September 2026",
`33 Following 82 Followers`, the blue check), and the four counters read exactly
as authored — `0 reposts · 2 likes · 0 replies`, `22 views` on the detail page.
The detail page's absolute line said **"8:09 PM · Aug 18, 2026"** for that
19:09Z stamp, an hour behind the machine's own zone. Relative ages are what a
profile shows and those were right; the editor computes stamps from the in-game
clock, so this is a note, not a fence.

*No action needed — this row is done. Repeat it only if a later game build
changes the Twotter API.*

---

## P-01b — which way does a profile sort? ⬜ **open**

The P-01a run left one ambiguity: its control tweet was the newest **and** the
first posted, so "newest first" and "in the order we posted them" looked
identical. Three tweets whose time order and posting order disagree tell them
apart — and the answer decides the order a backdated series is posted in, and
what the editor's preview must mirror.

1. In the terminal, with the probe account seeded (common setup above):

   ```
   qe24 twotter order
   ```

   It posts three tweets to `qe24_probe`:

   | Tweet | Sent with | Posted |
   | --- | --- | --- |
   | `P-01b A` | two months back | **first** |
   | `P-01b B` | no time (reads "just now") | **second** |
   | `P-01b C` | one month back | **third** |

2. Open **Twotter**, search **`qe24_probe`**, open the profile, and read the
   three tweets **top to bottom**.

**Report back the three letters, in that order.** They are the whole answer:

| What you see | What it means |
| --- | --- |
| `A, B, C` | the profile shows them **in the order we posted them** — the author's row order is the reading order |
| `A, C, B` | **oldest first** |
| `B, C, A` | **newest first** |

3. Take the account back out:

   ```
   qe24 twotter cleanup
   ```

**What each answer changes.** The runtime posts a series oldest → newest (that
is how the Journalist's Sister profile reads). If the profile shows posted order,
the author's own row order is what the player sees, and the editor's preview
mirrors it exactly. If the profile sorts by time, the series still posts the same
way — but the preview must show the game's order instead of the author's, or it
lies about what the player will see, and the author gets a line in the inspector
naming the way it will appear.

If the profile shows something other than those three arrangements (a jumble, or
only some of the tweets), say so and paste the screen — that is a finding worth
having, not a failed run.
