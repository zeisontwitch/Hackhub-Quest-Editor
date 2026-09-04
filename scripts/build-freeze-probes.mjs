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
    /* Round 3 (r85).

       Eliminated so far, all by in-game test:
         B  fx.pay node removed             -> froze
         C  closing mail removed            -> froze  (but see H)
         D  autoComplete off                -> ran clean, froze on Complete CLICK
         E  no quest Rewards                -> froze
         F  Nemesis shape (no rewards, mc1) -> froze
         G  maxClaim only                   -> froze

       Correction to my own earlier reasoning: I cited Nemesis as proof that
       quest completion works. It is not. Nemesis sets AutoComplete=false AND
       HasCompleteButton=false and never ticks its single objective, so it
       never completes at all. There is therefore NO known-working example of
       a mod quest completing, and "the engine cannot complete a mod quest"
       remains a live hypothesis - that is what J tests.

       The one constant across every freeze: the final objective is triggered
       by Mail.Sent, and the quest completes inside that dispatch. Probe C
       removed our closing mail, but the objective was still completed from
       inside the Mail.Sent handler, so C never tested the dispatch itself. */

    /* H: finish on something OTHER than Mail.Sent. The last objective and its
       Mail.Sent trigger are dropped, so the quest ends on the file download.
       If this survives, completing inside a Mail.Sent dispatch is the bug. */
    H_no_mail_trigger: (p) => {
        const q = p.quests[0];
        const objs = q.graph.nodes.filter((n) => n.type === "objective");
        const last = objs[objs.length - 1];
        const prev = objs[objs.length - 2];
        const trig = q.graph.edges
            .filter((e) => e.kind === "condition" && e.target === last.id)
            .map((e) => q.graph.nodes.find((n) => n.id === e.source))[0];
        const doomed = new Set([last.id, trig && trig.id].filter(Boolean));
        for (const e of q.graph.edges) {
            if (e.source === last.id && e.kind === "flow") e.source = prev.id;
        }
        q.graph.nodes = q.graph.nodes.filter((n) => !doomed.has(n.id));
        q.graph.edges = q.graph.edges.filter(
            (e) => !doomed.has(e.source) && !doomed.has(e.target));
        return p;
    },

    /* I: keep the Mail.Sent objective but strip every story node hanging off
       it - no closing mail, no payment. The quest simply completes there.
       Separates "completing inside Mail.Sent" from "doing work inside it". */
    I_bare_mail_finish: (p) => {
        const q = p.quests[0];
        const objs = q.graph.nodes.filter((n) => n.type === "objective");
        const last = objs[objs.length - 1];
        const doomed = new Set();
        const walk = (id) => {
            for (const e of q.graph.edges) {
                if (e.source === id && e.kind === "flow" && !doomed.has(e.target)) {
                    doomed.add(e.target);
                    walk(e.target);
                }
            }
        };
        walk(last.id);
        q.graph.nodes = q.graph.nodes.filter((n) => !doomed.has(n.id));
        q.graph.edges = q.graph.edges.filter(
            (e) => !doomed.has(e.source) && !doomed.has(e.target));
        return p;
    },

    /* J: the smallest mod quest that can complete - one objective, no
       network, no mail, no reward. Read the contract, quest ends. If THIS
       freezes, the engine cannot complete a mod quest at all, and this file
       is the upstream bug report. */
    J_minimal: (p) => {
        const q = p.quests[0];
        q.rewards = undefined;
        const obj = q.graph.nodes.filter((n) => n.type === "objective")[0];
        const trig = q.graph.edges
            .filter((e) => e.kind === "condition" && e.target === obj.id)
            .map((e) => q.graph.nodes.find((n) => n.id === e.source))[0];
        /* Keep the entry point and the mail that the objective waits on -
           without them the trigger can never fire and the probe is
           unplayable rather than informative. */
        const entry = q.graph.nodes.find((n) => n.type === "entry.start");
        const mail = q.graph.nodes.filter((n) => n.type === "comms.dialogue")[0];
        const keep = new Set([obj.id, trig.id, entry.id, mail.id]);
        q.graph.nodes = q.graph.nodes.filter((n) => keep.has(n.id));
        q.graph.edges = q.graph.edges.filter(
            (e) => keep.has(e.source) && keep.has(e.target));
        /* Wire entry -> mail directly, replacing the chain we removed. */
        q.graph.edges = q.graph.edges.filter(
            (e) => !(e.source === entry.id && e.kind === "flow"));
        q.graph.edges.push({
            id: "edge-j-entry-mail", source: entry.id, sourceHandle: "out",
            target: mail.id, targetHandle: "in", kind: "flow",
        });
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
