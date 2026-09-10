/**
 * The Long Game — Expert.
 *
 * The campaign template: three acts in ONE mod, chained with the
 * "Claim another quest" node (the runtime's Quest.claim). Act 1 is a public
 * trail that names a founder; act 2 is the break-in it earns (scan, exploit,
 * take the file); act 3 ends in a choice the player types at a terminal
 * prompt, with two different endings — the branching-ending shape.
 *
 * Why every act builds its own stage: each quest rolls its OWN {{data.*}}
 * tokens (its own CreateData), so a sequel quest cannot address act 1's
 * random IP even when the world is still standing. Cross-act references go
 * by DOMAIN name — or, as here, each act simply ships its own stage and the
 * story carries the baton. This works no matter how long the game keeps
 * earlier worlds alive; that is being verified in-game separately (QA list).
 */
import { createQuest, createProject, type ProjectDocument } from "@/schema/project";
import { makeEdge, makeNode, resetIds, triggerFor } from "@/templates/kit";
import { wrapFragment } from "@/editor/websites/pageDoc";

const SITE = "halvard-freight.net";
const ARCHIVE = "archive.halvard-freight.test";
const IP = "{{data.targetIp}}";
const FILE = "manifest_1998";
const CLIENT = "r.sartorius@nullpost.io";
const VANN = "h.vann@nullpost.io";

export function buildLongGame(): ProjectDocument {
    resetIds();

    /* ── Act 1 — The Tail ─────────────────────────────────────────────── */

    const act1 = createQuest({
        id: "q-long-game-1",
        name: "LongGameAct1",
        title: "The Long Game — Act I: The Tail",
        closingObjectiveText: "You knew where to look. Someone noticed.",
        autoStart: true,
        description:
            "Act I of III. A client wants dirt on a freight firm that folded in 1998. The trail is public: read the site, find the founder's name.",
        group: "side",
        rewards: { money: 0, xp: 30 },
        employer: { firstName: "Rhea", lastName: "Sartorius", email: CLIENT },
    });

    const claim1 = makeNode("entry.start", { x: 0, y: 0 });

    const brief1 = makeNode("comms.dialogue", { x: 320, y: 0 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "Halvard Freight, 1998",
            content:
                "Halvard Freight folded in 1998 and everyone involved got quiet. I represent people who were owed money by that firm, and I am told its founder, H. Vann, kept the only honest ledger of what was moved.\n\n" +
                `The firm's old site is still up — ${SITE}. Read the about page and confirm who the founder was. No break-ins; I need a name verified, not a war.\n\n` +
                "Do this discreetly and there is a larger job in it.",
            replyable: false,
        },
    });

    const oBrief = makeNode("objective", { x: 640, y: 40 }, {
        name: "read-brief",
        description: "Read the client's brief",
        hint: "The envelope icon in your mail app.",
    });
    const oAbout = makeNode("objective", { x: 960, y: 40 }, {
        name: "read-the-about-page",
        description: "Read the firm's about page",
        hint: `Open ${SITE} in the browser and find the page about the company itself.`,
        terminalCommand: "",
    });
    const oFounder = makeNode("objective", { x: 1280, y: 40 }, {
        name: "verify-the-founder",
        description: "Verify the founder's name",
        hint: "The about page credits an article. lynx looks people up by name.",
        terminalCommand: `lynx "H. Vann"`,
    });

    const tBrief = triggerFor(oBrief, "Mail.Read", [
        { field: "subject", op: "contains", value: "Halvard Freight, 1998" },
    ], { x: 640, y: 200 });
    const tAbout = triggerFor(oAbout, "Browser.WebsiteOpened", [
        { field: "url", op: "contains", value: "/about" },
    ], { x: 960, y: 200 });
    const tFounder = triggerFor(oFounder, "Terminal.Lynx.Search", [
        { field: "query", op: "contains", value: "Vann" },
    ], { x: 1280, y: 200 });

    const vann1 = makeNode("comms.dialogue", { x: 1600, y: 0 }, {
        kind: "mail",
        mail: {
            from: VANN,
            subject: "You've been asking about Halvard",
            content:
                "I still get the alerts for my own name. Most of what is written about Halvard Freight is wrong, but you are at least asking the right first question.\n\n" +
                "The ledger your client wants exists. It also implicates someone your client would rather it did not. When you are ready to hear that part, say the word — the archive box is still up. I will send the address.\n\n" +
                "— H.V.",
            replyable: false,
        },
    });

    const claim2 = makeNode("fx.claimQuest", { x: 1920, y: 0 }, {
        questName: "LongGameAct2",
    });

    const notify1 = makeNode("fx.notify", { x: 2240, y: 0 }, {
        message: "Act I closes. The archive is waiting.",
        variant: "toast",
        tone: "success",
    });

    const note1 = makeNode("flow.note", { x: 320, y: 420 }, {
        text: [
            "EXPERT. The campaign template — three acts in one mod.",
            "",
            "This is act 1 of 3. The last wire of each act runs the 'Claim another quest' node, which starts the next act by name (LongGameAct2, LongGameAct3). Only act 1 has Start automatically turned on; the other two are claimed.",
            "",
            "Every act builds its own stage, because each quest rolls fresh {{data.*}} tokens — a sequel quest cannot address act 1's random IP even if the world is still standing. To reference another act's machines, use their DOMAIN name, never another quest's tokens.",
            "",
            "Act 2 is the break-in (scan, exploit, take the file). Act 3 is the choice: a typed verdict with two different endings.",
        ].join("\n"),
        width: 340,
    });

    act1.graph = {
        nodes: [claim1, brief1, oBrief, oAbout, oFounder, tBrief.trigger, tAbout.trigger, tFounder.trigger, vann1, claim2, notify1, note1],
        edges: [
            makeEdge(claim1, "out", brief1, "in"),
            makeEdge(oBrief, "unlock", oAbout, "unlocked-by"),
            makeEdge(oAbout, "unlock", oFounder, "unlocked-by"),
            makeEdge(oFounder, "done", vann1, "in"),
            makeEdge(vann1, "out", claim2, "in"),
            makeEdge(claim2, "out", notify1, "in"),
            tBrief.edge,
            tAbout.edge,
            tFounder.edge,
        ],
    };

    /* ── Act 2 — The Maintenance Window ───────────────────────────────── */

    const act2 = createQuest({
        id: "q-long-game-2",
        name: "LongGameAct2",
        title: "The Long Game — Act II: The Maintenance Window",
        closingObjectiveText: "Out with the ledger, in and out.",
        autoStart: false,
        description:
            "Act II of III. Vann names the box: the firm's archive server, still answering after all these years, running software older than the grudge.",
        group: "side",
        rewards: { money: 0, xp: 30 },
        employer: { firstName: "Hedda", lastName: "Vann", email: VANN },
    });

    const claimA = makeNode("entry.start", { x: 0, y: 0 });

    const tip2 = makeNode("comms.dialogue", { x: 320, y: 0 }, {
        kind: "mail",
        mail: {
            from: VANN,
            subject: "The archive box",
            content:
                `The ledger never left the company archive: ${ARCHIVE}. The box is still plugged in — nobody upstairs knew it existed, and nobody downstairs cared enough to unplug it.\n\n` +
                "It runs old FTP server software with a version number you could put in a museum. Scan it, let metasploit see the banner, and pull the file called manifest_1998.\n\n" +
                "One condition: you take the ledger, and nothing else. Read it before you decide who deserves it.\n\n" +
                "— H.V.",
            replyable: false,
        },
    });

    const network2 = makeNode("world.network", { x: 640, y: 0 }, {
        ipMode: "random",
        destroyOnComplete: false,
        device: {
            id: "dev-archive",
            ip: IP,
            name: "halvard-archive",
            type: "DEVICE",
            domainName: ARCHIVE,
            vulnerabilities: [],
            ports: [
                { id: "p-ftp", external: 21, internal: 21, active: true, locked: false, service: "ftp", version: "ProFTPD 1.3.5" },
            ],
            extraAccounts: false,
            users: [
                {
                    id: "u-archivist",
                    username: "archivist",
                    password: "Halvard-1998",
                    firstName: "Halvard",
                    lastName: "Archive",
                    acceptReverseTCP: true,
                    files: [
                        {
                            id: "f-manifest",
                            name: FILE,
                            extension: "csv",
                            isFolder: false,
                            data: [
                                "container,origin,declared,actual,signed-off",
                                "HV-0104,Gdansk,machine parts,weapons crates,H. Vann",
                                "HV-0119,Rotterdam,textiles,textiles,-",
                                "HV-0133,Odessa,textiles,weapons crates,R. Sartorius",
                                "HV-0150,Gdansk,machine parts,machine parts,-",
                            ].join("\n"),
                        },
                        {
                            id: "f-readme",
                            name: "readme",
                            extension: "txt",
                            isFolder: false,
                            data: "Archive box. Offline since the liquidation. Do not delete anything — legal said keep everything. - M.",
                        },
                    ],
                },
            ],
            rootFiles: [],
        },
    });

    const nmap2 = makeNode("world.toolResponse", { x: 960, y: 0 }, {
        command: "nmap",
        input: `${IP} -sV`,
        dataText: [
            `PORT   STATE SERVICE VERSION`,
            `21/tcp open  ftp     ProFTPD 1.3.5`,
            ``,
            `Service detection performed. 1 service on ${IP} (${ARCHIVE}).`,
        ].join("\n"),
        removeOnComplete: true,
    });

    const oScan = makeNode("objective", { x: 1280, y: 40 }, {
        name: "scan-the-archive",
        description: "See what the archive box is running",
        hint: "nmap with -sV reports versions as well as open ports.",
        terminalCommand: `nmap ${IP} -sV`,
    });
    const oIn = makeNode("objective", { x: 1600, y: 40 }, {
        name: "get-into-the-archive",
        description: "Get into the archive box",
        hint: "An FTP server that old is metasploit's territory — set the version the scan reported.",
        terminalCommand: "msfconsole",
    });
    const oTake = makeNode("objective", { x: 1920, y: 40 }, {
        name: "take-the-ledger",
        description: "Download manifest_1998",
        hint: "You are in as the archivist. Download the file from the session.",
    });

    const tScan = triggerFor(oScan, "Terminal.NmapScan", [
        { field: "ip", op: "equals", value: IP },
    ], { x: 1280, y: 240 });
    const tIn = triggerFor(oIn, "Metasploit.Meterpreter.Connected", [
        { field: "ip", op: "equals", value: IP },
    ], { x: 1600, y: 240 });
    const tTake = triggerFor(oTake, "Meterpreter.Download", [
        { field: "file.name", op: "contains", value: FILE },
    ], { x: 1920, y: 240 });

    const vann2 = makeNode("comms.dialogue", { x: 2240, y: 0 }, {
        kind: "mail",
        mail: {
            from: VANN,
            subject: "Now you have read it",
            content:
                "Then you know what your client signed off on. Sartorius does not want the ledger found — Sartorius wants it BURIED, and you were the shovel.\n\n" +
                "Two ways this goes. Give Sartorius the file and the past stays tidy, or bring it to me and the families who were owed finally see it. I will not tell you which pays better; I will tell you which one I am paying for.\n\n" +
                "Reply with your verdict at the terminal — type verdict and then the word.\n\n" +
                "— H.V.",
            replyable: false,
        },
    });

    const claim3 = makeNode("fx.claimQuest", { x: 2560, y: 0 }, {
        questName: "LongGameAct3",
    });

    const notify2 = makeNode("fx.notify", { x: 2880, y: 0 }, {
        message: "Act II closes. The verdict is yours.",
        variant: "toast",
        tone: "success",
    });

    const note2 = makeNode("flow.note", { x: 640, y: 420 }, {
        text: [
            "Act 2 — the break-in act. A single old server: scan it, exploit the banner with metasploit, download the ledger from the session.",
            "",
            "The same skeleton as the Harbour Manifest, kept small on purpose — a campaign act should be one sitting. The chain: 'Claim another quest' at the end of act 1 started this quest by its name (LongGameAct2, on the quest's own canvas).",
            "",
            "This box's address is THIS quest's {{data.targetIp}}. Act 1 could not have scanned it by token — different quest, different roll. The story carries the address between acts; the tokens never could.",
        ].join("\n"),
        width: 340,
    });

    act2.graph = {
        nodes: [claimA, tip2, network2, nmap2, oScan, oIn, oTake, tScan.trigger, tIn.trigger, tTake.trigger, vann2, claim3, notify2, note2],
        edges: [
            makeEdge(claimA, "out", tip2, "in"),
            makeEdge(tip2, "out", network2, "in"),
            makeEdge(network2, "out", nmap2, "in"),
            makeEdge(oScan, "unlock", oIn, "unlocked-by"),
            makeEdge(oIn, "unlock", oTake, "unlocked-by"),
            makeEdge(oTake, "done", vann2, "in"),
            makeEdge(vann2, "out", claim3, "in"),
            makeEdge(claim3, "out", notify2, "in"),
            tScan.edge,
            tIn.edge,
            tTake.edge,
        ],
    };

    /* ── Act 3 — The Choice ───────────────────────────────────────────── */

    const act3 = createQuest({
        id: "q-long-game-3",
        name: "LongGameAct3",
        title: "The Long Game — Act III: The Choice",
        closingObjectiveText: "The verdict is in.",
        autoStart: false,
        description:
            "Act III of III. You hold the ledger and you know what it says about both people who want it. Type your verdict.",
        group: "side",
        rewards: { money: 0, xp: 40 },
        employer: { firstName: "Hedda", lastName: "Vann", email: VANN },
    });

    const claimB = makeNode("entry.start", { x: 0, y: 0 });

    const choice3 = makeNode("comms.dialogue", { x: 320, y: 0 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "My file, when you have it",
            content:
                "I will pay the balance the moment you hand the ledger over. Do not be delayed by whoever wrote to you last night — the woman has carried a grudge longer than she carried a ledger, and grudges always price themselves in drama.\n\n" +
                "The file, the balance, and we are done.\n\n" +
                "— R. Sartorius",
            replyable: false,
        },
    });

    const verdict = makeNode("reply.input", { x: 640, y: 0 }, {
        commandName: "verdict",
        commandDescription: "Decide who gets the Halvard ledger",
        prompt: "Your verdict — expose or bury >",
        mask: false,
        matchMode: "contains",
        expected: "expose",
        caseSensitive: false,
        successMessage: "You have given this to me. It runs tonight. — H.V.",
        failureMessage: "Then it stays buried, and you were never asked. — H.V.",
    });

    const exposeMail = makeNode("comms.dialogue", { x: 960, y: -220 }, {
        kind: "mail",
        mail: {
            from: VANN,
            subject: "It runs tonight",
            content:
                "The whole ledger, unedited, went to three outlets an hour ago. Sartorius's signature is on line four of the Odessa entries; that part is no longer my problem, and soon it will not be yours.\n\n" +
                "The families' lawyer has your fee from the sale of what was recovered. You were the only one in this story who read the file before cashing a cheque.\n\n" +
                "— H.V.",
            replyable: false,
        },
    });
    const payExpose = makeNode("fx.pay", { x: 1280, y: -220 }, {
        amount: 1400,
        description: "The Long Game — the ledger runs",
        fromName: "H. Vann",
    });
    const notifyExpose = makeNode("fx.notify", { x: 1600, y: -220 }, {
        message: "The Long Game is over. The ledger is public.",
        variant: "toast",
        tone: "success",
    });

    const buryMail = makeNode("comms.dialogue", { x: 960, y: 220 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "Received, and appreciated",
            content:
                "The file matches our records. An unfortunate era, handled discreetly at last. Your balance is transferred and the matter is closed.\n\n" +
                "We will be in touch the next time history needs a hand.\n\n" +
                "— R. Sartorius",
            replyable: false,
        },
    });
    const payBury = makeNode("fx.pay", { x: 1280, y: 220 }, {
        amount: 900,
        description: "The Long Game — the ledger buried",
        fromName: "R. Sartorius",
    });
    const notifyBury = makeNode("fx.notify", { x: 1600, y: 220 }, {
        message: "The Long Game is over. The ledger is buried.",
        variant: "toast",
        tone: "success",
    });

    const note3 = makeNode("flow.note", { x: 320, y: 460 }, {
        text: [
            "Act 3 — the branching ending. One typed verdict, two different payouts.",
            "",
            "The 'reply.input' node pauses the story at a terminal prompt until the player answers. It carries TWO wires: success (the answer contains 'expose') and failure (anything else) — each wire is a different ending with its own mail and its own pay.",
            "",
            "This is the shape of a choice that changes the story. The 'failure' wire is not a mistake path here — it is the other decision. If you need a fail state instead, put a retry hint on that wire rather than a payout.",
            "",
            "Every act still ends from its own last beat — no formal completion, a closing line each time. That is the engine rule, even three acts deep.",
        ].join("\n"),
        width: 340,
    });

    act3.graph = {
        nodes: [claimB, choice3, verdict, exposeMail, payExpose, notifyExpose, buryMail, payBury, notifyBury, note3],
        edges: [
            makeEdge(claimB, "out", choice3, "in"),
            makeEdge(choice3, "out", verdict, "in"),
            makeEdge(verdict, "success", exposeMail, "in"),
            makeEdge(exposeMail, "out", payExpose, "in"),
            makeEdge(payExpose, "out", notifyExpose, "in"),
            makeEdge(verdict, "failure", buryMail, "in"),
            makeEdge(buryMail, "out", payBury, "in"),
            makeEdge(payBury, "out", notifyBury, "in"),
        ],
    };

    return createProject({
        mod: {
            id: "the-long-game",
            name: "The Long Game",
            version: "1.0.0",
            author: "",
            description: act1.description,
            tags: ["quest", "campaign", "three-acts", "branching", "expert"],
            dependencies: [],
            minSdkVersion: "0.21.0",
            apiVersion: 1,
        },
        quests: [act1, act2, act3],
        websites: [
            {
                id: "site-halvard",
                host: SITE,
                name: "Halvard Freight (archived)",
                pages: [
                    {
                        id: "page-halvard-1",
                        path: "/",
                        title: "Halvard Freight",
                        seo: true,
                        template: "long-game-home",
                        content: wrapFragment(
                            `<header class="site">HALVARD FREIGHT — archived</header>` +
                                `<h1>Halvard Freight AB (1981–1998)</h1>` +
                                `<p>This site is kept as a record. Halvard Freight ceased operations in 1998; the company, its routes and its disputes are matters of public record.</p>` +
                                `<p>For company history, see <a href="/about">about the firm</a>. For business inquiries there is no one left to answer.</p>`,
                            "Halvard Freight",
                        ),
                    },
                    {
                        id: "page-halvard-2",
                        path: "/about",
                        title: "About the firm",
                        seo: true,
                        template: "long-game-about",
                        content: wrapFragment(
                            `<header class="site">HALVARD FREIGHT — archived</header>` +
                                `<h1>About the firm</h1>` +
                                `<p>Halvard Freight was founded in 1981 by <strong>H. Vann</strong>, who ran the Baltic routes for seventeen years and signed every manifest personally until the liquidation.</p>` +
                                `<p>An oral history of the last season — <em>"The night gap: what the harbour unloads after two in the morning"</em> — was published by a former dispatcher and remains the only first-hand account.</p>` +
                                `<p>The liquidation's unsecured creditors are still owed 2.1 million kr. The founder has never spoken about the final manifests on the record.</p>`,
                            "About the firm",
                        ),
                    },
                ],
            },
        ],
    });
}
