-- Add pgvector embedding column to titles for content-based cosine similarity in recommendations
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE titles ADD COLUMN IF NOT EXISTS embedding vector(768);
