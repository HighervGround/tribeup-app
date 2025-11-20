-- Fix friend_suggestions view to compute display_name correctly
-- This migration updates the view to properly compute display_name from full_name, username, or email

CREATE OR REPLACE VIEW friend_suggestions AS
WITH user_games AS (
  SELECT DISTINCT gp.user_id, gp.game_id
  FROM game_participants gp
  WHERE gp.user_id != auth.uid()
),
common_games AS (
  SELECT
    ug.user_id,
    COUNT(*) as common_games_count,
    array_agg(DISTINCT ug.game_id) as shared_games
  FROM user_games ug
  WHERE ug.game_id IN (
    SELECT game_id FROM game_participants WHERE user_id = auth.uid()
  )
  GROUP BY ug.user_id
  HAVING COUNT(*) >= 1
)
SELECT
  u.id,
  COALESCE(NULLIF(u.full_name, ''), u.username, split_part(u.email, '@', 1)) AS display_name,
  u.username,
  u.avatar_url,
  u.bio,
  cg.common_games_count,
  cg.shared_games,
  CASE WHEN uc.follower_id IS NOT NULL THEN true ELSE false END as is_following
FROM common_games cg
JOIN users u ON u.id = cg.user_id
LEFT JOIN user_connections uc ON uc.follower_id = auth.uid() AND uc.following_id = u.id
WHERE u.id != auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM user_connections
    WHERE (follower_id = auth.uid() AND following_id = u.id)
     OR (follower_id = u.id AND following_id = auth.uid() AND status = 'blocked')
  )
ORDER BY cg.common_games_count DESC, u.created_at DESC
LIMIT 20;

-- Ensure RLS is enabled on the view
ALTER VIEW friend_suggestions SET (security_barrier = true);

-- Grant SELECT access to authenticated users (idempotent)
GRANT SELECT ON friend_suggestions TO authenticated;



