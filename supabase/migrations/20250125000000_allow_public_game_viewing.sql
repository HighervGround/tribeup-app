-- Allow public viewing of games (anyone can view non-archived games)
-- Joining still requires authentication via game_participants RLS

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "games_select_consolidated" ON public.games;
DROP POLICY IF EXISTS "Anyone can view games" ON public.games;

-- Create policy that allows anyone (including anonymous) to view non-archived games
CREATE POLICY "Anyone can view non-archived games" ON public.games
  FOR SELECT USING (
    (archived = false OR archived IS NULL)
  );

-- Grant SELECT to anon role explicitly
GRANT SELECT ON public.games TO anon;
GRANT SELECT ON public.games TO authenticated;

-- Also ensure games_with_counts view is accessible
GRANT SELECT ON public.games_with_counts TO anon;
GRANT SELECT ON public.games_with_counts TO authenticated;

