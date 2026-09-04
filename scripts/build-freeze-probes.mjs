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
    /* Round 4 (r86). J FROZE.

       J was one objective, no network, no rewards, nothing in the handler:
       start -> contract mail -> read it -> quest completes. Our OnComplete ran
       to the end ("finished, handing back to the game") and the renderer still
       died. Combined with D (autoComplete off, froze only on the Complete
       click), both completion paths - automatic and manual - kill the game.

       Conclusion: HackHub 1.1.2 cannot complete a mod-defined quest. J is the
       minimal reproduction. Nemesis, the only known-good mod, never completes
       (AutoComplete=false, HasCompleteButton=false, its one objective never
       ticks) - which is consistent with the authors having hit this too.

       K tests the only workaround available to us: a quest that never formally
       completes. Objectives still tick, the story still ends, but the engine
       is never asked to finish the quest. */

    /* K: J plus Nemesis's exact never-complete shape. If this survives, we
       ship it as the default for every generated quest. */
    K_never_completes: (p) => {
        const q = p.quests[0];
        q.rewards = undefined;
        q.autoComplete = false;
        q.hasCompleteButton = false;
        const obj = q.graph.nodes.filter((n) => n.type === "objective")[0];
        const trig = q.graph.edges
            .filter((e) => e.kind === "condition" && e.target === obj.id)
            .map((e) => q.graph.nodes.find((n) => n.id === e.source))[0];
        const entry = q.graph.nodes.find((n) => n.type === "entry.start");
        const mail = q.graph.nodes.filter((n) => n.type === "comms.dialogue")[0];
        const keep = new Set([obj.id, trig.id, entry.id, mail.id]);
        q.graph.nodes = q.graph.nodes.filter((n) => keep.has(n.id));
        q.graph.edges = q.graph.edges.filter(
            (e) => keep.has(e.source) && keep.has(e.target));
        q.graph.edges = q.graph.edges.filter(
            (e) => !(e.source === entry.id && e.kind === "flow"));
        q.graph.edges.push({
            id: "edge-k-entry-mail", source: entry.id, sourceHandle: "out",
            target: mail.id, targetHandle: "in", kind: "flow",
        });
        return p;
    },

    /* L: the full Harbour quest, never completing. Confirms the workaround
       holds for a real quest with a network, an exploit and a closing mail -
       not just the toy case. */
    L_harbour_never_completes: (p) => {
        p.quests[0].autoComplete = false;
        p.quests[0].hasCompleteButton = false;
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
