-- Populate test users for development
-- Run this in your Supabase SQL editor to create test users

-- First, ensure we have the specific user that's showing as UUID
INSERT INTO public.users (
  id,
  full_name,
  username,
  email,
  bio,
  location,
  role,
  created_at,
  updated_at
) VALUES (
  '6e9f3e18-0005-4080-a62a-2a298cf52199',
  'Alex Johnson',
  'alexj',
  'alex.johnson@example.com',
  'Love playing basketball and tennis!',
  'San Francisco, CA',
  'user',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  bio = EXCLUDED.bio,
  location = EXCLUDED.location,
  updated_at = NOW();

-- Add more test users
INSERT INTO public.users (
  id,
  full_name,
  username,
  email,
  bio,
  location,
  role,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'Sarah Chen',
  'sarahc',
  'sarah.chen@example.com',
  'Soccer enthusiast and runner',
  'Los Angeles, CA',
  'user',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Mike Rodriguez',
  'mikerod',
  'mike.rodriguez@example.com',
  'Baseball coach and fitness trainer',
  'Austin, TX',
  'user',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Emma Wilson',
  'emmaw',
  'emma.wilson@example.com',
  'Volleyball player and yoga instructor',
  'Seattle, WA',
  'user',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Cole Guyton',
  'coleguyton',
  'coleguyton@gmail.com',
  'TribeUp Admin and Developer',
  'San Francisco, CA',
  'admin',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'David Kim',
  'davidk',
  'david.kim@example.com',
  'Tennis player and swimming coach',
  'Miami, FL',
  'user',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Verify the users were created
SELECT id, full_name, username, email FROM public.users ORDER BY created_at DESC;
