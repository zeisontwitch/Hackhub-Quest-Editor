/**
 * Dead Air — Advanced.
 *
 * A quest told entirely through how it talks to you: a phone brief,
 * e-mail drips released as each job is verified, a phreak loop (nmap, hydra,
 * cat), a Kisscord market where information is the currency, and a
 * social-engineering phone call with a real failure route — botch the line
 * and the quest ends on a different, cheaper ending. The "Two Ways Out"
 * shape (approved roadmap item) carried inside one call.
 *
 *   brief (phone)  →  nmap  →  hydra  →  cat  →  the call  →  the market  →
 *   the last mail  →  close (phone)  →  pay.
 *
 * The call's typed answer registers a terminal command the player uses to
 * answer (compiler info note); `wrongRoute: "wrong"` fires the node's
 * failure output, which is what makes the fail route a flow branch.
 */
import { createQuest, createProject, type ProjectDocument } from "@/schema/project";
import { TARGET_IP_TOKEN } from "@/schema/common";
import { applyLayout, makeEdge, makeNode, resetIds, triggerFor } from "@/templates/kit";

const IP = TARGET_IP_TOKEN;
const DOMAIN = "fennmark-freight.com";
const CLIENT = "i.marek@nullpost.io";
const BACKUP = "i.marek@quicksend.org";
const OPERATOR_NAME = "Kofi Mensah";
const LICENSE = "4471";
const EXTENSION = "2214";
const CODEWORD = "alpine";

export function buildDeadAir(): ProjectDocument {
    resetIds();
    const quest = createQuest({
        id: "q-dead-air",
        name: "DeadAir",
        closingObjectiveText: "The name is verified. The line goes dark.",
        title: "Dead Air",
        autoStart: true,
        description:
            "An unlisted line is running blackmail out of a freight company's PBX. Get the name off the line — and make it one you can prove.",
        group: "side",
        rewards: { money: 4600, xp: 260 },
        employer: { firstName: "Ilsa", lastName: "Marek", email: CLIENT },
    });

    /* ── the phone script: four branches, one quest ───────────────────── */

    quest.dialog = [
        {
            id: "b-brief",
            name: "default",
            lines: [
                {
                    id: "b1",
                    speaker: "Ilsa Marek",
                    text: "You have my number, so you know how this works. Ilsa Marek — corporate investigation. I find out what companies don't want found.",
                    isEnd: false,
                    options: [],
                },
                {
                    id: "b2",
                    speaker: "Ilsa Marek",
                    text: "There's an unlisted line running out of a freight company's call-centre PBX. Four months of blackmail, three victims. I have the recordings. I don't have a name.",
                    isEnd: false,
                    options: [],
                },
                {
                    id: "b3",
                    speaker: "Ilsa Marek",
                    text: "I work one piece at a time, and the next piece goes out when I've seen the last one done. That's not a test. That's the only way I work.",
                    isEnd: false,
                    options: [],
                },
                {
                    id: "b4",
                    speaker: "Ilsa Marek",
                    text: "The first piece is in your inbox. Read it when you're ready — the clock starts when you do.",
                    isEnd: true,
                    options: [],
                },
            ],
        },
        {
            /* The social-engineering call. The options line teaches
               in-call branching (the fault route loops back to the
               question); the typed answer is the hard check — a wrong
               word fires this node's failure output and the quest ends
               on the cheaper ending. */
            id: "b-gate",
            name: "gate",
            lines: [
                {
                    id: "g0",
                    speaker: "Operator",
                    text: "Fennmark Freight, operator line. All calls are monitored.",
                    isEnd: false,
                    options: [],
                },
                {
                    id: "g1",
                    speaker: "Operator",
                    text: "How can I help?",
                    isEnd: false,
                    options: [
                        { id: "g1a", label: "The night-shift transfer", text: "I'm here about the night-shift transfer.", nextIndex: 2, isEnd: false },
                        { id: "g1b", label: "Report a fault", text: "There's a fault on the line.", nextIndex: 4, isEnd: false },
                    ],
                },
                {
                    id: "g2",
                    speaker: "Operator",
                    text: "The supervisor only takes night-shift calls. Who's calling for?",
                    isEnd: false,
                    options: [],
                    input: {
                        expected: CODEWORD,
                        matchMode: "contains",
                        caseSensitive: false,
                        failureText: "",
                        wrongRoute: "wrong",
                    },
                },
                {
                    id: "g3",
                    speaker: "Operator",
                    text: "Alpine. Kofi Mensah — that's the name on that line. K. Mensah. That's all I'll say on a monitored call.",
                    isEnd: true,
                    options: [],
                },
                {
                    id: "g4",
                    speaker: "Operator",
                    text: "Faults go to 9110, not to me.",
                    isEnd: false,
                    options: [],
                },
                {
                    id: "g5",
                    speaker: "Operator",
                    text: "How can I help?",
                    isEnd: false,
                    options: [
                        { id: "g5a", label: "The night-shift transfer", text: "I'm here about the night-shift transfer.", nextIndex: 2, isEnd: false },
                        { id: "g5b", label: "Report a fault", text: "There's a fault on the line.", nextIndex: 4, isEnd: false },
                    ],
                },
            ],
        },
        {
            id: "b-close",
            name: "close",
            lines: [
                {
                    id: "c1",
                    speaker: "Ilsa Marek",
                    text: "Three days. I've seen it take a year.",
                    isEnd: false,
                    options: [],
                },
                {
                    id: "c2",
                    speaker: "Ilsa Marek",
                    text: "The name is with the people who need it, and the money's yours. The line goes dark tonight.",
                    isEnd: false,
                    options: [],
                },
                {
                    id: "c3",
                    speaker: "Ilsa Marek",
                    text: "Same number as always. You know how I work — one piece at a time.",
                    isEnd: true,
                    options: [],
                },
            ],
        },
        {
            id: "b-cut",
            name: "cut",
            lines: [
                {
                    id: "f1",
                    speaker: "Ilsa Marek",
                    text: "I heard it go quiet. Don't.",
                    isEnd: false,
                    options: [],
                },
                {
                    id: "f2",
                    speaker: "Ilsa Marek",
                    text: "I'm pulling out. Half the fee is on its way — and no second time.",
                    isEnd: true,
                    options: [],
                },
            ],
        },
    ];

    /* ── the world ────────────────────────────────────────────────────── */

    const network = makeNode("world.network", { x: 320, y: -260 }, {
        ipMode: "random",
        destroyOnComplete: false,
        /* One PBX, reachable directly: ssh in, and a routing config that
           hides the unlisted extension and the night-shift word. The admin
           password is the last word of the company motto the nmap banner
           shows ("rehearsal" — in the stock wordlist, proven by Six Tries). */
        device: {
            id: "dev-pbx",
            ip: IP,
            name: "fennmark-pbx",
            type: "DEVICE",
            domainName: DOMAIN,
            vulnerabilities: [],
            ports: [
                { id: "p-ssh", external: 22, internal: 22, active: true, locked: false, service: "ssh", version: "OpenSSH 8.2.0" },
                { id: "p-sip", external: 5060, internal: 5060, active: true, locked: false, service: "sip", version: "Asterisk 16.21.0" },
                { id: "p-http", external: 80, internal: 80, active: false, locked: false, service: "http", version: "nginx 1.14.2" },
            ],
            extraAccounts: false,
            users: [
                {
                    id: "u-admin",
                    username: "admin",
                    password: "rehearsal",
                    firstName: "Fennmark",
                    lastName: "Pbx Admin",
                    acceptReverseTCP: true,
                    files: [
                        {
                            id: "f-sip",
                            name: "sip-routing",
                            extension: "cfg",
                            isFolder: false,
                            data: [
                                "; Fennmark Freight — PBX routing table",
                                "; est. 1998 — renumbering is an ops-meeting matter",
                                "",
                                "[1001] dispatch (internal)",
                                "[1002] night-shift (internal)",
                                `[${EXTENSION}] unlisted`,
                                `  voicemail: ${EXTENSION}`,
                                "  note: night-shift handover, 22:00 sharp",
                                `  note: call for: ${CODEWORD}`,
                            ].join("\n"),
                        },
                    ],
                },
            ],
            rootFiles: [
                {
                    id: "f-logs",
                    name: "logs",
                    isFolder: true,
                    children: [
                        {
                            id: "f-syslog",
                            name: "sys",
                            extension: "log",
                            isFolder: false,
                            data: [
                                "pbx: 2214 unlisted 2026-03-12",
                                "night shift: handover 22:00",
                                "backup: wednesdays, 04:00",
                            ].join("\n"),
                        },
                    ],
                },
            ],
            files: [],
        },
    });

    const nmap = makeNode("world.toolResponse", { x: 640, y: -260 }, {
        command: "nmap",
        input: IP,
        dataText: [
            "PORT     STATE  SERVICE  VERSION",
            "22/tcp   open   ssh      OpenSSH 8.2.0",
            "5060/tcp open   sip      Asterisk 16.21.0",
            "80/tcp   closed http",
            "",
            "# pre-login MOTD:",
            "FENNMARK FREIGHT — every load, a rehearsal. est. 1998",
        ].join("\n"),
        removeOnComplete: true,
    });

    const hydra = makeNode("world.toolResponse", { x: 960, y: -260 }, {
        command: "hydra",
        inputUser: "admin",
        inputTarget: IP,
        dataText: "username: admin\npassword: rehearsal",
        removeOnComplete: true,
    });

    /* ── the phone brief and the drips ────────────────────────────────── */

    const claim = makeNode("entry.start", { x: 0, y: 0 });

    const callBrief = makeNode("comms.dialogue", { x: 320, y: 0 }, {
        kind: "phone",
        phone: { branch: "default", startIndex: 0, continueMode: "onEnd" },
    });

    const drip1 = makeNode("comms.dialogue", { x: 640, y: 0 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "First piece.",
            content: `Their PBX sits at ${IP}. Scan it — open ports, service versions, everything it says about itself. I want to know how it talks.\n\nnmap with -sV.`,
            replyable: false,
        },
    });

    const o1 = makeNode("objective", { x: 640, y: 220 }, {
        name: "scan-pbx",
        description: "Scan Fennmark's PBX",
        hint: "nmap with -sV reports the open ports and the versions — including the pre-login banner.",
        terminalCommand: `nmap ${IP} -sV`,
    });

    const t1 = triggerFor(o1, "Terminal.NmapScan", [{ field: "ip", op: "equals", value: IP }], { x: 960, y: 220 });

    const drip2 = makeNode("comms.dialogue", { x: 960, y: 0 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "Second piece.",
            content:
                "You found a box that answers. SSH runs on 22, user admin.\n\n" +
                "Their motto is in the pre-login banner you scanned. The last word of it is the password — set in 2009, never changed. Crack it so I know you're in.",
            replyable: false,
        },
    });

    const o2 = makeNode("objective", { x: 960, y: 440 }, {
        name: "crack-login",
        description: "Crack the PBX's ssh login",
        hint: `hydra -T ADDRESS:22 -P wordlist.lst -l admin. The last word of the banner motto is the password.`,
        terminalCommand: `hydra -T ${IP}:22 -P wordlist.lst -l admin`,
    });

    const t2 = triggerFor(o2, "Terminal.Hydra", [{ field: "credentials.username", op: "equals", value: "admin" }], { x: 1280, y: 440 });

    const drip3 = makeNode("comms.dialogue", { x: 1280, y: 0 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "Third piece.",
            content:
                "You're in. Read the routing config — the file with 'sip' in the name.\n\n" +
                `There's an extension in there that doesn't belong. Read it, then call it.`,
            replyable: false,
        },
    });

    const o3 = makeNode("objective", { x: 1280, y: 220 }, {
        name: "read-config",
        description: "Read the routing config",
        hint: `Log in first — ssh -h admin@ADDRESS with the cracked password. Then cat the file with 'sip' in the name.`,
        terminalCommand: "cat sip-routing.cfg",
    });

    const t3 = triggerFor(o3, "Terminal.Cat", [{ field: "name", op: "contains", value: "sip" }], { x: 1600, y: 220 });

    const drip4 = makeNode("comms.dialogue", { x: 1600, y: 0 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "Fourth piece.",
            content: `Call extension ${EXTENSION}. Get a name out of whoever answers — the config will tell you how to call for it.\n\nKeep it short. Those lines are monitored.`,
            replyable: false,
        },
    });

    /* ── the call: success and failure are flow branches ──────────────── */

    const callGate = makeNode("comms.dialogue", { x: 1920, y: 0 }, {
        kind: "phone",
        phone: { branch: "gate", startIndex: 0, continueMode: "onEnd" },
    });

    /* The failure route: the line goes dark, the client pulls out, and the
       quest ends on the cheaper ending. No retry — the fail route is a real
       branch (the "Two Ways Out" shape), and the quest never dead-ends. */
    const failDrip = makeNode("comms.dialogue", { x: 1920, y: 440 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "That was the wrong move.",
            content:
                "I heard it go quiet. The line's dark, and now he knows someone's knocking.\n\n" +
                "You don't get a second call. I'm sorry — that's the job.",
            replyable: false,
        },
    });

    const callCut = makeNode("comms.dialogue", { x: 2240, y: 440 }, {
        kind: "phone",
        phone: { branch: "cut", startIndex: 0, continueMode: "onEnd" },
    });

    const payFail = makeNode("fx.pay", { x: 2560, y: 440 }, {
        amountMode: "fixed",
        amount: 2300,
        description: "Half the fee — the line went dark",
        fromName: "I. Marek",
    });

    const closingFail = makeNode("fx.notify", { x: 2560, y: 660 }, {
        message: "The line went dark. Half the fee, and no second time.",
        variant: "toast",
        tone: "warning",
    });

    /* ── the market and the last piece ────────────────────────────────── */

    const drip5 = makeNode("comms.dialogue", { x: 2240, y: 0 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "A name isn't proof.",
            content:
                "Mensah. Good.\n\n" +
                "A name off a monitored line is a rumour, not proof. @wren on Kisscord verifies people for a living — expect a message from them. " +
                "They don't take money; they take what you've got. The extension is their price.",
            replyable: false,
        },
    });

    /* The Kisscord market: the chain pauses at the player's `send` message —
       the phreak loot is the price — and the broker's reply (the license
       number) plays only after. */
    const market = makeNode("comms.dialogue", { x: 2560, y: 0 }, {
        kind: "kisscord",
        kisscord: {
            contactId: "wren",
            messages: [
                {
                    id: "k1",
                    content: "Ilsa talks about you. You have a name off a phone line, and you want it to be true.",
                    isMine: false,
                    delayMs: 0,
                    playerAction: "none",
                    playerText: "",
                    unlocksAfter: [],
                },
                {
                    id: "k2",
                    content: "What's the line?",
                    isMine: false,
                    delayMs: 2400,
                    playerAction: "none",
                    playerText: "",
                    unlocksAfter: [],
                },
                {
                    id: "k3",
                    content: `Extension ${EXTENSION}, Fennmark Freight's PBX.`,
                    isMine: true,
                    delayMs: 0,
                    playerAction: "send",
                    playerText: `Extension ${EXTENSION}, Fennmark Freight's PBX.`,
                    unlocksAfter: [],
                },
                {
                    id: "k4",
                    content: `${EXTENSION}. I know that line. ${OPERATOR_NAME} — telecoms contractor, three firms, one trick. License ${LICENSE}. Don't ask me for it twice.`,
                    isMine: false,
                    delayMs: 1800,
                    playerAction: "none",
                    playerText: "",
                    unlocksAfter: [],
                },
            ],
        },
    });

    const drip6 = makeNode("comms.dialogue", { x: 2880, y: 0 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "Last piece.",
            content: `The full identity — the name and the license number — to my new address: ${BACKUP}. One line.\n\nThat closes the file.`,
            replyable: false,
        },
    });

    const o4 = makeNode("objective", { x: 2880, y: 220 }, {
        name: "verify-name",
        description: "Send the verified identity to Ilsa's new address",
        hint: `Name and license number, one line, to ${BACKUP}.`,
    });

    /* Two conditions: the right address AND the license number — which only
       exists in the broker's reply, so the market is load-bearing. */
    const t4 = triggerFor(
        o4,
        "Mail.Sent",
        [
            { field: "to", op: "contains", value: BACKUP },
            { field: "content", op: "contains", value: LICENSE },
        ],
        { x: 3200, y: 220 },
    );

    const callClose = makeNode("comms.dialogue", { x: 3200, y: 0 }, {
        kind: "phone",
        phone: { branch: "close", startIndex: 0, continueMode: "onEnd" },
    });

    const pay = makeNode("fx.pay", { x: 3520, y: 0 }, {
        amountMode: "fixed",
        amount: 4600,
        description: "The name, verified",
        fromName: "I. Marek",
    });

    const closing = makeNode("fx.notify", { x: 3520, y: 220 }, {
        message: "The name is verified. The line goes dark.",
        variant: "toast",
        tone: "success",
    });

    const note = makeNode("flow.note", { x: 0, y: 560 }, {
        text: [
            "ADVANCED. A quest told entirely through its communication modes — and a social-engineering call with a real failure route.",
            "",
            "The drip: each objective's done wire delivers the client's next piece, so the story paces itself. The brief, the drips and the close are phone scripts on the quest (four branches, one `dialog`); a node plays a named branch.",
            "",
            "The phreak loop: nmap (the banner carries the password — the last word of the company motto), hydra (Terminal.Hydra only carries credentials when the run succeeded, so a failed crack can't tick the objective), cat (the config hides the extension and the night-shift word).",
            "",
            "The call: the quest's script starts it (the engine has no player-dial event). The options line is in-call branching — the fault route loops back to the question. The typed answer registers a terminal command the player uses to answer, and wrongRoute `wrong` fires this node's failure output: the fail route is a flow branch that ends the quest on the cheaper ending. That is the 'Two Ways Out' shape, carried inside one call.",
            "",
            "The market: a Kisscord chain that pauses until the player types the send message — information for information, no money system. The license number only exists in the broker's reply, so the last trigger needs both its conditions: the right address AND the number.",
        ].join("\n"),
        width: 340,
    });

    quest.graph = {
        nodes: [
            claim,
            network, nmap, hydra,
            callBrief, drip1, o1, t1.trigger,
            drip2, o2, t2.trigger,
            drip3, o3, t3.trigger,
            drip4, callGate,
            failDrip, callCut, payFail, closingFail,
            drip5, market, drip6, o4, t4.trigger,
            callClose, pay, closing,
            note,
        ],
        edges: [
            // build the world once, on claim
            makeEdge(claim, "out", network, "in"),
            makeEdge(network, "out", nmap, "in"),
            makeEdge(nmap, "out", hydra, "in"),
            // the brief, then the drip chain
            makeEdge(hydra, "out", callBrief, "in"),
            makeEdge(callBrief, "out", drip1, "in"),
            makeEdge(drip1, "out", o1, "in"),
            t1.edge,
            makeEdge(o1, "done", drip2, "in"),
            makeEdge(o1, "unlock", o2, "unlocked-by"),
            t2.edge,
            makeEdge(o2, "done", drip3, "in"),
            makeEdge(o2, "unlock", o3, "unlocked-by"),
            t3.edge,
            makeEdge(o3, "done", drip4, "in"),
            makeEdge(drip4, "out", callGate, "in"),
            // the call: out = the name, failure = the line goes dark
            makeEdge(callGate, "out", drip5, "in"),
            makeEdge(callGate, "failure", failDrip, "in"),
            makeEdge(failDrip, "out", callCut, "in"),
            makeEdge(callCut, "out", payFail, "in"),
            makeEdge(payFail, "out", closingFail, "in"),
            // the market, then the last piece
            makeEdge(drip5, "out", market, "in"),
            makeEdge(market, "out", drip6, "in"),
            makeEdge(drip6, "out", o4, "in"),
            t4.edge,
            makeEdge(o4, "done", callClose, "in"),
            makeEdge(callClose, "out", pay, "in"),
            makeEdge(pay, "out", closing, "in"),
        ],
    };

    applyLayout(quest);

    return createProject({
        mod: {
            id: "dead-air",
            name: "Dead Air",
            version: "1.0.0",
            author: "",
            description: quest.description,
            tags: ["quest", "phone", "phreaking", "social-engineering", "kisscord", "advanced"],
            dependencies: [],
            minSdkVersion: "0.21.0",
            apiVersion: 1,
        },
        quests: [quest],
        editor: { activeQuestId: quest.id, viewports: {} },
    });
}
