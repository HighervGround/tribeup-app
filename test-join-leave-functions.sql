-- Test the new join/leave helper functions
-- Game ID: 017a2347-f8d4-4a5f-b4f5-2e60d97a0398

-- Test 1: Join the game
SELECT 'Testing JOIN function...' as status;
SELECT public.test_join('017a2347-f8d4-4a5f-b4f5-2e60d97a0398'::uuid);

-- Check the result
SELECT 'Current participants after JOIN:' as status;
SELECT user_id, status, joined_at, left_at 
FROM public.game_participants 
WHERE game_id = '017a2347-f8d4-4a5f-b4f5-2e60d97a0398';

-- Check game player count
SELECT 'Current game player count:' as status;
SELECT current_players, max_players 
FROM public.games 
WHERE id = '017a2347-f8d4-4a5f-b4f5-2e60d97a0398';

-- Test 2: Leave the game
SELECT 'Testing LEAVE function...' as status;
SELECT public.test_leave('017a2347-f8d4-4a5f-b4f5-2e60d97a0398'::uuid);

-- Check the result
SELECT 'Current participants after LEAVE:' as status;
SELECT user_id, status, joined_at, left_at 
FROM public.game_participants 
WHERE game_id = '017a2347-f8d4-4a5f-b4f5-2e60d97a0398';

-- Check game player count
SELECT 'Final game player count:' as status;
SELECT current_players, max_players 
FROM public.games 
WHERE id = '017a2347-f8d4-4a5f-b4f5-2e60d97a0398';

-- Show current auth user for debugging
SELECT 'Current auth user:' as status;
SELECT auth.uid() as current_user_id;
