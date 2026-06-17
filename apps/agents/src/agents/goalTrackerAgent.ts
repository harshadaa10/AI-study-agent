import { createClient } from "@supabase/supabase-js";

type GoalStatus = "behind" | "on_track" | "ahead";

type PlanTaskRow = {
  id: string;
  status: string | null;
  subject_name: string | null;
  plan_id: string | null;
};

type StudyPlanRow = {
  id: string;
  subject: string | null;
  exam_date: string | null;
  created_at: string;
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getStatus(completion: number, expected: number): GoalStatus {
  if (completion + 5 < expected) return "behind";
  if (completion >= expected + 10) return "ahead";
  return "on_track";
}

function diffDays(from: Date, to: Date) {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function expectedCoverage(planIds: string[], plansById: Map<string, StudyPlanRow>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const datedPlans = planIds
    .map((planId) => plansById.get(planId))
    .filter((plan): plan is StudyPlanRow => Boolean(plan?.exam_date))
    .map((plan) => {
      const createdAt = new Date(plan.created_at);
      createdAt.setHours(0, 0, 0, 0);

      const examDate = new Date(plan.exam_date as string);
      examDate.setHours(0, 0, 0, 0);

      return { createdAt, examDate };
    });

  if (datedPlans.length === 0) return 0;

  const start = new Date(Math.min(...datedPlans.map((plan) => plan.createdAt.getTime())));
  const exam = new Date(Math.min(...datedPlans.map((plan) => plan.examDate.getTime())));
  const totalDays = Math.max(1, diffDays(start, exam));
  const elapsedDays = Math.max(0, diffDays(start, today));

  return Math.min(100, Math.round((elapsedDays / totalDays) * 100));
}

export function buildGoalSnapshot(tasks: PlanTaskRow[], plans: StudyPlanRow[]) {
  const plansById = new Map(plans.map((plan) => [plan.id, plan]));
  const groups = new Map<
    string,
    { completed: number; total: number; planIds: Set<string> }
  >();

  for (const task of tasks) {
    const subject =
      task.subject_name ||
      (task.plan_id ? plansById.get(task.plan_id)?.subject : undefined) ||
      "General";
    const group = groups.get(subject) ?? {
      completed: 0,
      total: 0,
      planIds: new Set<string>(),
    };

    group.total += 1;
    if (task.status === "completed") group.completed += 1;
    if (task.plan_id) group.planIds.add(task.plan_id);
    groups.set(subject, group);
  }

  const subjects = Array.from(groups.entries()).map(([subject, group]) => {
    const completion = group.total > 0 ? Math.round((group.completed / group.total) * 100) : 0;
    const expected = expectedCoverage(Array.from(group.planIds), plansById);

    return {
      subject,
      completedTasks: group.completed,
      totalTasks: group.total,
      completionPercentage: completion,
      expectedCoveragePercentage: expected,
      status: getStatus(completion, expected),
    };
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const expectedOverall =
    subjects.length > 0
      ? Math.round(
          subjects.reduce((sum, subject) => sum + subject.expectedCoveragePercentage, 0) /
            subjects.length
        )
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    overall: {
      completedTasks,
      totalTasks,
      completionPercentage,
      status: getStatus(completionPercentage, expectedOverall),
    },
    subjects,
  };
}

export async function goalTrackerAgent(userId: string) {
  try {
    const supabase = getSupabase();
    const { data: tasks, error: tasksError } = await supabase
      .from("plan_tasks")
      .select("id, status, subject_name, plan_id")
      .eq("user_id", userId);

    if (tasksError) throw new Error(tasksError.message);

    const planIds = Array.from(
      new Set(
        ((tasks ?? []) as PlanTaskRow[])
          .map((task) => task.plan_id)
          .filter((planId): planId is string => Boolean(planId))
      )
    );

    const { data: plans, error: plansError } =
      planIds.length > 0
        ? await supabase
            .from("study_plans")
            .select("id, subject, exam_date, created_at")
            .in("id", planIds)
        : { data: [], error: null };

    if (plansError) throw new Error(plansError.message);

    const snapshot = buildGoalSnapshot(
      (tasks ?? []) as PlanTaskRow[],
      (plans ?? []) as StudyPlanRow[]
    );

    const { data: savedLog, error: logError } = await supabase
      .from("performance_logs")
      .insert({
        user_id: userId,
        log_type: "goal_tracker",
        progress_snapshot: snapshot,
      })
      .select("id")
      .single();

    if (logError) throw new Error(logError.message);

    return { success: true, snapshot, logId: savedLog.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
