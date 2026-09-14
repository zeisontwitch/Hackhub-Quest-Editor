/**
 * The Kisscord dialogue editor: a live DM-window preview above a scripted
 * message list. Player moments: send a scripted message (hackertyper-style),
 * upload a file, or type a free answer with a failure route.
 */
import { nanoid } from "nanoid";
import { Icon } from "@/components/Icon";
import { FieldShell, NumberInput, SelectInput, TextArea, TextInput } from "@/editor/inspector/primitives";
import { TextInputWithGenerate } from "@/editor/inspector/GenerateButton";
import { generateField } from "@/lib/generate";
import type { KisscordMessage } from "@/schema/nodes";
import { selectActiveQuest, useEditor } from "@/store/editor";
import { ItemCard, SimFrame, moved } from "./chrome";
import { PlayerInputFields } from "./PlayerInputFields";

export interface KisscordValue {
    contactId: string;
    messages: KisscordMessage[];
}

export function KisscordScript({ value, onChange }: { value: KisscordValue; onChange: (p: Partial<KisscordValue>) => void }) {
    const messages = value.messages;
    const write = (next: KisscordMessage[]) => onChange({ messages: next });
    const patch = (id: string, p: Partial<KisscordMessage>) =>
        write(messages.map((m) => (m.id === id ? { ...m, ...p } : m)));

    return (
        <div className="pt-1">
            <div className="grid gap-2 px-3 pt-2">
                <FieldShell
                    label="Contact"
                    hint="The Kisscord NPC this conversation happens with. Registered by the quest."
                >
                    <TextInputWithGenerate
                        ariaLabel="Kisscord contact"
                        value={value.contactId}
                        onChange={(contactId) => onChange({ contactId })}
                        onGenerate={() => onChange({ contactId: generateField("username") })}
                        generateLabel="handle"
                        mono
                        placeholder="handler"
                    />
                </FieldShell>
            </div>

            <SimFrame app="Kisscord" caption={value.contactId || "no contact"}>
                <div className="flex max-h-56 flex-col gap-2 overflow-y-auto p-3">
                    {messages.length === 0 && (
                        <p className="py-2 text-center text-[11px] text-ink-4">
                            No messages yet — add the first line below.
                        </p>
                    )}
                    {messages.map((m) => (
                        <div key={m.id} className={m.isMine || m.playerAction !== "none" ? "self-end" : "self-start"}>
                            {m.unlocksAfter.length > 0 && (
                                <p className="mb-0.5 flex items-center gap-1 text-[9.5px] text-ink-4">
                                    <Icon name="lock" size={9} />
                                    appears once done: {m.unlocksAfter.join(", ")}
                                </p>
                            )}
                            {m.playerAction === "upload" ? (
                                <div className="max-w-[85%] rounded-lg rounded-br-sm bg-accent px-2.5 py-1.5 text-[11.5px] text-void">
                                    📎 {m.upload?.name || "file"}
                                    {m.upload?.extension ? `.${m.upload.extension}` : ""}
                                    <span className="block text-[9.5px] opacity-80">you upload a file</span>
                                </div>
                            ) : m.playerAction === "input" ? (
                                <div className="max-w-[85%] rounded-lg rounded-br-sm border border-accent/50 bg-accent-soft px-2.5 py-1.5 text-[11px] text-accent">
                                    ✍ you type an answer
                                </div>
                            ) : (
                                <div
                                    className={
                                        m.isMine || m.playerAction === "send"
                                            ? "max-w-[85%] rounded-lg rounded-br-sm bg-accent px-2.5 py-1.5 text-[11.5px] whitespace-pre-wrap text-void"
                                            : "max-w-[85%] rounded-lg rounded-bl-sm bg-surface-3 px-2.5 py-1.5 text-[11.5px] whitespace-pre-wrap text-ink"
                                    }
                                >
                                    {m.playerAction === "send" ? m.playerText || "…" : m.content || "…"}
                                    {m.playerAction === "send" && (
                                        <span className="block text-[9.5px] opacity-80">you type this out</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </SimFrame>

            <div className="mt-3 flex items-center justify-between px-3">
                <h4 className="text-[10px] font-semibold tracking-wider text-ink-3 uppercase">
                    Script · {messages.length} message{messages.length === 1 ? "" : "s"}
                </h4>
                <button
                    type="button"
                    className="btn-default"
                    onClick={() =>
                        write([
                            ...messages,
                            { id: nanoid(8), content: "", isMine: false, delayMs: 1000, unlocksAfter: [], playerAction: "none", playerText: "" },
                        ])
                    }
                >
                    <Icon name="plus" size={12} />
                    Add message
                </button>
            </div>

            <div className="grid gap-2 px-3 py-2">
                {messages.map((m, i) => (
                    <ItemCard
                        key={m.id}
                        index={i}
                        title={
                            m.playerAction === "send"
                                ? `you: ${m.playerText.slice(0, 32) || "…"}`
                                : m.playerAction === "upload"
                                  ? `you upload ${m.upload?.name || "…"}`
                                  : m.playerAction === "input"
                                    ? "you type an answer"
                                    : m.content.slice(0, 40) || "empty message"
                        }
                        onRemove={() => write(messages.filter((x) => x.id !== m.id))}
                        onUp={() => write(moved(messages, i, -1))}
                        onDown={() => write(moved(messages, i, 1))}
                        canUp={i > 0}
                        canDown={i < messages.length - 1}
                    >
                        <FieldShell
                            label="Who acts"
                            hint="An NPC message appears in their colour. The player actions pause the chat until the player does their part."
                        >
                            <SelectInput
                                ariaLabel={`Message ${i + 1} actor`}
                                value={m.playerAction !== "none" ? m.playerAction : m.isMine ? "mine-scripted" : "npc"}
                                onChange={(v) =>
                                    patch(m.id, {
                                        playerAction: v === "send" || v === "upload" || v === "input" ? v : "none",
                                        isMine: v === "mine-scripted" || v === "send" || v === "upload" || v === "input",
                                    })
                                }
                                options={[
                                    { value: "npc", label: "The contact writes" },
                                    { value: "mine-scripted", label: "Player message (appears instantly)" },
                                    { value: "send", label: "Player types it out (hackertyper)" },
                                    { value: "upload", label: "Player uploads a file" },
                                    { value: "input", label: "Player types a free answer" },
                                ]}
                            />
                        </FieldShell>
                        {m.playerAction === "none" && (
                            <TextArea
                                ariaLabel={`Message ${i + 1}`}
                                value={m.content}
                                onChange={(content) => patch(m.id, { content })}
                                rows={2}
                                placeholder="The message text"
                            />
                        )}
                        {m.playerAction === "send" && (
                            <TextArea
                                ariaLabel={`Message ${i + 1} typed text`}
                                value={m.playerText}
                                onChange={(playerText) => patch(m.id, { playerText })}
                                rows={2}
                                placeholder="The message the player mashes out, character by character"
                            />
                        )}
                        {m.playerAction === "upload" && (
                            <div className="grid grid-cols-2 gap-2">
                                <FieldShell label="File name" hint="What the upload is called in the chat.">
                                    <TextInput
                                        ariaLabel={`Upload name ${i + 1}`}
                                        value={m.upload?.name ?? ""}
                                        onChange={(name) => patch(m.id, { upload: { name, extension: m.upload?.extension ?? "", content: m.upload?.content ?? "" } })}
                                        mono
                                        placeholder="leaked_memo"
                                    />
                                </FieldShell>
                                <FieldShell label="Extension">
                                    <TextInput
                                        ariaLabel={`Upload extension ${i + 1}`}
                                        value={m.upload?.extension ?? ""}
                                        onChange={(extension) => patch(m.id, { upload: { name: m.upload?.name ?? "", extension, content: m.upload?.content ?? "" } })}
                                        mono
                                        placeholder="pdf"
                                    />
                                </FieldShell>
                            </div>
                        )}
                        {m.playerAction === "input" && (
                            <PlayerInputFields
                                value={m.input ?? { expected: "", matchMode: "exact", caseSensitive: false, failureText: "", wrongRoute: "retry" }}
                                onChange={(input) => patch(m.id, { input })}
                                index={i}
                            />
                        )}
                        {m.playerAction === "none" ? (
                            <div className="grid grid-cols-2 gap-2">
                                <FieldShell label="Delay before (seconds)" hint="Paces the conversation. 0 shows the message immediately after the previous one.">
                                    <NumberInput
                                        value={m.delayMs / 1000}
                                        onChange={(s) => patch(m.id, { delayMs: Math.round(s * 1000) })}
                                        min={0}
                                        step={0.5}
                                    />
                                </FieldShell>
                            </div>
                        ) : null}
                        <UnlocksPicker messageId={m.id} messages={messages} patch={patch} />
                    </ItemCard>
                ))}
            </div>
        </div>
    );
}

/** Objective gating chips — kept out of the main JSX to stay readable. */
function UnlocksPicker({
    messageId,
    messages,
    patch,
}: {
    messageId: string;
    messages: KisscordMessage[];
    patch: (id: string, p: Partial<KisscordMessage>) => void;
}) {
    const quest = useEditor(selectActiveQuest);
    const m = messages.find((x) => x.id === messageId)!;
    const objectives = (quest?.graph.nodes ?? [])
        .filter((n) => n.type === "objective")
        .map((n) => (n.type === "objective" ? n.data.name : ""))
        .filter(Boolean);
    if (objectives.length === 0) return null;
    return (
        <FieldShell
            label="Waits for objectives"
            hint="The chain pauses at the first gated message and resumes automatically once every ticked objective is done — reloads included. Leave all unticked for an uninterrupted chat."
        >
            <div className="flex flex-wrap gap-1.5">
                {objectives.map((name) => {
                    const on = m.unlocksAfter.includes(name);
                    return (
                        <button
                            key={name}
                            type="button"
                            aria-pressed={on}
                            onClick={() =>
                                patch(messageId, {
                                    unlocksAfter: on
                                        ? m.unlocksAfter.filter((o) => o !== name)
                                        : [...m.unlocksAfter, name],
                                })
                            }
                            className={
                                on
                                    ? "rounded-full border border-accent bg-accent-soft px-2 py-0.5 text-[10.5px] text-accent"
                                    : "rounded-full border border-line px-2 py-0.5 text-[10.5px] text-ink-3 hover:text-ink"
                            }
                        >
                            {name}
                        </button>
                    );
                })}
            </div>
        </FieldShell>
    );
}
