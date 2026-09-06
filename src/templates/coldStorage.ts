/**
 * Cold Storage — Expert.
 *
 * The long route into one company's network: scan the edge, recover the router
 * passphrase, get past the edge, land a session on the storage server, and read
 * the lead ledger straight out of the database. It is the expert template
 * because it chains several tools and two hosts.
 *
 * SDK 0.21.0 has no wireless API, so the "cold storage wireless" identity is
 * modelled as a plain router network (the router's `model` still enables the
 * in-game `fern` recovery route, and its admin account is the "router login"
 * step). The wireless recon/join events (Bettercap.WifiRecon,
 * Network.WifiConnected) are deliberately not used: they cannot be guaranteed
 * to fire in this build. Every objective below waits on an event the runtime
 * actually emits.
 */
import { createQuest, createProject, type ProjectDocument } from "@/schema/project";
import { TARGET_IP_TOKEN } from "@/schema/common";
import { applyLayout, makeEdge, makeNode, resetIds, triggerFor } from "@/templates/kit";

const ROUTER_MODEL = "MikroTik hAP ac2";
const ROUTER_ADMIN_PASS = "pierhead1948";
const EDGE_IP = TARGET_IP_TOKEN;
const DB_HOST = "10.11.4.27";
const DB_USER = "storead";
const DB_PASS = "ColdChain67";
const CLIENT = "m.okafor@nullpost.io";

export function buildColdStorage(): ProjectDocument {
    resetIds();
    const quest = createQuest({
        id: "q-cold-storage",
        name: "ColdStorage",
        closingObjectiveText: "The ledger is with the client. The cold store never knew.",
        title: "Cold Storage",
        autoStart: true,
        description: "A cold-storage firm keeps a lead ledger its customers would rather not see. Find their edge, get past it, read the ledger.",
        group: "side",
        rewards: { money: 26000, xp: 1100 },
        employer: { firstName: "Mercy", lastName: "Okafor", email: CLIENT },
    });

    const claim = makeNode("entry.start", { x: 0, y: 0 });
    const complete = makeNode("entry.complete", { x: 0, y: 400 });

    /* ── the world the player will explore ──────────────────────────────── */

    /* The company's edge router, and the storage server behind it. The router
       is the way IN; the server is the prize. */
    const network = makeNode("world.network", { x: 320, y: 0 }, {
        ipMode: "random",
        destroyOnComplete: false,
        device: {
            id: "dev-edge",
            ip: EDGE_IP,
            name: "northpier-edge",
            type: "ROUTER",
            model: ROUTER_MODEL,
            accessable: true,
            vulnerabilities: [],
            /* One admin account on the edge — the "router login" step. */
            users: [
                { id: "u-admin", username: "admin", password: ROUTER_ADMIN_PASS, firstName: "North Pier", lastName: "Admin" },
            ],
            /* Web only, and locked. The exploitable SSH leads to the machine
               behind the router, not to the edge itself. */
            ports: [
                { id: "p-http", external: 80, internal: 80, active: true, locked: true, service: "http" },
            ],
            rules: [],
            files: [],
            children: [
                {
                    id: "dev-store",
                    ip: DB_HOST,
                    name: "coldstore-01",
                    type: "DEVICE",
                    vulnerabilities: [
                        { id: "v1", type: "RCE", version: "PostgreSQL 9.6.23" },
                    ],
                    /* The way in is SSH. It is open where the edge's web port is
                       locked, matching every network in the reference mod. */
                    ports: [
                        { id: "p-ssh-store", external: 22, internal: 22, active: true, locked: false, service: "ssh", version: "OpenSSH 8.4.0" },
                    ],
                    extraAccounts: false,
                    users: [
                        {
                            id: "u-storead",
                            username: DB_USER,
                            password: DB_PASS,
                            firstName: "Stine",
                            lastName: "Adler",
                            acceptReverseTCP: true,
                            files: [
                                {
                                    id: "f-notes",
                                    name: "rotation",
                                    extension: "txt",
                                    isFolder: false,
                                    data: "Zone list is in the postgres DB. Ask the DBA for the read-only account. Do not e-mail the ledger.",
                                },
                            ],
                        },
                    ],
                    rules: [],
                    rootFiles: [
                        {
                            id: "f-logs",
                            name: "logs",
                            isFolder: true,
                            children: [
                                {
                                    id: "f-sys",
                                    name: "sys",
                                    extension: "log",
                                    isFolder: false,
                                    data: "boot: ok\nsshd: listening on 22\npostgres: listening on 3306",
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

    /* Bring the storage server forward through the edge so the player can reach
       it. Runs on quest start. */
    const port = makeNode("world.port", { x: 640, y: 0 }, {
        ip: EDGE_IP,
        action: "open",
        port: { id: "p1", external: 22, internal: 22, active: true, service: "ssh" },
        restoreOnComplete: true,
    });

    /* The database port is firewalled direct — the player has to get in a
       different way (through the shell), which is the point. */
    const firewall = makeNode("world.firewall", { x: 960, y: 0 }, {
        ip: DB_HOST,
        removeOnComplete: true,
        rule: { id: "r1", allowed: false, port: 3306, source: "*", destination: "*" },
    });

    const database = makeNode("world.database", { x: 1280, y: 0 }, {
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS,
        removeOnComplete: true,
    });

    const osint = makeNode("world.toolResponse", { x: 1600, y: 0 }, {
        command: "nmap",
        input: DB_HOST,
        dataText: [
            "Starting Nmap 7.94 ( https://nmap.org )",
            `Nmap scan report for ${DB_HOST}`,
            "Host is up (0.0021s latency).",
            "PORT     STATE SERVICE  VERSION",
            "22/tcp   open   ssh      OpenSSH 8.4.0",
            "3306/tcp closed postgresql",
            "",
            "Nmap done: 1 IP address (1 host up) scanned in 1.84 seconds",
        ].join("\n"),
        removeOnComplete: true,
    });

    const brief = makeNode("comms.dialogue", { x: 1920, y: 0 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "The cold-store ledger",
            content:
                "North Pier Cold Storage keeps a lead ledger on a private server. An auditor who worked there says the routes it sells are more than the manifests admit.\n\n" +
                `Their edge is a ${ROUTER_MODEL}. The staff reuse one account on it, and recovering the passphrase is a five-minute job with the right tool.\n\n` +
                `The server behind it is ${DB_HOST}. The database is the prize — but the port is firewalled, so the way in is the SSH behind the router, not the data port.\n\n` +
                `Get the ledger and mail it to me at ${CLIENT}.`,
            replyable: false,
        },
    });

    /* ── objectives, in the order a player actually works ───────────────── */

    const oScan = makeNode("objective", { x: 320, y: 220 }, {
        name: "scan-edge",
        description: "Scan the company's server",
        hint: `nmap ${DB_HOST} -sV tells you what is open against the box the brief names.`,
        info: "The data port is closed. Something else is not.",
        terminalCommand: `nmap ${DB_HOST} -sV`,
    });
    const oPass = makeNode("objective", { x: 640, y: 220 }, {
        name: "recover-passphrase",
        description: "Recover the edge router passphrase",
        hint: `The router model is ${ROUTER_MODEL}. fern recovers its passphrase from the model — feed the model in quotes.`,
        terminalCommand: `fern "${ROUTER_MODEL}"`,
    });
    const oAccess = makeNode("objective", { x: 960, y: 220 }, {
        name: "get-a-shell",
        description: "Land a session on the storage server",
        hint: "The server answers on 22 behind the router. metasploit has a module for it — the version the scan reported is the one to set.",
        info: "The router forwards the SSH port, so the box is reachable through the edge.",
        terminalCommand: "msfconsole",
    });
    const oDb = makeNode("objective", { x: 1280, y: 220 }, {
        name: "read-ledger",
        description: "Dump the lead ledger from the database",
        hint: "sqlmap, or a database client once you are on the box. The table is the lead ledger.",
        info: "The firewall blocks the data port, so read the database from inside the session.",
        terminalCommand: `sqlmap --dbs`,
    });
    const oSend = makeNode("objective", { x: 1600, y: 220 }, {
        name: "send-ledger",
        description: "Send the ledger to the client",
        hint: `Attach it to a mail to ${CLIENT}.`,
    });

    const tScan = triggerFor(oScan, "Terminal.NmapScan", [{ field: "ip", op: "equals", value: DB_HOST }], { x: 320, y: 380 });
    const tPass = triggerFor(oPass, "Fern.FindPassword", [{ field: "model", op: "equals", value: ROUTER_MODEL }], { x: 640, y: 380 });
    /* No condition on purpose: whether the session reports the edge's public
       address or the server's differs by route in, and a template should not
       fail for taking the other one. */
    const tAccess = triggerFor(oAccess, "Metasploit.Meterpreter.Connected", [], { x: 960, y: 380 });
    const tDb = triggerFor(oDb, "Sqlmap.DumpTable", [{ field: "host", op: "equals", value: DB_HOST }, { field: "tableName", op: "contains", value: "ledger" }], { x: 1280, y: 380 });
    const tSend = triggerFor(oSend, "Mail.Sent", [{ field: "to", op: "contains", value: CLIENT }], { x: 1600, y: 380 });

    /* ── the pay-off ────────────────────────────────────────────────────── */

    const thanks = makeNode("comms.dialogue", { x: 1600, y: 560 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "Received",
            content:
                "That is the one. Four routes that never appeared on any manifest, all sold quietly.\n\n" +
                "The firm will not sue — it would have to explain the routes. Money is with you.\n\n" +
                "Delete the file and stay off that dock.",
            replyable: false,
        },
    });

    const pay = makeNode("fx.pay", { x: 1920, y: 560 }, {
        amount: 26000,
        description: "Cold-store ledger",
        fromName: "M. Okafor",
    });

    const closing = makeNode("fx.notify", { x: 1920, y: 320 }, {
        message: "Ledger delivered. The cold store never knew.",
        variant: "toast",
        tone: "success",
    });

    const note = makeNode("flow.note", { x: 320, y: 560 }, {
        text: [
            "EXPERT. The long route through one company: scan the box, recover the edge passphrase, land a session, read the database, send it.",
            "",
            "Each objective completes on a real game event (the grey node under it). Change an IP or a model and change it in the matching trigger too.",
            "",
            "The edge is modelled as a plain router network because SDK 0.21.0 ships no wireless API — the router's `model` still enables `fern`, and its admin account is the 'login' step. The wireless recon/join events are deliberately left out because they cannot be guaranteed to fire. This is the part to playtest first.",
            "",
            "The player takes a COPY, not a hole: sending the ledger, not deleting it, is the job.",
        ].join("\n"),
        width: 340,
    });

    quest.graph = {
        nodes: [
            claim, complete, network, port, firewall, database, osint, brief,
            oScan, oPass, oAccess, oDb, oSend,
            tScan.trigger, tPass.trigger, tAccess.trigger, tDb.trigger, tSend.trigger,
            thanks, pay, closing, note,
        ],
        edges: [
            /* world setup, in order, on claim */
            makeEdge(claim, "out", network, "in"),
            makeEdge(network, "out", port, "in"),
            makeEdge(port, "out", firewall, "in"),
            makeEdge(firewall, "out", database, "in"),
            makeEdge(database, "out", osint, "in"),
            makeEdge(osint, "out", brief, "in"),
            /* the objective chain: each one unlocks the next */
            makeEdge(oScan, "unlock", oPass, "unlocked-by"),
            makeEdge(oPass, "unlock", oAccess, "unlocked-by"),
            makeEdge(oAccess, "unlock", oDb, "unlocked-by"),
            makeEdge(oDb, "unlock", oSend, "unlocked-by"),
            /* their triggers */
            tScan.edge, tPass.edge, tAccess.edge, tDb.edge, tSend.edge,
            /* the pay-off */
            makeEdge(oSend, "done", thanks, "in"),
            makeEdge(thanks, "out", pay, "in"),
            makeEdge(complete, "out", closing, "in"),
        ],
    };

    applyLayout(quest);

    return createProject({
        mod: {
            id: "cold-storage",
            name: "Cold Storage",
            version: "1.0.0",
            author: "",
            description: quest.description,
            tags: ["quest", "wireless", "metasploit", "database", "expert"],
            dependencies: [],
            minSdkVersion: "0.21.0",
            apiVersion: 1,
        },
        quests: [quest],
        websites: [],
        editor: { activeQuestId: quest.id, viewports: {} },
    });
}
