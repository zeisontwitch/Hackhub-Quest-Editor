/**
 * Ranking for the add-a-node search.
 *
 * Pure: no React, no DOM, no store. Ranking is where the feel of a search box
 * actually lives, so it is testable on its own.
 *
 * Searches the same three fields the left-hand palette searches — label, blurb
 * and type id — so an author who has learned one has learned the other. The
 * ordering is the part the palette does not do: a plain `includes` filter puts
 * a node whose *blurb* happens to mention "mail" above the node actually called
 * Mail, which reads as broken.
 */
import type { NodeTypeDef } from "@/schema/registry";
import { paletteGroups } from "@/schema/registry";

/**
 * Every addable node type, in palette order.
 *
 * Deliberately the same source as the palette: whatever the palette offers,
 * search offers. Two lists that could disagree about what exists would be a
 * bug waiting to happen.
 */
export function allNodeTypes(): NodeTypeDef[] {
    return paletteGroups().flatMap((g) => g.types);
}

/** Why a node matched, best first. Exported for tests to assert ordering. */
export enum MatchRank {
    LabelPrefix = 0,
    LabelContains = 1,
    TypeContains = 2,
    BlurbContains = 3,
    None = 4,
}

/** How well one node type matches a lowercased query. */
export function rankOf(def: NodeTypeDef, query: string): MatchRank {
    const label = def.label.toLowerCase();
    if (label.startsWith(query)) return MatchRank.LabelPrefix;
    if (label.includes(query)) return MatchRank.LabelContains;
    if (def.type.toLowerCase().includes(query)) return MatchRank.TypeContains;
    if (def.blurb.toLowerCase().includes(query)) return MatchRank.BlurbContains;
    return MatchRank.None;
}

/**
 * The node types matching `query`, best match first.
 *
 * An empty query returns everything in palette order, which is what the
 * popover shows before the author types anything.
 *
 * Ties keep palette order: a stable list is learnable, and an author who has
 * seen "Dialogue" third for a given query should see it third next time.
 */
export function searchNodeTypes(query: string, pool = allNodeTypes()): NodeTypeDef[] {
    const q = query.trim().toLowerCase();
    if (!q) return pool;

    const scored: { def: NodeTypeDef; rank: MatchRank; order: number }[] = [];
    pool.forEach((def, order) => {
        const rank = rankOf(def, q);
        if (rank !== MatchRank.None) scored.push({ def, rank, order });
    });

    scored.sort((a, b) => a.rank - b.rank || a.order - b.order);
    return scored.map((s) => s.def);
}

/**
 * Move a highlight through `length` items, wrapping at both ends.
 *
 * Wrapping matters: pressing Down on the last row should reach the first
 * again rather than dead-ending, which is what every command palette does.
 */
export function moveHighlight(current: number, delta: number, length: number): number {
    if (length === 0) return 0;
    return (((current + delta) % length) + length) % length;
}
