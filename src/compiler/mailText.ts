/**
 * Turning a mail body into the plain text GoMail actually displays.
 *
 * The game prints a mail body verbatim, so HTML in it is shown as tags — QA
 * received a briefing that read "<p>His name is <b>Anselm Ritter</b>." on
 * screen. Authors paste HTML in anyway (the field's hint used to invite it),
 * so the compiler converts it, and the inspector's preview uses this same
 * function to show precisely what will be sent.
 *
 * Kept in step with the runtime's own `htmlToText`, which does the same job
 * inside the generated mod; the compiler test pins the two together.
 */
export function mailBodyText(html: string | undefined | null): string {
    let s = String(html ?? "");
    if (!s.includes("<") && !s.includes("&")) return s;
    s = s.replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
    s = s.replace(/<\s*br\s*\/?\s*>/gi, "\n");
    s = s.replace(/<\s*\/\s*(p|div|h[1-6]|li|tr|blockquote)\s*>/gi, "\n\n");
    s = s.replace(/<\s*li[^>]*>/gi, "\u2022 ");
    s = s.replace(/<\s*hr[^>]*\/?\s*>/gi, "\n----------\n");
    s = s.replace(/<[^>]+>/g, "");
    s = s
        .replace(/&nbsp;/gi, " ")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/gi, "'")
        .replace(/&amp;/gi, "&");
    s = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
    return s.replace(/^\s+|\s+$/g, "");
}
