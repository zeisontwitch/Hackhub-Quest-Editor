/**
 * The analysis layer is what turns "something looks wrong" into "this node, for
 * this reason". If it cries wolf the author learns to ignore the badges; if it
 * stays quiet the exported mod ships a quest the player cannot finish.
 */
import { describe, expect, it } from "vitest";
import { analyseGraph, layeredLayout, summariseIssues } from "@/analysis/graph";
import type { EdgeDoc } from "@/schema/edges";
import { nodeTypeDef } from "@/schema/registry";
import type { NodeDoc, NodeType } from "@/schema/nodes";
import { getTemplate, TEMPLATES } from "@/templates";

let n = 0;
function node(type: NodeType, data: Record<string, unknown> = {}): NodeDoc {
    n += 1;
    return {
        id: `n${n}`,
        type,
        position: { x: 0, y: 0 },
        data: { ...nodeTypeDef(type).create(), ...data },
    } as unknown as NodeDoc;
}

function edge(source: NodeDoc, sourceHandle: string, target: NodeDoc, targetHandle: string): EdgeDoc {
    return {
        id: `${source.id}-${target.id}-${sourceHandle}`,
        source: source.id,
        sourceHandle,
        target: target.id,
        targetHandle,
        kind: nodeTypeDef(source.type).sources.find((h) => h.id === sourceHandle)!.kind,
    };
}

describe("analyseGraph", () => {
    it("reports nothing for a complete, well-wired chain", () => {
        const claim = node("entry.start");
        const notify = node("fx.notify");
        const objective = node("objective");
        const trigger = node("trigger.event");

        const analysis = analyseGraph(
            [claim, notify, objective, trigger],
            [edge(claim, "out", notify, "in"), edge(trigger, "when", objective, "trigger")],
        );

        expect(analysis.issues).toEqual([]);
        expect(summariseIssues(analysis)).toBe("No issues");
    });

    it("flags an objective nothing can ever complete, as blocking", () => {
        const objective = node("objective");
        const analysis = analyseGraph([objective], []);

        const issue = analysis.issues.find((i) => i.nodeId === objective.id);
        expect(issue?.severity).toBe("danger");
        expect(issue?.detail).toMatch(/never finish the quest/i);
    });

    it("accepts an objective completed by a trigger", () => {
        const objective = node("objective");
        const trigger = node("trigger.event");
        const analysis = analyseGraph([objective, trigger], [edge(trigger, "when", objective, "trigger")]);

        expect(analysis.issues.filter((i) => i.severity === "danger")).toEqual([]);
    });

    it("treats objectives and triggers as roots, not orphans", () => {
        // A trigger is a listener on the game itself; nothing wires into it.
        const objective = node("objective");
        const trigger = node("trigger.event");
        const notify = node("fx.notify");

        const analysis = analyseGraph(
            [objective, trigger, notify],
            [edge(trigger, "when", objective, "trigger"), edge(objective, "done", notify, "in")],
        );

        expect(analysis.issues.map((i) => i.label)).not.toContain("Unreachable");
        expect(analysis.reachable.has(notify.id)).toBe(true);
    });

    it("flags a node nothing points at", () => {
        const claim = node("entry.start");
        const stranded = node("fx.notify");
        const analysis = analyseGraph([claim, stranded], []);

        const issue = analysis.issues.find((i) => i.nodeId === stranded.id);
        expect(issue?.label).toBe("Unreachable");
        expect(analysis.reachable.has(stranded.id)).toBe(false);
    });

    it("flags a branch with an outcome that goes nowhere", () => {
        const trigger = node("trigger.event");
        const branch = node("flow.branch");
        const yes = node("fx.notify");

        const analysis = analyseGraph(
            [trigger, branch, yes],
            [edge(trigger, "when", branch, "trigger"), edge(branch, "true", yes, "in")],
        );

        const deadEnd = analysis.issues.find((i) => i.label === "Dead end");
        expect(deadEnd?.detail).toMatch(/“No” outcome goes nowhere/);
    });

    it("flags a manual input with an unwired failure path", () => {
        const claim = node("entry.start");
        const input = node("reply.input");
        const ok = node("fx.notify");

        const analysis = analyseGraph(
            [claim, input, ok],
            [edge(claim, "out", input, "in"), edge(input, "success", ok, "in")],
        );

        const deadEnd = analysis.issues.find((i) => i.label === "Dead end");
        expect(deadEnd?.detail).toMatch(/“Wrong” outcome goes nowhere/);
    });

    it("flags a timer with no time set (r172, renamed r173)", () => {
        const claim = node("entry.start");
        const beat = node("flow.timer", { mode: "after", days: 0, hours: 0, minutes: 0 });
        const after = node("fx.notify");

        const analysis = analyseGraph(
            [claim, beat, after],
            [edge(claim, "out", beat, "in"), edge(beat, "out", after, "in")],
        );

        const issue = analysis.issues.find((i) => i.label === "Nothing scheduled");
        expect(issue?.nodeId).toBe(beat.id);
        expect(issue?.severity).toBe("warn");
    });

    it("flags a timer whose Out goes nowhere (r172, renamed r173)", () => {
        const claim = node("entry.start");
        const beat = node("flow.timer", { mode: "after", minutes: 30 });

        const analysis = analyseGraph([claim, beat], [edge(claim, "out", beat, "in")]);

        const issue = analysis.issues.find((i) => i.label === "The timer has nothing to do");
        expect(issue?.nodeId).toBe(beat.id);
        expect(issue?.severity).toBe("warn");
    });

    it("accepts a timer that has a time and a continuation (r172, renamed r173)", () => {
        const claim = node("entry.start");
        const beat = node("flow.timer", { mode: "after", days: 1, hours: 2, minutes: 30 });
        const after = node("fx.notify");

        const analysis = analyseGraph(
            [claim, beat, after],
            [edge(claim, "out", beat, "in"), edge(beat, "out", after, "in")],
        );

        expect(analysis.issues.filter((i) => i.nodeId === beat.id)).toHaveLength(0);
    });

    it("flags a date-mode timer with no full date (r173)", () => {
        const claim = node("entry.start");
        const timer = node("flow.timer", { mode: "at", dateYear: 2026, dateMonth: 9, dateDay: 0 });

        const analysis = analyseGraph([claim, timer], [edge(claim, "out", timer, "in")]);

        const issue = analysis.issues.find((i) => i.label === "Nothing scheduled");
        expect(issue?.nodeId).toBe(timer.id);
        expect(issue?.detail).toMatch(/No full date is set/);
    });

    it("accepts a daytime timer that only has a clock time (r173)", () => {
        const claim = node("entry.start");
        const timer = node("flow.timer", { mode: "daytime", offsetDays: 3, hour: 12, minute: 0 });
        const after = node("fx.notify");

        const analysis = analyseGraph(
            [claim, timer, after],
            [edge(claim, "out", timer, "in"), edge(timer, "out", after, "in")],
        );

        /* 0 days means today and 00:00 is a legal time — only the in-game
           "now" can decide whether that time has passed; the runtime fails
           open, so the editor stays quiet. */
        expect(analysis.issues.filter((i) => i.nodeId === timer.id)).toHaveLength(0);
    });

    it("counts every Wait unit as a time being set (r177)", () => {
        const claim = node("entry.start");
        /* Only calendar units — no days, hours or minutes at all. */
        const timer = node("flow.timer", { mode: "after", months: 1, weeks: 2 });
        const after = node("fx.notify");

        const analysis = analyseGraph(
            [claim, timer, after],
            [edge(claim, "out", timer, "in"), edge(timer, "out", after, "in")],
        );

        expect(analysis.issues.filter((i) => i.label === "Nothing scheduled")).toHaveLength(0);
    });

    it("does not claim a wrong answer stalls the quest", () => {
        const claim = node("entry.start");
        const input = node("reply.input");
        const ok = node("fx.notify");

        const analysis = analyseGraph(
            [claim, input, ok],
            [edge(claim, "out", input, "in"), edge(input, "success", ok, "in")],
        );

        const deadEnd = analysis.issues.find((i) => i.label === "Dead end");
        expect(deadEnd?.detail).toMatch(/tries again/);
        expect(deadEnd?.detail).not.toMatch(/stalls/);
        expect(deadEnd?.nextStep).toMatch(/retrying/);
    });

    it("flags a wired On quest complete when the graph has no completion node", () => {
        const done = node("entry.complete");
        const pay = node("fx.pay");

        const analysis = analyseGraph([done, pay], [edge(done, "out", pay, "in")]);

        const gated = analysis.issues.find((i) => i.nodeId === done.id);
        expect(gated?.label).toBe("Only runs on completion");
        expect(gated?.severity).toBe("warn");
        expect(gated?.nextStep).toMatch(/Complete quest node/);
    });

    it("accepts On quest complete when the graph contains a Complete quest node", () => {
        const done = node("entry.complete");
        const pay = node("fx.pay");
        const start = node("entry.start");
        const finish = node("fx.completeQuest");

        const analysis = analyseGraph([done, pay, start, finish], [
            edge(done, "out", pay, "in"),
            edge(start, "out", finish, "in"),
        ]);

        expect(analysis.issues.some((i) => i.nodeId === done.id && i.label === "Only runs on completion")).toBe(false);
    });

    it("leaves an unwired On quest complete to the Empty rule", () => {
        const done = node("entry.complete");

        const analysis = analyseGraph([done], []);

        const labels = analysis.issues.filter((i) => i.nodeId === done.id).map((i) => i.label);
        expect(labels).toEqual(["Empty"]);
    });

    it("notes an unused lifecycle entry point without calling it broken", () => {
        const claim = node("entry.start");
        const analysis = analyseGraph([claim], []);

        const empty = analysis.issues.find((i) => i.nodeId === claim.id);
        expect(empty?.label).toBe("Empty");
        expect(empty?.severity).toBe("warn");
    });

    it("never complains about a sticky note", () => {
        const note = node("flow.note", { text: "reminder" });
        expect(analyseGraph([note], []).issues).toEqual([]);
    });

    it("never calls an unwired story beat unreachable", () => {
        // Beats are planning furniture: stripped from the export, so there is
        // nothing broken about one sitting alone waiting to be wired.
        const beat = node("flow.beat", { title: "The Approach" });
        const analysis = analyseGraph([beat], []);
        expect(analysis.issues.filter((i) => i.nodeId === beat.id)).toEqual([]);
    });

    it("still reaches through a wired story beat", () => {
        // Silence must not mean invisibility: flow passes through a beat, so
        // what follows it stays reachable.
        const claim = node("entry.start");
        const beat = node("flow.beat", { title: "The Approach" });
        const notify = node("fx.notify");
        const analysis = analyseGraph(
            [claim, beat, notify],
            [edge(claim, "out", beat, "in"), edge(beat, "out", notify, "in")],
        );
        expect(analysis.issues.filter((i) => i.label === "Unreachable")).toEqual([]);
        expect(analysis.reachable.has(notify.id)).toBe(true);
    });

    it("finds nothing wrong with any shipped quest template", () => {
        for (const template of TEMPLATES.filter((t) => t.difficulty !== "Reference")) {
            for (const quest of template.build().quests) {
                const analysis = analyseGraph(quest.graph.nodes, quest.graph.edges);
                expect(
                    analysis.issues.filter((i) => i.severity === "danger"),
                    `${template.id}: ${JSON.stringify(analysis.issues)}`,
                ).toEqual([]);
            }
        }
    });

    it("gives every issue a concrete next step", () => {
        const claim = node("entry.start");
        const stranded = node("fx.notify");
        const objective = node("objective");
        const branch = node("flow.branch");
        const yes = node("fx.notify");

        const analysis = analyseGraph(
            [claim, stranded, objective, branch, yes],
            [edge(branch, "true", yes, "in")],
        );

        // Unreachable, No trigger, Dead end, Empty — one of each flavour.
        expect(analysis.issues.length).toBeGreaterThanOrEqual(4);
        for (const issue of analysis.issues) {
            expect(issue.nextStep.trim().length, issue.label).toBeGreaterThan(0);
        }
    });

    it("gives every template issue a next step too", () => {
        for (const template of TEMPLATES.filter((t) => t.difficulty !== "Reference")) {
            for (const quest of template.build().quests) {
                const analysis = analyseGraph(quest.graph.nodes, quest.graph.edges);
                for (const issue of analysis.issues) {
                    expect(
                        issue.nextStep.trim().length,
                        `${template.id}: ${issue.label}`,
                    ).toBeGreaterThan(0);
                }
            }
        }
    });

    it("tells the author which nodes to put where for an untriggered objective", () => {
        const objective = node("objective");
        const analysis = analyseGraph([objective], []);

        const issue = analysis.issues.find((i) => i.nodeId === objective.id);
        expect(issue?.nextStep).toMatch(/When event/);
        expect(issue?.nextStep).toMatch(/Trigger/);
    });

    it("names the missing output in a dead-end next step", () => {
        const trigger = node("trigger.event");
        const branch = node("flow.branch");
        const yes = node("fx.notify");

        const analysis = analyseGraph(
            [trigger, branch, yes],
            [edge(trigger, "when", branch, "trigger"), edge(branch, "true", yes, "in")],
        );

        const deadEnd = analysis.issues.find((i) => i.label === "Dead end");
        expect(deadEnd?.nextStep).toMatch(/“No”/);
    });

    it("points an empty Quest start at the briefing mail", () => {
        const claim = node("entry.start");
        const done = node("entry.complete");
        const analysis = analyseGraph([claim, done], []);

        expect(analysis.issues.find((i) => i.nodeId === claim.id)?.nextStep).toMatch(/briefing mail/);
        const completeStep = analysis.issues.find((i) => i.nodeId === done.id)?.nextStep;
        expect(completeStep).toMatch(/On quest complete/);
        expect(completeStep).not.toMatch(/briefing mail/);
    });

    it("points a stranded node at the Quest start chain", () => {
        const claim = node("entry.start");
        const stranded = node("fx.notify");
        const analysis = analyseGraph([claim, stranded], []);

        expect(analysis.issues.find((i) => i.nodeId === stranded.id)?.nextStep).toMatch(/Quest start/);
    });
});

describe("layeredLayout", () => {
    it("puts each node one column to the right of whatever feeds it", () => {
        const claim = node("entry.start");
        const notify = node("fx.notify");
        const pay = node("fx.pay");

        const positions = layeredLayout(
            [claim, notify, pay],
            [edge(claim, "out", notify, "in"), edge(notify, "out", pay, "in")],
        );

        expect(positions[claim.id].x).toBeLessThan(positions[notify.id].x);
        expect(positions[notify.id].x).toBeLessThan(positions[pay.id].x);
    });

    it("stacks parallel branches instead of overlapping them", () => {
        const claim = node("entry.start");
        const a = node("fx.notify");
        const b = node("fx.pay");

        const positions = layeredLayout(
            [claim, a, b],
            [edge(claim, "out", a, "in"), edge(claim, "out", b, "in")],
        );

        expect(positions[a.id].x).toBe(positions[b.id].x);
        expect(positions[a.id].y).not.toBe(positions[b.id].y);
    });

    it("keeps a wired pair side by side instead of scattering it", () => {
        // Authored in an order that disagrees with the wiring: without crossing
        // reduction "pay" would land a row away from the only node feeding it.
        const done = node("entry.complete");
        const claim = node("entry.start");
        const setup = node("fx.notify");
        const pay = node("fx.pay");

        const positions = layeredLayout(
            [done, claim, setup, pay],
            [edge(claim, "out", setup, "in"), edge(done, "out", pay, "in")],
        );

        expect(positions[pay.id].x).toBe(positions[setup.id].x);
        expect(positions[pay.id].y).toBe(positions[done.id].y);
        expect(positions[setup.id].y).toBe(positions[claim.id].y);
    });

    it("is deterministic and never recurses forever on a cycle", () => {
        const a = node("fx.notify");
        const b = node("fx.pay");
        const graph = [edge(a, "out", b, "in"), edge(b, "out", a, "in")];

        const first = layeredLayout([a, b], graph);
        expect(layeredLayout([a, b], graph)).toEqual(first);
        expect(Object.keys(first)).toHaveLength(2);
    });

    it("handles an empty canvas", () => {
        expect(layeredLayout([], [])).toEqual({});
    });

    it("leaves the shipped Help Desk Leak template readable", () => {
        const quest = getTemplate("the-help-desk-leak")!.build().quests[0];
        const positions = layeredLayout(quest.graph.nodes, quest.graph.edges);

        expect(Object.keys(positions)).toHaveLength(quest.graph.nodes.length);

        // Every wired node ends up strictly right of its sources.
        const byId = new Map(quest.graph.nodes.map((nd) => [nd.id, nd]));
        for (const e of quest.graph.edges) {
            if (e.kind !== "flow") continue;
            expect(byId.has(e.source) && byId.has(e.target)).toBe(true);
            expect(positions[e.target].x).toBeGreaterThan(positions[e.source].x);
        }
    });
});
