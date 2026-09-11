/**
 * Autosave to localStorage.
 *
 * The project document is the single source of truth, so persistence is a
 * debounced write of that one object. Anything unparseable on load is discarded
 * rather than half-applied — a corrupt draft must never wedge the editor.
 */
import { ProjectSchema, type ProjectDocument } from "@/schema/project";
import { migrateProject } from "@/schema/migrate";
import { PROJECT_SCHEMA_VERSION } from "@/schema/common";
import { useEditor } from "./editor";

/**
 * The draft's storage key. Exported since r141: the settings sheet's "clear
 * the autosaved draft" and its test are the one place outside this module
 * that needs to name it.
 */
export const DRAFT_KEY = "hackhub-quest-editor:draft:v1";
const DEBOUNCE_MS = 600;

export function loadDraft(): ProjectDocument | null {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return null;
        const parsed: unknown = migrateProject(JSON.parse(raw));
        // Sanity-check the envelope *before* schema parsing: every top-level
        // field has a zod default, so an unrelated JSON object would otherwise
        // "validate" as a blank project and silently wipe the user's draft.
        if (
            typeof parsed !== "object" ||
            parsed === null ||
            (parsed as { kind?: unknown }).kind !== "hackhub-quest-editor/project"
        ) {
            console.warn("[quest-editor] discarded a draft with an unknown shape.");
            return null;
        }
        const result = ProjectSchema.safeParse(parsed);
        if (!result.success) {
            console.warn("[quest-editor] discarded an invalid draft:", result.error.issues);
            return null;
        }
        if (result.data.schemaVersion !== PROJECT_SCHEMA_VERSION) {
            console.warn(
                `[quest-editor] draft schema v${result.data.schemaVersion} ≠ current v${PROJECT_SCHEMA_VERSION}; discarded.`,
            );
            return null;
        }
        return result.data;
    } catch (error) {
        console.warn("[quest-editor] could not read draft:", error);
        return null;
    }
}

export function saveDraft(project: ProjectDocument): void {
    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(project));
    } catch (error) {
        // Quota exceeded or storage disabled — the editor keeps working in memory.
        console.warn("[quest-editor] autosave failed:", error);
    }
}

export function clearDraft(): void {
    try {
        localStorage.removeItem(DRAFT_KEY);
    } catch {
        /* nothing to do */
    }
}

/** Hydrate on mount, then persist on every change. Returns a disposer. */
export function startAutosave(): () => void {
    const draft = loadDraft();
    if (draft) {
        useEditor.getState().load(draft, { clearHistory: true });
    }
    useEditor.getState().markHydrated();

    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useEditor.subscribe((state, previous) => {
        if (state.project === previous.project) return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => saveDraft(state.project), DEBOUNCE_MS);
    });

    return () => {
        unsubscribe();
        if (timer) clearTimeout(timer);
        // Flush whatever is pending so a reload right after an edit keeps it.
        saveDraft(useEditor.getState().project);
    };
}
