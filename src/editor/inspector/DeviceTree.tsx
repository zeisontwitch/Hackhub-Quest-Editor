/**
 * The network device editor.
 *
 * Recursive, because HackHub networks are a tree: a router or splitter carries
 * children, which may themselves be routers. Fields shown depend on the device
 * type — `model`/`accessable` only exist on routers, `rules` only on firewalls —
 * which is exactly the SDK's discriminated union, surfaced as conditional UI
 * rather than as a schema the author has to understand.
 */
import { useState } from "react";
import { nanoid } from "nanoid";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import { DEVICE_TYPES, DEVICE_TYPE_LABELS, type DeviceType, type NetworkDevice } from "@/schema/common";
import { TARGET_IP_TOKEN } from "@/schema/common";
import { FIELD_GROUPS } from "@/schema/registry";
import { useEditor } from "@/store/editor";
import { ListEditor } from "./ListEditor";
import { FieldShell, SelectInput, TextInput, Toggle } from "./primitives";

const TYPE_OPTIONS = DEVICE_TYPES.map((t) => ({ value: t, label: DEVICE_TYPE_LABELS[t] }));

const TYPE_ICONS: Record<DeviceType, string> = {
    ROUTER: "network",
    DEVICE: "package",
    FIREWALL: "shield",
    SPLITTER: "branch",
    PRINTER: "file",
};

export function DeviceEditor({
    nodeId,
    path,
    device,
    depth = 0,
}: {
    nodeId: string;
    path: string;
    device: NetworkDevice;
    depth?: number;
}) {
    const updateNodeData = useEditor((s) => s.updateNodeData);
    const write = (patch: Partial<NetworkDevice>) => updateNodeData(nodeId, { [path]: { ...device, ...patch } });

    const isRouter = device.type === "ROUTER" || device.type === "SPLITTER";
    const isFirewall = device.type === "FIREWALL";

    return (
        <div
            className={cn("rounded-md border border-line bg-surface-2/40", depth > 0 && "ml-3")}
        >
            <div className="flex items-center gap-2 border-b border-line/70 px-2 py-1.5">
                <Icon
                    name={TYPE_ICONS[device.type]}
                    size={13}
                    className="shrink-0 text-cat-world"
                    aria-hidden
                />
                <span className="truncate font-mono text-[11.5px] text-ink-2">
                    {device.ip === TARGET_IP_TOKEN ? "Random IP" : device.ip || "no IP"}
                </span>
                <span className="ml-auto text-[10px] tracking-wider text-ink-4 uppercase">
                    {DEVICE_TYPE_LABELS[device.type]}
                </span>
            </div>

            <div className="py-0.5">
                <FieldShell label="Type">
                    <SelectInput
                        ariaLabel="Device type"
                        value={device.type}
                        onChange={(type) => write({ type: type as DeviceType })}
                        options={TYPE_OPTIONS}
                    />
                </FieldShell>

                {/* The address of the machine a quest is built around is
                    allocated by the game, not typed (r73): networks live in the
                    save and outlive the mod, so a fixed address meant a
                    re-exported build collided with its own older self. The
                    field shows "Random IP" rather than the raw token, because
                    the author never has to know the token exists. Machines
                    BEHIND a router keep a real, editable LAN address. */}
                {device.ip === TARGET_IP_TOKEN ? (
                    <FieldShell
                        label="IP address"
                        hint="The game gives this machine a fresh address every playthrough, so a re-exported mod can never clash with an older copy of itself. Anywhere you need the address — a whois answer, a hint, a mail — it is filled in for you."
                    >
                        <TextInput ariaLabel="IP address" value="Random IP" onChange={() => {}} disabled mono />
                    </FieldShell>
                ) : (
                    <FieldShell label="IP address" hint="The address of this machine on the network behind the router.">
                        <TextInput
                            ariaLabel="IP address"
                            value={device.ip}
                            onChange={(ip) => write({ ip })}
                            mono
                        />
                    </FieldShell>
                )}

                <FieldShell label="Hostname">
                    <TextInput
                        ariaLabel="Hostname"
                        value={device.name ?? ""}
                        onChange={(name) => write({ name })}
                        mono
                        placeholder="optional"
                    />
                </FieldShell>

                <FieldShell label="Domain">
                    <TextInput
                        ariaLabel="Domain"
                        value={device.domainName ?? ""}
                        onChange={(domainName) => write({ domainName })}
                        mono
                        placeholder="optional"
                    />
                </FieldShell>

                {device.type === "ROUTER" && (
                    <>
                        <FieldShell
                            label="Router model"
                            hint="Enables the in-game `fern` recovery route: the player runs fern “<model>” to recover the password. Leave blank to disable that route."
                        >
                            <TextInput
                                ariaLabel="Router model"
                                value={device.model ?? ""}
                                onChange={(model) => write({ model })}
                                mono
                                placeholder="TP-Link Archer C6"
                            />
                        </FieldShell>
                        <Toggle
                            label="Support-mail password recovery"
                            hint="When on, emailing the vendor's support address gets the player the credentials. Give a router one route in, not both, unless you want both."
                            checked={device.accessable ?? false}
                            onChange={(accessable) => write({ accessable })}
                        />
                        {!(device.model ?? "").trim() && !device.accessable && (
                            <p className="mx-3 mb-2 flex items-start gap-1.5 rounded border border-warn/30 bg-warn/10 px-2 py-1.5 text-[11px] leading-snug text-warn">
                                <Icon name="alert" size={12} className="mt-px shrink-0" />
                                This router has no way in: set a model for `fern`, or enable
                                support-mail recovery.
                            </p>
                        )}
                    </>
                )}

                <Toggle
                    label="Hide IP from scanning"
                    checked={device.isIpHidden ?? false}
                    onChange={(isIpHidden) => write({ isIpHidden })}
                />

                <Collapsible title={`Ports (${device.ports.length})`}>
                    <ListEditor
                        nodeId={nodeId}
                        path={`${path}.ports`}
                        items={device.ports as unknown as Record<string, unknown>[]}
                        def={{
                            kind: "list",
                            key: "ports",
                            label: "Ports",
                            ...FIELD_GROUPS.ports,
                        }}
                    />
                </Collapsible>

                <Collapsible title={`Accounts (${device.users.length})`}>
                    <ListEditor
                        nodeId={nodeId}
                        path={`${path}.users`}
                        items={device.users as unknown as Record<string, unknown>[]}
                        def={{
                            kind: "list",
                            key: "users",
                            label: "Accounts",
                            ...FIELD_GROUPS.users,
                        }}
                    />
                </Collapsible>

                {isFirewall && (
                    <Collapsible title={`Firewall rules (${device.rules.length})`}>
                        <ListEditor
                            nodeId={nodeId}
                            path={`${path}.rules`}
                            items={device.rules as unknown as Record<string, unknown>[]}
                            def={{
                                kind: "list",
                                key: "rules",
                                label: "Rules",
                                ...FIELD_GROUPS.rules,
                            }}
                        />
                    </Collapsible>
                )}

                <Collapsible title={`Vulnerabilities (${device.vulnerabilities.length})`}>
                    <ListEditor
                        nodeId={nodeId}
                        path={`${path}.vulnerabilities`}
                        items={device.vulnerabilities as unknown as Record<string, unknown>[]}
                        def={{
                            kind: "list",
                            key: "vulnerabilities",
                            label: "Vulnerabilities",
                            ...FIELD_GROUPS.vulnerabilities,
                        }}
                    />
                </Collapsible>

                {device.type === "DEVICE" && (
                    <Collapsible title={`Root files (${device.rootFiles.length})`}>
                        <ListEditor
                            nodeId={nodeId}
                            path={`${path}.rootFiles`}
                            items={device.rootFiles as unknown as Record<string, unknown>[]}
                            def={{
                                kind: "list",
                                key: "rootFiles",
                                label: "Root files",
                                hint: "Mounted at the remote root (/). A folder named etc, home, logs or lib is merged into the existing one.",
                                ...FIELD_GROUPS.files,
                            }}
                        />
                    </Collapsible>
                )}

                {isRouter && (
                    <Collapsible title={`Devices behind this (${device.children.length})`}>
                        <DeviceListEditor
                            nodeId={nodeId}
                            path={`${path}.children`}
                            devices={device.children}
                            depth={depth + 1}
                        />
                    </Collapsible>
                )}
            </div>
        </div>
    );
}

export function DeviceListEditor({
    nodeId,
    path,
    devices,
    depth = 0,
}: {
    nodeId: string;
    path: string;
    devices: NetworkDevice[];
    depth?: number;
}) {
    const updateNodeData = useEditor((s) => s.updateNodeData);
    const write = (next: NetworkDevice[]) => updateNodeData(nodeId, { [path]: next });

    return (
        <div className="space-y-1.5 px-1 pb-1">
            {devices.map((device, index) => (
                <div key={device.id} className="relative">
                    <DeviceEditor
                        nodeId={nodeId}
                        path={`${path}.${index}`}
                        device={device}
                        depth={depth}
                    />
                    <button
                        type="button"
                        className="btn-icon absolute top-1 right-1 z-10 size-5 text-ink-4 hover:text-danger"
                        onClick={() => write(devices.filter((_, i) => i !== index))}
                        title="Remove device"
                        aria-label="Remove device"
                    >
                        <Icon name="trash" size={10} />
                    </button>
                </div>
            ))}

            <button
                type="button"
                onClick={() =>
                    write([
                        ...devices,
                        {
                            id: nanoid(8),
                            ip: "",
                            type: "DEVICE",
                            vulnerabilities: [],
                            users: [],
                            ports: [],
                            rules: [],
                            rootFiles: [],
                            children: [],
                        },
                    ])
                }
                className="btn-default w-full text-[11.5px]"
            >
                <Icon name="plus" size={12} />
                Add device
            </button>
        </div>
    );
}

function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="mx-3 mb-2 overflow-hidden rounded-md border border-line/70">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center gap-1.5 bg-surface-2/60 px-2 py-1 text-left hover:bg-surface-3"
                aria-expanded={open}
            >
                <Icon
                    name="chevronRight"
                    size={11}
                    className={cn("shrink-0 text-ink-4 transition-transform", open && "rotate-90")}
                />
                <span className="text-[11px] font-medium text-ink-3">{title}</span>
            </button>
            {open && <div className="p-2">{children}</div>}
        </div>
    );
}
