/**
 * The Dry run dialog, smoke-tested: it opens, runs the harness against the
 * loaded project, and reports honestly. The harness itself is covered in
 * src/compiler/__tests__/simulate.test.ts — this is the shell around it.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SimulatorDialog } from "@/editor/simulator/SimulatorDialog";
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

describe("the dry run dialog", () => {
    it("opens, runs, and reports the quest", async () => {
        render(<SimulatorDialog open onOpenChange={() => {}} />);
        expect(screen.getByText("Dry run")).toBeInTheDocument();
        // The honesty caption is part of the product, not decoration.
        expect(screen.getByText(/simulates the editor's own runtime/)).toBeInTheDocument();
        // The auto-run finishes and the quest section appears.
        await waitFor(() => expect(screen.getByRole("heading", { name: "First Quest" })).toBeInTheDocument());
        expect(screen.queryByText("would never tick")).not.toBeInTheDocument();
    });

    it("surfaces target-matching warnings for loaded packs", async () => {
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
        render(<SimulatorDialog open onOpenChange={() => {}} />);
        await waitFor(() => expect(screen.getByText(/telnet/)).toBeInTheDocument());
    });
});
