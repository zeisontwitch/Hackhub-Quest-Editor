/**
 * The firewall node's guided addresses: Protected IP offers the quest's
 * network, Source offers Anywhere, Destination offers a copy of the protected
 * IP — and every stored value stays a plain string.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Field } from "@/editor/inspector/Field";
import { makeNode } from "@/templates/kit";
import { createProject, createQuest } from "@/schema/project";
import { nodeTypeDef, type FieldDef } from "@/schema/registry";
import { useEditor } from "@/store/editor";

function loadWith(nodes: ReturnType<typeof makeNode>[]) {
    const quest = createQuest({
        id: "q-fw",
        name: "Fw",
        closingObjectiveText: "done",
        title: "Fw",
        autoStart: true,
        description: "fw",
        rewards: { money: 0, xp: 0 },
    });
    quest.graph = { nodes, edges: [] };
    const project = createProject({
        mod: { id: "fw-mod", name: "Fw", version: "1.0.0", author: "", description: "fw", tags: [], dependencies: [], minSdkVersion: "0.21.0", apiVersion: 1 },
        quests: [quest],
        websites: [],
    });
    act(() => {
        useEditor.getState().load(project, { clearHistory: true });
        useEditor.getState().setActiveQuest(project.quests[0].id);
    });
}

function storedData(nodeId: string): Record<string, unknown> {
    const node = useEditor
        .getState()
        .project.quests[0].graph.nodes.find((n) => n.id === nodeId);
    return node!.data as Record<string, unknown>;
}

const firewallDef = nodeTypeDef("world.firewall");
const ipDef = firewallDef.fields.find((f) => "key" in f && f.key === "ip")!;
const ruleSection = firewallDef.fields.find((f) => f.kind === "section") as Extract<
    FieldDef,
    { kind: "section" }
>;
const sourceDef = ruleSection.fields.find((f) => "key" in f && f.key === "source")!;
const destinationDef = ruleSection.fields.find((f) => "key" in f && f.key === "destination")!;

function firewallNode(data: Record<string, unknown>) {
    return makeNode("world.firewall", { x: 0, y: 0 }, data);
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("firewall guided addresses", () => {
    it("writes the targetIp token when Protected IP picks Random", () => {
        const fw = firewallNode({ ip: "", rule: { id: "r", allowed: false, port: 22, source: "*" } });
        loadWith([fw]);
        render(<Field def={ipDef} nodeId={fw.id} />);
        fireEvent.change(screen.getByLabelText("Protected IP"), {
            target: { value: "{{data.targetIp}}" },
        });
        expect(storedData(fw.id).ip).toBe("{{data.targetIp}}");
    });

    it("keeps a typed address as a custom Protected IP", () => {
        const fw = firewallNode({ ip: "10.0.0.5", rule: { id: "r", allowed: false, port: 22, source: "*" } });
        loadWith([fw]);
        render(<Field def={ipDef} nodeId={fw.id} />);
        // A stored address that matches no choice shows the custom box.
        const box = screen.getByLabelText("Protected IP (custom)") as HTMLInputElement;
        expect(box.value).toBe("10.0.0.5");
        fireEvent.change(box, { target: { value: "10.0.0.6" } });
        expect(storedData(fw.id).ip).toBe("10.0.0.6");
    });

    it("shows Anywhere for a stored star and writes it back", () => {
        const fw = firewallNode({ ip: "", rule: { id: "r", allowed: false, port: 22, source: "*" } });
        loadWith([fw]);
        render(<Field def={sourceDef} nodeId={fw.id} basePath="rule" />);
        const select = screen.getByLabelText("Source") as HTMLSelectElement;
        expect(select.value).toBe("*");
        // Round-trip a custom address back to the choice.
        fireEvent.change(select, { target: { value: "__custom__" } });
        fireEvent.change(screen.getByLabelText("Source (custom)"), {
            target: { value: "10.1.2.3" },
        });
        expect((storedData(fw.id).rule as Record<string, unknown>).source).toBe("10.1.2.3");
        fireEvent.change(screen.getByLabelText("Source"), { target: { value: "*" } });
        expect((storedData(fw.id).rule as Record<string, unknown>).source).toBe("*");
    });

    it("copies the protected IP into Destination as a snapshot", () => {
        const fw = firewallNode({
            ip: "10.0.0.5",
            rule: { id: "r", allowed: false, port: 22, source: "*", destination: "" },
        });
        loadWith([fw]);
        render(<Field def={destinationDef} nodeId={fw.id} basePath="rule" />);
        fireEvent.change(screen.getByLabelText("Destination"), {
            target: { value: "__same__" },
        });
        expect((storedData(fw.id).rule as Record<string, unknown>).destination).toBe("10.0.0.5");
    });

    it("recognises a destination equalling the protected IP as same-as", () => {
        const fw = firewallNode({
            ip: "10.0.0.5",
            rule: { id: "r", allowed: false, port: 22, source: "*", destination: "10.0.0.5" },
        });
        loadWith([fw]);
        render(<Field def={destinationDef} nodeId={fw.id} basePath="rule" />);
        expect((screen.getByLabelText("Destination") as HTMLSelectElement).value).toBe("__same__");
        // …but a later change to the protected IP does not follow: the copy
        // is a snapshot, so the destination now reads as custom.
        act(() => {
            useEditor.getState().updateNodeData(fw.id, { ip: "10.0.0.9" });
        });
        expect((screen.getByLabelText("Destination") as HTMLSelectElement).value).toBe("__custom__");
        expect((storedData(fw.id).rule as Record<string, unknown>).destination).toBe("10.0.0.5");
    });
});
