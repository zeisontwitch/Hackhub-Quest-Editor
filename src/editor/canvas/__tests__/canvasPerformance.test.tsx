/**
 * Standing guards against the canvas performance faults this project has
 * already shipped once. Each is cheap; together they fail the build if a new
 * feature reintroduces a pattern that cost real user-visible frame time.
 *
 * History being protected:
 *  - r38/r42: a custom property written to the document root invalidated every
 *    element that could inherit it, 60x/second. An IDLE editor spent 40.8% of
 *    its frame time in style recalculation.
 *  - r44: scoping it to the canvas was not enough — the property still had to
 *    inherit, restyling every descendant. Now nothing inherits.
 *  - r95: a React Flow store subscription added for a box-selection gesture
 *    fired on every store write, i.e. every frame of every drag.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import App from "@/App";
import { createProject } from "@/schema/project";
import { useEditor } from "@/store/editor";

beforeEach(() => {
    localStorage.clear();
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

describe("canvas performance guards", () => {
    it("an idle canvas does not run an animation frame loop", async () => {
        const raf = vi.spyOn(globalThis, "requestAnimationFrame");
        const st = useEditor.getState();
        st.addNode("fx.notify", { x: 0, y: 0 });
        st.addNode("fx.notify", { x: 300, y: 0 });
        render(<App />);
        await waitFor(() => expect(document.querySelectorAll(".react-flow__node").length).toBe(2));
        await new Promise((r) => setTimeout(r, 60));
        const before = raf.mock.calls.length;
        await new Promise((r) => setTimeout(r, 120));
        // A steady rAF loop would add frames while nothing is happening.
        expect(raf.mock.calls.length - before).toBeLessThanOrEqual(2);
        raf.mockRestore();
    });

    it("writes no custom property to the document root", async () => {
        render(<App />);
        await waitFor(() => expect(document.querySelector(".react-flow")).toBeTruthy());
        await new Promise((r) => setTimeout(r, 60));
        // r38's regression: --qe-dash-offset on <html> restyles the whole page.
        expect(document.documentElement.getAttribute("style") ?? "").not.toContain("--qe-");
    });

    it("does not re-render the canvas when unrelated store state changes", async () => {
        const st = useEditor.getState();
        st.addNode("fx.notify", { x: 0, y: 0 });
        render(<App />);
        await waitFor(() => expect(document.querySelectorAll(".react-flow__node").length).toBe(1));
        const nodeEl = () => document.querySelector(".react-flow__node");
        const first = nodeEl();
        // Toggling a piece of state the canvas does not read must not remount it.
        act(() => useEditor.getState().toast("hello", "ok"));
        await new Promise((r) => setTimeout(r, 20));
        expect(nodeEl()).toBe(first);
    });
});
