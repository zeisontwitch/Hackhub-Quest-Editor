/**
 * Apply React Flow selection deltas to the store's current selection.
 *
 * Pure and exported for tests because the ordering here is exactly the bug a
 * user will feel: clicking node B while A is selected arrives as *two* changes —
 * `deselect A`, `select B` — in one batch. If each change is computed from the
 * stale starting selection (rather than the running result) the pair collapses
 * into `[A, B]`, the inspector reads index 0, and the just-clicked node never
 * opens. Folding sequentially over the running result gives `[B]`.
 */

export interface SelectionDelta {
    type: string;
    /** Present on every select change; optional so React Flow's wider change
        union (add changes carry no id) still assigns to this. */
    id?: string;
    selected?: boolean;
}

/** Fold a batch of select changes onto the current node selection. */
export function nextSelection(current: string[], changes: SelectionDelta[]): string[] {
    let result = current;
    for (const change of changes) {
        if (change.type !== "select" || !change.id) continue;
        const id = change.id;
        result = change.selected
            ? [...new Set([...result, id])]
            : result.filter((existing) => existing !== id);
    }
    return result;
}

/** True when a batch of changes alters the selection at all. */
export function altersSelection(changes: SelectionDelta[]): boolean {
    return changes.some((c) => c.type === "select");
}

/**
 * True when a batch only ever *deselects*.
 *
 * A box drag makes React Flow emit node changes and edge changes as two
 * separate batches. Our node handler used to write `edgeIds: []` and the edge
 * handler `nodeIds: []`, so whichever batch arrived second wiped what the first
 * had just selected — the user drags a box around three nodes and ends up with
 * the wires between them selected instead.
 *
 * Telling the two apart needs no guesswork: a batch that *adds* something is
 * the user choosing that kind of thing, and may clear the other kind. A batch
 * that only clears is React Flow tidying up, and must leave the other kind
 * alone.
 */
export function onlyDeselects(changes: SelectionDelta[]): boolean {
    const selects = changes.filter((c) => c.type === "select");
    return selects.length > 0 && selects.every((c) => !c.selected);
}

/**
 * What a batch of selection changes should do to the store's selection.
 *
 * Extracted from the canvas so the rules can be tested without mounting React
 * Flow. `kind` is the sort of thing the batch is about; `boxSelecting` is true
 * while a selection box is open.
 */
export function resolveSelection(
    kind: "nodes" | "edges",
    current: { nodeIds: string[]; edgeIds: string[] },
    changes: SelectionDelta[],
    boxSelecting: boolean,
    /**
     * True while a multi-select modifier is held. React Flow calls
     * `resetSelectedElements()` when a box drag starts, with no modifier check,
     * so Shift+drag arrives as "deselect everything" followed by the new box's
     * picks. Holding the modifier means the user is adding to what they had.
     */
    additive = false,
): { nodeIds: string[]; edgeIds: string[] } | null {
    if (!altersSelection(changes)) return null;
    // React Flow sweeps up every wire touching a box-selected node. The user
    // was pointing at nodes, so those edge changes are ignored outright.
    if (kind === "edges" && boxSelecting) return null;
    const tidyUp = onlyDeselects(changes);
    // Adding to a selection: keep what was there and ignore the wholesale
    // clear React Flow sends at the start of the drag.
    if (additive && tidyUp) return null;
    if (kind === "nodes") {
        return {
            nodeIds: nextSelection(current.nodeIds, changes),
            // Only wipe the other kind when the user actually picked something.
            edgeIds: tidyUp || additive ? current.edgeIds : [],
        };
    }
    return {
        nodeIds: tidyUp || additive ? current.nodeIds : [],
        edgeIds: nextSelection(current.edgeIds, changes),
    };
}
