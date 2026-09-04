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
    /* A: baseline. Same as v14, renamed. Confirms the probe harness itself
       reproduces the freeze - without this, a "pass" below proves nothing. */
    A_baseline: (p) => p,

    /* B: no payment. Bank.transaction is the one call that moves real player
       state at completion, and it runs microseconds before the freeze. */
    B_no_payment: (p) => {
        const q = p.quests[0];
        const pay = q.graph.nodes.find((n) => n.type === "fx.pay");
        q.graph.nodes = q.graph.nodes.filter((n) => n !== pay);
        q.graph.edges = q.graph.edges.filter((e) => e.source !== pay.id && e.target !== pay.id);
        return p;
    },

    /* C: no closing mail. Sending mail from inside the engine's own Mail.Sent
       dispatch is the reentrancy r82 only half-addressed: the ordering is
       fixed, but the send still happens inside that dispatch. */
    C_no_closing_mail: (p) => {
        const q = p.quests[0];
        const last = q.graph.nodes.filter((n) => n.type === "comms.dialogue").pop();
        q.graph.nodes = q.graph.nodes.filter((n) => n !== last);
        q.graph.edges = q.graph.edges.filter((e) => e.source !== last.id && e.target !== last.id);
        return p;
    },

    /* D: autoComplete off. Then the engine finishes the quest on its own
       schedule rather than synchronously inside our handler. If only this one
       survives, the fault is the engine's completion path, not our payload. */
    D_no_autocomplete: (p) => {
        p.quests[0].autoComplete = false;
        p.quests[0].hasCompleteButton = true;
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
