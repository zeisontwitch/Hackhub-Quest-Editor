/**
 * Helpers for the two "just do the obvious thing" wiring gestures:
 *
 *  - drop a wire on a node's body (not its socket) and it lands on that node's
 *    only matching input;
 *  - drop it on nothing and the wire is gone.
 *
 * They live outside the canvas component because the interesting part is the
 * decision, not the React plumbing, and a decision can be tested.
 */
import { nodeTypeDef, sourcesOf } from "@/schema/registry";
import type { NodeDoc } from "@/schema/nodes";
import type { EdgeDoc } from "@/schema/edges";

/**
 * The single wire arriving at one input, or null when there is none — or more
 * than one, in which case pulling on the socket cannot mean one wire in
 * particular, so nothing is picked up.
 */
export function soleEdgeInto(
    edges: EdgeDoc[],
    nodeId: string,
    handleId: string,
): EdgeDoc | null {
    const hits = edges.filter((e) => e.target === nodeId && e.targetHandle === handleId);
    return hits.length === 1 ? hits[0] : null;
}

/**
 * The kind of wire a socket carries, or null when the socket is unknown.
 */
export function kindOfHandle(
    node: NodeDoc,
    handleId: string,
    side: "source" | "target",
): string | null {
    const list = side === "source" ? sourcesOf(node) : nodeTypeDef(node.type).targets;
    return list.find((h) => h.id === handleId)?.kind ?? null;
}

/**
 * The one output on `target` that could feed a wire arriving at `targetHandle`,
 * mirror image of `soleMatchingInput` — used when the author pulls a wire out
 * of an input and drops it on the body of the node that should feed it.
 */
export function soleMatchingOutput(
    target: NodeDoc,
    into: NodeDoc,
    targetHandle: string,
): string | null {
    if (target.id === into.id) return null;
    const kind = kindOfHandle(into, targetHandle, "target");
    if (!kind) return null;
    const outputs = sourcesOf(target).filter((h) => h.kind === kind);
    return outputs.length === 1 ? outputs[0].id : null;
}

/**
 * The one input on `target` that a wire leaving `sourceHandle` could plug into,
 * or null when there is no such input — or more than one, in which case only
 * the author knows which they meant, so the gesture does nothing.
 */
export function soleMatchingInput(
    source: NodeDoc,
    sourceHandle: string,
    target: NodeDoc,
): string | null {
    if (source.id === target.id) return null;
    const kind = sourcesOf(source).find((h) => h.id === sourceHandle)?.kind;
    if (!kind) return null;
    const inputs = nodeTypeDef(target.type).targets.filter((h) => h.kind === kind);
    return inputs.length === 1 ? inputs[0].id : null;
}

/**
 * Which node is under the pointer when a wire is dropped? React Flow only
 * reports `toNode` while the pointer is over a node's own DOM, and the
 * connection line can cover it; asking the document is the reliable answer and
 * costs one hit test per drop.
 */
export function nodeIdUnderPointer(event: MouseEvent | TouchEvent): string | null {
    const point =
        "changedTouches" in event && event.changedTouches?.length
            ? event.changedTouches[0]
            : (event as MouseEvent);
    if (typeof document === "undefined" || typeof document.elementFromPoint !== "function") {
        return null;
    }
    const el = document.elementFromPoint(point.clientX, point.clientY);
    const nodeEl = el?.closest?.(".react-flow__node") as HTMLElement | null;
    return nodeEl?.dataset.id ?? null;
}

/** A wire the author is carrying: the edge, and the input it was pulled out of. */
export interface HeldWire {
    edge: EdgeDoc;
    nodeId: string;
}

/**
 * What should happen when a carried wire is let go.
 *
 * The rule that matters: the end still in the graph is the one the wire came
 * FROM. Pull a wire out of node 2 and it hangs off node 1; drop it on node 3
 * and the answer is 1 → 3, never 2 → 3.
 */
export type HeldDrop =
    | { action: "delete" }
    | { action: "restore" }
    | { action: "connect"; source: string; sourceHandle: string; target: string; targetHandle: string };

export function decideHeldDrop(
    held: HeldWire,
    dropNodeId: string | null,
    explicitHandle: string | null,
    nodes: NodeDoc[],
): HeldDrop {
    // Let go over empty canvas (or Escape): the wire is unplugged for good.
    if (!dropNodeId) return { action: "delete" };
    // Let go back where it was picked up: nothing was meant by that.
    if (dropNodeId === held.nodeId) return { action: "restore" };

    const from = nodes.find((n) => n.id === held.edge.source);
    const to = nodes.find((n) => n.id === dropNodeId);
    if (!from || !to || to.id === from.id) return { action: "restore" };

    const targetHandle = explicitHandle ?? soleMatchingInput(from, held.edge.sourceHandle, to);
    if (!targetHandle) return { action: "restore" };
    return {
        action: "connect",
        source: held.edge.source,
        sourceHandle: held.edge.sourceHandle,
        target: dropNodeId,
        targetHandle,
    };
}


/**
 * The edges plugged into one socket.
 *
 * Used by ctrl+click on a socket, which unplugs whatever is attached. An input
 * normally holds a single wire and an output can fan out to several, so this
 * returns every match rather than assuming one.
 */
export function edgesAtHandle(
    edges: EdgeDoc[],
    nodeId: string,
    handleId: string,
    side: "source" | "target",
): EdgeDoc[] {
    return edges.filter((e) =>
        side === "source"
            ? e.source === nodeId && e.sourceHandle === handleId
            : e.target === nodeId && e.targetHandle === handleId,
    );
}
