-- ==========================================
-- SCHEMA V8: Fix missing display_order
-- ==========================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'session_tests' AND column_name = 'display_order') THEN
        ALTER TABLE session_tests ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;
END $$;
