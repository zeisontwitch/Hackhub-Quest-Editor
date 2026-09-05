/**
 * The ghost a wire leaves behind when it goes.
 *
 * Two moments need it, and they want the same thing:
 *
 *  - **Release.** Let go of a wire mid-stretch and React Flow unmounts the
 *    connection line on the spot. Without a ghost the wire vanishes taut and
 *    mid-air, which reads as the editor dropping the gesture rather than the
 *    author cancelling it. The roadmap asks for "releasing snaps it back
 *    before it disappears".
 *  - **Deletion.** Same idea for a wire that has just been unplugged.
 *
 * The ghost is a plain `<path>` appended to React Flow's own edge layer, which
 * lives inside the transformed viewport — so it pans and zooms with everything
 * else and needs no matrix maths of its own.
 *
 * ## The lifetime
 *
 * This is the part worth being careful about: the ghost deliberately outlives
 * the gesture that created it, which is exactly the shape that leaks. So it
 * owns exactly one timer and one animation, `dismissWireGhosts()` tears down
 * every live one, and the canvas calls that on unmount. There is a test
 * asserting nothing survives.
 *
 * `pointer-events: none` throughout. A fading wire must never swallow a click
 * meant for the canvas underneath it — the author has already moved on.
 */
import { sagPath } from "./wirePhysics";
import { count, record } from "./diagnostics";
import { wireTuning } from "./wireTuning";

/** How long the ghost takes to snap back and fade. */
export const GHOST_MS = 200;

interface LiveGhost {
    /** The wrapper that is actually in the document. */
    root: SVGSVGElement;
    el: SVGPathElement;
    timer: ReturnType<typeof setTimeout>;
    animation?: Animation;
    /** The retraction's pending frame, so teardown can cancel it. */
    frame?: number;
    /** Present while the ghost is held, waiting to be told to wind back. */
    retract?: () => void;
}

const live = new Set<LiveGhost>();

/** Remove one ghost and everything holding it open. */
function dismiss(ghost: LiveGhost): void {
    clearTimeout(ghost.timer);
    if (ghost.frame) cancelAnimationFrame(ghost.frame);
    try {
        ghost.animation?.cancel();
    } catch {
        /* already finished */
    }
    ghost.root.remove();
    live.delete(ghost);
}

/** Tear down every ghost. Called when the canvas unmounts. */
export function dismissWireGhosts(): void {
    for (const ghost of [...live]) dismiss(ghost);
}

/** Test seam: how many ghosts are currently on screen. */
export function liveWireGhostCount(): number {
    return live.size;
}

export interface WireGhostOptions {
    /** React Flow's edge layer, inside the transformed viewport. */
    layer: SVGElement;
    /** Flow coordinates, in the same space as the wire that just left. */
    from: { x: number; y: number };
    to: { x: number; y: number };
    /** Sag to start from, so the ghost picks up where the live wire stopped. */
    sag?: number;
    colour: string;
    /**
     * Draw the wire and hold it there, rather than retracting immediately.
     *
     * Used while the node search is open: the wire is genuinely pending, so it
     * should hang where it was dropped until the author either picks a node
     * (and it connects) or dismisses the search (and it winds home).
     */
    hold?: boolean;
    /** Fade length. Overridden in tests; real callers use the default. */
    durationMs?: number;
    /**
     * How long the free end takes to travel home, in ms.
     *
     * Separate from the fade on purpose. QA described a vacuum-cleaner cable:
     * the retraction should carry the motion and the fade should not compete
     * with it, which is why the shipped fade is only 20ms while this is much
     * longer.
     */
    retractMs?: number;
}

/**
 * Leave a wire behind for a moment: it straightens and fades, then goes.
 *
 * Returns a function that removes it early, for a caller that needs to.
 */
export function spawnWireGhost(options: WireGhostOptions): () => void {
    const {
        layer,
        from,
        to,
        sag = 0,
        colour,
        durationMs = wireTuning().ghostMs,
        retractMs = wireTuning().retractMs,
        hold = false,
    } = options;
    count("ghosts");
    record("ghost", `sag ${sag.toFixed(1)}, ${durationMs}ms`);

    /*
     * The ghost needs its own <svg>.
     *
     * `.react-flow__edges` looks like the place to put a path, but it is a
     * plain <div> — React Flow gives every edge its own <svg> child. A raw
     * <path> appended to a div is created, kept in the DOM and never rendered,
     * which is exactly what QA saw: the log said the ghost fired, the screen
     * showed nothing (r114).
     *
     * The wrapper is absolutely positioned and overflow-visible so the curve
     * can hang outside its own box, and it inherits the viewport transform
     * from the container, so pan and zoom still come free.
     */
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "qe-wire-ghost");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.overflow = "visible";
    svg.style.pointerEvents = "none";
    // Above the edges, below the nodes: a wire on its way out should not be
    // painted over the cards it was reaching between.
    svg.style.zIndex = "0";

    const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
    el.setAttribute("d", sagPath(from.x, from.y, to.x, to.y, sag));
    el.setAttribute("fill", "none");
    el.setAttribute("stroke", colour);
    el.setAttribute("stroke-width", "2");
    el.setAttribute("stroke-linecap", "round");
    // Never intercept a click: the wire is on its way out.
    el.style.pointerEvents = "none";
    svg.appendChild(el);
    layer.appendChild(svg);

    const ghost: LiveGhost = {
        root: svg,
        el,
        /*
         * A backstop, not the schedule. The retraction removes the ghost when
         * it arrives; this only catches the case where frames stop coming —
         * a backgrounded tab, say — so nothing is ever left on the canvas.
         */
        timer: hold
            ? (undefined as unknown as ReturnType<typeof setTimeout>)
            : setTimeout(() => dismiss(ghost), Math.max(durationMs, retractMs) + 250),
    };
    live.add(ghost);

    /*
     * Animate where the platform allows it. `Element.animate` is absent in
     * jsdom and in older engines; without it the ghost simply holds its shape
     * for the same moment and then goes, which still reads as a wire leaving
     * rather than blinking out.
     */
    /*
     * Wind the free end back to the socket it came from, like a vacuum
     * cleaner's cable — rather than dissolving where it was dropped.
     *
     * The old version interpolated the sag to zero while fading, but left both
     * endpoints where they were, so the wire melted in place. QA wanted it to
     * travel: "it pulls itself back into its place of origin with a speed ramp
     * and a ghost fade out" (r115).
     *
     * Driven frame by frame rather than by `Element.animate`. Interpolating a
     * `d` attribute between two paths needs identical structure and is not
     * supported everywhere, and easing the free end along its own route is
     * clearer written out than expressed as keyframes.
     */
    const travel = Math.max(0, retractMs);
    let startedAt: number | null = null;

    const frame = (nowMs: number) => {
        if (!live.has(ghost)) return;
        // Measured from the first frame, so a held ghost's clock starts when
        // it is released rather than when it was created.
        startedAt ??= nowMs;
        const elapsed = nowMs - startedAt;
        const t = travel === 0 ? 1 : Math.min(1, elapsed / travel);
        // easeOutCubic: quick off the mark, easing as it arrives home.
        const eased = 1 - (1 - t) ** 3;

        // The free end slides back along the wire towards the socket, and the
        // sag relaxes with it so the cable straightens as it is drawn in.
        const x = to.x + (from.x - to.x) * eased;
        const y = to.y + (from.y - to.y) * eased;
        el.setAttribute("d", sagPath(from.x, from.y, x, y, sag * (1 - eased)));
        // Hold full opacity until the very end, then fade over the final
        // stretch, so the retraction is what the eye follows.
        el.style.opacity = String(1 - eased ** 3);

        if (t < 1) ghost.frame = requestAnimationFrame(frame);
        else dismiss(ghost);
    };
    /*
     * A held ghost just hangs there. `retractWireGhosts()` starts the wind-up
     * later, or `dismissWireGhosts()` removes it outright when the wire has
     * been connected and there is nothing to wind back.
     */
    if (hold) {
        ghost.retract = () => {
            ghost.retract = undefined;
            clearTimeout(ghost.timer);
            ghost.timer = setTimeout(() => dismiss(ghost), Math.max(durationMs, retractMs) + 250);
            ghost.frame = requestAnimationFrame(frame);
        };
    } else {
        ghost.frame = requestAnimationFrame(frame);
    }

    return () => dismiss(ghost);
}

/**
 * Set every held ghost winding back to its socket.
 *
 * Called when the node search is dismissed without a choice: the wire was
 * abandoned after all, so it retracts now.
 */
export function retractWireGhosts(): void {
    for (const ghost of [...live]) ghost.retract?.();
}
