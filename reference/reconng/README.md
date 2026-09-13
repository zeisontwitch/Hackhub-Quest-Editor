# Recon-NG example pack — FENCED, read this first

This folder describes **Recon-NG**, a real tool mod by **Darkvalnar**, so the
Quest Editor has a genuine second pack to design its tool-pack surfaces
against. It is an **example only**:

- **We do not service this.** If Recon-NG changes, breaks, or vanishes, this
  folder quietly ages. Nothing in the editor depends on it.
- **Nothing here is imported by `src/` or shipped in any export.** The only
  readers are the pack's own tests (via the filesystem, like the starter
  pack) and humans. No editor code path touches this folder.
- **No third-party code is vendored.** `toolpack.json` is *our description*
  of their mod — pure data in our own format — written from their docs and
  source at the pinned commit below. Their code stays theirs.

Source:

- GitHub: <https://github.com/Darkvalnar/hackhub-reconng>
- Docs: <https://darkvalnar.github.io/hackhub-reconng/>
- Pinned at commit `798f9ee` (2026-09-10). Re-verify against source before
  re-pinning — the mod's docs page already disagrees with its code in four
  places (see `NOTES.md`).

Naming: explicit by Zeis's call (r149) with the author's permission. If that
ever needs reverting, rename this folder and strip the name from the three
files — nothing else references it.

## Files

| File | What it is |
|---|---|
| `toolpack.json` | The authored pack: 9 events, 3 data shapes, 2 story nodes, the real target conventions. Load it through Tools → Tool packs to see every pack surface driven by a real mod. |
| `NOTES.md` | The verification record: what was checked against which file+line, the docs-vs-source diffs, and what was deliberately left out with the reason. |
