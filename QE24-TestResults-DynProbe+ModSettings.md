As always, fresh save, no mods.



# r239 - Mod Settings

Quick explanation of the layout of the game:

When you start the game, you're presented by the main menu. Here you can choose to load a save, start a new game, switch to Multiplayer mode, go into the games' settings, and access the mod list - the mod list contains all currently installed mods from the Steam Workshop, it also has a second tab for Local Mods (which is what we've been using), as well as tabs for publishing your own mods onto the Steam Workshop.

In-Game, there is another "Settings", which opens like an app or program. Not on the phone, on the desktop. The phone, however, has its own "Settings" Phone-App as well.

The In-Game Settings Program mostly simulates what a real PC OS settings would show; it lets the player change the wallpaper, the current desktop theme, various colours, desktop options like icon size, search bar visibility, 24-hour format, showing seconds, "Show in-game date and time (The clock follows the world's own calendar, which runs faster than real time. Turn this off to see your computer's real clock instead.". The player can also connect and disconnect from the in-game wifi networks, change how the terminal presents itself, notification settings and sounds.

TL;DR:
Main Menu Settings -> Settings for the game
In-Game Settings -> Settings for the in-game computer OS 

In-Game Phone Settings -> Simulates a phone's settings (airplane mode, wifi, bluetooth, personal hotspot, etc.)

---

## MS-01

Located in the Main Menu Settings -> Mods -> Tiny little grey "Settings" word that opens the mods' own settings. Not accessible in-game. See screenshots.

## MS-02 - Mostly Green

Both toggles render as they should, one off, one on, and I can flick them on/off.

The text field lets me type whatever.

The number field displays far too many underscores, but I can change the number here with the arrow keys without an issue. I assume the UI breaking underscores are a result of not limiting the available numbers to something more reasonable (might be worth a bug report to the dev)

Slider steps in 5-increments between 0-100.

## MS-03 - Green

Yes, they all start with "Probe:". There is no colour visible, it simply says the word "Blue" or "Violet" or whatever. Best personal guess: maybe this hooks into the in-game OS themes, which can be changed and have different colours.

## MS-04 - Green

See MS-02 and MS-03

## MS-05 - Green?

Full log **BEFORE** restart:

```
==============================================
 HACKHUB LOG FILE
 Started: 28/09/2026, 16:16:17
 Version: 1.3.13
 Platform: win32
 Arch: x64
==============================================

==============================================
[28/09/2026, 16:16:17] [INFO]

---

Steamworks initalized: Zeis [ZF] - 76561197976480835

==============================================
[28/09/2026, 16:16:17] [INFO]

---

[WorkshopController] initialized with appId: 2980270

==============================================
[28/09/2026, 16:16:18] [WARN]

---

[RENDERER] [ContentSDK] Mod "QE24 Dynamic Page Probe" uses API v1 (current: v2). Running in compatibility mode.

==============================================
[28/09/2026, 16:16:18] [INFO]

---

[RENDERER] [qe-sdk-024-modsettings-v2] MS-load 1: {"probe.toggle_on":true,"probe.toggle_off":false,"probe.select":"blue","probe.text":"hello probe","probe.number":7,"probe.slider":50}

==============================================
[28/09/2026, 16:18:06] [WARN]

---

[RENDERER] [Scheduler] Holding job "Queue.HandleQuestHackhubPosts": no handler registered.

==============================================
[28/09/2026, 16:18:06] [WARN]

---

[RENDERER] [PruneOrphanQuests] Dropping "QEModSettingsProbeQuest" (xvWyYVWfyO): no installed content defines it.

==============================================
[28/09/2026, 16:18:28] [INFO]

---

[RENDERER] [qe-sdk-024-modsettings-v2] QEModSettingsProbeQuestV2 started - MS-readback at claim: {"probe.toggle_on":false,"probe.toggle_off":true,"probe.select":"violet","probe.text":"typing something here","probe.number":1,"probe.slider":80}
```



## MS-06 - Maybe Green?

Full Log **AFTER** restart (I never abandoned the quest, so there's nothing to reclaim as it was still active):

```
APPLICATION CLOSING
 Time: 28/09/2026, 16:33:44
==============================================

==============================================
 HACKHUB LOG FILE
 Started: 28/09/2026, 16:33:58
 Version: 1.3.13
 Platform: win32
 Arch: x64
==============================================

==============================================
[28/09/2026, 16:33:58] [INFO]

---

Steamworks initalized: Zeis [ZF] - 76561197976480835

==============================================
[28/09/2026, 16:33:58] [INFO]

---

[WorkshopController] initialized with appId: 2980270

==============================================
[28/09/2026, 16:33:59] [WARN]

---

[RENDERER] [ContentSDK] Mod "QE24 Dynamic Page Probe" uses API v1 (current: v2). Running in compatibility mode.

==============================================
[28/09/2026, 16:33:59] [INFO]

---

[RENDERER] [qe-sdk-024-modsettings-v2] MS-load 1: {"probe.toggle_on":false,"probe.toggle_off":true,"probe.select":"violet","probe.text":"typing something here","probe.number":1,"probe.slider":80}

==============================================
[28/09/2026, 16:34:04] [WARN]

---

[RENDERER] [Scheduler] Holding job "Queue.HandleQuestHackhubPosts": no handler registered.
```

## MS-07

No, there's no (exposed) way to reset options to the baseline

---

# r238 Dynamic Pages

Note: I did not have the QA harness installed, only `qe-sdk-024-dynprobe-1.0.0` and `qe-sdk-024-modsettings-v2-1.0.0`

I went through this test from top to bottom, so the following is also an exact timeline of my actions.

## DP-01

Opened `http://qe24-dyn.test/` and am presented with a blank white page with black text (looks like a typical error webpage sans any error code, purely speaking of the look here) that reads:

```
# Static control

This is the only page on this site that is the same for everyone, every time. Every other page is printed on the spot for each visit.

Site-export call from a static page: Greetings, tester - site-level export
```

The quest objective does not check itself off.

## DP-02

Opened `http://qe24-dyn.test/echo?msg=zeis` and another white page loads. It reads:

```
# Echo
You asked for: zeis

Raw PageContext the game passed to this page (question 1 evidence):

{
  "url": "http://qe24-dyn.test/echo?msg=zeis",
  "params": {},
  "query": {
    "msg": "zeis"
  },
  "allKeys": [
    "url",
    "params",
    "query",
    "searchStr"
  ]
}
```

The quest objective does not check itself off.

## DP-03

Opened `http://qe24-dyn.test/article/1` - another blank page with black text:

```
# Article one: the lighthouse ledger
The keeper's ledger lists three ships that never arrived.

params as passed:

{"id":"1"}
Other articles: 1 2 3 - try 99 (should not exist).
```

1, 2, 3, 99 are all links. I have not clicked any of them yet. No quest objective checked itself off.

## DP-04

I click on the "99" link instead of entering the URL manually, and get a proper

"404
This site cannot be reached

Firebear can't find the server at "https://qe24-dyn.test/article/99""

Error message. The error message site is black with white text. No quest objective checks itself.

## DP-05

Opened `http://qe24-dyn.test/news` for the first time - it reads:

```
# QE24 News
Visits to this page this session: **2**

1. Top story: harbour cranes back in service after the long repair
2. City council votes to extend the night market through the weekend
3. Local chess club's underdog wins the regional cup
After the quest's beat fires (first /state visit), a new article appears on top and these drop one slot - compare with bcc.com's front page.
```

No objective's check themselves off.

## DP-06

Opened `http://qe24-dyn.test/state` for the first time - it reads:

```
# State page
Phase: **claimed**

Visits to this page this session: **2**

If you have visited this page before and the number did NOT go up, the game served a cached copy (question 3).
```

No objective's check themselves off.

## DP-07

Opened `http://qe24-dyn.test/state` again - it reads:

```
# State page
Phase: **claimed**

Visits to this page this session: **4**

If you have visited this page before and the number did NOT go up, the game served a cached copy (question 3).
```

No objective's check themselves off.

## DP-08

Opened `http://qe24-dyn.test/news` again - it reads:

```
# QE24 News
Visits to this page this session: **4**

1. Top story: harbour cranes back in service after the long repair
2. City council votes to extend the night market through the weekend
3. Local chess club's underdog wins the regional cup
After the quest's beat fires (first /state visit), a new article appears on top and these drop one slot - compare with bcc.com's front page.
```

No objective's check themselves off.

## DP-09

Opened `http://qe24-dyn.test/form` - it has one button and reads:

```
# Talk-back form
HackhubSDK global in this iframe: yes

[Send the mail from this page]
Result: not sent yet

The quest has an objective for the mail this sends - if the button works, that objective ticks.
```

I click the button and the result changes to:

`Result: sent (no error thrown)`

No objective's check themselves off.

## DP-10

Opened `http://qe24-dyn.test/exports?article=2` for the first time - it reads:

```
# Per-page exports
What currentArticle() (this page's own export, built from the request you just made) says: article-2
```

No objective's check themselves off.

## DP-11

Opened `http://qe24-dyn.test/site-exports` for the first time - it reads:

```
# Site exports, dynamic page
dynGreeting from a dynamic page: Greetings, zeis - site-level export
```

No objective's check themselves off.

---

I log out and close the game. Full Game-Log:

```
==============================================
  HACKHUB LOG FILE
  Started: 28/09/2026, 16:33:58
  Version: 1.3.13
  Platform: win32
  Arch: x64
==============================================


==============================================
[28/09/2026, 16:33:58] [INFO]
----------------------------------------------
Steamworks initalized: Zeis [ZF] - 76561197976480835
==============================================

==============================================
[28/09/2026, 16:33:58] [INFO]
----------------------------------------------
[WorkshopController] initialized with appId: 2980270
==============================================

==============================================
[28/09/2026, 16:33:59] [WARN]
----------------------------------------------
[RENDERER] [ContentSDK] Mod "QE24 Dynamic Page Probe" uses API v1 (current: v2). Running in compatibility mode.
==============================================

==============================================
[28/09/2026, 16:33:59] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-modsettings-v2] MS-load 1: {"probe.toggle_on":false,"probe.toggle_off":true,"probe.select":"violet","probe.text":"typing something here","probe.number":1,"probe.slider":80}
==============================================

==============================================
[28/09/2026, 16:34:04] [WARN]
----------------------------------------------
[RENDERER] [Scheduler] Holding job "Queue.HandleQuestHackhubPosts": no handler registered.
==============================================

==============================================
[28/09/2026, 16:40:19] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-modsettings-v2] QEModSettingsProbeQuestV2 abandoned
==============================================

==============================================
[28/09/2026, 16:42:36] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-dynprobe] QEDynProbeQuest started
==============================================

==============================================
[28/09/2026, 16:47:04] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-dynprobe] article hit: id=1
==============================================

==============================================
[28/09/2026, 16:47:05] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-dynprobe] article hit: id=1
==============================================

==============================================
[28/09/2026, 16:48:59] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-dynprobe] article miss: id=99 -> null (404?)
==============================================

==============================================
[28/09/2026, 16:49:00] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-dynprobe] article miss: id=99 -> null (404?)
==============================================

==============================================
[28/09/2026, 16:50:52] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-dynprobe] news visit 1
==============================================

==============================================
[28/09/2026, 16:50:52] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-dynprobe] news visit 2
==============================================

==============================================
[28/09/2026, 16:53:30] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-dynprobe] state visit 1 (phase=claimed)
==============================================

==============================================
[28/09/2026, 16:53:30] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-dynprobe] state visit 2 (phase=claimed)
==============================================

==============================================
[28/09/2026, 16:54:44] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-dynprobe] state visit 3 (phase=claimed)
==============================================

==============================================
[28/09/2026, 16:54:44] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-dynprobe] state visit 4 (phase=claimed)
==============================================

==============================================
[28/09/2026, 16:58:03] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-dynprobe] news visit 3
==============================================

==============================================
[28/09/2026, 16:58:04] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-dynprobe] news visit 4
==============================================

==============================================
[28/09/2026, 17:07:32] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-dynprobe] currentArticle() called with id=2
==============================================

==============================================
  APPLICATION CLOSING
  Time: 28/09/2026, 17:10:17
==============================================

==============================================
  APPLICATION CLOSING
  Time: 28/09/2026, 17:10:17
==============================================

```


