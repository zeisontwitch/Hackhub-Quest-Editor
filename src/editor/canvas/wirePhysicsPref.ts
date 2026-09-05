/**
 * The wire-physics preference.
 *
 * Same shape as `snapGrid` and `wireMotion`: a module-level value, a
 * `useSyncExternalStore` subscription, and a localStorage write. Not React
 * state and not in the project store — it is a per-author editor preference,
 * so putting it in the document would export it and add an undo entry every
 * time someone flicked it (the r96 lesson from the snap toggle).
 *
 * Separate from `wireMotion` on purpose. They are different questions:
 *
 *   - wire motion — do the dots drift along resting wires?
 *   - wire physics — does a wire being dragged hang and bounce?
 *
 * An author might reasonably want the quiet ambient one and not the springy
 * one, or turn physics off on a slow machine while keeping the direction cue
 * that tells them which way the story runs. Physics still respects the motion
 * toggle as a master switch: motion off means everything is still.
 */

const STORAGE_KEY = "qe.wirePhysics";

type Listener = () => void;
const listeners = new Set<Listener>();

/**
 * The default, for an author who has never touched the toggle.
 *
 * On, unless the OS asks for reduced motion — a hint, not a veto. Using it to
 * *block* the feature meant a deliberate click on "Springy wires" did nothing
 * and said nothing, which is worse for the author than simply defaulting off.
 */
function defaultWirePhysics(): boolean {
    try {
        return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
        // No matchMedia: assume motion is welcome.
        return true;
    }
}

function readStored(): boolean {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        // An explicit choice always wins over the OS hint.
        if (saved === "on") return true;
        if (saved === "off") return false;
        return defaultWirePhysics();
    } catch {
        // Private mode, or no storage at all.
        return true;
    }
}

let enabled = readStored();

/** Should a dragged wire hang and bounce? */
export function wirePhysicsEnabled(): boolean {
    return enabled;
}

/** Turn wire physics on or off, and remember the choice. */
export function setWirePhysicsEnabled(on: boolean): void {
    if (on === enabled) return;
    enabled = on;
    try {
        localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
    } catch {
        /* not being able to remember it is not a reason to fail */
    }
    for (const l of listeners) l();
}

/** Subscribe to changes (useSyncExternalStore contract). */
export function subscribeWirePhysics(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Test seam: forget the stored preference. */
export function resetWirePhysicsForTests(): void {
    enabled = true;
    listeners.clear();
}
