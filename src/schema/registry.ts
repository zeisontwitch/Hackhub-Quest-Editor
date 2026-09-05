/**
 * The node-type registry.
 *
 * One entry per node type, carrying everything the UI needs: palette metadata,
 * socket layout, default data, and the inspector's field descriptors. Adding a
 * node type means adding an entry here — the palette, the canvas and the
 * inspector all read from it.
 *
 * The descriptors are hand-authored per node type (docs/01 §4.1 deliberately
 * rejects a JSON-schema-driven form generator), but rendered by one shared
 * inspector engine so every node gets consistent, accessible controls.
 */
import { z } from "zod";
import { nanoid } from "nanoid";
import type { EdgeKind, HandleSpec } from "./edges";
import {
    DebugNodeDataSchema,
    DialogueNodeDataSchema,
    BranchNodeDataSchema,
ClaimQuestNodeDataSchema,
    DatabaseNodeDataSchema,
    DelayNodeDataSchema,
    DomainNodeDataSchema,
    EntryStartData,
    FilesNodeDataSchema,
    FirewallNodeDataSchema,
    HandbookNodeDataSchema,
    ManualInputNodeDataSchema,
    NetworkNodeDataSchema,
    NotifyNodeDataSchema,
    ObjectiveDataSchema,
    PayNodeDataSchema,
    PortNodeDataSchema,
    RandomPickNodeDataSchema,
    SetDataNodeDataSchema,
    SequenceNodeDataSchema,
    ShellExecNodeDataSchema,
    ToolResponseNodeDataSchema,
    TriggerEventDataSchema,
WifiNodeDataSchema,
    NoteNodeDataSchema,
    RerouteNodeDataSchema,
    LayoutGroupNodeDataSchema,
    type NodeDoc,
    type NodeType,
} from "./nodes";
import { VULNERABILITY_TYPES } from "./common";

/* ── Inspector field descriptors ─────────────────────────────────────────── */

/**
 * Show a field only when a sibling field holds one of the given values. Lets an
 * author-facing form reveal just the inputs that matter for the current choice
 * (e.g. a date picker only when the time mode is "a specific date").
 */
export type FieldShowWhen = { key: string; equals: string | readonly string[] };

export type FieldDef =
    | {
          kind: "text";
          key: string;
          label: string;
          hint?: string;
          placeholder?: string;
          mono?: boolean;
          /** Offer the `{{data.targetIp}}` token menu. */
          tokens?: boolean;
          showWhen?: FieldShowWhen;
      }
    | {
          kind: "textarea";
          key: string;
          label: string;
          hint?: string;
          placeholder?: string;
          mono?: boolean;
          tokens?: boolean;
          rows?: number;
          showWhen?: FieldShowWhen;
      }
    | { kind: "number"; key: string; label: string; hint?: string; min?: number; max?: number; step?: number; showWhen?: FieldShowWhen }
    | { kind: "slider"; key: string; label: string; hint?: string; min: number; max: number; step?: number; showWhen?: FieldShowWhen }
    | { kind: "toggle"; key: string; label: string; hint?: string; showWhen?: FieldShowWhen }
    | {
          kind: "select";
          key: string;
          label: string;
          hint?: string;
          options: readonly { value: string; label: string; hint?: string }[];
          showWhen?: FieldShowWhen;
      }
    | { kind: "date"; key: string; label: string; hint?: string; showWhen?: FieldShowWhen }
    | { kind: "color"; key: string; label: string; hint?: string; showWhen?: FieldShowWhen }
    | { kind: "image"; key: string; label: string; hint?: string; showWhen?: FieldShowWhen }
    | { kind: "event"; key: string; label: string; hint?: string }
    | { kind: "conditions"; key: string; label: string; hint?: string }
    | {
          kind: "list";
          key: string;
          label: string;
          hint?: string;
          addLabel: string;
          /** Text shown for a row when it has no meaningful title yet. */
          itemTitle: (item: Record<string, unknown>, index: number) => string;
          fields: FieldDef[];
          newItem: () => Record<string, unknown>;
      }
    | { kind: "deviceTree"; key: string; label: string; hint?: string }
    | { kind: "section"; label: string; hint?: string; fields: FieldDef[] }
    | { kind: "note"; text: string; tone?: "info" | "warn"; showWhen?: FieldShowWhen };

/* ── Categories ──────────────────────────────────────────────────────────── */

export const CATEGORIES = [
    { id: "entry", label: "Quest lifecycle", color: "var(--color-cat-entry)", hex: "#a78bfa", icon: "play" },
    { id: "objective", label: "Objectives", color: "var(--color-cat-objective)", hex: "#fbbf24", icon: "target" },
    { id: "trigger", label: "Triggers", color: "var(--color-cat-trigger)", hex: "#22d3ee", icon: "zap" },
    { id: "world", label: "World building", color: "var(--color-cat-world)", hex: "#34d399", icon: "globe" },
    { id: "comms", label: "Communication", color: "var(--color-cat-comms)", hex: "#f472b6", icon: "message" },
    { id: "reply", label: "Player replies", color: "var(--color-cat-reply)", hex: "#fb923c", icon: "keyboard" },
    { id: "effect", label: "Effects", color: "var(--color-cat-effect)", hex: "#60a5fa", icon: "sparkle" },
    { id: "flow", label: "Flow control", color: "var(--color-cat-flow)", hex: "#94a3b8", icon: "branch" },
    { id: "layout", label: "Layout", color: "var(--color-cat-layout)", hex: "#64748b", icon: "layers" },
] as const;

/**
 * Concrete hex values, for the one consumer that cannot use CSS variables: the
 * React Flow minimap draws node rects with an SVG `fill` *attribute*, and
 * `fill="var(--…)"` does not resolve — the map went blank. Mirrors the
 * `--color-cat-*` theme tokens.
 */
export const CATEGORY_HEX: Record<CategoryId, string> = {
    entry: "#a78bfa",
    objective: "#fbbf24",
    trigger: "#22d3ee",
    world: "#34d399",
    comms: "#f472b6",
    reply: "#fb923c",
    effect: "#60a5fa",
    flow: "#94a3b8",
    layout: "#64748b",
};

export type CategoryId = (typeof CATEGORIES)[number]["id"];

/* ── Socket presets ──────────────────────────────────────────────────────── */

const inFlow: HandleSpec = { id: "in", kind: "flow", label: "In" };
const outFlow: HandleSpec = { id: "out", kind: "flow", label: "Out" };
const whenOut: HandleSpec = { id: "when", kind: "condition", label: "When" };
const triggerIn: HandleSpec = { id: "trigger", kind: "condition", label: "Trigger" };
const unlockOut: HandleSpec = { id: "unlock", kind: "unlock", label: "Unlocks" };
const unlockIn: HandleSpec = { id: "unlocked-by", kind: "unlock", label: "Unlocked by" };
const doneOut: HandleSpec = { id: "done", kind: "flow", label: "On complete" };
const successOut: HandleSpec = { id: "success", kind: "flow", label: "Correct" };
const failureOut: HandleSpec = { id: "failure", kind: "flow", label: "Wrong" };
const trueOut: HandleSpec = { id: "true", kind: "flow", label: "Yes" };
const falseOut: HandleSpec = { id: "false", kind: "flow", label: "No" };

const io = { targets: [inFlow], sources: [outFlow] };

/* ── Reusable field groups ───────────────────────────────────────────────── */

const portFields: FieldDef[] = [
    { kind: "number", key: "external", hint: "The port number as seen from outside. This is what nmap reports and what the player connects to.", label: "External port", min: 0, max: 65535 },
    { kind: "number", key: "internal", hint: "The port the service actually listens on inside the machine. Leave equal to the external port unless you are deliberately redirecting.", label: "Internal port", min: 0, max: 65535 },
    { kind: "text", key: "service", hint: "What nmap prints next to the port, e.g. http, ssh, ftp, mysql. Free text — it is a label, not a real service.", label: "Service", placeholder: "ssh", mono: true },
    { kind: "text", key: "version", hint: "The banner nmap -sV prints. Use three numbers and no letters — metasploit refuses \"7.2\" and \"7.2p2\", leaving the player unable to run the exploit. Blank omits the version line.", label: "Version", placeholder: "OpenSSH 8.9.0", mono: true },
    { kind: "toggle", key: "active", label: "Open", hint: "Closed ports show as filtered to nmap." },
];

const userFields: FieldDef[] = [
    { kind: "text", key: "username", hint: "The login name for ssh, ftp or a web login page.", label: "Username", mono: true },
    { kind: "text", key: "password", label: "Password", mono: true, hint: "Leave blank to let the game pick one." },
    { kind: "text", key: "firstName", hint: "Shown on the account's profile page and in whois results.", label: "First name" },
    { kind: "text", key: "lastName", hint: "Shown on the account's profile page and in whois results.", label: "Last name" },
    { kind: "text", key: "emailAddress", hint: "The account's e-mail address. Useful as a lead the player can mail.", label: "E-mail", mono: true },
    { kind: "toggle", key: "acceptReverseTCP", hint: "Lets the player open a connection from this account back to their own machine. Turn on only if your quest needs it.", label: "Accepts reverse TCP" },
];

const vulnFields: FieldDef[] = [
    {
        kind: "select",
        key: "type", hint: "The kind of weakness this machine has. The in-game scanners report it when the player probes the machine.",
        label: "Type",
        options: VULNERABILITY_TYPES.map((t) => ({ value: t, label: t })),
    },
    { kind: "text", key: "version", hint: "The affected component's version, e.g. \"WordPress 5.8\". Cosmetic unless a trigger matches on it.", label: "Version", placeholder: "optional", mono: true },
];

const ruleFields: FieldDef[] = [
    { kind: "number", key: "port", hint: "The port this rule applies to.", label: "Port", min: 0, max: 65535 },
    { kind: "toggle", key: "allowed", label: "Allowed", hint: "Off means the port is blocked by the firewall." },
    { kind: "text", key: "source", hint: "Which source addresses the rule matches. `*` means anywhere; write a single IP to narrow it.", label: "Source", placeholder: "*", mono: true },
    { kind: "text", key: "destination", hint: "Which destination addresses the rule matches. `*` means this machine.", label: "Destination", placeholder: "*", mono: true },
    { kind: "toggle", key: "locked", label: "Locked", hint: "The player cannot remove a locked rule." },
];

const fileFields: FieldDef[] = [
    { kind: "text", key: "name", hint: "The file or folder name, exactly as it appears in ls.", label: "Name", mono: true },
    { kind: "text", key: "extension", hint: "The extension, e.g. txt, log, conf. Leave blank for folders.", label: "Extension", placeholder: "txt", mono: true },
    { kind: "toggle", key: "isFolder", hint: "Mark this entry as a directory rather than a file.", label: "Folder" },
    { kind: "toggle", key: "hidden", hint: "Prefix the name with a dot so a plain ls does not show it.", label: "Hidden" },
    { kind: "textarea", key: "data", hint: "The file's contents. This is where clues live — a config file, a log excerpt, a leaked password.", label: "Contents", mono: true, rows: 4 },
];

/**
 * Reusable field groups, exported so the network device editor can render the
 * same port/user/rule/vulnerability controls the node inspectors use.
 */
export const FIELD_GROUPS = {
    ports: {
        fields: portFields,
        addLabel: "Add port",
        itemTitle: (p: Record<string, unknown>) => `${p.external}/${p.service ?? "?"}`,
        newItem: () => ({ id: nanoid(8), external: 80, internal: 80, active: true, service: "http" }),
    },
    users: {
        fields: userFields,
        addLabel: "Add account",
        itemTitle: (u: Record<string, unknown>) => String(u.username ?? "account"),
        newItem: () => ({ id: nanoid(8), username: "admin" }),
    },
    rules: {
        fields: ruleFields,
        addLabel: "Add rule",
        itemTitle: (r: Record<string, unknown>) => `${r.allowed ? "Allow" : "Block"} ${r.port}`,
        newItem: () => ({ id: nanoid(8), allowed: false, port: 22, source: "*" }),
    },
    vulnerabilities: {
        fields: vulnFields,
        addLabel: "Add vulnerability",
        itemTitle: (v: Record<string, unknown>) => String(v.type),
        newItem: () => ({ id: nanoid(8), type: "SQL_INJECTION" }),
    },
    files: {
        fields: fileFields,
        addLabel: "Add file",
        itemTitle: (f: Record<string, unknown>, i: number) =>
            f.isFolder ? `📁 ${String(f.name ?? "")}` : String(f.name ?? `file ${i + 1}`),
        newItem: () => ({ id: nanoid(8), name: "readme", extension: "txt", isFolder: false, data: "" }),
    },
} as const;

/* ── The registry ────────────────────────────────────────────────────────── */

export interface NodeTypeDef {
    type: NodeType;
    category: CategoryId;
    label: string;
    /** One-line description shown in the palette. */
    blurb: string;
    icon: string;
    targets: HandleSpec[];
    sources: HandleSpec[];
    /**
     * Sockets that depend on the node's own data (the Sequence node grows one
     * output per step). When present it replaces `sources` for that node — the
     * static list stays as the empty-state fallback.
     */
    dynamicSources?: (data: Record<string, unknown>) => HandleSpec[];
    /** Which lifecycle hook the compiler emits this node's statements into. */
    hook: "onStart" | "onObjectivesStart" | "onComplete" | "onAbandon" | "declarative";
    fields: FieldDef[];
    create: () => NodeDoc["data"];
}

/** Parse a seed through a schema so every `.default()` is materialised. */
function seed<S extends z.ZodTypeAny>(schema: S, input: unknown = {}): z.infer<S> {
    return schema.parse(input);
}

const entryFields: FieldDef[] = [
    {
        kind: "note",
        tone: "info",
        text: "Each lifecycle node is an independent starting point — they never connect to each other. Wire the chain that should run when this moment happens. Event listeners belong under “On start & reload”; anything wired to “Quest start” is wiped when the player reloads.",
    },
];

export const NODE_TYPES_REGISTRY: Record<NodeType, NodeTypeDef> = {
    "entry.start": {
        type: "entry.start",
        category: "entry",
        label: "Quest start",
        blurb: "Runs once when the quest begins. Setup goes here.",
        icon: "flag",
        targets: [],
        sources: [outFlow],
        hook: "onStart",
        fields: entryFields,
        create: () => seed(EntryStartData),
    },
    "entry.load": {
        type: "entry.load",
        category: "entry",
        label: "On start & reload",
        blurb: "Runs on claim and every load. Listeners go here.",
        icon: "refresh",
        targets: [],
        sources: [outFlow],
        hook: "onObjectivesStart",
        fields: entryFields,
        create: () => seed(EntryStartData),
    },
    "entry.complete": {
        type: "entry.complete",
        category: "entry",
        label: "On quest complete",
        blurb: "Runs once every objective is done. Rewards go here.",
        icon: "check",
        targets: [],
        sources: [outFlow],
        hook: "onComplete",
        fields: entryFields,
        create: () => seed(EntryStartData),
    },
    "entry.abandon": {
        type: "entry.abandon",
        category: "entry",
        label: "On quest abandoned",
        blurb: "Runs if the player gives up. Cleanup goes here.",
        icon: "x",
        targets: [],
        sources: [outFlow],
        hook: "onAbandon",
        fields: entryFields,
        create: () => seed(EntryStartData),
    },

    objective: {
        type: "objective",
        category: "objective",
        label: "Objective",
        blurb: "A task the player must complete",
        icon: "target",
        targets: [inFlow, triggerIn, unlockIn],
        sources: [doneOut, unlockOut],
        hook: "declarative",
        fields: [
            { kind: "text", key: "name", label: "Identifier", mono: true, hint: "A short unique name for this objective so other nodes can refer to it. Lowercase with dashes reads well." },
            { kind: "textarea", key: "description", hint: "The line shown in the player's quest journal. A clear instruction tends to read well, but any wording that fits your quest works.", label: "Shown to the player", rows: 2 },
            { kind: "textarea", key: "hint", hint: "Revealed only if the player asks for help. As gentle or as cryptic as you want it to be.", label: "Hint", rows: 2 },
            { kind: "textarea", key: "info", hint: "Extra detail in the journal's expanded view. Good for lore or background.", label: "Extra info", rows: 2 },
            { kind: "text", key: "terminalCommand", hint: "Suggested command shown in the journal. It runs nothing — it is a copy-pasteable nudge.", label: "Suggested command", mono: true },
            { kind: "toggle", key: "hidden", hint: "Keep the objective out of the journal until another objective unlocks it. Use for twists.", label: "Hidden until unlocked" },
        ],
        create: () => seed(ObjectiveDataSchema),
    },

    "trigger.event": {
        type: "trigger.event",
        category: "trigger",
        label: "When event",
        blurb: "React to something the player does",
        icon: "zap",
        targets: [],
        sources: [whenOut],
        hook: "declarative",
        fields: [
            { kind: "event", key: "event", label: "Game event", hint: "All 92 HackHub events, listed with the details each one carries." },
            { kind: "conditions", key: "conditions", label: "Only when", hint: "Leave empty to fire on any occurrence." },
        ],
        create: () => seed(TriggerEventDataSchema),
    },

    "world.network": {
        type: "world.network",
        category: "world",
        label: "Create network",
        blurb: "Routers, devices, firewalls and ports",
        icon: "network",
        ...io,
        hook: "onStart",
        fields: [
            /* No IP field. The game hands out the address, and the author
               reads it back with {{data.targetIp}} wherever they need it —
               a mail, a whois answer, an objective hint.

               Typed addresses were removed in r73. The engine writes networks
               into the save file and they outlive the mod, so a fixed address
               meant a re-exported build was answered by whatever an older
               version had left there. Three rounds went into clearing the
               address first and each one broke something worse, ending with a
               game that would not finish loading. A per-playthrough address
               cannot collide, so the problem stops existing. */
            { kind: "deviceTree", key: "device", hint: "The router at the root of the network, plus everything behind it. Routers and splitters carry children; firewalls carry rules.", label: "Devices" },
            { kind: "toggle", key: "destroyOnComplete", hint: "Off by default: the network stays in the world after the quest, the way a real company would. It is also safer, because deleting a machine the player is still connected to can hang the game. Abandoning the quest removes it either way.", label: "Also remove this network when the quest is completed" },
        ],
        create: () =>
            seed(NetworkNodeDataSchema, {
                device: {
                    id: nanoid(8),
                    ip: "45.33.32.156",
                    type: "ROUTER",
                    vulnerabilities: [],
                    users: [],
                    ports: [{ id: nanoid(8), external: 80, internal: 80, active: true, service: "http" }],
                    rules: [],
                    rootFiles: [],
                    children: [],
                },
            }),
    },

    "world.wifi": {
        type: "world.wifi",
        category: "world",
        label: "Create Wi-Fi",
        blurb: "A crackable access point",
        icon: "wifi",
        ...io,
        hook: "onStart",
        fields: [
            { kind: "note", tone: "warn", text: "The mod SDK (0.21.0) has no wireless API yet, so this node exports as a regular router network: the player reaches it by IP address, not through the in-game Wi-Fi list. The SSID and passphrase are stored in the mod and start working if the game opens that up." },
            { kind: "text", key: "ssid", hint: "The network name shown in the in-game Wi-Fi list.", label: "Network name (SSID)", mono: true },
            { kind: "text", key: "password", label: "WPA passphrase", mono: true, hint: "The passphrase the player must discover. Make sure some node in your quest reveals it." },
            { kind: "slider", key: "signal", label: "Signal strength", min: 0, max: 3, step: 1, hint: "The game's Wi-Fi scale: 0 = weakest, 3 = strongest (it also drives how long joining takes). The current mod SDK does not read it yet — it is kept for when wireless support lands." },
            { kind: "text", key: "model", label: "Router model", mono: true, hint: "Enables the in-game `fern` recovery route. Leave blank to disable it." },
            {
                kind: "list",
                key: "users", hint: "Accounts on the access point's own system. Their files land in /home/<username>/.",
                label: "Router accounts",
                addLabel: "Add account",
                itemTitle: (u) => String(u.username ?? "account"),
                fields: userFields,
                newItem: () => ({ id: nanoid(8), username: "admin" }),
            },
            {
                kind: "list",
                key: "ports", hint: "Open ports on the access point itself.",
                label: "Router ports",
                addLabel: "Add port",
                itemTitle: (p) => `${p.external}/${p.service ?? "?"}`,
                fields: portFields,
                newItem: () => ({ id: nanoid(8), external: 80, internal: 80, active: true, service: "http" }),
            },
            { kind: "deviceTree", key: "children", hint: "Machines reachable through this access point. Add a router here to build a second network hop.", label: "Devices behind the access point" },
            { kind: "toggle", key: "destroyOnComplete", hint: "Off by default: the access point stays in the world after the quest. Abandoning the quest removes it either way.", label: "Also remove this access point when the quest is completed" },
        ],
        create: () => seed(WifiNodeDataSchema, { ssid: "NEIGHBOUR_5Ghz", password: "letmein123" }),
    },

    "world.firewall": {
        type: "world.firewall",
        category: "world",
        label: "Firewall rule",
        blurb: "Allow or block a port",
        icon: "shield",
        ...io,
        hook: "onStart",
        fields: [
            { kind: "text", key: "ip", hint: "The machine these rules protect. Use {{data.targetIp}} to refer to a randomly-allocated router.", label: "Protected IP", mono: true, tokens: true },
            {
                kind: "list",
                key: "rule", hint: "Rules are evaluated in order; the first match wins.",
                label: "Rule",
                addLabel: "Add rule",
                itemTitle: (r) => `${r.allowed ? "Allow" : "Block"} ${r.port}`,
                fields: ruleFields,
                newItem: () => ({ id: nanoid(8), allowed: false, port: 22, source: "*" }),
            },
            { kind: "toggle", key: "removeOnComplete", hint: "Drop the firewall when the quest ends so the machine is reachable afterwards.", label: "Remove when the quest ends" },
        ],
        create: () =>
            seed(FirewallNodeDataSchema, {
                ip: "",
                rule: { id: nanoid(8), allowed: false, port: 22, source: "*" },
            }),
    },

    "world.port": {
        type: "world.port",
        category: "world",
        label: "Change port",
        blurb: "Open, close, add or remove a port",
        icon: "plug",
        ...io,
        hook: "onStart",
        fields: [
            { kind: "text", key: "ip", label: "Device IP", mono: true, tokens: true, hint: "A router IP or any device behind it." },
            {
                kind: "select",
                key: "action",
                hint: "Open makes an existing port reachable. Close blocks it. Add creates a new service; Remove deletes it entirely.",
                label: "Action",
                options: [
                    { value: "open", label: "Open" },
                    { value: "close", label: "Close", hint: "Closing internal port 22 also drops live SSH sessions." },
                    { value: "add", label: "Add" },
                    { value: "remove", label: "Remove" },
                ],
            },
            { kind: "number", key: "port.external", hint: "The port number as seen from outside — what nmap reports.", label: "External port", min: 0, max: 65535 },
            { kind: "number", key: "port.internal", hint: "The port the service listens on inside the machine.", label: "Internal port", min: 0, max: 65535 },
            { kind: "text", key: "port.service", hint: "What nmap prints next to the port, e.g. http, ssh, mysql.", label: "Service", mono: true },
            { kind: "toggle", key: "port.active", hint: "Turn off to make the port appear closed.", label: "Open" },
            { kind: "toggle", key: "restoreOnComplete", hint: "Put the port back the way it was when the quest ends.", label: "Restore when the quest ends" },
        ],
        create: () =>
            seed(PortNodeDataSchema, {
                ip: "",
                port: { id: nanoid(8), external: 22, internal: 22, active: true, service: "ssh" },
            }),
    },

    "world.domain": {
        type: "world.domain",
        category: "world",
        label: "Register domain",
        blurb: "Point a hostname at an IP",
        icon: "globe",
        ...io,
        hook: "onStart",
        fields: [
            { kind: "text", key: "domain", hint: "The hostname the player types, e.g. vault.corp-internal.net.", label: "Domain", mono: true },
            { kind: "text", key: "ip", hint: "The address it resolves to. nslookup and dig will report this.", label: "Resolves to", mono: true, tokens: true },
            {
                kind: "list",
                key: "vulnerabilities",
                label: "Vulnerabilities",
                hint: "Weaknesses on the host behind this name. In-game scanners report them when the player probes it.",
                addLabel: "Add vulnerability",
                itemTitle: (v) => String(v.type),
                fields: vulnFields,
                newItem: () => ({ id: nanoid(8), type: "SQL_INJECTION" }),
            },
            { kind: "toggle", key: "removeOnComplete", hint: "Drop the DNS entry when the quest ends.", label: "Remove when the quest ends" },
        ],
        create: () => seed(DomainNodeDataSchema),
    },

    "world.database": {
        type: "world.database",
        category: "world",
        label: "Create database",
        blurb: "Content for sqlmap and DatabaseManager",
        icon: "database",
        ...io,
        hook: "onStart",
        fields: [
            { kind: "text", key: "host", hint: "The address the player points a database client at.", label: "Host IP", mono: true, tokens: true },
            { kind: "text", key: "user", hint: "The login sqlmap or a client uses.", label: "Username", mono: true },
            { kind: "text", key: "password", hint: "The password. Give the player a way to find it — a config file, a leaked dump, a cracked hash.", label: "Password", mono: true },
            { kind: "note", tone: "info", text: "Table editing arrives with the full data inspector in Step 3." },
            { kind: "toggle", key: "removeOnComplete", hint: "Drop the database when the quest ends.", label: "Remove when the quest ends" },
        ],
        create: () => seed(DatabaseNodeDataSchema, { host: "", user: "admin", password: "secret123" }),
    },

    "world.files": {
        type: "world.files",
        category: "world",
        label: "Seed files",
        blurb: "Drop files on a PC or a remote device",
        icon: "folder",
        ...io,
        hook: "onStart",
        fields: [
            {
                kind: "select",
                key: "target", hint: "Whose filesystem to write to. The player's own machine is written when the flow reaches this node; a remote device is mounted with the machine, under the account the player lands in, so the files are already there when they break in.",
                label: "Where",
                options: [
                    { value: "player", label: "The player's PC" },
                    { value: "device", label: "A remote device" },
                ],
            },
            { kind: "text", key: "ip", label: "Device IP", mono: true, tokens: true, hint: "Only used for a remote device. Use the same {{data.targetIp}} token you gave the network, and the files are mounted on that machine before the player ever connects." },
            { kind: "text", key: "parentPath", hint: "Where the files are mounted. Folders named etc, home, logs or lib are merged into the existing ones rather than replacing them.", label: "Parent folder", mono: true, placeholder: "~/" },
            {
                kind: "list",
                key: "files", hint: "The files and folders to create. A folder named etc, home, logs or lib merges with the machine's existing one.",
                label: "Files",
                addLabel: "Add file",
                itemTitle: (f, i) => (f.isFolder ? `📁 ${f.name}` : String(f.name ?? `file ${i + 1}`)),
                fields: fileFields,
                newItem: () => ({ id: nanoid(8), name: "readme", extension: "txt", isFolder: false, data: "" }),
            },
        ],
        create: () => seed(FilesNodeDataSchema),
    },

    "world.toolResponse": {
        type: "world.toolResponse",
        category: "world",
        label: "Tool response",
        blurb: "Script what a recon tool reports",
        icon: "terminal",
        ...io,
        hook: "onStart",
        fields: [
            {
                kind: "select",
                key: "command",
                label: "Tool",
                hint: "Pick the in-game command this overrides, like nmap or whois. When the player runs it on your input, they see your text instead of the usual result.",
                options: [
                    { value: "nmap", label: "nmap" },
                    { value: "hydra", label: "hydra" },
                    { value: "whois", label: "whois" },
                    { value: "nslookup", label: "nslookup" },
                    { value: "mxlookup", label: "mxlookup" },
                    { value: "ping", label: "ping" },
                    { value: "lynx", label: "lynx" },
                    { value: "geoip", label: "geoip" },
                    { value: "ssh", label: "ssh" },
                    { value: "ftp", label: "ftp" },
                    { value: "weechat", label: "weechat" },
                ],
            },
            { kind: "text", key: "input", label: "Keyed by", mono: true, tokens: true, hint: "What the player types after the command — the IP, domain or name it answers for. The tool only responds to this exact input. hydra/ssh/ftp use the user + target fields below instead." },
            { kind: "text", key: "inputUser", hint: "Only match when the player ran the command against this user.", label: "User", mono: true },
            { kind: "text", key: "inputTarget", hint: "Only match when the player ran the command against this host.", label: "Target", mono: true, tokens: true },
            {
                kind: "textarea",
                key: "dataText",
                label: "Response",
                mono: true,
                rows: 8,
                hint: "One “Label: value” per line. The editor turns them into the shape that tool returns in-game.",
            },
            {
                kind: "note",
                tone: "info",
                text: "Labels the tools understand: whois → domain, ip, registrant, email · lynx → web, email, phone, social, address (anything else is shown as extra detail) · geoip → country, city, latitude, longitude · hydra → username, password · nslookup / mxlookup → ip. nmap is different: write one port per line, like “22 open ssh OpenSSH 8.9”. Paste JSON instead if you want to set the result exactly.",
            },
            { kind: "toggle", key: "removeOnComplete", hint: "Stop intercepting the command when the quest ends.", label: "Remove when the quest ends" },
        ],
        create: () => seed(ToolResponseNodeDataSchema),
    },

    "comms.dialogue": {
        type: "comms.dialogue",
        category: "comms",
        label: "Dialogue",
        blurb: "A conversation with the player — phone call, Kisscord, e-mail or WeeChat",
        icon: "message",
        targets: [inFlow],
        sources: [outFlow, failureOut],
        hook: "onStart",
        fields: [],
        create: () => seed(DialogueNodeDataSchema),
    },

    "reply.input": {
        type: "reply.input",
        category: "reply",
        label: "Manual input",
        blurb: "The player types a passphrase",
        icon: "key",
        ...{ targets: [inFlow], sources: [successOut, failureOut] },
        hook: "onObjectivesStart",
        fields: [
            { kind: "note", tone: "info", text: "Compiles to a custom terminal command using tools.prompt(). Wire the green “Correct” socket for success and the red “Wrong” socket for failure." },
            { kind: "text", key: "commandName", hint: "The terminal command the player runs, e.g. decrypt. It appears in help output.", label: "Command name", mono: true, placeholder: "decrypt" },
            { kind: "text", key: "commandDescription", hint: "The one-line description shown next to the command in help.", label: "Help text" },
            { kind: "text", key: "prompt", hint: "The text printed before the cursor, e.g. \"Passphrase >\".", label: "Prompt", placeholder: "Passphrase >" },
            { kind: "toggle", key: "mask", label: "Mask the input", hint: "Shown as *, like the built-in ssh and sudo prompts." },
            {
                kind: "select",
                key: "matchMode", hint: "Exactly equals checks the whole answer. Contains accepts it anywhere in what the player types. Matches pattern is for advanced authors who want to accept a whole family of answers at once.",
                label: "Match",
                options: [
                    { value: "exact", label: "Exactly equals" },
                    { value: "contains", label: "Contains" },
                    { value: "regex", label: "Matches pattern" },
                ],
            },
            { kind: "text", key: "expected", hint: "The answer that counts as correct — or the pattern, if you chose “Matches pattern” above.", label: "Expected answer", mono: true },
            { kind: "toggle", key: "caseSensitive", hint: "Turn off to accept any capitalisation. Recommended unless case is part of the puzzle.", label: "Case sensitive" },
            { kind: "text", key: "successMessage", hint: "Printed on a match, then the green “Correct” socket fires.", label: "Success message" },
            { kind: "text", key: "failureMessage", hint: "Printed on a miss, then the red “Wrong” socket fires. The player can run the command again.", label: "Failure message" },
        ],
        create: () =>
            seed(ManualInputNodeDataSchema, {
                commandName: "decrypt",
                commandDescription: "Decrypt the intercepted payload",
                prompt: "Passphrase >",
                successMessage: "Decrypted.",
                failureMessage: "Wrong passphrase.",
            }),
    },

    "fx.pay": {
        type: "fx.pay",
        category: "effect",
        label: "Pay the player",
        blurb: "Deposit money",
        icon: "coin",
        ...io,
        hook: "onStart",
        fields: [
            {
                kind: "select",
                key: "amountMode",
                label: "Amount type",
                hint: "A fixed sum, or a slice of whatever the player currently has.",
                options: [
                    { value: "fixed", label: "Fixed amount" },
                    { value: "percent", label: "Percentage of balance" },
                ],
            },
            { kind: "number", key: "amount", hint: "Credits deposited into the player's bank account.", label: "Amount", min: 0 },
            { kind: "number", key: "percent", hint: "Percentage of the player's current balance, taken when this node runs.", label: "Percent", min: 0, max: 100 },
            { kind: "text", key: "description", hint: "The label on the bank statement line.", label: "Description" },
            { kind: "text", key: "fromIBAN", hint: "The sending account, shown in the transfer details.", label: "From IBAN", mono: true },
            { kind: "text", key: "fromName", hint: "The sender's name on the statement.", label: "From name" },
        ],
        create: () => seed(PayNodeDataSchema, { amount: 1000, description: "Job payment" }),
    },

    "fx.withdraw": {
        type: "fx.withdraw",
        category: "effect",
        label: "Charge the player",
        blurb: "Withdraw money",
        icon: "coin",
        ...io,
        hook: "onStart",
        fields: [
            {
                kind: "select",
                key: "amountMode",
                label: "Amount type",
                hint: "A fixed sum, or a slice of whatever the player currently has in the bank.",
                options: [
                    { value: "fixed", label: "Fixed amount" },
                    { value: "percent", label: "Percentage of balance" },
                ],
            },
            { kind: "number", key: "amount", hint: "Credits taken from the player's account.", label: "Amount", min: 0 },
            { kind: "number", key: "percent", hint: "Percentage of the player's current balance, taken when this node runs.", label: "Percent", min: 0, max: 100 },
            { kind: "text", key: "description", hint: "The label on the bank statement line.", label: "Description" },
        ],
        create: () => seed(PayNodeDataSchema, { amount: 100, description: "Purchase" }),
    },

    "fx.notify": {
        type: "fx.notify",
        category: "effect",
        label: "Notify",
        blurb: "A popup or toast",
        icon: "bell",
        ...io,
        hook: "onStart",
        fields: [
            { kind: "textarea", key: "message", hint: "The text on the popup. Type {{data.name}} to insert a value you saved earlier.", label: "Message", rows: 2, tokens: true },
            {
                kind: "select",
                key: "variant", hint: "A notification is a persistent popup; a toast slides in and fades on its own.",
                label: "Style",
                options: [
                    { value: "notify", label: "Notification popup" },
                    { value: "toast", label: "Toast" },
                ],
            },
            {
                kind: "select",
                key: "tone", hint: "Sets the colour and icon: info, success, warning or error.",
                label: "Tone",
                options: [
                    { value: "info", label: "Info" },
                    { value: "success", label: "Success" },
                    { value: "warning", label: "Warning" },
                    { value: "error", label: "Error" },
                ],
            },
        ],
        create: () => seed(NotifyNodeDataSchema),
    },

    "fx.setData": {
        type: "fx.setData",
        category: "effect",
        label: "Set quest data",
        blurb: "Store a value for later",
        icon: "save",
        ...io,
        hook: "onStart",
        fields: [
            { kind: "text", key: "key", hint: "A name you choose, like doorCode. Use the same name later to read this value back.", label: "Key", mono: true },
            { kind: "text", key: "value", hint: "Any text is fine — a word, a number, an address. It is just stored, so nothing here can error. You can also insert a live value by typing {{data.name}} for something you saved earlier.", label: "Value", mono: true, tokens: true },
        ],
        create: () => seed(SetDataNodeDataSchema),
    },

    "fx.claimQuest": {
        type: "fx.claimQuest",
        category: "effect",
        label: "Claim another quest",
        blurb: "Chain into the next quest",
        icon: "link",
        ...io,
        hook: "onStart",
        fields: [{ kind: "text", key: "questName", hint: "The identifier of the quest to start next. It must exist in this mod or another installed one.", label: "Quest", mono: true }],
        create: () => seed(ClaimQuestNodeDataSchema, { questName: "" }),
    },

    "fx.shell": {
        type: "fx.shell",
        category: "effect",
        label: "Run terminal command",
        blurb: "Execute in the terminal",
        icon: "terminal",
        ...io,
        hook: "onStart",
        fields: [{ kind: "text", key: "command", hint: "The command executed in the player's terminal, as if they had typed it.", label: "Command", mono: true, tokens: true }],
        create: () => seed(ShellExecNodeDataSchema),
    },

    "fx.handbook": {
        type: "fx.handbook",
        category: "effect",
        label: "Open handbook",
        blurb: "Jump to an in-game article",
        icon: "book",
        ...io,
        hook: "onStart",
        fields: [
            { kind: "text", key: "articleId", hint: "The in-game article to open.", label: "Article", mono: true },
            { kind: "text", key: "category", hint: "The handbook section the article sits under.", label: "Category" },
        ],
        create: () => seed(HandbookNodeDataSchema),
    },

    "flow.branch": {
        type: "flow.branch",
        category: "flow",
        label: "Branch",
        blurb: "Split on a condition",
        icon: "branch",
        targets: [inFlow, triggerIn],
        sources: [trueOut, falseOut],
        hook: "onObjectivesStart",
        fields: [
            {
                kind: "select",
                key: "source", hint: "Test against details from the event that fired, or against quest data you stored earlier with a “Set quest data” node.",
                label: "Test against",
                options: [
                    { value: "event", label: "Details from the event" },
                    { value: "data", label: "Quest data" },
                ],
            },
            { kind: "conditions", key: "conditions", hint: "All clauses must hold for the “Yes” path. Otherwise the “No” path runs.", label: "Take the “Yes” path when" },
        ],
        create: () => seed(BranchNodeDataSchema),
    },

    "flow.delay": {
        type: "flow.delay",
        category: "flow",
        label: "Wait",
        blurb: "Pause before continuing",
        icon: "clock",
        ...io,
        hook: "onStart",
        fields: [{ kind: "number", key: "seconds", hint: "How long the story pauses here. Fractions are fine — 0.5 waits half a second.", label: "Seconds", min: 0, step: 0.5 }],
        create: () => seed(DelayNodeDataSchema),
    },

    "flow.reroute": {
        type: "flow.reroute",
        category: "flow",
        label: "Reroute",
        blurb: "Split or tidy a wire",
        icon: "shuffle",
        ...io,
        hook: "declarative",
        fields: [
            { kind: "note", tone: "info", text: "A tidy point for your wires: run a connection through here to fan it out to several nodes or to route it around clutter. It has no effect on the story itself. Tip: double-click any wire on the canvas to drop one in automatically." },
        ],
        create: () => seed(RerouteNodeDataSchema),
    },

    "layout.group": {
        type: "layout.group",
        category: "layout",
        label: "Group frame",
        blurb: "A named box that moves its nodes",
        icon: "layers",
        targets: [],
        sources: [],
        hook: "declarative",
        fields: [
            { kind: "note", tone: "info", text: "Draw a box around part of your quest to keep it tidy. Drag the frame and everything inside moves with it. It has no effect on how the mod runs." },
            { kind: "text", key: "label", label: "Name", hint: "Shown in the frame's title bar — name the cluster after what it does, e.g. “Act 1: recon”." },
            { kind: "color", key: "color", label: "Title bar colour", hint: "Colour-code your frames however you like — e.g. one colour per act, or per character. It only changes how the frame looks in the editor." },
            { kind: "textarea", key: "comment", label: "Comment", rows: 3, hint: "A note to future-you about what this cluster does." },
        ],
        create: () => seed(LayoutGroupNodeDataSchema),
    },

    "flow.random": {
        type: "flow.random",
        category: "flow",
        label: "Random pick",
        blurb: "Choose one option at random",
        icon: "shuffle",
        ...io,
        hook: "onStart",
        fields: [
            {
                kind: "list",
                key: "options", hint: "One of these is picked at random and stored. Add as many as you like.",
                label: "Options",
                addLabel: "Add option",
                itemTitle: (o, i) => String(o.label ?? `option ${i + 1}`),
                fields: [{ kind: "text", key: "label", hint: "The value stored if this option is picked.", label: "Value" }],
                newItem: () => ({ id: nanoid(8), label: "" }),
            },
            { kind: "text", key: "storeAs", hint: "A name you choose. The picked value is saved under it so you can read it back later with {{data.name}}.", label: "Store the result as", mono: true },
        ],
        create: () => seed(RandomPickNodeDataSchema),
    },

    "flow.sequence": {
        type: "flow.sequence",
        category: "flow",
        label: "Sequence",
        blurb: "Fire several outputs one after another",
        icon: "list",
        targets: [inFlow],
        sources: [],
        dynamicSources: (data) => sequenceSockets(data),
        hook: "onStart",
        fields: [
            {
                kind: "note",
                tone: "info",
                text: "One input, as many outputs as you like. When the story reaches this node the outputs fire from top to bottom, waiting the pause you set before each one. Add or remove outputs below — each row is a socket on the node.",
            },
            {
                kind: "list",
                key: "steps",
                label: "Outputs, in order",
                hint: "They fire top to bottom. Drag the rows' ✕ to remove an output — any wire attached to it is removed too.",
                addLabel: "Add output",
                itemTitle: (s, i) => String(s.label || `Step ${i + 1}`),
                fields: [
                    {
                        kind: "text",
                        key: "label",
                        label: "Name",
                        hint: "Free text — whatever helps you recognise this output on the canvas, e.g. “lights out” or “call Mara”.",
                    },
                    {
                        kind: "number",
                        key: "delayMs",
                        label: "Wait before firing (milliseconds)",
                        hint: "How long to pause before this output fires, counted from the previous one. 0 fires it immediately; 1000 is one second.",
                        min: 0,
                        step: 100,
                    },
                ],
                newItem: () => ({ id: nanoid(8), label: "Step", delayMs: 500 }),
            },
        ],
        create: () =>
            seed(SequenceNodeDataSchema, {
                steps: [
                    { id: nanoid(8), label: "First", delayMs: 0 },
                    { id: nanoid(8), label: "Then", delayMs: 1000 },
                ],
            }),
    },

    "flow.debug": {
        type: "flow.debug",
        category: "flow",
        label: "Debug probe",
        blurb: "Print what is happening here",
        icon: "bug",
        ...io,
        hook: "onStart",
        fields: [
            { kind: "text", key: "label", hint: "Names itself after whatever you wire it to — socket, node and detail. Type your own to override it.", label: "Label", placeholder: "named when you connect it" },
            { kind: "toggle", key: "includeData", hint: "Print everything the quest has saved with a “Remember a value” node.", label: "Include saved values" },
            { kind: "toggle", key: "includePayload", hint: "Print the event that got here — the field names it really carries, which are not always the ones the docs promise.", label: "Include the event" },
            { kind: "toggle", key: "toast", hint: "Also show it on screen, so you can test without reading the log file.", label: "Show on screen too" },
        ],
        create: () => seed(DebugNodeDataSchema, { label: "" }),
    },
    "flow.note": {
        type: "flow.note",
        category: "flow",
        label: "Sticky note",
        blurb: "A comment on the canvas",
        icon: "note",
        targets: [],
        sources: [],
        hook: "declarative",
        fields: [
            { kind: "textarea", key: "text", hint: "Shown on the canvas only. Notes are never exported into the mod.", label: "Note", rows: 6 },
            { kind: "number", key: "width", hint: "How wide the note is on the canvas, in pixels.", label: "Width", min: 160, max: 640, step: 20 },
        ],
        create: () => seed(NoteNodeDataSchema, { text: "" }),
    },
};

/** Palette order: categories first, then registry order within each. */
export function paletteGroups(): { category: (typeof CATEGORIES)[number]; types: NodeTypeDef[] }[] {
    return CATEGORIES.map((category) => ({
        category,
        types: (Object.values(NODE_TYPES_REGISTRY) as NodeTypeDef[]).filter(
            (t) => t.category === category.id,
        ),
    }));
}

export function nodeTypeDef(type: NodeType): NodeTypeDef {
    return NODE_TYPES_REGISTRY[type];
}

/**
 * The output sockets a Sequence node shows: one per step, in author order.
 * Lives here (not in the node component) because the canvas, the store, the
 * analysis and the compiler all have to agree on the socket ids.
 */
export function sequenceSockets(data: unknown): HandleSpec[] {
    const steps = (data as { steps?: { id: string; label?: string }[] })?.steps ?? [];
    return steps.map((step, i) => ({
        id: `step-${step.id}`,
        kind: "flow" as const,
        label: step.label?.trim() || `Step ${i + 1}`,
    }));
}

/**
 * Every output socket of a concrete node — dynamic when the type derives its
 * sockets from data, otherwise the registry's static list.
 */
export function sourcesOf(node: { type: NodeType; data: unknown }): HandleSpec[] {
    const def = NODE_TYPES_REGISTRY[node.type];
    return def.dynamicSources
        ? def.dynamicSources((node.data ?? {}) as Record<string, unknown>)
        : def.sources;
}

/** Input sockets of a concrete node. Symmetrical with `sourcesOf`. */
export function targetsOf(node: { type: NodeType; data: unknown }): HandleSpec[] {
    return NODE_TYPES_REGISTRY[node.type].targets;
}

export function categoryOf(type: NodeType) {
    const id = NODE_TYPES_REGISTRY[type].category;
    return CATEGORIES.find((c) => c.id === id)!;
}

/** Look up a handle's kind, used by the connection validator. */
export function handleKind(type: NodeType, handleId: string, side: "source" | "target"): EdgeKind | undefined {
    const def = NODE_TYPES_REGISTRY[type];
    const list = side === "source" ? def.sources : def.targets;
    return list.find((h) => h.id === handleId)?.kind;
}
