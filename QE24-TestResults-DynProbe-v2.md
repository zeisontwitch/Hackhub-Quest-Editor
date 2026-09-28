As always, fresh save, no mods. I'm testing everything in the order you see here, from top to bottom, so this serves as a timeline of my actions too.

Opened ``http://qe24-dyn.test/` to see whether the static page renders. The page that loads has a white background and black text:

```
# Static control
This is the only page on this site that is the same for everyone, every time. Every other page is printed on the spot for each visit.

Site-export call from a static page: Greetings, tester - site-level export
```

---

## DP-02

Went to `http://qe24-dyn.test/echo?msg=zeis` - it reads:

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

The quest objective doesn't tick.

## DP-03

Went to `http://qe24-dyn.test/article/1` it shows:

```
# Article one: the lighthouse ledger
The keeper's ledger lists three ships that never arrived.

params as passed:

{"id":"1"}
Other articles: 1 2 3 - try 99 (should not exist).
```

The quest objective doesn't tick.

## DP-04

Clicked on the 99 link and got a browser-made 404 page.

The quest objective doesn't tick.

## DP-05

Went to `https://qe24-dyn.test/news` for the first time - it shows:

```
QE24 News
Visits to this page this session: 2

1. Top story: harbour cranes back in service after the long repair
2. City council votes to extend the night market through the weekend
3. Local chess club's underdog wins the regional cup
After the quest's beat fires (first /state visit), a new article appears on top and these drop one slot - compare with bcc.com's front page.
```

## DP-06 - Green

Typed `qedyn beat` into the terminal. The game log reads:

```
==============================================
[28/09/2026, 20:54:18] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-dynprobe] command: beat fired
==============================================
```

The quest objective doesn't tick.

## DP-07 - Green

Refreshed the news page, it now reads:

```
QE24 News
Visits to this page this session: 4

1. UPDATE: probe quest beat fired - this article just appeared on top
2. Top story: harbour cranes back in service after the long repair
3. City council votes to extend the night market through the weekend
4. Local chess club's underdog wins the regional cup
After the quest's beat fires (first /state visit), a new article appears on top and these drop one slot - compare with bcc.com's front page.
```

The quest objective doesn't tick.

## DP-08 - Green

Opened `https://qe24-dyn.test/state` for the first time - it shows:

```
State page
Phase: beat-fired

Visits to this page this session: 2

If you have visited this page before and the number did NOT go up, the game served a cached copy (question 3).
```

Refreshed the page, it now shows:

```
State page
Phase: beat-fired

Visits to this page this session: 4

If you have visited this page before and the number did NOT go up, the game served a cached copy (question 3).
```

The quest objective doesn't tick.

## DP-09

Opened `https://qe24-dyn.test/form` - it shows:

```
Talk-back form
HackhubSDK global in this iframe: yes

Button A - direct call from page script
[Send directly from this page]
Returned: not tried yet

Button B - the Events.emit bridge (the workaround)
[Send through the bridge]
Result: not tried yet

Then check the inbox (and the log) for BOTH mails, and type qedyn status in the terminal.
```

I click on Button A:

`Returned: yD1oMYYHUX (null = refused, an id = accepted)`

No mail arrives, no quest objective ticks.

## DP-10

Still on the same page as DP-09, I now click Button B:

`Result: emitted - the listener logs what Mail.send returned`

No mail arrives, no quest objective ticks.

## DP-11

Opened `https://qe24-dyn.test/exports?article=2` - it shows:

```
Per-page exports
What currentArticle() (this page's own export, built from the request you just made) says: article-2
```

The quest objective doesn't tick.

## DP-12

Opened `https://qe24-dyn.test/site-exports` - it shows:

```
Site exports, dynamic page
dynGreeting from a dynamic page: Greetings, zeis - site-level export
```

The quest objective doesn't tick.

## DP-13

Typed `qedyn status` into a terminal:

```
Zeis~$[/home/Zeis] qedyn status
Zeis~$[/home/Zeis] 
```

It doesn't show anything there. You probably wanted me to check the game log even though you said "it prints", meaning it should show in the Terminal. So I checked the game log anyways:

```
==============================================
[28/09/2026, 21:10:48] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-dynprobe] status: phase=beat-fired beatFired=true beatSource=qedyn beat stateVisits=4 newsVisits=4 mailDirect=(not tried yet) mailBridged=ra1DgwPOsB
==============================================

==============================================
[28/09/2026, 21:10:48] [INFO]
----------------------------------------------
[RENDERER] [qe-sdk-024-dynprobe] status: Http.Response events offered to this mod: 0
==============================================

```

## Housekeeping

I tried using `qedyn tick 1` and 2, 3, 4 - but the command doesn't seem to do anything. No quest objectives tick.

And yes - on a fresh save, the  quest appeared on the Hackhub feed.
