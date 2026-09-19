/**
 * In-game Handbook pages the "Open handbook" node can jump to.
 *
 * HONESTY NOTE: the SDK exposes no article list — `Handbook.open(id)` takes an
 * id, but nothing says what the base game's ids are. The five pages below are
 * titles Zeis verified searchable in the in-game Handbook, and the hypothesis
 * that the id IS the title was **disproved in game on 2026-09-19**: both the
 * `Open handbook` node's and the click action's call to
 * `Handbook.open("Port Forwarding: Start Here")` opened the handbook and landed
 * on its own landing page. The call is accepted and does nothing visible beyond
 * that — no error, no article.
 *
 * So the picker still offers these five (they are at least real pages) and the
 * field still takes typed text, but the editor does not pretend the id is known:
 * the runtime logs what was asked for and that the game lands on the landing
 * page, and `docs/03-questions-for-the-developers.md` asks how to reach an
 * article (Q15). When that answer arrives, replace the `id` values here — the
 * picker and the compiler read `id`, never `title`.
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
