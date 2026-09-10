/**
 * The WYSIWYG website builder: sites on the left, pages in the middle, and an
 * edit/preview workspace on the right. Pages with search listing turned off are
 * the dirhunter hiding places — the builder says so plainly instead of making
 * authors learn `seo:false`.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import { FieldShell, TextInput, Toggle } from "@/editor/inspector/primitives";
import { createPage, createWebsite } from "@/schema/project";
import { useEditor } from "@/store/editor";
import { PAGE_TEMPLATES, SITE_TEMPLATES } from "@/templates/pages";
import {
    isFullDocument,
    normalizeHost,
    normalizePath,
    parseSearchTerms,
    scanDocument,
    wrapFragment,
} from "./pageDoc";
import { LlmPromptDialog } from "./LlmPromptDialog";
import { CodePageEditor, VisualPageEditor } from "./pageEditor";

export function WebsiteBuilderDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const websites = useEditor((s) => s.project.websites);
    const addWebsite = useEditor((s) => s.addWebsite);
    const removeWebsite = useEditor((s) => s.removeWebsite);
    const updateWebsite = useEditor((s) => s.updateWebsite);
    const addPage = useEditor((s) => s.addPage);
    const updatePage = useEditor((s) => s.updatePage);
    const removePage = useEditor((s) => s.removePage);

    const [siteId, setSiteId] = useState<string | null>(null);
    const [pageId, setPageId] = useState<string | null>(null);
    const [mode, setMode] = useState<"visual" | "code" | "preview">("visual");
    const [picker, setPicker] = useState(false);
    const [sitePicker, setSitePicker] = useState(false);
    /** Bumped when content changes outside the visual editor, so it remounts fresh. */
    const [outsideRev, setOutsideRev] = useState(0);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    /** Site pending deletion — the confirm dialog's open flag. */
    const [siteDeleteOpen, setSiteDeleteOpen] = useState(false);
    /** The words input keeps the author's raw text (commas and all) while
        they type; null = display the stored terms instead. */
    const [searchDraft, setSearchDraft] = useState<string | null>(null);
    useEffect(() => setSearchDraft(null), [pageId]);
    const [llmOpen, setLlmOpen] = useState(false);
    const htmlFileRef = useRef<HTMLInputElement>(null);
    const toast = useEditor((s) => s.toast);

    const site = websites.find((w) => w.id === siteId) ?? websites[0];
    const pages = [...(site?.pages ?? [])].sort((a, b) => a.path.localeCompare(b.path));
    const page = site?.pages.find((p) => p.id === pageId) ?? pages[0];

    const scan = useMemo(
        () => (page ? scanDocument(page.content) : null),
        [page?.content, page?.id],
    );
    const missingPaths = useMemo(
        () => (scan ? scan.linkedPaths.filter((lp) => !pages.some((pg) => pg.path === lp)) : []),
        [scan, pages],
    );
    const deleteTarget = site?.pages.find((p) => p.id === deleteId) ?? null;

    return (
        <>
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-void/70 backdrop-blur-[2px]" />
                <Dialog.Content
                    className={cn(
                        "fixed top-1/2 left-1/2 z-50 flex h-[82vh] w-[min(1120px,94vw)] -translate-x-1/2 -translate-y-1/2",
                        "flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-panel",
                    )}
                >
                    <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
                        <div>
                            <Dialog.Title className="text-[14px] font-semibold text-ink">
                                Website builder
                            </Dialog.Title>
                            <Dialog.Description className="mt-0.5 text-[11.5px] text-ink-4">
                                Sites your mod puts on the in-game internet. Unlisted pages stay
                                reachable by URL — that is where dirhunter finds clues.
                            </Dialog.Description>
                        </div>
                        <Dialog.Close asChild>
                            <button type="button" className="btn-icon" aria-label="Close">
                                <Icon name="x" size={14} />
                            </button>
                        </Dialog.Close>
                    </div>

                    {!site ? (
                        <div className="min-h-0 flex-1 overflow-y-auto p-6">
                            <div className="mx-auto max-w-xl">
                                <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                                    <Icon name="globe" size={26} className="text-ink-4" />
                                    <p className="text-[13px] font-medium text-ink-2">No websites yet.</p>
                                    <p className="text-[11.5px] text-ink-4">
                                        Start blank, or from a ready-made site.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-default w-full justify-center"
                                    onClick={() => {
                                        const w = createWebsite();
                                        addWebsite(w);
                                        setSiteId(w.id);
                                    }}
                                >
                                    <Icon name="plus" size={12} />
                                    Blank website
                                </button>
                                <p className="mt-5 mb-1.5 text-[10px] font-semibold tracking-wider text-ink-3 uppercase">
                                    Site templates
                                </p>
                                <div className="grid gap-2">
                                    {SITE_TEMPLATES.map((t) => {
                                        const made = t.make();
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => {
                                                    const w = createWebsite({
                                                        host: made.host,
                                                        name: made.name,
                                                        pages: made.pages.map((p) => createPage(p)),
                                                    });
                                                    addWebsite(w);
                                                    setSiteId(w.id);
                                                    setPageId(null);
                                                }}
                                                className="rounded-lg border border-line bg-surface-2/60 p-3 text-left transition-colors hover:border-accent/50"
                                            >
                                                <span className="block text-[12.5px] font-semibold text-ink">
                                                    {t.label}
                                                </span>
                                                <span className="mt-0.5 block text-[11px] leading-snug text-ink-4">
                                                    {t.blurb}
                                                </span>
                                                <span className="mt-1.5 block font-mono text-[10px] text-ink-4">
                                                    {made.host} · {made.pages.length} page
                                                    {made.pages.length === 1 ? "" : "s"} ·{" "}
                                                    {made.pages.filter((p) => !p.seo).length} hidden
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid min-h-0 flex-1 grid-cols-[190px_230px_1fr]">
                            {/* sites */}
                            <div className="flex min-h-0 flex-col border-r border-line">
                                <div className="flex items-center justify-between px-3 py-2">
                                    <span className="text-[10px] font-semibold tracking-wider text-ink-3 uppercase">
                                        Sites
                                    </span>
                                    <button
                                        type="button"
                                        className="btn-icon"
                                        title="Add website (blank or template)"
                                        aria-label="Add website"
                                        onClick={() => setSitePicker((p) => !p)}
                                    >
                                        <Icon name="plus" size={13} />
                                    </button>
                                </div>
                                {sitePicker && (
                                    <div className="border-b border-line bg-surface-2/60 p-2">
                                        <p className="mb-1 text-[10px] font-semibold tracking-wider text-ink-3 uppercase">
                                            New site from
                                        </p>
                                        <div className="grid gap-1">
                                            <button
                                                type="button"
                                                className="rounded-md border border-line px-2 py-1 text-left text-[11px] text-ink-2 hover:bg-surface-3"
                                                onClick={() => {
                                                    const w = createWebsite();
                                                    addWebsite(w);
                                                    setSiteId(w.id);
                                                    setPageId(null);
                                                    setSitePicker(false);
                                                }}
                                            >
                                                Blank website
                                            </button>
                                            {SITE_TEMPLATES.map((t) => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    className="rounded-md border border-line px-2 py-1 text-left hover:bg-surface-3"
                                                    onClick={() => {
                                                        const made = t.make();
                                                        const w = createWebsite({
                                                            host: made.host,
                                                            name: made.name,
                                                            pages: made.pages.map((pg) => createPage(pg)),
                                                        });
                                                        addWebsite(w);
                                                        setSiteId(w.id);
                                                        setPageId(null);
                                                        setSitePicker(false);
                                                    }}
                                                >
                                                    <span className="block text-[11px] text-ink-2">{t.label}</span>
                                                    <span className="block text-[10px] leading-snug text-ink-4">
                                                        {t.blurb}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                                    {websites.map((w) => (
                                        <button
                                            key={w.id}
                                            type="button"
                                            onClick={() => {
                                                setSiteId(w.id);
                                                setPageId(null);
                                            }}
                                            className={cn(
                                                "mb-1 block w-full rounded-md border px-2.5 py-1.5 text-left",
                                                w.id === site.id
                                                    ? "border-accent/50 bg-accent-soft text-ink"
                                                    : "border-transparent text-ink-3 hover:bg-surface-2",
                                            )}
                                        >
                                            <span className="block truncate font-mono text-[11px]">{w.host}</span>
                                            <span className="block truncate text-[10px] text-ink-4">
                                                {w.pages.length} page{w.pages.length === 1 ? "" : "s"}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <div className="border-t border-line p-2">
                                    <button
                                        type="button"
                                        className="btn-default w-full justify-center text-danger"
                                        title="Deletes the site and every page on it — asks first"
                                        onClick={() => setSiteDeleteOpen(true)}
                                    >
                                        <Icon name="trash" size={12} />
                                        Delete site
                                    </button>
                                </div>
                            </div>

                            {/* pages */}
                            <div className="flex min-h-0 flex-col border-r border-line">
                                <div className="grid gap-2 border-b border-line p-2.5">
                                    <FieldShell
                                        label="Host"
                                        hint="The address players type in the in-game browser, like meridian-capital.net. Pasted URLs are cleaned up when you click away."
                                    >
                                        <TextInput
                                            ariaLabel="Site host"
                                            value={site.host}
                                            onChange={(host) => updateWebsite(site.id, { host })}
                                            onBlur={() => updateWebsite(site.id, { host: normalizeHost(site.host) })}
                                            mono
                                        />
                                    </FieldShell>
                                    <FieldShell label="Site name">
                                        <TextInput
                                            ariaLabel="Site name"
                                            value={site.name}
                                            onChange={(name) => updateWebsite(site.id, { name })}
                                            placeholder="For your own reference"
                                        />
                                    </FieldShell>
                                    <Toggle
                                        id="site-popular-toggle"
                                        label="Popular site"
                                        hint="Declared by the game's SDK, but what it does in-game is not verified yet — our test is two identical sites, one flagged, comparing search ranking. Leave off unless you are running that experiment."
                                        checked={!!site.popular}
                                        onChange={(popular) => updateWebsite(site.id, { popular: popular || undefined })}
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-2 px-3 py-2">
                                    <span className="text-[10px] font-semibold tracking-wider text-ink-3 uppercase">
                                        Pages
                                    </span>
                                    <button
                                        type="button"
                                        className="btn-default"
                                        onClick={() => setPicker((p) => !p)}
                                    >
                                        <Icon name="plus" size={11} />
                                        New page
                                    </button>
                                </div>
                                {picker && (
                                    <div className="border-b border-line bg-surface-2/60 p-2">
                                        <p className="mb-1 text-[10px] font-semibold tracking-wider text-ink-3 uppercase">
                                            Page templates
                                        </p>
                                        <div className="grid gap-1">
                                            <button
                                                type="button"
                                                className="rounded-md border border-line px-2 py-1 text-left text-[11px] text-ink-2 hover:bg-surface-3"
                                                onClick={() => {
                                                    const p = createPage({ path: `/page-${site.pages.length + 1}`, title: "New page" });
                                                    addPage(site.id, p);
                                                    setPageId(p.id);
                                                    setPicker(false);
                                                    setMode("visual");
                                                }}
                                            >
                                                Blank page
                                            </button>
                                            {PAGE_TEMPLATES.map((t) => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    className="rounded-md border border-line px-2 py-1 text-left hover:bg-surface-3"
                                                    onClick={() => {
                                                        const made = t.make();
                                                        const p = createPage({ ...made, template: t.id });
                                                        addPage(site.id, p);
                                                        setPageId(p.id);
                                                        setPicker(false);
                                                        setMode("visual");
                                                    }}
                                                >
                                                    <span className="block text-[11px] text-ink-2">{t.label}</span>
                                                    <span className="block text-[10px] leading-snug text-ink-4">
                                                        {t.blurb}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                                    {pages.map((p) => (
                                        <div key={p.id} className="group relative mb-1">
                                            <button
                                                type="button"
                                                onClick={() => setPageId(p.id)}
                                                className={cn(
                                                    "block w-full rounded-md border px-2.5 py-1.5 text-left",
                                                    page && p.id === page.id
                                                        ? "border-accent/50 bg-accent-soft text-ink"
                                                        : "border-transparent text-ink-3 hover:bg-surface-2",
                                                )}
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    {!p.seo && <Icon name="lock" size={10} className="shrink-0 text-warn" />}
                                                    <span className="truncate font-mono text-[11px]">{p.path}</span>
                                                </span>
                                                <span className="block truncate text-[10px] text-ink-4">
                                                    {p.title || "untitled"}
                                                </span>
                                            </button>
                                            <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-0.5 rounded-md border border-line bg-surface-2 p-0.5 opacity-0 shadow transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                                                <button
                                                    type="button"
                                                    className="btn-icon"
                                                    title="Duplicate page"
                                                    aria-label={`Duplicate page ${p.path}`}
                                                    onClick={() => {
                                                        const copy = createPage({
                                                            title: `${p.title} (copy)`,
                                                            path: p.path.endsWith("/")
                                                                ? `${p.path}copy`
                                                                : `${p.path}-copy`,
                                                            seo: p.seo,
                                                            content: p.content,
                                                            template: p.template,
                                                        });
                                                        addPage(site.id, copy);
                                                        setPageId(copy.id);
                                                        setOutsideRev((r) => r + 1);
                                                    }}
                                                >
                                                    <Icon name="copy" size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-icon bg-danger/15 text-danger hover:bg-danger hover:text-white"
                                                    title="Delete page"
                                                    aria-label={`Delete page ${p.path}`}
                                                    onClick={() => setDeleteId(p.id)}
                                                >
                                                    <Icon name="trash" size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* workspace */}
                            <div className="flex min-h-0 flex-col">
                                {page ? (
                                    <>
                                        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
                                            <div className="flex rounded-md border border-line p-0.5">
                                                {(["visual", "code", "preview"] as const).map((m) => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => setMode(m)}
                                                        className={cn(
                                                            "rounded px-2.5 py-1 text-[11px] capitalize",
                                                            mode === m ? "bg-accent-soft text-accent" : "text-ink-4 hover:text-ink",
                                                        )}
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                className="btn-default"
                                                title="Replace this page with a finished .html file from disk"
                                                onClick={() => htmlFileRef.current?.click()}
                                            >
                                                <Icon name="upload" size={11} />
                                                Load HTML
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-default"
                                                title="Download this page as a .html file — hand it back to your AI assistant to iterate on it"
                                                onClick={() => {
                                                    const blob = new Blob([page.content], { type: "text/html" });
                                                    const a = document.createElement("a");
                                                    a.href = URL.createObjectURL(blob);
                                                    a.download = `${page.path === "/" ? "index" : page.path.replace(/^\//, "").replace(/\//g, "-") || "page"}.html`;
                                                    a.click();
                                                    URL.revokeObjectURL(a.href);
                                                    toast(`Saved ${a.download}.`, "ok");
                                                }}
                                            >
                                                <Icon name="download" size={11} />
                                                Save HTML
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-default"
                                                title="Get a copy-paste prompt that makes ChatGPT or Claude build a game-ready website for you"
                                                onClick={() => setLlmOpen(true)}
                                            >
                                                ✨ AI website prompt
                                            </button>
                                            <input
                                                ref={htmlFileRef}
                                                type="file"
                                                accept=".html,.htm,text/html"
                                                aria-label="Load HTML file"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    e.target.value = "";
                                                    if (!file) return;
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                        const text = String(reader.result ?? "");
                                                        updatePage(site.id, page.id, {
                                                            content: isFullDocument(text)
                                                                ? text
                                                                : wrapFragment(text, page.title || "Page"),
                                                        });
                                                        setOutsideRev((r) => r + 1);
                                                        toast(`Loaded ${file.name}.`, "ok");
                                                    };
                                                    reader.readAsText(file);
                                                }}
                                            />
                                            <span className="ml-auto flex items-center gap-1.5 font-mono text-[10.5px] text-ink-4">
                                                {!page.seo && <Icon name="lock" size={10} className="text-warn" />}
                                                {site.host}
                                                {page.path}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 border-b border-line px-3 py-2">
                                            <FieldShell
                                                label="Path"
                                                hint="Where the page lives on the host, starting at the root — /about/team. Sub-directories are fine; deep paths make good hiding spots. A missing leading / is added when you click away."
                                            >
                                                <TextInput
                                                    ariaLabel="Page path"
                                                    value={page.path}
                                                    onChange={(path) => updatePage(site.id, page.id, { path })}
                                                    onBlur={() => updatePage(site.id, page.id, { path: normalizePath(page.path) })}
                                                    mono
                                                    placeholder="/about/team"
                                                />
                                            </FieldShell>
                                            <FieldShell label="Browser tab title">
                                                <TextInput
                                                    ariaLabel="Page title"
                                                    value={page.title}
                                                    onChange={(title) => updatePage(site.id, page.id, { title })}
                                                />
                                            </FieldShell>
                                        </div>
                                        <Toggle
                                            id="page-search-listed-toggle"
                                            label="Listed in the in-game search"
                                            hint="Turn off to hide this page from search results while keeping it reachable by URL. Hidden pages are what dirhunter brute-forces — perfect for clues."
                                            checked={page.seo}
                                            onChange={(seo) => updatePage(site.id, page.id, { seo })}
                                        />

                                        <div className="grid gap-2 border-b border-line px-3 py-2">
                                            <FieldShell
                                                label="Search result description"
                                                hint="A short line the in-game search can show under this page's result, like the snippet under a web result. Leave blank and the game decides what to show."
                                            >
                                                <TextInput
                                                    ariaLabel="Search result description"
                                                    value={page.description ?? ""}
                                                    onChange={(description) =>
                                                        updatePage(site.id, page.id, { description: description || undefined })
                                                    }
                                                    placeholder="Custom sets for every budget"
                                                />
                                            </FieldShell>
                                            <FieldShell
                                                label="Extra search words"
                                                hint="Words this page should also be found by, besides what is written on it — a codename, a product name, a misspelling a player might try. Separate them with commas."
                                            >
                                                <TextInput
                                                    ariaLabel="Extra search words"
                                                    value={searchDraft ?? (page.search ?? []).join(", ")}
                                                    onChange={(text) => {
                                                        /* Keep the author's raw text (commas and all)
                                                           while they type; parseSearchTerms only feeds
                                                           the stored page. */
                                                        setSearchDraft(text);
                                                        updatePage(site.id, page.id, { search: parseSearchTerms(text) });
                                                    }}
                                                    placeholder="budget, cheap rigs, custom pc"
                                                />
                                            </FieldShell>
                                        </div>

                                        {scan && (
                                            <div className="border-b border-line px-3 py-2">
                                                <p className="mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold text-ink-2">
                                                    <Icon name="search" size={11} className="text-accent" />
                                                    Inside this page
                                                    <span className="font-normal text-ink-4">
                                                        — what we found in the code
                                                    </span>
                                                </p>
                                                <div className="grid gap-1.5 text-[10.5px] leading-relaxed text-ink-3">
                                                    {missingPaths.length > 0 && (
                                                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                                                            <span>⚠️ This page links to {missingPaths.length} page
                                                                {missingPaths.length === 1 ? "" : "s"} that
                                                                don't exist yet — in the game, clicking them
                                                                leads nowhere:</span>
                                                            {missingPaths.slice(0, 6).map((mp) => (
                                                                <span key={mp} className="rounded bg-surface-2 px-1 font-mono">
                                                                    {mp}
                                                                </span>
                                                            ))}
                                                            {missingPaths.length > 6 && <span>…</span>}
                                                            <button
                                                                type="button"
                                                                className="btn-default"
                                                                onClick={() => {
                                                                    for (const mp of missingPaths) {
                                                                        const seg = mp.split("/").filter(Boolean).pop() ?? "page";
                                                                        const title =
                                                                            seg.charAt(0).toUpperCase() + seg.slice(1);
                                                                        addPage(
                                                                            site.id,
                                                                            createPage({
                                                                                title,
                                                                                path: mp,
                                                                                seo: true,
                                                                                content: wrapFragment(
                                                                                    `<h1>${title}</h1><p>Replace this placeholder with the real page.</p>`,
                                                                                    title,
                                                                                ),
                                                                            }),
                                                                        );
                                                                    }
                                                                    toast(
                                                                        `Created ${missingPaths.length} placeholder page${missingPaths.length === 1 ? "" : "s"}.`,
                                                                        "ok",
                                                                    );
                                                                }}
                                                            >
                                                                Fix it: create the missing page
                                                                {missingPaths.length === 1 ? "" : "s"}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {scan.anchors.length > 0 && (
                                                        <p>
                                                            ℹ️ {scan.anchors.length} menu link
                                                            {scan.anchors.length === 1 ? "" : "s"} jump to different
                                                            spots on this same page (a one-page site). That's fine as
                                                            it is — nothing to fix.
                                                        </p>
                                                    )}
                                                    {scan.comments.length > 0 && (
                                                        <p>
                                                            🥚 Hidden message: this page carries text written as a
                                                            code comment — invisible on the page itself, but players
                                                            who inspect the source can read it. Great for clues:{" "}
                                                            <code className="rounded bg-surface-2 px-1 font-mono text-accent">
                                                                {scan.comments[0].slice(0, 120)}
                                                                {scan.comments[0].length > 120 ? "…" : ""}
                                                            </code>
                                                            {scan.comments.length > 1 && (
                                                                <span className="text-ink-4">
                                                                    {" "}
                                                                    …and {scan.comments.length - 1} more comment
                                                                    {scan.comments.length === 2 ? "" : "s"} in the
                                                                    code.
                                                                </span>
                                                            )}
                                                        </p>
                                                    )}
                                                    {scan.hiddenBits > 0 && (
                                                        <p>
                                                            🫥 {scan.hiddenBits} hidden element
                                                            {scan.hiddenBits === 1 ? "" : "s"} in the code (hidden
                                                            inputs, display:none blocks). Players never see{" "}
                                                            {scan.hiddenBits === 1 ? "it" : "them"} on the page —
                                                            but anyone who views the source does. Another good
                                                            clue spot.
                                                        </p>
                                                    )}
                                                    {(scan.scripts > 0 || scan.forms > 0) && (
                                                        <p>
                                                            {scan.scripts > 0 &&
                                                                `⚙️ This page runs a small script — it works in the Preview tab (the Visual editor keeps scripts off while you write).`}
                                                            {scan.scripts > 0 && scan.forms > 0 && " "}
                                                            {scan.forms > 0 &&
                                                                `📝 It also has an input form, like a login box.`}
                                                        </p>
                                                    )}
                                                    {missingPaths.length === 0 &&
                                                        scan.anchors.length === 0 &&
                                                        scan.comments.length === 0 &&
                                                        scan.hiddenBits === 0 &&
                                                        scan.scripts === 0 &&
                                                        scan.forms === 0 && (
                                                            <p className="text-ink-4">
                                                                ✅ Nothing unusual here — every link works, and
                                                                there are no hidden messages or scripts.
                                                            </p>
                                                        )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="min-h-0 flex-1 overflow-y-auto p-3">
                                            {mode === "visual" && (
                                                <VisualPageEditor
                                                    key={`${page.id}:${outsideRev}`}
                                                    doc={page.content}
                                                    onChange={(content) => updatePage(site.id, page.id, { content })}
                                                    ariaLabel={`Visual editor for ${page.path}`}
                                                />
                                            )}
                                            {mode === "code" && (
                                                <CodePageEditor
                                                    doc={page.content}
                                                    onChange={(content) => {
                                                        updatePage(site.id, page.id, { content });
                                                        setOutsideRev((r) => r + 1);
                                                    }}
                                                    ariaLabel={`HTML code for ${page.path}`}
                                                />
                                            )}
                                            {mode === "preview" && (
                                                <BrowserPreview
                                                    host={site.host}
                                                    path={page.path}
                                                    seo={page.seo}
                                                    content={page.content}
                                                />
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-ink-4">
                                        <Icon name="file" size={20} />
                                        <p className="text-[12px]">Add a page to start building.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>

        <AlertDialog.Root open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
            <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-void/70 backdrop-blur-[2px]" />
                <AlertDialog.Content className="fixed top-1/2 left-1/2 z-[70] w-[min(400px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-line bg-surface p-4 shadow-panel">
                    <AlertDialog.Title className="text-[13px] font-semibold text-ink">
                        Do you really want to delete this page?
                    </AlertDialog.Title>
                    <AlertDialog.Description className="mt-1 text-[11.5px] leading-relaxed text-ink-3">
                        <span className="font-mono text-ink-2">
                            {site?.host}
                            {deleteTarget?.path}
                        </span>{" "}
                        will be removed from the site. This can be undone with the editor's
                        undo.
                    </AlertDialog.Description>
                    <div className="mt-4 flex justify-end gap-2">
                        <AlertDialog.Cancel className="btn-default">Cancel</AlertDialog.Cancel>
                        <AlertDialog.Action
                            className="btn-danger"
                            onClick={() => {
                                if (site && deleteId) {
                                    removePage(site.id, deleteId);
                                    if (pageId === deleteId) setPageId(null);
                                }
                            }}
                        >
                            Delete page
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>

        <AlertDialog.Root open={siteDeleteOpen} onOpenChange={setSiteDeleteOpen}>
            <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-void/70 backdrop-blur-[2px]" />
                <AlertDialog.Content className="fixed top-1/2 left-1/2 z-[70] w-[min(400px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-line bg-surface p-4 shadow-panel">
                    <AlertDialog.Title className="text-[13px] font-semibold text-ink">
                        Do you really want to delete this site?
                    </AlertDialog.Title>
                    <AlertDialog.Description className="mt-1 text-[11.5px] leading-relaxed text-ink-3">
                        <span className="font-mono text-ink-2">{site?.host}</span> and its{" "}
                        {site?.pages.length ?? 0} page{(site?.pages.length ?? 0) === 1 ? "" : "s"} will be
                        removed from the mod. This can be undone with the editor's undo.
                    </AlertDialog.Description>
                    <div className="mt-4 flex justify-end gap-2">
                        <AlertDialog.Cancel className="btn-default">Cancel</AlertDialog.Cancel>
                        <AlertDialog.Action
                            className="btn-danger"
                            onClick={() => {
                                if (site) {
                                    removeWebsite(site.id);
                                    setSiteId(null);
                                    setPageId(null);
                                }
                            }}
                        >
                            Delete site
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>

        <LlmPromptDialog open={llmOpen} onOpenChange={setLlmOpen} />
        </>
    );
}

/** The player's-eye view: a little in-game browser window. */
function BrowserPreview({
    host,
    path,
    seo,
    content,
}: {
    host: string;
    path: string;
    seo: boolean;
    content: string;
}) {
    return (
        <div className="overflow-hidden rounded-lg border border-line">
            <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-3 py-1.5">
                <span className="flex gap-1" aria-hidden>
                    <i className="size-2 rounded-full bg-danger/70" />
                    <i className="size-2 rounded-full bg-warn/70" />
                    <i className="size-2 rounded-full bg-ok/70" />
                </span>
                <span className="flex-1 truncate rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-[10.5px] text-ink-3">
                    http://{host}
                    {path}
                </span>
            </div>
            {!seo && (
                <p className="flex items-center gap-1.5 border-b border-warn/30 bg-warn/10 px-3 py-1.5 text-[10.5px] text-warn">
                    <Icon name="lock" size={11} />
                    Not in search results — only a direct URL (or dirhunter) leads here.
                </p>
            )}
            <iframe
                title="Page preview"
                srcDoc={content || "<p><em>Empty page.</em></p>"}
                sandbox="allow-scripts"
                className="block h-[52vh] w-full border-0 bg-white"
            />
        </div>
    );
}
