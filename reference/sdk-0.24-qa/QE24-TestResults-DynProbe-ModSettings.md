# QE24 test results — the dynamic-page probe (r238) and the mod-settings probe (r239/r240)

Run by Zeis, 2026-09-28, game **1.3.13**, fresh save, on a throwaway save with
only the two probe mods installed (no QA harness). His own minute-by-minute
write-up, with the screenshots, is on the `QA-filedump` branch as
`QE24-TestResults-DynProbe+ModSettings.md`; this file is the repository's
record of what the runs **established**, with the evidence that supports each
line and the corrections made along the way.

## 1. Mod settings — answered

**Where the UI is:** *main menu → Settings → Mods → the tiny grey "Settings"
word on the mod's row.* Main menu only — not the in-game Settings program (the
desktop OS simulator) and not the phone's Settings app, which is where the
SDK's phrase "rendered in the Mods UI" sent us looking.

| Row | Result |
|---|---|
| MS-01 | **Green** — found in the main menu, as above |
| MS-02 | **Mostly green** — both toggles, the text field and the slider (steps of 5) all render and work. One wart: the **number field draws far too many underscores** — cosmetic, worth a bug report |
| MS-03 | **Green** — every label reads "Probe: …"; the select shows the word ("Blue", "Violet"), no colour swatch |
| MS-04 | **Green** — every control editable |
| MS-05 | **Green** — values survived a game restart |
| MS-06 | **Green** — after the restart the mod read back the **changed** values: `toggle_on:false, toggle_off:true, select:"violet", text:"typing something here", number:1, slider:80` — persistence *and* read-back confirmed |
| MS-07 | **Red, and a real answer** — no reset-to-defaults control is exposed. The editor would have to ship its own |

**API version was not the gate.** The v2 variant showed the UI, and v1 would
have. SteelWaffe later confirmed the game runs API v2 and that declaring it is
simply the right thing to do (`docs/03` §19, closed).

**For the editor:** the whole loop is proven — declare, render, change,
persist, read back. Design caveats: keep numbers to a sane range (the
underscores), provide our own reset, and remember the screen is **main-menu
only**, so nothing a player tunes mid-quest can live there.

## 2. Dynamic pages — the content half is green

Game 1.3.13, probe 1.0.0, quest claimed first (16:42:36) and pages visited
afterwards.

| Question | Result |
|---|---|
| Per-request content | **Green** — `/echo?msg=zeis` printed the value back |
| Path params | **Green** — `/article/1` received `{"id":"1"}` |
| Raw page context | Recorded: `url`, `params`, `query`, plus a `searchStr` key carrying no value |
| "This page does not exist" | **Answered** — the browser's own error: *"404 / This site cannot be reached / Firebear can't find the server at https://…/article/99"*, black page, white text |
| Caching | **Green** — no caching; the visit counter climbs on every open |
| The page-side SDK bridge | The `HackhubSDK` global **is** injected ("yes"), but see §4 |
| Exports | **Green** — site-level exports reach both static and dynamic pages; per-page exports work (`article-2`) |

**One quirk, unexplained:** every page view renders **twice**. The page handler
logs twice about a second apart, and a visit counter inside `/state` read 2 on
its first-ever open and 4 after one revisit. Any page that counts or mutates
state per render will double-count.

## 3. Dynamic pages — the event half is red, and it was already known

No `http-response` line ever appeared in the log, so `Http.Response` never
reached the quest. This is **not new**: this folder's blocked-rows table has
recorded since r166 that mod-hosted **static** sites load fine but do not tick
`Http.Request`/`Http.Response` either. The r237 plan assumed the new dynamic
pages would behave differently — that assumption was wrong, and the evidence
against it was already filed here.

Because the r238 beat was wired to the first `Http.Response`, it never fired,
so **DP-06/07/08 only ran their "before" half and the bcc.com A/B is still
unverified in game.**

*Correction made during this round:* I first read the log as "the quest was
claimed after the pages were visited". Zeis corrected me and the log agreed
with him — `QEDynProbeQuest started` (16:42:36) precedes every page visit. The
listeners were armed; the finding stands.

## 4. ~~A page's own permissioned call does not work~~ — **WITHDRAWN (r250)**

> **This section's conclusion is withdrawn.** The A/B it rests on was not
> clean. Both sides were mails, but they differed in **two** ways at once: the
> page's mail carried `to: "player@gomail.com"` and the quest's control mail
> carried no `to:` at all. `player@gomail.com` is a placeholder that came out
> of this repo's own QA project and **has never existed**, so the two sides
> differed by recipient as well as by calling context — the experiment cannot
> separate them, and it never could.
>
> **Whether a page can send mail at all is UNKNOWN, not disproven.** It is the
> first thing probe 1.4.0 re-tests, with both buttons omitting `to`.
>
> What *did* survive from the runs is that the page's `Mail.send` returned a
> real id (`yD1oMYYHUX`) — so it was **not** refused with `Mod "null"`, which
> is what this section claimed. The original write-up follows, kept because the
> silence it describes is real and is still the thing to fix.

The `/form` button called `HackhubSDK.Mail.send(...)`. Nothing threw. **No mail
arrived** — Zeis had his in-game inbox open in another browser tab.

| Sent from | Arrived? |
|---|---|
| The quest's `OnStart()` — trusted mod context | **Yes** |
| The page's own button — page context | **No**, and no error |

Same mod, same session, same declared `mail` permission. So the permission is
granted and delivery works; **the calling context is the whole difference.**
That is the same engine behaviour we filed as `docs/03` §14 in September
(`Mod "null" tried to use UI.toast without "ui" permission` from a menu click),
and the same thing another modder's notes warn about.

Two details worth keeping:

- `Mail.send` is **synchronous** (`send(mail): string | null`). There is no
  promise, so the failure was not a hidden rejection — the call simply failed
  without throwing, which is worse, because the caller cannot detect it.
  (I asserted the promise version first and corrected it.)
- The mod-context mail carries **no `to` field** and still arrived, which
  rules the recipient address out as a cause.

I had also written that our page "captured" the result — it did not. It
printed its own "sent (no error thrown)" text as soon as the call failed to
throw, and discarded the engine's answer. Zeis's paste showed our text, not the
game's.

## 5. The second run (1.1.1, 2026-09-28) — what it settled

Zeis re-ran the whole list. His log is on `QA-filedump` as
`QE24-TestResults-DynProbe-v2.md`.

| Row | Result |
|---|---|
| DP-06 `qedyn beat` | **Green** — `command: beat fired` |
| DP-07 the bcc.com A/B | **Green** — the UPDATE article appeared on top and the old three dropped one slot. **A mod can reproduce the game's own news-site behaviour.** This was the headline question and it is answered |
| DP-08 /state twice | **Green** — phase read `beat-fired`; visits 2 → 4, so the double render is confirmed again |
| DP-09 button A | **The call was ACCEPTED** — `Mail.send` returned a real id (`yD1oMYYHUX`). No mail arrived |
| DP-10 button B (bridge) | Also accepted — the listener recorded an id (`ra1DgwPOsB`). No mail arrived |
| DP-13 `qedyn status` | **0** `Http.Response` events offered to the mod. The r166 fence is confirmed for dynamic pages |
| DP-15 the feed | **The quest DID appear on the Hackhub feed** on a fresh save |

### The mail result — partly right, partly our own error

**Right:** the page's mail was **accepted**. `Mail.send` returned an id from
page context *and* through the bridge, so the call is permitted in both. It was
never refused at the permission gate.

**Wrong:** we read the missing mails as a **delivery** bug. They were addressed
to `player@gomail.com` — a placeholder out of this repo's own QA project that
has never existed. They were not lost; they went nowhere, exactly as they
should. The one mail that has ever arrived, the startup mail from `OnStart()`,
is the only one carrying **no `to` field** — and that was not a clue, it was
the rule: no `to` means the player. See §6.

### Two things the run exposed about the probe itself

- **`qedyn status` printed nothing at the terminal.** Every subcommand wrote
  to the game log only. Commands have a `println`; the probe now uses it.
- **`qedyn tick 1` did nothing** — it wanted a full row name and stayed silent
  otherwise. It now takes a number or a name, and says when the quest is not
  claimed yet.
- **The feed post appearing on a fresh save** suggests the earlier missing
  post was the load-time bug in 1.1.0 (§6 below) rather than the game-side
  feed problem — though a fresh save could also explain it.

## 6. The correction (r250): two findings were measuring our own placeholder

Zeis installed 1.2.0 on a fresh save and ran the row that mattered. Of the two
test mails, **only B arrived** — the one with no `to:` field:

> **QE24 dynprobe: talk-back [B no-to]**
> From: qe24-dyn@qe24.test
> Test B: sent WITHOUT a to: field - the shape the startup mail uses.

I concluded that the `to:` field is what loses a mail, and built 1.3.0 to work
out why. Zeis's answer to that was blunt, and he was right:

> *"Why were you sending mails to that address? That address has never existed
> and no other agent before you ever tried to send anything there. I could've
> told you that leaving the `to:` field empty defaults to sending the mail to
> the player — that's standard game behavior we figured out in like round 2."*

He is right on both counts. `player@gomail.com` is a placeholder in this repo's
own QA project (`reference/sdk-0.24-qa/projects/sdk-0.24-ingame-qa.project.json`,
seven mail nodes), and it had been copied from there into the probe. The rule
that an empty `to:` means the player is not new knowledge either — the editor's
Mail inspector has said *"Leave blank to send it to the player"* for a long
time, and `compile.test.ts` pins the same default. **The answer was in the
repo; I did not look, and I theorised instead.**

So two findings are withdrawn:

| Finding | Status |
|---|---|
| "The `to:` field is what loses a mail" (§6 of the previous revision, r249) | **Withdrawn.** The mail went to an address that does not exist. That is correct behaviour, not a bug |
| "A page's own permissioned call does not work" (§4, r238/r245) | **Withdrawn.** The A/B differed by recipient as well as by calling context, so it proved nothing about page context |
| "The page's mail is accepted, not refused" (§5) | **Stands.** Both page-context sends returned real ids |
| `Http.Response` never reaches a mod for its own site (§3) | **Stands** — independent of all this (DP-13 counted 0) |
| The bcc.com pattern is reproducible by a mod (§5) | **Stands** — DP-07 was green and never touched mail |
| `qedyn status` printed nothing; `qedyn tick 1` did nothing | **Stands** — both were real bugs in my own command, both fixed |

### What is left, and it is worth having

- **The silence is real.** `Mail.send` accepted a mail that could never be
  delivered and returned a plausible id. There is a `Mail.sendBounce()` for the
  player-facing version of exactly this mistake, so the mod-side silence looks
  like an oversight. Filed in docs/03 §25.
- **A page's `Mail.send` was not refused.** That contradicts the blanket rule
  in the other modder's notes ("any permissioned call from a page or an
  `Exports` function fails with `Mod "null"`"), which was demonstrated for
  `Files.create` and `SaveStorage.set`. The fence looks **per-API**. That is a
  real result and it changes what a page editor has to generate.
- **The page question is open again, and it is the interesting one.** We have
  still never sent a correctly-addressed mail from a page. If it arrives, a
  page can act — which is the thing the whole dynamic-pages investigation was
  trying to establish.

### Probe 1.4.0 re-tests it

Both `/form` buttons now omit `to:` entirely (A direct, B via the bridge), and
`qedyn mail` sends three honestly-labelled mails: one with no `to:`, one to the
player's **real** address from `Mail.getPlayerEmail()`, and one to a
deliberately non-existent address, which is expected to vanish — the point
being to record whether the game says anything when it does. A regression test
now fails if `player@gomail.com` ever appears as a live address in the probe
again.

### The lesson, stated so it is not learned twice

**Before theorising about the engine, check the literals.** Is this address
real? Is this name the right one? Is this even the call being made? Three
rounds and two "findings" went into an address nobody had ever used.

## 6b. What the second run changed (2026-09-28, probe 1.2.0)

## 7. The follow-up probes

**1.1.0** (r246) made three changes, each aimed at one thing the first run
could not settle:

1. **The beat is fired by a terminal command** — `qedyn beat` — because
   `Http.Response` will never arrive. That finally lets DP-06/07/08 run their
   "after" half and gives the bcc.com A/B its verdict.
2. **Every `Http.Response` is logged before filtering.** The old listener
   filtered on host and logged afterwards, so "no event" and "event with an
   unexpected host" were indistinguishable — which is exactly the open
   question. `qedyn status` prints everything the mod was offered.
3. **`/form` prints what `Mail.send` returned** (`null` = refused, an id =
   accepted) and offers a **second button** that goes through the documented
   workaround — the page's export only emits an event, and a top-level
   listener does the real send. If button B delivers and button A does not,
   the workaround is proven and the editor can generate it.

`qedyn tick <row>` also lets the tester check a row off by hand, since the
objective rows mostly cannot tick themselves.

**1.1.1** (r247) fixed a load-time bug in that rebuild — the command class was
defined at module level, so a missing `sdk.Command` would have aborted the
whole file (no site, no quest, no feed post, which is what Zeis saw) — and
added `qedyn claim` for claiming without the feed.

**1.2.0** (r248) acts on the second run: `qedyn mail` sends one mail with a
`to:` field and one without, to test whether the recipient is what loses them;
every subcommand now prints to the terminal as well as the log; and `qedyn
tick` takes a row number as well as a name.

**1.3.0** (r249) acted on the third run, which is now known to have measured a
placeholder address (§6). Its `qedyn inbox` survives — listing what the game
says is in the inbox is how you tell "dropped" from "not drawn".

**1.4.0** (r250) is the correction. Every probe mail is now addressed either to
the player (no `to:` field, or the real address from `Mail.getPlayerEmail()`)
or nowhere on purpose and clearly labelled. The `/form` buttons no longer
name a recipient, so the page-context question — can a page send mail at all? —
is finally tested rather than assumed.

Filed for the developers: `docs/03` §24 (HTTP events for a mod's own sites,
and the double render) and §25 (a mail sent with a `to:` address that does not
resolve is accepted and then never delivered, silently — please either deliver
it to the player's inbox or fail loudly).
