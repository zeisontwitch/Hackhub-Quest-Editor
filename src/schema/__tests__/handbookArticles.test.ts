import { describe, expect, it } from "vitest";
import { HANDBOOK_ARTICLES } from "../handbookArticles";

describe("handbook article catalogue", () => {
    it("lists every verified page exactly once", () => {
        expect(HANDBOOK_ARTICLES.length).toBeGreaterThanOrEqual(5);
        const ids = HANDBOOK_ARTICLES.map((a) => a.id);
        const titles = HANDBOOK_ARTICLES.map((a) => a.title);
        expect(new Set(ids).size).toBe(ids.length);
        expect(new Set(titles).size).toBe(titles.length);
        for (const a of HANDBOOK_ARTICLES) {
            expect(a.id.trim().length, "blank article id").toBeGreaterThan(0);
            expect(a.title.trim().length, "blank article title").toBeGreaterThan(0);
        }
    });
});
