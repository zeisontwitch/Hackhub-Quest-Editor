"use strict";

/*
 * QE SDK 0.24 QA Harness
 *
 * Hand-authored, ready-to-copy HackHub mod used to verify SDK 0.24 fences in
 * game. It deliberately exercises APIs the no-code editor does not expose yet:
 * Quest.complete(), Quest.retire(), Quest.unclaim(), Scheduler callbacks and
 * Http route handlers.
 */
var sdk = require("@hotbunny/hackhub-content-sdk");

var MOD_ID = "qe-sdk-024-qa";
var HTTP_HOST = "qe24-http.test";
var COLLAB_DOMAIN = "qe24-collab.test";
var WIFI_SSID = "QE24-RAW-5G";
var WIFI_PASSWORD = "correct-horse-battery";
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
                description: "SDK 0.24 HTTP/curl test host.",
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
            bssid: "02:24:00:00:24:01",
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

class QE24SurfaceProbe extends sdk.Quest {
    constructor() {
        super();
        this.Name = "QE24SurfaceProbe";
        this.Title = "QE24 SDK surface probe";
        this.Description = "Run qe24 status for the SDK 0.24 in-game QA commands.";
        this.Group = "sandbox";
        this.AutoStart = true;
        this.AutoComplete = false;
        this.HasCompleteButton = false;
        this.Abandonable = true;
        this.Objectives = [
            { name: "http-response", description: "Run curl http://" + HTTP_HOST + "/api/echo?from=terminal, or qe24 http-fetch." },
            { name: "http-intercepted", description: "Run qe24 intercept on, then curl http://" + HTTP_HOST + "/, then qe24 intercept forward." },
            { name: "collaborator-hit", description: "Run qe24 collab, then curl the printed collaborator URL." },
            { name: "scheduler-fired", description: "Run qe24 schedule 1, then use the clock Wait button or wait about a second." },
            { name: "wifi-connect", description: "Connect to Wi-Fi " + WIFI_SSID + " with passphrase " + WIFI_PASSWORD + "." },
            { name: "wifi-disconnect", description: "Disconnect from the QE24 Wi-Fi network." },
        ];
    }
    CreateData() { return {}; }
    OnStart() {
        log("QE24SurfaceProbe started");
        sendMailSafe("QE24 SDK harness", "Run qe24 status in the terminal for commands. Test host: http://" + HTTP_HOST + "/\nWi-Fi: " + WIFI_SSID + " / " + WIFI_PASSWORD);
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
        this.Events.on("Network.WifiConnected", function (ap) {
            var wifiName = ap && ap.wifiNetwork ? (ap.wifiNetwork.name || ap.wifiNetwork.ssid) : ap && (ap.ssid || ap.name);
            if (wifiName === WIFI_SSID || (ap && ap.ip === saveGet(WIFI_IP_KEY))) done("wifi-connect", wifiName || "connected");
        });
        this.Events.on("Network.WifiDisconnected", function () {
            done("wifi-disconnect", "no payload");
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

class QE24Command extends sdk.Command {
    constructor() {
        super();
        this.CommandName = "qe24";
        this.Description = "SDK 0.24 QA harness commands";
        this.Autocomplete = [
            { label: "qe24", type: "STRING" },
            { label: "status|seed|http-fetch|schedule|collab|intercept|claim|complete|button-ready|retire|unclaim|reset", type: "STRING" },
        ];
    }
    async Run(tools) {
        var args = tools.getArgs ? tools.getArgs() : [];
        var sub = args[0] || "status";
        if (sub === "help") sub = "status";
        if (sub === "status") {
            ensureSession();
            var jobs = sdk.Scheduler && sdk.Scheduler.list ? safe("Scheduler.list", function () { return sdk.Scheduler.list(SCHEDULE_KIND); }, []) : [];
            var history = sdk.Http && sdk.Http.history ? safe("Http.history", function () { return sdk.Http.history(); }, []) : [];
            var queue = sdk.Http && sdk.Http.interceptQueue ? safe("Http.interceptQueue", function () { return sdk.Http.interceptQueue(); }, []) : [];
            var wifis = sdk.Network && sdk.Network.getWifiNetworks ? safe("Network.getWifiNetworks", function () { return sdk.Network.getWifiNetworks(); }, []) : [];
            tools.println("QE24 SDK 0.24 QA harness");
            tools.println("Host: http://" + HTTP_HOST + "/");
            tools.println("Wi-Fi: " + WIFI_SSID + " / " + WIFI_PASSWORD);
            tools.println("Time.now: " + (sdk.Time && sdk.Time.now ? sdk.Time.now() : "unavailable") + " scale=" + (sdk.Time && sdk.Time.scale ? sdk.Time.scale() : "unavailable"));
            tools.println("Scheduler pending: " + (jobs && jobs.length != null ? jobs.length : "?"));
            tools.println("HTTP history: " + (history && history.length != null ? history.length : "?") + "; intercept queue: " + (queue && queue.length != null ? queue.length : "?"));
            tools.println("Visible Wi-Fi networks: " + (wifis && wifis.length != null ? wifis.length : "?"));
            tools.println("Commands: qe24 http-fetch · qe24 schedule 1 · qe24 collab · qe24 intercept on|off|queue|forward|drop · qe24 claim complete|button|retire|unclaim · qe24 complete · qe24 button-ready · qe24 retire · qe24 unclaim · qe24 reset");
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
            return;
        }
        if (sub === "collab") {
            registerHttp();
            if (!sdk.Http || !sdk.Http.mintCollaboratorSubdomain) { tools.printError("collaborator APIs unavailable"); return; }
            var host = sdk.Http.mintCollaboratorSubdomain();
            tools.println("Run: curl http://" + host + "/qe24");
            tools.println("Then check qe24 status or the SurfaceProbe objective.");
            return;
        }
        if (sub === "intercept") {
            if (!sdk.Http) { tools.printError("Http APIs unavailable"); return; }
            var mode = args[1] || "queue";
            if (mode === "on") { sdk.Http.setInterceptEnabled(true); tools.printWarning ? tools.printWarning("Intercept ON. Run qe24 intercept forward or off if a request hangs.") : tools.println("Intercept ON."); return; }
            if (mode === "off") { sdk.Http.setInterceptEnabled(false); if (sdk.Http.interceptForwardAll) sdk.Http.interceptForwardAll(); tools.println("Intercept OFF and queue forwarded."); return; }
            if (mode === "forward") { if (sdk.Http.interceptForwardAll) sdk.Http.interceptForwardAll(); tools.println("Forwarded all held requests."); return; }
            if (mode === "drop") { if (sdk.Http.interceptDropAll) sdk.Http.interceptDropAll(); tools.println("Dropped all held requests."); return; }
            var held = sdk.Http.interceptQueue ? sdk.Http.interceptQueue() : [];
            tools.println("Held requests: " + held.length);
            held.forEach(function (h) { tools.println(h.request.id + " " + h.request.method + " " + h.request.url); });
            return;
        }
        if (sub === "claim") {
            var which = args[1] || "complete";
            var names = { complete: "QE24DirectCompleteProbe", button: "QE24CompleteButtonProbe", retire: "QE24RetireProbe", unclaim: "QE24UnclaimTarget", surface: "QE24SurfaceProbe" };
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
        tools.printError("Unknown qe24 command. Run qe24 status.");
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
if (typeof sdk.RegisterCommand === "function") {
    sdk.RegisterCommand({ default: true, scope: "local" })(QE24Command);
}
sdk.RegisterModPackage(QE24Bootstrap);

module.exports = Object.defineProperty({ __esModule: true }, "default", {
    get: function () { return QE24Bootstrap; },
    enumerable: true,
});
