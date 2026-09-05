/**
 * Renders one inspector field from its descriptor.
 *
 * Values are read from and written to the selected node's data by nested path, so
 * a field can live at any depth (`attachment.name`, `messages.2.content`) without
 * the parent threading callbacks down.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ColourPicker } from "./ColourPicker";
import { Icon } from "@/components/Icon";
import type { FieldDef } from "@/schema/registry";
import { getPath, useEditor } from "@/store/editor";
import { ImagePickerField } from "./ModFields";
import { ConditionsEditor } from "./ConditionsEditor";
import { DeviceEditor, DeviceListEditor } from "./DeviceTree";
import { EventPicker } from "./EventPicker";
import { ListEditor } from "./ListEditor";
import {
    FieldShell,
    NumberInput,
    SelectInput,
    TextArea,
    TextInput,
    Toggle,
} from "./primitives";
import type { NetworkDevice } from "@/schema/common";
import type { ConditionClause } from "@/schema/nodes";

/** Ready-made frame colours. Anything else is one click away in the picker. */
const GROUP_COLORS = [
    { value: "#64748b", label: "Slate" },
    { value: "#60a5fa", label: "Blue" },
    { value: "#34d399", label: "Green" },
    { value: "#fbbf24", label: "Amber" },
    { value: "#f472b6", label: "Pink" },
    { value: "#a78bfa", label: "Violet" },
    { value: "#fb923c", label: "Orange" },
    { value: "#22d3ee", label: "Cyan" },
] as const;

export function Field({
    def,
    nodeId,
    basePath = "",
}: {
    def: FieldDef;
    nodeId: string;
    basePath?: string;
}) {
    const node = useEditor((s) => {
        const quest = s.project.quests.find((q) => q.id === s.project.editor.activeQuestId);
        return quest?.graph.nodes.find((n) => n.id === nodeId) ?? null;
    });
    const updateNodeData = useEditor((s) => s.updateNodeData);

    if (!node) return null;

    // Conditional visibility: hide a field until a sibling holds the right value.
    if ("showWhen" in def && def.showWhen) {
        const siblingPath = basePath ? `${basePath}.${def.showWhen.key}` : def.showWhen.key;
        const current = getPath(node.data, siblingPath);
        const wanted = def.showWhen.equals;
        // Booleans are compared by their spelling, so a toggle can gate a field
        // with equals: "true".
        const seen = typeof current === "boolean" ? String(current) : current;
        const matches = Array.isArray(wanted)
            ? wanted.includes(seen as string)
            : seen === wanted;
        if (!matches) return null;
    }

    if (def.kind === "section") {
        return (
            <fieldset className="my-1 rounded-md border border-line/70 py-0.5">
                <legend className="ml-2 px-1 text-[10px] font-semibold tracking-wider text-ink-4 uppercase">
                    {def.label}
                </legend>
                {def.fields.map((child, i) => (
                    <Field
                        key={"key" in child ? child.key : `${i}-${child.kind}`}
                        def={child}
                        nodeId={nodeId}
                        basePath={basePath}
                    />
                ))}
            </fieldset>
        );
    }

    if (def.kind === "note") {
        return (
            <p
                className={cn(
                    "mx-3 my-2 flex items-start gap-1.5 rounded-md border px-2 py-1.5 text-[11px] leading-snug",
                    def.tone === "warn"
                        ? "border-warn/30 bg-warn/10 text-warn"
                        : "border-line bg-surface-2/60 text-ink-3",
                )}
            >
                <Icon
                    name={def.tone === "warn" ? "alert" : "info"}
                    size={12}
                    className="mt-px shrink-0"
                />
                <span>{def.text}</span>
            </p>
        );
    }

    const path = basePath ? `${basePath}.${def.key}` : def.key;
    const raw = getPath(node.data, path);

    const write = (value: unknown) => updateNodeData(nodeId, { [path]: value });
    const asString = (value: unknown) => (value === undefined || value === null ? "" : String(value));
    const asNumber = (value: unknown) => (typeof value === "number" ? value : Number(value) || 0);
    const asBool = (value: unknown) => value === true;
    const asArray = (value: unknown) => (Array.isArray(value) ? (value as Record<string, unknown>[]) : []);

    switch (def.kind) {
        case "text":
            return (
                <FieldShell label={def.label} hint={def.hint}>
                    <TextInput
                        ariaLabel={def.label}
                        value={asString(raw)}
                        onChange={write}
                        placeholder={def.placeholder}
                        mono={def.mono}
                    />
                </FieldShell>
            );

        case "date":
            return (
                <FieldShell label={def.label} hint={def.hint}>
                    <input
                        type="date"
                        aria-label={def.label}
                        value={asString(raw)}
                        onChange={(e) => write(e.target.value)}
                        className="w-full rounded-md border border-line bg-surface-2 px-2 py-1 text-[12px] text-ink outline-none focus:border-accent"
                    />
                </FieldShell>
            );

        case "textarea":
            return (
                <FieldShell label={def.label} hint={def.hint}>
                    <TextArea
                        ariaLabel={def.label}
                        value={asString(raw)}
                        onChange={write}
                        placeholder={def.placeholder}
                        mono={def.mono}
                        rows={def.rows ?? 3}
                    />
                </FieldShell>
            );

        case "number":
            return (
                <FieldShell label={def.label} hint={def.hint}>
                    <NumberInput
                        ariaLabel={def.label}
                        value={asNumber(raw)}
                        onChange={write}
                        min={def.min}
                        max={def.max}
                        step={def.step}
                    />
                </FieldShell>
            );

        case "slider": {
            const value = Math.min(def.max, Math.max(def.min, asNumber(raw)));
            return (
                <FieldShell label={def.label} hint={def.hint}>
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            aria-label={def.label}
                            min={def.min}
                            max={def.max}
                            step={def.step ?? 1}
                            value={value}
                            onChange={(e) => write(Number(e.target.value))}
                            className="h-1.5 w-full cursor-pointer accent-accent"
                        />
                        <span className="w-8 shrink-0 rounded border border-line bg-surface-2 py-0.5 text-center font-mono text-[11.5px] text-ink">
                            {value}
                        </span>
                    </div>
                    <div className="mt-0.5 flex justify-between text-[10px] text-ink-4">
                        <span>{def.min}</span>
                        <span>{def.max}</span>
                    </div>
                </FieldShell>
            );
        }

        case "color": {
            const current = asString(raw) || GROUP_COLORS[0].value;
            return (
                <FieldShell label={def.label} hint={def.hint}>
                    <ColourPicker
                        label={def.label}
                        value={current}
                        onChange={write}
                        presets={GROUP_COLORS}
                    />
                </FieldShell>
            );
        }

        case "image":
            return (
                <ImagePickerField
                    label={def.label}
                    hint={def.hint ?? ""}
                    ariaLabel={def.label}
                    value={asString(raw) || undefined}
                    onChange={(next) => write(next ?? "")}
                />
            );

        case "toggle":
            return (
                <Toggle
                    label={def.label}
                    hint={def.hint}
                    checked={asBool(raw)}
                    onChange={write}
                />
            );

        case "select":
            return (
                <FieldShell label={def.label} hint={def.hint}>
                    <SelectInput
                        ariaLabel={def.label}
                        value={asString(raw)}
                        onChange={write}
                        options={def.options}
                    />
                </FieldShell>
            );

        case "event":
            return (
                <FieldShell label={def.label} hint={def.hint}>
                    <EventPicker value={asString(raw)} onChange={write} />
                </FieldShell>
            );

        case "conditions": {
            const eventPath = basePath ? `${basePath}.event` : "event";
            const eventName = asString(getPath(node.data, eventPath));
            return (
                <FieldShell label={def.label} hint={def.hint}>
                    <ConditionsEditor
                        value={(raw as ConditionClause[] | undefined) ?? []}
                        onChange={(next) => write(next)}
                        eventName={eventName}
                    />
                </FieldShell>
            );
        }

        case "list":
            return (
                <FieldShell label={def.label} hint={def.hint}>
                    <ListEditor nodeId={nodeId} path={path} items={asArray(raw)} def={def} />
                </FieldShell>
            );

        case "deviceTree": {
            const value = raw as NetworkDevice | NetworkDevice[] | undefined;
            return (
                <FieldShell label={def.label} hint={def.hint}>
                    {Array.isArray(value) ? (
                        <DeviceListEditor nodeId={nodeId} path={path} devices={value} />
                    ) : value ? (
                        <DeviceEditor nodeId={nodeId} path={path} device={value} />
                    ) : (
                        <NoValue />
                    )}
                </FieldShell>
            );
        }

        default: {
            const exhaustive: never = def;
            return <NoValue label={String(exhaustive)} />;
        }
    }
}

function NoValue({ label }: { label?: ReactNode }) {
    return (
        <p className="rounded border border-dashed border-line px-2 py-2 text-center text-[11px] text-ink-4">
            {label ?? "Nothing to edit here."}
        </p>
    );
}
