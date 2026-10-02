QE24 Dynamic Page Probe 1.4.0 (r250)

READ THIS FIRST - OUR MISTAKE, AND WHAT IT MEANS FOR THIS RUN
  Builds 1.0 to 1.3 sent their test mails to "player@gomail.com". That
  address is a placeholder out of this repo's own QA project and has
  NEVER EXISTED. We spent two rounds building theories about why the
  game lost those mails. It did not lose them - they were addressed
  nowhere, which is exactly what should happen.
  The rule is the ordinary one: NO to: field means the mail goes to YOU.
  So the "the to: field loses mails" result is withdrawn, and so is the
  older "a page's own permissioned call does not work" result - those
  tests used the same placeholder.
  The good news: this re-opens the question the probe was built for. We
  have still never sent a correctly-addressed mail from a page, so we do
  not actually know whether a page can act. That is what this run is for.

WHAT TO RUN (the rows that matter)
  DP-09 / DP-10   open /form and press BOTH buttons. Each now sends a mail
                  with NO to: field, so it goes to you. Earlier runs
                  concluded "a page cannot send mail" - that result is
                  void, and these two rows are the first fair test.
  DP-16           type `qedyn mail`. Three mails: one with no to: (should
                  arrive), one to your REAL address (should arrive), and
                  one to an address that does not exist (will not - the
                  question is whether the game says anything when it does
                  not).
  `qedyn inbox`   lists what the game says is in your inbox, each with its
                  to: field - a mail that is listed but not drawn is a
                  different bug from one that was dropped.

WHAT IS NEW IN 1.4.0
  - Every probe mail goes to the player (no to: field, or your real
    address), or nowhere on purpose and clearly labelled. A test now
    fails if the placeholder address ever comes back.
  - /form button A (direct) and button B (the bridge) both omit to:.

WHAT IS NEW IN 1.2.0
  - `qedyn mail` - the decisive mail test. See the section below.
  - Every command now PRINTS to the terminal as well as writing the log.
    In 1.1.x `qedyn status` looked like it did nothing because it only
    wrote to the game log.
  - `qedyn tick` takes a row NUMBER as well as a name: `qedyn tick 3`.
    In 1.1.x `qedyn tick 1` silently did nothing.


What changed since 1.0.0 (which you may have already run)
  - The beat is now fired by a TERMINAL COMMAND instead of an HTTP event.
    The old one hung off Http.Response, which never reaches a mod for its
    own site - so the beat could never fire and rows DP-06/07/08 only ever
    ran their "before" half.
  - /form now PRINTS what Mail.send returned (null = refused, an id =
    accepted). The old page threw that away and printed its own "sent".
  - /form has a SECOND button that sends through the documented workaround
    (the page only emits; a top-level listener does the real send).
  - Http.Response is now logged BEFORE any filtering, and `qedyn status`
    prints every event the mod was offered.

IF THE QUEST DOES NOT APPEAR ON THE HACKHUB FEED
  In run 2 it DID appear - on a FRESH SAVE - so try a fresh save first.
  If it still does not show: mod quest posts have been unreliable
  (docs/03 §21), and the game's own log says
  "Queue.HandleQuestHackhubPosts: no handler registered". Two ways in:
    qedyn claim                 <- type this in the in-game terminal
  or claim QEDynProbeQuest by hand from the sandbox group in the journal.
  (First check the mod loaded at all: open http://qe24-dyn.test/ - if that
  page renders, the mod is fine and it is only the feed post.)

How to run it
  1. Restart the game after installing.
  2. Claim the quest - `qedyn claim`, or the feed post if it shows, or the
     sandbox group in the journal. A mail arrives with the same
     instructions - that mail is itself part of the test.
  3. Work the quest tracker top to bottom. Rows that say WRITE DOWN need
     the exact text.
  4. When you reach DP-06, type `qedyn beat` in the in-game terminal. Then
     re-open /news (DP-07) - the UPDATE article must be on top and the old
     three drop a slot. That is the bcc.com comparison.
  5. On /form, click BOTH buttons and write down what each reports. Check
     the inbox for both mails.
  6. Finish with `qedyn status` (DP-13): it prints how many Http.Response
     events the mod was offered and every one of them. Zero is the expected
     result - write the line down anyway.

NEW IN 1.2.0 - the mail test
  Run 2 proved the page's mail is ACCEPTED (it returns a mail id) and then
  lost in delivery - it is not a permission refusal. The only mail that has
  ever arrived is the startup mail, which is also the only one WITHOUT a
  to: field. So:
    qedyn mail
  sends two mails from the terminal - one WITH to: and one WITHOUT - and
  prints both ids. Check which one lands in the inbox.

The terminal command
  qedyn claim             claim the quest without the feed
  qedyn beat              fire the quest's beat (DP-06)
  qedyn mail              send the three test mails (see above) (DP-16)
  qedyn inbox             list what the game says is in your inbox (DP-17)
  qedyn status            print everything the probe recorded (DP-13)
  qedyn tick <row>        check a row off by hand - a NUMBER or a name:
                          qedyn tick 3
                          qedyn tick dp-05-news-before
                          (most rows cannot tick themselves - Http.Response
                          never reaches the mod, by design or by bug)

The site: http://qe24-dyn.test

Cleanup
  The quest is abandonable. Abandoning it and removing the mod folder
  takes the site and the feed post with it.
