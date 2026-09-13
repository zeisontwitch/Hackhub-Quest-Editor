/**
 * First Contact — Beginner.
 *
 * The whole spine in miniature: a brief, one objective, a payment, a closing
 * line. Nothing is hidden and nothing needs a shell. It exists so that the
 * first thing an author reads answers "what does a quest even look like?".
 *
 *   brief  →  lynx the contact  →  paid  →  the client says thank you.
 */
import { createQuest, createProject, type ProjectDocument } from "@/schema/project";
import { applyLayout, makeEdge, makeNode, resetIds, triggerFor } from "@/templates/kit";

const NAME = "Marta Voss";

export function buildFirstContact(): ProjectDocument {
    resetIds();
    const quest = createQuest({
        id: "q-first-contact",
        name: "FirstContact",
        closingObjectiveText: "You have your first name. The client has yours.",
        title: "First Contact",
        /* A template has to be playable the moment it is exported: without
           this (or a Hackhub feed post) nothing can ever claim the quest. */
        autoStart: true,
        description: "An anonymous client wants to know who is on the other end of an address.",
        group: "side",
        rewards: { money: 800, xp: 60 },
        employer: { firstName: "Elias", lastName: "Brandt", email: "e.brandt@nullpost.io" },
    });

    const claim = makeNode("entry.start", { x: 0, y: 0 });
    /* No entry.complete: quests ship with auto-complete off and no Complete
       button, so it never fires — the story ends from the last objective. */

    const brief = makeNode("comms.dialogue", { x: 320, y: 0 }, {
        kind: "mail",
        mail: {
            from: "e.brandt@nullpost.io",
            subject: "A name, nothing else",
            content:
                "I need to know who runs a small company that keeps contacting mine.\n\n" +
                `The only thing I have is a name: ${NAME}.\n\n` +
                "Look them up and tell me who they are. Nothing else — I am not asking you to break into anything.",
            replyable: false,
        },
    });

    const osint = makeNode("world.toolResponse", { x: 640, y: 0 }, {
        command: "lynx",
        input: NAME,
        dataText: [
            `Name:      ${NAME}`,
            "Role:      Owner, Voss Automation GmbH",
            "Location:  Hamburg, DE",
            "Web:       https://voss-automation.de",
            "Email:     m.voss@voss-automation.de",
            "Social:    none",
        ].join("\n"),
        removeOnComplete: true,
    });

    const oFind = makeNode("objective", { x: 960, y: 120 }, {
        name: "identify-contact",
        description: `Find out who ${NAME} is`,
        hint: "lynx looks people up. Give it the full name, in quotes.",
        terminalCommand: `lynx "${NAME}"`,
    });

    const tFind = triggerFor(
        oFind,
        "Terminal.Lynx.Search",
        [{ field: "query", op: "contains", value: NAME }],
        { x: 640, y: 180 },
    );

    const pay = makeNode("fx.pay", { x: 960, y: 360 }, {
        amount: 800,
        description: "Identity check",
        fromName: "E. Brandt",
    });

    const closing = makeNode("fx.notify", { x: 1280, y: 360 }, {
        message: "The client has paid. First job off the books — they will be in touch.",
        variant: "toast",
        tone: "success",
    });

    const note = makeNode("flow.note", { x: 320, y: 420 }, {
        text: [
            "BEGINNER. What a quest is made of: a brief, one objective, a payment, a closing line.",
            "",
            "The objective completes when the player runs ly-nx on the name the brief gives them. The grey node under it is the trigger — that is how an objective knows it is done.",
            "",
            "Add an objective by dragging it from the palette, then pulling the yellow trigger under it onto the objective's “trigger” socket.",
            "",
            "Use the palette on the left; hover the ⓘ next to any field to read what it does.",
        ].join("\n"),
        width: 320,
    });

    quest.graph = {
        nodes: [claim, brief, osint, oFind, tFind.trigger, pay, closing, note],
        edges: [
            makeEdge(claim, "out", brief, "in"),
            makeEdge(brief, "out", osint, "in"),
            makeEdge(osint, "out", oFind, "in"),
            // finding her is the end of the job: pay, then the closing line
            makeEdge(oFind, "done", pay, "in"),
            makeEdge(pay, "out", closing, "in"),
            tFind.edge,
        ],
    };

    applyLayout(quest);

    return createProject({
        mod: {
            id: "first-contact",
            name: "First Contact",
            version: "1.0.0",
            author: "",
            description: quest.description,
            tags: ["quest", "osint", "beginner"],
            dependencies: [],
            minSdkVersion: "0.21.0",
            apiVersion: 1,
        },
        quests: [quest],
        editor: { activeQuestId: quest.id, viewports: {} },
    });
}
