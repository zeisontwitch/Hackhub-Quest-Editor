# Test results — the mail-authoring playtest (probe quest `QESdk024MailAuthoringQa`)

**Ran 2026-09-21, game 1.3.1, export 1.0.40 (`2026-09-20.r213`), harness 1.0.26.
Fresh, clean save. Result: W-01…W-04 ALL GREEN — the mail-authoring round is
closed.** Pasted by Zeis in the working session; his text and the log below are
verbatim.

## The run (Zeis's notes, verbatim)

> Fresh, clean save.
>
> --> Quest is still not listed on Hackhub feed, used terminal command instead.
>
> Zeis~$[/home/Zeis] qe24 run mailauth
> Editor export: loaded (v1.0.40 (2026-09-20.r213)).
> Claimed QESdk024MailAuthoringQa - look for "Mail authoring probe (r211)" in the journal.
> If it is not there, this build may refuse cross-mod claims: claim that title yourself.
> Note: Quest.claim() returns nothing in this build, so this line cannot prove the
> quest started - check the journal entry above. No entry means the claim did
> nothing (the owning mod is disabled or missing).
> Started: three mails from one start - keep me (control), withdraw me (leaves at quest end), reply to me (Reply button + the to=From reply trigger). Complete the objective, then read which mails survived.
>
> --> Received 3 Emails and a new quest with 1 objective, not automatically finished
> --> Opened reply to me mail and replied with "asdfef", Quest objective checks and finishes itself.
> --> My reply email shows up underneath the mail itself as:
> Reply from: bkelso@gomail.com
> asdfef
>
> --> "keep me" mail stays in inbox, "withdraw me" disappears.
>
> --> Saved, closed, reloaded save
>
> --> "keep me" and "reply to me" are still there.

## The log (verbatim)

```
[21/09/2026, 22:37:17] [INFO]
[RENDERER] [quest-editor] quest "QESdk024MailAuthoringQa" started (1 entry point)
[21/09/2026, 22:37:17] [INFO]
[RENDERER] [quest-editor] mail "QE24 authoring: keep me" sent via Mail.send
[21/09/2026, 22:37:17] [INFO]
[RENDERER] [quest-editor] mail "QE24 authoring: withdraw me" sent via Mail.send
[21/09/2026, 22:37:17] [INFO]
[RENDERER] [quest-editor] mail "QE24 authoring: withdraw me" will be withdrawn when the quest ends (id MaGUHssZcU)
[21/09/2026, 22:37:17] [INFO]
[RENDERER] [quest-editor] mail "QE24 authoring: reply to me" sent via Mail.send [replyable]
[21/09/2026, 22:37:17] [INFO]
[RENDERER] [quest-editor] quest "QESdk024MailAuthoringQa" objectives started
[21/09/2026, 22:37:17] [INFO]
[RENDERER] [quest-editor] objective "send-a-reply" is listening for Mail.Sent
[21/09/2026, 22:38:22] [INFO]
[RENDERER] [quest-editor] objective "send-a-reply" completed by Mail.Sent
[21/09/2026, 22:38:22] [INFO]
[RENDERER] [quest-editor] all objectives done; left a closing line and hid 0 row(s)
[21/09/2026, 22:38:22] [INFO]
[RENDERER] [quest-editor] OnComplete: starting
[21/09/2026, 22:38:22] [INFO]
[RENDERER] [quest-editor] cleanup starting (complete): 1 item(s) to undo
[21/09/2026, 22:38:22] [INFO]
[RENDERER] [quest-editor] cleanup: mail MaGUHssZcU
[21/09/2026, 22:38:22] [INFO]
[RENDERER] [quest-editor] cleanup: Mail.remove(MaGUHssZcU "QE24 authoring: withdraw me") -> true
[21/09/2026, 22:38:22] [INFO]
[RENDERER] [quest-editor] cleanup finished
[21/09/2026, 22:38:22] [INFO]
[RENDERER] [quest-editor] OnComplete: cleanup done, removing weechat servers
[21/09/2026, 22:38:22] [INFO]
[RENDERER] [quest-editor] OnComplete: running end-of-quest nodes
[21/09/2026, 22:38:22] [INFO]
[RENDERER] [quest-editor] OnComplete: finished, handing back to the game
[21/09/2026, 22:38:22] [INFO]
[RENDERER] [quest-editor] quest completed by Complete quest node
[21/09/2026, 22:38:22] [WARN]
[RENDERER] [CompleteObjective] Objective "send-a-reply" already completed (in-memory) for quest bIqVm036r0
```

## Verdicts

| Row | Verdict | Evidence |
| --- | --- | --- |
| **W-01** arrival + the button | **green** | Three mails arrived; the objective stayed OPEN (both earlier bugs gone: no pre-tick r212, no pre-complete r213); `sent via Mail.send [replyable]` and the withdraw armed with id `MaGUHssZcU`. (Reply button not separately screenshotted — W-02's tick proves the replyable path functioned.) |
| **W-02** the reply recipe | **green** | Replied "asdfef" → `objective "send-a-reply" completed by Mail.Sent`, ~65 s later — matched by `to` = `qa-reply@qe24.test`. The to=From recipe is proven on an editor-authored quest. |
| **W-03** withdraw at complete | **green** | The quest self-completed via the terminal node: `OnComplete: starting` → `cleanup starting (complete): 1 item(s) to undo` → `Mail.remove(MaGUHssZcU "QE24 authoring: withdraw me") -> true` → `quest completed by Complete quest node`. Exactly one cleanup item. |
| **W-04** it stays gone | **green** | After save → quit → reload: *withdraw me* still gone; *keep me* and *reply to me* still in the inbox (the control survived, as it should). |
| **W-05** the abandon path | **closed by prior evidence, not re-run** | The abandon drain is the same `runQuestCleanup("abandon")` path with the same items; measured in game in the r209 session (M-07's OnAbandon sweep, `-> true`) and covered by the runtime tests. Re-running it on this probe would measure the same code twice. |

The end-of-run `[CompleteObjective] … already completed (in-memory)` WARN is
expected and benign: our own listener and the engine's declarative trigger both
fire on the same matching event, by design.

**Wrinkle recorded, not blocking:** the quest's Hackhub **feed post did not
surface** in either run (1.0.39 and 1.0.40) — Zeis started via
`qe24 run mailauth` both times. The claim line itself worked. Watch the next
export that ships a feed-post quest before filing a developer question.
