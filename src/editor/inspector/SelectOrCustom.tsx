/**
 * A dropdown with an escape hatch: fixed choices up top, a free-text box
 * underneath when none of them fits. Stored values are always plain strings —
 * picking "Anywhere" writes `*`, never a marker.
 */
import { useState } from "react";
import { SelectInput, TextInput } from "./primitives";
import { TokenTextInput } from "./TokenInsert";
import type { TokenSuggestion } from "./tokenSuggestions";

const CUSTOM = "__custom__";
const SAME = "__same__";

export function SelectOrCustomInput({
    ariaLabel,
    value,
    onChange,
    options,
    sameAsLabel,
    sameAsValue,
    placeholder,
    mono,
    tokenSuggestions,
}: {
    ariaLabel: string;
    value: string;
    onChange: (next: string) => void;
    options: readonly { value: string; label: string }[];
    /** Shown as an extra choice; picking it copies `sameAsValue`. */
    sameAsLabel?: string;
    sameAsValue?: string;
    placeholder?: string;
    mono?: boolean;
    /** When present, the custom box gets the tag picker. */
    tokenSuggestions?: TokenSuggestion[];
}) {
    const [customising, setCustomising] = useState(false);
    const matched = options.some((o) => o.value === value);
    const isSame =
        !matched && sameAsLabel !== undefined && value !== "" && value === sameAsValue;
    const showingCustom = customising || (!matched && !isSame);

    return (
        <div className="space-y-1">
            <SelectInput
                ariaLabel={ariaLabel}
                value={matched ? value : isSame ? SAME : CUSTOM}
                onChange={(v) => {
                    if (v === CUSTOM) {
                        setCustomising(true);
                        return;
                    }
                    setCustomising(false);
                    onChange(v === SAME ? (sameAsValue ?? "") : v);
                }}
                options={[
                    ...options,
                    ...(sameAsLabel ? [{ value: SAME, label: sameAsLabel }] : []),
                    { value: CUSTOM, label: "Custom…" },
                ]}
            />
            {showingCustom &&
                (tokenSuggestions ? (
                    <TokenTextInput
                        ariaLabel={`${ariaLabel} (custom)`}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        mono={mono}
                        suggestions={tokenSuggestions}
                    />
                ) : (
                    <TextInput
                        ariaLabel={`${ariaLabel} (custom)`}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        mono={mono}
                    />
                ))}
        </div>
    );
}
