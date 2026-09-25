/**
 * The group-frame colour preference and its random roll (r229).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
    FRAME_COLOURS,
    groupColourRandomOn,
    randomGroupColour,
    resetGroupColourForTests,
    setGroupColourRandom,
    subscribeGroupColourRandom,
} from "@/editor/canvas/groupColours";

describe("groupColours", () => {
    afterEach(() => {
        resetGroupColourForTests();
        vi.restoreAllMocks();
    });

    it("defaults to off, so new frames stay slate", () => {
        expect(groupColourRandomOn()).toBe(false);
    });

    it("remembers the choice and only notifies on a change", () => {
        const spy = vi.fn();
        const off = subscribeGroupColourRandom(spy);
        setGroupColourRandom(true);
        expect(groupColourRandomOn()).toBe(true);
        expect(spy).toHaveBeenCalledTimes(1);
        setGroupColourRandom(true); // no change — no notification
        expect(spy).toHaveBeenCalledTimes(1);
        setGroupColourRandom(false);
        expect(spy).toHaveBeenCalledTimes(2);
        off();
        setGroupColourRandom(true); // unsubscribed — no notification
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it("persists the choice to localStorage, and the seam forgets it", () => {
        setGroupColourRandom(true);
        expect(localStorage.getItem("qe.groupColourRandom")).toBe("on");
        resetGroupColourForTests();
        expect(groupColourRandomOn()).toBe(false);
        expect(localStorage.getItem("qe.groupColourRandom")).toBeNull();
    });

    it("offers exactly the eight ready-made frame colours, slate first", () => {
        expect(FRAME_COLOURS).toEqual([
            "#64748b",
            "#60a5fa",
            "#34d399",
            "#fbbf24",
            "#f472b6",
            "#a78bfa",
            "#fb923c",
            "#22d3ee",
        ]);
    });

    it("randomGroupColour always rolls a ready-made colour, and every one is reachable", () => {
        for (let i = 0; i < 200; i++) expect(FRAME_COLOURS).toContain(randomGroupColour());
        const seen = new Set(Array.from({ length: 2000 }, () => randomGroupColour()));
        expect(seen.size).toBe(FRAME_COLOURS.length);
    });
});
