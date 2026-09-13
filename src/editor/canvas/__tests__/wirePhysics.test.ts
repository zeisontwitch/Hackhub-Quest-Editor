/**
 * Wire physics: the integrator, the path builder, and the loop's lifecycle.
 *
 * The maths is pure, so what passes here is true in a browser too. The loop is
 * driven through `tickForTests` rather than by waiting on rAF — a test that
 * waits on jsdom's rAF asserts jsdom's behaviour, not ours.
 *
 * NOT asserted here, because jsdom cannot judge it: whether the bounce *feels*
 * right. The constants are for Zeis to tune in the preview.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { getBezierPath } from "@xyflow/react";
import {
    kickSag,
    MAX_SAG,
    MAX_STEP_S,
    PULL_TAUT_DISTANCE,
    hasSettled,
    restSag,
    sagPath,
    startWirePhysics,
    stepSag,
    stopWirePhysics,
    tickForTests,
    wirePhysicsRunning,
    wirePhysicsState,
} from "@/editor/canvas/wirePhysics";
import { setWireMotion } from "@/editor/canvas/wireMotion";
import { setWirePhysicsEnabled } from "@/editor/canvas/wirePhysicsPref";
import { nudgeWirePhysics } from "@/editor/canvas/wirePhysics";

afterEach(() => {
    stopWirePhysics();
    setWireMotion(true);
    setWirePhysicsEnabled(true);
    vi.restoreAllMocks();
});

const path = () => document.createElementNS("http://www.w3.org/2000/svg", "path");

describe("restSag", () => {
    it("hangs deepest when the ends are close together", () => {
        expect(restSag(0)).toBeCloseTo(MAX_SAG, 5);
    });

    it("pulls straight once the span reaches the taut distance", () => {
        expect(restSag(PULL_TAUT_DISTANCE)).toBe(0);
        expect(restSag(PULL_TAUT_DISTANCE * 2)).toBe(0);
    });

    it("sags less the further the ends are apart", () => {
        expect(restSag(100)).toBeGreaterThan(restSag(300));
        expect(restSag(300)).toBeGreaterThan(restSag(500));
    });

    it("never returns a negative sag", () => {
        for (const span of [0, 1, 250, 519, 520, 5000]) {
            expect(restSag(span)).toBeGreaterThanOrEqual(0);
        }
    });
});

describe("stepSag", () => {
    it("moves towards the target", () => {
        const s = { sag: 0, velocity: 0 };
        stepSag(s, 50, 1 / 60);
        expect(s.sag).toBeGreaterThan(0);
        expect(s.sag).toBeLessThan(50);
    });

    it("settles on the target rather than oscillating forever", () => {
        const s = { sag: 0, velocity: 0 };
        for (let i = 0; i < 600; i++) stepSag(s, 50, 1 / 60);
        expect(s.sag).toBeCloseTo(50, 1);
        expect(Math.abs(s.velocity)).toBeLessThan(0.5);
    });

    it("overshoots at least once, so the wire visibly bounces", () => {
        const s = { sag: 0, velocity: 0 };
        let overshot = false;
        for (let i = 0; i < 200; i++) {
            stepSag(s, 50, 1 / 60);
            if (s.sag > 50) overshot = true;
        }
        expect(overshot).toBe(true);
    });

    it("stays stable when a backgrounded tab returns after seconds", () => {
        const s = { sag: 0, velocity: 0 };
        stepSag(s, 50, 5);
        expect(Number.isFinite(s.sag)).toBe(true);
        expect(Math.abs(s.sag)).toBeLessThan(MAX_SAG * 2);
    });

    it("clamps the step rather than trusting the caller", () => {
        const huge = { sag: 0, velocity: 0 };
        const clamped = { sag: 0, velocity: 0 };
        stepSag(huge, 50, 10);
        stepSag(clamped, 50, MAX_STEP_S);
        expect(huge.sag).toBeCloseTo(clamped.sag, 10);
    });

    it("ignores a negative step", () => {
        const s = { sag: 10, velocity: 0 };
        stepSag(s, 10, -1);
        expect(Number.isFinite(s.sag)).toBe(true);
    });

    it("mutates in place rather than allocating", () => {
        const s = { sag: 0, velocity: 0 };
        expect(stepSag(s, 50, 1 / 60)).toBe(s);
    });
});

describe("sagPath", () => {
    it("matches React Flow's own bezier exactly at rest", () => {
        /*
         * The guarantee that a resting wire does not change appearance. If
         * React Flow's control-point maths ever changes, this fails rather
         * than the wires quietly shifting.
         */
        for (const [sx, sy, tx, ty] of [
            [0, 0, 200, 0],
            [10, 40, 300, 120],
            [400, 0, 100, 200], // target left of source: the negative branch
        ]) {
            const [expected] = getBezierPath({
                sourceX: sx, sourceY: sy, targetX: tx, targetY: ty,
                sourcePosition: "right" as never, targetPosition: "left" as never,
                curvature: 0.28,
            });
            expect(sagPath(sx, sy, tx, ty, 0)).toBe(expected);
        }
    });

    it("pushes the curve down as sag grows", () => {
        expect(sagPath(0, 0, 200, 0, 40)).not.toBe(sagPath(0, 0, 200, 0, 0));
    });

    it("leaves the endpoints pinned wherever the sag goes", () => {
        const d = sagPath(5, 7, 205, 107, 60);
        expect(d.startsWith("M5,7 ")).toBe(true);
        expect(d.endsWith("205,107")).toBe(true);
    });
});

describe("the loop's lifecycle", () => {
    const ends = () => ({ sourceX: 0, sourceY: 0, targetX: 120, targetY: 0 });

    it("writes the path and keeps running while the wire moves", () => {
        const el = path();
        startWirePhysics({ path: el, read: ends, force: true });
        tickForTests(0);
        tickForTests(16);
        expect(el.getAttribute("d")).toBeTruthy();
        expect(wirePhysicsRunning()).toBe(true);
    });

    it("cancels the frame on stop, leaving nothing pending", () => {
        const cancel = vi.spyOn(globalThis, "cancelAnimationFrame");
        const stop = startWirePhysics({ path: path(), read: ends, force: true });
        stop();
        expect(wirePhysicsRunning()).toBe(false);
        expect(cancel).toHaveBeenCalled();
    });

    it("never runs two loops at once", () => {
        const cancel = vi.spyOn(globalThis, "cancelAnimationFrame");
        startWirePhysics({ path: path(), read: ends, force: true });
        startWirePhysics({ path: path(), read: ends, force: true });
        expect(cancel).toHaveBeenCalled();
        expect(wirePhysicsRunning()).toBe(true);
    });

    it("stops itself once the wire has settled", () => {
        startWirePhysics({ path: path(), read: ends, force: true });
        for (let i = 0; i < 400 && wirePhysicsRunning(); i++) tickForTests(i * 16);
        expect(wirePhysicsRunning()).toBe(false);
    });

    it("starts each drag from rest, not from the last one's wobble", () => {
        startWirePhysics({ path: path(), read: ends, force: true });
        tickForTests(0);
        tickForTests(16);
        expect(wirePhysicsState().sag).not.toBe(0);
        stopWirePhysics();
        expect(wirePhysicsState().sag).toBe(0);
        expect(wirePhysicsState().velocity).toBe(0);
    });

    it("is safe to tick with no active wire", () => {
        stopWirePhysics();
        expect(() => tickForTests(16)).not.toThrow();
    });
});

describe("the switches that turn it off", () => {
    const ends = () => ({ sourceX: 0, sourceY: 0, targetX: 120, targetY: 0 });

    it("does no per-frame work when wire physics is switched off", () => {
        // Zeis's toggle: some machines and some people do not want this.
        setWirePhysicsEnabled(false);
        const raf = vi.spyOn(globalThis, "requestAnimationFrame");
        const el = path();
        startWirePhysics({ path: el, read: ends });
        expect(raf).not.toHaveBeenCalled();
        expect(wirePhysicsRunning()).toBe(false);
        // ...but the wire is still drawn, exactly as it is today.
        expect(el.getAttribute("d")).toBe(sagPath(0, 0, 120, 0, 0));
    });

    it("does no per-frame work when wire motion is switched off", () => {
        // The master switch: still wires means everything is still.
        setWireMotion(false);
        const raf = vi.spyOn(globalThis, "requestAnimationFrame");
        startWirePhysics({ path: path(), read: ends });
        expect(raf).not.toHaveBeenCalled();
        expect(wirePhysicsRunning()).toBe(false);
    });

    it("does NOT let the OS reduced-motion setting veto an explicit choice", () => {
        /*
         * r110. Reduced-motion used to be a third silent gate, which I added
         * unprompted. An author with animations disabled at the OS level got a
         * toggle that did nothing and said nothing — they had switched physics
         * ON and the wire stayed dead. The preference now picks the *default*
         * (see wirePhysicsPref) and never overrides a deliberate click.
         */
        vi.spyOn(window, "matchMedia").mockReturnValue({
            matches: true, media: "", onchange: null,
            addListener() {}, removeListener() {},
            addEventListener() {}, removeEventListener() {},
            dispatchEvent: () => false,
        } as unknown as MediaQueryList);
        setWirePhysicsEnabled(true);
        const raf = vi.spyOn(globalThis, "requestAnimationFrame");
        startWirePhysics({ path: path(), read: ends });
        expect(raf).toHaveBeenCalled();
    });

    it("still animates the release ghost, which is not optional motion", () => {
        setWirePhysicsEnabled(false);
        const raf = vi.spyOn(globalThis, "requestAnimationFrame");
        startWirePhysics({ path: path(), read: ends, force: true });
        expect(raf).toHaveBeenCalled();
    });
});

describe("hasSettled", () => {
    it("is false while the spring is still moving", () => {
        expect(hasSettled({ sag: 0, velocity: 10 }, 50)).toBe(false);
        expect(hasSettled({ sag: 10, velocity: 0 }, 50)).toBe(false);
    });

    it("is true once it has stopped at the target", () => {
        expect(hasSettled({ sag: 50, velocity: 0 }, 50)).toBe(true);
    });
});


describe("r108: the wire keeps moving for the whole drag", () => {
    /*
     * Two bugs shipped in r107, both invisible to the tests that existed.
     *
     * 1. The <path> had a `d` prop, so React rewrote it to the straight bezier
     *    on every pointer move and wiped the loop's write. React won sixty
     *    times a second and the wire looked completely static. No test
     *    simulated a re-render, so nothing caught it.
     * 2. The loop parks itself once the spring settles — correct, and what
     *    makes a still wire free — but the element's ref only fires on mount,
     *    so nothing ever restarted it and the wire froze for the rest of the
     *    drag.
     */
    const path = () => document.createElementNS("http://www.w3.org/2000/svg", "path");

    it("resumes when the cursor moves after the spring has settled", () => {
        const el = path();
        let targetX = 120;
        startWirePhysics({
            path: el,
            read: () => ({ sourceX: 0, sourceY: 0, targetX, targetY: 0 }),
            force: true,
        });
        for (let i = 0; i < 400 && wirePhysicsRunning(); i++) tickForTests(i * 16);
        expect(wirePhysicsRunning()).toBe(false);

        // The author drags further out: the span changes, so the wire must move.
        targetX = 420;
        nudgeWirePhysics();
        expect(wirePhysicsRunning()).toBe(true);

        const before = el.getAttribute("d");
        tickForTests(10_000);
        tickForTests(10_016);
        expect(el.getAttribute("d")).not.toBe(before);
    });

    it("does not wake a loop that was properly stopped", () => {
        // A finished drag must stay finished; nudging cannot resurrect it.
        startWirePhysics({
            path: path(),
            read: () => ({ sourceX: 0, sourceY: 0, targetX: 120, targetY: 0 }),
            force: true,
        });
        stopWirePhysics();
        nudgeWirePhysics();
        expect(wirePhysicsRunning()).toBe(false);
    });

    it("is a no-op while the loop is already running", () => {
        const el = path();
        startWirePhysics({
            path: el,
            read: () => ({ sourceX: 0, sourceY: 0, targetX: 120, targetY: 0 }),
            force: true,
        });
        nudgeWirePhysics();
        nudgeWirePhysics();
        expect(wirePhysicsRunning()).toBe(true);
    });

    it("keeps the sag it wrote when nothing else touches the element", () => {
        // The regression guard for the `d`-prop clash: after the loop has
        // written, the attribute must still hold a sagged curve.
        const el = path();
        startWirePhysics({
            path: el,
            read: () => ({ sourceX: 0, sourceY: 0, targetX: 120, targetY: 0 }),
            force: true,
        });
        tickForTests(0);
        tickForTests(16);
        tickForTests(32);
        const straight = sagPath(0, 0, 120, 0, 0);
        expect(el.getAttribute("d")).not.toBe(straight);
    });
});

describe("r109: a restart mid-drag must not lose the spring", () => {
    /*
     * The inline ref meant `startWirePhysics` ran on every pointer move. That
     * turned out NOT to reset the sag — `stopWirePhysics(true)` deliberately
     * keeps it — which is why this alone did not explain the dead wire. Worth
     * keeping as a guard anyway: if a future change makes a restart reset the
     * state, a wire dragged in a browser would go rigid while every other test
     * still passed.
     */
    const path = () => document.createElementNS("http://www.w3.org/2000/svg", "path");
    const ends = () => ({ sourceX: 0, sourceY: 0, targetX: 120, targetY: 0 });

    it("keeps the sag it had built up", () => {
        const el = path();
        startWirePhysics({ path: el, read: ends, force: true });
        tickForTests(0);
        tickForTests(16);
        const built = wirePhysicsState().sag;
        expect(built).toBeGreaterThan(0);

        startWirePhysics({ path: el, read: ends, force: true });
        expect(wirePhysicsState().sag).toBeCloseTo(built, 6);
    });

    it("a single start lets the sag build up over successive frames", () => {
        const el = path();
        startWirePhysics({ path: el, read: ends, force: true });
        tickForTests(0);
        const first = wirePhysicsState().sag;
        tickForTests(16);
        tickForTests(32);
        tickForTests(48);
        expect(wirePhysicsState().sag).toBeGreaterThan(first);
    });
});


describe("r113: the wire follows the cursor even with the spring off", () => {
    /*
     * QA, with physics switched off: "the wire didn't appear at all except for
     * the first couple pixels". Reproduced exactly — the path froze at the
     * position the drag began.
     *
     * Cause: r108 removed the `d` prop so React could not overwrite the
     * physics loop's writes, which was right. But with physics off there is no
     * loop, and the off-path painted once and then cleared `active`, so
     * nothing redrew the wire for the rest of the drag. "No spring" has to
     * mean a straight wire that still tracks the pointer, not a frozen one.
     */
    const path = () => document.createElementNS("http://www.w3.org/2000/svg", "path");

    it("redraws as the pointer moves", () => {
        setWirePhysicsEnabled(false);
        const el = path();
        let targetX = 20;
        startWirePhysics({
            path: el,
            read: () => ({ sourceX: 0, sourceY: 0, targetX, targetY: 0 }),
        });
        const atStart = el.getAttribute("d");

        targetX = 600;
        nudgeWirePhysics();
        expect(el.getAttribute("d")).not.toBe(atStart);
        expect(el.getAttribute("d")).toContain("600");
    });

    it("keeps the wire straight, since the spring is off", () => {
        setWirePhysicsEnabled(false);
        const el = path();
        startWirePhysics({
            path: el,
            read: () => ({ sourceX: 0, sourceY: 0, targetX: 300, targetY: 0 }),
        });
        nudgeWirePhysics();
        expect(el.getAttribute("d")).toBe(sagPath(0, 0, 300, 0, 0));
    });

    it("still schedules no frames", () => {
        // Tracking the cursor must not smuggle a loop back in: "off" means no
        // per-frame work at all.
        setWirePhysicsEnabled(false);
        const raf = vi.spyOn(globalThis, "requestAnimationFrame");
        const el = path();
        startWirePhysics({
            path: el,
            read: () => ({ sourceX: 0, sourceY: 0, targetX: 120, targetY: 0 }),
        });
        nudgeWirePhysics();
        nudgeWirePhysics();
        expect(raf).not.toHaveBeenCalled();
        expect(wirePhysicsRunning()).toBe(false);
    });

    it("stops tracking once the drag is over", () => {
        setWirePhysicsEnabled(false);
        const el = path();
        let targetX = 20;
        startWirePhysics({
            path: el,
            read: () => ({ sourceX: 0, sourceY: 0, targetX, targetY: 0 }),
        });
        stopWirePhysics();
        const afterStop = el.getAttribute("d");
        targetX = 900;
        nudgeWirePhysics();
        expect(el.getAttribute("d")).toBe(afterStop);
    });
});


describe("r114: the wire swings like a pendulum", () => {
    /*
     * QA: "it doesn't have enough of a pendulum feel — near the node, where
     * there's most sag, I'd expect it to behave like a pendulum, lessening as
     * it stretches."
     *
     * The old model could only bulge straight down, so dragging sideways
     * produced no swing at all — a hanging rope, never a pendulum. The
     * midpoint now carries a horizontal offset too: cursor motion throws it,
     * the same spring pulls it back, and slack scales the throw so it fades as
     * the wire pulls taut.
     */
    const fresh = () => ({ sag: 0, velocity: 0, sagX: 0, velocityX: 0 });

    it("throws the wire sideways when the cursor moves sideways", () => {
        const st = fresh();
        kickSag(st, 40, 0, 1);
        expect(st.velocityX).not.toBe(0);
    });

    it("throws it opposite the movement, so it trails the hand", () => {
        const right = fresh();
        kickSag(right, 40, 0, 1);
        expect(right.velocityX).toBeLessThan(0);

        const left = fresh();
        kickSag(left, -40, 0, 1);
        expect(left.velocityX).toBeGreaterThan(0);
    });

    it("throws harder the faster the cursor moves", () => {
        const slow = fresh();
        const fast = fresh();
        kickSag(slow, 10, 0, 1);
        kickSag(fast, 80, 0, 1);
        expect(Math.abs(fast.velocityX)).toBeGreaterThan(Math.abs(slow.velocityX));
    });

    it("swings less as the wire pulls taut", () => {
        // The "lessens as it stretches" half of the request: slack scales it.
        const loose = fresh();
        const taut = fresh();
        kickSag(loose, 40, 0, 1);    // lots of slack
        kickSag(taut, 40, 0, 0.1);   // nearly straight
        expect(Math.abs(taut.velocityX)).toBeLessThan(Math.abs(loose.velocityX));
    });

    it("does not swing at all once the wire is straight", () => {
        const st = fresh();
        kickSag(st, 100, 0, 0);
        expect(st.velocityX).toBe(0);
    });

    it("builds a visible swing over a sustained drag, then returns to centre", () => {
        /*
         * A real drag kicks every frame, not once — that is what accumulates
         * into a visible pendulum. A single isolated kick moves the wire only
         * a few pixels, which is why the swing dial has to be large relative
         * to a stiff spring.
         */
        const st = fresh();
        let peak = 0;
        for (let i = 0; i < 20; i++) {
            kickSag(st, 25, 0, 1); // dragging steadily right
            stepSag(st, 0, 1 / 60);
            peak = Math.max(peak, Math.abs(st.sagX ?? 0));
        }
        // Enough travel to actually see.
        expect(peak).toBeGreaterThan(15);

        // Let go: it settles back to centre rather than drifting.
        for (let i = 0; i < 400; i++) stepSag(st, 0, 1 / 60);
        expect(Math.abs(st.sagX ?? 0)).toBeLessThan(1);
    });

    it("shows the swing in the rendered path", () => {
        const straight = sagPath(0, 0, 200, 0, 50, 0.28, 0);
        const swung = sagPath(0, 0, 200, 0, 50, 0.28, 35);
        expect(swung).not.toBe(straight);
    });

    it("counts as settled only when the swing has stopped too", () => {
        expect(hasSettled({ sag: 50, velocity: 0, sagX: 40, velocityX: 0 }, 50)).toBe(false);
        expect(hasSettled({ sag: 50, velocity: 0, sagX: 0, velocityX: 0 }, 50)).toBe(true);
    });
});
