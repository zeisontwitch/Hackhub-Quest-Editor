/**
 * Grid snapping and alignment for the canvas.
 *
 * All pure functions over positions: no React, no DOM, no store. The canvas
 * calls these and hands the result to `setNodePositions` in one write, which
 * matters for performance — a per-node update would re-render the graph once
 * per node (see the r42/r44 history in wireMotion.ts for what that costs).
 */

export interface XY {
    x: number;
    y: number;
}

/** A node plus its measured size, when the canvas has measured it. */
export interface SizedNode {
    id: string;
    position: XY;
    size?: { width: number; height: number };
    /** Present when the canvas spreads a full NodeDoc (needed to tell group
        frames apart — r231). */
    type?: string;
}

/** Spacing of the snap grid, in flow units. Matches the canvas dot pattern. */
export const GRID = 22;

/** Round one position onto the grid. */
export function snapPoint(p: XY, grid = GRID): XY {
    // `+ 0` normalises -0, which Math.round produces for small negatives and
    // which compares unequal to 0 in deep-equality checks (and serialises as
    // "-0" in the saved project).
    return {
        x: Math.round(p.x / grid) * grid + 0,
        y: Math.round(p.y / grid) * grid + 0,
    };
}

/**
 * Which way to line nodes up.
 *
 * The names describe the resulting arrangement, not the axis being changed:
 * "row" puts the nodes in a horizontal row (a shared y), "column" stacks them
 * in a vertical column (a shared x). Saying "align horizontally" is ambiguous
 * about which of those it means, so we do not use it.
 */
export type AlignAxis = "row" | "column";

/**
 * Line up the given nodes.
 *
 * Nodes move onto the average of their current positions on the axis being
 * aligned, so the group stays where the author put it instead of jumping to
 * whichever node happens to be first or topmost. Their spread along the other
 * axis is untouched.
 *
 * Returns only the nodes that actually move, so an alignment that changes
 * nothing writes nothing.
 */
export function alignPositions(
    nodes: SizedNode[],
    axis: AlignAxis,
    /**
     * Grid to snap the shared line to, if snapping is on. The LINE is snapped
     * once, not each card afterwards: snapping every corner independently
     * pushes cards of different sizes back off the line, which is what made
     * r97's centring look like it had not worked at all (r98).
     */
    grid = 0,
): Record<string, XY> {
    if (nodes.length < 2) return {};
    const key = axis === "row" ? "y" : "x";
    const extent = axis === "row" ? "height" : "width";
    const sizeOf = (n: SizedNode) => n.size?.[extent] ?? 0;
    /*
     * Align to the centre of the selection's bounding box, which is what
     * Photoshop's "Align Vertical/Horizontal Centers" does: every item's centre
     * moves to the collective centre. Averaging the individual centres instead
     * would let a cluster of small cards drag the line towards itself.
     */
    const starts = nodes.map((n) => n.position[key]);
    const ends = nodes.map((n) => n.position[key] + sizeOf(n));
    let line = (Math.min(...starts) + Math.max(...ends)) / 2;
    if (grid > 0) line = Math.round(line / grid) * grid;

    /*
     * Round the LINE, not each card's offset from it. Rounding per card leaves
     * an odd-width card half a pixel off a fractional line, so two cards that
     * should share a centre end up 0.5 apart — visible as a hairline kink in
     * the wire between them.
     */
    line = Math.round(line);
    const moved: Record<string, XY> = {};
    for (const n of nodes) {
        /*
         * Positions stay whole pixels, so a card of odd size lands half a pixel
         * off the shared line — unavoidable without fractional coordinates in
         * the saved project, and invisible at any zoom. Rounding here (rather
         * than rounding the line per card) keeps every card within half a pixel
         * of the same line instead of letting the error accumulate.
         */
        const target = Math.round(line - sizeOf(n) / 2) + 0;
        if (n.position[key] === target) continue;
        moved[n.id] = { ...n.position, [key]: target };
    }
    return moved;
}

/**
 * Spread the given nodes so the GAPS between them are equal.
 *
 * Photoshop separates "Distribute Horizontally" (equal gaps) from "Distribute
 * Horizontal Centers" (equal centre spacing); with items of differing sizes
 * only the former looks evenly spaced, so that is what "Even" does here. The
 * outermost nodes never move, so the group keeps its extent.
 */
export function distributePositions(
    nodes: SizedNode[],
    axis: AlignAxis,
): Record<string, XY> {
    if (nodes.length < 3) return {};
    const key = axis === "row" ? "x" : "y";
    const extent = axis === "row" ? "width" : "height";
    const sizeOf = (n: SizedNode) => n.size?.[extent] ?? 0;
    const sorted = [...nodes].sort((a, b) => a.position[key] - b.position[key]);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const span = last.position[key] - (first.position[key] + sizeOf(first));
    const inner = sorted.slice(1, -1);
    const totalInner = inner.reduce((sum, n) => sum + sizeOf(n), 0);
    // One gap between each neighbouring pair.
    const gap = (span - totalInner) / (sorted.length - 1);

    const moved: Record<string, XY> = {};
    let cursor = first.position[key] + sizeOf(first) + gap;
    for (const n of inner) {
        const target = Math.round(cursor) + 0;
        if (n.position[key] !== target) moved[n.id] = { ...n.position, [key]: target };
        cursor += sizeOf(n) + gap;
    }
    return moved;
}

/** Snap many nodes at once, returning only those that actually move. */
export function snapPositions(
    nodes: { id: string; position: XY }[],
    grid = GRID,
): Record<string, XY> {
    const moved: Record<string, XY> = {};
    for (const n of nodes) {
        const next = snapPoint(n.position, grid);
        if (next.x === n.position.x && next.y === n.position.y) continue;
        moved[n.id] = next;
    }
    return moved;
}

/**
 * Carry a group frame's unselected contents with it (r231).
 *
 * Aligning and distributing move the SELECTED boxes to their new slots. A
 * group frame is a box that other nodes sit inside, so when it moves to a
 * slot its contents must follow — otherwise the frame is left carrying an
 * empty border (the same hole the group drag had before the r228 freeze:
 * the frame moved, the contents stayed).
 *
 * Rule: an unselected node moves by the delta of the INNERMOST selected
 * frame that contains its centre, measured against the frame's ORIGINAL
 * rect (the freeze-at-start rule from beginGroupDrag). Innermost, because a
 * node inside two selected frames (parent and child) belongs to the child —
 * the box that defined where it ends up. A selected node is never carried:
 * it has its own slot in `moved`.
 *
 * Returns only the nodes that actually move, so an arrange that moves no
 * contents writes nothing.
 */
export function carryFrameContents(
    allNodes: SizedNode[],
    selected: ReadonlySet<string>,
    moved: Record<string, XY>,
): Record<string, XY> {
    const frames = allNodes.filter(
        (f) => f.type === "layout.group" && selected.has(f.id) && moved[f.id] !== undefined,
    );
    if (frames.length === 0) return {};
    const centre = (n: SizedNode): XY => ({
        x: n.position.x + (n.size?.width ?? 0) / 2,
        y: n.position.y + (n.size?.height ?? 0) / 2,
    });
    const contains = (f: SizedNode, c: XY): boolean => {
        const w = f.size?.width ?? 0;
        const h = f.size?.height ?? 0;
        return (
            c.x >= f.position.x &&
            c.x <= f.position.x + w &&
            c.y >= f.position.y &&
            c.y <= f.position.y + h
        );
    };
    const area = (f: SizedNode) => (f.size?.width ?? 0) * (f.size?.height ?? 0);
    const carried: Record<string, XY> = {};
    for (const n of allNodes) {
        if (selected.has(n.id)) continue; // it has its own slot
        const c = centre(n);
        let innermost: SizedNode | undefined;
        for (const f of frames) {
            if (!contains(f, c)) continue;
            if (!innermost || area(f) < area(innermost)) innermost = f;
        }
        if (!innermost) continue;
        const target = {
            x: n.position.x + (moved[innermost.id]!.x - innermost.position.x) + 0,
            y: n.position.y + (moved[innermost.id]!.y - innermost.position.y) + 0,
        };
        if (target.x === n.position.x && target.y === n.position.y) continue;
        carried[n.id] = target;
    }
    return carried;
}
