-- ============================================================================
-- MANUAL MIGRATION FIX FOR DATABASE PERMISSIONS
-- ============================================================================
-- Run this SQL in Supabase Dashboard > SQL Editor
-- This fixes all the 403 Forbidden and 400 Bad Request errors
-- ============================================================================

-- 1. Fix game_participants table structure and constraints
-- ============================================================================

-- Ensure status column exists with correct values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'game_participants' 
        AND column_name = 'status' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.game_participants 
        ADD COLUMN status TEXT DEFAULT 'joined';
    END IF;
END $$;

-- Drop old constraint and add correct one
ALTER TABLE public.game_participants 
DROP CONSTRAINT IF EXISTS game_participants_status_check;

ALTER TABLE public.game_participants 
ADD CONSTRAINT game_participants_status_check 
CHECK (status IN ('joined', 'left', 'completed', 'no_show'));

-- Ensure other required columns exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'game_participants' AND column_name = 'joined_at') THEN
        ALTER TABLE public.game_participants ADD COLUMN joined_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'game_participants' AND column_name = 'left_at') THEN
        ALTER TABLE public.game_participants ADD COLUMN left_at TIMESTAMPTZ;
    END IF;
END $$;

-- Update existing rows to have 'joined' status if NULL
UPDATE public.game_participants 
SET status = 'joined' 
WHERE status IS NULL OR status NOT IN ('joined', 'left', 'completed', 'no_show');

-- 2. Grant permissions on game_participants
-- ============================================================================
GRANT SELECT ON public.game_participants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_participants TO authenticated;

-- 3. Fix RLS policies on game_participants
-- ============================================================================
DROP POLICY IF EXISTS "Users can view all participation" ON public.game_participants;
DROP POLICY IF EXISTS "Users can insert their own participation" ON public.game_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON public.game_participants;
DROP POLICY IF EXISTS "Users can delete their own participation" ON public.game_participants;

-- Allow everyone to view participants
CREATE POLICY "public_can_view_participants" ON public.game_participants
  FOR SELECT TO PUBLIC USING (true);

-- Allow authenticated users to insert their own participation
CREATE POLICY "users_can_join_games" ON public.game_participants
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own participation
CREATE POLICY "users_can_update_own_participation" ON public.game_participants
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own participation
CREATE POLICY "users_can_leave_games" ON public.game_participants
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

-- 4. Fix activity_likes permissions and policies
-- ============================================================================
GRANT SELECT ON public.activity_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.activity_likes TO authenticated;

DROP POLICY IF EXISTS "public_can_view_activity_likes" ON public.activity_likes;
CREATE POLICY "public_can_view_activity_likes" ON public.activity_likes
  FOR SELECT TO PUBLIC USING (true);

-- Ensure view exists and has grants
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'activity_like_counts') THEN
        GRANT SELECT ON public.activity_like_counts TO anon;
        GRANT SELECT ON public.activity_like_counts TO authenticated;
    END IF;
END $$;

-- 5. Fix tribe chat permissions
-- ============================================================================
GRANT SELECT ON public.tribe_chat_messages TO anon;
GRANT SELECT, INSERT ON public.tribe_chat_messages TO authenticated;

-- Ensure view exists and has grants
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'tribe_chat_messages_with_author') THEN
        GRANT SELECT ON public.tribe_chat_messages_with_author TO anon;
        GRANT SELECT ON public.tribe_chat_messages_with_author TO authenticated;
    END IF;
END $$;

-- 6. Fix games_friend_counts view permissions (if exists)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'games_friend_counts') THEN
        GRANT SELECT ON public.games_friend_counts TO anon;
        GRANT SELECT ON public.games_friend_counts TO authenticated;
    END IF;
END $$;

-- 7. Fix games_with_counts view permissions
-- ============================================================================
GRANT SELECT ON public.games_with_counts TO anon;
GRANT SELECT ON public.games_with_counts TO authenticated;

-- 8. Fix chat_messages_with_author view permissions (if exists)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'chat_messages_with_author') THEN
        GRANT SELECT ON public.chat_messages_with_author TO anon;
        GRANT SELECT ON public.chat_messages_with_author TO authenticated;
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after to verify everything worked:

-- Check status constraint:
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conname = 'game_participants_status_check';

-- Check grants on game_participants:
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'game_participants' 
AND table_schema = 'public';

-- Check policies:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'game_participants';

-- ============================================================================
-- DONE!
-- ============================================================================

