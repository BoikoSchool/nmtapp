-- ==========================================
-- SCHEMA V6: Fix Permissions (RLS)
-- ==========================================

-- 1. Allow students to see test sessions
DROP POLICY IF EXISTS "Public read test_sessions" ON test_sessions;
CREATE POLICY "Public read test_sessions" ON test_sessions FOR SELECT USING (true);

-- 2. Allow students to insert attempts
DROP POLICY IF EXISTS "Student insert attempts" ON test_attempts;
CREATE POLICY "Student insert attempts" ON test_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Student view own attempts" ON test_attempts;
CREATE POLICY "Student view own attempts" ON test_attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Student update own attempts" ON test_attempts;
CREATE POLICY "Student update own attempts" ON test_attempts FOR UPDATE USING (auth.uid() = user_id);

-- 3. Allow students to submit answers
DROP POLICY IF EXISTS "Student manage answers" ON student_answers;
CREATE POLICY "Student manage answers" ON student_answers FOR ALL USING (
    EXISTS (
        SELECT 1 FROM test_attempts ta 
        WHERE ta.id = student_answers.attempt_id 
        AND ta.user_id = auth.uid()
    )
);
