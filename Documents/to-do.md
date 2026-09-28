# Future Roadmap & Action Items --- Netflix AI Watch Spaces (to-do.md)

This document tracks upcoming architectural enhancements, scalability tasks, feature extensions, and performance hardening goals for subsequent iterations.

---

## 1. Recently Completed in Hardening & Reliability (Phases 1 & 2)

- [x] **Role Escalation Elimination**: Public registration strictly forces `VIEWER` role; unit test verified (`AuthServiceTest`).
- [x] **CORS & WebSocket Whitelisting**: Strict origin controls via `app.cors.allowed-origins`.
- [x] **Automatic Token Refresh Interceptor**: Transparent 401 retry with refresh token rotation and `auth:expired` event.
- [x] **WebSocket Auto-Reconnect**: Exponential backoff reconnection with session resync.
- [x] **Chat History Replay**: Top 50 messages replayed on room join in chronological order.
- [x] **Presence & Live Roster Updates**: Real-time `room.presence.update` handling.
- [x] **Watch Telemetry Ingestion**: Automated `api.recordInteraction()` on WatchRoom exit/unmount feeding recommendation engine.
- [x] **Personal Vault "My Spaces"**: `GET /api/v1/watch-spaces/me` endpoint and UI integration in `MySpacesHub`.
- [x] **Dead Code Removal**: Obsolete `LoginModal.tsx` removed.

---

## 2. Immediate Priorities (Phases 3 & 4)

### Core User & Social Features
- [x] **User Profile & Settings View**:
  - Implement full profile view/drawer to inspect and update `displayName`, `subtitleLocale`, and password.
  - Wire Navbar Profile and Settings buttons (currently passive triggers).
- [x] **Typing Indicators in Chat**:
  - Broadcast `room.chat.typing` event with auto-decay (3s) to show active typers in the theater sidebar.
- [x] **Host Theater Moderation Controls**:
  - Host actions: mute user chat, kick participant, lock room to prevent new entries, and transfer host badge.

### Data Integrity & Optimization
- [ ] **Persist Variation Vote Counts to Database**:
  - Persist final tallies to `variation_options.vote_count` in PostgreSQL upon vote conclusion.
- [ ] **Eliminate N+1 Queries in `WatchSpaceService`**:
  - Optimize `mapToDto` with batch fetching or JPA entity graph/join fetch for active participants when listing spaces.
- [ ] **Replace `@Data` on JPA Entities**:
  - Migrate entities from Lombok `@Data` to `@Getter`, `@Setter`, and safe `@ToString(exclude = ...)` to prevent Hibernate lazy loading circularity in sets.
- [ ] **Flyway Database Migration Scripts**:
  - Introduce Flyway to version-control schema changes, transitioning away from Hibernate `ddl-auto: update`.

---

## 3. Platform Architecture & Usability (Phase 5)

- [ ] **React Router Integration**:
  - Migrate from state-based `activeTab` to `react-router-dom` for deep URL linking (`/spaces/:id`, `/titles/:id`, `/discover`, `/admin`) and browser history (back/forward).
- [ ] **Health & Observability**:
  - Expose Spring Boot Actuator `/actuator/health` and `/actuator/metrics`.
  - Add structured logging with MDC correlation IDs across HTTP requests and WebSocket sessions.
- [ ] **PostCSS Tailwind Build**:
  - Replace CDN-loaded Tailwind script with build-time PostCSS pipeline for full CSS tree-shaking.

---

## 4. High-Scale Distributed Architecture

- [ ] **Multi-Instance WebSocket Clustering**:
  - Replace in-memory `RoomSessionManager` with a **Redis Pub/Sub** or **RabbitMQ / Apache Kafka** message broker.
  - Enable seamless WebSocket session fan-out across multiple Spring Boot container instances.
  - Implement Redis-backed distributed room state and ephemeral participant counters.
- [ ] **Adaptive Bitrate Streaming (ABR)**:
  - Migrate HTML5 MP4 player to **HLS / DASH** streaming using **Video.js** or **Shaka Player**.
  - Support automatic stream quality switching based on client network bandwidth.
  - Implement seamless audio track and multi-lingual subtitle track switching during live playback.
- [ ] **Object Storage & CDN**:
  - Connect **AWS S3 / Cloudflare R2** with Cloudflare Stream / AWS CloudFront for global edge caching of video assets and thumbnails.
  - Support pre-signed URLs for administrative video uploads.

## 5. Advanced AI & Real-Time Intelligence

- [ ] **External LLM Integration (Gemini 2.0 / Vertex AI)**:
  - Connect Google Cloud Vertex AI / Gemini API to synthesize conversational, natural phrasing while strictly enforcing timeline context grounding.
  - Add fallback guardrails to prevent hallucinations outside authored metadata.
- [ ] **Semantic Vector Search with `pgvector`**:
  - Enable `pgvector` extension in the Neon PostgreSQL database.
  - Compute text embeddings (e.g., `text-embedding-004`) for scene descriptions, trivia, character lore, and glossary definitions.
  - Perform cosine-similarity retrieval for nuanced user queries at timestamp $T$.
- [ ] **Voice-Activated AI Co-Pilot**:
  - Integrate Web Speech API for voice-to-text in-room questions (e.g., *"Hey Netflix, who is that?"*).
  - Add text-to-speech option for the AI Co-Pilot to whisper scene trivia into viewers' headphones without disturbing video audio.

---

## 6. Social Co-Presence & Real-Time Audio

- [ ] **WebRTC Live Voice Chat**:
  - Integrate a WebRTC SFU (e.g., **LiveKit** or **mediasoup**) to support low-latency spatial audio between room members.
  - Add Push-to-Talk and noise suppression controls.
  - Auto-duck voice chat volume during high-dialogue movie scenes.
- [ ] **Social Graph & Scheduling**:
  - Add Friends list, Presence status (*"Watching Cyberpunk 2099 in Room NX-DEMO"*), and direct invites.
  - Scheduled Watch Spaces with Google Calendar and Apple Calendar `.ics` invite exports.
  - Automated push notifications or email reminders 15 minutes before scheduled room start.

---

## 7. Advanced Narrative Personalization & Voting

- [ ] **Complex Multi-Branch Story Trees**:
  - Expand variation points from binary options to full decision trees with branch history tracking.
  - Dynamically load and stitch alternate video segments based on majority vote outcomes.
- [ ] **Audience Prediction Minigames**:
  - Live prediction cards (e.g., *"Will Detective Rios survive the next 5 minutes?"*).
  - Point leaderboard and viewer badges based on trivia accuracy and predictions.

---

## 8. Security, Hardening & Load Testing

- [ ] **API Rate Limiting & Abuse Prevention**:
  - Configure **Bucket4j** / Redis token bucket rate limiting on `/api/v1/watch-spaces/*/ai/ask` (e.g., max 10 queries per minute per user).
  - Add chat message spam filtering and profanity moderation.
- [ ] **Load & Stress Testing**:
  - Develop **Artillery / Locust** test scripts simulating 500 concurrent WebSocket clients in a single room performing synchronized playback, chatting, and voting.
  - Measure fan-out latency and verify sync drift remains $< 250\text{ms}$ under load.
- [ ] **End-to-End Browser Automation**:
  - Write multi-browser Playwright test suite validating two real browser sessions synchronizing play/pause states in real time.
