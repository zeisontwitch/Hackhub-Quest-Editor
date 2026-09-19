# r171: inspector polish and phone-proxy investigation

## Requests

1. The orange **Worth checking** field warning tooltip was too transparent on
   hover. When it floated over the inspector/canvas, the text had to compete
   with whatever was underneath.
2. The docked inspector pull tab faced into the inspector. It should face and
   overlap the canvas instead.
3. xu reported that “phone proxies” may be possible: friends call each other,
   the player listens in, and the callers do not know they are being monitored.

## UI fixes

- Field-warning tooltips now use the editor's solid `bg-surface-2` panel colour
  with a stronger warn/danger border. The small warning icon can still be orange
  or red; the actual callout body is opaque and readable.
- The inspector's docked pull tab now sits outside the inspector edge, protrudes
  into the canvas, and uses the rounded left edge / flat right edge shape.
- Tests pin both affordances at the component level:
  - the **Worth checking** tooltip must not use the old translucent `bg-warn/10`
    surface;
  - the dock tab must face the canvas (`rounded-l-md`, `border-r-0`).

## Phone-proxy evidence checked

Pinned SDK: `@hotbunny/hackhub-content-sdk@0.24.0`.

What exists in the pinned declarations:

- Quest phone calls are `Quest.Dialog` trees (`QuestDialogSpeech[]`) started with
  `this.createDialog(branch, startIndex)`.
- A phone line can name any `speaker`, carry text/audio, branch through response
  options, and run `onEnd` / `onSelect` callbacks.
- Mods can register custom phone apps with `PhoneApp` / `RegisterPhoneApp`, and
  the app HTML gets the `HackhubSDK.Phone` bridge for title/back/alert/close.

What I did **not** find in the pinned declarations:

- No `Phone.*`, `Dialog.*`, `Call.*`, or eavesdrop/proxy event in `ModEventMap`.
- No SDK namespace or method that dials a third-party call, subscribes to a live
  phone call, intercepts another call, or exposes a phone-call recording stream.
- No phone-proxy-specific API in `PhoneApp`; phone apps are custom HTML UIs with
  navigation chrome, not a declared call-control surface.

Reference/docs checked:

- Official quest transcriptions show ordinary player-involved phone calls
  (`Annoying Neighbor`, `Cryptographer Hunt`) and one Whatsupp/Wireshark traffic
  monitoring beat in the Journalist's Sister line, but no declared “phone proxy”
  mechanic.
- The handbook's phone section covers phone UI/Netrun/suspicion/calls, again with
  no phone-proxy wording.
- The current public HotBunny quest and phone-app docs match the pinned SDK shape:
  phone dialogs and custom phone apps, but no call-proxy API.

## Current conclusion

Do not expose a “phone proxy” authoring node from the pinned SDK alone. There is
not yet a declared surface for it.

Two plausible story shapes are still worth testing in game:

1. **Narrative wiretap using existing Dialog calls.** Start a normal phone
   Dialogue where the speakers are two NPC names and the player has no response
   choices. This may be enough to *present* an intercepted call, even if the game
   mechanically treats it as a quest phone call to the player.
2. **Custom phone app simulation.** A `PhoneApp` could display a fake proxy app
   transcript/audio UI and emit a custom event when the player opens/listens.
   That would be an app/template feature, not evidence of a native phone-proxy
   call API.

## Next probe to ask xu for

Before implementation, ask for one of:

- the exact SDK call or class they used;
- a tiny working mod snippet;
- the game UI/action sequence that enables the listening-in behavior;
- whether it is a native phone mechanic, a custom phone app, or just a quest
  Dialogue framed as an intercepted call.

Once we have that, run a raw QA probe before adding any author-facing node.

## Validation

Completed before commit:

```text
npm run gen:manual
npx vitest run src/editor/inspector/__tests__/fieldWarningBadge.test.tsx src/editor/inspector/__tests__/floatingInspector.test.tsx
npm run typecheck
npm test  # 1,561 tests / 79 files
npm run build
```

Also run: `git diff --check`.

---

## Closed 2026-09-19 — the phone-proxy investigation is dropped

Zeis asked the modder who reported it (xu): the "phone proxy" they meant is a
**phone conversation between two NPCs, staged to look as if the player is
listening in** — a presentation trick, not a second call path. Nothing in the
SDK needed to be missing for it, and this document's own findings already said
so: quest calls are `Quest.Dialog` trees, a line may name **any** speaker, and
the player's participation is optional. The Dialogue node's call mode therefore
already authors the scene; the only thing untested is how the game frames it on
screen (a call to the player vs a scene the player watches), which is a one-run
check if a quest ever depends on the framing.

No SDK request follows from this. The roadmap row is removed and the editor keeps
its existing call authoring.
