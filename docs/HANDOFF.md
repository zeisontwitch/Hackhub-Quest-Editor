# Handoff — r218

**v3 failed flawless.** Fresh quest name, fresh id (the new-id button's first
field use), named employer + poster + commenter, all avatars extracted to
asset files, contract-clean author shapes, fresh save — the post still never
surfaced, and the player's own profile card is still avatarless. That empties
our side of the ledger: every export-side bug we could find (data-URI images,
empty comment authors) is fixed and verified in his zips. What remains is a
pattern, not a bug we can patch:

- **The only feed post that has ever rendered was bare** — the r211 probe
  (1.0.38): `content` only, no author, no comments. The game drew the persona.
- **Every post carrying an author block failed** — r215 (`author{name}` +
  data-URI avatar), v2 (`author{name}` only + blank comment), v3 (employer +
  `author{name,avatar file}` + named comment). Fresh names and ids each time.
- Claim memory (d.ts: a post shows only while the quest "hasn't been claimed
  yet") explains repeat absences, but NOT v3 — that name was never used.
- The held `Queue.HandleQuestHackhubPosts` job appears in every log, vanilla
  included; the player card breaks on clean saves while the auth gateway
  429s. All of it is filed: docs/03 **§21** (posts stopped surfacing), §19
  (API v2), §20 (blank comment personas).

r218's change is one honest sentence in the compiler's feed-post notice:
**the only shape we have ever seen render is a bare one** — strip to it (and
a never-used identifier) when a post refuses to show. Zeis's next run is
**H-10**: author exactly that shape, fresh name, fresh save. If it renders,
H-11 isolates the author block; if it doesn't, mod quest posts are dead on
1.3.1 and §21 goes to the developers with the full matrix.

---
# Handoff — r217

**The r216 retest failed clean — and that failure was the clue.** The export
carried the extracted asset, zero data-URIs, and the post still never
surfaced. Working the evidence backwards:

- The game log's two scary lines are old friends, not causes: the API v1
  compatibility notice and the held `Queue.HandleQuestHackhubPosts` job
  appear in every session we have on file, **including the vanilla run**.
- The SDK's own types (`index.d.ts`, 0.24.0) document the feed-post rule:
  the post appears only while the quest **"hasn't been claimed yet"** —
  per-profile claim memory is real and documented (explains the r211 probe:
  rendered once at 1.0.38, claimed, never again on any save). The d.ts also
  has **no `id` on quests** — the game knows quests by `Name`; our internal
  `q-blank` never reaches it (both of Zeis's r216 quests carried that
  invisible placeholder; the editor now shows the id with a confirmed reset).
- The one contract violation both failing quests shared: a **blank comment
  author**, emitted as an empty `author: {}` where the types require
  `author.name`. The only post that ever rendered had no comments. r217
  emits no author at all when the name is blank (and refuses an avatar
  without a name, post- and comment-level), withdraws the "leave blank for
  a generated name" placeholder on commenters, and pins it all with tests —
  the guard is falsified.

Zeis's retest: **give every commenter a name**, re-export, fresh save — H-01;
then the blank-comment experiment (H-08) and a fresh profile (H-09) as
controls. Filed for the developers: §19 (what is API v2? the SDK ships v1
everywhere) and §20 (does the game mint personas for blank comment authors?).

---
# Handoff — r216

**Zeis played the r215 round like a player, not a checklist — and it caught a
real compiler bug before any row could run.** His export reached the game
correctly (`hackhubPost`, author, a 228 KB data-URI avatar), but the feed
never showed the post and his own player avatar broke: quest-level images
shipped as inline data-URIs, which the game's feed cannot load. Mod icon and
cover were always extracted to `assets/*.png`; the quest slots never were.

**r216 fixes:**

- **Quest images are asset files now** — employer avatar, feed-post avatar
  and media, comment avatars, and the quest icon are extracted to
  `assets/q<n>-<slot>.png` with mod-relative paths in PROJECT (the path shape
  proven to resolve since r201). Verified against Zeis's own uploaded project:
  the export now carries `assets/q0-post-avatar.png` and a path reference.
- **The feed-post notice is info-level.** It painted the export dialog red
  ("Needs attention") on a CORRECT setup — Zeis flagged it; only a quest with
  no route at all stays error.
- **His player's-eye UI notes, all in:** Journal group gained its blurb (a
  regression against the every-field-explained rule); the comments list
  gained one plus a "Leave blank for a generated name" placeholder; the
  Hackhub block now lives **inside Behaviour**; the Employer section explains
  itself and its unverified relationship to the post's poster — which is now
  **H-06**, a measured row; the XP field says honestly that we have never
  seen XP in the game UI (it is SDK-declared: `Rewards.xp`).

Tests: the r215 avatar test re-pinned to asset paths (+ employer slot
guarded — its guard was falsified), a new good-to-know-vs-needs-attention
test; three mutations falsified (extraction off, level back to error,
employer slot removed). Gates: full suite, typecheck, build — green.
Stamps `2026-09-21.r216`.

**Zeis retests from scratch** (rebuild the post, re-export, fresh save):
[`../reference/sdk-0.24-qa/QE24-Playtest-HackhubPosting.md`](../reference/sdk-0.24-qa/QE24-Playtest-HackhubPosting.md)
— H-01…H-05 as before, **H-06** employer-vs-poster, **H-07** the player card.

---

# Handoff — r215

**The Hackhub feed is authorable, and the last mail bug is closed.** Zeis
approved the plan with three additions, all in: likes + comments (modeled on
the Twotter node's fields — the game almost certainly reuses that machinery),
a cleanup route (verified impossible — no removal surface exists; requested
as docs/03 **§18**, which also records his feed-Complete-button note), and
the Twotter-reuse hunch (the Employer/post author shapes mirror each other;
the employer section gained its missing avatar field).

Shipped:

- **Quest settings → "Hackhub feed post"**: toggle (off ships nothing), post
  text, poster name (dice `fullName`), poster avatar (the mod-icon upload
  component), likes, comments (name + optional avatar + text, add/remove).
  Blank anything = the game's generated persona — the r211 run proved the
  game draws "Kristina Kaczmarek"s for blank fields, and the section says so.
- **Runtime**: `HackhubPost.author`/comment authors now carry `avatar` (the
  schema had it since r166; the runtime dropped it). Empty author fields
  produce an empty/absent author — never `undefined` rendered.
- **Mail To fixed**: the node's To address wins on the direct path and rides
  `sendMail(index, from, to)` on the fallback; blank still means the player.
  The `Mails[]` journal copy keeps `to` too.
- Manual: the Quest settings guide gained the feed-post section; the
  coverage gate caught two wording issues on the way in (broken anchor,
  "API" jargon) and they are fixed.

Tests: 5 new (3 UI, 2 runtime pins), 3 mutations falsified (avatars dropped,
to ignored, toggle-off keeps post) — all red → restored. Gates: 1,795 tests /
89 files, typecheck, build.

**Zeis's checklist** (authored in the editor this time — it dogfoods the UI):
[`../reference/sdk-0.24-qa/QE24-Playtest-HackhubPosting.md`](../reference/sdk-0.24-qa/QE24-Playtest-HackhubPosting.md)
— H-01 the post renders with OUR avatar (the one thing jsdom cannot see),
H-02 likes + drawn commenter avatar, H-03 the feed Complete button, H-04 the
once-claimed-post mystery on a second save, H-05 the mail To address.

---

# Handoff — r214

**The mail-authoring playtest ran green; the round is closed and nothing is
open.** Zeis's run on a fresh save (export 1.0.40, harness 1.0.26,
`qe24 run mailauth`), transcript:
[`../reference/sdk-0.24-qa/QE24-TestResults-MailAuthoring.md`](../reference/sdk-0.24-qa/QE24-TestResults-MailAuthoring.md):

- **W-01 green** — three mails, objective stayed open, `Mail.send [replyable]`,
  withdraw armed (id `MaGUHssZcU`).
- **W-02 green — the headline:** replied "asdfef" and
  `objective "send-a-reply" completed by Mail.Sent`. The **to = From reply
  recipe is proven on an editor-authored quest**.
- **W-03 green** — the quest self-completed and the drain fired exactly once:
  `cleanup: Mail.remove(MaGUHssZcU "QE24 authoring: withdraw me") -> true`,
  then `quest completed by Complete quest node`.
- **W-04 green** — after save → quit → reload the withdrawn mail stayed gone;
  the keep-me control and the reply mail remained.
- **W-05 closed on prior evidence** (same drain on the abandon reason,
  measured in game in r209/M-07; covered by tests).

The end-of-run `already completed (in-memory)` WARN is by design. Wrinkle
recorded, not blocking: the probe's **Hackhub feed post never surfaced** in
either attempt — the terminal claim worked both times; watch the next
feed-post quest before filing a developer question.

QA folder: **NOTHING OPEN** (STATUS banner restored). README's In-progress
mail row moved to Closed. Remaining mail work lives with the developers
(docs/03 §16 `repliedTo`, §17 inbox subjects) plus the proposal-only
`qe24 mail sweep now`. Editor stamp → `2026-09-21.r214` (docs + regen only;
no runtime changes this round — 1,790 tests unchanged).

**Next up, Zeis's call:** the remaining In-progress row (SDK 0.24 follow-ups —
phone-proxy/eavesdrop queue), templates, or a new direction.

---

# Handoff — r213

**Zeis's real W-01/W-02 run: green — and it flushed out two more bugs.** The
r212 fix held in game (objective stayed open until he replied), and the reply
recipe **ticked in game**: `objective "send-a-reply" completed by Mail.Sent`
after a reply to the probe mail — the to=From rule is now proven on an
editor-authored quest. His findings, and what was done:

1. **No Complete button (W-03 untestable).** The first probe had no ending:
   `hasCompleteButton` defaults **off** (docs/04's r87/r88 crash-era defaults)
   and the probe wired nothing else — fixture bug. Fix: the probe now ends
   with a terminal **Complete quest** node on the objective's done wire (the
   editor's own completion path since r169), not the journal button.
2. **That fix exposed runtime bug #2:** plain flow arriving at an objective
   followed its **done** wire immediately (`flowOuts` cannot tell a done wire
   from an out wire), so the quest completed itself at START. r213: flow
   **stops** at trigger-carrying objectives — no tick, no done-follow; the
   listener runs the done wire when the event matches. Plain objectives
   unchanged (arrival is their completion).
3. Verified end-to-end against the compiled 1.0.40 artifact with a stub
   engine: hostile payloads match nothing; a reply-shaped event ticks the
   objective, completes the quest, and drains exactly one `Mail.remove` of
   the armed withdraw id. Guard falsified by disable → red → restore.

Also found and fixed on the way: the probe splice script silently wrote stale
content (mutated the parsed object, wrote the pre-mutation text — the
"verification" checked presence, not shape). Project writes are now
write-once from the parsed object with disk re-reads asserted.

Export **1.0.40** (probe v2 + r213 runtime), stamps `2026-09-20.r213`.
**Zeis:** swap the export folder, abandon the stuck 1.0.39 quest (its
withdrawal arming was session-scoped — the old *withdraw me* mail staying is
the documented M-08 limit, not a bug), then `qe24 run mailauth` and W-01
through W-04 on the checklist (W-03 now self-completes; no button).

---

# Handoff — r212

**The first W-01 attempt found a real editor bug, and it is fixed.** Zeis
accepted the probe quest and its one objective completed itself instantly,
before any mail could exist. Diagnosis against the compiled export (a stub
engine replaying the exact artifact) pinned it in our runtime, not the probe
and not his save:

- The flow runner's `case "objective"` ticked **every** objective the story
  flow stepped into — including objectives that carry a trigger event. The
  probe wires `reply → objective` (the natural authoring shape, and the Bad
  Attachment template's own wiring), so the objective pre-completed before
  the Mail.Sent trigger could decide anything. The case's own comment even
  said trigger objectives complete "via the SDK declarative trigger instead"
  — the code just never checked.
- **Fix (r212):** the runtime now computes `objectivesWithTriggers` and skips
  flow-ticking for those; the trigger (engine declarative + our own
  condition-checked listener, both verified attached) completes them. Plain
  objectives keep their flow-tick. The same latent bug shadowed every
  template with a trigger objective reached by flow (Bad Attachment, Byline,
  Cold Call, Cold Storage) — all repaired by the one guard.
- Falsified by removing the guard (regression test red), restored green. New
  regression test replays the probe's exact shape: flow reaches the
  objective, the quest's own echoed Mail.Sent does not match, a reply-shaped
  event does.

Export **1.0.39** (project version bump only; the runtime fix rides in it).
Stamps → `2026-09-20.r212`. Gates: full suite green (see commit), typecheck,
build.

**Zeis: swap the export folder to 1.0.39 and start again from W-01** —
[`../reference/sdk-0.24-qa/QE24-Playtest-MailAuthoring.md`](../reference/sdk-0.24-qa/QE24-Playtest-MailAuthoring.md)
has a history note. Nothing else changed in the checklist.

---

# Handoff — r211

**The M-answers are editor features now.** Three changes, all evidence-pinned:

1. **Replyable mail goes out direct.** `runtimeSource.ts` sends
   `Mail.send({ …, replyable: true })` first — the path M-04 proved draws the
   Reply button — and captures the returned **id**. `Quest.sendMail` (void,
   M-07) is the throw-fallback only; the old "no Reply button will appear"
   warning is gone with the assumption it repeated.
2. **"Withdraw the mail when the quest ends"** — new toggle on the mail
   branch (`withdrawOnQuestEnd`, default **off**: a story mail is content).
   Armed at send time with the id, drained by the existing `questCleanup`
   machinery at complete and abandon (M-07's proof), logging
   `Mail.remove(<id> "<subject>") -> <bool>`. No id (fallback path) logs
   honestly that the mail stays.
3. **The guidance now teaches the real rule**: a reply is matchable only by
   `to` = the mail's From address (M-05/M-06) — the compile warning names the
   From and the `Mail.Sent`-on-`to` recipe, a second warning fires when
   replyable is ticked with an empty From, and the `Mail.Sent` catalogue entry
   and the node's toggle help carry the same sentence. No new trigger
   machinery: the editor has authored `to`-contains conditions all along.

QA export **1.0.37** regenerated (schema-only; the QA project data has no
replyable mail node). Editor stamps → `2026-09-20.r211`. Field count stays
**160** — the mail branch is edited through its sim, which the manual count
does not enumerate. Five mutations falsified (direct flag, arming, drain case,
warning recipe, ledger). 1,789 tests / 88 files green; typecheck + build clean.

**The playtest probe shipped with the round:** quest `QESdk024MailAuthoringQa`
in export **1.0.38** (claimed from its Hackhub feed post, or `qe24 run
mailauth` on harness 1.0.26), checklist in
[`../reference/sdk-0.24-qa/QE24-Playtest-MailAuthoring.md`](../reference/sdk-0.24-qa/QE24-Playtest-MailAuthoring.md),
rows W-01…W-05 open in STATUS.

**For Zeis to playtest** (jsdom cannot see these):
1. an editor-authored replyable mail draws its **Reply button**;
2. replying fires a `Mail.Sent`-on-`to` trigger and ticks the objective;
3. a withdrawn mail leaves the inbox at quest end — complete **and** abandon —
   and stays gone after a reload (M-03 says it will).

---

# Handoff — r210

**The mail rows ran; all ten are answered, and three findings went to the
developers.** The session transcript is in the repo now:
[`reference/sdk-0.24-qa/QE24-TestResults-Mail.md`](../reference/sdk-0.24-qa/QE24-TestResults-Mail.md),
verbatim from the test dump. The verdicts, compressed (full versions at the top
of [`../reference/sdk-0.24-qa/STATUS.md`](../reference/sdk-0.24-qa/STATUS.md)):

- **The Reply button draws on both paths.** Direct `Mail.send({ replyable:
  true })` (M-04) and the quest path the editor ships, `this.sendMail(0)`
  (M-06). The runtime's "no replyable flag" assumption is disproved — but note
  the direct path is the only one that returns an **id**, which is the cleanup
  handle.
- **A reply carries no `repliedTo`.** Raw payload: `{"id":"d5eRUBLmJ6","from":
  "bkelso@gomail.com","to":"qe24-direct@qe24.test","subject":"(Reply)",
  "content":"asdf","sentAt":1789902205922}`. The reply is matchable only by
  **`to` = the original's `from`** (the mail quest's objective ticked on
  exactly that). Filed as docs/03 **§16**.
- **`getInbox()` entries have no `subject`** on 1.3.1 (M-01/M-07: ids fine,
  subjects absent). The r209 sweep matched by subject and never fired — it now
  matches the probe's **from** addresses. Filed as docs/03 **§17**.
- **Unload cleanup is refused** (M-08): `OnModPackageUnloaded` fires correctly
  at the next game start, but every gated call from it is refused
  `Mod "null"` (`Mail.remove`, `Mail.getInbox`, `Http.*`), while un-gated
  `Twotter.removeUser` ran. The SDK's own unload-cleanup advice is unreachable
  on 1.3.1 — quest-end cleanup **works** (`OnAbandon` sweep, `-> true`),
  so that is what the editor authors. docs/03 **§14** amended (dated).
- M-02/M-03: `remove` returns `true`/`false`, works on a never-read mail, and
  the removal survives save → quit → reload. M-10: `sendBounce` draws a real
  mailer-daemon bounce (550 quoted). M-09: the `moment` warning fires on a
  **clean save with no mods** — the game's own tweets, never mod mail; the
  README roadmap row is closed.

**The r199–r205 probes are retired** (Zeis's ask — their black widget and
start-menu entries were still on his desktop). Harness **1.0.25**: the
clickprobe and the extras on/off/lang/say verbs are excised;
`qe24 extras cleanup` sweeps all **14** QE24 registration ids the project ever
used (two origins: the raw probes' own ids and the QA export's surfaces);
`qe24 extras <anything else>` prints a retired notice; the widget file is
deleted. The QA export is **1.0.36**: its project data carries **no extras and
no translations** and no `QESdk024ExtrasQa` quest — a runtime registration pass
reads empty arrays and adds nothing. **Zeis should run `qe24 extras cleanup`
once and replace the old export folder**; then the desktop is clean.

**The probe's own fixture took two fixes the run exposed:** the quest now has
exactly **one** objective (r209's untickable reminder hid the Complete button —
the r185 canary lesson again), and every sweep matches by from, never subject.
Tests updated throughout: the scaffold pins 1.0.25/from-matching/single
objective/the retired verbs, the harness test lost its pack-extras describe
(13 tests) and gained the cleanup pair; five mutations falsified. Full gates
green: 1,786 tests / 88 files, typecheck, build.

**Next:** the mail **authoring** round (README In-progress #1) — plan first, as
always. The design facts it starts from are the M-answers above. The stale
editor spots to revisit: `runtimeSource.ts`'s replyable routing (~:1367–1401)
and `compile.ts`'s warning (:531–536).

---

# Handoff — r209

**The mail probe is built and waiting on one batched session.** Plan:
[`plans/r209-mail-qa-plan.md`](plans/r209-mail-qa-plan.md) (approved, with
`Mail.sendBounce` added as row **M-10**). SDK 0.24 declares
`Mail.remove(id): boolean` and `replyable` on `MailDefinition` — BUG 9's answer,
in the declarations — but three claims need in-game evidence before the editor
authors any of it, and reading found all three:

1. **`repliedTo` is promised but undeclared.** `MailDefinition.replyable`'s doc
   comment says the reply raises `Mail.Sent` *with a `repliedTo` field* — and
   `MailEvent`, the declared payload, has no such field. M-05 logs the raw
   payload (`qe24 mail watch on`), and its answer decides whether a quest can
   match a reply to its own mail at all; if it cannot, that is a docs/03
   developer question before any authoring round.
2. **The editor's replyable path stands on a stale assumption.**
   `runtimeSource.ts` still routes replyable mail through `Quest.sendMail`
   "because `MailDefinition` has no replyable", and `compile.ts`'s author
   warning calls that "the only path that carries a reply flag" — both stale
   against 0.24. Nothing changed yet on purpose: M-04 (direct
   `Mail.send({ replyable: true })`) and M-06 (`this.sendMail(0)`) decide which
   path actually draws the Reply button, and the authoring round follows.
3. **The cleanup prescription is unmeasured.** Remove-before-ever-read (M-03 —
   delivery is queued, per BUG 10), removal persisting across a reload (M-01's
   second half, M-03), the quest-end sweep (M-07) and the
   disable-then-restart unload hook (M-08, T-15c semantics).

**What shipped — raw harness 1.0.24 only.** A `qe24 mail` group (`send
[plain|replyable]`, `audit`, `remove last|<id>`, `watch on|off`, `cleanup
on|off`, `unload`, `bounce`), the on-demand quest `QESdk024MailQa` (`qe24 run
mail` — replyable `Mails[0]` through `this.sendMail(0)`, reply objective,
cleanup hook on complete **and** abandon), and an always-armed, subject-gated
mail sweep in `OnModPackageUnloaded` (the dev-prescribed BUG 9 pattern, same
shape as the shipped Twotter cleanup; it cannot be a per-session switch because
a flag cannot live across the restart the hook needs — `qe24 mail unload`
prints that). Every sweep matches only subjects starting with `QE24 mail probe`
and logs each `remove` call, so the paste itself is the evidence.

**M-09 rides the batch** (Zeis's ask): the `moment` RFC2822 roadmap row's mail
attribution was stale — the dev's BUG 10 answer blames Twotter/Kisscord
`Date.toString()` in mod content, and T-09b saw the only 1.3.1 warning come
from a game tweet. The row is corrected in the README; one clean-save look
closes it with evidence.

**Process scars from this round, worth keeping:** two of six batched
`edit_file` calls to `mod.js` silently lost their writes (the r150 lesson
again) — caught by grep-verification after each batch, re-applied serially;
and one fuzzy match duplicated the file tail, caught by `node --check`. The
rule stands: **serial edits only on the harness, verify with grep +
`node --check` after every batch.** All nine new guards were falsified by
revert (version pin, dispatch, replyable flag, watch-off unsubscribe, the
sweep's subject gate, the cleanup flag, the launcher entry, the audit readback,
the unload call).

**Nothing else changed in the editor** — the export moved 1.0.34 → **1.0.35**
and the manual's stamps swept to r209 purely so the installed evidence cannot
disagree with the editor.

Versions: `EDITOR_BUILD` **r209**, export **1.0.35** (stamp only), harness
**1.0.24**. Tests: 1,793 across 88 files (+9).

---

# Handoff — r208

**The pack extras are done and verified in game.** Six batched rows, six greens:
the claim entry adds `QE24 Extras-Prüfung` to the journal; the handbook entry
opens the handbook on its own front page (the game's, **Q15** — the log says so
now); **both right-click entries draw** (they had never drawn anything — the r204
refusals hit them exactly like the menu item, and nobody had re-tried them after
the r206 fix); a picture on a menu entry **shows**, so the editor's picture field
is real; and with the game in French the entries fall back to the English labels
rather than showing tokens.

**What this round changed in the editor:** the picture on a menu or right-click
entry is now a **file picker** (`ImagePickerField`, the same control the mod's own
icon uses — it embeds the file, which is what the game was proven to accept),
instead of a text box asking an author to produce a picture's written form. And
the handbook got the page this feature owed: **`guides.html#pack-extras`** —
what the four surfaces are for, the four jobs, the picture, the translated words
and their token, and the two honest notes (a widget's own text is a page the
translation table cannot reach; the handbook entry lands on the front page).

**Process change, from the tester:** one install, one session, every open
question in the same batch. Six rows in one run beat six runs of one row, and the
findings only ever needed a line each.

**Nothing is open on the QA side.** **Q14** (a click has no mod identity) and
**Q15** (handbook deep links) are with the developers; the editor works around
both and says so where an author would look.

Versions: `EDITOR_BUILD` **r208**, export **1.0.34** (stamp only — the six green
rows ran on 1.0.33), harness **1.0.23**.

---

# Handoff — r207

**The click path works — the log proves the whole round trip** (`clicked` →
`handed … to the engine (job click-4)` → `the engine called back for …` → the
action running), the toast came out as the German sentence rather than the raw
token, and mail delivered. Then two findings, one ours and one the game's.

**Ours: the claim action sent the wrong string.** `Quest.claim` takes the **name
the game knows the quest by** (`QESdk024ExtrasQa`) — what the harness command has
always used, and what the runtime's own unclaim node uses — not the editor's
document id (`qe-x1`). The game answers an unrecognised id by doing nothing at
all, so the click looked dead. r207 resolves the author's pick to the name at
export (`questNameOf` in `compile.ts`, emitted as `questName`), the runtime logs
`claiming quest <name>`, and an action whose quest is gone logs `nothing to claim`
instead of silence. Falsified both ways: sending the id again, or dropping the
guard, turns the matching fence red.

**The game's: `Handbook.open` does not deep-link.** Clicking the handbook entry
opened the handbook **on its own landing page** — the page title was our guess at
the id, and the guess is disproved. No error from the build, nothing in the log.
Filed as **Q15**; the editor no longer claims the page is reached (runtime log,
`Open handbook` node's help text, and the picker's note all say what happens).

**Six rows open in ONE batch** (export **1.0.33**, harness **1.0.23**) — the
tester pushed back, rightly, on rounds of one or two rows: every open question
goes into one session from now on. **L** claim → journal, **M** handbook → the
new log line, **N/O** the two right-click actions (they have never actually drawn
anything: the r204 refusals hit them too, and the r206 deferral has never been
tested on a context-menu click), **P** the `icon` field, which has never been
exercised in game — the mail entry now carries a small purple square as a data
URL, so one glance decides whether the editor keeps offering that field — and
**Q**, optional: a language the pack has no words for must fall back to English
rather than showing raw tokens.

**Owed next: the manual page for pack extras.** The plan is explicit that the
editor's docs must not describe a surface as working before a tester has seen it;
with rows I/J/K/L green, the four actions have been seen, and the page should
document the two gotchas too (a widget's HTML is a static file, so `{{tr.…}}`
does not reach inside it; the handbook action lands on the landing page until the
game publishes its article ids).

Versions: `EDITOR_BUILD` **r207**, export **1.0.33**, harness **1.0.23**.

---

# Handoff — r206

**Row H decided the round, and it is good news.** The probe, in game:

```
SharedVariables.set (no permission) - WORKED
UI.notify / UI.toast / Mail.send / Quest.claim - refused: [ContentSDK] Mod "null" ...
Scheduler.schedule (defer to the engine) - WORKED
DEFERRED UI.toast (from a scheduler job) - WORKED
DEFERRED UI.notify (from a scheduler job) - WORKED
```

Every gated call from a click is refused — `Quest.claim` included — and the same
calls from a one-millisecond `Scheduler` job all work. **So the workaround is
real and the editor now uses it** (r206): a click writes its log line, hands the
action to the engine, and the action runs in the engine's callback. The kind is
`qe/<mod id>/click` because the SDK's kind registry is shared across packs; the
job id travels in the payload and the action is kept in a table, so a job that
fires finds its own action. A build with no `Scheduler`, or a `schedule` that
throws, falls back to running in the click (r204 behaviour) and says so.

**The r205 mystery is solved with it.** The click logged the raw key
(`qe24.menu.message`) where the sentence should be: a click handler cannot see the
mod's own translation table either, and the callback gets it back. The log now
shows the German sentence from the callback with no change to the project file.

**Row G green** — German labels in the start menu and both right-click menus, no
raw tokens.

**Three rows open** (export **1.0.31**; harness unchanged at 1.0.23), all in
German, all on the four new start-menu entries:

- **I** — click each of `QE24: Extras-Prüfung`, `Extras-Quest annehmen`,
  `schick mir einen Brief`, `Handbuchseite öffnen`: a German sentence, the quest
  in the journal, a letter, the handbook page. The claim and handbook entries are
  also the first in-game proof that a *click* can start a quest and that
  `Handbook.open(title)` accepts the title as the id.
- **J** — paste the log lines for one click: `clicked` → `handed … to the engine`
  → `the engine called back for …` → `said "…" via UI.toast`. A missing callback
  line would mean the engine never fires our jobs, which would sink this whole
  approach.
- **K** — the toast says the sentence, not `qe24.menu.message`.

**Q14 is still open for the developers** — sensible fix, and this is only our
side of it. **Owed next: the manual page for pack extras** (the plan says the
editor's docs must not call a surface working before a tester has seen it; after
row I, the four actions have been seen).

Versions: `EDITOR_BUILD` **r206**, export **1.0.31**, harness **1.0.23**.

---

# Handoff — r205

**The second run found the real bug, and it is bigger than the extras.** Zeis
pasted the log, and it answers everything:

```
[quest-editor] extras: menu item "qe24-menu-extras" clicked (language en)
[quest-editor] extras: UI.toast threw: [ContentSDK] Mod "null" tried to use UI.toast without "ui" permission. Add "ui" to the permissions array in your manifest.json.
[quest-editor] extras: UI.notify threw: [ContentSDK] Mod "null" tried to use UI.notify without "ui" permission. ...
```

The click **does** reach the pack. The call is refused because the permission
check cannot tell *which mod* is calling from a menu/context-menu handler — it
reads the mod as `null`. It is not a missing permission: that export's manifest
lists `ui`, and in the *same session* its quest-context `UI.notify` drew a popup
(row F, in German) while its click-context one was refused. The harness, which
shows both popups from a command, also lists `ui`.

Also settled: **`UI.notify` works.** Row A produced *System Notification - qe24
notify marker* and *Info - QE24 toast marker* — so the editor's default Notify
variant is fine, and the earlier "notify may be silent" worry is dead. (The
toast-first ordering in the runtime stays: it costs nothing and the log names the
API either way.)

**Written up as Q14** in `docs/03-questions-for-the-developers.md`, with the exact
lines, the same-session counter-example, and three asks (resolve the caller's mod
from the item's registration; or give a documented way to run a gated call from a
handler; or at least say "the click handler has no mod context" instead of "add ui
to your manifest", which sends the reader to a file that is already correct). The
runtime now logs that explanation itself when it sees this refusal.

**Row F is green** — German popup, German quest title, the registration-time text
working as designed. **Row E was impossible as written** (languages can only be
switched from the main menu, which unloads the mod), so it is now row **G**:
switch, reload, look at the labels.

**Two rows are open, neither needing a fresh save** (export **1.0.30**, harness
**1.0.23**):

- **G** — German session, look at the start-menu and both right-click labels.
- **H** — `qe24 clickprobe on`, click `QE24: click probe`, wait three seconds,
  `qe24 clickprobe report`. It tries every channel from one click
  (`SharedVariables`, `UI.notify`, `UI.toast`, `Mail.send`, `Quest.claim`) and then
  a **deferred `Scheduler` job** that makes the same two UI calls. If the deferred
  lines say WORKED, the editor's fix is to route all four click actions through
  the engine; if they are refused too, the four click actions cannot be honoured
  on this build and the editor has to say so where the author picks one.

Do not re-run A…F, and still do not run `qe24 extras off`.

Versions: `EDITOR_BUILD` **r205**, export **1.0.30**, harness **1.0.23**.

---

# Handoff — r204

**The first pack-extras run came back two green and three findings — and the
biggest one is not about extras at all.** Zeis installed export 1.0.28 + harness
1.0.21, fresh save: the desktop widget drew with its own background (T-24 ✓) and
both right-click entries appeared (T-25a/b ✓). The start-menu entry **was** in the
start menu but clicking it did nothing visible, and after switching to German the
labels were still English (and so was the widget — expected, its file cannot be
translated).

**The finding to act on:** every notification this project has ever *seen in
game* came from `UI.toast`. `UI.notify` is declared by the SDK, is what the
editor's **Notify** node uses in its default variant, and has **never** been
reported appearing. So the r203 click was ambiguous by construction: the game may
never have called our handler, or `UI.notify` may draw nothing. This round makes
that unambiguous rather than guessing:

- every extras click logs a line **before** it does anything, and a second line
  naming the API that showed the message (or that none did) — see
  `extras.test.ts`'s click/false-path fences;
- messages now go out via **`UI.toast` first**, with `UI.notify` as the fallback,
  and the log says which was used;
- harness 1.0.22 adds **`qe24 extras say notify|toast`** — one call per command,
  so a single look per command says which one draws. That answer decides what
  every notification this editor emits should rely on, including the Notify node.

**Why nothing translated:** the labels were handed over once at load, in English,
and the SDK is explicit that text read once and kept does not update by itself —
which is exactly what `Localization.onLanguageChange` is for. The runtime now
subscribes to it and **re-registers the menu and right-click labels** (remove +
add; there is no update call) when the language changes, so they follow live. A
widget is a file the language cannot reach, so it is deliberately left alone. A
quest's Title still follows only the language the game was in when the save
loaded — the journal entry was built from the registration-time copy, and that is
now stated in the rows rather than left as a puzzle.

**The second run is rows A…F** in
`reference/sdk-0.24-qa/editor-export/README.md`: A = `qe24 extras say notify`,
then `say toast`, one look each; B/C = click the menu entry and both right-click
entries; D = paste the log's `[quest-editor] extras:` lines; E = switch to German
and look again **without reloading**; F = set German, load, then `qe24 run extras`
for the translated Title. Install export **1.0.29** + harness **1.0.22**, both
folders whole, and still do not run `qe24 extras off`.

Versions: `EDITOR_BUILD` **r204**, export **1.0.29**, harness **1.0.22**.
Tests: 5 new mutations falsified (log-before-anything, toast-first, the language
hook, remove-before-add, and leaving widgets alone); the suite is 1,766 across 88
files.

---

# Handoff — r203

**Stage B of the cheap wins is built — and it is waiting on five rows in game, not
on more code.** Pack extras and localization exist end to end: schema, compiler,
runtime, and a dialog with four surfaces. Nothing about the *editor* side is
unverified by tests; what is unverified is how the game draws what the editor
emits, which is exactly what T-23…T-27 are for.

**What to run** (rows in `reference/sdk-0.24-qa/editor-export/README.md`, open
banner in `STATUS.md`): install **export 1.0.28** — the **whole `mod/` folder**,
`widgets/` included — then, in order: look at the start menu's bottom strip and
click the entry (T-23), look at the desktop widget at 40,40 for a real background
(T-24), right-click a file and the desktop (T-25a/b), switch the language to
German and look at all three again (T-26), then `qe24 run extras` for the quest
whose Title is a translation token (T-27). **Do not run `qe24 extras off`** — it
removes the harness's own probe items, not the export's, so it only wastes the run.

**Three things the build settled, each with a fence:**

- **The fragile case is real.** A quest's Title (and Description) is read at
  registration, so `{{tr.…}}` in those two is resolved *before* the class is handed
  over — and only those two, so `{{data.…}}` keeps working everywhere else. Menu
  and right-click labels are the same shape and get the same treatment; an action's
  message waits for the click, which is later and may legitimately differ.
- **A widget's text is a static file.** The game loads it as a document, so
  `{{tr.…}}` is not filled inside widget HTML. The row notes say so rather than
  letting an author find out in game.
- **`__QE.safe` turns null into `""`.** The `{{tr.…}}` branch needed a genuine
  "no translation" so it could show the key instead of a blank; it uses its own
  try/catch. (Caught by the test that asserts the key is shown on a build with no
  Localization at all.)

**Tests:** `extras.test.ts` (21, compiles and boots the real mod against a stub)
and `extrasDialog.test.tsx` (9, jsdom) — 30 new, the suite at 1,760 across 88 files. **14 mutations were falsified** — the first
attempt at the "no `section` control" guard survived on an empty panel, so that
assertion now runs with a full form on screen.

**Still owed after the rows:** a manual page for the feature (the editor's own docs
should not describe a surface as working before a tester has seen it in game).

Versions: `EDITOR_BUILD` **r203**, export **1.0.28** (carries the extras), harness
**1.0.21** (adds the `extras` alias).

---

# Handoff — r202

**The pack-extras probe is closed: all four APIs work in 1.3.1.** Zeis's third
screenshot shows the three start-menu items and both widgets at once, and he
confirmed the desktop right-click entry in words. Readings, now in STATUS.md:

- **`Menu.addItem`** — items appear in the **bottom strip of the start menu**.
  All three appeared (registration order). The declared `section: "top"|"bottom"`
  has **no visible effect** in this build, so the editor will not offer it.
  (The first run's "nothing there" was almost certainly where the strip sits —
  below the app grid — rather than the API.)
- **`Desktop.addWidget`** — position and size honoured; `transparent: false`
  gives the solid background, `transparent: true` (the SDK **default**) draws
  text only. Stage B's widget form therefore needs that switch visible and
  defaulted to opaque.
- **`ContextMenu.register`** — both `file` and `desktop` targets work.
- **`Localization`** — translates, substitutes `{{placeholders}}`, echoes a
  missing key. **30 languages** offered, now the editor's list.

Stage A cost three runs, and the only real waste was mine: the instructions had
`off` before "then look". The harness now says "DO NOT run `qe24 extras off` yet".

**Next: Stage B** — the Pack extras dialog (start-menu items, desktop widgets
with the website builder's page editor, right-click items) and localization
(the Languages table + a `{{tr.…}}` token resolved by the existing filler). All
four click actions are approved: notify, claim a quest, send mail, open a
Handbook page.

Versions: `EDITOR_BUILD` **r202**, export **1.0.27** (stamp only), harness
**1.0.20** (unchanged — it already carries the probe).

---

# Handoff — r201

**The first pack-extras run answered three of four questions, and the answers are
good.** Zeis's file (plus two screenshots) is on QA-filedump as
`QE24-TestResults-Extras.md`:

- **`Desktop.addWidget` works.** A mod's own HTML, addressed by a mod-relative
  path, renders in a desktop iframe. The wrinkle: it drew text without its
  background — that is `transparent: true`, the **SDK default**, which the probe
  had not overridden. So Stage B's widget editor must expose the switch and
  default it to opaque, and the plan says so now.
- **`ContextMenu.register` works** for `target: "file"` — the entry sits at the
  bottom of a file's right-click menu.
- **`Localization` works** — `t()` translated, `{{who}}` substituted, a missing
  key echoed its own name. **The game offers 30 languages** (ar … zh-Hant-TW), so
  the editor's language list is a fact now, not an invention.
- **`Menu.addItem` did not appear.** Registered and reported by `getItems()`,
  visible nowhere in the start menu.

**My mistake, and it cost the run:** I told him to run `on`, `lang`, `off` and
"then look", so everything was already unregistered when he looked. He re-ran it
himself and caught it. The harness now prints **"DO NOT run `qe24 extras off`
yet"** when it registers, and the row text puts the look before the cleanup.

**The re-probe (r201, one look):** three menu items — one per section spelling the
interface declares (`no section`, `top`, `bottom`) — so a single look separates
"wrong section" from "not wired up"; two widgets side by side (opaque at 40,40,
`transparent: true` at 400,40) so the transparency switch is read off one
screenshot; a `desktop`-target right-click re-check; and the widget HTML gained a
dashed frame so its size is measurable. Rows **T-20..T-22** in STATUS.

Versions: `EDITOR_BUILD` **r201**, export **1.0.26** (stamp only), harness
**1.0.20**.

---

# Handoff — r200

**Stage A of the cheap wins is built and waiting on one run.** The harness gained
`qe24 extras on / off / lang`, which registers one of each thing a pack can put
*outside* its own quests and reports what the game says it has:

- `Menu.addItem` — "QE24 Extras", section `bottom`, click → toast;
- `Desktop.addWidget` — a deliberately loud magenta widget (320x180 at 40,40)
  whose `src` is `widgets/qe24-widget.html`, a new file shipped beside
  `dist/mod.js`, because a mod-root-relative HTML path is the part most likely to
  be wrong;
- `ContextMenu.register` — one item targeting `file`, one targeting `desktop`;
- `Localization.register` — `en` and `de` bundles, plus `t()` with a placeholder
  and a deliberately missing key.

**Why a probe instead of building the editor feature:** nothing in this project —
handbook, official transcriptions, shipped mods — has ever called those four
namespaces, so every design decision in Stage B depends on readings we do not
have. Four rows (T-16..T-19) tell Zeis exactly what to look at and what each
reading decides; the answers choose the widget mechanics, the real language list,
and which permission (if any) each surface needs.

**Fences:** five new tests drive the real harness against a stub SDK and assert
the exact registrations the game is handed, and that `off` takes them away. Six
falsifications (each registration removed in turn, `off`'s widget removal, the
report's right-click line) all went RED.

Versions: `EDITOR_BUILD` **r200**, export **1.0.25** (stamp only), harness
**1.0.19** (real change — copy the whole `mod` folder: the widget HTML is part of
it now).

---

# Handoff — r196

**The Twotter round is closed, every row green or resolved.** The last two landed
on 2026-09-19.

**T-11b, abandon half — the failure the round opened on.** r185 lost this row: an
abandon removed the tweets but kept the account, because "live quest" counted a
quest that had never started. Re-run on a clean save, tw1 claimed and abandoned
from the journal:

```
OnAbandon: starting
cleanup starting (abandon): 5 item(s) to undo
twotter: removeUser(qe-tw-account) -> true (the last quest that needs it ended)
cleanup: tweet qe-...-post-4 ... removed        (then 3, 2, 1, 0)
cleanup finished
OnAbandon: finished, handing back to the game
```

`qe24 twotter audit` after the reload: **not on this save.** Note the order — the
account goes first and `removeUser` takes its posts with it, so the per-tweet
cleanup finds nothing left; that is why both appear. `keep` never fired.

**T-15c — the uninstall promise, measured in both directions.** Disabling the
export in the game's Mods list makes the game apply the change at the next start,
before any save is loaded, and that is when `OnModPackageUnloaded` fires:
`removeUser(qe-tw-account) -> true (mod unloaded)`, account gone from the save
afterwards. A plain quit runs no hook at all (nothing to clean), and a mod deleted
from disk while the game is closed can never run mod code — the one leak, filed
narrowly as question 11.

**The round's two developer questions:** §11 (sweep mod-created accounts the way
the game already sweeps their quests: `[PruneOrphanQuests] Dropping …: no
installed content defines it`) and §13 (a mod disabled in the Mods list stays
disabled across a new version, a folder deletion and a fresh save — the silent
no-load that cost two sessions before r193's readout named it).

**The audit command:** it retires with the round. It stays in the harness — no
dependants, the harness never ships, and a future SDK round touching Twotter will
want it — but no row needs it until a Twotter row returns.

**Nothing is waiting for Zeis.** The open list is empty; the next round starts
from whatever he asks for next.

Versions: `EDITOR_BUILD` **r196**, export **1.0.23** (stamp only), harness
**1.0.18**.

---

# Handoff — r195

**T-15c is GREEN, and the promise now has exact edges.** Zeis disabled the export
in the game's Mods list, accepted *"Restart the game to apply updates."*, quit,
and relaunched. While the game was starting up — **before any save was loaded** —
the log carried both lines:

```
[quest-editor] unloading: removing the Twotter accounts this mod declared
[quest-editor] twotter: removeUser(qe-tw-account) -> true (mod unloaded)
```

Loading the save afterwards and running `qe24 twotter audit`: `@qe24_editor` is
gone, handle and posts. So `OnModPackageUnloaded` fires when the game applies the
queued disable, and the removal persists — the SDK's advice is followable through
the Mods list.

Two neighbours, for the record: a **plain quit** runs no hook at all (measured in
r194 — no `unloading:` line, account survives; nothing needs cleaning in that
sequence, so it is not a defect), and a mod **deleted from disk while the game is
closed** can never run any code of ours, so its accounts stay. That last one is
the only leak, and the game already knows how to handle the equivalent for quests
(`[PruneOrphanQuests] Dropping "QESdk024TwotterQa" …: no installed content defines
it`) — question 11 now asks, narrowly, for the same sweep over mod-created
accounts.

**The round is nearly closed.** The only open row left is the **abandon half of
T-11b**. T-15d is dropped (nothing left for it to distinguish — the account was
gone), T-15b stays red by design, and the audit command has no dependants once the
last row runs.

Versions: `EDITOR_BUILD` **r195**, export **1.0.22** (comments only again — the
field build for the last row is unchanged in behaviour), harness **1.0.18**.

---

# Handoff — r194

**Zeis ran the full T-15c protocol with everything captured, and it closes one
half of the question the wrong way.** Session 14:52:58: the export loaded
(`v1.0.20 (2026-09-18.r193)` — r193's readout works in game, both directions),
tw1 started, `twotter: created @qe24_editor (qe-tw-account) for quest qe-tw1`,
five tweets out. He saved and quit to desktop with the mod installed and enabled.
**That session's log has no `unloading:` line at all** — and that line is the
first statement inside the hook, so the game never called
`OnModPackageUnloaded`. Session 14:56:49, mod removed from the folder, the audit
still finds `@qe24_editor` on the save.

So the SDK's instruction — `removeUser`'s *"clean up in `OnModPackageUnloaded`"* —
is unreachable for the case it names: disk deletion can never run our code, and a
plain quit does not call the hook. The same log shows the game doing its own
half: `[PruneOrphanQuests] Dropping "QESdk024TwotterQa" …: no installed content
defines it.` Quests are swept, accounts are not. Question 11 now carries the
measurement and says plainly that it becomes a bug report unless the disable path
runs.

**What changed here:** the three comments in `runtimeSource.ts` that promised
"uninstalling removes what the mod declares" now say what was measured instead —
shipped code should not describe behaviour the game does not have. No runtime
behaviour changed (the hook does what it always did); STATUS's T-15c is rewritten
as the **disable variant**, the only configuration where the hook could still
fire, with all three readings spelled out. README's limitation row and the plan's
row follow.

Versions: `EDITOR_BUILD` **r194**, export **1.0.21** (comments only — the same
field build runs the disable test; no reinstall needed beyond the stamp),
harness **1.0.18** unchanged.

---

# Handoff — r193

**Zeis found the real cause of the "no profile" sessions, and it is a game bug —
not ours.** The whole session's log had **zero `[quest-editor]` lines**: the
editor export never loaded. He had disabled it in the Mods list during an earlier
round and deleted it from disk; the game **kept the disabled flag** through all
three things that should have cleared it — copying in a **newer version**,
emptying and refilling the mods folder, and a **fresh save**. A disabled mod's
quests are never registered, so `qe24 run tw1` printed "Claimed" and did nothing.
Filed as **question 13** with a concrete ask (a new version should be treated as
new content), and written into the README's limitations table so the next person
does not lose a session to it.

**What we built so this is one line instead of two lost sessions.** Nothing in SDK
0.24 lets a mod see another mod: `ModInfo` is a type with no reader, no API lists
installed mods, and `Quest.claim()` returns void (§12). What does exist is
`SharedVariables` — session-scoped, shared by every mod. So the export now writes
`qe.export.loaded` (`"<version> (<build>)"`) in `OnModPackageLoaded` and removes it
in `OnModPackageUnloaded`, and the harness prints, from both `qe24 run` and
`qe24 twotter audit`:

- `Editor export: loaded (v1.0.20 (2026-09-18.r193))`, or
- `Editor export: NOT LOADED in this session.` — with the cause and the fix in the
  next three lines (an old copy that was disabled stays disabled, enable it,
  restart), or
- `cannot tell` on a build with no `SharedVariables` — never a false "not loaded".

**Fences:** 2 on the export side (marker set at load, withdrawn at unload, and a
build with no `SharedVariables` still loads), 4 on the harness side — the harness
file is now run for real against a stub SDK and its command driven, so these are
behavioural, not string matches. **All 5 falsified.**

Versions: `EDITOR_BUILD` **r193**, export **1.0.20**, harness **1.0.18**.

---

# Handoff — r192

**Zeis reported `qe24 run tw1` producing no profile, and the first job was to
find out whether we broke it. We did not.** The committed QA export was compiled
and booted against the recording stub SDK, with tw1's own `OnStart()` called the
way the engine calls it: `createUser:qe24_editor` → `addUser:qe-tw-account` →
five `postTweet`s. The export's runtime is intact — so the account was missing
because **the quest never started**, not because the node failed.

**Why the tooling could not tell him that, which is the real defect.** `Quest.claim`
returns `void` in SDK 0.24: no boolean, no state readback, no quest list. Our
harness wrapped the call and printed "Claimed QESdk024TwotterQa" whenever it did
not *throw* — which a no-op claim also does. A disabled or missing owning mod
therefore produced the worst kind of wrong answer: confident, specific, and
false. `qe24 run` now says what it can prove ("this line cannot prove the quest
started — check the journal entry"), the Twotter aliases point straight at
`qe24 twotter audit` and the `[quest-editor]` log lines, and **question 12** asks
the developers for a boolean or a state read so the next tool does not have to
guess.

**Where the log actually is** — asked and answered at last, after rounds of docs
saying "the game log" and stopping there: `%APPDATA%/Roaming/hackhub/log`, saves
at `…/hackhub/saves`. It is in the QA README, with the three checks that turn "no
profile" into a named cause (journal entry present? load banner present? `twotter:
created @…` present?).

Harness **1.0.17** (message text only; `node --check` clean). The export and the
editor are untouched this round.

---

# Handoff — r191

**A wording failure of ours, not a tooling gap.** T-15c asked Zeis to check "the
console" for a line — and he has no console: only the fake terminal, which shows
nothing unless a command runs. What was meant is the game's own log **file**, the
`HACKHUB LOG FILE` with the `====` headers that every QA transcript in this folder
already pastes from. He had it in front of him the whole time; we called it a
console and never wrote down where it lives.

So the row now names the file and the two exact lines to search for
(`unloading: removing the Twotter accounts this mod declared`, then
`twotter: removeUser(...) -> true (mod unloaded)`), and the QA docs say plainly
that the file's location on disk is **still not recorded anywhere in this repo** —
every note says "the game log" and stops there. That is a documentation hole worth
closing the next time somebody runs a row.

Also sharpened while rewriting it: a mod disabled in the Mods list is only
**queued** ("Restart the game to apply updates"), so the single moment the cleanup
hook can run is the **shutdown after that disable**, while the mod is still
installed. And because a save is written *before* the shutdown, a hook that runs
perfectly at unload may still not stick: T-15c therefore reports two separate
things — the log line (did the cleanup run) and the audit (did it last) — and the
combination "line present, account still there" is itself the finding.

Versions: `EDITOR_BUILD` **r191**, QA export **1.0.19** (compiled content identical
to 1.0.18 apart from the stamp — 1.0.18 runs the row just as well), harness
**1.0.16**.

---

# Handoff — r190

**The "Graph paper" grid was not graph paper.** Zeis spotted it while testing
something else: it rendered exactly like "Squares". It stacks two of the
library's own background layers (fine lines everywhere, a heavier line every
fifth), and both were left with the **same pattern id** — the library builds each
pattern's id from the flow instance, and its type docs state the requirement:
*"When multiple backgrounds are present on the page, each one should have a unique
id."* With one id for two patterns, every `fill="url(#…)"` resolved to the first
pattern in the document, so the heavy fifth-lines were never drawn. Each layer now
has its own `id`, and the fence asserts the two pattern ids differ **and** that
each `<rect>` paints from its own — jsdom cannot resolve a `url()` reference, but
it can see a duplicated id, which is the whole bug. Falsified: reverting the ids
reports `both layers share the pattern id pattern-1`.

**And question 11 got its missing piece.** Zeis tried the other uninstall route:
disabling a mod in the game's Mods list makes the game itself say *"Mod changes
detected. Restart the game to apply updates."* So a user-initiated disable is
**queued, not applied in-session** — the SDK's own example for
`OnModPackageUnloaded` ("e.g. disabled by user") does not describe a mid-session
unload either. The one moment that hook could still run is the **shutdown** after
the queued disable, while the mod is still installed. **T-15c** now measures
exactly that, with two pieces of evidence: the mod's own console line
(`unloading: removing the Twotter accounts this mod declared`) and the audit of
the handle after the reload. A line plus a surviving account means the hook ran
after the save was written; no line at all means the documented cleanup path never
runs for a disabled mod, and question 11 becomes a bug report rather than a
request.

Versions: `EDITOR_BUILD` **r190**, QA export **1.0.18** (compiled quest content
unchanged — the build stamp moved), harness **1.0.16**.

---

# Handoff — r189

Two greens, one honest limitation, and the wording Zeis asked for on his
screenshot.

**Green.** **T-08b** — the authored pictures really do reach the game ("banner is
bright violet, profile is amber"), which closes the r185 banner wrinkle. **E-01**
— the stage-2 visual pass, screenshot included. His two notes are built: the
blank banner area now says *"blank is fine, the game draws its own"*, both picture
pickers' tooltips say the same, and a **blank display name** gets the same nudge a
broken handle gets.

**His question — what does the game fill in? — answered from our own probe.** The
T-01 probe called `Twotter.createUser({ username, bio, verified })` and the engine
supplied **name, surname, avatar, banner, followers, following and password**:
`createUser` fills whatever it is not handed. The editor hands it everything an
author typed, so the **two pictures are the only place its defaults show** (we
omit them when blank, deliberately, since r20's empty-avatar bug), while name,
handle, bio and counts travel as written. The bio is the exception with a reason:
a *missing* bio is the shape that crashed Twotter's search for seven rounds (r31),
so we always send a string and a blank bio stays blank.

**One red, and it is a platform limit rather than a bug.** **T-15b**: Zeis
completed tw1, saved, quit, removed the editor export from disk and relaunched.
The **quest** was gone (the game drops an uninstalled mod's content) but
`@qe24_editor` and all its tweets were **still in the save and in search**. The
SDK says this in so many words — *"Accounts your mod adds live in the player's
save and are not removed when the mod is uninstalled, so clean up in
`OnModPackageUnloaded`"* — and the same doc defines that hook as *"called when the
mod is being unloaded (e.g. disabled by user)"*. A mod deleted while the game is
closed never loads, so no code of ours can run at any point in that sequence: the
cleanup is not broken, the scenario is outside any mod's reach. Filed as
**question 11**; the row is rewritten as **T-15c** — disable the mod in the game's
Mods list **while running**, which is the path the hook can serve, and the one
worth confirming.

**A second dead-class find.** r188 swept `accent-2`/`bg-raised` out of the Twotter
chrome; the follow-up found `to-raised` (the placeholder gradient's end colour)
and the older `text-accent-2` in `Field.tsx`. Both were silently doing nothing.
Fixed. Stage 2's copy fences were falsified 3/3.

**Versions:** editor build **r189**, QA export **1.0.17** (the compiled quest
content is unchanged — the build stamp inside it moved, and the folder a tester
installs must not disagree with the editor they read), harness **1.0.16**.

Gates: typecheck clean; **16 tests** in the stage-2 file (3 new); manual
regenerated.

---

# Handoff — r188

Plan: [`plans/r185-twotter-return.md`](plans/r185-twotter-return.md) (the round
that contains all of this). r184–r187 have no sections here; their rows are in
the root README and the round plan.

**Twotter is back, and it is finished bar three in-game rows.** Stage 1 (accounts
as mod-level records, the node as a series of tweets, the runtime, the migration)
shipped in r185 and was field-tested; r186 fixed the three bugs that run found —
the quest-start hook that never ran, "live" counting quests that had never
started, and a posting guard that outlived its quest. Stage 2 (the whimsy) shipped
in r188: the Twotter panel is a **click-to-edit mock profile** — banner, avatar,
name, handle, bio and the blue check all turn into fields where they sit, both
pictures open the picker they already had, and the panel lists **what the account
has posted across every quest**; the node inspector shows the same profile
**read-only** over its tweet timeline, **newest first** (the game's order — the
author's list below stays oldest first), each row with its age chip and counts,
and one CSS shimmer on the row that arrives with the story, dropped under
`prefers-reduced-motion`.

**The picture question is settled, not pending.** `TwotterTweet` has no picture
field and the r185 run saw no picture in the feed, on the profile or on the
post's own page while the same data-URI rendered fine as an avatar. The upload
control is therefore **hidden** (commented out with its reason; restoring it is
one line), the runtime still sends the key so a future SDK that accepts one
brings every already-authored picture back, and a **feature request** is filed as
question 10 in [`03-questions-for-the-developers.md`](03-questions-for-the-developers.md).

**Open — three in-game rows and one editor row**, all in
[`reference/sdk-0.24-qa/STATUS.md`](../reference/sdk-0.24-qa/STATUS.md) with the
commands (editor export **1.0.16** beside raw harness **1.0.16**):

- **T-11b**, the abandon half (completion is green since 2026-09-19).
- **T-15b** — uninstall the mod, the handles leave search.
- **T-08b** — the loud colours (`#AA28FF` banner, amber avatar) reach the game.
- **E-01** — the editor-only visual pass on stage 2: Templates → Node Reference →
  the Twotter node, then the **Twotter** button in the top bar. jsdom cannot see
  pixels; this is the half no test here can do.

**`qe24 twotter audit` stays for now, and can go when this round closes.** It is
a harness-only read-only diagnostic (SDK 0.24 has no "list every account" call, so
it audits the handles this round creates). Nothing in the editor or the export
depends on it.

**A real bug found while building stage 2:** `accent-2`, `bg-raised` and friends
were never in the Tailwind theme, so every class that used them (the r185 panel's
selected-row highlight among them) silently did nothing. Stage 2's chrome uses
real tokens (`cat-comms` for the Twotter family); the older `text-accent-2` in
`Field.tsx` is still dead and still there.

Gates: typecheck clean; `npm test` **1,714 passed / 85 files** (+14, one new test
file); build OK; manual regenerated (**160** fields after the hidden picture row);
QA export regenerated (export **1.0.16**, `EDITOR_BUILD` r188). Nine of stage 2's
ten fences were falsified; the tenth (the tie-order rule) cannot be falsified
through behaviour — JS sorts are stable — and the test says so.

---

# Handoff — r183

Plan: [`plans/r183-inspector-row-width.md`](plans/r183-inspector-row-width.md).
The third fixture pass closed the last two editor rows and found a real layout
bug.

## S-12 and S-15 are green

Both fixtures open on their quest and the screenshots show the migration values:
**Wait** + hours **2** (readback "= 2 hours", card `2h`), and **A coming day**
with the clock at **18:23**, the preview "Fires in 2 weeks, at 18:23 in-game…"
and the card reading `in 2w at 18:23` — the r176 `offsetAmount`/`offsetUnit`
pair landed in the Weeks box.

**Both rows are editor-only** — that was the tester's question, and it was fair:
`TIMER-ROWS.md` said "look at the Timer node" but not "and that is the whole
row". It says it now.

## The clipped row (the real work)

Screenshot 2 shows the "In" row's four boxes running off the inspector's right
edge. The arithmetic: each cell is `px-3` (24px) + `gap-1.5` (6px) + a ~36px
unit caption + a usable number box (≥44px) ≈ **110px**, so the four-box row
needs ~**28rem**. The docked inspector is **340px** and cannot be dragged below
that; a floating drawer can be 280px. The row could never fit.

**Fix:** the row wrapper is a **`@container`** and the column count follows the
panel's width, not the window's. Four-box row: 2 × 2 at the default, one line of
four above 28rem. Six-box Wait row: its shipped two lines of three, folding only
below 21rem (a narrow floating drawer). Verified in the built CSS —
`@container (width>=28rem){…grid-cols-4…}` is really emitted.

**Not** done on purpose: widening the default. It moves the cliff rather than
removing it.

**What is not tested:** jsdom has no layout, so no test proves the pixels fit.
`src/editor/inspector/__tests__/rowFold.test.tsx` asserts the shape of the fix —
the row declares a container, folds below the caption width, and never uses a
bare `grid-cols-4` again — and the visual confirmation is a screenshot pass.
Falsified 2/2 (reverting to a bare `grid-cols-4`, and folding too late).

## Open (two rows, both needing a specific moment)

- **S-10** short-month clamp — a 29th–31st in-game date.
- **S-11** `NEXT EVENT` — `qe24 schedule 120`, then read the clock panel inside ~2 real minutes.

Gates: typecheck clean; `npm test` **1,661 passed / 83 files** (+3, one new test file); build OK;
manual and QA export regenerated (export **1.0.11**, `EDITOR_BUILD` r183).

---

# Handoff — r182

Plan: [`plans/r182-fixtures-and-honest-log.md`](plans/r182-fixtures-and-honest-log.md).
The second Timer run came back; it closed a row, and it found two defects of ours.

## S-03 is green — the evidence was in the log he pasted

He abandoned `QESdk024TimerQa` after Timer A fired and waited two real minutes:
nothing popped. He said he could not find a cancel line in the log, but his own
paste has the whole sequence: `timer node qe-tmrf7pia armed after 2m` → fired →
`timer node qe-9b919r74 armed after 2h` → `OnAbandon: starting` →
`cancelled … pending timer(s)` → `OnAbandon: finished`.

## Defect 1: the fixtures opened on an empty canvas (editor bug)

S-12 and S-15 came back "broken": **"No quest selected"**, an empty canvas, the
first-run "browse 13 templates" hint. Cause: neither fixture carries
`editor.activeQuestId` — old, hand-written shapes, which is what a migration
fixture is — and no load path picked a quest. Not fixture-specific either: any
hand-written project, or one whose active quest was deleted, opened the same way.

**Fix:** `ProjectSchema` transforms on parse — if the active id is not a quest in
the file, point it at the first quest that ships. It lives in the schema because
file load, import, the autosaved draft, template construction and the QA export
generator all parse through it, and a repair at call sites can be forgotten.
`createProject`'s private copy of the same repair is gone.

## Defect 2: the cancel line miscounted

His log said `cancelled 2 pending timer(s)` with only one timer left — a fired
job's id stayed in the mod's list. Fired jobs are now dropped as they fire
(`beatJobsByQuest` map, since the handler runs outside any quest's closure), and
a test asserts the cancel call names the pending job and not the fired one.

## Rows still open (four, none needing a wait)

- **S-10** clamp — needs a 29th–31st in-game date (his run fell on the 19th); unit-tested.
- **S-11** — partly answered: the clock panel showed the **game's own** queued job (4d 6h), not the pending mod job, so a mod job does not take `NEXT EVENT` ahead of it. The definitive check is `qe24 schedule 120` (a harness job ~2 real minutes out, so it *is* nearest), then read the panel.
- **S-12 / S-15** — now one look at the boxes each; they were blocked until this fix.

`TIMER-ROWS.md` now tells testers to search the game log for `quest-editor`,
which is where the cancel line had been all along.

Gates: typecheck clean; `npm test` **1,658 passed / 82 files** (+2); build OK;
manual and QA export regenerated (export **1.0.10**). Falsified 2/2 — removing
the schema repair fails the fixture guard (and the template determinism test);
dropping the fired-job line fails the S-03 count test and the export byte guard.

---

# Handoff — r181

Plan: [`plans/r181-quiet-qa.md`](plans/r181-quiet-qa.md). The short version:
Zeis ran the Timer rows, said *"a bit of a mess"*, and he was right about both
halves — the checklist was unusable, and his paste had already answered most of
the rows.

## The mess was ours: nothing auto-starts any more

By r180 the export and the harness auto-started **five** QA quests at load —
four with toasting debug nodes — on top of quests an earlier build had left
claimed on his save. The journal could not be read; a toast could not be
counted; two rows were skipped explicitly because of it.

- **Every QA quest is claimed on demand** (export 1.0.9, harness 1.0.11):
  `qe24 run` lists them, `qe24 run cal` claims exactly one, `qe24 run clear`
  unclaims everything (that is also how an existing save clears leftovers).
  Built on the declared `Quest.claim` / `Quest.unclaim`.
- **No QA debug node toasts** any more; the journal line stays.
- **Two guards**: a test asserts no QA quest has `autoStart` and no QA debug
  node has `toast`, and another asserts every project quest is reachable from
  the launcher.

## Ten of the fifteen Timer rows are closed by his paste

| Closed | Evidence |
| --- | --- |
| S-01, S-02 | Timer A/B fired; after reload exactly one Timer B job, same id and `fireAt` — no double-arm. |
| S-05, S-06 | The calendar quest's third row armed, and a Timer suspends its chain: the two instant rows before it must have fired. |
| S-07 | Same five jobs, same ids, same raw timestamps, before and after save/quit/reload. |
| S-08, S-13 | The mixed row resolved to **Tue 3 Nov 18:23** = 18 Sep + 1 month + 2 weeks + 2 days, clock pinned. |
| S-09, S-14 | `Wait 1 month` resolved to **18 Oct 19:27** — one month on, same day number, same clock time, via `scheduleAt`. |

Bonus: the 3 Nov job was armed in CEST and fires after the local DST switch in
CET, and the local rendering still reads 18:23 — the promised wall-clock time
survives a DST boundary, which matters because the in-game clock shows local
time (S-04).

**Still open: S-03, S-10, S-11, S-12, S-15** — none needs waiting (S-12/S-15 are
opening a file in the editor). Steps in
[`reference/sdk-0.24-qa/TIMER-ROWS.md`](reference/sdk-0.24-qa/TIMER-ROWS.md).

Gates: typecheck 0 errors; `npm test` **1,656 passed / 82 files** (+7); build
OK; manual + QA export regenerated. Falsified 5/5 (see the plan).

---

# Handoff — r180

Two jobs, both from the return of the r179 probe. Plan:
[`plans/r180-twotter-verdict-and-timer-checklist.md`](plans/r180-twotter-verdict-and-timer-checklist.md).

## 1. Twotter: green on the read path — the feature can come back

Game 1.3.0, Steam build **25388883**, throwaway save. Transcript:
`reference/sdk-0.24-qa/QE24-TestResults - Twotter.md`; row-by-row reading in
`reference/sdk-0.24-qa/STATUS.md`.

| Row | Result |
| --- | --- |
| T-01 `createUser`+`addUser` → search | **Pass** — the engine filled name, surname, avatar, banner, followers, following, password; search found it, bio shown. |
| T-02 planted `bio: undefined` → search | **Pass — the reason the probe existed.** The exact r31 shape no longer crashes search. |
| T-03 save → reload → `status` | **Red, harmless.** Bio *still* `undefined`: "repaired on load" did not happen. Safe only because T-02 is green. |
| T-04 `updateUser` | Not run; no longer load-bearing. |
| T-05 `postTweet` → profile | **Pass** — tweet visible, `PostSeen` fires. |
| T-06 `removeUser` ×3 | **Pass** — including the quest-declared account; handles left search. "No mod can repair it" is answered. |
| T-07 quest-declared account | **Pass at record level** — the declared bio is written; the write path is fixed. |

**New finding:** `Twotter.AccountCreated` does **not** fire for an account added
through `addUser`. No objective may hang on it.

**Constraints the implementation round inherits:** author accounts through
`createUser`/`addUser`, never trust the declarative `TwotterAccounts` path to
fill a record, never rely on repair-on-load, always ship `removeUser` cleanup.
That round gets a plan for review before it is built.

## 2. The checklist Zeis could not find — now built, and the rows made runnable

He was right, and it was our fault twice over: the rows existed only as prose in
three round plans, and the export's `QESdk024TimerQa` covered only S-01…S-03, so
there was nothing installable that would run S-05…S-15.

- **[`reference/sdk-0.24-qa/TIMER-ROWS.md`](reference/sdk-0.24-qa/TIMER-ROWS.md)** — every row S-01…S-15 with steps, what green looks like, what to paste back, and honest notes for the rows that cannot be run on demand (the clamp needs a 29th–31st in-game date; `NEXT EVENT` is fact-finding).
- **`qe24 timers`** (harness **1.0.10**) — prints every pending Scheduler job, from any mod, with `fireAt` rendered as the on-screen clock shows it, the payload naming the quest/node, a proper d/h/m breakdown and the real-seconds cost. A "1 month" row is now read in seconds instead of waited out (26 in-game days is ~10 real hours).
- **Two new auto-start quests** — `QESdk024TimerCalQa` (an exact date already past, a coming day already past today, then a mixed `1 month 2 weeks 2 days at 18:23`) and `QESdk024WaitMonthQa` (a 1-minute Wait, then `Wait 1 month`, the `scheduleAt` path). Ordering is the trick: a Timer suspends its chain, so the instant rows go first and the far one is armed within seconds.
- **Two legacy fixtures** — `projects/fixture-*.project.json` for S-12/S-15, guarded by a test that pins what the boxes must show.

Gates: typecheck 0 errors; `npm test` **1,649 passed / 82 files** (+5); `npm run build`
succeeds; `node --check` on the patched harness; manual and QA export regenerated
(export mod **1.0.8**, build r180). Falsified **5/5**: the naive per-unit
breakdown ("3d 62h"), dropping the payload line, renaming a quest the checklist
names, the mixed row becoming a plain Wait, and the Wait-in-months row losing its
months. One guard was caught too weak while falsifying — a string match another
daytime node satisfied — and rewritten to parse the project and pin each node.

## Open

The Timer rows are the only in-game checks left. They are one sitting, and the
checklist is written for someone who has never seen them.

---

# Handoff — r179

r179 builds the test Zeis asked for: can **Twotter** come back? The answer is
not obvious from the code, so the round is a probe plus its own test suite.
Plan: [`plans/r179-twotter-probe.md`](plans/r179-twotter-probe.md).

## What was wrong (why the fence exists)

Twotter was removed in r31 for a *game* bug, not a design choice. A
quest-declared account was written to the save with **`bio: undefined`**;
Twotter's search called `.toLowerCase()` on it; the crash was permanent, lived in
the save, and **no mod could repair it** (BUG 3 in
[`docs/05-bug-report-for-hotbunny.md`](05-bug-report-for-hotbunny.md), seven QA
rounds on game 1.1.2).

## Why it is worth testing now — three independent changes

1. **`Twotter.createUser(options?)`** exists and documents "sensible defaults
   for missing fields" — the defaults-filling creation path the bug's fix
   suggested.
2. **`updateUser(id, patch)` and `removeUser(id)`** now exist. The old report's
   point 4 was *"no mod can repair it"*, and these are exactly the repairs:
   `getUserById` hands back a copy, `updateUser` is the call that reaches the
   stored record, `removeUser` deletes it and what referenced it.
3. **1.3.0 claims the fix, with save repair**: "a content pack could break
   Twotter permanently … Affected saves are repaired on load."

## The probe — `qe24 twotter` (harness 1.0.9)

Rows T-01…T-07, in [`reference/sdk-0.24-qa/STATUS.md`](reference/sdk-0.24-qa/STATUS.md):

| Row | Does |
| --- | --- |
| T-01 | `seed` → search `qe24_probe`: the API account is browsable (API path works). |
| T-02 | `bad` → search `qe24_badrecord`: **the exact r31 shape** (bio present and `undefined`) must not crash search. |
| T-03 | Save → quit to menu → reload → `status`: is the bad bio repaired on load? |
| T-04 | `update` → `updateUser` ×2 must return `true` (the repair no mod could do). |
| T-05 | `post` → the tweet is on the profile; `Twotter.PostSeen` fires. |
| T-06 | `cleanup` → `removeUser` ×3 `true`, handles gone (accounts are removable at all). |
| T-07 | Open the profile of `qe24_declared` — a **quest-declared** account: the bio shows → the write path is fixed, not just search. |

Decisions the results drive (spelled out in `STATUS.md`): all green → re-
implement; T-02 red → the fence stays and SteelWaffe gets the crash log; T-02
green with T-07 red → ship against the API only, never the declarative path;
T-06 red → do not ship accounts at all.

Two details that matter: the bad record plants `bio` **present and undefined**
(not omitted — that is the shape the save actually held, and the test suite
asserts it so the probe cannot rot into a no-op), and `createUser` is
deliberately *not* used to build it, since filling missing fields is the exact
thing under test.

## The probe has its own tests now

The harness is hand-authored and nothing compiled it, which has already bitten
once (r173 mangled this same file). `sdk024QaScaffold.test.ts` loads the real
`mod/dist/mod.js` against a stub SDK and drives the whole probe: **10 new tests**
(registration, event wiring — including that someone else's account does *not*
tick our objectives, seed/bad/status/update/post/cleanup, the
"no Twotter API" path, and the planted-record shape). The stub emulates the
engine registering quest-declared accounts, because that is what T-07 asks about.

## Housekeeping

- r178's "nothing to run in this folder" wording was wrong the moment this probe
  existed; the QA `README.md` and `STATUS.md` now say plainly that this is the
  one open probe.
- Export regenerated for the build stamp only (mod **1.0.7**) — the probe lives
  in the raw harness, which the export guard does not compile.
- The probe's guide also asks for a two-second `curl http://qe24-http.test/`
  check on the 1.3.1 build: 1.3.0's changelog claims curl was added, and the
  tested build lacked it.

Gates: `npm run typecheck` 0 errors; `npm test` **1,644 passed / 82 files**
(was 1,634 — +10, the probe's suite); `npm run build` succeeds; `node --check` on
the patched harness; `gen:manual` and `gen:qa-export` regenerated. Falsified:
the probe's planted-record assertion and the event wiring.

Stamp: `2026-09-18.r179`.

Supporting notes:

- [`plans/r179-twotter-probe.md`](plans/r179-twotter-probe.md)
- [`plans/r178-qa-closeout-and-s04.md`](plans/r178-qa-closeout-and-s04.md)

---

# Handoff — r178

r178 closes the in-game QA effort and answers its last open question. It is a
documentation-and-tooling round: no editor behaviour changed, no new guards
(and §*S-04* below says why one was not needed).

- **S-04 is answered: the in-game clock displays the machine's local time.**
  `qe24 clock` printed `Time.now` as 20:15 local / 18:15 UTC while the taskbar
  clock read **20:17** — the local rendering matches. So the `at` mode's
  timezone correction (`Date.UTC(...) − tz` in `computeTimerFireAt`) is correct
  as shipped and **stays**; the code comment now records that instead of
  holding the question open, and the r173 plan's S-04 row is marked answered.
  **The guard needed repairing first**: the `at`-mode test asserted the
  corrected value using the *ambient* timezone offset, which is 0 on this
  sandbox (and any UTC CI), so falsification showed it passing with the
  correction deleted. It now fakes a UTC+2 machine inside the test, and the
  deletion fails it — checked by doing exactly that.
- **`reference/sdk-0.24-qa/` is no longer a checklist.** A new `STATUS.md` is
  the one-page ledger: *verified* (the r166 surface, all Pass on 2026-09-16, plus
  the editor Wi-Fi/website rows, plus S-04), *blocked / deliberately
  unsupported* (`curl` — absent in the tested build even though the 1.3.0
  changelog adds it, so one re-check on a newer build; DNS-only collaborator;
  editor HTTP on static sites; the Bettercap `SSID: undefined` display wart),
  and *not run* — the honest table: the Timer rows **S-01…S-03 and S-05…S-15
  have no tester report in this repo**, because they were written in plan docs
  rather than in the folder's own README. They are unit-tested and not
  blockers; the ledger says where to run them if a future round ever needs the
  belt and braces.
- **The README was cut** from 199 lines of finished procedures (quick passes,
  intercept walkthrough, editor-export route) to a folder map, install steps,
  the harness command list and the safety notes. Nothing left to re-run by
  accident.
- **The raw harness stops printing test rows**: `qe24 guide` and `qe24 next`
  used to list the finished checks, which is exactly what a tester sees first.
  Mod **1.0.8** prints "every check is closed — results in
  `reference/sdk-0.24-qa/STATUS.md`" and keeps the commands as tooling. The
  hand-edited file was patched with an assert-guarded script and passed
  `node --check`.
- **Export regenerated** at mod **1.0.6**, editor build `2026-09-18.r178`
  (byte-guarded). The only emitted change is the settled comment.
- **Twotter is back on the table, with evidence.** Zeis's new
  `docs/Game-Patch-1.3.0-1.3.1.md` records that 1.3.0 *fixed the exact crash
  that forced the r31 removal* — "a content pack could break Twotter
  permanently … affected saves are repaired on load". The root README's Next-up
  row now points at a Twotter re-implementation feasibility read as the next
  round.

Gates: `npm run typecheck` 0 errors; `npm test` **1,634 passed / 82 files**
(unchanged — the round adds no tests, deliberately: the one decision it settles
was already guarded); `npm run build` succeeds; `npm run gen:manual` (build
stamp swept to r178) and `npm run gen:qa-export` regenerated. Nothing visual is
claimed.

Stamp: `2026-09-18.r178`.

Supporting notes:

- [`plans/r178-qa-closeout-and-s04.md`](plans/r178-qa-closeout-and-s04.md)
- [`plans/r177-every-unit.md`](plans/r177-every-unit.md)

---

# Handoff — r177

r177 closes the gap Zeis found the moment he opened r176's Timer: the
coming-day offset was **one amount × one unit**, so "in 1 month 2 weeks 2 days,
at 18:23" had no home. Both relative rows now take one box per unit, and — his
standing instruction — Wait gained the calendar units too, so nothing an author
can name is unreachable. Plan: [`plans/r177-every-unit.md`](plans/r177-every-unit.md).

- **A coming day** counts `offsetYears` / `offsetMonths` / `offsetWeeks` /
  `offsetDays` from now and pins the clock time (r176's clock panel). The
  calendar clamp is applied **once, on the calendar part, before weeks and
  days**: 31 Jan + 1 month = 28 Feb, and + 1 day after that = 1 March — never
  3 March, because 31 January's day number would otherwise roll through
  February.
- **Wait** takes every unit (`years` / `months` / `weeks` / `days` / `hours` /
  `minutes`), all summed. It keeps the SDK's own
  `Scheduler.schedule({days, hours, minutes})` whenever no calendar unit is
  set — the exact path in-game rows S-01/S-02 verified — and switches to
  `scheduleAt` only when months or years are involved, because the engine's
  duration form has no month field.
- **No hours/minutes boxes on the coming-day row, deliberately**: it pins a
  time of day, so "at 18:23 plus 4 hours" would be a second way to write
  "at 22:23". The freedom landed in Wait instead. A "keep whatever time of day
  it is now" clock option is the honest way to add it later (§D3 of the plan).
- **Words in one place**: `src/schema/timer.ts` now holds one six-unit
  vocabulary with three readers — `unitsPhrase` (the preview sentence),
  `unitsShort` (the canvas card: `in 1y 1mo 2w 2d at 18:23`) and
  `unitsReadback` (the row's `= …` line, normalising days/hours/minutes among
  themselves only, since a month has no fixed length).
- **Migration**: r176's `offsetAmount` + `offsetUnit` move into the box for
  their unit and disappear. The pre-r176 `offsetDays` key kept its name through
  both rounds, so a draft from r172–r175 is already in the current shape and is
  **not rewritten at all** — that is now asserted.
- **Export**: regenerated at mod **1.0.5**, build r177, byte-guarded. New QA
  rows **S-13–S-15** (mixed offset, Wait in months, an r176-era draft behaving
  identically). S-04 (`qe24 clock`) still decides the `at` timezone correction.

Gates: `npm run typecheck` 0 errors; `npm test` **1,634 passed / 82 files** (was
1,620 — +14); `npm run build` succeeds; `npm run gen:manual` (149 editable
fields now, chip and stamps swept to r177) and `npm run gen:qa-export`
regenerated. Eight guards falsified by revert: the clamp, weeks in a daytime
offset, the month→`scheduleAt` switch, weeks folded into days, the migration,
the card's unit words, the readback's normalisation, and the row walkers.
Nothing visual is claimed — the row layout is Zeis's check.

Stamp: `2026-09-18.r177`.

Supporting notes:

- [`plans/r177-every-unit.md`](plans/r177-every-unit.md)
- [`plans/r176-timer-calendar-ux.md`](plans/r176-timer-calendar-ux.md)

---

# Handoff — r176

r176 is the Timer's UI/UX round: the node now looks and reads like the game's
own clock, and "in N days" became a real relative rule — in **N days / weeks /
months / years** from now, at a clock time. The approved plan is
[`plans/r176-timer-calendar-ux.md`](plans/r176-timer-calendar-ux.md).

- **The clock.** New `clock` field kind: a dark inset panel with zero-padded
  24-hour digits in the bundled Roboto Mono, ▲▼ steppers and ↑/↓ keys that wrap
  *locally* (23↔00, 59↔00) so a keypress never silently changes the day the
  timer lands on. The flourish is CSS-only — the colon breathes while the
  control has focus, a digit flips once when it changes (the span is keyed by
  the value), nothing runs per frame — and both animations are dropped under
  `prefers-reduced-motion`. It reads and writes the same two number fields, so
  the manual, the labels and the voice entries are unchanged.
- **Rows and the segmented picker.** New `row` layout kind (fields inline,
  children keep their own label, hint and warning) and `select.display =
  "segmented"` for the mode picker (Wait / A coming day / An exact date). The
  Wait row shows unit captions and a normalising readback ("25 hours" → "1 day,
  1 hour") without changing what is stored. The exact-date month is now a
  `select` of names (`numeric` stores `Number(choice)`), and the day field
  warns when the calendar has no such day ("31 June never arrives — June has
  30 days").
- **Relative units.** `offsetDays` split into `offsetAmount` + `offsetUnit`
  (`days` / `weeks` / `months` / `years`), migrated silently in
  `schema/migrate.ts`; `computeTimerFireAt` resolves the rule at arm time
  against `Time.date()` and clamps short months (31 Jan + 1 month = 28 Feb, 29
  in a leap year; 29 Feb + 1 year = 28 Feb). The arm log now prints the rule
  before the ISO timestamp, so a tester can compare it with the inspector.
- **Words in one place.** `src/schema/timer.ts` holds the calendar vocabulary
  (`clockText`, `dateText`, `isRealDate`, `durationSentence`, `timerSentence`),
  shared by the inspector preview (new `NodeTypeDef.preview` hook, rendered by
  `InspectorPanel`), the canvas card and the field warnings.
- **Manual + export.** Rows and the clock are transparent to the manual
  extractor and to every walker (`schema.test.ts`, `manual.coverage.test.ts`,
  `extract-manual-inventory.mjs`, `build-node-pages.mjs`), so children are
  documented exactly as if stacked; the voice entry was renamed to
  `offsetAmount` / `offsetUnit`. Export regenerated at mod **1.0.4**, build
  r176.
- **Open: S-04.** The `at` mode's timezone correction still stands until Zeis
  runs `qe24 clock` in game (raw harness 1.0.7). New rows **S-09–S-12** cover
  the relative rule, the short-month clamp, the `NEXT EVENT` readout and the
  silent `after` migration.

Gates: `npm run typecheck` 0 errors; `npm test` **1,620 passed / 82 files**
(was 1,594 / 81 — +10 timer calendar, +5 schedule-beat calendar, +4 migration,
+4 field warnings, +3 card summaries); `npm run build` succeeds; `npm run
gen:manual` and `npm run gen:qa-export` regenerated their artifacts; the
manual's pages and search index are stamped `2026-09-18.r176`. Nothing visual
is claimed by tests — the clock's look is Zeis's check.

Stamp: `2026-09-18.r176`.

Supporting notes:

- [`plans/r176-timer-calendar-ux.md`](plans/r176-timer-calendar-ux.md)
- [`plans/r175-qa-export-and-leftovers.md`](plans/r175-qa-export-and-leftovers.md)

---

# Handoff — r175

r175 is the clean-up round that unblocks Zeis's in-game testing of the
game/SDK catch-up. Three of the four items came from the r174 audit's
"left for a decision" list; the fourth was the stale Quest-tab warnings.

- **The installable QA export is current again.**
  `reference/sdk-0.24-qa/editor-export/` is regenerated from
  `projects/sdk-0.24-ingame-qa.project.json` with `npm run gen:qa-export`
  (new script) at editor build r175, mod **1.0.3**, and carries both quests —
  `QESdk024EditorQa` and the Timer's `QESdk024TimerQa` (S-01 fire, S-02 reload
  survival, S-03 cancel). It had been the r166 artifact with one quest. The
  compiled README is the compiler's own; the QA notes live in
  `editor-export.notes.md` and the generator appends them, so nothing
  hand-written is lost. `src/compiler/__tests__/sdk024QaExport.test.ts`
  compiles the project in-process and compares every byte, then fails on a
  file the compiler does not emit.
- **The manual's "When it appears" rows name the value.** The generator used
  to write "Only once *When it fires* is set." for every conditional field —
  never true for a select with a default, and it never said which value
  reveals the field. It now writes "Shown while **When it fires** is **After a
  delay** — the option it starts on. The other options hide it." or "Shown
  only when … is …" for the other values, lists array gates with "or", and
  keeps the old sentence only when a gate carries no `equals`. G16 fails a row
  that names fewer than two `.ui` labels. Manual regenerated (39 node types /
  143 fields / 74 sockets) and the hand-written pages' stamps swept to r175.
- **The stale freeze hints are gone.** **Complete automatically** and
  **Show a manual complete button** in the inspector no longer tell authors
  the game freezes; `QE24-TestResults - 3.md` shows completion, the complete
  button, retire and unclaim all clean on HackHub 1.3.0, and `docs/04` is
  already marked historical. No freeze copy is left in `src/` or the manual.
- **S-04 has a probe that needs no date edit.** The Timer `at` mode corrects
  the typed time by the machine's timezone offset, assuming the in-game clock
  displays local time. Raw harness **1.0.7** adds `qe24 clock`, which prints
  `Time.now` as raw ms, as UTC, as the machine-local rendering and as
  `Time.date()`; the tester compares those lines with the clock on screen.
  Local match keeps the correction; a UTC match drops the one line in
  `computeTimerFireAt` (the code comment says which, and now names the probe).
  The export's date-mode arm log still prints ISO next to the raw `fireAt`.

Gates: `npm run typecheck` 0 errors; `npm test` **1,594 passed / 81 files**
(was 1,590 / 80 — +3 export guard, +1 G16); `npm run build` succeeds (only the
pre-existing chunk-size warning); `npm run gen:manual` and
`npm run gen:qa-export` regenerated their artifacts. Nothing visual is
claimed.

Stamp: `2026-09-17.r175`.

Supporting notes:

- [`plans/r175-qa-export-and-leftovers.md`](plans/r175-qa-export-and-leftovers.md)
- [`plans/r174-r172-r173-audit.md`](plans/r174-r172-r173-audit.md)

---

# Handoff — r174

r174 is the read-back audit of the two Timer rounds (r172 "Schedule beat",
r173 "Timer rename + calendar modes"). Git history here is squashed to a
single root commit and `origin/main` is an unrelated r148 snapshot, so the
audit ran on code, committed artifacts, the round plans, and tests proven to
fail when a guard is reverted.

**Verdict:** the Timer itself is sound — schema, registry, analysis, runtime
(three modes, tz-corrected `at` arm pending S-04, fail-open on past or
incomplete dates, idempotent arming, cancel on complete/abandon), dry run,
manual page and tests all match the r173 plan, and the separate **Story
beat** node was correctly left untouched by the "beat" purge. Two real
defects were found and fixed:

- **The rename shipped without a migration.** An r172 draft (localStorage)
  or a `.quest-editor.json` still carrying `flow.schedule` failed
  validation: `loadDraft` discarded the draft and an import answered
  "Not a quest project — problem at quests.0.graph.nodes.0.type". Fixed in
  `schema/migrate.ts` (`case "flow.schedule"` → `flow.timer`; the delay
  fields survive, r173's fields default in) with four regression tests in
  `migrate.test.ts`, falsified by removing the case.
- **`public/manual/search-index.js` was stale** — five entries still said
  build r172 while every page said r173, because the index is generated and
  nothing checked it. Regenerated with `npm run gen:manual`, and the manual
  gate (G15) now fails on any index stamp that is not `EDITOR_BUILD`.

Also restored: the r173 plan's promised `"Timer"` label guard test now exists
(`schema.test.ts`, falsified by reverting the label), and the QA quest's
player-visible mail sender is `qe24-timer@test.net`, not `qe24-beats@test.net`.

Bookkeeping: `EDITOR_BUILD` → `2026-09-17.r174`; manual regenerated
(39 node types / 143 editable fields / 74 sockets); `docs/06` figures
refreshed; README row added and the r169 row archived.

Open for a decision (reported, not changed):

- `reference/sdk-0.24-qa/editor-export/` is still the r166 export (quests:
  `QESdk024EditorQa` only) while the QA project carries `QESdk024TimerQa`;
  r172's S-01 says "Install the refreshed QA export". Export it from the
  editor and commit it, or say in the QA README how to produce it.
- The manual generator's "When it appears" line reads oddly for fields gated
  on a select that has a default ("Only once *When it fires* is set") — a
  generator wording issue across every conditional field, not a Timer fix.
- S-04 still decides whether the `at` mode's timezone correction matches the
  in-game clock.

→ All three picked up in r175:
[`plans/r175-qa-export-and-leftovers.md`](plans/r175-qa-export-and-leftovers.md).

Supporting notes:

- [`plans/r174-r172-r173-audit.md`](plans/r174-r172-r173-audit.md)
- [`plans/r173-timer-rename-and-calendar.md`](plans/r173-timer-rename-and-calendar.md)
- [`plans/r172-schedule-beat.md`](plans/r172-schedule-beat.md)

---

# Handoff — r173

r173 is Zeis' feedback round on the r172 node: **rename + wording + calendar
modes.**

What shipped:

- **Rename:** "Schedule beat" is now the **Timer**; the internal type id
  moved `flow.schedule` → `flow.timer` (the only cheap window — r172 was
  never played in game). Palette tag, manual page (`nodes/flow-timer.html`),
  shot-list row and all references follow.
- **"Beat" purge:** the word is gone from every user-facing string of the
  node (warnings, checking.html entries, manual voice, console logs the QA
  checklist reads, QA-quest title/mail/toasts). "The beat has nothing to do"
  is now **"The timer has nothing to do"**.
- **Info text:** Zeis' sentence verbatim — "Wait X amount of time until the
  next node fires. Great for when you want the story to hold for a moment." —
  followed by the existing second sentence with "beat" → "timer".
- **Calendar modes:** a **When it fires** select with three options
  (`showWhen` hides the unused field groups):
  - **After a delay** (default) — Days/Hours/Minutes from when the story
    arrives (the r172 behavior).
  - **In N days at a set time** — *Days from now* (0 = today) + shared
    Hour/Minute, resolved against `Time.date()` at arm time via the
    local-time `Date` constructor (no timezone math). Zeis' most-likely
    use case: "in 3 days at exactly 12:00".
  - **On a specific in-game date & time** — Year/Month/Day + shared
    Hour/Minute, via `Scheduler.scheduleAt` with a player-zone correction
    for the chosen clock time.
  - Incomplete or already-past dates **fail open** (fire immediately + log),
    same policy as an empty timer. `daytime` gets no editor warning — 0 days
    and 00:00 are both legal values.
- **Dry run:** the Simulator stub gained `scheduleAt`; every mode fires
  through the real registered handler in the collapsed clock.
- **QA vehicle:** `QESdk024BeatQa` → **QESdk024TimerQa** (player-visible
  strings de-beated); new checklist rows S-04 (timezone probe — the arm log
  prints `fireAt` + ISO string for comparison with the on-screen clock),
  S-05 (daytime fire across a reload), S-06 (past time → immediate), S-08
  (optional multi-day offset watch).
- Manual regenerated at **39 node types / 143 editable fields / 74 sockets**
  (mode + 7 new fields); `checking.html` entries reworded and
  `msg-beat-nothing-to-do` → `msg-timer-nothing-to-do`.
- Node Reference template example now demonstrates `daytime` mode
  (in 3 days at 12:00) — one deliberate deviation from the plan, which said
  keep the `after` example; the new mode is the headline feature.

Validation for this pass: `npm run gen:manual`, targeted Vitest (13 timer
runtime tests incl. a fixed-clock `daytime` arm and the tz-corrected `at`
arm), `npm run typecheck`, `npm test` (**1,584 tests / 80 files**),
`npm run build`, and `git diff --check`. One hiccup: an edit mangled
`runtimeSource.ts` (truncated it mid-file); caught by typecheck, restored
from git, and the change was re-applied through a verified replacement
script.

Owed to Zeis (in game): S-01…S-03 on QESdk024TimerQa (unchanged), plus the
new S-04…S-08 rows, and the `node-flow-timer-inspector.png` screenshot.

Supporting notes:

- [`plans/r173-timer-rename-and-calendar.md`](plans/r173-timer-rename-and-calendar.md)
- [`plans/r172-schedule-beat.md`](plans/r172-schedule-beat.md)

Next-up from the SDK 0.24 comparison: focused Mail QA for `Mail.send()` ids,
`Mail.remove()` and `replyable`; fresh Twotter update/remove QA; phone-proxy
QA if xu can provide concrete evidence; then the contact/branching template
queue. HTTP nodes stay fenced until SteelWaffe clarifies/fixes `curl`,
DNS-only collaborator hits and static-site HTTP event semantics.
Suspicion/log-forensics and SMS remain absent from the pinned SDK.

Older handoff sections below are retained as history.

---

# Handoff — r172

r172 ships the **Schedule beat** node: the SDK 0.24 `Scheduler` (raw, reload-proof
per the r166 probe) is now an editor surface.

What shipped:

- `flow.schedule` — **Schedule beat** under Flow control. Fields: **Days**,
  **Hours**, **Minutes** of game time (the in-game clock runs at 60×, so 2
  in-game minutes is 2 real seconds). One **Out** socket.
- Runtime (generated mod code, one block per quest): registers a beat handler
  at mod load, schedules the job at **OnStart** (re-armed from the stored job
  when the quest resumes from a save), re-arms itself up to 20 ticks when the
  job is due before the quest is live, and cancels the beat on **OnComplete** /
  **OnAbandon** so a finished quest cannot fire later.
- Two new **Worth checking** warnings, both documented in the manual's message
  index: **Nothing scheduled** (no time set — the beat fires immediately) and
  **The beat has nothing to do** (time set, **Out** unwired — the story stops at
  the beat).
- Node Reference template: gains one Schedule beat row with example values
  (1 day, 2 hours, 30 minutes); its node count moves 48 → 49. (While there:
  the Wait example carried the stale key `ms`, which the node does not have —
  it now uses `seconds: 2.5`.)
- Manual regenerated at **39 node types (39 obtainable, all palette-visible)**,
  **136 editable fields**, **74 sockets**; `checking.html` gained the two new
  message entries; the shot list gained `node-flow-schedule-inspector.png`
  (capture still owed to Zeis with the in-game QA pass).
- QA vehicle: `reference/sdk-0.24-qa` now ships a second auto-start quest,
  **QESdk024BeatQa** — beat A at 2 in-game minutes (mail + toast = S-01 fire),
  beat B at 2 in-game hours (S-02 reload survival; S-03 cancel when the quest
  is completed or abandoned first). The scaffold test locks the quest's shape
  and the emitted scheduler code.

Validation for this pass: `npm run gen:manual`, targeted Vitest for the
scheduler runtime, warnings, template and manual coverage, `npm run typecheck`,
`npm test` (**1,577 tests / 80 files**), `npm run build`, and
`git diff --check`.

Owed to Zeis (in game): S-01 fire, S-02 reload, S-03 cancel on
QESdk024BeatQa, plus the screenshot `node-flow-schedule-inspector.png`.

Supporting notes:

- [`plans/r172-schedule-beat.md`](plans/r172-schedule-beat.md)
- [`plans/r171-inspector-polish-and-phone-proxy-investigation.md`](plans/r171-inspector-polish-and-phone-proxy-investigation.md)
- [`plans/r166-sdk-0.24-ingame-qa.md`](plans/r166-sdk-0.24-ingame-qa.md)

Next-up from the SDK 0.24 comparison: focused Mail QA for `Mail.send()` ids,
`Mail.remove()` and `replyable`; fresh Twotter update/remove QA; phone-proxy QA
if xu can provide concrete evidence; then the contact/branching template queue.
HTTP nodes stay fenced until SteelWaffe clarifies/fixes `curl`, DNS-only
collaborator hits and static-site HTTP event semantics. Suspicion/log-forensics
and SMS remain absent from the pinned SDK.

Older handoff sections below are retained as history.

---

# Handoff — r171

r171 is a small polish pass plus the first phone-proxy evidence note.

Current shipped state:

- Editor build stamp is `2026-09-17.r171`; SDK remains
  `@hotbunny/hackhub-content-sdk@0.24.0`.
- Manual inventory still reports **38 node types / 38 obtainable**, **133 editable
  fields**, **72 sockets**, **10 categories**, **99 events**, and no manual
  exclusions.
- Field-level warning popovers now use an opaque `bg-surface-2` panel with a
  stronger warn/danger border. The orange **Worth checking** tooltip is readable
  even when it overlaps the inspector or canvas.
- The docked inspector pull tab is flipped outward: it protrudes into the canvas
  with its rounded edge facing away from the inspector.
- Phone-proxy investigation status: pinned SDK 0.24.0, HotBunny docs, the local
  handbook and official quest transcriptions show phone Dialog trees and custom
  PhoneApp UIs, but no declared API/event for listening to a third-party phone
  call. Keep phone-proxy/eavesdrop authoring fenced until xu can provide an exact
  snippet, SDK call, or in-game route and a raw QA probe passes.

Validation for this pass: `npm run gen:manual`, targeted Vitest for the warning
badge and floating inspector, `npm run typecheck`, `npm test` (**1,561 tests /
79 files**), `npm run build`, and `git diff --check`.

Supporting notes:

- [`plans/r171-inspector-polish-and-phone-proxy-investigation.md`](plans/r171-inspector-polish-and-phone-proxy-investigation.md)
- [`plans/r170-ui-prompt-node.md`](plans/r170-ui-prompt-node.md)
- [`plans/r169-phone-end-flow-and-quest-endings.md`](plans/r169-phone-end-flow-and-quest-endings.md)

Next-up from the SDK 0.24 comparison: focused Mail QA for `Mail.send()` ids,
`Mail.remove()` and `replyable`; fresh Twotter update/remove QA; phone-proxy
QA if xu can provide concrete evidence; a deliberate Scheduler/Time design pass;
then the contact/branching template queue. HTTP nodes stay fenced until
SteelWaffe clarifies/fixes `curl`, DNS-only collaborator hits and static-site
HTTP event semantics. Suspicion/log-forensics and SMS remain absent from the
pinned SDK.

Older handoff sections below are retained as history.

---

# Handoff — r170

r170 exposes SDK `UI.prompt` as a small author-facing Effects node named
**Ask player**.

Current shipped state:

- Editor build stamp is `2026-09-17.r170`; SDK remains
  `@hotbunny/hackhub-content-sdk@0.24.0`.
- Manual inventory reports **38 node types / 38 obtainable**, **133 editable
  fields**, **72 sockets**, **10 categories**, **99 events**, and no manual
  exclusions.
- `fx.prompt` is palette-visible under Effects as **Ask player**. It asks the
  player for one line of text with optional title, question, example text,
  pre-filled answer and masked typing.
- The node can save the submitted answer to quest data, so later text can use
  `{{data.name}}`-style tags.
- In open mode the node exposes **Submitted** and **Cancelled**. In checked mode
  it exposes **Correct**, **Wrong** and **Cancelled**. Checked modes support exact
  answer, contains and pattern matching; blank accepted answers are warned about
  and never match at runtime.
- Runtime calls `sdk.UI.prompt(options)`, treats only `null`/`undefined` as
  cancel, and treats an empty string as a real submitted answer.
- Dry run stubs `UI.prompt`, logs the simulated answer, and continues the graph;
  export permissions now include `ui` when Ask player is used.
- The generated handbook/manual has a new Ask player page and the public manual
  indexes/Node Reference counts are regenerated for r170.

Validation for this pass: `npm run gen:manual`, targeted Vitest for
schema/compiler/analysis/qa/templates/simulator/manual coverage,
`npm run typecheck`, `npm test` (**1,560 tests / 79 files**), `npm run build`,
and `git diff --check`.

Supporting notes:

- [`plans/r170-ui-prompt-node.md`](plans/r170-ui-prompt-node.md)
- [`plans/r169-phone-end-flow-and-quest-endings.md`](plans/r169-phone-end-flow-and-quest-endings.md)
- [`plans/r167-wifi-exposure-and-sdk024-roadmap.md`](plans/r167-wifi-exposure-and-sdk024-roadmap.md)

Next-up from the SDK 0.24 comparison: focused Mail QA for `Mail.send()` ids,
`Mail.remove()` and `replyable`; fresh Twotter update/remove QA; a deliberate
Scheduler/Time design pass; then the contact/branching template queue. HTTP
nodes stay fenced until SteelWaffe clarifies/fixes `curl`, DNS-only collaborator
hits and static-site HTTP event semantics. Suspicion/log-forensics and SMS remain
absent from the pinned SDK.

Older handoff sections below are retained as history.

---

# Handoff — r169

r169 implements the two surfaces cleared by SDK 0.24 / game 1.3.0 QA:
phone-call end flow and real quest-ending nodes.

Current shipped state:

- Editor build stamp is `2026-09-16.r169`; SDK remains
  `@hotbunny/hackhub-content-sdk@0.24.0`.
- Manual inventory reports **37 node types / 37 obtainable**, **124 editable
  fields**, **68 sockets**, **10 categories**, **99 events**, and no manual
  exclusions.
- Phone `comms.dialogue` nodes now expose **Out fires** in the inspector and
  Dialogues modal. Default is **When the call ends**; **Right after starting the
  call** keeps the old immediate behavior. The compiler maps the end timing to
  `QuestDialogSpeech.onEnd` on ending lines and `QuestDialogOption.onSelect` on
  ending options. No fake phone events were added to the When-event picker.
- Quest-ending nodes are back as terminal effect nodes:
  `fx.completeQuest` → `this.complete()`, `fx.retireQuest` → `this.retire()`,
  and `fx.unclaimQuest` → `Quest.unclaim(name)` with a blank name defaulting to
  the current quest.
- If an objective's **On complete** wire reaches one of those terminal nodes
  synchronously, the runtime defers the quest-ending call until after
  `completeObjective(...)` so the final objective visibly ticks before the
  quest entry goes away.
- `entry.complete` wording and graph warnings now say it runs after a deliberate
  finish path instead of claiming completion is unreachable by default.
- The generated handbook is regenerated at r169, with new pages for
  Complete/Retire/Unclaim quest and updated phone Dialogue prose.

Validation for this pass: `npm ci`, `npm run gen:manual`, targeted Vitest for
compiler/schema/dialogue/analysis/templates, `npm run typecheck`, `npm test`
(**1,548 tests / 79 files**), and `npm run build`.

Supporting notes:

- [`plans/r169-phone-end-flow-and-quest-endings.md`](plans/r169-phone-end-flow-and-quest-endings.md)
- [`plans/r168-phone-onend-completion-qa.md`](plans/r168-phone-onend-completion-qa.md)
- [`plans/r166-sdk-0.24-ingame-qa.md`](plans/r166-sdk-0.24-ingame-qa.md)

Next-up from the SDK 0.24 comparison: focused Mail QA for `Mail.send()` ids,
`Mail.remove()` and `replyable`; a deliberate Scheduler/Time design pass; HTTP
nodes only after SteelWaffe clarifies/fixes `curl`, DNS-only collaborator hits
and static-site HTTP event semantics. Suspicion/log-forensics and SMS remain
absent from the pinned SDK.

Older handoff sections below are retained as history.

---

# Handoff — r168

r168 adds a focused raw QA check for the old phone-call completion freeze. SDK
0.24 declares Kisscord/WeeChat/Mail events, but **no phone/dialog end event**;
phone `onEnd` is a callback on `QuestDialogSpeech`, not a `ModEventMap` entry.

Added to `reference/sdk-0.24-qa/mod` harness version `1.0.6`:

- `qe24 claim phone-auto` then `qe24 phone-auto`: final phone line calls
  `completeObjective("phone-ended")`; Zeis reported `AutoComplete = true` finished the
  quest without freezing.
- `qe24 claim phone-direct` then `qe24 phone-direct`: final phone line calls
  `this.complete()` from `onEnd`; Zeis reported it finished without freezing.

Zeis ran both probes in game and reported they worked. The r169 editor surface
therefore uses the Dialogue-node callback model, not a fake global phone event.

Supporting note: [`plans/r168-phone-onend-completion-qa.md`](plans/r168-phone-onend-completion-qa.md).

---

# Handoff — r167

r167 exposes **Create Wi-Fi** after the r166 SDK 0.24 in-game QA pass. The
current shipped state is:

- `@hotbunny/hackhub-content-sdk@0.24.0` is pinned and the generated event
  catalogue has **99** events.
- `world.wifi` is palette-visible, add-searchable, covered by the Node
  Reference template, and documented in the generated handbook.
- Wi-Fi exports through SDK 0.24's native `Network.createWifiNetwork` path when
  available, with BSSID, numeric channel and WPS carried through; the older
  router fallback remains only for older game builds/imports.
- The Bettercap `SSID: undefined` behaviour for SDK-created APs is documented
  as an informational game/runtime display wart, not an editor blocker.
- Wi-Fi-specific dice buttons generate BSSIDs and WPA-style passphrases.
- Manual inventory now reports **34 node types / 34 obtainable**, **123 editable
  fields**, **65 sockets**, **10 categories**, and no manual exclusions.
- Full validation for this pass: `npm run gen:manual`, `npm run typecheck`,
  `npm test` (**1,527 tests / 79 files**) and `npm run build`.

Next-up from the SDK 0.24 comparison: focused Mail QA for `Mail.send()` ids,
`Mail.remove()` and `replyable`; a deliberate Scheduler/Time design pass; HTTP
nodes only after SteelWaffe clarifies/fixes `curl`, DNS-only collaborator hits
and static-site HTTP event semantics. Suspicion/log-forensics and SMS remain
absent from the pinned SDK.

Supporting notes:

- [`plans/r167-wifi-exposure-and-sdk024-roadmap.md`](plans/r167-wifi-exposure-and-sdk024-roadmap.md)
- [`plans/r166-sdk-0.24-ingame-qa.md`](plans/r166-sdk-0.24-ingame-qa.md)
- [`03-questions-for-the-developers.md`](03-questions-for-the-developers.md)

Older handoff sections below are retained as history.

---

# Handoff — r163

r163 ships a proper **standalone user manual** (plan:
[plans/r163-user-manual.md](plans/r163-user-manual.md)) — the user asked for a
simple standalone HTML file documenting every feature, step, and item of the
editor. Structure inspiration only: https://fuibar.xo.je/manual.html (single
page, sticky section nav, key-cap tables, dense prose). Content is entirely
ours and verified against the code.

**Deliverable:** [`public/manual.html`](../public/manual.html) — one
self-contained file, inline CSS, no JS, no build step; opens off disk or ships
with the app (Vite copies `public/` verbatim, confirmed at `dist/manual.html`).
Sticky left-nav, 18 numbered sections: introduction, getting started, the
workspace (top bar/quest strip, palette, canvas, inspector, status/issues),
building a quest, a full node reference of all **34** node types across their
**10** categories, sockets & wires, Dialogues, Websites, the **92** events (ten
groups), Generate (dice) & tags, Addons, the **13** templates, Dry run, export
(zip contents), Settings (6 themes, 7 fonts, canvas grid, wires), the complete
keyboard/mouse cheat sheet (mirrors `SHORTCUT_GROUPS`), saving, and notes/limits
(Wi-Fi and On-quest-complete caveats).

**Counts re-verified from code, not the stale r148 doc:** 34 node types
(`registry.ts`), 10 categories (`CATEGORIES`), 13 templates
(`templates/index.ts`), 92 events + SDK 0.21.0
(`reference/hackhub-events.json`), shortcuts (`shell/Overlays.tsx`), export
files (`compile.ts`/`ExportDialog.tsx`), themes/fonts
(`settings/theme.ts`,`uiFont.ts`).

Documentation only — no compiler output touched, so `EDITOR_BUILD` stays
`2026-09-14.r162`. Gates: typecheck clean, **1,498 tests / 77 files**, build OK.
README trimmed (r158 → archive).

Roadmap unchanged: Next-up is templates only (1 contact-driven story, 2
branching consequence), both **postponed by the user** until the game + SDK
properly update.

---

# Handoff — r162

r162 finishes the auto-generate feature (plan:
[plans/r162-dice-icon-and-long-tail.md](plans/r162-dice-icon-and-long-tail.md)),
three things the user asked for after trying r161:

1. **Real dice icon.** r161's `dice` was a stroked square that read as a text
   box. `Icon.tsx` gained a `FILLED_ICONS` registry (`{ viewBox, paths[] }`,
   rendered `fill=currentColor stroke=none`) so the user's filled 32×32 vector
   die drops in; the old square path is gone.
2. **Service-aware, rule-compliant Version.** New `versionNumber()` →
   `[1-9].[0-99].[0-99]` (the game's rule). `serviceVersion(ctx)` reads
   `ctx.service` via `SERVICE_SOFTWARE` (ssh→OpenSSH/Dropbear, http→Apache/nginx,
   …; unknown/blank → `GENERIC_SOFTWARE`) and appends a fresh compliant version,
   so a port's Version banner always matches its Service and never gets rejected.
   `GenContext` gained `service`; `Field.tsx`'s reuse map learns the `service`
   key. The old fixed `SERVICE_BANNERS` list is removed.
3. **Long tail wired.** Port Service (`serviceName`) + Version (`serviceVersion`
   reusing service); world.port `port.service`; vuln Version; Pay From IBAN
   (`iban`) + From name (`initialName`); Wi-Fi SSID (new `ssid()` from
   `SSID_WORDS`/`SSID_SUFFIXES`); sims — Mail from (`email`), Kisscord handle
   (`username`), WeeChat host (`domain`) + per-line username (`username`).

Still editor-only: nothing reaches the compiler/runtime/export, fieldAudit
unaffected. Tests: generate.test.ts (+versionNumber/service-match/ssid,
−fixed-banner) and generateButton.test.tsx (+Version reuses Service). Gates:
typecheck clean, **1,498 tests / 77 files**, build OK. Stamp
`2026-09-14.r162`. README trimmed (r157 → archive).

**Zeis's eyes only:** the dice now looks like a die. Create-network → a device →
Ports → type a Service (e.g. ssh), then roll Version → an OpenSSH banner. Pay
node From IBAN/From name; Wi-Fi SSID; Mail From; Kisscord/WeeChat handles.

Roadmap: the auto-generate feature is done. Next-up is templates only — 1
contact-driven story, 2 branching consequence.

---

# Handoff — r161

r161 adds the auto-generate (dice) button, Next-up #1 (plan:
[plans/r161-autogen-dice-button.md](plans/r161-autogen-dice-button.md)). A flat
`dice` glyph beside name/IP/domain fields fills them with a realistic
**hardcoded** value in the editor — distinct from the existing sparkle/tag
button, which inserts a runtime `{{…}}` tag; IP-type fields now show both. The
engine is pure and seedable: `src/lib/generate/wordlists.ts` (curated lists) +
`index.ts` (`generateField(kind, ctx, options, rng)`), composing values from the
lists rather than a flat product, and reusing sibling values (first/last name,
company) to stay coherent — it *reads* siblings but only ever *writes* its own
field, so one click is one undo step. IPs come `"public"` or `"private"`
(RFC-1918) per field.

Fields opt in with a `generate` descriptor on `FieldDef`
(`{ kind, ipFlavour?, reuse?, label? }`), rendered by `Field.tsx` via a new
`GenerateButton`; a `trailing` slot was threaded through
`TokenInsert`/`SelectOrCustom` so a field can carry sparkle + dice. Hand-written
surfaces (quest Employer in `InspectorPanel`, the device tree) use the
`TextInputWithGenerate` wrapper. Wired: employer (first/last/e-mail, reuse),
devices (IP-private/hostname/domain/router-model), user rows
(username/first/last/e-mail, reuse), and every IP/host field (network device,
port, files, firewall, domain resolves-to, database host) + domain node domain +
database username. Nothing reaches the compiler/runtime/export — the dice writes
plain text through the normal path, so `fieldAudit` is unaffected. Tests:
`lib/generate/__tests__/generate.test.ts` (13, stubbed rng) +
`inspector/__tests__/generateButton.test.tsx` (5). Gates: typecheck clean,
**1,493 tests / 77 files**, build OK. Stamp `2026-09-14.r161`. README trimmed
(r156 → archive).

**Zeis's eyes only:** Quest tab → Employer → roll First/Last, then E-mail (it
picks up the names). Create-network → a device → the dice on IP / Hostname /
Domain / Router model. Any IP field shows the dice next to the sparkle.

Roadmap: Next-up is now 1 the dice **long tail** (service/version, IBAN, SSID,
sims handles), then the two templates last (2 contact-driven, 3 branching).

---

# Handoff — r160

r160 reworks the inspector edge handle into a real drawer pull (plan:
[plans/r160-inspector-drawer-pull.md](plans/r160-inspector-drawer-pull.md)),
from the user's annotated screenshot. The r159 grip becomes a protruding pull
tab centred on the docked inspector's left edge. **Drag it left → the docked
panel widens** (340px default/floor, up to a 640px ceiling); **pull past that
ceiling → it tears off the wall into a floating drawer** and follows the
cursor; a plain click still pops it out in place. Docked width is a new
persisted per-author preference in `drawerLayout.ts`
(`inspectorDockedWidth`/`setInspectorDockedWidth`/`clampDockedWidth`, same
`useSyncExternalStore` + localStorage shape as the float rect, never in the
mod); `App.tsx` applies it as an inline width on the expanded `<aside>` (width
transition dropped while expanded so a drag tracks the cursor). Reset re-docks
at 340px. The canvas minimap "follows the panel while docked, returns to base
when floated" needed **no code** — it already lives inside the flex-sibling
`<main>`, so it reflows for free as the panel grows/leaves (YAGNI). Gates:
**1,475 tests / 75 files** (+5), typecheck + build clean. Stamp
`2026-09-14.r160`. README trimmed (r155 → archive).

**Zeis's eyes only:** grab the pull tab on the inspector's left edge — a short
drag left makes the panel wider (watch the canvas + minimap reflow), keep
pulling to tear it off into a floating drawer, or just click it to pop out.
Settings → reset re-docks at the default width.

Roadmap: Next-up is now 1 auto-generate fields, then the two templates last
(2 contact-driven, 3 branching consequence).

---

# Handoff — r159

r159 fixes a usability miss in r158 (plan:
[plans/r159-inspector-dock-handle.md](plans/r159-inspector-dock-handle.md)).
r158 shipped the float feature behind a small dim maximize icon top-right
of the inspector — the user loaded it and could not find any way to pull
the panel out or push it in; they reached for a handle on the edge that
wasn't there. So r159 adds one: a full-height grab handle on the docked
inspector's **left edge** (new `src/editor/inspector/InspectorDockHandle.tsx`).
**Click** it to float in place; **drag** it past a 6px threshold to pull the
panel out and carry it under the cursor. The redundant top-right float icon
button is retired (KISS — one obvious way); the collapse chevron stays. The
handle is a real `<button>` (keyboard-focusable), and its pointermove/up
listeners bind to `window`, not the handle, because the docked aside — and
the handle with it — unmounts the instant the panel floats. No change to
`drawerLayout.ts`, `FloatingInspector.tsx`, the compiler, export, or the
project document. Gates: **1,470 tests / 75 files** (+1 drag-to-float case
in floatingInspector.test.tsx), typecheck + build clean. Stamp
`2026-09-14.r159`. README trimmed (r154 → archive).

**Zeis's eyes only:** the ⋮ grip on the inspector's left edge — click it to
float, or grab it and drag the panel off the wall. Drag the drawer's title
bar / bottom-right corner as before; Settings → reset re-docks it.

Roadmap: Next-up is now 1 auto-generate fields, then the two templates last
(2 contact-driven, 3 branching consequence).

---

# Handoff — r158

r158 makes the inspector a free-floating drawer (plan:
[plans/r158-floating-inspector-drawer.md](plans/r158-floating-inspector-drawer.md)),
Next-up #1. A **Float** button (maximize icon) beside the docked
inspector's collapse control pops it out; drag the title bar to move it,
drag the bottom-right grip to resize, click **Dock** to snap it back. The
layout (`docked | floating`, plus the float rect) is a per-author editor
preference in new `src/editor/inspector/drawerLayout.ts` — the same
module + `useSyncExternalStore` + localStorage shape as snap/wire prefs,
deliberately **not** in the project document (no export, no undo entry). A
`clampRect` invariant keeps the whole panel on screen so the title-bar
handle can never be dragged off an edge and lost. Floating and docked wrap
the *same* `<InspectorPanel />`, so there's one inspector, two frames — no
duplicated fields. Docked stays the shipped default and is byte-for-byte
unchanged; "reset all editor preferences" re-docks it. Gates: **1,469
tests / 75 files** (+15 in 2 new files; the clamp guard is falsified by
revert), typecheck + build clean. Stamp `2026-09-14.r158`. README trimmed
(r153 → archive).

**Zeis's eyes only:** the Float button top-right of the inspector; drag the
drawer's title bar and its bottom-right corner; Settings → reset re-docks it.

Roadmap: Next-up is now 1 auto-generate fields, then the two templates last
(2 contact-driven, 3 branching consequence).

---

# Handoff — r157

r157 refreshes the Shortcuts cheat sheet (plan:
[plans/r157-shortcuts-cheat-sheet-refresh.md](plans/r157-shortcuts-cheat-sheet-refresh.md)),
Next-up #2. The stale flat 12-row list is rebuilt as grouped sections
(Editing · Add nodes · Select · Wiring · Move around), keys drawn as key
caps and mouse gestures as plain italic text. Adds every shipped-but-
undocumented gesture — Shift+A and right-click node search, drag-a-wire-to-
empty create, double-click-a-wire reroute, box select, pan (middle/right-
drag), scroll zoom, frame title-bar drag, Ctrl+Y redo — each audited
against the code that implements it (the hook, `QuestCanvas`, React Flow
config), nothing from memory. New `shortcuts.test.tsx` drives the
documented keys through the real `useKeyboardShortcuts` hook so a future
stale row fails CI (falsified by reverting: a bogus Ctrl+Q row goes red).
No behaviour change. Gates: **1,454 tests / 73 files**, typecheck + build
clean. Stamp `2026-09-14.r157`. README trimmed (r152 → archive).

**Zeis's eyes only:** open the Shortcuts button — it now reads "Shortcuts &
gestures", grouped, with mouse actions in italics.

Roadmap note: per Zeis, the two templates are pinned to the end of Next-up.
Order is now 1 draggable inspector, 2 auto-generate fields, 3 contact-driven
template, 4 branching-consequence template.

---

# Handoff — r156

r156 is a full-program Clean Code & Architecture audit (plan:
[plans/r156-full-program-clean-code-audit.md](plans/r156-full-program-clean-code-audit.md)) —
the first whole-tree pass since r139. Finding: the codebase is in very
good shape. Macro gates all clean — pure core has no React/DOM/store
imports (AR1/AR2), no `getState()` in pure code (AR8), the only import
cycle is essential inspector-form recursion (`Field↔ListEditor↔DeviceTree`,
intra-folder, AR3-safe), boundary `safeParse` intact (AR12), permissions
declarative (AR17), escaping contained (AR16). Micro: zero
`console.log`/`as any`/`TODO`/`@ts-ignore`. One direct edit:
`store/editor.ts` now calls the existing `activeQuestOf` helper instead of
eight inlined active-quest lookups (A3 DRY, behaviour-neutral). Two
recommendations deferred (not guessed at): tighten `tokenPermissions` to
match full `{{…}}` tokens; wire ESLint/Prettier as real scripts. Gates:
**1,446 tests / 72 files**, typecheck + build clean. Stamp
`2026-09-14.r156`. README trimmed (r151 → archive).

**Zeis's eyes only:** nothing user-visible changed — the export is
byte-identical; the debug panel and export headers now read `r156`.

---

# Handoff — r155

r155 closes queue #6 (plan:
[plans/r155-ports-vuln-labels.md](plans/r155-ports-vuln-labels.md)): Telnet
+ HTTPS presets (blank versions, no-invention rule; telnet is a port label
only — the handbook says no telnet player command is verified), and
"TYPE (what it means)" vulnerability dropdown labels with raw-enum values
(exports byte-identical). Gates: **1,446 tests / 72 files**, build clean.
Stamp `2026-09-13.r155`. README trimmed (r150 → archive).

**Zeis's eyes only:** the longer port dropdown, the vuln dropdown reading
"RCE (run any command)". Remaining queue: 1 contact template, 2 branching
template, 3 floating inspector, 4 shortcuts refresh, 5 auto-generate.

r154 is the UI-words batch (plan:
[plans/r154-ui-words.md](plans/r154-ui-words.md)): Sticky note → Layout
below Group frame (registry order does it free); "Player replies" →
**Custom terminal** (the category holds one node, a custom terminal
command; dialogue prose untouched); Tools → **Addons** throughout the
user copy (button, manager, nodes, picker, README line, format doc).
Display names only — `toolpack.json`, ids, identifiers, and history docs
stay. Retires Next-up 3/4/5/7; renumbered 1–6 (old 6→3, 8→4, 9→5, 10→6 —
earlier HANDOFF references to 9/10 mean today's 5/6). Gates: **1,444
tests / 71 files**, build clean. Stamp `2026-09-13.r154`. README trimmed
(r149 → archive).

**Zeis's eyes only:** the palette's new Layout group and Custom terminal
name, the Addons button + manager, an event picker with a pack loaded.

r153 gives warnings severity (plan:
[plans/r153-warning-severity.md](plans/r153-warning-severity.md)): Zeis
read the amber cards as critical errors. Info (unlisted pages, honesty
lines, FYIs) renders light-blue, amber stays for could-cause-issues (dead
nodes, target mismatches, placeholders), red for will-break (unstartable
quests, the lynx-handle game crash, broken addresses). Levels ride
`computeWarningDetails()`; `computeWarnings()` stays a string view so no
test churn; `CompileResult`/`SimReport` carry both. Export heading turns
"Needs attention" on any red. Gates: **1,444 tests / 71 files**, build
clean. Stamp `2026-09-13.r153`. README trimmed (r148 → archive).

**Zeis's eyes only:** export anything with warnings — blue FYIs, amber
maybes, red must-fix, heading flips when red is present.

r152 is Zeis's r151 review (plan:
[plans/r152-warning-cards-event-labels.md](plans/r152-warning-cards-event-labels.md)).
The warning wording stays — he likes it. Two fixes shipped, two queued:

- **Warning cards:** export + Dry run warnings render as one amber card
  each (shared `src/components/WarningList.tsx`, `alert` triangle icon),
  the quest/host context before the first `": "` semibold so entries scan.
  Colon-less warnings render whole; markup stays flat so each warning's
  text matches one element. The Dry-run test now finds its quest heading
  by role — the warning card's `<strong>` collided with the old loose
  text match (test-only, no behaviour change).
- **House-style pack event labels:** both packs' labels rewritten from
  sentences to the built-in "Group: Thing" form ("Breach: File
  downloaded", "Scan: Finished", …) — the sentences stay in the events'
  `docs` where the picker explains them. Root cause of the mismatch: pack
  authors write the labels, and the spec taught sentences; the spec now
  teaches short labels (~40 chars) with the sentence in `docs`. Picker
  rows also carry `title` hovers so nothing truncates silently.
- **Queued:** Next-up 9 (auto-generate dice button for name/IP-like fields,
  in-editor random, exports hardcoded + the tag-insertion audit incl. the
  open question whether Create-network IP accepts the game's random-IP
  tag) and 10 (extend "Add a common port" to everything the game uses;
  display-only vuln descriptions).
- Gates: typecheck clean, **1,438 tests / 70 files**, build clean. Stamp
  `2026-09-13.r152`. README trimmed (r147 → archive).

**Zeis's eyes only:** export anything with warnings (or Dry run it) — amber
cards, quest names bold. Then the When-event picker with a pack loaded:
short "Breach: …" rows beside "Terminal: …".

r151 ships the **target-matching warnings** (plan:
[plans/r151-target-warnings.md](plans/r151-target-warnings.md)) — the second
half of Zeis's r149 split — plus a stub rider for the empty inspector his
QA screenshot caught:

- **Three warnings, intent-gated per quest per pack.** A quest "uses" a pack
  when it listens for one of the pack's events, hands data to one of the
  pack's storage keys, or runs one of the pack's nodes — and only then are
  its own targets checked: unknown services, serviced ports with blank
  versions, weaknesses nothing lines up with. Never cross-quest (a campaign
  that sets up in part 1 what part 2 exploits must not cry wolf) and never
  without targets (a pure-listener quest stays silent). Copy is gamer words
  throughout — no event names, keys, or calls.
- **Semantics re-verified against the example mod's current source**
  (recon-ng `main`, example only): services case-insensitive with aliases,
  versions a case-insensitive substring (so the editor checks completeness,
  not correctness), weaknesses case-sensitive exact. The alias read also
  found a third group (`printer` → jetdirect/raw/raw-print/pjl) no built-in
  module uses — the pack's service list stays at the 7 module-covered names,
  recorded in the plan.
- **Wiring:** new pure `src/compiler/targetWarnings.ts`;
  `computeWarnings(project, packs = [])` / `compileProject` /
  `simulateProject` all take optional packs (old call sites compile
  unchanged and stay silent); ExportDialog and SimulatorDialog pass
  `usePacks`. Closed ports skipped (inactive device ports, close/remove
  Change-port nodes).
- **Stub rider:** a `pack.node` with no action picked renders a stub naming
  its palette group ("Editor Mods · pack") instead of an empty inspector.
- **Queued, not built:** Zeis's five screenshot-review items are README
  "Next up" 4–8 (Sticky note → Layout, Player Replies rename, floating
  inspector, Tools → Addons, Shortcuts refresh).
- Process: node_modules was gone after a sandbox reset (`npm ci` brought it
  back); his screenshot was viewed via `git fetch origin QA-filedump` +
  `git show FETCH_HEAD:<path>` (no checkout, temp copies deleted) — that is
  the standing method now `/home/user/uploads/` does not exist here.
- Gates: typecheck clean, **1,436 tests / 69 files**, build clean, both new
  guards falsified by revert (alias expansion, intent gate). Stamp
  `2026-09-13.r151`. README trimmed (r146 → archive).

**Zeis's eyes only:** load the Recon-NG pack, give a quest a `telnet` port
plus a trigger on any ReconNg event, and export — the warning should read
like advice, not an error. Then click an unset Tool pack node: the stub.

r150 is Zeis's r149 eyeball feedback as a gamer (plan:
[plans/r150-pack-ux-polish.md](plans/r150-pack-ux-polish.md)) — the
warnings round moves to r151:

- **Drop zone**: the pack manager's list area accepts dropped
  `toolpack.json` files (highlight on dragover, same load path, hint
  updated) — his first instinct, now correct.
- **Save button**: footer gains explicit Save (closes the dialog). Loads
  still apply instantly — Save is the commit moment, the status line the
  receipt. Staged loads deliberately rejected (no new states).
- **Gamer-words summaries**: one shared `describePackNodeAction()` in
  `toolpacks/palette.ts` feeds the inspector and the canvas cards —
  "sends a signal to the tool mod", never "fires
  ExampleTools.Handover.Done". The inspector prefers the pack author's
  own `docs` (newly snapshotted as `nodeDocs`, default `""`); cards keep
  the short line; the data node's card drops its raw storage-key line;
  the "same {mergeBy}" note is keyless.
- **Provided-by banner**: teal `From the **X** tool pack` panel tops the
  node inspector, distinct from the warn honesty line at the bottom. No
  banner on the data node — its pack dropdown already sits at the top.
- **Renames**: "Community data" → **"Give data to a tool mod"**,
  "Community node" → **"Tool pack node"** (labels/blurbs/warning copy
  only — no type or count changes).
- Process notes: his screenshot attachment never arrived in the sandbox
  (`/home/user/uploads/` absent) — all copy verified against the code;
  and parallel same-file edits silently lost writes this round (registry
  rename, three imports, two test updates) — every one caught by
  typecheck/tests and re-applied serially with grep verification. Never
  parallel-edit one file.
- Gates: typecheck clean, **1,416 tests / 68 files**, build clean. Stamp
  `2026-09-13.r150`. README trimmed (r145 → archive).


r149 authors the **Recon-NG example pack** (plan:
[plans/r149-reconng-pack.md](plans/r149-reconng-pack.md)) — the first half
of Zeis's split: the pack now, the target-matching warnings next round
after he eyeballs the pack's labels.

- **The second pack is real.** Darkvalnar's Recon-NG (exploitation
  workspace: pick a module, breach a target, work a persistent session),
  described as `reference/reconng/toolpack.json` — **fenced** (README
  banner: example only, never serviced, nothing imported by `src/` or
  shipped in any export; source pinned at `798f9ee` with the GitHub and
  docs links in the fence doc). Named explicitly by Zeis's call with the
  author's permission.
- **Docs verified against source first.** Four diffs, code wins: their
  events page lists 5 events, the source emits 9 (`DirListed`, `Shutdown`,
  `UserEnum.Complete` undocumented anywhere, `SessionClosed` only on the
  session-control page); vulns are read from `subnet.domain` only
  (`BreachBackend.ts:1520`) — our compiler already emits the domain +
  `registerDomain`, so no compiler change (flagged for in-game eyes, not
  assumed); service aliases code-confirmed (`:477-478`). Recorded in
  `reference/reconng/NOTES.md` with file+line.
- **The pack:** 9 events (the three truly-undocumented ones say so),
  3 data shapes (loot, authored exploit, user-enum target), 2 story-timed
  session nodes (cut-the-session, open/close-a-host), real target
  conventions. Deliberately out with reasons: wordlists (grants need a
  string-list merge mode the format lacks), session locks (`until` is
  epoch ms — no computed values), access profiles / binary overrides /
  reverse payloads (need in-game testing), multi-value exploit/enum
  fields (no string-array kind — YAGNI).
- **The format's first new field:** optional `targetRules.serviceAliases`
  (additive, format stays 2, old packs parse unchanged) — without it the
  pack would misdescribe matching.
- **Latent bug caught on the way:** untouched toggles emitted the literal
  string `"{{key}}"` (truthy!) while showing off — the starter pack has no
  booleans, so nothing tripped it until now. `defaultPackValues()` seeds
  booleans to `"false"` at snapshot time on both paths (`buildAddData`,
  `chooseContract`); falsified all three guards by revert.
- Housekeeping: README "Done recently" trimmed to 5 rows (r130–r144 →
  `docs/archive/rounds-130-144.md`); "Next up" item 3 updated (pack done,
  warnings next). Stamp `2026-09-13.r149`.
- Gates: typecheck clean, **1,412 tests / 68 files**, build clean.

**Zeis's eyes only:** load `reference/reconng/toolpack.json` through
Tools → Tool packs and read every label/docs/hint as a gamer — the
warnings round builds on these words. In-game halves it cannot prove:
whether an editor-built target (domain + `registerDomain`, no
`setVulnerabilities`) actually matches a module's `check`, and whether
`addCommandData`-style flows matter here at all (recon-ng is itself a
command; the pack uses no `commandData`).


r148 answers Zeis's r147 review, item for item (plan:
[plans/r148-picker-marksize-stamp.md](plans/r148-picker-marksize-stamp.md)):

- **The grid colour picker is now the inspector's own ColourPicker** —
  presets, hex field, HSL sliders; the native `<input type="color">` (which
  the picker was originally built to replace) is gone. Theme stays a button
  beside it (null state, seeded neutral while following the theme).
- **Mark size** (his "Line width", clarified by ask → "both"): 25–250% of
  the standard look, default 100% = the r147 look. Sizes dots' diameter,
  crosses' arms, hexagon outlines (lattice follows, stays seamless),
  diamond spacing. Hidden for line styles — they have no marks.
- **Line weight freed**: the four presets became a slider, 0.5–6 in
  quarter steps, reset arrow included. Old preset values live inside the
  range, so r147 stored weights carry over. `NumberSlider` grew a `step`
  prop for fractional dials.
- **EDITOR_BUILD bumps every round from now** — Zeis reads it as the
  version (debug panel + every exported mod header showed r139). Now
  `2026-09-13.r148`. The old AR13 reading (bump only on compiler changes)
  is retired: the stamp is a version, not a changelog.
- Mark-size guard falsified (forced mark factor 1 fails the render test:
  dot radius and hexagon lattice width both asserted); stored-blob upgrades
  tested with the exact pre-r147 and r147 shapes.
- Gates: typecheck clean, **1,396 tests / 67 files**, build clean.

**Zeis's eyes only:** the picker's sliders against the live grid, mark size
at the extremes, weight 6 on squares, the panel reading r148.

r147 is the grid-polish round from Zeis's first hands-on (plan:
[plans/r147-grid-polish.md](plans/r147-grid-polish.md)):

- **Dots were genuinely invisible** — a real sizing bug, not his eyes: the
  library's Dots `size` is the *diameter* and r142 passed 1.5, a 0.75px
  radius at 100% zoom — sub-pixel ink no opacity can rescue. Now
  `GRID_DOT_SIZE = 9` (his spec: just above the crosses' old span).
- **Crosses** lengthened from span 8 to 11 so they read as crosses.
- **Grid scale reset**: the circular-arrow button beside the number field
  puts the standard size (22) back — `NumberSlider` grew an `onReset`.
- **Grid colour** (the accessibility ask): Theme (default, the canvas-dots
  token) + six fixed presets + a native colour field; stored as `colour`
  in the same `qe.canvasGrid` JSON (`null` or a strict lowercased `#rrggbb`
  — everything else rejected on read and write). Opacity still mixes on
  top. The overlay's ink now rides a `--qe-grid-ink` custom property
  (identical rendering; jsdom re-serializes standard properties lossily,
  custom ones verbatim).
- **Line weight**: Hairline 0.5 / Thin 1 / Medium 1.75 / Bold 2.5, driving
  native `lineWidth`, overlay `strokeWidth`, and the graph heavy line at
  `weight × 1.75`. Dots keep their own size (the hint says so).
- Both new guards falsified (sub-pixel dots probe, dropped-colour probe);
  pre-r147 stored blobs upgrade losslessly (tested with that exact shape).
- Gates: typecheck clean, **1,392 tests / 67 files**, build clean. No
  `EDITOR_BUILD` bump (AR13).

**Zeis's eyes only:** dot size feel at a few scales (9 is one number to
tweak), the crosses' arms, each weight on each style, the presets against
dark and light themes.

r146 found the real grey screen (plan:
[plans/r146-grey-screen-name-twin.md](plans/r146-grey-screen-name-twin.md)).
Zeis's Firefox console named it outright:

```
Uncaught SyntaxError: The requested module
'.../src/editor/canvas/CanvasGrid.ts' doesn't provide an export named:
'CanvasGridBackground'
```

— a file that does not exist in the repository.

- **The bug:** r142 shipped `CanvasGrid.tsx` (the component) beside
  `canvasGrid.ts` (the preference module) — the same name ignoring case,
  differing extension. `QuestCanvas` imported the component extensionless;
  Vite tries `.ts` before `.tsx`; on Windows (NTFS, case-insensitive)
  `CanvasGrid.ts` "exists" (it is `canvasGrid.ts`), so the import bound to
  the wrong module and the browser died with that SyntaxError — grey screen.
  On Linux (this sandbox, every gate we have) the two names are distinct and
  everything stays green. Born exactly with r142, which is why every build
  before it worked for Zeis and every build after grey-screened.
- **Reproduced end to end** by simulating the Windows view: the dev server
  rewrote the import to `CanvasGrid.ts` and served the preference module
  there — zero mentions of `CanvasGridBackground`, Zeis's error verbatim.
- **The fix:** the component is renamed `CanvasGridBackground.tsx` and its
  import spells the extension (`.tsx`), so no extensionless resolution
  happens at all; plus a new guard test (`filenameSafety.test.ts`) fails
  the build if any two JS/TS files anywhere share a lowercased stem —
  falsified with a planted twin pair. The bug class is unshippable now.
- **r145 corrected:** its optimizer fix was real and stands (the optimizer
  line disappeared from Zeis's terminal), but its "slow machine" framing
  was an unverified assumption stated as fact, and the race was never this
  bug. Both the r145 plan and README now carry the correction. The lesson
  is recorded in the r146 plan: never explain a failure with an unverified
  property of the user's machine, and a bug that appears exactly when a
  round lands is the round's bug until proven otherwise.
- Gates: typecheck clean, **1,379 tests / 67 files**, build clean. No
  `EDITOR_BUILD` bump (AR13).
- **Zeis's verification:** fresh zip as always — it should simply boot.

r145 found and fixed the grey screen (plan:
[plans/r145-grey-screen-launch-race.md](plans/r145-grey-screen-launch-race.md)).
Zeis's second report carried the clue that cracked it: his terminal printed
`[vite] (client) [optimizer] bundling dependencies...` — a line the working
builds never showed.

- **The mechanism:** Vite optimizes dependencies asynchronously *after* the
  dev server starts listening. Launch.bat polls the TCP port — it answers
  before the optimizer finishes — and opens the browser into the window. On
  Zeis's machine the browser beats the optimizer; the page's dep URLs get
  superseded mid-load (504 Outdated Optimize Dep); the half-loaded page has
  no HMR connection to self-recover, so it stays grey forever. A documented
  Vite failure mode, not an editor-code crash — which is why 1,378 tests,
  the r144 boot net and 154-module dev-server crawls all stayed green while
  his browser sat empty.
- **Reproduced locally:** a crawl against a server whose dep cache was
  re-bundled underneath it caught live `504 Outdated Optimize Dep`
  responses — the exact failure.
- **Not caused by the grid rounds, but real:** the lockfile is byte-identical
  r141 (worked) → r144 (grey); the race had been in the launch flow since
  the start and is timing-dependent. r144's "dead preview server" theory is
  retracted (Zeis never uses the preview).
- **The fix (no editor code changed):** the dev script now runs
  `vite optimize` to completion *before* `vite` listens, so a browser cannot
  connect until every dependency is bundled; and all 21 runtime dependencies
  are declared in `optimizeDeps.include` so the startup scan can never miss
  one for the browser to discover mid-session. Verified: cold cache → port
  answers only after optimizing → instant parallel crawl: zero 504s, zero
  slow requests, no client-optimizer line.
- Gates: **1,378 tests / 66 files**, typecheck clean, build clean. No
  `EDITOR_BUILD` bump (AR13).
- **Zeis's verification:** fresh zip as always — the editor should just
  appear. If a grey screen ever recurs: wait a few seconds and hard-reload
  (Ctrl+Shift+R); if that does not fix it, F12 → Console → send the red
  lines (that would be a different failure).

r144 answered a grey screen, rebuilt the README, and re-landed the grid (plan:
[plans/r144-grey-screen-readme-reland.md](plans/r144-grey-screen-readme-reland.md)):

- **The report:** the day r142 landed, Zeis saw the editor load to "a grey
  colour and absolutely nothing else" and rolled the branch back with
  GitHub's revert — taking r143 (a Compile.ts clean-code pass from a
  different tool) with it.
- **The investigation:** no boot crash is reproducible in r142's code — the
  full `<App />` boots clean with the grid off and on (r142's render tests
  already mounted it whole; r144 adds a dedicated net). A real-browser check
  is impossible from this sandbox: every browser-binary CDN is
  network-blocked, only npm and github answer. The leading suspect is the
  dev-preview server dying with a sandbox reset — the sandbox provably reset
  that night (local git rewound, node_modules gone), and a dead preview shows
  exactly a grey nothing.
- **One real bug, found on review and fixed:** the hexagon/diamond overlay
  set its colour as an SVG `stroke` *attribute* — `var()`/`color-mix()` are
  CSS and do not resolve in presentation attributes, so those two styles
  would have rendered invisible in a real browser (jsdom cannot see
  painting). The colour now travels a real CSS channel — inline `color` on
  the overlay svg, `currentColor` strokes — and the render tests assert it.
- **The boot net:** `src/__tests__/appBoot.test.tsx` mounts the whole editor
  three ways (grid off, native style on, overlay style on) and requires the
  standing shell. "The editor boots" was only ever implied before; now it is
  a test. Falsified: a render-time throw in the grid component fails all
  three.
- **The README:** truncated to intro + roadmap since somewhere in r134–r139;
  Zeis restored it from a backup. r144 brings it current — test counts, an
  r142 row, the r134–r140 history reconstructed from this file, the Visual
  Grid roadmap item retired, `src/editor/settings/` and `public/fonts/`
  added to the layout.
- **r143 stays reverted** (another tool's round): preserved at `a1fb342`;
  re-applying it is a separate, reviewed decision.
- Gates: **1,378 tests / 66 files**, typecheck clean, build clean. No
  `EDITOR_BUILD` bump (AR13).

**Zeis's eyes only:** the six patterns' actual look, seamlessness under
pan/zoom, Roboto/Roboto Mono rendering — and the grid is **off** by default
now, so toggle it on in Settings first.

r142 shipped the **visual canvas grid** and two more fonts (plan:
[plans/r142-canvas-grid.md](plans/r142-canvas-grid.md)), Zeis's specced scope:

- **Grid on/off** — default **off** (his explicit call): the grid *replaces*
  the always-on dot pattern r140/r141 shipped, so the default canvas is now
  plain — a deliberate change, not a regression. The r141 coupling "dots
  follow the snap step" is retired with it: the grid's scale is its own
  setting, snapping keeps its own size, and the sheet says so plainly.
- **Six styles** — his three (squares, dots, hexagons) plus our three:
  crosses, graph paper, diamond. Four ride React Flow's native `<Background>`
  (graph paper = two stacked Line layers, fine + every-fifth); hexagons and
  diamond are a custom overlay (`src/editor/canvas/CanvasGrid.tsx`) that
  mirrors the library's own tile math (verified in the xyflow dist) and tiles
  seamlessly by stamping motifs at lattice points, letting the pattern clip.
- **Scale** (slider + number input, 4–200, default 22) and **opacity**
  (0–100, default 50). The colour is a `color-mix` over the theme's
  `--color-canvas-dots` token — every theme recolors the grid for free.
- Settings: a "Canvas grid" section with a switch, six preview buttons (each
  a tiny live SVG of its pattern), and the two slider+number controls.
  Falsified: with the grid component reduced to always-off, four of the six
  render tests fail.
- **Roboto and Roboto Mono** joined the font picker (Fontsource, OFL,
  self-hosted latin 400/500/600/700 — fontsource generates the 600 Roboto
  never had upstream).
- The settings sheet's number fields got distinct aria-labels from their
  sliders ("(exact)") — the collision was real, not a test artifact.

**Zeis's eyes only:** how all six patterns actually look, seamlessness under
pan and zoom, the new fonts. No `EDITOR_BUILD` bump — the compiler emits
nothing new (AR13).

r141 made the settings page a real settings page (plan:
[plans/r141-themes-and-preferences.md](plans/r141-themes-and-preferences.md)),
Zeis's approved scope:

- **Six curated themes** — Midnight (default), High Contrast, Daylight (a warm
  cream light mode, not pure white), Phosphor (green retro terminal), Dusk
  (warm low-blue dark) and Slate (soft cool grey). Each is one unlayered
  `html[data-theme="…"]` token block in `src/index.css`; Tailwind v4's theme
  tokens live in `@layer theme`, so the unlayered block wins at runtime and
  clicking a card repaints the live canvas beside the sheet. Themes retint
  chrome only; High Contrast and Daylight also shift the node-category hues
  **as a set** (the canvas's reading language survives), and the minimap gets
  matching hex overrides via `themeCategoryHex` because its SVG `fill`
  attributes can't resolve `var()`.
- **Typography** — a curated font picker: System, Readable system
  (Verdana-led), Atkinson Hyperlegible, Lexend, JetBrains Mono. All
  self-hosted woff2s in `public/fonts/` (OFL licences alongside, provenance in
  its README — Fontsource packages; Google's font API is blocked from this
  sandbox, npm is not). A boot script in `index.html` applies stored theme +
  font before first paint; the modules re-apply on import (which covers
  tests). No UI scale, per Zeis — browser zoom already does that.
- **Snap grid size** (Fine 11 / Standard 22 / Coarse 44) — one number, three
  meanings by design: the drag grid, the canvas dot pattern (`gap` follows
  the step; the dots are the grid and must not lie) and the align spacing.
- **Wire dot drift speed** (Calm / Standard / Brisk) — `DOT_PERIOD_S` became
  the default of a stored preference; `setDotPeriod` restarts running
  animations (the r43 per-layer registry is what makes that safe). Falsified:
  the new cycle test fails with the period reverted to a constant.
- **Editor data section** — "Reset all editor preferences" (calls every
  module's own setter; fresh-install defaults, OS reduced-motion included)
  and "Clear the autosaved draft" (`DRAFT_KEY`, now exported from autosave).
  Both two-step like the pack manager's remove.
- Canvas hardcodes retired along the way: the minimap mask and background
  dots now derive from theme tokens (both flow through CSS custom properties
  — verified in the xyflow dist, not assumed), and the website builder's code
  view is pinned dark because its Prism colours are tuned for one background.

**Zeis's eyes only** (jsdom cannot see a palette or a typeface): all six
themes' actual look, the three bundled fonts rendering, dot speed, and the
light theme's native scrollbar/`color-scheme` behaviour. No `EDITOR_BUILD`
bump — nothing the compiler emits changed (AR13).

r140 shipped the **Settings page** (roadmap item 5, plan:
[plans/r140-settings-page.md](plans/r140-settings-page.md)) — the author-facing
home for the editor preferences that used to live only in the debug panel (a
developer tool) or on the canvas toolbar (no explanations, no dials):

- **A settings sheet**, opened by a Settings button in the top bar (Shortcuts
  moved to the `keyboard` icon; `sliders` finally means settings). It is a
  right-anchored Radix dialog running **non-modal**: no dimmed overlay, and it
  spans only the workspace between the fixed-height bars — so the canvas stays
  visible and interactive while tuning, which is the whole point (the debug
  panel proved that interaction model for two rounds). Esc closes it; the
  top-bar button toggles it.
- **Contents**: the snap / animated-wires / springy-wires switches with the
  honest descriptions, and the seven wire-physics dials moved over from the
  debug panel, each with a one-line hint, plus the damping-ratio and settle
  readouts and Reset to defaults. A standing honesty line: none of it changes
  the exported mod. Everything reads/writes the **existing** preference
  modules (`snapGrid`, `wireMotion`, `wirePhysicsPref`, `wireTuning`) — the
  sheet owns no state, so it can never disagree with the canvas toolbar.
- **The "Fade ms" dial became honest.** The ghost's fade used to run on the
  retraction's own easing curve, so `ghostMs` fed nothing but the backstop
  timer — a dial that did nothing (the known inconsistency queued for exactly
  this round). The fade is now its own pure arithmetic, `ghostOpacity()` in
  `wireGhost.ts`: full opacity while the wire travels, then a fade over the
  final `fadeMs`; a fade longer than the retraction outlives it (dissolve in
  place), zero is an instant vanish. Shipped defaults keep the r115 QA'd
  vacuum-cable feel; the lifetime test fails on the pre-r140 code (verified
  by reverting). `WireGhostOptions.durationMs` → `fadeMs`; the vestigial
  `GHOST_MS` export is gone.
- **The debug panel went back to being a debug panel**: build stamp, gates,
  counters/FPS, event log. The event log now records each ghost's
  retract/fade pair, so "what were the numbers?" is answerable without a dial.
- **Rider — a flaky gate made honest.** The two event-picker tests in
  `packDataEditor.test.tsx` measure 21s / 6s on a slow sandbox, against
  vitest's 5s per-test default, so `npm test` flaked there. Verified on the
  clean r139 tree (changes stashed): identical timings — the machine, not a
  change. Both now carry an explicit 30s timeout; assertions unchanged.
- No `EDITOR_BUILD` bump — nothing the compiler emits changed (AR13).

The canvas toolbar's three quick toggles and the Debug button stay as they
were — direct manipulation at the point of use, both surfaces writing the
same modules.

r139 was a **Clean Code & Architecture pass** over the rail r137+r138 built
(plan: [plans/r139-clean-code-architecture.md](plans/r139-clean-code-architecture.md)).
No new feature — it pays the debt the pack system introduced:

- **Duplicate React keys**: `pack.node` has one `NodeType` for many palette
  entries. Both the palette and the add-node search used `def.type` as the key,
  so every pack node shared `pack.node`. Fixed with `paletteDefKey` — pack nodes
  key by `nodeId` (`<packId>/<nodeId>`), static nodes by type. The vitest
  warning "Encountered two children with the same key, `pack.node`" is gone.
- **`computeWarnings` split**: was one 300-line function doing 15 jobs (F1/F2).
  Now eight focused helpers (`warnUnstartableQuests`, `warnFirewallAndPort`,
  `warnNetworkStructure`, `warnToolResponse`, `warnHandbook`, `warnWifi`,
  `warnDialogue`, `warnCommunityNodes`, `warnWebsites`) plus an orchestrator.
- **Permission map**: `computePermissions` was an ungoverned `switch` (AR3
  anti-pattern) that missed `pack.node` entirely — a pack node emitting
  `Events.emit` compiled with no permission (AR17). Now `PERMISSIONS_BY_NODE_TYPE`
  is the single source of truth, and `permissionsForPackNode` inspects the
  snapshot's emitter (`emit` → events, `commandData` → shell, `sdk` steps parsed
  by prefix).
- **DRY clones**: `JSON.parse(JSON.stringify(...))` appeared four times in
  `packNodeDefs` and twice in the editor store's clipboard. Replaced with
  `structuredClone` via `deepClone` / existing `clone` helper (A3).
- **Module boundaries**: pure pack helpers (`packNodeDefs`, `packEvents`,
  `packEventByName`, `paletteDefKey`) moved from `store/packs.ts` (persistence)
  to `toolpacks/palette.ts` (feature folder) — AR5 cut by feature, AR6 explicit
  boundaries. `store/packs.ts` now only persists and re-exports for compat;
  UI imports from `toolpacks/palette.ts`.

Gates: typecheck 0, 1,316 tests green, build clean, duplicate-key warning gone.

r138 shipped **Editor Mods** (design:
[plans/r135-tool-packs-design.md](plans/r135-tool-packs-design.md), plan:
[plans/r138-editor-mods.md](plans/r138-editor-mods.md)) — the second half of
the tool-pack vision. A pack's `nodes[]` now grow the palette: one
**"Editor Mods · <pack>"** group per loaded pack, each entry adding a
`pack.node` whose data is a **full snapshot** (pack id/version, game mod,
the pack author's label, the emitter and its whole config, the field
definitions). Four declarative emitters — `sdk` calls, `emit` an event,
`storage` write, `commandData` scripted tool answer — all pure JSON templates
with `{{field}}` holes and `{{data.*}}` tokens, interpreted by one new
`pack.node` case in the compiler (never third-party code). The palette entry
and the add-node search offer the same list; drags carry the snapshot as a
JSON payload; the card shows the pack author's label; the inspector renders
the pack's form with the honesty line. The architecture call (in the plan
doc): the node *type* system stays static and exhaustively checked — packs
extend the *palette*, not the zod union — and there is deliberately no
"listen" emitter (the trigger picker already gives pack events the full
clause engine; a second listening surface would be a worse duplicate). The
starter pack now ships one worked node per emitter kind; the format spec
documents the section. Remaining from the design: quest-facing target-rule
surfaces (`targetRules` parsed and carried, no lint yet — wants a real
second pack to design against).

r137 shipped the **first rail of Tool Packs** (design:
[plans/r135-tool-packs-design.md](plans/r135-tool-packs-design.md), spec:
[ToolPack-Format.md](ToolPack-Format.md), starter pack:
[`reference/example-toolpack/`](../reference/example-toolpack/toolpack.json)).
A pack is one `toolpack.json` of **pure data** — the events a game mod emits,
the SharedStorage data shapes it reads, the target conventions its tools
match. The **Tools** button opens the pack manager (load with plain-language
errors — a wrong format number is caught before anything else; two-step
remove; machine-local persistence). Loaded packs surface in three places:
**Community tools** events in the trigger picker (with a pack-authored label
and an honesty note that quests waiting on the event need the game mod);
**Community data** nodes ("Hand quest data to a community tool mod") whose
dropdowns and inputs come straight from the pack — the entry template is
**snapshotted into the project** at authoring time, so quests keep working
where the pack was never loaded, and numbers/booleans land raw in the JSON
while strings splice in with escaping; and the **export README**, which now
lists every pack used and says the player must install its game mod. A new
teal **Community** palette category carries the node. Validation errors are
written for the modder ("id: the pack id is lowercase letters, numbers and
dashes"), never a zod dump. (The Editor Mods half shipped next door in
r138 — see the top of this file.)

r136 shipped **The Long Game** ([plan](plans/r136-campaign-template.md)), the
campaign template: three acts in one mod chained by the "Claim another quest"
node — a public trail, a small break-in, and a typed verdict whose two wires
are two different endings. It forced two product fixes: claimed quests now
count as a start route (the warning and the template tests), and
`createProject` points new multi-quest projects at their first quest instead
of a discarded default. Cookbook card 16 rides along ("The Campaign"). Note:
a smaller game patch shipped 2026-09-12 **without patch notes and without an
SDK update** — the docs/07 fence stands exactly where it was; the fence-lift
procedure still waits for the pinned SDK to move. r134 was the **website polish** ([plan](plans/r134-website-polish.md)): the
preview is now a walkable site — an address bar plus internal-link
navigation (the sandboxed iframe posts internal link clicks out; the builder
serves the linked page, or a friendly not-found) — and **Import folder**
turns a folder of AI-written .html files into pages in one go (filenames
become paths, `<title>`s become titles, existing paths are skipped). r133
built **linking without touching HTML** ([plan](plans/r133-page-linking.md)):
Zeis's After Effects pick-whip idea, verdict "right instinct, wrong physics
for a drag", shipped as click-click *with the noodle kept*: the 🔗 button is
a popover of the site's pages, every sidebar page row has a 🎯 socket, and
arming renders a wire from the socket to the cursor — reroute-nodule tip,
follows across the iframe, ghost-fades on place/Cancel/Esc — until the next
click inside the page becomes the link (existing links retarget). His
screenshot also caught that the first cut hid the targets inside the
popover; the sockets now live on the rows where you look. r132 was the **website builder audit** (roadmap item 9,
[plan](plans/r132-website-builder-audit.md)): the whole builder surface read
end to end, three real defects fixed — the visual editor silently *ran page
scripts* while editing (now CSP-blocked in the editing copy, scripts kept in
the emitted document), "Delete site" had no confirmation, hosts/paths shipped
verbatim (now normalized on blur) — plus `WebsiteDefinition.popular` exposed
end to end with an honest "unverified" hint (the docs/03 Q12 self-test is
buildable; the in-game ranking check is Zeis's), `hiddenBits` surfaced in the
page scan, duplicate/slash-less path warnings, and a Save HTML export.
r131 read Zeis's transcription of the hardcoded Journalist's Sister questline
(13 quests, 1,845 lines) and staged three proposals — **approved** — awaiting
their build round ([plan](plans/r131-journalists-sister-analysis.md)); the
headline: the SDK's Kisscord contact lifecycle
(`createUser`/`addFriend`/`changeStatus`) is declared and unused; the "new
contact appears mid-story" move is unbuildable today. r129 closed roadmap
item 2 (website pages emit `description` + `search[]`); r130 shipped the
**Dry run** ([plan](plans/r130-quest-simulator.md)). The developer's
bug-report reply remains filed as
[`docs/07`](07-dev-response-mod-sdk-bug-report-response.md),
**under a fence**: nothing it promises is in the pinned SDK yet; read the
banner before acting on any of it.

## Where things stand

- **HEAD:** r173 (Timer rename + calendar modes) on
  `arena/01a0af11-hackhub-quest-editor`, committed and pushed after
  validation. Previous rounds: r172 Schedule beat node (now the Timer), r171
  inspector polish + phone-proxy notes, r170 Ask player prompt node, r169
  phone end flow + quest-ending nodes, r168 phone `onEnd` completion QA
  probes, r167 Create Wi-Fi.
- **1,584 tests green** across 80 files, typecheck clean, build clean.
- **Editor build stamp:** `2026-09-17.r173` (bumps every round since r148 — the
  stamp is a version, not a changelog).
- Tool-pack modules: `src/toolpacks/schema.ts` (format 2 + plain-language
  `parseToolPack`), `src/toolpacks/palette.ts` (pure `packNodeDefs`,
  `packEvents`, `packEventByName`, `paletteDefKey` — the synthesized palette
  defs, no store), `src/store/packs.ts` (machine-local zustand store, own
  localStorage key `hackhub-quest-editor:packs:v1` — NOT in the project doc;
  re-exports helpers for compat),
  `src/toolpacks/ToolPackManagerDialog.tsx`, the `world.packData` and
  `pack.node` nodes with their dedicated editors (`PackDataEditor.tsx`,
  `PackNodeEditor.tsx`), and the emission cases in
  `src/compiler/runtimeSource.ts` (shared `__QE.packFill`/`__QE.packText`
  template helpers). Pack-driven surfaces feed
  `EventPicker`/`ConditionsEditor` via `packEvents`/`packEventByName`, and
  the palette + add-node search via `packNodeDefs`.
- Shared graph helpers extracted to `src/templates/kit.ts`; each template is its
  own module (`blank.ts`, `firstContact.ts`, `byline.ts`, `coldCall.ts`,
  `harbourManifest.ts`, `helpDeskLeak.ts`, `badAttachment.ts`, `sixTries.ts`,
  `coldStorage.ts`, `ledgerContract.ts`, `longGame.ts`, `reference.ts`,
  `cookbook.ts`). `src/templates/index.ts` is a thin registry.
  `Template.difficulty` is `Beginner | Advanced | Expert | Reference`.

## Read these first, in this order

1. **[`docs/06-how-it-works-today.md`](06-how-it-works-today.md)** — how the
   editor is built now, and the five rules the codebase follows. Each rule is
   the scar of a specific bug; they are not style preferences.
2. **[`docs/In-Game-Handbook.md`](In-Game-Handbook.md)** — Zeis transcribed the
   game's entire in-game handbook by hand, 4,102 lines. **It is the highest
   authority for how a player is expected to act.** The SDK says what a mod can
   *call*; the handbook says what the game *teaches*. The previous session got
   three things wrong by consulting only the SDK.
3. **[`reference/Official-Quest/`](../reference/Official-Quest/)** — Zeis's
   transcriptions of the quests the game itself ships (the complete official
   set, 8 files). The strongest cross-check for how real quests flow; read
   with [`docs/plans/r127-official-quest-comparison.md`](plans/r127-official-quest-comparison.md)
   and the Journalist's Sister deep-dive
   [`docs/plans/r131-journalists-sister-analysis.md`](plans/r131-journalists-sister-analysis.md).
4. **[`docs/07-dev-response-mod-sdk-bug-report-response.md`](07-dev-response-mod-sdk-bug-report-response.md)**
   — the developer's answer to our bug report: engine facts true today (Q3
   exploitability, Q4 version format, Q6 dual file events) next to patch
   promises that are **not in the pinned SDK**. Fence banner on top; also the
   fence-lift procedure in the queue below.
5. **[`docs/plans/r128-six-tries-and-cookbook.md`](plans/r128-six-tries-and-cookbook.md)**
   — what r128 built and why Proposal B changed surface.
6. **[`docs/plans/r129-website-search-metadata.md`](plans/r129-website-search-metadata.md)**
   — the search-metadata round: ground truth, the one-line drop point, the
   four in-game questions (and the `popular` question for the developer).
7. **[`docs/plans/r126-template-audit.md`](plans/r126-template-audit.md)** —
   what the audit found in the templates, what it fixed, and the in-game
   questions still open. (r127's comparison plan remains the source behind
   the cookbook.)

## The world.wifi node: visible, with one game display wart

As of r167, `world.wifi` is back on the authoring surface. `PALETTE_HIDDEN_TYPES`
in `src/schema/registry.ts` is empty, `paletteGroups()` includes Create Wi-Fi,
and the Node Reference sheet includes a real Wi-Fi example.

Why this changed: SDK 0.24.0 ships `Network.createWifiNetwork`, and the r166
in-game harness proved scan fields, connect/disconnect events, reload behaviour,
cleanup, Bettercap capture and hashcat recovery are green enough to expose. The
compiler still keeps the old router fallback for older game builds, but current
exports use the native Wi-Fi creator when it exists.

Known wart: Bettercap can print `SSID: undefined` after targeting an
SDK-created AP by BSSID. The attack still worked in QA. The inspector/export
warning is therefore informational, not a blocker.

## The shipped set

Difficulty is **Beginner / Advanced / Expert** — Zeis explicitly rejected a
four-tier scale. The tier describes how much the *author* must understand, not
how hard the hack is.

| Template | Tier | Situation |
|---|---|---|
| Blank | — | Empty canvas, lifecycle nodes |
| First Contact | Beginner | The whole spine: brief → one objective → payment → closing line |
| The Byline | Beginner | **Website #1:** an *ordinary* site; find a name in a blog byline, `lynx` it. Nothing hidden, no hacking |
| Cold Call | Beginner | A story told in conversation — Kisscord/WeeChat, no break-in |
| The Harbour Manifest | Advanced | The standard contract — the only template proven end-to-end in-game |
| The Help Desk Leak | Advanced | **Website #2:** the site *hides* something — `dirhunter` an unlisted page, credentials inside |
| Bad Attachment | Advanced | Phishing: a lure goes out, the reply carries the credential. All mail, no shell |
| Six Tries | Advanced | **The crack:** lynx → nmap → `hydra` → `ssh -h` with the cracked login → `cat` → report. The official quests' most common route; new in r128 |
| The Ledger Contract | Expert | Long route, privilege escalation |
| Cold Storage | Expert | scan edge → fern passphrase → shell → sqlmap a database |
| Node Reference | — | Every node type, annotated |
| Quest Cookbook | — | Official-quest techniques → the nodes that express them here; read-only, new in r128 |

Zeis's steers, verbatim in spirit:
- **Cold Call** stays, specifically to show that a non-hacking quest is possible.
- **Two Ways Out** (the branching-ending idea) may be **morally grey** —
  authors can change it themselves. Approved but not yet built; slot it in as
  an Expert or Advanced entry.
- Two website templates, using websites in **different ways** — hence The
  Byline and The Help Desk Leak.
- Expert must be genuinely expert: multiple tools and techniques, not one
  clever trick.

**Cold Storage** still models its old "wireless" identity as a plain
`world.network` router, because that template predates the r167 `world.wifi`
surface and its route was already tested around a visible device tree. New Wi-Fi
stories should use `world.wifi` when the access-point mechanics matter. Its
`lead_ledger` table was seeded in r126 (r125 deferred it mid-playtest).

**Bad Attachment** runs entirely on mail events — the plan's explicitly
allowed fallback, since `Mail.registerTemplate` is not expressible in the
editor and engine-side attachment simulation is unverifiable from the SDK.

## What the handbook established (do not re-derive this)

**Phishing works, and a mod does not author the attachment.** Metasploit
generates it in-game:

```
use exploit/multi/fileformat/office_word_macro
set payload bearos/meterpreter/reverse_tcp
set LHOST <ip> / set LPORT <port>
run       # creates the malicious document
handler   # starts the listener
```

The player then delivers it by the in-game mail route, and the victim opening
it triggers the reverse TCP connection. **The listener port must be forwarded
on the router** or the payload cannot call back. Current builds also enforce
that the player actually owns a file before it can be attached.

**Suspicion is real, game-native and log-driven.** It rises from incomplete or
incorrect hacking and phishing. After getting a shell the player is expected to
find the access logs and **delete exactly the line recording their shell,
leaving the others alone** — missing logs are themselves noticed. It falls by
changing Wi-Fi network. 50% = you can be hacked back; 100% = federal seizure.
Real log paths: `/logs/accounts.log`, `/root/logs/terminal.log`.

**Router port-forwarding** is external port → internal IP → internal port, plus
an enabled flag. A rule that exists but is disabled does nothing. The firewall
sits in front of the router, which is why a connection can still fail after
"opening the port".

**Fern** derives the router interface credential *from the router model*, which
the player reads off the router's web interface in Firebear.

**The beginner workflow** the handbook teaches — and the shape a good template
should have: read the objective literally → OSINT/recon (`lynx`, `whois`,
`nslookup`, `mxlookup`, `dig`) → `nmap -sV` → match the evidence to a tool →
preserve evidence → if it does not tick, re-read the wording, because the game
wants the *specific action* named.

### Corrections from the developer's response (docs/07 — engine facts true today)

- **`/logs/accounts.log` is on the PLAYER's own machine**, not the target
  (Q5). Shell forensics reads `sys.log` on the compromised host. The handbook
  transcription itself may be ambiguous — it is a transcription; this note is
  the correction.
- **`acceptReverseTCP` is not checked by port exploits at all** — it only
  matters for reverse-TCP payload paths (phishing macro, mail listener). A
  guest is not required either: one user with `online: true` suffices (Q3).
  Our exploitability guard is stricter than the engine requires; that is fine
  and stays — but do not "fix" templates down to the minimum.
- **Metasploit versions**: `x.y.z`, first segment nonzero, must equal the
  banner's numeric segment exactly; nmap prints the full banner (Q4).
- **A pulled file raises TWO events** — `Terminal.SSH.FileDownload` (ssh)
  and `Files.Transfer` (download command/transfer window); quests that
  listened to only one stranded players (Q6). Listen to both.
- **`scp` does not exist in the game.** (The Harbour Manifest hint predates
  this answer from the dev — its `scp` terminalCommand is a cosmetic
  suggestion the game does not have; noted for the next Harbour round.)

## Rules any new template must follow

1. **Exploitability**, enforced by `src/templates/__tests__/exploitable.test.ts`
   — any machine the player must enter needs a login service, a user with
   `acceptReverseTCP: true`, `extraAccounts: false` unless a guest is wanted,
   and **three-part port versions** (`OpenSSH 6.4.0`, never `7.2`).
2. **No node that compiles to nothing.** Handbook nodes compile since r125
   (`Handbook.open` in runFlow); the article catalogue's id=title scheme is
   still an unverified hypothesis awaiting Zeis's jump test.
3. **Never a typed IP** — use `TARGET_IP_TOKEN` (`{{data.targetIp}}`). Networks
   outlive the mod in the save; a fixed address collides with an older build.
4. **A subnet must be rooted in a ROUTER** when it has children (r77).
5. **Distinctive domains** — they are global and a generic one may collide.
6. Every quest has a deliberate finish path: closing beat first, then
   `fx.completeQuest` when the quest should formally complete, or an explicit
   legacy objective-hiding choice when it should stay active.
7. Each template states its tier and what it teaches in a sticky note.

## Queued next

1. **Mail cleanup/replyability QA.** SDK 0.24.0 declares `Mail.send(): string | null`,
   `Mail.remove(id)`, and `QuestMailDefinition.replyable`. Do a focused in-game
   pass before exposing cleanup/remove-mail authoring: id shape, remove timing,
   reply-button behavior, and unload/complete cleanup.
2. **Twotter update/remove QA.** SDK 0.24.0 declares `Twotter.updateUser(id, patch)`
   and `Twotter.removeUser(id)`, but old Twotter save/search behavior was brittle.
   Verify repair/removal semantics in game before restoring authoring.
3. **Phone proxy/eavesdrop QA.** xu reports a call-listening mechanic, but r171
   found no declared SDK API/event for it. Ask for a snippet or exact game route,
   then raw-probe before exposing anything.
4. **Scheduler/Time design pass.** r166 proved Scheduler/Time can survive reload
   in a raw probe. Design the editor surface deliberately rather than dropping a
   generic timer node into the palette.
5. **HTTP/curl/DNS collaborator remain fenced.** Static editor websites loaded
   in game, but `http-request`/`http-response` objectives did not complete;
   `curl` was missing as a terminal command; DNS-only collaborator hits produced
   no result. Wait for SteelWaffe clarification or fresh in-game proof before
   exposing authoring nodes.
6. **"Contact-driven story" template.** Cold Call covers the conversation shape;
   the phone-brief + objective-gated-drip variant is still open.
7. **"Two Ways Out" template.** Approved branching consequence shape, possibly
   morally grey. The Long Game includes a typed verdict with two endings, but a
   standalone template may still be useful after the feature queue settles.
8. **Data requests / eyes-on checks.** SMTP/POP3/IMAP version banners + ports;
   Apache metasploit module for 2.4.49/50 or flavour; Handbook title/category
   screenshot + id jump test; eyes on the preview; the Harbour `scp` hint fix.

Tooling note (r129): the `lint` and `format` npm scripts are gone. ESLint
was never installed (`npm run lint` failed with "not found"); a repo-wide
Prettier pass would have reformatted the whole tree to defaults — neither
ever gated anything, so both were removed rather than adopted (Zeis's call).
Formatting is house convention; the mechanical gates are typecheck + tests +
build. Prettier the *dependency* stays: the website builder's code view uses
`prettier/standalone` to format page HTML.

Done and off the queue: the website-builder audit (r132), the Dry run +
Cookbook riders (r130), website description + search (r129), the r127 proposals (both built, r128), the editor UX
check (r125), actionable hookup warnings (r124), the template rebuild (r122),
the template audit (r126).

## Working habits Zeis expects

These are standing instructions, not preferences:

- **Never guess. Check the SDK, the handbook, the official quest
  transcriptions, or the Nemesis reference mod.** Test hypotheses before
  implementing. Evidence order: SDK d.ts → handbook → Official-Quest →
  shipped/QA (each wins in its own domain).
- **Plan first, then execute — but check in between.** Write the plan down,
  present it to Zeis, and stop there: he reviews it, asks questions and
  corrects assumptions before a line of code is written (r172 lesson — the
  plan was committed and implementation started without that pause).
- **Falsify every guard**: revert the fix and confirm the matching test fails.
  A test that cannot fail is worse than none, and several have shipped green
  while the feature was dead.
- **jsdom lies about anything visual** — no layout, no compositor, no
  `Element.animate`, no `PointerEvent`. Say plainly what cannot be tested and
  hand it to Zeis rather than writing a test that looks like coverage.
- **Admit wrong theories plainly, with evidence.** Corrections belong in the
  docs, not quietly edited out.
- **Be concise.** Expand only where the detail is load-bearing.
- **Zeis only speaks English** — all replies to him are in English,
  whatever the surrounding chat language is.
- Always `git fetch` and compare against the remote before committing — Zeis
  commits to this branch too (docs/07 arrived that way in r128), and the
  remote is authoritative.
