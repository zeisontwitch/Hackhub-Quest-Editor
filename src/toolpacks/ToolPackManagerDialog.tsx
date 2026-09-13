/**
 * The tool-pack manager: load, inspect and remove community packs.
 *
 * This dialog is a modder's first contact with the editor, so a failed load
 * gets the same treatment authors get everywhere else here — what is wrong
 * and how to fix it, in plain words, never a stack trace.
 */
import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/Icon";
import { usePacks } from "@/store/packs";

/** Read a File as text via FileReader — File.text() is not available in all
    environments (jsdom among them); same helper shape as Load HTML. */
function readAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

export function ToolPackManagerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
    const packs = usePacks((s) => s.packs);
    const loadPack = usePacks((s) => s.loadPack);
    const removePack = usePacks((s) => s.removePack);
    const fileRef = useRef<HTMLInputElement>(null);
    /** The load result shown under the button until the next attempt. */
    const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const onFiles = (files: FileList | null) => {
        if (!files || !files.length) return;
        const names: string[] = [];
        let loaded = 0;
        const errors: string[] = [];
        void (async () => {
            for (const file of Array.from(files)) {
                if (!/\.json$/i.test(file.name)) continue;
                names.push(file.name);
                try {
                    const text = await readAsText(file);
                    let raw: unknown;
                    try {
                        raw = JSON.parse(text);
                    } catch {
                        errors.push(`${file.name}: this is not valid JSON — check for a trailing comma or a stray character.`);
                        continue;
                    }
                    const result = loadPack(raw);
                    if (result.ok) loaded++;
                    else errors.push(`${file.name}: ${result.error}`);
                } catch {
                    errors.push(`${file.name}: the file could not be read.`);
                }
            }
            if (!names.length && !errors.length) {
                setResult({ ok: false, text: "No .json files in that selection — a tool pack is a toolpack.json file." });
                return;
            }
            const bits: string[] = [];
            if (loaded) bits.push(`Loaded ${loaded} pack${loaded === 1 ? "" : "s"}.`);
            if (errors.length) bits.push(errors.join(" "));
            setResult({ ok: errors.length === 0, text: bits.join(" ") });
        })();
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-void/70 backdrop-blur-[2px]" />
                <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex h-[76vh] w-[min(680px,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-panel">
                    <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
                        <div>
                            <Dialog.Title className="text-[14px] font-semibold text-ink">Tool packs</Dialog.Title>
                            <Dialog.Description className="mt-0.5 text-[11.5px] leading-relaxed text-ink-4">
                                Community tool mods drop in here as data: their events join the trigger picker, their quest
                                data becomes nodes. Packs are data only — the editor never runs code from them.
                            </Dialog.Description>
                        </div>
                        <Dialog.Close asChild>
                            <button type="button" className="btn-icon" aria-label="Close">
                                <Icon name="x" size={14} />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4">
                        {packs.length === 0 ? (
                            <div className="flex flex-col items-center gap-1.5 py-8 text-center">
                                <Icon name="package" size={26} className="text-ink-4" />
                                <p className="text-[13px] font-medium text-ink-2">No tool packs loaded.</p>
                                <p className="max-w-[46ch] text-[11.5px] leading-relaxed text-ink-4">
                                    A pack is a <code className="font-mono">toolpack.json</code> file from a tool-mod author —
                                    the starter pack in the editor's repository is a worked example you can rename and fill.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                {packs.map((p) => (
                                    <div key={p.id} className="rounded-lg border border-line bg-surface-2/50 p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-semibold text-ink">{p.name}</p>
                                                <p className="mt-0.5 font-mono text-[10.5px] text-ink-4">
                                                    {p.id} · v{p.version}
                                                    {p.author ? ` · by ${p.author}` : ""}
                                                </p>
                                            </div>
                                            {confirmId === p.id ? (
                                                <div className="flex shrink-0 items-center gap-1.5">
                                                    <span className="text-[10.5px] text-ink-3">Remove?</span>
                                                    <button
                                                        type="button"
                                                        className="btn-default"
                                                        onClick={() => {
                                                            removePack(p.id);
                                                            setConfirmId(null);
                                                        }}
                                                    >
                                                        Yes
                                                    </button>
                                                    <button type="button" className="btn-default" onClick={() => setConfirmId(null)}>
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="btn-icon shrink-0 bg-danger/15 text-danger hover:bg-danger hover:text-white"
                                                    title="Remove this pack"
                                                    aria-label={`Remove ${p.name}`}
                                                    onClick={() => setConfirmId(p.id)}
                                                >
                                                    <Icon name="trash" size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-3">
                                            {p.events.length} event{p.events.length === 1 ? "" : "s"} · {p.storage.length} data
                                            shape{p.storage.length === 1 ? "" : "s"}
                                            {p.targetRules && p.targetRules.services.length > 0 && (
                                                <>
                                                    {" "}· matches{" "}
                                                    <span className="font-mono text-[10px] text-ink-4">
                                                        {p.targetRules.services.join(", ")}
                                                    </span>
                                                </>
                                            )}
                                            {p.gameMod?.name ? (
                                                <>
                                                    {" "}· needs the <strong className="text-ink-2">{p.gameMod.name}</strong> game mod
                                                    installed
                                                </>
                                            ) : null}
                                        </p>
                                        {p.gameMod?.note && (
                                            <p className="mt-1 text-[10.5px] leading-relaxed text-ink-4">{p.gameMod.note}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-line p-3">
                        <div className="flex items-center gap-2">
                            <button type="button" className="btn-primary" onClick={() => fileRef.current?.click()}>
                                <Icon name="plus" size={12} />
                                Load a pack (.json)
                            </button>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".json,application/json"
                                multiple
                                aria-label="Load tool pack files"
                                className="hidden"
                                onChange={(e) => {
                                    onFiles(e.target.files);
                                    e.target.value = "";
                                }}
                            />
                        </div>
                        {result && (
                            <p
                                className={`mt-2 rounded-md border px-2.5 py-1.5 text-[11px] leading-relaxed ${
                                    result.ok
                                        ? "border-ok/30 bg-ok/10 text-ok"
                                        : "border-warn/40 bg-warn/10 text-warn"
                                }`}
                                role="status"
                            >
                                {result.text}
                            </p>
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
