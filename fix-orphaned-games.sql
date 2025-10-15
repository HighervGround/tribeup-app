-- Fix orphaned games by creating a default user for them
-- This prevents "Unknown User" display issues

-- First, create a default user for orphaned games
INSERT INTO users (
  id,
  email,
  full_name,
  username,
  avatar_url,
  bio,
  location,
  role,
  preferred_sports,
  created_at,
  updated_at
) VALUES (
  'ca2ee1cc-3ccc-4d34-8f8e-b9e02c38bfc0',
  'demo@tribeup.com',
  'Demo User',
  'demo_user',
  '',
  'Demo account for sample games',
  'Gainesville, FL',
  'user',
  ARRAY['basketball', 'soccer', 'pickleball', 'baseball'],
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  username = EXCLUDED.username,
  updated_at = NOW();

-- Verify the fix
SELECT 
  g.id,
  g.title,
  g.creator_id,
  u.full_name as creator_name,
  u.email as creator_email
FROM games g
LEFT JOIN users u ON g.creator_id = u.id
ORDER BY g.created_at DESC
LIMIT 10;
