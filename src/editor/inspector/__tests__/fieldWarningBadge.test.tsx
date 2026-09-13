/**
 * The field-level warning badge: a red ⚠ appears on a field whose current value
 * cannot work, and disappears when the graph supplies what it needs.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Field } from "@/editor/inspector/Field";
import { makeNode } from "@/templates/kit";
import { createProject, createQuest } from "@/schema/project";
import { useEditor } from "@/store/editor";

function loadWith(nodes: ReturnType<typeof makeNode>[]) {
    const quest = createQuest({
        id: "q-warn",
        name: "Warn",
        closingObjectiveText: "done",
        title: "Warn",
        autoStart: true,
        description: "warn",
        rewards: { money: 0, xp: 0 },
    });
    quest.graph = { nodes, edges: [] };
    const project = createProject({
        mod: { id: "warn-mod", name: "Warn", version: "1.0.0", author: "", description: "warn", tags: [], dependencies: [], minSdkVersion: "0.21.0", apiVersion: 1 },
        quests: [quest],
        websites: [],
    });
    act(() => {
        useEditor.getState().load(project, { clearHistory: true });
        useEditor.getState().setActiveQuest(project.quests[0].id);
    });
}

const ipField = { kind: "text" as const, key: "ip", label: "Device IP", hint: "A machine on the network." };

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("field warning badge", () => {
    it("shows a ⚠ on a filled Device IP when no network node exists", () => {
        const port = makeNode("world.port", { x: 0, y: 0 }, { ip: "45.33.32.156", port: { id: "p1", external: 22, internal: 22, active: true, service: "ssh" } });
        loadWith([port]);
        render(<Field def={ipField} nodeId={port.id} />);
        const badge = screen.getByRole("button", { name: /warning:/i });
        expect(badge).toBeInTheDocument();
        expect(badge.getAttribute("aria-label")).toMatch(/Create network/i);
    });

    it("hides the ⚠ when a network node is present", () => {
        const port = makeNode("world.port", { x: 0, y: 0 }, { ip: "45.33.32.156", port: { id: "p1", external: 22, internal: 22, active: true, service: "ssh" } });
        const network = makeNode("world.network", { x: 100, y: 0 });
        loadWith([port, network]);
        render(<Field def={ipField} nodeId={port.id} />);
        expect(screen.queryByRole("button", { name: /warning:/i })).not.toBeInTheDocument();
    });
});
