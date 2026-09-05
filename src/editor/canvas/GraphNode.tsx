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

            {/* category accent */}
            <span
                className="absolute inset-y-0 left-0 w-[3px] rounded-l-[7px]"
                style={{ background: category.color }}
                aria-hidden
            />

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
