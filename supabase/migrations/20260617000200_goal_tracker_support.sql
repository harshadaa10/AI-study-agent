-- DAY 17 SUPPORT: plan metadata and dashboard snapshots
ALTER TABLE study_plans
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS exam_date DATE,
ADD COLUMN IF NOT EXISTS hours_per_day INTEGER,
ADD COLUMN IF NOT EXISTS plan_data JSONB,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE plan_tasks
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS subject_name TEXT,
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS duration_mins INTEGER,
ADD COLUMN IF NOT EXISTS priority TEXT;

CREATE TABLE IF NOT EXISTS performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  log_type TEXT NOT NULL DEFAULT 'performance_analysis',
  weak_areas TEXT[],
  readiness_score INTEGER,
  next_actions TEXT[],
  analysis_data JSONB,
  progress_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'performance_logs'
      AND policyname = 'Users can manage their performance logs'
  ) THEN
    CREATE POLICY "Users can manage their performance logs"
    ON performance_logs
    FOR ALL
    USING (auth.uid() = user_id);
  END IF;
END $$;
