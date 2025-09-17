-- MANUAL MIGRATION: Performance Fixes for TribeUp (idempotent + scoped roles)
-- Run this in Supabase Dashboard > SQL Editor

-- 1) DROP DUPLICATE/OLD INDEXES (safe)
DROP INDEX IF EXISTS idx_game_participants_game;
DROP INDEX IF EXISTS idx_game_participants_user;
DROP INDEX IF EXISTS idx_games_date;

-- 2) DROP DUPLICATE/OLD RLS POLICIES (safe)
DROP POLICY IF EXISTS "Authenticated users can join games" ON game_participants;
DROP POLICY IF EXISTS "Anyone can view game participants" ON game_participants;

-- 3) OPTIMIZE RLS POLICIES (use (select auth.uid()); scope to roles)
-- USERS TABLE
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (id = (select auth.uid()));

-- GAMES TABLE
DROP POLICY IF EXISTS "Authenticated users can create games" ON games;
CREATE POLICY "Authenticated users can create games" ON games
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Game creators can update their games" ON games;
CREATE POLICY "Game creators can update their games" ON games
  FOR UPDATE TO authenticated
  USING (creator_id = (select auth.uid()))
  WITH CHECK (creator_id = (select auth.uid()));

DROP POLICY IF EXISTS "Game creators can delete their games" ON games;
CREATE POLICY "Game creators can delete their games" ON games
  FOR DELETE TO authenticated
  USING (creator_id = (select auth.uid()));

-- GAME_PARTICIPANTS TABLE
DROP POLICY IF EXISTS "Users can leave games" ON game_participants;
CREATE POLICY "Users can leave games" ON game_participants
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own participation" ON game_participants;
CREATE POLICY "Users can update their own participation" ON game_participants
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own participation" ON game_participants;
CREATE POLICY "Users can insert their own participation" ON game_participants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view all participation" ON game_participants;
CREATE POLICY "Users can view all participation" ON game_participants
  FOR SELECT TO authenticated
  USING (true);

-- 4) ADD ROLE COLUMN IF MISSING
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user','moderator','admin'));
    CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
  END IF;
END $$;

-- 5) CREATE/ENSURE AUDIT LOG TABLE + POLICY (idempotent)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Make policy idempotent and scoped
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;
CREATE POLICY "System can insert audit logs" ON public.admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 6) ADD OPTIMIZED INDEXES (idempotent)
CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON public.game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON public.game_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_games_date_only ON public.games(date);
CREATE INDEX IF NOT EXISTS idx_game_participants_composite ON public.game_participants(game_id, user_id);
CREATE INDEX IF NOT EXISTS idx_games_creator_date ON public.games(creator_id, date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_user ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.admin_audit_log(created_at);

-- 7) CREATE DEV USER CREATION FUNCTION (bypasses RLS for development)
CREATE OR REPLACE FUNCTION public.create_dev_user(
  user_id text,
  user_name text,
  user_username text,
  user_email text,
  user_bio text DEFAULT '',
  user_location text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    full_name,
    username,
    email,
    bio,
    location,
    role
  ) VALUES (
    user_id,
    user_name,
    user_username,
    user_email,
    user_bio,
    user_location,
    'user'
  );
END;
$$;
