/**
 * The one Twotter fact both the schema and the compiler need.
 *
 * It lives in its own module for a boring but load-bearing reason: the manual's
 * inventory script loads `src/compiler/compile.ts` through jiti, and
 * `src/schema/project.ts` pulls in `@/templates/pages`, which imports `.html`
 * files that only Vite can resolve. Keeping the pattern in a leaf file lets the
 * compiler and the schema share it without dragging the editor's HTML into a
 * Node script. (Same class of problem as the note at the bottom of
 * `scripts/extract-manual-inventory.mjs`.)
 */

/** Letters, numbers and `_`, 3–15 characters — what Twotter search matches on. */
export const TWOTTER_HANDLE_PATTERN = /^[A-Za-z0-9_]{3,15}$/;
