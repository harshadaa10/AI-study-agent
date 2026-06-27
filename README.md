# AI Study Agent

An AI-powered study companion that helps students learn smarter by automatically generating notes, creating personalized study plans, tracking progress, scheduling revisions using the SM-2 algorithm, and providing AI-driven performance analysis.

---

## Features

### AI Notes Generator

* Upload PDF study material
* Automatic text extraction
* AI-generated concise notes
* Stores notes in Supabase

### Semantic Search

* Embeddings generated for every note
* Fast semantic note retrieval
* AI-powered search experience

### Smart Study Planner

* Personalized study plans
* Daily study tasks
* Adjustable study hours
* Exam-based scheduling

### Revision System

* Spaced repetition using the SM-2 algorithm
* Automatic revision scheduling
* Revision queue management

### Performance Analytics

* Readiness score
* Weak area detection
* AI-generated recommendations
* Subject-wise progress tracking

### Goal Tracking

* Study goal management
* Progress monitoring

---

## Tech Stack

### Frontend

* Next.js 14
* React
* TypeScript

### Backend

* Next.js API Routes
* Supabase

### AI

* OpenRouter
* Llama 3
* Embeddings

### Database

* Supabase PostgreSQL

---

## Project Structure

```
apps/
 ├── web/
 │    ├── src/
 │    │     ├── agents/
 │    │     ├── app/
 │    │     ├── lib/
 │    │     ├── utils/
 │
 └── agents/
```

---

## AI Agents

### Planner Agent

Generates personalized study plans.

### Notes Agent

Creates AI-generated notes from uploaded PDFs.

### Analyzer Agent

Analyzes study progress and produces readiness scores.

### Revision Agent

Implements SM-2 spaced repetition scheduling.

### Goal Tracker Agent

Tracks study goals and completion status.

---

## API Overview

| Endpoint              | Description             |
| --------------------- | ----------------------- |
| /api/agent            | Main AI orchestrator    |
| /api/materials/upload | Upload study material   |
| /api/notes/process    | Generate notes          |
| /api/notes/search     | Semantic search         |
| /api/plans/generate   | Generate study plan     |
| /api/analyze          | AI performance analysis |
| /api/revision/queue   | Revision queue          |
| /api/revision/review  | Mark revision completed |
| /api/tasks            | Task management         |

---

## Architecture

```
User
   │
   ▼
Next.js Frontend
   │
   ▼
API Routes
   │
   ▼
AI Agents
   │
   ├── Planner Agent
   ├── Notes Agent
   ├── Analyzer Agent
   ├── Revision Agent
   └── Goal Tracker Agent
   │
   ▼
Supabase
```

---

## Local Setup

Clone the repository

```
git clone https://github.com/harshadaa10/AI-study-agent.git
```

Install dependencies

```
npm install
```

Run the application

```
npm run dev
```

---

## Environment Variables

Create a `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

OPENROUTER_API_KEY=
```

---

## Deployment

Production is deployed on Vercel.

---

## Backend Status

**Backend v1.0 Complete**

Implemented modules

* Authentication
* PDF Upload
* AI Notes
* Semantic Search
* Study Planner
* Revision Scheduling
* Analytics
* Goal Tracking
* OpenRouter Integration
* Supabase Integration

---

## Roadmap

### Backend v1.0

* Completed

### Frontend v2.0

* Modern dashboard
* Responsive UI
* Beautiful onboarding
* AI chat interface
* Enhanced analytics

---

## Author

**Harshada Suryawanshi**

Computer Science Engineering Student

Building AI-powered educational products.
