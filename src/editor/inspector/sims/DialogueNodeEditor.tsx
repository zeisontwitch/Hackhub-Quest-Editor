/**
 * The dialogue node's inspector face: pick the conversation flavour and open
 * the full dialogue editor. The script itself is written in the modal so the
 * node stays a tidy card on the canvas.
 */
import { Icon } from "@/components/Icon";
import { DIALOGUE_KIND_LABELS, dialogueFirstLine } from "@/editor/canvas/summarize";
import { FieldShell, SelectInput, Toggle } from "@/editor/inspector/primitives";
import type { DialogueKind, NodeOfType } from "@/schema/nodes";
import { selectActiveQuest, useEditor } from "@/store/editor";

export function DialogueNodeEditor({ node }: { node: NodeOfType<"comms.dialogue"> }) {
    const quest = useEditor(selectActiveQuest);
    const updateNodeData = useEditor((s) => s.updateNodeData);
    const setUi = useEditor((s) => s.setUi);

    const first = dialogueFirstLine(node.data, quest);

    return (
        <div className="grid gap-2 pt-1 px-3">
            <FieldShell
                label="Conversation type"
                hint="Each type opens its own editor interface — a phone script, a Kisscord DM window, an inbox, or an IRC channel."
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
            <p className="rounded-md border border-line/70 bg-surface-2 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-ink-3">
                {first ? (
                    <>
                        First line: <span className="text-ink-2">“{first.slice(0, 60)}”</span>
                    </>
                ) : (
                    "Nothing scripted yet."
                )}
            </p>
            {(node.data.kind === "kisscord" || node.data.kind === "weechat") && (
                <div className="-mx-3 border-t border-line/70">
                    <Toggle
                        id={`postlive-${node.id}`}
                        label="Play when the story reaches this node"
                        hint="Off: the conversation is handed to the game when the quest starts — the safe, normal choice. On: nothing appears until the flow arrives here, so a chat can land on a Sequence beat."
                        checked={node.data.postLive}
                        onChange={(postLive) => updateNodeData(node.id, { postLive })}
                    />
                    {node.data.postLive && (
                        <p className="mx-3 mb-2 rounded-md border border-warn/40 bg-warn/10 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-warn">
                            Timed conversations are sent through the game's live messaging API, one
                            message at a time with the delays you set. Player replies, uploads and
                            “unlocks after” steps only work in the normal declarative script, and the
                            game does not clean live messages up with the quest. Worth an in-game
                            check before you ship it.
                        </p>
                    )}
                </div>
            )}
            <button
                type="button"
                className="btn-primary justify-center"
                onClick={() => setUi({ modal: "dialogues", dialogueNode: node.id })}
            >
                <Icon name="message" size={13} />
                Open dialogue editor
            </button>
        </div>
    );
}
