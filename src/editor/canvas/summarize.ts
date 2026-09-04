/**
 * One-or-two-line human summaries shown on each node card.
 *
 * The canvas has to stay readable without opening the inspector, so every node
 * type gets a plain-English digest of its own data. Returning `null` means "show
 * nothing but the header".
 */
import type { DialogueKind, NodeDoc } from "@/schema/nodes";
import type { QuestDoc } from "@/schema/project";
import { eventLabel } from "@/schema/events";
import { DEVICE_TYPE_LABELS } from "@/schema/common";

export const DIALOGUE_KIND_LABELS: Record<DialogueKind, string> = {
    phone: "Phone call",
    kisscord: "Kisscord chat",
    mail: "E-Mail",
    weechat: "WeeChat",
};

/** The first words of the first line of a dialogue node's script, per flavour. */
export function dialogueFirstLine(
    d: Loose,
    quest?: Pick<QuestDoc, "dialog"> | null,
): string {
    switch (d.kind) {
        case "phone": {
            const branch =
                quest?.dialog.find((b) => b.name === d.phone?.branch) ?? quest?.dialog[0];
            return branch?.lines[0]?.text ?? "";
        }
        case "kisscord": {
            const m = (d.kisscord?.messages as Loose[])?.[0];
            if (!m) return "";
            if (m.playerAction === "send") return m.playerText || "";
            if (m.playerAction === "upload") return `uploads ${m.upload?.name || "a file"}`;
            if (m.playerAction === "input") return "types an answer";
            return m.content || "";
        }
        case "mail":
            return d.mail?.subject ?? "";
        case "weechat": {
            const m = (d.weechat?.messages as Loose[])?.[0];
            if (!m) return "";
            return m.playerAction === "send" ? m.playerText || "" : m.content || "";
        }
        default:
            return "";
    }
}

function clip(text: string, max = 46): string {
    const flat = text.replace(/\s+/g, " ").trim();
    if (flat.length <= max) return flat;
    return `${flat.slice(0, max - 1)}…`;
}

function deviceLine(d: { ip: string; type: string; children?: unknown[]; ports?: unknown[] }): string {
    const kids = Array.isArray(d.children) ? d.children.length : 0;
    const ports = Array.isArray(d.ports) ? d.ports.length : 0;
    const bits = [d.ip || "no IP"];
    if (ports) bits.push(`${ports} port${ports === 1 ? "" : "s"}`);
    if (kids) bits.push(`${kids} child${kids === 1 ? "" : "ren"}`);
    return bits.join(" · ");
}

/**
 * The node union's `data` is a 30-way discriminated union; switching on
 * `node.type` narrows it in the compiler but not usefully for a digest that only
 * reads a couple of fields. Reading through one permissive alias keeps this file
 * short and is contained to it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = Record<string, any>;

export function summarize(node: NodeDoc, quest?: QuestDoc): string[] {
    const d = node.data as Loose;
    switch (node.type) {
        case "entry.start":
            return ["Runs once, when the quest begins"];
        case "flow.reroute":
            return ["Wire passes through"];
        case "layout.group": {
            const label = String(d.label || "Group");
            return d.comment ? [label, clip(String(d.comment), 50)] : [label];
        }
        case "entry.load":
            return ["Runs on claim and after every reload"];
        case "entry.complete":
            return ["Runs when all objectives are done"];
        case "entry.abandon":
            return ["Runs when the player abandons"];

        case "objective":
            return [
                d.name ? `#${d.name}` : "no identifier yet",
                ...(d.description ? [clip(String(d.description), 60)] : ["no description yet"]),
            ];

        case "trigger.event": {
            const conditions = d.conditions as { id: string }[] | undefined;
            const n = conditions?.length ?? 0;
            return [
                d.event ? eventLabel(String(d.event)) : "no event chosen",
                n === 0 ? "fires on any occurrence" : `${n} condition${n === 1 ? "" : "s"}`,
            ];
        }

        case "world.network": {
            const device = d.device as Record<string, unknown>;
            const mode = d.ipMode === "random" ? "random IP" : undefined;
            return [
                device ? `${DEVICE_TYPE_LABELS[device.type as keyof typeof DEVICE_TYPE_LABELS] ?? device.type}` : "",
                mode ?? deviceLine(device as never),
            ].filter(Boolean);
        }

        case "world.wifi":
            return [
                d.ssid ? `SSID ${d.ssid}` : "no SSID yet",
                d.model ? `fern: ${d.model}` : d.password ? "passphrase set" : "no passphrase",
            ];

        case "world.firewall": {
            const rule = d.rule as { allowed: boolean; port: number } | undefined;
            return [
                d.ip ? String(d.ip) : "no IP yet",
                rule ? `${rule.allowed ? "Allow" : "Block"} port ${rule.port}` : "",
            ].filter(Boolean);
        }

        case "world.port": {
            const port = d.port as { external: number; service?: string } | undefined;
            const verb = { open: "Open", close: "Close", add: "Add", remove: "Remove" }[
                d.action as "open"
            ];
            return [
                d.ip ? String(d.ip) : "no IP yet",
                port ? `${verb} ${port.external}${port.service ? `/${port.service}` : ""}` : verb,
            ];
        }

        case "world.domain": {
            const vulns = d.vulnerabilities as unknown[] | undefined;
            return [
                d.domain ? String(d.domain) : "no domain yet",
                d.ip ? `→ ${d.ip}` : "",
                vulns?.length ? `${vulns.length} vuln${vulns.length === 1 ? "" : "s"}` : "",
            ].filter(Boolean);
        }

        case "world.database": {
            const tables = d.tables as unknown[] | undefined;
            return [
                d.host ? String(d.host) : "no host yet",
                tables?.length ? `${tables.length} table${tables.length === 1 ? "" : "s"}` : "no tables yet",
            ];
        }

        case "world.files": {
            const files = d.files as unknown[] | undefined;
            return [
                d.target === "player" ? "Player's PC" : "Remote device",
                files?.length ? `${files.length} item${files.length === 1 ? "" : "s"} in ${d.parentPath}` : "empty",
            ];
        }

        case "world.toolResponse":
            return [
                String(d.command ?? "nmap"),
                d.input ? `on ${d.input}` : d.inputTarget ? `on ${d.inputTarget}` : "no input key yet",
            ];

        case "comms.dialogue": {
            const first = dialogueFirstLine(d, quest);
            const count =
                d.kind === "phone"
                    ? (quest?.dialog.find((b) => b.name === d.phone?.branch) ?? quest?.dialog[0])?.lines.length ?? 0
                    : d.kind === "mail"
                      ? 1
                      : ((d.kind === "kisscord" ? d.kisscord?.messages : d.weechat?.messages) as unknown[] | undefined)?.length ?? 0;
            return [
                `${DIALOGUE_KIND_LABELS[d.kind as DialogueKind] ?? "Dialogue"} · ${count} line${count === 1 ? "" : "s"}`,
                first ? clip(String(first)) : "empty conversation",
            ];
        }

        case "reply.input":
            return [
                d.commandName ? `$ ${d.commandName}` : "no command yet",
                d.expected
                    ? `${{ exact: "equals", contains: "contains", regex: "matches" }[d.matchMode as "exact"]} “${clip(String(d.expected), 28)}”`
                    : "no answer set",
            ];

        case "fx.pay":
        case "fx.withdraw":
            return [
                `$${Number(d.amount ?? 0).toLocaleString()}`,
                d.description ? clip(String(d.description), 48) : "",
            ].filter(Boolean);

        case "fx.notify":
            return [d.message ? clip(String(d.message), 60) : "no message yet"];

        case "fx.setData":
            return [d.key ? `${d.key} = ${d.value ?? ""}` : "no key yet"];

        case "fx.claimQuest":
            return [d.questName ? String(d.questName) : "no quest chosen"];

        case "fx.shell":
            return [d.command ? clip(String(d.command), 52) : "no command yet"];

        case "fx.handbook":
            return [d.articleId ? String(d.articleId) : "no article yet"];

        case "flow.branch": {
            const conditions = d.conditions as unknown[] | undefined;
            return [
                d.source === "data" ? "Quest data" : "Event payload",
                conditions?.length ? `${conditions.length} condition${conditions.length === 1 ? "" : "s"}` : "no condition yet",
            ];
        }

        case "flow.delay":
            return [`${Number(d.seconds ?? 0)} s`];

        case "flow.random": {
            const options = d.options as { label: string }[] | undefined;
            return [options?.length ? `${options.length} options` : "no options yet"];
        }

        case "flow.sequence": {
            const steps = (d.steps as { label?: string; delayMs?: number }[] | undefined) ?? [];
            if (steps.length === 0) return ["no outputs yet"];
            const total = steps.reduce((sum, s) => sum + Number(s.delayMs ?? 0), 0);
            return [
                `${steps.length} output${steps.length === 1 ? "" : "s"}, in order`,
                clip(steps.map((s) => s.label || "step").join(" → "), 46),
                total > 0 ? `${total} ms end to end` : "no pauses",
            ];
        }

        case "flow.debug": {
            const bits: string[] = [];
            if (d.includePayload) bits.push("the event");
            if (d.includeData) bits.push("saved values");
            return [
                d.label ? clip(String(d.label), 46) : "unnamed checkpoint",
                bits.length ? `prints ${bits.join(" and ")}` : "prints when it is reached",
                d.toast ? "in the log and on screen" : "in the log",
            ];
        }

        case "flow.note":
            return d.text ? [clip(String(d.text), 120)] : ["Empty note"];

        default: {
            const exhaustive: never = node;
            return [String(exhaustive)];
        }
    }
}
