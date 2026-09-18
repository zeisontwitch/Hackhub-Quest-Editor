# Official Game Changelog for Patch 1.3.0

This update gives the game world a clock of its own, and closes out most of the save file problems you have been reporting. Thanks to everyone who sent repro steps and save files: the worst bug in here was only findable because of them.

## New

Added an in-game clock: the game world now runs on its own calendar, considerably faster than real time. It drives the day system and everything that waits on time passing.

The taskbar clock can show your computer's real time instead. Settings > Desktop > Clock.

Added a calendar and a countdown to the next scheduled event to the taskbar clock, with a Wait button that skips ahead to it.

Added a summary screen after waiting, listing the mail, messages and notifications that arrived while time passed. Notification sounds are held during the skip.

Added a new terminal command, curl, for fetching pages and sending requests. Supports methods, headers and request bodies.

Added folder support to download, in the terminal and in Meterpreter sessions.

Added path support to mkdir, including folder names containing spaces.

Added signal strength in dBm and a WPS column to Wi-Fi scans, alongside real 2.4 GHz and 5 GHz channels.

Added rssi and wps to Wi-Fi scan results in Node scripts.

Added an in-game confirmation dialog to New Game, with Cancel as the default.

## Change

lynx now accepts a Twotter handle with or without the @, names with different spacing or capitalisation, and website addresses.

Redesigned the tutorial tours: they follow the desktop theme, show a step counter, and allow going back or skipping. Steps that require a click no longer cover their target.

Widened the scrollbars in the Terminal, the objectives panel, the browser and around fifteen other apps to make them easier to grab.

The pfSense destination field and the router's local IP field now distinguish an invalid address from a valid one that is not on your network.

## Fixes

Fixed an issue that caused every file on the player's machine to be deleted when a file downloaded from an email was deleted, leaving the save unable to load.

Saves already in that state are repaired on load. Files that were already deleted cannot be recovered.

Fixed an issue that allowed the top level of the file system to be deleted, including by emptying the recycle bin.

Fixed a crash in the File Explorer when opening a folder that no longer exists.

Fixed an issue that caused cloud sync to replace Steam Cloud saves with an empty state on a fresh install, or after a launch where no save was loaded.

Fixed an issue that caused a sync from an older session to overwrite newer progress uploaded from another PC.

Fixed an issue that caused saves stored only on another PC to be dropped during a sync.

Fixed an issue that caused a failed cloud import to upload over the cloud backup it was restoring from.

Fixed an issue that caused phone calls to freeze partway through, requiring a return to the main menu.

Fixed an issue that prevented dialog options in phone calls from triggering the actions that follow them.

Fixed an issue that caused Competitor Sabotage and The Giga Leak to grant no reward on completion.

Fixed an issue in The Journalist's Sister that prevented Part 8's final objective from completing when signing into Ethan's mailbox without decoding his token, locking Part 9.

Fixed broken spacing and garbled company names in a The Journalist's Sister finance document in Japanese and Korean.

Fixed two soft-locks in Database Theft: a briefing mail that could fail to arrive, and a client who stayed silent if the game was quit immediately after adding them.

Fixed a broken tag in the Is host working? briefing mail that could mangle the target domain.

Fixed an issue that caused delayed mail and job applications to be lost on quit, or to arrive in the wrong save.

Fixed an issue that caused objectives to stop responding, or to respond twice, after returning from the main menu.

Fixed a freeze on the final objective of quests added by content packs.

Fixed an issue that left an abandoned content pack quest in the quest list, unfinishable after a reload.

Fixed an issue that allowed a content pack to break Twotter permanently, taking the site down when searching for people.
Affected saves are repaired on load.

Fixed an issue that caused explorer in a Meterpreter session to open the file browser of the machine the player pivoted from.

Fixed an issue that caused lynx to report no data for a target it had just found.

Fixed an issue that caused scripts running several commands at once to receive all of their output combined.

Fixed an issue that caused mkdir with a path to create a single folder that could not be opened or deleted.

Fixed an issue that stopped scripts after the first prompt, preventing the later steps of Make Your Own Nmap from being completed. The tutorial text has been corrected as well.

Fixed an issue that caused imports to resolve to the wrong file when two folders held the same filename. Folder imports are now supported.

Fixed an issue in Code++ that flagged imports from other folders as errors. Types now also update as you type, without saving first.

Fixed an issue that caused a command to keep returning stale data after newer data had been written for it.

Fixed the Wi-Fi scan table showing one signal strength for every network, signal bars under the WPS column, and random characters in place of the channel.
Networks in existing saves are corrected on load.

Fixed an issue that caused the phone hotspot to report an invalid Wi-Fi channel.

Fixed invalid Wi-Fi channels in multiplayer sessions.

Fixed an issue that caused a deleted loot file to return on the next sync or reconnect.

Fixed an issue that caused loot moved out of Downloads into a folder to disappear on the next join.

Fixed an issue that caused overwriting a file in FileGorilla to destroy an owned item with the same name.

Fixed an issue that caused downloading a folder to produce an empty copy.

Fixed the multiplayer connection error showing an internal address instead of explaining what was blocking the connection.

Fixed the missing search box on Twotter's Explore page on smaller windows.

Fixed an issue that positioned modals such as the LCB registration form partly off screen on long pages.

Fixed an issue that prevented navigating to the current address from reloading the page, leaving a blank page after some form submissions.

Fixed untranslated text appearing briefly on startup.

Fixed an issue that caused manually created port forwarding rules to omit the service and version, leaving scan columns blank and causing Metasploit to reject the port.

Fixed an issue that caused the Reply button to appear on completed quest mail.

# Official Game Changelog for Patch 1.3.1
(Zeis' Note: I left out the multiplayer-specific changes as they're irrelevant for us. Left the Fixes section as is - openvpn is a multiplayer-only feature)

A smaller update focused on multiplayer and on the save problems some of you ran into after 1.3.0. Two story soft-locks in The Journalist's Sister are closed as well.

## New

Added incognito windows to Firebear. Sign-ins and cookies from an incognito window are dropped when you close it and are never written to your machine.
Singleplayer only. Site accounts in a shared world cannot be kept private.

Added the declared permissions of each local mod to its card on the Mods page, with a warning on mods that declare none and can therefore use everything.

Added settings and enable/disable buttons to Workshop mod cards.

## Fixes

Fixed an issue that caused the game to load a blank save while a played save was available, which was reported as lost progress after an update, after a cloud import, or after creating a new game and closing before playing it.

Fixed an issue that caused a cloud import to switch to a save that was not part of that import.

Fixed story quest objectives completing during multiplayer sessions, along with their completion sounds and notifications.

Fixed story quest phone calls coming in during multiplayer sessions.

Fixed an issue that allowed the Hackhub job board's Apply button to claim singleplayer jobs during a multiplayer session.

Fixed quest data being written into multiplayer saves.

Existing multiplayer saves are cleaned up on load.

Fixed singleplayer desktop alerts, such as jobs waiting and quests to hand in, appearing on entering a multiplayer world.

Fixed job board quest posts still appearing in the Hackhub feed in multiplayer.

Fixed an issue in The Journalist's Sister Part 8 that left the quest unwinnable if the request log was emptied rather than deleted, as it holds the only record of Ethan's IP.

Emptied logs are refilled on load.

Fixed an issue in The Journalist's Sister Part 10 that completed the listener objective when nothing was actually listening, leaving the quest stuck once the payload had been mailed.

Both steps are handed back so the listener can be restarted and the mail resent. Already stuck saves recover on load.

Fixed an issue that prevented the compose window for Andrea's mail from reopening after a reload.

Fixed an issue that caused openvpn to reject a phished VPN profile that had been copied with cp rather than pulled through a meterpreter session.
