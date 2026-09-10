/**
 * Tool packs — the package format that lets community tool-mod authors
 * extend this editor with pure data (docs/ToolPack-Format.md is the
 * modder-facing spec). A pack is a `toolpack.json` file: the events its game
 * mod emits, the SharedStorage contracts it reads, the target conventions it
 * matches against, and (reserved) editor nodes.
 *
 * Two rules shape everything here:
 * - NO executable code. A pack is data; the editor never evaluates
 *   third-party JavaScript.
 * - The no-code rule (r135 design, requirement zero): everything a pack
 *   provides must surface in the editor as labelled, human-readable UI —
 *   the pack author's `label` and `hint` strings are what quest authors see.
 *
 * Validation errors are written for the modder, in the scan-panel voice:
 * what is wrong, where, and how to fix it.
 */
import { z } from "zod";

export const TOOLPACK_FORMAT = 2;

export const PackFieldSchema = z.object({
    key: z.string().min(1, "every field needs a key"),
    label: z.string().min(1, "every field needs a label — quest authors see this text"),
    type: z.enum(["string", "number", "boolean", "text"]).default("string"),
    hint: z.string().optional(),
    /** For string fields: offer these as a dropdown instead of free text. */
    choices: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});

export const PackEventSchema = z.object({
    /** The event name the game mod emits, like `ToolName.Category.Event`. */
    name: z
        .string()
        .min(1, "every event needs the exact name the game mod emits")
        .regex(/^[A-Za-z][A-Za-z0-9_.]*$/, "event names are letters, numbers and dots — quest authors paste this into a trigger"),
    /** What quest authors see in the trigger picker. Plain words, please. */
    label: z.string().min(1, "every event needs a label — quest authors pick events by this text"),
    docs: z.string().default(""),
    /** The payload field names quest conditions can match on. */
    fields: z.array(z.string()).default([]),
});

export const PackStorageSchema = z.object({
    id: z.string().min(1, "every data shape needs an id"),
    label: z.string().min(1, "every data shape needs a label — quest authors see this text"),
    /** The SharedStorage key the game mod reads. */
    key: z.string().min(1, "every data shape needs the SharedStorage key the game mod reads"),
    docs: z.string().default(""),
    /** overwrite: the key holds exactly this entry. replace: the key is a
        list and the entry replaces the one with the same `mergeBy` value. */
    merge: z.enum(["overwrite", "replace"]).default("replace"),
    mergeBy: z.string().optional(),
    fields: z.array(PackFieldSchema).default([]),
    /** The entry template — plain JSON whose string values may contain
        "{{fieldKey}}" holes the quest author fills, and "{{data.*}}" story
        tokens that resolve when the quest runs. */
    entry: z.record(z.string(), z.unknown()),
});

export const PackTargetRulesSchema = z.object({
    services: z.array(z.string()).default([]),
    versionOnPorts: z.boolean().default(false),
    vulnsOnDomain: z.boolean().default(false),
    vulnTypes: z.array(z.string()).default([]),
});

export const ToolPackSchema = z.object({
    format: z.literal(TOOLPACK_FORMAT),
    /** Editor-side id, lowercase-dashed. Node and contract references use it. */
    id: z
        .string()
        .min(1)
        .regex(/^[a-z0-9][a-z0-9-]*$/, "the pack id is lowercase letters, numbers and dashes (it names things inside projects)"),
    name: z.string().min(1, "the pack needs a name — quest authors see it"),
    author: z.string().default(""),
    version: z.string().default("1.0.0"),
    docsUrl: z.string().optional(),
    /** The in-game mod this pack drives — the honesty line the editor shows
        players-facing authors: quests using this pack need it installed. */
    gameMod: z.object({
        name: z.string().min(1, "name the in-game mod this pack drives (gameMod.name)"),
        note: z.string().optional(),
    }),
    events: z.array(PackEventSchema).default([]),
    storage: z.array(PackStorageSchema).default([]),
    targetRules: PackTargetRulesSchema.optional(),
    /** Reserved (v1): simple scripted-answer tools work through the editor's
        existing "Tool response" node — this section is documentation-only. */
    commandData: z.array(z.unknown()).default([]),
    /** Reserved for Editor Mods (the next round): pack-authored nodes. */
    nodes: z.array(z.unknown()).default([]),
});

export type PackField = z.infer<typeof PackFieldSchema>;
export type PackEvent = z.infer<typeof PackEventSchema>;
export type PackStorage = z.infer<typeof PackStorageSchema>;
export type ToolPack = z.infer<typeof ToolPackSchema>;

/**
 * Turn zod's issue list into the scan-panel voice: what is wrong, where,
 * and what to do — one line per problem, written for the modder.
 */
export function describePackError(error: z.ZodError): string {
    return error.issues
        .slice(0, 4)
        .map((issue) => {
            const where = issue.path.length ? issue.path.join(".") : "the pack";
            const what = issue.message;
            return `${where}: ${what}.`;
        })
        .join(" ");
}

/** Parse raw JSON as a tool pack, with the plain-language error contract. */
export function parseToolPack(raw: unknown): { ok: true; pack: ToolPack } | { ok: false; error: string } {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
        return { ok: false, error: "This file is not a tool pack — a pack is one JSON object with a \"format\": 2 field." };
    }
    const fmt = (raw as { format?: unknown }).format;
    if (fmt !== TOOLPACK_FORMAT) {
        return {
            ok: false,
            error: `This pack says "format": ${JSON.stringify(fmt) ?? "(none)"} — this editor speaks format ${TOOLPACK_FORMAT}. See docs/ToolPack-Format.md for the current shape.`,
        };
    }
    const result = ToolPackSchema.safeParse(raw);
    if (!result.success) return { ok: false, error: describePackError(result.error) };
    return { ok: true, pack: result.data };
}
