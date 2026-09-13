/**
 * The Dry run dialog, smoke-tested: it opens, runs the harness against the
 * loaded project, and reports honestly. The harness itself is covered in
 * src/compiler/__tests__/simulate.test.ts — this is the shell around it.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { SimulatorDialog } from "@/editor/simulator/SimulatorDialog";
import { createProject } from "@/schema/project";
import { useEditor } from "@/store/editor";

beforeEach(() => {
    localStorage.clear();
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

describe("the dry run dialog", () => {
    it("opens, runs, and reports the quest", async () => {
        render(<SimulatorDialog open onOpenChange={() => {}} />);
        expect(screen.getByText("Dry run")).toBeInTheDocument();
        // The honesty caption is part of the product, not decoration.
        expect(screen.getByText(/simulates the editor's own runtime/)).toBeInTheDocument();
        // The auto-run finishes and the quest section appears.
        await waitFor(() => expect(screen.getByText("First Quest")).toBeInTheDocument());
        expect(screen.queryByText("would never tick")).not.toBeInTheDocument();
    });
});
