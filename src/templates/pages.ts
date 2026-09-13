/**
 * Ready-made website pages. Every template is a complete, self-contained HTML
 * document — its own <style>, system fonts, inline SVG, no external requests —
 * matching how the game's WebViews load sites (mod-asset://, no internet) and
 * what authors bring in from LLMs. Authors swap the text; the design holds.
 */
export interface PageTemplate {
    id: string;
    label: string;
    blurb: string;
    make: () => { title: string; path: string; seo: boolean; content: string };
}

/* ── Meridian Capital: corporate palette shared by its pages ─────────────── */

const CORP_CSS = `
:root{--navy:#0d2b45;--navy2:#123a5c;--gold:#c9a227;--ink:#22303e;--mut:#5c6b7a;--bg:#f5f7fa;--line:#dfe6ee}
*{box-sizing:border-box;margin:0}
body{font:15px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:var(--ink);background:var(--bg)}
a{color:var(--navy)}
header{background:var(--navy);color:#fff;position:sticky;top:0;z-index:5}
.nav{max-width:1040px;margin:0 auto;display:flex;align-items:center;gap:26px;padding:13px 20px}
.logo{display:flex;align-items:center;gap:10px;font-weight:700;letter-spacing:.4px}
.logo svg{width:24px;height:24px}
nav{margin-left:auto;display:flex;gap:20px;font-size:13.5px}
nav a{color:#cfd9e4;text-decoration:none}
nav a:hover{color:#fff}
main{max-width:1040px;margin:0 auto;padding:48px 20px}
h1.pg{font-size:30px;margin-bottom:8px}
p.sub{color:var(--mut);margin-bottom:28px;max-width:64ch}
footer{background:var(--navy);color:#9db1c5;font-size:12.5px;padding:24px 20px;margin-top:40px}
.foot{max-width:1040px;margin:0 auto;display:flex;gap:22px;flex-wrap:wrap}
footer a{color:#cfd9e4;text-decoration:none}
.btn{display:inline-block;background:var(--gold);color:#152238;font-weight:600;padding:11px 20px;border-radius:6px;text-decoration:none;font-size:14px}
.btn.ghost{background:transparent;color:#fff;border:1px solid #46617c;margin-left:10px}
`;

const CORP_HEADER = `
<header><div class="nav">
  <span class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="#c9a227" stroke-width="2"><path d="M3 21V7l7-4 7 4v14"/><path d="M3 21h18"/><path d="M10 21v-6h4v6"/></svg>Meridian Capital</span>
  <nav><a href="/">Home</a><a href="/about/team">Team</a><a href="/status">Status</a><a href="/contact">Contact</a></nav>
</div></header>`;

const CORP_FOOTER = `
<footer><div class="foot">
  <span>© 2026 Meridian Capital AG</span><span>Hafnerweg 12, Munich</span>
  <a href="/contact">Contact</a><a href="/status">Service status</a>
</div></footer>`;

export const PAGE_TEMPLATES: PageTemplate[] = [
    {
        id: "corp-home",
        label: "Corporate front page",
        blurb: "Sticky nav, gradient hero, service cards — a believable company site.",
        make: () => ({
            title: "Home",
            path: "/",
            seo: true,
            content: `<!doctype html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Meridian Capital — Discreet asset management</title>
<style>${CORP_CSS}
.hero{background:linear-gradient(135deg,var(--navy),var(--navy2) 70%);color:#fff;padding:76px 20px 88px}
.hero-in{max-width:1040px;margin:0 auto}
.hero h1{font-size:42px;line-height:1.12;max-width:620px;font-weight:750}
.hero p{margin:16px 0 26px;color:#c4d2e0;max-width:540px;font-size:16px}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.card{background:#fff;border:1px solid var(--line);border-radius:10px;padding:22px}
.card .tag{font-size:11px;color:var(--navy);background:#e8eef5;border-radius:99px;padding:2px 10px;display:inline-block;margin-bottom:12px}
.card h3{font-size:15.5px;margin-bottom:8px}
.card p{font-size:13.5px;color:var(--mut)}
.band{background:#fff;border-block:1px solid var(--line);padding:46px 20px;text-align:center}
.band p{max-width:620px;margin:0 auto;color:var(--mut)}
</style>
</head>
<body>
${CORP_HEADER}
<div class="hero"><div class="hero-in">
  <h1>Discreet asset management for a connected world.</h1>
  <p>Meridian Capital safeguards portfolios, settles privately, and reports honestly — since 2009.</p>
  <a class="btn" href="/contact">Open an enquiry</a><a class="btn ghost" href="/about/team">Meet the team</a>
</div></div>
<main>
  <div class="cards">
    <div class="card"><span class="tag">Custody</span><h3>Portfolio custody</h3><p>Cold storage, dual control, and quarterly attestation for every client position.</p></div>
    <div class="card"><span class="tag">Analytics</span><h3>Risk analytics</h3><p>Exposure dashboards refreshed hourly, stress-tested against your own thresholds.</p></div>
    <div class="card"><span class="tag">Settlement</span><h3>Private settlements</h3><p>Counterparty-matched settlement windows with end-to-end encrypted statements.</p></div>
  </div>
</main>
<div class="band"><p>“We keep a low profile on purpose. The less the internet knows about us, the better we sleep.” — H. Voss, Chief Executive</p></div>
${CORP_FOOTER}
</body>
</html>`,
        }),
    },
    {
        id: "team",
        label: "Corporate team page",
        blurb: "Staff directory cards with roles and @company mails — great for leads.",
        make: () => ({
            title: "Our team",
            path: "/about/team",
            seo: true,
            content: `<!doctype html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Our team — Meridian Capital</title>
<style>${CORP_CSS}
.people{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.person{background:#fff;border:1px solid var(--line);border-radius:10px;padding:22px;text-align:center}
.ava{width:64px;height:64px;border-radius:50%;background:var(--navy);color:var(--gold);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;margin:0 auto 12px}
.person h3{font-size:15.5px}
.person .role{color:var(--mut);font-size:12.5px;margin:4px 0 10px}
.person a{font-size:12.5px}
</style>
</head>
<body>
${CORP_HEADER}
<main>
  <h1 class="pg">Our team</h1>
  <p class="sub">Small on purpose. Every account is known by name, not by number.</p>
  <div class="people">
    <div class="person"><div class="ava">HV</div><h3>H. Voss</h3><p class="role">Chief Executive</p><a href="mailto:h.voss@meridian-capital.net">h.voss@meridian-capital.net</a></div>
    <div class="person"><div class="ava">MI</div><h3>M. Iyer</h3><p class="role">Head of Settlements</p><a href="mailto:m.iyer@meridian-capital.net">m.iyer@meridian-capital.net</a></div>
    <div class="person"><div class="ava">DO</div><h3>D. Okafor</h3><p class="role">Systems Administrator</p><a href="mailto:d.okafor@meridian-capital.net">d.okafor@meridian-capital.net</a></div>
  </div>
</main>
${CORP_FOOTER}
</body>
</html>`,
        }),
    },
    {
        id: "status",
        label: "Status dashboard",
        blurb: "Uptime rows, coloured badges, incident log — a status-page that reads real.",
        make: () => ({
            title: "Service status",
            path: "/status",
            seo: true,
            content: `<!doctype html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Status — Meridian Capital</title>
<style>
*{box-sizing:border-box;margin:0}
body{font:14px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#1f2937;background:#f8fafc}
.wrap{max-width:860px;margin:0 auto;padding:40px 20px}
h1{font-size:22px;margin-bottom:4px}
p.upd{color:#64748b;font-size:12.5px;margin-bottom:22px}
.banner{display:flex;align-items:center;gap:10px;background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;border-radius:8px;padding:12px 16px;font-weight:600;margin-bottom:26px}
.dot{width:10px;height:10px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 4px #dcfce7}
.row{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:8px}
.row .name{font-weight:600}
.row .up{margin-left:auto;color:#64748b;font-size:12px;font-family:ui-monospace,Menlo,Consolas,monospace}
.badge{font-size:11px;font-weight:700;border-radius:99px;padding:3px 10px}
.ok{background:#dcfce7;color:#15803d}
.warn{background:#fef3c7;color:#b45309}
h2{font-size:15px;margin:28px 0 10px}
.inc{border-left:3px solid #f59e0b;background:#fffbeb;padding:10px 14px;border-radius:0 6px 6px 0;margin-bottom:8px;font-size:13px}
.inc .d{font-family:ui-monospace,Menlo,Consolas,monospace;color:#92400e;font-size:11.5px}
</style>
</head>
<body>
<div class="wrap">
  <h1>Meridian Capital — service status</h1>
  <p class="upd">Updated 5 minutes ago · All times CET</p>
  <div class="banner"><span class="dot"></span>All systems operational</div>
  <div class="row"><span class="name">Client portal</span><span class="up">99.98% · 90d</span><span class="badge ok">Operational</span></div>
  <div class="row"><span class="name">Settlement API</span><span class="up">99.91% · 90d</span><span class="badge ok">Operational</span></div>
  <div class="row"><span class="name">VPN concentrator</span><span class="up">97.40% · 90d</span><span class="badge warn">Degraded</span></div>
  <h2>Past incidents</h2>
  <div class="inc"><span class="d">2026-07-14</span> — VPN concentrator rebooted after firmware update (ticket NC-1187). Resolved 02:41.</div>
  <div class="inc"><span class="d">2026-05-02</span> — Mail relay delay, resolved within the hour.</div>
</div>
</body>
</html>`,
        }),
    },
    {
        id: "contact",
        label: "Corporate contact page",
        blurb: "Address, mail and hours blocks with a quiet 'no security research' note.",
        make: () => ({
            title: "Contact",
            path: "/contact",
            seo: true,
            content: `<!doctype html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Contact — Meridian Capital</title>
<style>${CORP_CSS}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.box{background:#fff;border:1px solid var(--line);border-radius:10px;padding:22px}
.box h3{font-size:14px;text-transform:uppercase;letter-spacing:.6px;color:var(--mut);margin-bottom:10px}
.box p{font-size:14px}
.note{margin-top:22px;border:1px dashed var(--line);background:#fff;border-radius:10px;padding:16px 20px;color:var(--mut);font-size:13px}
</style>
</head>
<body>
${CORP_HEADER}
<main>
  <h1 class="pg">Contact</h1>
  <p class="sub">We answer within one business day. Usually sooner.</p>
  <div class="grid">
    <div class="box"><h3>Visit</h3><p>Hafnerweg 12<br>80992 Munich<br>By appointment only.</p></div>
    <div class="box"><h3>Write</h3><p><a href="mailto:press@meridian-capital.net">press@meridian-capital.net</a><br><a href="mailto:clients@meridian-capital.net">clients@meridian-capital.net</a></p></div>
    <div class="box"><h3>Call</h3><p>+49 89 000 000<br>Mon–Fri, 9:00–17:00</p></div>
  </div>
  <div class="note">We do not accept unsolicited security research. Reports sent to personal mailboxes are deleted unread.</div>
</main>
${CORP_FOOTER}
</body>
</html>`,
        }),
    },
    {
        id: "hidden-leak",
        label: "Hidden internal memo",
        blurb: "Deliberately plain 'printed memo' look, unlisted, deep path — dirhunter bait.",
        make: () => ({
            title: "Q3 internal audit",
            path: "/files/internal/q3-audit",
            seo: false,
            content: `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>q3-audit.txt</title>
<style>
body{font:13.5px/1.7 Georgia,"Times New Roman",serif;color:#111;background:#fdfdf8;padding:48px 20px}
.sheet{max-width:680px;margin:0 auto;background:#fff;border:1px solid #d8d4c8;padding:44px 48px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.stamp{display:inline-block;border:3px double #b91c1c;color:#b91c1c;font-weight:700;letter-spacing:2px;padding:4px 12px;transform:rotate(-2deg);font-size:15px;margin-bottom:18px}
.meta{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;color:#555;border-bottom:1px solid #ccc;padding-bottom:10px;margin-bottom:18px}
h1{font-size:19px;margin-bottom:12px}
p{margin:0 0 10px}
strong.red{background:#ffe4e6}
</style>
</head>
<body>
<div class="sheet">
  <span class="stamp">INTERNAL — DO NOT DISTRIBUTE</span>
  <div class="meta">doc: Q3-SETTLEMENT-AUDIT · rev 3 · authored d.okafor · retention: 7y</div>
  <h1>Q3 settlement audit — findings</h1>
  <p>1. The offshore batch continues to settle through <strong class="red">router 10.9.4.2</strong> until the Frankfurt move completes.</p>
  <p>2. Archive access rotates weekly. Current procedure: ask <strong>D. Okafor</strong> on the internal channel; the temporary phrase follows the usual <strong class="red">month-favourite-planet</strong> scheme.</p>
  <p>3. Stop printing this document.</p>
</div>
</body>
</html>`,
        }),
    },
    {
        id: "substack-home",
        label: "Newsletter landing page",
        blurb: "Substack-style publication: serif column, subscribe box, latest posts.",
        make: () => ({
            title: "The Greyline Dispatch",
            path: "/",
            seo: true,
            content: `<!doctype html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Greyline Dispatch</title>
<style>
*{box-sizing:border-box;margin:0}
body{font:16px/1.7 Georgia,"Times New Roman",serif;color:#1a1a1a;background:#fffdf9}
a{color:#1a1a1a}
.bar{max-width:680px;margin:0 auto;display:flex;align-items:center;padding:18px 20px;border-bottom:1px solid #ece7df}
.pub{font-weight:700;font-size:17px}
.bar .sub{margin-left:auto;background:#ff6719;color:#fff;font:600 13px system-ui,sans-serif;border-radius:6px;padding:7px 14px;text-decoration:none}
main{max-width:680px;margin:0 auto;padding:44px 20px}
h1{font-size:34px;line-height:1.2;margin-bottom:10px}
p.dek{color:#6b6b6b;font-size:16px;margin-bottom:26px}
.subscribe{display:flex;gap:8px;margin-bottom:40px}
.subscribe input{flex:1;border:1px solid #d9d2c7;border-radius:6px;padding:10px 12px;font:14px system-ui,sans-serif}
.subscribe button{background:#ff6719;border:0;color:#fff;border-radius:6px;padding:10px 16px;font:600 14px system-ui,sans-serif}
h2.latest{font:700 13px system-ui,sans-serif;letter-spacing:1px;text-transform:uppercase;color:#8a857c;margin-bottom:6px}
.post{display:block;padding:20px 0;border-top:1px solid #ece7df;text-decoration:none}
.post h3{font-size:20px;margin-bottom:6px}
.post p{color:#6b6b6b;font-size:14.5px}
.post .meta{font:12px system-ui,sans-serif;color:#9b968c;margin-top:8px}
footer{max-width:680px;margin:0 auto;padding:24px 20px 40px;font:12px system-ui,sans-serif;color:#9b968c}
</style>
</head>
<body>
<div class="bar"><span class="pub">The Greyline Dispatch</span><a class="sub" href="/">Subscribe</a></div>
<main>
  <h1>Notes from the grey line of the harbour.</h1>
  <p class="dek">A weekly letter on cranes, containers, and the things dockworkers would rather you didn't see.</p>
  <div class="subscribe"><input type="email" placeholder="your@email.net" aria-label="email"><button type="button">Subscribe</button></div>
  <h2 class="latest">Latest</h2>
  <a class="post" href="/p/night-shift"><h3>The night shift doesn't log what it unloads</h3><p>Between 2 and 4 a.m. the manifests go quiet, but the cranes don't. A letter from a reader who counts trucks for a living.</p><div class="meta">Aug 21, 2026 · 6 min read</div></a>
  <a class="post" href="/p/grain-silo"><h3>Who owns the grain silo on pier 9?</h3><p>Four shell companies, one mailbox, and a fence that gets repaired every time someone photographs it.</p><div class="meta">Aug 14, 2026 · 4 min read</div></a>
  <a class="post" href="/p/ferry-fares"><h3>Ferry fares are up, again</h3><p>The harbour authority calls it maintenance. The maintenance budget, however, is a locked PDF.</p><div class="meta">Aug 7, 2026 · 3 min read</div></a>
</main>
<footer>© 2026 The Greyline Dispatch · read by 2,148 dockworkers, auditors and one very nervous press office</footer>
</body>
</html>`,
        }),
    },
    {
        id: "substack-post",
        label: "Newsletter article",
        blurb: "A full post page: headline, byline, prose, pull quote and comment teaser.",
        make: () => ({
            title: "The night shift doesn't log what it unloads",
            path: "/p/night-shift",
            seo: true,
            content: `<!doctype html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>The night shift doesn't log what it unloads — The Greyline Dispatch</title>
<style>
*{box-sizing:border-box;margin:0}
body{font:17px/1.8 Georgia,"Times New Roman",serif;color:#1a1a1a;background:#fffdf9}
a{color:#1a1a1a}
.bar{max-width:680px;margin:0 auto;display:flex;align-items:center;padding:18px 20px;border-bottom:1px solid #ece7df}
.pub{font-weight:700;font-size:17px;text-decoration:none}
.bar .sub{margin-left:auto;background:#ff6719;color:#fff;font:600 13px system-ui,sans-serif;border-radius:6px;padding:7px 14px;text-decoration:none}
main{max-width:680px;margin:0 auto;padding:44px 20px}
h1{font-size:32px;line-height:1.25;margin-bottom:12px}
.meta{font:13px system-ui,sans-serif;color:#9b968c;margin-bottom:28px}
p{margin:0 0 18px}
blockquote{margin:26px 0;padding:4px 0 4px 18px;border-left:3px solid #ff6719;font-size:20px;line-height:1.5;color:#3c3c3c}
.author{display:flex;gap:12px;align-items:center;border:1px solid #ece7df;border-radius:10px;padding:14px 16px;margin:30px 0}
.author .ava{width:42px;height:42px;border-radius:50%;background:#3c3c3c;color:#fff;display:flex;align-items:center;justify-content:center;font:700 15px system-ui,sans-serif}
.author .n{font:600 14px system-ui,sans-serif}
.author .d{font:12.5px system-ui,sans-serif;color:#9b968c}
.comments{font:13px system-ui,sans-serif;color:#6b6b6b;border-top:1px solid #ece7df;padding-top:16px}
</style>
</head>
<body>
<div class="bar"><a class="pub" href="/">The Greyline Dispatch</a><a class="sub" href="/">Subscribe</a></div>
<main>
  <h1>The night shift doesn't log what it unloads</h1>
  <div class="meta">Aug 21, 2026 · 6 min read · by R. Calloway</div>
  <p>There is an hour at the harbour when the paperwork sleeps. The manifest system shows nothing between 02:00 and 04:00, every night, like a held breath. But the cranes move. My reader counts trucks from a parking garage on Voss Strasse, and his tally never matches the port's public dashboard.</p>
  <p>Last Tuesday the difference was nine trucks. All of them tarped. All of them in, none of them out.</p>
  <blockquote>“The manifests go quiet, but the cranes don't.”</blockquote>
  <p>The harbour authority says the gap is “a scheduled maintenance window”. It is remarkable how much maintenance a port needs at exactly the hours nobody is watching.</p>
  <p>I have asked for the maintenance log under the information act. I will publish what comes back, including the parts that are blacked out — especially the parts that are blacked out.</p>
  <div class="author"><span class="ava">RC</span><div><div class="n">R. Calloway</div><div class="d">Writes about logistics so you don't have to. Tips via the usual mailbox.</div></div></div>
  <div class="comments">14 comments · subscribers only · <a href="/">back to the Dispatch</a></div>
</main>
</body>
</html>`,
        }),
    },
    {
        id: "substack-drafts",
        label: "Hidden drafts page",
        blurb: "Unlisted author's drafts — the unpublished note is the clue.",
        make: () => ({
            title: "drafts",
            path: "/drafts/harbour",
            seo: false,
            content: `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>drafts</title>
<style>
body{font:14px/1.7 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#24292f;background:#f6f8fa;padding:40px 20px}
.sheet{max-width:640px;margin:0 auto;background:#fff;border:1px solid #d0d7de;border-radius:8px;padding:28px 32px}
h1{font-size:16px;margin-bottom:4px}
p.warn{color:#b42318;font-size:12px;margin-bottom:18px}
.draft{border-top:1px solid #d0d7de;padding:12px 0;font-size:13.5px}
.draft .m{color:#57606a;font-size:11.5px}
</style>
</head>
<body>
<div class="sheet">
  <h1>Unpublished drafts</h1>
  <p class="warn">Author view — never linked, never indexed.</p>
  <div class="draft"><strong>The silo on pier 9, part II</strong> — holding. Legal wants the lease names double-checked before this goes out. The locker at the dockside café holds the scanned leases; combination is the pier number followed by the year the fence went up.<div class="m">last edit 2026-08-19 23:41</div></div>
  <div class="draft"><strong>Ferry fares, follow-up</strong> — waiting on the information request.<div class="m">last edit 2026-08-11 08:02</div></div>
</div>
</body>
</html>`,
        }),
    },
    {
        id: "reddit-front",
        label: "Forum front page",
        blurb: "Reddit-style front: vote rails, community tags, sidebar — top post links to its thread.",
        make: () => ({
            title: "Threadnest — the front page",
            path: "/",
            seo: true,
            content: `<!doctype html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Threadnest</title>
<style>
*{box-sizing:border-box;margin:0}
body{font:13.5px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#0b1416;background:#dae0e6}
header{background:#0b1416;position:sticky;top:0;z-index:5}
.nav{max-width:1080px;margin:0 auto;display:flex;align-items:center;gap:14px;padding:10px 20px}
.logo{display:flex;align-items:center;gap:8px;color:#fff;font-weight:700;font-size:15px}
.logo i{width:24px;height:24px;border-radius:50%;background:#ff4500}
.search{flex:1;max-width:420px;background:#27313a;border:1px solid #3a4550;border-radius:6px;color:#8296a5;padding:7px 12px}
main{max-width:1080px;margin:0 auto;padding:22px 20px;display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start}
.post{display:flex;background:#fff;border:1px solid #ccc;border-radius:6px;margin-bottom:12px}
.votes{width:44px;background:#f8f9fa;padding:10px 0;text-align:center;color:#6a7178;font-weight:700;border-radius:6px 0 0 6px}
.votes .up{color:#ff4500}.votes .dn{color:#7193b7}
.pbody{padding:10px 14px}
.meta{font-size:11.5px;color:#6a7178;margin-bottom:6px}
.post h3{font-size:16px;margin-bottom:6px}
.post h3 a{text-decoration:none}
.tags{font-size:11.5px;color:#6a7178}
aside .about{background:#fff;border:1px solid #ccc;border-radius:6px;padding:14px}
aside h4{font-size:13px;margin-bottom:8px}
aside p{font-size:12px;color:#4a5560;margin-bottom:10px}
aside .k{font-size:11px;color:#6a7178;display:flex;justify-content:space-between;border-top:1px solid #eee;padding-top:8px}
</style>
</head>
<body>
<header><div class="nav"><span class="logo"><i></i>threadnest</span><span class="search">Search threadnest</span></div></header>
<main>
  <div>
    <div class="post"><div class="votes"><div class="up">▲</div>4821<div class="dn">▼</div></div>
      <div class="pbody"><div class="meta">t/cityops · posted by u/night_auditor · 3 hours ago</div>
      <h3><a href="/r/cityops/comments/night_shift">The night shift doesn't log what it unloads (long, receipts inside)</a></h3>
      <div class="tags">💬 312 comments · share · save</div></div></div>
    <div class="post"><div class="votes"><div class="up">▲</div>1204<div class="dn">▼</div></div>
      <div class="pbody"><div class="meta">t/transit · posted by u/ferryfan · 7 hours ago</div>
      <h3>Ferry fares up 12% while the “maintenance window” budget stays a locked PDF</h3>
      <div class="tags">💬 96 comments · share · save</div></div></div>
    <div class="post"><div class="votes"><div class="up">▲</div>640<div class="dn">▼</div></div>
      <div class="pbody"><div class="meta">t/harbour · posted by u/crane_watcher · 11 hours ago</div>
      <h3>Anyone else's dashboard show nine tarped trucks that officially don't exist?</h3>
      <div class="tags">💬 58 comments · share · save</div></div></div>
  </div>
  <aside><div class="about"><h4>About threadnest</h4><p>The front page of the harbour. Everything the port authority posts, and everything it doesn't.</p>
  <div class="k"><span>Members</span><span>48,213</span></div><div class="k"><span>Online</span><span>1,097</span></div></div></aside>
</main>
</body>
</html>`,
        }),
    },
    {
        id: "reddit-thread",
        label: "Forum thread with comments",
        blurb: "The top post as its own page: OP body plus a nested, scored comment tree.",
        make: () => ({
            title: "The night shift doesn't log what it unloads",
            path: "/r/cityops/comments/night_shift",
            seo: true,
            content: `<!doctype html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>The night shift doesn't log what it unloads — threadnest</title>
<style>
*{box-sizing:border-box;margin:0}
body{font:13.5px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#0b1416;background:#dae0e6}
header{background:#0b1416}
.nav{max-width:900px;margin:0 auto;display:flex;align-items:center;gap:14px;padding:10px 20px}
.logo{display:flex;align-items:center;gap:8px;color:#fff;font-weight:700;font-size:15px;text-decoration:none}
.logo i{width:24px;height:24px;border-radius:50%;background:#ff4500}
main{max-width:900px;margin:0 auto;padding:22px 20px}
.op{display:flex;background:#fff;border:1px solid #ccc;border-radius:6px}
.votes{width:44px;background:#f8f9fa;padding:10px 0;text-align:center;color:#6a7178;font-weight:700;border-radius:6px 0 0 6px}
.votes .up{color:#ff4500}
.pbody{padding:12px 16px}
.meta{font-size:11.5px;color:#6a7178;margin-bottom:6px}
h1{font-size:18px;margin-bottom:8px}
.op p{font-size:13.5px;margin-bottom:8px}
.c{background:#fff;border:1px solid #ccc;border-radius:6px;padding:10px 14px;margin-top:10px}
.c .m{font-size:11.5px;color:#6a7178;margin-bottom:4px}
.c .m b{color:#0b1416}
.c p{font-size:13px}
.nest{margin-left:22px;border-left:2px solid #bcc5cd;padding-left:10px}
.replybox{margin-top:14px;background:#fff;border:1px solid #ccc;border-radius:6px;padding:10px 14px;color:#6a7178;font-size:12.5px}
</style>
</head>
<body>
<header><div class="nav"><a class="logo" href="/"><i></i>threadnest</a></div></header>
<main>
  <div class="op"><div class="votes"><div class="up">▲</div>4821</div>
    <div class="pbody"><div class="meta">t/cityops · u/night_auditor · 3 hours ago</div>
    <h1>The night shift doesn't log what it unloads (long, receipts inside)</h1>
    <p>I count trucks for a living. Parking garage on Voss Strasse, thermos, spreadsheet. For six months my 02:00–04:00 tally has never once matched the port dashboard, which claims zero movements in that window.</p>
    <p>Last Tuesday: nine tarped trucks in, zero out. The dashboard showed a “maintenance window”. Posting this because the harbour forum told me to write it up. Receipts available to anyone who asks the right question.</p></div></div>
  <div class="c"><div class="m"><b>u/crane_watcher</b> · 2h · 861 pts</div><p>The crane schedules back this up. Bay 4 runs hot every “maintenance window”. Someone is paying for that power draw.</p>
    <div class="nest"><div class="c"><div class="m"><b>u/night_auditor</b> (OP) · 2h · 402 pts</div><p>Power draw is how I started counting in the first place. The substation meter is readable from the public road, if anyone lives nearby.</p></div>
    <div class="c"><div class="m"><b>u/pier9_pigeon</b> · 1h · 233 pts</div><p>I live on Voss Strasse. Taking photos of the fence again this week. They repaired it twice last month, which tells you what they think of my camera.</p></div></div></div>
  <div class="c"><div class="m"><b>u/ferryfan</b> · 1h · 154 pts</div><p>Cross-posting to t/transit. The locked maintenance budget and the phantom trucks smell like the same invoice.</p></div>
  <div class="c"><div class="m"><b>u/mod_team</b> · 44m · 12 pts</div><p>Reminder: keep it legal. Public roads and public records only. Thread stays up.</p></div>
  <div class="replybox">Add a comment (sign-in required)</div>
</main>
</body>
</html>`,
        }),
    },
    {
        id: "recipe-home",
        label: "Recipe site home",
        blurb: "Warm food-blog front: masthead, hero line, recipe cards with gradient covers.",
        make: () => ({
            title: "Butter & Bramble",
            path: "/",
            seo: true,
            content: `<!doctype html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Butter & Bramble — harbour cooking</title>
<style>
*{box-sizing:border-box;margin:0}
body{font:16px/1.7 Georgia,serif;color:#3d2f26;background:#fff8f0}
header{background:#7a8b6f}
.nav{max-width:980px;margin:0 auto;display:flex;align-items:center;gap:24px;padding:14px 20px}
.brand{color:#fff;font-size:20px;font-weight:700}
nav{margin-left:auto;display:flex;gap:18px;font:13.5px system-ui,sans-serif}
nav a{color:#eef2ea;text-decoration:none}
main{max-width:980px;margin:0 auto;padding:40px 20px}
h1{font-size:34px;color:#5a4636;margin-bottom:8px}
.dek{color:#8a7462;margin-bottom:28px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.card{background:#fff;border:1px solid #eadfd2;border-radius:10px;overflow:hidden;text-decoration:none}
.ph{height:110px}
.ph.a{background:linear-gradient(135deg,#e9b489,#c65f3f)}
.ph.b{background:linear-gradient(135deg,#a4b394,#7a8b6f)}
.ph.c{background:linear-gradient(135deg,#e8d8b0,#b98a2e)}
.in{padding:16px}
.t{font:11px system-ui,sans-serif;color:#c65f3f;letter-spacing:1px;text-transform:uppercase}
.card h3{font-size:17px;margin:4px 0}
.card p{font:13px system-ui,sans-serif;color:#8a7462}
footer{max-width:980px;margin:0 auto;padding:24px 20px 44px;font:12px system-ui,sans-serif;color:#b3a08d}
</style>
</head>
<body>
<header><div class="nav"><span class="brand">Butter &amp; Bramble</span><nav><a href="/">Recipes</a><a href="/recipes/harbour-fish-pie">This week</a></nav></div></header>
<main>
  <h1>Harbour cooking, slowly.</h1>
  <p class="dek">Seasonal recipes from the dockside market. If it can't survive a night shift, we don't publish it.</p>
  <div class="grid">
    <a class="card" href="/recipes/harbour-fish-pie"><div class="ph a"></div><div class="in"><span class="t">This week</span><h3>Harbour fish pie</h3><p>Smoked haddock, one big spoon of mustard, and a lid of rough-cut potatoes.</p></div></a>
    <a class="card" href="/"><div class="ph b"></div><div class="in"><span class="t">Foraging</span><h3>Bramble &amp; bay tart</h3><p>Hedge fruit, patience, and a pastry you don't have to be proud of.</p></div></a>
    <a class="card" href="/"><div class="ph c"></div><div class="in"><span class="t">Store cupboard</span><h3>Dockside rarebit</h3><p>The night shift's melted cheese on toast, elevated just enough.</p></div></a>
  </div>
</main>
<footer>© 2026 Butter &amp; Bramble · photographed on the pier, wind permitting</footer>
</body>
</html>`,
        }),
    },
    {
        id: "recipe-page",
        label: "Recipe page",
        blurb: "The full recipe: meta chips, ingredients panel, numbered method, cook's note.",
        make: () => ({
            title: "Harbour fish pie",
            path: "/recipes/harbour-fish-pie",
            seo: true,
            content: `<!doctype html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Harbour fish pie — Butter & Bramble</title>
<style>
*{box-sizing:border-box;margin:0}
body{font:16px/1.7 Georgia,serif;color:#3d2f26;background:#fff8f0}
header{background:#7a8b6f}
.nav{max-width:980px;margin:0 auto;display:flex;align-items:center;gap:24px;padding:14px 20px}
.brand{color:#fff;font-size:20px;font-weight:700;text-decoration:none}
main{max-width:980px;margin:0 auto;padding:40px 20px}
h1{font-size:32px;color:#5a4636;margin-bottom:6px}
.dek{color:#8a7462;margin-bottom:16px}
.chips{display:flex;gap:8px;margin-bottom:28px}
.chip{font:12px system-ui,sans-serif;background:#f3e7d8;color:#8a5a3b;border-radius:99px;padding:5px 12px}
.layout{display:grid;grid-template-columns:300px 1fr;gap:28px;align-items:start}
.ing{background:#fff;border:1px solid #eadfd2;border-radius:10px;padding:20px 22px}
.ing h2{font:700 13px system-ui,sans-serif;letter-spacing:1px;text-transform:uppercase;color:#c65f3f;margin-bottom:12px}
.ing ul{list-style:none}
.ing li{border-bottom:1px dashed #eadfd2;padding:7px 0;font-size:14.5px}
ol.steps{padding-left:0;list-style:none;counter-reset:s}
ol.steps li{counter-increment:s;position:relative;padding:0 0 18px 44px;font-size:15.5px}
ol.steps li::before{content:counter(s);position:absolute;left:0;top:2px;width:30px;height:30px;border-radius:50%;background:#c65f3f;color:#fff;display:flex;align-items:center;justify-content:center;font:700 14px system-ui,sans-serif}
.note{margin-top:8px;background:#f3e7d8;border-radius:10px;padding:16px 20px;font-size:14px;color:#6d5844}
</style>
</head>
<body>
<header><div class="nav"><a class="brand" href="/">Butter &amp; Bramble</a></div></header>
<main>
  <h1>Harbour fish pie</h1>
  <p class="dek">The pie the dockside canteen refuses to write down. We wrote it down.</p>
  <div class="chips"><span class="chip">Prep 25 min</span><span class="chip">Cook 45 min</span><span class="chip">Serves 6</span><span class="chip">Freezes well</span></div>
  <div class="layout">
    <div class="ing"><h2>Ingredients</h2><ul>
      <li>700 g smoked haddock</li><li>300 g white fish trimmings</li><li>600 ml whole milk</li><li>2 bay leaves</li>
      <li>70 g butter, plus more</li><li>70 g flour</li><li>1 big spoon mustard</li><li>a fistful of parsley</li>
      <li>1 kg floury potatoes, rough-cut</li><li>black pepper, no shame</li>
    </ul></div>
    <ol class="steps">
      <li>Poach the fish in the milk with the bay leaves for 8 minutes. Lift out; keep the milk. That milk is the whole sauce.</li>
      <li>Boil the rough-cut potatoes until a fork wins. Drain, steam dry, bash with half the butter. No ricing — the lumps are the point.</li>
      <li>Melt the rest of the butter, stir in the flour, cook one minute, then whisk in the poaching milk until it coats a spoon.</li>
      <li>Flake in the fish, add mustard, parsley and pepper. Into the dish. Lid it with the bashed potatoes, fork it rough.</li>
      <li>45 minutes at 200°C, until the top is the colour of the harbour at six p.m. Rest ten. Serve with something green as an apology.</li>
    </ol>
  </div>
  <div class="note"><strong>Cook's note:</strong> the canteen adds a pinch of nutmeg “when the auditors aren't watching”. We have never seen the auditors.</div>
</main>
</body>
</html>`,
        }),
    },
    {
        id: "agency",
        label: "Public agency landing (NAZA)",
        blurb: "The naza.gov front page: gov bar, orbit hero, missions, newsroom teasers. Links to /missions, /news, /portal — add those pages too.",
        make: () => ({ title: "NAZA homepage", path: "/", seo: true, content: nazaHome }),
    },
    {
        id: "agency-portal",
        label: "Agency employee portal",
        blurb: "A gov login box that always denies access — with an HTML comment hidden in the source as a view-source clue.",
        make: () => ({ title: "Employee Portal", path: "/portal", seo: true, content: nazaPortal }),
    },
    {
        id: "agency-helpdesk",
        label: "Agency internal helpdesk",
        blurb: "An unlisted internal IT page listing temp-password rules — made to be found by dirhunter, not by the menu.",
        make: () => ({ title: "IT Help Desk (internal)", path: "/it/helpdesk", seo: false, content: nazaHelpdesk }),
    },
];

/* ── whole-site starters ─────────────────────────────────────────────────── */

export interface SiteTemplate {
    id: string;
    label: string;
    blurb: string;
    make: () => {
        host: string;
        name: string;
        pages: { title: string; path: string; seo: boolean; content: string; template: string }[];
    };
}

const pageFrom = (id: string) => {
    const t = PAGE_TEMPLATES.find((x) => x.id === id)!;
    return { ...t.make(), template: t.id };
};

export const SITE_TEMPLATES: SiteTemplate[] = [
    {
        id: "corp",
        label: "Corporate site",
        blurb: "Front page, team, status and contact — plus a hidden internal memo two directories deep for dirhunter to find.",
        make: () => ({
            host: "meridian-capital.net",
            name: "Meridian Capital",
            pages: ["corp-home", "team", "status", "contact", "hidden-leak"].map(pageFrom),
        }),
    },
    {
        id: "agency",
        label: "Public agency site (NAZA)",
        blurb: "The community naza.gov site, rebuilt as real pages: home, missions, humans, science, news, directory, a portal that always denies — plus an unlisted IT helpdesk page for dirhunter.",
        make: () => ({
            host: "naza.gov",
            name: "NAZA",
            pages: [
                { title: "NAZA homepage", path: "/", seo: true, content: nazaHome, template: "agency" },
                { title: "Missions", path: "/missions", seo: true, content: nazaMissions, template: "agency" },
                { title: "Humans in Space", path: "/humans", seo: true, content: nazaHumans, template: "agency" },
                { title: "Science", path: "/science", seo: true, content: nazaScience, template: "agency" },
                { title: "News & Events", path: "/news", seo: true, content: nazaNews, template: "agency" },
                { title: "Leadership & Directory", path: "/directory", seo: true, content: nazaDirectory, template: "agency" },
                { title: "Employee Portal", path: "/portal", seo: true, content: nazaPortal, template: "agency-portal" },
                {
                    title: "IT Help Desk (internal)",
                    path: "/it/helpdesk",
                    seo: false,
                    content: nazaHelpdesk,
                    template: "agency-helpdesk",
                },
            ],
        }),
    },
    {
        id: "leak",
        label: "Leak archive",
        blurb: "A sparse public status page, with the real goods hidden in a sub-directory.",
        make: () => ({
            host: "archive.nightwire.net",
            name: "Nightwire archive",
            pages: ["status", "hidden-leak"].map(pageFrom),
        }),
    },
    {
        id: "blog",
        label: "Newsletter blog (Substack-style)",
        blurb: "A personal publication: landing page with subscribe box, a full article, and a hidden drafts page for clues.",
        make: () => ({
            host: "greyline-dispatch.net",
            name: "The Greyline Dispatch",
            pages: [pageFrom("substack-home"), pageFrom("substack-post"), pageFrom("substack-drafts")],
        }),
    },
    {
        id: "forum",
        label: "Forum front page (Reddit-style)",
        blurb: "A front page of scored posts whose top post opens into its own comment thread.",
        make: () => ({
            host: "threadnest.net",
            name: "Threadnest",
            pages: [pageFrom("reddit-front"), pageFrom("reddit-thread")],
        }),
    },
    {
        id: "recipes",
        label: "Recipe site",
        blurb: "A warm food blog: card grid home plus a full recipe page with ingredients and method.",
        make: () => ({
            host: "butterandbramble.com",
            name: "Butter & Bramble",
            pages: [pageFrom("recipe-home"), pageFrom("recipe-page")],
        }),
    },
];

/* ── starter for blank sites ─────────────────────────────────────────────── */

import { BASE_CSS } from "@/editor/websites/pageDoc";
import nazaHome from "@/editor/websites/naza/home.html?raw";
import nazaMissions from "@/editor/websites/naza/missions.html?raw";
import nazaHumans from "@/editor/websites/naza/humans.html?raw";
import nazaScience from "@/editor/websites/naza/science.html?raw";
import nazaNews from "@/editor/websites/naza/news.html?raw";
import nazaDirectory from "@/editor/websites/naza/directory.html?raw";
import nazaPortal from "@/editor/websites/naza/portal.html?raw";
import nazaHelpdesk from "@/editor/websites/naza/it-helpdesk.html?raw";

/** The first page of a blank website: styled, with obvious placeholder copy. */
export const STARTER_PAGE = `<!doctype html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>New site</title>
<style>${BASE_CSS}
header.site{display:flex;gap:22px;align-items:center}
header.site nav{margin-left:auto;font-weight:400;font-size:13px}
header.site nav a{color:#cfd9e4;text-decoration:none;margin-left:16px}
</style>
</head>
<body>
<header class="site">Your Organisation<nav><a href="/">Home</a><a href="/contact">Contact</a></nav></header>
<h1>A headline the player will remember</h1>
<p>Write the public face of your quest here. Everything the player should believe, and — somewhere in a sub-directory — the one page they were never meant to find.</p>
<h2>What goes on a page like this</h2>
<ul>
  <li>A lead: a name, a mailbox, a router model, a ticket number.</li>
  <li>A reason to look closer: an odd footnote, an “audit scheduled” notice.</li>
  <li>A dead end that feels real: a login box that always denies access.</li>
</ul>
</body>
</html>`;
