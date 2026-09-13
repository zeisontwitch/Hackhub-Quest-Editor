/**
 * r155: the vulnerability dropdown shows "TYPE (what it means)" — descriptions
 * are display-only, so the option values stay the raw enum and exports are
 * byte-identical.
 */
import { describe, expect, it } from "vitest";
import { VULNERABILITY_BLURBS, VULNERABILITY_TYPES } from "../common";
import { FIELD_GROUPS } from "../registry";

describe("vulnerability labels", () => {
    it("describes every weakness type in gamer words", () => {
        expect(Object.keys(VULNERABILITY_BLURBS).sort()).toEqual([...VULNERABILITY_TYPES].sort());
        for (const [type, blurb] of Object.entries(VULNERABILITY_BLURBS)) {
            expect(blurb.length, `${type} needs a description`).toBeGreaterThan(3);
        }
    });

    it("renders TYPE (description) options with raw-enum values", () => {
        const fields = FIELD_GROUPS.vulnerabilities.fields as unknown as {
            key?: string;
            options: { value: string; label: string }[];
        }[];
        const typeField = fields.find((f) => f.key === "type")!;
        expect(typeField.options).toHaveLength(VULNERABILITY_TYPES.length);
        for (const t of VULNERABILITY_TYPES) {
            const opt = typeField.options.find((o) => o.value === t);
            expect(opt, `missing option for ${t}`).toBeDefined();
            expect(opt!.label).toBe(`${t} (${VULNERABILITY_BLURBS[t]})`);
        }
    });
});
