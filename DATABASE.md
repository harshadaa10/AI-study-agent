# Supabase Schema

This document reflects the migrations in `supabase/migrations` and the schema summary in
`SCHEMA.md`.

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Used by `notes_embeddings` and `match_notes`.

## Tables

### `users_profile`

Stores user metadata.

Columns:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID REFERENCES auth.users(id)`
- `created_at TIMESTAMP DEFAULT now()`
- `updated_at TIMESTAMP DEFAULT now()`

RLS:

- Enabled.
- Policy: users can manage rows where `auth.uid() = user_id`.

### `subjects`

Stores subjects added by a user.

Columns:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID REFERENCES auth.users(id)`
- `name TEXT`
- `created_at TIMESTAMP DEFAULT now()`
- `updated_at TIMESTAMP DEFAULT now()`

RLS:

- Enabled.
- Policy: users can manage rows where `auth.uid() = user_id`.

### `study_plans`

Stores generated study plans.

Columns:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID REFERENCES auth.users(id)`
- `created_at TIMESTAMP DEFAULT now()`
- `updated_at TIMESTAMP DEFAULT now()`
- `subject TEXT`
- `exam_date DATE`
- `hours_per_day INTEGER`
- `plan_data JSONB`
- `status TEXT DEFAULT 'active'`

RLS:

- Enabled.
- Policy: users can manage rows where `auth.uid() = user_id`.

### `plan_tasks`

Stores tasks inside study plans.

Columns:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID REFERENCES auth.users(id)`
- `subject_id UUID REFERENCES subjects(id)`
- `task TEXT`
- `status TEXT DEFAULT 'pending'`
- `created_at TIMESTAMP DEFAULT now()`
- `updated_at TIMESTAMP DEFAULT now()`
- `plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE`
- `subject_name TEXT`
- `topic TEXT`
- `duration_mins INTEGER`
- `priority TEXT`

Known status values from code:

- `pending`
- `completed`

Known priority values from code:

- `high`
- `medium`
- `low`

RLS:

- Enabled.
- Policy: users can manage rows where `auth.uid() = user_id`.

### `uploaded_materials`

Stores uploaded files, currently PDFs.

Columns:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID REFERENCES auth.users(id)`
- `file_name TEXT`
- `file_url TEXT`
- `created_at TIMESTAMP DEFAULT now()`
- `updated_at TIMESTAMP DEFAULT now()`

RLS:

- Enabled.
- Policy: users can manage rows where `auth.uid() = user_id`.

### `notes`

Stores processed notes.

Columns:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID REFERENCES auth.users(id)`
- `material_id UUID REFERENCES uploaded_materials(id)`
- `content TEXT`
- `created_at TIMESTAMP DEFAULT now()`
- `updated_at TIMESTAMP DEFAULT now()`

RLS:

- Enabled.
- Policy: users can manage rows where `auth.uid() = user_id`.

### `notes_embeddings`

Stores AI embeddings for semantic search.

Columns:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `note_id UUID REFERENCES notes(id)`
- `embedding vector(384)`

Embedding model:

- Cohere `embed-english-light-v3.0`
- 384 dimensions

Indexes:

```sql
CREATE INDEX IF NOT EXISTS notes_embeddings_embedding_idx
ON notes_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

RLS:

- Enabled in the base RLS migration.
- No direct user policy is currently defined in `20260430141028_rls_policies.sql`.
  Access should happen through server-side route handlers or RPCs.

### `revision_schedule`

Stores SM-2 spaced repetition state for each note.

Columns:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID REFERENCES auth.users(id)`
- `note_id UUID REFERENCES notes(id) ON DELETE CASCADE`
- `interval_days INTEGER NOT NULL DEFAULT 0`
- `ease_factor NUMERIC NOT NULL DEFAULT 2.5`
- `repetitions INTEGER NOT NULL DEFAULT 0`
- `last_reviewed_at TIMESTAMP WITH TIME ZONE`
- `next_review_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT now()`
- `updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()`
- `UNIQUE (user_id, note_id)`

Indexes:

```sql
CREATE INDEX revision_schedule_user_next_review_idx
ON revision_schedule (user_id, next_review_at);
```

RLS:

- Enabled.
- Policy: users can manage rows where `auth.uid() = user_id`.

### `performance_logs`

Stores AI performance analysis and goal tracking snapshots.

Columns:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID REFERENCES auth.users(id)`
- `log_type TEXT NOT NULL DEFAULT 'performance_analysis'`
- `weak_areas TEXT[]`
- `readiness_score INTEGER`
- `next_actions TEXT[]`
- `analysis_data JSONB`
- `progress_snapshot JSONB`
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT now()`

Known `log_type` values from code:

- `performance_analysis`
- `goal_tracker`

RLS:

- Enabled.
- Policy: users can manage rows where `auth.uid() = user_id`.

### `quiz_sessions`

Stores quiz scores used by analyzer agent.

Columns:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID REFERENCES auth.users(id)`
- `subject TEXT NOT NULL`
- `score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100)`
- `total_questions INTEGER NOT NULL DEFAULT 0`
- `correct_answers INTEGER NOT NULL DEFAULT 0`
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT now()`

Indexes:

```sql
CREATE INDEX IF NOT EXISTS quiz_sessions_user_created_idx
ON quiz_sessions (user_id, created_at DESC);
```

RLS:

- Enabled.
- Policy: users can manage rows where `auth.uid() = user_id`.

## RPC Functions

### `match_notes`

Used by semantic search.

Arguments:

- `query_embedding vector(384)`
- `match_user_id UUID`
- `match_count INT DEFAULT 5`

Returns:

- `note_id UUID`
- `content TEXT`
- `similarity FLOAT`

Behavior:

- Joins `notes_embeddings` to `notes`.
- Filters notes by `notes.user_id = match_user_id`.
- Orders by cosine distance.
- Returns up to `match_count` results.

## Relationships

```text
auth.users
  -> users_profile
  -> subjects
  -> study_plans
       -> plan_tasks
  -> uploaded_materials
       -> notes
            -> notes_embeddings
            -> revision_schedule
  -> quiz_sessions
  -> performance_logs
```

## Notes For UI Work

- Use `study_plans.plan_data` for generated plan JSON.
- Use `plan_tasks` for task list and progress UI.
- Use `notes` for note display.
- Use `match_notes` results for semantic search UI.
- Use `revision_schedule` for due review cards and SM-2 stats.
- Use `performance_logs` for readiness analysis and goal snapshots.
