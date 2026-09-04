# Questions for the HackHub developers

Things we could not answer from the SDK's type declarations, from a working
reference mod, or from in-game testing. Each entry says what we observed, what
we tried, and what we are doing in the meantime — so a developer can answer
quickly and we can tell straight away whether an answer changes anything.

Ordered by how much a clear answer would be worth.

---

## 1. Do mod-created networks persist in the save, and how should a mod replace one?

**What we see.** `Network.createSubnetNetwork()` writes a network into the save
file, and it stays there after the mod that created it is uninstalled. A later
build of the same mod calling `createSubnetNetwork()` at the same address does
**not** replace it — the network already in the save answers `nmap`, so a mod
re-exported with a changed port, user or version is answered by its own older
build. We confirmed this over several rounds: a port we had closed still showed
open, and an account we had added never appeared.

**What we tried.** `Network.destroyNetwork(ip)` before creating. That returns a
`Promise`, and the engine appears to grant a mod its permissions only while it
is inside a call the engine made — so:

- firing the destroy and creating immediately loses the race (the destroy
  resolves *after* the create and deletes the new network);
- `await`ing the destroy puts the create outside the permission window, and
  every subsequent SDK call is refused with
  `Mod "null" tried to use … without "…" permission`;
- doing the destroy in `OnModPackageLoaded` and returning the promise hung the
  game on "loading mods" — the loader awaits that hook, and
  `destroyNetwork` on an address with no network never settled.

**Where we landed.** We removed fixed addresses from the editor entirely.
Every network now takes a game-allocated address (`Network.randomIp()` in
`CreateData()`), so a mod cannot collide with its own earlier build.

**What we would like to know.**
- Is a mod expected to clean up its own networks, or does the engine do it when
  the mod is removed?
- Does `destroyNetwork()` resolve when there is no network at that address, or
  does it hang? (Our reading of the hang says the latter.)
- Is there a supported way to *replace* a network at an address?
- Is `OnModPackageLoaded` awaited by the loader? If so, is it safe to do async
  work there at all?

---

## 1b. Does `Shell.addCommandData` also persist in the save?

**What we see.** Yes, apparently, and with the same "older entry wins" rule as
networks. A quest that had allocated a fresh address still had `whois` answer
with the address a *previous export* of the same mod had written, so the player
scanned a machine that no longer existed.

**Where we landed.** We call `removeCommandData(command, input)` before every
`addCommandData` for the same input. That one returns `void` rather than a
promise, so unlike the network case there is no race to lose.

**What we would like to know.** Is scripted command data expected to outlive the
mod that registered it? Is `removeCommandData` the right way to replace an
entry, or is there an overwrite we should be using instead?

---

## 2. Is `QuestObjectiveDefinition.trigger` honoured?

**What we see.** Declaring an objective with
`trigger: { event, condition }` never completed it in build 1.1.2. Calling
`this.completeObjective(name)` from an `Events.on(...)` handler works reliably.

**Where we landed.** We emit both: the declarative `trigger` *and* an imperative
listener. Completing an already-complete objective appears to be a no-op, so the
redundancy is free.

**What we would like to know.** Is the declarative form supported, deprecated,
or planned? If it works, what are we doing wrong?

---

## 3. Does `QuestMailDefinition.replyable` produce a Reply button?

**What we see.** `Mail.send()` takes a `MailDefinition`, which has no
`replyable` field. Only `QuestMailDefinition` — the shape used by
`Quest.Mails` + `this.sendMail(index)` — has one. We route a replyable mail
through `sendMail` for that reason, but we have not confirmed the button
appears.

**What we would like to know.** Is `replyable` live? And what event does a
player's reply raise — is there something a quest can trigger on?

---

## 4. What does the player's reply actually go through?

**What we see.** In the base game, answering a mail or a chat message types out
**pre-written** text as the player presses keys. In the SDK we can find
`KisscordMessageDefinition.isMine` and `WeeChatMessageDefinition.isMine`
("True if the player sends this message"), which we assume is that mechanic.

**What we tried, and what happened (r78).** QA played a full quest whose final
beat is mailing a contact. Composing that mail, the header and body stayed
blank - no pre-written text revealed itself as they typed. The quest still
completed (`Mail.Sent` fired, the attachment arrived, the scripted reply came
back), so nothing is broken; the storytelling beat simply never appeared.

We have the scripted-reply mechanic in our editor for **chats**, where `isMine`
is honoured. For **mail** we can find no equivalent. The whole `Mail` namespace
is `send`, `sendBounce`, `registerTemplate`, `unregisterTemplate`, `getInbox`,
`markAsRead`, `getPlayerEmail`. `registerTemplate` is the closest thing, but it
is a **template the player picks from GoMail's compose dropdown** - it cannot
fire because the player addressed a mail to a particular contact, and its
`fields` are editable inputs rather than hackertyper-revealed prose.
`QuestMailDefinition.replyable` (question 3) would put a Reply button on an
incoming mail, but we have never seen that button appear, and it says nothing
about pre-writing the player's outgoing text.

**What we would like to know.**
- Is the hackertyper-style pre-written reply available to mods for **mail** at
  all, or is it reserved for base-game content?
- If it exists: what triggers it? Is it tied to `replyable` and the Reply
  button - i.e. only reachable by replying to an existing mail, never by
  composing a fresh one to a known address?
- If it does not exist for mail, is `registerTemplate` the nearest supported
  substitute, and is it meant for narrative pre-writing or only for
  phishing-style templates the player chooses deliberately?

This is the single feature we would most like to support: a scripted outgoing
mail is a major storytelling tool, and today an author can script every inbound
mail and every chat line but nothing the player writes.

---

## 5. `Terminal.Lynx.Search` sends a bare string, not the declared object

**What we see.** The declarations say
`"Terminal.Lynx.Search": { query: string }`. In game the payload is the search
term as a plain string, so a handler reading `data.query` gets `undefined`.

**Where we landed.** Our condition matcher falls back to the payload itself when
it is not an object, so both shapes work.

**What we would like to know.** Which is correct — the declaration or the
behaviour? And are there other events whose real payload differs from the
declared one? A list would save us finding them one at a time.

---

## 6. What exactly does metasploit accept as a port version?

**What we see.** A two-part version (`OpenSSH 7.2`) is refused with
`Invalid version for option: Version`. Three parts (`7.2.0`) is accepted. A
letter (`7.2p2`) has been reported to stop metasploit matching an exploit at
all. The version shown by `nmap -sV` is also truncated relative to what we
send.

**What we would like to know.** Is `x.y.z` the required format? Are there
version values that map to specific exploits, or is any well-formed version
exploitable? And is the truncation in the `nmap` display intentional?

---

## 7. What must be true for a machine to be exploitable?

**What we see.** Getting a meterpreter session needed, in order: at least one
user on the device (otherwise "Port 22 could not be accessed"), then a guest
account or an online user (otherwise "No guest account or online user found").
`Network.createDefaultUserSchema(users, { guest: true })` supplies that, and the
reference mod uses it on all 26 of its devices and none of its 7 routers.

**Why this matters to us now (r78).** In the base game's early missions, a
meterpreter session lands directly in an **admin account on a machine with no
other users** — no guest, nothing to switch to, no password to crack. That is
the experience our beginner template is trying to reproduce, and it is the
difference between our beginner and advanced templates.

Calling `createDefaultUserSchema(users, { guest: true })` unconditionally
worked against that: QA's server showed `root`, `guest` and `admin`, and the
exploit dropped the player into `guest`, forcing a password crack the beginner
template deliberately does not teach. We have made it opt-out per device, so a
machine can now ship with exactly one account — `admin`, `online: true`,
`acceptReverseTCP: true`.

**What we would like to know.**
- Is the default user schema the intended way to make a machine exploitable?
- Is a guest account **required**, or is a single online named user with
  `acceptReverseTCP: true` enough? This is the one we most need answered: our
  single-account server depends entirely on the second path working, and
  "No guest account or online user found" reads as though either will do.
- How do the base game's early missions produce an admin-only box? Is that the
  same API, or something not exposed to mods?
- Is there a reason routers should not have a default schema?

---

## 8. Can a mod delete a file it created?

**What we see.** A file placed in a user's home directory could not be deleted
in game — "This file cannot be deleted" — even as that user. The file carries
no `readonly`, `locked` or `hidden` flag.

**What we would like to know.** What governs whether a meterpreter session may
delete a file? We noticed the reference mod gives every device a `logs` root
folder and the game logs `Sys log file not found for <ip>` against machines
without one; we have added it, but do not know if it is related.

---

## 9. Is Twotter available to mods?

**What we see.** The declarations include a `Twotter` namespace and
`Twotter.*` events, but no way to *create* a profile. Searching a handle that
has no profile behind it crashes the game
(`Cannot read properties of undefined (reading 'toLowerCase')`) and corrupts
the save.

**Where we landed.** We removed Twotter support from the editor and stopped
templates advertising handles.

**What we would like to know.** Is Twotter intended to be moddable? And can the
crash on an unknown handle be guarded, since a mod can trigger it just by
mentioning a name?

---

## 10. Mail sent by a removed mod stays in the inbox

**What we see.** Mail a mod sent is still in the player's inbox after the mod is
uninstalled. The `Mail` namespace has `send`, `getInbox`, `getPlayerEmail`,
`registerTemplate` and `unregisterTemplate` — no delete.

**What we would like to know.** Is there a supported way to withdraw a mail, or
should a mod not expect to clean up after itself here?

---

## 11. A date warning that only appears with a mod installed

**What we see.** With any quest-editor mod installed, the renderer logs:

```
Deprecation warning: value provided is not in a recognized RFC2822 or ISO
format … _i: Wed Sep 02 2026 …
```

It does not appear with the mod uninstalled. It fires 30–90 seconds after a
mail is sent, when a browser or app screen is opened, and the stack is the
game's own date formatting. We never set a date on anything: neither
`MailDefinition` nor `QuestMailDefinition` has a date field.

**What we would like to know.** Which field is being parsed? Is there something
a mod supplies that should be a timestamp and is not?

---

## Answered / withdrawn

Kept so the same ground is not covered twice.

- **Why did our mod not load at all?** The loader looks for the Bootstrap class
  on the module's default export, installed as a lazy getter *before* anything
  registers — the shape esbuild produces. Assigning `module.exports` after
  registration meant the mod loaded with no identity and every permission was
  refused. Resolved by matching esbuild's output.
- **Which mail API delivers?** `Mail.send()`. Resolved by testing.
