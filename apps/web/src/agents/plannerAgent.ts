import { createClient } from '@supabase/supabase-js'

// ---- TYPES ----

// This is what the user sends in
export type PlannerInput = {
  subject:      string   // e.g. "Machine Learning"
  examDate:     string   // e.g. "2025-06-15" (YYYY-MM-DD format)
  hoursPerDay:  number   // e.g. 2
}

// This is the shape of one day in the study plan
type StudyDay = {
  day:       number    // 1, 2, 3...
  date:      string    // "2025-06-01"
  topics:    string[]  // ["Neural Networks", "Backpropagation"]
  tasks:     string[]  // ["Read chapter 3", "Solve 5 practice problems"]
  hours:     number    // how many hours this day
  focus:     string    // one sentence summary of the day's goal
}

// This is the full plan Llama returns
type StudyPlan = {
  subject:        string
  totalDays:      number
  dailyHours:     number
  examDate:       string
  overview:       string      // 2-3 sentence summary of the plan
  days:           StudyDay[]
  examTips:       string[]    // 3 last-minute exam tips
}


// ---- HELPER — calculate days until exam ----
function daysUntilExam(examDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam  = new Date(examDate)
  const diff  = exam.getTime() - today.getTime()
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}


// ---- MAIN AGENT FUNCTION ----
export async function plannerAgent(
  userId: string,
  input:  PlannerInput
): Promise<{ success: boolean; planId?: string; plan?: StudyPlan; error?: string }> {

  try {
    console.log(`[PlannerAgent] Generating plan for: ${input.subject}`)

    const daysLeft = daysUntilExam(input.examDate)
    // Cap at 7 days for the plan — manageable and focused
    const planDays = Math.min(daysLeft, 7)

    console.log(`[PlannerAgent] Days until exam: ${daysLeft}, planning for: ${planDays} days`)

    // ---- BUILD THE PROMPT ----
    const prompt = `You are an expert study planner. Create a detailed ${planDays}-day study plan.

Student details:
- Subject: ${input.subject}
- Exam date: ${input.examDate}
- Days until exam: ${daysLeft}
- Available study hours per day: ${input.hoursPerDay}
- Today's date: ${new Date().toISOString().split('T')[0]}

Return a JSON object with EXACTLY this structure (no extra text, just the JSON):
{
  "subject": "${input.subject}",
  "totalDays": ${planDays},
  "dailyHours": ${input.hoursPerDay},
  "examDate": "${input.examDate}",
  "overview": "2-3 sentence overview of the study strategy",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "topics": ["Topic 1", "Topic 2"],
      "tasks": ["Task 1", "Task 2", "Task 3"],
      "hours": ${input.hoursPerDay},
      "focus": "One sentence describing today's main goal"
    }
  ],
  "examTips": [
    "Tip 1",
    "Tip 2", 
    "Tip 3"
  ]
}`

    const systemPrompt = `You are an expert academic study planner with years of experience helping students ace exams. 
You create realistic, actionable study plans tailored to each student's timeline and subject.
Always respond with valid JSON only. No markdown, no backticks, no explanation.`

    // ---- CALL LLAMA VIA OPENROUTER ----
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

    if (!rawText) {
      throw new Error('Llama returned empty response')
    }

    console.log('[PlannerAgent] AI response received, parsing JSON...')

    // ---- PARSE THE JSON PLAN ----
    let plan: StudyPlan
    try {
      plan = JSON.parse(rawText)
    } catch {
      // Strip backticks if model wrapped JSON in them anyway
      const cleaned = rawText.replace(/```json|```/g, '').trim()
      plan = JSON.parse(cleaned)
    }

    // Basic validation — make sure days array exists
    if (!plan.days || !Array.isArray(plan.days) || plan.days.length === 0) {
      throw new Error('Plan is missing days array')
    }

    console.log(`[PlannerAgent] Plan parsed — ${plan.days.length} days generated`)

    // ---- SAVE TO SUPABASE ----
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: savedPlan, error: dbError } = await supabase
      .from('study_plans')
      .insert({
        user_id:      userId,
        subject:      input.subject,
        exam_date:    input.examDate,
        hours_per_day: input.hoursPerDay,
        plan_data:    plan,
        status:       'active',
      })
      .select('id')
      .single()

    if (dbError) {
      throw new Error(`Database save failed: ${dbError.message}`)
    }

    console.log(`[PlannerAgent] ✅ Plan saved with ID: ${savedPlan.id}`)

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