# GENERAL QA NOTES

Steam:
App ID: 2980270
Build ID: 25388883

- Every test is done on a clean save and reset to the clean save after the test is done. Please tell me if you want me to keep a save instead.
- In my local mod folder from the sdk-0.24-qa folder: editor-export, mod

---

# T-15c

--> Fresh save, clean mod folder, installed new versions of editor-export and mod, loaded save

Zeis~$[/home/Zeis] qe24 run tw1
Editor export: loaded (v1.0.20 (2026-09-18.r193)).
Claimed QESdk024TwotterQa - look for "Twotter QA (T-08/T-09/T-10/T-11/T-13)" in the journal.
If it is not there, this build may refuse cross-mod claims: claim that title yourself.
Note: Quest.claim() returns nothing in this build, so this line cannot prove the
quest started - check the journal entry above. No entry means the claim did
nothing (the owning mod is disabled or missing).
Started: the editor's Twotter node in the field: a five-tweet series on @qe24_editor, four backdated and one arriving now. Read the profile with Twotter's search, then save/reload, then Complete it.
Twotter rows: run `qe24 twotter audit` straight away - these quests create their
account at quest start, so @qe24_editor should be on the save immediately.
If it is not: the quest did not start. Check the editor export is ENABLED in the
Mods list, then `qe24 run clear` and claim again on a clean save. The game log's
[quest-editor] lines say which of those it was: the load banner proves the mod
loaded, and `twotter: created @...` proves the node ran.

Zeis~$[/home/Zeis] qe24 twotter audit
Editor export: loaded (v1.0.20 (2026-09-18.r193)).
QE24 Twotter audit - the handles this QA round creates:
@qe24_probe: not on this save
@qe24_badrecord: not on this save
@qe24_declared: not on this save
@qe24_editor (id qe-tw-account): bio is a string (125 chars); verified yes; followers 412; following 96; joined Wed Nov 12 2025
1 of 4 handles present; 0 carrying the r31 poison shape.
A hand-crafted account with an empty avatar/banner is normal for this harness;
what matters is the bio line: 0 poisoned means search cannot hit the r31 crash here.
T-11/T-12/T-15 expect the editor's @qe24_editor to LEAVE this list once its quests finish.

--> Saved, quit game, checked game log:

==============================================
  HACKHUB LOG FILE
  Started: 19/09/2026, 14:52:58
  Version: 1.3.1
  Platform: win32
  Arch: x64
==============================================


==============================================
[19/09/2026, 14:52:59] [INFO]
----------------------------------------------
Steamworks initalized: Zeis [ZF] - 76561197976480835
==============================================

==============================================
[19/09/2026, 14:52:59] [INFO]
----------------------------------------------
[WorkshopController] initialized with appId: 2980270
==============================================

==============================================
[19/09/2026, 14:52:59] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "QE SDK 0.24 Editor QA Scaffold" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:52:59] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] timer handler registered (kind qe/qe-sdk-024-editor-qa/timer)
==============================================

==============================================
[19/09/2026, 14:52:59] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] QE SDK 0.24 Editor QA Scaffold v1.0.20 loaded (editor build 2026-09-18.r193).
==============================================

==============================================
[19/09/2026, 14:52:59] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Markdown Note Editor" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:52:59] [INFO]
----------------------------------------------
[RENDERER] [Markdown Note Editor] Mod loaded.
==============================================

==============================================
[19/09/2026, 14:52:59] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "QE SDK 0.24 QA Harness" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:52:59] [INFO]
----------------------------------------------
[RENDERER] [qe24] mod loaded
==============================================

==============================================
[19/09/2026, 14:52:59] [INFO]
----------------------------------------------
[RENDERER] [qe24] HTTP host registered: qe24-http.test
==============================================

==============================================
[19/09/2026, 14:52:59] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Nemesis Protocol" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:52:59] [INFO]
----------------------------------------------
[RENDERER] [nemesis-protocol-stage1] Nemesis Protocol loaded. The mission is waiting in the HackHub feed.
==============================================

==============================================
[19/09/2026, 14:52:59] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "RetroArcade" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:52:59] [INFO]
----------------------------------------------
[RENDERER] RetroArcade v1.0.0 loaded!
==============================================

==============================================
[19/09/2026, 14:52:59] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Darknet-Tree" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:52:59] [INFO]
----------------------------------------------
[RENDERER] [darknet-tree] Darknet-Tree loaded! Check the App Store for NotePad.
==============================================

==============================================
[19/09/2026, 14:52:59] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Synthetik Wallet" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:52:59] [INFO]
----------------------------------------------
[RENDERER] [synthetik-wallet] Synthetik Wallet loaded! Find it in the App Store.
==============================================

==============================================
[19/09/2026, 14:53:00] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "GhostLink" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:53:00] [INFO]
----------------------------------------------
[RENDERER] [GhostLink] v1.0.2 loaded
==============================================

==============================================
[19/09/2026, 14:53:00] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "HackPad++" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:53:00] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "NetDesk" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:53:00] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "python-is-python3" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:53:00] [INFO]
----------------------------------------------
[RENDERER] [python-is-python3] Mod loaded! Run: apt-get install python-is-python3
==============================================

==============================================
[19/09/2026, 14:53:00] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Lockchain | Featured HackHub Mod" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:53:00] [INFO]
----------------------------------------------
[RENDERER] Lockchain Wallet mod loaded: websites, phone wallet, marketplace, miner, and isolated RPC registered.
==============================================

==============================================
[19/09/2026, 14:53:00] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "FISHCEPTION/OS" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:53:00] [INFO]
----------------------------------------------
[RENDERER] [Fishception] biological daemon loaded
==============================================

==============================================
[19/09/2026, 14:53:00] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "HackHub Beginner Handbook+" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:53:00] [INFO]
----------------------------------------------
[RENDERER] [Beginner Handbook+] Registered 109 handbook pages without title prefixes. Language: en.
==============================================

==============================================
[19/09/2026, 14:53:00] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Lockbox 6.0" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:53:00] [INFO]
----------------------------------------------
[RENDERER] [vault-manager] Vault Manager loaded — password vault & sticky notes ready.
==============================================

==============================================
[19/09/2026, 14:53:00] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 145ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:53:00] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 51ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:53:01] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 139ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:53:01] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 48ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:53:02] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 50ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:53:02] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 95ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:53:02] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/stats failed after 49ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:53:02] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/announcements?limit=10 failed after 51ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:53:02] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/polls failed after 82ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:53:02] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/featured-mods failed after 89ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:53:02] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/actions failed after 92ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:53:02] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/pages failed after 93ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:53:02] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/dlc-store/config failed after 92ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:53:04] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 49ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:53:04] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 48ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:53:05] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 49ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:53:05] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/player-notifications?limit=50 failed after 48ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:53:05] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/player-notifications?limit=50 failed after 49ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:53:05] [WARN]
----------------------------------------------
[RENDERER] [Scheduler] Holding job "Queue.HandleQuestHackhubPosts": no handler registered.
==============================================

==============================================
[19/09/2026, 14:53:05] [INFO]
----------------------------------------------
[RENDERER] [qe24] Game.SessionStarted observed
==============================================

==============================================
[19/09/2026, 14:53:05] [INFO]
----------------------------------------------
[RENDERER] [qe24] HTTP host registered: qe24-http.test
==============================================

==============================================
[19/09/2026, 14:53:05] [INFO]
----------------------------------------------
[RENDERER] [qe24] Wi-Fi AP created: QE24-RAW-5G at 209.254.217.155
==============================================

==============================================
[19/09/2026, 14:53:05] [INFO]
----------------------------------------------
[RENDERER] [qe24] session ready: host=qe24-http.test ssid=QE24-RAW-5G
==============================================

==============================================
[19/09/2026, 14:53:13] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter: created @qe24_editor (qe-tw-account) for quest qe-tw1
==============================================

==============================================
[19/09/2026, 14:53:13] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TwotterQa" started (1 entry point)
==============================================

==============================================
[19/09/2026, 14:53:13] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] reached "Twotter QA started: @qe24_editor now carries the series. Open Twotter and search for it."
==============================================

==============================================
[19/09/2026, 14:53:13] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter: refreshed @qe24_editor (our account, already in the save)
==============================================

==============================================
[19/09/2026, 14:53:13] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter node qe-tw1-post: posted qe-qe-tw1-qe-tw1-post-0 (backdated to 2025-09-18T17:33:07.545Z)
==============================================

==============================================
[19/09/2026, 14:53:13] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter node qe-tw1-post: posted qe-qe-tw1-qe-tw1-post-1 (backdated to 2026-06-18T17:33:07.545Z)
==============================================

==============================================
[19/09/2026, 14:53:13] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter node qe-tw1-post: posted qe-qe-tw1-qe-tw1-post-2 (backdated to 2026-08-07T17:33:07.545Z)
==============================================

==============================================
[19/09/2026, 14:53:13] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter node qe-tw1-post: posted qe-qe-tw1-qe-tw1-post-3 (backdated to 2026-09-06T17:33:07.545Z)
==============================================

==============================================
[19/09/2026, 14:53:13] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter node qe-tw1-post: posted qe-qe-tw1-qe-tw1-post-4 (now)
==============================================

==============================================
[19/09/2026, 14:53:13] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] quest "QESdk024TwotterQa" objectives started
==============================================

==============================================
[19/09/2026, 14:53:13] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] twotter: refreshed @qe24_editor (our account, already in the save)
==============================================

==============================================
[19/09/2026, 14:53:13] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "profile-seen" is listening for Twotter.ProfileSeen
==============================================

==============================================
[19/09/2026, 14:53:13] [INFO]
----------------------------------------------
[RENDERER] [quest-editor] objective "post-seen" is listening for Twotter.PostSeen
==============================================

==============================================
[19/09/2026, 14:55:20] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 103ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:55:20] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 55ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:55:21] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 48ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:55:21] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 45ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:55:21] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 57ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:55:22] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 55ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:55:22] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/stats failed after 48ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:55:22] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/announcements?limit=10 failed after 49ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:55:22] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/polls failed after 91ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:55:22] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/pages failed after 92ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:55:22] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/dlc-store/config failed after 102ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:55:22] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/featured-mods failed after 103ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:55:22] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/actions failed after 123ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:55:22] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 52ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:55:22] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 51ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:55:23] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 50ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:55:23] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/player-notifications?limit=50 failed after 50ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:55:23] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/player-notifications?limit=50 failed after 52ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
  APPLICATION CLOSING
  Time: 19/09/2026, 14:55:26
==============================================

--> Removed export-mod, relaunched game, loaded save

Zeis~$[/home/Zeis] qe24 twotter audit
Editor export: NOT LOADED in this session.
Its quests are not in the game, so `qe24 run` cannot start them (Quest.claim
fails silently). Check the Mods list: an old copy that was disabled stays
disabled even after a new version replaces it, and that survives a fresh save.
Enable it, restart the game, and run `qe24 run <alias>` again.
QE24 Twotter audit - the handles this QA round creates:
@qe24_probe: not on this save
@qe24_badrecord: not on this save
@qe24_declared: not on this save
@qe24_editor (id qe-tw-account): bio is a string (125 chars); verified yes; followers 412; following 96; joined Wed Nov 12 2025
1 of 4 handles present; 0 carrying the r31 poison shape.
A hand-crafted account with an empty avatar/banner is normal for this harness;
what matters is the bio line: 0 poisoned means search cannot hit the r31 crash here.
T-11/T-12/T-15 expect the editor's @qe24_editor to LEAVE this list once its quests finish.

--> Saved, closed game. Game log:

==============================================
  HACKHUB LOG FILE
  Started: 19/09/2026, 14:56:49
  Version: 1.3.1
  Platform: win32
  Arch: x64
==============================================


==============================================
[19/09/2026, 14:56:49] [INFO]
----------------------------------------------
Steamworks initalized: Zeis [ZF] - 76561197976480835
==============================================

==============================================
[19/09/2026, 14:56:49] [INFO]
----------------------------------------------
[WorkshopController] initialized with appId: 2980270
==============================================

==============================================
[19/09/2026, 14:56:50] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Markdown Note Editor" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:56:50] [INFO]
----------------------------------------------
[RENDERER] [Markdown Note Editor] Mod loaded.
==============================================

==============================================
[19/09/2026, 14:56:50] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "QE SDK 0.24 QA Harness" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:56:50] [INFO]
----------------------------------------------
[RENDERER] [qe24] mod loaded
==============================================

==============================================
[19/09/2026, 14:56:50] [INFO]
----------------------------------------------
[RENDERER] [qe24] HTTP host registered: qe24-http.test
==============================================

==============================================
[19/09/2026, 14:56:50] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Nemesis Protocol" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:56:50] [INFO]
----------------------------------------------
[RENDERER] [nemesis-protocol-stage1] Nemesis Protocol loaded. The mission is waiting in the HackHub feed.
==============================================

==============================================
[19/09/2026, 14:56:50] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "RetroArcade" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:56:50] [INFO]
----------------------------------------------
[RENDERER] RetroArcade v1.0.0 loaded!
==============================================

==============================================
[19/09/2026, 14:56:50] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Darknet-Tree" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:56:50] [INFO]
----------------------------------------------
[RENDERER] [darknet-tree] Darknet-Tree loaded! Check the App Store for NotePad.
==============================================

==============================================
[19/09/2026, 14:56:50] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Synthetik Wallet" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:56:50] [INFO]
----------------------------------------------
[RENDERER] [synthetik-wallet] Synthetik Wallet loaded! Find it in the App Store.
==============================================

==============================================
[19/09/2026, 14:56:50] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "GhostLink" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:56:50] [INFO]
----------------------------------------------
[RENDERER] [GhostLink] v1.0.2 loaded
==============================================

==============================================
[19/09/2026, 14:56:50] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "HackPad++" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:56:50] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "NetDesk" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:56:50] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "python-is-python3" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:56:50] [INFO]
----------------------------------------------
[RENDERER] [python-is-python3] Mod loaded! Run: apt-get install python-is-python3
==============================================

==============================================
[19/09/2026, 14:56:50] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Lockchain | Featured HackHub Mod" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:56:50] [INFO]
----------------------------------------------
[RENDERER] Lockchain Wallet mod loaded: websites, phone wallet, marketplace, miner, and isolated RPC registered.
==============================================

==============================================
[19/09/2026, 14:56:50] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "FISHCEPTION/OS" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:56:50] [INFO]
----------------------------------------------
[RENDERER] [Fishception] biological daemon loaded
==============================================

==============================================
[19/09/2026, 14:56:50] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "HackHub Beginner Handbook+" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:56:50] [INFO]
----------------------------------------------
[RENDERER] [Beginner Handbook+] Registered 109 handbook pages without title prefixes. Language: en.
==============================================

==============================================
[19/09/2026, 14:56:50] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "Lockbox 6.0" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[19/09/2026, 14:56:50] [INFO]
----------------------------------------------
[RENDERER] [vault-manager] Vault Manager loaded — password vault & sticky notes ready.
==============================================

==============================================
[19/09/2026, 14:56:50] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 97ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:56:51] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 52ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:56:51] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 53ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:56:51] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 49ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:56:52] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 49ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:56:52] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 50ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:56:52] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/stats failed after 48ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:56:52] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/announcements?limit=10 failed after 50ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:56:52] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/dlc-store/config failed after 83ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:56:52] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/polls failed after 87ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:56:52] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/actions failed after 87ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:56:52] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/pages failed after 88ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:56:52] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/featured-mods failed after 95ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:56:53] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 49ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:56:53] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 49ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:56:54] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 48ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:56:54] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/player-notifications?limit=50 failed after 47ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:56:54] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/player-notifications?limit=50 failed after 68ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:56:57] [WARN]
----------------------------------------------
[RENDERER] [Scheduler] Holding job "Queue.HandleQuestHackhubPosts": no handler registered.
==============================================

==============================================
[19/09/2026, 14:56:57] [WARN]
----------------------------------------------
[RENDERER] [PruneOrphanQuests] Dropping "QESdk024TwotterQa" (Se8JDmyGoK): no installed content defines it.
==============================================

==============================================
[19/09/2026, 14:56:57] [INFO]
----------------------------------------------
[RENDERER] [qe24] Game.SessionStarted observed
==============================================

==============================================
[19/09/2026, 14:56:57] [INFO]
----------------------------------------------
[RENDERER] [qe24] HTTP host registered: qe24-http.test
==============================================

==============================================
[19/09/2026, 14:56:57] [INFO]
----------------------------------------------
[RENDERER] [qe24] session ready: host=qe24-http.test ssid=QE24-RAW-5G
==============================================

==============================================
[19/09/2026, 14:57:39] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 113ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:57:39] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 50ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:57:40] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 49ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:57:40] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 48ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:57:41] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 62ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:57:41] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 52ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:57:41] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/stats failed after 46ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:57:41] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/announcements?limit=10 failed after 50ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:57:41] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/pages failed after 79ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:57:41] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/actions failed after 85ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:57:41] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/dlc-store/config failed after 93ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:57:41] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/featured-mods failed after 95ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:57:41] [WARN]
----------------------------------------------
[Network] GET https://gateway.hotbunny.dev/hackhub/polls failed after 98ms: ERR_BAD_REQUEST Request failed with status code 401
==============================================

==============================================
[19/09/2026, 14:57:41] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 52ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
[19/09/2026, 14:57:42] [WARN]
----------------------------------------------
[Network] POST https://gateway.hotbunny.dev/hackhub/auth/steam/challenge failed after 49ms: ERR_BAD_REQUEST Request failed with status code 429
==============================================

==============================================
  APPLICATION CLOSING
  Time: 19/09/2026, 14:57:42
==============================================
