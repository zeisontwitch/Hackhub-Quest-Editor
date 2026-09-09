# Response to the quest-editor bug report

Thanks for this. It is the most useful report we have had from a mod author: every
item was reproducible, and tracing them turned up two engine bugs that also affect
our own DLC content. Below is what we found for each item, what has been fixed, and
what you will need to change on your side.

Three of your items were misdiagnosed. In each case the symptom was real but the
cause was somewhere else, and the fix you suggested would not have worked. Those are
called out explicitly, because two of them change what you should do next.

Everything below is fixed in the working build and will ship in the next patch. The
version string was not bumped between the build you tested and our internal one, so
"1.1.2" is unfortunately not a reliable way to tell whether you have a given fix.

---

## New and changed SDK surface

Quick reference before the detail. All of this is in the regenerated
`content-sdk.d.ts`.

| API | Status | Notes |
|---|---|---|
| `this.complete()` | new | Finish the quest from its own code |
| `this.retire()` | new | Remove the quest entry entirely, no completion |
| `Quest.unclaim(name)` | new | Static counterpart to `Quest.claim` |
| `Twotter.updateUser(id, patch)` | new | Patch a stored account in place |
| `Twotter.removeUser(id)` | new | Delete an account and everything referencing it |
| `Mail.remove(id)` | new | Withdraw a mail permanently |
| `Mail.send(...)` | changed | Now returns the new mail's id, or `null` |
| `MailDefinition.replyable` | new | Reply button on mail sent via `Mail.send` |
| `Network.destroyNetwork(ip)` | changed | Returns `Promise<boolean>`, always settles |
| `NetworkFileMap.deleteable` | new | Opt a placed file out of remote-file protection |
| `RemoteConnectionEvent` | changed | Correct payload shape, replaces the old declaration |
| `"Terminal.Lynx.Search"` | changed | Now typed as `string` |
| `"Terminal.DnsHistory"` | new | Was emitted but not declared |

---

# Part 1: bugs

## BUG 1 (critical): completing a mod quest freezes the renderer

**Confirmed, and fixed.** Your diagnosis was right about everything you could see
from outside, including that the mod's own code is not involved.

The cause is a feedback loop between the desktop objectives panel and the quest
adapter. When a quest completes it leaves the active list immediately, which would
unmount its card before the outro animation could play, so the panel keeps the
completed quest rendered for a short window and rebuilds it from its id on every
render. Rebuilding goes through `Quests.Manager.GetById`, which constructs a fresh
quest instance every time, and for a pack's quest that constructor is the adapter's
code. The adapter was reconstructing the quest's `Employer`, and an employer created
without an avatar draws a random one. Drawing an avatar records it, which is a write
to the same store the panel subscribes to. So: write, re-render, rebuild, draw,
write. An unbounded synchronous loop on the main thread, which is why you got no
error and no stack.

This also explains why every variable you eliminated made no difference. Nothing in
the quest mattered, only that the quest completed at all.

Three changes:

1. The employer avatar now falls back to the saved face for an empty string as well
   as for `undefined`. A partial fix for this landed internally on 30 August and is
   almost certainly not in the build you tested, which is the main reason you were
   able to hit this at all.
2. The objectives panel now memoizes the rebuild instead of doing it every render,
   so a side effect in a quest constructor can no longer feed itself. This is the
   structural half: the specific write is gone, but the panel should not be the
   thing that turns the next one into a hang.
3. `this.complete()` is now available, so a quest can finish itself without needing
   `AutoComplete` or the Complete button.

Answers to your three questions: yes, completing a mod-registered quest is supported
and is what our own DLC questlines do. No, it does not require the quest to have
been claimed from the feed; `AutoStart` is fine and is not the structural difference
you were looking for. And no, there is no hidden claim record or employer state
required. It was the avatar.

You should be able to drop the never-complete workaround entirely.

## BUG 2 (high): a quest entry can never be removed

**Confirmed, and fixed.** The engine has had `Unclaim` all along; it was simply
never exposed. Three ways in now:

- `this.complete()` finishes the quest properly: rewards paid, `OnComplete` runs,
  listeners dropped, and the entry stays in the player's history marked done. This
  is what you want for a story that ends.
- `this.retire()` removes the entry outright, as though it had never been claimed.
  Its objectives, tweets and chat messages go with it. Use this to clean up, not to
  end a story: players expect a finished quest to still be there.
- `Quest.unclaim(name)` is the static counterpart to `Quest.claim`, matching by
  name so you can clear an entry a previous build of your mod left behind and whose
  id you no longer have.

With BUG 1 fixed you should not need the hidden-objectives trick or the rewritten
closing row, so the `0/0 completed` header problem goes away with it.

## BUG 3 (high): Twotter accounts corrupt the save

**Confirmed as a save-corrupting bug, but the field you identified is not the one
that crashes.** This matters, because defaulting `bio` to `""` would not have fixed
it.

You were right that `bio` is never written. The adapter mapped `displayName` onto
`name` and dropped everything else it did not have a slot for. But Twotter's People
search does not touch `bio` at all; it reads `bio` only for display, and that read
is already guarded. What it does read is `surname`, unguarded, and `surname` was not
being written either:

```
u.name.toLowerCase().includes(term) ||
u.surname.toLowerCase().includes(term) ||     <- throws here
```

That also explains the behaviour you saw precisely: a term matching the username
survives only when it matches `name` first, because `||` short-circuits before
reaching `surname`. The next term reaches it and throws. The throw happens inside a
`useMemo`, so it escapes as a render error and takes the site down, and since the
row is persisted it stays down after your mod is gone.

Everything else in your report was correct: no `removeUser`, the getters return
copies so patching does nothing, and `addUser` skips a username it already has, so
you had no way to repair it from a mod.

Four changes:

1. The adapter now splits `displayName` into `name` and `surname` on the first
   space, so `${name} ${surname}` still reads back as what you wrote, and writes
   `bio` as well.
2. Twotter's People search and both user lookups read every field defensively. A
   field nobody filled in no longer matches; it no longer throws.
3. `Twotter.updateUser(id, patch)` and `Twotter.removeUser(id)` are now available.
   `removeUser` cascades: the account's posts, replies to them, and any likes,
   bookmarks, retweets and follows pointing either way go with it. It refuses
   multiplayer accounts, since those are the server's and would come straight back.
4. A migration repairs existing saves on first launch of the patched build,
   recovering the surname from the display name where there is one to recover. A
   player whose save you already broke will not need to do anything.

Given all that, Twotter is safe to put back in the editor. Note that accounts you
add live in the player's save and are not removed when your mod is uninstalled, so
if an account only exists for your story, remove it in `OnModPackageUnloaded`.

## BUG 4 (medium): event payloads do not match their declarations

**Confirmed, and there was a third one you had not hit yet.** Both events are fixed,
and `RemoteConnection.Disconnected` had the same problem as `Established`.

The real payload for both remote-connection events is:

```ts
interface RemoteConnectionEvent {
    targetIp: string;               // the machine connected to; match on this
    targetPort?: number;
    fromIp: string;
    user: { id: string; username: string; [key: string]: any };
    t: "SSH" | "METASPLOIT";
}
```

`Terminal.Lynx.Search` is now declared as `string`, the same way
`Terminal.SSH.Connected` already was. The old interfaces remain as deprecated
aliases so existing mods keep compiling.

To your question about a list: there is no separate list, and rather than write one
we went through `ModEventMap` against the emit sites. These were the outstanding
mismatches. We have also added `Terminal.DnsHistory`, which was being emitted but
never declared (see Q6).

## BUG 5 (medium): `QuestObjectiveDefinition.trigger` never fires

**Not a bug.** The declarative form is implemented and wired: the adapter registers
a listener per trigger when the quest's objectives start, and that runs again on
every reload, so triggers survive a restart.

What happened is that BUG 4 made it look broken. A condition written against the
declared types, `data.ip === ...` for `RemoteConnection.Established` or
`data.query === ...` for `Terminal.Lynx.Search`, reads `undefined` and never passes.
Your manual `Events.on` handlers worked because you were handling the real payload
shape by then.

With the corrected types these should work:

```ts
{ name: "breach", description: "...", trigger: {
    event: "RemoteConnection.Established",
    condition: (data) => data.targetIp === this.Data.targetIp,
}}
```

Emitting both forms is harmless, so there is no urgency to change anything.

## BUG 6 (medium): networks persist and destroy is unusable

**Mostly confirmed. Two of the sub-claims had different causes than you thought, and
one we could not reproduce in code.**

Taking your questions in order:

**Does a mod clean up its own networks, or does the engine?** The mod does. Networks
are ordinary save state with no ownership tracking, so nothing removes them when a
mod is uninstalled. That is not going to change soon; treat any network you create
as permanent unless you destroy it.

**Does `destroyNetwork()` settle when there is no network at that address?** It did
not, and this was a genuine engine bug. The worker that does the teardown returned
early without posting a message back when it could not find a router for the
address, and the promise on the main thread only ever resolved in the message
handler. There was no error path and no timeout, so the promise stayed pending for
the rest of the session. Fixed: the worker always answers, there is now an error
handler, the worker is terminated instead of leaked, and `destroyNetwork` resolves
`true` if something was removed and `false` if the address held nothing. It is now
safe to call speculatively before creating.

**Is `OnModPackageLoaded` awaited?** Yes. Combined with the above, that is exactly
why returning the promise hung the loading screen.

**Is there a supported way to replace a network at an address?** Not as a single
call. `createSubnetNetwork` creates and does not replace: the reducer skips an
address it already has. Now that destroy settles reliably,
`await destroyNetwork(ip)` followed by `createSubnetNetwork(...)` is the supported
pattern, and the race you hit is gone because the await now actually completes.

**The permission errors after awaiting.** Real, but not because the await put you
outside the permission window. The mod loader was setting the current mod id
directly instead of using the shared context stack that commands, quests and events
use. Mod code interleaves across awaits, so another frame could clear the id to
`null` while your hook was suspended, and the first gated call after your await then
failed with `Mod "null" tried to use ...`. The loader now pushes and pops properly,
paired in a `finally`. Note the other half still applies: anything you schedule to
run *after* `OnModPackageLoaded` returns, via an unawaited `.then()` or a
`setTimeout`, runs outside the context and will always be refused.

**Destroy hanging with a live meterpreter session.** We could not find this. There
is no session check anywhere in the teardown path. Our guess is that you hit the
missing-router case above by passing an address the worker could not resolve, most
likely a LAN address rather than the public one, since the worker does not do the
local-address remapping the main thread does. If you can still reproduce it on the
patched build with a public router IP, we would like the repro.

Your `randomIp()` workaround is still good practice and we would keep it.

## BUG 7 (low): `Shell.addCommandData` older entry wins

**Confirmed, and fixed.** The list was append-only and the reader took the first
match, so a second entry under the same command and input could never be read at
all. Writing again silently left the old answer standing, and since the list is
persisted, a rebuilt mod kept getting whatever its previous build had written.

`addCommandData` now replaces an existing entry with the same command and input,
matching the same way the reader matches so a stale row cannot shadow the new one.
Your `removeCommandData` call before every write is no longer necessary, though it
does no harm.

To your question: yes, scripted command data outlives the mod that registered it,
for the same reason networks do.

## BUG 8 (low): a mod-placed file cannot be deleted

**Confirmed, but it is deliberate.** Everything that lives on someone else's machine
is protected unless it explicitly opts out, so a file placed through network
creation silently gets `locked: true`. The opt-out flag, `deleteable: true`, existed
in the engine but was missing from the SDK's `NetworkFileMap` type, so there was no
way for you to know about it. It is there now and documented.

The `Sys log file not found` message you noticed is unrelated: that is the
connection logger, not the deletion check.

## BUG 9 (low): mail from an uninstalled mod stays in the inbox

**Confirmed, and fixed.** `Mail.remove(id)` withdraws a mail permanently, and
`Mail.send()` now returns the id of the mail it created, or `null` if it could not
be sent, so you have something to hold onto.

Mail your mod sends still lives in the player's save and is not swept on uninstall,
so if your mod should leave no trace, collect the ids and remove them in
`OnModPackageUnloaded`.

## BUG 10 (low): the date deprecation warning

**Half right.** The warning is real and it is caused by mod content, but not by
mail, which is why you could not find a date field to blame. Mail timestamps are
numeric world time set by the engine, and moment parses those without complaint.

The warning came from Twotter and Kisscord, where dates were being written with
`Date.toString()`. Moment has no format for a JS date string, so it falls back to
the native `Date` and warns once per parse. Those are all ISO now, in the quest
adapter, the Twotter and Kisscord bridges, and the tweet reducer's fallback.

The 30 to 90 second delay is a coincidence: that is the mail queue's normal delivery
timeout. The two things happened to line up.

---

# Part 2: your questions

## Q1: can a mod script the player's outgoing mail?

The mechanism exists but is not reachable from the SDK, so the answer today is no.
It is not reserved for base-game content in principle; it just was never exposed.

GoMail's compose window is wired to the typewriter system, and it is triggered
explicitly by a quest calling an internal `Typewriter.Add.Mail(from, to, questId,
mailIndex)` when the beat should become available. It is not driven by a field on a
mail definition, which is why nothing you could set had any effect. The inbox Reply
box is a plain textarea and does not use the typewriter at all.

This is the one item on your list we have not fixed in this pass. It needs a
mod-facing API design rather than a bug fix, and we agree it is the biggest
storytelling gap. It is on the list.

## Q2: does `QuestMailDefinition.replyable` produce a Reply button?

It is live, but you were hitting two separate problems.

First, it only ever applied to quest mails delivered through `Quest.Mails` plus
`this.sendMail(index)`. Mail sent with `Mail.send()` is stored as custom content,
which had no `replyable` field to read, so the button could never appear. Fixed:
`MailDefinition` now has `replyable`, and it is carried through.

Second, the UI was testing whether the key existed rather than whether it was true.
That is a base-game bug too, and it went the other way: two of our own sandbox
quests set `replyable: !this.Quest.Completed`, and a finished one still offered
Reply. Now it tests the value.

A reply raises `Mail` and `Mail.Sent` with a `repliedTo` field naming the mail that
was replied to, which is how our own quests pick it up.

## Q3: what makes a machine exploitable?

A guest account is not required. One user with `online: true` is enough:

```ts
const user = subnet?.users.find(u => u.online || u.username === "guest");
```

`acceptReverseTCP` is not checked by port exploits at all. It only matters for
reverse-TCP payload paths such as the phishing macro and the mail listener, so it is
not what your single-account server depends on.

The full requirement for a meterpreter session, in the order the checks run: the
router port must be active, forwarded to the device's internal service port, and
apply to the device's LAN address; the port banner's service name must match the
module and its numeric segment must equal the `Version` you set exactly; the
connection must not be firewalled; and the device must have a guest or online user.
Note the error priority is port first, then user, so a device with a valid port and
an empty `users` array reports the user error, not the port one.

The early missions use exactly the same `CreateSubnetNetwork` you have. There is no
private path. Our `StealExamQuestions` target, for instance, is a single device with
one online named user, no guest and no default user schema. The reason a session
feels like an admin account is that Metasploit always prints `uid=0(...)` on
success, whoever the user actually is.

On routers: we would not give them a default user schema. Exploits resolve users on
the device subnet, not the router, so router accounts do nothing for exploitation.
The `admin` you see on our routers is for the router's own web panel login. The one
exception is Wi-Fi access points, which default to an `admin` because the
forgot-password mail flow needs one.

## Q4: what version format does metasploit accept?

`x.y.z` is required, and the first segment cannot be zero. The validator is a strict
three-segment numeric regex, so `7.2` and `7.2p2` both fail at `set` time. That is
why a letter suffix stops matching: it never gets accepted in the first place.

There are two layers. At `set Version`, the value must be well formed and fall
within the module's declared range, which for the SSH module is `1.0.0` to `9.99.99`
and so is effectively open. At `exploit`, the value must equal the port banner's
numeric segment exactly. So a well-formed version is not enough on its own; it has
to be the target's version.

The nmap output is not truncated. It prints the full banner, for example
`OpenSSH 7.2.0`. What differs is that Metasploit's `Version` option wants only the
numeric tail, `7.2.0`, because the banner is split on the last space. That split is
intentional. Our procedural port generator always produces three-part numeric
versions, so following that pattern will keep you safe.

## Q5: can a mod take part in logging and Suspicion?

Partly, and the interesting parts are the ones that are missing.

Seeding a log file works today. You can place one through `rootFiles` on a device,
or create it afterwards against the target's remote root. The engine's log viewer
expects a structured `data` array and an `open: "LogViewer"` marker, neither of
which the SDK's `NetworkFileMap` type currently describes, so you would be passing
game-native fields through. Note the built-in connection logger will also append
real entries to `sys.log` when the player actually connects.

Knowing when the player removed a line is not possible. The log viewer edits the
file's data rather than deleting a file, so no `Files.Deleted` event fires, and the
engine's own forensics check is internal. The closest thing available is to listen
for `RemoteConnection.Disconnected` and read the file back yourself, reimplementing
the check.

Raising or lowering suspicion is not possible at all. The suspicion system has no
SDK surface and no event fires when it changes. Exposing `Suspicion.AddValue` and
`SetValue` plus an event would be the fix, and we think you are right that a quest
should be able to teach this mechanic. It is on the list with Q1, not in this patch.

One correction to your reading of the handbook: `/logs/accounts.log` is on the
player's own machine, not the target. Shell forensics uses `sys.log` on the
compromised host.

## Q6: `dnshistory` and `scp` raise no event

Half right. `dnshistory` does emit an event, it just was not declared in
`ModEventMap`, so you had no way to find it. It is declared now as
`Terminal.DnsHistory` with `{ domain, ip }`. Two caveats that are worth knowing: it
only fires in multiplayer, and only when the lookup actually returns records.

`scp` does not exist. There is no such command in the game and no handbook entry for
it, so nothing could have raised an event. Remote file retrieval goes through the
`download` command or the transfer window, which raise `Files.Transfer` and
`Terminal.SSH.FileDownload` respectively. If you want to catch a player pulling a
file off a machine, listen for both: they cover different paths and quests that
listened to only one have left players stuck before.

---

# Part 3: what is not fixed

Two items, both of which need API design rather than a bug fix, and both of which we
agree with:

1. **Scripted outgoing mail (Q1).** The typewriter mechanism exists and works; it
   needs a mod-facing way to enrol a mail beat.
2. **Suspicion and log forensics participation (Q5).** Needs `Suspicion.AddValue` /
   `SetValue` exposed, plus an event when a log line is removed.

Everything else on your list is fixed or answered above.

Thanks again. If you can retest the quest completion path and Twotter on the patched
build, that would be the most useful confirmation for us. And we would still like
that minimal mail repro if BUG 1 turns out not to be fully closed for you.
