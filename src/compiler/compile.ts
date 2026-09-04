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
import type { NodeDoc } from "@/schema/nodes";
import { RUNTIME_SOURCE } from "./runtimeSource";

/**
 * Stamped into the header comment of every exported mod. When a bug report
 * arrives with a mod zip, grepping dist/mod.js for this build id instantly
 * tells whether the export was made with the current editor or a stale
 * browser tab / local checkout (the round-21 crash hunt was ambiguous
 * exactly because of this).
 */
export const EDITOR_BUILD = "2026-09-04.r82";

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

export interface CompileResult {
    files: CompiledFile[];
    permissions: string[];
    warnings: string[];
}

const nodeType = (n: NodeDoc) => n.type;

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

export function computePermissions(project: ProjectDocument): string[] {
    const perms = new Set<string>();
    for (const p of tokenPermissions(project)) perms.add(p);
    const nodes = project.quests.flatMap((q) => q.graph.nodes);
    for (const n of nodes) {
        switch (nodeType(n)) {
            case "world.network":
            case "world.wifi":
            case "world.domain":
            case "world.database":
                perms.add("network");
                break;
            case "world.files":
                perms.add("filesystem");
                perms.add("network");
                break;
            case "world.toolResponse":
            case "fx.shell":
            case "reply.input":
                perms.add("shell");
                break;
            case "trigger.event":
            case "fx.claimQuest":
                perms.add("events");
                break;
            case "fx.pay":
            case "fx.withdraw":
                perms.add("bank");
                break;
            case "fx.notify":
                perms.add("ui");
                break;
            case "comms.dialogue": {
                const kind = (n.data as { kind: string }).kind;
                if (kind === "mail") perms.add("mail");
                if (kind === "kisscord" || kind === "weechat") {
                    const msgs = ((n.data as { kisscord?: { messages?: { playerAction?: string }[] }; weechat?: { messages?: { playerAction?: string }[] } }).kisscord?.messages ??
                        (n.data as { weechat?: { messages?: { playerAction?: string }[] } }).weechat?.messages) ?? [];
                    if (msgs.some((m) => m.playerAction === "input")) perms.add("shell");
                }
                break;
            }
            default:
                break;
        }
    }
    if (project.quests.some((q) => q.dialog.some((b) => b.lines.some((l) => l.input)))) perms.add("shell");
    return [...perms];
}

export function computeWarnings(project: ProjectDocument): string[] {
    const warnings: string[] = [];
    for (const q of project.quests) {
        if (!q.autoStart) {
            /* Without auto-start, the only way in is the Hackhub feed post that
               advertises the quest. With neither, the quest is in the mod and
               unreachable — worth saying outright rather than as a nicety. */
            warnings.push(
                q.hackhubPost
                    ? `${q.title || q.name}: the player claims this one from its Hackhub feed post — nothing in it runs until they do. Turn on “Start automatically” in the quest's Behaviour settings if it should begin the moment the mod loads.`
                    : `${q.title || q.name}: nothing can start this quest. It does not start automatically and it is not advertised on the Hackhub feed, so the player has no way to claim it. Turn on “Start automatically” in the quest's Behaviour settings, or give it a feed post.`,
            );
        }
        for (const n of q.graph.nodes) {
            switch (n.type) {
                case "world.files":
                    if ((n.data as { target?: string }).target !== "player") {
                        warnings.push(
                            `${q.name}: files for a remote device are placed in that device's own tree, under the user who owns them — a “Seed files” node pointed at a device exports as a note. Files on the player's own PC work as written.`,
                        );
                    }
                    break;
                case "world.firewall":
                case "world.port":
                    /* Both act on a machine that must already exist: the engine
                       has no rule to add and no port to open otherwise. */
                    if (!(n.data as { ip?: string }).ip) {
                        warnings.push(
                            `${q.name}: a “${n.type === "world.port" ? "Change port" : "Add firewall rule"}” node has no device IP, so it has nothing to act on. Point it at a machine one of your network nodes created.`,
                        );
                    }
                    break;
                case "world.network": {
                    /* The engine's device definition only lets a Router or a
                       Splitter hold other machines, and only a Firewall hold
                       rules. The editor only offers those fields on those
                       types, but a device retyped after it was filled in can
                       still be carrying them, and they would vanish at export
                       without a word. */
                    const orphans: string[] = [];
                    const strays: string[] = [];
                    const domains: string[] = [];
                    const walk = (d: {
                        ip?: string; name?: string; type?: string; domainName?: string;
                        children?: unknown[]; rules?: unknown[];
                    }) => {
                        const kind = String(d.type ?? "").toUpperCase();
                        const holds = kind === "ROUTER" || kind === "SPLITTER";
                        const label = d.name || d.ip || "a device";
                        if (!holds && d.children?.length) orphans.push(`${label} (${kind || "no type"})`);
                        if (kind !== "FIREWALL" && d.rules?.length) strays.push(`${label} (${kind || "no type"})`);
                        if (d.domainName) domains.push(d.domainName);
                        (d.children ?? []).forEach((c) => walk(c as Parameters<typeof walk>[0]));
                    };
                    walk((n.data as { device?: Parameters<typeof walk>[0] }).device ?? {});
                    /* A domain name is the one part of a network that is NOT
                       allocated per playthrough: the address is handed out by
                       the game, but the name is authored text and is identical
                       in every install. If the base game or another mod has
                       already registered it, theirs wins and this server never
                       answers to the name - and the mod deliberately will not
                       delete a registration it cannot prove it created (r76).
                       So the collision is the author's to avoid, which means
                       they have to be told it is possible. */
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
                    /* metasploit needs a three-part version. QA hit this with
                       "OpenSSH 7.2": the exploit's own Version option refuses
                       it ("Invalid version for option: Version") and the
                       player simply cannot finish the quest. Every port in the
                       working reference mod uses x.y.z, and metasploit's
                       default is 1.0.0. Letters are a separate, already-known
                       trap (7.2p2 stops it matching at all). */
                    /* A machine with a login service open but no users on it
                       cannot be broken into: metasploit runs, finds nobody to
                       authenticate as, and reports "Attack failed. Port 22
                       could not be accessed." QA lost a session to this on a
                       router whose users array was empty. Every SSH-reachable
                       device in the working reference mod carries a user. */
                    const LOGIN_SERVICES = ["ssh", "ftp", "telnet", "mysql", "rdp", "smb", "vnc"];
                    const loginless: string[] = [];
                    const findLoginless = (dv: {
                        ip?: string; name?: string; type?: string;
                        users?: unknown[]; ports?: { external?: number; active?: boolean; service?: string }[];
                        children?: unknown[];
                    }) => {
                        const kind = String(dv.type ?? "").toUpperCase();
                        /* Splitters and firewalls are plumbing: nobody logs into them. */
                        if (kind !== "SPLITTER" && kind !== "FIREWALL") {
                            const open = (dv.ports ?? []).filter(
                                (pt) => pt.active !== false && LOGIN_SERVICES.includes(String(pt.service ?? "").toLowerCase()),
                            );
                            if (open.length && !(dv.users ?? []).length) {
                                loginless.push(
                                    `${dv.name || dv.ip || "a device"} (port ${open.map((pt) => pt.external).join(", ")})`,
                                );
                            }
                        }
                        (dv.children ?? []).forEach((c) => findLoginless(c as Parameters<typeof findLoginless>[0]));
                    };
                    findLoginless((n.data as { device?: Parameters<typeof findLoginless>[0] }).device ?? {});
                    if (loginless.length) {
                        warnings.push(
                            `${q.name}: ${loginless.join(", ")} has a login service open but no user accounts, so the player cannot break in — metasploit reports “Attack failed. Port 22 could not be accessed.” Add a user to the device, or close the port.`,
                        );
                    }

                    const badVersions: string[] = [];
                    const checkPorts = (dv: { ip?: string; name?: string; ports?: { external?: number; version?: string }[]; children?: unknown[] }) => {
                        for (const port of dv.ports ?? []) {
                            const v = String(port.version ?? "").trim();
                            if (!v) continue;
                            const num = v.replace(/^[^0-9]*/, "");
                            if (!num) continue;
                            const parts = num.split(".");
                            const where = `${dv.name || dv.ip || "a device"} port ${port.external ?? "?"}`;
                            if (/[A-Za-z]/.test(num)) {
                                badVersions.push(`${where} ("${v}") has a letter in the version number`);
                            } else if (parts.length < 3) {
                                badVersions.push(`${where} ("${v}") has only ${parts.length === 1 ? "one number" : "two numbers"}`);
                            }
                        }
                        (dv.children ?? []).forEach((c) => checkPorts(c as Parameters<typeof checkPorts>[0]));
                    };
                    checkPorts((n.data as { device?: Parameters<typeof checkPorts>[0] }).device ?? {});
                    if (badVersions.length) {
                        warnings.push(
                            `${q.name}: ${badVersions.join("; ")}. metasploit needs three numbers (for example "OpenSSH 7.2.0") — it rejects anything else with “Invalid version for option: Version”, and the player cannot run the exploit at all.`,
                        );
                    }
                    break;
                }
                case "world.toolResponse": {
                    /* A social handle in lynx output is a lead the player will
                       follow. The built-in Twotter search crashes on a handle
                       no profile backs - it reads a field off the missing
                       profile - and takes the save file with it. This build's
                       SDK cannot create a Twotter profile, so any handle an
                       author writes here is one that does not exist. */
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
                    break;
                }
                case "fx.handbook":
                    warnings.push(`${q.name}: handbook nodes are not compiled yet.`);
                    break;
                case "world.wifi":
                    warnings.push(
                        `${q.name}: the mod SDK (0.21.0) cannot create wireless networks yet — “Create Wi-Fi” exports as a regular router network the player reaches by IP, not through the in-game Wi-Fi list.`,
                    );
                    break;
                case "comms.dialogue": {
                    const d = n.data as { kind: string; phone?: { branch?: string }; kisscord?: { messages?: { playerAction?: string; input?: { expected?: string } }[] }; weechat?: { messages?: { playerAction?: string } } };
                    /* A replyable mail has to go out through Quest.sendMail:
                       MailDefinition, which Mail.send takes, has no reply flag
                       at all, and QuestMailDefinition is the only shape that
                       does. That path is less proven than Mail.send, so say so
                       rather than letting an author discover it in game. */
                    const mail = (n.data as { mail?: { replyable?: boolean; subject?: string } }).mail;
                    if (d.kind === "mail" && mail?.replyable) {
                        warnings.push(
                            `${q.name}: “${mail.subject || "a mail"}” lets the player reply, so it is sent through Quest.sendMail — the only path that carries a reply flag. If the Reply button does not appear in game, turn the setting off and give the player a hackertyper reply page instead, which is the route the other templates use.`,
                        );
                    }
                    if (d.kind === "phone" && q.dialog.some((b) => b.lines.some((l) => l.input))) {
                        warnings.push(
                            `${q.name}: phone lines with typed answers also register a terminal command (qe-…) the player uses to answer.`,
                        );
                    }
                    const live = (n.data as { postLive?: boolean }).postLive === true;
                    const wired = q.graph.edges.some((e) => e.kind === "flow" && e.target === n.id);
                    if (live && (d.kind === "kisscord" || d.kind === "weechat")) {
                        if (!wired) {
                            warnings.push(
                                `${q.name}: a conversation is set to “play when the story reaches this node” but nothing is wired into it — it stays a normal quest conversation.`,
                            );
                        } else {
                            warnings.push(
                                `${q.name}: a conversation set to “play when the story reaches this node” is sent live at that moment. Player replies, uploads and “unlocks after” steps are skipped, and the game does not remove live messages with the quest.`,
                            );
                        }
                    }
                    if (d.kind === "kisscord" && d.kisscord?.messages?.some((m) => m.playerAction === "upload")) {
                        warnings.push(`${q.name}: Kisscord uploads compile to a “[uploaded file …]” message.`);
                    }
                    break;
                }
                default:
                    break;
            }
        }
    }
    for (const w of project.websites) {
        const hidden = w.pages.filter((p) => !p.seo);
        if (hidden.length) {
            warnings.push(
                `${w.host}: ${hidden.length} unlisted page${hidden.length > 1 ? "s" : ""} (${hidden.map((p) => p.path).join(", ")}). Nothing links to ${hidden.length > 1 ? "them" : "it"} and the in-game search will not show ${hidden.length > 1 ? "them" : "it"}, so the player reaches ${hidden.length > 1 ? "them" : "it"} only by typing the address or by running dirhunter on the host — which is exactly what makes a good hiding place for a clue. If you meant ${hidden.length > 1 ? "these" : "this"} to be findable normally, turn on “Listed in search” for the page.`,
            );
        }
    }
    return warnings;
}

export function compileProject(project: ProjectDocument): CompileResult {
    const permissions = computePermissions(project);
    const warnings = computeWarnings(project);

    const compiledQuests = project.quests.map((q) => ({ q, graph: q.graph }));

    const PROJECT = {
        mod: project.mod,
        quests: compiledQuests.map(({ q, graph }) => ({
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
            graph,
        })),
        websites: project.websites,
    };

    const modJs = [
        '"use strict";',
            `/* Generated by the HackHub Quest Mod Editor (build ${EDITOR_BUILD}). Edit the project, not this file. */`,
        'var sdk = require("@hotbunny/hackhub-content-sdk");',
        `var PROJECT = ${JSON.stringify(PROJECT)};`,
        `var __QE_BUILD = ${JSON.stringify(EDITOR_BUILD)};`,
        RUNTIME_SOURCE,
        /* The loader looks for the Bootstrap class on the module's default
           export, the way every hand-written mod produces it (esbuild emits
           `module.exports = __toCommonJS({ default: MyMod })` from
           `export default class ... extends Bootstrap`). Calling
           RegisterModPackage alone is not enough: a mod that never exports
           its package class is skipped in silence - no banner, no error, and
           none of its quests ever run. QA hit exactly that.

           The SHAPE and the ORDER both matter, and this is what cost rounds
           35-41. esbuild installs `module.exports` as a LAZY GETTER at the very
           top of the bundle, before a single class is registered:

               module.exports = __toCommonJS({ default: () => MyMod });
               ... 3500 lines ...
               MyMod = __decorateClass([RegisterModPackage], MyMod);

           The loader reads `module.exports.default` to learn which mod it is
           loading, and it does that BEFORE the registration calls take effect.
           We were assigning a plain object at the END, after every
           RegisterQuest/RegisterWebsite/RegisterCommand call had already run -
           so at registration time the loader had no mod bound, every call was
           attributed to `Mod "null"`, and the permission check that follows had
           no manifest to check against. The log said as much on every run:

               Mod "null" tried to use Network.createSubnetNetwork without
               "network" permission.

           ...even though manifest.json declared it. Matching esbuild exactly -
           getter first, registration after - is what makes the mod identify
           itself. */
        "var __QE_MOD;",
        "module.exports = Object.defineProperty({ __esModule: true }, \"default\", {",
        "    get: function () { return __QE_MOD; },",
        "    enumerable: true,",
        "});",
        "__QE_MOD = __qeRegisterProject(sdk, PROJECT);",
        "",
    ].join("\n");

    /* Cover/icon: decode the embedded images into real files and reference
       them by path in the manifest, as the game expects. A plain file name
       typed into the field (old drafts) is passed through untouched. */
    const iconAsset = imageAsset(project.mod.icon, "icon");
    const coverAsset = imageAsset(project.mod.cover, "cover");

    const manifest = {
        id: project.mod.id,
        name: project.mod.name,
        version: project.mod.version,
        author: project.mod.author || "Quest Mod Editor",
        description: project.mod.description || `${project.mod.name} — built with the HackHub Quest Mod Editor`,
        apiVersion: project.mod.apiVersion,
        /* Declared even when empty: the working reference mod ships it, and
           ModManifest lists it. */
        dependencies: project.mod.dependencies ?? [],
        permissions,
        ...(project.mod.tags.length ? { tags: project.mod.tags } : {}),
        ...(iconAsset ? { icon: iconAsset.path } : project.mod.icon ? { icon: project.mod.icon } : {}),
        ...(coverAsset ? { cover: coverAsset.path } : project.mod.cover ? { cover: project.mod.cover } : {}),
    };

    const manifestJson = JSON.stringify(manifest, null, 4) + "\n";

    const readme = [
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
        `- Permissions requested: ${permissions.join(", ") || "none"}`,
        "",
        "## Notes",
        "",
        ...(warnings.length ? warnings.map((w) => `- ${w}`) : ["- Everything compiled cleanly. Have fun."]),
        "",
    ].join("\n");

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

    return {
        permissions,
        warnings,
        files: [
            { path: "manifest.json", content: manifestJson },
            /* The loader reads the manifest that sits NEXT TO the bundle it
               loads, not the one at the project root. The SDK's own build
               script does this for you - prepareDist() in
               @hotbunny/hackhub-content-sdk/build.mjs copies manifest.json
               into dist/ before bundling - and a hand-built mod that works
               in-game (Nemesis) ships manifest.json and mod.js side by side.
               We wrote the manifest only at the root, so the game loaded the
               bundle with no manifest attached: the mod had no name ("Mod
               \"null\"" in the log) and therefore no permissions, and every
               call to Network/Shell/Mail was refused. Ship both copies. */
            { path: "dist/manifest.json", content: manifestJson },
            { path: "dist/mod.js", content: modJs },
            { path: "src/index.ts", content: modJs },
            { path: "README.md", content: readme },
            { path: "package.json", content: JSON.stringify(packageJson, null, 2) + "\n" },
            { path: "esbuild.config.mjs", content: esbuildConfig },
            { path: "tsconfig.json", content: JSON.stringify(tsconfig, null, 2) + "\n" },
            ...(iconAsset ? [iconAsset.file] : []),
            ...(coverAsset ? [coverAsset.file] : []),
        ],
    };
}
