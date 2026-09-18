# P-01 — tweet times and profile order (both answered)

Two rows, one setup, both green on 2026-09-18. **P-01a** decided that the r185
Twotter build can carry backdated tweets; **P-01b** settled which way a profile
reads. The results are below; the checklist stays for the record.

**Which mod.** The **raw harness** — [`mod/`](mod/) in this folder, version
**1.0.13**. *Not* the editor export: `editor-export/` is the installable QA
project, a different mod, and it has no `qe24` commands. Nothing in the editor
changed for either row; the commands are harness-only.

**Save.** Your throwaway QA save, as always. Nothing here needs to survive.

Common setup, once per run:

1. Copy `mod/` over the harness you installed for T-01…T-07 and restart the
   game. The mod list should read **QE SDK 0.24 QA Harness 1.0.13**.
2. Load the save and make sure the probe account exists:

   ```
   qe24 twotter seed
   ```

   It prints the handle to search for: **`qe24_probe`**. Harmless to repeat.

---

## P-01a — do backdated tweets keep the time we send? ✅ **yes**

**Result (2026-09-18, game 1.3.0, build 25388883, harness 1.0.12).**
`qe24 twotter backdate` posted four tweets to `qe24_probe`: one moment, three
spellings, plus a control.

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

---

## P-01b — which way does a profile sort? ✅ **newest at the top**

**Result (2026-09-18, same save and build).** `qe24 twotter order` posted three
tweets whose posting order and time order disagree — A (two months back, posted
first), B (no time, so the engine stamped it "now", posted second), C (one month
back, posted third). The profile read, top to bottom:

| Position | Tweet | Age shown |
| --- | --- | --- |
| 1 (top) | `P-01b B` | a few seconds ago |
| 2 | `P-01b C` | a month ago |
| 3 (bottom) | `P-01b A` | 2 months ago |

**So a profile sorts by time, newest first, regardless of the order we posted
them in.** Consequences, and they are small because the engine does the sorting:

- The runtime posts a series **oldest → newest** anyway (deterministic, matches
  the author's list order); the posting order does not change what the player
  sees.
- The editor's **preview must mirror the game**: newest at the top. The author's
  row list stays chronological — the order things happened, which is how a
  history is written — and the preview says in one line that the profile shows it
  the other way up.
- **Ties keep posting order.** P-01a's three tweets all carried the same moment
  and appeared in the order they were posted, so two tweets at the identical age
  read in the order the node lists them.

### One discrepancy, recorded rather than smoothed over

The Journalist's Sister transcript describes @alinamack's profile as *"10 tweets
ranging from 'a year ago' to '9 months ago' all the way down to '8 days ago'"*,
with the story's hook as the **second to last** tweet — that reads as **oldest at
the top**, the opposite of what the probe measured.

Most likely explanations, in order: that transcription is prose about the
**hardcoded** questline in an earlier build (Twotter was rebuilt for 1.0, and
the transcription predates 1.3.0), and hardcoded content may order differently
from API posts. The probe is a direct measurement of the build we ship against
and of the exact call our runtime makes, so **it wins** — and since the declarative
`Tweets` path is fenced off, a mod never depends on the other behaviour. If a
future report shows a mod's series reading oldest-first, this note is where to
start.

*Neither row needs re-running unless a later game build changes the Twotter API.
The commands stay in the harness: `qe24 twotter backdate`, `qe24 twotter order`,
then `qe24 twotter cleanup`.*
