import { createQuest, createProject } from "@/schema/project";
import type { ProjectDocument } from "@/schema/project";
import { NODE_TYPES_REGISTRY, PALETTE_HIDDEN_TYPES, nodeTypeDef } from "@/schema/registry";
import type { NodeDoc, NodeType } from "@/schema/nodes";
import { makeNode, resetIds } from "@/templates/kit";

export const EXAMPLES: Partial<Record<NodeType, Record<string, unknown>>> = {
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
    /* "world.wifi": hidden from the palette (see PALETTE_HIDDEN_TYPES) because
       the mod SDK has no wireless API yet; re-add the example here and drop it
       from PALETTE_HIDDEN_TYPES once the SDK ships one.
       ssid: "DOCKNET-5G", password: "forklift", signal: 2, model: "TP-Link Archer C6". */
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
    "flow.beat": {
        title: "Act 1 — recon",
        text: "A planning beat. It is stripped from the exported mod and never runs; it just helps you sketch the story on the canvas.",
        color: "#0ea5e9",
        width: 280,
        choices: [
            { id: "c1", label: "Scan the edge", note: "find port 22" },
            { id: "c2", label: "Go in the front", note: "social engineering" },
        ],
    },
}

export function buildReference(): ProjectDocument {
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
        /* The reference sheet mirrors the palette: it shows what an author can
           actually build. Engine-only types that are hidden from the palette
           (see PALETTE_HIDDEN_TYPES) are left out so a reader is not shown a
           node they cannot add. */
        const types = (Object.keys(NODE_TYPES_REGISTRY) as NodeType[]).filter(
            (t) => nodeTypeDef(t).category === group.id && !PALETTE_HIDDEN_TYPES.has(t),
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
