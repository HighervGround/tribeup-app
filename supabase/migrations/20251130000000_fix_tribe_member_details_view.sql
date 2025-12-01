-- Fix tribe_member_details view to use users table and compute display_name correctly
-- The view was joining user_profiles which may not exist or have the correct fields
-- This updates it to join users table and compute display_name from full_name, username, or email

CREATE OR REPLACE VIEW public.tribe_member_details AS
SELECT 
  tm.id,
  tm.tribe_id,
  tm.user_id,
  tm.role,
  tm.status,
  tm.joined_at,
  tm.invited_by,
  COALESCE(NULLIF(u.full_name, ''), u.username, split_part(u.email, '@', 1)) AS display_name,
  u.username,
  u.avatar_url,
  u.email
FROM public.tribe_members tm
JOIN public.users u ON u.id = tm.user_id
WHERE tm.status = 'active';

-- Grant access to the updated view
GRANT SELECT ON public.tribe_member_details TO authenticated;

-- Update comment
COMMENT ON VIEW public.tribe_member_details IS 
  'Tribe members with user profile information. display_name is computed from full_name, username, or email.';

