# r185 (plan, for review): Twotter comes back

**Nothing in this document is built yet.** Revision 3, written after your three
answers of 2026-09-18 (they changed one shape: the node now posts a *series*, not
a single tweet) and after both probes came back. **Nothing is open any more:**
P-01a proved the platform keeps a timestamp we send, and P-01b proved a profile
shows the newest tweet first. Sections 2, 3.2, 5, 7, 8 and 9 carry the results.

## 0. Your answers, folded in

| Your call | What changed in this plan |
| --- | --- |
| **Accounts at mod level** | As proposed — one list for the whole mod, next to Websites. Accounts are world-building, not a beat. |
| **Removal: only what it created, and only when no other live quest declares it** | Now the rule in section 1, with the mechanics spelled out (creation is tracked per playthrough; adoption counts as *not ours*). |
| **Tweets backdated by a timeframe** — a profile found with a month of history must read lived-in | The biggest change: the node posts a **list of tweets**, each with its own time (section 2). The old node could already do one backdated tweet (`postedAgo` / a fixed date) — the rework keeps that and makes a whole history practical. |
| **"Post tweet" works, but "Twotter" is also good** | I am recommending **"Twotter"** — with the reasoning in section 2, and one difference from your reading that matters: the node does not *create* accounts (they live at mod level, your own call). It does get a door to create one without leaving the node. |
| **Canvas card should look like the other node cards** | Dropped from the plan. The card stays a normal card; the whimsy moved to the account editor and the node's preview (section 6). |
| **Mock Twotter profile with click-to-edit name / @handle / bio / pictures** | Adopted, in the place accounts actually live: the Twotter panel. The node shows the same profile read-only, over its tweet timeline, with a link across. |

## 1. Why it can come back — the evidence, not the hope

Three things changed since r31 removed the feature, and the probe (r179) tested
exactly the one that mattered:

| Evidence | Status |
| --- | --- |
| A stored account with `bio: undefined` — the shape that crashed search for seven QA rounds — **no longer crashes anything**. Searched, listed, opened, no freeze. | **Verified in game** (T-02, build 25388883) |
| `Twotter.createUser()` fills a **complete** record (name, surname, avatar, banner, followers, following, password). | **Verified** (T-01) |
| `Twotter.removeUser()` deletes accounts — **including quest-declared ones** — and the handles leave search. | **Verified** (T-06) |
| `postTweet` puts a tweet on a profile and `Twotter.PostSeen` fires. | **Verified** (T-05) |
| "Affected saves are repaired on load" (1.3.0 changelog). | **Did not happen** — the bad bio survived the reload (T-03). Nothing may rely on it. |
| Quest-declared accounts carry their bio. | Verified **at record level** (T-07); the profile screen itself was not reported on. |
| `Twotter.AccountCreated` fires for an account we add. | **It does not** — the objective stayed open while `PostSeen` ticked (T-05). |
| `postTweet` honours a `sendedAt` we set. | **Unknown** — never tested. This is `P-01`, section 5. |

**The rule that follows from that table:** author accounts through
`createUser`/`addUser`, never through the declarative `TwotterAccounts` field —
that field is the crash path, and it is the one thing the engine still writes
incompletely.

## 2. The Journalist's Sister evidence: what "lived-in" looks like

You pointed me at the questline, so here is what it actually does — this is now
the design target for the series:

- **@alinamack** (Part 1): searching the handle shows **10 tweets**, *"a year
  ago"* through *"9 months ago"* *"all the way down to '8 days ago'"*, each one
  about travelling; the second-to-last is the story's hook ("Something very
  strange happened today… the Grand Hotel"). **Note on that wording:** as
  transcribed it reads oldest-at-top. P-01b measured the current build's API
  path and it sorts **newest first** — the transcription is prose about
  hardcoded content in an earlier build, and since the declarative path is
  fenced off, our series follow the probe. The discrepancy is on the record in
  [`P-01-BACKDATE.md`](../../reference/sdk-0.24-qa/P-01-BACKDATE.md). The player
  gets the whole history in one visit, at the moment the story wants them to.
- **@andrea_siebert** (later parts): *"One of her tweets from 2 hours ago shows
  she's about to board a plane"* — and it carries a **photo** (a boarding pass),
  so backdating and pictures work together.

Two things that follow. First, the ages are the fiction: the profile is a
character's past, not an announcement feed. Second, the game renders those ages
as relative strings ("a year ago", "2 hours ago") — and **that is the same code
path that logged the moment.js deprecation warning** when the old editor handed
it `postedAgo: "3h"`. Our job is to hand it a real timestamp instead of a word,
which is exactly what section 5 probes.

*For the record, this capability is not new:* the removed r30 node already had
`timeMode: now | relative | absolute` with `postedAgo` / `postedAt`, so people's
old drafts may well be full of backdated tweets. What the rework adds is the
**series** — one node that lays down a whole history — and a time the game can
render without warning.

## 3. What the feature is

### 3.1 Twotter accounts — a mod-level section (your call)

Today a mod is quests + websites. Accounts join that list. The panel opens from
the TopBar the way Websites does, and holds a card per account with the **mock
profile** of section 6 on it.

| Field | Notes |
| --- | --- |
| **Handle** | `@` is part of the control, not something to type. Validated like the game does it: letters, numbers, `_`, 3–15 characters. This is what search matches on, so it gets the strictest validation in the editor. |
| **Display name** | One line; the game splits it into first/last for its own display. |
| **Bio** | Multi-line, tokens allowed (`{{player}}` reads well in a bio). **Always written as a string** — see the fence in section 5. |
| **Avatar**, **Banner** | The image picker that already exists (the game shows both). |
| **Verified** | Toggle — the blue check. Authors ask for it for official-looking accounts. |
| **Followers / Following** | Numbers; `createUser` takes them, and a brand-new account with 0 followers reads as fake in a screenshot. |
| **Remove this account when the quest ends** | Default **on**. Off for a character who should outlive the story — the trade-off is written on the field ("the account stays in the player's save; we will not clean it up"). |

Deliberately **not** exposed: the account password (the engine generates one;
nobody logs in as an NPC) and `isMine` (that flag means "this is the player" —
authoring it would be a lie).

**Lifecycle, per your rule:**

1. The account is created when the **first live quest that declares it** starts
   (claim or reload — the same hook that re-registers everything else).
2. Creating **adopts** an existing handle instead of duplicating it
   (`getUserByUsername` → `updateUser` with the author's fields, so editing a bio
   in the editor arrives on the next load). An adopted account is *not ours to
   remove* — we note that at creation time and leave it alone afterwards.
3. On complete/abandon we remove **only the accounts this quest created**, and
   **only if no other live quest of this mod declares the same account**. "Live"
   = not itself completed or abandoned. This is the one piece of state that has
   to live above the per-quest closure, like the network ownership ledger
   already does.
4. When a mod is uninstalled the SDK's own advice is to clean up the accounts we
   added (`OnModPackageUnloaded` — it exists in 0.24 and does not run our quest
   hooks). We hook it and remove every account we created, including ones whose
   removal toggle is off: the story is gone with the mod. Fail open, always.

### 3.2 The node: **"Twotter"** — one tweet or a whole history

The node keeps the id `comms.tweet`, so old drafts map onto it instead of having
their tweets deleted (section 5). What changed is that its body is a **list**:

| Field | Notes |
| --- | --- |
| **Account** | A picker over the mod's accounts, by handle. Plus a **“New account…”** row that creates one in the Twotter panel and selects it — so you never have to leave the node to get unstuck. |
| **Tweets** | The list. One row is the simple case; ten rows is @alinamack. Each row: |
| · **Content** | Multi-line, tokens allowed. |
| · **When** | **When the story arrives** (default), or **Earlier** with an amount + unit (minutes → years, e.g. `1 month`, `8 days`, `2 hours`). A number and a dropdown — no free text, which is how the moment.js warning gets designed out rather than avoided. |
| · **Picture** | Optional image — the boarding-pass case. |
| · **Likes / Comments / Shares / Views** | Four numbers on one line, prefilled with believable defaults. |
| · **Show in the main timeline** | Per row, not per node: a year of history should not flood the feed, but this afternoon's announcement can. |
| **Post** | `showInTimeline`-style per-row toggle above; nothing else to set. |

Rows are ordered **oldest → newest** — the author writes a history the way it
happened — and the runtime posts them in that order (deterministic; it does not
change the display). **The player sees the newest first**: P-01b measured it
(`B, C, A` top to bottom), so the profile sorts by time and ignores posting
order, and **ties keep posting order** (P-01a's three equal-moment tweets
appeared in the order they were posted). The editor's preview follows the game
(section 7) while the list stays chronological.

Runtime rules, which are where the old version was worst:

- **Post once per playthrough, per node.** The flow re-runs on a save reload
  (r177's lesson), so the runtime records which nodes have posted and skips them
  the second time.
- **Remove what we posted.** On quest complete or abandon the tweets go back out
  through `removeTweet`, joined to the cleanup list the quest already runs.
- **Fail open.** A build without the Twotter API logs one line and the story
  carries on; no node ever blocks on it.

### 3.3 Reacting to Twotter — nothing to build, one thing to say

The generic **When event** trigger already offers all six Twotter events, so an
author can react to `PostSeen`, `ProfileSeen`, `AccountLogin` and friends today.
What they cannot know from the editor is which of those our own accounts can
raise:

- `PostSeen` / `ProfileSeen` — **verified working**.
- `AccountCreated` — **does not fire for accounts we add** (probe finding). The
  picker will say so, so nobody builds a beat on it.
- `Post` carries `{questId, tweetIndex}` — an index into *the quest's declared
  tweets*, the path we are not using. Expect it not to fire for our posts; the
  QA row checks it.
- `AccountLogin` / `AccountLogout` are about **the player's** account, not an
  NPC's.

### 3.4 What the node asks the player for: nothing

The Twotter node adds **no permission** to the export, and that is a decision
with evidence, not an oversight. SDK 0.24's `ModPermission` union is
`filesystem | network | events | mail | bank | shell | ui` — there is no token
for the social APIs, so there is nothing to declare for `createUser`,
`postTweet`, `updateUser` or `removeUser`. The in-game probe is the proof: the
QA harness declares only network/events/mail/shell/ui and its Twotter calls ran
(build 25388883, 2026-09-18). The compiler says so in a comment beside
`PERMISSIONS_BY_NODE_TYPE`, where the next person to look for a missing entry
will find it.

(While checking this, one manual error was fixed: `export.html` and
`concepts.html` both promised *six* permissions and omitted **mail**, which the
editor has emitted since the dialogue node's Mail kind existed. Both pages now
list seven.)

## 4. The fences — what stops r31 happening again

The removal's guard was "the compiled mod must not contain the words `Twotter`
or `Tweets`". That has to change, and it must change into something *stronger*
than a word ban, because the lessons are specific:

1. **Never emit the declarative path.** A test asserts the compiled quest
   definition carries no `TwotterAccounts` and no `Tweets` field. That is the
   field the engine still fills incompletely, and the one that poisoned saves.
2. **Every record we create is complete.** The runtime passes `createUser` a
   record with **every** field it supports, `bio` included — and a test asserts
   that an account authored with a *blank* bio still creates `bio: ""`, never
   `undefined`. That single assertion is the r31 bug, inverted.
3. **What we create, we remove.** A behavioural test runs the compiled mod
   against a stub SDK: quest starts → account exists; quest abandoned → account
   gone, unless the author turned the removal off *or* another live quest
   declares it.
4. **Idempotent across reloads.** Creating adopts an existing handle
   (`getUserByUsername`) instead of duplicating, and refreshes the
   author-controlled fields with `updateUser` — so editing the bio in the editor
   updates the account on the next load, which is the repair the old report
   wished existed. Tweets carry deterministic ids
   (`qe-<quest>-<node>-<row>`), so a reload cannot double-post them.
5. **No objectives or triggers on `AccountCreated`.** The event picker says so
   in plain words.

## 5. The time question — both probes answered

`TwotterTweet` has `sendedAt?: string` (d.ts 1943) and no `postedAgo` — the age
string the old editor wrote is a *quest-definition* field, which is the path we
have fenced. So backdating on the API path means posting a tweet whose
`sendedAt` is a timestamp computed from the in-game clock
(`sdk.Time.date()` minus "1 month").

**P-01a (2026-09-18, build 25388883): green.** All three spellings of
`sendedAt` read back as **"a month ago"** — ISO with milliseconds, ISO without,
and `YYYY-MM-DD HH:mm:ss` — while the control with no time at all read "a few
seconds ago". So the engine keeps the time we send and stamps one only when we
send none. **The runtime sends ISO with milliseconds**, computed from
`Time.date()`. The lived-in profile is possible on the API path; the fence
against the declarative `Tweets` field stays.

**P-01b: newest first.** `qe24 twotter order` (harness 1.0.13) posted three
tweets whose time order and posting order disagreed (A two months back posted
first, B untimed posted second, C a month back posted third); the profile read
**B, C, A** top to bottom on 2026-09-18. So the display sorts by time and
ignores posting order, and the editor's preview mirrors that. One discrepancy
kept on the record: the Journalist's Sister transcription reads as
oldest-at-top, which is prose about hardcoded content in an earlier build — the
probe measured the build and the call we ship against.

Both probes shipped as harness-only patches (no editor change, no risk to the
project), and the checklist is
[`reference/sdk-0.24-qa/P-01-BACKDATE.md`](../../reference/sdk-0.24-qa/P-01-BACKDATE.md)
— which mod (the **raw harness `mod/`, 1.0.13**, *not* the editor export), which
account (`qe24_probe`), the exact commands, and what to report back. In-game the
same instructions are two steps away: `qe24 twotter guide` carries steps 9 and
10. Harness tests drive both commands, and both were falsified: drop the
`sendedAt` from the P-01a payload, or post P-01b's three tweets in time order,
and the matching test fails.

The r185 editor export stays **1.0.13**.

## 6. Migration: old drafts get their tweets back

`src/schema/migrate.ts` currently *drops* every `comms.tweet` node, its wires and
the quest's `twotterAccounts`. That was right when the feature was gone and is
wrong the moment it returns — somebody's r30 draft would open with its tweets
silently deleted. So `dropTwotter` becomes `mapTwotter`:

| Old | New |
| --- | --- |
| quest `twotterAccounts[]` | mod-level accounts, fields mapped 1:1 (`displayName` splits into the display-name field) |
| `comms.tweet` node | the same node id, one **row** in the Tweets list |
| `content`, `image`, `likes` / `comments` / `shares` / `views` | that row's content, picture and counts |
| `postLive: true` | **When the story arrives** |
| `postLive: false` | a row that is already on the profile — the quest-declared behaviour it had |
| `timeMode: "relative"` + `postedAgo: "2 days"` | **Earlier**, amount `2`, unit days |
| `timeMode: "absolute"` + `postedAt` | **Earlier**, `1 month`, plus one line in the export report naming the node: a fixed real-world date cannot survive as an age without the editor reading today's clock, and the editor does not do that. The author picks the age they meant. |
| `showInTimeline` | the row's toggle |

Tests pin the mapping against a realistic pre-r31 project file, and the QA folder
gets that file as a fixture so the row is one editor look — same method as
S-12/S-15.

## 7. The whimsy — your correction folded in

**Built in r188.** What shipped, and the two places it deliberately does less
than this list:

- the canvas card is the normal card (`@handle`, then `N tweets, oldest first —
  “the oldest line” <age>`), so it says what the node holds without pretending to
  be a profile;
- the **panel** is where the click-to-edit profile lives: banner, avatar with its
  ring, display name, `@handle`, bio and the blue check are all click-to-edit in
  place, both pictures open their picker, and the panel also lists **what the
  account has posted across every quest** — the only place two quests' posts from
  one handle can be read side by side;
- the **node inspector** shows the same profile **read-only** (an account is
  shared, so it is edited in one place) with the tweet timeline under it, newest
  first, each row wearing its age chip, counts and a `timeline` tag when it also
  drops into the main feed. "Edit this account" opens the panel; the rows
  themselves stay in the list below, oldest first;
- **one** CSS shimmer sweeps the arrival row, dropped under
  `prefers-reduced-motion` (a test reads `src/index.css` and asserts the block);
- **pictures are left out of both previews** — the SDK has no picture field on a
  tweet (§10), so a preview that drew one would be lying. A row that still
  carries a picture from an older draft says so instead.

The Node Reference sheet's own account now wears a banner and an avatar, so the
feature demonstrates itself the moment the template is opened.

- **The canvas card stays a normal card.** Same frame, same typography as its
  neighbours; it shows the bird icon, the `@handle`, and either the single
  tweet's first line or "N tweets" when it holds a history.
- **The mock profile, click-to-edit** (your idea) lives in the **Twotter
  panel**, because that is where an account is authored: banner across the top,
  avatar with a ring, display name, `@handle`, bio, and the verified check —
  click any of them and it becomes the field, type in place, press away. Pictures
  open the picker they already had. It is a *preview* of the real thing (the
  game's own profile is the truth), and it says so in one line.
- **The node shows the same profile read-only** over its tweet timeline, with
  the accounts as they are: avatar, `@handle`, then each row rendered as a tweet
  — content, picture, counts — with the age chip the author chose ("1 month
  ago"). **The preview shows the game's order (newest first)** with one line
  saying so, while the list below it stays chronological: what the author writes
  and what the player sees are both visible, and the difference is explained
  rather than surprising. A "Edit this account" link jumps to the panel.
- **One CSS-only flourish**: a brief "posting" shimmer on the tweet that is set
  to arrive with the story — no per-frame work, and it drops under
  `prefers-reduced-motion`, exactly like the clock's breathing colon.

## 8. The QA round it will need

First the probe, then the editor rows. Rows are in the QA folder next to the
Twotter probe's, which is where the tester already looks:

| Row | Check |
| --- | --- |
| ~~**P-01a**~~ | **Green 2026-09-18** — backdated tweets keep their time; all three spellings read "a month ago", the control read "a few seconds ago". Section 5. Results: [`P-01-BACKDATE.md`](../../reference/sdk-0.24-qa/P-01-BACKDATE.md). |
| ~~**P-01b**~~ | **Green 2026-09-18** — a profile sorts by time, **newest first** (`B, C, A`). The preview mirrors it. |
| **T-08** | An authored account appears in search with the authored bio, avatar, banner and follower counts. |
| **T-09** | A **series** reads as lived-in: the ages are the ones authored, the order is the game's (**newest at the top**, ties in list order), the picture is on the right tweet, and the log has **no** moment.js line (the old blemish). |
| **T-10** | Save, quit, reload mid-story: no duplicate account, no duplicate tweets, and an edited bio arrives. |
| **T-11** | Complete and abandon: our accounts and posts are gone, the handles leave search, and search still works. |
| **T-12** | Two quests share one account: finishing the first leaves it alone while the second is live; finishing the second removes it. *(your rule, verified)* |
| **T-13** | A **When event** trigger on `Twotter.PostSeen` fires when the player opens our account's post; `Twotter.Post` is recorded as firing or not (expected: not). |
| **T-14** | A pre-r31 draft opens with its tweets intact (the migration fixture). |
| ~~**T-15b**~~ | **Red 2026-09-19 — the row was wrong, not the mod.** Uninstalling by deleting the mod from disk leaves the account and its tweets in the save: the SDK documents that accounts a mod adds are *"not removed when the mod is uninstalled"*, and a mod deleted while the game is closed never loads, so `OnModPackageUnloaded` cannot run. Question 11 filed. |
| ~~**T-00**~~ | **The precondition every row now states (r193):** the editor export must be **enabled** in the Mods list. The game can keep a mod disabled across a newer version, a folder deletion and a fresh save (question 13) — a silent no-load that cost two sessions. `qe24 run …` and `qe24 twotter audit` now print `Editor export: loaded (v…)` or `NOT LOADED in this session`. |
| **T-15c** | Uninstall the way the game allows it: disabling a mod in the Mods list only *queues* the change — the game answers **"Mod changes detected. Restart the game to apply updates."** — so the only moment the cleanup hook can run is the **shutdown after that disable**, while the mod is still installed. Run tw1, save, quit to desktop, then **search the session's `HACKHUB LOG FILE`** for `[quest-editor]` (expect `unloading: removing the Twotter accounts this mod declared` and `twotter: removeUser(...) -> true (mod unloaded)`), then remove the export and relaunch: the handle must be gone from `qe24 twotter audit` and from search. The log says whether the cleanup ran, the audit says whether it stuck — and if the hook runs but the account survives, that is the story: a save the player made earlier can never be rewritten. |
| ~~**E-01**~~ | **Green 2026-09-19** (screenshot). Two follow-ups, both built in r189: the blank picture areas now say the game draws its own, and a blank display name is nudged. |
| ~~**T-08b**~~ | **Green 2026-09-19** — "banner is bright violet, profile is amber". The r185 banner wrinkle is closed. |

**These rows are runnable now** — the fixtures, the quests and the command all
exist, and every step is written out in
[`STATUS.md`](../../reference/sdk-0.24-qa/STATUS.md) *Open: the Twotter editor
rows*: which mod (editor export **1.0.20**, beside raw harness **1.0.18**), the
account (`qe24_editor`), the commands (`qe24 run tw1`, `qe24 run tw2`,
`qe24 twotter audit`, `qe24 run clear`) and what to report per row. The QA
project carries the pair of quests that share the account (T-12), the five-tweet
backdated series (T-09), the two event triggers (T-13) and the authored
avatar/banner (T-08); T-14's draft is
`projects/fixture-r30-twotter.project.json`. The export test guards all of it,
so a fixture cannot quietly rot out from under a row.

Plus one new harness command — **`qe24 twotter audit`** — built in the same
round: it lists this round's handles, says which are on the save, and flags the
poison shape (a `bio` that is present and `undefined`) on any of them. The
harness cannot enumerate a save (SDK 0.24 has no "list every account" call), so
it audits the handles this QA round creates: the harness's own three plus the
export's `qe24_editor`. The probe could only test the one record we planted; the
audit is what a tester reads after a completion to say whether the account
really left, and it is what the T-10/T-11/T-12 rows report.

## 9. Scope, stages, and what could slip

- **P-01a and P-01b (harness only):** both **shipped and answered green**; the
  result tables are in
  [`P-01-BACKDATE.md`](../../reference/sdk-0.24-qa/P-01-BACKDATE.md). Nothing is
  waiting on them.
- **Stage 1 (functional):** accounts panel + schema + migration, the node and its
  list, runtime create/post/cleanup, the fences and their tests, the QA export
  and rows — **all built**; the rows are the part a tester still has to run.
- **Stage 2 (the whimsy):** the click-to-edit mock profile, the node's timeline
  preview, the card summary, the shimmer — **built in r188**, with 14 new tests
  (9 of the 10 fences falsified; the tenth, the tie-order rule, cannot be
  falsified through behaviour because JS sorts are stable, and says so in the
  test file). The visual pass is Zeis's, row **E-01**.

If anything slips, stage 2 is what moves — the feature is complete without it.
The manual is regenerated for both; stage 2 adds the design notes.

**What cannot be tested here:** whether the game's profile renders our authored
avatar/banner sizes, how it spells an age the engine computed itself, and
whether the timeline flood is pleasant. jsdom cannot see any of it — those are
T-08/T-09's "paste what you see" lines, handed to you.

Stamp: `EDITOR_BUILD r193`, QA export **1.0.20**, harness mod **1.0.18** (1.0.13
was P-01's, 1.0.14 the first editor-row run and 1.0.15 the r186 fixes — every one
of them handed to Zeis and run, so each round of fixes is a new version rather
than a quiet edit of a build he has already tested. r187 changed only the
editor's picture control and the fixtures' colours; the harness number moved so
the tester's build and this one cannot be confused).
