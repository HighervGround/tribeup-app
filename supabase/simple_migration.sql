-- TribeUp - One Simple Migration for Everything
-- Run this once and you're done!

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  preferred_sports TEXT[],
  role TEXT DEFAULT 'user',
  reputation_score INTEGER DEFAULT 100,
  games_played INTEGER DEFAULT 0,
  games_hosted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  sport TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER DEFAULT 60,
  cost TEXT DEFAULT 'FREE',
  max_players INTEGER NOT NULL,
  current_players INTEGER DEFAULT 0,
  description TEXT,
  skill_level TEXT DEFAULT 'mixed',
  min_reputation INTEGER DEFAULT 70,
  competitive_mode BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game Participants
CREATE TABLE game_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Chat
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Basic indexes
CREATE INDEX idx_games_date ON games(date);
CREATE INDEX idx_games_sport ON games(sport);
CREATE INDEX idx_games_creator ON games(creator_id);
CREATE INDEX idx_participants_game ON game_participants(game_id);
CREATE INDEX idx_participants_user ON game_participants(user_id);

-- Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Own profile" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Public read games" ON games FOR SELECT USING (is_archived = false);
CREATE POLICY "Own games" ON games FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Public read participants" ON game_participants FOR SELECT USING (true);
CREATE POLICY "Own participation" ON game_participants FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Participant chat" ON chat_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM game_participants WHERE game_id = chat_messages.game_id AND user_id = auth.uid())
);
CREATE POLICY "Own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Join/leave functions
CREATE OR REPLACE FUNCTION join_game(game_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO game_participants (game_id, user_id) VALUES (game_uuid, auth.uid());
  UPDATE games SET current_players = current_players + 1 WHERE id = game_uuid;
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION leave_game(game_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM game_participants WHERE game_id = game_uuid AND user_id = auth.uid();
  UPDATE games SET current_players = current_players - 1 WHERE id = game_uuid;
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('game-images', 'game-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Public read images" ON storage.objects FOR SELECT USING (bucket_id IN ('game-images', 'avatars'));
CREATE POLICY "Auth upload" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Real-time
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE game_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
