# r232 — "Dead Air": the contact-driven template (phreaking + social engineering)

**Status: shipped (2026-09-26), fail route reworked in r233.** Review passed
with two corrections that shaped the build (see "As-built deltas").

## r233 — the fail route rework (Zeis, post-ship review)

Zeis: "wouldn't a reroute nodule work here, to bring together both wires and
run it into the singular success route after trying again? We could even hook
in our new Timer node and make the player wait a day before calling again."

- **Verified in the shipping runtime first** (`src/compiler/runtimeSource.ts`):
  flow walks *out of* each fired node (`flowOuts`); there is no target-side
  index and no started-guard — a node with two incoming flow wires runs once
  per playthrough, and in this quest the two feeding wires (first call's
  `out`, retry call's `out`) are mutually exclusive, because a call ends
  either normally or on the failed line. Converging wires are safe; this is
  now Dead Air's first, pinned by a dedicated test block.
- **The reroute as merge point does not exist**: its own blurb says it is a
  tidy point to *fan a wire out* to several nodes — one in, one out. The
  reconverge is two edges into one node's `in`, directly.
- **The Timer is a real in-game mechanic, not just a beat**: `flow.timer`
  mode `after`, `days: 1` arms a job on the game's clock (the Scheduler
  API, r172/r173 QA) and the flow resumes when the in-game day comes.
  Caveat (the node's own): a game build without the Scheduler API will not
  fire timers — the fail route then cannot resume.
- **Shape**: cut ending (call + half pay + warning close) removed; added
  the "call again tomorrow" drip, the day Timer, and the retry call (branch
  `"second"`, same word check with `wrongRoute: "retry"` + a coaching
  `failureText` — fumbleable in the call, never dead-ending the quest).
  29 → 28 nodes; one payment, one close.

## As-built deltas (implementation findings, all verified)

1. **Company renamed to Fennmark Freight.** "Halvard Freight" is The Long
   Game's core story (folded in 1998) — the approved name collided with a
   shipped template's world.
2. **No "add the broker" objective.** Declarative Kisscord NPCs are
   registered by the engine from the chat chain; whether it fires
   `Kisscord.FriendAdded` at registration (completing the objective
   instantly) is unverifiable from the SDK. The broker reaches out instead
   (Cold Call's proven shape); objectives = 4 (nmap, hydra, cat, mail).
3. **Fail route ends the quest instead of a retry call.** The retry shape
   needs two flow edges converging on one node's `in` — no template does
   that, and the engine's behaviour on a double-fed flow input is
   unverified. The failure route is a real branch instead: line goes dark
   → Ilsa pulls out → the "cut" call → half the fee (2,300) → a
   warning-tone close. The "Two Ways Out" shape, carried inside one call
   (README Next-up #2 now notes Dead Air ships it too).
4. **The password is the motto's last word — "rehearsal".** The engine's
   hydra wordlist is client-side and unverifiable here; "rehearsal" is the
   only word proven crackable (Six Tries ships it). The nmap banner MOTD
   carries the motto, drip 2 points at the last word.
5. **29 nodes, 4 objectives** (plan said ~25/5 pre-delta); four phone
   branches on one quest `dialog`: `default` / `gate` / `close` / `cut`.

Also recorded in docs/03 §6 (r232 verification): `PhoneApp` is a phone
home-screen app, not a dial mechanism; the SDK has no player-dial surface,
and the main game's dial UX is asked about explicitly as a new question
line.

Roadmap Next-up #2: *"Contact-driven story" template. Cold Call (r122)
covers the conversation shape — Kisscord plus WeeChat, no break-in. The
phone-brief + objective-gated-drip variant from the original spec is still
open.*

Zeis's direction: **not a tutorial — a real quest.** Advanced. New cast. A
mixture of a **phreak attack** and **social engineering** over phone calls
and e-mails, plus a **Kisscord market thread** where the player buys
information from another hacker NPC. The social-engineering climax: the
player gets on the line with extension 2214 and talks their way through a
**branching call with a failure route** to get the name. Every comms mode
must be load-bearing.

## Verified mechanics (checked in schema/SDK — the load-bearing ones)

- **The failure route is a real flow branch.** `comms.dialogue`'s sources
  are `[out, failure]` — the "Wrong" output. A phone line with a typed
  answer (`input`) carries `wrongRoute`: `"retry"` (ask again, with
  `failureText`), `"end"` (the call dies), or **`"wrong"` (the node's
  `failure` output fires)** — so the quest flow can branch on a botched
  line. `options` on a line give in-call branching (`switchBranch` /
  `nextIndex` / `isEnd`).
- **Precedent:** the official Cryptographer Hunt does exactly this scene —
  "phone social engineering with a fail route on a wrong choice → second
  call" (docs/plans/r127). The engine shape is proven in shipping quests.
- **Call direction (honest nuance):** the quest's script starts the call
  (`quest.createDialog(branch)`) — the engine has no player-dial event
  (no phone entries in `ModEventMap`; docs/03 carries the open question).
  Experience-wise the phone rings and the conversation plays — the same
  shape as the official quest.
- **The drip** = the objective's `done` wire delivers the next message.
- **Kisscord chains** play in the in-game Kisscord chat (no website, no new
  surface — the same mechanism as Cold Call's beat). A message with
  `playerAction: "send"` makes the player **type out** `playerText`
  (hackertyper-style) and **pauses the chain until they do**; later
  messages play only after. The "trade" is narrative: what the player
  types *is* the price.
- **`Kisscord.FriendAdded`** payload `{ id, username, isFriend }` — the
  "add the broker" objective matches `username`.
- **Phreak payloads:** `Terminal.NmapScan { ip, … }`,
  `Terminal.Hydra { ip, port, wordlistFile, credentials { username,
  password } }`, `Terminal.Cat { name, … }`. **`Mail.Sent`** carries
  `to` **and** `content` — two-condition triggers expressible.
- All template invariants apply automatically (`it.each(TEMPLATES)`); the
  registry id list is pinned in `templates.test.ts`.

## The quest: "Dead Air"

A single unlisted phone line is running blackmail out of **Halvard
Freight's** call-centre PBX. **Ilsa Marek**, a corporate investigator,
can't prove who operates it — and doesn't trust anyone she hasn't
verified, so **each instruction is released only when she's seen the last
one done**. The drip isn't a teaching device; it's the character. New cast
throughout (no Brandts).

### Information economy (every mode is load-bearing)

| Step | Mode | What it gets the player |
|------|------|--------------------------|
| scan the PBX | terminal (phreak) | the service list; the company slogan hidden in the banner |
| crack the ssh login | terminal (phreak) | in — the slogan is the password |
| read the routing config | terminal (phreak) | **extension 2214** + the night-shift codeword **"alpine"** (and how to call for it) |
| the SE call to 2214 | **phone** | the name — **Kofi Mensah** — if the player says the right thing |
| the market | **Kisscord** | the *verified* identity — license **4471** — priced at the extension |
| final verification | **e-mail** | the job closes only on the verified identity, sent to Ilsa's new address |

No mode is decorative: without the phreak loot the call check fails,
without the call the market has nothing to verify, without the market the
final mail is unwritable.

### Beats (single quest, ~25 nodes, `autoStart: true`, no websites)

1. **Claim → Call 1** (branch `"default"`): Ilsa's brief — who she is,
   why the line matters, the one-at-a-time rule. Piece 1: the PBX's IP.
2. **Drip 1 (e-mail) → o1**: "Find out what it's running." `Terminal.NmapScan` on the IP; the authored scan output carries the banner slogan.
3. **Drip 2 (e-mail) → o2**: "SSH on 22, user `admin`. Password is the slogan — they never change it." `Terminal.Hydra`, `credentials.password` contains the slogan.
4. **Drip 3 (e-mail) → o3**: "The routing config — the file with *sip* in the name." `Terminal.Cat`, `name` contains `sip`. The config: extension 2214, night-shift handover, codeword **alpine** — "call for alpine."
5. **Drip 4 (e-mail) → Call 2** (branch `"gate"`, **the SE call**): "Call 2214. Get the name."
   - The assistant answers. One options line ("How can I help?" → *the night-shift transfer* / *report a fault* → "Faults go to 9110, not me." loops back) — teaches in-call branching.
   - "The supervisor only takes night-shift calls. **Who's calling for?**" — typed answer, `matchMode: "contains"`, expected **alpine**, `wrongRoute: "wrong"`.
   - **Success** → the assistant: "Kofi Mensah. That's all I'll say." → `out`.
   - **Failure** → the `failure` output: the line goes dead.
6. **Fail route** (from Call 2's `failure`): **fail drip** (e-mail, Ilsa): "That was the wrong move — the line's dark, and he knows someone's knocking. One more chance: ask about alpine *before* they ask you." → **Call 3** (branch `"second"`): the same line, with a hint line planted; the answer check is now `wrongRoute: "retry"` with `failureText` ("He's not buying it. Check the config again — how do you call for the night shift?") — the player can retry in the call, so the quest never dead-ends. `out` → drip 5.
7. **Drip 5 (e-mail) → o4 → the market**: "A name isn't proof. **@wren** on Kisscord verifies identities — add them. They don't take money; they take what you've got." `Kisscord.FriendAdded` on `username`. Then the **Kisscord market** chain (in-game chat, no website): broker greeting → "What do you want?" → **the player types** "extension 2214, Halvard PBX" (`playerAction: "send"` — the chain pauses until they do; the phreak loot is the price) → the broker delivers the verified identity: "Kofi Mensah, **license 4471**. Three firms, one trick."
8. **Drip 6 (e-mail) → o5**: "The full identity, to my new address. One line." `Mail.Sent` → `to` contains the backup address **and** `content` contains "4471" — the two-condition trigger (only the market's number passes it).
9. **Call 4** (branch `"close"`): Ilsa calls. It's done, the blackmail dies, the money's yours. → **pay** → closing toast.
10. **Note** — what this quest did (see Teaching payload).

**World:** one `world.network` (the PBX: ssh user `admin`/slogan, the
`sip` routing file — exact schema fields confirmed at implementation, per
the QA-export wifi-node shape). **Phone script:** four branches on one
quest `dialog` — `default` / `gate` / `second` / `close`.

### Teaching payload (carried by the note, framed as "what you just did")

1. **The drip** — the objective's `done` wire delivers the next piece.
2. **The SE call** — branching options inside a call, a typed check with a
   real failure route on the node's `failure` output, and a second call
   with in-call retry — the Cryptographer Hunt shape.
3. **The market** — a Kisscord chain that pauses for a player-typed
   message; information for information, no money system.
4. **The phreak loop** in miniature: scan → crack → read.
5. **A two-condition trigger** (step 8).

## Changes

1. New `src/templates/deadAir.ts`.
2. `src/templates/index.ts` — import + registry entry after `cold-call`,
   exact `nodeCount`.
3. `templates.test.ts` — `dead-air` added to the pinned id list.
4. README — build status "14 templates (12 playable + 2 reference)";
   Next-up #2 marked done.
5. Stamp `2026-09-25.r232` + manual sweep + QA export regen (stamp-only;
   the handbook is the dedicated agent's round).

## Gates and falsify

- All `it.each(TEMPLATES)` invariants apply automatically (wiring covers
  the new `failure` edge; overlap/determinism/nodeCount as usual).
- Falsify where a guard exists: nodeCount drift → red; mistyped phone
  branch → check `computeWarnings` coverage (verify at implementation);
  broken handle → wiring test red.
- `npm run typecheck`, full `npm test`, `npm run build`; commit + push.

## Resolved / open

- Title **Dead Air**, cast **Ilsa Marek / @wren / Kofi Mensah / Halvard
  Freight** — approved (Zeis, v3 pass).
- Difficulty **Advanced** — approved.
- Open: nothing structural. If the `second`-branch retry turns out to
  read as too easy (the answer is on the canvas), the fail route stays —
  the teaching point is the *route*, not the difficulty.
