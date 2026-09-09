# Handoff — r128

r127 compared the seven official quests Zeis transcribed
([`reference/Official-Quest/`](../reference/Official-Quest/)) against our
templates; r128 built both approved proposals: **Six Tries** (the hydra
crack → `ssh -h` route no template taught) and the **Quest Cookbook** (a
Reference sheet mapping every official-quest technique to the nodes that
express it — including the honest "engine-only" ones). The developer's reply
to our bug report arrived and is filed verbatim as
[`docs/07`](07-dev-response-mod-sdk-bug-report-response.md), **under a
fence**: it promises fixes in an upcoming patch, none of the new surface is
in the pinned SDK yet, so nothing implements it and no workaround comes off.
Read the banner at the top of docs/07 before acting on anything it says.
The r126 audit it responds to: [`plans/r126-template-audit.md`](plans/r126-template-audit.md).

## Where things stand

- **HEAD:** `cf0652b` on `arena/01a08809-hackhub-quest-editor`, committed and
  pushed (r128's own hash is recorded in its follow-up commit, the same way
  r127 did — `git log --oneline -3` is the truth).
- **1,197 tests green** across 55 files, typecheck clean. The only noise is
  the 4 pre-existing d3-drag jsdom teardown errors, unrelated to this work.
- **Editor build stamp:** `2026-09-09.r128`.
- Shared graph helpers extracted to `src/templates/kit.ts`; each template is its
  own module (`blank.ts`, `firstContact.ts`, `byline.ts`, `coldCall.ts`,
  `harbourManifest.ts`, `helpDeskLeak.ts`, `badAttachment.ts`, `sixTries.ts`,
  `coldStorage.ts`, `ledgerContract.ts`, `reference.ts`, `cookbook.ts`).
  `src/templates/index.ts` is a thin registry. `Template.difficulty` is
  `Beginner | Advanced | Expert | Reference`.

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
4. **[`docs/07-dev-response-mod-sdk-bug-report-response.md`](07-dev-response-mod-sdk-bug-report-response.md)**
   — the developer's answer to our bug report: engine facts true today (Q3
   exploitability, Q4 version format, Q6 dual file events) next to patch
   promises that are **not in the pinned SDK**. Fence banner on top; also the
   fence-lift procedure in the queue below.
5. **[`docs/plans/r128-six-tries-and-cookbook.md`](plans/r128-six-tries-and-cookbook.md)**
   — what r128 built and why Proposal B changed surface.
6. **[`docs/plans/r126-template-audit.md`](plans/r126-template-audit.md)** —
   what the audit found in the templates, what it fixed, and the in-game
   questions still open. (r127's comparison plan remains the source behind
   the cookbook.)

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
| Six Tries | Advanced | **The crack:** lynx → nmap → `hydra` → `ssh -h` with the cracked login → `cat` → report. The official quests' most common route; new in r128 |
| The Ledger Contract | Expert | Long route, privilege escalation (old completion wiring kept — Zeis deferred it) |
| Cold Storage | Expert | scan edge → fern passphrase → shell → sqlmap a database |
| Node Reference | — | Every node type, annotated |
| Quest Cookbook | — | Official-quest techniques → the nodes that express them here; read-only, new in r128 |

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

### Corrections from the developer's response (docs/07 — engine facts true today)

- **`/logs/accounts.log` is on the PLAYER's own machine**, not the target
  (Q5). Shell forensics reads `sys.log` on the compromised host. The handbook
  transcription itself may be ambiguous — it is a transcription; this note is
  the correction.
- **`acceptReverseTCP` is not checked by port exploits at all** — it only
  matters for reverse-TCP payload paths (phishing macro, mail listener). A
  guest is not required either: one user with `online: true` suffices (Q3).
  Our exploitability guard is stricter than the engine requires; that is fine
  and stays — but do not "fix" templates down to the minimum.
- **Metasploit versions**: `x.y.z`, first segment nonzero, must equal the
  banner's numeric segment exactly; nmap prints the full banner (Q4).
- **A pulled file raises TWO events** — `Terminal.SSH.FileDownload` (ssh)
  and `Files.Transfer` (download command/transfer window); quests that
  listened to only one stranded players (Q6). Listen to both.
- **`scp` does not exist in the game.** (The Harbour Manifest hint predates
  this answer from the dev — its `scp` terminalCommand is a cosmetic
  suggestion the game does not have; noted for the next Harbour round.)

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
   (The developer's reply promises a fix and `this.complete()` — fence: build
   to what ships, not what's promised.)
7. Each template states its tier and what it teaches in a sticky note.

## Queued next

1. **When the developer's patch lands, lift the fence in this order:** pin the
   new SDK version → `npm ci` → `npm run gen:events` → diff
   `reference/hackhub-events.json` → read the new `d.ts` → Zeis verifies
   in-game → *then* plan the round (formal quest completion per `docs/04`
   — which would touch every template's ending and the Ledger deferral —
   Twotter's return with `removeUser` cleanup in `OnModPackageUnloaded`,
   SMS if/when it actually appears in a pinned SDK). The dev also asked for:
   retest of the completion path + Twotter on the patched build, and a minimal
   mail repro if BUG 1 persists. Before all of that: nothing implements,
   nothing is removed.
2. **Zeis's in-game QA of the two new templates** (nothing else blocks on
   these): does the hydra tool response render as a real hydra run and fire
   `Terminal.Hydra` with credentials filled; does `Terminal.SSH.Connected`
   fire for `ssh -h` into a mod machine; does `Terminal.Cat` fire for the
   remote `cat`. Plus the carried-over questions: ssh `-h` to a 10.x box,
   Cold Storage's route, Cold Call's chat display, `Terminal.SSH.Shutdown`
   on mod machines, `Database.DataUpdate` from Database-Manager edits.
3. **A settings page** (roadmap item 5) — the wire-physics dials live in the
   debug panel, which is a developer tool. Those and the snap/animation/physics
   toggles deserve a home an author can find. Also outstanding: the **fade-ms
   slider in the debug panel does nothing** (the fade runs inside the
   retraction, so `ghostMs` only feeds a safety backstop) — cosmetic, but a
   real inconsistency to resolve when the settings page lands.
4. **"Two Ways Out"** (roadmap item 7) — the approved branching-ending
   template, not yet built. Cryptographer Hunt's fail-choice phone scene is
   the in-game proof this shape matters.
5. **Zeis's data requests** (nothing blocks on these): SMTP/POP3/IMAP version
   banners + ports 25/110/143; Apache metasploit module for 2.4.49/50 or
   flavour?; Handbook screenshot (titles + categories) + the id=title jump
   test; eyes on the preview. Plus the Harbour `scp` hint fix noted above.

Done and off the queue: the r127 proposals (both built, r128), the editor UX
check (r125), actionable hookup warnings (r124), the template rebuild (r122),
the template audit (r126).

## Working habits Zeis expects

These are standing instructions, not preferences:

- **Never guess. Check the SDK, the handbook, the official quest
  transcriptions, or the Nemesis reference mod.** Test hypotheses before
  implementing. Evidence order: SDK d.ts → handbook → Official-Quest →
  shipped/QA (each wins in its own domain).
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
- Always `git fetch` and compare against the remote before committing — Zeis
  commits to this branch too (docs/07 arrived that way in r128), and the
  remote is authoritative.
