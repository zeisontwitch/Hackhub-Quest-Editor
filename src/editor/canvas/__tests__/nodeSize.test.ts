/**
 * The computed card size must keep matching the card the component renders.
 *
 * Alignment stopped working three times because it was fed sizes of zero, so
 * the sizes are now computed from known constants instead of measured. That
 * only stays true if these constants track GraphNode — hence the checks
 * against the component source below: if someone changes the card's width or
 * its minHeight formula, this fails rather than alignment quietly skewing.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
    CARD_MIN_HEIGHT,
    CARD_WIDTH,
    SOCKET_ROW_HEIGHT,
    nodeSize,
} from "@/editor/canvas/nodeSize";
import { nodeTypeDef } from "@/schema/registry";
import type { NodeDoc, NodeType } from "@/schema/nodes";

const SOURCE = readFileSync("src/editor/canvas/GraphNode.tsx", "utf8");

const doc = (type: NodeType, data: Record<string, unknown> = {}): NodeDoc =>
    ({ id: "n1", type, position: { x: 0, y: 0 }, data: { ...nodeTypeDef(type).create(), ...data } }) as NodeDoc;

describe("card constants still match GraphNode", () => {
    it("the card is w-60", () => {
        // 60 * 4px = 240px in Tailwind's default scale.
        expect(SOURCE).toContain("w-60");
        expect(CARD_WIDTH).toBe(240);
    });

    it("the minHeight formula is unchanged", () => {
        expect(SOURCE).toContain(
            `minHeight: ${CARD_MIN_HEIGHT} + Math.max(0, Math.max(sources.length, def.targets.length) - 2) * ${SOCKET_ROW_HEIGHT}`,
        );
    });

    it("the summary block is still capped at three lines", () => {
        expect(SOURCE).toContain("lines.slice(0, 3)");
    });
});

describe("nodeSize", () => {
    it("gives every ordinary card the same width", () => {
        expect(nodeSize(doc("fx.shell")).width).toBe(CARD_WIDTH);
        expect(nodeSize(doc("comms.dialogue")).width).toBe(CARD_WIDTH);
        expect(nodeSize(doc("objective")).width).toBe(CARD_WIDTH);
    });

    it("grows a card that has many sockets", () => {
        const plain = nodeSize(doc("fx.notify")).height;
        const many = nodeSize(doc("flow.sequence", { count: 6 })).height;
        expect(many).toBeGreaterThan(plain);
    });

    it("never returns zero, which is what broke alignment", () => {
        for (const type of ["fx.shell", "comms.dialogue", "flow.branch", "world.network"] as NodeType[]) {
            const size = nodeSize(doc(type));
            expect(size.width).toBeGreaterThan(0);
            expect(size.height).toBeGreaterThan(0);
        }
    });

    it("sizes a frame from its own stored dimensions", () => {
        expect(nodeSize(doc("layout.group", { width: 500, height: 300 })))
            .toEqual({ width: 500, height: 300 });
    });

    it("treats a reroute nodule as the small dot it is", () => {
        expect(nodeSize(doc("flow.reroute")).height).toBeLessThan(CARD_MIN_HEIGHT);
    });
});
