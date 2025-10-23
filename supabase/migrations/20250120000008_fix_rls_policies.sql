-- Fix RLS policies for users table to resolve 406 errors
-- This migration ensures users can read their own profile data

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Create proper RLS policies for users table

-- Policy for SELECT: Users can read their own row
CREATE POLICY "Users can read own row" ON public.users 
FOR SELECT TO authenticated 
USING (id = auth.uid());

-- Policy for INSERT: Users can insert their own row
CREATE POLICY "Users can insert own row" ON public.users 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

-- Policy for UPDATE: Users can update their own row
CREATE POLICY "Users can update own row" ON public.users 
FOR UPDATE TO authenticated 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

-- Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Verify the policies are working by checking if we can query the table
-- This will help identify any remaining issues
