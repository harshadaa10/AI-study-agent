import { createClient } from '@supabase/supabase-js'

type Status = 'behind' | 'on_track' | 'ahead'

type SubjectProgress = {
  subject: string
  completedTasks: number
  totalTasks: number
  completionPercentage: number
  daysUntilExam: number | null
  daysElapsed: number | null
  totalPlanDays: number | null
  expectedCoveragePercentage: number
  status: Status
}

type GoalSnapshot = {
  generatedAt: string
  overall: {
    completedTasks: number
    totalTasks: number
    completionPercentage: number
    status: Status
  }
  subjects: SubjectProgress[]
}

type PlanTaskRow = {
  id: string
  status: string | null
  subject_id: string | null
  subject_name: string | null
  plan_id: string | null
  subjects: { name: string | null } | { name: string | null }[] | null
}

type StudyPlanRow = {
  id: string
  subject: string | null
  exam_date: string | null
  created_at: string
}

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function dateDiffDays(from: Date, to: Date) {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.ceil((to.getTime() - from.getTime()) / msPerDay)
}

function getSubjectName(task: PlanTaskRow, plansById: Map<string, StudyPlanRow>) {
  if (task.subject_name) return task.subject_name

  const joinedSubject = Array.isArray(task.subjects) ? task.subjects[0] : task.subjects
  if (joinedSubject?.name) return joinedSubject.name

  if (task.plan_id) {
    const planSubject = plansById.get(task.plan_id)?.subject
    if (planSubject) return planSubject
  }

  return 'General'
}

function getPlanDates(planIds: string[], plansById: Map<string, StudyPlanRow>) {
  const today = startOfToday()
  const datedPlans = planIds
    .map((planId) => plansById.get(planId))
    .filter((plan): plan is StudyPlanRow => Boolean(plan?.exam_date))
    .map((plan) => {
      const createdAt = new Date(plan.created_at)
      createdAt.setHours(0, 0, 0, 0)

      const examDate = new Date(plan.exam_date as string)
      examDate.setHours(0, 0, 0, 0)

      return { createdAt, examDate }
    })

  if (datedPlans.length === 0) {
    return {
      daysUntilExam: null,
      daysElapsed: null,
      totalPlanDays: null,
      expectedCoveragePercentage: 0,
    }
  }

  const earliestCreatedAt = new Date(
    Math.min(...datedPlans.map((plan) => plan.createdAt.getTime()))
  )
  const nearestExamDate = new Date(
    Math.min(...datedPlans.map((plan) => plan.examDate.getTime()))
  )
  const totalPlanDays = Math.max(1, dateDiffDays(earliestCreatedAt, nearestExamDate))
  const daysElapsed = Math.max(0, dateDiffDays(earliestCreatedAt, today))
  const daysUntilExam = Math.max(0, dateDiffDays(today, nearestExamDate))
  const expectedCoveragePercentage = Math.min(
    100,
    Math.round((daysElapsed / totalPlanDays) * 100)
  )

  return {
    daysUntilExam,
    daysElapsed,
    totalPlanDays,
    expectedCoveragePercentage,
  }
}

function getStatus(completionPercentage: number, expectedCoveragePercentage: number): Status {
  if (completionPercentage + 5 < expectedCoveragePercentage) return 'behind'
  if (completionPercentage >= expectedCoveragePercentage + 10) return 'ahead'
  return 'on_track'
}

export function buildGoalSnapshot(
  tasks: PlanTaskRow[],
  plans: StudyPlanRow[],
  generatedAt = new Date()
): GoalSnapshot {
  const plansById = new Map(plans.map((plan) => [plan.id, plan]))
  const subjectGroups = new Map<
    string,
    { completedTasks: number; totalTasks: number; planIds: Set<string> }
  >()

  for (const task of tasks) {
    const subject = getSubjectName(task, plansById)
    const group = subjectGroups.get(subject) ?? {
      completedTasks: 0,
      totalTasks: 0,
      planIds: new Set<string>(),
    }

    group.totalTasks += 1
    if (task.status === 'completed') group.completedTasks += 1
    if (task.plan_id) group.planIds.add(task.plan_id)
    subjectGroups.set(subject, group)
  }

  const subjects = Array.from(subjectGroups.entries()).map(([subject, group]) => {
    const completionPercentage =
      group.totalTasks > 0
        ? Math.round((group.completedTasks / group.totalTasks) * 100)
        : 0
    const dates = getPlanDates(Array.from(group.planIds), plansById)

    return {
      subject,
      completedTasks: group.completedTasks,
      totalTasks: group.totalTasks,
      completionPercentage,
      ...dates,
      status: getStatus(completionPercentage, dates.expectedCoveragePercentage),
    }
  })

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.status === 'completed').length
  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const expectedOverall =
    subjects.length > 0
      ? Math.round(
          subjects.reduce(
            (sum, subject) => sum + subject.expectedCoveragePercentage,
            0
          ) / subjects.length
        )
      : 0

  return {
    generatedAt: generatedAt.toISOString(),
    overall: {
      completedTasks,
      totalTasks,
      completionPercentage,
      status: getStatus(completionPercentage, expectedOverall),
    },
    subjects,
  }
}

export async function goalTrackerAgent(userId: string): Promise<{
  success: boolean
  snapshot?: GoalSnapshot
  logId?: string
  error?: string
}> {
  try {
    const supabase = getServiceSupabase()

    const { data: tasks, error: tasksError } = await supabase
      .from('plan_tasks')
      .select(`
        id,
        status,
        subject_id,
        subject_name,
        plan_id,
        subjects (
          name
        )
      `)
      .eq('user_id', userId)

    if (tasksError) {
      throw new Error(`plan_tasks query failed: ${tasksError.message}`)
    }

    const planIds = Array.from(
      new Set(
        ((tasks ?? []) as PlanTaskRow[])
          .map((task) => task.plan_id)
          .filter((planId): planId is string => Boolean(planId))
      )
    )

    const { data: plans, error: plansError } =
      planIds.length > 0
        ? await supabase
            .from('study_plans')
            .select('id, subject, exam_date, created_at')
            .in('id', planIds)
        : { data: [], error: null }

    if (plansError) {
      throw new Error(`study_plans query failed: ${plansError.message}`)
    }

    const snapshot = buildGoalSnapshot(
      (tasks ?? []) as PlanTaskRow[],
      (plans ?? []) as StudyPlanRow[]
    )

    const { data: savedLog, error: logError } = await supabase
      .from('performance_logs')
      .insert({
        user_id: userId,
        log_type: 'goal_tracker',
        progress_snapshot: snapshot,
        analysis_data: {
          source: 'goalTrackerAgent',
          generatedAt: snapshot.generatedAt,
        },
      })
      .select('id')
      .single()

    if (logError) {
      throw new Error(`performance_logs insert failed: ${logError.message}`)
    }

    return {
      success: true,
      snapshot,
      logId: savedLog.id,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
