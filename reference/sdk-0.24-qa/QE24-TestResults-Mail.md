# M-09

Created a new clean save, removed all mods, loaded that save so the game runs its cleanup, then restarted.

Opened Twotter, opened a profile, searched for "test", then closed the game. Full Game Log:

```==============================================
  HACKHUB LOG FILE
  Started: 20/09/2026, 12:45:11
  Version: 1.3.1
  Platform: win32
  Arch: x64
==============================================


==============================================
[20/09/2026, 12:45:11] [INFO]
----------------------------------------------
Steamworks initalized: Zeis [ZF] - 76561197976480835
==============================================

==============================================
[20/09/2026, 12:45:11] [INFO]
----------------------------------------------
[WorkshopController] initialized with appId: 2980270
==============================================

==============================================
[20/09/2026, 12:45:16] [WARN]
----------------------------------------------
[RENDERER] [Scheduler] Holding job "Queue.HandleQuestHackhubPosts": no handler registered.
==============================================

==============================================
[20/09/2026, 12:45:20] [WARN]
----------------------------------------------
[RENDERER] Deprecation warning: value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are discouraged. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.
Arguments: 
[0] _isAMomentObject: true, _isUTC: false, _useUTC: false, _l: undefined, _i: Wed Sep 09 2026 12:32:30 GMT+0200 (Central European Summer Time), _f: undefined, _strict: undefined, _locale: [object Object]
Error
    at O.createFromInputFallback (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/utils.js:9:3)
    at $m (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/utils.js:9:25839)
    at Qm (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/utils.js:9:29577)
    at Xo (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/utils.js:9:29441)
    at Xm (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/utils.js:9:29155)
    at Qo (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/utils.js:9:29944)
    at ne (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/utils.js:9:29978)
    at O (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/utils.js:6:31)
    at RSe (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/index.js:167091:102678)
    at ei (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/vendor.js:22:16958)
    at ga (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/vendor.js:24:43694)
    at va (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/vendor.js:24:39499)
    at gc (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/vendor.js:24:39430)
    at Qr (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/vendor.js:24:39289)
    at da (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/vendor.js:24:34440)
    at E (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/vendor.js:9:1562)
    at MessagePort.rt (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/vendor.js:9:1930)
==============================================

==============================================
[20/09/2026, 12:45:34] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam failed after 61ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
  APPLICATION CLOSING
  Time: 20/09/2026, 12:45:37
==============================================```

# M-01 (Green?)

You didn't tell me which of our two QE mods specifically to install (`mods` or `export-mods` or both) so I installed both.

Zeis~$ [/home/Zeis] qe24 mail send
Mail.send -> id: 8SaLAMoEmk
subject: QE24 mail probe (plain)
from: qe24-direct@qe24.test replyable: false
Open GoMail: the mail should be there carrying the SAME id (M-01), and with
save -> quit -> reload -> qe24 mail audit the id should survive (M-01's second half).
Then: qe24 mail remove last (M-02), or remove it while still unread for M-03.

--> The Mail (QE24 mail probe (plain)) I received is marked as read already. 

Zeis~$ [/home/Zeis] qe24 mail audit
QE24 mail audit - session sends: 1, watcher: off, cleanup: off
Inbox entries visible to getInbox: 28
id 8SaLAMoEmk (QE24 mail probe (plain)): still in the inbox
Probe mails in the inbox by subject: 0
No probe subjects in the inbox. If GoMail also shows none, the removal rows are green;
if GoMail still shows one, it never reached getInbox - that difference is a result.
Read this after the reload halves of M-01/M-03 and after M-07's quest end.

# M-02 (Green)

Zeis~$ [/home/Zeis] qe24 mail remove last
Mail.remove(8SaLAMoEmk) -> true
true = withdrawn, false = no mail has that id. Open GoMail and confirm it is gone,
then save -> quit -> reload -> qe24 mail audit to check the removal persisted (M-03).

Zeis~$ [/home/Zeis] qe24 mail remove last
Mail.remove(8SaLAMoEmk) -> false
true = withdrawn, false = no mail has that id. Open GoMail and confirm it is gone,
then save -> quit -> reload -> qe24 mail audit to check the removal persisted (M-03).

Zeis~$ [/home/Zeis] qe24 mail remove qe-nope
Mail.remove(qe-nope) -> false
true = withdrawn, false = no mail has that id. Open GoMail and confirm it is gone,
then save -> quit -> reload -> qe24 mail audit to check the removal persisted (M-03).

# M-03 (Green)

Zeis~$ [/home/Zeis] qe24 mail send
Mail.send -> id: NfjMv8qTcR
subject: QE24 mail probe (plain)
from: qe24-direct@qe24.test replyable: false
Open GoMail: the mail should be there carrying the SAME id (M-01), and with
save -> quit -> reload -> qe24 mail audit the id should survive (M-01's second half).
Then: qe24 mail remove last (M-02), or remove it while still unread for M-03.

Zeis~$ [/home/Zeis] qe24 mail remove last
Mail.remove(NfjMv8qTcR) -> true
true = withdrawn, false = no mail has that id. Open GoMail and confirm it is gone,
then save -> quit -> reload -> qe24 mail audit to check the removal persisted (M-03).

--> Did not open Gomail. Save, Quit, reload

Zeis~$ [/home/Zeis] qe24 mail audit
QE24 mail audit - session sends: 2, watcher: off, cleanup: off
Inbox entries visible to getInbox: 27
id 8SaLAMoEmk (QE24 mail probe (plain)): GONE (removed, or never reached the inbox)
id NfjMv8qTcR (QE24 mail probe (plain)): GONE (removed, or never reached the inbox)
Probe mails in the inbox by subject: 0
No probe subjects in the inbox. If GoMail also shows none, the removal rows are green;
if GoMail still shows one, it never reached getInbox - that difference is a result.
Read this after the reload halves of M-01/M-03 and after M-07's quest end.

# M-04 (Green)

Zeis~$ [/home/Zeis] qe24 mail send replyable
Mail.send -> id: 4y45WyROh1
subject: QE24 mail probe (replyable)
from: qe24-direct@qe24.test replyable: true
Open GoMail: the mail should be there carrying the SAME id (M-01), and with
save -> quit -> reload -> qe24 mail audit the id should survive (M-01's second half).
A Reply button under this mail is M-04's green. Run `qe24 mail watch on` BEFORE
clicking it, so the reply's raw payload lands in the game log (M-05).

--> The mail does indeed have a Reply button

# M-05 (Green)

Zeis~$ [/home/Zeis] qe24 mail watch on
Mail.Sent watcher ON - every mail the player sends is logged RAW to the game log.
Now reply to a replyable probe mail in GoMail (M-05). The line to paste starts with:
[qe24] Mail.Sent payload: { ... }
The whole question: does the payload carry "repliedTo", and is it the original
mail's id? The DECLARED payload has no such field, so whatever appears here is
undeclared - and it decides whether a quest can match a reply at all.

--> I click "Reply", type "asdf", send it -> it shows up underneath the mail as (note: bkelso@gomail is my in-game email address), no repliedTo is visible:
Reply from: bkelso@gomail.com
asdf

Zeis~$ [/home/Zeis] qe24 mail watch off
Mail.Sent watcher OFF - replies are no longer logged.

Game Log:
```==============================================
[20/09/2026, 13:03:25] [INFO]
----------------------------------------------
[RENDERER] [qe24] Mail.Sent payload: {"id":"d5eRUBLmJ6","from":"bkelso@gomail.com","to":"qe24-direct@qe24.test","subject":"(Reply)","content":"asdf","sentAt":1789902205922}
==============================================```

# M-06 (Green)

--> You said "watch stays on" but made me turn it off in the previous step, so I'm turning it back on.

Zeis~$ [/home/Zeis] qe24 run mail
Editor export: loaded (v1.0.35 (2026-09-19.r209)).
Claimed QESdk024MailQa - look for "QE24 mail QA (replyable + cleanup rows M-06/M-07)" in the journal.
If it is not there, this build may refuse cross-mod claims: claim that title yourself.
Note: Quest.claim() returns nothing in this build, so this line cannot prove the
quest started - check the journal entry above. No entry means the claim did
nothing (the owning mod is disabled or missing).
Started: sends its replyable Mails[0] through this.sendMail(0) at start (M-06: does the Reply button draw on the quest path?), and its end hook sweeps the probe mails once `qe24 mail cleanup on` is armed (M-07).
Mail rows: run `qe24 mail watch on` BEFORE replying (M-05 reads the raw reply
payload from the game log), and `qe24 mail cleanup on` BEFORE completing or
abandoning this quest (M-07). `qe24 mail audit` reads the aftermath; the
direct-path rows need no quest at all: qe24 mail send [plain|replyable].

--> Opened mail, clicked reply, sent "asdff", first quest objective ticked

# M-07 (Red?)

Zeis~$ [/home/Zeis] qe24 mail cleanup on
Cleanup ARMED - when the mail QA quest ends (complete OR abandon), its hook removes
every session id Mail.send returned AND every inbox mail whose subject starts with
"QE24 mail probe" (the sendMail path returns no id, so its mail is found by subject).
Each removal is logged as [qe24] mail sweep: ... - that log is M-07's evidence.
Then: qe24 run mail (if not already running), do the reply, and complete or abandon
the quest. Afterwards: qe24 mail audit, and GoMail should show no probe mails.

--> Since the previous quest still has an open objective, I can't complete it, so I abandon it instead. The `QE24 mail probe (quest replyable)` is still in my inbox.

Zeis~$ [/home/Zeis] qe24 mail audit
QE24 mail audit - session sends: 0, watcher: ON, cleanup: ARMED
Inbox entries visible to getInbox: 30
Probe mails in the inbox by subject: 0
Read this after the reload halves of M-01/M-03 and after M-07's quest end.

--> I'm unsure what to do next since the mail is still there and the cleanup is "armed", so I'm assuming I have to run cleanup again even if you didn't say so.

Zeis~$ [/home/Zeis] qe24 mail cleanup on
Cleanup ARMED - when the mail QA quest ends (complete OR abandon), its hook removes
every session id Mail.send returned AND every inbox mail whose subject starts with
"QE24 mail probe" (the sendMail path returns no id, so its mail is found by subject).
Each removal is logged as [qe24] mail sweep: ... - that log is M-07's evidence.
Then: qe24 run mail (if not already running), do the reply, and complete or abandon
the quest. Afterwards: qe24 mail audit, and GoMail should show no probe mails.

--> That didn't really do anything, so be it. The mail watch is also still on and I'm not sure if I should've turned it off by now or not, your table doesn't say.

Game Log:

```==============================================
[20/09/2026, 13:21:30] [INFO]
----------------------------------------------
[RENDERER] [qe24] mail QA quest started - sending Mails[0] via this.sendMail(0) (M-06)
==============================================

==============================================
[20/09/2026, 13:22:01] [INFO]
----------------------------------------------
[RENDERER] [qe24] Mail.Sent payload: {"id":"50W6qe0QgC","from":"bkelso@gomail.com","to":"qe24-quest@qe24.test","subject":"(Reply)","content":"asdff","sentAt":1789903321149}
==============================================

==============================================
[20/09/2026, 13:22:01] [INFO]
----------------------------------------------
[RENDERER] [qe24] mail QA: reply observed (subject (Reply)) - completing quest-reply-seen
==============================================

==============================================
[20/09/2026, 13:24:10] [INFO]
----------------------------------------------
[RENDERER] [qe24] mail QA OnAbandon fired
==============================================

==============================================
[20/09/2026, 13:24:10] [INFO]
----------------------------------------------
[RENDERER] [qe24] mail QA OnAbandon mail sweep: remove id 8SaLAMoEmk -> false
==============================================

==============================================
[20/09/2026, 13:24:10] [INFO]
----------------------------------------------
[RENDERER] [qe24] mail QA OnAbandon mail sweep: remove id NfjMv8qTcR -> false
==============================================

==============================================
[20/09/2026, 13:24:10] [INFO]
----------------------------------------------
[RENDERER] [qe24] mail QA OnAbandon mail sweep: remove id 4y45WyROh1 -> true
==============================================

==============================================
[20/09/2026, 13:24:10] [INFO]
----------------------------------------------
[RENDERER] [qe24] mail QA OnAbandon mail sweep finished: 1 probe mail(s) removed
==============================================```


# M-08 (Unsure)

Zeis~$ [/home/Zeis] qe24 mail send
Mail.send -> id: JSnUzFVzS0
subject: QE24 mail probe (plain)
from: qe24-direct@qe24.test replyable: false
Open GoMail: the mail should be there carrying the SAME id (M-01), and with
save -> quit -> reload -> qe24 mail audit the id should survive (M-01's second half).
Then: qe24 mail remove last (M-02), or remove it while still unread for M-03.

--> Save, quit, disable harness, restart, reload, open gomail, the "(plain)" mail is still there.

Game Log exploded with activity upon reload, full log:

```==============================================
[20/09/2026, 13:30:01] [INFO]
----------------------------------------------
[RENDERER] [qe24] mod unloading
==============================================

==============================================
[20/09/2026, 13:30:01] [INFO]
----------------------------------------------
[RENDERER] [qe24] intercept off failed: [ContentSDK] Mod "null" tried to use Http.setInterceptEnabled without "network" permission. Add "network" to the permissions array in your manifest.json.
==============================================

==============================================
[20/09/2026, 13:30:01] [INFO]
----------------------------------------------
[RENDERER] [qe24] Http.unregisterHost failed: [ContentSDK] Mod "null" tried to use Http.unregisterHost without "network" permission. Add "network" to the permissions array in your manifest.json.
==============================================

==============================================
[20/09/2026, 13:30:01] [INFO]
----------------------------------------------
[RENDERER] [qe24] Http.unpublish failed: [ContentSDK] Mod "null" tried to use Http.unpublish without "network" permission. Add "network" to the permissions array in your manifest.json.
==============================================

==============================================
[20/09/2026, 13:30:01] [INFO]
----------------------------------------------
[RENDERER] [qe24] unload removeUser(qe24-probe-user) -> false
==============================================

==============================================
[20/09/2026, 13:30:01] [INFO]
----------------------------------------------
[RENDERER] [qe24] unload removeUser(qe24-bad-record) -> false
==============================================

==============================================
[20/09/2026, 13:30:01] [INFO]
----------------------------------------------
[RENDERER] [qe24] unload removeUser(qe24-declared-user) -> false
==============================================

==============================================
[20/09/2026, 13:30:01] [INFO]
----------------------------------------------
[RENDERER] [qe24] Mail.remove(JSnUzFVzS0) failed: [ContentSDK] Mod "null" tried to use Mail.remove without "mail" permission. Add "mail" to the permissions array in your manifest.json.
==============================================

==============================================
[20/09/2026, 13:30:01] [INFO]
----------------------------------------------
[RENDERER] [qe24] unload mail sweep: remove id JSnUzFVzS0 -> false
==============================================

==============================================
[20/09/2026, 13:30:01] [INFO]
----------------------------------------------
[RENDERER] [qe24] Mail.getInbox failed: [ContentSDK] Mod "null" tried to use Mail.getInbox without "mail" permission. Add "mail" to the permissions array in your manifest.json.
==============================================

==============================================
[20/09/2026, 13:30:01] [INFO]
----------------------------------------------
[RENDERER] [qe24] unload mail sweep finished: 0 probe mail(s) removed
==============================================

==============================================
[20/09/2026, 13:30:03] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "QE SDK 0.24 Editor QA Scaffold" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[20/09/2026, 13:30:03] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer handler registered (kind qe/qe-sdk-024-editor-qa/timer)
==============================================

==============================================
[20/09/2026, 13:30:03] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering menu item "qe24-menu-extras" (language EN)
==============================================

==============================================
[20/09/2026, 13:30:03] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering menu item "qe24-menu-claim" (language EN)
==============================================

==============================================
[20/09/2026, 13:30:03] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering menu item "qe24-menu-mail" (language EN)
==============================================

==============================================
[20/09/2026, 13:30:03] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering menu item "qe24-menu-handbook" (language EN)
==============================================

==============================================
[20/09/2026, 13:30:03] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering right-click item "qe24-ctx-file" (language EN)
==============================================

==============================================
[20/09/2026, 13:30:03] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering right-click item "qe24-ctx-desktop" (language EN)
==============================================

==============================================
[20/09/2026, 13:30:03] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registered 4 menu item(s), 1 widget(s) and 2 right-click item(s) (language EN)
==============================================

==============================================
[20/09/2026, 13:30:03] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] QE SDK 0.24 Editor QA Scaffold v1.0.35 loaded (editor build 2026-09-19.r209).
==============================================

==============================================
[20/09/2026, 13:30:04] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: the language is now en - handing the labels over again in it
==============================================

==============================================
[20/09/2026, 13:30:04] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering menu item "qe24-menu-extras" (language en)
==============================================

==============================================
[20/09/2026, 13:30:04] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering menu item "qe24-menu-claim" (language en)
==============================================

==============================================
[20/09/2026, 13:30:04] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering menu item "qe24-menu-mail" (language en)
==============================================

==============================================
[20/09/2026, 13:30:04] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering menu item "qe24-menu-handbook" (language en)
==============================================

==============================================
[20/09/2026, 13:30:04] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering right-click item "qe24-ctx-file" (language en)
==============================================

==============================================
[20/09/2026, 13:30:04] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering right-click item "qe24-ctx-desktop" (language en)
==============================================

==============================================
[20/09/2026, 13:30:04] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: re-registered 4 menu item(s), 0 widget(s) and 2 right-click item(s) (language en)
==============================================

==============================================
[20/09/2026, 13:30:04] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: the language is now en - handing the labels over again in it
==============================================

==============================================
[20/09/2026, 13:30:04] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering menu item "qe24-menu-extras" (language en)
==============================================

==============================================
[20/09/2026, 13:30:04] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering menu item "qe24-menu-claim" (language en)
==============================================

==============================================
[20/09/2026, 13:30:04] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering menu item "qe24-menu-mail" (language en)
==============================================

==============================================
[20/09/2026, 13:30:04] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering menu item "qe24-menu-handbook" (language en)
==============================================

==============================================
[20/09/2026, 13:30:04] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering right-click item "qe24-ctx-file" (language en)
==============================================

==============================================
[20/09/2026, 13:30:04] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: registering right-click item "qe24-ctx-desktop" (language en)
==============================================

==============================================
[20/09/2026, 13:30:04] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] extras: re-registered 4 menu item(s), 0 widget(s) and 2 right-click item(s) (language en)
==============================================

==============================================
[20/09/2026, 13:30:05] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam failed after 54ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[20/09/2026, 13:30:06] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 56ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[20/09/2026, 13:30:06] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 48ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[20/09/2026, 13:30:18] [WARN]
----------------------------------------------
[RENDERER] [Scheduler] Holding job "Queue.HandleQuestHackhubPosts": no handler registered.
==============================================```

# M-10 (Green)

You didn't tell me to re-enable the harness, but I obviously did.

Zeis~$ [/home/Zeis] qe24 mail bounce
Mail.sendBounce called for qe24-missing@nonexistent-corp.test (M-10).
Open GoMail: a mailer-daemon bounce should be in the inbox. Nothing there means
sendBounce does not draw in this build - paste that as the result.

--> New email in my inbox:
Subject: Undelivered Mail Returned to Sender
From: mailer-daemon@gomail.com
This is the mail delivery system at your provider.

Your message could not be delivered to the following recipient:

qe24-missing@nonexistent-corp.test

Reason: 550 5.1.1 - recipient address rejected: user unknown.

The address may be misspelled or may not exist. No further action is required on your part.