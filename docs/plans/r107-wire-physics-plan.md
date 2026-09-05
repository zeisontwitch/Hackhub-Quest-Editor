# Wire physics — architecture proposal

**Status:** proposal. No production code written yet, per the brief.
**Roadmap 5:** "Pulling a wire makes it hang and bounce; past a distance it
pulls straight; releasing snaps it back before it disappears. Sag derived from
slack, ~200ms non-interactive ghost on delete, physics only on the held wire,
must honour the wire-motion toggle. **Must write inside the canvas, never the
document root** (see r42)."

---

## 1. Inspection: what is already here

| Thing | Where | Relevance |
|---|---|---|
| Edge rendering | `TypedEdge.tsx` — `getBezierPath`, curvature 0.28 | Static wires. **Not touching these.** |
| Drag-a-wire-loose | `QuestCanvas.ConnectionLine` (line ~696) + `detached` ref | The held wire. This is the one that gets physics. |
| Animation discipline | `wireMotion.ts` | Already solves this problem once — read below. |
| Drag lifecycle | `onNodeDragStart/Drag/DragStop` | Node drags, *not* wire drags. |
| Motion toggle | `wireMotionEnabled()` / `subscribeWireMotion` | Physics must obey it. |

**`wireMotion.ts` is the precedent that matters.** Its header documents four
attempts, and the project has already paid for the two wrong ones:

- **r38** wrote a custom property to `document.documentElement` every frame → an
  *idle* editor spent 40.8% of frame time in style recalculation.
- **r42/r43** scoped it to the canvas → still 29%, because the property has to
  *inherit*, and re-inheriting invalidates every descendant 60×/second.
- **r44 (current)** gives each dot layer its own `Element.animate` on
  `stroke-dashoffset`. Nothing inherits. An idle editor does no work at all.

The brief's constraints and that history agree exactly. I am going to follow
the r44 shape rather than invent a new one.

### The scope decision that makes this safe

The roadmap says **"physics only on the held wire"** — one wire, the one
currently being dragged off a socket. Not all wires, not wires on node drags.

That single constraint eliminates most of the risk in the brief:

- There is exactly **one** animated path at a time, so "only simulate visible
  wires" is trivially satisfied — viewport culling is unnecessary for a set of
  size ≤ 1.
- Stationary wires stay exactly as they are: plain `getBezierPath`, no
  simulation, no change to `TypedEdge`.
- The loop cannot outlive a drag, because a drag has an unambiguous end.

I want to flag this explicitly because the brief is written for the general
case (multi-wire dragging, frustum culling, batch deletion). Those are the
right worries for a full physics layer over every edge. **I am not proposing
that**, and if Zeis wants the broader version the trade-offs are different —
see §6.

---

## 2. Math strategy

**Chosen: damped spring on a single control-point offset, rendered as a cubic
Bézier.** Not Verlet, not a true catenary.

### Why

The visible behaviour required is: *hangs, bounces, pulls straight past a
distance, snaps back on release*. That is one degree of freedom — how far the
middle of the wire lags behind where a straight wire would be.

- **Verlet with N particles** simulates a rope. It would look lovely and is
  ~40 lines, but it needs N points integrated per frame, tuned constraint
  iterations to avoid stretching, and it can go unstable at low frame rates.
  For a curve whose ends are always pinned to a socket and a cursor, the extra
  freedom buys almost nothing visible.
- **A true catenary** (`a·cosh(x/a)`) needs a numeric solve for `a` each frame
  and degenerates when the ends are level or the span exceeds the rope length —
  exactly the "pulls straight" case, where it is at its worst.
- **A damped spring on one scalar** gives the bounce for free (that *is* what a
  spring does), is unconditionally stable with a semi-implicit Euler step and
  sane constants, and costs about six multiplies per frame.

### The model

```
rest        = how far the wire would sag with no motion, from slack (§below)
target      = rest, pulled toward 0 as the span approaches PULL_TAUT_DISTANCE
sag        += velocity · dt
velocity   += (STIFFNESS · (target − sag) − DAMPING · velocity) · dt
```

Sag displaces the two Bézier control points downward in flow space. At
`sag = 0` the path is byte-identical to today's `getBezierPath`, which means
**the resting appearance does not change**.

Slack: `slack = max(0, 1 − span / PULL_TAUT_DISTANCE)`, so a short drag hangs
and a long one straightens — "sag derived from slack", as specified.

Numbers are a starting point, tuned in the preview with Zeis:
`STIFFNESS 180`, `DAMPING 18` (slightly under-damped, so it bounces once or
twice), `MAX_SAG 90px`, `PULL_TAUT_DISTANCE 520px`.

`dt` is clamped to 32ms. A background tab that returns after 5 seconds must not
integrate a 5-second step and fling the wire off screen.

---

## 3. Isolating it from React

Three rules, matching the brief:

**1. The physics owns a DOM node, not a state variable.**
A module (`wirePhysics.ts`) holds the sag/velocity, runs one
`requestAnimationFrame` loop, and writes `path.setAttribute("d", …)` directly.
No `useState`, no store write, no re-render. React renders the `<path>` element
once when the drag starts and once more when it ends.

**2. The loop is owned by the module, not a component.**
`startWirePhysics(...)` returns a `stop()` function. The React side calls
`start` on drag begin and `stop` on drag end — the same shape as
`registerWireDots`, which has survived since r44.

**3. Coordinates come in by callback, not by prop.**
The cursor moves ~60×/second. Passing it through props would re-render.
`ConnectionLine` already receives `toX/toY` from React Flow on every move —
instead of using them to build a path, I write them into a ref the loop reads.
That is the one line that keeps this off the React path entirely.

### Files

| File | Contents | Tested |
|---|---|---|
| `wirePhysics.ts` | `stepSag()` — pure integrator. `sagPath()` — pure path builder. `startWirePhysics()` — the rAF loop. | pure parts: unit; loop: lifecycle |
| `TypedEdge.tsx` | **unchanged** | existing tests stay green |
| `QuestCanvas.tsx` | `ConnectionLine` feeds the ref, starts/stops the loop | mounted |
| `wireMotion.ts` | **unchanged** — physics reads `wireMotionEnabled()` | existing tests stay green |

The pure functions are where the behaviour lives, which is what makes this
testable in jsdom without pretending jsdom can animate.

---

## 4. Edge cases and failure modes

Ten, with mitigations. Several are drawn from bugs this canvas has actually
shipped.

**E1 — rAF loop leaks past the drag.**
The single worst outcome: a loop running forever, pinning a core.
*Mitigation:* one module-level frame id; `start()` cancels any existing loop
before beginning. `stop()` cancels and nulls it. The loop also self-terminates
when it has settled (§E2). A test asserts no frame is pending after stop, and
`canvasPerformance.test.tsx` already fails the build on an idle rAF loop.

**E2 — the loop runs forever at rest.**
Even during a drag, once the wire has settled the maths is doing nothing.
*Mitigation:* when `|sag − target| < 0.05` and `|velocity| < 0.05`, snap to
target, paint once, and stop the loop. Any subsequent pointer move restarts it.
This is what makes a stationary held wire cost literally zero.

**E3 — pan/zoom transform.**
Getting this wrong means the wire detaches from the cursor at any zoom ≠ 1.
*Mitigation:* work entirely in **flow coordinates**. `ConnectionLine` receives
`fromX/fromY/toX/toY` already in flow space, and the SVG we draw into is inside
React Flow's transformed viewport group. No `screenToFlowPosition`, no matrix
maths, no `getBoundingClientRect`. Sag is added in the same space, so zoom is
handled by the browser's transform, for free.

**E4 — the node is deleted mid-drag.**
*Mitigation:* the loop reads coordinates from a ref written by the React side;
if the drag ends for any reason, `stop()` runs from the same `useEffect`
cleanup that owns `start()`. The loop never dereferences a node.

**E5 — release: snap back before disappearing.**
Specified in the roadmap. A wire that vanishes mid-stretch looks broken.
*Mitigation:* on release, React Flow unmounts the connection line immediately.
So the "snap back" is a separate ~200ms **ghost**: a non-interactive path,
`pointer-events: none`, animating sag → 0 and opacity → 0, then removing
itself. Same mechanism as the delete ghost the roadmap asks for, so one
implementation serves both.

**E6 — the author does not want physics.**
Added at Zeis's request mid-build, and the right call: some machines will not
enjoy this, and some people simply prefer plain wires.
*Mitigation:* a **Springy wires / Plain wires** toggle in the canvas toolbar,
beside the animation one, following the same `snapGrid`/`wireMotion` shape — a
module-level value in localStorage, never in the project document. Physics is
gated on three switches, any of which stops it: this toggle, the wire-motion
master switch, and the OS reduced-motion preference. When any is off,
`startWirePhysics` paints the straight path once and never starts a loop, so
the editor does no per-frame work at all. Tested, including that the two
toggles are independent.

**E7 — reduced-motion preference.**
Not in the brief, but the toggle exists precisely because motion is not always
wanted, and an OS-level preference deserves the same respect.
*Mitigation:* treat `prefers-reduced-motion: reduce` as motion-off.
`window.matchMedia` is already stubbed in `vitest.setup.ts`.

**E8 — multiple drags at once (touch).**
Two fingers, two wires. The module holds one loop.
*Mitigation:* React Flow itself supports only one connection at a time
(`isPrimary` checks in its pointer handlers), so a second is not reachable.
`start()` being idempotent means even if it were, the second drag would take
over rather than leak the first. Noted as a real limitation rather than
silently assumed away.

**E9 — jsdom cannot animate.**
The trap that cost four rounds on node alignment.
*Mitigation:* every claim I test is about a **pure function** or an **observed
DOM attribute after a manual tick**. The loop exposes a `tickForTests(ms)` seam
so a test can advance it deterministically instead of waiting on rAF. Anything
I cannot honestly assert — that it *looks* springy, that the bounce feels right
— goes to Zeis in the preview, stated plainly, not wrapped in a green test.

**E10 — the r42 regression: writing outside the canvas.**
Called out explicitly in the roadmap.
*Mitigation:* the only DOM write is `setAttribute("d", …)` on a `<path>` that
lives inside React Flow's SVG. No custom properties, no `document.documentElement`,
nothing inherited. `canvasPerformance.test.tsx` already asserts no `--qe-*`
property reaches the document root, and that test stays.

---

## 5. Implementation plan

1. `wirePhysics.ts`: `stepSag()` and `sagPath()`, pure. Unit tests including
   stability under a huge `dt`, settling, and `sag = 0` reproducing the current
   path exactly.
2. The rAF loop with `start`/`stop`/`tickForTests`. Lifecycle tests: no frame
   pending after stop, no loop when motion is off, self-termination on settle.
3. Wire into `ConnectionLine`: ref for the cursor, `start` on mount, `stop` on
   unmount.
4. The release ghost (E5), reused for edge deletion.
5. Falsification pass — revert each guard, confirm the matching test fails.
6. Full suite, typecheck, build, performance guards.
7. Hand to Zeis for the feel: stiffness, damping, sag limit, taut distance.

## 5a. Review notes (second opinion, evaluated)

Three points came back from a review. Two are already covered by the narrow
scope; one is a real improvement and is in.

**"Add `pointer-events: none` to the physics wire."** *Already true, and worth
keeping true.* The held wire is React Flow's `connectionLineComponent`, which
is not interactive — the author is mid-drag, and the pointer belongs to the
drag. The delete ghost is the one that genuinely needs the guard, since it
outlives the gesture; it is created with `pointer-events: none` for exactly the
reason given. No change to `TypedEdge`, whose 26px interaction band is how a
resting wire is selected and must stay.

**"Mutate typed arrays rather than allocating point objects per frame."**
*Does not apply at this scope.* That advice is for a Verlet rope with 10–15
particles per wire. A damped spring on one scalar has no point array to pool:
the state is two numbers on a reused object, and `stepSag` mutates it in place
(there is a test asserting it returns the same object). The one allocation per
frame is the path string, which `setAttribute` requires and no buffer strategy
avoids. Adding a `Float32Array` here would be ceremony without a saving.

**"Viewport-cull off-screen wires."** *Trivially satisfied, not ignored.* Only
the held wire is simulated, so the animated set is at most one and it is by
definition under the pointer. Culling logic would be dead code. This does
become essential the moment physics is applied to resting wires — recorded in
§6 as the first thing to build if that scope ever changes.

## 6. What I am deliberately not doing

- **No physics on resting wires or during node drags.** The roadmap says held
  wire only. Simulating every edge is the version that needs culling, batching
  and a lot more risk, for motion nobody asked for.
- **No Verlet rope.** §2. Happy to revisit if the spring looks too clean.
- **No canvas layer.** A second rendering surface would have to re-implement
  hit-testing, selection and the dot animation. One `<path>` attribute per
  frame is already cheap.

## 7. Audit of this plan

Re-reading it against the brief before writing code:

- *Zero state-update render loops* — met: direct `setAttribute`, §3.
- *Decouple physics from React lifecycle* — met: module-owned loop, coordinates
  by ref, §3.
- *Spatial isolation* — met trivially: at most one animated wire, §1.
- *Memory leaks / listener protection* — met: single frame id, cleanup owns
  stop, self-termination, E1/E2.

**Weakest points, honestly:**

1. **The `tickForTests` seam is a compromise.** It means tests exercise the
   integrator through a door real users never open. I judge that better than
   either untested physics or a fake-timer test that asserts jsdom's rAF
   behaviour rather than ours — but it is a compromise, and worth naming.
2. **Constants are guesses until Zeis feels them.** Stiffness and damping are
   the whole aesthetic. I will not claim they are right from a test.
3. **The ghost adds a second lifetime to manage.** It outlives the drag by
   design, which is exactly the shape that leaks. It gets its own removal
   timer, cancelled on unmount, and its own test.

No blocking concerns. Proceeding to step 1 unless Zeis redirects.
