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
import { buildHelloHack, buildWifiHack, buildInvestigation, buildDirhunter } from "@/templates/legacy";
import { buildDataGrab } from "@/templates/harbourManifest";
import { buildContractHack } from "@/templates/ledgerContract";
import { buildReference } from "@/templates/reference";

export type { Template } from "@/templates/kit";

export const TEMPLATES: Template[] = [
    {
        id: "blank",
        name: "Blank quest",
        description: "The four lifecycle entry points and an explanatory note. Start from scratch.",
        difficulty: "Beginner",
        nodeCount: 5,
        build: buildBlank,
    },
    {
        id: "hello-hack",
        name: "Hello Hack",
        description: "One objective completed by a single nmap scan, then a payout.",
        difficulty: "Beginner",
        nodeCount: 6,
        build: buildHelloHack,
    },
    {
        id: "wifi-hack",
        name: "Simple Linear Wi-Fi Hack",
        description:
            "Briefing e-mail, a crackable access point, bettercap recon, fern passphrase recovery and joining the network — all in a straight line.",
        difficulty: "Beginner",
        nodeCount: 11,
        build: buildWifiHack,
    },
    {
        id: "investigation",
        name: "Complex Branching Investigation",
        description:
            "A corporate network behind a firewall, a website with an unlinked page, mail / Kisscord / WeeChat / a phone call, a branch on how the player got in, and a passphrase ending.",
        difficulty: "Advanced",
        nodeCount: 29,
        build: buildInvestigation,
    },
    {
        id: "data-grab",
        name: "Standard Contract Hack",
        description:
            "The job the game hands out constantly: a name in an e-mail, an OSINT lookup, whois, a scan, one exploit on port 22, and a file the client wants a copy of. One admin account on the server, so no password cracking — the short route, start to finish.",
        difficulty: "Beginner",
        nodeCount: 22,
        build: buildDataGrab,
    },
    {
        id: "contract-hack",
        name: "The Ledger Contract",
        description:
            "A file on one man's personal PC, and everything between: OSINT, whois, a scan, mapping the network behind the router, an exploit that lands you as guest, cracking his password out of /etc/passwd, and a client who checks before she pays.",
        difficulty: "Advanced",
        nodeCount: 33,
        build: buildContractHack,
    },
    {
        id: "dirhunter-leak",
        name: "The Help Desk Leak",
        description:
            "A public agency site, a portal that refuses you, and an unlisted page dirhunter can find. The password is assembled from two pages the agency published itself — the classic web-recon loop, with a real website in the box.",
        difficulty: "Advanced",
        nodeCount: 21,
        build: buildDirhunter,
    },
    {
        id: "reference",
        name: "Node Reference",
        description:
            "Every node type on one canvas, filled with example input. Open it to see what a field expects before you build your own.",
        difficulty: "Reference",
        nodeCount: 40,
        build: buildReference,
    },
];

export function getTemplate(id: string): Template | undefined {
    return TEMPLATES.find((t) => t.id === id);
}
