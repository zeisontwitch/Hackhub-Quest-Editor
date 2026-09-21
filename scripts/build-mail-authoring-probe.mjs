/**
 * r211 playtest probe: builds the mail-authoring QA quest with the same kit
 * the templates use, compiles it to prove it ships clean, and prints the
 * quest JSON to splice into `sdk-0.24-ingame-qa.project.json`.
 *
 * The probe exercises exactly what r211 changed:
 *   - a replyable mail sent DIRECT (M-04: the Reply button draws);
 *   - a Mail.Sent trigger on `to` contains <the mail's From> (M-05/M-06:
 *     the only way to match a reply);
 *   - a withdrawOnQuestEnd mail next to a keep-me control (M-02/M-03/M-07:
 *     removal by id at quest end, persistence via the save).
 *
 * Run: node scripts/build-mail-authoring-probe.mjs > /tmp/probe-quest.json
 */
import { createServer } from "vite";

const server = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "error",
});
try {
    const { createQuest } = await server.ssrLoadModule("/src/schema/project");
    const kit = await server.ssrLoadModule("/src/templates/kit");
    const { compileProject } = await server.ssrLoadModule("/src/compiler/compile");
    const { createProject } = await server.ssrLoadModule("/src/schema/project");

    const { resetIds, makeNode, makeEdge, triggerFor } = kit;

    resetIds();
    const quest = createQuest({
        id: "q-mail-authoring-qa",
        name: "QESdk024MailAuthoringQa",
        title: "Mail authoring probe",
        description:
            "Three mails arrive. One stays, one vanishes when the quest ends, one takes a reply. Proves the r211 authoring paths in game.",
        group: "side",
        /* Not autoStart — the export guard forbids self-starting QA quests
           (the notification-storm incident). The quest is claimed on purpose
           from its Hackhub feed post, which also makes the run's start time
           the tester's choice. */
        hackhubPost: {
            content:
                "QA probe (r211): three mails, one reply. Accept to run the mail-authoring probe.",
            comments: [],
        },
        closingObjectiveText: "Reply sent — now check which mails survived.",
    });

    const claim = makeNode("entry.start", { x: 0, y: 0 });

    const keep = makeNode("comms.dialogue", { x: 320, y: 0 }, {
        kind: "mail",
        mail: {
            from: "qa-authoring@qe24.test",
            subject: "QE24 authoring: keep me",
            content:
                "This one is the control. It has no flags at all.\n\n" +
                "When the quest ends it should still be here, and after a save and reload it should STILL be here.",
            replyable: false,
            withdrawOnQuestEnd: false,
        },
    });

    const withdraw = makeNode("comms.dialogue", { x: 640, y: 0 }, {
        kind: "mail",
        mail: {
            from: "qa-authoring@qe24.test",
            subject: "QE24 authoring: withdraw me",
            content:
                "This one carries the new withdraw flag.\n\n" +
                "When the quest completes it should disappear from the inbox — and stay gone after a save and reload.",
            replyable: false,
            withdrawOnQuestEnd: true,
        },
    });

    const reply = makeNode("comms.dialogue", { x: 960, y: 0 }, {
        kind: "mail",
        mail: {
            from: "qa-reply@qe24.test",
            subject: "QE24 authoring: reply to me",
            content:
                "This one is replyable — it should show a Reply button.\n\n" +
                "Reply with anything. The quest's objective ticks when your reply goes out, which proves the recipe: a reply is matchable by who it is addressed TO — this mail's From address.",
            replyable: true,
            withdrawOnQuestEnd: false,
        },
    });

    const oReply = makeNode("objective", { x: 1280, y: 220 }, {
        name: "send-a-reply",
        description: "Reply to “QE24 authoring: reply to me” with anything",
        hint: "The Reply button is under the mail in GoMail. Any text works — the objective matches where the reply goes, not what it says.",
    });
    const tReply = triggerFor(
        oReply,
        "Mail.Sent",
        [{ field: "to", op: "contains", value: "qa-reply@qe24.test" }],
        { x: 1280, y: 380 },
    );

    const note = makeNode("flow.note", { x: 320, y: 520 }, {
        text: [
            "r211 playtest probe (2026-09-20).",
            "",
            "keep me: control — no flags. withdraw me: withdrawOnQuestEnd. reply to me: replyable, and the",
            "objective's trigger matches Mail.Sent where to contains qa-reply@qe24.test.",
            "",
            "Green is: three mails arrive, the Reply button only on the third, the objective ticks on a reply,",
            "the second mail leaves at Complete (and stays gone after a reload), the other two stay.",
        ].join("\n"),
        width: 340,
    });

    quest.graph = {
        nodes: [claim, keep, withdraw, reply, oReply, tReply.trigger, note],
        edges: [
            makeEdge(claim, "out", keep, "in"),
            makeEdge(keep, "out", withdraw, "in"),
            makeEdge(withdraw, "out", reply, "in"),
            makeEdge(reply, "out", oReply, "in"),
            tReply.edge,
        ],
    };
    kit.applyLayout(quest);

    /* Prove it compiles clean before it goes anywhere near the project file. */
    const result = compileProject(createProject({
        mod: {
            id: "mail-authoring-probe-check",
            name: "probe check",
            version: "0.0.0",
            author: "",
            description: "",
            tags: [],
            dependencies: [],
            minSdkVersion: "0.21.0",
            apiVersion: 1,
        },
        quests: [quest],
        websites: [],
        twotterAccounts: [],
    }));
    const errs = result.warnings.filter((w) => String(w).includes("error"));
    console.error(`compiled: ${result.files.length} file(s), ${result.warnings.length} warning(s)`);
    for (const w of result.warnings) console.error(`  warning: ${w}`);
    const mod = result.files.find((f) => f.path === "dist/mod.js").content;
    for (const [what, needle] of [
        ["replyable goes out direct", "direct.replyable = true"],
        ["withdraw armed with the id", "will be withdrawn when the quest ends"],
        ["drain removes mails", 'item.kind === "mail"'],
    ]) {
        if (!mod.includes(needle)) throw new Error(`compiled mod lacks: ${what} (${needle})`);
    }
    console.error("mod pins: all three r211 paths present");

    process.stdout.write(JSON.stringify(quest, null, 2) + "\n");
} finally {
    await server.close();
}
