/**
 * The grab handle on the docked inspector's left edge (r159).
 *
 * r158 shipped the float/dock feature behind a small icon button that nobody
 * found — the affordance people reach for is a handle on the edge they want to
 * pull. This is it: a full-height grip on the inspector's left border.
 *
 *  - **Click** it to float the inspector where it last was.
 *  - **Drag** it (past a small threshold) to pull the panel out and carry it
 *    under the cursor — the tactile "pull it off the wall" gesture.
 *
 * The drag listens on `window`, not the handle, because the handle unmounts the
 * instant the panel floats (the docked aside is removed) — a handle-bound
 * listener would die mid-gesture. The threshold keeps a plain click from
 * jumping the panel to the pointer.
 */
import { useCallback, useRef } from "react";
import { floatInspector, setInspectorFloatRect } from "./drawerLayout";

/** Farther than this between press and release counts as a drag, not a click. */
const DRAG_THRESHOLD = 6;

/** Where the pointer sits on the panel once it pops out: just inside the title
    bar, so the cursor is already "holding" the drag handle. */
const GRAB_OFFSET_X = 44;
const GRAB_OFFSET_Y = 14;

export function InspectorDockHandle() {
    const drag = useRef<{ x: number; y: number; floated: boolean } | null>(null);

    const onMove = useCallback((event: PointerEvent) => {
        const start = drag.current;
        if (!start) return;
        if (!start.floated) {
            const moved =
                Math.abs(event.clientX - start.x) >= DRAG_THRESHOLD ||
                Math.abs(event.clientY - start.y) >= DRAG_THRESHOLD;
            if (!moved) return;
            start.floated = true;
            floatInspector();
        }
        setInspectorFloatRect({ x: event.clientX - GRAB_OFFSET_X, y: event.clientY - GRAB_OFFSET_Y });
    }, []);

    const onUp = useCallback(() => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        const start = drag.current;
        drag.current = null;
        // A press that never crossed the threshold is a click: float in place.
        if (start && !start.floated) floatInspector();
    }, [onMove]);

    const onPointerDown = useCallback(
        (event: React.PointerEvent) => {
            event.preventDefault();
            drag.current = { x: event.clientX, y: event.clientY, floated: false };
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
        },
        [onMove, onUp],
    );

    return (
        <button
            type="button"
            aria-label="Float inspector"
            title="Drag to float the inspector — or click to pop it out"
            onPointerDown={onPointerDown}
            className="group absolute top-0 left-0 z-20 flex h-full w-3 cursor-grab touch-none items-center justify-center border-r border-line/0 hover:bg-accent-soft/40 active:cursor-grabbing"
        >
            {/* A grip that sits quietly until hovered, so it reads as "grab me"
                without drawing the eye away from the fields. */}
            <span className="flex flex-col gap-[3px] text-ink-4 group-hover:text-accent">
                <span className="h-0.5 w-0.5 rounded-full bg-current" />
                <span className="h-0.5 w-0.5 rounded-full bg-current" />
                <span className="h-0.5 w-0.5 rounded-full bg-current" />
                <span className="h-0.5 w-0.5 rounded-full bg-current" />
                <span className="h-0.5 w-0.5 rounded-full bg-current" />
                <span className="h-0.5 w-0.5 rounded-full bg-current" />
            </span>
        </button>
    );
}
