# Rebuilding the template set — plan

Zeis: keep **Harbour** (the only one proven in-game) and **Ledger** (needs a
small fix), drop the rest, and rebuild from what we have learned. Each template
should cover a different situation, at varying difficulty, so an author can
read one, copy it, or start a story from it.

This is a proposal. Nothing built yet.

---

## 1. What we are working with

**Node types that no working template demonstrates.** Ten of them appear only
in the reference gallery, unwired:

`world.port` · `world.database` · `fx.withdraw` · `fx.claimQuest` · `fx.shell`
`flow.delay` · `flow.reroute` · `flow.random` · `flow.debug` · `layout.group`

That is a real gap. A node nobody has seen used is a node nobody uses.

**Things the SDK cannot do**, which templates must not promise:
- No wireless API — "Create Wi-Fi" exports as a router reachable by IP. The old
  `wifi-hack` told a story its own export could not deliver.
- Handbook nodes do not compile.
- `world.files` aimed at a remote device exports as a note.
- A mod quest cannot formally complete without freezing the game
  ([`04-engine-bug`](../04-engine-bug-quest-completion.md)), so every template
  ends its story without completing.

**The exploitability rules**, learned across r51–r78 and currently applied to
Harbour alone. (The r116 audit overstated this: the others are probably
*completable*, because leaving `extraAccounts` unset gives them a guest account
to land on. What they get wrong is dropping the player into `guest` when the
story describes walking in as an admin.) Any machine the player must get into
needs:
- at least one user, `online: true`, `acceptReverseTCP: true`
- `extraAccounts: false` unless the story *wants* a guest to crack
- a login service on a three-part version (`OpenSSH 6.4.0`, not `7.2`)

## 2. The shape of the set

Eight templates. Two kept, six new. Ordered so an author can walk them as a
course, but each stands alone.

| # | Template | Difficulty | The situation it teaches | Status |
|---|---|---|---|---|
| 1 | **Blank** | — | An empty canvas with the four lifecycle nodes. | keep |
| 2 | **First Contact** | ⭐ | One objective, one reward. The smallest complete quest. | replaces `hello-hack` |
| 3 | **The Harbour Manifest** | ⭐⭐ | The standard contract: research → find → break in → take → deliver. | **keep, proven** |
| 4 | **Cold Call** | ⭐⭐ | A story told through conversation. No break-in at all. | new |
| 5 | **The Help Desk Leak** | ⭐⭐⭐ | Websites as the puzzle: dirhunter, an unlisted page, credentials in a document. | rebuild |
| 6 | **The Ledger Contract** | ⭐⭐⭐⭐ | The long route: privilege escalation, destruction, a cover story. | keep + fix |
| 7 | **Two Ways Out** | ⭐⭐⭐⭐ | One choice, two endings, and the quest remembers. | new |
| 8 | **Node Reference** | — | Every node type, laid out and annotated. | keep |

### Why these, specifically

**2 · First Contact** — `hello-hack` was one nmap scan. Fine, but it teaches
nothing about *structure*. The replacement keeps one objective but shows the
full spine an author will reuse forever: a mail arrives, the player does one
thing, they get paid, a closing line lands. Five minutes to read, and every
other template is this shape with more in it.

**4 · Cold Call** — the biggest hole in the current set. Kisscord and WeeChat
are substantial features and *no* template uses them meaningfully; nothing uses
a phone call at all. Here the payload is information: a contact messages you,
you look someone up with `lynx`, you report back in chat. No exploit, no
terminal wizardry. It also proves you can write a HackHub quest that is not a
burglary — worth demonstrating.

**5 · The Help Desk Leak** — the old one had the best *idea* in the set (a
website as the puzzle) and shipped unexploitable. Rebuilt: dirhunter finds an
unlisted help-desk page, the page contains a password, the password gets you in.
Also the natural home for `world.database` — a support ticket table the player
reads once inside.

**7 · Two Ways Out** — nothing in the set branches to a different *ending*. The
player finds evidence and chooses: hand it to the client, or sell it to the
subject. `flow.branch` on stored data, two different closing beats, two
different payments. This is the template people will copy most, because "make a
choice matter" is the thing every quest author asks about first.

### What each new template demonstrates, by node

Chosen so the ten orphaned node types get a real showing:

| Template | Nodes it introduces |
|---|---|
| First Contact | the spine: `entry.start`, `comms.dialogue`, `objective`, `trigger.event`, `fx.pay` |
| Cold Call | Kisscord/WeeChat dialogue, `flow.delay`, `reply.input` |
| Help Desk Leak | `world.database`, `world.port`, `fx.shell`, `flow.sequence` |
| Two Ways Out | `flow.branch`, `fx.setData`, `fx.withdraw`, `flow.random` |
| Ledger | privilege escalation, `flow.branch`, `layout.group` for readability |

`flow.debug` and `flow.reroute` stay in the reference gallery — they are
editor tools, not story beats. `fx.claimQuest` needs a second quest to claim;
worth a note in the reference rather than a whole template.

## 3. Difficulty, and what it means

Not "how hard is the hack" but **how much the author has to understand**:

- ⭐ one objective, one straight line
- ⭐⭐ several objectives in sequence, one machine or none
- ⭐⭐⭐ multiple hosts, or a puzzle whose pieces are in different places
- ⭐⭐⭐⭐ state that persists across steps, and flow that branches on it

Every template states its difficulty and what it teaches in its own sticky
note, so an author who opens it knows within ten seconds whether it is the one
they want.

## 4. Rules every rebuilt template follows

Written down because these are exactly the things that rotted last time:

1. **Every machine the player must enter passes the r78 checklist.** A test
   will assert this mechanically — see §6.
2. **No node that compiles to nothing.** No handbook nodes, no device-targeted
   file seeding, until those features exist.
3. **The story matches what the export builds.** No Wi-Fi fiction.
4. **Every template ends without formally completing**, per the engine bug, and
   leaves a closing line.
5. **Domains are distinctive.** Domain names are global; a generic one may be
   taken by the base game or another mod.
6. **Three-part port versions**, always.

## 5. Open questions for Zeis

1. **Eight feels right to me — too many?** The gallery and blank are cheap; the
   real count is six playable.
2. **Cold Call has no hacking in it.** I think that is the point, but it is the
   one choice I would most like a second opinion on.
3. **Two Ways Out pays differently depending on the ending** — selling out pays
   more. Is that the right message for a template, or should the honest route
   pay better?

## 6. Build order

1. Fix Ledger (`extraAccounts: false`) — a one-line correction to a template
   that otherwise works.
2. Add the mechanical exploitability test, so a broken template fails the build
   rather than waiting for a playthrough.
3. Delete `hello-hack`, `wifi-hack`, `investigation`, `dirhunter-leak`.
4. Build First Contact, then Help Desk Leak, then Cold Call, then Two Ways Out.
5. Update the template gallery copy and the docs.

Each template gets a compile test and a "does it hang together" test; the
exploitability test in step 2 covers all of them at once.
