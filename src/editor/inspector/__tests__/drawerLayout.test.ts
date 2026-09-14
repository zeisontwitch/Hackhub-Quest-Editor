/**
 * The inspector drawer's layout state (r158).
 *
 * Pure module: mode + rect, persisted to localStorage, clamped to stay on
 * screen. These are the guarantees the UI relies on — a panel that can be
 * dragged off the top edge is unrecoverable, so the clamp is load-bearing, not
 * cosmetic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    DEFAULT_FLOAT_RECT,
    DOCKED_WIDTH,
    MAX_FLOAT_WIDTH,
    MIN_FLOAT_HEIGHT,
    MIN_FLOAT_WIDTH,
    clampRect,
    dockInspector,
    floatInspector,
    inspectorFloatRect,
    inspectorMode,
    resetInspectorLayout,
    setInspectorFloatRect,
    subscribeInspectorLayout,
} from "@/editor/inspector/drawerLayout";

beforeEach(() => {
    localStorage.clear();
    resetInspectorLayout();
    // A known window size so clamp maths is deterministic.
    vi.stubGlobal("innerWidth", 1280);
    vi.stubGlobal("innerHeight", 800);
});

describe("mode", () => {
    it("ships docked", () => {
        expect(inspectorMode()).toBe("docked");
    });

    it("floats and docks, notifying subscribers each time", () => {
        const seen: string[] = [];
        const unsub = subscribeInspectorLayout(() => seen.push(inspectorMode()));
        floatInspector();
        expect(inspectorMode()).toBe("floating");
        dockInspector();
        expect(inspectorMode()).toBe("docked");
        expect(seen).toEqual(["floating", "docked"]);
        unsub();
    });

    it("is idempotent — floating twice fires one change", () => {
        let count = 0;
        const unsub = subscribeInspectorLayout(() => count++);
        floatInspector();
        floatInspector();
        expect(count).toBe(1);
        unsub();
    });

    it("persists the mode across a reload", () => {
        floatInspector();
        expect(localStorage.getItem("qe.inspector.mode")).toBe("floating");
    });
});

describe("clampRect", () => {
    it("keeps a rect that already fits", () => {
        const r = { x: 100, y: 100, width: DOCKED_WIDTH, height: 400 };
        expect(clampRect(r)).toEqual(r);
    });

    it("never lets the panel leave the top-left", () => {
        const r = clampRect({ x: -500, y: -500, width: 320, height: 400 });
        expect(r.x).toBe(0);
        expect(r.y).toBe(0);
    });

    it("keeps the whole panel on screen at the far edge", () => {
        const r = clampRect({ x: 5000, y: 5000, width: 320, height: 400 });
        expect(r.x).toBe(1280 - 320);
        expect(r.y).toBe(800 - 400);
    });

    it("clamps width and height to their bounds", () => {
        const tooSmall = clampRect({ x: 0, y: 0, width: 10, height: 10 });
        expect(tooSmall.width).toBe(MIN_FLOAT_WIDTH);
        expect(tooSmall.height).toBe(MIN_FLOAT_HEIGHT);
        const tooBig = clampRect({ x: 0, y: 0, width: 9999, height: 9999 });
        expect(tooBig.width).toBe(MAX_FLOAT_WIDTH);
        expect(tooBig.height).toBe(800);
    });

    it("falls back to the minimum for a NaN size", () => {
        const r = clampRect({ x: 0, y: 0, width: NaN, height: NaN });
        expect(r.width).toBe(MIN_FLOAT_WIDTH);
        expect(r.height).toBe(MIN_FLOAT_HEIGHT);
    });
});

describe("setInspectorFloatRect", () => {
    it("applies a partial move, clamped and persisted", () => {
        setInspectorFloatRect({ x: 200, y: 150 });
        const r = inspectorFloatRect();
        expect(r.x).toBe(200);
        expect(r.y).toBe(150);
        expect(r.width).toBe(DEFAULT_FLOAT_RECT.width);
        expect(JSON.parse(localStorage.getItem("qe.inspector.floatRect")!).x).toBe(200);
    });

    it("clamps a drag past the edge instead of losing the panel", () => {
        setInspectorFloatRect({ x: -999, y: -999 });
        const r = inspectorFloatRect();
        expect(r.x).toBe(0);
        expect(r.y).toBe(0);
    });
});

describe("reset", () => {
    it("returns to docked at the default rect", () => {
        floatInspector();
        setInspectorFloatRect({ x: 400, y: 300 });
        resetInspectorLayout();
        expect(inspectorMode()).toBe("docked");
        expect(inspectorFloatRect()).toEqual(DEFAULT_FLOAT_RECT);
    });
});
