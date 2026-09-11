/**
 * The editor theme.
 *
 * Six curated palettes. A theme is one unlayered `html[data-theme="…"]` block
 * in `src/index.css` overriding the design tokens — every `bg-*`/`text-*`
 * utility and `var(--color-…)` read follows at runtime, which is what makes
 * live preview possible while the (non-modal) settings sheet is open.
 *
 * The rule that keeps this from becoming a free-form colour picker: themes
 * retint the *chrome* (surfaces, inks, lines, accent), and only High Contrast
 * and Daylight also shift the node-category hues — always as a curated set,
 * never per colour. The categories are the canvas's reading language; a theme
 * that scrambles them one by one would break "the canvas reads at a glance".
 *
 * The `preview` swatches below are for the picker cards and are a deliberate
 * duplication of the CSS values (they must show all six themes, not just the
 * active one, so `getComputedStyle` cannot serve them). The CSS blocks are
 * the source of truth — keep both in step when tuning a theme.
 */
import { CATEGORY_HEX, type CategoryId } from "@/schema/registry";

const STORAGE_KEY = "qe.theme";

export const THEME_IDS = [
    "midnight",
    "high-contrast",
    "daylight",
    "phosphor",
    "dusk",
    "slate",
] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export interface ThemeDef {
    id: ThemeId;
    label: string;
    hint: string;
    /** Swatch chips for the picker card; mirrors the CSS block (see header). */
    preview: { canvas: string; surface: string; ink: string; accent: string };
    /** True when the theme's surfaces are light — drives `color-scheme`. */
    light: boolean;
    /**
     * Category hue overrides for the minimap, which paints SVG `fill`
     * attributes and cannot resolve `var()`. Only the themes that retint
     * categories need this; the rest fall back to `CATEGORY_HEX`.
     */
    categoryHex?: Record<CategoryId, string>;
}

export const THEMES: readonly ThemeDef[] = [
    {
        id: "midnight",
        label: "Midnight",
        hint: "The editor's own look: near-black with a cool blue undertone and one cyan accent.",
        preview: { canvas: "#0c0e13", surface: "#12141b", ink: "#e8eaf1", accent: "#22d3ee" },
        light: false,
    },
    {
        id: "high-contrast",
        label: "High contrast",
        hint: "Brighter text and stronger lines on a deeper black. For when the canvas feels muddy.",
        preview: { canvas: "#050608", surface: "#0b0d12", ink: "#ffffff", accent: "#4ee4ff" },
        light: false,
        categoryHex: {
            entry: "#c4a5fc",
            objective: "#ffd23e",
            trigger: "#55e3ff",
            world: "#52e8b0",
            comms: "#ff8cc9",
            reply: "#ffab5e",
            effect: "#82b4ff",
            community: "#5ce8d8",
            flow: "#b8c4d4",
            layout: "#8494ab",
        },
    },
    {
        id: "daylight",
        label: "Daylight",
        hint: "A warm, cream-tinted light mode — paper, not a white screen.",
        preview: { canvas: "#f7efdf", surface: "#fdf6e9", ink: "#2b2313", accent: "#0f7d96" },
        light: true,
        categoryHex: {
            entry: "#6d4bc4",
            objective: "#a8730a",
            trigger: "#0b7d97",
            world: "#0f8a56",
            comms: "#c2337f",
            reply: "#c05f16",
            effect: "#2b62c9",
            community: "#0b8478",
            flow: "#5b6b80",
            layout: "#56647a",
        },
    },
    {
        id: "phosphor",
        label: "Phosphor",
        hint: "Green-on-black, the CRT terminal. Node categories keep their hues — the reading language survives the nostalgia.",
        preview: { canvas: "#050b06", surface: "#0a140b", ink: "#a8f0b0", accent: "#4dff88" },
        light: false,
    },
    {
        id: "dusk",
        label: "Dusk",
        hint: "A warm, low-blue dark mode for evening sessions.",
        preview: { canvas: "#120d08", surface: "#191209", ink: "#f3e9da", accent: "#f5b04c" },
        light: false,
    },
    {
        id: "slate",
        label: "Slate",
        hint: "A softer, lighter grey-blue dark mode — less stark than Midnight.",
        preview: { canvas: "#141821", surface: "#1a1f2a", ink: "#dde3ee", accent: "#7dd3fc" },
        light: false,
    },
];

/** The theme that ships: what a fresh install sees. */
export const DEFAULT_THEME: ThemeDef = THEMES[0];

function themeById(id: string): ThemeDef {
    return THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
}

function readStoredTheme(): ThemeDef {
    try {
        return themeById(localStorage.getItem(STORAGE_KEY) ?? "");
    } catch {
        // Private mode, or no storage at all.
        return DEFAULT_THEME;
    }
}

function applyToDocument(theme: ThemeDef): void {
    const root = document.documentElement;
    // Midnight is the absence of an override: the CSS keeps its default
    // tokens, exactly like the "system" font choice.
    if (theme.id === "midnight") delete root.dataset.theme;
    else root.dataset.theme = theme.id;
    // Native controls (scrollbars, form fields) should match the surfaces.
    root.style.colorScheme = theme.light ? "light" : "dark";
}

let current = readStoredTheme();
applyToDocument(current);

/** The active theme. */
export function currentTheme(): ThemeDef {
    return current;
}

/** Switch theme, remember it, and repaint the document. */
export function setTheme(id: ThemeId): void {
    const next = themeById(id);
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

/** The minimap's colour for a node category, honouring theme overrides. */
export function themeCategoryHex(category: CategoryId): string {
    return current.categoryHex?.[category] ?? CATEGORY_HEX[category];
}

type Listener = () => void;
const listeners = new Set<Listener>();

/** Subscribe to theme changes (useSyncExternalStore contract). */
export function subscribeTheme(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Test seam: forget the stored theme. */
export function resetThemeForTests(): void {
    current = DEFAULT_THEME;
    applyToDocument(current);
    listeners.clear();
}
