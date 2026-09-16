# r168 — phone `onEnd` completion freeze probe

Date: 2026-09-16

## Why this exists

A previous HackHub build could freeze when a quest finished from a phone-call
line's `onEnd` callback. The editor cannot currently reproduce that exact path
from a canvas node, because phone call end is **not** an SDK event. `onEnd` is a
callback on `QuestDialogSpeech`; it does not appear in `ModEventMap`.

The SDK 0.24 event catalogue does contain chat events:

- `Kisscord.FriendAdded`
- `Kisscord.Messaging`
- `WeeChat.Connected`
- `WeeChat.Disconnected`
- `WeeChat.Message`
- all `Mail.*` events

There is no `Phone.*`, `Dialog.*`, or `Quest.Dialog.*` event in the pinned
`@hotbunny/hackhub-content-sdk@0.24.0` declarations or in
`reference/hackhub-events.json`.

## What was added

`reference/sdk-0.24-qa/mod` is bumped to harness version `1.0.6` and now includes
two explicit raw SDK probes:

1. `QE24PhoneOnEndAutoCompleteProbe`
   - claim: `qe24 claim phone-auto`
   - run: `qe24 phone-auto`
   - final phone line has `isEnd: true` and an `onEnd` callback;
   - callback calls `completeObjective("phone-ended")`;
   - quest has `AutoComplete = true`, so the game should finish the quest.

2. `QE24PhoneOnEndDirectCompleteProbe`
   - claim: `qe24 claim phone-direct`
   - run: `qe24 phone-direct`
   - final phone line has `isEnd: true` and an `onEnd` callback;
   - callback completes the visible objective and then calls `this.complete()`.

Both probes send an `OnComplete` mail if the completion path returns far enough.
A freeze, missing mail, duplicate reward, or stale active objective after reload
is evidence that the phone-completion path should stay fenced.

## How to test

Use a clean throwaway save and install `reference/sdk-0.24-qa/mod`.

```text
qe24 claim phone-auto
qe24 phone-auto
# let the call reach its last line and hang up
# expected: objective completes, quest completes, OnComplete mail arrives, no freeze

qe24 claim phone-direct
qe24 phone-direct
# let the call reach its last line and hang up
# expected: objective completes, quest completes, OnComplete mail arrives, no freeze
```

After each probe, save and reload once. The completed quest should not reappear
as active, and the one-credit reward/mail should not duplicate.

## Editor implication

Do **not** add a fake phone event to the When-event picker. If these probes pass,
the right editor design is a phone-call completion output/callback model on the
Dialogue node, not a global `Phone.CallEnded` event the SDK does not declare.
