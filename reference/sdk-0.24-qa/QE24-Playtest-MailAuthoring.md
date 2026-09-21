# Playtest: the mail-authoring round (r211) — quest `QESdk024MailAuthoringQa`

One session, one quest, five reads. Everything the quest does is the r211
authoring surface: a **replyable** mail sent direct (M-04), a **reply
trigger** matched by `to` = the mail's From (M-05/M-06), and a
**withdraw-on-quest-end** mail beside a keep-me control (M-02/M-03/M-07).

**Install (both folders matter):**

- `reference/sdk-0.24-qa/editor-export/` → **1.0.39** — the probe quest lives
  here. (1.0.38 is the build the first W-01 attempt exposed: see the history
  line at the bottom.) Replace whatever export folder is installed; this one also still ships
  no extras, so it cannot re-create the old surfaces.
- `reference/sdk-0.24-qa/mod/` → **1.0.26** — optional but convenient: its
  `qe24 run` launcher knows the probe (`qe24 run mailauth`). The 1.0.25
  harness works too — see the second start route below.

**Start the quest** either way:

- accept **“QA probe (r211): three mails, one reply”** from the Hackhub feed,
  or
- console: **`qe24 run mailauth`** (needs the 1.0.26 harness).

| Row | Do | Green reads |
| --- | --- | --- |
| **W-01** arrival + the button | Start the quest, wait a minute or two, open GoMail. | Three mails arrive: *keep me*, *withdraw me*, *reply to me*. A **Reply button** shows under *reply to me* **only** — and the game log has `mail "QE24 authoring: reply to me" sent via Mail.send [replyable]`. |
| **W-02** the reply recipe | Reply to *reply to me* with anything. | The journal objective **“send a reply”** ticks (the trigger matched your reply's `to` = `qa-reply@qe24.test`) and the **Complete** button appears. |
| **W-03** withdraw at complete | Click **Complete**. | *Withdraw me* **vanishes** from GoMail; *keep me* and *reply to me* stay. Log: `cleanup: Mail.remove(… "QE24 authoring: withdraw me") -> true`. |
| **W-04** it stays gone | Save → quit → reload → GoMail. | *Withdraw me* is still gone (M-03 said the removal persists); *keep me* is still there. |
| **W-05** the abandon path *(optional, fresh run)* | Run the quest again and **abandon** it from the journal instead of completing. | *Withdraw me* vanishes at abandon too — same drain, other hook (M-07 measured both). |

Two honest-failure modes to watch for (neither should appear): the log line
`no id to remove` (the send fell back to the quest path, which has no id) —
if you see it, the withdrawal could not arm; and the Reply button missing
from *reply to me* — that would contradict M-04 and reopen the row.

Paste the game log and a yes/no per row into
`QE24-TestResults-MailAuthoring.md` on the QA-Filedump branch, same as the
mail round. Rows W-01…W-05 are recorded as open in
[`STATUS.md`](STATUS.md).

## History

- **2026-09-20, first W-01 attempt (export 1.0.38):** the objective completed
  itself the moment the quest was accepted. Root cause was in the **editor's
  compiled runtime**, not the probe or the save: the flow runner ticked every
  objective the story flow stepped into, including ones that carry a trigger
  event — so `reply → objective` (the natural wiring, and the Bad Attachment
  template's own shape) pre-empted the Mail.Sent trigger. Fixed in r212
  (runtime now skips flow-ticking for trigger-carrying objectives); the same
  latent bug shadowed every template with a trigger objective reached by
  flow. Export 1.0.39 carries the fix — start again from W-01.
