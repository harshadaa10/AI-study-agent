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

### revision_schedule
Stores SM-2 spaced repetition state for each note, including interval, ease factor, repetitions,
last reviewed time, and the next review date.

### performance_logs
Stores AI performance analysis and goal tracking progress snapshots for dashboards.
