/**
 * The mail dialogue editor: the player's inbox reading view above the compose
 * fields, attachment included.
 */
import { FieldShell, TextArea, TextInput, Toggle } from "@/editor/inspector/primitives";
import type { MailNodeData } from "@/schema/nodes";
import { SimFrame } from "./chrome";
import { mailBodyText } from "@/compiler/mailText";

export function MailScript({ value, onChange }: { value: MailNodeData; onChange: (p: Partial<MailNodeData>) => void }) {
    const { from, to, subject, content, attachment } = value;
    return (
        <div className="pt-1">
            <SimFrame app="Mail" caption={to ? `to ${to}` : "to the player"} className="bg-[#10131a]">
                <div className="p-3">
                    <p className="text-[13px] font-semibold text-ink">{subject || "(no subject)"}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 border-b border-line/70 pb-2 text-[10.5px] text-ink-4">
                        <span>
                            From <span className="text-ink-2">{from || "unknown"}</span>
                        </span>
                        <span>
                            To <span className="text-ink-2">{to || "you"}</span>
                        </span>
                        <span>now</span>
                    </div>
                    {/* GoMail prints the body as plain text, so the preview
                        shows exactly what the compiler will send - not the
                        rendered HTML. Showing the rendered version here is why
                        a briefing shipped reading "<p>His name is ...". */}
                    <div className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-[11.5px] leading-relaxed text-ink-2">
                        {mailBodyText(content) || "…"}
                    </div>
                    {attachment && attachment.name && (
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-[10.5px] text-ink-3">
                            📎 {attachment.name}.{attachment.extension}
                        </p>
                    )}
                </div>
            </SimFrame>

            <div className="grid grid-cols-2 gap-2 px-3 pt-3">
                <FieldShell
                    label="From"
                    hint="The sender address. Make it a domain the player might look up — it is a lead."
                >
                    <TextInput ariaLabel="Mail from" value={from} onChange={(f) => onChange({ from: f })} mono />
                </FieldShell>
                <FieldShell label="To" hint="Leave blank to send it to the player.">
                    <TextInput ariaLabel="Mail to" value={to ?? ""} onChange={(t) => onChange({ to: t || undefined })} mono />
                </FieldShell>
            </div>
            <div className="grid gap-2 px-3 pt-2">
                <FieldShell label="Subject" hint="The subject line in the player's inbox.">
                    <TextInput ariaLabel="Mail subject" value={subject} onChange={(s) => onChange({ subject: s })} />
                </FieldShell>
                <FieldShell
                    label="Body"
                    hint="The body of the mail. GoMail shows it as plain text — blank lines separate paragraphs. Any HTML you paste in is converted to text for you, so it never reaches the player as tags."
                >
                    <TextArea ariaLabel="Mail body" value={content} onChange={(c) => onChange({ content: c })} rows={8} />
                </FieldShell>
                <Toggle
                    label="The player can reply"
                    hint="Adds a Reply button. Untested against the live game — if it does not appear, a hackertyper reply page is the proven way to take a written answer."
                    checked={value.replyable}
                    onChange={(replyable) => onChange({ replyable })}
                />
                <div className="rounded-md border border-line/70 bg-surface p-2">
                    <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-ink-3 uppercase">Attachment</p>
                    {/* Worth being explicit: an attachment is a file this mail
                        ARRIVES with, not the file the player is sent to fetch.
                        A quest file lives on the target machine, put there by a
                        user's "Files" list on a network node. QA read it the
                        other way round, which is a fair reading of a box
                        labelled only "Attachment". */}
                    <p className="mb-2 text-[10.5px] leading-snug text-ink-4">
                        A file that arrives <em>with</em> this mail — a dossier, a photo, a list. Not
                        the file the player has to go and steal: that one belongs on the target
                        machine, under a user on a network node.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <FieldShell label="File name" hint="The attachment's filename, without the extension.">
                            <TextInput
                                ariaLabel="Attachment name"
                                value={attachment?.name ?? ""}
                                onChange={(name) =>
                                    onChange({
                                        attachment: {
                                            name,
                                            extension: attachment?.extension ?? "",
                                            content: attachment?.content ?? "",
                                        },
                                    })
                                }
                                mono
                            />
                        </FieldShell>
                        <FieldShell label="Extension" hint="e.g. txt, pdf, log. The game picks the viewer from this.">
                            <TextInput
                                ariaLabel="Attachment extension"
                                value={attachment?.extension ?? ""}
                                onChange={(extension) =>
                                    onChange({
                                        attachment: {
                                            name: attachment?.name ?? "",
                                            extension,
                                            content: attachment?.content ?? "",
                                        },
                                    })
                                }
                                mono
                            />
                        </FieldShell>
                    </div>
                    <FieldShell
                        label="Contents"
                        hint="The attachment's contents. For a PDF or image, this is a path to a file you export alongside the mod."
                    >
                        <TextArea
                            ariaLabel="Attachment contents"
                            value={attachment?.content ?? ""}
                            onChange={(content2) =>
                                onChange({
                                    attachment: {
                                        name: attachment?.name ?? "",
                                        extension: attachment?.extension ?? "",
                                        content: content2,
                                    },
                                })
                            }
                            rows={3}
                            mono
                        />
                    </FieldShell>
                </div>
            </div>
        </div>
    );
}
