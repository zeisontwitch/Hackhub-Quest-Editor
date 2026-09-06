/**
 * Editor-only furniture is stripped from the exported mod, and group frames
 * become a comment block near the top.
 *
 * `flow.note`, `layout.group` and `flow.beat` are canvas furniture / planning
 * aids: they never reach the story the game runs. A Story Beat is wireable, so
 * removing it must splice its edges (A→beat→B becomes A→B) rather than dangle
 * them. Group frames carry an author's own structure, which we emit as a
 * comment so a reader without our editor can still follow the layout.
 */
import { describe, expect, it } from "vitest";
import { createProject, createQuest } from "@/schema/project";
import { makeEdge, makeNode } from "@/templates/kit";
import { compileProject } from "@/compiler/compile";

function modJsOf(options: { withGroup?: boolean; withBeat?: boolean; withNote?: boolean }): string {
    const quest = createQuest({
        id: "q-furniture",
        name: "FurnitureTest",
        closingObjectiveText: "done",
        title: "Furniture Test",
        autoStart: true,
        description: "compile-time furniture",
        rewards: { money: 0, xp: 0 },
    });
    const claim = makeNode("entry.start", { x: 0, y: 0 });
    const pay = makeNode("fx.pay", { x: 200, y: 0 }, { amount: 100 });

    const nodes = [claim, pay];
    const edges = [makeEdge(claim, "out", pay, "in")];

    if (options.withBeat) {
        const beat = makeNode("flow.beat", { x: 100, y: 0 }, { title: "Beat 1", text: "plan", choices: [{ id: "c1", label: "go" }] });
        nodes.splice(1, 0, beat);
        edges.length = 0;
        edges.push(makeEdge(claim, "out", beat, "in"), makeEdge(beat, "out", pay, "in"));
    }
    if (options.withGroup) {
        nodes.push(makeNode("layout.group", { x: 300, y: 0 }, { label: "Act 1", comment: "recon the box" }));
    }
    if (options.withNote) {
        nodes.push(makeNode("flow.note", { x: 400, y: 0 }, { text: "remember the copy" }));
    }

    quest.graph = { nodes, edges };
    const project = createProject({
        mod: { id: "furniture-mod", name: "Furniture", version: "1.0.0", author: "", description: "furniture", tags: [], dependencies: [], minSdkVersion: "0.21.0", apiVersion: 1 },
        quests: [quest],
        websites: [],
    });
    const compiled = compileProject(project);
    return compiled.files.find((f) => f.path === "dist/mod.js")!.content;
}

describe("editor-only furniture is stripped from the export", () => {
    it("drops notes, groups and story beats from the exported graph", () => {
        const js = modJsOf({ withBeat: true, withGroup: true, withNote: true });
        expect(js).not.toContain('"flow.beat"');
        expect(js).not.toContain('"layout.group"');
        expect(js).not.toContain('"flow.note"');
    });

    it("splices a beat's wires so the flow still connects", () => {
        const js = modJsOf({ withBeat: true });
        // The beat was the only wire between claim and pay; after stripping it
        // the two must be joined directly (a bypass edge is created).
        expect(js).toContain("bypass-");
        // The beat's content is gone too.
        expect(js).not.toContain("Beat 1");
        expect(js).not.toContain('"choices"');
    });

    it("splices a beat that fans out through its branch-choice sockets", () => {
        const quest = createQuest({
            id: "q-fan",
            name: "FanOut",
            closingObjectiveText: "done",
            title: "Fan Out",
            autoStart: true,
            description: "fan out",
            rewards: { money: 0, xp: 0 },
        });
        const claim = makeNode("entry.start", { x: 0, y: 0 });
        const beat = makeNode(
            "flow.beat",
            { x: 100, y: 0 },
            {
                title: "Plan",
                text: "branch plan",
                choices: [
                    { id: "c1", label: "left" },
                    { id: "c2", label: "right" },
                ],
            },
        );
        const left = makeNode("fx.pay", { x: 200, y: 0 }, { amount: 1 });
        const right = makeNode("fx.pay", { x: 200, y: 100 }, { amount: 2 });
        quest.graph = {
            nodes: [claim, beat, left, right],
            edges: [
                // Two distinct downstream branches, wired through the beat.
                makeEdge(claim, "out", beat, "in"),
                makeEdge(beat, "choice-c1", left, "in"),
                makeEdge(beat, "choice-c2", right, "in"),
            ],
        };
        const project = createProject({
            mod: { id: "fan-mod", name: "Fan", version: "1.0.0", author: "", description: "fan", tags: [], dependencies: [], minSdkVersion: "0.21.0", apiVersion: 1 },
            quests: [quest],
            websites: [],
        });
        const js = compileProject(project).files.find((f) => f.path === "dist/mod.js")!.content;
        // The beat is stripped; both branches upstream of it are reconnected to
        // the single incoming source. No chord to the beat survives.
        expect(js).not.toContain('"flow.beat"');
        expect(js).not.toContain('"choice-c1"');
        expect(js).not.toContain('"choice-c2"');
        expect((js.match(/bypass-/g) ?? []).length).toBeGreaterThanOrEqual(2);
    });

    it("emits a group as a comment block near the top of the mod", () => {
        const js = modJsOf({ withGroup: true });
        expect(js).toContain("planning notes");
        expect(js).toContain("Act 1");
        expect(js).toContain("recon the box");
    });

    it("emits no comment block when there are no groups", () => {
        const js = modJsOf({ withNote: true });
        expect(js).not.toContain("planning notes");
    });

    it("does not break a comment that contains the comment terminator", () => {
        const quest = createQuest({
            id: "q-escape",
            name: "Escape",
            closingObjectiveText: "done",
            title: "Escape",
            autoStart: true,
            description: "escape comment",
            rewards: { money: 0, xp: 0 },
        });
        const claim = makeNode("entry.start", { x: 0, y: 0 });
        const pay = makeNode("fx.pay", { x: 200, y: 0 }, { amount: 1 });
        quest.graph = {
            nodes: [claim, pay, makeNode("layout.group", { x: 100, y: 0 }, { label: "A", comment: "contains */ and /* here" })],
            edges: [makeEdge(claim, "out", pay, "in")],
        };
        const project = createProject({
            mod: { id: "escape-mod", name: "Escape", version: "1.0.0", author: "", description: "escape", tags: [], dependencies: [], minSdkVersion: "0.21.0", apiVersion: 1 },
            quests: [quest],
            websites: [],
        });
        const js = compileProject(project).files.find((f) => f.path === "dist/mod.js")!.content;
        // The terminator inside the comment is neutralised so it cannot close
        // the block early and break the JS.
        expect(js).toContain("* /");
        expect(js).toContain("*/");
    });
});
