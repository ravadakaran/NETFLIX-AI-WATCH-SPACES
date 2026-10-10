-- Query paths used by the narrative state machine and its public read APIs.
CREATE INDEX IF NOT EXISTS idx_narrative_round_space_status
    ON narrative_rounds (watch_space_id, status);
CREATE INDEX IF NOT EXISTS idx_narrative_round_event
    ON narrative_rounds (watch_space_id, event_id);
CREATE INDEX IF NOT EXISTS idx_narrative_submission_round
    ON narrative_submissions (round_id);
CREATE INDEX IF NOT EXISTS idx_narrative_submission_space_user
    ON narrative_submissions (watch_space_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_narrative_decision_space_sequence
    ON narrative_decisions (watch_space_id, sequence_number);
