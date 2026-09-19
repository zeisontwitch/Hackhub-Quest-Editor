import { z } from "zod";

/**
 * Pack extras (r203) — the things a pack puts *outside* its own quests.
 *
 * Verified in game before any of this was authored (r200/r201 probe, rows
 * T-16..T-22 in `reference/sdk-0.24-qa/STATUS.md`):
 *
 * - `Menu.addItem` works; the items appear in the strip at the bottom of the
 *   start menu, and the SDK's declared `section` field has **no visible
 *   effect** — which is why there is no `section` here. A control that does
 *   nothing is worse than no control.
 * - `Desktop.addWidget` works and renders a mod's own HTML from a
 *   mod-relative path, honouring width/height/position. **`transparent`
 *   defaults to `true` in the SDK**, so a widget that does not set it draws its
 *   text with no background at all — the first probe looked broken for exactly
 *   that reason. Here the default is `false` (opaque), because a background is
 *   what an author expects to see.
 * - `ContextMenu.register` works for all four declared targets.
 * - `Localization` works: `t()` translates, `{{placeholders}}` substitute, and a
 *   missing key echoes its own name rather than blanking.
 */

/**
 * The languages the game actually offers, read from `Localization.languages()`
 * in game on 2026-09-19 (30 of them). Kept as data rather than invented, and
 * used to build the Languages table's columns.
 */
export const GAME_LANGUAGES = [
    { code: "ar", label: "العربية" },
    { code: "bg", label: "Български" },
    { code: "cs", label: "Čeština" },
    { code: "da", label: "Dansk" },
    { code: "de", label: "Deutsch" },
    { code: "el", label: "Ελληνικά" },
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "es-ES", label: "Español (España)" },
    { code: "fi", label: "Suomi" },
    { code: "fr", label: "Français" },
    { code: "hu", label: "Magyar" },
    { code: "id", label: "Bahasa Indonesia" },
    { code: "it", label: "Italiano" },
    { code: "ja-JP", label: "日本語" },
    { code: "ko-KR", label: "한국어" },
    { code: "nl", label: "Nederlands" },
    { code: "no", label: "Norsk" },
    { code: "pl", label: "Polski" },
    { code: "pt", label: "Português" },
    { code: "pt-BR", label: "Português (Brasil)" },
    { code: "ro", label: "Română" },
    { code: "ru", label: "Русский" },
    { code: "sv", label: "Svenska" },
    { code: "th", label: "ไทย" },
    { code: "tr", label: "Türkçe" },
    { code: "uk", label: "Українська" },
    { code: "vi", label: "Tiếng Việt" },
    { code: "zh", label: "中文" },
    { code: "zh-Hant-TW", label: "繁體中文（台灣）" },
] as const;

export const GAME_LANGUAGE_CODES = GAME_LANGUAGES.map((l) => l.code) as unknown as [string, ...string[]];

/** English is where an author's own text lives, so it is the one language the
 *  table always offers — and the one the SDK falls back to. */
export const DEFAULT_LANGUAGE = "en";

/**
 * What a click on a menu or right-click item does. Four actions, all approved
 * (r199), each one a call the compiler already emits somewhere else.
 */
export const EXTRA_ACTION_KINDS = ["notify", "claim", "mail", "handbook"] as const;

export const ExtraActionSchema = z.object({
    kind: z.enum(EXTRA_ACTION_KINDS).default("notify"),
    /** notify: the toast text (tokens work). */
    text: z.string().default(""),
    /** claim: the quest to start, by id — the same call the harness makes. */
    questId: z.string().default(""),
    /** mail: the fields `Mail.send` takes, plus a sender line. */
    mailFrom: z.string().default(""),
    mailSubject: z.string().default(""),
    mailContent: z.string().default(""),
    /** handbook: which article to open (`Handbook.open(id, category)`). */
    handbookId: z.string().default(""),
    handbookCategory: z.string().default(""),
});
export type ExtraAction = z.infer<typeof ExtraActionSchema>;

export const MenuItemSchema = z.object({
    id: z.string(),
    label: z.string().default(""),
    /** Optional asset path shown by the game; left empty by default. */
    icon: z.string().default(""),
    action: ExtraActionSchema.default({} as never),
});
export type MenuItemDoc = z.infer<typeof MenuItemSchema>;

export const DesktopWidgetSchema = z.object({
    id: z.string(),
    /** The author's own name for it, shown in the editor's list. */
    name: z.string().default(""),
    width: z.number().int().min(40).max(1920).default(320),
    height: z.number().int().min(40).max(1080).default(180),
    x: z.number().int().min(0).max(4000).default(40),
    y: z.number().int().min(0).max(4000).default(40),
    /**
     * SDK default is true (see the module note). The editor defaults to opaque
     * so a widget never looks like bare text by accident.
     */
    transparent: z.boolean().default(false),
    /** The widget's HTML, authored with the website builder's page editor. */
    html: z.string().default(""),
});
export type DesktopWidgetDoc = z.infer<typeof DesktopWidgetSchema>;

export const CONTEXT_TARGETS = ["file", "desktop", "taskbar", "window"] as const;

export const ContextItemSchema = z.object({
    id: z.string(),
    label: z.string().default(""),
    icon: z.string().default(""),
    /** Where the entry appears — all four verified in game (r201). */
    target: z.enum(CONTEXT_TARGETS).default("file"),
    action: ExtraActionSchema.default({} as never),
});
export type ContextItemDoc = z.infer<typeof ContextItemSchema>;

export const ExtrasSchema = z.object({
    menuItems: z.array(MenuItemSchema).default([]),
    widgets: z.array(DesktopWidgetSchema).default([]),
    contextItems: z.array(ContextItemSchema).default([]),
});
export type ExtrasDoc = z.infer<typeof ExtrasSchema>;

/**
 * Translations. `strings[language][key]` is one line of text; `{{tr.key}}` in
 * any authored field pulls it out at runtime.
 *
 * Shape note: the keys live once (in English) and other languages fill in what
 * they have — the SDK falls back to English for anything missing, so a
 * half-translated pack reads as English rather than as blanks.
 */
export const TranslationsSchema = z.object({
    /** Every language a string exists for, including `en`. */
    languages: z.array(z.string()).default([DEFAULT_LANGUAGE]),
    strings: z.record(z.string(), z.record(z.string(), z.string())).default({}),
});
export type TranslationsDoc = z.infer<typeof TranslationsSchema>;

/** True when there is nothing to emit — the compiler then leaves it out
 *  entirely, so a project without extras compiles byte-identically to before. */
export function extrasAreEmpty(extras: ExtrasDoc | undefined): boolean {
    if (!extras) return true;
    /* The lists are read through `?? []` because a defaulted object field is
       handed back by zod as-is: a project parsed from JSON with no `extras`
       key has the object, but not the three arrays inside it. */
    const menu = extras.menuItems ?? [];
    const widgets = extras.widgets ?? [];
    const context = extras.contextItems ?? [];
    return menu.length === 0 && widgets.length === 0 && context.length === 0;
}

export function translationsAreEmpty(t: TranslationsDoc | undefined): boolean {
    if (!t) return true;
    return Object.keys(t.strings ?? {}).length === 0;
}

/** The key an author types in a text field to pull a translated line in. */
export function trToken(key: string): string {
    return `{{tr.${key}}}`;
}
