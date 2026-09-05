/**
 * Seeding files onto a remote device.
 *
 * The node offered "a remote device" and silently did nothing, because every
 * `Files.*` call in the SDK resolves against the current session and none
 * takes a target address. Meanwhile the in-game handbook's whole exfiltration
 * loop — find the file, download it, deliver it — assumes files already
 * sitting on target machines.
 *
 * The files now fold into the device's owning user at build time, which is the
 * one mechanism that does work.
 */
import { describe, expect, it } from "vitest";
import { nest, ownerFor, seedRemoteFiles } from "@/compiler/seedRemoteFiles";
import { createProject } from "@/schema/project";
import type { FileEntry, NetworkDevice } from "@/schema/common";
import type { QuestDoc } from "@/schema/project";

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

/** A quest with one network and one seed node. */
function quest(seed: Record<string, unknown>, dev = device()): QuestDoc {
    const q = createProject().quests[0];
    q.graph.nodes = [
        { id: "net", type: "world.network", position: { x: 0, y: 0 }, data: { device: dev } },
        { id: "seed", type: "world.files", position: { x: 0, y: 0 }, data: seed },
    ] as QuestDoc["graph"]["nodes"];
    return q;
}

describe("placing the files", () => {
    it("puts them on the device that matches the address", () => {
        const q = quest({ target: "device", ip: "10.0.0.5", files: [file("ledger.csv")] });
        const result = seedRemoteFiles(q);
        expect(result.absorbed.has("seed")).toBe(true);
        const owner = (q.graph.nodes[0].data as { device: NetworkDevice }).device.users![0];
        expect(owner.files?.map((f) => f.name)).toContain("ledger.csv");
    });

    it("matches a token address, since every network is random now", () => {
        // Manual IP entry was removed in r73, so an author writes the same
        // {{data.targetIp}} token in both places.
        const dev = device({ ip: "{{data.targetIp}}" });
        const q = quest({ target: "device", ip: "{{data.targetIp}}", files: [file("a.txt")] }, dev);
        seedRemoteFiles(q);
        expect(dev.users![0].files).toHaveLength(1);
    });

    it("falls back to the only machine that can be logged into", () => {
        // A blank address should not lose the author's files when the quest
        // builds exactly one plausible target.
        const q = quest({ target: "device", ip: "", files: [file("a.txt")] });
        const result = seedRemoteFiles(q);
        expect(result.absorbed.has("seed")).toBe(true);
        expect(result.unplaced).toHaveLength(0);
    });

    it("prefers the account the exploit lands in", () => {
        const dev = device({
            users: [
                { id: "u1", username: "root" },
                { id: "u2", username: "aritter", acceptReverseTCP: true },
            ],
        });
        expect(ownerFor(dev)!.username).toBe("aritter");
    });

    it("uses the first account when none accepts a shell", () => {
        const dev = device({ users: [{ id: "u1", username: "root" }, { id: "u2", username: "bob" }] });
        expect(ownerFor(dev)!.username).toBe("root");
    });

    it("leaves the player's own machine alone", () => {
        // That path already worked and still runs at runtime.
        const q = quest({ target: "player", files: [file("note.txt")] });
        const result = seedRemoteFiles(q);
        expect(result.absorbed.size).toBe(0);
    });

    it("reaches a device nested behind a router", () => {
        const child = device({ id: "child", ip: "192.168.1.4" });
        const router = device({
            id: "r", ip: "10.0.0.1", type: "ROUTER", children: [child],
        });
        const q = quest({ target: "device", ip: "192.168.1.4", files: [file("db.sql")] }, router);
        seedRemoteFiles(q);
        expect(child.users![0].files?.[0].name).toBe("db.sql");
    });

    it("adds to files the device already declares", () => {
        const dev = device();
        dev.users![0].files = [file("existing.txt")];
        const q = quest({ target: "device", ip: "10.0.0.5", files: [file("new.txt")] }, dev);
        seedRemoteFiles(q);
        expect(dev.users![0].files?.map((f) => f.name)).toEqual(["existing.txt", "new.txt"]);
    });
});

describe("when it cannot be placed", () => {
    it("says so when the quest builds no network", () => {
        const q = createProject().quests[0];
        q.graph.nodes = [
            { id: "seed", type: "world.files", position: { x: 0, y: 0 }, data: { target: "device", files: [file("a.txt")] } },
        ] as QuestDoc["graph"]["nodes"];
        const result = seedRemoteFiles(q);
        expect(result.unplaced).toHaveLength(1);
        expect(result.unplaced[0].reason).toMatch(/does not create a network/);
    });

    it("says so when the device has no user to own them", () => {
        const q = quest({ target: "device", ip: "10.0.0.5", files: [file("a.txt")] }, device({ users: [] }));
        const result = seedRemoteFiles(q);
        expect(result.unplaced[0].reason).toMatch(/no user account/);
    });

    it("absorbs an empty node quietly rather than complaining", () => {
        const q = quest({ target: "device", ip: "10.0.0.5", files: [] });
        const result = seedRemoteFiles(q);
        expect(result.unplaced).toHaveLength(0);
        expect(result.absorbed.has("seed")).toBe(true);
    });
});

describe("nest", () => {
    it("wraps files in the folders the author asked for", () => {
        const out = nest("/var/www/", [file("index.html")]);
        expect(out[0].name).toBe("var");
        expect(out[0].children![0].name).toBe("www");
        expect(out[0].children![0].children![0].name).toBe("index.html");
    });

    it("treats the home directory as no folders at all", () => {
        // A user's files already mount in their home directory.
        for (const path of ["~", "~/", "", "/", "/home/", "~/home"]) {
            expect(nest(path, [file("a.txt")])).toHaveLength(1);
            expect(nest(path, [file("a.txt")])[0].name).toBe("a.txt");
        }
    });

    it("marks the wrappers as folders", () => {
        expect(nest("/opt/", [file("a.txt")])[0].isFolder).toBe(true);
    });
});
