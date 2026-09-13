# r141 (plan): Themes, typography and the rest of the settings

## Why this round

r140 gave the editor preferences an author-facing home. Zeis approved the
follow-up scope: the page becomes a real settings page.

- **Curated themes** (6): Midnight (today's look), High Contrast, Daylight
  (a warm, cream-tinted light mode — not pure white), Phosphor (green retro
  terminal), plus two of our choosing: **Dusk** (warm dark, low-blue evening)
  and **Slate** (soft cool grey — the gentler dark).
- **Typography**: a font picker with readable choices — system default, a
  Verdana-led readable system stack, Atkinson Hyperlegible and Lexend
  (dyslexia-friendly), JetBrains Mono (terminal feel). Self-hosted, no CDN.
- **Snap grid size** (Fine 11 / Standard 22 / Coarse 44) — the snap toggle
  exists; the cell it snaps to has been a hardcoded 22.
- **Wire dot drift speed** (Calm / Standard / Brisk) — `DOT_PERIOD_S` has been
  a hardcoded 1.4s since r43.
- **Editor data section**: reset all editor preferences, clear the autosaved
  draft — both two-step, both things you only need once but really need then.

Explicitly out (Zeis's call): no UI scale (browser zoom already does it); no
free-form colour pickers; nothing that touches the exported mod.

## What the code already gives us

The colour system is var-first end to end — this round is cheap because
earlier rounds already did the migration:

- Every chrome colour is a token in the `@theme` block of `src/index.css`,
  consumed via Tailwind `bg-*`/`text-*` utilities or `var(--color-*)`.
- Node categories and `HANDLE_STYLE` (schema) already carry
  `var(--color-cat-*)` strings; only `CATEGORY_HEX` (the React Flow minimap,
  whose SVG `fill` *attribute* cannot resolve `var()`) and the canvas
  background dots need JS-side theme awareness.

So a theme is one unlayered `html[data-theme="…"]` block overriding tokens
(unlayered beats Tailwind's `@layer theme` regardless of specificity), plus —
only for the two themes that retint categories — a small JS hex table for the
minimap.

## What changes

### 1. Six curated themes — `src/editor/settings/theme.ts` + `index.css`

- `THEMES` table (id, label, one-line hint, preview swatches), a module-level
  current theme, `setTheme` (persist `qe.theme`, set
  `document.documentElement.dataset.theme`, set `style.colorScheme`,
  notify), `applyStoredTheme()` on import (covers tests; the inline boot
  script below covers first paint), `subscribeTheme`.
- `index.css`: `html[data-theme="high-contrast"|"daylight"|"phosphor"|"dusk"|"slate"]`
  token blocks. Chrome only for Phosphor/Dusk/Slate — **category hues stay
  the standard set** so the canvas keeps its at-a-glance reading language
  (the design-token block's own contract). High Contrast brightens the
  category set; Daylight darkens it (bright amber text on cream is
  unreadable) — both as *sets*, never per-colour.
- `THEME_CATEGORY_HEX` (only High Contrast + Daylight entries) consulted by
  the canvas minimap next to `CATEGORY_HEX`.
- The minimap mask and the background dots move off hardcoded rgba/hex onto
  theme-driven values (`withAlpha(void…)` / a `--color-canvas-dots` token —
  whichever the React Flow prop accepts; **verify in the dist, never guess**).
- `readableOn()` and author-picked frame/beat colours are content, not
  chrome — untouched.

### 2. Typography — `src/editor/settings/uiFont.ts` + self-hosted fonts

- `UI_FONTS`: System (default), Readable system (Verdana-led stack),
  Atkinson Hyperlegible, Lexend, JetBrains Mono. `setUiFont` mirrors the
  theme module (`qe.uiFont`, `dataset.font`).
- `html[data-font="…"] { --font-sans: … }` overrides; `@font-face` with
  `font-display: swap` in `index.css`, files in `public/fonts/` (latin
  subsets, weights 400/500/600/700 where the family has them; Atkinson ships
  400/700 and CSS font-matching handles the rest). OFL license files land
  next to the woff2s.
- Why not OpenDyslexic: its licence is not the clean OFL of the Google Fonts
  families, and Atkinson Hyperlegible + Lexend are the two dyslexia-friendly
  faces with proper open licences. Can be added later if asked for by name.
- The website builder's **code view stays fixed-dark** (its Prism syntax
  hexes are tuned for a dark surface, like an embedded terminal) — pinned in
  CSS, noted in the dialog? No — silent is fine; it is a sub-surface.

### 3. Snap grid size — `snapGrid.ts` grows a step preference

- `snapStep()` / `setSnapStep()` (11 | 22 | 44, default 22, key
  `qe.snapStep`), same module shape as the on/off toggle.
- `QuestCanvas`: `SNAP_GRID` becomes reactive (`useSyncExternalStore`), the
  align call passes the live step, and the canvas **dot pattern gap follows
  it** — the dots are the grid; they must not lie. `arrange()`'s default
  spacing follows the same step (one mental model: grid = alignment
  spacing — the decision Zeis approved).
- `GRID = 22` stays as the default constant in `arrange.ts` (tests and pure
  functions keep their meaning).

### 4. Wire dot drift speed — `wireMotion.ts`

- `DOT_PERIOD_S` becomes the default of a stored preference:
  `dotPeriodS()` / `setDotPeriod()` (key `qe.dotPeriod`). Calm 2.4s,
  Standard 1.4s, Brisk 0.8s per 14px gap.
- `animate()`, `paintDashOffset()` and the phase pin read the live value;
  changing it restarts running animations (`stop()` + `start()` — the
  registered-layer bookkeeping from r43 is exactly what makes this safe).
- The export name `DOT_PERIOD_S` stays (tests read it as the default).

### 5. Editor data section — `src/editor/settings/reset.ts`

- `resetEditorPreferences()`: theme → Midnight, font → System, snap off,
  step 22, motion on, physics on (the OS reduced-motion default), tuning →
  defaults, drift → standard; every `qe.*` key removed from localStorage.
- `clearDraftUi()` wraps `store/autosave.clearDraft` — the draft key is
  `hackhub-quest-editor:draft:v1`; packs have their own manager and are NOT
  touched here.
- Both actions in the sheet are two-step (Confirm / Cancel), matching the
  pack manager's remove pattern.

### 6. Settings sheet layout

Theme (swatch cards, click = instant apply, live preview beside the canvas)
→ Typography (select) → Canvas (snap switch + grid size) → Wires (toggles +
drift speed) → Wire physics — feel (dials, unchanged) → Editor data.

### 7. First paint without a flash — `index.html`

Tiny inline script in `<head>` applies `data-theme` / `data-font` from
localStorage before CSS paints. The `class="dark"` (inert — nothing keys off
it) goes away; `<meta name="color-scheme">` becomes `dark light`, and the
theme module sets the live one.

## What does NOT change

- No compiler/schema/analysis changes; **no `EDITOR_BUILD` bump** (AR13).
- No UI scale, no free-form colour picker, no theme touching author content
  (website page colours, frame/beat colours, export output).
- `runtimeSource.ts` untouched.

## Gates

- `npm run typecheck` 0 errors; `npm test` green; `npm run build` succeeds.
- New coverage: theme/font modules (persist + `dataset` + invalid stored
  values ignored), snap step (module + align spacing uses it), drift speed
  (period arithmetic via `paintDashOffset` — compute, don't measure — and
  animations survive a speed change), reset-all (every module back to
  default, keys gone), clear-draft (key emptied), sheet renders/applies all
  of the above, two-step confirms on the destructive buttons.
- jsdom cannot see a palette or a typeface: the six themes' actual look, the
  fonts rendering, and the dots' speed are **Zeis's eyes** — called out in
  the HANDOFF, as usual.

## Stamp

None — nothing the compiler emits changes.
