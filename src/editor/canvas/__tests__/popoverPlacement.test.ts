/**
 * Placement maths for the node-search popover.
 *
 * Pure and constant-driven on purpose: r97-r100 shipped broken three times
 * because geometry was read back from a DOM that jsdom does not implement.
 * Nothing here measures anything, so what these tests prove in jsdom is also
 * true in the browser.
 */
import { describe, expect, it } from "vitest";
import {
    POPOVER_INPUT_HEIGHT,
    POPOVER_MAX_ROWS,
    POPOVER_ROW_HEIGHT,
    POPOVER_WIDTH,
    placePopover,
} from "@/editor/canvas/popoverPlacement";

const SCREEN = { width: 1440, height: 900 };
const MARGIN = 12;

describe("placePopover", () => {
    it("opens just down-right of the pointer when there is room", () => {
        const p = placePopover({ x: 400, y: 300 }, SCREEN, 5);
        expect(p.left).toBeGreaterThanOrEqual(400);
        expect(p.top).toBeGreaterThanOrEqual(300);
        expect(p.flipped).toBe(false);
    });

    it("never runs off the right edge", () => {
        const p = placePopover({ x: SCREEN.width - 20, y: 300 }, SCREEN, 5);
        expect(p.left + POPOVER_WIDTH).toBeLessThanOrEqual(SCREEN.width - MARGIN);
    });

    it("never runs off the left edge either", () => {
        const p = placePopover({ x: 2, y: 300 }, SCREEN, 5);
        expect(p.left).toBeGreaterThanOrEqual(MARGIN);
    });

    it("flips above the pointer near the bottom of the screen", () => {
        const p = placePopover({ x: 400, y: SCREEN.height - 40 }, SCREEN, 8);
        expect(p.flipped).toBe(true);
        expect(p.top).toBeLessThan(SCREEN.height - 40);
    });

    it("keeps the whole popover on screen when flipped", () => {
        const p = placePopover({ x: 400, y: SCREEN.height - 40 }, SCREEN, 8);
        const height = POPOVER_INPUT_HEIGHT + p.maxRows * POPOVER_ROW_HEIGHT;
        expect(p.top).toBeGreaterThanOrEqual(MARGIN);
        expect(p.top + height).toBeLessThanOrEqual(SCREEN.height - MARGIN);
    });

    it("shows fewer rows rather than overflowing a short window", () => {
        const tight = { width: 1440, height: 300 };
        const p = placePopover({ x: 400, y: 150 }, tight, 20);
        const height = POPOVER_INPUT_HEIGHT + p.maxRows * POPOVER_ROW_HEIGHT;
        expect(height).toBeLessThanOrEqual(tight.height);
        expect(p.maxRows).toBeLessThan(POPOVER_MAX_ROWS);
    });

    it("always leaves at least one row visible, however cramped", () => {
        const p = placePopover({ x: 10, y: 10 }, { width: 320, height: 120 }, 20);
        expect(p.maxRows).toBeGreaterThanOrEqual(1);
    });

    it("caps the list even on a tall screen", () => {
        const p = placePopover({ x: 400, y: 100 }, { width: 1440, height: 2000 }, 31);
        expect(p.maxRows).toBe(POPOVER_MAX_ROWS);
    });

    it("asks for no more rows than there are results", () => {
        const p = placePopover({ x: 400, y: 100 }, SCREEN, 3);
        expect(p.maxRows).toBe(3);
    });
});
