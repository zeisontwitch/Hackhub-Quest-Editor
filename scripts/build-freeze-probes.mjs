/*
 * r83 freeze probe.
 *
 * Four rounds of theories have each been falsified in-game:
 *   r79 unhandled destroyNetwork rejection  -> still froze
 *   r81 destroyNetwork at all               -> network left standing, still froze
 *   r82 re-entrancy from completeObjective  -> ordering fixed, still froze
 *
 * The v14 log now shows EVERY line of ours printing, in the right order,
 * including "OnComplete: finished, handing back to the game". So the freeze is
 * in something the engine does at quest completion, triggered by one of the
 * last things we hand it. Rather than guess a fourth time, this builds one mod
 * per suspect with that suspect REMOVED. Whichever build does not freeze names
 * the culprit.
 *
 * Usage: npx vite-node scripts/build-freeze-probes.mjs
 * Output: /tmp/probes/<name>.zip
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { getTemplate } from "../src/templates/index.ts";
import { compileProject } from "../src/compiler/compile.ts";
import { buildModZip } from "../src/editor/shell/ExportDialog.tsx";

const OUT = "/tmp/probes";
mkdirSync(OUT, { recursive: true });

/** Deep clone so each probe starts from a pristine template. */
const fresh = () => JSON.parse(JSON.stringify(getTemplate("data-grab").build()));

function nameIt(p, suffix) {
    const q = p.quests[0];
    p.name = `Harbour ${suffix}`;
    p.id = `harbour-${suffix.toLowerCase()}`;
    p.version = "1.0.0";
    q.name = `Harbour${suffix}`;
    q.title = `Contract: Harbour ${suffix}`;
    return p;
}

const probes = {
    /* Round 5 (r87). K survived: a quest that never completes does not crash.

       Zeis's question: can we at least clear the OBJECTIVES from the panel,
       even if the quest entry itself is stuck?

       The SDK has no removeObjective/hideObjective call - grepping the whole
       2,898-line d.ts for "objective" returns only the definition shape,
       completeObjective(), and OnObjectivesStart. But
       QuestObjectiveDefinition has `hidden?: boolean`, and we already mutate
       the live Objectives array the engine holds: refillObjectives() rewrites
       description/hint/terminalCommand at OnStart, and r73 confirmed in-game
       that the panel picks those edits up (it fixed raw {{data.targetIp}}
       showing in the quest panel).

       So the open question is narrow and empirical: does flipping `hidden` to
       true AFTER the panel has rendered actually remove the row? The engine
       may only read `hidden` once when it builds the list. Only a real run
       can tell us. */

    /* M: full Harbour, never completing, and every objective flips to
       hidden:true once the last one is done. If the panel empties, we can
       give authors a clean ending despite the engine bug. */
    M_hide_objectives_at_end: (p) => {
        const q = p.quests[0];
        q.autoComplete = false;
        q.hasCompleteButton = false;
        q.hideObjectivesWhenDone = true;   // consumed by the runtime (r87)
        return p;
    },
};




for (const [name, mutate] of Object.entries(probes)) {
    const project = nameIt(mutate(fresh()), name.replace(/_/g, ""));
    const result = compileProject(project);
    if (result.errors?.length) {
        console.error(`${name}: COMPILE ERRORS`, result.errors);
        continue;
    }
    const zip = await buildModZip(result, project.id);
    const buf = await zip.generateAsync({ type: "nodebuffer" });
    writeFileSync(`${OUT}/${name}.zip`, buf);
    console.log(`${name.padEnd(20)} -> ${OUT}/${name}.zip (${(buf.length / 1024).toFixed(0)} kB)`);
}
