/**
 * Transient overlays: the toast, the template gallery and the shortcut sheet.
 */
import { useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import { useEditor } from "@/store/editor";
import { TEMPLATES, type Template } from "@/templates";
import { downloadProject, parseProjectFile, projectFileName } from "@/templates/share";
import { clearDraft } from "@/store/autosave";
import { WebsiteBuilderDialog } from "@/editor/websites/WebsiteBuilder";
import { TwotterPanelDialog } from "@/editor/twotter/TwotterPanel";
import { ExtrasDialog } from "@/editor/extras/ExtrasDialog";
import { DialoguesDialog } from "./DialoguesDialog";
import { SimulatorDialog } from "@/editor/simulator/SimulatorDialog";
import { ExportDialog } from "./ExportDialog";
import { ToolPackManagerDialog } from "@/toolpacks/ToolPackManagerDialog";
import { SettingsDialog } from "./SettingsDialog";
import { EVENT_COUNT, SDK_VERSION } from "@/schema/events";

/* ── Toast ───────────────────────────────────────────────────────────────── */

const TONE_STYLE = {
    info: "border-line bg-surface text-ink-2",
    ok: "border-ok/40 bg-ok/10 text-ok",
    warn: "border-warn/40 bg-warn/10 text-warn",
    danger: "border-danger/40 bg-danger/10 text-danger",
} as const;

export function Toast() {
    const toast = useEditor((s) => s.ui.toast);
    const setUi = useEditor((s) => s.setUi);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setUi({ toast: null }), 4200);
        return () => clearTimeout(timer);
    }, [toast, setUi]);

    if (!toast) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "pointer-events-auto fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2",
                "rounded-lg border px-3 py-2 text-[12.5px] shadow-panel",
                TONE_STYLE[toast.tone],
            )}
        >
            <Icon
                name={toast.tone === "info" ? "info" : toast.tone === "ok" ? "check" : "alert"}
                size={14}
                className="shrink-0"
            />
            <span>{toast.message}</span>
            <button
                type="button"
                className="btn-icon size-5"
                onClick={() => setUi({ toast: null })}
                aria-label="Dismiss"
            >
                <Icon name="x" size={11} />
            </button>
        </div>
    );
}

/* ── Shared modal chrome ─────────────────────────────────────────────────── */

function Modal({
    open,
    onOpenChange,
    title,
    subtitle,
    children,
    width = "w-[560px]",
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    width?: string;
}) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-void/70 backdrop-blur-[2px]" />
                <Dialog.Content
                    className={cn(
                        "fixed top-1/2 left-1/2 z-50 max-h-[80vh] -translate-x-1/2 -translate-y-1/2",
                        "overflow-hidden rounded-xl border border-line bg-surface shadow-panel",
                        width,
                    )}
                >
                    <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
                        <div>
                            <Dialog.Title className="text-[14px] font-semibold text-ink">
                                {title}
                            </Dialog.Title>
                            {subtitle && (
                                <Dialog.Description className="mt-0.5 text-[11.5px] text-ink-4">
                                    {subtitle}
                                </Dialog.Description>
                            )}
                        </div>
                        <Dialog.Close asChild>
                            <button type="button" className="btn-icon" aria-label="Close">
                                <Icon name="x" size={14} />
                            </button>
                        </Dialog.Close>
                    </div>
                    <div className="max-h-[calc(80vh-58px)] overflow-y-auto">{children}</div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

/* ── Templates ───────────────────────────────────────────────────────────── */

const DIFFICULTY_STYLE: Record<Template["difficulty"], string> = {
    Beginner: "border-ok/30 bg-ok/10 text-ok",
    Expert: "border-warn/30 bg-warn/10 text-warn",
    Advanced: "border-danger/30 bg-danger/10 text-danger",
    Reference: "border-accent/30 bg-accent-soft text-accent",
};

function TemplatesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
    const load = useEditor((s) => s.load);
    const toast = useEditor((s) => s.toast);
    const project = useEditor((s) => s.project);
    const fileInput = useRef<HTMLInputElement>(null);

    const apply = (template: Template) => {
        load(template.build(), { clearHistory: true });
        onOpenChange(false);
        toast(`Loaded “${template.name}”.`, "ok");
    };

    const exportCurrent = () => {
        const name = downloadProject(project);
        toast(`Saved “${name}” — send it to anyone with the editor.`, "ok");
    };

    const onImportFile = async (file: File) => {
        const text = await file.text();
        const result = parseProjectFile(text);
        if (!result.ok) {
            toast(result.error, "danger");
            return;
        }
        load(result.project, { clearHistory: true });
        onOpenChange(false);
        toast(`Imported “${result.project.mod.name || result.project.mod.id}”.`, "ok");
    };

    return (
        <Modal
            open={open}
            onOpenChange={onOpenChange}
            title="Start from a template"
            subtitle="Replaces the current project. Your draft is autosaved, but not versioned — export before experimenting."
        >
            <div className="grid gap-2 p-3 sm:grid-cols-2">
                {TEMPLATES.map((template) => (
                    <button
                        key={template.id}
                        type="button"
                        onClick={() => apply(template)}
                        className="flex flex-col gap-2 rounded-lg border border-line bg-surface-2/40 p-3 text-left transition-colors hover:border-accent/40 hover:bg-surface-2"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="text-[13px] font-semibold text-ink">{template.name}</h3>
                            <span className={cn("chip shrink-0", DIFFICULTY_STYLE[template.difficulty])}>
                                {template.difficulty}
                            </span>
                        </div>
                        <p className="text-[11.5px] leading-relaxed text-ink-3">
                            {template.description}
                        </p>
                        <span className="mt-auto font-mono text-[10px] text-ink-4">
                            {template.nodeCount} nodes
                        </span>
                    </button>
                ))}
            </div>
            {/* Share work-in-progress quests, or build a personal template library. */}
            <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
                <button type="button" className="btn-default" onClick={exportCurrent} title={projectFileName(project)}>
                    <Icon name="download" size={13} />
                    Export current quest
                </button>
                <button
                    type="button"
                    className="btn-default"
                    onClick={() => fileInput.current?.click()}
                >
                    <Icon name="upload" size={13} />
                    Import a quest file
                </button>
                <input
                    ref={fileInput}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    aria-label="Import a quest project file"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void onImportFile(file);
                        e.target.value = "";
                    }}
                />
                <span className="ml-auto font-mono text-[10px] text-ink-4">
                    {TEMPLATES.length} templates · {EVENT_COUNT} events · SDK {SDK_VERSION}
                </span>
            </div>
        </Modal>
    );
}

/* ── Shortcuts ───────────────────────────────────────────────────────────── */

/**
 * A single shortcut row. `keys` are drawn as key caps; `gesture`, when present,
 * is drawn as plain italic text for mouse/pointer actions that are not a key
 * (e.g. "drag from palette") — so a reader can tell a keypress from a gesture
 * at a glance instead of reading a lowercase phrase inside a key cap (r157).
 */
interface Shortcut {
    keys?: string[];
    gesture?: string;
    action: string;
}

interface ShortcutGroup {
    title: string;
    items: Shortcut[];
}

/**
 * The cheat sheet, audited against the code that implements each gesture
 * (r157): `useKeyboardShortcuts` for the keys, `QuestCanvas`/`NodePalette` for
 * the pointer gestures, React Flow's `panOnDrag`/`zoomOnScroll` config for
 * navigation. Kept grouped by the job the author is doing, newest additions
 * (Shift+A search, right-click search, wire-to-empty create, double-click
 * reroute, box select) included — the previous flat list had drifted stale.
 */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
    {
        title: "Editing",
        items: [
            { keys: ["Ctrl", "Z"], action: "Undo" },
            { keys: ["Ctrl", "Shift", "Z"], action: "Redo" },
            { keys: ["Ctrl", "Y"], action: "Redo (alternative)" },
            { keys: ["Ctrl", "C"], action: "Copy the selected nodes" },
            { keys: ["Ctrl", "X"], action: "Cut the selected nodes" },
            { keys: ["Ctrl", "V"], action: "Paste copied nodes" },
            { keys: ["Ctrl", "D"], action: "Duplicate the selected nodes" },
            { keys: ["Delete"], action: "Delete the selected nodes or wires" },
            { keys: ["Ctrl", "S"], action: "Save the draft now" },
        ],
    },
    {
        title: "Add nodes",
        items: [
            { gesture: "drag from palette", action: "Place a node where you drop it" },
            { gesture: "click a palette card", action: "Add it at the viewport centre" },
            { keys: ["Shift", "A"], action: "Search for a node at the pointer" },
            { gesture: "right-click the canvas", action: "Search for a node here" },
            { gesture: "drag a wire onto empty canvas", action: "Create a node the wire fits" },
        ],
    },
    {
        title: "Select",
        items: [
            { gesture: "click a node", action: "Select just that node" },
            { keys: ["Shift"], gesture: "click", action: "Add to / toggle the selection" },
            { keys: ["Ctrl"], gesture: "click", action: "Add to / toggle the selection" },
            { gesture: "drag on empty canvas", action: "Box-select (any overlap counts)" },
            { keys: ["Shift"], gesture: "drag a box", action: "Add to / remove from the selection" },
            { keys: ["Esc"], action: "Clear the selection" },
        ],
    },
    {
        title: "Wiring",
        items: [
            { gesture: "drag from a socket", action: "Start a wire" },
            { gesture: "drop on a node's body", action: "Wire to its matching socket" },
            { gesture: "drag a wire out of an input", action: "Pick it up to move or remove it" },
            { gesture: "drop on empty canvas", action: "Remove the wire" },
            { gesture: "double-click a wire", action: "Insert a reroute point" },
        ],
    },
    {
        title: "Move around",
        items: [
            { gesture: "middle-drag or right-drag", action: "Pan the canvas" },
            { gesture: "scroll", action: "Zoom in and out" },
            { gesture: "drag a frame's title bar", action: "Move the group and its contents" },
        ],
    },
];

/** One row: the action on the left, its keys and/or gesture on the right. */
function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
    return (
        <li className="flex items-center justify-between gap-4 px-4 py-2">
            <span className="text-[12px] text-ink-2">{shortcut.action}</span>
            <span className="flex shrink-0 items-center gap-1">
                {shortcut.keys?.map((key) => (
                    <kbd key={key} className="kbd">
                        {key}
                    </kbd>
                ))}
                {shortcut.gesture && (
                    <span className="text-[11px] text-ink-4 italic">{shortcut.gesture}</span>
                )}
            </span>
        </li>
    );
}

function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
    return (
        <Modal
            open={open}
            onOpenChange={onOpenChange}
            title="Shortcuts & gestures"
            subtitle="Keys work anywhere; gestures are on the canvas."
            width="w-[440px]"
        >
            <div className="divide-y divide-line">
                {SHORTCUT_GROUPS.map((group) => (
                    <section key={group.title}>
                        <h3 className="bg-canvas px-4 py-1.5 text-[10px] font-semibold tracking-wider text-ink-4 uppercase">
                            {group.title}
                        </h3>
                        <ul className="divide-y divide-line">
                            {group.items.map((shortcut) => (
                                <ShortcutRow
                                    key={`${shortcut.keys?.join("+") ?? ""}|${shortcut.gesture ?? ""}|${shortcut.action}`}
                                    shortcut={shortcut}
                                />
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </Modal>
    );
}

/* ── New project ─────────────────────────────────────────────────────────── */

function NewProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
    const reset = useEditor((s) => s.reset);
    const toast = useEditor((s) => s.toast);
    const project = useEditor((s) => s.project);

    const startFresh = () => {
        // Wipe the autosaved draft too — otherwise the blank project would be
        // overwritten by the old one the next time the editor loads (which is
        // exactly why a re-extracted editor kept showing the previous quest).
        clearDraft();
        reset();
        onOpenChange(false);
        toast("Started a new, blank quest project.", "ok");
    };

    const saveFirst = () => {
        const name = downloadProject(project);
        toast(`Saved “${name}” — reopen it any time from Templates → Import.`, "ok");
    };

    return (
        <Modal
            open={open}
            onOpenChange={onOpenChange}
            title="Start a new project?"
            subtitle="This clears the current quest and the autosaved draft."
            width="w-[460px]"
        >
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-start gap-3 rounded-lg border border-warn/40 bg-warn/10 p-3">
                    <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-warn" />
                    <div className="text-[12px] leading-relaxed text-ink-2">
                        <p className="font-semibold text-warn">This can’t be undone.</p>
                        <p className="mt-1">
                            Everything currently on the canvas — every quest, website and dialogue in
                            this project — will be permanently removed, along with the autosaved copy in
                            your browser. If you haven’t exported this work, save it first.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <button type="button" className="btn-default" onClick={saveFirst}>
                        <Icon name="download" size={13} />
                        Save current quest first
                    </button>
                    <button type="button" className="btn-default" onClick={() => onOpenChange(false)}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn-default border-danger/50 text-danger hover:bg-danger/10"
                        onClick={startFresh}
                    >
                        <Icon name="trash" size={13} />
                        Clear and start fresh
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export function Overlays() {
    const modal = useEditor((s) => s.ui.modal);
    const setUi = useEditor((s) => s.setUi);
    return (
        <>
            <NewProjectDialog open={modal === "newProject"} onOpenChange={(o) => setUi({ modal: o ? "newProject" : null })} />
            <TemplatesDialog open={modal === "templates"} onOpenChange={(o) => setUi({ modal: o ? "templates" : null })} />
            <ShortcutsDialog open={modal === "shortcuts"} onOpenChange={(o) => setUi({ modal: o ? "shortcuts" : null })} />
            <WebsiteBuilderDialog open={modal === "websites"} onOpenChange={(o) => setUi({ modal: o ? "websites" : null })} />
            <TwotterPanelDialog open={modal === "twotter"} onOpenChange={(o) => setUi({ modal: o ? "twotter" : null })} />
            <ExtrasDialog open={modal === "extras"} onOpenChange={(o) => setUi({ modal: o ? "extras" : null })} />
            <DialoguesDialog open={modal === "dialogues"} onOpenChange={(o) => setUi({ modal: o ? "dialogues" : null })} />
            <ExportDialog open={modal === "mod"} onOpenChange={(o) => setUi({ modal: o ? "mod" : null })} />
            <SimulatorDialog open={modal === "simulator"} onOpenChange={(o) => setUi({ modal: o ? "simulator" : null })} />
            <ToolPackManagerDialog open={modal === "toolpacks"} onOpenChange={(o) => setUi({ modal: o ? "toolpacks" : null })} />
            <SettingsDialog open={modal === "settings"} onOpenChange={(o) => setUi({ modal: o ? "settings" : null })} />
        </>
    );
}
