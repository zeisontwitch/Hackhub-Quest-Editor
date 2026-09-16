/**
 * The game-event catalogue.
 *
 * Loaded from `reference/hackhub-events.json`, which is *generated* from the SDK's
 * own `ModEventMap` (see `reference/generate-event-catalogue.mjs`). This matters:
 * the docs' Events guide has listed stale payloads for large parts of the catalogue,
 * and a condition built against a stale field name would silently never match
 * (docs/01 §7.2).
 */
import raw from "../../reference/hackhub-events.json";

export interface CatalogueEvent {
    name: string;
    group: string;
    payload: string;
    doc?: string;
}

interface Catalogue {
    generatedFrom: { package: string; version: string; source: string; generatedBy: string };
    count: number;
    events: CatalogueEvent[];
}

const catalogue = raw as Catalogue;

export const SDK_VERSION = catalogue.generatedFrom.version;
export const EVENT_COUNT = catalogue.count;

export const EVENTS: CatalogueEvent[] = catalogue.events;

export const EVENT_GROUPS: { id: string; label: string }[] = [
    { id: "recon", label: "Reconnaissance & terminal" },
    { id: "web", label: "Directory brute-force, browser & HTTP" },
    { id: "access", label: "Access & exploitation" },
    { id: "cracking", label: "Cracking & vuln scanning" },
    { id: "wifi", label: "Bettercap & Wi-Fi" },
    { id: "network", label: "Network & infrastructure" },
    { id: "files", label: "Files" },
    { id: "mail", label: "E-mail" },
    { id: "social", label: "Social & chat" },
    { id: "world", label: "Bank, quest & misc" },
];

const byName = new Map(EVENTS.map((e) => [e.name, e]));

export function getEvent(name: string): CatalogueEvent | undefined {
    return byName.get(name);
}

/** `{ ip: string; results: string[] }` → `["ip", "results"]` */
export function payloadFields(payload: string): string[] {
    const trimmed = payload.trim();
    // A primitive payload (`string`, `void`, `number`) has no fields to match on,
    // so there is nothing to offer the author in the condition builder.
    if (!trimmed.startsWith("{")) return [];
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    const fields: string[] = [];
    let depth = 0;
    let current = "";
    for (const ch of inner) {
        if (ch === "{" || ch === "[" || ch === "<") depth++;
        if (ch === "}" || ch === "]" || ch === ">") depth--;
        if (ch === ";" && depth === 0) {
            fields.push(current);
            current = "";
            continue;
        }
        current += ch;
    }
    if (current.trim()) fields.push(current);
    return fields
        .map((f) => f.trim().split(":")[0].replace(/\?$/, "").trim())
        .filter(Boolean);
}

export function eventFields(name: string): string[] {
    const ev = byName.get(name);
    if (!ev) return [];
    return payloadFields(ev.payload);
}

/**
 * Events the SDK types as an object but the game actually raises with a bare
 * value.
 *
 * The compiler copes with this generally: on a primitive payload any field name
 * resolves to the payload itself. This list exists so the editor can *say so*
 * in the condition builder when an in-game probe proves a declaration is wrong.
 *
 * SDK 0.24.0 now types the old `Terminal.Lynx.Search` mismatch as `string`, so
 * there are no known declaration/runtime primitive mismatches today.
 */
export const PAYLOAD_IS_REALLY_PRIMITIVE = new Set<string>();

const MATCHABLE_PRIMITIVE_PAYLOADS = new Set(["string", "number", "boolean"]);

/** True when the payload is one bare value the author can match as a whole. */
export function isPrimitivePayload(name: string): boolean {
    if (PAYLOAD_IS_REALLY_PRIMITIVE.has(name)) return true;
    const ev = byName.get(name);
    if (!ev) return false;
    return MATCHABLE_PRIMITIVE_PAYLOADS.has(ev.payload.trim());
}

export function isKnownEvent(name: string): boolean {
    return byName.has(name);
}

/** Events grouped for the picker, in catalogue order. */
export function groupedEvents(): { group: string; label: string; events: CatalogueEvent[] }[] {
    return EVENT_GROUPS.map((g) => ({
        group: g.id,
        label: g.label,
        events: EVENTS.filter((e) => e.group === g.id),
    })).filter((g) => g.events.length > 0);
}

/**
 * Human-readable event name, e.g. `Metasploit.Meterpreter.Connected` →
 * `Metasploit: Meterpreter connected`.
 *
 * The namespace stays — it says which part of the game fires — and the tail
 * is split on camelCase with only the first word keeping its capitals, so
 * acronyms (`SSH`, `FTP`) survive while `Connected` reads as `connected`.
 * Single-segment names just get their words split (`NetworkPacketTransfer` →
 * `Network packet transfer`). Stored values are always the raw id; this is
 * display only.
 */
export function humanEventName(name: string): string {
    const parts = name.split(".").filter((p) => p.length > 0);
    if (parts.length === 0) return name;
    const split = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim().split(/\s+/);
    const sentence = (words: string[]) =>
        [words[0], ...words.slice(1).map((w) => w.toLowerCase())].join(" ");
    if (parts.length === 1) return sentence(split(parts[0]));
    const [ns, ...tail] = parts;
    return `${ns}: ${sentence(tail.flatMap(split))}`;
}
