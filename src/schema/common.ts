/**
 * The address of the machine a quest is built around.
 *
 * The game allocates it per playthrough (`Network.randomIp()` in
 * `CreateData()`), and the author never types it: networks live in the save and
 * outlive the mod, so a fixed address meant a re-exported build collided with
 * its own older self (r73). Anywhere an author needs the address — a whois
 * answer, an objective hint, a mail — this token is filled in for them, and the
 * inspector shows "Random IP" rather than the token itself.
 */
export const TARGET_IP_TOKEN = "{{data.targetIp}}";

/**
 * Shared primitives for the project document.
 *
 * Everything here is deliberately JSON-serialisable: the document is the single
 * source of truth for the whole app (see docs/01-analysis-and-architecture.md §4.2
 * rule 1), so it must round-trip through localStorage, a .hackhubqe file, and the
 * `project.json` embedded in every export.
 */
import { z } from "zod";

/** Bumped whenever the document shape changes in a way needing migration. */
export const PROJECT_SCHEMA_VERSION = 1;

export const PositionSchema = z.object({
    x: z.number(),
    y: z.number(),
});
export type Position = z.infer<typeof PositionSchema>;

export const ViewportSchema = z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number(),
});
export type Viewport = z.infer<typeof ViewportSchema>;

/** A lowercase-hyphenated identifier, as required for `manifest.id`. */
export const SlugSchema = z
    .string()
    .min(1, "Required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only");

/** A PascalCase identifier, as required for `Quest.Name`. */
export const IdentifierSchema = z
    .string()
    .min(1, "Required")
    .regex(/^[A-Za-z][A-Za-z0-9]*$/, "Letters and numbers only, starting with a letter");

export const SemverSchema = z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "Use semantic versioning, e.g. 1.0.0");

/**
 * A reference to another node in the same quest graph. Kept as a plain string so
 * the document stays JSON-friendly; referential integrity is checked by the
 * analysis layer, not by the schema.
 */
export const NodeRefSchema = z.string();

/**
 * Tokens the compiler substitutes at quest runtime, e.g. `{{data.targetIp}}`.
 * Declared here so every string field can advertise that it accepts them.
 */
export const RUNTIME_TOKENS = [
    { token: "{{data.targetIp}}", label: "Target IP", hint: "The quest's randomly-assigned target" },
    { token: "{{player.ip}}", label: "Player IP" },
    { token: "{{player.email}}", label: "Player e-mail" },
    { token: "{{player.username}}", label: "Player username" },
    { token: "{{random.password}}", label: "Random password" },
    { token: "{{random.ip}}", label: "Random IP" },
    { token: "{{random.username}}", label: "Random username" },
] as const;

export type RuntimeToken = (typeof RUNTIME_TOKENS)[number]["token"];

/**
 * A file/folder entry, used for a player's PC, a remote device's home directory,
 * or `rootFiles` at a remote root. Mirrors the SDK's `NetworkFileMap`.
 */
export const FileEntrySchema: z.ZodType<FileEntry> = z.lazy(() =>
    z.object({
        id: z.string(),
        name: z.string(),
        isFolder: z.boolean().default(false),
        data: z.string().optional(),
        extension: z.string().optional(),
        hidden: z.boolean().optional(),
        locked: z.boolean().optional(),
        children: z.array(FileEntrySchema).optional(),
    }),
);
export type FileEntry = {
    id: string;
    name: string;
    isFolder: boolean;
    data?: string;
    extension?: string;
    hidden?: boolean;
    locked?: boolean;
    children?: FileEntry[];
};

/** A network device user account. Mirrors the SDK's `NetworkUser`. */
export const NetworkUserSchema = z.object({
    id: z.string(),
    username: z.string(),
    password: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    online: z.boolean().optional(),
    /** Mounts under this user's home directory on a remote device. */
    files: z.array(FileEntrySchema).optional(),
    acceptReverseTCP: z.boolean().optional(),
    emailAddress: z.string().optional(),
    emailPassword: z.string().optional(),
});
export type NetworkUser = z.infer<typeof NetworkUserSchema>;

/** An exposed port. Mirrors the SDK's `NetworkPort`. */
export const NetworkPortSchema = z.object({
    id: z.string(),
    external: z.number(),
    internal: z.number(),
    active: z.boolean().default(true),
    locked: z.boolean().optional(),
    service: z.string().optional(),
    version: z.string().optional(),
});
export type NetworkPort = z.infer<typeof NetworkPortSchema>;

/** A firewall rule. Mirrors the SDK's `FirewallRule`. */
export const FirewallRuleSchema = z.object({
    id: z.string(),
    allowed: z.boolean().default(false),
    port: z.number(),
    source: z.string().optional(),
    destination: z.string().optional(),
    locked: z.boolean().optional(),
});
export type FirewallRule = z.infer<typeof FirewallRuleSchema>;

/** Vulnerability types recognised by `nuclei` / `sqlmap`. */
export const VULNERABILITY_TYPES = [
    "SQL_INJECTION",
    "XSS",
    "CORS",
    "SSRF",
    "LFI",
    "RFI",
    "RCE",
] as const;
export const VulnerabilityTypeSchema = z.enum(VULNERABILITY_TYPES);
export type VulnerabilityType = z.infer<typeof VulnerabilityTypeSchema>;

export const VulnerabilitySchema = z.object({
    id: z.string(),
    type: VulnerabilityTypeSchema,
    version: z.string().optional(),
});
export type Vulnerability = z.infer<typeof VulnerabilitySchema>;

/** Router / Device / Firewall / Splitter / Printer. */
export const DEVICE_TYPES = ["ROUTER", "DEVICE", "FIREWALL", "SPLITTER", "PRINTER"] as const;
export const DeviceTypeSchema = z.enum(DEVICE_TYPES);
export type DeviceType = z.infer<typeof DeviceTypeSchema>;

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
    ROUTER: "Router",
    DEVICE: "Device",
    FIREWALL: "Firewall",
    SPLITTER: "Splitter",
    PRINTER: "Printer",
};

/**
 * A device in a network tree. Recursive: routers and splitters carry children.
 * Mirrors the SDK's `ChildSubnetDefinition` discriminated union.
 */
export const NetworkDeviceSchema: z.ZodType<NetworkDevice> = z.lazy(() =>
    z.object({
        id: z.string(),
        ip: z.string(),
        name: z.string().optional(),
        type: DeviceTypeSchema,
        lanIp: z.string().optional(),
        domainName: z.string().optional(),
        vulnerabilities: z.array(VulnerabilitySchema).default([]),
        users: z.array(NetworkUserSchema).default([]),
        ports: z.array(NetworkPortSchema).default([]),
        /** Router only: enables the in-game `fern` attack route. */
        model: z.string().optional(),
        /** Router only: enables the support-mail password recovery route. */
        accessable: z.boolean().optional(),
        /** Firewall only. */
        rules: z.array(FirewallRuleSchema).default([]),
        /** Mounted at the remote root (/) of a Device. */
        rootFiles: z.array(FileEntrySchema).default([]),
        /** Hidden from `nmap` unless the player already knows the IP. */
        isIpHidden: z.boolean().optional(),
        /**
         * Device only. Adds the engine's stock `root` and `guest` accounts
         * alongside the ones written here. A guest account is what the SSH
         * exploit lands in when it finds one, so leaving it off gives the
         * player the authored account instead. Defaults to on, which is what
         * every build before r78 did unconditionally.
         */
        extraAccounts: z.boolean().optional(),
        location: z
            .object({
                latitude: z.string(),
                longitude: z.string(),
                city: z.string().optional(),
                country: z.string().optional(),
            })
            .optional(),
        /** Router / Splitter only. */
        children: z.array(NetworkDeviceSchema).default([]),
    }),
);
export type NetworkDevice = {
    id: string;
    ip: string;
    name?: string;
    type: DeviceType;
    lanIp?: string;
    domainName?: string;
    vulnerabilities: Vulnerability[];
    users: NetworkUser[];
    ports: NetworkPort[];
    model?: string;
    accessable?: boolean;
    rules: FirewallRule[];
    rootFiles: FileEntry[];
    isIpHidden?: boolean;
    extraAccounts?: boolean;
    location?: { latitude: string; longitude: string; city?: string; country?: string };
    children: NetworkDevice[];
};
