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

/**
 * The shipped grid: off, squares, matching the default snap size, half
 * strength, theme-coloured, thin lines.
 */
export interface CanvasGrid {
    enabled: boolean;
    style: CanvasGridStyle;
    /** Cell size in flow units. */
    scale: number;
    /** 0–100. */
    opacity: number;
    /**
     * The grid ink: `null` follows the theme's canvas-dots token; a `#rrggbb`
     * hex is a fixed override (accessibility — pick the colour you see best).
     */
    colour: string | null;
    /** Line thickness, 0.5–6 (r148: a free slider, not four presets). */
    weight: number;
    /**
     * How big the marks draw, as a percentage of the standard look — dots'
     * diameter, crosses' arms, hexagon outlines, diamond spacing (r148).
     * Line styles have no marks; the sheet hides the control for them.
     */
    markSize: number;
}

export const DEFAULT_CANVAS_GRID: CanvasGrid = {
    enabled: false,
    style: "squares",
    scale: 22,
    opacity: 50,
    colour: null,
    weight: 1,
    markSize: 100,
};

export const MIN_GRID_WEIGHT = 0.5;
export const MAX_GRID_WEIGHT = 6;
export const MIN_MARK_SIZE = 25;
export const MAX_MARK_SIZE = 250;

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

function clampWeight(value: number): number {
    if (!Number.isFinite(value)) return DEFAULT_CANVAS_GRID.weight;
    return Math.min(MAX_GRID_WEIGHT, Math.max(MIN_GRID_WEIGHT, Math.round(value * 4) / 4));
}

function clampMarkSize(value: number): number {
    if (!Number.isFinite(value)) return DEFAULT_CANVAS_GRID.markSize;
    return Math.min(MAX_MARK_SIZE, Math.max(MIN_MARK_SIZE, Math.round(value)));
}

function isStyle(value: unknown): value is CanvasGridStyle {
    return typeof value === "string" && (CANVAS_GRID_STYLE_IDS as readonly string[]).includes(value);
}

/** `null` (theme) or a strict `#rrggbb` hex — anything else is not a colour. */
function isColour(value: unknown): value is string | null {
    return value === null || (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value));
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
            colour: isColour(saved.colour) ? (saved.colour === null ? null : saved.colour.toLowerCase()) : null,
            weight: clampWeight(Number(saved.weight)),
            markSize: clampMarkSize(Number(saved.markSize)),
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
        colour:
            patch.colour === undefined
                ? current.colour
                : isColour(patch.colour)
                  ? patch.colour === null
                      ? null
                      : patch.colour.toLowerCase()
                  : current.colour,
        weight: patch.weight === undefined ? current.weight : clampWeight(patch.weight),
        markSize: patch.markSize === undefined ? current.markSize : clampMarkSize(patch.markSize),
    };
    if (
        next.enabled === current.enabled &&
        next.style === current.style &&
        next.scale === current.scale &&
        next.opacity === current.opacity &&
        next.colour === current.colour &&
        next.weight === current.weight &&
        next.markSize === current.markSize
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
 * canvas-dots token (so every theme recolors the grid for free), or over a
 * fixed hex when the author chose one (accessibility: the colour you see
 * best, on any theme).
 */
export function gridPatternColour(opacity: number, colour: string | null = null): string {
    const base = colour ?? "var(--color-canvas-dots)";
    return `color-mix(in srgb, ${base} ${Math.round(opacity)}%, transparent)`;
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
