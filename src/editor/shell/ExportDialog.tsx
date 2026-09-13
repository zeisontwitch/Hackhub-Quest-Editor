/**
 * Step 4 export: compiles the project into a build-free HackHub mod folder
 * (manifest.json + dist/mod.js + scaffolding) and zips it for download.
 * Non-coders get a folder they can drop into the game's mods/ directory.
 */
import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import JSZip from "jszip";
import { compileProject, type CompileResult } from "@/compiler/compile";
import { Icon } from "@/components/Icon";
import { WarningList } from "@/components/WarningList";
import { useEditor } from "@/store/editor";
import { usePacks } from "@/store/packs";

export async function buildModZip(result: CompileResult, rootName: string): Promise<JSZip> {
    const zip = new JSZip();
    const root = zip.folder(rootName)!;
    for (const f of result.files) root.file(f.path, f.content, f.base64 ? { base64: true } : undefined);
    return zip;
}

export function ExportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
    const project = useEditor((s) => s.project);
    const toast = useEditor((s) => s.toast);
    const packs = usePacks((s) => s.packs);
    const [busy, setBusy] = useState(false);

    const result = useMemo(() => (open ? compileProject(project, packs) : null), [open, project, packs]);

    const download = async () => {
        if (!result) return;
        setBusy(true);
        try {
            const zip = await buildModZip(result, project.mod.id);
            const blob = await zip.generateAsync({ type: "blob" });
            if (typeof URL !== "undefined" && URL.createObjectURL) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${project.mod.id}-${project.mod.version}.zip`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                toast("Mod exported — unzip it into the game's mods folder.", "ok");
            } else {
                toast("Downloads are not available here, but the mod compiles cleanly.", "info");
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-void/70 backdrop-blur-[2px]" />
                <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex h-[70vh] w-[min(640px,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-panel">
                    <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
                        <div>
                            <Dialog.Title className="text-[13.5px] font-semibold text-ink">Export mod</Dialog.Title>
                            <Dialog.Description className="mt-0.5 text-[11px] leading-relaxed text-ink-3">
                                Compiles everything into a ready-to-play mod folder — no coding needed. Unzip it
                                into the game's <span className="font-mono">mods/</span> directory.
                            </Dialog.Description>
                        </div>
                        <Dialog.Close className="btn-icon" aria-label="Close">
                            <Icon name="x" size={14} />
                        </Dialog.Close>
                    </div>

                    {result && (
                        <div className="min-h-0 flex-1 overflow-y-auto p-4 text-[11.5px] leading-relaxed text-ink-3">
                            <div className="grid gap-3">
                                <div>
                                    <p className="mb-1 text-[10px] font-semibold tracking-wider text-ink-3 uppercase">
                                        Quests
                                    </p>
                                    <p>{project.quests.map((q) => q.title || q.name).join(" · ") || "none yet"}</p>
                                </div>
                                <div>
                                    <p className="mb-1 text-[10px] font-semibold tracking-wider text-ink-3 uppercase">
                                        Websites
                                    </p>
                                    <p>{project.websites.map((w) => w.host).join(" · ") || "none yet"}</p>
                                </div>
                                <div>
                                    <p className="mb-1 text-[10px] font-semibold tracking-wider text-ink-3 uppercase">
                                        Permissions requested
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {result.permissions.length === 0 && <span>none</span>}
                                        {result.permissions.map((p) => (
                                            <span key={p} className="rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-[10.5px]">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="mb-1 text-[10px] font-semibold tracking-wider text-ink-3 uppercase">
                                        In the zip
                                    </p>
                                    <ul className="grid gap-0.5 font-mono text-[10.5px]">
                                        {result.files.map((f) => (
                                            <li key={f.path}>{f.path}</li>
                                        ))}
                                    </ul>
                                </div>
                                {result.warnings.length > 0 && (
                                    <div>
                                        <p className="mb-1 text-[10px] font-semibold tracking-wider text-warn uppercase">
                                            Good to know
                                        </p>
                                        <WarningList warnings={result.warnings} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
                        <Dialog.Close className="btn-default">Close</Dialog.Close>
                        <button type="button" className="btn-primary" disabled={busy} onClick={download}>
                            <Icon name="download" size={13} />
                            {busy ? "Packing…" : "Download .zip"}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
