/**
 * The inspector as a free-floating, draggable, resizable drawer (roadmap
 * Next-up #1, r158).
 *
 * Drag the title bar to move it; drag the bottom-right grip to resize it. Both
 * are pointer-driven and clamped by `drawerLayout.clampRect` so the panel can
 * never be lost past a window edge. The layout is a per-author editor
 * preference (see `drawerLayout.ts`), never part of the project document.
 *
 * The panel body is the same `<InspectorPanel />` the docked aside renders, so
 * float and dock are two frames around one inspector — no duplicated fields.
 */
import { useCallback, useRef, useSyncExternalStore } from "react";
import { Icon } from "@/components/Icon";
import { InspectorPanel } from "./InspectorPanel";
import {
    MIN_FLOAT_HEIGHT,
    MIN_FLOAT_WIDTH,
    dockInspector,
    inspectorFloatRect,
    setInspectorFloatRect,
    subscribeInspectorLayout,
} from "./drawerLayout";

/**
 * Pointer capture keeps a drag alive when the pointer leaves the handle, but it
 * is optional (jsdom does not implement it), so both calls are guarded — a
 * missing capture must not throw out of the gesture.
 */
function capturePointer(event: React.PointerEvent): void {
    const el = event.currentTarget as HTMLElement;
    el.setPointerCapture?.(event.pointerId);
}

function releasePointer(event: React.PointerEvent): void {
    const el = event.currentTarget as HTMLElement;
    if (el.hasPointerCapture?.(event.pointerId)) el.releasePointerCapture?.(event.pointerId);
}

export function FloatingInspector() {
    const rect = useSyncExternalStore(subscribeInspectorLayout, inspectorFloatRect, inspectorFloatRect);

    // The gesture's anchor: where the pointer was, and what the rect was, when
    // the press began. Kept in a ref so a re-render mid-drag never resets it.
    const anchor = useRef<{ px: number; py: number; rect: typeof rect } | null>(null);

    const onDragPointerDown = useCallback(
        (event: React.PointerEvent) => {
            // Buttons inside the title bar (dock) handle their own clicks.
            if ((event.target as HTMLElement).closest("button")) return;
            event.preventDefault();
            capturePointer(event);
            anchor.current = { px: event.clientX, py: event.clientY, rect: inspectorFloatRect() };
        },
        [],
    );

    const onDragPointerMove = useCallback((event: React.PointerEvent) => {
        const start = anchor.current;
        if (!start) return;
        setInspectorFloatRect({
            x: start.rect.x + (event.clientX - start.px),
            y: start.rect.y + (event.clientY - start.py),
        });
    }, []);

    const onResizePointerDown = useCallback((event: React.PointerEvent) => {
        event.preventDefault();
        event.stopPropagation();
        capturePointer(event);
        anchor.current = { px: event.clientX, py: event.clientY, rect: inspectorFloatRect() };
    }, []);

    const onResizePointerMove = useCallback((event: React.PointerEvent) => {
        const start = anchor.current;
        if (!start) return;
        setInspectorFloatRect({
            width: start.rect.width + (event.clientX - start.px),
            height: start.rect.height + (event.clientY - start.py),
        });
    }, []);

    const endGesture = useCallback((event: React.PointerEvent) => {
        anchor.current = null;
        releasePointer(event);
    }, []);

    return (
        <aside
            aria-label="Inspector"
            className="pointer-events-auto fixed z-30 flex flex-col overflow-hidden rounded-lg border border-line-strong bg-surface shadow-node"
            style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
        >
            {/* Title bar — the drag handle. */}
            <div
                className="flex shrink-0 cursor-grab touch-none items-center gap-2 border-b border-line bg-canvas px-2 py-1.5 active:cursor-grabbing"
                onPointerDown={onDragPointerDown}
                onPointerMove={onDragPointerMove}
                onPointerUp={endGesture}
                onPointerCancel={endGesture}
            >
                <Icon name="grip" size={13} />
                <span className="flex-1 text-[11px] font-semibold tracking-wider text-ink-3 uppercase select-none">
                    Inspector
                </span>
                <button
                    type="button"
                    className="btn-icon"
                    onClick={dockInspector}
                    title="Dock to the right edge"
                    aria-label="Dock inspector"
                >
                    <Icon name="panelRight" size={14} />
                </button>
            </div>

            {/* Body — the same inspector the docked aside renders. */}
            <div className="min-h-0 flex-1 overflow-hidden">
                <InspectorPanel />
            </div>

            {/* Resize grip, bottom-right. */}
            <div
                role="button"
                aria-label="Resize inspector"
                title="Drag to resize"
                className="absolute right-0 bottom-0 h-4 w-4 cursor-nwse-resize touch-none"
                onPointerDown={onResizePointerDown}
                onPointerMove={onResizePointerMove}
                onPointerUp={endGesture}
                onPointerCancel={endGesture}
                style={{ minWidth: 0, minHeight: 0 }}
                data-min-width={MIN_FLOAT_WIDTH}
                data-min-height={MIN_FLOAT_HEIGHT}
            >
                <svg viewBox="0 0 16 16" className="h-full w-full text-ink-4" aria-hidden>
                    <path d="M11 15 15 11 M6 15 15 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
            </div>
        </aside>
    );
}
