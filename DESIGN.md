# UI/UX Specifications

## Product Promise

**AI Study Agent** helps students plan, learn, revise, and track exam readiness in one
focused workspace.

Use copy and labels already present in the repo. Core terminology:

- Study plan
- Generated notes
- Semantic search
- Revision queue
- Exam readiness
- Weak areas
- Next actions
- Progress snapshots
- Subjects
- Exam date
- Hours per day

## Information Architecture

The product is organized around a student study workflow:

1. **Plan**: generate study plans from subjects, exam date, and hours per day.
2. **Learn**: process uploaded PDFs into structured notes.
3. **Search**: find notes semantically by query and similarity.
4. **Revise**: review due notes through an SM-2 revision queue.
5. **Analyze**: surface weak areas, readiness score, and next actions.
6. **Track**: show completion progress and subject status.

Future dashboard UI should make this workflow visible as the primary navigation, not as
marketing sections.

## Existing Screens

### Landing Page

File: `apps/web/src/app/page.tsx`

Purpose:

- Introduces AI Study Agent.
- Leads with the current product promise.
- Routes users to login and account creation.

Primary copy:

- Eyebrow: `AI Study Agent`
- Headline: `Plan, learn, revise, and track exam readiness in one focused workspace.`
- Supporting copy: `Sign in to continue your study plan, generated notes, revision queue, and progress snapshots.`
- Actions: `Log in`, `Create account`

### Auth Pages

Files:

- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(auth)/register/page.tsx`

Required behavior:

- Email/password login with Supabase Auth.
- Email/password registration with Supabase Auth.
- Loading states on submit.
- Inline error messages.
- Redirect authenticated users to `/dashboard`.
- Register page may show an email-confirmation success message when Supabase does not
  return a session immediately.

### Dashboard Placeholder

File: `apps/web/src/app/dashboard/page.tsx`

Current behavior:

- Checks for a Supabase session.
- Redirects unauthenticated users to `/login`.
- Shows signed-in email when authenticated.
- Provides logout.

This is only the Day 19 dashboard target. Future dashboard work should replace the
placeholder content with real plan, notes, revision, analysis, and goal modules.

## Visual Identity

The current UI uses a quiet study-workspace palette with compact SaaS controls.

### Colors

| Purpose | Value |
| --- | --- |
| Page background | `#f7f3ec` |
| Primary text / primary button | `#17201a` |
| Primary hover | `#284236` |
| Accent green | `#3b6f6a` |
| Link green | `#2f615c` |
| Body copy | `#4f5f57` |
| Muted copy | `#68766f` |
| Form label | `#25332b` |
| Input/card border | `#c8d2cb`, `#d8d1c2` |
| Input placeholder | `#8a978f` |
| Error surface | `#fff3ef`, `#e6b3a5`, `#8b2f18` |
| Success surface | `#eef8f1`, `#a9cdb9`, `#28533a` |

### Typography

- Body font: `Arial, Helvetica, sans-serif`
- Labels: `text-sm font-medium`
- Eyebrows: `text-sm font-semibold uppercase tracking-[0.18em]`
- Form titles: `text-2xl font-semibold`
- Dashboard compact headings: `text-3xl font-semibold`
- Landing headline only: `text-4xl sm:text-6xl font-semibold`

Do not use hero-scale type inside dashboard cards or compact panels.

### Layout

- Page max width: `max-w-5xl` or `max-w-6xl`
- Page padding: `px-6 py-10` or `px-6 py-12`
- Form/card width: about `420px` in two-column desktop layouts
- Cards: `rounded-lg border bg-white shadow-sm`
- Controls: `rounded-md`, `h-10` or `h-11`

Do not nest cards inside cards. Use full page sections and repeated item cards only when
the content itself is a repeated record.

## Component System

Current local primitives live in `apps/web/src/components/ui`.

Use these before creating new UI patterns:

- `Button`
- `Card`
- `CardHeader`
- `CardTitle`
- `CardDescription`
- `CardContent`
- `Input`
- `Label`
- `Form`
- `FormField`
- `FormItem`
- `FormLabel`
- `FormControl`
- `FormMessage`

Utility:

- `cn` in `apps/web/src/lib/utils.ts`

## Dashboard Content Requirements

When building the real dashboard, use actual backend fields:

### Plan

- `plan.overview`
- `plan.week`
- `plan.examTips`
- `subject`
- `topic`
- `duration_minutes`
- `priority`
- `status`

### Notes

- `notesCreated`
- `notes`
- `content`
- `materialId`

### Search

- `query`
- `resultsCount`
- `note_id`
- `content`
- `similarity`

### Revision

- `dueCount`
- `queue`
- `intervalDays`
- `easeFactor`
- `repetitions`
- `nextReviewAt`
- `quality` from 0 to 5

### Analysis

- `weak_areas`
- `readiness_score`
- `next_actions`

### Goals

- `completedTasks`
- `totalTasks`
- `completionPercentage`
- `subjects`
- status values: `behind`, `on_track`, `ahead`

## UX Rules

- Use real product data and route labels. Do not invent empty metrics.
- Keep workflows ergonomic for repeated student use.
- Prefer dense, scan-friendly dashboard sections over decorative marketing layouts.
- Show loading and error states for every API-backed action.
- Keep API keys out of the browser; frontend pages call Next.js route handlers.
- Use lucide icons for clear actions such as logout, loading, navigation, upload, search,
  review, and analytics.
