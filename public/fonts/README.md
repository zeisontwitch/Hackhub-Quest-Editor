# Self-hosted UI fonts

The optional fonts in Settings → Typography live here so the editor needs no
internet at runtime. Latin subsets only — the editor's UI is English.

| Family | Files | Licence |
|---|---|---|
| Atkinson Hyperlegible | 400, 700 | SIL OFL 1.1 — `LICENSE-AtkinsonHyperlegible.txt` |
| Lexend | 400, 500, 600, 700 | SIL OFL 1.1 — `LICENSE-Lexend.txt` |
| JetBrains Mono | 400, 500, 600, 700 | SIL OFL 1.1 — `LICENSE-JetBrainsMono.txt` |

All files are unmodified `woff2` copies from the Fontsource packages
(`@fontsource/atkinson-hyper-legible`, `@fontsource/lexend`,
`@fontsource/jetbrains-mono`), which repack the upstream releases verbatim.
To refresh or add a family: `npm install --no-save @fontsource/<family>`, copy
the `files/<family>-latin-<weight>-normal.woff2` you need plus its LICENSE
here, and declare the `@font-face` rules in `src/index.css`.
