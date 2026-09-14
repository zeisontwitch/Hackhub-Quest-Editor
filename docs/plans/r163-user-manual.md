# r163 — Standalone user manual

## Why
The user asked for a proper user manual as a **simple standalone HTML file**
documenting every feature, step, and item of the HackHub Quest Editor.
Structure inspiration only: https://fuibar.xo.je/manual.html (single page,
sticky section nav, key-cap tables, dense prose). Content must be OUR real,
code-verified features — never FUI's node content.

## Rule this serves
Not a code-quality fix; it is a documentation deliverable the user explicitly
requested. It touches no compiler output, so `EDITOR_BUILD` is **not** bumped.

## Where
`public/manual.html` — a self-contained page (inline CSS, no build step, no JS
dependencies). Lives under `public/` so it ships with the app and can be opened
straight off disk (`file://`) as a standalone reference, matching the "simple
standalone HTML file" request.

## Verified against code (not memory — the r148 doc counts were stale)
- Node types: **34** in **10 categories** — `src/schema/registry.ts`
  (`CATEGORIES`, one registry entry per type). Categories: Quest lifecycle,
  Objectives, Triggers, World building, Communication, Custom terminal,
  Effects, Community addons, Flow control, Layout.
- Templates: **13** — `src/templates/index.ts`.
- Events: **92**, SDK `@hotbunny/hackhub-content-sdk@0.21.0` —
  `reference/hackhub-events.json` (`count`, `generatedFrom.version`), grouped
  into 10 groups in `src/schema/events.ts` (`EVENT_GROUPS`).
- Shortcuts: `SHORTCUT_GROUPS` in `src/editor/shell/Overlays.tsx` (Editing /
  Add nodes / Select / Wiring / Move around).
- Top bar buttons: `src/editor/shell/TopBar.tsx` — New, Save, Load, Addons,
  Dialogues, Dry run, Websites, Shortcuts, Settings, Export mod; plus quest
  strip (Add / Duplicate / Delete quest, Undo, Redo).
- Settings sections: `src/editor/shell/SettingsDialog.tsx` — Theme, Typography,
  Canvas (Grid size, Canvas grid, Grid colour), Wires (Drift speed), Editor
  data. Themes (6) `settings/theme.ts`; fonts (7) `settings/uiFont.ts`.
- Export: `src/editor/shell/ExportDialog.tsx` → `buildModZip` → `.zip`
  containing manifest.json, package.json, tsconfig.json, esbuild.config.mjs,
  README.md, src/index.ts, dist/mod.js, dist/manifest.json. In-browser only.
- Inspector helpers: dice generate (`GenerateButton.tsx`, r161/r162) and
  sparkle tag-insert; sims in `src/editor/inspector/sims/` (10 files).
- Website builder: `src/editor/websites/WebsiteBuilder.tsx`.

## Gates
Doc-only change: `npm run typecheck`, `npm test`, `npm run build` still run to
confirm nothing regressed (public asset is copied verbatim by Vite).

## Housekeeping
README roadmap + HANDOFF updated; r158 archived to keep "Done recently" at 5.
No `EDITOR_BUILD` bump (no compiler-output change).
