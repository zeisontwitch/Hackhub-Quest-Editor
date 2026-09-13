/**
 * Remembered tags.
 *
 * Tags an author invents are worth as much as the built-in list, but they only
 * exist inside the project they were typed in. This keeps them in localStorage
 * (browser-local, never exported) so the next mod can reuse them with a click.
 */

const KEY = "hackhub-quest-editor:tags:v1";
const LIMIT = 60;

function read(): string[] {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
    } catch {
        return [];
    }
}

/** Tags this browser has seen before, most recently used first. */
export function rememberedTags(): string[] {
    return read();
}

/** Record tags the author used. Most recent first, de-duplicated, capped. */
export function rememberTags(tags: string[]): string[] {
    const cleaned = tags.map((t) => t.trim()).filter(Boolean);
    if (cleaned.length === 0) return read();
    const next = [...new Set([...cleaned, ...read()])].slice(0, LIMIT);
    try {
        localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
        /* storage disabled or full — remembering tags is a convenience, not a
           feature worth breaking the editor over. */
    }
    return next;
}

/** Drop one remembered tag (the author can tidy their own list). */
export function forgetTag(tag: string): string[] {
    const next = read().filter((t) => t !== tag);
    try {
        localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
        /* see above */
    }
    return next;
}
