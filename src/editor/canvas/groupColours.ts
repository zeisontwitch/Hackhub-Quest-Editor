/**
 * Group frame title-bar colours (r229).
 *
 * A frame is created slate — or, once the author opts in from Settings,
 * wearing one of the ready-made frame colours picked for it at creation, so
 * each new cluster is easy to tell apart at a glance. The eight colours are
 * the single source of truth for both this module and the inspector's
 * "Title bar colour" picker (Field.tsx keeps the human labels and imports
 * these values), so the random roll and the hand picker can never drift
 * apart.
 *
 * The on/off is a per-author editor preference, not project data: same shape
 * as `snapGrid` and `wirePhysicsPref` — a module-level value, a
 * `useSyncExternalStore` subscription, and a localStorage write. Not React
 * state and not in the project store, because flipping it would add an undo
 * entry every time (the r96 lesson from the snap toggle).
 */

/** The ready-made frame colours — anything else is one click away in the
    inspector's picker. */
export const FRAME_COLOURS = [
    "#64748b", // Slate
    "#60a5fa", // Blue
    "#34d399", // Green
    "#fbbf24", // Amber
    "#f472b6", // Pink
    "#a78bfa", // Violet
    "#fb923c", // Orange
    "#22d3ee", // Cyan,
] as const;

/** A uniform pick from the ready-made frame colours (r229). */
export function randomGroupColour(): string {
    return FRAME_COLOURS[Math.floor(Math.random() * FRAME_COLOURS.length)];
}

const STORAGE_KEY = "qe.groupColourRandom";

type Listener = () => void;
const listeners = new Set<Listener>();

function readStored(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) === "on";
    } catch {
        return false;
    }
}

/** Off by default: frames stay slate until the author opts in. */
let enabled = readStored();

/** Should a newly created group frame wear a random ready-made colour? */
export function groupColourRandomOn(): boolean {
    return enabled;
}

/** Turn random frame colours on or off, and remember the choice. */
export function setGroupColourRandom(on: boolean): void {
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
export function subscribeGroupColourRandom(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Test seam: forget the stored preference. */
export function resetGroupColourForTests(): void {
    enabled = false;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* nothing to forget */
    }
    listeners.clear();
}
