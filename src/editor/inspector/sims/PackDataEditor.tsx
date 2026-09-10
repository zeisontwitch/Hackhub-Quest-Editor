/**
 * The community-data node's inspector face (r137). Its dropdowns come from
 * the loaded tool packs, not a static list — pack authors' labels and hints
 * ARE the interface (the no-code rule: quest authors never see a key, a
 * template, or a tag; they see "Host or IP" and a box that says what it is).
 */
import { FieldShell, SelectInput, TextInput, Toggle } from "@/editor/inspector/primitives";
import type { NodeOfType } from "@/schema/nodes";
import type { PackField } from "@/toolpacks/schema";
import { useEditor } from "@/store/editor";
import { usePacks } from "@/store/packs";

export function PackDataEditor({ node }: { node: NodeOfType<"world.packData"> }) {
    const packs = usePacks((s) => s.packs);
    const updateNodeData = useEditor((s) => s.updateNodeData);
    const setUi = useEditor((s) => s.setUi);
    const d = node.data;

    const pack = packs.find((p) => p.id === d.packId);
    /* Everything the form needs was snapshotted onto the node at authoring
       time, so it keeps working even after the pack is unloaded. */
    const snapFields = (d.fields ?? []) as PackField[];

    /** Pick a pack: snapshot everything the compile needs, clear the rest. */
    const choosePack = (id: string) => {
        const p = packs.find((x) => x.id === id);
        updateNodeData(node.id, {
            packId: p?.id ?? "",
            packName: p?.name ?? "",
            gameModName: p?.gameMod?.name ?? "",
            contractId: "",
            contractLabel: "",
            storageKey: "",
            merge: "replace",
            mergeBy: undefined,
            entry: undefined,
            fields: [],
            values: {},
        });
    };

    const chooseContract = (id: string) => {
        const c = pack?.storage.find((x) => x.id === id);
        updateNodeData(node.id, {
            contractId: c?.id ?? "",
            contractLabel: c?.label ?? "",
            storageKey: c?.key ?? "",
            merge: c?.merge ?? "replace",
            mergeBy: c?.mergeBy,
            entry: c?.entry ? JSON.parse(JSON.stringify(c.entry)) : undefined,
            fields: c?.fields ? JSON.parse(JSON.stringify(c.fields)) : [],
            values: {},
        });
    };

    const setValue = (key: string, value: string) => {
        updateNodeData(node.id, { values: { ...d.values, [key]: value } });
    };

    if (packs.length === 0 && !d.storageKey) {
        return (
            <div className="grid gap-2 px-3 pt-1">
                <p className="rounded-md border border-line/70 bg-surface-2 px-2.5 py-2 text-[10.5px] leading-relaxed text-ink-3">
                    This node hands quest data to a community tool mod. Load a tool pack first — it brings the pack's
                    events, its data shapes and the note about which in-game mod players need.
                </p>
                <button type="button" className="btn-default justify-center" onClick={() => setUi({ modal: "toolpacks" })}>
                    Open the tool pack manager
                </button>
            </div>
        );
    }

    return (
        <div className="grid gap-2 px-3 pt-1">
            <FieldShell label="Tool pack" hint="The community pack whose data this node hands over.">
                <SelectInput
                    ariaLabel="Tool pack"
                    value={d.packId}
                    onChange={choosePack}
                    options={[
                        { value: "", label: "Choose a pack…" },
                        ...packs.map((p) => ({ value: p.id, label: p.name })),
                    ]}
                />
            </FieldShell>

            {pack && (
                <FieldShell
                    label="What to hand over"
                    hint={pack.storage.find((c) => c.id === d.contractId)?.docs || "The pack declares what its game mod reads."}
                >
                    <SelectInput
                        ariaLabel="Data shape"
                        value={d.contractId}
                        onChange={chooseContract}
                        options={[
                            { value: "", label: pack.storage.length ? "Choose…" : "This pack offers no data shapes" },
                            ...pack.storage.map((c) => ({ value: c.id, label: c.label })),
                        ]}
                    />
                </FieldShell>
            )}

            {snapFields.length > 0 && (
                <>
                    {snapFields.map((f) => (
                        <PackFieldInput
                            key={f.key}
                            field={f}
                            value={d.values[f.key] ?? ""}
                            onChange={(v) => setValue(f.key, v)}
                        />
                    ))}
                    {d.merge === "replace" && d.mergeBy && (
                        <p className="text-[10px] leading-relaxed text-ink-4">
                            Replaces the pack's previous entry for the same{" "}
                            <code className="font-mono">{d.mergeBy}</code>, keeping the rest.
                        </p>
                    )}
                </>
            )}

            {d.packName && (
                <p className="rounded-md border border-warn/30 bg-warn/10 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-warn">
                    {d.gameModName
                        ? `Players need the ${d.gameModName} game mod installed for this to work — say so in your quest description.`
                        : "Players need this pack's in-game mod installed — say so in your quest description."}
                </p>
            )}
            {d.packId && !pack && (
                <p className="text-[10px] leading-relaxed text-ink-4">
                    The {d.packName} pack isn't loaded on this machine. Everything you chose here is saved in the
                    project, so the node keeps working — load the pack again to pick a different data shape.
                </p>
            )}
        </div>
    );
}

function PackFieldInput({
    field,
    value,
    onChange,
}: {
    field: PackField;
    value: string;
    onChange: (v: string) => void;
}) {
    const label = field.label || field.key;
    if (field.type === "boolean") {
        return (
            <Toggle
                id={`packdata-${field.key}`}
                label={label}
                hint={field.hint}
                checked={value === "true"}
                onChange={(v) => onChange(v ? "true" : "false")}
            />
        );
    }
    if (field.type === "number") {
        return (
            <FieldShell label={label} hint={field.hint}>
                <TextInput
                    ariaLabel={label}
                    value={value}
                    onChange={onChange}
                    placeholder="0"
                />
            </FieldShell>
        );
    }
    if (field.choices?.length) {
        return (
            <FieldShell label={label} hint={field.hint}>
                <SelectInput
                    ariaLabel={label}
                    value={value}
                    onChange={onChange}
                    options={[
                        { value: "", label: "Choose…" },
                        ...field.choices.map((c) => ({ value: c.value, label: c.label })),
                    ]}
                />
            </FieldShell>
        );
    }
    return (
        <FieldShell label={label} hint={field.hint}>
            <TextInput ariaLabel={label} value={value} onChange={onChange} />
        </FieldShell>
    );
}
