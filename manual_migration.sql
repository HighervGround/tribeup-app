-- MANUAL MIGRATION: Performance Fixes for TribeUp
-- Run this in Supabase Dashboard > SQL Editor

-- 1. DROP DUPLICATE INDEXES
DROP INDEX IF EXISTS idx_game_participants_game;
DROP INDEX IF EXISTS idx_game_participants_user;
DROP INDEX IF EXISTS idx_games_date;

-- 2. DROP DUPLICATE RLS POLICIES
DROP POLICY IF EXISTS "Authenticated users can join games" ON game_participants;
DROP POLICY IF EXISTS "Anyone can view game participants" ON game_participants;

-- 3. OPTIMIZE RLS POLICIES (Replace auth.uid() with (select auth.uid()))
-- USERS TABLE
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (id = (select auth.uid()));

-- GAMES TABLE
DROP POLICY IF EXISTS "Authenticated users can create games" ON games;
CREATE POLICY "Authenticated users can create games" ON games
    FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Game creators can update their games" ON games;
CREATE POLICY "Game creators can update their games" ON games
    FOR UPDATE USING (creator_id = (select auth.uid()));

DROP POLICY IF EXISTS "Game creators can delete their games" ON games;
CREATE POLICY "Game creators can delete their games" ON games
    FOR DELETE USING (creator_id = (select auth.uid()));

-- GAME_PARTICIPANTS TABLE
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
    FOR SELECT USING (true);

-- 4. ADD ROLE COLUMN (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));
        CREATE INDEX idx_users_role ON users(role);
    END IF;
END $$;

-- 5. CREATE AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert audit logs" ON admin_audit_log
    FOR INSERT WITH CHECK (true);

-- 6. ADD OPTIMIZED INDEXES
CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_games_date_only ON games(date);
CREATE INDEX IF NOT EXISTS idx_game_participants_composite ON game_participants(game_id, user_id);
CREATE INDEX IF NOT EXISTS idx_games_creator_date ON games(creator_id, date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_user ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_audit_log(created_at);
