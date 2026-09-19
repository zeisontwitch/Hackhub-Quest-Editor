import { createQuest, createProject, createTwotterAccount } from "@/schema/project";
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
    "world.wifi": {
        ssid: "DOCKNET-5G",
        password: "forklift-1948",
        signal: 2,
        bssid: "02:24:00:00:17:48",
        channel: 44,
        wps: true,
        model: "TP-Link Archer C6",
        ports: [
            { id: "wp1", external: 80, internal: 80, active: true, service: "http" },
        ],
        users: [
            { id: "wu1", username: "admin", password: "forklift-1948", firstName: "Dock", lastName: "Admin" },
        ],
        children: [
            {
                id: "wdev1",
                ip: "10.0.0.21",
                type: "DEVICE",
                name: "camera-01",
                vulnerabilities: [],
                users: [],
                ports: [{ id: "wp2", external: 22, internal: 22, active: true, service: "ssh" }],
                rules: [],
                rootFiles: [],
                children: [],
            },
        ],
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
    "world.packData": {
        packId: "example-tools",
        packName: "Example Tools",
        gameModName: "Example Tools",
        contractId: "loot",
        contractLabel: "Plant loot on a machine",
        storageKey: "exampletools.loot",
        merge: "replace",
        mergeBy: "target",
        entry: { target: "{{target}}", files: [{ path: "{{path}}", data: "{{data}}\n" }] },
        fields: [
            { key: "target", label: "Host or IP", type: "string" },
            { key: "path", label: "File path", type: "string" },
            { key: "data", label: "File contents", type: "text" },
        ],
        values: { target: "10.0.0.14", path: "/var/log/manifest-14.txt", data: "CONTAINER MSKU-4471 — 14th, 02:40 — sealed, unsigned." },
    },
    "pack.node": {
        packId: "example-tools",
        packName: "Example Tools",
        packVersion: "1.0.0",
        gameModName: "Example Tools",
        nodeId: "example-tools/breach-ping",
        nodeLabel: "Announce the handover",
        emitter: "emit",
        eventName: "ExampleTools.Handover.Done",
        payload: { target: "{{target}}" },
        fields: [{ key: "target", label: "Host or IP", type: "string" }],
        values: { target: "10.0.0.14" },
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
    "comms.tweet": {
        accountId: "acc-harbourmaster",
        tweets: [
            {
                id: "t1",
                content: "Night shift again. The manifest says 4471 was sealed at 02:40 — nobody signed for it.",
                timeMode: "earlier",
                agoAmount: 3,
                agoUnit: "days",
                likes: 34,
                comments: 2,
                shares: 1,
                views: 812,
                showInTimeline: false,
            },
            {
                id: "t2",
                content: "Someone is asking the right questions about container 4471. That makes two of us.",
                timeMode: "arrival",
                likes: 11,
                comments: 0,
                shares: 0,
                views: 240,
                showInTimeline: true,
            },
        ],
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
    "fx.prompt": {
        title: "Manifest check",
        label: "Enter the sealed container number:",
        placeholder: "MSKU-4471",
        defaultValue: "MSKU-",
        password: false,
        storeAs: "containerId",
        matchMode: "contains",
        expected: "4471",
        caseSensitive: false,
    },
    "fx.setData": { key: "containerId", value: "MSKU-4471" },
    "fx.claimQuest": { questName: "NextQuest" },
    "fx.unclaimQuest": { questName: "SideQuest" },
    "fx.shell": { command: "echo 'manifest retrieved' >> ~/notes.txt" },
    "fx.handbook": { articleId: "night-shift", category: "Dock Operations" },
    "flow.branch": {
        source: "data",
        conditions: [{ id: "c1", join: "and", field: "containerId", op: "equals", value: "MSKU-4471" }],
    },
    "flow.delay": { seconds: 2.5 },
    "flow.timer": { mode: "daytime", offsetMonths: 1, offsetWeeks: 2, offsetDays: 2, hour: 18, minute: 23 },
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
        { id: "reply", title: "Custom terminal" },
        { id: "effect", title: "Effects" },
        { id: "community", title: "Community addons" },
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
        /* The Tweet node above posts from this account. Accounts are mod-level,
           so the reference sheet ships one for the example to point at. */
        twotterAccounts: [
            createTwotterAccount({
                id: "acc-harbourmaster",
                handle: "harbourmaster",
                displayName: "Dana Whitlock",
                bio: "Harbour master, night shift. Everything that leaves this dock goes through me.",
                /* Two tiny pictures drawn by hand, so the account's profile
                   preview shows the whole thing — a banner, and an avatar with
                   the ring around it. They are the shapes the game's own
                   profile uses; the twenty-pixel ones would look the same on a
                   card, but a preview is for seeing the real thing. */
                avatar: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAEUklEQVR42u1a2VIUQRCsRz/AB8Pwya/zwhtEFERFDT9LEFARBUQRRE4RRBQQDwzDCHMqu2uaXWZndlkCpsOIfJjuuTKrsmpnZ1qOHT9ZakhzL3fi6JFcHDoBRUjvnxg5KOrNkiEHS33vMuQwUN+LDDk81BuTIU1n/+iUAL2nK8H5pmuQprA3xn3AGXmcAezqC/Q0RYPskT2pgxb49QNnZUAxWAXO44B+iikmY68C8qkrG/IePCdPFE+Blir4vTiMSpiTXBmNC6hxUYs6g22kn7XIEHBenlcBk0N6gIlhWiwbjWmQetkjWs4wRp28leUwcEFeZAC7hr0YKqGMfi+jRirqE5DLnoZBIFPqSvHlRRkhLsloAAw5jwOoJJXhTdWYBqmXfb+yZ+BT6gHpMeCyvKoCJscCMTjFZDAVA1rf9WooKsDY0zYMPKMONuQNluPAFXmteBOAM9g1TjFU4rPBVDg71dSQL6AgewaehnHUSfqqTCjetlaC8ziASiiDpmIqGtNQSID53tjT7qPqFgTVqIPoZKtMtSV4F4Azk16Jk6G+wkVYGKbB6qFuAVkdM4s9Aw+HkPpUq6M7fU3eVwGTTozJ8KnI0tBbQEOOAGce9hzve2PPwDPqxnumPcEscF3mFNiYbXfzpoTZYCpMA+sBN8LtcNMsI+0uoEb44Us0uyz2dAupgygYzwMdshAAw3mK8TLoq0wNWgxFkiA54a8yT1K1dI5nz8A76kp38YZ8UCwpuI1JKqEMpsI04IK47EiVkUCgdhKkUPi9edhzUHywb8peA48AkzoYf7yZYLkzBWeWTAY1tAcaWNPal1IjFUiC5Lo/DX9gHpQgfc/Yg9BiRxJm8l7plE9dlVjxSpJsmAZfDxOBkXAjS0JuJWQKsOZj7nfh9+bZlT2pr3bJ51uyFgDDVS9jVw2pkcIk1GxH+QKSXy5tPs79QfjRCqe1aufUOSH7hHq3fOmWr7dTYIhJ7Ao1LGg9zNBIQRJwI1aCa0e5ArJ+vMw/eIRk80ncXxF+9X3IntQ3gDuyqcDGhpcRasCJOL0yCdaOdrooqwwkt//gIT70j7nfwo/SXA7Yryv1b3dlKwCGmFwPNOCUpSAJVgk7XFSgF2UKCAvAuqfzT5vzT+J+H35YfI2xV/bfe+RHj/y8lwAbGFIDDsBhq2ESzEVtzkXWT8MyqE9A2EArCoDd0/xD91v4YRWyB+9f92VbgQ0MnYYgCawEcxH76S5lULOOiwpgA2X7dwXgy5f+Qath+GEYhBykfz+QPwpsYIjJLUuCdxFLGZdKy8Ca6X4LqCgACthUAYg3Ag/qfx8mwMa2JgG7NncKsDL4LyB6C5WsiEvfRkv/Q1ayR4nSP8zF+Thd+j80JftLWfo/9TG8Vin9i60YXi2W/uVuDK/XS/+BI4ZPTKX/yBfDZ9YYPnTHsNQghsUeMSy3iWHBUwxLzmJY9BfJsstIFr5GsvQ4ksXfB4t/E1kscby2JGwAAAAASUVORK5CYII=",
                banner: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAAB4CAIAAABD1OhwAAADHklEQVR42u3SWVJTURhF4f9ZCAmkA8QAoQlNOhKa0ATsRUWxfXMQPjpAx+B4vFVqCVZpce7JwXN3VtU3gr2X3am0ARnGBNAKutoBZCRBdwEZNjG7A8ggaIgFPdcDZNjEfB+QYZPzu4AMm7y7C8hIgt4DZNjkwj4gw3ILB4AMy90bADIsVxsAMmyqdgjIsKnFI0BGEvQxIMOmlo4BGZZfOgFkWH55CMiwfP0UkEHQ0Aq6sHIGyEiCvg/IsMLqA0CGTa89BGQQNMSCXn8EyEiCfgzIsJnGE0AGQUMs6I2ngAyb2XwGyLDi5jkgw4pb54CMJOjngAwrbr8AZFhp+yUgw0rNC0CGlVoXgAwrt14BMqzcfg3ISIK+BGRYuXMJyLBK5w0gwyrdt4AMq+y8A2QQNLSCrvbeAzKSoD8AMqza/wjIsPqnz4AMggZBAwQNEDRA0CBogKCB+IIu1JoI6svXbzfHXJ4ImqAJGgQdcdAtBOUYNIt5scJiC0G5Bc1ifgiaoLWCnl5sIyinoJnLE0ETtFjQS20E5RY0i/lJgu4gKMegWcwLQRM0QYOgow16ZrmLoJyCZi5PBE3QBA2Cjjfo+g6CcguaxfwQNEETNAg62qCL9R6CcgqauTxZcaWHoNyCZjE/BE3QakH3EZRj0CzmhaAJWizo1T6CcguaxfxYaXUXQTkFzVyeCJqgCRoEHW/Qa3sIyi1oFvND0ARN0CDoaIMur+8jKKegmcsTQQesMwUWJmiRlAl6VEEf4N9uJ+VfQTO4Fys3DvA3t5nyz6CZ3Q9Bx5IyQY8m6EpjgKv+V8o/sL8ngo4lZYIeUdAbA8SQ8u+mecRDEvThOIsq5etZHyIFI+WYEShBi6RM1imDrm4ejY/MpXzVWD2VmpEyWRM0KZN1tEFvHauSTPla1rrfpWakTNYETcpkHWvQs1snGsY25atk3kzNZrdPso6O/8w6+5+mZqRM1mJBD7OIXm+c9XCsGCmTtVbQzWFW0KVv1tn5OjWba57GjxZHKBOPp2akTNYETcpkHW3QrbPY0NltZx1fA6kZKUMpayNlKGX9HWDVqH/VB9+iAAAAAElFTkSuQmCC",
                verified: false,
                followers: 412,
                following: 96,
            }),
        ],
        editor: { activeQuestId: quest.id, viewports: {} },
    });
}
