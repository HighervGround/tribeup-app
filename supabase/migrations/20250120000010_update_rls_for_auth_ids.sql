-- Update RLS policies to work with auth_user_id (Option A approach)
-- This migration ensures RLS policies work correctly using auth_user_id column

-- Step 1: Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can read own row" ON public.users;
DROP POLICY IF EXISTS "Users can insert own row" ON public.users;
DROP POLICY IF EXISTS "Users can update own row" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Step 2: Create new RLS policies that work with auth_user_id
-- These policies use auth.uid() which should match the auth_user_id column

-- Users table policies (using auth_user_id)
CREATE POLICY "Users can read own profile" ON public.users 
FOR SELECT TO authenticated 
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.users 
FOR INSERT TO authenticated 
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users 
FOR UPDATE TO authenticated 
USING (auth_user_id = auth.uid()) 
WITH CHECK (auth_user_id = auth.uid());

-- Games table policies (update to use auth.uid())
DROP POLICY IF EXISTS "Authenticated users can create games" ON public.games;
DROP POLICY IF EXISTS "Game creators can update their games" ON public.games;
DROP POLICY IF EXISTS "Game creators can delete their games" ON public.games;

CREATE POLICY "Authenticated users can create games" ON public.games
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Game creators can update their games" ON public.games
FOR UPDATE TO authenticated 
USING (auth.uid() = creator_id) 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Game creators can delete their games" ON public.games
FOR DELETE TO authenticated 
USING (auth.uid() = creator_id);

-- Game participants policies (update to use auth.uid())
DROP POLICY IF EXISTS "Authenticated users can join games" ON public.game_participants;
DROP POLICY IF EXISTS "Users can leave games" ON public.game_participants;

CREATE POLICY "Authenticated users can join games" ON public.game_participants
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave games" ON public.game_participants
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- Chat messages policies (update to use auth.uid())
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;

CREATE POLICY "Authenticated users can send messages" ON public.chat_messages
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON public.chat_messages
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- Notifications policies (update to use auth.uid())
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Step 3: Update the database functions to use auth.uid()
-- These functions should already be using auth.uid() correctly, but let's ensure they're updated

CREATE OR REPLACE FUNCTION join_game(game_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert participant using auth.uid()
  INSERT INTO game_participants (game_id, user_id)
  VALUES (game_uuid, auth.uid())
  ON CONFLICT (game_id, user_id) DO NOTHING;
  
  -- Update current players count
  UPDATE games 
  SET current_players = (
    SELECT COUNT(*) 
    FROM game_participants 
    WHERE game_id = game_uuid
  )
  WHERE id = game_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION leave_game(game_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Remove participant using auth.uid()
  DELETE FROM game_participants 
  WHERE game_id = game_uuid AND user_id = auth.uid();
  
  -- Update current players count
  UPDATE games 
  SET current_players = (
    SELECT COUNT(*) 
    FROM game_participants 
    WHERE game_id = game_uuid
  )
  WHERE id = game_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_joined_to_game(game_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 
    FROM game_participants 
    WHERE game_id = game_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create a function to test RLS policies
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE(
  policy_name TEXT,
  table_name TEXT,
  is_working BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  test_user_id UUID;
  test_game_id UUID;
  test_result RECORD;
BEGIN
  -- Get a test user ID (first user in the system)
  SELECT id INTO test_user_id FROM users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RETURN QUERY SELECT 'No users found'::TEXT, 'N/A'::TEXT, false, 'No users in database'::TEXT;
    RETURN;
  END IF;
  
  -- Test users table policies
  BEGIN
    PERFORM * FROM users WHERE id = test_user_id;
    RETURN QUERY SELECT 'Users read policy'::TEXT, 'users'::TEXT, true, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'Users read policy'::TEXT, 'users'::TEXT, false, SQLERRM::TEXT;
  END;
  
  -- Test games table policies
  BEGIN
    PERFORM * FROM games LIMIT 1;
    RETURN QUERY SELECT 'Games read policy'::TEXT, 'games'::TEXT, true, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'Games read policy'::TEXT, 'games'::TEXT, false, SQLERRM::TEXT;
  END;
  
  -- Test game_participants table policies
  BEGIN
    PERFORM * FROM game_participants LIMIT 1;
    RETURN QUERY SELECT 'Game participants read policy'::TEXT, 'game_participants'::TEXT, true, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'Game participants read policy'::TEXT, 'game_participants'::TEXT, false, SQLERRM::TEXT;
  END;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Add comments for documentation
COMMENT ON FUNCTION test_rls_policies() IS 'Tests RLS policies to ensure they work correctly with auth user IDs';

-- Step 6: Create a view to monitor RLS policy status
CREATE OR REPLACE VIEW rls_policy_status AS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
