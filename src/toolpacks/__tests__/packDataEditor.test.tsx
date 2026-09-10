/**
 * The community-data node's inspector face (r137): the pack dropdown, the
 * data-shape dropdown, value inputs labelled by the pack author — and the
 * snapshot rule (a node keeps working even after its pack is removed). Plus
 * the two places pack events reach the trigger picker: the picker's community
 * group and the condition builder's field list.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PackDataEditor } from "@/editor/inspector/sims/PackDataEditor";
import { PackNodeEditor } from "@/editor/inspector/sims/PackNodeEditor";
import { ConditionsEditor } from "@/editor/inspector/ConditionsEditor";
import { EventPicker } from "@/editor/inspector/EventPicker";
import { NodePalette } from "@/editor/palette/NodePalette";
import { ReactFlowProvider } from "@xyflow/react";
import { useState } from "react";
import { summarize } from "@/editor/canvas/summarize";
import { createProject } from "@/schema/project";
import type { ConditionClause, NodeOfType } from "@/schema/nodes";
import { useEditor } from "@/store/editor";
import { packNodeDefs, usePacks } from "@/store/packs";

const exampleRaw = JSON.parse(readFileSync(join(process.cwd(), "reference/example-toolpack/toolpack.json"), "utf8")) as Parameters<
    ReturnType<typeof usePacks.getState>["loadPack"]
>[0];

beforeEach(() => {
    localStorage.clear();
    act(() => {
        usePacks.setState({ packs: [] });
        useEditor.getState().load(createProject(), { clearHistory: true });
    });
});

const nodeNow = (id: string) => useEditor.getState().project.quests[0].graph.nodes.find((n) => n.id === id)!;

function addPackNode(): NodeOfType<"world.packData"> {
    let id = "";
    act(() => {
        id = useEditor.getState().addNode("world.packData", { x: 0, y: 0 })!;
    });
    return nodeNow(id) as NodeOfType<"world.packData">;
}

describe("community-data editor", () => {
    it("with no packs loaded it points at the manager", () => {
        const node = addPackNode();
        render(<PackDataEditor node={node} />);
        expect(screen.getByText(/Load a tool pack first/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Open the tool pack manager" }));
        expect(useEditor.getState().ui.modal).toBe("toolpacks");
    });

    it("choosing a pack snapshots it; choosing a shape snapshots the contract", () => {
        act(() => usePacks.getState().loadPack(exampleRaw));
        const node = addPackNode();
        const { rerender } = render(<PackDataEditor node={node} />);

        fireEvent.change(screen.getByLabelText("Tool pack"), { target: { value: "example-tools" } });
        let d = nodeNow(node.id).data as NodeOfType<"world.packData">["data"];
        expect(d.packName).toBe("Example Tools");
        expect(d.gameModName).toBe("Example Tools");
        expect(d.storageKey).toBe("");

        rerender(<PackDataEditor node={nodeNow(node.id) as NodeOfType<"world.packData">} />);
        fireEvent.change(screen.getByLabelText("Data shape"), { target: { value: "loot" } });
        d = nodeNow(node.id).data as NodeOfType<"world.packData">["data"];
        expect(d.storageKey).toBe("exampletools.loot");
        expect(d.merge).toBe("replace");
        expect(d.mergeBy).toBe("target");
        expect(d.entry).toEqual({
            target: "{{target}}",
            files: [{ path: "{{path}}", data: "{{data}}\n", readable: true, downloadable: true, deletable: false }],
        });
        expect(d.fields.map((f) => f.key)).toEqual(["target", "path", "data"]);
    });

    it("pack authors' labels and hints ARE the form", () => {
        act(() => usePacks.getState().loadPack(exampleRaw));
        const node = addPackNode();
        act(() =>
            useEditor.getState().updateNodeData(node.id, {
                packId: "example-tools",
                packName: "Example Tools",
                contractId: "loot",
                contractLabel: "Plant loot on a machine",
                storageKey: "exampletools.loot",
                mergeBy: "target",
                entry: { target: "{{target}}" },
                fields: [{ key: "target", label: "Host or IP", type: "string", hint: "The machine the loot waits on." }],
                values: {},
            }),
        );
        render(<PackDataEditor node={nodeNow(node.id) as NodeOfType<"world.packData">} />);
        expect(screen.getByLabelText("Host or IP")).toBeInTheDocument();
        /* Hints are ? badges with the pack author's words (tooltip): */
        expect(screen.getByLabelText(/What does .Host or IP. do./)).toBeInTheDocument();
        const replaceNote = screen.getAllByText(
            (_, el) => el?.tagName === "P" && (el.textContent ?? "").includes("Replaces the pack's previous entry"),
        );
        expect(replaceNote.length).toBeGreaterThan(0);
    });

    it("typing a value stores it as a string on the node", () => {
        act(() => usePacks.getState().loadPack(exampleRaw));
        const node = addPackNode();
        act(() =>
            useEditor.getState().updateNodeData(node.id, {
                packId: "example-tools",
                contractId: "loot",
                storageKey: "exampletools.loot",
                entry: { target: "{{target}}" },
                fields: [{ key: "target", label: "Host or IP", type: "string" }],
                values: {},
            }),
        );
        render(<PackDataEditor node={nodeNow(node.id) as NodeOfType<"world.packData">} />);
        fireEvent.change(screen.getByLabelText("Host or IP"), { target: { value: "10.0.0.5" } });
        const d = nodeNow(node.id).data as NodeOfType<"world.packData">["data"];
        expect(d.values).toEqual({ target: "10.0.0.5" });
    });

    it("the honesty line names the game mod", () => {
        act(() => usePacks.getState().loadPack(exampleRaw));
        const node = addPackNode();
        act(() => useEditor.getState().updateNodeData(node.id, { packName: "Example Tools", gameModName: "Example Tools" }));
        render(<PackDataEditor node={nodeNow(node.id) as NodeOfType<"world.packData">} />);
        expect(screen.getByText(/Players need the Example Tools game mod installed/)).toBeInTheDocument();
    });

    it("the node keeps working after its pack is removed (snapshot rule)", () => {
        act(() => usePacks.getState().loadPack(exampleRaw));
        const node = addPackNode();
        act(() =>
            useEditor.getState().updateNodeData(node.id, {
                packId: "example-tools",
                packName: "Example Tools",
                contractId: "loot",
                storageKey: "exampletools.loot",
                entry: { target: "{{target}}" },
                fields: [{ key: "target", label: "Host or IP", type: "string" }],
                values: { target: "10.0.0.5" },
            }),
        );
        act(() => usePacks.setState({ packs: [] }));
        render(<PackDataEditor node={nodeNow(node.id) as NodeOfType<"world.packData">} />);
        /* The pack is gone; the snapshotted contract still shows, values intact. */
        expect(screen.getByLabelText("Host or IP")).toHaveValue("10.0.0.5");
        expect(screen.getByText(/Players need this pack's in-game mod installed/)).toBeInTheDocument();
        /* And the editor says the pack itself is missing, without pretending
           anything was lost. */
        expect(screen.getByText(/isn't loaded on this machine/)).toBeInTheDocument();
        expect(screen.getByText(/the node keeps working/)).toBeInTheDocument();
    });
});

describe("editor mods: palette and inspector", () => {
    it("packNodeDefs: one def per pack node, snapshot ready to add", () => {
        act(() => usePacks.getState().loadPack(exampleRaw));
        const defs = packNodeDefs(usePacks.getState().packs);
        expect(defs).toHaveLength(4);
        expect(defs[0].def.type).toBe("pack.node");
        expect(defs[0].def.label).toBe("Announce the handover");
        expect(defs[0].def.blurb).toContain("handover event");
        expect(defs[0].addData.nodeId).toBe("example-tools/breach-ping");
        expect(defs[0].addData.gameModName).toBe("Example Tools");
        expect(defs[0].addData.eventName).toBe("ExampleTools.Handover.Done");
        expect(defs[2].addData.storageKey).toBe("exampletools.wordlists");
        expect(defs[2].addData.entry).toEqual({ name: "{{name}}", words: ["alan", "bosun", "core"] });
    });

    it("the palette grows an Editor Mods group; clicking adds a snapshotted node", () => {
        act(() => usePacks.getState().loadPack(exampleRaw));
        render(
            <ReactFlowProvider>
                <NodePalette />
            </ReactFlowProvider>,
        );
        expect(screen.getByText("Editor Mods · Example Tools")).toBeInTheDocument();
        const item = screen.getByRole("button", { name: "Announce the handover" });
        fireEvent.click(item);
        const nodes = useEditor.getState().project.quests[0].graph.nodes;
        const added = nodes.find((n) => n.type === "pack.node");
        expect(added).toBeDefined();
        const d = added!.data as NodeOfType<"pack.node">["data"];
        expect(d.nodeId).toBe("example-tools/breach-ping");
        expect(d.nodeLabel).toBe("Announce the handover");
        expect(d.eventName).toBe("ExampleTools.Handover.Done");
        expect(d.gameModName).toBe("Example Tools");
        /* The card shows the pack author's label, not "Community node". */
        expect(summarize(added!, useEditor.getState().project.quests[0])[0]).toContain("Announce the handover");
    });

    it("the inspector speaks the pack's words and takes the author's values", () => {
        const node = addPackNode();
        act(() =>
            useEditor.getState().updateNodeData(node.id, {
                packId: "example-tools",
                packName: "Example Tools",
                gameModName: "Example Tools",
                nodeId: "example-tools/breach-ping",
                nodeLabel: "Announce the handover",
                emitter: "emit",
                eventName: "ExampleTools.Handover.Done",
                payload: { target: "{{target}}" },
                fields: [{ key: "target", label: "Host or IP", type: "string", hint: "The machine this handover is about." }],
                values: {},
            }),
        );
        render(<PackNodeEditor node={nodeNow(node.id) as NodeOfType<"pack.node">} />);
        expect(screen.getByText(/it fires the event ExampleTools.Handover.Done/)).toBeInTheDocument();
        expect(screen.getByText(/Provided by the Example Tools tool pack/)).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText("Host or IP"), { target: { value: "10.0.0.14" } });
        const d = nodeNow(node.id).data as NodeOfType<"pack.node">["data"];
        expect(d.values).toEqual({ target: "10.0.0.14" });
        expect(screen.getByText(/Players need the Example Tools game mod installed/)).toBeInTheDocument();
    });
});

describe("pack events in the trigger picker", () => {
    it("the condition builder offers the pack's payload fields", () => {
        act(() => usePacks.getState().loadPack(exampleRaw));
        let clauses: ConditionClause[] = [];
        const Harness = () => {
            const [value, setValue] = useState<ConditionClause[]>(clauses);
            clauses = value;
            return <ConditionsEditor value={value} onChange={setValue} eventName="ExampleTools.Scan.Completed" />;
        };
        render(<Harness />);
        /* The clause's field defaults to the event's first payload field —
           for a pack event that comes from the pack, not the catalogue. */
        fireEvent.click(screen.getByRole("button", { name: "Add condition" }));
        const detail = screen.getByLabelText("Event detail") as HTMLInputElement;
        expect(detail.value).toBe("target");
    });

    it("the picker lists a Community tools group with the pack's labels", () => {
        act(() => usePacks.getState().loadPack(exampleRaw));
        render(<EventPicker value="" onChange={() => {}} />);
        /* fireEvent, not userEvent: Radix popover under jsdom (repo lesson). */
        fireEvent.click(screen.getByText("Choose an event…"));
        expect(screen.getByText(/Community tools \(2\)/)).toBeInTheDocument();
        /* Rows carry the pack's plain-language label, suffixed with the pack. */
        expect(screen.getByText(/A file was downloaded from a breached machine/)).toBeInTheDocument();
        expect(screen.getByText("ExampleTools.Breach.FileDownloaded")).toBeInTheDocument();
    });

    it("picking the community event is not treated as a custom unknown event", () => {
        act(() => usePacks.getState().loadPack(exampleRaw));
        const Harness = () => {
            const [value, setValue] = useState("");
            return <EventPicker value={value} onChange={setValue} />;
        };
        render(<Harness />);
        fireEvent.click(screen.getByText("Choose an event…"));
        fireEvent.click(screen.getByText(/A file was downloaded from a breached machine/));
        /* The picker's honesty line: the event comes from a pack, and quests
           waiting on it need that pack's game mod. */
        const fired = screen.getAllByText(
            (_, el) => el?.tagName === "P" && (el.textContent ?? "").includes("Fired by the Example Tools tool mod"),
        );
        expect(fired.length).toBeGreaterThan(0);
    });
});
