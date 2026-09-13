/**
 * A pack-authored node's inspector face (Editor Mods, r138). The form comes
 * from the node's snapshotted field definitions — the pack author's labels
 * and hints ARE the interface (the no-code rule) — and everything travels
 * with the node, so it keeps working where the pack was never loaded.
 */
import { PackFieldInput } from "./PackDataEditor";
import { Icon } from "@/components/Icon";
import type { NodeOfType } from "@/schema/nodes";
import type { PackField } from "@/toolpacks/schema";
import { describePackNodeAction } from "@/toolpacks/palette";
import { useEditor } from "@/store/editor";

export function PackNodeEditor({ node }: { node: NodeOfType<"pack.node"> }) {
    const updateNodeData = useEditor((s) => s.updateNodeData);
    const d = node.data;
    const fields = (d.fields ?? []) as PackField[];
    /* The pack author's own description when this snapshot has one (r150);
       older snapshots fall back to the generic gamer-words line. Either way
       no event name, storage key, or SDK call ever shows. */
    const docs = d.nodeDocs?.trim();
    const what = docs || `When the quest reaches this node it ${describePackNodeAction(d)}.`;

    const setValue = (key: string, value: string) =>
        updateNodeData(node.id, { values: { ...d.values, [key]: value } });

    /* No action picked yet (r151): say so and point at the fix instead of an
       empty panel. Mirrors the compiler warning's pointer. */
    if (!d.nodeId) {
        return (
            <div className="grid gap-2 px-3 pt-1">
                {d.packName && (
                    <p className="flex items-center gap-1.5 rounded-md border border-cat-community/30 bg-cat-community/10 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-ink-2">
                        <Icon name="package" size={12} className="shrink-0 text-cat-community" />
                        <span>
                            From the <strong className="font-semibold text-ink">{d.packName}</strong> addon
                        </span>
                    </p>
                )}
                <p className="rounded-md border border-warn/30 bg-warn/10 px-2.5 py-2 text-[10.5px] leading-relaxed text-warn">
                    Not set up yet — this card doesn&apos;t know which tool action it runs. Delete it and drag
                    the action in again from the palette&apos;s{" "}
                    {d.packName ? `“Editor Mods · ${d.packName}”` : "“Editor Mods”"} group. As it stands it
                    does nothing.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-2 px-3 pt-1">
            {d.packName && (
                <p className="flex items-center gap-1.5 rounded-md border border-cat-community/30 bg-cat-community/10 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-ink-2">
                    <Icon name="package" size={12} className="shrink-0 text-cat-community" />
                    <span>
                        From the <strong className="font-semibold text-ink">{d.packName}</strong> addon
                    </span>
                </p>
            )}

            <p className="rounded-md border border-line/70 bg-surface-2 px-2.5 py-2 text-[10.5px] leading-relaxed text-ink-3">
                {what}
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
