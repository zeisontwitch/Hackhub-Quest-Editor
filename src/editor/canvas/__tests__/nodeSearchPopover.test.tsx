/**
 * The node-search popover, driven through the real UI.
 *
 * Uses real events via userEvent — no synthetic internals — because the whole
 * lesson of r93-r100 is that a test which reaches past the interface proves
 * nothing about the interface.
 *
 * Two things here are deliberately NOT asserted, because jsdom cannot judge
 * them honestly: on-screen placement near a window edge (jsdom has no layout)
 * and scroll-into-view of the highlighted row. Both are on the list for Zeis
 * to check in the preview.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { createProject } from "@/schema/project";
import { useEditor } from "@/store/editor";

const quest = () => useEditor.getState().project.quests[0];
const nodeCount = () => quest().graph.nodes.length;

beforeEach(() => {
    localStorage.clear();
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

/** Right-click the canvas pane the way a user would. */
async function openSearch() {
    render(<App />);
    await waitFor(() => expect(document.querySelector(".react-flow__pane")).toBeTruthy());
    const pane = document.querySelector(".react-flow__pane") as HTMLElement;
    const opts = { bubbles: true, clientX: 400, clientY: 300, button: 2 };
    act(() => {
        pane.dispatchEvent(new MouseEvent("pointerdown", opts));
        pane.dispatchEvent(new MouseEvent("pointerup", opts));
    });
    return { pane, user: userEvent.setup() };
}

const popover = () => screen.queryByRole("dialog", { name: "Add a node" });

/**
 * Options *inside the popover*. Scoped deliberately: an unrelated <select>
 * elsewhere in the editor also exposes role="option", and an unscoped query
 * picks those up.
 */
const options = () => {
    const list = document.getElementById("qe-node-search-list");
    return list ? [...list.querySelectorAll('[role="option"]')] : [];
};

describe("opening and closing", () => {
    it("opens on a right-click on empty canvas", async () => {
        await openSearch();
        await waitFor(() => expect(popover()).toBeTruthy());
    });

    it("focuses the input so the author can type straight away", async () => {
        await openSearch();
        await waitFor(() =>
            expect(document.activeElement).toBe(screen.getByLabelText("Search node types")),
        );
    });

    it("does NOT open when the right button was dragged (that is a pan)", async () => {
        render(<App />);
        await waitFor(() => expect(document.querySelector(".react-flow__pane")).toBeTruthy());
        const pane = document.querySelector(".react-flow__pane") as HTMLElement;
        act(() => {
            pane.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientX: 400, clientY: 300, button: 2 }));
            // Well beyond the slop threshold.
            pane.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientX: 520, clientY: 380, button: 2 }));
        });
        expect(popover()).toBeNull();
    });

    it("closes on Escape without clearing the canvas selection", async () => {
        // Escape is also a global "deselect everything" shortcut; dismissing
        // the search must not throw the author's selection away too.
        const id = useEditor.getState().addNode("fx.notify", { x: 0, y: 0 })!;
        const { user } = await openSearch();
        act(() => useEditor.getState().select({ nodeIds: [id], edgeIds: [] }));
        await waitFor(() => expect(popover()).toBeTruthy());
        await user.keyboard("{Escape}");
        await waitFor(() => expect(popover()).toBeNull());
        expect(useEditor.getState().selection.nodeIds).toEqual([id]);
    });

    it("adds nothing when dismissed", async () => {
        const before = nodeCount();
        const { user } = await openSearch();
        await user.keyboard("{Escape}");
        expect(nodeCount()).toBe(before);
    });
});

describe("searching and adding", () => {
    it("filters as the author types, with no separate search step", async () => {
        const { user } = await openSearch();
        await user.keyboard("dialogue");
        await waitFor(() => {
            expect(options().length).toBeGreaterThan(0);
            expect(options()[0].textContent).toMatch(/dialogue/i);
        });
    });

    it("adds the highlighted node on Enter", async () => {
        const before = nodeCount();
        const { user } = await openSearch();
        await user.keyboard("dialogue");
        await waitFor(() => expect(options().length).toBeGreaterThan(0));
        await user.keyboard("{Enter}");
        await waitFor(() => expect(nodeCount()).toBe(before + 1));
        expect(quest().graph.nodes.at(-1)!.type).toBe("comms.dialogue");
    });

    it("closes after adding", async () => {
        const { user } = await openSearch();
        await user.keyboard("dialogue{Enter}");
        await waitFor(() => expect(popover()).toBeNull());
    });

    it("adds the node the author clicked", async () => {
        const before = nodeCount();
        const { user } = await openSearch();
        await user.keyboard("dialogue");
        await waitFor(() => expect(options().length).toBeGreaterThan(0));
        await user.click(options()[0] as HTMLElement);
        await waitFor(() => expect(nodeCount()).toBe(before + 1));
    });

    it("moves the highlight with the arrow keys", async () => {
        const { user } = await openSearch();
        await waitFor(() => expect(options().length).toBeGreaterThan(1));
        expect(options()[0].getAttribute("aria-selected")).toBe("true");
        await user.keyboard("{ArrowDown}");
        await waitFor(() => {
            expect(options()[0].getAttribute("aria-selected")).toBe("false");
            expect(options()[1].getAttribute("aria-selected")).toBe("true");
        });
    });

    it("says so plainly when nothing matches", async () => {
        const { user } = await openSearch();
        await user.keyboard("zzzzzzz");
        await waitFor(() => expect(screen.getByText(/no nodes match/i)).toBeTruthy());
        expect(options()).toHaveLength(0);
    });

    it("adds nothing on Enter when there are no matches", async () => {
        const before = nodeCount();
        const { user } = await openSearch();
        await user.keyboard("zzzzzzz{Enter}");
        expect(nodeCount()).toBe(before);
    });
});

describe("it does not break the editor's other keys", () => {
    it("Backspace in the search box does not delete the selected node", async () => {
        // Destructive if wrong: the global Delete/Backspace shortcut removes
        // selected nodes, and an author clearing their query would lose work.
        const id = useEditor.getState().addNode("fx.notify", { x: 0, y: 0 })!;
        const { user } = await openSearch();
        act(() => useEditor.getState().select({ nodeIds: [id], edgeIds: [] }));
        await user.keyboard("ab{Backspace}{Backspace}{Backspace}");
        expect(quest().graph.nodes.some((n) => n.id === id)).toBe(true);
    });
});
