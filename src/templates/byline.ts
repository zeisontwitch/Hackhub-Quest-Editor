/**
 * The Byline — Beginner.
 *
 * Website #1, the opposite of a hack. Nothing is hidden and nothing needs a
 * shell: the brief sends the player to an ordinary publication, they read a
 * post, spot the byline, and `lynx` the name to find the person who wrote it.
 * The lesson for an author is that a website can carry a clue in plain sight.
 */
import { createQuest, createProject, type ProjectDocument } from "@/schema/project";
import { makeEdge, makeNode, resetIds, triggerFor } from "@/templates/kit";
import { SITE_TEMPLATES } from "@/templates/pages";

const HOST = "greyline-dispatch.net";
const AUTHOR = "R. Calloway";
const CLIENT = "a.lindqvist@nullpost.io";

export function buildByline(): ProjectDocument {
    resetIds();
    const quest = createQuest({
        id: "q-the-byline",
        name: "TheByline",
        closingObjectiveText: "The name was on the page all along.",
        title: "The Byline",
        autoStart: true,
        description: "A client wants to reach the writer behind a piece on a public newsletter. No break-in — just read and look up.",
        group: "side",
        rewards: { money: 900, xp: 50 },
        employer: { firstName: "Ada", lastName: "Lindqvist", email: CLIENT },
    });

    const claim = makeNode("entry.start", { x: 0, y: 0 });
    /* No entry.complete: with auto-complete off and no Complete button (the
       default) it never fires — the story already ends from the objective. */

    const lynxResp = makeNode("world.toolResponse", { x: 320, y: 0 }, {
        command: "lynx",
        input: AUTHOR,
        dataText: [
            `Name:      ${AUTHOR}`,
            "Role:      Journalist, The Greyline Dispatch",
            "Location:  Hamburg, DE",
            "Email:     r.calloway@greyline-dispatch.net",
            "Web:       https://greyline-dispatch.net",
            "Social:    none",
        ].join("\n"),
        removeOnComplete: true,
    });

    const brief = makeNode("comms.dialogue", { x: 640, y: 0 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "The night-shift piece",
            content:
                "There is a piece on the Greyline Dispatch about what the harbour unloads after two in the morning. Whoever wrote it seems to know more than they are saying.\n\n" +
                `Read it, find the writer, and tell me their name.\n\nTheir site is ${HOST}. No break-ins — the route is public.`,
            replyable: false,
        },
    });

    const oRead = makeNode("objective", { x: 960, y: 40 }, {
        name: "read-dispatch",
        description: "Read the piece about the night shift",
        hint: `Open the browser to ${HOST} and read the post with the pull quote.`,
    });
    const oAuthor = makeNode("objective", { x: 1280, y: 40 }, {
        name: "find-author",
        description: `Find out who wrote the piece`,
        hint: "The byline is right there on the article. Once you have a name, the terminal's lynx tool looks people up.",
        terminalCommand: `lynx "${AUTHOR}"`,
    });

    const tRead = triggerFor(oRead, "Browser.WebsiteOpened", [{ field: "url", op: "contains", value: "/p/night-shift" }], { x: 960, y: 200 });
    const tAuthor = triggerFor(oAuthor, "Terminal.Lynx.Search", [{ field: "query", op: "contains", value: "Calloway" }], { x: 1280, y: 200 });

    const reach = makeNode("comms.dialogue", { x: 1600, y: 0 }, {
        kind: "mail",
        mail: {
            from: "r.calloway@greyline-dispatch.net",
            subject: "You found me",
            content:
                "So you read the piece. Good — that is more than the port's press office has done.\n\n" +
                "I know the night gap is on purpose. Tell your client to keep asking the right question; the answer is in a maintenance log nobody has ever requested.\n\n" +
                "The money is a courtesy. I do this for the readers.",
            replyable: false,
        },
    });

    const pay = makeNode("fx.pay", { x: 1600, y: 260 }, {
        amount: 900,
        description: "Byline found",
        fromName: "A. Lindqvist",
    });

    const closing = makeNode("fx.notify", { x: 1920, y: 260 }, {
        message: "That is the whole job: read, notice the byline, look the person up.",
        variant: "toast",
        tone: "success",
    });

    const note = makeNode("flow.note", { x: 320, y: 460 }, {
        text: [
            "BEGINNER. A website clue in plain sight — the opposite of a hack.",
            "",
            "The brief points to the Greyline Dispatch. Open the browser, read the post, and the byline is the name. Nothing is hidden; the lesson is that a public site can carry the whole puzzle.",
            "",
            "The author gets paid out for a lynx lookup, not a break-in.",
            "",
            "Open Websites in the sidebar to edit the site. Removing the “listed in search” switch on a page hides it from search but not from the address bar — that is the Help Desk Leak's trick, not this one.",
        ].join("\n"),
        width: 320,
    });

    quest.graph = {
        nodes: [claim, lynxResp, brief, oRead, oAuthor, tRead.trigger, tAuthor.trigger, reach, pay, closing, note],
        edges: [
            makeEdge(claim, "out", lynxResp, "in"),
            makeEdge(lynxResp, "out", brief, "in"),
            makeEdge(oRead, "unlock", oAuthor, "unlocked-by"),
            makeEdge(oAuthor, "done", reach, "in"),
            makeEdge(reach, "out", pay, "in"),
            makeEdge(pay, "out", closing, "in"),
            tRead.edge,
            tAuthor.edge,
        ],
    };

    return createProject({
        mod: {
            id: "the-byline",
            name: "The Byline",
            version: "1.0.0",
            author: "",
            description: quest.description,
            tags: ["quest", "osint", "reading", "beginner"],
            dependencies: [],
            minSdkVersion: "0.21.0",
            apiVersion: 1,
        },
        quests: [quest],
        websites: [
            {
                id: "site-greyline",
                host: HOST,
                name: "The Greyline Dispatch",
                pages: SITE_TEMPLATES.find((t) => t.id === "blog")!
                    .make()
                    .pages.filter((p) => p.seo)
                    .map((page, i) => ({ id: `page-greyline-${i + 1}`, ...page })),
            },
        ],
        editor: { activeQuestId: quest.id, viewports: {} },
    });
}
