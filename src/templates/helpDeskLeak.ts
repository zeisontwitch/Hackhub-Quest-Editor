/**
 * The Help Desk Leak — Advanced.
 *
 * A public site, a portal that refuses you, and an unlisted page dirhunter can
 * find. The credential is assembled from two pages the agency published itself:
 * the classic web-recon loop, with a real website in the box.
 */
import { createQuest, createProject } from "@/schema/project";
import type { ProjectDocument } from "@/schema/project";
import { TARGET_IP_TOKEN } from "@/schema/common";
import { SITE_TEMPLATES } from "@/templates/pages";
import { applyLayout, makeEdge, makeNode, resetIds, triggerFor } from "@/templates/kit";

export function buildHelpDeskLeak(): ProjectDocument {
    resetIds();
    const HOST = "naza.gov";
    /* Allocated by the game; {{data.targetIp}} reads it back (r73). */
    const EDGE_IP = TARGET_IP_TOKEN;
    const BOX_IP = "10.10.4.7";
    const USER = "t.reyes";
    const PASSWORD = "treyes3419";
    const FILE = "abort-report";

    const quest = createQuest({
        id: "q-dirhunter",
        name: "TheHelpDeskLeak",
        closingObjectiveText: "Report delivered. The help desk never saw you.",
        title: "The Help Desk Leak",
        /* A template has to be playable the moment it is exported: without
           this (or a Hackhub feed post) nothing can ever claim the quest. */
        autoStart: true,
        description: "An agency portal that will not let you in, and an internal page it forgot to hide.",
        group: "side",
        rewards: { money: 3200, xp: 150 },
        employer: { firstName: "Marguerite", lastName: "Oyelaran", email: "m.oyelaran@bcc-desk.net" },
    });

    const claim = makeNode("entry.start", { x: 0, y: 0 });
    /* No "quest complete" node: this quest has nothing to do after the
       payment, and an empty lifecycle node is one more thing to reason about. */
    const load = makeNode("entry.load", { x: 0, y: 200 });

    const network = makeNode("world.network", { x: 300, y: 0 }, {
        ipMode: "random",
        destroyOnComplete: false,
        device: {
            id: "dev-edge",
            ip: EDGE_IP,
            name: "naza-edge",
            type: "ROUTER",
            model: "Cisco ISR 1100",
            domainName: HOST,
            accessable: false,
            vulnerabilities: [],
            users: [],
            ports: [
                { id: "p-http", external: 80, internal: 80, active: true, service: "http" },
                { id: "p-https", external: 443, internal: 443, active: true, service: "https" },
            ],
            rules: [],
            files: [],
            children: [
                {
                    id: "dev-box",
                    ip: BOX_IP,
                    name: "nz-helpdesk-01",
                    type: "DEVICE",
                    vulnerabilities: [],
                    ports: [
                        /* Plain numbers in the version: a letter in it has been
                           seen to stop the in-game metasploit matching. */
                        { id: "p-ssh", external: 22, internal: 22, active: true, service: "ssh", version: "OpenSSH 8.4.0" },
                    ],
                    users: [
                        {
                            id: "u-reyes",
                            username: USER,
                            /* first initial + last name + last 4 of the employee
                               ID — the rule printed on the unlisted page, applied
                               to the one name the directory says never changed
                               it. The player assembles this themselves. */
                            password: PASSWORD,
                            firstName: "Tomás",
                            lastName: "Reyes",
                            emailAddress: "t.reyes@naza.gov",
                            files: [
                                {
                                    id: "f-report",
                                    name: FILE,
                                    extension: "pdf",
                                    isFolder: false,
                                    data: "ABORT REVIEW — LV-9 pad hold at T-40s. Root cause withheld pending counsel review.",
                                },
                                {
                                    id: "f-tickets",
                                    name: "tickets-this-week",
                                    extension: "txt",
                                    isFolder: false,
                                    data: "Voss: mail rules. Idowu: VPN. Callahan: new laptop. Me: change this password (again).",
                                },
                            ],
                        },
                    ],
                    rules: [],
                    files: [],
                    children: [],
                },
            ],
        },
    });

    const brief = makeNode("comms.dialogue", { x: 620, y: 0 }, {
        kind: "mail",
        mail: {
            from: "m.oyelaran@bcc-desk.net",
            subject: "The pad hold nobody will talk about",
            content: [
                "NAZA held the LV-9 launch at forty seconds and has said nothing since. There is an abort review sitting on one of their internal boxes.",
                `Their site is ${HOST}. The staff portal will not take a login you do not already have — but agencies are careless with the pages they do not link to.`,
                "Bring me the report. No heroics.",
            ].join("\n\n"),
            replyable: false,
        },
    });

    const oSite = makeNode("objective", { x: 940, y: 0 }, {
        name: "open-site",
        description: `Look at ${HOST}`,
        hint: "The in-game browser. Start at the front page and see what they publish.",
    });
    const oPortal = makeNode("objective", { x: 1260, y: 0 }, {
        name: "try-portal",
        description: "Try the employee portal",
        hint: "It will refuse you. Worth seeing what it asks for.",
    });
    const oHunt = makeNode("objective", { x: 1580, y: 0 }, {
        name: "find-unlisted",
        description: "Find a page the site does not link to",
        hint: "dirhunter walks a host looking for paths that exist but are not listed.",
        terminalCommand: `dirhunter ${HOST}`,
    });
    const oRead = makeNode("objective", { x: 1900, y: 0 }, {
        name: "read-helpdesk",
        description: "Read the internal help-desk page",
        hint: "It explains how temporary passwords are built, and says who has not changed theirs.",
    });
    const oShell = makeNode("objective", { x: 2220, y: 0 }, {
        name: "log-in",
        description: "Log in to the help-desk machine",
        hint: "The rule plus the directory's employee ID make one password. The public directory lists both.",
        terminalCommand: `ssh ${USER}@${BOX_IP}`,
    });
    const oGrab = makeNode("objective", { x: 2540, y: 0 }, {
        name: "take-report",
        description: `Download ${FILE}.pdf`,
        hint: "It is in the home directory of the account you logged in as.",
        terminalCommand: `download ${FILE}.pdf`,
    });

    const t1 = triggerFor(oSite, "Browser.WebsiteOpened", [{ field: "url", op: "contains", value: HOST }], { x: 940, y: 200 });
    const t2 = triggerFor(oPortal, "Browser.WebsiteOpened", [{ field: "url", op: "contains", value: "/portal" }], { x: 1260, y: 200 });
    const t3 = triggerFor(oHunt, "Terminal.Dirhunter", [{ field: "results", op: "contains", value: "/it/helpdesk" }], { x: 1580, y: 200 });
    const t4 = triggerFor(oRead, "Browser.WebsiteOpened", [{ field: "url", op: "contains", value: "/it/helpdesk" }], { x: 1900, y: 200 });
    const t5 = triggerFor(oShell, "RemoteConnection.Established", [{ field: "ip", op: "equals", value: BOX_IP }], { x: 2220, y: 200 });
    const t6 = triggerFor(oGrab, "Files.Transfer", [
        { field: "type", op: "equals", value: "DOWNLOAD" },
        { field: "file.name", op: "contains", value: FILE },
    ], { x: 2540, y: 200 });

    /* ── the pay-off, played as a small scene ───────────────────────────── */

    const scene = makeNode("flow.sequence", { x: 2860, y: 0 }, {
        steps: [
            { id: "s1", label: "Confirm receipt", delayMs: 0 },
            { id: "s2", label: "She reads it", delayMs: 3500 },
            { id: "s3", label: "Payment", delayMs: 2000 },
        ],
    });
    const gotIt = makeNode("fx.notify", { x: 3180, y: -160 }, {
        message: "Upload complete.",
        variant: "toast",
        tone: "success",
    });
    const chat = makeNode("comms.dialogue", { x: 3180, y: 0 }, {
        kind: "kisscord",
        /* Timed into the story: the messages arrive when the flow reaches this
           node, on the Sequence's second beat, rather than sitting in the chat
           from the moment the quest starts. */
        postLive: true,
        kisscord: {
            contactId: "m_oyelaran",
            messages: [
                { id: "k1", content: "Got it.", isMine: false, delayMs: 0, playerAction: "none", playerText: "", unlocksAfter: [] },
                { id: "k2", content: "Page 4. They knew about the valve in March.", isMine: false, delayMs: 3000, playerAction: "none", playerText: "", unlocksAfter: [] },
                { id: "k3", content: "Do not go back to that host. They will rotate the passwords by Monday and I would rather they never knew why.", isMine: false, delayMs: 4000, playerAction: "none", playerText: "", unlocksAfter: [] },
            ],
        },
    });
    const pay = makeNode("fx.pay", { x: 3180, y: 200 }, {
        amount: 3200,
        description: "Abort review",
        fromName: "M. Oyelaran",
    });

    const note = makeNode("flow.note", { x: 300, y: 620 }, {
        text: [
            "The clue is in the website, not in the quest text.",
            "",
            "Open Websites → NAZA: the employee portal refuses everyone, /it/helpdesk is unlisted (its “Listed in search” switch is off) and prints the temp-password rule, and the public directory page lists the employee it still applies to. Together they make one login.",
            "",
            "That is what unlisted pages are for: dirhunter finds them, search does not. Change the rule on the page and change the account's password to match.",
        ].join("\n"),
        width: 340,
    });

    quest.graph = {
        nodes: [
            claim, load,
            network, brief,
            oSite, oPortal, oHunt, oRead, oShell, oGrab,
            t1.trigger, t2.trigger, t3.trigger, t4.trigger, t5.trigger, t6.trigger,
            scene, gotIt, chat, pay, note,
        ],
        edges: [
            makeEdge(claim, "out", network, "in"),
            makeEdge(network, "out", brief, "in"),
            makeEdge(oSite, "unlock", oPortal, "unlocked-by"),
            makeEdge(oPortal, "unlock", oHunt, "unlocked-by"),
            makeEdge(oHunt, "unlock", oRead, "unlocked-by"),
            makeEdge(oRead, "unlock", oShell, "unlocked-by"),
            makeEdge(oShell, "unlock", oGrab, "unlocked-by"),
            t1.edge, t2.edge, t3.edge, t4.edge, t5.edge, t6.edge,
            // taking the file plays the closing scene
            makeEdge(oGrab, "done", scene, "in"),
            makeEdge(scene, "step-s1", gotIt, "in"),
            makeEdge(scene, "step-s2", chat, "in"),
            makeEdge(scene, "step-s3", pay, "in"),
            // the chat is registered on load as well, so it survives a reload
            makeEdge(load, "out", chat, "in"),
        ],
    };

    applyLayout(quest);

    return createProject({
        mod: {
            id: "the-help-desk-leak",
            name: "The Help Desk Leak",
            version: "1.0.0",
            author: "",
            description:
                "A public site, a portal that refuses you, and an unlisted page dirhunter can find. The credential is assembled from two pages the agency published itself.",
            tags: ["quest", "web", "dirhunter", "osint", "ssh"],
            dependencies: [],
            minSdkVersion: "0.21.0",
            apiVersion: 1,
        },
        quests: [quest],
        websites: [
            {
                id: "site-naza",
                ...(() => {
                    const site = SITE_TEMPLATES.find((t) => t.id === "agency")!.make();
                    return {
                        host: site.host,
                        name: site.name,
                        pages: site.pages.map((page, i) => ({ id: `page-naza-${i + 1}`, ...page })),
                    };
                })(),
            },
        ],
        editor: { activeQuestId: quest.id, viewports: {} },
    });
}
