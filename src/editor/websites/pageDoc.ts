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

/**
 * Parse the "extra search words" input into a page's search-term list:
 * split on commas, trim each term, drop empties and duplicates. The one
 * place the site builder turns free text into `WebPageDoc.search`.
 */
export function parseSearchTerms(text: string): string[] {
    const seen = new Set<string>();
    for (const raw of text.split(",")) {
        const term = raw.trim();
        if (term) seen.add(term);
    }
    return [...seen];
}
