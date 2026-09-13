/**
 * Bad Attachment — Advanced.
 *
 * Phishing by mail: the player writes a convincing lure to a target, the target
 * replies with a credential, and the player forwards it to the client. There is
 * no break-in — the whole route runs through Mail.Sent and Mail.Read.
 *
 * The editor cannot yet register a GoMail compose *template* (no node/schema
 * emits Mail.registerTemplate), and whether the engine simulates a target
 * opening a malicious attachment is not verifiable from the SDK. So, per the
 * plan's fallback, the quest is driven purely by the mail events: the quest
 * stages the target's reply as a mail delivered to the player once the lure
 * goes out, and the player reads it (Mail.Read). That is the part to playtest.
 */
import { createQuest, createProject, type ProjectDocument } from "@/schema/project";
import { applyLayout, makeEdge, makeNode, resetIds, triggerFor } from "@/templates/kit";

const TARGET = "Anders Brandt";
const TARGET_EMAIL = "a.brandt@portline-shipping.com";
const CLIENT = "d.klein@nullpost.io";

export function buildBadAttachment(): ProjectDocument {
    resetIds();
    const quest = createQuest({
        id: "q-bad-attachment",
        name: "BadAttachment",
        closingObjectiveText: "The credential is with the client. The target never knew.",
        title: "Bad Attachment",
        autoStart: true,
        description: "A shipping agent keeps a contact list worth more than the freight. Convince one address to hand it over.",
        group: "side",
        rewards: { money: 4200, xp: 240 },
        employer: { firstName: "Delphine", lastName: "Klein", email: CLIENT },
    });

    const claim = makeNode("entry.start", { x: 0, y: 0 });

    const brief = makeNode("comms.dialogue", { x: 320, y: 0 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "One reply from one man",
            content:
                `A shipping agent at Portline keeps a bribe list that names every harbour official they have ever paid. The man who holds it is ${TARGET}.\n\n` +
                `Write to him as if you were a supplier who has a question about a late invoice. Make it the kind of mail he cannot ignore.\n\n` +
                `He is careful, but he replies to clients who sound like they already work with him. When he does, he pastes a credential to prove who he is. Send it to me.\n\n` +
                `His address is ${TARGET_EMAIL}. Do not use mine.`,
            replyable: false,
        },
    });

    const oLure = makeNode("objective", { x: 640, y: 0 }, {
        name: "send-lure",
        description: "Send a convincing mail to the target",
        hint: "Compose to him, from a supplier's address, about a late invoice. Sound like someone he already deals with.",
        info: "The objective completes when the mail goes out to him. Who it is from and what it says is up to you.",
    });

    const tLure = triggerFor(oLure, "Mail.Sent", [{ field: "to", op: "contains", value: TARGET_EMAIL }], { x: 640, y: 160 });

    /* The reply. The quest stages it as a mail that lands once the lure goes
       out (reached via oLure.done), which is what makes the loop completable. */
    const reply = makeNode("comms.dialogue", { x: 960, y: 0 }, {
        kind: "mail",
        mail: {
            from: TARGET_EMAIL,
            subject: "Re: invoice #7714",
            content:
                "You reached me at a busy time, but I do not ignore a supplier who knows the dock.\n\n" +
                "The detail is this: the harbour pays in three strings — the yard, the stevedore and the pilot. A good agent keeps them separate and charges to join them.\n\n" +
                "Proof I am who I say I am: yard-list-7. Keep it between us — do not put it on paper.",
            replyable: false,
        },
    });

    const oCatch = makeNode("objective", { x: 960, y: 220 }, {
        name: "get-credential",
        description: "Get the credential from the target's reply",
        hint: "He replies to anybody who sounds like a current supplier. Whatever he sends back is the lead.",
    });

    const tCatch = triggerFor(oCatch, "Mail.Read", [{ field: "from", op: "contains", value: "portline-shipping.com" }], { x: 960, y: 380 });

    const remember = makeNode("fx.setData", { x: 1280, y: 0 }, {
        key: "credential",
        value: "yard-list-7",
    });

    const oSend = makeNode("objective", { x: 1280, y: 220 }, {
        name: "send-credential",
        description: "Send the credential to the client",
        hint: `Forward it — the credential, not the whole thread — to ${CLIENT}.`,
    });

    const tSend = triggerFor(oSend, "Mail.Sent", [{ field: "to", op: "contains", value: CLIENT }], { x: 1280, y: 380 });

    const thanks = makeNode("comms.dialogue", { x: 1600, y: 220 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "Received",
            content:
                "That is the string I needed. The port paid three ways last quarter and no two of them will ever testify.\n\n" +
                "Delete the mail. Delete the contact. The money is with you.",
            replyable: false,
        },
    });

    const pay = makeNode("fx.pay", { x: 1600, y: 0 }, {
        amount: 4200,
        description: "Credential delivered",
        fromName: "D. Klein",
    });

    const closing = makeNode("fx.notify", { x: 1880, y: 0 }, {
        message: "Credential delivered. The client has what they need.",
        variant: "toast",
        tone: "success",
    });

    const note = makeNode("flow.note", { x: 320, y: 520 }, {
        text: [
            "ADVANCED. The whole quest runs on mail — no break-in, no shell.",
            "",
            "Write a convincing lure, send it to the target (Mail.Sent), and the target's reply lands as a mail you read (Mail.Read). Then forward the credential to the client.",
            "",
            "The target's reply is staged by the quest so the loop is completable. The engine may or may not simulate an actual malicious attachment; that is the point to playtest. Mail.registerTemplate (a GoMail compose template) is not expressible in the editor yet.",
            "",
            "Every objective's trigger matches on the mail events, so the puzzle is about the words, not a tool.",
        ].join("\n"),
        width: 320,
    });

    quest.graph = {
        nodes: [
            claim, brief, oLure, tLure.trigger, reply, oCatch, tCatch.trigger,
            remember, oSend, tSend.trigger, thanks, pay, closing, note,
        ],
        edges: [
            makeEdge(claim, "out", brief, "in"),
            makeEdge(brief, "out", oLure, "in"),
            tLure.edge,
            makeEdge(oLure, "done", reply, "in"),
            makeEdge(oLure, "unlock", oCatch, "unlocked-by"),
            tCatch.edge,
            makeEdge(oCatch, "done", remember, "in"),
            makeEdge(oCatch, "unlock", oSend, "unlocked-by"),
            tSend.edge,
            makeEdge(oSend, "done", thanks, "in"),
            makeEdge(thanks, "out", pay, "in"),
            makeEdge(pay, "out", closing, "in"),
        ],
    };

    applyLayout(quest);

    return createProject({
        mod: {
            id: "bad-attachment",
            name: "Bad Attachment",
            version: "1.0.0",
            author: "",
            description: quest.description,
            tags: ["quest", "phishing", "mail", "advanced"],
            dependencies: [],
            minSdkVersion: "0.21.0",
            apiVersion: 1,
        },
        quests: [quest],
        websites: [],
        editor: { activeQuestId: quest.id, viewports: {} },
    });
}
