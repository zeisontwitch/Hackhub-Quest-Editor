/**
 * Per-field warnings: the "this value is filled but won't work until X is one
 * node up" signals an author sees beside the field they are editing.
 */
import { describe, expect, it } from "vitest";
import { fieldWarnings } from "@/analysis/fields";
import { createQuest } from "@/schema/project";
import { makeNode } from "@/templates/kit";

function questWith(...nodes: ReturnType<typeof makeNode>[]): ReturnType<typeof createQuest> {
    const quest = createQuest({
        id: "q-warn",
        name: "WarnTest",
        closingObjectiveText: "done",
        title: "Warn Test",
        autoStart: true,
        description: "warnings",
        rewards: { money: 0, xp: 0 },
    });
    quest.graph = { nodes, edges: [] };
    return quest;
}

describe("fieldWarnings", () => {
    it("warns on a Change port with an IP but no network node in the quest", () => {
        const port = makeNode("world.port", { x: 0, y: 0 }, { ip: "45.33.32.156", port: { external: 22, internal: 22, active: true, service: "ssh" } });
        const quest = questWith(port);
        const warnings = fieldWarnings(quest, port);
        expect(warnings.some((w) => w.path === "ip")).toBe(true);
        expect(warnings.find((w) => w.path === "ip")!.nextStep).toMatch(/Create network/i);
    });

    it("does not warn on a Change port with an IP when a network node exists", () => {
        const port = makeNode("world.port", { x: 0, y: 0 }, { ip: "45.33.32.156", port: { external: 22, internal: 22, active: true, service: "ssh" } });
        const network = makeNode("world.network", { x: 100, y: 0 });
        const quest = questWith(port, network);
        const warnings = fieldWarnings(quest, port);
        expect(warnings.some((w) => w.path === "ip")).toBe(false);
    });

    it("warns on a device-targeted Seed files with no network in the quest", () => {
        const files = makeNode("world.files", { x: 0, y: 0 }, { target: "device", ip: "45.33.32.156", files: [] });
        const quest = questWith(files);
        const warnings = fieldWarnings(quest, files);
        expect(warnings.some((w) => w.path === "ip")).toBe(true);
    });

    it("does not warn on a player-targeted Seed files", () => {
        const files = makeNode("world.files", { x: 0, y: 0 }, { target: "player", ip: "", files: [] });
        const quest = questWith(files);
        expect(fieldWarnings(quest, files)).toEqual([]);
    });

    it("flags an objective nothing can trigger, with a next step", () => {
        const objective = makeNode("objective", { x: 0, y: 0 }, { name: "Break in", description: "x" });
        const quest = questWith(objective);
        const warnings = fieldWarnings(quest, objective);
        const banner = warnings.find((w) => w.path === "");
        expect(banner).toBeDefined();
        expect(banner!.severity).toBe("danger");
        expect(banner!.nextStep).toMatch(/When event/i);
    });

    it("clears the objective warning once a trigger is wired to it", () => {
        const objective = makeNode("objective", { x: 0, y: 0 }, { name: "Break in", description: "x" });
        const trigger = makeNode("trigger.event", { x: 100, y: 0 });
        const quest = questWith(objective, trigger);
        quest.graph.edges = [makeEdgeTo(trigger, "when", objective, "trigger")];
        expect(fieldWarnings(quest, objective).some((w) => w.path === "")).toBe(false);
    });
});

function makeEdgeTo(
    source: ReturnType<typeof makeNode>,
    sourceHandle: string,
    target: ReturnType<typeof makeNode>,
    targetHandle: string,
): import("@/schema/edges").EdgeDoc {
    return {
        id: `e-${source.id}-${target.id}`,
        source: source.id,
        sourceHandle,
        target: target.id,
        targetHandle,
        kind: "condition",
    };
}
