/**
 * The colour picker: presets, HSL sliders, and a hex field.
 *
 * Replaces `<input type="color">`, which hands the author whatever dialog the
 * operating system provides — a different size, language and shape on every
 * machine, drawn outside the app's own styling, and impossible to test.
 *
 * Built from sliders rather than a hue wheel or a saturation/value square on
 * purpose: those need pointer geometry, which means `getBoundingClientRect`
 * and the measurement trap that cost four rounds on node alignment (r97–r100).
 * A range input carries its own value, is keyboard-accessible for free, and
 * behaves identically in a test and a browser.
 */
import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/cn";
import { hexToHsl, hslToHex, isHex, readableInkOn, type HSL } from "./colour";

export interface ColourPickerProps {
    label: string;
    value: string;
    onChange: (hex: string) => void;
    presets: readonly { value: string; label: string }[];
}

const FALLBACK = "#64748b";

export function ColourPicker({ label, value, onChange, presets }: ColourPickerProps) {
    const id = useId();
    const current = isHex(value) ? value.toLowerCase() : FALLBACK;

    /*
     * The hue slider keeps its own position.
     *
     * Drag saturation to zero and the colour is grey, which has no hue — every
     * conversion reports 0. Deriving the slider from the colour would snap it
     * to red mid-drag and lose the author's place, so the hue is remembered
     * here and only re-read when the colour changes from outside.
     */
    const [hsl, setHsl] = useState<HSL>(() => hexToHsl(current) ?? { h: 0, s: 0, l: 50 });

    useEffect(() => {
        const next = hexToHsl(current);
        if (!next) return;
        setHsl((prev) => ({
            // A grey arriving from outside should not reset the hue slider.
            h: next.s === 0 ? prev.h : next.h,
            s: next.s,
            l: next.l,
        }));
    }, [current]);

    /** Text being typed in the hex box, which is invalid until it is finished. */
    const [draft, setDraft] = useState<string | null>(null);

    const applyHsl = (patch: Partial<HSL>) => {
        const next = { ...hsl, ...patch };
        setHsl(next);
        onChange(hslToHex(next));
    };

    const commitDraft = (text: string) => {
        const withHash = text.startsWith("#") ? text : `#${text}`;
        if (isHex(withHash)) onChange(withHash.toLowerCase());
        setDraft(null);
    };

    return (
        <div className="flex flex-col gap-2">
            {/* Presets: the fast path, and how most frames get coloured. */}
            <div className="flex flex-wrap items-center gap-1.5">
                {presets.map((swatch) => {
                    const active = current === swatch.value.toLowerCase();
                    return (
                        <button
                            key={swatch.value}
                            type="button"
                            title={swatch.label}
                            aria-label={swatch.label}
                            aria-pressed={active}
                            onClick={() => onChange(swatch.value)}
                            className={cn(
                                "size-6 rounded-md border transition",
                                active
                                    ? "border-ink ring-2 ring-accent/60"
                                    : "border-line hover:border-line-strong",
                            )}
                            style={{ background: swatch.value }}
                        />
                    );
                })}
            </div>

            <div className="flex items-center gap-2">
                {/* The result, large enough to judge against the presets. */}
                <span
                    aria-hidden
                    className="grid h-8 w-12 shrink-0 place-items-center rounded-md border border-line text-[10px] font-semibold"
                    style={{ background: current, color: readableInkOn(current) }}
                >
                    {current.slice(1).toUpperCase()}
                </span>

                <label className="flex items-center gap-1.5 text-[11px] text-ink-3">
                    <span className="sr-only">{`${label} — hex value`}</span>
                    <input
                        aria-label={`${label} — hex value`}
                        value={draft ?? current}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={(e) => commitDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                commitDraft((e.target as HTMLInputElement).value);
                            }
                            if (e.key === "Escape") {
                                e.preventDefault();
                                setDraft(null);
                            }
                        }}
                        spellCheck={false}
                        autoComplete="off"
                        className="w-[86px] rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-[11px] text-ink outline-none focus:border-accent"
                    />
                </label>
            </div>

            {/* Sliders. Hue is tinted along its track so the control shows what
                it does without needing a legend. */}
            <div className="flex flex-col gap-1.5">
                <Slider
                    id={`${id}-h`}
                    label="Hue"
                    ariaLabel={`${label} — hue`}
                    max={360}
                    value={Math.round(hsl.h)}
                    onChange={(h) => applyHsl({ h })}
                    track="linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)"
                    suffix="°"
                />
                <Slider
                    id={`${id}-s`}
                    label="Saturation"
                    ariaLabel={`${label} — saturation`}
                    max={100}
                    value={Math.round(hsl.s)}
                    onChange={(s) => applyHsl({ s })}
                    track={`linear-gradient(to right, ${hslToHex({ ...hsl, s: 0 })}, ${hslToHex({ ...hsl, s: 100 })})`}
                    suffix="%"
                />
                <Slider
                    id={`${id}-l`}
                    label="Lightness"
                    ariaLabel={`${label} — lightness`}
                    max={100}
                    value={Math.round(hsl.l)}
                    onChange={(l) => applyHsl({ l })}
                    track={`linear-gradient(to right, #000, ${hslToHex({ ...hsl, l: 50 })}, #fff)`}
                    suffix="%"
                />
            </div>
        </div>
    );
}

function Slider({
    id,
    label,
    ariaLabel,
    max,
    value,
    onChange,
    track,
    suffix,
}: {
    id: string;
    label: string;
    ariaLabel: string;
    max: number;
    value: number;
    onChange: (n: number) => void;
    track: string;
    suffix: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <label htmlFor={id} className="w-[62px] shrink-0 text-[11px] text-ink-3">
                {label}
            </label>
            <input
                id={id}
                type="range"
                min={0}
                max={max}
                value={value}
                aria-label={ariaLabel}
                onChange={(e) => onChange(Number(e.target.value))}
                className="qe-colour-slider h-2 flex-1 cursor-pointer appearance-none rounded-full border border-line"
                style={{ background: track }}
            />
            <span className="w-[38px] shrink-0 text-right font-mono text-[10.5px] text-ink-4">
                {value}
                {suffix}
            </span>
        </div>
    );
}
