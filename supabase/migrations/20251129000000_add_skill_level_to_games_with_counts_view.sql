-- Add skill_level to games_with_counts view
-- This ensures skill_level is accessible through the view for filtering and display
-- Based on the latest view definition from 20250204000000_fix_games_with_counts_security.sql

DROP VIEW IF EXISTS public.games_with_counts CASCADE;

-- Recreate view with skill_level added, matching the structure of the latest view
CREATE OR REPLACE VIEW public.games_with_counts AS
SELECT 
  g.id,
  g.title,
  g.sport,
  g.description,
  g.location,
  g.latitude,
  g.longitude,
  g.date,
  g.time,
  g.cost,
  g.max_players,
  g.image_url,
  g.creator_id,
  g.created_at,
  g.archived,
  g.duration,
  g.duration_minutes,
  g.skill_level,  -- Add skill_level column
  g.planned_route,
  -- Live count of authenticated participants (status = 'joined')
  COALESCE(private_count.count, 0)::integer AS current_players,
  -- For backward compatibility, keep public_rsvp_count but set to 0
  0::integer AS public_rsvp_count,
  -- Total participants = current_players only (no public RSVPs)
  COALESCE(private_count.count, 0)::integer AS total_players,
  -- Available spots based on authenticated participants only
  GREATEST(0, g.max_players - COALESCE(private_count.count, 0))::integer AS available_spots
FROM public.games g
-- Count authenticated participants with status='joined'
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS count
  FROM public.game_participants gp
  WHERE gp.game_id = g.id 
    AND gp.status = 'joined'
) private_count ON true
WHERE (g.archived = false OR g.archived IS NULL);

-- Grant access to authenticated and anonymous users
GRANT SELECT ON public.games_with_counts TO authenticated;
GRANT SELECT ON public.games_with_counts TO anon;

-- Add comment explaining the view
COMMENT ON VIEW public.games_with_counts IS 
  'Public view of active games with live participant counts and skill_level. '
  'Shows all non-archived games. '
  'current_players = authenticated participants with status=joined. '
  'public_rsvp_count = anonymous RSVPs with attending=true (currently 0). '
  'total_players = current_players + public_rsvp_count. '
  'available_spots = max_players - total_players (minimum 0). '
  'skill_level = game skill level (beginner, intermediate, advanced, mixed). '
  'All counts are computed live for maximum accuracy.';

