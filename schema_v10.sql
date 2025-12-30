-- ==========================================
-- SCHEMA V10: Fix RLS for Session Tests
-- ==========================================

-- The previous error was 403 Forbidden on 'session_tests'
-- This table links Sessions to Tests (Subjects)

ALTER TABLE session_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read session_tests" ON session_tests;

CREATE POLICY "Public read session_tests" ON session_tests 
FOR SELECT 
USING (true);

-- Also ensure test_questions is readable (just in case V9 didn't catch it properly)
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read test_questions" ON test_questions;
CREATE POLICY "Public read test_questions" ON test_questions FOR SELECT USING (true);
