/**
 * Quest Cookbook — Reference.
 *
 * A read-only sheet, the same idea as the Node Reference: nothing here is a
 * quest to play, it is a canvas of technique cards. Each card maps something
 * the game's own (official) quests do to the nodes that express it here —
 * and says plainly where a mod simply cannot follow (SMS, Twotter, the
 * credential-harvester dropdown), with the substitute to use instead.
 *
 * Source: Zeis's transcriptions of the official quests
 * (reference/Official-Quest/) and the cross-check in
 * docs/plans/r127-official-quest-comparison.md.
 *
 * r127 originally proposed this as a page in `handbookArticles.ts` — wrong
 * surface: that catalogue is the in-game Handbook's jump targets
 * (`Handbook.open(id)`), not editor guidance. The cookbook is canvas
 * furniture instead, which is what the Node Reference already was.
 */
import { createQuest, createProject, type ProjectDocument } from "@/schema/project";
import { makeNode, resetIds } from "@/templates/kit";

export function buildCookbook(): ProjectDocument {
    resetIds();
    const quest = createQuest({
        id: "q-cookbook",
        name: "QuestCookbook",
        title: "Quest Cookbook",
        autoStart: true,
        description:
            "How the official quests do it — and which nodes build the same beat here. A reference sheet, not a quest to play.",
        group: "sandbox",
        rewards: { money: 0, xp: 0 },
        employer: { firstName: "The", lastName: "Editor", email: "" },
    });

    /* Two columns, six rows — spacing keeps every card clear of its
       neighbours (240×120 is the generous card box the layout test uses). */
    const CARD = (col: 0 | 1, row: number) => ({ x: col * 420, y: row * 220 });

    const intro = makeNode("flow.note", CARD(0, 0), {
        text: [
            "QUEST COOKBOOK",
            "",
            "How the quests the game ships with are built — and how you build the same beat here. One card per technique.",
            "",
            "Companions: the Node Reference (what every node's fields do) and the Six Tries template (the crack-and-log-in route, built for real).",
        ].join("\n"),
        width: 340,
    });

    const briefs = makeNode("flow.note", CARD(1, 0), {
        text: [
            "The brief — mail or text message",
            "",
            "Official quests open with a mail (FTP job, Cryptographer Hunt) or a text/SMS (Annoying Neighbor). Mods have no SMS channel, so a text beat becomes a Kisscord conversation — same shape, different app.",
            "",
            "Build it: comms.dialogue (mail, Kisscord or WeeChat). A timed chat can even land on a Sequence beat.",
        ].join("\n"),
        width: 340,
    });

    const social = makeNode("flow.note", CARD(0, 1), {
        text: [
            "Social media clue",
            "",
            "The game leans on Twotter (Cyber Justice, Cryptographer Hunt). Mods cannot: quest-declared Twotter accounts once corrupted player saves, and the editor dropped the channel on purpose.",
            "",
            "Build it instead: put the clue on a website (The Byline) or in a Kisscord chat. lynx still finds people, mails and IPs — that half ports one to one.",
        ].join("\n"),
        width: 340,
    });

    const phishing = makeNode("flow.note", CARD(1, 1), {
        text: [
            "Phishing",
            "",
            "The game's compose window has a credential-harvester dropdown — engine UI no mod can author. The moddable route: your lure goes out by mail, and the VICTIM'S REPLY carries the credential, watched by Mail.Read on its content.",
            "",
            "Bad Attachment is the whole pattern, start to paid finish.",
        ].join("\n"),
        width: 340,
    });

    const cracking = makeNode("flow.note", CARD(0, 2), {
        text: [
            "Password cracking (hydra)",
            "",
            "School Grades, Annoying Neighbor: hydra -T ip:port -P wordlist.lst, then log in with what it found.",
            "",
            "Build it: a 'hydra' tool response keyed by user + target, an objective waiting on Terminal.Hydra (it only carries credentials when the crack worked), then ssh -h. Six Tries is this route, built for real.",
        ].join("\n"),
        width: 340,
    });

    const ftp = makeNode("flow.note", CARD(1, 2), {
        text: [
            "The FTP job",
            "",
            "The simplest official quest: ftp -h ip -u user -p pass, ls, cd, cat, mail the contents back.",
            "",
            "Build it: a machine whose port list includes ftp, an 'ftp' tool response keyed user + target, objectives on Terminal.FTP.Connect and Terminal.Cat, and Mail.Sent to close it. That is the Harbour Manifest with ftp instead of a shell.",
        ].join("\n"),
        width: 340,
    });

    const metasploit = makeNode("flow.note", CARD(0, 3), {
        text: [
            "Metasploit on an old service",
            "",
            "Steal Exam Questions, Cold Storage: nmap -sV shows a version; msf needs it exactly, three numbers (OpenSSH 6.4.0, never 7.2), matching the banner.",
            "",
            "Build it: put the version on the port, and let an objective wait on Metasploit.Meterpreter.Connected. The Harbour Manifest walks the whole thing.",
        ].join("\n"),
        width: 340,
    });

    const mapping = makeNode("flow.note", CARD(1, 3), {
        text: [
            "Mapping a network",
            "",
            "The game's net_tree.py is engine-side. Notice the official quest barely trusts it either: right after mapping, it whois-es every host to find the right one.",
            "",
            "Build it: that whois walk IS your map — a 'whois' tool response per host, or a clue that names the machine. Routers and hidden machines: the Ledger Contract.",
        ].join("\n"),
        width: 340,
    });

    const database = makeNode("flow.note", CARD(0, 4), {
        text: [
            "The Database-Manager edit",
            "",
            "School Grades ends the moment the player edits one cell in the game's Database Manager app — an engine app a mod cannot open or automate.",
            "",
            "Build it: Database.DataUpdate is a declared event your trigger can watch (confirm it fires for your table in-game first). The proven fallback is the sqlmap route — Cold Storage reads a database that way.",
        ].join("\n"),
        width: 340,
    });

    const tracks = makeNode("flow.note", CARD(1, 4), {
        text: [
            "Covering tracks",
            "",
            "Official quests let the player delete their own log lines — and notice when the logs are gone entirely. Both halves are the engine's: it writes the connection log, and its own viewer does the wiping.",
            "",
            "No node exists or is needed. Seed a plausible sys.log on the machine (the Harbour Manifest does) and let the game append to it.",
        ].join("\n"),
        width: 340,
    });

    const endings = makeNode("flow.note", CARD(0, 5), {
        text: [
            "Endings",
            "",
            "Official quests auto-complete on the final action. A mod quest on today's build ends its story without formally completing — so end from your LAST OBJECTIVE and always leave a closing line (that is why every template does it).",
            "",
            "Bank transfers (Cryptographer Hunt) can be watched with Bank.Transfer. A shutdown ending can wait on Terminal.SSH.Shutdown — verify it in-game on your own machine first.",
        ].join("\n"),
        width: 340,
    });

    const handoff = makeNode("flow.note", CARD(1, 5), {
        text: [
            "Hand-offs",
            "",
            "Getting the loot to whoever wants it: the game uses chat file drops and GUI downloads. Mods watch TWO events for a pulled file — Terminal.SSH.FileDownload and Files.Transfer cover different paths, and a quest that listens to only one strands players.",
            "",
            "Or skip the file: mail the CONTENT (Mail.Sent), the way the FTP job and Six Tries end.",
        ].join("\n"),
        width: 340,
    });

    quest.graph = {
        nodes: [intro, briefs, social, phishing, cracking, ftp, metasploit, mapping, database, tracks, endings, handoff],
        edges: [],
    };

    return createProject({
        mod: {
            id: "quest-cookbook",
            name: "Quest Cookbook",
            version: "1.0.0",
            author: "",
            description: quest.description,
            tags: ["reference", "cookbook", "techniques"],
            dependencies: [],
            minSdkVersion: "0.21.0",
            apiVersion: 1,
        },
        quests: [quest],
        editor: { activeQuestId: quest.id, viewports: {} },
    });
}
