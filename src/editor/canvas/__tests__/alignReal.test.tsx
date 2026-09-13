/**
 * Alignment end to end, with NOTHING faked.
 *
 * Every earlier attempt passed in jsdom while failing in the browser, because
 * jsdom measures nothing and the tests either injected sizes by hand or
 * unknowingly exercised the size-zero path. Sizes are now computed from the
 * card's own layout constants, so this needs no measurement at all — and if
 * alignment ever stops receiving real sizes again, these fail.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { createProject } from "@/schema/project";
import { useEditor } from "@/store/editor";
import { nodeSize } from "@/editor/canvas/nodeSize";

const quest = () => useEditor.getState().project.quests[0];
const nodeOf = (id: string) => quest().graph.nodes.find((n) => n.id === id)!;
const centreY = (id: string) => nodeOf(id).position.y + nodeSize(nodeOf(id), quest()).height / 2;
const centreX = (id: string) => nodeOf(id).position.x + nodeSize(nodeOf(id), quest()).width / 2;

beforeEach(() => {
    localStorage.clear();
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

/** The three cards from the report: two shell cards and a taller dialogue. */
async function reportedCards() {
    const st = useEditor.getState();
    const a = st.addNode("fx.shell", { x: 40, y: 400 })!;
    const b = st.addNode("fx.shell", { x: 300, y: 315 })!;
    const c = st.addNode("comms.dialogue", { x: 560, y: 358 })!;
    render(<App />);
    await waitFor(() => expect(document.querySelectorAll(".react-flow__node").length).toBe(3));
    act(() => useEditor.getState().select({ nodeIds: [a, b, c], edgeIds: [] }));
    return { a, b, c, user: userEvent.setup() };
}

const click = (label: string) =>
    userEvent.setup().click(document.querySelector(`[aria-label="${label}"]`) as HTMLButtonElement);

describe("Row and Column with computed sizes", () => {
    it("Row puts every card on one centre line", async () => {
        const { a, b, c } = await reportedCards();
        await click("Align in a row");
        const centres = [centreY(a), centreY(b), centreY(c)];
        // Half a pixel of slack: positions are whole numbers, so an odd-height
        // card cannot sit exactly on a fractional line.
        expect(Math.max(...centres) - Math.min(...centres)).toBeLessThanOrEqual(0.5);
    });

    it("Row leaves the horizontal spread alone", async () => {
        const { a, b, c } = await reportedCards();
        await click("Align in a row");
        expect(nodeOf(a).position.x).toBe(40);
        expect(nodeOf(b).position.x).toBe(300);
        expect(nodeOf(c).position.x).toBe(560);
    });

    it("Row actually moves the cards it needs to", async () => {
        const { a } = await reportedCards();
        const before = nodeOf(a).position.y;
        await click("Align in a row");
        expect(nodeOf(a).position.y).not.toBe(before);
    });

    it("equal-height cards end up with the same top edge", async () => {
        // Two cards of the same type, so the same height: centring them is
        // indistinguishable from matching their tops, which is the picture in
        // the reference screenshot.
        const st = useEditor.getState();
        const a = st.addNode("fx.shell", { x: 40, y: 400 })!;
        const b = st.addNode("fx.shell", { x: 300, y: 315 })!;
        render(<App />);
        await waitFor(() => expect(document.querySelectorAll(".react-flow__node").length).toBe(2));
        act(() => useEditor.getState().select({ nodeIds: [a, b], edgeIds: [] }));
        await click("Align in a row");
        expect(nodeOf(a).position.y).toBe(nodeOf(b).position.y);
    });

    it("Column puts every card on one centre line", async () => {
        const { a, b, c } = await reportedCards();
        await click("Align in a column");
        const centres = [centreX(a), centreX(b), centreX(c)];
        expect(Math.max(...centres) - Math.min(...centres)).toBeLessThanOrEqual(0.5);
    });
});
