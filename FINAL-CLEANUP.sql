-- FINAL CLEANUP: Run this in Supabase SQL Editor to remove ALL test data
-- This bypasses RLS policies and completely cleans the database

-- Step 1: Temporarily disable RLS to allow cleanup
ALTER TABLE public.games DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;

-- Step 2: Delete ALL games (since you want no test data)
DELETE FROM public.games;

-- Step 3: Delete ALL game participants (should be empty but just in case)
DELETE FROM public.game_participants;

-- Step 4: Delete ALL chat messages (should be empty but just in case)
DELETE FROM public.chat_messages;

-- Step 5: Clean up any other test data tables if they exist
DELETE FROM public.game_waitlist;
DELETE FROM public.game_reviews;
DELETE FROM public.player_ratings;
DELETE FROM public.user_stats;
DELETE FROM public.user_presence;

-- Step 6: Re-enable RLS with proper policies
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Step 7: Create proper RLS policies for games
DROP POLICY IF EXISTS "Games public read" ON public.games;
CREATE POLICY "Games public read" ON public.games 
FOR SELECT TO anon, authenticated 
USING (true);

CREATE POLICY "Users can create games" ON public.games 
FOR INSERT TO authenticated 
WITH CHECK (creator_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own games" ON public.games 
FOR UPDATE TO authenticated 
USING (creator_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own games" ON public.games 
FOR DELETE TO authenticated 
USING (creator_id = (SELECT auth.uid()));

-- Step 8: Verify cleanup
SELECT 
  'CLEANUP VERIFICATION' as status,
  (SELECT COUNT(*) FROM public.games) as games_remaining,
  (SELECT COUNT(*) FROM public.game_participants) as participants_remaining,
  (SELECT COUNT(*) FROM public.chat_messages) as messages_remaining,
  (SELECT COUNT(*) FROM public.users) as users_total;

-- Expected result: All counts should be 0 except users_total
-- This means: Clean database, ready for real users and games!
