/**
 * Group frame drag, as a pure state machine (r228).
 *
 * The frame moves as a unit with everything whose centre sits inside it
 * *when the drag begins* — the "layer 1" behaviour: for the duration of the
 * drag the group is above the rest of the canvas, and nothing on the base
 * layer moves with it. Membership is frozen at start; the old code re-tested
 * containment on every pointermove, so the frame's edge captured any node it
 * swept past mid-drag and dragged it along.
 *
 * Members include nested group frames: with folders-inside-folders (r228) a
 * parent frame must carry its sub-frame, or the drag would leave it behind.
 * A nested frame keeps its own grip and its own frozen set, so it can also be
 * moved on its own — move the sub-folder, or the parent and it comes along.
 *
 * QuestCanvas' onNodeDrag* handlers are one-line wrappers over these; the
 * live drag state lives in a ref there.
 */
import type { NodeDoc } from "@/schema/nodes";
import type { Position } from "@/schema/common";

export interface Size {
    width: number;
    height: number;
}

/**
 * Edge padding a new group frame keeps around the selection it wraps
 * (r228, approved value). 32 clears the frame's ~28px title bar, so a
 * grouped node never sits under the grip.
 */
export const PAD_EDGE = 32;

/**
 * Top padding (r229): double the bottom pad, because the frame's title bar
 * sits inside the top band — 64 leaves the bar plus the same 32 px of
 * breathing room the other edges get.
 */
export const PAD_TOP = PAD_EDGE * 2;

/** The resizer's minimums (GraphNode's NodeResizer) — a new frame never
    starts smaller than the author could drag it to. */
export const FRAME_MIN_W = 160;
export const FRAME_MIN_H = 120;

/** The live state of a frame drag, kept in a ref by QuestCanvas. */
export interface GroupDrag {
    id: string;
    /** The frame position the drag began at; the delta grows from here. */
    x: number;
    y: number;
    /** Every node (nested frames included) whose centre was inside the frame
        at drag start. Frozen for the whole drag. */
    members: string[];
}

/**
 * Begin a frame's unit drag, or null when the dragged node is not a frame.
 * Freezes membership at this instant — the layer-1 snapshot.
 */
export function beginGroupDrag(
    node: NodeDoc,
    position: Position,
    nodes: NodeDoc[],
    sizeOf: (n: NodeDoc) => Size,
): GroupDrag | null {
    if (node.type !== "layout.group") return null;
    const frame = sizeOf(node);
    const x1 = position.x + frame.width;
    const y1 = position.y + frame.height;
    const members = nodes
        .filter((n) => n.id !== node.id)
        .filter((n) => {
            const s = sizeOf(n);
            const cx = n.position.x + s.width / 2;
            const cy = n.position.y + s.height / 2;
            return cx >= position.x && cx <= x1 && cy >= position.y && cy <= y1;
        })
        .map((n) => n.id);
    return { id: node.id, x: position.x, y: position.y, members };
}

/**
 * Apply the frame's movement to the frozen member list. Returns the position
 * patch for the member nodes, or null when the frame has not moved (yet).
 * The caller updates `drag.x` / `drag.y` with the new frame position.
 */
export function stepGroupDrag(
    drag: GroupDrag,
    framePosition: Position,
    nodes: NodeDoc[],
): Record<string, Position> | null {
    const dx = framePosition.x - drag.x;
    const dy = framePosition.y - drag.y;
    if (dx === 0 && dy === 0) return null;
    const members = new Set(drag.members);
    const moves: Record<string, Position> = {};
    for (const n of nodes) {
        if (!members.has(n.id)) continue;
        moves[n.id] = { x: n.position.x + dx, y: n.position.y + dy };
    }
    return Object.keys(moves).length > 0 ? moves : null;
}

/**
 * The rect a new group frame gets when `nodes` are grouped (Ctrl+G, r228):
 * the selection's bounding box plus PAD_EDGE (top: PAD_TOP, for the title
 * bar), clamped to the resizer minimums, integer output. `nodes` includes
 * any group frames in the selection — the new folder carries them as
 * members.
 */
export function frameAround(
    nodes: NodeDoc[],
    sizeOf: (n: NodeDoc) => Size,
): { x: number; y: number; w: number; h: number } {
    if (nodes.length === 0) return { x: 0, y: 0, w: FRAME_MIN_W, h: FRAME_MIN_H };
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const n of nodes) {
        const s = sizeOf(n);
        x0 = Math.min(x0, n.position.x);
        y0 = Math.min(y0, n.position.y);
        x1 = Math.max(x1, n.position.x + s.width);
        y1 = Math.max(y1, n.position.y + s.height);
    }
    const w = Math.max(FRAME_MIN_W, Math.round(x1 - x0 + PAD_EDGE * 2));
    const h = Math.max(FRAME_MIN_H, Math.round(y1 - y0 + PAD_TOP + PAD_EDGE));
    return { x: Math.round(x0 - PAD_EDGE), y: Math.round(y0 - PAD_TOP), w, h };
}
