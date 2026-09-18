/**
 * The inspector's multi-field rows must not clip their boxes.
 *
 * r183. The Timer's "In" row is the widest thing in the inspector: four unit
 * boxes, each a caption plus a number field, in a panel whose docked floor is
 * 340px. `columns: 4` used to mean an unconditional `grid-cols-4`, so the row
 * asked for roughly 28rem of panel and got 340px — the boxes ran off the right
 * edge, and the QA tester reported the migration fixtures as "broken" partly
 * because the row that proved the migration had worked was cut in half.
 *
 * jsdom cannot measure a box, so these tests assert the *shape* of the fix
 * (which is what can be asserted here) rather than pixels: the row declares a
 * container, folds below the width its captions need, and opens back up when
 * the panel is dragged wider. The visual confirmation is a screenshot pass —
 * see `docs/plans/r183-inspector-row-width.md`.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { Field } from "../Field";
import { nodeTypeDef } from "@/schema/registry";
import { useEditor } from "@/store/editor";
import { createProject } from "@/schema/project";

/** The Timer's "In" row and the "Wait" row: the two multi-box rows that exist. */
const rowDef = (key: string) => {
    const def = nodeTypeDef("flow.timer");
    const row = def?.fields.find((f) => f.kind === "row" && f.label === key);
    if (!row || row.kind !== "row") throw new Error(`no ${key} row`);
    return row;
};

beforeEach(() => {
    useEditor.getState().load(createProject(), { clearHistory: true });
});

function rowElement(key: string): HTMLElement {
    const addNode = useEditor.getState().addNode;
    const nodeId = addNode("flow.timer", { x: 0, y: 0 })!;
    expect(nodeId).toBeTruthy();
    /* The "In" row only exists in "A coming day" mode, the way the inspector
       shows it: a conditional row is not rendered at all in the other modes. */
    useEditor.getState().updateNodeData(nodeId, { mode: key === "In" ? "daytime" : "after" });
    const { container } = render(<Field def={rowDef(key)} nodeId={nodeId} />);
    /* The grid is the row's own wrapper, directly under the label. */
    return container.querySelector(".grid") as HTMLElement;
}

describe("inspector rows fold instead of clipping (r183)", () => {
    it("makes a four-box row a container and folds it below the width it needs", () => {
        const grid = rowElement("In");
        expect(grid).toBeTruthy();
        expect(grid.className).toContain("@container");
        /* Two columns first — the state every panel is at least 280px wide can
           hold — then four once the panel is dragged past 28rem. */
        expect(grid.className).toContain("grid-cols-2");
        expect(grid.className).toContain("@min-[28rem]:grid-cols-4");
        /* And specifically NOT an unconditional four columns, which is the bug:
           `grid-cols-4` must only ever appear behind the container variant. */
        expect(/(^|\s)grid-cols-4(\s|$)/.test(grid.className)).toBe(false);
    });

    it("folds the six-box Wait row only below the docked floor, keeping its shipped look", () => {
        const grid = rowElement("Wait");
        expect(grid.className).toContain("@container");
        expect(grid.className).toContain("@min-[21rem]:grid-cols-3");
        expect(/(^|\s)grid-cols-3(\s|$)/.test(grid.className)).toBe(false);
    });

    it("still renders every box in the row, folded or not", () => {
        rowElement("In");
        for (const label of ["Years", "Months", "Weeks", "Days"]) {
            expect(screen.getByLabelText(label), `${label} box is missing`).toBeTruthy();
        }
    });
});
