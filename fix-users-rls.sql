-- Fix RLS policies for users table to allow profile creation
-- This fixes the "Unknown User" issue by allowing proper profile creation

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Public profiles are viewable" ON users;

-- Create more permissive policies that allow profile creation
-- Allow users to create their own profile (authenticated users only)
CREATE POLICY "Allow profile creation for authenticated users" ON users
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile  
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow public read access for game creators and participants (needed for game display)
CREATE POLICY "Public read access for game display" ON users
  FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Test the fix by trying to query users
SELECT 'Testing users query...' as status;
SELECT id, full_name, username, email FROM users LIMIT 5;
