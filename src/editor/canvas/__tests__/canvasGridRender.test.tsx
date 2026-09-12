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
import { resetCanvasGridForTests, setCanvasGrid } from "@/editor/canvas/canvasGrid";

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

    it("switching the grid off removes the pattern again", async () => {
        setCanvasGrid({ enabled: true, style: "squares" });
        await renderCanvas();
        act(() => setCanvasGrid({ enabled: false }));
        await waitFor(() =>
            expect(document.querySelector('[data-testid="rf__background"]')).toBeNull(),
        );
    });
});
