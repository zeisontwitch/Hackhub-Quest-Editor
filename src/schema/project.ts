/**
 * The project document: mod metadata + quests, each with its own graph.
 *
 * Per decision 3 (docs/01 §8) a project is one mod containing one or more quests.
 * New projects start with a single quest so the multi-quest structure stays out
 * of the way until it is needed.
 */
import { z } from "zod";
import { nanoid } from "nanoid";
import {
    IdentifierSchema,
    PROJECT_SCHEMA_VERSION,
    SemverSchema,
    SlugSchema,
    ViewportSchema,
} from "./common";
import { DialogBranchSchema, NodeSchema } from "./nodes";
import { EdgeSchema } from "./edges";
import { STARTER_PAGE } from "@/templates/pages";

/* ── Mod ─────────────────────────────────────────────────────────────────── */

/**
 * `permissions` is deliberately absent: it is *derived* from the graph by the
 * analysis layer at export time (docs/01 §1.2). Letting authors type it would
 * reproduce the trap where an omitted field silently grants every permission.
 */
export const ModSchema = z.object({
    id: SlugSchema.default("my-quest-mod"),
    name: z.string().default("My Quest Mod"),
    version: SemverSchema.default("1.0.0"),
    author: z.string().default(""),
    description: z.string().default(""),
    icon: z.string().optional(),
    cover: z.string().optional(),
    tags: z.array(z.string()).default([]),
    dependencies: z.array(z.string()).default([]),
    /** Lowest SDK that supports everything this project uses. */
    minSdkVersion: z.string().default("0.21.0"),
    apiVersion: z.number().default(1),
});
export type ModDoc = z.infer<typeof ModSchema>;

/* ── Websites ──────────────────────────────────────────────────────────────
   The WYSIWYG website builder's model. A mod ships any number of sites; each
   page compiles to an HTML file under the site's host. Pages with `seo:false`
   stay routable but leave the in-game search index — the dirhunter hiding
   place (docs/01 §1.4).
   ─────────────────────────────────────────────────────────────────────── */

export const WebPageSchema = z.object({
    id: z.string(),
    /** Path on the host, e.g. `/` or `/about/team`. Sub-directories are fine. */
    path: z.string().default("/"),
    title: z.string().default(""),
    /**
     * Listed in the in-game search index. Turn off to hide a clue page from
     * search while keeping it reachable by URL (what `dirhunter` brute-forces).
     */
    seo: z.boolean().default(true),
    /** Which ready-made template the page started from, for provenance. */
    template: z.string().optional(),
    /** WYSIWYG body, stored as HTML. */
    content: z.string().default(""),
});
export type WebPageDoc = z.infer<typeof WebPageSchema>;

export const WebsiteSchema = z.object({
    id: z.string(),
    /** The host players type into the in-game browser, e.g. `meridian-capital.net`. */
    host: z.string().default("example.net"),
    name: z.string().default(""),
    pages: z.array(WebPageSchema).default([]),
});
export type WebsiteDoc = z.infer<typeof WebsiteSchema>;

/* ── Quest ───────────────────────────────────────────────────────────────── */

export const EmployerSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    avatar: z.string().optional(),
});

export const HackhubPostSchema = z.object({
    content: z.string().default(""),
    media: z.string().optional(),
    authorName: z.string().optional(),
    authorAvatar: z.string().optional(),
    likes: z.number().optional(),
    comments: z
        .array(
            z.object({
                id: z.string(),
                authorName: z.string().default(""),
                authorAvatar: z.string().optional(),
                content: z.string().default(""),
            }),
        )
        .default([]),
});

export const GraphSchema = z.object({
    nodes: z.array(NodeSchema).default([]),
    edges: z.array(EdgeSchema).default([]),
});
export type GraphDoc = z.infer<typeof GraphSchema>;

export const QuestSchema = z.object({
    id: z.string(),
    name: IdentifierSchema.default("NewQuest"),
    title: z.string().default("New Quest"),
    description: z.string().default(""),
    icon: z.string().optional(),
    group: z.enum(["storyline", "side", "sandbox"]).default("sandbox"),
    rewards: z.object({ money: z.number().default(0), xp: z.number().default(0) }).default({
        money: 0,
        xp: 0,
    }),
    employer: EmployerSchema.default({}),
    autoStart: z.boolean().default(false),
    /**
     * Defaults to false. HackHub 1.1.2 freezes the renderer whenever it
     * finishes a mod-defined quest - both automatically and via the complete
     * button - so generated quests end their story without formally
     * completing. See docs/04-engine-bug-quest-completion.md.
     */
    autoComplete: z.boolean().default(false),
    questsToComplete: z.array(z.string()).default([]),
    maxClaim: z.number().optional(),
    maxClaimPerDay: z.number().optional(),
    abandonable: z.boolean().default(true),
    hasCompleteButton: z.boolean().default(false),
    /**
     * Hide every objective from the quest panel once they have all been
     * completed. A workaround for the engine bug in
     * docs/04-engine-bug-quest-completion.md: a mod quest cannot be completed
     * without freezing the game, so its entry lingers in the quest list.
     */
    hideObjectivesWhenDone: z.boolean().default(true),
    /**
     * Text for the single row left behind when the objectives are hidden.
     * Without it the quest header reads "0/0 completed"; with it the panel
     * shows one ticked line saying the story is over.
     */
    closingObjectiveText: z.string().default(""),
    hackhubPost: HackhubPostSchema.optional(),
    /** Phone-call dialog trees, referenced by name from `comms.call` nodes. */
    dialog: z.array(DialogBranchSchema).default([]),
    /** Keys written by `fx.setData` / `flow.random`, so the inspector can offer them. */
    dataKeys: z.array(z.object({ key: z.string(), type: z.enum(["string", "number", "boolean"]).default("string") })).default([]),
    graph: GraphSchema.default({ nodes: [], edges: [] }),
});
export type QuestDoc = z.infer<typeof QuestSchema>;

/* ── Project ─────────────────────────────────────────────────────────────── */

export const EditorStateSchema = z.object({
    activeQuestId: z.string().nullable().default(null),
    viewports: z.record(z.string(), ViewportSchema).default({}),
});

export const ProjectSchema = z.object({
    schemaVersion: z.number().default(PROJECT_SCHEMA_VERSION),
    kind: z.literal("hackhub-quest-editor/project").default("hackhub-quest-editor/project"),
    mod: ModSchema.default({} as never),
    quests: z.array(QuestSchema).min(1, "a mod needs at least one quest").default([]),
    /** Sites built with the website builder, shared by every quest in the mod. */
    websites: z.array(WebsiteSchema).default([]),
    editor: EditorStateSchema.default({} as never),
});
export type ProjectDocument = z.infer<typeof ProjectSchema>;

/* ── Factories ───────────────────────────────────────────────────────────── */

export function createPage(partial: Partial<WebPageDoc> = {}): WebPageDoc {
    return WebPageSchema.parse({ id: nanoid(10), ...partial });
}

export function createWebsite(partial: Partial<WebsiteDoc> = {}): WebsiteDoc {
    return WebsiteSchema.parse({
        id: nanoid(10),
        pages: [createPage({ path: "/", title: "Home", content: STARTER_PAGE })],
        ...partial,
    });
}

export function createQuest(partial: Partial<QuestDoc> = {}): QuestDoc {
    return QuestSchema.parse({ id: nanoid(10), ...partial });
}

export function createProject(partial: Partial<ProjectDocument> = {}): ProjectDocument {
    const quest = createQuest({ name: "FirstQuest", title: "First Quest" });
    return ProjectSchema.parse({
        mod: {},
        quests: [quest],
        editor: { activeQuestId: quest.id, viewports: {} },
        ...partial,
    });
}
