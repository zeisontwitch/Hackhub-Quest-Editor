# r152 — Warning cards + house-style pack event labels (plan)

## Problem (Zeis's r151 review, all four points)
1. Export warnings render as `<li>• {w}</li>` — a grey wall of text that is
   easy to glance over and ignore. Entries need visual separation.
2. Pack event labels are full sentences ("A file was downloaded from a
   breached machine — Example Tools") next to built-ins ("Terminal: Cat"),
   and they truncate in the picker. Root cause: the pack *authors* write the
   labels, and r137/r149 wrote sentences (the format spec even teaches it:
   "`label` | Plain words for the picker row. \"A file was downloaded…\"").
3. Queue: auto-generate button for name/IP-like fields (+ tag-insertion
   audit for tag-accepting fields).
4. Queue: extend "Add a common port" to everything the game uses; vuln-type
   dropdown entries gain display-only descriptions.

## Fix 1: warning cards (this round)
- New shared `src/components/WarningList.tsx`: each warning its own
  amber-tinted card row (`border-warn/25 bg-warn/5`) with the `alert` triangle
  icon. The context prefix (everything before the first `": "`, i.e. the
  quest or host every warning family leads with) renders semibold in ink;
  the rest in ink-2. No-colon warnings render whole (graceful fallback —
  e.g. the pack-mods honesty line).
- Used by ExportDialog ("Good to know") and SimulatorDialog (problems).
  Flat markup inside the row (icon span, optional `<strong>`, bare tail
  text) so `getByText(/…/)` keeps matching once.
- Tests: head/tail split, no-colon fallback, both dialogs still surface
  the telnet warning (existing tests, unchanged assertions).

## Fix 2: house-style labels (this round)
- Both packs' event labels rewritten to short "Group: Thing" form, matching
  the built-in `humanEventName` style:
  - example pack: "Breach: File downloaded", "Scan: Finished".
  - recon-ng: "Breach: Session opened", "Breach: Desktop opened",
    "Breach: Directory listed", "Breach: File read",
    "Breach: File downloaded", "Breach: File deleted",
    "Breach: Machine shut down", "Breach: Session closed",
    "User enum: Probe complete".
  - Long sentences stay where they belong: the events' `docs` (shown in
    the picker's explainer) are untouched.
- Spec update (`docs/ToolPack-Format.md`): `label` is a short picker row in
  "Group: Thing" form like the built-ins; the sentence goes in `docs`.
- Picker insurance: `title` attributes on the picker's truncated lines so a
  long label is one hover away from fully readable (helps built-ins too).
- Tests: the two example-pack label assertions updated to the new words.

## Queue (recorded, not built)
- README "Next up" 9: auto-generate button (IP/hostname/domain/router
  model, in-editor random, exports hardcoded; needs name/number lists) +
  the tag question (does Create-network IP accept the game's random-IP tag?
  tag-insertion buttons limited to relevant tags everywhere).
- README "Next up" 10: extend "Add a common port" to everything the game
  commonly uses (e.g. Telnet); vuln-type dropdown entries gain short
  display-only descriptions ("RCE (telnet)"-style example).

## Gates
- `npm run typecheck` clean; full `npm test` green; `npm run build` clean.
- Stamp `2026-09-13.r152`.
