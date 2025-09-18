-- TribeUp Social Sports App - Storage and Real-time Features
-- This consolidates storage buckets, real-time subscriptions, and additional features

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('game-images', 'game-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for game images
CREATE POLICY "Anyone can view game images" ON storage.objects
  FOR SELECT USING (bucket_id = 'game-images');

CREATE POLICY "Authenticated users can upload game images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'game-images' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own game images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'game-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own game images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'game-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Enable real-time for tables that need it
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE game_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE game_waitlist;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- Create venues table for enhanced location features
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  venue_type TEXT NOT NULL, -- 'indoor', 'outdoor', 'mixed'
  sports TEXT[] NOT NULL, -- supported sports
  facilities JSONB DEFAULT '{}', -- parking, restrooms, etc.
  rating DECIMAL(3, 2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  contact_info JSONB DEFAULT '{}',
  operating_hours JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venue ratings table
CREATE TABLE IF NOT EXISTS venue_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  facilities_rating INTEGER CHECK (facilities_rating >= 1 AND facilities_rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5),
  parking_rating INTEGER CHECK (parking_rating >= 1 AND parking_rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, user_id)
);

-- Location notification preferences
CREATE TABLE IF NOT EXISTS location_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN DEFAULT true,
  radius_km INTEGER DEFAULT 10,
  preferred_sports TEXT[] DEFAULT '{}',
  notification_frequency TEXT DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'hourly', 'daily')),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  max_notifications_per_day INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game notifications tracking
CREATE TABLE IF NOT EXISTS game_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id, notification_type)
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_venues_location ON venues USING gist(ll_to_earth(latitude, longitude));
CREATE INDEX IF NOT EXISTS idx_venues_sports ON venues USING gin(sports);
CREATE INDEX IF NOT EXISTS idx_venues_type ON venues(venue_type);
CREATE INDEX IF NOT EXISTS idx_venues_rating ON venues(rating DESC);

CREATE INDEX IF NOT EXISTS idx_venue_ratings_venue_id ON venue_ratings(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_ratings_user_id ON venue_ratings(user_id);

CREATE INDEX IF NOT EXISTS idx_location_prefs_user_id ON location_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_game_notifications_user_id ON game_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_game_notifications_game_id ON game_notifications(game_id);

-- RLS for new tables
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for new tables
CREATE POLICY "Anyone can view venues" ON venues FOR SELECT USING (true);
CREATE POLICY "Anyone can view venue ratings" ON venue_ratings FOR SELECT USING (true);
CREATE POLICY "Users can rate venues" ON venue_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their ratings" ON venue_ratings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their notification preferences" ON location_notification_preferences 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their game notifications" ON game_notifications 
  FOR SELECT USING (auth.uid() = user_id);

-- Function to update venue ratings
CREATE OR REPLACE FUNCTION update_venue_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE venues 
  SET 
    rating = (
      SELECT AVG(overall_rating)::DECIMAL(3,2) 
      FROM venue_ratings 
      WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)
    ),
    rating_count = (
      SELECT COUNT(*) 
      FROM venue_ratings 
      WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.venue_id, OLD.venue_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_venue_rating
  AFTER INSERT OR UPDATE OR DELETE ON venue_ratings
  FOR EACH ROW EXECUTE FUNCTION update_venue_rating();
