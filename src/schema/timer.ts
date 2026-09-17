/**
 * The Timer's calendar vocabulary, in one pure place.
 *
 * The editor never resolves a *relative* Timer — "in 2 weeks" is resolved
 * inside the game, at arm time (docs/plans/r176-timer-calendar-ux.md §D2) —
 * but it can still say the rule in plain English, and it can tell a real fixed
 * date from an impossible one. Nothing here touches React or the store, so the
 * inspector, the canvas card and the field warnings all read from the same
 * words.
 */

export const TIMER_UNITS = ["days", "weeks", "months", "years"] as const;
export type TimerUnit = (typeof TIMER_UNITS)[number];

/** How each unit is said in a sentence. */
const UNIT_WORDS: Record<TimerUnit, readonly [string, string]> = {
    days: ["day", "days"],
    weeks: ["week", "weeks"],
    months: ["month", "months"],
    years: ["year", "years"],
};

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
] as const;

const WEEKDAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
] as const;

/**
 * The month choices the inspector offers. Value 0 is the schema's "not set
 * yet" default, kept as an explicit choice so a fresh Timer does not silently
 * show January.
 */
export const MONTH_OPTIONS = [
    { value: "0", label: "Not set yet" },
    ...MONTHS.map((label, i) => ({ value: String(i + 1), label })),
];

/** Two digits, for the clock's face. */
export function pad2(value: number): string {
    return String(value).padStart(2, "0");
}

export function clampHour(hour: unknown): number {
    const n = Math.round(Number(hour) || 0);
    return Math.min(23, Math.max(0, n));
}

export function clampMinute(minute: unknown): number {
    const n = Math.round(Number(minute) || 0);
    return Math.min(59, Math.max(0, n));
}

/** "04:20" — the shape the in-game clock uses (24-hour, zero-padded). */
export function clockText(hour: unknown, minute: unknown): string {
    return `${pad2(clampHour(hour))}:${pad2(clampMinute(minute))}`;
}

/** Does the (proleptic Gregorian) calendar have this day? */
export function isRealDate(year: unknown, month: unknown, day: unknown): boolean {
    const y = Math.round(Number(year) || 0);
    const m = Math.round(Number(month) || 0);
    const d = Math.round(Number(day) || 0);
    if (!(y > 0 && m >= 1 && m <= 12 && d >= 1)) return false;
    return d <= new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * The game's own date line — "Monday, 21 September 2026" — or null when the
 * date is incomplete or impossible.
 */
export function dateText(year: unknown, month: unknown, day: unknown): string | null {
    if (!isRealDate(year, month, day)) return null;
    const y = Math.round(Number(year));
    const m = Math.round(Number(month));
    const d = Math.round(Number(day));
    const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    return `${weekday}, ${d} ${MONTHS[m - 1]} ${y}`;
}

/** A count and its word: "1 day", "2 weeks", "0 minutes". */
function speak(amount: unknown, [one, many]: readonly [string, string]): string {
    const n = Math.max(0, Math.round(Number(amount) || 0));
    return `${n} ${n === 1 ? one : many}`;
}

/** "1 day", "2 weeks" — the relative-mode unit spoken with its number. */
export function unitPhrase(amount: unknown, unit: unknown): string {
    const key: TimerUnit = (TIMER_UNITS as readonly string[]).includes(String(unit))
        ? (unit as TimerUnit)
        : "days";
    return speak(amount, UNIT_WORDS[key]);
}

/** The Wait mode's three units; not relative-mode units, but spoken the same. */
const DURATION_WORDS = {
    days: ["day", "days"],
    hours: ["hour", "hours"],
    minutes: ["minute", "minutes"],
} as const;

function joined(parts: string[]): string {
    if (parts.length <= 1) return parts[0] ?? "";
    return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}

/**
 * The sentence the inspector shows above the fields: what this Timer will do,
 * in the game's own terms. It describes a relative rule rather than resolving
 * it — only the mod, in the running game, can resolve one.
 */
export function timerSentence(data: Record<string, unknown>): string {
    const mode = String(data.mode ?? "after");
    const at = `at ${clockText(data.hour, data.minute)} in-game`;

    if (mode === "daytime") {
        const amount = Math.max(0, Math.round(Number(data.offsetAmount) || 0));
        const unit = String(data.offsetUnit ?? "days");
        if (amount === 0) {
            return `Fires today ${at} — or straight away if the clock has already passed that time.`;
        }
        const base = `Fires in ${unitPhrase(amount, unit)}, ${at}, counted from the day the story reaches this node.`;
        return unit === "months" || unit === "years"
            ? `${base} A shorter month uses its last day.`
            : base;
    }

    if (mode === "at") {
        const date = dateText(data.dateYear, data.dateMonth, data.dateDay);
        const y = Math.round(Number(data.dateYear) || 0);
        const m = Math.round(Number(data.dateMonth) || 0);
        const d = Math.round(Number(data.dateDay) || 0);
        if (y > 0 && m > 0 && d > 0 && !date) {
            return "That date never arrives on the calendar — pick a real day.";
        }
        if (!date) return "Set a year, a month and a day, and this fires when the in-game clock reads them.";
        return `Fires when the in-game clock reads ${date}, ${clockText(data.hour, data.minute)}. If that moment has already passed, it fires as soon as the story gets here.`;
    }

    const parts = [
        Number(data.days) ? speak(data.days, DURATION_WORDS.days) : "",
        Number(data.hours) ? speak(data.hours, DURATION_WORDS.hours) : "",
        Number(data.minutes) ? speak(data.minutes, DURATION_WORDS.minutes) : "",
    ].filter(Boolean);
    if (!parts.length) return "Fires as soon as the story reaches this node — nothing is set to wait.";
    return `Fires ${joined(parts)} after the story reaches this node.`;
}
