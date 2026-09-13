/**
 * Mod-tab field components: an image picker (cover/icon) that embeds the file
 * as a data URL — the compiler turns it into a real file in the exported zip —
 * and a tag input with autocomplete and one-click common tags.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { forgetTag, rememberTags } from "@/lib/tagMemory";
import { FieldShell } from "./primitives";

/* The most-used Workshop tags, offered as suggestions and quick chips.
   Users can always type their own. */
export const COMMON_TAGS = [
    "story", "quests", "quest", "darknet", "websites", "website", "terminal",
    "network", "app", "apps", "music", "media", "utility", "crypto", "mystery",
    "desktop-app", "tools", "tool", "mission", "missions", "murder mystery",
    "email", "kisscord", "database", "multiple endings", "security", "notes",
    "game", "phone", "application", "pvp-safe", "co-op-safe", "beginner",
    "investigation", "finance",
];

/* ── image picker ────────────────────────────────────────────────────────── */

export function ImagePickerField({
    label,
    hint,
    value,
    onChange,
    ariaLabel,
}: {
    label: string;
    hint: string;
    value?: string;
    onChange: (next: string | undefined) => void;
    ariaLabel: string;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const isDataUrl = !!value && value.startsWith("data:image/");

    const onFile = (file: File | undefined) => {
        if (!file) return;
        if (file.type !== "image/png" && file.type !== "image/jpeg") {
            setError("The game only reads PNG and JPG files — PNG is preferred.");
            return;
        }
        setError(null);
        const reader = new FileReader();
        reader.onload = () => onChange(String(reader.result));
        reader.readAsDataURL(file);
    };

    return (
        <FieldShell label={label} hint={hint}>
            <div className="grid gap-1.5">
                {isDataUrl && (
                    // eslint-disable-next-line jsx-a11y/img-redundant-alt
                    <img
                        src={value}
                        alt={`${label} preview`}
                        className="h-16 w-auto max-w-full rounded border border-line object-contain"
                    />
                )}
                {value && !isDataUrl && (
                    <p className="truncate font-mono text-[11px] text-ink-3">{value}</p>
                )}
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        className="btn-default"
                        onClick={() => fileRef.current?.click()}
                        title="The game only recognises PNG and JPG files — PNG is preferred"
                    >
                        <Icon name="upload" size={12} />
                        {value ? "Replace image…" : "Choose image…"}
                    </button>
                    {value && (
                        <button
                            type="button"
                            className="btn-default"
                            onClick={() => {
                                onChange(undefined);
                                setError(null);
                            }}
                        >
                            Remove
                        </button>
                    )}
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        aria-label={ariaLabel}
                        className="hidden"
                        onChange={(e) => {
                            onFile(e.target.files?.[0]);
                            e.target.value = "";
                        }}
                    />
                </div>
                <p className="text-[10.5px] leading-relaxed text-ink-3">
                    The game only recognises <strong className="text-ink-2">PNG and JPG</strong> files —
                    PNG is preferred. The file is embedded in the mod and its name lands in the
                    manifest automatically when you export.
                </p>
                {error && <p className="text-[10.5px] text-danger">{error}</p>}
            </div>
        </FieldShell>
    );
}

/* ── tag input ───────────────────────────────────────────────────────────── */

export function TagInput({
    value,
    onChange,
    ariaLabel,
}: {
    value: string[];
    onChange: (tags: string[]) => void;
    ariaLabel: string;
}) {
    const [draft, setDraft] = useState("");
    // Tags this browser has seen before, so a tag an author invents once is a
    // click away in every later mod.
    const [remembered, setRemembered] = useState<string[]>([]);

    useEffect(() => {
        // Seed the memory with whatever the project already carries, so tags
        // typed before this feature existed are remembered too.
        setRemembered(rememberTags(value));
        // Only on mount: later additions are recorded by `add`.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const add = (raw: string) => {
        const parts = raw.split(",").map((t) => t.trim()).filter(Boolean);
        if (!parts.length) return;
        const next = [...value];
        for (const p of parts) if (!next.includes(p)) next.push(p);
        onChange(next);
        setRemembered(rememberTags(parts));
        setDraft("");
    };

    const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

    const suggestions = useMemo(() => {
        const q = draft.trim().toLowerCase();
        if (!q) return [];
        const pool = [...remembered, ...COMMON_TAGS];
        return [...new Set(pool)]
            .filter((t) => t.toLowerCase().includes(q) && !value.includes(t) && t.toLowerCase() !== q)
            .slice(0, 5);
    }, [draft, value, remembered]);

    const unusedRemembered = remembered.filter(
        (t) => !value.includes(t) && !COMMON_TAGS.includes(t),
    );

    const unusedCommon = COMMON_TAGS.filter((t) => !value.includes(t));

    return (
        <div className="grid gap-1.5">
            <div className="flex flex-wrap items-center gap-1 rounded-md border border-line bg-surface-2 px-1.5 py-1">
                {value.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-3 px-2 py-0.5 font-mono text-[10.5px] text-ink-2"
                    >
                        {tag}
                        <button
                            type="button"
                            className="text-ink-4 hover:text-danger"
                            aria-label={`Remove tag ${tag}`}
                            onClick={() => remove(tag)}
                        >
                            <Icon name="x" size={10} />
                        </button>
                    </span>
                ))}
                <input
                    aria-label={ariaLabel}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            add(draft);
                        } else if (e.key === "Tab" && suggestions.length) {
                            e.preventDefault();
                            add(suggestions[0]);
                        } else if (e.key === "Backspace" && !draft && value.length) {
                            remove(value[value.length - 1]);
                        }
                    }}
                    onBlur={() => draft.trim() && add(draft)}
                    placeholder={value.length ? "" : "Type a tag, press Enter"}
                    className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 font-mono text-[11.5px] text-ink placeholder:text-ink-4 focus:outline-none"
                />
            </div>
            {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {suggestions.map((s) => (
                        <button
                            key={s}
                            type="button"
                            className="rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 font-mono text-[10.5px] text-ink-2 hover:border-accent"
                            onClick={() => add(s)}
                            title="Add this tag (or press Tab)"
                        >
                            {s} ↹
                        </button>
                    ))}
                </div>
            )}
            {unusedRemembered.length > 0 && (
                <div className="grid gap-1">
                    <p className="text-[10.5px] text-ink-3">
                        Your tags — ones you have used before, click to add
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {unusedRemembered.map((t) => (
                            <span
                                key={t}
                                className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-ink-3 hover:border-accent hover:text-ink-2"
                            >
                                <button type="button" onClick={() => add(t)} title="Add this tag">
                                    + {t}
                                </button>
                                <button
                                    type="button"
                                    className="text-ink-4 hover:text-danger"
                                    aria-label={`Forget tag ${t}`}
                                    title="Forget this tag"
                                    onClick={() => setRemembered(forgetTag(t))}
                                >
                                    <Icon name="x" size={9} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
            <details className="text-[10.5px] text-ink-3">
                <summary className="cursor-pointer select-none hover:text-ink-2">
                    Common tags — click to add
                </summary>
                <div className="mt-1.5 flex flex-wrap gap-1">
                    {unusedCommon.map((t) => (
                        <button
                            key={t}
                            type="button"
                            className="rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-ink-3 hover:border-accent hover:text-ink-2"
                            onClick={() => add(t)}
                        >
                            + {t}
                        </button>
                    ))}
                </div>
            </details>
        </div>
    );
}
