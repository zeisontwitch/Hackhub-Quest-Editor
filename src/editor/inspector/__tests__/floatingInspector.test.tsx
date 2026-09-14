/**
 * The floating inspector, from the shell (r158).
 *
 * The pure layout maths lives in drawerLayout.test.ts; this exercises the wiring
 * — the "Float inspector" control pops it out, the drawer carries the same
 * inspector, and "Dock inspector" snaps it back. jsdom has no layout, so the
 * drag/resize *pixels* are tested on the pure module; here we prove the mode
 * flips and the right frame renders.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { useEditor } from "@/store/editor";
import { createProject } from "@/schema/project";
import { inspectorMode, resetInspectorLayout } from "@/editor/inspector/drawerLayout";

beforeEach(() => {
    localStorage.clear();
    resetInspectorLayout();
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

afterEach(() => {
    localStorage.clear();
    resetInspectorLayout();
});

describe("floating inspector", () => {
    it("starts docked — the shipped default", () => {
        render(<App />);
        expect(inspectorMode()).toBe("docked");
        // Docked: the float control is offered.
        expect(screen.getByRole("button", { name: "Float inspector" })).toBeInTheDocument();
    });

    it("floats when the float control is clicked, and can dock again", async () => {
        const user = userEvent.setup();
        render(<App />);

        await user.click(screen.getByRole("button", { name: "Float inspector" }));
        expect(inspectorMode()).toBe("floating");
        // The dock control appears on the floating drawer.
        const dock = screen.getByRole("button", { name: "Dock inspector" });
        expect(dock).toBeInTheDocument();
        // The drawer carries a resize handle.
        expect(screen.getByRole("button", { name: "Resize inspector" })).toBeInTheDocument();

        await user.click(dock);
        expect(inspectorMode()).toBe("docked");
        expect(screen.getByRole("button", { name: "Float inspector" })).toBeInTheDocument();
    });

    it("keeps exactly one Inspector region in either mode", async () => {
        const user = userEvent.setup();
        render(<App />);
        expect(screen.getAllByRole("complementary", { name: "Inspector" })).toHaveLength(1);
        await user.click(screen.getByRole("button", { name: "Float inspector" }));
        expect(screen.getAllByRole("complementary", { name: "Inspector" })).toHaveLength(1);
    });
});
