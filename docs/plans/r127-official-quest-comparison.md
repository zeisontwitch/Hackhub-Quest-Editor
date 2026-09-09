# r127: official quests vs. our templates — comparison and proposal

Zeis hand-transcribed the first seven quests the main game ships with
([`reference/Official-Quest/`](../../reference/Official-Quest/), "Journalist's
Sister" still pending). This round reads all seven against the editor's
templates, the handbook and the SDK event catalogue, and ends in two
proposals. **Docs-only round: no code changed, `EDITOR_BUILD` unchanged.**
Both proposals await Zeis's go before any build starts.

Sources: the seven transcriptions · `docs/In-Game-Handbook.md` ·
`reference/hackhub-events.json` (generated from SDK 0.21.0 `ModEventMap`) ·
`src/schema/registry.ts` · `src/compiler/runtimeSource.ts` · the ten shipped
templates.

## 1. Correction first: a wrong theory about tool responses

Reading the transcriptions, the template `dataText` blocks looked *nothing*
like the game's real tool output — official quests consistently print
`Scanning social media platforms…` for lynx, a `PORT STATE SERVICE VERSION
DESTINATION` table for nmap, `Server / Contact Name / Contact Mail / Status`
for whois. First theory: our templates' canned output is unfaithful to the
game. **Wrong.** `world.toolResponse` does not ship presentation text — the
runtime case emits
`Shell.addCommandData(command, input, data)`, where *data is a structured
shape the tool understands, not a block of text* (the runtime comment records
that passing text used to throw inside the engine), and the registry's
`dataText` note spells out the per-tool parse shapes (`whois → domain, ip,
registrant, email · lynx → web, email, phone, social, address · hydra →
username, password · nmap → one port per line, three-part versions`). The
**game renders its own presentation** from that data — which is exactly why
the official output in the transcriptions and our parse-input format never
needed to match. No fidelity bug exists; recorded here so the next reader
doesn't re-derive the same wrong theory.

## 2. What the transcriptions independently confirm

The handbook has been the top authority for player behaviour since r119; the
official quests were built by the game's own developer, so they are the
strongest possible cross-check. They confirm, in real shipped quests:

- **`ssh -h user@ip`** (Annoying Neighbor) — the form r126 corrected Help Desk
  to teach.
- **`ftp -h <ip> -u <user> -p <pass>`** (Retrieve Data from FTP).
- **`hydra -T <ip>:<port> -P <wordlist>`** (School Grades, Annoying Neighbor)
  — the standard credential-acquisition step.
- **lynx output categories** — `Accounts:`, `Email(s):`, `IP Addresses:`,
  `Info(s):` — matching the registry's lynx parse note.
- **Three-part service versions** (`OpenSSH 4.33.50`) — matches the template
  rule "OpenSSH 6.4.0, never 7.2".
- **nmap prints a DESTINATION column** with the internal IP — matches the
  handbook's port-forwarding pages and the registry's three-numbers-per-port
  note.
- **whois prints `Server / Contact Name / Contact Mail / Status`** — the same
  fields the registry parse note reads.

## 3. Quest-by-quest: what an author can rebuild in the editor

Legend: ✅ expressible today · 🔶 expressible with the documented substitute ·
❌ engine-only (not moddable with SDK 0.21.0).

**1 — Retrieve Data from FTP** (`1-RetrieveDataFromFTP.md`). Mail brief with
FTP credentials → `ftp -h … ` → `ls`/`cd`/`cat` → reply mail with the file
content → Complete. Our version: `comms.dialogue` (mail) brief →
`world.files` on a seeded machine + `world.user` → `reply.input` or a
`Mail.Sent` content trigger → `fx.pay`. ✅ — this is essentially the Harbour
Manifest shape with ftp. `Terminal.FTP.Connect { ip, port? }` exists as an
observable connect trigger.

**2 — Manipulate Grades** (`2-InfiltrateSchool…`). `nslookup` → `nmap` (3306
open) → `hydra` → log into the game's Database Manager app → edit one cell →
quest auto-completes. Recon chain ✅; hydra ✅ (see §5); the ending is
**observable**: `Database.DataUpdate { table, data }` is declared — but that
it fires for Database-Manager edits on mod-added databases is an in-game
question (§6 open questions). Without it, the substitute ending is
sqlmap/shell (Cold Storage's route).

**3 — Find the Real Owner** (`3-FindRealOwnerOfNetwork.md`). `whois` domain →
lynx a name → lynx the friends it surfaces → mail the name back. ✅ — The
Harbour Manifest is already this quest in editor form. Nothing to add.

**4 — Annoying Neighbor** (`4-AnnoyingNeighbor.md`). Phone call with choice
lines → **SMS** with the name → `lynx` → `nmap -sV` → `hydra` → `ssh -h` →
`shutdown` → auto-finish + callback call. The full spine is expressible:
phone dialogue with player choices ✅; **SMS 🔶 → Kisscord** (settled
substitute); every hack step ✅; and the ending is observable —
**`Terminal.SSH.Shutdown { ip }` is declared**, so "shut the machine down"
can tick an objective. This is the best minimal demonstration of the missing
piece (§5): *credentials by cracking*.

**5 — Cyber Justice** (`5-CyberJustice.md`). Twotter smear campaign →
phish via the game's credential-harvester mail dropdown → log into the
victim's Twotter → typewriter a tweet. ❌ as written: Twotter is dropped
(r31, save-corrupting crash — the catalogue even declares
`Twotter.Post/ProfileSeen`, which proves *declared ≠ safe to use*), and the
in-game harvester dropdown is engine UI a mod cannot author. The moddable
skeleton already ships: Bad Attachment (phishing by reply-carries-credential)
+ `Browser.WebsiteOpened` objectives.

**6 — Cryptographer Hunt** (`6-CryptographerHunt.md`). lynx → read the
target's Twotter (❌) → phone social engineering with a **fail route on a
wrong choice** → second call → phishing mail → bank transfer to an IBAN.
The phone social-engineering scene is ✅ today (phone dialogue, branches,
wrong-answer routes — Cryptographer Hunt is the strongest argument yet for
roadmap item 7, "Two Ways Out"). The transfer ending is observable:
`Bank.Transfer { amount, from, to }` is declared (note: the *event* exists
even though a `Bank.transfer` *API call* for mods does not — different
things). The middle needs the Twotter substitute (Kisscord/website clue).

**7 — Steal Exam Questions** (`7-StealExamQuestions.md`). **SMS** → Kisscord
add-contact chat with typewriter replies → lynx chain → `net_tree.py`
network map → `whois` each host → `nmap -sV` → metasploit → `explorer`
download → optional log cleanup → send file in Kisscord. Nearly all ✅ or 🔶:
Kisscord contact + typewriter ✅ (dialogue editor player moments); lynx/whois/
nmap ✅; msf ✅ as versioned-vulnerability + `Metasploit.Rootgrab`/
`Meterpreter.Download` triggers; the file handover ✅ via
`Terminal.SSH.FileDownload` / `Files.Transfer` triggers and the dialogue
file-upload moment. ❌: `net_tree.py` (engine GUI — substitute: whois each
seeded host, which is what the quest itself then does) and log cleanup
(README known limitation, engine-side).

## 4. Every official ending has a moddable signal — on paper

Declared in `ModEventMap` (SDK 0.21.0), mapped to the official use:

| Event | Official-quest use |
|---|---|
| `Terminal.FTP.Connect { ip, port? }` | quest 1 connect |
| `Database.DataUpdate { table, data }` | quest 2 cell edit |
| `Mail.Sent { … content }` | quests 1, 3 "reply with the answer" |
| `Terminal.SSH.Shutdown { ip }` | quest 4 shutdown ending |
| `Twotter.*` | quest 5 — declared, **unsafe** (r31 crash) |
| `Bank.Transfer { amount, from, to }` | quest 6 transfer ending |
| `Terminal.SSH.FileDownload`, `Files.Transfer`, `Meterpreter.Download` | quests 7 (and 1) exfiltration |
| `Terminal.Hydra { ip, port, wordlistFile, credentials? }` | quests 2, 4 crack success (`credentials` present only on success — matches `eventDocs.ts`) |
| `Metasploit.Rootgrab`, `Sqlmap.*`, `Nuclei.*` | quest 2/7 exploit routes |

Per the standing rule this table proves *declaration*, not *firing* — each
trigger an actual template relies on gets an in-game check by Zeis before we
call it solid (same discipline as every runtime claim to date). SMS has no
events at all in the map; nothing there to grow into until the SDK ships it.

## 5. The real gap: the cracking step is missing from the shipped set

The registry's Tool-response dropdown offers nmap, hydra, whois, nslookup,
mxlookup, ping, lynx, geoip, ssh, ftp, weechat. Grep of the ten shipped
templates: `lynx` ×4, `whois` ×2, `nmap` ×2 (one is the Node Reference
example). **hydra, ftp, nslookup, mxlookup, geoip, ping: zero uses.** Two of
seven official quests turn on hydra; one turns on ftp. The official quest
grammar is *recon → crack → connect → act*, and our template set teaches
*recon* (Byline), *find credentials someone left* (Help Desk Leak), and
*exploit* (Cold Storage, Ledger) — but never *crack*.

## 6. Proposal A — an Advanced template on the crack → connect → act spine

Working title **"Six Tries"** (Zeis renames freely). Tier: Advanced. The
Annoying Neighbor / School Grades grammar, minus the engine-only parts:

```
mail brief (creds not included — that's the point)
  → world.toolResponse lynx   (find the target's IP)
  → world.toolResponse nmap   (find the open ssh port, versioned)
  → world.toolResponse hydra  (user+target keyed; Terminal.Hydra trigger
                               with credentials.username/password carries
                               the cracked login into the objective)
  → world.user ssh -h  (teach the -h form, as everywhere since r126)
  → steal/act: file read via Terminal.Cat / Terminal.SSH.FileDownload
  → reply + fx.pay + closing line (end-from-last-objective, per the r126 rule)
```

What it teaches that no template does: the `hydra` tool response's
user+target keying (`inputUser`/`inputTarget` instead of `input` — the
registry hint already explains the split), an objective triggered by
`Terminal.Hydra` *with* conditions on the credentials payload, and the
crack→connect hand-off. Follows all seven standing template rules
(exploitability guard, no typed IPs, rooted subnet, distinctive domain,
no dead nodes, closing line, sticky note).

**Open questions for Zeis (in-game; nothing proceeds on theory):**
1. Does `Shell.addCommandData("hydra", …)` render as a real hydra run (the
   tries/table output) and fire `Terminal.Hydra` with `credentials` filled?
2. Does `Terminal.SSH.Shutdown` fire when the player shuts down a
   mod-added machine — and does the game even offer shutdown there?
3. Carried from r126, still open: `ssh -h` against a 10.x box; the
   Database-Manager edit firing `Database.DataUpdate` for mod-added tables
   (would unlock grades-style endings, currently substituted by sqlmap).

## 7. Proposal B — an author-facing "official quest techniques" article

A handbook article in the editor's own Handbook viewer
(`src/schema/handbookArticles.ts`): *"How the official quests do it — and
how you can"*, one row per technique (SMS, Twotter, harvester mail,
Database-Manager edit, net_tree, log cleanup, shutdown, hydra, ftp, …) with
the moddable substitute or a plain "engine-only, here's the closest node".
This file is the source; the article is its player-facing compression.
Complements r119's gap analysis (which mapped the handbook; this maps the
quests).

## 8. Explicitly not actions

- **Twotter stays dropped.** `Twotter.Post/ProfileSeen` being declared in
  the event map changes nothing about the r31 save corruption; revisit only
  on a game build that proves `bio` survives.
- **No SMS work.** Nothing SMS-shaped exists in the SDK (see README item on
  the developer's reply; anything promised lands via a pinned SDK version
  first — see the dev-response fence in README/HANDOFF).
- **No harvester-mail authoring.** The in-game credential-harvester dropdown
  is engine UI; Bad Attachment's reply-carries-credential remains the
  documented substitute.
- **No forward-compat scaffolding** for `net_tree`/`explorer`/log-cleanup —
  `world.wifi` already holds the one forward-compat slot, deliberately.

## 9. Journalist's Sister

Absent until transcribed — and per Zeis's own note likely the most valuable
of all: the one quest line with hardcoded names, i.e. the closest to how
*mods* must work. Read it against the multi-quest-per-mod support
(`entry.load`, quest chains) the moment it lands.

---

**Status:** findings + two proposals, awaiting Zeis. Gates at time of
writing: typecheck clean, 1,166 tests green (the 4 pre-existing d3-drag
jsdom teardown errors aside), no code changed, `EDITOR_BUILD`
`2026-09-08.r126` unchanged.
