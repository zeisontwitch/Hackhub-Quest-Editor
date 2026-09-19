/**
 * The mock profile (stage 2, r188): a Twitter-shaped card that shows what the
 * account will look like in the game — and, in the Twotter panel, IS the editor
 * for it. Click the name, the handle, the bio or either picture and it becomes
 * a field; press away and it is a profile again.
 *
 * Why a mock and not "just nicer fields": an author writing a character needs to
 * see the whole face at once. Twenty-four characters of display name and a
 * three-line bio read completely differently once they sit under a banner.
 *
 * Two honest limits, both said out loud in the preview:
 *  - the game decides the final layout, so this is a preview, not a guarantee;
 *  - the tweet list shows the GAME's order (newest first) while the node's list
 *    stays in the order the author wrote it (oldest first, the way it happened).
 *
 * And one thing an author asks the moment a blank picture sits in front of them
 * (Zeis, 2026-09-19): what does the game fill in for me? The r179 probe answers
 * it — `Twotter.createUser({ username, bio, verified })` came back with a name, a
 * surname, a picture, a banner, follower counts and a password, because
 * `createUser` fills whatever it is not handed. We hand it everything the author
 * typed, so the only place its own defaults get to show is the two pictures we
 * leave out deliberately. The bio is the exception with a reason: a bio that is
 * *missing* is the shape that crashed Twotter's search for seven rounds (r31),
 * so we always send a string and a blank bio stays blank.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import type { TwotterAccountDoc } from "@/schema/project";

/** The three text areas that can be edited in place. */
type Field = "displayName" | "handle" | "bio";

/**
 * Reads the picked file into a data URI, with the game's own rule about which
 * files it accepts. Same rule and same error text as the inspector's image
 * picker — an author should learn it once.
 */
function readImage(file: File, onChange: (next: string) => void, onError: (why: string) => void) {
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
        onError("The game only reads PNG and JPG files — PNG is preferred.");
        return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
}

function PicturePicker({
    label,
    value,
    onChange,
    className,
    children,
}: {
    label: string;
    value?: string;
    onChange: (next: string | undefined) => void;
    className?: string;
    children: ReactNode;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    return (
        <div className={cn("group/pic relative", className)}>
            {children}
            <button
                type="button"
                aria-label={`Change ${label.toLowerCase()}`}
                title={`Choose a ${label.toLowerCase()} (PNG or JPG) — or leave it blank and the game draws its own`}
                className={cn(
                    "absolute inset-0 flex items-center justify-center gap-1.5 bg-void/45 text-[11px] font-medium text-ink",
                    "opacity-0 transition-opacity group-hover/pic:opacity-100 focus-visible:opacity-100",
                )}
                onClick={() => fileRef.current?.click()}
            >
                <Icon name="upload" size={13} />
                {value ? "Change" : `Add ${label.toLowerCase()}`}
            </button>
            {value && (
                <button
                    type="button"
                    aria-label={`Remove ${label.toLowerCase()}`}
                    title={`Remove the ${label.toLowerCase()}`}
                    className="absolute top-1 right-1 rounded bg-void/60 p-1 text-ink-3 opacity-0 transition-opacity group-hover/pic:opacity-100 focus-visible:opacity-100 hover:text-danger"
                    onClick={() => onChange(undefined)}
                >
                    <Icon name="trash" size={12} />
                </button>
            )}
            <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg"
                aria-label={label}
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) readImage(file, (next) => { setError(null); onChange(next); }, setError);
                    e.target.value = "";
                }}
            />
            {error && (
                <p className="absolute -bottom-5 left-0 text-[10px] text-danger">{error}</p>
            )}
        </div>
    );
}

/** A region that is a profile line until it is clicked, then an input. */
function InlineEdit({
    ariaLabel,
    value,
    placeholder,
    multiline,
    className,
    onCommit,
    onDone,
}: {
    ariaLabel: string;
    value: string;
    placeholder: string;
    multiline?: boolean;
    className?: string;
    onCommit: (next: string) => void;
    onDone: () => void;
}) {
    const [draft, setDraft] = useState(value);
    // Every time the editor opens, start from what is stored now — another
    // click may have changed it, and a stale draft would silently revert it.
    useEffect(() => setDraft(value), [value]);

    const commit = () => {
        onCommit(draft);
        onDone();
    };

    const shared = {
        autoFocus: true,
        "aria-label": ariaLabel,
        value: draft,
        onChange: (e: { target: { value: string } }) => setDraft(e.target.value),
        onBlur: commit,
        onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !multiline) {
                e.preventDefault();
                commit();
            }
            if (e.key === "Escape") {
                // Stop here rather than closing the whole panel: Escape in a
                // modal belongs to the field the author is typing in first.
                e.stopPropagation();
                setDraft(value);
                onDone();
            }
        },
    };

    return multiline ? (
        <textarea {...shared} rows={2} placeholder={placeholder} className={cn("w-full resize-none rounded-md border border-cat-comms/60 bg-void/60 px-2 py-1 text-ink outline-none", className)} />
    ) : (
        <input {...shared} placeholder={placeholder} className={cn("w-full rounded-md border border-cat-comms/60 bg-void/60 px-2 py-0.5 text-ink outline-none", className)} />
    );
}

/** The blue tick, drawn the way the game draws it next to a name. */
function VerifiedTick({ size = 13 }: { size?: number }) {
    return (
        <span
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#1d9bf0] text-white"
            style={{ width: size, height: size }}
            title="Verified"
            aria-label="Verified"
        >
            <Icon name="check" size={size - 4} />
        </span>
    );
}

/** The tick when it can be clicked: same drawing, but it turns the check off. */
function VerifiedButton({ onToggle }: { onToggle: () => void }) {
    return (
        <button
            type="button"
            aria-label="Remove the blue check"
            title="Verified — click to remove the blue check"
            className="shrink-0 rounded-full hover:opacity-70"
            onClick={onToggle}
        >
            <VerifiedTick />
        </button>
    );
}

/**
 * What an account looks like when it has no picture yet: a bird, on a tint.
 *
 * The banner has the room for the sentence an author actually needs — that a
 * blank picture is not a hole to fill but a choice the game covers for them. The
 * avatar is 72px of circle and carries the same fact in its tooltip.
 */
function Placeholder({ label, className }: { label: string; className?: string }) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-cat-comms/25 via-surface-2 to-surface-3 text-ink-4", className)}>
            <Icon name="bird" size={label === "banner" ? 22 : 18} />
            {label === "banner" && (
                <span className="px-2 text-center text-[10px] leading-tight">
                    No banner — blank is fine, the game draws its own
                </span>
            )}
        </div>
    );
}

export function MockProfile({
    account,
    onPatch,
    footer,
    className,
}: {
    account: TwotterAccountDoc;
    /** Given ⇒ the card is editable. Omitted ⇒ read-only (the node preview). */
    onPatch?: (next: Partial<Omit<TwotterAccountDoc, "id">>) => void;
    /** A line under the card: what it is, or where to go to fix it. */
    footer?: ReactNode;
    className?: string;
}) {
    const [editing, setEditing] = useState<Field | null>(null);
    const editable = !!onPatch;
    const handle = account.handle.replace(/^@/, "");

    /** A region that becomes a field when clicked — or, read-only, plain text. */
    const region = (
        field: Field,
        label: string,
        value: string,
        placeholder: string,
        display: ReactNode,
        opts: { multiline?: boolean; className?: string } = {},
    ) => {
        if (editable && editing === field) {
            return (
                <InlineEdit
                    ariaLabel={label}
                    value={value}
                    placeholder={placeholder}
                    multiline={opts.multiline}
                    className={opts.className}
                    onCommit={(next) => onPatch?.({ [field]: field === "handle" ? next.replace(/^@/, "") : next } as Partial<TwotterAccountDoc>)}
                    onDone={() => setEditing(null)}
                />
            );
        }
        const body = value ? display : <span className="text-ink-4">{placeholder}</span>;
        if (!editable) return <div className={opts.className}>{body}</div>;
        return (
            <button
                type="button"
                aria-label={`Edit ${label.toLowerCase()}`}
                title={`Click to edit the ${label.toLowerCase()}`}
                className={cn(
                    "block w-full rounded-md border border-transparent px-1.5 py-0.5 text-left hover:border-cat-comms/50 hover:bg-void/30",
                    opts.className,
                )}
                onClick={() => setEditing(field)}
            >
                {body}
            </button>
        );
    };

    return (
        <div className={cn("overflow-hidden rounded-xl border border-line bg-surface", className)}>
            <PicturePicker
                label="Banner"
                value={account.banner}
                onChange={(banner) => onPatch?.({ banner })}
                className={editable ? undefined : "pointer-events-none"}
            >
                {account.banner ? (
                    <img src={account.banner} alt="" className="h-24 w-full object-cover" />
                ) : (
                    <Placeholder label="banner" className="h-24 w-full" />
                )}
            </PicturePicker>

            <div className="px-3 pb-3">
                <div className="-mt-9 flex items-end justify-between">
                    <PicturePicker
                        label="Profile picture"
                        value={account.avatar}
                        onChange={(avatar) => onPatch?.({ avatar })}
                        className={cn("size-18 shrink-0 overflow-hidden rounded-full ring-4 ring-surface", !editable && "pointer-events-none")}
                    >
                        {account.avatar ? (
                            <img src={account.avatar} alt="" className="size-full object-cover" />
                        ) : (
                            <Placeholder label="avatar" className="size-full rounded-full" />
                        )}
                    </PicturePicker>
                    <span className="mb-1 flex items-center gap-1.5 font-mono text-[10.5px] text-ink-4">
                        <Icon name="bird" size={11} />
                        {handle ? `@${handle}` : "no handle yet"}
                    </span>
                </div>

                <div className="mt-2">
                    <div className="flex items-center gap-1.5">
                        {region(
                            "displayName",
                            "Display name",
                            account.displayName,
                            "Unnamed character",
                            <span className="truncate text-[15px] leading-tight font-semibold text-ink">
                                {account.displayName}
                            </span>,
                            { className: "min-w-0 flex-1 text-[15px] font-semibold" },
                        )}
                        {account.verified &&
                            (editable ? (
                                <VerifiedButton onToggle={() => onPatch?.({ verified: false })} />
                            ) : (
                                <VerifiedTick />
                            ))}
                    </div>
                    {region(
                        "handle",
                        "Handle",
                        handle,
                        "handle_missing",
                        <span className="truncate font-mono text-[12px] text-ink-3">@{handle}</span>,
                        { className: "mt-0.5 max-w-full" },
                    )}
                </div>

                <div className="mt-2">
                    {region(
                        "bio",
                        "Bio",
                        account.bio,
                        "No bio yet — an abandoned account has an empty one too.",
                        <span className="block text-[12px] leading-relaxed whitespace-pre-wrap text-ink-2">{account.bio}</span>,
                        { multiline: true, className: "max-w-full" },
                    )}
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-2 text-[11.5px] text-ink-3">
                    <span>
                        <b className="text-ink-2">{account.followers.toLocaleString()}</b> followers
                    </span>
                    <span>
                        <b className="text-ink-2">{account.following.toLocaleString()}</b> following
                    </span>
                    {account.verified && (
                        <span className="flex items-center gap-1 text-cat-comms">
                            <VerifiedTick size={11} /> verified
                        </span>
                    )}
                    <span className="ml-auto text-ink-4">the game fills in “Joined …” itself</span>
                </div>
            </div>

            {footer && <div className="border-t border-line bg-surface-3 px-3 py-2 text-[10.5px] leading-relaxed text-ink-4">{footer}</div>}
        </div>
    );
}
