# Database Schema --- Netflix AI Watch Spaces

## 1. Database

Selected persistence layer: **PostgreSQL**.

The relational model is based on the project specification and uses
normalized timeline events so timestamp-range queries can be indexed
efficiently.

## 2. Core Entities

``` text
User
Title
TimelineEvent
VariationOption
WatchSpace
WatchSpaceParticipant
ChatMessage
Interaction
```

## 3. Entity Relationships

``` text
User
 │
 ├───────────────┐
 │               │
 ▼               ▼
WatchSpace    Interaction
 │               │
 ├── Participant │
 │               │
 ├── Chat        ▼
 │             Title
 ▼               │
Title            ▼
 │          TimelineEvent
 └───────────────┐
                 ▼
          VariationOption
```

## 4. users

``` text
id              UUID / PK
email           VARCHAR UNIQUE
password_hash   VARCHAR
display_name    VARCHAR
role            ENUM(viewer, host, admin)
subtitle_locale VARCHAR
created_at      TIMESTAMP
```

## 5. titles

``` text
id                UUID / PK
name              VARCHAR
duration_seconds  INTEGER
video_asset_url   VARCHAR
created_at        TIMESTAMP
```

## 6. timeline_events

``` text
id            UUID / PK
title_id      UUID / FK
ts_seconds    INTEGER
event_type    VARCHAR
payload       JSONB
created_at    TIMESTAMP
```

Supported event types:

``` text
trivia
character
variation_point
glossary
```

A timestamp-range index should support queries equivalent to:

``` text
all events for title X between timestamp A and timestamp B
```

## 7. variation_options

``` text
id                 UUID / PK
timeline_event_id  UUID / FK
label              VARCHAR
asset_ref          VARCHAR
vote_count         INTEGER
```

## 8. watch_spaces

``` text
id                 UUID / PK
title_id           UUID / FK
host_user_id       UUID / FK
status             ENUM(scheduled, live, ended)
max_participants   INTEGER
ai_verbosity       VARCHAR
voting_enabled     BOOLEAN
created_at         TIMESTAMP
ended_at           TIMESTAMP
```

## 9. watch_space_participants

``` text
watch_space_id UUID / FK
user_id        UUID / FK
joined_at      TIMESTAMP
left_at        TIMESTAMP

PRIMARY KEY (watch_space_id, user_id)
```

## 10. chat_messages

``` text
id              UUID / PK
watch_space_id  UUID / FK
user_id         UUID / FK NULL
msg_type        VARCHAR
body            TEXT
ts_seconds      DECIMAL
created_at      TIMESTAMP
```

Message types:

``` text
chat
ai_answer
system
```

## 11. interactions

``` text
id              UUID / PK
user_id         UUID / FK
title_id        UUID / FK
watched_seconds INTEGER
completed       BOOLEAN
rating          SMALLINT
created_at      TIMESTAMP
```

Interaction data feeds the recommendation engine.

## 12. Indexing Priorities

Recommended indexes:

``` text
users(email)
timeline_events(title_id, ts_seconds)
watch_spaces(title_id, status)
watch_space_participants(watch_space_id)
chat_messages(watch_space_id, created_at)
interactions(user_id, title_id)
```

## 13. Data Rules

-   Foreign keys must be enforced.
-   Email must be unique.
-   Timeline events belong to a title.
-   Variation options belong to variation-point timeline events.
-   Only authorized roles may create/update administrative metadata.
-   Playback heartbeats are not persisted individually.
-   Session summaries are persisted after session completion.
