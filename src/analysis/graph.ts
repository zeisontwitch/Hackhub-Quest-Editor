/**
 * Graph analysis — pure, no React, no store.
 *
 * Everything here is a question about the shape of a quest graph, answered from
 * the document alone. The canvas uses it to flag problems, the inspector uses it
 * for the health panel, and the Step 4 export report will reuse it verbatim
 * (docs/01 §4.3: analysis and compilation are pure and side-effect free).
 */
import type { EdgeDoc } from "@/schema/edges";
import type { NodeDoc } from "@/schema/nodes";
import { nodeTypeDef, sourcesOf } from "@/schema/registry";
import type { Position } from "@/schema/common";

export interface GraphIssue {
    nodeId: string;
    /** Short label shown on the canvas badge. */
    label: string;
    /** Full explanation, used by the health panel and export report. */
    detail: string;
    /**
     * The concrete next step, in game terms ("which nodes to put where").
     * Required: a warning that says what is wrong without saying how to fix
     * it is a dead end for a non-coder (r124).
     */
    nextStep: string;
    severity: "warn" | "danger";
}

export interface GraphAnalysis {
    /** Node ids reachable from at least one lifecycle entry point. */
    reachable: Set<string>;
    issues: GraphIssue[];
}

const ENTRY_TYPES = new Set(["entry.start", "entry.load", "entry.complete", "entry.abandon"]);

/**
 * Where execution can begin.
 *
 * Not just the lifecycle nodes: an objective is activated by whatever fires into
 * its trigger socket, and a trigger listens to the game directly. Treating only
 * `entry.*` as roots would flag every objective-led chain as unreachable.
 */
const ROOT_TYPES = new Set([...ENTRY_TYPES, "trigger.event", "objective"]);

/** Nodes that legitimately have nothing wired into them. */
function isRoot(type: string): boolean {
    return ROOT_TYPES.has(type) || nodeTypeDef(type as never).targets.length === 0;
}

export function analyseGraph(nodes: NodeDoc[], edges: EdgeDoc[]): GraphAnalysis {
    const outgoing = new Map<string, string[]>();
    const incoming = new Map<string, EdgeDoc[]>();

    for (const edge of edges) {
        if (!outgoing.has(edge.source)) outgoing.set(edge.source, []);
        outgoing.get(edge.source)!.push(edge.target);
        if (!incoming.has(edge.target)) incoming.set(edge.target, []);
        incoming.get(edge.target)!.push(edge);
    }

    // Breadth-first from every place execution can start.
    const reachable = new Set<string>();
    const queue = nodes.filter((n) => ROOT_TYPES.has(n.type)).map((n) => n.id);
    while (queue.length > 0) {
        const id = queue.pop()!;
        if (reachable.has(id)) continue;
        reachable.add(id);
        for (const next of outgoing.get(id) ?? []) queue.push(next);
    }

    const issues: GraphIssue[] = [];

    for (const node of nodes) {
        const def = nodeTypeDef(node.type);

        // Sticky notes are annotations; nothing about them is broken.
        if (node.type === "flow.note" || node.type === "layout.group") continue;

        const wiredOut = (outgoing.get(node.id) ?? []).length;

        // An objective nothing can ever complete.
        if (node.type === "objective") {
            const triggered = (incoming.get(node.id) ?? []).some((e) => e.kind === "condition");
            if (!triggered) {
                issues.push({
                    nodeId: node.id,
                    label: "No trigger",
                    detail:
                        "Nothing completes this objective. Wire a “When event” node into its trigger socket, or the player can never finish the quest.",
                    nextStep:
                        "Add a “When event” node from Triggers, pick the game event that means the player did it, and wire its “When” socket into this objective's “Trigger” socket.",
                    severity: "danger",
                });
            }
        }

        // A branch or reply with an unwired outcome is a dead end the player hits.
        if (
            node.type === "flow.branch" ||
            node.type === "reply.input" ||
            node.type === "flow.sequence"
        ) {
            const outputs = sourcesOf(node);
            const sockets = outputs.map((s) => s.id);
            const used = new Set(
                edges.filter((e) => e.source === node.id).map((e) => e.sourceHandle),
            );
            const missing = sockets.filter((s) => !used.has(s));
            if (missing.length > 0) {
                const names = missing
                    .map((m) => outputs.find((s) => s.id === m)?.label ?? m)
                    .join("” and “");
                issues.push({
                    nodeId: node.id,
                    label: "Dead end",
                    detail:
                        node.type === "flow.sequence"
                            ? `The “${names}” output goes nowhere, so that step of the sequence does nothing. Wire it up or remove the output.`
                            : `The “${names}” outcome goes nowhere, so the quest stalls if the player takes it.`,
                    nextStep:
                        node.type === "flow.sequence"
                            ? `Wire the “${names}” step to the node that should run at that point, or remove the step.`
                            : node.type === "reply.input"
                              ? `Wire the “${names}” answer to the node that should run next.`
                              : `Wire the “${names}” outcome to the node that should run down that path.`,
                    severity: "warn",
                });
            }
        }

        // Anything that is neither a root nor reachable cannot run.
        if (!isRoot(node.type) && !reachable.has(node.id)) {
            issues.push({
                nodeId: node.id,
                label: "Unreachable",
                detail:
                    "Nothing leads to this node. Wire it to the chain that should run it — nodes do nothing until something points at them.",
                nextStep:
                    "Drag a wire from the node that should run it into this node's input — usually the last node of your “Quest start” chain.",
                severity: "warn",
            });
        }

        // There used to be an "Unwired" issue here (non-root, reachable, no
        // inputs). It could never fire: a non-root only becomes reachable by
        // following an edge that targets it, so it always has an input.
        // Removed in r124 rather than kept as a guard no test can exercise.

        // A lifecycle entry point with nothing after it is dead weight.
        if (ENTRY_TYPES.has(node.type) && wiredOut === 0) {
            issues.push({
                nodeId: node.id,
                label: "Empty",
                detail: `Nothing is wired to “${def.label}”. That is fine if you do not need it — delete the node to clear this.`,
                nextStep:
                    node.type === "entry.start"
                        ? "Wire the nodes that should run when the quest is claimed to its output — usually your briefing mail first — or delete it if you don't need it."
                        : `Wire the nodes that should run at “${def.label}” to its output, or delete it if you don't need it.`,
                severity: "warn",
            });
        }
    }

    return { reachable, issues };
}

/** One-line summaries of the analysis, for the status bar and health panel. */
export function summariseIssues(analysis: GraphAnalysis): string {
    if (analysis.issues.length === 0) return "No issues";
    const danger = analysis.issues.filter((i) => i.severity === "danger").length;
    const warn = analysis.issues.length - danger;
    return [danger ? `${danger} blocking` : null, warn ? `${warn} to review` : null]
        .filter(Boolean)
        .join(", ");
}

/* ── Layout ─────────────────────────────────────────────────────────────── */

// Card is w-60 (240px); the column gap leaves room for the socket-name
// labels that render in the gutter when a node is hovered.
const COLUMN_GAP = 360;
const ROW_GAP = 160;

/**
 * A layered layout: depth from the roots becomes the column, and a few
 * barycenter sweeps order the rows so wired-together nodes sit next to each
 * other instead of scattering (author order seeds the sweeps and breaks ties,
 * so "tidy up" rearranges rather than scrambles).
 *
 * Deterministic — the same graph always produces the same positions, which is
 * what makes it safe to offer as a one-click action.
 */
export function layeredLayout(nodes: NodeDoc[], edges: EdgeDoc[]): Record<string, Position> {
    if (nodes.length === 0) return {};

    const incoming = new Map<string, EdgeDoc[]>();
    const outgoing = new Map<string, EdgeDoc[]>();
    for (const edge of edges) {
        if (!incoming.has(edge.target)) incoming.set(edge.target, []);
        incoming.get(edge.target)!.push(edge);
        if (!outgoing.has(edge.source)) outgoing.set(edge.source, []);
        outgoing.get(edge.source)!.push(edge);
    }

    // Longest-path depth, so a node sits to the right of everything feeding it.
    const depth = new Map<string, number>();
    const visiting = new Set<string>();

    const depthOf = (id: string): number => {
        const known = depth.get(id);
        if (known !== undefined) return known;
        if (visiting.has(id)) return 0; // cycle: break it rather than recurse forever
        visiting.add(id);
        const parents = (incoming.get(id) ?? []).map((e) => e.source);
        const value = parents.length === 0 ? 0 : Math.max(...parents.map(depthOf)) + 1;
        visiting.delete(id);
        depth.set(id, value);
        return value;
    };

    for (const node of nodes) depthOf(node.id);

    // Group by column, seeding each with the author's original order.
    const maxDepth = Math.max(...nodes.map((n) => depth.get(n.id) ?? 0));
    const columns: NodeDoc[][] = Array.from({ length: maxDepth + 1 }, () => []);
    const columnOf = new Map<string, NodeDoc[]>();
    for (const node of nodes) {
        const column = columns[depth.get(node.id) ?? 0];
        column.push(node);
        columnOf.set(node.id, column);
    }

    // Row within a column, normalised so rows compare across columns of
    // different heights.
    const row = new Map<string, number>();
    const reindex = (column: NodeDoc[]) => column.forEach((n, i) => row.set(n.id, i));
    columns.forEach(reindex);
    const norm = (id: string) => (row.get(id)! + 0.5) / columnOf.get(id)!.length;
    const barycentre = (ids: string[]) =>
        ids.length === 0
            ? undefined
            : ids.reduce((sum, id) => sum + norm(id), 0) / ids.length;

    // Crossing reduction: sweep right, pulling each node towards the mean row
    // of what feeds it, then sweep left doing the same with what it feeds.
    // Nodes without neighbours on the far side keep their row.
    const sweep = (neighbours: (id: string) => string[], from: number, to: number, step: number) => {
        for (let d = from; d !== to + step; d += step) {
            const column = columns[d];
            column
                .map((n, i) => ({ n, i, key: barycentre(neighbours(n.id)) ?? norm(n.id) }))
                .sort((a, b) => a.key - b.key || a.i - b.i)
                .forEach((entry, i) => {
                    column[i] = entry.n;
                });
            reindex(column);
        }
    };
    for (let pass = 0; pass < 4; pass++) {
        sweep((id) => (incoming.get(id) ?? []).map((e) => e.source), 1, maxDepth, 1);
        sweep((id) => (outgoing.get(id) ?? []).map((e) => e.target), maxDepth - 1, 0, -1);
    }

    // Centre each column on the canvas so the graph does not drift downwards.
    const tallest = Math.max(...columns.map((c) => c.length));
    const positions: Record<string, Position> = {};

    columns.forEach((column, d) => {
        const offset = ((tallest - column.length) * ROW_GAP) / 2;
        column.forEach((node, i) => {
            positions[node.id] = { x: d * COLUMN_GAP, y: Math.round(offset + i * ROW_GAP) };
        });
    });

    return positions;
}
