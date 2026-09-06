# Editor UX audit — r123

Zeis: *"Audit the editor's interface. Make sure it stays easy and friendly for
complete non-coders, by gamers. Human-readable, every field explained in plain
English with examples, and any field that carries a warning gets a red
exclamation in a red triangle that explains the warning and the next step. Also
give the whole editor a once-over as a Lead UI/UX Developer — not just warnings."*

**First, the framing correction.** *"No jargon"* does **not** mean the game's own
vocabulary. This is a tool for **HackHub**, a hacking-puzzle game. A player uses a
fake Terminal and `nmap`, `metasploit`, `nslookup`, `hydra`, `-sV`, `OpenSSH 8.9.0`,
`{{data.targetIp}}`, `SDK 0.21.0` — that is the *whole point*. Everything in
`In-Game-Handbook.md` is in-game language, not jargon, and stays.

**"No jargon" = no mod-coding jargon.** Words that only mean something to a
software engineer building the mod, which a gamer-never-built-a-mod-before would
trip on. Concrete examples from a sweep of the actual user-facing strings:

| Word | Verdict | Why |
|---|---|---|
| `nmap`, `metasploit`, `hydra`, `-sV`, `OpenSSH`, `nslookup` | **Keep** | In-game tools the player uses to play. |
| `{{data.targetIp}}` | **Keep** | The in-game token for "the IP the game hands out" — taught by the handbook. |
| `SDK 0.21.0` | **Keep** | A game build version. |
| "Paste JSON instead…" | **Fix** | "JSON" is a programming format; a non-coder should be told they can paste a finished result, not "JSON". |
| "the shape that tool returns" | **Soften** | "shape" is data-speak; say plainly what the lines become. |
| "exposes the event's field names" | **Soften** | Fine as flavour, but the Debug node is an *authoring* tool — give it a gamer-facing "what you'll see in the log." |

The sweep found the user-facing copy is already mostly clean — the real gaps are
**not** copy, they are (a) **field-level warnings don't exist in the UI**, and
(b) a handful of the compact surfaces (Debug node, status bar counts) rely on
terms an author may not have met.

---

## Findings — whole-editor once-over

### 1. Help system: coverage is strong, quality is mostly there
- Every editable field shows an ⓘ `HintBadge` (hover/click) with a plain-English
  explanation. A schema test enforces: every editable field has a hint, 24–260
  chars, sentence-end punctuation, not a label echo.
- **Clean examples** already in place: `world.wifi`, `world.network`,
  `world.files`, `flow.sequence`, `fx.shell`, the phishing flow.
- **Gaps:** (a) a few hints break the "no mod-coding jargon / has an example"
  bar (`world.toolResponse` "Paste JSON", "the shape"); (b) some fields move
  through a *sibling gate* (`showWhen`) to a value the author may not realise is
  required — those get no signal until they are wrong.

### 2. Field-level warnings: **this is the missing feature**
Analysis exists at **node** level (`analysis/graph.ts`: `No trigger`, `Dead end`,
`Unreachable`, `Unwired`, `Empty`) and as **compile** warnings (`computeWarnings`,
~17 strings shown only in the Export dialog under "Good to know"). Neither reaches
a specific *field* in the inspector.

- A node's own `GraphIssue` is drawn as a small badge on the card and summed in
  the status bar — but **not** in the inspector when you select the node.
- No field shows "this value is filled but won't work until X is one node up"
  (the router-prerequisite case).

### 3. Onboarding & first-run
- The empty-canvas `FirstRunHint` is good and on-voice ("no JSON, no code",
  "Browse N templates", "Ctrl+Z to undo — nothing is destructive").
- Templates popup has a clear subtitle ("Replaces the current project…, export
  before experimenting") and difficulty chips.

### 4. Small surfaces that lean on author-speak
- **Status bar:** `history 3↑ 1↓` and `92 events · SDK 0.21.0`. "Events" and
  "history" read fine, but a first-timer may not know why it matters. Low priority.
- **Debug node** is the most engineer-flavoured node; give it a gamer-facing
  blurb/note.

### 5. Consistency / discoverability
- The **warning marker** currently only exists on the card; bring the same
  severity language (red = won't work, amber = worth checking) into the
  inspector so an author sees *why* they were warned where they're editing.

---

## Plan

### Phase 1 — Inventory (done above)
Swept the field descriptors and both warning systems. Documented in this file.

### Phase 2 — Define the field-warning design
A reusable inspector component. When a field has a problem, its label row shows a
**red ⚠ triangle** (`alert` icon) that stands out. Hover/click reveals:
1. **What's wrong**, in plain English (game terms only).
2. **The next step**, a concrete actionable sentence ("Add a Network node and wire
   it here").
Severity colour matches the existing `GraphIssue`: **red** (blocking), **amber**
(worth reviewing). Additive: fields without a problem look exactly as today.
Accessible `aria-label` so it is testable and screen-reader friendly.

### Phase 3 — Build the mechanism (data-driven)
- Let any `FieldDef` declare a `warning` that is **computed from the current
  project** (the problem depends on the graph, so it can't be static text).
- Render it in `Field.tsx` beside the label; keep the existing hint ⓘ for
  "what is this field", and the ⚠ warning for "what is wrong with this value".

### Phase 4 — Wire the highest-value warnings (rules with existing backing)
- Device / Protected IP empty → "point it at a machine a Network node created."
- `world.files` → device but no matching network → the **router prerequisite**
  (the exact case raised).
- Objective with no `condition` trigger → next step "wire a When event into its
  trigger socket."
- Branch / input / sequence with an unwired output → "wire it up or remove the
  output."
- Also surface a node's own `GraphIssue` in the inspector header (currently only
  on the card).

### Phase 5 — Hint quality pass + harden the audit
- Fix the few "Paste JSON" / "the shape" / Debug-node copy items.
- Extend the schema test to *flag* mod-coding jargon (JSON, schema, d.ts, etc.)
  and to prefer examples — so the no-jargon bar holds, not just "has a hint".

### Phase 6 — Verify (honest about what is testable)
`typecheck` + full suite. jsdom **can** assert the ⚠ markup, `aria-label`, and
that a warning appears/disappears as the graph changes. jsdom **cannot** verify
tooltip hover visuals or that the red triangle "reads" well — those go to Zeis in
the live preview, per our standing rule.

---

## Not doing
- Rebuilding copy that already meets the bar (avoid churn).
- Attaching every one of the 17 compile warnings to a field this round — most are
  *quest*/*mod*-level, not *field*-level, and belong in the export report. This
  round wires the field-level ones that have a clear single field.
