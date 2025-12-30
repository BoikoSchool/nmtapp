-- ==========================================
-- SCHEMA V17: Security Hardening (Block editing after finish)
-- ==========================================

-- 1. Refine student_answers policies to be more granular
DROP POLICY IF EXISTS "Student manage answers" ON student_answers;

-- Allow students to view their own answers always
CREATE POLICY "Student view own answers" ON student_answers 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM test_attempts ta 
        WHERE ta.id = student_answers.attempt_id 
        AND ta.user_id = auth.uid()
    )
);

-- Allow students to modify answers ONLY if the attempt is still active
CREATE POLICY "Student modify active answers" ON student_answers 
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM test_attempts ta 
        WHERE ta.id = student_answers.attempt_id 
        AND ta.user_id = auth.uid()
        AND ta.status = 'active'
    )
);

CREATE POLICY "Student update active answers" ON student_answers 
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM test_attempts ta 
        WHERE ta.id = student_answers.attempt_id 
        AND ta.user_id = auth.uid()
        AND ta.status = 'active'
    )
);

-- 2. Prevent attempt status modification post-finish (optional but good)
DROP POLICY IF EXISTS "Student update own attempts" ON test_attempts;
CREATE POLICY "Student update own attempts" ON test_attempts 
FOR UPDATE USING (
    auth.uid() = user_id 
    AND status = 'active'
);
