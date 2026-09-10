/**
 * The top bar: identity, history, quest switching, templates and export.
 */
import { useRef } from "react";
import { Icon } from "@/components/Icon";
import { selectCanRedo, selectCanUndo, useEditor } from "@/store/editor";
import { TEMPLATES } from "@/templates";
import { downloadProject, parseProjectFile } from "@/templates/share";
import { EVENT_COUNT, SDK_VERSION } from "@/schema/events";
import { EDITOR_BUILD } from "@/compiler/compile";

export function TopBar() {
    const mod = useEditor((s) => s.project.mod);
    const quests = useEditor((s) => s.project.quests);
    const activeQuestId = useEditor((s) => s.project.editor.activeQuestId);
    const setActiveQuest = useEditor((s) => s.setActiveQuest);
    const addQuest = useEditor((s) => s.addQuest);
    const duplicateQuest = useEditor((s) => s.duplicateQuest);
    const removeQuest = useEditor((s) => s.removeQuest);
    const undo = useEditor((s) => s.undo);
    const redo = useEditor((s) => s.redo);
    const canUndo = useEditor(selectCanUndo);
    const canRedo = useEditor(selectCanRedo);
    const setUi = useEditor((s) => s.setUi);
    const toast = useEditor((s) => s.toast);
    const project = useEditor((s) => s.project);
    const load = useEditor((s) => s.load);
    const fileInput = useRef<HTMLInputElement>(null);

    const saveProject = () => {
        const name = downloadProject(project);
        toast(`Saved “${name}” — send it to anyone with the editor.`, "ok");
    };

    const onLoadFile = async (file: File) => {
        const text = await file.text();
        const result = parseProjectFile(text);
        if (!result.ok) {
            toast(result.error, "danger");
            return;
        }
        load(result.project, { clearHistory: true });
        toast(`Loaded “${result.project.mod.name || result.project.mod.id}”.`, "ok");
    };

    return (
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-surface px-3">
            {/* identity */}
            <div className="flex items-center gap-2 pr-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-accent text-void">
                    <Icon name="terminal" size={14} />
                </span>
                <div className="leading-tight">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[12.5px] font-semibold text-ink">Quest Mod Editor</span>
                        <span
                            className="rounded bg-surface-2 px-1 py-px font-mono text-[9px] text-ink-3"
                            title="Editor build — must match the build stamped into each exported mod"
                        >
                            build {EDITOR_BUILD}
                        </span>
                    </div>
                    <div className="font-mono text-[9.5px] text-ink-4">
                        {mod.id} · v{mod.version}
                    </div>
                </div>
            </div>

            <span className="h-6 w-px bg-line" aria-hidden />

            {/* history */}
            <div className="flex items-center gap-0.5">
                <button
                    type="button"
                    className="btn-icon"
                    onClick={undo}
                    disabled={!canUndo}
                    title="Undo (Ctrl+Z)"
                    aria-label="Undo"
                >
                    <Icon name="undo" size={15} />
                </button>
                <button
                    type="button"
                    className="btn-icon"
                    onClick={redo}
                    disabled={!canRedo}
                    title="Redo (Ctrl+Shift+Z)"
                    aria-label="Redo"
                >
                    <Icon name="redo" size={15} />
                </button>
            </div>

            <span className="h-6 w-px bg-line" aria-hidden />

            {/* quest tabs */}
            <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" aria-label="Quests">
                {quests.map((quest) => {
                    const active = quest.id === activeQuestId;
                    return (
                        <div
                            key={quest.id}
                            className={
                                "group flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 transition-colors " +
                                (active
                                    ? "border-accent/40 bg-accent-soft text-ink"
                                    : "border-transparent text-ink-3 hover:bg-surface-2 hover:text-ink-2")
                            }
                        >
                            <button
                                type="button"
                                onClick={() => setActiveQuest(quest.id)}
                                className="flex items-center gap-1.5"
                                title={quest.description || quest.title}
                            >
                                <Icon name="target" size={12} className={active ? "text-accent" : ""} />
                                <span className="max-w-32 truncate text-[12px] font-medium">
                                    {quest.title || quest.name}
                                </span>
                                <span className="font-mono text-[10px] text-ink-4">
                                    {quest.graph.nodes.length}
                                </span>
                            </button>
                            {quests.length > 1 && (
                                <span className="flex items-center opacity-0 group-hover:opacity-100">
                                    <button
                                        type="button"
                                        className="btn-icon size-5"
                                        onClick={() => duplicateQuest(quest.id)}
                                        title="Duplicate quest"
                                        aria-label={`Duplicate ${quest.title}`}
                                    >
                                        <Icon name="copy" size={10} />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-icon size-5 hover:text-danger"
                                        onClick={() => {
                                            removeQuest(quest.id);
                                            toast(`Removed “${quest.title}”.`, "warn");
                                        }}
                                        title="Delete quest"
                                        aria-label={`Delete ${quest.title}`}
                                    >
                                        <Icon name="x" size={10} />
                                    </button>
                                </span>
                            )}
                        </div>
                    );
                })}
                <button
                    type="button"
                    className="btn-icon shrink-0"
                    onClick={() => addQuest()}
                    title="Add quest"
                    aria-label="Add quest"
                >
                    <Icon name="plus" size={14} />
                </button>
            </nav>

            <span className="h-6 w-px bg-line" aria-hidden />

            {/* actions */}
            <button
                type="button"
                className="btn-default"
                onClick={() => setUi({ modal: "newProject" })}
                title="Clear everything and start a blank quest project"
            >
                <Icon name="file" size={13} />
                <span className="hidden lg:inline">New</span>
            </button>

            <button
                type="button"
                className="btn-default"
                onClick={saveProject}
                title="Save the project to a file — reopen it any time with Load"
            >
                <Icon name="save" size={13} />
                <span className="hidden lg:inline">Save</span>
            </button>

            <button
                type="button"
                className="btn-default"
                onClick={() => fileInput.current?.click()}
                title="Load a saved project file"
            >
                <Icon name="upload" size={13} />
                <span className="hidden lg:inline">Load</span>
            </button>
            <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="hidden"
                aria-label="Load a saved project file"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onLoadFile(file);
                    e.target.value = "";
                }}
            />

            <button type="button" className="btn-default" onClick={() => setUi({ modal: "templates" })}>
                <Icon name="layers" size={13} />
                Templates
            </button>

            <button
                type="button"
                className="btn-default"
                onClick={() => setUi({ modal: "toolpacks" })}
                title="Load community tool packs — extra events and data shapes from game mods"
            >
                <Icon name="package" size={13} />
                <span className="hidden lg:inline">Tools</span>
            </button>

            <button
                type="button"
                className="btn-default"
                onClick={() => setUi({ modal: "dialogues" })}
                title="Write the quest's phone conversations"
            >
                <Icon name="phone" size={13} />
                <span className="hidden lg:inline">Dialogues</span>
            </button>

            <button
                type="button"
                className="btn-default"
                onClick={() => setUi({ modal: "simulator" })}
                title="Walk through the quest as the exported mod would run it"
            >
                <Icon name="play" size={13} />
                <span className="hidden lg:inline">Dry run</span>
            </button>

            <button type="button" className="btn-default" onClick={() => setUi({ modal: "websites" })}>
                <Icon name="globe" size={13} />
                <span className="hidden lg:inline">Websites</span>
            </button>

            <button type="button" className="btn-default" onClick={() => setUi({ modal: "shortcuts" })}>
                <Icon name="sliders" size={13} />
                <span className="hidden lg:inline">Shortcuts</span>
            </button>

            <button
                type="button"
                className="btn-primary"
                onClick={() => setUi({ modal: "mod" })}
                title="Compile this project into a HackHub mod package"
            >
                <Icon name="download" size={13} />
                Export mod
            </button>
        </header>
    );
}

export function TemplateCount() {
    return (
        <span className="font-mono text-[10px] text-ink-4">
            {TEMPLATES.length} templates · {EVENT_COUNT} events · SDK {SDK_VERSION}
        </span>
    );
}
