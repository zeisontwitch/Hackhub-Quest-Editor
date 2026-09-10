/**
 * The Quest Simulator's dry run: compile → evaluate the emitted mod.js →
 * walk the lifecycle → probe every trigger with a payload shaped the way its
 * conditions expect. The negative case is the point: a sabotaged condition
 * must come back no-match, or the probe proves nothing.
 */
import { describe, expect, it } from "vitest";
import { simulateProject } from "@/compiler/simulate";
import { getTemplate, TEMPLATES } from "@/templates";
import { nodeTypeDef } from "@/schema/registry";
import type { ProjectDocument } from "@/schema/project";
import type { NodeDoc } from "@/schema/nodes";
import type { EdgeDoc } from "@/schema/edges";

/** Every template dry-runs clean: the emitted code registers, starts and
 *  settles without throwing, whatever else the report says. */
describe("simulateProject", () => {
    it.each(TEMPLATES)("%s: dry-runs without errors", async (template) => {
        const report = await simulateProject(template.build());
        expect(report.errors).toEqual([]);
        for (const q of report.quests) expect(q.errors).toEqual([]);
    });

    it("every template's trigger objectives would tick against a probe payload", async () => {
        let exercised = 0;
        for (const template of TEMPLATES) {
            const report = await simulateProject(template.build());
            const waiting = report.quests.flatMap((q) =>
                q.objectives.filter((o) => o.route === "trigger" && o.probe !== "internal"),
            );
            for (const o of waiting) {
                expect(o.probe, `${template.id}: ${o.name} (${o.event}) → ${o.probeNote ?? ""}`).toBe("match");
            }
            exercised += waiting.length;
        }
        expect(exercised, "the template set should exercise external event triggers at all").toBeGreaterThan(0);
    }, 30000); /* the sweep simulates every template; the registry outgrew the default 5s */

    it("dry-runs the Harbour Manifest end to end", async () => {
        const report = await simulateProject(getTemplate("data-grab")!.build());
        const text = report.trace.map((t) => t.text).join("\n");
        // The story's first minute: the world is built, the brief arrives,
        // the recon answers are placed.
        expect(text).toContain("Network created");
        expect(text).toContain("Mail sent");
        expect(text).toContain("Tool answer placed: whois");
        // The story ticked objectives as it ran (the runtime completes an
        // objective when the flow reaches it, even a trigger-wired one).
        expect(text).toContain("Objective completed: read-brief");
    });

    it("reports no-match when a condition reads a field the event does not carry", async () => {
        const project: ProjectDocument = getTemplate("data-grab")!.build();
        // Sabotage: the whois trigger reads "dom" instead of "domain" — the
        // exact misspelling class that has silently killed quests in QA.
        const quest = project.quests[0];
        const trigger = quest.graph.nodes.find(
            (n) => n.type === "trigger.event" && (n.data as { event: string }).event === "Terminal.Whois",
        )!;
        (trigger.data as { conditions: { field: string; op: string; value: string }[] }).conditions[0].field = "dom";
        (trigger.data as { conditions: { field: string; op: string; value: string }[] }).conditions[0].value =
            "harbourline-logistics.com";

        const report = await simulateProject(project);
        const whois = report.quests[0].objectives.find((o) => o.event === "Terminal.Whois")!;
        expect(whois.probe).toBe("no-match");
        expect(whois.probeNote).toBeTruthy();
    });

    it("a reroute fan-out fires every branch, deep-first in wire order", async () => {
        // The reroute has no runtime case of its own: next() follows all flow
        // wires through __QE.seq — serially, only waiting when a branch really
        // is async. Pin the consequence: a Wait in wire 1 completes (the sim
        // collapses the wait itself) before wire 2 fires. That order is the
        // in-game behaviour too — a pause in an early wire delays later wires.
        const mk = (type: Parameters<typeof nodeTypeDef>[0], patch: Record<string, unknown>, id: string) =>
            ({ id, type, position: { x: 0, y: 0 }, data: { ...(nodeTypeDef(type).create() as object), ...patch } }) as NodeDoc;
        const entry = mk("entry.start", {}, "e");
        const reroute = mk("flow.reroute", {}, "r");
        const delay = mk("flow.delay", { seconds: 30 }, "d");
        const notifyLate = mk("fx.notify", { message: "LATER-BRANCH" }, "nl");
        const notifyNow = mk("fx.notify", { message: "NOW-BRANCH" }, "nn");
        const e = (s: NodeDoc, t: NodeDoc): EdgeDoc =>
            ({ id: `e${s.id}-${t.id}`, source: s.id, sourceHandle: "out", target: t.id, targetHandle: "in", kind: "flow" });
        const project: ProjectDocument = getTemplate("blank")!.build();
        project.quests[0].autoStart = true;
        project.quests[0].graph.nodes = [entry, reroute, delay, notifyLate, notifyNow];
        project.quests[0].graph.edges = [e(entry, reroute), e(reroute, delay), e(delay, notifyLate), e(reroute, notifyNow)];

        const report = await simulateProject(project);
        expect(report.errors).toEqual([]);
        const lines = report.quests[0].trace.map((t) => t.text).join("\n");
        expect(lines).toContain("LATER-BRANCH");
        expect(lines).toContain("NOW-BRANCH");
        expect(lines.indexOf("LATER-BRANCH")).toBeLessThan(lines.indexOf("NOW-BRANCH"));
    });

    it("blanks stay blank: an empty quest simulates to an empty report", async () => {
        const report = await simulateProject(getTemplate("blank")!.build());
        expect(report.errors).toEqual([]);
        expect(report.quests[0].objectives).toEqual([]);
        expect(report.quests[0].trace).toEqual([]);
    });
});
