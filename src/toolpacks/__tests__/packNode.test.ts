/**
 * The community-data node (r137) end to end: its card summary, the honesty
 * warnings, the emitted SharedStorage code (both merge modes), and a real dry
 * run through the simulator proving the entry template's holes get filled
 * with the author's values before the JSON lands in storage.
 */
import { describe, expect, it } from "vitest";
import { compileProject, computeWarnings, packModsUsed } from "@/compiler/compile";
import { simulateProject } from "@/compiler/simulate";
import { nodeTypeDef } from "@/schema/registry";
import { createProject, type ProjectDocument } from "@/schema/project";
import type { NodeDoc } from "@/schema/nodes";
import type { EdgeDoc } from "@/schema/edges";
import { summarize } from "@/editor/canvas/summarize";

let seq = 0;
const nid = () => `n${++seq}`;

function node(type: Parameters<typeof nodeTypeDef>[0], patch: Record<string, unknown> = {}): NodeDoc {
    const data = { ...(nodeTypeDef(type).create() as object), ...patch };
    return { id: nid(), type, position: { x: 0, y: 0 }, data } as NodeDoc;
}

const edge = (source: string, target: string): EdgeDoc => ({
    id: `e${source}-${target}`,
    source,
    sourceHandle: "out",
    target,
    targetHandle: "in",
    kind: "flow",
});

/** A quest whose only act is running one pack-authored node. */
function packNodeProject(data: Record<string, unknown>): ProjectDocument {
    const project = createProject();
    const quest = project.quests[0];
    quest.name = "mod";
    quest.title = "The Mod";
    quest.autoStart = true;
    const entry = node("entry.start");
    const base = {
        packId: "example-tools",
        packName: "Example Tools",
        packVersion: "1.0.0",
        gameModName: "Example Tools",
        nodeId: "example-tools/breach-ping",
        nodeLabel: "Announce the handover",
        fields: [{ key: "target", label: "Host or IP", type: "string" }],
        values: { target: "10.0.0.14" },
    };
    const mod = node("pack.node", { ...base, ...data });
    quest.graph.nodes = [entry, mod];
    quest.graph.edges = [edge(entry.id, mod.id)];
    return project;
}

/** A quest whose only act is handing data to the pack. */
function packProject(dataPatch: Record<string, unknown> = {}): ProjectDocument {
    const project = createProject();
    const quest = project.quests[0];
    quest.name = "handover";
    quest.title = "The Handover";
    quest.autoStart = true;
    const entry = node("entry.start");
    const data = node("world.packData", {
        packId: "example-tools",
        packName: "Example Tools",
        gameModName: "Example Tools",
        contractId: "loot",
        contractLabel: "Plant loot on a machine",
        storageKey: "exampletools.loot",
        merge: "replace",
        mergeBy: "target",
        entry: { target: "{{target}}", files: [{ path: "{{path}}", data: "{{data}}\n" }] },
        fields: [
            { key: "target", label: "Host or IP", type: "string" },
            { key: "path", label: "File path", type: "string" },
            { key: "data", label: "File contents", type: "text" },
        ],
        values: { target: "10.0.0.5", path: "/opt/case/evidence.txt", data: "meet me at the docks" },
        ...dataPatch,
    });
    quest.graph.nodes = [entry, data];
    quest.graph.edges = [edge(entry.id, data.id)];
    return project;
}

describe("pack node emitters", () => {
    it("emit: fires the pack event with its holes filled", async () => {
        const report = await simulateProject(
            packNodeProject({ emitter: "emit", eventName: "ExampleTools.Handover.Done", payload: { target: "{{target}}" } }),
        );
        expect(report.errors).toEqual([]);
        const line = report.trace.find((t) => t.kind === "event");
        expect(line?.text).toBe('Event fires: ExampleTools.Handover.Done = {"target":"10.0.0.14"}');
    });

    it("sdk: makes the calls in order, filling string and object args", async () => {
        const report = await simulateProject(
            packNodeProject({
                emitter: "sdk",
                steps: [
                    { call: "Events.emit", args: ["ExampleTools.Handover.Log", { message: "done for {{target}}" }] },
                    { call: "Events.emit", args: ["ExampleTools.Plain"] },
                ],
            }),
        );
        expect(report.errors).toEqual([]);
        const events = report.trace.filter((t) => t.kind === "event").map((t) => t.text);
        expect(events[0]).toBe('Event fires: ExampleTools.Handover.Log = {"message":"done for 10.0.0.14"}');
        expect(events[1]).toBe("Event fires: ExampleTools.Plain");
    });

    it("sdk: an unknown call is skipped, not a crash", async () => {
        const report = await simulateProject(
            packNodeProject({ emitter: "sdk", steps: [{ call: "Time.Travel.To", args: ["1955"] }] }),
        );
        /* The skip note goes to the console log, not the trace; the quest
           itself must sail through with nothing fired. */
        expect(report.errors).toEqual([]);
        expect(report.trace.filter((t) => t.kind === "event")).toHaveLength(0);
    });

    it("storage: writes the key with its holes filled, replace-by honoured", async () => {
        const report = await simulateProject(
            packNodeProject({
                emitter: "storage",
                storageKey: "exampletools.wordlists",
                merge: "replace",
                mergeBy: "name",
                entry: { name: "{{name}}", words: ["alan", "bosun"] },
                fields: [{ key: "name", label: "Wordlist name", type: "string" }],
                values: { name: "ex-crew" },
            }),
        );
        expect(report.errors).toEqual([]);
        const line = report.trace.find((t) => t.kind === "data");
        expect(line?.text).toContain("exampletools.wordlists");
        expect(line?.text).toContain('"name":"ex-crew"');
    });

    it("commandData: clears then places the scripted answer", async () => {
        const mod = compileProject(
            packNodeProject({
                emitter: "commandData",
                command: "exampletools-scan",
                input: "{{target}}",
                data: { report: "scanned {{target}}" },
            }),
        ).files.find((f) => f.path === "dist/mod.js")!.content;
        expect(mod).toContain("removeCommandData");
        expect(mod).toContain("addCommandData");
        expect(mod).toContain('"report":"scanned {{target}}"');
    });

    it("the honesty line: pack nodes join packModsUsed and the export readme", () => {
        const project = packNodeProject({ emitter: "emit", eventName: "E", payload: {} });
        expect(packModsUsed(project).get("Example Tools")).toBe("Example Tools");
        const readme = compileProject(project).files.find((f) => f.path === "README.md")!.content;
        expect(readme).toContain("Community tools: Example Tools");
    });

    it("a bare pack.node warns that it is not set up", () => {
        const project = createProject();
        project.quests[0].title = "Empty mod";
        project.quests[0].graph.nodes = [node("pack.node", { packName: "Example Tools" })];
        const warnings = computeWarnings(project);
        expect(warnings.some((w) => w.includes("Empty mod") && w.includes("Community node is not set up yet"))).toBe(true);
    });
});

describe("community-data node", () => {
    it("the empty node says it is not set up yet", () => {
        const bare = node("world.packData");
        expect(summarize(bare)).toEqual(["Not set up yet — pick a pack and a data shape"]);
    });

    it("the card names the shape and counts the filled values", () => {
        const filled = node("world.packData", {
            contractLabel: "Plant loot on a machine",
            storageKey: "exampletools.loot",
            values: { target: "10.0.0.5", path: "/opt/case/evidence.txt" },
        });
        const lines = summarize(filled);
        expect(lines[0]).toBe("Plant loot on a machine");
        expect(lines[1]).toBe("exampletools.loot");
        expect(lines[2]).toBe("2 values filled in");
    });

    it("warns when the node was never set up — it would do nothing", () => {
        const project = createProject();
        project.quests[0].title = "Loose ends";
        project.quests[0].graph.nodes = [node("world.packData", { packName: "Example Tools" })];
        const warnings = computeWarnings(project);
        expect(warnings.some((w) => w.includes("Loose ends") && w.includes("not set up yet"))).toBe(true);
    });

    it("warns that quests using a pack need its game mod installed", () => {
        const warnings = computeWarnings(packProject());
        const line = warnings.find((w) => w.includes("Example Tools"));
        expect(line).toContain("game mod installed on the player's machine");
    });

    it("packModsUsed feeds both the warnings and the export readme", () => {
        expect(packModsUsed(packProject()).get("Example Tools")).toBe("Example Tools");
        expect(packModsUsed(createProject()).size).toBe(0);
        const compiled = compileProject(packProject());
        const readme = compiled.files.find((f) => f.path === "README.md")!.content;
        expect(readme).toContain("Community tools: Example Tools");
        expect(readme).toContain("requires those game mods installed");
    });

    it("emits a guarded SharedStorage write with the fill hook", () => {
        const mod = compileProject(packProject()).files.find((f) => f.path === "dist/mod.js")!.content;
        expect(mod).toContain("sdk.SharedStorage && sdk.SharedStorage.set && d.storageKey");
        expect(mod).toContain("__QE.packFill(scope, d.fields, d.values");
        expect(mod).toContain('"Community data set: " + d.storageKey');
        /* The template travels with the node, not with the pack. */
        expect(mod).toContain("{{target}}");
        expect(mod).toContain('"target":"10.0.0.5"');
    });

    it("dry run: the entry lands in storage with its holes filled (replace mode)", async () => {
        const report = await simulateProject(packProject());
        expect(report.errors).toEqual([]);
        const entry = report.trace.find((t) => t.kind === "data");
        expect(entry).toBeDefined();
        expect(entry!.text).toContain("exampletools.loot");
        const json = entry!.text.slice(entry!.text.indexOf("= ") + 2);
        const parsed = JSON.parse(json) as unknown;
        /* replace + mergeBy: the key becomes a list holding our entry. */
        expect(parsed).toEqual([
            {
                target: "10.0.0.5",
                files: [{ path: "/opt/case/evidence.txt", data: "meet me at the docks\n" }],
            },
        ]);
    });

    it("dry run: overwrite mode sets the key to exactly the entry", async () => {
        const report = await simulateProject(packProject({ merge: "overwrite", mergeBy: undefined }));
        const entry = report.trace.find((t) => t.kind === "data")!;
        const parsed = JSON.parse(entry.text.slice(entry.text.indexOf("= ") + 2)) as unknown;
        expect(Array.isArray(parsed)).toBe(false);
        expect(parsed).toMatchObject({ target: "10.0.0.5" });
    });

    it("dry run: numbers and booleans land raw, strings as strings", async () => {
        const project = packProject({
            merge: "overwrite",
            mergeBy: undefined,
            entry: { target: "{{target}}", port: "{{port}}", verbose: "{{verbose}}" },
            fields: [
                { key: "target", label: "Host", type: "string" },
                { key: "port", label: "Port", type: "number" },
                { key: "verbose", label: "Verbose", type: "boolean" },
            ],
            values: { target: "10.0.0.5", port: "8080", verbose: "true" },
        });
        const report = await simulateProject(project);
        const entry = report.trace.find((t) => t.kind === "data")!;
        const parsed = JSON.parse(entry.text.slice(entry.text.indexOf("= ") + 2)) as Record<string, unknown>;
        expect(parsed.target).toBe("10.0.0.5");
        expect(parsed.port).toBe(8080);
        expect(parsed.verbose).toBe(true);
    });

    it("dry run: unset fields land as empty strings — the quest survives", async () => {
        /* No values at all: the holes survive the field pass, and the story
           filler resolves the leftovers against the quest scope (a miss
           becomes an empty string). The point is the JSON still parses and
           the write still happens rather than taking the quest down. */
        const project = packProject({ values: {}, merge: "overwrite", mergeBy: undefined });
        const report = await simulateProject(project);
        expect(report.errors).toEqual([]);
        const entry = report.trace.find((t) => t.kind === "data")!;
        const parsed = JSON.parse(entry.text.slice(entry.text.indexOf("= ") + 2)) as Record<string, unknown>;
        expect(parsed.target).toBe("");
    });
});
