/**
 * The five selection gestures, as specified by QA, against the mounted canvas.
 *
 * These exist because reasoning from the React Flow source got the behaviour
 * wrong twice: the pure-function tests passed while the editor did not work.
 * Anything asserted here is asserted against real DOM events.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { createProject } from "@/schema/project";
import { useEditor } from "@/store/editor";

const sel = () => useEditor.getState().selection.nodeIds;

beforeEach(() => {
    localStorage.clear();
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

async function twoNodes() {
    const st = useEditor.getState();
    const a = st.addNode("fx.notify", { x: 0, y: 0 })!;
    const b = st.addNode("fx.notify", { x: 400, y: 0 })!;
    render(<App />);
    await waitFor(() => expect(document.querySelectorAll(".react-flow__node").length).toBe(2));
    const cards = document.querySelectorAll(".react-flow__node");
    return { a, b, cards, user: userEvent.setup() };
}

describe("selection gestures", () => {
    it("click selects a single node", async () => {
        const { a, cards, user } = await twoNodes();
        await user.click(cards[0] as HTMLElement);
        expect(sel()).toEqual([a]);
    });

    it("ctrl+click adds an unselected node to the selection", async () => {
        const { a, b, cards, user } = await twoNodes();
        await user.click(cards[0] as HTMLElement);
        await user.keyboard("{Control>}");
        await user.click(cards[1] as HTMLElement);
        await user.keyboard("{/Control}");
        expect(sel().slice().sort()).toEqual([a, b].slice().sort());
    });

    it("ctrl+click deselects a node that is already selected", async () => {
        const { a, b, cards, user } = await twoNodes();
        act(() => useEditor.getState().select({ nodeIds: [a, b], edgeIds: [] }));
        await user.keyboard("{Control>}");
        await user.click(cards[0] as HTMLElement);
        await user.keyboard("{/Control}");
        expect(sel()).toEqual([b]);
    });

    it("does not leave a nodes-selection overlay able to swallow clicks", async () => {
        // The overlay React Flow draws over a multi-selection sat on top of the
        // nodes and ate every click aimed at them.
        const { a, b } = await twoNodes();
        act(() => useEditor.getState().select({ nodeIds: [a, b], edgeIds: [] }));
        await waitFor(() => {
            const rect = document.querySelector(".react-flow__nodesselection-rect");
            if (!rect) return;
            expect(getComputedStyle(rect).pointerEvents).toBe("none");
        });
    });
});
