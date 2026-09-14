/**
 * Where the inspector lives: docked to the right edge, or a free-floating drawer
 * the author can drag around and resize (roadmap Next-up #1, r158).
 *
 * Deliberately the same shape as `snapGrid`/`wireMotion`: a module-level value,
 * a `useSyncExternalStore` subscription, and a localStorage write. It is *not*
 * React state and *not* in the project store, because this is a per-author
 * editor preference, not part of the mod — putting it in the project would mean
 * exporting it and creating an undo entry every time someone nudged the panel.
 *
 * The shipped default is `docked`, so an author who never touches this sees the
 * exact same fixed-right inspector as before.
 */

const MODE_KEY = "qe.inspector.mode";
const RECT_KEY = "qe.inspector.floatRect";
const DOCKED_WIDTH_KEY = "qe.inspector.dockedWidth";

export type InspectorMode = "docked" | "floating";

/** A floating drawer's position (top-left) and size, in CSS pixels. */
export interface FloatRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Size bounds for the floating drawer — a resize can go no smaller or larger. */
export const MIN_FLOAT_WIDTH = 280;
export const MAX_FLOAT_WIDTH = 640;
export const MIN_FLOAT_HEIGHT = 220;

/**
 * The docked drawer's width. `DOCKED_WIDTH` is the shipped default (and the
 * floor) — a fresh author sees the exact same 340px panel as before. Authors
 * can pull the edge handle to widen it up to `MAX_DOCKED_WIDTH`; pulling past
 * that is what tears the panel off the wall into a floating drawer (r160).
 */
export const DOCKED_WIDTH = 340;
export const MAX_DOCKED_WIDTH = 640;

/** A sensible first-float rectangle: docked-width, near the top-right corner. */
export const DEFAULT_FLOAT_RECT: FloatRect = {
    x: 120,
    y: 96,
    width: DOCKED_WIDTH,
    height: 520,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function readStoredMode(): InspectorMode {
    try {
        return localStorage.getItem(MODE_KEY) === "floating" ? "floating" : "docked";
    } catch {
        return "docked";
    }
}

function readStoredDockedWidth(): number {
    try {
        const raw = localStorage.getItem(DOCKED_WIDTH_KEY);
        if (!raw) return DOCKED_WIDTH;
        return clampDockedWidth(Number(raw));
    } catch {
        return DOCKED_WIDTH;
    }
}

/** Keep the docked width between its floor and ceiling (NaN → the default). */
export function clampDockedWidth(width: number): number {
    return clamp(width, DOCKED_WIDTH, MAX_DOCKED_WIDTH);
}

function readStoredRect(): FloatRect {
    try {
        const raw = localStorage.getItem(RECT_KEY);
        if (!raw) return { ...DEFAULT_FLOAT_RECT };
        const parsed = JSON.parse(raw) as Partial<FloatRect>;
        return clampRect({
            x: Number(parsed.x ?? DEFAULT_FLOAT_RECT.x),
            y: Number(parsed.y ?? DEFAULT_FLOAT_RECT.y),
            width: Number(parsed.width ?? DEFAULT_FLOAT_RECT.width),
            height: Number(parsed.height ?? DEFAULT_FLOAT_RECT.height),
        });
    } catch {
        return { ...DEFAULT_FLOAT_RECT };
    }
}

/** The viewport size, guarded for non-browser (test) environments. */
function viewport(): { w: number; h: number } {
    const w = typeof window === "undefined" ? 1280 : window.innerWidth || 1280;
    const h = typeof window === "undefined" ? 800 : window.innerHeight || 800;
    return { w, h };
}

/**
 * Keep a rectangle usable: clamp its size to the allowed range, then keep it on
 * screen so the drag handle can never be lost past an edge (a title bar dragged
 * off the top is unrecoverable). Exported because the drag/resize handlers and
 * the initial read must clamp the same way.
 */
export function clampRect(rect: FloatRect): FloatRect {
    const { w, h } = viewport();
    const width = clamp(rect.width, MIN_FLOAT_WIDTH, Math.min(MAX_FLOAT_WIDTH, w));
    const height = clamp(rect.height, MIN_FLOAT_HEIGHT, h);
    // Keep the whole panel on screen, but never push its top above 0 — the
    // header must stay grabbable.
    const x = clamp(rect.x, 0, Math.max(0, w - width));
    const y = clamp(rect.y, 0, Math.max(0, h - height));
    return { x, y, width, height };
}

function clamp(value: number, min: number, max: number): number {
    if (Number.isNaN(value)) return min;
    return Math.min(Math.max(value, min), max);
}

let mode: InspectorMode = readStoredMode();
let rect: FloatRect = readStoredRect();
let dockedWidth: number = readStoredDockedWidth();

/** Docked or floating? */
export function inspectorMode(): InspectorMode {
    return mode;
}

/** The floating drawer's current rectangle. */
export function inspectorFloatRect(): FloatRect {
    return rect;
}

/** The docked drawer's current width, in CSS pixels. */
export function inspectorDockedWidth(): number {
    return dockedWidth;
}

function persistMode(): void {
    try {
        localStorage.setItem(MODE_KEY, mode);
    } catch {
        /* not being able to remember it is not a reason to fail */
    }
}

function persistRect(): void {
    try {
        localStorage.setItem(RECT_KEY, JSON.stringify(rect));
    } catch {
        /* not being able to remember it is not a reason to fail */
    }
}

function persistDockedWidth(): void {
    try {
        localStorage.setItem(DOCKED_WIDTH_KEY, String(dockedWidth));
    } catch {
        /* not being able to remember it is not a reason to fail */
    }
}

/** Pop the inspector out into a floating drawer. */
export function floatInspector(): void {
    if (mode === "floating") return;
    mode = "floating";
    // Re-clamp on the way out in case the window changed size since last float.
    rect = clampRect(rect);
    persistMode();
    persistRect();
    for (const l of listeners) l();
}

/** Snap the inspector back to the right edge. */
export function dockInspector(): void {
    if (mode === "docked") return;
    mode = "docked";
    persistMode();
    for (const l of listeners) l();
}

/** Move / resize the floating drawer, clamped to stay usable. */
export function setInspectorFloatRect(next: Partial<FloatRect>): void {
    rect = clampRect({ ...rect, ...next });
    persistRect();
    for (const l of listeners) l();
}

/** Resize the docked drawer, clamped between its floor and ceiling. */
export function setInspectorDockedWidth(width: number): void {
    const next = clampDockedWidth(width);
    if (next === dockedWidth) return;
    dockedWidth = next;
    persistDockedWidth();
    for (const l of listeners) l();
}

/** Put the inspector back to the shipped default (docked). Used by the
    settings sheet's "reset all editor preferences". */
export function resetInspectorLayout(): void {
    mode = "docked";
    rect = { ...DEFAULT_FLOAT_RECT };
    dockedWidth = DOCKED_WIDTH;
    persistMode();
    persistRect();
    persistDockedWidth();
    for (const l of listeners) l();
}

/** Subscribe to changes (useSyncExternalStore contract). */
export function subscribeInspectorLayout(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Test seam: forget the stored layout and put it back to the shipped default. */
export function resetInspectorLayoutForTests(): void {
    mode = "docked";
    rect = { ...DEFAULT_FLOAT_RECT };
    dockedWidth = DOCKED_WIDTH;
    listeners.clear();
}
