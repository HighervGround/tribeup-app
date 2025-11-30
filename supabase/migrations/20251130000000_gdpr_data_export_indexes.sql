-- GDPR Data Export: Performance Indexes and Data Integrity Constraints
-- Phase 1: Safe database improvements with no frontend impact
-- Issue #40: https://github.com/HighervGround/React-TribeUp-Social-Sports-App/issues/40

-- ============================================================================
-- PERFORMANCE INDEXES FOR RLS FILTERS
-- These indexes improve query performance when filtering by user_id/creator_id
-- ============================================================================

-- Games table indexes
CREATE INDEX IF NOT EXISTS idx_games_creator ON public.games(creator_id);

-- Game participants indexes
CREATE INDEX IF NOT EXISTS idx_game_participants_user ON public.game_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_game ON public.game_participants(game_id);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_game ON public.chat_messages(game_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- Tribe members indexes
CREATE INDEX IF NOT EXISTS idx_tribe_members_user ON public.tribe_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tribe_members_tribe ON public.tribe_members(tribe_id);

-- Tribe chat messages indexes
CREATE INDEX IF NOT EXISTS idx_tribe_chat_messages_user ON public.tribe_chat_messages(user_id);

-- User connections indexes
CREATE INDEX IF NOT EXISTS idx_user_connections_follower ON public.user_connections(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_following ON public.user_connections(following_id);

-- User stats indexes
CREATE INDEX IF NOT EXISTS idx_user_stats_user ON public.user_stats(user_id);

-- User presence indexes
CREATE INDEX IF NOT EXISTS idx_user_presence_user ON public.user_presence(user_id);

-- User achievements indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);

-- ============================================================================
-- DATA INTEGRITY CONSTRAINTS
-- Prevent duplicate records that could cause data export issues
-- ============================================================================

-- Check for existing duplicates before adding unique constraints
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Check for duplicate tribe memberships
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT tribe_id, user_id, COUNT(*)
    FROM public.tribe_members
    GROUP BY tribe_id, user_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Warning: Found % duplicate tribe memberships. Please resolve before applying unique constraint.', duplicate_count;
  ELSE
    -- Safe to add unique constraint
    CREATE UNIQUE INDEX IF NOT EXISTS ux_tribe_members_uni ON public.tribe_members(tribe_id, user_id);
    RAISE NOTICE 'Created unique constraint on tribe_members(tribe_id, user_id)';
  END IF;

  -- Check for duplicate game participants
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT game_id, user_id, COUNT(*)
    FROM public.game_participants
    GROUP BY game_id, user_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Warning: Found % duplicate game participants. Please resolve before applying unique constraint.', duplicate_count;
  ELSE
    -- Safe to add unique constraint
    CREATE UNIQUE INDEX IF NOT EXISTS ux_game_participants_uni ON public.game_participants(game_id, user_id);
    RAISE NOTICE 'Created unique constraint on game_participants(game_id, user_id)';
  END IF;

  -- Check for duplicate RSVPs
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT game_id, user_id, COUNT(*)
    FROM public.rsvps
    GROUP BY game_id, user_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Warning: Found % duplicate RSVPs. Please resolve before applying unique constraint.', duplicate_count;
  ELSE
    -- Safe to add unique constraint
    CREATE UNIQUE INDEX IF NOT EXISTS ux_rsvps_uni ON public.rsvps(game_id, user_id);
    RAISE NOTICE 'Created unique constraint on rsvps(game_id, user_id)';
  END IF;
END $$;

-- ============================================================================
-- AUDIT LOGGING
-- Track when indexes and constraints were applied
-- ============================================================================

COMMENT ON INDEX idx_games_creator IS 'Performance index for GDPR data export - filters games by creator_id';
COMMENT ON INDEX idx_game_participants_user IS 'Performance index for GDPR data export - filters participants by user_id';
COMMENT ON INDEX idx_chat_messages_user IS 'Performance index for GDPR data export - filters messages by user_id';
COMMENT ON INDEX idx_notifications_user IS 'Performance index for GDPR data export - filters notifications by user_id';
COMMENT ON INDEX idx_tribe_members_user IS 'Performance index for GDPR data export - filters tribe members by user_id';
COMMENT ON INDEX idx_user_connections_follower IS 'Performance index for GDPR data export - filters connections by follower_id';
COMMENT ON INDEX idx_user_stats_user IS 'Performance index for GDPR data export - filters stats by user_id';
COMMENT ON INDEX idx_user_achievements_user IS 'Performance index for GDPR data export - filters achievements by user_id';
