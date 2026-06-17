-- DAY 13/15/18 SUPPORT: align vector search and analyzer data dependencies.

ALTER TABLE notes_embeddings
ALTER COLUMN embedding TYPE vector(384)
USING embedding::vector(384);

DROP INDEX IF EXISTS notes_embeddings_embedding_idx;
CREATE INDEX IF NOT EXISTS notes_embeddings_embedding_idx
ON notes_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE OR REPLACE FUNCTION match_notes(
  query_embedding vector(384),
  match_user_id UUID,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  note_id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    notes.id AS note_id,
    notes.content,
    1 - (notes_embeddings.embedding <=> query_embedding) AS similarity
  FROM notes_embeddings
  JOIN notes ON notes.id = notes_embeddings.note_id
  WHERE notes.user_id = match_user_id
  ORDER BY notes_embeddings.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'quiz_sessions'
      AND policyname = 'Users can manage their quiz sessions'
  ) THEN
    CREATE POLICY "Users can manage their quiz sessions"
    ON quiz_sessions
    FOR ALL
    USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS quiz_sessions_user_created_idx
ON quiz_sessions (user_id, created_at DESC);
