/**
 * The page workspace editors.
 *
 * Visual: the page's *own* document rendered in an isolated iframe with the
 * body made contentEditable — the page's styles apply while editing, and its
 * CSS can never leak into the builder (or vice versa). Scripts stay off while
 * editing; the Preview tab runs them.
 *
 * Code: the full document as text, for copy-pasting html/css/js or loading
 * LLM-written sites.
 */
import { useMemo, useRef, useState } from "react";
import type { UIEvent } from "react";
import * as Popover from "@radix-ui/react-popover";
import Prism from "prismjs";
import { cn } from "@/lib/cn";
import { useEditor } from "@/store/editor";
import { joinDocument, linkElement, linkRange, normalizePath, splitDocument } from "./pageDoc";

const INLINE = [
    { cmd: "bold", label: "B", title: "Bold", className: "font-bold" },
    { cmd: "italic", label: "I", title: "Italic", className: "italic" },
    { cmd: "underline", label: "U", title: "Underline", className: "underline" },
] as const;

const BLOCKS = [
    { cmd: "formatBlock", arg: "p", label: "¶", title: "Paragraph" },
    { cmd: "formatBlock", arg: "h1", label: "H1", title: "Heading" },
    { cmd: "formatBlock", arg: "h2", label: "H2", title: "Subheading" },
    { cmd: "formatBlock", arg: "blockquote", label: "❝", title: "Quote" },
] as const;

export function VisualPageEditor({
    doc,
    onChange,
    ariaLabel,
    pages = [],
}: {
    doc: string;
    onChange: (fullDocument: string) => void;
    ariaLabel: string;
    /** The site's pages — the link picker's rows and point-to-link targets. */
    pages?: { path: string; title: string }[];
}) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    /** Armed point-to-link path; null = normal editing clicks. A ref, so the
        click handler attached once at iframe load always reads the current
        arm without re-attaching listeners. */
    const armedRef = useRef<string | null>(null);
    const [targeting, setTargeting] = useState<string | null>(null);
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkPath, setLinkPath] = useState("/");

    const disarm = () => {
        armedRef.current = null;
        setTargeting(null);
    };
    // Fixed at mount: the parent remounts us (key) whenever content changes
    // from outside, so the caret never resets mid-typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const parts = useMemo(() => splitDocument(doc), []);
    // Scripts stay OFF while editing (the Preview tab runs them). We cannot
    // `sandbox` the iframe — emit() needs same-origin access to the body —
    // so instead the *editing copy* gets a CSP that blocks script execution
    // while keeping the <script> nodes in the DOM (they must survive into
    // the emitted document, and body.innerHTML is what we emit). Pages with
    // no script keep their document byte-identical.
    const editingDoc = useMemo(() => {
        if (!/<script[\s>]/i.test(doc)) return doc;
        const csp = `<meta http-equiv="Content-Security-Policy" content="script-src 'none'">`;
        return parts.isFull && /<head[^>]*>/i.test(parts.head)
            ? parts.head.replace(/<head[^>]*>/i, (m) => `${m}\n${csp}`) + parts.body + parts.tail
            : `<!doctype html><html><head>${csp}</head><body>${parts.isFull ? parts.body : doc}</body></html>`;
    }, [doc, parts]);

    const emit = () => {
        const body = iframeRef.current?.contentDocument?.body;
        if (body) onChange(joinDocument(parts, body.innerHTML));
    };

    const onLoad = () => {
        const d = iframeRef.current?.contentDocument;
        if (!d?.body) return;
        d.body.contentEditable = "true";
        d.addEventListener("input", emit);
        /* Point-to-link (r133): one click handler on the page document reads
           the armed ref, so arming never has to touch the iframe. nodeType 1
           (= element) instead of instanceof — the iframe is its own realm. */
        d.addEventListener("click", (e) => {
            const path = armedRef.current;
            if (!path) return;
            e.preventDefault();
            e.stopPropagation();
            const t = e.target as Node | null;
            if (t && t.nodeType === 1) {
                linkElement(t as unknown as Element, path);
                emit();
            }
            disarm();
        });
        d.addEventListener("keydown", (e) => {
            if (e.key === "Escape") disarm();
        });
    };

    const exec = (cmd: string, arg?: string) => {
        const d = iframeRef.current?.contentDocument;
        if (!d) return;
        if (typeof d.execCommand === "function") d.execCommand(cmd, false, arg);
        emit();
    };

    /** Link the iframe's current selection to `path` (a collapsed selection
        inserts the path as the link text) and close the picker. */
    const linkTo = (path: string) => {
        const frame = iframeRef.current;
        const d = frame?.contentDocument;
        if (!frame || !d) return;
        frame.contentWindow?.focus();
        const sel = d.getSelection();
        if (sel && sel.rangeCount > 0) {
            linkRange(d, sel.getRangeAt(0), path);
            sel.removeAllRanges();
            emit();
        }
        setLinkOpen(false);
        setLinkPath("/");
    };

    /** Arm point-to-link: the next click inside the page becomes the link. */
    const arm = (path: string) => {
        armedRef.current = path;
        setTargeting(path);
        setLinkOpen(false);
        setLinkPath("/");
    };

    const onImageFile = (file: File | undefined) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => exec("insertImage", String(reader.result));
        reader.readAsDataURL(file);
    };

    return (
        <div className="overflow-hidden rounded-lg border border-line">
            <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-surface-2 px-1.5 py-1">
                {INLINE.map((b) => (
                    <button
                        key={b.cmd}
                        type="button"
                        title={b.title}
                        aria-label={b.title}
                        onClick={() => exec(b.cmd)}
                        className={cn(
                            "size-6 rounded text-[11px] text-ink-3 hover:bg-surface-3 hover:text-ink",
                            b.className,
                        )}
                    >
                        {b.label}
                    </button>
                ))}
                <span className="mx-1 h-4 w-px bg-line" aria-hidden />
                {BLOCKS.map((b) => (
                    <button
                        key={b.label}
                        type="button"
                        title={b.title}
                        aria-label={b.title}
                        onClick={() => exec(b.cmd, b.arg)}
                        className="size-6 rounded text-[10px] text-ink-3 hover:bg-surface-3 hover:text-ink"
                    >
                        {b.label}
                    </button>
                ))}
                <span className="mx-1 h-4 w-px bg-line" aria-hidden />
                <button
                    type="button"
                    title="Bulleted list"
                    aria-label="Bulleted list"
                    onClick={() => exec("insertUnorderedList")}
                    className="size-6 rounded text-[11px] text-ink-3 hover:bg-surface-3 hover:text-ink"
                >
                    •≡
                </button>
                <button
                    type="button"
                    title="Numbered list"
                    aria-label="Numbered list"
                    onClick={() => exec("insertOrderedList")}
                    className="size-6 rounded text-[10px] text-ink-3 hover:bg-surface-3 hover:text-ink"
                >
                    1.
                </button>
                <span className="relative">
                    <Popover.Root open={linkOpen} onOpenChange={(o) => { setLinkOpen(o); if (!o) setLinkPath("/"); }}>
                        <Popover.Trigger asChild>
                            <button
                                type="button"
                                title="Insert link to one of the site's pages"
                                aria-label="Insert link"
                                className="size-6 rounded text-[11px] text-ink-3 hover:bg-surface-3 hover:text-ink"
                            >
                                🔗
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content
                                align="start"
                                sideOffset={6}
                                className="z-[80] w-64 rounded-lg border border-line bg-surface p-2 shadow-panel"
                            >
                                <p className="mb-1 text-[10px] font-semibold tracking-wider text-ink-3 uppercase">
                                    Link to a page
                                </p>
                                <div className="grid gap-0.5">
                                    {pages.length === 0 && (
                                        <p className="px-1 py-1.5 text-[11px] text-ink-4">
                                            This site has no other pages yet — add them in the Pages list.
                                        </p>
                                    )}
                                    {pages.map((pg) => (
                                        <div key={pg.path} className="flex items-center gap-0.5">
                                            <button
                                                type="button"
                                                className="min-w-0 flex-1 rounded-md border border-transparent px-2 py-1 text-left hover:bg-surface-3"
                                                title="Link the selected text, or insert the path"
                                                onClick={() => linkTo(pg.path)}
                                            >
                                                <span className="block truncate text-[11px] text-ink-2">
                                                    {pg.title || "(untitled)"}
                                                </span>
                                                <span className="block truncate font-mono text-[10px] text-ink-4">
                                                    {pg.path}
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-icon shrink-0"
                                                title="Point at the text on the page instead — then click the text that should become this link"
                                                aria-label={`Point at the text on the page to link it to ${pg.path}`}
                                                onClick={() => arm(pg.path)}
                                            >
                                                🎯
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-1.5 flex items-center gap-1 border-t border-line pt-1.5">
                                    <input
                                        value={linkPath}
                                        onChange={(e) => setLinkPath(e.target.value)}
                                        aria-label="Link address (URL or page path)"
                                        placeholder="/any/path"
                                        className="field-input min-w-0 flex-1 font-mono text-[11px]"
                                    />
                                    <button
                                        type="button"
                                        className="btn-default shrink-0"
                                        onClick={() => linkTo(normalizePath(linkPath))}
                                    >
                                        Link
                                    </button>
                                </div>
                                <p className="mt-1 text-[10px] leading-snug text-ink-4">
                                    🎯 point at text: click the target on the page — Esc cancels.
                                </p>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                </span>
                <button
                    type="button"
                    title="Insert image (embedded into the page)"
                    aria-label="Insert image"
                    onClick={() => fileRef.current?.click()}
                    className="size-6 rounded text-[11px] text-ink-3 hover:bg-surface-3 hover:text-ink"
                >
                    🖼
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    aria-label="Image file to insert"
                    className="hidden"
                    onChange={(e) => {
                        onImageFile(e.target.files?.[0]);
                        e.target.value = "";
                    }}
                />
                <span className="ml-auto pr-1 text-[10px] text-ink-4">
                    images are embedded — the game's web views have no internet
                </span>
            </div>
            {targeting && (
                <div className="flex items-center justify-between gap-2 border-b border-accent/40 bg-accent-soft px-3 py-1.5 text-[10.5px] text-accent">
                    <span>
                        Click the text on the page that should link to{" "}
                        <code className="font-mono">{targeting}</code> — Esc cancels.
                    </span>
                    <button type="button" className="btn-default shrink-0" aria-label="Cancel point-to-link" onClick={disarm}>
                        Cancel
                    </button>
                </div>
            )}
            <iframe
                ref={iframeRef}
                title={ariaLabel}
                srcDoc={editingDoc}
                onLoad={onLoad}
                className="block h-[48vh] w-full border-0 bg-white"
            />
        </div>
    );
}

/**
 * The code view: a transparent textarea over a Prism-highlighted copy of the
 * same text, so you edit real HTML with live syntax colours. "Format" runs
 * prettier over the whole document.
 */
export function CodePageEditor({
    doc,
    onChange,
    ariaLabel,
}: {
    doc: string;
    onChange: (fullDocument: string) => void;
    ariaLabel: string;
}) {
    const preRef = useRef<HTMLPreElement>(null);
    const toast = useEditor((s) => s.toast);
    const highlighted = useMemo(
        () => Prism.highlight(doc, Prism.languages.markup, "markup"),
        [doc],
    );

    const syncScroll = (e: UIEvent<HTMLTextAreaElement>) => {
        const pre = preRef.current;
        if (pre) {
            pre.scrollTop = e.currentTarget.scrollTop;
            pre.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    const format = async () => {
        try {
            const [standalone, htmlPlugin] = await Promise.all([
                import("prettier/standalone"),
                import("prettier/plugins/html"),
            ]);
            const out = await standalone.format(doc, {
                parser: "html",
                plugins: [htmlPlugin.default],
            });
            onChange(out);
            toast("Formatted.", "ok");
        } catch {
            toast("Couldn't format this document — check for unclosed tags.", "warn");
        }
    };

    const editorClasses =
        "p-3 font-mono text-[11.5px] leading-relaxed whitespace-pre [tab-size:2]";

    return (
        <div className="grid gap-1.5">
            <div className="relative h-[48vh] overflow-hidden rounded-lg border border-line bg-[#0b0d12]">
                <pre
                    ref={preRef}
                    aria-hidden
                    className={cn(
                        "codeview pointer-events-none absolute inset-0 m-0 overflow-hidden text-ink-2",
                        editorClasses,
                    )}
                >
                    <code dangerouslySetInnerHTML={{ __html: `${highlighted}\n` }} />
                </pre>
                <textarea
                    value={doc}
                    onChange={(e) => onChange(e.target.value)}
                    onScroll={syncScroll}
                    aria-label={ariaLabel}
                    spellCheck={false}
                    wrap="off"
                    className={cn(
                        "absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent text-transparent caret-[#e8eaf1] selection:bg-accent-soft focus:outline-none",
                        editorClasses,
                    )}
                />
            </div>
            <div className="flex items-start gap-3">
                <button type="button" className="btn-default shrink-0" onClick={format}>
                    ✨ Format
                </button>
                <p className="text-[10.5px] leading-relaxed text-ink-4">
                    The complete document — styles, scripts and comments included — exactly as
                    it will ship, with live syntax highlighting. Keep it self-contained: the
                    game's web views resolve relative assets from the mod itself and never
                    reach the internet.
                </p>
            </div>
        </div>
    );
}
