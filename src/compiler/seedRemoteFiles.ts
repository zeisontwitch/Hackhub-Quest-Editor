/**
 * Fold "Seed files → a remote device" nodes into the device that owns them.
 *
 * ## Why this exists
 *
 * The `world.files` node offers two targets: the player's PC, and a remote
 * device. Only the first ever worked. Every `Files.*` function in the SDK
 * resolves against the *current session* — none of them takes a target address
 * — so at quest-start time, when no remote session exists, a device-targeted
 * node had nowhere to write. The compiler emitted a warning saying the node
 * "exports as a note" and dropped it.
 *
 * That mattered more than it sounds. The in-game handbook's whole
 * exfiltration loop assumes files sitting on target machines: find the file,
 * download it, deliver it. An author following the handbook reaches for this
 * node, points it at their server, and gets nothing.
 *
 * ## The fix
 *
 * There *is* a way to put a file on a remote machine, and Harbour has used it
 * all along: `NetworkUser.files` mounts in that user's home directory, and the
 * engine mounts the whole tree before anyone connects. It is simply declared
 * on the device rather than run as a step.
 *
 * So the node now compiles to exactly that. At build time — not runtime — the
 * files are moved onto the matching device's owning user. The author keeps the
 * node they reached for; it just resolves somewhere that works.
 *
 * ## Why compile time
 *
 * A runtime step could not work at all: by the time the flow runs, the network
 * is already built and the SDK offers no way to write into it remotely. Doing
 * it while assembling the project is the only point at which the files can
 * still reach the device definition.
 */
import type { FileEntry, NetworkDevice, NetworkUser } from "@/schema/common";
import type { NodeDoc } from "@/schema/nodes";
import type { QuestDoc } from "@/schema/project";

/** A `world.files` node's data, in the shape this module cares about. */
interface SeedFilesData {
    target?: string;
    ip?: string;
    parentPath?: string;
    files?: FileEntry[];
}

/** A `world.network` / `world.wifi` node's data. */
interface NetworkData {
    device?: NetworkDevice;
    ipMode?: string;
}

/**
 * Which user should own seeded files.
 *
 * Prefers the account the story is about — one that accepts a reverse shell is
 * almost always the one the player lands in, so files under it are the ones
 * they will actually find. Falls back to the first user.
 */
export function ownerFor(device: NetworkDevice): NetworkUser | null {
    const users = device.users ?? [];
    if (users.length === 0) return null;
    return users.find((u) => u.acceptReverseTCP) ?? users[0];
}

/** Every device in a tree, parents before children. */
function flatten(device: NetworkDevice | undefined): NetworkDevice[] {
    if (!device) return [];
    return [device, ...(device.children ?? []).flatMap(flatten)];
}

/**
 * The device a seed node is aimed at.
 *
 * Matches on IP. A network set to a random address carries the `{{data…}}`
 * token rather than a number, so an author who wrote the same token in both
 * places still matches — which is the common case, since manual IP entry was
 * removed in r73 and every network is random now.
 */
function deviceFor(
    seed: SeedFilesData,
    networks: { data: NetworkData }[],
): NetworkDevice | null {
    const wanted = String(seed.ip ?? "").trim();
    const all = networks.flatMap((n) => flatten(n.data.device));
    if (all.length === 0) return null;

    if (wanted) {
        const exact = all.find((d) => String(d.ip ?? "").trim() === wanted);
        if (exact) return exact;
    }

    /*
     * No usable address. If the quest builds exactly one machine that a player
     * could log into, that is unambiguously the one meant — better to place
     * the files than to drop them over a blank field.
     */
    const loginable = all.filter((d) =>
        (d.ports ?? []).some((p) => ["ssh", "ftp", "telnet"].includes(String(p.service))),
    );
    if (loginable.length === 1) return loginable[0];
    return all.length === 1 ? all[0] : null;
}

/**
 * Wrap files in the folders of `parentPath`, so a node that asked for
 * `/var/www/` produces `var/www/<files>` rather than dropping them loose in
 * the user's home directory.
 *
 * `~` and `/home/<user>` mean "the home directory itself", which is already
 * where a user's files mount, so they add no folders.
 */
export function nest(parentPath: string | undefined, files: FileEntry[]): FileEntry[] {
    const path = String(parentPath ?? "").trim();
    if (!path || path === "~" || path === "~/" || path === "/") return files;

    const parts = path
        .replace(/^~\/?/, "")
        .replace(/^\/+/, "")
        .replace(/\/+$/, "")
        .split("/")
        .filter((p) => p && p !== "." && !/^home$/i.test(p));
    if (parts.length === 0) return files;

    return [
        parts.reduceRight<FileEntry>(
            (children, name) => ({
                id: `seed-${name}`,
                name,
                isFolder: true,
                children: Array.isArray(children) ? children : [children],
            }) as FileEntry,
            files as unknown as FileEntry,
        ),
    ];
}

export interface SeedResult {
    /** Node ids that were folded into a device and should not be compiled. */
    absorbed: Set<string>;
    /** Nodes that could not be placed, with the reason. */
    unplaced: { node: NodeDoc; reason: string }[];
}

/**
 * Move device-targeted seed files onto their devices.
 *
 * Mutates the quest's device definitions, and reports which nodes were
 * absorbed so the compiler can skip emitting them as runtime steps.
 */
export function seedRemoteFiles(quest: QuestDoc): SeedResult {
    const absorbed = new Set<string>();
    const unplaced: { node: NodeDoc; reason: string }[] = [];

    const networks = quest.graph.nodes.filter(
        (n) => n.type === "world.network" || n.type === "world.wifi",
    ) as unknown as { data: NetworkData }[];

    for (const node of quest.graph.nodes) {
        if (node.type !== "world.files") continue;
        const data = node.data as SeedFilesData;
        if (data.target === "player") continue;
        if (!data.files || data.files.length === 0) {
            absorbed.add(node.id);
            continue;
        }

        const device = deviceFor(data, networks);
        if (!device) {
            unplaced.push({
                node,
                reason: networks.length === 0
                    ? "this quest does not create a network, so there is no device to put the files on"
                    : "no device matches that address",
            });
            continue;
        }

        const owner = ownerFor(device);
        if (!owner) {
            unplaced.push({
                node,
                reason: "that device has no user account, and files mount under a user's home directory",
            });
            continue;
        }

        owner.files = [...(owner.files ?? []), ...nest(data.parentPath, data.files)];
        absorbed.add(node.id);
    }

    return { absorbed, unplaced };
}
