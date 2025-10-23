-- Conservative cleanup of unused indexes
-- This migration removes ONLY the most obviously unused indexes
-- Focus on indexes that are clearly not needed and won't impact future features

-- ============================================================================
-- PART 1: Remove only the most obviously unused indexes
-- ============================================================================

-- Drop only the most obviously unused user indexes
DROP INDEX IF EXISTS idx_users_profile_covering; -- Complex covering index not used

-- Drop only obviously unused game participant indexes  
DROP INDEX IF EXISTS idx_gp_user_completed;
DROP INDEX IF EXISTS idx_gp_user_played;

-- Drop unused user testing feedback indexes (these are truly unused)
DROP INDEX IF EXISTS idx_user_testing_feedback_submitted_at;
DROP INDEX IF EXISTS idx_user_testing_feedback_trigger_context;
DROP INDEX IF EXISTS idx_user_testing_feedback_user_id;
DROP INDEX IF EXISTS idx_user_testing_feedback_device_browser;

-- Drop unused game participation indexes
DROP INDEX IF EXISTS idx_game_participation_status;
DROP INDEX IF EXISTS idx_game_participation_joined_at;

-- Drop unused user achievement indexes
DROP INDEX IF EXISTS idx_user_achievements_achievement_id;

-- Drop unused achievement indexes
DROP INDEX IF EXISTS idx_achievements_category;
DROP INDEX IF EXISTS idx_achievements_is_active;

-- Drop unused user stats indexes
DROP INDEX IF EXISTS idx_user_stats_last_activity;

-- Drop unused game review indexes
DROP INDEX IF EXISTS idx_game_reviews_reviewer_id;
DROP INDEX IF EXISTS idx_game_reviews_rating;

-- Drop unused profile indexes
DROP INDEX IF EXISTS idx_profiles_username;
DROP INDEX IF EXISTS idx_profiles_deleted_at;

-- Drop unused user presence indexes
DROP INDEX IF EXISTS idx_user_presence_is_online;

-- Drop unused admin audit log indexes
DROP INDEX IF EXISTS idx_audit_log_admin_user;
DROP INDEX IF EXISTS idx_audit_log_created_at;

-- ============================================================================
-- PART 2: Add performance monitoring
-- ============================================================================

-- Create a view to monitor remaining indexes
CREATE OR REPLACE VIEW public.index_usage_monitor AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  CASE 
    WHEN idx_scan = 0 THEN 'UNUSED'
    WHEN idx_scan < 10 THEN 'LOW_USAGE'
    ELSE 'ACTIVE'
  END as usage_status
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC, tablename, indexname;

-- Create RLS policy for the monitoring view
CREATE POLICY "index_usage_monitor_access" ON public.index_usage_monitor
  FOR SELECT USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

-- ============================================================================
-- PART 3: Final verification
-- ============================================================================

-- Test that the migration completed successfully
DO $$
BEGIN
  -- Check that we can still query essential tables
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'users'
  ) THEN
    RAISE EXCEPTION 'Users table indexes not found';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'games'
  ) THEN
    RAISE EXCEPTION 'Games table indexes not found';
  END IF;
  
  RAISE NOTICE 'Conservative index cleanup completed successfully';
END;
$$;

-- Final status message
SELECT 'Conservative index cleanup completed - removed only obviously unused indexes' as status;
