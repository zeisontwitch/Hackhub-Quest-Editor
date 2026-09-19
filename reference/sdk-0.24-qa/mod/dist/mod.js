"use strict";

/*
 * QE SDK 0.24 QA Harness
 *
 * Hand-authored, ready-to-copy HackHub mod used to verify SDK 0.24 fences in
 * game. It deliberately exercises APIs the no-code editor does not expose yet:
 * Quest.complete(), Quest.retire(), Quest.unclaim(), phone Dialog onEnd
 * completion, Scheduler callbacks and Http route handlers.
 */
var sdk = require("@hotbunny/hackhub-content-sdk");

var MOD_ID = "qe-sdk-024-qa";
var HTTP_HOST = "qe24-http.test";
var COLLAB_DOMAIN = "qe24-collab.test";
var WIFI_SSID = "QE24-RAW-5G";
var WIFI_PASSWORD = "correct-horse-battery";
var WIFI_BSSID = "02:24:00:00:24:01";
var SCHEDULE_KIND = MOD_ID + ".scheduled-mail";
var HTTP_IP_KEY = "qe24.httpIp";
var WIFI_IP_KEY = "qe24.wifiIp";
var SESSION_KEY = "qe24.sessionSeen";
/* Twotter probe (r179): fixed ids, so the tester can search for the usernames
   by hand and `status` can name a record that is missing. */
var TWOTTER_GOOD_ID = "qe24-probe-user";
var TWOTTER_BAD_ID = "qe24-bad-record";
var TWOTTER_DECLARED_ID = "qe24-declared-user";
var TWOTTER_TWEET_ID = "qe24-probe-tweet";
var sessionHookRegistered = false;

function log(message) {
    try { console.log("[qe24] " + message); } catch (_e) {}
}

function safe(label, fn, fallback) {
    try {
        return fn();
    } catch (e) {
        log(label + " failed: " + (e && e.message ? e.message : e));
        return fallback;
    }
}

function toast(message, tone) {
    safe("toast", function () {
        if (sdk.UI && sdk.UI.toast) sdk.UI.toast(message, tone || "info");
        else if (sdk.UI && sdk.UI.notify) sdk.UI.notify(message);
    });
}

function saveGet(key) {
    return safe("SaveStorage.get(" + key + ")", function () {
        return sdk.SaveStorage && sdk.SaveStorage.get ? sdk.SaveStorage.get(key) : undefined;
    });
}

function saveSet(key, value) {
    safe("SaveStorage.set(" + key + ")", function () {
        if (sdk.SaveStorage && sdk.SaveStorage.set) sdk.SaveStorage.set(key, value);
    });
}

function saveRemove(key) {
    safe("SaveStorage.remove(" + key + ")", function () {
        if (sdk.SaveStorage && sdk.SaveStorage.remove) sdk.SaveStorage.remove(key);
    });
}

function createUser(options) {
    if (sdk.Network && sdk.Network.createUser) return sdk.Network.createUser(options);
    return Object.assign({}, options);
}

function wifiMatchesTarget(wifiOrSubnet) {
    if (!wifiOrSubnet) return false;
    var wifi = wifiOrSubnet.wifiNetwork || wifiOrSubnet;
    var savedIp = saveGet(WIFI_IP_KEY);
    return wifi.ssid === WIFI_SSID || wifi.name === WIFI_SSID || wifi.bssid === WIFI_BSSID || wifi.mac === WIFI_BSSID || (savedIp && (wifi.ip === savedIp || wifiOrSubnet.ip === savedIp));
}

function describeWifi(wifiOrSubnet) {
    if (!wifiOrSubnet) return "unavailable";
    var wifi = wifiOrSubnet.wifiNetwork || wifiOrSubnet;
    var name = wifi.name || wifi.ssid || "?";
    var ip = wifiOrSubnet.ip || wifi.ip || "?";
    var bssid = wifi.bssid || wifi.mac || "?";
    var channel = wifi.channel != null ? wifi.channel : "?";
    var wps = wifi.wps != null ? wifi.wps : "?";
    var signal = wifi.signal != null ? wifi.signal : wifi.level != null ? wifi.level : "?";
    var rssi = wifi.rssi != null ? wifi.rssi : "?";
    return name + " ip=" + ip + " bssid=" + bssid + " channel=" + channel + " wps=" + wps + " signal=" + signal + " rssi=" + rssi;
}

function registerScheduler() {
    if (!sdk.Scheduler || !sdk.Scheduler.register) {
        log("Scheduler.register is unavailable");
        return;
    }
    safe("Scheduler.register", function () {
        sdk.Scheduler.register(SCHEDULE_KIND, function (payload, job) {
            log("scheduler fired: " + job.id + " payload=" + JSON.stringify(payload || {}));
            if (sdk.Mail && sdk.Mail.send) {
                sdk.Mail.send({
                    from: "qa@qe24.test",
                    subject: "QE24 scheduled job fired",
                    content: "Scheduler job " + job.id + " fired at in-game time " + job.fireAt + ".\n\nPayload: " + JSON.stringify(payload || {}),
                });
            }
            if (sdk.Events && sdk.Events.emit) {
                sdk.Events.emit("QE24.SchedulerFired", { id: job.id, payload: payload || {}, fireAt: job.fireAt });
            }
            toast("QE24 scheduled job fired", "success");
        });
    });
}

function registerHttp() {
    if (!sdk.Http || !sdk.Http.registerHost || !sdk.Http.createServer) {
        log("Http.registerHost/createServer is unavailable");
        return;
    }
    safe("Http.registerHost", function () {
        var alreadyRegistered = sdk.Http.hasHost && sdk.Http.hasHost(HTTP_HOST);
        if (!alreadyRegistered) {
        var server = sdk.Http.createServer({
            routes: [
                {
                    method: "GET",
                    path: "/",
                    handler: function () {
                        return sdk.Http.html([
                            "<h1>QE24 HTTP Harness</h1>",
                            "<p>If you can read this through the in-game browser or curl, Http.registerHost is answering.</p>",
                            "<ul>",
                            "<li><a href=\"/api/echo?from=browser\">GET echo</a></li>",
                            "<li><a href=\"/api/orders/1042\">Route param example</a></li>",
                            "</ul>",
                        ].join(""));
                    },
                },
                {
                    method: ["GET", "POST"],
                    path: "/api/echo",
                    handler: function (request, context) {
                        return sdk.Http.json({
                            ok: true,
                            method: request.method,
                            path: request.path,
                            query: request.query,
                            body: request.body || "",
                            cookies: context.cookies,
                            origin: request.origin,
                        });
                    },
                },
                {
                    path: "/api/orders/:id",
                    handler: function (_request, context) {
                        return sdk.Http.json({ id: context.params.id, owner: "qa", total: 42.4 });
                    },
                },
                {
                    path: "/set-cookie",
                    handler: function () {
                        if (sdk.Http.setCookie) sdk.Http.setCookie(HTTP_HOST, "qe24", "cookie-ok", { httpOnly: true, path: "/" });
                        return sdk.Http.text("cookie set");
                    },
                },
            ],
            notFound: function (request) {
                return sdk.Http.notFound("QE24 has no route for " + request.path);
            },
        });
        sdk.Http.registerHost(HTTP_HOST, server);
        }
        if (sdk.Http.publish) {
            sdk.Http.publish(HTTP_HOST, {
                siteName: "QE24 HTTP Harness",
                description: "SDK 0.24 HTTP/browser/curl test host.",
                search: ["qe24", "sdk", "curl", "http"],
                pages: [{ path: "/api/echo", title: "QE24 Echo", description: "Echo JSON endpoint" }],
            });
        }
        if (sdk.Http.registerCollaborator) sdk.Http.registerCollaborator(COLLAB_DOMAIN);
        log("HTTP host registered: " + HTTP_HOST);
    });
}

function ensureHttpNetwork() {
    if (!sdk.Network || !sdk.Network.registerDomain) return;
    var ip = saveGet(HTTP_IP_KEY);
    var hasSubnet = ip && sdk.Network.getSubnet ? safe("Network.getSubnet(http)", function () { return sdk.Network.getSubnet(ip); }) : null;
    if (!ip || !hasSubnet) {
        ip = sdk.Network.randomIp ? sdk.Network.randomIp() : "45.24.0.24";
        if (sdk.Network.createSubnetNetwork) {
            safe("Network.createSubnetNetwork(http)", function () {
                sdk.Network.createSubnetNetwork({
                    ip: ip,
                    type: "ROUTER",
                    name: "qe24-http-router",
                    users: [],
                    ports: [{ external: 80, internal: 80, active: true, service: "http", version: "QEHTTP 0.24.0" }],
                    children: [],
                });
            });
        }
        saveSet(HTTP_IP_KEY, ip);
    }
    safe("Network.registerDomain(http)", function () { sdk.Network.registerDomain(HTTP_HOST, ip); });
}

function ensureWifi() {
    if (!sdk.Network || !sdk.Network.createWifiNetwork) {
        log("Network.createWifiNetwork is unavailable");
        return;
    }
    var existing = sdk.Network.getWifiNetworks ? safe("Network.getWifiNetworks", function () { return sdk.Network.getWifiNetworks(); }, []) : [];
    var alreadyVisible = Array.isArray(existing) && existing.some(function (ap) { return ap && (ap.ssid === WIFI_SSID || ap.name === WIFI_SSID); });
    var ip = saveGet(WIFI_IP_KEY);
    if (alreadyVisible && ip) return;
    var desiredIp = ip || (sdk.Network.randomIp ? sdk.Network.randomIp() : "45.24.24.1");
    var madeIp = safe("Network.createWifiNetwork", function () {
        return sdk.Network.createWifiNetwork({
            ssid: WIFI_SSID,
            password: WIFI_PASSWORD,
            signal: 3,
            bssid: WIFI_BSSID,
            channel: 44,
            wps: true,
            ip: desiredIp,
            model: "TP-Link Archer C6",
            users: [createUser({ username: "admin", password: "qe24-admin", firstName: "QE", lastName: "Router" })],
            ports: [
                { external: 80, internal: 80, active: true, locked: true, service: "http", version: "RouterUI 1.2.3" },
                { external: 22, internal: 22, active: true, locked: false, service: "ssh", version: "OpenSSH 8.9.0" },
            ],
            children: [
                {
                    ip: "10.24.0.2",
                    type: "DEVICE",
                    name: "qe24-wifi-client",
                    users: [createUser({ username: "qa", password: "wifi-child", firstName: "Wi", lastName: "Fi" })],
                    ports: [{ external: 22, internal: 22, active: true, locked: false, service: "ssh", version: "OpenSSH 8.9.0" }],
                    rootFiles: [{ name: "logs", isFolder: true, children: [{ name: "qa", extension: "txt", data: "wifi child reached" }] }],
                },
            ],
        });
    }, desiredIp);
    saveSet(WIFI_IP_KEY, madeIp || desiredIp);
    log("Wi-Fi AP created: " + WIFI_SSID + " at " + (madeIp || desiredIp));
}

function ensureSession() {
    registerScheduler();
    registerHttp();
    ensureHttpNetwork();
    ensureWifi();
    if (!saveGet(SESSION_KEY)) {
        saveSet(SESSION_KEY, true);
        toast("QE24 SDK harness seeded this save", "info");
    }
    log("session ready: host=" + HTTP_HOST + " ssid=" + WIFI_SSID);
}

function registerSessionHook() {
    if (sessionHookRegistered) return;
    sessionHookRegistered = true;
    if (sdk.Events && sdk.Events.on) {
        sdk.Events.on("Game.SessionStarted", function () {
            log("Game.SessionStarted observed");
            ensureSession();
        });
    }
}

function completeObjectiveSafe(quest, name) {
    safe("completeObjective(" + name + ")", function () { quest.completeObjective(name); });
}

function sendMailSafe(subject, body) {
    safe("Mail.send(" + subject + ")", function () {
        if (sdk.Mail && sdk.Mail.send) sdk.Mail.send({ from: "qa@qe24.test", subject: subject, content: body });
    });
}

/* S-04 (the r173 Timer's `at` mode): the editor corrects a typed clock time by
 * the machine's timezone offset so that "09:00" means the in-game clock DISPLAYS
 * 09:00. That is only right if the game's clock UI renders in the player
 * machine's zone, which the pinned SDK does not state. Print both candidate
 * renderings so the tester can compare them with the clock on screen. */
function printClockProbe(tools) {
    tools.println("QE24 clock probe (S-04: which zone does the game clock display?)");
    if (!sdk.Time || !sdk.Time.now) {
        tools.println("Time.now unavailable in this build - S-04 cannot be answered here.");
        return;
    }
    var now = safe("Time.now", function () { return sdk.Time.now(); }, null);
    if (now == null) {
        tools.println("Time.now threw - paste that as the result.");
        return;
    }
    var d = new Date(now);
    var gameDate = sdk.Time.date ? safe("Time.date", function () { return sdk.Time.date(); }, null) : null;
    tools.println("Time.now:            " + now);
    tools.println("if the clock is UTC: " + d.toISOString());
    tools.println("if it is local time: " + d.toString());
    tools.println("Time.date() reads:   " + (gameDate ? String(gameDate) : "unavailable"));
    tools.println("");
    tools.println("Now read the in-game clock on screen and compare its hour with the two lines above.");
    tools.println("Report: the on-screen clock plus both lines. Screen matches 'local time' -> the Timer's at-mode correction stays; screen matches UTC -> drop it.");
    tools.println("Tip: run qe24 clock twice, a minute apart, if the first read is ambiguous.");
}

/* ── starting a QA quest on demand (r181) ─────────────────────────────────
 * Every QA quest used to auto-start, so by r180 a load produced five quests'
 * worth of mail, toasts and journal lines at once and the tester could neither
 * read the journal nor count a toast (Zeis, 2026-09-18: "a bit of a mess").
 * Nothing auto-starts any more: the SDK's Quest.claim/unclaim exist exactly for
 * this ("programmatically claim/start a quest", and "clear an entry a previous
 * build of the mod left behind"), so one command starts one row and one command
 * clears the leftovers. The harness's own probe quests stay under `qe24 claim`. */
var QA_QUESTS = [
    {
        alias: "timer",
        name: "QESdk024TimerQa",
        title: "Timer QA (S-01/S-02/S-03)",
        what: "Timer A fires after 2 in-game minutes; Timer B after 2 in-game hours, which is also S-02 (reload survives) and S-03 (cancel on complete or abandon).",
    },
    {
        alias: "cal",
        name: "QESdk024TimerCalQa",
        title: "Timer QA (calendar: S-05/S-06/S-07/S-13)",
        what: "fires an exact date already past and a coming day already past today, then holds the 1 month 2 weeks 2 days at 18:23 row - read that one with qe24 timers.",
    },
    {
        alias: "wait",
        name: "QESdk024WaitMonthQa",
        title: "Timer QA (Wait in months: S-14, S-09)",
        what: "waits 1 in-game minute (the schedule path), then holds Wait 1 month (the scheduleAt path) - read it with qe24 timers.",
    },
    {
        alias: "extras",
        name: "QESdk024ExtrasQa",
        title: "QE24 extras QA (its title is translated - T-27)",
        what: "the editor export's own pack extras (r203): claim it only to see the translated Title - the menu entry, the widget and the right-click entries are there from load, with no quest needed.",
    },
    {
        alias: "probe",
        name: "QE24SurfaceProbe",
        title: "QE24 SDK surface probe",
        what: "this harness's own objective reminders (Wi-Fi, HTTP, collaborators, the clock). Same as qe24 claim surface.",
    },
    {
        alias: "twotter",
        name: "QE24TwotterProbe",
        title: "QE24 Twotter probe",
        what: "the r179 Twotter probe's objectives. The qe24 twotter commands themselves work whether or not it is claimed.",
    },
    {
        alias: "tw1",
        name: "QESdk024TwotterQa",
        title: "Twotter QA (T-08/T-09/T-10/T-11/T-13)",
        what: "the editor's Twotter node in the field: a five-tweet series on @qe24_editor, four backdated and one arriving now. Read the profile with Twotter's search, then save/reload, then Complete it.",
    },
    {
        alias: "tw2",
        name: "QESdk024TwotterShareQa",
        title: "Twotter QA (T-12: two quests, one account)",
        what: "the second quest on the SAME account, for the shared-account rule: finish one and the account stays while the other lives; finish both and it goes. Check with 'qe24 twotter audit'.",
    },
    {
        alias: "tw3",
        name: "QESdk024TwotterPostEventQa",
        title: "Twotter QA (T-13: does Twotter.Post ever fire?)",
        what: "the canary, alone: claim it, open a Twotter post, and see whether its single objective ticks by itself (r185 says no). Nothing has to be finished here.",
    },
    {
        alias: "surface",
        name: "QESdk024EditorQa",
        title: "QE SDK 0.24 editor QA",
        what: "the r166 editor surface (Wi-Fi, static website, HTTP/browser events). Closed - only re-run if something Wi-Fi-shaped changed.",
    },
];

function padRight(text, width) {
    var out = String(text);
    while (out.length < width) out += " ";
    return out;
}

function printRunList(tools) {
    tools.println("QE24 quest launcher - nothing auto-starts, so this is how a row begins.");
    tools.println("");
    tools.println("  qe24 run <alias>    claim that one quest and run it");
    tools.println("  qe24 run clear      unclaim all of them (use this once on a save that still");
    tools.println("                      carries quests claimed by an older build)");
    tools.println("");
    for (var i = 0; i < QA_QUESTS.length; i++) {
        var q = QA_QUESTS[i];
        tools.println("  " + padRight(q.alias, 8) + " " + q.what);
        tools.println("           journal title: " + q.title);
    }
    tools.println("");
    tools.println("Only the quest you claim appears, so the journal stays readable and the popups");
    tools.println("stay countable. The harness's other probe quests are still under qe24 claim.");
}

function runQaQuest(tools, alias) {
    var api = sdk.Quest;
    if (alias) printExportLoaded(tools);
    if (!api || typeof api.claim !== "function") {
        tools.printError("Quest.claim is unavailable in this build - claim the quest from the journal instead.");
        return;
    }
    if (!alias) {
        printRunList(tools);
        return;
    }
    if (alias === "clear") {
        var cleared = [];
        for (var i = 0; i < QA_QUESTS.length; i++) {
            /* Function-scoped copy: `var name` inside a callback would be the
               same binding for every iteration under ES5. */
            var name = QA_QUESTS[i].name;
            var ok = (function (id) {
                return safe("Quest.unclaim", function () { api.unclaim(id); return true; }, false);
            })(name);
            cleared.push(name + (ok ? " ok" : " failed"));
        }
        tools.println("Unclaimed: " + cleared.join(", "));
        tools.println("Anything an older build left claimed is out of the journal now. Then: qe24 run");
        return;
    }
    var entry = null;
    for (var j = 0; j < QA_QUESTS.length; j++) {
        if (QA_QUESTS[j].alias === alias || QA_QUESTS[j].name === alias) entry = QA_QUESTS[j];
    }
    if (!entry) {
        tools.printError("Unknown quest: " + alias + " (run qe24 run to list them)");
        return;
    }
    var claimed = safe("Quest.claim", function () { api.claim(entry.name); return true; }, false);
    if (!claimed) {
        tools.printError("Quest.claim threw for " + entry.name + " - claim it from the journal instead.");
        return;
    }
    tools.println("Claimed " + entry.name + " - look for \"" + entry.title + "\" in the journal.");
    tools.println("If it is not there, this build may refuse cross-mod claims: claim that title yourself.");
    /* r192. `Quest.claim()` returns void - there is no "did it work" and no way
       to read a quest's state back (see question 12) - so this line cannot
       promise the quest started. It printed "Claimed" for a quest whose owning
       mod was disabled, where the claim silently did nothing, and a tester spent
       a session chasing a missing profile that was never going to appear. Say
       what the command can and cannot prove, every time. */
    tools.println("Note: Quest.claim() returns nothing in this build, so this line cannot prove the");
    tools.println("quest started - check the journal entry above. No entry means the claim did");
    tools.println("nothing (the owning mod is disabled or missing).");
    tools.println("Started: " + entry.what);
    if (alias === "tw1" || alias === "tw2" || alias === "tw3") {
        tools.println("");
        tools.println("Twotter rows: run `qe24 twotter audit` straight away - these quests create their");
        tools.println("account at quest start, so @qe24_editor should be on the save immediately.");
        tools.println("If it is not: the quest did not start. Check the editor export is ENABLED in the");
        tools.println("Mods list, then `qe24 run clear` and claim again on a clean save. The game log's");
        tools.println("[quest-editor] lines say which of those it was: the load banner proves the mod");
        tools.println("loaded, and `twotter: created @...` proves the node ran.");
    }
    if (alias === "cal" || alias === "wait" || alias === "timer") {
        tools.println("");
        tools.println("Give it a second, then run:  qe24 timers");
        tools.println("That prints every pending job with the moment it will fire - you do not wait for it.");
    }
}

/* ── pending timers (r180) ────────────────────────────────────────────────
 * Every Timer row asks the same question: what moment did the mod hand to the
 * engine? Scheduler.list() answers it for EVERY kind on the save - including
 * another pack's jobs - and ScheduledJobInfo carries fireAt, so this prints the
 * resolved moment next to the in-game clock, in seconds, instead of asking a
 * tester to wait out a month. The ISO string is UTC; the readable line is the
 * local rendering, which is the one the on-screen clock matches (S-04). */
/* A proper breakdown, not a rounded-down total: 26 days 3 hours 1 minute, with
   the units that came out zero dropped from the front only. Ceilings per unit
   would print nonsense ("3d 62h"), which is worse than useless in a QA tool. */
function describeRemaining(ms) {
    if (!sdk.Time || !sdk.Time.duration) return "";
    var day = sdk.Time.duration({ days: 1 });
    var hour = sdk.Time.duration({ hours: 1 });
    var minute = sdk.Time.duration({ minutes: 1 });
    if (!day || !hour || !minute) return "";
    var left = Math.max(0, Math.floor(ms));
    var days = Math.floor(left / day);
    left -= days * day;
    var hours = Math.floor(left / hour);
    left -= hours * hour;
    var mins = Math.floor(left / minute);
    var bits = [];
    if (days) bits.push(days + "d");
    if (hours) bits.push(hours + "h");
    if (mins) bits.push(mins + "m");
    if (!bits.length) {
        /* Under an in-game minute: say it in real seconds rather than "0m",
           which reads like a broken reading instead of an imminent fire. */
        var real = sdk.Time.toRealMs ? Math.round(sdk.Time.toRealMs(left) / 1000) : null;
        bits.push(real != null ? real + "s real (under an in-game minute)" : "under an in-game minute");
    }
    return bits.join(" ");
}

function printTimers(tools) {
    tools.println("QE24 pending timers (every Scheduler job on this save, any mod)");
    if (!sdk.Scheduler || !sdk.Scheduler.list) {
        tools.println("Scheduler.list unavailable in this build - timers cannot be read here.");
        return;
    }
    var jobs = safe("Scheduler.list", function () { return sdk.Scheduler.list(); }, null);
    if (!jobs) {
        tools.println("Scheduler.list threw - paste that as the result.");
        return;
    }
    if (!jobs.length) {
        tools.println("No pending jobs. Arm a Timer in the editor export, then run this again");
        tools.println("within a second or two - a Timer with time already past fires immediately.");
        return;
    }
    var now = sdk.Time && sdk.Time.now ? safe("Time.now", function () { return sdk.Time.now(); }, null) : null;
    if (now != null) {
        tools.println("In-game now:         " + new Date(now).toString());
        tools.println("  same moment in UTC: " + new Date(now).toISOString());
    }
    tools.println("Pending jobs: " + jobs.length);
    for (var i = 0; i < jobs.length; i++) {
        var job = jobs[i];
        var fire = job && job.fireAt;
        tools.println("");
        tools.println("  [" + (i + 1) + "] kind: " + (job && job.kind ? job.kind : "?") + "   id: " + (job && job.id ? job.id : "?"));
        if (job && job.payload) {
            var who = [];
            for (var k in job.payload) {
                if (Object.prototype.hasOwnProperty.call(job.payload, k)) who.push(k + "=" + String(job.payload[k]));
            }
            tools.println("      payload: " + (who.length ? who.join(" ") : "(empty)"));
        }
        if (fire != null) {
            var d = new Date(fire);
            tools.println("      fires in-game: " + d.toString());
            tools.println("      same in UTC:   " + d.toISOString() + "   (raw " + fire + ")");
        }
        var rem = sdk.Scheduler.remaining ? safe("Scheduler.remaining", function () { return sdk.Scheduler.remaining(job.id); }, null) : null;
        if (rem != null && rem >= 0) {
            var left = describeRemaining(rem);
            tools.println("      in-game in:    " + (left ? left + "  " : "") +
                "(in-game ms " + rem + ") - that is about " +
                (sdk.Time && sdk.Time.toRealMs ? Math.round(sdk.Time.toRealMs(rem) / 1000) + " real seconds at this clock scale" : "? real seconds"));
        }
    }
    tools.println("");
    tools.println("Read the 'fires in-game' line against the on-screen clock: that is the moment the");
    tools.println("game will fire. A Timer that promised a month or a year lands here, so you do not");
    tools.println("have to wait for it - check the day and the clock time it resolved to.");
}

/* ── Twotter probe (r179) ─────────────────────────────────────────────────
 * r31 removed Twotter support because a quest-declared account was written to
 * the save with `bio: undefined`, Twotter's search called .toLowerCase() on it,
 * and the crash was permanent (game 1.1.2, seven QA rounds - BUG 3 in
 * docs/05-bug-report-for-hotbunny.md). SDK 0.24 declares updateUser and
 * removeUser, and the 1.3.0 changelog says the crash is fixed with affected
 * saves repaired on load. This probe decides whether that is true: it plants
 * the exact bad shape on purpose, and it exercises the repair calls that did
 * not exist when the feature was pulled.
 * Rows: reference/sdk-0.24-qa/STATUS.md (T-01...T-07). */

/* ── is the editor export loaded in this session? (r193) ─────────────────
 * The export leaves a marker in SharedVariables when it loads (see its own
 * `markThisModLoaded`). This is the only way one mod can find out whether
 * another is loaded: SDK 0.24's ModInfo is a type with no reader, no API lists
 * installed mods, and Quest.claim() returns void — so a quest whose mod is
 * disabled just never appears, with no error.
 *
 * Why it matters enough to build: on 2026-09-19 a tester's local export stayed
 * DISABLED after he had disabled an older copy of it and deleted that copy from
 * disk. The game remembered the disabled flag (it survives a version change, and
 * a fresh save), so every `qe24 run tw1` printed "Claimed" and did nothing, and
 * the profile never appeared. Reported to the developers as a game bug; this
 * check is what turns the next occurrence into one printed line instead of a
 * lost session. */
var EXPORT_LOADED_KEY = "qe.export.loaded";

function exportLoadedMarker() {
    /* Returns the marker string when the export loaded this session, else null.
       Absent API (an older game build) is reported as "unknown", not "no". */
    var shared = sdk.SharedVariables;
    if (!shared || typeof shared.get !== "function") return "unknown";
    var value = safe("SharedVariables.get", function () { return shared.get(EXPORT_LOADED_KEY); }, undefined);
    if (value === undefined || value === null || value === "") return null;
    return String(value);
}

/* One line, printed wherever a command depends on the export's quests. */
function printExportLoaded(tools) {
    var marker = exportLoadedMarker();
    if (marker === "unknown") {
        tools.println("Editor export: this game build has no SharedVariables API, so I cannot tell.");
        return;
    }
    if (marker === null) {
        tools.println("Editor export: NOT LOADED in this session.");
        tools.println("  Its quests are not in the game, so `qe24 run` cannot start them (Quest.claim");
        tools.println("  fails silently). Check the Mods list: an old copy that was disabled stays");
        tools.println("  disabled even after a new version replaces it, and that survives a fresh save.");
        tools.println("  Enable it, restart the game, and run `qe24 run <alias>` again.");
        return;
    }
    tools.println("Editor export: loaded (v" + marker + ").");
}

function twotterApi() {
    return sdk.Twotter && sdk.Twotter.createUser ? sdk.Twotter : null;
}

function twotterRecord(id) {
    var api = twotterApi();
    if (!api || !api.getUserById) return null;
    return safe("Twotter.getUserById", function () { return api.getUserById(id); }, null);
}

/* The stored record, with an undefined field NAMED rather than hidden: JSON
   drops undefined keys, and "bio missing" is the whole question. */
function describeTwotterRecord(id) {
    var rec = twotterRecord(id);
    if (!rec) return "  " + id + ": NOT FOUND";
    var lines = ["  " + id + ":"];
    for (var k in rec) {
        if (Object.prototype.hasOwnProperty.call(rec, k)) {
            lines.push("    " + k + ": " + (rec[k] === undefined ? "undefined" : JSON.stringify(rec[k])));
        }
    }
    if (!Object.prototype.hasOwnProperty.call(rec, "bio")) lines.push("    bio: ABSENT (no property at all)");
    return lines.join("\n");
}

function printTwotterGuide(tools) {
    tools.println("QE24 Twotter probe (r179) - the test that decides whether Twotter can come back.");
    tools.println("");
    tools.println("Why: a quest-declared account used to be saved with an undefined bio, and Twotter's");
    tools.println("search crashed on it permanently (r31). 1.3.0 says that is fixed and that affected");
    tools.println("saves are repaired on load. This proves it, or proves it is not.");
    tools.println("");
    tools.println("Throwaway save. Run in this order and paste the console lines:");
    tools.println("  1. qe24 twotter seed     then search Twotter for:  qe24_probe");
    tools.println("  2. qe24 twotter bad      then search Twotter for:  qe24_badrecord");
    tools.println("     (the exact r31 shape: bio is present but undefined, like the broken save.)");
    tools.println("     Search must survive. If the game crashes here, close it WITHOUT saving -");
    tools.println("     that half-done save is fine, and the crash IS the answer for T-02.");
    tools.println("  3. qe24 twotter status   -> the stored records; the bad bio shows as undefined");
    tools.println("  4. Save, quit to the main menu, reload, then: qe24 twotter status");
    tools.println("     (if repair-on-load works, the bad record's bio is no longer missing)");
    tools.println("  5. qe24 twotter update   -> updateUser repairs both records; prints true/false");
    tools.println("  6. qe24 twotter post     -> a tweet from our account; check the profile screen");
    tools.println("  7. qe24 twotter cleanup  -> removeUser/removeTweet; the accounts must disappear");
    tools.println("  8. Open the profile of qe24_declared (declared by the probe quest, not the API).");
    tools.println("  9. qe24 twotter backdate -> P-01 (r185): four posts on qe24_probe, one moment in");
    tools.println("     three spellings plus a control. Open the profile: which ones read a month ago?");
    tools.println(" 10. qe24 twotter order -> P-01b (r185): is a profile newest first, oldest first, or in");
    tools.println("     the order we posted? Three tweets, one look, report the letters.");
    tools.println(" 11. qe24 twotter audit  -> which of this round's handles are on the save, and whether any");
    tools.println("                             carries the r31 poison shape (a bio that is undefined)");
    tools.println("");
    tools.println("While you are here: does this build have curl? Try:  curl http://qe24-http.test/");
    tools.println("Row meanings and what each result decides: reference/sdk-0.24-qa/STATUS.md");
    tools.println("The objectives are optional: qe24 run twotter claims the probe quest if you want them.");
}

/* r185 audit: which of this round's handles are on the save, and whether any
 * of them carries the shape that crashed Twotter search in r31 (a bio that is
 * present and undefined). SDK 0.24 has no "list every account" call, so this
 * audits the set this QA round creates: the harness's own three plus the editor
 * export's account. */
var TWOTTER_AUDIT_HANDLES = ["qe24_probe", "qe24_badrecord", "qe24_declared", "qe24_editor"];

function twotterAudit(tools) {
    var api = twotterApi();
    if (!api || !api.getUserByUsername) { tools.printError("Twotter API unavailable in this build"); return; }
    printExportLoaded(tools);
    tools.println("QE24 Twotter audit - the handles this QA round creates:");
    var present = 0;
    var poisoned = 0;
    for (var i = 0; i < TWOTTER_AUDIT_HANDLES.length; i++) {
        var handle = TWOTTER_AUDIT_HANDLES[i];
        var rec = safe("Twotter.getUserByUsername", function () { return api.getUserByUsername(handle); }, null);
        if (!rec) { tools.println("  @" + handle + ": not on this save"); continue; }
        present++;
        var bad = rec.bio === undefined || rec.bio === null;
        if (bad) poisoned++;
        tools.println("  @" + rec.username + " (id " + rec.id + "): " + (bad
            ? "BIO IS " + String(rec.bio).toUpperCase() + " - THE r31 POISON SHAPE"
            : "bio is a string (" + String(rec.bio).length + " chars)") +
            "; verified " + (rec.verified ? "yes" : "no") +
            "; followers " + rec.followers + "; following " + rec.following +
            "; joined " + rec.joinedAt);
    }
    tools.println(present + " of " + TWOTTER_AUDIT_HANDLES.length + " handles present; " +
        poisoned + " carrying the r31 poison shape.");
    tools.println("A hand-crafted account with an empty avatar/banner is normal for this harness;");
    tools.println("what matters is the bio line: 0 poisoned means search cannot hit the r31 crash here.");
    tools.println("T-11/T-12/T-15 expect the editor's @qe24_editor to LEAVE this list once its quests finish.");
}

function printTwotterStatus(tools) {
    var api = twotterApi();
    tools.println("QE24 Twotter probe status");
    tools.println("Twotter API: " + (api ? "available" : "NOT AVAILABLE in this build"));
    if (api) {
        var names = ["createUser", "addUser", "updateUser", "removeUser", "postTweet", "removeTweet", "getUserById", "getUserByUsername", "toggleLike"];
        var present = [];
        for (var i = 0; i < names.length; i++) {
            if (typeof api[names[i]] === "function") present.push(names[i]);
        }
        tools.println("Functions present: " + present.join(", "));
    }
    tools.println("Records in this save:");
    tools.println(describeTwotterRecord(TWOTTER_GOOD_ID));
    tools.println(describeTwotterRecord(TWOTTER_BAD_ID));
    tools.println(describeTwotterRecord(TWOTTER_DECLARED_ID));
    tools.println("Tweets: SDK 0.24 has no tweet reader, so check the profile screen for:");
    tools.println("  qe24_probe (API post) and qe24_declared (quest-declared tweet)");
    tools.println("  P-01's rows also live on qe24_probe: qe24 twotter backdate, qe24 twotter order.");
}

function twotterSeed(tools) {
    var api = twotterApi();
    if (!api) { tools.printError("Twotter API unavailable in this build"); return; }
    var user = api.createUser({
        id: TWOTTER_GOOD_ID,
        username: "qe24_probe",
        bio: "SDK 0.24 probe account, made by qe24 twotter seed.",
        verified: true,
    });
    api.addUser(user);
    tools.println("createUser + addUser done. Search Twotter for: qe24_probe");
    tools.println("The profile must open, show the bio above, and search must not crash.");
    tools.println("Stored record now:");
    tools.println(describeTwotterRecord(TWOTTER_GOOD_ID));
}

function twotterBad(tools) {
    var api = twotterApi();
    if (!api) { tools.printError("Twotter API unavailable in this build"); return; }
    /* Deliberately the pre-1.3.0 shape: `bio` present and undefined. It is
       exactly what the save held after the old bug — not a missing property,
       which is what JSON.stringify would make of an omitted one — so the record
       reproduces what crashed search, and `createUser()` is not used here
       because its whole job is to fill in the fields this test leaves out. */
    api.addUser({
        id: TWOTTER_BAD_ID,
        username: "qe24_badrecord",
        name: "QE24",
        surname: "BadRecord",
        avatar: "",
        banner: "",
        bio: undefined,
        joinedAt: new Date().toISOString(),
        followers: 0,
        following: 0,
        password: "",
    });
    tools.println("Planted the r31 record shape: bio present but undefined. Now search Twotter for: qe24_badrecord");
    tools.println("Search surviving = the crash is fixed at the read path. It crashing = the bug is open.");
    tools.println("If it crashes, close the game WITHOUT saving; the crash itself is the T-02 answer.");
    tools.println("Stored record now:");
    tools.println(describeTwotterRecord(TWOTTER_BAD_ID));
}

function twotterUpdate(tools) {
    var api = twotterApi();
    if (!api || !api.updateUser) { tools.printError("Twotter.updateUser unavailable in this build"); return; }
    var fixedGood = api.updateUser(TWOTTER_GOOD_ID, { bio: "Updated by updateUser (qe24 twotter update)." });
    var fixedBad = api.updateUser(TWOTTER_BAD_ID, { bio: "" });
    tools.println("updateUser(qe24_probe) -> " + fixedGood);
    tools.println("updateUser(qe24_badrecord) -> " + fixedBad + "  (the repair the old report said no mod could do)");
    tools.println("Two true results mean a mod can repair a record it did not create.");
    tools.println("Stored records now:");
    tools.println(describeTwotterRecord(TWOTTER_GOOD_ID));
    tools.println(describeTwotterRecord(TWOTTER_BAD_ID));
}

function twotterPost(tools) {
    var api = twotterApi();
    if (!api || !api.postTweet) { tools.printError("Twotter.postTweet unavailable in this build"); return; }
    api.postTweet({
        id: TWOTTER_TWEET_ID,
        userId: TWOTTER_GOOD_ID,
        content: "QE24 probe tweet (qe24 twotter post). If you can read this on the profile, posts work.",
        interaction: { comments: 1, share: 0, likes: 3, views: 42 },
        showInTimeline: true,
    });
    tools.println("postTweet done. Open the profile of qe24_probe and confirm the tweet is there.");
    tools.println("The post-seen objective should tick if you open it from the timeline.");
}


/* P-01 (r185): does the platform keep a timestamp we hand a tweet?
 * `TwotterTweet` declares `sendedAt?: string` and no `postedAgo` (that string
 * belongs to the declarative quest field the editor fences), so backdating on
 * the API path means sending our own date and trusting the engine to keep it.
 * Whether it keeps it or stamps "now" over it decides whether a mod can leave a
 * profile carrying a month of history - the Journalist's Sister shape
 * (@alinamack: ten tweets, "a year ago" down to "8 days ago").
 * Four posts: one moment, three spellings, and a control with no time at all.
 * Row and reporting guide: reference/sdk-0.24-qa/P-01-BACKDATE.md */

var TWOTTER_BACKDATE_IDS = [
    "qe24-p01-control",
    "qe24-p01-iso-ms",
    "qe24-p01-iso",
    "qe24-p01-plain",
];

function p01Pad(n) { return (n < 10 ? "0" : "") + n; }

function p01PlainStamp(d) {
    return d.getFullYear() + "-" + p01Pad(d.getMonth() + 1) + "-" + p01Pad(d.getDate()) +
        " " + p01Pad(d.getHours()) + ":" + p01Pad(d.getMinutes()) + ":" + p01Pad(d.getSeconds());
}

function twotterBackdate(tools) {
    var api = twotterApi();
    if (!api || !api.postTweet) { tools.printError("Twotter.postTweet unavailable in this build"); return; }
    if (api.getUserById && !api.getUserById(TWOTTER_GOOD_ID)) {
        tools.printError("The probe account is not in this save. Run: qe24 twotter seed - then run this again.");
        return;
    }
    var now = (sdk.Time && sdk.Time.date) ? sdk.Time.date()
        : new Date((sdk.Time && sdk.Time.now) ? sdk.Time.now() : Date.now());
    var then = new Date(now.getTime());
    then.setMonth(then.getMonth() - 1);
    var isoMs = then.toISOString();
    var iso = isoMs.slice(0, 19) + "Z";
    var plain = p01PlainStamp(then);

    api.postTweet({
        id: "qe24-p01-control", userId: TWOTTER_GOOD_ID,
        content: "P-01 control: no time sent. Correct reading: just now.",
        interaction: { comments: 0, share: 0, likes: 1, views: 11 }, showInTimeline: false,
    });
    api.postTweet({
        id: "qe24-p01-iso-ms", userId: TWOTTER_GOOD_ID,
        content: "P-01a: ISO with milliseconds. Correct reading: a month ago.",
        sendedAt: isoMs,
        interaction: { comments: 0, share: 0, likes: 2, views: 22 }, showInTimeline: false,
    });
    api.postTweet({
        id: "qe24-p01-iso", userId: TWOTTER_GOOD_ID,
        content: "P-01b: ISO without milliseconds. Correct reading: a month ago.",
        sendedAt: iso,
        interaction: { comments: 0, share: 0, likes: 3, views: 33 }, showInTimeline: false,
    });
    api.postTweet({
        id: "qe24-p01-plain", userId: TWOTTER_GOOD_ID,
        content: "P-01c: plain date and time. Correct reading: a month ago.",
        sendedAt: plain,
        interaction: { comments: 0, share: 0, likes: 4, views: 44 }, showInTimeline: false,
    });

    tools.println("P-01 (r185) - does Twotter keep a timestamp we hand a tweet?");
    tools.println("Four tweets posted to qe24_probe (" + TWOTTER_GOOD_ID + "). One moment, three spellings, one control:");
    tools.println("  qe24-p01-control  no time sent              should read: just now");
    tools.println("  qe24-p01-iso-ms   " + isoMs + "  should read: a month ago");
    tools.println("  qe24-p01-iso      " + iso + "       should read: a month ago");
    tools.println("  qe24-p01-plain    " + plain + "       should read: a month ago");
    tools.println("Now: open Twotter, search  qe24_probe , open the profile and read the four tweets.");
    tools.println("Report: which ones say \"a month ago\", what the others say, whether the control reads");
    tools.println("\"just now\", the order they appear in, and any new moment.js warning in the log.");
    tools.println("Then: qe24 twotter cleanup");
}


/* P-01b (r185): which way does a profile sort?
 * P-01a proved the engine keeps a `sendedAt` we send. That leaves the display
 * order: the run's own control tweet was newest AND posted first, so "newest
 * first" and "the order we posted them in" looked identical. Three posts whose
 * time order and posting order disagree tell the two apart - and the answer
 * decides the order a backdated series is posted in, and what the editor's
 * preview must mirror.
 * Row: reference/sdk-0.24-qa/P-01-BACKDATE.md */

var TWOTTER_ORDER_IDS = ["qe24-p01b-a", "qe24-p01b-b", "qe24-p01b-c"];

function twotterOrder(tools) {
    var api = twotterApi();
    if (!api || !api.postTweet) { tools.printError("Twotter.postTweet unavailable in this build"); return; }
    if (api.getUserById && !api.getUserById(TWOTTER_GOOD_ID)) {
        tools.printError("The probe account is not in this save. Run: qe24 twotter seed - then run this again.");
        return;
    }
    var now = (sdk.Time && sdk.Time.date) ? sdk.Time.date()
        : new Date((sdk.Time && sdk.Time.now) ? sdk.Time.now() : Date.now());
    function monthsBack(n) {
        var d = new Date(now.getTime());
        d.setMonth(d.getMonth() - n);
        return d.toISOString();
    }
    var two = monthsBack(2);
    var one = monthsBack(1);

    /* A is the oldest AND posted first; B carries no time at all (the engine
       stamps it "now", which P-01a showed); C sits between them and is posted
       last. Insertion order, oldest-first and newest-first are then three
       different readings rather than one ambiguous one. */
    api.postTweet({
        id: "qe24-p01b-a", userId: TWOTTER_GOOD_ID,
        content: "P-01b A: posted first, sent two months back.",
        sendedAt: two,
        interaction: { comments: 0, share: 0, likes: 1, views: 111 }, showInTimeline: false,
    });
    api.postTweet({
        id: "qe24-p01b-b", userId: TWOTTER_GOOD_ID,
        content: "P-01b B: posted second, no time sent (reads just now).",
        interaction: { comments: 0, share: 0, likes: 2, views: 222 }, showInTimeline: false,
    });
    api.postTweet({
        id: "qe24-p01b-c", userId: TWOTTER_GOOD_ID,
        content: "P-01b C: posted third, sent one month back.",
        sendedAt: one,
        interaction: { comments: 0, share: 0, likes: 3, views: 333 }, showInTimeline: false,
    });

    tools.println("P-01b (r185) - which way does a profile sort?");
    tools.println("Three tweets on qe24_probe. Posting order and time order disagree on purpose:");
    tools.println("  A  sent " + two + " (two months back)   posted FIRST");
    tools.println("  B  no time sent (reads 'just now')                posted SECOND");
    tools.println("  C  sent " + one + " (one month back)     posted THIRD");
    tools.println("Now: open Twotter, search  qe24_probe , open the profile and read the three");
    tools.println("tweets top to bottom. Report just the letters:");
    tools.println("  A, B, C  ->  the profile shows them in the order we posted them");
    tools.println("  A, C, B  ->  oldest first");
    tools.println("  B, C, A  ->  newest first");
    tools.println("Then: qe24 twotter cleanup");
}

function twotterCleanup(tools) {
    var api = twotterApi();
    if (!api) { tools.printError("Twotter API unavailable in this build"); return; }
    if (api.removeTweet) {
        var removable = [TWOTTER_TWEET_ID].concat(TWOTTER_BACKDATE_IDS, TWOTTER_ORDER_IDS);
        for (var t = 0; t < removable.length; t++) {
            /* Function-scoped copy, same reason as the ids below. */
            var gone = (function (id) {
                return safe("Twotter.removeTweet", function () { api.removeTweet(id); return "called"; }, "threw");
            })(removable[t]);
            tools.println("removeTweet(" + removable[t] + ") -> " + gone);
        }
    }
    var ids = [["qe24_probe", TWOTTER_GOOD_ID], ["qe24_badrecord", TWOTTER_BAD_ID], ["qe24_declared", TWOTTER_DECLARED_ID]];
    for (var i = 0; i < ids.length; i++) {
        var result = "no removeUser";
        if (api.removeUser) {
            /* Function-scoped copy: `var id` inside a callback would be the same
               binding for every iteration under ES5. */
            result = (function (id) {
                return safe("Twotter.removeUser", function () { return api.removeUser(id); }, "threw");
            })(ids[i][1]);
        }
        tools.println("removeUser(" + ids[i][0] + ") -> " + result);
    }
    tools.println("true = gone. Search for each handle: none should appear, and search must still work.");
    tools.println("false on qe24_declared means the quest-declared path needs a second look before we ship accounts.");
}

function printGuide(tools) {
    ensureSession();
    tools.println("QE24 is a QA harness, not a puzzle quest.");
    tools.println("");
    tools.println("NOTHING auto-starts any more. Loading a save produces no QE24 mail, toast or");
    tools.println("journal line at all - start the one quest you are testing:");
    tools.println("");
    printRunList(tools);
    tools.println("");
    tools.println("Twotter: answered (r180) - the crash shape is safe and accounts can be removed again.");
    tools.println("  New rows (r185): qe24 twotter backdate - do backdated tweets keep their time? (answered: yes)");
    tools.println("  and qe24 twotter order - which way does a profile sort?");
    tools.println("Timer rows: checklist in reference/sdk-0.24-qa/TIMER-ROWS.md, results in STATUS.md.");
    tools.println("Most rows are read from qe24 timers instead of waited for.");
    tools.println("");
    tools.println("Click context probe (r205): qe24 clickprobe on / report / off - which channels does");
    tools.println("  a start-menu click still have, now that UI calls from one are refused?");
    tools.println("Pack extras probe (r199): qe24 extras on / off / lang - does this build show start-menu");
    tools.println("  items, desktop widgets and right-click entries, and does Localization.t translate? Rows T-16..T-19.");
    tools.println("Safety: if a browser/curl request seems stuck after an intercept test, open another terminal and run qe24 intercept off.");
}

function printNextSteps(tools) {
    tools.println("Nothing starts by itself. Pick one:");
    tools.println("");
    tools.println("  qe24 run                 list the quests this harness can start");
    tools.println("  qe24 run timer           the delay rows (S-01/S-02/S-03)");
    tools.println("  qe24 run cal             the calendar rows (S-05/S-06/S-07/S-13)");
    tools.println("  qe24 run wait            Wait in months (S-09/S-14)");
    tools.println("  qe24 run clear           clear quests an older build left claimed");
    tools.println("");
    tools.println("Then read what it armed instead of waiting for it:  qe24 timers");
    tools.println("Rows, steps and results: reference/sdk-0.24-qa/TIMER-ROWS.md and STATUS.md");
}

function printInterceptGuide(tools) {
    tools.println("Intercept means: turn on the game's HTTP proxy hold switch, make one browser/curl request, then release it.");
    tools.println("This checks whether SDK 0.24's Http.Intercepted event can see player traffic. It is safe if you always turn it off again.");
    tools.println("");
    tools.println("Use TWO terminal windows because the browser/curl window may wait until you forward the request:");
    tools.println("1. Terminal A: qe24 intercept on");
    tools.println("2. Terminal A: open http://" + HTTP_HOST + "/ in Browser, or run curl http://" + HTTP_HOST + "/ if curl exists");
    tools.println("3. Terminal B: qe24 intercept queue");
    tools.println("4. Terminal B: qe24 intercept forward  (this harness also turns intercept off)");
    tools.println("5. Optional cleanup: qe24 intercept off");
    tools.println("");
    tools.println("What to look for: the http-intercepted objective ticks, queue shows one GET request, and the waiting browser/curl prints the page after forward.");
    tools.println("If the terminal says curl is not found, no request was made. Run qe24 intercept off and record curl-specific rows as Blocked.");
    tools.println("If queue stays empty or the objective does not tick, record Partial/Fail. Emergency cleanup: qe24 intercept off.");
}

function printHttpHistory(tools) {
    ensureSession();
    var history = sdk.Http && sdk.Http.history ? safe("Http.history", function () { return sdk.Http.history(); }, []) : [];
    var hits = sdk.Http && sdk.Http.collaboratorHits ? safe("Http.collaboratorHits", function () { return sdk.Http.collaboratorHits(); }, []) : [];
    var queue = sdk.Http && sdk.Http.interceptQueue ? safe("Http.interceptQueue", function () { return sdk.Http.interceptQueue(); }, []) : [];
    tools.println("HTTP history entries: " + (history && history.length != null ? history.length : "?"));
    (history || []).slice(-10).forEach(function (tx) {
        var req = tx.request || {};
        var res = tx.response || {};
        tools.println("- " + (req.method || "?") + " " + (req.url || (req.host || "?") + (req.path || "")) + " origin=" + (req.origin || "?") + " status=" + (res.status || "?") + " t=" + (req.at || "?"));
    });
    tools.println("Collaborator hits: " + (hits && hits.length != null ? hits.length : "?"));
    (hits || []).slice(0, 10).forEach(function (hit) {
        tools.println("- " + (hit.kind || "?") + " " + (hit.host || "?") + (hit.path || "") + " method=" + (hit.method || "?") + " t=" + (hit.at || "?"));
    });
    tools.println("Held intercept requests: " + (queue && queue.length != null ? queue.length : "?"));
    (queue || []).forEach(function (held) {
        var req = held.request || {};
        tools.println("- " + (req.id || "?") + " " + (req.method || "?") + " " + (req.url || req.path || "?") + " origin=" + (req.origin || "?"));
    });
}

class QE24SurfaceProbe extends sdk.Quest {
    constructor() {
        super();
        this.Name = "QE24SurfaceProbe";
        this.Title = "QE24 SDK surface probe";
        this.Description = "Developer QA harness. Run qe24 guide first; objectives are test reminders, not a puzzle path.";
        this.Group = "sandbox";
        /* Claimed on demand: `qe24 run probe` (or `qe24 claim surface`). */
        this.AutoStart = false;
        this.AutoComplete = false;
        this.HasCompleteButton = false;
        this.Abandonable = true;
        this.Objectives = [
            { name: "http-response", description: "HTTP event check: run qe24 http-fetch, open the /api/echo page in Browser, or curl it if available; look for status 200/JSON." },
            { name: "http-intercepted", description: "Optional proxy check: run qe24 intercept first for the two-terminal steps; turn it off after forwarding." },
            { name: "collaborator-hit", description: "Callback check: run qe24 collab, then open/curl the printed URL and look for this objective to tick." },
            { name: "scheduler-fired", description: "Clock check: run qe24 schedule 1, then use the clock Wait button or wait for the scheduler mail/toast." },
            { name: "wifi-connect", description: "Wi-Fi check: connect to " + WIFI_SSID + " with passphrase " + WIFI_PASSWORD + "." },
            { name: "wifi-disconnect", description: "Wi-Fi cleanup check: disconnect from the QE24 Wi-Fi network." },
        ];
    }
    CreateData() { return {}; }
    OnStart() {
        log("QE24SurfaceProbe started");
        sendMailSafe("QE24 SDK harness", "Start with qe24 guide in the terminal. This is not a puzzle; the quest objectives are reminders for SDK 0.24 tests.\n\nTest host: http://" + HTTP_HOST + "/\nWi-Fi: " + WIFI_SSID + " / " + WIFI_PASSWORD + "\n\nIf traffic gets stuck after an intercept test, open another terminal and run qe24 intercept off.");
    }
    OnObjectivesStart() {
        var self = this;
        function done(name, detail) {
            completeObjectiveSafe(self, name);
            log("surface objective " + name + " passed" + (detail ? ": " + detail : ""));
        }
        this.Events.on("Http.Response", function (tx) {
            if (tx && tx.request && tx.request.host === HTTP_HOST) done("http-response", tx.request.method + " " + tx.request.path);
        });
        this.Events.on("Http.Intercepted", function (req) {
            if (req && req.host === HTTP_HOST) done("http-intercepted", req.method + " " + req.path);
        });
        this.Events.on("Http.CollaboratorHit", function (hit) {
            if (hit && hit.host && String(hit.host).indexOf(COLLAB_DOMAIN) >= 0) done("collaborator-hit", hit.kind + " " + hit.host + hit.path);
        });
        this.Events.on("QE24.SchedulerFired", function (job) {
            done("scheduler-fired", job && job.id ? job.id : "job fired");
        });
        var currentWifi = sdk.Network && sdk.Network.getConnectedWifi ? safe("Network.getConnectedWifi", function () { return sdk.Network.getConnectedWifi(); }, null) : null;
        var sawTargetWifi = wifiMatchesTarget(currentWifi);
        this.Events.on("Network.WifiConnected", function (ap) {
            if (wifiMatchesTarget(ap)) {
                sawTargetWifi = true;
                done("wifi-connect", describeWifi(ap));
            }
        });
        this.Events.on("Network.WifiDisconnected", function () {
            if (sawTargetWifi) {
                sawTargetWifi = false;
                done("wifi-disconnect", "payload=null after QE24 Wi-Fi was connected");
            } else {
                log("ignored wifi-disconnect before QE24 Wi-Fi connect");
            }
        });
    }
    OnComplete() { log("QE24SurfaceProbe OnComplete fired"); }
    OnAbandon() { log("QE24SurfaceProbe abandoned"); }
}

class QE24DirectCompleteProbe extends sdk.Quest {
    constructor() {
        super();
        this.Name = "QE24DirectCompleteProbe";
        this.Title = "QE24 direct complete() probe";
        this.Description = "Claim with qe24 claim complete, then run qe24 complete.";
        this.Group = "sandbox";
        this.AutoStart = false;
        this.AutoComplete = false;
        this.HasCompleteButton = false;
        this.Abandonable = true;
        this.Rewards = { money: 1, xp: 1 };
        this.Objectives = [{ name: "run-complete", description: "Run qe24 complete. The quest should finish without freezing and should send a mail from OnComplete." }];
    }
    CreateData() { return {}; }
    OnStart() { log("direct-complete probe started"); }
    OnObjectivesStart() {
        var self = this;
        this.Events.on("QE24.CompleteNow", function () {
            log("about to call this.complete() from direct-complete probe");
            completeObjectiveSafe(self, "run-complete");
            self.complete();
            log("this.complete() returned from direct-complete probe");
        });
    }
    OnComplete() {
        log("direct-complete OnComplete fired");
        sendMailSafe("QE24 complete() OnComplete fired", "Direct this.complete() completed the quest without blocking this hook.");
    }
    OnAbandon() { log("direct-complete abandoned"); }
}

class QE24CompleteButtonProbe extends sdk.Quest {
    constructor() {
        super();
        this.Name = "QE24CompleteButtonProbe";
        this.Title = "QE24 Complete button probe";
        this.Description = "Claim with qe24 claim button, run qe24 button-ready, then click the Complete button.";
        this.Group = "sandbox";
        this.AutoStart = false;
        this.AutoComplete = false;
        this.HasCompleteButton = true;
        this.Abandonable = true;
        this.Rewards = { money: 1, xp: 1 };
        this.Objectives = [{ name: "ready", description: "Run qe24 button-ready, then press the quest Complete button." }];
    }
    CreateData() { return {}; }
    OnStart() { log("complete-button probe started"); }
    OnObjectivesStart() {
        var self = this;
        this.Events.on("QE24.ButtonReady", function () {
            completeObjectiveSafe(self, "ready");
            toast("QE24 button probe objective done; click Complete", "info");
        });
    }
    OnComplete() {
        log("complete-button OnComplete fired");
        sendMailSafe("QE24 Complete button OnComplete fired", "The Complete button ran OnComplete without freezing.");
    }
    OnAbandon() { log("complete-button abandoned"); }
}

class QE24RetireProbe extends sdk.Quest {
    constructor() {
        super();
        this.Name = "QE24RetireProbe";
        this.Title = "QE24 retire() probe";
        this.Description = "Claim with qe24 claim retire, then run qe24 retire. It should vanish without rewards.";
        this.Group = "sandbox";
        this.AutoStart = false;
        this.AutoComplete = false;
        this.HasCompleteButton = false;
        this.Abandonable = true;
        this.Objectives = [{ name: "run-retire", description: "Run qe24 retire. This quest should be removed, not completed." }];
    }
    CreateData() { return {}; }
    OnStart() { log("retire probe started"); }
    OnObjectivesStart() {
        var self = this;
        this.Events.on("QE24.RetireNow", function () {
            log("about to call this.retire() from retire probe");
            completeObjectiveSafe(self, "run-retire");
            self.retire();
            log("this.retire() returned from retire probe");
        });
    }
    OnComplete() {
        log("retire probe OnComplete fired; this is unexpected for retire()");
        sendMailSafe("QE24 retire() unexpectedly completed", "retire() ran OnComplete; record this as a failure unless the SDK docs changed.");
    }
    OnAbandon() { log("retire probe abandoned"); }
}

class QE24UnclaimTarget extends sdk.Quest {
    constructor() {
        super();
        this.Name = "QE24UnclaimTarget";
        this.Title = "QE24 static unclaim target";
        this.Description = "Claim with qe24 claim unclaim, then run qe24 unclaim. It should disappear.";
        this.Group = "sandbox";
        this.AutoStart = false;
        this.AutoComplete = false;
        this.HasCompleteButton = false;
        this.Abandonable = true;
        this.Objectives = [{ name: "waiting", description: "Run qe24 unclaim. This quest should be removed without completing." }];
    }
    CreateData() { return {}; }
    OnStart() { log("unclaim target started"); }
    OnObjectivesStart() {}
    OnComplete() { log("unclaim target completed unexpectedly"); }
    OnAbandon() { log("unclaim target abandoned"); }
}

class QE24PhoneOnEndAutoCompleteProbe extends sdk.Quest {
    constructor() {
        super();
        this.Name = "QE24PhoneOnEndAutoCompleteProbe";
        this.Title = "QE24 phone onEnd AutoComplete probe";
        this.Description = "Claim with qe24 claim phone-auto, then run qe24 phone-auto. Let the call end; the final line's onEnd completes the objective, and AutoComplete should finish the quest without freezing.";
        this.Group = "sandbox";
        this.AutoStart = false;
        this.AutoComplete = true;
        this.HasCompleteButton = false;
        this.Abandonable = true;
        this.Rewards = { money: 1, xp: 1 };
        this.Objectives = [{ name: "phone-ended", description: "Run qe24 phone-auto, let the phone call finish, and watch for an OnComplete mail with no renderer freeze." }];
        var self = this;
        this.Dialog = {
            default: [
                { speaker: "QE24", text: "Phone onEnd AutoComplete probe. The last line completes the objective.", timeout: 500 },
                {
                    speaker: "QE24",
                    text: "When this line ends, onEnd completes the objective. AutoComplete should finish the quest.",
                    timeout: 500,
                    isEnd: true,
                    onEnd: function () {
                        log("phone-auto onEnd fired; about to complete objective");
                        completeObjectiveSafe(self, "phone-ended");
                        log("phone-auto onEnd returned after completeObjective");
                    },
                },
            ],
        };
    }
    CreateData() { return {}; }
    OnStart() { log("phone-auto probe started"); }
    OnObjectivesStart() {
        var self = this;
        this.Events.on("QE24.PhoneAutoStart", function () {
            log("starting phone-auto dialog");
            self.createDialog("default", 0);
        });
    }
    OnComplete() {
        log("phone-auto OnComplete fired");
        sendMailSafe("QE24 phone onEnd AutoComplete fired", "A phone Dialog line onEnd completed the objective, AutoComplete finished the quest, and OnComplete returned.");
    }
    OnAbandon() { log("phone-auto abandoned"); }
}

class QE24PhoneOnEndDirectCompleteProbe extends sdk.Quest {
    constructor() {
        super();
        this.Name = "QE24PhoneOnEndDirectCompleteProbe";
        this.Title = "QE24 phone onEnd complete() probe";
        this.Description = "Claim with qe24 claim phone-direct, then run qe24 phone-direct. Let the call end; the final line's onEnd calls this.complete() and should not freeze the renderer.";
        this.Group = "sandbox";
        this.AutoStart = false;
        this.AutoComplete = false;
        this.HasCompleteButton = false;
        this.Abandonable = true;
        this.Rewards = { money: 1, xp: 1 };
        this.Objectives = [{ name: "phone-ended", description: "Run qe24 phone-direct, let the phone call finish, and watch for an OnComplete mail with no renderer freeze." }];
        var self = this;
        this.Dialog = {
            default: [
                { speaker: "QE24", text: "Phone onEnd direct complete probe. The last line calls complete().", timeout: 500 },
                {
                    speaker: "QE24",
                    text: "When this line ends, onEnd will call this.complete(). The game should keep running.",
                    timeout: 500,
                    isEnd: true,
                    onEnd: function () {
                        log("phone-direct onEnd fired; about to complete objective and quest");
                        completeObjectiveSafe(self, "phone-ended");
                        self.complete();
                        log("phone-direct onEnd returned after complete()");
                    },
                },
            ],
        };
    }
    CreateData() { return {}; }
    OnStart() { log("phone-direct probe started"); }
    OnObjectivesStart() {
        var self = this;
        this.Events.on("QE24.PhoneDirectStart", function () {
            log("starting phone-direct dialog");
            self.createDialog("default", 0);
        });
    }
    OnComplete() {
        log("phone-direct OnComplete fired");
        sendMailSafe("QE24 phone onEnd complete() fired", "A phone Dialog line onEnd called this.complete(), the quest completed, and OnComplete returned.");
    }
    OnAbandon() { log("phone-direct abandoned"); }
}

class QE24TwotterProbe extends sdk.Quest {
    constructor() {
        super();
        this.Name = "QE24TwotterProbe";
        this.Title = "QE24 Twotter probe";
        this.Description = "Developer QA harness. Run qe24 twotter for the steps; the objectives are reminders, not a puzzle path.";
        this.Group = "sandbox";
        /* Claimed on demand: `qe24 run twotter`. The probe's commands work either way. */
        this.AutoStart = false;
        this.AutoComplete = false;
        this.HasCompleteButton = false;
        this.Abandonable = true;
        /* The declarative path the editor used before r31: the engine writes
           these records itself. If the bio comes through here, the write path
           is fixed; if it does not, the guard is on the read side only. */
        this.TwotterAccounts = [
            {
                id: TWOTTER_DECLARED_ID,
                username: "qe24_declared",
                displayName: "QE24 Declared Account",
                avatar: "",
                bio: "Declared by the quest definition, not by the API.",
                verified: true,
            },
        ];
        this.Tweets = [
            {
                accountId: TWOTTER_DECLARED_ID,
                content: "Quest-declared tweet (QE24 Twotter probe).",
                likes: 3,
                comments: 1,
                shares: 0,
                views: 42,
                postedAgo: "2 days",
            },
        ];
        this.Objectives = [
            { name: "api-account-seen", description: "Run qe24 twotter seed, then search Twotter for qe24_probe. Ticks when the game reports Twotter.AccountCreated." },
            { name: "declared-profile-seen", description: "Open the profile of qe24_declared (quest-declared account). Ticks on Twotter.ProfileSeen." },
            { name: "post-seen", description: "Run qe24 twotter post, then open the tweet. Ticks on Twotter.PostSeen." },
            { name: "bad-record-search", description: "Run qe24 twotter bad, then search Twotter for qe24_badrecord. Reminder only: the result to report is whether search survives." },
            { name: "repair-after-reload", description: "Save, quit to the main menu, reload, then qe24 twotter status. Reminder only: a repaired bio means 1.3.0's save repair works." },
            { name: "cleanup", description: "Run qe24 twotter cleanup. Reminder only: all three removeUser calls should print true." },
        ];
    }
    CreateData() { return {}; }
    OnStart() {
        log("QE24TwotterProbe started");
        sendMailSafe("QE24 Twotter probe", "Run qe24 twotter in the terminal for the steps.\n\nSearches to make: qe24_probe (API account) and qe24_badrecord (the r31 shape, no bio).\nOpen the profile of qe24_declared for the quest-declared account.\nFinish with qe24 twotter cleanup.");
    }
    OnObjectivesStart() {
        var self = this;
        function done(name, detail) {
            completeObjectiveSafe(self, name);
            log("twotter objective " + name + " passed" + (detail ? ": " + detail : ""));
        }
        this.Events.on("Twotter.AccountCreated", function (account) {
            log("Twotter.AccountCreated payload: " + JSON.stringify(account));
            if (account && (account.id === TWOTTER_GOOD_ID || account.username === "qe24_probe")) {
                done("api-account-seen", account.username);
            }
        });
        this.Events.on("Twotter.ProfileSeen", function (profile) {
            log("Twotter.ProfileSeen payload: " + JSON.stringify(profile));
            if (profile && (profile.username === "qe24_declared" || profile.id === TWOTTER_DECLARED_ID)) {
                done("declared-profile-seen", profile.username);
            }
        });
        this.Events.on("Twotter.PostSeen", function (post) {
            log("Twotter.PostSeen payload: " + JSON.stringify(post));
            if (post && post.userId === TWOTTER_GOOD_ID) done("post-seen", String(post.id));
        });
        this.Events.on("Twotter.AccountLogin", function (account) {
            log("Twotter.AccountLogin (not ours, logging only): " + JSON.stringify(account));
        });
    }
    OnComplete() { log("QE24TwotterProbe OnComplete fired"); }
    OnAbandon() { log("QE24TwotterProbe abandoned"); }
}


/* ── pack extras probe (r199) ────────────────────────────────────────────
 * Four APIs the no-code editor cannot reach yet, and none of them has any
 * prior art in this project: Menu.addItem, Desktop.addWidget,
 * ContextMenu.register and Localization.register/t. The probe registers one
 * of each so a tester can see whether this build shows them at all, and
 * unregisters them again so the game is left as it was found.
 *
 * The widget HTML ships beside this file at widgets/qe24-widget.html - a path
 * relative to the mod root, which is the part most likely to be wrong. Rows
 * T-16..T-19 in reference/sdk-0.24-qa/STATUS.md. */

var EXTRAS_MENU_IDS = ["qe24-extras-menu-none", "qe24-extras-menu-top", "qe24-extras-menu-bottom"];
var EXTRAS_WIDGET_ID = "qe24-extras-widget";        /* opaque, magenta */
var EXTRAS_WIDGET_GHOST_ID = "qe24-extras-widget-ghost";  /* transparent: true */
var EXTRAS_FILE_ITEM_ID = "qe24-extras-file";
var EXTRAS_DESKTOP_ITEM_ID = "qe24-extras-desktop";
var EXTRAS_WIDGET_SRC = "widgets/qe24-widget.html";
var EXTRAS_HELLO_KEY = "qe24.hello";
var EXTRAS_VARS_KEY = "qe24.vars";
var EXTRAS_STRINGS = {
    en: {
        "qe24.hello": "Hello from the QE24 harness.",
        "qe24.vars": "Harness speaking: {{who}}.",
    },
    de: {
        "qe24.hello": "Hallo vom QE24-Testharnisch.",
        "qe24.vars": "Der Testharnisch spricht: {{who}}.",
    },
};

function extrasList(value, name) {
    if (value === null || value === undefined) return name + " unavailable in this build";
    if (!Array.isArray(value)) return name + " returned " + typeof value + " instead of a list";
    var labels = value.map(function (entry) { return (entry && (entry.label || entry.id)) || "?"; });
    return value.length + " [" + (labels.join(", ") || "empty") + "]";
}

function extrasReport(tools, label) {
    var menuItems = sdk.Menu && sdk.Menu.getItems
        ? safe("Menu.getItems", function () { return sdk.Menu.getItems(); }, null) : null;
    var widgets = sdk.Desktop && sdk.Desktop.getWidgets
        ? safe("Desktop.getWidgets", function () { return sdk.Desktop.getWidgets(); }, null) : null;
    var fileItems = sdk.ContextMenu && sdk.ContextMenu.getItems
        ? safe("ContextMenu.getItems(file)", function () { return sdk.ContextMenu.getItems("file"); }, null) : null;
    var desktopItems = sdk.ContextMenu && sdk.ContextMenu.getItems
        ? safe("ContextMenu.getItems(desktop)", function () { return sdk.ContextMenu.getItems("desktop"); }, null) : null;
    tools.println("QE24 extras " + label + " - what the game reports it has now:");
    tools.println("  start-menu items:      " + extrasList(menuItems, "Menu.getItems"));
    tools.println("  desktop widgets:       " + extrasList(widgets, "Desktop.getWidgets"));
    tools.println("  right-click on a file: " + extrasList(fileItems, "ContextMenu.getItems(file)"));
    tools.println("  right-click desktop:   " + extrasList(desktopItems, "ContextMenu.getItems(desktop)"));
}

function extrasGuide(tools) {
    tools.println("Pack extras probe (r199): can a pack put things outside its own quests?");
    tools.println("");
    tools.println("First run (r200) answered: widgets work and render a mod's own HTML, right-click");
    tools.println("  items work on files, and Localization.t() translates - 30 languages listed.");
    tools.println("  Two things came back empty: nothing appeared in the start menu, and the widget");
    tools.println("  drew its text without its background (that is what transparent: true does).");
    tools.println("  This round registers THREE menu items (one per section spelling) and TWO widgets");
    tools.println("  (opaque and transparent) so a single look separates the possibilities.");
    tools.println("");
    tools.println("  qe24 extras on    register a start-menu item, a desktop widget, two right-click");
    tools.println("                    entries (on a file and on the desktop) and two language bundles");
    tools.println("  qe24 extras lang  what this build says about language, and what t() returns");
    tools.println("  qe24 extras say notify|toast   does each of the two UI calls draw anything? (r204)");
    tools.println("  qe24 extras off   unregister all of it again");
    tools.println("");
    tools.println("Rows T-16..T-19 in reference/sdk-0.24-qa/STATUS.md, one per API. What to look at:");
    tools.println("  T-16 menu:     is there a \"QE24 Extras\" entry at the BOTTOM of the start menu,");
    tools.println("                 and does clicking it show a toast?");
    tools.println("  T-17 widget:   does a magenta 320x180 widget appear on the desktop (it names its");
    tools.println("                 own size and id), and does `qe24 extras off` remove it?");
    tools.println("  T-18 menu-2:   right-click a file, then the empty desktop - is there a QE24 entry in each?");
    tools.println("  T-19 language: paste the whole output of `qe24 extras lang`.");
    tools.println("");
    tools.println("If something never appears, the game log is the evidence: search it for [qe24] or extras.");
}

function extrasOn(tools) {
    var done = [];
    var absent = [];
    /* Three items, one per section spelling the interface declares, because the
       first run's single "bottom" item never appeared and there is no way to
       tell from one sample whether the section, the label or the API itself is
       the problem. r201. */
    safe("Menu.addItem", function () {
        if (!sdk.Menu || !sdk.Menu.addItem) { absent.push("Menu.addItem"); return; }
        var sections = [null, "top", "bottom"];
        for (var i = 0; i < sections.length; i++) {
            var item = {
                id: EXTRAS_MENU_IDS[i],
                label: "QE24 menu " + (sections[i] || "no section"),
                onClick: function () { toast("QE24: the start-menu item was clicked", "info"); log("extras: menu item clicked"); },
            };
            if (sections[i]) item.section = sections[i];
            sdk.Menu.addItem(item);
        }
        done.push("3 start-menu items (no section, top, bottom)");
    });
    safe("Desktop.addWidget", function () {
        if (!sdk.Desktop || !sdk.Desktop.addWidget) { absent.push("Desktop.addWidget"); return; }
        /* Two widgets, same HTML, same size, different transparency: the first
           run's widget rendered its text but not its background, which is what
           transparent: true (the SDK default, which we did not override) does.
           Side by side is the only way to read that off one screenshot. r201. */
        sdk.Desktop.addWidget({
            id: EXTRAS_WIDGET_ID,
            src: EXTRAS_WIDGET_SRC,
            width: 320,
            height: 180,
            position: { x: 40, y: 40 },
            transparent: false,
        });
        sdk.Desktop.addWidget({
            id: EXTRAS_WIDGET_GHOST_ID,
            src: EXTRAS_WIDGET_SRC,
            width: 320,
            height: 180,
            position: { x: 400, y: 40 },
            transparent: true,
        });
        done.push("2 desktop widgets (opaque at 40,40; transparent at 400,40) from " + EXTRAS_WIDGET_SRC);
    });
    safe("ContextMenu.register", function () {
        if (!sdk.ContextMenu || !sdk.ContextMenu.register) { absent.push("ContextMenu.register"); return; }
        sdk.ContextMenu.register({
            id: EXTRAS_FILE_ITEM_ID,
            label: "QE24: inspect this file",
            target: "file",
            onClick: function (context) {
                toast("QE24: right-clicked " + ((context && (context.name || context.id)) || "a file"), "info");
                log("extras: file item clicked");
            },
        });
        sdk.ContextMenu.register({
            id: EXTRAS_DESKTOP_ITEM_ID,
            label: "QE24: desktop action",
            target: "desktop",
            onClick: function () { toast("QE24: right-clicked the desktop", "info"); log("extras: desktop item clicked"); },
        });
        done.push("right-click items (target file and target desktop)");
    });
    safe("Localization.register", function () {
        if (!sdk.Localization || !sdk.Localization.register) { absent.push("Localization.register"); return; }
        sdk.Localization.register("en", EXTRAS_STRINGS.en);
        sdk.Localization.register("de", EXTRAS_STRINGS.de);
        done.push("language bundles (en, de)");
    });
    if (done.length) tools.println("Registered: " + done.join("; ") + ".");
    if (absent.length) tools.println("NOT IN THIS BUILD: " + absent.join(", ") + ".");
    extrasReport(tools, "registered");
    tools.println("");
    tools.println("DO NOT run `qe24 extras off` yet - everything below has to still be registered while");
    tools.println("you look at it. When you are done looking, run `qe24 extras off`.");
    tools.println("Now look, in this order:");
    tools.println("  1. the desktop, top-left: you asked for TWO widgets side by side (opaque at 40,40, see-through");
    tools.println("     at 400,40) - are both there, is the left one solid magenta, is the right one see-through,");
    tools.println("     and do the dashed frames measure about 320x180?");
    tools.println("  2. the start menu: three entries ('QE24 menu no section', 'QE24 menu top', 'QE24 menu bottom').");
    tools.println("     Open it, click 'All Applications', and try the 'Downloads' tab too. If you still see none,");
    tools.println("     try right-clicking the start button and the 'Zeis' row at the bottom of the menu.");
    tools.println("  3. right-click a file, then right-click empty desktop space: QE24 entries on both?");
    tools.println("  4. `qe24 extras lang`, and paste that block too.");
}

function extrasOff(tools) {
    safe("Menu.removeItem", function () {
        if (sdk.Menu && sdk.Menu.removeItem) {
            for (var i = 0; i < EXTRAS_MENU_IDS.length; i++) sdk.Menu.removeItem(EXTRAS_MENU_IDS[i]);
        }
    });
    safe("Desktop.removeWidget", function () {
        if (sdk.Desktop && sdk.Desktop.removeWidget) {
            sdk.Desktop.removeWidget(EXTRAS_WIDGET_ID);
            sdk.Desktop.removeWidget(EXTRAS_WIDGET_GHOST_ID);
        }
    });
    safe("ContextMenu.unregister", function () {
        if (sdk.ContextMenu && sdk.ContextMenu.unregister) {
            sdk.ContextMenu.unregister(EXTRAS_FILE_ITEM_ID);
            sdk.ContextMenu.unregister(EXTRAS_DESKTOP_ITEM_ID);
        }
    });
    tools.println("Unregistered the QE24 extras. The language bundles stay - the SDK has no");
    tools.println("unregister for them, and a handful of strings is harmless.");
    extrasReport(tools, "after off");
    tools.println("What matters: the start-menu entry, the widget and both right-click entries are gone.");
}

function extrasLang(tools) {
    tools.println("QE24 extras lang - Localization in this build:");
    if (!sdk.Localization || !sdk.Localization.t) {
        tools.println("  Localization.t is NOT in this build, so no pack can translate anything yet.");
        return;
    }
    tools.println("  language():                 " + safe("Localization.language", function () { return sdk.Localization.language(); }, "(unavailable)"));
    var langs = safe("Localization.languages", function () { return sdk.Localization.languages(); }, null);
    tools.println("  languages():                " + (Array.isArray(langs) ? langs.join(", ") : "(unavailable)"));
    /* Register here too, so `qe24 extras lang` alone is a complete reading:
       a tester who runs only this command must still see a real translation. */
    var registered = "no";
    safe("Localization.register", function () {
        if (!sdk.Localization || !sdk.Localization.register) return;
        sdk.Localization.register("en", EXTRAS_STRINGS.en);
        sdk.Localization.register("de", EXTRAS_STRINGS.de);
        registered = "yes";
    });
    tools.println("  we registered:              " + registered + " (en, de; keys " + EXTRAS_HELLO_KEY + " and " + EXTRAS_VARS_KEY + ")");
    tools.println("  t(\"" + EXTRAS_HELLO_KEY + "\"): " + safe("Localization.t", function () { return sdk.Localization.t(EXTRAS_HELLO_KEY); }, "(threw)"));
    tools.println("  t(\"" + EXTRAS_VARS_KEY + "\", {who: \"QE24\"}): " + safe("Localization.t", function () { return sdk.Localization.t(EXTRAS_VARS_KEY, { who: "QE24" }); }, "(threw)"));
    tools.println("  t(\"qe24.absent\"): " + safe("Localization.t", function () { return sdk.Localization.t("qe24.absent"); }, "(threw)"));
    tools.println("Reading: a translated line proves t() resolves; a missing key echoing its own name is");
    tools.println("the SDK's documented fallback, and a blank line there would be worth filing.");
    tools.println("");
    tools.println("r204: the line above shows the language the GAME reports. If the game is set to");
    tools.println("German and language() still says en, no pack can translate anything on this build -");
    tools.println("that is worth reporting with the whole output of this command.");
}

/* r204. Every notification QA has ever SEEN in this game came from a toast.
   UI.notify is declared by the SDK (and used by the editor's Notify node in its
   default variant), but nothing has ever been reported appearing because of it -
   and the r203 pack-extras run is the first time a mod has asked a player to
   notice one. One command per call, so a single look says which one renders:
   run one, look, run the other, look. */
function extrasSay(tools, which) {
    var text = "QE24 " + which + " marker";
    if (which !== "notify" && which !== "toast") {
        tools.println("qe24 extras say notify   call UI.notify and say so in the log");
        tools.println("qe24 extras say toast    call UI.toast and say so in the log");
        tools.println("Run ONE, look at the screen, then run the other. Whichever draws");
        tools.println("something tells us what the editor's own notifications can rely on.");
        return;
    }
    if (!sdk.UI || !sdk.UI[which]) {
        tools.println("UI." + which + " is NOT in this build - nothing was called.");
        return;
    }
    var how = "not called";
    safe("UI." + which, function () {
        if (which === "toast") sdk.UI.toast(text, "info");
        else sdk.UI.notify(text);
        how = "called";
    });
    log("extras say " + which + ": " + how);
    tools.println("UI." + which + '(\"' + text + '\")' + " was " + how + ".");
    tools.println("  NOTIFY is the popup the SDK documents; TOAST is the one this project has seen.");
    tools.println("  Look at the screen now: did \"" + text + "\" appear? Quote it either way -");
    tools.println("  a call that draws nothing is a finding, not a dead end.");
}

/* ── the click-context probe (r205) ────────────────────────────────────────

   The r204 run answered the question it was built for, and the answer was not
   the one either hypothesis expected:

     [quest-editor] extras: menu item "qe24-menu-extras" clicked (language en)
     [quest-editor] extras: UI.toast threw: [ContentSDK] Mod "null" tried to use
       UI.toast without "ui" permission. ...

   The click DOES reach a pack. What it does not reach is the permission check's
   idea of WHICH MOD IS CALLING: from a quest or a command there is a current mod,
   from a click handler the SDK reads it as "null" and refuses every gated call.
   The same export, in the same session, showed a UI.notify from a quest context
   (row F) without complaint - so the manifest is not the problem; the context is.

   What a pack can still do from a click is the part that decides whether the
   editor's four click actions are usable at all, so this probe tries every
   channel once and records what each one said. */

var CLICKPROBE_KIND = "qe24-clickprobe";
var CLICKPROBE_JOB = "qe24-clickprobe-job";
var CLICKPROBE_MENU_ID = "qe24-clickprobe-menu";
var clickProbeLog = [];
var clickProbeJobFired = false;

function clickProbeRecord(line) {
    clickProbeLog.push(line);
    log("clickprobe: " + line);
}

function clickProbeAttempt(label, fn) {
    try {
        fn();
        clickProbeRecord(label + " - WORKED");
        return true;
    } catch (e) {
        clickProbeRecord(label + " - refused: " + ((e && e.message) ? e.message : e));
        return false;
    }
}

function clickProbeHandler() {
    clickProbeLog = [];
    clickProbeRecord("click arrived");
    /* 1. No permission at all: if even this failed, the click would have no
          access to its own mod's state, which would be a different bug. */
    clickProbeAttempt("SharedVariables.set (no permission)", function () {
        sdk.SharedVariables.set("qe.clickprobe.touch", "yes");
    });
    /* 2/3. The two UI calls the editor's message action needs. */
    clickProbeAttempt("UI.notify (ui permission)", function () { sdk.UI.notify("QE24 clickprobe: direct notify"); });
    clickProbeAttempt("UI.toast (ui permission)", function () { sdk.UI.toast("QE24 clickprobe: direct toast", "info"); });
    /* 4. Mail, which the editor's mail action needs. */
    clickProbeAttempt("Mail.send (mail permission)", function () {
        sdk.Mail.send({ subject: "QE24 clickprobe mail", content: "If this arrived, mail works from a click." });
    });
    /* 5. Starting a quest, the editor's claim action. */
    clickProbeAttempt("Quest.claim (the claim action)", function () { sdk.Quest.claim("QE24SurfaceProbe"); });
    /* 6. The candidate workaround: hand the work to the engine, which calls the
          job back with a mod that the permission check can name. */
    clickProbeAttempt("Scheduler.schedule (defer to the engine)", function () {
        sdk.Scheduler.schedule(CLICKPROBE_KIND, {}, { ms: 1 }, CLICKPROBE_JOB);
    });
}

function clickProbeJob() {
    clickProbeJobFired = true;
    clickProbeAttempt("DEFERRED UI.toast (from a scheduler job)", function () {
        sdk.UI.toast("QE24 clickprobe: the DEFERRED toast works", "info");
    });
    clickProbeAttempt("DEFERRED UI.notify (from a scheduler job)", function () {
        sdk.UI.notify("QE24 clickprobe: the DEFERRED notify works");
    });
}

function clickProbeRegister() {
    safe("Scheduler.register", function () {
        if (sdk.Scheduler && sdk.Scheduler.register) sdk.Scheduler.register(CLICKPROBE_KIND, clickProbeJob);
    });
}

function clickProbe(tools, verb) {
    if (verb === "on") {
        clickProbeLog = [];
        clickProbeJobFired = false;
        /* Register the job kind here as well as at load: the probe has to work
           in a session where it was turned on later, and `register` on the same
           kind twice is a no-op by the SDK's own description. */
        clickProbeRegister();
        safe("clickprobe Menu.addItem", function () {
            if (sdk.Menu && sdk.Menu.removeItem) sdk.Menu.removeItem(CLICKPROBE_MENU_ID);
        });
        var ok = false;
        safe("clickprobe Menu.addItem", function () {
            sdk.Menu.addItem({
                id: CLICKPROBE_MENU_ID,
                label: "QE24: click probe",
                onClick: clickProbeHandler,
            });
            ok = true;
        });
        tools.println("Click probe registered: " + (ok ? "yes" : "NO - Menu.addItem is missing"));
        tools.println("Now, IN THIS ORDER:");
        tools.println("  1. open the start menu and click \"QE24: click probe\"");
        tools.println("  2. wait two seconds (the deferred attempt fires about a second later)");
        tools.println("  3. come back here and run: qe24 clickprobe report");
        tools.println("Look at the screen too, and say what appeared: the direct attempt should");
        tools.println("be refused (that is the r204 finding), and the deferred one is the question.");
        return;
    }
    if (verb === "report") {
        tools.println("QE24 click probe - what happened when the item was clicked:");
        if (clickProbeLog.length === 0) {
            tools.println("  Nothing recorded. Either the item was never clicked, or it was clicked");
            tools.println("  in a session where the menu item was not registered. Run `qe24 clickprobe on`");
            tools.println("  first, click it, then run this again.");
            return;
        }
        for (var i = 0; i < clickProbeLog.length; i++) tools.println("  " + clickProbeLog[i]);
        tools.println("  deferred job fired: " + (clickProbeJobFired ? "yes" : "NOT YET (wait a second and report again)"));
        tools.println("");
        tools.println("How to read it: every line that says WORKED is a channel the editor's own");
        tools.println("menu items can use. The REFUSED lines name the mod as \"null\" - that is the");
        tools.println("permission check not being able to tell which mod clicked, not a missing");
        tools.println("permission (this mod's manifest lists ui and mail). If the DEFERRED lines");
        tools.println("worked, the editor can route a click through the engine and keep all four of");
        tools.println("its click actions.");
        return;
    }
    if (verb === "off") {
        safe("clickprobe Menu.removeItem", function () {
            if (sdk.Menu && sdk.Menu.removeItem) sdk.Menu.removeItem(CLICKPROBE_MENU_ID);
        });
        tools.println("Click probe removed.");
        return;
    }
    tools.println("qe24 clickprobe on      register \"QE24: click probe\" in the start menu (r205)");
    tools.println("qe24 clickprobe report  what each channel said when it was clicked");
    tools.println("qe24 clickprobe off     take the item away again");
    tools.println("");
    tools.println("Why: r204's run showed a menu click reaching the pack and then being refused -");
    tools.println("  [ContentSDK] Mod \"null\" tried to use UI.toast without \"ui\" permission.");
    tools.println("This probe finds which channels a click CAN use, and whether handing the work");
    tools.println("to the engine (a scheduler job) gets the mod's identity back.");
}

function extrasProbe(tools, verb) {
    if (verb === "on") { extrasOn(tools); return; }
    if (verb === "off") { extrasOff(tools); return; }
    if (verb === "lang") { extrasLang(tools); return; }
    if (verb === "say") { extrasSay(tools, tools.getArgs()[2]); return; }
    extrasGuide(tools);
}

class QE24Command extends sdk.Command {
    constructor() {
        super();
        this.CommandName = "qe24";
        this.Description = "SDK 0.24 QA harness commands";
        this.Autocomplete = [
            { label: "qe24", type: "STRING" },
            { label: "guide|next|run|status|history|clock|timers|extras|twotter|seed|http-fetch|schedule|collab|intercept|claim|complete|button-ready|retire|unclaim|phone-auto|phone-direct|reset", type: "STRING" },
        ];
    }
    async Run(tools) {
        var args = tools.getArgs ? tools.getArgs() : [];
        var sub = args[0] || "guide";
        if (sub === "help") sub = "guide";
        if (sub === "guide") {
            printGuide(tools);
            return;
        }
        if (sub === "next") {
            printNextSteps(tools);
            return;
        }
        if (sub === "status") {
            ensureSession();
            var jobs = sdk.Scheduler && sdk.Scheduler.list ? safe("Scheduler.list", function () { return sdk.Scheduler.list(SCHEDULE_KIND); }, []) : [];
            var history = sdk.Http && sdk.Http.history ? safe("Http.history", function () { return sdk.Http.history(); }, []) : [];
            var queue = sdk.Http && sdk.Http.interceptQueue ? safe("Http.interceptQueue", function () { return sdk.Http.interceptQueue(); }, []) : [];
            var interceptOn = sdk.Http && sdk.Http.interceptEnabled ? safe("Http.interceptEnabled", function () { return sdk.Http.interceptEnabled(); }, false) : "unavailable";
            var wifis = sdk.Network && sdk.Network.getWifiNetworks ? safe("Network.getWifiNetworks", function () { return sdk.Network.getWifiNetworks(); }, []) : [];
            var targetWifis = Array.isArray(wifis) ? wifis.filter(wifiMatchesTarget) : [];
            var targetWifi = targetWifis[0] || null;
            var currentWifi = sdk.Network && sdk.Network.getConnectedWifi ? safe("Network.getConnectedWifi", function () { return sdk.Network.getConnectedWifi(); }, null) : null;
            var connectedMatchesTarget = wifiMatchesTarget(currentWifi);
            tools.println("QE24 SDK 0.24 QA harness");
            tools.println("Host: http://" + HTTP_HOST + "/");
            tools.println("Wi-Fi: " + WIFI_SSID + " / " + WIFI_PASSWORD);
            tools.println("Time.now: " + (sdk.Time && sdk.Time.now ? sdk.Time.now() : "unavailable") + " scale=" + (sdk.Time && sdk.Time.scale ? sdk.Time.scale() : "unavailable"));
            tools.println("Scheduler pending: " + (jobs && jobs.length != null ? jobs.length : "?"));
            tools.println("HTTP history: " + (history && history.length != null ? history.length : "?") + "; intercept enabled: " + interceptOn + "; intercept queue: " + (queue && queue.length != null ? queue.length : "?"));
            tools.println("Visible Wi-Fi networks: " + (wifis && wifis.length != null ? wifis.length : "?"));
            tools.println("Target Wi-Fi matches: " + (targetWifis && targetWifis.length != null ? targetWifis.length : "?"));
            tools.println("Target Wi-Fi details: " + describeWifi(targetWifi));
            tools.println("Connected Wi-Fi: " + describeWifi(currentWifi));
            tools.println("Connected Wi-Fi is QE24 target: " + (connectedMatchesTarget ? "yes" : "no"));
            if (targetWifi && currentWifi && !connectedMatchesTarget) tools.println("Note: if the game UI says QE24 is connected, paste this mismatch before we unhide Wi-Fi.");
            tools.println("Tip: run qe24 next if the 6/6 surface objective quest is already done, qe24 intercept for proxy-test steps, or qe24 history for HTTP/collab evidence.");
            tools.println("Commands: qe24 guide · qe24 next · qe24 run [timer|cal|wait|probe|twotter|tw1|tw2|tw3|surface|clear] · qe24 status · qe24 history · qe24 clock · qe24 timers · qe24 twotter [seed|bad|update|post|backdate|order|audit|cleanup] · qe24 http-fetch · qe24 schedule 1 · qe24 collab · qe24 intercept on|off|queue|forward|drop · qe24 claim complete|button|retire|unclaim|phone-auto|phone-direct · qe24 complete · qe24 button-ready · qe24 retire · qe24 unclaim · qe24 phone-auto · qe24 phone-direct · qe24 reset");
            return;
        }
        if (sub === "history") {
            printHttpHistory(tools);
            return;
        }
        if (sub === "clock") {
            printClockProbe(tools);
            return;
        }
        if (sub === "timers") {
            printTimers(tools);
            return;
        }
        if (sub === "run") {
            runQaQuest(tools, args[1]);
            return;
        }
        if (sub === "clickprobe") {
            /* `qe24 clickprobe on` - the verb is the FIRST argument after the
               subcommand, unlike `qe24 extras say toast` where it is the second. */
            clickProbe(tools, tools.getArgs()[1]);
            return;
        }
        if (sub === "extras") {
            extrasProbe(tools, args[1] || "guide");
            return;
        }
        if (sub === "twotter") {
            var verb = args[1] || "guide";
            if (verb === "guide") { printTwotterGuide(tools); return; }
            if (verb === "status") { printTwotterStatus(tools); return; }
            if (verb === "seed") { twotterSeed(tools); return; }
            if (verb === "bad") { twotterBad(tools); return; }
            if (verb === "update") { twotterUpdate(tools); return; }
            if (verb === "post") { twotterPost(tools); return; }
            if (verb === "backdate") { twotterBackdate(tools); return; }
            if (verb === "order") { twotterOrder(tools); return; }
            if (verb === "audit") { twotterAudit(tools); return; }
            if (verb === "cleanup") { twotterCleanup(tools); return; }
            tools.printError("Unknown twotter verb: " + verb + " (try: qe24 twotter)");
            return;
        }
        if (sub === "seed") {
            ensureSession();
            tools.printSuccess ? tools.printSuccess("QE24 per-save content seeded.") : tools.println("QE24 per-save content seeded.");
            return;
        }
        if (sub === "http-fetch") {
            ensureSession();
            if (!sdk.Http || !sdk.Http.fetch) { tools.printError("Http.fetch unavailable"); return; }
            var res = await sdk.Http.fetch("http://" + HTTP_HOST + "/api/echo?from=qe24", {
                method: "POST",
                headers: { "x-qe24": "command" },
                body: "hello from qe24",
                origin: "script",
            });
            tools.println("Http.fetch status " + res.status + " body: " + res.body);
            tools.println("Look for the http-response objective to tick. If it did, record HTTP fetch/response as Pass.");
            return;
        }
        if (sub === "schedule") {
            registerScheduler();
            if (!sdk.Scheduler || !sdk.Scheduler.schedule) { tools.printError("Scheduler.schedule unavailable"); return; }
            var minutes = Math.max(1, Number(args[1] || 1) || 1);
            var id = "qe24-scheduled-mail";
            if (sdk.Scheduler.cancel) safe("Scheduler.cancel", function () { sdk.Scheduler.cancel(id); });
            var jobId = sdk.Scheduler.schedule(SCHEDULE_KIND, { command: "qe24 schedule", minutes: minutes }, { minutes: minutes }, id);
            tools.println("Scheduled " + jobId + " for " + minutes + " in-game minute(s). Use the taskbar clock Wait button, or wait for game time to pass.");
            tools.println("Look for a scheduler mail/toast and the scheduler-fired objective. After reload, the job should not duplicate.");
            return;
        }
        if (sub === "collab") {
            registerHttp();
            if (!sdk.Http || !sdk.Http.mintCollaboratorSubdomain) { tools.printError("collaborator APIs unavailable"); return; }
            var collabInterceptOn = sdk.Http.interceptEnabled ? safe("Http.interceptEnabled", function () { return sdk.Http.interceptEnabled(); }, false) : false;
            if (collabInterceptOn) {
                tools.printWarning ? tools.printWarning("Intercept is still ON. Run qe24 intercept off before opening the collaborator URL unless you are deliberately testing held collaborator traffic.") : tools.println("Warning: intercept is still ON; run qe24 intercept off before opening the collaborator URL.");
            }
            var host = sdk.Http.mintCollaboratorSubdomain();
            tools.println("Open in Browser: http://" + host + "/qe24");
            tools.println("Or, if your game build has curl, run: curl http://" + host + "/qe24");
            tools.println("Expected: collaborator-hit objective ticks and qe24 status/history can show the hit. If nothing happens, record Partial/Fail.");
            tools.println("If curl says command not found, record the curl-only row as Blocked and try the Browser URL instead.");
            tools.println("Optional DNS-only check: run nslookup " + host + " without http/path, then qe24 history; look for a kind=dns collaborator hit.");
            tools.println("If nslookup says No results found and history does not change, record DNS-only collaborator as unsupported/fail for this build.");
            return;
        }
        if (sub === "intercept") {
            if (!sdk.Http) { tools.printError("Http APIs unavailable"); return; }
            var mode = args[1] || "help";
            if (mode === "help") { printInterceptGuide(tools); return; }
            if (mode === "on") {
                sdk.Http.setInterceptEnabled(true);
                tools.printWarning ? tools.printWarning("Intercept ON. Keep a second terminal ready: Browser/curl may wait until you run qe24 intercept forward/off there.") : tools.println("Intercept ON. Keep a second terminal ready.");
                tools.println("Next: open http://" + HTTP_HOST + "/ in Browser, or run curl http://" + HTTP_HOST + "/ if available; then qe24 intercept queue and qe24 intercept forward in another terminal.");
                return;
            }
            if (mode === "off") { sdk.Http.setInterceptEnabled(false); if (sdk.Http.interceptForwardAll) sdk.Http.interceptForwardAll(); tools.println("Intercept OFF and any held requests forwarded."); return; }
            if (mode === "forward") { if (sdk.Http.interceptForwardAll) sdk.Http.interceptForwardAll(); sdk.Http.setInterceptEnabled(false); tools.println("Forwarded all held requests and turned intercept OFF. The waiting browser/curl should continue now."); return; }
            if (mode === "drop") { if (sdk.Http.interceptDropAll) sdk.Http.interceptDropAll(); sdk.Http.setInterceptEnabled(false); tools.println("Dropped all held requests and turned intercept OFF. The waiting browser/curl should fail now."); return; }
            var held = sdk.Http.interceptQueue ? sdk.Http.interceptQueue() : [];
            tools.println("Intercept enabled: " + (sdk.Http.interceptEnabled ? sdk.Http.interceptEnabled() : "unavailable"));
            tools.println("Held requests: " + held.length);
            if (!held.length) tools.println("No held requests. If you expected one, make sure intercept is on and use browser/curl traffic, not qe24 http-fetch. If curl is missing, try Browser or mark curl-only rows Blocked.");
            held.forEach(function (h) { tools.println(h.request.id + " " + h.request.method + " " + h.request.url); });
            return;
        }
        if (sub === "claim") {
            var which = args[1] || "complete";
            var names = { complete: "QE24DirectCompleteProbe", button: "QE24CompleteButtonProbe", retire: "QE24RetireProbe", unclaim: "QE24UnclaimTarget", surface: "QE24SurfaceProbe", "phone-auto": "QE24PhoneOnEndAutoCompleteProbe", "phone-direct": "QE24PhoneOnEndDirectCompleteProbe" };
            var q = names[which];
            if (!q || !sdk.Quest || !sdk.Quest.claim) { tools.printError("Unknown quest or Quest.claim unavailable"); return; }
            sdk.Quest.claim(q);
            tools.println("Claimed " + q + ".");
            return;
        }
        if (sub === "complete") {
            if (sdk.Events && sdk.Events.emit) sdk.Events.emit("QE24.CompleteNow", {});
            tools.println("Emitted QE24.CompleteNow. Watch for the completion mail and renderer freeze.");
            return;
        }
        if (sub === "button-ready") {
            if (sdk.Events && sdk.Events.emit) sdk.Events.emit("QE24.ButtonReady", {});
            tools.println("Button-probe objective completed. Click the quest Complete button now.");
            return;
        }
        if (sub === "retire") {
            if (sdk.Events && sdk.Events.emit) sdk.Events.emit("QE24.RetireNow", {});
            tools.println("Emitted QE24.RetireNow. The retire quest should disappear.");
            return;
        }
        if (sub === "unclaim") {
            if (sdk.Quest && sdk.Quest.unclaim) sdk.Quest.unclaim("QE24UnclaimTarget");
            tools.println("Called Quest.unclaim(\"QE24UnclaimTarget\").");
            return;
        }
        if (sub === "phone-auto") {
            if (sdk.Events && sdk.Events.emit) sdk.Events.emit("QE24.PhoneAutoStart", {});
            tools.println("Started QE24PhoneOnEndAutoCompleteProbe's phone call. Let the call end; the objective should complete and AutoComplete should finish the quest without freezing.");
            return;
        }
        if (sub === "phone-direct") {
            if (sdk.Events && sdk.Events.emit) sdk.Events.emit("QE24.PhoneDirectStart", {});
            tools.println("Started QE24PhoneOnEndDirectCompleteProbe's phone call. Let the call end; onEnd should call complete() without freezing.");
            return;
        }
        if (sub === "reset") {
            var httpIp = saveGet(HTTP_IP_KEY);
            var wifiIp = saveGet(WIFI_IP_KEY);
            if (sdk.Http && sdk.Http.setInterceptEnabled) sdk.Http.setInterceptEnabled(false);
            if (sdk.Http && sdk.Http.interceptForwardAll) sdk.Http.interceptForwardAll();
            if (sdk.Network && sdk.Network.removeDomain) safe("removeDomain", function () { sdk.Network.removeDomain(HTTP_HOST); });
            if (sdk.Network && sdk.Network.destroyNetwork) {
                if (httpIp) await sdk.Network.destroyNetwork(httpIp);
                if (wifiIp) await sdk.Network.destroyNetwork(wifiIp);
            }
            saveRemove(HTTP_IP_KEY);
            saveRemove(WIFI_IP_KEY);
            saveRemove(SESSION_KEY);
            tools.println("QE24 saved IPs cleared and known networks removed. Run qe24 seed to recreate.");
            return;
        }
        tools.printError("Unknown qe24 command. Run qe24 guide or qe24 next.");
    }
}

class QE24Bootstrap extends sdk.Bootstrap {
    OnModPackageLoaded() {
        log("mod loaded");
        registerSessionHook();
        registerScheduler();
        registerHttp();
        clickProbeRegister();
    }
    OnModPackageUnloaded() {
        log("mod unloading");
        safe("intercept off", function () {
            if (sdk.Http && sdk.Http.setInterceptEnabled) sdk.Http.setInterceptEnabled(false);
            if (sdk.Http && sdk.Http.interceptForwardAll) sdk.Http.interceptForwardAll();
        });
        safe("Http.unregisterHost", function () { if (sdk.Http && sdk.Http.unregisterHost) sdk.Http.unregisterHost(HTTP_HOST); });
        safe("Http.unpublish", function () { if (sdk.Http && sdk.Http.unpublish) sdk.Http.unpublish(HTTP_HOST); });
        safe("Scheduler.unregister", function () { if (sdk.Scheduler && sdk.Scheduler.unregister) sdk.Scheduler.unregister(SCHEDULE_KIND); });
        /* The SDK docs say mod-added accounts stay in the save after uninstall,
           so the probe cleans up after itself. removeUser is the call that did
           not exist when Twotter was pulled (r31), which is exactly why it is
           worth exercising from the unload path too. */
        safe("Twotter cleanup on unload", function () {
            if (!sdk.Twotter || !sdk.Twotter.removeUser) return;
            var ids = [TWOTTER_GOOD_ID, TWOTTER_BAD_ID, TWOTTER_DECLARED_ID];
            for (var i = 0; i < ids.length; i++) {
                log("unload removeUser(" + ids[i] + ") -> " + sdk.Twotter.removeUser(ids[i]));
            }
        });
    }
}

sdk.RegisterQuest(QE24SurfaceProbe);
sdk.RegisterQuest(QE24DirectCompleteProbe);
sdk.RegisterQuest(QE24CompleteButtonProbe);
sdk.RegisterQuest(QE24RetireProbe);
sdk.RegisterQuest(QE24UnclaimTarget);
sdk.RegisterQuest(QE24PhoneOnEndAutoCompleteProbe);
sdk.RegisterQuest(QE24PhoneOnEndDirectCompleteProbe);
sdk.RegisterQuest(QE24TwotterProbe);
if (typeof sdk.RegisterCommand === "function") {
    sdk.RegisterCommand({ default: true, scope: "local" })(QE24Command);
}
sdk.RegisterModPackage(QE24Bootstrap);

module.exports = Object.defineProperty({ __esModule: true }, "default", {
    get: function () { return QE24Bootstrap; },
    enumerable: true,
});
