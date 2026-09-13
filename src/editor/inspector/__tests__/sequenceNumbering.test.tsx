/**
 * Sequence outputs are numbered, not named: a fresh node reads 1, 2, and
 * each added output arrives with the next number.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Field } from "@/editor/inspector/Field";
import { makeNode } from "@/templates/kit";
import { createProject, createQuest } from "@/schema/project";
import { nodeTypeDef } from "@/schema/registry";
import { useEditor } from "@/store/editor";

function loadWith(nodes: ReturnType<typeof makeNode>[]) {
    const quest = createQuest({
        id: "q-seq",
        name: "Seq",
        closingObjectiveText: "done",
        title: "Seq",
        autoStart: true,
        description: "seq",
        rewards: { money: 0, xp: 0 },
    });
    quest.graph = { nodes, edges: [] };
    const project = createProject({
        mod: { id: "seq-mod", name: "Seq", version: "1.0.0", author: "", description: "seq", tags: [], dependencies: [], minSdkVersion: "0.21.0", apiVersion: 1 },
        quests: [quest],
        websites: [],
    });
    act(() => {
        useEditor.getState().load(project, { clearHistory: true });
        useEditor.getState().setActiveQuest(project.quests[0].id);
    });
}

function storedSteps(nodeId: string): { label: string }[] {
    const node = useEditor
        .getState()
        .project.quests[0].graph.nodes.find((n) => n.id === nodeId);
    return (node!.data as { steps: { label: string }[] }).steps;
}

const stepsDef = nodeTypeDef("flow.sequence").fields.find((f) => f.kind === "list")!;

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("sequence numbering", () => {
    it("starts at 1, 2 and numbers each added output", () => {
        const seq = makeNode("flow.sequence", { x: 0, y: 0 }, {});
        loadWith([seq]);
        expect(storedSteps(seq.id).map((s) => s.label)).toEqual(["1", "2"]);
        render(<Field def={stepsDef} nodeId={seq.id} />);
        fireEvent.click(screen.getByRole("button", { name: "Add output" }));
        expect(storedSteps(seq.id).map((s) => s.label)).toEqual(["1", "2", "3"]);
        fireEvent.click(screen.getByRole("button", { name: "Add output" }));
        expect(storedSteps(seq.id).map((s) => s.label)).toEqual(["1", "2", "3", "4"]);
    });
});
