-- ==========================================
-- SCHEMA V5 MIGRATION: Fix 'ends_at' column
-- ==========================================

DO $$ 
BEGIN
    -- Add ends_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_sessions' AND column_name = 'ends_at') THEN
        ALTER TABLE test_sessions ADD COLUMN ends_at TIMESTAMPTZ;
    END IF;
END $$;
