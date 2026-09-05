/**
 * Cold Call — Beginner.
 *
 * A story told entirely in conversation. A contact reaches out on Kisscord, a
 * hint surfaces on WeeChat, and the quest closes on a typed answer. There is no
 * machine to break into and no recon tool to run — the only "hacking" is proving
 * who you are.
 */
import { createQuest, createProject, type ProjectDocument } from "@/schema/project";
import { makeEdge, makeNode, resetIds, triggerFor } from "@/templates/kit";

export function buildColdCall(): ProjectDocument {
    resetIds();
    const quest = createQuest({
        id: "q-cold-call",
        name: "ColdCall",
        closingObjectiveText: "She knows you are who you say you are.",
        title: "Cold Call",
        autoStart: true,
        description: "A contact reaches out cold. Prove who you are and she pays.",
        group: "side",
        rewards: { money: 1100, xp: 70 },
        employer: { firstName: "Zara", lastName: "Verhoeven", email: "z.verhoeven@delivery-union.org" },
    });

    const claim = makeNode("entry.start", { x: 0, y: 0 });

    const kisscord = makeNode("comms.dialogue", { x: 320, y: 0 }, {
        kind: "kisscord",
        kisscord: {
            contactId: "zara_v",
            messages: [
                {
                    id: "k1",
                    content: "You're the new contractor? Don't ask how I found the number. The harbour answers to nobody.",
                    isMine: false, delayMs: 0, playerAction: "none", playerText: "", unlocksAfter: [],
                },
                {
                    id: "k2",
                    content: "Before I pay for anything, prove you're exactly who I think you are. One thing, no tools.",
                    isMine: false, delayMs: 2600, playerAction: "none", playerText: "", unlocksAfter: [],
                },
            ],
        },
    });

    const delay = makeNode("flow.delay", { x: 640, y: 0 }, { seconds: 2 });

    const weechat = makeNode("comms.dialogue", { x: 960, y: 0 }, {
        kind: "weechat",
        weechat: {
            host: "irc.delivery-union.org",
            password: "guest",
            registerServer: true,
            messages: [
                {
                    id: "w1",
                    content: "The new one signs her manifests the way her mother did: just the initial. V, they call her on the dock.",
                    username: "b__g", isMine: false, delayMs: 0, playerAction: "none", playerText: "",
                },
                {
                    id: "w2",
                    content: "Say the name she gave you in the chat, not here. Old man listens.",
                    username: "b__g", isMine: false, delayMs: 1800, playerAction: "none", playerText: "",
                },
            ],
        },
    });

    const reply = makeNode("reply.input", { x: 1280, y: 0 }, {
        commandName: "reply",
        commandDescription: "Answer Zara's question about who you are",
        prompt: "Answer Zara >",
        mask: false,
        matchMode: "contains",
        expected: "zara",
        caseSensitive: false,
        successMessage: "You said her name. The line goes quiet, then the money lands.",
        failureMessage: "That's not the name she gave you. Read the chat again.",
    });

    const oProof = makeNode("objective", { x: 1280, y: 260 }, {
        name: "prove-it",
        description: "Answer Zara so she knows who you are",
        hint: "The first message tells you what she calls herself. Type the reply command and give her name.",
        terminalCommand: "reply",
    });

    /* The objective completes when the manual-input command succeeds. `reply`
       is a real registered Command, so running it emits QE.<node>.ok — the
       trigger listens for that and closes the objective. */
    const tProof = triggerFor(oProof, `QE.${reply.id}.ok`, [], { x: 960, y: 260 });

    const pay = makeNode("fx.pay", { x: 1600, y: 0 }, {
        amount: 1100,
        description: "Passphrase accepted",
        fromName: "Z. Verhoeven",
    });

    const closing = makeNode("fx.notify", { x: 1600, y: 260 }, {
        message: "You're in. She'll call again when there's work.",
        variant: "toast",
        tone: "success",
    });

    const note = makeNode("flow.note", { x: 320, y: 460 }, {
        text: [
            "BEGINNER. A conversation can carry a whole quest — no network, no break-in.",
            "",
            "The contact messages you on Kisscord, a hint turns up on the WeeChat channel, and the quest closes when you run the `reply` command with the name she gave you.",
            "",
            "The grey node under the objective is its trigger: it fires on the custom command's success event (QE.<node>.ok). The `Manual input` node compiles to a registered terminal command, which is how a typed answer works.",
            "",
            "Use `Flow control → Wait` to pace the messages, so the story isn't one wall of text.",
        ].join("\n"),
        width: 320,
    });

    quest.graph = {
        nodes: [claim, kisscord, delay, weechat, reply, oProof, tProof.trigger, pay, closing, note],
        edges: [
            makeEdge(claim, "out", kisscord, "in"),
            makeEdge(kisscord, "out", delay, "in"),
            makeEdge(delay, "out", weechat, "in"),
            makeEdge(weechat, "out", reply, "in"),
            makeEdge(reply, "success", pay, "in"),
            makeEdge(pay, "out", closing, "in"),
            tProof.edge,
        ],
    };

    return createProject({
        mod: {
            id: "cold-call",
            name: "Cold Call",
            version: "1.0.0",
            author: "",
            description: quest.description,
            tags: ["quest", "chat", "conversation", "beginner"],
            dependencies: [],
            minSdkVersion: "0.21.0",
            apiVersion: 1,
        },
        quests: [quest],
        editor: { activeQuestId: quest.id, viewports: {} },
    });
}
