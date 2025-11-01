-- Create chat_messages_with_author view for efficient message loading
-- This view joins chat_messages with user_public_profile to avoid N+1 queries
CREATE OR REPLACE VIEW chat_messages_with_author AS
SELECT 
  cm.id,
  cm.game_id,
  cm.user_id,
  cm.message,
  cm.created_at,
  up.display_name,
  up.username,
  up.avatar_url,
  up.full_name
FROM chat_messages cm
LEFT JOIN user_public_profile up ON cm.user_id = up.id;

-- Grant access to authenticated and anonymous users
GRANT SELECT ON chat_messages_with_author TO authenticated;
GRANT SELECT ON chat_messages_with_author TO anon;

-- Add comment
COMMENT ON VIEW chat_messages_with_author IS 
  'View that joins chat_messages with user_public_profile to provide author information in a single query, avoiding N+1 queries.';

