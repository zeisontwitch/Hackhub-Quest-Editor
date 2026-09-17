/**
 * The Timer's calendar vocabulary (r176): the words the inspector, the canvas
 * card and the field warnings all share. The runtime's own arithmetic is
 * exercised against the compiled mod in compiler/__tests__/scheduleBeat.test.ts;
 * these are the statements the editor can make before it ever exports.
 */
import { describe, expect, it } from "vitest";
import {
    clockText,
    dateText,
    daysInMonth,
    durationSentence,
    isRealDate,
    monthName,
    pad2,
    shortDateText,
    timerSentence,
    unitPhrase,
    unitShort,
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

describe("the sentences", () => {
    it("speaks a relative rule without resolving it", () => {
        expect(
            timerSentence({ mode: "daytime", offsetAmount: 3, offsetUnit: "days", hour: 12, minute: 0 }),
        ).toBe("Fires in 3 days, at 12:00 in-game, counted from the day the story reaches this node.");
        expect(
            timerSentence({ mode: "daytime", offsetAmount: 0, offsetUnit: "days", hour: 4, minute: 20 }),
        ).toBe("Fires today at 04:20 in-game — or straight away if the clock has already passed that time.");
    });

    it("adds the short-month clause only where clamping can happen", () => {
        const months = timerSentence({ mode: "daytime", offsetAmount: 1, offsetUnit: "months", hour: 4, minute: 20 });
        expect(months).toContain("A shorter month uses its last day.");
        const weeks = timerSentence({ mode: "daytime", offsetAmount: 2, offsetUnit: "weeks", hour: 4, minute: 20 });
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

    it("reads the Wait row back in words, normalised", () => {
        expect(durationSentence(2, 4, 30)).toBe("2 days, 4 hours, 30 minutes");
        expect(durationSentence(0, 25, 0)).toBe("1 day, 1 hour");
        expect(durationSentence(1, 0, 0)).toBe("1 day");
        expect(durationSentence(0, 0, 0)).toBeNull();
    });

    it("shortens units for the canvas card, with the days fallback", () => {
        expect(unitShort("days")).toBe("d");
        expect(unitShort("weeks")).toBe("w");
        expect(unitShort("months")).toBe("mo");
        expect(unitShort("years")).toBe("y");
        expect(unitShort("fortnights")).toBe("d");
        expect(unitPhrase(1, "weeks")).toBe("1 week");
        expect(unitPhrase(2, "months")).toBe("2 months");
    });
});
