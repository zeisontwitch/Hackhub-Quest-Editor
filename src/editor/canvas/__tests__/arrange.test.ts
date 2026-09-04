import { describe, expect, it } from "vitest";
import {
    alignPositions,
    distributePositions,
    GRID,
    snapPoint,
    snapPositions,
} from "@/editor/canvas/arrange";

const n = (id: string, x: number, y: number) => ({ id, position: { x, y } });

describe("snapPoint", () => {
    it("rounds to the nearest grid intersection", () => {
        expect(snapPoint({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
        // 10/22 rounds down to 0; 11/22 is the halfway point and rounds up.
        expect(snapPoint({ x: 10, y: 10 })).toEqual({ x: 0, y: 0 });
        expect(snapPoint({ x: 11, y: 33 })).toEqual({ x: GRID, y: 2 * GRID });
    });

    it("handles negative coordinates", () => {
        expect(snapPoint({ x: -10, y: -30 })).toEqual({ x: 0, y: -GRID });
        // -0 would be a nasty thing to write into a saved project.
        expect(Object.is(snapPoint({ x: -10, y: -10 }).x, -0)).toBe(false);
    });
});

describe("snapPositions", () => {
    it("returns only the nodes that move", () => {
        const moved = snapPositions([n("a", 0, 0), n("b", 5, 5)]);
        expect(Object.keys(moved)).toEqual(["b"]);
    });

    it("writes nothing when everything is already on the grid", () => {
        expect(snapPositions([n("a", 0, 0), n("b", GRID, 2 * GRID)])).toEqual({});
    });
});

describe("alignPositions with measured cards", () => {
    /*
     * The r97 report: three cards of different heights looked "barely moved"
     * after Align in a row, because matching their top edges leaves their
     * middles staggered. Authors mean the centres.
     */
    const sized = (id: string, x: number, y: number, w: number, h: number) => ({
        id, position: { x, y }, size: { width: w, height: h },
    });

    it("centres cards of different heights, so their tops differ", () => {
        // Centres start at 30 and 150; the mean is 90.
        const a = sized("a", 0, 0, 200, 60);
        const b = sized("b", 300, 100, 200, 100);
        const moved = alignPositions([a, b], "row");
        expect(moved.a.y).toBe(60); // 90 - 30
        expect(moved.b.y).toBe(40); // 90 - 50
        // Different tops, same centre - which is the whole point.
        expect(moved.a.y).not.toBe(moved.b.y);
        expect(moved.a.y + 30).toBe(moved.b.y + 50);
    });

    it("the screenshot case ends up on one centre line", () => {
        const nodes = [
            sized("shell1", 40, 130, 175, 62),
            sized("shell2", 265, 85, 175, 62),
            sized("dialogue", 480, 38, 200, 78),
        ];
        const moved = alignPositions(nodes, "row");
        const centres = nodes.map((n) => (moved[n.id]?.y ?? n.position.y) + n.size.height / 2);
        expect(new Set(centres.map((c) => Math.round(c))).size).toBe(1);
    });

    it("falls back to corner alignment when a size is unknown", () => {
        const moved = alignPositions([{ id: "a", position: { x: 0, y: 0 } }, { id: "b", position: { x: 10, y: 100 } }], "row");
        expect(moved.a.y).toBe(50);
        expect(moved.b.y).toBe(50);
    });

    it("centres columns on width too", () => {
        const moved = alignPositions([sized("a", 0, 0, 100, 50), sized("b", 200, 80, 300, 50)], "column");
        expect(moved.a.x + 50).toBe(moved.b.x + 150);
    });
});

describe("alignPositions", () => {
    it("puts nodes in a row on their average y, keeping x", () => {
        const moved = alignPositions([n("a", 0, 0), n("b", 100, 100)], "row");
        expect(moved).toEqual({ a: { x: 0, y: 50 }, b: { x: 100, y: 50 } });
    });

    it("stacks nodes in a column on their average x, keeping y", () => {
        const moved = alignPositions([n("a", 0, 0), n("b", 100, 100)], "column");
        expect(moved).toEqual({ a: { x: 50, y: 0 }, b: { x: 50, y: 100 } });
    });

    it("uses the average so the group does not jump to one node", () => {
        // Averaging keeps the row where the author left it. Snapping to the
        // first node's y would drag everything up to 0.
        const moved = alignPositions([n("a", 0, 0), n("b", 10, 90), n("c", 20, 90)], "row");
        expect(moved.a.y).toBe(60);
    });

    it("does nothing for fewer than two nodes", () => {
        expect(alignPositions([n("a", 3, 7)], "row")).toEqual({});
        expect(alignPositions([], "column")).toEqual({});
    });

    it("omits nodes already on the line", () => {
        const moved = alignPositions([n("a", 0, 50), n("b", 100, 50)], "row");
        expect(moved).toEqual({});
    });
});

describe("distributePositions", () => {
    it("evens out the gaps without moving the outer nodes", () => {
        const moved = distributePositions([n("a", 0, 0), n("b", 10, 0), n("c", 300, 0)], "row");
        expect(moved).toEqual({ b: { x: 150, y: 0 } });
    });

    it("needs at least three nodes to mean anything", () => {
        expect(distributePositions([n("a", 0, 0), n("b", 90, 0)], "row")).toEqual({});
    });

    it("works down a column too", () => {
        const moved = distributePositions([n("a", 0, 0), n("b", 0, 5), n("c", 0, 200)], "column");
        expect(moved).toEqual({ b: { x: 0, y: 100 } });
    });
});
