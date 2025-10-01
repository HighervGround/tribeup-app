-- FIX UC USERS ISSUE
-- This script addresses the "UC" user display problem caused by orphaned game_participants records

-- STEP 1: Identify the orphaned records
-- First, let's see what we're dealing with
SELECT 
  gp.user_id,
  COUNT(*) as participation_count,
  u.id as user_exists
FROM public.game_participants gp
LEFT JOIN public.users u ON gp.user_id = u.id
WHERE u.id IS NULL  -- Users that don't exist
GROUP BY gp.user_id, u.id
ORDER BY participation_count DESC;

-- STEP 2: Clean up orphaned game_participants records
-- Remove game_participants entries where the user doesn't exist in users table
DELETE FROM public.game_participants 
WHERE user_id NOT IN (
  SELECT id FROM public.users
);

-- STEP 3: Clean up orphaned games that might have no participants now
-- Remove games that have no participants and no creator
DELETE FROM public.games 
WHERE id NOT IN (
  SELECT DISTINCT game_id FROM public.game_participants
) 
AND creator_id NOT IN (
  SELECT id FROM public.users
);

-- STEP 4: Add better constraints to prevent this in the future
-- Add foreign key constraint to ensure game_participants.user_id references users.id
-- Note: This will only work if all orphaned records are cleaned up first
ALTER TABLE public.game_participants 
DROP CONSTRAINT IF EXISTS fk_game_participants_user_id;

ALTER TABLE public.game_participants 
ADD CONSTRAINT fk_game_participants_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- STEP 5: Add foreign key constraint for games.creator_id as well
ALTER TABLE public.games 
DROP CONSTRAINT IF EXISTS fk_games_creator_id;

ALTER TABLE public.games 
ADD CONSTRAINT fk_games_creator_id 
FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- STEP 6: Verify the cleanup
-- Check that no orphaned records remain
SELECT 
  'Orphaned game_participants' as issue_type,
  COUNT(*) as count
FROM public.game_participants gp
LEFT JOIN public.users u ON gp.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'Orphaned games (by creator)' as issue_type,
  COUNT(*) as count
FROM public.games g
LEFT JOIN public.users u ON g.creator_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'Total users' as issue_type,
  COUNT(*) as count
FROM public.users

UNION ALL

SELECT 
  'Total games' as issue_type,
  COUNT(*) as count
FROM public.games

UNION ALL

SELECT 
  'Total participants' as issue_type,
  COUNT(*) as count
FROM public.game_participants;

-- STEP 7: Optional - Create test users if needed for development
-- Uncomment the following if you need test users for development

/*
-- Create test users (only if needed for development)
INSERT INTO public.users (
  id, 
  email, 
  full_name, 
  username,
  created_at,
  updated_at
) VALUES 
(
  'ca2ee1cc-3ccc-4d34-8f8e-b9e02c38bfc0',
  'testuser1@example.com',
  'Test User 1',
  'testuser1',
  NOW(),
  NOW()
),
(
  '6e9f3e18-0005-4080-a62a-2a298cf52199',
  'testuser2@example.com', 
  'Test User 2',
  'testuser2',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create corresponding profiles if profiles table exists
INSERT INTO public.profiles (
  id,
  full_name,
  username,
  email,
  created_at,
  updated_at
) VALUES 
(
  'ca2ee1cc-3ccc-4d34-8f8e-b9e02c38bfc0',
  'Test User 1',
  'testuser1',
  'testuser1@example.com',
  NOW(),
  NOW()
),
(
  '6e9f3e18-0005-4080-a62a-2a298cf52199',
  'Test User 2', 
  'testuser2',
  'testuser2@example.com',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
*/
