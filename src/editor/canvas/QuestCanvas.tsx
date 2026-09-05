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
import { alignPositions, distributePositions, GRID } from "./arrange";
import { nodeSize } from "./nodeSize";
import { NodeSearchPopover } from "./NodeSearchPopover";
import { entrySocketFor } from "./nodeSearch";
import {
    nudgeWirePhysics,
    startWirePhysics,
    stopWirePhysics,
    wirePhysicsState,
    type WireEnds,
} from "./wirePhysics";
import { dismissWireGhosts, spawnWireGhost } from "./wireGhost";
import type { EdgeKind } from "@/schema/edges";
import { setSnapEnabled, snapEnabled, subscribeSnap } from "./snapGrid";
import {
    setWirePhysicsEnabled,
    subscribeWirePhysics,
    wirePhysicsEnabled,
} from "./wirePhysicsPref";
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
/** Stable identity: a fresh array each render would churn React Flow's store. */
const SNAP_GRID: [number, number] = [GRID, GRID];

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
    const arrangeNodes = useEditor((s) => s.arrangeNodes);
    const insertReroute = useEditor((s) => s.insertReroute);
    const beginTransient = useEditor((s) => s.beginTransient);
    const commitTransient = useEditor((s) => s.commitTransient);
    const select = useEditor((s) => s.select);
    const selection = useEditor((s) => s.selection);
    const setViewport = useEditor((s) => s.setViewport);
    const applyLayout = useEditor((s) => s.applyLayout);
    const { screenToFlowPosition, getInternalNode } = useReactFlow();
    // Per-author editor preferences, kept out of the project document.
    const snap = useSyncExternalStore(subscribeSnap, snapEnabled, () => false);
    const physics = useSyncExternalStore(
        subscribeWirePhysics,
        wirePhysicsEnabled,
        () => false, // server/jsdom: nothing is animating anyway
    );
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

    /** React Flow's own store: node geometry, the selection box, modifier state. */
    const rfStore = useStoreApi();
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
            /*
             * The gesture is over, so the loop must end here — not in the
             * component's cleanup. Every branch below can return early, and
             * one of them opens the node search, which would otherwise leave
             * a frame scheduled for a wire that no longer exists.
             */
            /*
             * Remember where the wire was and how far it was hanging, then
             * stop the loop. Whether that becomes a ghost depends on how the
             * gesture ended, which the branches below decide: a drop that
             * opens the node search must NOT ghost, because the wire is still
             * pending — the author is choosing what to connect it to.
             */
            const restingSag = wirePhysicsState().sag;
            const releasedAt = { ...heldEnds.current };
            stopWirePhysics();
            const ghostTheWire = () => {
                if (Math.abs(restingSag) <= 0.5) return;
                const layer = wrapperRef.current?.querySelector(".react-flow__edges");
                if (!layer) return;
                spawnWireGhost({
                    layer: layer as SVGElement,
                    from: { x: releasedAt.sourceX, y: releasedAt.sourceY },
                    to: { x: releasedAt.targetX, y: releasedAt.targetY },
                    sag: restingSag,
                    colour: detached.current
                        ? HANDLE_STYLE[detached.current.edge.kind].color
                        : "var(--color-accent)",
                });
            };
            const held = detached.current;
            detached.current = null;
            if (state.isValid && !held) {
                // Landed on a socket; onConnect has it. No ghost: the wire
                // stayed, it did not go anywhere.
                return;
            }

            const overId = state.toNode?.id ?? nodeIdUnderPointer(event);

            if (held) {
                // The socket it was dropped on, if the author aimed at one.
                const onHandle = state.toHandle?.type === "target" ? state.toHandle.id : null;
                dropHeldWire(held, overId, onHandle);
                if (!overId) ghostTheWire(); // let go over nothing: it snaps back
                return;
            }

            const from = state.fromHandle;
            const q = activeQuest();
            if (!from || !from.nodeId || !q) {
                ghostTheWire();
                return;
            }

            /*
             * Dropped on empty canvas: offer to create the node the wire was
             * reaching for, rather than discarding the gesture. Blender's best
             * add-node affordance, and the natural pair to right-click search.
             */
            if (!overId) {
                const fromDoc = q.graph.nodes.find((n) => n.id === from.nodeId);
                if (!fromDoc) {
                    ghostTheWire();
                    return;
                }
                const kind =
                    from.type === "source"
                        ? sourcesOf(fromDoc).find((h) => h.id === from.id)?.kind
                        : nodeTypeDef(fromDoc.type).targets.find((h) => h.id === from.id)?.kind;
                if (!kind) {
                    ghostTheWire();
                    return;
                }
                const point = "changedTouches" in event ? event.changedTouches[0] : event;
                setPendingWire({
                    nodeId: from.nodeId,
                    handleId: from.id ?? "",
                    kind,
                    direction: from.type === "source" ? "source" : "target",
                });
                setSearchAt({ x: point.clientX, y: point.clientY });
                /*
                 * Deliberately no ghost. The wire is pending, not cancelled:
                 * the author is choosing what to plug it into. If they pick
                 * something the node arrives connected and there was never
                 * anything to snap back; if they dismiss the search, the
                 * ghost plays then (see `closeSearch`).
                 */
                pendingGhost.current = ghostTheWire;
                return;
            }
            const fromNode = q.graph.nodes.find((n) => n.id === from.nodeId);
            const overNode = q.graph.nodes.find((n) => n.id === overId);
            if (!fromNode || !overNode) {
                ghostTheWire();
                return;
            }

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

    /**
     * Line the selected nodes up, or even out their spacing.
     *
     * One `arrangeNodes` call for the whole group: writing per node would
     * re-render the graph once per node and, on a large selection, show the
     * nodes crawling into place one at a time.
     */
    const arrange = useCallback(
        (what: "row" | "column" | "spread-row" | "spread-column") => {
            const q = activeQuest();
            if (!q) return;
            /*
             * Sizes are COMPUTED, not measured (r100).
             *
             * Reading them back failed three times: our own `measured` map was
             * empty at click time, and React Flow's `nodeLookup` only carries
             * sizes once its ResizeObserver has run. A missing size counts as
             * zero, which turns "line up the centres" into "line up the
             * top-left corners" — the bug in every screenshot so far.
             *
             * The cards do not need measuring: their width is fixed and their
             * height follows the same formula the component renders with. See
             * nodeSize.ts, whose constants are asserted against GraphNode.
             */
            const chosen = q.graph.nodes
                .filter((n) => selection.nodeIds.includes(n.id))
                .map((n) => ({ ...n, size: nodeSize(n, q) }));
            if (chosen.length < 2) return;
            /*
             * Snapping is handed to alignPositions so it can snap the shared
             * LINE once. Snapping each card's corner afterwards would shift
             * cards of different sizes back off that line by up to half a grid
             * square each — which is precisely how r97's centring came to look
             * as though it had done nothing (r98).
             *
             * Spreading is left unsnapped: its whole purpose is equal gaps, and
             * rounding each position to the grid would make them unequal again.
             */
            const moved =
                what === "row" || what === "column"
                    ? alignPositions(chosen, what, snapEnabled() ? GRID : 0)
                    : distributePositions(chosen, what === "spread-row" ? "row" : "column");
            arrangeNodes(moved);
        },
        [activeQuest, arrangeNodes, measured, rfStore, selection.nodeIds],
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
    /**
     * Where the held wire's two ends are right now, in flow coordinates.
     *
     * A ref, not state. React Flow re-renders `ConnectionLine` on every
     * pointer move during a drag, and the physics loop needs those numbers at
     * its own frame rate — reading them from here means the loop never touches
     * React and React never waits on the loop.
     */
    const heldEnds = useRef<WireEnds>({ sourceX: 0, sourceY: 0, targetX: 0, targetY: 0 });
    const heldPath = useRef<SVGPathElement | null>(null);
    /**
     * A ghost held back while the node search is open.
     *
     * Dropping a wire on empty canvas opens the search instead of cancelling
     * the wire, so the snap-back is deferred: played if the author dismisses
     * the search, discarded if they pick a node — in which case the wire is
     * connected and there is nothing to snap back from.
     */
    const pendingGhost = useRef<(() => void) | null>(null);

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

            /* Feed the loop rather than re-rendering with the new numbers. */
            heldEnds.current.sourceX = fromX;
            heldEnds.current.sourceY = fromY;
            heldEnds.current.targetX = p.toX;
            heldEnds.current.targetY = p.toY;
            /* The loop parks itself once the spring rests; the wire is still
               held, so a move has to wake it. No-op while it is running. */
            nudgeWirePhysics();

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
                    {/*
                        No `d` prop.

                        React re-renders this component on every pointer move,
                        so a `d` prop would rewrite the attribute from the
                        straight bezier each frame and wipe whatever the
                        physics loop had just written — React winning the race
                        sixty times a second, which is precisely why the wire
                        looked completely static.

                        The attribute is owned by one writer instead: the ref
                        callback paints the first frame, and from then on the
                        loop owns it. When physics is switched off,
                        `startWirePhysics` paints the straight path once and
                        never starts a loop, so the same single-writer rule
                        gives exactly today's behaviour.
                    */}
                    <path
                        ref={(el) => {
                            heldPath.current = el;
                            if (!el) return;
                            el.setAttribute("d", path);
                            startWirePhysics({ path: el, read: () => heldEnds.current });
                        }}
                        fill="none"
                        stroke={colour}
                        strokeWidth={2}
                    />
                    <circle cx={p.toX} cy={p.toY} r={3.5} fill={colour} />
                </g>
            );
        },
        [getInternalNode],
    );

    /*
     * The drag is over: stop the loop. React Flow unmounts the connection line
     * itself, so this only has to release the frame — and it must run however
     * the drag ended, including when the author dropped on empty canvas and
     * the node search opened.
     */
    useEffect(() => {
        return () => {
            stopWirePhysics();
            // Ghosts outlive the gesture by design, so they cannot be left to
            // their own timers when the canvas goes away.
            dismissWireGhosts();
        };
    }, []);

    /**
     * The add-a-node search popover, anchored at the point the author asked
     * for it. Component state, not the store: it is transient UI, and a store
     * field would land in the undo history (the r96 lesson from the snap
     * toggle).
     */
    const [searchAt, setSearchAt] = useState<{ x: number; y: number } | null>(null);
    /**
     * Set when the search was opened by dropping a wire on empty canvas, so
     * the chosen node can be connected to the wire's other end.
     */
    const [pendingWire, setPendingWire] = useState<{
        nodeId: string;
        handleId: string;
        kind: EdgeKind;
        direction: "source" | "target";
    } | null>(null);

    /**
     * Right-click has to serve two masters: a *drag* pans the canvas, a *click*
     * opens the search. Distinguish them by distance, not by timing — a slow
     * deliberate click is still a click, and a timer would make the fast case
     * feel laggy.
     */
    const rightDown = useRef<{ x: number; y: number } | null>(null);
    /** Farther than this between press and release counts as a pan, not a click. */
    const RIGHT_CLICK_SLOP = 4;

    const openSearchAt = useCallback((x: number, y: number) => {
        setPendingWire(null);
        setSearchAt({ x, y });
    }, []);

    const closeSearch = useCallback(() => {
        /*
         * Dismissed without choosing, so the wire really was abandoned: play
         * the snap-back that `onConnectEnd` held back.
         */
        pendingGhost.current?.();
        pendingGhost.current = null;
        setSearchAt(null);
        setPendingWire(null);
    }, []);

    /** Add the chosen type where the popover was opened, then close it. */
    const addFromSearch = useCallback(
        (type: NodeType) => {
            if (!searchAt) return;
            const position = screenToFlowPosition(searchAt);
            // Same nudge as the palette drop, so a searched node and a dragged
            // node land in the same place relative to the pointer.
            const id = addNode(type, { x: position.x - 20, y: position.y - 24 });

            /*
             * Opened by dropping a wire? Then finish the gesture the author
             * started and join the two up. The list only offered types that
             * can take this wire, so a socket is guaranteed — but check
             * anyway rather than emit a broken edge.
             */
            if (id && pendingWire) {
                const socket = entrySocketFor(type, pendingWire.kind, pendingWire.direction);
                if (socket) {
                    connect(
                        pendingWire.direction === "source"
                            ? {
                                  source: pendingWire.nodeId,
                                  sourceHandle: pendingWire.handleId,
                                  target: id,
                                  targetHandle: socket,
                              }
                            : {
                                  source: id,
                                  sourceHandle: socket,
                                  target: pendingWire.nodeId,
                                  targetHandle: pendingWire.handleId,
                              },
                    );
                }
            }
            // Connected (or placed): nothing was cancelled, so no snap-back.
            pendingGhost.current = null;
            closeSearch();
        },
        [addNode, closeSearch, connect, pendingWire, screenToFlowPosition, searchAt],
    );

    /**
     * Where the pointer last was, so Shift+A can open the search under it —
     * the way Blender does, rather than at some fixed point.
     *
     * Two primitives rather than an object: pointermove fires on every frame
     * the mouse is moving, and allocating a fresh `{x, y}` each time hands the
     * garbage collector needless work during a drag.
     *
     * `overCanvas` is set by pointerenter/pointerleave, which the browser
     * fires exactly once per boundary crossing and never in between. That
     * replaces a getBoundingClientRect() in the Shift+A handler — a call that
     * forces a synchronous layout — and is also more correct: a manual rect
     * test counts the pointer as "on canvas" while it is over the inspector or
     * a floating overlay drawn on top of it, whereas the native events do not.
     */
    const pointerX = useRef(0);
    const pointerY = useRef(0);
    const overCanvas = useRef(false);

    /* Shift+A over the canvas, Blender's shortcut for the same job. */
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key !== "A" && event.key !== "a") return;
            if (!event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
            const target = event.target as HTMLElement | null;
            const tag = target?.tagName;
            // Never steal the key from a field the author is typing in.
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) {
                return;
            }
            /*
             * "Over the canvas" has to mean the POINTER, not the focus.
             * Keying off `wrapperRef.contains(event.target)` looked right and
             * never fired: with nothing focused the target is <body>, which is
             * an ancestor of the wrapper, not a descendant — so the guard
             * rejected every press.
             */
            if (!overCanvas.current) return;
            event.preventDefault();
            openSearchAt(pointerX.current, pointerY.current);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [openSearchAt]);

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
        <div
            ref={wrapperRef}
            className="relative h-full w-full"
            onPointerEnter={() => {
                overCanvas.current = true;
            }}
            onPointerLeave={() => {
                overCanvas.current = false;
            }}
            onPointerMove={(e) => {
                // Refs, not state: this fires constantly and must never
                // re-render the canvas (see canvasPerformance.test.tsx).
                pointerX.current = e.clientX;
                pointerY.current = e.clientY;
            }}
            onPointerDown={(e) => {
                pointerX.current = e.clientX;
                pointerY.current = e.clientY;
                // A tap or stylus press may arrive with no preceding move.
                overCanvas.current = true;
                if (e.button === 2) rightDown.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => {
                if (e.button !== 2) return;
                const down = rightDown.current;
                rightDown.current = null;
                if (!down) return;
                // Dragged? That was a pan; leave it alone.
                if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > RIGHT_CLICK_SLOP) return;
                // A click on the pane itself, not on a node or a wire.
                const target = e.target as HTMLElement | null;
                if (!target?.classList.contains("react-flow__pane")) return;
                openSearchAt(e.clientX, e.clientY);
            }}
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
                snapToGrid={snap}
                snapGrid={SNAP_GRID}
                deleteKeyCode={["Backspace", "Delete"]}
                selectionKeyCode={null}
                /*
                 * Middle-mouse and right-mouse pan. r92 dropped button 2 while
                 * hunting a stranded selection rectangle, but the actual fix
                 * was preventing the context menu (below) — so right-drag can
                 * pan again, and a right *click* opens the node search.
                 */
                panOnDrag={[1, 2]}
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

            {searchAt && (
                <NodeSearchPopover
                    at={searchAt}
                    wire={pendingWire}
                    onPick={addFromSearch}
                    onClose={closeSearch}
                />
            )}

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
                <div className="pointer-events-auto flex items-center gap-px rounded-md border border-line bg-surface/90">
                    <button
                        type="button"
                        className="btn-ghost rounded-none rounded-l-md"
                        onClick={() => arrange("row")}
                        disabled={selection.nodeIds.length < 2}
                        title="Align: move the selected nodes onto one horizontal line, centred on the same height"
                        aria-label="Align in a row"
                    >
                        <Icon name="rows" size={13} />
                        Row
                    </button>
                    <button
                        type="button"
                        className="btn-ghost rounded-none rounded-r-md"
                        onClick={() => arrange("column")}
                        disabled={selection.nodeIds.length < 2}
                        title="Align: move the selected nodes onto one vertical line, centred on the same left-to-right position"
                        aria-label="Align in a column"
                    >
                        <Icon name="columns" size={13} />
                        Column
                    </button>
                </div>
                {/* Distributing is a different job from aligning — one moves
                    everything onto a line, the other only adjusts the gaps
                    between them. They were one undivided strip of four
                    lookalike buttons, which made "Even across" easy to press
                    while meaning "Row". Two groups, and the verbs differ. */}
                <div className="pointer-events-auto flex items-center gap-px rounded-md border border-line bg-surface/90">
                    <button
                        type="button"
                        className="btn-ghost rounded-none rounded-l-md"
                        onClick={() => arrange("spread-row")}
                        disabled={selection.nodeIds.length < 3}
                        title="Space out: equalise the left-to-right gaps only. Does not move anything onto a line — use Row for that. The outermost nodes stay put."
                        aria-label="Space out across"
                    >
                        <Icon name="spread-h" size={13} />
                        Even across
                    </button>
                    <button
                        type="button"
                        className="btn-ghost rounded-none rounded-r-md"
                        onClick={() => arrange("spread-column")}
                        disabled={selection.nodeIds.length < 3}
                        title="Space out: equalise the top-to-bottom gaps only. Does not move anything onto a line — use Column for that. The outermost nodes stay put."
                        aria-label="Space out down"
                    >
                        <Icon name="spread-v" size={13} />
                        Even down
                    </button>
                </div>
                <button
                    type="button"
                    aria-pressed={snap}
                    className="btn-default pointer-events-auto"
                    onClick={() => setSnapEnabled(!snap)}
                    title={
                        snap
                            ? "Nodes snap to the grid as you drag them. Click to move them freely."
                            : "Nodes move freely. Click to make them snap to the grid."
                    }
                >
                    <Icon name="grid" size={13} />
                    {snap ? "Snapping" : "Free"}
                </button>
                <button
                    type="button"
                    aria-pressed={motion}
                    className="btn-default pointer-events-auto"
                    onClick={() => setWireMotion(!motion)}
                    title={
                        motion
                            ? "Editor only: wires show which way the story runs by drifting dots along themselves. Click to hold them still."
                            : "Editor only: wire dots are held still. Click to let them drift again, showing which way the story runs."
                    }
                >
                    <Icon name={motion ? "play" : "pause"} size={13} />
                    {motion ? "Animated wires" : "Static wires"}
                </button>
                <button
                    type="button"
                    aria-pressed={physics}
                    className="btn-default pointer-events-auto"
                    onClick={() => setWirePhysicsEnabled(!physics)}
                    title={
                        physics
                            ? "Editor only: a wire you drag hangs and springs as you move it. Click for plain, straight wires — lighter on older machines."
                            : "Editor only: dragged wires are plain and straight. Click to let them hang and spring as you move them."
                    }
                >
                    <Icon name={physics ? "shuffle" : "branch"} size={13} />
                    {physics ? "Springy wires" : "Plain wires"}
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
