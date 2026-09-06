/**
 * Per-field authoring warnings.
 *
 * Node-level issues (analysis/graph.ts) tell you a node is broken; these tell you
 * which *field* on that node is the cause and what to do next. They are computed
 * from the whole quest because the problem is usually about a neighbouring node
 * (a "Change port" with an IP, but no network in the quest to act on).
 *
 * Kept pure: no React, no store, so the inspector and a future export report can
 * share it. Each warning is keyed to a data path a Field renders, and carries a
 * `nextStep` — the concrete actionable sentence a non-coder acts on.
 */
import type { NodeDoc } from "@/schema/nodes";
import type { QuestDoc } from "@/schema/project";

export interface FieldWarning {
    /** Dot-path into the node's data, e.g. "ip" or "choices.0.label". */
    path: string;
    severity: "warn" | "danger";
    /** What is wrong, in plain English (game terms only). */
    detail: string;
    /** The concrete next step for the author. */
    nextStep: string;
}

/** Is there a Network node in the quest the author can point this at? */
function hasNetworkNode(quest: QuestDoc): boolean {
    return quest.graph.nodes.some((n) => n.type === "world.network");
}

/**
 * Field-level warnings for one node, within its quest.
 *
 * Rules are chosen because they can be checked from the document alone and map to
 * a single field the author is looking at — the "how do I fix this" is never a
 * guess. A field with no warning renders exactly as it does today.
 */
export function fieldWarnings(quest: QuestDoc | undefined, node: NodeDoc): FieldWarning[] {
    if (!quest) return [];
    const d = node.data as Record<string, unknown>;
    const out: FieldWarning[] = [];

    // A node that acts on a machine must have a machine in the quest to act on.
    // Without a Network node, nothing creates the device this points at.
    if (node.type === "world.port" || node.type === "world.firewall") {
        const ip = String(d.ip ?? "").trim();
        // Only when a value is given but nothing in the quest can take it — a
        // filled field pointing at nothing is exactly the "needs a router" case.
        if (ip && !hasNetworkNode(quest)) {
            out.push({
                path: "ip",
                severity: "warn",
                detail:
                    "This is set to a machine, but no network in this quest creates one for it to act on.",
                nextStep:
                    "Add a “Create network” node from World building and point this at a device in it, or remove this node if you don't need it.",
            });
        }
    }

    // A "Seed files" aimed at a remote device needs a network to hold that device.
    if (node.type === "world.files" && d.target === "device") {
        const ip = String(d.ip ?? "").trim();
        if (ip && !hasNetworkNode(quest)) {
            out.push({
                path: "ip",
                severity: "warn",
                detail:
                    "This “Seed files” node puts files on a remote device, but no network in this quest exists for that device to live on.",
                nextStep:
                    "Add a “Create network” node and give it the device this is aimed at, so the files land somewhere real.",
            });
        }
    }

    // An objective nothing can trigger is the single most common blocker.
    if (node.type === "objective") {
        const triggered = quest.graph.edges.some(
            (e) => e.target === node.id && e.kind === "condition",
        );
        if (!triggered) {
            out.push({
                path: "",
                severity: "danger",
                detail: "Nothing can complete this objective, so the player can never finish the quest.",
                nextStep:
                    "Wire a “When event” node into the objective's trigger socket.",
            });
        }
    }

    return out;
}
