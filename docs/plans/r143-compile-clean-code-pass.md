# r143 (plan): Compile.ts clean code pass — function extraction, TSDoc, externalized constants

## Why this round

r139 split `computeWarnings` into eight focused helpers and replaced the
permission switch with a declarative map — the biggest violations in
`compiler/compile.ts`. A follow-up review found four functions still over
the F2 target (< 20 lines) and several exports missing TSDoc (C5). This
round cleans those up without changing what the compiler emits.

## What changed

### Function extraction (F1/F2)

| Function | Before | After | What was extracted |
|---|---|---|---|
| `warnNetworkStructure` | 87 lines | 41 lines | `walkDeviceStructure`, `findLoginlessDevices`, `findBadPortVersions` — each does one device-tree walk |
| `compileProject` | 94 lines | 59 lines | `buildScaffoldingFiles` — the package.json / esbuild.config / tsconfig generation |
| `warnWebsites` | 45 lines | 6 lines | `warnWebsitePages` (per-site checks) and `warnWebsiteHosts` (duplicate / placeholder host checks) |
| `warnDialogue` | 41 lines | 12 lines | `warnDialogueNode` — the per-node checks (replyable mail, phone+input, live conversations, kisscord uploads) |

`computePermissions` (25 lines) and `permissionsForPackNode` (32 lines)
were checked and left as-is — already well-structured, the latter is a
single switch statement that reads clearly at its current size.

### Externalized constants (A8/AR20)

- `LOGIN_SERVICES` — was a local array inside `warnNetworkStructure`, moved
  to a module-level constant with a TSDoc comment.
- `PLACEHOLDER_DOMAINS` — the inline regex `/^(www\.)?(example\.(com|net|org)|test\.com|localhost)$/i`
  extracted to a named module-level constant.

### TSDoc (C5)

Added TSDoc to five exports that were missing it:
- `CompiledFile` interface
- `CompileResult` interface
- `computePermissions` — explains the least-privilege contract (AR17)
- `computeWarnings` — lists the warning categories
- `compileProject` — explains the full pipeline

### registry.ts naming (recommendation, not changed)

Two node type keys have a prefix that doesn't match their category:
`world.packData` and `pack.node` are both `category: "community"` but keep
their `world.` / `pack.` prefixes (AR11). Renaming would be a breaking
change — saved projects, the schema, tests, and the compiler all reference
the keys. Flagged as a recommendation; not changed.

## Verification

- `npm run typecheck` — 0 errors
- `npm test` — 1375 tests passed (65 files)
- `npm run build` — succeeded
- No `EDITOR_BUILD` bump — the compiler emits nothing new (AR13). The
  refactoring is purely internal; the exported mod.js is byte-identical.
