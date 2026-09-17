/**
 * The Timer's calendar vocabulary, in one pure place.
 *
 * The editor never resolves a *relative* Timer — "in 1 month 2 weeks" is
 * resolved inside the game, at arm time (docs/plans/r176-timer-calendar-ux.md
 * §D2, extended in r177) — but it can still say the rule in plain English, and
 * it can tell a real fixed date from an impossible one. Nothing here touches
 * React or the store, so the inspector, the canvas card and the field warnings
 * all read from the same words.
 */

/** Every unit an author can name, in the order the inspector lists them. */
export const TIMER_UNITS = ["years", "months", "weeks", "days", "hours", "minutes"] as const;
export type TimerUnit = (typeof TIMER_UNITS)[number];

/** How each unit is said in a sentence, and how the canvas card shortens it. */
const UNIT_WORDS: Record<TimerUnit, readonly [string, string]> = {
    years: ["year", "years"],
    months: ["month", "months"],
    weeks: ["week", "weeks"],
    days: ["day", "days"],
    hours: ["hour", "hours"],
    minutes: ["minute", "minutes"],
};

const UNIT_SHORT: Record<TimerUnit, string> = {
    years: "y",
    months: "mo",
    weeks: "w",
    days: "d",
    hours: "h",
    minutes: "m",
};

const MINUTES_IN: Partial<Record<TimerUnit, number>> = { days: 1440, hours: 60, minutes: 1 };

/**
 * One box per unit on a relative row: the storage key and the unit it counts
 * in. Wait can name every unit — that is the "in 1 month 2 weeks 2 days and 4
 * hours, whenever that is" rule. A coming day pins a clock time, so its row
 * stops at days: hours and minutes beside a clock would only be a second way
 * to say the same thing.
 */
type UnitBoxes = readonly (readonly [string, TimerUnit])[];

export const WAIT_UNITS: UnitBoxes = [
    ["years", "years"],
    ["months", "months"],
    ["weeks", "weeks"],
    ["days", "days"],
    ["hours", "hours"],
    ["minutes", "minutes"],
];

export const OFFSET_UNITS: UnitBoxes = [
    ["offsetYears", "years"],
    ["offsetMonths", "months"],
    ["offsetWeeks", "weeks"],
    ["offsetDays", "days"],
];

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
    return d <= daysInMonth(y, m);
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

/** "Mon 21 Sep" — the canvas card's short form of the game's own date line. */
export function shortDateText(year: unknown, month: unknown, day: unknown): string | null {
    if (!isRealDate(year, month, day)) return null;
    const y = Math.round(Number(year));
    const m = Math.round(Number(month));
    const d = Math.round(Number(day));
    const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()].slice(0, 3);
    return `${weekday} ${d} ${MONTHS[m - 1].slice(0, 3)}`;
}

/** How many days that month has in that year — February honours leap years. */
export function daysInMonth(year: unknown, month: unknown): number {
    const y = Math.round(Number(year) || 0);
    const m = Math.round(Number(month) || 0);
    if (!(y > 0 && m >= 1 && m <= 12)) return 0;
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** The month's own name as the inspector lists it ("June"), or null. */
export function monthName(month: unknown): string | null {
    const m = Math.round(Number(month) || 0);
    return m >= 1 && m <= 12 ? MONTHS[m - 1] : null;
}

/** A count and its word: "1 day", "2 weeks", "0 minutes". */
function speak(amount: unknown, [one, many]: readonly [string, string]): string {
    const n = Math.max(0, Math.round(Number(amount) || 0));
    return `${n} ${n === 1 ? one : many}`;
}

/** "1 day", "2 weeks" — one unit spoken with its number. */
export function unitPhrase(amount: unknown, unit: unknown): string {
    const key: TimerUnit = (TIMER_UNITS as readonly string[]).includes(String(unit))
        ? (unit as TimerUnit)
        : "days";
    return speak(amount, UNIT_WORDS[key]);
}

function joined(parts: string[]): string {
    if (parts.length <= 1) return parts[0] ?? "";
    return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}

/** One box's value, the way the runtime reads it. */
function amountOf(data: Record<string, unknown>, key: string): number {
    return Math.max(0, Math.round(Number(data[key]) || 0));
}

/** The set boxes of a row, in inspector order. */
function setBoxes(data: Record<string, unknown>, units: UnitBoxes) {
    return units
        .map(([key, unit]) => [amountOf(data, key), unit] as const)
        .filter(([n]) => n > 0);
}

/** "1 month, 2 weeks and 2 days" — the set units in words; null when all are 0. */
export function unitsPhrase(data: Record<string, unknown>, units: UnitBoxes): string | null {
    const parts = setBoxes(data, units).map(([n, unit]) => speak(n, UNIT_WORDS[unit]));
    return parts.length ? joined(parts) : null;
}

/** The same boxes as the canvas card writes them — "1mo 2w 2d"; null when empty. */
export function unitsShort(data: Record<string, unknown>, units: UnitBoxes): string | null {
    const parts = setBoxes(data, units).map(([n, unit]) => `${n}${UNIT_SHORT[unit]}`);
    return parts.length ? parts.join(" ") : null;
}

/**
 * The row read back in the words a human would say it. Days, hours and minutes
 * are normalised among themselves (25 hours becomes "1 day, 1 hour") because
 * those conversions are exact; years, months and weeks are echoed as typed,
 * since a month has no fixed number of days to fold into the rest.
 */
export function unitsReadback(data: Record<string, unknown>, units: UnitBoxes): string | null {
    const calendar = setBoxes(data, units)
        .filter(([, unit]) => unit === "years" || unit === "months" || unit === "weeks")
        .map(([n, unit]) => speak(n, UNIT_WORDS[unit]));
    const minutes = setBoxes(data, units)
        .filter(([, unit]) => MINUTES_IN[unit] !== undefined)
        .reduce((sum, [n, unit]) => sum + n * (MINUTES_IN[unit] ?? 0), 0);
    const clock = [
        [Math.floor(minutes / 1440), UNIT_WORDS.days],
        [Math.floor((minutes % 1440) / 60), UNIT_WORDS.hours],
        [minutes % 60, UNIT_WORDS.minutes],
    ] as const;
    const parts = [...calendar, ...clock.filter(([n]) => n > 0).map(([n, w]) => speak(n, w))];
    return parts.length ? parts.join(", ") : null;
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
        const offset = unitsPhrase(data, OFFSET_UNITS);
        if (!offset) {
            return `Fires today ${at} — or straight away if the clock has already passed that time.`;
        }
        const base = `Fires in ${offset}, ${at}, counted from the day the story reaches this node.`;
        const calendar =
            amountOf(data, "offsetMonths") > 0 || amountOf(data, "offsetYears") > 0;
        return calendar ? `${base} A shorter month uses its last day.` : base;
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

    const wait = unitsPhrase(data, WAIT_UNITS);
    if (!wait) return "Fires as soon as the story reaches this node — nothing is set to wait.";
    return `Fires ${wait} after the story reaches this node.`;
}
