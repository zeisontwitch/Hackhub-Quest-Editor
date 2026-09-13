/**
 * One amber card per compiler warning (r152): the export dialog used to
 * render warnings as bare bullets — a grey wall that was easy to ignore.
 * The context prefix every warning family leads with (the quest or host
 * before the first ": ") renders semibold so entries scan; warnings
 * without one render whole.
 *
 * Flat inline markup inside each row on purpose (icon, optional <strong>,
 * bare tail text): no wrapper spans, so each warning's text matches
 * exactly one element.
 */
import { Icon } from "@/components/Icon";

export function WarningList({ warnings }: { warnings: string[] }) {
    return (
        <ul className="grid gap-1.5">
            {warnings.map((w, i) => {
                const cut = w.indexOf(": ");
                const head = cut > 0 ? w.slice(0, cut) : null;
                const tail = cut > 0 ? w.slice(cut + 2) : w;
                return (
                    <li
                        key={i}
                        className="rounded-md border border-warn/25 bg-warn/5 px-2.5 py-1.5 text-[11px] leading-relaxed text-ink-2"
                    >
                        <Icon name="alert" size={12} className="mr-1.5 inline-block align-[-2px] text-warn" />
                        {head && (
                            <>
                                <strong className="font-semibold text-ink">{head}</strong>
                                {": "}
                            </>
                        )}
                        {tail}
                    </li>
                );
            })}
        </ul>
    );
}
