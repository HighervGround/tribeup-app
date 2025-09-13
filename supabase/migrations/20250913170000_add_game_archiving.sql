-- Add archived field to games table
ALTER TABLE games ADD COLUMN archived BOOLEAN DEFAULT FALSE;

-- Add index for better performance when filtering archived games
CREATE INDEX idx_games_archived ON games(archived);

-- Add index for date-based queries (for auto-archiving old games)
CREATE INDEX idx_games_date_archived ON games(date, archived);

-- Function to auto-archive games that are more than 7 days past their date
CREATE OR REPLACE FUNCTION auto_archive_old_games()
RETURNS void AS $$
BEGIN
  UPDATE games 
  SET archived = TRUE 
  WHERE archived = FALSE 
    AND date < (CURRENT_DATE - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run auto-archiving (this would need to be set up in production)
-- For now, we'll just have the function available to call manually or via cron
