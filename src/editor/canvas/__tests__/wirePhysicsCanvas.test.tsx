/**
 * The held wire, in the mounted canvas.
 *
 * This file exists because r107's unit tests all passed while the feature was
 * completely dead in a browser: the `<path>` carried a `d` prop, so React
 * rewrote it from the straight bezier on every pointer move and wiped whatever
 * the physics loop had written. Nothing simulated a re-render, so nothing
 * noticed.
 *
 * The rule these tests protect: **one writer owns the `d` attribute.** The ref
 * callback paints the first frame, the loop owns it afterwards, and React
 * never touches it.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const SOURCE = readFileSync("src/editor/canvas/QuestCanvas.tsx", "utf8");

/** The JSX for the held wire's path element. */
function heldWireJsx(): string {
    const start = SOURCE.indexOf("const ConnectionLine = useCallback");
    const end = SOURCE.indexOf("[getInternalNode]", start);
    return SOURCE.slice(start, end);
}

describe("the held wire has exactly one writer for `d`", () => {
    it("does not pass `d` as a React prop", () => {
        /*
         * The r107 bug, encoded. A `d` prop means React rewrites the attribute
         * on every re-render — and it re-renders on every pointer move — so
         * the physics is overwritten sixty times a second and the wire looks
         * static.
         */
        const jsx = heldWireJsx();
        expect(jsx).toContain("<path");
        expect(jsx).not.toMatch(/\bd=\{/);
    });

    it("paints the first frame from the ref instead", () => {
        // Without this the wire would be invisible until the loop's first tick,
        // and would never appear at all with physics switched off.
        expect(heldWireJsx()).toContain('el.setAttribute("d", path)');
    });

    it("starts the physics loop on that same element", () => {
        expect(heldWireJsx()).toContain("startWirePhysics({ path: el");
    });

    it("wakes the loop when the cursor moves", () => {
        // The loop parks itself on settle; the ref only fires on mount, so a
        // move is the only thing that can restart it.
        expect(heldWireJsx()).toContain("nudgeWirePhysics()");
    });
});

describe("the ghost waits for the node search", () => {
    it("holds the snap-back back when a drop opens the search", () => {
        // Zeis: the wire is pending, not cancelled — fading it while the
        // author is still choosing would be wrong.
        expect(SOURCE).toContain("pendingGhost.current = ghostTheWire;");
    });

    it("plays it if the search is dismissed", () => {
        const close = SOURCE.slice(SOURCE.indexOf("const closeSearch = useCallback"));
        expect(close.slice(0, 400)).toContain("pendingGhost.current?.()");
    });

    it("discards it once a node is chosen", () => {
        const add = SOURCE.slice(SOURCE.indexOf("const addFromSearch = useCallback"));
        expect(add.slice(0, 2000)).toContain("pendingGhost.current = null;");
    });
});
