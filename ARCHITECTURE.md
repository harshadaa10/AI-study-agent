# System Architecture

## Overview

AI Study Agent is a Next.js app with Supabase persistence and AI-backed backend agents.
The browser talks to Next.js route handlers. Route handlers call the orchestrator and
agent modules. Agents call OpenRouter, Cohere, and Supabase using server-side environment
variables.

```text
Browser UI
  -> Next.js App Router pages
  -> Next.js API route handlers
  -> Orchestrator
  -> Agent modules
  -> Supabase / OpenRouter / Cohere
```

Frontend pages should not call OpenRouter or Supabase service-role operations directly.

## Applications

### Web App

Path: `apps/web`

Stack:

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS 4
- Supabase Auth via `@supabase/ssr`
- Route handlers under `apps/web/src/app/api`

Important files:

- `src/app/page.tsx`: product entry page
- `src/app/(auth)/login/page.tsx`: login page
- `src/app/(auth)/register/page.tsx`: registration page
- `src/app/dashboard/page.tsx`: authenticated dashboard target
- `src/lib/supabase/browser.ts`: browser Supabase client
- `src/lib/supabase/server.ts`: server Supabase client helper
- `src/components/ui/*`: local UI primitives

### Agents App

Path: `apps/agents`

This is a Bun workspace used for agent utilities and tests. Current tests cover smoke
exports, goal tracking behavior, and SM-2 scheduling behavior.

## Backend Agent Layer

Path: `apps/web/src/agents`

### Orchestrator

File: `apps/web/src/agents/orchestrator.ts`

Task types:

- `GENERATE_PLAN`
- `PROCESS_NOTES`
- `ANALYZE_PERFORMANCE`
- `GET_REVISION_QUEUE`
- `REVIEW_NOTE`
- `TRACK_GOALS`

The orchestrator validates task routing and returns a common success/error response.

### Planner Agent

File: `apps/web/src/agents/plannerAgent.ts`

Inputs:

- `subjects`
- `examDate`
- `hoursPerDay`

Responsibilities:

- Generate a study plan with OpenRouter.
- Save the plan to `study_plans`.
- Save daily tasks to `plan_tasks`.

### Notes Agent

File: `apps/web/src/agents/notesAgent.ts`

Responsibilities:

- Split extracted PDF text into chunks.
- Generate structured notes with OpenRouter.
- Save notes to `notes`.
- Generate 384-dimensional Cohere embeddings.
- Save embeddings to `notes_embeddings`.

### Analyzer Agent

File: `apps/web/src/agents/analyzerAgent.ts`

Responsibilities:

- Read `plan_tasks`.
- Read `quiz_sessions` from the last 30 days.
- Generate weak areas, readiness score, and next actions with OpenRouter.
- Save analysis to `performance_logs`.

### Revision Agent

File: `apps/web/src/agents/revisionAgent.ts`

Responsibilities:

- Ensure every note has a revision schedule.
- Return due notes ordered by `next_review_at`.
- Calculate SM-2 review updates.
- Upsert `revision_schedule` rows.

### Goal Tracker Agent

File: `apps/web/src/agents/goalTrackerAgent.ts`

Responsibilities:

- Read `plan_tasks`.
- Read related `study_plans`.
- Build overall and subject progress snapshots.
- Mark statuses as `behind`, `on_track`, or `ahead`.
- Save snapshots to `performance_logs`.

## API Route Layer

Path: `apps/web/src/app/api`

Primary route:

- `POST /api/agent`

Specialized routes:

- `POST /api/plans/generate`
- `POST /api/notes/process`
- `POST /api/notes/search`
- `POST /api/analyze`
- `POST /api/revision/queue`
- `POST /api/revision/review`
- `POST /api/goals/track`

Utility/status routes:

- `GET /api/agent`
- `GET /api/agent/plans`
- `POST /api/agent/plans/upload` returns `501` because upload is not implemented there.

## Data Flow Examples

### Generate Plan

```text
UI
  -> POST /api/plans/generate
  -> orchestrate(GENERATE_PLAN)
  -> plannerAgent
  -> OpenRouter
  -> Supabase study_plans + plan_tasks
```

### Process Notes

```text
UI
  -> POST /api/notes/process
  -> fetch uploaded_materials.file_url
  -> extract PDF text with pdf2json
  -> orchestrate(PROCESS_NOTES)
  -> notesAgent
  -> OpenRouter notes
  -> Supabase notes
  -> Cohere embedding
  -> Supabase notes_embeddings
```

### Semantic Search

```text
UI
  -> POST /api/notes/search
  -> Cohere query embedding
  -> Supabase RPC match_notes
  -> note_id/content/similarity results
```

### Revision Review

```text
UI
  -> POST /api/revision/review
  -> orchestrate(REVIEW_NOTE)
  -> revisionAgent.calculateSM2
  -> Supabase revision_schedule upsert
```

## External Services

- Supabase: database, Auth, RLS, pgvector.
- OpenRouter: Llama chat completions for planning, notes, and analysis.
- Cohere: `embed-english-light-v3.0` embeddings for semantic search.
- Vercel: Next.js deployment and PR previews.
- GitHub Actions: lint/build/test automation.

## Environment Variables

Required for runtime:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `COHERE_API_KEY`

CI uses placeholder public Supabase values for build-time prerendering.

## CI

Workflow: `.github/workflows/ci.yml`

Jobs:

- `lint-frontend`: install web dependencies, run `npm run lint`, run `npm run build`.
- `test-agents`: install Bun dependencies, run `bun test`.

The workflow runs for `main`, `day-*` pushes, and pull requests.
