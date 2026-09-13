/**
 * r151 target-matching warnings: a quest that hands work to an addon gets
 * told — at export and in dry runs — when its targets speak a language the
 * mod cannot match. Per quest, per pack, intent-gated; never cross-quest.
 */
import { describe, expect, it } from "vitest";
import { compileProject, computeWarnings } from "@/compiler/compile";
import { simulateProject } from "@/compiler/simulate";
import { warnTargetMatching } from "@/compiler/targetWarnings";
import { nodeTypeDef } from "@/schema/registry";
import { createProject, type ProjectDocument } from "@/schema/project";
import type { NodeDoc } from "@/schema/nodes";
import type { ToolPack } from "@/toolpacks/schema";

let seq = 0;
const nid = () => `n${++seq}`;

function node(type: Parameters<typeof nodeTypeDef>[0], patch: Record<string, unknown> = {}): NodeDoc {
    const data = { ...(nodeTypeDef(type).create() as object), ...patch };
    return { id: nid(), type, position: { x: 0, y: 0 }, data } as NodeDoc;
}

/** A narrow synthetic pack: http/ssh only, versions matter, RCE only. */
function testPack(patch: Record<string, unknown> = {}): ToolPack {
    return {
        format: 2,
        id: "test-pack",
        name: "Test Pack",
        author: "",
        version: "1.0.0",
        gameMod: { name: "TestMod" },
        events: [{ name: "TestMod.Tool.Fired", label: "tool fired", docs: "", fields: [] }],
        storage: [
            {
                id: "loot",
                label: "Loot",
                key: "test.loot",
                docs: "",
                merge: "replace" as const,
                fields: [],
                entry: {},
            },
        ],
        targetRules: {
            services: ["http", "ssh"],
            versionOnPorts: true,
            vulnsOnDomain: true,
            vulnTypes: ["RCE"],
            serviceAliases: { http: ["https", "web"] },
        },
        commandData: [],
        nodes: [
            {
                id: "close",
                label: "Close it",
                blurb: "",
                docs: "",
                emitter: "emit" as const,
                fields: [],
                merge: "replace" as const,
                eventName: "TestMod.Tool.Fired",
                payload: {},
            },
        ],
        ...patch,
    } as ToolPack;
}

function questProject(nodes: NodeDoc[]): ProjectDocument {
    const project = createProject();
    const quest = project.quests[0];
    quest.name = "heist";
    quest.title = "The Heist";
    quest.autoStart = true;
    quest.graph.nodes = [node("entry.start"), ...nodes];
    return project;
}

function networkNode(patch: Record<string, unknown> = {}): NodeDoc {
    return node("world.network", {
        device: {
            id: "r1",
            ip: "10.0.0.14",
            name: "office box",
            type: "DEVICE",
            ports: [{ id: "p1", external: 23, internal: 23, service: "telnet", version: "t1", active: true }],
            /* RCE by default so service/version tests don't also trip the weakness check. */
            vulnerabilities: [{ id: "v1", type: "RCE" }],
            users: [],
            children: [],
            rules: [],
            rootFiles: [],
            ...patch,
        },
    });
}

const intentTrigger = () => node("trigger.event", { event: "TestMod.Tool.Fired", conditions: [] });

describe("warnTargetMatching", () => {
    it("warns when a quest target runs a service the pack does not understand", () => {
        const project = questProject([intentTrigger(), networkNode()]);
        const warnings = warnTargetMatching(project, [testPack()]);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain("The Heist");
        expect(warnings[0]).toContain("telnet");
        expect(warnings[0]).toContain("port 23");
        expect(warnings[0]).toContain("Test Pack");
        expect(warnings[0]).toContain("http, ssh");
    });

    it("accepts canonical services, aliases, and any casing", () => {
        const project = questProject([
            intentTrigger(),
            networkNode({
                ports: [
                    { id: "p1", external: 80, internal: 80, service: "HTTP", version: "nginx 1.18", active: true },
                    { id: "p2", external: 443, internal: 443, service: "https", version: "nginx 1.18", active: true },
                    { id: "p3", external: 8080, internal: 8080, service: "WEB", version: "nginx 1.18", active: true },
                    { id: "p4", external: 22, internal: 22, service: "Ssh", version: "OpenSSH 8", active: true },
                ],
                vulnerabilities: [{ id: "v1", type: "RCE" }],
            }),
        ]);
        expect(warnTargetMatching(project, [testPack()])).toHaveLength(0);
    });

    it("stays silent without intent, however alien the targets", () => {
        const project = questProject([networkNode()]);
        expect(warnTargetMatching(project, [testPack()])).toHaveLength(0);
    });

    it("stays silent when no packs are loaded", () => {
        const project = questProject([intentTrigger(), networkNode()]);
        expect(warnTargetMatching(project, [])).toHaveLength(0);
        expect(computeWarnings(project).some((w) => w.includes("telnet"))).toBe(false);
    });

    it("fires on packData intent and on pack.node intent, not just triggers", () => {
        const viaData = questProject([
            node("world.packData", { packName: "Test Pack", storageKey: "test.loot" }),
            networkNode(),
        ]);
        expect(warnTargetMatching(viaData, [testPack()]).some((w) => w.includes("telnet"))).toBe(true);
        const viaNode = questProject([
            node("pack.node", { packName: "Test Pack", nodeId: "close" }),
            networkNode(),
        ]);
        expect(warnTargetMatching(viaNode, [testPack()]).some((w) => w.includes("telnet"))).toBe(true);
    });

    it("ignores intent tagged for a different pack", () => {
        const project = questProject([
            node("world.packData", { packName: "Some Other Pack", storageKey: "test.loot" }),
            networkNode(),
        ]);
        expect(warnTargetMatching(project, [testPack()])).toHaveLength(0);
    });

    it("warns once per distinct unknown service, not once per port", () => {
        const project = questProject([
            intentTrigger(),
            networkNode({
                ports: [
                    { id: "p1", external: 23, internal: 23, service: "telnet", version: "t1", active: true },
                    { id: "p2", external: 2323, internal: 2323, service: "TELNET", version: "t1", active: true },
                    { id: "p3", external: 111, internal: 111, service: "rpcbind", version: "r1", active: true },
                ],
                vulnerabilities: [{ id: "v1", type: "RCE" }],
            }),
        ]);
        const warnings = warnTargetMatching(project, [testPack()]);
        expect(warnings.filter((w) => w.includes("telnet") || w.includes("TELNET"))).toHaveLength(1);
        expect(warnings.filter((w) => w.includes("rpcbind"))).toHaveLength(1);
    });

    it("skips closed ports: inactive device ports and close/remove Change-port nodes", () => {
        const project = questProject([
            intentTrigger(),
            networkNode({
                ports: [{ id: "p1", external: 23, internal: 23, service: "telnet", version: "t1", active: false }],
                vulnerabilities: [{ id: "v1", type: "RCE" }],
            }),
            node("world.port", {
                ip: "10.0.0.14",
                action: "close",
                port: { id: "px", external: 111, internal: 111, service: "rpcbind", version: "r" },
            }),
        ]);
        expect(warnTargetMatching(project, [testPack()])).toHaveLength(0);
    });

    it("warns when a serviced port names no version, and stays silent when it does", () => {
        const blank = questProject([
            intentTrigger(),
            networkNode({
                ports: [{ id: "p1", external: 80, internal: 80, service: "http", version: "", active: true }],
                vulnerabilities: [{ id: "v1", type: "RCE" }],
            }),
        ]);
        const warnings = warnTargetMatching(blank, [testPack()]);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain("no version");
        expect(warnings[0]).toContain("Test Pack");
    });

    it("warns when none of the quest's weaknesses is one the pack looks for", () => {
        const project = questProject([
            intentTrigger(),
            networkNode({
                ports: [{ id: "p1", external: 80, internal: 80, service: "http", version: "nginx", active: true }],
                vulnerabilities: [{ id: "v1", type: "XSS" }],
            }),
        ]);
        const warnings = warnTargetMatching(project, [testPack()]);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain("XSS");
        expect(warnings[0]).toContain("RCE");
    });

    it("warns when the quest's targets name no weakness at all", () => {
        const project = questProject([
            intentTrigger(),
            networkNode({
                ports: [{ id: "p1", external: 80, internal: 80, service: "http", version: "nginx", active: true }],
                vulnerabilities: [],
            }),
        ]);
        const warnings = warnTargetMatching(project, [testPack()]);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain("None of this quest's targets");
    });

    it("stays silent for a pure-listener quest: intent but no targets at all", () => {
        const project = questProject([intentTrigger(), node("fx.notify", { message: "heard it" })]);
        expect(warnTargetMatching(project, [testPack()])).toHaveLength(0);
    });

    it("checks each quest only against the packs it uses", () => {
        const project = questProject([intentTrigger(), networkNode()]);
        /* Same-shaped pack, but nothing in the quest points at it. */
        const other = testPack({
            id: "other-pack",
            name: "Other Pack",
            events: [{ name: "OtherMod.Tool.Fired", label: "tool fired", docs: "", fields: [] }],
            storage: [],
            nodes: [],
        });
        const warnings = warnTargetMatching(project, [testPack(), other]);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain("Test Pack");
        expect(warnings[0]).not.toContain("Other Pack");
    });

    it("checks each quest on its own: a sibling quest's targets never leak in", () => {
        const project = questProject([intentTrigger()]);
        const second = createProject().quests[0];
        second.name = "setup";
        second.title = "Setup";
        second.autoStart = false;
        second.graph.nodes = [node("entry.start"), networkNode()];
        project.quests.push(second);
        /* The Heist has intent but no targets; Setup has targets but no intent. */
        expect(warnTargetMatching(project, [testPack()])).toHaveLength(0);
    });

    it("stays silent for packs without target rules", () => {
        const project = questProject([intentTrigger(), networkNode()]);
        const pack = testPack({ targetRules: undefined });
        expect(warnTargetMatching(project, [pack])).toHaveLength(0);
    });
});

describe("target warnings wiring", () => {
    it("compileProject carries them with packs and stays silent without", () => {
        const project = questProject([intentTrigger(), networkNode()]);
        const withPacks = compileProject(project, [testPack()]);
        expect(withPacks.warnings.some((w) => w.includes("telnet"))).toBe(true);
        const without = compileProject(project);
        expect(without.warnings.some((w) => w.includes("telnet"))).toBe(false);
    });

    it("simulateProject surfaces them in the dry-run report", async () => {
        const project = questProject([intentTrigger(), networkNode()]);
        const report = await simulateProject(project, [testPack()]);
        expect(report.warnings.some((w) => w.includes("telnet"))).toBe(true);
        const silent = await simulateProject(project);
        expect(silent.warnings.some((w) => w.includes("telnet"))).toBe(false);
    });
});
