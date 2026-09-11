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
 * setting is about the canvas and tuning wire feel means *seeing wires while
 * moving a dial* — the interaction model the debug panel already proved.
 * Radix runs the dialog non-modal: no overlay, the canvas stays reachable,
 * focus moves into the sheet on open and Esc closes it. The sheet spans only
 * the workspace between the fixed-height top and status bars, so the rest of
 * the chrome — Export, Debug, the Settings button itself as a toggle — stays
 * clickable while it is open.
 */
import { useSyncExternalStore } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import { snapEnabled, setSnapEnabled, subscribeSnap } from "@/editor/canvas/snapGrid";
import {
    wireMotionEnabled,
    setWireMotion,
    subscribeWireMotion,
} from "@/editor/canvas/wireMotion";
import {
    wirePhysicsEnabled,
    setWirePhysicsEnabled,
    subscribeWirePhysics,
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

export function SettingsDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const snap = useSyncExternalStore(subscribeSnap, snapEnabled, () => false);
    const motion = useSyncExternalStore(subscribeWireMotion, wireMotionEnabled, () => true);
    const physics = useSyncExternalStore(subscribeWirePhysics, wirePhysicsEnabled, () => true);
    const tuning = useSyncExternalStore(subscribeWireTuning, wireTuning, () => DEFAULT_TUNING);
    const zeta = dampingRatio(tuning);

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
            <Dialog.Portal>
                <Dialog.Content
                    className={cn(
                        // Spans the workspace only — top-12/bottom-7 match the
                        // fixed-height bars (h-12 top bar, h-7 status bar), so
                        // the chrome around it stays live and clickable.
                        "fixed top-12 bottom-7 right-0 z-50 flex w-[min(360px,94vw)] flex-col",
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
                        <Section>Canvas</Section>
                        <SwitchRow
                            label="Snap to grid"
                            description="Nodes line up to the grid as you drag them. Off means completely free placement."
                            checked={snap}
                            onChange={setSnapEnabled}
                        />

                        <Section>Wires</Section>
                        <SwitchRow
                            label="Animated wires"
                            description="Dots drift along resting wires, showing which way the story runs."
                            checked={motion}
                            onChange={setWireMotion}
                        />
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
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
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
