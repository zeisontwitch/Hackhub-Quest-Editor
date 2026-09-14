/**
 * The editor shell: palette → canvas → inspector, with the top bar and status
 * bar framing it. Panels collapse so the canvas can take the whole window on a
 * small screen.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { QuestCanvas } from "@/editor/canvas/QuestCanvas";
import { NodePalette } from "@/editor/palette/NodePalette";
import { InspectorPanel } from "@/editor/inspector/InspectorPanel";
import { FloatingInspector } from "@/editor/inspector/FloatingInspector";
import { InspectorDockHandle } from "@/editor/inspector/InspectorDockHandle";
import { inspectorMode, subscribeInspectorLayout } from "@/editor/inspector/drawerLayout";
import { StatusBar } from "@/editor/shell/StatusBar";
import { TopBar } from "@/editor/shell/TopBar";
import { Overlays, Toast } from "@/editor/shell/Overlays";
import { useEditor } from "@/store/editor";
import { startAutosave } from "@/store/autosave";
import { TEMPLATES } from "@/templates";

export default function App() {
    const inspectorCollapsed = useEditor((s) => s.ui.inspectorCollapsed);
    const setUi = useEditor((s) => s.setUi);
    const mode = useSyncExternalStore(subscribeInspectorLayout, inspectorMode, inspectorMode);
    const floating = mode === "floating";
    const nodeCount = useEditor((s) => {
        const quest = s.project.quests.find((q) => q.id === s.project.editor.activeQuestId);
        return quest?.graph.nodes.length ?? 0;
    });

    useKeyboardShortcuts();

    // Hydrate the draft once, then persist on change.
    useEffect(() => startAutosave(), []);

    return (
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-void text-ink">
            <TopBar />

            {/* One React Flow store for the palette, canvas and inspector: the
                palette asks the canvas where its centre is before placing a node. */}
            <ReactFlowProvider>
            <div className="flex min-h-0 flex-1">
                {/* The palette owns its own collapse rail, so it is not wrapped. */}
                <NodePalette />

                {/* canvas */}
                <main className="relative min-w-0 flex-1">
                    <QuestCanvas />
                    {nodeCount === 0 && <FirstRunHint onPick={() => setUi({ modal: "templates" })} />}
                </main>

                {/* inspector — docked to the right edge unless the author has
                    popped it out into a floating drawer (r158). When floating,
                    the aside is not rendered at all so the canvas takes the full
                    width, and <FloatingInspector /> draws over the shell. */}
                {!floating && (
                    <aside
                        aria-label="Inspector"
                        className={cn(
                            "relative flex shrink-0 flex-col border-l border-line bg-surface transition-[width] duration-200",
                            inspectorCollapsed ? "w-10" : "w-[340px]",
                        )}
                    >
                        {inspectorCollapsed ? (
                            <button
                                type="button"
                                className="flex h-full w-10 flex-col items-center gap-2 pt-3 text-ink-4 hover:text-ink-2"
                                onClick={() => setUi({ inspectorCollapsed: false })}
                                title="Show inspector"
                                aria-label="Show inspector"
                            >
                                <Icon name="panelLeft" size={15} />
                                <span className="text-[10px] tracking-wider [writing-mode:vertical-rl]">
                                    INSPECTOR
                                </span>
                            </button>
                        ) : (
                            <>
                                {/* The grab handle on the left edge — drag it to
                                    pull the inspector out, or click to float it.
                                    This is the affordance authors reach for; the
                                    small icon button that shipped in r158 went
                                    unfound (r159). */}
                                <InspectorDockHandle />

                                {/* The collapse control lives at the right of the
                                    tab bar — at the left it sat on top of the
                                    "Node" tab and made it unclickable. Floating is
                                    the left-edge handle's job now. */}
                                <button
                                    type="button"
                                    className="btn-icon absolute top-1.5 right-2 z-10"
                                    onClick={() => setUi({ inspectorCollapsed: true })}
                                    title="Hide inspector"
                                    aria-label="Hide inspector"
                                >
                                    <Icon name="panelRight" size={14} />
                                </button>
                                <InspectorPanel />
                            </>
                        )}
                    </aside>
                )}
            </div>
            {floating && <FloatingInspector />}
            </ReactFlowProvider>

            <StatusBar />
            <Overlays />
            <Toast />
        </div>
    );
}

/**
 * Shown over an empty canvas. An empty grid with no instruction is where no-code
 * tools lose people, so the first thing on screen is the two ways forward.
 */
function FirstRunHint({ onPick }: { onPick: () => void }) {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;

    const starter = TEMPLATES[1];

    return (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
            <div className="panel pointer-events-auto max-w-md p-5 text-center">
                <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Icon name="terminal" size={20} />
                </span>
                <h2 className="text-[15px] font-semibold text-ink">Build a HackHub quest</h2>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-3">
                    Drag nodes from the left onto the canvas, then wire their sockets together.
                    Every field on the right is a dropdown or a switch — no JSON, no code.
                </p>

                <div className="mt-4 flex flex-col gap-2">
                    <button type="button" className="btn-primary w-full justify-center" onClick={onPick}>
                        <Icon name="layers" size={13} />
                        Browse {TEMPLATES.length} templates
                    </button>
                    <p className="text-[11px] text-ink-4">
                        or press{" "}
                        <kbd className="kbd">Ctrl</kbd> + <kbd className="kbd">Z</kbd> to undo
                        anything — nothing here is destructive.
                    </p>
                </div>

                <button
                    type="button"
                    className="mt-4 text-[11px] text-ink-4 underline-offset-2 hover:text-ink-2 hover:underline"
                    onClick={() => setDismissed(true)}
                >
                    Start from scratch ({starter.name} is the smallest template)
                </button>
            </div>
        </div>
    );
}
