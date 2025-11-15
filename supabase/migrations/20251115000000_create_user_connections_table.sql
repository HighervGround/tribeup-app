-- Create user connections table for friend/follow system
-- This enables social features like following users and seeing friends' activities

CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent self-following and duplicate connections
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_connection UNIQUE (follower_id, following_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_connections_follower ON user_connections(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_following ON user_connections(following_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON user_connections(status);
CREATE INDEX IF NOT EXISTS idx_user_connections_created_at ON user_connections(created_at DESC);

-- Enable RLS
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view connections where they are the follower or following
CREATE POLICY "Users can view their own connections" ON user_connections
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Users can create connections (follow others)
CREATE POLICY "Users can create connections" ON user_connections
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can update their own connections (accept/decline/block)
CREATE POLICY "Users can update their connections" ON user_connections
  FOR UPDATE USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Users can delete their own connections (unfollow)
CREATE POLICY "Users can delete their connections" ON user_connections
  FOR DELETE USING (auth.uid() = follower_id);

-- Create a view for friend suggestions (users who participate in same games)
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

-- Enable RLS on the view
ALTER VIEW friend_suggestions SET (security_barrier = true);

-- Grant SELECT access to authenticated users
GRANT SELECT ON friend_suggestions TO authenticated;

-- Create a function to get mutual friends count
CREATE OR REPLACE FUNCTION get_mutual_friends(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  mutual_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mutual_count
  FROM user_connections uc1
  JOIN user_connections uc2 ON uc1.following_id = uc2.following_id
  WHERE uc1.follower_id = auth.uid()
    AND uc2.follower_id = target_user_id
    AND uc1.following_id != auth.uid()
    AND uc1.following_id != target_user_id;

  RETURN mutual_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to follow/unfollow users
CREATE OR REPLACE FUNCTION follow_user(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if connection already exists
  IF EXISTS (
    SELECT 1 FROM user_connections
    WHERE follower_id = auth.uid() AND following_id = target_user_id
  ) THEN
    -- Unfollow: delete the connection
    DELETE FROM user_connections
    WHERE follower_id = auth.uid() AND following_id = target_user_id;

    result := json_build_object('action', 'unfollowed', 'success', true);
  ELSE
    -- Follow: create new connection
    INSERT INTO user_connections (follower_id, following_id, status)
    VALUES (auth.uid(), target_user_id, 'accepted');

    result := json_build_object('action', 'followed', 'success', true);
  END IF;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('action', 'error', 'success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_connections_updated_at
  BEFORE UPDATE ON user_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
