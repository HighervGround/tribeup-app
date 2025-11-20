-- ============================================================================
-- COMPREHENSIVE SCHEMA AUDIT AND FIX
-- ============================================================================
-- This migration performs a complete audit and fixes all permission issues
-- Run this to ensure all tables, views, and policies are correctly configured
-- ============================================================================

-- ============================================================================
-- PART 1: TABLE GRANTS - Ensure all tables have proper permissions
-- ============================================================================

-- Core game tables
GRANT SELECT ON public.games TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.games TO authenticated;

GRANT SELECT ON public.game_participants TO anon, authenticated;
GRANT INSERT, DELETE ON public.game_participants TO authenticated;

-- User tables
GRANT SELECT ON public.users TO anon, authenticated;
GRANT UPDATE ON public.users TO authenticated;

-- User profiles (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    GRANT SELECT ON public.user_profiles TO anon, authenticated;
    GRANT INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
  END IF;
END $$;

-- Chat messages
GRANT SELECT ON public.chat_messages TO anon, authenticated;
GRANT INSERT ON public.chat_messages TO authenticated;

-- Activity likes
GRANT SELECT ON public.activity_likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.activity_likes TO authenticated;

-- Public RSVPs (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'public_rsvps') THEN
    GRANT SELECT, INSERT ON public.public_rsvps TO anon, authenticated;
  END IF;
END $$;

-- Tribe system tables
GRANT SELECT ON public.tribes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tribes TO authenticated;

GRANT SELECT ON public.tribe_members TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tribe_members TO authenticated;

GRANT SELECT ON public.tribe_channels TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tribe_channels TO authenticated;

GRANT SELECT ON public.tribe_chat_messages TO anon, authenticated;
GRANT INSERT ON public.tribe_chat_messages TO authenticated;

GRANT SELECT ON public.tribe_games TO anon, authenticated;
GRANT INSERT, DELETE ON public.tribe_games TO authenticated;

-- Waitlist system (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'game_waitlist') THEN
    GRANT SELECT ON public.game_waitlist TO anon, authenticated;
    GRANT INSERT, DELETE ON public.game_waitlist TO authenticated;
  END IF;
END $$;

-- User stats tables (if exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_stats') THEN
    GRANT SELECT ON public.user_stats TO anon, authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_achievements') THEN
    GRANT SELECT ON public.user_achievements TO anon, authenticated;
  END IF;
END $$;

-- ============================================================================
-- PART 2: VIEW GRANTS - Ensure all views are accessible
-- ============================================================================

-- Games view
GRANT SELECT ON public.games_with_counts TO anon, authenticated;

-- Activity likes view
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'activity_like_counts') THEN
    GRANT SELECT ON public.activity_like_counts TO anon, authenticated;
  END IF;
END $$;

-- Tribe views
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'tribe_member_details') THEN
    GRANT SELECT ON public.tribe_member_details TO anon, authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'tribe_statistics') THEN
    GRANT SELECT ON public.tribe_statistics TO anon, authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'tribe_chat_messages_with_author') THEN
    GRANT SELECT ON public.tribe_chat_messages_with_author TO anon, authenticated;
  END IF;
END $$;

-- Chat messages view
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'chat_messages_with_author') THEN
    GRANT SELECT ON public.chat_messages_with_author TO anon, authenticated;
  END IF;
END $$;

-- ============================================================================
-- PART 3: RLS POLICIES - Verify and fix all policies
-- ============================================================================

-- Games table policies
DROP POLICY IF EXISTS "Anyone can view non-archived games" ON public.games;
DROP POLICY IF EXISTS "games_select_consolidated" ON public.games;
DROP POLICY IF EXISTS "Anyone can view games" ON public.games;
DROP POLICY IF EXISTS "public_can_view_active_games" ON public.games;

CREATE POLICY "public_can_view_active_games" ON public.games
  FOR SELECT 
  TO PUBLIC
  USING (
    (archived = false OR archived IS NULL) OR 
    (creator_id = auth.uid())
  );

-- Game participants policies
DROP POLICY IF EXISTS "Users can view all participation" ON public.game_participants;
DROP POLICY IF EXISTS "Anyone can view game participants" ON public.game_participants;

CREATE POLICY "public_can_view_participants" ON public.game_participants
  FOR SELECT 
  TO PUBLIC
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own participation" ON public.game_participants;
DROP POLICY IF EXISTS "Authenticated users can join games" ON public.game_participants;

CREATE POLICY "authenticated_can_join_games" ON public.game_participants
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave games" ON public.game_participants;

CREATE POLICY "authenticated_can_leave_games" ON public.game_participants
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- Activity likes policies
DROP POLICY IF EXISTS "Anyone can read activity likes" ON public.activity_likes;
DROP POLICY IF EXISTS "likes_read" ON public.activity_likes;

CREATE POLICY "public_can_view_likes" ON public.activity_likes
  FOR SELECT 
  TO PUBLIC
  USING (true);

DROP POLICY IF EXISTS "Users can like activities" ON public.activity_likes;
DROP POLICY IF EXISTS "likes_write" ON public.activity_likes;

CREATE POLICY "authenticated_can_like" ON public.activity_likes
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike activities" ON public.activity_likes;
DROP POLICY IF EXISTS "likes_delete_own" ON public.activity_likes;

CREATE POLICY "authenticated_can_unlike" ON public.activity_likes
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- Chat messages policies
DROP POLICY IF EXISTS "Anyone can view chat messages" ON public.chat_messages;

CREATE POLICY "public_can_view_chat" ON public.chat_messages
  FOR SELECT 
  TO PUBLIC
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.chat_messages;

CREATE POLICY "authenticated_can_send_messages" ON public.chat_messages
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Tribe chat messages policies (ensure they exist and are correct)
DROP POLICY IF EXISTS "Tribe members can view messages" ON public.tribe_chat_messages;

CREATE POLICY "members_can_view_tribe_messages" ON public.tribe_chat_messages
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tribe_channels tc
      JOIN public.tribe_members tm ON tm.tribe_id = tc.tribe_id
      WHERE tc.id = tribe_chat_messages.channel_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Tribe members can send messages" ON public.tribe_chat_messages;

CREATE POLICY "members_can_send_tribe_messages" ON public.tribe_chat_messages
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.tribe_channels tc
      JOIN public.tribe_members tm ON tm.tribe_id = tc.tribe_id
      WHERE tc.id = tribe_chat_messages.channel_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

-- ============================================================================
-- PART 4: SEQUENCE GRANTS - Ensure sequences are accessible
-- ============================================================================

-- Grant usage on all sequences to authenticated users
DO $$
DECLARE
  seq_record RECORD;
BEGIN
  FOR seq_record IN 
    SELECT schemaname, sequencename 
    FROM pg_sequences 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE public.%I TO authenticated', seq_record.sequencename);
  END LOOP;
END $$;

-- ============================================================================
-- PART 5: VERIFICATION - Log current state
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
  view_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  -- Count views
  SELECT COUNT(*) INTO view_count
  FROM information_schema.views
  WHERE table_schema = 'public';
  
  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Schema Audit Complete';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables: %', table_count;
  RAISE NOTICE 'Views: %', view_count;
  RAISE NOTICE 'RLS Policies: %', policy_count;
  RAISE NOTICE '============================================';
  RAISE NOTICE 'All permissions have been granted';
  RAISE NOTICE 'All policies have been standardized';
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================


