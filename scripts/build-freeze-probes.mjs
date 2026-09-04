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
    /* Round 2 (r84). D isolated it: with autoComplete off the whole quest ran
       clean and only froze when the player pressed Complete. So the freeze is
       in the engine's own quest-completion path, not in our payload - B and C
       both still froze, clearing the payment node and the closing mail.

       What Nemesis, the known-working mod, does differently at that exact
       point: it declares NO Rewards at all and sets MaxClaim = 1. Our quests
       always set this.Rewards = { money, xp }. Paying the reward is the one
       thing the engine itself does when a quest completes.

       Note probe B removed our fx.pay NODE but left the quest-level Rewards
       untouched, so it never tested this. These do. */

    /* E: no quest-level rewards. If this survives, the engine's reward payout
       is the freeze and the fix is ours to make. */
    E_no_rewards: (p) => {
        p.quests[0].rewards = undefined;
        return p;
    },

    /* F: no rewards AND MaxClaim 1 - Nemesis's exact shape. Distinguishes
       "rewards are the problem" from "an unclaimable quest is the problem". */
    F_nemesis_shape: (p) => {
        p.quests[0].rewards = undefined;
        p.quests[0].maxClaim = 1;
        return p;
    },

    /* G: rewards kept, MaxClaim 1 only. The control for F: if G freezes and F
       does not, rewards are confirmed as the cause rather than maxClaim. */
    G_maxclaim_only: (p) => {
        p.quests[0].maxClaim = 1;
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
