/**
 * The Quest Simulator's dry run: compile → evaluate the emitted mod.js →
 * walk the lifecycle → probe every trigger with a payload shaped the way its
 * conditions expect. The negative case is the point: a sabotaged condition
 * must come back no-match, or the probe proves nothing.
 */
import { describe, expect, it } from "vitest";
import { simulateProject } from "@/compiler/simulate";
import { getTemplate, TEMPLATES } from "@/templates";
import type { ProjectDocument } from "@/schema/project";

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
    });

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

    it("blanks stay blank: an empty quest simulates to an empty report", async () => {
        const report = await simulateProject(getTemplate("blank")!.build());
        expect(report.errors).toEqual([]);
        expect(report.quests[0].objectives).toEqual([]);
        expect(report.quests[0].trace).toEqual([]);
    });
});
