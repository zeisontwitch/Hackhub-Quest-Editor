QE24 Feed Canary 1.0.1 (r220)

Install BOTH mods this session:
  - qe-sdk-0.24-qa 1.0.28 (the harness grid, HF1..HF10)
  - qe24-feedcanary 1.0.1 (this folder - one bare post, HC1)

Then: restart, open Hackhub, and note which of HF1..HF10 AND HC1 are present.

The canary has the exact manifest an editor export has (apiVersion 1,
permissions mail+events). Reading:
  HC1 present  -> a two-permission mod can surface posts; the editor's
                  compiled runtime is the remaining suspect.
  HC1 absent (grid present) -> the manifest shape kills quest posts; that
                  goes to the developers with this zip as proof.
