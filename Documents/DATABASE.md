# Database Schema — Netflix AI Watch Spaces

## 1. Source of truth

PostgreSQL is the persistence layer. The executable schema is versioned in
`backend/src/main/resources/db/migration`; this document describes the schema
after migrations V1–V6. Java mappings live in `entity/` and must be changed in
the same pull request as the corresponding Flyway migration.

`NarrativeDecision` is the persisted branch-history model, `NarrativeRound` is
the prediction/voting game model, and `NarrativeSubmission` stores answers and
awarded scores. These names are used consistently rather than maintaining
duplicate `BranchHistory` or `PredictionGame` tables.

## 2. Relationship map

```text
User ──< WatchSpace >── Title ──< TimelineEvent ──< VariationOption
 │          │                              │
 │          ├──< WatchSpaceParticipant    └──< NarrativeRound
 │          ├──< ChatMessage                    │
 │          ├──< NarrativeDecision               └──< NarrativeSubmission >── User
 │          └──< NarrativeRound
 ├──< Interaction >── Title
 ├──< ScheduledSpace >── Title
 └──<> User (user_friends)
```

## 3. Core catalog and identity

### `users`

`id UUID PK`, `email VARCHAR UNIQUE`, `password_hash VARCHAR`,
`display_name VARCHAR`, `role VARCHAR`, `subtitle_locale VARCHAR`,
`presence_status VARCHAR`, `created_at TIMESTAMP`.

`user_friends(user_id, friend_id)` is a directed join table with both columns
referencing `users.id` and a composite primary key.

### `titles`

`id UUID PK`, `name VARCHAR`, `description TEXT`, `genre VARCHAR`,
`duration_seconds INTEGER`, `video_asset_url VARCHAR`, `thumbnail_url VARCHAR`,
`created_at TIMESTAMP`.

### `timeline_events`

`id UUID PK`, `title_id UUID FK`, `ts_seconds INTEGER`, `event_type VARCHAR`,
`payload TEXT` (JSON document), `embedding vector(3072)`, `created_at TIMESTAMP`.

Supported interactive types include `variation_point`, `prediction`,
`prediction_point`, and `trivia_question`, in addition to informational
`trivia`, `character`, and `glossary` events. Prediction payloads define
`correctOptionId`; branch payloads may define `variationId` and
`parentVariationId`.

### `variation_options`

`id UUID PK`, `timeline_event_id UUID FK`, `option_key VARCHAR`, `label VARCHAR`,
`asset_ref VARCHAR`, `next_variation_id VARCHAR`, `segment_start_seconds INTEGER`,
`segment_end_seconds INTEGER`, `resume_seconds INTEGER`, `vote_count INTEGER`.

## 4. Watch spaces and activity

### `watch_spaces`

`id UUID PK`, `title_id UUID FK`, `host_user_id UUID FK`,
`invite_code VARCHAR UNIQUE`, `status VARCHAR`, `max_participants INTEGER`,
`ai_verbosity VARCHAR`, `voting_enabled BOOLEAN`, `playback_state VARCHAR`,
`position_seconds DOUBLE PRECISION`, `is_locked BOOLEAN`, `created_at TIMESTAMP`,
`ended_at TIMESTAMP`.

Narrative runtime columns are `narrative_version BIGINT`,
`narrative_base_resume_seconds DOUBLE PRECISION`,
`active_segment_decision_id UUID`, `active_segment_url TEXT`,
`active_segment_start_seconds INTEGER`, `active_segment_end_seconds INTEGER`,
`active_segment_resume_seconds INTEGER`, and `active_segment_started_at TIMESTAMP`.

### `watch_space_participants`

`watch_space_id UUID FK`, `user_id UUID FK`, `joined_at TIMESTAMP`,
`left_at TIMESTAMP`; composite primary key `(watch_space_id, user_id)`.

### `chat_messages`

`id UUID PK`, `watch_space_id UUID FK`, `user_id UUID FK NULL`,
`msg_type VARCHAR`, `body TEXT`, `ts_seconds DOUBLE PRECISION`,
`created_at TIMESTAMP`.

### `interactions`

`id UUID PK`, `user_id UUID FK`, `title_id UUID FK`,
`watched_seconds INTEGER`, `completed BOOLEAN`, `rating SMALLINT`,
`created_at TIMESTAMP`.

### `scheduled_spaces`

`id UUID PK`, `host_user_id UUID FK`, `title_id UUID FK`,
`scheduled_start_time TIMESTAMP WITH TIME ZONE`, `name VARCHAR`,
`created_at TIMESTAMP WITH TIME ZONE`, `watch_space_id UUID NULL`.

## 5. Narrative branching, predictions, and scoring

### `narrative_rounds`

One server-authoritative game per room and authored event:

`id UUID PK`, `watch_space_id UUID FK`, `event_id UUID FK`, `kind VARCHAR`,
`variation_id VARCHAR`, `prompt TEXT`, `opened_at TIMESTAMP WITH TIME ZONE`,
`closes_at TIMESTAMP WITH TIME ZONE`, `resolves_at TIMESTAMP WITH TIME ZONE`,
`status VARCHAR`, `correct_option_key VARCHAR NULL`,
`resolved_at TIMESTAMP WITH TIME ZONE NULL`.

Unique rule: `(watch_space_id, event_id)`. A round is `OPEN` or `RESOLVED`.

### `narrative_submissions`

`id UUID PK`, `round_id UUID FK`, `watch_space_id UUID FK`, `user_id UUID FK`,
`option_key VARCHAR`, `submitted_at TIMESTAMP WITH TIME ZONE`, `points INTEGER`,
`correct BOOLEAN`.

Unique rule: `(round_id, user_id)` guarantees one answer per viewer. Scores are
persisted at resolution, making leaderboard reads deterministic and idempotent.

### `narrative_decisions`

The immutable branch-history ledger:

`id UUID PK`, `watch_space_id UUID FK`, `round_id UUID FK`, `event_id UUID FK`,
`variation_id VARCHAR`, `prompt TEXT`, `option_key VARCHAR`, `label VARCHAR`,
`asset_ref TEXT`, `next_variation_id VARCHAR`, `votes_json TEXT`,
`sequence_number INTEGER`, `decided_at TIMESTAMP WITH TIME ZONE`.

Unique rule: `(watch_space_id, sequence_number)` preserves a single ordered
history even when multiple application instances serve the room.

## 6. Concurrency and indexing

Narrative mutations acquire a pessimistic row lock on the target `watch_spaces`
record. This serializes one room across JVMs while allowing unrelated rooms to
progress concurrently. Database uniqueness constraints remain the final guard
against duplicate rounds, submissions, and history sequence numbers.

Important indexes:

- `timeline_events(title_id, ts_seconds)`
- `watch_spaces(title_id, status)` and `watch_spaces(invite_code)`
- `chat_messages(watch_space_id, created_at)`
- `interactions(user_id, title_id)`
- `narrative_rounds(watch_space_id, status)`
- `narrative_submissions(watch_space_id, user_id)` and `(round_id)`
- `narrative_decisions(watch_space_id, sequence_number)` (unique)

Playback heartbeats remain ephemeral; authoritative playback snapshots and
narrative outcomes are persisted.
