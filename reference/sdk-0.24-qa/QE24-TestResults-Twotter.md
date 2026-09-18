# GENERAL QA NOTES

Steam:
App ID: 2980270
Build ID: 25388883

- Every test is done on a clean save and reset to the clean save after the test is done. Please tell me if you want me to keep a save instead.
- In my local mod folder from the sdk-0.24-qa folder: editor-export, mod

---

# T-14 the r30 draft

4 Tweets from @legacy_smith, from first to last: 2 days ago, 1 month ago (this one has a warning that it came from an older draft), when story arrives, came from an older draft. Twotter account profile page says verified and removed when the last quest that uses it ends but there are no warnings that this is from an older draft.

# T-08 the account & T-09 lived-in series

--> Ran qe24 run tw1. New quest added. Searched for qe24_editor (only first two objectives tick), found account. Account has a blue avatar, is verified, 412 followers, 86 following, bio reads "Made by the editor's Twotter node (r185). If this line is readable in search, createUser kept our bio."
Has 5 tweets: a few seconds ago, 12 days ago, a month ago, 3 months ago, a year ago (top to bottom, in that order). None of the tweets carry a picture - not even when opening the detailed tweet. 

# T-10 save, quit, reload

--> save, quit, reload.

Zeis~$ [/home/Zeis] qe24 twotter audit
QE24 Twotter audit - the handles this QA round creates:
@qe24_probe: not on this save
@qe24_badrecord: not on this save
@qe24_declared: not on this save
@qe24_editor (id qe-tw-account): bio is a string (102 chars); verified yes; followers 412; following 96; joined Mon Dec 08 2025
1 of 4 handles present; 0 carrying the r31 poison shape.
A hand-crafted account with an empty avatar/banner is normal for this harness;
what matters is the bio line: 0 poisoned means search cannot hit the r31 crash here.
T-11/T-12/T-15 expect the editor's @qe24_editor to LEAVE this list once its quests finish.

--> Opened account again, no duplicates, only 5 tweets, same order as before. I did not modify the bio.

# T-11 complete removes it

--> Since the last objective remains unchecked, as its supposed to, there is no COMPLETE button. So I abandoned that quest (which removed all tweets but the account remained), and then ran the twotter audit again.

Zeis~$ [/home/Zeis] qe24 twotter audit
QE24 Twotter audit - the handles this QA round creates:
@qe24_probe: not on this save
@qe24_badrecord: not on this save
@qe24_declared: not on this save
@qe24_editor (id qe-tw-account): bio is a string (102 chars); verified yes; followers 412; following 96; joined Mon Dec 08 2025
1 of 4 handles present; 0 carrying the r31 poison shape.
A hand-crafted account with an empty avatar/banner is normal for this harness;
what matters is the bio line: 0 poisoned means search cannot hit the r31 crash here.
T-11/T-12/T-15 expect the editor's @qe24_editor to LEAVE this list once its quests finish.

--> Refreshed Twotter just to make sure, but the account remains with no tweets. Probably since I couldn't complete the objective due to the intentional unfinished objective.

# T-12 two quests, one account

--> ran `qe24 run clear` first

Zeis~$ [/home/Zeis] qe24 run clear
Unclaimed: QESdk024TimerQa ok, QESdk024TimerCalQa ok, QESdk024WaitMonthQa ok, QE24SurfaceProbe ok, QE24TwotterProbe ok, QESdk024TwotterQa ok, QESdk024TwotterShareQa ok, QESdk024EditorQa ok
Anything an older build left claimed is out of the journal now. Then: qe24 run

--> The QE24 Editor Account remains and did not get wiped. I could stop the test here, but figure this is a good opportunity to see if this causes any bugs, so I'll continue with tw2.

Zeis~$ [/home/Zeis] qe24 run tw2
Claimed QESdk024TwotterShareQa - look for "Twotter QA (T-12: two quests, one account)" in the journal.
If it is not there, this build may refuse cross-mod claims: claim that title yourself.
Started: the second quest on the SAME account, for the shared-account rule: finish one and the account stays while the other lives; finish both and it goes. Check with 'qe24 twotter audit'.

--> The account has now gained a single new tweet ("a few seconds ago"). A single new quest appeared and instantly (Open editor profile...) finished itself (probably because I was already on the profile when I ran the command). 

The only tweet on the account at this point:

"Posted by the second quest that shares this account - T-12 wants it on the same profile."

--> I click on Complete in the Journal. The account gets completely wiped and the quest finishes itself.

# T-13 When-event triggers

I think I answered this already in T-10 and T-11.

# T-15 uninstall

--> Ran `qe24 run clear` again
--> Ran `qe24 run tw1` again. The tw1 quest with 3 unchecked objectives appears anew.

Zeis~$ [/home/Zeis] qe24 run tw1
Claimed QESdk024TwotterQa - look for "Twotter QA (T-08/T-09/T-10/T-11/T-13)" in the journal.
If it is not there, this build may refuse cross-mod claims: claim that title yourself.
Started: the editor's Twotter node in the field: a five-tweet series on @qe24_editor, four backdated and one arriving now. Read the profile with Twotter's search, then save/reload, then Complete it.

--> Searching for "qe24" or "qe24_editor" shows No Results.
--> Ran `qe24 twotter audit` again

Zeis~$ [/home/Zeis] qe24 twotter audit
QE24 Twotter audit - the handles this QA round creates:
@qe24_probe: not on this save
@qe24_badrecord: not on this save
@qe24_declared: not on this save
@qe24_editor: not on this save
0 of 4 handles present; 0 carrying the r31 poison shape.
A hand-crafted account with an empty avatar/banner is normal for this harness;
what matters is the bio line: 0 poisoned means search cannot hit the r31 crash here.
T-11/T-12/T-15 expect the editor's @qe24_editor to LEAVE this list once its quests finish.

--> Saved and quit.
--> Removed export mod
--> Loaded up same save again. The previous tw1 open quest is gone.

Zeis~$ [/home/Zeis] qe24 twotter audit
QE24 Twotter audit - the handles this QA round creates:
@qe24_probe: not on this save
@qe24_badrecord: not on this save
@qe24_declared: not on this save
@qe24_editor: not on this save
0 of 4 handles present; 0 carrying the r31 poison shape.
A hand-crafted account with an empty avatar/banner is normal for this harness;
what matters is the bio line: 0 poisoned means search cannot hit the r31 crash here.
T-11/T-12/T-15 expect the editor's @qe24_editor to LEAVE this list once its quests finish.

Game Log:

==============================================
  HACKHUB LOG FILE
  Started: 18/09/2026, 21:33:23
  Version: 1.3.1
  Platform: win32
  Arch: x64
==============================================


==============================================
[18/09/2026, 21:33:23] [INFO]
----------------------------------------------
Steamworks initalized: Zeis [ZF] - 76561197976480835
==============================================

==============================================
[18/09/2026, 21:33:23] [INFO]
----------------------------------------------
[WorkshopController] initialized with appId: 2980270
==============================================

==============================================
[18/09/2026, 21:33:24] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "QE SDK 0.24 Editor QA Scaffold" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 21:33:24] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer handler registered (kind qe/qe-sdk-024-editor-qa/timer)
==============================================

==============================================
[18/09/2026, 21:33:24] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] QE SDK 0.24 Editor QA Scaffold v1.0.14 loaded (editor build 2026-09-18.r185).
==============================================

==============================================
[18/09/2026, 21:33:24] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Markdown Note Editor" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 21:33:24] [INFO]
----------------------------------------------
[RENDERER] [Markdown Note Editor] Mod loaded.
==============================================

==============================================
[18/09/2026, 21:33:24] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "QE SDK 0.24 QA Harness" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 21:33:24] [INFO]
----------------------------------------------
[RENDERER] [qe24] mod loaded
==============================================

==============================================
[18/09/2026, 21:33:24] [INFO]
----------------------------------------------
[RENDERER] [qe24] HTTP host registered: qe24-http.test
==============================================

==============================================
[18/09/2026, 21:33:24] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Nemesis Protocol" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 21:33:24] [INFO]
----------------------------------------------
[RENDERER] [nemesis-protocol-stage1] Nemesis Protocol loaded. The mission is waiting in the HackHub feed.
==============================================

==============================================
[18/09/2026, 21:33:24] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "RetroArcade" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 21:33:24] [INFO]
----------------------------------------------
[RENDERER] RetroArcade v1.0.0 loaded!
==============================================

==============================================
[18/09/2026, 21:33:24] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Darknet-Tree" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 21:33:24] [INFO]
----------------------------------------------
[RENDERER] [darknet-tree] Darknet-Tree loaded! Check the App Store for NotePad.
==============================================

==============================================
[18/09/2026, 21:33:24] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Synthetik Wallet" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 21:33:24] [INFO]
----------------------------------------------
[RENDERER] [synthetik-wallet] Synthetik Wallet loaded! Find it in the App Store.
==============================================

==============================================
[18/09/2026, 21:33:24] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "GhostLink" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 21:33:24] [INFO]
----------------------------------------------
[RENDERER] [GhostLink] v1.0.2 loaded
==============================================

==============================================
[18/09/2026, 21:33:24] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "HackPad++" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 21:33:24] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "NetDesk" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 21:33:24] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "python-is-python3" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 21:33:24] [INFO]
----------------------------------------------
[RENDERER] [python-is-python3] Mod loaded! Run: apt-get install python-is-python3
==============================================

==============================================
[18/09/2026, 21:33:24] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Lockchain | Featured HackHub Mod" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 21:33:24] [INFO]
----------------------------------------------
[RENDERER] Lockchain Wallet mod loaded: websites, phone wallet, marketplace, miner, and isolated RPC registered.
==============================================

==============================================
[18/09/2026, 21:33:24] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "FISHCEPTION/OS" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 21:33:24] [INFO]
----------------------------------------------
[RENDERER] [Fishception] biological daemon loaded
==============================================

==============================================
[18/09/2026, 21:33:24] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "HackHub Beginner Handbook+" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 21:33:24] [INFO]
----------------------------------------------
[RENDERER] [Beginner Handbook+] Registered 109 handbook pages without title prefixes. Language: en.
==============================================

==============================================
[18/09/2026, 21:33:24] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Lockbox 6.0" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 21:33:24] [INFO]
----------------------------------------------
[RENDERER] [vault-manager] Vault Manager loaded — password vault & sticky notes ready.
==============================================

==============================================
[18/09/2026, 21:33:38] [WARN]
----------------------------------------------
[RENDERER] [Scheduler] Holding job "Queue.HandleQuestHackhubPosts": no handler registered.
==============================================

==============================================
[18/09/2026, 21:33:38] [INFO]
----------------------------------------------
[RENDERER] [qe24] Game.SessionStarted observed
==============================================

==============================================
[18/09/2026, 21:33:38] [INFO]
----------------------------------------------
[RENDERER] [qe24] HTTP host registered: qe24-http.test
==============================================

==============================================
[18/09/2026, 21:33:38] [INFO]
----------------------------------------------
[RENDERER] [qe24] Wi-Fi AP created: QE24-RAW-5G at 109.173.72.6
==============================================

==============================================
[18/09/2026, 21:33:38] [INFO]
----------------------------------------------
[RENDERER] [qe24] session ready: host=qe24-http.test ssid=QE24-RAW-5G
==============================================

==============================================
[18/09/2026, 21:35:41] [WARN]
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
[18/09/2026, 21:37:14] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TwotterQa" started (1 entry point)
==============================================

==============================================
[18/09/2026, 21:37:14] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "Twotter QA started: @qe24_editor now carries the series. Open Twotter and search for it."
==============================================

==============================================
[18/09/2026, 21:37:14] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter: created @qe24_editor (qe-tw-account) for quest qe-tw1
==============================================

==============================================
[18/09/2026, 21:37:14] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter node qe-tw1-post: posted qe-qe-tw1-qe-tw1-post-0 (backdated to 2025-09-18T21:01:41.325Z)
==============================================

==============================================
[18/09/2026, 21:37:14] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter node qe-tw1-post: posted qe-qe-tw1-qe-tw1-post-1 (backdated to 2026-06-18T21:01:41.325Z)
==============================================

==============================================
[18/09/2026, 21:37:14] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter node qe-tw1-post: posted qe-qe-tw1-qe-tw1-post-2 (backdated to 2026-08-07T21:01:41.325Z)
==============================================

==============================================
[18/09/2026, 21:37:14] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter node qe-tw1-post: posted qe-qe-tw1-qe-tw1-post-3 (backdated to 2026-09-06T21:01:41.325Z)
==============================================

==============================================
[18/09/2026, 21:37:14] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter node qe-tw1-post: posted qe-qe-tw1-qe-tw1-post-4 (now)
==============================================

==============================================
[18/09/2026, 21:37:14] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TwotterQa" objectives started
==============================================

==============================================
[18/09/2026, 21:37:14] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "profile-seen" is listening for Twotter.ProfileSeen
==============================================

==============================================
[18/09/2026, 21:37:14] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "post-seen" is listening for Twotter.PostSeen
==============================================

==============================================
[18/09/2026, 21:37:14] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "post-event" is listening for Twotter.Post
==============================================

==============================================
[18/09/2026, 21:37:58] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "post-seen" completed by Twotter.PostSeen
==============================================

==============================================
[18/09/2026, 21:37:58] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:37:58] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:37:58] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:37:58] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "profile-seen" completed by Twotter.ProfileSeen
==============================================

==============================================
[18/09/2026, 21:37:58] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "profile-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:39:07] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:39:07] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:40:00] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:40:00] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:18] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:18] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:18] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:18] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "profile-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:22] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:22] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:22] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:22] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "profile-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:23] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:23] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:26] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:26] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:26] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:26] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "profile-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:27] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:27] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:31] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:31] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:31] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:31] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "profile-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:32] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:32] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:40] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:40] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:40] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:41:40] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "profile-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:42:31] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TwotterQa" objectives started
==============================================

==============================================
[18/09/2026, 21:42:31] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "profile-seen" is listening for Twotter.ProfileSeen
==============================================

==============================================
[18/09/2026, 21:42:31] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "post-seen" is listening for Twotter.PostSeen
==============================================

==============================================
[18/09/2026, 21:42:31] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "post-event" is listening for Twotter.Post
==============================================

==============================================
[18/09/2026, 21:42:31] [INFO]
----------------------------------------------
[RENDERER] [qe24] Game.SessionStarted observed
==============================================

==============================================
[18/09/2026, 21:42:31] [INFO]
----------------------------------------------
[RENDERER] [qe24] HTTP host registered: qe24-http.test
==============================================

==============================================
[18/09/2026, 21:42:31] [INFO]
----------------------------------------------
[RENDERER] [qe24] session ready: host=qe24-http.test ssid=QE24-RAW-5G
==============================================

==============================================
[18/09/2026, 21:42:39] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "post-seen": Twotter.PostSeen fired but did not match. Event carried: { id="QUESTS.13.TWEETS.6", userId="Y45xYEs92s", interaction={object}, content={object}, showInTimeline="true", sendedAt="Wed Sep 09 2026 12:32:30 GMT+0200 (Central European Summe..." }
==============================================

==============================================
[18/09/2026, 21:42:39] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "post-seen": Twotter.PostSeen fired but did not match. Event carried: { id="CYBER_JUSTICE.TWEETS.3", userId="oK18pTimJL", showInTimeline="true", interaction={object}, content={object}, sendedAt="Wed Sep 09 2026 12:05:41 GMT+0200 (Central European Summe..." }
==============================================

==============================================
[18/09/2026, 21:42:39] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "post-seen": Twotter.PostSeen fired but did not match. Event carried: { id="CYBER_JUSTICE.TWEETS.2", userId="oK18pTimJL", sendedAt="Wed Sep 09 2026 11:53:43 GMT+0200 (Central European Summe...", showInTimeline="true", interaction={object}, content={object} }
==============================================

==============================================
[18/09/2026, 21:42:39] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "post-seen": Twotter.PostSeen fired but did not match. Event carried: { id="EZ5fDITbEp", userId="jBj3MrVoKG", sendedAt="Wed Sep 09 2026", content={object}, showInTimeline="true", interaction={object} }
==============================================

==============================================
[18/09/2026, 21:43:43] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:43:43] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "post-seen" completed by Twotter.PostSeen
==============================================

==============================================
[18/09/2026, 21:43:43] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:43:43] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:43:43] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:43:43] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "profile-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:43:43] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "profile-seen" completed by Twotter.ProfileSeen
==============================================

==============================================
[18/09/2026, 21:43:43] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "profile-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:43:50] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:43:50] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "post-seen" already completed (in-memory) for quest ivmm6lihgE
==============================================

==============================================
[18/09/2026, 21:46:29] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: starting
==============================================

==============================================
[18/09/2026, 21:46:29] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup starting (abandon): 5 item(s) to undo
==============================================

==============================================
[18/09/2026, 21:46:29] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter: keeping @qe24_editor - another live quest declares it
==============================================

==============================================
[18/09/2026, 21:46:29] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup: tweet qe-qe-tw1-qe-tw1-post-4
==============================================

==============================================
[18/09/2026, 21:46:29] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup: tweet qe-qe-tw1-qe-tw1-post-4 removed
==============================================

==============================================
[18/09/2026, 21:46:29] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup: tweet qe-qe-tw1-qe-tw1-post-3
==============================================

==============================================
[18/09/2026, 21:46:29] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup: tweet qe-qe-tw1-qe-tw1-post-3 removed
==============================================

==============================================
[18/09/2026, 21:46:29] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup: tweet qe-qe-tw1-qe-tw1-post-2
==============================================

==============================================
[18/09/2026, 21:46:29] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup: tweet qe-qe-tw1-qe-tw1-post-2 removed
==============================================

==============================================
[18/09/2026, 21:46:29] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup: tweet qe-qe-tw1-qe-tw1-post-1
==============================================

==============================================
[18/09/2026, 21:46:29] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup: tweet qe-qe-tw1-qe-tw1-post-1 removed
==============================================

==============================================
[18/09/2026, 21:46:29] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup: tweet qe-qe-tw1-qe-tw1-post-0
==============================================

==============================================
[18/09/2026, 21:46:29] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup: tweet qe-qe-tw1-qe-tw1-post-0 removed
==============================================

==============================================
[18/09/2026, 21:46:29] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup finished
==============================================

==============================================
[18/09/2026, 21:46:29] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: cleanup done, removing weechat servers
==============================================

==============================================
[18/09/2026, 21:46:29] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: running end-of-quest nodes
==============================================

==============================================
[18/09/2026, 21:46:29] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: finished, handing back to the game
==============================================

==============================================
[18/09/2026, 21:51:42] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TwotterShareQa" started (1 entry point)
==============================================

==============================================
[18/09/2026, 21:51:42] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "Second quest posting from @qe24_editor (T-12's shared account)."
==============================================

==============================================
[18/09/2026, 21:51:42] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter: refreshed @qe24_editor (our account, already in the save)
==============================================

==============================================
[18/09/2026, 21:51:42] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter node qe-tw2-post: posted qe-qe-tw2-qe-tw2-post-0 (now)
==============================================

==============================================
[18/09/2026, 21:51:42] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TwotterShareQa" objectives started
==============================================

==============================================
[18/09/2026, 21:51:42] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "shared-profile-seen" is listening for Twotter.ProfileSeen
==============================================

==============================================
[18/09/2026, 21:51:42] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "shared-profile-seen" completed by Twotter.ProfileSeen
==============================================

==============================================
[18/09/2026, 21:51:42] [WARN]
----------------------------------------------
[RENDERER] [CompleteObjective] Objective "shared-profile-seen" already completed (in-memory) for quest 7svyuoSPzt
==============================================

==============================================
[18/09/2026, 21:54:23] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnComplete: starting
==============================================

==============================================
[18/09/2026, 21:54:23] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup starting (complete): 1 item(s) to undo
==============================================

==============================================
[18/09/2026, 21:54:23] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter: removeUser(qe-tw-account) -> true (the last quest that needs it ended)
==============================================

==============================================
[18/09/2026, 21:54:23] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup: tweet qe-qe-tw2-qe-tw2-post-0
==============================================

==============================================
[18/09/2026, 21:54:23] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup: tweet qe-qe-tw2-qe-tw2-post-0 removed
==============================================

==============================================
[18/09/2026, 21:54:23] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup finished
==============================================

==============================================
[18/09/2026, 21:54:23] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnComplete: cleanup done, removing weechat servers
==============================================

==============================================
[18/09/2026, 21:54:23] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnComplete: running end-of-quest nodes
==============================================

==============================================
[18/09/2026, 21:54:23] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnComplete: finished, handing back to the game
==============================================

==============================================
[18/09/2026, 21:57:05] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TwotterQa" started (1 entry point)
==============================================

==============================================
[18/09/2026, 21:57:05] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "Twotter QA started: @qe24_editor now carries the series. Open Twotter and search for it."
==============================================

==============================================
[18/09/2026, 21:57:05] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter node qe-tw1-post: already posted in this playthrough; skipping
==============================================

==============================================
[18/09/2026, 21:57:05] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TwotterQa" objectives started
==============================================

==============================================
[18/09/2026, 21:57:05] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "profile-seen" is listening for Twotter.ProfileSeen
==============================================

==============================================
[18/09/2026, 21:57:05] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "post-seen" is listening for Twotter.PostSeen
==============================================

==============================================
[18/09/2026, 21:57:05] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "post-event" is listening for Twotter.Post
==============================================

==============================================
[18/09/2026, 21:59:51] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 105ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 21:59:51] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 56ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 21:59:52] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 48ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
  APPLICATION CLOSING
  Time: 18/09/2026, 21:59:53
==============================================

==============================================
  APPLICATION CLOSING
  Time: 18/09/2026, 21:59:53
==============================================

==============================================
  HACKHUB LOG FILE
  Started: 18/09/2026, 22:00:04
  Version: 1.3.1
  Platform: win32
  Arch: x64
==============================================


==============================================
[18/09/2026, 22:00:05] [INFO]
----------------------------------------------
Steamworks initalized: Zeis [ZF] - 76561197976480835
==============================================

==============================================
[18/09/2026, 22:00:05] [INFO]
----------------------------------------------
[WorkshopController] initialized with appId: 2980270
==============================================

==============================================
[18/09/2026, 22:00:05] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Markdown Note Editor" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 22:00:05] [INFO]
----------------------------------------------
[RENDERER] [Markdown Note Editor] Mod loaded.
==============================================

==============================================
[18/09/2026, 22:00:05] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "QE SDK 0.24 QA Harness" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 22:00:05] [INFO]
----------------------------------------------
[RENDERER] [qe24] mod loaded
==============================================

==============================================
[18/09/2026, 22:00:05] [INFO]
----------------------------------------------
[RENDERER] [qe24] HTTP host registered: qe24-http.test
==============================================

==============================================
[18/09/2026, 22:00:05] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Nemesis Protocol" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 22:00:05] [INFO]
----------------------------------------------
[RENDERER] [nemesis-protocol-stage1] Nemesis Protocol loaded. The mission is waiting in the HackHub feed.
==============================================

==============================================
[18/09/2026, 22:00:05] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "RetroArcade" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 22:00:05] [INFO]
----------------------------------------------
[RENDERER] RetroArcade v1.0.0 loaded!
==============================================

==============================================
[18/09/2026, 22:00:05] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Darknet-Tree" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 22:00:05] [INFO]
----------------------------------------------
[RENDERER] [darknet-tree] Darknet-Tree loaded! Check the App Store for NotePad.
==============================================

==============================================
[18/09/2026, 22:00:05] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Synthetik Wallet" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 22:00:05] [INFO]
----------------------------------------------
[RENDERER] [synthetik-wallet] Synthetik Wallet loaded! Find it in the App Store.
==============================================

==============================================
[18/09/2026, 22:00:05] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "GhostLink" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 22:00:05] [INFO]
----------------------------------------------
[RENDERER] [GhostLink] v1.0.2 loaded
==============================================

==============================================
[18/09/2026, 22:00:05] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "HackPad++" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 22:00:05] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "NetDesk" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 22:00:05] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "python-is-python3" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 22:00:05] [INFO]
----------------------------------------------
[RENDERER] [python-is-python3] Mod loaded! Run: apt-get install python-is-python3
==============================================

==============================================
[18/09/2026, 22:00:05] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Lockchain | Featured HackHub Mod" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 22:00:05] [INFO]
----------------------------------------------
[RENDERER] Lockchain Wallet mod loaded: websites, phone wallet, marketplace, miner, and isolated RPC registered.
==============================================

==============================================
[18/09/2026, 22:00:05] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "FISHCEPTION/OS" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 22:00:05] [INFO]
----------------------------------------------
[RENDERER] [Fishception] biological daemon loaded
==============================================

==============================================
[18/09/2026, 22:00:05] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "HackHub Beginner Handbook+" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 22:00:05] [INFO]
----------------------------------------------
[RENDERER] [Beginner Handbook+] Registered 109 handbook pages without title prefixes. Language: en.
==============================================

==============================================
[18/09/2026, 22:00:05] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Lockbox 6.0" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 22:00:05] [INFO]
----------------------------------------------
[RENDERER] [vault-manager] Vault Manager loaded — password vault & sticky notes ready.
==============================================

==============================================
[18/09/2026, 22:00:07] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam failed after 55ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 22:00:24] [WARN]
----------------------------------------------
[RENDERER] [Scheduler] Holding job "Queue.HandleQuestHackhubPosts": no handler registered.
==============================================

==============================================
[18/09/2026, 22:00:24] [WARN]
----------------------------------------------
[RENDERER] [PruneOrphanQuests] Dropping "QESdk024TwotterQa" (BHuZTXRwne): no installed content defines it.
==============================================

==============================================
[18/09/2026, 22:00:24] [INFO]
----------------------------------------------
[RENDERER] [qe24] Game.SessionStarted observed
==============================================

==============================================
[18/09/2026, 22:00:24] [INFO]
----------------------------------------------
[RENDERER] [qe24] HTTP host registered: qe24-http.test
==============================================

==============================================
[18/09/2026, 22:00:24] [INFO]
----------------------------------------------
[RENDERER] [qe24] session ready: host=qe24-http.test ssid=QE24-RAW-5G
==============================================

==============================================
[18/09/2026, 22:01:06] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 113ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 22:01:07] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 54ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 22:01:07] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 51ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
  APPLICATION CLOSING
  Time: 18/09/2026, 22:01:08
==============================================