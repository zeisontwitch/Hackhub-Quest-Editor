/**
 * The theme and typeface modules.
 *
 * Separate file from the settings-sheet tests on purpose: both modules read
 * localStorage once at import and apply to the document, so their
 * stored-value handling needs a module registry that starts clean.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    currentTheme,
    resetThemeForTests,
    setTheme,
    themeCategoryHex,
    THEMES,
    THEME_IDS,
} from "@/editor/settings/theme";
import {
    currentUiFont,
    resetUiFontForTests,
    setUiFont,
    UI_FONTS,
} from "@/editor/settings/uiFont";

beforeEach(() => {
    localStorage.clear();
    resetThemeForTests();
    resetUiFontForTests();
});

describe("the theme module", () => {
    it("starts on Midnight, the shipped look", () => {
        expect(currentTheme().id).toBe("midnight");
        expect(document.documentElement.dataset.theme).toBeUndefined();
    });

    it("switching applies to the document and persists", () => {
        setTheme("phosphor");
        expect(currentTheme().id).toBe("phosphor");
        expect(document.documentElement.dataset.theme).toBe("phosphor");
        expect(localStorage.getItem("qe.theme")).toBe("phosphor");
    });

    it("declares Daylight a light scheme, and only Daylight", () => {
        for (const theme of THEMES) {
            const isDaylight = theme.id === "daylight";
            expect(theme.light, theme.id).toBe(isDaylight);
        }
    });

    it("offers exactly the six curated themes, each with preview chips", () => {
        expect(THEMES.map((t) => t.id)).toEqual([...THEME_IDS]);
        for (const theme of THEMES) {
            expect(theme.preview.canvas).toMatch(/^#/);
            expect(theme.preview.accent).toMatch(/^#/);
        }
    });

    it("gives the minimap theme-aware category hexes", () => {
        // Only High Contrast and Daylight retint categories; everything else
        // falls back to the registry's standard set.
        setTheme("dusk");
        expect(themeCategoryHex("objective")).toBe("#fbbf24");
        setTheme("daylight");
        expect(themeCategoryHex("objective")).toBe("#a8730a");
        setTheme("high-contrast");
        expect(themeCategoryHex("objective")).toBe("#ffd23e");
    });

    it("ignores a stored theme it does not recognise", async () => {
        // A fresh module registry, as after a real reload with a stale key.
        localStorage.setItem("qe.theme", "y2k");
        vi.resetModules();
        const { currentTheme: fresh } = await import("@/editor/settings/theme");
        expect(fresh().id).toBe("midnight");
    });
});

describe("the typeface module", () => {
    it("starts on the system font, with no override attribute", () => {
        expect(currentUiFont().id).toBe("system");
        expect(document.documentElement.dataset.font).toBeUndefined();
    });

    it("switching applies to the document and persists", () => {
        setUiFont("jetbrains");
        expect(currentUiFont().id).toBe("jetbrains");
        expect(document.documentElement.dataset.font).toBe("jetbrains");
        expect(localStorage.getItem("qe.uiFont")).toBe("jetbrains");
    });

    it("going back to system removes the override entirely", () => {
        setUiFont("atkinson");
        setUiFont("system");
        expect(document.documentElement.dataset.font).toBeUndefined();
        expect(currentUiFont().id).toBe("system");
    });

    it("ignores a stored font it does not recognise", async () => {
        localStorage.setItem("qe.uiFont", "comic-sans");
        vi.resetModules();
        const { currentUiFont: fresh } = await import("@/editor/settings/uiFont");
        expect(fresh().id).toBe("system");
    });

    it("every offered font explains itself", () => {
        for (const font of UI_FONTS) {
            expect(font.hint.length, font.id).toBeGreaterThan(10);
        }
    });
});
