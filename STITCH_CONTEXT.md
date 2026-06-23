# Stitch Context For UI Generation

Use this file as the source prompt/context when generating AI Study Agent UI in Stitch or
another UI/code generation tool.

## Product

Product name:

```text
AI Study Agent
```

Core promise:

```text
Plan, learn, revise, and track exam readiness in one focused workspace.
```

Supporting copy:

```text
Sign in to continue your study plan, generated notes, revision queue, and progress snapshots.
```

The app is for students preparing for exams. It should feel focused, calm, and useful for
daily study work. Avoid a generic AI SaaS landing page. Build a real study dashboard.

## Workflow To Represent

The dashboard should be organized around this workflow:

1. Generate a study plan.
2. Process uploaded PDFs into generated notes.
3. Search notes semantically.
4. Review due notes in a revision queue.
5. Analyze weak areas and exam readiness.
6. Track progress by subject and overall status.

## Required Dashboard Modules

### Study Plan

Show:

- Overview
- Week tasks
- Subject
- Topic
- Duration in minutes
- Priority: `high`, `medium`, `low`
- Status: `pending`, `completed`
- Exam tips

### Generated Notes

Show:

- Uploaded material reference
- Generated note content
- Number of notes created

### Semantic Search

Show:

- Search input
- Results count
- Matching note content
- Similarity score

### Revision Queue

Show:

- Due count
- Note content
- Interval days
- Ease factor
- Repetitions
- Next review date
- Review quality control from 0 to 5

### Performance Analysis

Show:

- Weak areas
- Readiness score from 0 to 100
- Next actions

### Goal Tracker

Show:

- Completed tasks
- Total tasks
- Completion percentage
- Subject progress
- Status: `behind`, `on_track`, `ahead`

## Current Screens

Already implemented:

- Landing page at `/`
- Login page at `/login`
- Register page at `/register`
- Minimal authenticated dashboard target at `/dashboard`

The next UI should improve `/dashboard` into a real operational dashboard.

## Visual Style

Use a quiet study workspace style. It should feel practical, calm, and organized.

Colors:

```text
Page background: #f7f3ec
Primary text: #17201a
Primary button: #17201a
Primary hover: #284236
Accent green: #3b6f6a
Link green: #2f615c
Body copy: #4f5f57
Muted copy: #68766f
Form label: #25332b
Input/card borders: #c8d2cb, #d8d1c2
Error: #fff3ef, #e6b3a5, #8b2f18
Success: #eef8f1, #a9cdb9, #28533a
```

Typography:

```text
Body: Arial, Helvetica, sans-serif
Labels: small, medium weight
Panel headings: compact and readable
Hero text only on landing page
```

Layout:

```text
Use dense dashboard sections.
Use cards only for individual modules or repeated records.
Do not nest cards inside cards.
Use rounded medium controls and rounded large cards.
Prefer scan-friendly rows, tabs, meters, queues, and lists.
```

## Component Handoff

The codebase already has local shadcn-style primitives:

```text
Button
Card
CardHeader
CardTitle
CardDescription
CardContent
Input
Label
Form
FormField
FormItem
FormLabel
FormControl
FormMessage
```

If Stitch generates UI code, adapt it to these components instead of adding a separate
component system.

## API Surface To Design Against

Frontend pages should call these Next.js API routes:

```text
POST /api/plans/generate
POST /api/notes/process
POST /api/notes/search
POST /api/analyze
POST /api/revision/queue
POST /api/revision/review
POST /api/goals/track
POST /api/agent
```

Do not design browser UI that calls OpenRouter, Cohere, or Supabase service-role
operations directly.

## Screen Prompt For Stitch

Use this prompt when generating a dashboard screen:

```text
Design a focused web dashboard for AI Study Agent, a student exam-prep app. Use a calm
study-workspace style with warm off-white background, dark green-black primary text,
muted green accents, compact cards, and scan-friendly operational sections. The dashboard
must show study plan progress, generated notes, semantic note search, revision queue,
performance analysis, and goal tracking. Use real labels from the product: study plan,
generated notes, revision queue, exam readiness, weak areas, next actions, progress
snapshots, subjects, exam date, hours per day, quality, completion percentage. Avoid
invented metrics and marketing copy. Make it feel like a daily workspace students would
return to before exams.
```

## What Not To Generate

- Do not create a generic SaaS hero dashboard.
- Do not add fake features such as payments, teams, chat rooms, tutors, or calendars unless
  the repo adds them first.
- Do not use purple/blue gradient-heavy AI styling.
- Do not show metrics that do not exist in the schema or API.
- Do not put cards inside cards.
