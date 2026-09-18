# P-01 — do backdated tweets keep their time?

The one row that runs **before** the r185 Twotter build, because it decides
whether a piece of that build is possible at all.

**What it decides.** Twotter can be handed a tweet's time (`TwotterTweet.sendedAt`)
but has no age field — the `"2 days"` string (`postedAgo`) only exists on the
declarative quest field the editor fences. So a profile that reads lived-in —
@alinamack's ten tweets, *"a year ago"* down to *"8 days ago"* — only works if
the engine **keeps** the timestamp we send instead of stamping "now" over it.
Nobody has ever tested that.

**Which mod.** The **raw harness** — [`mod/`](mod/) in this folder, **version
1.0.12**. *Not* the editor export: `editor-export/` is the installable QA
project, a different mod, and it has no `qe24` commands. Nothing in the editor
changed for this row; the command is harness-only.

**Save.** Your throwaway QA save, as always. Nothing here needs to survive.

## Steps

1. Copy `mod/` over the harness you installed for T-01…T-07 and restart the
   game. The mod list should read **QE SDK 0.24 QA Harness 1.0.12**. (If it
   still reads 1.0.11, the copy did not take — the command below would answer
   `Unknown twotter verb`.)
2. Load the save and, in the terminal, make sure the probe account exists:

   ```
   qe24 twotter seed
   ```

   It prints the handle to search for: **`qe24_probe`**. (Running it when the
   account is already there is harmless.)
3. Run the row:

   ```
   qe24 twotter backdate
   ```

   It posts four tweets to `qe24_probe` and prints exactly what it sent —
   one moment, three spellings, plus a control.
4. Open **Twotter**, search **`qe24_probe`**, open the profile and read the four
   tweets.

| Tweet (content starts with) | Sent with | Should read |
| --- | --- | --- |
| `P-01 control: no time sent…` | no time at all | *just now* |
| `P-01a: ISO with milliseconds…` | e.g. `2026-08-18T17:12:33.123Z` | *a month ago* |
| `P-01b: ISO without milliseconds…` | e.g. `2026-08-18T17:12:33Z` | *a month ago* |
| `P-01c: plain date and time…` | e.g. `2026-08-18 17:12:33` | *a month ago* |

(The command prints the real strings — the examples above are one month before
the run, not fixed values.)

5. Take the account back out:

   ```
   qe24 twotter cleanup
   ```

## What to report back

One message, five lines — or a screenshot of the profile, which answers the first
four at once:

- Which of **a**, **b**, **c** read **"a month ago"** (or whatever the game's
  own words are), and what the others read instead (*just now*, a blank, an
  invalid-date string).
- Whether the **control** reads *just now*. If it does not, the engine is doing
  something else with times entirely and I need the reading before touching
  stage 1.
- **The order** they appear in, top to bottom — control first, or control last?
  That tells me how the profile sorts, which decides the order we post a series
  in.
- Whether the log gained a **moment.js deprecation warning** around the posts.
  A spelling the game cannot parse is exactly what produced that line before.
- If anything froze or crashed: say so. That is a finding, not a failed run.

## Safety

- If the profile freezes or the game crashes, close the game **without saving**
  and tell me — the crash itself is the answer, and it means the API path cannot
  carry backdated tweets.
- `qe24 twotter cleanup` removes the account and its posts (T-06 proved it
  works). Nothing should be left behind; if a handle survives, that is a
  finding too.

## What each answer does

| Result | What happens next |
| --- | --- |
| One or more spellings read *a month ago* | The series ships on the API path as planned, using the spelling that works. Stage 1 starts. |
| None do, control still *just now* | The engine stamps its own time. I come back with the one remaining option — the declarative `Tweets` field re-opened as a fenced exception for tweets only, with its own probe first — rather than quietly changing the plan. |
| Control is not *just now* | Something else is going on with time in this build; I need the reading before stage 1. |
