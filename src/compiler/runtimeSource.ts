/**
 * The interpreter that ships inside every exported mod.js. It is plain
 * ES2020 JavaScript (no template literals, no TS-only syntax) so the same
 * text is a valid `src/index.ts` for power users and a runnable `dist/mod.js`
 * for the game. Written without backticks/${ so it can live in a TS template
 * string.
 */
export const RUNTIME_SOURCE = String.raw`
var __QE = (function () {
    function getPath(obj, path) {
        return String(path).split(".").reduce(function (acc, k) {
            return acc == null ? acc : acc[k];
        }, obj);
    }
    function fill(tpl, scope) {
        return String(tpl).replace(/\{\{([^}]+)\}\}/g, function (_m, p) {
            var v = getPath(scope, p.trim());
            return v == null ? "" : String(v);
        });
    }
    function asString(x) { return x == null ? "" : String(x); }
    /* GoMail renders a mail body as plain text, so any HTML in it is shown
       literally - QA got a briefing that read "<p>His name is <b>Anselm
       Ritter</b>." on screen. The editor's mail field is a rich-text box that
       produces HTML, so the two have to be reconciled here: turn the block
       tags into line breaks, drop the inline ones, and unescape the entities.

       Nemesis, whose mail displays correctly, sends plain text with blank
       lines between paragraphs. That is what this produces. */
    function htmlToText(html) {
        var s = String(html == null ? "" : html);
        if (s.indexOf("<") < 0 && s.indexOf("&") < 0) return s;
        s = s.replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
        s = s.replace(/<\s*br\s*\/?\s*>/gi, "\n");
        s = s.replace(/<\s*\/\s*(p|div|h[1-6]|li|tr|blockquote)\s*>/gi, "\n\n");
        s = s.replace(/<\s*li[^>]*>/gi, "\u2022 ");
        s = s.replace(/<\s*hr[^>]*\/?\s*>/gi, "\n----------\n");
        s = s.replace(/<[^>]+>/g, "");
        s = s.replace(/&nbsp;/gi, " ")
             .replace(/&lt;/gi, "<")
             .replace(/&gt;/gi, ">")
             .replace(/&quot;/gi, "\"")
             .replace(/&#39;/g, "'")
             .replace(/&apos;/gi, "'")
             .replace(/&amp;/gi, "&");
        /* Collapse the runs of blank lines the block rules leave behind, and
           trim the ends, without touching deliberate spacing inside. */
        s = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
        return s.replace(/^\s+|\s+$/g, "");
    }
    /* Turn an ISO-ish date (yyyy-mm-dd) into an age phrase ("3 days",
       "2 months", "1 year"). Returns "" for a blank or unparseable date. */
    function ageStringFromDate(value) {
        if (!value) return "";
        var then = new Date(value);
        if (isNaN(then.getTime())) return "";
        var secs = Math.floor((Date.now() - then.getTime()) / 1000);
        if (secs < 60) return "just now";
        var units = [
            ["year", 31536000],
            ["month", 2592000],
            ["week", 604800],
            ["day", 86400],
            ["hour", 3600],
            ["minute", 60],
        ];
        for (var i = 0; i < units.length; i++) {
            var n = Math.floor(secs / units[i][1]);
            if (n >= 1) return n + " " + units[i][0] + (n === 1 ? "" : "s");
        }
        return "just now";
    }
    /* Text coming back from the game is whatever the player typed, and the
       value beside it is whatever the author typed. Matching those two byte
       for byte fails for reasons that have nothing to do with the story:
       lynx "Anselm Ritter" and lynx Anselm Ritter raise the same event with a
       different query string, and nobody expects a capital letter to decide
       whether an objective ticks. So text comparisons are case-insensitive,
       trimmed, and blind to surrounding quotes. Numeric and regex comparisons
       are untouched - a regex means the author wants exact control. */
    function loose(x) {
        var t = asString(x).trim();
        var first = t.charAt(0);
        var last = t.charAt(t.length - 1);
        if (t.length > 1 && (first === "\"" || first === "'") && last === first) t = t.slice(1, -1).trim();
        return t.toLowerCase();
    }

    /* Read the field a condition names off an event payload.

       The SDK's declarations are not always right about the shape. It types
       Terminal.Lynx.Search as { query: string }, and the editor offers "query"
       on that basis - but the game emits the search term as a BARE STRING.
       Asking a string for .query gives undefined, so the condition silently
       never matched and the objective never ticked. QA hit exactly that:

           objective "identify-target": Terminal.Lynx.Search fired but did not
           match. Event carried: "Anselm Ritter"

       Three events (AppStore.Downloaded, Terminal.SSH.Connected/Disconnected)
       are declared as primitives, so a payload that is not an object is a
       legitimate shape the author still has to be able to match on. When the
       payload is a primitive, any field name resolves to the payload itself -
       which is the only value there is, and certainly what the author meant. */
    function fieldOf(payload, field) {
        if (payload != null && typeof payload !== "object") return payload;
        var direct = getPath(payload, field);
        if (direct !== undefined) return direct;
        /* An object with exactly one primitive value is unambiguous too: a
           mismatched field name should not be the difference between a quest
           that works and one that stops dead. */
        if (payload && typeof payload === "object" && !Array.isArray(payload)) {
            var keys = Object.keys(payload);
            if (keys.length === 1 && typeof payload[keys[0]] !== "object") return payload[keys[0]];
        }
        return direct;
    }

    function matchClause(c, payload, scope) {
        var raw = fieldOf(payload, c.field);
        var val = fill(c.value, scope);
        var a = loose(raw);
        var b = loose(val);
        switch (c.op) {
            case "equals": return a === b;
            case "notEquals": return a !== b;
            case "contains": return a.indexOf(b) >= 0;
            case "notContains": return a.indexOf(b) < 0;
            case "startsWith": return a.indexOf(b) === 0;
            case "endsWith": return a.slice(a.length - b.length) === b;
            case "matches": try { return new RegExp(val).test(asString(raw)); } catch (e) { return false; }
            case "exists": return raw !== undefined;
            case "notEmpty": return asString(raw).length > 0;
            case "greaterThan": return Number(raw) > Number(val);
            case "lessThan": return Number(raw) < Number(val);
            default: return false;
        }
    }
    function matchAll(list, payload, scope) {
        var acc = true;
        for (var i = 0; i < list.length; i++) {
            var r = matchClause(list[i], payload, scope);
            acc = i === 0 ? r : (list[i].join === "or" ? (acc || r) : (acc && r));
        }
        return acc;
    }
    function matchInput(input, answer) {
        var a = input.caseSensitive ? String(answer) : String(answer).toLowerCase();
        var e = input.caseSensitive ? input.expected : String(input.expected).toLowerCase();
        if (!e) return true;
        if (input.matchMode === "contains") return a.indexOf(e) >= 0;
        if (input.matchMode === "regex") {
            try { return new RegExp(e).test(a); } catch (err) { return false; }
        }
        return a === e;
    }
    /* Never let an optional lookup take a quest down with it: a missing
       permission, a missing API or a throwing getter all become "". */
    function safe(fn) {
        try {
            var v = fn();
            return v == null ? "" : v;
        } catch (e) {
            return "";
        }
    }
    function log(msg) {
        try { if (typeof console !== "undefined" && console.log) console.log("[quest-editor] " + msg); } catch (e) { /* nothing to do */ }
    }
    /* A wait that never depends on the game's clock. sleep() prefers
       Random.sleep so story beats obey game time, but anything that has to
       happen for certain (checking whether a mail actually arrived) uses this
       instead: if Random.sleep were ever paused, stubbed or slow, a
       verify-and-repair step hanging on it would silently never run. */
    function wait(ms) {
        return new Promise(function (res) { setTimeout(res, ms); });
    }
    /* Run fn over list in order, staying SYNCHRONOUS until something
       actually returns a promise.

       This exists because of how the engine scopes a mod's permissions: a mod
       is only "current" while the engine is inside a call it made. Work pushed
       into a microtask happens after that call has returned, by which point
       the SDK no longer knows who is calling and refuses everything with
       Mod "null". A plain reduce over Promise.resolve() defers even purely
       synchronous work, so the entire quest graph was running too late. */
    /* A short, readable rendering of an event payload, for the log. Keeps the
       whole thing to one line and one screenful: the point is to show which
       fields exist and roughly what is in them, not to dump the object. */
    function describe(data) {
        if (data == null) return String(data);
        if (typeof data !== "object") return JSON.stringify(data);
        var parts = [];
        for (var k in data) {
            if (!Object.prototype.hasOwnProperty.call(data, k)) continue;
            var v = data[k];
            var shown;
            if (v == null) shown = String(v);
            else if (typeof v === "object") shown = Array.isArray(v) ? "[" + v.length + " items]" : "{object}";
            else {
                shown = String(v);
                if (shown.length > 60) shown = shown.slice(0, 57) + "...";
                shown = JSON.stringify(shown);
            }
            parts.push(k + "=" + shown);
        }
        return parts.length ? "{ " + parts.join(", ") + " }" : "{ no fields }";
    }

    function seq(list, fn, onError) {
        var i = 0;
        function step() {
            while (i < list.length) {
                var item = list[i++];
                var r;
                try {
                    r = fn(item);
                } catch (e) {
                    if (onError) onError(e);
                    continue;
                }
                /* Only pay for a promise when the node really is async. */
                if (r && typeof r.then === "function") {
                    return r.then(step, function (e) {
                        if (onError) onError(e);
                        return step();
                    });
                }
            }
            return undefined;
        }
        return step();
    }

    function sleep(ms) {
        /* Prefer the game's own timer (SDK 0.21.0 Random.sleep) so waits obey
           whatever the game does with time; fall back to a plain timeout when
           the API is not there. */
        try {
            if (typeof sdk !== "undefined" && sdk && sdk.Random && sdk.Random.sleep) {
                return Promise.resolve(sdk.Random.sleep(ms));
            }
        } catch (e) { /* fall through to the timeout below */ }
        return new Promise(function (res) { setTimeout(res, ms); });
    }
    return { getPath: getPath, fill: fill, htmlToText: htmlToText, matchAll: matchAll, matchInput: matchInput, sleep: sleep, seq: seq, describe: describe, wait: wait, ageStringFromDate: ageStringFromDate, safe: safe, log: log };
})();

function __qeRegisterProject(sdk, PROJECT) {

    /* The event a hackertyper node emits when fully revealed: the field the
       player filled in, or a generated one (the inspector promises this). */
    function __qeHtEvent(n) {
        return n.data.eventName && n.data.eventName.trim() ? n.data.eventName.trim() : "QE.ht." + n.id;
    }

    /* ── one quest ─────────────────────────────────────────────────────── */
    function registerQuest(qd) {
        var g = qd.graph;
        var byId = {};
        g.nodes.forEach(function (n) { byId[n.id] = n; });
        function outs(id) {
            return g.edges.filter(function (e) { return e.source === id; });
        }
        function flowOuts(id) {
            return outs(id).filter(function (e) { return e.kind === "flow"; });
        }

        var mailNodes = g.nodes.filter(function (n) { return n.type === "comms.dialogue" && n.data.kind === "mail"; });
        var mailIndex = {};
        var mailFrom = {};
        mailNodes.forEach(function (n, i) {
            mailIndex[n.id] = i;
            if (n.data.mail.from) mailFrom[n.id] = n.data.mail.from;
        });

        var Mails = mailNodes.map(function (n) {
            var m = n.data.mail;
            var out = { title: m.subject, content: __QE.htmlToText(m.content) };
            if (m.replyable) out.replyable = true;
            if (m.attachment && m.attachment.name) out.attachment = m.attachment;
            return out;
        });

        var Dialog = {};
        (qd.dialog || []).forEach(function (b) {
            Dialog[b.name] = (b.lines || []).map(function (l) {
                var out = { speaker: l.speaker, text: l.text };
                if (l.isEnd) out.isEnd = true;
                if (l.options && l.options.length) {
                    out.options = l.options.map(function (o) {
                        var oo = { label: o.label };
                        if (o.text) oo.text = o.text;
                        if (o.switchBranch) oo.switchBranch = o.switchBranch;
                        if (o.isEnd) oo.isEnd = true;
                        return oo;
                    });
                }
                return out;
            });
        });

        var kisscordNodes = g.nodes
            .filter(function (n) { return n.type === "comms.dialogue" && n.data.kind === "kisscord"; });
        var KisscordChats = kisscordNodes
            .map(function (n) {
                return {
                    contactId: n.data.kisscord.contactId,
                    messages: (n.data.kisscord.messages || []).map(function (m) {
                        var out;
                        if (m.playerAction === "send") {
                            out = { content: m.playerText, isMine: true, delayMs: m.delayMs };
                        } else if (m.playerAction === "upload") {
                            out = { content: "[uploaded file: " + ((m.upload && m.upload.name) || "file") + "." + ((m.upload && m.upload.extension) || "txt") + "]", isMine: true, delayMs: m.delayMs };
                        } else if (m.playerAction === "input") {
                            out = { content: m.content || "(waiting for your answer)", delayMs: m.delayMs };
                        } else {
                            out = { content: m.content, isMine: m.isMine, delayMs: m.delayMs };
                        }
                        if (m.unlocksAfter && m.unlocksAfter.length) out.unlocksAfter = m.unlocksAfter;
                        return out;
                    }),
                };
            });

        /* WeeChatChatDefinition (the declarative, quest-scoped chat script) only
           has host/messages in the SDK — there is no password or
           registerServer field on it. Making the server something the
           player can actually connect to (weechat HOST PASSWORD) is a
           separate, imperative call: WeeChat.createServer(host, password).
           That registration (and its matching removeServer cleanup) is done
           in OnObjectivesStart/OnComplete/OnAbandon below — see
           weechatServers. */
        var weechatServers = g.nodes
            .filter(function (n) { return n.type === "comms.dialogue" && n.data.kind === "weechat" && n.data.weechat.registerServer; })
            .map(function (n) { return { host: n.data.weechat.host, password: n.data.weechat.password }; });

        var weechatNodes = g.nodes
            .filter(function (n) { return n.type === "comms.dialogue" && n.data.kind === "weechat"; });
        var WeeChatChats = weechatNodes
            .map(function (n) {
                return {
                    host: n.data.weechat.host,
                    messages: (n.data.weechat.messages || []).map(function (m) {
                        var out = m.playerAction === "send"
                            ? { content: m.playerText, username: "you" }
                            : { content: m.content, username: m.username };
                        if (m.delayMs) out.delayMs = m.delayMs;
                        return out;
                    }),
                };
            });

        /* Timed chats — OPT IN, per node ("Play when the story reaches this
           node"). A quest-level KisscordChats /
           WeeChatChats script is handed to the engine when the quest starts, so
           a conversation that has to land on a Sequence beat cannot use that
           path. Those nodes are played through the platform API instead
           (SDK 0.21.0: Kisscord.sendMessage(channelUserId, content, isMine),
           WeeChat.sendMessage({host, username, message})), one message at a
           time, honouring each message's own delay. Everything else stays
           declarative, which is what the engine scopes and cleans up for us. */
        var chatOfNode = {};
        kisscordNodes.forEach(function (n, i) { chatOfNode[n.id] = KisscordChats[i]; });
        weechatNodes.forEach(function (n, i) { chatOfNode[n.id] = WeeChatChats[i]; });
        var liveChat = {};
        function optedInAndWired(n) {
            return n.data.postLive === true && g.edges.some(function (e) {
                return e.kind === "flow" && e.target === n.id;
            });
        }
        kisscordNodes.forEach(function (n) {
            if (optedInAndWired(n) && sdk.Kisscord && sdk.Kisscord.sendMessage) liveChat[n.id] = "kisscord";
        });
        weechatNodes.forEach(function (n) {
            if (optedInAndWired(n) && sdk.WeeChat && sdk.WeeChat.sendMessage) liveChat[n.id] = "weechat";
        });
        var DeclaredKisscordChats = KisscordChats.filter(function (_c, i) { return !liveChat[kisscordNodes[i].id]; });
        var DeclaredWeeChatChats = WeeChatChats.filter(function (_c, i) { return !liveChat[weechatNodes[i].id]; });
        var playedChats = {};

        function sendChatNow(node, scope) {
            var mode = liveChat[node.id];
            var chat = chatOfNode[node.id];
            if (!mode || !chat || playedChats[node.id]) return Promise.resolve();
            /* Once per playthrough: a conversation replayed by a loop would
               stack duplicates in a window the player may still be reading. */
            playedChats[node.id] = true;
            return (chat.messages || []).reduce(function (chain, m) {
                return chain.then(function () {
                    var wait = Math.max(0, Number(m.delayMs || 0));
                    var send = function () {
                        var content = __QE.fill(m.content || "", scope);
                        if (mode === "kisscord") sdk.Kisscord.sendMessage(chat.contactId, content, !!m.isMine);
                        else sdk.WeeChat.sendMessage({ host: chat.host, username: m.username || "", message: content });
                    };
                    return wait > 0 ? __QE.sleep(wait).then(send) : send();
                });
            }, Promise.resolve());
        }

        /* Everything this quest added to the world that should disappear with
           it. Filled as the flow runs (a node the story never reaches added
           nothing), drained in OnComplete/OnAbandon. */
        var questCleanup = [];

        function runQuestCleanup() {
            while (questCleanup.length) {
                var item = questCleanup.pop();
                try {
                    if (item.kind === "network" && sdk.Network.destroyNetwork) sdk.Network.destroyNetwork(item.ip);
                    if (item.kind === "domain" && sdk.Network.removeDomain) sdk.Network.removeDomain(item.domain);
                    if (item.kind === "commandData" && sdk.Shell && sdk.Shell.removeCommandData) sdk.Shell.removeCommandData(item.command, item.input);
                    if (item.kind === "firewall" && sdk.Network.removeFirewallRule) sdk.Network.removeFirewallRule(item.ip, item.port);
                    if (item.kind === "database" && sdk.Database && sdk.Database.remove) sdk.Database.remove(item.id);
                    if (item.kind === "port") {
                        if (item.action === "open" && sdk.Network.closePort) sdk.Network.closePort(item.ip, item.port);
                        if (item.action === "close" && sdk.Network.openPort) sdk.Network.openPort(item.ip, item.port);
                        if (item.action === "add" && sdk.Network.removePort) sdk.Network.removePort(item.ip, item.port);
                    }
                } catch (e) { /* the world may already be gone; never block cleanup */ }
            }
        }

        var objectiveNodes = g.nodes.filter(function (n) { return n.type === "objective"; });
        var questRef = null;
        var needsTargetIp = g.nodes.some(function (n) {
            return (n.type === "world.network" || n.type === "world.wifi") && n.data.ipMode === "random";
        });

        var Objectives = objectiveNodes.map(function (n) {
            var unlocks = g.edges
                .filter(function (e) { return e.kind === "unlock" && e.target === n.id; })
                .map(function (e) { var s = byId[e.source]; return s && s.type === "objective" ? s.data.name : null; })
                .filter(Boolean);
            var trig = g.edges
                .filter(function (e) { return e.kind === "condition" && e.target === n.id; })
                .map(function (e) { return byId[e.source]; })
                .filter(function (s) { return s && s.type === "trigger.event"; })[0];
            var o = { name: n.data.name, description: n.data.description };
            if (unlocks.length) o.unlocksAfter = unlocks;
            if (n.data.hidden) o.hidden = true;
            if (n.data.hint) o.hint = n.data.hint;
            if (n.data.info) o.info = n.data.info;
            if (n.data.terminalCommand) o.terminalCommand = n.data.terminalCommand;
            /* The declarative trigger is still declared, even though
               OnObjectivesStart now completes the objective imperatively as
               well. Whichever one the build honours, the objective ticks off,
               and completing an already-completed objective is a no-op. */
            if (trig) {
                var clauses = trig.data.conditions;
                o.trigger = {
                    event: trig.data.event,
                    condition: function (data) {
                        return __QE.matchAll(clauses, data, dataScope());
                    },
                };
            }
            return o;
        });

        /* Builds the scope object {{token}} fields resolve against.
           data/Data both point at the quest's own persisted Data (set via
           SetData / CreateData) — NOT the current event payload, which is
           matched separately via each condition's own field selector. This
           matches what every field hint in the editor promises ("insert a
           value you saved earlier"). player and random fields are computed
           fresh each call so repeated use of e.g. {{random.password}}
           yields independent values. */
        function dataScope(extra) {
            var d = questRef ? questRef.Data : {};
            /* Every player/random field is a GETTER, computed only if a token
               actually asks for it, and never allowed to throw. Reading them
               eagerly cost a mod its whole quest once: a project with no
               {{player.ip}} anywhere still called Network.getPlayerIp on every
               scope, the loader refused it for want of the "network"
               permission, and the exception escaped OnStart so the quest never
               started. A value the author never mentioned must not be able to
               do that. */
            var base = {
                data: d,
                Data: d,
                player: {
                    get ip() { return __QE.safe(function () { return sdk.Network && sdk.Network.getPlayerIp ? sdk.Network.getPlayerIp() : ""; }); },
                    get email() { return __QE.safe(function () { return sdk.Mail && sdk.Mail.getPlayerEmail ? sdk.Mail.getPlayerEmail() : ""; }); },
                    get username() { return __QE.safe(function () { return sdk.Shell && sdk.Shell.getUsername ? sdk.Shell.getUsername() : ""; }); },
                },
                random: {
                    get password() { return __QE.safe(function () { return sdk.Random && sdk.Random.password ? sdk.Random.password() : ""; }); },
                    get ip() { return __QE.safe(function () { return sdk.Network && sdk.Network.randomIp ? sdk.Network.randomIp() : ""; }); },
                    get username() { return __QE.safe(function () { return sdk.Random && sdk.Random.username ? sdk.Random.username() : ""; }); },
                },
            };
            if (extra) { for (var k in extra) base[k] = extra[k]; }
            return base;
        }

        function scopeOf(ctx) {
            return dataScope({ vars: ctx && ctx.vars });
        }

        /* Kisscord/WeeChat content is registered declaratively
           on the instance (the SDK drives when each message actually shows,
           not the flow graph), so there's no single "send" call site to fill
           tokens at like there is for mail/dialog. Best effort: re-render
           with whatever Data exists once CreateData has populated it (called
           from OnObjectivesStart, which always runs after CreateData). This
           correctly resolves anything set in CreateData (including
           {{data.targetIp}}), but NOT values a flow node sets later via
           fx.setData mid-playthrough — those can't retroactively update
           content the SDK already registered. */
        function refillComms() {
            var scope = dataScope();
            if (DeclaredKisscordChats.length) {
                questRef.KisscordChats = DeclaredKisscordChats.map(function (c) {
                    return Object.assign({}, c, {
                        messages: c.messages.map(function (m) {
                            return m.content ? Object.assign({}, m, { content: __QE.fill(m.content, scope) }) : m;
                        }),
                    });
                });
            }
            if (DeclaredWeeChatChats.length) {
                questRef.WeeChatChats = DeclaredWeeChatChats.map(function (c) {
                    return Object.assign({}, c, {
                        messages: c.messages.map(function (m) {
                            return m.content ? Object.assign({}, m, { content: __QE.fill(m.content, scope) }) : m;
                        }),
                    });
                });
            }
        }

        /* One node must never be able to end the story.
           The Ledger template proved why: a single bad SDK call in a Tool
           response node threw, the promise chain died, and the briefing mail
           two nodes later was never sent - the player got a quest with an
           objective and nothing else. Now a node that throws is logged and the
           flow carries on to the next one. */
        /* Sending a mail from the story.

           Two rounds of QA said the same thing: quests built here declared
           their mail in Quest.Mails and sent it with this.sendMail(index), the
           engine took the call without complaint, and nothing ever appeared in
           GoMail. A working quest mod from another author (Nemesis) was read
           side by side with ours and it never touches this.sendMail or
           Quest.Mails at all - every mail it sends, including its opening
           briefing, goes out through the global Mail.send({ from, subject,
           content }). That is the path the game demonstrably delivers, so it is
           the path used first here.

           this.sendMail is still tried afterwards, but only if Mail.send was
           not available, and the inbox is still checked so a report can say
           which path carried the mail. */
        function sendQuestMail(node, scope) {
            var mi = mailIndex[node.id];
            var baseMail = Mails[mi];
            if (!baseMail) return;
            var subject = __QE.fill(baseMail.title || "", scope);
            /* baseMail.content was already converted to plain text when Mails
               was built - converting again here would strip a literal "<tag>"
               the author actually wrote. Only the {{tokens}} are filled. */
            var content = __QE.fill(baseMail.content || "", scope);
            var from = mailFrom[node.id] || "";

            /* Keep the declared copy in step with what was actually sent, so a
               quest whose mail carries {{tokens}} still reads correctly if the
               engine ever surfaces Quest.Mails itself.

               Note what this does NOT do: it only refreshes an entry that is
               already there. Writing into an array the engine never took would
               make the fallback below believe it has a usable mail when the
               engine has nothing. */
            if (questRef && questRef.Mails && questRef.Mails[mi] &&
                String(questRef.Mails[mi].title || "").length > 0) {
                var filledMail = { title: subject, content: content };
                if (baseMail.replyable) filledMail.replyable = true;
                if (baseMail.attachment) filledMail.attachment = baseMail.attachment;
                questRef.Mails[mi] = filledMail;
            }

            var how = "";
            if (sdk.Mail && sdk.Mail.send) {
                var direct = { subject: subject, content: content };
                if (from) direct.from = from;
                var to = __QE.safe(function () { return sdk.Mail.getPlayerEmail ? sdk.Mail.getPlayerEmail() : ""; });
                if (to) direct.to = to;
                if (baseMail.attachment && baseMail.attachment.name) {
                    direct.attachments = [{
                        name: baseMail.attachment.name,
                        extension: baseMail.attachment.extension || "txt",
                        data: baseMail.attachment.content || "",
                    }];
                }
                /* MailDefinition — what Mail.send takes — has no "replyable"
                   field. Only QuestMailDefinition does, and that is the array
                   the engine ignores on this build (r37). So a mail sent this
                   way never gets a Reply button, whatever the author ticked.
                   Say so once rather than leaving them looking for it. */
                if (baseMail.replyable) {
                    __QE.log("mail \"" + subject + "\" is marked replyable, but Mail.send has no reply flag " +
                        "on this build — the player will not see a Reply button. Use a hackertyper reply " +
                        "surface or a typed-answer command for the player's response.");
                }
                try {
                    sdk.Mail.send(direct);
                    how = "Mail.send";
                } catch (e) {
                    __QE.log("Mail.send failed for \"" + subject + "\": " + (e && e.message ? e.message : e));
                }
            }

            /* Only if the global API is missing or refused the mail: the old
               quest-scoped path, so nothing regresses on a build where it is
               the only one that exists. */
            if (!how) {
                /* Quest.sendMail(index) sends whatever the ENGINE holds in
                   this.Mails at that index - not the text we just filled in.
                   When the engine has not taken our Mails array (which happens
                   when the quest was registered without permissions), it sends
                   a mail with an empty subject and empty body. QA got exactly
                   that: a briefing that arrived blank, and a Mail.Read trigger
                   that could never match a subject of "".

                   So check what the engine actually has before trusting it. */
                var engineMail = questRef && questRef.Mails ? questRef.Mails[mi] : null;
                var usable = engineMail && String(engineMail.title || "").length > 0;
                if (!usable) {
                    __QE.log("Quest.sendMail(" + mi + ") skipped: the engine has no usable copy of \"" +
                        subject + "\" (its Mails[" + mi + "] is " +
                        (engineMail ? "empty" : "missing") + "), so it would deliver a blank mail");
                } else {
                    try {
                        if (questRef.sendMail) {
                            questRef.sendMail(mi, from || undefined);
                            how = "Quest.sendMail(" + mi + ")";
                        }
                    } catch (e2) {
                        __QE.log("Quest.sendMail(" + mi + ") threw: " + (e2 && e2.message ? e2.message : e2));
                    }
                }
            }

            if (!how) {
                __QE.log("mail \"" + subject + "\" could not be sent: this build offers neither Mail.send nor a usable Quest.sendMail");
                return;
            }
            __QE.log("mail \"" + subject + "\" sent via " + how);

            /* Confirm it landed. This wait is a plain timer on purpose - the
               check must not be able to hang on the game's own clock, which is
               what stopped the previous build from ever reporting anything. */
            __QE.wait(1500).then(function () {
                var inbox = __qeInbox();
                if (inbox === null) return; /* engine does not let us look */
                if (__qeInboxHas(inbox, subject)) {
                    __QE.log("mail \"" + subject + "\" delivered");
                } else {
                    __QE.log("mail \"" + subject + "\" was accepted by " + how + " but is not in the inbox");
                }
            });
        }

        /* The player's inbox, or null when this build will not show it - null
           and "empty" mean different things to the delivery check. */
        function __qeInbox() {
            try {
                if (!sdk.Mail || !sdk.Mail.getInbox) return null;
                var list = sdk.Mail.getInbox();
                return list && list.length != null ? list : null;
            } catch (e) {
                return null;
            }
        }

        function __qeInboxHas(inbox, subject) {
            for (var i = 0; i < inbox.length; i++) {
                if (inbox[i] && inbox[i].subject === subject) return true;
            }
            return false;
        }

        function runFlow(nodeId, ctx, depth) {
            try {
                return runFlowStep(nodeId, ctx, depth);
            } catch (e) {
                var failed = byId[nodeId];
                __QE.log("node " + nodeId + (failed ? " (" + failed.type + ")" : "") +
                    " failed and was skipped: " + (e && e.message ? e.message : e));
                return continueFrom(nodeId, ctx, depth);
            }
        }

        /* The wires out of a node, followed without running the node itself. */
        function continueFrom(nodeId, ctx, depth) {
            var node = byId[nodeId];
            if (!node) return undefined;
            /* Synchronous for the same reason as next() above: a skipped node
               must not push the rest of the quest into a microtask, or
               everything after it loses the mod's permissions. */
            return __QE.seq(flowOuts(nodeId), function (e) {
                return runFlow(e.target, ctx, depth + 1);
            });
        }

        function runFlowStep(nodeId, ctx, depth) {
            if (depth > 200) return undefined;
            var node = byId[nodeId];
            if (!node) return undefined;
            var scope = scopeOf(ctx);
            var next = function () {
                var edges = flowOuts(nodeId);
                if (node.type === "flow.random" && edges.length) {
                    var picked = edges[Math.floor(Math.random() * edges.length)];
                    edges = [picked];
                    /* "Store the result as" promised the pick would be readable
                       through {{data.name}} and nothing ever wrote it (audit,
                       r67). Save the socket's label, which is the thing an
                       author names their outputs after. */
                    if (node.data.storeAs && questRef && questRef.SetData) {
                        var pickedLabel = picked.sourceHandle || "";
                        __QE.safe(function () { questRef.SetData(node.data.storeAs, pickedLabel); });
                    }
                }
                if (node.type === "flow.branch") {
                    var yes = __QE.matchAll(node.data.conditions, node.data.source === "data" ? (questRef ? questRef.Data : {}) : (ctx && ctx.payload) || {}, scopeOf(ctx));
                    edges = edges.filter(function (e) { return e.sourceHandle === (yes ? "true" : "false"); });
                }
                /* Walk the wires SYNCHRONOUSLY for as long as we can.
                   The engine only treats this mod as "current" while it is
                   inside a call it made - OnStart, OnObjectivesStart, an event
                   handler. The moment one of those returns, the mod loses its
                   identity, and any SDK call made afterwards is attributed to
                   Mod "null" and refused its permissions. Chaining every node
                   through Promise.resolve().then(...) pushed ALL the real work
                   into a microtask that ran after OnStart had returned, which
                   is why the log read:

                       quest "..." started (1 entry point)
                       node world-network4 ... Mod "null" ... without "network"

                   ...with the failures arriving after the start line. Only a
                   node that genuinely has to wait (a Delay, a timed chat beat)
                   may go async, and past that point the quest has already lost
                   its permissions anyway - so waits are worth flagging rather
                   than hiding. */
                return __QE.seq(edges, function (e) {
                    return runFlow(e.target, ctx, depth + 1);
                }, function (e) {
                    __QE.log("flow after node " + nodeId + " stopped: " + (e && e.message ? e.message : e));
                });
            };
            var d = node.data;
            switch (node.type) {
                case "world.network": {
                    /* "random" is allocated once in CreateData() and lives in
                       Data.targetIp, so the SAME ip is used here as whatever
                       {{data.targetIp}} resolves to elsewhere (mail, notify,
                       other device fields, condition values, ...). */
                    var netIp = d.ipMode === "random"
                        ? ((questRef && questRef.Data && questRef.Data.targetIp) || (sdk.Network.randomIp ? sdk.Network.randomIp() : d.device.ip))
                        : d.device.ip;
                    /* Clear anything already at this address first.

                       A network the save already holds WINS over one created
                       at the same ip: the engine keeps the old one and the new
                       definition is ignored. r52 added teardown on
                       complete/abandon, which is right but not enough - a
                       player who simply stops playing, or replaces the mod
                       with a newer build, never triggers either. The engine's
                       own PruneOrphanQuests drops the stale QUEST record but
                       leaves the network standing.

                       QA saw the consequence three rounds running: a port
                       closed in the project still showing OPEN in game, and an
                       exploit failing against a machine whose guest account
                       had been added two builds earlier. Both were the old
                       network answering. Destroying first makes every run
                       start from the network the mod actually describes. */
                    if (d.destroyOnComplete !== false) questCleanup.push({ kind: "network", ip: netIp });
                    return buildNetwork(netIp, mapDevice(Object.assign({}, d.device, { ip: netIp })), next);
                    /* Tear the network down again when the quest ends. The
                       editor has always offered this toggle; the compiler
                       ignored it, so nothing was ever destroyed. A network the
                       game has already saved at an IP wins over the one a
                       later version of the mod tries to create there - which
                       is why QA saw a port banner ("OpenSSH 7.2") that no
                       longer existed in the project, unchanged across three
                       re-exports, and an exploit that failed against a machine
                       whose users had since been added. */
                }
                case "world.wifi": {
                    var wifiIp = d.ipMode === "fixed" && d.ip
                        ? d.ip
                        : ((questRef && questRef.Data && questRef.Data.targetIp) || (sdk.Network.randomIp ? sdk.Network.randomIp() : "10.0.0.1"));
                    /* SDK 0.21.0 has no wireless API: use it if a future
                       version ships one, otherwise fall back to a plain
                       router network so the machines at least exist. */
                    if (sdk.Network.createWifiNetwork) {
                        sdk.Network.createWifiNetwork({
                            ssid: d.ssid,
                            password: d.password,
                            signal: d.signal,
                            bssid: d.bssid,
                            channel: d.channel,
                            model: d.model,
                        });
                    } else {
                        /* Same reason as world.network above. */
                        if (d.destroyOnComplete !== false) questCleanup.push({ kind: "network", ip: wifiIp });
                        return buildNetwork(wifiIp, mapDevice({
                            ip: wifiIp,
                            type: "ROUTER",
                            model: d.model,
                            ports: d.ports || [],
                            users: d.users || [],
                            children: d.children || [],
                        }), next);
                    }
                    /* The createWifiNetwork branch (a future SDK) still needs
                       its teardown registered. */
                    if (d.destroyOnComplete !== false) questCleanup.push({ kind: "network", ip: wifiIp });
                    return next();
                }
                case "world.domain": {
                    /* A domain the player can whois / nslookup their way to. */
                    var domIp = __QE.fill(d.ip || "", scope) || ((questRef && questRef.Data && questRef.Data.targetIp) || "");
                    if (sdk.Network && sdk.Network.registerDomain && d.domain && domIp) {
                        sdk.Network.registerDomain(d.domain, domIp, d.vulnerabilities || []);
                        if (d.removeOnComplete !== false) questCleanup.push({ kind: "domain", domain: d.domain });
                    }
                    return next();
                }
                case "world.firewall": {
                    var fwIp = __QE.fill(d.ip || "", scope);
                    if (sdk.Network && sdk.Network.addFirewallRule && fwIp && d.rule) {
                        var rule = {
                            allowed: !!d.rule.allowed,
                            port: Number(d.rule.port || 0),
                        };
                        if (d.rule.source) rule.source = d.rule.source;
                        if (d.rule.destination) rule.destination = d.rule.destination;
                        if (d.rule.locked != null) rule.locked = !!d.rule.locked;
                        sdk.Network.addFirewallRule(fwIp, rule);
                        if (d.removeOnComplete !== false) questCleanup.push({ kind: "firewall", ip: fwIp, port: rule.port });
                    }
                    return next();
                }
                case "world.port": {
                    var portIp = __QE.fill(d.ip || "", scope);
                    var portNo = Number((d.port && d.port.external) || 0);
                    if (sdk.Network && portIp && portNo) {
                        if (d.action === "open" && sdk.Network.openPort) sdk.Network.openPort(portIp, portNo);
                        if (d.action === "close" && sdk.Network.closePort) sdk.Network.closePort(portIp, portNo);
                        if (d.action === "add" && sdk.Network.addPort) {
                            var np = {
                                external: portNo,
                                internal: Number(d.port.internal || portNo),
                                active: d.port.active !== false,
                            };
                            if (d.port.service) np.service = d.port.service;
                            if (d.port.version) np.version = d.port.version;
                            sdk.Network.addPort(portIp, np);
                        }
                        if (d.action === "remove" && sdk.Network.removePort) sdk.Network.removePort(portIp, portNo);
                        /* Put it back the way it was found, if asked. */
                        if (d.restoreOnComplete) {
                            questCleanup.push({ kind: "port", ip: portIp, port: portNo, action: d.action });
                        }
                    }
                    return next();
                }
                case "world.database": {
                    if (sdk.Database && sdk.Database.create && d.host) {
                        var tables = {};
                        (d.tables || []).forEach(function (t) {
                            if (t.name) tables[t.name] = t.rows || [];
                        });
                        var dbId = sdk.Database.create({
                            host: __QE.fill(d.host, scope),
                            user: d.user || "",
                            password: d.password || "",
                            tables: tables,
                        });
                        if (d.removeOnComplete !== false && dbId) questCleanup.push({ kind: "database", id: dbId });
                    }
                    return next();
                }
                case "world.toolResponse": {
                    /* Shell.addCommandData(command, input, data): the input is
                       the thing the player typed after the command, and the
                       data is a SHAPE the tool understands, not a block of
                       text. Passing the text as the input (which is what this
                       used to do) throws inside the engine and takes the rest
                       of the quest with it. */
                    if (sdk.Shell && sdk.Shell.addCommandData) {
                        var trInput = __qeCommandInput(d, scope);
                        sdk.Shell.addCommandData(d.command, trInput, __qeCommandData(d.command, __QE.fill(d.dataText || "", scope)));
                        if (d.removeOnComplete !== false) {
                            questCleanup.push({ kind: "commandData", command: d.command, input: trInput });
                        }
                    }
                    return next();
                }
                case "comms.dialogue": {
                    /* Timed chat → play it here, message by message, so a
                       conversation can land on a Sequence beat. */
                    if (liveChat[node.id]) return sendChatNow(node, scope).then(next);
                    if (d.kind === "mail" && mailIndex[node.id] != null) {
                        sendQuestMail(node, scope);
                    }
                    if (d.kind === "phone") {
                        var branchName = d.phone && d.phone.branch ? d.phone.branch : "default";
                        var baseLines = Dialog[branchName];
                        if (baseLines && questRef.Dialog && questRef.Dialog[branchName]) {
                            questRef.Dialog[branchName] = baseLines.map(function (line) {
                                var out = { speaker: line.speaker, text: __QE.fill(line.text, scope) };
                                if (line.isEnd) out.isEnd = true;
                                if (line.options) {
                                    out.options = line.options.map(function (o) {
                                        var oo = { label: o.label };
                                        if (o.text) oo.text = __QE.fill(o.text, scope);
                                        if (o.switchBranch) oo.switchBranch = o.switchBranch;
                                        if (o.isEnd) oo.isEnd = true;
                                        return oo;
                                    });
                                }
                                return out;
                            });
                        }
                        questRef.createDialog(branchName, d.phone && d.phone.startIndex ? d.phone.startIndex : 0);
                    }
                    return next();
                }
                case "fx.notify": {
                    var notifyMsg = __QE.fill(d.message, scope);
                    if (sdk.UI) {
                        /* toast takes the tone as its second argument; it used
                           to be dropped, so every toast looked the same. */
                        if (d.variant === "toast" && sdk.UI.toast) sdk.UI.toast(notifyMsg, d.tone || "info");
                        else if (sdk.UI.notify) sdk.UI.notify(notifyMsg);
                    }
                    return next();
                }
                case "fx.setData":
                    questRef.SetData(d.key, __QE.fill(d.value, scope));
                    return next();
                case "fx.claimQuest":
                    /* Quest.claim is a static on the Quest class, and the field
                       is questName - this used to pass an undefined "quest". */
                    if (sdk.Quest && sdk.Quest.claim && d.questName) sdk.Quest.claim(d.questName);
                    return next();
                case "fx.pay":
                case "fx.withdraw": {
                    if (sdk.Bank) {
                        var amount = d.amountMode === "percent"
                            ? Math.round(((sdk.Bank.getBalance ? sdk.Bank.getBalance() : 0) * Number(d.percent || 0)) / 100)
                            : Number(d.amount || 0);
                        if (amount > 0) {
                            var tx = { amount: amount, description: __QE.fill(d.description || "", scope) };
                            /* BankTransactionOptions.from is { IBAN, name }. The
                               editor has always asked for both and the compiler
                               dropped them, so every payment came from nobody
                               (audit, r67). The engine wants both halves or
                               neither. */
                            var fromName = __QE.fill(d.fromName || "", scope);
                            var fromIBAN = __QE.fill(d.fromIBAN || "", scope);
                            if (fromName || fromIBAN) tx.from = { IBAN: fromIBAN, name: fromName };
                            if (node.type === "fx.pay" && sdk.Bank.transaction) sdk.Bank.transaction(tx);
                            if (node.type === "fx.withdraw" && sdk.Bank.withdraw) sdk.Bank.withdraw(tx);
                        }
                    }
                    return next();
                }
                case "world.files":
                    /* Only the player's own machine can be written to from
                       here: Files.* resolves against the current session, and
                       at quest start there is no remote one. Files for a remote
                       device belong in that device's tree, where the engine
                       mounts them before anyone connects. */
                    if (d.target === "player" && sdk.Files && sdk.Files.createTree) {
                        return Promise.resolve(sdk.Files.createTree(d.parentPath || "~/", mapFiles(d.files)))
                            .then(next, next);
                    }
                    return next();
                case "fx.shell": {
                    /* The SDK calls it exec(); execute() never existed, so this
                       node quietly did nothing at all. */
                    var shellCmd = __QE.fill(d.command, scope);
                    if (sdk.Shell && sdk.Shell.exec) return Promise.resolve(sdk.Shell.exec(shellCmd)).then(next, next);
                    if (sdk.Shell && sdk.Shell.execute) sdk.Shell.execute(shellCmd);
                    return next();
                }
                case "flow.debug": {
                    /* A checkpoint the author dropped into the chain. Most of
                       the hard bugs in this project were invisible - the mod
                       ran, nothing errored, and nothing happened - so this
                       prints three things that were each expensive to learn
                       the hard way: that the flow reached here at all, what
                       the event really carried (field names included, since
                       the declared shape is not always the real one), and what
                       the quest has saved. */
                    var dbgLabel = __QE.fill(d.label || "", scope) || node.id;
                    var dbgParts = ["reached \"" + dbgLabel + "\""];
                    if (d.includePayload !== false) {
                        var pay = ctx && ctx.payload;
                        var hasPayload = pay != null && (typeof pay !== "object" || Object.keys(pay).length > 0);
                        dbgParts.push("event: " + (hasPayload ? __QE.describe(pay) : "(none - not reached from a trigger)"));
                    }
                    if (d.includeData !== false) {
                        dbgParts.push("saved: " + __QE.describe(questRef ? questRef.Data : null));
                    }
                    __QE.log(dbgParts.join(" | "));
                    if (d.toast && sdk.UI && sdk.UI.toast) {
                        __QE.safe(function () { sdk.UI.toast("debug: " + dbgLabel, "info"); });
                    }
                    return next();
                }
                case "flow.delay":
                    return __QE.sleep(Math.max(0, Number(d.seconds || 0)) * 1000).then(next);
                case "flow.sequence": {
                    /* Fire each output in author order, pausing the step's own
                       delay (milliseconds) before it. Steps own their sockets:
                       socket id is "step-" + step.id. */
                    var seqSteps = d.steps || [];
                    var seqOuts = flowOuts(nodeId);
                    return seqSteps.reduce(function (chain, step) {
                        return chain.then(function () {
                            var wait = Math.max(0, Number(step.delayMs || 0));
                            var handleId = "step-" + step.id;
                            var branch = seqOuts.filter(function (e) { return e.sourceHandle === handleId; });
                            var fire = function () {
                                return branch.reduce(function (p, e) {
                                    return p.then(function () { return runFlow(e.target, ctx, depth + 1); });
                                }, Promise.resolve());
                            };
                            return wait > 0 ? __QE.sleep(wait).then(fire) : fire();
                        });
                    }, Promise.resolve());
                }
                case "objective":
                    /* When the story flow reaches an objective, tick it off.
                       (Objectives with a trigger event complete via the SDK
                       declarative trigger instead.) */
                    if (d.name && questRef && questRef.completeObjective) questRef.completeObjective(d.name);
                    return next();
                case "trigger.event":
                case "entry.start":
                case "entry.load":
                case "entry.complete":
                case "entry.abandon":
                    return next();
                case "reply.input":
                case "reply.hackertyper":
                    /* The player has to act before the story continues: the
                       flow pauses here and is resumed by the terminal command
                       (reply.input) or the reveal listener (hackertyper). */
                    return Promise.resolve();
                default:
                    return next();
            }
        }

        /* Editor file entries → the SDK's NetworkFileMap/FileDefinition: drop
           the editor's own id, and "locked" is the engine's "readonly". */
        function mapFiles(list) {
            return (list || []).map(function (f) {
                var o = { name: f.name };
                if (f.extension) o.extension = f.extension;
                if (f.data) o.data = f.data;
                if (f.isFolder) o.isFolder = true;
                if (f.locked) o.readonly = true;
                if (f.hidden) o.hidden = true;
                if (f.children && f.children.length) o.children = mapFiles(f.children);
                return o;
            });
        }

        /* What the player types after the command. Most tools are keyed by a
           single string (an ip or a domain); hydra/ssh/ftp are keyed by an
           object, per the SDK's CommandDataMap. */
        function __qeCommandInput(d, scope) {
            var input = __QE.fill(d.input || "", scope);
            var user = __QE.fill(d.inputUser || "", scope);
            var target = __QE.fill(d.inputTarget || "", scope) || input;
            if (d.command === "hydra") return { user: user, target: target };
            if (d.command === "ssh") return { host: target, key: user };
            if (d.command === "ftp") return { host: target, username: user, password: "" };
            return input;
        }

        /* Authors write the response as readable lines; the engine wants the
           shape its own tool returns. JSON is passed through untouched for
           anyone who wants exact control. */
        function __qeKeyValueLines(text) {
            var out = [];
            String(text).split("\n").forEach(function (line) {
                var at = line.indexOf(":");
                if (at <= 0) return;
                var key = line.slice(0, at).trim().toLowerCase();
                var value = line.slice(at + 1).trim();
                if (key && value) out.push([key, value]);
            });
            return out;
        }

        function __qeCommandData(command, text) {
            var trimmed = String(text || "").trim();
            if (!trimmed) return command === "ping" ? true : {};
            if (trimmed.charAt(0) === "{" || trimmed.charAt(0) === "[") {
                try { return JSON.parse(trimmed); } catch (e) { /* not JSON after all */ }
            }
            var pairs = __qeKeyValueLines(trimmed);
            var get = function (names) {
                for (var i = 0; i < pairs.length; i++) {
                    if (names.indexOf(pairs[i][0]) >= 0) return pairs[i][1];
                }
                return "";
            };
            if (command === "ping") return !/false|down|unreachable/i.test(trimmed);
            if (command === "nslookup" || command === "mxlookup") {
                return get(["ip", "address", "answer"]) || trimmed.split("\n")[0].trim();
            }
            if (command === "whois") {
                var whois = {};
                var domain = get(["domain", "domain name"]);
                var ip = get(["ip", "ip address", "address"]);
                var contact = get(["registrant", "contact", "owner", "organisation", "organization"]);
                var email = get(["email", "e-mail", "abuse"]);
                if (domain) whois.domain = domain;
                if (ip) whois.ip = ip;
                if (contact) whois.contact = contact;
                if (email) whois.email = email;
                whois.status = !/status:\s*(inactive|expired|false)/i.test(trimmed);
                return whois;
            }
            if (command === "geoip") {
                return {
                    country: get(["country"]),
                    city: get(["city"]),
                    latitude: get(["latitude", "lat"]),
                    longitude: get(["longitude", "lon", "lng"]),
                };
            }
            if (command === "lynx") {
                var lynx = { additional: [] };
                pairs.forEach(function (pair) {
                    var key = pair[0];
                    var value = pair[1];
                    if (key.indexOf("mail") >= 0) {
                        lynx.contact = lynx.contact || {};
                        lynx.contact.emails = (lynx.contact.emails || []).concat(value.split(/[,;]\s*/));
                    } else if (key.indexOf("phone") >= 0) {
                        lynx.contact = lynx.contact || {};
                        lynx.contact.phones = (lynx.contact.phones || []).concat(value.split(/[,;]\s*/));
                    } else if (key === "ip" || key === "ips") {
                        lynx.ips = (lynx.ips || []).concat(value.split(/[,;]\s*/));
                    } else if (key.indexOf("address") >= 0 || key === "location") {
                        lynx.address = (lynx.address || []).concat([value]);
                    } else if (key.indexOf("social") >= 0) {
                        lynx.socialMedia = (lynx.socialMedia || []).concat(value.split(/[,;]\s*/));
                    } else {
                        var record = {};
                        record[pair[0]] = value;
                        lynx.additional.push(record);
                    }
                });
                return lynx;
            }
            if (command === "nmap") {
                var ports = [];
                String(trimmed).split("\n").forEach(function (line) {
                    /* "22/tcp open ssh OpenSSH 7.2" and "22 open ssh" both.
                       The status has to be a whole word: a greedy match found
                       the "Open" inside "OpenSSH" and read the rest wrong. */
                    var m = /^\s*(\d{1,5})(?:\/\w+)?\s+(open|closed?|filtered|forwarded)\b\s*([a-z0-9_.-]*)\s*(.*)$/i.exec(line);
                    if (!m) return;
                    var status = m[2].toUpperCase();
                    if (status === "CLOSED") status = "CLOSE";
                    var port = { port: Number(m[1]), status: status, service: m[3] || "" };
                    if (m[4] && m[4].trim()) port.version = m[4].trim();
                    ports.push(port);
                });
                return ports;
            }
            if (command === "hydra") {
                return { credentials: { username: get(["username", "user"]), password: get(["password", "pass"]) } };
            }
            if (command === "ssh") {
                return { ip: get(["ip", "host"]), status: /close|refus|denied/i.test(trimmed) ? "CLOSE" : "OPEN" };
            }
            var generic = {};
            pairs.forEach(function (pair) { generic[pair[0]] = pair[1]; });
            return pairs.length ? generic : trimmed;
        }

        /* Build a device's user list the way the engine expects to find it.

           The SSH exploit does not log in as whoever happens to be listed. It
           looks for a guest account or a user who is ONLINE, and says so when
           it finds neither:

               [*] Attack failed.
               [*] No guest account or online user found.

           QA hit exactly that with a device that had a perfectly good named
           user on it. The working reference mod never hands over a bare array:
           every one of its 25 machines wraps its users in
           createDefaultUserSchema(users, { guest: true }), which is what adds
           the accounts the engine actually attacks.

           So we do the same, and mark the author's own users online unless they
           deliberately said otherwise - a machine nobody is logged into cannot
           be broken into through a login service, which is not a distinction
           the editor ever offered to make. */
        /* Create a network at an address, clearing whatever is already there.

           Three constraints meet here, and getting any one of them wrong has
           cost a round:

           1. A network the save already holds WINS over a new one at the same
              ip, so a stale one has to go (r55).
           2. destroyNetwork returns a PROMISE. Firing it and building on the
              next line means the destroy lands after the create and deletes
              the new network - "Host is down ... No ports found" (r56).
           3. The engine only grants a mod its permissions while it is inside a
              call the engine made. ANY await hands control back, and every SDK
              call after it is refused as Mod "null" (r45).

           r56 waited for the destroy and accepted losing permissions for that
           one run. That was the wrong trade: the rest of the quest then ran
           without rights, so the tool responses were skipped and Mail.send was
           refused, and the mail went out through a fallback that delivered an
           EMPTY subject and body. A quest that half-builds is worse than one
           that visibly does nothing, because it looks like it worked.

           So the create is never awaited. The stale network is destroyed on
           the way past - the promise is left to settle on its own - and the
           new one is created immediately and synchronously. Where the engine
           replaces by address that is all that is needed; where it does not,
           the destroy still lands and the following run is clean. Either way
           the quest keeps its permissions and the player gets a working mod. */
        function buildNetwork(ip, definition, next) {
            var existing = __QE.safe(function () {
                return sdk.Network.getSubnet ? sdk.Network.getSubnet(ip) : null;
            });
            if (existing && sdk.Network.destroyNetwork) {
                __QE.log("network " + ip + " already exists in this save; replacing it");
                /* Deliberately NOT awaited: see above. Swallow the rejection so
                   an unhandled promise cannot surface as an error in the log. */
                __QE.safe(function () {
                    var p = sdk.Network.destroyNetwork(ip);
                    if (p && typeof p.then === "function") p.then(null, function () {});
                });
            }
            sdk.Network.createSubnetNetwork(definition);
            return next();
        }

        function mapUsers(dev) {
            var made = (dev.users || []).map(function (u) {
                var o = sdk.Network.createUser
                    ? sdk.Network.createUser({ username: u.username, password: u.password })
                    : { username: u.username, password: u.password };
                if (u.firstName) o.firstName = u.firstName;
                if (u.lastName) o.lastName = u.lastName;
                /* A user's files mount in their home directory — this is the
                   only way to put a file on a remote machine before the
                   player ever connects to it. */
                if (u.files && u.files.length) o.files = mapFiles(u.files);
                o.online = u.online == null ? true : !!u.online;
                if (u.acceptReverseTCP != null) o.acceptReverseTCP = !!u.acceptReverseTCP;
                if (u.emailAddress) o.email = { address: u.emailAddress, password: u.emailPassword || "" };
                return o;
            });
            var kind = String(dev.type || "").toUpperCase();
            /* Only DEVICES get the default schema.

               The reference mod is precise about this: 25 createDefaultUserSchema
               calls across 26 Devices, and none at all on its 7 Routers, which
               carry a plain list of named accounts. r53 applied it everywhere,
               which put a guest account on the edge router - and the SSH
               exploit then logged in as the easiest account it could find:

                   [*] UID: uid=0(guest) gid=0(guest).
                   [*] Found shell.

               A guest shell is not the way in the quest intends. The named
               account with acceptReverseTCP is, and that is what the exploit
               reaches once guest is not sitting in front of it. Routers,
               splitters and firewalls keep exactly the accounts the author
               wrote. */
            if (kind !== "DEVICE") return made;
            if (sdk.Network.createDefaultUserSchema) {
                return sdk.Network.createDefaultUserSchema(made, { guest: true });
            }
            return made;
        }

        function mapDevice(dev) {
            var out = {
                ip: dev.ip,
                type: dev.type,
                ports: (dev.ports || []).map(function (p) {
                    var o = { external: p.external, internal: p.internal, active: !!p.active, service: p.service };
                    /* "locked" was in the schema and the inspector but never
                       reached the engine. The reference mod is consistent
                       about it: a router's web port is locked, and the SSH
                       port the player is meant to exploit is explicitly
                       unlocked. Send whatever the author chose. */
                    if (p.locked != null) o.locked = !!p.locked;
                    if (p.version) o.version = p.version;
                    return o;
                }),
                users: mapUsers(dev),
            };
            /* The SDK's device definition is a discriminated union, and only
               some arms carry some fields: children belongs to Router and
               Splitter, rules to Firewall, model/accessable to Router. We used
               to attach all of them to everything, so a plain DEVICE went out
               with an empty children array and an empty rules array. Nemesis,
               which builds far larger networks than we do, never does that -
               its DEVICE objects carry only ip/type/name/users/ports/rootFiles
               /domain. Sending fields an arm does not declare is exactly the
               kind of thing this engine ignores silently, so each field is now
               attached only where it belongs. */
            var kind = String(dev.type || "").toUpperCase();
            if (kind === "ROUTER" || kind === "SPLITTER") {
                out.children = (dev.children || []).map(mapDevice);
            }
            if (kind === "FIREWALL") {
                out.rules = dev.rules || [];
            }
            if (dev.name) out.name = dev.name;
            if (dev.lanIp) out.lanIp = dev.lanIp;
            if (dev.isIpHidden != null) out.isIpHidden = !!dev.isIpHidden;
            /* model/accessable are Router-only in the union. */
            if (kind === "ROUTER") {
                if (dev.model) out.model = dev.model;
                if (dev.accessable != null) out.accessable = dev.accessable;
            }
            if (dev.rootFiles && dev.rootFiles.length) out.rootFiles = mapFiles(dev.rootFiles);
            if (dev.files && dev.files.length) out.rootFiles = (out.rootFiles || []).concat(mapFiles(dev.files));
            /* The engine takes a domain as { name, vulnerabilities }, not a
               bare string, and has no place for vulnerabilities outside it. */
            if (dev.domainName) {
                out.domain = { name: dev.domainName };
                if (dev.vulnerabilities && dev.vulnerabilities.length) out.domain.vulnerabilities = dev.vulnerabilities;
            }
            return out;
        }

        var QC = (function () {
            var cls = class extends sdk.Quest {
                constructor() {
                    super(...arguments);
                    questRef = this;
                    this.Name = qd.name;
                    this.Title = qd.title;
                    this.Description = qd.description;
                    this.Group = qd.group;
                    this.Rewards = qd.rewards;
                    if (qd.employer && Object.keys(qd.employer).length) this.Employer = qd.employer;
                    if (qd.icon) this.Icon = qd.icon;
                    /* Behaviour toggles from the quest settings. AutoStart is
                       the big one: without it the quest waits to be claimed
                       and none of the On… hooks ever run. */
                    if (qd.autoStart) this.AutoStart = true;
                    if (qd.autoComplete != null) this.AutoComplete = !!qd.autoComplete;
                    if (qd.abandonable != null) this.Abandonable = !!qd.abandonable;
                    if (qd.hasCompleteButton) this.HasCompleteButton = true;
                    if (qd.questsToComplete && qd.questsToComplete.length) this.QuestsToComplete = qd.questsToComplete;
                    if (qd.maxClaim != null) this.MaxClaim = qd.maxClaim;
                    if (qd.maxClaimPerDay != null) this.MaxClaimPerDay = qd.maxClaimPerDay;
                    if (qd.hackhubPost) {
                        var hp = { content: qd.hackhubPost.content };
                        if (qd.hackhubPost.media) hp.media = qd.hackhubPost.media;
                        if (qd.hackhubPost.authorName) hp.author = { name: qd.hackhubPost.authorName };
                        if (qd.hackhubPost.likes != null) hp.likes = qd.hackhubPost.likes;
                        if (qd.hackhubPost.comments && qd.hackhubPost.comments.length) {
                            hp.comments = qd.hackhubPost.comments.map(function (c) {
                                return { author: { name: c.authorName }, content: c.content };
                            });
                        }
                        this.HackhubPost = hp;
                    }
                    this.Objectives = Objectives;
                    if (Mails.length) this.Mails = Mails;
                    if (Object.keys(Dialog).length) this.Dialog = Dialog;
                    /* Only the chats that are NOT timed into the story: the
                       timed ones are played live when the flow reaches them. */
                    if (DeclaredKisscordChats.length) this.KisscordChats = DeclaredKisscordChats;
                    if (DeclaredWeeChatChats.length) this.WeeChatChats = DeclaredWeeChatChats;
                }
                CreateData() {
                    /* Required by the SDK (Quest.CreateData is abstract) even
                       when a quest has no data of its own to seed. Any
                       world.network/world.wifi node using ipMode: "random"
                       gets ONE ip allocated here, once, so it's stable
                       across reloads and shared by both the live device and
                       every {{data.targetIp}} reference. */
                    if (needsTargetIp) return { targetIp: sdk.Network.randomIp ? sdk.Network.randomIp() : "10.0.0.1" };
                    return {};
                }
                OnStart() {
                    /* The engine may build this class more than once (metadata
                       pass, then the live quest). Whichever instance the engine
                       is actually calling is the one that can send mail and
                       complete objectives, so bind it here rather than trusting
                       whatever the last constructor saw. */
                    questRef = this;
                    var ctx = { payload: {}, vars: {} };
                    var starts = g.nodes.filter(function (n) { return n.type === "entry.start"; });
                    /* Logged unconditionally. A quest whose OnStart never runs
                       looks exactly like a quest whose OnStart ran and did
                       nothing, and telling those apart from a player's log file
                       is worth one line. */
                    __QE.log("quest \"" + qd.name + "\" started (" + starts.length +
                        " entry point" + (starts.length === 1 ? "" : "s") + ")");
                    starts.forEach(function (n) { runFlow(n.id, ctx, 0); });
                }
                OnObjectivesStart() {
                    /* The engine may build this class more than once (metadata
                       pass, then the live quest). Whichever instance the engine
                       is actually calling is the one that can send mail and
                       complete objectives, so bind it here rather than trusting
                       whatever the last constructor saw. */
                    questRef = this;
                    var self = this;
                    __QE.log("quest \"" + qd.name + "\" objectives started");
                    var ctx = { payload: {}, vars: {} };
                    refillComms();
                    weechatServers.forEach(function (s) {
                        if (sdk.WeeChat && sdk.WeeChat.createServer) sdk.WeeChat.createServer(s.host, s.password);
                    });
                    g.nodes
                        .filter(function (n) { return n.type === "entry.load"; })
                        .forEach(function (n) { runFlow(n.id, ctx, 0); });
                    g.nodes
                        .filter(function (n) {
                            return n.type === "reply.hackertyper" &&
                                g.edges.some(function (e) { return e.source === n.id && e.kind === "flow"; });
                        })
                        .forEach(function (n) {
                            self.Events.on(__qeHtEvent(n), function () {
                                flowOuts(n.id).forEach(function (e) { runFlow(e.target, { payload: {}, vars: {} }, 0); });
                            });
                        });
                    /* Objectives that a game event completes.

                       These used to rely on QuestObjectiveDefinition.trigger,
                       the SDK's declarative form. QA reading the contract mail
                       never ticked "Read the contract" off, which is the same
                       shape of fault as the mail bug: an API the declarations
                       describe but the build does not honour. The SDK's own
                       Quest example completes objectives the imperative way -

                           this.Events.on("Terminal.NmapScan", (data) => {
                               if (data.ip === this.Data.targetIp)
                                   this.completeObjective("scan");
                           });

                       - so that is what is emitted now: listen to the trigger's
                       event, check the author's conditions, call
                       completeObjective, then follow the "On complete" wire.
                       One listener does both jobs, so the tick and the story
                       beat after it can no longer disagree.

                       (An objective the story flow *reaches* is ticked off in
                       runFlow instead; this covers the ones the player
                       completes by playing.) */
                    objectiveNodes.forEach(function (n) {
                        var trig = g.edges
                            .filter(function (e) { return e.kind === "condition" && e.target === n.id; })
                            .map(function (e) { return byId[e.source]; })
                            .filter(function (s) { return s && s.type === "trigger.event"; })[0];
                        if (!trig) return;
                        var doneEdges = g.edges.filter(function (e) {
                            return e.source === n.id && e.kind === "flow" && e.sourceHandle === "done";
                        });
                        var fired = false;
                        /* Logged at registration, not just on completion: when
                           an objective never ticks we have to be able to tell
                           "the listener was never attached" from "it was
                           attached and the event never arrived". Round 40 cost
                           a full round for want of this line. */
                        __QE.log("objective \"" + n.data.name + "\" is listening for " + trig.data.event);
                        self.Events.on(trig.data.event, function (data) {
                            if (fired) return;
                            if (!__QE.matchAll(trig.data.conditions, data, dataScope())) {
                                /* The event arrived but the author's conditions
                                   said no. Without this line, a mistyped field
                                   name or a case mismatch is indistinguishable
                                   from the game never raising the event at all,
                                   and the log stays silent either way. Print
                                   what actually turned up so the author can see
                                   which field to match on. */
                                __QE.log("objective \"" + n.data.name + "\": " + trig.data.event +
                                    " fired but did not match. Event carried: " + __QE.describe(data));
                                return;
                            }
                            fired = true;
                            if (n.data.name) {
                                try {
                                    self.completeObjective(n.data.name);
                                    __QE.log("objective \"" + n.data.name + "\" completed by " + trig.data.event);
                                } catch (e) {
                                    __QE.log("could not complete objective \"" + n.data.name + "\": " +
                                        (e && e.message ? e.message : e));
                                }
                            }
                            doneEdges.forEach(function (e) {
                                runFlow(e.target, { payload: data, vars: {} }, 0);
                            });
                        });
                    });
                    g.nodes
                        .filter(function (n) {
                            if (n.type !== "trigger.event") return false;
                            return !g.edges.some(function (e) { return e.source === n.id && e.kind === "condition"; });
                        })
                        .forEach(function (n) {
                            __QE.log("trigger " + n.id + " is listening for " + n.data.event);
                            self.Events.on(n.data.event, function (data) {
                                if (!__QE.matchAll(n.data.conditions, data, dataScope())) {
                                    __QE.log("trigger " + n.id + ": " + n.data.event +
                                        " fired but did not match. Event carried: " + __QE.describe(data));
                                    return;
                                }
                                flowOuts(n.id).forEach(function (e) { runFlow(e.target, { payload: data, vars: {} }, 0); });
                            });
                        });
                }
                OnComplete() {
                    /* The engine may build this class more than once (metadata
                       pass, then the live quest). Whichever instance the engine
                       is actually calling is the one that can send mail and
                       complete objectives, so bind it here rather than trusting
                       whatever the last constructor saw. */
                    questRef = this;
                    var ctx = { payload: {}, vars: {} };
                    runQuestCleanup();
                    weechatServers.forEach(function (s) {
                        if (sdk.WeeChat && sdk.WeeChat.removeServer) sdk.WeeChat.removeServer(s.host, s.password);
                    });
                    g.nodes
                        .filter(function (n) { return n.type === "entry.complete"; })
                        .forEach(function (n) { runFlow(n.id, ctx, 0); });
                }
                OnAbandon() {
                    /* The engine may build this class more than once (metadata
                       pass, then the live quest). Whichever instance the engine
                       is actually calling is the one that can send mail and
                       complete objectives, so bind it here rather than trusting
                       whatever the last constructor saw. */
                    questRef = this;
                    var ctx = { payload: {}, vars: {} };
                    runQuestCleanup();
                    weechatServers.forEach(function (s) {
                        if (sdk.WeeChat && sdk.WeeChat.removeServer) sdk.WeeChat.removeServer(s.host, s.password);
                    });
                    g.nodes
                        .filter(function (n) { return n.type === "entry.abandon"; })
                        .forEach(function (n) { runFlow(n.id, ctx, 0); });
                }
            };
            return cls;
        })();

        sdk.RegisterQuest(QC);
        questRef = null;

        /* commands for manual-input moments and reply.input nodes */
        var inputMoments = [];
        g.nodes.forEach(function (n) {
            if (n.type === "comms.dialogue") {
                var msgs = n.data.kind === "kisscord" ? n.data.kisscord.messages : n.data.kind === "weechat" ? n.data.weechat.messages : [];
                (msgs || []).forEach(function (m, i) {
                    if (m.playerAction === "input" && m.input) {
                        inputMoments.push({ id: n.id + ":" + i, input: m.input, label: m.content || "Type your answer:" });
                    }
                });
            }
        });
        g.nodes.filter(function (n) { return n.type === "reply.input"; }).forEach(function (n) {
            inputMoments.push({ id: n.id, input: { expected: n.data.expected, matchMode: n.data.matchMode, caseSensitive: n.data.caseSensitive, failureText: n.data.failureMessage, wrongRoute: "wrong" }, label: n.data.prompt || "Your answer:", node: n });
        });

        inputMoments.forEach(function (moment) {
            /* The author's own command name wins. The editor asks for one and
               the compiler used to ignore it, so a quest that told the player
               to run "reply" registered "qe-something" instead (audit, r67).
               Fall back to a generated name only when the field is blank. */
            var authored = moment.node && moment.node.data.commandName
                ? String(moment.node.data.commandName).trim().replace(/\s+/g, "-").toLowerCase()
                : "";
            var cmdName = authored || ("qe-" + moment.id.replace(/[^a-z0-9]+/gi, "-").slice(0, 24).toLowerCase());
            var cls = class extends sdk.Command {
                constructor() {
                    super(...arguments);
                    this.CommandName = cmdName;
                    this.Description = moment.node ? moment.node.data.commandDescription || "Quest input" : "Answer to continue the conversation";
                }
                Run(tools) {
                    var input = moment.input;
                    return tools.prompt(input && input.expected && moment.node && moment.node.data.mask ? { label: moment.label, password: true } : moment.label).then(function (answer) {
                        if (__QE.matchInput(input, answer)) {
                            if (input.expected) {
                                tools.printSuccess(
                                    (moment.node && moment.node.data.successMessage) || "Correct.",
                                );
                            }
                            sdk.Events.emit("QE." + moment.id + ".ok", { answer: answer });
                            if (moment.node) flowOutsFrom(moment.node.id, "out");
                        } else {
                            tools.printError(input.failureText || "That is not it.");
                            sdk.Events.emit("QE." + moment.id + ".wrong", { answer: answer });
                            if (moment.node && input.wrongRoute === "wrong") flowOutsFrom(moment.node.id, "failure");
                        }
                    });
                }
            };
            sdk.RegisterCommand(cls);
        });

        function flowOutsFrom(id, handle) {
            g.edges
                .filter(function (e) { return e.source === id && e.kind === "flow" && (!handle || e.sourceHandle === handle); })
                .forEach(function (e) { runFlow(e.target, { payload: {}, vars: {} }, 0); });
        }

        /* hackertyper widgets become pages on the referenced website */
        g.nodes.filter(function (n) { return n.type === "reply.hackertyper"; }).forEach(function (n) {
            __QE_HACKERTYPER.push({ node: n, questName: qd.name });
        });
    }

    /* ── websites ──────────────────────────────────────────────────────── */
    function registerWebsite(w, extraPages) {
        var pages = (w.pages || []).map(function (p) {
            return { path: p.path, title: p.title, html: p.content, seo: !!p.seo };
        });
        (extraPages || []).forEach(function (p) { pages.push(p); });
        var cls = class extends sdk.Website {
            constructor() {
                super(...arguments);
                this.SiteName = w.name || w.host;
                this.Host = w.host;
                /* Icon is declared abstract on Website, so it is a member the
                   engine expects to find. We have no icon to give a generated
                   site, but every website in Nemesis sets it - including to ""
                   - and an absent abstract member is precisely the kind of
                   thing this build ignores without complaint. */
                this.Icon = w.icon || "";
                this.Pages = pages;
            }
        };
        sdk.RegisterWebsite(cls);
    }

    var __QE_HACKERTYPER = [];

    /* The address the author can put in a mail: derived from the heading, so
       "SECURE REPLY - FABER" lives at /terminal/secure-reply-faber rather than
       at a generated node id nobody could ever type. */
    function __qeHtPath(node) {
        var slug = String(node.data.heading || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        return "/terminal/" + (slug || node.id);
    }

    (PROJECT.quests || []).forEach(registerQuest);

    /* attach hackertyper widget pages to their target sites */
    (PROJECT.websites || []).forEach(function (w) {
        var extras = [];
        __QE_HACKERTYPER.forEach(function (h) {
            if (h.node.data.surface !== "website") return;
            var ref = String(h.node.data.targetRef || "");
            if (ref.indexOf(w.host) !== 0) return;
            extras.push({
                path: __qeHtPath(h.node),
                title: h.node.data.heading || "Terminal",
                /* Listed on purpose: the player has to be able to find this
                   page. A hidden page at a generated address is a page nobody
                   ever opens. */
                seo: true,
                html: [
                    "<!DOCTYPE html><html><head><style>body{background:#000;color:#0f0;font-family:monospace;padding:24px}</style></head><body>",
                    "<h3>" + (h.node.data.heading || "") + "</h3><pre id='t'></pre>",
                    "<script>",
                    "var s=" + JSON.stringify(h.node.data.text) + ";var i=0;var done=false;",
                    "var EV=" + JSON.stringify(__qeHtEvent(h.node)) + ";",
                    /* The page runs in a sandboxed iframe, where the SDK is
                       exposed as HackhubSDK — not as sdk, which is what this
                       used to call, so the finished event never fired and
                       nothing downstream ever ran. Falls back to postMessage
                       for builds that wire the frame up differently. */
                    "function fire(){",
                    "  try{ if(typeof HackhubSDK!=='undefined'&&HackhubSDK.Events&&HackhubSDK.Events.emit){HackhubSDK.Events.emit(EV);return;} }catch(e){}",
                    "  try{ if(typeof sdk!=='undefined'&&sdk.Events&&sdk.Events.emit){sdk.Events.emit(EV);return;} }catch(e){}",
                    "  try{ if(window.parent){window.parent.postMessage({type:'HackhubSDK.Events.emit',event:EV},'*');} }catch(e){}",
                    "}",
                    "document.addEventListener('keydown',function(){if(done)return;i=Math.min(s.length,i+" + (h.node.data.charsPerKeypress || 3) + ");document.getElementById('t').textContent=s.slice(0,i);if(i===s.length){done=true;fire();}});",
                    "</script>",
                    "</body></html>",
                ].join(""),
            });
        });
        registerWebsite(w, extras);
    });
    /* The mod package entry point. Every piece of content is registered by the
       quest, website and command classes above, so this class has almost
       nothing to do - except say, in the game's own log, that it loaded.

       That line is not decoration. Two QA rounds were spent on mail that never
       arrived, and the thing that finally identified the fault was a game log
       in which every other installed mod printed a load banner and ours
       printed nothing at all. A mod that announces itself turns "the mail is
       broken" into "the mod never ran", which is a different bug entirely. */
    var Mod = class extends sdk.Bootstrap {
        OnModPackageLoaded() {
            __QE.log(PROJECT.mod.name + " v" + PROJECT.mod.version +
                " loaded (editor build " + __QE_BUILD + ").");
        }
    };
    sdk.RegisterModPackage(Mod);
    return Mod;
}
`;
