/**
 * Project migrations. Drafts older than the current feature set get their
 * raw JSON rewritten before schema validation — e.g. the four separate
 * comms nodes became the single general `comms.dialogue` node, so saved
 * projects carrying the old types keep working.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;

const mapNode = (n: Loose): Loose => {
    switch (n?.type) {
        case "comms.call":
            return {
                ...n,
                type: "comms.dialogue",
                data: {
                    kind: "phone",
                    phone: { branch: n.data?.branch ?? "default", startIndex: n.data?.startIndex ?? 0 },
                },
            };
        case "comms.kisscord":
            return { ...n, type: "comms.dialogue", data: { kind: "kisscord", kisscord: n.data ?? {} } };
        case "comms.mail":
            return { ...n, type: "comms.dialogue", data: { kind: "mail", mail: n.data ?? {} } };
        case "comms.weechat":
            return { ...n, type: "comms.dialogue", data: { kind: "weechat", weechat: n.data ?? {} } };
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
 * Twotter support was removed in round 31 (the game stores a quest account with
 * an undefined `bio`, and Twotter's search crashes on it — see
 * docs/02-editor-shell.md). Older drafts still carry “Post tweet” nodes and a
 * quest-level account list, and a node type the schema no longer knows would
 * fail validation and lose the whole draft. So they are dropped here, along
 * with any wire that pointed at them: the rest of the quest opens fine.
 */
function dropTwotter(q: Loose): Loose {
    const rest = { ...q };
    delete rest.twotterAccounts;
    if (!rest?.graph?.nodes) return rest;
    const gone = new Set(
        rest.graph.nodes.filter((n: Loose) => n?.type === "comms.tweet").map((n: Loose) => n.id),
    );
    if (!gone.size) return rest;
    return {
        ...rest,
        graph: {
            ...rest.graph,
            nodes: rest.graph.nodes.filter((n: Loose) => !gone.has(n?.id)),
            edges: (rest.graph.edges ?? []).filter(
                (e: Loose) => !gone.has(e?.source) && !gone.has(e?.target),
            ),
        },
    };
}

export function migrateProject(raw: unknown): unknown {
    if (typeof raw !== "object" || raw === null) return raw;
    const doc = raw as Loose;
    if (!Array.isArray(doc.quests)) return raw;
    return {
        ...doc,
        quests: doc.quests.map((q: Loose) => {
            const quest = dropTwotter(q);
            return quest?.graph?.nodes
                ? { ...quest, graph: { ...quest.graph, nodes: quest.graph.nodes.map(mapNode) } }
                : quest;
        }),
    };
}
