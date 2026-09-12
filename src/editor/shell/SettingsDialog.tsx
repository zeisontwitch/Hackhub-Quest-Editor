/**
 * The settings sheet.
 *
 * Roadmap item 5: the author-facing home for the editor preferences that used
 * to live only in the debug panel (a developer tool) or on the canvas toolbar
 * (no explanations, no dials). Everything here reads and writes the existing
 * preference modules — the sheet owns no state of its own, so the canvas
 * toggles, the debug panel and this sheet can never disagree.
 *
 * A right-anchored sheet rather than a dimmed, centred modal, because every
 * setting is about the canvas and tuning means *seeing the canvas while
 * changing something* — the interaction model the debug panel proved. Radix
 * runs the dialog non-modal: no overlay, the canvas stays reachable, focus
 * moves into the sheet on open and Esc closes it. The sheet spans only the
 * workspace between the fixed-height top and status bars, so the rest of the
 * chrome — Export, Debug, the Settings button itself as a toggle — stays
 * clickable while it is open.
 *
 * Theme and font choices apply the moment they are clicked, and the canvas
 * beside the sheet is the preview (r141).
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import { clearDraft } from "@/store/autosave";
import {
    SNAP_STEPS,
    setSnapEnabled,
    setSnapStep,
    snapEnabled,
    snapStep,
    subscribeSnap,
} from "@/editor/canvas/snapGrid";
import {
    CANVAS_GRID_STYLES,
    canvasGrid,
    setCanvasGrid,
    subscribeCanvasGrid,
    type CanvasGridStyle,
} from "@/editor/canvas/canvasGrid";
import {
    DOT_PERIOD_S,
    dotPeriodS,
    setDotPeriod,
    setWireMotion,
    subscribeWireMotion,
    wireMotionEnabled,
} from "@/editor/canvas/wireMotion";
import {
    setWirePhysicsEnabled,
    subscribeWirePhysics,
    wirePhysicsEnabled,
} from "@/editor/canvas/wirePhysicsPref";
import {
    DEFAULT_TUNING,
    dampingRatio,
    resetWireTuning,
    settleSeconds,
    setWireTuning,
    subscribeWireTuning,
    wireTuning,
    type WireTuning,
} from "@/editor/canvas/wireTuning";
import {
    currentTheme,
    setTheme,
    subscribeTheme,
    THEMES,
    type ThemeDef,
} from "@/editor/settings/theme";
import {
    currentUiFont,
    setUiFont,
    subscribeUiFont,
    UI_FONTS,
    type UiFontId,
} from "@/editor/settings/uiFont";
import { resetEditorPreferences } from "@/editor/settings/reset";
import { useEditor } from "@/store/editor";

/** The dials, their ranges, and the one-line hint that makes each tunable
    without reading the physics. Wording follows wireTuning's own docs. */
const DIALS: {
    key: keyof WireTuning;
    label: string;
    hint: string;
    min: number;
    max: number;
    step: number;
}[] = [
    { key: "stiffness", label: "Stiffness", hint: "Spring constant — higher is snappier, a heavier-feeling wire.", min: 20, max: 1600, step: 10 },
    { key: "damping", label: "Damping", hint: "Below ~2·√stiffness the wire bounces as it lands.", min: 2, max: 120, step: 1 },
    { key: "maxSag", label: "Max sag", hint: "Deepest the wire hangs.", min: 0, max: 300, step: 5 },
    { key: "tautDistance", label: "Taut at", hint: "Span at which the wire is pulled fully straight.", min: 100, max: 1200, step: 20 },
    { key: "swing", label: "Swing", hint: "How hard cursor movement throws the wire sideways. 0 is a pure hanging rope.", min: 0, max: 40, step: 0.5 },
    { key: "retractMs", label: "Retract ms", hint: "How long a released wire takes to wind back to its socket.", min: 0, max: 1200, step: 20 },
    { key: "ghostMs", label: "Fade ms", hint: "How long the release ghost takes to fade out, over the end of its retraction.", min: 0, max: 1000, step: 5 },
];

const GRID_LABELS: Record<number, string> = { 11: "Fine", 22: "Standard", 44: "Coarse" };

export function SettingsDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const snap = useSyncExternalStore(subscribeSnap, snapEnabled, () => false);
    const step = useSyncExternalStore(subscribeSnap, snapStep, () => 22);
    const motion = useSyncExternalStore(subscribeWireMotion, wireMotionEnabled, () => true);
    const physics = useSyncExternalStore(subscribeWirePhysics, wirePhysicsEnabled, () => true);
    const tuning = useSyncExternalStore(subscribeWireTuning, wireTuning, () => DEFAULT_TUNING);
    const drift = useSyncExternalStore(subscribeWireMotion, dotPeriodS, () => DOT_PERIOD_S);
    const grid = useSyncExternalStore(subscribeCanvasGrid, canvasGrid, () => ({
        enabled: false,
        style: "squares",
        scale: 22,
        opacity: 50,
    }));
    const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => THEMES[0]);
    const font = useSyncExternalStore(subscribeUiFont, currentUiFont, () => UI_FONTS[0]);
    const zeta = dampingRatio(tuning);
    const toast = useEditor((s) => s.toast);

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
            <Dialog.Portal>
                <Dialog.Content
                    className={cn(
                        // Spans the workspace only — top-12/bottom-7 match the
                        // fixed-height bars (h-12 top bar, h-7 status bar), so
                        // the chrome around it stays live and clickable.
                        "fixed top-12 bottom-7 right-0 z-50 flex w-[min(380px,94vw)] flex-col",
                        "overflow-hidden border-l border-line bg-surface shadow-panel",
                    )}
                >
                    <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
                        <div>
                            <Dialog.Title className="text-[14px] font-semibold text-ink">
                                Settings
                            </Dialog.Title>
                            <Dialog.Description className="mt-0.5 text-[11.5px] leading-relaxed text-ink-4">
                                How your editing workspace behaves. None of this changes the
                                exported mod.
                            </Dialog.Description>
                        </div>
                        <Dialog.Close asChild>
                            <button type="button" className="btn-icon" aria-label="Close settings">
                                <Icon name="x" size={14} />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 pb-4">
                        <Section>Theme</Section>
                        <p className="mb-2 text-[11px] leading-relaxed text-ink-4">
                            Applies instantly — the canvas beside this sheet is the preview.
                            Node categories keep their colours except where a theme genuinely
                            needs them shifted.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {THEMES.map((t) => (
                                <ThemeCard
                                    key={t.id}
                                    theme={t}
                                    active={t.id === theme.id}
                                    onPick={() => setTheme(t.id)}
                                />
                            ))}
                        </div>

                        <Section>Typography</Section>
                        <label className="block">
                            <span className="mb-1 block text-[12px] font-medium text-ink-2">
                                Interface font
                            </span>
                            <select
                                aria-label="Interface font"
                                className="field-input"
                                value={font.id}
                                onChange={(e) => setUiFont(e.target.value as UiFontId)}
                            >
                                {UI_FONTS.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <p className="mt-1.5 text-[10.5px] leading-snug text-ink-4">{font.hint}</p>
                        <p className="mt-1 text-[10.5px] leading-snug text-ink-4">
                            Fonts are bundled with the editor — no internet needed.
                        </p>

                        <Section>Canvas</Section>
                        <SwitchRow
                            label="Snap to grid"
                            description="Nodes line up to the grid as you drag them. Off means completely free placement."
                            checked={snap}
                            onChange={setSnapEnabled}
                        />
                        <div className="border-b border-line py-2.5">
                            <div className="mb-1 text-[12.5px] font-medium text-ink">Grid size</div>
                            <Segmented
                                ariaLabel="Grid size"
                                options={SNAP_STEPS.map((s) => ({
                                    value: String(s),
                                    label: GRID_LABELS[s],
                                }))}
                                value={String(step)}
                                onPick={(v) => setSnapStep(Number(v) as (typeof SNAP_STEPS)[number])}
                            />
                            <p className="mt-1 text-[10.5px] leading-snug text-ink-4">
                                The cell nodes snap to — and the spacing align/distribute uses, so
                                what snaps together also spaces together.
                            </p>
                        </div>

                        <Section>Canvas grid</Section>
                        <SwitchRow
                            label="Show grid"
                            description="A visual grid on the canvas. Off by default — the plain canvas keeps the focus on your nodes."
                            checked={grid.enabled}
                            onChange={(on) => setCanvasGrid({ enabled: on })}
                        />
                        {grid.enabled && (
                            <>
                                <div className="grid grid-cols-3 gap-1.5 py-2.5">
                                    {CANVAS_GRID_STYLES.map((style) => (
                                        <GridStyleButton
                                            key={style.id}
                                            style={style}
                                            active={style.id === grid.style}
                                            onPick={() => setCanvasGrid({ style: style.id })}
                                        />
                                    ))}
                                </div>
                                <div className="border-b border-line pb-2.5">
                                    <NumberSlider
                                        label="Grid scale"
                                        hint="Cell size, in canvas units."
                                        min={4}
                                        max={200}
                                        value={grid.scale}
                                        onChange={(scale) => setCanvasGrid({ scale })}
                                    />
                                </div>
                                <div className="py-2.5">
                                    <NumberSlider
                                        label="Grid opacity"
                                        hint="0 hides the grid; 100 is full strength."
                                        min={0}
                                        max={100}
                                        value={grid.opacity}
                                        onChange={(opacity) => setCanvasGrid({ opacity })}
                                    />
                                </div>
                                <p className="mb-1 text-[10.5px] leading-snug text-ink-4">
                                    The grid is visual only — node snapping has its own size (above).
                                </p>
                            </>
                        )}

                        <Section>Wires</Section>
                        <SwitchRow
                            label="Animated wires"
                            description="Dots drift along resting wires, showing which way the story runs."
                            checked={motion}
                            onChange={setWireMotion}
                        />
                        <div className="border-b border-line py-2.5">
                            <div className="mb-1 text-[12.5px] font-medium text-ink">Drift speed</div>
                            <Segmented
                                ariaLabel="Drift speed"
                                options={[
                                    { value: "2.4", label: "Calm" },
                                    { value: "1.4", label: "Standard" },
                                    { value: "0.8", label: "Brisk" },
                                ]}
                                value={nearestDriftOption(drift)}
                                onPick={(v) => setDotPeriod(Number(v))}
                            />
                            <p className="mt-1 text-[10.5px] leading-snug text-ink-4">
                                How fast the dots travel along a resting wire.
                            </p>
                        </div>
                        <SwitchRow
                            label="Springy wires"
                            description="A wire you drag hangs and springs as you move it. Off means plain, straight wires — lighter on older machines."
                            checked={physics}
                            onChange={setWirePhysicsEnabled}
                        />

                        <Section>Wire physics — feel</Section>
                        <p className="mb-2 text-[11px] leading-relaxed text-ink-4">
                            These shape how a dragged wire feels while Springy wires is on. The
                            canvas stays live beside this sheet — drag a wire and watch.
                        </p>
                        {DIALS.map((dial) => (
                            <div key={dial.key} className="mb-3">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-[12px] font-medium text-ink-2">
                                        {dial.label}
                                    </span>
                                    <span className="font-mono text-[10.5px] text-ink">
                                        {tuning[dial.key]}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={dial.min}
                                    max={dial.max}
                                    step={dial.step}
                                    value={tuning[dial.key]}
                                    aria-label={dial.label}
                                    onChange={(e) =>
                                        setWireTuning({ [dial.key]: Number(e.target.value) })
                                    }
                                    className="mt-1 h-1.5 w-full cursor-pointer"
                                />
                                <p className="mt-0.5 text-[10.5px] leading-snug text-ink-4">
                                    {dial.hint}
                                </p>
                            </div>
                        ))}
                        {/* The numbers that predict the feel: under 1 it bounces, at 1
                            it arrives dead, over 1 it crawls in. Tuning stiffness
                            without the ratio is guesswork. */}
                        <div className="mb-3 rounded-lg border border-line bg-surface-2/40 px-3 py-2 text-[11px] text-ink-3">
                            <span className="font-mono text-ink-2">{zeta.toFixed(2)}</span>{" "}
                            damping ratio — {zeta < 1 ? "bouncy" : zeta > 1 ? "sluggish" : "critical"}
                            <span className="mx-1.5 text-ink-4">·</span>
                            settles in{" "}
                            <span className="font-mono text-ink-2">
                                {settleSeconds(tuning).toFixed(2)}s
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={resetWireTuning}
                            className="btn-default w-full py-1.5 text-[11.5px]"
                        >
                            <Icon name="refresh" size={12} />
                            Reset to defaults
                        </button>

                        <Section>Editor data</Section>
                        <DangerAction
                            label="Reset all editor preferences"
                            description="Theme, font, snapping, wires and physics numbers go back to what a fresh install uses. Your project is not touched."
                            confirmLabel="Really reset?"
                            onConfirmed={() => {
                                resetEditorPreferences();
                                toast("Editor preferences reset.", "ok");
                            }}
                        />
                        <DangerAction
                            label="Clear the autosaved draft"
                            description="Erases the browser's saved copy of this project. The canvas keeps what you see — but after a reload it is gone."
                            confirmLabel="Really erase?"
                            onConfirmed={() => {
                                clearDraft();
                                toast("Autosaved draft cleared.", "ok");
                            }}
                        />
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
/** The offered drift speed closest to the live one, so the segmented
    control always highlights something even if the stored value is off-menu. */
function nearestDriftOption(seconds: number): string {
    return ["2.4", "1.4", "0.8"].reduce((best, v) =>
        Math.abs(Number(v) - seconds) < Math.abs(Number(best) - seconds) ? v : best,
    );
}

function ThemeCard({
    theme,
    active,
    onPick,
}: {
    theme: ThemeDef;
    active: boolean;
    onPick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onPick}
            aria-pressed={active}
            title={theme.hint}
            className={cn(
                "flex flex-col gap-1.5 rounded-lg border p-2 text-left transition-colors",
                active
                    ? "border-accent/60 bg-accent-soft"
                    : "border-line bg-surface-2/40 hover:border-line-strong hover:bg-surface-2",
            )}
        >
            {/* Four chips: canvas, surface, ink, accent — a silhouette of the
                theme, drawn from the same values the CSS block uses. */}
            <span className="flex gap-1" aria-hidden>
                {[theme.preview.canvas, theme.preview.surface, theme.preview.ink, theme.preview.accent].map(
                    (colour, i) => (
                        <span
                            key={i}
                            className="h-4 flex-1 rounded-sm border border-black/20"
                            style={{ background: colour }}
                        />
                    ),
                )}
            </span>
            <span className="flex items-center gap-1 text-[11.5px] font-medium text-ink">
                {active && <span className="size-1.5 rounded-full bg-accent" aria-hidden />}
                {theme.label}
            </span>
        </button>
    );
}

/** One grid style, with a tiny live preview of its pattern. A visual
    person should see the pattern before picking it — the label alone is not
    enough to tell hexagons from diamond. */
function GridStyleButton({
    style,
    active,
    onPick,
}: {
    style: { id: CanvasGridStyle; label: string; hint: string };
    active: boolean;
    onPick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onPick}
            aria-pressed={active}
            title={style.hint}
            className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors",
                active
                    ? "border-accent/60 bg-accent-soft"
                    : "border-line bg-surface-2/40 hover:border-line-strong hover:bg-surface-2",
            )}
        >
            <GridStylePreview id={style.id} />
            <span className="flex items-center gap-1 text-[10.5px] font-medium text-ink-2">
                {active && <span className="size-1 rounded-full bg-accent" aria-hidden />}
                {style.label}
            </span>
        </button>
    );
}

/** A static miniature of each pattern, drawn in currentColor so it themes. */
function GridStylePreview({ id }: { id: CanvasGridStyle }) {
    const stroke = "currentColor";
    const common = { fill: "none", stroke, strokeWidth: 1 } as const;
    return (
        <svg width="44" height="22" viewBox="0 0 44 22" aria-hidden className="text-ink-3">
            {id === "squares" && (
                <g {...common}>
                    <path d="M11 0V22M33 0V22M0 11H44" />
                </g>
            )}
            {id === "dots" && (
                <g fill={stroke}>
                    <circle cx="7" cy="6" r="1.2" />
                    <circle cx="22" cy="6" r="1.2" />
                    <circle cx="37" cy="6" r="1.2" />
                    <circle cx="7" cy="16" r="1.2" />
                    <circle cx="22" cy="16" r="1.2" />
                    <circle cx="37" cy="16" r="1.2" />
                </g>
            )}
            {id === "crosses" && (
                <g {...common}>
                    <path d="M11 4v6M8 7h6M33 12v6M30 15h6" />
                </g>
            )}
            {id === "hexagons" && (
                <g {...common}>
                    <path d="M14 3l4 2.5v5L14 13l-4-2.5v-5zM30 8l4 2.5v5L30 18l-4-2.5v-5z" />
                </g>
            )}
            {id === "graph" && (
                <g {...common}>
                    <path d="M11 0V22M33 0V22M0 11H44" strokeWidth={0.5} />
                    <path d="M22 0V22" strokeWidth={1.5} />
                </g>
            )}
            {id === "diamond" && (
                <g {...common}>
                    <path d="M8 0l14 22M36 0L22 22M8 22L22 0M36 22L22 0" />
                </g>
            )}
        </svg>
    );
}

/** A slider with a number input beside it — for values people want to both
    feel (drag) and state exactly (type). Commits only in-range values while
    typing; an out-of-range entry is clamped on blur. */
function NumberSlider({
    label,
    hint,
    min,
    max,
    value,
    onChange,
}: {
    label: string;
    hint: string;
    min: number;
    max: number;
    value: number;
    onChange: (value: number) => void;
}) {
    const [text, setText] = useState(String(value));
    // Keep the field in step when the value changes elsewhere (reset, or the
    // slider itself).
    useEffect(() => {
        setText(String(value));
    }, [value]);

    const commitText = (raw: string) => {
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) {
            const clamped = Math.min(max, Math.max(min, Math.round(parsed)));
            onChange(clamped);
            setText(String(clamped));
        } else {
            setText(String(value));
        }
    };

    return (
        <div className="py-1">
            <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12px] font-medium text-ink-2">{label}</span>
                <input
                    type="number"
                    aria-label={`${label} (exact)`}
                    min={min}
                    max={max}
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        const parsed = Number(e.target.value);
                        if (e.target.value !== "" && Number.isFinite(parsed) && parsed >= min && parsed <= max) {
                            onChange(Math.round(parsed));
                        }
                    }}
                    onBlur={(e) => commitText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") commitText((e.target as HTMLInputElement).value);
                    }}
                    className="field-input w-20 px-1.5 py-0.5 text-right font-mono text-[11px]"
                />
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={1}
                value={value}
                aria-label={label}
                onChange={(e) => onChange(Number(e.target.value))}
                className="mt-1 h-1.5 w-full cursor-pointer"
            />
            <p className="mt-0.5 text-[10.5px] leading-snug text-ink-4">{hint}</p>
        </div>
    );
}

function Segmented({
    ariaLabel,
    options,
    value,
    onPick,
}: {
    ariaLabel: string;
    options: { value: string; label: string }[];
    value: string;
    onPick: (value: string) => void;
}) {
    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            className="flex overflow-hidden rounded-md border border-line"
        >
            {options.map((option, i) => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onPick(option.value)}
                        className={cn(
                            "flex-1 py-1 text-[11.5px] transition-colors",
                            i > 0 && "border-l border-line",
                            active
                                ? "bg-accent-soft font-medium text-ink"
                                : "text-ink-3 hover:bg-surface-2 hover:text-ink-2",
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

function DangerAction({
    label,
    description,
    confirmLabel,
    onConfirmed,
}: {
    label: string;
    description: string;
    confirmLabel: string;
    onConfirmed: () => void;
}) {
    const [arming, setArming] = useState(false);
    return (
        <div className="border-b border-line py-2.5 last:border-b-0">
            <div className="text-[12.5px] font-medium text-ink">{label}</div>
            <p className="mt-0.5 mb-1.5 text-[11px] leading-relaxed text-ink-4">{description}</p>
            {/* Two steps, like the pack manager's remove: the first click only
                arms, the second commits, and anything else disarms. */}
            {arming ? (
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="btn-default border-danger/50 text-danger hover:bg-danger/10"
                        onClick={() => {
                            setArming(false);
                            onConfirmed();
                        }}
                    >
                        <Icon name="alert" size={12} />
                        {confirmLabel}
                    </button>
                    <button
                        type="button"
                        className="btn-default"
                        onClick={() => setArming(false)}
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <button type="button" className="btn-default" onClick={() => setArming(true)}>
                    {label}
                </button>
            )}
        </div>
    );
}

function Section({ children }: { children: React.ReactNode }) {
    return (
        <div className="mt-4 mb-1 text-[9.5px] font-semibold tracking-wider text-ink-4 uppercase first:mt-1">
            {children}
        </div>
    );
}

function SwitchRow({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (on: boolean) => void;
}) {
    return (
        <div className="flex items-start justify-between gap-3 border-b border-line py-2.5 last:border-b-0">
            <div className="min-w-0">
                <div className="text-[12.5px] font-medium text-ink">{label}</div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-4">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={label}
                onClick={() => onChange(!checked)}
                className={cn(
                    "mt-0.5 relative h-5 w-9 shrink-0 rounded-full border transition-colors",
                    checked ? "border-accent/50 bg-accent/25" : "border-line bg-surface-2",
                )}
            >
                <span
                    aria-hidden
                    className={cn(
                        "absolute top-0.5 size-3.5 rounded-full transition-[left] duration-150",
                        checked ? "left-[18px] bg-accent" : "left-0.5 bg-ink-4",
                    )}
                />
            </button>
        </div>
    );
}
