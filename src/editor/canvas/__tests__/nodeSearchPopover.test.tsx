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

describe("Shift+A", () => {
    /**
     * Untested in r102, and duly shipped broken: the handler required
     * `wrapperRef.contains(event.target)`, but with nothing focused a keydown
     * targets <body>, which is an ancestor of the canvas rather than a
     * descendant — so the guard rejected every press. "Over the canvas" has to
     * mean the pointer, not the focus.
     */
    /**
     * Move the pointer onto the canvas, the way a browser reports it:
     * pointerenter on crossing the boundary, then pointermove for position.
     * `inside: false` skips the enter, standing in for a pointer that is
     * somewhere else entirely.
     */
    async function mountAndPoint(x: number, y: number, inside = true) {
        render(<App />);
        await waitFor(() => expect(document.querySelector(".react-flow__pane")).toBeTruthy());
        const wrapper = document.querySelector(".react-flow")!.parentElement as HTMLElement;
        act(() => {
            /*
             * React derives onPointerEnter from `pointerover` carrying a
             * relatedTarget — dispatching a raw `pointerenter` reaches native
             * listeners but never the synthetic handler.
             */
            if (inside) {
                wrapper.dispatchEvent(
                    new MouseEvent("pointerover", { bubbles: true, relatedTarget: document.body }),
                );
            }
            wrapper.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: x, clientY: y }));
        });
        return userEvent.setup();
    }

    it("opens the search when the pointer is over the canvas", async () => {
        await mountAndPoint(400, 300);
        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "A", shiftKey: true, bubbles: true }));
        });
        await waitFor(() => expect(popover()).toBeTruthy());
    });

    it("adds a node, like the right-click route", async () => {
        const before = nodeCount();
        const user = await mountAndPoint(400, 300);
        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "A", shiftKey: true, bubbles: true }));
        });
        await waitFor(() => expect(popover()).toBeTruthy());
        await user.keyboard("dialogue{Enter}");
        await waitFor(() => expect(nodeCount()).toBe(before + 1));
    });

    it("stays out of the way when the pointer is off the canvas", async () => {
        await mountAndPoint(5000, 5000, false);
        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "A", shiftKey: true, bubbles: true }));
        });
        expect(popover()).toBeNull();
    });

    it("stops firing once the pointer leaves the canvas", async () => {
        await mountAndPoint(400, 300);
        const wrapper = document.querySelector(".react-flow")!.parentElement as HTMLElement;
        // Likewise, onPointerLeave comes from `pointerout` leaving the subtree.
        act(() =>
            wrapper.dispatchEvent(
                new MouseEvent("pointerout", { bubbles: true, relatedTarget: document.body }),
            ),
        );
        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "A", shiftKey: true, bubbles: true }));
        });
        expect(popover()).toBeNull();
    });

    it("does not force a layout to decide whether it should open", async () => {
        /*
         * getBoundingClientRect flushes pending layout synchronously. The
         * boundary is tracked by pointerenter/pointerleave instead, so the
         * shortcut must not need to measure anything.
         */
        await mountAndPoint(400, 300);
        const wrapper = document.querySelector(".react-flow")!.parentElement as HTMLElement;
        let measured = 0;
        const real = wrapper.getBoundingClientRect.bind(wrapper);
        wrapper.getBoundingClientRect = () => {
            measured += 1;
            return real();
        };
        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "A", shiftKey: true, bubbles: true }));
        });
        await waitFor(() => expect(popover()).toBeTruthy());
        expect(measured).toBe(0);
    });

    it("does not fire for a plain A, or with ctrl held", async () => {
        await mountAndPoint(400, 300);
        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "A", shiftKey: true, ctrlKey: true, bubbles: true }));
        });
        expect(popover()).toBeNull();
    });
});

describe("clicking away", () => {
    /**
     * Reported by QA: pulling a wire loose opens the search, and clicking the
     * canvas should mean "leave it unplugged" — dismissing the wire and the
     * search together. Instead the popover stayed up until it was focused and
     * dismissed with Escape. There was no click-outside handler at all.
     */
    it("closes when the canvas is clicked", async () => {
        await openSearch();
        await waitFor(() => expect(popover()).toBeTruthy());
        const pane = document.querySelector(".react-flow__pane") as HTMLElement;
        act(() => {
            pane.dispatchEvent(
                new MouseEvent("pointerdown", { bubbles: true, clientX: 700, clientY: 500, button: 0 }),
            );
        });
        await waitFor(() => expect(popover()).toBeNull());
    });

    it("adds nothing when clicked away from", async () => {
        const before = nodeCount();
        await openSearch();
        const pane = document.querySelector(".react-flow__pane") as HTMLElement;
        act(() => {
            pane.dispatchEvent(
                new MouseEvent("pointerdown", { bubbles: true, clientX: 700, clientY: 500, button: 0 }),
            );
        });
        await waitFor(() => expect(popover()).toBeNull());
        expect(nodeCount()).toBe(before);
    });

    it("stays open when clicked inside", async () => {
        // Clicking the input or a row must not dismiss it.
        await openSearch();
        await waitFor(() => expect(popover()).toBeTruthy());
        const input = screen.getByLabelText("Search node types");
        act(() => {
            input.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
        });
        expect(popover()).toBeTruthy();
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

/*
 * NOT TESTED HERE: dropping a wire on empty canvas.
 *
 * React Flow's connection drag needs real hit-testing and handle geometry,
 * neither of which jsdom provides — a simulated pointerdown on a handle never
 * starts a connection, so any test here would pass while proving nothing. An
 * earlier version of this file had exactly that: early-returns that made it
 * green without exercising a single line.
 *
 * What IS covered: the compatibility rule and socket selection, as pure
 * functions in nodeSearch.test.ts (typesAcceptingWire, entrySocketFor). The
 * gesture itself is on Zeis's list to check in the preview.
 */
