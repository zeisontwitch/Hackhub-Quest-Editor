#!/usr/bin/env node
/**
 * Regenerates `reference/hackhub-events.json` from the HackHub Content SDK's own
 * type declarations.
 *
 * Why this exists: the payload table on the docs' Events *guide* page is stale for
 * roughly half of the 92 events (see docs/01-analysis-and-architecture.md §7.2).
 * Building the editor's trigger palette from that table would generate trigger
 * conditions that never match. `ModEventMap` in the published `index.d.ts` is the
 * authoritative source, so we parse it.
 *
 * Usage:
 *   npm i -D @hotbunny/hackhub-content-sdk     # or point --sdk at an index.d.ts
 *   node reference/generate-event-catalogue.mjs [--sdk <path-to-index.d.ts>]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveSdkPath() {
    const argIdx = process.argv.indexOf("--sdk");
    if (argIdx !== -1 && process.argv[argIdx + 1]) return process.argv[argIdx + 1];

    const candidates = [
        path.resolve(__dirname, "../node_modules/@hotbunny/hackhub-content-sdk/index.d.ts"),
        path.resolve(__dirname, "../../node_modules/@hotbunny/hackhub-content-sdk/index.d.ts"),
    ];
    for (const c of candidates) if (fs.existsSync(c)) return c;

    console.error(
        "Could not find @hotbunny/hackhub-content-sdk/index.d.ts.\n" +
        "Install it (`npm i -D @hotbunny/hackhub-content-sdk`) or pass --sdk <path>.",
    );
    process.exit(1);
}

const sdkPath = resolveSdkPath();
const raw = fs.readFileSync(sdkPath, "utf-8");
const src = raw.replace(/\r/g, "");

const pkgPath = path.join(path.dirname(sdkPath), "package.json");
const sdkVersion = fs.existsSync(pkgPath)
    ? JSON.parse(fs.readFileSync(pkgPath, "utf-8")).version
    : "unknown";

/** Every top-level `interface Name { ... }` → its field list, flattened one level. */
function collectInterfaces(text) {
    const out = new Map();
    const re = /(?:^export )?interface (\w+) \{([\s\S]*?)\n\}/gm;
    let m;
    while ((m = re.exec(text)) !== null) {
        const name = m[1];
        const body = m[2];
        const fields = [];
        let depth = 0;
        let current = "";
        for (const line of body.split("\n")) {
            const cleaned = line.replace(/\/\*\*[\s\S]*?\*\//g, "").trim();
            if (!cleaned || cleaned.startsWith("*") || cleaned.startsWith("//")) continue;
            current += (current ? " " : "") + cleaned;
            depth += (cleaned.match(/\{/g) || []).length;
            depth -= (cleaned.match(/\}/g) || []).length;
            if (depth <= 0 && cleaned.endsWith(";")) {
                fields.push(current.replace(/;$/, "").replace(/\s+/g, " "));
                current = "";
                depth = 0;
            }
        }
        if (current) fields.push(current.replace(/\s+/g, " "));
        out.set(name, fields);
    }
    return out;
}

/** The `ModEventMap` block. */
const mapMatch = src.match(/export interface ModEventMap \{([\s\S]*?)\n\}/);
if (!mapMatch) {
    console.error("Could not locate ModEventMap in the SDK declarations.");
    process.exit(1);
}

const interfaces = collectInterfaces(src);

/** Pull the leading doc comment (if any) for an event key, as a description. */
function docFor(eventName) {
    const idx = mapMatch[1].indexOf(`"${eventName}"`);
    if (idx === -1) return undefined;
    const before = mapMatch[1].slice(0, idx);
    /* The LAST comment block only: [\s\S]*? spans from the FIRST "/**", which
       glued Terminal.SSH.Connected's comment onto Disconnected's entry. */
    const docMatch = before.match(/\/\*\*((?:[^*]|\*(?!\/))*)\*\/\s*$/);
    if (!docMatch) return undefined;
    return docMatch[1]
        .split("\n")
        .map((l) => l.replace(/^\s*\*?\s?/, "").trim())
        .filter(Boolean)
        .join(" ");
}

/** Render a payload type expression into a readable shape string. */
function renderPayload(typeExpr) {
    const named = typeExpr.trim();
    if (interfaces.has(named)) {
        const fields = interfaces.get(named);
        return fields.length ? `{ ${fields.join("; ")} }` : "{}";
    }
    // inline object literal spanning several lines
    const inlined = named.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();
    if (inlined.startsWith("{") && inlined.endsWith("}")) {
        const inner = inlined.slice(1, -1).trim();
        return inner ? `{ ${inner.replace(/;$/, "")} }` : "{}";
    }
    return named; // primitives e.g. `string`
}

const GROUPS = [
    ["recon", /^(Terminal\.(NmapScan|Ping|Nslookup|Mxlookup|Dig|Whois|Geoip|Lynx\.|Command|InstallPackage|Cd|Ls|Cat|Openssl|Ifconfig|Explorer))/],
    ["web", /^(Terminal\.Dirhunter|Browser\.)/],
    ["access", /^(Terminal\.SSH\.|Terminal\.FTP\.|Terminal\.Hydra|Metasploit\.|Meterpreter\.|RemoteConnection\.)/],
    ["cracking", /^(Hashcat|John\.|Fern\.|Subfinder\.|Nuclei\.|Sqlmap\.)/],
    ["wifi", /^(Bettercap\.|Network\.Wifi)/],
    ["network", /^(Network\.PortChanges|Network\.UserActivity|NetworkPacketTransfer|Database\.|PFSense\.)/],
    ["files", /^(Files\.|Python3\.)/],
    ["mail", /^Mail\./],
    ["social", /^(Twotter\.|Kisscord\.|WeeChat\.)/],
    ["world", /^(Bank\.|Quest\.|AppStore\.|Process\.|Wireshark\.|BCC\.)/],
];

function groupOf(name) {
    for (const [group, re] of GROUPS) if (re.test(name)) return group;
    return "other";
}

const events = [];
for (const line of mapMatch[1].split("\n")) {
    const m = line.match(/^\s*"([^"]+)":\s*([\s\S]*?);?\s*$/);
    if (!m) continue;
    const [, name, typeExpr] = m;
    // Skip entries whose type expression opens an object literal that does not close
    // on the same line (e.g. "Files.Deleted"). The recovery pass below reads those
    // straight out of the block with the full multi-line body.
    const opens = (typeExpr.match(/\{/g) || []).length;
    const closes = (typeExpr.match(/\}/g) || []).length;
    if (opens !== closes) continue;
    events.push({ name, group: groupOf(name), payload: renderPayload(typeExpr) });
}

// Multi-line inline object types are recovered straight from the block.
for (const m of mapMatch[1].matchAll(/"([^"]+)":\s*\{([\s\S]*?)\};/g)) {
    const name = m[1];
    if (events.some((e) => e.name === name)) continue;
    const inner = m[2].split("\n").map((l) => l.trim()).filter(Boolean).join(" ").replace(/\s+/g, " ");
    events.push({ name, group: groupOf(name), payload: `{ ${inner.replace(/;$/, "")} }` });
}

events.sort((a, b) => a.name.localeCompare(b.name));
for (const e of events) {
    const doc = docFor(e.name);
    if (doc) e.doc = doc;
}

// ── Integrity gate ────────────────────────────────────────────────────
// Fail loudly rather than ship a catalogue with a truncated payload. A future
// SDK release could introduce a shape this parser does not handle; a silently
// wrong palette is far worse than a failed regeneration.
const keyCount = (mapMatch[1].match(/^\s*"[^"]+":/gm) || []).length;
const problems = [];
if (events.length !== keyCount) {
    problems.push(`parsed ${events.length} events but ModEventMap declares ${keyCount} keys`);
}
for (const e of events) {
    // Note: "{}" is a legitimate payload (e.g. Bettercap.Open), so only a bare
    // or empty expression counts as a parse failure.
    if (!e.payload || e.payload === "{" || !e.payload.trim()) {
        problems.push(`${e.name}: unparseable payload ${JSON.stringify(e.payload)}`);
    }
    const o = (e.payload.match(/\{/g) || []).length;
    const c = (e.payload.match(/\}/g) || []).length;
    if (o !== c) problems.push(`${e.name}: unbalanced braces in ${JSON.stringify(e.payload)}`);
    if (/;\s*\{|{\s*;/.test(e.payload)) {
        problems.push(`${e.name}: malformed nested object in ${JSON.stringify(e.payload)}`);
    }
}
if (problems.length) {
    console.error("Refusing to write catalogue — parser needs updating for this SDK version:");
    for (const p of problems) console.error("  ✗ " + p);
    process.exit(1);
}

const catalogue = {
    generatedFrom: {
        package: "@hotbunny/hackhub-content-sdk",
        version: sdkVersion,
        source: "index.d.ts → ModEventMap",
        generatedBy: "reference/generate-event-catalogue.mjs",
    },
    count: events.length,
    events,
};

const outPath = path.resolve(__dirname, "hackhub-events.json");
fs.writeFileSync(outPath, JSON.stringify(catalogue, null, 2) + "\n", "utf-8");

const byGroup = events.reduce((acc, e) => ((acc[e.group] = (acc[e.group] || 0) + 1), acc), {});
console.log(`SDK ${sdkVersion}: wrote ${events.length} events → ${path.relative(process.cwd(), outPath)}`);
console.log("  by group:", JSON.stringify(byGroup));
