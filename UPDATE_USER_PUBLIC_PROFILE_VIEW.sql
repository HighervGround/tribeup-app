-- Update user_public_profile view to include all fields used by the app
-- This ensures the view has all necessary columns for profile reads

-- 1) Create/replace view with all public-safe fields used by app
CREATE OR REPLACE VIEW public.user_public_profile AS
SELECT
  u.id,
  COALESCE(NULLIF(u.full_name, ''), u.username, 'User') AS display_name,
  u.username,
  u.avatar_url,
  u.bio,
  u.location
FROM public.users u;

-- 2) Ensure SELECT is granted to authenticated users
GRANT SELECT ON public.user_public_profile TO authenticated;

-- 3) Optional: indexes for join performance (on base table)
-- These should already exist, but ensure they're there
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- 4) Add PostgREST relationship comments for FK-style joins (optional, for future use)
-- This allows PostgREST to understand relationships without explicit FKs
COMMENT ON VIEW public.user_public_profile IS
  E'Public user profile view\n'
  E'@relationship games.creator_profile (creator_id) -> user_public_profile.id\n'
  E'@relationship chat_messages.author_profile (user_id) -> user_public_profile.id\n'
  E'@relationship game_participants.participant_profile (user_id) -> user_public_profile.id\n';

-- Note: The app code has already been updated to:
-- - Remove all FK joins to users table
-- - Fetch user_public_profile separately and map manually
-- - Use display_name (not full_name) from the view
-- 
-- The relationship comments above are for future reference if you want to use
-- FK-style joins again. Current implementation works without them.

