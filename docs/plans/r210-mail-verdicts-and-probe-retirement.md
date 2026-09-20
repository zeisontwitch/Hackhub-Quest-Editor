# r210 — the mail rows ran; the retired probes' surfaces are swept

A two-half round: record and process the mail batch's results (M-01…M-10,
run in one session on 2026-09-20, game 1.3.1, harness 1.0.24), then retire the
QA probes whose surfaces had outlived their rows — per the standing rule that
a finished probe must not keep registering UI on a tester's machine.

## Half 1 — the results

Transcript: [`../reference/sdk-0.24-qa/QE24-TestResults-Mail.md`](../../reference/sdk-0.24-qa/QE24-TestResults-Mail.md)
(committed verbatim from the test dump). The findings that changed code or
questions:

| Row | Verdict | What it means |
|---|---|---|
| M-01 | green | `send` → id, same id in getInbox; **mail arrives pre-read** (the sweep must not filter on read). |
| M-02 | green | `remove(id)` → `true`, again → `false`, junk id → `false`. Trustworthy, in-session. |
| M-03 | green | A never-read mail removes fine, and the removal survives save → quit → reload. |
| M-04 | green | Reply button draws on the direct `Mail.send({ replyable: true })` path. The runtime's stale no-flag assumption is disproved. |
| M-05 | green | Raw reply payload: **no `repliedTo`**; subject is the constant `(Reply)`; `to` = original's `from`. Matching a reply = matching `to`. → docs/03 §16. |
| M-06 | green | Reply button also draws on the quest `sendMail(0)` path; the reply objective ticked on `to` = quest's from. |
| M-07 | half-red | The **sweep** half of our fixture was dead: it matched subjects, and getInbox carries none. The **quest** half also couldn't complete: r209's second objective never ticks, so the Complete button never appears (the r185 canary lesson, repeated). Both fixed in r210. |
| M-08 | red (the game's) | `OnModPackageUnloaded` fires at next start; every gated call from it is refused `Mod "null"` (`Mail.remove` incl.). Unload cleanup impossible; quest-end cleanup works. → docs/03 §14 amendment. |
| M-09 | green | `moment` RFC2822 warning fires on a **clean save, no mods** — game's own tweets. README roadmap row closed. |
| M-10 | green | `sendBounce` draws a real mailer-daemon bounce (550 quoted). |

Harness fixes from the run (all in `reference/sdk-0.24-qa/mod/dist/mod.js`):

- The sweep, the audit and the cleanup arm match the probe **from** addresses
  (`MAIL_PROBE_FROMS` = the direct and quest probe senders), never subjects.
- The audit prints one **raw inbox entry** — so the next session can re-check
  which fields 1.3.1 fills without a new probe.
- The mail quest has exactly **one** objective (`quest-reply-seen`); the
  untickable `cleanup-seen` reminder is gone (the r185 lesson).
- The watch-on hint now closes itself out: "`qe24 mail watch off` is fine."

## Half 2 — the retirement

The r199–r205 pack-extras and click probes did their rows (r208 closed the
extras batch); their widget and start-menu entries were still alive on the
tester's machine. Removed from the raw harness (`1.0.25`):

- The clickprobe block, its command dispatch and its `clickProbeRegister()`
  load step — excised.
- The extras verbs (`on`/`off`/`lang`/`say`) and their guide — replaced by
  **`qe24 extras cleanup`**, which hands all **14** QE24 registration ids the
  project ever used (probe ids + the QA export's menu/widget/context surfaces)
  to `Menu.removeItem` / `Desktop.removeWidget` / `ContextMenu.unregister`,
  then reports the aftermath. Bundles are noted as not unregistrable.
  Any other `qe24 extras …` prints a 6-line retired notice.
- `widgets/qe24-widget.html` deleted; `manifest.json` → 1.0.25.

The QA export (`projects/sdk-0.24-ingame-qa.project.json` → **1.0.36**) lost
its `extras`, its `translations` and the `QESdk024ExtrasQa` quest — the
runtime's registration pass reads the empty arrays and adds nothing, so a
replaced export stops re-creating the surfaces on every load. The
pack-extras **feature** stays in the editor untouched; only the QA project's
instance of it is gone.

## Tests and verification

- Scaffold pins moved to 1.0.25: version, from-matching sweep (the quest mail
  is swept with a non-marker subject — the subject sweep cannot pass this
  test), the single-objective fence, the retired verbs (nothing registers),
  the launcher list without the extras alias, and the raw-entry audit line.
- `sdk024QaHarness.test.ts` lost the pack-extras describe (13 tests) and its
  now-dead stub helpers; the export-check describe stays.
- Five mutations falsified: version pin, cleanup verb unrouted, sweep back to
  subject-match, second objective restored, extras alias back in the launcher
  — all red, restored, green.
- Full gates: typecheck clean, **1,786 tests / 88 files** green, `npm run
  build` clean. Manual stamps swept r209 → r210 and regenerated.

## For the tester (Zeis)

1. Run `qe24 extras cleanup` once with the current harness — it sweeps the
   widget and menu entries from the retired probes.
2. Replace the old editor export folder with the 1.0.36 one — the new export
   ships no extras, so nothing re-registers.
3. Then the desktop and start menu are clean; nothing QE24-shaped registers
   until the authoring round adds surfaces on purpose.
