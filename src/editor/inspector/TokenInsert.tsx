/**
 * The tag picker behind every `tokens: true` field: a sparkle button beside
 * the box that inserts `{{…}}` tags at the caret. Each tag says what it
 * produces, so the author picks by meaning, not by memorised spelling.
 *
 * Deliberately not a Radix popover: this picker is opened and closed in unit
 * tests dozens of times, and Radix's positioning loop turns each of those
 * into seconds under jsdom. A fixed panel in a portal, a backdrop for
 * outside-clicks, Escape to close — everything this picker needs, nothing
 * that spins.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";
import { TextArea, TextInput } from "./primitives";
import type { TokenSuggestion } from "./tokenSuggestions";

const GROUPS: TokenSuggestion["group"][] = ["Saved values", "Network", "Player", "Random"];

export function TokenTextInput({
    ariaLabel,
    value,
    onChange,
    placeholder,
    mono,
    multiline,
    rows,
    suggestions,
}: {
    ariaLabel: string;
    value: string;
    onChange: (next: string) => void;
    placeholder?: string;
    mono?: boolean;
    multiline?: boolean;
    rows?: number;
    suggestions: TokenSuggestion[];
}) {
    const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState(false);
    const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });

    // Escape closes; any scroll re-seats a stale panel by closing it.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        const onScroll = () => setOpen(false);
        document.addEventListener("keydown", onKey);
        document.addEventListener("scroll", onScroll, true);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("scroll", onScroll, true);
        };
    }, [open ]);

    const toggle = () => {
        if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPanelPos({
                top: rect.bottom + 4,
                right: Math.max(8, window.innerWidth - rect.right),
            });
        }
        setOpen((o) => !o);
    };

    const insert = (token: string) => {
        const el = ref.current;
        const start = el?.selectionStart ?? value.length;
        const end = el?.selectionEnd ?? value.length;
        onChange(value.slice(0, start) + token + value.slice(end));
        setOpen(false);
        // Put the caret back after the tag once React commits the new value.
        const caret = start + token.length;
        if (typeof requestAnimationFrame !== "undefined") {
            requestAnimationFrame(() => {
                const live = ref.current;
                if (live) {
                    live.focus();
                    live.setSelectionRange(caret, caret);
                }
            });
        }
    };

    const setRef = (el: HTMLInputElement | HTMLTextAreaElement | null) => {
        ref.current = el;
    };

    return (
        <div className="flex items-start gap-1">
            <div className="min-w-0 flex-1">
                {multiline ? (
                    <TextArea
                        ariaLabel={ariaLabel}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        mono={mono}
                        rows={rows}
                        inputRef={setRef}
                    />
                ) : (
                    <TextInput
                        ariaLabel={ariaLabel}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        mono={mono}
                        inputRef={setRef}
                    />
                )}
            </div>
            <button
                ref={buttonRef}
                type="button"
                onClick={toggle}
                className="btn-default shrink-0 px-2 py-1.5"
                title="Insert a tag"
                aria-label="Insert a tag"
                aria-expanded={open}
            >
                <Icon name="sparkle" size={12} />
            </button>
            {open &&
                createPortal(
                    <>
                        <div
                            className="fixed inset-0 z-50"
                            onClick={() => setOpen(false)}
                            aria-hidden="true"
                        />
                        <div
                            role="group"
                            aria-label="Tags you can insert"
                            className="fixed z-50 max-h-72 w-72 overflow-y-auto rounded-md border border-line bg-surface p-1 shadow-panel"
                            style={{ top: panelPos.top, right: panelPos.right }}
                        >
                            {GROUPS.map((group) => {
                                const items = suggestions.filter((s) => s.group === group);
                                if (items.length === 0) return null;
                                return (
                                    <div key={group}>
                                        <p className="px-2 pt-1.5 pb-0.5 text-[10px] font-semibold tracking-wider text-ink-4 uppercase">
                                            {group}
                                        </p>
                                        {items.map((s) => (
                                            <button
                                                key={s.token}
                                                type="button"
                                                onClick={() => insert(s.token)}
                                                className="flex w-full flex-col items-start gap-0.5 rounded px-2 py-1 text-left hover:bg-surface-2"
                                            >
                                                <span className="text-[11.5px] text-ink-2">{s.label}</span>
                                                <span className="text-[10.5px] leading-snug text-ink-4">{s.produces}</span>
                                                <span className="font-mono text-[10px] text-ink-4">{s.token}</span>
                                            </button>
                                        ))}
                                    </div>
                                );
                            })}
                            {suggestions.every((s) => s.group !== "Saved values") && (
                                <p className="px-2 py-1.5 text-[10.5px] leading-snug text-ink-4">
                                    Tip: “Set quest data” saves values you can insert here.
                                </p>
                            )}
                        </div>
                    </>,
                    document.body,
                )}
        </div>
    );
}
