/**
 * Pure helpers that turn loaded tool packs into editor surfaces.
 *
 * No store, no React — just data in, defs out. This keeps the feature logic
 * in its own feature folder (AR5) and leaves `store/packs.ts` as pure
 * persistence (AR6, AR10).
 */
import type { NodeTypeDef } from "@/schema/registry";
import type { ToolPack } from "./schema";

/** Deep clone without the JSON.parse(JSON.stringify) dance (A3 DRY). */
function deepClone<T>(value: T): T {
    // structuredClone is available in modern browsers and Node 17+; vitest's
    // jsdom provides it. Fallback only for very old environments.
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value)) as T;
}

/** A community event by exact name — feeds the trigger picker's explanation. */
export function packEventByName(
    packs: ToolPack[],
    name: string,
): { label: string; docs: string; fields: string[]; packName: string; gameModName: string } | undefined {
    for (const pack of packs) {
        const ev = pack.events.find((e) => e.name === name);
        if (ev) {
            return {
                label: ev.label,
                docs: ev.docs,
                fields: ev.fields,
                packName: pack.name,
                gameModName: pack.gameMod.name,
            };
        }
    }
    return undefined;
}

/** Every event the loaded packs declare, in EventPicker shape. */
export function packEvents(
    packs: ToolPack[],
): { name: string; label: string; docs: string; payload: string; packName: string }[] {
    return packs.flatMap((p) =>
        p.events.map((e) => ({
            name: e.name,
            label: e.label,
            docs: e.docs,
            packName: p.name,
            payload: `{ ${e.fields.join("; ")} }`,
        })),
    );
}

/**
 * Build the snapshot payload that a palette entry carries when the author
 * adds it. One entry per pack node, all of type `pack.node`.
 */
function buildAddData(pack: ToolPack, node: ToolPack["nodes"][number]): Record<string, unknown> {
    const base: Record<string, unknown> = {
        packId: pack.id,
        packName: pack.name,
        packVersion: pack.version,
        gameModName: pack.gameMod?.name ?? "",
        nodeId: `${pack.id}/${node.id}`,
        nodeLabel: node.label,
        emitter: node.emitter,
        fields: deepClone(node.fields ?? []),
        values: {},
    };

    switch (node.emitter) {
        case "sdk":
            base.steps = deepClone(node.steps ?? []);
            break;
        case "emit":
            base.eventName = node.eventName ?? "";
            base.payload = deepClone(node.payload ?? {});
            break;
        case "storage":
            base.storageKey = node.key ?? "";
            base.merge = node.merge ?? "replace";
            base.mergeBy = node.mergeBy;
            base.entry = deepClone(node.entry ?? {});
            break;
        case "commandData":
            base.command = node.command ?? "";
            base.input = node.input ?? "";
            base.data = deepClone(node.data ?? {});
            break;
    }

    return base;
}

/**
 * Synthesized palette defs for every pack-authored node.
 * One NodeTypeDef per pack node — all of type `pack.node`, each carrying
 * its own label/blurb and the `addData` snapshot the canvas gets when the
 * author adds it. Presented under "Editor Mods · <pack name>".
 *
 * Rule violations fixed:
 * - A3 DRY: deepClone helper instead of four JSON.parse(JSON.stringify) copies
 * - F1/F2: extraction of buildAddData so this function does one job
 */
export function packNodeDefs(packs: ToolPack[]): { def: NodeTypeDef; addData: Record<string, unknown> }[] {
    return packs.flatMap((pack) =>
        pack.nodes.map((n) => {
            const addData = buildAddData(pack, n);
            const blurb = n.blurb || (pack.gameMod?.name ? `Needs the ${pack.gameMod.name} game mod` : "From a tool pack");

            const def: NodeTypeDef = {
                type: "pack.node",
                category: "community",
                label: n.label,
                blurb,
                icon: "package",
                targets: [],
                sources: [],
                hook: "onStart",
                fields: [],
                create: () => ({}) as never,
                addData,
            };

            return { def, addData };
        }),
    );
}

/**
 * Unique React key for a palette def.
 * Static nodes: type is unique. Pack nodes: many share type `pack.node`, so
 * use the snapshot's nodeId (`<packId>/<nodeId>`) which is unique by design.
 */
export function paletteDefKey(def: NodeTypeDef): string {
    const nodeId = (def.addData as { nodeId?: string } | undefined)?.nodeId;
    return nodeId ?? `${def.type}:${def.label}`;
}
