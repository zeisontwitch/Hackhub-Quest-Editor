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
    /** Every extras registration/unregistration, in the order the harness made it. */
    calls: string[];
}

/** Boot the harness mod against a stub SDK and run one `qe24` command. */
function runHarness(
    args: string[],
    opts: { marker?: string; noSharedApi?: boolean; noExtrasApi?: boolean } = {},
): HarnessRun {
    const lines: string[] = [];
    const claimed: string[] = [];
    const calls: string[] = [];
    const shared = new Map<string, unknown>();
    if (opts.marker !== undefined) shared.set(EXPORT_KEY, opts.marker);

    /* A small in-memory model of the four extras surfaces, so the getters the
       harness prints reflect what it has registered — that is how a tester reads
       "did `off` actually take them away", and it is what this fence asserts. */
    const menus = new Map<string, { id: string; label?: string }>();
    const widgets = new Map<string, { id: string }>();
    const ctx = new Map<string, { id: string; label?: string; target?: string }>();
    const bundles = new Map<string, Record<string, string>>();

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
        Menu: {
            addItem: (item: { id: string; label?: string; section?: string }) => {
                menus.set(item.id, item);
                calls.push(`menu.addItem:${item.id}:${item.label ?? ""}:${item.section ?? ""}`);
            },
            removeItem: (id: string) => {
                menus.delete(id);
                calls.push(`menu.removeItem:${id}`);
            },
            getItems: () => [...menus.values()],
        },
        Desktop: {
            addWidget: (w: {
                id: string;
                src: string;
                width: number;
                height: number;
                position?: { x: number; y: number };
                transparent?: boolean;
            }) => {
                widgets.set(w.id, w);
                calls.push(
                    `desktop.addWidget:${w.id}:${w.src}:${w.width}x${w.height}` +
                        `:${w.transparent === false ? "opaque" : "transparent"}`,
                );
            },
            removeWidget: (id: string) => {
                widgets.delete(id);
                calls.push(`desktop.removeWidget:${id}`);
            },
            getWidgets: () => [...widgets.values()],
        },
        ContextMenu: {
            register: (item: { id: string; label?: string; target?: string }) => {
                ctx.set(item.id, item);
                calls.push(`contextMenu.register:${item.id}:${item.target ?? ""}`);
            },
            unregister: (id: string) => {
                ctx.delete(id);
                calls.push(`contextMenu.unregister:${id}`);
            },
            getItems: (target: string) => [...ctx.values()].filter((i) => i.target === target),
        },
        Localization: {
            register: (language: string, strings: Record<string, string>) => {
                bundles.set(language, strings);
                calls.push(`localization.register:${language}:${Object.keys(strings).length}`);
            },
            t: (key: string, vars?: Record<string, string | number>) => {
                const raw = bundles.get("en")?.[key] ?? bundles.get("de")?.[key] ?? key;
                return Object.entries(vars ?? {}).reduce(
                    (acc, [k, v]) => acc.replaceAll(`{{${k}}}`, String(v)),
                    raw,
                );
            },
            language: () => "en",
            languages: () => ["en", "de", "tr"],
        },
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
    if (opts.noExtrasApi) {
        for (const key of ["Menu", "Desktop", "ContextMenu", "Localization"]) delete sdk[key];
    }
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
    return { lines, claimed, calls };
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

/**
 * The r199 pack-extras probe (`qe24 extras on/off/lang`).
 *
 * Stage A of the "cheap wins": four APIs the editor cannot author yet, none of
 * them used anywhere in this project before, and nothing in the SDK docs about
 * what this build actually honours. The probe has to be right before a tester
 * spends a run on it — so what is asserted here is exactly what appears on
 * screen and exactly which registrations the game is handed.
 */
describe("the harness's pack-extras probe", () => {
    it("tells the tester not to unregister before looking — r200's wasted run", () => {
        const { lines } = runHarness(["extras", "on"]);
        expect(lines.some((l) => l.startsWith("DO NOT run `qe24 extras off` yet"))).toBe(true);
    });

    /* Falsification note (r201): removing `transparent: true` from the ghost
       widget does NOT turn this red, and that is correct — the SDK's default for
       `transparent` is true, so the explicit flag is documentation of intent, not
       behaviour. The case that does matter (`transparent: false` dropped from the
       opaque widget, which collapses the A/B) goes red. Recorded rather than
       papered over with a stricter assertion that would only test our own stub. */
    it("registers one of each surface, with the shapes the SDK declares", () => {
        const { calls, lines } = runHarness(["extras", "on"]);
        expect(calls).toEqual([
            "menu.addItem:qe24-extras-menu-none:QE24 menu no section:",
            "menu.addItem:qe24-extras-menu-top:QE24 menu top:top",
            "menu.addItem:qe24-extras-menu-bottom:QE24 menu bottom:bottom",
            "desktop.addWidget:qe24-extras-widget:widgets/qe24-widget.html:320x180:opaque",
            "desktop.addWidget:qe24-extras-widget-ghost:widgets/qe24-widget.html:320x180:transparent",
            "contextMenu.register:qe24-extras-file:file",
            "contextMenu.register:qe24-extras-desktop:desktop",
            "localization.register:en:2",
            "localization.register:de:2",
        ]);
        // The tester is told what happened, and what to look at.
        expect(lines.some((l) => l.startsWith("Registered: "))).toBe(true);
        expect(lines.join("\n")).toContain("start menu");
    });

    it("reports what the game says it has, before and after `off`", () => {
        const on = runHarness(["extras", "on"]);
        expect(on.lines.join("\n")).toContain("start-menu items:      3 [QE24 menu no section, QE24 menu top, QE24 menu bottom]");
        expect(on.lines.join("\n")).toContain("desktop widgets:       2 [qe24-extras-widget, qe24-extras-widget-ghost]");
        expect(on.lines.join("\n")).toContain("right-click on a file: 1 [QE24: inspect this file]");
        expect(on.lines.join("\n")).toContain("right-click desktop:   1 [QE24: desktop action]");

        const off = runHarness(["extras", "off"]);
        expect(off.calls).toEqual([
            "menu.removeItem:qe24-extras-menu-none",
            "menu.removeItem:qe24-extras-menu-top",
            "menu.removeItem:qe24-extras-menu-bottom",
            "desktop.removeWidget:qe24-extras-widget",
            "desktop.removeWidget:qe24-extras-widget-ghost",
            "contextMenu.unregister:qe24-extras-file",
            "contextMenu.unregister:qe24-extras-desktop",
        ]);
        expect(off.lines.join("\n")).toContain("start-menu items:      0 [empty]");
        expect(off.lines.join("\n")).toContain("desktop widgets:       0 [empty]");
    });

    it("reports the language, the translation and the missing-key fallback", () => {
        const { lines } = runHarness(["extras", "lang"]);
        const text = lines.join("\n");
        expect(text).toContain("language():                 en");
        expect(text).toContain("languages():                en, de, tr");
        expect(text).toContain("Hello from the QE24 harness.");
        expect(text).toContain("Harness speaking: QE24.");
        // The SDK documents a missing key echoing itself — the row reads that.
        expect(text).toContain('t("qe24.absent"): qe24.absent');
    });

    it("says which APIs the build does not have, instead of throwing", () => {
        const { lines, calls } = runHarness(["extras", "on"], { noExtrasApi: true });
        expect(calls).toEqual([]);
        expect(lines.join("\n")).toContain("NOT IN THIS BUILD: Menu.addItem, Desktop.addWidget, ContextMenu.register, Localization.register");
    });

    it("prints its own guide when asked for nothing in particular", () => {
        const { lines, calls } = runHarness(["extras"]);
        expect(calls).toEqual([]);
        expect(lines.join("\n")).toContain("qe24 extras on");
        // Every reading names the row it belongs to, so the tester can find it.
        expect(lines.join("\n")).toContain("T-16");
        expect(lines.join("\n")).toContain("T-19");
    });
});
