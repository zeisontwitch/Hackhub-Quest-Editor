/**
 * The canvas-grid preference module.
 *
 * Pure module tests: defaults, patching, persistence, and — the part that
 * keeps a stale or corrupt blob from wedging the canvas — validation on read.
 * What the six patterns actually look like is Zeis's eyes, not jsdom's.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    CANVAS_GRID_STYLES,
    canvasGrid,
    DEFAULT_CANVAS_GRID,
    gridPatternColour,
    gridPatternOrigin,
    MAX_GRID_SCALE,
    MIN_GRID_SCALE,
    resetCanvasGridForTests,
    setCanvasGrid,
} from "@/editor/canvas/canvasGrid";

beforeEach(() => {
    localStorage.clear();
    resetCanvasGridForTests();
});

describe("defaults", () => {
    it("ships off, squares, snap-sized, half strength", () => {
        expect(canvasGrid()).toEqual({ enabled: false, style: "squares", scale: 22, opacity: 50 });
    });

    it("offers exactly the six styles Zeis specced — three his, three ours", () => {
        expect(CANVAS_GRID_STYLES.map((s) => s.id)).toEqual([
            "squares",
            "dots",
            "crosses",
            "hexagons",
            "graph",
            "diamond",
        ]);
    });
});

describe("changes", () => {
    it("patches one field and remembers the whole grid", () => {
        setCanvasGrid({ enabled: true });
        expect(canvasGrid()).toEqual({ ...DEFAULT_CANVAS_GRID, enabled: true });
        expect(JSON.parse(localStorage.getItem("qe.canvasGrid")!)).toEqual({
            enabled: true,
            style: "squares",
            scale: 22,
            opacity: 50,
        });
    });

    it("clamps scale and opacity to their ranges", () => {
        setCanvasGrid({ scale: 5000, opacity: -20 });
        expect(canvasGrid().scale).toBe(MAX_GRID_SCALE);
        expect(canvasGrid().opacity).toBe(0);
        setCanvasGrid({ scale: 0, opacity: 400 });
        expect(canvasGrid().scale).toBe(MIN_GRID_SCALE);
        expect(canvasGrid().opacity).toBe(100);
    });

    it("ignores an unknown style rather than rendering nothing", () => {
        // The type says this cannot happen; a stale localStorage blob can.
        setCanvasGrid({ style: "spiral" as never });
        expect(canvasGrid().style).toBe("squares");
    });

    it("survives a corrupt stored blob", async () => {
        localStorage.setItem("qe.canvasGrid", "{not json");
        vi.resetModules();
        const { canvasGrid: fresh } = await import("@/editor/canvas/canvasGrid");
        expect(fresh()).toEqual(DEFAULT_CANVAS_GRID);
    });

    it("validates a stale stored blob field by field", async () => {
        localStorage.setItem("qe.canvasGrid", '{"enabled":true,"style":"triangles","scale":"big","opacity":"lots"}');
        vi.resetModules();
        const { canvasGrid: fresh } = await import("@/editor/canvas/canvasGrid");
        expect(fresh()).toEqual({ enabled: true, style: "squares", scale: 22, opacity: 50 });
    });
});

describe("pattern helpers", () => {
    it("mixes the pattern colour from the theme's canvas-dots token", () => {
        expect(gridPatternColour(50)).toBe("color-mix(in srgb, var(--color-canvas-dots) 50%, transparent)");
    });

    it("anchors a tile the way React Flow's own Background does", () => {
        // Mirror of the library's `transform % gap` — panning must move the
        // pattern with the canvas, not slide it under the nodes.
        expect(gridPatternOrigin(30, 30, [100, 70, 1])).toEqual({ x: 10, y: 10 });
        expect(gridPatternOrigin(30, 20, [60, 45, 1])).toEqual({ x: 0, y: 5 });
    });
});
