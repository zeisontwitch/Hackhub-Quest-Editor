# Handoff — r122

The template rebuild is complete. The module architecture is in place and all
ten templates ship, including the last two (Cold Storage, Bad Attachment), which
were built this round on Zeis's call to playtest everything rather than hold
them behind the in-game verification gate.

## Where things stand

- **HEAD:** `99e9926` on `arena/01a073d6-hackhub-quest-editor`, committed.
- **1,065 tests green** (up from 1,032 — the two new templates add 33
  assertions), typecheck clean. The only noise is the 4 pre-existing
  `selectionGestures.test.tsx` d3-drag jsdom teardown errors, unrelated to this
  work.
- **Editor build stamp:** `2026-09-05.r120`.
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
3. **[`docs/plans/r117-template-rebuild-plan.md`](plans/r117-template-rebuild-plan.md)**
   — the agreed plan for the work that is next.
4. **[`docs/plans/r119-handbook-gap-analysis.md`](plans/r119-handbook-gap-analysis.md)**
   — what the handbook settled, and where the editor still cannot express what
   it teaches.

## The task in progress: rebuilding the templates

Zeis's instruction: keep **Harbour** (`data-grab`, the only template ever
proven end-to-end in-game) and **Ledger** (`contract-hack`, already fixed in
r118), delete the rest, and rebuild using what we have learned. Each template
should cover a different situation, at a stated difficulty, so authors can
reference them or start a story from one.

**Built (r122):** `blank`, `first-contact`, `the-byline`, `cold-call`,
`data-grab` (The Harbour Manifest, Advanced), `the-help-desk-leak` (the former
`dirhunter-leak` quest, re-registered), `bad-attachment` (Advanced, new),
`cold-storage` (Expert, new), `contract-hack` (The Ledger Contract, Expert),
`reference`. The four legacy templates (`hello-hack`, `wifi-hack`,
`investigation`, `dirhunter-leak`) are deleted.

**Cold Storage** was designed to satisfy the exploitable guard: it models the
"wireless" identity as a plain `world.network` router (the SDK ships no wireless
API, and `world.wifi` falls back to a router anyway) so the break-in machine —
an SSH host behind the edge — is visible to the guard's device-tree walk. Every
objective waits on an event the runtime actually emits (`Terminal.NmapScan`,
`Fern.FindPassword`, `Metasploit.Meterpreter.Connected`, `Sqlmap.DumpTable`,
`Mail.Sent`). The wireless recon/join events are deliberately left out because
they cannot be guaranteed to fire; that is the flagged playtest item.

**Bad Attachment** is pure mail: a lure goes out (`Mail.Sent`), the target's
reply is staged as a drop into the player's inbox and read (`Mail.Read`), and
the credential is forwarded. `Mail.registerTemplate` (a GoMail compose template) is
not expressible in the editor yet, and whether the engine simulates a target
opening a malicious attachment is unverifiable from the SDK, so the quest runs
entirely on mail events — the plan's explicitly allowed fallback.

### The agreed set

Difficulty is **Beginner / Advanced / Expert** — Zeis explicitly rejected a
four-tier scale. The tier describes how much the *author* must understand, not
how hard the hack is.

| Template | Tier | Situation | Status |
|---|---|---|---|
| Blank | — | Empty canvas, lifecycle nodes | keep as-is |
| **First Contact** | Beginner | The whole spine: brief → one objective → payment → closing line | replaces `hello-hack` |
| **The Byline** | Beginner | **Website #1:** an *ordinary* site; find a name in a blog byline, `lynx` it. Nothing hidden, no hacking | new |
| **Cold Call** | Beginner | A story told in conversation — Kisscord/WeeChat, no break-in | new |
| The Harbour Manifest | Advanced | The standard contract | **keep, proven** |
| **The Help Desk Leak** | Advanced | **Website #2:** the site *hides* something — `dirhunter` an unlisted page, credentials inside | rebuild |
| **Bad Attachment** | Advanced | Phishing: a lure goes out, the reply carries the credential. All mail, no shell | new, built r122 |
| The Ledger Contract | Expert | Long route, privilege escalation | keep (r118 fixed) |
| **Cold Storage** | Expert | scan edge → fern passphrase → shell → sqlmap a database | new, built r122 |
| Node Reference | — | Every node type, annotated | keep as-is |

Zeis's steers, verbatim in spirit:
- **Cold Call** stays, specifically to show that a non-hacking quest is possible.
- **Two Ways Out** (the branching-ending idea) may be **morally grey** —
  authors can change it themselves. *Not yet in the table above; it was
  approved before the tier simplification and should be slotted in as an Expert
  or Advanced entry.*
- Two website templates, using websites in **different ways** — hence The
  Byline and The Help Desk Leak.
- Expert must be genuinely expert: multiple tools and techniques, not one
  clever trick.

### Build order

1. Delete `hello-hack`, `wifi-hack`, `investigation`, `dirhunter-leak`.
2. First Contact, The Byline, Cold Call.
3. The Help Desk Leak.
4. Cold Storage.
5. Bad Attachment.
6. Gallery copy, docs, a test per template.

**Practical note for a fresh session:** `src/templates/index.ts` is already
2,100 lines and each template is several hundred more. Write each new template
as **its own module** (`src/templates/firstContact.ts`, etc.) and have
`index.ts` import it. The previous session tried to append to `index.ts` and
kept hitting the write-size limit. The shared helpers (`resetIds`, `makeNode`,
`makeEdge`, `triggerFor`, `applyLayout`) would need exporting, or extracting
into a `kit.ts`.

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
2. **No node that compiles to nothing.** Handbook nodes still do not compile.
3. **Never a typed IP** — use `TARGET_IP_TOKEN` (`{{data.targetIp}}`). Networks
   outlive the mod in the save; a fixed address collides with an older build.
4. **A subnet must be rooted in a ROUTER** when it has children (r77).
5. **Distinctive domains** — they are global and a generic one may collide.
6. Every quest **ends without formally completing** (engine bug, see
   `docs/04-engine-bug-quest-completion.md`) and leaves a closing line.
7. Each template states its tier and what it teaches in a sticky note.

## Queued after the templates

Zeis asked for these next, in order:

1. **A UX check on the editor** — a lot has been added recently and it has not
   been reviewed as a whole.
2. **Much better "something isn't hooked up" warnings** — his words: a
   red-triangle-exclamation that explains *in detail* what is wrong, what is
   missing, and which nodes to put where to fix it. Currently issues surface as
   terse badges; he wants them actionable.
3. **A settings page** (roadmap item 5) — the wire-physics dials live in the
   debug panel, which is a developer tool. Those and the snap/animation/physics
   toggles deserve a home an author can find.

Also outstanding: the **fade-ms slider in the debug panel does nothing**. The
fade now runs inside the retraction, so `ghostMs` only feeds a safety backstop.
Zeis is happy with how it looks, so it is cosmetic — but it is a real
inconsistency to resolve when the settings page lands.

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
