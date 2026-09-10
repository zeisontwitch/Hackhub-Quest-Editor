# r136: The Long Game — the campaign template + the Campaign card

The first r131 proposal built (Zeis's queue: campaign template, cookbook
rider, tool packs, editor mods — **Kisscord contact lifecycle parked until
the SDK moves**; a smaller game patch shipped 2026-09-12 without notes and
without an SDK update, so the fence stands unchanged). Gates at ship:
typecheck clean, **1,255 tests green** (57 files), build clean. Stamp
`2026-09-12.r136`.

## The template

**The Long Game** (Expert, `long-game`, 36 nodes, three quests in one mod):

- **Act I — The Tail** (autoStart): a public trail. The client's brief sends
  the player to a defunct firm's archived site (`halvard-freight.net` — two
  pages ship with the mod); the about page names the founder; `lynx` verifies
  the name; the founder mails the player unprompted. Ends with **Claim
  another quest → LongGameAct2**.
- **Act II — The Maintenance Window** (claimed): the break-in, kept to one
  sitting — a single old server (`archive.halvard-freight.test`, ProFTPD
  1.3.5), scan → metasploit → download the ledger from the session
  (`Meterpreter.Download`, matched on `file.name` — the dotted path the
  catalogue declares and the runtime resolves). Ends with claim → Act III.
- **Act III — The Choice** (claimed): the branching ending. A `reply.input`
  terminal prompt ("Your verdict — expose or bury"); its **success wire is
  one ending, its failure wire is the other decision** — different mails,
  different payouts. Two Ways Out's shape, shipped inside the campaign.

## The design decisions that matter

1. **Per-act stages, deliberately.** Each quest rolls its own `CreateData()`,
   so a sequel quest cannot address act 1's random IP *even when the world
   persists* — `{{data.*}}` tokens are per-quest. The campaign rule the
   template teaches: **cross-act references go by DOMAIN name, never by
   another quest's tokens**; when in doubt, each act builds its own stage
   (robust under either world-persistence outcome — the in-game check is
   still pending on the QA list).
2. **Chaining is `fx.claimQuest` by name**, deterministic, no feed post
   needed; only act 1 auto-starts. The Dry run walks act 1 and says so.
3. **`reply.input` doubles as the choice node**: the failure wire is the
   other decision, not a fail state. (Cold Call used it for a right/wrong
   answer; the sticky note tells authors the difference.)

## Product fixes the template forced (why audits love real users)

- **Claim-aware startability (product fix).** `computeWarnings` and the
  template tests treated `autoStart`/`hackhubPost` as the only ways in —
  every chained act of every campaign ever built would ship with a false
  "nothing can start this quest" warning. Both now recognize **any
  `fx.claimQuest` node naming the quest, anywhere in the mod**, as a start
  route.
- **`createProject` pointed `activeQuestId` at a discarded quest** (the
  default first quest) whenever a caller supplied their own quests — every
  multi-quest project opened looking at a quest that did not exist, and it
  leaked a random id that broke byte-determinism. Now it follows the first
  quest that actually ships.

## The rider

Cookbook card 16 — **"The Campaign"**: the two moves (claim-chaining, act
stages), the domain-name rule, the choice shape, one-sitting acts, end each
act from its own last beat.

## Status

Shipped in r136. Queue per Zeis: tool packs next (r135 design v2.1 staged),
then Editor Mods; Kisscord contact lifecycle waits for the patched SDK.
