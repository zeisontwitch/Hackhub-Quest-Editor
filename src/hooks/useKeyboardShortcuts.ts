/**
 * Global keyboard shortcuts.
 *
 * Attached to the window rather than the canvas so they work while focus is in a
 * palette or inspector field — except for delete, which is skipped when the user
 * is typing, or backspacing a description would eat nodes.
 */
import { useEffect } from "react";
import { useEditor } from "@/store/editor";
import { saveDraft } from "@/store/autosave";

/** True when the key event lands on something the author is typing into.
    Shared with the canvas' Ctrl+G handler (r228) so every key that eats a
    selection obeys the same rule. */
export function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function useKeyboardShortcuts() {
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const mod = event.ctrlKey || event.metaKey;
            const store = useEditor.getState();

            if (mod && event.key.toLowerCase() === "z") {
                event.preventDefault();
                if (event.shiftKey) store.redo();
                else store.undo();
                return;
            }

            if (mod && event.key.toLowerCase() === "y") {
                event.preventDefault();
                store.redo();
                return;
            }

            if (mod && !isTypingTarget(event.target)) {
                const key = event.key.toLowerCase();
                if (key === "c") {
                    event.preventDefault();
                    store.copySelection();
                    return;
                }
                if (key === "x") {
                    event.preventDefault();
                    store.cutSelection();
                    return;
                }
                if (key === "v") {
                    event.preventDefault();
                    store.pasteClipboard();
                    return;
                }
                if (key === "d") {
                    event.preventDefault();
                    store.duplicateSelection();
                    return;
                }
            }

            if (mod && event.key.toLowerCase() === "s") {
                event.preventDefault();
                saveDraft(store.project);
                store.toast("Draft saved.", "ok");
                return;
            }

            if (event.key === "Escape") {
                store.select({ nodeIds: [], edgeIds: [] });
                return;
            }

            if ((event.key === "Delete" || event.key === "Backspace") && !isTypingTarget(event.target)) {
                const { nodeIds, edgeIds } = store.selection;
                if (nodeIds.length === 0 && edgeIds.length === 0) return;
                event.preventDefault();
                if (nodeIds.length > 0) store.removeNodes(nodeIds);
                if (edgeIds.length > 0) store.removeEdges(edgeIds);
                store.select({ nodeIds: [], edgeIds: [] });
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);
}
