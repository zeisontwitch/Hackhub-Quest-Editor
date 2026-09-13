/**
 * Instrumentation for the debug panel.
 *
 * Built after a run of bugs that were invisible from inside a test but obvious
 * from one line of console output — most recently a wire that never moved
 * because `motionAllowed` was quietly false, which cost several rounds of me
 * guessing while Zeis re-tested.
 *
 * The pattern that keeps repeating: the code is fine, but something upstream
 * refuses it, and there is no way to see that from the UI. So this records the
 * facts that separate "not running" from "running and wrong" — which gate
 * refused, how many frames actually rendered, what the last event was, and
 * which build is even loaded.
 *
 * ## Cost when the panel is closed
 *
 * Near zero, and deliberately so. Counters are integer increments on a
 * module-level object; the ring buffer is a fixed 60-entry array that is
 * overwritten in place, never grown. Nothing subscribes unless the panel is
 * open, so nothing re-renders. The r42/r95 rule stands: no per-frame React
 * work, no writes above the canvas.
 */

/** How many recent events to keep. Fixed, so the buffer never grows. */
const LOG_SIZE = 60;

export interface DiagEvent {
    at: number;
    tag: string;
    detail: string;
}

export interface Counters {
    /** Frames the physics loop has painted this session. */
    physicsFrames: number;
    /** Times the loop was asked to start. */
    physicsStarts: number;
    /** Times it was refused, and by what. */
    physicsRefused: number;
    /** Ghosts spawned. */
    ghosts: number;
    /** Connection drags begun. */
    dragStarts: number;
    /** Connection drags ended. */
    dragEnds: number;
}

const counters: Counters = {
    physicsFrames: 0,
    physicsStarts: 0,
    physicsRefused: 0,
    ghosts: 0,
    dragStarts: 0,
    dragEnds: 0,
};

/* A fixed ring, written in place. */
const log: DiagEvent[] = [];
let writeAt = 0;

type Listener = () => void;
const listeners = new Set<Listener>();
let notifyQueued = false;

/**
 * Tell the panel something changed — at most once per frame.
 *
 * Coalesced on purpose: `record()` can be called several times inside one
 * frame, and waking React for each would be exactly the per-frame re-render
 * this project has twice paid for.
 */
function notify(): void {
    if (notifyQueued || listeners.size === 0) return;
    notifyQueued = true;
    const flush = () => {
        notifyQueued = false;
        for (const l of listeners) l();
    };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(flush);
    else setTimeout(flush, 16);
}

/** Note something worth seeing in the panel. */
export function record(tag: string, detail: string = ""): void {
    const entry = { at: Date.now(), tag, detail };
    if (log.length < LOG_SIZE) log.push(entry);
    else log[writeAt] = entry;
    writeAt = (writeAt + 1) % LOG_SIZE;
    notify();
}

/** Bump a counter. Cheap enough to call every frame. */
export function count(key: keyof Counters, by = 1): void {
    counters[key] += by;
    // Frames are counted every tick; waking the panel each time would defeat
    // the point. The panel samples counters on its own schedule instead.
    if (key !== "physicsFrames") notify();
}

/** The counters, for display. */
export function diagCounters(): Readonly<Counters> {
    return counters;
}

/** The event log, oldest first. */
export function diagLog(): DiagEvent[] {
    if (log.length < LOG_SIZE) return [...log];
    return [...log.slice(writeAt), ...log.slice(0, writeAt)];
}

/** Forget everything. */
export function clearDiagnostics(): void {
    for (const key of Object.keys(counters) as (keyof Counters)[]) counters[key] = 0;
    log.length = 0;
    writeAt = 0;
    notify();
}

/** Subscribe to changes (useSyncExternalStore contract). */
export function subscribeDiagnostics(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/**
 * A rolling frames-per-second figure for the physics loop.
 *
 * Sampled from the loop's own ticks rather than a separate rAF, so it measures
 * what the wire is actually getting rather than what the browser could manage.
 */
let lastFrameAt = 0;
let smoothedFps = 0;

export function noteFrame(nowMs: number): void {
    count("physicsFrames");
    if (lastFrameAt > 0) {
        const dt = nowMs - lastFrameAt;
        if (dt > 0) {
            const instant = 1000 / dt;
            // Exponential smoothing: a single slow frame should not dominate.
            smoothedFps = smoothedFps === 0 ? instant : smoothedFps * 0.9 + instant * 0.1;
        }
    }
    lastFrameAt = nowMs;
}

/** Frames per second the physics loop is currently achieving. */
export function physicsFps(): number {
    return smoothedFps;
}

/** Called when a drag ends, so the next one measures cleanly. */
export function resetFrameClock(): void {
    lastFrameAt = 0;
    smoothedFps = 0;
}
