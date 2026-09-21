/**
 * The Hackhub feed-post section on the quest tab (r215): the feed start route
 * becomes authorable. The toggle IS the field's presence (hackhubPost is
 * registration data — no post, no feed entry), blank name/avatar means the
 * game generates the persona, and comments are a hand-built list like the
 * Twotter node's.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InspectorPanel } from "@/editor/inspector/InspectorPanel";
import { createProject, createQuest } from "@/schema/project";
import { useEditor } from "@/store/editor";

/** The Toggle primitive has no accessible name (label is not wired), so the
    click targets the switch inside the row that carries the label text — the
    same approach the sims test uses. */
function toggleRow(label: RegExp): HTMLElement {
    const row = screen.getAllByText(label)[0].closest("div.flex")!;
    const btn = row.querySelector("button");
    if (!btn) throw new Error("no switch in row: " + label);
    return btn;
}

function loadQuest(quest: ReturnType<typeof createQuest>) {
    const project = createProject({
        mod: { id: "feed-mod", name: "Feed", version: "1.0.0", author: "", description: "feed", tags: [], dependencies: [], minSdkVersion: "0.21.0", apiVersion: 1 },
        quests: [quest],
        websites: [],
    });
    act(() => {
        useEditor.getState().load(project, { clearHistory: true });
        useEditor.getState().setActiveQuest(project.quests[0].id);
    });
}

function currentQuest() {
    return useEditor.getState().project!.quests[0];
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("the Hackhub feed post section", () => {
    it("writes a blank post when toggled on, and removes it when toggled off", async () => {
        const user = userEvent.setup();
        loadQuest(createQuest({ name: "FeedQ", title: "Feed Q", closingObjectiveText: "done", description: "d" }));
        render(<InspectorPanel />);

        await user.click(toggleRow(/Post this quest to the Hackhub feed/));
        expect(currentQuest().hackhubPost).toBeDefined();
        expect(currentQuest().hackhubPost!.content).toBe("");

        await user.click(toggleRow(/Post this quest to the Hackhub feed/));
        expect(currentQuest().hackhubPost).toBeUndefined();
    });

    it("fills the poster name from the dice and keeps the avatar clear for the game persona", async () => {
        const user = userEvent.setup();
        loadQuest(createQuest({ name: "FeedQ", title: "Feed Q", closingObjectiveText: "done", description: "d" }));
        render(<InspectorPanel />);
        await user.click(toggleRow(/Post this quest to the Hackhub feed/));

        await user.click(screen.getByRole("button", { name: /Generate full name/ }));
        const name = currentQuest().hackhubPost!.authorName ?? "";
        expect(name.length).toBeGreaterThan(2);
        expect(name).not.toMatch(/^(firstName|lastName)/);

        await user.type(screen.getByLabelText("Hackhub post text"), "Small job, good pay.");
        expect(currentQuest().hackhubPost!.content).toBe("Small job, good pay.");
        expect(currentQuest().hackhubPost!.authorAvatar).toBeUndefined();
    });

    it("adds and fills comments", async () => {
        const user = userEvent.setup();
        loadQuest(createQuest({ name: "FeedQ", title: "Feed Q", closingObjectiveText: "done", description: "d" }));
        render(<InspectorPanel />);
        await user.click(toggleRow(/Post this quest to the Hackhub feed/));

        await user.click(screen.getByRole("button", { name: /Add a comment/ }));
        expect(currentQuest().hackhubPost!.comments).toHaveLength(1);

        await user.type(screen.getByLabelText("Comment 1 author"), "Skeptical Dev");
        await user.type(screen.getByLabelText("Comment 1 text"), "pics or it didn't happen");
        const c = currentQuest().hackhubPost!.comments![0];
        expect(c.authorName).toBe("Skeptical Dev");
        expect(c.content).toBe("pics or it didn't happen");
        expect(c.authorAvatar).toBeUndefined();

        await user.click(screen.getByRole("button", { name: /Remove comment 1/ }));
        expect(currentQuest().hackhubPost!.comments).toHaveLength(0);
    });
});
