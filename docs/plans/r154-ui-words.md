# r154 — UI words batch: sticky move, Custom terminal, Addons (plan)

Queue items 4, 5, 7 in one round (all user-facing words, no behaviour):

1. Sticky note: `flow.note` category flow → layout. Registry order already
   puts it below Group frame (layout.group:1004 < flow.note:1112 <
   flow.beat:1128). Furniture set untouched.
2. "Player replies" → "Custom terminal" (sentence-case house style; the
   category holds exactly one node, reply.input Manual input — a custom
   terminal command). Prose "Player replies" in dialogue copy is about
   dialogue replies, NOT the category — untouched.
3. Tools → Addons: TopBar button + title, manager dialog, "tool pack" →
   "addon", "Tool pack node" → "Addon node", "tool mod" → "addon",
   "Community tools" → "Community addons" (palette, picker, reference
   sheet, export README line). Code identifiers, `toolpack.json` format,
   pack ids, CSS vars, and pack-author brand names ("Example Tools") stay.
   Docs history (HANDOFF past rounds, archive) stays verbatim; current docs
   updated. README roadmap items 4/5/7 marked done.
