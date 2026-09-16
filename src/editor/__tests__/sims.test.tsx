/**
 * The general dialogue node: one node, four flavours (phone, Kisscord, mail,
 * WeeChat), edited through the top-level dialogue editor modal. Player moments
 * (typed answers with failure routes, hackertyper sends, uploads) included.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { summarize } from "@/editor/canvas/summarize";
import { DialoguesDialog } from "@/editor/shell/DialoguesDialog";
import { createProject } from "@/schema/project";
import { migrateProject } from "@/schema/migrate";
import type { NodeOfType } from "@/schema/nodes";
import { useEditor } from "@/store/editor";

beforeEach(() => {
    localStorage.clear();
    act(() => useEditor.getState().load(createProject(), { clearHistory: true }));
});

const nodeNow = (id: string) =>
    useEditor.getState().project.quests[0].graph.nodes.find((n) => n.id === id)!;

function addDialogue(kind: "phone" | "kisscord" | "mail" | "weechat"): NodeOfType<"comms.dialogue"> {
    let id = "";
    act(() => {
        id = useEditor.getState().addNode("comms.dialogue", { x: 0, y: 0 })!;
        useEditor.getState().updateNodeData(id, { kind });
    });
    return nodeNow(id) as NodeOfType<"comms.dialogue">;
}

function openEditor(id: string) {
    render(<DialoguesDialog open onOpenChange={() => {}} />);
    act(() => useEditor.getState().setUi({ dialogueNode: id }));
}

describe("dialogue node", () => {
    it("is offered by the palette as one general node and previews its first line", () => {
        const node = addDialogue("kisscord");
        act(() =>
            useEditor.getState().updateNodeData(node.id, {
                kisscord: {
                    contactId: "r.okafor",
                    messages: [
                        { id: "m1", content: "Did you get my mail?", isMine: false, delayMs: 0, playerAction: "none", playerText: "", unlocksAfter: [] },
                    ],
                },
            }),
        );
        const lines = summarize(nodeNow(node.id), useEditor.getState().project.quests[0]);
        expect(lines[0]).toContain("Kisscord chat");
        expect(lines[1]).toContain("Did you get my mail?");
    });

    it("migrates saved projects with the old separate comms nodes", () => {
        const migrated = migrateProject({
            quests: [
                {
                    graph: {
                        nodes: [
                            { id: "a", type: "comms.call", position: { x: 0, y: 0 }, data: { branch: "b", startIndex: 2 } },
                            { id: "b", type: "comms.mail", position: { x: 0, y: 0 }, data: { from: "x", subject: "s", content: "", replyable: false } },
                            { id: "c", type: "comms.kisscord", position: { x: 0, y: 0 }, data: { contactId: "k", messages: [] } },
                            { id: "d", type: "comms.weechat", position: { x: 0, y: 0 }, data: { host: "h", password: "", registerServer: true, messages: [] } },
                        ],
                    },
                },
            ],
        }) as { quests: { graph: { nodes: { type: string; data: { kind: string } }[] } }[] };
        const nodes = migrated.quests[0].graph.nodes;
        expect(nodes.map((n) => n.type)).toEqual(["comms.dialogue", "comms.dialogue", "comms.dialogue", "comms.dialogue"]);
        expect(nodes.map((n) => n.data.kind)).toEqual(["phone", "mail", "kisscord", "weechat"]);
    });
});

describe("kisscord flavour", () => {
    it("scripts DMs with gating, ordering and previews", async () => {
        const user = userEvent.setup();
        act(() => {
            const objective = useEditor.getState().addNode("objective", { x: 0, y: 0 })!;
            useEditor.getState().updateNodeData(objective, { name: "grab-ledger" });
        });
        const node = addDialogue("kisscord");
        openEditor(node.id);

        expect(screen.getByText(/No messages yet/)).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: /add message/i }));
        await user.type(screen.getByLabelText("Message 1"), "got the files?");

        const stored = nodeNow(node.id) as NodeOfType<"comms.dialogue">;
        expect(stored.data.kisscord.messages[0].content).toBe("got the files?");
        expect(screen.getAllByText("got the files?").length).toBeGreaterThan(0);

        await user.click(screen.getByRole("button", { name: "grab-ledger" }));
        const gated = nodeNow(node.id) as NodeOfType<"comms.dialogue">;
        expect(gated.data.kisscord.messages[0].unlocksAfter).toEqual(["grab-ledger"]);

        await user.click(screen.getByRole("button", { name: /add message/i }));
        await user.type(screen.getByLabelText("Message 2"), "second");
        const upButtons = screen.getAllByRole("button", { name: "Move earlier" });
        await user.click(upButtons[upButtons.length - 1]);
        const reordered = nodeNow(node.id) as NodeOfType<"comms.dialogue">;
        expect(reordered.data.kisscord.messages[0].content).toBe("second");
    });

    it("supports player moments: hackertyper sends, uploads and typed answers", async () => {
        const user = userEvent.setup();
        const node = addDialogue("kisscord");
        openEditor(node.id);
        await user.click(screen.getByRole("button", { name: /add message/i }));

        await user.selectOptions(screen.getByLabelText("Message 1 actor"), "upload");
        await user.type(screen.getByLabelText("Upload name 1"), "leaked_memo");
        let stored = nodeNow(node.id) as NodeOfType<"comms.dialogue">;
        expect(stored.data.kisscord.messages[0].playerAction).toBe("upload");
        expect(stored.data.kisscord.messages[0].upload?.name).toBe("leaked_memo");
        expect(screen.getAllByText(/leaked_memo/).length).toBeGreaterThan(0);

        await user.selectOptions(screen.getByLabelText("Message 1 actor"), "send");
        await user.type(screen.getByLabelText("Message 1 typed text"), "sending the drop now");
        stored = nodeNow(node.id) as NodeOfType<"comms.dialogue">;
        expect(stored.data.kisscord.messages[0].playerAction).toBe("send");
        expect(stored.data.kisscord.messages[0].playerText).toBe("sending the drop now");

        await user.selectOptions(screen.getByLabelText("Message 1 actor"), "input");
        await user.type(screen.getByLabelText("Expected answer 1"), "open sesame");
        await user.selectOptions(screen.getByLabelText("Wrong answer route 1"), "wrong");
        stored = nodeNow(node.id) as NodeOfType<"comms.dialogue">;
        expect(stored.data.kisscord.messages[0].input?.expected).toBe("open sesame");
        expect(stored.data.kisscord.messages[0].input?.wrongRoute).toBe("wrong");
    });
});

describe("weechat flavour", () => {
    it("renders an IRC log, edits lines and typed answers", async () => {
        const user = userEvent.setup();
        const node = addDialogue("weechat");
        openEditor(node.id);

        await user.click(screen.getByRole("button", { name: /add line/i }));
        await user.type(screen.getByLabelText("Line 1"), "bring the drive");
        expect(screen.getAllByText(/bring the drive/).length).toBeGreaterThan(0);
        expect(screen.getAllByText("<informant>").length).toBeGreaterThan(0);

        await user.selectOptions(screen.getByLabelText("Line 1 actor"), "input");
        await user.type(screen.getByLabelText("Expected answer 1"), "treyes3419");
        const stored = nodeNow(node.id) as NodeOfType<"comms.dialogue">;
        expect(stored.data.weechat.messages[0].playerAction).toBe("input");
        expect(stored.data.weechat.messages[0].input?.expected).toBe("treyes3419");
    });
});

describe("phone flavour", () => {
    it("creates branches on the quest, scripts lines, choices and typed replies", async () => {
        const user = userEvent.setup();
        const node = addDialogue("phone");
        openEditor(node.id);
        expect(screen.getByText(/no conversation yet/i)).toBeInTheDocument();
        expect(screen.getByLabelText("Phone flow timing")).toHaveValue("onEnd");

        await user.selectOptions(screen.getByLabelText("Phone flow timing"), "immediate");
        expect((nodeNow(node.id) as NodeOfType<"comms.dialogue">).data.phone.continueMode).toBe("immediate");

        await user.click(screen.getByRole("button", { name: /new branch/i }));
        const quest = useEditor.getState().project.quests[0];
        expect(quest.dialog).toHaveLength(1);
        expect(quest.dialog[0].name).toBe("branch-1");

        await user.click(screen.getByRole("button", { name: /add line/i }));
        await user.type(screen.getByLabelText("Line 1"), "We don't have long.");
        expect(screen.getAllByText("We don't have long.").length).toBeGreaterThan(0);

        await user.click(screen.getByRole("button", { name: /add choice/i }));
        await user.type(screen.getByLabelText("Choice 1 label"), "Who is this?");
        expect(screen.getByRole("button", { name: "Who is this?" })).toBeInTheDocument();

        // A typed reply with a failure route lives on the quest dialog too.
        const switches = screen.getAllByRole("switch");
        await user.click(switches.find((s) => s.closest("div")?.textContent?.includes("Player types a reply"))!);
        await user.type(screen.getByLabelText("Expected answer 1"), "halcyon");
        await user.selectOptions(screen.getByLabelText("Wrong answer route 1"), "end");
        const q2 = useEditor.getState().project.quests[0];
        expect(q2.dialog[0].lines[0].input?.expected).toBe("halcyon");
        expect(q2.dialog[0].lines[0].input?.wrongRoute).toBe("end");
    });

    it("lets the preview play through lines and replay from the start", async () => {
        const user = userEvent.setup();
        const node = addDialogue("phone");
        act(() => {
            useEditor.getState().updateQuest(useEditor.getState().project.quests[0].id, {
                dialog: [
                    {
                        id: "b1",
                        name: "default",
                        lines: [
                            { id: "l1", speaker: "", text: "First.", isEnd: false, options: [] },
                            { id: "l2", speaker: "", text: "Second.", isEnd: true, options: [] },
                        ],
                    },
                ],
            });
        });
        openEditor(node.id);

        expect(screen.getAllByText("First.").length).toBeGreaterThan(0);
        await user.click(screen.getByRole("button", { name: /continue/i }));
        expect(screen.getAllByText("Second.").length).toBeGreaterThan(0);
        expect(screen.getByText("— call ends —")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Replay preview" }));
        expect(screen.getAllByText("First.").length).toBeGreaterThan(0);
    });
});

describe("mail flavour", () => {
    it("shows the reading view above the compose fields", async () => {
        const user = userEvent.setup();
        const node = addDialogue("mail");
        openEditor(node.id);

        await user.type(screen.getByLabelText("Mail subject"), "The job");
        await user.type(screen.getByLabelText("Mail from"), "handler@anon.mail");
        expect(screen.getByText("The job")).toBeInTheDocument();
        expect(screen.getByText(/handler@anon\.mail/)).toBeInTheDocument();

        const stored = nodeNow(node.id) as NodeOfType<"comms.dialogue">;
        expect(stored.data.mail.subject).toBe("The job");
    });
});

describe("top-level dialogue editor", () => {
    it("lists the quest's dialogues and creates new dialogue nodes", async () => {
        const user = userEvent.setup();
        addDialogue("kisscord");
        render(<DialoguesDialog open onOpenChange={() => {}} />);

        expect(screen.getByText(/Kisscord chat/)).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: /New dialogue node/ }));
        expect(useEditor.getState().project.quests[0].graph.nodes.filter((n) => n.type === "comms.dialogue")).toHaveLength(2);
        // and it jumped straight into editing the new node
        expect(screen.getByText(/Conversation type/)).toBeInTheDocument();
    });

    it("is reachable from the top bar like the website builder", async () => {
        const user = userEvent.setup();
        const { TopBar } = await import("@/editor/shell/TopBar");
        const { Overlays } = await import("@/editor/shell/Overlays");
        render(
            <>
                <TopBar />
                <Overlays />
            </>,
        );
        await user.click(screen.getByRole("button", { name: /Dialogues/ }));
        expect(screen.getByText("Dialogue editor")).toBeInTheDocument();
    });
});

describe("dialogue editor save button", () => {
    it("writes the draft immediately and confirms", async () => {
        const user = userEvent.setup();
        localStorage.clear();
        const node = addDialogue("mail");
        render(<DialoguesDialog open onOpenChange={() => {}} />);
        act(() => useEditor.getState().setUi({ dialogueNode: node.id }));

        const save = screen.getByRole("button", { name: /^save$/i });
        expect(save).toBeEnabled();
        await user.click(save);

        expect(await screen.findByRole("button", { name: /saved/i })).toBeInTheDocument();
        // the draft is really on disk (localStorage), not just promised
        const raw = localStorage.getItem("hackhub-quest-editor:draft:v1");
        expect(raw).toBeTruthy();
        expect(JSON.parse(raw!).quests[0].graph.nodes.some((n: { id: string }) => n.id === node.id)).toBe(true);
    });
});
