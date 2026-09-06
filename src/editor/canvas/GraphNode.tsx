/**
 * The single custom node component. Every node type in the registry renders
 * through it, so card chrome, socket layout and selection styling stay consistent
 * and new node types need no new component.
 */
import { Handle, NodeResizer, Position, useConnection, type Node, type NodeProps } from "@xyflow/react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import { categoryOf, nodeTypeDef, sourcesOf } from "@/schema/registry";
import { selectActiveQuest, useEditor } from "@/store/editor";
import { HANDLE_STYLE, type EdgeKind } from "@/schema/edges";
import type { NodeDoc } from "@/schema/nodes";
import { summarize } from "./summarize";
import { edgesAtHandle } from "./wiring";

export interface GraphNodeData extends Record<string, unknown> {
    doc: NodeDoc;
    /** The most serious problem the analysis found with this node, if any. */
    issue?: { label: string; detail: string; severity: "warn" | "danger" };
}

export type GraphRFNode = Node<GraphNodeData, "qe">;

/** Vertical placement for the nth of `count` sockets on one side. */
function socketTop(index: number, count: number): string {
    if (count === 1) return "50%";
    const span = 60; // percent of the card the sockets occupy
    const start = (100 - span) / 2;
    return `${start + (span / (count - 1)) * index}%`;
}

export function GraphNode({ data, selected }: NodeProps<GraphRFNode>) {
    const doc = data.doc;
    const issue = data.issue;
    const def = nodeTypeDef(doc.type);
    const sources = useMemo(() => sourcesOf(doc), [doc]);
    const category = categoryOf(doc.type);
    const quest = useEditor(selectActiveQuest);
    const removeEdges = useEditor((st) => st.removeEdges);

    /**
     * Ctrl+click (or Cmd+click) a socket to unplug it.
     *
     * The complement to dragging a wire off: this clears the socket outright,
     * without having to catch the loose end. An output that fans out to
     * several nodes loses all of them, which is what "unplug this socket"
     * means.
     */
    const unplug = (
        event: React.PointerEvent,
        handleId: string,
        side: "source" | "target",
    ) => {
        if (!(event.ctrlKey || event.metaKey) || event.button !== 0) return;
        const attached = edgesAtHandle(quest?.graph.edges ?? [], doc.id, handleId, side);
        if (attached.length === 0) return;
        // React Flow would otherwise read this as the start of a new wire.
        event.preventDefault();
        event.stopPropagation();
        removeEdges(attached.map((e) => e.id));
    };
    const updateNodeData = useEditor((s) => s.updateNodeData);
    const lines = useMemo(() => summarize(doc, quest ?? undefined).filter(Boolean), [doc, quest]);
    const [hovered, setHovered] = useState(false);
    const [beatExpanded, setBeatExpanded] = useState(false);
    const connecting = useConnection((c) => c.inProgress);

    // Socket names are useful exactly when you are about to wire something. At
    // rest they are clutter that competes with the node's own summary, so they
    // only appear on hover, selection, or while a wire is being dragged.
    const showLabels = selected || hovered || connecting;

    const isNote = doc.type === "flow.note";

    if (doc.type === "layout.group") {
        const gd = doc.data as { label?: string; comment?: string; w?: number; h?: number; color?: string };
        const color = gd.color || "#64748b";
        return (
            <>
                <NodeResizer
                    isVisible={!!selected}
                    minWidth={160}
                    minHeight={120}
                    // 30% larger than React Flow's 5px default, so the corners
                    // are grabbable without hunting for them.
                    handleStyle={{ width: 9, height: 9, borderRadius: 3 }}
                    onResize={(_e, params) =>
                        updateNodeData(doc.id, {
                            w: Math.round(params.width),
                            h: Math.round(params.height),
                        })
                    }
                />
                <div
                    className={cn(
                        "overflow-hidden rounded-lg border-2 border-dashed",
                        selected ? "bg-accent/5" : "bg-surface-2/30",
                    )}
                    style={{
                        width: gd.w ?? 360,
                        height: gd.h ?? 240,
                        borderColor: selected
                            ? "var(--color-accent)"
                            : `color-mix(in srgb, ${color} 65%, transparent)`,
                    }}
                >
                    {/* Title bar: spans the frame and carries the group's name. */}
                    <div
                        className="qe-group-grip flex cursor-grab items-center gap-1.5 px-2.5 py-1.5 active:cursor-grabbing"
                        style={{ background: color }}
                        title={`${gd.label || "Group"} — drag this bar to move the frame and everything inside it`}
                    >
                        <Icon name="layers" size={11} className="shrink-0" style={{ color: readableOn(color) }} />
                        <span
                            className="truncate text-[12px] font-semibold tracking-wide"
                            style={{ color: readableOn(color) }}
                        >
                            {gd.label || "Group"}
                        </span>
                    </div>
                    {gd.comment && (
                        <p className="px-3 py-2 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-ink-3">
                            {gd.comment}
                        </p>
                    )}
                </div>
            </>
        );
    }

    if (doc.type === "flow.reroute") {
        // One visible dot, two stacked sockets: wires arrive at and leave from
        // the same point, and the ring around it is the node's own grab area.
        const socketStyle: React.CSSProperties = {
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
        };
        return (
            <div
                className="qe-reroute relative flex size-[42px] items-center justify-center"
                title="Reroute — wires pass through here unchanged. Drag the ring to move it; drag from the dot to wire it onwards."
            >
                {/* Shows where the nodule can be grabbed: everything inside this
                    outline moves the nodule, the dot in the middle starts a wire. */}
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full border-2"
                    style={{ borderColor: "rgba(255, 255, 255, 0.5)" }}
                />
                <div
                    className={cn(
                        "size-[22px] rounded-full border-2 bg-surface transition-colors",
                        selected ? "border-accent ring-2 ring-accent/40" : "border-line-strong hover:border-accent",
                    )}
                />
                <Handle
                    id="in"
                    type="target"
                    position={Position.Left}
                    data-kind="flow"
                    title="In"
                    style={socketStyle}
                />
                <Handle
                    id="out"
                    type="source"
                    position={Position.Right}
                    data-kind="flow"
                    title="Out — drag as many wires from here as you like"
                    style={{ ...socketStyle, zIndex: 1 }}
                />
            </div>
        );
    }

    if (isNote) {
        return (
            <div
                className={cn(
                    "rounded-md border border-dashed px-3 py-2.5",
                    "bg-warn/8 text-warn/85 shadow-none",
                    selected && "border-warn ring-2 ring-warn/40",
                )}
                style={{ width: (doc.data as { width?: number }).width ?? 240 }}
            >
                <div className="whitespace-pre-wrap break-words text-[12px] leading-relaxed">
                    {(doc.data as { text?: string }).text || "Empty note"}
                </div>
            </div>
        );
    }

    if (doc.type === "flow.beat") {
        const bd = doc.data as {
            title?: string;
            text?: string;
            color?: string;
            width?: number;
            choices?: { id?: string; label?: string; note?: string }[];
        };
        const color = bd.color || "#64748b";
        const text = bd.text || "";
        /* The body sits on a translucent tint over the dark canvas, so the
           surface is always dark — a fixed light text reads on any accent
           colour, where readableOn(color) would wrongly pick dark for bright
           shades (green, amber, cyan). */
        const onCard = "#f2f4f7";
        /* The card shows a 250-char teaser by default; "… more" expands to the
           full text, and only once that passes 800 chars does the body scroll
           (so a long beat never takes over the canvas). */
        const COLLAPSE_CHARS = 250;
        const EXPAND_CHARS = 800;
        const showMore = text.length > COLLAPSE_CHARS;
        const needsScroll = beatExpanded && text.length > EXPAND_CHARS;
        const bodyText = beatExpanded ? text : text.slice(0, COLLAPSE_CHARS).trimEnd();
        return (
            <div
                className={cn(
                    "relative w-fit rounded-lg border",
                    "transition-[border-color,box-shadow] duration-150",
                    selected ? "border-transparent ring-2" : "border-line hover:border-line-strong",
                )}
                style={{
                    width: bd.width ?? 280,
                    borderColor: selected ? "var(--color-accent)" : color,
                    borderLeftWidth: 3,
                    background: `color-mix(in srgb, ${color} 14%, transparent)`,
                }}
            >
                {/* planning-only badge */}
                <span
                    title="A planning beat — stripped from the exported mod, never runs"
                    className="absolute -top-2 -right-2 z-10 flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8.5px] font-semibold tracking-wide uppercase shadow-node"
                    style={{ borderColor: color, background: color, color: readableOn(color) }}
                >
                    <Icon name="flag" size={9} />
                    plan
                </span>

                <div className="px-3 pt-2.5 pb-2 pl-4">
                    <div className="truncate text-[12.5px] leading-tight font-semibold" style={{ color: onCard }}>
                        {bd.title || "Story Beat"}
                    </div>
                    <div className="mt-1 text-[11px] leading-relaxed" style={{ color: onCard }}>
                        <div
                            className={cn(
                                "whitespace-pre-wrap break-words",
                                // Only a beat past 800 chars gets a scrollbar; the
                                // 250-teaser / 800-expanded previews flow freely.
                                needsScroll && "max-h-[300px] overflow-y-auto pr-1",
                            )}
                        >
                            {bodyText || "Empty beat — open the inspector to write it."}
                        </div>
                        {showMore && (
                            <button
                                type="button"
                                className="mt-0.5 font-medium underline decoration-dotted underline-offset-2"
                                style={{ color: onCard }}
                                onClick={() => setBeatExpanded(!beatExpanded)}
                            >
                                {beatExpanded ? "… less" : "… more"}
                            </button>
                        )}
                    </div>

                    {(bd.choices ?? []).length > 0 && (
                        <div className="mt-2 space-y-1.5">
                            {(bd.choices ?? []).map((c) => (
                                /* Each choice carries its own output socket, so an
                                   author can wire that exact branch onward. The row
                                   is `relative` so the handle sits on its right edge. */
                                <div
                                    key={c.id}
                                    className="relative flex items-stretch rounded-md border px-2 py-1"
                                    style={{
                                        borderColor: color,
                                        background: `color-mix(in srgb, ${color} 8%, transparent)`,
                                    }}
                                >
                                    <div className="min-w-0 flex-1 pr-6">
                                        <div className="text-[10.5px] leading-snug font-semibold" style={{ color: onCard }}>
                                            {c.label || "Choice"}
                                        </div>
                                        {c.note && (
                                            <div className="mt-0.5 text-[10px] leading-snug" style={{ color: onCard, opacity: 0.8 }}>
                                                {c.note}
                                            </div>
                                        )}
                                    </div>
                                    <Handle
                                        id={`choice-${c.id}`}
                                        type="source"
                                        position={Position.Right}
                                        data-kind="flow"
                                        title={c.label || "Choice"}
                                        onPointerDownCapture={(e) => unplug(e, `choice-${c.id}`, "source")}
                                        style={{ top: "50%" }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sockets: the beat is a planning pass-through, so it can be
                    wired among reroute / branch / sequence. The branch choices
                    carry their own outputs (rendered on each row); the generic
                    "Out" stays at card level so the beat itself continues. */}
                {def.targets.map((handle, i) => (
                    <Handle
                        key={handle.id}
                        id={handle.id}
                        type="target"
                        position={Position.Left}
                        data-kind={handle.kind}
                        title={handle.label}
                        onPointerDownCapture={(e) => unplug(e, handle.id, "target")}
                        style={{ top: socketTop(i, def.targets.length) }}
                    />
                ))}
                <Handle
                    id="out"
                    type="source"
                    position={Position.Right}
                    data-kind="flow"
                    title="Out — the beat continues here"
                    onPointerDownCapture={(e) => unplug(e, "out", "source")}
                    style={{ top: "50%" }}
                />
            </div>
        );
    }

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={cn(
                "relative w-60 rounded-lg border bg-surface shadow-node",
                "transition-[border-color,box-shadow] duration-150",
                selected ? "border-transparent ring-2" : "border-line hover:border-line-strong",
            )}
            style={
                {
                    // Grow with the socket count so a node with many outputs
                    // (a Sequence) never crams its dots on top of each other.
                    minHeight: 48 + Math.max(0, Math.max(sources.length, def.targets.length) - 2) * 26,
                    // The category accent is the card's left border, so it follows
                    // the rounded outline exactly — an overlaid bar pokes past the
                    // corner radius. 3px reads as the rail, inside the 1px chroma.
                    borderLeftWidth: 3,
                    borderLeftColor: category.color,
                    ...(selected
                        ? {
                              ["--tw-ring-color" as string]: category.color,
                              borderColor: category.color,
                          }
                        : null),
                } as React.CSSProperties
            }
        >
            {/* problem badge — the shortest possible route from "something is
                wrong" to "here is what and why" */}
            {issue && (
                <span
                    title={issue.detail}
                    className={
                        "absolute -top-2 -right-2 z-10 flex items-center gap-1 rounded-full border px-1.5 py-0.5 " +
                        "text-[9.5px] font-semibold tracking-wide uppercase shadow-node " +
                        (issue.severity === "danger"
                            ? "border-danger/50 bg-danger/90 text-void"
                            : "border-warn/50 bg-warn/90 text-void")
                    }
                >
                    <Icon name="alert" size={9} />
                    {issue.label}
                </span>
            )}

            <div className="flex items-start gap-2 px-3 pt-2.5 pb-2 pl-4">
                <span
                    className="mt-px flex size-6 shrink-0 items-center justify-center rounded-md"
                    style={{ background: `color-mix(in srgb, ${category.color} 16%, transparent)`, color: category.color }}
                    aria-hidden
                >
                    <Icon name={def.icon} size={14} />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] leading-tight font-semibold text-ink">
                        {def.label}
                    </div>
                </div>
            </div>

            {lines.length > 0 && (
                <div className="space-y-0.5 px-3 pb-2.5 pl-4">
                    {lines.slice(0, 3).map((line, i) => (
                        <div
                            key={i}
                            className={cn(
                                "truncate font-mono text-[11px] leading-snug",
                                i === 0 ? "text-ink-2" : "text-ink-4",
                            )}
                            title={line}
                        >
                            {line}
                        </div>
                    ))}
                </div>
            )}

            {/*
                Ctrl+click a socket to unplug whatever is attached to it.
                Capture phase and stopPropagation, because React Flow treats a
                pointerdown on a handle as the start of a new connection drag —
                left alone it would begin drawing a wire instead.
            */}
            {/* Sockets. `data-kind` drives the colour, and each carries the
                handle's plain-English name as a native tooltip so the author
                learns what a socket means by hovering it. */}
            {def.targets.map((handle, i) => (
                <Handle
                    key={handle.id}
                    id={handle.id}
                    type="target"
                    position={Position.Left}
                    data-kind={handle.kind}
                    title={handle.label}
                    onPointerDownCapture={(e) => unplug(e, handle.id, "target")}
                    style={{ top: socketTop(i, def.targets.length) }}
                />
            ))}

            {sources.map((handle, i) => (
                <Handle
                    key={handle.id}
                    id={handle.id}
                    type="source"
                    position={Position.Right}
                    data-kind={handle.kind}
                    title={handle.label}
                    onPointerDownCapture={(e) => unplug(e, handle.id, "source")}
                    style={{ top: socketTop(i, sources.length) }}
                />
            ))}

            {/* Socket names, on the same vertical rule as their dot but OUTSIDE
                the card so they never sit on top of the node's own text. Shown
                only on hover / selection / while a wire is being dragged. */}
            {showLabels &&
                def.targets.length > 1 &&
                def.targets.map((h, i) => (
                    <SocketLabel
                        key={h.id}
                        side="left"
                        top={socketTop(i, def.targets.length)}
                        kind={h.kind}
                    >
                        {h.label}
                    </SocketLabel>
                ))}
            {showLabels &&
                sources.length > 1 &&
                sources.map((h, i) => (
                    <SocketLabel
                        key={h.id}
                        side="right"
                        top={socketTop(i, sources.length)}
                        kind={h.kind}
                    >
                        {h.label}
                    </SocketLabel>
                ))}
        </div>
    );
}

/**
 * Black or white text for a coloured title bar, picked by perceived luminance
 * so a light frame colour never leaves the group's name unreadable.
 */
export function readableOn(hex: string): string {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return "#08090d";
    const n = parseInt(m[1], 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.42 ? "#08090d" : "#f5f7fa";
}

function SocketLabel({
    side,
    top,
    kind,
    children,
}: {
    side: "left" | "right";
    top: string;
    kind: EdgeKind;
    children: React.ReactNode;
}) {
    return (
        <span
            className={cn(
                "pointer-events-none absolute whitespace-nowrap rounded px-1 py-px",
                "font-mono text-[8.5px] leading-tight tracking-wide uppercase",
            )}
            style={{
                top,
                color: HANDLE_STYLE[kind].color,
                background: "color-mix(in srgb, var(--color-canvas) 82%, transparent)",
                // Sit in the gutter beside the card, vertically centred on the dot.
                ...(side === "left"
                    ? { right: "100%", marginRight: 10, transform: "translateY(-50%)" }
                    : { left: "100%", marginLeft: 10, transform: "translateY(-50%)" }),
            }}
        >
            {children}
        </span>
    );
}
