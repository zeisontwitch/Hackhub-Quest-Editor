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
    nodes: { id: string; position: XY }[],
    axis: AlignAxis,
): Record<string, XY> {
    if (nodes.length < 2) return {};
    const key = axis === "row" ? "y" : "x";
    const mean = nodes.reduce((sum, n) => sum + n.position[key], 0) / nodes.length;
    const target = Math.round(mean);
    const moved: Record<string, XY> = {};
    for (const n of nodes) {
        if (n.position[key] === target) continue;
        moved[n.id] = { ...n.position, [key]: target };
    }
    return moved;
}

/**
 * Spread the given nodes evenly between the two outermost, along one axis.
 *
 * Complements alignment: line up a row, then even out the gaps. The end nodes
 * never move, so the group keeps its extent.
 */
export function distributePositions(
    nodes: { id: string; position: XY }[],
    axis: AlignAxis,
): Record<string, XY> {
    if (nodes.length < 3) return {};
    const key = axis === "row" ? "x" : "y";
    const sorted = [...nodes].sort((a, b) => a.position[key] - b.position[key]);
    const first = sorted[0].position[key];
    const last = sorted[sorted.length - 1].position[key];
    const step = (last - first) / (sorted.length - 1);
    const moved: Record<string, XY> = {};
    sorted.forEach((n, i) => {
        const target = Math.round(first + step * i);
        if (n.position[key] === target) return;
        moved[n.id] = { ...n.position, [key]: target };
    });
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
