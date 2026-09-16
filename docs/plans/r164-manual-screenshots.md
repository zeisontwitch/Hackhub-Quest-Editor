# r164: screenshot manifest — filenames, capture specs, tiers

Every image the handbook will use, with its **final filename** already decided.
The pages reference exactly these paths, so dropping a correctly named file into
`public/manual/img/` makes it appear — no code edit, no rename.

The 33 node filenames were derived from `NODE_TYPES_REGISTRY` programmatically,
not typed by hand, so a node cannot be misnamed.

---

## 1. Capture setup — same for every shot

| | |
|---|---|
| **Folder** | `public/manual/img/` |
| **Format** | `.png` — see §7 for the WebP question |
| **Theme** | **Midnight** (the default — `theme.ts:120`) |
| **Font** | **System** (the default) |
| **Cropping** | crop to what the shot is about — see §2 |
| **File size** | don't bother; I'll optimise on ingest (ImageMagick is available) |

### Two things that matter more than the rest

**1. Capture at 1× display scale, not Retina.** This is the single biggest lever
on file size. On a HiDPI display a "1280×800" window is really 2560×1600 pixels
— **four times the bytes for no benefit at the size these images display.** In
Chrome DevTools, device toolbar off; or set your display scaling to 100% for the
session. If your tool only captures at 2×, tell me and I'll downscale — but
capturing at 1× is a sharper result than downscaling a 2× shot.

**2. Crop to the point.** Most of these shots are about one panel or one
control, not the whole application. A 340px-wide inspector does not need 1100px
of canvas beside it. Each table below has a **Crop to** column.

### The three capture sizes

| Kind | Pixels | Use it for | ~KB at 1× |
|---|---|---|---|
| **Panel** | **440 wide**, natural height | a node's inspector (the docked panel is 340px — `drawerLayout.ts:40`) | 30–70 |
| **Region** | up to **900 wide**, crop tight | a dialog, the status bar, the palette, a settings section | 60–120 |
| **Full editor** | **1280 × 800** | only where the whole screen *is* the point | 150–200 |

### Projected total

| Kind | Shots | Subtotal |
|---|---|---|
| Panel (440 wide) | 45 | ~2.0 MB |
| Region (≤900 wide) | 19 | ~1.7 MB |
| Full editor (1280 × 800) | 5 | ~0.9 MB |
| Recipe cluster (760 × 480) | 16 | ~1.4 MB |
| In-game (1280 × 720) | 6 | ~0.9 MB |
| **Total, before optimising** | **91** | **~6.9 MB** |

Optimised on ingest that should land around **4–5 MB**. I'll report the actual
figure once the images are in, and if it's over budget I'll say so rather than
quietly dropping shots.

Only **five** shots need the whole screen. That's the change from the original
plan: a 340px inspector panel and a status bar strip do not need 1280×800 each,
and at 1× display scale the whole set fits in a few megabytes instead of
thirty.

### The one project to load for 33 of the 33 node shots

Load the **Node Reference** template (top bar → **Templates** → *Node
Reference*). It builds one of every obtainable node type, laid out and labelled
(`templates/reference.ts`, asserted by `templates.test.ts:240-251`). So per
node:

1. click the node on the canvas
2. make sure the inspector's **Node** tab is showing
3. screenshot, cropped to the panel

Thirty-three times, no setup between them.

**Record the build you captured on** — hover the stamp in the top bar. If it
isn't `2026-09-14.r162`, tell me, because a label change invalidates the text
next to the picture.

---

## 2. Tier 1 — 67 shots, the manual is incomplete without them

### 2.1 The screen tour (2)

| Filename | Crop to | What to show |
|---|---|---|
| `tour-workspace.png` | Full editor | *First Contact* loaded, with the top bar, quest strip, palette, canvas, docked inspector and status bar all visible and nothing collapsed. I'll add the numbered callouts. |
| `tour-empty-canvas.png` | Full editor | A brand-new blank project, before anything is added. |

### 2.2 The tutorial (14) — all in the *First Contact* template

| # | Filename | Crop to | Step | What to show |
|---|---|---|---|---|
| 01 | `tutorial-01-new-dialog.png` | Region | 2.2 | The **Start from a template** dialog open, template list visible. Not the **New** dialog — that one (`Start a new project?`) has no template list, only a destructive-clear warning. |
| 02 | `tutorial-02-first-contact.png` | Full editor | 2.2 | Just after loading *First Contact*. |
| 03 | `tutorial-03-read-the-map.png` | Full editor | 2.3 | The whole node map, zoomed to fit. |
| 04 | `tutorial-04-inspector-tabs.png` | Region | 2.3 | The inspector top, with the **Node / Quest / Mod** tabs clearly visible. |
| 05 | `tutorial-05-add-objective.png` | Region | 2.4 | The palette with **Objective** in view. |
| 06 | `tutorial-06-objective-inspector.png` | Panel | 2.4 | The new Objective selected, inspector open on its fields. |
| 07 | `tutorial-07-drag-wire.png` | Region | 2.5 | **Mid-drag** — a wire pulled from a *When event* output, not yet dropped. |
| 08 | `tutorial-08-when-event-inspector.png` | Panel | 2.5 | The *When event* inspector with the event picker open. |
| 09 | `tutorial-09-dialogue-inspector.png` | Panel | 2.6 | A *Dialogue* node selected, inspector open. |
| 10 | `tutorial-10-pay-inspector.png` | Panel | 2.7 | A *Pay the player* node selected, inspector open. |
| 11 | `tutorial-11-status-clean.png` | Region | 2.8 | The status bar alone: saved state, node/wire/objective counts, selection and history depth. A short wide strip is all this needs. Note the bar reports no issue counts at all — problems surface on the nodes and in the export window, so this shot cannot show a clean/unclean state. |
| 12 | `tutorial-12-dryrun.png` | Region | 2.9 | The **Dry run** dialog part-way through a trace. |
| 13 | `tutorial-13-export-dialog.png` | Region | 2.10 | The **Export mod** dialog with its summary and the *Download .zip* button. |
| 14 | `tutorial-14-installed.png` | In-game | 2.10 | The mod visible in the game's mod list. See §5. |

### 2.3 Feature guides (12)

| Filename | Crop to | What to show |
|---|---|---|
| `guide-inspector-tabs.png` | Region | The inspector at rest on the **Quest** tab (the default) so the reader sees where it starts. |
| `guide-quest-settings.png` | Panel | The **Quest** tab scrolled so **Behaviour** and its six controls are visible. |
| `guide-mod-settings.png` | Panel | The **Mod** tab, Identity + Permissions visible. |
| `guide-dialogues.png` | Region | The **Dialogues** dialog with a conversation open. |
| `guide-websites.png` | Region | The **Websites** builder, site list and a site's pages. |
| `guide-websites-page.png` | Region | A single page in the page editor, preview visible. |
| `guide-templates.png` | Region | The **Templates** gallery with all thirteen cards. |
| `guide-dryrun.png` | Region | **Dry run** showing the objective badges (*would tick* / *would never tick* / *unknown event* / *internal beat*). Load *The Harbour Manifest* — it has enough objectives to show more than one badge. |
| `guide-addons.png` | Region | The **Addons** dialog. Loaded pack if you have one; the empty state is fine and I'll write to it. |
| `guide-settings.png` | Region | The **Settings** sheet, theme and typography sections visible. |
| `guide-canvas-tools.png` | Region | The small canvas toolbar with the arrange tools open. |
| `guide-inspector-drawer.png` | Full editor | The inspector **torn off into a floating drawer** — worth the whole screen, because the point is where it sits relative to the canvas. |

### 2.4 Node inspectors (37) — all cropped to **Panel**, 440 wide

Load *Node Reference*, click the node, screenshot. Same three steps every time.

| Filename | Node | Registry type |
|---|---|---|
| `node-entry-start-inspector.png` | Quest start | `entry.start` |
| `node-entry-load-inspector.png` | On start & reload | `entry.load` |
| `node-entry-complete-inspector.png` | On quest complete | `entry.complete` |
| `node-entry-abandon-inspector.png` | On quest abandoned | `entry.abandon` |
| `node-objective-inspector.png` | Objective | `objective` |
| `node-trigger-event-inspector.png` | When event | `trigger.event` |
| `node-world-network-inspector.png` | Create network | `world.network` |
| `node-world-wifi-inspector.png` | Create Wi-Fi | `world.wifi` |
| `node-world-firewall-inspector.png` | Firewall rule | `world.firewall` |
| `node-world-port-inspector.png` | Change port | `world.port` |
| `node-world-domain-inspector.png` | Register domain | `world.domain` |
| `node-world-database-inspector.png` | Create database | `world.database` |
| `node-world-files-inspector.png` | Place files | `world.files` |
| `node-world-packdata-inspector.png` | Give data to an addon | `world.packData` |
| `node-pack-node-inspector.png` | Addon node | `pack.node` |
| `node-world-toolresponse-inspector.png` | Tool response | `world.toolResponse` |
| `node-comms-dialogue-inspector.png` | Dialogue | `comms.dialogue` |
| `node-reply-input-inspector.png` | Manual input | `reply.input` |
| `node-fx-pay-inspector.png` | Pay the player | `fx.pay` |
| `node-fx-withdraw-inspector.png` | Charge the player | `fx.withdraw` |
| `node-fx-notify-inspector.png` | Notify | `fx.notify` |
| `node-fx-prompt-inspector.png` | Ask player | `fx.prompt` |
| `node-fx-setdata-inspector.png` | Set quest data | `fx.setData` |
| `node-fx-claimquest-inspector.png` | Claim another quest | `fx.claimQuest` |
| `node-fx-completequest-inspector.png` | Complete quest | `fx.completeQuest` |
| `node-fx-retirequest-inspector.png` | Retire quest | `fx.retireQuest` |
| `node-fx-unclaimquest-inspector.png` | Unclaim quest | `fx.unclaimQuest` |
| `node-fx-shell-inspector.png` | Run terminal command | `fx.shell` |
| `node-fx-handbook-inspector.png` | Open handbook | `fx.handbook` |
| `node-flow-branch-inspector.png` | Branch | `flow.branch` |
| `node-flow-delay-inspector.png` | Wait | `flow.delay` |
| `node-flow-reroute-inspector.png` | Reroute | `flow.reroute` |
| `node-flow-random-inspector.png` | Random pick | `flow.random` |
| `node-flow-sequence-inspector.png` | Sequence | `flow.sequence` |
| `node-flow-debug-inspector.png` | Debug probe | `flow.debug` |
| `node-layout-group-inspector.png` | Group frame | `layout.group` |
| `node-flow-note-inspector.png` | Sticky note | `flow.note` |
| `node-flow-beat-inspector.png` | Story Beat | `flow.beat` |

Plus two, for the nodes whose real content is a bigger editor:

| Filename | Crop to | What to show |
|---|---|---|
| `node-world-network-devicetree.png` | Panel | *Create network* with the device tree expanded, showing a device's ports and accounts. Tall is fine. |
| `node-trigger-event-conditions.png` | Panel | *When event* with the condition builder open and at least one clause filled in. |

**Tier 1 total: 2 + 14 + 12 + 37 + 2 = 67 shots** (66 excluding the one in-game
shot, `tutorial-14-installed.png`).

---

## 3. Tier 2 — 19 shots, valuable but the manual works without them

### 3.1 Recipes (16) — "the finished piece", 760 × 480

Each is the node arrangement the walkthrough builds. Load the template named in the
walkthrough and crop to the relevant cluster — not the whole canvas.

| Filename | Recipe |
|---|---|
| `howto-01-objective.png` | Give the player an objective and make it tick |
| `howto-02-npc-message.png` | Send the player a message from an NPC |
| `howto-03-gated-message.png` | Make an NPC message arrive only after something else happens |
| `howto-04-payment.png` | Pay the player, and charge them |
| `howto-05-branch.png` | Branch the story on something the player did |
| `howto-06-passphrase.png` | Ask the player for a passphrase, with a wrong-answer route |
| `howto-07-website.png` | Build a website the player has to find |
| `howto-08-hidden-page.png` | Hide a page so only a brute-force finds it |
| `howto-09-file-drop.png` | Put a file on a machine the player has to break into |
| `howto-10-scan-gate.png` | Make the player scan a target before the story moves on |
| `howto-11-lead.png` | Give the player a lead they can look up |
| `howto-12-tool-match.png` | Set up a target a tool mod actually matches |
| `howto-13-chained-talk.png` | Chain two conversations together |
| `howto-14-ending.png` | End the story cleanly with Complete quest |
| `howto-15-from-template.png` | Start from a template and make it yours |
| `howto-16-update.png` | Update a quest you already exported |

### 3.2 Troubleshooting (3) — all cropped to **Region**

| Filename | What to show |
|---|---|
| `trouble-unreachable-badge.png` | A node on the canvas carrying the **Unreachable** warning badge. Crop tight around the node. |
| `trouble-no-trigger.png` | An Objective carrying the **No trigger** badge. Note: nothing blocks export — the **Download .zip** button is disabled only while packing (`ExportDialog.tsx:132`), so this badge is a canvas warning, not a gate. |
| `trouble-export-report.png` | The export dialog showing a **Needs attention** item. |

---

## 4. How the names are kept honest

The HTML is the source of truth for filenames — each page writes
`<img src="img/node-fx-pay-inspector.png">`. The coverage gate then fails the
build when:

- a page references an image that isn't in `public/manual/img/` — a
  half-finished manual can't ship with broken pictures;
- a file sits in `img/` that no page references — a renamed capture gets
  noticed instead of silently orphaning the page.

So capture in any order, over as many sittings as you like, and `npm test` tells
you what's still missing. You never have to remember.

Until an image exists, the page renders a placeholder box naming the file it
wants — so a missing shot is visible on the page, not invisible.

---

## 5. Five shots only you can take, because they're inside the game

The editor can't show what the player sees. These need HackHub running, at
**1280 × 720**:

| Filename | What to show |
|---|---|
| `ingame-objective-panel.png` | The game's objective panel with one of your quest's objectives listed. |
| `ingame-notify.png` | A **Notify** node's popup, as the player sees it. |
| `ingame-dialogue-phone.png` | A phone call from a **Dialogue** node, mid-conversation. |
| `ingame-website.png` | One of your built websites open in the game's browser. |
| `ingame-mod-loaded.png` | The moment your quest starts — whatever the player sees first. |

(`tutorial-14-installed.png` is also in-game, but it's counted with the
tutorial in §2.2.)

**Spoilers (S8):** keep the quest text in these shots early-game or from the
built-in templates. Nothing from the late story.

If you'd rather not take these now, the manual ships without them and the pages
say so in one line.

---

## 6. Counting up

| | Shots |
|---|---|
| Tier 1 — required | **67** (66 excluding its one in-game shot) |
| Tier 2 — valuable | **19** |
| In-game, only you, beyond the tutorial's | **5** |
| **Total, all capturable** | **91** |

**No shot is impossible.** `world.wifi` is now palette-visible after the SDK 0.24
QA pass, so it has a planned inspector screenshot like the other node pages.

---

## 7. PNG or WebP?

Measured, not guessed. A synthetic 440 × 620 dark-UI panel — flat background,
field labels, mono values, bordered inputs, the shape of a real node inspector —
encoded four ways with the ImageMagick on this machine (libwebp 1.2.4):

| Format | Bytes | vs PNG | Fidelity |
|---|---|---|---|
| PNG, optimised | 14,207 | — | — |
| **WebP, lossless** | **4,656** | **67.2% smaller** | **0 differing pixels** |
| WebP, quality 95 | 7,892 | 44.4% smaller | lossy |
| WebP, quality 80 | 5,228 | 63.2% smaller | 272,780 of 272,800 pixels differ |

The lossless result is the one that matters: **two thirds smaller and
bit-exact**, so there is no text-artifact risk — the usual objection to WebP on
screenshots only applies to the *lossy* modes, and those are off the table.

**Caveat on the number:** that panel is synthetic and very compressible — flat
fills, one typeface, no antialiased sub-pixel detail. Real screenshots will not
hit 67%; expect something in the 30–50% range. The direction is not in
question, the magnitude is.

### Recommendation

**You capture PNG. Whether we ship PNG or lossless WebP is a separate call, and
it should not change what you do** — every screenshot tool produces PNG, and I
can convert on ingest with the ImageMagick already here, so the drop-a-file-in
workflow survives either way.

- **Ship PNG** (default): zero conversion, ~6.7 MB raw and ~4–5 MB optimised,
  which is fine for a manual that is opened from local disk and never crosses a
  network. This is what I'll do unless you say otherwise.
- **Ship lossless WebP**: same images at roughly half the size or less, bit
  identical. Costs one mechanical step — a conversion pass plus `.webp` in the
  `src` attributes — and gate G8 has to accept either extension.

Converting later is a five-minute reversible change, so there is no cost to
starting with PNG and revisiting once the real images exist and we can measure
the actual ratio instead of a proxy.
