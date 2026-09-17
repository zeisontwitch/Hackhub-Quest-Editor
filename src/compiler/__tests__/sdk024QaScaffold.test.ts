import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { compileProject } from "../compile";
import { parseProjectFile } from "@/templates/share";

describe("r166 SDK 0.24 in-game QA scaffold", () => {
    it("imports, preserves native Wi-Fi fields, and compiles", () => {
        const text = readFileSync(join(process.cwd(), "reference/sdk-0.24-qa/projects/sdk-0.24-ingame-qa.project.json"), "utf8");
        const parsed = parseProjectFile(text);
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) throw new Error(parsed.error);

        const wifi = parsed.project.quests[0].graph.nodes.find((node) => node.type === "world.wifi");
        expect(wifi?.data).toMatchObject({
            ssid: "QE24-LAB-5G",
            bssid: "02:24:00:00:24:02",
            channel: 44,
            wps: true,
        });

        const output = compileProject(parsed.project);
        const mod = output.files.find((file) => file.path === "dist/mod.js")?.content ?? "";
        const manifest = JSON.parse(output.files.find((file) => file.path === "manifest.json")?.content ?? "{}");
        expect(manifest.permissions).toEqual(expect.arrayContaining(["network", "mail", "events", "ui"]));
        expect(mod).toContain("Network.createWifiNetwork");
        expect(mod).toContain("wifiDef.wps");
        expect(mod).toContain("QE24-LAB-5G");
    });

    it("ships a timer quest (S-01 fire / S-02 reload / S-03 cancel)", () => {
        const text = readFileSync(join(process.cwd(), "reference/sdk-0.24-qa/projects/sdk-0.24-ingame-qa.project.json"), "utf8");
        const parsed = parseProjectFile(text);
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) throw new Error(parsed.error);

        const beatQuest = parsed.project.quests.find((quest) => quest.name === "QESdk024TimerQa");
        expect(beatQuest).toBeDefined();
        expect(beatQuest?.autoStart).toBe(true);
        const beats = (beatQuest?.graph.nodes ?? []).filter((node) => node.type === "flow.timer");
        expect(beats.map((node) => node.data.minutes).concat(beats.map((node) => node.data.hours))).toEqual([2, 0, 0, 2]);

        const output = compileProject(parsed.project);
        const mod = output.files.find((file) => file.path === "dist/mod.js")?.content ?? "";
        /* One beat registration per quest; both quest ids reach the Scheduler. */
        expect(mod.split("Scheduler.register").length).toBe(3);
        expect(mod).toContain('"id":"' + beatQuest!.id + '"');
        expect(mod).toContain("timer missed");
        /* The mod-unique kind is composed at runtime (mod id is data), but
           the "/timer" suffix ships as a source literal. */
        expect(mod).toContain('"/timer"');
        expect(mod).toContain("Timer A arrived (S-01 green)");
    });
});
