/**
 * A smoke test for the shell: render the whole editor, click around it, and
 * confirm the store moves. This is the only test that exercises React, React Flow
 * and the inspector together, so it catches integration breakage that the pure
 * schema/store suites cannot see.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { useEditor } from "@/store/editor";
import { selectActiveQuest } from "@/store/editor";
import { createProject } from "@/schema/project";

beforeEach(() => {
    localStorage.clear();
    act(() => {
        // A brand-new project: one quest, empty graph — what a first-time visitor
        // sees, and the state the first-run hint is written for.
        useEditor.getState().load(createProject(), { clearHistory: true });
    });
});

afterEach(() => {
    localStorage.clear();
});

describe("editor shell", () => {
    it("renders the top bar, palette, canvas and inspector", async () => {
        render(<App />);

        expect(screen.getByText("Quest Mod Editor")).toBeInTheDocument();
        expect(screen.getByRole("navigation", { name: "Quests" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Export mod" })).toBeInTheDocument();

        // Every category is offered in the palette.
        const palette = screen.getByRole("complementary", { name: "Node library" });
        const names = within(palette)
            .getAllByRole("heading")
            .map((h) => h.textContent);
        expect(names).toEqual(
            expect.arrayContaining([
                "Quest lifecycle",
                "Objectives",
                "Triggers",
                "World building",
                "Communication",
                "Player replies",
                "Effects",
                "Flow control",
            ]),
        );
        expect(screen.getByRole("complementary", { name: "Inspector" })).toBeInTheDocument();

        // The empty canvas explains itself instead of showing a blank grid.
        expect(screen.getByText("Build a HackHub quest")).toBeInTheDocument();
    });

    it("adds a node when a palette entry is clicked", async () => {
        const user = userEvent.setup();
        render(<App />);

        const before = selectActiveQuest(useEditor.getState())!.graph.nodes.length;
        await user.click(screen.getByRole("button", { name: /^Notify$/i }));

        const quest = selectActiveQuest(useEditor.getState())!;
        expect(quest.graph.nodes).toHaveLength(before + 1);
        expect(quest.graph.nodes.at(-1)?.type).toBe("fx.notify");
        // Adding a node is a real edit, so it is undoable.
        expect(useEditor.getState().past.length).toBeGreaterThan(0);
    });

    it("shows a node's fields when it is selected", async () => {
        const user = userEvent.setup();
        render(<App />);

        await user.click(screen.getByRole("button", { name: /^Notify$/i }));
        const added = selectActiveQuest(useEditor.getState())!.graph.nodes.at(-1)!;
        act(() => {
            useEditor.getState().select({ nodeIds: [added.id], edgeIds: [] });
        });

        // The inspector follows the selection and offers the node's own fields.
        const inspector = screen.getByRole("complementary", { name: "Inspector" });
        expect(await within(inspector).findByRole("heading", { name: "Notify" })).toBeInTheDocument();
        expect(within(inspector).getByRole("textbox", { name: "Message" })).toBeInTheDocument();
        expect(within(inspector).getByRole("combobox", { name: "Style" })).toBeInTheDocument();
        expect(within(inspector).getByRole("combobox", { name: "Tone" })).toBeInTheDocument();
    });

    it("edits node data through the inspector", async () => {
        const user = userEvent.setup();
        render(<App />);

        await user.click(screen.getByRole("button", { name: /^Notify$/i }));
        const added = selectActiveQuest(useEditor.getState())!.graph.nodes.at(-1)!;
        act(() => {
            useEditor.getState().select({ nodeIds: [added.id], edgeIds: [] });
        });

        const inspector = screen.getByRole("complementary", { name: "Inspector" });
        const message = await within(inspector).findByRole("textbox", { name: "Message" });
        await user.clear(message);
        await user.type(message, "hello world");

        const updated = selectActiveQuest(useEditor.getState())!.graph.nodes.find((n) => n.id === added.id)!;
        expect((updated.data as { message: string }).message).toBe("hello world");
    });

    it("opens the template gallery and can replace the project", async () => {
        const user = userEvent.setup();
        render(<App />);

        await user.click(screen.getByRole("button", { name: /^Templates$/i }));
        expect(await screen.findByRole("heading", { name: "Start from a template" })).toBeInTheDocument();

        // Share controls live in the same dialog.
        expect(screen.getByRole("button", { name: /export current quest/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /import a quest file/i })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /Simple Linear Wi-Fi Hack/i }));

        const quest = selectActiveQuest(useEditor.getState())!;
        expect(quest.name).toBe("NeighbourWifi");
        expect(quest.graph.nodes).toHaveLength(11);
    });

    it("undoes with the keyboard", async () => {
        const user = userEvent.setup();
        render(<App />);

        const before = selectActiveQuest(useEditor.getState())!.graph.nodes.length;
        await user.click(screen.getByRole("button", { name: /^Notify$/i }));
        expect(selectActiveQuest(useEditor.getState())!.graph.nodes).toHaveLength(before + 1);

        await user.keyboard("{Control>}z{/Control}");
        expect(selectActiveQuest(useEditor.getState())!.graph.nodes).toHaveLength(before);
    });

    it("hangs an explanation off every labelled field", async () => {
        const user = userEvent.setup();
        render(<App />);

        await user.click(screen.getByRole("button", { name: /^Manual input$/i }));
        const added = selectActiveQuest(useEditor.getState())!.graph.nodes.at(-1)!;
        act(() => {
            useEditor.getState().select({ nodeIds: [added.id], edgeIds: [] });
        });

        const inspector = screen.getByRole("complementary", { name: "Inspector" });
        const labels = await within(inspector).findAllByRole("button", {
            name: /^What does “.+” do\?$/,
        });

        // Radix will not open a tooltip under jsdom, so this asserts the wiring
        // rather than the popup. That every field has a hint at all is covered by
        // the registry suite, which is the guarantee that actually matters.
        expect(labels.length).toBeGreaterThanOrEqual(6);
        expect(labels.map((l) => l.getAttribute("aria-label"))).toContain(
            'What does “Expected answer” do?',
        );
    });

    it("rearranges the canvas with Tidy up", async () => {
        const user = userEvent.setup();
        render(<App />);

        await user.click(screen.getByRole("button", { name: /^Notify$/i }));
        const added = selectActiveQuest(useEditor.getState())!.graph.nodes.at(-1)!;
        act(() => {
            useEditor.getState().updateNodeData(added.id, {});
            useEditor.getState().setNodePositions({ [added.id]: { x: -9999, y: -9999 } });
        });

        await user.click(screen.getByRole("button", { name: /tidy up/i }));

        const moved = selectActiveQuest(useEditor.getState())!.graph.nodes.find(
            (nd) => nd.id === added.id,
        )!;
        expect(moved.position).not.toEqual({ x: -9999, y: -9999 });
        expect(moved.position.x).toBeGreaterThanOrEqual(0);
    });

    it("warns on the canvas about an objective with no trigger", async () => {
        const user = userEvent.setup();
        render(<App />);

        await user.click(screen.getByRole("button", { name: /^Objective$/i }));

        // The badge names the problem; the node itself carries the explanation.
        expect(await screen.findByText(/1 blocking/i)).toBeInTheDocument();
        expect(screen.getByText("No trigger")).toBeInTheDocument();
    });

    it("persists the draft to localStorage", async () => {
        const user = userEvent.setup();
        render(<App />);

        await user.click(screen.getByRole("button", { name: /^Notify$/i }));
        // Autosave is debounced; Ctrl+S flushes it synchronously.
        await user.keyboard("{Control>}s{/Control}");

        const raw = localStorage.getItem("hackhub-quest-editor:draft:v1");
        expect(raw).toBeTruthy();
        const parsed = JSON.parse(raw!);
        expect(parsed.quests[0].graph.nodes.length).toBe(
            selectActiveQuest(useEditor.getState())!.graph.nodes.length,
        );
    });
});
