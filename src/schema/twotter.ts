/**
 * The one Twotter fact both the schema and the compiler need.
 *
 * It lives in its own module for a boring but load-bearing reason: the manual's
 * inventory script loads `src/compiler/compile.ts` through jiti, and
 * `src/schema/project.ts` pulls in `@/templates/pages`, which imports `.html`
 * files that only Vite can resolve. Keeping the pattern in a leaf file lets the
 * compiler and the schema share it without dragging the editor's HTML into a
 * Node script. (Same class of problem as the note at the bottom of
 * `scripts/extract-manual-inventory.mjs`.)
 */

/** Letters, numbers and `_`, 3–15 characters — what Twotter search matches on. */
export const TWOTTER_HANDLE_PATTERN = /^[A-Za-z0-9_]{3,15}$/;

/* ── Ages, shared by the inspector and the Twotter panel (r188) ─────────────
   The editor's face for a tweet row. It lives here with the handle pattern for
   the same reason: this module has no imports, so the compiler, the schema and
   the editor can all use it without dragging the editor's HTML into a Node
   script. */

/** The time half of a tweet row, structurally. */
export interface TweetTime {
    timeMode: "arrival" | "earlier";
    agoAmount: number;
    agoUnit: string;
}

/** In-game milliseconds per unit, for ORDER and for a rough age readout. */
const UNIT_MS: Record<string, number> = {
    minutes: 60_000,
    hours: 60 * 60_000,
    days: 24 * 60 * 60_000,
    weeks: 7 * 24 * 60 * 60_000,
    // Calendar months and years are not fixed lengths; these are the mean
    // lengths, which is all an ordering needs. Nothing user-visible is computed
    // from them except "is this older than that".
    months: 30.44 * 24 * 60 * 60_000,
    years: 365.25 * 24 * 60 * 60_000,
};

/**
 * How old the tweet is when the player finds it, in milliseconds.
 *
 * `arrival` is 0 — it is posted as the story runs, so it is the newest thing on
 * the profile. That is the whole reason this helper exists: the panel shows the
 * profile in the GAME's order (newest first), and "newest" has to be decided
 * the same way the game decides it.
 */
export function tweetAgeMs(row: TweetTime): number {
    if (row.timeMode !== "earlier") return 0;
    const amount = Math.max(1, Math.round(Number(row.agoAmount) || 1));
    const unit = String(row.agoUnit || "days");
    return amount * (UNIT_MS[unit] ?? UNIT_MS.days!);
}

/**
 * The age as the game words it: "a few seconds ago" for a tweet that arrives
 * with the story, and "a month ago" / "3 months ago" for a backdated one.
 *
 * The game writes the singular with "a" — the r185 run read "a month ago" on
 * screen for a tweet we had backdated by exactly one month — so the preview uses
 * the same words rather than "1 month ago".
 */
export function tweetAgeLabel(row: TweetTime): string {
    if (row.timeMode !== "earlier") return "a few seconds ago";
    const amount = Math.max(1, Math.round(Number(row.agoAmount) || 1));
    const unit = String(row.agoUnit || "days");
    const singular = unit.endsWith("s") ? unit.slice(0, -1) : unit;
    return amount === 1 ? `a ${singular} ago` : `${amount} ${unit} ago`;
}

/**
 * The profile's order: newest first, ties keeping the order they were written
 * (which is the order they are posted in). P-01b proved the game does exactly
 * this, and the preview has to mirror the game or it teaches the wrong thing.
 */
export function profileOrder<T extends TweetTime>(rows: T[]): { row: T; index: number }[] {
    return rows
        .map((row, index) => ({ row, index }))
        .sort((a, b) => tweetAgeMs(a.row) - tweetAgeMs(b.row) || a.index - b.index);
}
