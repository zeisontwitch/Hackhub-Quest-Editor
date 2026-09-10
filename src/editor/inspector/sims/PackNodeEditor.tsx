/**
 * A pack-authored node's inspector face (Editor Mods, r138). The form comes
 * from the node's snapshotted field definitions — the pack author's labels
 * and hints ARE the interface (the no-code rule) — and everything travels
 * with the node, so it keeps working where the pack was never loaded.
 */
import { PackFieldInput } from "./PackDataEditor";
import type { NodeOfType } from "@/schema/nodes";
import type { PackField } from "@/toolpacks/schema";
import { useEditor } from "@/store/editor";

/** Plain words for what the node does when the quest reaches it. */
function emitterSummary(d: NodeOfType<"pack.node">["data"]): string {
    switch (d.emitter) {
        case "sdk":
            return `When the quest reaches this node it calls ${((d.steps ?? []) as { call: string }[])
                .map((s) => s.call)
                .join(", ") || "the SDK"}.`;
        case "emit":
            return `When the quest reaches this node it fires the event ${d.eventName || "(no event set)"}.`;
        case "storage":
            return `When the quest reaches this node it writes the data to ${d.storageKey || "(no key set)"}, where the tool mod reads it.`;
        case "commandData":
            return `When the quest reaches this node it places the scripted answer for the ${d.command || "(no command set)"} command.`;
    }
}

export function PackNodeEditor({ node }: { node: NodeOfType<"pack.node"> }) {
    const updateNodeData = useEditor((s) => s.updateNodeData);
    const d = node.data;
    const fields = (d.fields ?? []) as PackField[];

    const setValue = (key: string, value: string) =>
        updateNodeData(node.id, { values: { ...d.values, [key]: value } });

    return (
        <div className="grid gap-2 px-3 pt-1">
            <p className="rounded-md border border-line/70 bg-surface-2 px-2.5 py-2 text-[10.5px] leading-relaxed text-ink-3">
                {emitterSummary(d)}
                {d.packName ? ` Provided by the ${d.packName} tool pack.` : ""}
            </p>

            {fields.map((f) => (
                <PackFieldInput
                    key={f.key}
                    field={f}
                    value={d.values[f.key] ?? ""}
                    onChange={(v) => setValue(f.key, v)}
                />
            ))}

            {d.gameModName && (
                <p className="rounded-md border border-warn/30 bg-warn/10 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-warn">
                    Players need the {d.gameModName} game mod installed for this to work — say so in your quest
                    description.
                </p>
            )}
        </div>
    );
}
