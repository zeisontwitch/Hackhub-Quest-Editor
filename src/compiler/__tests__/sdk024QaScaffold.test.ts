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
});
