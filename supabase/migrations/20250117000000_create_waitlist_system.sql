-- Create waitlist system for games that reach capacity
-- This migration creates the waitlist functionality with automatic notifications

-- 1. Create game_waitlist table
CREATE TABLE IF NOT EXISTS public.game_waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  position integer NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  notified_at timestamp with time zone,
  expires_at timestamp with time zone,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'expired', 'joined')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(game_id, user_id)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_waitlist_game_id ON public.game_waitlist(game_id);
CREATE INDEX IF NOT EXISTS idx_game_waitlist_user_id ON public.game_waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_game_waitlist_position ON public.game_waitlist(game_id, position);
CREATE INDEX IF NOT EXISTS idx_game_waitlist_status ON public.game_waitlist(status);
CREATE INDEX IF NOT EXISTS idx_game_waitlist_expires_at ON public.game_waitlist(expires_at) WHERE expires_at IS NOT NULL;

-- 3. Enable RLS
ALTER TABLE public.game_waitlist ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view waitlist for games they're interested in" ON public.game_waitlist
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can join waitlists" ON public.game_waitlist
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave waitlists" ON public.game_waitlist
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can update waitlist status" ON public.game_waitlist
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Function to join waitlist
CREATE OR REPLACE FUNCTION public.join_waitlist(game_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  game_max_players integer;
  game_current_players integer;
  waitlist_position integer;
  result json;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check if game exists and get capacity info
  SELECT max_players, current_players 
  INTO game_max_players, game_current_players
  FROM public.games 
  WHERE id = game_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game not found';
  END IF;

  -- Check if user is already in the game
  IF EXISTS (
    SELECT 1 FROM public.game_participants 
    WHERE game_id = game_uuid AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'User already joined this game';
  END IF;

  -- Check if user is already on waitlist
  IF EXISTS (
    SELECT 1 FROM public.game_waitlist 
    WHERE game_id = game_uuid AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'User already on waitlist for this game';
  END IF;

  -- Check if game is at capacity
  IF game_current_players < game_max_players THEN
    RAISE EXCEPTION 'Game has available spots, join the game directly';
  END IF;

  -- Get next position in waitlist
  SELECT COALESCE(MAX(position), 0) + 1
  INTO waitlist_position
  FROM public.game_waitlist
  WHERE game_id = game_uuid;

  -- Add to waitlist
  INSERT INTO public.game_waitlist (game_id, user_id, position)
  VALUES (game_uuid, current_user_id, waitlist_position);

  -- Create notification for user
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    current_user_id,
    'waitlist_joined',
    'Added to Waitlist',
    'You have been added to the waitlist for this game. You are position #' || waitlist_position || ' in line.',
    json_build_object('gameId', game_uuid, 'position', waitlist_position)
  );

  result := json_build_object(
    'success', true,
    'position', waitlist_position,
    'message', 'Successfully added to waitlist at position ' || waitlist_position
  );

  RETURN result;
END;
$$;

-- 6. Function to leave waitlist
CREATE OR REPLACE FUNCTION public.leave_waitlist(game_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  user_position integer;
  result json;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get user's position before removing
  SELECT position INTO user_position
  FROM public.game_waitlist
  WHERE game_id = game_uuid AND user_id = current_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not on waitlist for this game';
  END IF;

  -- Remove from waitlist
  DELETE FROM public.game_waitlist
  WHERE game_id = game_uuid AND user_id = current_user_id;

  -- Update positions for users behind this user
  UPDATE public.game_waitlist
  SET position = position - 1
  WHERE game_id = game_uuid AND position > user_position;

  result := json_build_object(
    'success', true,
    'message', 'Successfully removed from waitlist'
  );

  RETURN result;
END;
$$;

-- 7. Function to process waitlist when spot opens up
CREATE OR REPLACE FUNCTION public.process_waitlist_notification(game_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_user_id uuid;
  next_position integer;
  game_title text;
  notification_expires_at timestamp with time zone;
  result json;
BEGIN
  -- Get game title
  SELECT title INTO game_title FROM public.games WHERE id = game_uuid;
  
  -- Get next user in waitlist
  SELECT user_id, position
  INTO next_user_id, next_position
  FROM public.game_waitlist
  WHERE game_id = game_uuid AND status = 'waiting'
  ORDER BY position ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'No users in waitlist');
  END IF;

  -- Set expiration time (24 hours from now)
  notification_expires_at := now() + interval '24 hours';

  -- Update waitlist entry
  UPDATE public.game_waitlist
  SET 
    status = 'notified',
    notified_at = now(),
    expires_at = notification_expires_at
  WHERE game_id = game_uuid AND user_id = next_user_id;

  -- Create notification for the user
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    next_user_id,
    'waitlist_spot_available',
    'Spot Available!',
    'A spot has opened up in "' || game_title || '". You have 24 hours to join before it goes to the next person.',
    json_build_object(
      'gameId', game_uuid,
      'expiresAt', notification_expires_at,
      'action', 'join_from_waitlist'
    )
  );

  result := json_build_object(
    'success', true,
    'notified_user_id', next_user_id,
    'position', next_position,
    'expires_at', notification_expires_at
  );

  RETURN result;
END;
$$;

-- 8. Function to join game from waitlist
CREATE OR REPLACE FUNCTION public.join_from_waitlist(game_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  waitlist_entry record;
  game_info record;
  result json;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get waitlist entry
  SELECT * INTO waitlist_entry
  FROM public.game_waitlist
  WHERE game_id = game_uuid AND user_id = current_user_id AND status = 'notified';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No valid waitlist notification found for this game';
  END IF;

  -- Check if notification has expired
  IF waitlist_entry.expires_at < now() THEN
    RAISE EXCEPTION 'Waitlist notification has expired';
  END IF;

  -- Get game info
  SELECT max_players, current_players INTO game_info
  FROM public.games WHERE id = game_uuid;

  -- Check if spot is still available
  IF game_info.current_players >= game_info.max_players THEN
    RAISE EXCEPTION 'Game is now full';
  END IF;

  -- Join the game using existing function
  PERFORM public.join_game(game_uuid);

  -- Update waitlist status
  UPDATE public.game_waitlist
  SET status = 'joined'
  WHERE game_id = game_uuid AND user_id = current_user_id;

  -- Update positions for remaining waitlist users
  UPDATE public.game_waitlist
  SET position = position - 1
  WHERE game_id = game_uuid AND position > waitlist_entry.position AND status = 'waiting';

  result := json_build_object(
    'success', true,
    'message', 'Successfully joined game from waitlist'
  );

  RETURN result;
END;
$$;

-- 9. Function to clean up expired waitlist notifications
CREATE OR REPLACE FUNCTION public.cleanup_expired_waitlist()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count integer := 0;
  expired_entry record;
BEGIN
  -- Process expired notifications
  FOR expired_entry IN 
    SELECT game_id, user_id, position
    FROM public.game_waitlist
    WHERE status = 'notified' AND expires_at < now()
  LOOP
    -- Update status to expired
    UPDATE public.game_waitlist
    SET status = 'expired'
    WHERE game_id = expired_entry.game_id AND user_id = expired_entry.user_id;

    -- Update positions for remaining users
    UPDATE public.game_waitlist
    SET position = position - 1
    WHERE game_id = expired_entry.game_id 
      AND position > expired_entry.position 
      AND status = 'waiting';

    -- Try to notify next person
    PERFORM public.process_waitlist_notification(expired_entry.game_id);

    expired_count := expired_count + 1;
  END LOOP;

  RETURN expired_count;
END;
$$;

-- 10. Trigger to automatically process waitlist when someone leaves a game
CREATE OR REPLACE FUNCTION public.handle_game_leave_waitlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Process waitlist for the game
  PERFORM public.process_waitlist_notification(OLD.game_id);
  RETURN OLD;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_game_leave_waitlist ON public.game_participants;
CREATE TRIGGER trigger_game_leave_waitlist
  AFTER DELETE ON public.game_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_game_leave_waitlist();

-- 11. Grant permissions
GRANT EXECUTE ON FUNCTION public.join_waitlist(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_waitlist(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_waitlist_notification(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_from_waitlist(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_waitlist() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_waitlist() TO service_role;
