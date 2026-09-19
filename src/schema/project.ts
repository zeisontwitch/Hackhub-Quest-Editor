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
import { ExtrasSchema, TranslationsSchema } from "./extras";
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
    /**
     * Short line the in-game search can show under this page's result, like
     * the snippet under a web result. Optional; left out of the export when
     * unset so pages that don't use it compile exactly as before.
     */
    description: z.string().optional(),
    /**
     * Extra words the in-game search can match this page by, besides what is
     * written on it. Optional; left out of the export when empty.
     */
    search: z.array(z.string()).optional(),
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
    /**
     * `WebsiteDefinition.popular` in the SDK — declared, purpose unverified.
     * docs/03 Q12: our self-test is two identical sites, one flagged, compare
     * search ranking in-game. Emitted only when set, so sites that don't use
     * it compile exactly as before.
     */
    popular: z.boolean().optional(),
    pages: z.array(WebPageSchema).default([]),
});
export type WebsiteDoc = z.infer<typeof WebsiteSchema>;

/* ── Twotter accounts (r185) ───────────────────────────────────────────────
   A character on the in-game social network, authored once for the whole mod
   and usable by every quest in it — the same shape as `websites` below, and for
   the same reason: an account is world-building rather than a beat of one
   story. The Tweet node (`comms.tweet`) posts from one of these.

   Two SDK facts shape the fields:

   1. Every record the runtime creates is COMPLETE. `Twotter.createUser()`
      fills the platform fields the editor cannot express (name, surname,
      banner, joinedAt, password); we hand it `bio` as a string even when the
      author left it blank, because a record stored with `bio: undefined` is
      the exact shape that crashed the game's Twotter search for seven QA
      rounds (r31).
   2. The declarative `TwotterAccounts` quest field is never emitted — the
      engine fills that one incompletely. Accounts are authored through the
      API in the runtime instead.
   ─────────────────────────────────────────────────────────────────────── */

/*
 * Re-exported so the editor (inspector, migration, tests) keeps importing it
 * from the schema they already have in hand; the definition lives in a leaf
 * module because the compiler needs it without the template HTML that this
 * file drags in. See `src/schema/twotter.ts`.
 */
export { TWOTTER_HANDLE_PATTERN } from "./twotter";

export const TwotterAccountSchema = z.object({
    id: z.string(),
    /** Without the `@` — the editor shows the `@`. */
    handle: z.string().default(""),
    displayName: z.string().default(""),
    /** Always written as a string; a blank bio is `""`, never `undefined`. */
    bio: z.string().default(""),
    avatar: z.string().optional(),
    banner: z.string().optional(),
    verified: z.boolean().default(false),
    followers: z.number().default(0),
    following: z.number().default(0),
    /**
     * Remove this account when the last quest that needs it ends. Off for a
     * character who should outlive the story (the trade-off is written on the
     * field: the account then stays in the player's save).
     */
    removeWhenQuestEnds: z.boolean().default(true),
});
export type TwotterAccountDoc = z.infer<typeof TwotterAccountSchema>;

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
     * Defaults to false so authors decide when a quest should finish. Use the
     * Complete quest node for a deliberate story ending, or turn this on when
     * all objectives alone are enough.
     */
    autoComplete: z.boolean().default(false),
    questsToComplete: z.array(z.string()).default([]),
    maxClaim: z.number().optional(),
    maxClaimPerDay: z.number().optional(),
    abandonable: z.boolean().default(true),
    hasCompleteButton: z.boolean().default(false),
    /**
     * Hide every objective from the quest panel once they have all been
     * completed. Kept as a legacy cleanup option for quests that intentionally
     * stay active instead of using the Complete quest node.
     */
    hideObjectivesWhenDone: z.boolean().default(true),
    /**
     * Text for the single row left behind when the objectives are hidden.
     * Without it the quest header reads "0/0 completed"; with it the panel
     * shows one ticked line saying the story is over.
     */
    closingObjectiveText: z.string().default(""),
    hackhubPost: HackhubPostSchema.optional(),
    /** Phone-call dialog trees, referenced by name from phone `comms.dialogue` nodes. */
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

export const ProjectSchema = z
    .object({
        schemaVersion: z.number().default(PROJECT_SCHEMA_VERSION),
        kind: z.literal("hackhub-quest-editor/project").default("hackhub-quest-editor/project"),
        mod: ModSchema.default({} as never),
        quests: z.array(QuestSchema).min(1, "a mod needs at least one quest").default([]),
        /** Sites built with the website builder, shared by every quest in the mod. */
        websites: z.array(WebsiteSchema).default([]),
        /** Twotter characters, shared by every quest in the mod (r185). */
        twotterAccounts: z.array(TwotterAccountSchema).default([]),
        /** Start-menu items, desktop widgets and right-click items (r203). */
        extras: ExtrasSchema.default({} as never),
        /** Translations for `{{tr.…}}` tokens (r203). */
        translations: TranslationsSchema.default({} as never),
        editor: EditorStateSchema.default({} as never),
    })
    /* Every valid project ships at least one quest (`.min(1)` above), so a parse
       that points the editor at no quest — or at one that is not in the file —
       can only come from a hand-written file, a build older than `activeQuestId`,
       or a project whose active quest was deleted. Point it at the first quest
       that actually ships. Without this the editor opens on "No quest
       selected.", the canvas is empty, and the first-run "browse templates"
       hint appears on top — indistinguishable from a broken file, which is
       exactly how a QA round was lost (2026-09-18, S-12/S-15). Living in the
       schema rather than at each call site is deliberate: file load, import,
       the autosaved draft, template construction and the QA export generator
       all parse through here, and a repair that can be forgotten is the bug
       again. */
    .transform((project) => {
        if (project.quests.some((q) => q.id === project.editor.activeQuestId)) return project;
        return { ...project, editor: { ...project.editor, activeQuestId: project.quests[0]!.id } };
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

export function createTwotterAccount(partial: Partial<TwotterAccountDoc> = {}): TwotterAccountDoc {
    return TwotterAccountSchema.parse({
        id: nanoid(10),
        handle: "new_character",
        displayName: "New character",
        bio: "",
        followers: 12,
        following: 8,
        ...partial,
    });
}

export function createQuest(partial: Partial<QuestDoc> = {}): QuestDoc {
    return QuestSchema.parse({ id: nanoid(10), ...partial });
}

export function createProject(partial: Partial<ProjectDocument> = {}): ProjectDocument {
    const quest = createQuest({ name: "FirstQuest", title: "First Quest" });
    /* A multi-quest caller replaces the quests array wholesale — the default
       quest (and its id in activeQuestId) is gone. `ProjectSchema`'s transform
       already points the editor at the first quest that ships, so multi-quest
       projects open on their first act rather than a quest that does not exist
       (and templates stay byte-deterministic across builds). */
    return ProjectSchema.parse({
        mod: {},
        quests: [quest],
        editor: { activeQuestId: quest.id, viewports: {} },
        ...partial,
    });
}
