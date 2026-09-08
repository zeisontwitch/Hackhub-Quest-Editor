/**
 * Port presets: picking "SSH · port 22" appends a fully-filled port row, so
 * the author never has to type a version string from memory.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { DeviceEditor } from "@/editor/inspector/DeviceTree";
import { makeNode } from "@/templates/kit";
import { createProject, createQuest } from "@/schema/project";
import type { NetworkDevice } from "@/schema/common";
import { useEditor } from "@/store/editor";

function loadWith(nodes: ReturnType<typeof makeNode>[]) {
    const quest = createQuest({
        id: "q-preset",
        name: "Preset",
        closingObjectiveText: "done",
        title: "Preset",
        autoStart: true,
        description: "preset",
        rewards: { money: 0, xp: 0 },
    });
    quest.graph = { nodes, edges: [] };
    const project = createProject({
        mod: { id: "preset-mod", name: "Preset", version: "1.0.0", author: "", description: "preset", tags: [], dependencies: [], minSdkVersion: "0.21.0", apiVersion: 1 },
        quests: [quest],
        websites: [],
    });
    act(() => {
        useEditor.getState().load(project, { clearHistory: true });
        useEditor.getState().setActiveQuest(project.quests[0].id);
    });
}

function storedDevice(nodeId: string): NetworkDevice {
    const node = useEditor
        .getState()
        .project.quests[0].graph.nodes.find((n) => n.id === nodeId);
    return (node!.data as { device: NetworkDevice }).device;
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("device port presets", () => {
    it("appends a fully-filled SSH row from the preset", () => {
        const network = makeNode("world.network", { x: 0, y: 0 });
        loadWith([network]);
        const device = (network.data as unknown as { device: NetworkDevice }).device;
        const before = device.ports.length;
        render(<DeviceEditor nodeId={network.id} path="device" device={device} />);
        fireEvent.click(screen.getByRole("button", { name: /Ports \(/ }));
        fireEvent.change(screen.getByLabelText("Add a common port"), {
            target: { value: "ssh" },
        });
        const ports = storedDevice(network.id).ports;
        expect(ports).toHaveLength(before + 1);
        expect(ports[ports.length - 1]).toMatchObject({
            external: 22,
            internal: 22,
            active: true,
            service: "ssh",
            version: "OpenSSH 6.4.0",
        });
    });

    it("leaves the version blank where no verified version exists", () => {
        const network = makeNode("world.network", { x: 0, y: 0 });
        loadWith([network]);
        const device = (network.data as unknown as { device: NetworkDevice }).device;
        render(<DeviceEditor nodeId={network.id} path="device" device={device} />);
        fireEvent.click(screen.getByRole("button", { name: /Ports \(/ }));
        fireEvent.change(screen.getByLabelText("Add a common port"), {
            target: { value: "smtp" },
        });
        const ports = storedDevice(network.id).ports;
        expect(ports[ports.length - 1]).toMatchObject({
            external: 25,
            service: "smtp",
            version: "",
        });
    });

    it("keeps the dropdown reset so the same preset can be picked twice", () => {
        const network = makeNode("world.network", { x: 0, y: 0 });
        loadWith([network]);
        const device = (network.data as unknown as { device: NetworkDevice }).device;
        render(<DeviceEditor nodeId={network.id} path="device" device={device} />);
        fireEvent.click(screen.getByRole("button", { name: /Ports \(/ }));
        const select = screen.getByLabelText("Add a common port") as HTMLSelectElement;
        fireEvent.change(select, { target: { value: "ftp" } });
        expect(select.value).toBe("");
    });
});
