/**
 * Project migrations. Drafts older than the current feature set get their
 * raw JSON rewritten before schema validation — e.g. the four separate
 * comms nodes became the single general `comms.dialogue` node, so saved
 * projects carrying the old types keep working.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;

/** r176's `offsetUnit` values to r177's per-unit box names. */
const TIMER_BOX_KEYS: Record<string, string> = {
    days: "Days",
    weeks: "Weeks",
    months: "Months",
    years: "Years",
};

const mapNode = (n: Loose): Loose => {
    switch (n?.type) {
        case "comms.call":
            return {
                ...n,
                type: "comms.dialogue",
                data: {
                    kind: "phone",
                    phone: { branch: n.data?.branch ?? "default", startIndex: n.data?.startIndex ?? 0, continueMode: "onEnd" },
                },
            };
        case "comms.kisscord":
            return { ...n, type: "comms.dialogue", data: { kind: "kisscord", kisscord: n.data ?? {} } };
        case "comms.mail":
            return { ...n, type: "comms.dialogue", data: { kind: "mail", mail: n.data ?? {} } };
        case "comms.weechat":
            return { ...n, type: "comms.dialogue", data: { kind: "weechat", weechat: n.data ?? {} } };
        case "flow.schedule":
            // "Schedule beat" became "Timer" in round 173 (the id moved
            // `flow.schedule` → `flow.timer`). A draft, or an exported
            // project, written by r172 must still open — the delay fields are
            // unchanged, and `mode` plus the calendar fields are new, so they
            // take their schema defaults.
            return { ...n, type: "flow.timer" };
        case "flow.timer":
            // r176 briefly modelled the coming-day offset as an amount plus a
            // unit; r177 gave every unit its own box. A project saved in that
            // window keeps its meaning — the same number, in the box for the
            // unit it was counted in. (The pre-r176 `offsetDays` key kept its
            // name through both rounds, so those drafts need no rewrite.)
            if (n.data && n.data.offsetAmount !== undefined) {
                const data = { ...n.data };
                const amount = Number(data.offsetAmount);
                const key = `offset${TIMER_BOX_KEYS[String(data.offsetUnit ?? "days")] ?? "Days"}`;
                delete data.offsetAmount;
                delete data.offsetUnit;
                return {
                    ...n,
                    data: {
                        ...data,
                        [key]: Number.isFinite(amount) ? amount : 0,
                    },
                };
            }
            return n;
        case "flow.delay":
            // ms → seconds (round 19)
            if (n.data && n.data.ms != null && n.data.seconds == null) {
                return { ...n, data: { ...n.data, seconds: Number(n.data.ms) / 1000 } };
            }
            return n;
        case "fx.pay":
        case "fx.withdraw":
            // amountMode/percent added in round 19 — old drafts are fixed-amount
            return { ...n, data: { amountMode: "fixed", percent: 10, ...n.data } };
        default:
            return n;
    }
};

/**
 * Twotter came back in round 185, after the r179 probe proved the API path
 * safe (the record shape that crashed the game's search is guarded now, and
 * accounts can be removed again).
 *
 * Round 31 had *dropped* every “Post tweet” node and the quest-level account
 * list, because a node type the schema no longer knew would fail validation
 * and lose the whole draft. That is the wrong thing to do to the same drafts
 * now that the feature is back: somebody's r30 work would open with its tweets
 * silently deleted. So `dropTwotter` became `mapTwotter` — the same nodes,
 * rewritten into the r185 shape.
 *
 * What maps to what (the old node's fields, in the order they matter):
 *
 * - the quest's `twotterAccounts[]` move up to the MOD level, keeping their
 *   ids so the nodes below still resolve; a second quest declaring the same
 *   handle is folded onto the same account.
 * - `content`, `image`, `likes` / `comments` / `shares` / `views` and
 *   `showInTimeline` become the single tweet row's fields.
 * - the TIME is what mapped least directly. The old node decided it three
 *   ways — `timeMode: "now" | "relative" | "absolute"` — while the new one
 *   asks whether the tweet arrives with the story or was already on the
 *   profile. "now" becomes **arrival** (post it when the story reaches the
 *   node — the old "live" behaviour, and for a node at the quest's start the
 *   same thing the declarative path did). "relative" keeps its number and unit
 *   ("2 days" → 2 days earlier). "absolute" and an unreadable "relative" have
 *   no counterpart at all: a fixed real-world date cannot survive as an age
 *   without the editor reading today's clock before export, which it
 *   deliberately never does, so they land on **1 month earlier** and the node
 *   is marked `migratedDate` — the export report names it so the author can
 *   pick the age they actually meant. The old default (`postLive` off, no time
 *   fields) lands there too: those tweets were posted at quest load and were
 *   already on the profile, and their age cannot be recovered.
 * - `postLive` has no counterpart and is dropped: every tweet now posts
 *   through the same API when the flow reaches the node, so the distinction
 *   the old flag drew (declarative vs live) no longer exists.
 */

/**
 * "2 days" / "1 month" → amount + unit, or null when it does not parse.
 *
 * The unit comes back PLURAL, which is what the schema's enum holds — the old
 * field was written by hand ("3h", "2 days", "a month") and accepted whatever
 * the game's date parser would take, so anything unreadable has to fall back
 * rather than reach a schema that would reject the whole document.
 */
function parseAgo(value: unknown): { amount: number; unit: string } | null {
    const match = /^\s*(\d+)\s*(minute|hour|day|week|month|year)s?\s*$/i.exec(String(value ?? ""));
    if (!match) return null;
    const amount = Number(match[1]);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return { amount, unit: `${match[2]!.toLowerCase()}s` };
}

/**
 * The r31-era node data → one r185 tweet row.
 *
 * Returns the row and whether the migration had to guess its time. Guessing is
 * not a failure — it is the one case the author has to look at, and the caller
 * marks the node so the export report can say so.
 */
function mapTweetRow(data: Loose, fallbackId: string): { row: Record<string, unknown>; guessedTime: boolean } {
    const row: Record<string, unknown> = {
        /* Deterministic: a random id would make the same file migrate
           differently twice, which turns every migration test into a coin
           toss and churns the autosaved draft. */
        id: String(data?.id ?? fallbackId),
        content: String(data?.content ?? ""),
        likes: Math.max(0, Number(data?.likes ?? 0) || 0),
        comments: Math.max(0, Number(data?.comments ?? 0) || 0),
        shares: Math.max(0, Number(data?.shares ?? 0) || 0),
        views: Math.max(0, Number(data?.views ?? 0) || 0),
        showInTimeline: data?.showInTimeline === true,
    };
    if (data?.image) row.image = data.image;

    /* Where the old node's time lands, and why each one lands there:
     *
     *   a readable "2 days"             → that same age, kept exactly
     *   a fixed calendar date           → "1 month earlier", flagged
     *   an age that does not parse      → "1 month earlier", flagged
     *   "now", or postLive true         → arrives with the story
     *   nothing at all (the old default)→ "1 month earlier", flagged
     *
     * The last line is the old DEFAULT (postLive was off), and it is the one
     * worth explaining: the declarative path posted the tweet when the quest
     * loaded, so it was already sitting on the profile — which is what
     * "earlier" means now. Its age was whatever the game's clock said at load
     * time, which nothing can recover; a month is the honest stand-in for "was
     * already there, age unknown", and the flag is what stops it being a
     * silent change to somebody's draft.
     */
    const now = data?.timeMode === "now" || data?.postLive === true;
    const ago = parseAgo(data?.postedAgo);

    if (now) {
        row.timeMode = "arrival";
        row.agoAmount = 2;
        row.agoUnit = "days";
        return { row, guessedTime: false };
    }
    row.timeMode = "earlier";
    /* The r30 shape carried the age in `postedAgo` and nothing else — no
       timeMode at all — so the age is read from that field whatever else the
       node says. */
    if (ago) {
        row.agoAmount = ago.amount;
        row.agoUnit = ago.unit;
        return { row, guessedTime: false };
    }
    row.agoAmount = 1;
    row.agoUnit = "months";
    return { row, guessedTime: true };
}

/**
 * Rewrites every “Post tweet” node into the r185 shape, and returns the
 * accounts the quest used to declare so the caller can lift them to mod level.
 */
function mapTwotter(q: Loose): { quest: Loose; accounts: Loose[]; remap: Map<string, string> } {
    const rest = { ...q };
    const declared: Loose[] = Array.isArray(rest.twotterAccounts) ? rest.twotterAccounts : [];
    delete rest.twotterAccounts;

    const accounts: Loose[] = [];
    const remap = new Map<string, string>();
    declared.forEach((a: Loose, i: number) => {
        const id = String(a?.id ?? `twotter-account-${i}`);
        accounts.push({
            id,
            handle: String(a?.username ?? a?.handle ?? "account"),
            displayName: String(a?.displayName ?? ""),
            /* Always a string: a blank bio is "", never undefined — the whole
               point of the r185 fence. */
            bio: String(a?.bio ?? ""),
            ...(a?.avatar ? { avatar: String(a.avatar) } : {}),
            verified: a?.verified === true,
            followers: Math.max(0, Number(a?.followers ?? 0) || 0),
            following: Math.max(0, Number(a?.following ?? 0) || 0),
            removeWhenQuestEnds: true,
        });
        remap.set(id, id);
    });

    if (!rest?.graph?.nodes) return { quest: rest, accounts, remap };

    const nodes = rest.graph.nodes.map((n: Loose) => {
        if (n?.type !== "comms.tweet") return n;
        const data = n.data ?? {};
        /* Already the r185 shape — a project saved by this editor, a template,
           or a file that has been through the migration once. Mapping it again
           would throw the author's rows away and replace them with the single
           guessed one, which is exactly the bug this guard exists to prevent. */
        if (Array.isArray(data.tweets)) return n;
        const mapped = mapTweetRow(data, `${String(n.id)}-t1`);
        return {
            ...n,
            data: {
                accountId: String(data.accountId ?? ""),
                tweets: [mapped.row],
                /* Read by the export report and by an inspector note: this
                   tweet's time could not be carried over faithfully, so it
                   needs a human eye. */
                ...(mapped.guessedTime ? { migratedDate: true } : {}),
            },
        };
    });

    return { quest: { ...rest, graph: { ...rest.graph, nodes } }, accounts, remap };
}

export function migrateProject(raw: unknown): unknown {
    if (typeof raw !== "object" || raw === null) return raw;
    const doc = raw as Loose;
    if (!Array.isArray(doc.quests)) return raw;

    /* Quest-level Twotter accounts move up to the mod, where accounts live now
       (r185). Two quests that declared the same handle — the same character
       appearing in two acts, which is exactly what the old per-quest shape made
       people do — fold onto one account, and the second quest's nodes are
       pointed at it. */
    const accounts: Loose[] = Array.isArray(doc.twotterAccounts) ? [...doc.twotterAccounts] : [];
    const byHandle = new Map<string, string>();

    const quests = doc.quests.map((q: Loose) => {
        const mapped = mapTwotter(q);
        const remap = new Map<string, string>();
        for (const account of mapped.accounts) {
            const handle = String(account.handle ?? "").toLowerCase();
            const existing = byHandle.get(handle);
            if (existing) {
                /* Same handle: keep the account already lifted and re-point
                   this quest's nodes at it. */
                remap.set(String(account.id), existing);
                continue;
            }
            byHandle.set(handle, String(account.id));
            remap.set(String(account.id), String(account.id));
            accounts.push(account);
        }
        const quest = mapped.accounts.length
            ? {
                  ...mapped.quest,
                  graph: {
                      ...mapped.quest.graph,
                      nodes: (mapped.quest.graph?.nodes ?? []).map((n: Loose) =>
                          n?.type === "comms.tweet" && remap.has(String(n.data?.accountId))
                              ? { ...n, data: { ...n.data, accountId: remap.get(String(n.data.accountId)) } }
                              : n,
                      ),
                  },
              }
            : mapped.quest;
        return quest?.graph?.nodes
            ? { ...quest, graph: { ...quest.graph, nodes: quest.graph.nodes.map(mapNode) } }
            : quest;
    });

    return { ...doc, quests, twotterAccounts: accounts };
}
