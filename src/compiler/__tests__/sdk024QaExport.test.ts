/**
 * The installable QA export must be exactly what the editor compiles today.
 *
 * r175. `reference/sdk-0.24-qa/editor-export/` was produced by hand in r166 and
 * then drifted in silence: r172/r173 added `QESdk024TimerQa` to the QA project,
 * the folder kept claiming to hold one quest, and no gate read it — the same
 * failure the manual's search index had (r174). The folder is an artifact a
 * person installs into the game, so a stale one is worse than none.
 *
 * These gates compile the committed project and compare every byte, so any
 * project change that is not followed by `npm run gen:qa-export` fails here.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import { compileProject } from "../compile";
import { parseProjectFile } from "@/templates/share";

const QA_DIR = join(process.cwd(), "reference", "sdk-0.24-qa");
const EXPORT_DIR = join(QA_DIR, "editor-export");
const PROJECT_FILE = join(QA_DIR, "projects", "sdk-0.24-ingame-qa.project.json");
const NOTES_FILE = join(QA_DIR, "editor-export.notes.md");

/**
 * What `scripts/build-qa-export.mjs` writes. Keep the two in step: `src/index.ts`
 * needs the `@ts-nocheck` pragma because tsconfig.json typechecks `reference/`,
 * and the README carries the hand-written notes so the installed folder explains
 * itself.
 */
function expectedExportFiles(): Map<string, string> {
    const parsed = parseProjectFile(readFileSync(PROJECT_FILE, "utf8"));
    if (!parsed.ok) throw new Error(`${PROJECT_FILE} does not parse: ${parsed.error}`);
    const files = new Map(compileProject(parsed.project).files.map((f) => [f.path, f.content]));
    files.set("src/index.ts", "// @ts-nocheck\n" + files.get("src/index.ts"));
    files.set("README.md", files.get("README.md") + readFileSync(NOTES_FILE, "utf8"));
    return files;
}

function existingFiles(dir: string, out: string[] = []): string[] {
    if (!existsSync(dir)) return out;
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) existingFiles(full, out);
        else out.push(relative(EXPORT_DIR, full).split("\\").join("/"));
    }
    return out;
}

describe("SDK 0.24 QA export", () => {
    it("matches the compiler, byte for byte", () => {
        const expected = expectedExportFiles();
        const wrong = [...expected]
            .filter(([path, content]) => {
                const full = join(EXPORT_DIR, path);
                return !existsSync(full) || readFileSync(full, "utf8") !== content;
            })
            .map(([path]) => path);
        expect(
            wrong,
            `reference/sdk-0.24-qa/editor-export disagrees with the compiler:\n  ` +
                `${wrong.join("\n  ")}\n  Run \`npm run gen:qa-export\` (never edit the export by hand).`,
        ).toEqual([]);
    });

    it("holds nothing the compiler does not emit", () => {
        const expected = expectedExportFiles();
        const extra = existingFiles(EXPORT_DIR).filter((path) => !expected.has(path));
        expect(
            extra,
            `${extra.length} file(s) sit in the export that the compiler does not emit:\n  ` +
                `${extra.join("\n  ")}\n  Run \`npm run gen:qa-export\` to prune them.`,
        ).toEqual([]);
    });

    it("ships both QA quests in the installed mod", () => {
        const mod = readFileSync(join(EXPORT_DIR, "dist", "mod.js"), "utf8");
        expect(mod).toContain('"QESdk024EditorQa"');
        expect(mod).toContain('"QESdk024TimerQa"');
    });
});
