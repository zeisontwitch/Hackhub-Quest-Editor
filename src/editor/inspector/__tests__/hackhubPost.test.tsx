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
        loadQuest(createQuest({ id: "q-blank", name: "FeedQ", title: "Feed Q", closingObjectiveText: "done", description: "d" }));
        render(<InspectorPanel />);

        await user.click(toggleRow(/Post this quest to the Hackhub feed/));
        expect(currentQuest().hackhubPost).toBeDefined();
        expect(currentQuest().hackhubPost!.content).toBe("");

        await user.click(toggleRow(/Post this quest to the Hackhub feed/));
        expect(currentQuest().hackhubPost).toBeUndefined();
    });

    it("starts anonymous (Hidden User), and flipping the toggle dice-generates a visible poster", async () => {
        const user = userEvent.setup();
        loadQuest(createQuest({ id: "q-blank", name: "FeedQ", title: "Feed Q", closingObjectiveText: "done", description: "d" }));
        render(<InspectorPanel />);
        await user.click(toggleRow(/Post this quest to the Hackhub feed/));

        /* A fresh post is anonymous: no author at all — the board shows the
           game's "Hidden User" and reveals the author on accept (r225's
           measured mechanic). The poster fields are hidden in this state. */
        expect(currentQuest().hackhubPost!.authorName).toBe("");
        expect(screen.queryByLabelText("Hackhub poster name")).toBeNull();

        /* Flipping Anonymous off dice-generates a name (so the post cannot
           silently regress to anonymous) and reveals the fields. */
        await user.click(toggleRow(/Anonymous poster/));
        const name = currentQuest().hackhubPost!.authorName ?? "";
        expect(name.length).toBeGreaterThan(2);
        expect(name).not.toMatch(/^(firstName|lastName)/);
        expect(screen.getByLabelText("Hackhub poster name")).toHaveValue(name);

        /* The poster dice still works on the revealed field. */
        await user.click(screen.getByRole("button", { name: /Generate full name/ }));
        expect((currentQuest().hackhubPost!.authorName ?? "").length).toBeGreaterThan(2);

        await user.type(screen.getByLabelText("Hackhub post text"), "Small job, good pay.");
        expect(currentQuest().hackhubPost!.content).toBe("Small job, good pay.");
    });

    it("the Anonymous toggle wipes a typed name/avatar back to the Hidden User route", async () => {
        const user = userEvent.setup();
        loadQuest(createQuest({ id: "q-blank", name: "FeedQ", title: "Feed Q", closingObjectiveText: "done", description: "d" }));
        render(<InspectorPanel />);
        await user.click(toggleRow(/Post this quest to the Hackhub feed/));
        await user.click(toggleRow(/Anonymous poster/)); // off: named poster
        await user.type(screen.getByLabelText("Hackhub poster name"), "Ugo Jansen");

        await user.click(toggleRow(/Anonymous poster/)); // on again
        expect(currentQuest().hackhubPost!.authorName).toBe("");
        expect(currentQuest().hackhubPost!.authorAvatar ?? "").toBe("");
        expect(screen.queryByLabelText("Hackhub poster name")).toBeNull();
    });

    it("adds and fills comments", async () => {
        const user = userEvent.setup();
        loadQuest(createQuest({ id: "q-blank", name: "FeedQ", title: "Feed Q", closingObjectiveText: "done", description: "d" }));
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

describe("the internal id row (r217)", () => {
    it("shows the id read-only, and regenerates it only after the confirm dialog", async () => {
        const user = userEvent.setup();
        loadQuest(createQuest({ id: "q-blank", name: "FeedQ", title: "Feed Q", closingObjectiveText: "done", description: "d" }));
        render(<InspectorPanel />);

        /* The editor's private key is visible — the r216 playtest shipped two
           quests that both still carried the blank-project placeholder,
           invisible to the author. */
        expect(screen.getByLabelText("Internal id")).toHaveValue("q-blank");

        await user.click(screen.getByRole("button", { name: /New id/ }));
        const confirm = await screen.findByText("Generate a new id");
        await user.click(confirm);

        const id = currentQuest().id;
        expect(id).toMatch(/^q-feedq-[0-9a-f]{4}$/);
        expect(screen.getByLabelText("Internal id")).toHaveValue(id);

        /* The store keeps working after the id swap (write targets the new id). */
        act(() => {
            useEditor.getState().updateQuest(id, { title: "Renamed after swap" });
        });
        expect(currentQuest().title).toBe("Renamed after swap");
    });

    it("keeps the id when the author backs out of the dialog", async () => {
        const user = userEvent.setup();
        loadQuest(createQuest({ id: "q-blank", name: "FeedQ", title: "Feed Q", closingObjectiveText: "done", description: "d" }));
        render(<InspectorPanel />);

        await user.click(screen.getByRole("button", { name: /New id/ }));
        await user.click(await screen.findByText(/Keep q-blank/));
        expect(currentQuest().id).toBe("q-blank");
    });
});

    it("the commenter name field has a dice button (r226)", async () => {
        const user = userEvent.setup();
        loadQuest(createQuest({ id: "q-blank", name: "FeedQ", title: "Feed Q", closingObjectiveText: "done", description: "d" }));
        render(<InspectorPanel />);
        await user.click(toggleRow(/Post this quest to the Hackhub feed/));

        /* Add a comment, then dice its author instead of typing. The FIRST
           Generate button on the page is the poster's — but the poster fields
           are hidden while anonymous, so index 0 is the commenter's. */
        await user.click(screen.getByRole("button", { name: /Add a comment/ }));
        await user.click(screen.getAllByRole("button", { name: /Generate full name/ })[0]);
        const c = (currentQuest().hackhubPost!.comments ?? [])[0];
        expect((c?.authorName ?? "").length).toBeGreaterThan(2);
    });
