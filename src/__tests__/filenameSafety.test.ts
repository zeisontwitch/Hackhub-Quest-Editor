/**
 * The Windows name-twin guard (r146).
 *
 * The grey screen that survived r144 and r145 was this: the component lived
 * in `CanvasGrid.tsx` and the preference module in `canvasGrid.ts` — same
 * folder, same name ignoring case and extension. Linux (this sandbox, CI)
 * treats those as two unrelated files; Windows (NTFS, case-insensitive)
 * does not. An extensionless `import ... from "./CanvasGrid"` asks the
 * filesystem "does CanvasGrid.ts exist?" — Windows answers yes (it is
 * canvasGrid.ts), Vite's resolver tries `.ts` before `.tsx`, and the import
 * binds to the wrong module. The browser then dies with `doesn't provide an
 * export named: 'CanvasGridBackground'` and the editor never mounts: a grey
 * screen that no Linux-side gate can see.
 *
 * The rule this test enforces: within any directory, no two files that the
 * bundler might resolve an extensionless import to (the JS/TS family) may
 * share a lowercased stem. `foo.ts` next to `Foo.tsx` is exactly as fatal
 * as `foo.ts` next to `foo.tsx`. If this test fails, rename a file.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** Extensions Vite's resolver tries for an extensionless import. */
const RESOLVABLE_EXTENSIONS = new Set([
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".mjs",
    ".cjs",
    ".mts",
    ".cts",
    ".json",
]);

/** Root-level files the test also guards (the bundler resolves these too). */
const ROOT_ENTRY_FILES = /^(vite\.config|vitest\.setup)\.(ts|mts|mjs)$/;

function* walk(dir: string): Generator<string> {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            // Dependencies, build output and VCS data are out of scope.
            if (entry === "node_modules" || entry === ".git" || entry === "dist" || entry === ".vite") continue;
            yield* walk(full);
        } else {
            yield full;
        }
    }
}

function stemAndExtension(file: string): { stem: string; ext: string } {
    const base = file.split(/[\\/]/).pop() ?? file;
    const dot = base.lastIndexOf(".");
    if (dot <= 0) return { stem: base.toLowerCase(), ext: "" };
    return { stem: base.slice(0, dot).toLowerCase(), ext: base.slice(dot).toLowerCase() };
}

describe("no Windows name-twins among importable files", () => {
    it("every directory's JS-family files have distinct case-insensitive stems", () => {
        const byDirectory = new Map<string, Map<string, string[]>>();
        for (const file of walk(".")) {
            const { stem, ext } = stemAndExtension(file);
            if (!RESOLVABLE_EXTENSIONS.has(ext)) continue;
            const depth = file.split(/[\\/]/).length - 1;
            if (depth === 0 && !ROOT_ENTRY_FILES.test(file)) continue;
            const dir = file.split(/[\\/]/).slice(0, -1).join("/") || ".";
            if (!byDirectory.has(dir)) byDirectory.set(dir, new Map());
            const stems = byDirectory.get(dir)!;
            if (!stems.has(stem)) stems.set(stem, []);
            stems.get(stem)!.push(file);
        }
        const twins: string[] = [];
        for (const [, stems] of byDirectory) {
            for (const [, files] of stems) {
                if (files.length > 1) twins.push(files.join("  <->  "));
            }
        }
        expect(twins, `Name twins a case-insensitive filesystem cannot tell apart:\n${twins.join("\n")}`).toEqual([]);
    });
});
