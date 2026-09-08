/**
 * The percent-of-balance payment was removed from new nodes, but an old
 * project that used it still runs as written — and says so on the node.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Field } from "@/editor/inspector/Field";
import { makeNode } from "@/templates/kit";
import { createProject, createQuest } from "@/schema/project";
import { nodeTypeDef } from "@/schema/registry";
import { useEditor } from "@/store/editor";

function loadWith(nodes: ReturnType<typeof makeNode>[]) {
    const quest = createQuest({
        id: "q-pay",
        name: "Pay",
        closingObjectiveText: "done",
        title: "Pay",
        autoStart: true,
        description: "pay",
        rewards: { money: 0, xp: 0 },
    });
    quest.graph = { nodes, edges: [] };
    const project = createProject({
        mod: { id: "pay-mod", name: "Pay", version: "1.0.0", author: "", description: "pay", tags: [], dependencies: [], minSdkVersion: "0.21.0", apiVersion: 1 },
        quests: [quest],
        websites: [],
    });
    act(() => {
        useEditor.getState().load(project, { clearHistory: true });
        useEditor.getState().setActiveQuest(project.quests[0].id);
    });
}

const payDef = nodeTypeDef("fx.pay");
const legacyNote = payDef.fields.find((f) => f.kind === "note")!;

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("legacy percent payments", () => {
    it("explains itself on an old percent node, and stays quiet otherwise", () => {
        const old = makeNode("fx.pay", { x: 0, y: 0 }, { amountMode: "percent", percent: 10 });
        loadWith([old]);
        const { unmount } = render(<Field def={legacyNote} nodeId={old.id} />);
        expect(screen.getByText(/pays a percentage/)).toBeInTheDocument();
        unmount();

        const fresh = makeNode("fx.pay", { x: 100, y: 0 }, {});
        loadWith([fresh]);
        render(<Field def={legacyNote} nodeId={fresh.id} />);
        expect(screen.queryByText(/pays a percentage/)).not.toBeInTheDocument();
    });
});
