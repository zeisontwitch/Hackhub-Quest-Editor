# Rebuilding the template set — plan

Zeis: keep **Harbour** (the only one proven in-game) and **Ledger** (needs a
small fix), drop the rest, rebuild from what we have learned. Each template
covers a different situation so an author can read one, copy it, or start a
story from it.

Revised after Zeis's notes: three difficulty tiers, two website templates using
websites in *different* ways, make real use of Metasploit's other exploits and
the phishing/credential-harvester flow, and give the expert tier a genuine
multi-tool chain rather than one clever trick.

This is a proposal. Nothing built yet.

---

## 1. What I checked before proposing anything

**The toolbox is far larger than our templates use.** Events we can already
trigger on, verified against `reference/hackhub-events.json` and the SDK:

| Area | Events |
|---|---|
| Metasploit | `Use`, `Search`, `ShowOptions`, `SetOption`, `Event.Try`, `Meterpreter.Connected`, `Rootgrab`, `Msfconsole` |
| Cracking | `Terminal.Hydra`, `Terminal.Hydra.Try`, `John.DecryptHash`, `Hashcat`, `Fern.FindPassword` |
| Web / recon | `Terminal.Dirhunter`, `Nuclei.Results`, `Nuclei.Item`, `Subfinder.Try/Results`, `Sqlmap.ListTables`, `Sqlmap.DumpTable` |
| Wireless | `Bettercap.WifiRecon`, `WifiDeAuth`, `NetProbe`, `NetShow` |
| Mail | `Mail.Sent`, `Mail.Received`, `Mail.Read`, `Mail.AccountCreated` |
| Files | `Files.Transfer`, `Files.Deleted`, `Files.Open`, `Terminal.SSH.FileDownload` |

Our current templates use maybe a third of that.

**`Metasploit.Event.Try` carries `{ exploit, target, options }`** — so a
template can require a *specific* exploit rather than "any shell". That is what
makes Zeis's point about the other exploits actionable.

**The phishing flow is real and documented.** `Mail.registerTemplate` exists in
the SDK and its own doc comment says it is "handy for phishing-style quests":
it puts a template in GoMail's compose dropdown with `{{fieldName}}`
placeholders. Player reports describe the loop as: pick a credential-harvester
template in compose → fill in the target's name/handle → attach the harvester
file → send → credentials arrive back by mail. We can drive objectives off
`Mail.Sent` (they sent it) and `Mail.Received` (the credentials came back).

> **Unverified, and I will not pretend otherwise.** Whether the *harvester
> attachment* itself can be created by a mod, or whether it only exists in
> base-game missions, is not in the SDK. `MailAttachment` is
> `{ name, extension, data? }` with no notion of a payload. **This needs an
> in-game test before the phishing template is built** — see §6.

**Website builder** is a free-form HTML editor with a `seo` / "listed in
search" flag per page, so unlisted pages that only `dirhunter` finds already
work — that mechanic is proven by the existing help-desk template.

## 2. Difficulty: three tiers

Per Zeis, simplified to **Beginner / Advanced / Expert**. The tier describes
how much the *author* has to understand, not how hard the hack is:

- **Beginner** — one straight line, one or two ideas.
- **Advanced** — several objectives, a real machine or a real website puzzle.
- **Expert** — multiple hosts or tools, state carried between steps, and flow
  that branches.

## 3. The set

Nine entries. Three kept, one fixed, five new.

| Template | Tier | The situation it teaches | Status |
|---|---|---|---|
| **Blank** | — | Empty canvas, four lifecycle nodes. | keep |
| **First Contact** | Beginner | The whole spine: brief → one objective → payment → closing line. | replaces `hello-hack` |
| **The Byline** | Beginner | **Website #1:** read an ordinary site, find a name in a blog post, `lynx` it. No hacking. | new |
| **Cold Call** | Beginner | A story told in conversation. Kisscord/WeeChat, no break-in. | new |
| **The Harbour Manifest** | Advanced | The standard contract, end to end. | **keep, proven** |
| **The Help Desk Leak** | Advanced | **Website #2:** `dirhunter` an unlisted page, credentials inside, log in. | rebuild |
| **Bad Attachment** | Advanced | Phishing: register a mail template, send the lure, credentials come back. | new *(gated on §6)* |
| **The Ledger Contract** | Expert | The long route: escalation, destruction, cover story. | keep + fix |
| **Cold Storage** | Expert | Wi-Fi → router login → open a port → get past a firewall → pivot → database. | new |
| **Node Reference** | — | Every node type, annotated. | keep |

### The two website templates, deliberately different

Zeis asked for both, and they teach opposite lessons:

**The Byline** (Beginner) — the site is *ordinary*. A small company blog, three
posts, an about page. One post is signed by a name. The player reads the site
like a person, spots the byline, and `lynx`-searches that name to find the
contact who moves the story on. **Nothing is hidden.** The lesson for an author
is that a website can carry a clue in plain sight, and that a quest can be
solved by reading.

**The Help Desk Leak** (Advanced) — the site *hides* something. The public
pages are a dead end; an unlisted page (`seo: false`) is reachable only by
`dirhunter`, and it holds a password reset thread with a working credential.
The lesson is the unlisted-page mechanic and the tool that finds it.

### Cold Storage — the expert chain

Zeis's sketch, plus enough around it that it is not one trick:

1. **Bettercap** — recon the company's wireless, find their access point.
2. **Fern** — recover the passphrase, join the network (`Fern.FindPassword`).
3. **Router** — log in to the router now that you are inside the perimeter.
4. **Open a port** — `world.port` on the router, so metasploit has a way in.
5. **Firewall** — a `world.firewall` rule blocks the obvious route; the player
   has to notice and work around it.
6. **Exploit** — a *named* module via `Metasploit.Event.Try`, not "any shell".
7. **Pivot** — the first machine is not the prize; a second host behind it is.
8. **Database** — `world.database`, read with `sqlmap` (`Sqlmap.DumpTable`).
9. **Get out** — deliver, and the quest closes without formally completing.

That uses `world.wifi`, `world.port`, `world.firewall`, `world.database`,
`fx.setData`, `flow.branch` and `layout.group` — most of the node types that
currently exist only in the unwired reference gallery.

**Caveat:** step 4 assumes opening a router port makes a machine behind it
reachable, and step 5 assumes a firewall rule visibly blocks something. Both
are modelled in our schema; neither is proven in-game by us. Expert is the
right tier for it, but it is also the template most likely to need a
playthrough before it is trustworthy.

## 4. What each template introduces

Chosen so the ten node types that appear only in the reference gallery each get
a real showing:

| Template | Nodes / tools it introduces |
|---|---|
| First Contact | the spine: `entry.start`, `comms.dialogue`, `objective`, `trigger.event`, `fx.pay` |
| The Byline | a website with several pages, `Terminal.Lynx.Search`, `flow.note` as author guidance |
| Cold Call | Kisscord + WeeChat dialogue, `flow.delay`, `reply.input` |
| Help Desk Leak | unlisted pages, `Terminal.Dirhunter`, `fx.shell`, `flow.sequence` |
| Bad Attachment | `Mail.registerTemplate`, `Mail.Sent` / `Mail.Received`, `fx.setData` |
| Cold Storage | `world.wifi`, `world.port`, `world.firewall`, `world.database`, `layout.group` |
| Ledger (fix) | privilege escalation, `flow.branch`, `fx.withdraw` for a bribe |

`flow.debug` and `flow.reroute` stay in the reference gallery — they are editor
tools, not story beats. `fx.claimQuest` needs a second quest to claim; better
as a note than a whole template.

## 5. Rules every rebuilt template follows

Written down because these are the things that rotted last time:

1. **Every machine the player must enter passes the r78 checklist** — enforced
   by `exploitable.test.ts`, which now fails the build.
2. **No node that compiles to nothing.** No handbook nodes, no device-targeted
   file seeding, until those features exist.
3. **The story matches what the export builds.** No Wi-Fi fiction in the
   prose — Cold Storage uses `world.wifi` knowing it exports as a router, and
   its text says "their network" rather than promising an SSID in a Wi-Fi list.
4. **Every template ends without formally completing**, per the engine bug, and
   leaves a closing line.
5. **Distinctive domains** — they are global and a generic one may collide.
6. **Three-part port versions**, always.
7. **Every template says its tier and what it teaches** in a sticky note, so an
   author knows within ten seconds whether it is the one they want.

## 6. What needs testing before it can be built

**Bad Attachment is gated.** I can register a mail template and watch
`Mail.Sent`, but I cannot confirm from the SDK that a mod can produce a working
credential-harvester attachment. Three possibilities:

- a mod can attach one → build the template as described;
- only the base game can → the template becomes "send a convincing lure and the
  reply carries the credential", driven purely by `Mail.Sent` / `Mail.Received`,
  which still teaches the pattern;
- neither works → drop it and add a note to the dev questions.

A ten-minute in-game check settles it: does a mod-registered template appear in
GoMail's compose dropdown, and can anything be attached to it?

**Cold Storage's router/firewall assumptions** (§3) would benefit from the same
treatment, but the fallback is milder — worst case the chain loses a step.

## 7. Build order

1. **Fix Ledger** — `extraAccounts: false` so the player lands as `aritter`
   rather than a guest. One line.
2. **Delete** `hello-hack`, `wifi-hack`, `investigation`, `dirhunter-leak`.
3. **First Contact**, **The Byline**, **Cold Call** — the beginner tier.
4. **Help Desk Leak** — rebuilt.
5. **Cold Storage** — the expert chain.
6. **Bad Attachment** — after the §6 test.
7. Gallery copy, docs, and a test per template.

Steps 1–2 are corrections and can go first. 3–5 are the bulk. 6 waits on Zeis.
