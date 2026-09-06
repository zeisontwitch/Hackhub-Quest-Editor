/**
 * The generic list editor used for ports, users, messages, files, vulnerabilities,
 * firewall rules and everything else that is "a list of small records".
 *
 * Reads and writes go straight through the store, addressed by nested path
 * (`messages.2.content`), so no value prop-drilling is needed at any depth.
 */
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import type { FieldDef } from "@/schema/registry";
import { useEditor } from "@/store/editor";
import { Field } from "./Field";

export function ListEditor({
    nodeId,
    path,
    items,
    def,
}: {
    nodeId: string;
    path: string;
    items: Record<string, unknown>[];
    def: Extract<FieldDef, { kind: "list" }>;
}) {
    const [open, setOpen] = useState<Record<number, boolean>>(
        // Honour `defaultOpen` so a list made to be read (a beat's branch
        // choices) shows its rows expanded on first open instead of hiding them.
        () => Object.fromEntries(items.map((_, i) => [i, def.defaultOpen ?? false])),
    );
    const updateNodeData = useEditor((s) => s.updateNodeData);

    const write = (next: Record<string, unknown>[]) => updateNodeData(nodeId, { [path]: next });

    const move = (index: number, delta: number) => {
        const target = index + delta;
        if (target < 0 || target >= items.length) return;
        const next = [...items];
        [next[index], next[target]] = [next[target], next[index]];
        write(next);
    };

    return (
        <div className="space-y-1">
            {items.length === 0 && (
                <p className="rounded-md border border-dashed border-line px-3 py-2.5 text-center text-[11px] text-ink-4">
                    None yet.
                </p>
            )}

            {items.map((item, index) => {
                const expanded = open[index] ?? false;
                return (
                    <div
                        key={index}
                        className="overflow-hidden rounded-md border border-line bg-surface-2/40"
                    >
                        <div className="flex items-center gap-1 px-1.5 py-1">
                            <button
                                type="button"
                                onClick={() => setOpen((o) => ({ ...o, [index]: !expanded }))}
                                className="flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-0.5 text-left hover:bg-surface-3"
                                aria-expanded={expanded}
                            >
                                <Icon
                                    name="chevronRight"
                                    size={11}
                                    className={cn(
                                        "shrink-0 text-ink-4 transition-transform",
                                        expanded && "rotate-90",
                                    )}
                                />
                                <span className="truncate font-mono text-[11.5px] text-ink-2">
                                    {def.itemTitle(item, index)}
                                </span>
                            </button>
                            <button
                                type="button"
                                className="btn-icon size-5"
                                onClick={() => move(index, -1)}
                                disabled={index === 0}
                                title="Move up"
                                aria-label="Move item up"
                            >
                                <Icon name="chevronDown" size={10} className="rotate-180" />
                            </button>
                            <button
                                type="button"
                                className="btn-icon size-5"
                                onClick={() => move(index, 1)}
                                disabled={index === items.length - 1}
                                title="Move down"
                                aria-label="Move item down"
                            >
                                <Icon name="chevronDown" size={10} />
                            </button>
                            <button
                                type="button"
                                className="btn-icon size-5 text-ink-4 hover:text-danger"
                                onClick={() => write(items.filter((_, i) => i !== index))}
                                title="Remove"
                                aria-label="Remove"
                            >
                                <Icon name="trash" size={10} />
                            </button>
                        </div>

                        {expanded && (
                            <div className="border-t border-line/70 py-0.5">
                                {def.fields.map((field, i) => (
                                    <Field
                                        key={"key" in field ? field.key : `${i}-${field.kind}`}
                                        def={field}
                                        nodeId={nodeId}
                                        basePath={`${path}.${index}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            <button
                type="button"
                onClick={() => {
                    write([...items, def.newItem()]);
                    setOpen((o) => ({ ...o, [items.length]: true }));
                }}
                className="btn-default w-full text-[11.5px]"
            >
                <Icon name="plus" size={12} />
                {def.addLabel}
            </button>
        </div>
    );
}
