/**
 * The visual canvas grid.
 *
 * Zeis's r142 request: a grid you can see and tune — on/off (default off),
 * one of six styles, its own scale, and its own opacity. It replaces the
 * always-on dot pattern r140/r141 shipped, which means the default canvas is
 * now plain — a deliberate change, not a regression.
 *
 * Deliberately **not** coupled to snapping: the grid is a visual aid with its
 * own scale, while node snapping keeps its own size (`snapGrid.ts`). Forcing
 * them together would make one slider secretly drive two things; honest
 * separation with honest copy is cheaper.
 *
 * Same shape as the other preference modules: a stored value, a
 * `useSyncExternalStore` subscription, a setter. One JSON key holds the whole
 * grid (the `wireTuning` precedent), validated on read so a stale or corrupt
 * blob can never wedge the canvas.
 */

const STORAGE_KEY = "qe.canvasGrid";

export const CANVAS_GRID_STYLE_IDS = [
    "squares",
    "dots",
    "crosses",
    "hexagons",
    "graph",
    "diamond",
] as const;
export type CanvasGridStyle = (typeof CANVAS_GRID_STYLE_IDS)[number];

export const CANVAS_GRID_STYLES: readonly {
    id: CanvasGridStyle;
    label: string;
    hint: string;
}[] = [
    { id: "squares", label: "Squares", hint: "The classic grid — like graph paper's plain cousin." },
    { id: "dots", label: "Dots", hint: "Points at every intersection. The editor's original background." },
    { id: "crosses", label: "Crosses", hint: "Small + marks where the lines would meet." },
    { id: "hexagons", label: "Hexagons", hint: "A honeycomb — the game's terminal aesthetic." },
    { id: "graph", label: "Graph paper", hint: "Fine lines every cell, a heavier line every fifth." },
    { id: "diamond", label: "Diamond", hint: "Diagonals both ways — the isometric look." },
];

/** The shipped grid: off, squares, matching the default snap size, half strength. */
export interface CanvasGrid {
    enabled: boolean;
    style: CanvasGridStyle;
    /** Cell size in flow units. */
    scale: number;
    /** 0–100. */
    opacity: number;
}

export const DEFAULT_CANVAS_GRID: CanvasGrid = {
    enabled: false,
    style: "squares",
    scale: 22,
    opacity: 50,
};

export const MIN_GRID_SCALE = 4;
export const MAX_GRID_SCALE = 200;

function clampScale(value: number): number {
    if (!Number.isFinite(value)) return DEFAULT_CANVAS_GRID.scale;
    return Math.min(MAX_GRID_SCALE, Math.max(MIN_GRID_SCALE, Math.round(value)));
}

function clampOpacity(value: number): number {
    if (!Number.isFinite(value)) return DEFAULT_CANVAS_GRID.opacity;
    return Math.min(100, Math.max(0, Math.round(value)));
}

function isStyle(value: unknown): value is CanvasGridStyle {
    return typeof value === "string" && (CANVAS_GRID_STYLE_IDS as readonly string[]).includes(value);
}

function readStored(): CanvasGrid {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_CANVAS_GRID };
        const saved = JSON.parse(raw) as Partial<CanvasGrid>;
        // Merge + validate rather than trust: a stale blob from an older
        // build (or a hand-edited one) must never wedge the canvas.
        return {
            enabled: saved.enabled === true,
            style: isStyle(saved.style) ? saved.style : DEFAULT_CANVAS_GRID.style,
            scale: clampScale(Number(saved.scale)),
            opacity: clampOpacity(Number(saved.opacity)),
        };
    } catch {
        return { ...DEFAULT_CANVAS_GRID };
    }
}

let current: CanvasGrid = readStored();

/** The live grid settings. */
export function canvasGrid(): Readonly<CanvasGrid> {
    return current;
}

/** Change any part of the grid, and remember it. */
export function setCanvasGrid(patch: Partial<CanvasGrid>): void {
    const next: CanvasGrid = {
        enabled: patch.enabled ?? current.enabled,
        style: isStyle(patch.style) ? patch.style : current.style,
        scale: patch.scale === undefined ? current.scale : clampScale(patch.scale),
        opacity: patch.opacity === undefined ? current.opacity : clampOpacity(patch.opacity),
    };
    if (
        next.enabled === current.enabled &&
        next.style === current.style &&
        next.scale === current.scale &&
        next.opacity === current.opacity
    ) {
        return;
    }
    current = next;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
        /* not being able to remember it is not a reason to fail */
    }
    for (const listener of listeners) listener();
}

type Listener = () => void;
const listeners = new Set<Listener>();

/** Subscribe to grid changes (useSyncExternalStore contract). */
export function subscribeCanvasGrid(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Test seam: forget the stored grid. */
export function resetCanvasGridForTests(): void {
    current = { ...DEFAULT_CANVAS_GRID };
    listeners.clear();
}

/**
 * The pattern colour at a given opacity — a `color-mix` over the theme's
 * canvas-dots token, so every theme recolors the grid for free.
 */
export function gridPatternColour(opacity: number): string {
    return `color-mix(in srgb, var(--color-canvas-dots) ${Math.round(opacity)}%, transparent)`;
}

/**
 * Where a pattern tile of the given screen size anchors, so the grid tracks
 * the flow origin while panning — the same arithmetic React Flow's own
 * Background uses (`transform % gap`), mirrored rather than reinvented.
 */
export function gridPatternOrigin(
    tileWidth: number,
    tileHeight: number,
    transform: readonly [number, number, number],
): { x: number; y: number } {
    return { x: transform[0] % tileWidth, y: transform[1] % tileHeight };
}
