-- TribeUp Social Sports App - Security Policies and Functions
-- This consolidates all RLS policies, functions, and triggers

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view public profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Games policies
CREATE POLICY "Anyone can view non-archived games" ON games
  FOR SELECT USING (is_archived = false OR creator_id = auth.uid());

CREATE POLICY "Authenticated users can create games" ON games
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Game creators can update their games" ON games
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Game creators can delete their games" ON games
  FOR DELETE USING (auth.uid() = creator_id);

-- Game participants policies
CREATE POLICY "Anyone can view game participants" ON game_participants
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join games" ON game_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave games" ON game_participants
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update their participation" ON game_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Waitlist policies
CREATE POLICY "Anyone can view waitlist" ON game_waitlist
  FOR SELECT USING (true);

CREATE POLICY "Users can join waitlist" ON game_waitlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave waitlist" ON game_waitlist
  FOR DELETE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Game participants can view messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_participants 
      WHERE game_id = chat_messages.game_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Game participants can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM game_participants 
      WHERE game_id = chat_messages.game_id AND user_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- User presence policies
CREATE POLICY "Anyone can view user presence" ON user_presence
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own presence" ON user_presence
  FOR ALL USING (auth.uid() = user_id);

-- Core game management functions
CREATE OR REPLACE FUNCTION join_game(game_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  game_record games%ROWTYPE;
  participant_count INTEGER;
  result JSONB;
BEGIN
  -- Get game details
  SELECT * INTO game_record FROM games WHERE id = game_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Game not found');
  END IF;
  
  -- Check if game is full
  SELECT COUNT(*) INTO participant_count FROM game_participants WHERE game_id = game_uuid;
  
  IF participant_count >= game_record.max_players THEN
    -- Add to waitlist instead
    INSERT INTO game_waitlist (game_id, user_id, position)
    VALUES (game_uuid, auth.uid(), (SELECT COALESCE(MAX(position), 0) + 1 FROM game_waitlist WHERE game_id = game_uuid))
    ON CONFLICT (game_id, user_id) DO NOTHING;
    
    RETURN jsonb_build_object('success', true, 'waitlisted', true);
  END IF;
  
  -- Join the game
  INSERT INTO game_participants (game_id, user_id)
  VALUES (game_uuid, auth.uid())
  ON CONFLICT (game_id, user_id) DO NOTHING;
  
  -- Update current players count
  UPDATE games 
  SET current_players = (
    SELECT COUNT(*) 
    FROM game_participants 
    WHERE game_id = game_uuid AND status = 'joined'
  )
  WHERE id = game_uuid;
  
  RETURN jsonb_build_object('success', true, 'joined', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION leave_game(game_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  next_waitlist_user UUID;
BEGIN
  -- Remove participant
  DELETE FROM game_participants 
  WHERE game_id = game_uuid AND user_id = auth.uid();
  
  -- Update current players count
  UPDATE games 
  SET current_players = (
    SELECT COUNT(*) 
    FROM game_participants 
    WHERE game_id = game_uuid AND status = 'joined'
  )
  WHERE id = game_uuid;
  
  -- Move next person from waitlist
  SELECT user_id INTO next_waitlist_user
  FROM game_waitlist 
  WHERE game_id = game_uuid 
  ORDER BY position ASC 
  LIMIT 1;
  
  IF next_waitlist_user IS NOT NULL THEN
    -- Add to participants
    INSERT INTO game_participants (game_id, user_id)
    VALUES (game_uuid, next_waitlist_user);
    
    -- Remove from waitlist
    DELETE FROM game_waitlist 
    WHERE game_id = game_uuid AND user_id = next_waitlist_user;
    
    -- Update positions
    UPDATE game_waitlist 
    SET position = position - 1 
    WHERE game_id = game_uuid;
    
    -- Update current players count again
    UPDATE games 
    SET current_players = (
      SELECT COUNT(*) 
      FROM game_participants 
      WHERE game_id = game_uuid AND status = 'joined'
    )
    WHERE id = game_uuid;
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Archive old games function
CREATE OR REPLACE FUNCTION archive_old_games()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE games 
  SET is_archived = true, archived_at = NOW()
  WHERE date < CURRENT_DATE - INTERVAL '1 day' 
    AND is_archived = false;
    
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Update user stats trigger
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- User joined a game
    UPDATE users 
    SET games_played = games_played + 1,
        last_activity = NOW(),
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    -- Update creator's hosted games count
    UPDATE users 
    SET games_hosted = games_hosted + 1,
        updated_at = NOW()
    WHERE id = (SELECT creator_id FROM games WHERE id = NEW.game_id);
        
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Status changed (e.g., completed game)
    IF NEW.status = 'completed' AND NEW.play_time_minutes > 0 THEN
      UPDATE users 
      SET total_play_time_minutes = total_play_time_minutes + NEW.play_time_minutes,
          last_activity = NOW(),
          updated_at = NOW()
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats
  AFTER INSERT OR UPDATE ON game_participants
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_participants_updated_at BEFORE UPDATE ON game_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
