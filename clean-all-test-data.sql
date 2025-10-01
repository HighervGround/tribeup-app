-- CLEAN ALL TEST DATA: Remove all games and references to non-existent users
-- Run this in Supabase SQL Editor to completely clean the database

-- Step 1: Delete all game_participants for non-existent users
DELETE FROM public.game_participants 
WHERE user_id NOT IN (
  SELECT id FROM public.users
);

-- Step 2: Delete all games created by non-existent users
DELETE FROM public.games 
WHERE creator_id NOT IN (
  SELECT id FROM public.users
);

-- Step 3: Delete any chat messages from non-existent users
DELETE FROM public.chat_messages 
WHERE user_id NOT IN (
  SELECT id FROM public.users
);

-- Step 4: Delete any other references to test users (if tables exist)
-- Game waitlist
DELETE FROM public.game_waitlist 
WHERE user_id NOT IN (
  SELECT id FROM public.users
);

-- Game reviews
DELETE FROM public.game_reviews 
WHERE reviewer_id NOT IN (
  SELECT id FROM public.users
);

-- Player ratings
DELETE FROM public.player_ratings 
WHERE rater_id NOT IN (
  SELECT id FROM public.users
)
OR rated_player_id NOT IN (
  SELECT id FROM public.users
);

-- User stats
DELETE FROM public.user_stats 
WHERE user_id NOT IN (
  SELECT id FROM public.users
);

-- User presence
DELETE FROM public.user_presence 
WHERE user_id NOT IN (
  SELECT id FROM public.users
);

-- Step 5: Verify cleanup
SELECT 
  'Cleanup Results' as status,
  (SELECT COUNT(*) FROM public.games) as remaining_games,
  (SELECT COUNT(*) FROM public.game_participants) as remaining_participants,
  (SELECT COUNT(*) FROM public.chat_messages) as remaining_messages,
  (SELECT COUNT(*) FROM public.users) as total_users;

-- Step 6: Show what was cleaned up
SELECT 
  'Test user IDs that had data' as info,
  'ca2ee1cc-3ccc-4d34-8f8e-b9e02c38bfc0' as user_1,
  '6e9f3e18-0005-4080-a62a-2a298cf52199' as user_2,
  'All games and data for these users have been removed' as result;
