/**
 * The auto-generate (dice) button, wired through the registry Field engine (r161).
 *
 * The generators' own output shapes are proven in lib/generate; here we prove
 * the wiring: a field with a `generate` descriptor renders a dice, clicking it
 * writes a value of the right shape through the store (so it lands in undo), a
 * field carrying both `tokens` and `generate` shows two buttons, and a
 * reuse-aware field reads its siblings.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Field } from "@/editor/inspector/Field";
import { makeNode } from "@/templates/kit";
import { createProject, createQuest } from "@/schema/project";
import { nodeTypeDef } from "@/schema/registry";
import type { FieldDef } from "@/schema/registry";
import { getPath, useEditor } from "@/store/editor";

function loadWith(nodes: ReturnType<typeof makeNode>[]) {
    const quest = createQuest({
        id: "q-gen",
        name: "Gen",
        closingObjectiveText: "done",
        title: "Gen",
        autoStart: true,
        description: "gen",
        rewards: { money: 0, xp: 0 },
    });
    quest.graph = { nodes, edges: [] };
    const project = createProject({
        mod: { id: "gen-mod", name: "Gen", version: "1.0.0", author: "", description: "gen", tags: [], dependencies: [], minSdkVersion: "0.21.0", apiVersion: 1 },
        quests: [quest],
        websites: [],
    });
    act(() => {
        useEditor.getState().load(project, { clearHistory: true });
        useEditor.getState().setActiveQuest(project.quests[0].id);
    });
}

function fieldDef(type: Parameters<typeof nodeTypeDef>[0], key: string): FieldDef {
    const def = nodeTypeDef(type).fields.find((f) => "key" in f && f.key === key);
    if (!def) throw new Error(`no field ${key} on ${type}`);
    return def;
}

function nodeData(id: string): unknown {
    const state = useEditor.getState();
    const quest = state.project.quests.find((q) => q.id === state.project.editor.activeQuestId);
    return quest?.graph.nodes.find((n) => n.id === id)?.data;
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("generate (dice) button", () => {
    it("renders a dice on a field with a generate descriptor and writes a value", () => {
        const db = makeNode("world.database", { x: 0, y: 0 }, { host: "", user: "" });
        loadWith([db]);
        render(<Field def={fieldDef("world.database", "user")} nodeId={db.id} />);

        fireEvent.click(screen.getByRole("button", { name: /Generate username/ }));
        const user = getPath(nodeData(db.id), "user");
        expect(typeof user).toBe("string");
        expect(String(user).length).toBeGreaterThan(0);
        expect(String(user)).toBe(String(user).toLowerCase());
    });

    it("generates a public IP for a host field", () => {
        const db = makeNode("world.database", { x: 0, y: 0 }, { host: "", user: "" });
        loadWith([db]);
        render(<Field def={fieldDef("world.database", "host")} nodeId={db.id} />);

        fireEvent.click(screen.getByRole("button", { name: /Generate IP address/ }));
        const host = String(getPath(nodeData(db.id), "host"));
        expect(host).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
        // Public: not a private first octet.
        expect([10, 172, 192]).not.toContain(Number(host.split(".")[0]));
    });

    it("shows both the tag and the dice on a field that offers both", () => {
        const db = makeNode("world.database", { x: 0, y: 0 }, { host: "", user: "" });
        loadWith([db]);
        render(<Field def={fieldDef("world.database", "host")} nodeId={db.id} />);
        // Host is `tokens: true` and `generate` — sparkle plus dice.
        expect(screen.getByRole("button", { name: "Insert a tag" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Generate IP address/ })).toBeInTheDocument();
    });

    it("does not render a dice on a field without a descriptor", () => {
        const db = makeNode("world.database", { x: 0, y: 0 }, { host: "", user: "", password: "" });
        loadWith([db]);
        render(<Field def={fieldDef("world.database", "password")} nodeId={db.id} />);
        expect(screen.queryByRole("button", { name: /Generate/ })).not.toBeInTheDocument();
    });

    it("reuses the first and last name beside an e-mail field", () => {
        // A wifi router account row: username/first/last/email share a base path.
        const wifi = makeNode("world.wifi", { x: 0, y: 0 }, {
            ssid: "NET",
            password: "pw",
            users: [{ id: "u1", username: "admin", firstName: "John", lastName: "Noble", emailAddress: "" }],
        });
        loadWith([wifi]);
        const usersList = nodeTypeDef("world.wifi").fields.find(
            (f) => "key" in f && f.key === "users",
        );
        if (!usersList || usersList.kind !== "list") throw new Error("no users list");
        const emailDef = usersList.fields.find((f) => "key" in f && f.key === "emailAddress")!;
        render(<Field def={emailDef} nodeId={wifi.id} basePath="users.0" />);

        fireEvent.click(screen.getByRole("button", { name: /Generate e-mail/ }));
        const email = String(getPath(nodeData(wifi.id), "users.0.emailAddress")).toLowerCase();
        // The local part is built from the sibling name(s). Which style is picked
        // is random, but every one draws on the first or last name, so a reused
        // address always carries at least one of them (never an unrelated name).
        expect(email).toMatch(/john|noble/);
        expect(email).toContain("@");
    });
});
