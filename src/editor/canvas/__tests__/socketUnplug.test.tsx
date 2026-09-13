/**
 * Ctrl+click a socket to unplug it — the complement to dragging a wire off,
 * for when you just want the socket empty.
 *
 * Driven against the real handle elements: unlike a connection *drag*, a
 * pointerdown on a handle is something jsdom can deliver faithfully, so this
 * is testable end to end.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import App from "@/App";
import { createProject } from "@/schema/project";
import { useEditor } from "@/store/editor";

const quest = () => useEditor.getState().project.quests[0];
const edgeCount = () => quest().graph.edges.length;

beforeEach(() => {
    localStorage.clear();
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

/** Two wired nodes, and the handles React Flow rendered for them. */
async function wiredPair() {
    const st = useEditor.getState();
    const a = st.addNode("fx.notify", { x: 0, y: 0 })!;
    const b = st.addNode("fx.notify", { x: 400, y: 0 })!;
    act(() => {
        useEditor.getState().connect({
            source: a, sourceHandle: "out", target: b, targetHandle: "in",
        });
    });
    expect(edgeCount()).toBe(1);
    render(<App />);
    await waitFor(() => expect(document.querySelectorAll(".react-flow__node").length).toBe(2));
    const nodes = [...document.querySelectorAll(".react-flow__node")];
    return {
        a, b,
        sourceHandle: nodes[0].querySelector(".react-flow__handle.source") as HTMLElement,
        targetHandle: nodes[1].querySelector(".react-flow__handle.target") as HTMLElement,
    };
}

const press = (el: HTMLElement, init: MouseEventInit) =>
    act(() => {
        el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0, ...init }));
    });

describe("ctrl+click a socket", () => {
    it("unplugs the wire leaving an output", async () => {
        const { sourceHandle } = await wiredPair();
        expect(sourceHandle).toBeTruthy();
        press(sourceHandle, { ctrlKey: true });
        await waitFor(() => expect(edgeCount()).toBe(0));
    });

    it("unplugs the wire arriving at an input", async () => {
        const { targetHandle } = await wiredPair();
        expect(targetHandle).toBeTruthy();
        press(targetHandle, { ctrlKey: true });
        await waitFor(() => expect(edgeCount()).toBe(0));
    });

    it("works with Cmd on a Mac", async () => {
        const { sourceHandle } = await wiredPair();
        press(sourceHandle, { metaKey: true });
        await waitFor(() => expect(edgeCount()).toBe(0));
    });

    it("leaves the wire alone on a plain click", async () => {
        // A plain pointerdown starts a connection drag; it must not delete.
        const { sourceHandle } = await wiredPair();
        press(sourceHandle, {});
        expect(edgeCount()).toBe(1);
    });

    it("does nothing on an empty socket", async () => {
        const st = useEditor.getState();
        st.addNode("fx.notify", { x: 0, y: 0 });
        render(<App />);
        await waitFor(() => expect(document.querySelectorAll(".react-flow__node").length).toBe(1));
        const handle = document.querySelector(".react-flow__handle.source") as HTMLElement;
        press(handle, { ctrlKey: true });
        expect(edgeCount()).toBe(0);
    });

    it("clears every wire fanning out of one output", async () => {
        const st = useEditor.getState();
        const a = st.addNode("fx.notify", { x: 0, y: 0 })!;
        const b = st.addNode("fx.notify", { x: 400, y: 0 })!;
        const c = st.addNode("fx.notify", { x: 400, y: 200 })!;
        act(() => {
            const s = useEditor.getState();
            s.connect({ source: a, sourceHandle: "out", target: b, targetHandle: "in" });
            s.connect({ source: a, sourceHandle: "out", target: c, targetHandle: "in" });
        });
        expect(edgeCount()).toBe(2);
        render(<App />);
        await waitFor(() => expect(document.querySelectorAll(".react-flow__node").length).toBe(3));
        const handle = document.querySelectorAll(".react-flow__node")[0]
            .querySelector(".react-flow__handle.source") as HTMLElement;
        press(handle, { ctrlKey: true });
        await waitFor(() => expect(edgeCount()).toBe(0));
    });
});
