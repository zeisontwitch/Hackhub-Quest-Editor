/**
 * Naming a debug probe after whatever it is watching.
 *
 * A probe is only useful if you can tell which one printed a line, and QA was
 * hand-typing a name into every one of ten probes on each test run — which is
 * exactly the friction that stops a diagnostic being used. The convention QA
 * arrived at is a good one, so it is the one automated here:
 *
 *     <Socket>-<Node>-<Detail>          OnComplete-CreateNetwork-Router
 *
 * The socket matters because the interesting probes hang off a *particular*
 * output: "Yes" versus "No" on a branch, "Unlocks" versus "On complete" on an
 * objective. The detail is whatever distinguishes one node of that type from
 * the next — an objective's name, a device's name, a trigger's event.
 *
 * The name is only ever a default. It is written onto the node when the probe
 * is wired up, so the author can edit it afterwards and nothing will overwrite
 * their text.
 */
import type { NodeDoc } from "@/schema/nodes";
import { NODE_TYPES_REGISTRY, sourcesOf } from "@/schema/registry";

/** `on complete` → `OnComplete`, `Yes` → `Yes`, `out` → `Out`. */
function pascal(text: string): string {
    const words = String(text ?? "")
        .replace(/[^A-Za-z0-9]+/g, " ")
        .trim()
        .split(/\s+|(?<=[a-z])(?=[A-Z])/)
        .filter(Boolean);
    return words.map((w) => w[0].toUpperCase() + w.slice(1)).join("");
}

/** The one field that tells two nodes of the same type apart. */
function detailOf(node: NodeDoc): string {
    const d = node.data as Record<string, unknown>;
    const pick = (...keys: string[]) => {
        for (const k of keys) {
            const v = d[k];
            if (typeof v === "string" && v.trim()) return v;
        }
        return "";
    };

    switch (node.type) {
        case "objective":
            return pick("name", "description");
        case "trigger.event":
            return pick("event");
        case "world.network":
        case "world.wifi": {
            const device = d.device as { name?: string; type?: string } | undefined;
            return String(d.ssid ?? "") || device?.name || device?.type || "";
        }
        case "world.toolResponse":
            return pick("command");
        case "comms.dialogue": {
            const kind = String(d.kind ?? "");
            const mail = d.mail as { subject?: string } | undefined;
            if (kind === "mail" && mail?.subject) return mail.subject;
            return kind;
        }
        case "fx.setData":
            return pick("key");
        case "fx.notify":
            return pick("message");
        case "flow.branch":
            return String(d.source ?? "");
        case "world.port":
        case "world.firewall":
            return pick("ip");
        case "world.domain":
            return pick("domain");
        case "world.database":
            return pick("host");
        case "reply.input":
            return pick("prompt", "expected");
        default:
            return pick("name", "label", "command", "event");
    }
}

/** Clip a detail to something that still reads as a label. */
function clip(text: string, max = 28): string {
    const t = pascal(text);
    return t.length > max ? t.slice(0, max) : t;
}

/**
 * The default name for a probe wired to `sourceHandle` of `source`.
 *
 * Returns e.g. `OnComplete-Objective-DeleteLedger`, or `Out-CreateNetwork-Edge`.
 * Parts that would be empty are dropped rather than leaving a dangling dash.
 */
export function debugProbeName(source: NodeDoc, sourceHandle: string | null | undefined): string {
    const def = NODE_TYPES_REGISTRY[source.type];
    const socket = sourcesOf(source).find((h) => h.id === sourceHandle);
    /* The socket's own label ("On complete", "Yes", "Unlocks") is what the
       author sees on the canvas, so it is what they will look for in the log.
       Fall back to the raw handle id for anything dynamic. */
    const socketPart = pascal(socket?.label ?? sourceHandle ?? "");
    const nodePart = pascal(def?.label ?? source.type);
    const detailPart = clip(detailOf(source));

    return [socketPart, nodePart, detailPart].filter(Boolean).join("-");
}
