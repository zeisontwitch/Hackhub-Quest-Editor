/**
 * The game-event picker.
 *
 * Shows all 92 events with their *real* payload fields (from the generated
 * catalogue, not the stale docs table), so the author can see what they are able
 * to test against before writing a condition.
 */
import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import {
    EVENT_COUNT,
    SDK_VERSION,
    humanEventName,
    getEvent,
    groupedEvents,
    isKnownEvent,
    isPrimitivePayload,
    payloadFields,
} from "@/schema/events";
import { eventDoc } from "@/schema/eventDocs";
import { packEventByName, packEvents, usePacks } from "@/store/packs";

export function EventPicker({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const packs = usePacks((s) => s.packs);
    const community = packEvents(packs);
    const packLabel = new Map(community.map((e) => [e.name, `${e.label} — ${e.packName}`]));

    const groups = useMemo(() => {
        const q = query.trim().toLowerCase();
        const builtin = groupedEvents();
        const all = [
            ...builtin,
            ...(community.length
                ? [
                      {
                          group: "community",
                          label: `Community tools (${community.length})`,
                          events: community.map((e) => ({ name: e.name, payload: e.payload, group: "community" })),
                      },
                  ]
                : []),
        ];
        if (!q) return all;
        return all
            .map((g) => ({
                ...g,
                events: g.events.filter(
                    (e) =>
                        e.name.toLowerCase().includes(q) ||
                        humanEventName(e.name).toLowerCase().includes(q) ||
                        e.payload.toLowerCase().includes(q) ||
                        (packLabel.get(e.name) ?? "").toLowerCase().includes(q),
                ),
            }))
            .filter((g) => g.events.length > 0);
    }, [query, community]);

    const selected = value ? getEvent(value) : undefined;
    const packEv = value ? packEventByName(packs, value) : undefined;
    const isCustom = value !== "" && !isKnownEvent(value) && !packEv;

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>
                <button type="button" className="field-input flex items-center justify-between gap-2 text-left">
                    <span className="min-w-0 flex-1">
                        {value === "" ? (
                            <span className="text-ink-4">Choose an event…</span>
                        ) : (
                            <>
                                <span className="block truncate text-[12px] text-ink">
                                    {humanEventName(value)}
                                </span>
                                <span className="block truncate font-mono text-[10.5px] text-ink-4">
                                    {value}
                                </span>
                            </>
                        )}
                    </span>
                    <Icon name="chevronDown" size={13} className="shrink-0 text-ink-4" />
                </button>
            </Popover.Trigger>

            <Popover.Portal>
                <Popover.Content
                    align="start"
                    sideOffset={6}
                    className="z-50 w-[340px] overflow-hidden rounded-lg border border-line bg-surface shadow-panel"
                >
                    <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
                        <span className="text-[10px] font-semibold tracking-wider text-ink-3 uppercase">
                            {EVENT_COUNT} game events · SDK {SDK_VERSION}
                        </span>
                    </div>

                    <div className="border-b border-line p-2">
                        <div className="relative">
                            <Icon
                                name="search"
                                size={13}
                                className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-ink-4"
                            />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search events and payload fields"
                                aria-label="Search events"
                                className="field-input pl-7 text-[12px]"
                            />
                        </div>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto py-1">
                        {groups.length === 0 && (
                            <p className="px-3 py-6 text-center text-[11.5px] text-ink-4">
                                No event matches “{query}”.
                            </p>
                        )}
                        {groups.map((group) => (
                            <section key={group.group} className="mb-1">
                                <h5 className="px-3 py-1 text-[10px] font-semibold tracking-wider text-ink-4 uppercase">
                                    {group.label}
                                </h5>
                                {group.events.map((event) => (
                                    <button
                                        key={event.name}
                                        type="button"
                                        onClick={() => {
                                            onChange(event.name);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            "flex w-full flex-col gap-0.5 px-3 py-1.5 text-left transition-colors",
                                            "hover:bg-surface-2",
                                            value === event.name && "bg-accent-soft",
                                        )}
                                    >
                                        <span className="block truncate text-[12px] text-ink">
                                            {packLabel.get(event.name) ?? humanEventName(event.name)}
                                        </span>
                                        <span className="block truncate font-mono text-[10.5px] text-ink-4">
                                            {event.name}
                                        </span>
                                        <span className="truncate font-mono text-[10px] text-ink-4">
                                            {event.payload}
                                        </span>
                                    </button>
                                ))}
                            </section>
                        ))}
                    </div>

                    <div className="border-t border-line p-2">
                        <button
                            type="button"
                            onClick={() => {
                                onChange(query.trim() || "MyMod.CustomEvent");
                                setOpen(false);
                            }}
                            className="btn-default w-full text-[11.5px]"
                        >
                            <Icon name="plus" size={12} />
                            Use custom event “{query.trim() || "MyMod.CustomEvent"}”
                        </button>
                    </div>
                </Popover.Content>
            </Popover.Portal>

            {isCustom && (
                <p className="field-hint">
                    Advanced: a custom event isn't in the game yet — you (or another mod)
                    must trigger it from a website, app or terminal command with
                    <code className="mx-1 rounded bg-surface-2 px-1 font-mono text-[10px]">
                        HackhubSDK.Events.emit("{value}")
                    </code>
                </p>
            )}
            {packEv ? (
                <EventPackExplanation ev={packEv} />
            ) : (
                selected && <EventExplanation name={selected.name} payload={selected.payload} />
            )}
        </Popover.Root>
    );
}

/**
 * The explanation for a community event: same shape as the catalogue one,
 * but honest about where the event comes from — a tool pack, and the game
 * mod its quests need on the player's machine.
 */
function EventPackExplanation({
    ev,
}: {
    ev: { label: string; docs: string; fields: string[]; packName: string; gameModName: string };
}) {
    return (
        <>
            {ev.docs && <p className="field-hint">{ev.docs}</p>}
            <p className="field-hint">
                Fired by the <strong>{ev.packName}</strong> tool mod. A quest that waits on this
                event needs <strong>{ev.gameModName}</strong> installed on the player&apos;s
                machine — say so in the quest description.
            </p>
            <p className="field-hint">
                {ev.fields.length > 0 ? (
                    <>
                        Narrow it down with:{" "}
                        <code className="font-mono text-[10px] text-ink-3">{ev.fields.join(", ")}</code>
                    </>
                ) : (
                    "It carries no details to test against."
                )}
            </p>
        </>
    );
}

/**
 * What the chosen event is, then what can be matched on it. Primitive
 * payloads (a bare string, not an object) are matched as a whole — the
 * condition builder offers no field for them, so neither does this.
 */
export function EventExplanation({ name, payload }: { name: string; payload: string }) {
    const fields = payloadFields(payload);
    const primitive = isPrimitivePayload(name);
    return (
        <>
            {eventDoc(name) && <p className="field-hint">{eventDoc(name)}</p>}
            <p className="field-hint">
                {primitive ? (
                    "Match it as a whole — it carries one value, not named details."
                ) : fields.length > 0 ? (
                    <>
                        Narrow it down with:{" "}
                        <code className="font-mono text-[10px] text-ink-3" title={payload}>
                            {fields.join(", ")}
                        </code>
                    </>
                ) : (
                    "It carries no details to test against."
                )}
            </p>
        </>
    );
}
