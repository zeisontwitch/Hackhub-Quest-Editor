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
| **H-10** ~~THE REPLICATION — the bare post~~ **RUN 2026-09-22: ABSENT** | Bare post (text + 2 likes only), no employer, no poster, no comments, fresh save, no mods → **the post still did not surface.** So even the r211 shape fails from an editor export today. (His player avatar was BACK this session — H-07's card was the game's own gateway failing, now closed.) Autostart was never the issue: a feed post with no autostart is the intended discovery shape. **Next: the harness grid, HF-1…HF-5 below.** |
| **H-11** ~~the author block, isolated~~ | **Superseded** — H-10's bare post failed too, so the author block is not the (only) poison. The harness grid splits the fields instead. |
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

## Part 3 — the harness grid, RAN (r219, harness 1.0.27): ALL FIVE RENDERED

**The posts are back.** Fresh save, harness installed, one look at the feed:

| Row | Shape | Result |
|---|---|---|
| **HF-1** bare | content only | **RENDERED** — poster is the game's drawn "Hidden User" persona |
| **HF-2** poster name | `author{name}` | **RENDERED** — name shows, but the avatar slot is a **broken-image icon** (name without avatar = broken icon, observed) |
| **HF-3** name + avatar file | `author{name, avatar:"assets/qhp.png"}` | **RENDERED — the violet square drew.** The asset-file avatar contract is visually proven in the feed |
| **HF-4** likes + 2 named comments | contract-clean | **RENDERED** — 3 likes, both comments with names and text; commenter avatars (absent) drew broken icons |
| **HF-5** employer fallback (first try: `{name}`) | post bare | **RENDERED** as "Hidden User" — but the shape was WRONG (`QuestEmployer` is `firstName/lastName/email`, not `name`), so this measured nothing; redone as HF-5' in 1.0.28 |

Plus, in the same feed: official posts (drawn personas, photo avatars) — and
Zeis's own player card was broken again this session (it was fine last
session): the card flakiness is the game's own gateway, confirmed.

**What the grid proved:** the post shapes are innocent — every shape renders,
from a mod, on this profile, on this build. The suppression is **mod-shaped,
not shape-shaped**. The harness mod differs from every failing editor export
in exactly the ways the next round isolates: its manifest (five permissions
vs `mail, events`) and its quest class (no ALWAYS-ASSIGNED fields).

## Part 4 — RAN (r220, harness 1.0.28 + canary 1.0.1): ALL ELEVEN RENDERED

Transcript: `QE24_TestResults-HackhubFeed-v3.md`. Fresh save, both mods:

| Row | Result |
|---|---|
| HF-1…HF-4 (controls, fresh names) | **all rendered** |
| HF-5 employer (SDK shape) | rendered ("Hidden User" pre-accept — normal); **on accept the poster REVEALED as "Ada Bakker"** (with a broken avatar — the employer's file avatar doesn't resolve on the revealed card) |
| HF-6 explicit `AutoComplete=false` | **rendered** — and on accept revealed a generated persona |
| HF-7 explicit `HasCompleteButton=false` | **rendered** |
| HF-8 explicit `Abandonable=true` | **rendered** (and was abandonable — the assignment works) |
| HF-9 zero `Rewards` | **rendered** |
| HF-10 the full editor clone | **rendered** |
| **HC1 canary** (editor's exact manifest: `mail, events`) | **RENDERED** |

**Verdict: the manifest is innocent, the quest fields are innocent, the post
shapes are innocent.** Everything renders from hand-authored mods. The only
editor render ever (1.0.38) was the FIRST claim of the one identity every
editor quest shared. Which leaves exactly one structural difference: **every
editor-compiled quest is an anonymous class expression assigned to `cls` —
`cls.name === "cls"` for every quest in every export** — while hand mods
name their classes. If the engine keys claim memory (the feed's "hasn't been
claimed yet") on the CLASS name, the 2026-09-21 feed-accept of the 1.0.38
probe burned "cls" once and suppressed every editor export since — fresh
quest names irrelevant, because identity was never the name. Hand mods'
classes have unique names; the harness factories' anonymous classes infer
name "" — which must fall back to `Name` (fresh each round). Every datapoint
fits.

r221 also fixed the editor's emission (the class is renamed to the quest's
own name at construction — identity-correcting regardless of the theory) and
made every probe abandonable (accepted strays were stuck forever — Zeis's
r220 ergonomics note).

## Part 5 — RAN (r221, harness 1.0.29): HF-11 PRESENT — the class theory is dead

Fresh save: HF-1…HF-12 **all present**, including HF-11 (the anonymous `cls`
structural twin). So the class name is NOT the identity the feed keys on.
Every hand-authored shape renders; the suppression lives in whatever makes an
editor export an editor export.

## Part 6 — RAN (r222): HC2 present, **AND V6 — AN EDITOR EXPORT — RENDERED**

Fresh saves, two stages:

- **HC2 present** — the author string is innocent (Zeis doubled down by
  exporting v6 authored "Zeissss"; it rendered too).
- **v6 (editor export, build r222) RENDERED.** The first editor-authored
  post to surface since 1.0.38 — five editor exports failed before it.

v6's shape (from his uploaded project): **bare + 2 likes** — employer empty,
no author, no comments. Exactly the H-10 shape that was absent… with two
differences:

| | H-10 (absent) | v6 (PRESENT) |
|---|---|---|
| Emitted class | anonymous `cls` | **renamed to the quest's name (r221 fix)** |
| Session | export alone | **canary 1.0.2 installed beside it** |

And the complication: HF-11 — the anonymous-`cls` structural twin — rendered
from the harness. So class name alone should not matter, yet the rename is
the ONLY emitted difference between the r218 and r222 compilers (verified by
git diff), and v6's zip carries it (`Object.defineProperty(cls, "name", …)`).

## Part 7 — r224: VF-1, CORRECTED — v3 ALONE

**Correction (Zeis, 2026-09-22): the canary was NOT installed for the v6
run** — v6 rendered with only itself installed. The co-installation fork is
dead, and that sharpens the question to a single clean run:

**Install the OLD v3 export alone** (the `hhfeed-test-v3-1.0.3(1).zip` you
have — its emission predates the rename), fresh save, one look at the feed:

| Result | Meaning |
|---|---|
| **"Hackhub Feed Test 3" renders** | the BUILD never mattered. Everything renders now; the r215–r218 failures were a **stuck feed pipeline on the profile** (the held `Queue.HandleQuestHackhubPosts` job is the fingerprint) that the harness sessions un-jammed — 12 posts flooding through, or simply more game sessions. The editor was never broken in its current form; §21 becomes a pipeline note for the developers. |
| **absent** | the r218 emission is still broken TODAY, and the r221 rename is the cure — HF-11's render gets the footnote (the twin ran from the harness, whose context differs in ways we cannot see), and v6's render is the rename working. |

Why this is still worth one look after v6's success: v6 proves the CURRENT
build works; VF-1 tells us whether the OLD builds were ever broken — which
decides whether the five failed exports were our bug (renamed classes fixed
it) or the game's (a jam that cleared). Different §21 text either way, and
it decides whether pre-r221 exports still out there are dead on arrival or
fine.

## History## History## History## History## History## History

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

- **2026-09-22, H-10 (the bare-post replication):** bare post, fresh save,
  no mods — **absent**. Every editor-export shape has now failed, including
  the only one that ever worked. His player avatar returned this session,
  closing H-07 as game-side (the 429ing gateway). r219 answers with the
  harness grid (HF-1…HF-5): the same probe quest shapes, from the QA harness
  mod — the one mod whose post ever rendered, with five permissions where the
  editor ships two. That permission/identity difference is now the sharpest
  untested variable we have.

- **2026-09-22, the r219 grid RAN: all five posts rendered.** Shapes are
  innocent; the file-avatar contract drew (HF-3's violet square);
  name-without-avatar draws a broken icon (HF-2, HF-4's commenters); the
  employer fallback measured nothing (wrong shape — redone in 1.0.28);
  Zeis's player card flaky again (game-side). r220 isolates the two remaining
  deltas: the editor's ALWAYS-ASSIGNED quest fields (HF-6…HF-10) and the
  editor's manifest shape (the canary, HC1).
- **Zeis, on "Hidden User":** standard Hackhub behaviour — some posters are
  shown, some are hidden until the quest is accepted. So the r219 grid's
  "Hidden User" rows were normal, not an engine quirk; §22's question is
  now about the reveal: does accepting a probe post reveal an authored
  (or employer) author?

- **2026-09-22, the r220 grid RAN: all eleven posts rendered, including the
  canary** (transcript `QE24_TestResults-HackhubFeed-v3.md`). Manifest,
  quest fields, and post shapes are all innocent; Zeis's accept-reveals
  measured the employer fallback (Ada Bakker revealed; generated personas
  otherwise) and confirmed hidden-until-accept is standard. One structural
  difference remains between the rendering hand mods and the never-
  rendering editor exports: the compiled quests are ALL class "cls". r221
  renames the editor's classes (the fix) and ships the HF-11/HF-12 pair
  that decides the theory in one look.

- **2026-09-22, r221's pair RAN: HF-11 PRESENT.** The class-identity theory
  is dead — an anonymous `cls`-named class rendered like any other. r222
  pivots to the last untested correlation: author "Zeis" is on every silent
  export and no rendering mod (canary 1.0.2 flips just that string). The
  r211→r213 runtime diff (52 lines, flow-runner only) confirms nothing
  registration-relevant changed around the 1.0.38 render — that once-render
  stays fully explained by per-quest-name claim memory.

- **2026-09-22, r222's run: HC2 present (author innocent, "Zeissss" rendered
  too) — and v6, an editor export built with r222, RENDERED.** Bare post,
  fresh name, five failed exports before it. The emitted delta between the
  failing r218 and the working r222 is exactly the class rename; the
  co-installation (canary) is the other candidate. VF-1 (v3 zip + canary
  together) splits them.

- **Correction to the r223 plan:** the canary was NOT installed beside v6 —
  it rendered alone. Co-installation is out; the fork collapses to "does the
  OLD emission render today?" (v3 alone), which is now VF-1.
