-- ============================================================================
-- Create games_with_counts view with LIVE participant counting
-- ============================================================================
-- This migration creates a view that counts participants in real-time
-- and fixes the RLS policy column name issue

-- First, fix the RLS policy column name mismatch
DROP POLICY IF EXISTS "games_select_consolidated" ON public.games;

CREATE POLICY "games_select_consolidated" ON public.games
  FOR SELECT USING (
    (archived = false OR archived IS NULL) OR 
    (creator_id = (SELECT auth.uid())) OR 
    (((SELECT auth.jwt()) ->> 'role') = 'admin')
  );

-- Fix the index to use correct column name
DROP INDEX IF EXISTS idx_games_archived;
CREATE INDEX IF NOT EXISTS idx_games_archived ON public.games(archived) 
WHERE archived = false OR archived IS NULL;

-- Drop old view if it exists
DROP VIEW IF EXISTS public.games_with_counts;

-- Create games_with_counts view with LIVE counts using LATERAL joins
-- This ensures counts are always accurate and up-to-date
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
  'Real-time game view with live participant counts. '
  'current_players = authenticated participants with status=joined. '
  'public_rsvp_count = anonymous RSVPs with attending=true. '
  'total_players = current_players + public_rsvp_count. '
  'available_spots = max_players - total_players. '
  'All counts are computed live for maximum accuracy.';

-- ============================================================================
-- Create game_rsvp_stats view for public game pages
-- ============================================================================
-- This view provides detailed capacity statistics for public game pages

CREATE OR REPLACE VIEW public.game_rsvp_stats AS
SELECT 
  g.id AS game_id,
  g.max_players AS capacity,
  
  -- Live count of authenticated participants (private RSVPs)
  COALESCE(
    (SELECT COUNT(*) 
     FROM public.game_participants gp 
     WHERE gp.game_id = g.id AND gp.status = 'joined'),
    0
  )::integer AS private_rsvp_count,
  
  -- Live count of anonymous RSVPs (public RSVPs)
  COALESCE(
    (SELECT COUNT(*) 
     FROM public.public_rsvps pr 
     WHERE pr.game_id = g.id AND pr.attending = true),
    0
  )::integer AS public_rsvp_count,
  
  -- Calculate total RSVPs
  (
    COALESCE(
      (SELECT COUNT(*) 
       FROM public.game_participants gp 
       WHERE gp.game_id = g.id AND gp.status = 'joined'),
      0
    ) + COALESCE(
      (SELECT COUNT(*) 
       FROM public.public_rsvps pr 
       WHERE pr.game_id = g.id AND pr.attending = true),
      0
    )
  )::integer AS total_rsvps,
  
  -- Calculate remaining capacity
  GREATEST(
    0,
    g.max_players - (
      COALESCE(
        (SELECT COUNT(*) 
         FROM public.game_participants gp 
         WHERE gp.game_id = g.id AND gp.status = 'joined'),
        0
      ) + COALESCE(
        (SELECT COUNT(*) 
         FROM public.public_rsvps pr 
         WHERE pr.game_id = g.id AND pr.attending = true),
        0
      )
    )
  )::integer AS capacity_remaining
  
FROM public.games g;

-- Grant access to authenticated and anonymous users
GRANT SELECT ON public.game_rsvp_stats TO authenticated;
GRANT SELECT ON public.game_rsvp_stats TO anon;

-- Add helpful comment
COMMENT ON VIEW public.game_rsvp_stats IS 
  'Real-time game capacity statistics combining authenticated participants '
  'and anonymous public RSVPs. Used by public game pages and Edge Functions. '
  'All counts are computed live for maximum accuracy.';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  view_count INTEGER;
  stats_count INTEGER;
BEGIN
  -- Check that games_with_counts view exists and is queryable
  SELECT COUNT(*) INTO view_count 
  FROM public.games_with_counts 
  LIMIT 1;
  
  -- Check that game_rsvp_stats view exists and is queryable
  SELECT COUNT(*) INTO stats_count 
  FROM public.game_rsvp_stats 
  LIMIT 1;
  
  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  - games_with_counts view created with live counts';
  RAISE NOTICE '  - game_rsvp_stats view created with live counts';
  RAISE NOTICE '  - RLS policy fixed (archived column)';
  RAISE NOTICE '  - Index fixed (archived column)';
END;
$$;

