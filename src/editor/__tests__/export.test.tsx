/**
 * Step 4 export UI: the top-bar "Export mod" flow opens the compile dialog,
 * which reports permissions, contents, and offers the zip download.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ExportDialog } from "@/editor/shell/ExportDialog";
import { createProject } from "@/schema/project";
import type { NodeDoc } from "@/schema/nodes";
import { nodeTypeDef } from "@/schema/registry";
import { useEditor } from "@/store/editor";
import { usePacks } from "@/store/packs";

const reconngRaw = JSON.parse(readFileSync(join(process.cwd(), "reference/reconng/toolpack.json"), "utf8")) as Parameters<
    ReturnType<typeof usePacks.getState>["loadPack"]
>[0];

beforeEach(() => {
    localStorage.clear();
    act(() => {
        usePacks.setState({ packs: [] });
        useEditor.getState().load(createProject(), { clearHistory: true });
    });
});

let seq = 0;
function tnode(type: Parameters<typeof nodeTypeDef>[0], patch: Record<string, unknown> = {}): NodeDoc {
    const data = { ...(nodeTypeDef(type).create() as object), ...patch };
    return { id: `t${++seq}`, type, position: { x: 0, y: 0 }, data } as NodeDoc;
}

describe("export dialog", () => {
    it("opens from the top bar and shows what the mod contains", () => {
        // a network node forces the "network" permission into the compile
        act(() => {
            useEditor.getState().addNode("world.network", { x: 0, y: 0 });
        });
        render(<ExportDialog open onOpenChange={() => {}} />);
        expect(screen.getByText("Export mod")).toBeInTheDocument();
        expect(screen.getByText("Permissions requested")).toBeInTheDocument();
        expect(screen.getByText("network")).toBeInTheDocument();
        expect(screen.getByText("manifest.json")).toBeInTheDocument();
        expect(screen.getByText("dist/mod.js")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /download .zip/i })).toBeEnabled();
    });

    it("shows target-matching warnings when a loaded pack cannot match the quest's targets", () => {
        act(() => usePacks.getState().loadPack(reconngRaw));
        const p = createProject();
        const q = p.quests[0];
        q.autoStart = true;
        q.graph.nodes = [
            tnode("entry.start"),
            tnode("trigger.event", { event: "ReconNg.Breach.SessionOpened", conditions: [] }),
            tnode("world.network", {
                device: {
                    id: "r1",
                    ip: "10.0.0.9",
                    type: "DEVICE",
                    ports: [{ id: "p1", external: 23, internal: 23, service: "telnet", version: "t1", active: true }],
                    vulnerabilities: [{ id: "v1", type: "RCE" }],
                    users: [],
                    children: [],
                    rules: [],
                    rootFiles: [],
                },
            }),
        ];
        act(() => useEditor.getState().load(p, { clearHistory: true }));
        render(<ExportDialog open onOpenChange={() => {}} />);
        expect(screen.getByText(/telnet/)).toBeInTheDocument();
    });

    it("lists websites and hints about unlisted pages", () => {
        const p = createProject();
        p.websites.push({
            id: "wx",
            host: "hidden.example",
            name: "Hidden",
            pages: [
                { id: "hp", path: "/notes", title: "Notes", seo: false, content: "<html></html>" },
            ],
        });
        act(() => useEditor.getState().load(p, { clearHistory: true }));
        render(<ExportDialog open onOpenChange={() => {}} />);
        expect(screen.getAllByText(/hidden\.example/).length).toBeGreaterThan(0);
        expect(screen.getByText(/unlisted page/i)).toBeInTheDocument();
    });
});
