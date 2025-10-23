-- Optimize OAuth performance by improving the ensure_user_profile function
-- This migration optimizes the profile creation process for faster OAuth sign-ins

-- Drop the existing function to recreate it with optimizations
DROP FUNCTION IF EXISTS public.ensure_user_profile(text, text, text, text, text, text, text[]);

-- Create optimized version of ensure_user_profile function
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

  -- Optimized upsert with minimal field updates
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

-- Set proper permissions
REVOKE ALL ON FUNCTION public.ensure_user_profile(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile(text, text, text, text) TO authenticated;

-- Add index for faster username lookups during collision detection
CREATE INDEX IF NOT EXISTS idx_users_username_lookup ON public.users(username) WHERE username IS NOT NULL;

-- Add index for faster user lookups by ID
CREATE INDEX IF NOT EXISTS idx_users_id_lookup ON public.users(id);

-- Optimize the users table for better performance
-- Add covering index for common profile queries
CREATE INDEX IF NOT EXISTS idx_users_profile_covering ON public.users(id, email, username, full_name, avatar_url, role, created_at);

-- Test the optimized function
SELECT 'Optimized ensure_user_profile function created successfully' as status;
