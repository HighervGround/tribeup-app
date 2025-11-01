-- Create creator_profile view with consistent column order
-- This view provides user profile data with display_name computed from full_name
-- Column order: id, username, full_name, display_name, avatar_url, created_at, updated_at
CREATE OR REPLACE VIEW creator_profile AS
SELECT 
  id,
  username,
  full_name,
  COALESCE(NULLIF(full_name, ''), username) AS display_name,
  avatar_url,
  created_at,
  COALESCE(updated_at, created_at) AS updated_at
FROM users
WHERE id IS NOT NULL;

-- Grant SELECT access to authenticated and anonymous users
GRANT SELECT ON creator_profile TO authenticated;
GRANT SELECT ON creator_profile TO anon;

-- Add comment with relationship hints for PostgREST
COMMENT ON VIEW creator_profile IS 
  'Public user profile view with display_name computed from full_name or username. '
  'Used as creator_profile relationship in games queries.';


