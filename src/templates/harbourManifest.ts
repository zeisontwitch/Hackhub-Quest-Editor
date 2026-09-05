import { createQuest, createProject } from "@/schema/project";
import type { ProjectDocument } from "@/schema/project";
import { TARGET_IP_TOKEN } from "@/schema/common";
import { SITE_TEMPLATES } from "@/templates/pages";
import { makeEdge, makeNode, resetIds, triggerFor } from "@/templates/kit";

export function buildDataGrab(): ProjectDocument {
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
