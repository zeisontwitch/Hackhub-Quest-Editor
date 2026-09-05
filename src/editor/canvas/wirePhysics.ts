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
import { DEFAULT_TUNING, wireTuning } from "./wireTuning";
import { count, noteFrame, record, resetFrameClock } from "./diagnostics";

/*
 * The spring numbers live in `wireTuning`, not here: they are tunable at
 * runtime from the debug panel, because how a wire *feels* is not something a
 * test can judge and round-tripping every guess through a rebuild is slow.
 *
 * These re-exports keep the old names working for anything that imports them.
 */
export const STIFFNESS = DEFAULT_TUNING.stiffness;
export const DAMPING = DEFAULT_TUNING.damping;
export const MAX_SAG = DEFAULT_TUNING.maxSag;
export const PULL_TAUT_DISTANCE = DEFAULT_TUNING.tautDistance;

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

/**
 * Mutable spring state. Reused, never reallocated per frame.
 *
 * Two dimensions, not one. A scalar sag can only bulge the wire straight down,
 * which reads as a hanging rope: drag sideways and nothing swings. A pendulum
 * swings *across* its direction of travel, so the midpoint carries an (x, y)
 * offset that gravity pulls downward and cursor motion kicks sideways (r114).
 *
 * `sag` stays as the vertical component so the existing callers and tests keep
 * working unchanged.
 */
export interface SagState {
    /** Vertical offset of the midpoint: the hang. */
    sag: number;
    velocity: number;
    /**
     * Horizontal offset: the swing. Optional so a caller (or an older test)
     * can hand over a plain `{ sag, velocity }` and get sensible behaviour.
     */
    sagX?: number;
    velocityX?: number;
}

/**
 * How far a wire of this span wants to hang.
 *
 * Slack falls off with span and reaches zero at `PULL_TAUT_DISTANCE`, so a
 * short drag hangs in a loop and a long one is taut — "sag derived from
 * slack". The square-root curve is the shape a real rope makes: sag depends on
 * how much length is spare, not linearly on distance.
 */
export function restSag(
    span: number,
    maxSag = wireTuning().maxSag,
    taut = wireTuning().tautDistance,
): number {
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
    const { stiffness, damping } = wireTuning();

    // Vertical: the hang, pulled towards the resting sag.
    const accel = stiffness * (target - state.sag) - damping * state.velocity;
    state.velocity += accel * step;
    state.sag += state.velocity * step;

    /*
     * Horizontal: the swing, pulled back towards centre. Same spring, so the
     * two axes share a feel and one set of dials tunes both.
     */
    state.sagX ??= 0;
    state.velocityX ??= 0;
    const accelX = stiffness * (0 - state.sagX) - damping * state.velocityX;
    state.velocityX += accelX * step;
    state.sagX += state.velocityX * step;

    return state;
}

/**
 * Kick the wire sideways when the cursor moves.
 *
 * This is what turns a hanging rope into a pendulum: the midpoint lags behind
 * the hand, so a quick drag left throws the belly of the wire right, and the
 * spring swings it back. Scaled by slack, so it fades to nothing as the wire
 * pulls taut — exactly the "lessens as it stretches" QA asked for.
 */
export function kickSag(state: SagState, dx: number, dy: number, slack: number): void {
    const { swing } = wireTuning();
    state.sagX ??= 0;
    state.velocityX ??= 0;
    // Opposite the motion: the wire trails the cursor rather than leading it.
    state.velocityX -= dx * swing * slack;
    state.velocity -= dy * swing * slack;
}

/** True once the spring has effectively stopped. */
export function hasSettled(state: SagState, target: number): boolean {
    return (
        Math.abs(state.sag - target) < SETTLE_EPSILON &&
        Math.abs(state.velocity) < SETTLE_EPSILON &&
        Math.abs(state.sagX ?? 0) < SETTLE_EPSILON &&
        Math.abs(state.velocityX ?? 0) < SETTLE_EPSILON
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
    sagX = 0,
): string {
    const offset = controlOffset(targetX - sourceX, curvature);
    const c1x = sourceX + offset + sagX;
    const c2x = targetX - offset + sagX;
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
const state: SagState = { sag: 0, velocity: 0, sagX: 0, velocityX: 0 };
let lastMs = 0;
/* Where the cursor was last frame, for measuring the throw. */
let lastTargetX: number | null = null;
let lastTargetY: number | null = null;
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

/** Why the physics is not running, or null when nothing is blocking it. */
export function refusalReason(): string | null {
    if (!wirePhysicsEnabled()) return "Springy wires is off";
    if (!wireMotionEnabled()) return "Animated wires is off";
    return null;
}

/**
 * Draw the wire where it currently is, with whatever sag it currently has.
 *
 * Used by the physics loop each frame, and by `nudgeWirePhysics` when the
 * spring is switched off — the wire still has to follow the cursor, it just
 * does not hang.
 */
function repaint(): void {
    if (!active) return;
    const ends = active.read();
    active.path.setAttribute(
        "d",
        sagPath(
            ends.sourceX,
            ends.sourceY,
            ends.targetX,
            ends.targetY,
            state.sag,
            0.28,
            state.sagX ?? 0,
        ),
    );
}

/** Paint one frame. Exported so tests can drive the loop deterministically. */
export function tickForTests(ms: number): void {
    if (!active) return;
    const dt = lastMs === 0 ? 1 / 60 : (ms - lastMs) / 1000;
    lastMs = ms;

    noteFrame(ms);
    const ends = active.read();
    const span = Math.hypot(ends.targetX - ends.sourceX, ends.targetY - ends.sourceY);
    const target = restSag(span);

    /*
     * How far the cursor moved since the last frame, and how much slack the
     * wire has left. Together they make the pendulum: a fast drag throws the
     * belly of the wire, and the throw fades to nothing as the wire straightens.
     */
    const { tautDistance } = wireTuning();
    const slack = Math.max(0, 1 - span / tautDistance);
    if (lastTargetX !== null && lastTargetY !== null) {
        kickSag(state, ends.targetX - lastTargetX, ends.targetY - lastTargetY, slack);
    }
    lastTargetX = ends.targetX;
    lastTargetY = ends.targetY;

    stepSag(state, target, dt);
    repaint();

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
    count("physicsStarts");
    active = options;
    settled = null;
    lastMs = 0;

    if (!options.force && !motionAllowed()) {
        count("physicsRefused");
        record("physics refused", refusalReason() ?? "unknown");
        /*
         * Motion is off, so there is no spring — but the wire must still
         * follow the cursor. Staying `active` with zero sag means `repaint()`
         * keeps redrawing a straight line as the pointer moves, without ever
         * scheduling a frame.
         *
         * r112: this used to paint once and then clear `active`, which left
         * the wire frozen a few pixels out of its socket for the rest of the
         * drag. r108 had removed the `d` prop so React could not fight the
         * loop, and with physics off there was no loop either — so nothing
         * redrew it at all.
         */
        state.sag = 0;
        state.velocity = 0;
        state.sagX = 0;
        state.velocityX = 0;
        repaint();
        return () => stopWirePhysics(false);
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
    if (running) resetFrameClock();
    running = false;
    if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
    }
    active = null;
    settled = null;
    lastTargetX = null;
    lastTargetY = null;
    if (!keepState) {
        state.sag = 0;
        state.velocity = 0;
        state.sagX = 0;
        state.velocityX = 0;
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
    if (running) return;
    if (settled) {
        const options = settled;
        settled = null;
        startWirePhysics(options);
        return;
    }
    /*
     * No loop, either because the spring is off or because it has parked.
     * Either way the wire is still held, so redraw it at the new pointer
     * position — otherwise it hangs in the air where the drag began.
     */
    repaint();
}

/** Test seam: is a loop currently scheduled? */
export function wirePhysicsRunning(): boolean {
    return running;
}

/** Test seam: the live spring state. */
export function wirePhysicsState(): Readonly<SagState> {
    return state;
}
