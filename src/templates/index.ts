/**
 * Starter templates.
 *
 * Each is a plain `ProjectDocument` factory, which means the templates are
 * themselves exercised by the compiler test suite (docs/01 §5). Ids are generated
 * deterministically so a template builds byte-identically every time and snapshot
 * tests stay stable.
 *
 * This file is just the registry. The shared graph-building helpers live in
 * `kit.ts`, and each template lives in its own module so a template can grow
 * past the write-size limit that appending to a single file kept hitting.
 */
import type { Template } from "@/templates/kit";
import { buildBlank } from "@/templates/blank";
import { buildFirstContact } from "@/templates/firstContact";
import { buildByline } from "@/templates/byline";
import { buildColdCall } from "@/templates/coldCall";
import { buildDataGrab } from "@/templates/harbourManifest";
import { buildHelpDeskLeak } from "@/templates/helpDeskLeak";
import { buildBadAttachment } from "@/templates/badAttachment";
import { buildSixTries } from "@/templates/sixTries";
import { buildColdStorage } from "@/templates/coldStorage";
import { buildContractHack } from "@/templates/ledgerContract";
import { buildReference } from "@/templates/reference";
import { buildCookbook } from "@/templates/cookbook";
import { buildLongGame } from "@/templates/longGame";

export { type Template } from "@/templates/kit";

export const TEMPLATES: Template[] = [
    {
        id: "blank",
        name: "Blank quest",
        description: "The lifecycle entry points that can actually run, and an explanatory note. Start from scratch.",
        difficulty: "Beginner",
        nodeCount: 4,
        build: buildBlank,
    },
    {
        id: "first-contact",
        name: "First Contact",
        description:
            "The whole spine in miniature: a brief, one objective (a person lookup), a payment and a closing line. No hacking — just the shape of a quest.",
        difficulty: "Beginner",
        nodeCount: 8,
        build: buildFirstContact,
    },
    {
        id: "the-byline",
        name: "The Byline",
        description:
            "A website clue in plain sight: read an article, spot the byline, and look the writer up. No break-in, nothing hidden.",
        difficulty: "Beginner",
        nodeCount: 11,
        build: buildByline,
    },
    {
        id: "cold-call",
        name: "Cold Call",
        description:
            "A story told in conversation: a contact messages you on Kisscord, a hint surfaces on WeeChat, and the quest closes on a typed answer.",
        difficulty: "Beginner",
        nodeCount: 10,
        build: buildColdCall,
    },
    {
        id: "data-grab",
        name: "The Harbour Manifest",
        description:
            "The job the game hands out constantly: a name in an e-mail, an OSINT lookup, whois, a scan, one exploit on port 22, and a file the client wants a copy of. One admin account on the server, so no password cracking — the short route, start to finish.",
        difficulty: "Advanced",
        nodeCount: 22,
        build: buildDataGrab,
    },
    {
        id: "the-help-desk-leak",
        name: "The Help Desk Leak",
        description:
            "A public agency site, a portal that refuses you, and an unlisted page dirhunter can find. The password is assembled from two pages the agency published itself — the classic web-recon loop, with a real website in the box.",
        difficulty: "Advanced",
        nodeCount: 23,
        build: buildHelpDeskLeak,
    },
    {
        id: "bad-attachment",
        name: "Bad Attachment",
        description:
            "A phishing trip with no break-in: write a convincing lure, send it (Mail.Sent), and the target's reply lands in your inbox and is read (Mail.Read) carrying a credential a client will pay for. All mail, no shell — the words are the weapon.",
        difficulty: "Advanced",
        nodeCount: 14,
        build: buildBadAttachment,
    },
    {
        id: "six-tries",
        name: "Six Tries",
        description:
            "The official quests' favourite route, and the step no other template teaches: hydra. Recon finds the box, hydra cracks the login, an objective reads the cracked credential out of Terminal.Hydra, and ssh -h walks it in. Scan, crack, connect, read, report.",
        difficulty: "Advanced",
        nodeCount: 23,
        build: buildSixTries,
    },
    {
        id: "cold-storage",
        name: "Cold Storage",
        description:
            "The long route into one company: scan the box, recover the edge passphrase, land a session on the storage server, and read the ledger straight out of the database. Every objective waits on a real game event the runtime actually emits.",
        difficulty: "Expert",
        nodeCount: 20,
        build: buildColdStorage,
    },
    {
        id: "contract-hack",
        name: "The Ledger Contract",
        description:
            "A file on one man's personal PC, and everything between: OSINT, whois, a scan, mapping the network behind the router, an exploit that lands you as guest, cracking his password out of /etc/passwd, and a client who checks before she pays.",
        difficulty: "Expert",
        nodeCount: 33,
        build: buildContractHack,
    },
    {
        id: "long-game",
        name: "The Long Game",
        description:
            "A three-act campaign in one mod: a public trail (act I) earns the break-in (act II), and act III ends in a typed verdict with two different endings. Teaches the 'Claim another quest' chain, per-act stages, and the choice shape.",
        difficulty: "Expert",
        nodeCount: 36,
        build: buildLongGame,
    },
    {
        id: "reference",
        name: "Node Reference",
        description:
            "Every node type an author can build on one canvas, filled with example input. Open it to see what a field expects before you build your own.",
        difficulty: "Reference",
        nodeCount: 42,
        build: buildReference,
    },
    {
        id: "cookbook",
        name: "Quest Cookbook",
        description:
            "How the quests the game itself ships with are built, technique by technique — and which nodes express each one here. Read-only reference sheet; the companion to the Node Reference.",
        difficulty: "Reference",
        nodeCount: 16,
        build: buildCookbook,
    },
];

export function getTemplate(id: string): Template | undefined {
    return TEMPLATES.find((t) => t.id === id);
}
