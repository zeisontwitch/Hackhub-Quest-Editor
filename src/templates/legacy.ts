import { createQuest, createProject } from "@/schema/project";
import type { ProjectDocument } from "@/schema/project";
import { TARGET_IP_TOKEN } from "@/schema/common";
import { SITE_TEMPLATES } from "@/templates/pages";
import { applyLayout, makeEdge, makeNode, resetIds, triggerFor } from "@/templates/kit";

export function buildHelloHack(): ProjectDocument {
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

export function buildWifiHack(): ProjectDocument {
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

export function buildInvestigation(): ProjectDocument {
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

export function buildDirhunter(): ProjectDocument {
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
