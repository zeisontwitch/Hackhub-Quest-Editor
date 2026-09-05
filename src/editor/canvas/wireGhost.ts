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

/** How long the ghost takes to snap back and fade. */
export const GHOST_MS = 200;

interface LiveGhost {
    el: SVGPathElement;
    timer: ReturnType<typeof setTimeout>;
    animation?: Animation;
}

const live = new Set<LiveGhost>();

/** Remove one ghost and everything holding it open. */
function dismiss(ghost: LiveGhost): void {
    clearTimeout(ghost.timer);
    try {
        ghost.animation?.cancel();
    } catch {
        /* already finished */
    }
    ghost.el.remove();
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
    /** Overridden in tests; real callers use the default. */
    durationMs?: number;
}

/**
 * Leave a wire behind for a moment: it straightens and fades, then goes.
 *
 * Returns a function that removes it early, for a caller that needs to.
 */
export function spawnWireGhost(options: WireGhostOptions): () => void {
    const { layer, from, to, sag = 0, colour, durationMs = GHOST_MS } = options;

    const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
    el.setAttribute("d", sagPath(from.x, from.y, to.x, to.y, sag));
    el.setAttribute("fill", "none");
    el.setAttribute("stroke", colour);
    el.setAttribute("stroke-width", "2");
    el.setAttribute("stroke-linecap", "round");
    // Never intercept a click: the wire is on its way out.
    el.style.pointerEvents = "none";
    layer.appendChild(el);

    const ghost: LiveGhost = {
        el,
        timer: setTimeout(() => dismiss(ghost), durationMs),
    };
    live.add(ghost);

    /*
     * Animate where the platform allows it. `Element.animate` is absent in
     * jsdom and in older engines; without it the ghost simply holds its shape
     * for the same moment and then goes, which still reads as a wire leaving
     * rather than blinking out.
     */
    if (typeof el.animate === "function") {
        try {
            ghost.animation = el.animate(
                [
                    { d: `path("${sagPath(from.x, from.y, to.x, to.y, sag)}")`, opacity: 1 },
                    { d: `path("${sagPath(from.x, from.y, to.x, to.y, 0)}")`, opacity: 0 },
                ],
                { duration: durationMs, easing: "cubic-bezier(0.2, 0, 0.2, 1)", fill: "forwards" },
            );
        } catch {
            /* Engines that cannot interpolate `d` still fade via the timer. */
        }
    }

    return () => dismiss(ghost);
}
