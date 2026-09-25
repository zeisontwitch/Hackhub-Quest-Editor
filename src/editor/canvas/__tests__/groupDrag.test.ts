/**
 * The group frame's unit-drag state machine (r228).
 *
 * The layer-1 rule: membership is frozen at drag start — the frame moves
 * with what was inside it then, and nothing it sweeps past mid-drag comes
 * along. jsdom cannot drive React Flow's node drag (probed: d3-drag needs
 * pointer capture, which jsdom lacks), so the state machine itself carries
 * the assertions; QuestCanvas' onNodeDrag* handlers are one-line wrappers.
 */
import { describe, expect, it } from "vitest";
import {
    FRAME_MIN_H,
    FRAME_MIN_W,
    GROUP_PAD,
    beginGroupDrag,
    frameAround,
    stepGroupDrag,
} from "@/editor/canvas/groupDrag";
import type { NodeDoc } from "@/schema/nodes";

const node = (
    id: string,
    type: string,
    x: number,
    y: number,
    data: Record<string, unknown> = {},
): NodeDoc => ({ id, type, position: { x, y }, data }) as NodeDoc;

/** Cards 240×120, frames from their stored w/h — mirrors nodeSize for the
    shape these tests care about. */
const sizeOf = (n: NodeDoc) =>
    n.type === "layout.group"
        ? { width: (n.data as { w?: number }).w ?? 360, height: (n.data as { h?: number }).h ?? 240 }
        : { width: 240, height: 120 };

const FRAME = node("frame", "layout.group", 0, 0);

describe("beginGroupDrag", () => {
    it("returns null for a non-frame, so plain node drags are untouched", () => {
        expect(beginGroupDrag(node("n", "fx.notify", 0, 0), { x: 0, y: 0 }, [], sizeOf)).toBeNull();
    });

    it("freezes the nodes whose centre is inside the frame", () => {
        const inside = node("in", "fx.notify", 100, 60); // centre (220,120): inside 360×240
        const edge = node("edge", "fx.notify", 350, 10); // overlaps the frame's right edge
        const drag = beginGroupDrag(FRAME, FRAME.position, [FRAME, inside, edge], sizeOf)!;
        expect(drag.members).toEqual(["in"]);
    });

    it("includes a nested group frame, so the parent carries its sub-folder", () => {
        const sub = node("sub", "layout.group", 50, 40, { w: 100, h: 80 }); // centre (100,80)
        const drag = beginGroupDrag(FRAME, FRAME.position, [FRAME, sub], sizeOf)!;
        expect(drag.members).toEqual(["sub"]);
    });

    it("never includes the frame itself", () => {
        const drag = beginGroupDrag(FRAME, FRAME.position, [FRAME], sizeOf)!;
        expect(drag.members).toEqual([]);
    });
});

describe("stepGroupDrag", () => {
    it("moves the frozen members by the frame's delta and nothing else", () => {
        const a = node("a", "fx.notify", 100, 60);
        const b = node("b", "fx.notify", 500, 50);
        const drag = { id: "frame", x: 0, y: 0, members: ["a"] };
        const moves = stepGroupDrag(drag, { x: 30, y: -20 }, [a, b]);
        expect(moves).toEqual({ a: { x: 130, y: 40 } });
    });

    it("returns null before the frame has moved", () => {
        const a = node("a", "fx.notify", 100, 60);
        expect(stepGroupDrag({ id: "frame", x: 0, y: 0, members: ["a"] }, { x: 0, y: 0 }, [a])).toBeNull();
    });

    it("moves a nested frame with its parent", () => {
        const sub = node("sub", "layout.group", 50, 40, { w: 100, h: 80 });
        const drag = { id: "frame", x: 0, y: 0, members: ["sub"] };
        const moves = stepGroupDrag(drag, { x: 40, y: 10 }, [sub]);
        expect(moves).toEqual({ sub: { x: 90, y: 50 } });
    });

    it("does not capture a bystander the frame sweeps past mid-drag", () => {
        // The reported bug: membership was re-tested on every pointermove, so
        // the frame's edge dragged along any node it passed over.
        const member = node("member", "fx.notify", 100, 60); // centre inside at start
        const bystander = node("bystander", "fx.notify", 600, 60); // centre (720,120): outside
        const drag = beginGroupDrag(FRAME, FRAME.position, [FRAME, member, bystander], sizeOf)!;
        expect(drag.members).toEqual(["member"]);
        // The frame travels right; after the move its rect is 400..760 — the
        // bystander's centre (720) now sits inside it. The frozen set must not
        // care.
        const moves = stepGroupDrag(drag, { x: 400, y: 0 }, [member, bystander]);
        expect(moves?.member).toEqual({ x: 500, y: 60 });
        expect(moves?.bystander).toBeUndefined();
    });
});

describe("frameAround", () => {
    it("wraps the selection's bounding box with the pad", () => {
        const a = node("a", "fx.notify", 100, 100);
        const b = node("b", "fx.notify", 400, 300);
        // Bounding box of the two cards: x 100..640, y 100..420.
        expect(frameAround([a, b], sizeOf)).toEqual({
            x: 100 - GROUP_PAD,
            y: 100 - GROUP_PAD,
            w: 640 - 100 + GROUP_PAD * 2,
            h: 420 - 100 + GROUP_PAD * 2,
        });
    });

    it("clamps to the resizer minimums", () => {
        const tiny = node("t", "fx.notify", 100, 100);
        const tinySize = () => ({ width: 10, height: 10 });
        expect(frameAround([tiny], tinySize)).toEqual({
            x: 100 - GROUP_PAD,
            y: 100 - GROUP_PAD,
            w: FRAME_MIN_W,
            h: FRAME_MIN_H,
        });
    });

    it("carries a selected frame as part of the box (nested grouping)", () => {
        const sub = node("sub", "layout.group", 0, 0, { w: 360, h: 240 });
        const extra = node("extra", "fx.notify", 700, 0);
        const rect = frameAround([sub, extra], sizeOf);
        const centreOf = (n: NodeDoc) => {
            const s = sizeOf(n);
            return { x: n.position.x + s.width / 2, y: n.position.y + s.height / 2 };
        };
        for (const n of [sub, extra]) {
            const c = centreOf(n);
            expect(c.x >= rect.x && c.x <= rect.x + rect.w).toBe(true);
            expect(c.y >= rect.y && c.y <= rect.y + rect.h).toBe(true);
        }
    });

    it("returns integers and a sane default for an empty selection", () => {
        const fractional = node("f", "fx.notify", 100.4, 100.2);
        const rect = frameAround([fractional], sizeOf);
        for (const v of [rect.x, rect.y, rect.w, rect.h]) expect(Number.isInteger(v)).toBe(true);
        expect(frameAround([], sizeOf)).toEqual({ x: 0, y: 0, w: FRAME_MIN_W, h: FRAME_MIN_H });
    });
});
