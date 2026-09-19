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
    CompleteQuestNodeDataSchema,
    DatabaseNodeDataSchema,
    DelayNodeDataSchema,
    DomainNodeDataSchema,
    TWOTTER_AGO_UNITS,
    TweetNodeDataSchema,
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
    PromptNodeDataSchema,
    RandomPickNodeDataSchema,
    RetireQuestNodeDataSchema,
    TimerNodeDataSchema,
    SetDataNodeDataSchema,
    SequenceNodeDataSchema,
    ShellExecNodeDataSchema,
    ToolResponseNodeDataSchema,
    TriggerEventDataSchema,
    UnclaimQuestNodeDataSchema,
    WifiNodeDataSchema,
    NoteNodeDataSchema,
    StoryBeatNodeDataSchema,
    RerouteNodeDataSchema,
    LayoutGroupNodeDataSchema,
    PackDataNodeDataSchema,
    PackNodeDataSchema,
    type NodeDoc,
    type NodeType,
} from "./nodes";
import { TARGET_IP_TOKEN, VULNERABILITY_BLURBS, VULNERABILITY_TYPES } from "./common";
import { MONTH_OPTIONS, timerSentence, unitsReadback, WAIT_UNITS } from "./timer";

/* ── Inspector field descriptors ─────────────────────────────────────────── */

/**
 * Show a field only when a sibling field holds one of the given values. Lets an
 * author-facing form reveal just the inputs that matter for the current choice
 * (e.g. a date picker only when the time mode is "a specific date").
 */
export type FieldShowWhen = { key: string; equals: string | readonly string[] };

/**
 * Opt a field into the auto-generate (dice) button (r161). `kind` picks the
 * generator; `ipFlavour` chooses public vs private for IP fields; `reuse` names
 * sibling field keys (relative to the field's base path) the generator may read
 * to stay coherent — e.g. an e-mail built from the first/last name beside it.
 * The dice only ever writes its own field; siblings are read, never touched.
 */
export type FieldGenerate = {
    kind: import("@/lib/generate").GeneratorKind;
    ipFlavour?: import("@/lib/generate").IpFlavour;
    reuse?: readonly string[];
    /** Short noun for the button's accessible name, e.g. "e-mail". */
    label?: string;
};

export type NumberFieldDef = {
    kind: "number";
    key: string;
    label: string;
    hint?: string;
    min?: number;
    max?: number;
    step?: number;
    /** A small unit word printed after the box, e.g. "days" (r176). */
    suffix?: string;
    showWhen?: FieldShowWhen;
};

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
          /** Offer the auto-generate (dice) button. */
          generate?: FieldGenerate;
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
          generate?: FieldGenerate;
          rows?: number;
          showWhen?: FieldShowWhen;
      }
    | NumberFieldDef
    | { kind: "slider"; key: string; label: string; hint?: string; min: number; max: number; step?: number; showWhen?: FieldShowWhen }
    | { kind: "toggle"; key: string; label: string; hint?: string; showWhen?: FieldShowWhen }
    | {
          kind: "select";
          key: string;
          label: string;
          hint?: string;
          options: readonly { value: string; label: string; hint?: string }[];
          /** Render as a segmented picker instead of a dropdown (2–4 short choices). */
          display?: "segmented";
          /** Store `Number(choice)` — for selects over numeric fields, like months. */
          numeric?: boolean;
          showWhen?: FieldShowWhen;
      }
    | {
          kind: "selectOrCustom";
          key: string;
          label: string;
          hint?: string;
          placeholder?: string;
          mono?: boolean;
          /** Offer the token menu in the custom box. */
          tokens?: boolean;
          /** Offer the auto-generate (dice) button in the custom box. */
          generate?: FieldGenerate;
          /**
           * Fixed choices. Anything else falls through to the custom box.
           * `meaning` explains a choice's stored value in words, for when the
           * author meets it as free text (a custom box holding `*`).
           */
          options: readonly { value: string; label: string; meaning?: string }[];
          /**
           * An extra "same as …" choice that copies another field's current
           * value — a snapshot, not a live link. `fromKey` starting with
           * "/" reads from the node root (e.g. "/ip"); otherwise the row is
           * tried first, then the root. While the other field is empty the
           * choice is disabled, showing `emptyHint`.
           */
          sameAs?: { label: string; fromKey: string; emptyHint?: string };
          showWhen?: FieldShowWhen;
      }
    | { kind: "tables"; key: string; label: string; hint?: string }
    | {
          /**
           * Several fields on one line, for values that only make sense read
           * together: the Wait duration, "in 2 weeks", the date. Children keep
           * their own labels, hints and warnings — a row is layout, not a
           * control. Container kinds are transparent to the manual extractor,
           * so the children are documented exactly as if they were stacked.
           */
          kind: "row";
          label?: string;
          hint?: string;
          fields: FieldDef[];
          /**
           * Lay the children out in a fixed grid of this many columns, wrapping
           * onto as many lines as it takes (r177: six unit boxes, three across).
           * Without it they sit on one line.
           */
          columns?: 2 | 3 | 4;
          /**
           * A readback line under the row, in the words a human would say it
           * (r176: 25 hours reads "1 day, 1 hour"). Null hides the line.
           */
          readback?: (data: Record<string, unknown>) => string | null;
          showWhen?: FieldShowWhen;
      }
    | {
          /**
           * The hour and minute as a digital clock (r176). It reads and writes
           * two existing number fields; the caption is the clock's own, so the
           * fields keep their labels for the manual and for screen readers.
           */
          kind: "clock";
          label?: string;
          hint?: string;
          hour: NumberFieldDef;
          minute: NumberFieldDef;
          showWhen?: FieldShowWhen;
      }
    | { kind: "handbookArticle"; key: string; label: string; hint?: string }
    | { kind: "twotterAccount"; key: string; label: string; hint?: string }
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
          /** Open every existing row by default (e.g. choices an author should read at once). */
          defaultOpen?: boolean;
          fields: FieldDef[];
          /** Receives the new row's index, so numbered rows (sequence outputs) can name themselves. */
          newItem: (index: number) => Record<string, unknown>;
      }
    | { kind: "deviceTree"; key: string; label: string; hint?: string }
    | {
          kind: "section";
          label: string;
          hint?: string;
          fields: FieldDef[];
          /** Address children under this path (e.g. a single nested record). */
          path?: string;
      }
    | { kind: "note"; text: string; tone?: "info" | "warn"; showWhen?: FieldShowWhen };

/* ── Categories ──────────────────────────────────────────────────────────── */

export const CATEGORIES = [
    { id: "entry", label: "Quest lifecycle", color: "var(--color-cat-entry)", hex: "#a78bfa", icon: "play" },
    { id: "objective", label: "Objectives", color: "var(--color-cat-objective)", hex: "#fbbf24", icon: "target" },
    { id: "trigger", label: "Triggers", color: "var(--color-cat-trigger)", hex: "#22d3ee", icon: "zap" },
    { id: "world", label: "World building", color: "var(--color-cat-world)", hex: "#34d399", icon: "globe" },
    { id: "comms", label: "Communication", color: "var(--color-cat-comms)", hex: "#f472b6", icon: "message" },
    { id: "reply", label: "Custom terminal", color: "var(--color-cat-reply)", hex: "#fb923c", icon: "keyboard" },
    { id: "effect", label: "Effects", color: "var(--color-cat-effect)", hex: "#60a5fa", icon: "sparkle" },
    { id: "community", label: "Community addons", color: "var(--color-cat-community)", hex: "#2dd4bf", icon: "package" },
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
    community: "#2dd4bf",
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
const submittedOut: HandleSpec = { id: "success", kind: "flow", label: "Submitted" };
const cancelledOut: HandleSpec = { id: "cancel", kind: "flow", label: "Cancelled" };
const trueOut: HandleSpec = { id: "true", kind: "flow", label: "Yes" };
const falseOut: HandleSpec = { id: "false", kind: "flow", label: "No" };

const io = { targets: [inFlow], sources: [outFlow] };

/* ── Reusable field groups ───────────────────────────────────────────────── */

const portFields: FieldDef[] = [
    { kind: "number", key: "external", hint: "The port number as seen from outside. This is what nmap reports and what the player connects to.", label: "External port", min: 0, max: 65535 },
    { kind: "number", key: "internal", hint: "The port the service actually listens on inside the machine. Leave equal to the external port unless you are deliberately redirecting.", label: "Internal port", min: 0, max: 65535 },
    { kind: "text", key: "service", hint: "What nmap prints next to the port, e.g. http, ssh, ftp, mysql. Free text — it is a label, not a real service.", label: "Service", placeholder: "ssh", mono: true, generate: { kind: "serviceName", label: "service" } },
    { kind: "text", key: "version", hint: "The banner nmap -sV prints. Use three numbers and no letters — metasploit refuses \"7.2\" and \"7.2p2\", leaving the player unable to run the exploit. Blank omits the version line.", label: "Version", placeholder: "OpenSSH 8.9.0", mono: true, generate: { kind: "serviceVersion", reuse: ["service"], label: "version" } },
    { kind: "toggle", key: "active", label: "Open", hint: "Closed ports show as filtered to nmap." },
];

const userFields: FieldDef[] = [
    { kind: "text", key: "username", hint: "The login name for ssh, ftp or a web login page.", label: "Username", mono: true, generate: { kind: "username", reuse: ["firstName", "lastName"], label: "username" } },
    { kind: "text", key: "password", label: "Password", mono: true, hint: "Leave blank to let the game pick one." },
    { kind: "text", key: "firstName", hint: "Shown on the account's profile page and in whois results.", label: "First name", generate: { kind: "firstName", label: "first name" } },
    { kind: "text", key: "lastName", hint: "Shown on the account's profile page and in whois results.", label: "Last name", generate: { kind: "lastName", label: "last name" } },
    { kind: "text", key: "emailAddress", hint: "The account's e-mail address. Useful as a lead the player can mail.", label: "E-mail", mono: true, generate: { kind: "email", reuse: ["firstName", "lastName"], label: "e-mail" } },
    { kind: "toggle", key: "acceptReverseTCP", hint: "Lets the player open a connection from this account back to their own machine. Turn on only if your quest needs it.", label: "Accepts reverse TCP" },
];

const vulnFields: FieldDef[] = [
    {
        kind: "select",
        key: "type", hint: "The kind of weakness this machine has. The in-game scanners report it when the player probes the machine.",
        label: "Type",
        options: VULNERABILITY_TYPES.map((t) => ({ value: t, label: `${t} (${VULNERABILITY_BLURBS[t]})` })),
    },
    { kind: "text", key: "version", hint: "The affected component's version, e.g. \"WordPress 5.8\". Cosmetic unless a trigger matches on it.", label: "Version", placeholder: "optional", mono: true, generate: { kind: "serviceVersion", label: "version" } },
];

/**
 * Firewall rule fields, shared by the Firewall-rule node and firewall devices.
 * The node variant offers "same as the protected IP" for the destination; a
 * device rule has no protected IP, so its destination stays a plain address.
 */
function firewallRuleFields(sameAsProtected: boolean): FieldDef[] {
    return [
        { kind: "number", key: "port", hint: "The port this rule applies to.", label: "Port", min: 0, max: 65535 },
        { kind: "toggle", key: "allowed", label: "Allowed", hint: "Off means the port is blocked by the firewall." },
        {
            kind: "selectOrCustom",
            key: "source",
            label: "Source",
            hint: "Which machines the rule applies to: anywhere on the internet, or one machine you name.",
            mono: true,
            placeholder: "45.33.32.156",
            options: [{ value: "*", label: "Anywhere", meaning: "matches every machine on the internet" }],
        },
        ...(sameAsProtected
            ? [
                  {
                      kind: "selectOrCustom",
                      key: "destination",
                      label: "Destination",
                      hint: "The machine the rule protects — usually the one in “Protected IP” above. Picking it copies that address; changing it later won't follow.",
                      mono: true,
                      placeholder: "45.33.32.156",
                      options: [],
                      sameAs: {
                          label: "Same as the protected IP",
                          fromKey: "/ip",
                          emptyHint: "Same as the protected IP (set it first)",
                      },
                  } as const,
              ]
            : [
                  {
                      kind: "text",
                      key: "destination",
                      label: "Destination",
                      hint: "The destination address the rule matches — usually the protected machine's own address.",
                      mono: true,
                  } as const,
              ]),
        { kind: "toggle", key: "locked", label: "Locked", hint: "The player cannot remove a locked rule." },
    ];
}

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
        fields: firewallRuleFields(false),
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
    /** Live sentence above the fields: what the current settings will do. */
    preview?: (data: Record<string, unknown>) => string | null;
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
    /** Extra data merged over `create()` when the palette or the add-node
        search adds this def (pack nodes: the pack snapshot). */
    addData?: Record<string, unknown>;
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
        blurb: "Runs after a Complete quest node, auto-complete, or Complete button finishes the quest.",
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
            { kind: "event", key: "event", label: "Game event", hint: "All supported HackHub events, listed with the details each one carries." },
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
            { kind: "note", tone: "info", text: "Game note: Bettercap may show no network name after you pick a mod-created access point by BSSID. Scanning, joining and cracking still worked in QA; use the BSSID as the fixed clue." },
            { kind: "text", key: "ssid", hint: "The network name shown in the in-game Wi-Fi list.", label: "Network name (SSID)", mono: true, generate: { kind: "ssid", label: "network name" } },
            { kind: "text", key: "password", label: "WPA passphrase", mono: true, generate: { kind: "wifiPassphrase", label: "passphrase" }, hint: "The passphrase the player must discover. Make sure some node in your quest reveals it." },
            { kind: "slider", key: "signal", label: "Signal strength", min: 0, max: 3, step: 1, hint: "The game's Wi-Fi scale: 0 = weakest, 3 = strongest. It also drives how long joining takes." },
            { kind: "text", key: "bssid", label: "BSSID", mono: true, placeholder: "02:24:00:00:24:01", generate: { kind: "bssid", label: "BSSID" }, hint: "Optional MAC address shown for the access point. Leave blank to let the game pick one." },
            { kind: "number", key: "channel", label: "Channel", min: 1, max: 196, step: 1, hint: "Optional 2.4 GHz or 5 GHz channel shown by scans. Leave blank to let the game pick one for the SSID's band." },
            { kind: "toggle", key: "wps", label: "Advertises WPS", hint: "Whether Wi-Fi scans show WPS for this access point. Leave off unless your story needs to pin it." },
            { kind: "text", key: "model", label: "Router model", mono: true, generate: { kind: "routerModel", label: "router model" }, hint: "Enables the in-game `fern` recovery route. Leave blank to disable it." },
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
            {
                kind: "selectOrCustom",
                key: "ip",
                hint: "The machine these rules protect: the quest's own network, or one machine you name.",
                label: "Protected IP",
                mono: true,
                tokens: true,
                generate: { kind: "ip", ipFlavour: "public", label: "IP address" },
                placeholder: "45.33.32.156",
                options: [
                    {
                        value: TARGET_IP_TOKEN,
                        label: "Random — the quest's network",
                        meaning: "the address the game gave your network",
                    },
                ],
            },
            {
                kind: "section",
                label: "Rule",
                path: "rule",
                fields: firewallRuleFields(true),
            },
            { kind: "toggle", key: "removeOnComplete", hint: "Drop the firewall when the quest ends so the machine is reachable afterwards.", label: "Remove when the quest ends" },
        ],
        create: () =>
            /* Fresh nodes arrive working: the quest's own network, protected
               from anywhere, with the destination already matching. */
            seed(FirewallNodeDataSchema, {
                ip: TARGET_IP_TOKEN,
                rule: { id: nanoid(8), allowed: false, port: 22, source: "*", destination: TARGET_IP_TOKEN },
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
            { kind: "note", tone: "info", text: "Adjusts a machine that already exists — one your “Create network” node built. To add the machine itself, use “Create network”; to open, close, add or remove one of its ports later in the story, use this." },
            { kind: "text", key: "ip", label: "Device IP", mono: true, tokens: true, generate: { kind: "ip", ipFlavour: "private", label: "IP address" }, hint: "A router IP or any device behind it." },
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
            { kind: "text", key: "port.service", hint: "What nmap prints next to the port, e.g. http, ssh, mysql.", label: "Service", mono: true, generate: { kind: "serviceName", label: "service" } },
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
            { kind: "text", key: "domain", hint: "The hostname the player types, e.g. vault.corp-internal.net.", label: "Domain", mono: true, generate: { kind: "domain", label: "domain" } },
            { kind: "text", key: "ip", hint: "The address it resolves to. nslookup and dig will report this.", label: "Resolves to", mono: true, tokens: true, generate: { kind: "ip", ipFlavour: "public", label: "IP address" } },
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
            { kind: "text", key: "host", hint: "The address the player points a database client at.", label: "Host IP", mono: true, tokens: true, generate: { kind: "ip", ipFlavour: "public", label: "IP address" } },
            { kind: "text", key: "user", hint: "The login sqlmap or a client uses.", label: "Username", mono: true, generate: { kind: "username", label: "username" } },
            { kind: "text", key: "password", hint: "The password. Give the player a way to find it — a config file, a leaked dump, a cracked hash.", label: "Password", mono: true },
            { kind: "tables", key: "tables", hint: "The data inside: tables holding rows of named values, ready for the player's SQL.", label: "Tables" },
            { kind: "toggle", key: "removeOnComplete", hint: "Drop the database when the quest ends.", label: "Remove when the quest ends" },
        ],
        create: () => seed(DatabaseNodeDataSchema, { host: "", user: "admin", password: "secret123" }),
    },

    "world.files": {
        type: "world.files",
        category: "world",
        label: "Place files",
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
            { kind: "text", key: "ip", label: "Device IP", mono: true, tokens: true, generate: { kind: "ip", ipFlavour: "private", label: "IP address" }, hint: "Only used for a remote device. Use the same {{data.targetIp}} token you gave the network, and the files are mounted on that machine before the player ever connects." },
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

    "world.packData": {
        type: "world.packData",
        category: "community",
        label: "Give data to an addon",
        blurb: "Pick a data shape from an addon and fill it in",
        icon: "package",
        ...io,
        hook: "onStart",
        /* No registry fields: this node is edited by its own editor
           (NODE_SIM_EDITORS), because its dropdowns come from the loaded
           tool packs, not from a static list. */
        fields: [],
        create: () => seed(PackDataNodeDataSchema),
    },

    "pack.node": {
        type: "pack.node",
        category: "community",
        label: "Addon node",
        blurb: "A story node from an addon — find it under Editor Mods",
        icon: "package",
        ...io,
        hook: "onStart",
        /* No registry fields: the form comes from the pack (snapshotted in
           the node's data) and is rendered by PackNodeEditor — the pack
           author's labels ARE the interface. The palette's copy of this
           def carries the per-node label and the addData snapshot. */
        fields: [],
        create: () => seed(PackNodeDataSchema),
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
                hint: "One “Label: value” per line. The editor turns them into exactly what that tool shows in-game — add a line for each thing you want the player to see.",
            },
            {
                kind: "note",
                tone: "info",
                text: "What each tool reads: whois → domain, ip, registrant, email · lynx → web, email, phone, social, address (anything else is shown as extra detail) · geoip → country, city, latitude, longitude · hydra → username, password · nslookup / mxlookup → ip. nmap is different: write one port per line, like “22 open ssh OpenSSH 8.9.0” — always three numbers. Tags work here too: {{data.targetIp}} is the address the game gave your network, {{data.name}} anything you saved with “Set quest data”, {{player.username}} the player's login, and {{random.password}} a fresh password.",
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

    "comms.tweet": {
        type: "comms.tweet",
        category: "comms",
        label: "Twotter",
        blurb: "Post tweets from one of the mod's Twotter accounts — one, or a profile's worth of history",
        icon: "bird",
        targets: [inFlow],
        sources: [outFlow],
        hook: "onStart",
        fields: [
            { kind: "twotterAccount", key: "accountId", label: "Account", hint: "Which of the mod's Twotter accounts posts these. Accounts are shared by every quest, so one character can carry a story arc across several of them — make one with “Manage accounts”." },
            {
                kind: "note",
                tone: "info",
                text: "Tweets are written oldest first, the order they happened. A profile shows them the other way up — the newest at the top — and that is done by the game, not by you.",
            },
            {
                kind: "note",
                tone: "warn",
                showWhen: { key: "migratedDate", equals: "true" },
                text: "This node came from an older draft whose tweet time could not be carried over exactly — either it pinned a calendar date, or that was the draft's default. A fixed date cannot be turned into an age without reading today's clock, which the editor never does before export, so the node now says “1 month earlier”. Set the amount and unit below to the age you meant.",
            },
            {
                kind: "list",
                key: "tweets",
                label: "Tweets",
                hint: "One row is a single post. A handful of rows with “Already on the profile” times is a history the player finds when they look the character up — a month of excitement before a disappearance, say.",
                addLabel: "Add a tweet",
                itemTitle: (t, i) => {
                    const text = String(t.content ?? "").replace(/\s+/g, " ").trim();
                    const age = t.timeMode === "earlier"
                        ? `${Number(t.agoAmount ?? 2)} ${String(t.agoUnit ?? "days")} earlier`
                        : "on arrival";
                    return `${text ? (text.length > 34 ? `${text.slice(0, 34)}…` : text) : `Tweet ${i + 1}`} — ${age}`;
                },
                fields: [
                    { kind: "textarea", key: "content", label: "Tweet", rows: 3, hint: "What the character wrote. Tags work here, like everywhere else an author writes text." },
                    /* HIDDEN (r187, Zeis's call): the game cannot show a tweet
                       picture — `TwotterTweet` has no picture field and the
                       r185 run saw none in the feed, the profile or the post's
                       own page, while the same data-URI shape rendered fine as
                       an account avatar. A control that does nothing is a trap
                       for authors, so it is gone rather than explained; the
                       project field stays and keeps migrating, and the export
                       report still names any picture it finds. A feature
                       request for the field is filed in
                       docs/03-questions-for-the-developers.md §10 — this line
                       goes back the day the API accepts one. */
                    // { kind: "image", key: "image", label: "Attached picture", hint: "…" },
                    {
                        kind: "select",
                        key: "timeMode",
                        label: "When",
                        display: "segmented",
                        hint: "“When the story arrives” posts the tweet as the flow reaches this node. “Already on the profile” has it sitting there from the start, that far back.",
                        options: [
                            { value: "arrival", label: "When the story arrives", hint: "The player sees it appear, reading “a few seconds ago”." },
                            { value: "earlier", label: "Already on the profile", hint: "Backdated by the amount beside this: the profile reads “a month ago” the moment the player finds it." },
                        ],
                    },
                    {
                        kind: "row",
                        label: "Posted",
                        showWhen: { key: "timeMode", equals: "earlier" },
                        fields: [
                            { kind: "number", key: "agoAmount", label: "How long ago", min: 1, step: 1, hint: "Counted back from the moment the story reaches this node, on the in-game clock." },
                            {
                                kind: "select",
                                key: "agoUnit",
                                label: "Unit",
                                hint: "Minutes through years, the same units a Timer takes.",
                                options: TWOTTER_AGO_UNITS.map((u) => ({ value: u, label: u })),
                            },
                        ],
                    },
                    {
                        kind: "row",
                        label: "Shown on the post",
                        columns: 4,
                        fields: [
                            { kind: "number", key: "likes", label: "Likes", min: 0, step: 1, hint: "Cosmetic, but it sells the fiction. A brand-new account with 400 likes reads as fake." },
                            { kind: "number", key: "comments", label: "Replies", min: 0, step: 1, hint: "How many replies the post shows. The game does not open them — this is the number under the post, nothing more." },
                            { kind: "number", key: "shares", label: "Reposts", min: 0, step: 1, hint: "How many times the post was shared. Zero is fine and often truest — a small account screaming into the void." },
                            { kind: "number", key: "views", label: "Views", min: 0, step: 1, hint: "How many people saw it. It has to look plausible next to the likes: thousands of views with two likes reads wrong." },
                        ],
                    },
                    { kind: "toggle", key: "showInTimeline", label: "Also in the main timeline", hint: "Off keeps a year of history on the profile where the player looked for it. On drops it into the public feed too — good for an announcement the whole city should see." },
                ],
                newItem: () => ({
                    id: nanoid(8),
                    content: "",
                    timeMode: "arrival",
                    agoAmount: 2,
                    agoUnit: "days",
                    likes: 24,
                    comments: 3,
                    shares: 1,
                    views: 512,
                    showInTimeline: false,
                }),
            },
        ],
        create: () => seed(TweetNodeDataSchema, {
            tweets: [{
                id: nanoid(8),
                content: "",
                timeMode: "arrival",
                agoAmount: 2,
                agoUnit: "days",
                likes: 24,
                comments: 3,
                shares: 1,
                views: 512,
                showInTimeline: false,
            }],
        }),
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
            { kind: "note", tone: "info", text: "This makes a new command the player can type in the terminal. Wire the green “Correct” socket for a right answer and the red “Wrong” socket for a wrong one." },
            { kind: "text", key: "commandName", hint: "The terminal command the player runs, e.g. decrypt. It appears in help output.", label: "Command name", mono: true, placeholder: "decrypt" },
            { kind: "text", key: "commandDescription", hint: "The one-line description shown next to the command in help.", label: "Help text" },
            { kind: "text", key: "prompt", hint: "The text printed before the cursor, e.g. \"Passphrase >\".", label: "Prompt", placeholder: "Passphrase >" },
            { kind: "toggle", key: "mask", label: "Mask the input", hint: "Hides typing behind * — the player sees “Passphrase > ****” instead of their answer, like a password box. Use it when the answer is a secret." },
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
            { kind: "number", key: "amount", hint: "Credits deposited into the player's bank account.", label: "Amount", min: 0 },
            { kind: "text", key: "description", hint: "The label on the bank statement line.", label: "Description" },
            { kind: "text", key: "fromIBAN", hint: "The sending account, shown in the transfer details.", label: "From IBAN", mono: true, generate: { kind: "iban", label: "IBAN" } },
            { kind: "text", key: "fromName", hint: "The sender's name on the statement.", label: "From name", generate: { kind: "initialName", label: "sender name" } },
            /* Percent-of-balance on a payment was removed from new nodes (it is
               the Charge node's job). Old projects that used it still run as
               written — this note is the only trace left. */
            { kind: "note", tone: "info", showWhen: { key: "amountMode", equals: "percent" }, text: "Kept from an earlier version: this pays a percentage of the player's balance. It still works." },
        ],
        create: () => seed(PayNodeDataSchema, { amount: 100, description: "Job payment" }),
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

    "fx.prompt": {
        type: "fx.prompt",
        category: "effect",
        label: "Ask player",
        blurb: "Ask for one line of text",
        icon: "message",
        targets: [inFlow],
        sources: [submittedOut, failureOut, cancelledOut],
        dynamicSources: (data) => promptSockets(data),
        hook: "onStart",
        fields: [
            {
                kind: "note",
                tone: "info",
                text: "Shows one question when the story reaches this node. The top output fires when the player submits text; Cancelled fires when they close it without answering.",
            },
            { kind: "text", key: "title", label: "Title", hint: "The heading at the top of the question box. Leave blank if the question itself is enough.", tokens: true, placeholder: "Security check" },
            { kind: "text", key: "label", label: "Question", hint: "The sentence above the answer box — what you want the player to answer.", tokens: true, placeholder: "Enter the recovery code:" },
            { kind: "text", key: "placeholder", label: "Example text", hint: "Grey hint inside an empty answer box. It disappears as soon as the player types.", tokens: true, placeholder: "ABCD-1234" },
            { kind: "text", key: "defaultValue", label: "Starts filled with", hint: "Text already in the answer box when it opens. Leave blank when the player should type from scratch.", tokens: true },
            { kind: "toggle", key: "password", label: "Mask typing", hint: "Hides what the player types, like a password box. Use for passphrases, keys and private codes." },
            { kind: "text", key: "storeAs", label: "Save answer as", hint: "Optional name for the answer. If you type playerAnswer here, later nodes can read it with {{data.playerAnswer}}. Leave blank if only this choice matters.", mono: true, placeholder: "playerAnswer" },
            {
                kind: "select",
                key: "matchMode",
                label: "Accept",
                hint: "Choose whether any submitted text continues, or whether the answer must match something you set.",
                options: [
                    { value: "any", label: "Any submitted text" },
                    { value: "exact", label: "Exactly this answer" },
                    { value: "contains", label: "Contains these words" },
                    { value: "regex", label: "Matches a pattern" },
                ],
            },
            { kind: "text", key: "expected", label: "Answer to accept", hint: "The text that counts as the right answer. Tags are filled before the check, so a saved password can be accepted too.", mono: true, tokens: true, showWhen: { key: "matchMode", equals: ["exact", "contains", "regex"] } },
            { kind: "toggle", key: "caseSensitive", label: "Case sensitive", hint: "Turn off to accept any capitalisation. Turn on only when upper and lower case are part of the puzzle.", showWhen: { key: "matchMode", equals: ["exact", "contains", "regex"] } },
            { kind: "note", tone: "warn", showWhen: { key: "matchMode", equals: "regex" }, text: "Pattern matching is powerful but easy to make unfair. Prefer exact or contains unless several different answers should count." },
        ],
        create: () =>
            seed(PromptNodeDataSchema, {
                title: "Answer needed",
                label: "Type your answer:",
                matchMode: "any",
            }),
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

    "fx.completeQuest": {
        type: "fx.completeQuest",
        category: "effect",
        label: "Complete quest",
        blurb: "Finish the current quest and run On quest complete",
        icon: "check",
        targets: [inFlow],
        sources: [],
        hook: "onStart",
        fields: [
            { kind: "note", tone: "info", text: "This is a terminal ending. Put closing mail, payments and notifications before it, or place them under On quest complete." },
        ],
        create: () => seed(CompleteQuestNodeDataSchema),
    },

    "fx.retireQuest": {
        type: "fx.retireQuest",
        category: "effect",
        label: "Retire quest",
        blurb: "Remove the current quest without marking it complete",
        icon: "trash",
        targets: [inFlow],
        sources: [],
        hook: "onStart",
        fields: [
            { kind: "note", tone: "warn", text: "This is a terminal ending. The quest disappears without rewards and without On quest complete." },
        ],
        create: () => seed(RetireQuestNodeDataSchema),
    },

    "fx.unclaimQuest": {
        type: "fx.unclaimQuest",
        category: "effect",
        label: "Unclaim quest",
        blurb: "Remove a claimed quest from the player's list",
        icon: "x",
        targets: [inFlow],
        sources: [],
        hook: "onStart",
        fields: [
            { kind: "text", key: "questName", hint: "The identifier of the claimed quest to remove. Leave blank to remove this quest.", label: "Quest", mono: true, placeholder: "blank = this quest" },
        ],
        create: () => seed(UnclaimQuestNodeDataSchema, { questName: "" }),
    },

    "fx.shell": {
        type: "fx.shell",
        category: "effect",
        label: "Run terminal command",
        blurb: "Execute in the terminal",
        icon: "terminal",
        ...io,
        hook: "onStart",
        fields: [
            { kind: "note", tone: "info", text: "Runs a command the moment the story reaches this node, as if the player had typed it — for things the story should do that the player hasn't. Example: “nmap {{data.targetIp}}” runs a scan the player can read." },
            { kind: "text", key: "command", hint: "The command executed in the player's terminal, as if they had typed it. Tags like {{data.targetIp}} are filled in first.", label: "Command", mono: true, tokens: true },
        ],
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
            { kind: "handbookArticle", key: "articleId", hint: "The page to open. In game 1.3.1 this opens the handbook on its own landing page: reaching a particular page is not possible until the page names the game uses are known (see the manual).", label: "Article" },
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

    "flow.timer": {
        type: "flow.timer",
        category: "flow",
        label: "Timer",
        blurb: "Do something at a later in-game time",
        icon: "hourglass",
        ...io,
        hook: "onStart",
        fields: [
            { kind: "note", tone: "info", text: "Fires the next node at a later in-game time. Wait holds the story for an exact stretch — any mix of years, months, weeks, days, hours and minutes; A coming day counts calendar time from now and rings at a clock time — “in 1 month 2 weeks 2 days, at 18:23” — so it stays right however long the player leaves the quest; An exact date pins a moment in the story's own calendar. A time that has already passed fires as soon as the story reaches the node." },
            {
                kind: "select",
                key: "mode",
                hint: "A stretch to wait, a clock time counted from now, or a fixed moment in the story's own calendar.",
                label: "When it fires",
                display: "segmented",
                options: [
                    { value: "after", label: "Wait" },
                    { value: "daytime", label: "A coming day" },
                    { value: "at", label: "An exact date" },
                ],
            },
            {
                kind: "row",
                label: "Wait",
                showWhen: { key: "mode", equals: "after" },
                columns: 3,
                /* The stored value stays exactly as typed; the readback only
                   says it in words ("25 hours" -> "1 day, 1 hour"). */
                readback: (data) => unitsReadback(data, WAIT_UNITS),
                fields: [
                    { kind: "number", key: "years", hint: "Whole in-game years to wait, before the shorter units beside it. A target month with fewer days uses its last day.", label: "Years", min: 0, step: 1, suffix: "years" },
                    { kind: "number", key: "months", hint: "Whole in-game months to wait, on top of the years. 31 January plus one month lands on 28 February, not in March.", label: "Months", min: 0, step: 1, suffix: "months" },
                    { kind: "number", key: "weeks", hint: "In-game weeks to wait, on top of the months. One week is seven in-game days.", label: "Weeks", min: 0, step: 1, suffix: "weeks" },
                    { kind: "number", key: "days", hint: "In-game days to wait first. 0 is fine — the units are added up.", label: "Days", min: 0, step: 1, suffix: "days" },
                    { kind: "number", key: "hours", hint: "In-game hours, on top of the days. 25 hours is a legal value.", label: "Hours", min: 0, step: 1, suffix: "hours" },
                    { kind: "number", key: "minutes", hint: "In-game minutes, on top of the days and hours. At the default game speed one in-game minute passes every real second.", label: "Minutes", min: 0, step: 1, suffix: "minutes" },
                ],
            },
            {
                kind: "row",
                label: "In",
                showWhen: { key: "mode", equals: "daytime" },
                columns: 4,
                /* One box per unit, in the order a person says them — "1 year,
                   1 month, 2 weeks, 2 days". Hours and minutes are deliberately
                   absent: the clock below pins the time of day, so a box for
                   them would be a second way to write the same number. Wait
                   takes them instead, with no clock to collide with. */
                fields: [
                    { kind: "number", key: "offsetYears", hint: "In-game years from now, counted from the day the story reaches this node. A target month with fewer days uses its last day.", label: "Years", min: 0, step: 1, suffix: "years" },
                    { kind: "number", key: "offsetMonths", hint: "In-game months from now, on top of the years. 31 January plus one month lands on 28 February, not in March.", label: "Months", min: 0, step: 1, suffix: "months" },
                    { kind: "number", key: "offsetWeeks", hint: "In-game weeks from now, on top of the months. One week is seven in-game days.", label: "Weeks", min: 0, step: 1, suffix: "weeks" },
                    { kind: "number", key: "offsetDays", hint: "In-game days from now, on top of the weeks and months. 0 means today, so “0 days, at 09:00” fires the next time the clock reads 09:00.", label: "Days", min: 0, step: 1, suffix: "days" },
                ],
            },
            {
                kind: "row",
                label: "On",
                showWhen: { key: "mode", equals: "at" },
                fields: [
                    { kind: "number", key: "dateDay", hint: "The in-game day of the month, as the in-game clock shows it. The field warns when that day does not exist.", label: "Day", min: 1, max: 31, step: 1 },
                    {
                        kind: "select",
                        key: "dateMonth",
                        label: "Month",
                        numeric: true,
                        hint: "The in-game month, by name, as the in-game clock shows it.",
                        options: MONTH_OPTIONS,
                    },
                    { kind: "number", key: "dateYear", hint: "The in-game year, e.g. 2026. Read it off the in-game clock, not your own calendar.", label: "Year", min: 1970, max: 9999, step: 1 },
                ],
            },
            {
                kind: "clock",
                label: "At",
                showWhen: { key: "mode", equals: ["daytime", "at"] },
                hour: { kind: "number", key: "hour", hint: "The hour the in-game clock will show, 0–23. This is the player's clock, not the wall clock.", label: "Hour", min: 0, max: 23, step: 1 },
                minute: { kind: "number", key: "minute", hint: "The minute the in-game clock will show, 0–59.", label: "Minute", min: 0, max: 59, step: 1 },
            },
        ],
        create: () => seed(TimerNodeDataSchema),
        preview: (data) => timerSentence(data as Record<string, unknown>),
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
                itemTitle: (s, i) => String(s.label || `${i + 1}`),
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
                newItem: (index) => ({ id: nanoid(8), label: String(index + 1), delayMs: 500 }),
            },
        ],
        create: () =>
            seed(SequenceNodeDataSchema, {
                steps: [
                    { id: nanoid(8), label: "1", delayMs: 0 },
                    { id: nanoid(8), label: "2", delayMs: 1000 },
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
            { kind: "toggle", key: "includePayload", hint: "Also print the details the game passed to this point, so you can see the real values instead of guessing what arrived.", label: "Include the event" },
            { kind: "toggle", key: "toast", hint: "Also show it on screen, so you can test without reading the log file.", label: "Show on screen too" },
        ],
        create: () => seed(DebugNodeDataSchema, { label: "" }),
    },
    "flow.note": {
        type: "flow.note",
        category: "layout",
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

    "flow.beat": {
        type: "flow.beat",
        category: "layout",
        label: "Story Beat",
        blurb: "Plan a story beat — colour it, preview it",
        icon: "flag",
        /* Wireable so it can sit among reroute / branch / sequence while a story
           is being planned. The flow through it is a transparent pass-through
           (the runtime's default case), and it is stripped from the export. */
        targets: [inFlow],
        sources: [outFlow],
        hook: "declarative",
        /* One output socket per branch choice (plus the generic "Out"), so an
           author can wire each branch onward while planning. Mirrors how a
           Sequence grows an output per step. */
        dynamicSources: (data) => storyBeatSockets(data),
        fields: [
            { kind: "note", tone: "info", text: "Planning only. This node is stripped from the exported mod and never runs. Wire it among reroute, branch and sequence to sketch a flow; the story passes through it unchanged." },
            { kind: "text", key: "title", label: "Headline", hint: "A short name for this beat, e.g. “Act 2 — the firewall”. It is the card's title bar." },
            { kind: "textarea", key: "text", label: "Beat text", rows: 8, hint: "The key content of the beat. The card previews the top ~800 characters and expands into a scrollable panel for the rest." },
            {
                kind: "list",
                key: "choices",
                label: "Branch choices",
                hint: "Add a row for each path the story can take. Each gets its own output socket on the card, so you can wire each branch onward while planning.",
                addLabel: "Add choice",
                defaultOpen: true,
                itemTitle: (c: Record<string, unknown>, i: number) =>
                    String((c.label as string | undefined)?.trim() || `Choice ${i + 1}`),
                fields: [
                    { kind: "text", key: "label", label: "Choice", hint: "Short title for this path, e.g. “Go in through the front door”." },
                    { kind: "textarea", key: "note", label: "What happens", rows: 2, hint: "One line on where this path leads, so a branching beat reads at a glance." },
                ],
                newItem: () => ({ id: nanoid(8), label: "", note: "" }),
            },
            { kind: "number", key: "width", label: "Width (px)", min: 200, max: 640, step: 20, hint: "How wide the card is on the canvas, in pixels." },
            { kind: "color", key: "color", label: "Card colour", hint: "Pick any colour. Colour-coding by act, character or branch is usually the clearest." },
        ],
        create: () => seed(StoryBeatNodeDataSchema, { title: "", text: "", color: "#64748b", width: 280 }),
    },
};

/**
 * Node types that exist in the engine and schema but are deliberately not
 * offered in the editor's palette or add-node search.
 *
 * This is currently empty. `world.wifi` used to live here while the project
 * waited for a native wireless creator and in-game QA. SDK 0.24.0 now declares
 * `Network.createWifiNetwork()`, and the r166 QA pass verified creation,
 * scan fields, connect/disconnect events, reload stability and cracking well
 * enough to expose Create Wi-Fi to authors.
 */
export const PALETTE_HIDDEN_TYPES: ReadonlySet<NodeType> = new Set();

/** Palette order: categories first, then registry order within each. */
export function paletteGroups(): { category: (typeof CATEGORIES)[number]; types: NodeTypeDef[] }[] {
    return CATEGORIES.map((category) => ({
        category,
        types: (Object.values(NODE_TYPES_REGISTRY) as NodeTypeDef[]).filter(
            (t) => t.category === category.id && !PALETTE_HIDDEN_TYPES.has(t.type),
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
        label: step.label?.trim() || `${i + 1}`,
    }));
}

/**
 * The output sockets a Story Beat shows: the generic "Out" pass-through plus one
 * per branch choice (in author order), so each planned branch can be wired
 * onward. A choice's socket survives until the choice is removed; the compiler
 * strips the whole beat and splices these wires, so they never reach the mod.
 */
export function storyBeatSockets(data: unknown): HandleSpec[] {
    const choices = (data as { choices?: { id?: string; label?: string }[] })?.choices ?? [];
    return [
        outFlow,
        ...choices.map((c, i) => ({
            id: `choice-${c.id}`,
            kind: "flow" as const,
            label: c.label?.trim() || `Choice ${i + 1}`,
        })),
    ];
}

/** The Ask player outputs change labels when the author asks for a checked answer. */
export function promptSockets(data: unknown): HandleSpec[] {
    const mode = (data as { matchMode?: string })?.matchMode ?? "any";
    if (mode === "any") return [submittedOut, cancelledOut];
    return [successOut, failureOut, cancelledOut];
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
