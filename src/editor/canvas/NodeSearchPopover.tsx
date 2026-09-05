/**
 * "Add a node here" — the search popover.
 *
 * Blender's model: it opens at the pointer and you type straight away. There
 * is no separate "enter search mode" step, because that step is the thing
 * everyone praises Blender for not having.
 *
 * A transient popover, not a modal: no backdrop, no app-wide focus trap. It
 * behaves like an autocomplete that happens to float.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { CATEGORY_HEX, categoryOf } from "@/schema/registry";
import type { NodeType } from "@/schema/nodes";
import type { EdgeKind } from "@/schema/edges";
import { moveHighlight, searchNodeTypes, typesAcceptingWire } from "./nodeSearch";
import {
    POPOVER_INPUT_HEIGHT,
    POPOVER_ROW_HEIGHT,
    POPOVER_WIDTH,
    placePopover,
} from "./popoverPlacement";

export interface NodeSearchPopoverProps {
    /** Where the author clicked, in screen coordinates. */
    at: { x: number; y: number };
    /**
     * Set when the popover was opened by dropping a wire on empty canvas. The
     * list is then narrowed to types the wire can actually plug into, and the
     * placeholder says so.
     */
    wire?: { kind: EdgeKind; direction: "source" | "target" } | null;
    onPick: (type: NodeType) => void;
    onClose: () => void;
}

export function NodeSearchPopover({ at, wire, onPick, onClose }: NodeSearchPopoverProps) {
    const [query, setQuery] = useState("");
    const [highlight, setHighlight] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    /**
     * Guards against a stationary mouse stealing the highlight back from the
     * arrow keys: hover only counts once the pointer has actually moved.
     */
    const pointerMoved = useRef(false);

    const pool = useMemo(
        () => (wire ? typesAcceptingWire(wire.kind, wire.direction) : undefined),
        [wire],
    );
    const results = useMemo(() => searchNodeTypes(query, pool), [query, pool]);

    // A new query means the old highlight index is meaningless.
    useEffect(() => setHighlight(0), [query]);

    // Focus the input on open, so typing works with no further ceremony.
    useLayoutEffect(() => {
        inputRef.current?.focus();
    }, []);

    const placement = useMemo(
        () =>
            placePopover(
                at,
                { width: window.innerWidth, height: window.innerHeight },
                results.length,
            ),
        [at, results.length],
    );

    // Keep the highlighted row in view when arrowing past the fold. Guarded:
    // jsdom has no layout, so scrollIntoView may be absent.
    useEffect(() => {
        const row = listRef.current?.querySelector<HTMLElement>(`[data-index="${highlight}"]`);
        row?.scrollIntoView?.({ block: "nearest" });
    }, [highlight]);

    /*
     * Close when the canvas moves under us: the popover promises to drop the
     * node where it is pointing, and a pan or zoom would make that a lie.
     *
     * Also close on a click anywhere outside. Clicking away is how everyone
     * dismisses a popover, and it matters doubly here: the search can be
     * opened by dragging a wire loose, where clicking empty canvas means
     * "leave it unplugged" and must dismiss both at once.
     */
    useEffect(() => {
        const close = () => onClose();
        const onPointerDown = (event: PointerEvent) => {
            if (rootRef.current?.contains(event.target as Node)) return;
            onClose();
        };
        window.addEventListener("wheel", close, { passive: true });
        window.addEventListener("resize", close);
        // Capture phase: the canvas stops propagation on its own pointerdown,
        // so a bubbling listener would never hear a click on the pane.
        window.addEventListener("pointerdown", onPointerDown, true);
        return () => {
            window.removeEventListener("wheel", close);
            window.removeEventListener("resize", close);
            window.removeEventListener("pointerdown", onPointerDown, true);
        };
    }, [onClose]);

    const accept = (index: number) => {
        const def = results[index];
        if (def) onPick(def.type);
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                pointerMoved.current = false;
                setHighlight((h) => moveHighlight(h, 1, results.length));
                break;
            case "ArrowUp":
                event.preventDefault();
                pointerMoved.current = false;
                setHighlight((h) => moveHighlight(h, -1, results.length));
                break;
            case "Enter":
            case "Tab":
                event.preventDefault();
                accept(highlight);
                break;
            case "Escape":
                event.preventDefault();
                /*
                 * Escape also clears the canvas selection, on a window-level
                 * listener. Stop it here or dismissing the search would throw
                 * away the author's selection as a side effect.
                 */
                event.stopPropagation();
                onClose();
                break;
            default:
                break;
        }
    };

    const listHeight = Math.min(results.length, placement.maxRows) * POPOVER_ROW_HEIGHT;

    return (
        <div
            ref={rootRef}
            role="dialog"
            aria-label="Add a node"
            className="fixed z-[80] overflow-hidden rounded-lg border border-line-strong bg-surface shadow-node"
            style={{ left: placement.left, top: placement.top, width: POPOVER_WIDTH }}
            // Keep clicks inside from reaching the canvas, which would
            // otherwise clear the selection or start a drag.
            onPointerDown={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div
                className="flex items-center gap-2 border-b border-line px-2.5"
                style={{ height: POPOVER_INPUT_HEIGHT }}
            >
                <Icon name="search" size={13} className="shrink-0 text-ink-4" />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={wire ? "Connect to…" : "Add a node…"}
                    aria-label="Search node types"
                    role="combobox"
                    aria-expanded
                    aria-controls="qe-node-search-list"
                    aria-activedescendant={
                        results.length > 0 ? `qe-node-option-${highlight}` : undefined
                    }
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full bg-transparent text-[12.5px] text-ink outline-none placeholder:text-ink-4"
                />
            </div>

            {results.length === 0 ? (
                <div className="px-3 py-3 text-[12px] text-ink-4">
                    No nodes match “{query.trim()}”.
                </div>
            ) : (
                <div
                    id="qe-node-search-list"
                    ref={listRef}
                    role="listbox"
                    aria-label="Matching node types"
                    className="overflow-y-auto"
                    style={{ maxHeight: listHeight }}
                >
                    {results.map((def, i) => {
                        const colour = CATEGORY_HEX[categoryOf(def.type).id];
                        const active = i === highlight;
                        return (
                            <button
                                key={def.type}
                                id={`qe-node-option-${i}`}
                                data-index={i}
                                type="button"
                                role="option"
                                aria-selected={active}
                                onMouseMove={() => {
                                    pointerMoved.current = true;
                                    if (!active) setHighlight(i);
                                }}
                                onClick={() => accept(i)}
                                className={
                                    "flex w-full items-center gap-2.5 px-2.5 text-left " +
                                    (active ? "bg-surface-3" : "hover:bg-surface-2")
                                }
                                style={{ height: POPOVER_ROW_HEIGHT }}
                            >
                                <span
                                    className="grid size-6 shrink-0 place-items-center rounded"
                                    style={{
                                        background: `color-mix(in srgb, ${colour} 16%, transparent)`,
                                        color: colour,
                                    }}
                                >
                                    <Icon name={def.icon as never} size={12} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[12.5px] leading-tight text-ink">
                                        {def.label}
                                    </span>
                                    <span className="block truncate text-[11px] leading-tight text-ink-4">
                                        {def.blurb}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
