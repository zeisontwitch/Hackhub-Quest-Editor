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
    /* Round 6 (r88). M worked: full quest, no freeze, and the objective rows
       disappeared. The one blemish QA saw was the header reading
       "0/0 completed", because the counter counts visible rows and we had
       hidden all of them.

       Fix: keep the LAST row visible and rewrite it into a closing line, so
       the panel reads "1/1 completed" with a single ticked item. This is now
       the default for every generated quest (autoComplete false,
       hasCompleteButton false, hideObjectivesWhenDone true, plus a closing
       line per template).

       N is the confirmation run: the stock Harbour template, straight from
       the editor's own defaults, with nothing overridden. */
    N_shipping_default: (p) => p,
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
