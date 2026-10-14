-- Ensure timeline_events.embedding column is vector(768) to match gemini-embedding-001
CREATE EXTENSION IF NOT EXISTS vector;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'timeline_events'
          AND column_name = 'embedding'
    ) THEN
        ALTER TABLE timeline_events ALTER COLUMN embedding TYPE vector(768);
    ELSE
        ALTER TABLE timeline_events ADD COLUMN IF NOT EXISTS embedding vector(768);
    END IF;
END $$;
