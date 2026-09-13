/**
 * Where the node-search popover sits on screen.
 *
 * Computed from the click point and the viewport, never measured.
 *
 * That is a deliberate reaction to r97–r100, where alignment read sizes back
 * from the DOM, silently received `undefined` in one place and zero in
 * another, and shipped broken three times while every jsdom test passed. The
 * popover's own size is fixed by CSS, so it can be a constant here — and
 * `popoverPlacement.test.ts` asserts these constants against the component,
 * the same guard `nodeSize.test.ts` puts on the node cards.
 */

/** Width of the popover, matching `w-[320px]` on the container. */
export const POPOVER_WIDTH = 320;

/** Height of the search input row, matching `h-9` plus its border. */
export const POPOVER_INPUT_HEIGHT = 38;

/** Height of one result row, matching `h-11` on the option buttons. */
export const POPOVER_ROW_HEIGHT = 44;

/**
 * Most rows shown before the list scrolls.
 *
 * Eight is a judgement call: enough that a typical query shows every hit
 * without scrolling, few enough that the popover cannot run off a laptop
 * screen. Beyond this the list scrolls rather than growing.
 */
export const POPOVER_MAX_ROWS = 8;

/** Breathing room kept between the popover and the window edge. */
const VIEWPORT_MARGIN = 12;

/** Gap between the pointer and the popover's corner. */
const POINTER_OFFSET = 4;

export interface Placement {
    left: number;
    top: number;
    /** Rows the list may show before scrolling, after clamping to the screen. */
    maxRows: number;
    /** True when the popover was flipped to sit above the pointer. */
    flipped: boolean;
}

export interface Viewport {
    width: number;
    height: number;
}

/**
 * Place the popover for a click at `point`.
 *
 * Opens down-right of the pointer, like every context menu. Flips up when
 * there is more room above, shifts left when it would overflow the right
 * edge, and shrinks the visible row count when neither direction has room for
 * the full list — so it always fits rather than running off-screen.
 */
export function placePopover(
    point: { x: number; y: number },
    viewport: Viewport,
    rowCount: number,
): Placement {
    const rowsWanted = Math.min(rowCount, POPOVER_MAX_ROWS);

    // Space for the list, below and above the pointer.
    const below = viewport.height - point.y - POINTER_OFFSET - VIEWPORT_MARGIN - POPOVER_INPUT_HEIGHT;
    const above = point.y - POINTER_OFFSET - VIEWPORT_MARGIN - POPOVER_INPUT_HEIGHT;

    const rowsBelow = Math.max(0, Math.floor(below / POPOVER_ROW_HEIGHT));
    const rowsAbove = Math.max(0, Math.floor(above / POPOVER_ROW_HEIGHT));

    // Prefer downward; flip only when up genuinely fits more.
    const flipped = rowsBelow < rowsWanted && rowsAbove > rowsBelow;
    const maxRows = Math.max(1, Math.min(rowsWanted, flipped ? rowsAbove : rowsBelow));

    const listHeight = maxRows * POPOVER_ROW_HEIGHT;
    const fullHeight = POPOVER_INPUT_HEIGHT + listHeight;

    let left = point.x + POINTER_OFFSET;
    if (left + POPOVER_WIDTH > viewport.width - VIEWPORT_MARGIN) {
        // Shift left of the pointer rather than letting it overflow.
        left = Math.max(VIEWPORT_MARGIN, point.x - POPOVER_WIDTH - POINTER_OFFSET);
    }
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, viewport.width - POPOVER_WIDTH - VIEWPORT_MARGIN));

    let top = flipped ? point.y - POINTER_OFFSET - fullHeight : point.y + POINTER_OFFSET;
    top = Math.max(VIEWPORT_MARGIN, Math.min(top, viewport.height - fullHeight - VIEWPORT_MARGIN));

    return { left, top, maxRows, flipped };
}
