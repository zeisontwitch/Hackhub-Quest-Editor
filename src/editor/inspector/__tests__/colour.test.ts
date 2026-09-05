/**
 * Colour conversion. Pure maths, so what passes here is true in the browser
 * too — no measurement, no layout, nothing jsdom has to fake.
 */
import { describe, expect, it } from "vitest";
import {
    hexToHsl,
    hexToRgb,
    hslToHex,
    hslToRgb,
    isHex,
    readableInkOn,
    rgbToHex,
    rgbToHsl,
} from "@/editor/inspector/colour";

describe("isHex / hexToRgb", () => {
    it("accepts the format the document stores", () => {
        expect(isHex("#64748b")).toBe(true);
        expect(isHex("#FFFFFF")).toBe(true);
    });

    it("rejects anything else, including half-typed input", () => {
        for (const bad of ["#abc", "64748b", "#12345g", "", "  ", "rgb(1,2,3)"]) {
            expect(isHex(bad)).toBe(false);
            expect(hexToRgb(bad)).toBeNull();
        }
    });

    it("reads the channels", () => {
        expect(hexToRgb("#64748b")).toEqual({ r: 100, g: 116, b: 139 });
        expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
        expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
    });
});

describe("rgbToHex", () => {
    it("pads single digits", () => {
        expect(rgbToHex({ r: 0, g: 5, b: 16 })).toBe("#000510");
    });

    it("clamps out-of-range channels rather than emitting nonsense", () => {
        expect(rgbToHex({ r: -20, g: 300, b: 128 })).toBe("#00ff80");
    });

    it("never emits a negative zero", () => {
        expect(rgbToHex({ r: -0.4, g: 0, b: 0 })).toBe("#000000");
    });
});

describe("HSL round trips", () => {
    it("survives a round trip for the preset palette", () => {
        // Every preset must come back byte-identical, or an author opening the
        // picker and closing it would silently shift their colour.
        for (const hex of [
            "#64748b", "#60a5fa", "#34d399", "#fbbf24",
            "#f472b6", "#a78bfa", "#fb923c", "#22d3ee",
        ]) {
            expect(hslToHex(hexToHsl(hex)!)).toBe(hex);
        }
    });

    it("handles the primaries", () => {
        expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
        expect(rgbToHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50 });
        expect(rgbToHsl({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, l: 50 });
    });

    it("treats greys as unsaturated, with hue 0", () => {
        // HSL is kept as floats on purpose, so 128/255 really is 50.196%.
        const mid = rgbToHsl({ r: 128, g: 128, b: 128 });
        expect(mid.h).toBe(0);
        expect(mid.s).toBe(0);
        expect(mid.l).toBeCloseTo(50.2, 1);
        expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 });
        expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 });
    });

    it("keeps enough precision that a colour survives a round trip", () => {
        // The reason HSL is not rounded: #64748b is lightness 46.863, and
        // storing 47 turns it back into #65758b.
        const hsl = hexToHsl("#64748b")!;
        expect(hsl.l).toBeCloseTo(46.86, 1);
        expect(hslToHex(hsl)).toBe("#64748b");
    });

    it("wraps hue instead of running off the end", () => {
        expect(hslToRgb({ h: 360, s: 100, l: 50 })).toEqual(hslToRgb({ h: 0, s: 100, l: 50 }));
        expect(hslToRgb({ h: -60, s: 100, l: 50 })).toEqual(hslToRgb({ h: 300, s: 100, l: 50 }));
    });

    it("clamps saturation and lightness", () => {
        expect(hslToHex({ h: 200, s: 999, l: 50 })).toBe(hslToHex({ h: 200, s: 100, l: 50 }));
        expect(hslToHex({ h: 200, s: 50, l: -10 })).toBe("#000000");
        expect(hslToHex({ h: 200, s: 50, l: 200 })).toBe("#ffffff");
    });
});

describe("readableInkOn", () => {
    it("puts dark ink on light colours and light ink on dark ones", () => {
        expect(readableInkOn("#ffffff")).toBe("#000000");
        expect(readableInkOn("#fbbf24")).toBe("#000000");
        expect(readableInkOn("#000000")).toBe("#ffffff");
        expect(readableInkOn("#64748b")).toBe("#ffffff");
    });

    it("weights green over blue, as perception does", () => {
        // Same channel value; green is far brighter to the eye.
        expect(readableInkOn("#00ff00")).toBe("#000000");
        expect(readableInkOn("#0000ff")).toBe("#ffffff");
    });

    it("falls back to light ink on an unusable value", () => {
        expect(readableInkOn("nonsense")).toBe("#ffffff");
    });
});
