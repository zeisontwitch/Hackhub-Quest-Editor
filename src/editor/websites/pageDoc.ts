/**
 * Page documents. A page stores a *full* HTML document — its own styles and
 * scripts included — because that is exactly what users bring (LLM-written
 * self-contained sites) and exactly what the Step 4 compiler writes to disk.
 * Fragments (no <body>) are tolerated and wrapped in a clean base document.
 */

/** Base stylesheet for wrapped fragments and blank pages: readable, neutral. */
export const BASE_CSS = `
*{box-sizing:border-box;margin:0}
body{font:15px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#232a36;background:#f4f6f9;padding:28px clamp(16px,5vw,56px)}
h1{font-size:30px;line-height:1.2;margin:0 0 12px;font-weight:750}
h2{font-size:19px;margin:22px 0 8px}
p{margin:0 0 10px;max-width:70ch}
ul,ol{margin:0 0 12px;padding-left:22px}
li{margin:3px 0}
a{color:#0e7490}
blockquote{margin:0 0 12px;padding:8px 14px;border-left:3px solid #c3c9d4;background:#e9ecf1;color:#4a5162}
img{max-width:100%;border-radius:6px}
header.site{background:#0d2b45;color:#fff;padding:14px clamp(16px,5vw,56px);font-weight:700;letter-spacing:.3px;margin:-28px calc(-1*clamp(16px,5vw,56px)) 24px}
`;

const HEAD_OPEN = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page</title>
<style>${BASE_CSS}</style>
</head>`;

/** A complete, clean document around a bare fragment. */
export function wrapFragment(body: string, title = "Page"): string {
    return `${HEAD_OPEN.replace("<title>Page</title>", `<title>${title}</title>`)}
<body>
${body}
</body>
</html>`;
}

export const isFullDocument = (html: string) => /<body[\s>]/i.test(html);

export interface SplitDoc {
    /** Everything through and including the opening <body> tag. */
    head: string;
    /** The inner body HTML. */
    body: string;
    /** </body> and anything after it. */
    tail: string;
    isFull: boolean;
}

/** Split a document so the visual editor can rewrite the body without touching the head. */
export function splitDocument(html: string): SplitDoc {
    const open = html.match(/<body[^>]*>/i);
    const close = html.match(/<\/body>/i);
    if (open && close && close.index! > open.index!) {
        return {
            head: html.slice(0, open.index! + open[0].length),
            body: html.slice(open.index! + open[0].length, close.index!),
            tail: html.slice(close.index!),
            isFull: true,
        };
    }
    return { head: `${HEAD_OPEN}\n<body>`, body: html, tail: "</body>\n</html>", isFull: false };
}

export const joinDocument = (parts: SplitDoc, body: string) => parts.head + body + parts.tail;

/* ── uploaded-document scan ─────────────────────────────────────────────────
   Authors bring finished HTML (often LLM-written, single-file). The scan makes
   what's inside visible to the builder: which paths it links to (so missing
   sub-pages can be created), which in-page sections it navigates to, and the
   classic hiding places — HTML comments, hidden elements, scripts, forms.
   ─────────────────────────────────────────────────────────────────────── */

export interface PageScan {
    /** Internal path links (`href="/…"`), de-duplicated, query stripped. */
    linkedPaths: string[];
    /** Anchor navigation (`href="#…"`), de-duplicated, bare "#" dropped. */
    anchors: string[];
    /** Element ids present in the document (anchor targets that exist). */
    ids: string[];
    /** HTML comment bodies, trimmed. */
    comments: string[];
    scripts: number;
    forms: number;
    /** hidden attributes, display:none styles, type="hidden" inputs. */
    hiddenBits: number;
}

export function scanDocument(html: string): PageScan {
    const linkedPaths = new Set<string>();
    const anchors = new Set<string>();
    const ids = new Set<string>();
    const comments: string[] = [];

    for (const m of html.matchAll(/href\s*=\s*"([^"]*)"/gi)) {
        const href = m[1].trim();
        if (href.startsWith("#")) {
            if (href.length > 1) anchors.add(href.slice(1));
        } else if (href.startsWith("/") && !href.startsWith("//")) {
            linkedPaths.add(href.split(/[?#]/)[0] || "/");
        }
    }
    for (const m of html.matchAll(/id\s*=\s*"([^"]+)"/gi)) ids.add(m[1]);
    for (const m of html.matchAll(/<!--([\s\S]*?)-->/g)) {
        const body = m[1].trim();
        if (body) comments.push(body);
    }

    return {
        linkedPaths: [...linkedPaths],
        anchors: [...anchors],
        ids: [...ids],
        comments,
        scripts: (html.match(/<script[\s>]/gi) ?? []).length,
        forms: (html.match(/<form[\s>]/gi) ?? []).length,
        hiddenBits: (html.match(/type\s*=\s*"hidden"|\shidden(?=[\s>/])|display\s*:\s*none/gi) ?? []).length,
    };
}

/** Parse the "extra search words" input into a page's search-term list:
    split on commas, trim each term, drop empties and duplicates. The one
    place the site builder turns free text into `WebPageDoc.search`. */
export function parseSearchTerms(text: string): string[] {
    const seen = new Set<string>();
    for (const raw of text.split(",")) {
        const term = raw.trim();
        if (term) seen.add(term);
    }
    return [...seen];
}

/* ── host/path hygiene ────────────────────────────────────────────────────
   Hosts and paths reach the game verbatim — the compiler never cleans them —
   and two slips are common: pasting `https://` into the host, and typing a
   path without its leading slash (the in-game browser then sees
   `http://https://…` and `hostnews`, and the page scan cannot cross-link
   the page). Both are normalized on blur, never mid-keystroke, so typing is
   never fought. */

/** Trim a host, strip a leading `http(s)://` and any trailing slashes. */
export function normalizeHost(host: string): string {
    return host
        .trim()
        .replace(/^https?:\/\//i, "")
        .replace(/\/+$/, "");
}

/* ── preview navigation (r134) ───────────────────────────────────────────
   The preview iframe is sandboxed (unique origin), so nothing inside it can
   be read — but scripts may run and postMessage to the parent. The preview
   serves every page with a tiny interceptor injected: clicks on internal
   links (href="/…") are forwarded to the builder instead of dying on the
   sandbox, and the builder serves the linked page — so an author can walk
   the whole site like a player. */

const PREVIEW_NAV_SCRIPT = `<script>(function(){document.addEventListener("click",function(e){var t=e.target;if(!t||!t.closest)return;var a=t.closest("a[href]");if(!a)return;var h=a.getAttribute("href")||"";if(h.charAt(0)==="/"){e.preventDefault();e.stopPropagation();try{window.parent.postMessage({source:"qe-preview",path:h.split("?")[0].split("#")[0]||"/"},"*")}catch(err){}}},true);})();</` + `script>`;

/** Inject the preview's link interceptor (before </body> when the document
    has one, appended when it does not). Idempotent enough: a page that
    already carries the marker is returned untouched. */
export function injectPreviewNav(html: string): string {
    if (html.includes("qe-preview")) return html;
    return /<\/body>/i.test(html)
        ? html.replace(/<\/body>/i, `${PREVIEW_NAV_SCRIPT}</body>`)
        : html + PREVIEW_NAV_SCRIPT;
}

const escapeHtml = (t: string) =>
    t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Served for preview paths that no page of the site answers — with the
    hint that hidden pages count as destinations too. */
export function notFoundDoc(host: string, path: string): string {
    const h = escapeHtml(host);
    const p = escapeHtml(path);
    return `<!doctype html><html><head><meta charset="utf-8"><title>Not found</title><style>body{font:15px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:#f4f6f9;color:#232a36;display:grid;place-items:center;height:100vh;margin:0}div{text-align:center;max-width:42ch}code{background:#e9ecf1;padding:2px 6px;border-radius:4px}p{color:#5c6b7a}</style></head><body><div><h1 style="font-size:22px;margin-bottom:8px">No page at <code>${p}</code></h1><p>Nothing on <strong>${h}</strong> answers here yet. Add a page with this path in the Pages list — unlisted (hidden) pages count as destinations too.</p></div></body></html>`;
}

/** Derive a page path from an imported file's relative path: the top folder
    is stripped, `index` files become their directory, extensions vanish.
    "site/news.html" -> "/news", "site/sub/index.html" -> "/sub". */
export function importPath(relPath: string): string | null {
    const parts = relPath.split("/");
    const inner = parts.length > 1 ? parts.slice(1).join("/") : parts[0];
    if (!/\.(html?|htm)$/i.test(inner)) return null;
    const segs = inner.replace(/\.html?$/i, "").split("/").filter(Boolean);
    if (segs.length && segs[segs.length - 1].toLowerCase() === "index") segs.pop();
    return normalizePath("/" + segs.join("/"));
}

/** Read a File as text via FileReader — File.text() is not available in all
    environments (jsdom among them), and Load HTML already runs on FileReader. */
export function readFileText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

/** A human title for an imported page: the <title> when the document has
    one, else the file's base name with separators spaced out. */
export function importTitle(fileName: string, html: string): string {
    const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const fromDoc = m?.[1]?.trim();
    if (fromDoc) return fromDoc;
    const base = fileName.replace(/\.html?$/i, "").replace(/[-_]+/g, " ").trim();
    return base ? base.charAt(0).toUpperCase() + base.slice(1) : "Imported page";
}

/** Trim a page path and ensure the leading slash ("/" and "" stay "/"). */
export function normalizePath(path: string): string {
    const t = path.trim();
    if (!t) return "/";
    return t.startsWith("/") ? t : `/${t}`;
}

/* ── linking ──────────────────────────────────────────────────────────────
   The link picker and point-to-link mode (r133) both land here: pure DOM
   operations on the page's own document, testable without the editor
   iframe. Zeis's pick-whip instinct — page and target visible at once, no
   dialog — is kept as click-click (click 🎯 on a page row, then click the
   text); a literal drag cannot cross the iframe boundary without forwarding
   every drag event by hand, and a text drop target is ambiguous mid-drag. */

/** Elements a point-to-link click may sensibly target, nearest first. */
const LINKABLE_SELECTOR = "p,h1,h2,h3,h4,h5,h6,li,dt,dd,blockquote,button,span,div";

/**
 * Link `range` to `path`. Works across element boundaries (extract/insert,
 * not surround). A collapsed range inserts the path as the link text — a
 * link with nothing visible in it is a link that is lost.
 */
export function linkRange(doc: Document, range: Range, path: string): void {
    const a = doc.createElement("a");
    a.setAttribute("href", path);
    if (range.collapsed) {
        a.appendChild(doc.createTextNode(path));
        range.insertNode(a);
        return;
    }
    a.appendChild(range.extractContents());
    range.insertNode(a);
}

/**
 * Point-to-link: turn the element the author clicked into a link to `path`.
 * An existing link is retargeted (pointing at a link re-points it); anything
 * else has its whole content wrapped — the natural unit for the menu items,
 * buttons and headings authors actually point at. Returns the changed
 * element, or null when the click had no sensible target.
 */
export function linkElement(el: Element, path: string): Element | null {
    const host = (el.closest("a") ?? el.closest(LINKABLE_SELECTOR) ?? el) as Element;
    if (host.tagName === "A") {
        host.setAttribute("href", path);
        return host;
    }
    const doc = host.ownerDocument;
    if (!doc) return null;
    const a = doc.createElement("a");
    a.setAttribute("href", path);
    while (host.firstChild) a.appendChild(host.firstChild);
    host.appendChild(a);
    return host;
}
