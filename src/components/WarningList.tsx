/**
 * One tinted card per compiler warning (r152 cards, r153 severity): info is
 * light-blue, warn amber, error red. The context prefix every warning
 * family leads with (the quest or host before the first ": ") renders
 * semibold so entries scan; warnings without one render whole.
 *
 * Flat inline markup inside each row on purpose (icon, optional <strong>,
 * bare tail text): no wrapper spans, so each warning's text matches
 * exactly one element.
 */
import type { CompilerWarning, WarningLevel } from "@/compiler/compile";
import { Icon } from "@/components/Icon";

const LEVEL_STYLE: Record<WarningLevel, { card: string; icon: "info" | "alert"; iconClass: string }> = {
    info: { card: "border-accent/25 bg-accent-soft", icon: "info", iconClass: "text-accent" },
    warn: { card: "border-warn/25 bg-warn/5", icon: "alert", iconClass: "text-warn" },
    error: { card: "border-danger/30 bg-danger/5", icon: "alert", iconClass: "text-danger" },
};

export function WarningList({ warnings }: { warnings: CompilerWarning[] }) {
    return (
        <ul className="grid gap-1.5">
            {warnings.map((w, i) => {
                const cut = w.text.indexOf(": ");
                const head = cut > 0 ? w.text.slice(0, cut) : null;
                const tail = cut > 0 ? w.text.slice(cut + 2) : w.text;
                const style = LEVEL_STYLE[w.level];
                return (
                    <li
                        key={i}
                        className={`rounded-md border px-2.5 py-1.5 text-[11px] leading-relaxed text-ink-2 ${style.card}`}
                    >
                        <Icon name={style.icon} size={12} className={`mr-1.5 inline-block align-[-2px] ${style.iconClass}`} />
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
