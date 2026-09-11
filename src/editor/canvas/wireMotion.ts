/**
 * The travelling dots on every wire.
 *
 * This is the fourth attempt, and the history is the design rationale.
 *
 * It was a CSS keyframe, then an SVG SMIL animation. Both were reported as
 * "the dots don't move", and neither could be disproven from a test, because
 * jsdom runs no animations — and both can be switched off from outside the
 * editor by stylesheet order or the OS "reduce animation" setting.
 *
 * r38 drove it from JavaScript: one requestAnimationFrame loop writing
 * `--qe-dash-offset` onto `document.documentElement`, with every wire reading
 * it. The dots moved. It also pinned the GPU — a custom property on the root
 * invalidates everything that can inherit it, so an IDLE editor spent 40.8% of
 * its time in style recalculation and repaint. The author's card spun up
 * audibly and lag grew with the graph.
 *
 * r42/r43 scoped that property to the canvas and handed the interpolation to
 * the browser. Better — no JavaScript ran at all while idle — but a fresh
 * profile still showed 29% of frame time in style computation, because the
 * property must *inherit* for the wires to read it, and re-inheriting it
 * invalidates every descendant of the canvas sixty times a second.
 *
 * So nothing inherits any more. Each wire's dot layer registers itself and
 * gets its own animation on `stroke-dashoffset` directly. The browser restyles
 * only the handful of paths whose dots are actually moving, the animation runs
 * off the main thread where the platform allows it, and an idle editor does no
 * work for wires at all.
 *
 * `requestAnimationFrame` survives only for engines without `Element.animate`,
 * and even then it is throttled to 15fps: the dots drift at 10px/s, so a
 * faster loop moves them less than a pixel per frame for nothing.
 *
 * All wires share one phase origin so they drift in step regardless of when
 * each was added to the canvas.
 */

/** Distance between two travelling dots, in pixels. */
export const DOT_GAP = 14;
/** Seconds for a dot to travel one gap at the default speed: 10px/s — a calm drift, not a stampede. */
export const DOT_PERIOD_S = 1.4;
/**
 * Fallback repaint rate, in frames per second. The dots move one 14px gap
 * every 1.4s; at 15fps each frame advances them by under a pixel, which is
 * already below what the eye resolves on a drifting dotted line.
 */
export const FALLBACK_FPS = 15;

const STORAGE_KEY = "hackhub-quest-editor:wire-motion:v1";
const PERIOD_KEY = "qe.dotPeriod";

/** The drift speeds offered in Settings, as seconds per dot gap. */
export const DOT_SPEEDS = [
    { id: "calm", label: "Calm", seconds: 2.4 },
    { id: "standard", label: "Standard", seconds: DOT_PERIOD_S },
    { id: "brisk", label: "Brisk", seconds: 0.8 },
] as const;

type Listener = () => void;

const listeners = new Set<Listener>();

function readStored(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) !== "off";
    } catch {
        // Private mode, or no storage at all: animate.
        return true;
    }
}

function readStoredPeriod(): number {
    try {
        const raw = Number(localStorage.getItem(PERIOD_KEY));
        return raw > 0 && raw <= 10 ? raw : DOT_PERIOD_S;
    } catch {
        return DOT_PERIOD_S;
    }
}

let enabled = readStored();
let dotPeriod = readStoredPeriod();

/** Seconds one dot takes to travel one gap — the live drift speed. */
export function dotPeriodS(): number {
    return dotPeriod;
}

/**
 * Change the drift speed, remember it, and restart any running dot animation
 * so the new speed is felt immediately (r43's per-layer animation registry is
 * what makes this a stop/start rather than a teardown).
 */
export function setDotPeriod(seconds: number): void {
    if (seconds <= 0 || seconds === dotPeriod) return;
    dotPeriod = seconds;
    try {
        localStorage.setItem(PERIOD_KEY, String(seconds));
    } catch {
        /* not being able to remember it is not a reason to fail */
    }
    if (enabled) {
        stop();
        start();
    }
    for (const l of listeners) l();
}

/**
 * Every wire's dot layer, so each can be animated on its own.
 *
 * r43 animated one custom property on the canvas element. That was a big
 * improvement on r38's document-root version, but a profile still showed 29%
 * of an idle frame in style computation: the property has to inherit for the
 * wires to read it, and re-inheriting it invalidates every descendant of the
 * canvas - every node, every port, every label - sixty times a second.
 *
 * So nothing inherits any more. Each dot path gets its own animation on
 * `stroke-dashoffset` directly, so the only elements the browser restyles are
 * the ones whose dots are actually moving.
 */
const dotLayers = new Set<SVGPathElement>();
const animations = new Map<SVGPathElement, Animation>();
let frame = 0;
let fallbackLast = 0;

/**
 * All wires must drift in step, so every animation is pinned to one origin
 * rather than to whenever its wire happened to mount.
 */
let phaseOrigin = 0;

function nowMs(): number {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/**
 * Write the current phase of the dash cycle onto one element. Exported for
 * tests, and used by the no-`Element.animate` fallback.
 */
export function paintDashOffset(ms: number, target?: SVGPathElement | null): void {
    const period = dotPeriodS();
    const phase = ((ms / 1000) % period) / period;
    const value = `${-(phase * DOT_GAP).toFixed(2)}px`;
    const targets = target ? [target] : [...dotLayers];
    for (const el of targets) el.style.strokeDashoffset = value;
}

function animate(el: SVGPathElement): void {
    if (animations.has(el)) return;
    if (typeof el.animate !== "function") return;
    const anim = el.animate(
        [{ strokeDashoffset: "0px" }, { strokeDashoffset: `${-DOT_GAP}px` }],
        { duration: dotPeriodS() * 1000, iterations: Infinity, easing: "linear" },
    );
    /* Pin every wire to the same origin so the dots stay in step no matter
       when each wire was added to the canvas. */
    try {
        anim.currentTime = (nowMs() - phaseOrigin) % (dotPeriodS() * 1000);
    } catch {
        /* Engines that refuse to seek still animate, just out of phase. */
    }
    animations.set(el, anim);
}

/**
 * Register a wire's dot layer. Returns an unregister function for cleanup.
 */
export function registerWireDots(el: SVGPathElement | null): () => void {
    if (!el) return () => {};
    if (!dotLayers.size) phaseOrigin = nowMs();
    dotLayers.add(el);
    if (enabled) start();
    return () => {
        const anim = animations.get(el);
        if (anim) {
            anim.cancel();
            animations.delete(el);
        }
        dotLayers.delete(el);
        /* Park this wire's dots as it leaves. stop() only reaches wires still
           registered, so without this the last one keeps whatever offset the
           final frame left on it. */
        el.style.strokeDashoffset = "0px";
        if (!dotLayers.size) stop();
    };
}

function fallbackTick(now: number) {
    /* Deliberately throttled. An unthrottled loop is what caused r38's
       problem, and the dots drift at 10px/s - anything above ~15fps is
       invisible effort. */
    if (now - fallbackLast >= 1000 / FALLBACK_FPS) {
        fallbackLast = now;
        paintDashOffset(now);
    }
    frame = requestAnimationFrame(fallbackTick);
}

function usesWebAnimations(): boolean {
    for (const el of dotLayers) return typeof el.animate === "function";
    return false;
}

function start() {
    if (!dotLayers.size) return;
    if (usesWebAnimations()) {
        for (const el of dotLayers) animate(el);
        return;
    }
    if (frame || typeof requestAnimationFrame !== "function") return;
    fallbackLast = 0;
    frame = requestAnimationFrame(fallbackTick);
}

function stop() {
    for (const anim of animations.values()) anim.cancel();
    animations.clear();
    if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
    }
    for (const el of dotLayers) el.style.strokeDashoffset = "0px";
}

/** Is the wire animation running? */
export function wireMotionEnabled(): boolean {
    return enabled;
}

/** Turn the animation on or off, and remember the choice. */
export function setWireMotion(on: boolean): void {
    enabled = on;
    try {
        localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
    } catch {
        /* not being able to remember it is not a reason to fail */
    }
    if (on) start();
    else stop();
    for (const l of listeners) l();
}

/** Subscribe to on/off changes (useSyncExternalStore contract). */
export function subscribeWireMotion(listener: Listener): () => void {
    listeners.add(listener);
    if (enabled) start();
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) stop();
    };
}

/** Test seam: is anything currently animating? */
export function wireMotionRunning(): boolean {
    return animations.size > 0 || frame !== 0;
}
