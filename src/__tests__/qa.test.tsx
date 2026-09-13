/**
 * Comprehensive QA sweep: invariants that must hold across the whole editor.
 * - every registered node type is complete (label, category, palette entry,
 *   schema-valid defaults, crash-free summary)
 * - every template builds, validates, compiles, and its emitted mod.js runs
 * - the compiler survives empty projects and hostile text
 * - autosave survives a corrupted draft
 */
import { describe, expect, it } from "vitest";
import { compileProject } from "@/compiler/compile";
import { summarize } from "@/editor/canvas/summarize";
import { NODE_TYPES, NodeSchema, type NodeDoc } from "@/schema/nodes";
import { ProjectSchema, createProject } from "@/schema/project";
import { NODE_TYPES_REGISTRY, nodeTypeDef, paletteGroups, categoryOf, PALETTE_HIDDEN_TYPES } from "@/schema/registry";
import { TEMPLATES } from "@/templates";
import { loadDraft, saveDraft } from "@/store/autosave";

/* ── helpers ─────────────────────────────────────────────────────────────── */

function stubSdk() {
    const registered = { quests: [] as any[], websites: [] as any[], commands: [] as any[], mod: null as any };
    class Quest {
        Data: Record<string, unknown> = {};
        Events = { on: () => {}, off: () => {}, offAll: () => {} };
        sendMail() {}
        createDialog() {}
        completeObjective() {}
        SetData() {}
    }
    return {
        registered,
        sdk: {
            Quest,
            Website: class {},
            Command: class {},
            Bootstrap: class {},
            RegisterQuest: (c: unknown) => registered.quests.push(c),
            RegisterWebsite: (c: unknown) => registered.websites.push(c),
            RegisterCommand: (c: unknown) => registered.commands.push(c),
            RegisterModPackage: (c: unknown) => (registered.mod = c),
            Network: {
                createSubnetNetwork: (d: { ip: string }) => d.ip,
                createWifiNetwork: () => "10.0.0.1",
                createUser: (u: unknown) => u,
                randomIp: () => "10.9.9.9",
            },
            Events: { emit: () => {}, on: () => {} },
            Shell: { addCommandData: () => {} },
            UI: { notify: () => {}, toast: () => {} },
            Bank: {},
        },
    };
}

function evalMod(modJs: string, sdk: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function("require", "module", "exports", modJs)(
        () => sdk,
        { exports: {} },
        {},
    );
}

const settle = async () => {
    for (let i = 0; i < 60; i++) await new Promise((r) => setTimeout(r, 0));
};

/* ── registry integrity ──────────────────────────────────────────────────── */

describe("registry integrity", () => {
    it("every node type has a complete definition", () => {
        expect(NODE_TYPES.length).toBeGreaterThanOrEqual(29);
        const paletteTypes = new Set(paletteGroups().flatMap((g) => g.types.map((t) => t.type)));
        for (const type of NODE_TYPES) {
            const def: (typeof NODE_TYPES_REGISTRY)[typeof type] = nodeTypeDef(type);
            expect(def.label, `${type}: label`).toBeTruthy();
            expect(def.category, `${type}: category`).toBe(categoryOf(type).id);
            expect(Array.isArray(def.fields), `${type}: fields`).toBe(true);
            if (PALETTE_HIDDEN_TYPES.has(type)) {
                // Deliberately hidden from the authoring surface (see
                // PALETTE_HIDDEN_TYPES) but still fully defined for legacy
                // projects to parse and compile.
                expect(paletteTypes.has(type), `${type}: should be hidden from palette`).toBe(false);
            } else {
                expect(paletteTypes.has(type), `${type}: missing from palette`).toBe(true);
            }
        }
    });

    it("every node type's defaults are schema-valid and summarize without crashing", () => {
        for (const type of NODE_TYPES) {
            const data = nodeTypeDef(type).create() as object;
            const doc = { id: `qa-${type}`, type, position: { x: 0, y: 0 }, data };
            const parsed = NodeSchema.safeParse(doc);
            expect(parsed.success, `${type}: defaults fail its own schema — ${JSON.stringify((parsed as any).error?.issues?.[0] ?? "")}`).toBe(true);
            const node = (parsed.success ? parsed.data : doc) as NodeDoc;
            const summary = summarize(node);
            expect(Array.isArray(summary), `${type}: summarize crashed or returned ${typeof summary}`).toBe(true);
            for (const line of summary) expect(typeof line, `${type}: non-string summary line`).toBe("string");
        }
    });
});

/* ── templates ───────────────────────────────────────────────────────────── */

describe("templates", () => {
    it("every template validates, compiles, and its mod.js runs", async () => {
        expect(TEMPLATES.length).toBeGreaterThanOrEqual(4);
        for (const tpl of TEMPLATES) {
            const project = tpl.build();
            const parsed = ProjectSchema.safeParse(project);
            expect(parsed.success, `${tpl.id}: project fails schema — ${JSON.stringify((parsed as any).error?.issues?.slice(0, 2) ?? "")}`).toBe(true);
            const p = parsed.success ? parsed.data : project;

            // every edge points at nodes that exist
            for (const q of p.quests) {
                const ids = new Set(q.graph.nodes.map((n) => n.id));
                for (const e of q.graph.edges) {
                    expect(ids.has(e.source), `${tpl.id}/${q.name}: dangling edge source`).toBe(true);
                    expect(ids.has(e.target), `${tpl.id}/${q.name}: dangling edge target`).toBe(true);
                }
            }

            const result = compileProject(p);
            const manifest = JSON.parse(result.files.find((f) => f.path === "manifest.json")!.content);
            expect(manifest.apiVersion, tpl.id).toBe(1);

            const { registered, sdk } = stubSdk();
            evalMod(result.files.find((f) => f.path === "dist/mod.js")!.content, sdk);
            for (const QC of registered.quests) {
                const q = new QC();
                q.OnStart();
                q.OnObjectivesStart();
            }
            for (const WC of registered.websites) new WC();
            for (const CC of registered.commands) new CC();
            await settle();
        }
    });
});

/* ── compiler edge cases ─────────────────────────────────────────────────── */

describe("compiler edge cases", () => {
    it("compiles a completely empty project", () => {
        const result = compileProject(createProject());
        const manifest = JSON.parse(result.files.find((f) => f.path === "manifest.json")!.content);
        expect(manifest.permissions).toEqual([]);
        const { registered, sdk } = stubSdk();
        evalMod(result.files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        expect(registered.mod).toBeTruthy();
    });

    it("survives hostile text in every string field", () => {
        const p = createProject();
        p.mod.name = 'Evil "mod" \\ `name` </script> ${injection}';
        p.quests[0].title = "quote\"'back\\slash ünïcödé 🚀";
        p.websites.push({
            id: "hostile",
            host: "hostile.example",
            name: "Hostile",
            pages: [
                {
                    id: "hp",
                    path: "/",
                    title: "</script>",
                    seo: true,
                    content: '<html><body>" \\ ` ${x} </script> 🚀</body></html>',
                },
            ],
        });
        const result = compileProject(p);
        const { registered, sdk } = stubSdk();
        evalMod(result.files.find((f) => f.path === "dist/mod.js")!.content, sdk);
        const site: any = new registered.websites[0]();
        expect(site.Pages[0].html).toContain("${x}");
        expect(site.Pages[0].html).toContain("🚀");
        expect(registered.quests.length).toBe(1);
    });
});

/* ── autosave ────────────────────────────────────────────────────────────── */

describe("autosave", () => {
    it("survives a corrupted draft and round-trips a healthy one", () => {
        localStorage.clear();
        localStorage.setItem("hackhub-quest-editor:draft:v1", "{{{not json");
        expect(loadDraft()).toBeNull();

        localStorage.setItem("hackhub-quest-editor:draft:v1", JSON.stringify({ nope: true }));
        expect(loadDraft()).toBeNull();

        const project = createProject();
        saveDraft(project);
        const loaded = loadDraft();
        expect(loaded).not.toBeNull();
        expect(loaded!.mod.id).toBe(project.mod.id);
        localStorage.clear();
    });
});
