-- ==========================================
-- SCHEMA V12: Enable Realtime Replication
-- ==========================================

-- Ensure the table is part of the realtime publication
-- This is often required for Supabase Realtime to broadcast changes
BEGIN;
  -- Try to add the table to the publication. 
  -- IF NOT EXISTS check is hard for publications in pure SQL, so we ignore error if duplicate
  DO $$
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE test_sessions;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
    NULL;
  END $$;
COMMIT;
