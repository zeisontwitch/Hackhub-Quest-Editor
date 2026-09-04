/**
 * The install has to be quiet.
 *
 * `Launch.bat` runs `npm install` in front of a non-coder, and anything npm
 * prints there looks like something has gone wrong. Two warnings have reached
 * QA that way:
 *
 *   npm warn deprecated whatwg-encoding@3.1.1: Use @exodus/bytes instead
 *   npm warn EBADENGINE  package: 'jsdom@30.0.1',
 *                        required: { node: '^22.22.2 || ^24.15.0 || >=26.0.0' }
 *                        current:  { node: 'v24.14.1' }
 *
 * The second was self-inflicted: fixing the first by taking the newest jsdom
 * pulled in one that demanded a newer Node than the project asks for. These
 * tests make both mistakes mechanical to catch.
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

    it("does not depend on whatwg-encoding, which npm reports as deprecated", () => {
        const present = Object.keys(lock.packages).filter((p) => p.endsWith("node_modules/whatwg-encoding"));
        expect(present).toEqual([]);
    });
});
