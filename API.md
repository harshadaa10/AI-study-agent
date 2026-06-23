# API Documentation

All routes are implemented as Next.js App Router route handlers in
`apps/web/src/app/api`.

## Response Style

Most routes return:

```json
{
  "success": true
}
```

Errors return:

```json
{
  "success": false,
  "error": "message"
}
```

## Generic Agent Endpoint

### `GET /api/agent`

Returns supported agent operations and task types.

Response fields:

- `success`
- `route`
- `taskTypes`
- `operations`

### `POST /api/agent`

Generic orchestrator endpoint.

Request:

```json
{
  "userId": "user-uuid",
  "taskType": "GENERATE_PLAN",
  "payload": {}
}
```

Supported `taskType` values:

- `GENERATE_PLAN`
- `PROCESS_NOTES`
- `ANALYZE_PERFORMANCE`
- `GET_REVISION_QUEUE`
- `REVIEW_NOTE`
- `TRACK_GOALS`

Validation:

- `userId` is required.
- `taskType` is required.
- `taskType` must be one of the supported values.

## Plans

### `POST /api/plans/generate`

Generates a study plan through the planner agent.

Request:

```json
{
  "userId": "user-uuid",
  "subjects": ["Math", "Physics", "Chemistry"],
  "examDate": "2026-07-15",
  "hoursPerDay": 3
}
```

Validation:

- `userId` is required.
- `subjects` must be a non-empty array.
- `examDate` must be `YYYY-MM-DD`.
- `examDate` must be in the future.
- `hoursPerDay` must be between 1 and 12.

Success response:

```json
{
  "success": true,
  "planId": "plan-uuid",
  "plan": {
    "overview": "Brief 2-sentence study strategy",
    "week": [
      {
        "day": 1,
        "subject": "Math",
        "topic": "Algebra review",
        "duration_minutes": 180,
        "priority": "high"
      }
    ],
    "examTips": ["Tip 1", "Tip 2", "Tip 3"]
  }
}
```

Side effects:

- Inserts into `study_plans`.
- Inserts rows into `plan_tasks`.

### `GET /api/agent/plans`

Status/helper route.

Response:

```json
{
  "success": true,
  "route": "/api/agent/plans",
  "message": "Use POST /api/plans/generate or POST /api/agent with taskType GENERATE_PLAN"
}
```

### `POST /api/agent/plans/upload`

Currently not implemented.

Response status: `501`

Response:

```json
{
  "success": false,
  "error": "PDF upload is not implemented on this route yet. Create an uploaded_materials row and call POST /api/notes/process with its materialId."
}
```

## Notes

### `POST /api/notes/process`

Processes an uploaded PDF material into generated notes.

Request:

```json
{
  "userId": "user-uuid",
  "materialId": "material-uuid"
}
```

Validation:

- `userId` and `materialId` are required.
- Material must exist in `uploaded_materials`.
- Material `user_id` must match request `userId`.
- PDF text extraction must produce at least 20 characters.

Success response:

```json
{
  "success": true,
  "notesCreated": 3,
  "notes": "generated notes"
}
```

Side effects:

- Downloads `uploaded_materials.file_url`.
- Extracts PDF text with `pdf2json`.
- Inserts generated notes into `notes`.
- Inserts embeddings into `notes_embeddings`.

### `POST /api/notes/search`

Runs semantic search over notes.

Request:

```json
{
  "userId": "user-uuid",
  "query": "Bayes theorem",
  "limit": 5
}
```

Validation:

- `query` and `userId` are required.
- `query` must be at least 3 characters.
- `limit` is optional, integer, clamped from 1 to 20, default `5`.

Success response:

```json
{
  "success": true,
  "query": "Bayes theorem",
  "resultsCount": 1,
  "results": [
    {
      "note_id": "note-uuid",
      "content": "matching note content",
      "similarity": 0.82
    }
  ]
}
```

## Analyzer

### `POST /api/analyze`

Analyzes study performance.

Request:

```json
{
  "userId": "user-uuid"
}
```

Validation:

- `userId` is required.

Success response:

```json
{
  "success": true,
  "analysis": {
    "weak_areas": ["topic 1", "topic 2", "topic 3"],
    "readiness_score": 65,
    "next_actions": ["action 1", "action 2", "action 3"]
  },
  "logId": "log-uuid"
}
```

Side effects:

- Reads `plan_tasks`.
- Reads `quiz_sessions`.
- Inserts into `performance_logs`.

## Revision

### `POST /api/revision/queue`

Returns due notes from the revision queue.

Request:

```json
{
  "userId": "user-uuid"
}
```

Validation:

- `userId` is required.

Success response:

```json
{
  "success": true,
  "dueCount": 1,
  "queue": [
    {
      "scheduleId": "schedule-uuid",
      "noteId": "note-uuid",
      "materialId": "material-uuid",
      "content": "note content",
      "intervalDays": 1,
      "easeFactor": 2.5,
      "repetitions": 0,
      "nextReviewAt": "2026-06-19T00:00:00.000Z",
      "noteCreatedAt": "2026-06-18T00:00:00.000Z"
    }
  ]
}
```

Side effects:

- Creates missing `revision_schedule` rows for notes without schedules.

### `POST /api/revision/review`

Marks a note as reviewed and updates its SM-2 schedule.

Request:

```json
{
  "userId": "user-uuid",
  "noteId": "note-uuid",
  "quality": 5
}
```

Validation:

- `userId`, `noteId`, and numeric `quality` are required.
- `quality` must be an integer from 0 to 5.

Success response:

```json
{
  "success": true,
  "schedule": {
    "noteId": "note-uuid",
    "reviewedAt": "2026-06-19T00:00:00.000Z",
    "intervalDays": 1,
    "easeFactor": 2.6,
    "repetitions": 1,
    "nextReviewAt": "2026-06-20T00:00:00.000Z"
  }
}
```

Side effects:

- Upserts `revision_schedule`.

## Goals

### `POST /api/goals/track`

Builds and stores a goal tracking snapshot.

Request:

```json
{
  "userId": "user-uuid"
}
```

Validation:

- `userId` is required.

Success response:

```json
{
  "success": true,
  "snapshot": {
    "generatedAt": "2026-06-19T00:00:00.000Z",
    "overall": {
      "completedTasks": 4,
      "totalTasks": 8,
      "completionPercentage": 50,
      "status": "behind"
    },
    "subjects": []
  },
  "logId": "log-uuid"
}
```

Side effects:

- Reads `plan_tasks`.
- Reads related `study_plans`.
- Inserts a `goal_tracker` snapshot into `performance_logs`.

## Frontend Auth

Auth pages use the Supabase browser client:

- `POST` is not used for login/register in this repo yet.
- `login/page.tsx` calls `supabase.auth.signInWithPassword`.
- `register/page.tsx` calls `supabase.auth.signUp`.
- `dashboard/page.tsx` calls `supabase.auth.getSession`, listens to
  `onAuthStateChange`, and calls `supabase.auth.signOut`.
