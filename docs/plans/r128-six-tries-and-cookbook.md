# r128: Six Tries + Quest Cookbook (both r127 proposals), and the dev response filed under a fence

Zeis approved both r127 proposals and delivered the developer's response to
our bug report. This round: file the response **fenced**, build **Six Tries**
(Proposal A), build the **Quest Cookbook** (Proposal B, on a corrected
surface), and keep every standing workaround intact. Gates at commit:
typecheck clean, **1,197 tests green** (55 files; +31 vs r127), the 4
pre-existing d3-drag jsdom teardown errors unchanged, `EDITOR_BUILD`
bumped to `2026-09-09.r128` (the shipped template set changed).

## A. The developer's response — filed, fenced

`docs/07-dev-response-mod-sdk-bug-report-response.md` is Zeis's upload,
verbatim, with a fence banner prepended. The load-bearing reading:

- **Every item was reproduced.** Three were misdiagnosed on our side: BUG 5
  is *not a bug* (declarative `QuestObjectiveDefinition.trigger` always
  worked — BUG 4's wrong payload types made our conditions read `undefined`),
  BUG 8 is deliberate engine behavior (`deleteable: true` existed but was
  missing from the SDK type), BUG 10 was Twotter/Kisscord writing
  `Date.toString()`, not mail.
- **New SDK surface is promised, not shipped**: `this.complete()`,
  `this.retire()`, `Quest.unclaim(name)`, `Twotter.updateUser/removeUser`,
  `Mail.remove(id)`, `Mail.send` returning ids, `MailDefinition.replyable`,
  `destroyNetwork → Promise<boolean>`, `NetworkFileMap.deleteable`, the
  corrected `RemoteConnectionEvent`, `Terminal.Lynx.Search` as `string`, and
  `Terminal.DnsHistory { domain, ip }`. **None of it is in the pinned SDK
  0.21.0** — verified by reading our own `d.ts`/catalogue before writing the
  banner.
- **Discrepancy flagged to Zeis**: the written response contains **no SMS
  item** (Part 3 explicitly defers only outgoing mail and Suspicion). Zeis's
  summary said SMS would be exposed; treated as a verbal promise, same fence,
  until it appears in a pinned SDK.
- **Version-string trap**: "1.1.2" does not tell you whether a fix is
  present, per the developer. Do not use it as evidence.
- Engine facts in it that are true **today** (and now recorded in HANDOFF's
  corrections block): Q3 exploitability (guest not required; online user
  suffices; `acceptReverseTCP` only gates reverse-TCP paths; error priority
  port-then-user; router accounts irrelevant), Q4 version rules (x.y.z,
  first segment nonzero, exact banner match), Q5 (`/logs/accounts.log` is on
  the player's machine; log-line-removal is undetectable), Q6 (`scp` does
  not exist; pulled files raise both `Terminal.SSH.FileDownload` and
  `Files.Transfer` — "quests that listened to only one have left players
  stuck").
- BUG 6's meterpreter-session destroy hang was **not reproduced** by the
  dev; they asked for a repro on the patched build with a public router IP.

The r126-era worry — that reading this document would tempt an instance to
implement the promises — is handled by the fence banner, the README roadmap
item 1, the agent-brief hazard ("A developer promise is not an SDK feature"),
and this plan. Nothing implements; nothing is removed.

## B. Six Tries — Proposal A, built

`src/templates/sixTries.ts`, registered as `six-tries` (Advanced), 23 nodes.
The official crack-and-log-in grammar (School Grades / Annoying Neighbor)
minus the engine-only parts:

- mail brief with **no credentials** → `lynx "Dorian Vex"` (IP line carries
  `{{data.targetIp}}`) → `nmap` (22 open ssh `OpenSSH 6.4.0`, 80 closed) →
  **hydra** (tool response keyed `inputUser: "guest"` + `inputTarget:`
  token; dataText `username:`/`password:` lines — the parser builds
  `{ credentials: { username, password } }` from exactly those keys) →
  `ssh -h guest@{{data.targetIp}}` → `cat demos-1997.txt` → `Mail.Sent` to
  the client → thanks → `fx.pay`, end-from-last-objective.
- The crack objective waits on **`Terminal.Hydra` with condition
  `credentials.username` equals `guest`** — the event only carries
  `credentials` when the run succeeded (eventDocs), so a failed crack
  cannot tick it. Dotted condition fields are supported by the runtime's
  `getPath`.
- The station: one public device (no router — this template teaches the
  crack, not topology), one explicit `guest` user, `extraAccounts: false`,
  `acceptReverseTCP: true` (keeps the exploitability guard green and leaves
  the phishing path open to authors), three-part versions, seeded
  `logs/sys.log`, the target file on the user, distinctive domain
  (`vinylgrave.net`).
- Follows all standing template rules; the sticky note states tier and what
  it teaches.

**Pins** (in `templates.test.ts`, all falsified by reverting the property —
both the hydra-keying pin and the `ssh -h` pin failed with the property
removed, passed on restore):

1. the hydra response is keyed user+target, `input` stays empty;
2. the crack objective matches `credentials.username` off `Terminal.Hydra`;
3. the login objective teaches `ssh -h guest@…`.

**In-game QA asks for Zeis** (nothing else blocks on them): does the hydra
tool response render as a real hydra run; does `Terminal.Hydra` fire with
credentials filled; does `Terminal.SSH.Connected` fire for `ssh -h` into the
mod machine; does `Terminal.Cat` fire for the remote `cat`.

## C. Quest Cookbook — Proposal B, surface corrected

r127 proposed this as an article in `handbookArticles.ts`. **That was the
wrong surface** — that file is the `fx.handbook` node's jump-target list into
the **in-game** Handbook (`Handbook.open(id)`, id=title still an unverified
hypothesis). An editor-technique article there would ship a node that opens a
page the game does not have. Corrected to the other established read-only
author surface: a **Reference-tier canvas template** like the Node Reference.

`src/templates/cookbook.ts`, registered as `cookbook` (Reference), 12
unwired `flow.note` cards, two columns. One card per official-quest
technique: briefs (mail/SMS→Kisscord), the social-media clue (Twotter stays
dropped — say why), phishing (harvester dropdown is engine UI → the
reply-carries-credential route), hydra, the FTP job, metasploit versions,
network mapping (net_tree → the whois walk), the Database-Manager edit
(`Database.DataUpdate`, verify in-game first), covering tracks (engine-side),
endings (end-from-last-objective until the patch actually ships), hand-offs
(listen to BOTH file events, per Q6). Each card names the template that
already teaches the technique.

Test-suite accommodation: the two `it.each` filters that excluded the Node
Reference by id (`t.id !== "reference"`) now exclude by
`difficulty !== "Reference"`, so the Cookbook is exempted the same way
(startability/warning tests); the "no node does nothing" skip likewise. The
registry pin asserts the full id list in chooser order.

## D. Explicitly not done (fence discipline)

- No `entry.complete` wiring anywhere, no `this.complete()` usage, no
  `replyable: true`, no Twotter node, no `Mail.remove` cleanup — none of it
  exists in the pinned SDK.
- `handbookArticles.ts` untouched.
- Harbour's `scp` hint stays as-is this round (its terminalCommand is a
  cosmetic nudge, and Harbour is Zeis's proven-in-game template — changing it
  deserves its own pass, now noted in HANDOFF's corrections block).

## E. Self-review notes

- The first pin run failed twice — both times the *assertion* was too
  literal (registry `create()` defaults `input` to `""` rather than absent;
  conditions carry `id`/`join` keys), not the template data. Fixed the pins.
- Falsification done for the two new property pins (revert → fail → restore
  → pass). The id-list pin is falsifiable by construction (it failed against
  the ten-template array before this round's edit).
- `npm test` 1,197 green; typecheck clean; `npm run build` clean (run before
  commit).
