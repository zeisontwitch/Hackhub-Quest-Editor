# Playtest: Hackhub quest posting + the mail To field (r215 → r216 retest)

**First attempt (r215, export 1.0.0 by Zeis): the post never reached the
feed** and the player's own avatar broke — root cause found in the COMPILER:
quest-level images shipped as inline 228 KB data-URIs the game's feed cannot
load (mod icon/cover were always extracted to files; quest avatars were not).
Fixed in r216, alongside everything his player's-eye pass flagged (see the
history at the bottom). **Retest from scratch: rebuild the post in the
editor, re-export, fresh save.**

Two things to check, one session. The **posting half is authored in the
editor this time** — that is the point: you build the post with the new UI,
export, and see it on the board.

## Part 1 — the feed post (author it yourself)

1. Open the editor, new or existing project. Quest tab → **Hackhub feed
   post** → toggle it on.
2. Fill: post text (a small job pitch), **Poster name** via the dice,
   **Poster avatar** via upload (any small PNG/JPG), likes, and **one
   comment** (name + text; leave its avatar blank on purpose).
   Leave the **Employer avatar** blank too (employer section).
3. Export, install the mod, fresh save, open the Hackhub feed.

| Row | Green reads |
| --- | --- |
| **H-01** the post renders | Your post is on the board with your **uploaded avatar** and your **dice name** (this is the half we could not verify locally — the engine may ignore `author.avatar`; if the avatar is the game's drawn one instead of yours, that is a real finding, not a test failure). |
| **H-02** likes + comment | The likes number shows; your comment shows under the post with a **drawn** avatar (you left it blank on purpose). |
| **H-03** accept + the feed Complete button | Accepting from the post claims the quest; per your note, the **Complete button lives on the feed post**, not the journal — confirm that is what you see. |
| **H-04** the post on a second run | Start a **new save** on the same profile: does the post render again? (The once-claimed-never-again question from the r211 runs — this decides whether we file the §18 lifecycle question harder.) |
| **H-06** employer vs poster | Set an **Employer name** in the quest settings, leave the post's **Poster name blank**, re-export, look at the feed. Whose name is on the post — the employer's or a generated stranger's? Tells us whether the game links the two fields (the UI currently says "not verified"). |
| **H-07** the player card | Is your own Hackhub profile avatar intact this time? (It broke alongside the post in the r215 attempt — if it breaks again on a clean save **without** the mod, it is the game's own bug; say so in the results.) |

## Part 2 — the mail To field

In the same editor session: give a mail node a **To** address that is not
yours (any second address — a mod Twotter contact's mail, or a made-up
address), export, run.

| Row | Green reads |
| --- | --- |
| **H-05** to is honored | The mail arrives **addressed to the To address** (visible in the mail's header line), not to you. A second mail node with To **blank** arrives to you as always. |

Paste results into `QE24-TestResults-HackhubPosting.md` on QA-Filedump as
usual. Rows are recorded open in [`STATUS.md`](STATUS.md).

## History

- **2026-09-21, first attempt (Zeis's own export, r215):** the feed showed
  only official posts; his post was missing and his player avatar broke.
  Diagnosis from his uploaded export: the data reached the game correctly
  (`hackhubPost` with author + a 228 KB data-URI avatar), so the failure is
  the game choking on the inline image — the compiler now extracts quest
  images to `assets/*.png` files (r216). Also from his player's-eye pass:
  the feed-post notice painted the export dialog red ("Needs attention") for
  a correct setup — now info-level (yellow); the Journal group dropdown had
  no blurb; the comments list had no blurb; the section now lives inside
  Behaviour; the Employer/post relationship is written down with a row (H-06)
  to measure it; and the XP field carries an honest note (SDK-declared, never
  seen in the game UI).
