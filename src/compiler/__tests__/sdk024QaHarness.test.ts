/**
 * The QA harness's "is the editor export loaded?" check (r193).
 *
 * The bug this exists for: a tester's local copy of the editor export stayed
 * **disabled** after he had disabled an older copy and deleted it from disk —
 * the game remembered the flag, and it survived a new version and a fresh save.
 * Because `Quest.claim()` returns void and nothing can enumerate installed mods
 * (SDK 0.24's `ModInfo` is a type with no reader), every `qe24 run tw1` printed
 * "Claimed" and did nothing at all, and the profile he was looking for could
 * never appear. The export now leaves a marker in `SharedVariables` (session
 * scoped, shared across mods) when it loads, and the harness reads it.
 *
 * These tests run the REAL harness file against a stub SDK, the same technique
 * `twotter.test.ts` uses for the compiled export: what is asserted is what the
 * tester would see on screen.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const HARNESS = readFileSync("reference/sdk-0.24-qa/mod/dist/mod.js", "utf8");
const EXPORT_KEY = "qe.export.loaded";

interface HarnessRun {
    lines: string[];
    claimed: string[];
}

/** Boot the harness mod against a stub SDK and run one `qe24` command. */
function runHarness(args: string[], opts: { marker?: string; noSharedApi?: boolean } = {}): HarnessRun {
    const lines: string[] = [];
    const claimed: string[] = [];
    const shared = new Map<string, unknown>();
    if (opts.marker !== undefined) shared.set(EXPORT_KEY, opts.marker);

    type CommandInstance = { Run: (tools: unknown) => Promise<void> };
    const holder: { cls?: new () => CommandInstance } = {};
    const sdk: Record<string, unknown> = {
        /* The harness extends these three base classes (`sdk.Quest` for its
           probe quests and `sdk.Bootstrap` for the mod itself), so the stub has
           to provide all of them or the file cannot even be evaluated. */
        Command: class {},
        Quest: class {},
        Bootstrap: class {},
        Events: { on: () => () => {}, emit: () => {}, off: () => {} },
        RegisterQuest: () => {},
        RegisterWebsite: () => {},
        RegisterModPackage: () => {},
        /* Enough Twotter for `qe24 twotter audit` to reach its own printing. */
        Twotter: { createUser: () => ({}), getUserByUsername: () => null },
        RegisterCommand: () => (cls: unknown) => {
            holder.cls = cls as new () => CommandInstance;
        },
    };
    Object.assign(sdk.Quest as object, {
        claim: (name: string) => {
            claimed.push(name);
        },
        unclaim: () => {},
    });
    if (!opts.noSharedApi) {
        sdk.SharedVariables = {
            get: (key: string) => shared.get(key),
            set: (key: string, value: unknown) => shared.set(key, value),
            remove: (key: string) => shared.delete(key),
            getAll: () => Object.fromEntries(shared),
        };
    }

    const mod = { exports: {} };
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function("require", "module", "exports", HARNESS)((name: string) => {
        if (name === "@hotbunny/hackhub-content-sdk") return sdk;
        throw new Error(`unexpected require: ${name}`);
    }, mod, mod.exports);

    const CommandClass = holder.cls;
    if (!CommandClass) throw new Error("the harness registered no command — did RegisterCommand change?");
    const tools = {
        getArgs: () => args,
        println: (line: string) => lines.push(line),
        printError: (line: string) => lines.push(`ERROR: ${line}`),
        print: (line: string) => lines.push(line),
    };
    const instance = new CommandClass();
    void instance.Run(tools);
    return { lines, claimed };
}

describe("the harness's export check", () => {
    it("says the export is loaded, with its version, when the marker is there", () => {
        const { lines } = runHarness(["run", "tw1"], { marker: "1.0.20 (2026-09-18.r193)" });
        expect(lines.some((l) => /Editor export: loaded \(v1\.0\.20/.test(l))).toBe(true);
        // …and it still does the thing it was asked to do.
        expect(lines.some((l) => /Claimed QESdk024TwotterQa/.test(l))).toBe(true);
    });

    it("says the export is NOT loaded when the marker is missing — the 2026-09-19 failure", () => {
        const { lines, claimed } = runHarness(["run", "tw1"]);
        expect(lines.some((l) => l === "Editor export: NOT LOADED in this session.")).toBe(true);
        // The answer names the cause and the fix, in the tester's words.
        expect(lines.join("\n")).toContain("Mods list");
        expect(lines.join("\n")).toContain("Enable it, restart the game");
        // The claim is still attempted (nothing may depend on the marker), and
        // the caveat about its silence is printed with it.
        expect(claimed).toEqual(["QESdk024TwotterQa"]);
        // The caveat is printed as its own two lines, so assert them as lines.
        expect(lines.some((l) => l.includes("cannot prove the"))).toBe(true);
        expect(lines.some((l) => l.includes("quest started - check the journal entry"))).toBe(true);
    });

    it("says it cannot tell when the game build has no SharedVariables", () => {
        const { lines } = runHarness(["run", "tw1"], { noSharedApi: true });
        expect(lines.some((l) => /cannot tell/.test(l))).toBe(true);
        expect(lines.some((l) => /NOT LOADED/.test(l))).toBe(false);
    });

    it("prints the same line from `qe24 twotter audit` — the row that reads the save", () => {
        const { lines } = runHarness(["twotter", "audit"], { marker: "1.0.20 (2026-09-18.r193)" });
        expect(lines.some((l) => /Editor export: loaded/.test(l))).toBe(true);
    });
});
