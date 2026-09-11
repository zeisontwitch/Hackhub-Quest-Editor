/**
 * The node palette. Drag a card onto the canvas, or click it to drop it at the
 * centre of the current viewport.
 */
import { useMemo, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import { paletteGroups, type NodeTypeDef } from "@/schema/registry";
import { useEditor } from "@/store/editor";
import { usePacks } from "@/store/packs";
import { packNodeDefs, paletteDefKey } from "@/toolpacks/palette";
import { DND_MIME } from "@/editor/canvas/QuestCanvas";

const GROUPS = paletteGroups();

function PaletteItem({ def }: { def: NodeTypeDef }) {
    const category = GROUPS.find((g) => g.category.id === def.category)!.category;
    const addNode = useEditor((s) => s.addNode);
    const { getViewport } = useReactFlow();

    const addAtCentre = () => {
        const vp = getViewport();
        // Approximate canvas centre in flow coordinates. The palette does not know
        // the viewport pixel size, so this is a good-enough landing spot; the author
        // can drag it, and fitView brings everything back into frame.
        addNode(def.type, { x: (600 - vp.x) / vp.zoom, y: (320 - vp.y) / vp.zoom }, def.addData);
    };

    return (
        <button
            type="button"
            draggable
            onDragStart={(event) => {
                /* Pack nodes carry their snapshot along the drag, so the drop
                   lands a fully set-up node. */
                event.dataTransfer.setData(
                    DND_MIME,
                    def.addData ? JSON.stringify({ type: def.type, data: def.addData }) : def.type,
                );
                event.dataTransfer.effectAllowed = "move";
            }}
            onClick={addAtCentre}
            aria-label={def.label}
            title={`${def.label} — ${def.blurb}. Drag onto the canvas or click to add.`}
            className={cn(
                "group flex w-full cursor-grab items-start gap-2 rounded-md border border-transparent px-2 py-1.5 text-left",
                "transition-colors hover:border-line hover:bg-surface-2 active:cursor-grabbing",
            )}
        >
            <span
                className="mt-px flex size-5 shrink-0 items-center justify-center rounded"
                style={{
                    background: `color-mix(in srgb, ${category.color} 16%, transparent)`,
                    color: category.color,
                }}
                aria-hidden
            >
                <Icon name={def.icon} size={12} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] leading-tight font-medium text-ink-2 group-hover:text-ink">
                    {def.label}
                </span>
                <span className="block truncate text-[10.5px] leading-tight text-ink-4">
                    {def.blurb}
                </span>
            </span>
        </button>
    );
}

export function NodePalette() {
    const [query, setQuery] = useState("");
    const collapsed = useEditor((s) => s.ui.paletteCollapsed);
    const setUi = useEditor((s) => s.setUi);
    const packs = usePacks((s) => s.packs);

    /* One "Editor Mods · <pack>" group per loaded pack that ships nodes. */
    const packGroups = useMemo(
        () =>
            packs
                .filter((p) => p.nodes.length > 0)
                .map((p) => ({
                    category: {
                        id: "community" as const,
                        label: `Editor Mods · ${p.name}`,
                        color: "var(--color-cat-community)",
                    },
                    types: packNodeDefs([p]).map((d) => d.def),
                })),
        [packs],
    );
    const allGroups = useMemo(() => [...GROUPS, ...packGroups], [packGroups]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return allGroups;
        return allGroups
            .map((g) => ({
                ...g,
                types: g.types.filter(
                    (t) =>
                        t.label.toLowerCase().includes(q) ||
                        t.blurb.toLowerCase().includes(q) ||
                        t.type.toLowerCase().includes(q),
                ),
            }))
            .filter((g) => g.types.length > 0);
    }, [query, allGroups]);

    if (collapsed) {
        return (
            <div
                aria-label="Node library"
                className="flex w-10 shrink-0 flex-col items-center gap-2 border-r border-line bg-surface py-2"
            >
                <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setUi({ paletteCollapsed: false })}
                    title="Show node library"
                    aria-label="Show node library"
                >
                    <Icon name="chevronRight" size={14} />
                </button>
                <span
                    className="mt-1 text-[10px] tracking-widest text-ink-4 uppercase"
                    style={{ writingMode: "vertical-rl" }}
                >
                    Nodes
                </span>
            </div>
        );
    }

    return (
        <aside aria-label="Node library" className="flex w-60 shrink-0 flex-col border-r border-line bg-surface">
            <div className="panel-header justify-between">
                <span>Nodes</span>
                <button
                    type="button"
                    className="btn-icon -mr-1 size-6"
                    onClick={() => setUi({ paletteCollapsed: true })}
                    title="Collapse"
                    aria-label="Collapse node library"
                >
                    <Icon name="chevronDown" size={13} className="rotate-90" />
                </button>
            </div>

            <div className="border-b border-line p-2">
                <div className="relative">
                    <Icon
                        name="search"
                        size={13}
                        className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-ink-4"
                    />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Filter nodes"
                        aria-label="Filter nodes"
                        className="field-input pl-7 text-[12px]"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-1.5 py-2">
                {filtered.length === 0 && (
                    <p className="px-2 py-6 text-center text-[11.5px] text-ink-4">Nothing matches “{query}”.</p>
                )}
                {filtered.map((group) => (
                    <section key={group.category.label} className="mb-3">
                        <h3 className="flex items-center gap-1.5 px-2 pb-1 text-[10px] font-semibold tracking-wider text-ink-4 uppercase">
                            <span className="size-1.5 rounded-full" style={{ background: group.category.color }} aria-hidden />
                            {group.category.label}
                        </h3>
                        <div className="space-y-px">
                            {group.types.map((def) => (
                                <PaletteItem key={paletteDefKey(def)} def={def} />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </aside>
    );
}
