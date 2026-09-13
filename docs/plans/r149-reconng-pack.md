# r149 (plan): The Recon-NG example pack

Zeis's call: use Darkvalnar's Recon-NG (a real, released tool mod — an
interactive exploitation workspace: `recon-ng` in the terminal, exploit
modules matched against live network state, persistent breach sessions) as
the **second pack to design against**, fenced off as an example. Explicit
permission to name it; link its GitHub from the fence doc. Split scope:
**r149 authors the pack**, the target-matching warnings come next round
after Zeis has eyeballed the pack's labels.

Source, pinned: https://github.com/Darkvalnar/hackhub-reconng at
`798f9ee` (2026-09-10). Docs verified against source before writing a word
— four diffs found (NOTES.md carries them): the events page lists 5 events
but the source emits 9 (`DirListed`, `Shutdown`, `UserEnum.Complete`
undocumented anywhere; `SessionClosed` only on the session-control page);
matching reads vulns from
`subnet.domain.vulnerabilities` only (`BreachBackend.ts:1520`); service
aliases (`http→https,web`, `database→mysql,mariadb,postgres`) are
code-confirmed (`BreachBackend.ts:477-478`).

## What changes

- `reference/reconng/` (new, fenced — see below):
  - `README.md` — the fence banner: what it is, source URL + pinned
    commit, "example only, we don't service this", "nothing here is
    imported by `src/` or shipped in any export".
  - `toolpack.json` — the authored pack: 9 `events[]` (all source-verified;
    the four undocumented ones say so in their docs strings), 3
    `storage[]` (loot, authored exploit, user-enum target), 2 `nodes[]`
    (close-the-session, open/close-a-host), `targetRules` with the real
    conventions.
  - `NOTES.md` — the verification record: docs-vs-source diffs with
    file+line, and what was deliberately left OUT with the reason.
- `src/toolpacks/schema.ts` — one additive, optional field:
  `targetRules.serviceAliases` (`Record<canonical, alias[]>`, default
  `{}`). The real mod taught us the format can't express aliases; without
  the field the pack would misdescribe matching. Format stays 2; old packs
  parse unchanged. No lint reads it yet (next round).
- Boolean seeding fix (latent r137/r138 bug this pack is first to trip):
  untouched toggles start as no value, and the runtime skips valueless
  holes — so an untouched boolean emitted the literal string `"{{key}}"`
  (truthy!) while showing off. `defaultPackValues()` in
  `toolpacks/palette.ts` seeds booleans to `"false"` at snapshot time, used
  by both snapshot paths (`buildAddData`, `chooseContract`). Tested pure +
  through the inspector; falsified by revert.
- `docs/ToolPack-Format.md` — document `serviceAliases` in the
  `targetRules` section.
- Tests: `src/toolpacks/__tests__/reconngPack.test.ts` — the fixture
  parses; key contracts/nodes/rules spot-checked; surfaces fed
  (`packEvents`, `packNodeDefs`, palette keys unique); `serviceAliases`
  defaults to `{}` for the starter pack.

## Deliberately out (with reasons, not silence)

- `reconng.wordlist.grants` (string-list append): our `replace` merge
  dedupes object entries by `mergeBy`; on a string list it either clobbers
  (`mergeBy` set — every string compares equal on `undefined`) or appends
  duplicates (unset). `overwrite` would wipe other mods' grants. Needs a
  future merge mode (e.g. `appendUnique`) — recorded, not invented here.
  `reconng.wordlists` (describe) and `reconng.wordlist.gates` go with it:
  lists the player can never be granted would dead-end gated routes.
- `reconng.session.locks` (`until` is epoch ms): the format has no computed
  values, and asking an author to type epoch milliseconds violates
  requirement zero. Same verdict: recorded, not invented.
- Access profiles, binary overrides, reverse payloads (`reconng.reverse.*`):
  advanced surfaces needing in-game testing we can't do from here.
- Multi-version / multi-vuln exploits, multi-user enum targets: the field
  vocabulary has no string-array kind, so the pack covers the single-value
  subset (most built-ins have 1–2 versions) and says so. No vocabulary
  extension this round (YAGNI).
- No `sdk`/`emit` nodes: recon-ng exposes no quest-callable SDK surface
  (its backend is in-bundle import, not `sdk.*`) and no quest-firable
  input events (its internal bridge events aren't a quest contract).

## Usage notes the pack must carry (verified in our runtime)

- Both `world.packData` and `pack.node` are **flow-timed** (they run when
  the story reaches the node — `runFlowStep`, not load-time). So every
  `storage[]` contract says: wire it at quest start, before the player can
  breach — the equivalent of their "publish at boot".
- Message fields are `??`-defaulted in their source (blank = silent, not
  the default line). The hints say so — a silent kick paired with the
  author's own notification is a feature, not a trap.
- Quests target by domain or IP (their resolution is
  `getSubnetByDomain ?? getSubnet`, `:1512`); the pack hints say a domain
  name works.

## Gates

typecheck clean, tests green (new guards falsified: break the fixture /
drop the aliases field → red), build clean. Stamp `2026-09-13.r149`.
README: "Done recently" row + trim beyond the 5th entry into
`docs/archive/` (already overdue); "Next up" item 3 note updated (pack
done, warnings next). HANDOFF entry.
