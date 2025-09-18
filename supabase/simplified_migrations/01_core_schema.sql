-- TribeUp Social Sports App - Simplified Core Schema Migration
-- This consolidates the initial schema, user stats, and core functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis" CASCADE;

-- Users table with all essential fields
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  preferred_sports TEXT[],
  stats JSONB DEFAULT '{}',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  reputation_score INTEGER DEFAULT 100,
  elo_rating INTEGER DEFAULT 1200,
  games_played INTEGER DEFAULT 0,
  games_hosted INTEGER DEFAULT 0,
  total_play_time_minutes INTEGER DEFAULT 0,
  favorite_sport TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table with all features
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  sport TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER DEFAULT 60, -- minutes
  cost TEXT DEFAULT 'FREE',
  max_players INTEGER NOT NULL,
  current_players INTEGER DEFAULT 0,
  description TEXT,
  image_url TEXT,
  skill_level TEXT DEFAULT 'mixed' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'competitive', 'mixed')),
  min_elo_rating INTEGER,
  max_elo_rating INTEGER,
  min_reputation INTEGER DEFAULT 70,
  competitive_mode BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern JSONB,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game participants with enhanced tracking
CREATE TABLE IF NOT EXISTS game_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'joined' CHECK (status IN ('joined', 'left', 'completed', 'no_show')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  play_time_minutes INTEGER DEFAULT 0,
  rating INTEGER, -- 1-5 star rating for the game
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Waitlist system
CREATE TABLE IF NOT EXISTS game_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User presence tracking
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  current_game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING gin(to_tsvector('english', location));

CREATE INDEX IF NOT EXISTS idx_games_creator_id ON games(creator_id);
CREATE INDEX IF NOT EXISTS idx_games_sport ON games(sport);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);
CREATE INDEX IF NOT EXISTS idx_games_location ON games USING gin(to_tsvector('english', location));
CREATE INDEX IF NOT EXISTS idx_games_skill_level ON games(skill_level);
CREATE INDEX IF NOT EXISTS idx_games_archived ON games(is_archived) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_games_competitive ON games(competitive_mode) WHERE competitive_mode = true;
CREATE INDEX IF NOT EXISTS idx_games_geospatial ON games USING gist(ll_to_earth(latitude, longitude)) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_status ON game_participants(status);

CREATE INDEX IF NOT EXISTS idx_waitlist_game_id ON game_waitlist(game_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_user_id ON game_waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_position ON game_waitlist(game_id, position);

CREATE INDEX IF NOT EXISTS idx_chat_messages_game_id ON chat_messages(game_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_user_presence_online ON user_presence(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);
