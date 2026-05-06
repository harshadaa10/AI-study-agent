import { createClient } from '@supabase/supabase-js'

// ---- TYPES ----

export type PlannerInput = {
  subjects:    string[]  // e.g. ["Machine Learning", "Statistics", "Linear Algebra"]
  examDate:    string    // e.g. "2026-06-01"
  hoursPerDay: number    // e.g. 2
}

// Matches the plan's JSON schema exactly
type PlanTask = {
  day:              number
  subject:          string
  topic:            string
  duration_minutes: number
  priority:         'high' | 'medium' | 'low'
}

type StudyPlan = {
  week:      PlanTask[]
  overview:  string
  examTips:  string[]
}


// ---- HELPER ----
function daysUntilExam(examDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = new Date(examDate)
  const diff = exam.getTime() - today.getTime()
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}


// ---- MAIN AGENT FUNCTION ----
export async function plannerAgent(
  userId: string,
  input:  PlannerInput
): Promise<{ success: boolean; planId?: string; plan?: StudyPlan; error?: string }> {

  try {
    console.log(`[PlannerAgent] Generating plan for subjects: ${input.subjects.join(', ')}`)

    const daysLeft = daysUntilExam(input.examDate)
    const planDays = Math.min(daysLeft, 7)
    const totalMinutes = input.hoursPerDay * 60

    console.log(`[PlannerAgent] Days until exam: ${daysLeft}, planning for: ${planDays} days`)

    // ---- BUILD PROMPT ----
   const prompt = `You are an expert study planner. Create a ${planDays}-day study plan.

Student details:
- Subjects: ${input.subjects.join(', ')}
- Exam date: ${input.examDate}
- Days until exam: ${daysLeft}
- Study time per day: ${input.hoursPerDay} hours (${totalMinutes} minutes)
- Today's date: ${new Date().toISOString().split('T')[0]}

IMPORTANT RULES:
- The "week" array MUST have exactly ${planDays} objects — one per day
- Distribute subjects across days: ${input.subjects.map((s, i) => `Day ${i + 1}: ${s}`).join(', ')}, then repeat
- Each object in "week" must have ALL 5 fields: day, subject, topic, duration_minutes, priority
- duration_minutes must be exactly ${totalMinutes} for every day
- priority must be exactly "high", "medium", or "low"

Return ONLY this JSON, no extra text, no markdown:
{
  "overview": "Brief 2-sentence study strategy",
  "week": [
    { "day": 1, "subject": "Machine Learning", "topic": "Introduction and types of ML", "duration_minutes": ${totalMinutes}, "priority": "high" },
    { "day": 2, "subject": "Statistics", "topic": "Descriptive statistics and probability", "duration_minutes": ${totalMinutes}, "priority": "high" },
    { "day": 3, "subject": "Linear Algebra", "topic": "Vectors and matrix operations", "duration_minutes": ${totalMinutes}, "priority": "medium" },
    { "day": 4, "subject": "Machine Learning", "topic": "Supervised learning algorithms", "duration_minutes": ${totalMinutes}, "priority": "high" },
    { "day": 5, "subject": "Statistics", "topic": "Hypothesis testing", "duration_minutes": ${totalMinutes}, "priority": "medium" },
    { "day": 6, "subject": "Linear Algebra", "topic": "Eigenvalues and eigenvectors", "duration_minutes": ${totalMinutes}, "priority": "medium" },
    { "day": 7, "subject": "Machine Learning", "topic": "Model evaluation and review", "duration_minutes": ${totalMinutes}, "priority": "high" }
  ],
  "examTips": ["Tip 1", "Tip 2", "Tip 3"]
}

Now generate the actual plan for the subjects: ${input.subjects.join(', ')} following the exact same structure above but with real topics.`

    const systemPrompt = `You are an expert academic study planner.
You create realistic, actionable study plans tailored to each student's subjects and timeline.
Always respond with valid JSON only. No markdown, no backticks, no explanation.`

    // ---- CALL LLAMA ----
    console.log('[PlannerAgent] Calling Llama via OpenRouter...')

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3-8b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: prompt }
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`OpenRouter error: ${err}`)
    }

    const data = await response.json() as any
    const rawText = data.choices?.[0]?.message?.content

    if (!rawText) throw new Error('Llama returned empty response')

    console.log('[PlannerAgent] AI response received, parsing JSON...')

    // ---- PARSE JSON ----
    let plan: StudyPlan
    try {
      plan = JSON.parse(rawText)
    } catch {
      const cleaned = rawText.replace(/```json|```/g, '').trim()
      plan = JSON.parse(cleaned)
    }

    if (!plan.week || !Array.isArray(plan.week) || plan.week.length === 0) {
      throw new Error('Plan is missing week array')
    }

    console.log(`[PlannerAgent] Plan parsed — ${plan.week.length} tasks generated`)

    // ---- SAVE TO SUPABASE ----
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Save the overall plan to study_plans
    const { data: savedPlan, error: planError } = await supabase
      .from('study_plans')
      .insert({
        user_id:       userId,
        subject:       input.subjects.join(', '),
        exam_date:     input.examDate,
        hours_per_day: input.hoursPerDay,
        plan_data:     plan,
        status:        'active',
      })
      .select('id')
      .single()

    if (planError) throw new Error(`study_plans insert failed: ${planError.message}`)

    console.log(`[PlannerAgent] ✅ Plan saved with ID: ${savedPlan.id}`)

    // 2. Save each task to plan_tasks
    const taskRows = plan.week.map(task => ({
      user_id:       userId,
      plan_id:       savedPlan.id,
      day_number:    task.day,
      subject_id:    null,          // no subject_id lookup needed for now
      task:          task.topic,
      topic:         task.topic,
      duration_mins: task.duration_minutes,
      priority:      task.priority,
      status:        'pending',
    }))

    const { error: tasksError } = await supabase
      .from('plan_tasks')
      .insert(taskRows)

    if (tasksError) {
      // Don't fail the whole request — plan is saved, tasks are bonus
      console.error(`[PlannerAgent] plan_tasks insert failed:`, tasksError.message)
    } else {
      console.log(`[PlannerAgent] ✅ ${taskRows.length} tasks saved to plan_tasks`)
    }

    return {
      success: true,
      planId:  savedPlan.id,
      plan,
    }

  } catch (err) {
    console.error('[PlannerAgent] Error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}