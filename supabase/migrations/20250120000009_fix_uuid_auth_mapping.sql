-- Fix UUID to Auth User ID mapping for RLS compatibility
-- This migration handles the transition from random UUIDs to auth user IDs
-- Using Option A: auth_user_id only (recommended approach)

-- Prerequisites: Run this mapping step first if not already done:
-- UPDATE public.users u SET auth_user_id = a.id FROM auth.users a WHERE lower(a.email) = lower(u.email) AND u.auth_user_id IS DISTINCT FROM a.id;

-- Step 1: Remove the DEFAULT uuid_generate_v4() from users.id
-- This forces clients to explicitly set id = auth.uid()
ALTER TABLE users 
ALTER COLUMN id DROP DEFAULT;

-- Step 2: Create a function to ensure auth_user_id is set correctly
CREATE OR REPLACE FUNCTION ensure_auth_user_id_mapping()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT operations, set auth_user_id to auth.uid()
  IF TG_OP = 'INSERT' THEN
    NEW.auth_user_id = auth.uid();
    
    -- If id is not provided, set it to auth.uid() as well
    IF NEW.id IS NULL THEN
      NEW.id = auth.uid();
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- For UPDATE operations, keep auth_user_id in sync
  IF TG_OP = 'UPDATE' THEN
    NEW.auth_user_id = auth.uid();
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger to ensure auth_user_id is set correctly
DROP TRIGGER IF EXISTS users_auth_id_trigger ON users;
CREATE TRIGGER users_auth_id_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_auth_user_id_mapping();

-- Step 4: Update the ensure_user_profile function to work without DEFAULT
-- The function already uses auth.uid() correctly, but let's ensure it handles the new constraint
CREATE OR REPLACE FUNCTION public.ensure_user_profile(
  p_email text, 
  p_username text, 
  p_full_name text, 
  p_avatar_url text DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid := auth.uid();
  v_user public.users;
  v_final_username text;
  v_attempts integer := 0;
  v_max_attempts integer := 3;
BEGIN
  -- Ensure we have auth context
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Missing authentication context - user must be signed in';
  END IF;

  -- Optimize username generation - use a more efficient approach
  v_final_username := p_username;
  
  -- Handle username collisions with a more efficient method
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = v_final_username AND id != v_id) AND v_attempts < v_max_attempts LOOP
    v_attempts := v_attempts + 1;
    -- Use timestamp-based suffix for better performance
    v_final_username := p_username || '_' || extract(epoch from now())::bigint % 1000000;
  END LOOP;
  
  -- If still colliding after max attempts, use UUID-based suffix
  IF EXISTS (SELECT 1 FROM public.users WHERE username = v_final_username AND id != v_id) THEN
    v_final_username := p_username || '_' || substr(v_id::text, 1, 8);
  END IF;

  -- Insert with explicit ID (no DEFAULT, must be auth.uid())
  INSERT INTO public.users (
    id, 
    email, 
    username, 
    full_name, 
    avatar_url, 
    role,
    created_at,
    updated_at
  )
  VALUES (
    v_id, 
    p_email, 
    v_final_username, 
    p_full_name, 
    p_avatar_url, 
    'user',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.users.avatar_url, EXCLUDED.avatar_url),
    updated_at = now()
  RETURNING * INTO v_user;

  RETURN v_user;
END;
$$;

-- Step 5: Create a temporary function to help with data migration
CREATE OR REPLACE FUNCTION reconcile_user_auth_mapping()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  has_auth_user BOOLEAN,
  auth_user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email,
    CASE WHEN au.id IS NOT NULL THEN true ELSE false END as has_auth_user,
    au.id as auth_user_id
  FROM users u
  LEFT JOIN auth.users au ON u.email = au.email
  WHERE u.auth_user_id IS NULL OR u.auth_user_id != au.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create a function to safely update user IDs for existing auth users
CREATE OR REPLACE FUNCTION update_user_auth_mapping()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Find users that need to be updated to match auth.users
  FOR user_record IN 
    SELECT u.id as old_id, au.id as new_id, u.email
    FROM users u
    JOIN auth.users au ON u.email = au.email
    WHERE u.id != au.id
  LOOP
    -- Update all related tables to use the new auth user ID
    -- Update games table
    UPDATE games 
    SET creator_id = user_record.new_id 
    WHERE creator_id = user_record.old_id;
    
    -- Update game_participants table
    UPDATE game_participants 
    SET user_id = user_record.new_id 
    WHERE user_id = user_record.old_id;
    
    -- Update chat_messages table
    UPDATE chat_messages 
    SET user_id = user_record.new_id 
    WHERE user_id = user_record.old_id;
    
    -- Update notifications table
    UPDATE notifications 
    SET user_id = user_record.new_id 
    WHERE user_id = user_record.old_id;
    
    -- Update the users table itself
    UPDATE users 
    SET 
      id = user_record.new_id,
      auth_user_id = user_record.new_id
    WHERE id = user_record.old_id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create a function to clean up orphaned users (users without auth accounts)
CREATE OR REPLACE FUNCTION cleanup_orphaned_users()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Find users that don't have corresponding auth.users entries
  FOR user_record IN 
    SELECT u.id, u.email
    FROM users u
    LEFT JOIN auth.users au ON u.email = au.email
    WHERE au.id IS NULL
  LOOP
    -- Delete related records first (due to foreign key constraints)
    DELETE FROM notifications WHERE user_id = user_record.id;
    DELETE FROM chat_messages WHERE user_id = user_record.id;
    DELETE FROM game_participants WHERE user_id = user_record.id;
    DELETE FROM games WHERE creator_id = user_record.id;
    
    -- Finally delete the user
    DELETE FROM users WHERE id = user_record.id;
    
    deleted_count := deleted_count + 1;
  END LOOP;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Add comments for documentation
COMMENT ON COLUMN users.auth_user_id IS 'Maps to auth.users.id for RLS compatibility';
COMMENT ON FUNCTION migrate_user_to_auth_id() IS 'Trigger function to automatically set auth_user_id on user creation/update';
COMMENT ON FUNCTION reconcile_user_auth_mapping() IS 'Helper function to identify users that need auth ID reconciliation';
COMMENT ON FUNCTION update_user_auth_mapping() IS 'Safely updates user IDs to match auth.users.id for existing users';
COMMENT ON FUNCTION cleanup_orphaned_users() IS 'Removes users that don\'t have corresponding auth.users entries';

-- Step 9: Create a comprehensive migration status view
CREATE OR REPLACE VIEW migration_status AS
SELECT 
  'Total users' as metric,
  COUNT(*) as count
FROM users
UNION ALL
SELECT 
  'Users with auth_user_id set' as metric,
  COUNT(*) as count
FROM users
WHERE auth_user_id IS NOT NULL
UNION ALL
SELECT 
  'Users matching auth.users' as metric,
  COUNT(*) as count
FROM users u
JOIN auth.users au ON u.id = au.id
UNION ALL
SELECT 
  'Orphaned users' as metric,
  COUNT(*) as count
FROM users u
LEFT JOIN auth.users au ON u.email = au.email
WHERE au.id IS NULL;
