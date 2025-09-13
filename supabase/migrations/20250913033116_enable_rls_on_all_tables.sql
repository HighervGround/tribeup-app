-- CRITICAL SECURITY FIX: Enable Row Level Security (RLS) on all tables
-- This fixes the security vulnerability where RLS policies exist but RLS is not enabled

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on games table  
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Enable RLS on game_participants table
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;

-- Enable RLS on chat_messages table
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled (these should return 't' for true)
-- SELECT relrowsecurity FROM pg_class WHERE relname = 'users';
-- SELECT relrowsecurity FROM pg_class WHERE relname = 'games';
-- SELECT relrowsecurity FROM pg_class WHERE relname = 'game_participants';
-- SELECT relrowsecurity FROM pg_class WHERE relname = 'chat_messages';
-- SELECT relrowsecurity FROM pg_class WHERE relname = 'notifications';
