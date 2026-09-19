/**
 * Pack extras (r203): the things a pack puts outside its own quests.
 *
 * Three lists and a translation table, all of them mod-level (a pack has one
 * start menu, one desktop and one right-click menu, however many quests it
 * ships). Every surface here was read in game first — r200/r201 probe, rows
 * T-16..T-22 — and two of the readings changed what this dialog shows:
 *
 *  - the SDK declares a `section` on menu items and the game ignores it, so
 *    there is no control for it. A switch that does nothing is worse than no
 *    switch;
 *  - a widget's `transparent` defaults to TRUE in the SDK, so a widget with no
 *    flag is text with no background at all. The switch here is visible and
 *    starts OPAQUE, and the compiler always sends the value.
 *
 * The widget's own HTML is authored with the website builder's page editor —
 * a widget and a web page are the same document, and there is no reason to
 * make an author learn a second editor for the same thing.
 */
import { useMemo, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import {
    EmptyHint,
    FieldShell,
    NumberInput,
    SelectInput,
    TextArea,
    TextInput,
    Toggle,
} from "@/editor/inspector/primitives";
import { VisualPageEditor, CodePageEditor } from "@/editor/websites/pageEditor";
import { HANDBOOK_ARTICLES } from "@/schema/handbookArticles";
import {
    CONTEXT_TARGETS,
    DEFAULT_LANGUAGE,
    GAME_LANGUAGES,
    trToken,
} from "@/schema/extras";
import type {
    ContextItemDoc,
    DesktopWidgetDoc,
    ExtraAction,
    MenuItemDoc,
} from "@/schema/extras";
import type { QuestDoc } from "@/schema/project";
import { useEditor } from "@/store/editor";

type ListName = "menuItems" | "widgets" | "contextItems";

const TABS: { id: "menu" | "widgets" | "context" | "text"; label: string; list?: ListName }[] = [
    { id: "menu", label: "Start menu", list: "menuItems" },
    { id: "widgets", label: "Desktop widgets", list: "widgets" },
    { id: "context", label: "Right-click", list: "contextItems" },
    { id: "text", label: "Text & languages" },
];

/** What each action kind is called in the picker, and what it does. */
const ACTION_KINDS = [
    { value: "notify", label: "Show a message" },
    { value: "claim", label: "Start a quest" },
    { value: "mail", label: "Send a mail" },
    { value: "handbook", label: "Open the handbook" },
] as const;

/** Short "what it does" words for the list rows. */
const ACTION_LABELS: Record<(typeof ACTION_KINDS)[number]["value"], string> = {
    notify: "shows a message",
    claim: "starts a quest",
    mail: "sends a mail",
    handbook: "opens the handbook",
};

const TARGET_LABELS: Record<(typeof CONTEXT_TARGETS)[number], string> = {
    file: "A file",
    desktop: "The desktop",
    taskbar: "The taskbar",
    window: "A window",
};

function newId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/** The fields one action kind needs — and only those. Showing an author four
 *  empty boxes they are not using is how a dialog stops being read. */
function ActionFields({
    action,
    quests,
    onChange,
}: {
    action: ExtraAction;
    quests: QuestDoc[];
    onChange: (patch: Partial<ExtraAction>) => void;
}) {
    return (
        <div className="space-y-2">
            <FieldShell label="When clicked" hint="What happens when the player clicks it.">
                <SelectInput
                    ariaLabel="When clicked"
                    value={action.kind}
                    onChange={(v) => onChange({ kind: v as ExtraAction["kind"] })}
                    options={ACTION_KINDS.map((k) => ({ value: k.value, label: k.label }))}
                />
            </FieldShell>

            {action.kind === "notify" && (
                <FieldShell
                    label="Message"
                    hint="Shown to the player. {{tr.…}} and the usual {{player.…}} words work here."
                >
                    <TextInput
                        ariaLabel="Message"
                        value={action.text}
                        onChange={(v) => onChange({ text: v })}
                        placeholder="Good luck out there."
                    />
                </FieldShell>
            )}

            {action.kind === "claim" && (
                <FieldShell label="Quest" hint="Which of this pack's quests starts when they click.">
                    <SelectInput
                        ariaLabel="Quest"
                        value={action.questId}
                        onChange={(v) => onChange({ questId: v })}
                        options={[
                            { value: "", label: "Pick a quest…" },
                            ...quests.map((q) => ({ value: q.id, label: q.title })),
                        ]}
                    />
                </FieldShell>
            )}

            {action.kind === "mail" && (
                <>
                    <FieldShell label="From" hint="The name the mail shows as its sender.">
                        <TextInput
                            ariaLabel="From"
                            value={action.mailFrom}
                            onChange={(v) => onChange({ mailFrom: v })}
                            placeholder="Anonymous"
                        />
                    </FieldShell>
                    <FieldShell label="Subject">
                        <TextInput
                            ariaLabel="Subject"
                            value={action.mailSubject}
                            onChange={(v) => onChange({ mailSubject: v })}
                            placeholder="About that job…"
                        />
                    </FieldShell>
                    <FieldShell label="Body" hint="Plain text, or write it with HTML tags.">
                        <TextArea
                            ariaLabel="Body"
                            value={action.mailContent}
                            onChange={(v) => onChange({ mailContent: v })}
                            rows={4}
                        />
                    </FieldShell>
                </>
            )}

            {action.kind === "handbook" && (
                <>
                    <FieldShell
                        label="Page"
                        hint="The page to open. In game 1.3.1 the handbook opens on its own landing page: reaching a particular page is not possible until the page names the game uses are known."
                    >
                        <TextInput
                            ariaLabel="Page"
                            value={action.handbookId}
                            onChange={(v) => onChange({ handbookId: v })}
                            placeholder={HANDBOOK_ARTICLES[0]!.title}
                        />
                    </FieldShell>
                    <div className="flex flex-wrap gap-1 px-3">
                        {HANDBOOK_ARTICLES.map((a) => (
                            <button
                                key={a.id}
                                type="button"
                                className="chip"
                                onClick={() => onChange({ handbookId: a.id })}
                            >
                                {a.title}
                            </button>
                        ))}
                    </div>
                    <FieldShell label="Category" hint="Optional. Leave blank unless you know the page needs one.">
                        <TextInput
                            ariaLabel="Category"
                            value={action.handbookCategory}
                            onChange={(v) => onChange({ handbookCategory: v })}
                        />
                    </FieldShell>
                </>
            )}
        </div>
    );
}

/** The page editor, wrapped for a widget: same document, same tools. */
function WidgetEditorDialog({
    widget,
    onChange,
    onClose,
}: {
    widget: DesktopWidgetDoc;
    onChange: (patch: Partial<DesktopWidgetDoc>) => void;
    onClose: () => void;
}) {
    const [mode, setMode] = useState<"visual" | "code">("visual");
    return (
        <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[60] bg-void/80 backdrop-blur-[2px]" />
                <Dialog.Content
                    className={cn(
                        "fixed top-1/2 left-1/2 z-[70] flex h-[80vh] w-[min(900px,94vw)] -translate-x-1/2 -translate-y-1/2",
                        "flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-panel",
                    )}
                >
                    <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
                        <div>
                            <Dialog.Title className="text-[14px] font-semibold text-ink">
                                {widget.name || "Widget"} appearance
                            </Dialog.Title>
                            <Dialog.Description className="mt-0.5 text-[11.5px] text-ink-4">
                                Exactly the surface the game draws on the desktop — the same size box,
                                so what you lay out here is what the player sees.
                            </Dialog.Description>
                        </div>
                        <div className="flex items-center gap-2">
                            <SelectInput
                                ariaLabel="Editing mode"
                                display="segmented"
                                value={mode}
                                onChange={(v) => setMode(v as "visual" | "code")}
                                options={[
                                    { value: "visual", label: "Visual" },
                                    { value: "code", label: "Code" },
                                ]}
                            />
                            <Dialog.Close asChild>
                                <button type="button" className="btn-icon" aria-label="Close">
                                    <Icon name="x" size={14} />
                                </button>
                            </Dialog.Close>
                        </div>
                    </div>
                    <div className="min-h-0 flex-1">
                        {mode === "visual" ? (
                            <VisualPageEditor
                                key={`${widget.id}-${widget.html.length}`}
                                doc={widget.html}
                                onChange={(html) => onChange({ html })}
                                ariaLabel="Widget appearance"
                            />
                        ) : (
                            <CodePageEditor
                                doc={widget.html}
                                onChange={(html) => onChange({ html })}
                                ariaLabel="Widget appearance"
                            />
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

/** The translation table: one row per line of text, one column per language.
 *  The key is what an author types elsewhere as `{{tr.key}}`. */
function TextPanel() {
    const translations = useEditor((s) => s.project.translations);
    const setTranslation = useEditor((s) => s.setTranslation);
    const addLanguage = useEditor((s) => s.addTranslationLanguage);
    const removeLanguage = useEditor((s) => s.removeTranslationLanguage);
    const addKey = useEditor((s) => s.addTranslationKey);
    const removeKey = useEditor((s) => s.removeTranslationKey);
    const [newKey, setNewKey] = useState("");
    const [newKeyError, setNewKeyError] = useState("");

    const languages = translations?.languages ?? [DEFAULT_LANGUAGE];
    const strings = translations?.strings ?? {};
    const keys = useMemo(
        () => Array.from(new Set(Object.values(strings).flatMap((rows) => Object.keys(rows)))).sort(),
        [strings],
    );
    const missing = GAME_LANGUAGES.filter((l) => !languages.includes(l.code));

    return (
        <div className="space-y-4">
            <p className="text-[11.5px] leading-relaxed text-ink-4">
                Write a line here, then use <code className="font-mono text-ink-3">{trToken("key")}</code>{" "}
                anywhere a text field takes text — a quest title, a mail body, a menu label. The game
                translates it in whatever language the player uses, and falls back to English for
                anything a language has not filled in. The editor does not translate for you.
            </p>

            <div className="flex items-end gap-2">
                <div className="w-64">
                    <FieldShell label="Add a line" hint="A short name for the text, used inside {{tr.…}}.">
                        <TextInput
                            ariaLabel="Add a line"
                            mono
                            value={newKey}
                            onChange={(v) => {
                                setNewKey(v);
                                setNewKeyError("");
                            }}
                            placeholder="menu.flashlight"
                        />
                    </FieldShell>
                    {newKeyError && (
                        <p className="mt-1 px-3 text-[11px] text-danger" role="alert">
                            {newKeyError}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    className="btn-default mb-0.5"
                    onClick={() => {
                        const key = newKey.trim();
                        if (!key) return;
                        if (/\s/.test(key)) {
                            setNewKeyError("No spaces — use dots or dashes, like menu.flashlight.");
                            return;
                        }
                        if (keys.includes(key)) {
                            setNewKeyError("That line already exists.");
                            return;
                        }
                        addKey(key);
                        setNewKey("");
                    }}
                >
                    <Icon name="plus" size={13} />
                    Add line
                </button>
            </div>

            <div className="flex items-center gap-2">
                <div className="w-64">
                    <FieldShell label="Add a language" hint="The game offers exactly these.">
                        <SelectInput
                            ariaLabel="Add a language"
                            value=""
                            onChange={(v) => v && addLanguage(v)}
                            options={[
                                { value: "", label: "Pick a language…" },
                                ...missing.map((l) => ({ value: l.code, label: `${l.label} (${l.code})` })),
                            ]}
                        />
                    </FieldShell>
                </div>
            </div>

            {keys.length === 0 ? (
                <EmptyHint>
                    No lines yet. Add one, then use it in any text field as{" "}
                    <code className="font-mono">{trToken("your.key")}</code>.
                </EmptyHint>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-line">
                    <table className="w-full border-collapse text-[12px]">
                        <thead>
                            <tr className="bg-surface-2">
                                <th className="border-b border-line px-2 py-1.5 text-left font-medium text-ink-3">
                                    Line
                                </th>
                                {languages.map((code) => {
                                    const meta = GAME_LANGUAGES.find((l) => l.code === code);
                                    return (
                                        <th
                                            key={code}
                                            className="border-b border-l border-line px-2 py-1.5 text-left font-medium text-ink-3"
                                        >
                                            <span className="flex items-center gap-1.5">
                                                {meta?.label ?? code}
                                                <span className="font-mono text-[10px] text-ink-5">{code}</span>
                                                {code !== DEFAULT_LANGUAGE && (
                                                    <button
                                                        type="button"
                                                        className="text-ink-5 hover:text-danger"
                                                        aria-label={`Remove ${code}`}
                                                        title={`Remove ${code}`}
                                                        onClick={() => removeLanguage(code)}
                                                    >
                                                        <Icon name="x" size={11} />
                                                    </button>
                                                )}
                                            </span>
                                        </th>
                                    );
                                })}
                                <th className="border-b border-l border-line px-2 py-1.5" />
                            </tr>
                        </thead>
                        <tbody>
                            {keys.map((key) => (
                                <tr key={key} className="hover:bg-surface-2/60">
                                    <td className="border-b border-line px-2 py-1 font-mono text-[11px] text-ink-3">
                                        <span className="flex items-center gap-1.5">
                                            {key}
                                            <button
                                                type="button"
                                                className="text-ink-5 hover:text-ink-2"
                                                title="Copy the token to paste into a text field"
                                                aria-label={`Copy ${trToken(key)}`}
                                                onClick={() => {
                                                    void navigator.clipboard
                                                        ?.writeText(trToken(key))
                                                        .catch(() => {});
                                                }}
                                            >
                                                <Icon name="copy" size={11} />
                                            </button>
                                        </span>
                                    </td>
                                    {languages.map((code) => (
                                        <td key={code} className="border-b border-l border-line p-1">
                                            <TextInput
                                                ariaLabel={`${key} in ${code}`}
                                                value={strings[code]?.[key] ?? ""}
                                                onChange={(v) => setTranslation(code, key, v)}
                                            />
                                        </td>
                                    ))}
                                    <td className="border-b border-l border-line px-1 py-1 text-center">
                                        <button
                                            type="button"
                                            className="btn-icon"
                                            aria-label={`Remove ${key}`}
                                            title={`Remove ${key}`}
                                            onClick={() => removeKey(key)}
                                        >
                                            <Icon name="trash" size={12} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {languages.length > 1 && (
                <p className="text-[11px] text-ink-5">
                    A language with blanks is fine: the game shows the English line for anything it
                    cannot find.
                </p>
            )}
        </div>
    );
}

export function ExtrasDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const extras = useEditor((s) => s.project.extras);
    const quests = useEditor((s) => s.project.quests);
    const addExtra = useEditor((s) => s.addExtra);
    const updateExtra = useEditor((s) => s.updateExtra);
    const removeExtra = useEditor((s) => s.removeExtra);
    const toast = useEditor((s) => s.toast);

    const [tab, setTab] = useState<"menu" | "widgets" | "context" | "text">("menu");
    const [selected, setSelected] = useState<Record<ListName, string | null>>({
        menuItems: null,
        widgets: null,
        contextItems: null,
    });
    const [widgetEdit, setWidgetEdit] = useState<string | null>(null);
    const [confirmRemove, setConfirmRemove] = useState<{ list: ListName; id: string; what: string } | null>(null);

    const list = (name: ListName): { id: string }[] => (extras?.[name] ?? []) as { id: string }[];
    const active = TABS.find((t) => t.id === tab)!;
    const activeList = active.list;
    const items = activeList ? list(activeList) : [];
    const current = activeList ? items.find((i) => i.id === selected[activeList]) ?? items[0] : undefined;

    const addTo = (name: ListName) => {
        if (name === "menuItems") {
            const item: MenuItemDoc = {
                id: newId("menu"),
                label: "New item",
                icon: "",
                action: {
                    kind: "notify",
                    text: "",
                    questId: quests[0]?.id ?? "",
                    mailFrom: "",
                    mailSubject: "",
                    mailContent: "",
                    handbookId: "",
                    handbookCategory: "",
                },
            };
            addExtra(name, item as never);
            setSelected((s) => ({ ...s, [name]: item.id }));
        } else if (name === "widgets") {
            const widget: DesktopWidgetDoc = {
                id: newId("widget"),
                name: "New widget",
                width: 320,
                height: 180,
                x: 40,
                y: 40,
                transparent: false,
                html: "<p>Hello from a widget.</p>",
            };
            addExtra(name, widget as never);
            setSelected((s) => ({ ...s, [name]: widget.id }));
        } else {
            const item: ContextItemDoc = {
                id: newId("ctx"),
                label: "New entry",
                icon: "",
                target: "file",
                action: {
                    kind: "notify",
                    text: "",
                    questId: quests[0]?.id ?? "",
                    mailFrom: "",
                    mailSubject: "",
                    mailContent: "",
                    handbookId: "",
                    handbookCategory: "",
                },
            };
            addExtra(name, item as never);
            setSelected((s) => ({ ...s, [name]: item.id }));
        }
    };

    const patch = (patchObj: Record<string, unknown>) => {
        if (!activeList || !current) return;
        updateExtra(activeList, current.id, patchObj);
    };

    const widget = widgetEdit ? (extras?.widgets ?? []).find((w) => w.id === widgetEdit) : undefined;

    return (
        <>
            <Dialog.Root open={open} onOpenChange={onOpenChange}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-40 bg-void/70 backdrop-blur-[2px]" />
                    <Dialog.Content
                        className={cn(
                            "fixed top-1/2 left-1/2 z-50 flex h-[82vh] w-[min(1060px,94vw)] -translate-x-1/2 -translate-y-1/2",
                            "flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-panel",
                        )}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
                            <div>
                                <Dialog.Title className="text-[14px] font-semibold text-ink">
                                    Pack extras
                                </Dialog.Title>
                                <Dialog.Description className="mt-0.5 text-[11.5px] text-ink-4">
                                    The ways a pack is present outside its quests: a start menu with its
                                    own entries, widgets on the desktop, extra right-click entries — and
                                    the place where the words in all of them get translated.
                                </Dialog.Description>
                            </div>
                            <Dialog.Close asChild>
                                <button type="button" className="btn-icon" aria-label="Close">
                                    <Icon name="x" size={14} />
                                </button>
                            </Dialog.Close>
                        </div>

                        <div className="flex items-center gap-1 border-b border-line px-3 py-2">
                            {TABS.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    aria-pressed={tab === t.id}
                                    onClick={() => setTab(t.id)}
                                    className={cn(
                                        "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                                        tab === t.id
                                            ? "bg-accent/15 text-accent"
                                            : "text-ink-3 hover:bg-surface-3 hover:text-ink",
                                    )}
                                >
                                    {t.label}
                                    {t.list && list(t.list).length > 0 && (
                                        <span className="ml-1.5 font-mono text-[10px] text-ink-4">
                                            {list(t.list).length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-4">
                            {tab === "text" ? (
                                <TextPanel />
                            ) : (
                                <div className="flex min-h-0 gap-4">
                                    <div className="flex w-[240px] shrink-0 flex-col">
                                        <button
                                            type="button"
                                            className="btn-default justify-center"
                                            onClick={() => addTo(activeList!)}
                                        >
                                            <Icon name="plus" size={13} />
                                            {tab === "menu" && "New menu entry"}
                                            {tab === "widgets" && "New widget"}
                                            {tab === "context" && "New right-click entry"}
                                        </button>
                                        <div className="mt-2 space-y-1">
                                            {items.length === 0 && (
                                                <EmptyHint>
                                                    {tab === "menu" &&
                                                        "Nothing yet. Your entries appear in the strip at the bottom of the player's start menu."}
                                                    {tab === "widgets" &&
                                                        "Nothing yet. A widget is a little page that sits on the desktop."}
                                                    {tab === "context" &&
                                                        "Nothing yet. These are the extra lines in a right-click menu."}
                                                </EmptyHint>
                                            )}
                                            {items.map((i) => {
                                                const row = i as unknown as {
                                                    id: string;
                                                    label?: string;
                                                    name?: string;
                                                    target?: string;
                                                };
                                                const title = row.label || row.name || "Untitled";
                                                const subtitle =
                                                    tab === "widgets"
                                                        ? "widget"
                                                        : tab === "context"
                                                          ? TARGET_LABELS[row.target as never] ?? "menu"
                                                          : ACTION_LABELS[
                                                                ((i as unknown as MenuItemDoc).action
                                                                    ?.kind ?? "notify") as never
                                                            ] ?? "";
                                                const on = current?.id === i.id;
                                                return (
                                                    <div
                                                        key={i.id}
                                                        className={cn(
                                                            "flex items-center gap-1 rounded-lg border px-2 py-1.5",
                                                            on
                                                                ? "border-accent/60 bg-accent/10"
                                                                : "border-transparent hover:border-line hover:bg-surface-3",
                                                        )}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelected((s) => ({ ...s, [activeList!]: i.id }))
                                                            }
                                                            className="min-w-0 flex-1 text-left"
                                                        >
                                                            <span className="block truncate text-[12px] text-ink">
                                                                {title}
                                                            </span>
                                                            <span className="block truncate text-[10.5px] text-ink-4">
                                                                {subtitle}
                                                            </span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn-icon"
                                                            aria-label={`Remove ${title}`}
                                                            title="Remove"
                                                            onClick={() =>
                                                                setConfirmRemove({
                                                                    list: activeList!,
                                                                    id: i.id,
                                                                    what: title,
                                                                })
                                                            }
                                                        >
                                                            <Icon name="trash" size={12} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="min-w-0 flex-1 space-y-3">
                                        {!current && (
                                            <EmptyHint>
                                                Add an entry on the left to set it up.
                                            </EmptyHint>
                                        )}

                                        {current && tab === "menu" && (
                                            <>
                                                <FieldShell
                                                    label="Label"
                                                    hint="The words on the menu entry. {{tr.…}} works here."
                                                >
                                                    <TextInput
                                                        ariaLabel="Label"
                                                        value={(current as MenuItemDoc).label}
                                                        onChange={(v) => patch({ label: v })}
                                                    />
                                                </FieldShell>
                                                <FieldShell
                                                    label="Icon"
                                                    hint="Optional. A picture inside the pack, with its folder — leave blank for none."
                                                >
                                                    <TextInput
                                                        ariaLabel="Icon"
                                                        mono
                                                        value={(current as MenuItemDoc).icon}
                                                        onChange={(v) => patch({ icon: v })}
                                                        placeholder="images/menu/flashlight.png"
                                                    />
                                                </FieldShell>
                                                <ActionFields
                                                    action={(current as MenuItemDoc).action}
                                                    quests={quests}
                                                    onChange={(p) =>
                                                        patch({
                                                            action: { ...(current as MenuItemDoc).action, ...p },
                                                        })
                                                    }
                                                />
                                                <p className="text-[11px] leading-relaxed text-ink-5">
                                                    Entries show up in the strip along the bottom of the
                                                    player's start menu, in this order.
                                                </p>
                                            </>
                                        )}

                                        {current && tab === "widgets" && (
                                            <>
                                                <FieldShell
                                                    label="Name"
                                                    hint="Only used here, to tell your widgets apart."
                                                >
                                                    <TextInput
                                                        ariaLabel="Name"
                                                        value={(current as DesktopWidgetDoc).name}
                                                        onChange={(v) => patch({ name: v })}
                                                    />
                                                </FieldShell>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <FieldShell label="Width">
                                                        <NumberInput
                                                            ariaLabel="Width"
                                                            value={(current as DesktopWidgetDoc).width}
                                                            onChange={(v) => patch({ width: v || 320 })}
                                                        />
                                                    </FieldShell>
                                                    <FieldShell label="Height">
                                                        <NumberInput
                                                            ariaLabel="Height"
                                                            value={(current as DesktopWidgetDoc).height}
                                                            onChange={(v) => patch({ height: v || 180 })}
                                                        />
                                                    </FieldShell>
                                                    <FieldShell label="Across" hint="From the left edge of the desktop.">
                                                        <NumberInput
                                                            ariaLabel="Across"
                                                            value={(current as DesktopWidgetDoc).x}
                                                            onChange={(v) => patch({ x: v })}
                                                        />
                                                    </FieldShell>
                                                    <FieldShell label="Down" hint="From the top edge of the desktop.">
                                                        <NumberInput
                                                            ariaLabel="Down"
                                                            value={(current as DesktopWidgetDoc).y}
                                                            onChange={(v) => patch({ y: v })}
                                                        />
                                                    </FieldShell>
                                                </div>
                                                <div className="rounded-lg border border-line">
                                                    <Toggle
                                                        id="widget-transparent"
                                                        label="See-through"
                                                        hint="Off: the widget draws its own background (what you see here is what the player gets). On: only the text shows, over whatever is behind it."
                                                        checked={(current as DesktopWidgetDoc).transparent}
                                                        onChange={(v) => patch({ transparent: v })}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn-default"
                                                    onClick={() => setWidgetEdit((current as DesktopWidgetDoc).id)}
                                                >
                                                    <Icon name="globe" size={13} />
                                                    Edit what it looks like
                                                </button>
                                                <p className="text-[11px] leading-relaxed text-ink-5">
                                                    A widget is a small web page: write it with the same
                                                    editor as your sites. It sits at the size above,
                                                    wherever you placed it.{" "}
                                                    <span className="text-ink-3">
                                                        Write its words in the language you want them in —
                                                        the game loads this file as it is, so a translated
                                                        line cannot reach inside it.
                                                    </span>
                                                </p>
                                            </>
                                        )}

                                        {current && tab === "context" && (
                                            <>
                                                <FieldShell
                                                    label="Label"
                                                    hint="The words in the right-click menu. {{tr.…}} works here."
                                                >
                                                    <TextInput
                                                        ariaLabel="Label"
                                                        value={(current as ContextItemDoc).label}
                                                        onChange={(v) => patch({ label: v })}
                                                    />
                                                </FieldShell>
                                                <FieldShell
                                                    label="Show it on"
                                                    hint="All four were checked in game."
                                                >
                                                    <SelectInput
                                                        ariaLabel="Show it on"
                                                        value={(current as ContextItemDoc).target}
                                                        onChange={(v) => patch({ target: v })}
                                                        options={CONTEXT_TARGETS.map((t) => ({
                                                            value: t,
                                                            label: TARGET_LABELS[t],
                                                        }))}
                                                    />
                                                </FieldShell>
                                                <FieldShell
                                                    label="Icon"
                                                    hint="Optional. A picture inside the pack, with its folder."
                                                >
                                                    <TextInput
                                                        ariaLabel="Icon"
                                                        mono
                                                        value={(current as ContextItemDoc).icon}
                                                        onChange={(v) => patch({ icon: v })}
                                                        placeholder="images/ctx/inspect.png"
                                                    />
                                                </FieldShell>
                                                <ActionFields
                                                    action={(current as ContextItemDoc).action}
                                                    quests={quests}
                                                    onChange={(p) =>
                                                        patch({
                                                            action: { ...(current as ContextItemDoc).action, ...p },
                                                        })
                                                    }
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {widget && (
                <WidgetEditorDialog
                    widget={widget}
                    onChange={(p) => updateExtra("widgets", widget.id, p)}
                    onClose={() => setWidgetEdit(null)}
                />
            )}

            <AlertDialog.Root open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
                <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 z-[80] bg-void/70" />
                    <AlertDialog.Content className="fixed top-1/2 left-1/2 z-[90] w-[min(420px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-line bg-surface p-4 shadow-panel">
                        <AlertDialog.Title className="text-[13.5px] font-semibold text-ink">
                            Remove “{confirmRemove?.what}”?
                        </AlertDialog.Title>
                        <AlertDialog.Description className="mt-1 text-[12px] text-ink-3">
                            It is taken out of the pack. Anything else in the pack is untouched.
                        </AlertDialog.Description>
                        <div className="mt-4 flex justify-end gap-2">
                            <AlertDialog.Cancel asChild>
                                <button type="button" className="btn-default">
                                    Keep it
                                </button>
                            </AlertDialog.Cancel>
                            <AlertDialog.Action asChild>
                                <button
                                    type="button"
                                    className="btn-default border-danger/50 text-danger hover:bg-danger/10"
                                    onClick={() => {
                                        if (!confirmRemove) return;
                                        removeExtra(confirmRemove.list, confirmRemove.id);
                                        setConfirmRemove(null);
                                        void toast("Extra removed.");
                                    }}
                                >
                                    <Icon name="trash" size={13} />
                                    Remove
                                </button>
                            </AlertDialog.Action>
                        </div>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>
        </>
    );
}
