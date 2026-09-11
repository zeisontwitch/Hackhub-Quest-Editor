/**
 * Step 4: the export compiler. Turns the project document into a complete,
 * build-free HackHub mod folder:
 *
 *   manifest.json        mod metadata + computed permissions
 *   dist/mod.js          runnable CJS (plain JS — no TS-only syntax)
 *   src/index.ts         the same text, for power users who rebuild
 *   package.json …       scaffolding so `npm run build` also works
 *   README.md            what got compiled, and what needs a human
 *
 * The emitted mod.js embeds the project as data plus a small interpreter
 * (runtimeSource.ts) that walks each quest graph at runtime.
 */
import type { ProjectDocument } from "@/schema/project";
import { seedRemoteFiles } from "./seedRemoteFiles";
import type { NodeDoc } from "@/schema/nodes";
import type { EdgeDoc } from "@/schema/edges";
import { RUNTIME_SOURCE } from "./runtimeSource";

/**
 * Node types that live in the editor only: they are canvas furniture and
 * planning aids, never part of the story the game runs. They are stripped from
 * the exported graph so the mod carries no trace of them.
 */
const FURNITURE_NODE_TYPES = new Set(["flow.note", "layout.group", "flow.beat"]);

/** Create bypass edges for story beats so A→beat→B becomes A→B (F3: ≤2 nesting). */
function createBypassEdges(
    beats: string[],
    graphEdges: EdgeDoc[],
    removed: Set<string>,
): EdgeDoc[] {
    const bypass: EdgeDoc[] = [];
    for (const beatId of beats) {
        const inEdges = graphEdges.filter((e) => e.target === beatId && e.kind === "flow");
        const outEdges = graphEdges.filter((e) => e.source === beatId && e.kind === "flow");
        for (const incoming of inEdges) {
            for (const outgoing of outEdges) {
                if (removed.has(incoming.source) || removed.has(outgoing.target)) continue;
                bypass.push({
                    id: `bypass-${incoming.id}-${outgoing.id}`,
                    source: incoming.source,
                    sourceHandle: incoming.sourceHandle,
                    target: outgoing.target,
                    targetHandle: outgoing.targetHandle,
                    kind: "flow",
                });
            }
        }
    }
    return bypass;
}

/**
 * Remove editor-only furniture from a quest graph.
 *
 * Story Beats are the one furniture type that is wireable, so its flow edges are
 * spliced: a wire A→beat→B becomes a direct A→B. Notes and group frames have no
 * sockets, so they simply drop. Any edge that touched a removed node (and was
 * not reconnected) is dropped too, so no dangling references survive into the
 * runtime.
 */
function stripFurniture(graphNodes: NodeDoc[], graphEdges: EdgeDoc[]): { nodes: NodeDoc[]; edges: EdgeDoc[] } {
    const removed = new Set(graphNodes.filter((n) => FURNITURE_NODE_TYPES.has(n.type)).map((n) => n.id));
    if (removed.size === 0) return { nodes: graphNodes, edges: graphEdges };

    const beats = graphNodes.filter((n) => n.type === "flow.beat").map((n) => n.id);
    const bypass = createBypassEdges(beats, graphEdges, removed);

    return {
        nodes: graphNodes.filter((n) => !removed.has(n.id)),
        edges: [...graphEdges.filter((e) => !removed.has(e.source) && !removed.has(e.target)), ...bypass],
    };
}

/** A block comment that can never break out of the comment it sits in. */
function safeComment(text: string): string {
    return text.replace(/\*\//g, "* /").replace(/\/\*/g, "/ *");
}

/**
 * Turn each quest's group frames into a comment block near the top of the mod.
 *
 * A group's `label` and `comment` are the author's own structure ("Act 1 —
 * recon"). Emitting them as comments means somebody reading the mod with a
 * plain text editor — who does not use the Quest Mod Editor — can still follow
 * how the author laid the quest out. Notes are left out by default.
 */
function planningComments(quests: ProjectDocument["quests"]): string {
    const blocks: string[] = [];
    for (const quest of quests) {
        const groups = quest.graph.nodes.filter((n) => n.type === "layout.group");
        if (groups.length === 0) continue;
        const lines = groups.map((g) => {
            const d = g.data as { label?: string; comment?: string };
            const label = d.label?.trim() || "Group";
            const comment = d.comment?.trim();
            return comment ? `   [Group] ${label}: ${safeComment(comment)}` : `   [Group] ${label}`;
        });
        blocks.push(
            [
                `/* ── "${safeComment(quest.name)}" — planning notes ────────`,
                ...lines,
                `──────────────────────────────────────────────────────── */`,
            ].join("\n"),
        );
    }
    return blocks.join("\n\n");
}

/**
 * Stamped into the header comment of every exported mod. When a bug report
 * arrives with a mod zip, grepping dist/mod.js for this build id instantly
 * tells whether the export was made with the current editor or a stale
 * browser tab / local checkout (the round-21 crash hunt was ambiguous
 * exactly because of this).
 */
export const EDITOR_BUILD = "2026-09-13.r139";

/** A file in the compiled mod folder, with its content as text or base64. */
export interface CompiledFile {
    path: string;
    content: string;
    /** Content is base64 (binary asset) rather than plain text. */
    base64?: boolean;
}

/** Turn an embedded data-URL image into a zip-ready binary file entry. */
function imageAsset(dataUrl: string | undefined, name: string): { file: CompiledFile; path: string } | null {
    const m = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl ?? "");
    if (!m) return null;
    const ext = m[1] === "jpeg" ? "jpg" : "png";
    const path = `assets/${name}.${ext}`;
    return { file: { path, content: m[2], base64: true }, path };
}

/** The result of compiling a project: the mod's files, computed permissions, and author-facing warnings. */
export interface CompileResult {
    files: CompiledFile[];
    permissions: string[];
    warnings: string[];
}

/* ── Permissions ───────────────────────────────────────────────────────── */

/**
 * Tokens the author typed into text somewhere in the project. `{{player.ip}}`
 * is a `Network.getPlayerIp()` call at runtime, and the loader refuses an API
 * whose permission is not declared — so a token has to earn its permission the
 * same way a node does.
 */
function tokenPermissions(project: ProjectDocument): string[] {
    const text = JSON.stringify(project);
    const perms: string[] = [];
    if (text.includes("player.ip") || text.includes("random.ip")) perms.push("network");
    if (text.includes("player.email")) perms.push("mail");
    if (text.includes("player.username")) perms.push("shell");
    return perms;
}

/** Declarative permission map — one entry per node type (AR3, AR17, A3). */
const PERMISSIONS_BY_NODE_TYPE: Record<string, string[]> = {
    "world.network": ["network"],
    "world.wifi": ["network"],
    "world.domain": ["network"],
    "world.database": ["network"],
    "world.files": ["filesystem", "network"],
    "world.toolResponse": ["shell"],
    "fx.shell": ["shell"],
    "reply.input": ["shell"],
    "trigger.event": ["events"],
    "fx.claimQuest": ["events"],
    "fx.pay": ["bank"],
    "fx.withdraw": ["bank"],
    "fx.notify": ["ui"],
};

/** Permissions implied by a pack.node's declarative emitter. */
function permissionsForPackNode(data: {
    emitter?: string;
    steps?: { call?: string }[];
}): string[] {
    const perms: string[] = [];
    switch (data.emitter) {
        case "emit":
            perms.push("events");
            break;
        case "commandData":
            perms.push("shell");
            break;
        case "storage":
            break;
        case "sdk": {
            for (const step of data.steps ?? []) {
                const call = String(step.call ?? "");
                if (call.startsWith("Events.")) perms.push("events");
                if (call.startsWith("Shell.")) perms.push("shell");
                if (call.startsWith("Network.") || call.startsWith("Database.")) perms.push("network");
                if (call.startsWith("Mail.")) perms.push("mail");
                if (call.startsWith("Bank.")) perms.push("bank");
                if (call.startsWith("UI.")) perms.push("ui");
                if (call.startsWith("Files.")) perms.push("filesystem");
            }
            break;
        }
        default:
            break;
    }
    return perms;
}

/** Permissions implied by a dialogue node's kind and messages. */
function permissionsForDialogueNode(data: {
    kind?: string;
    kisscord?: { messages?: { playerAction?: string }[] };
    weechat?: { messages?: { playerAction?: string }[] };
}): string[] {
    const perms: string[] = [];
    if (data.kind === "mail") perms.push("mail");
    if (data.kind === "kisscord" || data.kind === "weechat") {
        const msgs = (data.kisscord?.messages ?? data.weechat?.messages ?? []) as {
            playerAction?: string;
        }[];
        if (msgs.some((m) => m.playerAction === "input")) perms.push("shell");
    }
    return perms;
}

/**
 * Compute the least-privilege permission set the exported mod needs: tokens
 * the author typed, permissions each node type declares, and per-node-data
 * inference (pack steps, dialogue kinds, dialog input).  Never widened beyond
 * what the graph actually uses (AR17).
 */
export function computePermissions(project: ProjectDocument): string[] {
    const perms = new Set<string>();
    for (const p of tokenPermissions(project)) perms.add(p);

    const nodes = project.quests.flatMap((q) => q.graph.nodes);
    for (const n of nodes) {
        const mapped = PERMISSIONS_BY_NODE_TYPE[n.type];
        if (mapped) {
            for (const p of mapped) perms.add(p);
        }

        if (n.type === "pack.node") {
            for (const p of permissionsForPackNode(n.data as never)) perms.add(p);
        }

        if (n.type === "comms.dialogue") {
            for (const p of permissionsForDialogueNode(n.data as never)) perms.add(p);
        }
    }

    if (project.quests.some((q) => q.dialog.some((b) => b.lines.some((l) => l.input)))) {
        perms.add("shell");
    }
    return [...perms];
}

/* ── Pack honesty ──────────────────────────────────────────────────────── */

/** Collect one pack usage into the map (A3 DRY). */
function collectPackMod(
    packMods: Map<string, string>,
    data: { packName?: string; gameModName?: string; storageKey?: string; nodeId?: string },
    requireKey: "storageKey" | "nodeId",
): void {
    if (data[requireKey] && data.packName && data.gameModName && !packMods.has(data.packName)) {
        packMods.set(data.packName, data.gameModName);
    }
}

/** The community packs this project hands data to: pack name -> the game
    mod its quests require on the player's machine. Shared by the warnings
    and the export stamp. */
export function packModsUsed(project: ProjectDocument): Map<string, string> {
    const packMods = new Map<string, string>();
    for (const q of project.quests) {
        for (const n of q.graph.nodes) {
            const d = n.data as { packName?: string; gameModName?: string; storageKey?: string; nodeId?: string };
            if (n.type === "world.packData") collectPackMod(packMods, d, "storageKey");
            if (n.type === "pack.node") collectPackMod(packMods, d, "nodeId");
        }
    }
    return packMods;
}

/* ── Warnings — split into focused helpers (F1, F2) ────────────────────── */

function warnUnstartableQuests(project: ProjectDocument): string[] {
    const warnings: string[] = [];
    const claimed = new Set<string>();
    for (const q of project.quests) {
        for (const n of q.graph.nodes) {
            if (n.type === "fx.claimQuest") {
                const name = (n.data as { questName?: string }).questName;
                if (name) claimed.add(name);
            }
        }
    }
    for (const q of project.quests) {
        if (!q.autoStart && !claimed.has(q.name)) {
            warnings.push(
                q.hackhubPost
                    ? `${q.title || q.name}: the player claims this one from its Hackhub feed post — nothing in it runs until they do. Turn on “Start automatically” in the quest's Behaviour settings if it should begin the moment the mod loads.`
                    : `${q.title || q.name}: nothing can start this quest. It does not start automatically and it is not advertised on the Hackhub feed, so the player has no way to claim it. Turn on “Start automatically” in the quest's Behaviour settings, or give it a feed post.`,
            );
        }
    }
    return warnings;
}

function warnFirewallAndPort(project: ProjectDocument): string[] {
    const warnings: string[] = [];
    for (const q of project.quests) {
        for (const n of q.graph.nodes) {
            if (n.type !== "world.firewall" && n.type !== "world.port") continue;
            if (!(n.data as { ip?: string }).ip) {
                warnings.push(
                    `${q.name}: a “${n.type === "world.port" ? "Change port" : "Add firewall rule"}” node has no device IP, so it has nothing to act on. Point it at a machine one of your network nodes created.`,
                );
            }
        }
    }
    return warnings;
}

type DeviceNode = {
    ip?: string;
    name?: string;
    type?: string;
    domainName?: string;
    children?: unknown[];
    rules?: unknown[];
    users?: unknown[];
    ports?: { external?: number; active?: boolean; service?: string; version?: string }[];
};

/** Services the game treats as login-protected (A8). */
const LOGIN_SERVICES = ["ssh", "ftp", "telnet", "mysql", "rdp", "smb", "vnc"];

/** Walk a device tree collecting structural issues: orphaned children, stray rules, domain names. */
function walkDeviceStructure(root: DeviceNode): { orphans: string[]; strays: string[]; domains: string[] } {
    const orphans: string[] = [];
    const strays: string[] = [];
    const domains: string[] = [];
    const walk = (d: DeviceNode) => {
        const kind = String(d.type ?? "").toUpperCase();
        const holds = kind === "ROUTER" || kind === "SPLITTER";
        const label = d.name || d.ip || "a device";
        if (!holds && (d.children as unknown[])?.length) orphans.push(`${label} (${kind || "no type"})`);
        if (kind !== "FIREWALL" && (d.rules as unknown[])?.length) strays.push(`${label} (${kind || "no type"})`);
        if (d.domainName) domains.push(d.domainName);
        (d.children ?? []).forEach((c) => walk(c as DeviceNode));
    };
    walk(root);
    return { orphans, strays, domains };
}

/** Find devices with an open login service but no user accounts. */
function findLoginlessDevices(root: DeviceNode): string[] {
    const loginless: string[] = [];
    const walk = (dv: DeviceNode) => {
        const kind = String(dv.type ?? "").toUpperCase();
        if (kind !== "SPLITTER" && kind !== "FIREWALL") {
            const open = (dv.ports ?? []).filter(
                (pt) => pt.active !== false && LOGIN_SERVICES.includes(String(pt.service ?? "").toLowerCase()),
            );
            if (open.length && !(dv.users ?? []).length) {
                loginless.push(`${dv.name || dv.ip || "a device"} (port ${open.map((pt) => pt.external).join(", ")})`);
            }
        }
        (dv.children ?? []).forEach((c) => walk(c as DeviceNode));
    };
    walk(root);
    return loginless;
}

/** Find port version strings that metasploit will reject (letters or fewer than three numbers). */
function findBadPortVersions(root: DeviceNode): string[] {
    const bad: string[] = [];
    const walk = (dv: DeviceNode) => {
        for (const port of dv.ports ?? []) {
            const v = String(port.version ?? "").trim();
            if (!v) continue;
            const num = v.replace(/^[^0-9]*/, "");
            if (!num) continue;
            const parts = num.split(".");
            const where = `${dv.name || dv.ip || "a device"} port ${port.external ?? "?"}`;
            if (/[A-Za-z]/.test(num)) {
                bad.push(`${where} ("${v}") has a letter in the version number`);
            } else if (parts.length < 3) {
                bad.push(`${where} ("${v}") has only ${parts.length === 1 ? "one number" : "two numbers"}`);
            }
        }
        (dv.children ?? []).forEach((c) => walk(c as DeviceNode));
    };
    walk(root);
    return bad;
}

function warnNetworkStructure(project: ProjectDocument): string[] {
    const warnings: string[] = [];
    for (const q of project.quests) {
        for (const n of q.graph.nodes) {
            if (n.type !== "world.network") continue;
            const device = (n.data as { device?: DeviceNode }).device ?? {};

            const { orphans, strays, domains } = walkDeviceStructure(device);
            if (domains.length) {
                warnings.push(
                    `${q.name}: this network claims the domain ${domains.map((d) => `“${d}”`).join(", ")}. Domain names are shared with the whole game, so if the base game or another installed mod already uses one, that one wins and your server will not answer to it. A name nobody else is likely to pick — something tied to your own story — is the safest choice.`,
                );
            }
            if (orphans.length) {
                warnings.push(
                    `${q.name}: ${orphans.join(", ")} has machines behind it, but only a router or a splitter can hold other machines — those machines will not be built. Change the type to Router or Splitter, or move them.`,
                );
            }
            if (strays.length) {
                warnings.push(
                    `${q.name}: ${strays.join(", ")} carries firewall rules, but only a firewall device enforces them — they will be ignored. Put the rules on a Firewall device in front of the machine you want to protect.`,
                );
            }

            const loginless = findLoginlessDevices(device);
            if (loginless.length) {
                warnings.push(
                    `${q.name}: ${loginless.join(", ")} has a login service open but no user accounts, so the player cannot break in — metasploit reports “Attack failed. Port 22 could not be accessed.” Add a user to the device, or close the port.`,
                );
            }

            const badVersions = findBadPortVersions(device);
            if (badVersions.length) {
                warnings.push(
                    `${q.name}: ${badVersions.join("; ")}. metasploit needs three numbers (for example "OpenSSH 7.2.0") — it rejects anything else with “Invalid version for option: Version”, and the player cannot run the exploit at all.`,
                );
            }
        }
    }
    return warnings;
}

function warnToolResponse(project: ProjectDocument): string[] {
    const warnings: string[] = [];
    for (const q of project.quests) {
        for (const n of q.graph.nodes) {
            if (n.type !== "world.toolResponse") continue;
            const d = n.data as { command?: string; dataText?: string };
            if (d.command === "lynx" && d.dataText) {
                const handles = d.dataText.match(/(^|\s)@[A-Za-z0-9_]{2,}/g);
                if (handles) {
                    warnings.push(
                        `${q.name}: the lynx result advertises ${handles.map((h) => h.trim()).join(", ")}. ` +
                            `Searching a social handle that has no profile behind it crashes the game and corrupts the player's save, ` +
                            `and this build of the SDK cannot create one. Remove the handle, or point the player at something that exists — a website, an e-mail address, an IP.`,
                    );
                }
            }
        }
    }
    return warnings;
}

function warnHandbook(project: ProjectDocument): string[] {
    const warnings: string[] = [];
    for (const q of project.quests) {
        for (const n of q.graph.nodes) {
            if (n.type !== "fx.handbook") continue;
            const article = (n.data as { articleId?: string }).articleId?.trim();
            if (!article) {
                warnings.push(
                    `${q.name}: an “Open handbook” node has no article, so it does nothing. Pick the article the player should land on.`,
                );
            }
        }
    }
    return warnings;
}

function warnWifi(project: ProjectDocument): string[] {
    const warnings: string[] = [];
    for (const q of project.quests) {
        for (const n of q.graph.nodes) {
            if (n.type !== "world.wifi") continue;
            warnings.push(
                `${q.name}: the mod SDK (0.21.0) cannot create wireless networks yet — “Create Wi-Fi” exports as a regular router network the player reaches by IP, not through the in-game Wi-Fi list.`,
            );
        }
    }
    return warnings;
}

/** Warn about a single dialogue node's kind-specific issues (F1: one job per helper). */
function warnDialogueNode(
    questName: string,
    node: NodeDoc,
    hasInput: boolean,
    isWired: boolean,
): string[] {
    const warnings: string[] = [];
    const d = node.data as {
        kind: string;
        mail?: { replyable?: boolean; subject?: string };
        kisscord?: { messages?: { playerAction?: string }[] };
    };
    if (d.kind === "mail" && d.mail?.replyable) {
        warnings.push(
            `${questName}: “${d.mail.subject || "a mail"}” lets the player reply, so it is sent through Quest.sendMail — the only path that carries a reply flag. If the Reply button does not appear in game, turn the setting off and give the player a hackertyper reply page instead, which is the route the other templates use.`,
        );
    }
    if (d.kind === "phone" && hasInput) {
        warnings.push(
            `${questName}: phone lines with typed answers also register a terminal command (qe-…) the player uses to answer.`,
        );
    }
    const live = (node.data as { postLive?: boolean }).postLive === true;
    if (live && (d.kind === "kisscord" || d.kind === "weechat")) {
        warnings.push(
            isWired
                ? `${questName}: a conversation set to “play when the story reaches this node” is sent live at that moment. Player replies, uploads and “unlocks after” steps are skipped, and the game does not remove live messages with the quest.`
                : `${questName}: a conversation is set to “play when the story reaches this node” but nothing is wired into it — it stays a normal quest conversation.`,
        );
    }
    if (d.kind === "kisscord" && d.kisscord?.messages?.some((m) => m.playerAction === "upload")) {
        warnings.push(`${questName}: Kisscord uploads compile to a “[uploaded file …]” message.`);
    }
    return warnings;
}

function warnDialogue(project: ProjectDocument): string[] {
    const warnings: string[] = [];
    for (const q of project.quests) {
        const hasInput = q.dialog.some((b) => b.lines.some((l) => l.input));
        for (const n of q.graph.nodes) {
            if (n.type !== "comms.dialogue") continue;
            const isWired = q.graph.edges.some((e) => e.kind === "flow" && e.target === n.id);
            warnings.push(...warnDialogueNode(q.name, n, hasInput, isWired));
        }
    }
    return warnings;
}

function warnCommunityNodes(project: ProjectDocument): string[] {
    const warnings: string[] = [];
    for (const q of project.quests) {
        for (const n of q.graph.nodes) {
            if (n.type === "world.packData") {
                const d = n.data as { packName?: string; storageKey?: string };
                if (!d.storageKey) {
                    warnings.push(
                        `${q.title || q.name}: a Community data node is not set up yet${d.packName ? ` (${d.packName})` : ""} — open the node and pick the pack and the data shape, or delete it. As it stands it does nothing.`,
                    );
                }
            }
            if (n.type === "pack.node") {
                const d = n.data as { packName?: string; nodeLabel?: string; nodeId?: string };
                if (!d.nodeId) {
                    warnings.push(
                        `${q.title || q.name}: a Community node is not set up yet${d.packName ? ` (${d.packName})` : ""} — add it again from the palette's Editor Mods group, or delete it. As it stands it does nothing.`,
                    );
                }
            }
        }
    }
    for (const [packName, gameModName] of packModsUsed(project)) {
        warnings.push(
            `${packName} community data is used in this quest. It needs the ${gameModName} game mod installed on the player's machine — say so in your quest description, or the player will not know why it does nothing.`,
        );
    }
    return warnings;
}

/** Placeholder domains the game ships as real sites — flagged so authors pick distinctive hosts (A8). */
const PLACEHOLDER_DOMAINS = /^(www\.)?(example\.(com|net|org)|test\.com|localhost)$/i;

/** Warn about per-website issues: unlisted pages, duplicate paths, slash-less paths. */
function warnWebsitePages(w: ProjectDocument["websites"][number]): string[] {
    const warnings: string[] = [];
    const hidden = w.pages.filter((p) => !p.seo);
    if (hidden.length) {
        warnings.push(
            `${w.host}: ${hidden.length} unlisted page${hidden.length > 1 ? "s" : ""} (${hidden.map((p) => p.path).join(", ")}). Nothing links to ${hidden.length > 1 ? "them" : "it"} and the in-game search will not show ${hidden.length > 1 ? "them" : "it"}, so the player reaches ${hidden.length > 1 ? "them" : "it"} only by typing the address or by running dirhunter on the host — which is exactly what makes a good hiding place for a clue. If you meant ${hidden.length > 1 ? "these" : "this"} to be findable normally, turn on “Listed in search” for the page.`,
        );
    }
    const seenPaths = new Map<string, number>();
    for (const p of w.pages) seenPaths.set(p.path, (seenPaths.get(p.path) ?? 0) + 1);
    for (const [path, count] of seenPaths) {
        if (count > 1) {
            warnings.push(
                `${w.host} has ${count} pages at the path ${path}. They ship as two definitions of the same address — give one of them a different path.`,
            );
        }
    }
    for (const p of w.pages) {
        if (p.path && !p.path.startsWith("/")) {
            warnings.push(
                `${w.host}: the page “${p.title || p.path}” has the path ${p.path}, but paths start at the host root — it should be /${p.path}. The in-game browser and dirhunter address pages from the root.`,
            );
        }
    }
    return warnings;
}

/** Warn about host-level issues: duplicate hosts and placeholder domains. */
function warnWebsiteHosts(websites: ProjectDocument["websites"]): string[] {
    const warnings: string[] = [];
    const hosts = new Map<string, number>();
    for (const w of websites) hosts.set(w.host, (hosts.get(w.host) ?? 0) + 1);
    for (const [host, count] of hosts) {
        if (count > 1) {
            warnings.push(
                `${host} is the host of ${count} websites in this mod. Domains are global — two sites on one host will fight over which one answers. Give each site its own distinctive host.`,
            );
        }
        if (PLACEHOLDER_DOMAINS.test(host)) {
            warnings.push(
                `${host} is a placeholder domain, but the export ships it as a real site any player can find (and another mod may already use it). Pick a distinctive host — read it like a domain you would type yourself.`,
            );
        }
    }
    return warnings;
}

function warnWebsites(project: ProjectDocument): string[] {
    return [
        ...project.websites.flatMap(warnWebsitePages),
        ...warnWebsiteHosts(project.websites),
    ];
}

/** Collect every author-facing warning the compiler can surface: unstartable quests, network structure issues, dialogue pitfalls, website problems, and community-node setup gaps. */
export function computeWarnings(project: ProjectDocument): string[] {
    return [
        ...warnUnstartableQuests(project),
        ...warnFirewallAndPort(project),
        ...warnNetworkStructure(project),
        ...warnToolResponse(project),
        ...warnHandbook(project),
        ...warnWifi(project),
        ...warnDialogue(project),
        ...warnCommunityNodes(project),
        ...warnWebsites(project),
    ];
}

/* ── Compile ───────────────────────────────────────────────────────────── */

function buildModJs(project: ProjectDocument, planningBlock: string): string {
    const PROJECT = {
        mod: project.mod,
        quests: project.quests.map((q) => ({
            name: q.name,
            title: q.title,
            description: q.description,
            icon: q.icon ?? null,
            group: q.group,
            rewards: q.rewards,
            employer: q.employer,
            autoStart: q.autoStart,
            autoComplete: q.autoComplete,
            abandonable: q.abandonable,
            hasCompleteButton: q.hasCompleteButton,
            hideObjectivesWhenDone: q.hideObjectivesWhenDone,
            closingObjectiveText: q.closingObjectiveText,
            questsToComplete: q.questsToComplete,
            maxClaim: q.maxClaim ?? null,
            maxClaimPerDay: q.maxClaimPerDay ?? null,
            hackhubPost: q.hackhubPost ?? null,
            dialog: q.dialog,
            graph: q.graph,
        })),
        websites: project.websites,
    };

    return [
        '"use strict";',
        `/* Generated by the HackHub Quest Mod Editor (build ${EDITOR_BUILD}). Edit the project, not this file. */`,
        ...(planningBlock ? [planningBlock] : []),
        'var sdk = require("@hotbunny/hackhub-content-sdk");',
        `var PROJECT = ${JSON.stringify(PROJECT)};`,
        `var __QE_BUILD = ${JSON.stringify(EDITOR_BUILD)};`,
        RUNTIME_SOURCE,
        "var __QE_MOD;",
        'module.exports = Object.defineProperty({ __esModule: true }, "default", {',
        '    get: function () { return __QE_MOD; },',
        '    enumerable: true,',
        '});',
        "__QE_MOD = __qeRegisterProject(sdk, PROJECT);",
        "",
    ].join("\n");
}

function buildManifest(project: ProjectDocument, permissions: string[], iconPath?: string, coverPath?: string) {
    return {
        id: project.mod.id,
        name: project.mod.name,
        version: project.mod.version,
        author: project.mod.author || "Quest Mod Editor",
        description: project.mod.description || `${project.mod.name} — built with the HackHub Quest Mod Editor`,
        apiVersion: project.mod.apiVersion,
        dependencies: project.mod.dependencies ?? [],
        permissions,
        ...(project.mod.tags.length ? { tags: project.mod.tags } : {}),
        ...(iconPath ? { icon: iconPath } : project.mod.icon ? { icon: project.mod.icon } : {}),
        ...(coverPath ? { cover: coverPath } : project.mod.cover ? { cover: project.mod.cover } : {}),
    };
}

function buildReadme(project: ProjectDocument, permissions: string[], warnings: string[]): string {
    return [
        `# ${project.mod.name}`,
        "",
        project.mod.description || "A HackHub quest mod built with the Quest Mod Editor.",
        "",
        "## Install (no coding needed)",
        "",
        "1. Copy this whole folder into the game's `mods/` directory.",
        "2. Start HackHub — the mod loads from `dist/mod.js`.",
        "",
        "## Rebuild (optional, for programmers)",
        "",
        "`src/index.ts` is the same code as `dist/mod.js`. With Node 18+:",
        "",
        "```",
        "npm install",
        "npm run build",
        "```",
        "",
        "## What the editor compiled for you",
        "",
        `- Quests: ${project.quests.map((q) => q.name).join(", ") || "none"}`,
        `- Websites: ${project.websites.map((w) => w.host).join(", ") || "none"}`,
        ...(packModsUsed(project).size
            ? [
                  `- Community tools: ${[...packModsUsed(project).keys()].join(", ")} — requires those game mods installed on the player's machine.`,
              ]
            : []),
        `- Permissions requested: ${permissions.join(", ") || "none"}`,
        "",
        "## Notes",
        "",
        ...(warnings.length ? warnings.map((w) => `- ${w}`) : ["- Everything compiled cleanly. Have fun."]),
        "",
    ].join("\n");
}

/** Build the npm/esbuild scaffolding files that let a power user rebuild from src/. */
function buildScaffoldingFiles(project: ProjectDocument): CompiledFile[] {
    const packageJson = {
        name: project.mod.id,
        version: project.mod.version,
        private: true,
        scripts: { build: "node esbuild.config.mjs" },
        devDependencies: { "@hotbunny/hackhub-content-sdk": "latest", esbuild: "^0.24.0" },
    };

    const esbuildConfig = [
        'import { build } from "esbuild";',
        "build({",
        '    entryPoints: ["src/index.ts"],',
        '    outfile: "dist/mod.js",',
        '    format: "cjs",',
        '    platform: "neutral",',
        '    target: "es2020",',
        '    external: ["@hotbunny/hackhub-content-sdk"],',
        "});",
        "",
    ].join("\n");

    const tsconfig = {
        compilerOptions: {
            target: "ES2020",
            module: "CommonJS",
            strict: true,
            experimentalDecorators: true,
            skipLibCheck: true,
        },
        include: ["src"],
    };

    return [
        { path: "package.json", content: JSON.stringify(packageJson, null, 2) + "\n" },
        { path: "esbuild.config.mjs", content: esbuildConfig },
        { path: "tsconfig.json", content: JSON.stringify(tsconfig, null, 2) + "\n" },
    ];
}

/**
 * Turn a project into a complete, build-free mod folder.
 *
 * Seeds remote files, strips furniture, computes permissions and warnings,
 * then assembles manifest.json, dist/mod.js, src/index.ts, README.md, and
 * the npm scaffolding a power user needs to rebuild from source.
 */
export function compileProject(project: ProjectDocument): CompileResult {
    const working: ProjectDocument = structuredClone(project);

    const seeded = working.quests.map((q) => ({ quest: q, result: seedRemoteFiles(q) }));
    const absorbed = new Set<string>();
    for (const { result } of seeded) for (const id of result.absorbed) absorbed.add(id);

    const permissions = computePermissions(working);
    const warnings = computeWarnings(working);

    for (const { quest, result } of seeded) {
        for (const { reason } of result.unplaced) {
            warnings.push(
                `${quest.name}: a “Place files” node could not be placed — ${reason}. ` +
                    "Point it at a device this quest creates, or target the player's PC instead.",
            );
        }
    }

    const compiledQuests = working.quests.map((q) => {
        const graph = {
            ...q.graph,
            nodes: q.graph.nodes.filter((n) => !absorbed.has(n.id)),
            edges: q.graph.edges,
        };
        const { nodes, edges } = stripFurniture(graph.nodes, graph.edges);
        return { q, graph: { ...graph, nodes, edges } };
    });

    const finalWorking: ProjectDocument = {
        ...working,
        quests: compiledQuests.map(({ q, graph }) => ({ ...q, graph })),
    };

    const planningBlock = planningComments(working.quests);
    const modJs = buildModJs(finalWorking, planningBlock);

    const iconAsset = imageAsset(project.mod.icon, "icon");
    const coverAsset = imageAsset(project.mod.cover, "cover");

    const manifest = buildManifest(project, permissions, iconAsset?.path, coverAsset?.path);
    const manifestJson = JSON.stringify(manifest, null, 4) + "\n";
    const readme = buildReadme(project, permissions, warnings);

    return {
        permissions,
        warnings,
        files: [
            { path: "manifest.json", content: manifestJson },
            { path: "dist/manifest.json", content: manifestJson },
            { path: "dist/mod.js", content: modJs },
            { path: "src/index.ts", content: modJs },
            { path: "README.md", content: readme },
            ...buildScaffoldingFiles(project),
            ...(iconAsset ? [iconAsset.file] : []),
            ...(coverAsset ? [coverAsset.file] : []),
        ],
    };
}
