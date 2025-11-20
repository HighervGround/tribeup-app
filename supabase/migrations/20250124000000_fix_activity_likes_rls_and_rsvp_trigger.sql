-- Fix activity_likes RLS policies
-- Ensure proper read/write access for authenticated users

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS public.activity_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "likes_read" ON public.activity_likes;
DROP POLICY IF EXISTS "likes_write" ON public.activity_likes;
DROP POLICY IF EXISTS "likes_delete_own" ON public.activity_likes;
DROP POLICY IF EXISTS "Authenticated users can view activity likes" ON public.activity_likes;
DROP POLICY IF EXISTS "Authenticated users can insert their own activity likes" ON public.activity_likes;
DROP POLICY IF EXISTS "Authenticated users can delete their own activity likes" ON public.activity_likes;

-- Create proper RLS policies for activity_likes
CREATE POLICY "likes_read"
ON public.activity_likes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "likes_write"
ON public.activity_likes
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "likes_delete_own"
ON public.activity_likes
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Create trigger to automatically set user_id on RSVP insert
-- This allows clients to omit user_id in the payload
CREATE OR REPLACE FUNCTION public.set_rsvp_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := (SELECT auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS set_rsvp_user_id_tg ON public.rsvps;

-- Create trigger
CREATE TRIGGER set_rsvp_user_id_tg
BEFORE INSERT ON public.rsvps
FOR EACH ROW 
EXECUTE FUNCTION public.set_rsvp_user_id();

-- Create game_public_rsvps view for backward compatibility (if needed)
-- This view joins rsvps with user profiles for public display
CREATE OR REPLACE VIEW public.game_public_rsvps AS
SELECT
  r.game_id,
  r.user_id,
  r.status,
  r.created_at,
  up.display_name,
  up.avatar_url
FROM public.rsvps r
LEFT JOIN public.user_profiles up ON up.user_id = r.user_id
WHERE r.status = 'going';

-- Grant access to the view
GRANT SELECT ON public.game_public_rsvps TO authenticated, anon;

