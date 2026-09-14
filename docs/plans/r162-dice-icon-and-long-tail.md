# r162 (plan): Real dice icon + a service-aware Version generator + the long tail

## Why this round

Three things, all from the user after trying r161:

1. **The dice icon was just a square** — it read as a text box, not
   "randomize". The user supplied a proper filled vector die. Swap it in.
2. **Ports → Version should generate from the Service** and obey the game's real
   version rule: **three parts, first 1–9 (never a leading 0), the rest 0–99**
   (e.g. `2.4.71`). r161 shipped Version off a fixed banner list; this makes it
   compose a service-matched software name + a freshly rolled compliant version.
3. **Finish the long tail** the r161 plan deferred (service/version, IBAN,
   Wi-Fi SSID, the sims), so the dice covers every field an author would want to
   fill with realistic filler.

## What changes

### 1. `Icon.tsx` — filled-glyph support + the real dice

The set was single-stroke line art (one `<path>`, `fill=none`, `stroke`). The
user's die is a filled, two-sub-path, 32×32 glyph. Rather than force it into the
stroke model, `Icon` gains a small `FILLED_ICONS` registry
(`{ viewBox, paths[] }`); a filled entry renders `fill="currentColor"
stroke="none"` with each sub-path, so it still inherits colour and size. The old
stroked-square `dice` path is removed. `IconName` now unions both registries.

### 2. `lib/generate` — a rule-compliant, service-aware Version

- New `versionNumber()` → `[1-9].[0-99].[0-99]`, the game's exact rule, so a
  bare Version field can use it directly.
- `serviceVersion(ctx)` now reads `ctx.service`: `SERVICE_SOFTWARE` maps the
  bare service label (ssh, http, mysql, …) to the software that runs it
  (OpenSSH/Dropbear, Apache/nginx, MySQL/MariaDB, …); an unknown/blank service
  falls back to `GENERIC_SOFTWARE`. The banner is `<software> <versionNumber()>`,
  so it always matches the port and always passes the rule.
- New `ssid()` composes `SSID_WORDS` + `SSID_SUFFIXES`
  (`DOCKNET_5Ghz`, `NETGEAR-Guest`, …).
- `GenContext` gains `service`; `Field.tsx`'s reuse mapping learns the `service`
  key (alongside first/last/company).
- The old fixed `SERVICE_BANNERS` list is gone (replaced by software + rule).

### 3. Wiring — the long tail

- **Ports** (`portFields`, shared by network + wifi router ports): Service gets
  `serviceName`; Version gets `serviceVersion` **reusing `service`**.
- **world.port** node: its `port.service` gets `serviceName`.
- **vulnFields** Version: `serviceVersion` (no service sibling → generic).
- **fx.pay**: From IBAN → `iban`; From name → `initialName` (the "E. Brandt"
  statement style).
- **world.wifi** SSID → `ssid`.
- **Sims**: `MailSim` From → `email`; `KisscordEditor` contact handle →
  `username`; `WeeChatEditor` server host → `domain`, per-line username →
  `username`. These use the `TextInputWithGenerate` wrapper (hand-written
  surfaces, not the registry engine).

## Tests

- `generate.test.ts`: `versionNumber` obeys the rule across 200 rolls;
  `serviceVersion` matches software to the service (ssh→OpenSSH, mysql→MySQL),
  falls back generically for an unknown service, and always ends in a compliant
  version; `ssid` has no spaces. (Replaces the old fixed-banner assertion.)
- `generateButton.test.tsx`: the Version dice on a port row reads the sibling
  Service and yields a service-matched, rule-compliant banner.

## What does NOT change

The compiler, runtime, SDK, project document, export bytes. Nothing here is a
new data key (fieldAudit stays green). The tag/sparkle system is untouched.

## Gates

- `npm run typecheck` — 0 errors.
- `npm test` — 1,498 tests / 77 files.
- `npm run build` — succeeds.

## Stamp

`2026-09-14.r162`.

## Roadmap

Closes the auto-generate feature (r161 core + r162 icon/version/long-tail).
Remaining Next-up, in order: the two templates last — 1 "Contact-driven story",
2 "Branching consequence".
