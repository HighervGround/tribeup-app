-- PROPER RLS FIX: Clean policies without recursion or cartesian joins
-- PLUS: Fix missing schema columns that are causing 404 errors
-- Run this in your Supabase SQL Editor

-- FIRST: Add missing columns to fix schema mismatches
-- Add status column to game_participants if it doesn't exist
ALTER TABLE public.game_participants 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'joined' CHECK (status IN ('joined', 'left', 'completed'));

-- Add left_at column if it doesn't exist  
ALTER TABLE public.game_participants 
ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ;

-- Ensure joined_at exists
ALTER TABLE public.game_participants 
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_participants_status ON public.game_participants(status);
CREATE INDEX IF NOT EXISTS idx_game_participants_game_user ON public.game_participants(game_id, user_id);

-- Create game_waitlist table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.game_waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'invited', 'declined', 'expired')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Add waitlist indexes
CREATE INDEX IF NOT EXISTS idx_game_waitlist_game_position ON public.game_waitlist(game_id, position);
CREATE INDEX IF NOT EXISTS idx_game_waitlist_user ON public.game_waitlist(user_id);

-- NOW: Fix the RLS policies

-- 1. Users: keep sensitive; use profiles for public/basic info
DROP POLICY IF EXISTS "user_self_or_admin_select" ON public.users;
DROP POLICY IF EXISTS "Users can view basic profile info" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

CREATE POLICY "Users self or admin select" ON public.users 
FOR SELECT TO authenticated 
USING (
  (id = (SELECT auth.uid())) OR 
  ((auth.jwt() ->> 'user_role') = 'admin')
);

-- 2. Public/basic info via profiles (if profiles table exists)
-- Note: Check if you have a profiles table, if not, we'll use users with limited select
DROP POLICY IF EXISTS "Public profiles (read)" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles public read" ON public.profiles;

-- If profiles table exists:
-- CREATE POLICY "Profiles public read" ON public.profiles 
-- FOR SELECT TO anon, authenticated 
-- USING (deleted_at IS NULL);

-- 3. game_participants: enable RLS and allow authenticated read
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants read (own games or creator)" ON public.game_participants;
DROP POLICY IF EXISTS "Users can view all participation" ON public.game_participants;
DROP POLICY IF EXISTS "Game participants are viewable by everyone" ON public.game_participants;
DROP POLICY IF EXISTS "Users can join games" ON public.game_participants;
DROP POLICY IF EXISTS "Users can leave games" ON public.game_participants;

CREATE POLICY "Participants readable to authenticated" ON public.game_participants 
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Users can join games" ON public.game_participants 
FOR INSERT TO authenticated 
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can leave games" ON public.game_participants 
FOR DELETE TO authenticated 
USING (user_id = (SELECT auth.uid()));

-- 4. games: allow broad read (public catalog approach)
DROP POLICY IF EXISTS "Anyone can view games" ON public.games;
DROP POLICY IF EXISTS "Games read (public)" ON public.games;
DROP POLICY IF EXISTS "Games are viewable by everyone" ON public.games;
DROP POLICY IF EXISTS "Users can create games" ON public.games;
DROP POLICY IF EXISTS "Users can update their own games" ON public.games;

-- Public read access for games
CREATE POLICY "Games public read" ON public.games 
FOR SELECT TO anon, authenticated 
USING (true);

-- Authenticated users can create games
CREATE POLICY "Users can create games" ON public.games 
FOR INSERT TO authenticated 
WITH CHECK (creator_id = (SELECT auth.uid()));

-- Users can update their own games
CREATE POLICY "Users can update own games" ON public.games 
FOR UPDATE TO authenticated 
USING (creator_id = (SELECT auth.uid()));

-- 5. chat_messages: ensure table exists and has proper RLS
-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_game_id ON public.chat_messages(game_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat read by participants" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat insert by participants" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat delete own" ON public.chat_messages;

-- Clean chat policies without recursive joins
CREATE POLICY "Chat read by participants" ON public.chat_messages 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.game_participants gp 
    WHERE gp.game_id = chat_messages.game_id 
    AND gp.user_id = (SELECT auth.uid())
    AND gp.status = 'joined'
  )
);

CREATE POLICY "Chat insert by participants" ON public.chat_messages 
FOR INSERT TO authenticated 
WITH CHECK (
  user_id = (SELECT auth.uid()) AND 
  EXISTS (
    SELECT 1 FROM public.game_participants gp 
    WHERE gp.game_id = chat_messages.game_id 
    AND gp.user_id = (SELECT auth.uid())
    AND gp.status = 'joined'
  )
);

CREATE POLICY "Chat delete own" ON public.chat_messages 
FOR DELETE TO authenticated 
USING (user_id = (SELECT auth.uid()));

-- 6. Waitlist policies
ALTER TABLE public.game_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Waitlist readable by participants" ON public.game_waitlist;
CREATE POLICY "Waitlist readable by authenticated" ON public.game_waitlist
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Waitlist insert by authenticated" ON public.game_waitlist
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Waitlist update own" ON public.game_waitlist
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- 7. Proper grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.games TO anon, authenticated;
GRANT SELECT ON public.game_participants TO authenticated;
GRANT SELECT ON public.game_waitlist TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.chat_messages TO authenticated;
GRANT INSERT, DELETE ON public.game_participants TO authenticated;
GRANT INSERT, UPDATE ON public.game_waitlist TO authenticated;

-- 8. Enable RLS on all tables
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Test queries to run after applying:
-- SELECT count(*) FROM public.games; -- Should work for anon/auth
-- SELECT count(*) FROM public.game_participants; -- Should work for auth
-- SELECT count(*) FROM public.chat_messages WHERE game_id = 'some-game-id'; -- Should work for participants
