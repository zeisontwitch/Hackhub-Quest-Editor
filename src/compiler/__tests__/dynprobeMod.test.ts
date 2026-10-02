import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, beforeAll } from "vitest";

/**
 * Smoke test for the hand-authored dynamic-page QA probe
 * (reference/sdk-0.24-qa/dynprobe/dist/mod.js, r238).
 *
 * The probe is the template for what the editor will EVENTUALLY emit for
 * dynamic pages, so its handler logic is verified here the same way the
 * compiled runtime is: load mod.js against a stub SDK, then exercise each
 * dynamic page's metadata() like the game would - with a request context.
 * The game-side behaviour (404 rendering, caching, the iframe bridge) is
 * answered in game by the quest's objectives; this file pins the logic that
 * does not need the game.
 */

const MOD_JS_PATH = resolve(__dirname, "../../../reference/sdk-0.24-qa/dynprobe/dist/mod.js");

function stubSdk() {
    const registered: { websites: any[]; quests: any[]; commands: any[] } = { websites: [], quests: [], commands: [] };
    const emitted: { name: string; data: any }[] = [];
    const listeners: { name: string; cb: (d: any) => void }[] = [];
    const sent: any[] = [];
    // r249: the probe now reads the player's real address and lists the
    // inbox, to tell "the mail was dropped" from "the mail is there but not
    // drawn". The stub answers both so the command can be exercised here.
    const inbox: any[] = [];
    return {
        Website: class {},
        RegisterWebsite: (c: any) => { registered.websites.push(c); },
        Quest: class {
            Events = { on: (name: string, cb: (d: any) => void) => { listeners.push({ name, cb }); } };
            completeObjective = () => {};
        },
        RegisterQuest: (c: any) => { registered.quests.push(c); },
        Command: class {},
        RegisterCommand: (_opts: unknown) => (c: any) => { registered.commands.push(c); },
        Events: {
            register: (_name: string) => {},
            on: (name: string, cb: (d: any) => void) => { listeners.push({ name, cb }); },
            emit: (name: string, data?: any) => {
                emitted.push({ name, data });
                listeners.filter((l) => l.name === name).forEach((l) => l.cb(data));
            },
        },
        Mail: {
            send: (mail: any) => { sent.push(mail); return "mail-id-" + sent.length; },
            getPlayerEmail: () => "tester@gomail.com",
            getInbox: () => inbox,
        },
        __registered: registered,
        __emitted: emitted,
        __listeners: listeners,
        __sent: sent,
        __inbox: inbox,
    };
}

/** Stub tool-belt for a command's Run(tools): positional args only. */
const toolsWith = (...args: string[]) => ({ getArgs: () => args });

function runMod(modJs: string, sdk: unknown) {
    const mod: { exports: any } = { exports: {} };
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function("require", "module", "exports", modJs)((name: string) => {
        if (name === "@hotbunny/hackhub-content-sdk") return sdk;
        throw new Error(`unexpected require: ${name}`);
    }, mod, mod.exports);
    return mod.exports;
}

const ctx = (partial: Record<string, unknown>) => ({
    url: "http://qe24-dyn.test/",
    params: {} as Record<string, string>,
    query: {} as Record<string, string>,
    ...partial,
});

describe("dynprobe mod (r238)", () => {
    let sdk: ReturnType<typeof stubSdk>;
    let site: any;
    let pages: any[];

    beforeAll(() => {
        sdk = stubSdk();
        const mod = runMod(readFileSync(MOD_JS_PATH, "utf8"), sdk as unknown);
        expect(sdk.__registered.websites).toHaveLength(1);
        expect(sdk.__registered.quests).toHaveLength(1);
        site = new (sdk.__registered.websites[0])();
        pages = site.Pages;
        void mod;
    });

    it("registers one site on the probe host with 8 pages: 1 static + 7 dynamic", () => {
        expect(site.Host).toBe("qe24-dyn.test");
        expect(pages).toHaveLength(8);
        const staticPages = pages.filter((p) => typeof p.html === "string");
        const dynamicPages = pages.filter((p) => typeof p.metadata === "function");
        expect(staticPages).toHaveLength(1);
        expect(dynamicPages).toHaveLength(7);
        expect(staticPages[0].path).toBe("/");
        // A dynamic page carries NO static html - its content is the function.
        for (const p of dynamicPages) expect(p.html).toBeUndefined();
    });

    it("P2 /echo renders the query value and dumps the raw context", () => {
        const page = pages.find((p) => p.path === "/echo");
        const meta = page.metadata(ctx({ url: "http://qe24-dyn.test/echo?msg=zeis", query: { msg: "zeis" }, searchStr: "?msg=zeis" }));
        expect(meta.html).toContain("You asked for: <b>zeis</b>");
        expect(meta.html).toContain('"msg": "zeis"');
    });

    it("P3 /article/:id renders a known record via params", () => {
        const page = pages.find((p) => p.path === "/article/:id");
        const meta = page.metadata(ctx({ url: "http://qe24-dyn.test/article/1", params: { id: "1" } }));
        expect(meta.html).toContain("Article one: the lighthouse ledger");
        expect(meta.html).toContain('{"id":"1"}');
    });

    it("P3 /article/:id falls back to the raw URL when params is empty", () => {
        const page = pages.find((p) => p.path === "/article/:id");
        const meta = page.metadata(ctx({ url: "http://qe24-dyn.test/article/2", params: {} }));
        expect(meta.html).toContain("Article two: the missing ferry timetable");
    });

    it("P3 /article/:id returns null for an unknown record (the 404 row)", () => {
        const page = pages.find((p) => p.path === "/article/:id");
        expect(page.metadata(ctx({ url: "http://qe24-dyn.test/article/99", params: { id: "99" } }))).toBeNull();
        expect(page.metadata(ctx({ url: "http://qe24-dyn.test/article/99", params: {} }))).toBeNull();
    });

    /* The beat is one-way module state, so the two state-dependent tests
       each load their OWN fresh instance (fresh DYN) instead of sharing
       the beforeAll one - order-independent either way. */

    it("P4 /state shows the visit counter and the beat-flipped phase", () => {
        const sdk2 = stubSdk();
        const mod2 = runMod(readFileSync(MOD_JS_PATH, "utf8"), sdk2 as unknown) as { beat: () => void };
        const site2 = new (sdk2.__registered.websites[0])();
        const page = site2.Pages.find((p: any) => p.path === "/state");
        const first = page.metadata(ctx({}));
        expect(first.html).toContain("Phase: <b>claimed</b>");
        expect(first.html).toContain("Visits to this page this session: <b>1</b>");
        const second = page.metadata(ctx({}));
        expect(second.html).toContain("<b>2</b>");
        // The quest fires the beat on the first /state visit; the mod
        // exports the same function for this test.
        mod2.beat();
        const third = page.metadata(ctx({}));
        expect(third.html).toContain("Phase: <b>beat-fired</b>");
        expect(third.html).toContain("<b>3</b>");
    });

    it("P5 /news lists the three articles and reorders after the beat (the bcc pattern)", () => {
        const sdk3 = stubSdk();
        const mod3 = runMod(readFileSync(MOD_JS_PATH, "utf8"), sdk3 as unknown) as { beat: () => void; state: { news: string[] } };
        const site3 = new (sdk3.__registered.websites[0])();
        const page = site3.Pages.find((p: any) => p.path === "/news");
        const before = page.metadata(ctx({}));
        expect(before.html).toContain("harbour cranes back in service");
        expect(before.html).not.toContain("UPDATE: probe quest beat fired");
        mod3.beat();
        const after = page.metadata(ctx({}));
        const updateAt = after.html.indexOf("UPDATE: probe quest beat fired");
        const oldTopAt = after.html.indexOf("harbour cranes back in service");
        expect(updateAt).toBeGreaterThan(0);
        expect(oldTopAt).toBeGreaterThan(updateAt);
        expect(mod3.state.news).toHaveLength(4);
    });

    it("P7 /exports exposes a per-page function that captures the request", () => {
        const page = pages.find((p) => p.path === "/exports");
        const meta = page.metadata(ctx({ url: "http://qe24-dyn.test/exports?article=2", query: { article: "2" } }));
        expect(meta.exports.currentArticle()).toBe("article-2");
        expect(meta.html).toContain("currentArticle()");
    });

    it("site Exports are callable and reach both page kinds", () => {
        expect(site.Exports.dynGreeting("zeis")).toBe("Greetings, zeis - site-level export");
        const staticPage = pages.find((p) => p.path === "/");
        expect(staticPage.html).toContain("dynGreeting(\"tester\")");
        const dynPage = pages.find((p) => p.path === "/site-exports");
        expect(dynPage.metadata(ctx({})).html).toContain("dynGreeting(\"zeis\")");
    });

    it("the quest carries the DP rows as objectives, in run order", () => {
        const quest = new (sdk.__registered.quests[0])();
        const names = quest.Objectives.map((o: { name: string }) => o.name);
        expect(names).toEqual([
            "dp-01-control",
            "dp-02-echo",
            "dp-03-article-hit",
            "dp-04-article-miss",
            "dp-05-news-before",
            "dp-06-beat-command",
            "dp-07-news-after",
            "dp-08-state-twice",
            "dp-09-direct-mail",
            "dp-10-bridge-mail",
            "dp-11-page-exports",
            "dp-12-site-exports",
            "dp-13-http-events",
            "dp-14-tick-rows",
            "dp-16-mail-to-field",
            "dp-17-inbox-roll-call",
            "dp-15-how-to-claim",
        ]);
        expect(quest.HackhubPost.content).toContain("qe24-dyn.test");
    });

    /* ── r246 additions ─────────────────────────────────────────────────── */

    it("the beat is fired by the qedyn command, not by an HTTP event", () => {
        // r241/r242: Http.Response never reaches a mod for its own site, so
        // the r238 beat - wired to that event - could never fire and the
        // bcc.com A/B never ran its "after" half.
        const sdk2 = stubSdk();
        const mod2 = runMod(readFileSync(MOD_JS_PATH, "utf8"), sdk2 as unknown) as {
            beat: (src?: string) => boolean;
            state: { beatFired: boolean; beatSource: string; news: string[] };
        };
        expect(sdk2.__registered.commands).toHaveLength(1);
        const cmd = new (sdk2.__registered.commands[0])();
        expect(cmd.CommandName).toBe("qedyn");
        expect(mod2.state.beatFired).toBe(false);
        cmd.Run(toolsWith("beat"));
        expect(mod2.state.beatFired).toBe(true);
        expect(mod2.state.beatSource).toBe("qedyn beat");
        // The front page gained the UPDATE article on top.
        expect(mod2.state.news[0]).toContain("UPDATE:");
    });

    it("P6 /form prints what Mail.send RETURNED, and offers the emit bridge", () => {
        const page = pages.find((p: { path: string }) => p.path === "/form");
        const html = page.metadata(ctx({})).html;
        // r245: the old page printed its own "sent" text and threw the
        // engine's answer away. Now the return value is the whole point.
        expect(html).toContain("var id = HackhubSDK.Mail.send(");
        expect(html).toContain("(null = refused, an id = accepted)");
        expect(html).toContain("qe24DynBridge()");
        expect(html).toContain("bridgeSendMail");
    });

    it("the bridge export emits instead of sending, and the listener sends", () => {
        // The documented workaround: an Exports function may not do anything
        // permissioned (it loses its mod identity - docs/03 §14); it may only
        // emit. The real send happens in a top-level listener.
        const sdk3 = stubSdk();
        const mod3 = runMod(readFileSync(MOD_JS_PATH, "utf8"), sdk3 as unknown) as {
            state: { mailBridged: string };
            BRIDGE_EVENT: string;
        };
        const site3 = new (sdk3.__registered.websites[0])();
        expect(typeof site3.Exports.bridgeSendMail).toBe("function");
        expect(sdk3.__sent).toHaveLength(0);
        const result = site3.Exports.bridgeSendMail();
        expect(result).toBe("emitted");
        // One emit, and the listener's Mail.send is what actually ran.
        expect(sdk3.__emitted).toHaveLength(1);
        expect(sdk3.__emitted[0].name).toBe(mod3.BRIDGE_EVENT);
        expect(sdk3.__sent).toHaveLength(1);
        expect(sdk3.__sent[0].subject).toContain("QE24 dynprobe: talk-back");
        // The listener recorded what the send returned (an id here, null in
        // game if the call is refused) - the value DP-09/DP-10 ask for.
        expect(mod3.state.mailBridged).toBe("mail-id-1");
    });

    it("the /form page addresses its mails to the player, not to a placeholder (r250)", () => {
        // Button A (direct) and button B (the bridge) both used to carry
        // to: "player@gomail.com". That address never existed, so the mail
        // that never arrived was read as evidence that a page cannot send -
        // which is a conclusion about the game drawn from our own typo.
        const sdk10 = stubSdk();
        runMod(readFileSync(MOD_JS_PATH, "utf8"), sdk10 as unknown);
        const site = new (sdk10.__registered.websites[0])();
        const form = site.Pages.find((p: any) => p.path === "/form");
        const html = form.metadata(ctx({})).html;
        expect(html).not.toContain("player@gomail.com");
        // Button A is the direct page-context send; it no longer names a
        // recipient, so the game's own default (the player) applies.
        expect(html).toContain("var id = HackhubSDK.Mail.send(");
        expect(html).toContain("button A, r250");
        expect(html).toContain("bridgeSendMail");
    });

    it("a missing sdk.Command must not stop the mod from loading (r247)", () => {
        // r247: `class QEDynCommand extends sdk.Command` sat at module level,
        // so on an SDK without Command the whole file aborted - no site, no
        // quest, no feed post. That is how a missing feed post looked like a
        // game bug for a day.
        const broken = stubSdk();
        delete (broken as Record<string, unknown>).Command;
        delete (broken as Record<string, unknown>).RegisterCommand;
        expect(() => runMod(readFileSync(MOD_JS_PATH, "utf8"), broken as unknown)).not.toThrow();
        expect(broken.__registered.websites).toHaveLength(1);
        expect(broken.__registered.quests).toHaveLength(1);
        expect(broken.__registered.commands).toHaveLength(0);
    });

    it("qedyn prints to the terminal, not only to the log (r248)", () => {
        // r248: `qedyn status` printed nothing at the terminal - every
        // subcommand wrote to the game log only, so it looked like a no-op.
        const sdk6 = stubSdk();
        runMod(readFileSync(MOD_JS_PATH, "utf8"), sdk6 as unknown);
        const printed: string[] = [];
        const tools = { getArgs: () => ["status"], println: (t: string) => { printed.push(String(t)); } };
        new (sdk6.__registered.commands[0])().Run(tools);
        expect(printed.length).toBeGreaterThan(0);
        expect(printed.join("\n")).toContain("Http.Response events offered to this mod: 0");
    });

    it("qedyn tick accepts a row NUMBER and says when the quest is not claimed", () => {
        // r248: `qedyn tick 1` did nothing and said nothing - it wanted a
        // full row name and silently ignored anything else.
        const sdk7 = stubSdk();
        runMod(readFileSync(MOD_JS_PATH, "utf8"), sdk7 as unknown);
        const printed: string[] = [];
        let args: string[] = [];
        const tools = { getArgs: () => args, println: (t: string) => { printed.push(String(t)); } };
        const cmd = new (sdk7.__registered.commands[0])();
        // Not claimed yet: it must say so rather than fail silently.
        args = ["tick", "1"];
        cmd.Run(tools);
        expect(printed.join("\n")).toContain("not claimed");
        // Claimed, with a number: it must resolve to that row's name.
        const quest = new (sdk7.__registered.quests[0])();
        quest.OnStart();
        printed.length = 0;
        cmd.Run(tools);
        expect(printed.join("\n")).toContain("dp-01-control");
    });

    it("`qedyn mail` addresses every mail somewhere real, and one nowhere on purpose (r250)", () => {
        // r250: the "to: loses mails" finding was measuring our own
        // placeholder - player@gomail.com was copied out of this repo's QA
        // project and has never existed, so of course nothing arrived. The
        // game's rule is that an absent `to` means the player. So: a control
        // with no `to`, one with the real address, and one deliberately
        // addressed nowhere to record how the game reports that.
        // The regression worth pinning is that the placeholder never comes
        // back - a test that sends mail to an address that does not exist is
        // a test that measures itself.
        const sdk8 = stubSdk();
        runMod(readFileSync(MOD_JS_PATH, "utf8"), sdk8 as unknown);
        const printed: string[] = [];
        const cmd = new (sdk8.__registered.commands[0])();
        cmd.Run({ getArgs: () => ["mail"], println: (t: string) => { printed.push(String(t)); } });
        expect(sdk8.__sent).toHaveLength(3);
        // 1: no `to` at all - the shape that has always arrived.
        expect(sdk8.__sent[0].to).toBeUndefined();
        // 2: the player's real address, straight from the SDK.
        expect(sdk8.__sent[1].to).toBe("tester@gomail.com");
        // 3: a deliberately non-existent address - expected to go nowhere.
        expect(sdk8.__sent[2].to).toBe("no-such-inbox@qe24-does-not-exist.test");
        expect(sdk8.__sent[0].subject).toContain("[1 no-to]");
        expect(sdk8.__sent[1].subject).toContain("[2 real-to");
        expect(sdk8.__sent[2].subject).toContain("[3 bogus-to]");
        // The player must be told their own address - otherwise mail 2
        // cannot be read back.
        expect(printed.join("\n")).toContain("tester@gomail.com");
        // And the placeholder must never come back: every probe mail is
        // either addressed to the player or deliberately nowhere.
        const addressed = sdk8.__sent.map((m: any) => m.to).filter(Boolean);
        expect(addressed).not.toContain("player@gomail.com");
    });

    it("no probe mail is addressed to the placeholder that never existed (r250)", () => {
        // The r248/r249 runs sent to player@gomail.com, a placeholder out of
        // this repo's own QA project, and then theorised about why the game
        // lost those mails. This pins the lesson: every address a probe sends
        // to must be real (the player's) or deliberately bogus and labelled.
        const src = readFileSync(MOD_JS_PATH, "utf8");
        // Only comments may mention it, never a live `to:` value.
        const liveAddresses = src.split("\n").filter(
            (line) => /to:\s*["\']/.test(line) && !/^\s*(\/\/|\/?\*)/.test(line),
        );
        expect(liveAddresses.join("\n")).not.toContain("player@gomail.com");
    });

    it("`qedyn inbox` lists what the game says is in the inbox (r249)", () => {
        // A mail that never shows up could be dropped, or present and simply
        // not drawn. getInbox() separates those, and they are different bugs.
        const sdk9 = stubSdk();
        runMod(readFileSync(MOD_JS_PATH, "utf8"), sdk9 as unknown);
        const cmd = new (sdk9.__registered.commands[0])();
        // Empty inbox: it must say so rather than print nothing at all.
        let printed: string[] = [];
        let tools = { getArgs: () => ["inbox"], println: (t: string) => { printed.push(String(t)); } };
        cmd.Run(tools);
        expect(printed.join("\n")).toContain("empty inbox");
        // A mail that arrived only in the data, not on screen.
        sdk9.__inbox.push({ id: "m1", from: "qe24-dyn@qe24.test", to: "player@gomail.com", subject: "the lost one", read: false, sentAt: 0 });
        printed = [];
        tools = { getArgs: () => ["inbox"], println: (t: string) => { printed.push(String(t)); } };
        cmd.Run(tools);
        const text = printed.join("\n");
        expect(text).toContain("the inbox holds 1 mail");
        expect(text).toContain("the lost one");
        expect(text).toContain("to=player@gomail.com");
    });

    it("`qedyn claim` claims the quest without the feed (docs/03 §21)", () => {
        const sdk5 = stubSdk();
        const claimed: any[] = [];
        (sdk5.Quest as unknown as { claim: (q: unknown) => void }).claim = (q) => { claimed.push(q); };
        runMod(readFileSync(MOD_JS_PATH, "utf8"), sdk5 as unknown);
        const cmd = new (sdk5.__registered.commands[0])();
        cmd.Run(toolsWith("claim"));
        expect(claimed).toEqual([sdk5.__registered.quests[0]]);
    });

    it("every Http.Response is logged BEFORE the host filter (r242's flaw)", () => {
        const sdk4 = stubSdk();
        const mod4 = runMod(readFileSync(MOD_JS_PATH, "utf8"), sdk4 as unknown) as {
            state: { httpEvents: string[] };
        };
        const quest = new (sdk4.__registered.quests[0])();
        quest.OnObjectivesStart();
        const http = sdk4.__listeners.find((l: { name: string }) => l.name === "Http.Response");
        if (!http) throw new Error("the quest registered no Http.Response listener");
        // An event for a DIFFERENT host must still be recorded - that is what
        // separates "no event fired" from "an event with an unexpected host".
        http.cb({ request: { host: "somewhere.else", method: "GET", path: "/" } });
        expect(mod4.state.httpEvents).toHaveLength(1);
        expect(mod4.state.httpEvents[0]).toContain("somewhere.else");
    });
});
