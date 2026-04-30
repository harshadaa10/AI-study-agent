-- ENABLE VECTOR EXTENSION (for AI embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- UPLOADED MATERIALS TABLE
CREATE TABLE uploaded_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  file_name TEXT,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- NOTES TABLE
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  material_id UUID REFERENCES uploaded_materials(id),
  content TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- NOTES EMBEDDINGS TABLE (AI SEARCH)
CREATE TABLE notes_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes(id),
  embedding vector(1536)
);

-- INDEX FOR FAST SEARCH
CREATE INDEX ON notes_embeddings USING ivfflat (embedding vector_cosine_ops);