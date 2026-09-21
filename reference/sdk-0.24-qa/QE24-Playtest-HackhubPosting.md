# Playtest: Hackhub quest posting + the mail To field (r215)

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

## Part 2 — the mail To field

In the same editor session: give a mail node a **To** address that is not
yours (any second address — a mod Twotter contact's mail, or a made-up
address), export, run.

| Row | Green reads |
| --- | --- |
| **H-05** to is honored | The mail arrives **addressed to the To address** (visible in the mail's header line), not to you. A second mail node with To **blank** arrives to you as always. |

Paste results into `QE24-TestResults-HackhubPosting.md` on QA-Filedump as
usual. Rows are recorded open in [`STATUS.md`](STATUS.md).
