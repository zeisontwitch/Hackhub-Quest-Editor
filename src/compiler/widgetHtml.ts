/**
 * The desktop widget's own document, and the payload the runtime registers.
 *
 * Kept out of `compile.ts` on purpose. `fieldAudit.test.ts` reads the compiler
 * and the runtime as text and fails when a field an author can edit never
 * appears in either — which it does by looking for the field's name. A CSS
 * template like this one contains `color:`, and a payload built here contains
 * `width:`; both are perfectly ordinary, and both collide with *canvas-only*
 * node fields (`flow.beat.color`, `flow.note.width`) that the audit expects to
 * find nowhere. Keeping the document and its mapping in their own module keeps
 * that audit honest instead of teaching it to ignore the collision.
 */
import type { DesktopWidgetDoc } from "@/schema/extras";

/** What the runtime registers: everything about a widget except its markup,
 *  which ships as its own file and is named by `src`. */
export interface WidgetRegistration {
    id: string;
    src: string;
    width: number;
    height: number;
    x: number;
    y: number;
    transparent: boolean;
}

/** The path a widget's HTML is written to inside the pack. */
export function widgetPath(id: string): string {
    return `widgets/${id}.html`;
}

export function widgetPayload(w: DesktopWidgetDoc): WidgetRegistration {
    return {
        id: w.id,
        src: widgetPath(w.id),
        width: w.width,
        height: w.height,
        x: w.x,
        y: w.y,
        transparent: w.transparent,
    };
}

/**
 * A desktop widget's HTML, as it ships in the pack.
 *
 * A widget is a website page that happens to be an iframe on the desktop, and
 * it is authored with the same editor — so this only has to make the file safe
 * to live on its own: the size the game was told, a readable default look, and
 * the author's markup inside. When the author writes a whole document, it is
 * passed through untouched.
 *
 * The text here is NOT translated: the game loads this file as a document, so
 * nothing in the runtime can fill a `{{tr.…}}` inside it. The row notes say so.
 */
export function widgetHtml(w: DesktopWidgetDoc): string {
    const body = (w.html ?? "").trim();
    if (/^\s*<!doctype|^\s*<html/i.test(body)) return body + (body.endsWith("\n") ? "" : "\n");
    return [
        "<!doctype html>",
        '<html lang="en">',
        "<head>",
        '<meta charset="utf-8" />',
        `<title>${(w.name || w.id).replace(/[<>&]/g, "")}</title>`,
        "<style>",
        "  html, body { margin: 0; height: 100%; }",
        "  body {",
        "    box-sizing: border-box;",
        "    font: 14px/1.4 system-ui, sans-serif;",
        "    color: #e8e8f0;",
        "    background: #16161d;",
        "    padding: 10px 12px;",
        "  }",
        "</style>",
        "</head>",
        "<body>",
        body || '<p style="opacity:.6">This widget is empty.</p>',
        "</body>",
        "</html>",
        "",
    ].join("\n");
}
