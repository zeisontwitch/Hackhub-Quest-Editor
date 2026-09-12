/**
 * The visual canvas grid (r142).
 *
 * Four of the six styles ride on React Flow's own `<Background>` — its
 * pattern math (pan-tracking, zoom scaling) is battle-tested. The two it has
 * no variant for, hexagons and diamond, get the overlay below: the same
 * geometry the library uses (verified in the xyflow dist, not assumed), with
 * seamless tiling done by the stamp technique — stamp the motif at every
 * lattice point near the tile and let the pattern's own clipping do the
 * wrapping, so no seam arithmetic is needed.
 *
 * The grid is visual only. Node snapping keeps its own size (`snapGrid.ts`);
 * the settings sheet says so, and nothing here links them.
 */
import { useSyncExternalStore } from "react";
import { useStore } from "@xyflow/react";
import {
    Background,
    BackgroundVariant,
} from "@xyflow/react";
import {
    canvasGrid,
    DEFAULT_CANVAS_GRID,
    gridPatternColour,
    gridPatternOrigin,
    subscribeCanvasGrid,
    type CanvasGridStyle,
} from "./canvasGrid";

/** Renders the configured grid, or nothing at all when it is off. */
export function CanvasGridBackground() {
    const grid = useSyncExternalStore(subscribeCanvasGrid, canvasGrid, () => DEFAULT_CANVAS_GRID);
    if (!grid.enabled) return null;
    const colour = gridPatternColour(grid.opacity);

    switch (grid.style) {
        case "dots":
            return <Background variant={BackgroundVariant.Dots} gap={grid.scale} size={1.5} color={colour} />;
        case "crosses":
            return (
                <Background
                    variant={BackgroundVariant.Cross}
                    gap={grid.scale}
                    size={8}
                    lineWidth={1}
                    color={colour}
                />
            );
        case "graph":
            return (
                <>
                    {/* Graph paper: fine lines every cell, a heavier line every
                        fifth — two stacked native layers, no custom SVG. */}
                    <Background variant={BackgroundVariant.Lines} gap={grid.scale} lineWidth={1} color={colour} />
                    <Background
                        variant={BackgroundVariant.Lines}
                        gap={grid.scale * 5}
                        lineWidth={1.75}
                        color={colour}
                    />
                </>
            );
        case "hexagons":
        case "diamond":
            return <CanvasGridOverlay style={grid.style} scale={grid.scale} colour={colour} />;
        case "squares":
        default:
            return <Background variant={BackgroundVariant.Lines} gap={grid.scale} lineWidth={1} color={colour} />;
    }
}

/** A flat-top hexagon outline, centred (cx, cy) with side s. */
function hexPath(cx: number, cy: number, s: number): string {
    const h = (Math.sqrt(3) * s) / 2;
    return [
        `M ${cx + s} ${cy}`,
        `L ${cx + s / 2} ${cy + h}`,
        `L ${cx - s / 2} ${cy + h}`,
        `L ${cx - s} ${cy}`,
        `L ${cx - s / 2} ${cy - h}`,
        `L ${cx + s / 2} ${cy - h}`,
        "Z",
    ].join(" ");
}

/**
 * The custom-pattern overlay for the styles the library cannot draw.
 *
 * Mirrors the library's Background container (absolute, full size,
 * pointer-events none, behind everything) and its tile anchoring, so pan and
 * zoom behave identically to the native variants.
 *
 * The colour travels a CSS channel (r144): `var()` and `color-mix()` resolve
 * in real CSS, not in SVG presentation *attributes* — the attribute route
 * rendered these two styles invisible in a real browser, which jsdom cannot
 * see. So the stamps stroke `currentColor` and the colour rides the svg's
 * inline `color` style, the same net mechanism the library's own background
 * uses for its pattern colour.
 */
export function CanvasGridOverlay({
    style,
    scale,
    colour,
}: {
    style: Extract<CanvasGridStyle, "hexagons" | "diamond">;
    scale: number;
    colour: string;
}) {
    // The d3 zoom transform [x, y, zoom]; the pattern must pan and zoom with
    // the canvas exactly as the native variants do.
    const transform = useStore((s) => s.transform) as [number, number, number];
    const zoom = transform[2];

    let tileWidth: number;
    let tileHeight: number;
    let content: React.ReactNode;

    if (style === "hexagons") {
        // A honeycomb: hexagon side is half the cell, the lattice repeats
        // after two columns (3·s) and one row (√3·s). Stamps cover every
        // centre whose hexagon could reach into the tile.
        const s = (scale * zoom) / 2;
        tileWidth = 3 * s;
        tileHeight = Math.sqrt(3) * s;
        const stamps: React.ReactNode[] = [];
        for (let m = -2; m <= 3; m++) {
            for (let n = -2; n <= 2; n++) {
                const cx = 1.5 * s * m;
                const cy = Math.sqrt(3) * s * n + (Math.abs(m % 2) === 1 ? (Math.sqrt(3) * s) / 2 : 0);
                const halfW = s;
                const halfH = (Math.sqrt(3) * s) / 2;
                if (cx + halfW < 0 || cx - halfW > tileWidth) continue;
                if (cy + halfH < 0 || cy - halfH > tileHeight) continue;
                stamps.push(
                    <path key={`${m}:${n}`} d={hexPath(cx, cy, s)} fill="none" stroke="currentColor" strokeWidth={1} />,
                );
            }
        }
        content = stamps;
    } else {
        // Diamond: both diagonal families through every lattice point of a
        // square tile — long stamped segments, clipped by the pattern itself.
        const d = Math.max(1, scale * zoom);
        tileWidth = d;
        tileHeight = d;
        const stamps: React.ReactNode[] = [];
        for (let k = -1; k <= 1; k++) {
            stamps.push(
                <line
                    key={`d${k}`}
                    x1={-d}
                    y1={-d + k * d}
                    x2={2 * d}
                    y2={2 * d + k * d}
                    stroke="currentColor"
                    strokeWidth={1}
                />,
                <line
                    key={`a${k}`}
                    x1={-d}
                    y1={d + k * d}
                    x2={2 * d}
                    y2={-2 * d + k * d}
                    stroke="currentColor"
                    strokeWidth={1}
                />,
            );
        }
        content = stamps;
    }

    const origin = gridPatternOrigin(tileWidth, tileHeight, transform);

    return (
        <svg
            data-testid="qe-canvas-grid"
            aria-hidden
            style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                top: 0,
                left: 0,
                pointerEvents: "none",
                zIndex: -1,
                // The colour rides inline `color` (real CSS) and the stamps
                // stroke currentColor: var()/color-mix() resolve in styles,
                // not in SVG presentation attributes (the r144 fix).
                color: colour,
            }}
        >
            <defs>
                <pattern
                    id="qe-canvas-grid-pattern"
                    x={origin.x}
                    y={origin.y}
                    width={tileWidth}
                    height={tileHeight}
                    patternUnits="userSpaceOnUse"
                >
                    {content}
                </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#qe-canvas-grid-pattern)" />
        </svg>
    );
}
