# r179 (plan): the Twotter probe

## Why this round

Zeis, after the r178 close-out:

> Let's see if Twotter can work now. Can you create a test for me to check
> please? I'll go run S-01/03/05/15 in the meantime.

Twotter was removed from the editor in **r31** for a game bug, not a design
choice, and the evidence for reopening it is now good enough to test properly.

## What was actually wrong (the r31 removal)

From `docs/05-bug-report-for-hotbunny.md` BUG 3, reproduced across seven QA
rounds on game 1.1.2:

1. A quest-declared `TwotterAccountDefinition` became a `TwotterUser` in the
   save whose **`bio` was `undefined`** — even when the project supplied a bio.
2. Twotter's search called `.toLowerCase()` on that field. A search term that
   matched the username short-circuited (it survived); the *next* term crashed
   the game (`TypeError: Cannot read properties of undefined (reading
   'toLowerCase')`).
3. The bad record was written to the **save**, so the crash survived
   uninstalling the mod.
4. **No mod could repair it**: there was no `Twotter.removeUser`,
   `getUserBy*` handed back a *copy* so in-place patching did nothing, and
   re-adding the record under the same id left `bio: undefined`.
5. An account with no tweets crashed search identically — it was the account
   record, not the post.

The report's suggested fixes were exactly two: default `bio` to `""` on
creation, and/or guard the search comparison against undefined fields.

## Why reopening is now plausible — three independent changes

| Change | Where |
| --- | --- |
| **The creation path has a defaults-filling constructor**: `Twotter.createUser(options?)` — "Create a new Twotter user with sensible defaults for missing fields." | SDK 0.24 declaration |
| **The repair calls now exist**: `Twotter.updateUser(id, patch): boolean` ("Patch an existing account in place… `getUserById` hands back a copy, so this is the call that reaches the stored record") and `Twotter.removeUser(id): boolean` (deletes the account and everything that referenced it). Point 4 of the old report is answered by the declaration itself. | SDK 0.24 declaration |
| **The game bug is claimed fixed, with existing saves repaired**: "Fixed an issue that allowed a content pack to break Twotter permanently, taking the site down when searching for people. Affected saves are repaired on load." | 1.3.0 changelog (Zeis's transcription) |

None of that *proves* anything, which is the point of the probe.

## The probe — `qe24 twotter` (raw harness 1.0.9)

Goes in the raw harness, not the editor export: the editor cannot author Twotter
yet, and this is a question about the engine's behaviour.

| Row | Command / action | What a green result proves |
| --- | --- | --- |
| T-01 | `qe24 twotter seed` → search `qe24_probe` | `createUser` + `addUser` produce a browsable account; the API path works. |
| T-02 | `qe24 twotter bad` → search `qe24_badrecord` | **Search survives the exact r31 record shape.** |
| T-03 | `status` → save → quit to the main menu → reload → `status` | "Repaired on load" is true: the bio is no longer `undefined`. |
| T-04 | `qe24 twotter update` | `updateUser` returns `true` twice — a mod can repair a record it did not create. |
| T-05 | `qe24 twotter post` → open the profile | Posts work; `Twotter.PostSeen` fires for our account. |
| T-06 | `qe24 twotter cleanup` | `removeUser` returns `true` three times and the handles vanish — accounts are removable, which is what makes shipping them safe at all. |
| T-07 | Open the profile of `qe24_declared` | The **quest-declared** account carries its bio → the *write* path is fixed, not just search. |

### Two decisions inside the probe

- **The bad record is planted on purpose, and it is the recorded shape.**
  `bio` is present and `undefined` — not a missing property, which is what a
  naive `addUser({...})` without a `bio` key would produce and what
  `JSON.stringify` would happily omit. The old save held a property that was
  `undefined`, so that is what T-02 must reproduce. The test suite asserts this
  (`expect("bio" in bad).toBe(true)`), so a future edit cannot quietly weaken
  the probe into a passing no-op.
- **`createUser` is *not* used for the bad record.** Its whole job is to fill
  the fields the test leaves out; using it would test nothing. For the good
  record it is exactly right.

### What the outcome decides

- All green → re-implement: account + tweet authoring in the editor, a post
  node, and the r31 fence comes down.
- T-02 red → it stays removed; the crash lines go to SteelWaffe with the
  build id.
- T-02 green, T-07 red → search is guarded but the engine still writes bio-less
  records. We would ship against `createUser`/`updateUser`/`removeUser` only
  and never use the declarative account path — a design constraint, not a
  blocker.
- T-06 red → do not ship accounts at all: without `removeUser` a player's save
  keeps them forever.

## The probe's own test suite (why the count moved this round)

The harness is hand-authored and nothing compiled it, which has already bitten
once (r173 mangled this very file with an edit tool). `sdk024QaScaffold.test.ts`
now loads `mod/dist/mod.js` against a stub SDK and drives the probe: 9 new tests
covering registration of the probe quest, the event wiring (and that someone
else's account does **not** tick our objectives), the seed/bad/status/update/
post/cleanup commands, the honest "Twotter API unavailable" path, and the
shape of the planted record. The stub emulates the engine writing
quest-declared accounts, because that is the path T-07 asks about.

## Housekeeping

- The QA folder's "nothing to run" wording (r178) was **wrong** the moment this
  probe existed, so `README.md` and `STATUS.md` now say plainly: one open probe,
  everything else closed. The Twotter rows are the first section of the ledger.
- The export is regenerated for the build stamp only (mod **1.0.7**); the probe
  ships in `mod/`, which the export guard does not compile.
- One extra instruction in the probe's guide: a two-second `curl
  http://qe24-http.test/` check on the 1.3.1 build, since the 1.3.0 changelog
  claims curl was added and the earlier build lacked it.

## Files this touches

`reference/sdk-0.24-qa/mod/dist/mod.js` (probe + guide/next wording, patched by
an assert-guarded script and `node --check`ed), `mod/manifest.json` (1.0.9),
`src/compiler/__tests__/sdk024QaScaffold.test.ts`, `reference/sdk-0.24-qa/
{STATUS.md,README.md}`, the QA project (1.0.7) + notes, the regenerated manual
and stamps, and the README / `06` / HANDOFF / plans rows.

## Gates and evidence

`npm run typecheck` clean, `npm test` green (**+9** — the probe's own suite),
`npm run build` succeeds, `node --check` on the patched harness, the probe
exercised end-to-end against a stub SDK, `gen:manual` and `gen:qa-export`
regenerated. Falsified: the probe's record-shape assertion (revert the planted
`bio: undefined` and the test must fail) and the event wiring.

## Stamp

`2026-09-18.r179`.
