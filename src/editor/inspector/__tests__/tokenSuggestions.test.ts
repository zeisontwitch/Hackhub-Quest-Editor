import { describe, expect, it } from "vitest";
import { listTokenSuggestions } from "../tokenSuggestions";

function questWith(nodes: { id: string; type: string; data: unknown }[]) {
    return { graph: { nodes } };
}

const setData = (id: string, key: string, value: string) => ({
    id,
    type: "fx.setData",
    data: { key, value },
});

describe("token suggestions", () => {
    it("lists saved values except the current node's own key", () => {
        const out = listTokenSuggestions(
            questWith([setData("a", "hq", "10.0.0.5"), setData("b", "name", "Ritter")]),
            "a",
        );
        const saved = out.filter((s) => s.group === "Saved values");
        expect(saved.map((s) => s.token)).toEqual(["{{data.name}}"]);
        expect(saved[0].produces).toContain("Ritter");
    });

    it("skips keys a tag cannot spell", () => {
        const out = listTokenSuggestions(
            questWith([
                setData("a", "", "blank"),
                setData("b", "a.b", "dotted"),
                setData("c", "ok", "fine"),
                setData("d", "ok", "duplicate"),
            ]),
            "zzz",
        );
        expect(out.filter((s) => s.group === "Saved values").map((s) => s.token)).toEqual([
            "{{data.ok}}",
        ]);
    });

    it("offers the network address only when a network exists", () => {
        const without = listTokenSuggestions(questWith([setData("a", "k", "v")]), "a");
        expect(without.some((s) => s.token === "{{data.targetIp}}")).toBe(false);
        for (const type of ["world.network", "world.wifi"]) {
            const withNet = listTokenSuggestions(
                questWith([{ id: "n", type, data: {} }]),
                "n",
            );
            expect(withNet.some((s) => s.token === "{{data.targetIp}}"), type).toBe(true);
        }
    });

    it("offers the wrapper router only when a network needs one", () => {
        const router = questWith([
            { id: "n", type: "world.network", data: { device: { type: "ROUTER" } } },
        ]);
        expect(listTokenSuggestions(router, "n").some((s) => s.token === "{{data.gatewayIp}}")).toBe(false);
        const lone = questWith([
            { id: "n", type: "world.network", data: { device: { type: "DEVICE" } } },
        ]);
        expect(listTokenSuggestions(lone, "n").some((s) => s.token === "{{data.gatewayIp}}")).toBe(true);
    });

    it("always offers the player and random tags, each saying what it produces", () => {
        const out = listTokenSuggestions(questWith([]), "zzz");
        for (const token of [
            "{{player.username}}",
            "{{player.ip}}",
            "{{player.email}}",
            "{{random.password}}",
            "{{random.username}}",
            "{{random.ip}}",
        ]) {
            const found = out.find((s) => s.token === token);
            expect(found, token).toBeDefined();
        }
        for (const s of out) {
            expect(s.token).toMatch(/^\{\{.+\}\}$/);
            expect(s.label.trim().length, s.token).toBeGreaterThan(0);
            expect(s.produces.trim().length, s.token).toBeGreaterThan(0);
        }
    });
});
