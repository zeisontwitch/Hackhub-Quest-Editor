# r211 (plan) — mail authoring: the M-answers become editor features

**Status: approved and implemented in r211** (all three open questions resolved as recommended: flag default off, quest-path kept as throw-fallback, one export swap). One correction to the plan's guess: the editable-field count stays **160** — the mail branch is edited through its sim (`MailSim.tsx`), which the manual's field count does not enumerate.

The mail rows ran and closed (r210; transcript
[`../reference/sdk-0.24-qa/QE24-TestResults-Mail.md`](../../reference/sdk-0.24-qa/QE24-TestResults-Mail.md)).
This round turns the answers into what authors click and what the runtime does.
The evidence base, compressed:

- **M-04:** the Reply button draws on the direct `Mail.send({ replyable: true })`
  path. The runtime's reason for routing replyable mail through
  `Quest.sendMail` ("only that shape carries the flag") is disproved.
- **M-05/M-06:** a reply's raw payload has **no `repliedTo`**; its subject is
  the constant `(Reply)`; what identifies it is **`to` = the original's
  `from`**. Both reply paths proven by a trigger-condition objective tick.
- **M-02/M-03:** `Mail.remove(id)` → `true`/`false`, works on a never-read
  mail, persists across save → quit → reload.
- **M-07:** quest-end (complete **and** abandon) cleanup works in-session —
  but the quest path returns no id, so a from-address fallback was needed.
- **M-08:** the unload hook is refused everything gated — in-session cleanup
  is the only cleanup there will ever be on 1.3.1.

The good news from reading the code: **the editor already authors reply
triggers.** Triggers take field conditions on event payloads, and the Bad
Attachment template matches `Mail.Sent` on `to contains <address>` — exactly
the pattern M-05/M-06 just proved in game. So this round is mostly **switching
paths, adding one cleanup flag, and rewriting guidance that the run
disproved** — not new machinery.

## Changes

### 1. Replyable mails go out direct (runtime switch)

`runtimeSource.ts` (~:1355–1430): when the author ticks *replyable*, send
through `Mail.send({ …, replyable: true })` — M-04. Capture the **returned id**
(the cleanup handle). Keep `Quest.sendMail` only as the fallback when
`Mail.send` throws (order reversed; the old primary becomes the safety net).
Keep the `Quest.Mails[]` copy-refresh (journal consistency, harmless).
Rewrite the two log lines: the "no Reply button will appear" warning dies with
the assumption; the fallback now logs that the flag could not be delivered.

Consequence worth stating: **every editor-sent mail now carries an id**, which
makes change 2 exact instead of heuristic.

### 2. "Withdraw when the quest ends" flag on the mail branch

- Schema (`nodes.ts`, `MailNodeDataSchema`): `withdrawOnQuestEnd:
  z.boolean().default(false)`.
- Registry: one checkbox on the mail branch — *Withdraw this mail from the
  player's inbox when the quest ends (completed or abandoned).* Default off: a
  story mail is content the player may want to re-read; withdrawing is the
  author's explicit call. (Alternative considered: mirror the network/domain
  flags' default-on. Rejected — mail is the player's inbox, not world state.)
- Runtime: after a successful direct send, if the flag is set push
  `{ kind: "mail", id, subject }` onto the **existing** `questCleanup` array
  (the same drain that reclaims tweets, networks, databases;
  `runQuestCleanup(reason)` already runs on complete and abandon — M-07's
  proof). Extend the drain: `Mail.remove(id)`, API-presence-gated, logging
  `[qe24] quest cleanup: Mail.remove(<id>) -> <bool>` per call.
- If the fallback path sent the mail (no id), the flag logs honestly that the
  mail cannot be withdrawn (no handle) — never a silent no-op. M-08's
  unload lesson applies unchanged: no save persistence beyond what M-03
  measured (a removal done in-session persists).

### 3. Compiler guidance: replace the disproved warning

- `compile.ts:536`: the old text tells authors replyable mail "is sent through
  Quest.sendMail — the only path that carries a reply flag". Rewrite: replyable
  mail goes out direct and the button draws; the thing an author must get
  right is the **from** address, because a reply is matchable only by
  `to` = that address (M-05/M-06) — point at the `Mail.Sent` trigger on `to`.
- New info warning: `replyable` set but **from empty** — "replies arrive
  addressed to your mail's from address; with no from set there is nothing a
  trigger can match" (the runtime resolves from from the node data alone,
  `mailFrom[node.id]`, so empty really is empty).

### 4. Help text and the event catalogue entry

- The mail branch's help/note text (registry) gains the reply recipe:
  *tick replyable → set a from address → trigger on `Mail.Sent` where `to`
  contains that address.*
- `eventDocs.ts`'s `Mail.Sent` line ("Match who it went to, or what it says.")
  gains the reply fact ("a player's reply to your mail arrives addressed to
  your from address"), then `npm run gen:events` regenerates the catalogue.

### 5. Counts, stamps, export (the round's plumbing)

`EDITOR_BUILD` → `2026-09-20.r211` + the manual stamp sweep; `gen:manual` (the
new field moves the editable-field count 160 → 161 and the comms-dialogue
page); README build-status line (tests/fields); QA export → **1.0.37**
regenerated — schema-only change, the QA project data carries no replyable
mail node, so the export's behavior does not change.

## Tests and falsification

- Runtime pins (the `compile.test.ts` / dialogue-test strings that currently
  assert the `Quest.sendMail`-first order and the "no Reply button" log):
  rewritten to assert direct-with-flag first, id captured, cleanup push, and
  the honest no-handle log.
- New: cleanup drain test (a quest with `withdrawOnQuestEnd` mail; complete
  and abandon each call `Mail.remove(id)` once; the flag off leaves it).
- New: the from-missing warning; the rewritten replyable warning text.
- Schema: field defaults false; survives a project round-trip.
- Five-ish mutations to falsify, then restore: path order reverted; cleanup
  push removed; drain kind dropped; warning text reverted to old; schema field
  removed — each must go red, then green again.
- Full gates, then commit and push immediately.

## What Zeis should playtest after implementation (jsdom cannot see these)

1. An editor-authored replyable mail **draws its Reply button** (M-04 says it
   will — confirm in the compiled mod, not the harness).
2. Replying fires a `Mail.Sent`-on-`to` trigger and ticks the objective.
3. A `withdrawOnQuestEnd` mail leaves the inbox at quest end — complete
   **and** abandon — and stays gone after a reload (M-03 says it will).

## Open questions for review

1. **Flag default**: off (my recommendation) vs. default-on like the
   domain/firewall cleanup flags.
2. **Keep `Quest.sendMail` as the throw-fallback?** My recommendation: yes,
   reversed order — it is already written and tested, and costs nothing.
3. **Export swap cadence**: 1.0.36 (r210's cleanup export) and 1.0.37 (this
   round) can be swapped in one step — 1.0.37 also ships no extras. If you
   have not swapped yet, waiting for 1.0.37 is fine; run `qe24 extras cleanup`
   either way.
