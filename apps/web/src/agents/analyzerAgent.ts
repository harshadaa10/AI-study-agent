import { createClient } from '@supabase/supabase-js'

// ---- TYPES ----

// Matches the plan's exact response schema
type AnalysisResult = {
  weak_areas:     string[]
  readiness_score: number
  next_actions:   string[]
}

type SubjectStats = {
  subject:         string
  avgScore:        number
  quizCount:       number
  tasksTotal:      number
  tasksCompleted:  number
  completionRate:  number
}


// ---- MAIN AGENT FUNCTION ----
export async function analyzerAgent(
  userId: string
): Promise<{ success: boolean; analysis?: AnalysisResult; logId?: string; error?: string }> {

  try {
    console.log(`[AnalyzerAgent] Starting analysis for user: ${userId}`)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ---- STEP 1: Query plan_tasks — completion rates per subject ----
    console.log('[AnalyzerAgent] Fetching plan_tasks...')

    const { data: tasks, error: tasksError } = await supabase
      .from('plan_tasks')
      .select('task, topic, status, priority, plan_id')
      .eq('user_id', userId)

    if (tasksError) {
      throw new Error(`plan_tasks query failed: ${tasksError.message}`)
    }

    console.log(`[AnalyzerAgent] Found ${tasks?.length ?? 0} tasks`)

    // ---- STEP 2: Query quiz_sessions — scores per subject last 30 days ----
    console.log('[AnalyzerAgent] Fetching quiz_sessions...')

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: quizzes, error: quizzesError } = await supabase
      .from('quiz_sessions')
      .select('subject, score, total_questions, correct_answers, created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (quizzesError) {
      throw new Error(`quiz_sessions query failed: ${quizzesError.message}`)
    }

    console.log(`[AnalyzerAgent] Found ${quizzes?.length ?? 0} quiz sessions`)

    // ---- STEP 3: Calculate stats per subject ----

    // Group quiz scores by subject
    const quizBySubject: Record<string, number[]> = {}
    for (const quiz of quizzes ?? []) {
      if (!quizBySubject[quiz.subject]) {
        quizBySubject[quiz.subject] = []
      }
      quizBySubject[quiz.subject].push(quiz.score)
    }

    // Group tasks by subject (using topic as proxy since no subject column on tasks)
    const totalTasks = tasks?.length ?? 0
    const completedTasks = tasks?.filter(t => t.status === 'completed').length ?? 0
    const pendingTasks = tasks?.filter(t => t.status === 'pending').length ?? 0

    // Build subject stats array
    const subjectStats: SubjectStats[] = Object.entries(quizBySubject).map(([subject, scores]) => {
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      return {
        subject,
        avgScore,
        quizCount:       scores.length,
        tasksTotal:      totalTasks,
        tasksCompleted:  completedTasks,
        completionRate:  totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0,
      }
    })

    console.log('[AnalyzerAgent] Subject stats:', JSON.stringify(subjectStats))

    // ---- STEP 4: Build AI prompt ----
    const prompt = `You are an academic performance analyzer. Analyze this student's study data and identify their weak areas.

QUIZ PERFORMANCE (last 30 days):
${subjectStats.map(s =>
  `- ${s.subject}: avg score ${s.avgScore}% over ${s.quizCount} quiz(zes)`
).join('\n')}

TASK COMPLETION:
- Total tasks in study plan: ${totalTasks}
- Completed tasks: ${completedTasks}
- Pending tasks: ${pendingTasks}
- Overall completion rate: ${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%

Based on this data:
1. Identify the top 3 weak areas the student should focus on
2. Predict overall exam readiness as a percentage (0-100)
3. Suggest 3 specific next actions the student should take

Return ONLY this exact JSON, no extra text:
{
  "weak_areas": ["weak area 1", "weak area 2", "weak area 3"],
  "readiness_score": 65,
  "next_actions": ["action 1", "action 2", "action 3"]
}`

    const systemPrompt = `You are an expert academic performance analyzer.
You analyze quiz scores and task completion rates to identify student weak areas and predict exam readiness.
Always respond with valid JSON only. No markdown, no backticks, no explanation.`

    // ---- STEP 5: Call Llama ----
    console.log('[AnalyzerAgent] Calling Llama via OpenRouter...')

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

    console.log('[AnalyzerAgent] AI response received, parsing JSON...')

    // ---- STEP 6: Parse response ----
    let analysis: AnalysisResult
    try {
      analysis = JSON.parse(rawText)
    } catch {
      const cleaned = rawText.replace(/```json|```/g, '').trim()
      analysis = JSON.parse(cleaned)
    }

    // Validate response schema
    if (!analysis.weak_areas || !Array.isArray(analysis.weak_areas)) {
      throw new Error('Invalid analysis: missing weak_areas array')
    }
    if (typeof analysis.readiness_score !== 'number') {
      throw new Error('Invalid analysis: missing readiness_score')
    }
    if (!analysis.next_actions || !Array.isArray(analysis.next_actions)) {
      throw new Error('Invalid analysis: missing next_actions array')
    }

    console.log(`[AnalyzerAgent] Analysis parsed — readiness: ${analysis.readiness_score}%`)

    // ---- STEP 7: Save to performance_logs ----
    const { data: savedLog, error: logError } = await supabase
      .from('performance_logs')
      .insert({
        user_id:         userId,
        weak_areas:      analysis.weak_areas,
        readiness_score: analysis.readiness_score,
        next_actions:    analysis.next_actions,
        analysis_data:   {
          subjectStats,
          totalTasks,
          completedTasks,
          generatedAt: new Date().toISOString(),
        },
      })
      .select('id')
      .single()

    if (logError) {
      throw new Error(`performance_logs insert failed: ${logError.message}`)
    }

    console.log(`[AnalyzerAgent] ✅ Analysis saved with ID: ${savedLog.id}`)

    return {
      success:  true,
      analysis,
      logId:    savedLog.id,
    }

  } catch (err) {
    console.error('[AnalyzerAgent] Error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}