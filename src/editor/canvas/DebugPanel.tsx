/**
 * The debug panel.
 *
 * Exists because the last several rounds followed the same shape: something
 * was silently refused upstream, the UI looked identical either way, and the
 * only way to find out was Zeis pasting console output. The panel answers the
 * questions I keep having to ask, without anyone opening devtools.
 *
 * What it shows, and why each earned its place:
 *
 *  - **Build stamp.** "Is the code you are running the code I just wrote?"
 *    A stale bundle has wasted more than one round.
 *  - **Gates.** Whether physics is allowed, and if not, exactly which switch
 *    refused it. This is the one that would have caught the reduced-motion
 *    veto immediately.
 *  - **Counters and FPS.** Separates "never started" from "started and looks
 *    wrong" — the distinction I could not make from a screenshot.
 *  - **Live tuning.** Feel is not testable. Zeis moves the sliders, reads off
 *    the numbers, and I make them the defaults.
 *  - **Event log.** The last sixty things that happened, so a gesture that
 *    ends in the wrong branch says so.
 *
 * Costs nothing when closed: no subscription, no timer, no render.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { EDITOR_BUILD } from "@/compiler/compile";
import { Icon } from "@/components/Icon";
import {
    clearDiagnostics,
    diagCounters,
    diagLog,
    physicsFps,
    subscribeDiagnostics,
} from "./diagnostics";
import {
    DEFAULT_TUNING,
    dampingRatio,
    resetWireTuning,
    setWireTuning,
    settleSeconds,
    subscribeWireTuning,
    wireTuning,
    type WireTuning,
} from "./wireTuning";
import { refusalReason, wirePhysicsRunning, wirePhysicsState } from "./wirePhysics";
import { wireMotionEnabled } from "./wireMotion";
import { wirePhysicsEnabled } from "./wirePhysicsPref";

const NUMBERS: { key: keyof WireTuning; label: string; min: number; max: number; step: number }[] = [
    { key: "stiffness", label: "Stiffness", min: 20, max: 1600, step: 10 },
    { key: "damping", label: "Damping", min: 2, max: 120, step: 1 },
    { key: "maxSag", label: "Max sag", min: 0, max: 300, step: 5 },
    { key: "tautDistance", label: "Taut at", min: 100, max: 1200, step: 20 },
    { key: "swing", label: "Swing", min: 0, max: 40, step: 0.5 },
    { key: "ghostMs", label: "Ghost ms", min: 0, max: 1000, step: 25 },
];

export function DebugPanel({ onClose }: { onClose: () => void }) {
    const tuning = useSyncExternalStore(subscribeWireTuning, wireTuning, () => DEFAULT_TUNING);
    const diagVersion = useSyncExternalStore(
        subscribeDiagnostics,
        () => diagCounters().physicsStarts + diagCounters().ghosts + diagCounters().dragEnds,
        () => 0,
    );
    void diagVersion; // subscription is the point; the values are read below

    /*
     * The frame counter and FPS change continuously while a wire is moving.
     * Sampling them on a slow timer keeps the panel readable and, more
     * importantly, keeps it from re-rendering sixty times a second — the panel
     * must not become the performance problem it exists to diagnose.
     */
    const [, tick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => tick((n) => n + 1), 250);
        return () => clearInterval(id);
    }, []);

    const counters = diagCounters();
    const refusal = refusalReason();
    const zeta = dampingRatio(tuning);

    return (
        <div
            role="dialog"
            aria-label="Debug panel"
            className="pointer-events-auto absolute top-3 right-3 z-[70] flex max-h-[calc(100%-1.5rem)] w-[320px] flex-col overflow-hidden rounded-lg border border-line-strong bg-surface/95 shadow-node backdrop-blur"
        >
            <div className="flex items-center gap-2 border-b border-line px-2.5 py-1.5">
                <Icon name="bug" size={13} className="text-warn" />
                <span className="flex-1 text-[12px] font-semibold text-ink">Debug</span>
                <button
                    type="button"
                    onClick={clearDiagnostics}
                    className="btn-ghost px-1.5 py-0.5 text-[10.5px]"
                    title="Clear the counters and the event log"
                >
                    Clear
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close the debug panel"
                    className="btn-ghost px-1.5 py-0.5"
                >
                    <Icon name="x" size={12} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2.5 py-2 text-[11px]">
                {/* Which code is actually loaded. A stale bundle looks exactly
                    like a broken feature. */}
                <Row label="Build" value={EDITOR_BUILD} />

                <Section>Wire physics</Section>
                <Row
                    label="Allowed"
                    value={refusal ? `no — ${refusal}` : "yes"}
                    tone={refusal ? "warn" : "ok"}
                />
                <Row label="Springy toggle" value={wirePhysicsEnabled() ? "on" : "off"} />
                <Row label="Animated toggle" value={wireMotionEnabled() ? "on" : "off"} />
                <Row
                    label="Loop"
                    value={wirePhysicsRunning() ? "running" : "idle"}
                    tone={wirePhysicsRunning() ? "ok" : undefined}
                />
                <Row label="Sag now" value={wirePhysicsState().sag.toFixed(1)} />
                <Row label="Frames" value={String(counters.physicsFrames)} />
                <Row label="FPS" value={physicsFps() ? physicsFps().toFixed(0) : "—"} />
                <Row label="Starts / refused" value={`${counters.physicsStarts} / ${counters.physicsRefused}`} />
                <Row label="Drags / ghosts" value={`${counters.dragStarts}→${counters.dragEnds} / ${counters.ghosts}`} />

                <Section>Tuning</Section>
                {NUMBERS.map((n) => (
                    <label key={n.key} className="mb-1.5 flex items-center gap-2">
                        <span className="w-[62px] shrink-0 text-ink-3">{n.label}</span>
                        <input
                            type="range"
                            min={n.min}
                            max={n.max}
                            step={n.step}
                            value={tuning[n.key]}
                            aria-label={n.label}
                            onChange={(e) => setWireTuning({ [n.key]: Number(e.target.value) })}
                            className="h-1.5 flex-1 cursor-pointer"
                        />
                        <span className="w-[46px] shrink-0 text-right font-mono text-[10.5px] text-ink">
                            {tuning[n.key]}
                        </span>
                    </label>
                ))}
                {/* The number that predicts the feel: under 1 it bounces, at 1
                    it arrives dead, over 1 it crawls in. */}
                <Row
                    label="Damping ratio"
                    value={`${zeta.toFixed(2)} ${zeta < 1 ? "(bouncy)" : zeta > 1 ? "(sluggish)" : "(critical)"}`}
                />
                <Row label="Settle" value={`${settleSeconds(tuning).toFixed(2)}s`} />
                <button
                    type="button"
                    onClick={resetWireTuning}
                    className="btn-ghost mt-1 w-full py-1 text-[10.5px]"
                >
                    Reset to defaults
                </button>

                <Section>Recent events</Section>
                <div className="max-h-[140px] overflow-y-auto rounded border border-line bg-void/60 p-1.5 font-mono text-[10px] leading-snug text-ink-3">
                    {diagLog().length === 0 ? (
                        <div className="text-ink-4">Nothing yet.</div>
                    ) : (
                        diagLog()
                            .slice()
                            .reverse()
                            .map((e, i) => (
                                <div key={i} className="truncate">
                                    <span className="text-ink-4">
                                        {new Date(e.at).toLocaleTimeString([], { hour12: false })}{" "}
                                    </span>
                                    <span className="text-ink-2">{e.tag}</span>
                                    {e.detail && <span className="text-ink-4"> · {e.detail}</span>}
                                </div>
                            ))
                    )}
                </div>
            </div>
        </div>
    );
}

function Section({ children }: { children: React.ReactNode }) {
    return (
        <div className="mt-2.5 mb-1 text-[9.5px] font-semibold tracking-wider text-ink-4 uppercase">
            {children}
        </div>
    );
}

function Row({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone?: "ok" | "warn";
}) {
    return (
        <div className="flex items-baseline justify-between gap-2 py-px">
            <span className="text-ink-3">{label}</span>
            <span
                className={
                    "truncate font-mono text-[10.5px] " +
                    (tone === "warn" ? "text-warn" : tone === "ok" ? "text-ok" : "text-ink")
                }
            >
                {value}
            </span>
        </div>
    );
}
