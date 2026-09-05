/**
 * Shared helpers for building templates.
 *
 * Every template is its own module (`firstContact.ts`, `byline.ts`, …) so a
 * template can grow past the write-size limit that appending to `index.ts`
 * kept hitting (r120). These are the graph-building primitives they all use,
 * lifted verbatim from the original `index.ts` so the behaviour is unchanged.
 *
 * Ids are generated from a module-level counter rather than randomness, so a
 * template builds byte-identically every time and the deterministic-build and
 * snapshot tests stay stable. `resetIds()` is called at the top of every
 * build so two builds of the same template are identical.
 */
import { createQuest, type ProjectDocument } from "@/schema/project";
import { nodeTypeDef, sourcesOf } from "@/schema/registry";
import type { NodeDoc, NodeType } from "@/schema/nodes";
import type { EdgeDoc } from "@/schema/edges";
import { layeredLayout } from "@/analysis/graph";

let counter = 0;

/** Reset the id counter so a build is deterministic. Call at the top of a build. */
export function resetIds(): void {
    counter = 0;
}

function tid(prefix: string): string {
    counter += 1;
    return `${prefix}${counter}`;
}

export function makeNode(
    type: NodeType,
    position: { x: number; y: number },
    data?: Record<string, unknown>,
): NodeDoc {
    const def = nodeTypeDef(type);
    return {
        id: tid(type.replace(/\./g, "-")),
        type,
        position,
        data: { ...def.create(), ...(data ?? {}) },
    } as unknown as NodeDoc;
}

export function makeEdge(
    source: NodeDoc,
    sourceHandle: string,
    target: NodeDoc,
    targetHandle: string,
): EdgeDoc {
    /* Sockets are resolved the way the canvas resolves them, so a Sequence
       node's per-step outputs (step-<id>) are wireable from a template too. */
    const sourceKind = sourcesOf(source).find((h) => h.id === sourceHandle)?.kind;
    const targetKind = nodeTypeDef(target.type).targets.find((h) => h.id === targetHandle)?.kind;
    if (!sourceKind || sourceKind !== targetKind) {
        throw new Error(
            `Template bug: cannot connect ${source.type}.${sourceHandle} (${sourceKind ?? "none"}) to ${target.type}.${targetHandle} (${targetKind ?? "none"})`,
        );
    }
    return {
        id: tid("edge"),
        source: source.id,
        sourceHandle,
        target: target.id,
        targetHandle,
        kind: sourceKind,
    };
}

/**
 * Run the same deterministic layered layout the canvas' "Tidy up" button uses, so
 * a template never opens with two cards on top of each other. Only applied when
 * the graph has wires — the reference sheet is a deliberate grid.
 */
export function applyLayout(quest: ReturnType<typeof createQuest>): void {
    if (quest.graph.edges.length === 0) return;
    const positions = layeredLayout(quest.graph.nodes, quest.graph.edges);
    for (const node of quest.graph.nodes) {
        const position = positions[node.id];
        if (position) node.position = position;
    }
}

/** A trigger wired to the objective it completes — the most common pair. */
export function triggerFor(
    objective: NodeDoc,
    event: string,
    conditions: { field: string; op: string; value: string; join?: "and" | "or" }[],
    position: { x: number; y: number },
): { trigger: NodeDoc; edge: EdgeDoc } {
    const trigger = makeNode("trigger.event", position, {
        /* join defaults to "and"; a clause can ask for "or" when either of two
           values should count — e.g. scanning the router or the machine
           behind it. */
        conditions: conditions.map((c, i) => ({ id: `c${i + 1}`, join: c.join ?? "and", ...c })),
        event,
    });
    return { trigger, edge: makeEdge(trigger, "when", objective, "trigger") };
}

/**
 * A template is a plain `ProjectDocument` factory. It is exercised by the
 * compiler test suite, so it must always parse and — where it has objectives —
 * be completable. `nodeCount` is the number of nodes across every quest, and
 * is asserted by the template tests.
 */
export interface Template {
    id: string;
    name: string;
    description: string;
    difficulty: "Beginner" | "Advanced" | "Expert" | "Reference";
    nodeCount: number;
    build: () => ProjectDocument;
}
