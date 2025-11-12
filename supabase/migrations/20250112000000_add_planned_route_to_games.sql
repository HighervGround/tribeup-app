-- Add planned_route column to games table to store route planning data
-- This will store the enhanced route analysis data from the Strava clone integration

ALTER TABLE games 
ADD COLUMN IF NOT EXISTS planned_route JSONB;

-- Add comment to document the column
COMMENT ON COLUMN games.planned_route IS 'Stores route planning data including path coordinates, elevation analysis, difficulty, and other route metrics';

-- Create an index for better query performance on route data
CREATE INDEX IF NOT EXISTS idx_games_planned_route ON games USING GIN (planned_route);

-- Update the updated_at trigger to include the new column
-- (This assumes you have an updated_at trigger function already)
