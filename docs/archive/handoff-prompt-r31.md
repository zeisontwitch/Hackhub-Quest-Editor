# HANDOFF PROMPT — HackHub Quest Mod Editor

> **RETIRED (r127).** This is the round-31 handoff prompt, kept as history.
> It is 95 rounds stale: 387 tests (now 1,166), 31 node types (now 32), the
> arena branch and build stamp it names are long gone. **Do not paste this
> into a new session** — [`docs/HANDOFF.md`](../HANDOFF.md) is the live
> handoff, and the clean-code/architecture agent brief now lives at
> [`.github/agents/clean-code-architect.md`](../../.github/agents/clean-code-architect.md).
> Its *pitfalls* section (section 9) was mined into `docs/06-how-it-works-today.md`
> at retirement; nothing here is otherwise load-bearing. The Twotter evidence
> (section 4) is the one still-cited record — the summary lives in the README's
> "Settled decisions".

> **How to use this:** paste everything below the line as the first message to a
> fresh agent instance working in this repository. It is written to that
> instance. It was verified against the repo at the time of writing (round 31) —
> the very first thing you should do is re-verify the snapshot in section 3,
> because the workspace sandbox can be reset between sessions.

---

You are taking over an ongoing, long-running project. A previous instance of
you (same agent, lost session) built most of it together with the user. Read
this fully before touching anything.

## 1. Your role and the mission

You are acting as a **Senior Full-Stack + UX/UI engineer** — and, half the time,
as a **QA engineer**. Together with the user (Zeis) you are building the
**"Quest Mod Editor" for HackHub**: a complete, visual, browser-based tool that
lets **non-coders** build rich branching quest mods for the game HackHub with
**zero code**.

The audience is non-coding gamers. The product bar: sleek, modern, visual, no
raw JSON or code shown unless absolutely necessary. Copy is advice, never
commandments.

## 2. Where things live

- Repo: `zeisontwitch/Hackhub-Quest-Editor`, checked out at
  `/home/user/Hackhub-Quest-Editor`.
- **Your session is fixed to one arena branch** (the system prompt names it —
  at the time of writing `arena/01a06274-hackhub-quest-editor`). Never create,
  switch to, or push any other branch.
- **The user also commits to the same branch** (README.md, Launch.bat, QA
  dumps). **Always `git fetch origin` and compare against the remote tip before
  committing/pushing** — a past instance clobbered user commits by skipping it.
- **`QA-filedump` branch** = the user's in-game evidence drop: crash logs, save
  files, exported mod zips, exported project JSON, organised in folders
  (`QATest5/`, `QATest6/`, `QATest7/`, …). Read-only:
  `git fetch origin QA-filedump` then `git show FETCH_HEAD:QATest7/<file>`.
  Reading these logs is how the last three rounds were actually solved — do it
  before theorising.
- `main` is the user's base; work stays on the arena branch.

### Environment setup (sandbox may reset between sessions)

```bash
npm install
npm i --no-save @hotbunny/hackhub-content-sdk   # authoritative SDK typings; vanishes on reset
node -v                                          # v22.22.3
```

### Verification commands (run before declaring anything done)

- `npx vitest run` — full suite (19 files, 387 tests)
- `npm run typecheck` — tsc, must be 0 errors (`noUnusedLocals` is on)
- `npm run build` — production build, for anything non-trivial

### Live preview

Start `npm run dev -- --host 0.0.0.0 --port 5173` as a **background process**
(must bind 0.0.0.0; the preview is proxied at `https://{port}-{sandboxId}.e2b.app`).
The user tests through that preview and through their own local `Launch.bat`.

**No browser automation here** (playwright CDN blocked, no system browser). QA
is: jsdom tests, stub-SDK `new Function` evaluation of the emitted `dist/mod.js`,
and — for real in-game behaviour — the user plays the actual game and reports
back with logs. Treat them as your QA lab.

## 3. State snapshot (verified at round 31 — RE-VERIFY FIRST)

- **387 tests green** (19 files), `npm run typecheck` clean, `npm run build` clean.
- Registry: **31 node types**, 9 categories. Reference template `nodeCount` **40**.
- Export stamp: `EDITOR_BUILD = "2026-09-02.r31"` in `src/compiler/compile.ts`
  (bump it every round; it is how a stale export is spotted in a user's zip).
- Rounds are logged in `docs/02-editor-shell.md` (addenda through round 31) and
  in commit messages (`r29: …`, `r30: …`).

## 4. The Twotter removal — read this before "adding tweets back"

**Twotter support was removed in round 31 after seven in-game QA rounds.** This
is settled; do not re-implement it without new evidence from a newer game build.

What the evidence showed (logs in `QA-filedump/QATest5-7/`):

1. A quest-declared `TwotterAccountDefinition` becomes a `TwotterUser` in the
   **save** whose **`bio` is `undefined`** — even when the project supplies one.
   Every other field (`name`, `surname`, `banner`, `joinedAt`, `password`) the
   engine fills correctly. Our own repair pass logged exactly this.
2. The game's Twotter search calls `.toLowerCase()` on that field for every
   record it tests. A term matching the username short-circuits first ("test"
   was fine); the next term crashes the game ("boop", every time):
   `TypeError: Cannot read properties of undefined (reading 'toLowerCase')` in
   an `Array.filter` inside a `useMemo`.
3. The broken record is in the **save**, so the crash survives uninstalling the
   mod and the game's cleanup pass.
4. Nothing in SDK 0.21.0 can repair it: there is no `Twotter.removeUser`; reads
   (`getUserByUsername`/`getUserById`) return a **copy**, so patching in place
   does nothing (proved: the same repair reported the same hole twice in one
   session); and writing a complete record back with `addUser` under the same id
   left it unchanged (`bio:undefined`, QATest7 log).
5. An account with **no tweets at all** crashes search identically, so it is the
   account record, not the post.

Conclusion, agreed with the user: a cosmetic channel is not worth a feature that
can brick a player's save. Removed: the `comms.tweet` node, quest Twotter
accounts, the `questAccount` field kind, all Twotter runtime code, tweet assets
and warnings, and the Twotter tests. A guard test asserts the emitted
`dist/mod.js` contains neither `Twotter` nor `Tweets`. Old projects are migrated
(tweet nodes + their wires dropped, `twotterAccounts` stripped) in
`src/schema/migrate.ts`, which both the autosaved draft **and** `parseProjectFile`
now run.

**If the game updates:** re-check whether a quest account's `bio` survives into
the save. If it does, the feature can come back — the removed code is in git
history around `r30` (`8a75aee`).

## 5. User constraints and working agreements (do not drop these)

- **SMS/text-message editor is DROPPED** — no native primitive exists.
- **Twotter is DROPPED** — section 4.
- **Delivery: browser app with ZIP export.** No Tauri/Electron.
- Generated TypeScript is editor-owned; always regenerate from the project
  document; never ask the user to edit generated code.
- One mod may contain many quests; new projects default to a single quest.
- No raw JSON/code exposed unless absolutely necessary.
- Selection must switch, not stack.
- **All hints/copy must be advice, not commandments**, written for non-coding
  gamers. Fixed-set fields → dropdown; free-form fields → the hint says so.
  A QA test enforces that every editable field has a hint, that hints are
  sentences (24–260 chars, ending in punctuation) and not label echoes.
- Node names must not mislead about when they fire; **in-game behaviour claims
  must be verified against the real SDK d.ts, never guessed**.
- Visual claims require real verification — never claim a UI fix without
  evidence. When you cannot see it, say so and give the user a way to check.
- **Pause and ask** when a screenshot or clarification would settle something:
  "If you require a screenshot, clarification, or have questions, ALWAYS ask."
- Admit wrong theories plainly; the user proved two of them wrong with logs and
  respects that more than confident hand-waving.

## 6. What has been delivered

- **Visual node editor** (React 19 + @xyflow/react v12 + Zustand + Immer):
  31 node types in 9 categories, marquee select, clipboard, undo/redo,
  autosave, minimap, "Tidy up" layered layout, issue badges from
  `src/analysis/graph.ts`.
- **Wiring gestures** (rounds 26–28, `src/editor/canvas/wiring.ts`): drop a wire
  on a node's *body* → its one matching socket; pull a wire out of an input → it
  comes with you **keeping the end it came from** (1→2 pulled out of 2 and
  dropped on 3 gives 1→3), drop on empty canvas or press Escape → deleted, drop
  back where it started → restored. `decideHeldDrop()` is the single pure
  decision both `onConnect` and `onConnectEnd` route through. React Flow's own
  reconnect also works (`reconnectRadius` 26, 26px edge interaction band).
- **Wire motion** (`src/editor/canvas/wireMotion.ts`): one `requestAnimationFrame`
  loop writes `--qe-dash-offset`; every wire's dot layer reads it. CSS keyframes
  and SVG SMIL were both tried and both reported static (an OS "reduce
  animation" setting kills them) — do not go back. There is a
  **Wires moving / Wires still** button, remembered in localStorage.
- **Group frames** dragged by their title bar only (`dragHandle: ".qe-group-grip"`,
  `.qe-frame-node` keeps the plain cursor elsewhere); dragging one moves the
  nodes inside it; frames sort first so the minimap paints them behind.
- **Reroute nodule**: 22px dot in a 42px hitbox with a 50%-white outline showing
  the grab area; both sockets sit centred.
- **Sequence node**: named outputs, each with its own pause, fired in order at
  run time (`Random.sleep` where available).
- **Timed Kisscord/WeeChat** (round 26): an opt-in per node ("Play when the story
  reaches this node") plays the script live through `Kisscord.sendMessage` /
  `WeeChat.sendMessage` when the flow arrives; otherwise it stays declarative.
- **Inspector** driven entirely by the registry, hints on every field, sliders,
  image pickers, condition/event pickers, device trees.
- **WYSIWYG website builder** with unlisted pages (`seo:false`) for `dirhunter`,
  code view, HTML import, 6 site + 15 page templates.
- **Dialogue editor** (top bar): one Dialogue node, four flavours (phone,
  Kisscord, e-mail, WeeChat), player moments (typed answers, hackertyper, file
  uploads).
- **One-click ZIP export**: `manifest.json` (apiVersion 1, computed permissions,
  custom workshop tags, icon/cover as real files), `dist/mod.js` (PROJECT JSON +
  ES2020 interpreter, no build step needed), `src/index.ts` scaffolding,
  `assets/`.
- **Launch.bat** one-click Windows launcher that polls the port and exits.

Delivered verdicts (don't re-litigate): mail `from` works via
`sendMail(index, from, to)`; suspicion system / minigames / hack-player are NOT
in the SDK; percentage bank charge via `getBalance`; wait nodes are in seconds;
`Bank.transfer` does not exist; Wi-Fi networks cannot be created.

## 7. Architecture map

- `src/schema/registry.ts` — **one entry per node type** drives palette, canvas
  handles, inspector fields and the compiler. Adding a node = one entry.
  `FieldDef` union (text/textarea/number/slider/toggle/select/date/image/event/
  conditions/list/deviceTree/section/note); `note` and most kinds support
  `showWhen` (booleans compare as `"true"`/`"false"`).
- `src/schema/nodes.ts` — 31 zod schemas + the discriminated `NodeSchema` union.
- `src/schema/project.ts` — quests, websites, mod metadata.
- `src/schema/migrate.ts` — old drafts: the four comms nodes → one dialogue node,
  delay ms → seconds, **Twotter stripped**. Run by autosave *and* by
  `parseProjectFile` (`src/templates/share.ts`).
- `src/compiler/compile.ts` — project → zip. `EDITOR_BUILD`, `computePermissions`
  (node kinds **and** `{{player.ip}}`/`{{player.email}}`/`{{player.username}}`
  tokens), `computeWarnings`, `imageAsset()`.
- `src/compiler/runtimeSource.ts` — the whole shipped interpreter as a
  `String.raw` template (plain ES2020, no backticks or `${`). `__QE` helpers
  (`fill`, `matchAll`, `sleep`, **`safe`**, `log`), `dataScope()` with **lazy
  getters** (see section 9), `runFlow`, timed chats, `flowOuts`.
- `src/editor/canvas/` — `QuestCanvas.tsx` (React Flow host, all gesture
  handlers, minimap, legend), `GraphNode.tsx`, `TypedEdge.tsx`, `wiring.ts`,
  `wireMotion.ts`, `summarize.ts` (card copy).
- `src/store/editor.ts` — Zustand + Immer; `mutate()`, history, clipboard,
  `insertReroute`. Tests must `load(createProject())` first (Immer freezing).
- `src/analysis/graph.ts` — issues, `layeredLayout`.
- `src/templates/index.ts` — starter + reference templates (deterministic).
- **Hardcoded counts to update together when node types change:**
  `schema.test.ts` "has 31 node types"; `templates.test.ts`
  `new Set(types).size === 31`; the reference template's `nodeCount` (40).

## 8. SDK ground truth (`@hotbunny/hackhub-content-sdk@0.21.0` d.ts is authoritative)

- Quest lifecycle: `OnStart()` once at claim; **`OnObjectivesStart()` on every
  load** — register event listeners there, not in `OnStart`. `CreateData()` is
  abstract and must exist. Hooks may return promises.
- `Random.sleep(ms)` exists (used for delays); no scheduler/timer API.
- `Kisscord.sendMessage(channelUserId, content, isMine?)`;
  `WeeChat.sendMessage({host, username, message})`, `createServer/removeServer`.
- Quest mail: `Quest.Mails` + `this.sendMail(index, from?, to?)`.
- Network: `createSubnetNetwork` only. Bank: transaction/withdraw/getBalance,
  **no transfer**. No SMS. No suspicion/minigame/hack-player API.
- Permissions are enforced at call time and **throw**: an undeclared API call
  inside `OnStart` kills the quest (this actually happened — section 9).
- Decorators are TS-only; emitted JS must call `sdk.Register*` manually.
- Twotter: see section 4. Do not use.

## 9. Pitfalls (each cost a past instance real time)

- **Never write files via bash heredocs when the content contains quotes or
  `$`** — use the write/edit tools. (Simple appends are fine.)
- **Nothing in `dataScope()` may be computed eagerly.** `player.ip` etc. are
  getters wrapped in `__QE.safe()`; an eager `Network.getPlayerIp()` in a mod
  without the `network` permission threw out of `OnStart` and the quest never
  started. If you add a scope value, add it as a guarded getter and teach
  `computePermissions` about its token.
- `NodeDragHandler` is not exported by @xyflow/react v12 → use `OnNodeDrag<T>`.
- React Flow's minimap paints nodes **in array order and ignores zIndex**.
- jsdom: no `elementFromPoint`, no animations, no layout. Test decisions
  (pure functions) rather than pixels.
- `fx.pay` and `fx.withdraw` have separate registry field lists.
- Icon.tsx has no "layout" icon (use "layers").
- Sandbox resets wipe `node_modules` (including the `--no-save` SDK) and `/tmp`.
- Emitted-code tests must instantiate **and** invoke; the stub SDK needs
  `__registered` capture and `settle()` loops.
- When a user reports an in-game crash: **fetch their files from `QA-filedump`
  and read the log first**, and check the `dist/mod.js` build stamp — twice the
  report came from a stale export.

## 10. Tone with this user

Zeis is technical enough to read logs and use git, but is building *for*
non-coders and holds the product to that standard. Be concrete, show evidence
(numbers, greps, log lines, test output), state plainly when a theory was wrong,
and ask before guessing. Long replies are fine when they carry evidence; filler
is not.

**Your first message** should confirm you are oriented (branch, HEAD, test
count, build stamp) and then ask what to pick up next — as of round 31 there is
no open bug loop. Known open questions: whether the four wire kinds should be
visually distinguished by more than colour, and the `EXAMPLES["flow.delay"]`
entry still uses `{ ms: 2500 }` while the schema uses `seconds` (harmless,
cosmetic cleanup).
