# Zeis's UX-check fixes — r125

Zeis played reviewer with gamer eyes: 14 items, from copy fixes to small
features. Grouped below by area. Ground truths consulted per item; open data
requests for Zeis are collected at the bottom.

## A. Copy, renames, defaults (no behaviour change)

- **Change port (4):** add an info note explaining it adjusts a machine
  `Create network` already built (verified: runtime calls
  `Network.openPort/closePort/addPort/removePort` on an address; it creates
  nothing).
- **Create database (5):** delete the "Step 3" note (internal roadmap jargon —
  "Step 4" is the export dialog's own step counter) and **build the missing
  tables editor** (see F). The schema already holds `tables: {id,name,rows}[]`;
  the UI just never rendered it.
- **Seed files → Place files (6):** rename the label; update the user-facing
  strings that name it (`fields.ts`, compile warning, tests, `docs/02`).
  Type id `world.files` unchanged — no migration.
- **Tool response (7):** fix `OpenSSH 8.9` → `OpenSSH 8.9.0` in the note, and
  document that `{{data.targetIp}}` / `{{data.name}}` / `{{player.*}}` /
  `{{random.*}}` work in the key/response (verified: runtime fills
  input/inputTarget/dataText with the full data scope).
- **Mask the input (8):** the `*` is SDK-verified
  (`PromptOptions.password`: "shown as `*`, like a password field"). New hint
  shows what it LOOKS like: the player sees `Passphrase > ****` instead of
  their answer, like a password box.
- **Pay the player (9):** default 1000 → 100. Remove `Amount type`/`Percent`
  from Pay's UI only — no template uses percent-on-pay, and percent-of-balance
  is the Charge node's job. Schema + runtime keep parsing it (grandfathered
  old docs via a `showWhen` legacy note), so nothing saved breaks.
- **Run terminal command (11):** hint + example. Verified mechanism:
  `Shell.exec` runs it in the player's terminal with tokens filled. Example:
  `nmap {{data.targetIp}}` runs a scan for the player when the story — not
  the player — should run it.
- **Sequence (13):** defaults `First/Then` → `1/2`; new outputs number
  themselves (`newItem` receives the index — zero-arg impls are unaffected).
  Socket/list fallbacks `Step N` → `N`; schema label default `Step` → `""`.
- **Story Beat (14):** skip `flow.beat` in the issue loop like notes/groups.
  Beats are stripped planning furniture; reachability through them is
  unaffected (BFS follows edges, not node types).

## B. Human-readable event names (1)

New `humanEventName()` in `schema/events.ts`: `Terminal.Cat` →
`Terminal: Cat`, `Metasploit.Meterpreter.Connected` →
`Metasploit: Meterpreter connected` (namespace verbatim; tail words split on
camelCase, first kept, rest lowercased). Used in the EventPicker (big +
raw mono underneath), the trigger card summary, and picker search. Stored
values unchanged. `eventLabel` retires if unused.

## C. Common-port presets (2)

A preset dropdown at the top of the Ports editor that appends a filled row.
Each preset states its source; versions only where verified:

| Preset | Fill | Source |
|---|---|---|
| SSH | 22, `ssh`, `OpenSSH 6.4.0` | QA: Harbour's in-game-tested exploit |
| FTP | 21, `ftp`, `vsftpd 2.3.5` | Handbook's own metasploit walkthrough |
| Web — nginx | 80, `http`, `nginx 7.23.4` | Handbook's nmap example output |
| Web — Apache | 80, `http`, `Apache 2.4.49` | Zeis (player knowledge) |
| MySQL | 3306, `mysql`, `MariaDB 4.1.3` | Nemesis (on nearly every machine) |
| SMTP / POP3 / IMAP | 25 / 110 / 143, service, version blank | Zeis's list; standard ports, **no verified version** |

Double-check result: FTP (handbook's walkthrough target) and MySQL (Nemesis)
were missing — added. DNS/HTTPS/printer (handbook primer) skipped: recon-only,
no exploit path, no verified versions. Service strings lowercase per handbook
nmap output + Nemesis. All preset versions obey the 3-part rule.

## D. Firewall choice fields (3)

New `selectOrCustom` FieldDef kind (preset dropdown + conditional input;
stored value stays a plain string — no schema change, old docs derive their
mode from the value):

- **Protected IP:** `Random IP` writes `{{data.targetIp}}` (note: Zeis wrote
  `{{data.targetIP}}` — the engine seeds `targetIp`, lowercase p, and matching
  is case-sensitive, so the capital-P form resolves to nothing), `Custom`
  reveals the input. Also fixes the stale "randomly-allocated router" hint
  (post-r77 the token is the machine, not the router).
- **Source:** `Anywhere` (`*`) + Custom. Verified pattern: Nemesis uses
  `source: "*"` on every rule.
- **Destination:** `The quest's random machine` (`{{data.targetIp}}`) +
  Custom. Nemesis always sets destination to a specific machine IP — so the
  old "`*` means this machine" hint (unverifiable anywhere) goes away, and
  `*` is no longer offered, only typeable.
- **Runtime:** `fill()` source/destination (today only the IP is filled, so a
  token destination would reach the engine unresolved). Strings either way —
  SDK-safe. Compiler output changes → `EDITOR_BUILD` bumps to
  `2026-09-08.r125`.
- r124's empty-IP warning stays for the port node; the firewall's next step
  becomes "pick Random IP".

## E. Token picker (7 + 10)

`tokens: true` is currently ignored by the UI — no picker exists. New shared
helper `availableTokens(quest, excludeKey?)`: `{{data.targetIp}}` (iff the
quest has a network — all are random post-r73), `{{data.gatewayIp}}` (iff a
network root isn't a router — mirrors `CreateData`), `{{data.key}}` for every
other Set-quest-data key, plus the always-available `{{player.*}}` /
`{{random.*}}` (permissions auto-derive from the token scan). Each token
carries a one-line "what it produces". Every `tokens: true` text/textarea
gets an insert button; the text input stays as the custom field. This is item
10's dropdown (choose a saved value or type), and item 7's "what each
produces" documentation everywhere at once.

## F. Database tables editor (5)

New `tables` FieldDef kind + bespoke editor (precedent: ConditionsEditor,
DeviceTree): tables → name + rows; row → cells (column + value); write-time
coercion of plain numbers (matches the schema's "the compiler types cells"
intent — realised at write time instead). Replaces the Step-3 note.
Out of scope: seeding Cold Storage's ledger (check while here; follow-up if
it needs story changes).

## G. Handbook node (12)

Two findings: the node **doesn't compile at all** today ("not compiled
yet" warning), and **no source lists the game's article ids** (SDK exposes
`open(id?, category?)` but no catalogue; Nemesis doesn't use it; the handbook
doc references 8 titles, no ids/categories).

1. Make it work: `sdk.Handbook.open(articleId, category)` in runFlow —
   SDK-verified, no permission needed (not in `ModPermission`), sync-safe.
   Warning removed.
2. New `handbookArticle` kind: Article dropdown fed by a `handbookArticles.ts`
   catalogue + `Custom…` revealing id/category inputs. Seeded with the 8
   referenced titles as **id = title (explicit unverified hypothesis)**;
   needs Zeis's 2-minute in-game jump test to confirm or correct the scheme.

## Data requests for Zeis (nothing here blocks the round)

1. SMTP/POP3/IMAP: the version banners your scans report (or "no version
   shown"), and confirm ports 25/110/143. Apache: is there a game metasploit
   module for 2.4.49/2.4.50, or is it flavour?
2. Handbook app: article titles + categories as shown in-game (screenshot
   fine), plus the jump test — export any quest with Open handbook and tell
   me whether it lands on the article or just opens the app.

## Guards

- Unit: event formatter (incl. single-segment + 3-segment edge cases),
  `availableTokens` (targetIp/gatewayIp gating, self-key exclusion),
  sequence numbering, beat silence, port preset data (3-part versions),
  handbook catalogue shape.
- Render: preset appends a row; choice fields switch input visibility;
  token insert appends `{{…}}`; tables add/edit/remove round-trips;
  handbook select fills id+category; legacy percent-pay shows the note.
- Schema suite still green (hints 24–260 chars, punctuation, no jargon —
  note "compile" is banned; say "export").
- Falsify every guard. `typecheck` + full suite. jsdom can't judge the
  dropdown look/feel — Zeis's eyes in the preview.

## Audit

- **Preset versions for SMTP/POP3/IMAP are blank** rather than guessed —
  standard ports flagged for confirmation. Stating ignorance beats shipping it.
- **id = title is a hypothesis**, fenced as one in code, plan and reply, with
  a concrete test. The alternative (empty catalogue) fails the ask entirely.
- **Pay percent removal is UI-only** — old docs still parse and run. No silent
  behaviour change to anyone's saved quest.
- **No new permissions surface**: token-inserted `player.*`/`random.*` are
  covered by the existing token scan; Handbook needs none.
- **EDITOR_BUILD bump** is required (runtime template changes) and safe
  (tests reference it symbolically).

## Not doing

- Highlighting unwired sockets on cards (previous follow-up, untouched).
- Settings page (HANDOFF item 3 — next round).
- Seeding Cold Storage's ledger table — deferred deliberately: Zeis is
  playtesting the templates, and changing template content mid-playtest
  would muddy his results. The TablesEditor is ready when he is.

## Build notes (written after, not planned before)

- **The firewall node's rule was a phantom list.** Schema, runtime and the
  compiler test all say single object; the inspector showed a list field
  over it, so a fresh node displayed "None yet" for a rule it had, and
  clicking Add wrote an array the schema rejects on reload. Replaced with
  a section (`path: "rule"`) — no migration, since the corrupt shape
  cannot survive a reload and nobody could have been using the node.
- **Radix popovers are untestable here.** The first tag picker used Radix
  like its neighbours; five tests took 182 seconds under jsdom (its
  positioning loop spins with no layout). Rebuilt as a fixed panel in a
  portal with a backdrop and Escape handling — 203ms, same look. This is
  a new entry in the "jsdom will lie" family, documented on the
  component. EventPicker/ConditionsEditor keep Radix; they have no
  open-close tests to pay for it.
- **The catalogue is five titles**, the only in-game Handbook pages with
  a verified reference. Growing it needs a sidebar screenshot, not more
  mining — the hand copy is Zeis's guidebook, not the app's index.
- Guards falsified throughout (firewall fill, tag insert, table
  round-trips, handbook open/blank-warning, sequence numbering, beat
  silence, same-as display); full suite 1148 green (54 files; the 4
  d3/jsdom teardown errors are pre-existing, verified on clean HEAD);
  tsc clean; EDITOR_BUILD `2026-09-08.r125`.
