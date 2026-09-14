# r161 (plan): The auto-generate (dice) button — realistic hardcoded values

## The idea, in the user's words

The game can fill some fields at runtime with a **tag** (`{{data.targetIp}}`,
`{{random.username}}` …) — that is what the existing sparkle button inserts.
But sometimes an author wants a **hardcoded** value: a specific IP, a named
contractor, an email — and either doesn't know what a realistic one looks like,
or just doesn't want to invent one. The **dice button** generates a plausible
value *in the editor* and writes it as plain text. The export is byte-identical
to the author having typed it; nothing new reaches the runtime or the compiler.

Some fields therefore end up with **two buttons**: the existing sparkle
(game-random *tag*) and the new dice (editor-generated *hardcoded* text). IP
fields are the clearest case — you can insert `{{data.targetIp}}` *or* roll a
concrete `45.33.32.156`.

The user's second instinct is the important one: don't ship a flat
`firstname+lastname` list. Keep **separate lists** (first names, last names,
company words, mail providers, router models, service banners …) and have each
dice **compose** what its field needs by pulling from the relevant lists — and,
where it makes sense, **reuse values already entered in the same section**. So:
First name → `John`, Last name → `Noble`, then E-mail → `johnnoble53@googoomail.net`
because the email dice noticed the name fields beside it were filled.

This plan validates that approach (it's the right one) and pins down the exact
architecture, the field-by-field map, and how the "reuse siblings" trick works
without surprising the author.

---

## Why this is the right shape (and where I'd refine it)

The compose-from-lists idea is correct and is exactly how the project already
authors sample data (the templates are full of `e.brandt@nullpost.io`,
`Meridian Capital`, `TP-Link Archer C6`). Refinements I'd add:

1. **Pure generator module, seedable RNG.** All generation lives in a pure
   `src/lib/generate/` module — no React, no store, no DOM (AR1/AR8). Every
   function takes an optional `rng: () => number = Math.random` so tests are
   deterministic (property tests for format, exact tests with a stubbed RNG).
   This mirrors the `wireTuning.ts` "externalize the tunable" precedent (AR20).

2. **Declarative descriptor for registry fields.** Fields rendered by the
   registry engine (`Field.tsx`) get an optional `generate` descriptor, the same
   way `tokens: true` already opts a field into the sparkle menu. No new
   bespoke wiring per field — the engine reads the descriptor and draws the
   dice. This keeps the "hand-authored descriptors, one shared renderer"
   contract the registry already documents.

3. **Reuse without side effects.** The email/username dice may *read* sibling
   fields (first/last name, company) to stay coherent, but it must **never write
   them back** — the author fills those with their own dice clicks. If a sibling
   is empty, the dice generates a throwaway name internally just to build a
   coherent address, and discards it. One click changes exactly one field, so
   undo stays one-step and predictable.

4. **No compiler/runtime footprint.** The dice only ever produces plain text
   through the field's existing `onChange` → `updateNodeData`, so it rides the
   normal undo/redo and autosave paths and needs zero changes to
   `runtimeSource.ts`, `compile.ts`, or the SDK. The `fieldAudit` suite is
   unaffected: `generate` is descriptor metadata, not a data key that must be
   read by the compiler.

---

## Architecture

### 1. `src/lib/generate/wordlists.ts` — the raw material (data only)

Curated `SCREAMING_SNAKE_CASE` arrays, each `as const`, deliberately in the same
tone as the shipped templates (diverse, plausible, and — for anything that
implies a real person or provider — clearly fictional):

- `FIRST_NAMES`, `LAST_NAMES` — diverse, ~80 each.
- `COMPANY_HEADS` / `COMPANY_TAILS` — composed into names like *Meridian
  Capital*, *Greyline Dispatch*, *Delivery Union*.
- `MAIL_PROVIDERS` — fictional consumer providers (`googoomail.net`,
  `nullpost.io`, `ghostmail.io`, …) for personal emails.
- `TLDS` — `net io org internal gov` (matching template domains).
- `HOSTNAME_WORDS` — short server names (`vault`, `gw`, `db`, `mail`, `web`,
  `prod`, `dev`, …).
- `ROUTER_MODELS` — real vendor+model strings the in-game `fern` route expects
  (`TP-Link Archer C6`, `MikroTik hEX S`, `Netgear Nighthawk R7000`, …).
- `SERVICE_BANNERS` — realistic `name X.Y.Z` banners that satisfy the Version
  field's own rule (three numbers, no letters-in-the-version, or metasploit
  refuses them): `OpenSSH 8.9.0`, `nginx 1.14.2`, `Apache 2.4.41`,
  `ProFTPD 1.3.5`, `PostgreSQL 9.6.23`, …
- `SERVICE_NAMES` — the bare service labels (`http`, `ssh`, `ftp`, `mysql`, …).

Every list is unit-tested for non-emptiness and de-duplication.

### 2. `src/lib/generate/index.ts` — the generators (pure functions)

```ts
export type GeneratorKind =
  | "firstName" | "lastName" | "fullName" | "initialName"
  | "email" | "username"
  | "ip" | "domain" | "hostname"
  | "routerModel" | "serviceName" | "serviceVersion"
  | "companyName" | "iban";

export interface GenContext { [siblingKey: string]: string | undefined }

export function generateField(
  kind: GeneratorKind,
  ctx?: GenContext,
  rng?: () => number,
): string;
```

- `ip(flavour = "public")` — a realistic IPv4. `"public"` skips
  private/reserved ranges so it reads as a real target (like the templates'
  `45.33.32.156`); `"private"` rolls a valid RFC-1918 block (`10.0.0.0/8`,
  `172.16.0.0/12`, `192.168.0.0/16`) for internal devices.
- `email(ctx)` — if `ctx.firstName`/`lastName` present, build
  `first.last` / `flast` / `firstlastNN`; pick a provider, or, when `ctx.company`
  is present, use the company's domain slug (`e.brandt@meridian-capital.net`).
  Absent names → invent throwaway ones just to compose, don't write them back.
- `username(ctx)` — lowercase, no spaces, reuses names when present.
- `domain()`, `hostname()`, `companyName()`, `routerModel()`,
  `serviceName()`, `serviceVersion()`, `iban()` — compose from the lists above.
- `fullName()` → `"Elias Brandt"`; `initialName()` → `"E. Brandt"` (the
  `fromName` statement style).

### 3. `src/editor/inspector/GenerateButton.tsx` — the dice control (presentation)

A tiny `<button>` with a **dice** icon (new glyph added to `Icon.tsx`; the icon
set has no dice yet — `shuffle` is the fallback if we decide against a new path).
`title="Generate a value"`, `aria-label` per field. Clicking calls a supplied
`onGenerate()`. It's laid out in a trailing button row so a field can show
**dice + sparkle**, **dice only**, or **sparkle only**.

### 4. Wiring — two surfaces

**Registry-driven fields (`Field.tsx`).** Add `generate?: { kind; reuse? }` to
the `text` / `textarea` / `selectOrCustom` variants of `FieldDef`. The engine:
gathers `reuse` siblings via `getPath(node.data, <section>.<key>)`, calls
`generateField`, and writes through the same `write()` as typing. The text/token
inputs grow an optional trailing dice beside the existing sparkle.

**Non-registry fields.** Drop `<GenerateButton>` next to the hand-written
inputs: the quest **Employer** section in `InspectorPanel.tsx` (the exact
`First name / Last name / E-mail` from the screenshot), the `DeviceTree` device
fields (IP, Hostname, Domain, Router model), and the sims (`MailSim` from/to,
`KisscordEditor` handle, `WeeChatEditor` host + username).

---

## Field map — what exists and what gets a dice

Legend: **🎲** dice (hardcoded) · **✨** sparkle (tag, already exists) · — none.

### Highest value (propose for the first implementation round)

| Where | Field | Buttons | Generator |
|---|---|---|---|
| Quest › Employer (`InspectorPanel`) | First name | 🎲 | `firstName` |
| Quest › Employer | Last name | 🎲 | `lastName` |
| Quest › Employer | E-mail | 🎲 | `email` (reuse first/last) |
| `world.network`/`world.wifi` device (`DeviceTree`) | IP address | 🎲 | `ip` (private) |
| device | Hostname | 🎲 | `hostname` |
| device | Domain | 🎲 | `domain` |
| device / wifi | Router model | 🎲 | `routerModel` |
| user account (`userFields`) | Username | 🎲 | `username` (reuse first/last) |
| user account | First name | 🎲 | `firstName` |
| user account | Last name | 🎲 | `lastName` |
| user account | E-mail | 🎲 | `email` (reuse first/last) |
| `world.domain` | Domain | 🎲 | `domain` |
| `world.domain` | Resolves to (ip) | 🎲 ✨ | `ip` (public) |
| `world.database` | Host IP | 🎲 ✨ | `ip` (public) |
| `world.database` | Username | 🎲 | `username` |
| `world.firewall` | Protected IP (selectOrCustom) | 🎲 ✨ | `ip` (public) |
| `world.port` | Device IP | 🎲 ✨ | `ip` (private) |
| `fx.files` | Device IP | 🎲 ✨ | `ip` (private) |

### Long tail (propose for a follow-up round — YAGNI until the core lands)

| Where | Field | Buttons | Generator |
|---|---|---|---|
| `portFields` (ports lists) | Version | 🎲 | `serviceVersion` |
| `portFields` | Service | 🎲 | `serviceName` |
| `world.port` | Service | 🎲 | `serviceName` |
| `vulnFields` | Version | 🎲 | `serviceVersion` |
| `fx.pay` | From IBAN | 🎲 | `iban` |
| `fx.pay` | From name | 🎲 | `initialName` |
| `world.wifi` | Network name (SSID) | 🎲 | `hostname`-ish |
| `MailSim` | From / To | 🎲 | `email` |
| `KisscordEditor` | Contact handle | 🎲 | `username` |
| `WeeChatEditor` | Host | 🎲 | `domain` |
| `WeeChatEditor` | Username (per line) | 🎲 | `username` |

### Deliberately **no** dice (with reason)

- **Passwords** — the field already says "leave blank to let the game pick," and
  `{{random.password}}` exists; a hardcoded password is rarely what you want.
- **File / folder names, extensions** — story-specific, not "realistic filler."
- **Identifiers, quest names, keys, objective names, commands, prompts,
  messages, titles, descriptions** — author intent, not sample data. A dice here
  would produce noise.

---

## The "reuse within a section" behaviour, precisely

The screenshot's `Contractor`/`Employer` section is one data object; the user
lists (`userFields`) are one object per row. Both are a single `basePath` in
`Field.tsx`, so "the same section" = "the same `basePath`". A `generate.reuse`
list names sibling keys relative to that base:

```ts
{ kind: "text", key: "emailAddress", label: "E-mail",
  generate: { kind: "email", reuse: ["firstName", "lastName"] } }
```

The engine reads those siblings and passes them as context. Empty siblings ⇒
the generator invents throwaway names to stay coherent but writes only the email
field. This gives the exact flow the user described, and it composes naturally
for user-account rows too (each row reuses its own row's names).

---

## Tests

- `generate.test.ts` (pure): format assertions with a **stubbed RNG** — `ip`
  four octets 0–255 in a public range; `email` is `local@domain`; `username`
  lowercase & space-free; `serviceVersion` ends in a three-number version (the
  metasploit rule); `iban` shape; `domain`/`hostname` character sets. Reuse:
  `email({firstName:"John",lastName:"Noble"})` contains `john`/`noble`.
  Determinism: same RNG ⇒ same output. Lists: non-empty, de-duplicated.
- `generateButton.test.tsx`: a registry field with a `generate` descriptor
  renders a dice; clicking writes a value of the right shape through the store
  (so it lands in undo); a field with both `tokens` and `generate` shows two
  buttons; reuse pulls the sibling value.
- `fieldAudit.test.ts`: unchanged and still green (proves `generate` added no
  unreadable data key).

---

## Rollout

Two rounds keeps each reviewable and honours YAGNI:

- **r161** — the engine (`wordlists.ts`, `index.ts`, tests), the
  `GenerateButton` + dice icon, the `generate` descriptor on `FieldDef`, and the
  **Highest value** table above wired up (employer, devices, users, IPs,
  domains). This is the whole "smart contractor" demo the user drew.
- **r162** — the **Long tail** (service/version, IBAN, SSID, sims handles).

Each round: `npm run typecheck`, `npm test`, `npm run build`; bump
`EDITOR_BUILD`; README Done-recently + HANDOFF; commit **and** push.

## What does NOT change

The compiler, `runtimeSource.ts`, the SDK, the project document shape, and the
export bytes. The sparkle/tag system is untouched — the dice sits beside it.

## Decisions (locked by the user)

1. **Dice icon**: add a real, **flat** `dice` path to `Icon.tsx` — a line-art
   die drawn in the same one-stroke style as the rest of the set (`grip`,
   `shuffle`, …). No emoji: the user finds emoji in UI tacky, so this is a
   proper vector glyph, not `🎲`.
2. **IP flavour**: offer **both** a realistic public IP *and* a private-range IP
   (`10.x`, `172.16–31.x`, `192.168.x`). The generator exposes both so a field
   can roll whichever reads as realistic for it — internal devices lean private,
   public targets lean public. The general principle the user stated: anything
   an author might want to hardcode and have look realistic should be offered.
3. **Company-vs-personal email**: default to a personal provider, and switch to
   a company domain only when a company/employer name is in scope. **Confirmed.**

### What these lock into the design

- `Icon.tsx` gains a `dice` entry (flat vector path).
- `src/lib/generate/index.ts` exposes IP generation with a flavour:
  `ip(flavour?: "public" | "private", rng?)`, defaulting to `"public"`. Fields
  choose their flavour in the descriptor (`generate: { kind: "ip", ipFlavour }`)
  — device/internal IPs default to `"private"`, target/public IPs to `"public"`.
  Private rolls pick a valid block: `10.0.0.0/8`, `172.16.0.0/12`,
  `192.168.0.0/16`.
- `email(ctx)` prefers `ctx.company`'s domain slug when present, else a
  `MAIL_PROVIDERS` entry — exactly the personal-by-default, company-when-known
  rule.
