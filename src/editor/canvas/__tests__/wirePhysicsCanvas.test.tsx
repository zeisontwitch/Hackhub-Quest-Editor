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

/** The ref callback that owns the held wire's element. */
function attachFn(): string {
    const start = SOURCE.indexOf("const attachHeldWire = useCallback");
    return SOURCE.slice(start, SOURCE.indexOf("}, []);", start));
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
        expect(attachFn()).toContain('el.setAttribute("d"');
    });

    it("starts the physics loop on that same element", () => {
        expect(attachFn()).toContain("startWirePhysics({ path: el");
    });

    it("uses a STABLE ref, not an inline arrow", () => {
        /*
         * The r109 bug. React re-runs a ref callback whose identity changed —
         * detaching with null, then re-attaching. An inline `ref={(el) => …}`
         * is a new function on every render, and `ConnectionLine` re-renders
         * on every pointer move, so the loop was restarted sixty times a
         * second and the spring reset to zero each time. The wire could never
         * accumulate any sag, which looked identical to the physics being off.
         */
        expect(heldWireJsx()).toContain("ref={attachHeldWire}");
        expect(heldWireJsx()).not.toMatch(/ref=\{\(el\)/);
        // ...and the callback itself must have no dependencies, or it would
        // change identity again whenever they did.
        expect(SOURCE).toContain("const attachHeldWire = useCallback((el: SVGPathElement | null) => {");
    });

    it("wakes the loop when the cursor moves", () => {
        // The loop parks itself on settle; the ref only fires on mount, so a
        // move is the only thing that can restart it.
        expect(heldWireJsx()).toContain("nudgeWirePhysics()");
    });
});

describe("the ghost plays on every ending", () => {
    /*
     * r111 reversed an r108 decision. I had deferred the snap-back while the
     * node search was open, on the theory that the wire was "pending" rather
     * than cancelled. But React Flow unmounts the connection line the moment
     * the pointer is released, so deferring meant the wire simply blinked out
     * — QA saw it vanish with no snap and no fade. The ghost is ~200ms, short
     * enough to play while the search is still opening.
     */
    it("plays the snap-back when a drop opens the search", () => {
        const end = SOURCE.slice(SOURCE.indexOf("const onConnectEnd = useCallback"));
        // Everything between opening the search and returning from the branch.
        const afterOpen = end.slice(end.indexOf("setSearchAt({ x: point.clientX"));
        const branch = afterOpen.slice(0, afterOpen.indexOf("return;"));
        expect(branch).toContain("ghostTheWire();");
    });

    it("keeps no deferred-ghost machinery", () => {
        // Dead state is a place for bugs to hide; the ref is gone entirely.
        expect(SOURCE).not.toContain("pendingGhost");
    });
});
