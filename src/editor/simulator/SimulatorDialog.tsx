/**
 * The Dry run dialog: what the author's quest actually does, before export.
 *
 * Runs the emitted `dist/mod.js` against a recording stub SDK (the pure
 * harness in `@/compiler/simulate`) and shows the trace, each objective's
 * completion route, and whether every event trigger would really match.
 *
 * The honesty caption is not decoration: this simulates the editor's own
 * runtime. It cannot see the game's renderer, its event firing, or its
 * clock — in-game QA stays the final judge.
 */
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { simulateProject, type SimObjective, type SimReport } from "@/compiler/simulate";
import { useEditor } from "@/store/editor";

const PROBE_BADGE: Record<NonNullable<SimObjective["probe"]>, { label: string; className: string }> = {
    match: { label: "would tick", className: "bg-ok/15 text-ok" },
    "no-match": { label: "would never tick", className: "bg-danger/15 text-danger" },
    "unknown-event": { label: "unknown event", className: "bg-warn/15 text-warn" },
    internal: { label: "internal beat", className: "bg-surface-2 text-ink-3" },
};

function ObjectiveRow({ o }: { o: SimObjective }) {
    const badge = o.probe ? PROBE_BADGE[o.probe] : null;
    return (
        <div className="grid gap-0.5 border-b border-line px-3 py-1.5 text-[11px] leading-relaxed last:border-b-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-medium text-ink">{o.description || o.name}</span>
                {o.route === "trigger" && o.event && (
                    <span className="font-mono text-[10px] text-ink-4">{o.event}</span>
                )}
                {badge && <span className={`rounded px-1.5 py-px text-[10px] font-semibold ${badge.className}`}>{badge.label}</span>}
            </div>
            {o.probeNote && <div className="text-ink-3">{o.probeNote}</div>}
        </div>
    );
}

export function SimulatorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
    const [report, setReport] = useState<SimReport | null>(null);
    const [running, setRunning] = useState(false);

    const run = async () => {
        setRunning(true);
        try {
            setReport(await simulateProject(useEditor.getState().project));
        } finally {
            setRunning(false);
        }
    };

    useEffect(() => {
        if (open) void run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const problems = report ? [...report.errors, ...report.warnings] : [];

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-void/70 backdrop-blur-[2px]" />
                <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex h-[86vh] w-[min(860px,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-panel">
                    <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
                        <div>
                            <Dialog.Title className="text-[13.5px] font-semibold text-ink">Dry run</Dialog.Title>
                            <Dialog.Description className="mt-0.5 text-[11px] leading-relaxed text-ink-3">
                                Your quest as the exported mod would run it — which nodes fire, what the world
                                looks like, and whether every objective can really be completed. This simulates
                                the editor's own runtime: the game itself stays the final judge.
                            </Dialog.Description>
                        </div>
                        <button type="button" className="btn-default" onClick={() => void run()} disabled={running}>
                            <Icon name="play" size={13} />
                            {running ? "Running…" : "Run again"}
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {problems.length > 0 && (
                            <div className="border-b border-line bg-warn/5 px-4 py-2">
                                {problems.map((p, i) => (
                                    <p key={i} className="text-[11px] leading-relaxed text-warn">
                                        ⚠ {p}
                                    </p>
                                ))}
                            </div>
                        )}

                        {!report && !running && (
                            <p className="px-4 py-6 text-center text-[11.5px] text-ink-3">
                                Press “Run again” to walk through the quest.
                            </p>
                        )}

                        {report?.quests.map((q) => (
                            <section key={q.name} className="border-b border-line">
                                <header className="flex items-baseline gap-2 bg-surface-2/60 px-4 py-2">
                                    <h3 className="text-[12px] font-semibold text-ink">{q.title || q.name}</h3>
                                    {q.errors.map((e, i) => (
                                        <span key={i} className="text-[10.5px] text-danger">
                                            ✗ {e}
                                        </span>
                                    ))}
                                </header>

                                {q.trace.length > 0 && (
                                    <div className="border-b border-line px-4 py-2">
                                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-4">
                                            What happens, in order
                                        </p>
                                        <ol className="grid gap-0.5">
                                            {q.trace.map((t, i) => (
                                                <li key={i} className="flex items-baseline gap-2 text-[11px] leading-relaxed text-ink-2">
                                                    <span className="w-4 shrink-0 text-right font-mono text-[9.5px] text-ink-4">{i + 1}</span>
                                                    <span>{t.text}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}

                                {q.objectives.length > 0 && (
                                    <div className="px-0 py-0">
                                        <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-4">
                                            How each objective completes
                                        </p>
                                        {q.objectives.map((o) => (
                                            <ObjectiveRow key={o.name + o.description} o={o} />
                                        ))}
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
