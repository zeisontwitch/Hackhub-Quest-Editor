/**
 * The store is the only thing that mutates the project document, so its history
 * and path helpers are what keep "undo always works" and "the inspector always
 * writes where it says it writes" true.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { getPath, setPath, useEditor } from "@/store/editor";
import { createProject } from "@/schema/project";
import { nodeTypeDef } from "@/schema/registry";
import { TEMPLATES } from "@/templates";

/** Load a fresh document and wipe history so tests are order-independent. */
function fresh() {
    const project = TEMPLATES[2].build();
    useEditor.getState().load(project, { clearHistory: true });
    useEditor.setState({ selection: { nodeIds: [], edgeIds: [] } });
    return useEditor.getState();
}

beforeEach(() => {
    fresh();
});

describe("path helpers", () => {
    it("reads and writes dotted keys", () => {
        const target = { a: { b: { c: "x" } } };
        expect(getPath(target, "a.b.c")).toBe("x");
        setPath(target, "a.b.c", "y");
        expect(getPath(target, "a.b.c")).toBe("y");
    });

    it("walks numeric segments into arrays", () => {
        const target = { list: [{ v: 1 }, { v: 2 }] };
        expect(getPath(target, "list.1.v")).toBe(2);
        setPath(target, "list.0.v", 9);
        expect(getPath(target, "list.0.v")).toBe(9);
    });

    it("creates intermediate objects, and arrays when the next segment is numeric", () => {
        const target: Record<string, unknown> = {};
        setPath(target, "a.b", 1);
        expect(target).toEqual({ a: { b: 1 } });

        const target2: Record<string, unknown> = {};
        setPath(target2, "rows.0.name", "first");
        expect(Array.isArray(target2.rows)).toBe(true);
        expect(getPath(target2, "rows.0.name")).toBe("first");
    });

    it("returns undefined for a missing path rather than throwing", () => {
        expect(getPath({ a: 1 }, "a.b.c")).toBeUndefined();
    });
});

describe("history", () => {
    it("records one undo step per edit", () => {
        const store = fresh();
        expect(store.past).toHaveLength(0);

        useEditor.getState().updateMod({ name: "First" });
        useEditor.getState().updateMod({ name: "Second" });
        expect(useEditor.getState().past).toHaveLength(2);
        expect(useEditor.getState().project.mod.name).toBe("Second");
    });

    it("undoes and redoes an edit in full", () => {
        fresh();
        useEditor.getState().updateMod({ name: "Changed" });
        useEditor.getState().undo();
        expect(useEditor.getState().project.mod.name).not.toBe("Changed");
        expect(useEditor.getState().future).toHaveLength(1);

        useEditor.getState().redo();
        expect(useEditor.getState().project.mod.name).toBe("Changed");
        expect(useEditor.getState().future).toHaveLength(0);
    });

    it("collapses a whole drag into one undo step", () => {
        fresh();
        const nodeId = useEditor.getState().project.quests[0].graph.nodes[0].id;
        const before = useEditor.getState().past.length;

        useEditor.getState().beginTransient();
        useEditor.getState().setNodePositions({ [nodeId]: { x: 10, y: 10 } });
        useEditor.getState().setNodePositions({ [nodeId]: { x: 20, y: 20 } });
        useEditor.getState().commitTransient();

        expect(useEditor.getState().past.length).toBe(before + 1);
        useEditor.getState().undo();
        expect(useEditor.getState().project.quests[0].graph.nodes.find((n) => n.id === nodeId)?.position).toEqual({
            x: 0,
            y: 0,
        });
    });

    it("does not write history for viewport pans", () => {
        fresh();
        const before = useEditor.getState().past.length;
        const questId = useEditor.getState().project.quests[0].id;
        useEditor.getState().setViewport(questId, { x: 12, y: 34, zoom: 0.5 });
        expect(useEditor.getState().past).toHaveLength(before);
    });

    it("caps the undo stack", () => {
        fresh();
        for (let i = 0; i < 140; i += 1) useEditor.getState().updateMod({ name: `n${i}` });
        expect(useEditor.getState().past.length).toBe(120);
    });
});

describe("writing node data", () => {
    it("patches one field without disturbing its neighbours", () => {
        fresh();
        const state = useEditor.getState();
        const wifi = state.project.quests[0].graph.nodes.find((n) => n.type === "world.wifi")!;

        useEditor.getState().updateNodeData(wifi.id, { ssid: "EDITED" });

        const after = useEditor
            .getState()
            .project.quests[0].graph.nodes.find((n) => n.id === wifi.id)!;
        expect((after.data as { ssid: string }).ssid).toBe("EDITED");
        expect((after.data as { password: string }).password).toBe(wifi.data.password);
        expect(after.type).toBe("world.wifi");
    });

    it("reaches nested paths", () => {
        fresh();
        const quest = useEditor.getState().project.quests[0];
        const objective = quest.graph.nodes.find((n) => n.type === "objective")!;

        useEditor.getState().updateNodeData(objective.id, { hint: "try harder" });
        expect(
            (useEditor.getState().project.quests[0].graph.nodes.find((n) => n.id === objective.id)!
                .data as { hint: string }).hint,
        ).toBe("try harder");
    });
});

describe("connecting", () => {
    const idsOf = (type: string) => {
        const nodes = useEditor.getState().project.quests[0].graph.nodes;
        const node = nodes.find((n) => n.type === type);
        if (!node) throw new Error(`template has no ${type} node`);
        return node.id;
    };

    it("stamps the edge kind from the handles", () => {
        fresh();
        /* Add our own entry point rather than borrowing a spare one from the
           template: templates no longer ship nodes that are wired to nothing
           (r70), and a test should not depend on one existing. */
        const start = useEditor.getState().addNode("entry.load", { x: 0, y: 0 })!;
        const briefing = idsOf("world.wifi");
        const added = useEditor.getState().connect({
            source: start,
            sourceHandle: "out",
            target: briefing,
            targetHandle: "in",
        });
        expect(added).toBe(true);

        const edge = useEditor
            .getState()
            .project.quests[0].graph.edges.find((e) => e.source === start && e.target === briefing);
        expect(edge?.kind).toBe("flow");
    });

    it("refuses a wire between incompatible handles", () => {
        fresh();
        const start = idsOf("entry.start");
        const objective = idsOf("objective");
        const before = useEditor.getState().project.quests[0].graph.edges.length;

        expect(
            useEditor.getState().connect({ source: start, sourceHandle: "out", target: objective, targetHandle: "trigger" }),
        ).toBe(false);

        expect(useEditor.getState().project.quests[0].graph.edges).toHaveLength(before);
    });

    it("refuses self-loops and duplicate wires", () => {
        fresh();
        const start = useEditor.getState().addNode("entry.load", { x: 0, y: 0 })!;
        const wifi = idsOf("world.wifi");
        const before = useEditor.getState().project.quests[0].graph.edges.length;

        expect(
            useEditor.getState().connect({ source: start, sourceHandle: "out", target: start, targetHandle: "in" }),
        ).toBe(false);
        expect(useEditor.getState().project.quests[0].graph.edges).toHaveLength(before);

        const wire = { source: start, sourceHandle: "out", target: wifi, targetHandle: "in" };
        expect(useEditor.getState().connect(wire)).toBe(true);
        expect(useEditor.getState().connect(wire)).toBe(false);
        const edges = useEditor.getState().project.quests[0].graph.edges;
        expect(edges.filter((e) => e.source === start && e.target === wifi)).toHaveLength(1);
    });
});

describe("nodes", () => {
    it("adds a node with valid default data at the given position", () => {
        fresh();
        const id = useEditor.getState().addNode("fx.pay", { x: 100, y: 200 });
        const node = useEditor.getState().project.quests[0].graph.nodes.find((n) => n.id === id);

        expect(node?.position).toEqual({ x: 100, y: 200 });
        expect(node?.type).toBe("fx.pay");
        expect(node?.data).toEqual(nodeTypeDef("fx.pay").create());
    });

    it("removes a node and every wire attached to it", () => {
        fresh();
        const briefing = useEditor
            .getState()
            .project.quests[0].graph.nodes.find((n) => n.type === "comms.dialogue")!;
        const attached = useEditor
            .getState()
            .project.quests[0].graph.edges.filter(
                (e) => e.source === briefing.id || e.target === briefing.id,
            );
        expect(attached.length).toBeGreaterThan(0);

        useEditor.getState().removeNodes([briefing.id]);

        const graph = useEditor.getState().project.quests[0].graph;
        expect(graph.nodes.find((n) => n.id === briefing.id)).toBeUndefined();
        expect(graph.edges.filter((e) => e.source === briefing.id || e.target === briefing.id)).toHaveLength(0);
    });
});

describe("quests", () => {
    it("duplicates a quest with fresh, internally-consistent ids", () => {
        fresh();
        const original = useEditor.getState().project.quests[0];
        const copyId = useEditor.getState().duplicateQuest(original.id)!;
        const copy = useEditor.getState().project.quests.find((q) => q.id === copyId)!;

        expect(copyId).not.toBe(original.id);
        expect(copy.graph.nodes).toHaveLength(original.graph.nodes.length);
        expect(copy.graph.edges).toHaveLength(original.graph.edges.length);

        const copyNodeIds = new Set(copy.graph.nodes.map((n) => n.id));
        expect(copyNodeIds.size).toBe(copy.graph.nodes.length);
        for (const edge of copy.graph.edges) {
            expect(copyNodeIds.has(edge.source)).toBe(true);
            expect(copyNodeIds.has(edge.target)).toBe(true);
        }
        for (const node of original.graph.nodes) expect(copyNodeIds.has(node.id)).toBe(false);
    });

    it("keeps a single-quest project at one quest when deleting the active one is refused", () => {
        fresh();
        const only = useEditor.getState().project.quests[0].id;
        useEditor.getState().removeQuest(only);
        expect(useEditor.getState().project.quests).toHaveLength(1);
        expect(useEditor.getState().ui.toast?.message).toMatch(/at least one quest/i);
    });

    it("re-points the active quest when the current one goes away", () => {
        fresh();
        const added = useEditor.getState().addQuest({ title: "Second" });
        useEditor.getState().setActiveQuest(added);
        useEditor.getState().removeQuest(added);

        const state = useEditor.getState();
        expect(state.project.quests.some((q) => q.id === state.project.editor.activeQuestId)).toBe(true);
    });
});

describe("documents", () => {
    it("creates a project with exactly one quest", () => {
        const project = createProject();
        expect(project.quests).toHaveLength(1);
        expect(project.editor.activeQuestId).toBe(project.quests[0].id);
    });

    it("rejects a document with no quests", () => {
        expect(() =>
            useEditor.getState().load({ ...createProject(), quests: [] }),
        ).toThrow();
    });
});
