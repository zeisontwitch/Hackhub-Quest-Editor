/**
 * Alignment against cards with REAL measured sizes.
 *
 * This is the case that kept escaping: our `measured` map was empty at click
 * time, so every size was undefined, "align centres" degraded to "align
 * top-left corners", and the cards' middles stayed staggered with the wires
 * still curving (r99). Sizes now come from React Flow's node lookup, so this
 * writes geometry there — exactly what a browser's ResizeObserver would.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { createProject } from "@/schema/project";
import { useEditor } from "@/store/editor";

let rfStore: { getState: () => { nodeLookup: Map<string, unknown> } } | null = null;
vi.mock("@xyflow/react", async () => {
    const actual = await vi.importActual<typeof import("@xyflow/react")>("@xyflow/react");
    return {
        ...actual,
        useStoreApi: () => {
            const store = actual.useStoreApi();
            rfStore = store as unknown as typeof rfStore;
            return store;
        },
    };
});

const quest = () => useEditor.getState().project.quests[0];
const posOf = (id: string) => quest().graph.nodes.find((n) => n.id === id)!.position;

/** Give a node the size a real browser would have measured. */
function measure(id: string, width: number, height: number) {
    const node = rfStore?.getState().nodeLookup.get(id) as { measured?: unknown } | undefined;
    if (!node) throw new Error(`${id} missing from the React Flow lookup`);
    node.measured = { width, height };
}

beforeEach(() => {
    localStorage.clear();
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

describe("aligning cards that have real sizes", () => {
    it("puts the centres of differently sized cards on one line", async () => {
        const st = useEditor.getState();
        // The reported case: two short shell cards and one taller dialogue.
        const a = st.addNode("fx.shell", { x: 40, y: 130 })!;
        const b = st.addNode("fx.shell", { x: 265, y: 85 })!;
        const c = st.addNode("comms.dialogue", { x: 480, y: 38 })!;
        render(<App />);
        await waitFor(() => expect(document.querySelectorAll(".react-flow__node").length).toBe(3));
        act(() => useEditor.getState().select({ nodeIds: [a, b, c], edgeIds: [] }));
        // After selecting: React Flow rebuilds its internal nodes whenever the
        // `nodes` prop changes, which discards anything written earlier.
        measure(a, 175, 62);
        measure(b, 175, 62);
        measure(c, 200, 78);
        await userEvent.setup().click(
            document.querySelector('[aria-label="Align in a row"]') as HTMLButtonElement,
        );

        const centres = [
            posOf(a).y + 62 / 2,
            posOf(b).y + 62 / 2,
            posOf(c).y + 78 / 2,
        ];
        expect(new Set(centres).size).toBe(1);
        // ...and because the cards differ in height, their tops must NOT match:
        // matching tops is the corner-alignment bug this replaced.
        expect(posOf(a).y).not.toBe(posOf(c).y);
    });

    it("gives equal-height cards the same top edge, so wires run straight", async () => {
        const st = useEditor.getState();
        const a = st.addNode("fx.shell", { x: 40, y: 130 })!;
        const b = st.addNode("fx.shell", { x: 300, y: 40 })!;
        render(<App />);
        await waitFor(() => expect(document.querySelectorAll(".react-flow__node").length).toBe(2));
        act(() => useEditor.getState().select({ nodeIds: [a, b], edgeIds: [] }));
        measure(a, 175, 62);
        measure(b, 175, 62);
        await userEvent.setup().click(
            document.querySelector('[aria-label="Align in a row"]') as HTMLButtonElement,
        );
        // Same height, so centre alignment and top alignment coincide — which
        // is the picture in Zeis's Align-right.png.
        expect(posOf(a).y).toBe(posOf(b).y);
    });

    it("lines up columns on the cards' real widths", async () => {
        const st = useEditor.getState();
        const a = st.addNode("fx.shell", { x: 40, y: 0 })!;
        const b = st.addNode("comms.dialogue", { x: 300, y: 200 })!;
        render(<App />);
        await waitFor(() => expect(document.querySelectorAll(".react-flow__node").length).toBe(2));
        act(() => useEditor.getState().select({ nodeIds: [a, b], edgeIds: [] }));
        measure(a, 175, 62);
        measure(b, 200, 78);
        await userEvent.setup().click(
            document.querySelector('[aria-label="Align in a column"]') as HTMLButtonElement,
        );
        // Whole-pixel positions mean an odd-width card can sit half a pixel
        // off the line; anything more than that is a real misalignment.
        expect(Math.abs((posOf(a).x + 175 / 2) - (posOf(b).x + 200 / 2))).toBeLessThanOrEqual(0.5);
    });
});
