/**
 * Edges are coloured and dashed by kind, so the difference between "then this
 * runs", "when this event fires" and "this unlocks that" is visible without
 * reading a tooltip.
 */
import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    type Edge,
    type EdgeProps,
} from "@xyflow/react";
import { HANDLE_STYLE, type EdgeDoc, type EdgeKind } from "@/schema/edges";
import { DOT_GAP, registerWireDots } from "./wireMotion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

export interface TypedEdgeData extends Record<string, unknown> {
    kind: EdgeKind;
    label?: string;
    /** Socket label shown mid-edge when the source has several outputs. */
    socketLabel?: string;
}

export type TypedRFEdge = Edge<TypedEdgeData, "typed">;

export function toRFEdge(edge: EdgeDoc, socketLabel?: string): TypedRFEdge {
    return {
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: edge.target,
        targetHandle: edge.targetHandle,
        type: "typed",
        data: { kind: edge.kind, label: edge.label, socketLabel },
    };
}

export function TypedEdge(props: EdgeProps<TypedRFEdge>) {
    const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected, data } =
        props;
    const [path, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.28,
    });

    /* Each wire's dots are animated individually by the browser: see
       wireMotion.ts for why nothing inherits a shared custom property. */
    const dotsRef = useRef<SVGPathElement | null>(null);
    useEffect(() => registerWireDots(dotsRef.current), []);

    const kind = data?.kind ?? "flow";
    const style = HANDLE_STYLE[kind];
    const text = data?.label || data?.socketLabel;
    const color = selected ? "var(--color-accent)" : style.color;
    const width = selected ? 2.5 : 1.75;

    return (
        <>
            {/* The wire itself: one solid stroke in the colour of the socket it
                leaves from. */}
            <BaseEdge
                id={props.id}
                path={path}
                // A wire is 2px of ink; this is how much of the space around it
                // answers the mouse, so a wire can be grabbed, selected or
                // double-clicked without pixel-hunting.
                interactionWidth={26}
                style={{
                    stroke: color,
                    strokeWidth: width,
                    opacity: selected ? 1 : 0.85,
                }}
            />
            {/* Direction: round dots, a touch fatter than the wire, drifting
                from the source towards the target. Driven by SVG's own
                animation rather than a CSS keyframe — that is the one form of
                motion that cannot be defeated by stylesheet order, and it is
                visible in the DOM, so it can be tested. Purely decorative, so
                it never intercepts clicks meant for the wire underneath. */}
            <path
                ref={dotsRef}
                d={path}
                fill="none"
                className="qe-flow-dots"
                style={{
                    stroke: color,
                    strokeWidth: width + 1.4,
                    strokeLinecap: "round",
                    strokeDasharray: `0.1 ${DOT_GAP}`,
                    // Animated by the browser, per wire, via wireMotion —
                    // never through an inherited custom property, which
                    // restyles the whole canvas every frame. Purely decorative,
                    // so it never intercepts a click meant for the wire.
                    pointerEvents: "none",
                }}
            />
            {text && (
                <EdgeLabelRenderer>
                    <div
                        className={cn(
                            "nodrag nopan pointer-events-none absolute rounded border px-1.5 py-px",
                            "font-mono text-[9.5px] tracking-wide uppercase",
                            selected
                                ? "border-accent/50 bg-accent/15 text-accent"
                                : "border-line bg-surface text-ink-4",
                        )}
                        style={{
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        }}
                    >
                        {text}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}
