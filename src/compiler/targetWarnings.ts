/**
 * Target-matching warnings (r151): does this quest's declared targets line up
 * with what a tool mod actually matches against?
 *
 * A quest "uses" a pack when it listens for one of the pack's events, hands
 * data to one of the pack's storage keys, or runs one of the pack's nodes.
 * For those quests only, the pack's `targetRules` are checked against the
 * quest's own targets — never across quests (multi-part campaigns set up in
 * one quest what another exploits, so cross-quest checks would cry wolf).
 *
 * The matching semantics mirror the example mod's verified behaviour:
 * services compare case-insensitively with alias expansion, versions are a
 * completeness check (the real match is a case-insensitive substring the
 * editor cannot reproduce), and weaknesses compare exactly.
 *
 * Pure module: no React, no DOM. Copy is written for non-coder gamers — no
 * event names, storage keys, or call names in the primary sentence.
 */
import type { ProjectDocument, QuestDoc } from "@/schema/project";
import type { ToolPack } from "@/toolpacks/schema";

/** A port the quest declares, plus words for where it lives. */
interface DeclaredPort {
    service: string;
    version: string;
    /** e.g. `port 23 on "office router" (10.0.0.1)`. */
    where: string;
}

interface QuestTargets {
    ports: DeclaredPort[];
    /** Distinct weakness types, exact SDK spelling. */
    vulns: string[];
    /** Declared targets that carry neither ports nor weaknesses (bare domains). */
    bareTargets: number;
}

type DeviceLike = {
    ip?: string;
    name?: string;
    ports?: { external?: number; active?: boolean; service?: string; version?: string }[];
    vulnerabilities?: { type?: string }[];
    children?: DeviceLike[];
};

function deviceLabel(device: DeviceLike): string {
    if (device.name) return `"${device.name}" (${device.ip || "no address yet"})`;
    return device.ip || "a device with no address yet";
}

function collectDevice(device: DeviceLike, ports: DeclaredPort[], vulns: Set<string>): void {
    for (const p of device.ports ?? []) {
        if (p.active === false) continue;
        ports.push({
            service: (p.service ?? "").trim(),
            version: (p.version ?? "").trim(),
            where: `port ${p.external ?? "?"} on ${deviceLabel(device)}`,
        });
    }
    for (const v of device.vulnerabilities ?? []) {
        if (v.type) vulns.add(v.type);
    }
    for (const child of device.children ?? []) collectDevice(child, ports, vulns);
}

function questTargets(quest: QuestDoc): QuestTargets {
    const ports: DeclaredPort[] = [];
    const vulns = new Set<string>();
    let bareTargets = 0;
    for (const n of quest.graph.nodes) {
        if (n.type === "world.network") {
            collectDevice((n.data as { device?: DeviceLike }).device ?? {}, ports, vulns);
        } else if (n.type === "world.port") {
            const d = n.data as { ip?: string; action?: string; port?: { external?: number; service?: string; version?: string } };
            if (d.action === "close" || d.action === "remove") continue;
            const port = d.port ?? {};
            ports.push({
                service: (port.service ?? "").trim(),
                version: (port.version ?? "").trim(),
                where: `port ${port.external ?? "?"} on ${d.ip || "its device"}`,
            });
        } else if (n.type === "world.domain") {
            const d = n.data as { domain?: string; vulnerabilities?: { type?: string }[] };
            const types = (d.vulnerabilities ?? []).map((v) => v.type).filter((t): t is string => !!t);
            if (types.length === 0) bareTargets += 1;
            for (const t of types) vulns.add(t);
        }
    }
    return { ports, vulns: [...vulns], bareTargets };
}

/** The node's pack tag must agree with the pack — when the node names one. */
function packTagMatches(packName: string | undefined, pack: ToolPack): boolean {
    return !packName || packName === pack.name || packName === pack.id;
}

function questUsesPack(quest: QuestDoc, pack: ToolPack): boolean {
    const events = new Set(pack.events.map((e) => e.name));
    const keys = new Set(pack.storage.map((s) => s.key));
    const nodeIds = new Set(pack.nodes.map((n) => n.id));
    for (const n of quest.graph.nodes) {
        if (n.type === "trigger.event") {
            if (events.has((n.data as { event?: string }).event ?? "")) return true;
        } else if (n.type === "world.packData") {
            const d = n.data as { packName?: string; storageKey?: string };
            if (d.storageKey && keys.has(d.storageKey) && packTagMatches(d.packName, pack)) return true;
        } else if (n.type === "pack.node") {
            const d = n.data as { packName?: string; nodeId?: string };
            if (d.nodeId && nodeIds.has(d.nodeId) && packTagMatches(d.packName, pack)) return true;
        }
    }
    return false;
}

function warnServices(questName: string, pack: ToolPack, ports: DeclaredPort[]): string[] {
    const services = pack.targetRules?.services ?? [];
    if (services.length === 0) return [];
    const accepted = new Set(services.map((s) => s.toLowerCase()));
    for (const [canon, aliases] of Object.entries(pack.targetRules?.serviceAliases ?? {})) {
        if (!accepted.has(canon.toLowerCase())) continue;
        for (const a of aliases) accepted.add(a.toLowerCase());
    }
    const seen = new Map<string, DeclaredPort>();
    for (const p of ports) {
        if (!p.service || accepted.has(p.service.toLowerCase()) || seen.has(p.service.toLowerCase())) continue;
        seen.set(p.service.toLowerCase(), p);
    }
    return [...seen.values()].map(
        (p) =>
            `${questName}: “${p.service}” on ${p.where} means nothing to ${pack.name} — its tools only understand ${services.join(", ")}. Change the service to one of those, or the tool will never match this target.`,
    );
}

function warnVersions(questName: string, pack: ToolPack, ports: DeclaredPort[]): string[] {
    if (!pack.targetRules?.versionOnPorts) return [];
    const blank = ports.filter((p) => p.service && !p.version);
    if (blank.length === 0) return [];
    const shown = blank.slice(0, 3).map((p) => p.where);
    const rest = blank.length > 3 ? `, and ${blank.length - 3} more` : "";
    return [
        `${questName}: ${shown.join("; ")}${rest} ${blank.length > 1 ? "have a service but no version" : "has a service but no version"} — ${pack.name} matches targets by their version string, so a blank version never lines up. Fill in whatever the machine reports.`,
    ];
}

function warnVulns(questName: string, pack: ToolPack, targets: QuestTargets): string[] {
    const rules = pack.targetRules;
    if (!rules?.vulnsOnDomain || rules.vulnTypes.length === 0) return [];
    if (targets.vulns.some((t) => rules.vulnTypes.includes(t))) return [];
    if (targets.vulns.length === 0) {
        return [
            `${questName}: ${pack.name} looks for targets with one of these weaknesses: ${rules.vulnTypes.join(", ")}. None of this quest's targets names one — mark the target's weakness, or the tool will never match.`,
        ];
    }
    return [
        `${questName}: this quest's targets are marked ${targets.vulns.join(", ")}, but ${pack.name} only looks for ${rules.vulnTypes.join(", ")} — none of them lines up. Mark one of the weaknesses the tool understands, or it will never match.`,
    ];
}

/**
 * Target-matching warnings for every (quest, pack) pair where the quest
 * shows intent toward the pack. Empty when no packs are loaded — the old
 * single-argument `computeWarnings(project)` call sites stay silent.
 */
export function warnTargetMatching(project: ProjectDocument, packs: ToolPack[]): string[] {
    if (packs.length === 0) return [];
    const warnings: string[] = [];
    for (const q of project.quests) {
        const questName = q.title || q.name;
        let targets: QuestTargets | null = null;
        for (const pack of packs) {
            if (!pack.targetRules || !questUsesPack(q, pack)) continue;
            targets ??= questTargets(q);
            if (targets.ports.length === 0 && targets.vulns.length === 0 && targets.bareTargets === 0) continue;
            warnings.push(...warnServices(questName, pack, targets.ports));
            warnings.push(...warnVersions(questName, pack, targets.ports));
            warnings.push(...warnVulns(questName, pack, targets));
        }
    }
    return warnings;
}
