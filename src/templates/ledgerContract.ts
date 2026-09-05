import { createQuest, createProject } from "@/schema/project";
import type { ProjectDocument } from "@/schema/project";
import { TARGET_IP_TOKEN } from "@/schema/common";
import { SITE_TEMPLATES } from "@/templates/pages";
import { applyLayout, makeEdge, makeNode, resetIds, triggerFor } from "@/templates/kit";

export function buildContractHack(): ProjectDocument {
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
