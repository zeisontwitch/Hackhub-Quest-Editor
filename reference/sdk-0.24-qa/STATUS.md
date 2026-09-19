# QE24 QA status (2026-09-19)

**ONE OPEN BATCH: the mail rows M-01…M-10** (r209, raw harness **1.0.24**,
`qe24 mail …`). SDK 0.24 declares `Mail.remove(id)` and `replyable` on
`MailDefinition`, and the probe measures all of it: the id `send` returns, how
`remove` behaves, whether a Reply button draws on the direct path (M-04) and on
the quest path the editor ships (M-06), what a reply's raw `Mail.Sent` payload
carries — the declared interface has **no `repliedTo`**, so whatever the log
shows decides whether a quest can match a reply at all (M-05) — cleanup at
quest end (M-07) and through the disable-then-restart unload hook (M-08), the
residual `moment` warning look (M-09, clean save with no mods first), and
`Mail.sendBounce` (M-10). Steps below and in the harness's own `qe24 mail`
guide. One session, one batch (the r207 rule); install the raw harness `mod/`
folder only — the editor export is untouched this round.

Everything else is closed. **Two things belong to the developers, not to us:**
**Q14** (a click handler has no mod identity, so every permission-guarded call
from one is refused — the editor works around it by handing the action to the
engine) and **Q15** (`Handbook.open` opens the handbook on its own front page
whatever id it is given). Both are in
`docs/03-questions-for-the-developers.md`.

Below the M-rows banner, every earlier round is closed, answered or
deliberately shelved (S-10, the short-month clamp, is shelved by the author's
decision rather than passed, and is marked as such). A future round that needs
an in-game check adds a *new* row here and a new harness version — never a
re-run of the ones below.

## Open: the mail rows (r209) — harness 1.0.24, `qe24 mail …`

Nothing auto-starts. The two rows that need the probe quest start it with
`qe24 run mail`. Batch order matters where it is marked. `qe24 mail` alone
prints the group's guide.

| Row | Do | Green reads |
| --- | --- | --- |
| **M-09 first** (it needs a clean save) | Before installing anything: open Twotter and a browser on a **save with no mods**, then check the game log. After the session's rows: check the log again. | With no mods: any `moment` RFC2822 warning is the game's own content (T-09b said so). After the mail rows: **no** new warning from anything the probe sent — closes the stale mail attribution for good. |
| **M-01** id shape | `qe24 mail send` — read the printed id, open GoMail. Then save → quit → reload → `qe24 mail audit`. | `send` returned a non-null id; GoMail shows the mail **with the same id**; the id survived the reload. |
| **M-02** remove basics | `qe24 mail remove last`, then the same command again, then `qe24 mail remove qe-nope`. | First **true** and the mail leaves GoMail; second **false**; unknown id **false**. |
| **M-03** remove while unread | `qe24 mail send`, then `qe24 mail remove last` **immediately** (before opening GoMail), then save → quit → reload → `qe24 mail audit`. | The mail never gets read and is still withdrawn, and the removal persisted in the save. (BUG 10 taught us delivery is queued — a queued mail is the real case.) |
| **M-04** replyable, direct path | `qe24 mail send replyable`; open it in GoMail. | A **Reply button draws** under a mail sent by direct `Mail.send({ replyable: true })` — the path the editor runtime avoids on a stale assumption. |
| **M-05** the reply payload | `qe24 mail watch on` **first**; click Reply on the M-04 mail; type anything; send; then `qe24 mail watch off`. | The log line `[qe24] Mail.Sent payload: { … }` pasted whole. The question: does it carry **`repliedTo`**, and is it the original's id? The declared payload has no such field — whatever appears is undeclared. |
| **M-06** replyable, quest path | `qe24 run mail` — the quest's OnStart sends its replyable `Mails[0]` via `this.sendMail(0)`; open it in GoMail. (Watch stays on from M-05; reply to **this** mail.) | Reply button draws on the **Quest.sendMail** path too, and the reply ticked the quest objective. |
| **M-07** cleanup at quest end | `qe24 mail cleanup on`; complete (or abandon) the mail quest; `qe24 mail audit`; check GoMail. | The log's `[qe24] mail QA … mail sweep:` lines remove the session ids **and** the quest mail (sendMail returns no id — found by subject); afterwards no probe mails remain, and the story mail in the inbox was untouched. |
| **M-08** cleanup at unload | `qe24 mail send` once more (so a probe mail exists on the save); save; quit; **disable the harness in the Mods list**; restart; load the save; open GoMail and the new game log. | The log's top carries `[qe24] unload mail sweep:` lines; the probe mails are gone from GoMail; the story mail survived. (Only the disable-then-restart path can fire the hook — T-15c.) |
| **M-10** bounce | `qe24 mail bounce`; open GoMail. | A mailer-daemon bounce for `qe24-missing@nonexistent-corp.test` is in the inbox. |

Honest-notes: `qe24 mail unload` prints what the always-armed sweep will do and
why it cannot be a per-session switch (a flag cannot live across the restart
the hook needs). The sweeps match only subjects starting with
`QE24 mail probe` — nothing else in anyone's inbox starts with that, and the
sweep logs every call, so a wrong removal would name itself in the paste.



## Settled: the Twotter editor rows, first run — 2026-09-18 (game 1.3.1, build 25388883)

Zeis ran the r185 rows on a clean save, resetting after each. Transcript:
[`QE24-TestResults-Twotter.md`](QE24-TestResults-Twotter.md). Six rows are
answered; two could not be run as written, and the run found two real bugs in
the runtime.

| Row | Verdict | Evidence |
| --- | --- | --- |
| **T-08** the authored account | **Pass, with two numbers to re-check** | Search found `qe24_editor`; bio read as authored (the record holds it at 102 chars), blue avatar rendered, verified tick, **412 followers**. Two wrinkles: the profile read **86 following** where the record holds **96** (the audit prints the stored 96, so the profile screen is doing its own math or the reading was a slip), and the **banner was not reported** at all. |
| **T-09** a lived-in series | **Pass except the picture** | Five tweets, top to bottom: *a few seconds ago, 12 days ago, a month ago, 3 months ago, a year ago* — the authored ages (6 weeks reads "a month"), newest first, counters as authored. **No tweet carried its picture**, in the feed or on the detail page. |
| **T-09b** the moment.js line | **Not ours** | The log does contain one moment.js deprecation warning — at **21:35:41**, two minutes *before* our series posted (21:37:14), with `_i: Wed Sep 09 2026 12:32:30 GMT+0200` = a **game** tweet's `sendedAt` (the same stamps the `Twotter.PostSeen` payloads carry for `QUESTS.13`/`CYBER_JUSTICE`). Our ISO-with-ms stamps never trigger it. The old blemish belongs to the game's own content. |
| **T-10** save, quit, reload | **Pass** | After save → quit → reload: no duplicate account, five tweets (not ten), same order. The audit confirmed the record: `bio is a string (102 chars); verified yes; followers 412; following 96`. |
| **T-11** complete removes it | **Failed — fixed in r186** (row re-opened as T-11b) | The Complete button never appeared, because the quest carried a deliberately-unchecked canary objective and the game shows the button only when **every** objective is done. He abandoned instead: **the tweets went and the account stayed** — `twotter: keeping @qe24_editor - another live quest declares it`, while that "live" quest (tw2) had never been claimed. Two bugs, both ours: "live" included quests that had never started, and the ensure-at-start hook that puts an account back was a no-op. |
| **T-12** two quests, one account | **Pass** | `qe24 run clear`, then `run tw2`: the account stayed (as a leftover) and gained exactly one new tweet; its objective ticked the moment he opened the profile; **Complete removed the account and its posts** (`removeUser(qe-tw-account) -> true (the last quest that needs it ended)`). |
| **T-13** When-event triggers | **Pass** | `objective "profile-seen" completed by Twotter.ProfileSeen`, `objective "post-seen" completed by Twotter.PostSeen`, and `post-event` never fired — the log only ever shows it *listening* for `Twotter.Post`. Bonus evidence: `Twotter.PostSeen` fires for the **game's own** tweets too (four payloads with foreign userIds were logged and correctly did not match our `userId` condition). |
| **T-14** the r30 draft | **Pass** | Four tweets from @legacy_smith, in order: *2 days ago*, *1 month ago* (flagged as migrated), *when story arrives*, and the fourth *flagged*. One account, though the draft declared the handle twice. One gap he noticed: the account itself carries no migrated warning — only the tweet rows do. |
| **T-15** uninstall | **Not run as written** (row re-opened as T-15b) | By the time he uninstalled, there was nothing left to remove: the account had already gone, and a re-claimed `tw1` could not bring it back (the ensure bug above). He confirmed the mod's quest left the journal on uninstall. |

### What the run found in the runtime (fixed in r186)

1. **`ensureDeclaredTwotterAccounts` never ran.** It walked the declarer map's
   **keys** (account ids) looking for the quest id *inside the account id*, so it
   never matched — the log has no Twotter line at any quest start in either
   session. The only thing that ever created an account was a tweet node, which
   is why a re-claimed quest came back with no account and no tweets. The loop
   now reads the value (the quest list) it was always meant to.
2. **"Live" meant "has not ended".** A quest that had never started still held
   the account, so abandoning the only quest that needed it left an empty
   profile behind. A quest now counts as live only while it is **started and not
   ended**; act II brings the account back itself when it starts.
3. **A finished quest could never post again.** The posting guard survived the
   quest's end, so a re-claimed quest posted nothing and its PostSeen objectives
   could never complete. The guard is cleared when the quest ends; reloading
   mid-story is unaffected (the guard is what stops a replayed flow duplicating
   tweets, and the start chain does not re-run on a reload).

Each fix has a behavioural fence over the compiled mod, and each fence was
falsified against the old code.

### What the run found in the QA fixtures (fixed in r186)

The canary objective (`Twotter.Post`, deliberately never completable) sat inside
the quest that T-11 needs to finish — and an unchecked objective hides the
Complete button, so the row could not reach its own ending. The canary is now
its own quest (`qe24 run tw3`, *Twotter QA (T-13: does Twotter.Post ever fire?)*)
which nothing has to finish. T-11's quest now carries only rows that can tick.
One more fixture lie removed: the objective's suggested "terminal command" was
described as if typing it ticked the row; the field only ever shows a
copy-pasteable nudge.

### Settled, and closed on purpose: the tweet picture (T-09's negative half)

**SDK 0.24 cannot carry one, and the editor no longer offers the control.** `TwotterTweet` has no picture field — `id`,
`userId`, `content`, `sendedAt`, `interaction`, `showInTimeline` and nothing
else — and the r185 run proved the consequence in game: a tweet with an attached
picture showed no picture in the timeline *or* on the post's own page, while the
account's avatar (same data-URI shape) rendered fine. It is not a spelling problem:
the account's avatar — the same data-URI shape — rendered in the same run.

So the control is **hidden** (Zeis's call, 2026-09-19: "there's no reason to have
something there if it doesn't work"). The project field and the migration stay,
an older project's picture is still carried into the export, and the export
report still names it; but an author is no longer offered a picker that cannot
reach the game. A **feature request for a picture field is filed** in
[`docs/03-questions-for-the-developers.md` §10](../../docs/03-questions-for-the-developers.md)
— the day the API accepts one, the field comes back and the change is one line.
**Until then: put the clue in the tweet's text, or in a file the player opens.**

## CLOSED: pack extras probe (r200/r201) — every reading green

**The four APIs a pack needs to exist outside its own quests all work in 1.3.1.**
Evidence: `QE24-TestResults-Extras.md` plus three screenshots on the QA-filedump
branch; the last one shows the three menu items and both widgets at once.

| Row | Reading | What it means for the editor |
| --- | --- | --- |
| **T-16/20** `Menu.addItem` | **Green.** The items appear in the strip at the **bottom of the start menu**, above the Applications/Downloads footer. Three were registered in the second run — labelled `QE24 menu top`, `QE24 menu no section`, `QE24 menu bottom` — and all three appeared, in registration order. **The declared `section: "top" \| "bottom"` has no visible effect in this build**, so the editor will not offer it as a choice (recorded here rather than shipped as a control that does nothing). | Start-menu items are authorable: label + icon + one click action. |
| **T-17/21** `Desktop.addWidget` | **Green, both ways.** Two widgets, same HTML: the one registered with `transparent: false` drew **solid magenta**; the one with `transparent: true` drew its text with **no background** — which is the SDK's **default** and the reason the first run's widget looked like bare text. Position (40,40) and size (320x180) were both honoured. | Widgets are authorable — and the transparent switch must be a visible control, defaulted to **opaque**. |
| **T-18/22** `ContextMenu.register` | **Green for both targets.** "QE24: inspect this file" on a file, "QE24: desktop action" on empty desktop space. | Right-click items are authorable, with the four targets the interface declares. |
| **T-19** `Localization` | **Green.** `t()` translated, `{{who}}` substituted, a missing key echoed its own name. **The game offers 30 languages** (ar, bg, cs, da, de, el, en, es-ES, es, fi, fr, hu, id, it, ja-JP, ko-KR, nl, no, pl, pt-BR, pt, ro, ru, sv, th, tr, uk, vi, zh-Hant-TW, zh). | The Languages table offers exactly those codes. |

**Note on the first run's menu reading:** it reported nothing in the start menu
with one item registered, and the second run with three items showed them all. The
likely explanation is where they render — a strip at the very bottom of the menu,
below the app grid, which is easy to miss when looking for an app icon. Nothing in
the API behaved differently between the runs.

**One process fix from the first run:** the tester was told to run `on`, `lang`,
`off` and look afterwards, so everything was unregistered by the time he looked.
The harness now prints "DO NOT run `qe24 extras off` yet" at registration time and
the row text puts the look before the cleanup.

Stage B — the editor's **Pack extras** dialog and **localization** — is the next
build; the plan is [`docs/plans/r199-cheap-wins-plan.md`](../../docs/plans/r199-cheap-wins-plan.md),
now with these readings folded in.

## CLOSED 2026-09-19 — round r185 (Twotter), editor export 1.0.27, harness 1.0.20

> **Before any row: is the editor export actually ENABLED?** On 2026-09-19 two
> sessions were wasted because the game had kept the export **disabled** from an
> earlier test — after the mod was deleted from disk, after a *newer version* was
> copied in, and on a *fresh save*. A disabled mod never loads, so its quests are
> invisible and `qe24 run` has nothing to start (it says so now).
> **How to check:** run `qe24 twotter audit` (or any `qe24 run ...`) — the first
> line reads `Editor export: loaded (v…)` or `Editor export: NOT LOADED in this
> session`. If it says not loaded: enable the export in the Mods list, **restart
> the game**, and try again. Filed with the developers as
> [`docs/03` §13](../../docs/03-questions-for-the-developers.md).

Two rows could not be answered by the r185 build (one was unreachable, one had
nothing to remove) and one is a re-check after a fix. **T-11b and T-12b are now
answered green** — Zeis ran them on a fresh save (claim tw1, both objectives
tick, Complete removed the account and its tweets; then tw2 claimed and
completed, which removed them again). **The round is closed** — the abandon half
of T-11b came back green last (below), T-15c is green and T-15b stays red by
design. No row is waiting for a tester. The mods:

| Mod | Where | Version |
| --- | --- | --- |
| Editor export (under test) | `reference/sdk-0.24-qa/editor-export/` | **1.0.27** |
| Raw harness (commands) | `reference/sdk-0.24-qa/mod/` | **1.0.18** |

Nothing auto-starts. Claim with `qe24 run tw1` / `qe24 run tw2` / `qe24 run tw3`;
shed anything an older build left claimed with `qe24 run clear`. If a claim is
refused, the journal titles are *Twotter QA (T-08/T-09/T-10/T-11/T-13)* (tw1),
*Twotter QA (T-12: two quests, one account)* (tw2) and *Twotter QA (T-13: does
Twotter.Post ever fire?)* (tw3).

### Measured 2026-09-19: T-11b abandon — GREEN (the row that started the round)

The failure this round opened on: in r185 an **abandon** removed the tweets but
kept the account, because "live quest" counted a quest that had never started.
Re-run on a clean save, tw1 claimed and then **abandoned from the journal**:

```
[quest-editor] OnAbandon: starting
[quest-editor] cleanup starting (abandon): 5 item(s) to undo
[quest-editor] twotter: removeUser(qe-tw-account) -> true (the last quest that needs it ended)
[quest-editor] cleanup: tweet qe-...-post-4 ... removed      (and 3, 2, 1, 0)
[quest-editor] cleanup finished
[quest-editor] OnAbandon: finished, handing back to the game
```

`qe24 twotter audit` after the reload: **`@qe24_editor` is not on this save.**
The account went *first* — `removeUser` takes its posts with it — and the
per-tweet cleanup then found nothing left to do, which is why both lines appear.
`keep` never fired. **The r185 failure is closed.**

### Measured 2026-09-19: T-15c GREEN — the accounts go when the game unloads a disabled mod

Test file: `QE24-TestResults-Twotter-6.md` (QA-filedump). Export **1.0.20**,
harness **1.0.18**, game 1.3.1.

**The disable path works, end to end.** Fresh save, tw1 claimed, account present
(`@qe24_editor`, bio 125 chars). Then the export was **disabled in the game's
Mods list**, the game's own *"Mod changes detected. Restart the game to apply
updates."* accepted, and the game quit. After the restart — while the game was
starting up and **before any save was loaded** — the log carried both lines:

```
[quest-editor] unloading: removing the Twotter accounts this mod declared
[quest-editor] twotter: removeUser(qe-tw-account) -> true (mod unloaded)
```

Loading the save afterwards and running `qe24 twotter audit`: **`@qe24_editor` is
gone**, handle and posts. So the hook fires when the game applies the queued
disable, and the removal sticks.

**The plain-quit variant, for the record.** The same protocol without disabling:
a session that loaded the export, started tw1 and created `@qe24_editor` ended
with save + quit to desktop, and **that session's log has no `unloading:` line at
all** — it is the first statement inside the hook, so absence means the hook was
never called. The account was still on the save at the next launch. Nothing needs
cleaning in that sequence, so this is not a defect; it is the edge of the promise.

**And the case no mod can reach.** With the mod's folder deleted while the game is
closed, its code never runs, so the accounts stay (T-15b, red by design). The game
prunes the orphaned *quest* itself — `[PruneOrphanQuests] Dropping
"QESdk024TwotterQa" (Se8JDmyGoK): no installed content defines it.` — but not the
accounts. Question 11 asks for that sweep.

| Row | Do this | Report |
| --- | --- | --- |
| ~~**T-11b**~~ | **Green 2026-09-19, both halves.** *Complete:* both objectives ticked, the button appeared, and the account plus every tweet went. *Abandon:* `OnAbandon` → `cleanup starting (abandon): 5 item(s) to undo` → **`removeUser(qe-tw-account) -> true (the last quest that needs it ended)`** → the four remaining tweets swept → `cleanup finished`; `qe24 twotter audit` after the reload reads **`not on this save`**. The r185 failure — the account kept on an abandon — is closed. |
| ~~**T-12b**~~ | **Green 2026-09-19.** tw2 claimed and completed after tw1: both objectives ticked, and its completion **removed the account and its tweets** — the shared-account rule holds in the order that mattered. |
| ~~**T-15b**~~ uninstall (mod removed outside the game) | **Red 2026-09-19, and the row was wrong, not the mod.** Zeis ran tw1 to completion, saved, quit, removed `editor_export` from disk and relaunched: the **quest** was gone (the game drops an uninstalled mod's quests) but `@qe24_editor` and **all its tweets were still in the save and in search**. The SDK documents exactly this — *"Accounts your mod adds live in the player's save and are not removed when the mod is uninstalled, so clean up in `OnModPackageUnloaded`"* — and a mod removed while the game is closed never loads, so the hook can never run. **The cleanup is not broken; the scenario is outside any mod's reach.** Filed as question 11 in [`docs/03-questions-for-the-developers.md`](../../docs/03-questions-for-the-developers.md). |
| ~~**T-15c**~~ uninstall the way the game applies it | **Green 2026-09-19.** Disable the export in the game's Mods list, accept *"Restart the game to apply updates."*, quit to desktop, relaunch. The game unloads the package while starting up — before any save is loaded — and that session's log carries **`unloading: removing the Twotter accounts this mod declared`** and **`twotter: removeUser(qe-tw-account) -> true (mod unloaded)`**. Loading the save afterwards, `qe24 twotter audit` reads **`@qe24_editor: not on this save`**. Evidence: `QE24-TestResults-Twotter-6.md`. | **The promise holds for the disable route** — the accounts and their posts go with the mod. What still leaks is the mod deleted from disk while the game is closed (T-15b), which no mod code can reach; question 11 covers it. |
| ~~**T-15d**~~ a save taken *after* the hook has run | **Not needed (2026-09-19).** The row existed to tell "the hook ran but the deletion did not stick" from "the hook never ran". T-15c ended with the account gone, so there is nothing left for it to distinguish. It returns only if a run ever shows the lines and the account still on the save. |
| ~~**T-08b**~~ the authored pictures | **Green 2026-09-19.** "Banner is bright violet, profile is amber" — both authored pictures really do reach the game, which settles the r185 wrinkle the dark blue banner left open. |

| ~~**E-01**~~ editor-only | **Green 2026-09-19** (screenshot included in the round). Asked for two changes, both built in r189: the blank picture areas now **say the game draws its own** (banner caption + both pickers' tooltips), and a blank **display name** is nudged the way a broken handle is. The panel also states what the game fills in and what it does not — see question 10's neighbour, [§11](../../docs/03-questions-for-the-developers.md), and the note below. |

Both wrinkles from T-08 are worth an eye while you are in there: whether the
**banner** shows on the profile, and whether **following** reads 96 (as stored)
or 86 (as the first run saw it).

**What the game fills in, and what it does not** (Zeis's question on the E-01
screenshot, answered from the r179 probe's own record): `Twotter.createUser` fills
whatever it is not handed — the T-01 probe called it with a username, a bio and
`verified`, and the engine supplied a name, a surname, an avatar, a banner,
followers, following and a password. The editor hands it everything an author
typed, so **the pictures are the one place its defaults show** (we leave them out
when blank, deliberately), while the name, handle, bio and counts travel as
written — a blank bio is sent as `""`, never omitted, because a *missing* bio is
the exact shape that crashed Twotter's search for seven rounds (r31).

---

## Earlier: the r185 rows as first handed over (all now answered above)

## Open: the Twotter editor rows (T-08…T-15) — r185, editor export 1.0.14

*(Kept for the record — this is the checklist as it was handed over before the
run. Everything in it is answered above.)*

The rows below test the **editor's own Twotter node** in the game, so they run in
the *editor export*; the raw harness is only there for the three commands. Both
mods, on one throwaway save:

| Mod | Where | Version |
| --- | --- | --- |
| Editor export (the thing under test) | `reference/sdk-0.24-qa/editor-export/` | 1.0.14 |
| Raw harness (commands only) | `reference/sdk-0.24-qa/mod/` | 1.0.14 |

The account is **`qe24_editor`** — one mod-level account, 412 followers / 96
following, the blue check, a blue 48×48 avatar and a near-black 240×64 banner,
bio *"Made by the editor's Twotter node (r185)…"*. Nothing auto-starts; claim a
quest with `qe24 run tw1` / `qe24 run tw2`, and shed everything older builds left
claimed with `qe24 run clear`. If a build refuses to claim another mod's quest,
`qe24 run` prints the journal title to claim by hand — for the series that title
is *Twotter QA (T-08/T-09/T-10/T-11/T-13)*, and for the shared-account quest
*Twotter QA (T-12: two quests, one account)*.

| Row | Do this | Report |
| --- | --- | --- |
| **T-08** the account | `qe24 run tw1`, open Twotter, search `qe24_editor`, open the profile. | The bio line, the avatar and the banner (as authored, or the game's default), followers 412 / following 96, and whether the check is blue. |
| **T-09** a lived-in series | Same profile: the five tweets of the series. | The five ages in the order they appear (authored newest-first should read: a few seconds / 12 days / ~6 weeks / ~3 months / a year — paste the *exact* wording), which tweet carries the **red square** picture, whether the counters match what the editor showed, and whether the log has any **moment.js** line (it must not). |
| **T-10** save, quit, reload | Journal → save, quit, reload. Then `qe24 twotter audit`, then the profile again. | Duplicates or not: the audit's `n of 4 handles present` line, and whether the profile shows five tweets (not ten) with the same ids. Edit the bio in the editor's Twotter panel (**top bar → Twotter**) before reloading if you want the edited-bio half. |
| **T-11** complete removes it | Press **Complete** on "Twotter QA (T-08/T-09/T-10/T-11/T-13)". | `qe24 twotter audit` afterwards — @qe24_editor must read *"not on this save"*; Twotter search must not find it; search for anything else must still work. |
| **T-12** two quests, one account | `qe24 run tw2` as well (same account), then complete **one** quest, `qe24 twotter audit`, complete the **other**, audit again. | After the first completion the account must still be there — with both quests' tweets; after the second it must be gone. The order you complete them in must not matter. |
| **T-13** When-event triggers | With tw1 live: open the profile, then open one of its posts. | In the journal, `profile-seen` and `post-seen` must tick; `post-event` must **stay unchecked**. If `post-event` ticks, say so — it changes what the manual may promise about `Twotter.Post`. |
| **T-14** the r30 draft | Open [`projects/fixture-r30-twotter.project.json`](projects/fixture-r30-twotter.project.json) in the editor (no game needed). | Four tweets, none deleted: ages 2 days / 1 month **flagged as migrated** / arrival / 1 month **flagged**; and ONE `legacy_smith` account in the editor's Twotter panel (**top bar → Twotter**), though the old draft declared it twice. |
| **T-15** uninstall *(last priority)* | Remove/disable the **editor export** mod, reload, search Twotter. | The `qe24_editor` handle must leave search. The harness's own handles staying behind is expected (different mod). |

## Settled: P-01a (r185) — backdated tweets keep the time we send

**Answer: yes, in all three spellings.** Game 1.3.0, build 25388883, harness
1.0.12, throwaway save, Zeis's screenshots 2026-09-18.

| Tweet | Sent with | Read back as |
| --- | --- | --- |
| `qe24-p01-control` | **no time at all** | **"a few seconds ago"** — the engine stamps its own time only when we send none |
| `qe24-p01-iso-ms` | `2026-08-18T19:09:35.285Z` | **"a month ago"** |
| `qe24-p01-iso` | `2026-08-18T19:09:35Z` | **"a month ago"** |
| `qe24-p01-plain` | `2026-08-18 19:09:35` | **"a month ago"** |

The same run showed the profile rendering a complete engine-made record
(banner, avatar, "Joined September 2026", 33 following / 82 followers, the blue
check) and the four counters exactly as authored — `0 reposts · 2 likes · 0
replies`, `22 views` on the detail page. The detail page's absolute line read
"8:09 PM · Aug 18, 2026" for the 19:09Z stamp, an hour behind the machine's
local zone; relative ages are unaffected and the editor computes stamps from the
in-game clock, so it is a note rather than a fence.

**Decision:** the runtime sends `sendedAt` as ISO with milliseconds, computed
from `Time.date()` minus the author's amount and unit. Backdated series ship on
the API path; the editor's fence against the declarative `Tweets` field stays.

## Settled: P-01b (r185) — a profile shows the newest tweet first

**Answer: the profile sorts by time, newest at the top, whatever order we posted
in.** Game 1.3.0, build 25388883, harness 1.0.13, throwaway save, Zeis's report
2026-09-18. `qe24 twotter order` posted A (two months back, first), B (no time →
stamped "now", second) and C (one month back, third); the profile read
**B, C, A** top to bottom.

Decisions that follow: the runtime posts a series **oldest → newest** anyway
(deterministic; the engine sorts the display), the editor's preview mirrors the
game (newest at the top, with a line saying so) while the author's list stays
chronological, and **ties keep posting order** — P-01a's three equal-moment
tweets appeared in the order they were posted.

**One discrepancy, on the record:** the Journalist's Sister transcript reads as
*oldest at the top* ("a year ago" … "all the way down to 8 days ago", hook as the
second-to-last tweet). That is prose about hardcoded questline content in an
earlier build; the probe measured the API path on the build we ship against, and
the declarative `Tweets` path is fenced off, so a mod never depends on the other
behaviour. Details and the reasoning: [`P-01-BACKDATE.md`](P-01-BACKDATE.md).

## Settled: the Twotter probe (r179 → answered 2026-09-18)

**Answer: Twotter can come back — on the API path.** Game 1.3.0, Steam build
**25388883**, throwaway save, harness 1.0.9, results in
[`QE24-TestResults - Twotter.md`](QE24-TestResults%20-%20Twotter.md).

The crash that forced the r31 removal is gone, and the two things the old report
said were impossible now work:

| Row | Result |
| --- | --- |
| T-01 seed → search `qe24_probe` | **Pass.** `createUser` + `addUser` produced a real account — the engine filled name, surname, avatar, banner, followers, following and password. Search found it and the profile showed its bio. |
| T-02 search `qe24_badrecord` | **Pass — the one that mattered.** A record planted with `bio: undefined` (the exact r31 shape) was listed in search with no crash and no freeze. The read path is guarded. |
| T-03 save → reload → `status` | **Red, and it does not matter.** The bad record's bio was *still* `undefined` after the reload, so 1.3.0's "affected saves are repaired on load" did **not** manifest for a record written this way. Now that T-02 is green the read path is safe regardless — but nothing may rely on a repair of existing saves. |
| T-04 `qe24 twotter update` | **Not run.** The repair call is still unverified; it is no longer load-bearing, because we will not be writing records that need repairing. |
| T-05 `qe24 twotter post` → profile | **Pass.** The tweet appeared on the profile immediately and the post objective ticked — `Twotter.PostSeen` fires. |
| T-06 `qe24 twotter cleanup` | **Pass.** `removeUser` returned `true` for all three accounts, including the **quest-declared** one, and the handles disappeared from search. The old report's "no mod can repair this" is answered. |
| T-07 profile of `qe24_declared` | **Pass at the record level.** The quest-*declared* account carries the bio from the quest definition (`"Declared by the quest definition, not by the API."`) — the write path the old bug broke is fixed. The profile screen itself was not reported on. |

**One finding for the re-implementation round:** `Twotter.AccountCreated` did
**not** fire for an account added through the API — the probe's `api-account-seen`
objective stayed open while `PostSeen` ticked normally. Do not build objectives
on `AccountCreated`; use `PostSeen`/`ProfileSeen`.

**Decision:** re-implement Twotter in the editor, authoring accounts and posts
through `createUser`/`addUser`/`postTweet`, never relying on the declarative
`TwotterAccounts` path to write a complete record, and always shipping
`removeUser` cleanup. See
[`docs/plans/r179-twotter-probe.md`](../../docs/plans/r179-twotter-probe.md).

Re-check on a later build (one command each, both optional): `curl
http://qe24-http.test/` for the blocked curl rows, and `qe24 twotter update` for
T-04.

## Settled: the Timer rows (S-01…S-09, S-13, S-14) — answered 2026-09-18

Game **1.3.1**, Steam build **25388883**, harness 1.0.10 / export 1.0.8. Raw
transcript: [`QE24-TestResults - Timer-Rows.md`](QE24-TestResults%20-%20Timer-Rows.md).

| Row | Result | Evidence |
| --- | --- | --- |
| S-01 fire | **Green** | Timer A's mail/toast landed ~2 in-game minutes after load (the tester could not tell one toast from another — the notification storm this round fixed). |
| S-02 reload | **Green** | After save → quit → reload there was exactly **one** Timer B job, same id (`3xGYDqlxrQ`) and the same raw `fireAt`, so nothing double-armed; it fired once and left the list. |
| S-05 coming day | **Green** | The mixed row armed — and a Timer suspends its chain, so `qe-cal1-t1` and `qe-cal1-t2` (an exact date already past, a coming day already past today) must both have fired first. Their jobs are gone from the list; the chain moved on. |
| S-06 past time | **Green** | Same evidence as S-05. |
| S-07 reload survival | **Green** | The same five jobs with **identical ids and raw `fireAt`** before and after a save/quit/reload (3 editor jobs, 2 game jobs). |
| S-08 multi-day / S-13 mixed | **Green** | Armed Fri 18 Sep; the job fires **Tue 3 Nov 18:23** — +1 month → 18 Oct, +2 weeks → 1 Nov, +2 days → 3 Nov, clock pinned to 18:23. Exactly the clamp-once rule and the preview sentence the editor shows. |
| S-09 one month on / S-14 Wait in months | **Green** | `Wait 1 month` resolved through `scheduleAt` to **18 Oct 19:27** — one month on, same day number, same clock time as the moment it armed. |

**Bonus: the calendar rows survive a DST boundary.** The 3 Nov job was armed on
18 Sep in CEST (+0200) and fires after the local switch to CET (+0100), and the
local rendering still reads **18:23** — the promised wall-clock time holds. That
matters because the in-game clock displays local time (S-04).

**S-03 (cancel)** is green from the second run, **S-12 / S-15** from the third,
and the last two rows are closed by the fourth: **S-11 green** and **S-10
shelved by the author's decision**. Details below — the folder is done.

### Settled: S-03 cancel, and the miscounting log (second run, 2026-09-18)

Transcript: [`QE24-TestResults-Timer_Rows_2.md`](QE24-TestResults-Timer_Rows_2.md).

The tester claimed `QESdk024TimerQa`, let Timer A fire, **abandoned** the quest
and waited ~2 real minutes: nothing popped. His own pasted log contains the
whole sequence — `timer node qe-tmrf7pia armed after 2m (job T6nLZcpwsu)` →
`timer qe-tmrf7pia fired` → `timer node qe-9b919r74 armed after 2h (job
uO1ZDpc81C)` → `OnAbandon: starting` → `cancelled … pending timer(s)` →
`OnAbandon: finished`. **S-03 is green.**

That log also exposed a small lie: it said **`cancelled 2 pending timer(s)`**
when only one timer was still pending — a job that had already fired stayed in
the mod's list. Fixed in r182 (the handler drops a job the moment it fires), and
guarded by a test that asserts the cancel call names the pending job and not the
fired one.

**Reading the log:** the mod's lines all start with `[quest-editor]`. The file
is `%APPDATA%/Roaming/hackhub/log` on Windows (saves are `…/hackhub/saves`) —
the path was told to us on 2026-09-19 and is now in this folder's README. The
cancel line for S-03 was in a pasted log for an hour before we noticed it,
because the checklist never said where to look; now it does.

### If a row's quest starts but its account never appears

**Answered 2026-09-19: the export was disabled.** The game had remembered an
earlier disable, so the pack never loaded and its quests were never registered —
see the callout at the top of this section. Two runs were spent on it. The
harness now answers the question in one line instead of leaving it to be inferred,
and the checks below still apply if the marker says the export *is* loaded.

Seen on 2026-09-19 with T-15c's prep: `qe24 run tw1` printed "Claimed
QESdk024TwotterQa", the journal was empty of it, and
`qe24 twotter audit` read `@qe24_editor: not on this save`. **The quest creates
its account at quest start**, so an account that is not there means the quest
never started — and `Quest.claim()` returns nothing in SDK 0.24, so the harness
cannot tell a refusal from a success (question 12). Three checks, in order:

1. **Is the journal entry there?** No entry ⇒ the claim did nothing. The export
   must be **enabled** in the game's Mods list; a mod toggled off there is only
   applied after a restart, and a disabled mod's quests are not in the game.
2. **Is the export loaded at all?** The log's load banner —
   `[quest-editor] QE SDK 0.24 Editor QA Scaffold v1.0.xx loaded (editor build …)`
   — proves the runtime is in the session. No banner ⇒ it is not enabled.
3. **Did the node run?** With the banner present, `[quest-editor] twotter: created
   @qe24_editor (qe-tw-account) for quest …` is the line. Its absence (with no
   other `twotter:` line) means the quest's start hook never ran.
   `twotter: no Twotter API in this game build` and
   `twotter: creating @… failed (the story continues): …` are the other two
   possible lines, and each names its own cause.

If an older build left the quest claimed, `qe24 run clear` first — and if the
claim still does nothing on a clean save with the export enabled, that is a bug
report with the log lines attached.

### S-11 answered in part: `NEXT EVENT` shows the game's own job

With a mod job pending 29 days out, the clock panel read **`NEXT EVENT 4d 6h
[Wait]`** — the *game's* queued post job (23 Sep), not ours. So a mod job does
**not** take the panel's next-event slot ahead of a game job. Whether the panel
can show a mod job *at all* is still open, because ours was never the nearest.

The definitive check needs no new tooling (`TIMER-ROWS.md` has it):
`qe24 schedule 120` arms a harness job two in-game hours out — about two real
minutes — which **is** the nearest. Open the clock panel inside that window. If
it shows that job, mod jobs appear; if it still shows only the game's own, they
never do.

### Settled: S-11 green, S-10 shelved (fourth run, 2026-09-18)

**S-11 — mod jobs DO appear in the game's `NEXT EVENT`.** Running
`qe24 schedule 120` (a two-in-game-hour harness job, about two real minutes)
changed the clock panel's `NEXT EVENT` to **1 h 55 m and it ticked down**. So the
panel does show a mod's scheduled job when that job is the nearest one — the
earlier reading (`4d 6h`, the game's own post queue) was simply the game's job
being nearer, not a fence.

**S-10 — shelved, deliberately.** The short-month clamp needs an in-game date on
the 29th, 30th or 31st; two runs landed on other days and the author's call is
that the row costs more time than it is worth:

> I'm going to make a judgement call and shelf S-10 for now. We have more
> important things to check and this test eats up too much time. If it becomes a
> problem we'll deal with it.

Recorded as a decision, not a pass. The clamp logic stays covered by unit tests
(`src/schema/__tests__/timerCalendar.test.ts` — 31 Jan + 1 month = 28/29 Feb,
leap years included), and the plan's rule stands: if a bug report ever arrives,
that row becomes the first in-game check of the next Timer round.

**Visual pass on the row-fold fix (r183): green.** The author confirms the
inspector rows no longer clip and the layout is "nicely responsive when pushing
or pulling the inspector drawer" — which is the confirmation jsdom could not
give; the tests only asserted the shape of the fix.

### Settled: S-12 and S-15, and the clipped row they exposed (third run)

Both fixtures open on their quest now, and the screenshots show the migration
working:

| Row | Evidence |
| --- | --- |
| **S-12** pre-r176 draft | "When it fires" reads **Wait**, the **Hours** box shows **2**, the readback says "= 2 hours", the canvas card reads **2h**. |
| **S-15** r176-era draft | "When it fires" reads **A coming day**, the clock reads **18:23**, the preview says "Fires in 2 weeks, at 18:23 in-game…", the card reads **in 2w at 18:23** — the r176 amount+unit pair landed in the **Weeks** box. |

(The screenshots came in through the chat rather than the repository, so they are
not committed; what they show is recorded here.)

Both rows are **editor-only**: open the file, read the boxes. No export, no
install, no in-game step — which the tester reasonably asked about, because
`TIMER-ROWS.md` had not said so. It does now.

### The editor bug they found: boxes clipped off the right edge

Screenshot 2 also shows the "In" row's four boxes running past the inspector's
right edge, and the arithmetic makes it inevitable: each cell is 24px of padding
plus a 6px gap plus a ~36px unit caption plus a number box, so the row needs
about **28rem** — and the docked inspector is **340px** wide with a **340px**
floor (a floating drawer can be 280px).

Fixed in r183 by making the row fold: the row is a **container** (`@container`),
so the column count follows the *panel's* width rather than the window's. The
four-box row shows 2 × 2 at the default and opens to one line of four above
28rem; the six-box Wait row keeps its shipped look and only folds in a narrow
floating drawer. Widening the default was rejected on purpose — it would only
move the cliff, since the panel can still be dragged to its 340px floor.

**No test can prove the pixels moved** (jsdom has no layout): the tests assert
the shape of the fix, and the visual confirmation is a screenshot pass. If the
boxes still clip anywhere, that is a bug worth a round of its own.

### The S-12 / S-15 blocker before that: an editor bug, fixed in r182

Both fixtures opened in the editor as **"No quest selected"** with an empty
canvas and the first-run "Browse 13 templates" hint — indistinguishable from a
broken file, and the tester reported them broken.

The cause was ours and not fixture-specific: neither file carries
`editor.activeQuestId` (old, hand-written shapes — exactly what a migration
fixture should be), the schema accepts a missing one as `null`, and no load path
picked a quest. `ProjectSchema` now points the editor at the first quest that
ships whenever the active id is not a quest in the file, so **file load, import,
the autosaved draft, template construction and the export generator** all agree.

S-12 and S-15 are therefore **one look each**: open the file, read the boxes.

### The mess, and what caused it

The tester's own summary — *"a bit of a mess"* — was correct and is our fault:
by r180 the export plus harness auto-started **five** QA quests at load, four of
them with toasting debug nodes, on top of quests an earlier build had left
claimed on the save. The journal could not be read and a toast could not be
counted, and two rows were skipped explicitly because of it.

Fixed in r181: **no QA quest auto-starts** (harness 1.0.11 and export 1.0.9
both), QA debug nodes no longer toast, and the harness gained `qe24 run` —
`qe24 run` lists the quests, `qe24 run <alias>` claims exactly one, and
`qe24 run clear` unclaims everything (which is also how an existing save clears
the leftovers). Two guards assert that no QA quest auto-starts and no QA debug
node toasts, so the noise cannot come back quietly.

## Settled: the Timer's timezone question (S-04)

**Answer: the in-game clock displays the machine's local time.** The `at` mode's
timezone correction **stays** as shipped (`Date.UTC(...) − tz` in
`computeTimerFireAt`, `src/compiler/runtimeSource.ts`), and the comment there
now says so instead of holding the question open.

Evidence — `qe24 clock` on game 1.3.0, 2026-09-18, read against the taskbar clock:

| Reading | Value |
| --- | --- |
| `Time.now` | 1789755311205 |
| if the clock is UTC | 2026-09-18T18:15:11.205Z |
| if it is local time | Fri Sep 18 2026 20:15:11 GMT+0200 (Central European Summer Time) |
| `Time.date()` | Fri Sep 18 2026 20:15:11 GMT+0200 (Central European Summer Time) |
| **on-screen clock** | **20:17**, Friday 18 September 2026 |

The screen matches the **local** rendering (two minutes on: the read was taken
after the paste), not the UTC one.

Guarded by the `at`-mode test in `src/compiler/__tests__/scheduleBeat.test.ts`,
and the guard had to be repaired to be worth anything: it originally asserted
`Date.UTC(...) − new Date().getTimezoneOffset() * 60000`, which on a **UTC** box
(any CI, this sandbox) collapses to the uncorrected value — falsification showed
the test still passing with the correction deleted. It now fakes a UTC+2 machine
inside the test, so deleting the correction fails it wherever it runs.

## Verified in game

| Area | Where the result lives |
| --- | --- |
| r166 SDK surface — quest completion/cleanup, native Wi-Fi, Scheduler, HTTP/Browser/collaborator, phone `onEnd` probes | [`docs/plans/r166-sdk-0.24-ingame-qa.md`](../../docs/plans/r166-sdk-0.24-ingame-qa.md) § *Checklist and results* — every row Pass, tester report 2026-09-16, game 1.3.0 / Steam build 25341308 |
| Phone `onEnd` freeze probes (raw harness 1.0.6) | The phone rows of that table, plus [`QE24-TestResults - 3.md`](QE24-TestResults%20-%203.md) |
| Editor Wi-Fi (`QE24-LAB-5G`) and static website hosting | Same table (editor rows); HTTP *authoring* stays fenced — see below |
| S-04 clock zone | This file, above |
| Twotter probe T-01…T-03, T-05…T-07 | This file, above — game 1.3.0, build 25388883, report 2026-09-18 |
| Timer rows S-01…S-09, S-13, S-14 | This file, above — game 1.3.1, build 25388883, report 2026-09-18 |
| Timer row S-03 (cancel) | This file, above — same build, second run |
| Timer rows S-12, S-15 (the two migration fixtures) | This file, above — third run, editor build r183 |
| Timer row S-11 (`NEXT EVENT` and mod jobs) | This file, above — fourth run, harness 1.0.11 |

## Blocked, or deliberately not supported

| Row | Status |
| --- | --- |
| `curl` checks | **Blocked** — absent in the tested build even though the 1.3.0 changelog lists curl as added in that patch. Re-check with one command (`curl http://qe24-http.test/`) on the 1.3.1 build; do **not** re-run the HTTP checks, which are green through the Browser and `Http.fetch`. |
| DNS-only collaborator lookup | Unsupported in that build; Browser-based collaborator hits are green. Fenced and documented in [`docs/plans/r167-wifi-exposure-and-sdk024-roadmap.md`](../../docs/plans/r167-wifi-exposure-and-sdk024-roadmap.md). |
| Editor HTTP events on static websites | Static pages load, but their Browser traffic did not tick `Http.Request`/`Http.Response`; HTTP authoring stays fenced. Recorded in the r166 table. |
| Bettercap `set wifi.ap <BSSID>` showing `SSID: undefined` | Game-side display wart, not a mod bug. Noted so nobody re-files it. |

## Shelved — one Timer row

**S-10**, the short-month clamp: shelved by the author on 2026-09-18 (reason
above). Not a pass — a decision. The logic is unit-tested, and the row returns
only if a bug report asks for it.

They are **not blockers**: the runtime paths are covered by unit tests
(`src/compiler/__tests__/scheduleBeat.test.ts`), and the harness's `qe24 timers`
prints every pending Scheduler job with the in-game moment it will fire, so a
"1 month" row is read rather than waited for. (That section was written when
harness 1.0.11 was current; it is 1.0.13 now — see P-01a/P-01b above.)

Install `editor-export/` (mod 1.0.12, build `2026-09-18.r184`) and `mod/`
(harness 1.0.13) on a throwaway save. **Nothing auto-starts**: `qe24 run` lists
the quests, `qe24 run <alias>` claims one, `qe24 run clear` removes quests an
older build left behind. Row definitions:
[`r173`](../../docs/plans/r173-timer-rename-and-calendar.md),
[`r176`](../../docs/plans/r176-timer-calendar-ux.md),
[`r177`](../../docs/plans/r177-every-unit.md).
