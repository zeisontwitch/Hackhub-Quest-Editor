# Playtest: the mail-authoring round (r211) — quest `QESdk024MailAuthoringQa`

**RAN 2026-09-21 — W-01…W-04 GREEN.** Results:
[`QE24-TestResults-MailAuthoring.md`](QE24-TestResults-MailAuthoring.md). Kept
for the record; W-05 needs no run (see its verdict in the results file).

One session, one quest, five reads. Everything the quest does is the r211
authoring surface: a **replyable** mail sent direct (M-04), a **reply
trigger** matched by `to` = the mail's From (M-05/M-06), and a
**withdraw-on-quest-end** mail beside a keep-me control (M-02/M-03/M-07).

**Install (both folders matter):**

- `reference/sdk-0.24-qa/editor-export/` → **1.0.40** — the probe quest lives
  here. (1.0.38/1.0.39 are the builds the first two attempts exposed: see the
  history at the bottom.) Replace whatever export folder is installed; this one also still ships
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
| **W-03** withdraw at complete | After the objective ticks, the quest **completes itself** (a terminal Complete-quest node sits on the objective's done wire — the journal's Complete button is not part of this probe; it defaults off per docs/04's old crash bug, and nodes are the editor's completion path). | The journal entry reads finished; *withdraw me* **vanishes** from GoMail; *keep me* and *reply to me* stay. Log: `objective "send-a-reply" completed by Mail.Sent`, then `quest completed by Complete quest node`, then `cleanup: Mail.remove(… "QE24 authoring: withdraw me") -> true`. (A `[CompleteObjective] … already completed (in-memory)` WARN right after the tick is expected and benign — our listener and the engine's declarative trigger both fire by design.) |
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

- **2026-09-21, first W-01 attempt (export 1.0.38):** the objective completed
  itself the moment the quest was accepted. Root cause in the **editor's
  compiled runtime**: the flow runner ticked every objective the flow stepped
  into, trigger or not. Fixed in r212. **W-01/W-02 then ran green** (three
  mails, Reply button only on the third, the reply recipe ticked the
  objective) — but W-03 was untestable: no Complete button. Two causes, both
  ours: the first probe had no ending at all (`hasCompleteButton` defaults
  off per docs/04), and fixing that exposed a second runtime bug — flow
  arrival followed the objective's **done** wire immediately, completing the
  quest at start. r213 stops flow at trigger objectives entirely; the
  listener runs the done wire when the event matches. Export **1.0.40**
  carries both fixes; the end-to-end chain (reply → objective → quest
  completes → `Mail.remove` of the armed id) is verified locally against the
  compiled artifact.

**About the quest stuck on your save from the 1.0.39 session:** after
swapping to 1.0.40, abandon it from the journal (it can no longer complete —
that quest instance predates the done wire). Note the withdrawal arming is
**session-scoped**: if you have restarted the game since that run, the old
*withdraw me* mail stays in the inbox forever — that is the documented
in-session cleanup limit (M-08), not a new bug. Then start fresh with
`qe24 run mailauth`.
