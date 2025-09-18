-- Create system configuration table for runtime configurable settings
CREATE TABLE IF NOT EXISTS public.system_config (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    is_public BOOLEAN DEFAULT false, -- Whether this config can be read by clients
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Create policies - only admins can modify, public configs can be read by all
CREATE POLICY "Admins can manage all system config" ON public.system_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can read public system config" ON public.system_config
    FOR SELECT USING (is_public = true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_config_category ON public.system_config(category);
CREATE INDEX IF NOT EXISTS idx_system_config_is_public ON public.system_config(is_public);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_system_config_updated_at
    BEFORE UPDATE ON public.system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_system_config_updated_at();

-- Insert default system configurations
INSERT INTO public.system_config (key, value, description, category, is_public) VALUES
-- Business Rules
('game_edit_restriction_hours', '2', 'Hours before game start when editing is restricted', 'business_rules', true),
('game_deletion_restriction_hours', '4', 'Hours before game start when deletion is restricted', 'business_rules', true),
('max_players_per_game', '50', 'Maximum number of players allowed per game', 'business_rules', true),
('min_game_duration_minutes', '30', 'Minimum game duration in minutes', 'business_rules', true),
('max_game_duration_minutes', '480', 'Maximum game duration in minutes (8 hours)', 'business_rules', true),

-- Notification Settings
('notification_daily_limit', '10', 'Maximum notifications per user per day', 'notifications', true),
('notification_quiet_hours_start', '22:00', 'Start of quiet hours (no notifications)', 'notifications', true),
('notification_quiet_hours_end', '08:00', 'End of quiet hours', 'notifications', true),
('game_reminder_hours_before', '24', 'Hours before game to send reminder', 'notifications', true),

-- Location Settings
('nearby_games_radius_km', '25', 'Default radius for nearby games search', 'location', true),
('venue_search_radius_km', '50', 'Default radius for venue search', 'location', true),
('location_precision_decimal_places', '6', 'Decimal places for location coordinates', 'location', false),

-- Weather Settings
('weather_forecast_window_hours', '4', 'Hours window around game time for weather analysis', 'weather', true),
('weather_update_cache_minutes', '60', 'Minutes to cache weather data', 'weather', false),
('weather_rain_threshold_mm', '0.1', 'Rain threshold for outdoor activity warnings', 'weather', true),
('weather_wind_threshold_mph', '15', 'Wind speed threshold for outdoor activity warnings', 'weather', true),

-- Performance Settings
('presence_heartbeat_interval_seconds', '30', 'Seconds between presence heartbeat updates', 'performance', false),
('profile_check_timeout_seconds', '5', 'Timeout for profile checks', 'performance', false),
('api_rate_limit_per_minute', '100', 'API requests per minute per user', 'performance', false),

-- Feature Flags
('enable_weather_integration', 'true', 'Enable weather API integration', 'features', true),
('enable_push_notifications', 'true', 'Enable push notifications', 'features', true),
('enable_venue_recommendations', 'true', 'Enable venue recommendation system', 'features', true),
('enable_skill_matching', 'false', 'Enable skill-based player matching', 'features', true),
('enable_game_chat', 'true', 'Enable in-game chat functionality', 'features', true),

-- Sport-specific defaults
('default_basketball_duration', '90', 'Default basketball game duration in minutes', 'sport_defaults', true),
('default_soccer_duration', '120', 'Default soccer game duration in minutes', 'sport_defaults', true),
('default_tennis_duration', '60', 'Default tennis game duration in minutes', 'sport_defaults', true),
('default_volleyball_duration', '90', 'Default volleyball game duration in minutes', 'sport_defaults', true),

-- UI/UX Settings
('default_games_per_page', '20', 'Default number of games to show per page', 'ui', true),
('map_default_zoom_level', '12', 'Default zoom level for maps', 'ui', true),
('quick_time_slots', '["09:00", "12:00", "15:00", "17:00", "18:00", "19:00", "20:00", "21:00"]', 'Quick time slot options for game creation', 'ui', true)

ON CONFLICT (key) DO NOTHING;

-- Create helper function to get config values with type casting
CREATE OR REPLACE FUNCTION get_system_config(config_key TEXT, default_value TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    SELECT value::TEXT INTO result
    FROM public.system_config
    WHERE key = config_key;
    
    IF result IS NULL THEN
        RETURN default_value;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get config as integer
CREATE OR REPLACE FUNCTION get_system_config_int(config_key TEXT, default_value INTEGER DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    result INTEGER;
BEGIN
    SELECT (value::TEXT)::INTEGER INTO result
    FROM public.system_config
    WHERE key = config_key;
    
    IF result IS NULL THEN
        RETURN default_value;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get config as boolean
CREATE OR REPLACE FUNCTION get_system_config_bool(config_key TEXT, default_value BOOLEAN DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    result BOOLEAN;
BEGIN
    SELECT (value::TEXT)::BOOLEAN INTO result
    FROM public.system_config
    WHERE key = config_key;
    
    IF result IS NULL THEN
        RETURN default_value;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get config as JSONB
CREATE OR REPLACE FUNCTION get_system_config_json(config_key TEXT, default_value JSONB DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT value INTO result
    FROM public.system_config
    WHERE key = config_key;
    
    IF result IS NULL THEN
        RETURN default_value;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
