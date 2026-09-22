QE24 Feed Canary 1.0.2 (r222) - THE AUTHOR TEST

Identical to the 1.0.1 canary that RENDERED - same manifest shape, same
bare post - except the manifest author is now "Zeis", the author string on
every editor export that never rendered.

Install (replace the qe24-feedcanary folder), restart, open Hackhub:
  HC2 PRESENT  -> the author string is innocent; the difference lives in the
                  editor's compiled mod itself.
  HC2 ABSENT   -> the author string is the discriminator. Bizarre, proven,
                  and immediately actionable (the editor changes its default
                  author, and Zeis's exports render again).

Same session, if you have time: author a fresh post in the r221 editor
(fresh quest name + id), export, install - that is v4, the end-to-end retest.
