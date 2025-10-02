-- Fix Critical RLS Performance Issues
-- This script addresses all performance warnings from Supabase database linter

-- ============================================================================
-- STEP 1: Fix Auth RLS Initialization Plan Issues
-- Replace auth.uid() with (SELECT auth.uid()) in all RLS policies
-- ============================================================================

-- Fix users table policies
DROP POLICY IF EXISTS "Users self or admin select" ON public.users;
CREATE POLICY "Users self or admin select" ON public.users
FOR SELECT USING (
    id = (SELECT auth.uid()) OR 
    (SELECT auth.jwt() ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS "admin_delete_users" ON public.users;
CREATE POLICY "admin_delete_users" ON public.users
FOR DELETE USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS "user_self_or_admin_update" ON public.users;
CREATE POLICY "user_self_or_admin_update" ON public.users
FOR UPDATE USING (
    id = (SELECT auth.uid()) OR 
    (SELECT auth.jwt() ->> 'role') = 'admin'
);

-- Fix games table policies
DROP POLICY IF EXISTS "Admin delete (jwt)" ON public.games;
CREATE POLICY "Admin delete (jwt)" ON public.games
FOR DELETE USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS "Admin update (jwt)" ON public.games;
CREATE POLICY "Admin update (jwt)" ON public.games
FOR UPDATE USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
);

-- Fix game_participation table policies (if exists)
DROP POLICY IF EXISTS "Participation select (jwt admin)" ON public.game_participation;
CREATE POLICY "Participation select (jwt admin)" ON public.game_participation
FOR SELECT USING (
    (SELECT auth.jwt() ->> 'role') = 'admin' OR true
);

-- Fix admin_audit_log table policies
DROP POLICY IF EXISTS "Audit select (jwt)" ON public.admin_audit_log;
CREATE POLICY "Audit select (jwt)" ON public.admin_audit_log
FOR SELECT USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
);

-- Fix game_reviews table policies
DROP POLICY IF EXISTS "Users can create reviews for games they joined" ON public.game_reviews;
CREATE POLICY "Users can create reviews for games they joined" ON public.game_reviews
FOR INSERT WITH CHECK (
    user_id = (SELECT auth.uid()) AND
    EXISTS (
        SELECT 1 FROM game_participants 
        WHERE game_id = game_reviews.game_id 
        AND user_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.game_reviews;
CREATE POLICY "Users can delete their own reviews" ON public.game_reviews
FOR DELETE USING (
    user_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.game_reviews;
CREATE POLICY "Users can update their own reviews" ON public.game_reviews
FOR UPDATE USING (
    user_id = (SELECT auth.uid())
);

-- Fix profiles table policies
DROP POLICY IF EXISTS "Profiles admin read" ON public.profiles;
CREATE POLICY "Profiles admin read" ON public.profiles
FOR SELECT USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS "Profiles admin write" ON public.profiles;
CREATE POLICY "Profiles admin write" ON public.profiles
FOR UPDATE USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
);

-- ============================================================================
-- STEP 2: Consolidate Multiple Permissive Policies
-- Replace multiple policies with single, comprehensive ones
-- ============================================================================

-- Fix game_participants policies
DROP POLICY IF EXISTS "Join game (self)" ON public.game_participants;
DROP POLICY IF EXISTS "Users can insert their own participation" ON public.game_participants;
CREATE POLICY "game_participants_insert_consolidated" ON public.game_participants
FOR INSERT WITH CHECK (
    user_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Admin can view participants" ON public.game_participants;
DROP POLICY IF EXISTS "Game participants are viewable by authenticated users" ON public.game_participants;
DROP POLICY IF EXISTS "Participants readable to authenticated" ON public.game_participants;
CREATE POLICY "game_participants_select_consolidated" ON public.game_participants
FOR SELECT USING (
    (SELECT auth.jwt() ->> 'role') = 'admin' OR 
    (SELECT auth.uid()) IS NOT NULL
);

-- Fix game_participation policies (different table)
DROP POLICY IF EXISTS "Participation select (jwt admin)" ON public.game_participation;
DROP POLICY IF EXISTS "Users can view all participation" ON public.game_participation;
CREATE POLICY "game_participation_select_consolidated" ON public.game_participation
FOR SELECT USING (
    (SELECT auth.jwt() ->> 'role') = 'admin' OR 
    (SELECT auth.uid()) IS NOT NULL
);

-- Fix games policies
DROP POLICY IF EXISTS "Anyone can view games" ON public.games;
DROP POLICY IF EXISTS "Games read (public)" ON public.games;
CREATE POLICY "games_select_public" ON public.games
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin delete (jwt)" ON public.games;
DROP POLICY IF EXISTS "Game creators can delete their games" ON public.games;
DROP POLICY IF EXISTS "Games delete (creator self)" ON public.games;
CREATE POLICY "games_delete_consolidated" ON public.games
FOR DELETE USING (
    (SELECT auth.jwt() ->> 'role') = 'admin' OR 
    creator_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Authenticated users can create games" ON public.games;
DROP POLICY IF EXISTS "Games insert (creator self)" ON public.games;
CREATE POLICY "games_insert_consolidated" ON public.games
FOR INSERT WITH CHECK (
    creator_id = (SELECT auth.uid()) AND 
    (SELECT auth.uid()) IS NOT NULL
);

DROP POLICY IF EXISTS "Games are viewable by authenticated users" ON public.games;
-- Already created games_select_public above

DROP POLICY IF EXISTS "Admin update (jwt)" ON public.games;
DROP POLICY IF EXISTS "Game creators can update their games" ON public.games;
DROP POLICY IF EXISTS "Games update (creator self)" ON public.games;
CREATE POLICY "games_update_consolidated" ON public.games
FOR UPDATE USING (
    (SELECT auth.jwt() ->> 'role') = 'admin' OR 
    creator_id = (SELECT auth.uid())
);

-- Fix notifications policies
DROP POLICY IF EXISTS "Owner read" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "notifications_select_consolidated" ON public.notifications
FOR SELECT USING (
    user_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Owner update" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "notifications_update_consolidated" ON public.notifications
FOR UPDATE USING (
    user_id = (SELECT auth.uid())
);

-- Fix profiles policies
DROP POLICY IF EXISTS "Profiles insert (self)" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "profiles_insert_consolidated" ON public.profiles
FOR INSERT WITH CHECK (
    id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Profiles public read" ON public.profiles;
-- Keep admin read separate as it has different logic
CREATE POLICY "profiles_select_public" ON public.profiles
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profiles update (self)" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
-- Keep admin write separate as it has different logic
CREATE POLICY "profiles_update_self" ON public.profiles
FOR UPDATE USING (
    id = (SELECT auth.uid())
);

-- Fix user_presence policies
DROP POLICY IF EXISTS "Presence delete (self)" ON public.user_presence;
DROP POLICY IF EXISTS "Users can delete own presence" ON public.user_presence;
CREATE POLICY "user_presence_delete_consolidated" ON public.user_presence
FOR DELETE USING (
    user_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Presence insert (self)" ON public.user_presence;
DROP POLICY IF EXISTS "Users can insert own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Users can insert their own presence" ON public.user_presence;
CREATE POLICY "user_presence_insert_consolidated" ON public.user_presence
FOR INSERT WITH CHECK (
    user_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Authenticated users can view presence" ON public.user_presence;
DROP POLICY IF EXISTS "Presence read (global)" ON public.user_presence;
DROP POLICY IF EXISTS "Users can view all presence data" ON public.user_presence;
CREATE POLICY "user_presence_select_consolidated" ON public.user_presence
FOR SELECT USING (
    (SELECT auth.uid()) IS NOT NULL
);

DROP POLICY IF EXISTS "Presence update (self)" ON public.user_presence;
DROP POLICY IF EXISTS "Users can update own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON public.user_presence;
CREATE POLICY "user_presence_update_consolidated" ON public.user_presence
FOR UPDATE USING (
    user_id = (SELECT auth.uid())
);

-- ============================================================================
-- STEP 3: Remove Duplicate Indexes
-- ============================================================================

-- Remove duplicate indexes on game_participants
DROP INDEX IF EXISTS idx_game_participants_game; -- Keep idx_game_participants_game_id
DROP INDEX IF EXISTS idx_game_participants_user; -- Keep idx_game_participants_user_id
DROP INDEX IF EXISTS uq_game_participants_game_user; -- Keep game_participants_game_id_user_id_key

-- ============================================================================
-- STEP 4: Verify Optimizations
-- ============================================================================

-- Check remaining policies count per table
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Check remaining indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('game_participants', 'games', 'users', 'profiles', 'notifications', 'user_presence')
ORDER BY tablename, indexname;

-- Performance test query - should be much faster now
EXPLAIN (ANALYZE, BUFFERS) 
SELECT g.*, COUNT(gp.user_id) as participant_count
FROM games g
LEFT JOIN game_participants gp ON g.id = gp.game_id
WHERE g.date >= CURRENT_DATE
GROUP BY g.id
ORDER BY g.date
LIMIT 10;
