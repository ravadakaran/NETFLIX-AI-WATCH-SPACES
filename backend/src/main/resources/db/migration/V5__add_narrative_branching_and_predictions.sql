-- Authored option metadata for decision-tree traversal and playable segments.
ALTER TABLE variation_options ADD COLUMN IF NOT EXISTS option_key VARCHAR(255);
ALTER TABLE variation_options ADD COLUMN IF NOT EXISTS next_variation_id VARCHAR(255);
ALTER TABLE variation_options ADD COLUMN IF NOT EXISTS segment_start_seconds INTEGER;
ALTER TABLE variation_options ADD COLUMN IF NOT EXISTS segment_end_seconds INTEGER;
ALTER TABLE variation_options ADD COLUMN IF NOT EXISTS resume_seconds INTEGER;
UPDATE variation_options SET option_key = id::text WHERE option_key IS NULL;
ALTER TABLE variation_options ALTER COLUMN option_key SET NOT NULL;

CREATE TABLE IF NOT EXISTS narrative_rounds (
    id UUID PRIMARY KEY,
    watch_space_id UUID NOT NULL REFERENCES watch_spaces(id),
    event_id UUID NOT NULL REFERENCES timeline_events(id),
    kind VARCHAR(64) NOT NULL,
    variation_id VARCHAR(255),
    prompt TEXT NOT NULL,
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL,
    closes_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolves_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) NOT NULL,
    correct_option_key VARCHAR(255),
    resolved_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_narrative_round_space_event UNIQUE (watch_space_id, event_id)
);

CREATE TABLE IF NOT EXISTS narrative_submissions (
    id UUID PRIMARY KEY,
    round_id UUID NOT NULL REFERENCES narrative_rounds(id),
    watch_space_id UUID NOT NULL REFERENCES watch_spaces(id),
    user_id UUID NOT NULL REFERENCES users(id),
    option_key VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    correct BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uk_narrative_submission_round_user UNIQUE (round_id, user_id)
);

CREATE TABLE IF NOT EXISTS narrative_decisions (
    id UUID PRIMARY KEY,
    watch_space_id UUID NOT NULL REFERENCES watch_spaces(id),
    round_id UUID NOT NULL REFERENCES narrative_rounds(id),
    event_id UUID NOT NULL REFERENCES timeline_events(id),
    variation_id VARCHAR(255),
    prompt TEXT NOT NULL,
    option_key VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    asset_ref TEXT,
    next_variation_id VARCHAR(255),
    votes_json TEXT NOT NULL,
    sequence_number INTEGER NOT NULL,
    decided_at TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE watch_spaces ADD COLUMN IF NOT EXISTS narrative_version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE watch_spaces ADD COLUMN IF NOT EXISTS narrative_base_resume_seconds DOUBLE PRECISION;
ALTER TABLE watch_spaces ADD COLUMN IF NOT EXISTS active_segment_decision_id UUID;
ALTER TABLE watch_spaces ADD COLUMN IF NOT EXISTS active_segment_url TEXT;
ALTER TABLE watch_spaces ADD COLUMN IF NOT EXISTS active_segment_start_seconds INTEGER;
ALTER TABLE watch_spaces ADD COLUMN IF NOT EXISTS active_segment_end_seconds INTEGER;
ALTER TABLE watch_spaces ADD COLUMN IF NOT EXISTS active_segment_resume_seconds INTEGER;
ALTER TABLE watch_spaces ADD COLUMN IF NOT EXISTS active_segment_started_at TIMESTAMP WITH TIME ZONE;
