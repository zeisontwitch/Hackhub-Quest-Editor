/**
 * The Timer's calendar vocabulary (r176, one box per unit in r177): the words
 * the inspector, the canvas card and the field warnings all share. The
 * runtime's own arithmetic is exercised against the compiled mod in
 * compiler/__tests__/scheduleBeat.test.ts; these are the statements the editor
 * can make before it ever exports.
 */
import { describe, expect, it } from "vitest";
import {
    clockText,
    dateText,
    daysInMonth,
    isRealDate,
    monthName,
    OFFSET_UNITS,
    pad2,
    shortDateText,
    timerSentence,
    unitPhrase,
    unitsPhrase,
    unitsReadback,
    unitsShort,
    WAIT_UNITS,
} from "@/schema/timer";

describe("the clock's own words", () => {
    it("writes the game's zero-padded 24-hour clock", () => {
        expect(clockText(4, 20)).toBe("04:20");
        expect(clockText(0, 0)).toBe("00:00");
        expect(clockText(23, 59)).toBe("23:59");
        expect(pad2(7)).toBe("07");
    });

    it("clamps instead of rendering an impossible time", () => {
        expect(clockText(23.6, -3)).toBe("23:00");
        expect(clockText(99, 99)).toBe("23:59");
    });
});

describe("the calendar", () => {
    it("knows which days a month really has", () => {
        expect(daysInMonth(2026, 9)).toBe(30);
        expect(daysInMonth(2026, 2)).toBe(28);
        expect(daysInMonth(2028, 2)).toBe(29);
        expect(daysInMonth(2026, 0)).toBe(0);
    });

    it("accepts 29 February only in a leap year", () => {
        expect(isRealDate(2028, 2, 29)).toBe(true);
        expect(isRealDate(2027, 2, 29)).toBe(false);
        expect(isRealDate(2026, 6, 31)).toBe(false);
        expect(isRealDate(2026, 9, 21)).toBe(true);
    });

    it("spells the game's own date line", () => {
        expect(dateText(2026, 9, 21)).toBe("Monday, 21 September 2026");
        expect(shortDateText(2026, 9, 21)).toBe("Mon 21 Sep");
        expect(dateText(2026, 2, 30)).toBeNull();
        expect(monthName(9)).toBe("September");
        expect(monthName(0)).toBeNull();
    });
});

describe("the unit boxes", () => {
    it("lists every set box in words, in inspector order", () => {
        expect(
            unitsPhrase(
                { offsetYears: 1, offsetMonths: 1, offsetWeeks: 2, offsetDays: 2 },
                OFFSET_UNITS,
            ),
        ).toBe("1 year, 1 month, 2 weeks and 2 days");
        expect(unitsPhrase({ years: 1, months: 2 }, WAIT_UNITS)).toBe("1 year and 2 months");
        expect(unitsPhrase({}, OFFSET_UNITS)).toBeNull();
        expect(unitsPhrase({ offsetDays: 0 }, OFFSET_UNITS)).toBeNull();
    });

    it("shortens the same boxes for the canvas card", () => {
        expect(
            unitsShort(
                { offsetYears: 1, offsetMonths: 1, offsetWeeks: 2, offsetDays: 2 },
                OFFSET_UNITS,
            ),
        ).toBe("1y 1mo 2w 2d");
        expect(unitsShort({ days: 2, hours: 4, minutes: 30 }, WAIT_UNITS)).toBe("2d 4h 30m");
        expect(unitsShort({}, WAIT_UNITS)).toBeNull();
    });

    it("reads the row back in words, normalising only what is exact", () => {
        expect(unitsReadback({ days: 2, hours: 4, minutes: 30 }, WAIT_UNITS)).toBe(
            "2 days, 4 hours, 30 minutes",
        );
        // 25 hours is legal and means 1 day, 1 hour.
        expect(unitsReadback({ hours: 25 }, WAIT_UNITS)).toBe("1 day, 1 hour");
        expect(unitsReadback({ days: 1 }, WAIT_UNITS)).toBe("1 day");
        // A month has no fixed day count to fold into, so it is echoed as typed.
        expect(unitsReadback({ years: 1, months: 2, days: 1 }, WAIT_UNITS)).toBe(
            "1 year, 2 months, 1 day",
        );
        expect(unitsReadback({}, WAIT_UNITS)).toBeNull();
    });

    it("speaks a single unit with its number, and falls back to days", () => {
        expect(unitPhrase(1, "weeks")).toBe("1 week");
        expect(unitPhrase(2, "months")).toBe("2 months");
        expect(unitPhrase(3, "fortnights")).toBe("3 days");
    });
});

describe("the sentences", () => {
    it("speaks a relative rule without resolving it", () => {
        expect(
            timerSentence({ mode: "daytime", offsetDays: 3, hour: 12, minute: 0 }),
        ).toBe("Fires in 3 days, at 12:00 in-game, counted from the day the story reaches this node.");
        expect(
            timerSentence({ mode: "daytime", hour: 4, minute: 20 }),
        ).toBe("Fires today at 04:20 in-game — or straight away if the clock has already passed that time.");
    });

    it("names every box of a mixed offset", () => {
        expect(
            timerSentence({
                mode: "daytime",
                offsetYears: 1,
                offsetMonths: 1,
                offsetWeeks: 2,
                offsetDays: 2,
                hour: 18,
                minute: 23,
            }),
        ).toBe(
            "Fires in 1 year, 1 month, 2 weeks and 2 days, at 18:23 in-game, counted from the day the story " +
                "reaches this node. A shorter month uses its last day.",
        );
    });

    it("adds the short-month clause only where clamping can happen", () => {
        const months = timerSentence({ mode: "daytime", offsetMonths: 1, hour: 4, minute: 20 });
        expect(months).toContain("A shorter month uses its last day.");
        const weeks = timerSentence({ mode: "daytime", offsetWeeks: 2, hour: 4, minute: 20 });
        expect(weeks).not.toContain("shorter month");
    });

    it("names an impossible date as impossible, and a blank one as unfinished", () => {
        expect(timerSentence({ mode: "at", dateYear: 2026, dateMonth: 6, dateDay: 31 })).toBe(
            "That date never arrives on the calendar — pick a real day.",
        );
        expect(timerSentence({ mode: "at", dateYear: 2026, dateMonth: 0, dateDay: 0 })).toContain("Set a year");
        expect(
            timerSentence({ mode: "at", dateYear: 2026, dateMonth: 9, dateDay: 21, hour: 4, minute: 20 }),
        ).toContain("Monday, 21 September 2026, 04:20");
    });

    it("speaks Wait with every unit, calendar included", () => {
        expect(timerSentence({ mode: "after", years: 1, months: 1, weeks: 2, days: 2, hours: 4 })).toBe(
            "Fires 1 year, 1 month, 2 weeks, 2 days and 4 hours after the story reaches this node.",
        );
        expect(timerSentence({ mode: "after" })).toBe(
            "Fires as soon as the story reaches this node — nothing is set to wait.",
        );
    });
});
