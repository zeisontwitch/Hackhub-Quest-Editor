/**
 * The tool packs the user has dropped into this editor.
 *
 * Packs are machine-local: they persist in this browser (their own localStorage
 * key, like the autosave draft) but are NOT part of the project document — a
 * project references pack data by id and stores its own values, so it stays
 * portable and compiles even where the pack is not loaded. No undo history:
 * loading and removing packs is not story editing.
 *
 * Pure helpers (palette synthesis, event lookup) live in `toolpacks/palette.ts`
 * (AR5/AR6). This file is only persistence + the Zustand store.
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

// Re-export pure helpers from their feature module for backwards compat.
// New code should import from `@/toolpacks/palette` directly (AR5).
export { packEventByName, packEvents, packNodeDefs, paletteDefKey } from "@/toolpacks/palette";
