/**
 * Live-tunable numbers for the wire spring.
 *
 * The constants used to be `export const`, which meant every adjustment cost a
 * round trip: I change a number, Zeis rebuilds, drags a wire, describes how it
 * felt, I guess again. Feel is not something I can judge from a test, so the
 * numbers belong in the author's hands.
 *
 * Same shape as the other editor preferences (`snapGrid`, `wirePhysicsPref`):
 * a module-level object, a `useSyncExternalStore` subscription, and a
 * localStorage write. Not React state and not in the project document — these
 * are debug settings, not part of anyone's mod.
 *
 * The physics loop reads these once per frame through `wireTuning()`. That is
 * a plain property read on a module-level object, which is exactly as cheap as
 * reading a `const` was.
 */

const STORAGE_KEY = "qe.wireTuning";

export interface WireTuning {
    /** Spring constant. Higher is snappier — a heavier-feeling wire. */
    stiffness: number;
    /** Damping. Below ~2·√stiffness the wire bounces as it lands. */
    damping: number;
    /** Deepest the wire hangs, in flow units. */
    maxSag: number;
    /** Span at which the wire is pulled fully straight. */
    tautDistance: number;
    /**
     * How hard cursor movement throws the wire sideways — the pendulum.
     *
     * 0 is a pure hanging rope with no swing. Higher values make the belly of
     * the wire trail further behind the hand before the spring pulls it back.
     */
    swing: number;
    /** How long the release ghost takes to fade out, in ms. */
    ghostMs: number;
    /**
     * How long the released wire takes to wind back to its socket, in ms.
     *
     * The motion QA asked for: a vacuum-cleaner cable retracting on an
     * easeOutCubic ramp. Kept separate from the fade so the travel can carry
     * the eye while the fade stays out of its way.
     */
    retractMs: number;
}

/**
 * Tuned against QA (r111). Floatiness is natural frequency, not sag depth: at
 * stiffness 180 the spring took ~0.44s to settle, slow enough that the eye
 * reads the wire as weightless. 520/34 roughly halves that while holding the
 * damping ratio near 0.75, so it still bounces once or twice.
 */
export const DEFAULT_TUNING: WireTuning = {
    /*
     * Zeis's numbers, found with the debug panel sliders (r115). Worth
     * recording what they mean, since they are far from my guesses:
     *
     *   damping ratio 0.19 — very springy. My 520/34 sat at 0.75, which damps
     *   almost immediately; this oscillates a few times at ~4Hz before
     *   settling, which is what reads as a real cable.
     *
     *   taut at 340 rather than 560 — the wire straightens much sooner, so the
     *   swing fades quickly as it is pulled out.
     *
     *   ghost 20ms — near-instant. The retraction carries the motion now, so
     *   the fade should not compete with it.
     */
    stiffness: 700,
    damping: 10,
    maxSag: 125,
    tautDistance: 340,
    swing: 20,
    ghostMs: 20,
    retractMs: 260,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function readStored(): WireTuning {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_TUNING };
        const saved = JSON.parse(raw) as Partial<WireTuning>;
        // Merge rather than replace: a stored blob from an older build may be
        // missing keys a newer one needs.
        return { ...DEFAULT_TUNING, ...saved };
    } catch {
        return { ...DEFAULT_TUNING };
    }
}

let current: WireTuning = readStored();

/** The live numbers. Read by the physics loop each frame. */
export function wireTuning(): Readonly<WireTuning> {
    return current;
}

/** Change one or more numbers, and remember them. */
export function setWireTuning(patch: Partial<WireTuning>): void {
    current = { ...current, ...patch };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
        /* not being able to remember it is not a reason to fail */
    }
    for (const l of listeners) l();
}

/** Put every number back to the shipped default. */
export function resetWireTuning(): void {
    current = { ...DEFAULT_TUNING };
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* nothing to clean up */
    }
    for (const l of listeners) l();
}

/** Subscribe to changes (useSyncExternalStore contract). */
export function subscribeWireTuning(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/**
 * The damping ratio the current numbers produce.
 *
 * Shown in the debug panel because it is the number that actually predicts the
 * feel: below 1 the wire bounces, at 1 it arrives dead, above 1 it crawls in.
 * Tuning stiffness without it is guesswork.
 */
export function dampingRatio(t: Readonly<WireTuning> = current): number {
    return t.damping / (2 * Math.sqrt(t.stiffness));
}

/** Roughly how long the spring takes to come to rest, in seconds. */
export function settleSeconds(t: Readonly<WireTuning> = current): number {
    const omega = Math.sqrt(t.stiffness);
    const zeta = dampingRatio(t);
    if (zeta <= 0 || omega <= 0) return Infinity;
    return 4 / (zeta * omega);
}
