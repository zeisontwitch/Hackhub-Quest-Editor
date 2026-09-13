# r153 — Warning severity: info / warn / error (plan)

Zeis: amber cards read as critical errors. Three levels: light-blue + info
icon (good to know), amber + ! (could cause issues), red (will break).

Design (cheap ripple): warn helpers gain levels; `computeWarningDetails()`
is the real aggregator; `computeWarnings()` stays `string[]` as a mapped
view so the ~60 existing string assertions stay green. `CompileResult` and
`SimReport` gain `warningDetails` alongside `warnings`.

Levels: error = unstartable quests, lynx-handle crash, orphans/strays/
loginless/bad-versions, dup paths/slash/hosts. warn = dead nodes (firewall,
handbook, wifi, unset pack nodes, unplaced files), domain collisions,
placeholder domains, live-dialogue caveats, all target-matching. info =
mail/phone FYIs, kisscord-upload note, pack-mods honesty line, unlisted
pages (often an intentional hiding place). Sim errors (threw/no dist) = error.

UI: WarningList takes details, per-level tint+icon; export heading turns
"Needs attention" (red) when any error is present.
