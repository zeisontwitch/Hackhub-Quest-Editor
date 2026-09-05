/**
 * The Springy/Plain wires toggle.
 *
 * Requested by Zeis: some authors will not want physics, some machines will
 * not enjoy it, and some people simply prefer the plain wires. It has to be as
 * easy to refuse as the animation toggle beside it.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { createProject } from "@/schema/project";
import { useEditor } from "@/store/editor";
import { resetWirePhysicsForTests, wirePhysicsEnabled } from "@/editor/canvas/wirePhysicsPref";

beforeEach(() => {
    localStorage.clear();
    resetWirePhysicsForTests();
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

/* Both wire buttons match /wires/, so name the one under test. */
const toggle = () => screen.getByRole("button", { name: "Springy wires", pressed: true });

async function mount() {
    render(<App />);
    await waitFor(() => expect(document.querySelector(".react-flow")).toBeTruthy());
    return userEvent.setup();
}

describe("the wire physics toggle", () => {
    it("sits in the canvas toolbar", async () => {
        await mount();
        expect(screen.getByText("Springy wires")).toBeTruthy();
    });

    it("is on by default — the nicer behaviour, refusable", async () => {
        await mount();
        expect(wirePhysicsEnabled()).toBe(true);
    });

    it("switches to plain wires and remembers the choice", async () => {
        const user = await mount();
        await user.click(screen.getByText("Springy wires"));
        await waitFor(() => expect(screen.getByText("Plain wires")).toBeTruthy());
        expect(wirePhysicsEnabled()).toBe(false);
        expect(localStorage.getItem("qe.wirePhysics")).toBe("off");
    });

    it("switches back again", async () => {
        const user = await mount();
        await user.click(screen.getByText("Springy wires"));
        await waitFor(() => expect(screen.getByText("Plain wires")).toBeTruthy());
        await user.click(screen.getByText("Plain wires"));
        await waitFor(() => expect(screen.getByText("Springy wires")).toBeTruthy());
        expect(wirePhysicsEnabled()).toBe(true);
    });

    it("never touches the project document", async () => {
        // A view preference must not be exported, or land in the undo history.
        const user = await mount();
        const before = JSON.stringify(useEditor.getState().project);
        await user.click(screen.getByText("Springy wires"));
        await waitFor(() => expect(screen.getByText("Plain wires")).toBeTruthy());
        expect(JSON.stringify(useEditor.getState().project)).toBe(before);
    });

    it("is separate from the animation toggle", async () => {
        // Different questions: drifting dots on resting wires versus a
        // dragged wire hanging. Refusing one must not refuse the other.
        const user = await mount();
        await user.click(screen.getByText("Springy wires"));
        await waitFor(() => expect(screen.getByText("Plain wires")).toBeTruthy());
        expect(screen.getByText("Animated wires")).toBeTruthy();
    });

    it("says which it is, for a screen reader too", async () => {
        await mount();
        expect(toggle()).toBeTruthy();
    });
});
