/**
 * Physics for the wire being dragged off a socket.
 *
 * Scope is deliberately one wire — the held one. Resting wires stay static
 * paths drawn by `TypedEdge`; nothing here touches them.
 *
 * ## Why a spring and not a rope
 *
 * The behaviour asked for is: hangs, bounces, pulls straight past a distance,
 * snaps back on release. That is one degree of freedom — how far the middle of
 * the wire lags behind a straight line. A damped spring on that single scalar
 * gives the bounce for free (a spring *is* a bounce), is unconditionally
 * stable with a semi-implicit Euler step, and costs about six multiplies a
 * frame. A Verlet rope would simulate N particles and need constraint
 * iterations to stop it stretching; a true catenary needs a numeric solve each
 * frame and degenerates exactly in the pulled-straight case.
 *
 * ## Why this file does its own DOM writes
 *
 * `wireMotion.ts` records what per-frame animation has already cost this
 * canvas: r38 wrote a custom property to the document root and an *idle*
 * editor spent 40.8% of its frame time in style recalculation; r42 scoped it
 * to the canvas and it still cost 29%, because the property has to inherit and
 * re-inheriting invalidates every descendant sixty times a second. The answer,
 * since r44, is that each animated element owns its own property and nothing
 * inherits.
 *
 * So the loop here writes one `d` attribute on one `<path>` and nothing else.
 * No React state, no store write, no custom property, nothing above the canvas.
 *
 * ## Allocation
 *
 * The loop allocates exactly one short string per frame — the path data, which
 * `setAttribute` requires. There are no point objects and no arrays: the state
 * is two numbers held in a reused object. A `Float32Array` would be pointless
 * here; there is no buffer to pool.
 */
import { wireMotionEnabled } from "./wireMotion";
import { wirePhysicsEnabled } from "./wirePhysicsPref";

/*
 * Tuned against QA (r111). The first pass read as "too floaty" — the wire
 * drifted into place rather than falling into it.
 *
 * Floatiness is low natural frequency, not low sag: at k=180 the spring took
 * ~0.44s to settle, which the eye reads as the wire being weightless. Raising
 * stiffness and damping together roughly doubles the fall speed (~0.24s) while
 * holding the damping ratio near 0.75, so it still bounces once or twice
 * instead of arriving dead.
 */

/** Spring constant. Higher is snappier — a heavier-feeling wire. */
export const STIFFNESS = 520;
/** Damping. Under critical (zeta ~0.75), so the wire bounces as it lands. */
export const DAMPING = 34;
/** Deepest the wire hangs, in flow units. */
export const MAX_SAG = 115;
/** Span at which the wire is pulled fully straight. */
export const PULL_TAUT_DISTANCE = 560;
/**
 * Longest step the integrator will take, in seconds.
 *
 * A backgrounded tab resumes with a huge gap since the last frame. Integrating
 * it whole would fling the wire off screen; clamping just means the first
 * frame back is a normal one.
 */
export const MAX_STEP_S = 0.032;
/** Below this, the wire has stopped moving and the loop can end. */
const SETTLE_EPSILON = 0.05;

/** Mutable spring state. Reused, never reallocated per frame. */
export interface SagState {
    sag: number;
    velocity: number;
}

/**
 * How far a wire of this span wants to hang.
 *
 * Slack falls off with span and reaches zero at `PULL_TAUT_DISTANCE`, so a
 * short drag hangs in a loop and a long one is taut — "sag derived from
 * slack". The square-root curve is the shape a real rope makes: sag depends on
 * how much length is spare, not linearly on distance.
 */
export function restSag(span: number, maxSag = MAX_SAG, taut = PULL_TAUT_DISTANCE): number {
    if (span >= taut) return 0;
    const slack = 1 - (span / taut) ** 2;
    return maxSag * Math.sqrt(Math.max(0, slack));
}

/**
 * Advance the spring by `dt` seconds, in place.
 *
 * Semi-implicit Euler: velocity is updated first and the new velocity moves
 * the position. That is what keeps it stable at the frame rates a browser
 * actually delivers, where explicit Euler can gain energy and diverge.
 */
export function stepSag(state: SagState, target: number, dt: number): SagState {
    const step = Math.min(Math.max(dt, 0), MAX_STEP_S);
    const accel = STIFFNESS * (target - state.sag) - DAMPING * state.velocity;
    state.velocity += accel * step;
    state.sag += state.velocity * step;
    return state;
}

/** True once the spring has effectively stopped. */
export function hasSettled(state: SagState, target: number): boolean {
    return (
        Math.abs(state.sag - target) < SETTLE_EPSILON &&
        Math.abs(state.velocity) < SETTLE_EPSILON
    );
}

/**
 * React Flow's own control-point offset, for a left-to-right bezier.
 *
 * Replicated rather than imported because `getBezierPath` returns a finished
 * string with no way to displace the control points. `sagPath` is tested
 * against `getBezierPath` at zero sag so the two cannot drift apart.
 */
function controlOffset(distance: number, curvature: number): number {
    if (distance >= 0) return 0.5 * distance;
    return curvature * 25 * Math.sqrt(-distance);
}

/**
 * A cubic bezier from source to target, with both control points pushed down
 * by `sag`.
 *
 * At `sag === 0` this is byte-identical to `getBezierPath` with the same
 * curvature, so a resting wire looks exactly as it does today.
 */
export function sagPath(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    sag: number,
    curvature = 0.28,
): string {
    const offset = controlOffset(targetX - sourceX, curvature);
    const c1x = sourceX + offset;
    const c2x = targetX - offset;
    return `M${sourceX},${sourceY} C${c1x},${sourceY + sag} ${c2x},${targetY + sag} ${targetX},${targetY}`;
}

/** Where the two ends of the held wire currently are, in flow coordinates. */
export interface WireEnds {
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
}

export interface WirePhysicsOptions {
    /** The path to write `d` onto. */
    path: SVGPathElement;
    /** Read the live endpoints. Called once per frame; must not allocate. */
    read: () => WireEnds;
    /** Overrides the motion toggle. Used by the release ghost. */
    force?: boolean;
}

/* One loop, one state, for the one wire that can be held at a time. */
let frame = 0;
let running = false;
const state: SagState = { sag: 0, velocity: 0 };
let lastMs = 0;
let active: WirePhysicsOptions | null = null;
/**
 * The options of a loop that has settled and parked itself, so a later pointer
 * move can restart it. Cleared by a real stop, so a finished drag cannot be
 * resurrected.
 */
let settled: WirePhysicsOptions | null = null;

/**
 * Should the wire move at all?
 *
 * Two gates, both of them the author's own choice: the physics toggle and the
 * wire-motion master switch.
 *
 * `prefers-reduced-motion` used to be a third, silently. I added it unprompted
 * as an accessibility nicety, and it was a mistake: an author with animations
 * turned off at the OS level got a dead toggle and no explanation, having
 * never asked for the feature to be disabled. The editor already offers an
 * explicit switch, which is the honest way to respect the preference — it is
 * discoverable, it says what it does, and it does not override a deliberate
 * click. `defaultWirePhysics()` uses the OS hint to pick a *default* instead,
 * which is the right place for a hint.
 */
export function motionAllowed(): boolean {
    if (!wirePhysicsEnabled()) return false;
    if (!wireMotionEnabled()) return false;
    return true;
}

/** Paint one frame. Exported so tests can drive the loop deterministically. */
export function tickForTests(ms: number): void {
    if (!active) return;
    const dt = lastMs === 0 ? 1 / 60 : (ms - lastMs) / 1000;
    lastMs = ms;

    const ends = active.read();
    const span = Math.hypot(ends.targetX - ends.sourceX, ends.targetY - ends.sourceY);
    const target = restSag(span);

    stepSag(state, target, dt);
    active.path.setAttribute(
        "d",
        sagPath(ends.sourceX, ends.sourceY, ends.targetX, ends.targetY, state.sag),
    );

    /*
     * Stop once nothing is moving. A held wire the author is not dragging
     * costs literally nothing, and any further pointer movement restarts the
     * loop through the next `startWirePhysics` call.
     */
    if (hasSettled(state, target)) {
        state.sag = target;
        state.velocity = 0;
        const parked = active;
        stopWirePhysics(true);
        // Park rather than forget: the wire is still held, so a further
        // pointer move has to be able to wake it.
        settled = parked;
    }
}

/**
 * Start animating the held wire.
 *
 * Idempotent: calling it again replaces the current loop rather than starting
 * a second one, so a repeated call can never leak a frame.
 */
export function startWirePhysics(options: WirePhysicsOptions): () => void {
    stopWirePhysics(true);
    active = options;
    settled = null;
    lastMs = 0;

    if (!options.force && !motionAllowed()) {
        /* Motion is off: draw the straight wire once and never loop. Under
           "Static wires" the editor must do no per-frame work at all. */
        const ends = options.read();
        state.sag = 0;
        state.velocity = 0;
        options.path.setAttribute(
            "d",
            sagPath(ends.sourceX, ends.sourceY, ends.targetX, ends.targetY, 0),
        );
        active = null;
        return () => {};
    }

    running = true;
    const loop = (ms: number) => {
        if (!running || !active) return;
        tickForTests(ms);
        if (running) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => stopWirePhysics(false);
}

/**
 * Stop the loop and release the path.
 *
 * `keepState` is for the settle case, where the spring has reached its target
 * and the values are worth keeping; a real stop resets them so the next drag
 * starts from rest rather than inheriting the last one's wobble.
 */
export function stopWirePhysics(keepState = false): void {
    running = false;
    if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
    }
    active = null;
    settled = null;
    if (!keepState) {
        state.sag = 0;
        state.velocity = 0;
    }
}

/**
 * Resume a settled loop, if the wire is still held and the ends have moved.
 *
 * The loop stops itself once the spring comes to rest, which is what makes a
 * held-but-still wire free. But the element's ref callback only fires on
 * mount, so nothing would ever start it again and the wire would stay frozen
 * for the rest of the drag. The component calls this on every pointer move; it
 * is a no-op while the loop is already running.
 */
export function nudgeWirePhysics(): void {
    if (running || !settled) return;
    const options = settled;
    settled = null;
    startWirePhysics(options);
}

/** Test seam: is a loop currently scheduled? */
export function wirePhysicsRunning(): boolean {
    return running;
}

/** Test seam: the live spring state. */
export function wirePhysicsState(): Readonly<SagState> {
    return state;
}
