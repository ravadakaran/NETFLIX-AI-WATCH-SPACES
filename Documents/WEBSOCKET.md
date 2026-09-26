# WebSocket Contract --- Netflix AI Watch Spaces

## 1. Connection

Each Watch Space uses one namespaced WebSocket connection.

Example:

``` text
/ws/watch-spaces/{watchSpaceId}
```

The WebSocket handshake must authenticate the user's JWT.

## 2. Event Envelope

All events use:

``` json
{
  "event": "<event.name>",
  "watchSpaceId": "ws_88231",
  "payload": {},
  "ts": 1690000000123
}
```

## 3. Playback

### room.playback.update

Host-only event.

``` json
{
  "event": "room.playback.update",
  "watchSpaceId": "ws_88231",
  "payload": {
    "state": "play",
    "positionSeconds": 332.4,
    "issuedBy": "u_501"
  },
  "ts": 1690000000123
}
```

States:

``` text
play
pause
seek
```

Only the current Host may issue playback updates.

## 4. Presence

### room.presence.update

``` json
{
  "event": "room.presence.update",
  "watchSpaceId": "ws_88231",
  "payload": {
    "participantId": "u_733",
    "action": "joined",
    "participantCount": 3
  },
  "ts": 1690000000123
}
```

Actions:

``` text
joined
left
```

## 5. Chat

### room.chat.message

``` json
{
  "event": "room.chat.message",
  "watchSpaceId": "ws_88231",
  "payload": {
    "messageId": "msg_1",
    "userId": "u_733",
    "body": "That scene was unexpected.",
    "tsSeconds": 332.4
  },
  "ts": 1690000000123
}
```

Messages must be validated and sanitized server-side.

## 6. AI Trivia

### room.ai.trivia

``` json
{
  "event": "room.ai.trivia",
  "watchSpaceId": "ws_88231",
  "payload": {
    "eventId": "evt_2291",
    "text": "This scene was filmed on location.",
    "tsSeconds": 812
  },
  "ts": 1690000000123
}
```

Trivia should appear within one second of crossing the authored marker
for at least 95% of test markers.

## 7. AI Answer

### room.ai.answer

``` json
{
  "event": "room.ai.answer",
  "watchSpaceId": "ws_88231",
  "payload": {
    "questionId": "q_123",
    "userId": "u_733",
    "answer": "The character is Detective Rios.",
    "sourceEvents": [
      "evt_2291"
    ]
  },
  "ts": 1690000000123
}
```

## 8. Variation Voting

### room.variation.voteOpen

``` json
{
  "event": "room.variation.voteOpen",
  "watchSpaceId": "ws_88231",
  "payload": {
    "variationId": "v_01",
    "options": [
      {
        "id": "a",
        "label": "Original line"
      },
      {
        "id": "b",
        "label": "Alternate localized line"
      }
    ],
    "closesAt": 1690000050000
  },
  "ts": 1690000000123
}
```

### room.variation.applied

``` json
{
  "event": "room.variation.applied",
  "watchSpaceId": "ws_88231",
  "payload": {
    "variationId": "v_01",
    "winningOptionId": "b"
  },
  "ts": 1690000050000
}
```

The selected variation must be applied identically and simultaneously to
all connected clients.

## 9. Synchronization

### room.sync.ping

``` json
{
  "event": "room.sync.ping",
  "watchSpaceId": "ws_88231",
  "payload": {
    "clientSentAt": 1690000000000
  },
  "ts": 1690000000000
}
```

### room.sync.pong

``` json
{
  "event": "room.sync.pong",
  "watchSpaceId": "ws_88231",
  "payload": {
    "clientSentAt": 1690000000000,
    "serverReceivedAt": 1690000000020
  },
  "ts": 1690000000021
}
```

These events support drift measurement and correction.

## 10. Reconnect

After reconnect:

1.  Authenticate again.
2.  Rejoin the Watch Space.
3.  Retrieve current authoritative room state.
4.  Retrieve recent chat history.
5.  Calculate playback drift.
6.  Correct local playback.
7.  Avoid duplicate join events.
