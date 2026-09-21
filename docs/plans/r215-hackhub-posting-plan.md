# r215 (plan) — Hackhub quest posting: expose the start route in the editor

**Status: for review — nothing implemented yet.**

Zeis's ask: the editor should be able to post a quest onto the Hackhub feed
natively — with the usual identity inputs (dice-generated or game-generated
poster name, uploaded or game-generated avatar) — because the game
auto-generates a persona for the poster when the author supplies none. His
instinct on shape: "tied in with the Quest finish node, or its own node to
start, or its own section — unsure". This plan resolves that with the
evidence.

## What already exists (recon, 2026-09-21)

- **Schema — rich and ready.** Quest-level `hackhubPost`
  (`src/schema/project.ts:153`): `content`, `media`, `authorName`,
  `authorAvatar`, `likes`, and a full `comments[]` list (per-comment
  `authorName`, `authorAvatar`, `content`). Round r166 built this against the
  SDK declarations.
- **Runtime — maps it, but drops every avatar.** The quest constructor sets
  `this.HackhubPost` (`runtimeSource.ts:2897`) with `{ content, media?,
  author: { name }?, likes?, comments: [{ author: { name }, content }] }` —
  `authorAvatar` (post **and** comments) is read from the schema and then
  thrown away.
- **Compiler — already knows the route.** An info warning points authors at
  it ("claims this one from its Hackhub feed post"), and the probe quests
  used `hackhubPost` as their claim route three times.
- **Game evidence — the route works, with a wrinkle.** The 1.0.38 run: the
  post **rendered** on the feed and Zeis accepted it from there; the poster
  showed a game-generated persona ("Kristina Kaczmarek", rainbow drawn
  avatar) because the probe set no author fields — proof the blank =
  game-generated behavior Zeis remembers is real. But the post **never
  rendered again** (1.0.39, 1.0.40), both times on a fresh save. Leading
  theory: the game remembers claimed quests at **profile** level (same
  behavior class as "accounts outlive a disk-deleted mod"), so a quest name
  that was ever claimed never shows its post again. **Must be verified with a
  fresh quest name before we build on it** — if confirmed, the workaround is
  "a new post needs a new quest name per profile", documented, and possibly a
  developer question.
- **Chaining — deliberately not a feed post.** r136 chose the deterministic
  `fx.claimQuest` node for mid-story chaining ("complete A → B starts"),
  precisely because feed posts are registration-time data and the feed is
  player-facing. No runtime posting API is in evidence in the SDK, so
  "post to the feed when a quest finishes" is not a node we can build — the
  finish node keeps claiming quests directly, and the feed post is the
  organic discovery route for quests the player hasn't reached yet.

## The shape (answering "node, section, or finish node?")

**A section on the quest** — Zeis's third guess, and the one the data model
already made: `hackhubPost` is quest-level registration data, exactly like
`autoStart`, `hasCompleteButton` and `employer`. It lives in the quest
settings panel next to those.

Contents of the section:

1. **"Post this quest to the Hackhub feed"** toggle (presence of
   `hackhubPost` = on; the enable state IS the field).
2. **Post text** (textarea — the feed body; `{{tokens}}` should work like
   everywhere else an author writes text — verify the fill path covers
   HackhubPost.content at registration).
3. **Poster name** — text + dice (`fullName` generator exists in
   `src/lib/generate`), blank = game-generated (proven in game).
4. **Poster avatar** — the editor's existing image-upload field (the kind mod
   icon/cover use), blank = game-generated drawn avatar (proven in game).
5. **Likes** (number, cosmetic — same rationale as the Twotter node's
   likes/comments fields).
6. **Comments** — the schema carries them; if the list-field pattern makes
   them cheap, include (per-comment name/avatar/text); otherwise phase 2.
7. Optional **post image** (`media`) — same image field; phase 2 if it
   complicates the first cut.

**Node-side change (runtime fix):** pass the avatars through —
`author: { name?, avatar? }` and per-comment avatars — after re-checking the
declared shape the r166 mapping was built from. The game demonstrably renders
drawn avatars, so ours should reach it.

## Folded in: the last mail bug (found while answering "anything left?")

The mail node's **To field is dead on the quest graph path**: the schema has
it (`MailNodeData.to`), the sim shows it ("Leave blank to send it to the
player"), but the `Mails[]` builder and `sendQuestMail` never read it —
graph mails always go to the player's address. Fix: honor `d.mail.to` when
set (fallback: the player's email, as today), same in the pin. That closes
the mail round completely; everything else measured works (replyable, reply
recipe, withdrawal, bounce, remove/persistence), and the remaining mail items
are developer questions (docs/03 §16/§17) plus the declined `qe24 mail sweep
now` proposal.

## Order of work

1. **In-game verification first** (needs one short Zeis session, or rides the
   round's playtest): a fresh save + a probe post under a **fresh quest
   name** — does the post render? This decides whether feed posting is
   reliable or profile-scoped, and everything in the UI is worth building
   either way — but the documentation and any developer question depend on
   it. (Can run in parallel with the editor work; the editor work does not
   block on it.)
2. Editor: the quest-settings section + image/dice fields (A).
3. Runtime: avatar passthrough + the mail `to` fix (B), with tests.
4. Export regen (probe gains a visible post under a fresh name for the
   test), stamps, docs.
5. Playtest checklist: post renders with author fields blank (game
   persona), with dice name + uploaded avatar (ours), accept from feed,
   quest runs; mail `to` delivers to the set address.

## Falsification sketch

UI: toggle off strips `hackhubPost` from the project; dice writes a name;
blank stays blank (no phantom defaults). Runtime: avatars present in
`HackhubPost` when set; absent when not; mail `to` reaches `Mail.send`;
default still the player. Each guard mutated → red → restored.

## Open questions for review

1. Comments and post image in the first cut, or phase 2? (Recommendation:
   include comments — the schema and the list pattern are both ready; image
   phase 2.)
2. Build the editor side now and let the fresh-name feed test ride the
   playtest at the end (recommended), or wait for the in-game verification
   first?
3. Fold the mail `to` fix here (recommended — it is small and closes the
   mail round) or split it into its own tiny round?
