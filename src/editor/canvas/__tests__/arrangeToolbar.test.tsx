/**
 * The align / spread / snap toolbar, against the mounted editor.
 *
 * The arithmetic is unit-tested in arrange.test.ts; this checks the buttons are
 * wired to it, enable at the right times, and write the document once.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { createProject } from "@/schema/project";
import { useEditor } from "@/store/editor";
import { resetSnapForTests } from "@/editor/canvas/snapGrid";

const quest = () => useEditor.getState().project.quests[0];
const posOf = (id: string) => quest().graph.nodes.find((n) => n.id === id)!.position;

beforeEach(() => {
    localStorage.clear();
    resetSnapForTests();
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

async function threeNodes() {
    const st = useEditor.getState();
    const a = st.addNode("fx.notify", { x: 0, y: 0 })!;
    const b = st.addNode("fx.notify", { x: 100, y: 90 })!;
    const c = st.addNode("fx.notify", { x: 400, y: 30 })!;
    render(<App />);
    await waitFor(() => expect(document.querySelectorAll(".react-flow__node").length).toBe(3));
    return { a, b, c, user: userEvent.setup() };
}

const btn = (label: string) =>
    document.querySelector(`[aria-label="${label}"]`) as HTMLButtonElement;

describe("arrange toolbar", () => {
    it("needs two nodes before it will align anything", async () => {
        const { a } = await threeNodes();
        act(() => useEditor.getState().select({ nodeIds: [a], edgeIds: [] }));
        await waitFor(() => expect(btn("Align in a row").disabled).toBe(true));
    });

    it("aligns the selected nodes into a row on their average height", async () => {
        const { a, b, c, user } = await threeNodes();
        act(() => useEditor.getState().select({ nodeIds: [a, b, c], edgeIds: [] }));
        await waitFor(() => expect(btn("Align in a row").disabled).toBe(false));
        await user.click(btn("Align in a row"));
        // mean of 0, 90, 30
        expect(posOf(a).y).toBe(40);
        expect(posOf(b).y).toBe(40);
        expect(posOf(c).y).toBe(40);
        // the spread across is untouched
        expect(posOf(a).x).toBe(0);
        expect(posOf(c).x).toBe(400);
    });

    it("stacks them into a column on their average left edge", async () => {
        const { a, b, c, user } = await threeNodes();
        act(() => useEditor.getState().select({ nodeIds: [a, b, c], edgeIds: [] }));
        await user.click(btn("Align in a column"));
        expect(posOf(a).x).toBe(167); // mean of 0, 100, 400
        expect(posOf(b).x).toBe(167);
        expect(posOf(c).x).toBe(167);
    });

    it("spreads the gaps evenly, leaving the outer nodes alone", async () => {
        const { a, b, c, user } = await threeNodes();
        act(() => useEditor.getState().select({ nodeIds: [a, b, c], edgeIds: [] }));
        await user.click(btn("Space out across"));
        expect(posOf(a).x).toBe(0);
        expect(posOf(b).x).toBe(200);
        expect(posOf(c).x).toBe(400);
    });

    it("needs three nodes before it will spread anything", async () => {
        const { a, b } = await threeNodes();
        act(() => useEditor.getState().select({ nodeIds: [a, b], edgeIds: [] }));
        await waitFor(() => expect(btn("Space out across").disabled).toBe(true));
    });

    it("aligning is one undo, not one per node", async () => {
        const { a, b, c, user } = await threeNodes();
        act(() => useEditor.getState().select({ nodeIds: [a, b, c], edgeIds: [] }));
        await user.click(btn("Align in a row"));
        expect(posOf(a).y).toBe(40);
        act(() => useEditor.getState().undo());
        // One step puts every node back.
        expect(posOf(a).y).toBe(0);
        expect(posOf(b).y).toBe(90);
        expect(posOf(c).y).toBe(30);
    });

    it("the snap toggle remembers its state and does not touch the project", async () => {
        const { user } = await threeNodes();
        const before = JSON.stringify(quest().graph.nodes.map((n) => n.position));
        const toggle = document.querySelector('[aria-pressed][title*="snap"]') as HTMLButtonElement;
        expect(toggle.getAttribute("aria-pressed")).toBe("false");
        await user.click(toggle);
        await waitFor(() => expect(toggle.getAttribute("aria-pressed")).toBe("true"));
        expect(localStorage.getItem("qe.snapToGrid")).toBe("on");
        // A view preference must never move the author's nodes by itself.
        expect(JSON.stringify(quest().graph.nodes.map((n) => n.position))).toBe(before);
    });
});
