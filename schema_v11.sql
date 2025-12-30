-- ==========================================
-- SCHEMA V11: Fix Admin Write Access
-- ==========================================

-- 1. Session Tests (Links)
-- Prerequisite function (ensure it exists)
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER;

-- Enable full access for admin on session_tests
DROP POLICY IF EXISTS "Admin full access session_tests" ON session_tests;
CREATE POLICY "Admin full access session_tests" ON session_tests FOR ALL USING (is_admin());

-- 2. Test Sessions (Ensure Admin can update/delete)
DROP POLICY IF EXISTS "Admin full access test_sessions" ON test_sessions;
CREATE POLICY "Admin full access test_sessions" ON test_sessions FOR ALL USING (is_admin());

-- 3. Ensure Students can read session_tests (Redundant safety)
DROP POLICY IF EXISTS "Public read session_tests" ON session_tests;
CREATE POLICY "Public read session_tests" ON session_tests FOR SELECT USING (true);
