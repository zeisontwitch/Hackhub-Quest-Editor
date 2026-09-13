/**
 * The inspector header explains why the selected node is flagged: what is
 * wrong, and the next step to fix it — not just the terse card badge.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InspectorPanel } from "@/editor/inspector/InspectorPanel";
import { makeNode } from "@/templates/kit";
import { createProject, createQuest } from "@/schema/project";
import type { EdgeDoc } from "@/schema/edges";
import { useEditor } from "@/store/editor";

function loadWith(nodes: ReturnType<typeof makeNode>[], edges: EdgeDoc[] = []) {
    const quest = createQuest({
        id: "q-warn",
        name: "Warn",
        closingObjectiveText: "done",
        title: "Warn",
        autoStart: true,
        description: "warn",
        rewards: { money: 0, xp: 0 },
    });
    quest.graph = { nodes, edges };
    const project = createProject({
        mod: { id: "warn-mod", name: "Warn", version: "1.0.0", author: "", description: "warn", tags: [], dependencies: [], minSdkVersion: "0.21.0", apiVersion: 1 },
        quests: [quest],
        websites: [],
    });
    act(() => {
        useEditor.getState().load(project, { clearHistory: true });
        useEditor.getState().setActiveQuest(project.quests[0].id);
        useEditor.getState().select({ nodeIds: [nodes[0].id], edgeIds: [] });
    });
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("inspector warning header", () => {
    it("shows the next step for a flagged node", async () => {
        const user = userEvent.setup();
        const objective = makeNode("objective", { x: 0, y: 0 }, { name: "Break in", description: "x" });
        loadWith([objective]);
        render(<InspectorPanel />);

        await user.click(screen.getByRole("tab", { name: "Node" }));

        expect(screen.getByText(/Next step:/)).toBeInTheDocument();
        expect(screen.getByText(/pick the game event that means the player did it/)).toBeInTheDocument();
    });

    it("clears the header once a trigger is wired to the objective", async () => {
        const user = userEvent.setup();
        const objective = makeNode("objective", { x: 0, y: 0 }, { name: "Break in", description: "x" });
        const trigger = makeNode("trigger.event", { x: 100, y: 0 });
        loadWith([objective]);
        render(<InspectorPanel />);
        await user.click(screen.getByRole("tab", { name: "Node" }));
        expect(screen.getByText(/Next step:/)).toBeInTheDocument();

        act(() => {
            loadWith([objective, trigger], [
                { id: "e1", source: trigger.id, sourceHandle: "when", target: objective.id, targetHandle: "trigger", kind: "condition" },
            ]);
        });

        expect(screen.queryByText(/Next step:/)).not.toBeInTheDocument();
    });
});
