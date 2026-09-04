/**
 * The install has to be quiet AND fast.
 *
 * `Launch.bat` runs an install in front of a non-coder, so anything npm prints
 * there reads as a fault — and anything slow reads as a hang. Three problems
 * have reached QA this way, the last two self-inflicted:
 *
 *   1. npm warn deprecated whatwg-encoding@3.1.1: Use @exodus/bytes instead
 *   2. npm warn EBADENGINE jsdom@30.0.1 wants node ^22.22.2 || ^24.15.0 …
 *      (fixing 1 by taking the newest jsdom, which wants a newer Node than
 *      the project supports)
 *   3. a first-run install going from under 10 seconds to several minutes
 *      (fixing 2 with jsdom 28, which drags in undici, css-tree and mdn-data —
 *      about 3.7 MB of packages jsdom 26 never needed)
 *
 * A cosmetic warning in a dev-only dependency is not worth minutes of an
 * author's time, so jsdom stays on 26 and the deprecation notice stays. What
 * is guarded here is the part that actually costs the author something: the
 * Node floor, and the weight of the dependency tree.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Pkg = {
    engines?: { node?: string };
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
};

const root = process.cwd();
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as Pkg;
const lock = JSON.parse(readFileSync(resolve(root, "package-lock.json"), "utf8")) as {
    packages: Record<string, { version?: string; engines?: { node?: string }; dev?: boolean }>;
};

/** The lowest Node the project claims to run on, as [major, minor, patch]. */
function declaredFloor(): [number, number, number] {
    const range = pkg.engines?.node ?? "";
    const m = /(\d+)\.(\d+)\.(\d+)/.exec(range);
    if (!m) throw new Error(`package.json engines.node is not a plain floor: ${range}`);
    return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** Does `range` admit some version at or above our declared floor? */
function admitsOurFloor(range: string): boolean {
    const [fMaj, fMin, fPat] = declaredFloor();
    return range.split("||").some((clause) => {
        const c = clause.trim();
        const m = /(\d+)\.(\d+)\.(\d+)/.exec(c);
        if (!m) return true; // "*", ">=0", or something we cannot read: not a floor
        const [maj, min, pat] = [Number(m[1]), Number(m[2]), Number(m[3])];
        const atLeast = maj > fMaj || (maj === fMaj && (min > fMin || (min === fMin && pat > fPat)));
        const equal = maj === fMaj && min === fMin && pat === fPat;
        if (c.startsWith("^") || c.startsWith("~")) {
            // A caret clause only helps if its own major matches our floor's.
            return maj === fMaj && !atLeast;
        }
        if (c.startsWith(">=") || c.startsWith(">")) return !atLeast || equal;
        return true;
    });
}

describe("the toolchain installs without warnings", () => {
    it("uses npm ci with audit and fund switched off in the launcher", () => {
        /* The whole reason a first run went from seconds to minutes. npm's
           audit lookup is one network call that stalled for seven minutes in
           testing; the same install takes three seconds without it. Measured
           against origin/main too, which is equally slow with audit on — so
           this was never something the project's own dependencies caused. */
        const bat = readFileSync(resolve(root, "Launch.bat"), "utf8");
        expect(bat).toMatch(/npm ci .*--no-audit/);
        expect(bat).toMatch(/npm ci .*--no-fund/);
        // and the fallback must not reintroduce the stall
        expect(bat).toMatch(/npm install .*--no-audit/);
        // an already-installed folder should not reinstall at all
        expect(bat).toContain("node_modules\\.package-lock.json");
    });

    it("declares the Node version it needs", () => {
        expect(pkg.engines?.node, "package.json needs an engines.node floor").toBeTruthy();
    });

    it("asks for no package that requires a newer Node than we declare", () => {
        const [fMaj, fMin, fPat] = declaredFloor();
        const tooNew: string[] = [];
        for (const [path, meta] of Object.entries(lock.packages)) {
            const range = meta.engines?.node;
            if (!path || !range) continue;
            if (!admitsOurFloor(range)) {
                tooNew.push(`${path.replace(/^node_modules\//, "")}@${meta.version}: needs ${range}`);
            }
        }
        expect(
            tooNew,
            `these want a newer Node than engines.node (${fMaj}.${fMin}.${fPat}); npm prints EBADENGINE for each`,
        ).toEqual([]);
    });

    it("keeps the dependency tree small enough to install quickly", () => {
        /* r61 took jsdom 28 to silence a deprecation warning and pulled in
           undici (1.6 MB), css-tree (1.4 MB) and mdn-data (0.7 MB). A first
           run went from under ten seconds to minutes. The exact count matters
           less than noticing a jump: if this fails, check what was added and
           whether it is worth the wait. */
        const count = Object.keys(lock.packages).filter((p) => p).length;
        expect(count).toBeLessThanOrEqual(285);
    });

    it("does not pull the heavy transitives jsdom 28+ brings in", () => {
        // Named individually so the failure says which one came back.
        for (const heavy of ["undici", "css-tree", "mdn-data"]) {
            const present = Object.keys(lock.packages).some((p) => p.endsWith(`node_modules/${heavy}`));
            expect(present, `${heavy} is back — a first install just got slower`).toBe(false);
        }
    });
});
