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

function layer(): SVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.appendChild(svg);
    return svg;
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
        expect(svg.querySelectorAll("path")).toHaveLength(1);
    });

    it("starts at the sag the live wire had, so it does not jump", () => {
        const svg = layer();
        spawn(svg, { sag: 40 });
        const d = svg.querySelector("path")!.getAttribute("d")!;
        expect(d).toContain("40");
    });

    it("never intercepts a click meant for the canvas", () => {
        // The author has already let go; a fading wire must not swallow input.
        const svg = layer();
        spawn(svg);
        expect((svg.querySelector("path") as SVGPathElement).style.pointerEvents).toBe("none");
    });

    it("is drawn in the wire's own colour", () => {
        const svg = layer();
        spawn(svg, { colour: "#f472b6" });
        expect(svg.querySelector("path")!.getAttribute("stroke")).toBe("#f472b6");
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
        expect(svg.querySelectorAll("path")).toHaveLength(0);
    });

    it("can be removed early by its caller", () => {
        const svg = layer();
        const remove = spawn(svg);
        remove();
        expect(liveWireGhostCount()).toBe(0);
        expect(svg.querySelectorAll("path")).toHaveLength(0);
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
        expect(svg.querySelectorAll("path")).toHaveLength(0);
    });

    it("works where the engine cannot animate", () => {
        // jsdom has no Element.animate. The ghost must still appear and go.
        vi.useFakeTimers();
        const svg = layer();
        spawn(svg);
        expect(svg.querySelectorAll("path")).toHaveLength(1);
        vi.advanceTimersByTime(GHOST_MS + 10);
        expect(svg.querySelectorAll("path")).toHaveLength(0);
    });
});
