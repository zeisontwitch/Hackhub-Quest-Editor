# Recon-NG pack — verification record (r149)

Everything below was checked against the pinned source (`798f9ee`), not just
the docs site. Standing rule: the code wins where they disagree.

## Docs-vs-source diffs (all four resolved in favour of the source)

1. **Nine events, not five.** The `events.md` page lists `SessionOpened`,
   `DesktopOpened`, `FileRead`, `FileDownloaded`, `FileDeleted`. The source
   (`src/world/ReconNgEvents.ts`, the typed event map) also emits
   `DirListed`, `SessionClosed`, `UserEnum.Complete`, and `Shutdown` —
   each `emit` call confirmed at its call site (`BreachBackend.ts`,
   `ReconNgCommand.ts:1068` for `Shutdown`). The pack carries all nine;
   the four missing from their docs page say so in their docs strings.
2. **Payloads exact.** Every payload shape in the pack is copied from
   `ReconNgEvents.ts`, including `desktop` on `SessionOpened` and
   `via?: "forward" | "reverse"`.
3. **Vulns are read from the domain only.** Their docs say to attach vulns
   "in three places for reliability" (domain definition, `registerDomain`,
   `setVulnerabilities`). The read path uses only
   `subnet.domain?.vulnerabilities` (`BreachBackend.ts:1520`). Our compiler
   already emits the first two, so editor-built targets should match with
   no compiler change — flagged for Zeis's in-game eye, not assumed.
4. **Service aliases are real.** `http` matches `https`/`web`, `database`
   matches `mysql`/`mariadb`/`postgres` (`BreachBackend.ts:477-478`). The
   pack format had no field for this — r149 adds optional
   `targetRules.serviceAliases` (additive; old packs parse unchanged).

Also confirmed in source: resolution is
`getSubnetByDomain ?? getSubnet` (`BreachBackend.ts:1512`), version match
is a case-insensitive substring, and session messages fall back with `??`
(blank writes stay blank — the pack's message hints say so).

## Deliberately left out (with reasons)

- `reconng.wordlist.grants` — a **string list**; our `replace` merge
  dedupes object entries by `mergeBy` and cannot append-or-dedupe strings
  (with `mergeBy` set it would clobber the list; without, it appends
  duplicates every run). Needs a future merge mode. Left out together with
  `reconng.wordlists` and `reconng.wordlist.gates`: describing and gating
  lists the player can never be granted would dead-end routes — a trap with
  a signpost is still a trap.
- `reconng.session.locks` — `until` is **epoch milliseconds** and the
  format has no computed values. Asking an author to type epoch time
  violates requirement zero.
- `reconng.access.profiles`, `reconng.binary.overrides`,
  `reconng.reverse.*` — advanced surfaces needing in-game testing from
  here; recorded, not half-covered.
- Multi-version / multi-vuln exploits, multi-user enum targets — the field
  vocabulary has no string-array kind. The pack covers the single-value
  subset (most built-ins need only that) and says so.
- No `sdk`/`emit` nodes — recon-ng exposes no quest-callable `sdk.*`
  surface (its backend is in-bundle import) and no quest-firable input
  events. The pack uses `storage` emitters only, honestly.

## Our-runtime facts this pack relies on

- `world.packData` and `pack.node` are **flow-timed** (they run when the
  story reaches the node — `runFlowStep` in `runtimeSource.ts`, not
  load-time). Every `storage[]` contract therefore says: wire it at quest
  start, before the player can breach.
- Untouched booleans are seeded to `"false"` at snapshot time (r149 fix in
  `toolpacks/palette.ts` + `PackDataEditor`): without it an untouched
  toggle would emit the literal string `"{{key}}"` (truthy!) while showing
  off. First exercised by this pack's `deletable` and `open` fields.
