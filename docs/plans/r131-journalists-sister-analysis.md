# r131: the Journalist's Sister questline — analysis and proposals

Zeis finished the playthrough and transcribed all of it:
[`reference/Official-Quest/8-JournalistsSisterQuestline.md`](../../reference/Official-Quest/8-JournalistsSisterQuestline.md)
(1,845 lines, 13 quests). This was predicted to be the most valuable
transcription of all (r127 §9) — the one quest line with **hardcoded names**,
i.e. the closest the game comes to doing what *mods* do. That prediction held,
and the line exposes one genuine node-shaped gap in the editor that the SDK
already supports **today**. Docs-only round: findings first, three proposals
since approved by Zeis. No code changed, `EDITOR_BUILD` unchanged
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
  (relevant to `docs/04`). For mods the **flag** ships today:
  `hasCompleteButton` is in the pinned SDK and wired end-to-end in the
  editor (inspector checkbox → compiler → runtime). Whether the click
  *formally completes* is the docs/04 engine-bug question — QA item;
  templates pin it `false` deliberately.
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
| "Complete" button late in the line | The **flag** ships today: `hasCompleteButton` is pinned-SDK and wired end-to-end in our editor. Whether the click *formally completes* is the docs/04 engine bug — QA item; templates pin it `false`. |

**Correction to r127's table, in passing:** r127 said quest 2's
Database-Manager ending hinged on `Database.DataUpdate` being "an in-game
question". The JS line adds evidence the *engine* observes app edits — and
Part 3's victim-offline twist independently confirms the engine models user
online-state. No change to our stance; both stay in the QA list.

## 4. The design question a campaign must answer: whose world is it?

First, what is **not** open — the flow. Journalist's Sister 1 ending and
Journalist's Sister 2 beginning is the shipped, verified part: a mod is a
`quests` array, the TopBar's **Add Quest** button creates siblings today,
and the compiler emits the full gate set — `autoStart` (start without
player action), `questsToComplete` + `hackhubPost` (the SDK's own chaining
idiom: the quest's Hackhub feed post appears once its prerequisites are
met, like the built-in side quests), and `Quest.claim(name)` for
programmatic starts from triggers or website buttons (`compile.ts:501–510`,
d.ts ~1501). Chaining was never the doubt.

The open question is one level deeper: **the stage, not the script**. Each
quest class carries its own `CreateData()` ("Populated at runtime by the
game engine", d.ts 1457/1486) — and the SDK does not say whether quest 1's
creations (its networks, hosts, files) are still there when quest 2
begins. In the official line the world clearly persists (the hotel network
from Part 2 is the target in Part 10) — but that line is hardcoded engine
code, so it proves nothing about what SDK mods get. The failure mode for
an author who assumes wrong: quest 2's `CreateData()` builds and
re-randomizes — two half-worlds, and `{{data.targetIp}}` pointing somewhere
new. Honest options:

1. **(Recommended) One world-owner**: quest 1 creates the world; later
   quests never allocate — they only observe events and tell story. The
   campaign template teaches exactly this discipline, and it covers the
   official line's actual pattern (the *story* moves; the *world* was
   built once). Note the discipline is the correct authoring model either
   way; what it cannot conjure is persistence if the engine drops quest
   1's world — which is why the in-game check below exists.
2. A shared-world feature (e.g. SaveStorage-backed tokens crossing quests —
   the SDK itself suggests SaveStorage for "per-playthrough mod progress",
   d.ts 2178) — a real design, only worth it if authors genuinely hit the
   wall of 1, or if the in-game check comes back badly.

Any campaign template starts with 1 and says so in its sticky note.

**Zeis's working model (r131, untested — "I haven't tested it, but I have a
feeling"):** each quest is standalone; the only special thing is that the
end of one functions as the trigger to start the next; and the world gets
destroyed once the final quest of the entire line is finished — "that way a
player can backtrack if they need to, but when the quest line is over, it's
over." Note what this model actually claims: the world **accumulates
through** the line (backtracking works) and is torn down **at line end** —
which is exactly the case option 1 needs. His model, if it verifies, makes
the world-owner discipline the natural fit and explains the official
line's behavior for free.

**Decision rule for the campaign template.** The two-part in-game check
below decides:

- **Mid-line check says "persists"** → build the campaign world-owner
  style (option 1). Elegant, matches the official line.
- **Mid-line check says "replaced/cleared"** → every quest builds its own
  stage in its own `CreateData()` and references only what it built. This
  fallback is robust under *either* model; its only cost is that earlier
  stages linger as clutter if worlds actually accumulate.
- **Line-end teardown** is informational either way: the SDK has no
  line-end API, so there is nothing for a mod to do about it (and the
  mod's own cleanup hook, `OnModPackageUnloaded`, is an *uninstall* event
  — a different thing entirely; don't conflate them).

**In-game check for Zeis's QA list (two parts):** (A) mid-line — in a
two-quest mod, once quest 2 has started, is quest 1's network still
reachable (ping / browser), or gone? (B) line-end — once the final quest
of a multi-quest mod has run through, is the world torn down ("when the
quest line is over, it's over")?

## 5. Proposals (approved by Zeis — build queued after the r132 audit)

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

**Status:** analysis + three proposals, approved by Zeis. Gates at time of
writing: docs-only; typecheck clean; 1,219 tests green (last full run,
r130 + the reroute pin).
