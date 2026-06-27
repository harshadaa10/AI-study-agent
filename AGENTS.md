# AI Study Agent Schemas

## Product Source Of Truth

This repo builds **AI Study Agent**. The README currently leads only with the product
name, so use the app copy and schemas for the concrete product promise:

> Plan, learn, revise, and track exam readiness in one focused workspace.

Do not invent product claims or marketing copy. Pull visible terminology from the code:
`study plan`, `generated notes`, `revision queue`, `progress snapshots`, `exam readiness`,
`weak areas`, `next actions`, `subjects`, `examDate`, `hoursPerDay`, `quality`, and
`completionPercentage`.

The product shape is a student workflow, not a generic landing page:

1. Generate a plan from subjects, exam date, and hours per day.
2. Process uploaded PDFs into structured notes.
3. Search notes semantically with Cohere embeddings.
4. Review due notes through an SM-2 revision queue.
5. Analyze quiz/task performance into weak areas, readiness score, and next actions.
6. Track goal progress by subject and overall completion status.

For frontend design, let that workflow organize pages as a study timeline and dashboard:
planning, notes, search, revision, analysis, and goals.

## Critical Files

- `apps/web/src/app/page.tsx` contains the current product headline and first-screen auth
  entry points.
- `apps/web/src/app/(auth)/login/page.tsx` and
  `apps/web/src/app/(auth)/register/page.tsx` contain the Day 19 Supabase Auth screens.
- `apps/web/src/app/dashboard/page.tsx` is the current authenticated dashboard target and
  logout flow.
- `apps/web/src/components/ui/*` contains the local shadcn-style primitives. Reuse these
  before adding new UI patterns.
- `apps/web/src/agents/orchestrator.ts` defines the supported backend task types:
  `GENERATE_PLAN`, `PROCESS_NOTES`, `ANALYZE_PERFORMANCE`, `GET_REVISION_QUEUE`,
  `REVIEW_NOTE`, and `TRACK_GOALS`.
- `apps/web/src/agents/*Agent.ts` contains the product logic and native data structures.
- `apps/web/src/app/api/**/route.ts` is the browser-safe API surface. Frontend pages should
  call these route handlers, not OpenRouter or service-role Supabase directly.
- `supabase/migrations/*.sql` and `SCHEMA.md` define database tables, relationships, RPCs,
  and RLS expectations.

## Visual Identity

The current UI uses a quiet study-workspace palette and compact SaaS controls:

- Page background: `#f7f3ec`
- Primary text / primary button: `#17201a`
- Primary hover: `#284236`
- Accent green: `#3b6f6a`
- Link green: `#2f615c`
- Body copy: `#4f5f57`
- Muted copy: `#68766f`
- Input/card borders: `#c8d2cb`, `#d8d1c2`
- Error surface: `#fff3ef`, `#e6b3a5`, `#8b2f18`
- Success surface: `#eef8f1`, `#a9cdb9`, `#28533a`

Use rounded `md` controls and `lg` cards, not decorative nested cards. Existing type scale
uses `text-sm` for labels, `text-2xl` for form titles, `text-3xl` for compact dashboard
headings, and `text-4xl sm:text-6xl` only on the landing page headline.

## Frontend Design Rules

Read the code before designing. Use existing labels, states, and error messages from route
handlers and agents. If the repo does not contain a feature, metric, or promise, the design
should not show it.

The README/product name comes first; the workflow promise from `page.tsx` comes second.
After that, prioritize operational dashboard content over marketing sections:

- Plan cards should expose `overview`, `week`, `examTips`, task `priority`, and task `status`.
- Notes views should expose generated note content, `notesCreated`, and semantic search
  results with `similarity`.
- Revision views should expose `dueCount`, `intervalDays`, `easeFactor`, `repetitions`,
  `nextReviewAt`, and review `quality` from 0 to 5.
- Analysis views should expose `weak_areas`, `readiness_score`, and `next_actions`.
- Goal views should expose `completedTasks`, `totalTasks`, `completionPercentage`, subject
  progress, and status values `behind`, `on_track`, and `ahead`.

Keep frontend pages connected to the app's native data model: students, subjects, study
plans, plan tasks, uploaded materials, notes, embeddings, quiz sessions, revision schedule,
and performance logs.

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
`REVIEW_NOTE`, and `TRACK_GOALS` to the matching agent. All responses use:

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
