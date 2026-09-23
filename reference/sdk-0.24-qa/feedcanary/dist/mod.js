"use strict";

/*
 * QE24 Feed Canary (r220)
 *
 * The minimal possible mod that ships one quest with a HackhubPost, built to
 * mirror an EDITOR EXPORT's manifest exactly: apiVersion 1, permissions
 * ["mail", "events"], no other API surface. The harness mod (five
 * permissions) renders its posts; every editor export with the same post
 * shapes never has. This canary splits "the post shape" from "the manifest":
 *   HC1 renders  -> permissions/identity are innocent; the editor's compiled
 *                   runtime itself is the remaining suspect.
 *   HC1 absent (while the harness grid renders) -> a two-permission manifest
 *                   (or this mod identity shape) is what kills quest posts.
 * One quest, fresh name per version (claim memory: index.d.ts says a post
 * shows only while its quest "hasn't been claimed yet").
 */
var sdk = require("@hotbunny/hackhub-content-sdk");

var CANARY_SUFFIX = "102"; /* 1.0.2 - bump WITH the manifest version */

function log(message) {
    try { console.log("[qe24canary] " + message); } catch (_e) {}
}

class QE24FeedCanaryBootstrap extends sdk.Bootstrap {
    OnModPackageLoaded() {
        log("canary 1.0.2 loaded (permissions mail+events, AUTHOR ZEIS, like an editor export)");
    }
}

class QEFeedCanary extends sdk.Quest {
    constructor() {
        super();
        this.Name = "QEFeedCanary" + CANARY_SUFFIX;
        this.Title = "QE24 feed canary";
        this.Description = "One bare feed post from a mail+events mod. The whole test is whether it renders.";
        this.Group = "sandbox";
        this.AutoStart = false;
        this.Objectives = [{ name: "accept", description: "Accepted from the feed post - nothing to do." }];
        this.HackhubPost = {
            content: "HC2 canary bare post - mail+events mod, AUTHOR ZEIS. 1.0.1 (author HackHub Quest Editor) rendered. Absent = the author string is the discriminator.",
        };
    }
    CreateData() { return {}; }
    OnStart() { log(this.Name + " started from the feed claim - the canary RENDERED."); }
    OnObjectivesStart() {}
}

sdk.RegisterQuest(QEFeedCanary);
sdk.RegisterModPackage(QE24FeedCanaryBootstrap);

module.exports = Object.defineProperty({ __esModule: true }, "default", {
    get: function () { return QE24FeedCanaryBootstrap; },
    enumerable: true,
});
