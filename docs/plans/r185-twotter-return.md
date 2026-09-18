# r185 (plan, for review): Twotter comes back

**Nothing in this document is built yet.** It is the design for your review, per
the standing rule that plans come first.

## Why it can come back — the evidence, not the hope

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

**The rule that follows from that table:** author accounts through
`createUser`/`addUser`, never through the declarative `TwotterAccounts` field —
that field is the crash path, and it is the one thing the engine still writes
incompletely.

## What the feature is

Three parts, in the order they matter to an author.

### 1. Twotter accounts — a mod-level section, not a quest field

Today a mod is: quests + websites. Accounts join that list, because an account
is world-building (a character who exists in the fiction) rather than a beat of
a story, and the same account is meant to be usable by several quests.

| Field | Notes |
| --- | --- |
| **Handle** | `@` is part of the control, not something to type. Validated like the game does it: letters, numbers, `_`, 3–15 characters. This is what search matches on, so it gets the strictest validation in the editor. |
| **Display name** | One line; the game splits it into first/last for its own display. |
| **Bio** | Multi-line, tokens allowed (`{{player}}` reads well in a bio). **Always written as a string** — see the fence below. |
| **Avatar**, **Banner** | The image picker that already exists (the game shows both). |
| **Verified** | Toggle — the blue check. Authors ask for it for official-looking accounts. |
| **Followers / Following** | Numbers; `createUser` takes them, and a brand-new account with 0 followers reads as fake in a screenshot. |
| **Remove this account when the quest ends** | Default **on**. Turn it off for a character who should outlive the quest — the trade-off is written on the field ("the account stays in the player's save; we will not clean it up"). |

Deliberately **not** exposed: the account password (the engine generates one;
nobody logs in as an NPC) and `isMine` (that flag means "this is the player" —
authoring it would be a lie).

### 2. Post tweet — one node, with the two things the old one got wrong

The node keeps the id `comms.tweet`, so drafts written before r31 map onto it
instead of being dropped (section 4).

| Field | Notes |
| --- | --- |
| **Account** | A picker over the mod's accounts — by handle, not by an opaque id. |
| **Content** | Multi-line, tokens allowed. This is the tweet body. |
| **Posted** | **When the story arrives** (default) or **Already on the profile**, with an amount + unit ("2 hours ago", "3 days ago"). The old `postedAgo` string was what produced the moment.js warning in the log; we compute a proper timestamp from the in-game clock instead, so the profile reads "2h" and the log stays clean. |
| **Likes / Comments / Shares / Views** | What the profile shows. Sensible defaults, all four editable. |
| **Show in the timeline** | Toggle (`showInTimeline`). |

The clean-up rules on the runtime side, which is where the old version was
worst:

- **Post once per playthrough, per node.** The flow re-runs on a save reload
  (r177's lesson), so the runtime records which nodes have posted and skips them
  the second time.
- **Remove what we posted.** On quest complete or abandon, the tweet is removed
  with `removeTweet` — the old build's own warnings admitted it "leaves posts
  behind when the mod is removed". Now it does not.
- **Fail open.** A build without the Twotter API logs one line and the story
  carries on; no node ever blocks on it.

### 3. Reacting to Twotter — nothing to build, one thing to say

The generic **When event** trigger already offers all six Twotter events (they
are in the event catalogue), so an author can react to `PostSeen`,
`ProfileSeen`, `AccountLogin` and friends today. What they cannot know from the
editor is which of those our own accounts can actually raise:

- `PostSeen` / `ProfileSeen` — **verified working**.
- `AccountCreated` — **does not fire for accounts we add** (probe finding). The
  picker will say so, so nobody builds a beat on it.
- `Post` carries `{questId, tweetIndex}` — an index into *the quest's declared
  tweets*, the path we are not using. Expect it not to fire for our posts; the
  QA row checks it.
- `AccountLogin` / `AccountLogout` are about **the player's** account, not an
  NPC's.

## The fences — what stops r31 happening again

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
   gone, unless the author turned the removal off.
4. **Idempotent across reloads.** Creating adopts an existing handle
   (`getUserByUsername`) instead of duplicating, and refreshes the
   author-controlled fields with `updateUser` — so editing the bio in the editor
   updates the account on the next load, which is the repair the old report
   wished existed.
5. **No objectives or triggers on `AccountCreated`.** The event picker says so
   in plain words.

## Migration: old drafts get their tweets back

`src/schema/migrate.ts` currently *drops* every `comms.tweet` node, its wires and
the quest's `twotterAccounts`. That was right when the feature was gone and is
wrong the moment it returns — somebody's r30 draft would open with its tweets
silently deleted. So `dropTwotter` becomes `mapTwotter`:

| Old | New |
| --- | --- |
| quest `twotterAccounts[]` | mod-level accounts, fields mapped 1:1 (`displayName` splits into the display-name field) |
| `comms.tweet` node, `content`, `accountId` | the new node, account matched by the migrated account |
| flat `likes` / `comments` / `shares` / `views` | the four count fields |
| `postLive: true` | "When the story arrives"; `false` → "Already on the profile" |
| `postedAgo: "2 hours"` | parsed into amount + unit where it parses cleanly; the node's default otherwise, with one note in the export report |

Tests pin the mapping against a realistic pre-r31 project file, and the QA
folder gets that file as a fixture so the row is one editor look — same method as
S-12/S-15.

## The whimsy (your ask)

The Timer round's lesson was that a node's UI can *teach* the feature. Applied
here, in the editor's own dark voice:

- **A live tweet preview** in the inspector: the account's avatar, `Display Name
  @handle · 2h`, the content with tokens shown as chips, and the interaction row
  (likes · comments · shares · views) — so an author sees the tweet before
  exporting it. It repaints as they type; the "· 2h" follows the **Posted**
  choice.
- **Account cards** in the Twotter section: avatar with a ring, handle, the blue
  check when verified, follower counts — a small profile list rather than four
  text boxes.
- **The canvas card reads like a tweet**: `@handle` on the first line, the
  content clipped under it, the bird icon the editor already ships for it.
- **One CSS-only flourish** on the preview — a brief "posting" shimmer when the
  node is set to post on arrival — no per-frame work, and it drops under
  `prefers-reduced-motion`, exactly like the clock's breathing colon.

## The QA round it will need (T-08 … T-13)

Rows for the *editor* path, in the QA folder next to the Twotter probe's:

| Row | Check |
| --- | --- |
| T-08 | An authored account appears in search with the authored bio, avatar, banner and follower counts. |
| T-09 | An authored tweet appears on the profile at the right moment, with its counts and a clean log (no moment.js deprecation line — the old blemish). |
| T-10 | Save, quit, reload mid-story: no duplicate account, no duplicate tweet, and an edited bio arrives. |
| T-11 | Complete and abandon: our accounts and posts are gone, the handles leave search, and search still works. |
| T-12 | A **When event** trigger on `Twotter.PostSeen` fires when the player opens our account's post; `Twotter.Post` is recorded as firing or not (expected: not). |
| T-13 | A pre-r31 draft opens with its tweets intact (the migration fixture). |

Plus one new harness command — **`qe24 twotter audit`** — that lists every
account on the save and flags the poison shape (a `bio` that is absent or
`undefined`) on any of them, ours or not. The probe could only test the one
record we planted; an audit can tell a player or a developer instantly whether a
save is carrying the r31 shape.

## Open questions I would like answered before building

1. **Accounts at mod level, or per quest?** I am proposing mod level (one list,
   usable by every quest, with a per-account "remove when the quest ends"
   toggle). The alternative is the old shape — one list per quest — which reads
   more like "this quest's cast" but duplicates a character the moment two
   quests share them. *My recommendation: mod level.*
2. **Should a completed quest remove an account a *later* quest still needs?**
   My rule: it removes only what it created, and only when no other of our live
   quests declares the same account. Anything simpler breaks multi-quest mods;
   anything cleverer cannot be verified in this SDK.
3. **The `Posted` time** ("already 2 hours ago") — worth having at all, or does
   every tweet post at the moment the story arrives? I think the flavour is
   half the joke of a social network, and the timestamps are what the profile
   shows.
4. **The node's name.** "Post tweet" is the old one; "Twotter post" reads better
   in the palette next to "Post tweet"'s old home? *My recommendation: keep
   **Post tweet** — it is what authors called it before, and the migration keeps
   the wording honest.*

## Scope, stages, and what could slip

One round, built in two stages so you can see it working before it is pretty:

- **Stage 1 (functional):** accounts section, node, runtime create/post/cleanup,
  migration, fences, tests, QA export + rows.
- **Stage 2 (the whimsy):** the preview card, account cards, canvas card,
  the flourish.

If anything slips, stage 2 is what moves — the feature is complete without it.
The manual is regenerated for both, and stage 2 adds the design notes.

**What cannot be tested here:** whether the game's profile really renders our
authored avatar/banner sizes, and how it spells "2h" — jsdom cannot see either.
Those become T-08/T-09's "paste what you see" lines.

Stamp: `EDITOR_BUILD r185`, QA export **1.0.13**.
