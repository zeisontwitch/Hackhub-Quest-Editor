/**
 * Node-card copy and the small pieces of editor memory around it: what each
 * card says at a glance, and tags the author invents being offered back in the
 * next mod.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { summarize } from "@/editor/canvas/summarize";
import { forgetTag, rememberTags, rememberedTags } from "@/lib/tagMemory";
import type { NodeDoc } from "@/schema/nodes";

describe("sequence card", () => {
    it("reads out the outputs and the total run time", () => {
        const node = {
            id: "s1",
            type: "flow.sequence",
            position: { x: 0, y: 0 },
            data: {
                steps: [
                    { id: "a", label: "Lights out", delayMs: 0 },
                    { id: "b", label: "Sirens", delayMs: 1500 },
                ],
            },
        } as NodeDoc;
        const lines = summarize(node);
        expect(lines[0]).toBe("2 outputs, in order");
        expect(lines[1]).toBe("Lights out → Sirens");
        expect(lines[2]).toBe("1500 ms end to end");
    });

    it("says plainly when it has no outputs yet", () => {
        const node = {
            id: "s2",
            type: "flow.sequence",
            position: { x: 0, y: 0 },
            data: { steps: [] },
        } as NodeDoc;
        expect(summarize(node)).toEqual(["no outputs yet"]);
    });
});

describe("trigger card", () => {
    it("names the event in words, not in code", () => {
        const node = {
            id: "t1",
            type: "trigger.event",
            position: { x: 0, y: 0 },
            data: { event: "Terminal.NmapScan", conditions: [] },
        } as NodeDoc;
        expect(summarize(node)[0]).toBe("Terminal: Nmap scan");
    });
});

describe("tag memory", () => {
    beforeEach(() => localStorage.clear());

    it("remembers tags across projects, most recent first", () => {
        rememberTags(["dockyards", "night shift"]);
        rememberTags(["heist"]);
        expect(rememberedTags()).toEqual(["heist", "dockyards", "night shift"]);
    });

    it("never stores a tag twice and can forget one", () => {
        rememberTags(["heist", "heist", " heist "]);
        expect(rememberedTags()).toEqual(["heist"]);
        expect(forgetTag("heist")).toEqual([]);
        expect(rememberedTags()).toEqual([]);
    });

    it("survives storage being unavailable", () => {
        const original = localStorage.setItem;
        localStorage.setItem = () => {
            throw new Error("quota");
        };
        expect(() => rememberTags(["boom"])).not.toThrow();
        localStorage.setItem = original;
    });
});
