/**
 * The reported bug, encoded: clicking node B while A is selected delivers the
 * pair [deselect A, select B] in one batch. Folding over the stale starting
 * selection (the old bug) yields [A, B] and the inspector never opens B. Folding
 * sequentially yields [B].
 */
import { describe, expect, it } from "vitest";
import { altersSelection, nextSelection, onlyDeselects, resolveSelection } from "@/editor/canvas/applyChanges";

describe("nextSelection", () => {
    it("switches to a newly clicked node, dropping the previous one", () => {
        const changes = [
            { type: "select", id: "a", selected: false },
            { type: "select", id: "b", selected: true },
        ];
        expect(nextSelection(["a"], changes)).toEqual(["b"]);
    });

    it("works when the changes arrive in the opposite order", () => {
        const changes = [
            { type: "select", id: "b", selected: true },
            { type: "select", id: "a", selected: false },
        ];
        expect(nextSelection(["a"], changes)).toEqual(["b"]);
    });

    it("adds to the selection with a modifier held", () => {
        const changes = [{ type: "select", id: "b", selected: true }];
        expect(nextSelection(["a"], changes)).toEqual(["a", "b"]);
    });

    it("clears when the only selected node is deselected", () => {
        expect(nextSelection(["a"], [{ type: "select", id: "a", selected: false }])).toEqual([]);
    });

    it("ignores non-select changes and changes without an id", () => {
        const changes = [
            { type: "position", id: "a" },
            { type: "select", selected: true },
            { type: "add" as string, id: "c" },
        ];
        expect(nextSelection(["a"], changes)).toEqual(["a"]);
    });

    it("does not duplicate an id that is re-selected", () => {
        const changes = [
            { type: "select", id: "a", selected: false },
            { type: "select", id: "a", selected: true },
        ];
        expect(nextSelection(["a"], changes)).toEqual(["a"]);
    });
});

describe("altersSelection", () => {
    it("is true only when a select change is present", () => {
        expect(altersSelection([{ type: "select", id: "a", selected: true }])).toBe(true);
        expect(altersSelection([{ type: "position", id: "a" }])).toBe(false);
        expect(altersSelection([])).toBe(false);
    });
});

describe("onlyDeselects", () => {
    /* A box drag delivers node changes and edge changes as two batches. If the
       node batch clears edgeIds and the edge batch clears nodeIds, whichever
       lands second wins and the user gets the wrong thing selected. */
    it("is true for a batch that only clears", () => {
        expect(onlyDeselects([
            { type: "select", id: "e1", selected: false },
            { type: "select", id: "e2", selected: false },
        ])).toBe(true);
    });

    it("is false as soon as the batch selects something", () => {
        expect(onlyDeselects([
            { type: "select", id: "e1", selected: false },
            { type: "select", id: "e2", selected: true },
        ])).toBe(false);
    });

    it("is false for a batch with no select changes at all", () => {
        expect(onlyDeselects([{ type: "position", id: "a" }])).toBe(false);
        expect(onlyDeselects([])).toBe(false);
    });
});

describe("resolveSelection", () => {
    const sel = (nodeIds: string[], edgeIds: string[]) => ({ nodeIds, edgeIds });
    const pick = (id: string) => [{ type: "select", id, selected: true }];
    const drop = (id: string) => [{ type: "select", id, selected: false }];

    it("ignores wires swept up by a box drag (the reported bug)", () => {
        // Dragging a box round two nodes also selects the wire between them;
        // that edge batch must not touch the selection at all.
        expect(resolveSelection("edges", sel(["a", "b"], []), pick("e1"), true)).toBeNull();
    });

    it("still lets a wire be clicked when no box is open", () => {
        expect(resolveSelection("edges", sel(["a"], []), pick("e1"), false))
            .toEqual(sel([], ["e1"]));
    });

    it("does not let a tidy-up batch wipe the other kind", () => {
        // React Flow clears the old node selection as a separate batch; that
        // must not take a freshly clicked wire with it.
        expect(resolveSelection("nodes", sel(["a"], ["e1"]), drop("a"), false))
            .toEqual(sel([], ["e1"]));
        expect(resolveSelection("edges", sel(["a"], ["e1"]), drop("e1"), false))
            .toEqual(sel(["a"], []));
    });

    it("clears the other kind when the user really picks something", () => {
        expect(resolveSelection("nodes", sel([], ["e1"]), pick("a"), false))
            .toEqual(sel(["a"], []));
    });

    it("selects nodes normally during a box drag", () => {
        expect(resolveSelection("nodes", sel([], []), pick("a"), true))
            .toEqual(sel(["a"], []));
    });

    it("does nothing for a batch that changes no selection", () => {
        expect(resolveSelection("nodes", sel(["a"], []), [{ type: "position", id: "a" }], false))
            .toBeNull();
    });
});

describe("resolveSelection with a modifier held", () => {
    const sel = (nodeIds: string[], edgeIds: string[]) => ({ nodeIds, edgeIds });
    const pick = (id: string) => [{ type: "select", id, selected: true }];
    const drop = (id: string) => [{ type: "select", id, selected: false }];
    const clearAll = (...ids: string[]) =>
        ids.map((id) => ({ type: "select", id, selected: false }));

    it("keeps the existing nodes when shift+box-dragging more (reported)", () => {
        // React Flow calls resetSelectedElements() at the start of every box
        // drag with no modifier check, so the wholesale clear arrives first.
        expect(resolveSelection("nodes", sel(["a", "b"], []), clearAll("a", "b"), true, true))
            .toBeNull();
        // ...then the new box's picks fold onto what was already there.
        expect(resolveSelection("nodes", sel(["a", "b"], []), pick("c"), true, true))
            .toEqual(sel(["a", "b", "c"], []));
    });

    it("still clears the previous selection without a modifier", () => {
        expect(resolveSelection("nodes", sel(["a", "b"], []), clearAll("a", "b"), true, false))
            .toEqual(sel([], []));
    });

    it("removes a single node from the selection on ctrl+click", () => {
        // No box is open, so this clear-only batch is the user deselecting one
        // node - it must be applied, not swallowed as drag tidy-up.
        expect(resolveSelection("nodes", sel(["a", "b", "c"], []), drop("b"), false, true))
            .toEqual(sel(["a", "c"], []));
    });

    it("still ignores the drag-start clear when a box IS open", () => {
        expect(resolveSelection("nodes", sel(["a", "b"], []), clearAll("a", "b"), true, true))
            .toBeNull();
    });

    it("does not clear a wire selection while adding nodes", () => {
        expect(resolveSelection("nodes", sel([], ["e1"]), pick("a"), false, true))
            .toEqual(sel(["a"], ["e1"]));
    });
});
