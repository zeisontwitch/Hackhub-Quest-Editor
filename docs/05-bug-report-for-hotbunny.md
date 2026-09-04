# HackHub 1.1.2 — bug report and questions from a mod author

**Game:** HackHub 1.1.2 (Windows, x64)
**SDK:** `@hotbunny/hackhub-content-sdk@0.21.0`
**Context:** We are building a visual quest-mod editor that generates mods from
a node graph. Everything below was hit while making generated quests work, and
every item was reproduced in-game on a fresh save. Where we say "confirmed",
we mean a real playthrough, not a reading of the type declarations.

Thank you for offering to look at these. Ordered by severity.

---

# Part 1 — Bugs

## BUG 1 (critical): completing a mod-defined quest freezes the renderer

**This is the big one.** When a quest registered by a mod completes, the game
freezes and has to be killed. It happens on **both** completion paths:

- `AutoComplete = true` — freezes the instant the last objective ticks.
- `AutoComplete = false` + `HasCompleteButton = true` — the quest plays through
  perfectly, then freezes the moment the player clicks **Complete**.

The mod's own `OnComplete()` runs to the end *first*. Our last log line is
always our own "handing back to the game", after which nothing is written and
the window stops responding. No error, no stack.

### Minimal reproduction

The whole quest is: `AutoStart`, **one** objective, no rewards, no network. On
start it sends one mail. The objective completes on `Mail.Read`. The player
opens the mail — freeze.

```
[quest-editor] quest "HarbourJminimal" started (1 entry point)
[quest-editor] mail "One file, quietly" sent via Mail.send
[quest-editor] objective "read-brief" is listening for Mail.Read
[quest-editor] OnComplete: starting
[quest-editor] cleanup starting (complete): 0 item(s) to undo
[quest-editor] cleanup finished
[quest-editor] OnComplete: finished, handing back to the game
[quest-editor] objective "read-brief" completed by Mail.Read
  APPLICATION CLOSING          <- forced by us; the window was unresponsive
```

Note the ordering: `OnComplete` runs to completion *inside*
`completeObjective()`, before that call returns.

### What we eliminated first

Ten in-game runs, one variable each, fresh save every time:

| Hypothesis | Test | Result |
|---|---|---|
| Unhandled `destroyNetwork` rejection | guarded the promise | froze |
| Destroying a network with a live session | left the network standing | froze |
| Re-entrancy from our own flow | ran story beats before the tick | froze |
| The reward payment node | removed it | froze |
| The closing mail | removed it | froze |
| Quest-level `Rewards` | removed them | froze |
| `MaxClaim` | set to 1, and separately with no rewards | froze |
| Completing inside a `Mail.Sent` dispatch | completed on `Mail.Read` instead | froze |
| Anything in the quest at all | one objective, nothing else | **froze** |

### Our workaround

Quests that **never complete**: `AutoComplete = false`,
`HasCompleteButton = false`, objectives tick normally, the story ends with its
closing mail and payment, and the engine is never asked to retire the quest.
Confirmed working — full playthrough, no freeze.

We noticed the Nemesis Protocol mod does exactly this (`AutoComplete = false`,
`HasCompleteButton = false`, its one objective never ticked), which suggests
its author hit the same wall.

### Questions

1. Is completing a mod-registered quest supported in 1.1.2? Is there a working
   example anywhere?
2. Does completion require the quest to have been **claimed from the HackHub
   feed** rather than `AutoStart`ed? Every quest we generate uses `AutoStart`,
   and that is the one structural difference we cannot test from outside.
3. Is some state required before the engine can retire a quest — a claim
   record, a feed post, an employer — that a purely code-defined quest lacks?

---

## BUG 2 (high): a quest entry can never be removed from the quest list

Following from BUG 1: because a mod quest cannot complete, its entry stays in
the player's quest list **forever**, and there is no API to remove it.

Searching the whole 2,898-line `index.d.ts` for `removeQuest`, `abandonQuest`,
`retire`, `unregisterQuest` or `completeQuest` returns nothing. `Quest.claim()`
exists to *start* a quest and has no counterpart.

**Workaround.** We set `hidden = true` on every objective once the last one
ticks, which does clear the rows — so the engine *does* re-read the
`Objectives` array after the panel is built. But hiding all of them makes the
header read **`0/0 completed`**, because the counter counts visible rows. We
now leave one row visible, rewritten as a closing line ("Contract closed…"),
so it reads `1/1`.

**Question.** Is there a supported way for a mod to retire its own quest entry,
or to mark a story as finished without triggering BUG 1? This is the single
biggest quality-of-life gap for finite mod stories.

---

## BUG 3 (high): Twotter account records are written with `bio: undefined` and crash search permanently

Reproduced across seven QA rounds.

1. A quest-declared `TwotterAccountDefinition` becomes a `TwotterUser` in the
   save whose **`bio` is `undefined`**, even when the project supplies a bio.
   Every other field is filled correctly.
2. Twotter's search calls `.toLowerCase()` on that field for every record it
   tests. A search term matching the username short-circuits and survives
   ("test"); the next term crashes the game
   (`TypeError: Cannot read properties of undefined (reading 'toLowerCase')`).
3. The bad record is written to the **save**, so the crash **survives
   uninstalling the mod**.
4. No mod can repair it. There is no `Twotter.removeUser`.
   `getUserByUsername`/`getUserById` return a **copy**, so patching in place
   does nothing, and writing a complete record back via `addUser` under the
   same id left `bio: undefined` unchanged.
5. An account with no tweets crashes search identically, so it is the account
   record, not the post.

**Impact.** A mod can permanently corrupt a player's save just by declaring a
Twotter account. We removed Twotter support from our editor entirely because we
could find no safe way to use it.

**Suggested fixes.** Default `bio` to `""` when creating the record; and/or
guard the search comparison against undefined fields, which would also repair
existing broken saves.

---

## BUG 4 (medium): two event payloads do not match their declarations

Handlers written against the types get `undefined`.

**`RemoteConnection.Established`** — declared
`{ ip: string; service?: string }`. The actual runtime payload is:

```
{ targetIp: "34.119.8.27", targetPort: "22", fromIp: "191.76.152.109",
  user: {...}, t: "METASPLOIT" }
```

There is no `ip` field at all, so `data.ip` is always `undefined`.

**`Terminal.Lynx.Search`** — declared `{ query: string }`. The actual payload is
the search term as a **plain string**, so `data.query` is `undefined`.

You already document this class of mismatch for
`Terminal.SSH.Connected`/`Disconnected` with a `@deprecated` note saying the
payload is a bare string — so the pattern is known; these two just are not
covered.

**Question.** Is there a list of events whose runtime payload differs from the
declared interface? We are finding them one at a time, and each one costs a
full test round. Applying the same `@deprecated` note to the other affected
events would be enough.

---

## BUG 5 (medium): `QuestObjectiveDefinition.trigger` never fires

Declaring an objective with `trigger: { event, condition }` never completed it.
Calling `this.completeObjective(name)` from an `Events.on(...)` handler works
reliably.

We now emit both, since completing an already-complete objective is a no-op.

**Question.** Is the declarative form supported, deprecated, or planned? If it
should work, what are we doing wrong? It is the form the SDK documentation
implies, so other authors will hit this.

---

## BUG 6 (medium): mod-created networks persist in the save and win over new ones

`Network.createSubnetNetwork()` writes into the save and stays there after the
mod is uninstalled. A later build of the same mod calling
`createSubnetNetwork()` at the same address does **not** replace it — the older
network still answers `nmap`. We watched a port we had closed stay open, and an
account we had added never appear, across three re-exports.

`Network.destroyNetwork(ip)` is awkward to use as the fix. It is the **only**
cleanup call that returns a `Promise`, and permissions appear to be granted
only inside a call the engine made, so:

- destroy-then-create immediately loses the race — the destroy resolves *after*
  the create and deletes the new network;
- `await`ing the destroy puts the create outside the permission window and
  every later call is refused with
  `Mod "null" tried to use … without "…" permission`;
- doing it in `OnModPackageLoaded` and returning the promise **hung the game on
  the loading screen** — the loader awaits that hook, and `destroyNetwork` on
  an address with **no network** appears never to settle.

We also saw `destroyNetwork` never settle while the player had a live
meterpreter session into that network — no resolve, no reject.

**Workaround.** We removed fixed addresses from the editor entirely; every
network takes a `Network.randomIp()` allocated in `CreateData()`, so a mod
cannot collide with its own earlier build.

**Questions.**
- Is a mod expected to clean up its own networks, or does the engine do it when
  the mod is removed?
- Does `destroyNetwork()` settle when there is no network at that address?
- Is there a supported way to *replace* a network at an address?
- Is `OnModPackageLoaded` awaited? If so, is async work safe there at all?

---

## BUG 7 (low): `Shell.addCommandData` persists too, with the same "older wins" rule

A quest that had allocated a fresh address still had `whois` answer with the
address a *previous export* of the same mod had written, so the player scanned
a machine that no longer existed.

**Workaround.** We call `removeCommandData(command, input)` before every
`addCommandData` for the same input. That one returns `void`, so there is no
race.

**Question.** Is scripted command data meant to outlive the mod that registered
it? Is `removeCommandData` the right way to replace an entry?

---

## BUG 8 (low): a file placed by a mod cannot be deleted in game

A file placed in a user's home directory could not be deleted even as that
user — "This file cannot be deleted". It carries no `readonly`, `locked` or
`hidden` flag.

**Question.** What governs whether a meterpreter session may delete a file? We
noticed the game logs `Sys log file not found for <ip>` against machines with
no `logs` folder, and the Nemesis mod gives every device one; we copied that,
but do not know if it is related.

---

## BUG 9 (low): mail from an uninstalled mod stays in the inbox

The `Mail` namespace has no delete. Mail a mod sent is still in the player's
inbox after the mod is removed.

**Question.** Is there a supported way to withdraw a mail, or should a mod not
expect to clean up here?

---

## BUG 10 (low): a date deprecation warning that only appears with a mod installed

```
Deprecation warning: value provided is not in a recognized RFC2822 or ISO
format … _i: Wed Sep 02 2026 …
```

It does not appear with the mod uninstalled. It fires 30–90 seconds after a
mail is sent, when a browser or app screen is opened, and the stack is the
game's own date formatting. We never set a date on anything — neither
`MailDefinition` nor `QuestMailDefinition` has a date field.

**Question.** Which field is being parsed? Is a mod supposed to supply a
timestamp somewhere?

---

# Part 2 — Questions and feature requests

## Q1 (most wanted): can a mod script the player's *outgoing* mail?

In the base game, answering a mail or chat types out **pre-written** text as the
player presses keys — the "hackertyper" beat. For **chats** we can do this:
`KisscordMessageDefinition.isMine` and `WeeChatMessageDefinition.isMine` are
honoured and work well. For **mail** we can find no equivalent.

A player composing the final mail of our quest sees an empty compose window;
nothing reveals itself as they type. Nothing is broken — `Mail.Sent` fires and
the quest proceeds — the storytelling beat simply cannot happen.

The whole `Mail` namespace is `send`, `sendBounce`, `registerTemplate`,
`unregisterTemplate`, `getInbox`, `markAsRead`, `getPlayerEmail`.
`registerTemplate` is the nearest thing, but it is a template the player picks
from the compose dropdown — it cannot fire because they addressed a mail to a
particular contact, and its `fields` are editable inputs rather than revealed
prose.

- Is the pre-written reply available to mods for mail at all, or is it reserved
  for base-game content?
- If it exists, what triggers it? Is it tied to `QuestMailDefinition.replyable`
  and a Reply button — i.e. only reachable by replying to an existing mail,
  never by composing a fresh one?

**This is the single feature we would most like.** Today an author can script
every inbound mail and every chat line, but nothing the player writes.

## Q2: does `QuestMailDefinition.replyable` produce a Reply button?

`Mail.send()` takes a `MailDefinition`, which has **no** `replyable` field. Only
`QuestMailDefinition` (used via `Quest.Mails` + `this.sendMail(index)`) has one.
We route replyable mail through `sendMail` for that reason, but we have never
seen the button appear. Is it live? What event does a reply raise?

## Q3: what makes a machine exploitable?

Getting a meterpreter session needed, in order: at least one user on the device
(else "Port 22 could not be accessed"), then a guest account **or** an online
user (else "No guest account or online user found").

In the base game's early missions a session lands directly in an **admin
account on a machine with no other users** — no guest, nothing to switch to, no
password to crack. That is what our beginner template wants to reproduce.

- Is a guest account **required**, or is a single online named user with
  `acceptReverseTCP: true` enough? The error message reads as though either
  will do, and our single-account server depends on it.
- How do the early missions produce an admin-only box? Same API, or something
  not exposed to mods?
- Is there a reason routers should not get a default user schema? (Nemesis
  gives one to all 26 of its devices and none of its 7 routers.)

## Q4: what version format does metasploit accept?

A two-part version (`OpenSSH 7.2`) is refused with
`Invalid version for option: Version`. Three parts (`7.2.0`) is accepted. A
letter (`7.2p2`) has been reported to stop metasploit matching an exploit at
all. The version shown by `nmap -sV` is also truncated relative to what we send.

Is `x.y.z` required? Do particular versions map to particular exploits, or is
any well-formed version exploitable? Is the `nmap` truncation intentional?

## Q5: is there a logging or suspicion API?

We can find no way for a mod to write to `sys.log`, or to raise the player's
suspicion/trace level. The game clearly has both concepts. Are they exposed to
mods, or planned to be?

---

# Part 3 — What would help us most

Not bugs, just where a small change would unblock a lot.

1. **A supported way to finish a mod quest** (BUG 1 + BUG 2). Everything else
   here has a workaround; this one shapes every quest anyone builds.
2. **Payload/declaration parity** (BUG 4), or just the `@deprecated` note
   extended to the events that need it. Each mismatch costs a full test round
   to find.
3. **Scripted outgoing mail** (Q1) — the biggest storytelling gap.
4. **A `Twotter.removeUser`, plus a `bio` default** (BUG 3), so a mod cannot
   permanently damage a save.

Happy to supply the reproduction mods, full logs, or run any test build — just
say what would be useful.
