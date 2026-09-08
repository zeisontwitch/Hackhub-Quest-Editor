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
import { placementFor, type NetworkData, type SeedFilesData } from "@/compiler/seedRemoteFiles";
import { TARGET_IP_TOKEN } from "@/schema/common";
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
    return quest.graph.nodes.some((n) => n.type === "world.network" || n.type === "world.wifi");
}

/** The quest's networks, in the shape the seed-files placement check takes. */
function networksOf(quest: QuestDoc): { data: NetworkData }[] {
    return quest.graph.nodes.filter(
        (n) => n.type === "world.network" || n.type === "world.wifi",
    ) as unknown as { data: NetworkData }[];
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

    // Severity, and why it differs below: red means the author's work is
    // discarded (export drops these files) or the quest can never finish.
    // Amber means a step silently does nothing at runtime — worth checking,
    // nothing lost.
    //
    // A node that acts on a machine must have a machine in the quest to act on.
    // Without a Network node, nothing creates the device this points at.
    if (node.type === "world.port" || node.type === "world.firewall") {
        const ip = String(d.ip ?? "").trim();
        if (!ip) {
            // Empty is unfinished, not broken: amber, and field warnings only
            // show while the node is selected, so this can't nag from across
            // the canvas.
            out.push({
                path: "ip",
                severity: "warn",
                detail: "No machine set — this node does nothing until it points at one.",
                nextStep:
                    `Type ${TARGET_IP_TOKEN} to aim it at the machine your network created.`,
            });
        } else if (!hasNetworkNode(quest)) {
            // Only when a value is given but nothing in the quest can take it —
            // a filled field pointing at nothing is exactly the "needs a router" case.
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

    // A "Seed files" aimed at a remote device must resolve to a real device,
    // or export drops the files. This is the SAME check the compiler runs
    // (placementFor), so the warning appears while editing instead of after
    // export — when the files are already gone.
    if (node.type === "world.files" && d.target === "device") {
        const files = Array.isArray(d.files) ? d.files : [];
        // Nothing to place, nothing to warn about: an untouched node stays quiet.
        if (files.length === 0) return out;
        const ip = String(d.ip ?? "").trim();
        if (!hasNetworkNode(quest)) {
            out.push({
                path: "ip",
                severity: "danger",
                detail:
                    "This “Seed files” node puts files on a remote device, but no network in this quest exists for that device to live on — export would drop the files.",
                nextStep:
                    "Add a “Create network” node and give it the device this is aimed at, so the files land somewhere real.",
            });
            return out;
        }
        // placementFor only reads the address; the whole node data is passed
        // so the check sees exactly what the compiler would compile.
        const placement = placementFor(d as unknown as SeedFilesData, networksOf(quest));
        if (!placement.ok) {
            if (!placement.device) {
                const addresses = placement.addresses;
                out.push({
                    path: "ip",
                    severity: "danger",
                    detail: ip
                        ? "No device in this quest uses that address, so these files would be dropped when you export."
                        : "No address set, so the files have nowhere to land — they would be dropped when you export.",
                    nextStep: addresses.length > 0
                        ? `Point it at one of these: ${addresses.join(", ")}.`
                        : `Point it at the same ${TARGET_IP_TOKEN} token you gave the network.`,
                });
            } else {
                out.push({
                    path: "ip",
                    severity: "danger",
                    detail:
                        "That device has no user account, and files mount under a user's home folder — export would drop the files.",
                    nextStep: "Add a user account to the device in your “Create network” node.",
                });
            }
        }
    }

    return out;
}
