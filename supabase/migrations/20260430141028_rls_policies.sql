-- ENABLE RLS ON ALL TABLES

ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_embeddings ENABLE ROW LEVEL SECURITY;

-- POLICY: USERS CAN ONLY ACCESS THEIR OWN DATA

CREATE POLICY "Users can manage their own profile"
ON users_profile
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their subjects"
ON subjects
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their study plans"
ON study_plans
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their tasks"
ON plan_tasks
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their materials"
ON uploaded_materials
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their notes"
ON notes
FOR ALL
USING (auth.uid() = user_id);