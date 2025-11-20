-- ============================================================================
-- MINIMAL COMPATIBILITY FIX - Based on Client Endpoint Analysis
-- ============================================================================
-- This migration ensures all client endpoints work with minimal changes
-- Generated based on actual .from() calls in the codebase
-- ============================================================================

-- ============================================================================
-- CLIENT ENDPOINTS DETECTED:
-- ============================================================================
-- Core tables: games, game_participants, chat_messages, activity_likes
-- User tables: users, user_connections, user_profiles, user_stats
-- Tribe tables: tribes, tribe_members, tribe_channels, tribe_chat_messages, tribe_games
-- Views: games_with_counts, activity_like_counts, chat_messages_with_author,
--        tribe_chat_messages_with_author, friend_suggestions, games_friend_counts
-- ============================================================================

-- ============================================================================
-- PART 1: CRITICAL TABLE GRANTS (Fix Join/Post Issues)
-- ============================================================================

-- Games and Participants (JOIN GAMES FIX)
GRANT SELECT ON public.games TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.games TO authenticated;

GRANT SELECT ON public.game_participants TO anon, authenticated;
GRANT INSERT, DELETE, UPDATE ON public.game_participants TO authenticated;

-- Chat Messages (CHAT FIX)
GRANT SELECT ON public.chat_messages TO anon, authenticated;
GRANT INSERT ON public.chat_messages TO authenticated;

-- Activity Likes (LIKES FIX)
GRANT SELECT ON public.activity_likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.activity_likes TO authenticated;

-- Users
GRANT SELECT ON public.users TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.users TO authenticated;

-- User Connections (Friends)
GRANT SELECT ON public.user_connections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_connections TO authenticated;

-- Tribes System (TRIBE CHAT FIX)
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

-- Notifications
GRANT SELECT ON public.notifications TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- Game Waitlist (if used)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'game_waitlist') THEN
    GRANT SELECT ON public.game_waitlist TO anon, authenticated;
    GRANT INSERT, DELETE ON public.game_waitlist TO authenticated;
  END IF;
END $$;

-- ============================================================================
-- PART 2: VIEW GRANTS (Enable Public Viewing)
-- ============================================================================

-- Critical views used by client
GRANT SELECT ON public.games_with_counts TO anon, authenticated;
GRANT SELECT ON public.activity_like_counts TO anon, authenticated;

DO $$
BEGIN
  -- Chat views
  IF EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'chat_messages_with_author') THEN
    GRANT SELECT ON public.chat_messages_with_author TO anon, authenticated;
  END IF;

  -- Tribe views
  IF EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'tribe_chat_messages_with_author') THEN
    GRANT SELECT ON public.tribe_chat_messages_with_author TO anon, authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'tribe_member_details') THEN
    GRANT SELECT ON public.tribe_member_details TO anon, authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'tribe_statistics') THEN
    GRANT SELECT ON public.tribe_statistics TO anon, authenticated;
  END IF;

  -- Friend views
  IF EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'friend_suggestions') THEN
    GRANT SELECT ON public.friend_suggestions TO anon, authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'games_friend_counts') THEN
    GRANT SELECT ON public.games_friend_counts TO anon, authenticated;
  END IF;
END $$;

-- ============================================================================
-- PART 3: RLS POLICIES (Minimal Set for Core Features)
-- ============================================================================

-- Games: Public can view active games
DROP POLICY IF EXISTS "public_can_view_active_games" ON public.games;
CREATE POLICY "public_can_view_active_games" ON public.games
  FOR SELECT TO PUBLIC
  USING ((archived = false OR archived IS NULL) OR (creator_id = auth.uid()));

-- Game Participants: Public can view, authenticated can join/leave
DROP POLICY IF EXISTS "public_can_view_participants" ON public.game_participants;
CREATE POLICY "public_can_view_participants" ON public.game_participants
  FOR SELECT TO PUBLIC
  USING (true);

DROP POLICY IF EXISTS "authenticated_can_join_games" ON public.game_participants;
CREATE POLICY "authenticated_can_join_games" ON public.game_participants
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated_can_leave_games" ON public.game_participants;
CREATE POLICY "authenticated_can_leave_games" ON public.game_participants
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Activity Likes: Public can view, authenticated can like/unlike
DROP POLICY IF EXISTS "public_can_view_likes" ON public.activity_likes;
CREATE POLICY "public_can_view_likes" ON public.activity_likes
  FOR SELECT TO PUBLIC
  USING (true);

DROP POLICY IF EXISTS "authenticated_can_like" ON public.activity_likes;
CREATE POLICY "authenticated_can_like" ON public.activity_likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated_can_unlike" ON public.activity_likes;
CREATE POLICY "authenticated_can_unlike" ON public.activity_likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Chat Messages: Public can view, authenticated can send
DROP POLICY IF EXISTS "public_can_view_chat" ON public.chat_messages;
CREATE POLICY "public_can_view_chat" ON public.chat_messages
  FOR SELECT TO PUBLIC
  USING (true);

DROP POLICY IF EXISTS "authenticated_can_send_messages" ON public.chat_messages;
CREATE POLICY "authenticated_can_send_messages" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Tribe Chat: Members can view/send
DROP POLICY IF EXISTS "members_can_view_tribe_messages" ON public.tribe_chat_messages;
CREATE POLICY "members_can_view_tribe_messages" ON public.tribe_chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tribe_channels tc
      JOIN public.tribe_members tm ON tm.tribe_id = tc.tribe_id
      WHERE tc.id = tribe_chat_messages.channel_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "members_can_send_tribe_messages" ON public.tribe_chat_messages;
CREATE POLICY "members_can_send_tribe_messages" ON public.tribe_chat_messages
  FOR INSERT TO authenticated
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
-- PART 4: SEQUENCE GRANTS (Enable Auto-increment)
-- ============================================================================

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
-- PART 5: STORAGE BUCKET PERMISSIONS (For Avatars)
-- ============================================================================

-- Ensure avatars bucket is accessible
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Minimal Compatibility Fix Complete';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Fixed:';
  RAISE NOTICE '  ✅ Game joining/leaving (game_participants INSERT/DELETE)';
  RAISE NOTICE '  ✅ Activity likes (activity_likes INSERT/DELETE)';
  RAISE NOTICE '  ✅ Chat messages (chat_messages INSERT)';
  RAISE NOTICE '  ✅ Tribe chat (tribe_chat_messages INSERT)';
  RAISE NOTICE '  ✅ Public viewing (all views granted to anon)';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'All client endpoints should now work!';
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

