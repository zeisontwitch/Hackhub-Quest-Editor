/**
 * The installable QA export must be exactly what the editor compiles today.
 *
 * r175. `reference/sdk-0.24-qa/editor-export/` was produced by hand in r166 and
 * then drifted in silence: r172/r173 added `QESdk024TimerQa` to the QA project,
 * the folder kept claiming to hold one quest, and no gate read it — the same
 * failure the manual's search index had (r174). The folder is an artifact a
 * person installs into the game, so a stale one is worse than none.
 *
 * These gates compile the committed project and compare every byte, so any
 * project change that is not followed by `npm run gen:qa-export` fails here.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import { compileProject } from "../compile";
import { parseProjectFile } from "@/templates/share";
import { useEditor } from "@/store/editor";

const QA_DIR = join(process.cwd(), "reference", "sdk-0.24-qa");
const EXPORT_DIR = join(QA_DIR, "editor-export");
const PROJECT_FILE = join(QA_DIR, "projects", "sdk-0.24-ingame-qa.project.json");
const NOTES_FILE = join(QA_DIR, "editor-export.notes.md");

/**
 * What `scripts/build-qa-export.mjs` writes. Keep the two in step: `src/index.ts`
 * needs the `@ts-nocheck` pragma because tsconfig.json typechecks `reference/`,
 * and the README carries the hand-written notes so the installed folder explains
 * itself.
 */
function expectedExportFiles(): Map<string, string> {
    const parsed = parseProjectFile(readFileSync(PROJECT_FILE, "utf8"));
    if (!parsed.ok) throw new Error(`${PROJECT_FILE} does not parse: ${parsed.error}`);
    const files = new Map(compileProject(parsed.project).files.map((f) => [f.path, f.content]));
    files.set("src/index.ts", "// @ts-nocheck\n" + files.get("src/index.ts"));
    files.set("README.md", files.get("README.md") + readFileSync(NOTES_FILE, "utf8"));
    return files;
}

/**
 * The first pixel of a PNG data URI, as `[r, g, b]` — how the QA fixture's
 * colours are asserted without depending on how an encoder spells its base64.
 * Reads the IDAT chunk directly; the fixture images are solid single colours, so
 * the first pixel is the whole picture.
 */
function profilePicPixel(dataUri: string | undefined): number[] | null {
    if (!dataUri) return null;
    const raw = Buffer.from(dataUri.split(",", 1)[0] === dataUri ? "" : dataUri.slice(dataUri.indexOf(",") + 1), "base64");
    let pos = 8;
    while (pos + 8 <= raw.length) {
        const length = raw.readUInt32BE(pos);
        const tag = raw.subarray(pos + 4, pos + 8).toString("latin1");
        if (tag === "IDAT") {
            const inflated = inflateSync(raw.subarray(pos + 8, pos + 8 + length));
            return [inflated[1]!, inflated[2]!, inflated[3]!];
        }
        pos += 12 + length;
    }
    return null;
}

function existingFiles(dir: string, out: string[] = []): string[] {
    if (!existsSync(dir)) return out;
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) existingFiles(full, out);
        else out.push(relative(EXPORT_DIR, full).split("\\").join("/"));
    }
    return out;
}

describe("SDK 0.24 QA export", () => {
    it("matches the compiler, byte for byte", () => {
        const expected = expectedExportFiles();
        const wrong = [...expected]
            .filter(([path, content]) => {
                const full = join(EXPORT_DIR, path);
                return !existsSync(full) || readFileSync(full, "utf8") !== content;
            })
            .map(([path]) => path);
        expect(
            wrong,
            `reference/sdk-0.24-qa/editor-export disagrees with the compiler:\n  ` +
                `${wrong.join("\n  ")}\n  Run \`npm run gen:qa-export\` (never edit the export by hand).`,
        ).toEqual([]);
    });

    it("holds nothing the compiler does not emit", () => {
        const expected = expectedExportFiles();
        const extra = existingFiles(EXPORT_DIR).filter((path) => !expected.has(path));
        expect(
            extra,
            `${extra.length} file(s) sit in the export that the compiler does not emit:\n  ` +
                `${extra.join("\n  ")}\n  Run \`npm run gen:qa-export\` to prune them.`,
        ).toEqual([]);
    });

    it("ships every QA quest the checklist tells a tester to run", () => {
        const mod = readFileSync(join(EXPORT_DIR, "dist", "mod.js"), "utf8");
        /* One per checklist section: the r166 surface, the delay rows
           (S-01…S-03), the calendar rows (S-05…S-07, S-13) and the Wait-in-
           months rows (S-09, S-14). A quest renamed or dropped here leaves the
           in-game checklist pointing at nothing, which is exactly how the
           S-rows went missing once already (r180). */
        for (const quest of [
            "QESdk024EditorQa",
            "QESdk024TimerQa",
            "QESdk024TimerCalQa",
            "QESdk024WaitMonthQa",
            "QESdk024TwotterQa",
            "QESdk024TwotterShareQa",
            "QESdk024TwotterPostEventQa",
        ]) {
            expect(mod, `${quest} is not in the shipped export`).toContain(`"${quest}"`);
        }
    });

    it("cannot become a notification storm again", () => {
        /* Zeis, after running the Timer rows: "a bit of a mess" - five quests
           auto-started at load, four of them with toasting debug nodes, so the
           journal could not be read and a toast could not be counted. Both
           properties live in this file, so both are asserted here. */
        const doc = JSON.parse(readFileSync(PROJECT_FILE, "utf8")) as {
            quests: { name: string; autoStart: boolean; graph: { nodes: { id: string; type: string; data: Record<string, unknown> }[] } }[];
        };
        const autoStarted = doc.quests.filter((q) => q.autoStart).map((q) => q.name);
        expect(autoStarted, "these QA quests start by themselves again").toEqual([]);
        const toasting = doc.quests.flatMap((q) =>
            q.graph.nodes
                .filter((n) => n.type === "flow.debug" && n.data.toast === true)
                .map((n) => `${q.name}/${n.id}`),
        );
        expect(toasting, "these QA nodes pop a toast at load again").toEqual([]);
        /* Every quest is reachable from the launcher, or it is unreachable. */
        const launcher = readFileSync(join(QA_DIR, "mod", "dist", "mod.js"), "utf8");
        for (const quest of doc.quests) {
            expect(launcher, `${quest.name} is not in the qe24 run launcher`).toContain(`name: "${quest.name}"`);
        }
    });

    it("keeps the fixtures the Twotter rows (T-08…T-13) tell a tester to open", () => {
        /* T-08…T-13 read the editor's own Twotter node in the game, so the QA
           project has to keep: a mod-level account with a face and counts, one
           series of five backdated tweets (including the picture), a second
           quest on the SAME account (T-12), and the two event triggers the
           tracker rows read. Any of these going quiet turns a row into a hunt
           for a bug that is really a missing fixture. */
        const parsed = parseProjectFile(readFileSync(PROJECT_FILE, "utf8"));
        expect(parsed.ok, parsed.ok ? "" : parsed.error).toBe(true);
        if (!parsed.ok) return;
        const project = parsed.project;

        const account = project.twotterAccounts.find((a) => a.handle === "qe24_editor");
        expect(account, "the T-08 account is gone").toBeDefined();
        expect(account?.followers).toBe(412);
        expect(account?.following).toBe(96);
        expect(typeof account?.bio, "a bio must be a string, never undefined").toBe("string");
        expect(account?.bio?.length ?? 0).toBeGreaterThan(10);
        expect(account?.avatar, "T-08 asks about the authored avatar").toMatch(/^data:image\/png;base64,/);
        expect(account?.banner, "T-08 asks about the authored banner").toMatch(/^data:image\/png;base64,/);

        const tw1 = project.quests.find((q) => q.name === "QESdk024TwotterQa");
        const tw2 = project.quests.find((q) => q.name === "QESdk024TwotterShareQa");
        expect(tw1, "the T-08…T-13 quest is gone").toBeDefined();
        expect(tw2, "the T-12 shared-account quest is gone").toBeDefined();

        const tweetNodes = (q: typeof tw1) => q?.graph.nodes.filter((n) => n.type === "comms.tweet") ?? [];
        const series = tweetNodes(tw1)[0]?.data as { accountId?: string; tweets?: Record<string, unknown>[] } | undefined;
        const shared = tweetNodes(tw2)[0]?.data as { accountId?: string } | undefined;
        expect(series?.accountId, "the series lost its account").toBe(account?.id);
        expect(shared?.accountId, "T-12 needs both quests on ONE account").toBe(account?.id);

        const rows = series?.tweets ?? [];
        expect(rows).toHaveLength(5);
        const earlier = rows.filter((r) => r.timeMode === "earlier");
        expect(earlier.map((r) => `${r.agoAmount}${r.agoUnit}`)).toEqual(["1years", "3months", "6weeks", "12days"]);
        expect(rows.filter((r) => r.timeMode === "arrival"), "one row must post as the player watches").toHaveLength(1);
        /* No picture rows any more: the editor hides the field (r187) because
           the game cannot show a tweet picture, so a fixture that still asked a
           tester to look for one would be testing a control that is gone. */
        expect(rows.filter((r) => r.image), "a picture row is back in the fixture").toEqual([]);
        /* The banner and avatar are deliberately loud colours (#AA28FF violet,
           amber avatar) after the first run could not tell whether the banner
           had rendered at all. Decoded rather than string-matched: the claim is
           the colour, and the base64 of a PNG moves if the encoder does. */
        expect(profilePicPixel(account?.banner), "the banner is no longer the unmistakable violet").toEqual([0xaa, 0x28, 0xff]);
        expect(profilePicPixel(account?.avatar), "the avatar is no longer the unmistakable amber").toEqual([0xff, 0x8a, 0x00]);
        expect(rows.some((r) => r.showInTimeline === true), "one row must reach the main timeline").toBe(true);

        /* The triggers: ProfileSeen identifies the account by handle, PostSeen
           by the id the runtime creates the record with. */
        const trigger = (q: typeof tw1, event: string) =>
            q?.graph.nodes.find((n) => n.type === "trigger.event" && (n.data as { event?: string }).event === event);
        const conditions = (q: typeof tw1, event: string) =>
            ((trigger(q, event)?.data as { conditions?: { field?: string; value?: unknown }[] } | undefined)?.conditions ?? []);
        expect(conditions(tw1, "Twotter.ProfileSeen")).toEqual([
            expect.objectContaining({ field: "username", value: "qe24_editor" }),
        ]);
        expect(conditions(tw1, "Twotter.PostSeen")).toEqual([
            expect.objectContaining({ field: "userId", value: account?.id }),
        ]);
        for (const event of ["Twotter.ProfileSeen", "Twotter.PostSeen"]) {
            const wired = tw1?.graph.edges.some((e) => e.source === trigger(tw1, event)?.id && e.kind === "condition");
            expect(wired, `${event} is not wired to an objective`).toBe(true);
        }

        /* The T-13 canary is its own quest since r186, and it is deliberately
           NOT part of the quest a tester has to finish: the game shows the
           Complete button only when every objective is done, so an
           always-unchecked row in T-11's quest made that row's own button
           unreachable (r185 run). */
        const tw3 = project.quests.find((q) => q.name === "QESdk024TwotterPostEventQa");
        expect(tw3, "the T-13 canary quest is gone").toBeDefined();
        const canaryTrigger = tw3?.graph.nodes.find(
            (n) => n.type === "trigger.event" && (n.data as { event?: string }).event === "Twotter.Post",
        );
        expect(canaryTrigger, "Twotter.Post is no longer watched anywhere").toBeDefined();
        expect(trigger(tw1, "Twotter.Post"), "the canary must not block the finishable quest").toBeUndefined();
        expect(tw1?.graph.nodes.some((n) => n.type === "objective" && n.data.hidden === false)).toBe(true);
        for (const q of [tw1, tw2, tw3]) {
            const wired = q?.graph.edges.some((e) => e.source === canaryTrigger?.id && e.kind === "condition");
            if (q === tw3) expect(wired, "the canary objective is not wired").toBe(true);
        }
    });

    it("keeps the r30 Twotter fixture the migration row (T-14) opens", () => {
        /* T-14 asks a person to open an old draft and check nothing was lost.
           The fixture is the r30 shape: quest-level accounts, one node per
           tweet, four different time spellings. If the fixture or the migration
           moves, the row must fail here first. */
        const parsed = parseProjectFile(
            readFileSync(join(QA_DIR, "projects", "fixture-r30-twotter.project.json"), "utf8"),
        );
        expect(parsed.ok, parsed.ok ? "" : parsed.error).toBe(true);
        if (!parsed.ok) return;
        const project = parsed.project;

        /* Two quests declared the same handle under different ids; one account
           must come out, and both quests' nodes must point at it. */
        expect(project.twotterAccounts.map((a) => a.handle)).toEqual(["legacy_smith"]);
        const lifted = project.twotterAccounts[0];
        expect(typeof lifted.bio).toBe("string");
        const accountsUsed = project.quests.flatMap((q) =>
            q.graph.nodes.filter((n) => n.type === "comms.tweet").map((n) => (n.data as { accountId: string }).accountId),
        );
        expect(new Set(accountsUsed)).toEqual(new Set([lifted.id]));

        const nodes = project.quests[0]!.graph.nodes.filter((n) => n.type === "comms.tweet");
        expect(nodes, "the r31 exile must not delete these nodes").toHaveLength(4);
        const rows = nodes.map((n) => (n.data as { tweets: Record<string, unknown>[] }).tweets[0]!);
        expect(rows.map((r) => [r.timeMode, r.agoAmount, r.agoUnit])).toEqual([
            ["earlier", 2, "days"],
            ["earlier", 1, "months"],
            ["arrival", 2, "days"],
            ["earlier", 1, "months"],
        ]);
        expect(nodes[1]!.data).toMatchObject({ migratedDate: true });
        expect(nodes[3]!.data).toMatchObject({ migratedDate: true });
        expect(nodes[0]!.data).not.toMatchObject({ migratedDate: true });
        expect(nodes[0]!.data).toMatchObject({ tweets: [expect.objectContaining({ content: expect.stringContaining("manifest was sealed") })] });
    });

    it("keeps the legacy fixtures the migration rows tell a tester to open", () => {
        /* S-12 and S-15 ask a person to open an old draft in the editor and
           check the boxes show the same numbers. Those drafts are files in the
           project folder, so they are guarded here: a fixture that stopped
           parsing (or stopped migrating the way the checklist says) would send
           the tester looking for a bug in the editor instead of in the file. */
        const fixtures: [string, Record<string, unknown>, string][] = [
            /* pre-r176: the delay fields, mode implied. */
            ["fixture-pre-r176-after.project.json", { mode: "after", hours: 2 }, "Wait 2 hours"],
            /* r176 window: an amount plus a unit must land in the unit's box. */
            [
                "fixture-r176-coming-day.project.json",
                { mode: "daytime", offsetWeeks: 2, hour: 18, minute: 23 },
                "2 weeks at 18:23",
            ],
        ];
        for (const [file, want, label] of fixtures) {
            const parsed = parseProjectFile(
                readFileSync(join(QA_DIR, "projects", file), "utf8"),
            );
            expect(parsed.ok, `${file} no longer parses: ${parsed.ok ? "" : parsed.error}`).toBe(true);
            if (!parsed.ok) continue;
            const node = parsed.project.quests[0].graph.nodes.find((n) => n.type === "flow.timer");
            expect(node, `${file} has no Timer node`).toBeDefined();
            const data = (node?.data ?? {}) as Record<string, unknown>;
            for (const [key, value] of Object.entries(want)) {
                expect(data[key], `${file}: ${key} (${label})`).toBe(value);
            }
        }
    });

    it("opens the fixtures on their quest, not on an empty canvas", () => {
        /* S-12/S-15, 2026-09-18: the tester opened both fixtures in the editor
           and reported them broken — "No quest selected", an empty canvas and
           the first-run template hint, because neither file carries
           `editor.activeQuestId` (they are old, hand-written shapes) and the
           editor used to take that literally. `ProjectSchema` now points the
           editor at the first quest that ships, so the row is a look at the
           boxes rather than a puzzle. This asserts the whole chain the editor
           runs: parse the file → load it into the store → a quest is active. */
        for (const file of [
            "fixture-pre-r176-after.project.json",
            "fixture-r176-coming-day.project.json",
        ]) {
            const parsed = parseProjectFile(readFileSync(join(QA_DIR, "projects", file), "utf8"));
            expect(parsed.ok, `${file} no longer parses`).toBe(true);
            if (!parsed.ok) continue;
            expect(parsed.project.editor.activeQuestId, `${file} opened on no quest`).toBe(
                parsed.project.quests[0].id,
            );
            useEditor.getState().load(parsed.project, { clearHistory: true });
            const active = useEditor.getState().project.editor.activeQuestId;
            expect(active, `${file} lost its active quest in the store`).toBe(parsed.project.quests[0].id);
            expect(
                useEditor.getState().project.quests.find((q) => q.id === active)?.graph.nodes.length,
                `${file} left the canvas empty`,
            ).toBeGreaterThan(0);
        }
    });

    it("arms the calendar rows the way the checklist describes", () => {
        /* Parsed, not string-matched: an earlier draft asserted the file merely
           *contained* `"mode": "daytime"`, which stayed true after the mixed
           row was turned into a plain Wait — the other daytime node satisfied
           it. Pin each row's own node data instead. */
        const doc = JSON.parse(readFileSync(PROJECT_FILE, "utf8")) as {
            quests: { name: string; graph: { nodes: { id: string; type: string; data: Record<string, unknown> }[] } }[];
        };
        const timers = doc.quests
            .filter((q) => q.name.startsWith("QESdk024"))
            .flatMap((q) => q.graph.nodes.filter((n) => n.type === "flow.timer").map((n) => n.data));
        const has = (want: Record<string, unknown>) =>
            timers.some((d) => Object.entries(want).every(([k, v]) => d[k] === v));

        /* S-06: an exact date already past — must fail open and fire at once. */
        expect(has({ mode: "at", dateYear: 2020, dateMonth: 1, dateDay: 1 }), "no past-date row").toBe(true);
        /* S-05: a coming day whose clock time is already past today. */
        expect(has({ mode: "daytime", offsetDays: 0, hour: 0, minute: 0 }), "no 'already past today' row").toBe(true);
        /* S-13: the mixed calendar offset, which can only resolve through
           scheduleAt, at a pinned clock time. */
        expect(
            has({ mode: "daytime", offsetMonths: 1, offsetWeeks: 2, offsetDays: 2, hour: 18, minute: 23 }),
            "no mixed 1 month 2 weeks 2 days row",
        ).toBe(true);
        /* S-14: Wait in months — no duration field for months, so also scheduleAt. */
        expect(has({ mode: "after", months: 1 }), "no Wait-in-months row").toBe(true);
        /* And the two runtime paths those rows depend on are in the export. */
        const mod = readFileSync(join(EXPORT_DIR, "dist", "mod.js"), "utf8");
        expect(mod).toContain("scheduleAt");
        expect(mod).toContain("addOffset");
    });
});
