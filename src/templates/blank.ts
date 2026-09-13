import { createQuest, createProject } from "@/schema/project";
import { makeNode, resetIds } from "@/templates/kit";
import type { ProjectDocument } from "@/schema/project";

export function buildBlank(): ProjectDocument {
    resetIds();
    const quest = createQuest({ id: "q-blank", name: "NewQuest", title: "New Quest", autoStart: true });
    const claim = makeNode("entry.start", { x: 0, y: 0 });
    const load = makeNode("entry.load", { x: 0, y: 150 });
    /* No entry.complete: with auto-complete off and no Complete button (the
       default) it never fires. It stays in the palette for quests that turn
       completion on. */
    const abandon = makeNode("entry.abandon", { x: 0, y: 450 });
    const note = makeNode("flow.note", { x: 300, y: 0 }, {
        text: "Each node on the left is an independent starting point.\n\nDrag from the palette onto the canvas, then pull from a coloured dot on the right of one node to a dot on the left of another.\n\nDelete this note when you are done reading it.",
        width: 300,
    });
    quest.graph = { nodes: [claim, load, abandon, note], edges: [] };
    return createProject({ quests: [quest], editor: { activeQuestId: quest.id, viewports: {} } });
}
