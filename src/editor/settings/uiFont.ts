/**
 * The UI typeface.
 *
 * A curated picker, not a text field: the choices are the system default, a
 * Verdana-led readable stack, and three self-hosted open-licence faces
 * (Atkinson Hyperlegible and Lexend for dyslexia-friendly reading, JetBrains
 * Mono for the terminal feel). The stacks themselves live in
 * `src/index.css` behind `html[data-font="…"]` — this module only tracks
 * which one is active, mirroring the theme module's shape.
 *
 * Fonts are served from `public/fonts/` (see its README for provenance), so
 * picking one needs no internet. `font-display: swap` keeps first paint on
 * the system face while a woff2 loads.
 */

const STORAGE_KEY = "qe.uiFont";

export const UI_FONT_IDS = ["system", "readable", "atkinson", "lexend", "jetbrains", "roboto", "roboto-mono"] as const;
export type UiFontId = (typeof UI_FONT_IDS)[number];

export interface UiFontDef {
    id: UiFontId;
    label: string;
    hint: string;
    /** Rendered in the font itself, so the dropdown is its own preview. */
    sample: string;
}

export const UI_FONTS: readonly UiFontDef[] = [
    {
        id: "system",
        label: "System (default)",
        hint: "Your platform's own interface font — the editor's original look.",
        sample: "The quick brown fox jumps over 13 lazy dogs.",
    },
    {
        id: "readable",
        label: "Readable system",
        hint: "Verdana and friends: wide letterforms and a generous x-height, no download needed.",
        sample: "The quick brown fox jumps over 13 lazy dogs.",
    },
    {
        id: "atkinson",
        label: "Atkinson Hyperlegible",
        hint: "Letterforms designed to be distinguishable at small sizes — built by the Braille Institute for low vision, and helpful for dyslexic readers.",
        sample: "The quick brown fox jumps over 13 lazy dogs.",
    },
    {
        id: "lexend",
        label: "Lexend",
        hint: "Simplified, even word shapes; designed to raise reading proficiency and often recommended for dyslexia.",
        sample: "The quick brown fox jumps over 13 lazy dogs.",
    },
    {
        id: "jetbrains",
        label: "JetBrains Mono",
        hint: "Monospace — pairs naturally with the Phosphor theme for the full terminal feel.",
        sample: "The quick brown fox jumps over 13 lazy dogs.",
    },
    {
        id: "roboto",
        label: "Roboto",
        hint: "The Android/system-UI standard — neutral, compact and familiar.",
        sample: "The quick brown fox jumps over 13 lazy dogs.",
    },
    {
        id: "roboto-mono",
        label: "Roboto Mono",
        hint: "Monospace with Roboto's skeleton — a slightly rounder terminal face than JetBrains Mono.",
        sample: "The quick brown fox jumps over 13 lazy dogs.",
    },
];

export const DEFAULT_UI_FONT: UiFontDef = UI_FONTS[0];

function fontById(id: string): UiFontDef {
    return UI_FONTS.find((f) => f.id === id) ?? DEFAULT_UI_FONT;
}

function readStoredFont(): UiFontDef {
    try {
        return fontById(localStorage.getItem(STORAGE_KEY) ?? "");
    } catch {
        return DEFAULT_UI_FONT;
    }
}

function applyToDocument(font: UiFontDef): void {
    // "system" is the absence of an override: the token keeps its default.
    if (font.id === "system") delete document.documentElement.dataset.font;
    else document.documentElement.dataset.font = font.id;
}

let current = readStoredFont();
applyToDocument(current);

/** The active typeface. */
export function currentUiFont(): UiFontDef {
    return current;
}

/** Switch typeface, and remember the choice. */
export function setUiFont(id: UiFontId): void {
    const next = fontById(id);
    if (next.id === current.id) return;
    current = next;
    try {
        localStorage.setItem(STORAGE_KEY, id);
    } catch {
        /* not being able to remember it is not a reason to fail */
    }
    applyToDocument(current);
    for (const listener of listeners) listener();
}

type Listener = () => void;
const listeners = new Set<Listener>();

/** Subscribe to font changes (useSyncExternalStore contract). */
export function subscribeUiFont(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Test seam: forget the stored font. */
export function resetUiFontForTests(): void {
    current = DEFAULT_UI_FONT;
    applyToDocument(current);
    listeners.clear();
}
