-- ==========================================
-- SCHEMA V9: Fix RLS for Multi-Test Sessions
-- ==========================================

-- 1. Enable RLS on Metadata Tables (Best Practice)
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;

-- 2. Allow Public Read on Metadata (Tests, Subjects, Links)
-- Students need to download test structure
DROP POLICY IF EXISTS "Public read subjects" ON subjects;
CREATE POLICY "Public read subjects" ON subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read tests" ON tests;
CREATE POLICY "Public read tests" ON tests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read test_questions" ON test_questions;
CREATE POLICY "Public read test_questions" ON test_questions FOR SELECT USING (true);

-- 3. Update Questions Policy for V4 Schema (session_tests)
-- Old policy relied on test_sessions.test_id which is gone/unused
DROP POLICY IF EXISTS "Active questions only" ON questions;

CREATE POLICY "Active questions only" ON questions FOR SELECT USING (
    EXISTS (
        SELECT 1 
        FROM session_tests st
        JOIN test_sessions ts ON ts.id = st.session_id
        JOIN test_questions tq ON tq.test_id = st.test_id
        WHERE tq.question_id = questions.id 
        AND ts.status IN ('active', 'paused')
    )
    OR 
    -- Keep Admin Access in same policy or rely on separate admin policy? 
    -- Separate admin policy exists ("Admin full questions"), so this is just for students.
    false
);

-- Note: Admin policy "Admin full questions" handles admin access (using is_admin()).
