"use strict";

/*
 * QE24 Dynamic Page Probe (r238)
 *
 * Hand-authored QA mod for SDK 0.24's DYNAMIC website pages - the surface the
 * no-code editor does not expose yet (docs/plans/r237). It registers one site
 * (qe24-dyn.test) carrying one static control page plus seven dynamic pages,
 * each answering one or more of the open questions from the r237
 * investigation:
 *
 *   /                static control + site-level Exports from a STATIC page
 *   /echo            per-request content from the QUERY string + raw
 *                    PageContext dump (what url/params/searchStr actually
 *                    carry)
 *   /article/:id     per-request content from PATH PARAMS + a record lookup
 *                    + the null -> 404 behaviour
 *   /state           quest-state dependency + the VISIT COUNTER (the caching
 *                    probe: a cached page would never advance its counter)
 *   /news            the bcc.com pattern: a front-page article list that
 *                    gains a new top article when the quest's beat fires
 *   /form            the iframe HackhubSDK bridge - a page button that sends
 *                    a mail the quest can hear
 *   /exports         per-page Exports (functions callable in the page's
 *                    inline scripts, capturing the request)
 *   /site-exports    site-level Exports from a DYNAMIC page
 *
 * The quest's twelve objectives are the QA checklist, in the order to run
 * them (docs/plans/r238-dynamic-pages-probe.md). Nothing auto-starts; claim
 * QEDynProbeQuest from the Hackhub feed post.
 */
var sdk = require("@hotbunny/hackhub-content-sdk");

var MOD_ID = "qe-sdk-024-dynprobe";
var HOST = "qe24-dyn.test";
var MAIL_MARKER = "QE24 dynprobe: talk-back";

function log(message) {
    try { console.log("[" + MOD_ID + "] " + message); } catch (_e) {}
}

function safe(label, fn, fallback) {
    try {
        return fn();
    } catch (e) {
        log(label + " failed: " + (e && e.message ? e.message : e));
        return fallback;
    }
}

function completeObjectiveSafe(quest, name) {
    safe("completeObjective(" + name + ")", function () { quest.completeObjective(name); });
}

function sendMailSafe(subject, body) {
    safe("Mail.send(" + subject + ")", function () {
        if (sdk.Mail && sdk.Mail.send) {
            sdk.Mail.send({ from: "qa@qe24.test", subject: subject, content: body });
        }
    });
}

/* ── Probe state ────────────────────────────────────────────────────────────
   Module-level, deliberately NOT quest Data: a Website is a mod-level
   registration with no quest context, so this mirrors how the editor's
   future emitted handlers would share state (the same runtime closure the
   quest and the pages both live in).
   `visits` is the caching probe: every dynamic response increments its
   counter. If the game caches a page, a re-visit shows an OLD counter. */
var DYN = {
    phase: "claimed",
    beatFired: false,
    beatSource: "(none yet)",
    /* r246: every Http.Response the mod is offered, logged BEFORE any
       filtering - r242's listener filtered on host first and logged second,
       so "no event" and "event with a different host" looked identical. */
    httpEvents: [],
    mailDirect: "(not tried yet)",
    mailBridged: "(not tried yet)",
    mailWithTo: "(not sent yet)",
    mailNoTo: "(not sent yet)",
    /* r249: run 3 - only the mail with NO to: arrived, so the recipient
       field is what loses them. Two new records: the mail sent to the
       player's REAL address, and the address itself. */
    mailRealTo: "(not sent yet)",
    mailBogus: "(not sent yet)",
    playerEmail: "(not read yet)",
    visits: { state: 0, news: 0 },
    /* The /news front page. The beat PREPENDS an article, so the previous
       top story drops one slot - the bcc.com pattern, for the A/B. */
    news: [
        "Top story: harbour cranes back in service after the long repair",
        "City council votes to extend the night market through the weekend",
        "Local chess club's underdog wins the regional cup"
    ],
    beatArticle: "UPDATE: probe quest beat fired - this article just appeared on top"
};

/* Fire the quest's beat: flip the phase and prepend the update article.
   r246: fired by the `qedyn beat` TERMINAL COMMAND, not by an HTTP event -
   r241/r242 showed Http.Response never reaches a mod for its own site, so
   the r238 beat (which hung off that event) could never fire and the
   bcc.com A/B never ran its "after" half. Command.Run() is a trusted context
   (docs/03 §14) and needs no harness. Exported below for the smoke test. */
function fireBeat(source) {
    if (DYN.beatFired) return false;
    DYN.beatFired = true;
    DYN.beatSource = source || "unknown";
    DYN.phase = "beat-fired";
    DYN.news.unshift(DYN.beatArticle);
    log("beat fired (source=" + DYN.beatSource + "): phase=" + DYN.phase +
        ", news now " + DYN.news.length + " articles");
    return true;
}

/* ── The mail bridge (r246) ───────────────────────────────────────────────
   r245 proved the A/B: a mail sent from the quest's OnStart arrives, the same
   call from a page's own script does not, and the difference is the calling
   context. The documented workaround is to let the page only EMIT, and do the
   real permissioned send in a listener. Button B on /form exercises exactly
   that, so we learn whether the workaround actually delivers. */
var BRIDGE_EVENT = "qe24-dyn:send-mail";
/* The live quest instance, set in OnStart so `qedyn tick <row>` can check a
   row off. Null until the quest is claimed. */
var QUEST_REF = null;
if (sdk.Events && typeof sdk.Events.register === "function") {
    safe("register bridge event", function () { sdk.Events.register(BRIDGE_EVENT); });
}
if (sdk.Events && typeof sdk.Events.on === "function") {
    sdk.Events.on(BRIDGE_EVENT, function (data) {
        log("bridge: handler reached - sending for real from a trusted context");
        var id = null;
        safe("bridge Mail.send", function () { id = sdk.Mail.send(data || {}); });
        DYN.mailBridged = (id === null || id === undefined) ? "null" : String(id);
        log("bridge: Mail.send returned " + DYN.mailBridged);
    });
}

/* The /article library - static records, so a hit renders the record and a
   miss (a number with no record) returns null -> the page does not exist. */
var LIBRARY = {
    "1": { title: "Article one: the lighthouse ledger", body: "The keeper's ledger lists three ships that never arrived." },
    "2": { title: "Article two: the missing ferry timetable", body: "The last ferry left before the fog; the timetable page has been blank since." },
    "3": { title: "Article three: who owns dock nine", body: "Three companies claim the same dock. None of them answers the phone." }
};

function articleIdFrom(ctx) {
    /* Try the declared route param first (question 1 of r237: the pattern
       syntax is not documented in the declarations - the /echo dump shows
       what the game actually passes). If params is empty, fall back to
       reading the number off the raw URL, so the LOOKUP and 404 rows are
       answerable even if the pattern syntax is different. */
    if (ctx.params && ctx.params.id) return String(ctx.params.id);
    var m = /\/article\/([A-Za-z0-9]+)/.exec(ctx.url || "");
    return m ? m[1] : null;
}

/* ── The site ────────────────────────────────────────────────────────────── */
class QEDynProbeSite extends sdk.Website {
    constructor() {
        super(...arguments);
        this.SiteName = "QE24 Dynamic Page Probe";
        this.Host = HOST;
        /* The editor emits "" here for generated sites (r129 rule: every
           website in Nemesis sets Icon, including to ""). */
        this.Icon = "";
        /* Site-level Exports: callable as a global in EVERY page's HTML
           (static or dynamic). P1 and /site-exports both call this to check
           the global from both page kinds. */
        this.Exports = {
            dynGreeting: function (name) {
                return "Greetings, " + (name || "stranger") + " - site-level export";
            },
            /* r246: an Exports function may not do anything permissioned
               itself (docs/03 §14 - it loses its mod identity), but it CAN
               emit. The real Mail.send lives in the top-level listener
               above. This is the other modder's documented fix pattern, put
               to the test rather than taken on trust. */
            bridgeSendMail: function () {
                log("bridge: page asked for a mail - emitting only");
                if (sdk.Events && sdk.Events.emit) {
                    sdk.Events.emit(BRIDGE_EVENT, {
                        /* r250: this used to carry to: "player@gomail.com" -
                           a placeholder out of this repo's own QA project
                           that has never existed, so the mail went nowhere
                           and came back looking like a page-context bug.
                           No to: field means the player. */
                        from: "qe24-dyn@qe24.test",
                        subject: MAIL_MARKER + " [bridged, no to:]",
                        content: "Bridged send from the /form page (button B, r250 - now addressed to you)."
                    });
                    return "emitted";
                }
                return "NO sdk.Events.emit";
            }
        };
        var self = this;
        this.Pages = [
            /* P1 - the STATIC control. Everything else on this site is a
               per-request function; this page is the same for everyone,
               every time. It also answers the bonus question: do site
               Exports reach STATIC pages? */
            {
                path: "/",
                title: "QE24 dynprobe - static control",
                html: "<h1>Static control</h1><p>This is the only page on this site that is the same for everyone, every time. Every other page is printed on the spot for each visit.</p><p>Site-export call from a static page: <span id=\"sx\"></span></p><script>try { document.getElementById(\"sx\").textContent = dynGreeting(\"tester\"); } catch (e) { document.getElementById(\"sx\").textContent = \"NO dynGreeting global: \" + e.message; }</script>",
                seo: true
            },
            /* P2 - /echo: the QUERY-string probe + the raw PageContext dump
               (the evidence for r237 question 1). */
            {
                path: "/echo",
                seo: true,
                metadata: function (ctx) {
                    var msg = (ctx.query && ctx.query.msg) || "(no msg given)";
                    return {
                        title: "QE24 echo",
                        html: "<h1>Echo</h1><p>You asked for: <b>" + msg + "</b></p><p>Raw PageContext the game passed to this page (question 1 evidence):</p><pre>" + safe("JSON.stringify(ctx)", function () { return JSON.stringify({ url: ctx.url, params: ctx.params, query: ctx.query, searchStr: ctx.searchStr, allKeys: Object.keys(ctx || {}) }, null, 2); }, "ctx unreadable") + "</pre>"
                    };
                }
            },
            /* P3 - /article/:id: the record-lookup probe. A known number
               renders its record; an unknown number returns null, which the
               declaration says makes the page not exist (question 5). */
            {
                path: "/article/:id",
                seo: true,
                metadata: function (ctx) {
                    var id = articleIdFrom(ctx);
                    var rec = id ? LIBRARY[id] : null;
                    if (!rec) {
                        log("article miss: id=" + id + " -> null (404?)");
                        return null;
                    }
                    log("article hit: id=" + id);
                    return {
                        title: rec.title,
                        html: "<h1>" + rec.title + "</h1><p>" + rec.body + "</p><p>params as passed: <pre>" + safe("JSON.stringify(ctx.params)", function () { return JSON.stringify(ctx.params); }, "?") + "</pre></p><p>Other articles: <a href=\"/article/1\">1</a> <a href=\"/article/2\">2</a> <a href=\"/article/3\">3</a> - try <a href=\"/article/99\">99</a> (should not exist).</p>"
                    };
                }
            },
            /* P4 - /state: the caching probe. Every visit increments
               DYN.visits.state and the page shows it; the quest flips the
               phase on the first visit. A second visit that still shows
               visits: 1 is a cached response (question 3). */
            {
                path: "/state",
                seo: true,
                metadata: function () {
                    DYN.visits.state += 1;
                    log("state visit " + DYN.visits.state + " (phase=" + DYN.phase + ")");
                    return {
                        title: "QE24 state",
                        html: "<h1>State page</h1><p>Phase: <b>" + DYN.phase + "</b></p><p>Visits to this page this session: <b>" + DYN.visits.state + "</b></p><p>If you have visited this page before and the number did NOT go up, the game served a cached copy (question 3).</p>"
                    };
                }
            },
            /* P5 - /news: the bcc.com pattern (Zeis's reference). A
               front-page article list; the beat prepends an article so the
               previous top story drops one slot. */
            {
                path: "/news",
                seo: true,
                metadata: function () {
                    DYN.visits.news += 1;
                    log("news visit " + DYN.visits.news);
                    var items = DYN.news.map(function (t, i) { return "<li>" + (i + 1) + ". " + t + "</li>"; }).join("");
                    return {
                        title: "QE24 News Front Page",
                        html: "<h1>QE24 News</h1><p>Visits to this page this session: <b>" + DYN.visits.news + "</b></p><ol>" + items + "</ol><p>After the quest's beat fires (first /state visit), a new article appears on top and these drop one slot - compare with bcc.com's front page.</p>"
                    };
                }
            },
            /* P6 - /form: the page-context permission probe (r246). Two
               buttons: A calls HackhubSDK.Mail.send DIRECTLY and PRINTS what
               it returned, B goes through the emit bridge. r250: neither
               carries a "to" any more - an absent to: means the player, and
               the one they used to carry (player@gomail.com) was a placeholder
               out of this repo's own QA project that has never existed, so the
               mail that never arrived proved nothing about page context.
               it returned (r245: the r238 page never captured the return
               value, so "sent" was our own text, not the engine's answer);
               B goes through the emit bridge above, which is the documented
               workaround. The A/B in r245 says A will not deliver. */
            {
                path: "/form",
                seo: true,
                metadata: function () {
                    var lines = [
                        "<h1>Talk-back form</h1>",
                        "<p>HackhubSDK global in this iframe: <span id=\"sdkdef\">?</span></p>",
                        "<h2>Button A - direct call from page script</h2>",
                        "<button onclick=\"qe24DynSend()\">Send directly from this page</button>",
                        "<p>Returned: <span id=\"res\">not tried yet</span></p>",
                        "<h2>Button B - the Events.emit bridge (the workaround)</h2>",
                        "<button onclick=\"qe24DynBridge()\">Send through the bridge</button>",
                        "<p>Result: <span id=\"res2\">not tried yet</span></p>",
                        "<p>Then check the inbox (and the log) for BOTH mails, and type <code>qedyn status</code> in the terminal.</p>",
                        "<script>",
                        "document.getElementById(\"sdkdef\").textContent = (typeof HackhubSDK !== \"undefined\") ? \"yes\" : \"no\";",
                        "function qe24DynSend() {",
                        "  var out = document.getElementById(\"res\");",
                        "  try {",
                        "    if (typeof HackhubSDK === \"undefined\") { out.textContent = \"NO HackhubSDK global\"; return; }",
                        "    if (!HackhubSDK.Mail || !HackhubSDK.Mail.send) { out.textContent = \"HackhubSDK exists but no Mail.send\"; return; }",
                        "    var id = HackhubSDK.Mail.send({ from: \"qe24-dyn@qe24.test\", subject: \"" + MAIL_MARKER + "\", content: \"Direct send from the /form page (button A, r250).\" });",
                        "    out.textContent = String(id) + \"  (null = refused, an id = accepted)\";",
                        "  } catch (e) { out.textContent = \"ERR: \" + (e && e.message ? e.message : e); }",
                        "}",
                        "function qe24DynBridge() {",
                        "  var out = document.getElementById(\"res2\");",
                        "  try {",
                        "    if (typeof bridgeSendMail !== \"function\") { out.textContent = \"NO bridgeSendMail export\"; return; }",
                        "    out.textContent = String(bridgeSendMail()) + \" - the listener logs what Mail.send returned\";",
                        "  } catch (e) { out.textContent = \"ERR: \" + (e && e.message ? e.message : e); }",
                        "}",
                        "</script>"
                    ];
                    return { title: "QE24 talk-back form", html: lines.join("\n") };
                }
            },
            /* P7 - /exports: per-page Exports. The handler returns
               exports.currentArticle, a function capturing THIS request's
               ctx, callable from the page's inline script. */
            {
                path: "/exports",
                seo: true,
                metadata: function (ctx) {
                    return {
                        title: "QE24 per-page exports",
                        html: "<h1>Per-page exports</h1><p>What <code>currentArticle()</code> (this page's own export, built from the request you just made) says: <span id=\"out\">?</span></p><script>try { var v = currentArticle(); document.getElementById(\"out\").textContent = (typeof v === \"function\") ? \"callable value (unexpected)\" : String(v); } catch (e) { document.getElementById(\"out\").textContent = \"NO currentArticle global: \" + e.message; } </script>",
                        exports: {
                            currentArticle: function () {
                                var id = (ctx.params && ctx.params.article) || (ctx.query && ctx.query.article) || "none";
                                log("currentArticle() called with id=" + id);
                                return "article-" + id;
                            }
                        }
                    };
                }
            },
            /* P8 - /site-exports: the same site-level dynGreeting called
               from a DYNAMIC page (P1 calls it from the static one). */
            {
                path: "/site-exports",
                seo: true,
                metadata: function () {
                    return {
                        title: "QE24 site exports (dynamic page)",
                        html: "<h1>Site exports, dynamic page</h1><p>dynGreeting from a dynamic page: <span id=\"sx\">?</span></p><script>try { document.getElementById(\"sx\").textContent = dynGreeting(\"zeis\"); } catch (e) { document.getElementById(\"sx\").textContent = \"NO dynGreeting global: \" + e.message; } </script>"
                    };
                }
            }
        ];
    }
}
sdk.RegisterWebsite(QEDynProbeSite);

/* ── The quest (the QA checklist, in run order) ───────────────────────────── */
class QEDynProbeQuest extends sdk.Quest {
    constructor() {
        super();
        this.Name = "QEDynProbeQuest";
        this.Title = "QE24 dynamic page probe";
        this.Description = "Developer QA probe for SDK 0.24 dynamic website pages (r238). The objectives are the checklist, in order: work top to bottom in the tracker. Nothing is a puzzle - each row is one thing to open, one thing to read, one thing to write down.";
        this.Group = "sandbox";
        this.AutoStart = false;
        this.AutoComplete = false;
        this.HasCompleteButton = false;
        this.Abandonable = true;
        this.HackhubPost = {
            content: "QA probe (r238): the dynamic-page quest. Accept to run the twelve rows against http://" + HOST + " - the objectives are the checklist, in order.",
            comments: []
        };
        this.Objectives = [
            { name: "dp-01-control", description: "Open http://" + HOST + "/ - the one static page. Note the site-export line (a greeting = site exports reach a STATIC page)." },
            { name: "dp-02-echo", description: "Open /echo?msg=zeis. WRITE DOWN the raw PageContext box (url, params, query, searchStr) - the path-param evidence." },
            { name: "dp-03-article-hit", description: "Open /article/1. An article should render; write down the 'params as passed' box." },
            { name: "dp-04-article-miss", description: "Open /article/99. WRITE DOWN EXACTLY what the browser shows - this settles the 'page does not exist' look." },
            { name: "dp-05-news-before", description: "Open /news BEFORE firing the beat. Three articles, no UPDATE. Write down their order." },
            { name: "dp-06-beat-command", description: "Type 'qedyn beat' in the terminal (r246: the beat used to hang off Http.Response, which never fires for a mod's own site). The log should print 'beat fired'. WRITE DOWN that line." },
            { name: "dp-07-news-after", description: "Open /news AGAIN. The UPDATE article must now be #1 and the old three drop one slot - the bcc.com pattern. Compare with bcc.com if you have a questline save." },
            { name: "dp-08-state-twice", description: "Open /state twice. The visit counter must climb (expect it to jump by TWO per open - the double render). Phase should read beat-fired." },
            { name: "dp-09-direct-mail", description: "Open /form and click BUTTON A. WRITE DOWN what Mail.send RETURNED: 'null' means refused, an id means accepted. Then check the inbox - r250 finally addresses this one to YOU (earlier builds sent it to a placeholder that never existed, so the missing mail proved nothing)." },
            { name: "dp-10-bridge-mail", description: "Click BUTTON B (the Events.emit bridge). Check the inbox: did THIS mail arrive? If yes, the documented workaround works and the editor can generate it. (Same r250 correction as dp-09: it is addressed to you now.)" },
            { name: "dp-11-page-exports", description: "Open /exports?article=2. The span should read article-2 (a per-page export built from this request)." },
            { name: "dp-12-site-exports", description: "Open /site-exports. The line should show a greeting - site exports from a DYNAMIC page (dp-01 checked the static one)." },
            { name: "dp-13-http-events", description: "Type 'qedyn status' in the terminal. It prints how many Http.Response events the mod was offered, and every one of them. Zero is the expected result and the finding - write the line down anyway." },
            { name: "dp-14-tick-rows", description: "Housekeeping: if a row's objective does not tick by itself (they mostly cannot - Http.Response never reaches the mod), type 'qedyn tick <row-name>' to check it off and keep your place." },
            { name: "dp-16-mail-to-field", description: "Type 'qedyn mail'. It sends three mails - one with NO to: (the shape that always arrived), one to YOUR REAL address, and one to a deliberately non-existent address - and prints all three ids plus your address. 1 and 2 should arrive; 3 will not, and the interesting part is whether the game SAYS so." },
            { name: "dp-17-inbox-roll-call", description: "Type 'qedyn inbox'. It lists every mail the game says is in the inbox, with its to: field. If a mail that never showed up IS in this list, the mail exists and the inbox screen is not drawing it." },
            { name: "dp-15-how-to-claim", description: "Did this quest appear on your Hackhub feed? If NOT: type 'qedyn claim' in the terminal, or claim it by hand from the sandbox group in the journal, and tell us - mod quest posts may simply have stopped surfacing (docs/03 §21)." }
        ];
    }
    CreateData() { return {}; }
    OnStart() {
        QUEST_REF = this;
        log("QEDynProbeQuest started");
        sendMailSafe("QE24 dynamic page probe",
            "The dynamic-page probe is live on http://" + HOST + ".\n\nThe quest objectives are the checklist - run them top to bottom in the tracker. Rows that say WRITE DOWN need a note for STATUS.md (the plan doc: docs/plans/r238-dynamic-pages-probe.md).\n\nRow 6 (first /state visit) fires the beat automatically - no terminal needed.");
    }
    OnObjectivesStart() {
        var self = this;
        var stateSeen = 0;
        var newsSeenBeforeBeat = false;
        var newsSeenAfterBeat = false;
        function onHttp(tx) {
            /* r246: LOG FIRST, FILTER SECOND. r242's listener filtered on
               host before logging, so "the event never fired" and "the event
               arrived with a host we did not expect" were indistinguishable
               - which is exactly the question still open. */
            var seen = JSON.stringify(tx && tx.request ? tx.request : tx);
            DYN.httpEvents.push(seen);
            log("http-response-seen: " + seen);
            if (!tx || !tx.request || tx.request.host !== HOST) return;
            var path = tx.request.path || "";
            if (path === "/" || path === "") {
                completeObjectiveSafe(self, "dp-01-control");
            } else if (path === "/echo") {
                completeObjectiveSafe(self, "dp-02-echo");
            } else if (/^\/article\//.test(path)) {
                var id = path.split("/")[2] || "";
                if (LIBRARY[id]) {
                    completeObjectiveSafe(self, "dp-03-article-hit");
                } else {
                    completeObjectiveSafe(self, "dp-04-article-miss");
                }
            } else if (path === "/state") {
                stateSeen += 1;
                completeObjectiveSafe(self, "dp-08-state-twice");
            } else if (path === "/news") {
                if (!DYN.beatFired) {
                    newsSeenBeforeBeat = true;
                    completeObjectiveSafe(self, "dp-05-news-before");
                } else if (newsSeenBeforeBeat) {
                    newsSeenAfterBeat = true;
                    completeObjectiveSafe(self, "dp-08-news-after");
                }
            } else if (path === "/form") {
                completeObjectiveSafe(self, "dp-09-talkback");
            } else if (path === "/exports") {
                completeObjectiveSafe(self, "dp-11-page-exports");
            } else if (path === "/site-exports") {
                completeObjectiveSafe(self, "dp-12-site-exports-dyn");
            }
        }
        this.Events.on("Http.Response", onHttp);
        this.Events.on("Mail.Sent", function (tx) {
            /* The marker subject is the only thing this probe controls on
               the send path - same discipline as the r209 mail rows. */
            var subject = tx && (tx.subject || (tx.mail && tx.mail.subject));
            if (subject === MAIL_MARKER) {
                log("mail-from-page: " + subject);
                completeObjectiveSafe(self, "dp-10-mail-from-page");
            }
        });
    }
    OnComplete() { log("QEDynProbeQuest OnComplete fired"); }
    OnAbandon() { log("QEDynProbeQuest abandoned"); }
}
sdk.RegisterQuest(QEDynProbeQuest);

/* ── The qedyn terminal command (r246) ────────────────────────────────────
   The beat has to be fired from a trusted context: Http.Response never
   reaches a mod for its own site (r241/r242), so the r238 beat - which hung
   off that event - could never fire and rows DP-06/07/08 never ran their
   "after" half. `qedyn beat` fixes that with no harness and no guesswork.
   `qedyn status` prints everything the probe recorded, including every
   Http.Response it was offered, which is the evidence row DP-13 wants. */
safe("register qedyn command", function () {
    /* r247: the class definition used to sit at module level, so a missing
       sdk.Command would abort the WHOLE file - no site, no quest, no feed
       post. A command is a convenience; it may never be load-bearing. */
    if (!sdk.Command || typeof sdk.RegisterCommand !== "function") {
        log("command: this SDK exposes no Command/RegisterCommand - the probe still works, just run the rows without the terminal helper");
        return;
    }
    class QEDynCommand extends sdk.Command {
    constructor() {
        super();
        this.CommandName = "qedyn";
        this.Description = "QE24 dynamic page probe: claim, fire the beat, tick a row, print what the probe saw";
        this.Autocomplete = [
            { label: "qedyn", type: "STRING" },
            { label: "claim|beat|mail|inbox|status|tick", type: "STRING" }
        ];
    }
    Run(tools) {
        var args = (tools && tools.getArgs) ? tools.getArgs() : [];
        var sub = args[0] || "status";
        if (sub === "claim") {
            safe("Quest.claim", function () { sdk.Quest.claim(QEDynProbeQuest); });
            out(tools, "claim requested - check the journal");
            return;
        }
        if (sub === "beat") {
            var fired = fireBeat("qedyn beat");
            out(tools, "beat " + (fired ? "fired - /news should now show the UPDATE article on top" : "was already fired earlier"));
            return;
        }
        if (sub === "mail") {
            /* r250 CORRECTION. The address 1.2.0 and 1.3.0 used -
               "player@gomail.com" - was a placeholder copied out of this
               repo's own QA project. It has never existed. The game's rule is
               that a mail with NO to: field goes to the player, so those runs
               compared a real mail against one addressed to nowhere, and the
               "the to: field loses mails" finding was measuring my own
               placeholder. Three mails now, honestly labelled:
                 1  no to: at all               - the shape that always arrived
                 2  your real address            - from Mail.getPlayerEmail()
                 3  a deliberately wrong address - expected to go nowhere;
                    what we are measuring is whether the game SAYS anything
                    (an error, a bounce) or accepts it and stays silent. */
            var idControl = null;
            var idReal = null;
            var idBogus = null;
            var playerEmail = "";
            safe("Mail.getPlayerEmail", function () {
                if (sdk.Mail && typeof sdk.Mail.getPlayerEmail === "function") {
                    playerEmail = String(sdk.Mail.getPlayerEmail() || "");
                }
            });
            DYN.playerEmail = playerEmail || "(Mail.getPlayerEmail unavailable)";
            safe("Mail.send control (no to:)", function () {
                idControl = sdk.Mail.send({
                    from: "qe24-dyn@qe24.test",
                    subject: MAIL_MARKER + " [1 no-to]",
                    content: "Test 1: no to: field - the shape every mail that has ever arrived uses."
                });
            });
            safe("Mail.send to the real address", function () {
                idReal = sdk.Mail.send({
                    from: "qe24-dyn@qe24.test", to: playerEmail,
                    subject: MAIL_MARKER + " [2 real-to " + playerEmail + "]",
                    content: "Test 2: addressed to your real address."
                });
            });
            safe("Mail.send to a non-existent address", function () {
                idBogus = sdk.Mail.send({
                    from: "qe24-dyn@qe24.test", to: "no-such-inbox@qe24-does-not-exist.test",
                    subject: MAIL_MARKER + " [3 bogus-to]",
                    content: "Test 3: addressed nowhere on purpose. Does the game tell you, or stay silent?"
                });
            });
            DYN.mailNoTo = String(idControl);
            DYN.mailRealTo = String(idReal);
            DYN.mailBogus = String(idBogus);
            out(tools, "three mails: 1 no-to=" + DYN.mailNoTo +
                ", 2 real-to=" + DYN.mailRealTo + ", 3 bogus-to=" + DYN.mailBogus);
            out(tools, "your address: " + DYN.playerEmail);
            out(tools, "1 and 2 should both arrive. 3 is addressed nowhere on purpose and will not -");
            out(tools, "the question is whether the game says so (an error, a bounce) or stays silent.");
            return;
        }
        if (sub === "inbox") {
            /* r249: is a lost mail GONE, or present in the data and merely
               not drawn? Mail.getInbox() separates those, and they are two
               completely different bugs with two different fixes. */
            out(tools, "player address: " + DYN.playerEmail);
            var list = null;
            safe("Mail.getInbox", function () {
                if (sdk.Mail && typeof sdk.Mail.getInbox === "function") {
                    list = sdk.Mail.getInbox();
                }
            });
            if (!list || !list.length) {
                out(tools, "Mail.getInbox() returned " + (list ? "an empty inbox" : "nothing (unavailable?)"));
                return;
            }
            out(tools, "the inbox holds " + list.length + " mail(s):");
            for (var m = 0; m < list.length; m++) {
                var item = list[m] || {};
                out(tools, "  [" + m + "] to=" + (item.to || "(none)") +
                    " from=" + (item.from || "?") +
                    " | " + String(item.subject || "(no subject)").slice(0, 64));
            }
            out(tools, "this probe sent: A=" + DYN.mailWithTo + " B=" + DYN.mailNoTo + " C=" + DYN.mailRealTo);
            out(tools, "if A or C is in the LIST above but not on SCREEN, the mail exists and the inbox is not showing it");
            return;
        }
        if (sub === "tick") {
            /* r248: `qedyn tick 1` did nothing at all - this wanted a full row
               name and said nothing when it got something else. */
            var which = args[1];
            if (!which) { out(tools, "tick needs a row: qedyn tick 3   or   qedyn tick dp-05-news-before"); return; }
            if (!QUEST_REF) { out(tools, "the quest is not claimed yet - type 'qedyn claim' first"); return; }
            var name = which;
            if (/^\d+$/.test(which)) {
                var idx = parseInt(which, 10) - 1;
                var row = QUEST_REF.Objectives ? QUEST_REF.Objectives[idx] : null;
                if (!row) { out(tools, "there is no row " + which); return; }
                name = row.name;
            }
            completeObjectiveSafe(QUEST_REF, name);
            out(tools, "ticked " + name);
            return;
        }
        out(tools, "phase=" + DYN.phase + " beatFired=" + DYN.beatFired +
            " beatSource=" + DYN.beatSource +
            " stateVisits=" + DYN.visits.state + " newsVisits=" + DYN.visits.news);
        out(tools, "mail: pageDirect=" + DYN.mailDirect + " pageBridged=" + DYN.mailBridged +
            " noTo=" + DYN.mailNoTo + " realTo=" + DYN.mailRealTo + " bogusTo=" + DYN.mailBogus);
        out(tools, "player address: " + DYN.playerEmail);
        out(tools, "Http.Response events offered to this mod: " + DYN.httpEvents.length);
        for (var i = 0; i < DYN.httpEvents.length; i++) {
            out(tools, "http[" + i + "] " + DYN.httpEvents[i]);
        }
    }
    }
    sdk.RegisterCommand({ default: true, scope: "local" })(QEDynCommand);
    log("command: qedyn registered (claim | beat | mail | inbox | status | tick <row>)");
});

/* A command's audience is the player at the terminal. r248: every subcommand
   logged to the game log and printed nothing, so `qedyn status` looked like a
   no-op. Speak in both places from now on. */
function out(tools, text) {
    log(text);
    if (tools && typeof tools.println === "function") {
        safe("println", function () { tools.println(String(text)); });
    }
}

/* Test hooks for the editor's vitest smoke test (src/compiler/__tests__/
   dynprobeMod.test.ts). The game ignores a mod's module exports. */
module.exports = {
    beat: fireBeat,
    state: DYN,
    HOST: HOST,
    MAIL_MARKER: MAIL_MARKER,
    BRIDGE_EVENT: BRIDGE_EVENT
};
