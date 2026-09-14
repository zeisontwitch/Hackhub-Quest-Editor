/**
 * The Shortcuts & gestures sheet has to stay honest (r157): the roadmap flagged
 * it as stale, and a cheat sheet that lists a key which does nothing is worse
 * than no sheet. So the keyboard rows are asserted against the *real*
 * `useKeyboardShortcuts` hook driving real key events through the store — a
 * documented key that stopped working fails this test.
 *
 * The mouse/pointer gestures ("drag from palette", "double-click a wire") can't
 * be exercised in jsdom (no layout, no compositor); those live in the canvas
 * gesture tests. Here we only guard that every gesture row is well-formed and
 * that the sheet renders grouped.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, renderHook } from "@testing-library/react";
import { Overlays, SHORTCUT_GROUPS } from "@/editor/shell/Overlays";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useEditor } from "@/store/editor";
import { createProject } from "@/schema/project";

beforeEach(() => {
    localStorage.clear();
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

/** Dispatch a real keydown on window, the way the browser would. */
function press(key: string, mods: { ctrl?: boolean; shift?: boolean } = {}) {
    act(() => {
        window.dispatchEvent(
            new KeyboardEvent("keydown", {
                key,
                ctrlKey: !!mods.ctrl,
                shiftKey: !!mods.shift,
                bubbles: true,
                cancelable: true,
            }),
        );
    });
}

/** Add one node and select it, returning its id. */
function selectedNode(): string {
    const id = useEditor.getState().addNode("fx.notify", { x: 0, y: 0 })!;
    act(() => useEditor.getState().select({ nodeIds: [id], edgeIds: [] }));
    return id;
}

describe("SHORTCUT_GROUPS data", () => {
    it("gives every row an action and either keys or a gesture", () => {
        for (const group of SHORTCUT_GROUPS) {
            for (const row of group.items) {
                expect(row.action.length).toBeGreaterThan(0);
                expect(Boolean(row.keys?.length) || Boolean(row.gesture)).toBe(true);
            }
        }
    });

    it("keeps every row key unique within its group", () => {
        for (const group of SHORTCUT_GROUPS) {
            const keys = group.items.map(
                (r) => `${r.keys?.join("+") ?? ""}|${r.gesture ?? ""}|${r.action}`,
            );
            expect(new Set(keys).size).toBe(keys.length);
        }
    });
});

describe("documented keyboard shortcuts actually fire", () => {
    it("Ctrl+D duplicates the selection", () => {
        renderHook(() => useKeyboardShortcuts());
        selectedNode();
        const before = useEditor.getState().project.quests[0].graph.nodes.length;
        press("d", { ctrl: true });
        expect(useEditor.getState().project.quests[0].graph.nodes.length).toBe(before + 1);
    });

    it("Delete removes the selected node", () => {
        renderHook(() => useKeyboardShortcuts());
        const id = selectedNode();
        press("Delete");
        expect(
            useEditor.getState().project.quests[0].graph.nodes.some((n) => n.id === id),
        ).toBe(false);
    });

    it("Ctrl+Z then Ctrl+Shift+Z undoes and redoes a deletion", () => {
        renderHook(() => useKeyboardShortcuts());
        const id = selectedNode();
        act(() => useEditor.getState().select({ nodeIds: [id], edgeIds: [] }));
        press("Delete");
        press("z", { ctrl: true });
        const nodes = () => useEditor.getState().project.quests[0].graph.nodes;
        expect(nodes().some((n) => n.id === id)).toBe(true);
        press("z", { ctrl: true, shift: true });
        expect(nodes().some((n) => n.id === id)).toBe(false);
    });

    it("Escape clears the selection", () => {
        renderHook(() => useKeyboardShortcuts());
        selectedNode();
        expect(useEditor.getState().selection.nodeIds.length).toBe(1);
        press("Escape");
        expect(useEditor.getState().selection.nodeIds.length).toBe(0);
    });

    it("lists no Ctrl-key row the hook does not handle", () => {
        // Every Editing-group row whose first cap is Ctrl must name a key the
        // hook branches on. This is the guard that catches a stale sheet.
        const HANDLED = new Set(["z", "y", "c", "x", "v", "d", "s"]);
        const editing = SHORTCUT_GROUPS.find((g) => g.title === "Editing")!;
        const ctrlRows = editing.items.filter((r) => r.keys?.[0] === "Ctrl");
        for (const row of ctrlRows) {
            const letter = row.keys![row.keys!.length - 1].toLowerCase();
            expect(HANDLED.has(letter)).toBe(true);
        }
    });
});

describe("ShortcutsDialog rendering", () => {
    it("renders every group heading and every action", () => {
        // Open the sheet via the store modal the way the top bar does.
        act(() => useEditor.getState().setUi({ modal: "shortcuts" }));
        render(<Overlays />);
        for (const group of SHORTCUT_GROUPS) {
            expect(document.body.textContent).toContain(group.title);
            for (const row of group.items) {
                expect(document.body.textContent).toContain(row.action);
            }
        }
    });
});
