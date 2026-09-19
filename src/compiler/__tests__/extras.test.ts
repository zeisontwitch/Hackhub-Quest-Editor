/**
 * Pack extras + localization (r203): the fences around what a pack puts
 * *outside* its own quests — start-menu items, desktop widgets, right-click
 * items, and the `{{tr.key}}` token that reaches every text field.
 *
 * Every surface here was read in game before it was built (r200/r201 probe,
 * rows T-16..T-22 in reference/sdk-0.24-qa/STATUS.md), and the two findings
 * that changed the editor's design are fenced here as behaviour:
 *
 *  1. `section` is never sent — the SDK declares it and the game ignores it;
 *  2. a widget's `transparent` flag is ALWAYS sent explicitly, because the
 *     SDK's own default is `true` (bare text, no background). A pack that
 *     never touches the switch must still get a background.
 *
 * Plus the standing compile rules: a project that uses none of this emits no
 * extras, no translations and no widget files at all (the r84 rule), and every
 * click action does what the label promises.
 *
 * Technique: compile the real project → run the real mod.js against a stub SDK
 * → call the handlers the game would call (same approach as twotter.test.ts).
 */
import { describe, expect, it } from "vitest";
import { compileProject } from "@/compiler/compile";
import { createProject, type ProjectDocument } from "@/schema/project";
import { nodeTypeDef } from "@/schema/registry";
import { GAME_LANGUAGE_CODES, type ExtraAction } from "@/schema/extras";

/* ── stub SDK ─────────────────────────────────────── */

interface ExtrasStub {
    calls: string[];
    menu: Record<string, unknown>[];
    widgets: Record<string, unknown>[];
    context: Record<string, unknown>[];
    translations: { language: string; strings: Record<string, string> }[];
    registeredAt: string[];
    /** The quest classes as the game receives them — the only place the Title
     *  the game reads at registration can be looked at. */
    quests: { new (): { Title: string; Description: string } }[];
    /** Same list, typed loosely for the test that drives a quest instance. */
    questClasses: { new (): unknown }[];
    sdk: Record<string, unknown>;
}

function extrasSdk(): ExtrasStub {
    const calls: string[] = [];
    const menu: Record<string, unknown>[] = [];
    const widgets: Record<string, unknown>[] = [];
    const context: Record<string, unknown>[] = [];
    const translations: { language: string; strings: Record<string, string> }[] = [];
    const registeredAt: string[] = [];
    const quests: { new (): { Title: string; Description: string } }[] = [];

    const sdk: Record<string, unknown> = {
        /* A real class: the runtime's quest definitions extend `sdk.Quest`. */
        Quest: Object.assign(class Quest {}, { claim: (id: string) => calls.push(`claim:${id}`) }),
        Website: class {},
        Command: class {},
        Bootstrap: class {},
        RegisterQuest: (cls: { new (): { Title: string; Description: string } }) => {
            /* What the game could resolve at REGISTRATION time — the SDK reads a
               quest's Title then, so a translated title has to be in place. */
            registeredAt.push(`quest:${translations.map((t) => t.language).join(",")}`);
            quests.push(cls);
        },
        RegisterWebsite: () => {},
        RegisterCommand: () => {},
        RegisterModPackage: () => {},
        SaveStorage: { get: () => undefined, set: () => {}, remove: () => {}, clear: () => {}, getAll: () => ({}) },
        Network: { randomIp: () => "10.0.0.1" },
        Shell: { getUsername: () => "player1" },
        Events: { emit: () => {}, on: () => {} },
        UI: { notify: (m: string) => calls.push(`notify:${m}`), toast: () => {}, prompt: () => Promise.resolve("") },
        Bank: {},
        Time: { now: () => 0, scale: () => 60, isRunning: () => true },
        Scheduler: { register: () => {}, schedule: () => "job", scheduleAt: () => "job", cancel: () => {}, cancelKind: () => {}, list: () => [], remaining: () => null },
        SharedVariables: { get: () => undefined, set: () => {}, remove: () => {}, getAll: () => ({}) },
        Menu: { addItem: (item: Record<string, unknown>) => { menu.push(item); } },
        Desktop: { addWidget: (w: Record<string, unknown>) => { widgets.push(w); } },
        ContextMenu: { register: (item: Record<string, unknown>) => { context.push(item); } },
        Localization: {
            register: (language: string, strings: Record<string, string>) => translations.push({ language, strings }),
            languages: () => GAME_LANGUAGE_CODES.slice(),
            t: (key: string) => {
                const hit = translations.map((t) => t.strings[key]).filter((v) => v !== undefined)[0];
                return hit === undefined ? key : hit;
            },
        },
        Mail: {
            getPlayerEmail: () => "player@hackhub.local",
            send: (m: Record<string, unknown>) => calls.push(`mail:${String(m.subject)}|${String(m.content)}|${String(m.to)}`),
        },
        Handbook: {
            open: (id: string, category?: string) => calls.push(`handbook:${id}${category ? `|${category}` : ""}`),
        },
    };
    return { calls, menu, widgets, context, translations, registeredAt, quests, questClasses: quests, sdk };
}

function runMod(modJs: string, sdk: unknown) {
    const mod: { exports: unknown } = { exports: {} };
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function("require", "module", "exports", modJs)((name: string) => {
        if (name === "@hotbunny/hackhub-content-sdk") return sdk;
        throw new Error(`unexpected require: ${name}`);
    }, mod, mod.exports);
}

function boot(project: ProjectDocument) {
    const stub = extrasSdk();
    const result = compileProject(project);
    const modJs = result.files.find((f) => f.path === "dist/mod.js")!.content;
    runMod(modJs, stub.sdk);
    return { ...stub, modJs, files: result.files, permissions: result.permissions };
}

/* ── project fixtures ─────────────────────────────── */

let seq = 0;
/** A node built from the registry, the way the editor's own tests build them. */
function node(type: Parameters<typeof nodeTypeDef>[0], patch: Record<string, unknown> = {}) {
    const data = { ...(nodeTypeDef(type).create() as object), ...patch };
    return { id: `n${++seq}`, type, position: { x: 0, y: 0 }, data } as unknown as { id: string };
}

const flow = (source: string, target: string) => ({
    id: `e-${source}-${target}`,
    source,
    sourceHandle: "out",
    target,
    targetHandle: "in",
    kind: "flow",
});

/** A complete action record — authors only ever fill the fields their chosen
 *  action kind uses, so the fixtures read the same way through this helper. */
function act(patch: Partial<ExtraAction>): ExtraAction {
    return {
        kind: "notify",
        text: "",
        questId: "",
        mailFrom: "",
        mailSubject: "",
        mailContent: "",
        handbookId: "",
        handbookCategory: "",
        ...patch,
    };
}

/** A pack with one menu item, one widget and one right-click item, each wired
 *  to a different approved action. */
function extrasProject(): ProjectDocument {
    const project = createProject();
    project.extras.menuItems = [
        {
            id: "flashlight",
            label: "{{tr.menu.flashlight}}",
            icon: "",
            action: act({ kind: "claim", questId: project.quests[0].id }),
        },
        {
            id: "hello",
            label: "Say hello",
            icon: "",
            action: act({ kind: "notify", text: "{{tr.greet}} {{player.username}}!" }),
        },
        {
            id: "write",
            label: "Write to me",
            icon: "",
            action: act({ kind: "mail", mailFrom: "The Editor", mailSubject: "{{tr.mail.subject}}", mailContent: "<p>Hi {{player.username}}</p>" }),
        },
        {
            id: "readup",
            label: "Read the handbook",
            icon: "",
            action: act({ kind: "handbook", handbookId: "getting-started", handbookCategory: "basics" }),
        },
    ];
    project.extras.widgets = [
        {
            id: "clock-widget",
            name: "Clock",
            width: 360,
            height: 200,
            x: 40,
            y: 40,
            transparent: false,
            html: "<p>It is {{player.username}}'s clock.</p>",
        },
    ];
    project.extras.contextItems = [
        {
            id: "inspect-file",
            label: "Inspect this file",
            icon: "",
            target: "file",
            action: act({ kind: "notify", text: "Nice file." }),
        },
        {
            id: "desktop-note",
            label: "Desktop note",
            icon: "",
            target: "desktop",
            action: act({ kind: "notify", text: "Nice desktop." }),
        },
    ];
    project.translations = {
        languages: ["en", "de"],
        strings: { en: { "menu.flashlight": "Flashlight", "mail.subject": "A letter", greet: "Hello" }, de: { "menu.flashlight": "Taschenlampe" } },
    };
    return project;
}

/* ── tests ────────────────────────────────────────── */

describe("pack extras — the surfaces (r203)", () => {
    it("registers every menu item, and never sends the inert `section` field", () => {
        const b = boot(extrasProject());
        expect(b.menu.map((m) => m.id)).toEqual(["flashlight", "hello", "write", "readup"]);
        /* The SDK declares section: "top" | "bottom" and the game ignores it —
           a control that does nothing must not be offered, so it must not be
           sent either. */
        expect(b.menu.some((m) => "section" in m)).toBe(false);
        expect(typeof b.menu[0]!.onClick).toBe("function");
    });

    it("registers widgets with the size, position and an EXPLICIT transparency flag", () => {
        const b = boot(extrasProject());
        expect(b.widgets).toHaveLength(1);
        const w = b.widgets[0]!;
        expect(w.id).toBe("clock-widget");
        expect(w.src).toBe("widgets/clock-widget.html");
        expect([w.width, w.height]).toEqual([360, 200]);
        expect(w.position).toEqual({ x: 40, y: 40 });
        /* The SDK's own default is true (bare text). Anything we register says
           which it wants, every time. */
        expect(w.transparent).toBe(false);
    });

    it("defaults a new widget to opaque, so an untouched switch is not see-through", () => {
        const project = createProject();
        project.extras.widgets = [
            { id: "w1", name: "", width: 320, height: 180, x: 0, y: 0, transparent: false, html: "<p>x</p>" },
        ];
        const b = boot(project);
        expect(b.widgets[0]!.transparent).toBe(false);
    });

    it("registers right-click items with their target", () => {
        const b = boot(extrasProject());
        expect(b.context.map((c) => [c.id, c.target])).toEqual([
            ["inspect-file", "file"],
            ["desktop-note", "desktop"],
        ]);
        expect(typeof b.context[0]!.onClick).toBe("function");
    });

    it("ships each widget's HTML as its own file in the pack", () => {
        const b = boot(extrasProject());
        const file = b.files.find((f) => f.path === "widgets/clock-widget.html");
        expect(file, "widget html file").toBeTruthy();
        expect(file!.content).toContain("It is {{player.username}}'s clock.");
        /* A whole document the author wrote is passed through, not wrapped. */
        const project = createProject();
        project.extras.widgets = [
            { id: "w2", name: "", width: 100, height: 100, x: 0, y: 0, transparent: true, html: "<!doctype html><html><body><b>mine</b></body></html>" },
        ];
        const b2 = boot(project);
        const html = b2.files.find((f) => f.path === "widgets/w2.html")!.content;
        expect(html.startsWith("<!doctype html>")).toBe(true);
        expect(html.match(/<html/g)).toHaveLength(1);
    });

    it("asks for the permissions the extras actually use", () => {
        const b = boot(extrasProject());
        expect(b.permissions).toContain("ui");
        expect(b.permissions).toContain("mail");
    });

    it("emits nothing at all when the pack has no extras (the r84 rule)", () => {
        const plain = createProject();
        /* Explicitly-empty lists must compile exactly like absent ones. */
        plain.extras = { menuItems: [], widgets: [], contextItems: [] };
        plain.translations = { languages: ["en"], strings: {} };
        const b = boot(plain);
        expect(b.modJs).not.toContain('"extras":');
        expect(b.modJs).not.toContain('"translations":');
        expect(b.files.some((f) => f.path.startsWith("widgets/"))).toBe(false);
        expect(b.permissions).not.toContain("ui");
    });
});

const click_ = (list: Record<string, unknown>[], id: string) => {
    const item = list.find((i) => i.id === id)!;
    (item.onClick as () => void)();
};

describe("pack extras — click actions (r203)", () => {
    /** Click the item the way the game would: through its own handler. */
const click = (b: ReturnType<typeof boot>, which: "menu" | "context", id: string) => click_(b[which], id);

    it("notify: fills both {{tr.key}} and the player tokens, then tells the player", () => {
        const b = boot(extrasProject());
        click(b, "menu", "hello");
        /* "{{tr.greet}} {{player.username}}!" -> the game's translation table
           supplies one half and the SDK the other. */
        expect(b.calls).toContain("notify:Hello player1!");
    });

    it("claim: starts the named quest through the SDK", () => {
        const project = extrasProject();
        const b = boot(project);
        click(b, "menu", "flashlight");
        expect(b.calls).toContain(`claim:${project.quests[0].id}`);
    });

    it("mail: sends through Mail.send with the player's address, tokens filled", () => {
        const b = boot(extrasProject());
        click(b, "menu", "write");
        expect(b.calls).toContain("mail:A letter|Hi player1|player@hackhub.local");
    });

    it("handbook: opens the named article, with its category when given", () => {
        const b = boot(extrasProject());
        click(b, "menu", "readup");
        expect(b.calls).toContain("handbook:getting-started|basics");
    });

    it("a right-click action works the same way as a menu one", () => {
        const b = boot(extrasProject());
        click(b, "context", "desktop-note");
        expect(b.calls).toContain("notify:Nice desktop.");
    });
});

describe("localization (r203)", () => {
    it("registers every language the pack has strings for", () => {
        const b = boot(extrasProject());
        expect(b.translations.map((t) => t.language)).toEqual(["en", "de"]);
        expect(b.translations[0]!.strings["menu.flashlight"]).toBe("Flashlight");
        expect(b.translations[1]!.strings["menu.flashlight"]).toBe("Taschenlampe");
    });

    it("leaves the quest flow's own token filling intact", () => {
        /* The extras share the token scope with the quest flow, and that reach
           is easy to get wrong: tokenScope lives in the runtime's IIFE, so a
           bare call from the quest-side helper is a ReferenceError that breaks
           EVERY token in every quest. This drives one quest node end to end —
           the r203 gates caught the real thing, this keeps it caught here. */
        const project = extrasProject();
        const quest = project.quests[0];
        quest.autoStart = false;
        const entry = node("entry.start");
        const notify = node("fx.notify", { message: "Hello {{player.username}}", variant: "notify", tone: "info" });
        quest.graph = { nodes: [entry, notify], edges: [flow(entry.id, notify.id)] } as never;
        const b = boot(project);
        const instance = new (b.questClasses[0]!)() as { OnStart: () => void };
        instance.OnStart();
        expect(b.calls).toContain("notify:Hello player1");
    });

    it("registers translations BEFORE the quests, so a title can be read at registration", () => {
        const b = boot(extrasProject());
        /* The game reads a quest's Title while registering it (SDK :4062), so
           this ordering is the whole reason the block runs first. */
        expect(b.registeredAt[0]).toBe("quest:en,de");
    });

    it("translates a menu label at registration, because the game reads it there", () => {
        const b = boot(extrasProject());
        /* The author typed {{tr.menu.flashlight}}; the game was handed the
           words. A label the game reads once cannot be filled later. */
        expect(b.menu.find((m) => m.id === "flashlight")!.label).toBe("Flashlight");
        expect(b.context.find((c) => c.id === "inspect-file")!.label).toBe("Inspect this file");
    });

    it("ships the token, not a baked translation, so the pack carries every language", () => {
        const b = boot(extrasProject());
        expect(b.modJs).toContain("{{tr.menu.flashlight}}");
        expect(b.translations.map((t) => t.language)).toEqual(["en", "de"]);
    });

    it("translates a quest's Title, which the game reads at registration", () => {
        const project = extrasProject();
        project.quests[0].title = "{{tr.quest.title}}";
        project.quests[0].description = "<p>{{tr.quest.blurb}}</p>";
        project.translations.strings.en = {
            ...project.translations.strings.en,
            "quest.title": "The Lighthouse Job",
            "quest.blurb": "Somebody is watching the harbour.",
        };
        const b = boot(project);
        /* Title and Description are taken off the definition while it is handed
           over — everything else waits until it is used. */
        const instance = new b.quests[0]!();
        expect(instance.Title).toBe("The Lighthouse Job");
        expect(instance.Description).toBe("<p>Somebody is watching the harbour.</p>");
    });

    it("leaves {{data.…}} in a title alone, because there is none at registration", () => {
        const project = extrasProject();
        project.quests[0].title = "Job for {{data.client}}";
        const b = boot(project);
        expect(new b.quests[0]!().Title).toBe("Job for {{data.client}}");
    });

    it("shows the key even on a build with no Localization API at all", () => {
        const project = extrasProject();
        const b = boot(project);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (b.sdk as any).Localization;
        click_(b.menu, "hello");
        /* Better the key on screen than an empty notification: a missing
           language must never silently blank a pack's text. */
        expect(b.calls.some((c) => c.startsWith("notify:greet "))).toBe(true);
    });

    it("shows the key when a translation is missing, rather than nothing", () => {
        const project = createProject();
        project.translations = { languages: ["en"], strings: { en: { known: "Known" } } };
        const b = boot(project);
        const sdk = b.sdk as { Localization: { t: (k: string) => string } };
        expect(sdk.Localization.t("known")).toBe("Known");
        expect(sdk.Localization.t("missing.key")).toBe("missing.key");
    });
});
