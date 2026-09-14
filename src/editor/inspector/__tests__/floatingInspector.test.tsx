/**
 * The floating inspector, from the shell (r158, handle added r159, drawer-pull
 * resize added r160).
 *
 * The pure layout maths lives in drawerLayout.test.ts; this exercises the wiring
 * — the left-edge "Float inspector" handle pops it out (click, or a long pull),
 * a short pull *widens* the docked panel, the drawer carries the same inspector,
 * and "Dock inspector" snaps it back. jsdom has no layout, so the drag/resize
 * *pixels* are tested on the pure module; here we prove the mode flips, the width
 * tracks, and the right frame renders.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { useEditor } from "@/store/editor";
import { createProject } from "@/schema/project";
import {
    DOCKED_WIDTH,
    inspectorDockedWidth,
    inspectorFloatRect,
    inspectorMode,
    resetInspectorLayout,
} from "@/editor/inspector/drawerLayout";

/** A pointer event jsdom understands (it has no PointerEvent constructor). */
function pointer(type: string, x: number, y: number): PointerEvent {
    const e = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }) as unknown as PointerEvent;
    (e as { pointerId?: number }).pointerId = 1;
    return e;
}

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

    it("widens the docked panel on a short pull — without floating it", () => {
        render(<App />);
        const handle = screen.getByRole("button", { name: "Float inspector" });

        // Press at the edge (~x 1240) and pull 120px left. That stays under the
        // widen ceiling (640 − 340 = 300px of headroom), so it must NOT float.
        act(() => handle.dispatchEvent(pointer("pointerdown", 1240, 300)));
        act(() => window.dispatchEvent(pointer("pointermove", 1120, 300)));
        act(() => window.dispatchEvent(pointer("pointerup", 1120, 300)));

        expect(inspectorMode()).toBe("docked");
        expect(inspectorDockedWidth()).toBe(DOCKED_WIDTH + 120);
    });

    it("floats and moves to the pointer when the handle is pulled past the ceiling", () => {
        render(<App />);
        const handle = screen.getByRole("button", { name: "Float inspector" });

        // Press, pull far past the widen ceiling (well over 300px), release.
        act(() => handle.dispatchEvent(pointer("pointerdown", 1200, 100)));
        act(() => window.dispatchEvent(pointer("pointermove", 700, 400)));
        act(() => window.dispatchEvent(pointer("pointerup", 700, 400)));

        expect(inspectorMode()).toBe("floating");
        // The drawer followed the pointer (offset by the grab point), clamped
        // on screen — so it is not left at its old rect.
        const rect = inspectorFloatRect();
        expect(rect.x).toBeLessThan(700);
        expect(rect.x).toBeGreaterThan(0);
    });
});
