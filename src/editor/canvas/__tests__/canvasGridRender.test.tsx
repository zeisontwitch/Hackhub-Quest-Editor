/**
 * What the canvas actually mounts for the visual grid.
 *
 * Structure only: which element exists for which style. Whether the six
 * patterns look right — and whether they stay seamless under pan and zoom —
 * is a compositor question, which jsdom cannot answer (Zeis's eyes).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import App from "@/App";
import { createProject } from "@/schema/project";
import { useEditor } from "@/store/editor";
import { canvasGrid, resetCanvasGridForTests, setCanvasGrid } from "@/editor/canvas/canvasGrid";
import { CROSS_SPAN, GRID_DOT_SIZE } from "@/editor/canvas/CanvasGridBackground";

beforeEach(() => {
    localStorage.clear();
    resetCanvasGridForTests();
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

async function renderCanvas() {
    render(<App />);
    await waitFor(() => expect(document.querySelector(".react-flow")).toBeTruthy());
}

describe("the canvas grid mounts", () => {
    it("renders no pattern at all while off — the shipped default", async () => {
        await renderCanvas();
        expect(document.querySelector('[data-testid="rf__background"]')).toBeNull();
        expect(document.querySelector('[data-testid="qe-canvas-grid"]')).toBeNull();
    });

    it("renders the library background for a native style", async () => {
        setCanvasGrid({ enabled: true, style: "squares" });
        await renderCanvas();
        expect(document.querySelector('[data-testid="rf__background"]')).toBeTruthy();
        expect(document.querySelector('[data-testid="qe-canvas-grid"]')).toBeNull();
    });

    it("renders the custom overlay for hexagons", async () => {
        setCanvasGrid({ enabled: true, style: "hexagons" });
        await renderCanvas();
        const overlay = document.querySelector('[data-testid="qe-canvas-grid"]');
        expect(overlay).toBeTruthy();
        expect(document.querySelector('[data-testid="qe-canvas-grid"] pattern')).toBeTruthy();
        // The pattern must carry the stamped honeycomb, not an empty tile.
        const paths = document.querySelectorAll('[data-testid="qe-canvas-grid"] pattern path');
        expect(paths.length).toBeGreaterThan(0);
        // The colour must travel a CSS channel (r144): var()/color-mix() do
        // not resolve in SVG presentation attributes, so the overlay sets
        // inline `color` and every stamp strokes currentColor.
        expect(overlay?.getAttribute("style")).toContain("color-mix(in srgb, var(--color-canvas-dots)");
        paths.forEach((path) => expect(path.getAttribute("stroke")).toBe("currentColor"));
    });

    it("renders the custom overlay for diamond", async () => {
        setCanvasGrid({ enabled: true, style: "diamond" });
        await renderCanvas();
        const lines = document.querySelectorAll('[data-testid="qe-canvas-grid"] pattern line');
        expect(lines.length).toBeGreaterThan(0);
        lines.forEach((line) => expect(line.getAttribute("stroke")).toBe("currentColor"));
        expect(document.querySelector('[data-testid="qe-canvas-grid"]')?.getAttribute("style")).toContain(
            "color-mix(in srgb, var(--color-canvas-dots)",
        );
    });

    it("graph paper stacks two native layers — fine and fifth", async () => {
        setCanvasGrid({ enabled: true, style: "graph" });
        await renderCanvas();
        expect(document.querySelectorAll('[data-testid="rf__background"]').length).toBe(2);
    });

    it("draws dots at a visible size — the r147 fix for sub-pixel ink", async () => {
        setCanvasGrid({ enabled: true, style: "dots" });
        await renderCanvas();
        const pattern = document.querySelector('[data-testid="rf__background"] pattern');
        const dot = document.querySelector('[data-testid="rf__background"] pattern circle');
        expect(dot).toBeTruthy();
        // The library's `size` is the diameter and scales with zoom; calibrate
        // the zoom from the rendered tile (pattern width = scale x zoom).
        const zoom = Number(pattern?.getAttribute("width")) / canvasGrid().scale;
        const r = Number(dot?.getAttribute("r"));
        expect(r).toBeCloseTo((GRID_DOT_SIZE * zoom) / 2, 5);
        // The point of r147: visible ink. The old size of 1.5 rendered a
        // sub-pixel 0.64px radius here — invisible at any opacity.
        expect(r).toBeGreaterThan(3);
    });

    it("draws crosses with the longer r147 arms and the chosen weight", async () => {
        setCanvasGrid({ enabled: true, style: "crosses", weight: 2.5 });
        await renderCanvas();
        const pattern = document.querySelector('[data-testid="rf__background"] pattern');
        const path = document.querySelector('[data-testid="rf__background"] pattern path');
        expect(path).toBeTruthy();
        // React renders strokeWidth as the dash-case attribute.
        expect(path?.getAttribute("stroke-width")).toBe("2.5");
        const zoom = Number(pattern?.getAttribute("width")) / canvasGrid().scale;
        const span = CROSS_SPAN * zoom;
        // LinePattern: M{span/2} 0 V{span} M0 {span/2} H{span} — arms run the
        // full tile through the centre. Parse the numbers rather than
        // string-match: React formats them at full precision.
        const d = path?.getAttribute("d") ?? "";
        const m = d.match(/^M([\d.]+) 0 V([\d.]+) M0 ([\d.]+) H([\d.]+)$/);
        expect(m).toBeTruthy();
        expect(Number(m?.[2])).toBeCloseTo(span, 5);
        expect(Number(m?.[1])).toBeCloseTo(span / 2, 5);
        expect(Number(m?.[4])).toBeCloseTo(span, 5);
    });

    it("a pinned colour reaches both channels — native and overlay", async () => {
        setCanvasGrid({ enabled: true, style: "squares", colour: "#ff00ff" });
        await renderCanvas();
        // Native: the library writes the colour into a CSS variable on its svg
        // (jsdom serializes inline styles with a space after the colon).
        const native = document.querySelector('[data-testid="rf__background"]');
        expect(native?.getAttribute("style")).toContain(
            "--xy-background-pattern-color-props: color-mix(in srgb, #ff00ff",
        );
        // Overlay: our inline ink channel. The value rides a custom property
        // (jsdom re-serializes standard properties lossily — #ff00ff would
        // come back as rgb(255, 0, 255) — but keeps custom ones verbatim).
        setCanvasGrid({ enabled: true, style: "diamond", colour: "#ff00ff" });
        await waitFor(() =>
            expect(document.querySelector('[data-testid="qe-canvas-grid"]')?.getAttribute("style")).toContain(
                "--qe-grid-ink: color-mix(in srgb, #ff00ff",
            ),
        );
    });

    it("the overlay strokes follow the line weight", async () => {
        setCanvasGrid({ enabled: true, style: "hexagons", weight: 2.5 });
        await renderCanvas();
        const paths = document.querySelectorAll('[data-testid="qe-canvas-grid"] pattern path');
        expect(paths.length).toBeGreaterThan(0);
        paths.forEach((path) => expect(path.getAttribute("stroke-width")).toBe("2.5"));
    });

    it("switching the grid off removes the pattern again", async () => {
        setCanvasGrid({ enabled: true, style: "squares" });
        await renderCanvas();
        act(() => setCanvasGrid({ enabled: false }));
        await waitFor(() =>
            expect(document.querySelector('[data-testid="rf__background"]')).toBeNull(),
        );
    });
});
