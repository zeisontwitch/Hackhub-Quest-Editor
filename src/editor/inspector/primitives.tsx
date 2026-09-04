/**
 * Small form primitives shared by every inspector.
 *
 * Hand-built rather than generated from the schema: the requirement is that
 * non-coders never see raw JSON, so each control is chosen for its field
 * (docs/01 §4.1).
 */
import type { ReactNode } from "react";
import * as Switch from "@radix-ui/react-switch";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";

/**
 * A labelled control with its explanation behind an ⓘ.
 *
 * Hints used to print under every field, which made the inspector a wall of
 * grey text and still left most fields unexplained. Behind a tooltip, every one
 * of the ~150 fields can carry a real explanation at zero vertical cost.
 */
export function FieldShell({
    label,
    hint,
    children,
    htmlFor,
    className,
}: {
    label?: string;
    hint?: string;
    children: ReactNode;
    htmlFor?: string;
    className?: string;
}) {
    return (
        <div className={cn("px-3 py-2", className)}>
            {label && (
                <div className="mb-1.5 flex items-center gap-1">
                    <label className="field-label mb-0" htmlFor={htmlFor}>
                        {label}
                    </label>
                    {hint && <HintBadge label={label} hint={hint} />}
                </div>
            )}
            {children}
            {/* A hint with no label has nowhere to hang a badge — keep it inline. */}
            {!label && hint && <p className="field-hint">{hint}</p>}
        </div>
    );
}

/** The ⓘ that opens a field's explanation. */
export function HintBadge({ label, hint }: { label: string; hint: string }) {
    return (
        <Tooltip.Provider delayDuration={120} skipDelayDuration={400}>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <button
                        type="button"
                        aria-label={`What does “${label}” do?`}
                        className="-my-1 flex size-4 shrink-0 items-center justify-center rounded-full
                                   text-ink-4 transition-colors
                                   hover:bg-surface-3 hover:text-accent
                                   data-[state=delayed-open]:bg-surface-3 data-[state=delayed-open]:text-accent"
                    >
                        <Icon name="info" size={11} />
                    </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        side="left"
                        align="start"
                        sideOffset={8}
                        collisionPadding={12}
                        className="z-50 max-w-[280px] rounded-lg border border-line bg-surface-2
                                   px-2.5 py-2 text-[11.5px] leading-relaxed text-ink-2 shadow-panel"
                    >
                        <span className="mb-0.5 block text-[10px] font-semibold tracking-wider text-ink-4 uppercase">
                            {label}
                        </span>
                        {hint}
                        <Tooltip.Arrow className="fill-line" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    );
}

export function TextInput({
    value,
    onChange,
    placeholder,
    mono,
    id,
    ariaLabel,
    disabled,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    mono?: boolean;
    id?: string;
    ariaLabel?: string;
    /** Shown but not editable — the value is decided for the author. */
    disabled?: boolean;
}) {
    return (
        <input
            id={id}
            aria-label={ariaLabel}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className={cn("field-input", mono && "font-mono text-[12px]", disabled && "cursor-not-allowed opacity-60")}
        />
    );
}

export function NumberInput({
    value,
    onChange,
    min,
    max,
    step,
    id,
    ariaLabel,
}: {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    id?: string;
    ariaLabel?: string;
}) {
    return (
        <input
            id={id}
            aria-label={ariaLabel}
            type="number"
            value={Number.isFinite(value) ? value : 0}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
                const next = e.target.valueAsNumber;
                onChange(Number.isNaN(next) ? 0 : next);
            }}
            className="field-input font-mono text-[12px]"
        />
    );
}

export function TextArea({
    value,
    onChange,
    placeholder,
    mono,
    rows = 3,
    id,
    ariaLabel,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    mono?: boolean;
    rows?: number;
    id?: string;
    ariaLabel?: string;
}) {
    return (
        <textarea
            id={id}
            aria-label={ariaLabel}
            value={value}
            rows={rows}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={cn("field-textarea", mono && "font-mono text-[12px]")}
        />
    );
}

export function SelectInput({
    value,
    onChange,
    options,
    id,
    ariaLabel,
}: {
    value: string;
    onChange: (value: string) => void;
    options: readonly { value: string; label: string; hint?: string }[];
    id?: string;
    ariaLabel?: string;
}) {
    return (
        <div className="relative">
            <select
                id={id}
                aria-label={ariaLabel}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="field-input appearance-none pr-7"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <Icon
                name="chevronDown"
                size={13}
                className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-ink-4"
            />
        </div>
    );
}

export function Toggle({
    checked,
    onChange,
    label,
    hint,
    id,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    hint?: string;
    id?: string;
}) {
    return (
        <div className="flex items-start justify-between gap-3 px-3 py-2">
            <div className="min-w-0">
                <label
                    htmlFor={id}
                    className="block cursor-pointer text-[12.5px] leading-tight font-medium text-ink-2"
                >
                    {label}
                </label>
                {hint && <p className="field-hint">{hint}</p>}
            </div>
            <Switch.Root
                id={id}
                checked={checked}
                onCheckedChange={onChange}
                className={cn(
                    "relative mt-0.5 h-[18px] w-8 shrink-0 cursor-pointer rounded-full transition-colors",
                    "data-[state=checked]:bg-accent data-[state=unchecked]:bg-surface-3",
                    "border border-line data-[state=checked]:border-accent",
                )}
            >
                <Switch.Thumb
                    className={cn(
                        "block size-[14px] rounded-full bg-ink-2 transition-transform duration-150",
                        "data-[state=checked]:translate-x-[14px] data-[state=checked]:bg-void",
                        "data-[state=unchecked]:translate-x-[1px]",
                    )}
                />
            </Switch.Root>
        </div>
    );
}

export function SectionHeader({ children, action }: { children: ReactNode; action?: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-2 border-b border-line bg-surface-2/60 px-3 py-1.5">
            <h4 className="text-[10px] font-semibold tracking-wider text-ink-3 uppercase">
                {children}
            </h4>
            {action}
        </div>
    );
}

export function EmptyHint({ children }: { children: ReactNode }) {
    return (
        <p className="px-3 py-4 text-center text-[11.5px] leading-relaxed text-ink-4">{children}</p>
    );
}
