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
  created_at: string;
  updated_at: string;
};

export type PlanTask = {
  id: string;
  user_id: string;
  subject_id: string;
  task: string;
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
