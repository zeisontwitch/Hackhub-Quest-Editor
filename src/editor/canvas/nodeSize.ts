/**
 * How big a node card is, computed rather than measured.
 *
 * Alignment needs each card's size, and three rounds of trying to read it back
 * from the DOM failed: our own `measured` map was empty at click time, and
 * React Flow's `nodeLookup` is only populated once its ResizeObserver has run
 * — which is never in tests and is not guaranteed at any particular moment in
 * the browser. Every alignment then silently fell back to size 0, which turns
 * "line up the centres" into "line up the top-left corners".
 *
 * The cards do not need measuring. Their geometry is fixed by the same
 * constants the component renders with:
 *
 *   - width is the Tailwind `w-60` on the card, i.e. 240px, for every node
 *     except a Note (author-resizable) and a Frame (explicitly sized);
 *   - height is the `minHeight` formula in GraphNode plus the summary block,
 *     which is capped at three lines.
 *
 * These constants are asserted against the component in nodeSize.test.ts, so a
 * change to the card layout fails the build here rather than quietly skewing
 * alignment again.
 */
import type { NodeDoc } from "@/schema/nodes";
import { nodeTypeDef, sourcesOf } from "@/schema/registry";
import { summarize } from "./summarize";
import type { QuestDoc } from "@/schema/project";

/** `w-60` on the card: 15rem at the default 16px root font size. */
export const CARD_WIDTH = 240;

/** GraphNode's `minHeight` base, before the per-socket growth. */
export const CARD_MIN_HEIGHT = 48;

/** Extra height per socket beyond the second, matching GraphNode. */
export const SOCKET_ROW_HEIGHT = 26;

/** Height of the title row: py-2.5 twice plus a 12.5px/leading-tight line. */
const HEADER_HEIGHT = 35;

/** Each summary line: 11px text at leading-snug, plus the 2px row gap. */
const SUMMARY_LINE_HEIGHT = 16;

/** Padding under the summary block (`pb-2.5`). */
const SUMMARY_PADDING = 10;

/** At most three summary lines are rendered (`lines.slice(0, 3)`). */
const MAX_SUMMARY_LINES = 3;

/** Default size of a Note, whose width the author can drag. */
const NOTE_WIDTH = 240;
const NOTE_LINE_HEIGHT = 18;
const NOTE_PADDING = 20;

export interface Size {
    width: number;
    height: number;
}

/**
 * The rendered size of a node card.
 *
 * `quest` is optional and only affects summary text, which can change how many
 * lines a card shows; without it the size is still correct to within a line.
 */
export function nodeSize(doc: NodeDoc, quest?: QuestDoc): Size {
    if (doc.type === "layout.group") {
        const data = doc.data as { width?: number; height?: number };
        return { width: data.width ?? 360, height: data.height ?? 240 };
    }

    if (doc.type === "flow.note") {
        const data = doc.data as { text?: string; width?: number };
        const width = data.width ?? NOTE_WIDTH;
        // Rough, and deliberately so: a note is free-form text and never
        // participates meaningfully in alignment.
        const lines = Math.max(1, (data.text ?? "").split("\n").length);
        return { width, height: NOTE_PADDING + lines * NOTE_LINE_HEIGHT };
    }

    if (doc.type === "flow.reroute") {
        // A bare nodule: no card, just the socket.
        return { width: 16, height: 16 };
    }

    const def = nodeTypeDef(doc.type);
    const sources = sourcesOf(doc);
    const sockets = Math.max(sources.length, def.targets.length);
    const socketHeight = CARD_MIN_HEIGHT + Math.max(0, sockets - 2) * SOCKET_ROW_HEIGHT;

    const lines = summarize(doc, quest).filter(Boolean).slice(0, MAX_SUMMARY_LINES);
    const contentHeight =
        HEADER_HEIGHT +
        (lines.length > 0 ? lines.length * SUMMARY_LINE_HEIGHT + SUMMARY_PADDING : 0);

    return { width: CARD_WIDTH, height: Math.max(socketHeight, contentHeight) };
}
