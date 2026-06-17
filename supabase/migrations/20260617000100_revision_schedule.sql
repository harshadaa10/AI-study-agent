-- REVISION SCHEDULE TABLE (SM-2 spaced repetition)
CREATE TABLE revision_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  interval_days INTEGER NOT NULL DEFAULT 0,
  ease_factor NUMERIC NOT NULL DEFAULT 2.5,
  repetitions INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  next_review_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, note_id)
);

CREATE INDEX revision_schedule_user_next_review_idx
ON revision_schedule (user_id, next_review_at);

ALTER TABLE revision_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their revision schedule"
ON revision_schedule
FOR ALL
USING (auth.uid() = user_id);
