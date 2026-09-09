# Handoff — r127

A docs round: the seven official quests Zeis transcribed
([`reference/Official-Quest/`](../reference/Official-Quest/) — "Journalist's
Sister" still pending) are read against the editor's templates, the handbook
and the SDK event catalogue. Outcome: one wrong theory corrected (template
tool responses are parse-input, the game renders its own output), every
official-quest ending mapped to a declared SDK event, and two proposals
queued for Zeis — a hydra crack → `ssh -h` → act template, and an
author-facing "official quest techniques" handbook article. No code changed.

The developer has **replied** to the bug report: almost all reported bugs
were reproduced (two weren't), fixes are promised in an upcoming patch, and
SMS is to be exposed to the SDK. The reply is **fenced** until the patch
actually ships a pinned SDK/game build that Zeis verified in-game: nothing
implements it, no workaround is removed, no doc rewritten (see the README's
"Waiting on the game patch" and the dev-promise hazard in
[`.github/agents/clean-code-architect.md`](../.github/agents/clean-code-architect.md)).
The r126 template audit it responds to lives in
[`docs/plans/r126-template-audit.md`](plans/r126-template-audit.md).

## Where things stand

- **HEAD:** `1d3e086` on `arena/01a08809-hackhub-quest-editor`, committed and
  pushed.
- **1,166 tests green** across 55 files, typecheck clean. The only noise is
  the 4 pre-existing d3-drag jsdom teardown errors, unrelated to this work.
- **Editor build stamp:** `2026-09-08.r126` — unchanged in r127; no compiled
  output was touched.
- Shared graph helpers extracted to `src/templates/kit.ts`; each template is its
  own module (`blank.ts`, `firstContact.ts`, `byline.ts`, `coldCall.ts`,
  `harbourManifest.ts`, `helpDeskLeak.ts`, `badAttachment.ts`, `coldStorage.ts`,
  `ledgerContract.ts`, `reference.ts`). `src/templates/index.ts` is a thin
  registry. `Template.difficulty` is `Beginner | Advanced | Expert | Reference`.

## Read these first, in this order

1. **[`docs/06-how-it-works-today.md`](06-how-it-works-today.md)** — how the
   editor is built now, and the five rules the codebase follows. Each rule is
   the scar of a specific bug; they are not style preferences.
2. **[`docs/In-Game-Handbook.md`](In-Game-Handbook.md)** — Zeis transcribed the
   game's entire in-game handbook by hand, 4,102 lines. **It is the highest
   authority for how a player is expected to act.** The SDK says what a mod can
   *call*; the handbook says what the game *teaches*. The previous session got
   three things wrong by consulting only the SDK.
3. **[`reference/Official-Quest/`](../reference/Official-Quest/)** — Zeis's
   transcriptions of the quests the game itself ships. The strongest cross-check
   for how real quests flow; read with
   [`docs/plans/r127-official-quest-comparison.md`](plans/r127-official-quest-comparison.md).
4. **[`docs/plans/r127-official-quest-comparison.md`](plans/r127-official-quest-comparison.md)**
   — the r127 findings and the two open proposals.
5. **[`docs/plans/r126-template-audit.md`](plans/r126-template-audit.md)** —
   what the audit found in the templates, what it fixed, and the in-game
   questions still open.
6. **[`docs/plans/r119-handbook-gap-analysis.md`](plans/r119-handbook-gap-analysis.md)**
   — what the handbook settled, and where the editor still cannot express what
   it teaches.

## The world.wifi node: hidden from authors, kept in the engine

Per Zeis's call, `world.wifi` is **removed from the authoring surface** (the
node palette, the add-node search, and the Node Reference sheet) but **kept in
the infrastructure** — the schema node, the `NODE_TYPES_REGISTRY` entry, the
compiler/runtime forward-compat branch, and the `world.wifi` compile test all
stay, so a legacy project using it still parses and compiles and a future SDK
wireless API can be wired straight back in.

Mechanism: `PALETTE_HIDDEN_TYPES` in `src/schema/registry.ts` (currently
`{ "world.wifi" }`). `paletteGroups()` filters it out; `reference.ts` mirrors the
palette by skipping hidden types. Re-enable by emptying the set (and re-adding
the `world.wifi` example in `reference.ts`).

Why: SDK 0.21.0 ships no wireless API, so the node fell back to a plain router
network and its `ssid`/`password`/`signal` were stored but not read. Worse, the
editor's own tooling (the exploitable guard and `seedRemoteFiles`) only reads a
node's nested `.device`, so a machine hosted behind a Wi-Fi node was invisible —
the one place an author could build something the editor couldn't validate. It
was that gap, not the concept, that made it feel obsolete.

## The shipped set

Difficulty is **Beginner / Advanced / Expert** — Zeis explicitly rejected a
four-tier scale. The tier describes how much the *author* must understand, not
how hard the hack is.

| Template | Tier | Situation |
|---|---|---|
| Blank | — | Empty canvas, lifecycle nodes |
| First Contact | Beginner | The whole spine: brief → one objective → payment → closing line |
| The Byline | Beginner | **Website #1:** an *ordinary* site; find a name in a blog byline, `lynx` it. Nothing hidden, no hacking |
| Cold Call | Beginner | A story told in conversation — Kisscord/WeeChat, no break-in |
| The Harbour Manifest | Advanced | The standard contract — the only template proven end-to-end in-game |
| The Help Desk Leak | Advanced | **Website #2:** the site *hides* something — `dirhunter` an unlisted page, credentials inside |
| Bad Attachment | Advanced | Phishing: a lure goes out, the reply carries the credential. All mail, no shell |
| The Ledger Contract | Expert | Long route, privilege escalation (old completion wiring kept — Zeis deferred it) |
| Cold Storage | Expert | scan edge → fern passphrase → shell → sqlmap a database |
| Node Reference | — | Every node type, annotated |

Zeis's steers, verbatim in spirit:
- **Cold Call** stays, specifically to show that a non-hacking quest is possible.
- **Two Ways Out** (the branching-ending idea) may be **morally grey** —
  authors can change it themselves. Approved but not yet built; slot it in as
  an Expert or Advanced entry.
- Two website templates, using websites in **different ways** — hence The
  Byline and The Help Desk Leak.
- Expert must be genuinely expert: multiple tools and techniques, not one
  clever trick.

**Cold Storage** models the "wireless" identity as a plain `world.network`
router (the SDK ships no wireless API) so the break-in machine is visible to
the guard's device-tree walk. Every objective waits on an event the runtime
actually emits; the wireless recon/join events are deliberately left out
because they cannot be guaranteed to fire. Its `lead_ledger` table was seeded
in r126 (r125 deferred it mid-playtest).

**Bad Attachment** runs entirely on mail events — the plan's explicitly
allowed fallback, since `Mail.registerTemplate` is not expressible in the
editor and engine-side attachment simulation is unverifiable from the SDK.

## What the handbook established (do not re-derive this)

**Phishing works, and a mod does not author the attachment.** Metasploit
generates it in-game:

```
use exploit/multi/fileformat/office_word_macro
set payload bearos/meterpreter/reverse_tcp
set LHOST <ip> / set LPORT <port>
run       # creates the malicious document
handler   # starts the listener
```

The player then delivers it by the in-game mail route, and the victim opening
it triggers the reverse TCP connection. **The listener port must be forwarded
on the router** or the payload cannot call back. Current builds also enforce
that the player actually owns a file before it can be attached.

**Suspicion is real, game-native and log-driven.** It rises from incomplete or
incorrect hacking and phishing. After getting a shell the player is expected to
find the access logs and **delete exactly the line recording their shell,
leaving the others alone** — missing logs are themselves noticed. It falls by
changing Wi-Fi network. 50% = you can be hacked back; 100% = federal seizure.
Real log paths: `/logs/accounts.log`, `/root/logs/terminal.log`.

**Router port-forwarding** is external port → internal IP → internal port, plus
an enabled flag. A rule that exists but is disabled does nothing. The firewall
sits in front of the router, which is why a connection can still fail after
"opening the port".

**Fern** derives the router interface credential *from the router model*, which
the player reads off the router's web interface in Firebear.

**The beginner workflow** the handbook teaches — and the shape a good template
should have: read the objective literally → OSINT/recon (`lynx`, `whois`,
`nslookup`, `mxlookup`, `dig`) → `nmap -sV` → match the evidence to a tool →
preserve evidence → if it does not tick, re-read the wording, because the game
wants the *specific action* named.

## Rules any new template must follow

1. **Exploitability**, enforced by `src/templates/__tests__/exploitable.test.ts`
   — any machine the player must enter needs a login service, a user with
   `acceptReverseTCP: true`, `extraAccounts: false` unless a guest is wanted,
   and **three-part port versions** (`OpenSSH 6.4.0`, never `7.2`).
2. **No node that compiles to nothing.** Handbook nodes compile since r125
   (`Handbook.open` in runFlow); the article catalogue's id=title scheme is
   still an unverified hypothesis awaiting Zeis's jump test.
3. **Never a typed IP** — use `TARGET_IP_TOKEN` (`{{data.targetIp}}`). Networks
   outlive the mod in the save; a fixed address collides with an older build.
4. **A subnet must be rooted in a ROUTER** when it has children (r77).
5. **Distinctive domains** — they are global and a generic one may collide.
6. Every quest **ends without formally completing** (engine bug, see
   `docs/04-engine-bug-quest-completion.md`) and leaves a closing line.
7. Each template states its tier and what it teaches in a sticky note.

## Queued next

1. **r127 proposals, awaiting Zeis's go** ([plan](plans/r127-official-quest-comparison.md)):
   the hydra crack → connect → act template (§6 — three in-game questions to
   settle first) and the author-facing "official quest techniques" handbook
   article (§7).
2. **When the developer's patch lands, lift the fence in this order:** pin the
   new SDK version → `npm ci` → `npm run gen:events` → diff
   `reference/hackhub-events.json` → read the new `d.ts` → Zeis verifies
   in-game → *then* plan the round (SMS editor; formal quest completion per
   `docs/04`, which would touch every template's ending and the Ledger
   deferral). Before that: nothing implements, nothing is removed.
3. **A settings page** (roadmap item 5) — the wire-physics dials live in the
   debug panel, which is a developer tool. Those and the snap/animation/physics
   toggles deserve a home an author can find. Also outstanding: the **fade-ms
   slider in the debug panel does nothing** (the fade runs inside the
   retraction, so `ghostMs` only feeds a safety backstop) — cosmetic, but a
   real inconsistency to resolve when the settings page lands.
4. **"Two Ways Out"** (roadmap item 7) — the approved branching-ending
   template, not yet built. r127 note: Cryptographer Hunt's fail-choice phone
   scene is the in-game proof this shape matters.
5. **Zeis's data requests** (nothing blocks on these): SMTP/POP3/IMAP version
   banners + ports 25/110/143; Apache metasploit module for 2.4.49/50 or
   flavour?; Handbook screenshot (titles + categories) + the id=title jump
   test; eyes on the preview. Plus the r126 in-game questions: ssh `-h` to a
   10.x box, Cold Storage's nmap/msf/sqlmap route, Cold Call's chat display —
   and r127's three (plan §6): hydra tool-response rendering, `Terminal.SSH.Shutdown`
   on mod machines, `Database.DataUpdate` from Database-Manager edits.

Done and off the queue: the editor UX check (r125), actionable hookup
warnings (r124), the template rebuild (r122), the template audit (r126).

## Working habits Zeis expects

These are standing instructions, not preferences:

- **Never guess. Check the SDK, the handbook, or the Nemesis reference mod.**
  Test hypotheses before implementing.
- **Plan first, then execute** — write the plan down, audit it, then build.
- **Falsify every guard**: revert the fix and confirm the matching test fails.
  A test that cannot fail is worse than none, and several have shipped green
  while the feature was dead.
- **jsdom lies about anything visual** — no layout, no compositor, no
  `Element.animate`, no `PointerEvent`. Say plainly what cannot be tested and
  hand it to Zeis rather than writing a test that looks like coverage.
- **Admit wrong theories plainly, with evidence.** Corrections belong in the
  docs, not quietly edited out.
- **Be concise.** Expand only where the detail is load-bearing.
- Always `git fetch` and compare against the remote before committing — the
  sandbox has rolled local history back to r74 several times, and the remote is
  authoritative.
