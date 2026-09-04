/**
 * Templates are shipped content, so they have to satisfy the same invariants a
 * user's project would: parse against the schema, only wire compatible handles,
 * and keep every node reachable from a lifecycle entry point.
 */
import { describe, expect, it } from "vitest";
import { ProjectSchema } from "@/schema/project";
import { NodeSchema, type NodeDoc, type NodeType } from "@/schema/nodes";
import { EdgeSchema, canConnect, type EdgeKind } from "@/schema/edges";
import { nodeTypeDef, NODE_TYPES_REGISTRY, sourcesOf } from "@/schema/registry";
import { summarize } from "@/editor/canvas/summarize";
import { getTemplate, TEMPLATES } from "@/templates";
import { analyseGraph } from "@/analysis/graph";
import { computeWarnings } from "@/compiler/compile";
import { getEvent, payloadFields } from "@/schema/events";

describe("template registry", () => {
    it("ships the templates named in the plan", () => {
        expect(TEMPLATES.map((t) => t.id)).toEqual([
            "blank",
            "hello-hack",
            "wifi-hack",
            "investigation",
            "contract-hack",
            "dirhunter-leak",
            "reference",
        ]);
        expect(getTemplate("wifi-hack")?.name).toBe("Simple Linear Wi-Fi Hack");
        expect(getTemplate("reference")?.difficulty).toBe("Reference");
        // The standard contract hack ships the website its trail leads to —
        // a quest template with no site would teach half the tool.
        const contract = getTemplate("contract-hack")!.build();
        expect(contract.websites).toHaveLength(1);
        expect(contract.websites[0].host).toBe("meridian-capital.net");
        expect(contract.websites[0].pages.some((p) => !p.seo)).toBe(true);
        // The dirhunter template's whole puzzle is the unlisted page: the
        // password rule is printed there and nowhere in the quest text.
        const leak = getTemplate("dirhunter-leak")!.build();
        const helpdesk = leak.websites[0].pages.find((p) => p.path === "/it/helpdesk");
        expect(helpdesk, "the NAZA site must still ship its help-desk page").toBeDefined();
        expect(helpdesk!.seo, "the help-desk page has to stay out of search").toBe(false);
        expect(helpdesk!.content).toContain("first initial");
        // …and the account it unlocks must match the rule the page prints.
        const box = (leak.quests[0].graph.nodes.find((n) => n.type === "world.network")!.data as {
            device: { children: { users: { username: string; password: string }[] }[] };
        }).device.children[0];
        expect(box.users[0]).toMatchObject({ username: "t.reyes", password: "treyes3419" });
        expect(getTemplate("nope")).toBeUndefined();
    });

    /**
     * QA, round 33: the Ledger template loaded its whole world in-game and then
     * sat there, because no template had ever set `autoStart` — there was no way
     * for the player to claim any of them. A template that cannot be played is
     * not a template.
     */
    it.each(TEMPLATES.filter((t) => t.id !== "reference"))("%s: can actually be started", (template) => {
        for (const quest of template.build().quests) {
            expect(
                quest.autoStart || quest.hackhubPost != null,
                `${quest.name} has no way in: turn on autoStart or advertise it with a Hackhub feed post`,
            ).toBe(true);
        }
    });

    it.each(TEMPLATES.filter((t) => t.id !== "reference"))("%s: exports without an unplayable warning", (template) => {
        const warnings = computeWarnings(template.build());
        expect(warnings.filter((w) => /nothing can start this quest/.test(w))).toEqual([]);
    });

    it.each(TEMPLATES)("%s: parses against the project schema", (template) => {
        const result = ProjectSchema.safeParse(template.build());
        expect(result.success, JSON.stringify(result.success ? null : result.error.issues)).toBe(true);
    });

    it.each(TEMPLATES)("%s: has the node count it advertises", (template) => {
        const project = template.build();
        const total = project.quests.reduce((n, q) => n + q.graph.nodes.length, 0);
        expect(total).toBe(template.nodeCount);
    });

    it.each(TEMPLATES)("%s: builds deterministically", (template) => {
        // Ids are generated from a counter rather than randomness, so two builds
        // are byte-identical. That is what makes snapshots and the export diff
        // stable.
        expect(JSON.stringify(template.build())).toBe(JSON.stringify(template.build()));
    });

    // The exact defect reported from the screenshot: two cards on top of each
    // other. Cards are w-60 (240px) and roughly 100-120px tall, so use a generous
    // box and fail if any two intersect.
    const NODE_W = 240;
    const NODE_H = 120;

    it.each(TEMPLATES)("%s: no two nodes overlap", (template) => {
        for (const quest of template.build().quests) {
            const nodes = quest.graph.nodes;
            for (let a = 0; a < nodes.length; a += 1) {
                for (let b = a + 1; b < nodes.length; b += 1) {
                    const p = nodes[a].position;
                    const q = nodes[b].position;
                    const overlapX = Math.abs(p.x - q.x) < NODE_W;
                    const overlapY = Math.abs(p.y - q.y) < NODE_H;
                    expect(
                        overlapX && overlapY,
                        `${nodes[a].id} overlaps ${nodes[b].id} at (${p.x},${p.y})/(${q.x},${q.y})`,
                    ).toBe(false);
                }
            }
        }
    });

    it.each(TEMPLATES)("%s: has unique node ids", (template) => {
        for (const quest of template.build().quests) {
            const ids = quest.graph.nodes.map((n) => n.id);
            expect(new Set(ids).size).toBe(ids.length);
        }
    });

    it.each(TEMPLATES)("%s: every node validates on its own", (template) => {
        for (const quest of template.build().quests) {
            for (const node of quest.graph.nodes) {
                const result = NodeSchema.safeParse(node);
                expect(result.success, `${node.type}: ${JSON.stringify(result.success ? null : result.error.issues)}`).toBe(
                    true,
                );
            }
        }
    });

    it.each(TEMPLATES)("%s: only wires compatible handles", (template) => {
        for (const quest of template.build().quests) {
            const byId = new Map(quest.graph.nodes.map((n) => [n.id, n]));
            for (const edge of quest.graph.edges) {
                const source = byId.get(edge.source);
                const target = byId.get(edge.target);
                expect(source, `edge ${edge.id} references missing source ${edge.source}`).toBeDefined();
                expect(target, `edge ${edge.id} references missing target ${edge.target}`).toBeDefined();

                // Dynamic sockets count: a Sequence node's outputs come from
                // its own steps, exactly as the canvas resolves them.
                const sourceSpec = sourcesOf(source!).find((h) => h.id === edge.sourceHandle);
                const targetSpec = nodeTypeDef(target!.type).targets.find((h) => h.id === edge.targetHandle);
                expect(sourceSpec, `${source!.type} has no source handle "${edge.sourceHandle}"`).toBeDefined();
                expect(targetSpec, `${target!.type} has no target handle "${edge.targetHandle}"`).toBeDefined();
                expect(
                    canConnect(sourceSpec!.kind as EdgeKind, targetSpec!.kind as EdgeKind),
                    `${source!.type}.${edge.sourceHandle} → ${target!.type}.${edge.targetHandle}`,
                ).toBe(true);
                expect(edge.kind).toBe(sourceSpec!.kind);

                expect(EdgeSchema.safeParse(edge).success).toBe(true);
            }
        }
    });

    it.each(TEMPLATES)("%s: has no duplicate wires", (template) => {
        for (const quest of template.build().quests) {
            const keys = quest.graph.edges.map(
                (e) => `${e.source}|${e.sourceHandle}|${e.target}|${e.targetHandle}`,
            );
            expect(new Set(keys).size).toBe(keys.length);
        }
    });

    // Uses the shipped analysis rather than a copy of it, so the test and the
    // canvas badge cannot drift apart.
    it.each(TEMPLATES.filter((t) => t.difficulty !== "Reference"))(
        "%s: has no unreachable nodes",
        (template) => {
            for (const quest of template.build().quests) {
                const analysis = analyseGraph(quest.graph.nodes, quest.graph.edges);
                const unreachable = analysis.issues
                    .filter((i) => i.label === "Unreachable")
                    .map((i) => i.nodeId);
                expect(unreachable, `unreachable: ${unreachable.join(", ")}`).toEqual([]);
            }
        },
    );

    it.each(TEMPLATES.filter((t) => t.difficulty !== "Reference"))(
        "%s: has no objective the player can never complete",
        (template) => {
            for (const quest of template.build().quests) {
                const analysis = analyseGraph(quest.graph.nodes, quest.graph.edges);
                const blocked = analysis.issues.filter((i) => i.severity === "danger");
                expect(blocked.map((i) => i.detail), JSON.stringify(blocked)).toEqual([]);
            }
        },
    );

    // The reference sheet is deliberately unwired: it is a field catalogue, not a
    // story, so "unreachable" is not a defect there.
    it("reference: puts every node type on the canvas", () => {
        const reference = getTemplate("reference")!.build();
        const types = reference.quests[0].graph.nodes.map((n) => n.type);

        // Every registered type is represented.
        expect(new Set(types).size).toBe(32);

        // Sticky notes double as row headers, so they are the one repeat.
        const counts = new Map<string, number>();
        for (const type of types) counts.set(type, (counts.get(type) ?? 0) + 1);
        for (const [type, count] of counts) {
            if (type !== "flow.note") expect(count, `${type} appears ${count} times`).toBe(1);
        }
    });

    it("reference: every node still parses with its example data", () => {
        for (const node of getTemplate("reference")!.build().quests[0].graph.nodes) {
            const result = NodeSchema.safeParse(node);
            expect(
                result.success,
                `${node.type}: ${JSON.stringify(result.success ? null : result.error.issues)}`,
            ).toBe(true);
        }
    });
});

describe("node summaries", () => {
    it.each(TEMPLATES)("%s: summarises every node without throwing", (template) => {
        for (const quest of template.build().quests) {
            for (const node of quest.graph.nodes) {
                const lines = summarize(node);
                expect(Array.isArray(lines)).toBe(true);
                for (const line of lines) expect(typeof line).toBe("string");
            }
        }
    });

    it.each(Object.keys(NODE_TYPES_REGISTRY) as NodeType[])(
        "%s: summarises its default state",
        (type) => {
            const node = {
                id: "n1",
                type,
                position: { x: 0, y: 0 },
                data: nodeTypeDef(type).create(),
            } as unknown as NodeDoc;

            const lines = summarize(node);
            expect(Array.isArray(lines)).toBe(true);
            expect(lines.length).toBeGreaterThan(0);
            for (const line of lines) {
                expect(line.trim().length).toBeGreaterThan(0);
                expect(line.length).toBeLessThanOrEqual(80);
            }
        },
    );

    it("renders the Wi-Fi template's access point with its SSID", () => {
        const wifi = TEMPLATES[2]
            .build()
            .quests[0].graph.nodes.find((n) => n.type === "world.wifi")!;
        expect(summarize(wifi).join(" ")).toContain("NEIGHBOUR_5Ghz");
    });
});

/**
 * QA, round 40. Three rounds of "the SDK described a thing but the build does
 * not honour it" ended with a full audit of every SDK surface the compiler
 * touches, against the declarations and against Nemesis — a large mod known to
 * work in this build.
 *
 * This is the check that would have caught the worst of what the audit found:
 * two templates triggered on `Files.Downloaded`, an event this engine does not
 * have, so those objectives could never complete. A trigger naming an event
 * that does not exist fails silently and looks exactly like a trigger whose
 * conditions have not matched yet, which is why it survived so long.
 */
describe("every template triggers on events the engine actually raises", () => {
    const shipped = TEMPLATES.flatMap((t) => {
        const p = t.build();
        return p.quests.flatMap((q) =>
            q.graph.nodes
                .filter((n) => n.type === "trigger.event")
                .map((n) => ({
                    template: t.id,
                    quest: q.name,
                    data: n.data as { event: string; conditions?: { field: string }[] },
                })),
        );
    });

    it("uses only event names the SDK declares (or our own QE.* events)", () => {
        const unknown = shipped
            .filter(({ data }) => !data.event.startsWith("QE.") && !getEvent(data.event))
            .map(({ template, quest, data }) => `${template}/${quest}: ${data.event}`);
        expect(unknown).toEqual([]);
    });

    it("matches only on fields those events actually carry", () => {
        const wrong: string[] = [];
        for (const { template, quest, data } of shipped) {
            const ev = getEvent(data.event);
            if (!ev) continue;
            const fields = payloadFields(ev.payload);
            if (!fields.length) continue; // primitive payload: nothing to match on
            for (const c of data.conditions ?? []) {
                const root = c.field.split(".")[0];
                if (!fields.includes(root)) {
                    wrong.push(`${template}/${quest}: ${data.event} has no "${c.field}" (has ${fields.join(", ")})`);
                }
            }
        }
        expect(wrong).toEqual([]);
    });

    it("still covers the templates whose objectives depend on a download", () => {
        // Terminal.SSH.FileDownload replaced a nonexistent "Files.Downloaded";
        // pin it so the fix cannot be quietly reverted.
        const events = shipped.map((s) => s.data.event);
        expect(events).toContain("Terminal.SSH.FileDownload");
        expect(events).not.toContain("Files.Downloaded");
    });
});

/**
 * QA, round 40. The Ledger brief that shipped showing "<p>His name is
 * <b>Anselm Ritter</b>" was our own template text, not something the author
 * wrote. r39 taught the compiler to convert HTML to the plain text GoMail
 * displays, which fixes it either way — but a template should not be shipping
 * markup that has to be stripped back out. Website page bodies are still HTML,
 * as they should be; this is mail only.
 */
describe("template mail bodies are written as plain text", () => {
    const mails = TEMPLATES.flatMap((t) => {
        const p = t.build();
        return p.quests.flatMap((q) =>
            q.graph.nodes
                .filter((n) => n.type === "comms.dialogue" && (n.data as { kind: string }).kind === "mail")
                .map((n) => ({
                    where: `${t.id}/${q.name}`,
                    mail: (n.data as { mail: { subject: string; content: string } }).mail,
                })),
        );
    });

    it("ships at least one mail to check", () => {
        expect(mails.length).toBeGreaterThan(0);
    });

    it("contains no HTML tags", () => {
        const withTags = mails
            .filter(({ mail }) => /<\/?(p|b|i|br|div|span|ul|li|h[1-6])\b[^>]*>/i.test(mail.content))
            .map(({ where, mail }) => `${where}: ${mail.subject}`);
        expect(withTags).toEqual([]);
    });

    it("separates paragraphs with blank lines rather than running them together", () => {
        // A body built from several sentences must not arrive as one wall of
        // text: joining the parts with "" was how the tags had been hiding it.
        const runOn = mails
            .filter(({ mail }) => mail.content.length > 220 && !mail.content.includes("\n"))
            .map(({ where, mail }) => `${where}: ${mail.subject}`);
        expect(runOn).toEqual([]);
    });
});

/**
 * Round 54. The Ledger router advertised port 80 as open. The quest is written
 * entirely around the SSH route, so an open web port invites the player down a
 * path the template does not script — and QA has not tested the HTTP exploit
 * route yet either.
 *
 * The port stays in the list, closed: an edge router with a web port is what a
 * real one looks like, and having one closed next to one that answers shows the
 * difference. A later template can teach the web route properly.
 */
describe("the contract template is shaped the way the game plays", () => {
    const device = () => {
        const p = getTemplate("contract-hack")!.build();
        const net = p.quests[0].graph.nodes.find((n) => n.type === "world.network")!;
        return (net.data as {
            device: {
                ports: { external: number; active?: boolean; locked?: boolean; service?: string }[];
                users: { username: string }[];
                children: {
                    ports: { external: number; active?: boolean; locked?: boolean; service?: string }[];
                    users: { username: string; acceptReverseTCP?: boolean }[];
                }[];
            };
        }).device;
    };

    it("serves only the website from the edge router", () => {
        // Every router in the reference mod: port 80, locked, no SSH.
        const ports = device().ports;
        expect(ports.map((pt) => pt.external)).toEqual([80]);
        expect(ports[0].active).toBe(true);
        expect(ports[0].locked).toBe(true);
    });

    it("puts the exploitable SSH service on the machine behind it", () => {
        const host = device().children[0];
        const ssh = host.ports.find((pt) => pt.service === "ssh")!;
        expect(ssh).toBeDefined();
        expect(ssh.external).toBe(22);
        expect(ssh.active).toBe(true);
        // The reference mod locks a router's web port and leaves the SSH port
        // it wants exploited explicitly unlocked.
        expect(ssh.locked).toBe(false);
    });

    it("gives the target machine the account the shell comes back to", () => {
        const user = device().children[0].users.find((u) => u.username === "aritter")!;
        expect(user).toBeDefined();
        expect(user.acceptReverseTCP).toBe(true);
    });

    it("leaves the router with an admin account and no reverse-TCP user", () => {
        // The router is the way in, not the target: nothing on it should be
        // the thing metasploit connects back to.
        const users = device().users;
        expect(users.map((u) => u.username)).toEqual(["admin"]);
        expect((users[0] as { acceptReverseTCP?: boolean }).acceptReverseTCP).toBeUndefined();
    });

    it("offers exactly one exploitable service across the whole network", () => {
        const d = device();
        const open = [
            ...d.ports.filter((pt) => pt.active !== false && pt.service === "ssh"),
            ...d.children.flatMap((c) => c.ports.filter((pt) => pt.active !== false && pt.service === "ssh")),
        ];
        expect(open).toHaveLength(1);
    });
});

/**
 * Round 64. QA played the contract end to end and the route turned out to be
 * longer than the objectives described. With SSH moved behind the router (r58),
 * the real sequence is:
 *
 *   nmap the edge → net_tree.py to find the machines behind it → metasploit
 *   the workstation's SSH → land as guest → show users → read /etc/passwd →
 *   john the hash → users <n> to become Ritter → delete the file
 *
 * Two of those steps had no objective at all, and one hint handed the player
 * an address the network is supposed to teach them to find.
 */
describe("the contract template's hints match the route the player walks", () => {
    const quest = () => getTemplate("contract-hack")!.build().quests[0];
    const objectives = () =>
        quest().graph.nodes
            .filter((n) => n.type === "objective")
            .map((n) => n.data as { name: string; description: string; hint?: string; info?: string });

    it("has an objective for mapping the network behind the router", () => {
        const o = objectives().find((x) => x.name === "map-network");
        expect(o, "the player cannot find the workstation without this step").toBeDefined();
        expect(o!.hint).toContain("net_tree.py");
    });

    it("has an objective for becoming Ritter, not just for getting a shell", () => {
        // The exploit lands the player as guest, which cannot read his home.
        const o = objectives().find((x) => x.name === "become-ritter");
        expect(o).toBeDefined();
        expect(o!.hint).toContain("show users");
        expect(o!.hint).toContain("passwd");
        expect(o!.hint).toContain("john");
    });

    it("never hands the player the workstation's address in a hint", () => {
        /* 10.0.0.12 is the thing net_tree.py is there to reveal. Printing it in
           a hint skips the step and makes the map objective pointless. */
        for (const o of objectives()) {
            const text = `${o.description} ${o.hint ?? ""} ${o.info ?? ""}`;
            expect(text, o.name).not.toContain("10.0.0.12");
        }
    });

    it("keeps the internal address out of the scripted tool output too", () => {
        const tools = quest().graph.nodes.filter((n) => n.type === "world.toolResponse");
        for (const t of tools) {
            const d = t.data as { command: string; dataText: string };
            expect(d.dataText, `${d.command} leaks the internal address`).not.toContain("10.0.0.12");
        }
    });

    it("still tells the player the public address, which is the way in", () => {
        const whois = quest().graph.nodes.find(
            (n) => n.type === "world.toolResponse" && (n.data as { command: string }).command === "whois",
        )!;
        expect((whois.data as { dataText: string }).dataText).toContain("45.33.32.156");
    });

    it("orders the objectives so each unlocks the next", () => {
        const g = quest().graph;
        const names = g.nodes.filter((n) => n.type === "objective").map((n) => (n.data as { name: string }).name);
        expect(names).toEqual([
            "read-brief", "identify-target", "find-server", "scan-server",
            "map-network", "get-a-shell", "become-ritter", "delete-ledger", "report-back",
        ]);
        // every objective but the last hands on to exactly one successor
        const unlocks = g.edges.filter((e) => e.sourceHandle === "unlock");
        expect(unlocks).toHaveLength(names.length - 1);
    });

    it("gives every objective a trigger that can complete it", () => {
        const g = quest().graph;
        for (const o of g.nodes.filter((n) => n.type === "objective")) {
            const wired = g.edges.some((e) => e.kind === "condition" && e.target === o.id);
            expect(wired, `${(o.data as { name: string }).name} has no trigger`).toBe(true);
        }
    });
});
