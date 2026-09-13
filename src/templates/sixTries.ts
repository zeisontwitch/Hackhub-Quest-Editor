/**
 * Six Tries — Advanced.
 *
 * The official quests' favourite route, and the step no other template
 * teaches: hydra. The client's brief includes no credentials — finding the
 * box is recon, but getting in means cracking it (`hydra -T ip:port`), then
 * walking the cracked login straight into `ssh -h`. Named for the six tasks
 * hydra prints while it runs.
 *
 *   brief  →  lynx the manager  →  nmap  →  hydra  →  ssh -h  →  cat  →  report.
 */
import { createQuest, createProject, type ProjectDocument } from "@/schema/project";
import { TARGET_IP_TOKEN } from "@/schema/common";
import { makeEdge, makeNode, resetIds, triggerFor } from "@/templates/kit";

export function buildSixTries(): ProjectDocument {
    resetIds();
    const MANAGER = "Dorian Vex";
    const DOMAIN = "vinylgrave.net";
    /* The game allocates the address; {{data.targetIp}} reads it back (r73). */
    const IP = TARGET_IP_TOKEN;
    const FILE = "demos-1997";
    const CLIENT = "e.malone@nullpost.io";

    const quest = createQuest({
        id: "q-six-tries",
        name: "SixTries",
        closingObjectiveText: "The tapes are home. The label never knew.",
        title: "Six Tries",
        autoStart: true,
        description:
            "A band's unreleased demos are locked inside their old label's archive station. No password was ever handed over — crack it, walk in, and read the tapes home.",
        group: "side",
        rewards: { money: 1800, xp: 90 },
        employer: { firstName: "Edith", lastName: "Malone", email: CLIENT },
    });

    const claim = makeNode("entry.start", { x: 0, y: 200 });

    /* ── the world ──────────────────────────────────────────────────────── */

    const network = makeNode("world.network", { x: 300, y: 0 }, {
        ipMode: "random",
        destroyOnComplete: false,
        /* One public archive station, reachable directly — this template's
           job is the crack, not the topology (the Ledger Contract teaches
           routers and network maps). ONE shared guest login and no other
           accounts: extraAccounts false keeps the engine's stock users out,
           and hydra runs against guest unless the player names someone. */
        device: {
            id: "dev-station",
            ip: IP,
            name: "vinylgrave-archive",
            type: "DEVICE",
            domainName: DOMAIN,
            vulnerabilities: [],
            ports: [
                { id: "p-ssh", external: 22, internal: 22, active: true, locked: false, service: "ssh", version: "OpenSSH 6.4.0" },
                { id: "p-http", external: 80, internal: 80, active: false, locked: false, service: "http", version: "nginx 1.14.2" },
            ],
            extraAccounts: false,
            users: [
                {
                    id: "u-guest",
                    username: "guest",
                    password: "rehearsal",
                    firstName: "Vinylgrave",
                    lastName: "Shared Login",
                    acceptReverseTCP: true,
                    files: [
                        {
                            id: "f-demos",
                            name: FILE,
                            extension: "txt",
                            isFolder: false,
                            data: [
                                "VINYLGRAVE RECORDS — unreleased, DO NOT DISTRIBUTE",
                                "",
                                "1. Paper Lanterns (4:12)",
                                "2. Six Tries (3:48)",
                                "3. Kessel Run at Dawn (5:03)",
                                "4. Rehearsal, Cited (2:57)",
                                "5. Hamburg, Rain (6:31)",
                                "",
                                "Master takes, unmastered. Mix notes in the sleeve.",
                            ].join("\n"),
                        },
                    ],
                },
            ],
            /* The engine's connection logger appends to the machine's own
               sys.log; merge with it instead of making a second logs folder. */
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
                            data: ["boot: ok", "sshd: listening on 22", "backup: sundays, 04:00"].join("\n"),
                        },
                    ],
                },
            ],
            files: [],
        },
    });

    const lynx = makeNode("world.toolResponse", { x: 620, y: 0 }, {
        command: "lynx",
        input: MANAGER,
        dataText: [
            `Name:      ${MANAGER}`,
            "Role:      Label Manager, Vinylgrave Records",
            "Location:  Hamburg, DE",
            `Web:       https://${DOMAIN}`,
            `IP:        ${IP}`,
        ].join("\n"),
        removeOnComplete: true,
    });

    const nmap = makeNode("world.toolResponse", { x: 940, y: 0 }, {
        command: "nmap",
        input: IP,
        dataText: [
            "PORT     STATE  SERVICE  VERSION",
            "22/tcp   open   ssh      OpenSSH 6.4.0",
            "80/tcp   closed http",
        ].join("\n"),
        removeOnComplete: true,
    });

    /* hydra is keyed by user + target, not a single input — the registry
       fields for it are inputUser/inputTarget, and the data is the
       credentials the run ends with. */
    const hydra = makeNode("world.toolResponse", { x: 1260, y: 0 }, {
        command: "hydra",
        inputUser: "guest",
        inputTarget: IP,
        dataText: ["username: guest", "password: rehearsal"].join("\n"),
        removeOnComplete: true,
    });

    const brief = makeNode("comms.dialogue", { x: 1580, y: 0 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "The master tapes",
            content: [
                "My old band cut one record, in 1997, and it was never released. The master file is still sitting on our label's archive station — vinylgrave-archive — and their manager, Dorian Vex, has ignored every mail for two years.",
                "I don't have a password. Nobody is going to give me one; that is the job.",
                "Read the file to yourself first — I want to know the tapes survived — then send me what it says, right here.",
            ].join("\n\n"),
            /* Off deliberately: this build has no reply flag on the mail it
               actually sends, so the box must not promise a Reply button
               (round 70). The player answers with their own mail in GoMail. */
            replyable: false,
        },
    });

    /* ── objectives ─────────────────────────────────────────────────────── */

    const oBrief = makeNode("objective", { x: 620, y: 200 }, {
        name: "read-brief",
        description: "Read Edith's mail",
        hint: "It is in your mailbox.",
    });
    const oFind = makeNode("objective", { x: 940, y: 200 }, {
        name: "find-label",
        description: "Find where the label keeps its archive",
        hint: "lynx looks people up. The manager's entry carries the station's address.",
        terminalCommand: `lynx "${MANAGER}"`,
    });
    const oScan = makeNode("objective", { x: 1260, y: 200 }, {
        name: "scan-station",
        description: "See what the station is running",
        hint: "nmap with -sV reports versions as well as open ports.",
        terminalCommand: `nmap ${IP} -sV`,
    });
    const oCrack = makeNode("objective", { x: 1580, y: 200 }, {
        name: "crack-login",
        description: "Crack the station's login",
        hint: "hydra -T address:port -P wordlist.lst runs a wordlist at the login. It prints the credentials when it finds them.",
        info: "hydra tries the guest login unless you name someone with -l.",
        terminalCommand: `hydra -T ${IP}:22 -P wordlist.lst`,
    });
    const oIn = makeNode("objective", { x: 1900, y: 200 }, {
        name: "get-in",
        description: "Log in with what hydra found",
        hint: "ssh -h guest@ADDRESS, then give the cracked password at the prompt. The -h is the form the game's own handbook teaches.",
        terminalCommand: `ssh -h guest@${IP}`,
    });
    const oTake = makeNode("objective", { x: 2220, y: 200 }, {
        name: "read-tapes",
        description: `Read the ${FILE} file`,
        hint: "You are on the machine — cat prints a file's contents where you sit.",
        terminalCommand: `cat ${FILE}.txt`,
    });
    const oSend = makeNode("objective", { x: 2540, y: 200 }, {
        name: "send-tapes",
        description: "Send the track list to Edith",
        hint: `Mail it to ${CLIENT}.`,
    });

    const t1 = triggerFor(oBrief, "Mail.Read", [{ field: "subject", op: "contains", value: "master tapes" }], { x: 620, y: 360 });
    const t2 = triggerFor(oFind, "Terminal.Lynx.Search", [{ field: "query", op: "contains", value: "Vex" }], { x: 940, y: 360 });
    const t3 = triggerFor(oScan, "Terminal.NmapScan", [{ field: "ip", op: "equals", value: IP }], { x: 1260, y: 360 });
    /* Terminal.Hydra carries credentials only when the run found them, so the
       objective ticks on the cracked login itself — a failed run cannot
       complete it. */
    const t4 = triggerFor(oCrack, "Terminal.Hydra", [{ field: "credentials.username", op: "equals", value: "guest" }], { x: 1580, y: 360 });
    /* The SSH.Connected payload is the bare address; matching on ip reads it. */
    const t5 = triggerFor(oIn, "Terminal.SSH.Connected", [{ field: "ip", op: "equals", value: IP }], { x: 1900, y: 360 });
    const t6 = triggerFor(oTake, "Terminal.Cat", [{ field: "name", op: "equals", value: FILE }], { x: 2220, y: 360 });
    const t7 = triggerFor(oSend, "Mail.Sent", [{ field: "to", op: "contains", value: CLIENT }], { x: 2860, y: 360 });

    /* ── the payoff ─────────────────────────────────────────────────────── */

    const thanks = makeNode("comms.dialogue", { x: 2860, y: 520 }, {
        kind: "mail",
        mail: {
            from: CLIENT,
            subject: "Re: The master tapes",
            content: [
                "That is them. Twenty-six years and they still sound like tomorrow.",
                "Money is with you. If Vex ever answers, tell him nothing.",
            ].join("\n\n"),
            replyable: false,
        },
    });

    const pay = makeNode("fx.pay", { x: 3180, y: 520 }, {
        amountMode: "fixed",
        amount: 1800,
        description: "The master tapes, recovered",
        fromName: "E. Malone",
    });

    const note = makeNode("flow.note", { x: -140, y: 700 }, {
        text: [
            "ADVANCED — the crack-and-log-in route the official quests use most.",
            "",
            "The step between scanning and logging in that no other template teaches: hydra. Point it at address:port, let it run, and the objective waits on Terminal.Hydra — the event only carries credentials when the run succeeded, so a failed crack cannot tick it.",
            "",
            "Then ssh -h guest@ADDRESS with the cracked password (the -h is the form the game's handbook teaches), cat the file, and mail the client.",
            "",
            "The station has ONE shared guest login and no stock accounts — hydra runs against guest unless the player names someone with -l. The tool response is keyed user + target for exactly that reason.",
            "",
            "Deliberately left out: metasploit (Harbour Manifest), routers and network maps (Ledger Contract), websites (The Byline). The engine logs the player's connection on the machine itself — covering tracks is the game's job, no node needed.",
        ].join("\n"),
        width: 340,
    });

    quest.graph = {
        nodes: [
            claim,
            network, lynx, nmap, hydra, brief,
            oBrief, oFind, oScan, oCrack, oIn, oTake, oSend,
            t1.trigger, t2.trigger, t3.trigger, t4.trigger, t5.trigger, t6.trigger, t7.trigger,
            thanks, pay, note,
        ],
        edges: [
            // build the world once, on claim
            makeEdge(claim, "out", network, "in"),
            makeEdge(network, "out", lynx, "in"),
            makeEdge(lynx, "out", nmap, "in"),
            makeEdge(nmap, "out", hydra, "in"),
            makeEdge(hydra, "out", brief, "in"),
            // the objective chain: each one unlocks the next
            makeEdge(oBrief, "unlock", oFind, "unlocked-by"),
            makeEdge(oFind, "unlock", oScan, "unlocked-by"),
            makeEdge(oScan, "unlock", oCrack, "unlocked-by"),
            makeEdge(oCrack, "unlock", oIn, "unlocked-by"),
            makeEdge(oIn, "unlock", oTake, "unlocked-by"),
            makeEdge(oTake, "unlock", oSend, "unlocked-by"),
            // their triggers
            t1.edge, t2.edge, t3.edge, t4.edge, t5.edge, t6.edge, t7.edge,
            // sending the tapes home is the end of the job
            makeEdge(oSend, "done", thanks, "in"),
            makeEdge(thanks, "out", pay, "in"),
        ],
    };

    return createProject({
        mod: {
            id: "six-tries",
            name: "Six Tries",
            version: "1.0.0",
            author: "",
            description: quest.description,
            tags: ["quest", "hacking", "hydra", "ssh", "advanced"],
            dependencies: [],
            minSdkVersion: "0.21.0",
            apiVersion: 1,
        },
        quests: [quest],
        editor: { activeQuestId: quest.id, viewports: {} },
    });
}
