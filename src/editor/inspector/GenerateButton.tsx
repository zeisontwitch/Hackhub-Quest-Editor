/**
 * The auto-generate (dice) button (r161).
 *
 * A flat die beside a text field that fills it with a realistic, hardcoded
 * value — a plausible IP, a named contractor, an e-mail — for when an author
 * wants a concrete value but does not want to invent one. It sits next to the
 * existing sparkle (tag) button, so a field can offer both: dice for a
 * hardcoded value, sparkle for a `{{…}}` tag the game fills at runtime.
 *
 * Presentation only: it calls `onGenerate` and shows the result through the
 * caller's normal write path, so a click rides undo/redo like any typed edit.
 */
import { Icon } from "@/components/Icon";
import { TextInput } from "./primitives";

export function GenerateButton({
    label,
    onGenerate,
}: {
    /** What the button rolls, for the accessible name, e.g. "e-mail". */
    label: string;
    onGenerate: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onGenerate}
            className="btn-default shrink-0 px-2 py-1.5"
            title={`Generate a ${label}`}
            aria-label={`Generate ${label}`}
        >
            <Icon name="dice" size={12} />
        </button>
    );
}

/**
 * A plain text input with a dice button beside it, for the hand-written
 * inspector surfaces (the quest Employer panel, the device tree, the sims) that
 * do not go through the registry `Field` engine. Same layout as the registry
 * fields so the two look identical.
 */
export function TextInputWithGenerate({
    ariaLabel,
    value,
    onChange,
    onGenerate,
    generateLabel,
    placeholder,
    mono,
}: {
    ariaLabel: string;
    value: string;
    onChange: (next: string) => void;
    onGenerate: () => void;
    generateLabel: string;
    placeholder?: string;
    mono?: boolean;
}) {
    return (
        <div className="flex items-start gap-1">
            <div className="min-w-0 flex-1">
                <TextInput
                    ariaLabel={ariaLabel}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    mono={mono}
                />
            </div>
            <GenerateButton label={generateLabel} onGenerate={onGenerate} />
        </div>
    );
}
