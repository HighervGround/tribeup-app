-- Fix RLS policy on public.users to allow authenticated users to read user profiles
-- This fixes the "Unknown User" issue by allowing proper user lookups

-- Drop existing restrictive SELECT policies that might be blocking reads
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.users;
DROP POLICY IF EXISTS "user_self_select" ON public.users;

-- Create a permissive SELECT policy for authenticated users
-- This allows authenticated users to read basic profile info for game creators and participants
CREATE POLICY "users_select_public" ON public.users 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users' AND cmd = 'SELECT';

-- Test query to verify it works
SELECT 'Testing users SELECT policy...' as status;
SELECT id, full_name, username, avatar_url FROM public.users LIMIT 3;
