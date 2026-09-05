/**
 * Starter templates.
 *
 * Each is a plain `ProjectDocument` factory, which means the templates are
 * themselves exercised by the compiler test suite (docs/01 §5). Ids are generated
 * deterministically so a template builds byte-identically every time and snapshot
 * tests stay stable.
 */
import { createProject, createQuest, type ProjectDocument } from "@/schema/project";
import { TARGET_IP_TOKEN } from "@/schema/common";
import { NODE_TYPES_REGISTRY, nodeTypeDef, sourcesOf } from "@/schema/registry";
import type { NodeDoc, NodeType } from "@/schema/nodes";
import type { EdgeDoc } from "@/schema/edges";
import { layeredLayout } from "@/analysis/graph";
import { SITE_TEMPLATES } from "@/templates/pages";

let counter = 0;
function resetIds() {
    counter = 0;
}
function tid(prefix: string): string {
    counter += 1;
    return `${prefix}${counter}`;
}

/* ── graph builders ──────────────────────────────────────────────────────── */

function makeNode(
    type: NodeType,
    position: { x: number; y: number },
    data?: Record<string, unknown>,
): NodeDoc {
    const def = nodeTypeDef(type);
    return {
        id: tid(type.replace(/\./g, "-")),
        type,
        position,
        data: { ...def.create(), ...(data ?? {}) },
    } as unknown as NodeDoc;
}

function makeEdge(
    source: NodeDoc,
    sourceHandle: string,
    target: NodeDoc,
    targetHandle: string,
): EdgeDoc {
    /* Sockets are resolved the way the canvas resolves them, so a Sequence
       node's per-step outputs (step-<id>) are wireable from a template too. */
    const sourceKind = sourcesOf(source).find((h) => h.id === sourceHandle)?.kind;
    const targetKind = nodeTypeDef(target.type).targets.find((h) => h.id === targetHandle)?.kind;
    if (!sourceKind || sourceKind !== targetKind) {
        throw new Error(
            `Template bug: cannot connect ${source.type}.${sourceHandle} (${sourceKind ?? "none"}) to ${target.type}.${targetHandle} (${targetKind ?? "none"})`,
        );
    }
    return {
        id: tid("edge"),
        source: source.id,
        sourceHandle,
        target: target.id,
        targetHandle,
        kind: sourceKind,
    };
}

/**
 * Run the same deterministic layered layout the canvas' "Tidy up" button uses, so
 * a template never opens with two cards on top of each other. Only applied when
 * the graph has wires — the reference sheet is a deliberate grid.
 */
function applyLayout(quest: ReturnType<typeof createQuest>): void {
    if (quest.graph.edges.length === 0) return;
    const positions = layeredLayout(quest.graph.nodes, quest.graph.edges);
    for (const node of quest.graph.nodes) {
        const position = positions[node.id];
        if (position) node.position = position;
    }
}

/** A trigger wired to the objective it completes — the most common pair. */
function triggerFor(
    objective: NodeDoc,
    event: string,
    conditions: { field: string; op: string; value: string; join?: "and" | "or" }[],
    position: { x: number; y: number },
): { trigger: NodeDoc; edge: EdgeDoc } {
    const trigger = makeNode("trigger.event", position, {
        /* join defaults to "and"; a clause can ask for "or" when either of two
           values should count — e.g. scanning the router or the machine
           behind it. */
        conditions: conditions.map((c, i) => ({ id: `c${i + 1}`, join: c.join ?? "and", ...c })),
        event,
    });
    return { trigger, edge: makeEdge(trigger, "when", objective, "trigger") };
}

/* ── templates ───────────────────────────────────────────────────────────── */

export interface Template {
    id: string;
    name: string;
    description: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced" | "Reference";
    nodeCount: number;
    build: () => ProjectDocument;
}

/**
 * The four lifecycle entry points and nothing else.
 *
 * They are deliberately *not* wired to each other — they are independent roots,
 * and starting from a template that already shows them unconnected teaches that
 * before it becomes a confusing bug.
 */
function buildBlank(): ProjectDocument {
    resetIds();
    const quest = createQuest({ id: "q-blank", name: "NewQuest", title: "New Quest", autoStart: true });
    const claim = makeNode("entry.start", { x: 0, y: 0 });
    const load = makeNode("entry.load", { x: 0, y: 150 });
    const complete = makeNode("entry.complete", { x: 0, y: 300 });
    const abandon = makeNode("entry.abandon", { x: 0, y: 450 });
    const note = makeNode("flow.note", { x: 300, y: 0 }, {
        text: "Each node on the left is an independent starting point.\n\nDrag from the palette onto the canvas, then pull from a coloured dot on the right of one node to a dot on the left of another.\n\nDelete this note when you are done reading it.",
        width: 300,
    });
    quest.graph = { nodes: [claim, load, complete, abandon, note], edges: [] };
    return createProject({ quests: [quest], editor: { activeQuestId: quest.id, viewports: {} } });
}

/** One objective completed by one nmap scan, then a payout. The 60-second tour. */
function buildHelloHack(): ProjectDocument {
    resetIds();
    const quest = createQuest({
        id: "q-hello-hack",
        name: "HelloHack",
        closingObjectiveText: "Target scanned. That is the whole job.",
        title: "Hello Hack",
        /* A template has to be playable the moment it is exported: without
           this (or a Hackhub feed post) nothing can ever claim the quest. */
        autoStart: true,
        description: "Scan a target and collect the bounty.",
        rewards: { money: 500, xp: 25 },
    });

    // Only the entry points this quest actually uses. An empty lifecycle node is
    // noise a beginner has to reason about.
    const claim = makeNode("entry.start", { x: 0, y: 0 });
    const complete = makeNode("entry.complete", { x: 0, y: 300 });

    const notify = makeNode("fx.notify", { x: 300, y: 0 }, {
        message: "New job: scan 45.33.32.156 and report back.",
        variant: "toast",
        tone: "info",
    });
    const objective = makeNode("objective", { x: 620, y: 150 }, {
        name: "scan-target",
        description: "Scan 45.33.32.156 with nmap",
        hint: "Open a terminal and run nmap 45.33.32.156",
        terminalCommand: "nmap 45.33.32.156",
    });
    const pay = makeNode("fx.pay", { x: 300, y: 300 }, {
        amount: 500,
        description: "Recon bounty",
        fromName: "Anonymous Client",
    });

    const scan = triggerFor(
        objective,
        "Terminal.NmapScan",
        [{ field: "ip", op: "equals", value: "45.33.32.156" }],
        { x: 300, y: 150 },
    );

    quest.graph = {
        nodes: [claim, complete, notify, objective, pay, scan.trigger],
        edges: [
            makeEdge(claim, "out", notify, "in"),
            makeEdge(complete, "out", pay, "in"),
            scan.edge,
        ],
    };

    applyLayout(quest);

    return createProject({ quests: [quest], editor: { activeQuestId: quest.id, viewports: {} } });
}

/**
 * The beginner Wi-Fi quest: recon the air, crack the passphrase with fern, join
 * the network, then get paid. A straight line with no branches, so the shape of
 * the graph matches the shape of the story.
 */
function buildWifiHack(): ProjectDocument {
    resetIds();
    const quest = createQuest({
        id: "q-wifi-hack",
        name: "NeighbourWifi",
        closingObjectiveText: "You are on the network. Nobody noticed.",
        title: "The Neighbour's Wi-Fi",
        /* A template has to be playable the moment it is exported: without
           this (or a Hackhub feed post) nothing can ever claim the quest. */
        autoStart: true,
        description: "Crack the access point next door and see what is on the network.",
        group: "side",
        rewards: { money: 2500, xp: 120 },
    });

    const claim = makeNode("entry.start", { x: 0, y: 0 });
    const complete = makeNode("entry.complete", { x: 0, y: 600 });

    const briefing = makeNode("comms.dialogue", { x: 300, y: 0 }, {
        kind: "mail",
        mail: {
            from: "handler@anon.mail",
            subject: "Small job — the apartment next door",
            content:
                "There is an access point called NEIGHBOUR_5Ghz two walls away. Get on it, then get onto the machine behind it. Payment on delivery.",
            replyable: false,
        },
    });

    const wifi = makeNode("world.wifi", { x: 600, y: 0 }, {
        ssid: "NEIGHBOUR_5Ghz",
        password: "letmein123",
        signal: 3,
        model: "TP-Link Archer C6",
    });

    const recon = makeNode("objective", { x: 900, y: 150 }, {
        name: "recon",
        description: "Scan the air for access points with bettercap",
        hint: "Open bettercap and run wifi.recon",
        terminalCommand: "bettercap",
    });
    const crack = makeNode("objective", { x: 900, y: 300 }, {
        name: "crack-passphrase",
        description: "Recover the WPA passphrase",
        hint: "The router model is printed on its admin page. fern can recover a passphrase from it.",
        terminalCommand: 'fern "TP-Link Archer C6"',
    });
    const join = makeNode("objective", { x: 900, y: 450 }, {
        name: "join-network",
        description: "Join NEIGHBOUR_5Ghz",
        hint: "Connect with the passphrase you recovered.",
    });

    const pay = makeNode("fx.pay", { x: 300, y: 600 }, {
        amount: 2500,
        description: "Wi-Fi job",
        fromName: "Anonymous Client",
    });

    const t1 = triggerFor(recon, "Bettercap.WifiRecon", [], { x: 600, y: 150 });
    const t2 = triggerFor(
        crack,
        "Fern.FindPassword",
        [{ field: "model", op: "equals", value: "TP-Link Archer C6" }],
        { x: 600, y: 300 },
    );
    const t3 = triggerFor(
        join,
        "Network.WifiConnected",
        [{ field: "ssid", op: "equals", value: "NEIGHBOUR_5Ghz" }],
        { x: 600, y: 450 },
    );

    quest.graph = {
        nodes: [
            claim,
            complete,
            briefing,
            wifi,
            recon,
            crack,
            join,
            pay,
            t1.trigger,
            t2.trigger,
            t3.trigger,
        ],
        edges: [
            makeEdge(claim, "out", briefing, "in"),
            makeEdge(briefing, "out", wifi, "in"),
            // Prerequisites: each objective unlocks the next.
            makeEdge(recon, "unlock", crack, "unlocked-by"),
            makeEdge(crack, "unlock", join, "unlocked-by"),
            makeEdge(complete, "out", pay, "in"),
            t1.edge,
            t2.edge,
            t3.edge,
        ],
    };

    applyLayout(quest);

    return createProject({
        mod: {
            id: "neighbour-wifi",
            name: "The Neighbour's Wi-Fi",
            version: "1.0.0",
            author: "",
            description: "A beginner Wi-Fi cracking quest for HackHub.",
            tags: ["quest", "wifi", "beginner"],
            dependencies: [],
            minSdkVersion: "0.21.0",
            apiVersion: 1,
        },
        quests: [quest],
        editor: { activeQuestId: quest.id, viewports: {} },
    });
}

/**
 * The flagship: a branching investigation across a corporate network, a website
 * with a hidden page, four communication channels, and a real decision point.
 *
 * Two objectives can be completed in either order; a branch then splits on what
 * the player actually found, and a manual passphrase gates the ending.
 */
function buildInvestigation(): ProjectDocument {
    resetIds();
    const quest = createQuest({
        id: "q-investigation",
        name: "LedgerJob",
        closingObjectiveText: "Ledger recovered and the client has it.",
        title: "The Ledger Job",
        description:
            "A whistleblower wants a set of books out of Meridian Capital's internal network. Two ways in, and only one of them is quiet.",
        group: "side",
        /* A template has to be playable the moment it is exported: without
           this (or a Hackhub feed post) nothing can ever claim the quest. */
        autoStart: true,
        rewards: { money: 18000, xp: 640 },
        dataKeys: [
            { key: "targetIp", type: "string" },
            { key: "route", type: "string" },
        ],
    });

    /* ── lifecycle ──────────────────────────────────────────────────────── */
    const claim = makeNode("entry.start", { x: 0, y: 0 });
    const load = makeNode("entry.load", { x: 0, y: 450 });
    const complete = makeNode("entry.complete", { x: 0, y: 900 });
    const abandon = makeNode("entry.abandon", { x: 0, y: 1050 });

    /* ── world, built once at claim ─────────────────────────────────────── */
    const network = makeNode("world.network", { x: 320, y: 0 }, {
        ipMode: "random",
        destroyOnComplete: false,
        device: {
        id: "router1",
        ip: "10.0.0.1",
        type: "ROUTER",
        model: "Netgear Nighthawk R7000",
        vulnerabilities: [{ id: "v1", type: "SQL_INJECTION", version: "Apache 2.4.41" }],
        users: [
            { id: "u1", username: "admin", password: "changeme", firstName: "Site", lastName: "Admin", emailAddress: "admin@meridian-capital.net" },
        ],
        ports: [
            { id: "p1", external: 22, internal: 22, active: true, service: "ssh", version: "OpenSSH 8.9.0" },
            { id: "p2", external: 80, internal: 80, active: true, service: "http", version: "Apache 2.4.41" },
        ],
        rules: [],
        rootFiles: [],
        children: [
            {
                id: "dev1",
                ip: "10.0.0.14",
                type: "DEVICE",
                vulnerabilities: [],
                users: [
                    { id: "u2", username: "dockmaster", password: "forklift", firstName: "Dock", lastName: "Master" },
                ],
                ports: [{ id: "p3", external: 3306, internal: 3306, active: true, service: "mysql" }],
                rules: [],
                rootFiles: [
                    { id: "f1", name: "manifest-14", extension: "txt", isFolder: false, hidden: false, data: "CONTAINER MSKU-4471 — 14th, 02:40 — sealed, unsigned." },
                ],
                children: [],
            },
        ],
    },
    });
    const firewall = makeNode("world.firewall", { x: 640, y: 0 }, {
        ip: "{{data.targetIp}}",
        removeOnComplete: true,
        rule: { id: "r1", allowed: false, port: 3306, source: "*", destination: "*" },
    });
    const domain = makeNode("world.domain", { x: 640, y: 160 }, {
        domain: "intranet.meridian-capital.net",
        ip: "{{data.targetIp}}",
        removeOnComplete: true,
    });
    const dropFiles = makeNode("world.files", { x: 640, y: 320 }, {
        target: "device",
        ip: "{{data.targetIp}}",
        parentPath: "/var/www/intranet/",
    });
    /* Note: `network`'s ipMode is "random", so the compiler allocates
       Data.targetIp once in CreateData() and reuses it for the live
       network — no manual fx.setData step needed to capture it. */

    /* ── briefing, re-sent on every load ────────────────────────────────── */
    const mail = makeNode("comms.dialogue", { x: 320, y: 450 }, {
        kind: "mail",
        mail: {
            from: "r.okafor@protonmail.com",
            subject: "You were recommended to me",
            content:
                "I work in compliance at Meridian Capital. There is a set of books on the intranet that my employers would prefer stayed private.\n\n" +
                "The intranet is at intranet.meridian-capital.net. Find your own way in — I cannot be seen helping.",
            /* Off deliberately: this build has no reply flag on the mail it
               actually sends, so the box promises a Reply button that never
               appears. Where a quest needs the player to write back, it uses a
               hackertyper reply page instead. */
            replyable: false,
            attachment: { name: "shift-roster", extension: "txt", content: "Night shift: 02:00-06:00. Badge logs disabled during maintenance windows." },
        },
    });
    const kisscord = makeNode("comms.dialogue", { x: 640, y: 450 }, {
        kind: "kisscord",
        kisscord: {
            contactId: "r.okafor",
            messages: [
                {
                    id: "m1",
                    content: "Did you get my mail? Keep it off the company channel.",
                    isMine: false,
                    delayMs: 0,
                    playerAction: "none",
                    playerText: "",
                    unlocksAfter: [],
                },
                {
                    id: "m2",
                    content: "I'm not asking you to steal anything. Just the ledger export.",
                    isMine: false,
                    delayMs: 2200,
                    playerAction: "none",
                    playerText: "",
                    unlocksAfter: [],
                },
                {
                    id: "m3",
                    content: "There's a maintenance page on the intranet. It isn't linked from anywhere. That's your way in.",
                    isMine: false,
                    delayMs: 2600,
                    playerAction: "none",
                    playerText: "",
                    unlocksAfter: ["recon"],
                },
            ],
        },
    });
    const weechat = makeNode("comms.dialogue", { x: 640, y: 700 }, {
        kind: "weechat",
        weechat: {
            host: "irc.meridian-capital.net",
            password: "guest",
            registerServer: true,
            messages: [
                { id: "w1", content: "nightly batch starts at 02:00, logs purge at 06:00", username: "sysop", isMine: false, delayMs: 0, playerAction: "none", playerText: "" },
                { id: "w2", content: "reminder: maintenance window = badge logs off", username: "sysop", isMine: false, delayMs: 1800, playerAction: "none", playerText: "" },
            ],
        },
    });
    const call = makeNode("comms.dialogue", { x: 320, y: 700 }, {
        kind: "phone",
        phone: { branch: "default", startIndex: 0 },
    });

    /* ── objectives ─────────────────────────────────────────────────────── */
    const recon = makeNode("objective", { x: 980, y: 150 }, {
        name: "recon",
        description: "Map the intranet host",
        hint: "nmap the address intranet.meridian-capital.net resolves to.",
        terminalCommand: "nmap intranet.meridian-capital.net",
    });
    const findPage = makeNode("objective", { x: 980, y: 320 }, {
        name: "find-maintenance-page",
        description: "Find the unlinked maintenance page",
        hint: "Something on that host is not in the search index. dirhunter finds paths by guessing them.",
        terminalCommand: "dirhunter intranet.meridian-capital.net",
    });
    const exfil = makeNode("objective", { x: 1620, y: 560 }, {
        name: "exfil-ledger",
        description: "Download the ledger export",
        hint: "It is on the host you got into. Look under /var/www/intranet/exports/.",
        hidden: true,
    });

    /* ── the branch ─────────────────────────────────────────────────────── */
    const branch = makeNode("flow.branch", { x: 1300, y: 320 }, {
        source: "event",
        conditions: [{ id: "b1", join: "and", field: "results", op: "contains", value: "/maintenance" }],
    });
    const quietPath = makeNode("fx.setData", { x: 1620, y: 200 }, { key: "route", value: "quiet" });
    const loudPath = makeNode("fx.setData", { x: 1620, y: 400 }, { key: "route", value: "loud" });
    const tipQuiet = makeNode("fx.notify", { x: 1900, y: 200 }, {
        message: "The maintenance page accepts no credentials at all. Nobody noticed you were here.",
        variant: "notify",
        tone: "success",
    });
    const tipLoud = makeNode("fx.notify", { x: 1900, y: 400 }, {
        message: "You brute-forced your way in. The badge logs will show it — move fast.",
        variant: "notify",
        tone: "warning",
    });

    /* ── the passphrase gate ────────────────────────────────────────────── */
    const passphrase = makeNode("reply.input", { x: 1900, y: 560 }, {
        commandName: "decrypt",
        commandDescription: "Decrypt the ledger export",
        prompt: "Archive passphrase >",
        mask: true,
        matchMode: "exact",
        expected: "MERIDIAN-02-06",
        caseSensitive: false,
        successMessage: "Archive decrypted. 214 records recovered.",
        failureMessage: "Wrong passphrase. The archive is still sealed.",
    });
    const hintCall = makeNode("fx.handbook", { x: 1620, y: 700 }, {
        articleId: "night-shift",
        category: "Meridian Capital",
    });
    const decrypted = makeNode("fx.notify", { x: 2200, y: 480 }, {
        message: "Archive decrypted. 214 records recovered. Okafor has them.",
        variant: "notify",
        tone: "success",
    });
    const sealed = makeNode("fx.notify", { x: 2200, y: 640 }, {
        message: "The archive is still sealed. The passphrase is somewhere in what you have already read.",
        variant: "notify",
        tone: "warning",
    });

    /* ── rewards ────────────────────────────────────────────────────────── */
    const pay = makeNode("fx.pay", { x: 320, y: 900 }, {
        amount: 18000,
        description: "Ledger job",
        fromIBAN: "DE89370400440532013000",
        fromName: "R. Okafor",
    });
    const cleanup = makeNode("fx.notify", { x: 320, y: 1050 }, {
        message: "Okafor has deleted the thread. You were never here.",
        variant: "toast",
        tone: "info",
    });

    /* ── triggers ───────────────────────────────────────────────────────── */
    const tRecon = triggerFor(
        recon,
        "Terminal.NmapScan",
        [{ field: "ip", op: "notEmpty", value: "" }],
        { x: 660, y: 150 },
    );
    const tDirhunter = triggerFor(findPage, "Terminal.Dirhunter", [], { x: 660, y: 320 });
    /* Terminal.SSH.FileDownload, not "Files.Downloaded" - the latter is not an
       event this engine has, so this objective could never complete. Found by
       validating every template trigger against the SDK's ModEventMap. */
    const tDownload = triggerFor(
        exfil,
        "Terminal.SSH.FileDownload",
        [{ field: "name", op: "contains", value: "ledger" }],
        { x: 1300, y: 560 },
    );

    /* ── phone dialog lives on the quest, not the node ──────────────────── */
    quest.dialog = [
        {
            id: "d1",
            name: "default",
            lines: [
                {
                    id: "l1",
                    speaker: "R. Okafor",
                    text: "You found the page. Good. I can't talk long.",
                    isEnd: false,
                    options: [
                        { id: "o1", label: "What's the passphrase?", text: "The archive is sealed. What's the passphrase?", nextIndex: 1, isEnd: false },
                        { id: "o2", label: "Who else knows?", text: "Who else knows about this?", nextIndex: 2, isEnd: false },
                    ],
                },
                {
                    id: "l2",
                    speaker: "R. Okafor",
                    text: "It's the maintenance window, written the way the badge system writes it. You'll have seen it somewhere.",
                    isEnd: true,
                    options: [],
                },
                {
                    id: "l3",
                    speaker: "R. Okafor",
                    text: "Nobody. That's rather the point. Don't make it not nobody.",
                    isEnd: true,
                    options: [],
                },
            ],
        },
    ];

    quest.graph = {
        nodes: [
            claim, load, complete, abandon,
            network, firewall, domain, dropFiles,
            mail, kisscord, weechat, call,
            recon, findPage, exfil,
            branch, quietPath, loudPath, tipQuiet, tipLoud,
            passphrase, hintCall, decrypted, sealed,
            pay, cleanup,
            tRecon.trigger, tDirhunter.trigger, tDownload.trigger,
        ],
        edges: [
            // Claim: build the world once.
            makeEdge(claim, "out", network, "in"),
            makeEdge(network, "out", firewall, "in"),
            makeEdge(firewall, "out", domain, "in"),
            makeEdge(domain, "out", dropFiles, "in"),

            // Every load: make sure the player can still reach the story.
            makeEdge(load, "out", mail, "in"),
            makeEdge(mail, "out", kisscord, "in"),
            makeEdge(kisscord, "out", weechat, "in"),
            makeEdge(weechat, "out", call, "in"),
            makeEdge(call, "out", hintCall, "in"),

            // Objectives and the order they unlock in.
            makeEdge(recon, "unlock", findPage, "unlocked-by"),
            tRecon.edge,
            tDirhunter.edge,

            // The split: did the player find the quiet way in?
            makeEdge(findPage, "done", branch, "in"),
            makeEdge(branch, "true", quietPath, "in"),
            makeEdge(branch, "false", loudPath, "in"),
            makeEdge(quietPath, "out", tipQuiet, "in"),
            makeEdge(loudPath, "out", tipLoud, "in"),
            makeEdge(tipQuiet, "out", exfil, "in"),
            makeEdge(tipLoud, "out", exfil, "in"),
            tDownload.edge,

            // The ending is gated on a passphrase the player has to piece
            // together from the mail, the IRC log and the phone call.
            makeEdge(exfil, "done", passphrase, "in"),
            makeEdge(passphrase, "success", decrypted, "in"),
            makeEdge(passphrase, "failure", sealed, "in"),

            makeEdge(complete, "out", pay, "in"),
            makeEdge(abandon, "out", cleanup, "in"),
        ],
    };

    applyLayout(quest);

    return createProject({
        mod: {
            id: "the-ledger-job",
            name: "The Ledger Job",
            version: "1.0.0",
            author: "",
            description:
                "A branching corporate-intrusion investigation: two routes in, a decision point, and a passphrase the player has to piece together from four channels.",
            tags: ["quest", "investigation", "branching", "network", "advanced"],
            dependencies: [],
            minSdkVersion: "0.21.0",
            apiVersion: 1,
        },
        quests: [quest],
        editor: { activeQuestId: quest.id, viewports: {} },
    });
}

/* ── The standard contract hack ──────────────────────────────────────────── */

/**
 * The shape of job the game hands out constantly: a name in an e-mail, and a
 * file that has to stop existing.
 *
 *   mail (a name)  →  lynx <name>  →  their website  →  whois <domain>  →  IP
 *   →  nmap -sV  →  port 22 is open  →  metasploit  →  delete the file
 *   →  reply to the client — which only pays out if the file is really gone.
 *
 * Every step is a real game event (checked against `reference/hackhub-events.json`),
 * every clue is placed by a node the author can edit, and the last step shows
 * the pattern most quests eventually need: a branch that tells the difference
 * between "the player did the work" and "the player says they did the work".
 */
function buildContractHack(): ProjectDocument {
    resetIds();
    const TARGET = "Anselm Ritter";
    const DOMAIN = "meridian-capital.net";
    /* Allocated by the game; {{data.targetIp}} reads it back (r73). */
    const IP = TARGET_IP_TOKEN;
    const HOST_IP = "192.168.1.24";
    const FILE = "ledger_q3";

    const quest = createQuest({
        id: "q-contract-hack",
        name: "TheLedgerContract",
        closingObjectiveText: "Contract closed. Ritter Holdings is none the wiser.",
        title: "Contract: The Q3 Ledger",
        /* A template has to be playable the moment it is exported: without
           this (or a Hackhub feed post) nothing can ever claim the quest. */
        autoStart: true,
        description: "A client wants one file gone from one man's machine. Find him, find his server, get in, delete it.",
        group: "side",
        rewards: { money: 4000, xp: 180 },
        employer: { firstName: "Ines", lastName: "Faber", email: "i.faber@ghostmail.io" },
        dataKeys: [{ key: "ledger", type: "string" }],
    });

    const claim = makeNode("entry.start", { x: 0, y: 0 });
    const load = makeNode("entry.load", { x: 0, y: 200 });
    const complete = makeNode("entry.complete", { x: 0, y: 400 });

    /* ── the world the player will explore ──────────────────────────────── */

    const network = makeNode("world.network", { x: 300, y: 0 }, {
        ipMode: "random",
        destroyOnComplete: false,
        device: {
            id: "dev-router",
            ip: IP,
            name: "meridian-edge",
            type: "ROUTER",
            model: "MikroTik hEX S",
            domainName: DOMAIN,
            accessable: true,
            vulnerabilities: [],
            /* The router is the way IN, not the target. It carries the site's
               admin account and nothing worth stealing — the ledger is on the
               machine behind it. Matches how every network in the working
               reference mod is shaped, and how the game actually plays: you
               come in through the edge and log in to somebody's PC. */
            users: [
                {
                    id: "u-edge",
                    username: "admin",
                    password: "M3ridian!edge",
                },
            ],
            ports: [
                /* Web only, and locked. Every router in the reference mod
                   serves exactly this: port 80, locked, no version banner.
                   The exploitable SSH service belongs on the machine behind
                   the router, so the player has to get past the edge first. */
                { id: "p-http", external: 80, internal: 80, active: true, locked: true, service: "http" },
            ],
            rules: [],
            files: [],
            children: [
                {
                    id: "dev-host",
                    ip: HOST_IP,
                    name: "ritter-ws",
                    type: "DEVICE",
                    vulnerabilities: [],
                    /* The real target. SSH open and explicitly UNLOCKED: the
                       reference mod locks a router's web port and leaves the
                       SSH port it wants exploited unlocked, without exception. */
                    ports: [
                        { id: "p-ssh-host", external: 22, internal: 22, active: true, locked: false, service: "ssh", version: "OpenSSH 7.2.0" },
                    ],
                    /* One account, named after the man who owns the machine.
                       A personal PC does not have a generic "admin".

                       `extraAccounts: false` matters as much as the account
                       itself. Left on, the engine adds root and guest through
                       the default user schema, and r57/r78 established that the
                       exploit then drops the player into `guest` — forcing a
                       password crack this story never mentions. Off, the player
                       lands as Ritter, which is what the brief describes. */
                    extraAccounts: false,
                    users: [
                        {
                            id: "u-ritter",
                            username: "aritter",
                            password: "Sommer2019!",
                            firstName: "Anselm",
                            lastName: "Ritter",
                            acceptReverseTCP: true,
                            /* Files on a user mount in that user's home
                               directory, which is how a file gets onto a remote
                               machine before anyone connects to it. */
                            files: [
                                {
                                    id: "f-ledger",
                                    name: FILE,
                                    extension: "xlsx",
                                    isFolder: false,
                                    data: "Q3 consolidated ledger - internal only. Rows 412-478 flagged by compliance.",
                                },
                                {
                                    id: "f-notes",
                                    name: "reminders",
                                    extension: "txt",
                                    isFolder: false,
                                    data: "Renew the cert. Call Ines back. Stop keeping the ledger on this machine.",
                                },
                            ],
                        },
                    ],
                    rules: [],
                    /* Every device in the working reference mod carries a
                       "logs" folder at its root. "logs" is one of the engine's
                       default root folders (with etc, home and lib), so this
                       is merged into the one the machine already has rather
                       than duplicating it — and the game stops reporting
                       "Sys log file not found" for the address. */
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
                                        "boot: ok",
                                        "session: aritter login from 192.168.1.1",
                                        "update: deferred by user",
                                    ].join("\n"),
                                },
                            ],
                        },
                    ],
                    files: [],
                    children: [],
                },
            ],
        },
    });

    /* The one thing the world cannot answer by itself: who this person is.
       `lynx` is an OSINT lookup keyed by the name the player types. */
    const osint = makeNode("world.toolResponse", { x: 620, y: 0 }, {
        command: "lynx",
        input: TARGET,
        dataText: [
            `Name:      ${TARGET}`,
            "Role:      Head of Compliance, Meridian Capital AG",
            "Location:  Munich, DE",
            `Web:       https://${DOMAIN}`,
            "Email:     a.ritter@meridian-capital.net",
            /* No social handle. lynx output is a lead the player will follow,
               and a handle that no Twotter profile backs sends them to a
               search that crashes the game (QA, r45: the built-in Twotter
               search calls .toLowerCase() on a field the missing profile does
               not have, and the save is corrupted). Only advertise accounts
               that exist - and the SDK has no way to create a Twotter profile
               in this build, so for now: none. */
        ].join("\n"),
        removeOnComplete: true,
    });

    /* whois answers for the domain the router registers. Scripted here so the
       trail is explicit and editable — change the name, change this line. */
    const whois = makeNode("world.toolResponse", { x: 940, y: 0 }, {
        command: "whois",
        input: DOMAIN,
        dataText: [
            `Domain:     ${DOMAIN}`,
            `IP:         ${IP}`,
            "Registrant: Meridian Capital AG",
            "Email:      hostmaster@meridian-capital.net",
            "Status:     active",
        ].join("\n"),
        removeOnComplete: true,
    });

    /* ── the brief ──────────────────────────────────────────────────────── */

    const brief = makeNode("comms.dialogue", { x: 300, y: 200 }, {
        kind: "mail",
        mail: {
            from: "i.faber@ghostmail.io",
            subject: "One file, one man, no trace",
            content: [
                `His name is ${TARGET}. That is all you get, and all you need.`,
                `On his machine there is a spreadsheet called ${FILE}.xlsx. I want it gone. Not copied, not read to me — gone.`,
                `When it is done, tell me through the drop page: ${DOMAIN}/terminal/secure-reply. Do not reply to this address.`,
            ].join("\n\n"),
            /* Off deliberately: this build has no reply flag on the mail it
               actually sends, so the box promises a Reply button that never
               appears. Where a quest needs the player to write back, it uses a
               hackertyper reply page instead. */
            replyable: false,
        },
    });

    /* ── objectives, in the order a player actually works ───────────────── */

    const oRead = makeNode("objective", { x: 620, y: 200 }, {
        name: "read-brief",
        description: "Read the contract",
        hint: "It is in your mailbox.",
    });
    const oFind = makeNode("objective", { x: 940, y: 200 }, {
        name: "identify-target",
        description: `Find out who ${TARGET} is`,
        hint: "lynx looks people up. Give it the full name, in quotes.",
        terminalCommand: `lynx "${TARGET}"`,
    });
    const oServer = makeNode("objective", { x: 1260, y: 200 }, {
        name: "find-server",
        description: "Find the server behind his company's website",
        hint: "whois turns a domain into an address.",
        terminalCommand: `whois ${DOMAIN}`,
    });
    const oScan = makeNode("objective", { x: 1580, y: 200 }, {
        name: "scan-server",
        description: "Scan the address the domain resolves to",
        hint: "nmap with -sV reports versions as well as open ports.",
        info: "The edge router only serves the website — but a company keeps its real machines behind it, and the router is the way through.",
        terminalCommand: `nmap ${IP} -sV`,
    });
    const oMap = makeNode("objective", { x: 1900, y: 200 }, {
        name: "map-network",
        description: "Map what is behind the router",
        hint: `net_tree.py ${IP} draws the network out. Look for the machine with somebody's name on it.`,
        info: "The router answers on 80 and nothing else. Everything worth having is on the machines it fronts.",
        terminalCommand: `net_tree.py ${IP}`,
    });
    const oAccess = makeNode("objective", { x: 2220, y: 200 }, {
        name: "get-a-shell",
        description: "Get onto Ritter's workstation",
        hint: "His machine is answering on port 22 with an old OpenSSH. metasploit has a module for that — the version the scan reported is the one to set.",
        info: "The exploit drops you in as guest, which is enough to look around but not enough to touch his files.",
        terminalCommand: "msfconsole",
    });
    const oCrack = makeNode("objective", { x: 2540, y: 200 }, {
        name: "become-ritter",
        description: "Get into Ritter's own account",
        hint: "show users lists who is on the box. /etc/passwd holds their hashes — feed his to john in another terminal, then users <number> to switch.",
        info: "Guest cannot read another user's home directory. You need to be him, not near him.",
        terminalCommand: "show users",
    });
    const oDelete = makeNode("objective", { x: 2860, y: 200 }, {
        name: "delete-ledger",
        description: `Delete ${FILE}.xlsx from his home directory`,
        hint: `Once you are Ritter, the file is in his home folder. rm ${FILE}.xlsx, or delete it from explorer.`,
        terminalCommand: `rm ${FILE}.xlsx`,
    });
    const oReply = makeNode("objective", { x: 3180, y: 200 }, {
        name: "report-back",
        description: "Tell the client the job is done",
        hint: "She left a reply terminal on the drop site. Mash the keys — the words are already written.",
    });

    const t1 = triggerFor(oRead, "Mail.Read", [{ field: "subject", op: "contains", value: "One file" }], { x: 620, y: 360 });
    const t2 = triggerFor(oFind, "Terminal.Lynx.Search", [{ field: "query", op: "contains", value: "Ritter" }], { x: 940, y: 360 });
    const t3 = triggerFor(oServer, "Terminal.Whois", [{ field: "domain", op: "equals", value: DOMAIN }], { x: 1260, y: 360 });
    /* Either address counts. The player has to scan the edge to find the
       machines behind it, and scanning the workstation itself is just as much
       "seeing what is running" — failing the objective for taking the second
       step first would be pedantry. */
    const t4 = triggerFor(
        oScan,
        "Terminal.NmapScan",
        [
            { field: "ip", op: "equals", value: IP },
            { join: "or", field: "ip", op: "equals", value: HOST_IP },
        ],
        { x: 1580, y: 360 },
    );
    /* net_tree.py is how the player finds the machines the router fronts.
       Terminal.Command carries what was typed, so match the tool by name and
       let any argument through — the player may map the domain or the ip. */
    const t5 = triggerFor(
        oMap,
        "Terminal.Command",
        [{ field: "command", op: "contains", value: "net_tree" }],
        { x: 1900, y: 360 },
    );
    /* No condition on purpose: whether the session reports the router's public
       address or the workstation's differs by route in, and a template should
       not fail for taking the other one. */
    const t6 = triggerFor(oAccess, "Metasploit.Meterpreter.Connected", [], { x: 2220, y: 360 });
    /* Switching user inside the session is what "become Ritter" means. The
       meterpreter command is `users <n>`; match the verb, not the number,
       since the index depends on how the engine ordered the accounts. */
    const t7 = triggerFor(
        oCrack,
        "Terminal.Command",
        [{ field: "command", op: "contains", value: "users" }],
        { x: 2540, y: 360 },
    );
    const t8 = triggerFor(oDelete, "Files.Deleted", [{ field: "name", op: "contains", value: FILE }], { x: 2860, y: 360 });
    /* The report command is a real registered Command, so running it raises
       Terminal.Command with what was typed. Match the command name rather than
       a bespoke event: the event a typed-answer node emits is derived from its
       node id, which an author who rebuilds the node would change. */
    const t9 = triggerFor(
        oReply,
        "Terminal.Command",
        [{ field: "command", op: "contains", value: "report" }],
        { x: 3180, y: 360 },
    );

    /* ── the honesty check ──────────────────────────────────────────────── */

    /* The deletion is what the client actually pays for, so it is written down
       the moment it happens. "On complete" on an objective follows this wire
       when the player finishes it by playing. */
    const remember = makeNode("fx.setData", { x: 2860, y: 520 }, { key: "ledger", value: "deleted" });

    /* The player reports back with a terminal command the mod registers. A
       typed answer is a real SDK Command (Shell prompt -> matched -> event),
       which is why this is the reply route the templates use. */
    const reply = makeNode("reply.input", { x: 3180, y: 520 }, {
        commandName: "report",
        commandDescription: "Tell the client the job is done",
        prompt: "What do you want to tell her? >",
        expected: "done",
        matchMode: "contains",
        caseSensitive: false,
        successMessage: "Sent. She will check before she pays.",
        failureMessage: "She will want to hear that it is done.",
    });

    const honest = makeNode("flow.branch", { x: 2860, y: 520 }, {
        source: "data",
        conditions: [{ id: "h1", join: "and", field: "ledger", op: "equals", value: "deleted" }],
    });

    const paid = makeNode("comms.dialogue", { x: 3180, y: 400 }, {
        kind: "mail",
        mail: {
            from: "i.faber@ghostmail.io",
            subject: "Received",
            content: "Checked. It is gone. The rest of the money is with you.\n\nI will have more work.",
            replyable: false,
        },
    });
    const pay = makeNode("fx.pay", { x: 3500, y: 400 }, {
        amount: 4000,
        description: "Contract settled",
        fromName: "I. Faber",
    });
    const joking = makeNode("comms.dialogue", { x: 3180, y: 640 }, {
        kind: "mail",
        mail: {
            from: "i.faber@ghostmail.io",
            subject: "Re: job closed",
            content: "You must be joking. The file is still sitting in his home directory — I am looking at it.\n\nDo the job, then write to me.",
            replyable: false,
        },
    });

    const wrapUp = makeNode("fx.notify", { x: 300, y: 400 }, {
        message: "Contract closed. Faber will be in touch.",
        variant: "toast",
        tone: "success",
    });

    const note = makeNode("flow.note", { x: 300, y: 640 }, {
        text: [
            "The trail: a name in the mail → lynx finds the company → whois finds the server → nmap finds port 22 → metasploit gets a shell → the file is deleted.",
            "",
            "Each objective is completed by a real game event (the grey node under it). Change an IP or a name and change it in the matching trigger too.",
            "",
            "The last part is the useful pattern: deleting the file writes ledger=deleted, and the reply branches on it — so claiming the job is done without doing it gets the player told off instead of paid.",
            "",
            "Two things the game handles by itself: connecting to a machine is logged there, and the player cleans that log (or pays for it in suspicion) — no node needed. And keep port version numbers plain: a letter in the version has been seen to stop metasploit matching an exploit.",
        ].join("\n"),
        width: 340,
    });

    quest.graph = {
        nodes: [
            claim, load, complete,
            network, osint, whois, brief, wrapUp,
            oRead, oFind, oServer, oScan, oMap, oAccess, oCrack, oDelete, oReply,
            t1.trigger, t2.trigger, t3.trigger, t4.trigger, t5.trigger,
            t6.trigger, t7.trigger, t8.trigger, t9.trigger,
            remember, reply, honest, paid, pay, joking, note,
        ],
        edges: [
            // world setup, in order, on claim
            makeEdge(claim, "out", network, "in"),
            makeEdge(network, "out", osint, "in"),
            makeEdge(osint, "out", whois, "in"),
            makeEdge(whois, "out", brief, "in"),
            // the objective chain: each one unlocks the next
            makeEdge(oRead, "unlock", oFind, "unlocked-by"),
            makeEdge(oFind, "unlock", oServer, "unlocked-by"),
            makeEdge(oServer, "unlock", oScan, "unlocked-by"),
            makeEdge(oScan, "unlock", oMap, "unlocked-by"),
            makeEdge(oMap, "unlock", oAccess, "unlocked-by"),
            makeEdge(oAccess, "unlock", oCrack, "unlocked-by"),
            makeEdge(oCrack, "unlock", oDelete, "unlocked-by"),
            makeEdge(oDelete, "unlock", oReply, "unlocked-by"),
            // their triggers
            t1.edge, t2.edge, t3.edge, t4.edge, t5.edge, t6.edge, t7.edge, t8.edge, t9.edge,
            // remember the deletion, then judge the reply
            makeEdge(oDelete, "done", remember, "in"),
            makeEdge(load, "out", reply, "in"),
            /* A correct report runs the honesty check: it branches on whether
               the file was really deleted, so claiming the job is done without
               doing it gets the player told off instead of paid. */
            makeEdge(reply, "success", honest, "in"),
            makeEdge(oReply, "done", honest, "in"),
            makeEdge(honest, "true", paid, "in"),
            makeEdge(paid, "out", pay, "in"),
            makeEdge(honest, "false", joking, "in"),
            makeEdge(complete, "out", wrapUp, "in"),
        ],
    };

    applyLayout(quest);

    return createProject({
        mod: {
            id: "the-ledger-contract",
            name: "The Ledger Contract",
            version: "1.0.0",
            author: "",
            description:
                "The standard contract hack: a name, an OSINT lookup, a whois, a scan, an exploit, a deleted file — and a client who checks before she pays.",
            tags: ["quest", "hacking", "recon", "metasploit", "beginner-friendly"],
            dependencies: [],
            minSdkVersion: "0.21.0",
            apiVersion: 1,
        },
        quests: [quest],
        websites: [
            {
                id: "site-meridian",
                host: DOMAIN,
                name: "Meridian Capital",
                pages: SITE_TEMPLATES.find((t) => t.id === "corp")!
                    .make()
                    .pages.map((page, i) => ({ id: `page-meridian-${i + 1}`, ...page })),
            },
        ],
        editor: { activeQuestId: quest.id, viewports: {} },
    });
}

/**
 * The standard job, and the one most quests in this game are a variation of:
 * somebody wants a file off a company server.
 *
 * Deliberately the SHORT route. The Ledger Contract teaches the long one — a
 * personal PC behind a router, a guest shell, a password cracked out of
 * /etc/passwd — and that turned out to be an advanced quest once it was honest
 * about how the game plays. This one keeps the shape every player already
 * knows and stops there:
 *
 *   a name in a mail → lynx → whois → nmap → metasploit on 22 → send the file
 *
 * The target is a SERVER, so one administrator account is the whole story: the
 * exploit lands the player straight into the account that owns the files. No
 * user switching, no /etc/passwd, no second terminal. And the player takes a
 * copy rather than destroying anything, which is both the commoner job and a
 * gentler ending.
 */
function buildDataGrab(): ProjectDocument {
    resetIds();
    const CONTACT = "Yusuf Demir";
    const DOMAIN = "harbourline-logistics.com";
    /* The game allocates the address; {{data.targetIp}} reads it back. Typed
       addresses were removed in r73 — networks outlive the mod in the save, so
       a fixed one made a re-export collide with its own older build. */
    const IP = TARGET_IP_TOKEN;
    const FILE = "manifest_q4";
    const CLIENT = "d.okonkwo@nullpost.io";

    const quest = createQuest({
        id: "q-data-grab",
        name: "TheHarbourManifest",
        closingObjectiveText: "Contract closed. The manifest is with the client.",
        title: "Contract: The Harbour Manifest",
        autoStart: true,
        description:
            "A shipping company keeps a manifest it should not. Find the server, get in, and send the client a copy.",
        group: "side",
        rewards: { money: 2500, xp: 120 },
        employer: { firstName: "Dilara", lastName: "Okonkwo", email: CLIENT },
    });

    const claim = makeNode("entry.start", { x: 0, y: 200 });

    /* ── the world ──────────────────────────────────────────────────────── */

    const network = makeNode("world.network", { x: 300, y: 0 }, {
        ipMode: "random",
        destroyOnComplete: false,
        /* A single public server, reachable directly. No router in front of it:
           the SDK's SubnetNetworkDefinition allows a Device at the top level,
           and this template's whole job is the short route — scan the address
           the domain resolves to, exploit what is listening, take the file.
           The Ledger Contract is where a router, a network map and a guest
           shell get taught. */
        device: {
            id: "dev-server",
            ip: IP,
            name: "harbour-fileserver",
            type: "DEVICE",
            domainName: DOMAIN,
            vulnerabilities: [],
            ports: [
                { id: "p-ssh", external: 22, internal: 22, active: true, locked: false, service: "ssh", version: "OpenSSH 6.4.0" },
            ],
            /* ONE account, and it is the administrator. On a server that is the
               whole story: the exploit lands the player in the account that
               owns the files, so there is nobody to switch to and no password
               to crack. That is exactly the difference between this template
               and the Ledger.

               extraAccounts: false is what actually delivers that. Without it
               the engine's stock root and guest are added alongside, the
               exploit lands in guest, and QA had to crack a password this
               template deliberately does not teach (r78). */
            extraAccounts: false,
            users: [
                {
                    id: "u-admin",
                    username: "admin",
                    password: "Dock19-Transit",
                    firstName: "Harbourline",
                    lastName: "Operations",
                    acceptReverseTCP: true,
                    files: [
                        {
                            id: "f-manifest",
                            name: FILE,
                            extension: "csv",
                            isFolder: false,
                            data: [
                                "container,origin,declared,actual,consignee",
                                "HLX-4471,Rotterdam,machine parts,machine parts,Harbourline BV",
                                "HLX-4482,Odessa,textiles,UNDECLARED,-",
                                "HLX-4490,Gdansk,machine parts,machine parts,Harbourline BV",
                                "HLX-4501,Odessa,textiles,UNDECLARED,-",
                            ].join("\n"),
                        },
                        {
                            id: "f-handover",
                            name: "handover",
                            extension: "txt",
                            isFolder: false,
                            data: "Quarterly manifests stay on this box. Do not e-mail them. - Ops",
                        },
                    ],
                },
            ],
            /* Every device in the working reference mod carries a logs folder,
               and "logs" is one of the engine's default root folders, so this
               merges into the machine's own rather than making a second one. */
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
                            data: ["boot: ok", "sshd: listening on 22", "backup: nightly, 03:00"].join("\n"),
                        },
                    ],
                },
            ],
            files: [],
        },
    });

    const osint = makeNode("world.toolResponse", { x: 620, y: 0 }, {
        command: "lynx",
        input: CONTACT,
        dataText: [
            `Name:      ${CONTACT}`,
            "Role:      Operations Manager, Harbourline Logistics",
            "Location:  Rotterdam, NL",
            `Web:       https://${DOMAIN}`,
            "Email:     y.demir@harbourline-logistics.com",
        ].join("\n"),
        removeOnComplete: true,
    });

    const whois = makeNode("world.toolResponse", { x: 940, y: 0 }, {
        command: "whois",
        input: DOMAIN,
        dataText: [
            `Domain:     ${DOMAIN}`,
            `IP:         ${IP}`,
            "Registrant: Harbourline Logistics BV",
            "Email:      hostmaster@harbourline-logistics.com",
            "Status:     active",
        ].join("\n"),
        removeOnComplete: true,
    });

    const brief = makeNode("comms.dialogue", { x: 1260, y: 0 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "One file, quietly",
            content: [
                `A shipping firm called Harbourline is running containers out of Odessa that never appear on a customs form. Their operations manager is ${CONTACT}.`,
                `Everything they do sits on one file server. I want their quarterly manifest — ${FILE}.csv — and I want a copy, not a hole where it used to be. If it goes missing they will know somebody was there.`,
                `Mail it to me at ${CLIENT} when you have it.`,
            ].join("\n\n"),
            /* Off deliberately: this build has no reply flag on the mail it
               actually sends, so the box promises a Reply button that never
               appears. Where a quest needs the player to write back, it uses a
               hackertyper reply page instead. */
            replyable: false,
        },
    });

    /* ── objectives ─────────────────────────────────────────────────────── */

    const oRead = makeNode("objective", { x: 620, y: 200 }, {
        name: "read-brief",
        description: "Read the contract",
        hint: "It is in your mailbox.",
    });
    const oFind = makeNode("objective", { x: 940, y: 200 }, {
        name: "identify-target",
        description: `Find out who ${CONTACT} is`,
        hint: "lynx looks people up. Give it the full name, in quotes.",
        terminalCommand: `lynx "${CONTACT}"`,
    });
    const oServer = makeNode("objective", { x: 1260, y: 200 }, {
        name: "find-server",
        description: "Find the company's server",
        hint: "whois turns a domain into an address.",
        terminalCommand: `whois ${DOMAIN}`,
    });
    const oScan = makeNode("objective", { x: 1580, y: 200 }, {
        name: "scan-server",
        description: "See which services the server is running",
        hint: "nmap with -sV reports versions as well as open ports.",
        terminalCommand: `nmap ${IP} -sV`,
    });
    const oAccess = makeNode("objective", { x: 1900, y: 200 }, {
        name: "get-in",
        description: "Get into the file server",
        hint: "Port 22 is answering with an old OpenSSH. metasploit has a module for it — set the version the scan reported.",
        info: "It is a server, so the account you land in already owns the files.",
        terminalCommand: "msfconsole",
    });
    const oTake = makeNode("objective", { x: 2220, y: 200 }, {
        name: "take-manifest",
        description: `Copy ${FILE}.csv off the server`,
        hint: `Download it — leave the original where it is. scp admin@${IP}:${FILE}.csv .`,
        info: "The client asked for a copy on purpose. A missing file tells them somebody was here.",
        terminalCommand: `scp admin@${IP}:${FILE}.csv .`,
    });
    const oSend = makeNode("objective", { x: 2540, y: 200 }, {
        name: "send-manifest",
        description: "Send the manifest to the client",
        hint: `Attach it to a mail to ${CLIENT}.`,
    });

    const t1 = triggerFor(oRead, "Mail.Read", [{ field: "subject", op: "contains", value: "One file" }], { x: 620, y: 360 });
    const t2 = triggerFor(oFind, "Terminal.Lynx.Search", [{ field: "query", op: "contains", value: "Demir" }], { x: 940, y: 360 });
    const t3 = triggerFor(oServer, "Terminal.Whois", [{ field: "domain", op: "equals", value: DOMAIN }], { x: 1260, y: 360 });
    /* Either address counts: the player scans the edge to find the server, and
       scanning the server itself is just as much "seeing what is running". */
    const t4 = triggerFor(
        oScan,
        "Terminal.NmapScan",
        [
            { field: "ip", op: "equals", value: IP },
        ],
        { x: 1580, y: 360 },
    );
    const t5 = triggerFor(oAccess, "Metasploit.Meterpreter.Connected", [], { x: 1900, y: 360 });
    /* Terminal.SSH.FileDownload is what scp raises — NOT "Files.Downloaded",
       which is not an event this engine has (r40). */
    const t6 = triggerFor(
        oTake,
        "Terminal.SSH.FileDownload",
        [{ field: "name", op: "contains", value: FILE }],
        { x: 2540, y: 360 },
    );
    const t7 = triggerFor(
        oSend,
        "Mail.Sent",
        [{ field: "to", op: "contains", value: CLIENT }],
        { x: 2860, y: 360 },
    );

    /* ── the payoff ─────────────────────────────────────────────────────── */

    const thanks = makeNode("comms.dialogue", { x: 2860, y: 520 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "Received",
            content: [
                "Got it. Four containers out of Odessa with nothing declared against them — that is the whole case.",
                "Money is with you. I will have more work.",
            ].join("\n\n"),
            replyable: false,
        },
    });

    const pay = makeNode("fx.pay", { x: 3180, y: 520 }, {
        amountMode: "fixed",
        amount: 2500,
        description: "Manifest delivered",
        fromName: "D. Okonkwo",
    });

    const note = makeNode("flow.note", { x: -140, y: 700 }, {
        text: [
            "The standard job: a name in a mail → lynx → whois → nmap → metasploit on port 22 → copy the file → mail it back.",
            "",
            "ONE public server, reachable directly — no router, no network map. And one administrator account, so the exploit puts the player straight into the account that owns the files: no user switching, no password cracking.",
            "",
            "For the long route — a personal PC behind a router, net_tree.py, a guest shell and a cracked password — open The Ledger Contract instead.",
            "",
            "The player takes a COPY. Nothing is destroyed, so a mistake costs nothing, and a file that vanishes is what tells a company somebody was there.",
            "",
            "Two things the game handles by itself: it logs the connection on the machine, and the player wipes that log (or pays for it in Suspicion). No node needed.",
        ].join("\n"),
        width: 340,
    });

    quest.graph = {
        nodes: [
            claim,
            network, osint, whois, brief,
            oRead, oFind, oServer, oScan, oAccess, oTake, oSend,
            t1.trigger, t2.trigger, t3.trigger, t4.trigger, t5.trigger, t6.trigger, t7.trigger,
            thanks, pay, note,
        ],
        edges: [
            // build the world once, on claim
            makeEdge(claim, "out", network, "in"),
            makeEdge(network, "out", osint, "in"),
            makeEdge(osint, "out", whois, "in"),
            makeEdge(whois, "out", brief, "in"),
            // the objective chain: each one unlocks the next
            makeEdge(oRead, "unlock", oFind, "unlocked-by"),
            makeEdge(oFind, "unlock", oServer, "unlocked-by"),
            makeEdge(oServer, "unlock", oScan, "unlocked-by"),
            makeEdge(oScan, "unlock", oAccess, "unlocked-by"),
            makeEdge(oAccess, "unlock", oTake, "unlocked-by"),
            makeEdge(oTake, "unlock", oSend, "unlocked-by"),
            // their triggers
            t1.edge, t2.edge, t3.edge, t4.edge, t5.edge, t6.edge, t7.edge,
            // sending it is the end of the job
            makeEdge(oSend, "done", thanks, "in"),
            makeEdge(thanks, "out", pay, "in"),
        ],
    };

    return createProject({
        mod: {
            id: "the-harbour-manifest",
            name: "The Harbour Manifest",
            version: "1.0.0",
            author: "",
            description: quest.description,
            tags: ["quest", "hacking", "recon", "metasploit", "beginner-friendly"],
            dependencies: [],
            minSdkVersion: "0.21.0",
            apiVersion: 1,
        },
        quests: [quest],
        websites: [
            {
                id: "site-harbourline",
                host: DOMAIN,
                name: "Harbourline Logistics",
                pages: SITE_TEMPLATES.find((t) => t.id === "corp")!
                    .make()
                    .pages.map((page, i) => ({ id: `page-harbourline-${i + 1}`, ...page })),
            },
        ],
        editor: { activeQuestId: quest.id, viewports: {} },
    });
}

/* ── The dirhunter loop ──────────────────────────────────────────────────── */

/**
 * The other job the game is built around: a website that says no, and a page
 * the website forgot to list.
 *
 *   brief  →  the public site  →  the portal refuses you  →  dirhunter finds
 *   /it/helpdesk  →  the temp-password rule  →  the directory gives the ID
 *   →  ssh in as that employee  →  download the report  →  paid.
 *
 * The clue chain lives in the website itself (the NAZA site template), not in
 * quest text: the unlisted help-desk page explains the password format, the
 * public directory lists the employee it applies to, and the two together make
 * one credential. That is the whole reason unlisted pages exist, and no
 * template showed it before.
 */
function buildDirhunter(): ProjectDocument {
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

/* ── The reference quest ─────────────────────────────────────────────────── */

/**
 * Example data for the fields whose defaults would not teach anything. Anything
 * not listed here uses the registry's own seed, which is already sensible.
 */
const EXAMPLES: Partial<Record<NodeType, Record<string, unknown>>> = {
    objective: {
        name: "example-objective",
        description: "Retrieve the shipping manifest from the warehouse host.",
        hint: "The manifest is a file. You will need to be on the machine first.",
        info: "Manifests are regenerated nightly; the copy you want is dated the 14th.",
        terminalCommand: "scp dockmaster@10.0.0.14:/var/log/manifest-14.txt .",
        hidden: false,
    },
    "trigger.event": {
        event: "Terminal.SSH.FileDownload",
        conditions: [{ id: "c1", join: "and", field: "name", op: "contains", value: "manifest" }],
    },
    "world.network": {
        ipMode: "random",
        destroyOnComplete: false,
        device: {
        id: "router1",
        ip: "10.0.0.1",
        type: "ROUTER",
        model: "Netgear Nighthawk R7000",
        vulnerabilities: [{ id: "v1", type: "SQL_INJECTION", version: "Apache 2.4.41" }],
        users: [
            { id: "u1", username: "admin", password: "changeme", firstName: "Site", lastName: "Admin", emailAddress: "admin@meridian-capital.net" },
        ],
        ports: [
            { id: "p1", external: 22, internal: 22, active: true, service: "ssh", version: "OpenSSH 8.9.0" },
            { id: "p2", external: 80, internal: 80, active: true, service: "http", version: "Apache 2.4.41" },
        ],
        rules: [],
        rootFiles: [],
        children: [
            {
                id: "dev1",
                ip: "10.0.0.14",
                type: "DEVICE",
                vulnerabilities: [],
                users: [
                    { id: "u2", username: "dockmaster", password: "forklift", firstName: "Dock", lastName: "Master" },
                ],
                ports: [{ id: "p3", external: 3306, internal: 3306, active: true, service: "mysql" }],
                rules: [],
                rootFiles: [
                    { id: "f1", name: "manifest-14", extension: "txt", isFolder: false, hidden: false, data: "CONTAINER MSKU-4471 — 14th, 02:40 — sealed, unsigned." },
                ],
                children: [],
            },
        ],
    },
    },
    "world.wifi": {
        ssid: "DOCKNET-5G",
        password: "forklift",
        signal: 2,
        model: "TP-Link Archer C6",
    },
    "world.firewall": {
        ip: "10.0.0.1",
        removeOnComplete: true,
        rule: { id: "r1", allowed: false, port: 22, source: "*", destination: "*" },
    },
    "world.port": {
        ip: "10.0.0.14",
        action: "open",
        port: { id: "p1", external: 22, internal: 22, service: "ssh", active: true },
        restoreOnComplete: true,
    },
    "world.domain": {
        domain: "docknet.internal",
        ip: "10.0.0.14",
        removeOnComplete: true,
    },
    "world.database": {
        host: "10.0.0.14",
        user: "dockmaster",
        password: "forklift",
        removeOnComplete: true,
    },
    "world.files": {
        target: "device",
        ip: "10.0.0.14",
        parentPath: "/var/log/",
        files: [
            {
                id: "f1",
                name: "manifest-14",
                extension: "txt",
                isFolder: false,
                hidden: false,
                data: "CONTAINER MSKU-4471 — 14th, 02:40 — sealed, unsigned.",
            },
        ],
    },
    "world.toolResponse": {
        command: "nmap",
        input: "10.0.0.14",
        dataText:
            "Starting Nmap 7.94 ( https://nmap.org )\nNmap scan report for 10.0.0.14\nHost is up (0.0021s latency).\nPORT   STATE SERVICE VERSION\n22/tcp open  ssh     OpenSSH 8.9\n80/tcp open  http    Apache 2.4.41\n\nNmap done: 1 IP address (1 host up) scanned in 1.84 seconds",
        removeOnComplete: true,
    },
    "comms.dialogue": {
        kind: "kisscord",
        kisscord: {
            contactId: "shift.foreman",
            messages: [
                { id: "m1", content: "You're asking about 4471. Stop.", isMine: false, delayMs: 0, playerAction: "none", playerText: "", unlocksAfter: [] },
                { id: "m2", content: "Fine. The manifest is in /var/log/. You didn't get it from me.", isMine: false, delayMs: 2400, playerAction: "none", playerText: "", unlocksAfter: [] },
            ],
        },
    },
    "reply.input": {
        commandName: "decrypt",
        commandDescription: "Decrypt a sealed manifest archive",
        prompt: "Archive passphrase >",
        mask: true,
        matchMode: "exact",
        expected: "MSKU-4471",
        caseSensitive: false,
        successMessage: "Archive decrypted.",
        failureMessage: "Wrong passphrase.",
    },
    "fx.pay": { amount: 4200, description: "Consulting fee", fromName: "Dock Workers' Union" },
    "fx.withdraw": { amount: 250, description: "Equipment rental" },
    "fx.notify": {
        message: "Badge log shows an entry at 02:40 with no matching exit.",
        variant: "toast",
        tone: "info",
    },
    "fx.setData": { key: "containerId", value: "MSKU-4471" },
    "fx.claimQuest": { questName: "NextQuest" },
    "fx.shell": { command: "echo 'manifest retrieved' >> ~/notes.txt" },
    "fx.handbook": { articleId: "night-shift", category: "Dock Operations" },
    "flow.branch": {
        source: "data",
        conditions: [{ id: "c1", join: "and", field: "containerId", op: "equals", value: "MSKU-4471" }],
    },
    "flow.delay": { ms: 2500 },
    "flow.random": {
        options: [
            { id: "o1", label: "MSKU-4471" },
            { id: "o2", label: "MSKU-4472" },
        ],
        storeAs: "containerId",
    },
    "flow.sequence": {
        steps: [
            { id: "s1", label: "Lights out", delayMs: 0 },
            { id: "s2", label: "Radio crackles", delayMs: 1500 },
            { id: "s3", label: "Door unlocks", delayMs: 2500 },
        ],
    },
    "flow.debug": {
        label: "after the exploit",
        includeData: true,
        includePayload: true,
        toast: false,
    },
    "flow.note": {
        text: "This quest is a reference sheet, not a story.\n\nEvery node type is here once, filled with example input. Select any node and hover the ⓘ next to a field label to read what it does.",
        width: 300,
    },
};

/**
 * Every node type, once, filled with example data.
 *
 * This is the "what am I even supposed to type here" answer. It is deliberately
 * laid out by category rather than wired into a story: the point is to read the
 * fields, not to follow a plot.
 */
function buildReference(): ProjectDocument {
    resetIds();
    const quest = createQuest({
        id: "q-reference",
        name: "NodeReference",
        closingObjectiveText: "Reference tour finished.",
        title: "Node Reference",
        description: "Every node type, filled with example input. Not a playable quest.",
        rewards: { money: 0, xp: 0 },
        dataKeys: [{ key: "containerId", type: "string" }],
    });

    const groups = [
        { id: "entry", title: "Quest lifecycle — four independent starting points" },
        { id: "objective", title: "Objectives" },
        { id: "trigger", title: "Triggers" },
        { id: "world", title: "World building" },
        { id: "comms", title: "Communication" },
        { id: "reply", title: "Player replies" },
        { id: "effect", title: "Effects" },
        { id: "flow", title: "Flow control" },
        { id: "layout", title: "Layout" },
    ];

    const nodes: NodeDoc[] = [];
    const ROW_HEIGHT = 200;
    const COL_WIDTH = 250;

    groups.forEach((group, row) => {
        const types = (Object.keys(NODE_TYPES_REGISTRY) as NodeType[]).filter(
            (t) => nodeTypeDef(t).category === group.id,
        );
        const y = row * (ROW_HEIGHT + 120);

        nodes.push(
            makeNode("flow.note", { x: 0, y }, {
                text: group.title,
                width: 220,
            }),
        );

        types.forEach((type, col) => {
            nodes.push(
                makeNode(type, { x: 280 + col * COL_WIDTH, y }, EXAMPLES[type]),
            );
        });
    });

    quest.graph = { nodes, edges: [] };
    quest.dialog = [
        {
            id: "d1",
            name: "default",
            lines: [
                {
                    id: "l1",
                    speaker: "Shift foreman",
                    text: "You're asking about 4471. Stop.",
                    isEnd: false,
                    options: [
                        { id: "o1", label: "Why?", text: "Why should I stop?", nextIndex: 1, isEnd: false },
                    ],
                },
                { id: "l2", speaker: "Shift foreman", text: "Because I'm asking you to.", isEnd: true, options: [] },
            ],
        },
    ];

    return createProject({
        mod: {
            id: "node-reference",
            name: "Node Reference",
            version: "1.0.0",
            author: "",
            description: "A reference sheet: every node type with example input.",
            tags: ["reference", "documentation"],
            dependencies: [],
            minSdkVersion: "0.21.0",
            apiVersion: 1,
        },
        quests: [quest],
        editor: { activeQuestId: quest.id, viewports: {} },
    });
}

export const TEMPLATES: Template[] = [
    {
        id: "blank",
        name: "Blank quest",
        description: "The four lifecycle entry points and an explanatory note. Start from scratch.",
        difficulty: "Beginner",
        nodeCount: 5,
        build: buildBlank,
    },
    {
        id: "hello-hack",
        name: "Hello Hack",
        description: "One objective completed by a single nmap scan, then a payout.",
        difficulty: "Beginner",
        nodeCount: 6,
        build: buildHelloHack,
    },
    {
        id: "wifi-hack",
        name: "Simple Linear Wi-Fi Hack",
        description:
            "Briefing e-mail, a crackable access point, bettercap recon, fern passphrase recovery and joining the network — all in a straight line.",
        difficulty: "Beginner",
        nodeCount: 11,
        build: buildWifiHack,
    },
    {
        id: "investigation",
        name: "Complex Branching Investigation",
        description:
            "A corporate network behind a firewall, a website with an unlinked page, mail / Kisscord / WeeChat / a phone call, a branch on how the player got in, and a passphrase ending.",
        difficulty: "Advanced",
        nodeCount: 29,
        build: buildInvestigation,
    },
    {
        id: "data-grab",
        name: "Standard Contract Hack",
        description:
            "The job the game hands out constantly: a name in an e-mail, an OSINT lookup, whois, a scan, one exploit on port 22, and a file the client wants a copy of. One admin account on the server, so no password cracking — the short route, start to finish.",
        difficulty: "Beginner",
        nodeCount: 22,
        build: buildDataGrab,
    },
    {
        id: "contract-hack",
        name: "The Ledger Contract",
        description:
            "A file on one man's personal PC, and everything between: OSINT, whois, a scan, mapping the network behind the router, an exploit that lands you as guest, cracking his password out of /etc/passwd, and a client who checks before she pays.",
        difficulty: "Advanced",
        nodeCount: 33,
        build: buildContractHack,
    },
    {
        id: "dirhunter-leak",
        name: "The Help Desk Leak",
        description:
            "A public agency site, a portal that refuses you, and an unlisted page dirhunter can find. The password is assembled from two pages the agency published itself — the classic web-recon loop, with a real website in the box.",
        difficulty: "Intermediate",
        nodeCount: 21,
        build: buildDirhunter,
    },
    {
        id: "reference",
        name: "Node Reference",
        description:
            "Every node type on one canvas, filled with example input. Open it to see what a field expects before you build your own.",
        difficulty: "Reference",
        nodeCount: 40,
        build: buildReference,
    },
];

export function getTemplate(id: string): Template | undefined {
    return TEMPLATES.find((t) => t.id === id);
}
