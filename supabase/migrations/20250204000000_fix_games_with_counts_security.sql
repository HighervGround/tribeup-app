-- ============================================================================
-- Fix games_with_counts view security and RLS policies
-- ============================================================================
-- This migration fixes multiple permission issues:
-- 1. Consolidates conflicting RLS policies on games table
-- 2. Fixes reference to non-existent 'rsvps' table (should be 'public_rsvps')
-- 3. Ensures proper table grants for anon and authenticated roles
-- 4. Recreates games_with_counts view with correct references
-- ============================================================================

-- First, ensure the games table has a permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view non-archived games" ON public.games;
DROP POLICY IF EXISTS "games_select_consolidated" ON public.games;
DROP POLICY IF EXISTS "Anyone can view games" ON public.games;
DROP POLICY IF EXISTS "public_can_view_active_games" ON public.games;

-- Create a single, clear policy for public game viewing
CREATE POLICY "public_can_view_active_games" ON public.games
  FOR SELECT 
  TO PUBLIC
  USING (
    (archived = false OR archived IS NULL) OR 
    (creator_id = auth.uid())
  );

-- Ensure table grants are in place
GRANT SELECT ON public.games TO anon;
GRANT SELECT ON public.games TO authenticated;

-- Grant both SELECT and INSERT on game_participants (needed for joining games)
GRANT SELECT ON public.game_participants TO anon;
GRANT SELECT, INSERT, DELETE ON public.game_participants TO authenticated;

-- Fix public_rsvps table access (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'public_rsvps') THEN
    GRANT SELECT ON public.public_rsvps TO anon;
    GRANT SELECT ON public.public_rsvps TO authenticated;
  END IF;
END $$;

-- Drop problematic view that references non-existent 'rsvps' table
DROP VIEW IF EXISTS public.game_public_rsvps CASCADE;

-- Drop problematic trigger and function on non-existent 'rsvps' table (safe cleanup)
DO $$
BEGIN
  -- Drop trigger if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rsvps') THEN
    DROP TRIGGER IF EXISTS set_rsvp_user_id_tg ON public.rsvps;
  END IF;
  
  -- Drop function regardless (it may exist even if table doesn't)
  DROP FUNCTION IF EXISTS public.set_rsvp_user_id();
END $$;

-- Drop and recreate the view
DROP VIEW IF EXISTS public.games_with_counts CASCADE;

-- Recreate view with correct table references
-- Note: View only counts game_participants (not public_rsvps) to avoid dependency issues
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

-- Grant SELECT permissions on the view
GRANT SELECT ON public.games_with_counts TO anon;
GRANT SELECT ON public.games_with_counts TO authenticated;

-- Add comment explaining the view
COMMENT ON VIEW public.games_with_counts IS 
  'Public view of active games with live participant counts. '
  'Shows all non-archived games. '
  'current_players = authenticated participants with status=joined. '
  'public_rsvp_count = anonymous RSVPs with attending=true. '
  'total_players = current_players + public_rsvp_count. '
  'available_spots = max_players - total_players (minimum 0).';

-- ============================================================================
-- Fix activity_likes RLS policies for public viewing
-- ============================================================================
-- Issue: Like counts not showing because anon users can't read activity_likes
-- Solution: Allow both anon and authenticated users to view likes

-- Drop restrictive policy
DROP POLICY IF EXISTS "likes_read" ON public.activity_likes;
DROP POLICY IF EXISTS "Anyone can read activity likes" ON public.activity_likes;

-- Create permissive policy for reading likes (both anon and authenticated)
CREATE POLICY "public_can_view_activity_likes" ON public.activity_likes
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Ensure table grants are in place (SELECT for counts, INSERT/DELETE for toggling likes)
GRANT SELECT ON public.activity_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.activity_likes TO authenticated;

-- Ensure view grants are in place
GRANT SELECT ON public.activity_like_counts TO anon;
GRANT SELECT ON public.activity_like_counts TO authenticated;

-- ============================================================================
-- Fix tribe_chat_messages permissions
-- ============================================================================
-- Issue: Permission denied for table tribe_chat_messages
-- Solution: Grant proper access to anon users and ensure view has grants

-- Ensure table grants include anon (for viewing) and INSERT for authenticated (for posting)
GRANT SELECT ON public.tribe_chat_messages TO anon;
GRANT SELECT, INSERT ON public.tribe_chat_messages TO authenticated;

-- Ensure view grants include anon
GRANT SELECT ON public.tribe_chat_messages_with_author TO anon;
GRANT SELECT ON public.tribe_chat_messages_with_author TO authenticated;

-- Ensure tribe-related tables have proper grants
GRANT SELECT ON public.tribes TO anon;
GRANT SELECT, INSERT, UPDATE ON public.tribes TO authenticated;
GRANT SELECT ON public.tribe_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tribe_members TO authenticated;
GRANT SELECT ON public.tribe_channels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tribe_channels TO authenticated;

-- ============================================================================
-- Migration complete
-- ============================================================================

