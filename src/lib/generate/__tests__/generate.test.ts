/**
 * The field value generators (r161).
 *
 * Pure module, so it is tested directly: format guarantees with a STUBBED rng
 * (so output is exact and deterministic), reuse of sibling context, and the
 * wordlists' own invariants. The formats are load-bearing — a generated service
 * version that metasploit refuses, or an e-mail without an "@", is a value the
 * author would have to fix by hand, which defeats the button.
 */
import { describe, expect, it } from "vitest";
import {
    email,
    generateField,
    hostname,
    iban,
    ip,
    serviceVersion,
    username,
    type Rng,
} from "@/lib/generate";
import {
    FIRST_NAMES,
    LAST_NAMES,
    MAIL_PROVIDERS,
    SERVICE_BANNERS,
} from "@/lib/generate/wordlists";

/** An rng that walks a fixed sequence, looping — fully deterministic. */
function seq(values: number[]): Rng {
    let i = 0;
    return () => values[i++ % values.length];
}

describe("ip", () => {
    it("makes four octets in range", () => {
        const value = ip("public", seq([0.5]));
        const parts = value.split(".").map(Number);
        expect(parts).toHaveLength(4);
        for (const p of parts) {
            expect(p).toBeGreaterThanOrEqual(0);
            expect(p).toBeLessThanOrEqual(255);
        }
    });

    it("public avoids private and reserved first octets", () => {
        // Roll many with a moving rng; none may land in a private/reserved block.
        for (let i = 0; i < 200; i++) {
            const first = Number(ip("public", seq([i / 200, 0.3, 0.6, 0.9])).split(".")[0]);
            expect([10, 127, 169, 172, 192]).not.toContain(first);
            expect(first).toBeLessThan(224);
            expect(first).toBeGreaterThan(0);
        }
    });

    it("private rolls a valid RFC-1918 block", () => {
        expect(ip("private", seq([0.0, 0.5])).startsWith("10.")).toBe(true);
        expect(ip("private", seq([0.5, 0.5])).startsWith("172.")).toBe(true);
        expect(ip("private", seq([0.99, 0.5])).startsWith("192.168.")).toBe(true);
        // 172 block stays inside 16–31 across many rolls.
        for (let i = 0; i < 50; i++) {
            const value = ip("private", seq([0.5, i / 50, 0.5, 0.5]));
            const second = Number(value.split(".")[1]);
            expect(second).toBeGreaterThanOrEqual(16);
            expect(second).toBeLessThanOrEqual(31);
        }
    });
});

describe("email", () => {
    it("is local@domain", () => {
        const value = email({}, seq([0.1, 0.2, 0.3, 0.4]));
        expect(value).toMatch(/^[^@\s]+@[^@\s]+$/);
    });

    it("reuses first and last name when given", () => {
        const value = email({ firstName: "John", lastName: "Noble" }, seq([0.0, 0.0]));
        expect(value.toLowerCase()).toContain("john");
        expect(value.toLowerCase()).toContain("noble");
    });

    it("uses a company domain when a company is in scope", () => {
        const value = email(
            { firstName: "Ada", lastName: "Vega", company: "Meridian Capital" },
            seq([0.0, 0.0]),
        );
        expect(value).toContain("meridian-capital");
        // Not a personal provider.
        for (const p of MAIL_PROVIDERS) expect(value.endsWith(p)).toBe(false);
    });

    it("falls back to a personal provider without a company", () => {
        const value = email({ firstName: "Ada", lastName: "Vega" }, seq([0.0, 0.0]));
        expect(MAIL_PROVIDERS.some((p) => value.endsWith(p))).toBe(true);
    });
});

describe("username", () => {
    it("is lowercase and space-free", () => {
        const value = username({ firstName: "John", lastName: "Noble" }, seq([0.2]));
        expect(value).toBe(value.toLowerCase());
        expect(value).not.toContain(" ");
    });
});

describe("serviceVersion", () => {
    it("ends in a three-number version with no letters — the metasploit rule", () => {
        for (let i = 0; i < SERVICE_BANNERS.length; i++) {
            const value = serviceVersion(seq([i / SERVICE_BANNERS.length]));
            const version = value.split(" ").pop()!;
            expect(version).toMatch(/^\d+\.\d+\.\d+$/);
        }
    });
});

describe("hostname", () => {
    it("has no spaces or uppercase", () => {
        const value = hostname(seq([0.1, 0.5]));
        expect(value).toBe(value.toLowerCase());
        expect(value).not.toContain(" ");
    });
});

describe("iban", () => {
    it("starts with a two-letter country code", () => {
        expect(iban(seq([0.1, 0.2, 0.3]))).toMatch(/^[A-Z]{2}/);
    });
});

describe("determinism", () => {
    it("same rng yields same output", () => {
        expect(generateField("email", { firstName: "A", lastName: "B" }, {}, seq([0.3, 0.4]))).toBe(
            generateField("email", { firstName: "A", lastName: "B" }, {}, seq([0.3, 0.4])),
        );
    });
});

describe("wordlists", () => {
    it("are non-empty and de-duplicated", () => {
        for (const list of [FIRST_NAMES, LAST_NAMES, MAIL_PROVIDERS, SERVICE_BANNERS]) {
            expect(list.length).toBeGreaterThan(0);
            expect(new Set(list).size).toBe(list.length);
        }
    });
});
