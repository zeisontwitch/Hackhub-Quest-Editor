# GENERAL QA NOTES

Steam:
App ID: 2980270
Build ID: 25388883

- Every test is done on a clean save and reset to the clean save after the test is done. Please tell me if you want me to keep a save instead.
- In my local mod folder from the sdk-0.24-qa folder: editor-export, mod

---

# S-03 cancel

--> Fresh save. 

Zeis~$ [/home/Zeis] qe24 run timer
Claimed QESdk024TimerQa - look for "Timer QA (S-01/S-02/S-03)" in the journal.
If it is not there, this build may refuse cross-mod claims: claim that title yourself.
Started: Timer A fires after 2 in-game minutes; Timer B after 2 in-game hours, which is also S-02 (reload survives) and S-03 (cancel on complete or abandon).
Give it a second, then run: qe24 timers
That prints every pending job with the moment it will fire - you do not wait for it.

--> Timer A fired toast popped

--> Abandoned Quest.

--> Waited 2 real-minutes

--> Nothing popped, saved and quit game, checked game log but didn't see anything about a cancelled timer in there, here's the full log for that run:

==============================================
  HACKHUB LOG FILE
  Started: 18/09/2026, 17:25:27
  Version: 1.3.1
  Platform: win32
  Arch: x64
==============================================


==============================================
[18/09/2026, 17:25:27] [INFO]
----------------------------------------------
Steamworks initalized: Zeis [ZF] - 76561197976480835
==============================================

==============================================
[18/09/2026, 17:25:27] [INFO]
----------------------------------------------
[WorkshopController] initialized with appId: 2980270
==============================================

==============================================
[18/09/2026, 17:25:28] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "QE SDK 0.24 Editor QA Scaffold" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 17:25:28] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer handler registered (kind qe/qe-sdk-024-editor-qa/timer)
==============================================

==============================================
[18/09/2026, 17:25:28] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] QE SDK 0.24 Editor QA Scaffold v1.0.9 loaded (editor build 2026-09-18.r181).
==============================================

==============================================
[18/09/2026, 17:25:28] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Markdown Note Editor" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 17:25:28] [INFO]
----------------------------------------------
[RENDERER] [Markdown Note Editor] Mod loaded.
==============================================

==============================================
[18/09/2026, 17:25:28] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "QE SDK 0.24 QA Harness" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 17:25:28] [INFO]
----------------------------------------------
[RENDERER] [qe24] mod loaded
==============================================

==============================================
[18/09/2026, 17:25:28] [INFO]
----------------------------------------------
[RENDERER] [qe24] HTTP host registered: qe24-http.test
==============================================

==============================================
[18/09/2026, 17:25:28] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Nemesis Protocol" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 17:25:28] [INFO]
----------------------------------------------
[RENDERER] [nemesis-protocol-stage1] Nemesis Protocol loaded. The mission is waiting in the HackHub feed.
==============================================

==============================================
[18/09/2026, 17:25:28] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "RetroArcade" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 17:25:28] [INFO]
----------------------------------------------
[RENDERER] RetroArcade v1.0.0 loaded!
==============================================

==============================================
[18/09/2026, 17:25:28] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Darknet-Tree" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 17:25:28] [INFO]
----------------------------------------------
[RENDERER] [darknet-tree] Darknet-Tree loaded! Check the App Store for NotePad.
==============================================

==============================================
[18/09/2026, 17:25:28] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Synthetik Wallet" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 17:25:28] [INFO]
----------------------------------------------
[RENDERER] [synthetik-wallet] Synthetik Wallet loaded! Find it in the App Store.
==============================================

==============================================
[18/09/2026, 17:25:28] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "GhostLink" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 17:25:28] [INFO]
----------------------------------------------
[RENDERER] [GhostLink] v1.0.2 loaded
==============================================

==============================================
[18/09/2026, 17:25:28] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "HackPad++" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 17:25:28] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "NetDesk" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 17:25:28] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "python-is-python3" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 17:25:28] [INFO]
----------------------------------------------
[RENDERER] [python-is-python3] Mod loaded! Run: apt-get install python-is-python3
==============================================

==============================================
[18/09/2026, 17:25:28] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Lockchain | Featured HackHub Mod" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 17:25:28] [INFO]
----------------------------------------------
[RENDERER] Lockchain Wallet mod loaded: websites, phone wallet, marketplace, miner, and isolated RPC registered.
==============================================

==============================================
[18/09/2026, 17:25:28] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "FISHCEPTION/OS" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 17:25:28] [INFO]
----------------------------------------------
[RENDERER] [Fishception] biological daemon loaded
==============================================

==============================================
[18/09/2026, 17:25:28] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "HackHub Beginner Handbook+" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 17:25:28] [INFO]
----------------------------------------------
[RENDERER] [Beginner Handbook+] Registered 109 handbook pages without title prefixes. Language: en.
==============================================

==============================================
[18/09/2026, 17:25:28] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Lockbox 6.0" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 17:25:28] [INFO]
----------------------------------------------
[RENDERER] [vault-manager] Vault Manager loaded — password vault & sticky notes ready.
==============================================

==============================================
[18/09/2026, 17:25:28] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 149ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 17:25:29] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 55ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 17:25:34] [WARN]
----------------------------------------------
[RENDERER] [Scheduler] Holding job "Queue.HandleQuestHackhubPosts": no handler registered.
==============================================

==============================================
[18/09/2026, 17:25:35] [INFO]
----------------------------------------------
[RENDERER] [qe24] Game.SessionStarted observed
==============================================

==============================================
[18/09/2026, 17:25:35] [INFO]
----------------------------------------------
[RENDERER] [qe24] HTTP host registered: qe24-http.test
==============================================

==============================================
[18/09/2026, 17:25:35] [INFO]
----------------------------------------------
[RENDERER] [qe24] Wi-Fi AP created: QE24-RAW-5G at 170.195.115.151
==============================================

==============================================
[18/09/2026, 17:25:35] [INFO]
----------------------------------------------
[RENDERER] [qe24] session ready: host=qe24-http.test ssid=QE24-RAW-5G
==============================================

==============================================
[18/09/2026, 17:26:01] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TimerQa" started (1 entry point)
==============================================

==============================================
[18/09/2026, 17:26:01] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "timer quest started"
==============================================

==============================================
[18/09/2026, 17:26:01] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer node qe-tmrf7pia armed after 2m (job T6nLZcpwsu)
==============================================

==============================================
[18/09/2026, 17:26:01] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TimerQa" objectives started
==============================================

==============================================
[18/09/2026, 17:26:03] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer qe-tmrf7pia fired
==============================================

==============================================
[18/09/2026, 17:26:03] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] mail "Timer A arrived (S-01 green)" sent via Mail.send
==============================================

==============================================
[18/09/2026, 17:26:03] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer node qe-9b919r74 armed after 2h (job uO1ZDpc81C)
==============================================

==============================================
[18/09/2026, 17:26:07] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: starting
==============================================

==============================================
[18/09/2026, 17:26:07] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup starting (abandon): 0 item(s) to undo
==============================================

==============================================
[18/09/2026, 17:26:07] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup finished
==============================================

==============================================
[18/09/2026, 17:26:07] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cancelled 2 pending timer(s)
==============================================

==============================================
[18/09/2026, 17:26:07] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: cleanup done, removing weechat servers
==============================================

==============================================
[18/09/2026, 17:26:07] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: running end-of-quest nodes
==============================================

==============================================
[18/09/2026, 17:26:07] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: finished, handing back to the game
==============================================

==============================================
[18/09/2026, 17:26:08] [ERROR]
----------------------------------------------
[RENDERER] [synthetik-wallet] tickPrices:challenges failed: [ContentSDK] Mod "null" tried to use UI.toast without "ui" permission. Add "ui" to the permissions array in your manifest.json. Error: [ContentSDK] Mod "null" tried to use UI.toast without "ui" permission. Add "ui" to the permissions array in your manifest.json.
    at nu (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/index.js:171575:57226)
    at Object.toast (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/index.js:171904:28505)
    at Object.s [as toast] (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/index.js:171575:50469)
    at SynthetikWallet.tickPricesInner (eval at kLr (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/index.js:171904:40510), <anonymous>:5033:50)
    at SynthetikWallet.tickPrices (eval at kLr (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/index.js:171904:40510), <anonymous>:4998:12)
    at eval (eval at kLr (file:///S:/SteamLibrary/steamapps/common/Hackhub/resources/app.asar/dist/assets/index.js:171904:40510), <anonymous>:4884:14)
==============================================

==============================================
  APPLICATION CLOSING
  Time: 18/09/2026, 17:28:37
==============================================

# S-10 short-month clamp

Skipped, today's in-game time is Sept. 19

# S-11 clock panel

Zeis~$ [/home/Zeis] qe24 run wait
Claimed QESdk024WaitMonthQa - look for "Timer QA (Wait in months: S-14, S-09)" in the journal.
If it is not there, this build may refuse cross-mod claims: claim that title yourself.
Started: waits 1 in-game minute (the schedule path), then holds Wait 1 month (the scheduleAt path) - read it with qe24 timers.
Give it a second, then run: qe24 timers
That prints every pending job with the moment it will fire - you do not wait for it.
Zeis~$ [/home/Zeis] qe24 timers
QE24 pending timers (every Scheduler job on this save, any mod)
In-game now: Sat Sep 19 2026 01:55:43 GMT+0200 (Central European Summer Time)
same moment in UTC: 2026-09-18T23:55:43.245Z
Pending jobs: 3
[1] kind: Queue.HandleQuestHackhubPosts id: wXRlHgP5kK
fires in-game: Wed Sep 23 2026 08:41:32 GMT+0200 (Central European Summer Time)
same in UTC: 2026-09-23T06:41:32.385Z (raw 1790145692385)
in-game in: 4d 6h 45m (in-game ms 369949140) - that is about 6166 real seconds at this clock scale
[2] kind: qe/qe-sdk-024-editor-qa/timer id: G5VO8Fn10g
payload: questId=qe-cal2 nodeId=qe-cal2-t2 attempts=0
fires in-game: Mon Oct 19 2026 01:51:00 GMT+0200 (Central European Summer Time)
same in UTC: 2026-10-18T23:51:00.000Z (raw 1792367460000)
in-game in: 29d 23h 55m (in-game ms 2591716755) - that is about 43195 real seconds at this clock scale
[3] kind: Queue.HandleQuestHackhubPosts id: tmeDML6Czw
fires in-game: Mon Jan 04 2027 05:20:38 GMT+0100 (Central European Standard Time)
same in UTC: 2027-01-04T04:20:38.205Z (raw 1799036438205)
in-game in: 107d 4h 24m (in-game ms 9260694960) - that is about 154345 real seconds at this clock scale
Read the 'fires in-game' line against the on-screen clock: that is the moment the
game will fire. A Timer that promised a month or a year lands here, so you do not
have to wait for it - check the day and the clock time it resolved to.

--> Clock Panel reads: "NEXT EVENT 4d 6h [Wait]" ([Wait] is a button)

# S-12 pre-r176 draft

Loading up the after project json file for this in the editor opens something up, but I'm not sure what - it seems broken. The Canvas has the "Browse 13 templates" window open like when you start a fresh template, the canvas reads "No quest selected" and so does the Quest tab in the inspector.

# S-15 r176-era draft

Loading up coming day json has the same issue as S-12.