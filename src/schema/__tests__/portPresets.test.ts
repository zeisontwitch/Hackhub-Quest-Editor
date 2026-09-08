import { describe, expect, it } from "vitest";
import { PORT_PRESETS } from "../portPresets";

describe("port presets", () => {
    it("covers the quest author's daily dozen, keyed by port", () => {
        const ports = PORT_PRESETS.map((p) => p.external);
        for (const expected of [22, 21, 80, 3306, 25, 110, 143]) {
            expect(ports, `missing preset for port ${expected}`).toContain(expected);
        }
    });

    it("fills a version the exploit chain can match, or leaves it blank", () => {
        for (const p of PORT_PRESETS) {
            if (p.version === "") continue;
            // Metasploit rejects two-part versions (r49), so every preset
            // version must carry three numbers.
            expect(p.version, `${p.label}: version needs three numbers`).toMatch(/\d+\.\d+\.\d+/);
        }
    });

    it("uses real-world-standard port numbers and game-style services", () => {
        const standard: Record<string, number> = {
            ssh: 22,
            ftp: 21,
            smtp: 25,
            pop3: 110,
            imap: 143,
            mysql: 3306,
        };
        for (const p of PORT_PRESETS) {
            expect(p.external, `${p.label}: out of range`).toBeGreaterThanOrEqual(1);
            expect(p.external, `${p.label}: out of range`).toBeLessThanOrEqual(65535);
            expect(p.internal, `${p.label}: internal should equal external`).toBe(p.external);
            expect(p.service, `${p.label}: service should be lowercase`).toBe(p.service.toLowerCase());
            const expected = standard[p.service];
            if (expected !== undefined) {
                expect(p.external, `${p.label}: wrong standard port`).toBe(expected);
            }
        }
        // Web servers report service `http` whatever the server is.
        for (const p of PORT_PRESETS.filter((x) => x.id.startsWith("http-"))) {
            expect(p.external).toBe(80);
            expect(p.service).toBe("http");
        }
    });

    it("has unique ids and labels", () => {
        const ids = PORT_PRESETS.map((p) => p.id);
        const labels = PORT_PRESETS.map((p) => p.label);
        expect(new Set(ids).size).toBe(ids.length);
        expect(new Set(labels).size).toBe(labels.length);
    });
});
