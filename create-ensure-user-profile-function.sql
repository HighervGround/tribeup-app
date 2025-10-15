-- Create idempotent profile creation function to prevent race conditions
-- This fixes the duplicate key violation errors during concurrent profile creation

CREATE OR REPLACE FUNCTION public.ensure_user_profile(
  p_email text, 
  p_username text, 
  p_full_name text, 
  p_avatar_url text DEFAULT NULL,
  p_bio text DEFAULT '',
  p_location text DEFAULT '',
  p_preferred_sports text[] DEFAULT ARRAY[]::text[]
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid := auth.uid();
  v_user public.users;
  v_final_username text;
BEGIN
  -- Ensure we have auth context
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Missing authentication context - user must be signed in';
  END IF;

  -- Generate unique username if collision occurs
  v_final_username := p_username;
  
  -- Handle username collisions by appending random suffix
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = v_final_username AND id != v_id) LOOP
    v_final_username := p_username || '_' || substr(md5(random()::text), 1, 6);
  END LOOP;

  -- Upsert the user profile (idempotent)
  INSERT INTO public.users (
    id, 
    email, 
    username, 
    full_name, 
    avatar_url, 
    bio, 
    location, 
    role, 
    preferred_sports,
    created_at,
    updated_at
  )
  VALUES (
    v_id, 
    p_email, 
    v_final_username, 
    p_full_name, 
    p_avatar_url, 
    p_bio, 
    p_location, 
    'user', 
    p_preferred_sports,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.users.avatar_url, EXCLUDED.avatar_url),
    bio = COALESCE(public.users.bio, EXCLUDED.bio),
    location = COALESCE(public.users.location, EXCLUDED.location),
    preferred_sports = COALESCE(public.users.preferred_sports, EXCLUDED.preferred_sports),
    updated_at = now()
  RETURNING * INTO v_user;

  RETURN v_user;
END;
$$;

-- Set proper permissions
REVOKE ALL ON FUNCTION public.ensure_user_profile(text, text, text, text, text, text, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile(text, text, text, text, text, text, text[]) TO authenticated;

-- Test the function works
SELECT 'Function created successfully' as status;
