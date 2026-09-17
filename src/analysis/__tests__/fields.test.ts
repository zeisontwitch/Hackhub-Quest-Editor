/**
 * Per-field warnings: the "this value is filled but won't work until X is one
 * node up" signals an author sees beside the field they are editing.
 */
import { describe, expect, it } from "vitest";
import { fieldWarnings } from "@/analysis/fields";
import { createQuest } from "@/schema/project";
import type { FileEntry, NetworkDevice } from "@/schema/common";
import { makeNode } from "@/templates/kit";

function questWith(...nodes: ReturnType<typeof makeNode>[]): ReturnType<typeof createQuest> {
    const quest = createQuest({
        id: "q-warn",
        name: "WarnTest",
        closingObjectiveText: "done",
        title: "Warn Test",
        autoStart: true,
        description: "warnings",
        rewards: { money: 0, xp: 0 },
    });
    quest.graph = { nodes, edges: [] };
    return quest;
}

const file = (name: string): FileEntry =>
    ({ id: `f-${name}`, name, extension: "txt", isFolder: false, data: "x" }) as FileEntry;

const device = (over: Partial<NetworkDevice> = {}): NetworkDevice =>
    ({
        id: "dev", ip: "10.0.0.5", name: "host", type: "DEVICE",
        vulnerabilities: [],
        ports: [{ id: "p", external: 22, internal: 22, active: true, service: "ssh", version: "OpenSSH 6.4.0" }],
        users: [{ id: "u", username: "admin", acceptReverseTCP: true }],
        children: [],
        ...over,
    }) as NetworkDevice;

const networkWith = (dev: NetworkDevice) => makeNode("world.network", { x: 100, y: 0 }, { device: dev });

describe("fieldWarnings", () => {
    it("warns when Ask player checks an answer but no accepted answer is filled in", () => {
        const prompt = makeNode("fx.prompt", { x: 0, y: 0 }, { matchMode: "exact", expected: "" });
        const quest = questWith(prompt);
        const warning = fieldWarnings(quest, prompt).find((w) => w.path === "expected");
        expect(warning).toBeDefined();
        expect(warning!.nextStep).toMatch(/Answer to accept/);
    });

    it("does not warn when Ask player accepts any submitted text", () => {
        const prompt = makeNode("fx.prompt", { x: 0, y: 0 }, { matchMode: "any", expected: "" });
        const quest = questWith(prompt);
        expect(fieldWarnings(quest, prompt)).toEqual([]);
    });

    it("warns on a Change port with an IP but no network node in the quest", () => {
        const port = makeNode("world.port", { x: 0, y: 0 }, { ip: "45.33.32.156", port: { external: 22, internal: 22, active: true, service: "ssh" } });
        const quest = questWith(port);
        const warnings = fieldWarnings(quest, port);
        expect(warnings.some((w) => w.path === "ip")).toBe(true);
        expect(warnings.find((w) => w.path === "ip")!.nextStep).toMatch(/Create network/i);
    });

    it("does not warn on a Change port with an IP when a network node exists", () => {
        const port = makeNode("world.port", { x: 0, y: 0 }, { ip: "45.33.32.156", port: { external: 22, internal: 22, active: true, service: "ssh" } });
        const network = makeNode("world.network", { x: 100, y: 0 });
        const quest = questWith(port, network);
        const warnings = fieldWarnings(quest, port);
        expect(warnings.some((w) => w.path === "ip")).toBe(false);
    });

    it("warns on an empty Device IP, even when a network exists", () => {
        const port = makeNode("world.port", { x: 0, y: 0 }, { ip: "", port: { external: 22, internal: 22, active: true, service: "ssh" } });
        const network = makeNode("world.network", { x: 100, y: 0 });
        const quest = questWith(port, network);
        const warning = fieldWarnings(quest, port).find((w) => w.path === "ip");
        expect(warning).toBeDefined();
        expect(warning!.severity).toBe("warn");
        expect(warning!.nextStep).toMatch(/{{data.targetIp}}/);
    });

    it("warns on an empty Protected IP on a firewall rule", () => {
        const firewall = makeNode("world.firewall", { x: 0, y: 0 }, { ip: "" });
        const quest = questWith(firewall);
        const warning = fieldWarnings(quest, firewall).find((w) => w.path === "ip");
        expect(warning).toBeDefined();
        expect(warning!.detail).toMatch(/No machine set/);
        // The firewall offers Random as a choice, so the step says "pick",
        // not "type".
        expect(warning!.nextStep).toMatch(/Pick.*Random/);
    });

    it("flags device-targeted Place files with no network as blocking", () => {
        const files = makeNode("world.files", { x: 0, y: 0 }, { target: "device", ip: "45.33.32.156", files: [file("ledger.txt")] });
        const quest = questWith(files);
        const warning = fieldWarnings(quest, files).find((w) => w.path === "ip");
        expect(warning).toBeDefined();
        expect(warning!.severity).toBe("danger");
        expect(warning!.nextStep).toMatch(/Create network/i);
    });

    it("flags device-targeted Place files with no network even when the address is blank", () => {
        const files = makeNode("world.files", { x: 0, y: 0 }, { target: "device", ip: "", files: [file("ledger.txt")] });
        const quest = questWith(files);
        const warning = fieldWarnings(quest, files).find((w) => w.path === "ip");
        expect(warning).toBeDefined();
        expect(warning!.nextStep).toMatch(/Create network/i);
    });

    it("stays quiet on device-targeted Place files with nothing to place", () => {
        const files = makeNode("world.files", { x: 0, y: 0 }, { target: "device", ip: "45.33.32.156", files: [] });
        const quest = questWith(files);
        expect(fieldWarnings(quest, files)).toEqual([]);
    });

    it("does not warn on a player-targeted Place files", () => {
        const files = makeNode("world.files", { x: 0, y: 0 }, { target: "player", ip: "", files: [] });
        const quest = questWith(files);
        expect(fieldWarnings(quest, files)).toEqual([]);
    });

    it("flags files aimed at an address no device uses, listing the ones that exist", () => {
        const router = device({
            ip: "10.0.0.1", type: "ROUTER", ports: [], users: [],
            children: [device({ id: "child", ip: "10.0.0.5", ports: [] })],
        });
        const files = makeNode("world.files", { x: 0, y: 0 }, { target: "device", ip: "192.0.2.99", files: [file("db.sql")] });
        const quest = questWith(files, networkWith(router));
        const warning = fieldWarnings(quest, files).find((w) => w.path === "ip");
        expect(warning).toBeDefined();
        expect(warning!.severity).toBe("danger");
        expect(warning!.nextStep).toMatch(/10\.0\.0\.1/);
        expect(warning!.nextStep).toMatch(/10\.0\.0\.5/);
    });

    it("flags files aimed at a device with no user account", () => {
        const files = makeNode("world.files", { x: 0, y: 0 }, { target: "device", ip: "10.0.0.5", files: [file("db.sql")] });
        const quest = questWith(files, networkWith(device({ users: [] })));
        const warning = fieldWarnings(quest, files).find((w) => w.path === "ip");
        expect(warning).toBeDefined();
        expect(warning!.severity).toBe("danger");
        expect(warning!.nextStep).toMatch(/user account/i);
    });

    it("stays quiet when the compiler's single-device fallback would place the files", () => {
        const files = makeNode("world.files", { x: 0, y: 0 }, { target: "device", ip: "", files: [file("a.txt")] });
        const quest = questWith(files, networkWith(device()));
        expect(fieldWarnings(quest, files)).toEqual([]);
    });

    it("flags an exact-date Timer set to a day the month does not have", () => {
        const timer = makeNode("flow.timer", { x: 0, y: 0 }, {
            mode: "at",
            dateYear: 2026,
            dateMonth: 6,
            dateDay: 31,
            hour: 4,
            minute: 20,
        });
        const warning = fieldWarnings(questWith(timer), timer).find((w) => w.path === "dateDay");
        expect(warning).toBeDefined();
        expect(warning!.detail).toMatch(/“31 June” never arrives/);
        expect(warning!.nextStep).toMatch(/1 to 30/);
    });

    it("accepts 29 February in a leap year and flags it in a common one", () => {
        const leap = makeNode("flow.timer", { x: 0, y: 0 }, { mode: "at", dateYear: 2028, dateMonth: 2, dateDay: 29 });
        expect(fieldWarnings(questWith(leap), leap)).toEqual([]);
        const common = makeNode("flow.timer", { x: 0, y: 0 }, { mode: "at", dateYear: 2027, dateMonth: 2, dateDay: 29 });
        expect(fieldWarnings(questWith(common), common).some((w) => w.path === "dateDay")).toBe(true);
    });

    it("stays quiet while an exact-date Timer is still half-filled in", () => {
        const timer = makeNode("flow.timer", { x: 0, y: 0 }, { mode: "at", dateYear: 2026, dateMonth: 0, dateDay: 0 });
        expect(fieldWarnings(questWith(timer), timer)).toEqual([]);
    });

    it("does not read the calendar in Wait or coming-day mode", () => {
        const wait = makeNode("flow.timer", { x: 0, y: 0 }, { mode: "after", days: 0, hours: 0, minutes: 0 });
        expect(fieldWarnings(questWith(wait), wait).some((w) => w.path === "dateDay")).toBe(false);
        const coming = makeNode("flow.timer", { x: 0, y: 0 }, { mode: "daytime", offsetDays: 3 });
        expect(fieldWarnings(questWith(coming), coming).some((w) => w.path === "dateDay")).toBe(false);
    });
});
