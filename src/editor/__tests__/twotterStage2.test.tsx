/**
 * Stage 2 — the whimsy (r188).
 *
 * Note for whoever edits these: `userEvent.tab()` inside a Radix dialog takes
 * ~35 SECONDS in jsdom (a focus-trap quirk; a plain tab with no editor open is
 * 32 ms). The commit path is the same one, so the tests blur the field directly.
 *
 * What a jsdom test can honestly hold:
 *  - the profile's ORDER (the game shows newest first; the node holds oldest
 *    first) and the age words the game uses ("a month ago", not "1 month ago"),
 *  - which parts of the mock profile turn into fields when clicked, and that
 *    clicking one writes through to the project,
 *  - that the node's preview does not claim a picture will be drawn,
 *  - that the one "posting" sweep is applied to the arrival row and dropped
 *    under `prefers-reduced-motion`.
 *
 * What it cannot: whether any of it LOOKS right. Pixels are Zeis's half.
 */
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { summarize } from "@/editor/canvas/summarize";
import { TwotterNodeEditor } from "@/editor/inspector/sims/TwotterNodeEditor";
import { TwotterPanelDialog } from "@/editor/twotter/TwotterPanel";
import { createProject, createTwotterAccount } from "@/schema/project";
import { profileOrder, tweetAgeLabel, tweetAgeMs, type TweetTime } from "@/schema/twotter";
import type { NodeOfType } from "@/schema/nodes";
import { useEditor } from "@/store/editor";

beforeEach(() => {
    localStorage.clear();
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

const ACCOUNT = {
    id: "acc-wren",
    handle: "wren_on_wire",
    displayName: "Wren Ackerly",
    bio: "Signal analyst. Mostly reposts.",
    avatar: "data:image/png;base64,AVATAR",
    banner: "data:image/png;base64,BANNER",
    verified: true,
    followers: 412,
    following: 96,
};

function addTweetNode(rows: Record<string, unknown>[]): NodeOfType<"comms.tweet"> {
    let id = "";
    act(() => {
        const created = createTwotterAccount(ACCOUNT);
        useEditor.getState().addTwotterAccount(created);
        id = useEditor.getState().addNode("comms.tweet", { x: 0, y: 0 })!;
        useEditor.getState().updateNodeData(id, {
            accountId: created.id,
            tweets: rows.map((row, i) => ({ id: `t${i + 1}`, ...row })),
        });
    });
    const quest = useEditor.getState().project.quests[0];
    return quest.graph.nodes.find((n) => n.id === id)! as NodeOfType<"comms.tweet">;
}

describe("tweet ages", () => {
    const row = (timeMode: "arrival" | "earlier", agoAmount = 1, agoUnit = "months"): TweetTime => ({
        timeMode,
        agoAmount,
        agoUnit,
    });

    it("words an age the way the game does — 'a month ago', not '1 month ago'", () => {
        expect(tweetAgeLabel(row("earlier", 1, "months"))).toBe("a month ago");
        expect(tweetAgeLabel(row("earlier", 3, "months"))).toBe("3 months ago");
        expect(tweetAgeLabel(row("earlier", 6, "weeks"))).toBe("6 weeks ago");
        expect(tweetAgeLabel(row("arrival"))).toBe("a few seconds ago");
    });

    /*
     * Honest note: the tie half of this test cannot go red on its own. Array
     * sorts are stable, so removing `|| a.index - b.index` from `profileOrder`
     * returns the same list. The comparator keeps the rule stated in the code
     * (and survives anyone later routing this through a non-stable path); the
     * ORDERING half is the part a revert breaks, and it does break it.
     */
    it("orders the profile newest first, and keeps the author's order on a tie", () => {
        const rows = [
            { id: "year", ...row("earlier", 1, "years") },
            { id: "week", ...row("earlier", 1, "weeks") },
            { id: "day-a", ...row("earlier", 1, "days") },
            { id: "day-b", ...row("earlier", 1, "days") },
            { id: "now", ...row("arrival") },
        ];
        expect(profileOrder(rows).map((r) => r.row.id)).toEqual(["now", "day-a", "day-b", "week", "year"]);
        // and the raw ordering the preview sorts on agrees
        expect(tweetAgeMs(rows[4]!)).toBe(0);
        expect(tweetAgeMs(rows[1]!)).toBeGreaterThan(0);
    });
});

describe("the canvas card", () => {
    it("says how many tweets there are and quotes the oldest, in the author's order", () => {
        const node = addTweetNode([
            { content: "The relay went down on Tuesday.", timeMode: "earlier", agoAmount: 3, agoUnit: "months" },
            { content: "Back on the wire.", timeMode: "arrival" },
        ]);
        const lines = summarize(node, useEditor.getState().project.quests[0], [
            { id: "acc-wren", handle: "wren_on_wire" },
        ]);
        expect(lines[0]).toBe("@wren_on_wire");
        expect(lines[1]).toContain("2 tweets, oldest first");
        expect(lines[1]).toContain("“The relay went down on Tuesday.”");
        expect(lines[1]).toContain("3 months ago");
        // and a single tweet is quoted too, with its arrival wording
        const one = addTweetNode([{ content: "Back on the wire.", timeMode: "arrival" }]);
        const single = summarize(one, useEditor.getState().project.quests[0], [
            { id: "acc-wren", handle: "wren_on_wire" },
        ]);
        expect(single[1]).toBe("“Back on the wire.” — posts on arrival");
    });
});

describe("the node inspector", () => {
    const renderNode = () => {
        const node = addTweetNode([
            { content: "The relay went down on Tuesday.", timeMode: "earlier", agoAmount: 3, agoUnit: "months" },
            { content: "Back on the wire.", timeMode: "arrival" },
        ]);
        render(<TwotterNodeEditor node={node} />);
        return node;
    };

    it("shows the profile the node posts from", () => {
        renderNode();
        // once on the profile card, once on each tweet card — like a real feed
        expect(screen.getAllByText("Wren Ackerly").length).toBeGreaterThanOrEqual(3);
        expect(screen.getAllByText("@wren_on_wire").length).toBeGreaterThanOrEqual(3);
        expect(screen.getByText("Signal analyst. Mostly reposts.")).toBeTruthy();
        expect(screen.getByText(/412/)).toBeTruthy();
        expect(screen.getByText(/96/)).toBeTruthy();
    });

    it("shows the tweets newest first — the game's order, not the node's", () => {
        renderNode();
        const texts = screen.getAllByText(/relay went down|Back on the wire/).map((el) => el.textContent);
        expect(texts).toEqual(["Back on the wire.", "The relay went down on Tuesday."]);
        // the ages travel with them
        expect(screen.getByText("a few seconds ago")).toBeTruthy();
        expect(screen.getByText("3 months ago")).toBeTruthy();
    });

    it("marks the arrival row as the one that posts as the story runs", () => {
        renderNode();
        const arrival = screen.getByText("Back on the wire.").closest("article")!;
        const backdated = screen.getByText("The relay went down on Tuesday.").closest("article")!;
        expect(arrival.className).toContain("qe-shimmer");
        expect(backdated.className).not.toContain("qe-shimmer");
    });

    it("drops the shimmer under prefers-reduced-motion, like the clock's colon", () => {
        const css = readFileSync("src/index.css", "utf8");
        const block = css.slice(css.indexOf("prefers-reduced-motion", css.indexOf(".qe-shimmer")));
        expect(block).toContain(".qe-shimmer::after");
        expect(block.slice(0, block.indexOf("}"))).toContain("animation: none");
    });

    it("never draws a tweet picture, and says why — the game has no field for one", () => {
        const node = addTweetNode([
            {
                content: "A picture that cannot be posted.",
                timeMode: "earlier",
                agoAmount: 2,
                agoUnit: "weeks",
                image: "data:image/png;base64,TWEETPICTURE",
            },
        ]);
        render(<TwotterNodeEditor node={node} />);
        expect(document.querySelectorAll('img[src="data:image/png;base64,TWEETPICTURE"]')).toHaveLength(0);
        expect(screen.getByText(/still carries a picture from an earlier draft/)).toBeTruthy();
        // the account's own pictures still show: those DO render in game
        expect(document.querySelectorAll('img[src="data:image/png;base64,AVATAR"]').length).toBeGreaterThan(0);
    });

    it("sends the author to the panel to change the account", async () => {
        renderNode();
        await userEvent.click(screen.getByRole("button", { name: /edit this account/i }));
        expect(useEditor.getState().ui.modal).toBe("twotter");
    });
});

describe("the panel's click-to-edit profile", () => {
    const renderPanel = () => {
        addTweetNode([
            { content: "The relay went down on Tuesday.", timeMode: "earlier", agoAmount: 3, agoUnit: "months" },
        ]);
        render(<TwotterPanelDialog open onOpenChange={() => {}} />);
    };
    const account = () => useEditor.getState().project.twotterAccounts[0]!;

    it("turns the bio into a field where it sits, and writes what is typed", async () => {
        renderPanel();
        await userEvent.click(screen.getByRole("button", { name: /edit bio/i }));
        const box = screen.getByRole("textbox", { name: "Bio" });
        expect((box as HTMLTextAreaElement).value).toBe("Signal analyst. Mostly reposts.");
        await userEvent.clear(box);
        await userEvent.type(box, "Off the wire for good.");
        await act(async () => {
            (box as HTMLTextAreaElement).blur();
        });
        expect(account().bio).toBe("Off the wire for good.");
    });

    it("strips a typed '@' from the handle, because the field it feeds takes none", async () => {
        renderPanel();
        await userEvent.click(screen.getByRole("button", { name: /edit handle/i }));
        const box = screen.getByRole("textbox", { name: "Handle" });
        await userEvent.clear(box);
        await userEvent.type(box, "@wren_on_wire");
        await act(async () => {
            (box as HTMLInputElement).blur();
        });
        expect(account().handle).toBe("wren_on_wire");
    });

    it("turns the display name into a field, and the name on the card follows", async () => {
        renderPanel();
        await userEvent.click(screen.getByRole("button", { name: /edit display name/i }));
        const box = screen.getByRole("textbox", { name: "Display name" });
        await userEvent.clear(box);
        await userEvent.type(box, "Wren A.");
        await act(async () => {
            (box as HTMLInputElement).blur();
        });
        expect(account().displayName).toBe("Wren A.");
        // the card AND the account list both carry the new name
        expect(screen.getAllByText("Wren A.").length).toBeGreaterThanOrEqual(2);
    });

    it("lists what the account has posted, with the quest that posted it", () => {
        renderPanel();
        expect(screen.getByText(/what this account has posted/i)).toBeTruthy();
        expect(screen.getByText("The relay went down on Tuesday.")).toBeTruthy();
        expect(screen.getByText(/posted by “/)).toBeTruthy();
    });

    it("flips the blue check off when the check itself is clicked", async () => {
        renderPanel();
        await userEvent.click(screen.getByRole("button", { name: /remove the blue check/i }));
        expect(account().verified).toBe(false);
    });
});
