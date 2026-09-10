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
        expect(mod).toContain("__QE.fill(json, scope)");
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
