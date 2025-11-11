-- Add pickleball default duration to system config
-- This prevents the sport default override issue for pickleball games

INSERT INTO system_config (key, value, description, category, is_public) 
VALUES ('sport_pickleball_duration', '90', 'Default pickleball game duration in minutes', 'sport_defaults', true)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();
