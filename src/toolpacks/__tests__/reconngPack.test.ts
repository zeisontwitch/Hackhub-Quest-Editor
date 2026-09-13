/**
 * The Recon-NG example pack (r149): a real tool mod described as pack data.
 * The fixture is the fence doc's living half — if it ever stops parsing, or
 * drifts from what the tests pin here, the fence notes lie. See
 * reference/reconng/README.md (fenced: example only, never serviced).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseToolPack, type ToolPack } from "@/toolpacks/schema";
import { defaultPackValues, packEventByName, packEvents, packNodeDefs, paletteDefKey } from "@/toolpacks/palette";

const reconngRaw = JSON.parse(
    readFileSync(join(process.cwd(), "reference/reconng/toolpack.json"), "utf8"),
) as Record<string, unknown>;
const starterRaw = JSON.parse(
    readFileSync(join(process.cwd(), "reference/example-toolpack/toolpack.json"), "utf8"),
) as Record<string, unknown>;

function mustParse(raw: Record<string, unknown>): ToolPack {
    const result = parseToolPack(raw);
    if (!result.ok) throw new Error(result.error);
    return result.pack;
}

describe("recon-ng pack fixture", () => {
    it("parses as format 2 with the honesty line", () => {
        const pack = mustParse(reconngRaw);
        expect(pack.id).toBe("recon-ng");
        expect(pack.name).toBe("Recon-NG");
        expect(pack.gameMod.name).toBe("Recon-NG");
        expect(pack.docsUrl).toContain("darkvalnar.github.io/hackhub-reconng");
    });

    it("carries all nine source-verified events, not just the five documented ones", () => {
        const pack = mustParse(reconngRaw);
        expect(pack.events.map((e) => e.name)).toEqual([
            "ReconNg.Breach.SessionOpened",
            "ReconNg.Breach.DesktopOpened",
            "ReconNg.Breach.DirListed",
            "ReconNg.Breach.FileRead",
            "ReconNg.Breach.FileDownloaded",
            "ReconNg.Breach.FileDeleted",
            "ReconNg.Breach.Shutdown",
            "ReconNg.Breach.SessionClosed",
            "ReconNg.UserEnum.Complete",
        ]);
    });

    it("declares the exact payload fields triggers can match on", () => {
        const pack = mustParse(reconngRaw);
        const byName = new Map(pack.events.map((e) => [e.name, e.fields]));
        expect(byName.get("ReconNg.Breach.FileDownloaded")).toEqual([
            "sessionId",
            "ip",
            "host",
            "path",
            "name",
            "localPath",
        ]);
        expect(byName.get("ReconNg.Breach.SessionClosed")).toContain("reason");
        expect(byName.get("ReconNg.UserEnum.Complete")).toContain("users");
    });

    it("says plainly which events are missing from the mod's own docs page", () => {
        const pack = mustParse(reconngRaw);
        const byName = new Map(pack.events.map((e) => [e.name, e.docs]));
        for (const name of ["ReconNg.Breach.DirListed", "ReconNg.Breach.Shutdown", "ReconNg.UserEnum.Complete"]) {
            expect(byName.get(name)).toContain("Not on the mod's docs page");
        }
        /* SessionClosed is documented on the session-control page, FileRead on
           the events page — neither carries the note. */
        expect(byName.get("ReconNg.Breach.SessionClosed")).not.toContain("Not on the mod's docs page");
        expect(byName.get("ReconNg.Breach.FileRead")).not.toContain("Not on the mod's docs page");
    });

    it("offers loot, exploit and user-enum data shapes with replace semantics", () => {
        const pack = mustParse(reconngRaw);
        expect(pack.storage.map((s) => s.key)).toEqual([
            "reconng.loot",
            "reconng.modules",
            "reconng.user.enum.targets",
        ]);
        expect(pack.storage.map((s) => `${s.merge}:${s.mergeBy}`)).toEqual([
            "replace:target",
            "replace:id",
            "replace:target",
        ]);
    });

    it("keeps the loot entry's file flags honest (booleans land raw, not as text)", () => {
        const pack = mustParse(reconngRaw);
        const loot = pack.storage[0];
        expect(loot.entry).toEqual({
            target: "{{target}}",
            files: [
                {
                    path: "{{path}}",
                    data: "{{data}}\n",
                    readable: true,
                    downloadable: true,
                    deletable: "{{deletable}}",
                },
            ],
        });
        expect(loot.fields.find((f) => f.key === "deletable")?.type).toBe("boolean");
    });

    it("records the real target conventions, aliases included", () => {
        const pack = mustParse(reconngRaw);
        expect(pack.targetRules?.services).toEqual(["http", "ftp", "ssh", "database", "redis", "smb", "smtp"]);
        expect(pack.targetRules?.versionOnPorts).toBe(true);
        expect(pack.targetRules?.vulnsOnDomain).toBe(true);
        expect(pack.targetRules?.vulnTypes).toHaveLength(7);
        expect(pack.targetRules?.serviceAliases).toEqual({
            http: ["https", "web"],
            database: ["mysql", "mariadb", "postgres"],
        });
    });

    it("leaves serviceAliases defaulted for packs written before it existed", () => {
        const starter = mustParse(starterRaw);
        expect(starter.targetRules?.serviceAliases).toEqual({});
    });
});

describe("recon-ng pack surfaces", () => {
    it("feeds the trigger picker with pack attribution", () => {
        const events = packEvents([mustParse(reconngRaw)]);
        expect(events).toHaveLength(9);
        expect(events[0].packName).toBe("Recon-NG");
        expect(events.find((e) => e.name === "ReconNg.Breach.FileRead")?.payload).toBe(
            "{ sessionId; ip; host; path; name }",
        );
    });

    it("serves event fields and the honesty line by exact name", () => {
        const ev = packEventByName([mustParse(reconngRaw)], "ReconNg.Breach.SessionOpened")!;
        expect(ev.fields).toContain("moduleId");
        expect(ev.gameModName).toBe("Recon-NG");
    });

    it("grows the palette with two story-timed session nodes", () => {
        const defs = packNodeDefs([mustParse(reconngRaw)]);
        expect(defs.map((d) => (d.addData.nodeId as string))).toEqual([
            "recon-ng/close-session",
            "recon-ng/host-gate",
        ]);
        expect(defs[0].def.label).toBe("Cut the player's breach session");
    });

    it("keeps palette keys unique across both example packs", () => {
        const packs = [mustParse(starterRaw), mustParse(reconngRaw)];
        const keys = packNodeDefs(packs).map((d) => paletteDefKey(d.def));
        expect(new Set(keys).size).toBe(keys.length);
    });
});

describe("boolean seeding (r149)", () => {
    it("starts booleans off and leaves every other kind untouched", () => {
        expect(
            defaultPackValues([
                { key: "open", label: "Open", type: "boolean" },
                { key: "port", label: "Port", type: "number" },
                { key: "target", label: "Target", type: "string" },
            ]),
        ).toEqual({ open: "false" });
    });

    it("seeds the host-gate node's toggle in its palette snapshot", () => {
        const defs = packNodeDefs([mustParse(reconngRaw)]);
        const gate = defs.find((d) => d.addData.nodeId === "recon-ng/host-gate")!;
        expect(gate.addData.values).toEqual({ open: "false" });
    });

    it("seeds the loot contract's deletable toggle the same way", () => {
        const pack = mustParse(reconngRaw);
        const loot = pack.storage.find((s) => s.id === "loot")!;
        expect(defaultPackValues(loot.fields)).toEqual({ deletable: "false" });
    });
});
