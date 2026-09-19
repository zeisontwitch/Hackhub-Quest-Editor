# GENERAL QA NOTES

Steam:
App ID: 2980270
Build ID: 25388883

- Every test is done on a clean save and reset to the clean save after the test is done. Please tell me if you want me to keep a save instead.
- In my local mod folder from the sdk-0.24-qa folder: editor-export, mod

---

Zeis~$[/home/Zeis] qe24 extras on
Registered: start-menu item (section bottom); desktop widget 320x180 at 40,40 from widgets/qe24-widget.html; right-click items (target file and target desktop); language bundles (en, de).
QE24 extras registered - what the game reports it has now:
start-menu items: 1 [QE24 Extras]
desktop widgets: 1 [qe24-extras-widget]
right-click on a file: 1 [QE24: inspect this file]
right-click desktop: 1 [QE24: desktop action]
Now look: the start menu (bottom section), the desktop, right-clicking a file and the
empty desktop. Then run `qe24 extras lang` and paste that block too.

Zeis~$[/home/Zeis] qe24 extras lang
QE24 extras lang - Localization in this build:
language(): en
languages(): ar, bg, cs, da, de, el, en, es-ES, es, fi, fr, hu, id, it, ja-JP, ko-KR, nl, no, pl, pt-BR, pt, ro, ru, sv, th, tr, uk, vi, zh-Hant-TW, zh
we registered: yes (en, de; keys qe24.hello and qe24.vars)
t("qe24.hello"): Hello from the QE24 harness.
t("qe24.vars", {who: "QE24"}): Harness speaking: QE24.
t("qe24.absent"): qe24.absent
Reading: a translated line proves t() resolves; a missing key echoing its own name is
the SDK's documented fallback, and a blank line there would be worth filing.

Zeis~$[/home/Zeis] qe24 extras off
Unregistered the QE24 extras. The language bundles stay - the SDK has no
unregister for them, and a handful of strings is harmless.
QE24 extras after off - what the game reports it has now:
start-menu items: 0 [empty]
desktop widgets: 0 [empty]
right-click on a file: 0 [empty]
right-click desktop: 0 [empty]
What matters: the start-menu entry, the widget and both right-click entries are gone.

Zeis~$[/home/Zeis] 

# T-16

--> Opened in-game start menu, there is nothing from QE24 here, it's the normal start menu with the normal apps

# T-17

There is no Desktop icon or widget. See Screenshot-1

# T-18

--> Created a new text file on desktop. Right-click on it shows the standard menu with nothing new in it, nothing from QE24.

# T-19

See above

---

--> You told me to do all of this in this very specific order, so I did. But I assume `extras` have to be set to `on` for any of this to work, so I re-activated that and checked it all again:

Top-Left now shows black text with transparent background, and opening right-click menu on new text file shows "QE24 Inspect This" at the bottom of the menu (see Screenshot-2).

Start menu still doesn't show anything new.