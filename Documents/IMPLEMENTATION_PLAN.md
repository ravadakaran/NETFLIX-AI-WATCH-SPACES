# Implementation Plan --- Netflix AI Watch Spaces

## Phase 0 --- Project Setup

### Tasks

-   Create Git repository
-   Create backend/frontend directories
-   Initialize Spring Boot
-   Initialize React
-   Configure PostgreSQL
-   Configure environment variables
-   Add Docker Compose
-   Add `.gitignore`
-   Add README
-   Create CI/test baseline

### Deliverable

A clean project that starts from scratch using documented commands.

------------------------------------------------------------------------

# Week 1 --- Foundation

## Day 1

-   Repository scaffold
-   Spring Boot setup
-   React setup
-   PostgreSQL connection
-   Environment configuration

## Day 2

-   User entity
-   Registration
-   Login
-   Password hashing
-   JWT access token
-   Refresh token

## Day 3

-   Spring Security
-   RBAC
-   User roles
-   Protected REST endpoints

## Day 4

-   Title entity
-   TimelineEvent entity
-   Seed sample title
-   Seed timeline

## Day 5

-   WatchSpace entity
-   Participant entity
-   Create Watch Space
-   Invite code
-   Join Watch Space

## Day 6

-   React login/register
-   Title selection
-   Create room UI
-   Join room UI

## Day 7

-   Basic WebSocket
-   PLAY
-   PAUSE
-   Basic synchronization
-   Two-browser demo

### Week 1 Exit Criteria

``` text
Login
  ↓
Select Title
  ↓
Create Room
  ↓
Second Browser Joins
  ↓
Play/Pause Sync
```

------------------------------------------------------------------------

# Week 2 --- Real-Time + AI

## Day 8--9

-   Full playback state machine
-   SEEK
-   BUFFERING
-   Host authorization
-   Server room state

## Day 10

-   Drift measurement
-   Ping/pong
-   Client drift correction

## Day 11

-   Chat
-   Presence
-   Typing indicators
-   Reconnect handling

## Day 12

-   Timeline ingestion
-   Timeline validation
-   Timeline retrieval

## Day 13

-   AI retrieval logic
-   Grounded Q&A
-   Source event IDs

## Day 14

-   Trivia scheduler
-   AI panel
-   End-to-end AI demo

### Week 2 Exit Criteria

``` text
3+ Clients
   ↓
Synchronized Playback
   ↓
Chat + Presence
   ↓
Timeline Trivia
   ↓
Grounded AI Q&A
```

------------------------------------------------------------------------

# Week 3 --- Personalization

## Day 15

-   Subtitle/localization model
-   Variation assets
-   Variation swap

## Day 16

-   Voting model
-   Vote open event
-   Vote close
-   Winning variation

## Day 17

-   Interaction logging
-   Watch history

## Day 18

-   Content-based recommendation

## Day 19

-   Collaborative component
-   Hybrid ranking
-   Precision@5 evaluation

## Day 20

-   Dashboard
-   History
-   Recommendations
-   Session analytics

## Day 21

-   Admin metadata upload
-   Schema validation
-   Error handling

### Week 3 Exit Criteria

``` text
Variation Swap
Voting
Recommendations
Dashboard
Analytics
Admin Timeline Upload
```

------------------------------------------------------------------------

# Week 4 --- Hardening (Completed ✅)

## Day 22--23
- [x] Automated tests (AuthService, AiCopilot, Recommendation, Timeline)
- [x] Playback synchronization & drift verification
- [x] AI retrieval tests & schema validation
- [x] RBAC tests

## Day 24
- [x] Multi-client room simulation
- [x] WebSocket presence updates & live viewer sync

## Day 25
- [x] Performance measurements & drift verification (sub-250ms target met, 12ms observed)
- [x] API latency & AI latency benchmarking (477ms)

## Day 26
- [x] Security review & complete read-only audit
- [x] Input validation & registration role escalation fix
- [x] Secret protection & .gitignore verification
- [x] Strict CORS & WebSocket origin restriction

## Day 27
- [x] Documentation suite: ARCHITECTURE.md, REQUIREMENTS.md, DATABASE.md, API.md, done.md, to-do.md
- [x] Setup guide and environment configuration

## Day 28
- [x] Final end-to-end verification
- [x] Stitch Nocturne Luminary theme integration across 7 screens
- [x] Final repository cleanup & dead code removal

------------------------------------------------------------------------

# Post-Audit Hardening & Architectural Progression

## Stage A: Critical Security & Session Reliability (Completed ✅)
- [x] Role escalation elimination on registration (enforced `VIEWER`)
- [x] Whitelisted CORS and WebSocket origins (`app.cors.allowed-origins`)
- [x] Automatic 401 token refresh interceptor in `api.ts`
- [x] WebSocket auto-reconnect with exponential backoff in `websocket.ts`
- [x] Chat history replay on room join (top 50 messages)
- [x] Real-time presence roster & viewer count updates
- [x] Automatic watch session interaction telemetry recording
- [x] "My Spaces" backend endpoint and personal vault integration
- [x] Dead code cleanup (`LoginModal.tsx` removed)

## Stage B: Core Social & Administration Features (Next Up)
- [x] User profile & settings view (edit name, subtitle locale, password)
- [x] Typing indicators in chat (`room.chat.typing`)
- [x] Host theater moderation (mute, kick, transfer host, lock room)

## Stage C: Data Integrity & Performance Scaling
- [ ] Persist variation vote tallies to `variation_options.vote_count`
- [ ] Eliminate N+1 query patterns in `WatchSpaceService`
- [ ] Refactor Lombok `@Data` to `@Getter`/`@Setter` on JPA entities
- [ ] Flyway database migration scripts

## Stage D: Advanced Platform Infrastructure
- [ ] Client routing migration (`react-router-dom`)
- [ ] Spring Boot Actuator `/actuator/health` & structured MDC correlation IDs
- [ ] Distributed WebSocket clustering with Redis Pub/Sub
- [ ] Adaptive Bitrate Streaming (HLS / DASH)


------------------------------------------------------------------------

# Priority Rule

If implementation falls behind schedule:

1.  Preserve testing.
2.  Preserve documentation.
3.  Preserve core end-to-end functionality.
4.  Reduce the number of variation points.
5.  Keep the recommendation model simple.
6.  Do not remove authentication/RBAC.
7.  Do not remove synchronization testing.
