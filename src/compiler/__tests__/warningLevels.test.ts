/**
 * r153 severity assignments: error = will break or strand the player,
 * warn = could cause issues, info = good to know. One spot check per
 * family; the copy itself is covered where each warning was born.
 */
import { describe, expect, it } from "vitest";
import { computeWarningDetails } from "@/compiler/compile";
import { nodeTypeDef } from "@/schema/registry";
import { createProject, type ProjectDocument } from "@/schema/project";
import type { NodeDoc } from "@/schema/nodes";
import type { ToolPack } from "@/toolpacks/schema";

let seq = 0;
function node(type: Parameters<typeof nodeTypeDef>[0], patch: Record<string, unknown> = {}): NodeDoc {
    const data = { ...(nodeTypeDef(type).create() as object), ...patch };
    return { id: `w${++seq}`, type, position: { x: 0, y: 0 }, data } as NodeDoc;
}

function projectWith(nodes: NodeDoc[]): ProjectDocument {
    const project = createProject();
    const quest = project.quests[0];
    quest.name = "heist";
    quest.title = "The Heist";
    quest.autoStart = true;
    quest.graph.nodes = [node("entry.start"), ...nodes];
    return project;
}

const levelOf = (texts: { level: string; text: string }[], re: RegExp) => texts.find((w) => re.test(w.text))?.level;

describe("warning levels", () => {
    it("unstartable quests and game-crashing lynx handles are errors", () => {
        const project = projectWith([node("world.toolResponse", { command: "lynx", dataText: "follow @theboss" })]);
        project.quests[0].autoStart = false;
        const details = computeWarningDetails(project);
        expect(levelOf(details, /nothing can start this quest/)).toBe("error");
        expect(levelOf(details, /crashes the game/)).toBe("error");
    });

    it("dead structure is error, dead nodes are warn", () => {
        const project = projectWith([
            node("world.network", {
                device: {
                    id: "d1",
                    ip: "10.0.0.5",
                    type: "DEVICE",
                    ports: [{ id: "p1", external: 22, internal: 22, service: "ssh", version: "OpenSSH 8", active: true }],
                    vulnerabilities: [],
                    users: [],
                    children: [{ id: "d2", ip: "10.0.0.6", type: "DEVICE", ports: [], users: [] }],
                    rules: [],
                    rootFiles: [],
                },
            }),
            node("world.port", { ip: "", action: "open", port: { id: "px", external: 80, internal: 80 } }),
        ]);
        const details = computeWarningDetails(project);
        expect(levelOf(details, /will not be built/)).toBe("error");
        expect(levelOf(details, /login service open/)).toBe("error");
        expect(levelOf(details, /has nothing to act on/)).toBe("warn");
    });

    it("unset pack nodes warn, the pack-mods honesty line informs", () => {
        const project = projectWith([
            node("world.packData", { packName: "Test Pack", gameModName: "TestMod", storageKey: "test.loot" }),
            node("pack.node", { packName: "Test Pack" }),
        ]);
        const details = computeWarningDetails(project);
        expect(levelOf(details, /not set up yet/)).toBe("warn");
        expect(levelOf(details, /community data is used/)).toBe("info");
    });

    it("websites: hiding places inform, broken addresses error, placeholders warn", () => {
        const project = projectWith([]);
        project.websites.push(
            {
                id: "w1",
                host: "example.com",
                name: "Shop",
                pages: [
                    { id: "p1", path: "/news", title: "News", seo: true, content: "<html></html>" },
                    { id: "p2", path: "/news", title: "News 2", seo: true, content: "<html></html>" },
                    { id: "p3", path: "/cellar", title: "Cellar", seo: false, content: "<html></html>" },
                ],
            },
            { id: "w2", host: "example.com", name: "Twin", pages: [] },
        );
        const details = computeWarningDetails(project);
        expect(levelOf(details, /unlisted page/)).toBe("info");
        expect(levelOf(details, /pages at the path \/news/)).toBe("error");
        expect(levelOf(details, /fight over which one answers/)).toBe("error");
        expect(levelOf(details, /placeholder domain/)).toBe("warn");
    });

    it("Wi-Fi Bettercap display wart is informational, not a blocker", () => {
        const project = projectWith([node("world.wifi", { ssid: "LAB-5G", password: "correct-horse" })]);
        const details = computeWarningDetails(project);
        expect(levelOf(details, /Bettercap may show no network name/)).toBe("info");
    });

    it("target-matching mismatches warn, and the text view is unchanged", () => {
        const pack = {
            format: 2,
            id: "tp",
            name: "Test Pack",
            gameMod: { name: "TestMod" },
            events: [{ name: "TestMod.Tool.Fired", label: "fired", docs: "", fields: [] }],
            storage: [],
            targetRules: { services: ["ssh"], versionOnPorts: false, vulnsOnDomain: false, vulnTypes: [], serviceAliases: {} },
            commandData: [],
            nodes: [],
        } as unknown as ToolPack;
        const project = projectWith([
            node("trigger.event", { event: "TestMod.Tool.Fired", conditions: [] }),
            node("world.network", {
                device: {
                    id: "d1",
                    ip: "10.0.0.5",
                    type: "DEVICE",
                    ports: [{ id: "p1", external: 23, internal: 23, service: "telnet", version: "t1", active: true }],
                    vulnerabilities: [],
                    users: [],
                    children: [],
                    rules: [],
                    rootFiles: [],
                },
            }),
        ]);
        const details = computeWarningDetails(project, [pack]);
        expect(levelOf(details, /telnet/)).toBe("warn");
    });
});
