-- ============================================================================
-- Add duration_minutes to games_with_counts view
-- ============================================================================
-- This migration updates the games_with_counts view to include duration_minutes
-- column for consistent integer duration handling in the frontend

-- Drop and recreate the view with duration_minutes included
DROP VIEW IF EXISTS public.games_with_counts;

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
  g.duration_minutes,  -- Add duration_minutes for frontend integer handling
  -- Live count of authenticated participants (status = 'joined')
  COALESCE(private_count.count, 0)::integer AS current_players,
  -- Live count of public RSVPs (attending = true)
  COALESCE(public_count.count, 0)::integer AS public_rsvp_count,
  -- Total participants (private + public)
  (COALESCE(private_count.count, 0) + COALESCE(public_count.count, 0))::integer AS total_players,
  -- Available spots
  GREATEST(0, g.max_players - (COALESCE(private_count.count, 0) + COALESCE(public_count.count, 0)))::integer AS available_spots
FROM public.games g
-- Count authenticated participants
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS count
  FROM public.game_participants gp
  WHERE gp.game_id = g.id 
    AND gp.status = 'joined'
) private_count ON true
-- Count public RSVPs
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS count
  FROM public.public_rsvps pr
  WHERE pr.game_id = g.id 
    AND pr.attending = true
) public_count ON true;

-- Grant access to authenticated and anonymous users
GRANT SELECT ON public.games_with_counts TO authenticated;
GRANT SELECT ON public.games_with_counts TO anon;

-- Add helpful comment
COMMENT ON VIEW public.games_with_counts IS 
  'Real-time game view with live participant counts and duration_minutes for frontend. '
  'current_players = authenticated participants with status=joined. '
  'public_rsvp_count = anonymous RSVPs with attending=true. '
  'total_players = current_players + public_rsvp_count. '
  'available_spots = max_players - total_players (minimum 0). '
  'duration_minutes = integer duration for clean frontend handling.';
