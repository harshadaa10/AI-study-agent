export type UserProfile = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Subject = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type StudyPlan = {
  id: string;
  user_id: string;
  subject: string | null;
  exam_date: string | null;
  hours_per_day: number | null;
  plan_data: unknown;
  status: string | null;
  created_at: string;
  updated_at: string;
};

export type PlanTask = {
  id: string;
  user_id: string;
  subject_id: string;
  plan_id: string | null;
  subject_name: string | null;
  task: string;
  topic: string | null;
  duration_mins: number | null;
  priority: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: string;
  user_id: string;
  material_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type RevisionSchedule = {
  id: string;
  user_id: string;
  note_id: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  last_reviewed_at: string | null;
  next_review_at: string;
  created_at: string;
  updated_at: string;
};

export type GoalStatus = "behind" | "on_track" | "ahead";

export type SubjectProgress = {
  subject: string;
  completedTasks: number;
  totalTasks: number;
  completionPercentage: number;
  daysUntilExam?: number | null;
  daysElapsed?: number | null;
  totalPlanDays?: number | null;
  expectedCoveragePercentage: number;
  status: GoalStatus;
};

export type PerformanceLog = {
  id: string;
  user_id: string;
  log_type: string;
  weak_areas: string[] | null;
  readiness_score: number | null;
  next_actions: string[] | null;
  analysis_data: unknown;
  progress_snapshot: unknown;
  created_at: string;
};
