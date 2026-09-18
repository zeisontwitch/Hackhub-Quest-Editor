# GENERAL QA NOTES

Steam:
App ID: 2980270
Build ID: 25388883

- Every test is done on a clean save and reset to the clean save after the test is done. Please tell me if you want me to keep a save instead.
- In my local mod folder from the sdk-0.24-qa folder: editor-export, mod
- The previous QA rounds' test-quests (twotter and SDK tests) were still active here, so my game-journal was overfilled and the popups these two produced just added to the ridiculous amount of popups, toasts, notifications that appeared upon load.

---

# S-01 fire

Green. The amount of notifications and toasters that popped up was too much to fit on the screen, so I can't tell if the right one popped or not.
Game Log (I hope I got the right ones for you, there are a bunch more after the last one but I left them behind as per instructions):

==============================================
  HACKHUB LOG FILE
  Started: 18/09/2026, 16:29:00
  Version: 1.3.1
  Platform: win32
  Arch: x64
==============================================


==============================================
[18/09/2026, 16:29:00] [INFO]
----------------------------------------------
Steamworks initalized: Zeis [ZF] - 76561197976480835
==============================================

==============================================
[18/09/2026, 16:29:00] [INFO]
----------------------------------------------
[WorkshopController] initialized with appId: 2980270
==============================================

==============================================
[18/09/2026, 16:29:01] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "QE SDK 0.24 Editor QA Scaffold" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:29:01] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer handler registered (kind qe/qe-sdk-024-editor-qa/timer)
==============================================

==============================================
[18/09/2026, 16:29:01] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] QE SDK 0.24 Editor QA Scaffold v1.0.8 loaded (editor build 2026-09-18.r180).
==============================================

==============================================
[18/09/2026, 16:29:01] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Markdown Note Editor" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:29:01] [INFO]
----------------------------------------------
[RENDERER] [Markdown Note Editor] Mod loaded.
==============================================

==============================================
[18/09/2026, 16:29:01] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "QE SDK 0.24 QA Harness" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:29:01] [INFO]
----------------------------------------------
[RENDERER] [qe24] mod loaded
==============================================

==============================================
[18/09/2026, 16:29:01] [INFO]
----------------------------------------------
[RENDERER] [qe24] HTTP host registered: qe24-http.test
==============================================

==============================================
[18/09/2026, 16:29:01] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Nemesis Protocol" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:29:01] [INFO]
----------------------------------------------
[RENDERER] [nemesis-protocol-stage1] Nemesis Protocol loaded. The mission is waiting in the HackHub feed.
==============================================

==============================================
[18/09/2026, 16:29:01] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "RetroArcade" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:29:01] [INFO]
----------------------------------------------
[RENDERER] RetroArcade v1.0.0 loaded!
==============================================

==============================================
[18/09/2026, 16:29:01] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Darknet-Tree" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:29:01] [INFO]
----------------------------------------------
[RENDERER] [darknet-tree] Darknet-Tree loaded! Check the App Store for NotePad.
==============================================

==============================================
[18/09/2026, 16:29:01] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Synthetik Wallet" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:29:01] [INFO]
----------------------------------------------
[RENDERER] [synthetik-wallet] Synthetik Wallet loaded! Find it in the App Store.
==============================================

==============================================
[18/09/2026, 16:29:01] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "GhostLink" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:29:01] [INFO]
----------------------------------------------
[RENDERER] [GhostLink] v1.0.2 loaded
==============================================

==============================================
[18/09/2026, 16:29:01] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "HackPad++" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:29:01] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "NetDesk" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:29:01] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "python-is-python3" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:29:01] [INFO]
----------------------------------------------
[RENDERER] [python-is-python3] Mod loaded! Run: apt-get install python-is-python3
==============================================

==============================================
[18/09/2026, 16:29:01] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Lockchain | Featured HackHub Mod" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:29:01] [INFO]
----------------------------------------------
[RENDERER] Lockchain Wallet mod loaded: websites, phone wallet, marketplace, miner, and isolated RPC registered.
==============================================

==============================================
[18/09/2026, 16:29:01] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "FISHCEPTION/OS" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:29:01] [INFO]
----------------------------------------------
[RENDERER] [Fishception] biological daemon loaded
==============================================

==============================================
[18/09/2026, 16:29:01] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "HackHub Beginner Handbook+" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:29:01] [INFO]
----------------------------------------------
[RENDERER] [Beginner Handbook+] Registered 109 handbook pages without title prefixes. Language: en.
==============================================

==============================================
[18/09/2026, 16:29:01] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Lockbox 6.0" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:29:01] [INFO]
----------------------------------------------
[RENDERER] [vault-manager] Vault Manager loaded — password vault & sticky notes ready.
==============================================

==============================================
[18/09/2026, 16:29:01] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 142ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:29:02] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 55ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:29:02] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 54ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:29:41] [ERROR]
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
[18/09/2026, 16:33:44] [WARN]
----------------------------------------------
[RENDERER] [Scheduler] Holding job "Queue.HandleQuestHackhubPosts": no handler registered.
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [qe24] Game.SessionStarted observed
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [qe24] HTTP host registered: qe24-http.test
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [qe24] Wi-Fi AP created: QE24-RAW-5G at 173.158.43.240
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [qe24] session ready: host=qe24-http.test ssid=QE24-RAW-5G
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024EditorQa" started (1 entry point)
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] mail "QE24 editor QA scaffold" sent via Mail.send
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "QE24 editor scaffold started; native Wi-Fi node emitted with bssid/channel/wps." | event: (none - not reached from a trigger) | saved: { targetIp="43.167.43.74" }
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024EditorQa" objectives started
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "QE24 editor scaffold OnObjectivesStart/listeners registered or re-registered after load." | event: (none - not reached from a trigger) | saved: { targetIp="43.167.43.74" }
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "http-response" is listening for Http.Response
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "http-request" is listening for Http.Request
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "http-intercepted" is listening for Http.Intercepted
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "wifi-connect" is listening for Network.WifiConnected
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "wifi-disconnect" is listening for Network.WifiDisconnected
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TimerQa" started (1 entry point)
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "timer quest started"
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer node qe-tmrf7pia armed after 2m (job bchecCLEGb)
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TimerQa" objectives started
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TimerCalQa" started (1 entry point)
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "Timer calendar QA armed - S-06 next (an exact date already past)"
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer node qe-cal1-t1: due time already passed - the timer fires immediately
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] mail "S-06 green: an exact date in the past fired immediately" sent via Mail.send
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "S-06 done. S-05 next: a coming day, 0 days at 00:00 (already past today)"
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer node qe-cal1-t2: due time already passed - the timer fires immediately
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] mail "S-05 green: 'a coming day, 0 days at 00:00' fired immediately" sent via Mail.send
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "S-13 next: 1 month 2 weeks 2 days at 18:23 - read 'qe24 timers'"
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer node qe-cal1-t3 armed in 1mo 2w 2d, at 18:23 in-game -> in-game 2026-11-03T17:23:00.000Z (fireAt 1793726580000, job fU7NvEXCbJ)
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TimerCalQa" objectives started
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024WaitMonthQa" started (1 entry point)
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "Timer Wait QA armed - a 1 minute Wait first (S-01 path)"
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer node qe-cal2-t1 armed after 1m (job GZI4lUprrZ)
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024WaitMonthQa" objectives started
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [qe24] QE24SurfaceProbe started
==============================================

==============================================
[18/09/2026, 16:33:45] [INFO]
----------------------------------------------
[RENDERER] [qe24] QE24TwotterProbe started
==============================================

==============================================
[18/09/2026, 16:33:46] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer qe-cal2-t1 fired
==============================================

==============================================
[18/09/2026, 16:33:46] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] mail "Wait 1 minute fired (S-01 path)" sent via Mail.send
==============================================

==============================================
[18/09/2026, 16:33:46] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "Now arming Wait 1 month (scheduleAt) - read 'qe24 timers'"
==============================================

==============================================
[18/09/2026, 16:33:46] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer node qe-cal2-t2 armed after 1mo -> in-game 2026-10-18T17:27:00.000Z (fireAt 1792344420000, job y1sHy1taSM)
==============================================

==============================================
[18/09/2026, 16:33:47] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer qe-tmrf7pia fired
==============================================

==============================================
[18/09/2026, 16:33:47] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] mail "Timer A arrived (S-01 green)" sent via Mail.send
==============================================

==============================================
[18/09/2026, 16:33:47] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer node qe-9b919r74 armed after 2h (job JpT0fP6IVs)
==============================================


# S-02 reload

Upon reload, had 4 popups:

Info
debug: QE24 editor scaffold OnObjectivesStart/listeners registered or re-registered after load.

System Notification:
Quest "Timer QA (S-01/S-02/S-03)" is ready to complete.

System Notification:
Quest "Timer QA (calendar: (S-05/S-06/S-07-S-13)" is ready to complete.

System Notification
Quest "Timer QA (calendar: (Wait in months: S-14, S-09)" is ready to complete.

A few real-seconds later, "Timer B fired" toaster appeared.

# S-03 cancel

Fresh save. Loaded up, as soon as enough toasters disappeared that I could access the quest journal (roughly 5-10 real seconds after loading), I cancelled all pending quests. Waited 2 real-minutes. Saved and quit game.

Game log:

==============================================
  HACKHUB LOG FILE
  Started: 18/09/2026, 16:47:22
  Version: 1.3.1
  Platform: win32
  Arch: x64
==============================================


==============================================
[18/09/2026, 16:47:22] [INFO]
----------------------------------------------
Steamworks initalized: Zeis [ZF] - 76561197976480835
==============================================

==============================================
[18/09/2026, 16:47:22] [INFO]
----------------------------------------------
[WorkshopController] initialized with appId: 2980270
==============================================

==============================================
[18/09/2026, 16:47:23] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "QE SDK 0.24 Editor QA Scaffold" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:47:23] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer handler registered (kind qe/qe-sdk-024-editor-qa/timer)
==============================================

==============================================
[18/09/2026, 16:47:23] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] QE SDK 0.24 Editor QA Scaffold v1.0.8 loaded (editor build 2026-09-18.r180).
==============================================

==============================================
[18/09/2026, 16:47:23] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Markdown Note Editor" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:47:23] [INFO]
----------------------------------------------
[RENDERER] [Markdown Note Editor] Mod loaded.
==============================================

==============================================
[18/09/2026, 16:47:23] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "QE SDK 0.24 QA Harness" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:47:23] [INFO]
----------------------------------------------
[RENDERER] [qe24] mod loaded
==============================================

==============================================
[18/09/2026, 16:47:23] [INFO]
----------------------------------------------
[RENDERER] [qe24] HTTP host registered: qe24-http.test
==============================================

==============================================
[18/09/2026, 16:47:23] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Nemesis Protocol" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:47:23] [INFO]
----------------------------------------------
[RENDERER] [nemesis-protocol-stage1] Nemesis Protocol loaded. The mission is waiting in the HackHub feed.
==============================================

==============================================
[18/09/2026, 16:47:23] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "RetroArcade" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:47:23] [INFO]
----------------------------------------------
[RENDERER] RetroArcade v1.0.0 loaded!
==============================================

==============================================
[18/09/2026, 16:47:23] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Darknet-Tree" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:47:23] [INFO]
----------------------------------------------
[RENDERER] [darknet-tree] Darknet-Tree loaded! Check the App Store for NotePad.
==============================================

==============================================
[18/09/2026, 16:47:23] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Synthetik Wallet" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:47:23] [INFO]
----------------------------------------------
[RENDERER] [synthetik-wallet] Synthetik Wallet loaded! Find it in the App Store.
==============================================

==============================================
[18/09/2026, 16:47:23] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "GhostLink" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:47:23] [INFO]
----------------------------------------------
[RENDERER] [GhostLink] v1.0.2 loaded
==============================================

==============================================
[18/09/2026, 16:47:23] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "HackPad++" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:47:23] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "NetDesk" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:47:23] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "python-is-python3" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:47:23] [INFO]
----------------------------------------------
[RENDERER] [python-is-python3] Mod loaded! Run: apt-get install python-is-python3
==============================================

==============================================
[18/09/2026, 16:47:23] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Lockchain | Featured HackHub Mod" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:47:23] [INFO]
----------------------------------------------
[RENDERER] Lockchain Wallet mod loaded: websites, phone wallet, marketplace, miner, and isolated RPC registered.
==============================================

==============================================
[18/09/2026, 16:47:23] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "FISHCEPTION/OS" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:47:23] [INFO]
----------------------------------------------
[RENDERER] [Fishception] biological daemon loaded
==============================================

==============================================
[18/09/2026, 16:47:23] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "HackHub Beginner Handbook+" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:47:23] [INFO]
----------------------------------------------
[RENDERER] [Beginner Handbook+] Registered 109 handbook pages without title prefixes. Language: en.
==============================================

==============================================
[18/09/2026, 16:47:23] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Lockbox 6.0" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[18/09/2026, 16:47:23] [INFO]
----------------------------------------------
[RENDERER] [vault-manager] Vault Manager loaded — password vault & sticky notes ready.
==============================================

==============================================
[18/09/2026, 16:47:25] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam failed after 56ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:47:27] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam failed after 50ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:47:28] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam failed after 51ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:47:29] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam failed after 53ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:47:31] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam failed after 66ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:47:31] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 58ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:47:31] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/stats failed after 55ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:47:31] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/announcements?limit=10 failed after 57ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:47:31] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/dlc-store/config failed after 86ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:47:31] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/actions failed after 92ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:47:31] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/pages failed after 94ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:47:31] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/featured-mods failed after 100ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:47:31] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/polls failed after 119ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:48:03] [ERROR]
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
[18/09/2026, 16:48:17] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 53ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:48:17] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 54ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:48:18] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 53ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:48:18] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/player-notifications?limit=50 failed after 90ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:48:18] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/player-notifications?limit=50 failed after 99ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:48:22] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 53ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:48:22] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 65ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:48:23] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 53ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:48:23] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/player-notifications?limit=50 failed after 52ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:48:26] [WARN]
----------------------------------------------
[RENDERER] [Scheduler] Holding job "Queue.HandleQuestHackhubPosts": no handler registered.
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [qe24] Game.SessionStarted observed
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [qe24] HTTP host registered: qe24-http.test
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [qe24] Wi-Fi AP created: QE24-RAW-5G at 169.70.218.226
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [qe24] session ready: host=qe24-http.test ssid=QE24-RAW-5G
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024EditorQa" started (1 entry point)
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] mail "QE24 editor QA scaffold" sent via Mail.send
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "QE24 editor scaffold started; native Wi-Fi node emitted with bssid/channel/wps." | event: (none - not reached from a trigger) | saved: { targetIp="189.169.239.16" }
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024EditorQa" objectives started
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "QE24 editor scaffold OnObjectivesStart/listeners registered or re-registered after load." | event: (none - not reached from a trigger) | saved: { targetIp="189.169.239.16" }
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "http-response" is listening for Http.Response
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "http-request" is listening for Http.Request
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "http-intercepted" is listening for Http.Intercepted
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "wifi-connect" is listening for Network.WifiConnected
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "wifi-disconnect" is listening for Network.WifiDisconnected
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TimerQa" started (1 entry point)
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "timer quest started"
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer node qe-tmrf7pia armed after 2m (job 4tV0r8SVws)
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TimerQa" objectives started
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TimerCalQa" started (1 entry point)
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "Timer calendar QA armed - S-06 next (an exact date already past)"
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer node qe-cal1-t1: due time already passed - the timer fires immediately
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] mail "S-06 green: an exact date in the past fired immediately" sent via Mail.send
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "S-06 done. S-05 next: a coming day, 0 days at 00:00 (already past today)"
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer node qe-cal1-t2: due time already passed - the timer fires immediately
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] mail "S-05 green: 'a coming day, 0 days at 00:00' fired immediately" sent via Mail.send
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "S-13 next: 1 month 2 weeks 2 days at 18:23 - read 'qe24 timers'"
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer node qe-cal1-t3 armed in 1mo 2w 2d, at 18:23 in-game -> in-game 2026-11-03T17:23:00.000Z (fireAt 1793726580000, job NG3LYgfHwz)
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TimerCalQa" objectives started
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024WaitMonthQa" started (1 entry point)
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "Timer Wait QA armed - a 1 minute Wait first (S-01 path)"
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer node qe-cal2-t1 armed after 1m (job wqif06CKdZ)
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024WaitMonthQa" objectives started
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [qe24] QE24SurfaceProbe started
==============================================

==============================================
[18/09/2026, 16:48:26] [INFO]
----------------------------------------------
[RENDERER] [qe24] QE24TwotterProbe started
==============================================

==============================================
[18/09/2026, 16:48:28] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer qe-cal2-t1 fired
==============================================

==============================================
[18/09/2026, 16:48:28] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] mail "Wait 1 minute fired (S-01 path)" sent via Mail.send
==============================================

==============================================
[18/09/2026, 16:48:28] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "Now arming Wait 1 month (scheduleAt) - read 'qe24 timers'"
==============================================

==============================================
[18/09/2026, 16:48:28] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer node qe-cal2-t2 armed after 1mo -> in-game 2026-10-18T17:27:00.000Z (fireAt 1792344420000, job 5jMVYABjBN)
==============================================

==============================================
[18/09/2026, 16:48:28] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer qe-tmrf7pia fired
==============================================

==============================================
[18/09/2026, 16:48:28] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] mail "Timer A arrived (S-01 green)" sent via Mail.send
==============================================

==============================================
[18/09/2026, 16:48:28] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer node qe-9b919r74 armed after 2h (job Sfi0kZjm1B)
==============================================

==============================================
[18/09/2026, 16:48:32] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: starting
==============================================

==============================================
[18/09/2026, 16:48:32] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup starting (abandon): 1 item(s) to undo
==============================================

==============================================
[18/09/2026, 16:48:32] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup: network 189.169.239.16
==============================================

==============================================
[18/09/2026, 16:48:32] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup finished
==============================================

==============================================
[18/09/2026, 16:48:32] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: cleanup done, removing weechat servers
==============================================

==============================================
[18/09/2026, 16:48:32] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: running end-of-quest nodes
==============================================

==============================================
[18/09/2026, 16:48:32] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: finished, handing back to the game
==============================================

==============================================
[18/09/2026, 16:48:33] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup: network 189.169.239.16 destroyed
==============================================

==============================================
[18/09/2026, 16:48:33] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: starting
==============================================

==============================================
[18/09/2026, 16:48:33] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup starting (abandon): 0 item(s) to undo
==============================================

==============================================
[18/09/2026, 16:48:33] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup finished
==============================================

==============================================
[18/09/2026, 16:48:33] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cancelled 2 pending timer(s)
==============================================

==============================================
[18/09/2026, 16:48:33] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: cleanup done, removing weechat servers
==============================================

==============================================
[18/09/2026, 16:48:33] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: running end-of-quest nodes
==============================================

==============================================
[18/09/2026, 16:48:33] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: finished, handing back to the game
==============================================

==============================================
[18/09/2026, 16:48:34] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: starting
==============================================

==============================================
[18/09/2026, 16:48:34] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup starting (abandon): 0 item(s) to undo
==============================================

==============================================
[18/09/2026, 16:48:34] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup finished
==============================================

==============================================
[18/09/2026, 16:48:34] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cancelled 1 pending timer(s)
==============================================

==============================================
[18/09/2026, 16:48:34] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: cleanup done, removing weechat servers
==============================================

==============================================
[18/09/2026, 16:48:34] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: running end-of-quest nodes
==============================================

==============================================
[18/09/2026, 16:48:34] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: finished, handing back to the game
==============================================

==============================================
[18/09/2026, 16:48:35] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: starting
==============================================

==============================================
[18/09/2026, 16:48:35] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup starting (abandon): 0 item(s) to undo
==============================================

==============================================
[18/09/2026, 16:48:35] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cleanup finished
==============================================

==============================================
[18/09/2026, 16:48:35] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] cancelled 2 pending timer(s)
==============================================

==============================================
[18/09/2026, 16:48:35] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: cleanup done, removing weechat servers
==============================================

==============================================
[18/09/2026, 16:48:35] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: running end-of-quest nodes
==============================================

==============================================
[18/09/2026, 16:48:35] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] OnAbandon: finished, handing back to the game
==============================================

==============================================
[18/09/2026, 16:48:36] [INFO]
----------------------------------------------
[RENDERER] [qe24] QE24SurfaceProbe abandoned
==============================================

==============================================
[18/09/2026, 16:48:37] [INFO]
----------------------------------------------
[RENDERER] [qe24] QE24TwotterProbe abandoned
==============================================

==============================================
[18/09/2026, 16:50:44] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 143ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:50:45] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 54ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:50:45] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 50ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:50:46] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 49ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:50:46] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 52ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:50:47] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 82ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:50:47] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/announcements?limit=10 failed after 52ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:50:47] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/actions failed after 90ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:50:47] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/featured-mods failed after 91ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:50:47] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/polls failed after 93ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:50:47] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/dlc-store/config failed after 92ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:50:47] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/pages failed after 95ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:50:47] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/stats failed after 102ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:50:47] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 48ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:50:47] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 51ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:50:48] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 51ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[18/09/2026, 16:50:48] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/player-notifications?limit=50 failed after 50ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[18/09/2026, 16:50:48] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/player-notifications?limit=50 failed after 52ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
  APPLICATION CLOSING
  Time: 18/09/2026, 16:50:48
==============================================

# S-04 through S-06

Skipped, from what I understand from the list there is nothing actively for me to do here, or the previous things I did should've answered those?

# S-07 reload survival

Fresh save. Initial load:

Zeis~$ [/home/Zeis] qe24 timers
QE24 pending timers (every Scheduler job on this save, any mod)
In-game now: Fri Sep 18 2026 19:29:41 GMT+0200 (Central European Summer Time)
same moment in UTC: 2026-09-18T17:29:41.865Z
Pending jobs: 5
[1] kind: qe/qe-sdk-024-editor-qa/timer id: 3xGYDqlxrQ
payload: questId=qe-siv3sx5g nodeId=qe-9b919r74 attempts=0
fires in-game: Fri Sep 18 2026 21:27:40 GMT+0200 (Central European Summer Time)
same in UTC: 2026-09-18T19:27:40.665Z (raw 1789759660665)
in-game in: 1h 57m (in-game ms 7078800) - that is about 118 real seconds at this clock scale
[2] kind: Queue.HandleQuestHackhubPosts id: wXRlHgP5kK
fires in-game: Wed Sep 23 2026 08:41:32 GMT+0200 (Central European Summer Time)
same in UTC: 2026-09-23T06:41:32.385Z (raw 1790145692385)
in-game in: 4d 13h 11m (in-game ms 393110520) - that is about 6552 real seconds at this clock scale
[3] kind: qe/qe-sdk-024-editor-qa/timer id: lZRktW1y0A
payload: questId=qe-cal2 nodeId=qe-cal2-t2 attempts=0
fires in-game: Sun Oct 18 2026 19:27:00 GMT+0200 (Central European Summer Time)
same in UTC: 2026-10-18T17:27:00.000Z (raw 1792344420000)
in-game in: 29d 23h 57m (in-game ms 2591838135) - that is about 43197 real seconds at this clock scale
[4] kind: qe/qe-sdk-024-editor-qa/timer id: KSZ7y2Yg7o
payload: questId=qe-cal1 nodeId=qe-cal1-t3 attempts=0
fires in-game: Tue Nov 03 2026 18:23:00 GMT+0100 (Central European Standard Time)
same in UTC: 2026-11-03T17:23:00.000Z (raw 1793726580000)
in-game in: 45d 23h 53m (in-game ms 3973998135) - that is about 66233 real seconds at this clock scale
[5] kind: Queue.HandleQuestHackhubPosts id: XVxDR1h0zS
fires in-game: Sat Jan 02 2027 22:14:11 GMT+0100 (Central European Standard Time)
same in UTC: 2027-01-02T21:14:11.445Z (raw 1798924451445)
in-game in: 106d 3h 44m (in-game ms 9171869580) - that is about 152864 real seconds at this clock scale
Read the 'fires in-game' line against the on-screen clock: that is the moment the
game will fire. A Timer that promised a month or a year lands here, so you do not
have to wait for it - check the day and the clock time it resolved to.

--> Save-and-Quit, reload: 

Zeis~$ [/home/Zeis] qe24 timers
QE24 pending timers (every Scheduler job on this save, any mod)
In-game now: Fri Sep 18 2026 20:08:29 GMT+0200 (Central European Summer Time)
same moment in UTC: 2026-09-18T18:08:29.325Z
Pending jobs: 5
[1] kind: qe/qe-sdk-024-editor-qa/timer id: 3xGYDqlxrQ
payload: questId=qe-siv3sx5g nodeId=qe-9b919r74 attempts=0
fires in-game: Fri Sep 18 2026 21:27:40 GMT+0200 (Central European Summer Time)
same in UTC: 2026-09-18T19:27:40.665Z (raw 1789759660665)
in-game in: 1h 19m (in-game ms 4751340) - that is about 79 real seconds at this clock scale
[2] kind: Queue.HandleQuestHackhubPosts id: wXRlHgP5kK
fires in-game: Wed Sep 23 2026 08:41:32 GMT+0200 (Central European Summer Time)
same in UTC: 2026-09-23T06:41:32.385Z (raw 1790145692385)
in-game in: 4d 12h 33m (in-game ms 390783060) - that is about 6513 real seconds at this clock scale
[3] kind: qe/qe-sdk-024-editor-qa/timer id: lZRktW1y0A
payload: questId=qe-cal2 nodeId=qe-cal2-t2 attempts=0
fires in-game: Sun Oct 18 2026 19:27:00 GMT+0200 (Central European Summer Time)
same in UTC: 2026-10-18T17:27:00.000Z (raw 1792344420000)
in-game in: 29d 23h 18m (in-game ms 2589510675) - that is about 43159 real seconds at this clock scale
[4] kind: qe/qe-sdk-024-editor-qa/timer id: KSZ7y2Yg7o
payload: questId=qe-cal1 nodeId=qe-cal1-t3 attempts=0
fires in-game: Tue Nov 03 2026 18:23:00 GMT+0100 (Central European Standard Time)
same in UTC: 2026-11-03T17:23:00.000Z (raw 1793726580000)
in-game in: 45d 23h 14m (in-game ms 3971670675) - that is about 66195 real seconds at this clock scale
[5] kind: Queue.HandleQuestHackhubPosts id: XVxDR1h0zS
fires in-game: Sat Jan 02 2027 22:14:11 GMT+0100 (Central European Standard Time)
same in UTC: 2027-01-02T21:14:11.445Z (raw 1798924451445)
in-game in: 106d 3h 5m (in-game ms 9169542120) - that is about 152826 real seconds at this clock scale
Read the 'fires in-game' line against the on-screen clock: that is the moment the
game will fire. A Timer that promised a month or a year lands here, so you do not
have to wait for it - check the day and the clock time it resolved to.

--> Waited for a few minutes until the toaster for "Timer B" popped, ran qe24 timers again:

Zeis~$ [/home/Zeis] qe24 timers
QE24 pending timers (every Scheduler job on this save, any mod)
In-game now: Fri Sep 18 2026 21:42:44 GMT+0200 (Central European Summer Time)
same moment in UTC: 2026-09-18T19:42:44.925Z
Pending jobs: 4
[1] kind: Queue.HandleQuestHackhubPosts id: wXRlHgP5kK
fires in-game: Wed Sep 23 2026 08:41:32 GMT+0200 (Central European Summer Time)
same in UTC: 2026-09-23T06:41:32.385Z (raw 1790145692385)
in-game in: 4d 10h 58m (in-game ms 385127460) - that is about 6419 real seconds at this clock scale
[2] kind: qe/qe-sdk-024-editor-qa/timer id: lZRktW1y0A
payload: questId=qe-cal2 nodeId=qe-cal2-t2 attempts=0
fires in-game: Sun Oct 18 2026 19:27:00 GMT+0200 (Central European Summer Time)
same in UTC: 2026-10-18T17:27:00.000Z (raw 1792344420000)
in-game in: 29d 21h 44m (in-game ms 2583855075) - that is about 43064 real seconds at this clock scale
[3] kind: qe/qe-sdk-024-editor-qa/timer id: KSZ7y2Yg7o
payload: questId=qe-cal1 nodeId=qe-cal1-t3 attempts=0
fires in-game: Tue Nov 03 2026 18:23:00 GMT+0100 (Central European Standard Time)
same in UTC: 2026-11-03T17:23:00.000Z (raw 1793726580000)
in-game in: 45d 21h 40m (in-game ms 3966015075) - that is about 66100 real seconds at this clock scale
[4] kind: Queue.HandleQuestHackhubPosts id: XVxDR1h0zS
fires in-game: Sat Jan 02 2027 22:14:11 GMT+0100 (Central European Standard Time)
same in UTC: 2027-01-02T21:14:11.445Z (raw 1798924451445)
in-game in: 106d 1h 31m (in-game ms 9163886520) - that is about 152731 real seconds at this clock scale
Read the 'fires in-game' line against the on-screen clock: that is the moment the
game will fire. A Timer that promised a month or a year lands here, so you do not
have to wait for it - check the day and the clock time it resolved to.

# S-08 multi-day & S-09 one month on & S-10 short-month clamp & S-13 & S-14

Skipped. I can't wait 10 real-hours to see if a thing triggers in 1 in-game month, I have real-life things to do and developing this editor with you is just a hobby. If every other timer aspect works, then months will likely work too. Should they not, we'll get a bug report and fix it when the time comes, if it ever comes.

# S-11 NEXT EVENT panel

Again, can't wait for 10 real-hours, I have no idea what QESdk024WaitMonthQa looks like because the quest journal is so bloated, and I don't know what you mean by "Arm anything with a Timer" or how to do that.

# S-12 pre-r176 draft & S-15

I would test this, but it's useless for as long as the quest journal is so bloated and we have about twice as many toasters popping up as the game can display.

# Terminal A

Zeis~$ [/home/Zeis] 