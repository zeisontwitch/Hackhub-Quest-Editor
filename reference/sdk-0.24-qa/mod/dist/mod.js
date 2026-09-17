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

function printGuide(tools) {
    ensureSession();
    tools.println("QE24 is a QA harness, not a puzzle quest. The quest objectives are reminders for tests you can run in any order.");
    tools.println("");
    tools.println("What is new enough to check in SDK 0.24:");
    tools.println("1. HTTP/browser/curl events: Browser, curl or Http.fetch traffic should raise Http.Request/Http.Response events.");
    tools.println("2. HTTP intercept: a proxy-style switch can HOLD browser/curl requests so a tool can inspect or forward them.");
    tools.println("3. Collaborator hits: a one-use callback domain should record when Browser, curl or DNS touches it.");
    tools.println("4. Scheduler/Time: jobs should fire on the in-game clock and survive save/load.");
    tools.println("5. Native Wi-Fi: a mod can create a real Wi-Fi AP with BSSID, channel and WPS fields.");
    tools.println("6. Quest completion APIs: complete, retire and unclaim should not freeze or leave stale quests.");
    tools.println("7. Phone Dialog onEnd completion: a line-end callback should be able to finish a quest without freezing.");
    tools.println("");
    tools.println("Easy first pass:");
    tools.println("- qe24 http-fetch. If it printed status 200 and the http-response objective ticked, record that as a pass.");
    tools.println("- Optional proxy test: run qe24 intercept with no extra word to print the two-terminal steps.");
    tools.println("- Time test: qe24 schedule 1, then use the clock Wait button or wait until the scheduler mail/toast appears.");
    tools.println("- Clock zone test: qe24 clock prints two renderings of the current in-game time; compare them with the clock on screen (S-04).");
    tools.println("- Collaborator test: qe24 collab, then open the printed URL in the in-game browser, or run the curl command if your build has curl.");
    tools.println("- Wi-Fi test: connect to " + WIFI_SSID + " with passphrase " + WIFI_PASSWORD + ", then disconnect.");
    tools.println("");
    tools.println("If the surface quest is already 6/6, run qe24 next. The remaining QA is in separate probe quests and reload checks.");
    tools.println("Safety: if any browser/curl request seems stuck after an intercept test, open another terminal and run qe24 intercept off.");
    tools.println("If curl says command not found, no request was made: run qe24 intercept off and mark curl-only rows Blocked for that game build.");
}

function printNextSteps(tools) {
    tools.println("Next after QE24SurfaceProbe is 6/6:");
    tools.println("1. Evidence snapshot: qe24 status, then qe24 history. Paste those lines if you can.");
    tools.println("2. Wi-Fi: do NOT need to crack " + WIFI_SSID + "; the passphrase is intentionally known. We are checking SDK AP creation/events, not solving a Wi-Fi puzzle.");
    tools.println("   Connect with " + WIFI_PASSWORD + ", run qe24 status, and confirm Connected Wi-Fi is QE24 target: yes.");
    tools.println("   Then disconnect from the QE24 network, run qe24 status again, reload, and confirm Target Wi-Fi matches stays at 1.");
    tools.println("   Optional but useful: crack/test it with Bettercap. If set wifi.ap by BSSID prints SSID undefined but handshake/hashcat works, record W-04 as Partial.");
    tools.println("3. Quest lifecycle probes, preferably on a clean throwaway save:");
    tools.println("   qe24 claim complete  -> qe24 complete  -> save/reload and check no duplicate mail/reward/freeze.");
    tools.println("   qe24 claim button    -> qe24 button-ready -> click the quest Complete button -> save/reload.");
    tools.println("   qe24 claim retire    -> qe24 retire    -> quest should disappear without OnComplete/reward.");
    tools.println("   qe24 claim unclaim   -> qe24 unclaim   -> quest should disappear without being completed.");
    tools.println("   qe24 claim phone-auto -> qe24 phone-auto -> let the call end; AutoComplete should finish without freezing.");
    tools.println("   qe24 claim phone-direct -> qe24 phone-direct -> let the call end; onEnd calls complete() without freezing.");
    tools.println("4. Scheduler reload: qe24 schedule 10, save/reload before it fires if you can, then wait. It should fire once.");
    tools.println("5. Clock zone (S-04): qe24 clock, then compare its two renderings with the in-game clock on screen.");
    tools.println("6. Later, install the editor export to test QE24-LAB-5G, qe24-website.test and the QESdk024TimerQa rows.");
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
        this.AutoStart = true;
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

class QE24Command extends sdk.Command {
    constructor() {
        super();
        this.CommandName = "qe24";
        this.Description = "SDK 0.24 QA harness commands";
        this.Autocomplete = [
            { label: "qe24", type: "STRING" },
            { label: "guide|next|status|history|clock|seed|http-fetch|schedule|collab|intercept|claim|complete|button-ready|retire|unclaim|phone-auto|phone-direct|reset", type: "STRING" },
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
            tools.println("Commands: qe24 guide · qe24 next · qe24 status · qe24 history · qe24 clock · qe24 http-fetch · qe24 schedule 1 · qe24 collab · qe24 intercept on|off|queue|forward|drop · qe24 claim complete|button|retire|unclaim|phone-auto|phone-direct · qe24 complete · qe24 button-ready · qe24 retire · qe24 unclaim · qe24 phone-auto · qe24 phone-direct · qe24 reset");
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
    }
}

sdk.RegisterQuest(QE24SurfaceProbe);
sdk.RegisterQuest(QE24DirectCompleteProbe);
sdk.RegisterQuest(QE24CompleteButtonProbe);
sdk.RegisterQuest(QE24RetireProbe);
sdk.RegisterQuest(QE24UnclaimTarget);
sdk.RegisterQuest(QE24PhoneOnEndAutoCompleteProbe);
sdk.RegisterQuest(QE24PhoneOnEndDirectCompleteProbe);
if (typeof sdk.RegisterCommand === "function") {
    sdk.RegisterCommand({ default: true, scope: "local" })(QE24Command);
}
sdk.RegisterModPackage(QE24Bootstrap);

module.exports = Object.defineProperty({ __esModule: true }, "default", {
    get: function () { return QE24Bootstrap; },
    enumerable: true,
});
