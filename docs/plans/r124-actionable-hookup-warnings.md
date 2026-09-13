# Actionable hookup warnings — r124

Zeis (HANDOFF item 2): *\"Much better 'something isn't hooked up' warnings — a
red-triangle-exclamation that explains in detail what is wrong, what is missing,
and which nodes to put where to fix it. Currently issues surface as terse
badges; he wants them actionable.\"*

r123 built the field-level mechanism (⚠ beside a field label, hover = what's
wrong + next step) and three rules, and surfaced node issues in the inspector
header. What is still terse is the **node-level** layer: `No trigger`,
`Dead end`, `Unreachable`, `Empty` carry a one-sentence detail and no
next step — they say *something* is wrong but not *which nodes to put where*.
Two r123 Phase-4 items also never landed: empty target IPs, and files-placement
precision ("no device matches that address" only appears at export, when the
files are already dropped).

## Plan

### 1. Every node issue gets a `nextStep` ("which nodes to put where")

Add required `nextStep: string` to `GraphIssue` in `analysis/graph.ts`:

| Issue | Next step (draft copy) |
|---|---|
| No trigger (danger) | Wire a When event node into this objective's trigger socket — pick the game event that means the player did it. |
| Dead end, Branch | Wire the "Yes"/"No" outcome to the node that should run when the answer is yes/no. (names the missing output) |
| Dead end, Manual input | Wire the "Correct"/"Wrong" answer to the node that should run next. |
| Dead end, Sequence | Wire the "…" step to the node that should run at that point, or remove the step. (names the step) |
| Unreachable | Drag a wire from the node that should run it into this node's input — usually the last node of your Quest start chain. |
| Empty (per entry) | Wire the nodes that should run at "Quest start" to its output — usually your briefing mail first — or delete it if you don't need it. (entry-specific first-node hint) |

Game vocabulary only (Quest start, When event, briefing mail — all in-game
terms). No mod-coding jargon.

### 2. Render the next step where the issue is already shown

- Inspector header (`InspectorPanel.tsx`): each issue shows `Next step: …`
  under its detail, in the existing severity colours. No new component.
- Canvas summary tooltip (`QuestCanvas.tsx` title) and the card badge tooltip
  (`GraphNode.tsx` title): append each issue's next step after its detail.
- Status bar: unchanged (counts only).

### 3. Unify: retire the path-`""` banner fork

The inspector header currently shows the field-warning banner *instead of* the
issue list when both exist (`!banner` suppression) — two mechanisms rendering
the same "No trigger" problem. With `nextStep` on the issue, the banner is
redundant:

- Move the objective rule out of `analysis/fields.ts` (delete it; graph.ts
  "No trigger" + nextStep is the single source).
- Delete the banner branch in `InspectorPanel.tsx`; render issues only.
- Move the two banner tests from `fields.test.ts` to `graph.test.ts` as
  nextStep assertions.

Net effect should be fewer lines, one warning language everywhere.

### 4. Field rules: the r123 Phase-4 leftovers

In `analysis/fields.ts`:

1. **Empty target IP** (`world.port` "Device IP", `world.firewall` "Protected
   IP"): warn/amber — "No machine set — this node does nothing until it points
   at one." Next step: "Type `{{data.targetIp}}` to aim it at the machine your
   network created." Amber, not red: a fresh node is unfinished, not broken —
   and field warnings only show while the node is selected, so this can't nag
   from across the canvas.
2. **Seed-files placement, mirrored from the compiler.** `seedRemoteFiles.ts`
   drops device-targeted files at export with "no device matches that address"
   / "that device has no user account" — the author learns this after export.
   Export a pure `placementFor(seed, networks)` helper from
   `seedRemoteFiles.ts` (refactor of the existing `deviceFor` + `ownerFor`
   logic; behaviour-preserving, proven by the existing byte-identical snapshot
   tests) and call it from `fields.ts`:
   - networks exist but nothing matches and the single-device fallback can't
     resolve → danger/red on the IP field, next step listing the addresses
     that do exist;
   - device matches but has no user account → danger/red, "Add a user account
     to that device — files mount under a user's home folder."
   - empty file list → no warning (nothing to place; avoids nagging over an
     untouched node).
3. **Deliberately excluded:** `world.domain` "Resolves to" (the runtime falls
   back to `{{data.targetIp}}` when empty, so it still works — no warning);
   `world.toolResponse` input (empty-input engine behaviour unverified, and we
   don't guess).

### 5. Guards

- `graph.test.ts`: every issue from `analyseGraph` carries a non-empty
  `nextStep` (structural guard), plus per-issue copy assertions.
- `fields.test.ts`: empty-IP warn/clear, files no-match/no-user danger, empty
  file list silence, single-device fallback silence.
- Rendering test (`fieldWarningBadge.test.tsx` + header): "Next step:" text
  appears in the inspector header for a flagged node and clears when fixed.
- Falsify every new guard: revert the fix, confirm red, restore.
- No `EDITOR_BUILD` bump: no compiler output change (snapshot tests prove
  byte-identical mod.js).

## Audit (challenging the plan before building)

- **Is retiring the banner churn?** No: it deletes a fork (banner branch +
  suppression condition + a rule duplicated across two modules) and the net
  diff should remove lines. One warning language is the point of this round.
- **Will empty-IP amber nag on fresh nodes?** Field warnings render only in
  the inspector for the selected node — never as canvas badges — so the worst
  case is guidance where you're already editing. Amber, not red. Acceptable,
  and it is literally "what is missing".
- **Could the files-placement mirror drift from the compiler?** Only if
  duplicated — hence the shared `placementFor` helper with a single
  implementation. The existing compiler snapshot tests pin behaviour.
- **`Unwired` was dead — outcome:** falsifying the structural guard proved no
  test graph can produce it (a non-root only becomes reachable by following an
  edge that targets it, so it always has an input). Removed rather than kept
  as a rule no test can exercise. Recorded in a code comment at the site.
- **No `GraphIssue` literals are constructed in tests** (checked), so making
  `nextStep` required breaks no test setup — only `analyseGraph` itself.
- **jsdom limits:** it can assert nextStep markup, aria labels, and
  appear/disappear behaviour. It cannot verify tooltip hover visuals or that
  the red triangle "reads" well — those go to Zeis in the live preview.

## Not doing

- Migrating the ~17 compile warnings into fields (r123 scoped these out:
  quest/mod-level, belong in the export report).
- Highlighting the unwired socket on the card (visual; needs live-preview
  verification — follow-up candidate).
- Settings page (HANDOFF item 3, separate round).
