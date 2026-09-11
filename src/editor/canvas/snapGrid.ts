/**
 * The snap-to-grid preference.
 *
 * Deliberately the same shape as `wireMotion`: a module-level value, a
 * `useSyncExternalStore` subscription, and a localStorage write. It is *not*
 * React state and *not* in the project store, because neither is right here:
 *
 *  - It is a per-author editor preference, not part of the mod. Putting it in
 *    the project would mean exporting it and creating a history entry every
 *    time someone flicked it.
 *  - Nothing needs to re-render when it changes except the one button and
 *    React Flow's own `snapToGrid` prop, so a store subscription that wakes the
 *    whole canvas would be waste (see the r95 note in canvasPerformance).
 */

const STORAGE_KEY = "qe.snapToGrid";
const STEP_KEY = "qe.snapStep";

/** The snap cell sizes offered in Settings, in flow units. */
export const SNAP_STEPS = [11, 22, 44] as const;
export type SnapStep = (typeof SNAP_STEPS)[number];

/** The shipped cell; also the alignment/distribution spacing default. */
export const DEFAULT_SNAP_STEP: SnapStep = 22;

type Listener = () => void;
const listeners = new Set<Listener>();

function readStored(): boolean {
    try {
        // Off unless asked for: snapping is a constraint, and an author who has
        // never heard of it should not find their nodes jumping.
        return localStorage.getItem(STORAGE_KEY) === "on";
    } catch {
        // Private mode, or no storage at all.
        return false;
    }
}

function readStoredStep(): SnapStep {
    try {
        const raw = Number(localStorage.getItem(STEP_KEY));
        return (SNAP_STEPS as readonly number[]).includes(raw) ? (raw as SnapStep) : DEFAULT_SNAP_STEP;
    } catch {
        return DEFAULT_SNAP_STEP;
    }
}

let enabled = readStored();
let step: SnapStep = readStoredStep();

/** Is snapping on? */
export function snapEnabled(): boolean {
    return enabled;
}

/** The snap cell size, in flow units. */
export function snapStep(): SnapStep {
    return step;
}

/**
 * Change the snap cell. One number, three meanings by design: the drag grid,
 * the canvas dot pattern, and the align/distribute spacing all read it, so
 * what snaps together also spaces together.
 */
export function setSnapStep(next: SnapStep): void {
    if (next === step) return;
    step = next;
    try {
        localStorage.setItem(STEP_KEY, String(next));
    } catch {
        /* not being able to remember it is not a reason to fail */
    }
    for (const l of listeners) l();
}

/** Turn snapping on or off, and remember the choice. */
export function setSnapEnabled(on: boolean): void {
    if (on === enabled) return;
    enabled = on;
    try {
        localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
    } catch {
        /* not being able to remember it is not a reason to fail */
    }
    for (const l of listeners) l();
}

/** Subscribe to changes (useSyncExternalStore contract). */
export function subscribeSnap(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Test seam: forget the stored preference. */
export function resetSnapForTests(): void {
    enabled = false;
    step = DEFAULT_SNAP_STEP;
    listeners.clear();
}
