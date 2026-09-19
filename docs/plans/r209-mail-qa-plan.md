# r209 (plan): Mail cleanup / replyable mail QA

**Plan for review — no code written yet.** Per the standing rule: this is
presented first, and implementation starts only after it is read and corrected.

## Why this round

Roadmap Next-up #1, now picked up:

> **Mail cleanup / replyable mail QA** — Focused QA first: `Mail.send()` id
> shape, `Mail.remove(id)` timing, whether `QuestMailDefinition.replyable`
> actually renders a Reply button, what event a reply raises, and cleanup on
> complete/unload. Then turn the verified parts into authoring.

Zeis also asked to re-examine the `moment` RFC2822 roadmap row, which still
blames mail — the evidence says that attribution is stale. One residual look at
it rides this batch (row M-09) rather than getting its own round.

## What SDK 0.24.0 declares (read from `index.d.ts`, not remembered)

| API | Declaration says |
| --- | --- |
| `Mail.send(mail): string \| null` | "Returns the id of the mail that was created, or `null`… Keep the id if the mail is something your mod may need to withdraw later; see `remove`." |
| `Mail.remove(id): boolean` | "Withdraw a mail from the player's inbox, permanently. Returns `false` if no mail has that id. Mail your mod sends lives in the player's save and is not removed when the mod is uninstalled, so a mod that wants to leave no trace should collect the ids it gets from `send` and remove them in `OnModPackageUnloaded`." — this is BUG 9's answer, now in the declarations. |
| `MailDefinition.replyable?: boolean` | "Show a Reply button under this mail. The player's reply raises `Mail.Sent` with a `repliedTo` field naming this mail, which is how a quest picks it up." |
| `QuestMailDefinition.replyable?: boolean` | "If true, the player can reply to this mail." (the quest's `Mails[]` entries) |
| `Mail.getInbox(): MailInfo[]` | `MailInfo = { id, from, to, subject, read, sentAt: number }` |
| `Mail.sendBounce(failedRecipient, options?)` | "undeliverable" bounce for phishing-style feedback — **not in the queue**, see M-10. |
| `Mail.markAsRead(id)`, `getPlayerEmail()`, `registerTemplate`/`unregisterTemplate(id)` | as before |

Mail events: `Mail.Received`, `Mail.Sent`, `Mail.Read` all carry
`{ id, from, to, subject, content, sentAt, metadata? }`; `Mail.MailboxOpened`
carries the game's own `sendedAt` shape. **`Mail.Sent` fires for any mail the
player sends** — known from the r48-era QA and the bug report's Q1 — so a quest
listening for a reply must be able to tell that reply apart from every other
outgoing mail. That is exactly what `repliedTo` claims to be for.

## Three discrepancies reading found (why a probe, not a refactor)

1. **`repliedTo` is promised by a doc comment but absent from the payload
   interface.** `MailDefinition.replyable`'s comment says the reply raises
   `Mail.Sent` *with a `repliedTo` field* — but `MailEvent`, the declared
   payload of `Mail.Sent`, has no such field. One of the two is wrong. If
   `repliedTo` exists only at runtime (undeclared), the editor's generated
   event catalogue can never offer it as a condition field until we know; if it
   does not exist at all, **no quest can match a reply to its own mail** except
   by `to`/`subject`/`metadata` heuristics, and reply-driven authoring needs a
   developer question filed before anything is built. M-05 settles it by
   logging the **raw payload**.
2. **The editor runtime's replyable path is built on a stale-SDK assumption.**
   `runtimeSource.ts` still comments "`MailDefinition` — what `Mail.send`
   takes — has no `replyable`" and routes a replyable mail through
   `Quest.sendMail(index)` instead; `compile.ts`'s author-facing info warning
   calls Quest.sendMail "the only path that carries a reply flag". SDK 0.24's
   `MailDefinition.replyable` contradicts both. **No code changes now** —
   whether the direct `Mail.send({ replyable: true })` path actually renders
   the Reply button is precisely what M-04 decides. The stale warning text is
   fixed in the authoring round, once the truth is known.
3. **Cleanup is prescribed but unmeasured.** The declarations (and BUG 9's dev
   answer) prescribe collect-the-ids-and-remove-on-unload, but nothing here has
   seen `remove` work in game: not its return values, not removing a mail that
   was never read (M-03 — BUG 10 taught us delivery is queued, so a queued mail
   is a real case), not whether a removal persists across save/reload, and not
   the unload hook, which per T-15c only fires on the disable-then-restart
   path. M-02/M-03/M-07/M-08 measure all four.

And the carried-over item: the `moment` warning. The developer's BUG 10 answer
(docs/07): it was never mail — mail timestamps are engine-set numeric world
time — it was Twotter/Kisscord dates written with `Date.toString()` in *mod
content*, and the 30–90 s delay was the mail queue's delivery timeout, a
coincidence. Our own r185 measurement (STATUS **T-09b**, game 1.3.1) agrees from
our side: the one warning in that session's log came from a **game** tweet's
`sendedAt`; our ISO-with-ms stamps never trigger one. The README row's
"only appears with a quest-editor mod installed … 30–90 s after a mail is sent"
is stale in both halves. What is left is one cheap look (M-09), then the row
closes or is re-filed as a game-content blemish.

## The rows — one session, harness **1.0.24** only

Install the raw harness (`reference/sdk-0.24-qa/mod/`, whole folder). Nothing
auto-starts. The editor export is untouched this round.

| Row | Command / action | What it decides |
| --- | --- | --- |
| **M-01** id shape | `qe24 mail send` (plain). Read the printed id; open GoMail. Then save → quit → reload → `qe24 mail audit` | `send` returns a **non-null id**; the inbox entry carries the **same id**; the id **survives a save/reload** (it is the handle cleanup needs). |
| **M-02** remove basics | `qe24 mail remove last`, then again, then `qe24 mail remove qe-nope` | First call **true** and the mail leaves GoMail; second call **false**; unknown id **false** — the boolean is trustworthy as a cleanup report. |
| **M-03** remove timing | `qe24 mail send`, then `qe24 mail remove last` **immediately**, then save → quit → reload → `qe24 mail audit` | A mail can be withdrawn **before it is ever read** — including while still queued (the BUG 10 timeout says delivery is queued) — and the removal **persists in the save**. |
| **M-04** replyable, direct path | `qe24 mail send replyable`; open the mail in GoMail | A Reply button **draws** under a mail sent by direct `Mail.send({ replyable: true })` — the path the editor runtime avoids because its comment says the flag does not exist there (stale vs 0.24). |
| **M-05** the reply event | `qe24 mail watch on`; click **Reply** on the M-04 mail; type anything; send | The watcher prints every `Mail.Sent` payload **verbatim as JSON**. Does `repliedTo` exist, and does it carry the original mail's id? Is `metadata` echoed? **This decides how a quest can match a reply at all.** |
| **M-06** replyable, quest path | `qe24 run mail` — claims the probe quest; its `OnStart` sends `Mails[0]` (replyable) via `this.sendMail(0)`; open it in GoMail | Reply button draws on the **Quest.sendMail** path too — the path the editor ships today. |
| **M-07** cleanup on quest end | `qe24 mail cleanup on`; `qe24 mail send`; complete (or abandon) the probe quest; `qe24 mail audit` | A quest's **own end hook** removes the mails it sent; the audit afterwards lists none of them. |
| **M-08** cleanup on unload | `qe24 mail unload on`; disable the harness in the Mods list; restart the game; open GoMail on the save | The **OnModPackageUnloaded sweep** (the dev-prescribed pattern) really removes the mod's mails — same hook semantics as Twotter's T-15c: only the disable-then-restart path can fire it. |
| **M-09** the moment residual | Clean save, **no mods**: open Twotter and a browser, check the log. Then harness only, M-01…M-04, check the log again | The warning appears **only** from game content (T-09b), never from anything the mail rows send — closes the stale README row with evidence either way. |
| **M-10** *(optional — Zeis's call)* | `qe24 mail bounce` | `Mail.sendBounce` draws a mailer-daemon mail. Not in the queue; read only if he wants the later authoring candidate priced in. |

Batched in one session per the r207 process rule. Do **not** run any `off`
command before its row's look is done — each `watch off` / `cleanup off` /
`unload off` removes exactly what its `on` registered.

## Harness changes (1.0.23 → 1.0.24)

- New `qe24 mail` group: `send [plain|replyable]`, `audit`, `remove <id>|last`,
  `watch on|off`, `cleanup on|off`, `unload on|off`, and `bounce` if M-10 is
  approved. Session state: the ids of every mail this session sent.
- New launcher alias `mail` → `QESdk024MailQa` (claimed on demand via
  `qe24 run mail`; nothing auto-starts — the r181 rule).
- The watcher logs `Mail.Sent` payloads **raw** (`JSON.stringify` of the whole
  event), which is what catches an undeclared `repliedTo` that the declared
  interface denies.
- `qe24 guide` / `qe24 next` list the new commands; manifest version and
  description bumped. The manifest already carries the `mail` permission.

## Tests (each falsified by revert before it counts)

Extend `src/compiler/__tests__/sdk024QaScaffold.test.ts` — the file that
already loads the real, hand-authored harness against a stub SDK — with a
Mail-stub block driving the new group: send prints the returned id and reads
the inbox; `remove last` calls `remove` with the stored id and reports
true/false honestly; the watcher logs the raw payload; `cleanup on` removes
exactly the collected ids from the quest-end hook; `unload on` removes them
from the unload hook; the probe quest's `OnStart` calls `this.sendMail(0)` with
a replyable `Mails` array; and no QA quest auto-starts. `node --check` on
`mod.js` after every hand edit (the r173 scar).

## Explicitly out of scope this round

- **No editor changes** — `EDITOR_BUILD` stays `2026-09-19.r208`, the QA export
  is not regenerated, no runtime/compile/schema edits, no roadmap promises
  about authoring yet.
- **Authoring is the next round, evidence-gated.** Candidates, decided only by
  what M-01…M-09 answer: a mail-cleanup surface (remove on complete/unload)
  if M-07/M-08 prove the mechanics; simplifying the runtime's replyable path to
  direct `Mail.send({ replyable })` and fixing the stale compile warning text,
  if M-04 proves the button draws; a developer question in docs/03 first if
  M-05 shows a reply cannot be matched reliably.
