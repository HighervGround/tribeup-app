-- Conservative cleanup of unused indexes
-- This migration removes ONLY the most obviously unused indexes
-- Focus on indexes that are clearly not needed and won't impact future features

-- ============================================================================
-- PART 1: Remove unused indexes from users table (conservative)
-- ============================================================================

-- Drop only the most obviously unused user indexes
DROP INDEX IF EXISTS idx_users_profile_covering; -- Complex covering index not used

-- KEEP: idx_users_username_lookup, idx_users_id_lookup, idx_users_role - these might be needed

-- ============================================================================
-- PART 2: Remove unused indexes from chat_messages table
-- ============================================================================

-- KEEP: idx_chat_messages_created_at - might be used for chat history sorting

-- ============================================================================
-- PART 3: Remove unused indexes from notifications table
-- ============================================================================

-- KEEP: idx_notifications_read and idx_notifications_type_user - might be used for notifications

-- ============================================================================
-- PART 4: Remove unused indexes from game_participants table (conservative)
-- ============================================================================

-- Drop only obviously unused game participant indexes
DROP INDEX IF EXISTS idx_gp_user_completed;
DROP INDEX IF EXISTS idx_gp_user_played;

-- KEEP: All other game_participants indexes - these are used for joins and filtering

-- ============================================================================
-- PART 5: Remove unused indexes from games table (conservative)
-- ============================================================================

-- KEEP: All games indexes - these are used for filtering and searching

-- ============================================================================
-- PART 6: Remove unused indexes from user_testing_feedback table
-- ============================================================================

-- Drop unused user testing feedback indexes (these are truly unused)
DROP INDEX IF EXISTS idx_user_testing_feedback_submitted_at;
DROP INDEX IF EXISTS idx_user_testing_feedback_trigger_context;
DROP INDEX IF EXISTS idx_user_testing_feedback_user_id;
DROP INDEX IF EXISTS idx_user_testing_feedback_device_browser;

-- ============================================================================
-- PART 7: Remove unused indexes from game_participation table
-- ============================================================================

-- Drop unused game participation indexes
DROP INDEX IF EXISTS idx_game_participation_status;
DROP INDEX IF EXISTS idx_game_participation_joined_at;

-- ============================================================================
-- PART 8: Remove unused indexes from user_achievements table
-- ============================================================================

-- Drop unused user achievement indexes
DROP INDEX IF EXISTS idx_user_achievements_achievement_id;

-- ============================================================================
-- PART 9: Remove unused indexes from achievements table
-- ============================================================================

-- Drop unused achievement indexes
DROP INDEX IF EXISTS idx_achievements_category;
DROP INDEX IF EXISTS idx_achievements_is_active;

-- ============================================================================
-- PART 10: Remove unused indexes from user_stats table
-- ============================================================================

-- Drop unused user stats indexes
DROP INDEX IF EXISTS idx_user_stats_last_activity;

-- ============================================================================
-- PART 11: Remove unused indexes from game_reviews table
-- ============================================================================

-- Drop unused game review indexes
DROP INDEX IF EXISTS idx_game_reviews_reviewer_id;
DROP INDEX IF EXISTS idx_game_reviews_rating;

-- ============================================================================
-- PART 12: Remove unused indexes from profiles table
-- ============================================================================

-- Drop unused profile indexes
DROP INDEX IF EXISTS idx_profiles_username;
DROP INDEX IF EXISTS idx_profiles_deleted_at;

-- ============================================================================
-- PART 13: Remove unused indexes from user_presence table
-- ============================================================================

-- Drop unused user presence indexes
DROP INDEX IF EXISTS idx_user_presence_is_online;

-- ============================================================================
-- PART 14: Remove unused indexes from admin_audit_log table
-- ============================================================================

-- Drop unused admin audit log indexes
DROP INDEX IF EXISTS idx_audit_log_admin_user;
DROP INDEX IF EXISTS idx_audit_log_created_at;

-- ============================================================================
-- PART 15: Verify cleanup and add performance monitoring
-- ============================================================================

-- Create a view to monitor remaining indexes
CREATE OR REPLACE VIEW public.index_cleanup_monitor AS
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
CREATE POLICY "index_cleanup_monitor_access" ON public.index_cleanup_monitor
  FOR SELECT USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

-- ============================================================================
-- PART 16: Add essential indexes that might be needed
-- ============================================================================

-- Add back only the most critical indexes that are likely to be used
-- These are based on common query patterns in the application

-- Essential user lookups
CREATE INDEX IF NOT EXISTS idx_users_email_lookup ON public.users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_username_lookup ON public.users(username) WHERE username IS NOT NULL;

-- Essential game lookups
CREATE INDEX IF NOT EXISTS idx_games_creator_lookup ON public.games(creator_id);
CREATE INDEX IF NOT EXISTS idx_games_date_lookup ON public.games(date);
CREATE INDEX IF NOT EXISTS idx_games_sport_lookup ON public.games(sport);

-- Essential game participant lookups
CREATE INDEX IF NOT EXISTS idx_game_participants_user_lookup ON public.game_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_game_lookup ON public.game_participants(game_id);

-- Essential notification lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_lookup ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread_lookup ON public.notifications(user_id, read) WHERE read = false;

-- ============================================================================
-- PART 17: Final verification
-- ============================================================================

-- Test that essential indexes exist
DO $$
BEGIN
  -- Check that essential indexes exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname = 'idx_users_email_lookup'
  ) THEN
    RAISE EXCEPTION 'Essential user email index not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname = 'idx_games_creator_lookup'
  ) THEN
    RAISE EXCEPTION 'Essential games creator index not created';
  END IF;
  
  RAISE NOTICE 'Unused indexes cleaned up successfully';
END;
$$;

-- Final status message
SELECT 'Unused indexes cleaned up and essential indexes recreated successfully' as status;
