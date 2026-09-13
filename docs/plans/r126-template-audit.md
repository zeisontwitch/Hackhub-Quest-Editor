# r126: template audit (+ Zeis's follow-up fixes)

Two halves, one round. First, four follow-up fixes from Zeis's r125 check
(items a–d below, written up after the fact). Then the full template audit:
every shipped template read as a player would play it, verifying each
objective, trigger, payment and closing line against the SDK, the handbook
and the engine behaviour recorded in the docs.

## A. Follow-up fixes (build notes, written after)

- **(a) Event explanations.** The generator's last-doc-comment regex
  (`reference/generate-event-catalogue.mjs`) matched too greedily; fixed and
  regenerated (92 events, one doc line corrected). New `eventDocs.ts` gives
  every event a plain-language explanation, shown in the EventPicker —
  including the primitive-payload cases the SDK types wrong.
- **(b) Token picker seating.** The insert panel now re-seats on outside
  scroll and ignores scrolls inside itself.
- **(c) Firewall meanings.** `meaning?` on selectOrCustom options: the
  source `*` and protected-IP tokens explain what they produce, with a
  custom-box caption and a "Use … instead" path back.
- **(d) Firewall/port defaults.** `create()` defaults the firewall IP and
  rule destination to the random-machine token; same-as stays disabled with
  an `emptyHint` while the protected IP is empty, plus a write guard.

All four verified with targeted suites + tsc; (a), (b) and (d) falsified
((c) was not separately falsified — recorded, not hidden).

## B. Template audit

Machine pass first (computeWarnings + analyseGraph + field warnings per
template), then a semantic read of all eight playable templates.
Harbour/ledger were read for grounding only — Zeis deferred ledger changes.

**Stories that could not end (fixed):**

- Four templates wired payments/closings to `entry.complete`, which never
  fires with the defaults (auto-complete off, no Complete button — and
  completing freezes the game, docs/04). First Contact never paid at all.
  All rewired to end from the last objective; blank no longer ships the
  node. (Ledger still has the old wiring — deferred per Zeis.)
- Cold Storage's database had no tables, so its read-ledger trigger
  (`tableName` contains "ledger") could never fire — the quest stuck
  mid-way. Seeded `lead_ledger` with the four routes the thank-you mail
  names. (r125 deferred this mid-playtest; the audit un-deferred it —
  flagged to Zeis in case his run is still going.)
- Help Desk's client confirmed receipt of a file the player never sent.
  Added the missing `send-report` objective (Mail.Sent), which also makes
  the scene's "Upload complete" / "Got it." lines true.
- Help Desk taught `ssh user@ip`; the handbook documents `ssh -h user@ip`
  in three places. Now matches the handbook.

**Product fixes the audit forced:**

- The `entry.complete` palette blurb said "Rewards go here" — the lie that
  broke the four templates. Now states the completion gating.
- The Dead-end warning claimed a wrong reply "stalls" the quest; it just
  re-prompts. Copy fixed for reply nodes.
- New analysis rule: a wired `entry.complete` warns ("Only runs on
  completion"). Falsified.
- The runtime passed database rows to the engine raw; the SDK's cell shape
  is `{ value, type }` and nothing "typed cells" despite the schema comment
  saying so. The runtime shapes them now. Falsified.

**Smaller content fixes:** Cold Call names Zara in the chat (the answer was
only in the contact id); Bad Attachment's target no longer instructs a
follow-up mail the quest abandons; Cold Storage's postgres moved 3306 → 5432
(3306 is MySQL, per our own port presets); Byline typo ("a hour"); the
help-desk page-library entry is now unlisted like the site version.

**Deliberately not changed:** Cold Call's unwired "Wrong" outcome (retry is
the design — the fixed warning now says so); Bad Attachment doesn't verify
mail content (matching player-composed mail on an exact string fails typo'd
quests silently — trusting the player is safer); No `Mail.registerTemplate`
(nothing emits it); the shared-domain warning on `naza.gov` (accurate and
advisory — and `naza.gov` is the intentional community-site rebuild, not a
typo of `nasa`).

**False alarms, with evidence:** `query`-on-primitive Lynx.Search conditions
(the runtime's `fieldOf` resolves any field to a primitive payload — the
comment cites the exact QA case); lynx quote handling (`loose()` strips
quotes both sides, and Harbour ships the same pattern tested).

## Questions for Zeis (in-game; nothing here blocks the round)

1. Help Desk: does `ssh -h t.reyes@10.10.4.7` connect from the player
   terminal — and is `-h` required, or does the bare form work?
2. Cold Storage: does `nmap 10.11.4.27 -sV` show the scripted answer (input
   matching with flags)? Does metasploit reach .27, and can sqlmap dump
   `lead_ledger` — from the player box or only in-session?
3. Cold Call: does the Kisscord chat show the `zara_v` contact, and does the
   WeeChat server join with the guest password?
4. r125 data still owed: SMTP/POP3/IMAP version banners + ports 25/110/143;
   Apache metasploit module for 2.4.49/50 or flavour? Handbook screenshot
   (titles + categories) + the id=title jump test. Eyes on the preview.

## Guards

- New: "no template wires entry.complete" (contract-hack exempted with the
  deferral noted), Cold Storage table + trigger agreement, postgres port,
  Help Desk send-before-scene, ssh `-h` form, Zara-in-chat; graph rule +
  reply-copy tests; database cell-shape test; the dirhunter playthrough now
  sends the mail before expecting the scene (and asserts the download alone
  pays nothing).
- Falsified: completion rule, cell shaping, table pin.
- Full suite green + tsc clean; EDITOR_BUILD `2026-09-08.r126`.

## Build notes (written after, not planned before)

- **Parallel same-file edits race.** Several `edit_file` calls issued in one
  block to the same file silently lost all but one edit, and once left a
  duplicated tail. From here on: one edit per file per block, then verify
  with `git diff`.
