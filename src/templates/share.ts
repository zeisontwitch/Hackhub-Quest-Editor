/**
 * Sharing projects as files.
 *
 * Lets authors exchange work-in-progress quests for feedback, or keep their own
 * templates. The file is the whole `ProjectDocument`, so an import round-trips
 * losslessly — it is exactly what the editor edits and autosaves.
 *
 * Parsing is strict: an imported file is validated against `ProjectSchema` and
 * rejected with a readable reason rather than half-loaded, mirroring the autosave
 * rule that a bad document must never wedge the editor.
 */
import { ProjectSchema, type ProjectDocument } from "@/schema/project";
import { migrateProject } from "@/schema/migrate";

export function projectFileName(project: ProjectDocument): string {
    const id = (project.mod.id || "quest").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
    return `${id}.quest-editor.json`;
}

export function serializeProject(project: ProjectDocument): string {
    return JSON.stringify(project, null, 2);
}

export type ParseResult =
    | { ok: true; project: ProjectDocument }
    | { ok: false; error: string };

export function parseProjectFile(text: string): ParseResult {
    let raw: unknown;
    try {
        raw = JSON.parse(text);
    } catch {
        return { ok: false, error: "That file isn't valid JSON." };
    }
    /* Older files first: the same migrations the autosaved draft gets. Without
       this, a project saved before a node type changed (or was removed, as
       Twotter was) fails validation and the author is told their own file is
       not a quest project. */
    const result = ProjectSchema.safeParse(migrateProject(raw));
    if (!result.success) {
        const first = result.error.issues[0];
        const where = first?.path?.join(".") || "document";
        return { ok: false, error: `Not a quest project — problem at “${where}”.` };
    }
    return { ok: true, project: result.data };
}

/** Trigger a browser download of the project. Returns the file name used. */
export function downloadProject(project: ProjectDocument): string {
    const name = projectFileName(project);
    const blob = new Blob([serializeProject(project)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return name;
}
