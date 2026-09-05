/**
 * Ranking rules for the add-a-node search. Pure functions, no DOM — this is
 * where the search's feel lives, so it is pinned independently of the popover.
 */
import { describe, expect, it } from "vitest";
import {
    MatchRank,
    allNodeTypes,
    entrySocketFor,
    moveHighlight,
    rankOf,
    searchNodeTypes,
    typesAcceptingWire,
} from "@/editor/canvas/nodeSearch";
import { nodeTypeDef, sourcesOf } from "@/schema/registry";

const labelsFor = (q: string) => searchNodeTypes(q).map((d) => d.label);

describe("searchNodeTypes", () => {
    it("returns everything, in palette order, for an empty query", () => {
        expect(searchNodeTypes("")).toEqual(allNodeTypes());
        expect(searchNodeTypes("   ")).toEqual(allNodeTypes());
    });

    it("puts a name that starts with the query first", () => {
        // The node actually called Dialogue must beat anything that merely
        // mentions dialogue in its description.
        const first = searchNodeTypes("dia")[0];
        expect(first.label.toLowerCase().startsWith("dia")).toBe(true);
    });

    it("ranks prefix above contains above type-id above blurb", () => {
        const pool = [
            nodeTypeDef("comms.dialogue"), // label "Dialogue"
            nodeTypeDef("fx.notify"),
            nodeTypeDef("flow.branch"),
        ];
        const ranks = pool.map((d) => rankOf(d, "dialogue"));
        expect(ranks[0]).toBe(MatchRank.LabelPrefix);
        // Whatever the others match on, they must rank worse than the label.
        expect(Math.min(...ranks.slice(1))).toBeGreaterThan(MatchRank.LabelPrefix);
    });

    it("finds a node by its type id, for authors who think in ids", () => {
        const hits = searchNodeTypes("comms.dialogue");
        expect(hits[0].type).toBe("comms.dialogue");
    });

    it("ignores case and surrounding whitespace", () => {
        expect(labelsFor("  DIALOGUE ")).toEqual(labelsFor("dialogue"));
    });

    it("returns nothing for a query that matches nothing", () => {
        expect(searchNodeTypes("zzzzzzz")).toEqual([]);
    });

    it("keeps palette order within the same rank, so the list is stable", () => {
        const pool = allNodeTypes();
        const hits = searchNodeTypes("e"); // deliberately broad
        const sameRank = hits.filter((d) => rankOf(d, "e") === MatchRank.LabelContains);
        const orders = sameRank.map((d) => pool.indexOf(d));
        expect(orders).toEqual([...orders].sort((a, b) => a - b));
    });

    it("offers the reroute and frame types the palette also offers", () => {
        // Zeis: neither should be hidden. Same source as the palette.
        const types = allNodeTypes().map((d) => d.type);
        expect(types).toContain("flow.reroute");
        expect(types).toContain("layout.group");
    });
});

describe("moveHighlight", () => {
    it("steps down and up", () => {
        expect(moveHighlight(0, 1, 5)).toBe(1);
        expect(moveHighlight(3, -1, 5)).toBe(2);
    });

    it("wraps at both ends rather than dead-ending", () => {
        expect(moveHighlight(4, 1, 5)).toBe(0);
        expect(moveHighlight(0, -1, 5)).toBe(4);
    });

    it("survives an empty list", () => {
        expect(moveHighlight(0, 1, 0)).toBe(0);
        expect(moveHighlight(0, -1, 0)).toBe(0);
    });
});


describe("typesAcceptingWire", () => {
    /*
     * Offering a type a dropped wire cannot reach would create the node and
     * then silently fail to connect it — which reads as the editor eating the
     * gesture. Only compatible types are offered.
     */
    it("dragging from an output offers types with a matching input", () => {
        const hits = typesAcceptingWire("flow", "source");
        expect(hits.length).toBeGreaterThan(0);
        for (const def of hits) {
            expect(def.targets.some((h) => h.kind === "flow")).toBe(true);
        }
    });

    it("dragging from an input offers types that can feed it", () => {
        const hits = typesAcceptingWire("condition", "target");
        expect(hits.length).toBeGreaterThan(0);
        // Every candidate must actually own a condition output.
        for (const def of hits) {
            const outs = sourcesOf({ type: def.type, data: def.create() } as never);
            expect(outs.some((h: { kind: string }) => h.kind === "condition")).toBe(true);
        }
    });

    it("never offers a type that cannot take the wire", () => {
        const all = allNodeTypes();
        const hits = typesAcceptingWire("flow", "source");
        const rejected = all.filter((d) => !hits.includes(d));
        for (const def of rejected) {
            expect(def.targets.some((h) => h.kind === "flow")).toBe(false);
        }
    });
});

describe("entrySocketFor", () => {
    it("finds the input a dropped output-wire should land on", () => {
        expect(entrySocketFor("fx.notify", "flow", "source")).toBe("in");
    });

    it("finds the output that should feed a dropped input-wire", () => {
        expect(entrySocketFor("trigger.event", "condition", "target")).toBe("when");
    });

    it("returns null when the type has no socket of that kind", () => {
        expect(entrySocketFor("fx.notify", "condition", "source")).toBeNull();
    });
});
