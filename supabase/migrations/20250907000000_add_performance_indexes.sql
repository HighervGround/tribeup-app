-- Performance optimization indexes for TribeUp scaling
-- Created: 2025-01-07

-- Games table indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_games_date_sport ON games(date, sport);
CREATE INDEX IF NOT EXISTS idx_games_location_search ON games USING gin(to_tsvector('english', location));
CREATE INDEX IF NOT EXISTS idx_games_created_at_desc ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_sport_date_time ON games(sport, date, time);

-- User profiles indexes for user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Public RSVPs indexes for anonymous user tracking (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'public_rsvps') THEN
        CREATE INDEX IF NOT EXISTS idx_public_rsvps_game_id ON public_rsvps(game_id);
        CREATE INDEX IF NOT EXISTS idx_public_rsvps_email ON public_rsvps(email);
    END IF;
END $$;

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_games_active_search ON games(date, sport, location) WHERE date >= CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_games_location_date_active ON games(location, date) WHERE date >= CURRENT_DATE;
