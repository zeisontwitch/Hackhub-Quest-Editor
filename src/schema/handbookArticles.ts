/**
 * In-game Handbook pages the "Open handbook" node can jump to.
 *
 * HONESTY NOTE: the SDK exposes no article list — `Handbook.open(id)` takes an
 * id, but nothing says what the base game's ids are. The five pages below are
 * titles Zeis verified searchable in the in-game Handbook, and the working
 * hypothesis is that the id IS the title, verbatim. That hypothesis is
 * UNCONFIRMED until a quest opening one of these is played in-game.
 *
 * If the probe disproves it (e.g. ids turn out to be slugs), update the `id`
 * fields here — the picker and the compiler read `id`, never `title`. To grow
 * the list, add `{ id, title }` pairs from a Handbook sidebar screenshot.
 */
export interface HandbookArticle {
    /** Passed to `Handbook.open()`. Currently the title verbatim (unconfirmed). */
    id: string;
    /** Shown in the picker. */
    title: string;
}

export const HANDBOOK_ARTICLES: HandbookArticle[] = [
    { id: "Port Forwarding: Start Here", title: "Port Forwarding: Start Here" },
    { id: "Router Fields Explained", title: "Router Fields Explained" },
    { id: "Firewall → Router → Device", title: "Firewall → Router → Device" },
    { id: "Game Walkthrough: Expose Target SSH", title: "Game Walkthrough: Expose Target SSH" },
    { id: "Game Walkthrough: Reverse TCP Forward", title: "Game Walkthrough: Reverse TCP Forward" },
];
