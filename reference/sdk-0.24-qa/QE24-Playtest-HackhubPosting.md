# Playtest: Hackhub quest posting + the mail To field (r215 → r216 retest)

**Three attempts. The first two found compiler bugs (data-URI avatars, blank
comment authors) — both fixed and verified in the exports. The third (v3)
was flawless by every check we can run locally — fresh name, fresh id, named
commenter, extracted assets, contract-clean shapes — and the post STILL never
surfaced.** That empties our side of the ledger and leaves one pattern: every
post that carried an author block (r215, v2, v3) failed; the only post that
ever rendered (the r211 probe, export 1.0.38) was **bare** — text only, no
poster, no comments, no employer. H-10 below is the decisive replication.

**Two attempts, two compiler bugs found.** First (r215): quest images shipped
as inline data-URIs the feed cannot load — fixed in r216. Second (the r216
retest, 2026-09-22): the export was clean — the asset file shipped, zero
data-URIs — and the post **still** never surfaced. The r216 diagnosis round
found the likely killer in the compiled runtime: every comment with a blank
author rode out as an **empty author object**, and the SDK's own types require
a comment author to carry a **name**. Both quests that never surfaced carried
a blank-author comment; the one post that ever rendered had no comments at
all. r217 stops sending the invalid shape. **For the retest, give every
commenter a name — that is the shape the types guarantee.** (The r216 UI told
you "leave blank for a generated name"; that advice is withdrawn for
comments — blank is now unverified, see H-08.)

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
| **H-08** the blank comment (optional, after H-01 passes) | On a **later** run: blank one commenter's name, re-export, fresh save. Does the post still render, and what name does the comment show — none, or a game-generated persona? This measures the §20 question. If the post vanishes again, the blank comment is the culprit and the editor will drop the "blank" option entirely. |
| **H-09** a profile that has never seen the quest | Same quest, **brand-new profile** (not just a new save). If the post renders there but not on your main profile, the per-profile claim memory (§18) is confirmed end-to-end — your main profile is then the "poisoned" lab and fresh quests are the everyday path. |
| **H-10** THE REPLICATION — the bare post (do this one next) | Author the only shape that has ever rendered: new project, quest identifier **never used on this profile**, post toggle ON with **text only** — poster name/avatar left EMPTY, **no comments**, **Employer section left completely empty** (nothing typed, no avatar), re-export, fresh save. Renders → the author/employer/comment blocks are the killer and we bisect from there (H-11 is the first cut). Absent → mod quest posts are dead on 1.3.1 entirely, §21 goes to the developers with the full matrix. |
| **H-11** the author block, isolated (only if H-10 renders) | Same bare quest, but poster **name** filled (nothing else — no avatar, no comments, employer still empty). Absent → `HackhubPost.author` is the poison (v2 already failed with a name-only author); the editor drops or re-shapes the field. |

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

- **2026-09-22, the r216 retest:** export clean (the asset file shipped, zero
  data-URIs), post still absent. The game log's two suspicious lines checked
  out as old noise: the API v1 compatibility notice and the held
  `Queue.HandleQuestHackhubPosts` job both appear in every session on file,
  including the vanilla one. What did NOT check out: every quest that never
  surfaced carried a **blank-author comment** (emitted as an empty author
  object, violating the SDK's required `author.name`), and the only post that
  ever rendered had no comments. r217 fixes the emitted shape, withdraws the
  "leave blank" advice for commenters, surfaces the quest's internal id
  (both r216 quests still carried the blank-project placeholder `q-blank` —
  invisible in the UI; it never reaches the game, but it hid until now), and
  files §19 (API v2) and §20 (comment authors).

- **2026-09-22, v3 (export 1.0.3, r217):** every local check passed — fresh
  name `HHFeedTest3`, fresh id (the new-id button's first field use), employer
  + poster + commenter all named, all three avatars extracted to asset files,
  zero data-URIs, contract-clean author shapes. Fresh save. **Post absent;
  player card still avatarless.** The failures now line up: every post with an
  author block failed (r215, v2, v3); the only ever-render was a bare post.
  The player's own profile card has now broken on a clean save with a clean
  export — with the auth gateway 429-ing every session, that card is the
  game's online side failing, not our data.
