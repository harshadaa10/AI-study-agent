# Database Schema

## Tables

### users_profile
Stores user metadata.

### subjects
Stores subjects added by user.

### study_plans
Stores generated study plans.

### plan_tasks
Stores tasks inside study plans.

### uploaded_materials
Stores uploaded files (PDFs).

### notes
Stores processed notes.

### notes_embeddings
Stores AI embeddings for semantic search.

Uses Cohere `embed-english-light-v3.0` 384-dimensional vectors and the `match_notes`
RPC for similarity search by user.

### quiz_sessions
Stores quiz scores used by the analyzer agent to identify weak areas over the last 30 days.

### revision_schedule
Stores SM-2 spaced repetition state for each note, including interval, ease factor, repetitions,
last reviewed time, and the next review date.

### performance_logs
Stores AI performance analysis and goal tracking progress snapshots for dashboards.
