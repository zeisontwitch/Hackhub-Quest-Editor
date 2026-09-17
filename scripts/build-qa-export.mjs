/**
 * Regenerates `reference/sdk-0.24-qa/editor-export/` from the QA project.
 *
 * The installable QA export is evidence, and evidence that drifts is worse than
 * no evidence: r166 shipped this folder, r172/r173 added a second QA quest to
 * the project, and the folder sat on the r166 build until r175 — it still
 * claimed to contain only `QESdk024EditorQa`. The guard test
 * (`src/compiler/__tests__/sdk024QaExport.test.ts`) now fails on any drift and
 * names this script as the fix.
 *
 * The compiler is loaded through Vite's SSR loader, so the output is literally
 * what the Export dialog would zip — never a hand-copied file.
 *
 * Two files are deliberately not raw compiler output:
 *   - `src/index.ts` gains a leading `// @ts-nocheck`. tsconfig.json typechecks
 *     everything under `reference/`, the generated mod source calls CommonJS
 *     `require` and the repo has no node types in scope, so without the pragma
 *     `npm run typecheck` fails on the export.
 *   - `README.md` gets `editor-export.notes.md` appended: the hand-maintained
 *     observations that belong in the folder the tester actually installs.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createServer } from "vite";

const PROJECT_FILE = "reference/sdk-0.24-qa/projects/sdk-0.24-ingame-qa.project.json";
const EXPORT_DIR = "reference/sdk-0.24-qa/editor-export";
const NOTES_FILE = "reference/sdk-0.24-qa/editor-export.notes.md";

/** Every path the export must contain, mapped to its exact content. */
async function compiledExport() {
    const server = await createServer({
        server: { middlewareMode: true },
        appType: "custom",
        logLevel: "error",
    });
    try {
        const { parseProjectFile } = await server.ssrLoadModule("/src/templates/share.ts");
        const { compileProject } = await server.ssrLoadModule("/src/compiler/compile.ts");

        const parsed = parseProjectFile(readFileSync(PROJECT_FILE, "utf8"));
        if (!parsed.ok) throw new Error(`${PROJECT_FILE} does not parse: ${parsed.error}`);

        const files = new Map(compileProject(parsed.project).files.map((f) => [f.path, f.content]));
        files.set("src/index.ts", "// @ts-nocheck\n" + files.get("src/index.ts"));
        files.set("README.md", files.get("README.md") + readFileSync(NOTES_FILE, "utf8"));
        return files;
    } finally {
        await server.close();
    }
}

function existingFiles(dir, out = []) {
    if (!existsSync(dir)) return out;
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) existingFiles(full, out);
        else out.push(full);
    }
    return out;
}

/** Drop anything the compiler no longer emits, so the folder cannot go stale. */
function prune(files) {
    const expected = new Set([...files.keys()].map((p) => join(EXPORT_DIR, p)));
    for (const file of existingFiles(EXPORT_DIR)) {
        if (!expected.has(file)) {
            console.log(`  removed stale ${file}`);
            rmSync(file);
        }
    }
    for (const dir of [join(EXPORT_DIR, "src"), join(EXPORT_DIR, "dist")]) {
        if (existsSync(dir) && readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
    }
}

const files = await compiledExport();
prune(files);
for (const [path, content] of files) {
    const full = join(EXPORT_DIR, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
    console.log(`  wrote ${full}`);
}
console.log(`\n${EXPORT_DIR} regenerated from ${PROJECT_FILE} (${files.size} files).`);
