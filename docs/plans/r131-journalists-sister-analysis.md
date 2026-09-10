# r131: the Journalist's Sister questline — analysis and proposals

Zeis finished the playthrough and transcribed all of it:
[`reference/Official-Quest/8-JournalistsSisterQuestline.md`](../../reference/Official-Quest/8-JournalistsSisterQuestline.md)
(1,845 lines, 13 quests). This was predicted to be the most valuable
transcription of all (r127 §9) — the one quest line with **hardcoded names**,
i.e. the closest the game comes to doing what *mods* do. That prediction held,
and the line exposes one genuine node-shaped gap in the editor that the SDK
already supports **today**. Docs-only round: findings first, three proposals
awaiting Zeis's go. No code changed, `EDITOR_BUILD` unchanged
(`2026-09-11.r130`).

## 1. The shape of the thing

Twelve parts plus a branching ending ("Expose Harvey Mack" — Zeis chose
Expose; the Help-Harvey branch exists in-game and is *not* transcribed; a
second playthrough is optional, not blocking). Each part is its own quest that
completes as the story moves on; the line leans on:

- **Chain structure** — the story state persists across quests: the hotel
  network from Part 2 is still there in Part 10; contacts added in Part 1 are
  still messaging in Part 12; bcc.com's front-page articles rotate between
  parts.
- **Cast choreography** — `harveymack` is *added to Kisscord the moment the
  previous quest completes*; `tayLoR` appears mid-Part-2 and goes **AFK** on
  cue; in Part 4's close "all kisscord contacts except harveymack go
  Offline".
- **The Choice** — Part 12 ends in a two-option popup ("Help Harvey and
  eliminate all evidence" / "Expose Harvey"), and the chosen branch becomes
  its own quest with its own ending.
- **A "Complete" button on the objective** appears for the first time in
  Part 11 and again at both endings — base-game quests *do* formally complete
  (relevant to `docs/04`; for mods still fenced behind the patch).
- Time skips ("1 Day Later" fades), a paid contact ($100 bank transfer to
  Victor), a fake-news task, a $1M social-engineering heist, and an
  Interpol infiltration through a 25-host network with **Firewall → Router →
  hosts + a Splitter**, a pfsense panel hijacked via Wireshark + kimai +
  JWT, and an office-macro reverse-TCP phishing run with LHOST/LPORT,
  port-forwarding and `handler`.

## 2. The node-shaped gap: the Kisscord contact lifecycle

The SDK **0.21.0 — our pinned version, nothing fenced here** declares the
whole cast choreography the questline performs, and the editor models *none
of it*:

```ts
Kisscord.createUser({ id?, username?, firstName?, lastName?, avatar?, isFriend?, status? })
Kisscord.addUser(user) / removeUser(userId)
Kisscord.addFriend(username): boolean
Kisscord.changeStatus(userId, status)   // ONLINE | OFFLINE | IDLE
```

Verified in `index.d.ts` (lines 1245–1258, 2515–2533). Our runtime only ever
calls `Kisscord.sendMessage`. Consequences, both visible in our own history:

- The questline's signature move — *a new contact appears mid-story, goes
  AFK, goes Offline* — is unbuildable today.
- Cold Call's still-open in-game question ("does the chat show the `zara_v`
  contact?") most likely reads "no" for exactly this reason: we send messages
  into a channel but never create the contact they belong to.

This is small, unfenced, and in the project's sweet spot: a registry-driven
addition (contact fields on the dialogue node, or a tiny `comms.contact`
node) plus runtime calls that all have declared, non-throwing shapes. It also
needs an in-game check (does a created contact render a proper card?) — the
same class of question as Cold Call's.

## 3. Technique coverage: what each part maps to

Everything from the r127 method applies; the new findings against it:

| Questline device | Verdict for mods |
|---|---|
| Chain of quests, shared world | **Structure, not nodes**: many quests per mod, `fx.claimQuest`, `entry.load`, `questsToComplete` all exist in our schema today. The unsolved *design* question is cross-quest world sharing — see §4. |
| Contacts appear / go AFK / Offline | **The gap (§2)** — SDK supports it today, unmodeled. |
| THE Choice → branch ending | Two Ways Out's proof (roadmap 7). Moddable shape: a conversation choice (`reply.input`) → `flow.branch` → two ending branches, or two chained ending quests. The engine's popup itself is engine UI; the mod's choice is a conversation beat. |
| Wake-a-target phishing (Part 8: victim offline → engine "Online User" mail template → then exploit) | Half-moddable **today**: `Network.UserActivity { userId, online }` is declared — an objective can wait for the target to come online. The *cause* is the engine's mail template; a mod's substitute is a story device (accomplice chat, timed beat) that implies the target woke up, then the trigger. |
| Paid contact ($100 transfer to Victor's IBAN) | Observable: `Bank.Transfer { amount, from, to }` is declared; an objective can wait on the transfer reaching a specific IBAN. |
| Firewall → router → hosts + **Splitter** (Part 11, 25 hosts) | **Already modeled**: `DEVICE_TYPES` includes `FIREWALL` and `SPLITTER` (and `PRINTER`) — `src/schema/common.ts:165`. The deepest network in any official quest is natively expressible. |
| pfsense hijack (kimai + Wireshark + JWT) | Engine GUI chain. Mod substitutes already proven by the questline itself: credential handouts in files (`readme.txt`, twice) or a contact. `Wireshark.Started/Stopped` are the only related triggers. |
| `wiglenet.py`, `net_tree.py` (GUI network maps) | Engine python scripts. `CommandDataMap` has no `python3` entry, so tool responses can't script their output; substitute: `world.customCommand` (the SDK: "your own mod commands fall back to permissive input/data"), or an NPC handout. |
| bcc.com article rotation between parts | The site is game-owned. Mod substitute: the mod's own site + `Browser.WebsiteOpened` triggers per page, with a "new edition" page revealed when the story moves on. |
| Suspicion / log cleaning / explorer GUI / Twotter clues | Engine-only, as r127 concluded. Note Twotter is load-bearing *again* repeatedly (three separate clue sources) — when the patch lands with `Twotter.removeUser`, its return to the editor gains real weight. |
| "Complete" button late in the line | Base-game quests formally complete; for mods fenced until the patch ships (docs/07). |

**Correction to r127's table, in passing:** r127 said quest 2's
Database-Manager ending hinged on `Database.DataUpdate` being "an in-game
question". The JS line adds evidence the *engine* observes app edits — and
Part 3's victim-offline twist independently confirms the engine models user
online-state. No change to our stance; both stay in the QA list.

## 4. The design question a campaign must answer: whose world is it?

In the official line, one world serves 13 quests. In a mod, **each quest gets
its own `CreateData()`** — so quest 2's `{{data.targetIp}}` is a *fresh*
random address, not quest 1's hotel. The chain machinery exists; the shared
world does not, yet. Honest options:

1. **(Recommended, YAGNI-compliant) One world-owner**: quest 1 creates the
   world; later quests never allocate — they only observe events and tell
   story. The campaign template teaches exactly this discipline, and it
   covers the official line's actual pattern (the *story* moves; the *world*
   was built once).
2. A shared-world feature (e.g. SaveStorage-backed tokens crossing quests) —
   a real design, only worth it if authors genuinely hit the wall of 1.

Any campaign template starts with 1 and says so in its sticky note.

## 5. Proposals (awaiting Zeis's go — nothing built this round)

- **A. The campaign template** (Advanced/Expert): three linked quests in one
  mod — Act I ends with `fx.claimQuest` into Act II, a new Kisscord contact
  arrives (needs B), Act III resolves with a branch. World-owner discipline
  per §4. This is the template genre every other template pretend-doesn't
  exist, and the JS line is its proof of concept.
- **B. The Kisscord contact lifecycle** (the §2 gap): contact creation +
  status in the editor — likely as fields/nodes in the dialogue editor's
  orbit rather than a new canvas node; exact surface decided in the round's
  plan. Includes the runtime additions, pins, and the in-game card-rendering
  check handed to Zeis.
- **C. Cookbook card "The Campaign"**: chaining, world-ownership, the
  wake-a-target pattern, paid-contact triggers. Rides along with either
  build round.

## 6. Explicitly not actions

- No Twotter return (still dropped until the patched build proves it).
- No `entry.complete` / completion work (fence, docs/07).
- No attempt to model the engine's popup UIs, NetTree, Wireshark packet
  view, kimai, or jwt_decoder — substitutes above are the honest surface.
- The Help-Harvey branch stays untranscribed; nothing in A–C depends on it.

---

**Status:** analysis + three proposals, awaiting Zeis. Gates at time of
writing: docs-only; typecheck clean; 1,219 tests green (last full run,
r130 + the reroute pin).
