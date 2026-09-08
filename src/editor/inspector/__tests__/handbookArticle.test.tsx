/**
 * The handbook article picker: known in-game pages in a dropdown, any other
 * article id typed freehand.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Field } from "@/editor/inspector/Field";
import { makeNode } from "@/templates/kit";
import { createProject, createQuest } from "@/schema/project";
import { nodeTypeDef } from "@/schema/registry";
import { HANDBOOK_ARTICLES } from "@/schema/handbookArticles";
import { useEditor } from "@/store/editor";

function loadWith(nodes: ReturnType<typeof makeNode>[]) {
    const quest = createQuest({
        id: "q-hb",
        name: "Hb",
        closingObjectiveText: "done",
        title: "Hb",
        autoStart: true,
        description: "hb",
        rewards: { money: 0, xp: 0 },
    });
    quest.graph = { nodes, edges: [] };
    const project = createProject({
        mod: { id: "hb-mod", name: "Hb", version: "1.0.0", author: "", description: "hb", tags: [], dependencies: [], minSdkVersion: "0.21.0", apiVersion: 1 },
        quests: [quest],
        websites: [],
    });
    act(() => {
        useEditor.getState().load(project, { clearHistory: true });
        useEditor.getState().setActiveQuest(project.quests[0].id);
    });
}

function storedArticle(nodeId: string): unknown {
    const node = useEditor
        .getState()
        .project.quests[0].graph.nodes.find((n) => n.id === nodeId);
    return (node!.data as { articleId: unknown }).articleId;
}

const articleDef = nodeTypeDef("fx.handbook").fields.find((f) => "key" in f && f.key === "articleId")!;

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("handbook article picker", () => {
    it("lists the known pages and writes the picked id", () => {
        const hb = makeNode("fx.handbook", { x: 0, y: 0 }, {});
        loadWith([hb]);
        render(<Field def={articleDef} nodeId={hb.id} />);
        const select = screen.getByLabelText("Article") as HTMLSelectElement;
        for (const a of HANDBOOK_ARTICLES) {
            expect(
                [...select.options].some((o) => o.value === a.id && o.label === a.title),
                a.title,
            ).toBe(true);
        }
        fireEvent.change(select, { target: { value: "Router Fields Explained" } });
        expect(storedArticle(hb.id)).toBe("Router Fields Explained");
    });

    it("takes any other id as custom", () => {
        const hb = makeNode("fx.handbook", { x: 0, y: 0 }, {});
        loadWith([hb]);
        render(<Field def={articleDef} nodeId={hb.id} />);
        fireEvent.change(screen.getByLabelText("Article"), { target: { value: "__custom__" } });
        fireEvent.change(screen.getByLabelText("Article (custom)"), {
            target: { value: "some-future-page" },
        });
        expect(storedArticle(hb.id)).toBe("some-future-page");
    });
});
