# Architecture --- Netflix AI Watch Spaces

## 1. Architecture Goal

The system is organized as five cooperating layers:

1.  React client
2.  Application API layer
3.  Real-time synchronization and event gateway
4.  AI Content Engine
5.  Persistence layer

This separation keeps real-time room state, API operations, AI
retrieval, and persistence logically distinct.

## 2. High-Level Architecture

``` text
┌──────────────────────────────────────────────────────────────┐
│                         React SPA                            │
│                                                              │
│ Video Player │ Watch Room │ Chat │ Presence │ AI Co-Pilot   │
│ Dashboard │ Recommendations                                  │
└───────────────┬──────────────────────────┬───────────────────┘
                │ REST/HTTPS               │ WebSocket
                ▼                          ▼
┌──────────────────────────────┐  ┌────────────────────────────┐
│       Spring Boot API        │  │ Spring WebFlux Gateway     │
│                              │  │                            │
│ Auth / Users / Catalog       │  │ Room State Machine         │
│ Watch Spaces                 │  │ Playback Broadcast         │
│ Recommendations / Analytics  │  │ Chat / Presence            │
└──────────────┬───────────────┘  └──────────────┬─────────────┘
               │                                 │
               └────────────────┬────────────────┘
                                ▼
                    ┌────────────────────────┐
                    │    AI Content Engine   │
                    │                        │
                    │ Timeline Ingestion     │
                    │ Context Retrieval      │
                    │ Grounded Q&A           │
                    │ Trivia Scheduler       │
                    │ Variation Evaluation   │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │       PostgreSQL       │
                    │                        │
                    │ Users / Titles         │
                    │ Timeline Events        │
                    │ Watch Spaces           │
                    │ Participants           │
                    │ Chat / Interactions    │
                    └────────────────────────┘
```

## 3. Frontend

The React client contains:

-   HTML5/custom synchronized video player
-   Watch Room
-   Chat
-   Presence
-   AI Co-Pilot panel
-   Trivia cards
-   Variation voting UI
-   Personal dashboard
-   Recommendation rail
-   Admin metadata upload interface

## 4. Application API

Spring Boot handles:

-   Authentication
-   User management
-   Title/catalog data
-   Watch Space lifecycle
-   Recommendations
-   Analytics
-   Timeline metadata management
-   Authorization

## 5. Real-Time Gateway

Spring WebFlux reactive WebSockets provide a single namespaced socket
connection per Watch Space.

The Host's playback actions are authoritative. Participant clients
receive playback updates and periodically report local playback position
for drift measurement and correction.

The real-time layer must not persist every playback heartbeat.
Authoritative playback position remains in room memory, while coarse
session summaries are persisted when a session ends.

## 6. Watch Space State

A Watch Space maintains:

``` text
watchSpaceId
titleId
hostUserId
status
currentPlaybackState
currentPosition
lastStateChange
participants
settings
```

Playback states:

``` text
PLAYING
PAUSED
SEEKING
BUFFERING
```

## 7. Playback Synchronization

The Host issues:

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

Clients calculate their drift relative to the authoritative room clock
and apply gentle micro-seek corrections instead of repeated hard seeks.

## 8. AI Content Engine

The AI engine reads a per-title timeline containing:

-   Scene markers
-   Character appearances
-   Trivia
-   Glossary terms
-   Variation points

The engine retrieves metadata around the current timestamp and uses it
to ground AI answers.

The AI must not invent content that is absent from the ingested metadata
for the title.

## 9. Security Architecture

-   JWT-based authentication
-   Short-lived access tokens
-   Refresh-token flow
-   Server-side RBAC
-   WebSocket handshake authentication
-   Host-only playback events
-   Admin-only metadata management
-   Server-side input validation and sanitization
-   Environment variables for secrets

Roles:

``` text
viewer
host
admin
```

## 10. Reliability

The system provides:

-   Reconnect handling
-   Session resynchronization
-   Deterministic host-disconnect behavior
-   Health endpoints
-   Structured logs
-   Correlation IDs per Watch Space session
