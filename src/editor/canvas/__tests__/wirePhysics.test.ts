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

    it("respects the reduced-motion preference", () => {
        vi.spyOn(window, "matchMedia").mockReturnValue({
            matches: true, media: "", onchange: null,
            addListener() {}, removeListener() {},
            addEventListener() {}, removeEventListener() {},
            dispatchEvent: () => false,
        } as unknown as MediaQueryList);
        const raf = vi.spyOn(globalThis, "requestAnimationFrame");
        startWirePhysics({ path: path(), read: ends });
        expect(raf).not.toHaveBeenCalled();
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
