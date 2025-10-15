-- Optional hardening for game_participants system
-- Run these to make the join/leave system more robust

-- 1. Add unique constraint to prevent double-joining
-- This prevents a user from having multiple 'joined' records for the same game
ALTER TABLE public.game_participants 
ADD CONSTRAINT unique_active_participation 
EXCLUDE (game_id WITH =, user_id WITH =) 
WHERE (status = 'joined');

-- 2. Add check constraint for valid status values
ALTER TABLE public.game_participants 
ADD CONSTRAINT valid_status 
CHECK (status IN ('joined', 'left', 'kicked', 'banned'));

-- 3. Add index for faster queries and recounts
CREATE INDEX IF NOT EXISTS idx_game_participants_game_status 
ON public.game_participants (game_id, status);

-- 4. Add index for user queries
CREATE INDEX IF NOT EXISTS idx_game_participants_user_game 
ON public.game_participants (user_id, game_id);

-- 5. Ensure left_at is set when status changes to 'left'
CREATE OR REPLACE FUNCTION ensure_left_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Set left_at when status changes to 'left' and it's not already set
  IF NEW.status = 'left' AND OLD.status != 'left' AND NEW.left_at IS NULL THEN
    NEW.left_at = now();
  END IF;
  
  -- Clear left_at when rejoining
  IF NEW.status = 'joined' AND OLD.status != 'joined' THEN
    NEW.left_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the timestamp trigger
DROP TRIGGER IF EXISTS ensure_left_at_trigger ON public.game_participants;
CREATE TRIGGER ensure_left_at_trigger
  BEFORE UPDATE ON public.game_participants
  FOR EACH ROW
  EXECUTE FUNCTION ensure_left_at_timestamp();

-- 6. Add RLS policy for authenticated users to see participants in their games
-- This allows users to see who else is in games they've joined
CREATE POLICY "users_can_see_participants_in_joined_games" ON public.game_participants
  FOR SELECT
  TO authenticated
  USING (
    -- User can see participants in games they've joined or created
    game_id IN (
      SELECT g.id FROM public.games g 
      WHERE g.creator_id = auth.uid()
      UNION
      SELECT gp.game_id FROM public.game_participants gp 
      WHERE gp.user_id = auth.uid()
    )
  );

-- 7. Verify the hardening
SELECT 'Hardening applied successfully!' as status;

-- Show current constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.game_participants'::regclass;

-- Show current indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'game_participants' AND schemaname = 'public';
