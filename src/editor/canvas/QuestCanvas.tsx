/**
 * The quest graph canvas.
 *
 * The store stays the source of truth: nodes and edges are derived from the active
 * quest's graph, and only the changes that matter (position, selection, removal)
 * are written back. React Flow's own runtime fields never reach the document.
 */
import {
    Background,
    Position,
    type ConnectionLineComponentProps,
    type InternalNode,
    type Node as RFNode,
    SelectionMode,
    type OnNodeDrag,
    BackgroundVariant,
    Controls,
    MiniMap,
    ReactFlow,
    getBezierPath,
    useReactFlow,
    useStoreApi,
    type Connection,
    type NodeChange,
    type EdgeChange,
    type FinalConnectionState,
    type NodeTypes,
    type EdgeTypes,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { GraphNode, type GraphRFNode } from "./GraphNode";
import { boxSelectionResult, onlyDeselects, resolveSelection } from "./applyChanges";
import { TypedEdge, toRFEdge, type TypedRFEdge } from "./TypedEdge";
import { setWireMotion, subscribeWireMotion, wireMotionEnabled } from "./wireMotion";
import {
    decideHeldDrop,
    nodeIdUnderPointer,
    soleEdgeInto,
    soleMatchingInput,
    soleMatchingOutput,
} from "./wiring";
import { analyseGraph, summariseIssues } from "@/analysis/graph";
import { Icon } from "@/components/Icon";
import { useEditor, selectActiveQuest } from "@/store/editor";
import { categoryOf, nodeTypeDef, sourcesOf, CATEGORY_HEX } from "@/schema/registry";
import { HANDLE_STYLE } from "@/schema/edges";
import type { NodeType } from "@/schema/nodes";
import type { EdgeDoc } from "@/schema/edges";

const NODE_TYPES: NodeTypes = { qe: GraphNode };
const EDGE_TYPES: EdgeTypes = { typed: TypedEdge };

export interface CandidateConnection {
    source: string | null;
    target: string | null;
    sourceHandle?: string | null;
    targetHandle?: string | null;
}

export const DND_MIME = "application/x-qe-node-type";

/** What each colour of wire actually means, in one sentence, on hover. */
const WIRE_HELP: Record<"flow" | "condition" | "unlock" | "data", string> = {
    flow: "Then — the story runs on to the next node. This is the wire you use most.",
    condition:
        "When — a trigger node hands its event and conditions to whatever it is wired to, so the flow only continues if they match.",
    unlock:
        "Unlocks — an objective gates something: the thing on the other end only becomes available once that objective is done.",
    data: "Data — a value (quest data, an input answer, a random pick) is handed to the node on the other end to use in its text.",
};

/** #rrggbb → rgba(), for the one place that needs a see-through fill. */
export function withAlpha(hex: string, alpha: number): string {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * Where a socket actually is on screen, in flow coordinates. React Flow keeps
 * handle boxes relative to their node, so add the node's absolute position and
 * aim at the middle of the box.
 */
function handleAnchor(
    node: InternalNode<RFNode> | undefined,
    handleId: string,
    side: "source" | "target",
): { x: number; y: number } | null {
    const bounds = node?.internals.handleBounds?.[side];
    const h = bounds?.find((b) => b.id === handleId) ?? bounds?.[0];
    if (!node || !h) return null;
    return {
        x: node.internals.positionAbsolute.x + h.x + h.width / 2,
        y: node.internals.positionAbsolute.y + h.y + h.height / 2,
    };
}

function CanvasInner() {
    const quest = useEditor(selectActiveQuest);
    const addNode = useEditor((s) => s.addNode);
    const connect = useEditor((s) => s.connect);
    const removeNodes = useEditor((s) => s.removeNodes);
    const removeEdges = useEditor((s) => s.removeEdges);
    const setNodePositions = useEditor((s) => s.setNodePositions);
    const insertReroute = useEditor((s) => s.insertReroute);
    const beginTransient = useEditor((s) => s.beginTransient);
    const commitTransient = useEditor((s) => s.commitTransient);
    const select = useEditor((s) => s.select);
    const selection = useEditor((s) => s.selection);
    const setViewport = useEditor((s) => s.setViewport);
    const applyLayout = useEditor((s) => s.applyLayout);
    const { screenToFlowPosition, getInternalNode } = useReactFlow();
    // One animation drives every wire's dots; this is only its switch.
    const motion = useSyncExternalStore(
        subscribeWireMotion,
        wireMotionEnabled,
        () => false, // server/jsdom: nothing is animating anyway
    );


    // Analysis is cheap and pure, so it can run on every render.
    const analysis = useMemo(
        () => analyseGraph(quest?.graph.nodes ?? [], quest?.graph.edges ?? []),
        [quest],
    );
    const issuesByNode = useMemo(() => {
        const map = new Map<string, { label: string; detail: string; severity: "warn" | "danger" }>();
        for (const issue of analysis.issues) {
            // Worst issue wins if a node has several.
            const existing = map.get(issue.nodeId);
            if (!existing || (existing.severity === "warn" && issue.severity === "danger")) {
                map.set(issue.nodeId, issue);
            }
        }
        return map;
    }, [analysis]);
    const wrapperRef = useRef<HTMLDivElement>(null);
    /** Tracks the dragged group frame so children can follow it move by move. */
    const groupDrag = useRef<{ id: string; x: number; y: number } | null>(null);

    const onGroupAwareDragStart: OnNodeDrag<GraphRFNode> = (_e, node) => {
        beginTransient();
        if (node.data.doc.type === "layout.group") {
            groupDrag.current = { id: node.id, x: node.position.x, y: node.position.y };
        }
    };

    const onGroupAwareDrag: OnNodeDrag<GraphRFNode> = (_e, node) => {
        const drag = groupDrag.current;
        const gnodes = quest?.graph.nodes ?? [];
        if (!drag || drag.id !== node.id) return;
        const dx = node.position.x - drag.x;
        const dy = node.position.y - drag.y;
        if (dx === 0 && dy === 0) return;
        groupDrag.current = { id: node.id, x: node.position.x, y: node.position.y };
        const gd = node.data.doc.data as { w?: number; h?: number };
        const gw = gd.w ?? 360;
        const gh = gd.h ?? 240;
        const rect = { x0: node.position.x, y0: node.position.y, x1: node.position.x + gw, y1: node.position.y + gh };
        const moves: Record<string, { x: number; y: number }> = {};
        for (const n of gnodes) {
            if (n.id === node.id || n.type === "layout.group") continue;
            const size = measured[n.id] ?? { width: 240, height: 120 };
            const cx = n.position.x + size.width / 2;
            const cy = n.position.y + size.height / 2;
            if (cx >= rect.x0 && cx <= rect.x1 && cy >= rect.y0 && cy <= rect.y1) {
                moves[n.id] = { x: n.position.x + dx, y: n.position.y + dy };
            }
        }
        if (Object.keys(moves).length) setNodePositions(moves);
    };

    const onGroupAwareDragStop: OnNodeDrag<GraphRFNode> = () => {
        groupDrag.current = null;
        commitTransient();
    };

    /**
     * Which modifier is being held, tracked from the raw events on `window`.
     *
     * It has to be window, in the capture phase. React Flow calls
     * `setPointerCapture` on pointerdown, which retargets every later pointer
     * event to the captured element — a listener on our own wrapper sees the
     * pointerdown and then nothing, so the value goes stale mid-drag. (jsdom
     * implements neither PointerEvent nor setPointerCapture, which is why this
     * looked fine in tests while the editor was broken.)
     */
    const mods = useRef({ shift: false, ctrl: false });
    useEffect(() => {
        const read = (e: PointerEvent | MouseEvent | KeyboardEvent) => {
            mods.current = { shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey };
            if (e.type === "pointerdown") pointerDown.current = true;
            if (e.type === "pointerup") pointerDown.current = false;
        };
        const opts = { capture: true } as const;
        window.addEventListener("pointerdown", read, opts);
        window.addEventListener("pointermove", read, opts);
        window.addEventListener("pointerup", read, opts);
        window.addEventListener("keydown", read, opts);
        window.addEventListener("keyup", read, opts);
        return () => {
            window.removeEventListener("pointerdown", read, opts);
            window.removeEventListener("pointermove", read, opts);
            window.removeEventListener("pointerup", read, opts);
            window.removeEventListener("keydown", read, opts);
            window.removeEventListener("keyup", read, opts);
        };
    }, []);

    /**
     * The selection as it stood when a box drag began, plus which modifier was
     * held. While the box is open we compute the result from this ourselves:
     * React Flow only ever reports the nodes *inside* the box as selected, so
     * "add to selection" and especially "remove from selection" cannot come
     * from it — the subtract gesture does not exist upstream at all.
     */
    const boxStart = useRef<{ nodeIds: string[]; shift: boolean; ctrl: boolean } | null>(null);
    /** Node ids the open box currently covers, accumulated from its deltas. */
    const inBox = useRef<Set<string>>(new Set());
    /**
     * The selection captured from the drag-start reset, which arrives before
     * onSelectionStart. Handed to boxStart when the drag is confirmed.
     */
    const pendingBoxStart = useRef<string[] | null>(null);
    /** Whether a primary button is currently down, so we know a drag is live. */
    const pointerDown = useRef(false);

    // React Flow reports a node's measured size as a "dimensions" change. The
    // MiniMap only draws nodes whose user-node carries dimensions, so fold the
    // measurements back into the nodes we hand React Flow. Transient UI state —
    // never part of the saved document, and never a history entry.
    const [measured, setMeasured] = useState<Record<string, { width: number; height: number }>>({});

    const nodes = useMemo<GraphRFNode[]>(() => {
        const docs = [...(quest?.graph.nodes ?? [])];
        // Frames first. zIndex handles the canvas, but the MiniMap paints in
        // array order and ignores zIndex — with a frame last, its solid rect
        // covered every node inside it and the map looked empty.
        docs.sort((a, b) => Number(b.type === "layout.group") - Number(a.type === "layout.group"));
        return docs.map((doc) => ({
            id: doc.id,
            type: "qe" as const,
            position: doc.position,
            data: { doc, issue: issuesByNode.get(doc.id) },
            selected: selection.nodeIds.includes(doc.id),
            measured: measured[doc.id],
            // A frame is moved by its title bar only. Grabbing anywhere inside
            // it used to pick the whole group up, which made a reroute nodule
            // sitting inside one almost impossible to catch.
            dragHandle: doc.type === "layout.group" ? ".qe-group-grip" : undefined,
            // Only the title bar of a frame offers to be dragged, so only the
            // title bar shows the grab cursor.
            className: doc.type === "layout.group" ? "qe-frame-node" : undefined,
            // Frames sit behind everything; cards keep the default layer.
            zIndex: doc.type === "layout.group" ? -1 : 0,
        }));
    }, [quest, selection.nodeIds, issuesByNode, measured]);

    const edges = useMemo<TypedRFEdge[]>(() => {
        const list = quest?.graph.edges ?? [];
        return list.map((e) => {
            const sourceNode = quest?.graph.nodes.find((n) => n.id === e.source);
            const sockets = sourceNode ? sourcesOf(sourceNode) : [];
            const label = sockets.find((h) => h.id === e.sourceHandle)?.label;
            // Only label sockets when the source actually has several outputs,
            // otherwise every edge gets a redundant "Out" tag.
            const multi = sockets.length > 1;
            return toRFEdge(e, multi ? label : undefined);
        });
    }, [quest]);

    const selectedEdges = useMemo(
        () => edges.map((e) => (selection.edgeIds.includes(e.id) ? { ...e, selected: true } : e)),
        [edges, selection.edgeIds],
    );

    /** The live quest document, read straight from the store on demand. */
    const activeQuest = useCallback(() => {
        const st = useEditor.getState();
        return st.project.quests.find((x) => x.id === st.project.editor.activeQuestId);
    }, []);

    /**
     * Finish a wire the author pulled out of an input. The end still in the
     * graph is the one it came FROM — pulling a wire out of node 2 leaves it
     * hanging off node 1, so dropping it on node 3 must give 1 → 3, never
     * 2 → 3.
     */
    const dropHeldWire = useCallback(
        (held: { edge: EdgeDoc; nodeId: string }, dropNodeId: string | null, explicitHandle?: string | null) => {
            const q = activeQuest();
            const decision = decideHeldDrop(held, dropNodeId, explicitHandle ?? null, q?.graph.nodes ?? []);
            if (decision.action === "delete") return;
            const restore = () =>
                connect({
                    source: held.edge.source,
                    sourceHandle: held.edge.sourceHandle,
                    target: held.edge.target,
                    targetHandle: held.edge.targetHandle,
                });
            if (decision.action === "restore") {
                restore();
                // Only say something when the author aimed at a node and it
                // could not take the wire; putting it back silently after a
                // drop on its own node is the quieter, obvious behaviour.
                if (dropNodeId && dropNodeId !== held.nodeId) {
                    useEditor.getState().toast("That node has no matching input — wire put back.", "warn");
                }
                return;
            }
            const ok = connect({
                source: decision.source,
                sourceHandle: decision.sourceHandle,
                target: decision.target,
                targetHandle: decision.targetHandle,
            });
            if (!ok) restore();
        },
        [activeQuest, connect],
    );

    const onConnect = useCallback(
        (connection: Connection) => {
            const held = detached.current;
            detached.current = null;
            if (held) {
                // The drag began at an input, so React Flow reports the node
                // that was dropped on as the "source". The wire in hand already
                // has a source of its own; that node is the new destination.
                const dropped = connection.source === held.nodeId ? connection.target : connection.source;
                dropHeldWire(held, dropped, null);
                return;
            }
            const ok = connect({
                source: connection.source,
                sourceHandle: connection.sourceHandle ?? "",
                target: connection.target,
                targetHandle: connection.targetHandle ?? "",
            });
            if (!ok) {
                useEditor.getState().toast("Those sockets are different kinds of connection.", "warn");
            }
        },
        [connect, dropHeldWire],
    );

    /**
     * Grabbing a wire near its end (rather than at the socket) and dropping it
     * on nothing also deletes it — React Flow's own reconnect gesture.
     * `reconnectDone` distinguishes "dropped on a socket" from "dropped on the
     * pane": React Flow calls onReconnect only for the first.
     */
    const reconnectDone = useRef(false);

    const onReconnectStart = useCallback(() => {
        reconnectDone.current = false;
    }, []);

    const onReconnect = useCallback(
        (oldEdge: TypedRFEdge, connection: Connection) => {
            reconnectDone.current = true;
            removeEdges([oldEdge.id]);
            const ok = connect({
                source: connection.source,
                sourceHandle: connection.sourceHandle ?? "",
                target: connection.target,
                targetHandle: connection.targetHandle ?? "",
            });
            if (!ok) {
                useEditor.getState().toast("Those sockets are different kinds of connection.", "warn");
            }
        },
        [connect, removeEdges],
    );

    const onReconnectEnd = useCallback(
        (_event: MouseEvent | TouchEvent, edge: TypedRFEdge) => {
            if (!reconnectDone.current) removeEdges([edge.id]);
        },
        [removeEdges],
    );

    /**
     * Pulling a wire out of an input takes the existing wire with it: the
     * author is holding that wire now, so it leaves the graph the moment the
     * drag starts. Dropping it on a socket (or on a node that has one obvious
     * socket) plugs it back in somewhere; dropping it on nothing is how you
     * unplug something. If an input has several wires there is no single wire
     * to pick up, so those are left alone.
     */
    const detached = useRef<{ edge: EdgeDoc; nodeId: string } | null>(null);

    const onConnectStart = useCallback(
        (
            _event: unknown,
            params: { nodeId: string | null; handleId: string | null; handleType: string | null },
        ) => {
            detached.current = null;
            if (params.handleType !== "target" || !params.nodeId) return;
            const q = activeQuest();
            const held = soleEdgeInto(q?.graph.edges ?? [], params.nodeId, params.handleId ?? "");
            if (!held) return;
            detached.current = { edge: held, nodeId: params.nodeId };
            removeEdges([held.id]);
        },
        [activeQuest, removeEdges],
    );

    /**
     * Dropping a new wire on a node's body — not on one of its sockets — wires
     * it to that node's only matching input. If the node has several inputs of
     * that kind there is no single obvious answer, so nothing happens and the
     * author aims at the socket they mean.
     */
    const onConnectEnd = useCallback(
        (event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
            const held = detached.current;
            detached.current = null;
            if (state.isValid && !held) return; // landed on a socket; onConnect has it

            const overId = state.toNode?.id ?? nodeIdUnderPointer(event);

            if (held) {
                // The socket it was dropped on, if the author aimed at one.
                const onHandle = state.toHandle?.type === "target" ? state.toHandle.id : null;
                dropHeldWire(held, overId, onHandle);
                return;
            }

            const from = state.fromHandle;
            const q = activeQuest();
            if (!from || !from.nodeId || !q || !overId) return;
            const fromNode = q.graph.nodes.find((n) => n.id === from.nodeId);
            const overNode = q.graph.nodes.find((n) => n.id === overId);
            if (!fromNode || !overNode) return;

            // A brand-new wire dropped on a node's body takes the one socket on
            // that node it could possibly mean.
            const wire =
                from.type === "source"
                    ? {
                          source: from.nodeId,
                          sourceHandle: from.id ?? "",
                          target: overId,
                          targetHandle: soleMatchingInput(fromNode, from.id ?? "", overNode),
                      }
                    : {
                          source: overId,
                          sourceHandle: soleMatchingOutput(overNode, fromNode, from.id ?? ""),
                          target: from.nodeId,
                          targetHandle: from.id ?? "",
                      };
            if (!wire.sourceHandle || !wire.targetHandle) return;

            const ok = connect({
                source: wire.source,
                sourceHandle: wire.sourceHandle,
                target: wire.target,
                targetHandle: wire.targetHandle,
            });
            if (!ok) {
                useEditor.getState().toast("Those sockets are different kinds of connection.", "warn");
            }
        },
        [activeQuest, connect, dropHeldWire],
    );

    /**
     * Reject mismatched socket kinds up front so the connect cursor turns red.
     * Typed loosely on purpose: React Flow hands this a `Connection` while the
     * prop is generic over the edge type, and the two differ on optionality.
     */
    const isValidConnection = useCallback((connection: CandidateConnection) => {
        const q = useEditor.getState().project.quests.find(
            (x) => x.id === useEditor.getState().project.editor.activeQuestId,
        );
        if (!q) return false;
        if (connection.source === connection.target) return false;
        const sourceNode = q.graph.nodes.find((n) => n.id === connection.source);
        const targetNode = q.graph.nodes.find((n) => n.id === connection.target);
        if (!sourceNode || !targetNode) return false;
        const sourceKind = sourcesOf(sourceNode).find(
            (h) => h.id === connection.sourceHandle,
        )?.kind;
        const targetKind = nodeTypeDef(targetNode.type).targets.find(
            (h) => h.id === connection.targetHandle,
        )?.kind;
        return !!sourceKind && sourceKind === targetKind;
    }, []);

    /**
     * True only while the user is dragging a selection box.
     *
     * React Flow adds every wire touching a selected node to the selection
     * during a box drag (XYUserSelection in @xyflow/react 12.11.5 — it walks
     * connectionLookup for each selected node). The user's intent was the
     * nodes, so we drop those edge changes on the floor while the box is open.
     *
     * Done here rather than through defaultEdgeOptions.selectable, which looks
     * like the natural switch but is not: EdgeWrapper merges those options into
     * every edge, so `selectable: false` would also stop a plain click
     * selecting a wire.
     */
    const boxSelecting = useRef(false);

    /**
     * React Flow's own store, used to read `multiSelectionActive` — whether a
     * multi-select modifier is being held right now. There is no prop or
     * callback argument carrying it, and the value must be read at the moment a
     * change arrives rather than tracked with our own key listeners, which
     * would drift whenever the window loses focus mid-drag.
     */
    const rfStore = useStoreApi();
    /**
     * Whether the user is adding to / toggling the existing selection.
     *
     * Read from the live pointer or keyboard event rather than React Flow's
     * `multiSelectionActive`: that flag is driven by its own key listeners,
     * which miss the modifier when the key goes down before the canvas has
     * focus — the exact case here, since you press Ctrl and then click.
     * `multiSelectionActive` is still consulted as a fallback so the two agree
     * when React Flow did see the key.
     */
    const additive = useCallback(
        () => mods.current.shift || mods.current.ctrl || rfStore.getState().multiSelectionActive,
        [rfStore],
    );

    const onNodesChange = useCallback(
        (changes: NodeChange<GraphRFNode>[]) => {
            const positions: Record<string, { x: number; y: number }> = {};
            const removed: string[] = [];
            const dims: Record<string, { width: number; height: number }> = {};

            for (const change of changes) {
                if (change.type === "position" && change.position) {
                    positions[change.id] = change.position;
                } else if (change.type === "remove") {
                    removed.push(change.id);
                } else if (change.type === "dimensions" && change.dimensions) {
                    dims[change.id] = change.dimensions;
                }
            }

            if (Object.keys(positions).length > 0) setNodePositions(positions);
            if (removed.length > 0) removeNodes(removed);
            if (Object.keys(dims).length > 0) setMeasured((prev) => ({ ...prev, ...dims }));
            /*
             * The drag-start reset arrives BEFORE onSelectionStart runs
             * (Pane.onPointerMove calls resetSelectedElements() one line above
             * onSelectionStart?.()), so boxStart is still null for it. With a
             * modifier held that clear is never what the user asked for:
             * remember the selection it is trying to wipe, so the box branch
             * below can build on it.
             */
            if (!boxStart.current && onlyDeselects(changes) &&
                (mods.current.shift || mods.current.ctrl) && pointerDown.current) {
                pendingBoxStart.current = selection.nodeIds;
                return;
            }

            /*
             * While a box is open with a modifier held, the selection is ours
             * to compute: React Flow reports only what is inside the box, and
             * has no notion of a box that removes nodes.
             */
            const box = boxStart.current;
            if (box && (box.shift || box.ctrl)) {
                /*
                 * React Flow sends the boxed set as deltas, not a full list, so
                 * keep our own running set of what the box currently covers.
                 * It grows and shrinks as the pointer moves.
                 */
                for (const c of changes) {
                    if (c.type !== "select" || !c.id) continue;
                    if (c.selected) inBox.current.add(c.id);
                    else inBox.current.delete(c.id);
                }
                const next = boxSelectionResult(box.nodeIds, inBox.current, box);
                select({ nodeIds: next, edgeIds: selection.edgeIds });
                return;
            }
            // Fold the whole batch onto the running selection — see applyChanges.
            const next = resolveSelection("nodes", selection, changes, boxSelecting.current, additive());
            if (next) select(next);
        },
        [additive, removeNodes, select, selection, setNodePositions],
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange<TypedRFEdge>[]) => {
            const removed: string[] = [];
            for (const change of changes) {
                if (change.type === "remove") removed.push(change.id);
            }
            if (removed.length > 0) removeEdges(removed);
            const next = resolveSelection("edges", selection, changes, boxSelecting.current, additive());
            if (next) select(next);
        },
        [additive, removeEdges, select, selection],
    );

    /**
     * The line that follows the pointer mid-drag. For a wire pulled out of an
     * input it must hang from the node that FEEDS it — the end still in the
     * graph — not from the input it was just pulled out of, otherwise the
     * picture contradicts what dropping it will do.
     */
    const ConnectionLine = useCallback(
        (p: ConnectionLineComponentProps) => {
            const held = detached.current;
            let fromX = p.fromX;
            let fromY = p.fromY;
            let fromPosition = p.fromPosition;
            let colour = "var(--color-accent)";
            if (held) {
                const anchor = handleAnchor(
                    getInternalNode(held.edge.source),
                    held.edge.sourceHandle,
                    "source",
                );
                if (anchor) {
                    fromX = anchor.x;
                    fromY = anchor.y;
                    fromPosition = Position.Right;
                }
                colour = HANDLE_STYLE[held.edge.kind].color;
            }
            const [path] = getBezierPath({
                sourceX: fromX,
                sourceY: fromY,
                sourcePosition: fromPosition,
                targetX: p.toX,
                targetY: p.toY,
                targetPosition: p.toPosition,
                curvature: 0.28,
            });
            return (
                <g>
                    <path d={path} fill="none" stroke={colour} strokeWidth={2} />
                    <circle cx={p.toX} cy={p.toY} r={3.5} fill={colour} />
                </g>
            );
        },
        [getInternalNode],
    );

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            const type = event.dataTransfer.getData(DND_MIME) as NodeType | "";
            if (!type) return;
            const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
            // Nudge left so the pointer lands on the card, not its left socket.
            addNode(type, { x: position.x - 20, y: position.y - 24 });
        },
        [addNode, screenToFlowPosition],
    );

    if (!quest) {
        return (
            <div className="flex flex-1 items-center justify-center text-ink-4">
                No quest selected.
            </div>
        );
    }

    return (
        <div ref={wrapperRef} className="relative h-full w-full"
        >
            <ReactFlow
                nodes={nodes}
                edges={selectedEdges}
                nodeTypes={NODE_TYPES}
                edgeTypes={EDGE_TYPES}
                onConnect={onConnect}
                connectionLineComponent={ConnectionLine}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                onReconnectStart={onReconnectStart}
                onReconnect={onReconnect}
                onReconnectEnd={onReconnectEnd}
                // Grabbing a wire near its end picks that end up; 10px (the
                // default) is a needle to thread with a mouse.
                reconnectRadius={26}
                isValidConnection={isValidConnection}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStart={onGroupAwareDragStart}
                onNodeDrag={onGroupAwareDrag}
                onNodeDragStop={onGroupAwareDragStop}
                onDrop={onDrop}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                }}
                onSelectionStart={() => {
                    boxSelecting.current = true;
                    inBox.current = new Set();
                    boxStart.current = {
                        // React Flow has already cleared its own selection by
                        // now, so take ours from the store.
                        nodeIds: pendingBoxStart.current ?? useEditor.getState().selection.nodeIds,
                        shift: mods.current.shift,
                        ctrl: mods.current.ctrl,
                    };
                }}
                onSelectionEnd={() => {
                    boxSelecting.current = false;
                    boxStart.current = null;
                    pendingBoxStart.current = null;
                }}
                /*
                 * Ctrl+click raises `contextmenu` on Windows and Linux before
                 * any pointerup reaches the pane, so React Flow never cleared
                 * its selection rectangle and a translucent box was left on the
                 * canvas until the next click.
                 *
                 * Handling onPaneContextMenu does NOT fix it: React Flow's own
                 * pane handler returns early — and never calls ours — whenever
                 * panOnDrag includes button 2. Preventing the default here is
                 * what actually lets the pointerup through.
                 */
                onPaneContextMenu={(event) => event.preventDefault()}
                onPaneClick={() => select({ nodeIds: [], edgeIds: [] })}
                onEdgeDoubleClick={(_event, edge) => insertReroute(edge.id)}
                onMoveEnd={(_, viewport) => setViewport(quest.id, viewport)}
                defaultViewport={
                    quest.id in (useEditor.getState().project.editor.viewports ?? {})
                        ? useEditor.getState().project.editor.viewports[quest.id]
                        : { x: 0, y: 0, zoom: 0.85 }
                }
                deleteKeyCode={["Backspace", "Delete"]}
                selectionKeyCode={null}
                // Middle-mouse pans. Right-drag used to pan as well, but that
                // is what made React Flow swallow the context-menu event and
                // strand its selection rectangle on a ctrl+click (see above).
                panOnDrag={[1]}
                selectionOnDrag
                selectionMode={SelectionMode.Partial}
                multiSelectionKeyCode={["Meta", "Shift", "Control"]}
                fitView={nodes.length > 0}
                fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
                minZoom={0.15}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
                className="bg-canvas"
            >
                <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#1c2029" />
                <Controls position="bottom-left" showInteractive={false} />
                <MiniMap
                    position="bottom-right"
                    pannable
                    zoomable
                    nodeColor={(n) => {
                        const doc = (n.data as { doc?: { type: NodeType; data?: { color?: string } } })?.doc;
                        if (!doc) return "#333";
                        // A frame is a container, not a card: draw it as a faint
                        // wash in its own colour so the nodes inside stay visible.
                        if (doc.type === "layout.group") {
                            return withAlpha(doc.data?.color || CATEGORY_HEX.layout, 0.22);
                        }
                        // Concrete hex per category, matching the node cards'
                        // accent stripe (see CATEGORY_HEX).
                        return CATEGORY_HEX[categoryOf(doc.type).id];
                    }}
                    nodeStrokeWidth={0}
                    maskColor="rgba(8, 9, 13, 0.72)"
                />
            </ReactFlow>

            {/* Canvas actions */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <button
                    type="button"
                    className="btn-default pointer-events-auto"
                    onClick={applyLayout}
                    disabled={!quest || quest.graph.nodes.length === 0}
                    title="Arrange the graph left to right, by how far each node sits from its entry point"
                >
                    <Icon name="branch" size={13} />
                    Tidy up
                </button>
                <button
                    type="button"
                    aria-pressed={motion}
                    className="btn-default pointer-events-auto"
                    onClick={() => setWireMotion(!motion)}
                    title={
                        motion
                            ? "Wires show which way the story runs by drifting dots along themselves. Click to hold them still."
                            : "Wire dots are held still. Click to let them drift again, showing which way the story runs."
                    }
                >
                    <Icon name={motion ? "play" : "pause"} size={13} />
                    {motion ? "Wires moving" : "Wires still"}
                </button>
                <span
                    className={
                        "pointer-events-none rounded-md border px-2 py-1 text-[10.5px] " +
                        (analysis.issues.some((i) => i.severity === "danger")
                            ? "border-danger/40 bg-danger/10 text-danger"
                            : analysis.issues.length > 0
                              ? "border-warn/40 bg-warn/10 text-warn"
                              : "border-line bg-surface/90 text-ink-4")
                    }
                    title={analysis.issues.map((i) => i.detail).join("\n\n") || "Nothing looks wrong."}
                >
                    {summariseIssues(analysis)}
                </span>
            </div>

            {/* Socket legend */}
            <div className="absolute top-3 right-3 flex flex-col gap-1 rounded-md border border-line bg-surface/90 px-2.5 py-2 backdrop-blur">
                {(["flow", "condition", "unlock", "data"] as const).map((kind) => (
                    <div key={kind} className="flex items-center gap-2" title={WIRE_HELP[kind]}>
                        <span className="relative block h-[7px] w-5">
                            <span
                                className="absolute top-1/2 left-0 block h-0 w-5 -translate-y-1/2 rounded"
                                style={{ borderTop: `2px solid ${HANDLE_STYLE[kind].color}` }}
                            />
                            <span
                                className="absolute top-1/2 left-2 block size-[5px] -translate-y-1/2 rounded-full"
                                style={{ background: HANDLE_STYLE[kind].color }}
                            />
                        </span>
                        <span className="text-[10px] tracking-wide text-ink-4 uppercase">
                            {HANDLE_STYLE[kind].label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * The canvas itself.
 *
 * Deliberately *not* wrapped in its own `ReactFlowProvider`: `App` hoists a
 * single provider above the palette, the canvas and the inspector so that all
 * three share one React Flow store. The palette needs `getViewport()` to know
 * where the canvas centre is, and a nested provider would hand it an empty one.
 */
export function QuestCanvas() {
    return <CanvasInner />;
}
