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
import { clampHour, clampMinute, pad2 } from "@/schema/timer";

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
    warning,
    children,
    htmlFor,
    className,
}: {
    label?: string;
    hint?: string;
    /** A problem with this field's current value; renders the red ⚠ badge. */
    warning?: { detail: string; nextStep: string; severity: "warn" | "danger" };
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
                    {warning && <WarningBadge {...warning} />}
                    {hint && <HintBadge label={label} hint={hint} />}
                </div>
            )}
            {children}
            {/* A hint with no label has nowhere to hang a badge — keep it inline. */}
            {!label && hint && <p className="field-hint">{hint}</p>}
            {/* A warning with no label: put the explainer inline too. */}
            {!label && warning && (
                <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-snug text-danger">
                    <Icon name="alert" size={12} className="mt-px shrink-0" />
                    <span>
                        {warning.detail} {warning.nextStep}
                    </span>
                </p>
            )}
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

/**
 * The red ⚠ that opens a field's problem and its fix.
 *
 * Distinct from the ⓘ (which explains what a field is): this appears only when
 * the field's current value will not work, and states the concrete next step.
 */
export function warningCalloutClass(severity: "warn" | "danger") {
    return cn(
        "z-50 max-w-[300px] rounded-lg border bg-surface-2 px-2.5 py-2 text-[11.5px] leading-relaxed text-ink-2 shadow-panel",
        severity === "danger" ? "border-danger/60" : "border-warn/60",
    );
}

export function WarningBadge({
    detail,
    nextStep,
    severity,
}: {
    detail: string;
    nextStep: string;
    severity: "warn" | "danger";
}) {
    const tone = severity === "danger" ? "text-danger" : "text-warn";
    return (
        <Tooltip.Provider delayDuration={120} skipDelayDuration={400}>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <button
                        type="button"
                        aria-label={`Warning: ${detail} ${nextStep}`}
                        className={cn(
                            "-my-1 flex size-4 shrink-0 items-center justify-center rounded-full transition-colors",
                            tone,
                            "hover:bg-surface-3 data-[state=delayed-open]:bg-surface-3",
                        )}
                    >
                        <Icon name="alert" size={11} />
                    </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        side="left"
                        align="start"
                        sideOffset={8}
                        collisionPadding={12}
                        className={warningCalloutClass(severity)}
                    >
                        <span className={cn("flex items-center gap-1 text-[10px] font-semibold uppercase", tone)}>
                            <Icon name="alert" size={11} />
                            {severity === "danger" ? "Needs fixing" : "Worth checking"}
                        </span>
                        <span className="mt-1 block">{detail}</span>
                        <span className="mt-1.5 block text-ink-3">
                            <span className="font-semibold text-ink-2">Next step:</span> {nextStep}
                        </span>
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
    inputRef,
    onBlur,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    mono?: boolean;
    id?: string;
    ariaLabel?: string;
    /** Shown but not editable — the value is decided for the author. */
    disabled?: boolean;
    /** Receives the element, so the token picker can insert at the caret. */
    inputRef?: (el: HTMLInputElement | HTMLTextAreaElement | null) => void;
    /** Fires when the field loses focus — where the website builder
        normalizes hosts and paths (never mid-keystroke). */
    onBlur?: () => void;
}) {
    return (
        <input
            id={id}
            aria-label={ariaLabel}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            ref={inputRef as (el: HTMLInputElement | null) => void}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
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
    suffix,
}: {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    id?: string;
    ariaLabel?: string;
    /** A unit word printed after the box — "days", "hours" (r176). */
    suffix?: string;
}) {
    const input = (
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
    if (!suffix) return input;
    /* The unit sits after the box rather than inside it: the row's cells are
       narrow, and "minutes" would clip against the spinner arrows inside. */
    return (
        <div className="flex items-center gap-1.5">
            <div className="min-w-0 flex-1">{input}</div>
            <span aria-hidden="true" className="shrink-0 text-[10.5px] tracking-wide text-ink-4">
                {suffix}
            </span>
        </div>
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
    inputRef,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    mono?: boolean;
    rows?: number;
    id?: string;
    ariaLabel?: string;
    /** Receives the element, so the token picker can insert at the caret. */
    inputRef?: (el: HTMLInputElement | HTMLTextAreaElement | null) => void;
}) {
    return (
        <textarea
            id={id}
            aria-label={ariaLabel}
            value={value}
            rows={rows}
            placeholder={placeholder}
            ref={inputRef as (el: HTMLTextAreaElement | null) => void}
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
    display,
}: {
    value: string;
    onChange: (value: string) => void;
    options: readonly { value: string; label: string; hint?: string; disabled?: boolean }[];
    id?: string;
    ariaLabel?: string;
    /** "segmented" draws the choices as a small button group instead (r176). */
    display?: "segmented";
}) {
    /* Two or three short choices are faster to hit than a dropdown, and the
       chosen one is visible without opening anything. A `title` still carries
       whatever the option itself explains. */
    if (display === "segmented") {
        return (
            <div
                role="group"
                aria-label={ariaLabel}
                className="flex gap-1 rounded-md border border-line bg-surface-2 p-0.5"
            >
                {options.map((o) => {
                    const active = o.value === value;
                    return (
                        <button
                            key={o.value}
                            type="button"
                            aria-pressed={active}
                            disabled={o.disabled}
                            title={o.hint}
                            onClick={() => onChange(o.value)}
                            className={cn(
                                "min-w-0 flex-1 truncate rounded-[5px] px-2 py-1 text-[11.5px] font-medium transition-colors",
                                "disabled:pointer-events-none disabled:opacity-40",
                                active
                                    ? "bg-accent text-void"
                                    : "text-ink-3 hover:bg-surface-3 hover:text-ink",
                            )}
                        >
                            {o.label}
                        </button>
                    );
                })}
            </div>
        );
    }
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
                    <option key={o.value} value={o.value} disabled={o.disabled}>
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
    hintTooltip,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    hint?: string;
    id?: string;
    /** Show the hint as a mouse-over ⓘ next to the label (the FieldShell
        pattern) instead of an always-visible paragraph under it. */
    hintTooltip?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-3 px-3 py-2">
            <div className="min-w-0">
                {hintTooltip && hint ? (
                    <div className="flex items-center gap-1">
                        <label
                            htmlFor={id}
                            className="block cursor-pointer text-[12.5px] leading-tight font-medium text-ink-2"
                        >
                            {label}
                        </label>
                        <HintBadge label={label} hint={hint} />
                    </div>
                ) : (
                    <label
                        htmlFor={id}
                        className="block cursor-pointer text-[12.5px] leading-tight font-medium text-ink-2"
                    >
                        {label}
                    </label>
                )}
                {hint && !hintTooltip && <p className="field-hint">{hint}</p>}
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

/**
 * The hour and minute as the game's own digital clock (r176).
 *
 * Two `spinbutton`s: click the ▲/▼ steppers or press ↑/↓. Both wrap *locally*
 * (23↔00, 59↔00) so a keypress can never silently change the day the timer
 * lands on. The flourishes are CSS only — the colon breathes while the control
 * has focus, and a digit flips once when its value changes (the span is keyed
 * by the value, so a change remounts it and restarts the one-shot animation).
 * Nothing here runs per frame, and both animations honour
 * `prefers-reduced-motion` (see src/index.css).
 */
export function ClockInput({
    hour,
    minute,
    onChange,
}: {
    hour: number;
    minute: number;
    onChange: (next: { hour?: number; minute?: number }) => void;
}) {
    const h = clampHour(hour);
    const m = clampMinute(minute);
    const bump = (part: "hour" | "minute", delta: number) => {
        if (part === "hour") onChange({ hour: (((h + delta) % 24) + 24) % 24 });
        else onChange({ minute: (((m + delta) % 60) + 60) % 60 });
    };

    const column = (part: "hour" | "minute", value: number, max: number) => (
        <div className="qe-clock-col">
            <button
                type="button"
                tabIndex={-1}
                className="qe-clock-step"
                aria-label={`Later ${part}`}
                onClick={() => bump(part, 1)}
            >
                ▲
            </button>
            <div
                role="spinbutton"
                tabIndex={0}
                aria-label={part === "hour" ? "Hour" : "Minute"}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={value}
                aria-valuetext={pad2(value)}
                onKeyDown={(e) => {
                    if (e.key === "ArrowUp") {
                        e.preventDefault();
                        bump(part, 1);
                    } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        bump(part, -1);
                    }
                }}
                className="qe-clock-slot"
            >
                <span key={value} className="qe-clock-num" aria-hidden="true">
                    {pad2(value)}
                </span>
            </div>
            <button
                type="button"
                tabIndex={-1}
                className="qe-clock-step"
                aria-label={`Earlier ${part}`}
                onClick={() => bump(part, -1)}
            >
                ▼
            </button>
        </div>
    );

    return (
        <div className="qe-clock">
            <div className="qe-clock-panel" role="group" aria-label="In-game clock time">
                {column("hour", h, 23)}
                <span className="qe-clock-colon" aria-hidden="true">
                    :
                </span>
                {column("minute", m, 59)}
            </div>
            <div className="qe-clock-caption" aria-hidden="true">
                <span>h</span>
                <span className="qe-clock-gap" />
                <span>m</span>
            </div>
            <p className="qe-clock-note">in-game clock time</p>
        </div>
    );
}
