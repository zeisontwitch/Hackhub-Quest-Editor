/**
 * The general dialogue editor. Opened from a dialogue node on the canvas it
 * edits that node: pick the flavour (phone, Kisscord, e-mail, WeeChat) and
 * script the conversation in the matching interface. Opened from the top bar
 * it lists the quest's dialogue nodes and can create new ones.
 */
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { nanoid } from "nanoid";
import { Icon } from "@/components/Icon";
import { DIALOGUE_KIND_LABELS, dialogueFirstLine } from "@/editor/canvas/summarize";
import { BranchScriptEditor } from "@/editor/inspector/sims/DialogScript";
import { KisscordScript } from "@/editor/inspector/sims/KisscordEditor";
import { MailScript } from "@/editor/inspector/sims/MailSim";
import { WeeChatScript } from "@/editor/inspector/sims/WeeChatEditor";
import { FieldShell, SelectInput } from "@/editor/inspector/primitives";
import type { DialogBranch, DialogueKind, NodeOfType } from "@/schema/nodes";
import { saveDraft } from "@/store/autosave";
import { selectActiveQuest, useEditor } from "@/store/editor";

export function DialoguesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
    const quest = useEditor(selectActiveQuest);
    const dialogueNodeId = useEditor((s) => s.ui.dialogueNode);
    const setUi = useEditor((s) => s.setUi);
    const updateNodeData = useEditor((s) => s.updateNodeData);
    const updateQuest = useEditor((s) => s.updateQuest);
    const addNode = useEditor((s) => s.addNode);

    const nodes = (quest?.graph.nodes ?? []).filter(
        (n): n is NodeOfType<"comms.dialogue"> => n.type === "comms.dialogue",
    );
    const node = nodes.find((n) => n.id === dialogueNodeId) ?? null;

    const close = (o: boolean) => {
        if (!o) setUi({ dialogueNode: null });
        onOpenChange(o);
    };

    const [justSaved, setJustSaved] = useState(false);
    const saveNow = () => {
        // Autosave already persists a moment after every change; this writes
        // the draft immediately so closing right away is visibly safe.
        saveDraft(useEditor.getState().project);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1600);
    };

    const createNode = () => {
        const id = addNode("comms.dialogue", { x: 80 + nodes.length * 40, y: 80 + nodes.length * 40 });
        if (id) setUi({ dialogueNode: id });
    };

    const dialog = quest?.dialog ?? [];
    const caller = quest
        ? `${quest.employer.firstName ?? "Caller"} ${quest.employer.lastName ?? ""}`.trim()
        : "Caller";

    return (
        <Dialog.Root open={open} onOpenChange={close}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-void/70 backdrop-blur-[2px]" />
                <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex h-[86vh] w-[min(820px,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-panel">
                    <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
                        <div>
                            <Dialog.Title className="text-[13.5px] font-semibold text-ink">
                                {node ? `Dialogue editor — ${DIALOGUE_KIND_LABELS[node.data.kind]}` : "Dialogue editor"}
                            </Dialog.Title>
                            <Dialog.Description className="mt-0.5 text-[11px] leading-relaxed text-ink-3">
                                {node
                                    ? "Write the conversation below. Changes save straight onto the node."
                                    : `The conversations of ${quest?.name ?? "the active quest"}. Pick one to edit, or create a new dialogue node.`}
                            </Dialog.Description>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={saveNow}
                                title="Save this dialogue to your draft now — the editor also autosaves shortly after every change"
                            >
                                <Icon name={justSaved ? "check" : "save"} size={13} />
                                {justSaved ? "Saved" : "Save"}
                            </button>
                            {node && (
                                <button
                                    type="button"
                                    className="btn-default"
                                    onClick={() => setUi({ dialogueNode: null })}
                                >
                                    ← All dialogues
                                </button>
                            )}
                            <Dialog.Close className="btn-icon" aria-label="Close">
                                <Icon name="x" size={14} />
                            </Dialog.Close>
                        </div>
                    </div>

                    {!quest ? (
                        <EmptyNote text="Add a quest first — dialogues live on quests." />
                    ) : node ? (
                        <div className="min-h-0 flex-1 overflow-y-auto pb-4">
                            <div className="grid gap-2 border-b border-line px-4 py-2">
                                <FieldShell
                                    label="Conversation type"
                                    hint="Switching keeps everything you wrote in the other flavours on the node."
                                >
                                    <SelectInput
                                        ariaLabel="Dialogue type"
                                        value={node.data.kind}
                                        onChange={(kind) => updateNodeData(node.id, { kind: kind as DialogueKind })}
                                        options={(Object.keys(DIALOGUE_KIND_LABELS) as DialogueKind[]).map((k) => ({
                                            value: k,
                                            label: DIALOGUE_KIND_LABELS[k],
                                        }))}
                                    />
                                </FieldShell>
                            </div>

                            {node.data.kind === "phone" && (
                                <PhoneCore
                                    node={node}
                                    dialog={dialog}
                                    caller={caller}
                                    onWriteDialog={(next) => updateQuest(quest.id, { dialog: next })}
                                    onSelectBranch={(branch) => updateNodeData(node.id, { phone: { ...node.data.phone, branch } })}
                                    onPatchPhone={(p) => updateNodeData(node.id, { phone: { ...node.data.phone, ...p } })}
                                />
                            )}
                            {node.data.kind === "kisscord" && (
                                <KisscordScript
                                    value={{ contactId: node.data.kisscord.contactId, messages: node.data.kisscord.messages }}
                                    onChange={(p) => updateNodeData(node.id, { kisscord: { ...node.data.kisscord, ...p } })}
                                />
                            )}
                            {node.data.kind === "mail" && (
                                <MailScript
                                    value={node.data.mail}
                                    onChange={(p) => updateNodeData(node.id, { mail: { ...node.data.mail, ...p } })}
                                />
                            )}
                            {node.data.kind === "weechat" && (
                                <WeeChatScript
                                    value={node.data.weechat}
                                    onChange={(p) => updateNodeData(node.id, { weechat: { ...node.data.weechat, ...p } })}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="min-h-0 flex-1 overflow-y-auto p-4">
                            <button type="button" className="btn-primary mb-3" onClick={createNode}>
                                <Icon name="plus" size={12} />
                                New dialogue node
                            </button>
                            {nodes.length === 0 ? (
                                <EmptyNote text="No dialogues yet — create one and pick its flavour." />
                            ) : (
                                <div className="grid gap-2">
                                    {nodes.map((n) => (
                                        <button
                                            key={n.id}
                                            type="button"
                                            onClick={() => setUi({ dialogueNode: n.id })}
                                            className="rounded-lg border border-line bg-surface-2/60 p-3 text-left transition-colors hover:border-accent/50"
                                        >
                                            <span className="flex items-center gap-2 text-[12px] font-semibold text-ink">
                                                <Icon
                                                    name={n.data.kind === "phone" ? "phone" : n.data.kind === "mail" ? "mail" : n.data.kind === "weechat" ? "hash" : "message"}
                                                    size={12}
                                                    className="text-accent"
                                                />
                                                {DIALOGUE_KIND_LABELS[n.data.kind]}
                                            </span>
                                            <span className="mt-0.5 block truncate text-[11px] text-ink-4">
                                                {dialogueFirstLine(n.data, quest) || "empty conversation"}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function EmptyNote({ text }: { text: string }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-ink-4">
            <Icon name="phone" size={20} />
            <p className="text-[12px]">{text}</p>
        </div>
    );
}

/* ── phone flavour: branches live on the quest ───────────────────────────── */

function PhoneCore({
    node,
    dialog,
    caller,
    onWriteDialog,
    onSelectBranch,
    onPatchPhone,
}: {
    node: NodeOfType<"comms.dialogue">;
    dialog: DialogBranch[];
    caller: string;
    onWriteDialog: (next: DialogBranch[]) => void;
    onSelectBranch: (branch: string) => void;
    onPatchPhone: (p: Partial<{ branch: string; startIndex: number; continueMode: "immediate" | "onEnd" }>) => void;
}) {
    const branch = dialog.find((b) => b.name === node.data.phone.branch) ?? dialog[0];

    const addBranch = () => {
        const name = `branch-${dialog.length + 1}`;
        onWriteDialog([...dialog, { id: nanoid(8), name, lines: [] }]);
        onSelectBranch(name);
    };

    return (
        <>
            <div className="grid grid-cols-[1fr_auto] items-end gap-2 px-4 pt-3">
                <FieldShell
                    label="Conversation"
                    hint="Dialog branches live on the quest, so several dialogue nodes can share one script."
                >
                    <SelectInput
                        ariaLabel="Conversation branch"
                        value={branch?.name ?? ""}
                        onChange={onSelectBranch}
                        options={dialog.map((b) => ({
                            value: b.name,
                            label: `${b.name} · ${b.lines.length} line${b.lines.length === 1 ? "" : "s"}`,
                        }))}
                    />
                </FieldShell>
                <button type="button" className="btn-default mb-0.5" onClick={addBranch}>
                    <Icon name="plus" size={12} />
                    New branch
                </button>
            </div>
            {branch ? (
                <BranchScriptEditor
                    key={branch.id}
                    branch={branch}
                    otherBranches={dialog.map((b) => b.name)}
                    startIndex={node.data.phone.startIndex}
                    caller={caller}
                    onPatch={(p) =>
                        onWriteDialog(dialog.map((b) => (b.id === branch.id ? { ...b, ...p } : b)))
                    }
                />
            ) : (
                <EmptyNote text="This quest has no conversation yet — create a branch to start scripting the call." />
            )}
            <div className="grid gap-2 px-4 pt-2 sm:grid-cols-[1fr_auto]">
                <FieldShell
                    label="Out fires"
                    hint="Choose whether this node's Out wire runs right after the call starts, or waits until the phone call hangs up."
                    className="px-0 py-0"
                >
                    <SelectInput
                        ariaLabel="Phone flow timing"
                        value={node.data.phone.continueMode ?? "onEnd"}
                        onChange={(continueMode) =>
                            onPatchPhone({ continueMode: continueMode as "immediate" | "onEnd" })
                        }
                        options={[
                            { value: "onEnd", label: "When the call ends" },
                            { value: "immediate", label: "Right after starting the call" },
                        ]}
                    />
                </FieldShell>
                <FieldShell
                    label="Start at line"
                    hint="Which line of dialogue the call opens on. Use it to resume a conversation mid-script."
                    className="px-0 py-0"
                >
                    <input
                        type="number"
                        min={0}
                        aria-label="Start at line"
                        value={node.data.phone.startIndex}
                        onChange={(e) => onPatchPhone({ startIndex: Math.max(0, Number(e.target.value)) })}
                        className="w-24 rounded-md border border-line bg-surface-2 px-2 py-1 text-[11.5px] text-ink focus:border-accent focus:outline-none"
                    />
                </FieldShell>
            </div>
        </>
    );
}
