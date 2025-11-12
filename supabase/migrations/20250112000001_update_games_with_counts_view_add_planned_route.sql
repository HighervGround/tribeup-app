-- Update games_with_counts view to include planned_route column
-- This fixes the issue where planned_route data wasn't accessible through the view

-- Drop the existing view
DROP VIEW IF EXISTS games_with_counts;

-- Recreate the view with planned_route included
CREATE VIEW games_with_counts AS
SELECT 
  g.*,
  g.planned_route,  -- Add the planned_route column
  COALESCE(pc.participant_count, 0) as current_players,
  COALESCE(wc.waitlist_count, 0) as waitlist_count
FROM games g
LEFT JOIN (
  SELECT 
    game_id, 
    COUNT(*) as participant_count
  FROM game_participants 
  WHERE status = 'joined'
  GROUP BY game_id
) pc ON g.id = pc.game_id
LEFT JOIN (
  SELECT 
    game_id, 
    COUNT(*) as waitlist_count
  FROM game_waitlist 
  GROUP BY game_id
) wc ON g.id = wc.game_id;

-- Grant appropriate permissions
GRANT SELECT ON games_with_counts TO authenticated;
GRANT SELECT ON games_with_counts TO anon;
