# AI Study Agent Schemas

Day 18 integrates the six backend agents through the Next.js route handlers. The main
generic endpoint is `POST /api/agent` with this envelope:

```json
{
  "userId": "user-uuid",
  "taskType": "GENERATE_PLAN",
  "payload": {}
}
```

## Orchestrator

Routes `GENERATE_PLAN`, `PROCESS_NOTES`, `ANALYZE_PERFORMANCE`, `GET_REVISION_QUEUE`,
and `TRACK_GOALS` to the matching agent. All responses use:

```json
{ "success": true, "data": {}, "error": null }
```

Agent-specific handlers may return named data fields such as `plan`, `analysis`, `queue`,
or `snapshot`.

## Planner Agent

Routes: `POST /api/plans/generate`, `POST /api/agent`.

Input:

```json
{
  "userId": "user-uuid",
  "subjects": ["Math", "Physics", "Chemistry"],
  "examDate": "2026-07-15",
  "hoursPerDay": 3
}
```

Output:

```json
{
  "success": true,
  "planId": "plan-uuid",
  "plan": {
    "overview": "Study strategy",
    "week": [],
    "examTips": []
  }
}
```

The agent saves the plan to `study_plans` and individual tasks to `plan_tasks`.

## Notes Agent

Routes: `POST /api/notes/process`, `POST /api/agent`.

Input for `/api/notes/process`:

```json
{
  "userId": "user-uuid",
  "materialId": "material-uuid"
}
```

The route fetches the uploaded material, extracts PDF text, and passes `materialId` plus
`pdfText` to the orchestrator. The notes agent saves generated notes to `notes` and
384-dimensional Cohere embeddings to `notes_embeddings`.

Output:

```json
{
  "success": true,
  "notesCreated": 3,
  "notes": "generated notes"
}
```

## Semantic Search

Route: `POST /api/notes/search`.

Input:

```json
{
  "userId": "user-uuid",
  "query": "Bayes theorem",
  "limit": 5
}
```

Output includes matching `note_id`, `content`, and `similarity` from the `match_notes` RPC.

## Analyzer Agent

Routes: `POST /api/analyze`, `POST /api/agent`.

Input:

```json
{ "userId": "user-uuid" }
```

Output:

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

The analyzer reads `plan_tasks` and `quiz_sessions`, then stores results in
`performance_logs`.

## Revision Agent

Routes: `POST /api/revision/queue`, `POST /api/revision/review`, `POST /api/agent`.

Queue input:

```json
{ "userId": "user-uuid" }
```

Review input:

```json
{
  "userId": "user-uuid",
  "noteId": "note-uuid",
  "quality": 5
}
```

Output returns due notes or the updated SM-2 schedule. `quality` must be an integer from
0 to 5.

## Goal Tracker Agent

Routes: `POST /api/goals/track`, `POST /api/agent`.

Input:

```json
{ "userId": "user-uuid" }
```

Output:

```json
{
  "success": true,
  "snapshot": {
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

The snapshot is saved to `performance_logs` for dashboard display.
