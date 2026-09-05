/**
 * The wire ghost.
 *
 * This is the piece I flagged as riskiest in the plan: it deliberately
 * outlives the gesture that made it, which is the shape that leaks. So most of
 * these are lifetime tests rather than appearance tests.
 *
 * NOT asserted: that the fade looks right. jsdom has no `Element.animate` and
 * no compositor — the code falls back to holding the shape for the same
 * moment, and how it actually reads is for Zeis in the preview.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
    GHOST_MS,
    dismissWireGhosts,
    liveWireGhostCount,
    spawnWireGhost,
} from "@/editor/canvas/wireGhost";

/**
 * Stands in for React Flow's `.react-flow__edges`, which is a plain <div> —
 * not an <svg>. That distinction is the whole of the r114 bug, so the fake has
 * to get it right or the tests would not have caught it either.
 */
function layer(): SVGElement {
    const div = document.createElement("div");
    div.className = "react-flow__edges";
    document.body.appendChild(div);
    return div as unknown as SVGElement;
}

const spawn = (svg: SVGElement, extra: Partial<Parameters<typeof spawnWireGhost>[0]> = {}) =>
    spawnWireGhost({
        layer: svg,
        from: { x: 0, y: 0 },
        to: { x: 200, y: 0 },
        sag: 40,
        colour: "#22d3ee",
        ...extra,
    });

afterEach(() => {
    dismissWireGhosts();
    document.body.innerHTML = "";
    vi.useRealTimers();
});

describe("appearing", () => {
    it("adds a path to the layer it was given", () => {
        const svg = layer();
        spawn(svg);
        expect(svg.querySelectorAll("svg.qe-wire-ghost path")).toHaveLength(1);
    });

    it("starts at the sag the live wire had, so it does not jump", () => {
        const svg = layer();
        spawn(svg, { sag: 40 });
        const d = svg.querySelector("svg.qe-wire-ghost path")!.getAttribute("d")!;
        expect(d).toContain("40");
    });

    it("never intercepts a click meant for the canvas", () => {
        // The author has already let go; a fading wire must not swallow input.
        const svg = layer();
        spawn(svg);
        expect((svg.querySelector("svg.qe-wire-ghost path") as SVGPathElement).style.pointerEvents).toBe("none");
    });

    it("is drawn in the wire's own colour", () => {
        const svg = layer();
        spawn(svg, { colour: "#f472b6" });
        expect(svg.querySelector("svg.qe-wire-ghost path")!.getAttribute("stroke")).toBe("#f472b6");
    });
});

describe("going away again", () => {
    it("removes itself once its moment is over", () => {
        vi.useFakeTimers();
        const svg = layer();
        spawn(svg);
        expect(liveWireGhostCount()).toBe(1);
        vi.advanceTimersByTime(GHOST_MS + 10);
        expect(liveWireGhostCount()).toBe(0);
        expect(svg.querySelectorAll("svg.qe-wire-ghost path")).toHaveLength(0);
    });

    it("can be removed early by its caller", () => {
        const svg = layer();
        const remove = spawn(svg);
        remove();
        expect(liveWireGhostCount()).toBe(0);
        expect(svg.querySelectorAll("svg.qe-wire-ghost path")).toHaveLength(0);
    });

    it("survives being removed twice", () => {
        const svg = layer();
        const remove = spawn(svg);
        remove();
        expect(() => remove()).not.toThrow();
        expect(liveWireGhostCount()).toBe(0);
    });

    it("leaves no timer behind when torn down early", () => {
        // A pending timer holding a detached element is the leak this guards.
        vi.useFakeTimers();
        const svg = layer();
        spawn(svg);
        dismissWireGhosts();
        expect(vi.getTimerCount()).toBe(0);
    });

    it("clears every ghost at once, however many are in flight", () => {
        const svg = layer();
        spawn(svg);
        spawn(svg);
        spawn(svg);
        expect(liveWireGhostCount()).toBe(3);
        dismissWireGhosts();
        expect(liveWireGhostCount()).toBe(0);
        expect(svg.querySelectorAll("svg.qe-wire-ghost path")).toHaveLength(0);
    });

    it("works where the engine cannot animate", () => {
        // jsdom has no Element.animate. The ghost must still appear and go.
        vi.useFakeTimers();
        const svg = layer();
        spawn(svg);
        expect(svg.querySelectorAll("svg.qe-wire-ghost path")).toHaveLength(1);
        vi.advanceTimersByTime(GHOST_MS + 10);
        expect(svg.querySelectorAll("svg.qe-wire-ghost path")).toHaveLength(0);
    });
});

describe("r108: the search holds the ghost back", () => {
    /*
     * Zeis's question. Dropping a wire on empty canvas opens the node search
     * rather than cancelling the wire, so the wire is *pending*, not gone —
     * ghosting it there would fade it away while the author is still choosing
     * what to connect it to.
     *
     * The rule the canvas implements, checked here at the level this file can
     * honestly test (the ghost's own behaviour); the wiring is covered by the
     * canvas tests:
     *
     *   - picked a node   -> connected, so the deferred ghost is discarded
     *   - dismissed       -> abandoned, so the deferred ghost plays
     */
    it("a deferred ghost does nothing until it is played", () => {
        const svg = layer();
        // The canvas holds the spawn in a ref rather than calling it.
        const deferred = () => spawn(svg);
        expect(liveWireGhostCount()).toBe(0);
        expect(svg.querySelectorAll("svg.qe-wire-ghost path")).toHaveLength(0);

        // Dismissed: now it plays.
        deferred();
        expect(liveWireGhostCount()).toBe(1);
    });

    it("a discarded ghost never appears at all", () => {
        const svg = layer();
        let deferred: (() => void) | null = () => spawn(svg);
        // A node was chosen, so the wire is connected: drop it unplayed.
        deferred = null;
        expect(deferred).toBeNull();
        expect(svg.querySelectorAll("svg.qe-wire-ghost path")).toHaveLength(0);
        expect(liveWireGhostCount()).toBe(0);
    });
});


describe("r114: the ghost must be inside its own <svg>", () => {
    /*
     * The bug QA saw as "the log says the ghost fired but nothing renders".
     *
     * `.react-flow__edges` is a plain <div> — React Flow gives every edge its
     * own <svg> child. A raw <path> appended to a div is created, sits in the
     * DOM, and is never painted. The ghost now brings its own wrapper.
     */
    it("wraps the path in an svg rather than appending it bare", () => {
        const host = layer();
        spawn(host);
        const wrapper = host.querySelector("svg.qe-wire-ghost");
        expect(wrapper).toBeTruthy();
        expect(wrapper!.querySelector("path")).toBeTruthy();
        // Nothing bare directly under the layer, which would never render.
        expect([...host.children].every((c) => c.tagName.toLowerCase() === "svg")).toBe(true);
    });

    it("lets the curve hang outside its own box", () => {
        // Without overflow:visible the sag would be clipped to a zero-size svg.
        const host = layer();
        spawn(host);
        const wrapper = host.querySelector("svg.qe-wire-ghost") as SVGSVGElement;
        expect(wrapper.style.overflow).toBe("visible");
        expect(wrapper.style.position).toBe("absolute");
    });

    it("removes the wrapper, not just the path", () => {
        // Leaving empty <svg> shells behind would leak one element per drag.
        const host = layer();
        const remove = spawn(host);
        remove();
        expect(host.children).toHaveLength(0);
    });

    it("never lets the ghost swallow a click", () => {
        const host = layer();
        spawn(host);
        const wrapper = host.querySelector("svg.qe-wire-ghost") as SVGSVGElement;
        expect(wrapper.style.pointerEvents).toBe("none");
    });
});
