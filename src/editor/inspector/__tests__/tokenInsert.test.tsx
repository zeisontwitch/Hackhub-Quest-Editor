/**
 * The tag picker: a sparkle button beside every tag-taking box, inserting
 * `{{…}}` tags at the caret — each tag saying what it produces.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { TokenTextInput } from "@/editor/inspector/TokenInsert";
import { Field } from "@/editor/inspector/Field";
import { makeNode } from "@/templates/kit";
import { createProject, createQuest } from "@/schema/project";
import { nodeTypeDef } from "@/schema/registry";
import { useEditor } from "@/store/editor";

function loadWith(nodes: ReturnType<typeof makeNode>[]) {
    const quest = createQuest({
        id: "q-tag",
        name: "Tag",
        closingObjectiveText: "done",
        title: "Tag",
        autoStart: true,
        description: "tag",
        rewards: { money: 0, xp: 0 },
    });
    quest.graph = { nodes, edges: [] };
    const project = createProject({
        mod: { id: "tag-mod", name: "Tag", version: "1.0.0", author: "", description: "tag", tags: [], dependencies: [], minSdkVersion: "0.21.0", apiVersion: 1 },
        quests: [quest],
        websites: [],
    });
    act(() => {
        useEditor.getState().load(project, { clearHistory: true });
        useEditor.getState().setActiveQuest(project.quests[0].id);
    });
}

const SUGGESTIONS = [
    { token: "{{data.hq}}", label: "hq", produces: "“10.0.0.5”", group: "Saved values" as const },
    { token: "{{player.username}}", label: "Player login", produces: "the player's login name", group: "Player" as const },
];

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("tag picker", () => {
    it("inserts the picked tag at the caret", () => {
        const onChange = vi.fn();
        render(
            <TokenTextInput
                ariaLabel="Command"
                value="nmap  -p 22"
                onChange={onChange}
                suggestions={SUGGESTIONS}
            />,
        );
        const box = screen.getByLabelText("Command") as HTMLInputElement;
        box.setSelectionRange(5, 5);
        fireEvent.click(screen.getByRole("button", { name: "Insert a tag" }));
        fireEvent.click(screen.getByRole("button", { name: /Player login/ }));
        expect(onChange).toHaveBeenCalledWith("nmap {{player.username}} -p 22");
    });

    it("says what each tag produces", () => {
        render(
            <TokenTextInput ariaLabel="Command" value="" onChange={() => {}} suggestions={SUGGESTIONS} />,
        );
        fireEvent.click(screen.getByRole("button", { name: "Insert a tag" }));
        expect(screen.getByText("the player's login name")).toBeInTheDocument();
        expect(screen.getByText("{{player.username}}")).toBeInTheDocument();
    });

    it("stays open while the list is scrolled", () => {
        render(
            <TokenTextInput ariaLabel="Command" value="" onChange={() => {}} suggestions={SUGGESTIONS} />,
        );
        fireEvent.click(screen.getByRole("button", { name: "Insert a tag" }));
        const panel = screen.getByRole("group", { name: "Tags you can insert" });
        fireEvent.scroll(panel);
        expect(screen.getByRole("group", { name: "Tags you can insert" })).toBeInTheDocument();
        expect(screen.getByText("{{player.username}}")).toBeInTheDocument();
    });

    it("stays open when the page behind it scrolls, and still closes on Escape", () => {
        render(
            <TokenTextInput ariaLabel="Command" value="" onChange={() => {}} suggestions={SUGGESTIONS} />,
        );
        fireEvent.click(screen.getByRole("button", { name: "Insert a tag" }));
        fireEvent.scroll(document);
        expect(screen.getByRole("group", { name: "Tags you can insert" })).toBeInTheDocument();
        fireEvent.keyDown(document, { key: "Escape" });
        expect(screen.queryByRole("group", { name: "Tags you can insert" })).not.toBeInTheDocument();
    });

    it("points at Set quest data when nothing is saved yet", () => {
        render(
            <TokenTextInput
                ariaLabel="Command"
                value=""
                onChange={() => {}}
                suggestions={SUGGESTIONS.filter((s) => s.group !== "Saved values")}
            />,
        );
        fireEvent.click(screen.getByRole("button", { name: "Insert a tag" }));
        expect(screen.getByText(/Set quest data/)).toBeInTheDocument();
    });

    it("offers another node's saved value in a quest-data Value box", () => {
        const first = makeNode("fx.setData", { x: 0, y: 0 }, { key: "hq", value: "10.0.0.5" });
        const second = makeNode("fx.setData", { x: 100, y: 0 }, { key: "note", value: "" });
        loadWith([first, second]);
        const valueDef = nodeTypeDef("fx.setData").fields.find((f) => "key" in f && f.key === "value")!;
        render(<Field def={valueDef} nodeId={second.id} />);
        fireEvent.click(screen.getByRole("button", { name: "Insert a tag" }));
        // The other node's key is offered; this node's own key is not.
        expect(screen.getByText("{{data.hq}}")).toBeInTheDocument();
        expect(screen.queryByText("{{data.note}}")).not.toBeInTheDocument();
    });

    it("offers tags in a choice-or-custom box that takes them", () => {
        const fw = makeNode("world.firewall", { x: 0, y: 0 }, {
            ip: "",
            rule: { id: "r", allowed: false, port: 22, source: "*" },
        });
        loadWith([fw]);
        const ipDef = nodeTypeDef("world.firewall").fields.find((f) => "key" in f && f.key === "ip")!;
        render(<Field def={ipDef} nodeId={fw.id} />);
        fireEvent.change(screen.getByLabelText("Protected IP"), { target: { value: "__custom__" } });
        fireEvent.click(screen.getByRole("button", { name: "Insert a tag" }));
        expect(screen.getByText("{{player.username}}")).toBeInTheDocument();
    });
});
