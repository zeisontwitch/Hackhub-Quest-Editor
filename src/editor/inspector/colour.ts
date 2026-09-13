/**
 * Colour conversion for the picker.
 *
 * Pure and framework-free: no React, no DOM, no canvas. Colour maths is fiddly
 * at the boundaries — grey has no meaningful hue, hue wraps at 360, and every
 * channel rounds — so it is worth pinning on its own rather than through a
 * component. Nothing here measures anything, which also means these tests are
 * as true in a browser as they are in jsdom.
 *
 * Hex is the storage format, because that is what the project document already
 * holds and what the game's CSS expects.
 */

export interface RGB {
    r: number;
    g: number;
    b: number;
}

/**
 * Hue 0–360, saturation and lightness 0–100.
 *
 * Kept as floats. See the note in `rgbToHsl`: rounding these is enough to
 * change the colour on a round trip.
 */
export interface HSL {
    h: number;
    s: number;
    l: number;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Round to a whole number, normalising -0 so it never reaches the document. */
const round = (n: number) => Math.round(n) + 0;

/** True for a `#rrggbb` string. Three-digit hex is deliberately not accepted. */
export function isHex(value: string): boolean {
    return /^#[0-9a-f]{6}$/i.test(value.trim());
}

/**
 * Parse `#rrggbb` into channels, or null when it is not a colour we store.
 *
 * Returning null rather than a fallback keeps the decision at the call site:
 * an input mid-edit ("#ab") is not the same as an invalid saved value.
 */
export function hexToRgb(hex: string): RGB | null {
    const value = hex.trim();
    if (!isHex(value)) return null;
    return {
        r: parseInt(value.slice(1, 3), 16),
        g: parseInt(value.slice(3, 5), 16),
        b: parseInt(value.slice(5, 7), 16),
    };
}

/** Channels to `#rrggbb`, lowercase, clamped and rounded. */
export function rgbToHex({ r, g, b }: RGB): string {
    const part = (n: number) =>
        clamp(round(n), 0, 255).toString(16).padStart(2, "0");
    return `#${part(r)}${part(g)}${part(b)}`;
}

/**
 * RGB to HSL.
 *
 * A grey has no hue: every formula has to pick something, and 0 is the
 * conventional answer. It matters here because the picker keeps the hue slider
 * where the author left it rather than snapping to red when they drag
 * saturation to zero — see `withHue` in the component.
 */
export function rgbToHsl({ r, g, b }: RGB): HSL {
    /*
     * Deliberately NOT rounded. Rounding here loses the colour: #64748b is
     * lightness 46.863, and storing 47 turns it back into #65758b — so an
     * author who opened the picker and closed it again would find their colour
     * quietly shifted. Callers round for display; the maths stays exact.
     */
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;
    const l = (max + min) / 2;

    if (delta === 0) return { h: 0, s: 0, l: l * 100 };

    const s = delta / (1 - Math.abs(2 * l - 1));
    let h: number;
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;

    return { h: h % 360, s: s * 100, l: l * 100 };
}

/** HSL back to RGB. */
export function hslToRgb({ h, s, l }: HSL): RGB {
    const hn = ((h % 360) + 360) % 360;
    const sn = clamp(s, 0, 100) / 100;
    const ln = clamp(l, 0, 100) / 100;

    const c = (1 - Math.abs(2 * ln - 1)) * sn;
    const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
    const m = ln - c / 2;

    const [r1, g1, b1] =
        hn < 60 ? [c, x, 0]
        : hn < 120 ? [x, c, 0]
        : hn < 180 ? [0, c, x]
        : hn < 240 ? [0, x, c]
        : hn < 300 ? [x, 0, c]
        : [c, 0, x];

    return { r: round((r1 + m) * 255), g: round((g1 + m) * 255), b: round((b1 + m) * 255) };
}

/** Convenience: `#rrggbb` to HSL, or null when the hex is unusable. */
export function hexToHsl(hex: string): HSL | null {
    const rgb = hexToRgb(hex);
    return rgb ? rgbToHsl(rgb) : null;
}

/** Convenience: HSL to `#rrggbb`. */
export function hslToHex(hsl: HSL): string {
    return rgbToHex(hslToRgb(hsl));
}

/**
 * Readable ink for a swatch, so a label on top of the colour stays legible.
 *
 * Uses the WCAG relative-luminance formula rather than a naive average: at the
 * same average, pure green reads far brighter than pure blue.
 */
export function readableInkOn(hex: string): "#000000" | "#ffffff" {
    const rgb = hexToRgb(hex);
    if (!rgb) return "#ffffff";
    const channel = (v: number) => {
        const n = v / 255;
        return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
    };
    const luminance =
        0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
    return luminance > 0.179 ? "#000000" : "#ffffff";
}
