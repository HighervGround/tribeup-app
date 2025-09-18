-- Add duration column to games table
-- This column stores the game duration in minutes

ALTER TABLE games ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60;

-- Add comment for documentation
COMMENT ON COLUMN games.duration IS 'Game duration in minutes, defaults to 60 minutes';

-- Update existing games to have default duration if null
UPDATE games SET duration = 60 WHERE duration IS NULL;
