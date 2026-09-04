# r75 — Stale IP after switching to random IPs: debugging plan

Status: **plan only, no code changed yet.**

## 1. Symptom (from Zeis, 04/09/2026 log, Harbour v6 on an OLD savegame)

`whois harbourline-logistics.com` prints the **old hardcoded IP**, not the
freshly allocated random one, so the player cannot progress (nmap/ssh/scp all
point at a dead address).

## 2. What the log actually proves

Line by line, the r74 runtime did everything it was supposed to:

```
reached "Out-CreateNetwork-HarbourFileserver" | saved: { targetIp="158.97.133.56" }
reached "Out-ToolResponse-Whois"              | saved: { targetIp="158.97.133.56" }
objective "find-server" completed by Terminal.Whois
  event: { domain="harbourline-logistics.com", whois={object} }
objective "scan-server" completed by Terminal.NmapScan
  event: { ip="158.97.133.56", versionScan="true" }
```

So:

- `CreateData()` allocated a random `targetIp` = `158.97.133.56`.
- The `world.network` node ran and built the subnet at that IP.
- The `world.toolResponse` (whois) node ran and re-registered the answer,
  after calling `Shell.removeCommandData("whois", "harbourline-logistics.com")`
  (r74 stale-answer clearing, runtimeSource.ts ~line 965).
- The `Terminal.Whois` event fired and matched.

**Therefore the bug is NOT "the new IP was never allocated" and NOT "the tool
answer was never refreshed".** Something else is answering `whois` first.

Note also: the log shows a *successful* `nmap 158.97.133.56`. Whether Zeis
typed that himself from the objective text (which is filled with the new IP by
`refillObjectives`) or from what whois printed is the one thing the log can't
tell me — see question Q1 below.

## 3. Candidate causes, ranked

### H1 — A stale SUBNET from an older Harbour build still owns the domain (primary)

Harbour v2 (`the-harbour-manifest2-2.0.0.zip`, on QA-filedump) hardcoded
`"ip":"203.0.113.47"` and shipped the same device with
`domainName: "harbourline-logistics.com"`. `createSubnetNetwork` writes that
subnet **and its domain registration** into the savegame.

The engine's `PruneOrphanQuests` dropped `TheHarbourManifest5`'s *quest record*
(visible in the log) but there is no evidence it destroys networks. The r74
runtime only calls `destroyNetwork(netIp)` for **the IP the current run
allocated** — it has no idea `203.0.113.47` ever existed. So the old subnet is
still standing in Zeis's save, still holding `harbourline-logistics.com`.

If the game resolves `whois <domain>` against registered domains/subnets
*before* falling back to scripted `Shell` command data, the old subnet wins and
prints `203.0.113.47`. This matches the symptom exactly, and matches Zeis's own
framing of the underlying problem ("stale servers that don't get wiped").

SDK support for a fix exists and is confirmed in `index.d.ts`:
- `Network.getSubnetByDomain(domain): SubnetInfo | null` (line 1911)
- `Network.resolveDomain(domain): DomainInfo | null` (1921)
- `Network.destroyNetwork(ip): Promise<void>` (1905)
- `Network.removeDomain(domain): void` (1917)

### H2 — `removeCommandData` didn't match the stored key

`whois` is typed as `input: string` in `CommandDataMap`, so the key is the
domain string. Same string in v2 and v6, so a mismatch is unlikely — but
`Shell.getCommandData("whois", domain)` can prove or kill this outright.

### H3 — Precedence: the game prefers the real subnet's data over scripted
command data even when both are fresh

Distinguishable from H1 by whether the printed IP is the *old* one (H1) or the
*new* one via a different route (H3). Zeis reports the old one, so H1 leads.

### H4 — Load-order / timing: whois answer registered after the player's first
whois in the session

Ruled out by the log: all world nodes ran inside `OnStart` at 18:33:08, well
before the 18:33:49 whois.

## 4. Experiments, in order (each one falsifiable)

| # | Experiment | Kills/confirms |
|---|---|---|
| E1 | Build a diagnostic Harbour variant that, in `OnStart`, logs `Network.resolveDomain("harbourline-logistics.com")`, `Network.getSubnetByDomain(...)`, and `Shell.getCommandData("whois", "harbourline-logistics.com")` **before** creating anything, then again after. Zeis runs it on the affected save and sends the log. | H1 vs H2 vs H3, decisively |
| E2 | If E1 shows an old subnet: add pre-creation reclaim (destroy any subnet currently holding a domain this quest is about to register) and re-run on the same dirty save. | Confirms the fix on the real broken state |
| E3 | Unit tests in the emitted-code harness: stub SDK with a pre-existing subnet at an old IP owning the domain; assert the runtime destroys it and that the final `resolveDomain` returns the new IP. | Regression lock |
| E4 | Clean-save run (Zeis, or a fresh profile): confirm no regression when there is nothing stale. | No collateral damage |

## 5. Fix shape I expect to land (pending E1)

In the `world.network` / `world.domain` handlers, **before** creating:

1. For each domain the node is about to own, `getSubnetByDomain(domain)` /
   `resolveDomain(domain)`.
2. If it resolves to an IP that is **not** the IP this run is about to use,
   `removeDomain(domain)` and `destroyNetwork(oldIp)`.
3. Then create as today.

Plus the editor-side question of whether "reclaim my domain" should be a
visible toggle on the node (default on) rather than silent behaviour.

**Risk to flag:** step 2 destroys a network this mod did not necessarily
create. If another *installed* mod legitimately owns that domain, this turns a
display bug into data loss for that mod. Hence Q2 below — I am not shipping
this without Zeis's call.

## 6. Non-goals for this round

- No changes to how `targetIp` is allocated (it is working).
- No changes to objective token filling (working — see `refillObjectives`).
- No new node types.

## 7. Open questions for Zeis

Q1. When whois printed the old IP, was it `203.0.113.47` (the v2 hardcode) or a
different address? The exact number tells me which old build left it behind.

Q2. Reclaiming a domain means destroying whatever network currently answers for
it — possibly another mod's. Silent, toggle, or refuse-and-warn?

Q3. Does a **fresh save** with Harbour v6 work correctly? That separates
"stale-state-only bug" from "always broken".

---

## 8. Outcome (r75, same session)

Zeis confirmed the old address was **`203.0.113.47`** — exactly the Harbour v2
hardcode found in `the-harbour-manifest2-2.0.0.zip` on QA-filedump. H1
confirmed; no diagnostic build needed.

He also chose **silent reclaim** for Q2. Q3 (fresh save) still untested.

### What shipped

`reclaimDomain(domain, keepIp)` in `runtimeSource.ts`, called from the
`world.network` and `world.domain` handlers before anything is created:

1. `getSubnetByDomain(domain)` (falling back to `resolveDomain`) to find who
   currently owns the name.
2. If it resolves to an IP **different from the one this run will use**:
   `removeDomain(domain)` then `destroyNetwork(oldIp)`, and log a line naming
   both addresses.
3. If the domain is free, or already points at our new IP, do nothing.

`domainsOf()` walks the whole device tree, so a domain on a child device behind
a router is reclaimed too.

### Why this is not r55/r56/r72 again

- **Not r55** (destroy raced the create): we only ever destroy an address that
  is *different* from the one being created. If the domain already points at
  our new IP the function returns early. The destroy therefore cannot delete
  the network we just made, whenever it settles.
- **Not r56** (create pushed outside the permission window): nothing is
  awaited. `createSubnetNetwork` still runs synchronously in the same tick.
- **Not r72** (game hung awaiting our promise): this runs inside `OnStart`, not
  `OnModPackageLoaded`, and returns nothing. A rejected `destroyNetwork` is
  swallowed so it cannot surface as an unhandled rejection.

### Verification

- 701 tests pass, 21 files (was 691 — 10 new, plus 1 covering the router-child case)
- `npm run typecheck` — 0 errors
- `npm run build` — clean
- Build stamp now `2026-09-04.r75`

The new tests drive the **emitted** `dist/mod.js` through `runMod`, not the
source template, and cover: stale subnet destroyed; domain released *before*
the create; new network still built at the allocated address; no destroy of our
own address; clean save untouched; `resolveDomain` fallback; build with no
lookup API; rejected destroy; domain on a child device.

### Still open

- **Q3** — Harbour v6 on a *fresh* save is untested. Expected to be unaffected
  (the reclaim is a no-op when nothing owns the domain, which is covered by a
  test), but worth one run.
- Zeis needs to re-export Harbour from the editor at r75 and try it on the
  dirty save. Expected log line on first start:

      domain "harbourline-logistics.com" was still pointing at 203.0.113.47
      (left behind by an earlier build or playthrough); reclaiming it for <new ip>
