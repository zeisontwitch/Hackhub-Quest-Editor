/**
 * The WeeChat dialogue editor: an IRC-terminal preview above the channel
 * script. Player moments: "type" a scripted line (hackertyper) or answer
 * freely with a failure route.
 */
import { nanoid } from "nanoid";
import { FieldShell, NumberInput, SelectInput, TextArea, TextInput, Toggle } from "@/editor/inspector/primitives";
import { TextInputWithGenerate } from "@/editor/inspector/GenerateButton";
import { generateField } from "@/lib/generate";
import type { WeeChatMessage } from "@/schema/nodes";
import { ItemCard, SimFrame, moved } from "./chrome";
import { PlayerInputFields } from "./PlayerInputFields";

export interface WeeChatValue {
    host: string;
    password: string;
    registerServer: boolean;
    messages: WeeChatMessage[];
}

const stamp = (i: number) => {
    const minutes = 9 * 60 + 7 + i;
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

export function WeeChatScript({ value, onChange }: { value: WeeChatValue; onChange: (p: Partial<WeeChatValue>) => void }) {
    const messages = value.messages;
    const write = (next: WeeChatMessage[]) => onChange({ messages: next });
    const patch = (id: string, p: Partial<WeeChatMessage>) =>
        write(messages.map((m) => (m.id === id ? { ...m, ...p } : m)));

    return (
        <div className="pt-1">
            <div className="grid grid-cols-2 gap-2 px-3 pt-2">
                <FieldShell label="Server host" hint="The IRC server the player connects to.">
                    <TextInputWithGenerate
                        ariaLabel="WeeChat host"
                        value={value.host}
                        onChange={(host) => onChange({ host })}
                        onGenerate={() => onChange({ host: generateField("domain") })}
                        generateLabel="server host"
                        mono
                        placeholder="irc.darknet.org"
                    />
                </FieldShell>
                <FieldShell label="Password" hint="The player connects with: weechat <host> <password>.">
                    <TextInput
                        ariaLabel="WeeChat password"
                        value={value.password}
                        onChange={(password) => onChange({ password })}
                        mono
                    />
                </FieldShell>
            </div>
            <div className="px-3 pt-2">
                <Toggle
                    label="Register the server"
                    hint="Register the server with WeeChat so it appears in the player's server list automatically."
                    checked={value.registerServer}
                    onChange={(registerServer) => onChange({ registerServer })}
                />
            </div>

            <SimFrame app="WeeChat" caption={value.host || "no server"}>
                <div className="max-h-56 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed">
                    <p className="text-ink-4">
                        -- Connected to {value.host || "…"}. Type to join the channel.
                    </p>
                    {messages.map((m, i) => (
                        <p key={m.id} className="whitespace-pre-wrap">
                            <span className="text-ink-4">[{stamp(i)}]</span>{" "}
                            {m.isMine || m.playerAction !== "none" ? (
                                <span className="text-accent">&lt;you&gt;</span>
                            ) : (
                                <span className="text-ok">&lt;{m.username || "???"}&gt;</span>
                            )}{" "}
                            <span className={m.isMine || m.playerAction !== "none" ? "text-ink" : "text-ink-2"}>
                                {m.playerAction === "input" ? "✍ types an answer" : m.playerAction === "send" ? m.playerText || "…" : m.content || "…"}
                            </span>
                        </p>
                    ))}
                </div>
            </SimFrame>

            <div className="mt-3 flex items-center justify-between px-3">
                <h4 className="text-[10px] font-semibold tracking-wider text-ink-3 uppercase">
                    Channel log · {messages.length} line{messages.length === 1 ? "" : "s"}
                </h4>
                <button
                    type="button"
                    className="btn-default"
                    onClick={() =>
                        write([
                            ...messages,
                            { id: nanoid(8), content: "", username: "informant", isMine: false, delayMs: 1000, playerAction: "none", playerText: "" },
                        ])
                    }
                >
                    + Add line
                </button>
            </div>

            <div className="grid gap-2 px-3 py-2">
                {messages.map((m, i) => (
                    <ItemCard
                        key={m.id}
                        index={i}
                        title={`${m.isMine || m.playerAction !== "none" ? "you" : m.username || "???"}: ${
                            m.playerAction === "send" ? m.playerText.slice(0, 30) : m.content.slice(0, 30) || "empty line"
                        }`}
                        onRemove={() => write(messages.filter((x) => x.id !== m.id))}
                        onUp={() => write(moved(messages, i, -1))}
                        onDown={() => write(moved(messages, i, 1))}
                        canUp={i > 0}
                        canDown={i < messages.length - 1}
                    >
                        <FieldShell label="Who acts" hint="A channel line prints from a nick. Player actions pause the log until the player does their part.">
                            <SelectInput
                                ariaLabel={`Line ${i + 1} actor`}
                                value={m.playerAction !== "none" ? m.playerAction : m.isMine ? "mine" : "npc"}
                                onChange={(v) =>
                                    patch(m.id, {
                                        playerAction: v === "send" || v === "input" ? v : "none",
                                        isMine: v !== "npc",
                                    })
                                }
                                options={[
                                    { value: "npc", label: "Someone in the channel" },
                                    { value: "mine", label: "Player line (appears instantly)" },
                                    { value: "send", label: "Player types it out (hackertyper)" },
                                    { value: "input", label: "Player types a free answer" },
                                ]}
                            />
                        </FieldShell>
                        {m.playerAction === "none" && (
                            <>
                                <TextArea
                                    ariaLabel={`Line ${i + 1}`}
                                    value={m.content}
                                    onChange={(content) => patch(m.id, { content })}
                                    rows={2}
                                    placeholder="The line printed in the channel"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <FieldShell label="Username" hint="The nick speaking this line. Ignored when sent by the player.">
                                        <TextInputWithGenerate
                                            ariaLabel={`Username ${i + 1}`}
                                            value={m.username ?? ""}
                                            onChange={(username) => patch(m.id, { username })}
                                            onGenerate={() => patch(m.id, { username: generateField("username") })}
                                            generateLabel="username"
                                            mono
                                            placeholder="informant"
                                        />
                                    </FieldShell>
                                    <FieldShell label="Delay before (seconds)">
                                        <NumberInput
                                            value={m.delayMs / 1000}
                                            onChange={(s) => patch(m.id, { delayMs: Math.round(s * 1000) })}
                                            min={0}
                                            step={0.5}
                                        />
                                    </FieldShell>
                                </div>
                            </>
                        )}
                        {m.playerAction === "send" && (
                            <TextArea
                                ariaLabel={`Line ${i + 1} typed text`}
                                value={m.playerText}
                                onChange={(playerText) => patch(m.id, { playerText })}
                                rows={2}
                                placeholder="The line the player mashes out, character by character"
                            />
                        )}
                        {m.playerAction === "input" && (
                            <PlayerInputFields
                                value={m.input ?? { expected: "", matchMode: "exact", caseSensitive: false, failureText: "", wrongRoute: "retry" }}
                                onChange={(input) => patch(m.id, { input })}
                                index={i}
                            />
                        )}
                    </ItemCard>
                ))}
            </div>
        </div>
    );
}
