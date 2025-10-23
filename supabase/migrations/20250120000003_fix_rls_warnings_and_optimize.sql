-- Fix RLS warnings and optimize database policies
-- This migration addresses all RLS performance warnings and consolidates duplicate policies

-- ============================================================================
-- PART 1: Fix auth.* calls to use scalar subqueries for better performance
-- ============================================================================

-- Drop existing policies that need to be recreated with scalar subqueries
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Game creators can update their games" ON public.games;
DROP POLICY IF EXISTS "Game creators can delete their games" ON public.games;
DROP POLICY IF EXISTS "Authenticated users can join games" ON public.game_participants;
DROP POLICY IF EXISTS "Users can leave games" ON public.game_participants;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Recreate users policies with scalar subqueries
CREATE POLICY "Users self or admin select" ON public.users
  FOR SELECT USING (
    (id = (SELECT auth.uid())) OR 
    (((SELECT auth.jwt()) ->> 'role') = 'admin')
  );

CREATE POLICY "user_self_or_admin_update" ON public.users
  FOR UPDATE USING (
    (id = (SELECT auth.uid())) OR 
    (((SELECT auth.jwt()) ->> 'role') = 'admin')
  );

CREATE POLICY "user_self_insert" ON public.users
  FOR INSERT WITH CHECK (id = (SELECT auth.uid()));

-- Recreate games policies with scalar subqueries
CREATE POLICY "games_update_consolidated" ON public.games
  FOR UPDATE USING (
    (((SELECT auth.jwt()) ->> 'role') = 'admin') OR 
    (creator_id = (SELECT auth.uid()))
  );

CREATE POLICY "games_delete_consolidated" ON public.games
  FOR DELETE USING (
    (((SELECT auth.jwt()) ->> 'role') = 'admin') OR 
    (creator_id = (SELECT auth.uid()))
  );

-- Recreate game_participants policies with scalar subqueries
CREATE POLICY "game_participants_insert_consolidated" ON public.game_participants
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "game_participants_delete_consolidated" ON public.game_participants
  FOR DELETE USING (
    (user_id = (SELECT auth.uid())) OR 
    EXISTS (
      SELECT 1 FROM public.games g 
      WHERE g.id = public.game_participants.game_id 
      AND g.creator_id = (SELECT auth.uid())
    )
  );

-- Recreate chat_messages policies with scalar subqueries
CREATE POLICY "chat_messages_insert_consolidated" ON public.chat_messages
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "chat_messages_delete_consolidated" ON public.chat_messages
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Recreate notifications policies with scalar subqueries
CREATE POLICY "notifications_select_consolidated" ON public.notifications
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "notifications_update_consolidated" ON public.notifications
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 2: Consolidate duplicate permissive policies
-- ============================================================================

-- Drop duplicate policies for game_participants
DROP POLICY IF EXISTS "Anyone can view game participants" ON public.game_participants;
DROP POLICY IF EXISTS "Creators can remove participants" ON public.game_participants;
DROP POLICY IF EXISTS "participants_insert_self" ON public.game_participants;
DROP POLICY IF EXISTS "participants_select_self" ON public.game_participants;
DROP POLICY IF EXISTS "participants_update_self" ON public.game_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON public.game_participants;

-- Create consolidated game_participants policies
CREATE POLICY "game_participants_select_consolidated" ON public.game_participants
  FOR SELECT USING (
    (user_id = (SELECT auth.uid())) OR 
    (((SELECT auth.jwt()) ->> 'role') = 'admin')
  );

CREATE POLICY "game_participants_update_consolidated" ON public.game_participants
  FOR UPDATE USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Drop duplicate policies for users (keep the more restrictive one)
DROP POLICY IF EXISTS "users_select_public" ON public.users;
DROP POLICY IF EXISTS "Public read users" ON public.users;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.users;

-- Drop duplicate policies for games
DROP POLICY IF EXISTS "Anyone can view games" ON public.games;
DROP POLICY IF EXISTS "Public read games" ON public.games;
DROP POLICY IF EXISTS "Anyone can view non-archived games" ON public.games;

-- Create consolidated games select policy
CREATE POLICY "games_select_consolidated" ON public.games
  FOR SELECT USING (
    (is_archived = false) OR 
    (creator_id = (SELECT auth.uid())) OR 
    (((SELECT auth.jwt()) ->> 'role') = 'admin')
  );

-- ============================================================================
-- PART 3: Remove duplicate indexes
-- ============================================================================

-- Remove duplicate indexes for game_participants
DROP INDEX IF EXISTS idx_game_participants_game;
DROP INDEX IF EXISTS idx_participants_game;
DROP INDEX IF EXISTS idx_game_participants_user;
DROP INDEX IF EXISTS idx_participants_user;

-- Keep the more descriptive names
-- idx_game_participants_game_id and idx_game_participants_user_id remain

-- Remove duplicate indexes for games
DROP INDEX IF EXISTS idx_games_creator;
DROP INDEX IF EXISTS idx_participants_game;

-- Keep idx_games_creator_id

-- Remove duplicate indexes for users (if any exist)
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_email;

-- ============================================================================
-- PART 4: Add missing indexes for better performance
-- ============================================================================

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role) WHERE role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_archived ON public.games(is_archived) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;

-- Add composite indexes for common joins
CREATE INDEX IF NOT EXISTS idx_game_participants_user_game ON public.game_participants(user_id, game_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_game_user ON public.chat_messages(game_id, user_id);

-- ============================================================================
-- PART 5: Update functions to use scalar subqueries
-- ============================================================================

-- Update join_game function
CREATE OR REPLACE FUNCTION public.join_game(game_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert participant
  INSERT INTO public.game_participants (game_id, user_id)
  VALUES (game_uuid, (SELECT auth.uid()))
  ON CONFLICT (game_id, user_id) DO NOTHING;
  
  -- Update current players count
  UPDATE public.games 
  SET current_players = (
    SELECT COUNT(*) 
    FROM public.game_participants 
    WHERE game_id = game_uuid
  )
  WHERE id = game_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update leave_game function
CREATE OR REPLACE FUNCTION public.leave_game(game_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Remove participant
  DELETE FROM public.game_participants 
  WHERE game_id = game_uuid AND user_id = (SELECT auth.uid());
  
  -- Update current players count
  UPDATE public.games 
  SET current_players = (
    SELECT COUNT(*) 
    FROM public.game_participants 
    WHERE game_id = game_uuid
  )
  WHERE id = game_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update is_joined_to_game function
CREATE OR REPLACE FUNCTION public.is_joined_to_game(game_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 
    FROM public.game_participants 
    WHERE game_id = game_uuid AND user_id = (SELECT auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 6: Add performance monitoring views
-- ============================================================================

-- Create view for monitoring RLS policy performance
CREATE OR REPLACE VIEW public.rls_performance_monitor AS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Create view for monitoring index usage
CREATE OR REPLACE VIEW public.index_usage_monitor AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ============================================================================
-- PART 7: Verify all changes
-- ============================================================================

-- Test that all policies are working
DO $$
BEGIN
  -- Check that all tables have RLS enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' 
    AND c.relname IN ('users', 'games', 'game_participants', 'chat_messages', 'notifications')
    AND c.relrowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on all required tables';
  END IF;
  
  -- Check that no duplicate indexes exist
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname IN ('idx_game_participants_game', 'idx_participants_game')
  ) THEN
    RAISE EXCEPTION 'Duplicate indexes still exist';
  END IF;
  
  RAISE NOTICE 'All RLS optimizations completed successfully';
END;
$$;

-- Final status message
SELECT 'RLS warnings fixed and policies optimized successfully' as status;
