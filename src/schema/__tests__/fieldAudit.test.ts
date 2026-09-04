/**
 * Every field the editor shows an author is a promise that the exported mod
 * will honour it. This suite checks the promises mechanically, because eight
 * separate rounds were lost to fields that looked reasonable and did nothing:
 *
 *   r39  objective triggers declared but never acted on
 *   r43  the export shape the loader needs
 *   r52  `destroyOnComplete`, in the schema and the inspector, never read
 *   r58  `NetworkPort.locked`, likewise
 *   r66  "The player can reply", which the SDK cannot express at all
 *   r67  four more, found by this audit rather than by QA
 *
 * Two independent checks, because they catch different mistakes:
 *
 *   1. every field the inspector renders is READ by the compiler somewhere;
 *   2. every SDK type we build is populated from fields that actually exist.
 *
 * When a field genuinely has no export path, it belongs in EDITOR_ONLY with a
 * reason — never silently absent.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NODE_TYPES_REGISTRY } from "@/schema/registry";

const root = process.cwd();
const runtime = readFileSync(resolve(root, "src/compiler/runtimeSource.ts"), "utf8");
const compiler = readFileSync(resolve(root, "src/compiler/compile.ts"), "utf8");
const emitted = runtime + compiler;
const sdk = readFileSync(resolve(root, "node_modules/@hotbunny/hackhub-content-sdk/index.d.ts"), "utf8");

/**
 * Fields that deliberately never reach the mod, and why. Anything here is a
 * decision; anything NOT here that goes unread is a bug.
 */
const EDITOR_ONLY: Record<string, string> = {
    "layout.group.comment": "group frames are canvas furniture — they are never exported",
    "flow.note.width": "how wide the sticky note is drawn on the canvas",
    "fx.handbook.articleId": "handbook nodes are not compiled yet; export warns about them",
    "fx.handbook.category": "handbook nodes are not compiled yet; export warns about them",
};

type Field = { kind: string; key?: string; label?: string; fields?: Field[] };

/** Does the compiler or runtime mention this key anywhere? */
function isRead(key: string): boolean {
    return (
        new RegExp(`\\.${key}\\b`).test(emitted) ||
        new RegExp(`["']${key}["']`).test(emitted) ||
        new RegExp(`\\b${key}\\s*:`).test(emitted)
    );
}

function allFields(): { type: string; path: string; kind: string }[] {
    const out: { type: string; path: string; kind: string }[] = [];
    const walk = (type: string, fields: Field[], prefix = "") => {
        for (const f of fields) {
            if (!f.key) {
                if (f.fields) walk(type, f.fields, prefix);
                continue;
            }
            out.push({ type, path: `${prefix}${f.key}`, kind: f.kind });
            if (f.fields) walk(type, f.fields, `${prefix}${f.key}.`);
        }
    };
    for (const [type, def] of Object.entries(NODE_TYPES_REGISTRY)) {
        walk(type, ((def as { fields?: Field[] }).fields ?? []) as Field[]);
    }
    return out;
}

describe("every field the editor offers reaches the exported mod", () => {
    const fields = allFields();

    it("finds a field list worth auditing", () => {
        // Guards against the walk silently returning nothing.
        expect(fields.length).toBeGreaterThan(100);
    });

    it("has no field the compiler never reads", () => {
        const orphans = fields
            .filter((f) => !isRead(f.path.split(".").pop()!))
            .map((f) => `${f.type}.${f.path}`)
            .filter((id) => !(id in EDITOR_ONLY));
        expect(
            orphans,
            "these are shown to authors but never exported — either wire them up or list them in EDITOR_ONLY with a reason",
        ).toEqual([]);
    });

    it("keeps the editor-only list honest", () => {
        // A field that starts working should leave the exemption list, or the
        // list becomes a place bugs hide.
        const stillDead = Object.keys(EDITOR_ONLY).filter((id) => {
            const key = id.split(".").pop()!;
            return !isRead(key);
        });
        expect(stillDead.sort()).toEqual(Object.keys(EDITOR_ONLY).sort());
    });

    it("documents a reason for each exemption", () => {
        for (const [id, why] of Object.entries(EDITOR_ONLY)) {
            expect(why.length, `${id} needs a real reason`).toBeGreaterThan(20);
        }
    });
});

/**
 * The other direction: when we build an SDK object, are we filling in the
 * fields that type actually declares? A missing one is silent — the engine
 * takes the object and quietly does less than the author asked for.
 */
describe("the objects we hand the engine are filled in", () => {
    /** Field names declared on an SDK interface. */
    function sdkFields(name: string): string[] {
        const i = sdk.indexOf(`interface ${name} {`);
        if (i < 0) return [];
        const body = sdk.slice(i, sdk.indexOf("\n}", i));
        return [...body.matchAll(/^\t(\w+)\??:/gm)].map((m) => m[1]);
    }

    it("populates every field of BankTransactionOptions that the editor collects", () => {
        // r67: `from` ({ IBAN, name }) was collected and dropped, so every
        // payment arrived from nobody.
        expect(sdkFields("BankTransactionOptions")).toContain("from");
        expect(runtime).toContain("tx.from");
        expect(runtime).toContain("IBAN:");
    });

    it("populates NetworkPort.locked, which decides what can be exploited", () => {
        expect(sdkFields("NetworkPort")).toContain("locked");
        expect(runtime).toMatch(/o\.locked\s*=/);
    });

    it("populates the NetworkUser fields the device tree offers", () => {
        const declared = sdkFields("NetworkUser");
        for (const f of ["username", "password", "firstName", "lastName", "online", "files", "acceptReverseTCP", "email"]) {
            expect(declared, `${f} should be a real NetworkUser field`).toContain(f);
        }
        for (const f of ["firstName", "lastName", "online", "acceptReverseTCP"]) {
            expect(runtime, `${f} is collected but never sent`).toMatch(new RegExp(`o\\.${f}\\s*=`));
        }
    });

    it("populates the NetworkFileMap flags a file can carry", () => {
        const declared = sdkFields("NetworkFileMap");
        for (const f of ["name", "extension", "data", "isFolder", "children", "readonly", "hidden"]) {
            expect(declared).toContain(f);
        }
        for (const f of ["extension", "data", "isFolder", "readonly", "hidden", "children"]) {
            expect(runtime, `${f} is offered but never sent`).toMatch(new RegExp(`o\\.${f}\\s*=`));
        }
    });
});
