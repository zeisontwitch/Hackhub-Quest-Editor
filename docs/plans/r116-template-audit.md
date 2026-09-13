# Template audit — r116

Zeis: *"The Harbour one is the only template we ever fully tested from start to
finish and we haven't touched the other templates in several dozens of rounds.
I don't want you to only check for issues with them, but to also re-evaluate
what each of them does, if their individual quests are interesting or can be
improved, and if we're lacking any templates."*

Findings first, then the judgement calls. Nothing changed yet.

---

## 1. The serious one: three templates are probably unfinishable

Rounds 51–78 were spent learning, through repeated in-game failure, what makes
a machine exploitable. Every one of those lessons was applied to **data-grab**
(Harbour) — the template being tested at the time — and to nothing else.

What each template actually ships:

| Template | Account | `acceptReverseTCP` | `extraAccounts` | Login port |
|---|---|---|---|---|
| **data-grab** | `admin` | **yes** | **false** | OpenSSH 6.4.0 |
| contract-hack | `aritter` | yes | *unset* | OpenSSH 7.2.0 |
| investigation | `dockmaster` | **no** | *unset* | **mysql only — no ssh** |
| dirhunter-leak | `t.reyes` | **no** | *unset* | OpenSSH 8.4.0 |

And every one of them has an objective that requires being *on* the machine:

- investigation → `Terminal.SSH.FileDownload`
- dirhunter-leak → `RemoteConnection.Established`
- contract-hack → `Metasploit.Meterpreter.Connected`

So three templates ask the player to break in, and three were never given the
setup that lets them.

Two distinct problems:

**`acceptReverseTCP` missing** (investigation, dirhunter-leak). r53's finding:
the exploit needs a guest account *or* an online user; r78 refined it to a
single online user with `acceptReverseTCP: true`. Neither template has it.

**`extraAccounts` unset** (all three). The schema default is *on*, so they get
`createDefaultUserSchema(..., { guest: true })` — a guest account. r57 and r78
established that this is what drops the player into `guest` instead of an admin
shell, forcing a password crack the story never mentions.

**investigation has no SSH port at all.** Its only port is mysql, yet its final
objective is `Terminal.SSH.FileDownload`. That one cannot work as written.

> **Correction (r117).** Two claims above were wrong, found when I wrote a
> mechanical test instead of reading the tree by eye.
>
> *"investigation has no SSH port"* — it does. The **router** carries ssh and
> http; I had only looked at the child device, which is mysql-only. The quest
> is reachable.
>
> *"missing `acceptReverseTCP` breaks them"* — not on its own. Leaving
> `extraAccounts` unset means the stock schema adds a **guest** account, and
> r53 established that a guest is a valid way in. So these templates are
> probably completable.
>
> What remains true, and is still worth fixing: with guests enabled the player
> lands in `guest` rather than an admin shell (r57/r78), which forces a password
> crack none of these stories mention. That is a design flaw, not a blocker.
>
> The lesson for me: I read three device trees by eye and drew a confident
> conclusion. The test I should have written first disagreed with me.

## 2. Dead nodes in `investigation`

Two nodes compile to nothing, and the compiler says so on export:

- `fx.handbook` — *"handbook nodes are not compiled yet"*
- `world.files` targeting a device — *"exports as a note"*, because files for a
  remote device have to go in that device's own tree

An author starting from this template gets two nodes that look wired up and do
nothing. Either they should be removed, or the features should be finished.

## 3. What the templates are, as stories

Setting bugs aside — are they any good, and is the set balanced?

| Template | Objectives | The story | Verdict |
|---|---|---|---|
| **blank** | 0 | The four lifecycle nodes and a note. | Right as it is. |
| **hello-hack** | 1 | Scan an address. That is the whole job. | Right as it is: the smallest possible complete quest. |
| **wifi-hack** | 3 | Recon → crack → join a neighbour's Wi-Fi. | Teaches a clean linear shape. But the SDK cannot create Wi-Fi, so it exports as a router reachable by IP — the story it tells and the thing it builds do not match. |
| **investigation** | 3 | Meridian Capital; find a maintenance page, take a ledger. | The showcase for branching, `setData` and typed replies. Currently also the most broken. |
| **data-grab** | 7 | Harbour: brief → lynx → whois → nmap → break in → take file → mail it. | The proven one. Good arc, every step motivated. |
| **contract-hack** | 9 | The Ledger: the long route, with privilege escalation. | The most complete story. Nine objectives may be a lot for a *template*. |
| **dirhunter-leak** | 6 | naza.gov; find an unlisted help-desk page, take a report. | Nicely distinct — the only one built around a website rather than a terminal. |
| **reference** | 1 | Every node type, laid out, not wired. | A gallery, not a quest. Warns "nothing can start this quest" on export, which is correct but alarming. |

### Where the set is thin

- **Everything is theft.** Six of the eight end with taking a file or joining a
  network. Nothing uses conversation as the payload, and nothing has the player
  *give* something.
- **Nothing branches to a different ending.** `investigation` branches
  internally, but every template has one outcome. The roadmap's "branching
  consequence" template is the real gap.
- **The chat editors are barely represented.** Kisscord and WeeChat are
  substantial features; only `investigation` touches conversation at all, and
  no template uses a phone call. The roadmap's "contact-driven story" covers
  this.
- **No template is set on the player's own machine.** Every one sends the
  player out to a remote host.

## 4. Recommendation, in order

1. **Fix the exploitability gaps** — apply the r53/r57/r78 rules to
   contract-hack, investigation and dirhunter-leak. Low risk, high value: three
   templates currently cannot be finished.
2. **Give investigation an SSH port**, or change its final objective to match
   what the machine actually offers.
3. **Remove the two dead nodes** from investigation, or say in the note that
   they are placeholders.
4. **Re-word wifi-hack** so the story matches what it builds, until the SDK
   gains a wireless API.
5. Then the two new templates already on the roadmap.

Items 1–3 are corrections and should happen first. 4 is a wording change. 5 is
new work.
