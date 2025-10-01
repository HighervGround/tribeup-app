-- EMERGENCY FIX: Create missing test users to resolve UC issue
-- Run this in Supabase SQL Editor

-- First, temporarily disable RLS to create users
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Create the missing test users
INSERT INTO public.users (
  id, 
  email, 
  full_name, 
  username,
  bio,
  location,
  role,
  created_at,
  updated_at
) VALUES 
(
  '6e9f3e18-0005-4080-a62a-2a298cf52199',
  'alex.johnson@example.com',
  'Alex Johnson',
  'alexj',
  'Love playing basketball and tennis!',
  'San Francisco, CA',
  'user',
  NOW(),
  NOW()
),
(
  'ca2ee1cc-3ccc-4d34-8f8e-b9e02c38bfc0',
  'test@example.com', 
  'Test User',
  'testuser',
  'Test user for development',
  'Test City',
  'user',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Re-enable RLS with proper policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies
DROP POLICY IF EXISTS "Users self or admin select" ON public.users;
CREATE POLICY "Users self or admin select" ON public.users 
FOR SELECT TO authenticated 
USING (
  (id = (SELECT auth.uid())) OR 
  ((auth.jwt() ->> 'user_role') = 'admin')
);

-- Allow public read access for basic user info (needed for game display)
DROP POLICY IF EXISTS "Public user info" ON public.users;
CREATE POLICY "Public user info" ON public.users 
FOR SELECT TO anon, authenticated 
USING (true);

-- Verify the fix
SELECT 
  'Users created' as status,
  COUNT(*) as count
FROM public.users
WHERE id IN (
  '6e9f3e18-0005-4080-a62a-2a298cf52199',
  'ca2ee1cc-3ccc-4d34-8f8e-b9e02c38bfc0'
);
