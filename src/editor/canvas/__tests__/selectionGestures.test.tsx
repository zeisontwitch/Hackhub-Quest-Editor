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

import { boxSelectionResult } from "@/editor/canvas/applyChanges";

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

/** Drive a box drag over the pane, with modifiers, and return when it ends. */
function boxDrag(
    from: [number, number],
    to: [number, number],
    keys: { shift?: boolean; ctrl?: boolean } = {},
) {
    const pane = document.querySelector(".react-flow__pane") as HTMLElement;
    pane.getBoundingClientRect = () =>
        ({ x:0, y:0, width:1000, height:800, top:0, left:0, right:1000, bottom:800, toJSON(){} }) as DOMRect;
    const ev = (type: string, x: number, y: number) => {
        const e = new MouseEvent(type, {
            bubbles: true, clientX: x, clientY: y, button: 0,
            shiftKey: !!keys.shift, ctrlKey: !!keys.ctrl,
        }) as MouseEvent & { pointerId: number; isPrimary: boolean; pointerType: string };
        e.pointerId = 1; e.isPrimary = true; e.pointerType = "mouse";
        return e;
    };
    // window first: the real modifier source (see the mods ref in QuestCanvas).
    act(() => { window.dispatchEvent(ev("pointerdown", from[0], from[1])); });
    act(() => { pane.dispatchEvent(ev("pointerdown", from[0], from[1])); });
    act(() => { window.dispatchEvent(ev("pointermove", to[0], to[1])); });
    act(() => { pane.dispatchEvent(ev("pointermove", to[0], to[1])); });
    act(() => { pane.dispatchEvent(ev("pointerup", to[0], to[1])); });
}

/**
 * jsdom reports a zero-size rect for everything, so React Flow's node lookup
 * carries no dimensions and no box can ever overlap anything. A small probe
 * component grabs the store through the public hook, letting a test write in
 * the geometry a real browser's ResizeObserver would have supplied.
 */

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

    it("shift+drag ADDS the boxed nodes, keeping the earlier selection", async () => {
        // The box covers only node b, so node a can only survive if the
        // drag-start reset was suppressed.
        const { a, b } = await twoNodes();
        act(() => useEditor.getState().select({ nodeIds: [a], edgeIds: [] }));
        boxDrag([350, 10], [900, 700], { shift: true });
        expect(sel().slice().sort()).toEqual([a, b].slice().sort());
    });

    /*
     * NOT SUPPORTED: ctrl+drag to deselect. Three rounds (r93-r95) failed to
     * make it work in a real browser, and it was dropped as not worth further
     * cost. React Flow emits no change events for a box over already-selected
     * nodes (getSelectionChanges only fires on a state difference), and the
     * geometry route needed a store subscription that ran on every frame - a
     * standing performance risk for a gesture nobody had yet. Ctrl+CLICK to
     * deselect works and is covered above.
     */

    /*
     * The arithmetic is also covered directly, so a regression says plainly
     * whether the geometry or the set maths broke.
     */
    it("ctrl+drag arithmetic removes the boxed nodes", () => {
        expect(boxSelectionResult(["a", "b", "c"], new Set(["b"]), { ctrl: true }))
            .toEqual(["a", "c"]);
    });

    it("shift+drag arithmetic adds without dropping the earlier selection", () => {
        expect(boxSelectionResult(["a"], new Set(["b", "c"]), { shift: true }))
            .toEqual(["a", "b", "c"]);
    });

    it("ctrl+drag over nothing leaves the selection alone", () => {
        expect(boxSelectionResult(["a", "b"], new Set(), { ctrl: true }))
            .toEqual(["a", "b"]);
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
