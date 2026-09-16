/**
 * The drawer-pull handle on the docked inspector's left edge (r159, reworked
 * r160).
 *
 * r158 hid float/dock behind a small icon nobody found; r159 gave the edge a
 * grip; r160 makes it behave like a real drawer pull, which is what the author
 * annotated for:
 *
 *  - **Drag it left** → the docked panel *widens*, up to `MAX_DOCKED_WIDTH`.
 *    The canvas (and its minimap) reflow to the left as it grows, for free,
 *    because the panel is a flex sibling of the canvas.
 *  - **Pull past that ceiling** (the invisible threshold the author drew as a
 *    red line) → the panel tears off the wall into a floating drawer and
 *    follows the cursor.
 *  - **Click** it (no drag) → float in place; also the keyboard path, since
 *    this is a real focusable `<button>`.
 *
 * The move/up listeners bind to `window`, not the handle, because when the panel
 * floats the docked aside — and this handle with it — unmounts mid-gesture; a
 * handle-bound listener would die on the spot.
 */
import { useCallback, useRef } from "react";
import {
    MAX_DOCKED_WIDTH,
    floatInspector,
    inspectorDockedWidth,
    setInspectorDockedWidth,
    setInspectorFloatRect,
} from "./drawerLayout";

/** Farther than this between press and release counts as a drag, not a click. */
const DRAG_THRESHOLD = 6;

/** Where the pointer sits on the panel once it pops out: just inside the title
    bar, so the cursor is already "holding" the drawer's own drag zone. */
const GRAB_OFFSET_X = 44;
const GRAB_OFFSET_Y = 14;

interface DragState {
    /** Pointer x at press. */
    x: number;
    /** Pointer y at press. */
    y: number;
    /** Docked width at press — the base every widen is measured from. */
    width: number;
    /** Moved past DRAG_THRESHOLD yet? Distinguishes a widen from a click. */
    dragging: boolean;
    /** Torn off into a floating drawer yet? */
    floated: boolean;
}

export function InspectorDockHandle() {
    const drag = useRef<DragState | null>(null);

    const onMove = useCallback((event: PointerEvent) => {
        const start = drag.current;
        if (!start) return;

        // Once floated, the panel just follows the cursor (offset onto its own
        // title bar) — the docked width no longer applies.
        if (start.floated) {
            setInspectorFloatRect({ x: event.clientX - GRAB_OFFSET_X, y: event.clientY - GRAB_OFFSET_Y });
            return;
        }

        if (!start.dragging) {
            const moved =
                Math.abs(event.clientX - start.x) >= DRAG_THRESHOLD ||
                Math.abs(event.clientY - start.y) >= DRAG_THRESHOLD;
            if (!moved) return;
            start.dragging = true;
        }

        // Dragging left (smaller clientX) widens the right-docked panel.
        const desired = start.width + (start.x - event.clientX);
        if (desired > MAX_DOCKED_WIDTH) {
            // Past the ceiling: tear it off the wall.
            start.floated = true;
            floatInspector();
            setInspectorFloatRect({
                x: event.clientX - GRAB_OFFSET_X,
                y: event.clientY - GRAB_OFFSET_Y,
                width: MAX_DOCKED_WIDTH,
            });
            return;
        }
        setInspectorDockedWidth(desired);
    }, []);

    const onUp = useCallback(() => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        const start = drag.current;
        drag.current = null;
        // A press that never became a drag is a click: float in place. A drag
        // that only widened the panel keeps the new width and does nothing more.
        if (start && !start.dragging && !start.floated) floatInspector();
    }, [onMove]);

    const onPointerDown = useCallback(
        (event: React.PointerEvent) => {
            event.preventDefault();
            drag.current = {
                x: event.clientX,
                y: event.clientY,
                width: inspectorDockedWidth(),
                dragging: false,
                floated: false,
            };
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
        },
        [onMove, onUp],
    );

    return (
        <button
            type="button"
            aria-label="Float inspector"
            title="Drag to widen the inspector — pull further to float it, or click to pop it out"
            onPointerDown={onPointerDown}
            className="group absolute top-0 -left-3 z-20 flex h-full w-6 cursor-ew-resize touch-none items-center justify-start border-r border-line/0 hover:bg-accent-soft/20 active:cursor-grabbing"
        >
            {/* A protruding pull tab, centred on the edge and facing the canvas
                instead of the inspector. It sits quietly and brightens on hover
                so it reads as a handle without stealing the eye from the fields. */}
            <span
                data-testid="inspector-dock-tab"
                className="pointer-events-none absolute left-0 flex h-14 w-3 items-center justify-center rounded-l-md border border-r-0 border-line bg-surface-2 text-ink-4 shadow-sm transition-colors group-hover:bg-accent-soft group-hover:text-accent"
            >
                <span className="flex flex-col gap-[3px]">
                    <span className="h-0.5 w-0.5 rounded-full bg-current" />
                    <span className="h-0.5 w-0.5 rounded-full bg-current" />
                    <span className="h-0.5 w-0.5 rounded-full bg-current" />
                    <span className="h-0.5 w-0.5 rounded-full bg-current" />
                </span>
            </span>
        </button>
    );
}
