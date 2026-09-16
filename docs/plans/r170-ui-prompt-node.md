# r170: Ask player prompt node

## Goal

Expose the SDK 0.24 `UI.prompt` surface as a no-code story node without turning
it into a form builder. The node should let authors ask one line of text at a
specific point in the graph, optionally save the answer, and optionally branch on
whether it matches an expected answer.

## Evidence checked

`node_modules/@hotbunny/hackhub-content-sdk/index.d.ts` declares:

```ts
UI.prompt(options?: {
    title?: string;
    label?: string;
    placeholder?: string;
    password?: boolean;
    defaultValue?: string;
}): Promise<string | null>;
```

The SDK comment says a call from quest code or a mod app opens a dialog, while a
call from a command asks in that terminal. The editor uses the quest-code path:
show the prompt when the story reaches the node, then continue after the promise
resolves.

No in-game pass was possible in the sandbox. The implementation therefore stays
small and literal, and the generated code routes cancel/failure safely instead of
assuming the happy path always happens.

## Editor surface

New node: **Ask player** (`fx.prompt`), under **Effects**.

Fields, all with author-facing hints:

- **Title** — optional heading.
- **Question** — label above the answer box.
- **Example text** — placeholder.
- **Starts filled with** — default value.
- **Mask typing** — password-style input.
- **Save answer as** — optional quest-data key for later `{{data.name}}` use.
- **Accept** — any answer, exact answer, contains, or pattern.
- **Answer to accept** and **Case sensitive** — shown only when a checked answer
  is selected.

Sockets:

- **Submitted** + **Cancelled** when any submitted answer is accepted.
- **Correct** + **Wrong** + **Cancelled** when the answer is checked.

The socket ids are stable (`success`, `failure`, `cancel`) so switching between
open and checked answers keeps the success/correct wire in place and only prunes
the wrong wire when it no longer exists.

## Runtime behavior

When reached, the generated runtime:

1. Fills title/question/example/default text through normal `{{data.*}}` tags.
2. Calls `sdk.UI.prompt(options)`.
3. Sends `null`/`undefined` answers to **Cancelled**.
4. Saves submitted text through `questRef.SetData(key, answer)` when requested.
5. Checks the answer only when **Accept** is not “Any submitted text”.
6. Follows **Submitted/Correct** or **Wrong** accordingly.

If `UI.prompt` is missing at runtime, the node logs that fact and follows
**Cancelled** instead of continuing down the success path.

## Guards

- Schema/registry count raised to 38 node types.
- `promptSockets` unit tests pin the dynamic socket labels.
- Compiler tests cover permissions, prompt options, saving, success routing and
  cancel routing.
- Field-warning tests cover a checked prompt with no accepted answer.
- Dry-run stub records prompt calls and returns a deterministic answer.
- Node Reference template now includes Ask player and has `nodeCount: 48`.
- Manual inventory/pages regenerated; Ask player has its own manual page and
  screenshot placeholder in the shot list.

## Validation

Completed before committing:

```text
npm run gen:manual
npx vitest run src/schema/__tests__/schema.test.ts src/compiler/__tests__/compile.test.ts src/analysis/__tests__/fields.test.ts src/analysis/__tests__/graph.test.ts src/__tests__/qa.test.tsx
npx vitest run src/analysis/__tests__/fields.test.ts src/compiler/__tests__/simulate.test.ts src/templates/__tests__/templates.test.ts src/manual.coverage.test.ts
npm run typecheck
npm test   # 1,560 tests / 79 files
npm run build
```

