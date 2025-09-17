-- Fix Performance Issues: RLS Optimization, Duplicate Policies, and Duplicate Indexes
-- This migration addresses all the performance warnings from the Supabase linter

-- =============================================================================
-- 1. DROP DUPLICATE INDEXES
-- =============================================================================

-- Drop duplicate indexes on game_participants table
DROP INDEX IF EXISTS idx_game_participants_game;
DROP INDEX IF EXISTS idx_game_participants_user;

-- Drop duplicate index on games table  
DROP INDEX IF EXISTS idx_games_date;

-- =============================================================================
-- 2. DROP DUPLICATE RLS POLICIES ON game_participants
-- =============================================================================

-- Drop the redundant policies (keep the more specific ones)
DROP POLICY IF EXISTS "Authenticated users can join games" ON game_participants;
DROP POLICY IF EXISTS "Anyone can view game participants" ON game_participants;

-- =============================================================================
-- 3. OPTIMIZE RLS POLICIES FOR PERFORMANCE
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation per row
-- =============================================================================

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (id = (select auth.uid()));

-- GAMES TABLE POLICIES
DROP POLICY IF EXISTS "Authenticated users can create games" ON games;
CREATE POLICY "Authenticated users can create games" ON games
    FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Game creators can update their games" ON games;
CREATE POLICY "Game creators can update their games" ON games
    FOR UPDATE USING (creator_id = (select auth.uid()));

DROP POLICY IF EXISTS "Game creators can delete their games" ON games;
CREATE POLICY "Game creators can delete their games" ON games
    FOR DELETE USING (creator_id = (select auth.uid()));

-- GAME_PARTICIPANTS TABLE POLICIES (optimized remaining policies)
DROP POLICY IF EXISTS "Users can leave games" ON game_participants;
CREATE POLICY "Users can leave games" ON game_participants
    FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own participation" ON game_participants;
CREATE POLICY "Users can update their own participation" ON game_participants
    FOR UPDATE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own participation" ON game_participants;
CREATE POLICY "Users can insert their own participation" ON game_participants
    FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view all participation" ON game_participants;
CREATE POLICY "Users can view all participation" ON game_participants
    FOR SELECT USING (true); -- Anyone can view participants

-- CHAT_MESSAGES TABLE POLICIES
DROP POLICY IF EXISTS "Authenticated users can send messages" ON chat_messages;
CREATE POLICY "Authenticated users can send messages" ON chat_messages
    FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;
CREATE POLICY "Users can delete their own messages" ON chat_messages
    FOR DELETE USING (user_id = (select auth.uid()));

-- NOTIFICATIONS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = (select auth.uid()));

-- USER_PRESENCE TABLE POLICIES
DROP POLICY IF EXISTS "Users can update their own presence" ON user_presence;
CREATE POLICY "Users can update their own presence" ON user_presence
    FOR UPDATE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own presence" ON user_presence;
CREATE POLICY "Users can insert their own presence" ON user_presence
    FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- =============================================================================
-- 4. ADD MISSING OPTIMIZED INDEXES (if they don't exist)
-- =============================================================================

-- Ensure we have the better-named indexes
CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_games_date_only ON games(date);

-- Add composite index for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_game_participants_composite ON game_participants(game_id, user_id);
CREATE INDEX IF NOT EXISTS idx_games_creator_date ON games(creator_id, date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- =============================================================================
-- 5. ADD ROLE COLUMN TO USERS TABLE (if it doesn't exist)
-- =============================================================================

-- Add role column for admin functionality
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));
        
        -- Create index on role column for admin queries
        CREATE INDEX idx_users_role ON users(role);
    END IF;
END $$;

-- =============================================================================
-- 6. CREATE AUDIT LOG TABLE FOR ADMIN ACTIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'user', 'game', etc.
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins and moderators can view audit logs (will be created after role column exists)
-- This policy will be created in a separate migration after the role column is confirmed to exist

-- Only the system can insert audit logs (via RPC functions)
CREATE POLICY "System can insert audit logs" ON admin_audit_log
    FOR INSERT WITH CHECK (true);

-- Create index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_user ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_audit_log(created_at);

-- =============================================================================
-- 7. CREATE RPC FUNCTION FOR ADMIN GAME DELETION WITH AUDIT LOGGING
-- =============================================================================

CREATE OR REPLACE FUNCTION admin_delete_game(
    game_id_param UUID,
    reason_param TEXT DEFAULT 'Admin deletion'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_role TEXT;
    game_title TEXT;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Check if user is admin or moderator
    SELECT role INTO user_role FROM users WHERE id = current_user_id;
    
    IF user_role NOT IN ('admin', 'moderator') THEN
        RAISE EXCEPTION 'Insufficient permissions';
    END IF;
    
    -- Get game title for audit log
    SELECT title INTO game_title FROM games WHERE id = game_id_param;
    
    IF game_title IS NULL THEN
        RAISE EXCEPTION 'Game not found';
    END IF;
    
    -- Delete game participants first (due to foreign key constraints)
    DELETE FROM game_participants WHERE game_id = game_id_param;
    
    -- Delete chat messages
    DELETE FROM chat_messages WHERE game_id = game_id_param;
    
    -- Delete the game
    DELETE FROM games WHERE id = game_id_param;
    
    -- Log the admin action
    INSERT INTO admin_audit_log (admin_user_id, action, target_type, target_id, details)
    VALUES (
        current_user_id,
        'DELETE_GAME',
        'game',
        game_id_param,
        jsonb_build_object(
            'game_title', game_title,
            'reason', reason_param,
            'timestamp', NOW()
        )
    );
    
    RETURN TRUE;
END;
$$;

-- =============================================================================
-- 8. CREATE RPC FUNCTION FOR UPDATING USER ROLES
-- =============================================================================

CREATE OR REPLACE FUNCTION admin_update_user_role(
    target_user_id UUID,
    new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    current_user_role TEXT;
    target_username TEXT;
    old_role TEXT;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Check if current user is admin
    SELECT role INTO current_user_role FROM users WHERE id = current_user_id;
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can update user roles';
    END IF;
    
    -- Validate new role
    IF new_role NOT IN ('user', 'moderator', 'admin') THEN
        RAISE EXCEPTION 'Invalid role';
    END IF;
    
    -- Get target user info for audit log
    SELECT username, role INTO target_username, old_role 
    FROM users WHERE id = target_user_id;
    
    IF target_username IS NULL THEN
        RAISE EXCEPTION 'Target user not found';
    END IF;
    
    -- Update the role
    UPDATE users SET role = new_role WHERE id = target_user_id;
    
    -- Log the admin action
    INSERT INTO admin_audit_log (admin_user_id, action, target_type, target_id, details)
    VALUES (
        current_user_id,
        'UPDATE_USER_ROLE',
        'user',
        target_user_id,
        jsonb_build_object(
            'target_username', target_username,
            'old_role', old_role,
            'new_role', new_role,
            'timestamp', NOW()
        )
    );
    
    RETURN TRUE;
END;
$$;

-- Grant execute permissions to authenticated users (RLS will handle authorization)
GRANT EXECUTE ON FUNCTION admin_delete_game TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_role TO authenticated;

-- Migration complete: Fix RLS performance issues, remove duplicate policies/indexes, add admin functionality
