/**
 * The tags a `tokens: true` field can insert — `{{data.name}}` and friends.
 *
 * Every suggestion says what it produces, because a tag the author cannot
 * picture is a tag they will not trust. Availability mirrors the runtime
 * exactly: the conditions below quote `runtimeSource.ts` (`needsTargetIp`,
 * `needsGateway`) and the scope it fills tokens from, so the picker never
 * offers a tag the game would fill with "".
 */
export interface TokenSuggestion {
    token: string;
    label: string;
    /** What the player sees where the tag was, in plain words. */
    produces: string;
    group: "Saved values" | "Network" | "Player" | "Random";
}

interface GraphNodeLike {
    id: string;
    type: string;
    data: unknown;
}

function truncateOneLine(value: string, max: number): string {
    const flat = value.replace(/\s+/g, " ").trim();
    return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

export function listTokenSuggestions(
    quest: { graph: { nodes: GraphNodeLike[] } } | null | undefined,
    currentNodeId: string,
): TokenSuggestion[] {
    const out: TokenSuggestion[] = [];
    const seen = new Set<string>();
    const nodes = quest?.graph.nodes ?? [];

    // Saved values first — they are the quest's own vocabulary. The current
    // node is skipped so "Set quest data" cannot offer its own key back to
    // its own Value box. Dotted keys are skipped too: the runtime splits tags
    // on ".", so {{data.a.b}} looks up a→b, never the flat key "a.b".
    for (const n of nodes) {
        if (n.type !== "fx.setData" || n.id === currentNodeId) continue;
        const data = (n.data ?? {}) as { key?: unknown; value?: unknown };
        const key = typeof data.key === "string" ? data.key.trim() : "";
        if (!key || key.includes(".") || key.includes("{") || key.includes("}")) continue;
        const token = `{{data.${key}}}`;
        if (seen.has(token)) continue;
        seen.add(token);
        const value = typeof data.value === "string" ? data.value : "";
        out.push({
            token,
            label: key,
            produces: value
                ? `“${truncateOneLine(value, 48)}”`
                : `whatever was saved as “${key}”`,
            group: "Saved values",
        });
    }

    // The runtime seeds targetIp for any quest with a network or wifi node:
    // ipMode parses to "random" unconditionally (nodes.ts), so the runtime's
    // `n.data.ipMode === "random"` check is really an existence check.
    const hasNetwork = nodes.some((n) => n.type === "world.network" || n.type === "world.wifi");
    if (hasNetwork) {
        out.push({
            token: "{{data.targetIp}}",
            label: "Network address",
            produces: "e.g. 10.24.7.3 — the address the game gave your network",
            group: "Network",
        });
        // gatewayIp exists only when a network's top machine is not a router
        // and the game wraps it in one (r77) — same test as the runtime.
        const needsGateway = nodes.some(
            (n) =>
                n.type === "world.network" &&
                String(
                    ((n.data as { device?: { type?: unknown } } | null)?.device?.type) ?? "",
                ).toUpperCase() !== "ROUTER",
        );
        if (needsGateway) {
            out.push({
                token: "{{data.gatewayIp}}",
                label: "Wrapper router",
                produces: "the address of the router the game wraps a lone machine in",
                group: "Network",
            });
        }
    }

    // Player and Random are computed fresh by the runtime on every fill.
    out.push(
        { token: "{{player.username}}", label: "Player login", produces: "the player's login name", group: "Player" },
        { token: "{{player.ip}}", label: "Player address", produces: "the player's own IP address", group: "Player" },
        { token: "{{player.email}}", label: "Player e-mail", produces: "the player's e-mail address", group: "Player" },
        { token: "{{random.password}}", label: "Fresh password", produces: "a new password, different every time", group: "Random" },
        { token: "{{random.username}}", label: "Fresh name", produces: "a new random name, different every time", group: "Random" },
        { token: "{{random.ip}}", label: "Fresh address", produces: "a new random address, different every time", group: "Random" },
    );
    return out;
}
