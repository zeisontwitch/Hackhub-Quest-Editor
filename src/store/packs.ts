/**
 * The tool packs the user has dropped into this editor.
 *
 * Packs are machine-local: they persist in this browser (their own localStorage
 * key, like the autosave draft) but are NOT part of the project document — a
 * project references pack data by id and stores its own values, so it stays
 * portable and compiles even where the pack is not loaded. No undo history:
 * loading and removing packs is not story editing.
 */
import { create } from "zustand";
import { parseToolPack, type ToolPack } from "@/toolpacks/schema";

const KEY = "hackhub-quest-editor:packs:v1";

interface PacksState {
    packs: ToolPack[];
    /** Parse + store a pack. Never throws: the error comes back in the
        scan-panel voice for the manager dialog to show. */
    loadPack: (raw: unknown) => { ok: true; pack: ToolPack } | { ok: false; error: string };
    removePack: (id: string) => void;
}

function loadStored(): ToolPack[] {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        // Re-validate everything: a stored pack from an older editor must not
        // half-load. Broken entries are skipped, not fatal.
        return parsed.flatMap((p) => {
            const result = parseToolPack(p);
            return result.ok ? [result.pack] : [];
        });
    } catch {
        return [];
    }
}

function persist(packs: ToolPack[]): void {
    try {
        localStorage.setItem(KEY, JSON.stringify(packs));
    } catch {
        /* storage full or unavailable: packs stay for this session only */
    }
}

export const usePacks = create<PacksState>((set, get) => ({
    packs: typeof localStorage !== "undefined" ? loadStored() : [],
    loadPack: (raw) => {
        const result = parseToolPack(raw);
        if (!result.ok) return result;
        const rest = get().packs.filter((p) => p.id !== result.pack.id);
        const packs = [...rest, result.pack].sort((a, b) => a.name.localeCompare(b.name));
        set({ packs });
        persist(packs);
        return { ok: true, pack: result.pack };
    },
    removePack: (id) => {
        const packs = get().packs.filter((p) => p.id !== id);
        set({ packs });
        persist(packs);
    },
}));

/** A community event by exact name — feeds the trigger picker's explanation
    and the condition builder's field list. */
export function packEventByName(
    packs: ToolPack[],
    name: string,
): { label: string; docs: string; fields: string[]; packName: string; gameModName: string } | undefined {
    for (const pack of packs) {
        const ev = pack.events.find((e) => e.name === name);
        if (ev)
            return {
                label: ev.label,
                docs: ev.docs,
                fields: ev.fields,
                packName: pack.name,
                gameModName: pack.gameMod.name,
            };
    }
    return undefined;
}

/** Every event the loaded packs declare, in EventPicker shape. */
export function packEvents(packs: ToolPack[]): { name: string; label: string; docs: string; payload: string; packName: string }[] {
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
