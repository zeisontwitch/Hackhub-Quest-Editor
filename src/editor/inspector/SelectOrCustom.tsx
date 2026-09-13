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
    sameAsEmptyHint,
    placeholder,
    mono,
    tokenSuggestions,
}: {
    ariaLabel: string;
    value: string;
    onChange: (next: string) => void;
    options: readonly { value: string; label: string; meaning?: string }[];
    /** Shown as an extra choice; picking it copies `sameAsValue`. */
    sameAsLabel?: string;
    sameAsValue?: string;
    /** Shown, disabled, while there is nothing to copy. */
    sameAsEmptyHint?: string;
    placeholder?: string;
    mono?: boolean;
    /** When present, the custom box gets the tag picker. */
    tokenSuggestions?: TokenSuggestion[];
}) {
    const [customising, setCustomising] = useState(false);
    const matchedOption = options.find((o) => o.value === value);
    const matched = matchedOption !== undefined;
    const isSame =
        !matched && sameAsLabel !== undefined && value !== "" && value === sameAsValue;
    const showingCustom = customising || (!matched && !isSame);
    // The custom box can hold a choice's value (the author picked Custom
    // while "Anywhere" was set). Say what it means, with a way back.
    const customMeaning = showingCustom ? options.find((o) => o.value === value && o.meaning) : undefined;
    // Copying an empty field writes "" and looks broken — the choice stays
    // disabled, saying what to fill first, until there is something to copy.
    const sameAsEmpty = (sameAsValue ?? "") === "";

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
                    if (v === SAME && sameAsEmpty) return;
                    setCustomising(false);
                    onChange(v === SAME ? (sameAsValue ?? "") : v);
                }}
                options={[
                    ...options,
                    ...(sameAsLabel
                        ? [
                              {
                                  value: SAME,
                                  label: sameAsEmpty
                                      ? (sameAsEmptyHint ?? `${sameAsLabel} (nothing to copy yet)`)
                                      : sameAsLabel,
                                  disabled: sameAsEmpty,
                              },
                          ]
                        : []),
                    { value: CUSTOM, label: "Custom…" },
                ]}
            />
            {showingCustom && (
                <>
                    {tokenSuggestions ? (
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
                    )}
                    {customMeaning && (
                        <p className="field-hint">
                            “{value}” means: {customMeaning.meaning}{" "}
                            <button
                                type="button"
                                className="underline underline-offset-2 hover:text-ink-2"
                                onClick={() => setCustomising(false)}
                                aria-label={`Use ${customMeaning.label} instead`}
                            >
                                Use “{customMeaning.label}” instead
                            </button>
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
