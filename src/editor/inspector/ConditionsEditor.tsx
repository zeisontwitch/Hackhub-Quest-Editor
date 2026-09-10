/**
 * The condition builder.
 *
 * Authors describe a predicate as a list of plain-English clauses; the compiler
 * turns it into the JavaScript expression `QuestObjectiveTrigger.condition`
 * requires. Field names are offered from the event's real payload so a typo
 * cannot produce a condition that silently never matches.
 */
import { nanoid } from "nanoid";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import { CONDITION_OPS, CONDITION_OP_LABELS, UNARY_OPS, type ConditionClause } from "@/schema/nodes";
import { RUNTIME_TOKENS } from "@/schema/common";
import { eventFields, isPrimitivePayload } from "@/schema/events";
import { packEventByName, usePacks } from "@/store/packs";
import { SelectInput, TextInput } from "./primitives";

const OP_OPTIONS = CONDITION_OPS.map((op) => ({ value: op, label: CONDITION_OP_LABELS[op] }));

export function ConditionsEditor({
    value,
    onChange,
    eventName,
}: {
    value: ConditionClause[];
    onChange: (next: ConditionClause[]) => void;
    eventName?: string;
}) {
    const packs = usePacks((s) => s.packs);
    const packEv = eventName ? packEventByName(packs, eventName) : undefined;
    const fields = packEv ? packEv.fields : eventName ? eventFields(eventName) : [];
    const primitive = eventName && !packEv ? isPrimitivePayload(eventName) : false;

    const update = (index: number, patch: Partial<ConditionClause>) =>
        onChange(value.map((c, i) => (i === index ? { ...c, ...patch } : c)));

    const add = () =>
        onChange([
            ...value,
            {
                id: nanoid(8),
                join: value.length === 0 ? "and" : "and",
                field: primitive ? "" : (fields[0] ?? ""),
                op: "equals",
                value: "",
            },
        ]);

    const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

    const move = (index: number, delta: number) => {
        const target = index + delta;
        if (target < 0 || target >= value.length) return;
        const next = [...value];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    return (
        <div className="space-y-1.5">
            {value.length === 0 && (
                <p className="rounded-md border border-dashed border-line px-3 py-3 text-center text-[11.5px] leading-relaxed text-ink-4">
                    {primitive
                        ? "This event only gives one piece of information. Compare it using the name “value”."
                        : "No conditions — this fires whenever the event happens."}
                </p>
            )}

            {value.map((clause, index) => {
                const unary = UNARY_OPS.includes(clause.op);
                return (
                    <div
                        key={clause.id}
                        className="rounded-md border border-line bg-surface-2/50 p-2"
                    >
                        <div className="mb-1.5 flex items-center gap-1.5">
                            {index === 0 ? (
                                <span className="w-[42px] text-[10px] font-semibold tracking-wider text-ink-4 uppercase">
                                    When
                                </span>
                            ) : (
                                <select
                                    aria-label={`Join condition ${index + 1}`}
                                    value={clause.join}
                                    onChange={(e) =>
                                        update(index, { join: e.target.value as "and" | "or" })
                                    }
                                    className="h-5 w-[42px] rounded border border-line bg-surface-3 px-1 text-[10px] font-semibold tracking-wider text-ink-3 uppercase"
                                >
                                    <option value="and">and</option>
                                    <option value="or">or</option>
                                </select>
                            )}
                            <span className="flex-1" />
                            <button
                                type="button"
                                className="btn-icon size-5"
                                onClick={() => move(index, -1)}
                                disabled={index === 0}
                                title="Move up"
                                aria-label="Move condition up"
                            >
                                <Icon name="chevronDown" size={11} className="rotate-180" />
                            </button>
                            <button
                                type="button"
                                className="btn-icon size-5"
                                onClick={() => move(index, 1)}
                                disabled={index === value.length - 1}
                                title="Move down"
                                aria-label="Move condition down"
                            >
                                <Icon name="chevronDown" size={11} />
                            </button>
                            <button
                                type="button"
                                className="btn-icon size-5 text-ink-4 hover:text-danger"
                                onClick={() => remove(index)}
                                title="Remove condition"
                                aria-label="Remove condition"
                            >
                                <Icon name="trash" size={11} />
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <FieldCombobox
                                value={clause.field}
                                onChange={(field) => update(index, { field })}
                                fields={fields}
                                primitive={primitive}
                            />

                            <div className="flex gap-1.5">
                                <SelectInput
                                    ariaLabel={`Operator for condition ${index + 1}`}
                                    value={clause.op}
                                    onChange={(op) => update(index, { op: op as ConditionClause["op"] })}
                                    options={OP_OPTIONS}
                                />
                            </div>

                            {!unary && (
                                <ValueInput
                                    value={clause.value}
                                    onChange={(v) => update(index, { value: v })}
                                />
                            )}
                        </div>
                    </div>
                );
            })}

            <button type="button" onClick={add} className="btn-default w-full text-[11.5px]">
                <Icon name="plus" size={12} />
                Add condition
            </button>
        </div>
    );
}

/** Field name with suggestions from the event's real payload. */
function FieldCombobox({
    value,
    onChange,
    fields,
    primitive,
}: {
    value: string;
    onChange: (value: string) => void;
    fields: string[];
    primitive: boolean;
}) {
    if (primitive) {
        return (
            <div className="flex items-center gap-1.5 rounded border border-line bg-surface-2 px-2 py-1">
                <Icon name="info" size={11} className="shrink-0 text-ink-4" />
                <span className="text-[11px] text-ink-3">
                    the event value
                </span>
            </div>
        );
    }

    const known = value !== "" && fields.includes(value);

    return (
        <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
                <TextInput
                    ariaLabel="Event detail"
                    value={value}
                    onChange={onChange}
                    placeholder="detail name"
                    mono
                />
            </div>
            {fields.length > 0 && (
                <Popover.Root>
                    <Popover.Trigger asChild>
                        <button
                            type="button"
                            className="btn-default shrink-0 px-2 py-1.5"
                            title="Pick a detail this event provides"
                            aria-label="Pick a detail this event provides"
                        >
                            <Icon name="list" size={12} />
                        </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Content
                            align="end"
                            sideOffset={4}
                            className="z-50 w-44 overflow-hidden rounded-md border border-line bg-surface p-1 shadow-panel"
                        >
                            {fields.map((field) => (
                                <button
                                    key={field}
                                    type="button"
                                    onClick={() => onChange(field)}
                                    className={cn(
                                        "block w-full rounded px-2 py-1 text-left font-mono text-[11.5px] hover:bg-surface-2",
                                        field === value && "bg-accent-soft text-accent",
                                    )}
                                >
                                    {field}
                                </button>
                            ))}
                        </Popover.Content>
                    </Popover.Portal>
                </Popover.Root>
            )}
            {!known && value !== "" && fields.length > 0 && (
                <span className="shrink-0 text-warn" title="Not one of this event's known details">
                    <Icon name="alert" size={13} />
                </span>
            )}
        </div>
    );
}

/** Free-text value with a `{{token}}` insertion menu. */
function ValueInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex items-start gap-1.5">
            <div className="flex-1">
                <TextInput
                    ariaLabel="Value to compare"
                    value={value}
                    onChange={onChange}
                    placeholder="value"
                    mono
                />
            </div>
            <Popover.Root>
                <Popover.Trigger asChild>
                    <button
                        type="button"
                        className="btn-default shrink-0 px-2 py-1.5"
                        title="Insert a runtime value"
                        aria-label="Insert a runtime value"
                    >
                        <Icon name="sparkle" size={12} />
                    </button>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content
                        align="end"
                        sideOffset={4}
                        className="z-50 w-60 overflow-hidden rounded-md border border-line bg-surface p-1 shadow-panel"
                    >
                        {RUNTIME_TOKENS.map((token) => (
                            <button
                                key={token.token}
                                type="button"
                                onClick={() => onChange(token.token)}
                                className="flex w-full flex-col items-start gap-0.5 rounded px-2 py-1 text-left hover:bg-surface-2"
                            >
                                <span className="text-[11.5px] text-ink-2">{token.label}</span>
                                <span className="font-mono text-[10px] text-ink-4">{token.token}</span>
                            </button>
                        ))}
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </div>
    );
}
