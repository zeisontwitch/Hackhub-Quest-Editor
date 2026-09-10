/**
 * Tool packs (r137): the format's plain-language validation, the
 * machine-local store, and the helpers the trigger picker consumes. The
 * starter pack in reference/example-toolpack is the format's living fixture —
 * if it ever stops parsing, the docs lie.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseToolPack, ToolPackSchema, type ToolPack } from "@/toolpacks/schema";
import { packEventByName, packEvents, usePacks } from "@/store/packs";

const exampleJson = readFileSync(join(process.cwd(), "reference/example-toolpack/toolpack.json"), "utf8");
const exampleRaw = JSON.parse(exampleJson) as Record<string, unknown>;

const mutate = (patch: Record<string, unknown>): Record<string, unknown> => ({ ...exampleRaw, ...patch });

/** Narrow a failed parse to its plain-language error. */
function expectError(result: ReturnType<typeof parseToolPack>): string {
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected the parse to fail");
    return result.error;
}

/** A second pack with a different name/id, for ordering and replace tests. */
const secondRaw = mutate({ id: "zeta-tools", name: "Zeta Tools" });

beforeEach(() => {
    localStorage.clear();
    usePacks.setState({ packs: [] });
});

describe("pack format", () => {
    it("parses the starter pack with defaults applied", () => {
        const result = parseToolPack(exampleRaw);
        if (!result.ok) throw new Error(result.error);
        expect(result.pack.id).toBe("example-tools");
        expect(result.pack.name).toBe("Example Tools");
        expect(result.pack.gameMod.name).toBe("Example Tools");
        expect(result.pack.events.map((e) => e.name)).toEqual([
            "ExampleTools.Breach.FileDownloaded",
            "ExampleTools.Scan.Completed",
        ]);
        expect(result.pack.events[0].fields).toContain("sessionId");
        const loot = result.pack.storage[0];
        expect(loot.key).toBe("exampletools.loot");
        expect(loot.merge).toBe("replace");
        expect(loot.mergeBy).toBe("target");
        expect(loot.entry).toEqual({
            target: "{{target}}",
            files: [{ path: "{{path}}", data: "{{data}}\n", readable: true, downloadable: true, deletable: false }],
        });
        expect(result.pack.targetRules?.services).toContain("ssh");
        expect(result.pack.targetRules?.versionOnPorts).toBe(true);
        expect(result.pack.commandData).toEqual([]);
        expect(result.pack.nodes).toEqual([]);
    });

    it("checks the format number before anything else, in plain words", () => {
        expect(expectError(parseToolPack(mutate({ format: 1 })))).toContain("speaks format 2");
        expect(expectError(parseToolPack(mutate({ format: 1 })))).toContain("docs/ToolPack-Format.md");
        const { format: _drop, ...noFormat } = exampleRaw;
        expect(expectError(parseToolPack(noFormat))).toContain("speaks format 2");
    });

    it("recognises a file that is not a pack at all", () => {
        expect(expectError(parseToolPack("hello"))).toContain("not a tool pack");
        expect(expectError(parseToolPack([exampleRaw]))).toContain("not a tool pack");
        expect(expectError(parseToolPack(null))).toContain("not a tool pack");
    });

    it("points at the offending field, not at zod", () => {
        const error = expectError(parseToolPack(mutate({ id: "Bad Id!" })));
        expect(error).toContain("id:");
        expect(error).toContain("lowercase letters, numbers and dashes");
    });

    it("demands the honesty line: a pack names its in-game mod", () => {
        expect(expectError(parseToolPack(mutate({ gameMod: { name: "" } })))).toContain("name the in-game mod");
    });

    it("caps the error list so a broken pack is a sentence, not a wall", () => {
        const broken = mutate({
            id: "NO",
            name: "",
            events: Array.from({ length: 6 }, () => ({ name: "1bad", label: "" })),
        });
        const error = expectError(parseToolPack(broken));
        /* Each issue renders as "path: message." — no more than four. */
        const segments = error.split(": ").length - 1;
        expect(segments).toBeGreaterThanOrEqual(4);
        expect(segments).toBeLessThanOrEqual(4);
    });

    it("validates storage entries as JSON templates with field holes", () => {
        const result = ToolPackSchema.safeParse(
            mutate({ storage: [{ id: "x", label: "X", key: "k", entry: "not-an-object" }] }),
        );
        expect(result.success).toBe(false);
    });
});

describe("packs store", () => {
    it("loads, persists, and replaces a pack with the same id", () => {
        const first = usePacks.getState().loadPack(exampleRaw);
        expect(first.ok).toBe(true);
        expect(usePacks.getState().packs).toHaveLength(1);

        const again = usePacks.getState().loadPack(mutate({ version: "9.9.9" }));
        expect(again.ok).toBe(true);
        expect(usePacks.getState().packs).toHaveLength(1);
        expect(usePacks.getState().packs[0].version).toBe("9.9.9");
        expect(JSON.parse(localStorage.getItem("hackhub-quest-editor:packs:v1")!)).toHaveLength(1);
    });

    it("sorts loaded packs by name", () => {
        usePacks.getState().loadPack(secondRaw);
        usePacks.getState().loadPack(exampleRaw);
        expect(usePacks.getState().packs.map((p) => p.name)).toEqual(["Example Tools", "Zeta Tools"]);
    });

    it("refuses a broken pack and stores nothing", () => {
        const result = usePacks.getState().loadPack(mutate({ format: 1 }));
        expect(result.ok).toBe(false);
        expect(usePacks.getState().packs).toHaveLength(0);
        expect(localStorage.getItem("hackhub-quest-editor:packs:v1")).toBeNull();
    });

    it("removes a pack", () => {
        usePacks.getState().loadPack(exampleRaw);
        usePacks.getState().removePack("example-tools");
        expect(usePacks.getState().packs).toHaveLength(0);
        expect(JSON.parse(localStorage.getItem("hackhub-quest-editor:packs:v1")!)).toHaveLength(0);
    });

    it("skips broken entries when reloading stored packs", async () => {
        usePacks.getState().loadPack(exampleRaw);
        const stored = JSON.parse(localStorage.getItem("hackhub-quest-editor:packs:v1")!);
        localStorage.setItem("hackhub-quest-editor:packs:v1", JSON.stringify([...stored, { id: 3 }]));

        vi.resetModules();
        const fresh = await import("@/store/packs");
        expect(fresh.usePacks.getState().packs.map((p) => p.id)).toEqual(["example-tools"]);
    });
});

describe("picker helpers", () => {
    let pack: ToolPack;
    beforeEach(() => {
        usePacks.getState().loadPack(exampleRaw);
        pack = usePacks.getState().packs[0];
    });

    it("packEvents flattens events with a payload string conditions can display", () => {
        const events = packEvents([pack]);
        expect(events.map((e) => e.name)).toContain("ExampleTools.Scan.Completed");
        const file = events.find((e) => e.name === "ExampleTools.Breach.FileDownloaded")!;
        expect(file.packName).toBe("Example Tools");
        expect(file.label).toContain("downloaded");
        expect(file.payload).toBe("{ sessionId; ip; host; path; name }");
    });

    it("packEventByName serves fields and the honesty line", () => {
        const ev = packEventByName([pack], "ExampleTools.Scan.Completed")!;
        expect(ev.fields).toEqual(["target", "results"]);
        expect(ev.gameModName).toBe("Example Tools");
        expect(packEventByName([pack], "Metasploit.Meterpreter.Connected")).toBeUndefined();
    });
});
